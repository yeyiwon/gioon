"use client";
import * as THREE from "three";
import type { SockSpec } from "@/lib/fortune/daily";
import { cachedGeometry, sockTexture } from "./sock";

/**
 * 수집함 썸네일: 캔버스를 칸마다 만들지 않고, 오프스크린 렌더러 하나로 3D 양말을 한 번 그려 이미지로 쓴다.
 * WebGL 컨텍스트 1개, 스크롤 지연 0.
 */
let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string, string>();
const SIZE = 256;

function getRenderer() {
  if (renderer) return renderer;
  const canvas = document.createElement("canvas");
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(SIZE, SIZE, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function sockThumb(spec: SockSpec): string | null {
  const key = JSON.stringify(spec);
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const r = getRenderer();
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#ffffff", "#c9ccd8", 1.1));
    const dir = new THREE.DirectionalLight("#ffffff", 1.6);
    dir.position.set(2, 3, 3);
    scene.add(dir);
    const tex = sockTexture(spec, 256);
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.9, sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color(spec.base.hex) });
    const g = cachedGeometry(spec.shape);
    const pair = new THREE.Group();
    const s = spec.shape === "knee" ? 0.8 : spec.shape === "ankle" ? 1.15 : 1;
    pair.scale.setScalar(s);
    const back = new THREE.Mesh(g, mat);
    back.position.set(0.2 - 0.065, 0.07, -0.16);
    back.rotation.z = -0.1;
    const front = new THREE.Mesh(g, mat);
    front.position.set(-0.06 - 0.065, -0.03, 0.06);
    front.rotation.z = 0.04;
    pair.add(back, front);
    scene.add(pair);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
    cam.position.set(0, 0.05, 2.85);
    cam.lookAt(0, 0, 0);
    r.render(scene, cam);
    const url = r.domElement.toDataURL("image/png");
    tex.dispose();
    mat.dispose();
    cache.set(key, url);
    return url;
  } catch {
    return null;
  }
}
