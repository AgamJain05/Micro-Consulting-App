import { useToastStore, Toast, ToastType } from '../store/toastStore';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-green-900/80', border: 'border-green-700', icon: CheckCircle },
  error: { bg: 'bg-red-900/80', border: 'border-red-700', icon: XCircle },
  warning: { bg: 'bg-yellow-900/80', border: 'border-yellow-700', icon: AlertTriangle },
  info: { bg: 'bg-purple-900/80', border: 'border-purple-700', icon: Info },
};

const iconColors: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-purple-400',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm
        ${style.bg} ${style.border}
        ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}
        transition-all duration-200
      `}
    >
      <Icon className={`w-5 h-5 ${iconColors[toast.type]}`} />
      <span className="flex-1 text-sm font-medium text-gray-100">{toast.message}</span>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-white/10 transition"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// Add these styles to your index.css
export const toastAnimationStyles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}

.animate-slide-out {
  animation: slide-out 0.2s ease-in;
}
`;
