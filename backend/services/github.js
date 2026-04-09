const GITHUB_API = 'https://api.github.com';

export async function requestGitHub(method, path, body) {
  const headers = {
    'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${GITHUB_API}${path}`, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} on ${method} ${path}: ${text}`);
  }

  // Some responses (e.g., 204) have no body
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

export async function getFileContent(repo, filePath, branch) {
  const data = await requestGitHub('GET', `/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`);
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  };
}

export async function getLatestSHA(repo, branch) {
  const data = await requestGitHub('GET', `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return data.object.sha;
}

export async function createBlob(repo, content) {
  const data = await requestGitHub('POST', `/repos/${repo}/git/blobs`, {
    content,
    encoding: 'utf-8',
  });
  return data.sha;
}

export async function createTree(repo, baseSha, filePath, blobSha) {
  const data = await requestGitHub('POST', `/repos/${repo}/git/trees`, {
    base_tree: baseSha,
    tree: [
      {
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blobSha,
      },
    ],
  });
  return data.sha;
}

export async function createCommit(repo, message, treeSha, parentSha) {
  const data = await requestGitHub('POST', `/repos/${repo}/git/commits`, {
    message,
    tree: treeSha,
    parents: [parentSha],
  });
  return data.sha;
}

export async function createBranch(repo, branchName, commitSha) {
  await requestGitHub('POST', `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: commitSha,
  });
}

export async function createPR(repo, baseBranch, newBranch, title, body) {
  const data = await requestGitHub('POST', `/repos/${repo}/pulls`, {
    title,
    body,
    head: newBranch,
    base: baseBranch,
  });
  return data;
}
