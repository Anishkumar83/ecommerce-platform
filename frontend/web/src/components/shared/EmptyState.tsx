import { type LucideIcon } from 'lucide-react';
import { PackageSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon = PackageSearch, title = 'Nothing here yet', message = 'No records found.', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          {action.label}
        </button>
      )}
    </div>
  );
}
