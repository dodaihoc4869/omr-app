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
  Heart,
  Clock,
  X,
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
  tong?: number | null
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

// Danh sách câu nói tôn vinh cha mẹ - cập nhật khác nhau mỗi ngày lúc 00:01
const CAU_NOI_TRI_AN_CHA_ME = [
  { cau: 'Đi khắp thế gian không ai tốt bằng Mẹ, gánh nặng cuộc đời không ai khổ bằng Cha.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Tình thương của cha mẹ là ngọn hải đăng soi sáng từng bước chân con trên đường đời.', tacGia: 'Danh ngôn giáo dục' },
  { cau: 'Bàn tay cha mẹ nâng bước con đi, tình yêu cha mẹ chắp cánh mọi ước mơ thành sự thật.', tacGia: 'Tri ân phụ mẫu' },
  { cau: 'Không có kỳ quan nào vĩ đại hơn trái tim người mẹ, không có điểm tựa nào vững chãi hơn bờ vai người cha.', tacGia: 'Ngạn ngữ phương Đông' },
  { cau: 'Mỗi bước con trưởng thành là gom góp bao giọt mồ hôi và tình thương lặng thầm của cha mẹ.', tacGia: 'Tâm tình cha mẹ' },
  { cau: 'Cơm cha áo mẹ chữ thầy, nghĩ sao cho bõ những ngày ước ao.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Tình cha ấm áp như vầng thái dương, lòng mẹ dịu êm như dòng suối mát lành.', tacGia: 'Lời tri ân' },
  { cau: 'Cha mẹ là bến đỗ bình yên nhất, nơi con luôn tìm thấy sự chở che sau mọi giông bão.', tacGia: 'Danh ngôn cuộc sống' },
  { cau: 'Những hy sinh thầm lặng của cha mẹ hôm nay chính là nền móng tương lai rạng rỡ của con ngày mai.', tacGia: 'Tri ân gia đình' },
  { cau: 'Tấm lòng cha mẹ rộng lớn hơn biển cả, sâu thẳm hơn ngàn con suối mát đầu nguồn.', tacGia: 'Ca dao phụ mẫu' },
  { cau: 'Con dù lớn vẫn là con của mẹ, đi hết đời lòng mẹ vẫn theo con.', tacGia: 'Nhà thơ Chế Lan Viên' },
  { cau: 'Ơn cha nặng lắm ai ơi, nghĩa mẹ bằng trời chín tháng cưu mang.', tacGia: 'Ca dao Việt Nam' },
  { cau: 'Phía sau sự nỗ lực của con luôn là ánh mắt dõi theo đầy tin yêu và hy vọng của cha mẹ.', tacGia: 'Tâm tình cha mẹ' },
  { cau: 'Hạnh phúc lớn nhất của đời người là có cha mẹ dõi theo và đồng hành trên từng chặng đường.', tacGia: 'Danh ngôn phụ mẫu' },
]

const CAU_NOI_DONG_HANH = [
  { cau: 'Sự kiên nhẫn và đồng hành của cha mẹ là món quà vô giá, là bệ phóng vững chắc nhất cho con trẻ.', tacGia: 'Tâm lý giáo dục' },
  { cau: 'Khi cha mẹ trao niềm tin và sự thấu hiểu, con cái sẽ có thêm muôn phần dũng khí chinh phục tri thức.', tacGia: 'Đồng hành cùng con' },
  { cau: 'Dạy con bằng sự bao dung, động viên con bằng niềm tin - tương lai tươi sáng bắt đầu từ mái ấm.', tacGia: 'Danh ngôn giáo dục' },
  { cau: 'Không gì tiếp thêm sức mạnh cho con bằng ánh mắt khích lệ và bờ vai ấm áp của cha mẹ.', tacGia: 'Học cách yêu thương' },
  { cau: 'Cha mẹ là người thầy đầu tiên, vĩ đại nhất và cũng là chỗ dựa bình yên suốt cuộc đời con.', tacGia: 'Ngạn ngữ thế giới' },
  { cau: 'Mỗi lời động viên kịp thời của cha mẹ là một hạt mầm tự tin nở hoa trong tâm hồn con.', tacGia: 'Nghệ thuật làm cha mẹ' },
  { cau: 'Đồng hành cùng con không chỉ là chỉ đường, mà là cùng con vượt qua những thử thách đầu đời.', tacGia: 'Đồng hành cùng con' },
  { cau: 'Thành công của con không chỉ đo bằng điểm số, mà bằng cả hành trình kiên trì cha mẹ đã kề bên.', tacGia: 'Tâm sự phụ huynh' },
  { cau: 'Một đứa trẻ được cha mẹ lắng nghe và tin tưởng sẽ luôn biết đứng dậy sau mỗi lần vấp ngã.', tacGia: 'Tâm lý học' },
  { cau: 'Hãy dành cho con tình yêu vô điều kiện và niềm tin trọn vẹn, con sẽ tự tin bay cao bay xa.', tacGia: 'Chắp cánh ước mơ' },
  { cau: 'Tình yêu thương và sự kiên trì của cha mẹ sẽ cảm hóa và biến mọi khó khăn thành động lực.', tacGia: 'Danh ngôn nuôi dạy con' },
  { cau: 'Cha mẹ đồng hành là ngọn đuốc thắp sáng con đường tìm kiếm tri thức và tương lai của con.', tacGia: 'Tri ân phụ mẫu' },
]

