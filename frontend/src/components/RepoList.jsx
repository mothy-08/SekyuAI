import React from 'react';

export default function RepoList({ repos, onRemove }) {
  if (repos.length === 0) {
    return <p className="mt-6 text-sm text-gray-400">No repositories in the watchlist.</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-gray-200 border border-gray-200 rounded">
      {repos.map((repo) => (
        <li key={repo} className="flex items-center justify-between px-4 py-3">
          <a
            href={`https://github.com/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {repo}
          </a>
          <button
            onClick={() => onRemove(repo)}
            className="text-sm text-red-500 hover:text-red-700 ml-4"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
