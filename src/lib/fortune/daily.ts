import { dayPillarOf, type Chart, type Pillar } from "../saju/calc";
import { analyze, pillarsOf, type Analysis } from "../saju/analysis";
import { isCheoneulDay } from "../saju/sinsal";
import {
  ELEMENTS,
  ELEMENT_INFO,
  GENERATES,
  HIDDEN_STEMS,
  SIX_CLASH,
  SIX_HARMONY,
  STEM_HARMONY,
  STEM_KO,
  BRANCH_KO,
  TEN_GOD_GROUP,
  branchElement,
  controlledBy,
  groupElement,
  pairIn,
  stemElement,
  tenGodOf,
  type Element,
  type TenGod,
} from "../saju/constants";
import {
  ACCESSORIES,
  CHARM_BY_ELEMENT,
  DIRECTIONS,
  DRINKS,
  FOODS,
  NUMBERS,
  OUTFITS,
  RITUALS,
  SOCK_COLORS,
  SOCK_PATTERNS,
  type CharmKind,
  type SockPattern,
  type SockShape,
  type Swatch,
} from "./items";

/** FNV-1a → mulberry32. 같은 입력이면 항상 같은 수열 */
export function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** 받침 유무에 따라 조사 선택 */
export const josa = (w: string, withBatchim: string, without: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return w + (c >= 0 && c <= 11171 && c % 28 !== 0 ? withBatchim : without);
};
const pick = <T,>(rng: () => number, list: readonly T[]) => list[Math.floor(rng() * list.length)];

export interface SockSpec {
  base: Swatch;
  accent: Swatch;
  pattern: SockPattern;
  shape: SockShape;
}

export interface LuckyColor {
  role: "main" | "sub" | "point";
  swatch: Swatch;
  element: Element;
  reason: string;
  use: string;
}

export interface DailyFortune {
  date: string;
  pillar: Pillar;
  pillarKo: string;
  tenGod: TenGod;
  branchTenGod: TenGod;
  harmony: string[];
  clash: string[];
  need: Element;
  needReason: string;
  keyword: string;
  headline: string;
  flow: string;
  /** 35~98. 십신·합충·희용 기운으로 계산한 하루 지수 (확률 아님) */
  total: number;
  /** 점수 산출 근거 */
  basis: { label: string; effect: string }[];
  /** 오늘 일진이 내 천을귀인 자리 */
  guiin: boolean;
  colors: LuckyColor[];
  detail: string[];
  scores: { key: "love" | "money" | "work" | "people"; label: string; level: number; note: string }[];
  dos: string[];
  donts: string[];
  items: {
    sock: SockSpec;
    outfit: { name: string; swatch: Swatch };
    accessory: string;
    food: string;
    drink: string;
    numbers: [number, number];
    direction: (typeof DIRECTIONS)[Element];
    ritual: string;
  };
  charm: CharmKind;
}

