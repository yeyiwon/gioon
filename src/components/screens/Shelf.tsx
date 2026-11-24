"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAppState, isoDate } from "@/lib/store";
import { ELEMENT_INFO } from "@/lib/saju/constants";
import { CHARM_KO, SOCK_PATTERN_KO, SOCK_SHAPE_KO } from "@/lib/fortune/items";
import { CharmArt, SockArt } from "../ItemArt";
import { SockThumbSlot } from "../Slots3D";
import { Sheet } from "../Sheet";
import { StickerArt } from "./Calendar";
import { useEnv } from "../env";

export default function Shelf() {
  const days = useAppState((s) => s.days);
  const { go } = useEnv();
  const [sel, setSel] = useState<string | null>(null);
  const today = isoDate(new Date());
  const months = useMemo(() => {
    const keys = Object.keys(days)
      .filter((k) => days[k].openedAt > 0)
      .sort()
      .reverse();
    const g: { label: string; keys: string[] }[] = [];
    for (const k of keys) {
      const label = `${k.slice(0, 4)}년 ${+k.slice(5, 7)}월`;
      if (g.at(-1)?.label !== label) g.push({ label, keys: [] });
      g.at(-1)!.keys.push(k);
    }
    return g;
  }, [days]);
  const total = months.reduce((s, m) => s + m.keys.length, 0);
  const charms = new Set(months.flatMap((m) => m.keys.map((k) => days[k].charm))).size;
  const r = sel ? days[sel] : null;

  return (
    <div className="screen shelf">
      <style>{css}</style>
      <header className="shelf-head">
        <h1 className="shelf-title">수집함</h1>
        <p className="secondary" style={{ margin: 0 }}>
          매일 연 날의 양말과 부적이 한 칸씩 쌓여요
        </p>
        <dl className="shelf-count">
          <div>
            <dt className="meta">양말</dt>
            <dd>{total}켤레</dd>
          </div>
          <div>
            <dt className="meta">부적 종류</dt>
            <dd>{charms}/7</dd>
          </div>
        </dl>
      </header>

      {total === 0 && (
        <div className="shelf-empty">
          <p>아직 비어 있어요. 오늘의 상자를 열면 첫 칸이 채워져요</p>
          <button className="btn btn-quiet" onClick={() => go("today")}>
            오늘 화면으로
          </button>
        </div>
      )}

      {months.map((m) => (
        <section key={m.label} className="section">
          <h2 className="eyebrow shelf-month">{m.label}</h2>
          <div className="cabinet">
            {m.keys.map((k, i) => {
              const d = days[k];
              return (
                <motion.button
                  key={k}
                  className="cubby"
                  style={{ background: ELEMENT_INFO[d.need].soft }}
                  onClick={() => setSel(k)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, type: "spring", stiffness: 380, damping: 30 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label={`${+k.slice(5, 7)}월 ${+k.slice(8)}일 ${d.sock.base.name} 양말과 ${CHARM_KO[d.charm]}`}
                >
                  <SockThumbSlot spec={d.sock} seed={i * 0.7} className="cubby-3d" />
                  <span className="cubby-charm">
                    <CharmArt kind={d.charm} size={30} />
                  </span>
                  {d.sticker && (
                    <span className="cubby-sticker">
                      <StickerArt s={d.sticker} size={16} />
                    </span>
                  )}
                  <span className="cubby-tag">
                    {+k.slice(8)}
                    {k === today && <i className="new-dot" />}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}

      <Sheet open={!!r} onClose={() => setSel(null)} title={sel ? `${+sel.slice(5, 7)}월 ${+sel.slice(8)}일의 소품` : ""}>
        {r && (
          <div className="shelf-detail">
            <div className="shelf-detail-art">
              <SockArt spec={r.sock} size={120} />
              <CharmArt kind={r.charm} size={64} />
            </div>
            <dl className="tags-mini">
              <div>
                <dt>양말</dt>
                <dd>
                  {r.sock.base.name} {SOCK_PATTERN_KO[r.sock.pattern]} {SOCK_SHAPE_KO[r.sock.shape]}
                </dd>
              </div>
              <div>
                <dt>부적</dt>
                <dd>{CHARM_KO[r.charm]}</dd>
              </div>
              <div>
                <dt>그날의 기운</dt>
                <dd>
                  {r.pillarKo}일 · {ELEMENT_INFO[r.need].hanja} {ELEMENT_INFO[r.need].short}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Sheet>
    </div>
  );
}

const css = `
.shelf-head { margin-top: 12px; }
.shelf-title { font-size: 34px; font-weight: 800; margin: 8px 0 4px; letter-spacing: -0.04em; }
.shelf-count { display: flex; gap: 8px; margin: 16px 0 0; }
.shelf-count > div { background: var(--surface); border-radius: 16px; padding: 12px 16px; flex: 1; }
.shelf-count dd { margin: 2px 0 0; font-size: 26px; font-weight: 800; }
.shelf-month { margin: 0 0 10px; }
.cabinet { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
.cubby { position: relative; aspect-ratio: 1 / 1.12; border-radius: 18px; display: block; overflow: hidden; }
.cubby-3d { position: absolute; inset: 14% 0 18% 0; }
.cubby-charm { position: absolute; right: 6%; bottom: 8%; }
.cubby-sticker { position: absolute; left: 6px; bottom: 6px; transform: rotate(-10deg); }
.cubby-tag { position: absolute; left: 8px; top: 6px; font-size: 12px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 4px; }
.new-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el); display: inline-block; }
.shelf-empty { margin-top: 32px; padding: 32px 16px; text-align: center; border-radius: 20px; background: var(--surface); }
.shelf-detail-art { display: flex; align-items: flex-end; justify-content: center; gap: 8px; padding: 8px 0 16px; }
.tags-mini { margin: 0 0 16px; }
.tags-mini > div { display: grid; grid-template-columns: 84px 1fr; gap: 12px; min-height: 44px; align-items: center; border-top: 1px solid var(--line); }
.tags-mini dd { font-weight: 700; }
.tags-mini dt { font-size: 13px; color: var(--ink-3); }
.tags-mini dd { margin: 0; }
@media (min-width: 900px) { .shelf { max-width: 860px; } .cabinet { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); } }
`;
