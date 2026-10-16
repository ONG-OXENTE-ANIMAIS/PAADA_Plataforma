"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = { id: number; msg: string; icon: string; saindo: boolean };

const ToastCtx = createContext<(msg: string, icon?: string) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((msg: string, icon = "check-circle") => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, msg, icon, saindo: false }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, saindo: true } : x)));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 380);
    }, 3400);
  }, []);

  return (
    <ToastCtx value={push}>
      {children}
      <div className="toasts" id="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.saindo ? " saindo" : "")}>
            <i className={"ph-fill ph-" + t.icon} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx>
  );
}
