import { RetrievalQA } from "langchain/chains";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const initPinecone = async () => {
  const pinecone = new Pinecone();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });
  return pinecone;
};

export async function POST(req) {
  try {
    const { query } = await req.json();

    const pinecone = await initPinecone();
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const chain = RetrievalQA.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({
      query: query,
    });

    return NextResponse.json({ result: response.text }, { status: 200 });
  } catch (error) {
    console.error('Error performing RAG:', error);
    return NextResponse.json({ error: 'Failed to perform RAG' }, { status: 500 });
  }
}