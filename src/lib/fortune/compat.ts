import type { Chart } from "../saju/calc";
import type { Analysis } from "../saju/analysis";
import {
  ELEMENTS,
  ELEMENT_INFO,
  SIX_CLASH,
  SIX_HARMONY,
  STEM_HARMONY,
  STEM_KO,
  TEN_GOD_GROUP,
  pairIn,
  stemElement,
  tenGodOf,
  type Element,
  type TenGodGroup,
} from "../saju/constants";

export type Relation = "friend" | "partner" | "coworker" | "family";
export const RELATION_KO: Record<Relation, string> = { friend: "친구", partner: "연인", coworker: "동료", family: "가족" };

export interface Compat {
  score: number;
  /** 한 줄 요약 */
  type: string;
  synergy: string[];
  caution: string[];
  tip: string;
  myEl: Element;
  theirEl: Element;
  basis: string[];
}

/** 상대 일간이 내 일간에게 어떤 관계인지 (내 기준 십신 그룹) */
const PAIR_TYPE: Record<TenGodGroup, { type: string; good: string; bad: string; score: number }> = {
  비겁: { type: "닮은꼴 친구형", good: "생각과 속도가 비슷해 말이 잘 통해요", bad: "둘 다 고집이 세지면 양보가 어려워요", score: 4 },
  식상: { type: "내가 챙겨 주는 관계", good: "내 아이디어와 표현이 상대에게 잘 닿아요", bad: "내가 계속 맞춰 주다 지칠 수 있어요", score: 2 },
  재성: { type: "내가 이끄는 관계", good: "역할 분담이 분명해 일을 같이 하기 좋아요", bad: "주도권이 한쪽에 쏠리면 상대가 답답해해요", score: 1 },
  관성: { type: "나를 다잡아 주는 관계", good: "상대 덕에 책임감과 추진력이 생겨요", bad: "잔소리나 압박으로 느껴질 때가 있어요", score: 0 },
  인성: { type: "나를 도와주는 관계", good: "상대가 내 편이 되어 주고 조언이 잘 맞아요", bad: "기대기만 하면 상대가 서운해할 수 있어요", score: 3 },
};

const TIPS: Record<Relation, Record<TenGodGroup, string>> = {
  friend: {
    비겁: "의견이 갈리면 가위바위보처럼 가볍게 정하기",
    식상: "받기만 하지 말고 가끔은 먼저 챙겨 달라고 말하기",
    재성: "약속 장소·메뉴는 번갈아 정하기",
    관성: "조언은 듣되 결정은 내가 하기",
    인성: "고마운 일은 그때그때 말로 표현하기",
  },
  partner: {
    비겁: "각자의 시간을 존중하는 규칙 만들기",
    식상: "애정 표현이 한쪽으로 쏠리지 않게 주고받기",
    재성: "중요한 결정은 함께 정하기",
    관성: "서운한 점은 쌓아 두지 말고 바로 말하기",
    인성: "기념일·작은 선물로 고마움 표현하기",
  },
  coworker: {
    비겁: "업무 범위를 처음에 나눠 두기",
    식상: "내가 낸 아이디어는 기록으로 남기기",
    재성: "진행 상황을 자주 공유해 일방적으로 느끼지 않게",
    관성: "피드백은 감정보다 기준 중심으로 받기",
    인성: "배운 점은 결과로 돌려주기",
  },
  family: {
    비겁: "집안일·역할 분담을 분명히 하기",
    식상: "챙겨 주는 쪽도 쉬는 날 정하기",
    재성: "상대 의견을 먼저 묻고 정하기",
    관성: "걱정은 잔소리보다 질문으로 전하기",
    인성: "도움받은 만큼 표현하기",
  },
};

const strongest = (a: Analysis) => [...ELEMENTS].sort((x, y) => a.weighted[y] - a.weighted[x])[0];

/**
 * 두 사람 사주의 관계. 전통 명리학의 일간 관계·합충·오행 보완을 규칙으로 옮긴 상징적 해석.
 */
export function compatibility(me: Chart, ma: Analysis, them: Chart, ta: Analysis, rel: Relation): Compat {
  const myDM = me.day.stem;
  const thDM = them.day.stem;
  const group = TEN_GOD_GROUP[tenGodOf(myDM, thDM)];
  const t = PAIR_TYPE[group];
  const synergy = [t.good];
  const caution = [t.bad];
  const basis = [`일간 ${STEM_KO[myDM]}(${myDM}) ↔ ${STEM_KO[thDM]}(${thDM}) · ${group}`];
  let score = 62 + t.score * 3;

  if (pairIn(STEM_HARMONY, myDM, thDM)) {
    score += 10;
    synergy.push("일간끼리 합(合)이라 서로 자연스럽게 끌려요");
    basis.push("일간 천간합");
  }
  if (pairIn(SIX_HARMONY, me.day.branch, them.day.branch)) {
    score += 8;
    synergy.push("생활 리듬과 속마음이 잘 맞는 편이에요");
    basis.push("일지 육합");
  }
  if (pairIn(SIX_CLASH, me.day.branch, them.day.branch)) {
    score -= 9;
    caution.push("생활 방식이 달라 가까이 지낼수록 부딪힐 수 있어요");
    basis.push("일지 충");
  }
  if (pairIn(SIX_HARMONY, me.year.branch, them.year.branch)) {
    score += 4;
    synergy.push("띠끼리 합이라 첫인상부터 편해요");
    basis.push("년지 합");
  }
  if (pairIn(SIX_CLASH, me.year.branch, them.year.branch)) {
    score -= 4;
    caution.push("띠끼리 충이라 처음엔 낯설게 느껴질 수 있어요");
    basis.push("년지 충");
  }

  // 오행 보완: 상대의 가장 강한 기운이 나에게 반가운 기운인지
  const ts = strongest(ta);
  const ms = strongest(ma);
  if (ma.favorable[ts] >= 2) {
    score += 6;
    synergy.push(`상대의 ${ELEMENT_INFO[ts].ko}(${ELEMENT_INFO[ts].hanja}) 기운이 나에게 부족한 부분을 채워 줘요`);
    basis.push(`상대 강한 기운 ${ELEMENT_INFO[ts].ko} → 나에게 반가움`);
  } else if (ma.favorable[ts] < 0) {
    score -= 4;
    caution.push(`상대의 ${ELEMENT_INFO[ts].ko} 기운이 이미 나에게 넘치는 기운이라 같이 있으면 쉽게 피곤해질 수 있어요`);
  }
  if (ta.favorable[ms] >= 2) {
    score += 6;
    synergy.push(`내 ${ELEMENT_INFO[ms].ko}(${ELEMENT_INFO[ms].hanja}) 기운이 상대에게 힘이 돼요`);
    basis.push(`내 강한 기운 ${ELEMENT_INFO[ms].ko} → 상대에게 반가움`);
  }
  if (ms === ts) {
    caution.push(`둘 다 ${ELEMENT_INFO[ms].ko} 기운이 강해 같은 약점을 공유해요. 서로 브레이크가 되어 주세요`);
  }

  return {
    score: Math.max(30, Math.min(97, Math.round(score))),
    type: t.type,
    synergy: synergy.slice(0, 4),
    caution: caution.slice(0, 3),
    tip: TIPS[rel][group],
    myEl: stemElement(myDM),
    theirEl: stemElement(thDM),
    basis,
  };
}
