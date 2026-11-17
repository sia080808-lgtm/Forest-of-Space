'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const bridge = require('./bridge.cjs');

const metadata = {
  schema: 1,
  project: 'forest',
  repository: 'sia080808-lgtm/Forest-of-Space',
  base_branch: 'feature/rain-visibility',
  base_sha: 'a'.repeat(40),
  task_id: 'FOREST-20261117-001',
};
const config = { id: 'forest', repository: metadata.repository };
const context = {
  repository: metadata.repository,
  actor: 'sia080808-lgtm',
  expectedActor: 'sia080808-lgtm',
  title: '[Claude task] Improve rain visibility',
};

function body(meta = metadata) {
  return [
    '### Task metadata',
    '',
    '```json',
    JSON.stringify(meta, null, 2),
    '```',
    '',
    '### Request',
    '',
    'Keep the existing character assets and improve rain contrast.',
    '',
    '### Acceptance criteria',
    '',
    '- Verify that changing the camera zoom does not change rainfall.',
    '',
    '### Assets',
    '',
    'Existing assets only; no new generated image is required.',
  ].join('\n');
}

test('parses the same issue envelope sent by the connector and issue form', () => {
  const task = bridge.parseTask(body());
  for (const [key, value] of Object.entries(metadata)) assert.equal(task[key], value);
  assert.match(task.request, /rain contrast/);
  assert.match(task.acceptance, /camera zoom/);
  assert.match(task.assets, /Existing assets/);
  assert.equal(bridge.validateTask(task, config, context).base_sha, metadata.base_sha);
});

test('never falls back to the default branch when the task omits its base', () => {
  const missing = { ...metadata };
  delete missing.base_branch;
  assert.throws(() => bridge.validateTask(bridge.parseTask(body(missing)), config, context));
});

test('rejects ambiguous duplicate metadata', () => {
  assert.throws(() => bridge.parseTask(body() + '\n\n### Task metadata\n```json\n{}\n```'));
});

test('requires both a request and observable acceptance criteria', () => {
  assert.throws(() => bridge.parseTask(body().replace('### Request', '### Other')));
  assert.throws(() => bridge.parseTask(body().replace('### Acceptance criteria', '### Other')));
});

for (const badSha of ['', 'main', 'a'.repeat(7), 'z'.repeat(40), 'a'.repeat(41)]) {
  test(`rejects non-pinned base SHA ${JSON.stringify(badSha)}`, () => {
    assert.throws(() => bridge.validateTask(
      bridge.parseTask(body({ ...metadata, base_sha: badSha })), config, context));
  });
}

test('prevents a personal-repository task from executing against a company repository', () => {
  const task = bridge.parseTask(body({ ...metadata, repository: 'TEAM-BTB/MKT' }));
  assert.throws(() => bridge.validateTask(task, config, context));
});

test('rejects the wrong project even when the repository matches', () => {
  const task = bridge.parseTask(body({ ...metadata, project: 'hub' }));
  assert.throws(() => bridge.validateTask(task, config, context));
});

test('refuses unconfigured or different request actors', () => {
  const task = bridge.parseTask(body());
  assert.throws(() => bridge.validateTask(task, config, { ...context, expectedActor: '' }));
  assert.throws(() => bridge.validateTask(task, config, { ...context, actor: 'someone-else' }));
});

test('accepts one exact observed bot actor without allowing a wildcard', () => {
  assert.equal(bridge.validateActor('example-app[bot]'), true);
  for (const actor of ['*', 'a,b', 'a b', '', '$(command)']) {
    assert.throws(() => bridge.validateActor(actor));
  }
});

test('does not treat an ordinary issue as a coding request', () => {
  assert.throws(() => bridge.validateTask(bridge.parseTask(body()), config,
    { ...context, title: 'Please look at this issue' }));
});

test('requires the supported task schema', () => {
  assert.throws(() => bridge.validateTask(
    bridge.parseTask(body({ ...metadata, schema: 99 })), config, context));
});

test('task identifiers cannot inject a Git ref or shell expression', () => {
  for (const task_id of ['../main', 'x;echo bad', 'a/b', '$(id)', 'x'.repeat(65)]) {
    assert.throws(() => bridge.validateTask(
      bridge.parseTask(body({ ...metadata, task_id })), config, context));
  }
  assert.equal(bridge.taskBranch(metadata), 'claude/handoff-FOREST-20261117-001');
});

test('accepts normal main and active Claude branch names', () => {
  for (const name of ['main', 'claude/magical-hypatia-mvlume', 'feature/rain-visibility']) {
    assert.equal(bridge.validateBranchName(name), true);
  }
});

test('rejects branch names that are refs, traversal, options, or shell syntax', () => {
  for (const name of ['', '-main', '../main', 'refs/heads/main', 'main..next',
    'x@{1}', 'x.lock', 'x//y', 'x;echo bad', '$(id)', 'x\ny']) {
    assert.throws(() => bridge.validateBranchName(name), name);
  }
});

test('accepts ordinary source changes and source assets', () => {
  for (const name of ['app/src/main/assets/web/scene.js', 'docs/change.md',
    'assets/rain-preview.png', 'package-lock.json', 'hub_storage.py']) {
    assert.equal(bridge.validateChangedPath(name), true);
  }
});

test('refuses credentials, runtime databases, signing keys, and path escapes', () => {
  for (const name of ['.env', '.env.local', 'secrets/private.pem',
    'android/release.keystore', 'data/users.sqlite', 'data/users.db',
    '../outside.txt', '/tmp/outside.txt', '.git/config', 'x\ny']) {
    assert.throws(() => bridge.validateChangedPath(name), name);
  }
});

test('task snapshot hashes detect changes in the original request', () => {
  const original = bridge.sha256(body());
  assert.match(original, /^[0-9a-f]{64}$/);
  assert.notEqual(original, bridge.sha256(body() + '\nChanged request'));
});
