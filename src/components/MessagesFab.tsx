// BONG BÓNG NỔI — luôn hiện ở góc màn hình của THẦY, kéo thả được đến vị trí
// tuỳ ý (tự nhớ lại lần sau), có số đỏ báo tin nhắn CHƯA ĐỌC từ phụ huynh/học
// sinh. Bấm vào mở popup, đóng lại thì thôi.
//
// TỪ 06/09 popup có HAI THẺ (TRO-LY-TRONG-APP.md):
//   · Trợ lý — thầy gõ câu hỏi tiếng Việt, máy tra đúng dữ liệu trong app rồi
//     trả lời bằng số thật. Không hiểu thì nói thẳng, KHÔNG đoán.
//   · Tin nhắn — đúng hộp thư cũ, không đổi một dòng nào.
// Hộp thư giữ nguyên vì nó là đường phụ huynh nhắn tới thầy; trợ lý là lối tra
// cứu, hai việc khác nhau, không gộp.
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, RefreshCw, Sparkles } from 'lucide-react'
import { listParentMessages, markMessagesRead, type ParentMessage } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'
import KhoiTroLy from './KhoiTroLy'

/** Tên thầy đặt cho trợ lý (thầy chốt 06/09). Một chỗ duy nhất — đổi tên thì
 * đổi ở đây, không đi sửa từng chỗ. */
export const TEN_TRO_LY = 'Trợ lý em yêu'

const POS_KEY = 'omr_msgfab_pos_v1'
const POLL_MS = 20000
const SIZE = 52

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === 'number' && typeof p.y === 'number') return p
    }
  } catch {
    // localStorage có thể bị chặn (chế độ ẩn danh) — dùng vị trí mặc định.
  }
  return { x: typeof window !== 'undefined' ? window.innerWidth - SIZE - 16 : 300, y: typeof window !== 'undefined' ? window.innerHeight - SIZE - vungDuoi() : 400 }
}

// Vùng phía dưới KHÔNG được đè lên: thanh Lớp/Kiểm tra/Phụ huynh (72px) +
// vùng an toàn của máy (env(safe-area-inset-bottom)) — MANCUAVAOVANENTOI.md mục 5.
function vungDuoi(): number {
  if (typeof window === 'undefined') return 72
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  const safe = probe.getBoundingClientRect().height || 0
  probe.remove()
  return 72 + safe
}

function clampPos(p: { x: number; y: number }): { x: number; y: number } {
  const maxX = window.innerWidth - SIZE - 4
  const maxY = window.innerHeight - SIZE - vungDuoi()
  return { x: Math.min(Math.max(p.x, 4), Math.max(4, maxX)), y: Math.min(Math.max(p.y, 4), Math.max(4, maxY)) }
}

