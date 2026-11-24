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

/** 감쇠 스프링 (0→1, 살짝 지나쳤다가 안착) */
const spring = (t: number, w = 11, z = 0.38) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

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

/**
 * 선물 상자 개봉 연출 (초 단위, openAt 기준)
 *  0.00–0.32  상자가 웅크리며 떨린다 (기대감)
 *  0.32       뚜껑이 회전하며 튀어 오르고, 빛 고리와 컨페티가 터진다
 *  0.36–0.95  양말 두 짝이 부채꼴로 벌어지며 솟아오른다
 *  0.95–1.6   두 짝이 한 켤레로 겹쳐 내려앉고, 상자는 아래로 작아지며 사라진다
 * openAt === 1 은 이미 열린 상태(연출 없이 결과만)
 */
export function GiftBox({ spec, openAt, ribbonColor, boxColor }: { spec: SockSpec; openAt: number | null; ribbonColor: string; boxColor: string }) {
  const lid = useRef<THREE.Group>(null);
  const box = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const pair = useRef<THREE.Group>(null);
  const floppy = useRef<Floppy>({ amp: 0 });
  const { motion } = useQuality();
  const shapeScale = (spec.shape === "knee" ? 0.8 : spec.shape === "ankle" ? 1.15 : 1) * 1.25;
  // 최종 한 켤레 배치 (SockPair와 같은 자세)
  const restA = { p: [0.2, 0.07, -0.16], r: [0, 0, -0.1] };
  const restB = { p: [-0.06, -0.03, 0.06], r: [0, 0, 0.04] };

  useFrame(({ clock }) => {
    const k = openAt === null ? -1 : openAt === 1 ? 9 : (performance.now() - openAt) / 1000;
    const live = motion === "full";
    // ── 상자 ──
    if (box.current && lid.current) {
      if (k < 0) {
        const w = live ? clock.elapsedTime % 3.2 : 9;
        const hop = w < 0.5 ? Math.sin((w / 0.5) * Math.PI) : 0;
        box.current.visible = true;
        box.current.position.set(0, -0.32 + hop * 0.03, 0);
        box.current.rotation.set(0, 0, hop * 0.03);
        box.current.scale.set(1, 1, 1);
        lid.current.visible = true;
        lid.current.position.set(0, 0.36 + hop * 0.04, 0);
        lid.current.rotation.set(0, 0, 0);
        lid.current.scale.setScalar(1);
      } else if (k < 0.32) {
        // 웅크림 + 떨림
        const q = k / 0.32;
        const shake = Math.sin(k * 70) * 0.05 * q;
        box.current.scale.set(1 + 0.08 * q, 1 - 0.18 * q, 1 + 0.08 * q);
        box.current.rotation.set(0, 0, shake);
        box.current.position.y = -0.32 - 0.05 * q;
        lid.current.position.set(0, 0.36, 0);
      } else {
        const t = k - 0.32;
        // 튕겨 오르는 반동 후 1초 뒤부터 아래로 작아지며 퇴장
        const rebound = 1 - spring(t, 18, 0.3);
        const out = easeOut((k - 0.95) / 0.6);
        const sc = (1 - out) * 1;
        box.current.scale.set(sc * (1 - 0.08 * rebound), sc * (1 + 0.18 * rebound), sc * (1 - 0.08 * rebound));
        box.current.rotation.set(0, 0, 0);
        box.current.position.y = -0.32 - 0.35 * out;
        box.current.visible = out < 1;
        // 뚜껑: 회전하며 포물선으로 날아감
        lid.current.position.set(-0.9 * t, 0.36 + 2.2 * t - 3.2 * t * t, -0.5 * t);
        lid.current.rotation.set(-3.2 * t, 0.6 * t, 4.0 * t);
        lid.current.scale.setScalar(Math.max(0.0001, 1 - clamp01((t - 0.35) / 0.35)));
        lid.current.visible = t < 0.72;
      }
    }
    // ── 빛 고리 ──
    if (ring.current) {
      const t = k - 0.32;
      const on = openAt !== 1 && t > 0 && t < 0.55;
      ring.current.visible = on;
      if (on) {
        const e = easeOut(t / 0.55);
        ring.current.scale.setScalar(0.3 + e * 1.6);
        (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - e);
      }
    }
    // ── 양말 두 짝 ──
    if (a.current && b.current && pair.current) {
      const show = k >= 0.36;
      a.current.visible = b.current.visible = show;
      if (!show) return;
      // 튀어나올 때 크게 출렁이고 서서히 잦아들어 가볍게 흔들리는 정도로
      const since = openAt === 1 ? 9 : k - 0.36;
      floppy.current.amp = 1.1 * Math.exp(-2.2 * since) + (live ? 0.07 : 0);
      const up = spring(k - 0.36, 9, 0.42); // 솟구침
      const settle = easeOut((k - 0.95) / 0.65); // 겹쳐 앉기
      const sc = THREE.MathUtils.lerp(0.35, 1, clamp01(up * 1.05)) * shapeScale;
      const fan = (1 - settle) * clamp01(up);
      const lift = (1 - settle) * 0.55 * up;
      const set = (g: THREE.Group, rest: typeof restA, side: number) => {
        g.position.set(
          (rest.p[0] + side * 0.3 * fan) * shapeScale,
          -0.25 + (0.25 + rest.p[1] * shapeScale) * clamp01(up) + lift,
          rest.p[2] * shapeScale,
        );
        g.rotation.set(rest.r[0], rest.r[1], rest.r[2] + side * -0.7 * fan + (1 - clamp01(up)) * side * 1.2);
        g.scale.setScalar(sc);
      };
      set(a.current, restA, 1);
      set(b.current, restB, -1);
      pair.current.position.y = live && settle >= 1 ? Math.sin(clock.elapsedTime * 1.3) * 0.02 : 0;
      pair.current.rotation.z = live && settle >= 1 ? Math.sin(clock.elapsedTime * 0.9) * 0.02 : 0;
    }
  });

  const kraft = boxColor;
  return (
    <group>
      <group ref={box} position={[0, -0.32, 0]}>
        <RoundedBox args={[0.92, 0.56, 0.92]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial color={kraft} roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.281, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.14, 0.565, 0.925]} />
          <meshPhysicalMaterial color={ribbonColor} roughness={0.5} sheen={1} sheenColor="#ffffff" />
        </mesh>
        <group ref={lid} position={[0, 0.36, 0]}>
          <RoundedBox args={[0.98, 0.16, 0.98]} radius={0.04} smoothness={4}>
            <meshPhysicalMaterial color={shade(kraft, 0.04)} roughness={0.35} clearcoat={0.6} />
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
      <group ref={pair}>
        <group ref={a} visible={false}>
          <OneSock spec={spec} floppy={floppy} phase={0} />
        </group>
        <group ref={b} visible={false}>
          <OneSock spec={spec} floppy={floppy} phase={1.7} />
        </group>
      </group>
    </group>
  );
}
