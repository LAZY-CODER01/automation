import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define a type for our draft object for better code quality with TypeScript
type Draft = {
  id: number;
  title: string;
  summary: string;
  status: string;
  images: string[];
  createdAt: string;
};

const AdminDraftsPage = () => {
  // State to hold the drafts fetched from the API
  const [drafts, setDrafts] = useState<Draft[]>([]);
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State to handle any errors during fetch
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await fetch('/api/admin/drafts');
        if (!response.ok) {
          throw new Error('Failed to fetch drafts from the server.');
        }
        const data = await response.json();
        setDrafts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []); // The empty dependency array ensures this runs only once

  // Display a loading message while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading drafts...</p>
      </div>
    );
  }

  // Display an error message if the fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard: Drafts</h1>
        
        {drafts.length === 0 ? (
          <p className="text-center text-gray-400">No drafts found. Run the generation script to create some!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105">
                {/* Use the first image as a header, with a placeholder if none exists */}
                <img
                  src={draft.images[0] || 'https://placehold.co/600x400/1a202c/718096?text=No+Image'}
                  alt={`Image for ${draft.title}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-semibold truncate" title={draft.title}>{draft.title}</h2>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        draft.status === 'pending' ? 'bg-yellow-500 text-black' : 
                        draft.status === 'approved' ? 'bg-green-500 text-black' : 'bg-gray-600'
                      }`}
                    >
                      {draft.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Created: {new Date(draft.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-300 mb-6 line-clamp-3">{draft.summary}</p>
                  <Link
                    href={`/admin/drafts/${draft.id}`}
                    className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    View / Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDraftsPage;

