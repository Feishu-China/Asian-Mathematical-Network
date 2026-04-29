import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('frontend vercel config', () => {
  test('rewrites browser routes to index.html for the Vite SPA', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));

    expect(config).toEqual({
      rewrites: [{ source: '/(.*)', destination: '/index.html' }],
    });
  });
});
