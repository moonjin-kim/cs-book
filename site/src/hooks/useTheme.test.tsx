import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';

function setMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.push(l),
      removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => {
        const i = listeners.indexOf(l);
        if (i >= 0) listeners.splice(i, 1);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return {
    fire(newMatches: boolean) {
      listeners.forEach((l) => l({ matches: newMatches } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.length,
  };
}

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it("localStorage가 비어 있으면 기본값은 'light'", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.pref).toBe('light');
  });

  it("저장된 'light'/'dark'를 그대로 읽는다", () => {
    window.localStorage.setItem('cs-notes-theme', 'dark');
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.pref).toBe('dark');
  });

  it("system 모드는 prefers-color-scheme: dark를 따라 data-theme를 적용", () => {
    window.localStorage.setItem('cs-notes-theme', 'system');
    setMatchMedia(true); // OS = dark
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it("system 모드에서 OS가 light면 data-theme도 light", () => {
    window.localStorage.setItem('cs-notes-theme', 'system');
    setMatchMedia(false); // OS = light
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it("light 선호는 OS와 무관하게 data-theme=light", () => {
    window.localStorage.setItem('cs-notes-theme', 'light');
    setMatchMedia(true); // OS는 dark지만 무시
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it("cycle은 light → dark → system → light 순으로 순환", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.pref).toBe('light');

    act(() => result.current.cycle());
    expect(result.current.pref).toBe('dark');

    act(() => result.current.cycle());
    expect(result.current.pref).toBe('system');

    act(() => result.current.cycle());
    expect(result.current.pref).toBe('light');
  });

  it("pref 변경은 localStorage에 저장된다", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.cycle()); // light → dark
    expect(window.localStorage.getItem('cs-notes-theme')).toBe('dark');
    act(() => result.current.cycle()); // dark → system
    expect(window.localStorage.getItem('cs-notes-theme')).toBe('system');
  });

  it("system 모드일 때만 matchMedia change 리스너를 등록한다", () => {
    const mm = setMatchMedia(false);
    const { result, unmount } = renderHook(() => useTheme());
    expect(mm.listenerCount()).toBe(0);

    // light → dark는 여전히 리스너 없음
    act(() => result.current.cycle());
    expect(mm.listenerCount()).toBe(0);

    // dark → system으로 바꾸면 리스너 등록
    act(() => result.current.cycle());
    expect(mm.listenerCount()).toBe(1);

    unmount();
  });

  it("system 모드에서 OS 테마 변경 이벤트가 data-theme를 갱신한다", () => {
    const mm = setMatchMedia(false);
    window.localStorage.setItem('cs-notes-theme', 'system');
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // OS를 dark로 전환
    act(() => {
      setMatchMedia(true);
      mm.fire(true);
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
