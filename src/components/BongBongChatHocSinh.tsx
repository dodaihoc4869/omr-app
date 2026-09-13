import { useEffect, useRef, useState } from 'react'
import {
  X,
  Send,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  Loader2,
  GraduationCap,
  Heart,
  Users,
  Search,
} from 'lucide-react'
import { giaiBaiTapAI } from '../lib/tro-ly/ai-giai-bai'
import { sendStudentMessage } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import {
  dangKyNhanTinNhan,
  guiTinNhan,
  layHoiThoai,
  danhDauDocHoiThoai,
  type TinNhanChat,
} from '../lib/tro-ly/he-thong-chat'

interface BongBongChatHocSinhProps {
  sbd?: string
  hoTen?: string
  lop?: string
  maCa?: string
  className?: string
}

const SIZE = 52
type TabType = 'ai' | 'thay' | 'phuhuynh' | 'banbe'

export default function BongBongChatHocSinh({
  sbd = '',
  hoTen = '',
  lop = '',
  maCa: _maCa = '',
  className = '',
}: BongBongChatHocSinhProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabType>('ai')
  const [tin, setTin] = useState('')
  const [anhDinhKem, setAnhDinhKem] = useState<string | null>(null)
  const [tenTep, setTenTep] = useState<string | null>(null)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [scriptUrl, setScriptUrl] = useState('')

  // SBD bạn bè để nhắn tin
  const [sbdBanBe, setSbdBanBe] = useState('')
  const [sbdBanDangChat, setSbdBanDangChat] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const tepInputRef = useRef<HTMLInputElement>(null)
  const cuoiRef = useRef<HTMLDivElement>(null)

  const sbdHocSinh = sbd.trim() || 'HocSinh'
  const tenHocSinh = hoTen.trim() || `Học sinh ${sbdHocSinh}`

  const nguoiDungHS = {
    vai: 'hs' as const,
    sbd: sbdHocSinh,
    hoTen: tenHocSinh,
    lop,
  }

  const doiPhuongThay = {
    vai: 'gv' as const,
    hoTen: 'Thầy Đỗ Đại Học',
  }

  const doiPhuongPH = {
    vai: 'ph' as const,
    sbd: sbdHocSinh,
    hoTen: `Phụ huynh của ${tenHocSinh}`,
    lop,
  }

  // Danh sách tin nhắn theo từng luồng
  const [tinAI, setTinAI] = useState<
    Array<{
      id: string
      nguoiGui: 'em' | 'ai'
      noiDung: string
      html?: string
      anhUrl?: string
      thoiGian: number
    }>
  >([
    {
      id: 'chao-gemini-ai',
      nguoiGui: 'ai',
      noiDung: `Chào ${tenHocSinh}! Anh là Trợ lý Em Yêu AI (sức mạnh Google Gemini). Em vướng câu Hoá học nào cứ gõ câu hỏi hoặc chụp ảnh gửi lên, anh giải cặn kẽ từng bước cho em nhé!`,
      thoiGian: Date.now(),
    },
  ])

  const [tinThay, setTinThay] = useState<TinNhanChat[]>([])
  const [tinPH, setTinPH] = useState<TinNhanChat[]>([])
  const [tinBanBe, setTinBanBe] = useState<TinNhanChat[]>([])

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
  }, [])

  const capNhatTinNhan = () => {
    setTinThay(layHoiThoai(nguoiDungHS, doiPhuongThay))
    setTinPH(layHoiThoai(nguoiDungHS, doiPhuongPH))
    if (sbdBanDangChat) {
      setTinBanBe(
        layHoiThoai(nguoiDungHS, {
          vai: 'hs',
          sbd: sbdBanDangChat,
          hoTen: `Bạn ${sbdBanDangChat}`,
        }),
      )
    }
  }

  useEffect(() => {
    capNhatTinNhan()
    const huy = dangKyNhanTinNhan(() => {
      capNhatTinNhan()
    })
    return () => huy()
  }, [sbdHocSinh, sbdBanDangChat])

  useEffect(() => {
    if (open) {
      if (tab === 'thay') danhDauDocHoiThoai(nguoiDungHS, doiPhuongThay)
      if (tab === 'phuhuynh') danhDauDocHoiThoai(nguoiDungHS, doiPhuongPH)
      if (tab === 'banbe' && sbdBanDangChat) {
        danhDauDocHoiThoai(nguoiDungHS, {
          vai: 'hs',
          sbd: sbdBanDangChat,
        })
      }
      cuoiRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, tab, tinAI, tinThay, tinPH, tinBanBe, sbdBanDangChat])

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
      if (f.type.startsWith('image/')) {
        setAnhDinhKem(reader.result as string)
      }
    }
    reader.readAsDataURL(f)
  }

  const guiTin = async () => {
    const text = tin.trim()
    if ((!text && !anhDinhKem) || dangXuLy) return

    setDangXuLy(true)

    try {
      if (tab === 'ai') {
        // Gửi câu hỏi cho Gemini AI
        const tinHocSinh = {
          id: `hs_${Date.now()}`,
          nguoiGui: 'em' as const,
          noiDung: text || (anhDinhKem ? '[Gửi kèm ảnh bài tập]' : ''),
          anhUrl: anhDinhKem || undefined,
          thoiGian: Date.now(),
        }
        setTinAI((prev) => [...prev, tinHocSinh])
        setTin('')
        const anhGuiDi = anhDinhKem
        setAnhDinhKem(null)
        setTenTep(null)

        // Gọi bộ giải bài tập AI Gemini
        const ketQua = await giaiBaiTapAI({
          noiDung: text,
          anhDinhKem: anhGuiDi || undefined,
          sbd: sbdHocSinh,
          hoTen: tenHocSinh,
        })

        const tinTraLoiAI = {
          id: `ai_${Date.now()}`,
          nguoiGui: 'ai' as const,
          noiDung: `${ketQua.loiNhanTuNhien}\n\n👉 Đáp án: ${ketQua.dapAn}`,
          html: ketQua.htmlToanBo,
          thoiGian: Date.now(),
        }
        setTinAI((prev) => [...prev, tinTraLoiAI])

        // Đồng bộ thông báo sang hệ thống chat Thầy để thầy theo dõi
        guiTinNhan({
          nguoiGui: nguoiDungHS,
          nguoiNhan: doiPhuongThay,
          noiDung: `[Hỏi bài Trợ lý AI]: ${text || 'Ảnh bài tập'} -> Đáp án: ${ketQua.dapAn}`,
          html: ketQua.htmlToanBo,
          anhUrl: anhGuiDi || undefined,
        })
      } else if (tab === 'thay') {
        // Nhắn tin cho Thầy
        guiTinNhan({
          nguoiGui: nguoiDungHS,
          nguoiNhan: doiPhuongThay,
          noiDung: text,
          anhUrl: anhDinhKem || undefined,
        })

        if (scriptUrl.trim() && sbdHocSinh) {
          try {
            await sendStudentMessage(scriptUrl.trim(), sbdHocSinh, tenHocSinh, lop, text)
          } catch {
            // ignore Apps script error
          }
        }
        setTin('')
        setAnhDinhKem(null)
        setTenTep(null)
        capNhatTinNhan()
      } else if (tab === 'phuhuynh') {
        // Nhắn tin cho Bố/Mẹ
        guiTinNhan({
          nguoiGui: nguoiDungHS,
          nguoiNhan: doiPhuongPH,
          noiDung: text,
          anhUrl: anhDinhKem || undefined,
        })
        setTin('')
        setAnhDinhKem(null)
        setTenTep(null)
        capNhatTinNhan()
      } else if (tab === 'banbe') {
        // Nhắn tin cho bạn bè qua SBD
        if (!sbdBanDangChat) return
        guiTinNhan({
          nguoiGui: nguoiDungHS,
          nguoiNhan: {
            vai: 'hs',
            sbd: sbdBanDangChat,
            hoTen: `Bạn SBD ${sbdBanDangChat}`,
          },
          noiDung: text,
          anhUrl: anhDinhKem || undefined,
        })
        setTin('')
        setAnhDinhKem(null)
        setTenTep(null)
        capNhatTinNhan()
      }
    } finally {
      setDangXuLy(false)
    }
  }

  const ketNoiBanBe = () => {
    const sbdSach = sbdBanBe.trim()
    if (!sbdSach) return
    setSbdBanDangChat(sbdSach)
    setTinBanBe(
      layHoiThoai(nguoiDungHS, {
        vai: 'hs',
        sbd: sbdSach,
        hoTen: `Bạn ${sbdSach}`,
      }),
    )
  }

  return (
    <aside aria-label="Bong bóng chat học sinh" className={className}>
      {/* NÚT BONG BÓNG */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg flex items-center justify-center tap-target transition-transform active:scale-95 cursor-pointer"
        style={{
          width: SIZE,
          height: SIZE,
          background: 'var(--gg-xanh)',
          color: 'var(--the)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
        title="Trợ lý Gemini AI & Nhắn tin"
      >
        <Sparkles size={24} />
      </button>

      {/* POPUP CHAT TOÀN NĂNG 4 TAB */}
      {open && (
        <div
          className="fixed bottom-22 right-6 z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          style={{
            width: 'min(410px, calc(100vw - 28px))',
            height: 'min(580px, calc(100vh - 110px))',
            background: 'var(--the)',
            borderColor: 'var(--vien)',
          }}
        >
          {/* HEADER */}
          <div
            className="p-3 flex items-center justify-between text-white"
            style={{ background: 'var(--gg-xanh)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Học Tập & Giao Tiếp ĐĐH</div>
                <div className="text-[11px] opacity-90">{tenHocSinh}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* 4 TABS: GEMINI AI | THẦY | BỐ MẸ | BẠN BÈ */}
          <div
            className="grid grid-cols-4 p-1 border-b text-[11px] font-bold"
            style={{ background: 'var(--the-2)', borderColor: 'var(--vien)' }}
          >
            <button
              type="button"
              onClick={() => setTab('ai')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                tab === 'ai'
                  ? 'bg-white shadow-xs font-extrabold text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Sparkles size={14} className="mb-0.5" />
              <span>Gemini AI</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('thay')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                tab === 'thay'
                  ? 'bg-white shadow-xs font-extrabold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <GraduationCap size={14} className="mb-0.5" />
              <span>Thầy</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('phuhuynh')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                tab === 'phuhuynh'
                  ? 'bg-white shadow-xs font-extrabold text-rose-600 dark:bg-slate-800 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Heart size={14} className="mb-0.5" />
              <span>Bố Mẹ</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('banbe')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors ${
                tab === 'banbe'
                  ? 'bg-white shadow-xs font-extrabold text-emerald-600 dark:bg-slate-800 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Users size={14} className="mb-0.5" />
              <span>Bạn bè</span>
            </button>
          </div>

          {/* THANH TÌM BẠN BÈ THEO SBD KHI Ở TAB BẠN BÈ */}
          {tab === 'banbe' && (
            <div
              className="p-2 border-b flex items-center gap-1.5"
              style={{ background: 'var(--the)', borderColor: 'var(--vien)' }}
            >
              <Search size={14} className="opacity-50" />
              <input
                type="text"
                value={sbdBanBe}
                onChange={(e) => setSbdBanBe(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ketNoiBanBe()}
                placeholder="Nhập Số Báo Danh (SBD) của bạn..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none"
                style={{
                  background: 'var(--the-2)',
                  borderColor: 'var(--vien)',
                  color: 'var(--muc)',
                }}
              />
              <button
                type="button"
                onClick={ketNoiBanBe}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity active:scale-95"
                style={{ background: 'var(--gg-luc)' }}
              >
                Nhắn tin
              </button>
            </div>
          )}

          {/* VÙNG DANH SÁCH TIN NHẮN */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3" style={{ background: 'var(--nen)' }}>
            {/* TAB 1: GEMINI AI */}
            {tab === 'ai' && (
              <>
                {tinAI.map((m) => {
                  const laEm = m.nguoiGui === 'em'
                  return (
                    <div key={m.id} className={`flex flex-col ${laEm ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2 max-w-[90%] text-[13.5px] leading-relaxed ${
                          laEm ? 'text-white rounded-tr-xs' : 'rounded-tl-xs border shadow-xs'
                        }`}
                        style={
                          laEm
                            ? { background: 'var(--gg-xanh)' }
                            : { background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }
                        }
                      >
                        {!laEm && (
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold mb-1" style={{ color: 'var(--gg-xanh)' }}>
                            <Sparkles size={13} />
                            <span>Trợ lý Gemini AI</span>
                          </div>
                        )}
                        {m.anhUrl && (
                          <div className="mb-2">
                            <img
                              src={m.anhUrl}
                              alt="Ảnh câu hỏi"
                              className="max-h-48 rounded-lg border object-contain"
                              style={{ borderColor: 'var(--vien)' }}
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{m.noiDung}</div>
                        {m.html && (
                          <div
                            className="mt-2 text-xs"
                            dangerouslySetInnerHTML={{ __html: m.html }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] mt-0.5 px-1 opacity-60" style={{ color: 'var(--nhat)' }}>
                        {new Date(m.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            {/* TAB 2: NHẮN CHO THẦY */}
            {tab === 'thay' && (
              <>
                <div className="flex gap-2 items-start">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 text-xs font-bold"
                    style={{ background: 'var(--gg-xanh)' }}
                  >
                    T
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-xs px-3.5 py-2 max-w-[85%] text-[13px] leading-relaxed border shadow-xs"
                    style={{ background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }}
                  >
                    Chào em {tenHocSinh}! Em gặp khó khăn gì trong quá trình học tập hay bài thi thì nhắn cho Thầy nhé.
                  </div>
                </div>

                {tinThay.map((m) => {
                  const laEm = m.nguoiGui.vai === 'hs'
                  return (
                    <div key={m.id} className={`flex flex-col ${laEm ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2 max-w-[85%] text-[13.5px] leading-relaxed ${
                          laEm ? 'text-white rounded-tr-xs' : 'rounded-tl-xs border shadow-xs'
                        }`}
                        style={
                          laEm
                            ? { background: 'var(--gg-xanh)' }
                            : { background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }
                        }
                      >
                        {!laEm && (
                          <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--gg-xanh)' }}>
                            Thầy Đỗ Đại Học
                          </div>
                        )}
                        {m.anhUrl && (
                          <img
                            src={m.anhUrl}
                            alt="Ảnh đính kèm"
                            className="max-h-40 rounded-lg mb-1.5 border"
                            style={{ borderColor: 'var(--vien)' }}
                          />
                        )}
                        <div className="whitespace-pre-wrap">{m.noiDung}</div>
                      </div>
                      <span className="text-[10px] mt-0.5 px-1 opacity-60" style={{ color: 'var(--nhat)' }}>
                        {new Date(m.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            {/* TAB 3: NHẮN CHO BỐ/MẸ */}
            {tab === 'phuhuynh' && (
              <>
                <div className="flex gap-2 items-start">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 text-xs font-bold"
                    style={{ background: 'var(--gg-do)' }}
                  >
                    ❤️
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-xs px-3.5 py-2 max-w-[85%] text-[13px] leading-relaxed border shadow-xs"
                    style={{ background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }}
                  >
                    Đây là kênh trao đổi riêng giữa em và Bố/Mẹ. Hãy chia sẻ kết quả học tập và tâm sự cùng gia đình nhé!
                  </div>
                </div>

                {tinPH.map((m) => {
                  const laEm = m.nguoiGui.vai === 'hs'
                  return (
                    <div key={m.id} className={`flex flex-col ${laEm ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2 max-w-[85%] text-[13.5px] leading-relaxed ${
                          laEm ? 'text-white rounded-tr-xs' : 'rounded-tl-xs border shadow-xs'
                        }`}
                        style={
                          laEm
                            ? { background: 'var(--gg-xanh)' }
                            : { background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }
                        }
                      >
                        {!laEm && (
                          <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--gg-do)' }}>
                            Bố / Mẹ
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{m.noiDung}</div>
                      </div>
                      <span className="text-[10px] mt-0.5 px-1 opacity-60" style={{ color: 'var(--nhat)' }}>
                        {new Date(m.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            {/* TAB 4: BẠN BÈ QUA SBD */}
            {tab === 'banbe' && (
              <>
                {!sbdBanDangChat ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <div>Nhập Số Báo Danh (SBD) của bạn ở trên để bắt đầu trò chuyện nhé!</div>
                  </div>
                ) : (
                  <>
                    <div className="text-center py-1 text-[11px] font-bold text-slate-500">
                      Đang trò chuyện với bạn có SBD: {sbdBanDangChat}
                    </div>
                    {tinBanBe.map((m) => {
                      const laEm = m.nguoiGui.sbd === sbdHocSinh
                      return (
                        <div key={m.id} className={`flex flex-col ${laEm ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2 max-w-[85%] text-[13.5px] leading-relaxed ${
                              laEm ? 'text-white rounded-tr-xs' : 'rounded-tl-xs border shadow-xs'
                            }`}
                            style={
                              laEm
                                ? { background: 'var(--gg-luc)' }
                                : { background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }
                            }
                          >
                            {!laEm && (
                              <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--gg-luc)' }}>
                                Bạn (SBD {sbdBanDangChat})
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">{m.noiDung}</div>
                          </div>
                          <span className="text-[10px] mt-0.5 px-1 opacity-60" style={{ color: 'var(--nhat)' }}>
                            {new Date(m.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}

            {dangXuLy && (
              <div className="flex items-center gap-2 text-xs font-bold p-2.5 rounded-xl border animate-pulse" style={{ background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--gg-xanh)' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Trợ lý Gemini đang phân tích và giải bài...</span>
              </div>
            )}
            <div ref={cuoiRef} />
          </div>

          {/* PREVIEW ẢNH / TỆP ĐÍNH KÈM */}
          {(anhDinhKem || tenTep) && (
            <div
              className="p-2 border-t flex items-center justify-between text-xs"
              style={{ background: 'var(--the-2)', borderColor: 'var(--vien)' }}
            >
              <div className="flex items-center gap-2 truncate">
                {anhDinhKem ? (
                  <img
                    src={anhDinhKem}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-md border"
                    style={{ borderColor: 'var(--vien)' }}
                  />
                ) : (
                  <Paperclip size={16} />
                )}
                <span className="truncate font-medium">{tenTep || 'Đã đính kèm ảnh bài tập'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAnhDinhKem(null)
                  setTenTep(null)
                }}
                className="p-1 rounded-full hover:bg-black/10"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Ô NHẬP VÀ ĐÍNH KÈM */}
          <div
            className="p-2 border-t flex items-center gap-1.5"
            style={{ background: 'var(--the)', borderColor: 'var(--vien)' }}
          >
            {/* Input file ẩn */}
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

            {/* Nút ảnh & tệp */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đính kèm ảnh bài tập"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => tepInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đính kèm tệp tài liệu"
            >
              <Paperclip size={18} />
            </button>

            {/* Input văn bản */}
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void guiTin()}
              placeholder={
                tab === 'ai'
                  ? 'Hỏi bài tập Hoá hoặc gửi ảnh cho Gemini...'
                  : tab === 'thay'
                  ? 'Nhắn tin gửi Thầy Đỗ Đại Học...'
                  : tab === 'phuhuynh'
                  ? 'Nhắn tin cho Bố Mẹ...'
                  : sbdBanDangChat
                  ? `Nhắn tin cho bạn (SBD ${sbdBanDangChat})...`
                  : 'Hãy nhập SBD bạn bè ở trên trước...'
              }
              disabled={tab === 'banbe' && !sbdBanDangChat}
              className="flex-1 text-xs px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              style={{
                background: 'var(--the-2)',
                borderColor: 'var(--vien)',
                color: 'var(--muc)',
              }}
            />

            {/* Nút gửi */}
            <button
              type="button"
              onClick={() => void guiTin()}
              disabled={(!tin.trim() && !anhDinhKem) || dangXuLy || (tab === 'banbe' && !sbdBanDangChat)}
              className="p-2 rounded-xl text-white disabled:opacity-40 transition-transform active:scale-95 cursor-pointer"
              style={{
                background:
                  tab === 'ai'
                    ? 'var(--gg-xanh)'
                    : tab === 'thay'
                    ? 'var(--gg-xanh)'
                    : tab === 'phuhuynh'
                    ? 'var(--gg-do)'
                    : 'var(--gg-luc)',
              }}
              title="Gửi"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
