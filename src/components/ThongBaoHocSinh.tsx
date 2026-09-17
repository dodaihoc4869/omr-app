import { useEffect, useState, useRef } from 'react'
import { Bell, BellOff, X, BookOpen, Sparkles, CheckCheck, ChevronRight } from 'lucide-react'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'

type Notice = {
  id: string
  title: string
  body: string
  target: 'btvn' | 'mom'
  created_at: string
  read_at: string | null
}

export async function noticeApi(
  token: string,
  action: string,
  body: Record<string, unknown> = {}
) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), 20000)
  try {
    const url = await layDiaChiMayChu()
    const r = await fetch(`${url}/notifications/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...body }),
      signal: c.signal,
    })
    const d = await r.json()
    if (!r.ok || !d.ok) throw new Error(d.error || 'Chưa cập nhật được thông báo.')
    return d
  } finally {
    clearTimeout(t)
  }
}

function dinhDangThoiGian(isoString: string): string {
  try {
    const d = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffPhut = Math.floor(diffMs / 60000)
    if (diffPhut < 1) return 'Vừa xong'
    if (diffPhut < 60) return `${diffPhut} phút trước`
    const diffGio = Math.floor(diffPhut / 60)
    if (diffGio < 24 && d.getDate() === now.getDate()) {
      return `Hôm nay ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return `Hôm qua ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return isoString
  }
}

export default function ThongBaoHocSinh({
  token,
  onOpen,
}: {
  token: string
  onOpen: (tab: 'btvn' | 'mom', noticeId?: string) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [items, setItems] = useState<Notice[]>([])
  const [open, setOpen] = useState(
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('thongbao')
  )
  const [key, setKey] = useState('')
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    let pending = false
    setItems([])
    setLoaded(false)
    setEnabled(false)

    const refresh = async () => {
      if (document.hidden || pending) return
      pending = true
      try {
        const d = await noticeApi(token, 'list')
        if (alive) {
          setItems(d.items || [])
          setKey(d.publicKey || '')
          setLoaded(true)
          setLoadError('')
        }
      } catch {
        if (alive) setLoadError('Chưa tải được thông báo. App sẽ tự thử lại khi có mạng.')
      } finally {
        pending = false
      }
    }

    void refresh()
    const timer = setInterval(() => void refresh(), 15000)

    const focus = () => void refresh()
    const received = (event: MessageEvent) => {
      if (event.data?.type === 'open-student-notices') setOpen(true)
      void refresh()
    }

    window.addEventListener('focus', focus)
    window.addEventListener('online', focus)
    navigator.serviceWorker?.addEventListener('message', received)

    navigator.serviceWorker?.getRegistration().then((r) =>
      r?.pushManager?.getSubscription().then(async (sub) => {
        if (sub) {
          const status = await noticeApi(token, 'status', { endpoint: sub.endpoint })
          if (alive) setEnabled(status.enabled)
        }
      })
    ).catch(() => {})

    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', focus)
      window.removeEventListener('online', focus)
      navigator.serviceWorker?.removeEventListener('message', received)
    }
  }, [token])

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  async function togglePush() {
    setBusy(true)
    setMessage('')
    try {
      if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
        throw new Error('Thiết bị chưa hỗ trợ thông báo đẩy. Trên iPhone, hãy thêm app vào Màn hình chính bằng Safari.')
      }
      if (!enabled) {
        if (!key) throw new Error('Hệ thống thông báo đang khởi động, em thử lại sau giây lát.')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Chưa được cấp quyền thông báo. Em có thể bật lại trong Cài đặt trình duyệt.')
        }
      }
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('App chưa sẵn sàng. Em thử tải lại trang.')), 10000)
        ),
      ])
      let sub = await registration.pushManager.getSubscription()
      if (enabled && sub) {
        await noticeApi(token, 'unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
        setEnabled(false)
        setMessage('Đã tắt thông báo đẩy.')
        return
      }
      const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'))
      const bytes = Uint8Array.from(raw, (x) => x.charCodeAt(0))
      sub = sub || (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes }))
      await noticeApi(token, 'subscribe', { subscription: sub.toJSON() })
      setEnabled(true)
      setMessage('Đã bật thông báo đẩy thành công.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Chưa cập nhật được thông báo đẩy.')
    } finally {
      setBusy(false)
    }
  }

  async function danhDauDocTatCa() {
    const chuaDoc = items.filter((x) => !x.read_at)
    if (chuaDoc.length === 0) return
    setItems((v) => v.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })))
    await Promise.all(
      chuaDoc.map((n) => noticeApi(token, 'read', { id: n.id }).catch(() => {}))
    )
  }

  const count = items.filter((x) => !x.read_at).length

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Thông báo, ${count} chưa đọc`}
        aria-expanded={open}
        className="tap-target relative rounded-full p-2 transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
        style={{ background: 'var(--gg-xanh-nen)', color: 'var(--gg-xanh)' }}
        title="Thông báo của em"
      >
        <Bell size={20} className={count > 0 ? 'animate-wiggle' : ''} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs"
            style={{ background: 'var(--do)' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Backdrop mờ khi mở menu */}
      {open && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-900/25 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel Sổ Xuống Phong Cách Google Notification Shade / Material You */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Thông báo của em"
          className="fixed inset-x-3 top-16 max-h-[82vh] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[410px] sm:max-h-[80vh] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col z-[10001] animate-in fade-in slide-in-from-top-3 duration-200 overflow-hidden"
        >
          {/* Header Panel */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-xs"
                style={{ background: 'var(--gg-xanh-nen)', color: 'var(--gg-xanh)' }}
              >
                <Bell size={18} />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Thông báo
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {count > 0 ? `${count} tin chưa đọc` : 'Không có tin mới'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => void danhDauDocTatCa()}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Đã đọc</span>
                </button>
              )}
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Thanh Bật/Tắt Thông Báo Đẩy Dạng Google Pill */}
          <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
              Nhận thông báo khi đóng app
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void togglePush()}
              className={`px-3 py-1 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                enabled
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
              } disabled:opacity-50`}
            >
              {busy ? 'Đang xử lý…' : enabled ? '✓ Đang bật' : 'Bật ngay'}
            </button>
          </div>

          {/* Thông điệp trạng thái Push */}
          {message && (
            <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              {message}
            </div>
          )}

          {/* Danh Sách Thông Báo Sổ Xuống */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5 max-h-[55vh]">
            {loadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs text-center">
                {loadError}
              </div>
            )}

            {!loaded && !loadError && (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang đồng bộ thông báo...</span>
              </div>
            )}

            {loaded && items.length === 0 && (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                  <BellOff size={26} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  Chưa có thông báo nào
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                  Bài tập Thầy giao và bài luyện từ Phụ huynh sẽ hiển thị ngay tại đây.
                </p>
              </div>
            )}

            {items.map((n) => {
              const isUnread = !n.read_at
              const isBtvn = n.target === 'btvn'
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    void noticeApi(token, 'read', { id: n.id })
                      .then(() =>
                        setItems((v) =>
                          v.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                        )
                      )
                      .catch(() => {})
                    onOpen(n.target, n.id)
                    setOpen(false)
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-150 flex items-start gap-3 cursor-pointer group ${
                    isUnread
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-700'
                      : 'bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {/* Icon phân loại thông báo */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isBtvn
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {isBtvn ? <BookOpen size={18} /> : <Sparkles size={18} />}
                  </div>

                  {/* Nội dung thông báo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: 'var(--gg-xanh)' }}
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-black text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 font-medium">
                        {dinhDangThoiGian(n.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed break-words">
                      {n.body}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                      <span>Mở làm bài</span>
                      <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
