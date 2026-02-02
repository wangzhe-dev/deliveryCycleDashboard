type ToastType = 'success' | 'error' | 'warning' | 'info';

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50/95 text-emerald-700 ring-emerald-200/80',
  error: 'bg-rose-50/95 text-rose-700 ring-rose-200/80',
  warning: 'bg-amber-50/95 text-amber-700 ring-amber-200/80',
  info: 'bg-slate-50/95 text-slate-700 ring-slate-200/80',
};

let toastEl: HTMLDivElement | null = null;
let toastTimer: number | null = null;

function ensureToastEl() {
  if (toastEl) return toastEl;
  if (typeof document === 'undefined') return null;

  toastEl = document.createElement('div');
  toastEl.className =
    'fixed top-5 right-5 z-[9999] pointer-events-none rounded-xl px-3 py-2 text-sm font-semibold ring-1 shadow-lg transition opacity-0 translate-y-2';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  return toastEl;
}

function showToast(message: string, type: ToastType = 'info', duration = 2400) {
  const el = ensureToastEl();
  if (!el) return;

  const safeMsg = String(message ?? '');
  const palette = TOAST_STYLES[type] || TOAST_STYLES.info;
  el.className =
    'fixed top-5 right-5 z-[9999] pointer-events-none rounded-xl px-3 py-2 text-sm font-semibold ring-1 shadow-lg transition opacity-0 translate-y-2 ' +
    palette;
  el.textContent = safeMsg;

  requestAnimationFrame(() => {
    if (!el) return;
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
  });

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (!el) return;
    el.classList.remove('opacity-100', 'translate-y-0');
    el.classList.add('opacity-0', 'translate-y-2');
  }, duration);
}

export function showSuccess(message: string, duration?: number) {
  showToast(message, 'success', duration);
}

export function showError(message: string, duration?: number) {
  showToast(message, 'error', duration);
}
