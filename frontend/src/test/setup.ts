import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

const createStorage = () => {
  const store = new Map<string, string>();

  return {
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    get length() {
      return store.size;
    },
  };
};

const storage = createStorage();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: storage,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage,
});

afterEach(() => {
  cleanup();
  storage.clear();
});
