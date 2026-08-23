import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** Shows a toast. Auto-dismisses after 3.2s. */
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, { icon: typeof Check; cls: string }> = {
  success: { icon: Check, cls: 'bg-emerald-600' },
  error: { icon: AlertTriangle, cls: 'bg-red-600' },
  info: { icon: Info, cls: 'bg-gray-900' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setToasts(t => [...t, { id, message, tone }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  // Clear any pending timers if the provider unmounts mid-toast.
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(t => {
          const { icon: Icon, cls } = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2.5 ${cls} text-white text-sm font-medium pl-3.5 pr-2.5 py-2.5 rounded-xl shadow-lg animate-[toastIn_.24s_cubic-bezier(.16,1,.3,1)] max-w-sm`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="grow">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="p-1 -m-1 rounded hover:bg-white/15 shrink-0">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Falls back to a no-op outside a provider so a component can be dropped into
 * a page that has not mounted one yet without crashing.
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { toast: () => {} };
}
