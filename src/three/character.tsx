"use client";
import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Element } from "@/lib/saju/constants";
import { leaf, puffyStar, teardrop } from "./geo";
import { useEnvTex, useQuality } from "./common";
import type { Touch3D } from "./interact";

/*
 * 오행 마스코트 컬렉션 — 공통 조형 언어
 *  · 소프트 비닐 토이처럼 통통한 몸통(초타원 회전체)
 *  · 같은 얼굴 세트: 광택 있는 큰 눈 + 하이라이트, 볼터치, 표정이 바뀌는 입
 *  · 짧은 팔과 발, 머리 위에 오행을 상징하는 장식 하나
 */

/** 초타원 회전체: n이 클수록 각진 젤리, 작을수록 동그랗다 */
function blob(w: number, h: number, nTop = 2.3, nBottom = 3.2, seg = 64) {
  const pts: THREE.Vector2[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const th = Math.PI * (i / N); // 0 바닥 → π 꼭대기
    const c = -Math.cos(th);
    const sn = Math.sin(th);
    const n = c < 0 ? nBottom : nTop;
    const x = w * Math.pow(Math.abs(sn), 2 / n);
    const y = (h / 2) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    pts.push(new THREE.Vector2(Math.max(x, 0.0001), y + h / 2));
  }
  return new THREE.LatheGeometry(pts, seg);
}

type Spec = {
  body: THREE.BufferGeometry;
  color: string;
  /** 얼굴 중심 높이와 앞면 깊이 */
  faceY: number;
  faceZ: number;
  eye: number;
  armY: number;
  armX: number;
  height: number;
};

function useSpec(e: Element): Spec {
  return useMemo(() => {
    switch (e) {
      case "wood":
        return { body: blob(0.42, 0.78, 2.2, 3), color: "#93dd4f", faceY: 0.44, faceZ: 0.4, eye: 1, armY: 0.3, armX: 0.41, height: 0.78 };
      case "fire":
        return { body: blob(0.44, 0.72, 2.0, 3.2), color: "#ff6a2b", faceY: 0.36, faceZ: 0.42, eye: 1, armY: 0.26, armX: 0.43, height: 0.72 };
      case "earth":
        return { body: blob(0.5, 0.66, 2.5, 3.2), color: "#ffd23a", faceY: 0.34, faceZ: 0.49, eye: 0.95, armY: 0.2, armX: 0.53, height: 0.6 };
      case "metal": {
        const g = puffyStar(0.52, 0.6, 0.2);
        g.translate(0, 0.5, 0);
        return { body: g, color: "#eef0f6", faceY: 0.48, faceZ: 0.25, eye: 0.82, armY: 0.36, armX: 0.42, height: 1.0 };
      }
      case "water":
        // 아래는 통통한 젤리, 위는 살짝만 모이는 물방울
        return { body: blob(0.46, 0.8, 1.55, 2.6), color: "#78b4ff", faceY: 0.34, faceZ: 0.45, eye: 1, armY: 0.24, armX: 0.45, height: 0.8 };
    }
  }, [e]);
}

/** 오행별 재질: 비닐(목·화·토), 크롬(금), 젤리(수) */
function BodyMaterial({ e, color }: { e: Element; color: string }) {
  const { tier } = useQuality();
  const env = useEnvTex();
  if (e === "metal")
    // 크롬 대신 은빛 새틴 비닐
    return <meshPhysicalMaterial color={color} envMap={env} envMapIntensity={0.7} metalness={0.35} roughness={0.34} clearcoat={0.6} clearcoatRoughness={0.3} sheen={0.8} sheenColor="#d9d2ff" sheenRoughness={0.5} />;
  if (e === "water")
    // 굴절 없이 은은한 반투명 젤리 (얼굴이 왜곡되지 않게)
    return (
      <meshPhysicalMaterial
        color={color}
        envMap={env}
        envMapIntensity={tier === "high" ? 0.6 : 0.4}
        emissive="#4f9bff"
        emissiveIntensity={0.12}
        transparent
        opacity={0.9}
        roughness={0.22}
        clearcoat={0.9}
        clearcoatRoughness={0.15}
        sheen={0.5}
        sheenColor="#ffffff"
      />
    );
  return <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={0.5} clearcoat={0.35} clearcoatRoughness={0.4} envMapIntensity={0.5} />;
}

