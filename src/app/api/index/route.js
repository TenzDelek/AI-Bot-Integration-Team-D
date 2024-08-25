import { getChunkedDocsFromPDF } from "@/utils/pdfloader";
// import { getPineconeClient } from "@/utils/pineconeclient";
import { embedAndStoreDocs } from "@/utils/vectorstore";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";

export const POST = async (req) => {
try {
  const pineconeClient = new Pinecone();
  console.log("Preparing chunks from PDF file");
  const docs = await getChunkedDocsFromPDF();
  console.log(`Loading ${docs.length} chunks into pinecone...`);
  await embedAndStoreDocs(pineconeClient, docs);
  console.log("Data embedded and stored in pine-cone index");
  return NextResponse.json({ message: 'Document indexed successfully' }, { status: 200 });
} catch (error) {
  return NextResponse.json({ error: 'Failed to index document' }, { status: 500 });
}
}