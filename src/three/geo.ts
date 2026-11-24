import * as THREE from "three";

/** 물방울·불꽃처럼 아래가 둥글고 위가 뾰족한 회전체. m이 클수록 날씬해진다 */
export function teardrop(height = 1, radius = 0.42, m = 1, segments = 48) {
  const pts: THREE.Vector2[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const th = Math.PI * (1 - i / n); // 바닥(π) → 꼭지(0)
    const x = radius * Math.sin(th) * Math.pow(Math.sin(th / 2), m);
    pts.push(new THREE.Vector2(Math.max(x, 0.0001), (Math.cos(th) * height) / 2));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/** 오목하게 휘고 끝이 말린 잎 */
export function leaf(length = 1, width = 0.45, cup = 0.18, curl = 0.35) {
  const g = new THREE.PlaneGeometry(width, length, 10, 24);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i) + length / 2; // 0..length
    const t = Math.min(Math.max(y / length, 0), 1);
    const w = Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.15 * t); // 잎 윤곽
    const nx = (x / (width / 2)) * w * (width / 2);
    const z = -Math.pow(Math.abs(nx) / (width / 2), 2) * cup * w + Math.sin(t * Math.PI * 0.5) * curl * t;
    p.setXYZ(i, nx, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** 둥근 모서리의 오각 별 */
export function star(outer = 0.6, inner = 0.3, depth = 0.18) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.08,
    bevelSegments: 6,
    curveSegments: 8,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

/** 부드러운 원형 스프라이트 (입자용) */
let dotTex: THREE.CanvasTexture | null = null;
export function softDot() {
  if (dotTex) return dotTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

/** 네 갈래 반짝임 */
let sparkTex: THREE.CanvasTexture | null = null;
export function sparkleTexture() {
  if (sparkTex) return sparkTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  x.translate(32, 32);
  const gr = x.createRadialGradient(0, 0, 0, 0, 0, 30);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr;
  x.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 30 : 4;
    const a = (i / 8) * Math.PI * 2;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  x.fill();
  sparkTex = new THREE.CanvasTexture(c);
  return sparkTex;
}

/**
 * 쿠션처럼 부푼 별. 다섯 갈래 끝이 둥글고 가장자리가 부드럽게 말린다.
 * r(θ)는 코사인 로브로 만든 둥근 별 윤곽, 두께는 가장자리로 갈수록 타원형으로 줄어든다.
 */
export function puffyStar(R = 0.5, inner = 0.62, thick = 0.2, seg = 160, rings = 28) {
  const pos: number[] = [];
  const idx: number[] = [];
  const outline = (th: number) => {
    const lobe = Math.pow((1 + Math.cos(5 * (th - Math.PI / 2))) / 2, 1.7);
    return R * (inner + (1 - inner) * lobe);
  };
  // v: -1(뒤) → 1(앞), 가장자리에서 둥글게 말리도록 sin/cos 단면
  for (let j = 0; j <= rings; j++) {
    const phi = -Math.PI / 2 + (j / rings) * Math.PI;
    const rs = Math.cos(phi);
    const z = Math.sin(phi) * thick;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2;
      const r = outline(th) * Math.pow(Math.max(rs, 0), 0.55);
      // 앞뒤 면은 가운데가 살짝 더 부풀게
      const bulge = 1 + 0.25 * (1 - r / R);
      pos.push(Math.cos(th) * r, Math.sin(th) * r, z * bulge);
    }
  }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
