"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { computeChart } from "./saju/calc";
import { analyze } from "./saju/analysis";
import { computeDaily } from "./fortune/daily";
import { isoDate, useAppState, type Profile } from "./store";

/** 자정이 지나거나 앱으로 돌아왔을 때 날짜를 다시 읽는다 */
export function useToday() {
  // 서버 프리렌더에서는 날짜를 읽지 않는다 (앱은 마운트 후에만 그려짐)
  const [today, setToday] = useState(() => (typeof window === "undefined" ? "" : isoDate(new Date())));
  useEffect(() => {
    const check = () => setToday((prev) => (isoDate(new Date()) !== prev ? isoDate(new Date()) : prev));
    const id = window.setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return today;
}

export const profileKey = (p: Profile) => `${p.createdAt}`;

export function useChart() {
  const profile = useAppState((s) => s.profile);
  const jasi = useAppState((s) => s.settings.jasi);
  return useMemo(() => {
    if (!profile) return null;
    const chart = computeChart(profile.birth, jasi);
    if (!chart) return null;
    return { profile, chart, analysis: analyze(chart) };
  }, [profile, jasi]);
}

export function useFortune(date: string) {
  const c = useChart();
  return useMemo(() => {
    if (!c) return null;
    const [y, m, d] = date.split("-").map(Number);
    return computeDaily(c.chart, profileKey(c.profile), y, m, d, c.analysis);
  }, [c, date]);
}

function subscribeMQ(q: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(q);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
}
const reducedSub = subscribeMQ("(prefers-reduced-motion: reduce)");

/** 설정값과 OS 설정을 함께 본 모션 수준 */
export function useMotionLevel(): "full" | "reduced" | "static" {
  const pref = useAppState((s) => s.settings.motion);
  const osReduced = useSyncExternalStore(
    reducedSub,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  if (pref === "static") return "static";
  if (pref === "reduced" || osReduced) return "reduced";
  return "full";
}

export type GpuTier = "high" | "low" | "none";
let tierCache: GpuTier | null = null;
export function detectTier(): GpuTier {
  if (tierCache) return tierCache;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return (tierCache = "none");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const weak =
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 3 ||
      nav.connection?.saveData === true;
    tierCache = weak ? "low" : "high";
  } catch {
    tierCache = "none";
  }
  return tierCache;
}

export function haptic(ms = 8) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
}
