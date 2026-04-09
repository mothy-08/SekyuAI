import React, { useState, useEffect } from 'react';
import AddRepo from './components/AddRepo.jsx';
import RepoList from './components/RepoList.jsx';

export default function App() {
  const [repos, setRepos] = useState([]);

  const fetchRepos = async () => {};

  const handleAdded = () => {};

  const handleRemove = (repo) => {};

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div>
      <AddRepo onAdded={handleAdded} />
      <RepoList repos={repos} onRemove={handleRemove} />
    </div>
  );
}