/** 천간 십신별 하루 요약 — 짧고 바로 쓸 수 있는 문장만 */
const TG_COPY: Record<TenGod, { keyword: string; headline: string; flow: string; do: string; dont: string }> = {
  비견: { keyword: "협업", headline: "같이 하면 일이 빨라지는 날", flow: "나와 같은 기운(비견)이 들어와요. 혼자 붙잡기보다 나눠서 하면 속도가 붙어요.", do: "동료·친구에게 도움 요청하기", dont: "내 방식만 고집하기" },
  겁재: { keyword: "지출 주의", headline: "돈과 감정 관리가 중요한 날", flow: "경쟁하는 기운(겁재)이 들어와요. 에너지는 넘치지만 지출과 말다툼이 생기기 쉬워요.", do: "운동으로 남는 에너지 쓰기", dont: "충동적인 소비" },
  식신: { keyword: "생산성", headline: "만들고 즐기기 좋은 날", flow: "표현하는 기운(식신)이 들어와요. 손으로 만드는 일, 맛있는 식사, 취미가 잘 맞아요.", do: "미뤄 둔 작업 하나 완성하기", dont: "과식·야식" },
  상관: { keyword: "아이디어", headline: "아이디어는 좋고 말은 조심할 날", flow: "틀을 깨는 기운(상관)이 들어와요. 기획과 발표에 강하지만 말이 날카로워지기 쉬워요.", do: "떠오른 아이디어 바로 메모하기", dont: "윗사람과 감정적으로 부딪히기" },
  편재: { keyword: "기회", headline: "밖으로 나가면 기회가 생기는 날", flow: "움직이는 재물(편재)이 들어와요. 새로운 사람과 장소에서 정보와 기회를 얻기 쉬워요.", do: "새로운 사람 만나기", dont: "큰돈이 드는 즉흥 결정" },
  정재: { keyword: "꼼꼼함", headline: "꼼꼼하게 챙기면 남는 날", flow: "모으는 재물(정재)이 들어와요. 정산, 정리, 기록처럼 작은 일을 챙길수록 이득이에요.", do: "가계부·지출 정리하기", dont: "약속 미루기" },
  편관: { keyword: "우선순위", headline: "할 일이 몰리는 날, 우선순위가 핵심", flow: "압박하는 기운(편관)이 들어와요. 일이 몰리기 쉬우니 가장 중요한 것부터 처리하세요.", do: "가장 어려운 일 먼저 끝내기", dont: "무리한 일정 잡기" },
  정관: { keyword: "신뢰", headline: "약속을 지키면 인정받는 날", flow: "질서의 기운(정관)이 들어와요. 규칙과 마감을 지키면 평가가 좋아져요.", do: "약속 시간 5분 먼저 도착하기", dont: "규칙·절차 건너뛰기" },
  편인: { keyword: "배움", headline: "새로운 걸 배우기 좋은 날", flow: "직관의 기운(편인)이 들어와요. 평소와 다른 분야를 접하면 아이디어가 떠올라요.", do: "관심 분야 강의·글 하나 보기", dont: "혼자 결론 내리고 서운해하기" },
  정인: { keyword: "도움", headline: "도움 받기 좋은 날, 휴식도 챙기기", flow: "보살핌의 기운(정인)이 들어와요. 조언을 구하거나 공부하기 좋고, 쉬는 것도 도움이 돼요.", do: "선배·전문가에게 조언 구하기", dont: "도움을 거절하고 혼자 버티기" },
};

const ELEMENT_DO: Record<Element, string[]> = {
  wood: ["점심 뒤 짧은 산책", "미뤄 둔 일 하나 시작하기", "초록 식물 곁에서 일하기"],
  fire: ["좋았던 일 하나 소리 내어 말하기", "햇빛 드는 자리에 앉기", "먼저 연락하기"],
  earth: ["하루 일정을 손으로 적어 보기", "따뜻한 밥 한 끼 챙기기", "약속 장소에 일찍 도착하기"],
  metal: ["책상 위 물건 세 개 치우기", "결정 하나를 오늘 끝내기", "단정한 옷차림"],
  water: ["잠들기 전 화면 끄고 쉬기", "생각을 글로 정리하기", "조용한 곳에서 30분 집중"],
};

const ELEMENT_DONT: Record<Element, string> = {
  wood: "하루 종일 앉아만 있기",
  fire: "연락 미루고 혼자 지내기",
  earth: "계획 없이 하루 보내기",
  metal: "여러 일 동시에 벌이기",
  water: "밤늦게까지 무리하기",
};

const SCORE_NOTE: Record<"love" | "money" | "work" | "people", string[]> = {
  love: ["연락은 내일로 미루기", "가벼운 안부 정도가 좋아요", "대화가 무난한 날", "먼저 연락해 보기", "약속 잡기 좋은 날"],
  money: ["큰 지출 피하기", "충동구매 주의", "계획대로만 쓰기", "작은 이득이 있는 날", "재테크 점검하기 좋은 날"],
  work: ["마감 위주로 처리", "한 가지에만 집중", "평소 페이스 유지", "진도가 잘 나가는 날", "성과 보고하기 좋은 날"],
  people: ["혼자 있는 시간 확보", "말실수 주의", "무난하게 어울리는 날", "도움 주고받기 좋은 날", "새로운 사람 만나기 좋은 날"],
};

