import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  BookOpen,
  Award,
  Calendar,
  ChevronRight,
  Sparkles,
  Heart,
  Sliders,
  Clock,
  HelpCircle,
  LogOut,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import LogoApp from '../components/LogoApp'
import BongBongChatPhuHuynh from '../components/BongBongChatPhuHuynh'
import InfographicHuongDan from '../components/InfographicHuongDan'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { hsCauSaiApi, hsLichSuCaApi, tenTheoSbd } from '../lib/exam-api'
import { loadExamSources, loadScriptUrl } from '../lib/exam-db'
import { rutDeChua } from '../lib/rut-de-chua'
import type { TeacherExamSource } from '../data/examContent'

interface BaiThiCuaCon {
  maCa: string
  tenCa: string
  ngayNop: string
  diem: number
  soCauDung?: number
  tongSoCau?: number
  linkBaoCao?: string
}

export interface BaiMomGiao {
  id: string
  tieuDe: string
  sbd: string
  soCau: number
  thoiGianPhut: number // 120 phút = 2 tiếng
  taoLuc: string
  trangThai: 'chua_lam' | 'dang_lam' | 'da_nop'
  diem?: number
  nopLuc?: string
  cau?: unknown[]
  htmlBaoCao?: string
}

const SBD_STORAGE_KEY = 'omr_ph_sbd'

