// Lightweight toast system — instant feedback for actions that would
// otherwise be silent ("did my Connect actually send?").
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Icon from "./Icon";
import { cx } from "./ui";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: "check", ring: "ring-emerald-500/20", chip: "bg-emerald-500/12 text-emerald-600" },
  error: { icon: "close", ring: "ring-red-500/20", chip: "bg-red-500/12 text-red-600" },
  info: { icon: "sparkles", ring: "ring-brand-500/20", chip: "bg-brand-500/12 text-brand-600" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // toast("Saved") · toast("Failed", { tone: "error" }) · toast(msg, { body, onClick })
  const toast = useCallback((title, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const entry = { id, title, tone: "success", ...opts };
    setToasts((t) => [...t.slice(-2), entry]); // never stack more than 3
    setTimeout(() => dismiss(id), opts.duration ?? 4500);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Live region so screen readers announce them too. */}
      <div aria-live="polite" aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => {
          const tone = TONES[t.tone] ?? TONES.success;
          const Wrapper = t.onClick ? "button" : "div";
          return (
            <Wrapper
              key={t.id}
              onClick={t.onClick ? () => { t.onClick(); dismiss(t.id); } : undefined}
              className={cx(
                "animate-rise pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-white/85 p-3 text-left",
                "shadow-[var(--shadow-float)] ring-1 backdrop-blur-xl transition-transform",
                tone.ring,
                t.onClick && "hover:scale-[1.01]"
              )}
            >
              <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone.chip)}>
                <Icon name={tone.icon} className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900">{t.title}</span>
                {t.body && <span className="mt-0.5 block text-xs leading-snug text-ink-400">{t.body}</span>}
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                onKeyDown={(e) => e.key === "Enter" && dismiss(t.id)}
                className="shrink-0 cursor-pointer rounded p-0.5 text-ink-400 hover:text-ink-700"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </span>
            </Wrapper>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext)?.toast ?? (() => {});
}
