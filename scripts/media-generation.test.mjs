import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { useMediaGenerations } from '../src/app/lib/useMediaGenerations.ts';
import { useGeneratedMedia } from '../src/app/lib/useGeneratedMedia.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const draft = { id: 'local', status: 'pending', errorMessage: null, prompt: 'Un paysage', aspectRatio: '4:3' };
const ready = { status: 'ready', error: null, imagePath: 'result.png' };
const fields = (result) => ({ imagePath: result.imagePath });

async function mountHook(callback, props = {}) {
  let value, root;
  function Probe(p) { value = callback(p); return null; }
  await act(async () => { root = create(React.createElement(Probe, props)); });
  return {
    get value() { return value; },
    async update(p) { await act(async () => { root.update(React.createElement(Probe, p)); }); },
    async close() { await act(async () => root.unmount()); },
  };
}

test('shows a card before the server responds and preserves its key and ratio through completion', async () => {
  const submission = deferred(), result = deferred();
  const fetchAll = async () => [];
  const hook = await mountHook(() => useMediaGenerations('user', fetchAll, () => result.promise, fields));
  let work;
  act(() => { work = hook.value.start(draft, () => submission.promise); });
  assert.equal(hook.value.generating, true);
  assert.equal(hook.value.generations[0].status, 'pending');
  assert.equal(hook.value.generations[0].aspectRatio, '4:3');
  await act(async () => submission.resolve('server-id'));
  assert.equal(hook.value.generations[0].clientKey, 'local');
  assert.equal(hook.value.generations[0].id, 'server-id');
  await act(async () => { result.resolve(ready); await work; });
  assert.equal(hook.value.generations[0].imagePath, 'result.png');
  assert.equal(hook.value.generations[0].clientKey, 'local');
  assert.equal(hook.value.generating, false);
  await hook.close();
});

test('request errors leave a retryable card and retry uses the original parameters', async () => {
  let attempts = 0;
  const fetchAll = async () => [];
  const request = async () => { if (++attempts === 1) throw new Error('Service indisponible'); return 'server-id'; };
  const hook = await mountHook(() => useMediaGenerations('user', fetchAll, async () => ready, fields));
  await act(async () => hook.value.start(draft, request));
  assert.equal(hook.value.generations[0].status, 'failed');
  assert.equal(hook.value.generations[0].errorMessage, 'Service indisponible');
  await act(async () => hook.value.retry(hook.value.generations[0], () => assert.fail('Must reuse original request')));
  assert.equal(attempts, 2);
  assert.equal(hook.value.generations.length, 1);
  assert.equal(hook.value.generations[0].status, 'ready');
  await hook.close();
});

test('server failure is displayed and another generation can be requested', async () => {
  let count = 0;
  const fetchAll = async () => [];
  const poll = async () => ++count === 1 ? { status: 'failed', error: 'Génération refusée', imagePath: null } : ready;
  const hook = await mountHook(() => useMediaGenerations('user', fetchAll, poll, fields));
  await act(async () => hook.value.start(draft, async () => 'server-id'));
  assert.equal(hook.value.generations[0].errorMessage, 'Génération refusée');
  await act(async () => hook.value.retry(hook.value.generations[0], async () => 'new-id'));
  assert.equal(hook.value.generations[0].status, 'ready');
  await hook.close();
});

for (const interruption of ['timeout', 'network']) {
  test(`${interruption}: retry checks the existing job without creating a second one`, async () => {
    let count = 0, submissions = 0;
    const ids = [];
    const fetchAll = async () => [];
    const poll = async (id) => {
      ids.push(id);
      if (++count === 1) {
        if (interruption === 'network') throw new Error('Connexion interrompue');
        return { status: 'pending', error: 'Délai dépassé', imagePath: null };
      }
      return ready;
    };
    const hook = await mountHook(() => useMediaGenerations('user', fetchAll, poll, fields));
    await act(async () => hook.value.start(draft, async () => { submissions++; return 'server-id'; }));
    assert.ok(hook.value.generations[0].trackingError);
    await act(async () => hook.value.retry(hook.value.generations[0], () => assert.fail('No new generation')));
    assert.equal(submissions, 1);
    assert.deepEqual(ids, ['server-id', 'server-id']);
    assert.equal(hook.value.generations[0].status, 'ready');
    await hook.close();
  });
}

test('pending history resumes polling and ignores a stale history response after completion', async () => {
  const fetchAll = async () => [{ ...draft, id: 'existing' }];
  const hook = await mountHook(() => useMediaGenerations('user', fetchAll, async () => ready, fields));
  assert.equal(hook.value.generations[0].status, 'ready');
  assert.equal(hook.value.generations[0].imagePath, 'result.png');
  await hook.close();
});

test('blocks double submission and discards results after account changes', async () => {
  const response = deferred();
  const fetchAll = async () => [];
  const hook = await mountHook(({ user }) => useMediaGenerations(user, fetchAll, async () => ready, fields), { user: 'a' });
  let work;
  act(() => {
    work = hook.value.start(draft, () => response.promise);
    void hook.value.start({ ...draft, id: 'duplicate' }, () => assert.fail('Duplicate request'));
  });
  assert.equal(hook.value.generations.length, 1);
  await hook.update({ user: 'b' });
  await act(async () => { response.resolve('old-result'); await work; });
  assert.deepEqual(hook.value.generations, []);
  await hook.close();
});

test('signed URLs do not mark an asset loaded; file errors can retry without regeneration', async () => {
  let count = 0;
  const getUrl = async () => `https://example.invalid/media?attempt=${++count}`;
  const hook = await mountHook(() => useGeneratedMedia('result.png', getUrl));
  assert.equal(hook.value.loaded, false);
  act(() => hook.value.onError());
  assert.ok(hook.value.error);
  await act(async () => hook.value.retry());
  assert.equal(count, 2);
  assert.equal(hook.value.loaded, false);
  act(() => hook.value.onLoad());
  assert.equal(hook.value.loaded, true);
  assert.equal(hook.value.error, null);
  await hook.close();
});
