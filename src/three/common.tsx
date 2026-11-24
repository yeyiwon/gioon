"use client";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { softDot, sparkleTexture } from "./geo";
import { squash, type Touch3D } from "./interact";

export interface Quality {
  motion: "full" | "reduced";
  tier: "high" | "low";
}
export const QualityCtx = createContext<Quality>({ motion: "full", tier: "high" });
export const useQuality = () => useContext(QualityCtx);

/**
 * 반사용 환경맵. View마다 큐브 카메라를 돌리지 않고, 앱 전체에서 한 번만 PMREM으로 구워 공유한다.
 */
const envCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();
function getEnvTex(gl: THREE.WebGLRenderer) {
  let t = envCache.get(gl);
  if (!t) {
    const pm = new THREE.PMREMGenerator(gl);
    t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    envCache.set(gl, t);
  }
  return t;
}
/** 금속·유리처럼 반사가 중요한 재질은 이 텍스처를 envMap으로 직접 받아 강도를 따로 조절한다 */
export function useEnvTex() {
  const gl = useThree((s) => s.gl);
  return useMemo(() => getEnvTex(gl), [gl]);
}
function StudioEnv() {
  const scene = useThree((s) => s.scene);
  const tex = useEnvTex();
  useEffect(() => {
    scene.environment = tex;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
    };
  }, [scene, tex]);
  return null;
}

/** 아침 창가의 스튜디오 조명. 오행별로 색온도만 바꾼다 */
export function Rig({ warm = "#ffffff", cool = "#dfe8ff", shadow = true, shadowY = -0.62, shadowColor = "#40465a", scale = 4 }: { warm?: string; cool?: string; shadow?: boolean; shadowY?: number; shadowColor?: string; scale?: number }) {
  const { tier } = useQuality();
  return (
    <>
      <hemisphereLight args={["#ffffff", "#c9ccd8", 0.45]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.9} color={warm} />
      <directionalLight position={[-3, 2, -2.5]} intensity={2.2} color={cool} />
      <StudioEnv />
      {shadow && (
        <ContactShadows
          position={[0, shadowY, 0]}
          opacity={0.38}
          scale={scale}
          blur={2.6}
          far={2}
          resolution={tier === "high" ? 256 : 128}
          frames={tier === "high" ? Infinity : 1}
          color={shadowColor}
        />
      )}
    </>
  );
}

/**
 * 손가락 드래그 회전 + 관성 + 탭했을 때 눌렸다 튀어 오르는 탄성.
 * idle: 가만히 있을 때 아주 느린 회전 속도(rad/s)
 */
