import { Lunar, Solar } from "lunar-javascript";
import type { Branch, Stem } from "./constants";

export type CalendarType = "solar" | "lunar";
/** split: 23시(자시)에 일주가 바뀜 · unified: 0시에 바뀜(야자시) */
export type JasiRule = "split" | "unified";

export interface BirthInput {
  calendar: CalendarType;
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  /** null = 출생 시간 모름 */
  hour: number | null;
  minute: number | null;
  /** 입력 방식: 시진(2시간 단위) 선택 · 정확한 시각 · 모름. 없으면 아직 고르지 않은 상태 */
  timeMode?: "sijin" | "exact" | "unknown";
  regionId: string;
  /** regionId === "abroad" 일 때 UTC 오프셋(분) */
  utcOffsetMin?: number;
}

export interface Region {
  id: string;
  name: string;
  lon: number;
}

export const REGIONS: Region[] = [
  { id: "seoul", name: "서울", lon: 126.98 },
  { id: "incheon", name: "인천", lon: 126.7 },
  { id: "suwon", name: "수원·경기 남부", lon: 127.03 },
  { id: "chuncheon", name: "춘천", lon: 127.73 },
  { id: "wonju", name: "원주", lon: 127.95 },
  { id: "gangneung", name: "강릉", lon: 128.9 },
  { id: "cheongju", name: "청주", lon: 127.49 },
  { id: "daejeon", name: "대전", lon: 127.38 },
  { id: "sejong", name: "세종", lon: 127.29 },
  { id: "jeonju", name: "전주", lon: 127.15 },
  { id: "gwangju", name: "광주", lon: 126.85 },
  { id: "mokpo", name: "목포", lon: 126.39 },
  { id: "daegu", name: "대구", lon: 128.6 },
  { id: "andong", name: "안동", lon: 128.73 },
  { id: "pohang", name: "포항", lon: 129.37 },
  { id: "ulsan", name: "울산", lon: 129.31 },
  { id: "busan", name: "부산", lon: 129.08 },
  { id: "changwon", name: "창원", lon: 128.68 },
  { id: "jeju", name: "제주", lon: 126.53 },
  { id: "seongnam", name: "성남", lon: 127.13 },
  { id: "goyang", name: "고양", lon: 126.83 },
  { id: "yongin", name: "용인", lon: 127.18 },
  { id: "bucheon", name: "부천", lon: 126.78 },
  { id: "ansan", name: "안산", lon: 126.83 },
  { id: "anyang", name: "안양", lon: 126.95 },
  { id: "namyangju", name: "남양주", lon: 127.22 },
  { id: "hwaseong", name: "화성", lon: 126.83 },
  { id: "pyeongtaek", name: "평택", lon: 127.11 },
  { id: "uijeongbu", name: "의정부", lon: 127.04 },
  { id: "paju", name: "파주", lon: 126.78 },
  { id: "gimpo", name: "김포", lon: 126.72 },
  { id: "cheonan", name: "천안", lon: 127.15 },
  { id: "asan", name: "아산", lon: 127.0 },
  { id: "seosan", name: "서산", lon: 126.45 },
  { id: "chungju", name: "충주", lon: 127.93 },
  { id: "jecheon", name: "제천", lon: 128.19 },
  { id: "sokcho", name: "속초", lon: 128.59 },
  { id: "gunsan", name: "군산", lon: 126.74 },
  { id: "iksan", name: "익산", lon: 126.96 },
  { id: "suncheon", name: "순천", lon: 127.49 },
  { id: "yeosu", name: "여수", lon: 127.66 },
  { id: "gumi", name: "구미", lon: 128.34 },
  { id: "gyeongju", name: "경주", lon: 129.22 },
  { id: "jinju", name: "진주", lon: 128.08 },
  { id: "gimhae", name: "김해", lon: 128.89 },
  { id: "yangsan", name: "양산", lon: 129.04 },
  { id: "tongyeong", name: "통영", lon: 128.43 },
  { id: "geoje", name: "거제", lon: 128.62 },
  { id: "unknown", name: "모름", lon: 127.5 },
  { id: "abroad", name: "해외", lon: 0 },
];

/**
 * 한국 표준시의 역사적 변화와 1987·1988년 일광절약시간을 반영한 UTC 오프셋(분).
 * shortcut: 1948~1951, 1955~1960년 서머타임은 반영하지 않음 — 정확한 날짜 표 확보 시 추가
 */
export function koreaOffsetMinutes(y: number, m: number, d: number, h: number): number {
  const key = y * 1e6 + m * 1e4 + d * 100 + h;
  let off = 540;
  if (key < 1912010100) off = 510;
  else if (key >= 1954032100 && key < 1961081000) off = 510;
  // 1987-05-10 02시 ~ 10-11 03시, 1988-05-08 02시 ~ 10-09 03시 (현지 시각)
  if ((key >= 1987051002 && key < 1987101103) || (key >= 1988050802 && key < 1988100903)) off += 60;
  return off;
}

export interface Pillar {
  stem: Stem;
  branch: Branch;
}

export interface Chart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  /** 실제로 계산에 쓴 양력 날짜/시각(현지 시계 기준) */
  solarDate: { y: number; m: number; d: number };
  /** 경도 보정된 지방평균시 (시주 계산 기준) */
  lmt: { h: number; mi: number } | null;
  correctionMin: number | null;
  notes: string[];
}

const toPillar = (gz: string): Pillar => ({ stem: gz[0] as Stem, branch: gz[1] as Branch });

