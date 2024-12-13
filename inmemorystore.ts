import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, RemoveMessage } from "@langchain/core/messages";
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

const inMemoryStore = new InMemoryStore();

// Fake DDL and metadata
const fakeDDL = `
  CREATE TABLE sales (
    id INT,
    year INT,
    revenue DECIMAL,
    profit DECIMAL,
    discount DECIMAL,
    tax DECIMAL,
  );
`;

const fakeMetadata = {
  tables: {
    sales: {
      columns: ["id", "year", "revenue", "profit", "discount", "tax"],
    },
  },
};

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

async function determineQuestionType(
  question: HumanMessage
): Promise<"conversational" | "metadata" | "need clarification"> {
  const keywords = Object.values(fakeMetadata.tables).flatMap(
    (table) => table.columns
  );

  const questionContent = (question.content as string).toLowerCase();
  const response = await model.invoke([
    {
      type: "system",
      content: `
      Determine if the user input: "${questionContent}" is related to the following database schema and metadata:
       ${fakeDDL} ${JSON.stringify(
        fakeMetadata
      )} or more related to conversational tone or day to day chat. 
       If it matches exactly then reply with 'metadata'. 
       If not, then it is about finding the closest possible match than exact value 
       eg: discount is more closely related to "id", "year", "revenue", "profit" than any normal day to day conversation
       or any greeting but it is still not exact match so it would be 'need clarification'. 
       Reply with 'conversational',  'metadata' or 'need clarification' and no other words`,
    },
  ]);
  const questionTypeResponse = response.content.toString();
  if (questionTypeResponse === "metadata") {
    return "metadata";
  } else if (questionTypeResponse === "conversational") {
    return "conversational";
  }
  return "need clarification";
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
  const namespace = ["memories", config.configurable?.userId];
  const memories = await store.search(namespace);
  const info = memories.map((d) => d.value.data).join("\n");
  const systemMsg = `You are a helpful assistant with access to the following 
  database schema and metadata: ${fakeDDL} ${JSON.stringify(
    fakeMetadata
  )}. User info: ${info}. \nSummary: ${state.summary}`;

  const lastMessage = state.messages[state.messages.length - 1];
  await store.put(namespace, uuidv4(), { data: lastMessage.content });
  // console.log("lastMessage.content", lastMessage.content);
  const questionType = await determineQuestionType(lastMessage);
  console.log("**", questionType, "**\n");
  const systemMsgBasedonQuestionType = getPrompt(questionType);
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
  const deleteMessages = messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id ?? "" }));
  if (typeof response.content !== "string") {
    throw new Error("Expected a string response from the model");
  }
  return { summary: response.content, messages: deleteMessages };
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

// let config = { configurable: { thread_id: uuidv4(), userId: "1" } };
let config = { configurable: { thread_id: "Dec-13", userId: "1" } };

rl.question("\nInitial query: ", async (initialInput) => {
  const initialMessage = new HumanMessage(initialInput);
  const initialState = await graph.invoke(
    {
      messages: [initialMessage],
    },
    config
  );

  console.log(
    "AI:",
    initialState.messages[initialState.messages.length - 1].content
  );

  askUser(initialState);
});

async function askUser(finalState: typeof StateAnnotation.State) {
  const userInput = await new Promise<string>((resolve) => {
    rl.question("\nNext query: ", resolve);
  });

  const userMessage = new HumanMessage(userInput);
  const nextState = await graph.invoke(
    {
      messages: [...finalState.messages, userMessage],
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
    askUser(nextState);
  }
}
