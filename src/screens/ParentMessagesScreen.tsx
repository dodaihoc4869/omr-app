// Màn Thầy xem tin nhắn phụ huynh gửi trực tiếp qua app (một chiều: phụ huynh
// nhắn, thầy đọc trong app — trả lời thì thầy tự gọi điện/Zalo, app không làm
// hộp thoại 2 chiều để tránh phình phạm vi ngoài yêu cầu).
import { useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react'
import { listParentMessages, markMessagesRead, type ParentMessage } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

export default function ParentMessagesScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const [scriptUrl, setScriptUrl] = useState('')
  const [items, setItems] = useState<ParentMessage[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScriptUrl().then((url) => {
      setScriptUrl(url)
      if (url.trim()) load(url)
      else setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async (url: string) => {
    setLoading(true)
    try {
      const rows = await listParentMessages(url.trim())
      setItems(rows)
      const unread = rows.filter((r) => !r.daDoc).map((r) => r.id)
      if (unread.length > 0) {
        markMessagesRead(url.trim(), unread).catch(() => {
          // Đánh dấu đã đọc không phải luồng chính — lỗi thì bỏ qua, lần sau tải lại vẫn thấy tin nhắn.
        })
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tải được tin nhắn', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setScreen('examhub')} className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-slate-500">
            <ArrowLeft size={18} />
          </button>
          <MessageCircle className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold">Tin nhắn phụ huynh</h1>
        </div>
        {scriptUrl.trim() && (
          <button
            onClick={() => load(scriptUrl)}
            className="tap-target w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!scriptUrl.trim() && (
        <div className="text-sm text-slate-500">Chưa có link Apps Script — vào màn Soạn đề để cấu hình trước.</div>
      )}

      {scriptUrl.trim() && loading && <div className="text-sm text-slate-500">Đang tải…</div>}

      {scriptUrl.trim() && !loading && items && items.length === 0 && (
        <div className="text-sm text-slate-500">Chưa có tin nhắn nào từ phụ huynh.</div>
      )}

      <div className="space-y-3">
        {items?.map((m) => (
          <div
            key={m.id}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {m.hoTenPhuHuynh || 'Phụ huynh'} ({m.sdt}) — con: {m.hoTenHocSinh || '?'} {m.lop ? `— lớp ${m.lop}` : ''}{' '}
                {m.sbd ? `— SBD ${m.sbd}` : ''}
              </span>
              <span>{new Date(m.thoiGian).toLocaleString('vi-VN')}</span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{m.noiDung}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
