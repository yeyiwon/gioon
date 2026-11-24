"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ELEMENT_INFO } from "@/lib/saju/constants";
import { computeDaily } from "@/lib/fortune/daily";
import { SOCK_PATTERN_KO } from "@/lib/fortune/items";
import { haptic, profileKey, useChart } from "@/lib/hooks";
import { setState, useAppState, type DayRecord, type Mood, type Sticker } from "@/lib/store";
import { CharacterSlot } from "../Slots3D";
import { IconChevron } from "../icons";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const MOODS: { id: Mood; label: string; path: string }[] = [
  { id: "sunny", label: "맑음", path: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" },
  { id: "breeze", label: "산들", path: "M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8" },
  { id: "cloud", label: "흐림", path: "M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z" },
  { id: "rain", label: "비", path: "M7 14h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3" },
  { id: "storm", label: "천둥", path: "M7 14h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 14zM12.5 15l-2 3.5h3l-2 3.5" },
];
const MoodIcon = ({ m, size = 18 }: { m: Mood; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={MOODS.find((x) => x.id === m)!.path} />
  </svg>
);

export function StickerArt({ s, size = 22 }: { s: Sticker; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {s === "star" && <path d="M12 2.8l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6-4.5-4.2 6.1-.7z" fill="#e9b949" stroke="#b3862a" strokeWidth="1" strokeLinejoin="round" />}
      {s === "clover" && (
        <g fill="#7fae6a" stroke="#4f7a3f" strokeWidth="0.8">
          <circle cx="9" cy="8.5" r="3.6" />
          <circle cx="15" cy="8.5" r="3.6" />
          <circle cx="9" cy="14" r="3.6" />
          <circle cx="15" cy="14" r="3.6" />
          <path d="M12 12l3 9" fill="none" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
      {s === "heart" && <path d="M12 20s-7.5-4.6-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#e28a7f" stroke="#b25a50" strokeWidth="1" />}
      {s === "ribbon" && (
        <g fill="#8fa3d8" stroke="#5a6fa8" strokeWidth="0.9" strokeLinejoin="round">
          <path d="M12 11C9 6 4 7 4.5 10.5 5 13 9 13 12 11z" />
          <path d="M12 11c3-5 8-4 7.5-.5C19 13 15 13 12 11z" />
          <path d="M11 12l-3 8 2.5-1 1.5 2 .5-9zM13 12l3 8-2.5-1-1.5 2-.5-9z" />
        </g>
      )}
    </svg>
  );
}
const STICKERS: { id: Sticker; label: string }[] = [
  { id: "star", label: "별" },
  { id: "clover", label: "네잎클로버" },
  { id: "heart", label: "하트" },
  { id: "ribbon", label: "리본" },
];

const MONTH_KEY = (y: number, m: number) => `${y}-${m}`;

export default function Calendar({ today }: { today: string }) {
  const c = useChart();
  const days = useAppState((s) => s.days);
  const [ty, tm] = today.split("-").map(Number);
  const [ym, setYm] = useState({ y: ty, m: tm });
  const [dir, setDir] = useState(0);
  const [sel, setSel] = useState(today);

  const shift = (d: number) => {
    haptic(6);
    setDir(d);
    setYm(({ y, m }) => {
      const t = new Date(y, m - 1 + d, 1);
      return { y: t.getFullYear(), m: t.getMonth() + 1 };
    });
  };
  const goToday = () => {
    setDir(ym.y * 12 + ym.m > ty * 12 + tm ? -1 : 1);
    setYm({ y: ty, m: tm });
    setSel(today);
  };
  const first = new Date(ym.y, ym.m - 1, 1).getDay();
  const count = new Date(ym.y, ym.m, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  // 한 달치 운세(오행·행운 컬러)를 한 번에 계산
  const month = useMemo(() => {
    if (!c) return {} as Record<string, ReturnType<typeof computeDaily>>;
    const out: Record<string, ReturnType<typeof computeDaily>> = {};
    const n = new Date(ym.y, ym.m, 0).getDate();
    for (let d = 1; d <= n; d++) out[iso(ym.y, ym.m, d)] = computeDaily(c.chart, profileKey(c.profile), ym.y, ym.m, d, c.analysis);
    return out;
  }, [c, ym.y, ym.m]);

  const selFortune = useMemo(() => {
    if (!c) return null;
    if (month[sel]) return month[sel];
    const [y, m, d] = sel.split("-").map(Number);
    return computeDaily(c.chart, profileKey(c.profile), y, m, d, c.analysis);
  }, [sel, c, month]);

  const rec: DayRecord | undefined = days[sel];
  const monthPrefix = `${ym.y}-${String(ym.m).padStart(2, "0")}`;
  const recorded = Object.keys(days).filter((k) => k.startsWith(monthPrefix) && (days[k].openedAt > 0 || days[k].mood));
  const stickers = recorded.filter((k) => days[k].sticker).length;
  const when = sel === today ? "오늘" : sel < today ? "지난 날" : "앞으로의 날";

  const update = (patch: Partial<DayRecord>) => {
    if (!selFortune) return;
    haptic();
    setState((s) => {
      const prev: DayRecord = s.days[sel] ?? {
        openedAt: 0,
        need: selFortune.need,
        pillarKo: selFortune.pillarKo,
        sock: selFortune.items.sock,
        charm: selFortune.charm,
      };
      return { ...s, days: { ...s.days, [sel]: { ...prev, ...patch } } };
    });
  };

  const [sy, sm, sd] = sel.split("-").map(Number);
  const selDow = new Date(sy, sm - 1, sd).getDay();
  const el = selFortune ? ELEMENT_INFO[selFortune.need] : null;

  return (
    <div className="screen cal">
      <style>{css}</style>
      <header className="cal-head">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.h1
            key={MONTH_KEY(ym.y, ym.m)}
            className="cal-title"
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {ym.y}년 {ym.m}월
          </motion.h1>
        </AnimatePresence>
        <div className="cal-ctrl">
          {(sel !== today || ym.y !== ty || ym.m !== tm) && (
            <button className="today-btn" onClick={goToday}>
              오늘
            </button>
          )}
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="이전 달">
            <IconChevron dir="left" />
          </button>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="다음 달">
            <IconChevron dir="right" />
          </button>
        </div>
      </header>

      <div className="cal-week" aria-hidden>
        {WEEK.map((w, i) => (
          <span key={w} data-sun={i === 0} data-sat={i === 6}>
            {w}
          </span>
        ))}
      </div>
      <div className="cal-viewport">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={MONTH_KEY(ym.y, ym.m)}
            className="cal-grid"
            custom={dir}
            initial={{ opacity: 0, x: dir * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -80 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, i) => {
              if (i.offset.x < -50 || i.velocity.x < -400) shift(1);
              else if (i.offset.x > 50 || i.velocity.x > 400) shift(-1);
            }}
            style={{ touchAction: "pan-y" }}
          >
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const key = iso(ym.y, ym.m, d);
              const f = month[key];
              const r = days[key];
              const isToday = key === today;
              const isSel = key === sel;
              const sw = f?.colors[0].swatch;
              return (
                <button
                  key={key}
                  className="cal-day"
                  data-today={isToday}
                  data-future={key > today}
                  data-sel={isSel}
                  onClick={() => {
                    haptic(5);
                    setSel(key);
                  }}
                  aria-pressed={isSel}
                  aria-label={`${ym.m}월 ${d}일${f ? `, ${ELEMENT_INFO[f.need].ko}의 날, 행운 컬러 ${sw?.name}` : ""}${r?.sticker ? ", 스티커" : ""}`}
                >
                  <span className="cal-num">
                    {isSel && <motion.span layoutId="cal-sel" className="cal-sel" transition={{ type: "spring", stiffness: 520, damping: 30 }} />}
                    <span className="cal-n">{d}</span>
                  </span>
                  {sw && <i className="cal-bar" data-light={sw.hex.toUpperCase() >= "#E" || sw.hex === "#FFFFFF"} style={{ background: sw.hex }} />}
                  {r?.sticker && (
                    <span className="cal-sticker">
                      <StickerArt s={r.sticker} size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="meta cal-sum">
        이번 달 기록 {recorded.length}일 · 스티커 {stickers}개 · 막대 색은 그날의 행운 메인 컬러
      </p>

      {selFortune && el && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={sel}
            className="day"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="day-head">
              <h2 className="day-title">
                {sm}월 {sd}일 {WEEK[selDow]}요일
              </h2>
              <span className="day-when" data-when={when}>
                {when}
              </span>
            </div>
            <motion.div className="day-hero" animate={{ backgroundColor: el.soft }} transition={{ duration: 0.3 }}>
              <CharacterSlot element={selFortune.need} className="day-3d" style={{ position: "absolute" }} />
              <div className="day-hero-text">
                <p className="day-score">
                  <span className="num">{selFortune.total}</span>점
                </p>
                <p className="day-headline">{selFortune.headline}</p>
                <p className="day-need" style={{ color: el.ink }}>
                  필요한 기운 {el.hanja} {el.ko} · {selFortune.pillarKo}일
                </p>
              </div>
            </motion.div>

            <div className="day-colors">
              {selFortune.colors.map((col, i) => (
                <motion.div
                  key={col.role}
                  className="dc"
                  data-role={col.role}
                  initial={{ scaleX: 0.6, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 500, damping: 30 }}
                >
                  <i style={{ background: col.swatch.hex }} data-light={col.swatch.hex === "#FFFFFF" || col.swatch.hex === "#F6F1E4"} />
                  <span>
                    <b>{col.swatch.name}</b>
                    <small>{col.role === "main" ? "메인" : col.role === "sub" ? "보조" : "포인트"}</small>
                  </span>
                </motion.div>
              ))}
            </div>

            <dl className="day-list">
              <div>
                <dt>하면 좋은 것</dt>
                <dd>{selFortune.dos.join(" · ")}</dd>
              </div>
              <div>
                <dt>조심할 것</dt>
                <dd>{selFortune.donts.join(" · ")}</dd>
              </div>
              <div>
                <dt>추천 양말</dt>
                <dd>
                  {selFortune.items.sock.base.name} {SOCK_PATTERN_KO[selFortune.items.sock.pattern]}
                </dd>
              </div>
            </dl>
            {sel > today && <p className="meta">앞으로의 날은 전통 명리학에 따른 상징적 해석이에요.</p>}

            {sel <= today && (
              <div className="my-rec">
                <h3 className="rec-title">내 기록</h3>
                <div className="mood-row" role="group" aria-label="그날 기분">
                  {MOODS.map((m) => (
                    <button key={m.id} className="mood-btn" aria-pressed={rec?.mood === m.id} onClick={() => update({ mood: rec?.mood === m.id ? undefined : m.id })}>
                      <MoodIcon m={m.id} size={20} />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mood-row" role="group" aria-label="스티커" style={{ marginTop: 8 }}>
                  {STICKERS.map((st) => (
                    <motion.button
                      key={st.id}
                      className="mood-btn sticker-btn"
                      aria-pressed={rec?.sticker === st.id}
                      aria-label={st.label}
                      whileTap={{ scale: 0.85, rotate: -8 }}
                      onClick={() => update({ sticker: rec?.sticker === st.id ? undefined : st.id })}
                    >
                      <StickerArt s={st.id} size={24} />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      )}
    </div>
  );
}

const css = `
.cal-head { display: flex; align-items: center; justify-content: space-between; min-height: 56px; overflow: hidden; }
.cal-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.04em; }
.cal-ctrl { display: flex; align-items: center; gap: 2px; }
.today-btn { min-height: 36px; padding: 0 12px; border-radius: 999px; background: var(--surface); font-size: 13px; font-weight: 800; margin-right: 4px; }
.cal-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--ink-3); text-align: center; }
.cal-week span[data-sun="true"] { color: #e0457b; }
.cal-viewport { overflow: hidden; }
.cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); row-gap: 4px; margin-top: 6px; }
.cal-day { position: relative; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 4px; gap: 7px; }
.cal-num { position: relative; width: 34px; height: 34px; display: grid; place-items: center; }
.cal-n { position: relative; font-size: 15px; font-weight: 600; z-index: 1; }
.cal-day[data-future="true"] .cal-n { color: var(--ink-3); }
.cal-day[data-today="true"] .cal-n { color: #fff; font-weight: 800; }
.cal-day[data-today="true"] .cal-num::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--ink); }
.cal-sel { position: absolute; inset: -3px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--ink); }
.cal-day[data-today="true"] .cal-sel { box-shadow: 0 0 0 3px var(--el); }
.cal-bar { width: 22px; height: 6px; border-radius: 3px; display: block; }
.cal-bar[data-light="true"] { box-shadow: inset 0 0 0 1px var(--line-2); }
.cal-day[data-future="true"] .cal-bar { opacity: 0.55; }
.cal-sticker { position: absolute; top: 0; right: 6%; transform: rotate(12deg); }
.cal-sum { margin: 10px 0 0; }
.day { margin-top: 24px; }
.day-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.day-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
.day-when { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: var(--surface); color: var(--ink-2); }
.day-when[data-when="오늘"] { background: var(--ink); color: #fff; }
.day-hero { position: relative; margin-top: 12px; height: 190px; border-radius: var(--r-lg); overflow: hidden; }
.day-3d { right: 0; top: 0; width: 46%; height: 100%; }
.day-hero-text { position: relative; z-index: 1; width: 56%; padding: 18px; }
.day-score { margin: 0; font-size: 15px; font-weight: 800; }
.day-score .num { font-size: 44px; line-height: 1; }
.day-headline { margin: 8px 0 0; font-size: 17px; font-weight: 800; line-height: 1.3; letter-spacing: -0.03em; }
.day-need { margin: 8px 0 0; font-size: 13px; font-weight: 800; }
.day-colors { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 10px; margin-top: 16px; }
.dc { display: flex; flex-direction: column; gap: 6px; transform-origin: left; min-width: 0; }
.dc i { display: block; height: 44px; border-radius: 12px; }
.dc i[data-light="true"] { box-shadow: inset 0 0 0 1.5px var(--line-2); }
.dc span { display: flex; flex-direction: column; }
.dc b { font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dc small { font-size: 12px; color: var(--ink-3); font-weight: 600; }
.day-list { margin: 16px 0 0; }
.day-list > div { display: grid; grid-template-columns: 88px 1fr; gap: 10px; padding: 12px 0; border-top: 1px solid var(--line); }
.day-list dt { font-size: 13px; font-weight: 800; color: var(--ink-3); }
.day-list dd { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.45; }
.my-rec { margin-top: 20px; padding-top: 16px; border-top: 6px solid var(--surface); }
.rec-title { margin: 0 0 10px; font-size: 15px; font-weight: 800; }
.mood-row { display: flex; gap: 6px; }
.mood-btn { flex: 1; min-height: 56px; padding: 6px 4px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-size: 12px; font-weight: 700; color: var(--ink-2); background: var(--surface); transition: background-color 140ms var(--ease), color 140ms var(--ease); }
.mood-btn[aria-pressed="true"] { background: var(--ink); color: #fff; }
.sticker-btn[aria-pressed="true"] { background: var(--el-soft); box-shadow: inset 0 0 0 2px var(--ink); }
@media (min-width: 900px) {
  .cal { max-width: 1040px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; align-items: start; }
  .cal-head, .cal-week, .cal-viewport, .cal-sum { grid-column: 1; }
  .day { grid-column: 2; grid-row: 1 / span 5; margin-top: 0; }
  .cal-day { height: 72px; }
}
`;