export default function MessagesFab() {
  const showToast = useAppStore((s) => s.showToast)
  const [scriptUrl, setScriptUrl] = useState('')
  // Mã bí mật giữ trong ref: hộp thư tự hỏi lại theo interval, dùng ref để
  // không phải dựng lại interval mỗi lần state đổi.
  const secretRef = useRef('')
  // Trợ lý cần mã bí mật như một prop nên phải có bản trong state; ref vẫn giữ
  // cho vòng hỏi hộp thư chạy nền.
  const [secretHt, setSecretHt] = useState('')
  const setSecret = (v: string) => {
    secretRef.current = v
    setSecretHt(v || '')
  }
  /** Thẻ đang xem trong popup. Mở ra là vào Trợ lý — đó là việc thầy dùng
   * nhiều hơn; hộp thư đã có số đỏ báo khi có tin. */
  const [the, setThe] = useState<'troly' | 'thu'>('troly')
  const [pos, setPos] = useState(() => (typeof window !== 'undefined' ? clampPos(loadPos()) : loadPos()))
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ParentMessage[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
  /** Mốc lần kéo gần nhất — để cú `click` sinh ra khi thả tay không mở popup. */
  const vuaKeoRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadTeacherSecret().then(setSecret)
  }, [])

  const pollUnread = async (url: string) => {
    try {
      const rows = await listParentMessages(url.trim(), secretRef.current.trim())
      setUnread(rows.filter((r) => !r.daDoc).length)
    } catch {
      // Poll nền — lỗi thì bỏ qua, lần sau tự thử lại.
    }
  }

  useEffect(() => {
    if (!scriptUrl.trim()) return
    pollUnread(scriptUrl)
    const t = setInterval(() => pollUnread(scriptUrl), POLL_MS)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptUrl])

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const load = async (url: string) => {
    setLoading(true)
    try {
      const rows = await listParentMessages(url.trim(), secretRef.current.trim())
      setItems(rows)
      const unreadIds = rows.filter((r) => !r.daDoc).map((r) => r.id)
      setUnread(0)
      if (unreadIds.length > 0) {
        markMessagesRead(url.trim(), unreadIds).catch(() => {})
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tải được tin nhắn', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false }
    btnRef.current?.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true
    if (d.moved) setPos(clampPos({ x: d.origX + dx, y: d.origY + dy }))
  }
  // KẾT THÚC CHẠM — dùng cho cả `pointerup` LẪN `pointercancel`.
  //
  // LỖI ĐÃ DÍNH (thầy báo 06/09): phải GIỮ bong bóng một lúc mới bật lên, chạm
  // nhanh thì không ăn. Vì việc mở popup nằm trong `pointerup`, mà chạm nhanh
  // trên Android hay bị trình duyệt huỷ thành `pointercancel` — `pointerup`
  // không bao giờ chạy, nên chỉ giữ lâu (không còn bị coi là cử chỉ cuộn) mới
  // mở được. Nay việc MỞ chuyển hẳn sang `onClick` (chạm nhanh luôn có), còn
  // hai sự kiện này chỉ lo chuyện kéo.
  const ketThucCham = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d?.moved) return
    // Vừa kéo xong: nhớ vị trí, và chặn cú `click` đi ngay sau đó kẻo thả tay
    // là popup bật lên.
    vuaKeoRef.current = Date.now()
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos))
    } catch {
      // bỏ qua nếu không lưu được — chỉ mất vị trí nhớ, không ảnh hưởng chức năng.
    }
  }

  /** Mở popup. Gắn vào `onClick` nên chạm nhanh là ăn ngay. */
  const moPopup = () => {
    // Kéo xong thả tay cũng sinh ra một cú click — bỏ qua nó.
    if (Date.now() - vuaKeoRef.current < 300) return
    // Mở ở thẻ Trợ lý. KHÔNG tải hộp thư ngay: mở bong bóng để hỏi một câu mà
    // kéo luôn cả hộp thư là gọi thừa một lệnh. Sang thẻ Tin nhắn mới tải.
    setThe('troly')
    setOpen(true)
  }

  // Popup là 1 thẻ nổi NEO NGAY CẠNH icon (không phải bottom-sheet phủ hết
  // chiều ngang màn hình) — mặc định bung lên PHÍA TRÊN icon vì icon
  // thường để ở góc dưới màn hình; tự lật xuống dưới nếu icon đang ở gần
  // đỉnh màn hình (không đủ chỗ bung lên trên), và luôn tự kẹp trong màn
  // hình theo chiều ngang để không tràn ra ngoài.
  const GAP = 10
  // Ô nhắn cần chỗ cho vài dòng hội thoại + ô gõ; thấp hơn ngần này là dẹp lép,
  // gõ xong không thấy câu trả lời.
  const CAO_TOI_THIEU = 260
  const popupWidth = Math.min(340, window.innerWidth - 24)
  const spaceAbove = pos.y
  const spaceBelow = window.innerHeight - (pos.y + SIZE)
  const openAbove = spaceAbove >= 260 || spaceAbove >= spaceBelow
  const left = Math.min(Math.max(pos.x + SIZE / 2 - popupWidth / 2, 8), window.innerWidth - popupWidth - 8)
  const popupStyle: React.CSSProperties = openAbove
    ? {
        left,
        bottom: window.innerHeight - pos.y + GAP,
        width: popupWidth,
        maxHeight: Math.max(CAO_TOI_THIEU, spaceAbove - GAP - 8),
        height: the === 'troly' ? Math.max(CAO_TOI_THIEU, Math.min(420, spaceAbove - GAP - 8)) : undefined,
      }
    : {
        left,
        top: pos.y + SIZE + GAP,
        width: popupWidth,
        maxHeight: Math.max(CAO_TOI_THIEU, spaceBelow - GAP - 8),
        height: the === 'troly' ? Math.max(CAO_TOI_THIEU, Math.min(420, spaceBelow - GAP - 8)) : undefined,
      }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={ketThucCham}
        onPointerCancel={ketThucCham}
        onLostPointerCapture={ketThucCham}
        onClick={moPopup}
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, touchAction: 'none' }}
        className="fixed z-40 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center active:scale-95 transition-transform"
        title={`${TEN_TRO_LY} — kéo để di chuyển, bấm để mở`}
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 dark:border-slate-950">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div
            style={popupStyle}
            className="fixed rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MỘT HÀNG: tên của thẻ đang xem + nút đổi thẻ + nút đóng. Hai
                thẻ đặt cạnh nhau thì "Trợ lý em yêu" dài quá, ở khổ 360px là
                chữ bị cắt. Tên hiện đủ, thẻ kia thu về một nút biểu tượng. */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2 font-bold min-w-0">
                {the === 'troly' ? <Sparkles className="text-indigo-600 shrink-0" size={20} /> : <MessageCircle className="text-indigo-600 shrink-0" size={20} />}
                <span className="truncate">{the === 'troly' ? TEN_TRO_LY : 'Tin nhắn phụ huynh & học sinh'}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {the === 'troly' ? (
                  <button
                    onClick={() => {
                      setThe('thu')
                      if (scriptUrl.trim() && !items) void load(scriptUrl)
                    }}
                    aria-label="Mở hộp thư"
                    title="Tin nhắn phụ huynh & học sinh"
                    className="tap-target relative w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <MessageCircle size={18} />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setThe('troly')}
                      aria-label={`Mở ${TEN_TRO_LY}`}
                      title={TEN_TRO_LY}
                      className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Sparkles size={18} />
                    </button>
                    {scriptUrl.trim() && (
                      <button
                        onClick={() => load(scriptUrl)}
                        aria-label="Tải lại tin nhắn"
                        className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {the === 'troly' && <KhoiTroLy scriptUrl={scriptUrl} secret={secretHt} />}

            {the === 'thu' && (
            <div className="overflow-y-auto px-4 py-3 space-y-3">
              {!scriptUrl.trim() && (
                <div className="text-sm text-slate-500">Chưa có link Apps Script — vào màn Soạn đề để cấu hình trước.</div>
              )}
              {scriptUrl.trim() && loading && <div className="text-sm text-slate-500">Đang tải…</div>}
              {scriptUrl.trim() && !loading && items && items.length === 0 && (
                <div className="text-sm text-slate-500">Chưa có tin nhắn nào.</div>
              )}
              {items?.map((m) => (
                <div key={m.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          m.nguoiGui === 'hocsinh'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}
                      >
                        {m.nguoiGui === 'hocsinh' ? 'Học sinh' : 'Phụ huynh'}
                      </span>
                      <span className="truncate">
                        {m.nguoiGui === 'hocsinh'
                          ? m.hoTenHocSinh || '?'
                          : `${m.hoTenPhuHuynh || 'Phụ huynh'} (${m.sdt}) — con: ${m.hoTenHocSinh || '?'}`}
                        {m.lop ? ` — lớp ${m.lop}` : ''} {m.sbd ? ` — SBD ${m.sbd}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0">{new Date(m.thoiGian).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.noiDung}</div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
