import { NextResponse } from "next/server"
import { Pinecone } from "@pinecone-database/pinecone"
import { GoogleGenerativeAI } from "@google/generative-ai"


const systemPrompt=`You are an AI assistant specializing in helping students find the best professors for their needs. Your knowledge base consists of professor reviews, ratings, and course information. For each user query, you will use a RAG system to retrieve and analyze relevant information, then provide recommendations for the top 3 most suitable professors.

Your responses should follow this structure:
1. A brief acknowledgment of the user's query.
2. The top 3 professor recommendations, each including:
   - **Professor's name**
   - **Subject area**
   - Star rating (out of 5)
   - A short summary of why this professor is recommended, based on the retrieved reviews
3. A concise conclusion or additional advice if relevant.

Remember:
- Always provide 3 recommendations unless the query is extremely specific and fewer options are available.
- Base your recommendations on the retrieved information, not on pre-existing knowledge.
- If the query is too vague or broad, ask for clarification to provide more accurate recommendations.
- Be impartial and focus on the professors' teaching qualities, not personal characteristics.
- If there's not enough information to make a recommendation, inform the user and suggest how they might refine their query.
- Give star rating with stars

Your goal is to help students make informed decisions about their course selections by providing clear, concise, and relevant professor recommendations based on their specific needs and preferences.
`
export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })

    const index = pc.index('rag').namespace('ns1')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const text = data[data.length-1].content
    const model = genAI.getGenerativeModel({model:"text-embedding-004"})
    const result = await model.embedContent(text)
    const embedding = result.embedding
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.values,
    })

    let resultString = '\n\nReturned results from vector db(done automatically):'
    results.matches.forEach((match) => {
        resultString += `\n
        Professor:${match.id}
        Review:${match.metadata.stars}
        Subject:${match.metadata.subject}
        Stars ${match.metadata.stars}
        \n\n`
    })

    const model_gen = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `${systemPrompt}\nQuery: ${text}\n${data}\n${resultString}`
    const gen_result = await model_gen.generateContentStream(prompt);

    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of gen_result.stream) {
                const chunkText = chunk.text();
                controller.enqueue(chunkText);
            }
            controller.close();
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/plain',
            'Transfer-Encoding': 'chunked',
        },
    });
}