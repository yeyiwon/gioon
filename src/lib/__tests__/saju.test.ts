import { describe, expect, it } from "vitest";
import { computeChart, lunarToSolar, type BirthInput } from "../saju/calc";
import { analyze } from "../saju/analysis";
import { BRANCHES, STEMS } from "../saju/constants";
import { computeDaily } from "../fortune/daily";
import { compatibility } from "../fortune/compat";
import { findSinsal } from "../saju/sinsal";

const birth = (o: Partial<BirthInput>): BirthInput => ({
  calendar: "solar", leapMonth: false, year: 2000, month: 1, day: 1, hour: 12, minute: 0, regionId: "seoul", ...o,
});
const gz = (p: { stem: string; branch: string } | null) => (p ? p.stem + p.branch : null);
const gzIndex = (i: number) => STEMS[((i % 10) + 10) % 10] + BRANCHES[((i % 12) + 12) % 12];
/** 독립 검증: 율리우스 적일 기반 일진 (JDN+49) mod 60, 0=甲子 */
function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

describe("사주 원국", () => {
  it("2000-01-01 12:00 서울 → 己卯 丙子 戊午 戊午", () => {
    const c = computeChart(birth({}))!;
    expect([gz(c.year), gz(c.month), gz(c.day), gz(c.hour)]).toEqual(["己卯", "丙子", "戊午", "戊午"]);
    expect(c.correctionMin).toBe(-32); // 126.98° → 약 32분 늦음
  });

  it("일주가 율리우스 적일 공식과 400개 날짜에서 일치", () => {
    for (let i = 0; i < 400; i++) {
      const t = new Date(Date.UTC(1920, 0, 1) + i * 73 * 86400000 + (i % 7) * 86400000);
      const [y, m, d] = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
      const c = computeChart(birth({ year: y, month: m, day: d, hour: 14 }))!;
      expect(gz(c.day)).toBe(gzIndex(jdn(y, m, d) + 49));
    }
  });

  it("연주는 입춘 이후 (y-4) mod 60, 월간은 연상기월법을 따른다", () => {
    const tigerStem: Record<string, string> = { 甲: "丙", 己: "丙", 乙: "戊", 庚: "戊", 丙: "庚", 辛: "庚", 丁: "壬", 壬: "壬", 戊: "甲", 癸: "甲" };
    for (let y = 1930; y < 2060; y += 3) {
      const c = computeChart(birth({ year: y, month: 7, day: 15 }))!;
      expect(gz(c.year)).toBe(gzIndex(y - 4));
      const offset = (BRANCHES.indexOf(c.month.branch) - 2 + 12) % 12;
      expect(c.month.stem).toBe(STEMS[(STEMS.indexOf(tigerStem[c.year.stem] as never) + offset) % 10]);
    }
  });

  it("입춘 경계: 1984 입춘은 베이징 23:18 = 서울 2/5 00:18", () => {
    expect(gz(computeChart(birth({ year: 1984, month: 2, day: 5, hour: 0, minute: 10 }))!.year)).toBe("癸亥");
    expect(gz(computeChart(birth({ year: 1984, month: 2, day: 5, hour: 0, minute: 30 }))!.year)).toBe("甲子");
  });

  it("자시 규칙: 23:50 출생은 기준에 따라 일주가 달라진다", () => {
    const split = computeChart(birth({ hour: 23, minute: 50 }), "split")!;
    const unified = computeChart(birth({ hour: 23, minute: 50 }), "unified")!;
    expect(gz(split.day)).toBe("己未");
    expect(gz(unified.day)).toBe("戊午");
    expect(split.hour!.branch).toBe("子");
  });

  it("1987년 서머타임과 1954~61년 UTC+8:30을 반영", () => {
    expect(computeChart(birth({ year: 1987, month: 7, day: 1 }))!.correctionMin).toBe(-92);
    expect(computeChart(birth({ year: 1958, month: 3, day: 1 }))!.correctionMin).toBe(-2);
  });

  it("음력·윤달 변환과 잘못된 날짜 거부", () => {
    expect(lunarToSolar(2000, 1, 1, false)).toEqual({ y: 2000, m: 2, d: 5 });
    expect(lunarToSolar(2020, 4, 1, true)).toEqual({ y: 2020, m: 5, d: 23 });
    expect(lunarToSolar(2021, 4, 1, true)).toBeNull();
    expect(computeChart(birth({ month: 2, day: 30 }))).toBeNull();
  });

  it("출생지 모름이면 한반도 중부 경도로 계산하고 안내가 붙는다", () => {
    const c = computeChart(birth({ regionId: "unknown" }))!;
    expect(c.correctionMin).toBe(-30); // 127.5° → 30분
    expect(c.notes.join()).toContain("출생지를 몰라");
  });

  it("시간 모름이면 시주가 없고 안내가 붙는다", () => {
    const c = computeChart(birth({ hour: null, minute: null }))!;
    expect(c.hour).toBeNull();
    expect(c.notes.join()).toContain("시주 없이");
  });
});

