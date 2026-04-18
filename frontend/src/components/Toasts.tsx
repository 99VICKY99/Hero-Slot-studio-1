import { useEffect } from "react";
import { X } from "lucide-react";
import { useUIStore } from "@/state/uiStore";
import type { Toast } from "@/state/uiStore";

const AUTO_DISMISS_MS = 4500;

const TYPE_STYLES: Record<Toast["type"], string> = {
  success: "border-pos/40 bg-bg-2 text-text-0",
  info: "border-accent-line bg-bg-2 text-text-0",
  warning: "border-warn/50 bg-bg-2 text-text-0",
  error: "border-neg/50 bg-bg-2 text-text-0",
};

export function Toasts() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-m border px-4 py-3 shadow-toolbar ${TYPE_STYLES[toast.type]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-text-0">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-[11.5px] text-text-1">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 rounded-s p-1 text-text-2 transition-colors duration-fast ease-out hover:bg-bg-3 hover:text-text-0"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
