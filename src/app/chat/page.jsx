'use client'
import { useState } from 'react';
import { useCompletion } from 'ai/react';
import axios from 'axios';

export default function Chat() {
  const [fileId, setFileId] = useState('');
  const [isFileDownloaded, setIsFileDownloaded] = useState(false);
  const [isFileIndexed, setIsFileIndexed] = useState(false);
  const { completion, complete } = useCompletion({
    api: '/api',
  });

  
  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/download', { fileId });
      console.log(response);
      if (response.status === 200) {
        setIsFileDownloaded(true);
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to download file');
    }
  };

  const handleIndex = async () => {
    try {
      const response = await axios.post('/api', { action: 'index', fileId });
      if (response.status === 200) {
        setIsFileIndexed(true);
      } else {
        throw new Error('Failed to index file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to index file');
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    const query = e.target.query.value;
    await complete(JSON.stringify({ action: 'query', query }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RAG with Google Drive and Pinecone</h1>
      <form onSubmit={handleDownload} className="mb-4">
        <input
          type="text"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="Enter Google Drive File ID"
          className="border text-black p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Download File
        </button>
      </form>
      {isFileDownloaded && !isFileIndexed && (
        <button onClick={handleIndex} className="bg-green-500 text-white p-2 rounded mb-4">
          Index Document
        </button>
      )}
      {isFileIndexed && (
        <form onSubmit={handleQuery} className="mb-4">
          <input
            type="text"
            name="query"
            placeholder="Enter your question"
            className="border p-2 mr-2"
          />
          <button type="submit" className="bg-purple-500 text-white p-2 rounded">
            Ask Question
          </button>
        </form>
      )}
      {completion && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Answer:</h2>
          <p>{completion}</p>
        </div>
      )}
    </div>
  );
}