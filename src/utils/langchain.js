import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { getVectorStore } from "./vectorstore";
import { getPineconeClient } from "./pineconeclient";
import {
  StreamingTextResponse,
  experimental_StreamData,
  LangChainStream,
} from "ai-stream-experimental";

export async function callChain({ question, chatHistory }) {
  try {
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");
    const pineconeClient = await getPineconeClient();
    const vectorStore = await getVectorStore(pineconeClient);
    const retriever = vectorStore.asRetriever();

    const { stream, handlers } = LangChainStream({
      experimental_streamData: true,
    });
    const data = new experimental_StreamData();

    const streamingModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      streaming: true,
      verbose: true,
      temperature: 0,
    });

    const nonStreamingModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      streaming: false,
      verbose: true,
      temperature: 0,
    });

    // Contextualize question
    const contextualizeQSystemPrompt = `Given a chat history and the latest user question
    which might reference context in the chat history, formulate a standalone question 
    which can be understood without the chat history. Do NOT answer the question, just
    reformulate it if needed and otherwise return it as is.`;

    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ["system", contextualizeQSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: nonStreamingModel,
      retriever,
      rephrasePrompt: contextualizeQPrompt,
    });

    // Answer question
    const qaSystemPrompt = `You are an assistant for question-answering tasks. Use
    the following pieces of retrieved context to answer the question. If you don't 
    know the answer, just say that you don't know. Use three sentences maximum and 
    keep the answer concise.

    {context}`;

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ["system", qaSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const questionAnswerChain = await createStuffDocumentsChain({
      llm: streamingModel,
      prompt: qaPrompt,
    });

    const ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: questionAnswerChain,
    });

    // Call the chain and handle the streaming response
    ragChain.invoke(
      {
        chat_history: chatHistory,
        input: sanitizedQuestion,
      },
      { callbacks: handlers }
    ).then(async (res) => {
      if (res.sourceDocuments) {
        const firstTwoDocuments = res.sourceDocuments.slice(0, 2);
        const pageContents = firstTwoDocuments.map(
          ({ pageContent }) => pageContent
        );
        data.append({
          sources: pageContents,
        });
      }
      data.close();
    }).catch((error) => {
      console.error("Error in chain execution:", error);
      data.append({ error: "An error occurred during processing." });
      data.close();
    });

    return new StreamingTextResponse(stream, {}, data);
  } catch (e) {
    console.error(e);
    throw new Error("Call chain method failed to execute successfully!!");
  }
}