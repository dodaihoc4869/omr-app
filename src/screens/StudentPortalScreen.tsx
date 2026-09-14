import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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
  AlertCircle,
  CheckSquare,
  Square,
  ArrowRight,
  Clock,
  RotateCcw,
  Heart,
  Timer,
  Check,
  FlaskConical,
  X,
} from 'lucide-react'
import {
  hsDangNhapApi,
  hsDatMatKhauApi,
  hsLichSuCaApi,
  hsBtvnApi,
  hsCauSaiApi,
} from '../lib/exam-api'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import LogoHocSinh from '../components/LogoHocSinh'
import DauTruongGame from '../components/DauTruongGame'
import BaoCaoCaThiHocSinhModal from '../components/BaoCaoCaThiHocSinhModal'
import DongDemCau, { docSoDem } from '../components/DongDemCau'
import { goiBaiThi } from '../lib/goi-bao-cao'
import ModalKhacPhucCauSai from '../components/ModalKhacPhucCauSai'
import type { CauSaiDauVao } from '../lib/thuat-toan-rut-cau-sai'
import type { TuCongHocSinh } from './ExamTakeScreen'

// Màn làm bài nạp trễ: cổng học sinh không phải kéo theo bộ chấm khi chỉ xem điểm.
const ManLamBai = lazy(() => import('./ExamTakeScreen'))
import { chuanHoaLoiGiaiCau } from '../lib/chuan-hoa-loi-giai'

const KHOA_LUU_AUTH = 'omr_student_portal_auth'

export interface BaiMomGiao {
  id: string
  tieuDe: string
  ngayGiao: string
  taoLuc?: string
  soCau: number
  thoiGianPhut: number
  dsCau: any[]
  cau?: any[]
  trangThai: 'chua_lam' | 'dang_lam' | 'da_nop'
  batDauLuc?: string
  nopLuc?: string
  diem?: number
  soCauDung?: number
  htmlKetQua?: string
  htmlBaoCao?: string
}

export function chuanHoaBaiMom(b: any): BaiMomGiao {
  const rawCau = Array.isArray(b?.dsCau) ? b.dsCau : (Array.isArray(b?.cau) ? b.cau : [])
  const dsCau = rawCau.map((c: any, i: number) => ({
    id: String(c?.id || `cau_${i + 1}`),
    text: String(c?.text || c?.noiDung || 'Câu hỏi'),
    choices: Array.isArray(c?.choices)
      ? c.choices.map(String)
      : (Array.isArray(c?.luaChon) ? c.luaChon.map(String) : (Array.isArray(c?.ideas) ? c.ideas.map(String) : [])),
    dapAn: String(c?.dapAn || c?.dapAnDung || 'A'),
    dapAnDung: String(c?.dapAnDung || c?.dapAn || 'A'),
    loiGiai: typeof c?.loiGiai === 'object' && c?.loiGiai !== null
      ? String(c.loiGiai.chot || c.loiGiai.text || c.loiGiai.loiGiai || '')
      : (String(c?.loiGiai || '') === '[object Object]' ? '' : String(c?.loiGiai || '')),
    chuyenDe: String(c?.chuyenDe || 'Hoá học'),
  }))

  const id = String(b?.id || `mom_${Date.now()}`)
  const tieuDe = String(b?.tieuDe || `Bài của Mom giao (${dsCau.length} câu)`)
  const ngayGiao = String(b?.ngayGiao || b?.taoLuc || new Date().toISOString())
  const taoLuc = String(b?.taoLuc || b?.ngayGiao || new Date().toISOString())
  const soCau = Number(b?.soCau) || dsCau.length
  const thoiGianPhut = Number(b?.thoiGianPhut) || 120
  const trangThai = b?.trangThai || 'chua_lam'
  const htmlKetQua = b?.htmlKetQua || b?.htmlBaoCao || ''

  return {
    ...b,
    id,
    tieuDe,
    ngayGiao,
    taoLuc,
    soCau,
    thoiGianPhut,
    dsCau,
    cau: dsCau,
    trangThai,
    htmlKetQua,
    htmlBaoCao: htmlKetQua,
  }
}

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

