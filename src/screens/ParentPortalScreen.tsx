import BangTinPhuHuynh from '../components/BangTinPhuHuynh'
import { momApi, migrateMom, momReviewHtml, chuanHoaBaiMom } from '../lib/mom-api'
import KhoiKhacPhuc3CheDo from '../components/KhoiKhacPhuc3CheDo'
import { useEffect, useState } from 'react'
import DongDemCau from '../components/DongDemCau'
import {
  Search,
  BookOpen,
  Award,
  Calendar,
  ChevronRight,
  Sparkles,
  HelpCircle,
  LogOut,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import LogoApp from '../components/LogoApp'
import InfographicHuongDan from '../components/InfographicHuongDan'
import KhungXemPhieu from '../components/KhungXemPhieu'
import BaoCaoCaThiPhuHuynhModal from '../components/BaoCaoCaThiPhuHuynhModal'
import ModalKhacPhucCauSai from '../components/ModalKhacPhucCauSai'
import { hsCauSaiApi, hsLichSuCaApi, tenTheoSbd } from '../lib/exam-api'
import { loadScriptUrl } from '../lib/exam-db'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import { guiTinNhan } from '../lib/tro-ly/he-thong-chat'

interface BaiThiCuaCon {
  maCa: string
  tenCa: string
  ngayNop: string
  diem: number
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  thoiGianPhut?: number
  soCauDung?: number
  soCauSai?: number
  tongSoCau?: number
  /** Bốn nhóm rời nhau, thêm 14/09 — xem `src/lib/dem-ket-qua.ts`. */
  soCauDungMotPhan?: number | null
  soCauBoTrong?: number | null
  soYDungII?: number | null
  soYTongII?: number | null
  lanThu?: number
  linkBaoCao?: string
}

export interface BaiMomGiao {
  id: string
  tieuDe: string
  sbd: string
  soCau: number
  thoiGianPhut: number // 120 phút = 2 tiếng
  taoLuc: string
  ngayGiao?: string
  trangThai: 'chua_lam' | 'dang_lam' | 'da_nop'
  diem?: number
  nopLuc?: string
  cau?: unknown[]
  dsCau?: unknown[]
  htmlBaoCao?: string
  htmlKetQua?: string
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
  const [caDangXem, setCaDangXem] = useState<BaiThiCuaCon | null>(null)
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])

  const [, setDangTaoMom] = useState(false)
  const [thongBaoMom, setThongBaoMom] = useState<{ loai: 'ok' | 'loi'; chu: string } | null>(null)

  // Khắc phục câu sai (Bài của Mom giao - 3 chế độ đồng bộ)
  const [dsCauSaiModalMom, setDsCauSaiModalMom] = useState<any[] | null>(null)
  const [tieuDeCaMom, setTieuDeCaMom] = useState<string>('')

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

  useEffect(() => {
    nhoVaiDaDung('ph')
    try {
      datManifestTheoVai('ph')
      document.title = 'ĐĐH Phụ Huynh'
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      if (meta) meta.setAttribute('content', 'ĐĐH Phụ Huynh')
    } catch {
      // ignore
    }
  }, [])

  const napDanhSachMomGiao = async (sbd: string) => {
    try {
      let migrationError = ''
      try { await migrateMom(sbd) } catch (e) { migrationError = e instanceof Error ? e.message : 'Chưa gửi hết bài cũ.' }
      const data = await momApi('parent-list', {sbd})
      let legacy: BaiMomGiao[] = []
      try { legacy = JSON.parse(localStorage.getItem(`omr_mom_btvn_${sbd}`) || '[]').filter((b: BaiMomGiao) => b.trangThai === 'da_nop' && !data.items.some((n: BaiMomGiao) => n.id === b.id)) } catch {}
      setDsMomGiao([...data.items, ...legacy])
      if (migrationError) setThongBaoMom({loai:'loi',chu:`Còn bài cũ chưa gửi được: ${migrationError}. App sẽ tự thử lại khi có mạng.`})
      else setThongBaoMom(previous => previous?.loai === 'loi' ? null : previous)
    } catch (e) {
      setThongBaoMom({loai:'loi',chu:`Chưa đồng bộ được bài: ${e instanceof Error ? e.message : 'Vui lòng thử lại.'}`})
    }
  }
  useEffect(() => {
    if (!sbdHienTai) return
    const refresh = () => { if (!document.hidden) void napDanhSachMomGiao(sbdHienTai) }
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh) }
  }, [sbdHienTai])

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
                diemI: typeof c.diemI === 'number' ? c.diemI : null,
                diemII: typeof c.diemII === 'number' ? c.diemII : null,
                diemIII: typeof c.diemIII === 'number' ? c.diemIII : null,
                thoiGianPhut: Number(c.thoiGianPhut) || 45,
                soCauDung: c.soCauDung,
                soCauSai: c.soCauSai,
                tongSoCau: c.tongCau,
                soCauDungMotPhan: c.soCauDungMotPhan,
                soCauBoTrong: c.soCauBoTrong,
                soYDungII: c.soYDungII,
                soYTongII: c.soYTongII,
                lanThu: c.lanThu || 1,
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

  // GIAO BÀI TẬP TRỰC TIẾP CHO CON (HẠN 2 TIẾNG)
  const xuLyGiaoBaiTrucTiep = async (dsCau: any[], tieuDe?: string) => {
    if (!sbdHienTai || !dsCau || dsCau.length === 0) return
    const maMom = `mom_${Date.now()}`
    const tieuDeThucTe = tieuDe || `Bài của Mom giao (${dsCau.length} câu)`
    const baiMoi: BaiMomGiao = {
      id: maMom,
      tieuDe: tieuDeThucTe,
      sbd: sbdHienTai,
      soCau: dsCau.length,
      thoiGianPhut: 120, // 2 tiếng
      taoLuc: new Date().toISOString(),
      ngayGiao: new Date().toISOString(),
      trangThai: 'chua_lam',
      cau: dsCau,
      dsCau: dsCau,
    }

    setDangTaoMom(true)
    setThongBaoMom(null)
    try {
      // Lưu hàng chờ trước; chỉ báo thành công sau khi máy chủ xác nhận.
      try {
        const old = JSON.parse(localStorage.getItem(`omr_mom_btvn_${sbdHienTai}`) || '[]')
        localStorage.setItem(`omr_mom_btvn_${sbdHienTai}`, JSON.stringify([baiMoi, ...old]))
      } catch { /* Hết dung lượng máy vẫn gửi trực tiếp được. */ }
      await momApi('create', {sbd:sbdHienTai,id:maMom,tieuDe:tieuDeThucTe,dsCau})
      try { localStorage.setItem(`omr_mom_sent_${sbdHienTai}_${maMom}`, '1') } catch {}
      setDsCauSaiModalMom(null)
      await napDanhSachMomGiao(sbdHienTai)
      setThongBaoMom({loai:'ok',chu:`Đã gửi “${tieuDeThucTe}”. Con mở mục Bài của Mom giao để nhận bài. Thời gian 2 tiếng tính từ lúc con bắt đầu.`})
    } catch (e) {
      setThongBaoMom({loai:'loi',chu:`Chưa gửi được bài. Vui lòng giữ app và kết nối lại để gửi tiếp. ${e instanceof Error ? e.message : ''}`})
    } finally { setDangTaoMom(false) }
  }

  // TỰ ĐỘNG MỞ MODAL KHẮC PHỤC LỖI SAI (BÀI CỦA MOM GIAO - 3 CHẾ ĐỘ CHUẨN)
  const xuLyTaoBaiCuaMom = async () => {
    if (!sbdHienTai) return
    setDangTaoMom(true)
    setThongBaoMom(null)

    try {
      // CẤM CANH CỬA BẰNG `scriptUrl` — xem `src/lib/dia-chi-may-chu.ts`.
      // Máy phụ huynh chưa từng lưu khoá ấy, canh theo nó là không bao giờ gọi.
      let dsCauSai: any[] = []
      let loiGoi = ''
      try {
        const res = await hsCauSaiApi(scriptUrl, sbdHienTai, [])
        if (res && res.ok && Array.isArray(res.items)) dsCauSai = res.items
        else loiGoi = res?.error || 'Máy chủ không trả về danh sách câu sai'
      } catch (e) {
        loiGoi = e instanceof Error ? e.message : 'Không kết nối được máy chủ'
      }

      if (dsCauSai.length === 0) {
        // Rỗng vì KHÔNG SAI CÂU NÀO và rỗng vì GỌI HỎNG là hai chuyện khác nhau.
        const chu = loiGoi || 'Con chưa có câu sai nào trong các ca thi đã hoàn thành!'
        setThongBaoMom({ loai: 'loi', chu })
        return
      }

      setTieuDeCaMom('Tất cả các ca thi')
      setDsCauSaiModalMom(dsCauSai)
    } catch (e) {
      setThongBaoMom({
        loai: 'loi',
        chu: e instanceof Error ? e.message : 'Có lỗi khi tải danh sách câu sai',
      })
    } finally {
      setDangTaoMom(false)
    }
  }

  // TẠO BÀI TẬP KHẮC PHỤC TRỰC TIẾP TỪ CÂU SAI CỦA CA THI
  const xuLyTaoBaiCuaMomTuCa = (dsCauSaiCa: any[], maCa?: string) => {
    if (!sbdHienTai) return
    if (Array.isArray(dsCauSaiCa) && dsCauSaiCa.length > 0) {
      setTieuDeCaMom(maCa ? `Ca thi #${maCa}` : 'Ca thi đã chọn')
      setDsCauSaiModalMom(dsCauSaiCa)
    } else {
      void xuLyTaoBaiCuaMom()
    }
  }

  // GIAO DIỆN 1: CHƯA ĐĂNG NHẬP (NHẬP DUY NHẤT SBD CỦA CON)
  if (!sbdHienTai) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <header className="px-4 pb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <LogoApp vai="phuhuynh" size={38} hienChu={true} phuDe="PHỤ HUYNH" />
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
              <div className="flex justify-center mb-3">
                <LogoApp vai="phuhuynh" size={54} hienChu={false} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--sans)' }}>
                ĐỖ ĐẠI HỌC
              </h1>
              <div className="text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 mt-1" style={{ fontFamily: 'var(--sans)' }}>
                Kiên Trì
              </div>
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
      <header className="px-4 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-between" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <LogoApp vai="phuhuynh" size={36} hienChu={true} phuDe="PHỤ HUYNH" />
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

        <div className="mb-6"><BangTinPhuHuynh sbd={sbdHienTai} onSent={() => void napDanhSachMomGiao(sbdHienTai)} /></div>
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
                    onClick={() => setCaDangXem(b)}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition bg-slate-50/50 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                          #{b.maCa}
                        </span>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {b.tenCa}
                        </h3>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{b.ngayNop ? new Date(b.ngayNop).toLocaleDateString('vi-VN') : 'Đã thi'}</span>
                        </span>
                        {typeof b.tongSoCau === 'number' && b.tongSoCau > 0 && typeof b.soCauDung === 'number' && (
                          <>
                            <span>·</span>
                            {/* Cùng khuôn với cổng học sinh và báo cáo — cấm
                                trừ ngược `tongSoCau - soCauDung`. */}
                            <DongDemCau so={{ ...b, tongCau: b.tongSoCau }} />
                          </>
                        )}
                        <span>·</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Xem báo cáo chi tiết</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                          {b.diem.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">điểm</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCaDangXem(b)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition tap-target cursor-pointer"
                      >
                        <span>Báo cáo</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Ô 2: 4 CHẾ ĐỘ GIAO BÀI CHO CON ("BÀI CỦA MOM GIAO") */}
          <div>
            <KhoiKhacPhuc3CheDo
              sbd={sbdHienTai || ''}
              hoTen={hoTenCon || 'Con'}
              dsLichSu={dsBaiThi}
              scriptUrl={scriptUrl}
              vaiTro="ph"
              dsMomGiao={dsMomGiao}
              thongBaoMom={thongBaoMom}
              onGiaoBaiChoCon={xuLyGiaoBaiTrucTiep}
              onXemKetQuaMom={(bai) => {
                void (async () => {
                  try {
                    const data = await momApi('review', { id: bai.id, sbd: sbdHienTai || '' })
                    setXemPhieuHtml(momReviewHtml(chuanHoaBaiMom(data.item || bai)))
                  } catch {
                    setXemPhieuHtml(momReviewHtml(chuanHoaBaiMom(bai)))
                  }
                })()
              }}
            />
          </div>
        </div>
      </main>

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

      {/* MODAL BÁO CÁO CA THI CHI TIẾT CHUẨN GOOGLE MATERIAL 3 */}
      {caDangXem && (
        <BaoCaoCaThiPhuHuynhModal
          baiThi={caDangXem}
          hoTenCon={hoTenCon}
          sbd={sbdHienTai || ''}
          lop={lopCon}
          scriptUrl={scriptUrl}
          onClose={() => setCaDangXem(null)}
          onGiaoBaiChoCon={(ds, tieuDe) => {
            setCaDangXem(null)
            if (tieuDe) {
              void xuLyGiaoBaiTrucTiep(ds, tieuDe)
            } else {
              void xuLyTaoBaiCuaMomTuCa(ds, caDangXem.maCa)
            }
          }}
          onNhanTinChoThay={(noiDung) => {
            guiTinNhan({
              nguoiGui: { vai: 'ph', sbd: sbdHienTai || '', hoTen: `Phụ huynh em ${hoTenCon}`, lop: lopCon },
              nguoiNhan: { vai: 'gv', hoTen: 'Thầy Đỗ Đại Học' },
              noiDung,
            })
            alert('Đã gửi tin nhắn đến Thầy Đỗ Đại Học! Thầy sẽ phản hồi sớm nhất trên hệ thống.')
          }}
          onXemPhieuGoc={(html) => {
            setXemPhieuHtml(html)
          }}
        />
      )}

      {/* MODAL KHẮC PHỤC CÂU SAI ĐỒNG BỘ 3 LỰA CHỌN CHO PHỤ HUYNH */}
      {dsCauSaiModalMom && (
        <ModalKhacPhucCauSai
          isOpen={Boolean(dsCauSaiModalMom)}
          onClose={() => setDsCauSaiModalMom(null)}
          dsCauSai={dsCauSaiModalMom}
          hoTen={hoTenCon || sbdHienTai || 'Học sinh'}
          sbd={sbdHienTai || ''}
          tieuDeCa={tieuDeCaMom}
          onGiaoBaiChoCon={(dsCau, tieuDe) => xuLyGiaoBaiTrucTiep(dsCau, tieuDe)}
          onTaoPhieuXong={(html) => {
            setDsCauSaiModalMom(null)
            setXemPhieuHtml(html)
          }}
        />
      )}
    </div>
  )
}
