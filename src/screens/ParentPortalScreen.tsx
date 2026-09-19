import BangTinPhuHuynh from '../components/BangTinPhuHuynh'
import BangNhiemVu from '../components/bang-nhiem-vu/BangNhiemVu'
import { mucMenuPhuHuynh } from '../components/bang-nhiem-vu/muc-menu'
import { dungBangNhiemVu } from '../lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../lib/tro-ly-ca-nhan'
import { useGioHocTap } from '../hooks/useGioHocTap'
import { useBanNho, useKeHoachNgay } from '../components/bang-nhiem-vu/may-chu'
import { momApi, migrateMom, momReviewHtml, chuanHoaBaiMom, parentNewsApi } from '../lib/mom-api'
import KhoiKhacPhuc3CheDo from '../components/KhoiKhacPhuc3CheDo'
import { useEffect, useMemo, useState } from 'react'
import DongDemCau from '../components/DongDemCau'
import {
  Search,
  BookOpen,
  Calendar,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react'
import LogoApp from '../components/LogoApp'
import NutQuayLai from '../components/NutQuayLai'
import InfographicHuongDan from '../components/InfographicHuongDan'
import KhungXemPhieu from '../components/KhungXemPhieu'
import BaoCaoCaThiPhuHuynhModal from '../components/BaoCaoCaThiPhuHuynhModal'
import ModalKhacPhucCauSai from '../components/ModalKhacPhucCauSai'
import { hopLeDeRut } from '../lib/loc-cau-rut'
import { hsBtvnApi, hsCauSaiApi, hsLichSuCaApi, tenTheoSbd } from '../lib/exam-api'
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

export default function ParentPortalScreen() {
  const [tabPh, setTabPh] = useState<'diem' | 'khacphuc' | 'bantin' | null>(null)
  const [cheDoKhacPhuc, setCheDoKhacPhuc] = useState<1 | 2 | 3 | 4>(1)
  const [sbdInput, setSbdInput] = useState('')
  const [sbdHienTai, setSbdHienTai] = useState<string | null>(null)
  const [hoTenCon, setHoTenCon] = useState('')
  const [lopCon, setLopCon] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [thongBaoLoi, setThongBaoLoi] = useState('')
  const [tongSoCauSaiCon, setTongSoCauSaiCon] = useState(0)

  // Dữ liệu con
  const [dsBaiThi, setDsBaiThi] = useState<BaiThiCuaCon[]>([])
  const [caDangXem, setCaDangXem] = useState<BaiThiCuaCon | null>(null)
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])
  // Bảng nhiệm vụ: skeleton tới khi lượt nạp bài gia đình giao đầu tiên xong (kể cả lỗi).
  const [daNapMomLanDau, setDaNapMomLanDau] = useState(false)
  // BTVN của con (`/hs/btvn` tra theo SBD, như màn học sinh): lấy TÊN bài cho kế hoạch ngày và nguồn dự phòng.
  const [dsBtvnCon, setDsBtvnCon] = useState<any[]>([])
  // Bài hằng ngày đã cá nhân hoá (Kênh 5, /parent-news): số câu còn dư + lý do của máy chủ, và bài đã giao hôm nay (nếu có).
  const [deXuat, setDeXuat] = useState<{ soCau: number; reason: string; dailyId: string | null } | null>(null)
  const [dangGiao, setDangGiao] = useState(false)
  const [thongBaoGiao, setThongBaoGiao] = useState<{ loai: 'ok' | 'loi'; chu: string } | null>(null)
  const nowHocTap = useGioHocTap()

  const caGanNhat = useMemo(() => {
    if (dsBaiThi.length === 0) return null
    return [...dsBaiThi].sort((a, b) => {
      const ta = a.ngayNop ? new Date(a.ngayNop).getTime() : 0
      const tb = b.ngayNop ? new Date(b.ngayNop).getTime() : 0
      return tb - ta
    })[0]
  }, [dsBaiThi])

  const keHoachNgay = useKeHoachNgay({ sbd: sbdHienTai ?? undefined }, !!sbdHienTai, 0)
  const duLieuNhiemVu = useMemo(
    () =>
      dungBangNhiemVu({
        keHoachTroLy: tongHopKeHoachTroLy({
          now: nowHocTap,
          sbd: sbdHienTai ?? '',
          hoTen: hoTenCon,
          dsBtvn: dsBtvnCon,
          dsMomGiao,
          dsLichSu: dsBaiThi.map((b) => ({ maCa: b.maCa, nopLuc: b.ngayNop, tongCau: b.tongSoCau })),
          tongCauSai: tongSoCauSaiCon > 0 ? tongSoCauSaiCon : dsBaiThi.reduce((acc, b) => acc + (b.soCauSai || 0), 0),
        }),
        now: nowHocTap,
        keHoachNgay: keHoachNgay.keHoach,
        cu: keHoachNgay.cu,
        dsBtvn: dsBtvnCon,
        dsMomGiao,
      }),
    [nowHocTap, sbdHienTai, hoTenCon, dsMomGiao, dsBtvnCon, dsBaiThi, tongSoCauSaiCon, keHoachNgay],
  )
  const sanSangBang = !dangTai && daNapMomLanDau && keHoachNgay.daXong
  const banNho = useBanNho(sbdHienTai ?? undefined, sanSangBang && !keHoachNgay.cu && duLieuNhiemVu.nguon === 'ke_hoach_ngay' ? duLieuNhiemVu : null)
  const dungBanNho = !!banNho && !sanSangBang

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
    } finally {
      setDaNapMomLanDau(true)
    }
  }
  const napDeXuat = async (sbd: string, daHuy: () => boolean = () => false) => {
    try {
      const r = await parentNewsApi('list', sbd)
      const rp = r?.report
      if (daHuy() || !rp || !Number.isFinite(Number(rp.questionCount))) return
      setDeXuat({ soCau: Number(rp.questionCount), reason: typeof rp.reason === 'string' ? rp.reason : '', dailyId: r?.daily?.id ?? null })
    } catch {
      /* Không có số liệu thì không nói gì (không tự bịa lý do). */
    }
  }
  const giaoHangNgay = async () => {
    if (!sbdHienTai || dangGiao) return
    setDangGiao(true)
    setThongBaoGiao(null)
    try {
      const r = await parentNewsApi('assign', sbdHienTai)
      setThongBaoGiao({
        loai: 'ok',
        chu: r?.alreadySent ? 'Bài hôm nay đã được giao trước đó. Không tạo thêm bài trùng.' : `Đã giao 1 bài gồm ${r?.questionCount} câu sang app của con.`,
      })
      await napDanhSachMomGiao(sbdHienTai)
      await napDeXuat(sbdHienTai)
    } catch (e) {
      setThongBaoGiao({ loai: 'loi', chu: e instanceof Error ? e.message : 'Chưa giao được bài. Vui lòng thử lại.' })
    } finally {
      setDangGiao(false)
    }
  }
  useEffect(() => {
    if (!sbdHienTai) return
    let huy = false
    const nap = async () => {
      try {
        const url = await loadScriptUrl().catch(() => '')
        const bt = await hsBtvnApi(url, sbdHienTai).catch(() => null)
        if (huy) return
        if (bt?.ok && Array.isArray(bt.items)) setDsBtvnCon(bt.items)
        void napDeXuat(sbdHienTai, () => huy)
      } catch {
        /* Không có số liệu thì không nói số. */
      }
    }
    void nap()
    const t = setInterval(() => { if (!document.hidden) void nap() }, 60000)
    return () => { huy = true; clearInterval(t) }
  }, [sbdHienTai])
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

        try {
          const resSai = await hsCauSaiApi(url, sbdSach, [])
          if (resSai && resSai.ok && Array.isArray(resSai.items)) {
            setTongSoCauSaiCon(resSai.items.length)
          }
        } catch {}
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
    setDaNapMomLanDau(false)
    setDsBtvnCon([])
    setDeXuat(null)
    setThongBaoGiao(null)
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

  // 1-CLICK GIAO BÀI KHẮC PHỤC CÂU SAI SANG APP CON THEO THUẬT TOÁN MỚI
  const xuLyGiaoBaiKhacPhuc1Click = async () => {
    if (!sbdHienTai) return
    setDangTaoMom(true)
    setThongBaoMom(null)

    try {
      let dsCauSai: any[] = []
      try {
        const res = await hsCauSaiApi(scriptUrl, sbdHienTai, [])
        if (res && res.ok && Array.isArray(res.items)) dsCauSai = res.items
      } catch {
        // bỏ qua lỗi nếu không lấy được câu sai
      }

      const hopLe = dsCauSai.filter((c) =>
        hopLeDeRut({
          phan: c.phan,
          maDe: c.maCa,
          dapAnDung: c.dapAnDung,
          text: c.text,
          choices: c.choices || c.ideas,
        })
      )

      if (hopLe.length === 0) {
        await xuLyGiaoBaiLuyen1Click()
        return
      }

      // Thuật toán sư phạm thích ứng:
      // Tồn nhiều (>= 15 câu): Gỡ nợ giảm tải -> chọn 4 câu căn bản nhất (ưu tiên Phần I & II cốt lõi)
      // Tồn trung bình (5-14 câu): Chọn 5 câu trọng tâm
      // Tồn ít (<= 4 câu): Chọn toàn bộ câu còn lại
      let soCauGiao = 5
      if (hopLe.length >= 15) soCauGiao = 4
      else if (hopLe.length <= 4) soCauGiao = hopLe.length

      const phanI = hopLe.filter((c) => c.phan === 'I')
      const phanII = hopLe.filter((c) => c.phan === 'II')
      const phanKhac = hopLe.filter((c) => c.phan !== 'I' && c.phan !== 'II')

      const dsChon: any[] = []
      for (const c of [...phanI, ...phanII, ...phanKhac]) {
        if (dsChon.length < soCauGiao) dsChon.push(c)
      }

      const tieuDe = `Bài khắc phục câu sai Mẹ giao (${dsChon.length} câu trọng tâm)`
      await xuLyGiaoBaiTrucTiep(dsChon, tieuDe)
      setThongBaoMom({
        loai: 'ok',
        chu: `✨ Đã giao ${dsChon.length} câu khắc phục trực tiếp sang app của con! Trợ lý của con đã nhận và đưa lên đầu danh sách làm bài (Thời hạn 2 tiếng).`,
      })
    } catch (e) {
      setThongBaoMom({
        loai: 'loi',
        chu: e instanceof Error ? e.message : 'Chưa giao được bài cho con',
      })
    } finally {
      setDangTaoMom(false)
    }
  }

  // 1-CLICK GIAO BÀI LUYỆN BỨT PHÁ SANG APP CON THEO THUẬT TOÁN MỚI
  const xuLyGiaoBaiLuyen1Click = async () => {
    if (!sbdHienTai) return
    setDangTaoMom(true)
    setThongBaoMom(null)

    try {
      const { loadExamSources } = await import('../lib/exam-db')
      const { cauLuyenTuNguon } = await import('../lib/bai-tap-pdf')
      const kho = await loadExamSources()
      const tatCaCau = cauLuyenTuNguon(kho)

      const hopLe = tatCaCau.filter((c) => c.phan && c.dapAn)
      const soCauGiao = Math.min(8, Math.max(5, hopLe.length > 8 ? 6 : hopLe.length))
      const dsChon = hopLe.slice(0, soCauGiao).map((c, i) => ({
        id: c.id || `cau_luyen_${i + 1}`,
        phan: c.phan,
        text: c.text,
        choices: c.luaChon,
        dapAn: c.dapAn,
        dapAnDung: c.dapAn,
        loiGiai: c.chot || (Array.isArray(c.buoc) ? c.buoc.join('\n') : ''),
        chuyenDe: c.chuyenDe || 'Luyện tập trọng tâm',
      }))

      if (dsChon.length === 0) {
        setThongBaoMom({ loai: 'loi', chu: 'Chưa rút được câu hỏi từ kho đề để giao cho con.' })
        return
      }

      const tieuDe = `Bài luyện bứt phá Mẹ giao (${dsChon.length} câu)`
      await xuLyGiaoBaiTrucTiep(dsChon, tieuDe)
      setThongBaoMom({
        loai: 'ok',
        chu: `✨ Đã giao ${dsChon.length} câu luyện tập sang app của con! Trợ lý của con đã nhận và mở trực tiếp để con làm ngay (Hạn 2 tiếng).`,
      })
    } catch (e) {
      setThongBaoMom({
        loai: 'loi',
        chu: e instanceof Error ? e.message : 'Chưa giao được bài luyện cho con',
      })
    } finally {
      setDangTaoMom(false)
    }
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
        <header className="px-4 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ paddingTop: 'env(safe-area-inset-top, 10px)' }}>
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

  // GIAO DIỆN 2: ĐÃ ĐĂNG NHẬP — MỘT màn "Bảng nhiệm vụ" đọc-chỉ; mọi màn cũ mở dạng sheet toàn màn.
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {tabPh === null && (
        <BangNhiemVu
          vaiTro="phuhuynh"
          hoTen={hoTenCon}
          now={nowHocTap}
          duLieu={dungBanNho ? banNho! : duLieuNhiemVu}
          dangTai={!sanSangBang && !dungBanNho}
          mucMenu={mucMenuPhuHuynh(setTabPh, dangXuat, {
            // Kết quả giao nhanh hiện ở khung thông báo của sheet "khắc phục", nên mở sheet ngay.
            khacPhuc: () => {
              setTabPh('khacphuc')
              void xuLyGiaoBaiKhacPhuc1Click()
            },
            luyen: () => {
              setTabPh('khacphuc')
              void xuLyGiaoBaiLuyen1Click()
            },
          })}
          onGiaoBai={() => setTabPh('khacphuc')}
          onGiaoHangNgay={() => void giaoHangNgay()}
          giaoBai={{
            reason: deXuat?.reason || undefined,
            soCauDeXuat: deXuat?.soCau,
            daGiao: (() => {
              const bai = deXuat?.dailyId ? dsMomGiao.find((m) => m.id === deXuat.dailyId) : undefined
              return bai ? { soCau: bai.soCau, trangThai: bai.trangThai === 'da_nop' ? 'da_nop' : bai.trangThai === 'dang_lam' ? 'dang_lam' : 'chua_lam' } : null
            })(),
            dangGui: dangGiao,
            thongBao: thongBaoGiao,
          }}
        />
      )}

      {/* FULLSCREEN CHỨC NĂNG PHỤ HUYNH: BẤM VÀO MỞ TOÀN MÀN HÌNH */}
      {tabPh !== null && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto flex flex-col animate-google-fade">
          {/* Header Toàn Màn Hình */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs">
            <NutQuayLai onClick={() => setTabPh(null)} label="Quay lại Bảng tin" />

            <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <h2 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                {tabPh === 'diem' && 'Báo Cáo Điểm Tất Cả Các Ca Thi'}
                {tabPh === 'khacphuc' && 'Khắc Phục Lỗi Sai & Luyện Đề (4 Lựa Chọn)'}
                {tabPh === 'bantin' && 'Bảng tin của con'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setTabPh(null)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="Đóng toàn màn hình"
            >
              <X size={16} />
              <span className="hidden sm:inline">Đóng</span>
            </button>
          </header>

          <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
            {/* SHEET BẢNG TIN CỦA CON: báo cáo trong ngày + 4 cách giao bài khắc phục */}
            {tabPh === 'bantin' && (
              <BangTinPhuHuynh
                sbd={sbdHienTai ?? ''}
                hoTen={hoTenCon}
                lop={lopCon}
                onSent={() => void napDanhSachMomGiao(sbdHienTai ?? '')}
                activeTab={tabPh}
                onSelectTab={(tab, cd) => {
                  if (cd) setCheDoKhacPhuc(cd)
                  setTabPh(tab as 'diem' | 'khacphuc' | 'bantin')
                }}
                tabStats={{ diemCount: dsBaiThi.length }}
                caGanNhat={caGanNhat}
              />
            )}

            {/* TAB 1: BÁO CÁO ĐIỂM CÁC CA THI */}
            {tabPh === 'diem' && (
              <div className="space-y-4 animate-google-fade">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Báo Cáo Điểm Các Ca Thi Của Con
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kết quả và chi tiết tất cả các ca thi con đã nộp
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900">
                    {dsBaiThi.length} ca thi
                  </span>
                </div>

                {/* DANH SÁCH CÁC CA THI */}
                <div className="space-y-3">
                  {dsBaiThi.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <BookOpen size={40} className="text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-medium">Chưa có kết quả ca thi nào của con được ghi nhận.</p>
                    </div>
                  ) : (
                    dsBaiThi.map((b) => (
                      <div
                        key={b.maCa}
                        onClick={() => setCaDangXem(b)}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-xs transition bg-white dark:bg-slate-900 flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 shrink-0">
                              #{b.maCa}
                            </span>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              {b.tenCa}
                            </h3>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2.5">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} />
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
                            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                              {typeof b.diem === 'number' ? b.diem.toFixed(2) : typeof b.tong === 'number' ? b.tong.toFixed(2) : '--'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-bold">điểm</div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCaDangXem(b)
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition tap-target cursor-pointer"
                          >
                            <span>Xem</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: KHẮC PHỤC & LUYỆN ĐỀ (4 LỰA CHỌN) */}
            {tabPh === 'khacphuc' && (
              <div className="animate-google-fade">
                <KhoiKhacPhuc3CheDo
                  sbd={sbdHienTai || ''}
                  hoTen={hoTenCon || 'Con'}
                  dsLichSu={dsBaiThi}
                  scriptUrl={scriptUrl}
                  vaiTro="ph"
                  initialCheDo={cheDoKhacPhuc}
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
          </main>
        </div>
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
