"use client";
import { useSyncExternalStore } from "react";
import type { BirthInput, JasiRule } from "./saju/calc";
import type { Element } from "./saju/constants";
import type { CharmKind } from "./fortune/items";
import type { SockSpec } from "./fortune/daily";

export interface Profile {
  name: string;
  gender: "female" | "male" | "none";
  birth: BirthInput;
  createdAt: number;
}

export type MotionPref = "auto" | "reduced" | "static";

export interface DayRecord {
  /** 오늘 처음 연 시각 */
  openedAt: number;
  need: Element;
  pillarKo: string;
  sock: SockSpec;
  charm: CharmKind;
  boxOpened?: boolean;
  mood?: Mood;
  sticker?: Sticker;
}
export type Mood = "sunny" | "breeze" | "cloud" | "rain" | "storm";
export type Sticker = "star" | "clover" | "heart" | "ribbon";

export interface Friend {
  id: string;
  name: string;
  relation: "friend" | "partner" | "coworker" | "family";
  birth: BirthInput;
}

export interface AppState {
  v: 1;
  profile: Profile | null;
  /** 궁합을 본 지인 (이 기기에만 저장) */
  friends?: Friend[];
  settings: { motion: MotionPref; jasi: JasiRule; notify: boolean; notifyTime: string };
  days: Record<string, DayRecord>;
}

const KEY = "gioon:v1";
const initial: AppState = {
  v: 1,
  profile: null,
  settings: { motion: "auto", jasi: "split", notify: false, notifyTime: "08:00" },
  days: {},
};

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.v === 1) state = { ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } };
    }
  } catch {
    // 손상된 저장값은 무시하고 새로 시작
  }
}

export function getState() {
  load();
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 공간이 없어도 화면은 계속 동작
  }
  listeners.forEach((l) => l());
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  state = initial;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppState<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(getState()),
    () => sel(initial),
  );
}

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
