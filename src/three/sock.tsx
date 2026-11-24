"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SockSpec } from "@/lib/fortune/daily";
import { useQuality } from "./common";

/** 발목 높이(양말 윗단 y) */
const TOP: Record<SockSpec["shape"], number> = { ankle: 0.42, crew: 0.82, knee: 1.18 };

/**
 * 제품 사진처럼 옆에서 본 양말 실루엣. 다리는 곧게, 뒤꿈치는 둥글게, 발끝은 동그랗게.
 * 납작한 실루엣을 큰 베벨로 부풀려 구김 없는 니트 볼륨을 만든다.
 */
function sockShape(shape: SockSpec["shape"]) {
  const top = TOP[shape];
  const s = new THREE.Shape();
  // 다리는 위로 갈수록 아주 살짝 넓어지고, 발등·뒤꿈치·발끝은 모두 부드러운 곡선
  s.moveTo(-0.175, top);
  s.lineTo(0.175, top);
  s.bezierCurveTo(0.172, top * 0.6, 0.165, 0.36, 0.17, 0.3);
  s.bezierCurveTo(0.18, 0.2, 0.25, 0.17, 0.34, 0.17);
  s.lineTo(0.58, 0.17);
  s.bezierCurveTo(0.74, 0.17, 0.79, 0.11, 0.79, 0.05);
  s.bezierCurveTo(0.79, -0.03, 0.72, -0.07, 0.6, -0.07);
  s.lineTo(0.0, -0.07);
  s.bezierCurveTo(-0.17, -0.07, -0.23, 0.05, -0.2, 0.17);
  s.bezierCurveTo(-0.185, 0.24, -0.17, 0.3, -0.17, 0.38);
  s.bezierCurveTo(-0.172, top * 0.6, -0.175, top * 0.85, -0.175, top);
  return s;
}

export function sockGeometry(shape: SockSpec["shape"]) {
  const g = new THREE.ExtrudeGeometry(sockShape(shape), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.075,
    bevelSize: 0.05,
    bevelSegments: 10,
    curveSegments: 40,
  });
  // 패턴이 늘어나지 않도록 앞뒤 면은 평면(x,y) 그대로 UV를 쓴다
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
  uv.needsUpdate = true;
  g.translate(-0.3, -TOP[shape] / 2, -0.02);
  return g;
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt, 0, 1));
  return `#${c.getHexString()}`;
}

/**
 * 양말 무늬 텍스처. 캔버스 1px = 실루엣 좌표 1/512, 범위 x[-0.3,0.9] y[-0.15,1.25]
 * 실루엣과 같은 평면 좌표로 그리므로 곡면에서 패턴이 깨지지 않는다.
 */
