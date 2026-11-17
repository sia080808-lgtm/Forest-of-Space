'use strict';

// Trusted workflow control code. The workflow copies this directory out of the
// checkout before switching to a task's source commit. No npm dependencies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const MAX_PATCH = 8 * 1024 * 1024;
const MAX_REPORT = 128 * 1024;
const MAX_FILES = 200;
const REPORT_FILE = '.claude-handoff-report.md';
const SHA = /^[0-9a-f]{40}$/;
const SECRET_PATTERNS = [
  /sk-ant-(?:api\d+|oat\d+)-[A-Za-z0-9_-]{16,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[A-Z0-9]{16}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function validateActor(value) {
  assert(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9-]*(?:\[bot\])?$/.test(value),
    'Actor must be one exact GitHub login; wildcards and lists are not accepted.');
  assert(value.length <= 100, 'Actor is too long.');
  return true;
}
function validateBranchName(value) {
  assert(typeof value === 'string' && value.length > 0 && value.length <= 200,
    'An explicit base_branch is required.');
  assert(/^[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(value), 'Unsafe base branch name.');
  assert(!value.startsWith('refs/') && value !== 'HEAD' && !value.includes('..') &&
    !value.includes('//') && !value.endsWith('/') && !value.endsWith('.') &&
    value.split('/').every(part => part && !part.startsWith('.') && !part.endsWith('.lock')),
  'Malformed base branch name.');
  return true;
}
function validateChangedPath(value) {
  assert(typeof value === 'string' && value.length > 0 && value.length <= 500,
    'Invalid changed file path.');
  assert(!/[\x00-\x1f\x7f\\:]/.test(value) && !value.startsWith('/') &&
    value.split('/').every(part => part && part !== '.' && part !== '..'),
  'Unsafe changed file path.');
  const lower = value.toLowerCase();
  const parts = lower.split('/');
  const basename = parts.at(-1);
  assert(!parts.some(part => ['.git', '.ssh', '.aws', '.gnupg', 'node_modules', '__pycache__'].includes(part)),
    'Repository metadata, credentials, or dependency files cannot be published.');
  assert(!lower.startsWith('.github/') && !lower.startsWith('.claude/') &&
    !['.mcp.json', '.npmrc', '.pypirc', REPORT_FILE].includes(lower),
  'Workflow/agent controls and the handoff report cannot be changed by a coding task.');
  assert(!/^\.env(?:\.|$)/.test(basename) &&
    !/\.(?:pem|key|p12|pfx|jks|keystore|sqlite\d*|db)(?:-(?:wal|shm))?$/.test(basename) &&
    !/^(?:id_rsa|id_ed25519|credentials(?:\.json)?|secrets?(?:\..*)?)$/.test(basename),
  'Credential or runtime database file cannot be published.');
  assert(!parts.some(part => ['runtime', 'backups', 'nas-data', 'user-data', 'userdata'].includes(part)),
    'Runtime/user data cannot be published.');
  return true;
}
function parseTask(body) {
  assert(typeof body === 'string' && body.length <= 60000, 'Task body is missing or too large.');
  const normalized = body.replace(/\r\n/g, '\n');
  const names = ['Task metadata', 'Request', 'Acceptance criteria', 'Assets'];
  const sections = {};
  const headings = [...normalized.matchAll(/^### (Task metadata|Request|Acceptance criteria|Assets)[ \t]*$/gm)];
  for (let i = 0; i < headings.length; i++) {
    const name = headings[i][1];
    assert(!Object.hasOwn(sections, name), `Duplicate section: ${name}`);
    sections[name] = normalized.slice(headings[i].index + headings[i][0].length,
      i + 1 < headings.length ? headings[i + 1].index : normalized.length).trim();
  }
  for (const name of names.slice(0, 3)) {
    assert(sections[name] && sections[name] !== '_No response_', `Missing required section: ${name}`);
  }
  const fence = /^```json[ \t]*\n([\s\S]*?)\n```[ \t]*$/.exec(sections['Task metadata']);
  assert(fence, 'Task metadata must contain exactly one fenced json object.');
  let metadata;
  try { metadata = JSON.parse(fence[1]); } catch { throw new Error('Task metadata is not valid JSON.'); }
  assert(metadata && !Array.isArray(metadata) && typeof metadata === 'object', 'Metadata must be an object.');
  const keys = ['schema', 'project', 'repository', 'base_branch', 'base_sha', 'task_id'];
  assert(Object.keys(metadata).length === keys.length && keys.every(k => Object.hasOwn(metadata, k)),
    'Task metadata must specify exactly schema, project, repository, base_branch, base_sha, task_id.');
  return {
    schema: metadata.schema, project: metadata.project, repository: metadata.repository,
    base_branch: metadata.base_branch, base_sha: metadata.base_sha, task_id: metadata.task_id,
    request: sections.Request, acceptance: sections['Acceptance criteria'],
    assets: sections.Assets === '_No response_' ? '' : (sections.Assets || ''),
  };
}
function validateTask(task, config, context) {
  assert(task && task.schema === 1, 'Unsupported task schema.');
  assert(config && typeof config.id === 'string' && typeof config.repository === 'string',
    'Trusted project configuration is missing.');
  assert(task.project === config.id, 'Task project does not match this repository.');
  assert(task.repository === config.repository && task.repository === context.repository,
    'Foreign repository task rejected.');
  assert(typeof task.base_sha === 'string' && SHA.test(task.base_sha), 'base_sha must be a full lowercase commit SHA.');
  validateBranchName(task.base_branch);
  assert(typeof task.task_id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(task.task_id),
    'task_id must have 3-64 letters, digits, underscores, or hyphens.');
  validateActor(context.expectedActor);
  validateActor(context.actor);
  assert(context.actor === context.expectedActor, 'Task actor is not the configured exact actor.');
  assert(typeof context.title === 'string' && context.title.startsWith('[Claude task]'), 'Wrong task title prefix.');
  assert(typeof task.request === 'string' && task.request.trim() &&
    typeof task.acceptance === 'string' && task.acceptance.trim(), 'Request and acceptance criteria are required.');
  return task;
}
function taskBranch(task) {
  assert(/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(task.task_id), 'Unsafe task ID.');
  return `claude/handoff-${task.task_id}`;
}
function containsSecret(text) {
  return SECRET_PATTERNS.some(pattern => { pattern.lastIndex = 0; return pattern.test(text); });
}
function redact(text) {
  return SECRET_PATTERNS.reduce((result, pattern) => result.replace(pattern, '[REDACTED]'), String(text));
}
function regularFile(filename, limit) {
  const stat = fs.lstatSync(filename);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= limit, 'Artifact file is invalid or exceeds the size limit.');
  return fs.readFileSync(filename);
}
function stateDir() {
  assert(process.env.RUNNER_TEMP, 'RUNNER_TEMP is required.');
  return path.join(process.env.RUNNER_TEMP, 'claude-handoff-state');
}
function readState() {
  return JSON.parse(regularFile(path.join(stateDir(), 'task.json'), MAX_REPORT));
}
function output(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const delimiter = `handoff_${crypto.randomUUID()}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${String(value)}\n${delimiter}\n`);
}
function git(args, extraEnv = {}, maxBuffer = MAX_PATCH + 1024 * 1024) {
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', ...extraEnv };
  delete env.GIT_EXTERNAL_DIFF;
  delete env.GIT_DIFF_OPTS;
  try {
    return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
      '-c', 'diff.external=', ...args], { env, encoding: null, maxBuffer, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    // Never include command arguments/configuration: credentials may be present.
    throw new Error(`Git ${args[0]} failed; see the task/base checks and repository state.`);
  }
}
function gitText(args, extraEnv) { return git(args, extraEnv).toString('utf8').trim(); }
function nulList(buffer) { return buffer.toString('utf8').split('\0').filter(Boolean); }
function apiPath(repo, suffix) { return `/repos/${repo.split('/').map(encodeURIComponent).join('/')}/${suffix}`; }
async function api(method, route, body, allow404 = false) {
  const token = process.env.GITHUB_TOKEN;
  assert(token, 'GitHub workflow token is missing.');
  // This bridge targets github.com only. Never send credentials to a task-provided host.
  const response = await fetch(`https://api.github.com${route}`, {
    method,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (allow404 && response.status === 404) return null;
  assert(response.ok, `GitHub API ${method} failed (${response.status}); no merge or deployment was requested.`);
  return response.status === 204 ? null : response.json();
}
async function branchSha(repo, branch, allow404 = false) {
  validateBranchName(branch);
  const ref = await api('GET', apiPath(repo, `git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`), undefined, allow404);
  return ref?.object?.sha || null;
}
function runUrl() {
  return `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}
function readEvent() {
  return JSON.parse(regularFile(process.env.GITHUB_EVENT_PATH, 2 * 1024 * 1024));
}
function projectConfig() {
  const config = JSON.parse(regularFile(path.join(__dirname, 'project.json'), MAX_REPORT));
  assert(Array.isArray(config.test_commands) && config.test_commands.every(c => typeof c === 'string' && c.length <= 2000),
    'Trusted test_commands must be an array of command strings.');
  return config;
}
async function preflight() {
  const event = readEvent();
  assert(process.env.GITHUB_EVENT_NAME === 'issues' && event.action === 'opened', 'Only new issue tasks are accepted.');
  assert(process.env.HANDOFF_ENABLED === 'true', 'Claude handoff is disabled.');
  const config = projectConfig();
  const task = validateTask(parseTask(event.issue?.body), config, {
    repository: process.env.GITHUB_REPOSITORY,
    actor: process.env.GITHUB_ACTOR,
    expectedActor: process.env.HANDOFF_ACTOR,
    title: event.issue?.title,
  });
  assert(event.repository?.full_name === task.repository && event.issue?.user?.login === process.env.HANDOFF_ACTOR &&
    event.sender?.login === process.env.HANDOFF_ACTOR, 'Issue author/sender does not match the trusted actor.');
  const current = await api('GET', apiPath(task.repository, `issues/${event.issue.number}`));
  assert(current.state === 'open' && current.body === event.issue.body && current.title === event.issue.title &&
    current.user?.login === event.issue.user.login, 'The task was edited, closed, or changed after it was dispatched.');
  assert(await branchSha(task.repository, task.base_branch) === task.base_sha,
    'Stale task: base branch HEAD differs from the requested SHA. Create a new task after reviewing the changes.');
  assert(!(await branchSha(task.repository, taskBranch(task), true)), 'The task work branch already exists; duplicate execution refused.');
  if (process.env.HANDOFF_ROLE !== 'publish') {
    assert(process.env.CLAUDE_AUTH_CONFIGURED === 'true', 'Set CLAUDE_CODE_OAUTH_TOKEN before enabling the handoff.');
  }
  assert(SHA.test(process.env.GITHUB_SHA || ''), 'Control commit SHA is missing.');
  const state = { task, issue_number: event.issue.number, issue_title: event.issue.title,
    body_sha256: sha256(event.issue.body), actor: process.env.HANDOFF_ACTOR,
    control_sha: process.env.GITHUB_SHA, run_id: process.env.GITHUB_RUN_ID,
    run_attempt: process.env.GITHUB_RUN_ATTEMPT, branch: taskBranch(task) };
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(path.join(stateDir(), 'task.json'), JSON.stringify(state, null, 2));
  const prompt = [
    'Implement this validated coding task in the current repository checkout.',
    `Repository: ${task.repository}\nRequired starting commit: ${task.base_sha}\nBase branch: ${task.base_branch}`,
    `Task ID: ${task.task_id}\nProject: ${task.project}`,
    'The GitHub token is read-only. Keep all changes local. Do not push, merge, create releases, deploy, change workflow/agent controls, or access runtime databases/credentials.',
    'Use only the checked-out code and the explicit assets below. Report missing assets instead of inventing their availability.',
    'The publisher will capture the complete final working tree, including local commits and non-ignored new files. Do not change branches or reset the source baseline.',
    'Tests listed below are scope-dependent guidance, not an automatic test suite. Do not claim a test passed unless you observed its result. Clearly list checks you could not run.',
    `Write a brief report to ${REPORT_FILE}: changes made, acceptance criteria, checks actually observed, and untested items/blockers. This report will be excluded from the code patch.`,
    `Project instructions:\n${String(config.instructions || '')}`,
    `Project notes:\n${typeof config.notes === 'string' ? config.notes : JSON.stringify(config.notes || [])}`,
    `Suggested test commands:\n${config.test_commands.length ? config.test_commands.join('\n') : 'None configured; validation must be reported as not run.'}`,
    `Request:\n${task.request}`, `Acceptance criteria:\n${task.acceptance}`, `Assets:\n${task.assets || 'No assets supplied.'}`,
  ].join('\n\n');
  output('base_sha', task.base_sha);
  output('base_branch', task.base_branch);
  output('task_branch', state.branch);
  output('allowed_bots', event.sender.type === 'Bot' || state.actor.endsWith('[bot]') ? state.actor : '');
  output('prompt', prompt);
}
function verifyCheckout() {
  const { task } = readState();
  assert(gitText(['rev-parse', 'HEAD']) === task.base_sha, 'Checkout is not at the pinned task commit.');
  assert(gitText(['status', '--porcelain']) === '', 'Task checkout must be clean before Claude starts.');
}
function stageInfo(filename, env = {}) {
  const entries = nulList(git(['ls-files', '--stage', '-z', '--', filename], env));
  if (!entries.length) return null;
  assert(entries.length === 1, 'Unmerged or ambiguous file in patch.');
  const match = /^(\d{6}) ([0-9a-f]{40}) 0\t([\s\S]+)$/.exec(entries[0]);
  assert(match && match[3] === filename && ['100644', '100755'].includes(match[1]),
    'Symlinks, submodules, and unmerged files cannot be published.');
  return { mode: match[1], sha: match[2] };
}
function collect() {
  const state = readState();
  const config = projectConfig();
  git(['merge-base', '--is-ancestor', state.task.base_sha, 'HEAD']);
  const results = { status: 'not_run_by_bridge', suggested_commands: config.test_commands,
    note: 'Scope-dependent guidance only. Any checks described by Claude are self-reported and must be reviewed against the execution log.' };
  const candidates = [...new Set([
    ...nulList(git(['diff', '--no-ext-diff', '--no-renames', '--name-only', '-z', state.task.base_sha, '--'])),
    ...nulList(git(['ls-files', '--others', '--exclude-standard', '-z'])),
  ])].filter(filename => filename !== REPORT_FILE);
  assert(candidates.length <= MAX_FILES, 'Too many changed files for one task.');
  candidates.forEach(validateChangedPath);
  const index = path.join(stateDir(), `index-${crypto.randomUUID()}`);
  const indexEnv = { GIT_INDEX_FILE: index };
  git(['read-tree', state.task.base_sha], indexEnv);
  git(['add', '-A', '--', '.', `:(exclude)${REPORT_FILE}`], indexEnv);
  const files = nulList(git(['diff', '--cached', '--no-ext-diff', '--no-renames', '--name-only', '-z', state.task.base_sha, '--'], indexEnv)).sort();
  assert(files.length > 0 && files.length <= MAX_FILES, 'No publishable changes, or the task changed too many files.');
  for (const filename of files) { validateChangedPath(filename); stageInfo(filename, indexEnv); }
  const patch = git(['diff', '--cached', '--no-ext-diff', '--no-renames', '--binary', '--full-index', state.task.base_sha, '--'], indexEnv);
  assert(patch.length <= MAX_PATCH, 'Patch exceeds 8 MiB; split the task or handle large assets separately.');
  const added = patch.toString('utf8').split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++')).join('\n');
  assert(!containsSecret(added), 'A probable credential was found in added patch lines; publishing stopped.');
  const payloadDir = path.join(stateDir(), 'payload');
  const reportDir = path.join(stateDir(), 'report');
  fs.mkdirSync(payloadDir, { recursive: true });
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(process.env.GITHUB_WORKSPACE || process.cwd(), REPORT_FILE);
  const modelReport = fs.existsSync(reportPath) ? redact(regularFile(reportPath, 48 * 1024).toString('utf8')) : 'Claude did not provide a report; review the execution log.';
  const report = [
    `# Task ${state.task.task_id}`, `Source: ${state.task.repository}@${state.task.base_sha}`,
    `Run: ${runUrl()}`, '## Worker validation',
    'The bridge verified task identity, source SHA, patch paths, size, and checksums. It did not execute application tests. Any checks below are Claude\'s self-reported observations, not independently verified test results.',
    '## Claude report (self-reported)', modelReport,
    'A draft PR is a review deliverable. Device/runtime behavior, deployment, and acceptance criteria still require review unless explicitly verified above.',
  ].join('\n\n');
  assert(Buffer.byteLength(report) <= MAX_REPORT, 'Report is too large.');
  fs.writeFileSync(path.join(reportDir, 'report.md'), report);
  const testJson = JSON.stringify(results, null, 2);
  assert(Buffer.byteLength(testJson) <= MAX_REPORT, 'Test report is too large.');
  fs.writeFileSync(path.join(reportDir, 'tests.json'), testJson);
  fs.writeFileSync(path.join(payloadDir, 'changes.patch'), patch);
  fs.writeFileSync(path.join(payloadDir, 'manifest.json'), JSON.stringify({
    ...state, files, patch_sha256: sha256(patch), report_sha256: sha256(report), tests_sha256: sha256(testJson),
  }, null, 2));
  output('payload_dir', payloadDir);
  output('report_dir', reportDir);
  output('has_changes', 'true');
}
function compareManifest(manifest, state) {
  for (const key of ['issue_number', 'issue_title', 'body_sha256', 'actor', 'control_sha', 'run_id', 'run_attempt', 'branch']) {
    assert(manifest[key] === state[key], `Artifact does not match this run: ${key}`);
  }
  assert(JSON.stringify(manifest.task) === JSON.stringify(state.task), 'Artifact task does not match the original issue.');
  assert(Array.isArray(manifest.files) && manifest.files.length > 0 && manifest.files.length <= MAX_FILES &&
    new Set(manifest.files).size === manifest.files.length, 'Invalid artifact file list.');
  manifest.files.forEach(validateChangedPath);
}
async function publish() {
  const state = readState();
  verifyCheckout();
  const payloadDir = path.join(process.env.RUNNER_TEMP, 'claude-handoff-download', 'payload');
  const reportDir = path.join(process.env.RUNNER_TEMP, 'claude-handoff-download', 'report');
  assert(fs.readdirSync(payloadDir).sort().join('|') === 'changes.patch|manifest.json', 'Unexpected payload files.');
  assert(fs.readdirSync(reportDir).sort().join('|') === 'report.md|tests.json', 'Unexpected report files.');
  const patchPath = path.join(payloadDir, 'changes.patch');
  const patch = regularFile(patchPath, MAX_PATCH);
  const manifest = JSON.parse(regularFile(path.join(payloadDir, 'manifest.json'), MAX_REPORT));
  const report = regularFile(path.join(reportDir, 'report.md'), MAX_REPORT);
  const tests = regularFile(path.join(reportDir, 'tests.json'), MAX_REPORT);
  compareManifest(manifest, state);
  assert(sha256(patch) === manifest.patch_sha256 && sha256(report) === manifest.report_sha256 &&
    sha256(tests) === manifest.tests_sha256, 'Artifact checksum mismatch.');
  const numstat = nulList(git(['apply', '--numstat', '-z', '--', patchPath]));
  const patchPaths = numstat.map(line => {
    const match = /^(?:\d+|-)\t(?:\d+|-)\t([\s\S]+)$/.exec(line);
    assert(match, 'Malformed patch path record.');
    validateChangedPath(match[1]);
    return match[1];
  }).sort();
  assert(JSON.stringify(patchPaths) === JSON.stringify([...manifest.files].sort()), 'Patch paths differ from the manifest.');
  const added = patch.toString('utf8').split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++')).join('\n');
  assert(!containsSecret(added) && !containsSecret(report.toString('utf8')) && !containsSecret(tests.toString('utf8')),
    'Probable credentials in the payload/report; publishing stopped.');
  git(['apply', '--check', '--index', '--', patchPath]);
  git(['apply', '--index', '--', patchPath]);
  const files = nulList(git(['diff', '--cached', '--no-ext-diff', '--no-renames', '--name-only', '-z', state.task.base_sha, '--'])).sort();
  assert(JSON.stringify(files) === JSON.stringify(patchPaths), 'Applied paths differ from the validated patch.');
  const repo = state.task.repository;
  // Only create Git objects and a new task ref. Never update an existing ref,
  // push, merge, dispatch another workflow, release, or execute task source code.
  const entries = [];
  for (const filename of files) {
    const info = stageInfo(filename);
    if (!info) { entries.push({ path: filename, mode: '100644', type: 'blob', sha: null }); continue; }
    const content = git(['cat-file', 'blob', info.sha]);
    assert(content.length <= MAX_PATCH && !containsSecret(content.toString('utf8')), 'Oversized file or probable credential in proposed content.');
    const blob = await api('POST', apiPath(repo, 'git/blobs'), { content: content.toString('base64'), encoding: 'base64' });
    entries.push({ path: filename, mode: info.mode, type: 'blob', sha: blob.sha });
  }
  assert(await branchSha(repo, state.task.base_branch) === state.task.base_sha, 'Base branch moved while the task ran; nothing will be published.');
  const baseCommit = await api('GET', apiPath(repo, `git/commits/${state.task.base_sha}`));
  const tree = await api('POST', apiPath(repo, 'git/trees'), { base_tree: baseCommit.tree.sha, tree: entries });
  const commit = await api('POST', apiPath(repo, 'git/commits'), {
    message: `Implement ${state.task.task_id} (issue #${state.issue_number})`, tree: tree.sha, parents: [state.task.base_sha],
  });
  await api('POST', apiPath(repo, 'git/refs'), { ref: `refs/heads/${state.branch}`, sha: commit.sha });
  const pr = await api('POST', apiPath(repo, 'pulls'), {
    title: state.issue_title.replace(/^\[Claude task\]\s*/, '').slice(0, 200) || state.task.task_id,
    head: state.branch, base: state.task.base_branch, draft: true,
    body: [`Implements the request in #${state.issue_number}.`,
      `Pinned source: \`${state.task.base_branch}\` at \`${state.task.base_sha}\`.`,
      report.toString('utf8').slice(0, 45000),
      'This workflow creates a draft only. It does not merge or deploy. GitHub may require a write-authorized user to approve CI on a PR created by GITHUB_TOKEN.',
    ].join('\n\n'),
  });
  await api('POST', apiPath(repo, `issues/${state.issue_number}/comments`), {
    body: [`Draft PR created: ${pr.html_url}`, report.toString('utf8').slice(0, 22000),
      `Full report and command logs: ${runUrl()}`, 'Results are recorded in GitHub; this does not automatically resume a ChatGPT conversation.'].join('\n\n'),
  });
  output('pr_url', pr.html_url);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Draft PR: ${pr.html_url}\n\n${report.toString('utf8')}`);
}

module.exports = { parseTask, validateTask, validateActor, validateBranchName, validateChangedPath,
  taskBranch, sha256, containsSecret, compareManifest };
if (require.main === module) {
  const commands = { preflight, verify: verifyCheckout, collect, publish };
  Promise.resolve().then(() => {
    assert(Object.hasOwn(commands, process.argv[2]), 'Unknown bridge command.');
    return commands[process.argv[2]]();
  }).catch(error => {
    console.error(`Claude handoff stopped: ${redact(error.message)}`);
    process.exitCode = 1;
  });
}
