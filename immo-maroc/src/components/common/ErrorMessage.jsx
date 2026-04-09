import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <AlertCircle size={40} className="text-red-400 mb-3" />
      <p className="text-neutral-600 text-sm mb-4 max-w-xs">{message || 'Une erreur est survenue.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={14} />
          Réessayer
        </button>
      )}
    </div>
  );
}
