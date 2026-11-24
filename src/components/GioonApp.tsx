"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { ELEMENT_INFO, type Element } from "@/lib/saju/constants";
import { detectTier, useFortune, useMotionLevel, useToday, type GpuTier } from "@/lib/hooks";
import { useAppState } from "@/lib/store";
import { IconCalendar, IconPillars, IconSettings, IconShelf, IconToday } from "./icons";
import Onboarding from "./Onboarding";
import Today from "./screens/Today";
import MyChart from "./screens/MyChart";
import Calendar from "./screens/Calendar";
import Shelf from "./screens/Shelf";
import Settings from "./screens/Settings";
import type { Quality } from "@/three/common";
import { EnvCtx, type Screen } from "./env";

const Stage = dynamic(() => import("@/three/views"), { ssr: false });

const SCREENS: Screen[] = ["today", "chart", "calendar", "shelf", "settings"];

function readHash(): Screen {
  const h = window.location.hash.slice(1) as Screen;
  return SCREENS.includes(h) ? h : "today";
}
const subHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

const NAV: { id: Screen; label: string; Icon: typeof IconToday }[] = [
  { id: "today", label: "오늘", Icon: IconToday },
  { id: "chart", label: "사주", Icon: IconPillars },
  { id: "calendar", label: "달력", Icon: IconCalendar },
  { id: "shelf", label: "수집함", Icon: IconShelf },
  { id: "settings", label: "설정", Icon: IconSettings },
];

function Nav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <nav className="nav" aria-label="주요 화면">
      {NAV.map(({ id, label, Icon }) => {
        const on = screen === id;
        return (
          <button key={id} className="nav-item" aria-current={on ? "page" : undefined} onClick={() => go(id)} data-nav={id}>
            {on && <motion.span layoutId="nav-blob" className="nav-blob" transition={{ type: "spring", stiffness: 520, damping: 34 }} />}
            <motion.span
              animate={{ scale: on ? 1.08 : 1, y: on ? -1 : 0, rotate: on ? [0, -12, 8, 0] : 0 }}
              transition={{ scale: { type: "spring", stiffness: 520, damping: 18 }, y: { type: "spring", stiffness: 520, damping: 18 }, rotate: { duration: 0.35, ease: "easeOut" } }}
              style={{ display: "grid", height: 30, placeItems: "center" }}
            >
              <Icon size={22} strokeWidth={on ? 2.2 : 1.8} />
            </motion.span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function useElementTheme(e: Element | null) {
  useEffect(() => {
    if (!e) return;
    const s = document.documentElement.style;
    const info = ELEMENT_INFO[e];
    s.setProperty("--el", info.color);
    s.setProperty("--el-ink", info.ink);
    s.setProperty("--el-soft", info.soft);
    s.setProperty("--el-on", info.on);
  }, [e]);
}

export default function GioonApp() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useAppState((s) => s.profile);
  const screen = useSyncExternalStore(subHash, readHash, () => "today" as Screen);
  const motionLevel = useMotionLevel();
  const [tier] = useState<GpuTier>(() => (typeof window === "undefined" ? "high" : detectTier()));
  const today = useToday();
  const fortune = useFortune(today);
  useElementTheme(fortune?.need ?? null);

  const go = (s: Screen) => {
    if (s === screen) {
      window.scrollTo({ top: 0, behavior: motionLevel === "full" ? "smooth" : "auto" });
      return;
    }
    window.location.hash = s === "today" ? "" : s;
    if (s === "today") history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
  };

  const quality: Quality | null = useMemo(
    () => (tier === "none" || motionLevel === "static" ? null : { tier, motion: motionLevel === "full" ? "full" : "reduced" }),
    [tier, motionLevel],
  );

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  if (!mounted) return <div id="app" />;

  const active3d = !profile || screen === "today" || screen === "chart" || screen === "calendar" || screen === "shelf";
  let body: ReactNode;
  if (!profile) body = <Onboarding />;
  else
    body = (
      <AnimatePresence mode="wait">
        <motion.main
          key={screen}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          {screen === "today" && <Today key={today} date={today} />}
          {screen === "chart" && <MyChart />}
          {screen === "calendar" && <Calendar today={today} />}
          {screen === "shelf" && <Shelf />}
          {screen === "settings" && <Settings />}
        </motion.main>
      </AnimatePresence>
    );

  return (
    <MotionConfig reducedMotion={motionLevel === "full" ? "never" : "always"}>
      <EnvCtx.Provider value={{ quality, go, screen }}>
        <LayoutGroup>
          <div id="app">
            {body}
            {profile && <Nav screen={screen} go={go} />}
          </div>
        </LayoutGroup>
        {quality && <Stage quality={quality} active={active3d} />}
      </EnvCtx.Provider>
    </MotionConfig>
  );
}
