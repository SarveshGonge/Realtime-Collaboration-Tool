import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch documents:', err);
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Documents</h1>
      <Link href="/new-document" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">
        Create New Document
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Link key={doc._id} href={`/document/${doc._id}`} className="border p-4 rounded hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <p className="text-gray-600">Last updated: {new Date(doc.updatedAt).toLocaleString()}</p>
            </Link>
          ))
        ) : (
          <p>No documents found</p>
        )}
      </div>
    </div>
  );
}
