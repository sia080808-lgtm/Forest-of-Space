'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// All repositories and GitHub responses in this file are disposable fixtures.
// No model, network endpoint, account, or real repository is used.
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-handoff-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const work = path.join(dir, 'work');
  const control = path.join(dir, 'control');
  const temp = path.join(dir, 'runner');
  for (const p of [work, control, temp]) fs.mkdirSync(p, { recursive: true });
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: work, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  git('init', '-q', '--initial-branch=main');
  git('config', 'user.name', 'Bridge Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  fs.mkdirSync(path.join(work, 'src'));
  fs.writeFileSync(path.join(work, 'src/app.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(work, 'old.txt'), 'remove this fixture\n');
  git('add', '.');
  git('commit', '-qm', 'Fixture baseline');
  const sha = git('rev-parse', 'HEAD');
  fs.copyFileSync(path.join(__dirname, 'bridge.cjs'), path.join(control, 'bridge.cjs'));
  fs.writeFileSync(path.join(control, 'project.json'), JSON.stringify({
    id: 'forest', repository: 'fixture/forest', instructions: 'Fixture only.',
    test_commands: ['node --test'], notes: [],
  }));
  const meta = { schema: 1, project: 'forest', repository: 'fixture/forest',
    base_branch: 'main', base_sha: sha, task_id: 'FOREST-fixture-001' };
  const body = ['### Task metadata', '```json', JSON.stringify(meta), '```',
    '### Request', 'Change the fixture source.', '### Acceptance criteria',
    'The original source and binary asset are preserved in the draft patch.'].join('\n');
  const issue = { number: 7, title: '[Claude task] Fixture', body,
    state: 'open', user: { login: 'fixture-owner' } };
  const event = { action: 'opened', repository: { full_name: 'fixture/forest' },
    sender: { login: 'fixture-owner', type: 'User' }, issue };
  const eventPath = path.join(dir, 'event.json');
  const mockPath = path.join(dir, 'mock.json');
  const logPath = path.join(dir, 'api.jsonl');
  fs.writeFileSync(eventPath, JSON.stringify(event));
  const setMock = (changes = {}) => fs.writeFileSync(mockPath,
    JSON.stringify({ sha, issue, existing: false, ...changes }));
  setMock();
  const mockScript = path.join(dir, 'mock-fetch.cjs');
  fs.writeFileSync(mockScript, `
const fs = require('node:fs');
const crypto = require('node:crypto');
global.fetch = async (url, options) => {
  const m = JSON.parse(fs.readFileSync(process.env.MOCK_STATE, 'utf8'));
  const route = new URL(url).pathname;
  const method = options.method;
  const body = options.body ? JSON.parse(options.body) : undefined;
  fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify({method, route, body}) + '\\n');
  let result;
  if (method === 'GET' && route.endsWith('/issues/7')) result = m.issue;
  else if (method === 'GET' && route.endsWith('/git/ref/heads/main')) result = {object:{sha:m.sha}};
  else if (method === 'GET' && route.includes('/git/ref/heads/claude/')) {
    if (!m.existing) return new Response('{}', {status:404});
    result = {object:{sha:m.sha}};
  }
  else if (method === 'GET' && route.includes('/git/commits/')) result = {tree:{sha:'b'.repeat(40)}};
  else if (method === 'POST' && route.endsWith('/git/blobs')) {
    const data = Buffer.from(body.content, 'base64');
    result = {sha:crypto.createHash('sha1').update('blob '+data.length+'\\0').update(data).digest('hex')};
  }
  else if (method === 'POST' && route.endsWith('/git/trees')) result = {sha:'c'.repeat(40)};
  else if (method === 'POST' && route.endsWith('/git/commits')) result = {sha:'d'.repeat(40)};
  else if (method === 'POST' && route.endsWith('/git/refs')) {
    if (body.ref !== 'refs/heads/claude/handoff-FOREST-fixture-001') throw new Error('Unexpected ref write');
    result = {ref:body.ref,object:{sha:body.sha}};
  }
  else if (method === 'POST' && route.endsWith('/pulls')) {
    if (!body.draft || body.base !== 'main') throw new Error('Expected a draft against the explicit base');
    result = {html_url:'https://github.com/fixture/forest/pull/8'};
  }
  else if (method === 'POST' && route.endsWith('/issues/7/comments')) result = {id:9};
  else throw new Error('Unexpected API operation: '+method+' '+route);
  return new Response(JSON.stringify(result), {status:200});
};
`);
  const env = { ...process.env, RUNNER_TEMP: temp, GITHUB_WORKSPACE: work,
    GITHUB_EVENT_PATH: eventPath, GITHUB_EVENT_NAME: 'issues', GITHUB_REPOSITORY: 'fixture/forest',
    GITHUB_ACTOR: 'fixture-owner', HANDOFF_ACTOR: 'fixture-owner', HANDOFF_ENABLED: 'true',
    CLAUDE_AUTH_CONFIGURED: 'true', GITHUB_SHA: 'e'.repeat(40), GITHUB_RUN_ID: '123',
    GITHUB_RUN_ATTEMPT: '1', GITHUB_TOKEN: 'fixture-placeholder',
    GITHUB_OUTPUT: path.join(dir, 'output.txt'), GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md'),
    MOCK_STATE: mockPath, MOCK_LOG: logPath };
  const run = (command, extra = {}) => spawnSync(process.execPath,
    ['--require', mockScript, path.join(control, 'bridge.cjs'), command],
    { cwd: work, env: { ...env, ...extra }, encoding: 'utf8' });
  const calls = () => fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').trim().split('\n')
    .filter(Boolean).map(line => JSON.parse(line)) : [];
  const clearCalls = () => fs.writeFileSync(logPath, '');
  function collect() {
    let r = run('preflight');
    assert.equal(r.status, 0, r.stderr);
    r = run('verify');
    assert.equal(r.status, 0, r.stderr);
    fs.writeFileSync(path.join(work, 'src/app.js'), 'module.exports = 2;\n');
    git('add', 'src/app.js');
    git('commit', '-qm', 'Local model fixture commit');
    fs.unlinkSync(path.join(work, 'old.txt'));
    fs.writeFileSync(path.join(work, 'new.txt'), 'untracked source fixture\n');
    fs.writeFileSync(path.join(work, 'asset.bin'), Buffer.from([0, 1, 2, 0, 255, 128]));
    fs.writeFileSync(path.join(work, '.claude-handoff-report.md'), 'Fixture checks only; no real app was tested.\n');
    r = run('collect');
    assert.equal(r.status, 0, r.stderr);
    return path.join(temp, 'claude-handoff-state');
  }
  function preparePublisher() {
    // Only this disposable fixture is reset; no user repository is involved.
    git('reset', '--hard', sha);
    git('clean', '-fd');
    const state = path.join(temp, 'claude-handoff-state');
    for (const name of ['payload', 'report']) fs.cpSync(path.join(state, name),
      path.join(temp, 'claude-handoff-download', name), { recursive: true });
    const r = run('preflight', { HANDOFF_ROLE: 'publish' });
    assert.equal(r.status, 0, r.stderr);
    clearCalls();
  }
  return { dir, work, temp, sha, issue, git, setMock, run, calls, clearCalls, collect, preparePublisher };
}

test('pins source, captures local commits/new/binary/deleted files, and only creates a new ref plus draft PR', t => {
  const f = fixture(t);
  const state = f.collect();
  const manifest = JSON.parse(fs.readFileSync(path.join(state, 'payload/manifest.json')));
  assert.deepEqual(manifest.files, ['asset.bin', 'new.txt', 'old.txt', 'src/app.js']);
  assert.match(fs.readFileSync(path.join(state, 'payload/changes.patch'), 'utf8'), /GIT binary patch/);
  const checks = JSON.parse(fs.readFileSync(path.join(state, 'report/tests.json')));
  assert.equal(checks.status, 'not_run_by_bridge');
  f.preparePublisher();
  const r = f.run('publish', { HANDOFF_ROLE: 'publish' });
  assert.equal(r.status, 0, r.stderr);
  const calls = f.calls();
  assert.equal(calls.filter(c => c.route.endsWith('/git/refs')).length, 1);
  assert.ok(calls.every(c => ['GET', 'POST'].includes(c.method)));
  assert.equal(calls.find(c => c.route.endsWith('/git/refs')).body.ref,
    'refs/heads/claude/handoff-FOREST-fixture-001');
  const pr = calls.find(c => c.route.endsWith('/pulls')).body;
  assert.equal(pr.draft, true);
  assert.equal(pr.base, 'main');
  assert.match(pr.body, /not independently verified/);
  assert.ok(calls.every(c => !/\/merge|\/dispatches|\/releases/.test(c.route)));
});

test('rejects stale source, edited task, duplicate branch, or missing auth before a model can run', t => {
  const f = fixture(t);
  for (const [mock, extra] of [
    [{ sha: 'f'.repeat(40) }, {}],
    [{ issue: { ...f.issue, body: f.issue.body + '\nchanged after dispatch' } }, {}],
    [{ existing: true }, {}],
    [{}, { CLAUDE_AUTH_CONFIGURED: 'false' }],
  ]) {
    f.setMock(mock);
    f.clearCalls();
    const r = f.run('preflight', extra);
    assert.notEqual(r.status, 0);
    assert.ok(f.calls().every(c => c.method === 'GET'));
  }
});

test('publisher rejects an altered artifact before any remote mutation', t => {
  const f = fixture(t);
  f.collect();
  f.preparePublisher();
  fs.appendFileSync(path.join(f.temp, 'claude-handoff-download/payload/changes.patch'), '\nmodified payload');
  const r = f.run('publish', { HANDOFF_ROLE: 'publish' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /checksum mismatch/);
  assert.equal(f.calls().length, 0);
});

test('collector refuses a new runtime database instead of publishing it', t => {
  const f = fixture(t);
  assert.equal(f.run('preflight').status, 0);
  fs.writeFileSync(path.join(f.work, 'users.sqlite'), 'synthetic data only');
  const r = f.run('collect');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /database file/);
});
