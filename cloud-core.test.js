import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeChecks, remoteImagePath, uploadCandidates, needsRawDownload, needsRemoteImage } from './cloud-core.js';

test('mergeChecks preserves checks from both devices and keeps the newest version', () => {
  const merged = mergeChecks(
    [{ id: 'shared', updatedAt: '2026-08-01T10:00:00Z', amount: 30 }, { id: 'remote', updatedAt: '2026-08-01T10:00:00Z', amount: 20 }],
    [{ id: 'shared', updatedAt: '2026-08-01T11:00:00Z', amount: 35 }, { id: 'local', updatedAt: '2026-08-01T10:00:00Z', amount: 10 }]
  );
  assert.deepEqual(merged.map((check) => [check.id, check.amount]), [['local', 10], ['remote', 20], ['shared', 35]]);
});

test('remoteImagePath files an image under its purchase month', () => {
  assert.equal(remoteImagePath({ id: 'abc', month: '2026-08', imageType: 'image/jpeg' }), 'checks/2026-08/abc.jpg');
});

test('uploadCandidates keeps the local Blob-bearing check for upload', () => {
  const image = { blob: true };
  const candidates = uploadCandidates([], [{ id: 'abc', updatedAt: '2026-08-01T11:00:00Z', image }]);
  assert.equal(candidates[0].image, image);
});

test('needsRawDownload handles GitHub API files over one megabyte', () => {
  assert.equal(needsRawDownload({ encoding: 'none', content: '', size: 3002899 }), true);
  assert.equal(needsRawDownload({ encoding: 'base64', content: 'YWJj', size: 3 }), false);
});

test('needsRemoteImage replaces a broken zero-byte local image', () => {
  assert.equal(needsRemoteImage({ image: { size: 0 } }), true);
  assert.equal(needsRemoteImage({ image: { size: 12 } }), false);
  assert.equal(needsRemoteImage(undefined), true);
});
