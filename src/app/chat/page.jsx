'use client'
import { useState } from 'react';
import axios from 'axios';
import { MainChat } from '@/components/Chats';
export default function Chat() {
  const [fileId, setFileId] = useState('');
  const [isFileDownloaded, setIsFileDownloaded] = useState(true);
  const [isFileIndexed, setIsFileIndexed] = useState(true);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setIsDownloading(true);
    try {
      const response = await axios.post('/api/download', { fileId });
      if (response.status === 200) {
        setIsFileDownloaded(true);
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleIndex = async () => {
    setIsIndexing(true);
    try {
      const response = await axios.post('/api/index');
      if (response.status === 200) {
        setIsFileIndexed(true);
      } else {
        throw new Error('Failed to index file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to index file');
    } finally {
      setIsIndexing(false);
    }
  };

  // const handleQuery = async (e) => {
  //   e.preventDefault();
  //   setIsQuerying(true);
  //   try {
  //     const response = await axios.post('/api/query', { 
  //       messages: [{ role: 'user', content: query }]
  //     });
  //     setAnswer(response.data.result);
  //   } catch (error) {
  //     console.error('Error:', error);
  //     alert('Failed to get answer');
  //   } finally {
  //     setIsQuerying(false);
  //   }
  // };

  return (
    <div className=' flex mx-auto h-screen w-full items-center justify-center'>
    <div className=" flex-1 container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RAG with Google Drive and Pinecone</h1>
      <form onSubmit={handleDownload} className="mb-4">
        <input
          type="text"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="Enter Google Drive File ID"
          className="border text-black p-2 mr-2"
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded"
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading...' : 'Download File'}
        </button>
      </form>
      {isFileDownloaded && !isFileIndexed && (
        <button 
          onClick={handleIndex} 
          className="bg-green-500 text-white p-2 rounded mb-4"
          disabled={isIndexing}
        >
          {isIndexing ? 'Indexing...' : 'Index Document'}
        </button>
      )}
      {/* {isFileIndexed && (
        <form onSubmit={handleQuery} className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your question"
            className="border text-black p-2 mr-2"
          />
          <button 
            type="submit" 
            className="bg-purple-500 text-white p-2 rounded"
            disabled={isQuerying}
          >
            {isQuerying ? 'Asking...' : 'Ask Question'}
          </button>
        </form>
      )} */}

    
      {/* {answer && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Answer:</h2>
          <p>{answer}</p>
        </div>
      )} */}
    </div>

<div className=' flex-1'>
<MainChat/>
</div>
    </div>
  );
}