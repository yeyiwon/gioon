import { useId } from "react";
import type { SockSpec } from "@/lib/fortune/daily";
import type { CharmKind } from "@/lib/fortune/items";
import type { Element } from "@/lib/saju/constants";

const SOCK_PATH: Record<SockSpec["shape"], string> = {
  ankle: "M30 40h32v26c0 5 3 8 8 10l18 6c9 3 11 15 2 19-5 2-11 2-17 1l-35-6c-12-2-19-10-19-22V40z",
  crew: "M30 14h32v52c0 5 3 8 8 10l18 6c9 3 11 15 2 19-5 2-11 2-17 1l-35-6c-12-2-19-10-19-22V14z",
  knee: "M30 2h32v64c0 5 3 8 8 10l18 6c9 3 11 15 2 19-5 2-11 2-17 1l-35-6c-12-2-19-10-19-22V2z",
};
const CUFF_TOP: Record<SockSpec["shape"], number> = { ankle: 40, crew: 14, knee: 2 };

/** 수집함·대체 화면용 양말 일러스트 */
export function SockArt({ spec, size = 96, shadow = true }: { spec: SockSpec; size?: number; shadow?: boolean }) {
  const id = useId().replace(/:/g, "");
  const top = CUFF_TOP[spec.shape];
  const b = spec.base.hex;
  const a = spec.accent.hex;
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 100 108" aria-hidden>
      <defs>
        <clipPath id={`c${id}`}>
          <path d={SOCK_PATH[spec.shape]} />
        </clipPath>
        <pattern id={`p${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          {spec.pattern === "stripe" && <rect width="12" height="4" fill={a} />}
          {spec.pattern === "dot" && <circle cx="6" cy="6" r="2" fill={a} />}
          {spec.pattern === "rib" && <rect width="3" height="12" fill="rgba(0,0,0,0.09)" />}
          {spec.pattern === "check" && <rect width="6" height="6" fill={a} opacity="0.6" />}
          {spec.pattern === "wave" && <path d="M0 6q3-4 6 0t6 0" stroke={a} strokeWidth="2" fill="none" />}
          {spec.pattern === "argyle" && <path d="M6 0l6 6-6 6-6-6z" fill={a} opacity="0.75" />}
        </pattern>
        <linearGradient id={`s${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      {shadow && <ellipse cx="52" cy="103" rx="36" ry="3.5" fill="rgba(60,45,25,0.12)" />}
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="108" fill={b} />
        <rect y={top + 8} width="100" height="100" fill={`url(#p${id})`} />
        <rect y={top} width="100" height="8" fill="rgba(0,0,0,0.08)" />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={28 + i * 3} y={top} width="1.2" height="8" fill="rgba(0,0,0,0.1)" />
        ))}
        <rect y={top + 7} width="100" height="2" fill={a} />
        <ellipse cx="32" cy="88" rx="16" ry="12" fill={a} />
        <path d="M82 75h30v40H82z" fill={a} />
        <rect width="100" height="108" fill={`url(#s${id})`} />
      </g>
    </svg>
  );
}

const CHARM_COLOR: Record<CharmKind, [string, string]> = {
  sprout: ["#9cbf83", "#5f8a49"],
  sun: ["#ffc46b", "#e48a3a"],
  pebble: ["#d8c7ae", "#a08670"],
  star: ["#eef1f5", "#9aa2ad"],
  marble: ["#b8d4ea", "#4f6f9a"],
  ribbon: ["#e8a3a0", "#b5605c"],
  gem: ["#c9b6ea", "#7a62a8"],
};