/** 머리 장식 */
function Topper({ e, h, flame }: { e: Element; h: number; flame: RefObject<THREE.Group | null> }) {
  const leafG = useMemo(() => leaf(0.34, 0.24, 0.1, 0.18), []);
  const flameG = useMemo(() => teardrop(0.34, 0.15, 2.2, 24), []);
  const sparkle = useMemo(() => puffyStar(0.1, 0.55, 0.04, 80, 12), []);
  switch (e) {
    case "wood":
      return (
        <group position={[0, h - 0.02, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.14, 10]} />
            <meshStandardMaterial color="#4fa52e" roughness={0.5} />
          </mesh>
          <mesh geometry={leafG} position={[0, 0.12, 0]} rotation={[0.2, 0.3, -1.05]}>
            <meshPhysicalMaterial color="#4fb83a" roughness={0.4} clearcoat={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={leafG} position={[0, 0.12, 0]} rotation={[-0.2, -0.3, 1.05]} scale={0.85}>
            <meshPhysicalMaterial color="#6fcf3f" roughness={0.4} clearcoat={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "fire":
      return (
        <group ref={flame} position={[0, h - 0.06, 0]}>
          {[
            [0, 0.2, 0, 1.5, "#ffc21a"],
            [-0.15, 0.11, 0.02, 1.0, "#ff9a1f"],
            [0.15, 0.12, 0.02, 1.05, "#ff9a1f"],
          ].map(([x, y, z, s, c], i) => (
            <mesh key={i} geometry={flameG} position={[x as number, y as number, z as number]} scale={s as number} rotation={[0, 0, (x as number) * -2]}>
              <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.55} roughness={0.4} />
            </mesh>
          ))}
        </group>
      );
    case "earth":
      return (
        <group position={[0, h - 0.04, 0]}>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.17, -0.02, 0]} scale={[0.085, 0.075, 0.085]}>
              <sphereGeometry args={[1, 24, 16]} />
              <meshPhysicalMaterial color="#ffb800" roughness={0.45} clearcoat={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]} scale={[0.07, 0.05, 0.07]}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshPhysicalMaterial color="#b9832a" roughness={0.6} />
          </mesh>
        </group>
      );
    case "metal":
      return (
        <mesh geometry={sparkle} position={[0.34, h + 0.06, 0.05]} rotation={[0, 0, 0.3]}>
          <meshPhysicalMaterial color="#b9adff" metalness={0.6} roughness={0.15} emissive="#8b7cff" emissiveIntensity={0.4} />
        </mesh>
      );
    case "water":
      return (
        <mesh position={[0.17, h * 0.7, 0.3]} scale={[0.045, 0.07, 0.03]} rotation={[0.3, 0.4, -0.5]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      );
  }
}

const INK = "#1a1420";

/**
 * 표정이 있는 얼굴. mood: 0 기본 미소, 1 기쁨(^^ + 벌린 입), 2 놀람(o)
 */
function Face({ spec, moodRef, lookRef }: { spec: Spec; moodRef: RefObject<number>; lookRef: RefObject<number> }) {
  const eyesOpen = useRef<THREE.Group>(null);
  const eyesHappy = useRef<THREE.Group>(null);
  const mSmile = useRef<THREE.Mesh>(null);
  const mOpen = useRef<THREE.Group>(null);
  const mO = useRef<THREE.Mesh>(null);
  const face = useRef<THREE.Group>(null);
  const blinkAt = useRef(2 + Math.random() * 2);
  const { motion } = useQuality();
  const arc = useMemo(() => new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), []);
  const eyeArc = useMemo(() => new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI), []);
  const s = spec.eye;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const mood = moodRef.current ?? 0;
    // 깜빡임: blinkAt부터 0.14초 동안 눈을 감았다 뜬다
    let open = 1;
    if (motion === "full") {
      const k = t - blinkAt.current;
      if (k > 0.14) blinkAt.current = t + 2.2 + Math.random() * 2.6;
      else if (k > 0) open = Math.max(0.08, Math.abs(k - 0.07) / 0.07);
    }
    if (eyesOpen.current) {
      eyesOpen.current.visible = mood !== 1;
      eyesOpen.current.scale.y = mood === 2 ? 1.25 : open;
    }
    if (eyesHappy.current) eyesHappy.current.visible = mood === 1;
    if (mSmile.current) mSmile.current.visible = mood === 0;
    if (mOpen.current) mOpen.current.visible = mood === 1;
    if (mO.current) mO.current.visible = mood === 2;
    // 손가락 방향을 살짝 바라봄
    if (face.current) face.current.position.x = THREE.MathUtils.lerp(face.current.position.x, (lookRef.current ?? 0) * 0.03, 0.15);
  });

  return (
    <group ref={face} position={[0, spec.faceY, spec.faceZ]}>
      <group ref={eyesOpen}>
        {[-1, 1].map((d) => (
          <group key={d} position={[d * 0.11 * s, 0.02, 0]}>
            <mesh scale={[0.05 * s, 0.068 * s, 0.03]}>
              <sphereGeometry args={[1, 24, 16]} />
              <meshPhysicalMaterial color={INK} roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh position={[0.016 * s, 0.024 * s, 0.026]} scale={0.017 * s}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.014 * s, -0.022 * s, 0.026]} scale={0.008 * s}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={eyesHappy} visible={false}>
        {[-1, 1].map((d) => (
          <mesh key={d} geometry={eyeArc} position={[d * 0.11 * s, 0.0, 0.01]} scale={s}>
            <meshStandardMaterial color={INK} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* 볼터치 */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.19 * s, -0.045, -0.02]} scale={[0.05, 0.032, 0.01]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshBasicMaterial color="#ff7fa8" transparent opacity={0.75} />
        </mesh>
      ))}
      <mesh ref={mSmile} geometry={arc} position={[0, -0.055, 0.008]} rotation={[0, 0, Math.PI]} scale={[0.7, 0.55, 1]}>
        <meshStandardMaterial color={INK} roughness={0.3} />
      </mesh>
      <group ref={mOpen} visible={false} position={[0, -0.06, 0]}>
        <mesh scale={[0.055, 0.04, 0.02]}>
          <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#5a1630" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.022, 0.006]} scale={[0.03, 0.014, 0.012]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#ff7f9a" />
        </mesh>
      </group>
      <mesh ref={mO} visible={false} position={[0, -0.06, 0]}>
        <torusGeometry args={[0.022, 0.01, 8, 18]} />
        <meshStandardMaterial color={INK} />
      </mesh>
    </group>
  );
}

