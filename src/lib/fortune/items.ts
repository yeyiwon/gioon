import type { Element } from "../saju/constants";

export interface Swatch {
  name: string;
  hex: string;
}

/** 일상에서 바로 알아볼 수 있는 이름만 쓴다. 첫 색일수록 그 오행을 대표한다 */
export const SOCK_COLORS: Record<Element, Swatch[]> = {
  wood: [{ name: "라임 그린", hex: "#9BE15D" }, { name: "민트", hex: "#5FD3A2" }, { name: "올리브 그린", hex: "#7B8F3A" }, { name: "카키", hex: "#8A8A5C" }],
  fire: [{ name: "오렌지", hex: "#FF7A2F" }, { name: "코랄 핑크", hex: "#FF6F7D" }, { name: "레드", hex: "#E8392B" }, { name: "핑크", hex: "#FF8FB8" }],
  earth: [{ name: "레몬 옐로", hex: "#FFD23F" }, { name: "머스터드", hex: "#E1AD22" }, { name: "베이지", hex: "#DCC9A6" }, { name: "카멜", hex: "#C99A5B" }],
  metal: [{ name: "퓨어 화이트", hex: "#FFFFFF" }, { name: "크림 화이트", hex: "#F6F1E4" }, { name: "실버 그레이", hex: "#C3C7CF" }, { name: "라벤더", hex: "#B9ADFF" }],
  water: [{ name: "네이비", hex: "#1F2A5C" }, { name: "스카이 블루", hex: "#7FB2FF" }, { name: "차콜", hex: "#3A3D44" }, { name: "코발트 블루", hex: "#2F5BFF" }],
};

/** 옷 종류만 고르고, 색 이름은 보조 컬러에서 붙인다 (이름과 스와치가 어긋나지 않게) */
export const OUTFITS: Record<Element, string[]> = {
  wood: ["셔츠", "카디건", "니트", "셔츠 재킷"],
  fire: ["니트", "스카프", "셔츠", "맨투맨"],
  earth: ["니트", "코트", "트렌치코트", "코듀로이 팬츠"],
  metal: ["셔츠", "니트", "블라우스", "재킷"],
  water: ["니트", "코트", "셔츠", "터틀넥"],
};

export const ACCESSORIES: Record<Element, string[]> = {
  wood: ["나무 비즈 팔찌", "잎사귀 모티프 브로치", "라탄 키링", "대나무 머리핀"],
  fire: ["붉은 실 팔찌", "작은 하트 펜던트", "체리색 립밤", "향초 모양 참"],
  earth: ["세라믹 반지", "앰버 펜던트", "리넨 스카프", "도토리 키링"],
  metal: ["얇은 은반지", "진주 귀걸이", "메탈 손목시계", "은빛 머리핀"],
  water: ["유리구슬 팔찌", "물방울 귀걸이", "푸른 스톤 반지", "흑진주 목걸이"],
};

export const FOODS: Record<Element, string[]> = {
  wood: ["봄나물 비빔밥", "시금치 페스토 파스타", "쑥떡", "청포도", "샐러드 볼"],
  fire: ["토마토 스튜", "김치볶음밥", "딸기 한 접시", "떡볶이", "고추장 불고기"],
  earth: ["단호박죽", "군고구마", "된장찌개", "현미 주먹밥", "꿀 바른 토스트"],
  metal: ["배 한 조각", "두부 구이", "무생채 비빔밥", "닭가슴살 샐러드", "도라지 무침"],
  water: ["미역국", "검은콩 두유", "블루베리 요거트", "해물 파스타", "김밥 한 줄"],
};

export const DRINKS: Record<Element, string[]> = {
  wood: ["녹차", "말차 라떼", "민트티", "청귤차"],
  fire: ["홍차", "히비스커스티", "생강차", "핫초코"],
  earth: ["보리차", "옥수수수염차", "대추차", "꿀차"],
  metal: ["따뜻한 우유", "배숙", "도라지차", "탄산수"],
  water: ["따뜻한 물 한 잔", "흑임자 라떼", "결명자차", "블루베리 스무디"],
};

/** 하도(河圖)의 오행 수 */
export const NUMBERS: Record<Element, [number, number]> = {
  wood: [3, 8],
  fire: [2, 7],
  earth: [5, 10],
  metal: [4, 9],
  water: [1, 6],
};

export const DIRECTIONS: Record<Element, { name: string; deg: number | null; hint: string }> = {
  wood: { name: "동쪽", deg: 90, hint: "해가 뜨는 쪽 창가" },
  fire: { name: "남쪽", deg: 180, hint: "볕이 잘 드는 자리" },
  earth: { name: "가운데", deg: null, hint: "익숙한 자리, 집 가까운 곳" },
  metal: { name: "서쪽", deg: 270, hint: "해 지는 쪽 산책길" },
  water: { name: "북쪽", deg: 0, hint: "조용하고 서늘한 곳" },
};

export const RITUALS: Record<Element, string[]> = {
  wood: ["화분에 물 주기", "20분 걷기", "새 노트 첫 장 쓰기", "스트레칭 5분"],
  fire: ["햇볕 10분 쬐기", "먼저 인사 건네기", "좋아하는 노래 크게 듣기", "고마운 사람에게 메시지 보내기"],
  earth: ["책상 한 칸 정리", "일정표 다시 보기", "따뜻한 밥 천천히 먹기", "맨발로 바닥 느끼기"],
  metal: ["서랍 하나 비우기", "할 일 세 개만 정하기", "손톱 정리하기", "한 번 정중히 거절하기"],
  water: ["물 한 잔 천천히 마시기", "10분 눈 감고 쉬기", "반신욕", "일기 세 줄 쓰기"],
};

export type SockPattern = "solid" | "stripe" | "dot" | "rib" | "argyle" | "wave" | "check";
export type SockShape = "ankle" | "crew" | "knee";

export const SOCK_PATTERN_KO: Record<SockPattern, string> = {
  solid: "무지",
  stripe: "스트라이프",
  dot: "도트",
  rib: "골지",
  argyle: "아가일",
  wave: "물결",
  check: "체크",
};
export const SOCK_SHAPE_KO: Record<SockShape, string> = {
  ankle: "발목 양말",
  crew: "크루 삭스",
  knee: "니삭스",
};

/** 오행별로 어울리는 패턴을 앞에 둔다 */
export const SOCK_PATTERNS: Record<Element, SockPattern[]> = {
  wood: ["solid", "stripe", "dot", "check"],
  fire: ["solid", "dot", "argyle", "stripe"],
  earth: ["solid", "rib", "check", "argyle"],
  metal: ["solid", "stripe", "argyle", "rib"],
  water: ["solid", "wave", "stripe", "dot"],
};

export type CharmKind = "sprout" | "sun" | "pebble" | "star" | "marble" | "ribbon" | "gem";
export const CHARM_BY_ELEMENT: Record<Element, CharmKind> = {
  wood: "sprout",
  fire: "sun",
  earth: "pebble",
  metal: "star",
  water: "marble",
};
export const CHARM_KO: Record<CharmKind, string> = {
  sprout: "새싹 부적",
  sun: "작은 해",
  pebble: "말랑한 조약돌",
  star: "은빛 별",
  marble: "유리구슬",
  ribbon: "인연의 리본",
  gem: "작은 보석",
};
