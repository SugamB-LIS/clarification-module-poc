import "dotenv/config";

import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inMemoryStore = new InMemoryStore();

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// NOTE: we're passing the Store param to the node
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

  // Store new memories if the user asks the model to remember
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    typeof lastMessage.content === "string" &&
    lastMessage.content.toLowerCase().includes("remember")
  ) {
    await store.put(namespace, uuidv4(), { data: lastMessage.content });
  }

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

async function startConversation(config: LangGraphRunnableConfig) {
  rl.question("Enter your initial query: ", async (initialInput) => {
    const initialState = await graph.invoke(
      {
        messages: [new HumanMessage(initialInput)],
      },
      config
    );

    console.log(
      initialState.messages[initialState.messages.length - 1].content
    );

    askUser(initialState, config);
  });
}

async function askUser(
  finalState: typeof StateAnnotation.State,
  config: LangGraphRunnableConfig
) {
  const userInput = await new Promise<string>((resolve) => {
    rl.question("Enter your next query: ", resolve);
  });

  const nextState = await graph.invoke(
    {
      messages: [...finalState.messages, new HumanMessage(userInput)],
    },
    config
  );

  console.log(nextState.messages[nextState.messages.length - 1].content);

  const lowerCaseUserInput = userInput.toLowerCase();
  if (
    lowerCaseUserInput.includes("thank you") ||
    lowerCaseUserInput.includes("that's all")
  ) {
    rl.close();
  } else {
    askUser(nextState, config);
  }
}

let config = { configurable: { thread_id: "1", userId: "1" } };
startConversation(config);
