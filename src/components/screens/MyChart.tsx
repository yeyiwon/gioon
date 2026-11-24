"use client";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { useChart } from "@/lib/hooks";
import { STRENGTH_KO } from "@/lib/saju/analysis";
import {
  BRANCH_ANIMAL,
  BRANCH_KO,
  DAY_MASTER_TRAITS,
  ELEMENTS,
  ELEMENT_INFO,
  HIDDEN_STEMS,
  STEM_KO,
  TEN_GOD_PLAIN,
  branchElement,
  groupElement,
  stemElement,
  stemYang,
  tenGodOf,
  type Element,
  type Stem,
  type Branch,
  type TenGodGroup,
} from "@/lib/saju/constants";
import { REGIONS } from "@/lib/saju/calc";
import { CharacterSlot } from "../Slots3D";
import { CompatSection } from "../Compat";
import { timeLabel } from "../ProfileForm";
import { SHAPES, CountUp } from "./Today";
import { Sheet } from "../Sheet";
import { useEnv } from "../env";

const ELEMENT_TEXT: Record<Element, string> = {
  wood: "위로 자라고 뻗어 나가는 힘. 시작, 성장, 배려와 연결돼요.",
  fire: "밝게 퍼지고 드러내는 힘. 표현, 열정, 예의와 연결돼요.",
  earth: "받쳐 주고 모아 두는 힘. 신뢰, 중재, 안정과 연결돼요.",
  metal: "다듬고 결단하는 힘. 기준, 정리, 의리와 연결돼요.",
  water: "스며들고 흐르는 힘. 지혜, 유연함, 휴식과 연결돼요.",
};
const GROUP_PLAIN: Record<TenGodGroup, string> = {
  비겁: "나와 같은 기운 — 나를 지지하는 친구이자 경쟁자",
  식상: "내가 낳는 기운 — 표현하고 만들어 내는 힘",
  재성: "내가 다스리는 기운 — 재물과 결과를 다루는 힘",
  관성: "나를 다스리는 기운 — 책임과 질서, 명예",
  인성: "나를 낳는 기운 — 배움과 보살핌, 쉼",
};

type Pick =
  | { kind: "stem"; s: Stem; pos: string }
  | { kind: "branch"; b: Branch; pos: string };

