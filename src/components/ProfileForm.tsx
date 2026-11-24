"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { REGIONS, computeChart, type BirthInput } from "@/lib/saju/calc";
import { STEM_KO, BRANCH_KO } from "@/lib/saju/constants";
import type { Profile } from "@/lib/store";
import { Sheet } from "./Sheet";

export type Draft = Omit<Profile, "createdAt">;
export const emptyDraft = (): Draft => ({
  name: "",
  gender: "none",
  // 빈 프로필로 시작한다 (연도 0 = 미입력, 날짜 단계에서 입력해야 다음으로 진행)
  birth: { calendar: "solar", leapMonth: false, year: 0, month: 1, day: 1, hour: null, minute: null, regionId: "seoul" },
});

function Seg<T extends string>({ value, options, onChange, id }: { value: T; options: [T, string][]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="seg" role="group">
      {options.map(([v, label]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {value === v && <motion.span layoutId={`seg-${id}`} className="seg-thumb" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
          {label}
        </button>
      ))}
    </div>
  );
}

const fmtDate = (d: string) => (d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d);
/** 시진: 한국 표준시 기준 30분 경계. 대표 시각은 구간 한가운데(지방시 보정 ±40분에도 같은 시진) */
export const SIJIN = [
  { name: "자시", animal: "쥐", range: "밤 11:30 ~ 1:30", h: 0 },
  { name: "축시", animal: "소", range: "새벽 1:30 ~ 3:30", h: 2 },
  { name: "인시", animal: "호랑이", range: "새벽 3:30 ~ 5:30", h: 4 },
  { name: "묘시", animal: "토끼", range: "아침 5:30 ~ 7:30", h: 6 },
  { name: "진시", animal: "용", range: "아침 7:30 ~ 9:30", h: 8 },
  { name: "사시", animal: "뱀", range: "오전 9:30 ~ 11:30", h: 10 },
  { name: "오시", animal: "말", range: "낮 11:30 ~ 1:30", h: 12 },
  { name: "미시", animal: "양", range: "오후 1:30 ~ 3:30", h: 14 },
  { name: "신시", animal: "원숭이", range: "오후 3:30 ~ 5:30", h: 16 },
  { name: "유시", animal: "닭", range: "저녁 5:30 ~ 7:30", h: 18 },
  { name: "술시", animal: "개", range: "저녁 7:30 ~ 9:30", h: 20 },
  { name: "해시", animal: "돼지", range: "밤 9:30 ~ 11:30", h: 22 },
];

/** 프로필에 표시할 태어난 시간 */
export function timeLabel(b: BirthInput) {
  if (b.hour === null || b.hour < 0) return "시간 모름";
  if (b.timeMode === "sijin") {
    const sj = SIJIN.find((x) => x.h === b.hour);
    if (sj) return `${sj.name}(${sj.range})`;
  }
  return `${String(b.hour).padStart(2, "0")}:${String(b.minute ?? 0).padStart(2, "0")}`;
}

const fmtTime = (d: string) => (d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d);

export const STEPS = ["name", "date", "time", "place", "more"] as const;
export type Step = (typeof STEPS)[number];

/** 한 단계씩 묻는 사주 입력 폼. 온보딩과 설정에서 함께 쓴다 */
export function StepFields({ step, draft, set }: { step: Step; draft: Draft; set: (d: Draft) => void }) {
  const b = draft.birth;
  const setB = (p: Partial<BirthInput>) => set({ ...draft, birth: { ...b, ...p } });
  const [dateDigits, setDateDigits] = useState(
    b.year ? `${b.year}${String(b.month).padStart(2, "0")}${String(b.day).padStart(2, "0")}` : "",
  );
  const [timeDigits, setTimeDigits] = useState(
    b.timeMode === "exact" && b.hour !== null && b.hour >= 0 ? `${String(b.hour).padStart(2, "0")}${String(b.minute ?? 0).padStart(2, "0")}` : "",
  );

  switch (step) {
    case "name":
      return (
        <div className="field">
          <label htmlFor="f-name" className="meta">
            이름 또는 닉네임
          </label>
          <input
            id="f-name"
            className="input"
            value={draft.name}
            maxLength={12}
            autoComplete="nickname"
            placeholder="예: 홍길동"
            onChange={(e) => set({ ...draft, name: e.target.value })}
          />
        </div>
      );
    case "date":
      return (
        <div style={{ display: "grid", gap: 20 }}>
          <Seg
            id="cal"
            value={b.calendar}
            options={[
              ["solar", "양력"],
              ["lunar", "음력"],
            ]}
            onChange={(v) => setB({ calendar: v, leapMonth: false })}
          />
          <label className="field">
            <span className="meta">생년월일 8자리</span>
            <input
              className="input big-input"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="예: 19900101"
              aria-label="생년월일 8자리"
              value={fmtDate(dateDigits)}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                setDateDigits(d);
                // 8자리가 다 들어와야 날짜로 인정 (그 전엔 연도 0 = 미완성)
                if (d.length === 8) setB({ year: +d.slice(0, 4), month: +d.slice(4, 6), day: +d.slice(6, 8) });
                else setB({ year: 0 });
              }}
            />
          </label>
          <AnimatePresence initial={false}>
            {b.calendar === "lunar" && (
              <motion.label
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="row"
                style={{ overflow: "hidden", justifyContent: "space-between" }}
              >
                <span>
                  윤달이에요
                  <span className="meta" style={{ display: "block" }}>
                    음력 날짜가 윤달에 해당할 때만 켜 주세요
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={b.leapMonth}
                  className="toggle"
                  onClick={() => setB({ leapMonth: !b.leapMonth })}
                  aria-label="윤달"
                />
              </motion.label>
            )}
          </AnimatePresence>
        </div>
      );
    case "time": {
      const mode = b.timeMode ?? (b.hour === null ? undefined : "exact");
      const partial = timeDigits.length > 0 && timeDigits.length < 4;
      const bad = timeDigits.length === 4 && (+timeDigits.slice(0, 2) > 23 || +timeDigits.slice(2) > 59);
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <button type="button" className="sj-unknown" aria-pressed={mode === "unknown"} onClick={() => setB({ timeMode: "unknown", hour: null, minute: null })}>
            태어난 시간을 몰라요
          </button>
          <div className="sj-grid" role="radiogroup" aria-label="태어난 시간대">
            {SIJIN.map((sj) => (
              <button
                key={sj.name}
                type="button"
                role="radio"
                className="sj"
                aria-checked={mode === "sijin" && b.hour === sj.h}
                onClick={() => setB({ timeMode: "sijin", hour: sj.h, minute: 30 })}
              >
                <b>{sj.range}</b>
                <small>
                  {sj.name} · {sj.animal}
                </small>
              </button>
            ))}
          </div>
          {mode !== "exact" ? (
            <button type="button" className="btn-text" style={{ justifySelf: "start" }} onClick={() => setB({ timeMode: "exact", hour: -1, minute: null })}>
              정확한 시각을 알아요
            </button>
          ) : (
            <div className="field">
              <span className="meta">정확한 시각 (24시간, 4자리)</span>
              <input
                className="input big-input"
                inputMode="numeric"
                placeholder="예: 오후 2시 5분 → 1405"
                aria-label="태어난 시각 4자리"
                autoFocus
                value={fmtTime(timeDigits)}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setTimeDigits(d);
                  if (d.length === 4) setB({ timeMode: "exact", hour: +d.slice(0, 2), minute: +d.slice(2) });
                  else setB({ timeMode: "exact", hour: -1, minute: null }); // 입력 중 → 다음 단계 막기
                }}
              />
              {(partial || bad) && (
                <span className="meta" style={{ color: "#e0245e", fontWeight: 700 }}>
                  {bad ? "00:00~23:59 사이로 입력해 주세요" : "4자리로 입력해 주세요"}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
    case "place":
      return (
        <div style={{ display: "grid", gap: 16 }}>
          <RegionPicker value={b.regionId} onChange={(id) => setB({ regionId: id })} />
          {b.regionId === "abroad" && (
            <div className="field">
              <span className="meta">출생 당시 현지 표준시</span>
              <Picker
                label="출생 당시 현지 표준시"
                value={b.utcOffsetMin ?? 540}
                cols={4}
                onChange={(v) => setB({ utcOffsetMin: v })}
                options={Array.from({ length: 27 }, (_, i) => (i - 12) * 60).map((m) => ({ v: m, l: `UTC${m >= 0 ? "+" : "−"}${Math.abs(m / 60)}` }))}
              />
            </div>
          )}
          <p className="meta" style={{ margin: 0 }}>
            출생지 경도로 실제 해의 위치(지방시)를 맞춰 시주를 계산해요. 모르면 &lsquo;모름&rsquo;을 고르세요.
          </p>
        </div>
      );
    case "more":
      return (
        <div style={{ display: "grid", gap: 12 }}>
          <span className="meta">성별 (선택)</span>
          <div className="chips">
            {(
              [
                ["female", "여성"],
                ["male", "남성"],
                ["none", "밝히지 않음"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" className="chip" aria-pressed={draft.gender === v} onClick={() => set({ ...draft, gender: v })}>
                {l}
              </button>
            ))}
          </div>
          <p className="meta" style={{ margin: 0 }}>
            지금 버전의 하루 운세는 성별과 관계없이 같아요. 대운(10년 흐름) 기능이 생기면 방향 계산에 쓰여요.
          </p>
        </div>
      );
  }
}

export function useDraftCheck(draft: Draft) {
  const chart = useMemo(() => computeChart(draft.birth), [draft.birth]);
  const preview = chart
    ? [chart.year, chart.month, chart.day, chart.hour].map((p) => (p ? `${STEM_KO[p.stem]}${BRANCH_KO[p.branch]}` : "—")).join(" · ")
    : null;
  return { valid: !!chart, preview };
}

export const STEP_COPY: Record<Step, { title: string; sub: string }> = {
  name: { title: "닉네임 (선택)", sub: "화면에만 표시돼요. 비워 둬도 괜찮아요" },
  date: { title: "생년월일", sub: "숫자 8자리로 입력하세요" },
  time: { title: "태어난 시간", sub: "대략 어느 시간대였는지 골라 주세요" },
  place: { title: "태어난 지역", sub: "가장 가까운 도시를 고르세요" },
  more: { title: "성별 (선택)", sub: "지금은 운세 결과에 영향이 없어요" },
};


/** 검색 가능한 출생지 선택 (콤보박스) */
function RegionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = REGIONS.find((r) => r.id === value);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const list = useMemo(() => {
    const t = q.trim();
    const pinned = REGIONS.filter((r) => r.id === "unknown" || r.id === "abroad");
    const cities = REGIONS.filter((r) => r.id !== "unknown" && r.id !== "abroad" && (!t || r.name.includes(t))).sort(
      (a, b) => Number(b.name.startsWith(t)) - Number(a.name.startsWith(t)),
    );
    return t ? [...cities, ...pinned.filter((r) => r.name.includes(t))] : [...pinned, ...cities];
  }, [q]);
  const pick = (id: string) => {
    onChange(id);
    setQ("");
    setOpen(false);
  };
  return (
    <div className="rp">
      <input
        className="input rp-input"
        role="combobox"
        aria-expanded={open}
        aria-controls="rp-list"
        aria-label="출생 지역 검색"
        placeholder={current ? current.name : "도시 이름 검색"}
        value={open ? q : current?.name ?? ""}
        onFocus={() => {
          setOpen(true);
          setHi(0);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQ(e.target.value);
          setHi(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, list.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && list[hi]) {
            e.preventDefault();
            pick(list[hi].id);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      <AnimatePresence>
        {open && (
          <motion.ul
            id="rp-list"
            role="listbox"
            className="rp-list"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            {list.length === 0 && <li className="rp-empty">찾는 도시가 없어요. 가까운 도시나 &lsquo;모름&rsquo;을 골라 주세요</li>}
            {list.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={r.id === value}
                data-hi={i === hi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(r.id);
                }}
                onMouseEnter={() => setHi(i)}
              >
                {r.name}
                {r.id === "unknown" && <small>한반도 중부 기준</small>}
                {r.id === "abroad" && <small>표준시 직접 선택</small>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 기본 드롭다운 대신 바텀시트 그리드로 고르는 선택 필드 */
function Picker<T extends number>({
  label,
  value,
  options,
  onChange,
  cols = 6,
  disabled,
}: {
  label: string;
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
  cols?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.v === value);
  return (
    <>
      <button type="button" className="input picker-btn" disabled={disabled} onClick={() => setOpen(true)} aria-label={`${label}: ${cur?.l ?? "선택"}`} aria-haspopup="dialog">
        <span>{cur?.l ?? "선택"}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="picker-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="listbox" aria-label={label}>
          {options.map((o) => (
            <button
              key={o.v}
              type="button"
              role="option"
              aria-selected={o.v === value}
              className="picker-opt"
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
