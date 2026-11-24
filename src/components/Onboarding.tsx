"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { setState } from "@/lib/store";
import { IconChevron } from "./icons";
import { STEPS, STEP_COPY, StepFields, emptyDraft, useDraftCheck, type Draft } from "./ProfileForm";
import { haptic } from "@/lib/hooks";
import { LineupSlot } from "./Slots3D";

export default function Onboarding() {
  const [i, setI] = useState(-1);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const { valid, preview } = useDraftCheck(draft);
  const step = STEPS[i];

  const next = () => {
    haptic();
    setDir(1);
    if (i < STEPS.length - 1) setI(i + 1);
    else setState((s) => ({ ...s, profile: { ...draft, name: draft.name.trim(), createdAt: Date.now() } }));
  };
  const back = () => {
    setDir(-1);
    setI(i - 1);
  };
  const canNext = step === "date" || step === "time" ? valid : true;

  return (
    <div className="onb">
      <style>{css}</style>
      {i === -1 ? (
        <section className="onb-intro">
          <div className="onb-stage">
            <LineupSlot className="onb-3d" style={{ position: "absolute" }} />
          </div>
          <motion.div className="onb-intro-text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <p className="onb-brand">GIOON</p>
            <h1 className="onb-h1">
              오늘의 운세와
              <br />
              행운의 양말 색, 매일 아침
            </h1>
            <p className="secondary onb-lead">생년월일시로 사주를 계산해서 오늘 필요한 오행, 행운 색, 할 일과 조심할 일을 알려 줘요.</p>
          </motion.div>
          <div className="onb-actions">
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={next}>
              시작하기
            </button>
            <p className="meta" style={{ textAlign: "center", margin: "10px 0 0" }}>
              로그인 없음 · 정보는 이 기기에만 저장돼요
            </p>
          </div>
        </section>
      ) : (
        <section className="onb-step">
          <header className="onb-top">
            <button className="icon-btn" onClick={back} aria-label="이전">
              <IconChevron dir="left" />
            </button>
            <div className="onb-progress" aria-label={`${i + 1} / ${STEPS.length} 단계`}>
              {STEPS.map((_, k) => (
                <span key={k} data-on={k <= i} />
              ))}
            </div>
            <span className="meta" style={{ width: 44, textAlign: "right", fontWeight: 700 }}>
              {i + 1}/{STEPS.length}
            </span>
          </header>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="onb-body"
            >
              <h1 className="onb-q">{STEP_COPY[step].title}</h1>
              <p className="secondary" style={{ margin: "0 0 28px" }}>
                {STEP_COPY[step].sub}
              </p>
              <StepFields step={step} draft={draft} set={setDraft} />
              {step === "date" && !valid && draft.birth.year > 0 && <p className="onb-err">존재하지 않는 날짜예요. 날짜나 윤달 여부를 확인해 주세요</p>}
            </motion.div>
          </AnimatePresence>
          <footer className="onb-foot">
            {preview && i >= 1 && (
              <p className="meta" style={{ margin: "0 0 12px", textAlign: "center", fontWeight: 600 }}>
                연 · 월 · 일 · 시 &nbsp; {preview}
              </p>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={!canNext} onClick={next}>
              {i === STEPS.length - 1 ? "오늘 운세 보기" : "다음"}
            </button>
            {step === "more" && (
              <p className="meta" style={{ margin: "12px 0 0", textAlign: "center" }}>
                사주는 전통 명리학의 상징적 해석이에요. 과학적으로 검증된 예측은 아니에요
              </p>
            )}
          </footer>
        </section>
      )}
    </div>
  );
}

const css = `
.onb { min-height: 100dvh; display: flex; flex-direction: column; max-width: 520px; margin: 0 auto; padding: calc(var(--safe-t) + 8px) var(--gutter) calc(var(--safe-b) + 16px); }
.onb-intro { flex: 1; display: flex; flex-direction: column; }
.onb-stage { position: relative; height: 48svh; min-height: 240px; max-height: 440px; margin: 8px calc(var(--gutter) * -1) 0; background: radial-gradient(120% 80% at 50% 100%, #f1f3f8 0%, #fff 70%); }
.onb-3d { inset: 0; }
.onb-intro-text { margin-top: auto; padding-top: 12px; }
.onb-brand { margin: 0; font-size: 14px; font-weight: 900; letter-spacing: 0.08em; color: var(--ink-3); }
.onb-h1 { font-size: clamp(28px, 8.2vw, 36px); font-weight: 800; line-height: 1.2; letter-spacing: -0.04em; margin: 6px 0 12px; }
.onb-lead { margin: 0; font-size: 15px; }
.onb-actions { margin-top: 24px; }
.onb-step { flex: 1; display: flex; flex-direction: column; }
.onb-top { display: flex; align-items: center; gap: 12px; min-height: 52px; }
.onb-progress { flex: 1; display: flex; gap: 6px; }
.onb-progress span { flex: 1; height: 4px; border-radius: 2px; background: var(--surface-2); transition: background-color 300ms var(--ease); }
.onb-progress span[data-on="true"] { background: var(--ink); }
.onb-body { margin-top: 32px; }
.onb-q { font-size: clamp(26px, 7.4vw, 30px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.25; margin: 0 0 6px; }
.onb-err { color: #e0245e; font-size: 13px; font-weight: 600; margin: 12px 0 0; }
.onb-foot { margin-top: auto; padding-top: 32px; }
`;
