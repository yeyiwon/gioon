import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, strokeWidth: number | string = 1.8): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const IconToday = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <path d="M4 17h16" />
    <path d="M7 17a5 5 0 0 1 10 0" />
    <path d="M12 6.5V8.5M6.2 9.2l1.3 1.3M17.8 9.2l-1.3 1.3" />
  </svg>
);
export const IconPillars = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <rect x="4" y="5" width="3" height="14" rx="1.5" />
    <rect x="10.5" y="5" width="3" height="14" rx="1.5" />
    <rect x="17" y="5" width="3" height="14" rx="1.5" />
  </svg>
);
export const IconCalendar = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <rect x="4" y="5.5" width="16" height="14" rx="3" />
    <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    <circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconShelf = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <path d="M4 4.5h16v15H4z" />
    <path d="M4 12h16" />
    <circle cx="8" cy="9.5" r="1.6" />
    <path d="M13 10.5l1.5-3 1.5 3z" />
    <rect x="7" y="14.5" width="3" height="3" rx="0.8" />
  </svg>
);
export const IconSettings = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <path d="M5 7h9M18 7h1M5 17h1M10 17h9" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);
export const IconChevron = ({ size, dir = "right", ...p }: P & { dir?: "left" | "right" | "down" | "up" }) => {
  const r = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg {...base(size)} {...p} style={{ transform: `rotate(${r}deg)`, ...p.style }}>
      <path d="M9.5 6l6 6-6 6" />
    </svg>
  );
};
export const IconClose = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconInfo = ({ size, strokeWidth, ...p }: P) => (
  <svg {...base(size, strokeWidth)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.6" fill="currentColor" />
  </svg>
);
export const IconCompass = ({ size, deg, ...p }: P & { deg: number | null }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    {deg === null ? (
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    ) : (
      <g transform={`rotate(${deg} 12 12)`}>
        <path d="M12 4.5l2.2 7.5h-4.4z" fill="currentColor" stroke="none" />
        <path d="M12 19.5l-2.2-7.5h4.4z" />
      </g>
    )}
  </svg>
);
