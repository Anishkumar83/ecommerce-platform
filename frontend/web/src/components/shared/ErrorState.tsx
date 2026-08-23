import { AlertTriangle, Lock, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  type?: 'error' | 'unauthorized' | 'not_found' | 'conflict';
  message?: string;
  onRetry?: () => void;
}

const CONFIG = {
  error: { icon: AlertTriangle, title: 'Something went wrong', color: 'text-red-500', bg: 'bg-red-50' },
  unauthorized: { icon: Lock, title: "You don't have permission", color: 'text-amber-500', bg: 'bg-amber-50' },
  not_found: { icon: AlertTriangle, title: 'Not found', color: 'text-gray-400', bg: 'bg-gray-50' },
  conflict: { icon: RefreshCw, title: 'Record modified', color: 'text-orange-500', bg: 'bg-orange-50' },
};

export default function ErrorState({ type = 'error', message, onRetry }: ErrorStateProps) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-16 h-16 rounded-2xl ${cfg.bg} flex items-center justify-center mb-4`}>
        <Icon size={28} className={cfg.color} />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{cfg.title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-sm">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}
