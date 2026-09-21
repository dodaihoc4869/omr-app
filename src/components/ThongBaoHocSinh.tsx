import { useEffect, useState, useRef } from 'react'
import { Bell, BellOff, X, BookOpen, Sparkles, CheckCheck, ChevronRight, Check } from 'lucide-react'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { NutTron } from './m3'
import { batNhipBenVung } from '../lib/nhip-ben-vung'
import './m3/thong-bao-hoc-sinh.css'

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

    const refresh = async (): Promise<boolean> => {
      if (document.hidden || pending) return true
      pending = true
      let ok = true
      try {
        const d = await noticeApi(token, 'list')
        if (alive) {
          setItems(d.items || [])
          setKey(d.publicKey || '')
          setLoaded(true)
          setLoadError('')
        }
      } catch {
        ok = false
        if (alive) setLoadError('Chưa tải được thông báo. App sẽ tự thử lại khi có mạng.')
      } finally {
        pending = false
      }
      return ok
    }

    // Nhịp nền CHẬM (180 s ± 30 s, không gọi chồng, lỗi ⇒ lùi 30 → 60 → 120 s; sự cố D1 21/09: vòng 15 giây × mọi máy em). Quay lại tab / có mạng / tin từ dịch vụ nền vẫn nạp nhưng chặn dội ≥ 20 giây.
    const nhip = batNhipBenVung(refresh)
    const focus = () => nhip.kich()
    const received = (event: MessageEvent) => {
      if (event.data?.type === 'open-student-notices') setOpen(true)
      nhip.kich()
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
      nhip.dung()
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
  const demHienThi = count > 99 ? '99+' : String(count)

  return (
    <div className="m3 m3-tb" ref={panelRef}>
      {/* Nút chuông thông báo */}
      <NutTron
        nhan={`Thông báo, ${demHienThi} chưa đọc`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Thông báo của em"
        className="m3-tb-chuong"
      >
        <Bell size={22} aria-hidden="true" />
        {count > 0 && <span className="m3-tb-dem">{demHienThi}</span>}
      </NutTron>

      {/* Màn che mờ khi mở tấm thông báo */}
      {open && <div className="m3-man-che m3-tb-che" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Tấm thông báo: bo 28, cao độ 3, không viền */}
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Thông báo của em" className="m3-hop m3-tb-tam">
          <div className="m3-tb-dau">
            <div className="m3-tb-dau-chu">
              <h2 className="m3-tb-tieu-de">Thông báo</h2>
              <span className="m3-tb-phu">{count > 0 ? `${count} tin chưa đọc` : 'Không có tin mới'}</span>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => void danhDauDocTatCa()}
                className="m3-nut-chu"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={18} aria-hidden="true" />
                <span>Đã đọc</span>
              </button>
            )}
            <NutTron nhan="Đóng thông báo" onClick={() => setOpen(false)}>
              <X size={22} aria-hidden="true" />
            </NutTron>
          </div>

          {/* Bật/tắt thông báo đẩy */}
          <div className="m3-tb-day">
            <span className="m3-tb-day-chu">Nhận thông báo khi đóng app</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void togglePush()}
              className={enabled ? 'm3-nut-tonal' : 'm3-nut-chinh'}
              data-vai-tro={enabled ? 'tertiary' : undefined}
            >
              {busy ? (
                'Đang xử lý…'
              ) : enabled ? (
                <>
                  <Check size={18} aria-hidden="true" />
                  <span>Đang bật</span>
                </>
              ) : (
                'Bật ngay'
              )}
            </button>
          </div>

          {/* Kết quả bật/tắt thông báo đẩy */}
          {message && (
            <div role="status" className="m3-tb-tin" data-vai-tro="secondary">
              {message}
            </div>
          )}

          {/* Danh sách thông báo */}
          <div className="m3-tb-ds">
            {loadError && (
              <div role="alert" className="m3-tb-tin" data-vai-tro="error">
                {loadError}
              </div>
            )}

            {!loaded && !loadError && (
              <div role="status" className="m3-tb-cho">
                <div className="m3-xuong" />
                <div className="m3-xuong" />
                <span>Đang đồng bộ thông báo...</span>
              </div>
            )}

            {loaded && items.length === 0 && (
              <div className="m3-tb-trong">
                <div className="m3-tb-trong-o">
                  <BellOff size={26} aria-hidden="true" />
                </div>
                <h3>Chưa có thông báo nào</h3>
                <p>Bài tập Thầy giao và bài luyện từ Phụ huynh sẽ hiển thị ngay tại đây.</p>
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
                  className={`m3-the m3-tb-muc ${isUnread ? '' : 'm3-the--nhat'}`.trim()}
                  data-vai-tro={isUnread ? 'primary' : undefined}
                  data-loai={isBtvn ? 'btvn' : 'mom'}
                >
                  {/* Biểu tượng phân loại */}
                  <div className="m3-the-o m3-tb-loai">
                    {isBtvn ? <BookOpen size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
                  </div>

                  {/* Nội dung */}
                  <div className="m3-tb-noi-dung">
                    <div className="m3-tb-hang">
                      <span className={`m3-tb-ten ${isUnread ? 'm3-tb-ten--moi' : ''}`.trim()}>
                        {isUnread && <span className="m3-tb-cham" aria-hidden="true" />}
                        <span className="m3-tb-ten-chu">{n.title}</span>
                      </span>
                      <span className="m3-tb-gio">{dinhDangThoiGian(n.created_at)}</span>
                    </div>
                    <p className="m3-tb-than">{n.body}</p>
                    <span className="m3-tb-mo">
                      <span>Mở làm bài</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </span>
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
