// Biểu tượng tin nhắn nổi (FAB) — luôn hiện ở góc màn hình của THẦY, kéo thả
// được đến vị trí tuỳ ý (tự nhớ lại lần sau), có số đỏ báo tin nhắn CHƯA ĐỌC
// từ phụ huynh/học sinh. Bấm vào mở popup gọn xem toàn bộ, đóng lại thì thôi
// — không còn là 1 dòng trong menu Kiểm tra tại lớp nữa.
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, RefreshCw } from 'lucide-react'
import { listParentMessages, markMessagesRead, type ParentMessage } from '../lib/exam-api'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

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
  const setSecret = (v: string) => {
    secretRef.current = v
  }
  const [pos, setPos] = useState(() => (typeof window !== 'undefined' ? clampPos(loadPos()) : loadPos()))
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ParentMessage[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
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
  const handlePointerUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (d?.moved) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(pos))
      } catch {
        // bỏ qua nếu không lưu được — chỉ mất vị trí nhớ, không ảnh hưởng chức năng.
      }
    } else {
      // Không kéo (chỉ bấm) -> mở popup.
      setOpen(true)
      if (scriptUrl.trim()) load(scriptUrl)
    }
  }

  // Popup là 1 thẻ nổi NEO NGAY CẠNH icon (không phải bottom-sheet phủ hết
  // chiều ngang màn hình) — mặc định bung lên PHÍA TRÊN icon vì icon
  // thường để ở góc dưới màn hình; tự lật xuống dưới nếu icon đang ở gần
  // đỉnh màn hình (không đủ chỗ bung lên trên), và luôn tự kẹp trong màn
  // hình theo chiều ngang để không tràn ra ngoài.
  const GAP = 10
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
        maxHeight: Math.max(200, spaceAbove - GAP - 8),
      }
    : {
        left,
        top: pos.y + SIZE + GAP,
        width: popupWidth,
        maxHeight: Math.max(200, spaceBelow - GAP - 8),
      }

  return (
    <>
      <button
        ref={btnRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, touchAction: 'none' }}
        className="fixed z-40 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center active:scale-95 transition-transform"
        title="Tin nhắn phụ huynh & học sinh — kéo để di chuyển, bấm để mở"
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold">
                <MessageCircle className="text-indigo-600" size={20} />
                Tin nhắn phụ huynh &amp; học sinh
              </div>
              <div className="flex items-center gap-1">
                {scriptUrl.trim() && (
                  <button
                    onClick={() => load(scriptUrl)}
                    className="tap-target w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="tap-target w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

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
          </div>
        </div>
      )}
    </>
  )
}
