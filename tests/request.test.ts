import { it, expect } from 'vitest';
import { readLocalJson } from '../src/lib/validation/request';
it('accepts local browser origin when Next internal URL uses its bind address', async () => {
  const r = new Request('http://0.0.0.0:3100/api/rationales', {
    method: 'POST',
    headers: {
      host: 'localhost:3100',
      origin: 'http://localhost:3100',
      'content-type': 'application/json',
    },
    body: '{"text":"review"}',
  });
  expect(await readLocalJson(r)).toEqual({ text: 'review' });
});
it('rejects a different browser origin', async () => {
  const r = new Request('http://0.0.0.0:3100/api/rationales', {
    method: 'POST',
    headers: {
      host: 'localhost:3100',
      origin: 'http://other.example',
      'content-type': 'application/json',
    },
    body: '{}',
  });
  await expect(readLocalJson(r)).rejects.toThrow('Cross-origin');
});
it('rejects invalid JSON and oversized content', async () => {
  await expect(
    readLocalJson(
      new Request('http://localhost/api', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid',
      }),
    ),
  ).rejects.toThrow();
  await expect(
    readLocalJson(
      new Request('http://localhost/api', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: ' '.repeat(24001),
      }),
    ),
  ).rejects.toThrow('too large');
});
