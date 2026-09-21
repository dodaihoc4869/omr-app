// APP PHỤ HUYNH MỚI (thầy chốt mẫu 21/09; docs/ban-ve-ph-moi-thu-ve-con-2109/; đề bài prompt-ph-moi-thu-ve-con-2109.md): đăng nhập bằng SBD/liên kết riêng của con → MÀN CHÍNH (lời chào, "Hôm nay của con", "Ca kiểm tra gần nhất",
// dải cảnh báo của thầy, MỘT nút "Giao thêm bài cho con" dính đáy, chân "Đổi số báo danh") → bảng "MỌI THỨ VỀ CON" (gói tải lười). Dữ liệu: hai lệnh /ph/tat-ca-ve-con + /ph/chi-tiet-cau-ve-con (src/lib/ph-moi/) + /ph/giao-them.
// Không menu, không tab, không thần thú/EXP/game. Danh sách đã gỡ ở lượt trước: docs/ph-toi-gian-2109.md.
import { Suspense, lazy, useEffect, useState } from 'react'
import { datPassPhuHuynh } from '../lib/mom-api'
import { docPass, nhanPassTuDiaChi, xacDinhPhuHuynh, xoaPass } from '../lib/ph-token'
import { taiThongTinPhuHuynh } from '../lib/bo-nao-lay-loi-ph'
import { baoDaXemPhuHuynh } from '../lib/canh-bao-thay-may-chu'
import type { CanhBaoThay } from '../lib/canh-bao-thay-hien-thi'
import { useGioHocTap } from '../hooks/useGioHocTap'
import { Search, HelpCircle, RefreshCw, AlertCircle } from 'lucide-react'
import LogoApp from '../components/LogoApp'
import { LogoDoc } from '../components/LogoVai'
import InfographicHuongDan from '../components/InfographicHuongDan'
import ManChinh from '../components/ph-moi/ManChinh'
import { tenTheoSbd } from '../lib/exam-api'
import { useGiaoThem } from '../lib/use-giao-them'
import { useTatCaVeCon } from '../lib/ph-moi/use-tat-ca-ve-con'
import { loadScriptUrl } from '../lib/exam-db'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import '../components/m3'

// Bảng "Mọi thứ về con" nặng (ChemText + 9 khối): gói tải lười riêng, KHÔNG vào gói vào app / precache gói vào.
const BangMoiThu = lazy(() => import('../components/ph-moi/BangMoiThu'))

const SBD_STORAGE_KEY = 'omr_ph_sbd'

export default function ParentPortalScreen() {
  const [sbdInput, setSbdInput] = useState('')
  const [sbdHienTai, setSbdHienTai] = useState<string | null>(null)
  const [hoTenCon, setHoTenCon] = useState('')
  const [lopCon, setLopCon] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')
  const [dangTai, setDangTai] = useState(false)
  const [thongBaoLoi, setThongBaoLoi] = useState('')
  const [hienHuongDan, setHienHuongDan] = useState(false)
  // Đang ở màn chính hay ở bảng; `mucDau` = khối bảng phải cuộn tới khi mở (thẻ "Ca kiểm tra gần nhất").
  const [xemBang, setXemBang] = useState<{ mucDau?: 'ca-kiem-tra' } | null>(null)
  const nowHocTap = useGioHocTap()
  // "Cảnh báo của thầy" cho phụ huynh (lời cho phụ huynh, cửa sổ 72 giờ, chỉ đúng con; lệnh /ph/ke-hoach bằng token phụ huynh): MỘT dải thụ động ở màn chính. Lời Bộ não/thư tuần của lệnh này KHÔNG dùng.
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
  const phMoi = useTatCaVeCon(sbdHienTai)

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
    setXemBang(null)
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

  // GIAO DIỆN 2: ĐÃ ĐĂNG NHẬP — màn chính (mặc định) hoặc bảng "Mọi thứ về con" (khi đã có dữ liệu). Cuộn về đầu mỗi lần đổi màn.
  const veManChinh = () => {
    setXemBang(null)
    window.scrollTo?.(0, 0)
  }
  return (
    <div className="m3">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        {xemBang && phMoi.pm ? (
          <Suspense fallback={<p role="status" className="p-6 text-sm text-slate-500">Đang mở bảng của con…</p>}>
            <BangMoiThu pm={phMoi.pm} sbd={sbdHienTai ?? ''} lop={lopCon} giaoThem={giaoThem} onVe={veManChinh} mucDau={xemBang.mucDau} />
          </Suspense>
        ) : (
          <ManChinh
            v={phMoi}
            tenCon={hoTenCon}
            lop={lopCon}
            sbd={sbdHienTai}
            now={nowHocTap}
            canhBao={canhBaoPh}
            onCanhBaoDaXem={(cb) => void baoDaXemPhuHuynh(cb.id)}
            giaoThem={giaoThem}
            onMoBang={(mucDau) => {
              setXemBang({ mucDau })
              window.scrollTo?.(0, 0)
            }}
            onDoiSbd={dangXuat}
          />
        )}
      </div>
    </div>
  )
}
