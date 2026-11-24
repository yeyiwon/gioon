"use client";
import { useState } from "react";
import { getState, resetAll, setState, useAppState, type MotionPref } from "@/lib/store";
import type { JasiRule } from "@/lib/saju/calc";
import { Sheet } from "../Sheet";
import { IconChevron } from "../icons";
import { STEPS, STEP_COPY, StepFields, useDraftCheck, type Draft } from "../ProfileForm";
import { useEnv } from "../env";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className="toggle" onClick={() => onChange(!on)} />;
}

function ProfileEditor({ onDone }: { onDone: () => void }) {
  const p = getState().profile!;
  const [draft, setDraft] = useState<Draft>({ name: p.name, gender: p.gender, birth: p.birth });
  const { valid, preview } = useDraftCheck(draft);
  return (
    <div>
      {STEPS.map((s) => (
        <div key={s} style={{ marginBottom: 28 }}>
          <p className="dd-title">{STEP_COPY[s].title}</p>
          <StepFields step={s} draft={draft} set={setDraft} />
        </div>
      ))}
      {preview && <p className="meta">연 · 월 · 일 · 시 &nbsp; {preview}</p>}
      <button
        className="btn btn-primary"
        style={{ width: "100%", margin: "8px 0 16px" }}
        disabled={!valid}
        onClick={() => {
          // createdAt을 유지해 같은 사람의 지난 기록이 이어지게 한다
          setState((s) => ({ ...s, profile: { ...s.profile!, ...draft, name: draft.name.trim() } }));
          onDone();
        }}
      >
        저장하기
      </button>
    </div>
  );
}

