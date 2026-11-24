"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { computeChart } from "@/lib/saju/calc";
import { analyze } from "@/lib/saju/analysis";
import { ELEMENT_INFO } from "@/lib/saju/constants";
import { compatibility, RELATION_KO, type Relation } from "@/lib/fortune/compat";
import { useChart, haptic } from "@/lib/hooks";
import { setState, useAppState, type Friend } from "@/lib/store";
import { Sheet } from "./Sheet";
import { MascotArt } from "./ItemArt";
import { StepFields, useDraftCheck, type Draft } from "./ProfileForm";
import { CountUp } from "./screens/Today";

const emptyFriend = (): Draft => ({
  name: "",
  gender: "none",
  // 지인은 출생지를 모르는 경우가 많아 기본값을 '모름'으로
  birth: { calendar: "solar", leapMonth: false, year: 0, month: 1, day: 1, hour: null, minute: null, regionId: "unknown" },
});

const OK = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const NO = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function Result({ friend, onDelete }: { friend: Friend; onDelete: () => void }) {
  const me = useChart();
  const r = useMemo(() => {
    if (!me) return null;
    const c = computeChart(friend.birth);
    if (!c) return null;
    return compatibility(me.chart, me.analysis, c, analyze(c), friend.relation);
  }, [me, friend]);
  if (!r) return <p className="secondary">생년월일을 다시 확인해 주세요.</p>;
  const name = friend.name || "상대";
  return (
    <div className="cp-result">
      <div className="cp-pair">
        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
          <MascotArt element={r.myEl} size={84} />
          <span>나 · {ELEMENT_INFO[r.myEl].ko}</span>
        </motion.div>
        <motion.span className="cp-x" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 12 }}>
          ×
        </motion.span>
        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
          <MascotArt element={r.theirEl} size={84} />
          <span>
            {name} · {ELEMENT_INFO[r.theirEl].ko}
          </span>
        </motion.div>
      </div>
      <p className="cp-score">
        <CountUp to={r.score} className="num" />
        <span>점</span>
      </p>
      <p className="cp-type">
        {RELATION_KO[friend.relation]} · {r.type}
      </p>
      <h3 className="cp-h">잘 맞는 점</h3>
      <ul className="cp-list ok">
        {r.synergy.map((x) => (
          <li key={x}>
            <i>{OK}</i>
            {x}
          </li>
        ))}
      </ul>
      <h3 className="cp-h">주의할 점</h3>
      <ul className="cp-list no">
        {r.caution.map((x) => (
          <li key={x}>
            <i>{NO}</i>
            {x}
          </li>
        ))}
      </ul>
      <p className="cp-tip">
        <b>이렇게 해 보세요</b>
        {r.tip}
      </p>
      <p className="meta" style={{ margin: "12px 0 0" }}>
        근거: {r.basis.join(" · ")}
        {friend.birth.hour === null ? " · 상대 출생 시간 모름(시주 제외)" : ""}. 전통 명리학의 상징적 해석이에요.
      </p>
      <button className="btn-text" style={{ marginTop: 8 }} onClick={onDelete}>
        목록에서 지우기
      </button>
    </div>
  );
}

