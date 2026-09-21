// APP PHỤ HUYNH — MỘT MÀN, MỘT NÚT (thầy lệnh 21/09, Nhật ký 97f3abe): đăng nhập bằng SBD/liên kết riêng của con → MỘT màn "Bảng nhiệm vụ" đọc-chỉ (lời chào, tiến độ hôm nay, dải cảnh báo của thầy,
// thẻ "Ca kiểm tra gần nhất của con" — bấm mở báo cáo đúng ca, việc hôm nay của con) + MỘT nút hành động "Giao thêm bài cho con" + chân màn "Đổi số báo danh". Đã GỠ: menu ba chấm, tab Xem điểm/Khắc phục/Bảng tin,
// giao nhanh, giao bài cũ (parent-news, KhoiKhacPhuc), Bộ não/thư tuần. Danh sách + lệnh máy chủ liên quan: docs/ph-toi-gian-2109.md.
import BangNhiemVu from '../components/bang-nhiem-vu/BangNhiemVu'
import { dungBangNhiemVu } from '../lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../lib/tro-ly-ca-nhan'
import { useGioHocTap } from '../hooks/useGioHocTap'
import { useBanNho, useKeHoachNgay } from '../components/bang-nhiem-vu/may-chu'
import { momApi, migrateMom, datPassPhuHuynh } from '../lib/mom-api'
import { docPass, nhanPassTuDiaChi, xacDinhPhuHuynh, xoaPass } from '../lib/ph-token'
import { useEffect, useMemo, useState } from 'react'
import { taiThongTinPhuHuynh } from '../lib/bo-nao-lay-loi-ph'
import { baoDaXemPhuHuynh } from '../lib/canh-bao-thay-may-chu'
import type { CanhBaoThay } from '../lib/canh-bao-thay-hien-thi'
import { Search, HelpCircle, RefreshCw, AlertCircle } from 'lucide-react'
import LogoApp from '../components/LogoApp'
import { LogoDoc } from '../components/LogoVai'
import InfographicHuongDan from '../components/InfographicHuongDan'
import BaoCaoCaThiPhuHuynhModal from '../components/BaoCaoCaThiPhuHuynhModal'
import { hsBtvnApi, hsCauSaiApi, hsLichSuCaApi, tenTheoSbd } from '../lib/exam-api'
import TheCaGanNhatCua from '../components/xem-diem/TheCaGanNhat'
import { chonTheCaGanNhat, type CaChuaCongBo } from '../lib/the-ca-gan-nhat'
import { useGiaoThem } from '../lib/use-giao-them'
import { loadScriptUrl } from '../lib/exam-db'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import '../components/m3'

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
  // Ca đã nộp mà thầy CHƯA công bố (`chuaCongBo[]` của /hs/lich-su): chỉ để vẽ thẻ trung tính "Thầy chưa công bố / chờ cả lớp" — không điểm.
  const [dsChuaCongBo, setDsChuaCongBo] = useState<CaChuaCongBo[]>([])
  const [caDangXem, setCaDangXem] = useState<BaiThiCuaCon | null>(null)
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])
  // Bảng nhiệm vụ: skeleton tới khi lượt nạp bài gia đình giao đầu tiên xong (kể cả lỗi).
  const [daNapMomLanDau, setDaNapMomLanDau] = useState(false)
  // BTVN của con (`/hs/btvn` tra theo SBD, như màn học sinh): lấy TÊN bài cho kế hoạch ngày và nguồn dự phòng.
  const [dsBtvnCon, setDsBtvnCon] = useState<any[]>([])
  const nowHocTap = useGioHocTap()
  // "Cảnh báo của thầy" cho phụ huynh (lời cho phụ huynh, cửa sổ 72 giờ, chỉ đúng con; lệnh /ph/ke-hoach bằng token phụ huynh): MỘT dải thụ động ở đầu màn. Lời Bộ não/thư tuần của lệnh này KHÔNG dùng nữa (đã gỡ màn; lệnh máy chủ giữ nguyên).
  const [canhBaoPh, setCanhBaoPh] = useState<CanhBaoThay[]>([])
  useEffect(() => {
    if (!sbdHienTai) {
      setCanhBaoPh([])
      return
    }
    let huy = false
    void taiThongTinPhuHuynh().then((v) => {
      if (huy) return
      setCanhBaoPh(v.canhBao)
    })
    return () => {
      huy = true
    }
  }, [sbdHienTai])

  // MỘT nút "Giao thêm bài cho con": chạy với MỌI kiểu đăng nhập phụ huynh (mã liên kết riêng HOẶC SBD trần — máy chủ nhận cả hai).
  const giaoThem = useGiaoThem(!!sbdHienTai, undefined, sbdHienTai ?? undefined)
  const theCaGanNhat = useMemo(
    () =>
      chonTheCaGanNhat(
        dsBaiThi.map((b) => ({ maCa: b.maCa, tenCa: b.tenCa, nopLuc: b.ngayNop, tong: b.tong ?? b.diem, diemI: b.diemI, diemII: b.diemII, diemIII: b.diemIII, soCauDung: b.soCauDung, tongCau: b.tongSoCau })),
        dsChuaCongBo,
      ),
    [dsBaiThi, dsChuaCongBo],
  )
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

  const [hienHuongDan, setHienHuongDan] = useState(false)

  useEffect(() => {
    loadScriptUrl().then(async (u) => {
      setScriptUrl(u)
      // LIÊN KẾT RIÊNG CỦA CON (?ph=<pass>, giai đoạn mềm): nhận + xoá khỏi địa chỉ, xác định con bằng token; lỗi thì hiện câu của máy chủ
      // và cho nhập SBD như cũ. Không có liên kết mà máy đã nhớ pass thì dùng lại pass đó.
      const pass = nhanPassTuDiaChi() || docPass()
      if (pass) {
        const kq = await xacDinhPhuHuynh(pass)
        if (kq.ok) {
          datPassPhuHuynh(pass)
          void dangNhapPhuHuynh(kq.sbd, u, { hoTen: kq.hoTen, lop: kq.lop })
          return
        }
        xoaPass()
        datPassPhuHuynh('')
        setThongBaoLoi(kq.error)
      }
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
      try { await migrateMom(sbd) } catch { /* bài cũ chưa gửi hết: app tự thử lại ở lượt sau */ }
      const data = await momApi('parent-list', {sbd})
      let legacy: BaiMomGiao[] = []
      try { legacy = JSON.parse(localStorage.getItem(`omr_mom_btvn_${sbd}`) || '[]').filter((b: BaiMomGiao) => b.trangThai === 'da_nop' && !data.items.some((n: BaiMomGiao) => n.id === b.id)) } catch {}
      setDsMomGiao([...data.items, ...legacy])
    } catch {
      /* chưa đồng bộ được bài gia đình giao: bảng vẫn hiện kế hoạch của con */
    } finally {
      setDaNapMomLanDau(true)
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

  async function dangNhapPhuHuynh(sbd: string, urlParam?: string, conBiet?: { hoTen: string; lop: string }) {
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
      let ten = conBiet?.hoTen ?? ''
      let lop = conBiet?.lop ?? ''
      if (url && !conBiet) {
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
                tenCa: c.tenCa || `Ca kiểm tra mã ${c.maCa}`,
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
            setDsChuaCongBo(Array.isArray(ls.chuaCongBo) ? ls.chuaCongBo : [])
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
    xoaPass()
    datPassPhuHuynh('')
    setSbdHienTai(null)
    setHoTenCon('')
    setLopCon('')
    setDsBaiThi([])
    setDsChuaCongBo([])
    setDsMomGiao([])
    setDaNapMomLanDau(false)
    setDsBtvnCon([])
    setSbdInput('')
  }

  // GIAO DIỆN 1: CHƯA ĐĂNG NHẬP (NHẬP DUY NHẤT SBD CỦA CON)
  if (!sbdHienTai) {
    return (
      <div className="m3">
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <header className="px-4 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
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
            <div className="mb-6">
              <LogoDoc vai="ph" size={64} tieuDe />
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
                className="m3-nut-chinh w-full cursor-pointer"
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
      </div>
    )
  }

  // Thẻ "Ca kiểm tra gần nhất": ca ĐÃ công bố ⇒ bấm mở hộp báo cáo của ĐÚNG ca đó (tạm, tới khi bảng "Mọi thứ về con" được thầy chốt); ca chưa công bố ⇒ thẻ không bấm được.
  const moBaoCaoCa = () => {
    if (!theCaGanNhat || theCaGanNhat.kieu !== 'da_cong_bo') return
    const b = dsBaiThi.find((x) => x.maCa === theCaGanNhat.maCa)
    if (b) setCaDangXem(b)
  }

  // GIAO DIỆN 2: ĐÃ ĐĂNG NHẬP — MỘT màn "Bảng nhiệm vụ" đọc-chỉ + MỘT nút "Giao thêm bài cho con" + chân màn "Đổi số báo danh".
  return (
    <div className="m3">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <BangNhiemVu
          vaiTro="phuhuynh"
          hoTen={hoTenCon}
          now={nowHocTap}
          duLieu={dungBanNho ? banNho! : duLieuNhiemVu}
          dangTai={!sanSangBang && !dungBanNho}
          dangLamMoi={keHoachNgay.dangLamMoi}
          theCaGanNhat={<TheCaGanNhatCua the={theCaGanNhat} onMo={theCaGanNhat?.kieu === 'da_cong_bo' ? moBaoCaoCa : undefined} />}
          canhBaoPh={canhBaoPh}
          onCanhBaoDaXem={(cb) => void baoDaXemPhuHuynh(cb.id)}
          giaoThem={giaoThem}
          onDoiSbd={dangXuat}
        />

        {/* HỘP BÁO CÁO CA THI (chỉ xem — không nút giao bài khắc phục, không nhắn thầy) */}
        {caDangXem && (
          <BaoCaoCaThiPhuHuynhModal
            baiThi={caDangXem}
            hoTenCon={hoTenCon}
            sbd={sbdHienTai || ''}
            lop={lopCon}
            scriptUrl={scriptUrl}
            onClose={() => setCaDangXem(null)}
            khongGiaoBai
          />
        )}
      </div>
    </div>
  )
}