/** 음력(윤달 포함) → 양력. 존재하지 않는 날짜면 null */
export function lunarToSolar(y: number, m: number, d: number, leap: boolean) {
  try {
    const l = Lunar.fromYmd(y, leap ? -m : m, d);
    // 라이브러리는 말일을 넘긴 날짜도 다음 달로 넘겨버리므로 왕복 변환으로 검증
    const s = l.getSolar();
    const back = s.getLunar();
    if (back.getYear() !== y || back.getMonth() !== (leap ? -m : m) || back.getDay() !== d) return null;
    return { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
  } catch {
    return null;
  }
}

function shift(y: number, m: number, d: number, h: number, mi: number, deltaMin: number) {
  const t = new Date(Date.UTC(y, m - 1, d, h, mi) + deltaMin * 60000);
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes()] as const;
}

/**
 * 사주팔자 계산.
 * - 연주·월주: 절입 시각이 베이징 시(UTC+8)로 계산되는 라이브러리 특성상, 출생 순간을 UTC+8 시각으로 바꿔 판정
 * - 일주·시주: 출생지 경도로 보정한 지방평균시 기준
 */
export function computeChart(input: BirthInput, jasi: JasiRule = "split"): Chart | null {
  const notes: string[] = [];
  let date = { y: input.year, m: input.month, d: input.day };
  if (input.calendar === "lunar") {
    const s = lunarToSolar(input.year, input.month, input.day, input.leapMonth);
    if (!s) return null;
    date = s;
    notes.push("음력 날짜는 중국 기준 음력표로 변환했어요. 한국 음력과 드물게 하루 차이가 날 수 있습니다.");
  } else {
    const check = new Date(Date.UTC(date.y, date.m - 1, date.d));
    if (check.getUTCMonth() !== date.m - 1 || check.getUTCDate() !== date.d) return null;
  }
  if (date.y < 1900 || date.y > 2100) return null;
  // 시각을 입력 중이거나 범위를 벗어나면 계산하지 않는다
  if (input.hour !== null && (input.hour < 0 || input.hour > 23 || input.minute === null || input.minute < 0 || input.minute > 59)) return null;

  const region = REGIONS.find((r) => r.id === input.regionId) ?? REGIONS[0];
  const known = input.hour !== null;
  const h = input.hour ?? 12;
  const mi = input.minute ?? 0;

  let offset: number;
  let lon: number;
  if (region.id === "abroad") {
    offset = input.utcOffsetMin ?? 540;
    lon = offset / 4; // 표준 자오선 가정
    notes.push("해외 출생은 표준시 자오선을 기준으로 계산하며, 현지 서머타임은 반영하지 않았어요.");
  } else {
    offset = koreaOffsetMinutes(date.y, date.m, date.d, h);
    lon = region.lon;
    if (region.id === "unknown") notes.push("출생지를 몰라 한반도 중부(동경 127.5°) 기준으로 시주를 계산했어요. 실제 출생지와 최대 10분 안팎 차이가 날 수 있어요.");
    if (offset !== 540) notes.push(`출생 당시 한국 표준시는 UTC+${Math.floor(offset / 60)}:${String(offset % 60).padStart(2, "0")}였고, 이를 반영했어요.`);
    if ((date.y >= 1948 && date.y <= 1951) || (date.y >= 1955 && date.y <= 1960))
      notes.push("이 시기에는 서머타임이 시행된 해가 있어 시주가 한 시간 어긋날 수 있어요.");
  }

  // 연·월주용: UTC+8 환산 시각
  const bj = shift(date.y, date.m, date.d, h, mi, 480 - offset);
  const ecYM = Solar.fromYmdHms(bj[0], bj[1], bj[2], bj[3], bj[4], 0).getLunar().getEightChar();

  // 일·시주용: 지방평균시 = UTC + 경도×4분
  const correction = lon * 4 - offset;
  const lmt = shift(date.y, date.m, date.d, h, mi, correction);
  const ecDH = Solar.fromYmdHms(lmt[0], lmt[1], lmt[2], lmt[3], lmt[4], 0).getLunar().getEightChar();
  ecDH.setSect(jasi === "split" ? 1 : 2);

  if (!known) {
    notes.push("출생 시간을 모르면 시주 없이 세 기둥으로 해석해요. 성향과 오행 균형의 약 1/4이 비어 있는 셈입니다.");
    // 절입일 출생이면 월주가 시간에 따라 갈릴 수 있음
    const jie = Solar.fromYmd(date.y, date.m, date.d).getLunar().getPrevJie().getSolar();
    const next = Solar.fromYmd(date.y, date.m, date.d).getLunar().getNextJie().getSolar();
    const sameDay = (s: Solar) => s.getYear() === date.y && s.getMonth() === date.m && s.getDay() === date.d;
    if (sameDay(jie) || sameDay(next)) notes.push("절기가 바뀌는 날에 태어나 월주(달의 기둥)가 출생 시각에 따라 달라질 수 있어요.");
  }

  return {
    year: toPillar(ecYM.getYear()),
    month: toPillar(ecYM.getMonth()),
    day: toPillar(ecDH.getDay()),
    hour: known ? toPillar(ecDH.getTime()) : null,
    solarDate: date,
    lmt: known ? { h: lmt[3], mi: lmt[4] } : null,
    correctionMin: known ? Math.round(correction) : null,
    notes,
  };
}

/** 특정 날짜(현지 달력)의 일진 */
export function dayPillarOf(y: number, m: number, d: number): Pillar {
  return toPillar(Solar.fromYmd(y, m, d).getLunar().getDayInGanZhi());
}
/** 특정 날짜 정오 기준 월운(절기 월) */
export function monthPillarOf(y: number, m: number, d: number): Pillar {
  return toPillar(Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar().getMonth());
}
