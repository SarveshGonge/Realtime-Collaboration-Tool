'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';  // Add useRouter for navigation control
import io from 'socket.io-client';

export default function DocumentPage() {
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const { id } = useParams();  // This extracts the documentId from the URL
  const router = useRouter();  // For navigation control

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${id}`, {  // Use the id parameter here
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setDocument(data);
        setContent(data.content);
      })
      .catch(err => console.error('Failed to fetch document:', err));

    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      query: { token },
    });

    socket.emit('join-document', id);

    socket.on('document-changes', (changes) => {
      setContent(changes.content);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, router]);  // id should be a dependency here

  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    // Emit content changes to the server
    socket.emit('edit-document', { documentId: id, content: newContent });
  }, [id]);

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{document.title}</h1>
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-96 p-4 border rounded"
      />
    </div>
  );
}
