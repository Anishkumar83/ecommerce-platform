import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

interface CopyButtonProps {
  value: string;
  label?: string;
  /** Message shown in the toast. Defaults to "Copied to clipboard". */
  toastMessage?: string;
  variant?: 'button' | 'icon';
  className?: string;
}

/**
 * Copies `value`, shows an inline tick for two seconds, and fires a toast.
 * Falls back to a hidden textarea + execCommand where the async clipboard API
 * is unavailable (older Safari, and any non-secure origin).
 */
export default function CopyButton({ value, label = 'Copy', toastMessage, variant = 'button', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      toast(toastMessage ?? 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast('Could not copy — select the text and copy manually', 'error');
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={copy}
        aria-label={label}
        className={`p-2 rounded-lg text-gray-500 hover:text-brand-700 hover:bg-brand-50 transition-colors ${className}`}
      >
        {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors ${className}`}
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
