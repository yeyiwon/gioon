"use client";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import type { Element } from "@/lib/saju/constants";
import type { SockSpec } from "@/lib/fortune/daily";
import { Burst, FitCamera, Gather, QualityCtx, Rig, Spinner, useAppear, useQuality, type Quality } from "./common";
import { Character } from "./character";
import { GiftBox } from "./sock";
import { kick, type Touch3D } from "./interact";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

/** 오행별 림라이트·그림자·입자 색 */
const ELEMENT_LOOK: Record<Element, { rim: string; shadow: string; glow: string }> = {
  wood: { rim: "#d8ffb0", shadow: "#2e6b12", glow: "#6fcf3f" },
  fire: { rim: "#ffd0a8", shadow: "#8a2a05", glow: "#ff8a1f" },
  earth: { rim: "#fff0b0", shadow: "#7a5200", glow: "#ffb800" },
  metal: { rim: "#d9d2ff", shadow: "#3a2fa0", glow: "#8b7cff" },
  water: { rim: "#bcd0ff", shadow: "#0f2a9e", glow: "#2f5bff" },
};

/**
 * 3D 섬: 각 3D 영역이 자기 자리(DOM 흐름) 안에 캔버스를 갖는다.
 * 고정 캔버스 하나를 스크롤 위치에 맞춰 옮기던 방식은 모바일에서 한 박자 늦게 따라왔다.
 * 화면 밖이거나 탭이 숨겨지면 렌더링을 멈춘다.
 */
