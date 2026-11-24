// shortcut: lunar-javascript ships no types; only the members this app uses are declared
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar;
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
    toYmd(): string;
    toYmdHms(): string;
  }
  export class JieQi {
    getName(): string;
    getSolar(): Solar;
  }
  export class EightChar {
    setSect(sect: 1 | 2): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
  }
  export class Lunar {
    static fromYmd(y: number, m: number, d: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getDayInGanZhi(): string;
    getMonthInGanZhiExact(): string;
    getYearInGanZhiByLiChun(): string;
    getPrevJie(): JieQi;
    getNextJie(): JieQi;
  }
  export class LunarYear {
    static fromYear(y: number): LunarYear;
    getLeapMonth(): number;
  }
}
