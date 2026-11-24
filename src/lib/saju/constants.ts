export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_INFO: Record<
  Element,
  { ko: string; hanja: string; short: string; season: string; mood: string; color: string; ink: string; soft: string; on: string; mascot: string }
> = {
  wood: { ko: "목", hanja: "木", short: "나무", season: "봄", mood: "시작·성장", color: "#8ee04b", ink: "#2e6b12", soft: "#eefadf", on: "#13210a", mascot: "새순이" },
  fire: { ko: "화", hanja: "火", short: "불", season: "여름", mood: "표현·열정", color: "#ff6a2b", ink: "#b83a0b", soft: "#ffede3", on: "#1f0b02", mascot: "불꽁이" },
  earth: { ko: "토", hanja: "土", short: "흙", season: "환절기", mood: "안정·신뢰", color: "#ffc628", ink: "#8a5d00", soft: "#fff6d6", on: "#241a00", mascot: "말랑토" },
  metal: { ko: "금", hanja: "金", short: "쇠", season: "가을", mood: "정리·결단", color: "#8b7cff", ink: "#4b3cc9", soft: "#f0eeff", on: "#ffffff", mascot: "반짝별" },
  water: { ko: "수", hanja: "水", short: "물", season: "겨울", mood: "휴식·지혜", color: "#2f5bff", ink: "#1f3fc2", soft: "#e8eeff", on: "#ffffff", mascot: "말랑물" },
};

/** 상생: key generates value */
export const GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};
/** 상극: key controls value */
export const CONTROLS: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};
export const generatedBy = (e: Element) => ELEMENTS.find((x) => GENERATES[x] === e)!;
export const controlledBy = (e: Element) => ELEMENTS.find((x) => CONTROLS[x] === e)!;

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export const STEM_KO: Record<Stem, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무", 己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
export const BRANCH_KO: Record<Branch, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사", 午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};
export const BRANCH_ANIMAL: Record<Branch, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼", 辰: "용", 巳: "뱀", 午: "말", 未: "양", 申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

export const stemElement = (s: Stem): Element => ELEMENTS[Math.floor(STEMS.indexOf(s) / 2)];
export const stemYang = (s: Stem) => STEMS.indexOf(s) % 2 === 0;

const BRANCH_EL: Record<Branch, Element> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};
export const branchElement = (b: Branch) => BRANCH_EL[b];
/** 子寅辰午申戌 = 양. (체용 구분 없이 지지 순서 기준) */
export const branchYang = (b: Branch) => BRANCHES.indexOf(b) % 2 === 0;

/** 지장간 — 비율은 본기 중심의 단순화된 가중치 */
export const HIDDEN_STEMS: Record<Branch, [Stem, number][]> = {
  子: [["癸", 1]],
  丑: [["己", 0.6], ["癸", 0.3], ["辛", 0.1]],
  寅: [["甲", 0.6], ["丙", 0.3], ["戊", 0.1]],
  卯: [["乙", 1]],
  辰: [["戊", 0.6], ["乙", 0.3], ["癸", 0.1]],
  巳: [["丙", 0.6], ["庚", 0.3], ["戊", 0.1]],
  午: [["丁", 0.7], ["己", 0.3]],
  未: [["己", 0.6], ["丁", 0.3], ["乙", 0.1]],
  申: [["庚", 0.6], ["壬", 0.3], ["戊", 0.1]],
  酉: [["辛", 1]],
  戌: [["戊", 0.6], ["辛", 0.3], ["丁", 0.1]],
  亥: [["壬", 0.7], ["甲", 0.3]],
};

export type TenGod = "비견" | "겁재" | "식신" | "상관" | "편재" | "정재" | "편관" | "정관" | "편인" | "정인";
export type TenGodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";

export function tenGodOf(dayStem: Stem, other: Stem): TenGod {
  const d = stemElement(dayStem);
  const o = stemElement(other);
  const same = stemYang(dayStem) === stemYang(other);
  if (o === d) return same ? "비견" : "겁재";
  if (GENERATES[d] === o) return same ? "식신" : "상관";
  if (CONTROLS[d] === o) return same ? "편재" : "정재";
  if (CONTROLS[o] === d) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

export const TEN_GOD_GROUP: Record<TenGod, TenGodGroup> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
};

/** 일간 기준으로 그룹이 가리키는 오행 */
export function groupElement(dayEl: Element, g: TenGodGroup): Element {
  switch (g) {
    case "비겁": return dayEl;
    case "식상": return GENERATES[dayEl];
    case "재성": return CONTROLS[dayEl];
    case "관성": return controlledBy(dayEl);
    case "인성": return generatedBy(dayEl);
  }
}

