import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RetrievalQAChain } from "langchain/chains";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { GoogleGenerativeAIEmbeddings } from "langchain/embeddings/googleai";
import { GoogleGenerativeAI as GoogleAILLM } from "langchain/llms/googleai";
import { PineconeClient } from "@pinecone-database/pinecone";
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const initPinecone = async () => {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });
  return pinecone;
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, fileId, query } = req.body;

    if (action === 'index') {
      try {
        const filePath = path.join(process.cwd(), 'temp', 'document.pdf');
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();

        const pinecone = await initPinecone();
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        const embeddings = new GoogleGenerativeAIEmbeddings({
          modelName: "embedding-001",
          apiKey: process.env.GOOGLE_API_KEY,
        });

        await PineconeStore.fromDocuments(docs, embeddings, { pineconeIndex: index });

        res.status(200).json({ message: 'Document indexed successfully' });
      } catch (error) {
        console.error('Error indexing document:', error);
        res.status(500).json({ error: 'Failed to index document' });
      }
    } else if (action === 'query') {
      try {
        const pinecone = await initPinecone();
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        const embeddings = new GoogleGenerativeAIEmbeddings({
          modelName: "embedding-001",
          apiKey: process.env.GOOGLE_API_KEY,
        });

        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

        const model = new GoogleAILLM({
          modelName: "gemini-pro",
          apiKey: process.env.GOOGLE_API_KEY,
        });

        const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

        const response = await chain.call({
          query: query,
        });

        res.status(200).json({ result: response.text });
      } catch (error) {
        console.error('Error performing RAG:', error);
        res.status(500).json({ error: 'Failed to perform RAG' });
      }
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    res.status(405).end();
  }
}