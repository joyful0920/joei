"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; message: string; action?: ToastAction };

const ToastCtx = createContext<{
  show: (t: Omit<Toast, "id">) => void;
} | null>(null);

let nextId = 1;
const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { ...toast, id }]);
      const tm = setTimeout(() => dismiss(id), TOAST_DURATION_MS);
      timers.current.set(id, tm);
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex max-w-md items-center gap-4 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-lg ring-1 ring-zinc-800"
          >
            <span className="leading-tight">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="font-inter text-xs font-medium text-amber-300 hover:text-amber-200"
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
