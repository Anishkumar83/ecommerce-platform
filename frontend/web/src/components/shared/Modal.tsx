import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Modal only. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/** Escape-to-close plus body scroll lock, shared by Modal and Drawer. */
function useDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDismiss(open, onClose);

  // Move focus into the panel so keyboard users are not left behind on the page.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px] animate-[fadeIn_.15s_ease]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${SIZES[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl outline-none max-h-[92vh] flex flex-col animate-[slideUp_.22s_cubic-bezier(.16,1,.3,1)]`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div>
              {title && <h2 className="text-base font-bold font-display text-gray-900">{title}</h2>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 -m-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Right-hand slide-over. Used for campaign detail and content review. */
export function Drawer({ open, onClose, title, subtitle, children, footer }: OverlayProps) {
  useDismiss(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px] animate-[fadeIn_.15s_ease]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideLeft_.24s_cubic-bezier(.16,1,.3,1)]"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            {title && <h2 className="text-base font-bold font-display text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -m-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex items-center gap-2">{footer}</div>}
      </div>
    </div>
  );
}
