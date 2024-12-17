//inmemorystore.ts
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  RemoveMessage,
  AIMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  StateGraph,
  START,
  MemorySaver,
  LangGraphRunnableConfig,
  messagesStateReducer,
  InMemoryStore,
  END,
} from "@langchain/langgraph";
import readline from "readline";
import { getPrompt } from "./prompt";
import { getMergedMetadata } from "./merged_metadata";

const inMemoryStore = new InMemoryStore();

const metricDefinition = getMergedMetadata();

const StateAnnotation = Annotation.Root({
  messages: Annotation<HumanMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "",
  }),
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

async function isItEnglish(
  humanMessage: HumanMessage,
  aiMessage: AIMessage
): Promise<"english" | "gibberish"> {
  const humanMessageContent = (humanMessage.content as string).toLowerCase();
  const aiMessageContent = (aiMessage.content as string).toLowerCase();
  const response = await model.invoke([
    {
      type: "system",
      content: `
      Instruction: Only accept english language in query and no other language.
      Determine if the user input: "${humanMessageContent}" is English or not based on input as well the previous context of conversation: "${aiMessageContent}"
      Reply with 'english', or 'gibberish' and no other words`,
    },
  ]);
  const questionTypeResponse = response.content.toString();
  return questionTypeResponse as "english" | "gibberish";
}

function findLastValidAIMessage(messages: AIMessage[]) {
  const targetMessage =
    "System accepts only English queries and it cannot be changed yet.";
  let lastAIMessage = null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    // Only consider AIMessage
    if (message instanceof AIMessage) {
      if (message.content !== targetMessage) {
        lastAIMessage = message;
        break;
      }
    }
  }

  return lastAIMessage;
}

const callModel = async (
  state: typeof StateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<{ messages: any; summary: string }> => {
  const store = config.store;
  if (!store) {
    throw new Error("store is required when compiling the graph");
  }
  if (!config.configurable?.userId) {
    throw new Error("userId is required in the config");
  }

  const lastHumanMessage = state.messages[state.messages.length - 1];
  let lastAIMessage =
    state.messages.length >= 2
      ? state.messages[state.messages.length - 2]
      : new AIMessage({ id: uuidv4(), content: "" });

  if (
    lastAIMessage.content ===
    "System accepts only English queries and it cannot be changed yet."
  ) {
    lastAIMessage.content =
      findLastValidAIMessage(state.messages)?.content || "";
  }

  if ((await isItEnglish(lastHumanMessage, lastAIMessage)) === "gibberish") {
    const aiMessage = new AIMessage({
      id: uuidv4(),
      content:
        "System accepts only English queries and it cannot be changed yet.",
    });
    return {
      messages: [aiMessage],
      summary: "",
    };
  }
  console.log("\n----------------", lastAIMessage.content);
  const namespace = ["memories", config.configurable?.userId];
  const memories = await store.search(namespace);
  const info = memories.map((d) => d.value.data).join("\n");
  const systemMsg = `You are a helpful assistant with access to the following 
  database schema and metadata: ${metricDefinition}. \nUser query: ${info}. \nSummary: ${state.summary}`;

  await store.put(namespace, uuidv4(), { data: lastHumanMessage.content });
  const systemMsgBasedonQuestionType = getPrompt();

  const response = await model.invoke([
    { type: "system", content: systemMsg + systemMsgBasedonQuestionType },
    ...state.messages,
  ]);
  const summary = state.summary;
  return { messages: [response], summary };
};

const shouldContinue = (
  state: typeof StateAnnotation.State
): "summarize_conversation" | typeof END => {
  const messages = state.messages;
  if (messages.length > 6) {
    return "summarize_conversation";
  }
  return END;
};

async function summarizeConversation(
  state: typeof StateAnnotation.State
): Promise<{ messages: any[]; summary: string }> {
  const { summary, messages } = state;
  let summaryMessage: string;
  if (summary) {
    summaryMessage =
      `This is summary of the conversation to date: ${summary}\n\n` +
      "Extend the summary by taking into account the new messages above, but keep the summary one line";
  } else {
    summaryMessage =
      "Create a one liner summary to summarize the conversation above:";
  }

  const allMessages = [
    ...messages,
    new HumanMessage({
      id: uuidv4(),
      content: summaryMessage,
    }),
  ];
  const response = await model.invoke(allMessages);
  // const deleteMessages = messages
  //   .slice(0, -2)
  //   .map((m) => new RemoveMessage({ id: m.id ?? "" }));
  if (typeof response.content !== "string") {
    throw new Error("Expected a string response from the model");
  }
  return { summary: response.content, messages: messages };
}

const builder = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addNode("summarize_conversation", summarizeConversation)
  .addEdge(START, "call_model")
  .addConditionalEdges("call_model", shouldContinue)
  .addEdge("summarize_conversation", END);

const graph = builder.compile({
  checkpointer: new MemorySaver(),
  store: inMemoryStore,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let config = { configurable: { thread_id: uuidv4(), userId: "1" } };

rl.question("\nUser: ", async (initialInput) => {
  const initialMessage = new HumanMessage(initialInput);
  const initialState = await graph.invoke(
    {
      messages: [initialMessage],
    },
    config
  );

  console.log(
    "Inteliome (JS):",
    initialState.messages[initialState.messages.length - 1].content
  );

  askUser(initialState);
});

async function askUser(finalState: typeof StateAnnotation.State) {
  const userInput = await new Promise<string>((resolve) => {
    rl.question("\nUser: ", resolve);
  });

  const userMessage = new HumanMessage(userInput);
  const nextState = await graph.invoke(
    {
      messages: [...finalState.messages, userMessage],
    },
    config
  );

  console.log(
    "Inteliome (JS):",
    nextState.messages[nextState.messages.length - 1].content
  );

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
