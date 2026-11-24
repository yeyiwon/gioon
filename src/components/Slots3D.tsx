"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Element } from "@/lib/saju/constants";
import type { SockSpec } from "@/lib/fortune/daily";
import { useTouch3D } from "@/three/interact";
import { useEnv } from "./env";
import { MascotArt, GiftArt, SockArt } from "./ItemArt";

const HeroView = dynamic(() => import("@/three/views").then((m) => m.HeroView), { ssr: false });
const GiftView = dynamic(() => import("@/three/views").then((m) => m.GiftView), { ssr: false });
const CharacterView = dynamic(() => import("@/three/views").then((m) => m.CharacterView), { ssr: false });
const LineupView = dynamic(() => import("@/three/views").then((m) => m.LineupView), { ssr: false });

const fill: CSSProperties = { position: "absolute", inset: 0 };

function Frame({
  label,
  className,
  style,
  touchRef,
  children,
}: {
  label: string;
  className?: string;
  style?: CSSProperties;
  touchRef?: React.Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      ref={touchRef}
      className={className}
      style={{ position: "relative", touchAction: "pan-y", userSelect: "none", WebkitUserSelect: "none", ...style }}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function HeroSlot({ element, introStart, onTap, className, style }: { element: Element; introStart: number; onTap?: () => void; className?: string; style?: CSSProperties }) {
  const { quality } = useEnv();
  const { ref, touch } = useTouch3D(onTap, !!quality);
  if (!quality)
    return (
      <div className={className} style={{ ...style, display: "grid", placeItems: "center" }}>
        <MascotArt element={element} size={150} />
      </div>
    );
  return (
    <Frame label="오늘의 기운 캐릭터. 눌러 보거나 옆으로 끌어 보세요" className={className} style={style} touchRef={ref}>
      <HeroView element={element} introStart={introStart} touch={touch} quality={quality} style={fill} />
    </Frame>
  );
}

export function GiftSlot({
  spec,
  ribbon,
  box,
  openAt,
  onTap,
  className,
  style,
}: {
  spec: SockSpec;
  ribbon: string;
  box: string;
  openAt: number | null;
  onTap?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const { quality } = useEnv();
  const { ref, touch } = useTouch3D(onTap, !!quality);
  if (!quality)
    return (
      <button className={className} style={{ ...style, display: "grid", placeItems: "center" }} onClick={onTap} aria-label="오늘의 양말">
        {openAt ? <SockArt spec={spec} size={170} /> : <GiftArt ribbon={ribbon} size={170} />}
      </button>
    );
  return (
    <Frame label={openAt ? "오늘의 양말. 옆으로 끌어 돌려 보세요" : "선물 상자. 눌러서 열어 보세요"} className={className} style={style} touchRef={ref}>
      <GiftView spec={spec} ribbon={ribbon} box={box} openAt={openAt} touch={touch} quality={quality} style={fill} />
    </Frame>
  );
}

export function CharacterSlot({ element, className, style }: { element: Element; className?: string; style?: CSSProperties }) {
  const { quality } = useEnv();
  const { ref, touch } = useTouch3D(undefined, !!quality);
  if (!quality)
    return (
      <div className={className} style={{ ...style, display: "grid", placeItems: "center" }}>
        <MascotArt element={element} size={150} />
      </div>
    );
  return (
    <Frame label="오행 캐릭터. 눌러 보거나 옆으로 끌어 보세요" className={className} style={style} touchRef={ref}>
      <CharacterView element={element} touch={touch} quality={quality} style={fill} />
    </Frame>
  );
}

export function LineupSlot({ className, style }: { className?: string; style?: CSSProperties }) {
  const { quality } = useEnv();
  const { ref, touch } = useTouch3D(undefined, !!quality);
  if (!quality)
    return (
      <div className={className} style={{ ...style, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4 }}>
        {(["wood", "fire", "earth", "metal", "water"] as Element[]).map((e) => (
          <MascotArt key={e} element={e} size={64} />
        ))}
      </div>
    );
  return (
    <Frame label="다섯 오행 캐릭터. 눌러 보세요" className={className} style={style} touchRef={ref}>
      <LineupView touch={touch} quality={quality} style={fill} />
    </Frame>
  );
}

export function SockThumbSlot({ spec, className }: { spec: SockSpec; seed?: number; className?: string }) {
  const { quality } = useEnv();
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!quality) return;
    let alive = true;
    // 3D 모듈은 필요할 때만 불러온다
    import("@/three/snapshot").then((m) => alive && setSrc(m.sockThumb(spec)));
    return () => {
      alive = false;
    };
  }, [spec, quality]);
  if (!quality || !src) return <span className={className} style={{ display: "grid", placeItems: "center" }}><SockArt spec={spec} size={46} /></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt="" draggable={false} style={{ objectFit: "contain", width: "100%", height: "100%" }} />;
}
