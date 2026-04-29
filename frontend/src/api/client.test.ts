import { describe, expect, test } from 'vitest';
import { buildApiBaseUrl } from './client';

describe('buildApiBaseUrl', () => {
  test('falls back to the same-origin API path when no env override is present', () => {
    expect(buildApiBaseUrl({} as unknown as ImportMetaEnv)).toBe('/api/v1');
  });

  test('trims a trailing slash from the configured API base URL', () => {
    expect(
      buildApiBaseUrl({
        VITE_API_BASE_URL: 'https://asiamath-api.up.railway.app/api/v1/',
      } as unknown as ImportMetaEnv)
    ).toBe('https://asiamath-api.up.railway.app/api/v1');
  });
});
