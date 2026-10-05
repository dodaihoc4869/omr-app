// MÀN ĐĂNG NHẬP CỦA CỔNG HỌC SINH (+ đặt mật khẩu lần đầu) — tách khỏi StudentPortalScreen.tsx (05/10, tối ưu mở app học sinh).
// Đây là màn ĐẦU TIÊN máy em mới thấy. Trước đây nó nằm trong mảnh cổng (≈ 75 KB nén + ~35 mảnh con) nên máy phải tải cả cổng rồi mới hiện
// ô SBD. Nay vỏ `AppHocSinh` dựng màn này trước (mảnh nhỏ), mảnh cổng tải nền sau khi màn hiện. Chữ, bố cục, lớp CSS, luồng gọi máy chủ
// GIỮ NGUYÊN như bản trong StudentPortalScreen (cây JSX chép nguyên văn); cổng vẫn dùng chính màn này khi em đăng xuất.
// Lệnh máy chủ được TRAO VÀO (`api`): cổng truyền đúng hàm nó nhập từ exam-api (phép kiểm giả lập ở đó), vỏ nhẹ truyền thẳng từ
// hs-dang-nhap-api.ts — cùng một hàm (exam-api xuất lại), không phải tải exam-api trước khi hiện màn.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, Eye, EyeOff, Lock, LogIn, RefreshCw, Sparkles } from 'lucide-react'
import { LoiChao } from '../components/bat-linh/LoiChao'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import { voiHanCho } from '../lib/han-cho'
import type { hsDangNhapApi, hsDatMatKhauApi } from '../lib/hs-dang-nhap-api'
import type { ThongTinHs } from '../lib/phien-hoc-sinh'

export interface ApiDangNhapHs {
  dangNhap: typeof hsDangNhapApi
  datMatKhau: typeof hsDatMatKhauApi
}

/** Hỏi địa chỉ máy chủ (đọc IndexedDB) — hạn 8 giây như bản cũ, lỗi ⇒ rỗng (lệnh đăng nhập tự hỏi lại). */
const hoiDiaChi = () => voiHanCho(loadScriptUrlHoacMacDinh(), 8000, 'timeout').catch(() => '')

/**
 * `onDangNhap` nhận phiên đã xác thực: nơi gọi CẤT phiên (localStorage) rồi chuyển màn — gọi ngay trong lượt xử lý như bản cũ, nên máy chặn
 * lưu thì lỗi hiện đúng ở ô báo lỗi của form. Trả lời hứa (vỏ nhẹ chờ mảnh cổng về) ⇒ nút giữ vòng quay tới khi xong.
 * `logo`: khối thương hiệu đầu thẻ — nơi gọi trao `<LogoDoc vai="hs" size={48} />` (logo-bo-moi-1909: màn đăng nhập học sinh dùng LogoDoc 48).
 */
