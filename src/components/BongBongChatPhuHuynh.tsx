import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, User, GraduationCap, Heart } from 'lucide-react'
import { sendStudentMessage } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import {
  dangKyNhanTinNhan,
  guiTinNhan,
  layHoiThoai,
  danhDauDocHoiThoai,
  type TinNhanChat,
} from '../lib/tro-ly/he-thong-chat'

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
  const [tab, setTab] = useState<'thay' | 'con'>('thay')
  const [tin, setTin] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [scriptUrl, setScriptUrl] = useState('')
  const cuoiRef = useRef<HTMLDivElement>(null)

  const nguoiDungPH = {
    vai: 'ph' as const,
    sbd: sbd.trim(),
    hoTen: `Phụ huynh của ${hoTenHocSinh || sbd}`,
    lop,
  }

  const doiPhuongThay = {
    vai: 'gv' as const,
    hoTen: 'Thầy Đỗ Đại Học',
  }

  const doiPhuongCon = {
    vai: 'hs' as const,
    sbd: sbd.trim(),
    hoTen: hoTenHocSinh || `Con (SBD ${sbd})`,
    lop,
  }

  const [danhSachTinThay, setDanhSachTinThay] = useState<TinNhanChat[]>([])
  const [danhSachTinCon, setDanhSachTinCon] = useState<TinNhanChat[]>([])

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
  }, [])

  const taiTinNhan = () => {
    if (!sbd.trim()) return
    const tinThay = layHoiThoai(nguoiDungPH, doiPhuongThay)
    const tinCon = layHoiThoai(nguoiDungPH, doiPhuongCon)
    setDanhSachTinThay(tinThay)
    setDanhSachTinCon(tinCon)
  }

  useEffect(() => {
    taiTinNhan()
    const huyLangNghe = dangKyNhanTinNhan(() => {
      taiTinNhan()
    })
    return () => huyLangNghe()
  }, [sbd, hoTenHocSinh])

  useEffect(() => {
    if (open) {
      if (tab === 'thay') {
        danhDauDocHoiThoai(nguoiDungPH, doiPhuongThay)
      } else {
        danhDauDocHoiThoai(nguoiDungPH, doiPhuongCon)
      }
      cuoiRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, tab, danhSachTinThay, danhSachTinCon])

  const guiTin = async () => {
    const text = tin.trim()
    if (!text || dangGui) return

    setDangGui(true)
    const mucTieu = tab === 'thay' ? doiPhuongThay : doiPhuongCon

    try {
      // 1. Gửi qua hệ thống chat đồng bộ thời gian thực
      guiTinNhan({
        nguoiGui: nguoiDungPH,
        nguoiNhan: mucTieu,
        noiDung: text,
      })

      // 2. Nếu gửi cho thầy và có scriptUrl thì đẩy lên Apps Script
      if (tab === 'thay' && scriptUrl.trim() && sbd.trim()) {
        try {
          await sendStudentMessage(scriptUrl.trim(), sbd, `[Phụ huynh ${hoTenHocSinh || sbd}]`, lop || '', text)
        } catch {
          // máy chủ Apps Script có thể lỗi, tin vẫn lưu nội bộ
        }
      }

      setTin('')
      taiTinNhan()
    } finally {
      setDangGui(false)
    }
  }

  const dsHienTai = tab === 'thay' ? danhSachTinThay : danhSachTinCon

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
          color: 'var(--the)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
        title="Nhắn tin với Thầy & Con"
      >
        <MessageCircle size={26} />
      </button>

      {/* POPUP CHAT 2 PHẦN: NHẮN CHO THẦY & NHẮN CHO CON */}
      {open && (
        <div
          className="fixed bottom-22 right-6 z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          style={{
            width: 'min(390px, calc(100vw - 32px))',
            height: 'min(540px, calc(100vh - 120px))',
            background: 'var(--the)',
            borderColor: 'var(--vien)',
          }}
        >
          {/* HEADER */}
          <div
            className="p-3.5 flex items-center justify-between text-white"
            style={{ background: 'var(--gg-xanh)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Liên lạc Phụ huynh</div>
                <div className="text-[11px] opacity-90">Con: {hoTenHocSinh || sbd}</div>
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

          {/* 2 TAB: NHẮN CHO THẦY & NHẮN CHO CON */}
          <div
            className="grid grid-cols-2 p-1 border-b text-xs font-bold"
            style={{ background: 'var(--the-2)', borderColor: 'var(--vien)' }}
          >
            <button
              type="button"
              onClick={() => setTab('thay')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                tab === 'thay'
                  ? 'bg-white shadow-xs font-extrabold text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <GraduationCap size={15} />
              <span>Nhắn cho Thầy</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('con')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                tab === 'con'
                  ? 'bg-white shadow-xs font-extrabold text-rose-600 dark:bg-slate-800 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Heart size={14} />
              <span>Nhắn cho Con</span>
            </button>
          </div>

          {/* NỘI DUNG CHAT */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3" style={{ background: 'var(--nen)' }}>
            {/* Tin chào mặc định */}
            {tab === 'thay' ? (
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
                  Kính chào Quý Phụ huynh của em {hoTenHocSinh || sbd}! Thầy Đỗ Đại Học luôn sẵn sàng lắng nghe và trao đổi về tình hình học tập của con.
                </div>
              </div>
            ) : (
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
                  Đây là kênh trò chuyện trực tiếp giữa Bố/Mẹ và con ({hoTenHocSinh || sbd}). Tin nhắn gửi ở đây sẽ hiện ngay trên điện thoại/máy tính của con!
                </div>
              </div>
            )}

            {/* Danh sách tin nhắn */}
            {dsHienTai.map((m) => {
              const laToi = m.nguoiGui.vai === 'ph'
              return (
                <div key={m.id} className={`flex flex-col ${laToi ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 max-w-[85%] text-[13.5px] leading-relaxed ${
                      laToi
                        ? 'text-white rounded-tr-xs'
                        : 'rounded-tl-xs border shadow-xs'
                    }`}
                    style={
                      laToi
                        ? { background: tab === 'thay' ? 'var(--gg-xanh)' : 'var(--gg-do)' }
                        : { background: 'var(--the)', borderColor: 'var(--vien)', color: 'var(--muc)' }
                    }
                  >
                    {!laToi && (
                      <div className="text-[11px] font-bold mb-1 opacity-80" style={{ color: 'var(--gg-xanh)' }}>
                        {m.nguoiGui.hoTen || (m.nguoiGui.vai === 'gv' ? 'Thầy Đỗ Đại Học' : 'Con')}
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
            <div ref={cuoiRef} />
          </div>

          {/* Ô NHẬP TIN NHẮN */}
          <div
            className="p-2.5 border-t flex items-center gap-2"
            style={{ background: 'var(--the)', borderColor: 'var(--vien)' }}
          >
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void guiTin()}
              placeholder={tab === 'thay' ? 'Nhắn tin gửi Thầy Đỗ Đại Học...' : `Nhắn tin cho con (${hoTenHocSinh || sbd})...`}
              className="flex-1 text-xs px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-blue-500"
              style={{
                background: 'var(--the-2)',
                borderColor: 'var(--vien)',
                color: 'var(--muc)',
              }}
            />
            <button
              type="button"
              onClick={() => void guiTin()}
              disabled={!tin.trim() || dangGui}
              className="p-2 rounded-xl text-white disabled:opacity-40 transition-transform active:scale-95 cursor-pointer"
              style={{ background: tab === 'thay' ? 'var(--gg-xanh)' : 'var(--gg-do)' }}
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
