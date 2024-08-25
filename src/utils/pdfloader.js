
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from 'path';
import fs from 'fs';

export async function getChunkedDocsFromPDF() {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    const files = fs.readdirSync(tempDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    const mostRecentFile = pdfFiles.sort((a, b) => {
      return fs.statSync(path.join(tempDir, b)).mtime.getTime() - 
             fs.statSync(path.join(tempDir, a)).mtime.getTime();
    })[0];

    if (!mostRecentFile) {
      return NextResponse.json({ error: 'No PDF file found in temp directory' }, { status: 400 });
    }

    const filePath = path.join(tempDir, mostRecentFile);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    // From the docs https://www.pinecone.io/learn/chunking-strategies/
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);

    return chunkedDocs;
  } catch (e) {
    console.error(e);
    throw new Error("PDF docs chunking failed !");
  }
}
