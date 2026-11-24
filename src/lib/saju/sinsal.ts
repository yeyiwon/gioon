import type { Chart, Pillar } from "./calc";
import type { Branch, Stem } from "./constants";

/** 신살: 전통 명리학 조견표 기준. 길흉 단정이 아니라 기질·경향을 보는 참고용 */
export interface Sinsal {
  id: string;
  name: string;
  hanja: string;
  kind: "귀인" | "살";
  /** 원국에서 걸린 자리 */
  where: string[];
  plain: string;
  tip: string;
}

const POS = ["년", "월", "일", "시"] as const;

const CHEONEUL: Record<Stem, Branch[]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  辛: ["寅", "午"],
  壬: ["巳", "卯"], 癸: ["巳", "卯"],
};
const MUNCHANG: Record<Stem, Branch> = {
  甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯",
};
const HONGYEOM: Record<Stem, Branch> = {
  甲: "午", 乙: "午", 丙: "寅", 丁: "未", 戊: "辰", 己: "辰", 庚: "戌", 辛: "酉", 壬: "子", 癸: "申",
};
const YANGIN: Partial<Record<Stem, Branch>> = { 甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子" };

/** 삼합 그룹 기준 역마·도화·화개 */
const SAMHAP: { members: Branch[]; yeokma: Branch; dohwa: Branch; hwagae: Branch }[] = [
  { members: ["申", "子", "辰"], yeokma: "寅", dohwa: "酉", hwagae: "辰" },
  { members: ["寅", "午", "戌"], yeokma: "申", dohwa: "卯", hwagae: "戌" },
  { members: ["巳", "酉", "丑"], yeokma: "亥", dohwa: "午", hwagae: "丑" },
  { members: ["亥", "卯", "未"], yeokma: "巳", dohwa: "子", hwagae: "未" },
];
/** 월지 삼합 → 월덕귀인 천간 */
const WOLDEOK: { members: Branch[]; stem: Stem }[] = [
  { members: ["寅", "午", "戌"], stem: "丙" },
  { members: ["申", "子", "辰"], stem: "壬" },
  { members: ["亥", "卯", "未"], stem: "甲" },
  { members: ["巳", "酉", "丑"], stem: "庚" },
];
const BAEKHO = ["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"];
const GOEGANG = ["庚辰", "庚戌", "壬辰", "壬戌"];

const INFO: Record<string, Omit<Sinsal, "where">> = {
  cheoneul: { id: "cheoneul", name: "천을귀인", hanja: "天乙貴人", kind: "귀인", plain: "어려울 때 도와주는 사람이 나타나는 복", tip: "도움을 청하는 걸 망설이지 마세요" },
  munchang: { id: "munchang", name: "문창귀인", hanja: "文昌貴人", kind: "귀인", plain: "배움·글·시험과 인연이 좋은 기운", tip: "공부·자격증·글쓰기에 힘을 실어 보세요" },
  woldeok: { id: "woldeok", name: "월덕귀인", hanja: "月德貴人", kind: "귀인", plain: "베푼 만큼 돌아오고 큰 탈을 피해 가는 덕", tip: "작은 친절이 나중에 크게 돌아와요" },
  yeokma: { id: "yeokma", name: "역마살", hanja: "驛馬煞", kind: "살", plain: "이동·여행·변화가 많고 활동 반경이 넓은 기운", tip: "출장·이사·여행이 기회가 되기 쉬워요" },
  dohwa: { id: "dohwa", name: "도화살", hanja: "桃花煞", kind: "살", plain: "사람을 끄는 매력과 인기", tip: "사람을 만나는 일에서 강점을 살려 보세요" },
  hwagae: { id: "hwagae", name: "화개살", hanja: "華蓋煞", kind: "살", plain: "예술·종교·연구처럼 깊이 파고드는 기질", tip: "혼자 몰입하는 시간이 에너지를 채워 줘요" },
  hongyeom: { id: "hongyeom", name: "홍염살", hanja: "紅艶煞", kind: "살", plain: "은근하게 끌리는 분위기와 감성", tip: "감정 표현이 관계를 부드럽게 만들어요" },
  yangin: { id: "yangin", name: "양인살", hanja: "羊刃煞", kind: "살", plain: "강한 추진력과 승부욕", tip: "급할수록 한 박자 쉬어 가세요" },
  baekho: { id: "baekho", name: "백호살", hanja: "白虎煞", kind: "살", plain: "기운이 강하고 결단이 빠름. 다치거나 무리하는 일 주의", tip: "운전·운동할 때 안전을 한 번 더 챙기세요" },
  goegang: { id: "goegang", name: "괴강살", hanja: "魁罡煞", kind: "살", plain: "카리스마와 리더십, 굽히지 않는 고집", tip: "부드러운 말투가 강점을 더 빛나게 해요" },
};

const pillarsOf = (c: Chart): (Pillar | null)[] => [c.year, c.month, c.day, c.hour];

export function findSinsal(c: Chart): Sinsal[] {
  const ps = pillarsOf(c);
  const dm = c.day.stem;
  const hits: Record<string, Set<string>> = {};
  const add = (id: string, pos: string) => (hits[id] ??= new Set()).add(pos);

  ps.forEach((p, i) => {
    if (!p) return;
    const pos = POS[i];
    if (CHEONEUL[dm].includes(p.branch)) add("cheoneul", pos);
    if (MUNCHANG[dm] === p.branch) add("munchang", pos);
    if (HONGYEOM[dm] === p.branch) add("hongyeom", pos);
    if (YANGIN[dm] === p.branch) add("yangin", pos);
    if (BAEKHO.includes(p.stem + p.branch)) add("baekho", pos);
    if (i === 2 && GOEGANG.includes(p.stem + p.branch)) add("goegang", pos);
  });
  // 역마·도화·화개: 년지와 일지를 기준으로 다른 자리를 본다
  for (const baseIdx of [0, 2]) {
    const g = SAMHAP.find((x) => x.members.includes(ps[baseIdx]!.branch))!;
    ps.forEach((p, i) => {
      if (!p || i === baseIdx) return;
      if (p.branch === g.yeokma) add("yeokma", POS[i]);
      if (p.branch === g.dohwa) add("dohwa", POS[i]);
      if (p.branch === g.hwagae) add("hwagae", POS[i]);
    });
  }
  const wd = WOLDEOK.find((x) => x.members.includes(c.month.branch))!;
  ps.forEach((p, i) => p && p.stem === wd.stem && add("woldeok", POS[i]));

  const order = ["cheoneul", "munchang", "woldeok", "yeokma", "dohwa", "hwagae", "hongyeom", "yangin", "baekho", "goegang"];
  return order.filter((id) => hits[id]).map((id) => ({ ...INFO[id], where: [...hits[id]].sort((a, b) => POS.indexOf(a as never) - POS.indexOf(b as never)) }));
}

/** 오늘 일진의 지지가 내 천을귀인 자리인지 */
export const isCheoneulDay = (dayStem: Stem, todayBranch: Branch) => CHEONEUL[dayStem].includes(todayBranch);

export const SINSAL_CHECKED = Object.values(INFO).map((x) => x.name);