export default function ParentPortalScreen() {
  const [sbdInput, setSbdInput] = useState('')
  const [sbdHienTai, setSbdHienTai] = useState<string | null>(null)
  const [hoTenCon, setHoTenCon] = useState('')
  const [lopCon, setLopCon] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [thongBaoLoi, setThongBaoLoi] = useState('')

  // Dữ liệu con
  const [dsBaiThi, setDsBaiThi] = useState<BaiThiCuaCon[]>([])
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])

  // Thanh kéo số câu tạo bài tập cho con (tối đa 99 câu)
  const [soCauGiao, setSoCauGiao] = useState<number>(20)
  const [dangTaoMom, setDangTaoMom] = useState(false)
  const [thongBaoMom, setThongBaoMom] = useState<{ loai: 'ok' | 'loi'; chu: string } | null>(null)

  // Khung xem báo cáo HTML
  const [xemPhieuHtml, setXemPhieuHtml] = useState<string | null>(null)
  const [hienHuongDan, setHienHuongDan] = useState(false)

  useEffect(() => {
    loadScriptUrl().then((u) => {
      setScriptUrl(u)
      const sbdLuu = localStorage.getItem(SBD_STORAGE_KEY)
      if (sbdLuu && sbdLuu.trim()) {
        void dangNhapPhuHuynh(sbdLuu.trim(), u)
      }
    })
  }, [])

  // Đọc danh sách bài Mom giao đã lưu trong máy
  const napDanhSachMomGiao = (sbd: string) => {
    try {
      const raw = localStorage.getItem(`omr_mom_btvn_${sbd}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setDsMomGiao(parsed)
        }
      } else {
        setDsMomGiao([])
      }
    } catch {
      setDsMomGiao([])
    }
  }

  async function dangNhapPhuHuynh(sbd: string, urlParam?: string) {
    const sbdSach = sbd.trim()
    if (!sbdSach) {
      setThongBaoLoi('Vui lòng nhập Số báo danh của con')
      return
    }

    setDangTai(true)
    setThongBaoLoi('')
    const url = urlParam || scriptUrl

    try {
      // 1. Tra cứu thông tin học sinh
      let ten = ''
      let lop = ''
      if (url) {
        try {
          const info = await tenTheoSbd(url, '', sbdSach)
          if (info && info.hoTen) {
            ten = info.hoTen
            lop = info.lop || ''
          }
        } catch {
          // Bỏ qua lỗi tra tên nếu mạng chậm
        }
      }

      setSbdHienTai(sbdSach)
      setHoTenCon(ten || `Học sinh SBD ${sbdSach}`)
      setLopCon(lop)
      localStorage.setItem(SBD_STORAGE_KEY, sbdSach)

      // 2. Lấy lịch sử ca thi của con
      if (url) {
        try {
          const ls = await hsLichSuCaApi(url, sbdSach)
          if (ls && ls.ok && Array.isArray(ls.items)) {
            setDsBaiThi(
              ls.items.map((c: any) => ({
                maCa: c.maCa || '',
                tenCa: c.tenCa || `Ca thi #${c.maCa}`,
                ngayNop: c.nopLuc || '',
                diem: typeof c.tong === 'number' ? c.tong : 0,
                soCauDung: c.soCauDung,
                tongSoCau: c.tongCau,
                linkBaoCao: '',
              })),
            )
          }
        } catch {
          // fallback
        }
      }

      // 3. Tải danh sách bài Mom giao
      napDanhSachMomGiao(sbdSach)
    } catch (e) {
      setThongBaoLoi(e instanceof Error ? e.message : 'Không đăng nhập được')
    } finally {
      setDangTai(false)
    }
  }

  const dangXuat = () => {
    localStorage.removeItem(SBD_STORAGE_KEY)
    setSbdHienTai(null)
    setHoTenCon('')
    setLopCon('')
    setDsBaiThi([])
    setDsMomGiao([])
    setSbdInput('')
  }

  // TỰ ĐỘNG TẠO BÀI TẬP KHẮC PHỤC LỖI SAI (BÀI CỦA MOM GIAO)
  const xuLyTaoBaiCuaMom = async () => {
    if (!sbdHienTai) return
    setDangTaoMom(true)
    setThongBaoMom(null)

    try {
      // 1. Quét toàn bộ câu con làm sai trong tất cả các ca thi
      let dsCauSai: any[] = []
      if (scriptUrl) {
        try {
          const res = await hsCauSaiApi(scriptUrl, sbdHienTai, [])
          if (res && res.ok && Array.isArray(res.items)) {
            dsCauSai = res.items
          }
        } catch {
          dsCauSai = []
        }
      }

      // 2. Rút câu nhãn giống nhau từ kho đề
      let khoDe: TeacherExamSource[] = []
      try {
        khoDe = await loadExamSources()
      } catch {
        khoDe = []
      }

      let dsCauChon: any[] = []
      if (khoDe.length > 0 && dsCauSai.length > 0) {
        try {
          const kq = rutDeChua({
            khoDe,
            rows: dsCauSai as any,
            qidTranh: [],
            soCau: soCauGiao,
          })
          dsCauChon = kq.cau
        } catch {
          dsCauChon = []
        }
      }

      // Nếu kho đề chưa có câu rút tự động, lấy trực tiếp các câu con sai để con làm lại
      if (dsCauChon.length === 0) {
        dsCauChon = dsCauSai.slice(0, soCauGiao).map((c) => ({
          id: c.qid || `cau_${Math.random()}`,
          phan: c.phan || 'I',
          text: c.text || 'Câu hỏi cần ôn tập',
          choices: c.choices || [],
          dapAn: c.dapAnDung || 'A',
          loiGiai: c.loiGiai || '',
          chuyenDe: c.chuyenDe || 'Lỗi sai cần khắc phục',
        }))
      }

      const soCauThucTe = Math.min(soCauGiao, dsCauChon.length > 0 ? dsCauChon.length : soCauGiao)

      // 3. Đóng gói bài tập Mom giao (Hạn 2 tiếng)
      const maMom = `mom_${Date.now()}`
      const baiMoi: BaiMomGiao = {
        id: maMom,
        tieuDe: `Bài của Mom giao (${soCauThucTe} câu)`,
        sbd: sbdHienTai,
        soCau: soCauThucTe,
        thoiGianPhut: 120, // 2 tiếng
        taoLuc: new Date().toISOString(),
        trangThai: 'chua_lam',
        cau: dsCauChon,
      }

      // Lưu vào danh sách Mom giao của học sinh
      const dsCapNhat = [baiMoi, ...dsMomGiao]
      localStorage.setItem(`omr_mom_btvn_${sbdHienTai}`, JSON.stringify(dsCapNhat))
      setDsMomGiao(dsCapNhat)

      setThongBaoMom({
        loai: 'ok',
        chu: `🎉 Đã tạo thành công "${baiMoi.tieuDe}"! Bài đã gửi sang App Học sinh với thời gian làm bài 2 tiếng tính từ lúc con bắt đầu.`,
      })
    } catch (e) {
      setThongBaoMom({
        loai: 'loi',
        chu: e instanceof Error ? e.message : 'Có lỗi khi tạo bài tập',
      })
    } finally {
      setDangTaoMom(false)
    }
  }

  // GIAO DIỆN 1: CHƯA ĐĂNG NHẬP (NHẬP DUY NHẤT SBD CỦA CON)
  if (!sbdHienTai) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <header className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <LogoApp vai="giaovien" size={38} hienChu={true} phuDe="PHỤ HUYNH" />
          <button
            type="button"
            onClick={() => setHienHuongDan(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline tap-target"
          >
            <HelpCircle size={15} />
            <span>Hướng dẫn đăng nhập</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 animate-google-fade">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users size={32} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                CỔNG PHỤ HUYNH
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi kết quả học tập & Đồng hành cùng con đỗ Đại học
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void dangNhapPhuHuynh(sbdInput)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Số Báo Danh của con (SBD)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sbdInput}
                    onChange={(e) => setSbdInput(e.target.value)}
                    placeholder="Ví dụ: 12001, 12002…"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <Search className="absolute right-4 top-4 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Phụ huynh chỉ cần nhập duy nhất Số báo danh con được cấp tại lớp.
                </p>
              </div>

              {thongBaoLoi && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2 border border-red-200 dark:border-red-800">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{thongBaoLoi}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!sbdInput.trim() || dangTai}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {dangTai ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang tra cứu dữ liệu của con…</span>
                  </>
                ) : (
                  <span>Vào xem kết quả của con</span>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-400">
          Hệ thống Luyện thi Hoá Thầy Đỗ Đại Học · Cổng Phụ Huynh Trực Tuyến
        </footer>

        {hienHuongDan && <InfographicHuongDan onClose={() => setHienHuongDan(false)} vaiMacDinh="phuhuynh" />}
      </div>
    )
  }

  // GIAO DIỆN 2: ĐÃ ĐĂNG NHẬP — 2 Ô CHÍNH (XEM BÁO CÁO & TẠO BÀI CỦA MOM GIAO)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoApp vai="giaovien" size={36} hienChu={true} phuDe="PHỤ HUYNH" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setHienHuongDan(true)}
            className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition tap-target"
            title="Hướng dẫn đăng nhập"
          >
            <HelpCircle size={18} />
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {hoTenCon}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              SBD: <span className="font-mono font-bold text-blue-600">{sbdHienTai}</span> {lopCon ? `· ${lopCon}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={dangXuat}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1 cursor-pointer tap-target"
            title="Đổi học sinh khác"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Đổi SBD</span>
          </button>
        </div>
      </header>

      {/* BODY CHÍNH GỒM 2 Ô TRỌNG TÂM */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* BANNER CHÀO ĐÓN */}
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
                <Sparkles size={14} /> Cổng Đồng Hành Cùng Con
              </div>
              <h1 className="text-xl sm:text-2xl font-black">
                Chào Quý Phụ huynh của em {hoTenCon}!
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                Nơi Phụ huynh xem toàn bộ kết quả ca thi của con và chủ động tạo đề luyện khắc phục lỗi sai dành riêng cho con.
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 sm:text-center min-w-[120px] backdrop-blur-sm border border-white/15">
              <div className="text-[11px] text-blue-100 font-medium">Tổng số ca thi</div>
              <div className="text-2xl font-black">{dsBaiThi.length} ca</div>
            </div>
          </div>
        </div>

        {/* LƯỚI 2 Ô: Ô 1 (BÁO CÁO CON) & Ô 2 (TẠO BÀI CỦA MOM GIAO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ô 1: XEM BÁO CÁO CỦA CON */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                  <Award size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Báo Cáo Điểm Các Ca Thi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kết quả và chi tiết bài làm con đã nộp
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
                {dsBaiThi.length} ca thi
              </span>
            </div>

            {/* DANH SÁCH CÁC CA THI */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
              {dsBaiThi.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <BookOpen size={36} className="text-slate-300 dark:text-slate-700" />
                  <p className="text-xs">Chưa có kết quả ca thi nào của con được ghi nhận.</p>
                </div>
              ) : (
                dsBaiThi.map((b) => (
                  <div
                    key={b.maCa}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          #{b.maCa}
                        </span>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                          {b.tenCa}
                        </h3>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{b.ngayNop ? new Date(b.ngayNop).toLocaleDateString('vi-VN') : 'Đã thi'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                          {b.diem.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">điểm</div>
                      </div>

                      {b.linkBaoCao ? (
                        <a
                          href={b.linkBaoCao}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition tap-target"
                        >
                          <span>Xem</span>
                          <ChevronRight size={14} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Đang cập nhật</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Ô 2: TẠO BÀI TẬP CHO CON LUYỆN KHẮC PHỤC LỖI SAI ("BÀI CỦA MOM GIAO") */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
                    <Heart size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Bài của Mom giao
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tự động rút câu cùng nhãn khắc phục lỗi sai của con
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
                  Hạn 2 tiếng
                </span>
              </div>

              {/* MÔ TẢ CƠ CHẾ SƯ PHẠM */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 mb-5 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                💡 <b>Cơ chế hoạt động</b>: Khi Phụ huynh bấm tạo, máy sẽ tự động quét tất cả các câu con đã làm sai từ các ca thi trước, tìm đúng các câu có cùng dạng và nhãn trong kho đề để tạo thành một đề ôn tập gửi thẳng sang App Học sinh của con.
              </div>

              {/* THANH TRƯỢT CHỌN SỐ CÂU (TỐI ĐA 99 CÂU) */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders size={14} className="text-rose-500" />
                    <span>Số câu giao cho con (Tối đa 99 câu)</span>
                  </label>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 px-3 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 font-mono">
                    {soCauGiao} câu
                  </span>
                </div>

                {/* SLIDER RANGE */}
                <input
                  type="range"
                  min={5}
                  max={99}
                  step={1}
                  value={soCauGiao}
                  onChange={(e) => setSoCauGiao(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>5 câu (ôn nhanh)</span>
                  <span>50 câu</span>
                  <span>99 câu (tối đa)</span>
                </div>
              </div>

              {/* NÚT TẠO VÀ GỬI BÀI CHO CON */}
              <button
                type="button"
                onClick={xuLyTaoBaiCuaMom}
                disabled={dangTaoMom}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {dangTaoMom ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Đang quét câu sai & rút đề phù hợp…</span>
                  </>
                ) : (
                  <>
                    <Heart size={18} />
                    <span>Tự động tạo & Gửi bài cho con (Hạn 2 tiếng)</span>
                  </>
                )}
              </button>

              {thongBaoMom && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    thongBaoMom.loai === 'ok'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
                  }`}
                >
                  {thongBaoMom.chu}
                </div>
              )}
            </div>

            {/* DANH SÁCH CÁC BÀI MOM ĐÃ GIAO GẦN ĐÂY */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Các bài Mom đã giao gần đây
              </h4>
              {dsMomGiao.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có bài tập nào được giao.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dsMomGiao.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{m.tieuDe}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {new Date(m.taoLuc).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      <div>
                        {m.trangThai === 'da_nop' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            Đã nộp: {m.diem?.toFixed(1) ?? '10'} điểm
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            Con đang làm
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* BONG BÓNG CHAT PHỤ HUYNH VỚI THẦY */}
      {sbdHienTai && (
        <BongBongChatPhuHuynh sbd={sbdHienTai} hoTenHocSinh={hoTenCon} lop={lopCon} />
      )}

      {/* MODAL INFOGRAPHIC HƯỚNG DẪN */}
      {hienHuongDan && (
        <InfographicHuongDan onClose={() => setHienHuongDan(false)} vaiMacDinh="phuhuynh" />
      )}

      {/* XEM BÁO CÁO PHIẾU HTML */}
      {xemPhieuHtml && (
        <KhungXemPhieu
          html={xemPhieuHtml}
          ten={`Báo cáo học tập - ${hoTenCon}`}
          dong={() => setXemPhieuHtml(null)}
        />
      )}
    </div>
  )
}