export function CharmArt({ kind, size = 56 }: { kind: CharmKind; size?: number }) {
  const id = useId().replace(/:/g, "");
  const [l, d] = CHARM_COLOR[kind];
  const grad = (
    <radialGradient id={`g${id}`} cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.25" stopColor={l} />
      <stop offset="1" stopColor={d} />
    </radialGradient>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>{grad}</defs>
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="rgba(60,45,25,0.14)" />
      {kind === "sprout" && (
        <g>
          <path d="M32 54V30" stroke="#6f9a57" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 34c-14 2-20-8-18-16 10-1 18 5 18 16z" fill={`url(#g${id})`} />
          <path d="M32 30c10-1 16-10 13-17-9 0-14 7-13 17z" fill={`url(#g${id})`} />
          <circle cx="22" cy="20" r="3" fill="#eaf6ff" opacity="0.9" />
        </g>
      )}
      {kind === "sun" && (
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="30" y="6" width="4" height="9" rx="2" fill={l} transform={`rotate(${i * 45} 32 30)`} />
          ))}
          <circle cx="32" cy="30" r="13" fill={`url(#g${id})`} />
        </g>
      )}
      {kind === "pebble" && <path d="M12 44c-2-12 9-22 22-21 13 1 20 9 18 19-1 8-10 12-20 12-11 0-19-3-20-10z" fill={`url(#g${id})`} />}
      {kind === "star" && (
        <path
          d="M32 8l6.5 14.5 15.5 1.6-11.6 10.5 3.3 15.4L32 42l-13.7 8 3.3-15.4L10 24.1l15.5-1.6z"
          fill={`url(#g${id})`}
          stroke={d}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}
      {kind === "marble" && (
        <g>
          <circle cx="32" cy="32" r="18" fill={`url(#g${id})`} />
          <path d="M20 36c6-8 16 2 24-6" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {kind === "ribbon" && (
        <g fill={`url(#g${id})`}>
          <path d="M32 30c-8-12-22-10-20 0 2 8 14 6 20 0z" />
          <path d="M32 30c8-12 22-10 20 0-2 8-14 6-20 0z" />
          <path d="M30 32l-8 20 6-2 4 5 2-23zM34 32l8 20-6-2-4 5-2-23z" />
          <circle cx="32" cy="30" r="4.5" fill={d} />
        </g>
      )}
      {kind === "gem" && (
        <g>
          <path d="M18 24l7-10h14l7 10-14 26z" fill={`url(#g${id})`} />
          <path d="M18 24h28M25 14l7 10 7-10M32 24v26" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" fill="none" />
        </g>
      )}
    </svg>
  );
}

const MASCOT: Record<Element, { c: string; d: string }> = {
  wood: { c: "#93dd4f", d: "#4fb83a" },
  fire: { c: "#ff6a2b", d: "#ffb21a" },
  earth: { c: "#ffc628", d: "#ffb800" },
  metal: { c: "#d7dbe4", d: "#8b7cff" },
  water: { c: "#4f7bff", d: "#1f3fc2" },
};

/** WebGL을 쓸 수 없을 때의 2D 마스코트 (3D와 같은 얼굴 세트) */
export function MascotArt({ element, size = 120 }: { element: Element; size?: number }) {
  const { c, d } = MASCOT[element];
  const body: Record<Element, string> = {
    wood: "M50 22c17 0 26 14 26 34 0 18-11 30-26 30S24 74 24 56c0-20 9-34 26-34z",
    fire: "M50 26c18 0 27 13 27 30 0 18-12 30-27 30S23 74 23 56c0-17 9-30 27-30z",
    earth: "M50 34c22 0 32 12 32 28 0 16-12 24-32 24S18 78 18 62c0-16 10-28 32-28z",
    metal: "M50 12l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z",
    water: "M50 12c10 18 28 32 28 50 0 15-12 26-28 26S22 77 22 62c0-18 18-32 28-50z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="90" rx="26" ry="4" fill="rgba(17,18,22,0.12)" />
      {element === "wood" && <path d="M50 24c-2-8-12-12-18-8 4 6 12 8 18 8zM50 24c2-9 12-12 18-7-4 6-12 8-18 7z" fill={d} />}
      {element === "fire" && <path d="M50 30c-8-6-4-18 0-22 4 6 10 12 0 22zM38 32c-6-2-6-10-4-13 3 3 7 7 4 13zM62 32c6-2 6-10 4-13-3 3-7 7-4 13z" fill={d} />}
      {element === "earth" && <><circle cx="36" cy="35" r="6" fill={d} /><circle cx="64" cy="35" r="6" fill={d} /></>}
      <path d={body[element]} fill={c} />
      <ellipse cx="42" cy="58" rx="3.4" ry="4.4" fill="#1a1420" />
      <ellipse cx="58" cy="58" rx="3.4" ry="4.4" fill="#1a1420" />
      <circle cx="43.2" cy="56.5" r="1.2" fill="#fff" />
      <circle cx="59.2" cy="56.5" r="1.2" fill="#fff" />
      <ellipse cx="35" cy="64" rx="4" ry="2.4" fill="#ff7fa8" opacity="0.8" />
      <ellipse cx="65" cy="64" rx="4" ry="2.4" fill="#ff7fa8" opacity="0.8" />
      <path d="M46 64q4 4 8 0" stroke="#1a1420" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {element === "metal" && <path d="M76 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill={d} />}
    </svg>
  );
}

/** 3D를 끈 환경의 선물 상자 */
export function GiftArt({ ribbon, size = 150 }: { ribbon: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="90" rx="38" ry="4" fill="rgba(60,45,25,0.14)" />
      <rect x="16" y="42" width="68" height="46" rx="4" fill="#c9a57b" />
      <rect x="16" y="42" width="68" height="6" fill="rgba(0,0,0,0.08)" />
      <rect x="12" y="32" width="76" height="14" rx="3" fill="#d2b088" />
      <rect x="45" y="32" width="10" height="56" fill={ribbon} />
      <path d="M50 32c-8-12-22-10-20-2 2 6 12 5 20 2zM50 32c8-12 22-10 20-2-2 6-12 5-20 2z" fill={ribbon} />
      <circle cx="50" cy="31" r="3.5" fill={ribbon} />
    </svg>
  );
}