export default function Settings() {
  const { go } = useEnv();
  const settings = useAppState((s) => s.settings);
  const profile = useAppState((s) => s.profile);
  const [sheet, setSheet] = useState<null | "profile" | "about" | "reset">(null);
  const [notifyMsg, setNotifyMsg] = useState("");
  const set = (patch: Partial<typeof settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const toggleNotify = async (on: boolean) => {
    if (!on) return set({ notify: false });
    if (!("Notification" in window)) {
      setNotifyMsg("이 브라우저는 알림을 지원하지 않아요");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      set({ notify: true });
      setNotifyMsg("");
    } else setNotifyMsg("브라우저 설정에서 알림이 꺼져 있어요");
  };

  const MOTION: [MotionPref, string, string][] = [
    ["auto", "기기 설정 따르기", "3D와 모션을 모두 보여 줘요"],
    ["reduced", "움직임 줄이기", "3D는 멈춘 채로, 만질 때만 움직여요"],
    ["static", "3D 끄기", "가벼운 그림으로 바꿔 배터리를 아껴요"],
  ];
  const JASI: [JasiRule, string][] = [
    ["split", "23시부터 다음 날 (기본)"],
    ["unified", "0시부터 다음 날 (야자시)"],
  ];

  return (
    <div className="screen settings">
      <style>{css}</style>
      <header className="topbar">
        <button className="icon-btn" onClick={() => go("today")} aria-label="뒤로">
          <IconChevron dir="left" />
        </button>
        <h1 className="section-title" style={{ flex: 1, marginLeft: 4 }}>
          설정
        </h1>
      </header>

      <section className="set-group">
        <h2 className="set-label">사주 프로필</h2>
        <button className="row set-row" onClick={() => setSheet("profile")}>
          <span style={{ flex: 1, textAlign: "left" }}>
            {profile?.name || "이름 없음"}
            <span className="meta" style={{ display: "block" }}>
              {profile?.birth.calendar === "lunar" ? "음력 " : ""}
              {profile?.birth.year}.{profile?.birth.month}.{profile?.birth.day}
              {profile?.birth.hour !== null ? ` ${String(profile?.birth.hour).padStart(2, "0")}:${String(profile?.birth.minute ?? 0).padStart(2, "0")}` : " · 시간 모름"}
            </span>
          </span>
          <span className="muted">수정</span>
          <IconChevron size={16} className="muted" />
        </button>
      </section>

      <section className="set-group">
        <h2 className="set-label">모션과 3D</h2>
        {MOTION.map(([v, l, d]) => (
          <button key={v} className="row set-row" role="radio" aria-checked={settings.motion === v} onClick={() => set({ motion: v })}>
            <span style={{ flex: 1, textAlign: "left" }}>
              {l}
              <span className="meta" style={{ display: "block" }}>
                {d}
              </span>
            </span>
            <span className="radio" data-on={settings.motion === v} />
          </button>
        ))}
      </section>

      <section className="set-group">
        <h2 className="set-label">알림</h2>
        <div className="row">
          <span style={{ flex: 1 }}>
            아침 알림
            <span className="meta" style={{ display: "block" }}>
              {notifyMsg || "알림 권한만 저장돼요. 예약 발송은 다음 버전에서 지원해요"}
            </span>
          </span>
          <Toggle on={settings.notify} onChange={toggleNotify} label="아침 알림" />
        </div>
        {settings.notify && (
          <label className="row">
            <span style={{ flex: 1 }}>알림 시각</span>
            <input type="time" className="input" style={{ width: 120, minHeight: 44 }} value={settings.notifyTime} onChange={(e) => set({ notifyTime: e.target.value })} />
          </label>
        )}
      </section>

      <section className="set-group">
        <h2 className="set-label">해석 기준</h2>
        <p className="meta" style={{ margin: "0 0 8px" }}>
          자시(23–01시) 출생의 일주 경계
        </p>
        {JASI.map(([v, l]) => (
          <button key={v} className="row set-row" role="radio" aria-checked={settings.jasi === v} onClick={() => set({ jasi: v })}>
            <span style={{ flex: 1, textAlign: "left" }}>{l}</span>
            <span className="radio" data-on={settings.jasi === v} />
          </button>
        ))}
        <button className="row set-row" onClick={() => setSheet("about")}>
          <span style={{ flex: 1, textAlign: "left" }}>사주 해석 기준 안내</span>
          <IconChevron size={16} className="muted" />
        </button>
      </section>

      <section className="set-group">
        <h2 className="set-label">데이터</h2>
        <button className="row set-row danger" onClick={() => setSheet("reset")}>
          <span style={{ flex: 1, textAlign: "left" }}>모든 기록 지우기</span>
        </button>
        <p className="meta">프로필과 기록은 이 기기의 브라우저에만 저장되고, 어디에도 전송되지 않아요.</p>
      </section>

      <Sheet open={sheet === "profile"} onClose={() => setSheet(null)} title="사주 프로필 수정">
        {sheet === "profile" && <ProfileEditor onDone={() => setSheet(null)} />}
      </Sheet>

      <Sheet open={sheet === "about"} onClose={() => setSheet(null)} title="해석 기준">
        <div className="about">
          <p>GIOON의 운세는 전통 명리학의 오행 이론을 바탕으로 한 상징적인 해석이에요. 과학적으로 검증된 미래 예측이 아니니, 하루를 시작하는 작은 힌트로 즐겨 주세요.</p>
          <h3>만세력 계산</h3>
          <p>
            천문 계산 라이브러리(lunar-javascript)로 절기와 간지를 구해요. 연주는 입춘, 월주는 각 절기의 절입 시각을 기준으로 하고, 일주와 시주는 출생지 경도로 보정한 지방평균시를 써요. 한국 표준시 변경(1954–61년
            UTC+8:30)과 1987–88년 서머타임을 반영해요.
          </p>
          <h3>오행 분포</h3>
          <p>여덟 글자의 천간과 지지에 숨은 기운(지장간)을 비율로 나누고, 태어난 달의 기운에 두 배의 무게를 둬요.</p>
          <h3>오늘 필요한 기운</h3>
          <p>
            단순히 부족한 오행을 채우지 않아요. 일간의 강약으로 찾은 반가운 기운을 바탕에 두고, 오늘 일진이 무엇을 이미 실어 오는지, 어떤 기운이 넘치는지, 나와 어떤 관계(십신·합·충)인지를 함께 따져 정해요.
          </p>
          <h3>알려진 한계</h3>
          <ul>
            <li>음력은 중국 기준 음력표로 변환해 한국 음력과 드물게 하루 차이가 날 수 있어요.</li>
            <li>1948–51년, 1955–60년 서머타임과 해외 현지 서머타임은 반영하지 않아요.</li>
            <li>균시차(진태양시)는 적용하지 않고 평균 태양시만 써요.</li>
            <li>대운·세운과 신살은 아직 보지 않아요.</li>
          </ul>
        </div>
      </Sheet>

      <Sheet open={sheet === "reset"} onClose={() => setSheet(null)} title="모든 기록을 지울까요">
        <p className="secondary" style={{ marginTop: 0 }}>
          사주 프로필, 달력 기록, 수집함이 모두 사라지고 처음 화면으로 돌아가요. 되돌릴 수 없어요.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "16px 0" }}>
          <button
            className="btn"
            style={{ background: "#9a3a26", color: "#fff" }}
            onClick={() => {
              resetAll();
              window.location.hash = "";
            }}
          >
            지우기
          </button>
          <button className="btn btn-quiet" onClick={() => setSheet(null)}>
            취소
          </button>
        </div>
      </Sheet>
    </div>
  );
}

const css = `
.settings { padding-bottom: calc(var(--safe-b) + 48px); }
.set-group { margin-top: 32px; }
.set-label { font-size: 13px; font-weight: 800; color: var(--ink-3); margin: 0 0 4px; }
.set-row { width: 100%; text-align: left; }
.set-row:active { background: var(--surface); }
.danger { color: #9a3a26; }
.radio { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--line-2); flex: none; transition: box-shadow var(--t-ui) var(--ease); }
.radio[data-on="true"] { box-shadow: inset 0 0 0 7px var(--ink); }
.dd-title { font-size: 13px; font-weight: 500; margin: 0 0 10px; }
.about h3 { font-size: 15px; font-weight: 800; margin: 20px 0 6px; }
.about p, .about li { color: var(--ink-2); font-size: 14px; line-height: 1.65; margin: 0 0 8px; }
.about ul { padding-left: 18px; margin: 0 0 16px; }
@media (min-width: 900px) { .settings { max-width: 640px; } }
`;