export default function DangNhapHocSinh({ api, onDangNhap, logo }: { api: ApiDangNhapHs; onDangNhap: (t: ThongTinHs) => void | Promise<void>; logo: ReactNode }) {
  // Đăng nhập state
  const [sbdInput, setSbdInput] = useState('')
  const [matKhauInput, setMatKhauInput] = useState('')
  const [hienMatKhau, setHienMatKhau] = useState(false)
  const [dangXuLyDangNhap, setDangXuLyDangNhap] = useState(false)
  const [loiDangNhap, setLoiDangNhap] = useState('')

  // Đặt mật khẩu lần đầu
  const [chuaCoMatKhau, setChuaCoMatKhau] = useState(false)
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('')
  const [dangDatMatKhau, setDangDatMatKhau] = useState(false)
  const [loiDatMatKhau, setLoiDatMatKhau] = useState('')

  // HỎI SẴN ĐỊA CHỈ MÁY CHỦ lúc màn vừa hiện (đọc IndexedDB mất vài trăm ms trên máy yếu) — để lúc em bấm Đăng nhập lệnh đi ngay.
  // Hỏi ra rỗng (máy mới chưa nạp xong cấu hình) thì lúc bấm hỏi lại như bản cũ.
  const diaChiSom = useRef<Promise<string> | null>(null)
  useEffect(() => {
    diaChiSom.current = hoiDiaChi()
  }, [])
  const layDiaChi = async () => (diaChiSom.current && (await diaChiSom.current)) || hoiDiaChi()

  const xuLyDangNhap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const sbd = sbdInput.trim()
    if (!sbd) {
      setLoiDangNhap('Vui lòng nhập số báo danh (SBD)')
      return
    }
    setDangXuLyDangNhap(true)
    setLoiDangNhap('')
    try {
      const url = await layDiaChi()
      const res = await voiHanCho(api.dangNhap(url, sbd, matKhauInput.trim()), 15000, 'Máy chủ không trả lời — em thử lại sau ít phút.').catch(e => ({ ok: false, error: e.message } as any))
      if (res.chuaCoMatKhau) {
        setChuaCoMatKhau(true)
        setDangXuLyDangNhap(false)
        return
      }
      if (!res.ok) {
        setLoiDangNhap(res.error || 'Đăng nhập không thành công. Kiểm tra lại SBD hoặc mật khẩu.')
        return
      }
      await onDangNhap({
        sbd: res.sbd || sbd,
        hoTen: res.hoTen || `Học sinh ${sbd}`,
        lop: res.lop || '',
        namSinh: res.namSinh || '',
        token: res.token,
      })
    } catch (err) {
      setLoiDangNhap(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ')
    } finally {
      setDangXuLyDangNhap(false)
    }
  }

  const xuLyDatMatKhau = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!matKhauMoi || matKhauMoi.length < 6) {
      setLoiDatMatKhau('Mật khẩu mới phải có tối thiểu 6 ký tự')
      return
    }
    if (matKhauMoi !== xacNhanMatKhau) {
      setLoiDatMatKhau('Xác nhận mật khẩu không khớp')
      return
    }
    setDangDatMatKhau(true)
    setLoiDatMatKhau('')
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await api.datMatKhau(url, sbdInput.trim(), matKhauMoi.trim())
      if (!res.ok) {
        setLoiDatMatKhau(res.error || 'Không thể đặt mật khẩu')
        return
      }
      // Sau khi đặt thành công, tự động đăng nhập
      setMatKhauInput(matKhauMoi)
      const resDn = await api.dangNhap(url, sbdInput.trim(), matKhauMoi.trim())
      if (resDn.ok) {
        await onDangNhap({
          sbd: resDn.sbd || sbdInput.trim(),
          hoTen: resDn.hoTen || `Học sinh ${sbdInput.trim()}`,
          lop: resDn.lop || '',
          namSinh: resDn.namSinh || '',
          token: resDn.token,
        })
        setChuaCoMatKhau(false)
      } else {
        setChuaCoMatKhau(false)
        setLoiDangNhap('Đặt mật khẩu thành công! Vui lòng đăng nhập.')
      }
    } catch (err) {
      setLoiDatMatKhau(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ')
    } finally {
      setDangDatMatKhau(false)
    }
  }

  return (
    <div className="bl-login">
      <div className="bl-login__card">
        <div className="bl-login__brand">{logo}</div>
        <LoiChao vai="hs" />

        {chuaCoMatKhau ? (
          <form onSubmit={xuLyDatMatKhau} className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong>Thiết lập mật khẩu lần đầu:</strong> SBD <strong>{sbdInput}</strong> chưa có mật khẩu. Em hãy tạo mật khẩu mới (tối thiểu 6 ký tự) để đăng nhập vào các lần sau.
              </div>
            </div>

            {loiDatMatKhau && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loiDatMatKhau}</span>
              </div>
            )}

            <div>
              <label htmlFor="hs-mk-moi" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                id="hs-mk-moi"
                type="password"
                value={matKhauMoi}
                onChange={(e) => setMatKhauMoi(e.target.value)}
                placeholder="Nhập mật khẩu mới…"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                required
              />
            </div>

            <div>
              <label htmlFor="hs-mk-xac-nhan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                id="hs-mk-xac-nhan"
                type="password"
                value={xacNhanMatKhau}
                onChange={(e) => setXacNhanMatKhau(e.target.value)}
                placeholder="Nhập lại mật khẩu…"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                required
              />
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setChuaCoMatKhau(false)}
                className="w-1/3 min-h-[48px] py-2.5 px-3 rounded-full btn-google-outlined text-sm font-semibold cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={dangDatMatKhau}
                className="w-2/3 min-h-[48px] py-2.5 px-4 rounded-full btn-google-primary text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {dangDatMatKhau ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Xác nhận & Đăng nhập</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={xuLyDangNhap} className="space-y-4">
            {loiDangNhap && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loiDangNhap}</span>
              </div>
            )}

            <div>
              <label htmlFor="hs-dn-sbd" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số báo danh (SBD)
              </label>
              <input
                id="hs-dn-sbd"
                type="text"
                inputMode="numeric"
                value={sbdInput}
                onChange={(e) => setSbdInput(e.target.value)}
                placeholder="Ví dụ: 110234 hoặc 12026"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono transition"
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="hs-dn-mat-khau" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-slate-400">
                  (Lần đầu chưa có để trống để đặt)
                </span>
              </div>
              <div className="relative">
                <input
                  id="hs-dn-mat-khau"
                  type={hienMatKhau ? 'text' : 'password'}
                  value={matKhauInput}
                  onChange={(e) => setMatKhauInput(e.target.value)}
                  placeholder="Nhập mật khẩu của em…"
                  className="w-full min-h-[48px] px-4 py-2.5 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setHienMatKhau(!hienMatKhau)}
                  aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {hienMatKhau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={dangXuLyDangNhap}
              className="btn-google-primary w-full min-h-[48px] py-3 px-4 text-sm disabled:opacity-50 mt-3 shadow-sm cursor-pointer"
            >
              {dangXuLyDangNhap ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Đăng nhập</span>
            </button>

            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-400">
                Quên mật khẩu: nhắn thầy để đặt lại.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
