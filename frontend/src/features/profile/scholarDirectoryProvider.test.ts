import { beforeEach, describe, expect, it } from 'vitest';
import { resetProfileFakeState, seedProfileFakeState } from './fakeProfileProvider';
import { scholarDirectoryProvider } from './scholarDirectoryProvider';

describe('scholarDirectoryProvider', () => {
  beforeEach(() => {
    resetProfileFakeState();
  });

  it('includes the editable public profile at the front of the hybrid directory list', async () => {
    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(result.scholars[0].slug).toBe('alice-chen-demo');
    expect(result.scholars[0].fullName).toBe('Alice Chen');
    expect(result.clusters.map((item) => item.label)).toContain('Algebraic Geometry');
  });

  it('omits the editable profile when public visibility is turned off', async () => {
    seedProfileFakeState({ isProfilePublic: false });

    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(result.scholars.find((item) => item.slug === 'alice-chen-demo')).toBeUndefined();
  });
});