const BX = -0.3, BY = -0.15, SPAN = 1.4;
/** px: 수집함 썸네일은 256으로 GPU 메모리를 아낀다 */
export function sockTexture(spec: SockSpec, PX = 1024) {
  const top = TOP[spec.shape];
  const cv = document.createElement("canvas");
  cv.width = cv.height = PX;
  const x = cv.getContext("2d")!;
  // 좌표계를 실루엣 단위로 (y 위쪽이 +)
  x.setTransform(PX / SPAN, 0, 0, -PX / SPAN, -BX * (PX / SPAN), (BY + SPAN) * (PX / SPAN));
  const base = spec.base.hex;
  const acc = spec.accent.hex;
  x.fillStyle = base;
  x.fillRect(BX, BY, SPAN, SPAN);
  const cuff = top - 0.09;
  x.save();
  x.beginPath();
  x.rect(BX, BY, SPAN, cuff - BY);
  x.clip();
  switch (spec.pattern) {
    case "stripe":
      x.fillStyle = acc;
      for (let y = cuff - 0.06; y > BY; y -= 0.11) x.fillRect(BX, y - 0.035, SPAN, 0.035);
      break;
    case "dot":
      x.fillStyle = acc;
      for (let y = cuff - 0.05, r = 0; y > BY; y -= 0.07, r++)
        for (let xx = BX + (r % 2) * 0.035; xx < BX + SPAN; xx += 0.07) {
          x.beginPath();
          x.arc(xx, y, 0.012, 0, Math.PI * 2);
          x.fill();
        }
      break;
    case "rib":
      x.fillStyle = shade(base, -0.06);
      for (let xx = BX; xx < BX + SPAN; xx += 0.03) x.fillRect(xx, BY, 0.012, SPAN);
      break;
    case "check":
      x.fillStyle = acc;
      x.globalAlpha = 0.45;
      for (let y = cuff; y > BY; y -= 0.12) x.fillRect(BX, y - 0.06, SPAN, 0.06);
      for (let xx = BX; xx < BX + SPAN; xx += 0.12) x.fillRect(xx, BY, 0.06, SPAN);
      x.globalAlpha = 1;
      break;
    case "wave":
      x.strokeStyle = acc;
      x.lineWidth = 0.022;
      for (let y = cuff - 0.07; y > BY; y -= 0.1) {
        x.beginPath();
        for (let xx = BX; xx <= BX + SPAN; xx += 0.01) x.lineTo(xx, y + Math.sin(xx * 40) * 0.015);
        x.stroke();
      }
      break;
    case "argyle": {
      const w = 0.16, h = 0.22;
      for (let y = cuff, r = 0; y > BY - h; y -= h / 2, r++)
        for (let xx = BX + (r % 2) * (w / 2); xx < BX + SPAN + w; xx += w) {
          x.fillStyle = r % 2 ? acc : shade(base, 0.08);
          x.beginPath();
          x.moveTo(xx, y + h / 2);
          x.lineTo(xx + w / 2, y);
          x.lineTo(xx, y - h / 2);
          x.lineTo(xx - w / 2, y);
          x.closePath();
          x.fill();
        }
      break;
    }
    case "solid":
      break;
  }
  x.restore();
  // 골지 윗단
  x.fillStyle = shade(base, -0.05);
  x.fillRect(BX, cuff, SPAN, 0.2);
  x.fillStyle = shade(base, -0.11);
  for (let xx = BX; xx < BX + SPAN; xx += 0.022) x.fillRect(xx, cuff, 0.008, 0.2);
  // 뒤꿈치·발끝 배색 (무지는 같은 톤으로 아주 살짝)
  const patch = spec.pattern === "solid" ? shade(base, -0.07) : acc;
  x.fillStyle = patch;
  x.beginPath();
  x.ellipse(-0.13, 0.03, 0.14, 0.13, 0.5, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(0.82, 0.05, 0.2, 0.2, 0, 0, Math.PI * 2);
  x.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // UV = 실루엣 좌표 → 텍스처 0..1
  t.repeat.set(1 / SPAN, 1 / SPAN);
  t.offset.set(-BX / SPAN, -BY / SPAN);
  return t;
}

let knit: THREE.CanvasTexture | null = null;
/** 니트 코(V자) 범프 */
export function knitBump() {
  if (knit) return knit;
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const x = c.getContext("2d")!;
  x.fillStyle = "#808080";
  x.fillRect(0, 0, 32, 32);
  const g = x.createLinearGradient(0, 0, 16, 0);
  g.addColorStop(0, "#3a3a3a");
  g.addColorStop(0.5, "#f2f2f2");
  g.addColorStop(1, "#3a3a3a");
  x.fillStyle = g;
  x.save();
  x.beginPath();
  x.ellipse(8, 16, 6, 14, -0.45, 0, Math.PI * 2);
  x.fill();
  x.restore();
  x.save();
  x.translate(16, 0);
  x.beginPath();
  x.ellipse(8, 16, 6, 14, 0.45, 0, Math.PI * 2);
  x.fill();
  x.restore();
  knit = new THREE.CanvasTexture(c);
  knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
  knit.repeat.set(70, 70);
  return knit;
}

/** 같은 길이의 양말은 지오메트리를 공유한다 (수집함에 여러 켤레가 떠도 메시 하나) */
const geoCache = new Map<SockSpec["shape"], THREE.BufferGeometry>();
function cachedGeometry(shape: SockSpec["shape"]) {
  let g = geoCache.get(shape);
  if (!g) {
    g = sockGeometry(shape);
    geoCache.set(shape, g);
  }
  return g;
}

export type Floppy = { amp: number };

/**
 * 니트처럼 낭창거리는 양말: 버텍스 셰이더에서 높이에 비례해 휘어지게 한다.
 * floppy.amp를 부모가 매 프레임 바꾸면(등장 직후 크게 → 서서히 잦아듦) 천처럼 출렁인다.
 */
function OneSock({ spec, lite, floppy, phase = 0 }: { spec: SockSpec; lite?: boolean; floppy?: RefObject<Floppy>; phase?: number }) {
  const g = cachedGeometry(spec.shape);
  const map = useMemo(() => sockTexture(spec, lite ? 256 : 1024), [spec, lite]);
  useEffect(() => () => map.dispose(), [map]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmp: { value: 0 }, uPhase: { value: phase } }), [phase]);
  const onBeforeCompile = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uAmp;\nuniform float uPhase;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float h = clamp(position.y + 0.55, 0.0, 1.8);
          float bend = sin(uTime * 7.0 + uPhase + position.y * 3.2) * uAmp * h * h * 0.16;
          transformed.x += bend;
          transformed.z += cos(uTime * 5.3 + uPhase + position.x * 4.0) * uAmp * h * 0.05;
          transformed.y -= abs(bend) * 0.35;`,
        );
    },
    [uniforms],
  );
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uAmp.value = floppy?.current?.amp ?? 0;
  });
  return (
    <mesh geometry={g}>
      <meshPhysicalMaterial
        map={map}
        bumpMap={lite ? undefined : knitBump()}
        bumpScale={0.5}
        roughness={0.9}
        envMapIntensity={0.3}
        sheen={0.35}
        sheenRoughness={0.7}
        sheenColor={spec.base.hex}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => "floppy-sock"}
      />
    </mesh>
  );
}

/** 자연스럽게 겹쳐 놓은 한 켤레 */
export function SockPair({ spec, lite }: { spec: SockSpec; lite?: boolean }) {
  const s = spec.shape === "knee" ? 0.8 : spec.shape === "ankle" ? 1.15 : 1;
  return (
    <group scale={s}>
      <group position={[0.2, 0.07, -0.16]} rotation={[0, 0, -0.1]}>
        <OneSock spec={spec} lite={lite} />
      </group>
      <group position={[-0.06, -0.03, 0.06]} rotation={[0, 0, 0.04]}>
        <OneSock spec={spec} lite={lite} />
      </group>
    </group>
  );
}

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

const CONF_COLORS = ["#ff5fa2", "#ffd23f", "#2f5bff", "#8ee04b", "#8b7cff", "#ff7a2f"];
/** 상자 입구에서 터지는 3D 컨페티 (InstancedMesh 하나) */
function Confetti3D({ openAt, count = 44 }: { openAt: number | null; count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const sp = 0.9 + Math.random() * 1.1;
        return {
          v: new THREE.Vector3(Math.cos(a) * sp * 0.55, 1.6 + Math.random() * 1.3, Math.sin(a) * sp * 0.4),
          spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9),
          s: 0.035 + Math.random() * 0.03,
          round: i % 3 === 0,
        };
      }),
    [count],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    parts.forEach((_, i) => m.setColorAt(i, c.set(CONF_COLORS[i % CONF_COLORS.length])));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [parts]);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = openAt === null || openAt === 1 ? -1 : (performance.now() - openAt) / 1000 - 0.34;
    m.visible = t > 0 && t < 1.7;
    if (!m.visible) return;
    parts.forEach((p, i) => {
      o.position.set(p.v.x * t, -0.02 + p.v.y * t - 2.4 * t * t, p.v.z * t);
      o.rotation.set(p.spin.x * t, p.spin.y * t, p.spin.z * t);
      const fade = t > 1.2 ? 1 - (t - 1.2) / 0.5 : 1;
      o.scale.set(p.s * fade, (p.round ? p.s : p.s * 0.45) * fade, p.s * fade);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.4} />
    </instancedMesh>
  );
}

/** 뚜껑을 열면 안이 보이는 속이 빈 상자 (양말이 실제로 안에서 올라오도록) */
function HollowBox({ color, ribbon }: { color: string; ribbon: string }) {
  const W = 0.92, H = 0.56, T = 0.035;
  const mat = <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.5} />;
  const inner = shade(color, 0.12);
  return (
    <group>
      {/* 바닥 */}
      <mesh position={[0, -H / 2 + T / 2, 0]}>
        <boxGeometry args={[W, T, W]} />
        {mat}
      </mesh>
      <mesh position={[0, -H / 2 + T + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 2 * T, W - 2 * T]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      {/* 네 벽 */}
      {[-1, 1].map((d) => (
        <mesh key={`fz${d}`} position={[0, 0, d * (W / 2 - T / 2)]}>
          <boxGeometry args={[W, H, T]} />
          {mat}
        </mesh>
      ))}
      {[-1, 1].map((d) => (
        <mesh key={`sx${d}`} position={[d * (W / 2 - T / 2), 0, 0]}>
          <boxGeometry args={[T, H, W - 2 * T]} />
          {mat}
        </mesh>
      ))}
      {/* 안쪽 면은 조금 밝게 */}
      {[-1, 1].map((d) => (
        <mesh key={`in${d}`} position={[0, 0, d * (W / 2 - T - 0.001)]} rotation={[0, d > 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[W - 2 * T, H - 0.01]} />
          <meshStandardMaterial color={inner} roughness={0.9} />
        </mesh>
      ))}
      {/* 리본 띠 (바깥면) */}
      {[-1, 1].map((d) => (
        <mesh key={`rz${d}`} position={[0, 0, d * (W / 2 + 0.004)]}>
          <boxGeometry args={[0.14, H + 0.006, 0.008]} />
          <meshPhysicalMaterial color={ribbon} roughness={0.5} sheen={1} sheenColor="#ffffff" />
        </mesh>
      ))}
      {[-1, 1].map((d) => (
        <mesh key={`rx${d}`} position={[d * (W / 2 + 0.004), 0, 0]}>
          <boxGeometry args={[0.008, H + 0.006, 0.14]} />
          <meshPhysicalMaterial color={ribbon} roughness={0.5} sheen={1} sheenColor="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/**
 * 선물 상자 개봉 연출 (초, openAt 기준)
 *  0.00–0.22  상자가 살짝 웅크렸다 펴짐
 *  0.22–0.70  뚜껑이 위로 들렸다가 뒤로 기울며 사라짐 · 빛 고리와 컨페티
 *  0.40–1.10  상자 안에서 양말 한 켤레가 위로 솟아오름 (상자 크기에 맞춰 작게)
 *  1.05–1.65  상자는 아래로 내려가며 작아지고, 양말은 화면 가운데로 와서 원래 크기로
 * openAt === 1 은 이미 열린 상태
 */
export function GiftBox({ spec, openAt, ribbonColor, boxColor }: { spec: SockSpec; openAt: number | null; ribbonColor: string; boxColor: string }) {
  const lid = useRef<THREE.Group>(null);
  const box = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const pair = useRef<THREE.Group>(null);
  const floppy = useRef<Floppy>({ amp: 0 });
  const { motion } = useQuality();
  const finalScale = (spec.shape === "knee" ? 0.8 : spec.shape === "ankle" ? 1.15 : 1) * 1.25;
  // 상자 입구(폭 0.85)를 통과할 수 있는 크기
  const insideScale = finalScale * 0.48;

  useFrame(({ clock }) => {
    const dbg = process.env.NODE_ENV !== "production" ? (window as unknown as { __giftT?: number }).__giftT : undefined;
    const k = dbg ?? (openAt === null ? -1 : openAt === 1 ? 9 : (performance.now() - openAt) / 1000);
    const live = motion === "full";

    if (box.current && lid.current) {
      if (k < 0) {
        const w = live ? clock.elapsedTime % 3.2 : 9;
        const hop = w < 0.45 ? Math.sin((w / 0.45) * Math.PI) : 0;
        box.current.visible = true;
        box.current.position.set(0, -0.32 + hop * 0.025, 0);
        box.current.rotation.set(0, 0, hop * 0.02);
        box.current.scale.set(1, 1, 1);
        lid.current.visible = true;
        lid.current.position.set(0, 0.36, 0);
        lid.current.rotation.set(0, 0, 0);
        lid.current.scale.setScalar(1);
      } else {
        // 웅크림 → 펴짐
        const sq = k < 0.22 ? Math.sin((k / 0.22) * Math.PI) : 0;
        // 퇴장
        const out = smooth((k - 1.05) / 0.6);
        const sc = 1 - out;
        box.current.scale.set(sc * (1 + 0.05 * sq), sc * (1 - 0.1 * sq), sc * (1 + 0.05 * sq));
        box.current.position.set(0, -0.32 - 0.45 * out, 0);
        box.current.rotation.set(0, 0, 0);
        box.current.visible = out < 1;
        // 뚜껑: 똑바로 툭 들렸다가 뒤로 젖혀지며 화면 위로 빠져나감 (크기는 그대로)
        const lift = smooth((k - 0.22) / 0.2);
        const away = clamp01((k - 0.4) / 0.4);
        const awayE = away * away;
        lid.current.position.set(0.15 * awayE, 0.36 + 0.3 * lift + 1.9 * awayE, -0.9 * awayE);
        lid.current.rotation.set(-1.4 * awayE, 0.3 * awayE, 0.25 * awayE);
        lid.current.scale.setScalar(1);
        lid.current.visible = away < 1;
      }
    }
    if (ring.current) {
      const t = k - 0.3;
      const on = openAt !== 1 && dbg === undefined && t > 0 && t < 0.5;
      ring.current.visible = on;
      if (on) {
        const e = 1 - Math.pow(1 - t / 0.5, 3);
        ring.current.scale.setScalar(0.4 + e * 1.4);
        (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - e);
      }
    }
    if (pair.current) {
      const show = k >= 0.4;
      pair.current.visible = show;
      if (!show) return;
      // 1) 상자 안(바닥)에서 입구 위로
      const rise = 1 - Math.pow(1 - clamp01((k - 0.4) / 0.7), 3);
      const yInside = -0.62 + rise * 0.95; // -0.62(상자 속) → 0.33(입구 위)
      // 2) 가운데로 내려와 원래 크기로
      const settle = smooth((k - 1.05) / 0.6);
      const y = THREE.MathUtils.lerp(yInside, 0.02, settle);
      const sc = THREE.MathUtils.lerp(insideScale, finalScale, settle);
      const bob = live && settle >= 1 ? Math.sin(clock.elapsedTime * 1.2) * 0.015 : 0;
      pair.current.position.set(0, y + bob, 0);
      pair.current.scale.setScalar(sc);
      // 솟아오를 때만 아주 살짝 기울었다가 바로 섬
      pair.current.rotation.set(0, 0, (1 - rise) * 0.12);
      const since = openAt === 1 ? 9 : k - 0.4;
      floppy.current.amp = 0.35 * Math.exp(-2.6 * Math.max(since, 0)) + (live ? 0.035 : 0);
    }
  });

  return (
    <group>
      <group ref={box} position={[0, -0.32, 0]}>
        <HollowBox color={boxColor} ribbon={ribbonColor} />
        <group ref={lid} position={[0, 0.36, 0]}>
          <RoundedBox args={[0.98, 0.16, 0.98]} radius={0.04} smoothness={4}>
            <meshPhysicalMaterial color={shade(boxColor, 0.04)} roughness={0.38} clearcoat={0.5} />
          </RoundedBox>
          <mesh>
            <boxGeometry args={[0.14, 0.168, 0.985]} />
            <meshPhysicalMaterial color={ribbonColor} roughness={0.5} sheen={1} sheenColor="#ffffff" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.985, 0.168, 0.14]} />
            <meshPhysicalMaterial color={ribbonColor} roughness={0.5} sheen={1} sheenColor="#ffffff" />
          </mesh>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.13, 0.13, 0]} rotation={[Math.PI / 2, d * 0.5, 0]} scale={[1.25, 0.8, 1]}>
              <torusGeometry args={[0.1, 0.035, 12, 32]} />
              <meshPhysicalMaterial color={ribbonColor} roughness={0.45} sheen={1} sheenColor="#ffffff" />
            </mesh>
          ))}
          <mesh position={[0, 0.12, 0]} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.055, 16, 12]} />
            <meshPhysicalMaterial color={ribbonColor} roughness={0.45} />
          </mesh>
        </group>
      </group>
      <mesh ref={ring} position={[0, -0.02, 0.05]} visible={false}>
        <ringGeometry args={[0.36, 0.42, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Confetti3D openAt={openAt} />
      <group ref={pair} visible={false}>
        {/* 두 짝을 합친 폭의 가운데가 원점에 오도록 */}
        <group position={[-0.065, 0, 0]}>
        <group position={[0.2, 0.07, -0.16]} rotation={[0, 0, -0.1]}>
          <OneSock spec={spec} floppy={floppy} phase={0} />
        </group>
        <group position={[-0.06, -0.03, 0.06]} rotation={[0, 0, 0.04]}>
          <OneSock spec={spec} floppy={floppy} phase={1.7} />
        </group>
        </group>
      </group>
    </group>
  );
}