export default function MyChart() {
  const c = useChart();
  useEnv();
  const [pick, setPick] = useState<Pick | null>(null);
  const [sel, setSel] = useState<Element | null>(null);
  if (!c) return null;
  const { chart, analysis: a, profile } = c;
  const dm = chart.day.stem;
  const trait = DAY_MASTER_TRAITS[dm];
  const total = ELEMENTS.reduce((s, e) => s + a.weighted[e], 0);
  const share = Object.fromEntries(ELEMENTS.map((e) => [e, a.weighted[e] / total])) as Record<Element, number>;
  const cols = [
    { pos: "시", name: "태어난 시", p: chart.hour },
    { pos: "일", name: "태어난 날", p: chart.day },
    { pos: "월", name: "태어난 달", p: chart.month },
    { pos: "년", name: "태어난 해", p: chart.year },
  ];
  const b = profile.birth;
  const region = REGIONS.find((r) => r.id === b.regionId)?.name;
  const dominant = [...ELEMENTS].sort((x, y) => share[y] - share[x])[0];
  const cur: Element = sel ?? dominant;
  const groupOf = (e: Element) => (["비겁", "식상", "재성", "관성", "인성"] as TenGodGroup[]).find((g) => groupElement(a.dayElement, g) === e)!;

  return (
    <div className="screen chart">
      <style>{css}</style>
      <header className="topbar">
        <h1 className="h-lg" style={{ margin: 0 }}>
          나의 사주
        </h1>
        <span className="meta">
          {b.calendar === "lunar" ? `음력${b.leapMonth ? "(윤)" : ""} ` : ""}
          {b.year}.{b.month}.{b.day}
 {timeLabel(b)} · {region}
        </span>
      </header>

      <div className="chart-grid">
        <section className="dm">
          <motion.span
            className="dm-glyph"
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 14 }}
            style={{ background: ELEMENT_INFO[a.dayElement].color, color: ELEMENT_INFO[a.dayElement].on }}
          >
            {dm}
          </motion.span>
          <div>
            <p className="meta" style={{ margin: 0 }}>
              나의 일간 · {STEM_KO[dm]}
              {ELEMENT_INFO[a.dayElement].ko} ({stemYang(dm) ? "양" : "음"}의 {ELEMENT_INFO[a.dayElement].short})
            </p>
            <h2 className="dm-image">{trait.image}</h2>
            <p className="secondary" style={{ margin: 0 }}>
              {trait.nature}
            </p>
          </div>
        </section>

        <section className="section pillars" aria-label="사주 원국">
          <div className="section-head">
            <h2 className="section-title">사주 원국</h2>
            <span className="meta">글자를 누르면 풀이</span>
          </div>
          <div className="pillar-row">
            {cols.map((col, i) => (
              <motion.div
                key={col.pos}
                className="pillar"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 360, damping: 28 }}
              >
                <span className="meta">{col.name}</span>
                {col.p ? (
                  <>
                    <span className="tg">{col.pos === "일" ? "나" : tenGodOf(dm, col.p.stem)}</span>
                    <button
                      className="tile-g"
                      data-el={stemElement(col.p.stem)}
                      data-me={col.pos === "일"}
                      onClick={() => setPick({ kind: "stem", s: col.p!.stem, pos: col.name })}
                    >
                      <span className="han">{col.p.stem}</span>
                      <small>
                        {STEM_KO[col.p.stem]} · {ELEMENT_INFO[stemElement(col.p.stem)].ko}
                      </small>
                    </button>
                    <button className="tile-g" data-el={branchElement(col.p.branch)} onClick={() => setPick({ kind: "branch", b: col.p!.branch, pos: col.name })}>
                      <span className="han">{col.p.branch}</span>
                      <small>
                        {BRANCH_KO[col.p.branch]} · {BRANCH_ANIMAL[col.p.branch]}
                      </small>
                    </button>
                    <span className="tg">{tenGodOf(dm, HIDDEN_STEMS[col.p.branch][0][0])}</span>
                  </>
                ) : (
                  <div className="tile-empty">
                    <span>시간 미상</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="section balance">
          <div className="section-head">
            <h2 className="section-title">오행 밸런스</h2>
            <span className="meta">지장간·계절 반영</span>
          </div>
          <div className="stack" aria-hidden>
            {ELEMENTS.map((e) => (
              <motion.i
                key={e}
                style={{ background: ELEMENT_INFO[e].color }}
                initial={{ flexGrow: 0.001 }}
                animate={{ flexGrow: share[e] }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            ))}
          </div>
          <div className="el-tabs" role="tablist">
            {ELEMENTS.map((e) => (
              <button key={e} role="tab" aria-selected={cur === e} onClick={() => setSel(e)} style={{ ["--c" as string]: ELEMENT_INFO[e].color }}>
                <span className="el-han">{ELEMENT_INFO[e].hanja}</span>
                <span className="num el-pct">
                  <CountUp to={Math.round(share[e] * 100)} />%
                </span>
              </button>
            ))}
          </div>
          <motion.div className="el-stage" animate={{ backgroundColor: ELEMENT_INFO[cur].soft }} transition={{ duration: 0.35 }}>
            <svg className="el-shape" viewBox="0 0 200 200" aria-hidden>
              <motion.path animate={{ d: SHAPES[cur] }} transition={{ type: "spring", stiffness: 140, damping: 18 }} fill={ELEMENT_INFO[cur].color} fillOpacity={0.22} />
            </svg>
            <CharacterSlot element={cur} className="el-3d" style={{ position: "absolute" }} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={cur}
                className="el-caption"
                style={{ color: ELEMENT_INFO[cur].ink }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <p className="el-name">{ELEMENT_INFO[cur].mascot}</p>
                <p className="el-role">
                  {ELEMENT_INFO[cur].hanja} {ELEMENT_INFO[cur].ko} · {groupOf(cur)}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <div className="el-info">
            <p style={{ margin: 0, fontWeight: 700 }}>{GROUP_PLAIN[groupOf(cur)]}</p>
            <p className="secondary" style={{ margin: "6px 0 0", fontSize: 14 }}>
              {ELEMENT_TEXT[cur]} 비중 {Math.round(share[cur] * 100)}%, 겉글자 {a.surface[cur]}개.{" "}
              {a.favorable[cur] >= 2
                ? "사주 균형을 잡아 주는 반가운 기운이에요."
                : a.favorable[cur] < 0
                  ? "이미 넉넉해서 더 채울 필요는 적어요."
                  : "적당한 수준이에요."}
            </p>
          </div>
          <div className="strength">
            <div className="strength-top">
              <span className="h-md">
                {STRENGTH_KO[a.strength].label} <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{STRENGTH_KO[a.strength].plain}</span>
              </span>
              <span className="num" style={{ fontSize: 20 }}>
                {Math.round(a.supportRatio * 100)}
              </span>
            </div>
            <div className="strength-bar" aria-hidden>
              <motion.i initial={{ width: 0 }} whileInView={{ width: `${Math.round(a.supportRatio * 100)}%` }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
              <span style={{ left: "40%" }} />
              <span style={{ left: "52%" }} />
            </div>
            <div className="strength-legend meta">
              <span>신약</span>
              <span>중화</span>
              <span>신강</span>
            </div>
            <p className="secondary" style={{ margin: "8px 0 0", fontSize: 14 }}>
              {a.reasons[0]}
            </p>
            <div className="chips" style={{ marginTop: 10 }}>
              <span className="pill" style={{ background: ELEMENT_INFO[a.primary].soft }}>
                반가운 기운 {ELEMENT_INFO[a.primary].hanja} {ELEMENT_INFO[a.primary].ko}
              </span>
              <span className="pill" style={{ background: ELEMENT_INFO[a.secondary].soft }}>
                보조 {ELEMENT_INFO[a.secondary].hanja} {ELEMENT_INFO[a.secondary].ko}
              </span>
              {a.seasonal && <span className="pill">계절 보정 {ELEMENT_INFO[a.seasonal].ko}</span>}
            </div>
          </div>
        </section>

        <CompatSection />

        <section className="section traits">
          <div>
            <h2 className="dd-title">나의 강점</h2>
            <ul>
              {trait.strength.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="dd-title">주의할 성향</h2>
            <ul className="secondary">
              {trait.caution.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section notes">
          <h2 className="dd-title">계산 기준</h2>
          <ul className="meta">
            <li>연주·월주는 절기(입춘·절입 시각) 기준, 일주·시주는 출생지 경도로 보정한 지방시 기준이에요.</li>
            {chart.correctionMin !== null && chart.lmt && (
              <li>
                표준시 대비 {chart.correctionMin > 0 ? "+" : ""}
                {chart.correctionMin}분 보정 → 지방시 {String(chart.lmt.h).padStart(2, "0")}:{String(chart.lmt.mi).padStart(2, "0")}
              </li>
            )}
            {chart.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      </div>

      <Sheet
        open={!!pick}
        onClose={() => setPick(null)}
        title={
          pick?.kind === "stem"
            ? `${pick.s} · ${STEM_KO[pick.s]}`
            : pick?.kind === "branch"
              ? `${pick.b} · ${BRANCH_KO[pick.b]}`
              : ""
        }
      >
        {pick?.kind === "stem" && (
          <>
            <p className="meta" style={{ marginTop: 0 }}>
              {pick.pos}의 천간 · 하늘의 기운
            </p>
            <p>
              {stemYang(pick.s) ? "양" : "음"}의 {ELEMENT_INFO[stemElement(pick.s)].short}. {DAY_MASTER_TRAITS[pick.s].image}에 비유해요.
            </p>
            {pick.s !== dm || pick.pos !== "태어난 날" ? (
              <p className="secondary">
                나(일간 {dm})에게는 ‘{tenGodOf(dm, pick.s)}’ — {TEN_GOD_PLAIN[tenGodOf(dm, pick.s)]}
              </p>
            ) : (
              <p className="secondary">이 글자가 바로 나 자신이에요. 사주의 모든 관계는 이 글자를 기준으로 읽어요.</p>
            )}
          </>
        )}
        {pick?.kind === "branch" && (
          <>
            <p className="meta" style={{ marginTop: 0 }}>
              {pick.pos}의 지지 · 땅의 기운 · {BRANCH_ANIMAL[pick.b]}
            </p>
            <p>
              겉으로는 {ELEMENT_INFO[branchElement(pick.b)].short}의 기운이고, 안에는 이런 기운이 숨어 있어요(지장간).
            </p>
            <ul className="hidden-list">
              {HIDDEN_STEMS[pick.b].map(([s, r]) => (
                <li key={s}>
                  <span className="han">{s}</span>
                  <span>
                    {STEM_KO[s]} · {ELEMENT_INFO[stemElement(s)].short}
                  </span>
                  <span className="muted">{tenGodOf(dm, s)}</span>
                  <span className="meta">{Math.round(r * 100)}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Sheet>
    </div>
  );
}

const css = `
.chart .topbar { flex-wrap: wrap; gap: 0 12px; }
.dm { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; margin-top: 8px; padding: 16px; border-radius: var(--r-lg); background: var(--surface); }
.dm-glyph { width: 88px; height: 88px; border-radius: 26px; display: grid; place-items: center; font-size: 52px; font-weight: 800; }
.dm-image { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; margin: 2px 0 6px; }
.pillar-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pillar { display: flex; flex-direction: column; align-items: stretch; gap: 6px; text-align: center; min-width: 0; }
.pillar > .meta { font-size: 11px; line-height: 14px; }
.tg { font-size: 12px; font-weight: 700; color: var(--ink-2); min-height: 16px; }
.tile-g { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; aspect-ratio: 1 / 1.05; border-radius: 18px; background: var(--tile-s); transition: transform 120ms var(--ease); }
.tile-g:active { transform: scale(0.94); }
.tile-g[data-el="wood"] { --tile-s: #eefadf; --tile-c: #2e6b12; } .tile-g[data-el="fire"] { --tile-s: #ffede3; --tile-c: #b83a0b; } .tile-g[data-el="earth"] { --tile-s: #fff6d6; --tile-c: #8a5d00; } .tile-g[data-el="metal"] { --tile-s: #f0eeff; --tile-c: #4b3cc9; } .tile-g[data-el="water"] { --tile-s: #e8eeff; --tile-c: #1f3fc2; }
.tile-g .han { font-size: clamp(26px, 8vw, 34px); line-height: 1; font-weight: 800; color: var(--tile-c); }
.tile-g small { font-size: 11px; font-weight: 600; color: var(--ink-2); }
.tile-g[data-me="true"] { background: var(--ink); }
.tile-g[data-me="true"] .han { color: #fff; }
.tile-g[data-me="true"] small { color: rgba(255,255,255,0.7); }
.tile-empty { flex: 1; display: grid; place-items: center; border-radius: 18px; border: 2px dashed var(--line-2); font-size: 12px; color: var(--ink-3); min-height: 160px; }
.stack { display: flex; height: 14px; border-radius: 7px; overflow: hidden; gap: 2px; }
.stack i { display: block; min-width: 2px; }
.el-tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 12px; }
.el-tabs button { min-height: 56px; border-radius: 16px; background: var(--surface); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; transition: background-color 160ms var(--ease), transform 120ms var(--ease); }
.el-tabs button:active { transform: scale(0.94); }
.el-tabs button[aria-selected="true"] { background: var(--ink); color: #fff; }
.el-han { font-size: 18px; font-weight: 800; }
.el-pct { font-size: 12px; font-weight: 700; opacity: 0.75; }
.el-stage { position: relative; overflow: hidden; height: 260px; border-radius: var(--r-lg); margin-top: 10px; }
.el-shape { position: absolute; right: -40px; top: -30px; width: 280px; height: 280px; }
.el-3d { right: 0; top: 0; width: 62%; height: 100%; }
.el-caption { position: absolute; left: 18px; bottom: 18px; z-index: 1; }
.el-name { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
.el-role { margin: 0; font-size: 14px; font-weight: 700; opacity: 0.8; }
.el-info { margin-top: 12px; padding: 14px; border-radius: var(--r-md); background: var(--surface); }
.strength { margin-top: 20px; }
.strength-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.strength-bar { position: relative; height: 12px; border-radius: 6px; background: var(--surface-2); overflow: hidden; }
.strength-bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; background: var(--ink); }
.strength-bar span { position: absolute; top: 0; bottom: 0; width: 2px; background: #fff; }
.strength-legend { display: grid; grid-template-columns: 40% 12% 48%; margin-top: 4px; font-size: 11px; }
.strength-legend span:nth-child(2) { text-align: center; }
.strength-legend span:nth-child(3) { text-align: right; }
.traits { display: grid; gap: 16px; }
.traits ul { display: flex; flex-wrap: wrap; gap: 6px; }
.traits li { padding: 8px 12px !important; border-radius: 999px; background: var(--surface); font-size: 14px !important; }
.traits > div:first-child li { background: var(--el-soft); }
.traits ul, .notes ul { list-style: none; margin: 0; padding: 0; }
.traits li { padding: 4px 0; font-weight: 700; font-size: 15px; }
.notes li { padding: 4px 0; line-height: 1.55; }
.dd-title { font-size: 13px; font-weight: 800; margin: 0 0 8px; }
.hidden-list { list-style: none; padding: 0; margin: 0 0 16px; }
.hidden-list li { display: grid; grid-template-columns: 40px 1fr auto auto; gap: 12px; align-items: center; min-height: 44px; border-top: 1px solid var(--line); }
.hidden-list .han { font-size: 22px; font-weight: 800; }
@media (min-width: 900px) {
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }
  .dm, .pillars, .traits, .notes, .compat { grid-column: 1; }
  .balance { grid-column: 2; grid-row: 1 / span 4; margin-top: 8px; }
  .el-stage { height: 340px; }
}
`;
