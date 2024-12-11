import "dotenv/config";

import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import {
  Annotation,
  StateGraph,
  START,
  MemorySaver,
  LangGraphRunnableConfig,
  messagesStateReducer,
  InMemoryStore,
} from "@langchain/langgraph";
import readline from "readline";

const inMemoryStore = new InMemoryStore();

const StateAnnotation = Annotation.Root({
  messages: Annotation<HumanMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const callModel = async (
  state: typeof StateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<{ messages: any }> => {
  const store = config.store;
  if (!store) {
    throw new Error("store is required when compiling the graph");
  }
  if (!config.configurable?.userId) {
    throw new Error("userId is required in the config");
  }
  const namespace = ["memories", config.configurable?.userId];
  const memories = await store.search(namespace);
  const info = memories.map((d) => d.value.data).join("\n");
  const systemMsg = `You are a helpful assistant talking to the user. User info: ${info}`;

  const lastMessage = state.messages[state.messages.length - 1];
  await store.put(namespace, uuidv4(), { data: lastMessage.content });

  const response = await model.invoke([
    { type: "system", content: systemMsg },
    ...state.messages,
  ]);
  return { messages: response };
};

const builder = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model");

const graph = builder.compile({
  checkpointer: new MemorySaver(),
  store: inMemoryStore,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationCount = 0;
const maxConversations = 3;
let config = { configurable: { thread_id: "1", userId: "1" } };

rl.question("Enter your initial query: ", async (initialInput) => {
  const initialMessage = new HumanMessage(initialInput);
  const initialState = await graph.invoke(
    {
      messages: [initialMessage],
    },
    config
  );

  console.log(initialState.messages[initialState.messages.length - 1].content);

  askUser(initialState);
});

async function askUser(finalState: typeof StateAnnotation.State) {
  const userInput = await new Promise<string>((resolve) => {
    rl.question("Enter your next query: ", resolve);
  });

  const userMessage = new HumanMessage(userInput);
  const nextState = await graph.invoke(
    {
      messages: [...finalState.messages, userMessage],
    },
    config
  );

  console.log(nextState.messages[nextState.messages.length - 1].content);

  conversationCount++;
  if (conversationCount >= maxConversations) {
    conversationCount = 0;
    const newThreadId = (
      parseInt(config.configurable.thread_id) + 1
    ).toString();
    config.configurable.thread_id = newThreadId;
    console.log(`Switching thread to ${newThreadId}`);
  }

  const lowerCaseUserInput = userInput.toLowerCase();
  if (
    lowerCaseUserInput.includes("thank you") ||
    lowerCaseUserInput.includes("that's all")
  ) {
    rl.close();
  } else {
    askUser(nextState);
  }
}
