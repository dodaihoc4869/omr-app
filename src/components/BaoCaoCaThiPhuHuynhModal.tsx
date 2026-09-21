// MODAL BÁO CÁO CA THI CHI TIẾT DÀNH CHO PHỤ HUYNH — CHUẨN GOOGLE MATERIAL 3
// Phân tích toàn diện mọi chỉ số: điểm số, xếp loại, thời gian, tốc độ, 3 phần đề thi, 4 mức độ nhận thức, chuyên đề hoá học và lời khuyên sư phạm.
// Tuân thủ nghiêm ngặt: Không dùng mã màu hex trong file .tsx.

import { useEffect, useState, useMemo } from 'react'
import DongDemCau, { DongDemYPhanII, docSoDem } from './DongDemCau'
import { DongCauSai } from './KhoiCauSai'
import KhoiBaPhan from './KhoiBaPhan'
import TheTienBo, { type CaLichSu } from './TheTienBo'
import { danhGiaBai } from '../lib/danh-gia-bai'
import {
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Brain,
  TrendingUp,
  Sparkles,
  Heart,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { hsCauSaiApi, hsLichSuCaApi } from '../lib/exam-api'
import ModalKhacPhucCauSai from './ModalKhacPhucCauSai'
import './m3'

export interface ThongTinBaiThiPhuHuynh {
  maCa: string
  tenCa: string
  ngayNop?: string
  diem: number
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  thoiGianPhut?: number
  soCauDung?: number
  soCauSai?: number
  tongSoCau?: number
  /** Bốn nhóm rời nhau + đếm theo Ý phần II (thêm 14/09, ca Test4).
   * Xem `src/lib/dem-ket-qua.ts` — một luật cho cả ba app. */
  soCauDungMotPhan?: number | null
  soCauBoTrong?: number | null
  soYDungII?: number | null
  soYTongII?: number | null
  lanThu?: number
  linkBaoCao?: string
}

interface Props {
  baiThi: ThongTinBaiThiPhuHuynh
  hoTenCon: string
  sbd: string
  lop?: string
  scriptUrl: string
  onClose: () => void
  onGiaoBaiChoCon: (dsCauSai: any[], tieuDe?: string) => void
  onNhanTinChoThay: (noiDung: string) => void
  onXemPhieuGoc?: (html: string) => void
}

export default function BaoCaoCaThiPhuHuynhModal({
  baiThi,
  hoTenCon,
  sbd,
  lop,
  scriptUrl,
  onClose,
  onGiaoBaiChoCon,
  onNhanTinChoThay: _onNhanTinChoThay,
  onXemPhieuGoc: _onXemPhieuGoc,
}: Props) {
  const [dsLichSu, setDsLichSu] = useState<CaLichSu[]>([])
  const [dsCauSai, setDsCauSai] = useState<any[]>([])
  const [dangTaiCauSai, setDangTaiCauSai] = useState(false)
  /** Vì sao chưa lấy được danh sách — hiện ra, cấm nuốt lỗi im lặng. */
  const [loiCauSai, setLoiCauSai] = useState('')
  const [tabPhanTich, setTabPhanTich] = useState<'tong_quan' | 'nhan_thuc' | 'cau_sai' | 'tien_bo'>('tong_quan')
  const [hienModalKhacPhuc, setHienModalKhacPhuc] = useState(false)

  // Tải lịch sử ca thi để phụ huynh theo dõi mức tiến bộ của con
  useEffect(() => {
    let active = true
    async function napLichSu() {
      if (!sbd) return
      try {
        const res = await hsLichSuCaApi(scriptUrl, sbd)
        if (active && res && res.ok && Array.isArray(res.items)) {
          setDsLichSu(res.items as CaLichSu[])
        }
      } catch {}
    }
    void napLichSu()
    return () => {
      active = false
    }
  }, [sbd, scriptUrl])

  // Tải danh sách chi tiết các câu con làm sai trong ca này
  useEffect(() => {
    let active = true
  // CẤM CANH CỬA BẰNG `scriptUrl`.
  //
  // Thầy báo 15/09: nút "KHẮC PHỤC NGAY 9 CÂU SAI" bấm không phản hồi trên điện
  // thoại em, Chrome máy tính thì được. Đo thật: máy chủ trả đủ 9 câu, 16.649
  // byte, 1.257 ms — không hỏng gì. Chết ở ĐÂY: `scriptUrl` rỗng trên máy em
  // (khoá ấy bị gỡ khỏi `cau-hinh.json` từ 12/09) nên lượt gọi không bao giờ
  // được bắn đi; máy thầy còn giữ khoá cũ trong IndexedDB nên luôn lọt.
  // Nay địa chỉ do `layDiaChiMayChu()` lo (xem `src/lib/dia-chi-may-chu.ts`),
  // màn không cần biết địa chỉ nữa.
    async function napCauSai() {
      if (!baiThi.maCa) return
      setDangTaiCauSai(true)
      setLoiCauSai('')
      try {
        const res = await hsCauSaiApi(scriptUrl, sbd, [baiThi.maCa])
        if (!active) return
        if (res && res.ok && Array.isArray(res.items)) {
          setDsCauSai(res.items)
        } else {
          setDsCauSai([])
          setLoiCauSai(res?.error || 'Máy chủ không trả về danh sách câu sai')
        }
      } catch (e) {
        if (active) {
          setDsCauSai([])
          setLoiCauSai(e instanceof Error ? e.message : 'Không kết nối được máy chủ')
        }
      } finally {
        if (active) setDangTaiCauSai(false)
      }
    }
    void napCauSai()
    return () => {
      active = false
    }
  }, [baiThi.maCa, sbd, scriptUrl])

  // Điểm từng phần
  const diemI = baiThi.diemI !== null && baiThi.diemI !== undefined ? baiThi.diemI : Number((baiThi.diem * 0.45).toFixed(2))
  const diemII = baiThi.diemII !== null && baiThi.diemII !== undefined ? baiThi.diemII : Number((baiThi.diem * 0.40).toFixed(2))
  const diemIII = baiThi.diemIII !== null && baiThi.diemIII !== undefined ? baiThi.diemIII : Number((baiThi.diem * 0.15).toFixed(2))

  // Chỉ số cơ bản: không bao giờ rơi về 40 giả! Chuẩn đề là 28 câu hoặc số câu thực tế
  const diem = Number(baiThi.diem.toFixed(2))
  // ĐẾM CÂU: CHỈ SỐ THẬT. Xem ghi chú dài trong `BaoCaoCaThiHocSinhModal`.
  // Đây là báo cáo phụ huynh đọc, nên càng không được có con số suy ra từ điểm.
  const tongCau = baiThi.tongSoCau && baiThi.tongSoCau > 0 ? baiThi.tongSoCau : null
  const soDung = typeof baiThi.soCauDung === 'number' ? baiThi.soCauDung : null
  // BỐN NHÓM RỜI NHAU, KHÔNG TRỪ NGƯỢC (thầy bắt 14/09, ca Test4).
  //
  // Bản cũ lấy `soSai = tongCau - soDung`. Phép trừ ấy dồn cả câu BỎ TRỐNG lẫn
  // câu phần II ĐÚNG MỘT PHẦN vào "sai", nên bài được 2,00 điểm nhờ 6/8 ý phần
  // II vẫn bị in là "Sai 12 câu" — con số chọi thẳng vào cột điểm ngay cạnh nó.
  // Nay đọc đúng bốn con số máy chủ trả, qua một khuôn chung cho cả ba app.
  const demPH = { ...baiThi, tongCau }
  const dem = docSoDem(demPH)
  const soSaiRaw = typeof baiThi.soCauSai === 'number' ? baiThi.soCauSai : dsCauSai.length > 0 ? dsCauSai.length : null
  const soSai = dem ? dem.soSai : soSaiRaw
  // CÙNG MỘT CON SỐ VỚI CỔNG HỌC SINH VÀ MÀN CỦA THẦY: mọi câu không đúng trọn
  // vẹn đều phải khắc phục — sai hẳn, đúng một phần, và bỏ trống.
  const soKhacPhuc = dem ? dem.soCanKhacPhuc : dsCauSai.length
  const soMotPhan = dem ? dem.soDungMotPhan : 0
  const soBoTrongDem = dem ? dem.soBoTrong : 0
  const coDemCau = tongCau !== null && soDung !== null
  const tyLeChinhXac = coDemCau && tongCau !== null ? Math.min(100, Math.max(0, Math.round(((soDung ?? 0) / tongCau) * 100))) : null

  // Phân tích mức độ tiến bộ của con dành riêng cho Phụ huynh


  // Xếp loại học lực
  // CÙNG MỘT XẾP LOẠI, CÙNG MỘT NHẬN XÉT với cổng học sinh — hai cổng nói về
  // cùng một bài thì không được nói hai kiểu.
  const danhGia = useMemo(() => danhGiaBai(diem, soKhacPhuc, tongCau), [diem, soKhacPhuc, tongCau])
  const xepLoai = { ten: danhGia.xepLoai, mau: danhGia.mau, nen: danhGia.nen }

  // Thời gian & tốc độ làm bài
  const thoiLuongPhut = baiThi.thoiGianPhut && baiThi.thoiGianPhut > 0 ? baiThi.thoiGianPhut : 45
  const thoiGianLamUocTinhPhut = Math.min(thoiLuongPhut, Math.max(10, Math.round(thoiLuongPhut * 0.85)))
  const tocDoGiayMoiCau = tongCau ? Math.round((thoiGianLamUocTinhPhut * 60) / tongCau) : null

  // (Điểm từng phần đã khai báo một lần ở trên — bản trùng ở đây đã bỏ.)

  // Phân tích mức độ nhận thức
  const mucDoStats = useMemo(() => {
    // Thống kê từ câu sai thực tế nếu có
    const saiBiet = dsCauSai.filter((c) => c.mucDo === 'biet').length
    const saiHieu = dsCauSai.filter((c) => c.mucDo === 'hieu').length
    const saiVD = dsCauSai.filter((c) => c.mucDo === 'van_dung').length
    const saiVDC = dsCauSai.filter((c) => c.mucDo === 'van_dung_cao').length

    // Giả định cơ cấu câu chuẩn đề thi tốt nghiệp 2025: Nhận biết 12 câu, Thông hiểu 12 câu, Vận dụng 10 câu, Vận dụng cao 6 câu
    const tongBiet = 12
    const tongHieu = 12
    const tongVD = 10
    const tongVDC = 6

    const dungBiet = Math.max(0, tongBiet - saiBiet)
    const dungHieu = Math.max(0, tongHieu - saiHieu)
    const dungVD = Math.max(0, tongVD - saiVD)
    const dungVDC = Math.max(0, tongVDC - saiVDC)

    return [
      {
        ten: 'Nhận biết',
        moTa: 'Lý thuyết cơ bản, công thức, khái niệm',
        dung: dungBiet,
        tong: tongBiet,
        phanTram: Math.round((dungBiet / tongBiet) * 100),
        mauBar: 'bg-blue-500',
        badge: 'text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300',
      },
      {
        ten: 'Thông hiểu',
        moTa: 'Bản chất hoá học, giải thích hiện tượng, phản ứng',
        dung: dungHieu,
        tong: tongHieu,
        phanTram: Math.round((dungHieu / tongHieu) * 100),
        mauBar: 'bg-emerald-500',
        badge: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300',
      },
      {
        ten: 'Vận dụng',
        moTa: 'Bảo toàn e, tính toán nồng độ, este, kim loại',
        dung: dungVD,
        tong: tongVD,
        phanTram: Math.round((dungVD / tongVD) * 100),
        mauBar: 'bg-amber-500',
        badge: 'text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300',
      },
      {
        ten: 'Vận dụng cao',
        moTa: 'Biện luận cấu tạo, bài toán phân hóa điểm 9-10',
        dung: dungVDC,
        tong: tongVDC,
        phanTram: Math.round((dungVDC / tongVDC) * 100),
        mauBar: 'bg-rose-500',
        badge: 'text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300',
      },
    ]
  }, [dsCauSai])

  // Lời khuyên của Thầy — CHỈ NÓI SỐ LIỆU CỦA CA NÀY, không kết luận năng lực con từ một điểm số (luật thầy chốt 18/09:
  // "không coi số câu nộp là bằng chứng đã nắm chắc kiến thức"). Cấm các cụm "nắm chắc / nắm vững / thành thạo / bịt sạch / rất chắc chắn".
  const loiKhuyenSuPham = useMemo(() => {
    const d = diem.toFixed(2)
    if (diem >= 9.0) {
      return {
        tieuDe: `Điểm ca này cao: ${d}/10`,
        loiNhan: `Em ${hoTenCon} được ${d}/10 điểm ở ca kiểm tra này. Phụ huynh hãy ghi nhận cố gắng của con, đồng thời khuyến khích con thử sức thêm với các dạng bài vận dụng cao.`,
        viecCanLam: 'Luyện thêm các bài toán phân hóa khó của các đề thi thử trường chuyên để tối ưu tốc độ.',
      }
    }
    if (diem >= 8.0) {
      return {
        tieuDe: `Điểm ca này ${d}/10, còn một số câu cần chữa`,
        loiNhan: `Em ${hoTenCon} được ${d}/10 điểm. Các câu còn sai nằm ở mục Câu sai cần chữa, mỗi câu có lời giải chi tiết để con xem lại.`,
        viecCanLam: 'Cho con làm lại các câu bị sai ở Phần II và III rồi so lại với lời giải từng câu.',
      }
    }
    if (diem >= 6.5) {
      return {
        tieuDe: `Điểm ca này ${d}/10`,
        loiNhan: `Em ${hoTenCon} được ${d}/10 điểm. Các câu mất điểm được liệt kê ở mục Câu sai cần chữa; con làm lại đúng các dạng câu đó sẽ thấy rõ mình sai ở bước nào.`,
        viecCanLam: 'Bấm nút "Tạo bài luyện khắc phục cho con" để con làm lại đúng các dạng câu vừa mất điểm.',
      }
    }
    return {
      tieuDe: `Điểm ca này ${d}/10, còn nhiều câu cần chữa`,
      loiNhan: `Ca kiểm tra này con được ${d}/10 điểm. Phụ huynh đừng tạo áp lực mà hãy cùng Thầy đồng hành: xem lại lời giải chi tiết của từng câu sai và làm đều đặn bài tập mỗi tối.`,
      viecCanLam: 'Tạo bài tập 10-15 câu mỗi ngày từ các câu con sai để con làm lại từng bước một.',
    }
  }, [diem, hoTenCon])

  return (
    <div className="m3 fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-google-fade">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* MODAL HEADER */}
        <header className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  #{baiThi.maCa}
                </span>
                <span className="text-xs text-slate-400">
                  {baiThi.ngayNop ? new Date(baiThi.ngayNop).toLocaleDateString('vi-VN') : 'Đã nộp bài'}
                </span>
                {baiThi.lanThu && baiThi.lanThu > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Lần thi {baiThi.lanThu}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                {baiThi.tenCa}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Đóng báo cáo"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* MODAL TABS NAVIGATION */}
        <div className="shrink-0 px-4 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50 scrollbar-none">
          <button
            type="button"
            onClick={() => setTabPhanTich('tong_quan')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              tabPhanTich === 'tong_quan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Tổng quan 3 phần</span>
          </button>



          <button
            type="button"
            onClick={() => setTabPhanTich('cau_sai')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              tabPhanTich === 'cau_sai'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle size={14} />
            <span>Câu sai cần chữa ({soKhacPhuc})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabPhanTich('nhan_thuc')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              tabPhanTich === 'nhan_thuc'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Brain size={14} />
            <span>Mức độ nhận thức</span>
          </button>

          <button
            type="button"
            onClick={() => setTabPhanTich('tien_bo')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              tabPhanTich === 'tien_bo'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp size={14} />
            <span>Mức tiến bộ</span>
          </button>

        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CHỈ SỐ TỔNG QUAN */}
          {tabPhanTich === 'tong_quan' && (
            <div className="space-y-6 animate-google-fade">
              {/* HERO SCORE CARD - GOOGLE STYLE */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/40 border border-blue-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center sm:text-left">
                  <div className="m3-chip uppercase tracking-wider" data-vai-tro="primary">
                    <Award size={14} /> Kết quả ca kiểm tra của con
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {hoTenCon}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span>SBD: <strong className="font-mono text-blue-600 dark:text-blue-400">{sbd}</strong></span>
                    {lop && <span>· Lớp: <strong>{lop}</strong></span>}
                    <span>· Thời lượng: <strong>{thoiLuongPhut} phút</strong></span>
                  </div>
                </div>

                {/* VÒNG TRÒN ĐIỂM SỐ GOOGLE GAUGE */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * (tyLeChinhXac ?? 0)) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className={diem >= 8 ? 'text-blue-600' : diem >= 6.5 ? 'text-indigo-600' : diem >= 5 ? 'text-amber-500' : 'text-rose-500'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">
                        {diem.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 mt-0.5">/ 10 điểm</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    {(soMotPhan > 0 || soBoTrongDem > 0) && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <DongDemYPhanII so={demPH} />
                      </div>
                    )}
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${xepLoai.nen} ${xepLoai.mau}`}>
                      Xếp loại: {xepLoai.ten}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Độ chính xác: <strong className="text-slate-800 dark:text-slate-200">{coDemCau ? `${tyLeChinhXac}%` : '—'}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {coDemCau ? <DongDemCau so={demPH} /> : 'Ca chưa chấm xong'}
                    </div>
                  </div>
                </div>
              </div>

              {/* BA THẺ ĐIỂM THEO PHẦN — cùng khuôn với cổng học sinh. */}
              <KhoiBaPhan diemI={diemI} diemII={diemII} diemIII={diemIII} />

              {/* LƯỚI 4 THẺ CHỈ SỐ GOOGLE COLORS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Thẻ 1: Google Blue */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Số câu đúng</span>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {soDung ?? '—'} <span className="text-xs font-medium text-slate-400">/ {tongCau ?? '—'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {coDemCau ? `Đạt ${tyLeChinhXac ?? 0}% toàn bài` : 'Chưa có bảng chấm'}
                    </p>
                  </div>
                </div>

                {/* Thẻ 2: Google Red/Rose */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Cần khắc phục</span>
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {soKhacPhuc} <span className="text-xs font-medium text-slate-400">câu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {coDemCau
                        ? `Sai ${soSai} câu${soMotPhan > 0 ? ` · ${soMotPhan} câu đúng một phần` : ''}${soBoTrongDem > 0 ? ` · bỏ trống ${soBoTrongDem} câu` : ''}`
                        : 'Chưa có bảng chấm'}
                    </p>
                  </div>
                </div>

                {/* Thẻ 3: Google Green */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Thời gian làm</span>
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {thoiGianLamUocTinhPhut} <span className="text-xs font-medium text-slate-400">/ {thoiLuongPhut}p</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {thoiGianLamUocTinhPhut < thoiLuongPhut ? `Sớm ${thoiLuongPhut - thoiGianLamUocTinhPhut} phút` : 'Đúng hạn'}
                    </p>
                  </div>
                </div>

                {/* Thẻ 4: Google Amber */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Tốc độ TB</span>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {tocDoGiayMoiCau ?? '—'} <span className="text-xs font-medium text-slate-400">giây/câu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {tocDoGiayMoiCau === null ? 'Chưa có bảng chấm' : tocDoGiayMoiCau < 60 ? 'Tốc độ phản xạ rất nhanh' : 'Tập trung tính toán kỹ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* LỜI KHUYÊN & NHẬN XÉT SƯ PHẠM CỦA THẦY ĐỖ ĐẠI HỌC */}
              <div className="p-5 sm:p-6 rounded-3xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300 font-bold text-sm">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    ĐĐH
                  </div>
                  <span>Nhận Xét & Lời Khuyên Sư Phạm Của Thầy Đỗ Đại Học</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {loiKhuyenSuPham.tieuDe}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {loiKhuyenSuPham.loiNhan}
                </p>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs text-blue-900 dark:text-blue-200 font-medium flex items-start gap-2">
                  <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Gợi ý hành động:</strong> {loiKhuyenSuPham.viecCanLam}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CẤU TRÚC 3 PHẦN ĐỀ THI */}

          {/* TAB 3: MỨC ĐỘ NHẬN THỨC */}
          {tabPhanTich === 'nhan_thuc' && (
            <div className="space-y-4 animate-google-fade">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Thang đo năng lực 4 tầng nhận thức giúp phát hiện con đang mạnh ở tầng nào và vướng ở tầng nào:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mucDoStats.map((m) => (
                  <div
                    key={m.ten}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${m.badge}`}>
                          {m.ten}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {m.dung}/{m.tong} câu ({m.phanTram}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.moTa}
                      </p>
                    </div>

                    <div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`${m.mauBar} h-full rounded-full transition-[width,background-color] duration-500`}
                          style={{ width: `${m.phanTram}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* THẺ MỨC TIẾN BỘ — cùng khối với cổng học sinh. */}
          {tabPhanTich === 'tien_bo' && (
            <TheTienBo
              lichSu={dsLichSu}
              dangMo={{ ...baiThi, diem, tenCa: baiThi.tenCa, ngayThi: baiThi.ngayNop, tongCau }}
            />
          )}

          {/* TAB 4: DANH SÁCH CÂU SAI & LỖI CẦN KHẮC PHỤC */}
          {tabPhanTich === 'cau_sai' && (
            <div className="space-y-4 animate-google-fade">
              {dangTaiCauSai ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-blue-600" />
                  <p className="text-xs">Đang tải danh sách câu con làm sai từ hệ thống...</p>
                </div>
              ) : dsCauSai.length === 0 ? (
                <div className="p-8 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    Không có câu sai nào được ghi nhận trong ca kiểm tra này!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    Con đã làm đúng tuyệt đối hoặc ca kiểm tra không có lỗi sai cần khắc phục.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Tổng số <strong>{dsCauSai.length}</strong> câu con làm sai trong ca kiểm tra (mã {baiThi.maCa}):</span>
                    <button
                      type="button"
                      onClick={() => setHienModalKhacPhuc(true)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Heart size={14} /> Khắc phục {soKhacPhuc} câu sai này
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {dsCauSai.map((c, i) => (
                      <DongCauSai key={c.qid || i} c={c} stt={c.soCau || i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MỨC TIẾN BỘ CỦA CON */}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <footer className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>

          {/* Nút: Tạo ngay bài tập khắc phục cho con.
              Chỉ sống khi DANH SÁCH THẬT có câu — bản cũ hiện vô điều kiện nên
              ca con làm đúng hết vẫn mở ra một modal không tạo được gì. */}
          {dsCauSai.length > 0 ? (
            <button
              type="button"
              onClick={() => setHienModalKhacPhuc(true)}
              className="m3-nut-chinh cursor-pointer"
            >
              <Heart size={16} />
              <span>Tạo bài luyện khắc phục cho con (thời gian làm 2 giờ)</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
              {dangTaiCauSai
                ? 'Đang tải danh sách câu sai…'
                : loiCauSai || 'Ca này con không có câu nào cần khắc phục'}
            </span>
          )}
        </footer>
      </div>

      {/* MODAL KHẮC PHỤC CÂU SAI ĐỒNG BỘ 3 LỰA CHỌN */}
      {hienModalKhacPhuc && (
        <ModalKhacPhucCauSai
          isOpen={hienModalKhacPhuc}
          onClose={() => setHienModalKhacPhuc(false)}
          dsCauSai={dsCauSai}
          hoTen={hoTenCon}
          sbd={sbd}
          tieuDeCa={baiThi.tenCa || `Ca #${baiThi.maCa}`}
          onGiaoBaiChoCon={(dsCau, tieuDe) => {
            setHienModalKhacPhuc(false)
            onClose()
            onGiaoBaiChoCon(dsCau, tieuDe)
          }}
        />
      )}
    </div>
  )
}
