import type { Chart, Pillar } from "./calc";
import {
  ELEMENTS,
  HIDDEN_STEMS,
  type Element,
  type TenGodGroup,
  branchElement,
  groupElement,
  stemElement,
} from "./constants";

export type Distribution = Record<Element, number>;
const empty = (): Distribution => ({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });

export const pillarsOf = (c: Chart): Pillar[] => [c.year, c.month, c.day, ...(c.hour ? [c.hour] : [])];

/** 겉으로 드러난 글자 수(천간+지지 본 오행) */
export function surfaceCount(c: Chart): Distribution {
  const d = empty();
  for (const p of pillarsOf(c)) {
    d[stemElement(p.stem)] += 1;
    d[branchElement(p.branch)] += 1;
  }
  return d;
}

/**
 * 지장간과 월령을 반영한 오행 세기.
 * 천간 1, 지지는 지장간 비율로 나눠 1, 월지는 계절의 힘을 반영해 2배.
 */
export function weightedDistribution(c: Chart): Distribution {
  const d = empty();
  pillarsOf(c).forEach((p, i) => {
    d[stemElement(p.stem)] += 1;
    const w = i === 1 ? 2 : 1;
    for (const [s, r] of HIDDEN_STEMS[p.branch]) d[stemElement(s)] += r * w;
  });
  return d;
}

export type Strength = "strong" | "balanced" | "weak";

export interface Analysis {
  dayElement: Element;
  surface: Distribution;
  weighted: Distribution;
  /** 0~1, 일간을 돕는 힘(비겁+인성)의 비율 */
  supportRatio: number;
  strength: Strength;
  /** 해석상 도움이 되는 오행(가중치) */
  favorable: Record<Element, number>;
  primary: Element;
  secondary: Element;
  seasonal: Element | null;
  reasons: string[];
}

const GROUPS: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

export function analyze(c: Chart): Analysis {
  const dayEl = stemElement(c.day.stem);
  const weighted = weightedDistribution(c);
  // 일간 자신은 기준점이므로 세기 비교에서 1을 뺀다
  const g: Record<TenGodGroup, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const grp of GROUPS) g[grp] = weighted[groupElement(dayEl, grp)];
  g.비겁 -= 1;
  const total = Object.values(g).reduce((a, b) => a + b, 0);
  const supportRatio = (g.비겁 + g.인성) / total;
  const strength: Strength = supportRatio > 0.52 ? "strong" : supportRatio < 0.4 ? "weak" : "balanced";

  const reasons: string[] = [];
  let primaryGroup: TenGodGroup;
  let secondaryGroup: TenGodGroup;
  if (strength === "strong") {
    if (g.인성 > g.비겁) {
      primaryGroup = "재성";
      secondaryGroup = "식상";
      reasons.push("돕는 기운 중 배움·보호(인성)가 두터워, 이를 덜어 내는 재성의 기운이 균형을 잡아 줘요.");
    } else {
      primaryGroup = "관성";
      secondaryGroup = "식상";
      reasons.push("나와 같은 기운(비겁)이 많아, 이를 다듬어 주는 관성과 흘려보내는 식상이 도움이 돼요.");
    }
  } else if (strength === "weak") {
    if (g.관성 >= g.재성 && g.관성 >= g.식상) {
      primaryGroup = "인성";
      secondaryGroup = "비겁";
      reasons.push("나를 누르는 관성이 강해, 그 힘을 나에게로 이어 주는 인성이 가장 반가워요.");
    } else if (g.재성 >= g.식상) {
      primaryGroup = "비겁";
      secondaryGroup = "인성";
      reasons.push("다뤄야 할 재성이 많아, 함께 버텨 주는 비겁의 기운이 힘이 돼요.");
    } else {
      primaryGroup = "인성";
      secondaryGroup = "비겁";
      reasons.push("내 힘이 표현(식상)으로 많이 빠져나가, 다시 채워 주는 인성이 필요해요.");
    }
  } else {
    const weakest = [...ELEMENTS].sort((a, b) => weighted[a] - weighted[b]);
    const toGroup = (e: Element) => GROUPS.find((x) => groupElement(dayEl, x) === e)!;
    primaryGroup = toGroup(weakest[0]);
    secondaryGroup = toGroup(weakest[1]);
    reasons.push("돕는 힘과 쓰는 힘이 비슷해 균형이 좋은 편이에요. 상대적으로 옅은 기운을 살짝 더하면 좋아요.");
  }

  const favorable: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const primary = groupElement(dayEl, primaryGroup);
  const secondary = groupElement(dayEl, secondaryGroup);
  favorable[primary] += 3;
  favorable[secondary] += 2;

  // 조후: 한겨울·한여름 태생은 온도를 맞추는 기운을 함께 본다
  let seasonal: Element | null = null;
  const mb = c.month.branch;
  if (mb === "亥" || mb === "子" || mb === "丑") seasonal = "fire";
  if (mb === "巳" || mb === "午" || mb === "未") seasonal = "water";
  if (seasonal) {
    favorable[seasonal] += 1;
    reasons.push(
      seasonal === "fire"
        ? "추운 계절에 태어나 따뜻함(화)이 함께 있으면 기운이 잘 돌아요."
        : "더운 계절에 태어나 촉촉함(수)이 함께 있으면 기운이 잘 돌아요.",
    );
  }
  // 이미 넘치는 기운은 감점
  const sum = ELEMENTS.reduce((a, e) => a + weighted[e], 0);
  for (const e of ELEMENTS) if (weighted[e] / sum > 0.34) favorable[e] -= 1;

  return {
    dayElement: dayEl,
    surface: surfaceCount(c),
    weighted,
    supportRatio,
    strength,
    favorable,
    primary,
    secondary,
    seasonal,
    reasons,
  };
}

export const STRENGTH_KO: Record<Strength, { label: string; plain: string }> = {
  strong: { label: "신강", plain: "내 기운이 단단한 편" },
  balanced: { label: "중화", plain: "기운이 고르게 맞물린 편" },
  weak: { label: "신약", plain: "주변 기운이 더 큰 편" },
};
