"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { ELEMENT_INFO, type Element } from "@/lib/saju/constants";
import { useFortune, useChart, haptic, useMotionLevel } from "@/lib/hooks";
import { getState, setState } from "@/lib/store";
import { CHARM_KO, SOCK_PATTERN_KO } from "@/lib/fortune/items";
import { josa } from "@/lib/fortune/daily";
import { HeroSlot, GiftSlot } from "../Slots3D";
import { Sheet } from "../Sheet";
import { SockArt, CharmArt } from "../ItemArt";
import { IconChevron } from "../icons";
import { useEnv } from "../env";

// 개발 중 오행별 3D 확인용: ?el=fire (프로덕션 빌드에선 무시)
const devElement = () =>
  process.env.NODE_ENV !== "production" ? (new URLSearchParams(window.location.search).get("el") as Element | null) : null;

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const ease = [0.22, 1, 0.36, 1] as const;

/** 숫자가 굴러 올라가는 카운트업 */
export function CountUp({ to, delay = 0, className }: { to: number; delay?: number; className?: string }) {
  const level = useMotionLevel();
  const mv = useMotionValue(level === "full" ? 0 : to);
  const [v, setV] = useState(level === "full" ? 0 : to);
  useEffect(() => mv.on("change", (x) => setV(Math.round(x))), [mv]);
  useEffect(() => {
    if (level !== "full") {
      mv.set(to);
      return;
    }
    const c = animate(mv, to, { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [to, delay, level, mv]);
  return <span className={className}>{v}</span>;
}

/** 오행별 배경 도형 — 오행이 바뀌면 형태가 모핑된다 (같은 점 개수) */
export const SHAPES: Record<Element, string> = {
  wood: "M100 10C140 10 170 50 170 100C170 150 140 190 100 190C60 190 30 150 30 100C30 50 60 10 100 10Z",
  fire: "M100 8C150 40 178 80 172 125C166 165 136 192 100 192C64 192 34 165 28 125C22 80 50 40 100 8Z",
  earth: "M100 30C140 30 172 40 172 90C172 140 150 182 100 182C50 182 28 140 28 90C28 40 60 30 100 30Z",
  metal: "M100 12C125 70 188 75 140 116C155 180 100 146 100 146C100 146 45 180 60 116C12 75 75 70 100 12Z",
  water: "M100 8C120 50 175 85 175 130C175 168 142 192 100 192C58 192 25 168 25 130C25 85 80 50 100 8Z",
};

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const CROSS = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const ROLE_KO = { main: "메인", sub: "보조", point: "포인트" } as const;
/** 밝은 색 위에는 어두운 글자와 테두리 */
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
};

export default function Today({ date }: { date: string }) {
  const f = useFortune(date);
  const c = useChart();
  const { go } = useEnv();
  const motionLevel = useMotionLevel();
  const [introStart] = useState(() => (getState().days[date] ? 0 : performance.now()));
  const first = introStart > 0;
  const [detail, setDetail] = useState(false);
  const [why, setWhy] = useState(false);
  const [openAt, setOpenAt] = useState<number | null>(() => (getState().days[date]?.boxOpened ? 1 : null));
  const [flying, setFlying] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [cat, setCat] = useState(0);
  const [basis, setBasis] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const colorRef = useRef<HTMLElement>(null);
  const giftRef = useRef<HTMLElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const shapeRot = useTransform(scrollY, [0, 500], [0, motionLevel === "full" ? 50 : 0]);
  const shapeScale = useTransform(scrollY, [0, 500], [1, motionLevel === "full" ? 1.25 : 1]);

  // 오늘 기록 생성 (수집함 자동 저장) · 프로필이 바뀌면 오늘 스냅샷만 갱신
  useEffect(() => {
    if (!f) return;
    const prev = getState().days[date];
    if (prev) {
      if (prev.need !== f.need || JSON.stringify(prev.sock) !== JSON.stringify(f.items.sock) || prev.charm !== f.charm)
        setState((s) => ({ ...s, days: { ...s.days, [date]: { ...prev, need: f.need, pillarKo: f.pillarKo, sock: f.items.sock, charm: f.charm } } }));
      return;
    }
    setState((s) => ({
      ...s,
      days: { ...s.days, [date]: { openedAt: Date.now(), need: f.need, pillarKo: f.pillarKo, sock: f.items.sock, charm: f.charm } },
    }));
  }, [date, f]);

  if (!f || !c) return null;
  const el = ELEMENT_INFO[f.need];
  const d = new Date(date + "T00:00:00");
  const sock = f.items.sock;
  const t0 = first ? 0.5 : 0;

  const openBox = () => {
    if (openAt) return;
    haptic(14);
    setOpenAt(performance.now());
    setState((s) => ({ ...s, days: { ...s.days, [date]: { ...s.days[date], boxOpened: true } } }));
    window.setTimeout(() => {
      const from = giftRef.current?.getBoundingClientRect();
      const to = document.querySelector('[data-nav="shelf"]')?.getBoundingClientRect();
      if (from && to && motionLevel === "full")
        setFlying({ x: from.left + from.width / 2, y: from.top + 160, tx: to.left + to.width / 2, ty: to.top + to.height / 2 });
    }, 1500);
  };

  const copyHex = async (hex: string) => {
    haptic(8);
    try {
      await navigator.clipboard.writeText(hex);
      setToast(`${hex} 복사했어요`);
    } catch {
      setToast(hex);
    }
    window.setTimeout(() => setToast(null), 1600);
  };

  // 이미 연 상자도 개봉 장면을 다시 볼 수 있게 (기록은 그대로)
  const replayBox = () => {
    haptic(10);
    setOpenAt(null);
    window.setTimeout(() => {
      setOpenAt(performance.now());
      }, 450);
  };

  const scrollToCat = (i: number) => {
    const box = swipeRef.current;
    if (!box) return;
    haptic(6);
    box.scrollTo({ left: (box.children[i] as HTMLElement).offsetLeft - (box.children[0] as HTMLElement).offsetLeft, behavior: motionLevel === "full" ? "smooth" : "auto" });
  };

  return (
    <div className="screen today">
      <style>{css}</style>
      <header className="topbar">
        <div>
          <p className="h-md" style={{ margin: 0 }}>
            {d.getMonth() + 1}월 {d.getDate()}일 {WEEK[d.getDay()]}요일
          </p>
          <p className="meta" style={{ margin: 0 }}>
            {c.profile.name ? `${c.profile.name}님 · ` : ""}{f.pillarKo}일({f.pillar.stem}
            {f.pillar.branch})
          </p>
        </div>
      </header>

      <div className="today-grid">
        {/* ── 첫 화면 핵심 블록: 컬러 블록이 원형으로 펼쳐지며 등장 ── */}
        <motion.section
          className="hero-card"
          initial={{ clipPath: "circle(0% at 78% 34%)" }}
          animate={{ clipPath: "circle(150% at 78% 34%)" }}
          transition={{ duration: first ? 0.7 : 0.45, ease }}
        >
          <motion.svg className="hero-shape" viewBox="0 0 200 200" style={{ rotate: shapeRot, scale: shapeScale }} aria-hidden>
            <path d={SHAPES[f.need]} fill="var(--el)" fillOpacity={0.38} />
          </motion.svg>
          <div className="hero-text">
            <p className="hero-eyebrow">오늘의 운세</p>
            <button className="hero-score" onClick={() => setBasis(true)} aria-label={`오늘의 운세 ${f.total}점, 점수 기준 보기`}>
              <CountUp to={f.total} delay={t0} className="num" />
              <span>점</span>
              <span className="basis-chip">기준</span>
            </button>
            <motion.h1 className="hero-head" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: t0 + 0.15, duration: 0.35, ease }}>
              {f.headline}
            </motion.h1>
          </div>
          <HeroSlot element={devElement() ?? f.need} introStart={introStart} className="hero-3d" style={{ position: "absolute" }} onTap={() => haptic()} />
          <div className="hero-info">
            <button className="hi-col" onClick={() => setWhy(true)}>
              <span className="hi-label">필요한 기운</span>
              <span className="hi-big">
                {el.hanja} {el.ko}
              </span>
              <span className="hi-sub">
                {el.mood} <IconChevron size={12} />
              </span>
            </button>
            <span className="hi-div" aria-hidden />
            <button className="hi-col" onClick={() => colorRef.current?.scrollIntoView({ behavior: motionLevel === "full" ? "smooth" : "auto", block: "start" })}>
              <span className="hi-label">행운 컬러</span>
              <span className="hi-dots">
                {f.colors.map((col, i) => (
                  <motion.i
                    key={col.role}
                    className="dot"
                    data-role={col.role}
                    style={{ background: col.swatch.hex }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: t0 + 0.3 + i * 0.07, type: "spring", stiffness: 500, damping: 16 }}
                  />
                ))}
              </span>
              <span className="hi-sub">{f.colors[0].swatch.name}</span>
            </button>
          </div>
        </motion.section>

        <div className="today-body">
          {/* ── 할 것 / 조심할 것 ── */}
          <section className="dodont">
            {[
              { title: "하면 좋은 것", items: f.dos, kind: "do", ic: CHECK },
              { title: "조심할 것", items: f.donts, kind: "dont", ic: CROSS },
            ].map((g, gi) => (
              <div key={g.kind} className={`dd ${g.kind}`}>
                <h2 className="dd-title">{g.title}</h2>
                <ul>
                  {g.items.map((x, i) => (
                    <motion.li key={x} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: t0 + 0.25 + gi * 0.1 + i * 0.06, type: "spring", stiffness: 500, damping: 30 }}>
                      <span className="ic">{g.ic}</span>
                      {x}
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* ── 오늘의 행운 컬러 ── */}
          <section className="section lucky-colors" ref={colorRef}>
            <div className="section-head">
              <h2 className="section-title">오늘의 행운 컬러</h2>
              <span className="meta">색을 누르면 코드 복사</span>
            </div>
            <div className="lc-grid">
              {f.colors.map((col) => (
                <motion.button
                  key={col.role}
                  className="lc"
                  data-role={col.role}
                  data-light={isLight(col.swatch.hex)}
                  style={{ background: col.swatch.hex, color: isLight(col.swatch.hex) ? "#111216" : "#ffffff" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => copyHex(col.swatch.hex)}
                  aria-label={`${ROLE_KO[col.role]} 컬러 ${col.swatch.name} ${col.swatch.hex} 복사`}
                >
                  <span className="lc-role">{ROLE_KO[col.role]}</span>
                  <span className="lc-name">{col.swatch.name}</span>
                  <span className="lc-hex">{col.swatch.hex}</span>
                </motion.button>
              ))}
            </div>
            <ul className="lc-why">
              {f.colors.map((col) => (
                <li key={col.role}>
                  <i className="dot sm" style={{ background: col.swatch.hex }} />
                  <span>
                    <b>{col.swatch.name}</b> {col.reason}
                    <span className="muted"> · {col.use}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── 분야별 운세 (스와이프) ── */}
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">분야별 운세</h2>
              <span className="meta">옆으로 넘겨 보세요</span>
            </div>
            <div className="cat-tabs" role="tablist">
              {f.scores.map((s, i) => (
                <button key={s.key} role="tab" aria-selected={cat === i} onClick={() => scrollToCat(i)}>
                  {cat === i && <motion.span layoutId="cat-pill" className="cat-pill" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
                  {s.label}
                </button>
              ))}
            </div>
            <div
              className="cat-swipe"
              ref={swipeRef}
              onScroll={(e) => {
                const t = e.currentTarget;
                const step = (t.children[1] as HTMLElement).offsetLeft - (t.children[0] as HTMLElement).offsetLeft || 1;
                const i = Math.max(0, Math.min(3, Math.round(t.scrollLeft / step)));
                if (i !== cat) setCat(i);
              }}
            >
              {f.scores.map((s) => (
                <article key={s.key} className="cat-card" data-level={s.level}>
                  <p className="cat-label">{s.label}운</p>
                  <p className="cat-num num">
                    {s.level}
                    <span>/5</span>
                  </p>
                  <div className="seg-bar" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.i
                        key={i}
                        data-on={i < s.level}
                        initial={{ scaleY: 0.3 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 600, damping: 20 }}
                      />
                    ))}
                  </div>
                  <p className="cat-note">{s.note}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── 행운의 양말 ── */}
          <section className="section gift" ref={giftRef}>
            <div className="section-head">
              <h2 className="section-title">추천 양말</h2>
              <span className="meta">{openAt ? "수집함에 저장됨" : "상자를 눌러 열기"}</span>
            </div>
            <div className="gift-stage">
              <GiftSlot spec={sock} ribbon="#ff5fa2" box={el.color} openAt={openAt} onTap={openBox} className="gift-3d" />
            </div>
            {!openAt ? (
              <button className="btn btn-primary gift-cta" onClick={getState().days[date]?.boxOpened ? undefined : openBox} disabled={!!getState().days[date]?.boxOpened}>
                {getState().days[date]?.boxOpened ? "상자를 여는 중" : "상자 열고 양말 확인하기"}
              </button>
            ) : (
              <button className="btn btn-quiet gift-cta" onClick={replayBox}>
                다시 열기
              </button>
            )}
            <AnimatePresence initial={false}>
              {openAt && (
                <motion.div className="sock-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: openAt === 1 ? 0 : 0.7, duration: 0.35, ease }}>
                  <p className="sock-name">
                    <i className="dot" style={{ background: sock.base.hex }} />
                    {sock.base.name} {SOCK_PATTERN_KO[sock.pattern]} 양말
                  </p>
                  <p className="meta" style={{ margin: "4px 0 0" }}>
                    디자인은 예시예요. 메인 컬러가 들어간 양말이면 무엇이든 좋아요
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── 행운 아이템: 정보 성격별로 다른 표현 ── */}
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">행운 아이템</h2>
            </div>
            <dl className="lucky">
              <div>
                <dt>숫자</dt>
                <dd className="nums num">
                  <span className="n1">{f.items.numbers[0]}</span>
                  <span className="sep">·</span>
                  <span>{f.items.numbers[1]}</span>
                </dd>
              </div>
              <div>
                <dt>음식</dt>
                <dd>
                  <span>
                    <b className="big">{f.items.food}</b>
                    <small>음료 · {f.items.drink}</small>
                  </span>
                </dd>
              </div>
              <div>
                <dt>옷</dt>
                <dd>
                  <i className="dot" style={{ background: f.items.outfit.swatch.hex }} />
                  {f.items.outfit.name}
                </dd>
              </div>
              <div>
                <dt>소품</dt>
                <dd>{f.items.accessory}</dd>
              </div>
              <div>
                <dt>작은 행동</dt>
                <dd>{f.items.ritual}</dd>
              </div>
              <div>
                <dt>부적</dt>
                <dd>
                  <CharmArt kind={f.charm} size={24} />
                  {CHARM_KO[f.charm]}
                </dd>
              </div>
            </dl>
          </section>

          {/* ── 상세 사주 해석 ── */}
          <section className="section">
            <button className="detail-head" aria-expanded={detail} onClick={() => setDetail(!detail)}>
              <span className="section-title">오늘의 사주 해석</span>
              <motion.span animate={{ rotate: detail ? 180 : 0 }} style={{ display: "grid" }}>
                <IconChevron dir="down" size={20} />
              </motion.span>
            </button>
            <p className="secondary" style={{ margin: "6px 0 0", fontSize: 14 }}>
              {f.flow}
            </p>
            <AnimatePresence initial={false}>
              {detail && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease }} style={{ overflow: "hidden" }}>
                  <div className="detail">
                    <p className="dl-row">
                      <span>오늘 일진</span>
                      <b>
                        {f.pillarKo}({f.pillar.stem}
                        {f.pillar.branch})
                      </b>
                    </p>
                    <p className="dl-row">
                      <span>내 일간과의 관계</span>
                      <b>
                        천간 {f.tenGod} · 지지 {f.branchTenGod}
                      </b>
                    </p>
                    <p className="dl-row">
                      <span>합 · 충</span>
                      <b>{[...f.harmony.map((h) => `${h} 합`), ...f.clash.map((h) => `${h} 충`)].join(", ") || "없음"}</b>
                    </p>
                    {f.detail.map((t, i) => (
                      <p key={i} className="detail-p">
                        {t}
                      </p>
                    ))}
                    <p className="detail-p">{f.needReason}</p>
                    <button className="btn btn-quiet" style={{ width: "100%", marginTop: 12 }} onClick={() => go("chart")}>
                      내 사주 원국 보기
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="meta" style={{ marginTop: 20 }}>
              전통 명리학에 따른 상징적 해석이에요. 과학적 예측이 아니에요.
            </p>
          </section>
        </div>
      </div>

      <Sheet open={why} onClose={() => setWhy(false)} title={`오늘 ${josa(el.ko, "이", "가")} 필요한 이유`}>
        <p style={{ marginTop: 0 }}>{f.needReason}</p>
        {c.analysis.reasons.map((r) => (
          <p key={r} className="secondary" style={{ margin: "0 0 10px", fontSize: 14 }}>
            {r}
          </p>
        ))}
        <p className="meta">부족한 오행을 무조건 채우지 않고, 타고난 균형과 오늘 일진의 관계를 함께 봐요.</p>
        <button
          className="btn btn-el"
          style={{ width: "100%", margin: "8px 0" }}
          onClick={() => {
            setWhy(false);
            go("chart");
          }}
        >
          내 오행 균형 보기
        </button>
      </Sheet>

      <Sheet open={basis} onClose={() => setBasis(false)} title="오늘 점수는 이렇게 정해요">
        <ul className="basis-list">
          {f.basis.map((b) => (
            <li key={b.label}>
              <span>{b.label}</span>
              <b>{b.effect}</b>
            </li>
          ))}
          {f.scores.map((x) => (
            <li key={x.key}>
              <span>{x.label}</span>
              <b>{x.level}/5</b>
            </li>
          ))}
        </ul>
        <p className="meta" style={{ margin: "12px 0 16px" }}>
          일진과 내 사주의 관계(십신·합충·희용신)를 규칙에 따라 점수로 옮긴 지수예요. 일이 일어날 확률을 뜻하지 않아요.
        </p>
      </Sheet>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: 12, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flying && (
          <motion.div
            className="flyer"
            initial={{ x: flying.x - 32, y: flying.y - 36, scale: 1, opacity: 1, rotate: 0 }}
            animate={{
              x: [flying.x - 32, (flying.x + flying.tx) / 2 - 32, flying.tx - 32],
              y: [flying.y - 36, Math.min(flying.y, flying.ty) - 140, flying.ty - 36],
              scale: [1, 0.8, 0.25],
              rotate: [0, -20, 10],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.8, ease: [0.5, 0, 0.3, 1], times: [0, 0.5, 1] }}
            onAnimationComplete={() => {
              setFlying(null);
              haptic(10);
              const nav = document.querySelector('[data-nav="shelf"]') as HTMLElement | null;
              nav?.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 300, easing: "cubic-bezier(0.34,1.56,0.64,1)" });
            }}
          >
            <SockArt spec={sock} size={64} shadow={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const css = `
.hero-card { position: relative; overflow: hidden; border-radius: var(--r-lg); background: var(--el-soft); color: var(--ink); padding: 20px 18px 10px; min-height: 340px; display: flex; flex-direction: column; }
.hero-shape { position: absolute; right: -60px; top: -40px; width: 300px; height: 300px; pointer-events: none; }
.hero-text { position: relative; width: 52%; z-index: 1; }
.hero-eyebrow { margin: 0; font-size: 13px; font-weight: 700; opacity: 0.75; }
.hero-score { margin: 2px 0 0; display: flex; align-items: baseline; gap: 2px; line-height: 1; color: inherit; text-align: left; }
.hero-score .num { font-size: 64px; }
.hero-score > span:last-child { font-size: 20px; font-weight: 800; }
.hero-head { font-size: 19px; font-weight: 800; line-height: 1.3; letter-spacing: -0.03em; margin: 10px 0 0; }
.hero-3d { right: 0; top: 0; width: 48%; height: 236px; }
.hero-info { position: relative; z-index: 1; margin-top: auto; padding-top: 14px; display: grid; grid-template-columns: 1fr 1px 1fr; gap: 14px; border-top: 1.5px solid rgba(17,18,22,0.08); }
.hi-col { text-align: left; color: inherit; display: flex; flex-direction: column; gap: 2px; min-height: 76px; justify-content: center; min-width: 0; }
.hi-col:active { opacity: 0.7; }
.hi-label { font-size: 12px; font-weight: 700; opacity: 0.72; }
.hi-big { color: var(--el-ink); font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
.hi-sub { font-size: 12px; font-weight: 600; opacity: 0.8; display: flex; align-items: center; gap: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hi-div { background: rgba(17,18,22,0.08); }
.hi-dots { display: flex; align-items: center; height: 34px; }
.hi-dots .dot { width: 30px; height: 30px; margin-right: -6px; box-shadow: 0 0 0 2.5px var(--el-soft), inset 0 0 0 1px rgba(17,18,22,0.12); }
.hi-dots .dot[data-role="main"] { width: 34px; height: 34px; }
.dot { display: inline-block; border-radius: 50%; flex: none; width: 16px; height: 16px; box-shadow: inset 0 0 0 1px rgba(17,18,22,0.14); }
.dot.sm { width: 14px; height: 14px; }
.basis-chip { align-self: center; margin-left: 8px; font-size: 11px; font-weight: 800; padding: 3px 7px; border-radius: 999px; background: var(--el); color: var(--el-on); }
.lc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.lc { position: relative; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; text-align: left; min-height: 104px; padding: 14px; border-radius: var(--r-md); }
.lc[data-role="main"] { grid-column: 1 / -1; min-height: 136px; }
.lc[data-light="true"] { box-shadow: inset 0 0 0 1.5px var(--line-2); }
.lc-role { position: absolute; top: 12px; left: 14px; font-size: 12px; font-weight: 800; opacity: 0.75; }
.lc-name { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
.lc[data-role="main"] .lc-name { font-size: 28px; }
.lc-hex { font-size: 13px; font-weight: 700; opacity: 0.8; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
.lc-why { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; }
.lc-why li { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; line-height: 1.45; }
.lc-why .dot { margin-top: 3px; }
.lc-why b { font-weight: 800; }
.basis-list { list-style: none; margin: 0; padding: 0; }
.basis-list li { display: flex; justify-content: space-between; gap: 12px; min-height: 44px; align-items: center; border-bottom: 1px solid var(--line); font-size: 14px; }
.basis-list span { color: var(--ink-3); }
.basis-list b { font-weight: 700; text-align: right; }
.toast { position: fixed; left: 50%; bottom: calc(var(--nav-h) + var(--safe-b) + 16px); z-index: 45; background: var(--ink); color: #fff; font-weight: 700; font-size: 14px; padding: 10px 16px; border-radius: 999px; }
.sock-name { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 17px; font-weight: 800; }
.tile-label { font-size: 12px; font-weight: 700; color: var(--ink-3); }
.tile-big-unused { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile-sub { font-size: 12px; color: var(--ink-2); display: flex; align-items: center; gap: 2px; }
.swatch { display: inline-block; width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(17,18,22,0.12); flex: none; }
.swatch.sm { width: 14px; height: 14px; }
.dodont { margin-top: 20px; display: grid; gap: 18px; }
.dd-title { margin: 0 0 8px; font-size: 14px; font-weight: 800; }
.dd ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.dd li { display: flex; gap: 10px; align-items: center; font-size: 16px; font-weight: 600; line-height: 1.4; }
.dd .ic { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; }
.do .ic { background: var(--el); color: var(--el-on); }
.dont .ic { background: var(--pink); color: #fff; }
.cat-tabs { display: flex; gap: 4px; padding: 4px; background: var(--surface); border-radius: 14px; margin-bottom: 12px; }
.cat-tabs button { position: relative; flex: 1; min-height: 40px; border-radius: 10px; font-size: 14px; font-weight: 700; color: var(--ink-3); z-index: 0; white-space: nowrap; }
.cat-tabs button[aria-selected="true"] { color: var(--ink); }
.cat-pill { position: absolute; inset: 0; background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(17,18,22,0.1); z-index: -1; }
.cat-swipe { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 calc(var(--gutter) * -1); padding: 0 var(--gutter); scroll-padding: 0 var(--gutter); scrollbar-width: none; overscroll-behavior-x: contain; }
.cat-swipe::-webkit-scrollbar { display: none; }
.cat-card { flex: 0 0 84%; scroll-snap-align: start; border-radius: var(--r-md); background: var(--surface); padding: 18px; }
.cat-card[data-level="5"], .cat-card[data-level="4"] { background: var(--el-soft); }
.cat-label { margin: 0; font-weight: 800; font-size: 15px; }
.cat-num { margin: 4px 0 12px; font-size: 52px; line-height: 1; }
.cat-num span { font-size: 20px; color: var(--ink-3); margin-left: 2px; }
.seg-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; height: 12px; }
.seg-bar i { border-radius: 4px; background: rgba(17,18,22,0.08); transform-origin: bottom; }
.seg-bar i[data-on="true"] { background: var(--ink); }
.cat-note { margin: 12px 0 0; font-size: 16px; font-weight: 700; }
.gift-stage { position: relative; border-radius: var(--r-lg); background: var(--surface); overflow: hidden; }
.gift-3d { height: 300px; }
.gift-cta { width: 100%; margin-top: 10px; }
.sock-info { margin-top: 12px; }
.sock-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.lucky { margin: 0; }
.lucky > div { display: grid; grid-template-columns: 76px 1fr; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.lucky dt { font-size: 13px; font-weight: 800; color: var(--ink-3); }
.lucky dd { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; min-width: 0; }
.lucky dd > span { display: flex; flex-direction: column; min-width: 0; }
.lucky small { font-size: 13px; font-weight: 600; color: var(--ink-3); }
.lucky .big { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
.nums { gap: 10px; font-size: 26px; }
.nums .n1 { color: var(--el-ink); }
.nums .sep { color: var(--ink-3); font-weight: 600; }
.detail-head { width: 100%; display: flex; justify-content: space-between; align-items: center; min-height: 44px; }
.detail { padding-top: 12px; }
.dl-row { display: flex; justify-content: space-between; gap: 12px; margin: 0; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
.dl-row span { color: var(--ink-3); }
.dl-row b { font-weight: 700; text-align: right; }
.detail-p { margin: 12px 0 0; font-size: 14px; line-height: 1.6; color: var(--ink-2); }
.flyer { position: fixed; left: 0; top: 0; z-index: 50; pointer-events: none; }
@media (max-width: 359px) {
  .hero-score .num { font-size: 54px; }
  .hero-head { font-size: 17px; }
  .hi-big { font-size: 20px; }
}
@media (min-width: 900px) {
  .today-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: start; }
  .hero-card { position: sticky; top: 16px; min-height: 520px; }
  .hero-3d { height: 360px; top: 40px; }
  .today-body .dodont { margin-top: 0; }
  .lucky-colors { margin-top: 32px; }
  .cat-swipe { margin: 0; padding: 0; scroll-padding: 0; }
}
`;