function todayElements(p: Pillar) {
  const d: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  d[stemElement(p.stem)] += 1;
  for (const [s, r] of HIDDEN_STEMS[p.branch]) d[stemElement(s)] += r;
  return d;
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function computeDaily(chart: Chart, profileKey: string, y: number, m: number, d: number, pre?: Analysis): DailyFortune {
  const a = pre ?? analyze(chart);
  const date = iso(y, m, d);
  const rng = seeded(`${profileKey}|${date}`);
  const p = dayPillarOf(y, m, d);
  const dayStem = chart.day.stem;
  const tg = tenGodOf(dayStem, p.stem);
  const btg = tenGodOf(dayStem, HIDDEN_STEMS[p.branch][0][0]);
  const group = TEN_GOD_GROUP[tg];

  const natal = pillarsOf(chart);
  const harmony: string[] = [];
  const clash: string[] = [];
  const posName = ["태어난 해", "태어난 달", "나 자신(일지)", "태어난 시"];
  natal.forEach((np, i) => {
    if (pairIn(SIX_HARMONY, np.branch, p.branch)) harmony.push(posName[i]);
    if (pairIn(SIX_CLASH, np.branch, p.branch)) clash.push(posName[i]);
  });
  const stemHarmony = pairIn(STEM_HARMONY, dayStem, p.stem);
  if (stemHarmony) harmony.push("일간");

  // ── 오늘 필요한 기운 ──
  const tEl = todayElements(p);
  const combined = { ...a.weighted };
  for (const e of ELEMENTS) combined[e] += tEl[e] * 1.5;
  const sum = ELEMENTS.reduce((s, e) => s + combined[e], 0);
  // 원국의 희용 기운은 바탕으로만 두고, 오늘의 일진이 무엇을 채우고 무엇을 넘치게 하는지를 더 크게 본다
  const why: Record<Element, string[]> = { wood: [], fire: [], earth: [], metal: [], water: [] };
  const score = {} as Record<Element, number>;
  for (const e of ELEMENTS) {
    score[e] = a.favorable[e] * 0.3;
    // 오늘 일진이 이미 넉넉히 실어 오는 기운은 굳이 더 챙길 필요가 적다
    if (tEl[e] >= 1) score[e] -= 1.2;
    else if (tEl[e] === 0 && a.favorable[e] > 0) score[e] += 0.3;
  }
  // 오늘 천간이 낳는(상생) 기운으로 흐름을 이어 준다
  const flowTo = GENERATES[stemElement(p.stem)];
  if (a.favorable[flowTo] >= 0) {
    score[flowTo] += 0.7;
    why[flowTo].push(`오늘 들어온 ${ELEMENT_INFO[stemElement(p.stem)].short}의 기운을 자연스럽게 이어받는 흐름`);
  }
  for (const e of ELEMENTS) if (a.favorable[e] >= 2) why[e].push("사주 전체의 균형에 도움이 되는 기운");
  let overloaded: Element | null = null;
  for (const e of ELEMENTS) {
    if (combined[e] / sum > 0.28) {
      overloaded = e;
      score[e] -= 1.5;
      const ctrl = controlledBy(e);
      score[ctrl] += 1.2;
      why[ctrl].push(`넘치기 쉬운 ${ELEMENT_INFO[e].short}의 기운을 다듬어 주는 힘`);
    }
  }
  const dayEl = a.dayElement;
  const bridge = (g: Parameters<typeof groupElement>[1], w: number, text: string) => {
    const e = groupElement(dayEl, g);
    score[e] += w;
    why[e].push(text);
  };
  if (group === "관성" && a.strength !== "strong") bridge("인성", 1.2, "오늘 나를 누르는 압력을 힘으로 바꿔 주는 다리");
  if (group === "재성" && a.strength === "weak") bridge("비겁", 1, "오늘 다뤄야 할 일들을 함께 버텨 주는 힘");
  if (group === "식상" && a.strength === "weak") bridge("인성", 1, "오늘 많이 쓰는 에너지를 다시 채워 주는 힘");
  if ((group === "비겁" || group === "인성") && a.strength === "strong")
    bridge("식상", 1.2, "오늘 넘치는 내 힘을 밖으로 흘려보내는 통로");
  if (clash.includes("나 자신(일지)")) bridge("인성", 0.6, "흔들리는 하루에 중심을 잡아 주는 힘");
  for (const e of ELEMENTS) score[e] += rng() * 0.5;
  const need = [...ELEMENTS].sort((x, y2) => score[y2] - score[x])[0];

  const pillarKo = `${STEM_KO[p.stem]}${BRANCH_KO[p.branch]}`;
  const todayMain = stemElement(p.stem);
  const reasonParts = why[need].length ? why[need] : ["오늘 하루 가장 옅게 흐르는 기운"];
  const tA = ELEMENT_INFO[todayMain].short;
  const tB = ELEMENT_INFO[branchElement(p.branch)].short;
  const needReason =
    `오늘은 ${pillarKo}(${p.stem}${p.branch})일, ${tA === tB ? `${tA}의 기운이 짙은` : `${josa(tA, "과", "와")} ${tB}의 기운이 흐르는`} 날이에요. ` +
    `${josa(ELEMENT_INFO[need].short, "은", "는")} 지금 나에게 ${reasonParts.slice(0, 2).join(", 그리고 ")}이에요.`;

  // ── 분야별 흐름 ──
  const base = { love: 3, money: 3, work: 3, people: 3 };
  const bump: Record<string, Partial<typeof base>> = {
    비견: { people: 1, money: -0.5 },
    겁재: { people: 0.5, money: -1 },
    식신: { love: 1, work: 0.5 },
    상관: { love: 0.5, work: 0.5, people: -0.5 },
    편재: { money: 1, love: 0.5 },
    정재: { money: 1, work: 0.5 },
    편관: { work: 1, people: -0.5 },
    정관: { work: 1, people: 0.5 },
    편인: { work: 0.5, money: -0.5 },
    정인: { work: 1, people: 0.5 },
  };
  for (const [k, v] of Object.entries(bump[tg])) base[k as keyof typeof base] += v as number;
  const fav = a.favorable[todayMain];
  const tone = fav >= 2 ? 0.5 : fav < 0 ? -0.5 : 0;
  if (harmony.length) {
    base.love += 0.5;
    base.people += 0.5;
  }
  if (clash.includes("나 자신(일지)")) {
    base.love -= 1;
    base.work -= 0.5;
  } else if (clash.length) base.people -= 0.5;
  const labels = { love: "연애", money: "금전", work: "일·공부", people: "대인관계" } as const;
  const scores = (Object.keys(labels) as (keyof typeof labels)[]).map((key) => {
    const level = Math.max(1, Math.min(5, Math.round(base[key] + tone + (rng() - 0.5) * 0.8)));
    return { key, label: labels[key], level, note: SCORE_NOTE[key][level - 1] };
  });

  const avg = scores.reduce((x, y) => x + y.level, 0) / scores.length;
  const guiin = isCheoneulDay(dayStem, p.branch);
  const total = Math.max(35, Math.min(98, Math.round(30 + avg * 13 + tone * 8 + (harmony.length ? 3 : 0) - (clash.length ? 3 : 0) + (guiin ? 4 : 0))));

  const detail: string[] = [
    `오늘의 천간 ${p.stem}(${STEM_KO[p.stem]})${josa(STEM_KO[p.stem], "은", "는").slice(1)} 내 일간 기준 ‘${tg}’${josa(tg, "이에요", "예요").slice(tg.length)}. ${TG_COPY[tg].flow}`,
  ];
  if (harmony.length) detail.push(`${harmony.join("·")}의 글자와 오늘이 합(合)을 이뤄요. 약속·협업이 잘 풀리기 쉬워요.`);
  if (clash.length) detail.push(`${clash.join("·")}의 글자와 오늘이 충(沖)으로 부딪혀요. 일정 변경이 생기기 쉬우니 여유를 두세요.`);
  if (guiin) detail.push("오늘은 내 천을귀인(天乙貴人) 자리가 들어오는 날이에요. 도움을 청하거나 사람을 만나기 좋아요.");
  if (overloaded) detail.push(`${ELEMENT_INFO[overloaded].short}의 기운이 넘치기 쉬운 날이라, 같은 색·음식을 더하기보다 다른 기운으로 균형을 맞추는 게 좋아요.`);

  // ── 아이템 ──
  const sockColors = SOCK_COLORS[need];
  const base1 = pick(rng, sockColors);
  // 포인트 색은 오늘 기운을 낳아 주는(상생) 오행에서
  const accent = pick(rng, SOCK_COLORS[ELEMENTS.find((e) => GENERATES[e] === need)!]);
  const ritual = pick(rng, RITUALS[need]);
  const patterns = SOCK_PATTERNS[need];
  const pattern = rng() < 0.45 ? patterns[0] : pick(rng, patterns);
  const shape = pick(rng, ["ankle", "crew", "crew", "knee"] as const);
  const outfitSwatch = pick(rng, sockColors.filter((c) => c !== base1));

  const parent = ELEMENTS.find((e) => GENERATES[e] === need)!;
  const N = ELEMENT_INFO[need];
  const P = ELEMENT_INFO[parent];
  const colors: LuckyColor[] = [
    { role: "main", swatch: base1, element: need, reason: `오늘 필요한 ${N.ko}(${N.hanja}) 기운의 색`, use: "양말·상의처럼 눈에 잘 띄는 곳" },
    { role: "sub", swatch: outfitSwatch, element: need, reason: `같은 ${N.ko} 계열로 톤을 맞추는 색`, use: "하의·겉옷·가방" },
    { role: "point", swatch: accent, element: parent, reason: `${josa(N.ko, "을", "를")} 도와주는 ${P.ko}(${P.hanja}) 기운의 색`, use: "액세서리·양말 포인트처럼 작게" },
  ];
  const basis = [
    { label: `천간 십신 · ${tg}`, effect: TG_COPY[tg].keyword },
    { label: "오늘 기운과 내 사주", effect: tone > 0 ? "반가운 기운 (+)" : tone < 0 ? "넘치는 기운 (−)" : "보통" },
    { label: "지지 합", effect: harmony.length ? `${harmony.join("·")} (+)` : "없음" },
    { label: "지지 충", effect: clash.length ? `${clash.join("·")} (−)` : "없음" },
    { label: "천을귀인 날", effect: guiin ? "해당 (+)" : "아님" },
  ];

  let charm: CharmKind = CHARM_BY_ELEMENT[need];
  if (harmony.length && rng() < 0.6) charm = "ribbon";
  else if (fav >= 3 && rng() < 0.6) charm = "gem";

  return {
    date,
    pillar: p,
    pillarKo,
    tenGod: tg,
    branchTenGod: btg,
    harmony,
    clash,
    need,
    needReason,
    keyword: TG_COPY[tg].keyword,
    headline: TG_COPY[tg].headline,
    flow: TG_COPY[tg].flow,
    total,
    basis,
    guiin,
    colors,
    detail,
    scores,
    dos: [pick(rng, ELEMENT_DO[need]), TG_COPY[tg].do],
    donts: [TG_COPY[tg].dont, ELEMENT_DONT[need]],
    items: {
      sock: { base: base1, accent, pattern, shape },
      outfit: { name: `${outfitSwatch.name} ${pick(rng, OUTFITS[need])}`, swatch: outfitSwatch },
      accessory: pick(rng, ACCESSORIES[need]),
      food: pick(rng, FOODS[need]),
      drink: pick(rng, DRINKS[need]),
      numbers: NUMBERS[need],
      direction: DIRECTIONS[need],
      ritual,
    },
    charm,
  };
}