/** 나의 사주 화면의 궁합 섹션 */
export function CompatSection() {
  const friends = useAppState((s) => s.friends);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyFriend);
  const [rel, setRel] = useState<Relation>("friend");
  const { valid } = useDraftCheck(draft);
  const list = friends ?? [];
  const current = list.find((f) => f.id === view) ?? null;

  const start = () => {
    setDraft(emptyFriend());
    setRel("friend");
    setView(null);
    setOpen(true);
  };
  const save = () => {
    haptic(10);
    const f: Friend = { id: `${Date.now()}`, name: draft.name.trim(), relation: rel, birth: draft.birth };
    setState((s) => ({ ...s, friends: [f, ...(s.friends ?? [])].slice(0, 20) }));
    setView(f.id);
  };
  const remove = (id: string) => {
    setState((s) => ({ ...s, friends: (s.friends ?? []).filter((f) => f.id !== id) }));
    setOpen(false);
  };

  return (
    <section className="section compat">
      <style>{css}</style>
      <div className="section-head">
        <h2 className="section-title">궁합</h2>
        <span className="meta">친구·연인·동료와 시너지 보기</span>
      </div>
      <div className="cp-row">
        <button className="cp-add" onClick={start}>
          <span aria-hidden>＋</span> 궁합 보기
        </button>
        {list.map((f) => (
          <button
            key={f.id}
            className="cp-chip"
            onClick={() => {
              setView(f.id);
              setOpen(true);
            }}
          >
            <b>{f.name || "이름 없음"}</b>
            <small>{RELATION_KO[f.relation]}</small>
          </button>
        ))}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={current ? `${current.name || "상대"}와 나` : "누구와 볼까요"}>
        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Result friend={current} onDelete={() => remove(current.id)} />
            </motion.div>
          ) : (
            <motion.div key="f" className="cp-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <label className="field">
                <span className="meta">이름 (선택)</span>
                <input className="input" value={draft.name} maxLength={12} placeholder="예: 김민지" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <div className="field">
                <span className="meta">관계</span>
                <div className="chips">
                  {(Object.keys(RELATION_KO) as Relation[]).map((r) => (
                    <button key={r} type="button" className="chip" aria-pressed={rel === r} onClick={() => setRel(r)}>
                      {RELATION_KO[r]}
                    </button>
                  ))}
                </div>
              </div>
              <StepFields step="date" draft={draft} set={setDraft} />
              <div className="field">
                <span className="meta">태어난 시각 (선택)</span>
                <StepFields step="time" draft={draft} set={setDraft} />
              </div>
              <button className="btn btn-primary" style={{ width: "100%", margin: "8px 0 12px" }} disabled={!valid} onClick={save}>
                궁합 보기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </section>
  );
}

const css = `
.cp-row { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 calc(var(--gutter) * -1); padding: 0 var(--gutter); }
.cp-row::-webkit-scrollbar { display: none; }
.cp-add { flex: none; min-height: 56px; padding: 0 18px; border-radius: 16px; background: var(--ink); color: #fff; font-weight: 800; font-size: 15px; }
.cp-add:active, .cp-chip:active { transform: scale(0.96); }
.cp-chip { flex: none; min-height: 56px; padding: 0 16px; border-radius: 16px; background: var(--surface); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
.cp-chip b { font-size: 15px; font-weight: 800; }
.cp-chip small { font-size: 12px; color: var(--ink-3); font-weight: 600; }
.cp-form { display: grid; gap: 20px; padding-top: 4px; }
.cp-pair { display: flex; align-items: center; justify-content: center; gap: 4px; }
.cp-pair > div { display: flex; flex-direction: column; align-items: center; font-size: 13px; font-weight: 700; color: var(--ink-2); }
.cp-x { font-size: 28px; font-weight: 800; color: var(--pink); margin: 0 6px 18px; }
.cp-score { margin: 8px 0 0; text-align: center; line-height: 1; }
.cp-score .num { font-size: 56px; }
.cp-score > span:last-child { font-size: 18px; font-weight: 800; }
.cp-type { margin: 6px 0 0; text-align: center; font-weight: 800; color: var(--ink-2); }
.cp-h { margin: 20px 0 8px; font-size: 14px; font-weight: 800; }
.cp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.cp-list li { display: flex; gap: 8px; align-items: flex-start; font-size: 15px; font-weight: 600; line-height: 1.45; }
.cp-list i { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; margin-top: 0; }
.cp-list.ok i { background: var(--el); color: var(--el-on); }
.cp-list.no i { background: var(--pink); color: #fff; }
.cp-tip { margin: 18px 0 0; padding: 14px; border-radius: 16px; background: var(--surface); font-size: 15px; font-weight: 600; display: flex; flex-direction: column; gap: 2px; }
.cp-tip b { font-size: 12px; color: var(--ink-3); font-weight: 800; }
`;
