"use client";
import { useEffect, useRef } from "react";
import { invalidate } from "@react-three/fiber";

/** DOM에서 받은 손가락 입력을 3D 쪽 useFrame이 읽어 가는 공유 상태 */
export interface Touch3D {
  yaw: number;
  pitch: number;
  vel: number;
  dragging: boolean;
  /** 마지막 탭 시각(performance.now) */
  tapAt: number;
  taps: number;
  /** 탭 위치 -1..1 */
  tapX: number;
  tapY: number;
}

export const newTouch = (): Touch3D => ({ yaw: 0, pitch: 0, vel: 0, dragging: false, tapAt: -1e9, taps: 0, tapX: 0, tapY: 0 });

/** frameloop=demand일 때 상호작용 뒤 잠깐 렌더를 이어 준다 */
export function kick(ms = 1600) {
  const end = performance.now() + ms;
  const loop = () => {
    invalidate();
    if (performance.now() < end) requestAnimationFrame(loop);
  };
  loop();
}

/**
 * 가로 드래그는 회전, 세로 이동은 스크롤에 양보(touch-action: pan-y), 짧은 터치는 탭.
 */
export function useTouch3D(onTap?: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useRef<Touch3D>(newTouch());
  const tapRef = useRef(onTap);
  useEffect(() => {
    tapRef.current = onTap;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0, sy = 0, lx = 0, lt = 0, id = -1, moved = false, horizontal = false;
    const down = (e: PointerEvent) => {
      id = e.pointerId;
      sx = lx = e.clientX;
      sy = e.clientY;
      lt = performance.now();
      moved = false;
      horizontal = false;
      t.current.dragging = true;
      kick(400);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 8) {
        moved = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) el.setPointerCapture(id);
      }
      if (moved && horizontal) {
        const now = performance.now();
        const step = (e.clientX - lx) / el.clientWidth;
        t.current.yaw += step * Math.PI * 1.6;
        t.current.vel = (step * Math.PI * 1.6) / Math.max(16, now - lt) * 16;
        lx = e.clientX;
        lt = now;
        kick(800);
      }
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      t.current.dragging = false;
      if (!moved) {
        const r = el.getBoundingClientRect();
        t.current.tapAt = performance.now();
        t.current.taps++;
        t.current.tapX = ((e.clientX - r.left) / r.width) * 2 - 1;
        t.current.tapY = -(((e.clientY - r.top) / r.height) * 2 - 1);
        tapRef.current?.();
      }
      id = -1;
      kick(1800);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        t.current.tapAt = performance.now();
        t.current.taps++;
        tapRef.current?.();
        kick(1800);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        t.current.vel = e.key === "ArrowLeft" ? -0.12 : 0.12;
        kick(1200);
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, [enabled]);

  return { ref, touch: t };
}

/** 탭 후 눌렸다가 탄성 있게 돌아오는 스케일 (0=평소) */
export function squash(sinceTap: number) {
  if (sinceTap < 0 || sinceTap > 1.4) return 0;
  return Math.exp(-5 * sinceTap) * Math.cos(13 * sinceTap);
}
