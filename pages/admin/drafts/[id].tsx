import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { Draft } from '@prisma/client';

export default function EditDraftPage() {
  const router = useRouter();
  const { id } = router.query;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch draft data when the component mounts or the ID changes
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`/api/admin/drafts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch draft');
          return res.json();
        })
        .then((data) => {
          setDraft(data);
          setError('');
        })
        .catch((err) => {
          setError(err.message);
          setDraft(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!draft) return;
    const { name, value } = e.target;
    setDraft({ ...draft, [name]: value });
  };

  const handleSave = async () => {
    if (!draft) return;
     console.log('Data being sent to API:', draft);
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/drafts/${draft.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error('Failed to save draft.');
      alert('Draft saved successfully!');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!draft) return;
    console.log('Approving draft with ID:', draft.id);
    setIsApproving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/drafts/${draft.id}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve draft.');
      alert('Draft has been approved and is ready to be posted!');
      router.push('/admin/drafts'); // Redirect back to the list
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsApproving(false);
      setShowConfirm(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading draft...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!draft) return <div className="p-8">Draft not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Draft</h1>
        
        {/* Editor Form */}
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={draft.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea
              name="summary"
              id="summary"
              rows={3}
              value={draft.summary}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              name="body"
              id="body"
              rows={15}
              value={draft.body}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700 mb-1">Image Prompt</label>
            <input
              type="text"
              name="imagePrompt"
              id="imagePrompt"
              value={draft.imagePrompt || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            onClick={() => router.push('/admin/drafts')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to List
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isApproving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
          >
            Approve & Ready to Post
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900">Confirm Approval</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to approve this draft? Once approved, it will be ready for posting.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300"
                >
                  {isApproving ? 'Approving...' : 'Yes, Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

