const GITHUB_API = 'https://api.github.com';

export async function requestGitHub(method, path, body) {}

export async function getFileContent(repo, path, branch) {}

export async function getLatestSHA(repo, branch) {}

export async function createBlob(repo, content) {}

export async function createTree(repo, baseSha, filePath, blobSha) {}

export async function createCommit(repo, message, treeSha, parentSha) {}

export async function createBranch(repo, branchName, commitSha) {}

export async function createPR(repo, baseBranch, newBranch, title, body) {}
