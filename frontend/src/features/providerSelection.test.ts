import { afterEach, describe, expect, test, vi } from 'vitest';

const loadConferenceModules = async () => {
  vi.resetModules();
  return Promise.all([
    import('./conference/conferenceProvider'),
    import('./conference/fakeConferenceProvider'),
    import('./conference/httpConferenceProvider'),
  ]);
};

const loadGrantModules = async () => {
  vi.resetModules();
  return Promise.all([
    import('./grant/grantProvider'),
    import('./grant/fakeGrantProvider'),
    import('./grant/httpGrantProvider'),
  ]);
};

const loadDashboardModules = async () => {
  vi.resetModules();
  return Promise.all([
    import('./dashboard/dashboardProvider'),
    import('./dashboard/fakeDashboardProvider'),
    import('./dashboard/httpDashboardProvider'),
  ]);
};

const loadProfileModules = async () => {
  vi.resetModules();
  return Promise.all([
    import('./profile/profileProvider'),
    import('./profile/fakeProfileProvider'),
    import('./profile/httpProfileProvider'),
  ]);
};

const stubRuntimeEnv = (demoMode?: string) => {
  vi.stubEnv('MODE', 'development');
  vi.stubEnv('VITEST', '');

  if (demoMode === undefined) {
    vi.unstubAllEnvs();
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITEST', '');
    return;
  }

  vi.stubEnv('VITE_DEMO_MODE', demoMode);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('runtime provider selection', () => {
  test('uses fake providers when VITE_DEMO_MODE is true', async () => {
    stubRuntimeEnv('true');

    const [
      [{ conferenceProvider }, { fakeConferenceProvider }],
      [{ grantProvider }, { fakeGrantProvider }],
      [{ dashboardProvider }, { fakeDashboardProvider }],
      [{ profileProvider }, { fakeProfileProvider }],
    ] = await Promise.all([
      loadConferenceModules(),
      loadGrantModules(),
      loadDashboardModules(),
      loadProfileModules(),
    ]);

    expect(conferenceProvider).toBe(fakeConferenceProvider);
    expect(grantProvider).toBe(fakeGrantProvider);
    expect(dashboardProvider).toBe(fakeDashboardProvider);
    expect(profileProvider).toBe(fakeProfileProvider);
  });

  test('uses http providers when VITE_DEMO_MODE is not enabled', async () => {
    stubRuntimeEnv();

    const [
      [{ conferenceProvider }, , { httpConferenceProvider }],
      [{ grantProvider }, , { httpGrantProvider }],
      [{ dashboardProvider }, , { httpDashboardProvider }],
      [{ profileProvider }, , { httpProfileProvider }],
    ] = await Promise.all([
      loadConferenceModules(),
      loadGrantModules(),
      loadDashboardModules(),
      loadProfileModules(),
    ]);

    expect(conferenceProvider).toBe(httpConferenceProvider);
    expect(grantProvider).toBe(httpGrantProvider);
    expect(dashboardProvider).toBe(httpDashboardProvider);
    expect(profileProvider).toBe(httpProfileProvider);
  });
});