export function Spinner({
  touch,
  children,
  idle = 0.12,
  bounce = 1,
}: {
  touch: RefObject<Touch3D>;
  children: ReactNode;
  idle?: number;
  bounce?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const { motion } = useQuality();
  useFrame((state, dt) => {
    const t = touch.current;
    if (!g.current || !t) return;
    const d = Math.min(dt, 0.05);
    if (!t.dragging) {
      t.yaw += t.vel;
      t.vel *= Math.pow(0.04, d); // 관성 감쇠
      if (motion === "full") t.yaw += idle * d;
    }
    g.current.rotation.y = t.yaw;
    const s = squash((performance.now() - t.tapAt) / 1000) * 0.16 * bounce;
    g.current.scale.set(1 + s * 0.6, 1 - s, 1 + s * 0.6);
    g.current.position.y = Math.max(0, -s) * 0.6;
    void state;
  });
  return <group ref={g}>{children}</group>;
}

/** 탭할 때 퍼지는 작은 별빛 (InstancedMesh 하나) */
export function Burst({ touch, color = "#fff3d6", count = 18, y = 0.2 }: { touch: RefObject<Touch3D>; color?: string; count?: number; y?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dirs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const up = 0.4 + Math.random() * 0.9;
        return new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize().multiplyScalar(0.9 + Math.random() * 0.6);
      }),
    [count],
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: sparkleTexture(),
        color,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [color],
  );
  useFrame(({ camera }) => {
    const t = touch.current;
    if (!mesh.current || !t) return;
    const k = (performance.now() - t.tapAt) / 1000;
    const live = k >= 0 && k < 1.1;
    mesh.current.visible = live;
    if (!live) return;
    const e = 1 - Math.pow(1 - Math.min(k / 0.9, 1), 3);
    mat.opacity = 1 - Math.min(k / 1.1, 1);
    dirs.forEach((d, i) => {
      m.position.set(d.x * e, y + d.y * e - k * k * 0.35, d.z * e);
      m.quaternion.copy(camera.quaternion);
      const s = 0.12 * (1 - k / 1.1) * (0.6 + (i % 3) * 0.25);
      m.scale.setScalar(Math.max(s, 0.0001));
      m.updateMatrix();
      mesh.current!.setMatrixAt(i, m.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={mat} visible={false}>
    <planeGeometry args={[1, 1]} />
  </instancedMesh>;
}

/**
 * 첫 진입 연출: 흩어진 빛 입자가 가운데로 모여든다.
 * start: performance.now() 기준 시작 시각
 */
export function Gather({ start, color, count = 260, duration = 1.3 }: { start: RefObject<number>; color: string; count?: number; duration?: number }) {
  const pts = useRef<THREE.Points>(null);
  const { from, geo } = useMemo(() => {
    const from = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.random() * 1.6;
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.3) * Math.PI * 0.7;
      from[i * 3] = Math.cos(a) * Math.cos(b) * r;
      from[i * 3 + 1] = Math.sin(b) * r + 0.2;
      from[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(from.slice(), 3));
    return { from, geo };
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.07,
        map: softDot(),
        color,
        transparent: true,
        depthWrite: false,
      }),
    [color],
  );
  useFrame(() => {
    if (!pts.current) return;
    const k = start.current <= 0 ? 9 : (performance.now() - start.current) / 1000 / duration;
    pts.current.visible = k < 1.15;
    if (k >= 1.15) return;
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const delay = (i % 17) / 17 * 0.25;
      const e = Math.min(Math.max((k - delay) / (1 - 0.25), 0), 1);
      const ease = 1 - Math.pow(1 - e, 3);
      const swirl = (1 - ease) * 1.2;
      const fx = from[i * 3], fz = from[i * 3 + 2];
      const x = fx * Math.cos(swirl) - fz * Math.sin(swirl);
      const z = fx * Math.sin(swirl) + fz * Math.cos(swirl);
      p.setXYZ(i, x * (1 - ease), from[i * 3 + 1] * (1 - ease) + 0.1 * ease, z * (1 - ease));
    }
    p.needsUpdate = true;
    mat.opacity = k < 0.85 ? 1 : Math.max(0, 1 - (k - 0.85) / 0.3);
    mat.size = 0.07 * (1 - Math.max(0, k - 0.7));
  });
  return <points ref={pts} geometry={geo} material={mat} />;
}

/** 등장 스케일 (start 이후 0→1, 살짝 오버슈트) */
export function useAppear(start: RefObject<number>, delay = 0.9, dur = 0.7) {
  return () => {
    if (start.current <= 0) return 1;
    const k = ((performance.now() - start.current) / 1000 - delay) / dur;
    if (k <= 0) return 0.0001;
    if (k >= 1) return 1;
    // ease-out-back
    const c = 1.5;
    const x = k - 1;
    return 1 + (c + 1) * x * x * x + c * x * x;
  };
}


/** 세로로 좁은 화면에서도 물체가 잘리지 않게 카메라를 뒤로 뺀다 */
export function FitCamera({ base = 3.6, y = 0.55, target = 1.15, lookY = -0.05 }: { base?: number; y?: number; target?: number; lookY?: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const k = Math.max(1, target / aspect);
    camera.position.set(0, y * k, base * k);
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, base, y, target, lookY]);
  return null;
}

