import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const KIND_STYLE: Record<string, string> = {
  success: 'bg-indigo-600 text-white',
  warn: 'bg-amber-500 text-slate-900',
  error: 'bg-rose-600 text-white',
}

export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const clearToast = useAppStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2200)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto rounded-2xl px-5 py-3 shadow-lg text-base font-semibold transition-all duration-200 ${KIND_STYLE[toast.kind]}`}
      >
        {toast.text}
      </div>
    </div>
  )
}
