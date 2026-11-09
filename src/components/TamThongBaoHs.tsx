// TẤM THÔNG BÁO của app học sinh — MẢNH NẠP SAU (09/11, luật tốc độ): chỉ tải khi em bấm chuông. Đường mở app chỉ còn nút chuông + nhịp đọc danh sách
// (ThongBaoHocSinh.tsx). Hỏi trạng thái thông báo đẩy của máy cũng dời vào đây (trước: mỗi lần mở app một lệnh `status`) ⇒ máy chủ bớt một lệnh mỗi lượt mở.
import { useEffect, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react'
import { BellOff, X, BookOpen, Sparkles, CheckCheck, ChevronRight, Check } from 'lucide-react'
import { NutTron } from './m3'
import { noticeApi, type Notice } from './ThongBaoHocSinh'

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

export default function TamThongBaoHs({ token, items, setItems, loaded, loadError, khoa, onOpen, dong }: {
  token: string
  items: Notice[]
  setItems: Dispatch<SetStateAction<Notice[]>>
  loaded: boolean
  loadError: string
  khoa: string
  onOpen: (tab: 'btvn' | 'mom', noticeId?: string) => void
  dong: () => void
}): ReactElement | null {
  const key = khoa
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  // Trạng thái thông báo đẩy của máy: hỏi khi mở tấm. Em bấm «Bật ngay» trước khi có trả lời mà máy đã đăng ký ⇒ chỉ gửi lại đăng ký cũ (vô hại).
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const r = await navigator.serviceWorker?.getRegistration()
        const sub = await r?.pushManager?.getSubscription()
        if (sub) {
          const status = await noticeApi(token, 'status', { endpoint: sub.endpoint })
          if (alive) setEnabled(!!status.enabled)
        }
      } catch { /* máy không hỗ trợ / mất mạng ⇒ coi như chưa bật */ }
    })()
    return () => { alive = false }
  }, [token])
  // Đóng khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dong])

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
    <>
      {/* Màn che mờ khi mở tấm thông báo */}
      <div className="m3-man-che m3-tb-che" onClick={dong} aria-hidden="true" />

      {/* Tấm thông báo: bo 28, cao độ 3, không viền */}
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
            <NutTron nhan="Đóng thông báo" onClick={dong}>
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
                <span>Đang đồng bộ thông báo…</span>
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
                    dong()
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
    </>
  )
}
