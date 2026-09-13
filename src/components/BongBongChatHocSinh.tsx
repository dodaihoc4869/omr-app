import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Image as ImageIcon, Paperclip, Sparkles, Loader2 } from 'lucide-react'
import { giaiBaiTapAI } from '../lib/tro-ly/ai-giai-bai'
import { sendStudentMessage } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'

interface TinNhanHocSinh {
  id: string
  nguoiGui: 'em' | 'ai' | 'thay'
  noiDung: string
  html?: string
  anhUrl?: string
  tenTep?: string
  thoiGian: string
}

interface BongBongChatHocSinhProps {
  sbd?: string
  hoTen?: string
  lop?: string
  maCa?: string
  className?: string
}

const POS_KEY = 'omr_chat_hs_pos_v1'
const SIZE = 52

function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === 'number' && typeof p.y === 'number') return p
    }
  } catch {
    // fallback
  }
  return {
    x: typeof window !== 'undefined' ? window.innerWidth - SIZE - 16 : 300,
    y: typeof window !== 'undefined' ? window.innerHeight - SIZE - 80 : 500,
  }
}

export default function BongBongChatHocSinh({
  sbd = '',
  hoTen = '',
  lop = '',
  maCa = '',
  className = '',
}: BongBongChatHocSinhProps) {
  const [open, setOpen] = useState(false)
  const [tin, setTin] = useState('')
  const [anhDinhKem, setAnhDinhKem] = useState<string | null>(null)
  const [tenTep, setTenTep] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const [scriptUrl, setScriptUrl] = useState('')
  const [pos] = useState(loadPos)

  const [danhSachTin, setDanhSachTin] = useState<TinNhanHocSinh[]>([
    {
      id: 'chao-mung',
      nguoiGui: 'ai',
      noiDung: 'Chào em! Anh là Trợ lý Em Yêu AI. Em vướng bài tập nào cứ gõ câu hỏi hoặc chụp ảnh gửi anh giải chi tiết nhé!',
      thoiGian: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const tepInputRef = useRef<HTMLInputElement>(null)
  const cuoiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
  }, [])

  useEffect(() => {
    if (open) {
      cuoiRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, danhSachTin])

  const xuLyChonAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setAnhDinhKem(reader.result as string)
      setTenTep(f.name)
    }
    reader.readAsDataURL(f)
  }

  const xuLyChonTep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setTenTep(f.name)
    const reader = new FileReader()
    reader.onload = () => {
      // Nếu là ảnh thì lưu data url, nếu là file khác thì lưu tên
      if (f.type.startsWith('image/')) {
        setAnhDinhKem(reader.result as string)
      }
    }
    reader.readAsDataURL(f)
  }

  const guiCauHoi = async () => {
    const noiDung = tin.trim()
    if ((!noiDung && !anhDinhKem && !tenTep) || dangGui) return

    const idTin = String(Date.now())
    const thoiGian = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const tinMoi: TinNhanHocSinh = {
      id: idTin,
      nguoiGui: 'em',
      noiDung: noiDung || (anhDinhKem ? 'Gửi ảnh bài tập' : 'Gửi tệp đính kèm'),
      anhUrl: anhDinhKem || undefined,
      tenTep: tenTep || undefined,
      thoiGian,
    }

    setDanhSachTin((prev) => [...prev, tinMoi])
    setTin('')
    const anhDaChon = anhDinhKem
    const tepDaChon = tenTep
    setAnhDinhKem(null)
    setTenTep(null)
    setDangGui(true)

    try {
      // 1. Tự động chuyển đến Trợ lý Em Yêu AI để giải bài tập chi tiết theo chuẩn HTML
      const ketQuaGiai = await giaiBaiTapAI({
        noiDung: noiDung || 'Đề bài trong ảnh/tệp đính kèm',
        anhDinhKem: anhDaChon || undefined,
        tenTep: tepDaChon || undefined,
        sbd,
        hoTen,
      })

      const tinAi: TinNhanHocSinh = {
        id: `ai-${Date.now()}`,
        nguoiGui: 'ai',
        noiDung: `${ketQuaGiai.tieuDe}\n${ketQuaGiai.phuongPhap}\n\n${ketQuaGiai.loiGiaiChiTiet}`,
        html: ketQuaGiai.htmlToanBo,
        thoiGian: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }

      setDanhSachTin((prev) => [...prev, tinAi])

      // 2. Gửi đồng thời đến máy chủ để Thầy cũng nhận được trong hộp thư / màn hỏi bài
      if (scriptUrl.trim() && sbd.trim()) {
        try {
          const caStr = maCa ? ` - Ca ${maCa}` : ''
          const noiDungGuiThay = `[Hỏi bài A.I${caStr}] ${noiDung} ${tepDaChon ? `(Kèm tệp: ${tepDaChon})` : ''}`
          await sendStudentMessage(scriptUrl.trim(), sbd, hoTen || 'Học sinh', lop, noiDungGuiThay)
        } catch {
          // Lỗi mạng không ảnh hưởng câu trả lời A.I đã tạo
        }
      }
    } catch {
      setDanhSachTin((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          nguoiGui: 'ai',
          noiDung: 'Anh chưa phân tích được câu này, em thử chụp lại rõ hơn hoặc gõ nội dung bài toán nhé!',
          thoiGian: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setDangGui(false)
    }
  }

  return (
    <aside aria-label="Bong bóng hỏi bài" className={className}>
      {/* NÚT BONG BÓNG NỔI */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed z-40 rounded-full shadow-lg flex items-center justify-center tap-target transition-transform active:scale-95"
        style={{
          left: pos.x,
          top: pos.y,
          width: SIZE,
          height: SIZE,
          background: 'var(--gg-luc)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
        title="Hỏi bài Trợ lý Em Yêu"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle size={26} />
          <span
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white"
            style={{ background: 'var(--gg-vang)' }}
          />
        </div>
      </button>

      {/* CỬA SỔ CHAT POPUP */}
      {open && (
        <div
          className="fixed z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          style={{
            bottom: Math.max(16, window.innerHeight - pos.y + 10),
            right: Math.max(16, window.innerWidth - pos.x - SIZE),
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(540px, calc(100vh - 120px))',
            background: 'var(--the)',
          }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: 'var(--gg-luc)',
              color: 'white',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Trợ lý Em Yêu
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded font-bold">
                    AI GIẢI BÀI
                  </span>
                </div>
                <div className="text-[11px] opacity-85 leading-tight mt-0.5">
                  Hỏi bài tập, đính kèm ảnh & lời giải chuẩn
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

          {/* MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: 'var(--nen)' }}>
            {danhSachTin.map((m) => {
              const laEm = m.nguoiGui === 'em'
              return (
                <div key={m.id} className={`flex flex-col ${laEm ? 'items-end' : 'items-start'}`}>
                  <div
                    className="max-w-[88%] rounded-2xl p-3 text-sm"
                    style={{
                      background: laEm ? 'var(--gg-luc)' : 'var(--the)',
                      color: laEm ? 'white' : 'var(--muc)',
                      boxShadow: 'var(--bong-1)',
                      border: laEm ? 'none' : '1px solid var(--vien)',
                    }}
                  >
                    {/* Ảnh đính kèm nếu có */}
                    {m.anhUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden max-h-48 border border-white/20">
                        <img src={m.anhUrl} alt="Đề bài" className="w-full object-cover" />
                      </div>
                    )}
                    {/* Tên tệp đính kèm nếu có */}
                    {m.tenTep && !m.anhUrl && (
                      <div className="mb-1.5 text-xs font-semibold flex items-center gap-1 opacity-90">
                        <Paperclip size={13} /> {m.tenTep}
                      </div>
                    )}

                    {/* Lời giải HTML nếu có */}
                    {m.html ? (
                      <div dangerouslySetInnerHTML={{ __html: m.html }} />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{m.noiDung}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{m.thoiGian}</span>
                </div>
              )
            })}

            {dangGui && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                Trợ lý Em Yêu đang phân tích và soạn lời giải chuẩn HTML…
              </div>
            )}
            <div ref={cuoiRef} />
          </div>

          {/* PREVIEW ẢNH / TỆP ĐANG CHỌN */}
          {(anhDinhKem || tenTep) && (
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                {anhDinhKem ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                <span className="truncate">{tenTep || 'Ảnh đính kèm'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAnhDinhKem(null)
                  setTenTep(null)
                }}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5">
            {/* Ẩn input file thực tế */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={xuLyChonAnh}
            />
            <input
              ref={tepInputRef}
              type="file"
              className="hidden"
              onChange={xuLyChonTep}
            />

            {/* Nút đính kèm ảnh */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition tap-target"
              title="Chụp hoặc chọn ảnh đề bài"
            >
              <ImageIcon size={18} />
            </button>

            {/* Nút đính kèm tệp */}
            <button
              type="button"
              onClick={() => tepInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition tap-target"
              title="Đính kèm tệp bài tập"
            >
              <Paperclip size={18} />
            </button>

            {/* Ô nhập văn bản */}
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void guiCauHoi()
                }
              }}
              placeholder="Hỏi bài hoặc dán đề tại đây…"
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            {/* Nút gửi */}
            <button
              type="button"
              onClick={guiCauHoi}
              disabled={(!tin.trim() && !anhDinhKem && !tenTep) || dangGui}
              className="p-2 rounded-full bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 transition tap-target"
              title="Gửi câu hỏi"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