function layCauNoiTheoNgay() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const vn = new Date(utc + 3600000 * 7)
  const dayNumber = Math.floor(vn.getTime() / (1000 * 60 * 60 * 24))
  const triAn = CAU_NOI_TRI_AN_CHA_ME[dayNumber % CAU_NOI_TRI_AN_CHA_ME.length]
  const dongHanh = CAU_NOI_DONG_HANH[(dayNumber + 3) % CAU_NOI_DONG_HANH.length]
  return { triAn, dongHanh }
}

export default function ParentPortalScreen() {
  const { triAn: cauNoiTriAn, dongHanh: cauNoiDongHanh } = layCauNoiTheoNgay()
  const [tabPh, setTabPh] = useState<'diem' | 'giaobai' | null>(null)
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
                diem: typeof c.tong === 'number' ? c.tong : (typeof c.diem === 'number' ? c.diem : 0),
                tong: typeof c.tong === 'number' ? c.tong : (typeof c.diem === 'number' ? c.diem : 0),
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
        {/* BANNER TÔN VINH CHA MẸ & THÔNG TIN ĐỒNG HÀNH (GOOGLE STYLE 3 PHẦN RIÊNG BIỆT) */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm relative overflow-hidden p-4 sm:p-5">
          {/* Vạch 4 màu Google chuẩn */}
          <div className="h-1 absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-rose-500 via-amber-400 to-emerald-500" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 mt-1">
            {/* PHẦN 1: THÔNG TIN ĐỒNG HÀNH CÙNG CON (Google Blue) */}
            <div className="rounded-2xl border-2 border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                  <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
                  <span>Cổng Đồng Hành Cùng Con</span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-2.5 leading-snug">
                  Chào Quý Phụ huynh<br />
                  <span className="text-blue-600 dark:text-blue-400">của em {hoTenCon || 'học sinh'}!</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Nơi Phụ huynh xem toàn bộ kết quả ca thi của con và chủ động tạo đề luyện khắc phục lỗi sai dành riêng cho con.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Tổng số ca thi:</span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black">
                  {dsBaiThi.length} ca
                </span>
              </div>
            </div>

            {/* PHẦN 2: TÔN VINH CHA MẸ - TÌNH THƯƠNG BAO LA (Google Red / Rose) */}
            <div className="rounded-2xl border-2 border-rose-200/80 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/60 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/40 p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                    <Heart size={13} className="text-rose-600 dark:text-rose-400" fill="currentColor" />
                    <span>Lời Tri Ân Cha Mẹ</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                    00:01 mỗi ngày
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    "{cauNoiTriAn.cau}"
                  </p>
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 text-right">
                    — {cauNoiTriAn.tacGia}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/60 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                <Clock size={12} className="shrink-0" />
                <span>Cập nhật câu mới mỗi ngày lúc 00:01</span>
              </div>
            </div>

            {/* PHẦN 3: TÔN VINH CHA MẸ - ĐỒNG HÀNH & NIỀM TIN (Google Amber / Green) */}
            <div className="rounded-2xl border-2 border-amber-200/80 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40 p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                    <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                    <span>Đồng Hành Cùng Con</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Bệ phóng tương lai
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    "{cauNoiDongHanh.cau}"
                  </p>
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 text-right">
                    — {cauNoiDongHanh.tacGia}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-100 dark:border-amber-900/60 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                <Calendar size={12} className="shrink-0" />
                <span>Tri ân tình thương phụ mẫu · Giờ Việt Nam</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <BangTinPhuHuynh
            sbd={sbdHienTai}
            onSent={() => void napDanhSachMomGiao(sbdHienTai)}
            activeTab={tabPh}
            onSelectTab={(tab) => setTabPh((prev) => (prev === tab ? null : (tab as any)))}
            tabStats={{ diemCount: dsBaiThi.length }}
          />
        </div>

        {/* NỘI DUNG CHỨC NĂNG MỞ RA BÊN DƯỚI KHI BẤM THẺ */}
        {tabPh !== null && (
          <div className="space-y-4 animate-google-fade">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {tabPh === 'diem' ? 'Chi tiết: Báo Cáo Điểm Các Ca Thi' : 'Chi tiết: 4 Chế Độ Giao Bài Cho Con'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTabPh(null)}
                className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <X size={14} />
                <span>Thu gọn ✕</span>
              </button>
            </div>

            {/* Ô 1: XEM BÁO CÁO CỦA CON */}
            {tabPh === 'diem' && (
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
                                <DongDemCau so={{ ...b, tongCau: b.tongSoCau }} />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                              {typeof b.diem === 'number' ? b.diem.toFixed(2) : typeof b.tong === 'number' ? b.tong.toFixed(2) : '--'}
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
            )}

            {/* Ô 2: 4 CHẾ ĐỘ GIAO BÀI CHO CON ("BÀI CỦA MOM GIAO") */}
            {tabPh === 'giaobai' && (
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
            )}
          </div>
        )}
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
