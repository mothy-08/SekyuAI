import React, { useState, useEffect } from 'react';
import AddRepo from './components/AddRepo.jsx';
import RepoList from './components/RepoList.jsx';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/watchlist');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setRepos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdded = () => {
    fetchRepos();
  };

  const handleRemove = async (repo) => {
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(repo)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const updated = await res.json();
      setRepos(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">SekyuAI Watchlist</h1>
        <AddRepo onAdded={handleAdded} />
        {loading && (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>
        )}
        {!loading && !error && (
          <RepoList repos={repos} onRemove={handleRemove} />
        )}
      </div>
    </div>
  );
}