export const TEN_GOD_PLAIN: Record<TenGod, string> = {
  비견: "나와 같은 기운 · 나란히 걷는 친구",
  겁재: "나와 닮은 경쟁자 · 나누고 다투는 힘",
  식신: "내가 만들어 내는 것 · 여유와 표현",
  상관: "틀을 깨는 표현 · 재치와 날카로움",
  편재: "넓게 움직이는 재물 · 기회와 활동",
  정재: "차곡차곡 모으는 재물 · 성실한 결실",
  편관: "나를 단련하는 압력 · 도전과 책임",
  정관: "나를 바로 세우는 질서 · 신뢰와 규칙",
  편인: "독특한 배움 · 직관과 아이디어",
  정인: "나를 돌보는 배움 · 보호와 안정",
};

export const SIX_HARMONY: [Branch, Branch][] = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"],
];
export const SIX_CLASH: [Branch, Branch][] = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];
export const STEM_HARMONY: [Stem, Stem][] = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
];
export const pairIn = <T,>(list: [T, T][], a: T, b: T) =>
  list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 일간별 기본 성향 — 상징적 해석 */
export const DAY_MASTER_TRAITS: Record<Stem, { image: string; nature: string; strength: string[]; caution: string[] }> = {
  甲: {
    image: "곧게 자라는 큰 나무",
    nature: "방향을 정하면 위로 꾸준히 뻗어 가는 사람이에요. 책임감이 있고 주변을 이끄는 힘이 있습니다.",
    strength: ["흔들리지 않는 방향 감각", "시작하는 용기", "남을 감싸는 그늘"],
    caution: ["굽히기 어려운 고집", "혼자 다 짊어지려는 습관"],
  },
  乙: {
    image: "바람을 타는 덩굴과 꽃",
    nature: "부드럽게 휘어지며 결국 원하는 곳에 닿는 사람이에요. 관계 속에서 길을 찾는 감각이 좋습니다.",
    strength: ["유연한 적응력", "섬세한 관계 감각", "끈질긴 생명력"],
    caution: ["눈치를 너무 많이 보는 것", "결정을 미루는 마음"],
  },
  丙: {
    image: "하늘 한가운데의 태양",
    nature: "있는 그대로 밝고 숨김이 없는 사람이에요. 주변을 데우고 분위기를 살리는 힘이 있습니다.",
    strength: ["솔직한 표현력", "사람을 끄는 온기", "빠른 실행력"],
    caution: ["쉽게 달아올랐다 식는 열정", "지나친 직설"],
  },
  丁: {
    image: "어둠을 밝히는 촛불",
    nature: "조용하지만 오래 타오르는 사람이에요. 한 사람, 한 가지에 깊이 마음을 쏟습니다.",
    strength: ["집중력과 섬세함", "따뜻한 배려", "은근한 끈기"],
    caution: ["속으로만 삼키는 감정", "예민해지는 순간"],
  },
  戊: {
    image: "넓고 단단한 산",
    nature: "묵직하게 자리를 지키는 사람이에요. 믿음직하고, 많은 것을 품어 줍니다.",
    strength: ["신뢰감", "포용력", "중심을 잡는 힘"],
    caution: ["변화에 대한 느린 반응", "속마음을 잘 드러내지 않음"],
  },
  己: {
    image: "씨앗을 품은 밭",
    nature: "가꾸고 기르는 데 재능이 있는 사람이에요. 실용적이고 세심하게 사람을 챙깁니다.",
    strength: ["돌봄과 살림의 감각", "현실적인 판단", "꼼꼼함"],
    caution: ["걱정이 많아지는 마음", "자기 몫을 뒤로 미루는 것"],
  },
  庚: {
    image: "제련되기 전의 단단한 쇠",
    nature: "결단이 빠르고 의리가 있는 사람이에요. 옳다고 믿는 일에 힘을 쏟습니다.",
    strength: ["결단력", "추진력", "정의감"],
    caution: ["거칠게 들리는 말투", "한 번 정하면 돌아보지 않음"],
  },
  辛: {
    image: "잘 다듬어진 보석",
    nature: "섬세하고 기준이 분명한 사람이에요. 아름다운 것과 정확한 것을 알아봅니다.",
    strength: ["뛰어난 미감", "정교함", "자기 관리"],
    caution: ["완벽주의", "작은 말에도 상처받는 마음"],
  },
  壬: {
    image: "멀리 흐르는 큰 강",
    nature: "생각이 넓고 흐름을 읽는 사람이에요. 자유롭고 지혜롭게 길을 냅니다.",
    strength: ["넓은 시야", "지혜와 기획력", "포용하는 대범함"],
    caution: ["흩어지는 관심", "깊이 숨겨 둔 속내"],
  },
  癸: {
    image: "조용히 스미는 이슬비",
    nature: "부드럽게 스며들어 주변을 적시는 사람이에요. 직관이 좋고 감수성이 깊습니다.",
    strength: ["예민한 직관", "다정한 공감", "조용한 인내"],
    caution: ["생각이 꼬리를 무는 밤", "스스로를 작게 여기는 마음"],
  },
};