/**
 * 오행 마스코트. touch는 DOM에서 받은 입력(useTouch3D)
 */
export function Character({ element, touch, scale = 1 }: { element: Element; touch?: RefObject<Touch3D>; scale?: number }) {
  const spec = useSpec(element);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const flame = useRef<THREE.Group>(null);
  const mood = useRef(0);
  const look = useRef(0);
  const { motion } = useQuality();
  const seed = useMemo(() => Math.random() * 10, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed;
    const live = motion === "full";
    const tc = touch?.current;
    const since = tc ? (performance.now() - tc.tapAt) / 1000 : 99;
    // 표정 상태
    mood.current = since < 1.3 ? 1 : tc?.dragging && Math.abs(tc.vel) > 0.04 ? 2 : 0;
    look.current = tc ? THREE.MathUtils.clamp(tc.vel * 8, -1, 1) : 0;

    if (root.current) {
      // 회전(드래그 + 관성)
      if (tc) {
        if (!tc.dragging) {
          tc.yaw += tc.vel;
          tc.vel *= Math.pow(0.03, Math.min(dt, 0.05));
          // 손을 떼면 정면으로 천천히 돌아온다
          tc.yaw *= Math.pow(0.25, Math.min(dt, 0.05));
        }
        root.current.rotation.y = tc.yaw;
        root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, -tc.vel * 2.5, 0.2);
      }
      // 탭: 점프(0~0.45s) → 착지 스쿼시
      let y = 0;
      let sq = 0;
      if (since < 0.45) y = Math.sin((since / 0.45) * Math.PI) * 0.28;
      else if (since < 1.2) sq = Math.exp(-7 * (since - 0.45)) * Math.cos(16 * (since - 0.45));
      if (since < 0.1) sq = -since * 2.2; // 도약 전 웅크림
      root.current.position.y = y;
      const breathe = live ? Math.sin(t * 2.2) * 0.018 : 0;
      root.current.scale.set(scale * (1 + sq * 0.18 - breathe * 0.5), scale * (1 - sq * 0.22 + breathe), scale * (1 + sq * 0.18 - breathe * 0.5));
    }
    if (body.current && live) body.current.rotation.z = Math.sin(t * 1.3) * 0.035;
    const wave = since < 1.3 ? Math.sin(since * 18) * 0.6 : live ? Math.sin(t * 1.6) * 0.08 : 0;
    if (armL.current) armL.current.rotation.z = 0.5 + wave;
    if (armR.current) armR.current.rotation.z = -0.5 - (since < 1.3 ? wave : wave * 0.5);
    if (flame.current && live) {
      flame.current.scale.set(1 + Math.sin(t * 9) * 0.05, 1 + Math.sin(t * 11 + 1) * 0.09, 1);
      flame.current.rotation.z = Math.sin(t * 4) * 0.06;
    }
  });

  const isStar = element === "metal";
  return (
    <group ref={root}>
      <group ref={body}>
        <mesh geometry={spec.body} castShadow>
          <BodyMaterial e={element} color={spec.color} />
        </mesh>
        <Face spec={spec} moodRef={mood} lookRef={look} />
        <Topper e={element} h={spec.height} flame={flame} />
        {/* 팔 (별은 갈래가 팔 역할) */}
        {!isStar && (
          <>
            <mesh ref={armL} position={[-spec.armX, spec.armY, 0.05]} rotation={[0, 0, 0.5]}>
              <capsuleGeometry args={[0.05, 0.1, 6, 12]} />
              <BodyMaterial e={element === "water" ? "fire" : element} color={element === "water" ? "#7cb8ff" : spec.color} />
            </mesh>
            <mesh ref={armR} position={[spec.armX, spec.armY, 0.05]} rotation={[0, 0, -0.5]}>
              <capsuleGeometry args={[0.05, 0.1, 6, 12]} />
              <BodyMaterial e={element === "water" ? "fire" : element} color={element === "water" ? "#7cb8ff" : spec.color} />
            </mesh>
          </>
        )}
      </group>
      {/* 발 */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.14, 0.03, 0.12]} scale={[0.085, 0.05, 0.11]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshPhysicalMaterial color={element === "metal" ? "#cfc8ff" : element === "water" ? "#5c9cff" : new THREE.Color(spec.color).multiplyScalar(0.82).getStyle()} roughness={0.4} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  );
}