describe("오늘의 운세", () => {
  // 가상의 인물 (실존 인물 정보 아님)
  const c = computeChart(birth({ year: 1993, month: 5, day: 17, hour: 8, minute: 20 }))!;
  const a = analyze(c);

  it("같은 사람·같은 날짜는 항상 같은 결과", () => {
    expect(computeDaily(c, "p1", 2026, 11, 25, a)).toEqual(computeDaily(c, "p1", 2026, 11, 25));
  });

  it("날짜가 바뀌면 일진과 결과가 바뀌고, 필요한 기운도 여러 가지로 나온다", () => {
    const seen = new Set<string>();
    const pillars = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const t = new Date(Date.UTC(2026, 10, 1) + i * 86400000);
      const f = computeDaily(c, "p1", t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), a);
      seen.add(f.need);
      pillars.add(f.pillarKo);
      expect(f.scores.every((s) => s.level >= 1 && s.level <= 5)).toBe(true);
    }
    expect(pillars.size).toBe(60);
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it("오행 분포 합계는 기둥 수와 일치", () => {
    const sum = Object.values(a.surface).reduce((x, y) => x + y, 0);
    expect(sum).toBe(8);
  });
});

describe("궁합", () => {
  // 가상의 두 사람
  const a = computeChart(birth({ year: 1992, month: 4, day: 3, hour: 7 }))!;
  const b = computeChart(birth({ year: 1994, month: 10, day: 21, hour: null, minute: null }))!;
  it("같은 입력이면 같은 결과, 점수는 범위 안", () => {
    const x = compatibility(a, analyze(a), b, analyze(b), "friend");
    expect(x).toEqual(compatibility(a, analyze(a), b, analyze(b), "friend"));
    expect(x.score).toBeGreaterThanOrEqual(30);
    expect(x.score).toBeLessThanOrEqual(97);
    expect(x.synergy.length).toBeGreaterThan(0);
    expect(x.caution.length).toBeGreaterThan(0);
  });
  it("일간 천간합(甲己)이면 합 근거가 붙는다", () => {
    // 2000-01-01 戊午일, 戊癸합 → 癸일 찾기
    const me = computeChart(birth({}))!; // 戊
    let other = null;
    for (let d = 1; d <= 10 && !other; d++) {
      const c = computeChart(birth({ year: 2001, month: 5, day: d }))!;
      if (c.day.stem === "癸") other = c;
    }
    const x = compatibility(me, analyze(me), other!, analyze(other!), "partner");
    expect(x.basis).toContain("일간 천간합");
  });
});

describe("신살", () => {
  it("2000-01-01 12:00 서울(己卯 丙子 戊午 戊午): 도화살(년·월), 양인살(일·시)", () => {
    const s = findSinsal(computeChart(birth({}))!);
    expect(s.map((x) => [x.name, x.where.join("")])).toEqual([
      ["도화살", "년월"],
      ["양인살", "일시"],
    ]);
  });
  it("甲일간에 丑·未가 있으면 천을귀인", () => {
    // 甲일 + 丑월을 가진 날짜 찾기 (1월 초는 丑월)
    let found = null;
    for (let d = 6; d <= 30 && !found; d++) {
      const c = computeChart(birth({ year: 2001, month: 1, day: d }))!;
      if (c.day.stem === "甲" && c.month.branch === "丑") found = c;
    }
    expect(findSinsal(found!).some((x) => x.name === "천을귀인" && x.where.includes("월"))).toBe(true);
  });
});