type TabType = 'diem' | 'btvn' | 'mom' | 'khacphuc' | 'vaothi' | 'game'

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
  const [dangMoBai, setDangMoBai] = useState<string | null>(null)

  // Khắc phục câu sai
  const [cacCaChon, setCacCaChon] = useState<Set<string>>(new Set())
  const [dangTaoDeKhacPhuc, setDangTaoDeKhacPhuc] = useState(false)
  const [thongBaoKhacPhuc, setThongBaoKhacPhuc] = useState('')
  const [phieuHtml, setPhieuHtml] = useState('')
  /** HTML đề + lời giải của em, dựng TẠI MÁY. Rỗng = không mở lớp phủ.
   *
   * Bản trước mở `/t/<mã ca>` trong khung. Cách ấy phụ thuộc việc máy chủ trả
   * đúng index.html cho một đường dẫn không có tệp thật — và đó là chỗ vỡ:
   * Cloudflare Pages trả 404, máy đã cài service worker thiếu đường lui thì ra
   * thẳng trang lỗi. Em bấm nút là thấy "không vào được". */
  const [xemDeHtml, setXemDeHtml] = useState('')
  /** Màn làm bài mở ngay trong cổng học sinh, không rời trang. */
  const [manThi, setManThi] = useState(false)
  /** Danh tính đã xác thực + mã ca, trao thẳng cho màn làm bài. */
  const [boVaoThi, setBoVaoThi] = useState<TuCongHocSinh | null>(null)
  const [dangMoDe, setDangMoDe] = useState(false)

  const moDeVaLoiGiai = async (maCa: string) => {
    if (!auth) return
    setDangMoDe(true)
    try {
      const { deVaLoiGiaiCuaEm } = await import('../lib/de-loi-giai-cua-em')
      const { loadScriptUrlHoacMacDinh } = await import('../lib/exam-db')
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const kq = await deVaLoiGiaiCuaEm(url, maCa, auth.sbd, auth.hoTen || '')
      if (kq.html) setXemDeHtml(kq.html)
      else setThongBaoKhacPhuc(kq.loi || 'Không mở được đề của em')
    } catch (e) {
      setThongBaoKhacPhuc(e instanceof Error ? e.message : 'Không mở được đề của em')
    } finally {
      setDangMoDe(false)
    }
  }
  const [dsCauSaiKhacPhucModal, setDsCauSaiKhacPhucModal] = useState<CauSaiDauVao[] | null>(null)
  const [tieuDeKhacPhucModal, setTieuDeKhacPhucModal] = useState('')
  const [caXemBaoCaoModal, setCaXemBaoCaoModal] = useState<any | null>(null)
  const [scriptUrl, setScriptUrl] = useState('')

  // Vào thi
  const [maCaVaoThi, setMaCaVaoThi] = useState('')
  const [matKhauCaVaoThi, setMatKhauCaVaoThi] = useState('')
  const [loiVaoThi, setLoiVaoThi] = useState('')

  // Bài của Mom giao (Đồng hồ đếm ngược 2 tiếng)
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])
  const [dangLamMom, setDangLamMom] = useState<BaiMomGiao | null>(null)
  const [giayConLaiMom, setGiayConLaiMom] = useState<number>(7200)
  const [cauTraLoiMom, setCauTraLoiMom] = useState<Record<string, string>>({})
  const [thongBaoNopMom, setThongBaoNopMom] = useState<string | null>(null)

  const napDsMom = useCallback(() => {
    if (!auth) return
    try {
      const raw = localStorage.getItem(`omr_mom_btvn_${auth.sbd}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setDsMomGiao(parsed.map(chuanHoaBaiMom))
        }
      } else {
        setDsMomGiao([])
      }
    } catch {
      setDsMomGiao([])
    }
  }, [auth])

  useEffect(() => {
    napDsMom()
  }, [napDsMom, tab])

  useEffect(() => {
    nhoVaiDaDung('hs')
    try {
      datManifestTheoVai('hs')
      document.title = 'ĐĐH Học Sinh'
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      if (meta) meta.setAttribute('content', 'ĐĐH Học Sinh')
    } catch {
      // ignore
    }
  }, [])

  // Đếm ngược 2 tiếng (7200 giây) kể từ khi bấm vào làm bài
  useEffect(() => {
    if (!dangLamMom || dangLamMom.trangThai === 'da_nop') return

    const capNhatDongHo = () => {
      if (!dangLamMom.batDauLuc) return
      const daTroiQua = Math.floor((Date.now() - new Date(dangLamMom.batDauLuc).getTime()) / 1000)
      const conLai = Math.max(0, 7200 - daTroiQua)
      setGiayConLaiMom(conLai)
      if (conLai === 0) {
        void nopBaiCuaMom()
      }
    }

    capNhatDongHo()
    const timer = setInterval(capNhatDongHo, 1000)
    return () => clearInterval(timer)
  }, [dangLamMom])

  const dinhDangThoiGianMom = (tongGiay: number): string => {
    const gio = Math.floor(tongGiay / 3600)
    const phut = Math.floor((tongGiay % 3600) / 60)
    const giay = tongGiay % 60
    return `${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}:${String(giay).padStart(2, '0')}`
  }

  const batDauLamBaiMom = (bai: BaiMomGiao) => {
    const bChuan = chuanHoaBaiMom(bai)
    const batDauLuc = bChuan.batDauLuc || new Date().toISOString()
    const capNhat: BaiMomGiao = {
      ...bChuan,
      trangThai: 'dang_lam',
      batDauLuc,
    }
    setDangLamMom(capNhat)
    setCauTraLoiMom({})
    setThongBaoNopMom(null)

    if (auth) {
      const danhSach = dsMomGiao.map((b) => (b.id === bChuan.id ? capNhat : chuanHoaBaiMom(b)))
      localStorage.setItem(`omr_mom_btvn_${auth.sbd}`, JSON.stringify(danhSach))
      setDsMomGiao(danhSach)
    }
  }

  async function nopBaiCuaMom() {
    if (!dangLamMom || !auth) return

    const dsCau = Array.isArray(dangLamMom.dsCau) && dangLamMom.dsCau.length > 0
      ? dangLamMom.dsCau
      : (Array.isArray(dangLamMom.cau) ? dangLamMom.cau : [])
    let soDung = 0
    const tongSo = dsCau.length || 1
    const chiTietKq: any[] = []

    for (let i = 0; i < dsCau.length; i++) {
      const cau = dsCau[i]
      const dapAnEm = (cauTraLoiMom[cau.id] || '').trim().toUpperCase()
      const dapAnDung = (cau.dapAn || cau.dapAnDung || 'A').trim().toUpperCase()
      const laDung = dapAnEm === dapAnDung
      if (laDung) soDung++

      const rawChoices = cau.choices && cau.choices.length > 0
        ? cau.choices
        : (cau.ideas && cau.ideas.length > 0 ? cau.ideas : [])
      const luaChon = rawChoices.map((x: unknown) => String(x ?? ''))

      const lgChuan = chuanHoaLoiGiaiCau(cau.loiGiai, cau.phan || 'I', dapAnDung)

      chiTietKq.push({
        stt: i + 1,
        text: cau.text,
        choices: luaChon,
        dapAnEm,
        dapAnDung,
        dungSai: laDung,
        chot: lgChuan.chot,
        lyDo: lgChuan.lyDo,
        buoc: lgChuan.buoc,
        chuyenDe: cau.chuyenDe || 'Chuyên đề ôn tập',
      })
    }

    const diem = Number(((soDung / tongSo) * 10).toFixed(2))

    const htmlKetQua = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Bài Của Mom</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: rgb(248, 250, 252);
      padding: 16px;
      color: rgb(30, 41, 59);
    }
  </style>
</head>
<body>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', 'Segoe UI', Roboto, sans-serif; max-width: 820px; margin: 0 auto; padding: 28px; color: var(--muc, rgb(30, 41, 59)); background: var(--the, rgb(255, 255, 255)); border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="height: 6px; width: 100%; border-radius: 9999px; overflow: hidden; display: flex; margin-bottom: 24px;">
          <div style="flex: 1; background: rgb(26, 115, 232);"></div>
          <div style="flex: 1; background: rgb(234, 67, 53);"></div>
          <div style="flex: 1; background: rgb(251, 188, 4);"></div>
          <div style="flex: 1; background: rgb(52, 168, 83);"></div>
        </div>

        <div style="text-align: center; border-bottom: 2px solid var(--vien, rgb(226, 232, 240)); padding-bottom: 24px; margin-bottom: 28px;">
          <div style="font-size: 24px; font-weight: 900; color: rgb(234, 67, 53); margin-bottom: 6px; letter-spacing: -0.01em;">💖 KẾT QUẢ BÀI CỦA MOM GIAO</div>
          <div style="font-size: 14.5px; color: var(--nhat, rgb(100, 116, 139));">Học sinh: <strong>${auth.hoTen}</strong> (SBD: <strong>${auth.sbd}</strong>) ${auth.lop ? `· Lớp: ${auth.lop}` : ''}</div>
          <div style="font-size: 13px; color: var(--chim, rgb(148, 163, 184)); margin-top: 4px;">Thời gian nộp: ${new Date().toLocaleString('vi-VN')}</div>
          <div style="display: inline-block; margin-top: 18px; padding: 12px 32px; background: rgba(234, 67, 53, 0.08); border: 2px solid rgba(234, 67, 53, 0.25); border-radius: 9999px;">
            <span style="font-size: 16px; font-weight: 700; color: rgb(197, 34, 31);">Điểm số: </span>
            <span style="font-size: 32px; font-weight: 900; color: rgb(234, 67, 53);">${diem}</span>
            <span style="font-size: 15px; font-weight: 600; color: rgb(197, 34, 31);"> / 10 (${soDung}/${tongSo} câu đúng)</span>
          </div>
        </div>

        <div style="font-size: 16px; font-weight: 800; margin-bottom: 18px; color: var(--muc, rgb(15, 23, 42)); letter-spacing: 0.02em;">LỜI GIẢI CHI TIẾT TỪNG CÂU THEO CHUẨN HOÁ HỌC:</div>
        ${chiTietKq
          .map(
            (c) => `
          <div style="margin-bottom: 24px; padding: 20px; border-radius: 20px; border: 1px solid ${c.dungSai ? 'rgba(52, 168, 83, 0.35)' : 'rgba(234, 67, 53, 0.35)'}; background: ${c.dungSai ? 'rgba(52, 168, 83, 0.04)' : 'rgba(234, 67, 53, 0.04)'}; box-shadow: 0 1px 3px rgba(60,64,67,0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--muc, rgb(30, 41, 59));">Câu ${c.stt}: ${c.chuyenDe}</span>
              <span style="font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; background: ${c.dungSai ? 'rgb(52, 168, 83)' : 'rgb(234, 67, 53)'}; color: rgb(255, 255, 255);">
                ${c.dungSai ? '✓ ĐÚNG' : '✗ SAI'}
              </span>
            </div>
            <div style="font-size: 15px; line-height: 1.65; margin-bottom: 14px; color: var(--muc, rgb(51, 65, 85)); font-weight: 500;">${c.text}</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14.5px; margin-bottom: 16px;">
              ${c.choices
                .map(
                  (ch: string, idx: number) => {
                    const kyTu = String.fromCharCode(65 + idx)
                    const laDung = kyTu === c.dapAnDung
                    const laChon = kyTu === c.dapAnEm
                    let bg = 'rgb(255, 255, 255)'
                    let border = 'rgb(226, 232, 240)'
                    let color = 'rgb(51, 65, 85)'
                    let badgeBg = 'rgb(241, 245, 249)'
                    let badgeColor = 'rgb(71, 85, 105)'
                    let fw = '500'
                    if (laDung) {
                      bg = 'rgb(240, 253, 244)'
                      border = 'rgb(167, 243, 208)'
                      color = 'rgb(22, 101, 52)'
                      badgeBg = 'rgb(220, 252, 231)'
                      badgeColor = 'rgb(22, 101, 52)'
                      fw = '700'
                    } else if (laChon) {
                      bg = 'rgb(254, 242, 242)'
                      border = 'rgb(254, 202, 202)'
                      color = 'rgb(153, 27, 27)'
                      badgeBg = 'rgb(254, 226, 226)'
                      badgeColor = 'rgb(153, 27, 27)'
                      fw = '700'
                    }
                    return `<div style="padding: 10px 16px; border-radius: 16px; border: 1.5px solid ${border}; background: ${bg}; color: ${color}; font-weight: ${fw}; display: flex; align-items: center; gap: 12px;"><span style="width: 28px; height: 28px; border-radius: 50%; background: ${badgeBg}; color: ${badgeColor}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0;">${kyTu}</span><span style="flex: 1; min-width: 0;">${ch}</span></div>`
                  }
                )
                .join('')}
            </div>

            <!-- HỘP LỜI GIẢI ĐÚNG CHUẨN ẢNH 4 (MÀU KEM / HỔ PHÁCH) -->
            <div style="padding: 22px 24px; background: rgb(255, 253, 245); border: 1.5px solid rgb(253, 230, 138); border-radius: 20px; box-shadow: 0 4px 14px rgba(217,119,6,0.06);">
              <div style="font-size: 16px; color: rgb(120, 53, 15); font-weight: 700; margin-bottom: 12px;">
                Đáp án: <b style="font-size: 18px; font-weight: 900; color: rgb(120, 53, 15); letter-spacing: 0.04em;">${c.dapAnDung}</b>
              </div>
              ${c.chot ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 10px; margin-bottom: 6px;">
                  KIẾN THỨC CỐT LÕI
                </div>
                <div style="font-size: 15px; font-weight: 800; line-height: 1.65; color: rgb(59, 29, 5); margin-bottom: 14px;">
                  ${c.chot}
                </div>
              ` : ''}
              ${c.lyDo && c.lyDo.length > 0 ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 10px; margin-bottom: 8px;">
                  VÌ SAO CHỌN / KHÔNG CHỌN TỪNG PHƯƠNG ÁN
                </div>
                <div style="font-size: 14px; line-height: 1.65; color: rgb(120, 53, 15);">
                  ${c.lyDo.map((l: any) => `
                    <div style="padding: 6px 0; border-top: 1px dashed rgba(146, 64, 14, 0.18);">
                      <strong style="color: rgb(120, 53, 15);">${l.khoa}.</strong>
                      <span style="font-weight: 800; color: ${l.dung ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'}; margin: 0 4px;">
                        ${l.dung ? '✓' : '✗'}
                      </span>
                      <span>${l.ly}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${c.buoc && c.buoc.length > 0 ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 14px; margin-bottom: 6px;">
                  LÀM TỪNG BƯỚC
                </div>
                <div style="font-size: 14px; line-height: 1.65; color: rgb(120, 53, 15);">
                  ${c.buoc.map((b: string, bIdx: number) => `<div style="margin-bottom: 4px;">${bIdx + 1}. ${b}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
</body>
</html>
    `

    const baiDaNop: BaiMomGiao = {
      ...dangLamMom,
      trangThai: 'da_nop',
      nopLuc: new Date().toISOString(),
      diem,
      soCauDung: soDung,
      htmlKetQua,
    }

    const danhSachMoi = dsMomGiao.map((b) => (b.id === dangLamMom.id ? baiDaNop : b))
    localStorage.setItem(`omr_mom_btvn_${auth.sbd}`, JSON.stringify(danhSachMoi))
    setDsMomGiao(danhSachMoi)
    setDangLamMom(null)
    setThongBaoNopMom(`🎉 Chúc mừng em đã hoàn thành bài của Mom! Điểm: ${diem}/10. Kết quả đã tự động gửi về App của Mom.`)
  }

  // Ghi nhớ vai hs
  useEffect(() => {
    nhoVaiDaDung('hs')
    loadScriptUrlHoacMacDinh().then(setScriptUrl).catch(() => {})
  }, [])

  const napLaiBtvn = useCallback(async () => {
    if (!auth) return
    const url = await loadScriptUrlHoacMacDinh().catch(() => '')
    setDangTaiBtvn(true)
    try {
      const resBt = await hsBtvnApi(url, auth.sbd)
      if (resBt.ok && resBt.items) {
        setDsBtvn(resBt.items)
      }
    } finally {
      setDangTaiBtvn(false)
    }
  }, [auth])

  const moBaiTap = async (bt: any, lamLai = false) => {
    if (!auth) return
    const id = bt.maBtvn || bt.maCa

    if (lamLai) {
      const con = typeof bt.soLanLamLaiConLai === 'number' ? bt.soLanLamLaiConLai : 3
      if (con <= 0) {
        alert('Em đã dùng hết 3 lượt làm lại cho bài tập này!')
        return
      }
      const xacNhan = window.confirm(
        `Em có chắc muốn làm lại bài tập này không?\n(Được làm lại tối đa 3 lần, hiện còn ${con} lượt. Lần nộp mới sẽ cập nhật điểm số và kết quả mới).`
      )
      if (!xacNhan) return

      // Xoá bài làm dở trong localStorage để câu hỏi sạch trơn cho em làm mới
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('ddh.lam.' + id) || (bt.maBtvn && k.includes(bt.maBtvn)))) {
            localStorage.removeItem(k)
          }
        }
      } catch {}
    }

    setDangMoBai(id)
    try {
      const { layCauHinhChoEmBtvn } = await import('../lib/btvn-cho-em')
      const { btvnCuaEm } = await import('../lib/btvn-may-chu-moi')
      const ch = await layCauHinhChoEmBtvn()
      const r = await btvnCuaEm(ch, bt.maCa || 'Riêng', auth.sbd)
      if (!r.ok) {
        alert(r.error || 'Không mở được bài tập về nhà')
        return
      }
      const { dungPhieuBtvn } = await import('../lib/btvn-cho-em')
      const html = await dungPhieuBtvn(r, bt.maCa || 'Riêng', auth.sbd, { lamLai })
      setPhieuHtml(html)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không mở được bài tập')
    } finally {
      setDangMoBai(null)
    }
  }

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
            // CẦN KHẮC PHỤC, không phải chỉ "sai hẳn": câu bỏ trống và câu
            // phần II chưa trọn ý cũng phải vào đề khắc phục.
            if ((docSoDem(it)?.soCanKhacPhuc ?? 0) > 0) coSai.add(it.maCa)
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
  const taoDeKhacPhuc = async (danhSachMaCaTuyChon?: string[]) => {
    if (!auth) return
    let dsMaCa = danhSachMaCaTuyChon && danhSachMaCaTuyChon.length > 0 ? danhSachMaCaTuyChon : Array.from(cacCaChon)
    if (dsMaCa.length === 0) {
      const caCoSai = dsLichSu.filter((c) => (c.soCauSai ?? 0) > 0).map((c) => c.maCa)
      dsMaCa = caCoSai.length > 0 ? caCoSai : dsLichSu.map((c) => c.maCa)
    }
    if (dsMaCa.length === 0) {
      setThongBaoKhacPhuc('Chưa có dữ liệu ca thi để khắc phục câu sai')
      return
    }
    setDangTaoDeKhacPhuc(true)
    setThongBaoKhacPhuc('')
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await hsCauSaiApi(url, auth.sbd, dsMaCa)
      if (!res.ok || !res.items || res.items.length === 0) {
        setThongBaoKhacPhuc(res.error || 'Các ca đã chọn không có câu sai nào cần khắc phục!')
        setDangTaoDeKhacPhuc(false)
        return
      }

      setTieuDeKhacPhucModal(dsMaCa.length === 1 ? `Ca thi #${dsMaCa[0]}` : `${dsMaCa.length} ca thi đã chọn`)
      setDsCauSaiKhacPhucModal(res.items as CauSaiDauVao[])
    } catch (err) {
      setThongBaoKhacPhuc(err instanceof Error ? err.message : 'Lỗi khi tải danh sách câu sai')
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
    if (!auth) {
      setLoiVaoThi('Em cần đăng nhập trước khi vào thi.')
      return
    }
    // VÀO THẲNG PHÒNG CHỜ, KHÔNG HỎI LẠI TÊN (thầy chốt 14/09: "sau khi nhập mã
    // ca và mật khẩu thì phải chuyển vào màn hình chờ hoặc chuyển vào làm bài
    // luôn").
    //
    // Hai bản trước đều bắt em đi qua một cửa thừa. Bản đầu nhảy sang đường dẫn
    // `/t/<mã ca>`: em bị đá khỏi cổng, và đó đúng là chỗ vỡ khi máy chủ không
    // trả `index.html` cho đường dẫn không có tệp thật. Bản sau dựng màn thi
    // trong lớp phủ nhưng nhét mã ca vào ĐỊA CHỈ rồi để màn thi tự đọc — nên em
    // vẫn phải bấm qua màn "Có đúng em không?", trong khi chính em vừa đăng
    // nhập bằng mật khẩu riêng cách đó ba giây.
    //
    // Nay trao tay thẳng bằng THAM SỐ, không qua địa chỉ: tên và năm sinh của
    // em là dữ liệu cá nhân, không được nằm trên thanh địa chỉ để người ngồi
    // cạnh đọc được. Màn thi nhận đủ danh tính đã xác thực nên bỏ hẳn bước hỏi
    // lại, gọi máy chủ ngay và rơi đúng vào phòng chờ hoặc vào bài.
    setBoVaoThi({
      maCa: ma,
      sbd: auth.sbd,
      hoTen: auth.hoTen || '',
      namSinh: auth.namSinh || '',
      lop: auth.lop || '',
      matKhau: matKhauCaVaoThi.trim(),
    })
    setManThi(true)
  }

  // NẾU CHƯA ĐĂNG NHẬP
  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-8 transition-all">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <LogoHocSinh size={54} hienChu={false} />
            </div>
            <div
              className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: 'var(--sans)' }}
            >
              ĐỖ ĐẠI HỌC
            </div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mt-1" style={{ fontFamily: 'var(--sans)' }}>
              Kiên Trì
            </div>
          </div>

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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setChuaCoMatKhau(false)}
                  className="w-1/3 py-2.5 px-3 rounded-full btn-google-outlined text-sm font-semibold cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={dangDatMatKhau}
                  className="w-2/3 py-2.5 px-4 rounded-full btn-google-primary text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số báo danh (SBD)
                </label>
                <input
                  type="text"
                  value={sbdInput}
                  onChange={(e) => setSbdInput(e.target.value)}
                  placeholder="Ví dụ: 110234 hoặc 12026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono transition"
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
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setHienMatKhau(!hienMatKhau)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {hienMatKhau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={dangXuLyDangNhap}
                className="btn-google-primary w-full py-3 px-4 text-sm disabled:opacity-50 mt-3 shadow-sm cursor-pointer"
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
      {/* Header Google Workspace style */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo Học sinh phong cách Google */}
          <LogoHocSinh size={38} hienChu={true} />

          {/* Thông tin học sinh dạng Google Account Pill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {auth.hoTen.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  {auth.hoTen}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  SBD: {auth.sbd} {auth.lop ? `· ${auth.lop}` : ''}
                </span>
              </div>
            </div>

            <button
              onClick={dangXuat}
              title="Đăng xuất"
              className="btn-google-outlined inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation 5 mục theo phong cách Google Material 3 Segmented Pill Tabs */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 pb-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setTab('diem')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'diem'
                ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'diem' ? 'bg-blue-600 text-white scale-105' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                <Award size={18} strokeWidth={tab === 'diem' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'diem' ? 'bg-blue-200/70 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {dsLichSu.length} ca
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Xem điểm</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'diem' ? 'text-blue-700/80 dark:text-blue-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Báo cáo các ca thi
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('btvn')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'btvn'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'btvn' ? 'bg-emerald-600 text-white scale-105' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                <BookOpen size={18} strokeWidth={tab === 'btvn' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'btvn' ? 'bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {dsBtvn.length} bài
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Bài tập về nhà</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'btvn' ? 'text-emerald-700/80 dark:text-emerald-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Giao & nộp bài
              </div>
            </div>
          </button>

          <button
            onClick={() => { setTab('mom'); setDangLamMom(null); }}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'mom'
                ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'mom' ? 'bg-rose-600 text-white scale-105' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
                <Heart size={18} strokeWidth={tab === 'mom' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'mom' ? 'bg-rose-200/70 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {dsMomGiao.length} bài
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Bài của Mom giao</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'mom' ? 'text-rose-700/80 dark:text-rose-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Hạn 2 tiếng (Mom giao)
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('khacphuc')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'khacphuc'
                ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'khacphuc' ? 'bg-amber-500 text-white scale-105' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
                <Sparkles size={18} strokeWidth={tab === 'khacphuc' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'khacphuc' ? 'bg-amber-200/70 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {tongSoCauSaiDaChon} câu sai
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Khắc phục câu sai</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'khacphuc' ? 'text-amber-700/80 dark:text-amber-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Tự tạo đề ôn tập
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('vaothi')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'vaothi'
                ? 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'vaothi' ? 'bg-purple-600 text-white scale-105' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'}`}>
                <LogIn size={18} strokeWidth={tab === 'vaothi' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'vaothi' ? 'bg-purple-200/70 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                Trực tuyến
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Vào thi</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'vaothi' ? 'text-purple-700/80 dark:text-purple-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Nhập mã ca & mật khẩu
              </div>
            </div>
          </button>

          <button
            onClick={() => setTab('game')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
              tab === 'game'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${tab === 'game' ? 'bg-emerald-600 text-white scale-105' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                <FlaskConical size={18} strokeWidth={tab === 'game' ? 2.4 : 2} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tab === 'game' ? 'bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                12 Người
              </span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Đấu Trường Hoá Chất 🧪</div>
              <div className={`text-[11px] mt-0.5 line-clamp-1 ${tab === 'game' ? 'text-emerald-700/80 dark:text-emerald-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                Đại chiến mê cung 12 người
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* TAB 1: XEM ĐIỂM */}
        {tab === 'diem' && (
          <div className="space-y-4 animate-google-fade">
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
                        {/* CHƯA CHẤM THÌ KHÔNG HIỆN. Máy chủ trả `null` khi ca
                            chưa có bảng chấm; `?? 0` biến nó thành "Đúng 0/0
                            câu" — một con số bịa, và đó đúng là thứ ca Test2
                            (561169) hiện ra cho bài 1,56 điểm. */}
                        {typeof item.tongCau === 'number' && item.tongCau > 0 && (
                          <>
                            <span>•</span>
                            {/* KHÔNG tự trừ `tongCau - soCauDung` nữa: phép trừ
                                ấy dồn cả câu bỏ trống lẫn câu phần II đúng một
                                phần vào "sai", nên ca Test4 (thầy bắt 14/09)
                                in "Sai 12 câu" cho bài được 2,00 điểm. */}
                            <DongDemCau so={item} />
                          </>
                        )}
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

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setCaXemBaoCaoModal(item)}
                        className="flex-1 py-2 px-4 rounded-full btn-google-tonal text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Xem báo cáo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void moDeVaLoiGiai(item.maCa)}
                        disabled={dangMoDe}
                        className="py-2 px-4 rounded-full btn-google-outlined text-xs font-medium text-center cursor-pointer"
                      >
                        Xem đề và lời giải kèm lỗi sai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NỘP BÀI TẬP VỀ NHÀ */}
        {tab === 'btvn' && (
          <div className="space-y-4 animate-google-fade">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bài tập về nhà
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Danh sách các bài tập Thầy giao, thời hạn nộp bài và kết quả làm bài
                </p>
              </div>

              <button
                type="button"
                onClick={() => void napLaiBtvn()}
                disabled={dangTaiBtvn}
                className="px-3.5 py-1.5 rounded-full btn-google-outlined text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dangTaiBtvn ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
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
                <button
                  type="button"
                  onClick={() => void napLaiBtvn()}
                  disabled={dangTaiBtvn}
                  className="mt-4 px-4 py-2 rounded-full btn-google-tonal text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dangTaiBtvn ? 'animate-spin' : ''}`} />
                  <span>Tải lại danh sách</span>
                </button>
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
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
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

                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center flex-wrap justify-end">
                      {bt.daNop && bt.diem !== null && (
                        <div className="text-right mr-1">
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {bt.diem.toFixed(2)}đ
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bt.soDung}/{bt.soCau} câu đúng
                          </div>
                        </div>
                      )}

                      {bt.daNop ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void moBaiTap(bt, false)}
                            disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                            className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer btn-google-outlined"
                            title="Xem lại bài làm và lời giải chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem lại bài</span>
                          </button>

                          {(bt.soLanLamLaiConLai ?? 3) > 0 ? (
                            <button
                              type="button"
                              onClick={() => void moBaiTap(bt, true)}
                              disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                              className="px-4 py-2 rounded-full btn-google-primary !bg-amber-500 hover:!bg-amber-600 !border-amber-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title={`Làm lại bài tập này (còn ${bt.soLanLamLaiConLai ?? 3}/3 lượt)`}
                            >
                              {dangMoBai === (bt.maBtvn || bt.maCa) ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              <span>Làm lại (còn {bt.soLanLamLaiConLai ?? 3}/3 lần)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              Hết lượt làm lại (3/3)
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void moBaiTap(bt, false)}
                          disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                          className="px-4 py-2 rounded-full btn-google-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {dangMoBai === (bt.maBtvn || bt.maCa) ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang mở...</span>
                            </>
                          ) : (
                            <>
                              <span>Vào làm bài</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.5: BÀI CỦA MOM GIAO (HẠN 2 TIẾNG) */}
        {tab === 'mom' && (
          <div className="space-y-4 animate-google-fade">
            {dangLamMom ? (
              /* MÀN HÌNH ĐANG LÀM BÀI CỦA MOM GIAO */
              <div className="space-y-4">
                {/* Thanh điều khiển đếm ngược 2 tiếng ghim trên */}
                <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Em có chắc muốn tạm dừng bài làm không? Đồng hồ 2 tiếng vẫn tiếp tục đếm ngược.')) {
                          setDangLamMom(null)
                        }
                      }}
                      className="btn-google-outlined text-xs py-1.5 px-3 rounded-full cursor-pointer"
                    >
                      ← Danh sách bài
                    </button>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                      {dangLamMom.tieuDe}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Đồng hồ đếm ngược 2 tiếng */}
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-colors ${
                      giayConLaiMom < 900
                        ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      <Timer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Hạn 2h: {dinhDangThoiGianMom(giayConLaiMom)}</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Đã làm: <strong className="text-slate-800 dark:text-slate-200">{Object.keys(cauTraLoiMom).length}</strong>/{(dangLamMom.dsCau || dangLamMom.cau || []).length}
                    </div>

                    <button
                      onClick={nopBaiCuaMom}
                      className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nộp bài cho Mom</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách các câu hỏi của bài */}
                <div className="space-y-4">
                  {(dangLamMom.dsCau || dangLamMom.cau || []).map((cau: any, idx: number) => {
                    const daChon = cauTraLoiMom[cau.id]
                    return (
                      <div
                        key={cau.id || idx}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            Câu {idx + 1}
                          </span>
                          {cau.chuyenDe && (
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {cau.chuyenDe}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {cau.text}
                        </div>

                        {Array.isArray(cau?.choices) && cau.choices.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {cau.choices.map((choice: string, cIdx: number) => {
                              const kyTu = String.fromCharCode(65 + cIdx)
                              const duocChon = daChon === kyTu
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    setCauTraLoiMom((prev) => ({ ...prev, [cau.id]: kyTu }))
                                  }
                                  className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                                    duocChon
                                      ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700 font-semibold shadow-xs'
                                      : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                      duocChon
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {kyTu}
                                  </span>
                                  <span className="leading-snug">{choice}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="pt-2">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Điền câu trả lời ngắn:
                            </label>
                            <input
                              type="text"
                              value={daChon || ''}
                              onChange={(e) =>
                                setCauTraLoiMom((prev) => ({ ...prev, [cau.id]: e.target.value }))
                              }
                              placeholder="Nhập đáp án số hoặc chữ..."
                              className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Nút nộp bài dưới cùng */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Em đã hoàn thành bài của Mom chưa?
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Khi nộp bài, hệ thống sẽ tự động chấm điểm, tạo cấu trúc lời giải chi tiết chuẩn HTML và gửi kết quả về cho Mom xem.
                  </p>
                  <button
                    onClick={nopBaiCuaMom}
                    className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-sm py-2.5 px-6 rounded-full inline-flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nộp bài ngay cho Mom</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DANH SÁCH BÀI CỦA MOM GIAO */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <span>Bài của Mom giao (Hạn 2 tiếng)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Mom tạo bài từ Cổng Phụ Huynh dựa trên các câu con sai trước đó để con ôn luyện khắc phục.
                    </p>
                  </div>
                  <button
                    onClick={napDsMom}
                    className="btn-google-outlined inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-semibold self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                </div>

                {thongBaoNopMom && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
                    <span>{thongBaoNopMom}</span>
                    <button
                      onClick={() => setThongBaoNopMom(null)}
                      className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {dsMomGiao.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Chưa có bài tập nào do Mom giao
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Mom có thể vào <strong>Cổng Phụ Huynh (/phu-huynh)</strong> chỉ bằng Số báo danh của con, kéo thanh chọn câu (tối đa 99 câu) để tự động tạo và gửi bài cho con làm bất kỳ lúc nào.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {dsMomGiao.map((bai) => {
                      const daNop = bai.trangThai === 'da_nop'
                      const dangLam = bai.trangThai === 'dang_lam'
                      return (
                        <div
                          key={bai.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono text-slate-400">
                                {dinhDangNgayGio(bai.ngayGiao)}
                              </span>
                              {daNop ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                  ✓ Đã nộp ({bai.diem}/10đ)
                                </span>
                              ) : dangLam ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                  ⏳ Đang làm
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                  Chưa làm
                                </span>
                              )}
                            </div>

                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {bai.tieuDe}
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                              <span>Số câu: <strong>{bai.soCau || (bai.dsCau || bai.cau || []).length}</strong> câu</span>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                <Timer className="w-3.5 h-3.5" />
                                <span>Hạn 2 tiếng (120p)</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            {daNop ? (
                              <button
                                onClick={() => {
                                  if (bai.htmlKetQua) {
                                    setPhieuHtml(bai.htmlKetQua)
                                  } else {
                                    alert(`Điểm của em: ${bai.diem}/10 (${bai.soCauDung}/${bai.soCau} câu đúng)`)
                                  }
                                }}
                                className="btn-google-outlined text-xs py-2 px-3.5 rounded-full font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem kết quả & Lời giải HTML</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => batDauLamBaiMom(bai)}
                                className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white text-xs py-2 px-4 rounded-full font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <span>{dangLam ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài (2 tiếng)'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KHẮC PHỤC CÂU SAI */}
        {tab === 'khacphuc' && (
          <div className="space-y-4 animate-google-fade">
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
                  className="px-3.5 py-1.5 rounded-full btn-google-outlined text-xs font-medium cursor-pointer"
                >
                  {cacCaChon.size === dsLichSu.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả ca'}
                </button>
                <button
                  onClick={() => void taoDeKhacPhuc()}
                  disabled={dangTaoDeKhacPhuc || (cacCaChon.size === 0 && dsLichSu.length === 0)}
                  className="px-4 py-2 rounded-full btn-google-primary !bg-amber-500 hover:!bg-amber-600 !border-amber-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                >
                  {dangTaoDeKhacPhuc ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Tạo câu khắc phục 3 chế độ</span>
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
                    const coSai = (docSoDem(item)?.soCanKhacPhuc ?? 0) > 0
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
                              {docSoDem(item)?.soCanKhacPhuc ?? 0} câu cần khắc phục
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
          <div className="max-w-xl mx-auto py-4 animate-google-fade">
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
                  className="w-full py-3 px-4 rounded-full btn-google-primary !bg-purple-600 hover:!bg-purple-700 !border-purple-600 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Vào thi ngay</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: ĐẤU TRƯỜNG HOÁ CHẤT — ĐẠI CHIẾN MÊ CUNG 12 NGƯỜI */}
        {tab === 'game' && (
          <DauTruongGame
            sbdHienTai={auth.sbd}
            hoTenHienTai={auth.hoTen}
            onDong={() => setTab('diem')}
          />
        )}
      </main>

      {/* XEM ĐỀ VÀ LỜI GIẢI NGAY TRONG APP.
          Trước đây bấm là điều hướng thẳng sang /t/<mã ca>, tức nhảy hẳn khỏi
          cổng học sinh: em mất chỗ đang đứng, và trên app đã cài vào màn hình
          chính thì đó là một cửa sổ khác hẳn. Nay mở trong lớp phủ, đóng lại là
          về đúng chỗ cũ. */}
      {/* MÀN LÀM BÀI — phủ toàn màn, ngay trong cổng học sinh. */}
      {manThi && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-white dark:bg-slate-950">
          <button
            type="button"
            onClick={() => {
              setManThi(false)
              setBoVaoThi(null)
            }}
            className="fixed top-3 right-3 z-[61] w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Đóng phòng thi, về cổng học sinh"
            title="Về cổng học sinh"
          >
            <X className="w-5 h-5" />
          </button>
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang mở phòng thi…</div>}>
            <ManLamBai tuCong={boVaoThi ?? undefined} />
          </Suspense>
        </div>
      )}

      {xemDeHtml && (
        <KhungXemPhieu
          html={xemDeHtml}
          ten="Đề và lời giải kèm lỗi sai"
          dong={() => setXemDeHtml('')}
        />
      )}

      {/* Khung xem đề bài tập & khắc phục câu sai (chuẩn HTML tương tác) */}
      {phieuHtml && (
        <KhungXemPhieu
          html={phieuHtml}
          ten="Bài tập & Phiếu làm bài"
          dong={() => {
            setPhieuHtml('')
            void napLaiBtvn()
          }}
        />
      )}

      {/* Modal Báo cáo ca thi chuẩn Google Material 3 - Mở tức thì & Thúc đẩy sửa sai ngay */}
      {caXemBaoCaoModal && auth && (
        <BaoCaoCaThiHocSinhModal
          baiThi={goiBaiThi(
            caXemBaoCaoModal,
            caXemBaoCaoModal.nopLuc ? dinhDangNgayGio(caXemBaoCaoModal.nopLuc) : undefined,
          )}
          hoTen={auth.hoTen}
          sbd={auth.sbd}
          lop={auth.lop}
          scriptUrl={scriptUrl}
          onClose={() => setCaXemBaoCaoModal(null)}
          onBatDauKhacPhuc={(maCa, html) => {
            setCaXemBaoCaoModal(null)
            setTab('khacphuc')
            setCacCaChon(new Set([maCa]))
            // Modal khắc phục đã dựng xong tờ phiếu thì MỞ THẲNG. Gọi lại
            // `taoDeKhacPhuc` ở đây là mở lại đúng modal em vừa bấm — vòng kín.
            if (html) {
              setPhieuHtml(html)
              return
            }
            void taoDeKhacPhuc([maCa])
          }}
          onMoLaiBaiThi={(maCa) => void moDeVaLoiGiai(maCa)}
        />
      )}

      {/* Modal Khắc phục câu sai chuẩn hoá 3 lựa chọn */}
      {dsCauSaiKhacPhucModal && auth && (
        <ModalKhacPhucCauSai
          isOpen={Boolean(dsCauSaiKhacPhucModal)}
          onClose={() => setDsCauSaiKhacPhucModal(null)}
          dsCauSai={dsCauSaiKhacPhucModal}
          hoTen={auth.hoTen}
          sbd={auth.sbd}
          tieuDeCa={tieuDeKhacPhucModal}
          onTaoPhieuXong={(html) => {
            setDsCauSaiKhacPhucModal(null)
            setPhieuHtml(html)
          }}
        />
      )}
    </div>
  )
}
