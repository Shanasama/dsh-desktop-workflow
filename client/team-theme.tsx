import React, { useSyncExternalStore } from 'react';

export type TeamTheme = 'arknights' | 'classic';
// This store contains a visual preference only. Never put setup or credentials here.
export const TEAM_THEME_STORAGE_KEY = 'dsh-desktop-workflow:ui-theme:v1';
const DEFAULT_THEME: TeamTheme = 'arknights';
const listeners = new Set<() => void>();
let theme: TeamTheme = DEFAULT_THEME;
let initialized = false;
let unsavedPreference = false;
const validTheme = (value: unknown): value is TeamTheme => value === 'arknights' || value === 'classic';

function readStoredTheme(): TeamTheme | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const value = window.localStorage.getItem(TEAM_THEME_STORAGE_KEY);
    return validTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return undefined; // Private/embedded windows may deny even access to localStorage.
  }
}
function getSnapshot(): TeamTheme {
  if (!initialized) { theme = readStoredTheme() ?? DEFAULT_THEME; initialized = true; }
  return theme;
}
function publish(next: TeamTheme) {
  if (theme === next) return;
  theme = next;
  listeners.forEach(listener => listener());
}
function onStorage(event: StorageEvent) {
  if (event.key !== TEAM_THEME_STORAGE_KEY && event.key !== null) return;
  // Ignore sessionStorage and other storage areas, when one is provided.
  try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
  unsavedPreference = false;
  publish(validTheme(event.newValue) ? event.newValue : DEFAULT_THEME);
}
function subscribe(listener: () => void) {
  const first = listeners.size === 0;
  listeners.add(listener);
  if (first && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
    // Catch changes made in another window while both plugin surfaces were closed.
    if (!unsavedPreference) publish(readStoredTheme() ?? theme);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
export function setTeamTheme(next: TeamTheme) {
  if (!validTheme(next)) return;
  getSnapshot();
  try {
    if (typeof window === 'undefined') throw new Error('No browser storage');
    window.localStorage.setItem(TEAM_THEME_STORAGE_KEY, next);
    unsavedPreference = false;
  } catch {
    // Still works and stays in sync for this loaded plugin when persistence is denied.
    unsavedPreference = true;
  }
  publish(next);
}
export function useTeamTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_THEME);
}
export function TeamThemeSwitch({ theme }: { theme: TeamTheme }) {
  return <label className="tm-theme-switch"><span>风格</span><select aria-label="界面风格" value={theme} onChange={event => setTeamTheme(event.target.value as TeamTheme)}><option value="arknights">泰拉</option><option value="classic">原版 UI</option></select></label>;
}
