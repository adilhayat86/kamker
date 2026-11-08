import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedPhotoUrl } from '../../src/lib/photo-asset.ts';

const publicId = 'kamker/professional-photos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const intent = { public_id: publicId, created_at: '2026-11-08T12:00:00Z', expires_at: '2026-11-08T12:15:00Z' };
const asset = { public_id: publicId, resource_type: 'image', type: 'upload', format: 'jpg', bytes: 200000, width: 800, height: 800, version: 123, created_at: '2026-11-08T12:01:00Z' };

test('constructs a JPEG delivery URL from verified metadata, ignoring a supplied arbitrary URL', () => {
  const url = verifiedPhotoUrl({ ...asset, secure_url: 'https://attacker.invalid/image.jpg' }, intent, 'synthetic-cloud');
  assert.equal(url, `https://res.cloudinary.com/synthetic-cloud/image/upload/v123/${publicId}.jpg`);
});
test('HEIC and HEIF assets use browser-compatible JPEG delivery', () => {
  for (const format of ['heic', 'heif']) assert.ok(verifiedPhotoUrl({ ...asset, format }, intent, 'synthetic-cloud').endsWith('.jpg'));
});
test('rejects foreign assets, unsupported types, oversized files and invalid metadata', () => {
  for (const change of [
    { public_id: 'another-account/photo' }, { resource_type: 'raw' }, { type: 'private' },
    { format: 'pdf' }, { format: 'svg' }, { bytes: 10485761 }, { bytes: 0 }, { bytes: '200' },
    { width: 0 }, { height: NaN }, { version: -1 }, { created_at: 'invalid' },
    { created_at: '2026-11-08T11:59:00Z' }, { created_at: '2026-11-08T12:16:00Z' },
  ]) assert.throws(() => verifiedPhotoUrl({ ...asset, ...change }, intent, 'synthetic-cloud'));
});
test('rejects malformed delivery paths and cloud names', () => {
  assert.throws(() => verifiedPhotoUrl(asset, intent, 'cloud/../../attacker'));
  const id = 'kamker/professional-photos/../foreign';
  assert.throws(() => verifiedPhotoUrl({ ...asset, public_id: id }, { ...intent, public_id: id }, 'synthetic-cloud'));
});
