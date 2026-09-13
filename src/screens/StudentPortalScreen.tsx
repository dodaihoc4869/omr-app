import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
  User,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowRight,
  Clock,
} from 'lucide-react'
import {
  hsDangNhapApi,
  hsDatMatKhauApi,
  hsLichSuCaApi,
  hsBtvnApi,
  hsCauSaiApi,
  type ChiTietCauRow,
} from '../lib/exam-api'
import { loadExamSources, loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import { rutDeChua } from '../lib/rut-de-chua'
import type { CauLuyen } from '../lib/bai-tap-pdf'
import { dangCua } from '../lib/dang-cau'
import { dungPhieu, type ThongTinPhieu } from '../lib/html-phieu'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { nhoVaiDaDung } from '../lib/vai-tro'

const KHOA_LUU_AUTH = 'omr_student_portal_auth'

interface ThongTinHs {
  sbd: string
  hoTen: string
  lop: string
  namSinh: string
  token?: string
}

function dinhDangNgayGio(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return iso
  const gio = String(d.getHours()).padStart(2, '0')
  const phut = String(d.getMinutes()).padStart(2, '0')
  const ngay = String(d.getDate()).padStart(2, '0')
  const thang = String(d.getMonth() + 1).padStart(2, '0')
  const nam = d.getFullYear()
  return `${gio}:${phut} ${ngay}/${thang}/${nam}`
}

function mauDiem(diem: number | null): string {
  if (diem === null || diem === undefined) return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
  if (diem >= 8.0) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800'
  if (diem >= 6.5) return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800'
  if (diem >= 5.0) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800'
  return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800'
}

type TabType = 'diem' | 'btvn' | 'khacphuc' | 'vaothi'

export default function StudentPortalScreen() {
  const [auth, setAuth] = useState<ThongTinHs | null>(() => {
    try {
      const luu = localStorage.getItem(KHOA_LUU_AUTH)
      return luu ? JSON.parse(luu) : null
    } catch {
      return null
    }
  })

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

  // Tab
  const [tab, setTab] = useState<TabType>('diem')

  // Dữ liệu ca thi & điểm
  const [dsLichSu, setDsLichSu] = useState<any[]>([])
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false)

  // Dữ liệu BTVN
  const [dsBtvn, setDsBtvn] = useState<any[]>([])
  const [dangTaiBtvn, setDangTaiBtvn] = useState(false)

  // Khắc phục câu sai
  const [cacCaChon, setCacCaChon] = useState<Set<string>>(new Set())
  const [dangTaoDeKhacPhuc, setDangTaoDeKhacPhuc] = useState(false)
  const [thongBaoKhacPhuc, setThongBaoKhacPhuc] = useState('')
  const [phieuHtml, setPhieuHtml] = useState('')

  // Vào thi
  const [maCaVaoThi, setMaCaVaoThi] = useState('')
  const [matKhauCaVaoThi, setMatKhauCaVaoThi] = useState('')
  const [loiVaoThi, setLoiVaoThi] = useState('')

  // Ghi nhớ vai hs
  useEffect(() => {
    nhoVaiDaDung('hs')
  }, [])

  // Nạp dữ liệu khi đã đăng nhập
  useEffect(() => {
    if (!auth) return
    let huy = false
    void (async () => {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      if (huy) return
      setDangTaiLichSu(true)
      const resLs = await hsLichSuCaApi(url, auth.sbd)
      if (!huy) {
        setDangTaiLichSu(false)
        if (resLs.ok && resLs.items) {
          setDsLichSu(resLs.items)
          // Mặc định chọn các ca có câu sai
          const coSai = new Set<string>()
          for (const it of resLs.items) {
            if ((it.soCauSai ?? 0) > 0) coSai.add(it.maCa)
          }
          setCacCaChon(coSai)
        }
      }

      setDangTaiBtvn(true)
      const resBt = await hsBtvnApi(url, auth.sbd)
      if (!huy) {
        setDangTaiBtvn(false)
        if (resBt.ok && resBt.items) {
          setDsBtvn(resBt.items)
        }
      }
    })()

    return () => {
      huy = true
    }
  }, [auth])

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
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await hsDangNhapApi(url, sbd, matKhauInput.trim())
      if (res.chuaCoMatKhau) {
        setChuaCoMatKhau(true)
        setDangXuLyDangNhap(false)
        return
      }
      if (!res.ok) {
        setLoiDangNhap(res.error || 'Đăng nhập không thành công. Kiểm tra lại SBD hoặc mật khẩu.')
        return
      }
      const thongTin: ThongTinHs = {
        sbd: res.sbd || sbd,
        hoTen: res.hoTen || `Học sinh ${sbd}`,
        lop: res.lop || '',
        namSinh: res.namSinh || '',
      }
      localStorage.setItem(KHOA_LUU_AUTH, JSON.stringify(thongTin))
      setAuth(thongTin)
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
      const res = await hsDatMatKhauApi(url, sbdInput.trim(), matKhauMoi.trim())
      if (!res.ok) {
        setLoiDatMatKhau(res.error || 'Không thể đặt mật khẩu')
        return
      }
      // Sau khi đặt thành công, tự động đăng nhập
      setMatKhauInput(matKhauMoi)
      const resDn = await hsDangNhapApi(url, sbdInput.trim(), matKhauMoi.trim())
      if (resDn.ok) {
        const thongTin: ThongTinHs = {
          sbd: resDn.sbd || sbdInput.trim(),
          hoTen: resDn.hoTen || `Học sinh ${sbdInput.trim()}`,
          lop: resDn.lop || '',
          namSinh: resDn.namSinh || '',
        }
        localStorage.setItem(KHOA_LUU_AUTH, JSON.stringify(thongTin))
        setAuth(thongTin)
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

  const dangXuat = () => {
    localStorage.removeItem(KHOA_LUU_AUTH)
    setAuth(null)
    setMatKhauInput('')
    setSbdInput('')
  }

  // Khắc phục câu sai: toggle chọn ca
  const toggleChonCa = (maCa: string) => {
    const s = new Set(cacCaChon)
    if (s.has(maCa)) s.delete(maCa)
    else s.add(maCa)
    setCacCaChon(s)
  }

  const chonTatCaCa = () => {
    if (cacCaChon.size === dsLichSu.length) {
      setCacCaChon(new Set())
    } else {
      setCacCaChon(new Set(dsLichSu.map((c) => c.maCa)))
    }
  }

  const tongSoCauSaiDaChon = useMemo(() => {
    let t = 0
    for (const c of dsLichSu) {
      if (cacCaChon.has(c.maCa)) {
        t += c.soCauSai ?? 0
      }
    }
    return t
  }, [dsLichSu, cacCaChon])

  // Rút đề khắc phục câu sai
  const taoDeKhacPhuc = async () => {
    if (!auth) return
    if (cacCaChon.size === 0) {
      setThongBaoKhacPhuc('Vui lòng chọn ít nhất một ca thi để khắc phục câu sai')
      return
    }
    setDangTaoDeKhacPhuc(true)
    setThongBaoKhacPhuc('')
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const dsMaCa = Array.from(cacCaChon)
      const res = await hsCauSaiApi(url, auth.sbd, dsMaCa)
      if (!res.ok || !res.items || res.items.length === 0) {
        setThongBaoKhacPhuc(res.error || 'Các ca đã chọn không có câu sai nào cần khắc phục!')
        setDangTaoDeKhacPhuc(false)
        return
      }

      // Tải kho đề nếu có
      let khoDe: any[] = []
      try {
        khoDe = await loadExamSources()
      } catch {
        khoDe = []
      }

      const rows: ChiTietCauRow[] = res.items.map((it) => ({
        soCau: it.soCau,
        phan: it.phan,
        qid: it.qid,
        chuyenDe: it.chuyenDe || '',
        mucDo: it.mucDo || '',
        dapAnChon: it.dapAnChon || '',
        dapAnDung: it.dapAnDung || '',
        dungSai: false,
        giay: null,
      }))

      let dsCauLuyen: CauLuyen[] = []
      if (khoDe && khoDe.length > 0) {
        try {
          const kq = rutDeChua({
            khoDe,
            rows,
            qidTranh: [],
            soCau: Math.max(res.items.length * 2, 10),
          })
          dsCauLuyen = kq.cau
        } catch {
          dsCauLuyen = []
        }
      }

      // Bổ sung các câu làm sai trực tiếp nếu kho đề chưa có câu tương ứng
      const qidDaCo = new Set(dsCauLuyen.map((c) => c.id))
      for (const it of res.items) {
        if (!qidDaCo.has(it.qid)) {
          const cl: CauLuyen = {
            phan: it.phan,
            id: it.qid,
            maDe: it.maCa,
            chuyenDe: it.chuyenDe || 'Hoá học',
            dang:
              (it.dang as any) ||
              dangCua({
                phan: it.phan,
                text: it.text,
                luaChon: it.choices ?? [],
                dapAn: it.dapAnDung,
                mucDo: it.mucDo as any,
              }),
            sao: 1,
            mucDo: (it.mucDo as any) || 'hieu',
            text: it.text,
            luaChon: it.choices || null,
            dapAn: it.dapAnDung,
            chot: it.loiGiai || '',
            lyDo: null,
            buoc: null,
            ketQua: it.dapAnDung,
            anhThanCau: it.imageDataUrl || it.hinhAnh,
            chuaCho: {
              qid: it.qid,
              soCau: it.soCau,
              phan: it.phan,
              maDang: it.dang || '',
              tenDang: it.dang || it.chuyenDe || 'Lỗi sai cần khắc phục',
              bac: 1,
              laLamLai: true,
              daChon: it.dapAnChon,
              viSaoSai: it.dapAnChon ? `Em đã chọn ${it.dapAnChon}, đáp án đúng là ${it.dapAnDung}` : undefined,
            },
          }
          dsCauLuyen.push(cl)
        }
      }

      const tt: ThongTinPhieu = {
        hoTen: auth.hoTen,
        sbd: auth.sbd,
        ngay: new Date(),
        tenChuyenDe: 'ĐỀ ÔN TẬP KHẮC PHỤC CÂU SAI',
        ketQua: `Gồm ${res.items.length} câu sai từ ${dsMaCa.length} ca thi`,
        hienDapAn: false,
        nhanBia: 'ĐỀ KHẮC PHỤC CÂU SAI',
      }

      const html = dungPhieu(tt, dsCauLuyen, { anGiai: false })
      setPhieuHtml(html)
    } catch (err) {
      setThongBaoKhacPhuc(err instanceof Error ? err.message : 'Lỗi khi tạo đề khắc phục')
    } finally {
      setDangTaoDeKhacPhuc(false)
    }
  }

  // Vào thi
  const vaoThi = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const ma = maCaVaoThi.trim()
    if (!ma || ma.length < 4) {
      setLoiVaoThi('Vui lòng nhập mã ca thi hợp lệ (từ 4 đến 8 chữ số)')
      return
    }
    setLoiVaoThi('')
    let url = `/t/${ma}?sbd=${auth?.sbd || ''}`
    if (matKhauCaVaoThi.trim()) {
      url += `&matKhau=${encodeURIComponent(matKhauCaVaoThi.trim())}`
    }
    window.location.href = url
  }

  // NẾU CHƯA ĐĂNG NHẬP
  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-7 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 mb-3 shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cổng Thông Tin Học Sinh
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thầy Đỗ Đại Học · Đăng nhập để xem điểm và học tập
            </p>
          </div>

          {chuaCoMatKhau ? (
            <form onSubmit={xuLyDatMatKhau} className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Thiết lập mật khẩu lần đầu:</strong> SBD <strong>{sbdInput}</strong> chưa có mật khẩu. Em hãy tạo mật khẩu mới (tối thiểu 6 ký tự) để đăng nhập vào các lần sau.
                </div>
              </div>

              {loiDatMatKhau && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiDatMatKhau}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={xacNhanMatKhau}
                  onChange={(e) => setXacNhanMatKhau(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setChuaCoMatKhau(false)}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={dangDatMatKhau}
                  className="w-2/3 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {dangDatMatKhau ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Xác nhận & Đăng nhập</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={xuLyDangNhap} className="space-y-4">
              {loiDangNhap && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiDangNhap}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số báo danh (SBD)
                </label>
                <input
                  type="text"
                  value={sbdInput}
                  onChange={(e) => setSbdInput(e.target.value)}
                  placeholder="Ví dụ: 110234 hoặc 12026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Lần đầu chưa có để trống để đặt)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={hienMatKhau ? 'text' : 'password'}
                    value={matKhauInput}
                    onChange={(e) => setMatKhauInput(e.target.value)}
                    placeholder="Nhập mật khẩu của em..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setHienMatKhau(!hienMatKhau)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {hienMatKhau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={dangXuLyDangNhap}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {dangXuLyDangNhap ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Đăng nhập</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  Nếu quên mật khẩu, em hãy liên hệ Thầy để được reset về <code>12121212</code>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // KHI ĐÃ ĐĂNG NHẬP THÀNH CÔNG
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {auth.hoTen.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {auth.hoTen}
                </h1>
                {auth.lop && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {auth.lop}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                SBD: {auth.sbd}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dangXuat}
              title="Đăng xuất"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation 4 mục */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setTab('diem')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              tab === 'diem'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Award className={`w-6 h-6 ${tab === 'diem' ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab === 'diem' ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {dsLichSu.length} ca
              </span>
            </div>
            <div>
              <div className="font-bold text-sm">Xem điểm</div>
              <div className={`text-xs mt-0.5 line-clamp-1 ${tab === 'diem' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Báo cáo các ca thi
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('btvn')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              tab === 'btvn'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <BookOpen className={`w-6 h-6 ${tab === 'btvn' ? 'text-indigo-200' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab === 'btvn' ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {dsBtvn.length} bài
              </span>
            </div>
            <div>
              <div className="font-bold text-sm">Bài tập về nhà</div>
              <div className={`text-xs mt-0.5 line-clamp-1 ${tab === 'btvn' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Giao & nộp bài
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('khacphuc')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              tab === 'khacphuc'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Sparkles className={`w-6 h-6 ${tab === 'khacphuc' ? 'text-indigo-200' : 'text-amber-500 dark:text-amber-400'}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab === 'khacphuc' ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {tongSoCauSaiDaChon} câu sai
              </span>
            </div>
            <div>
              <div className="font-bold text-sm">Khắc phục câu sai</div>
              <div className={`text-xs mt-0.5 line-clamp-1 ${tab === 'khacphuc' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Tự tạo đề ôn tập
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('vaothi')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              tab === 'vaothi'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <LogIn className={`w-6 h-6 ${tab === 'vaothi' ? 'text-indigo-200' : 'text-purple-600 dark:text-purple-400'}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab === 'vaothi' ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                Trực tuyến
              </span>
            </div>
            <div>
              <div className="font-bold text-sm">Vào thi</div>
              <div className={`text-xs mt-0.5 line-clamp-1 ${tab === 'vaothi' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Nhập mã ca & mật khẩu
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* TAB 1: XEM ĐIỂM */}
        {tab === 'diem' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lịch sử thi & Báo cáo kết quả
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Xem điểm chi tiết và báo cáo học tập của tất cả các ca thi em đã tham gia
                </p>
              </div>
            </div>

            {dangTaiLichSu ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm">Đang tải lịch sử thi...</span>
              </div>
            ) : dsLichSu.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có ca thi nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Em chưa tham gia ca thi nào trên hệ thống hoặc bài thi chưa được đồng bộ.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dsLichSu.map((item) => (
                  <div
                    key={item.maCa}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            #{item.maCa}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1.5">
                            {item.tenCa || `Ca thi ${item.maCa}`}
                          </h3>
                        </div>
                        <div
                          className={`text-xl font-extrabold px-3 py-1 rounded-xl border ${mauDiem(
                            item.tong,
                          )}`}
                        >
                          {item.tong !== null && item.tong !== undefined ? item.tong.toFixed(2) : '--'}
                          <span className="text-xs font-normal opacity-70">/10</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {dinhDangNgayGio(item.nopLuc)}
                        </span>
                        <span>•</span>
                        <span>
                          Đúng <strong>{item.soCauDung ?? 0}</strong>/{item.tongCau ?? 0} câu
                          {(item.soCauSai ?? 0) > 0 && (
                            <span className="text-rose-500 font-medium ml-1">
                              (sai {item.soCauSai} câu)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Điểm từng phần */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                        <div className="text-center">
                          <div className="text-slate-400 text-[10px]">Phần I (TN)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemI !== null ? item.diemI.toFixed(2) : '--'}
                          </div>
                        </div>
                        <div className="text-center border-x border-slate-200 dark:border-slate-700">
                          <div className="text-slate-400 text-[10px]">Phần II (Đ/S)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemII !== null ? item.diemII.toFixed(2) : '--'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-400 text-[10px]">Phần III (Trả lời)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemIII !== null ? item.diemIII.toFixed(2) : '--'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <a
                        href={`/d/${item.maCa}?sbd=${auth.sbd}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
                      >
                        <span>Xem báo cáo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`/t/${item.maCa}?sbd=${auth.sbd}`}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-center transition"
                      >
                        Mở lại bài thi
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NỘP BÀI TẬP VỀ NHÀ */}
        {tab === 'btvn' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bài tập về nhà
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh sách các bài tập Thầy giao, thời hạn nộp bài và kết quả làm bài
              </p>
            </div>

            {dangTaiBtvn ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm">Đang tải danh sách bài tập...</span>
              </div>
            ) : dsBtvn.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có bài tập về nhà nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Hiện tại Thầy chưa giao bài tập mới hoặc các bài tập trước đó đã hoàn tất.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dsBtvn.map((bt) => (
                  <div
                    key={bt.maBtvn || bt.maCa}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          #{bt.maCa}
                        </span>
                        {bt.daNop ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Chưa nộp
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {bt.tenBtvn || `Bài tập ca ${bt.maCa}`}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {bt.soCau > 0 && <span>Số câu: <strong>{bt.soCau}</strong></span>}
                        {bt.hanNop && (
                          <span>Hạn nộp: <strong className="text-rose-600 dark:text-rose-400">{dinhDangNgayGio(bt.hanNop)}</strong></span>
                        )}
                        {bt.nopLuc && (
                          <span>Nộp lúc: {dinhDangNgayGio(bt.nopLuc)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {bt.daNop && bt.diem !== null && (
                        <div className="text-right">
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {bt.diem.toFixed(2)}đ
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bt.soDung}/{bt.soCau} câu đúng
                          </div>
                        </div>
                      )}
                      <a
                        href={`/t/${bt.maCa}?sbd=${auth.sbd}`}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          bt.daNop
                            ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <span>{bt.daNop ? 'Xem lại bài' : 'Vào làm bài'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KHẮC PHỤC CÂU SAI */}
        {tab === 'khacphuc' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Khắc phục câu sai các ca thi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn các ca thi để hệ thống tự động trích xuất các câu làm sai và rút các câu chữa phù hợp
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={chonTatCaCa}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {cacCaChon.size === dsLichSu.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả ca'}
                </button>
                <button
                  onClick={taoDeKhacPhuc}
                  disabled={dangTaoDeKhacPhuc || cacCaChon.size === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  {dangTaoDeKhacPhuc ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Tạo đề khắc phục ({cacCaChon.size} ca - {tongSoCauSaiDaChon} câu sai)</span>
                </button>
              </div>
            </div>

            {thongBaoKhacPhuc && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{thongBaoKhacPhuc}</span>
              </div>
            )}

            {dsLichSu.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có dữ liệu câu sai
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Sau khi tham gia các ca thi, các câu làm sai sẽ được hiển thị ở đây để tạo đề ôn tập.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dsLichSu.map((item) => {
                    const isSelected = cacCaChon.has(item.maCa)
                    const coSai = (item.soCauSai ?? 0) > 0
                    return (
                      <div
                        key={item.maCa}
                        onClick={() => toggleChonCa(item.maCa)}
                        className={`p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-indigo-600 dark:text-indigo-400">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                #{item.maCa}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {item.tenCa || `Ca ${item.maCa}`}
                              </h4>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Nộp: {dinhDangNgayGio(item.nopLuc)} • Điểm:{' '}
                              <strong>{item.tong !== null ? item.tong.toFixed(2) : '--'}</strong>
                            </div>
                          </div>
                        </div>

                        <div>
                          {coSai ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Sai {item.soCauSai} câu
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Đúng 100%
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VÀO PHÒNG THI */}
        {tab === 'vaothi' && (
          <div className="max-w-xl mx-auto py-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 mb-3 shadow-inner">
                  <LogIn className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Vào phòng thi trực tuyến
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập mã ca thi từ Thầy và mật khẩu ca (nếu có) để bắt đầu làm bài
                </p>
              </div>

              {loiVaoThi && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiVaoThi}</span>
                </div>
              )}

              <form onSubmit={vaoThi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mã ca thi (6 chữ số)
                  </label>
                  <input
                    type="text"
                    value={maCaVaoThi}
                    onChange={(e) => setMaCaVaoThi(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ví dụ: 543998"
                    maxLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono text-xl tracking-wider font-bold"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu ca thi (nếu ca thi có yêu cầu)
                  </label>
                  <input
                    type="password"
                    value={matKhauCaVaoThi}
                    onChange={(e) => setMatKhauCaVaoThi(e.target.value)}
                    placeholder="Nhập mật khẩu ca thi (để trống nếu không có)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                  Số báo danh đăng nhập của em: <strong className="text-slate-800 dark:text-slate-200 font-mono">{auth.sbd}</strong> ({auth.hoTen})
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Vào thi ngay</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Khung xem đề khắc phục câu sai (chuẩn HTML giống trong báo cáo) */}
      {phieuHtml && (
        <KhungXemPhieu
          html={phieuHtml}
          ten="Đề khắc phục câu sai"
          dong={() => setPhieuHtml('')}
        />
      )}
    </div>
  )
}
