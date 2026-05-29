import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 21+는 네이티브 Web Storage(localStorage)를 전역으로 노출하는데,
// 백업 파일(--localstorage-file) 없이 vitest jsdom 환경에서 동작하면
// jsdom의 window.localStorage를 clear/getItem 등이 없는 객체로 덮어쓴다.
// 현재 환경의 localStorage가 정상 Storage가 아니면 인메모리 구현으로 교체해
// Node 버전과 무관하게 테스트가 동작하도록 보장한다.
function ensureLocalStorage() {
  let current: Storage | undefined;
  try {
    current = window.localStorage;
  } catch {
    current = undefined;
  }
  if (current && typeof current.clear === 'function') return;

  const store = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: memory,
  });
}

ensureLocalStorage();

// jsdom에 matchMedia가 없으므로 기본 stub 제공.
// 개별 테스트에서 더 정교한 mock으로 덮어쓸 수 있다.
beforeEach(() => {
  ensureLocalStorage();
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
