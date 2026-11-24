"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { IconClose } from "./icons";

/** 아래에서 올라오는 상세 시트. 손잡이를 끌어내리거나 바깥을 누르면 닫힌다 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const controls = useDragControls();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    requestAnimationFrame(() => ref.current?.focus());
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      html.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 110 || i.velocity.y > 600) onClose();
            }}
            style={{ outline: "none" }}
          >
            <div className="sheet-grip" onPointerDown={(e) => controls.start(e)}>
              <span />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 12px 0 24px" }}>
              {title ? <h2 className="sheet-title">{title}</h2> : <span />}
              <button className="icon-btn" onClick={onClose} aria-label="닫기">
                <IconClose size={18} />
              </button>
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