export function Island({ quality, className, style, children }: { quality: Quality; className?: string; style?: CSSProperties; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const mobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const deviceDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const maxDpr = Math.min(deviceDpr, quality.tier === "low" ? 1.5 : mobile ? 2 : 2);
  // 레티나에서 1배까지 떨어지면 캐릭터 가장자리가 뭉개지므로 하한을 둔다
  const minDpr = Math.min(deviceDpr, 1.5);
  const [dpr, setDpr] = useState(maxDpr);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    const vis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  const loop = !inView || !pageVisible ? "never" : quality.motion === "full" ? "always" : "demand";
  useEffect(() => {
    // demand 모드에서도 그림자·환경맵이 자리 잡을 때까지 몇 프레임은 그린다
    if (loop === "demand") kick(1000);
  }, [loop]);
  return (
    <div ref={ref} className={className} style={style}>
      <Canvas
        frameloop={loop}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // 입력은 바깥 DOM(Frame)이 받는다 → 세로 스크롤을 막지 않음
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <QualityCtx.Provider value={quality}>
          <PerformanceMonitor
            bounds={() => [45, 58]}
            flipflops={3}
            onDecline={() => setDpr((d) => Math.max(minDpr, d - 0.25))}
            onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
          />
          {children}
        </QualityCtx.Provider>
      </Canvas>
    </div>
  );
}

function Appear({ start, children }: { start: RefObject<number>; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const scale = useAppear(start);
  useFrame(() => {
    if (g.current) g.current.scale.setScalar(scale());
  });
  return <group ref={g}>{children}</group>;
}

function StartClock({ start }: { start: RefObject<number> }) {
  useFrame(() => {
    if (start.current < 0) start.current = performance.now();
  });
  return null;
}

interface ViewBase {
  touch: RefObject<Touch3D>;
  quality: Quality;
  className?: string;
  style?: CSSProperties;
}

/** 오늘의 기운 마스코트 */
export function HeroView({ element, introStart, touch, quality, className, style }: ViewBase & { element: Element; introStart: number }) {
  const look = ELEMENT_LOOK[element];
  // 연출 시계는 3D가 실제로 첫 프레임을 그린 순간부터 잰다 (청크 로딩·셰이더 컴파일 시간 제외)
  const start = useRef(introStart > 0 ? -1 : 0);
  return (
    <Island quality={quality} className={className} style={style}>
      <QualityCtx.Provider value={quality}>
        <PerspectiveCamera makeDefault position={[0, 0.8, 2.7]} fov={30} />
        <FitCamera base={2.7} y={0.8} target={0.82} lookY={0.5} />
        <Rig warm="#ffffff" cool={look.rim} shadowY={0} shadowColor={look.shadow} />
        <StartClock start={start} />
        <Gather start={start} color={look.glow} count={quality.tier === "high" ? 220 : 110} />
        <Appear start={start}>
          <Character element={element} touch={touch} />
        </Appear>
        <Burst touch={touch} color={look.glow} y={0.6} />
      </QualityCtx.Provider>
    </Island>
  );
}

/** 오늘의 양말 언박싱 */
export function GiftView({ spec, ribbon, box, openAt, touch, quality, className, style }: ViewBase & { spec: SockSpec; ribbon: string; box: string; openAt: number | null }) {
  return (
    <Island quality={quality} className={className} style={style}>
      <QualityCtx.Provider value={quality}>
        <PerspectiveCamera makeDefault position={[0, 0.9, 3.7]} fov={30} />
        <FitCamera base={4.1} y={0.7} target={1} lookY={0.12} />
        <Rig shadowY={-0.62} shadowColor="#5a5f70" />
        <Spinner touch={touch} idle={0} bounce={0.6}>
          <GiftBox spec={spec} openAt={openAt} ribbonColor={ribbon} boxColor={box} />
        </Spinner>
        <Burst touch={touch} color={ribbon} y={0.7} />
      </QualityCtx.Provider>
    </Island>
  );
}

/** 선택한 오행의 마스코트 (나의 사주) */
export function CharacterView({ element, touch, quality, className, style }: ViewBase & { element: Element }) {
  const look = ELEMENT_LOOK[element];
  return (
    <Island quality={quality} className={className} style={style}>
      <QualityCtx.Provider value={quality}>
        <PerspectiveCamera makeDefault position={[0, 0.9, 3.2]} fov={30} />
        <FitCamera base={3.2} y={0.9} target={0.9} lookY={0.46} />
        <Rig warm="#ffffff" cool={look.rim} shadowY={0} shadowColor={look.shadow} />
        <Pop key={element}>
          <Character element={element} touch={touch} />
        </Pop>
        <Burst touch={touch} color={look.glow} y={0.6} />
      </QualityCtx.Provider>
    </Island>
  );
}

/** 오행이 바뀔 때 튀어 오르며 등장 */
function Pop({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef(-1);
  useFrame(() => {
    if (!g.current) return;
    if (t0.current < 0) t0.current = performance.now();
    const k = Math.min((performance.now() - t0.current) / 520, 1);
    const s = 1 - Math.exp(-7 * k) * Math.cos(11 * k);
    g.current.scale.setScalar(Math.max(0.001, s));
    g.current.rotation.y = (1 - k) * (1 - k) * -1.6;
  });
  return <group ref={g}>{children}</group>;
}

/** 온보딩: 다섯 마스코트 라인업 */
export function LineupView({ touch, quality, className, style }: ViewBase) {
  const order: Element[] = ["wood", "fire", "earth", "metal", "water"];
  return (
    <Island quality={quality} className={className} style={style}>
      <QualityCtx.Provider value={quality}>
        <PerspectiveCamera makeDefault position={[0, 1.1, 6]} fov={28} />
        <FitCamera base={4.6} y={1.0} target={2.1} lookY={0.5} />
        <Rig warm="#ffffff" cool="#dfe6ff" shadowY={0} shadowColor="#40465a" scale={7} />
        {order.map((e, i) => (
          <group key={e} position={[(i - 2) * 0.82, 0, i % 2 ? -0.45 : 0.15]} rotation={[0, (2 - i) * 0.14, 0]}>
            <Bob i={i}>
              <Character element={e} touch={touch} scale={0.92} />
            </Bob>
          </group>
        ))}
      </QualityCtx.Provider>
    </Island>
  );
}

/** 라인업 캐릭터가 순서대로 통통 튀는 리듬 */
function Bob({ i, children }: { i: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const { motion } = useQuality();
  useFrame(({ clock }) => {
    if (!g.current || motion !== "full") return;
    const t = (clock.elapsedTime * 0.9 - i * 0.18) % 2.4;
    g.current.position.y = t > 0 && t < 0.4 ? Math.sin((t / 0.4) * Math.PI) * 0.18 : 0;
  });
  return <group ref={g}>{children}</group>;
}
