import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, User } from 'lucide-react'
import { sendStudentMessage } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'

interface TinNhanPhuHuynh {
  id: string
  nguoiGui: 'ph' | 'thay'
  noiDung: string
  thoiGian: string
}

interface BongBongChatPhuHuynhProps {
  sbd: string
  hoTenHocSinh: string
  lop?: string
  className?: string
}

const SIZE = 52

export default function BongBongChatPhuHuynh({
  sbd,
  hoTenHocSinh,
  lop = '',
  className = '',
}: BongBongChatPhuHuynhProps) {
  const [open, setOpen] = useState(false)
  const [tin, setTin] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [scriptUrl, setScriptUrl] = useState('')
  const cuoiRef = useRef<HTMLDivElement>(null)

  const [danhSachTin, setDanhSachTin] = useState<TinNhanPhuHuynh[]>([
    {
      id: 'chao-ph',
      nguoiGui: 'thay',
      noiDung: `Kính chào Quý Phụ huynh của em ${hoTenHocSinh || sbd}! Thầy luôn sẵn sàng lắng nghe và trao đổi về tình hình học tập của con.`,
      thoiGian: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
  }, [])

  useEffect(() => {
    if (open) {
      cuoiRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, danhSachTin])

  const guiTin = async () => {
    const text = tin.trim()
    if (!text || dangGui) return

    const thoiGian = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const tinMoi: TinNhanPhuHuynh = {
      id: String(Date.now()),
      nguoiGui: 'ph',
      noiDung: text,
      thoiGian,
    }

    setDanhSachTin((prev) => [...prev, tinMoi])
    setTin('')
    setDangGui(true)

    try {
      if (scriptUrl.trim() && sbd.trim()) {
        await sendStudentMessage(scriptUrl.trim(), sbd, `[Phụ huynh ${hoTenHocSinh || sbd}]`, lop || '', text)
      }
    } catch {
      // lỗi mạng
    } finally {
      setDangGui(false)
    }
  }

  return (
    <aside aria-label="Bong bóng chat phụ huynh" className={className}>
      {/* NÚT BONG BÓNG */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg flex items-center justify-center tap-target transition-transform active:scale-95 cursor-pointer"
        style={{
          width: SIZE,
          height: SIZE,
          background: 'var(--gg-xanh)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
        title="Nhắn tin với Thầy Đỗ Đại Học"
      >
        <MessageCircle size={26} />
      </button>

      {/* POPUP CHAT */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          style={{
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(500px, calc(100vh - 140px))',
            background: 'var(--the)',
          }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: 'var(--gg-xanh)',
              color: 'white',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <User size={18} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Trao đổi với Thầy</div>
                <div className="text-[11px] opacity-85 leading-tight mt-0.5">
                  Phụ huynh em: {hoTenHocSinh || sbd}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition tap-target"
            >
              <X size={18} />
            </button>
          </div>

          {/* TIN NHẮN */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: 'var(--nen)' }}>
            {danhSachTin.map((m) => {
              const laPh = m.nguoiGui === 'ph'
              return (
                <div key={m.id} className={`flex flex-col ${laPh ? 'items-end' : 'items-start'}`}>
                  <div
                    className="max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{
                      background: laPh ? 'var(--gg-xanh)' : 'var(--the)',
                      color: laPh ? 'white' : 'var(--muc)',
                      boxShadow: 'var(--bong-1)',
                      border: laPh ? 'none' : '1px solid var(--vien)',
                    }}
                  >
                    {m.noiDung}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.thoiGian}</span>
                </div>
              )
            })}
            <div ref={cuoiRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void guiTin()
                }
              }}
              placeholder="Nhắn tin cho Thầy…"
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={guiTin}
              disabled={!tin.trim() || dangGui}
              className="p-2 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition tap-target"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
