"use client";
import { createContext, useContext } from "react";
import type { Quality } from "@/three/common";

export type Screen = "today" | "chart" | "calendar" | "shelf" | "settings";

export interface Env {
  /** null = 3D를 쓰지 않음(정적 대체 화면) */
  quality: Quality | null;
  go: (s: Screen) => void;
  screen: Screen;
}
export const EnvCtx = createContext<Env>({ quality: null, go: () => {}, screen: "today" });
export const useEnv = () => useContext(EnvCtx);
