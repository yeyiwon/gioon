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
  birth: { calendar: "solar", leapMonth: false, year: 0, month: 1, day: 1, hour: 12, minute: 0, regionId: "seoul" },
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

export const STEPS = ["name", "date", "time", "place", "more"] as const;
export type Step = (typeof STEPS)[number];

/** 한 단계씩 묻는 사주 입력 폼. 온보딩과 설정에서 함께 쓴다 */
export function StepFields({ step, draft, set }: { step: Step; draft: Draft; set: (d: Draft) => void }) {
  const b = draft.birth;
  const setB = (p: Partial<BirthInput>) => set({ ...draft, birth: { ...b, ...p } });
  const [yearText, setYearText] = useState(b.year ? String(b.year) : "");

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
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8 }}>
            <label className="field">
              <span className="meta">년</span>
              <input
                className="input"
                inputMode="numeric"
                value={yearText}
                placeholder="예: 1990"
                onChange={(e) => {
                  setYearText(e.target.value.replace(/\D/g, "").slice(0, 4));
                  const y = parseInt(e.target.value, 10);
                  if (y >= 1900 && y <= 2100) setB({ year: y });
                }}
                aria-label="출생 연도"
              />
            </label>
            <div className="field">
              <span className="meta">월</span>
              <Picker label="출생 월" value={b.month} cols={4} onChange={(v) => setB({ month: v })} options={Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: `${i + 1}월` }))} />
            </div>
            <div className="field">
              <span className="meta">일</span>
              <Picker label="출생 일" value={b.day} cols={7} onChange={(v) => setB({ day: v })} options={Array.from({ length: b.calendar === "lunar" ? 30 : 31 }, (_, i) => ({ v: i + 1, l: `${i + 1}` }))} />
            </div>
          </div>
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
      const unknown = b.hour === null;
      return (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, opacity: unknown ? 0.35 : 1, transition: "opacity 200ms" }}>
            <div className="field">
              <span className="meta">시 (0–23)</span>
              <Picker label="출생 시" value={b.hour ?? 9} cols={6} disabled={unknown} onChange={(v) => setB({ hour: v })} options={Array.from({ length: 24 }, (_, i) => ({ v: i, l: `${String(i).padStart(2, "0")}시` }))} />
            </div>
            <div className="field">
              <span className="meta">분</span>
              <Picker label="출생 분" value={b.minute ?? 0} cols={6} disabled={unknown} onChange={(v) => setB({ minute: v })} options={Array.from({ length: 60 }, (_, i) => ({ v: i, l: `${String(i).padStart(2, "0")}` }))} />
            </div>
          </div>
          <button
            type="button"
            className="chip"
            aria-pressed={unknown}
            onClick={() => setB(unknown ? { hour: 9, minute: 0 } : { hour: null, minute: null })}
            style={{ justifySelf: "start" }}
          >
            태어난 시간을 몰라요
          </button>
          <p className="meta" style={{ margin: 0 }}>
            시간을 모르면 시주(태어난 시의 기둥) 없이 해석해요. 나중에 설정에서 바꿀 수 있어요.
          </p>
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
  date: { title: "생년월일", sub: "양력·음력 중 아는 쪽으로 입력하세요" },
  time: { title: "태어난 시간", sub: "모르면 건너뛸 수 있어요. 시주 없이 계산해요" },
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
