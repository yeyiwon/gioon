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
  { name: "자시", animal: "쥐", range: "밤 11:30 ~ 1:30", short: "23:30 – 01:30", h: 0 },
  { name: "축시", animal: "소", range: "새벽 1:30 ~ 3:30", short: "01:30 – 03:30", h: 2 },
  { name: "인시", animal: "호랑이", range: "새벽 3:30 ~ 5:30", short: "03:30 – 05:30", h: 4 },
  { name: "묘시", animal: "토끼", range: "아침 5:30 ~ 7:30", short: "05:30 – 07:30", h: 6 },
  { name: "진시", animal: "용", range: "아침 7:30 ~ 9:30", short: "07:30 – 09:30", h: 8 },
  { name: "사시", animal: "뱀", range: "오전 9:30 ~ 11:30", short: "09:30 – 11:30", h: 10 },
  { name: "오시", animal: "말", range: "낮 11:30 ~ 1:30", short: "11:30 – 13:30", h: 12 },
  { name: "미시", animal: "양", range: "오후 1:30 ~ 3:30", short: "13:30 – 15:30", h: 14 },
  { name: "신시", animal: "원숭이", range: "오후 3:30 ~ 5:30", short: "15:30 – 17:30", h: 16 },
  { name: "유시", animal: "닭", range: "저녁 5:30 ~ 7:30", short: "17:30 – 19:30", h: 18 },
  { name: "술시", animal: "개", range: "저녁 7:30 ~ 9:30", short: "19:30 – 21:30", h: 20 },
  { name: "해시", animal: "돼지", range: "밤 9:30 ~ 11:30", short: "21:30 – 23:30", h: 22 },
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


export const STEPS = ["name", "date", "time", "place", "more"] as const;
export type Step = (typeof STEPS)[number];

/** 한 단계씩 묻는 사주 입력 폼. 온보딩과 설정에서 함께 쓴다 */
export function StepFields({ step, draft, set }: { step: Step; draft: Draft; set: (d: Draft) => void }) {
  const b = draft.birth;
  const setB = (p: Partial<BirthInput>) => set({ ...draft, birth: { ...b, ...p } });
  // 시각: 오전/오후 + 시(1~12) + 분. 시만 적으면 0분으로 본다
  const init24 = b.timeMode === "exact" && b.hour !== null && b.hour >= 0 ? b.hour : null;
  const [ampm, setAmpm] = useState<"am" | "pm">(init24 !== null && init24 >= 12 ? "pm" : "am");
  const [hh, setHh] = useState(init24 === null ? "" : String(init24 % 12 === 0 ? 12 : init24 % 12));
  const [mm, setMm] = useState(init24 === null ? "" : String(b.minute ?? 0).padStart(2, "0"));
  const [timeErr, setTimeErr] = useState("");
  const updateTime = (ap: "am" | "pm", h: string, m: string) => {
    setAmpm(ap);
    setHh(h);
    setMm(m);
    if (!h && !m) {
      setTimeErr("");
      return setB({ timeMode: undefined, hour: null, minute: null });
    }
    const hn = +h;
    const mn = m ? +m : 0;
    if (!h || hn < 1 || hn > 12 || mn > 59) {
      setTimeErr(!h ? "시를 입력해 주세요" : hn < 1 || hn > 12 ? "시는 1~12로 입력해 주세요" : "분은 0~59로 입력해 주세요");
      return setB({ timeMode: "exact", hour: -1, minute: null }); // 다음 단계 막기
    }
    setTimeErr("");
    const h24 = ap === "am" ? (hn === 12 ? 0 : hn) : hn === 12 ? 12 : hn + 12;
    setB({ timeMode: "exact", hour: h24, minute: mn });
  };
  const [dateDigits, setDateDigits] = useState(
    b.year ? `${b.year}${String(b.month).padStart(2, "0")}${String(b.day).padStart(2, "0")}` : "",
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
      const fallback = mode === "unknown" ? -1 : mode === "sijin" ? SIJIN.findIndex((x) => x.h === b.hour) : Number.NaN; // 아직 안 고름
      return (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="field">
            <div className="tm">
              <div className="seg tm-ampm" role="group" aria-label="오전 오후">
                {(["am", "pm"] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={ampm === v} onClick={() => updateTime(v, hh, mm)}>
                    {ampm === v && <motion.span layoutId="seg-ampm" className="seg-thumb" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                    {v === "am" ? "오전" : "오후"}
                  </button>
                ))}
              </div>
              <label className="tm-field">
                <input className="input big-input" inputMode="numeric" placeholder="2" aria-label="시" value={hh} onChange={(e) => updateTime(ampm, e.target.value.replace(/\D/g, "").slice(0, 2), mm)} />
                <span>시</span>
              </label>
              <label className="tm-field">
                <input className="input big-input" inputMode="numeric" placeholder="05" aria-label="분" value={mm} onChange={(e) => updateTime(ampm, hh, e.target.value.replace(/\D/g, "").slice(0, 2))} />
                <span>분</span>
              </label>
            </div>
            {timeErr && <span className="meta" style={{ color: "#e0245e", fontWeight: 700 }}>{timeErr}</span>}
          </div>
          <div className="field">
            <span className="meta">정확한 시각을 모르면</span>
            <Picker
              label="태어난 시간대"
              value={fallback}
              placeholder="시간대로 고르기 · 모름"
              cols={1}
              onChange={(v) => {
                setHh("");
                setMm("");
                setTimeErr("");
                if (v === -1) setB({ timeMode: "unknown", hour: null, minute: null });
                else setB({ timeMode: "sijin", hour: SIJIN[v].h, minute: 30 });
              }}
              options={[{ v: -1, l: "모름 (시주 없이 계산)" }, ...SIJIN.map((sj, i) => ({ v: i, l: `${sj.range} · ${sj.name}` }))]}
            />
          </div>
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
  time: { title: "태어난 시간", sub: "정확한 시각을 알면 입력하고, 모르면 시간대를 골라 주세요" },
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
  placeholder = "선택",
}: {
  placeholder?: string;
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
      <button type="button" className="input picker-btn" data-empty={!cur} disabled={disabled} onClick={() => setOpen(true)} aria-label={`${label}: ${cur?.l ?? placeholder}`} aria-haspopup="dialog">
        <span>{cur?.l ?? placeholder}</span>
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
