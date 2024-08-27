import { Message as VercelChatMessage, StreamingTextResponse, createStreamDataTransformer } from 'ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Pinecone } from "@pinecone-database/pinecone";
import { getVectorStore } from "@/utils/vectorstore";

export const dynamic = 'force-dynamic';

const formatMessage = (message) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
==============================
Context: {context}
==============================
Current conversation:
{chat_history}

user: {question}
assistant:`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;

    // Initialize Pinecone client
    const pineconeClient = new Pinecone();
    
    // Get vector store
    const vectorStore = await getVectorStore(pineconeClient);

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(currentMessageContent, 3);

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const parser = new HttpResponseOutputParser();

    const chain = RunnableSequence.from([
      {
        question: (input) => input.question,
        chat_history: (input) => input.chat_history,
        context: (input) => input.relevantDocs.map(doc => doc.pageContent).join('\n'),
      },
      prompt,
      async (promptValue) => {
        const result = await model.generateContentStream(promptValue);
        return result.stream;
      },
      parser,
    ]);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join('\n'),
      question: currentMessageContent,
      relevantDocs: relevantDocs,
    });

    return new StreamingTextResponse(
      stream.pipeThrough(createStreamDataTransformer()),
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}