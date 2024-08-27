
// import { PineconeClient } from "@pinecone-database/pinecone";
import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClientInstance = null;

// Create pineconeIndex if it doesn't exist
async function createIndex(client, indexName) {
  try {
    await client.createIndex({
      createRequest: {
        name: indexName,
        dimension: 1536,
        metric: "cosine",
      },
    });
    
    console.log("Index created !!");
  } catch (error) {
    console.error("error ", error);
    throw new Error("Index creation failed");
  }
}

// Initialize index and ready to be accessed.
async function initPineconeClient() {
  try {
    const pineconeClient = new Pinecone();
    
    const indexName = process.env.PINECONE_INDEX_NAME;

    const existingIndexes = await pineconeClient.listIndexes();

    if (!existingIndexes.indexes.includes(indexName)) {
      createIndex(pineconeClient, indexName);
    } else {
      console.log("Your index already exists. nice !!");
    }

    return pineconeClient;
  } catch (error) {
    console.error("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

export async function getPineconeClient() {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }

  return pineconeClientInstance;
}
