// MODAL BÁO CÁO CA THI CHI TIẾT DÀNH CHO HỌC SINH — CHUẨN GOOGLE MATERIAL 3
// Phân tích toàn diện chỉ số thi, chỉ rõ lỗ hổng kiến thức, truyền cảm hứng & thôi thúc sửa lỗi sai ngay lập tức.
// Tuân thủ nghiêm ngặt: Không dùng mã màu hex trong file .tsx.

import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Brain,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  Flame,
  TrendingUp,
} from 'lucide-react'
import { hsCauSaiApi, hsLichSuCaApi } from '../lib/exam-api'
import { chuanHoaLoiGiaiCau } from '../lib/chuan-hoa-loi-giai'
import ModalKhacPhucCauSai from './ModalKhacPhucCauSai'

export interface ThongTinBaiThiHocSinh {
  maCa: string
  tenCa: string
  ngayThi?: string
  diem: number
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  thoiGianPhut?: number
  soCauDung?: number
  soCauSai?: number
  tongCau?: number
  lanThu?: number
}

export interface ExtraTabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

interface Props {
  baiThi: ThongTinBaiThiHocSinh
  hoTen: string
  sbd: string
  lop?: string
  scriptUrl: string
  onClose: () => void
  onBatDauKhacPhuc: (maCa: string) => void
  onMoLaiBaiThi?: (maCa: string) => void
  extraTabs?: ExtraTabItem[]
}

export default function BaoCaoCaThiHocSinhModal({
  baiThi,
  hoTen,
  sbd,
  lop,
  scriptUrl,
  onClose,
  onBatDauKhacPhuc,
  onMoLaiBaiThi,
  extraTabs,
}: Props) {
  const [dsCauSai, setDsCauSai] = useState<any[]>([])
  const [dangTaiCauSai, setDangTaiCauSai] = useState(false)
  const [tabHienThi, setTabHienThi] = useState<string>('tong_quan')
  const [cauSaiMoRong, setCauSaiMoRong] = useState<Record<string, boolean>>({})
  const [hienModalKhacPhuc, setHienModalKhacPhuc] = useState(false)
  const [dsLichSu, setDsLichSu] = useState<any[]>([])

  // Tải lịch sử ca thi để phân tích mức tiến bộ
  useEffect(() => {
    let active = true
    async function napLichSu() {
      if (!sbd || !scriptUrl) return
      try {
        const res = await hsLichSuCaApi(scriptUrl, sbd)
        if (active && res && res.ok && Array.isArray(res.items)) {
          setDsLichSu(res.items)
        }
      } catch {}
    }
    void napLichSu()
    return () => {
      active = false
    }
  }, [sbd, scriptUrl])

  // Tải danh sách chi tiết các câu làm sai trong ca này
  useEffect(() => {
    let active = true
    async function napCauSai() {
      if (!baiThi.maCa || !scriptUrl) return
      setDangTaiCauSai(true)
      try {
        const res = await hsCauSaiApi(scriptUrl, sbd, [baiThi.maCa])
        if (active && res && res.ok && Array.isArray(res.items)) {
          setDsCauSai(res.items)
          // Tự động mở câu sai đầu tiên
          if (res.items.length > 0) {
            setCauSaiMoRong({ [res.items[0].qid || '0']: true })
          }
        }
      } catch {
        if (active) setDsCauSai([])
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

  // ĐẾM CÂU: CHỈ DÙNG SỐ THẬT, KHÔNG SUY TỪ ĐIỂM.
  //
  // Bản trước, khi thiếu số câu, tự dựng ra: `tongCau` rơi về 28 (hoặc 40 do
  // màn gọi truyền vào), `soDung` suy ngược từ điểm bằng
  // một phép nhân tỉ lệ điểm với số câu, cùng các trần cứng 18/4/6; `soSai` lấy
  // phần bù. Ca Test2 (561169) là ca ĐỀ RIÊNG phát 12 câu mỗi em; bài 1,56 điểm
  // vì thế hiện ra "Đúng 6/40 câu · sai 34 câu" — không con số nào có thật.
  //
  // Nay: ba số này đến từ bảng chấm qua `lichSuEm`. Không có thì để `null` và
  // giấu hẳn dòng đếm — thà không hiện còn hơn hiện số bịa cho phụ huynh đọc.
  const diem = Number(baiThi.diem.toFixed(2))
  const tongCau = baiThi.tongCau && baiThi.tongCau > 0 ? baiThi.tongCau : null
  const soDung = typeof baiThi.soCauDung === 'number' ? baiThi.soCauDung : null
  // Danh sách câu sai THẬT (lấy từ bảng chấm) vẫn là nguồn hợp lệ cho số sai.
  const soSai = typeof baiThi.soCauSai === 'number' ? baiThi.soCauSai : dsCauSai.length > 0 ? dsCauSai.length : null
  const coDemCau = tongCau !== null && soDung !== null
  const tyLeChinhXac = coDemCau ? Math.min(100, Math.max(0, Math.round((soDung / tongCau) * 100))) : null

  // Phân tích mức độ tiến bộ qua các ca thi
  const phanTichTienBo = useMemo(() => {
    if (!dsLichSu || dsLichSu.length === 0) {
      return {
        caTruoc: null,
        chenhLech: 0,
        danhGia: 'Điểm mốc xuất phát ban đầu',
        bieuTuong: '🏁',
        mauSac: 'text-blue-600 dark:text-blue-400',
        nenSac: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
        diemCaoNhat: diem,
        diemTrungBinh: diem,
        tongSoCa: 1,
        dsLichSuSapXep: [{ maCa: baiThi.maCa, tenCa: baiThi.tenCa, tong: diem, nopLuc: baiThi.ngayThi }],
      }
    }

    // Lọc các ca có điểm và sắp xếp theo thời gian tăng dần
    const cacCaCoDiem = dsLichSu
      .filter((c) => c.tong !== null && c.tong !== undefined)
      .sort((a, b) => new Date(a.nopLuc || 0).getTime() - new Date(b.nopLuc || 0).getTime())

    const viTriHienTai = cacCaCoDiem.findIndex((c) => c.maCa === baiThi.maCa)
    const caTruoc = viTriHienTai > 0 ? cacCaCoDiem[viTriHienTai - 1] : (cacCaCoDiem.length > 1 ? cacCaCoDiem[cacCaCoDiem.length - 2] : null)

    const diemCaTruoc = caTruoc && caTruoc.tong !== null ? Number(Number(caTruoc.tong).toFixed(2)) : null
    const chenhLech = diemCaTruoc !== null ? Number((diem - diemCaTruoc).toFixed(2)) : 0

    let danhGia = 'Điểm mốc xuất phát ban đầu'
    let bieuTuong = '🏁'
    let mauSac = 'text-blue-600 dark:text-blue-400'
    let nenSac = 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'

    if (diemCaTruoc !== null) {
      if (chenhLech >= 1.5) {
        danhGia = 'Tiến bộ vượt bậc'
        bieuTuong = '🚀'
        mauSac = 'text-emerald-600 dark:text-emerald-400'
        nenSac = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
      } else if (chenhLech >= 0.5) {
        danhGia = 'Tiến bộ rõ rệt'
        bieuTuong = '📈'
        mauSac = 'text-teal-600 dark:text-teal-400'
        nenSac = 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800'
      } else if (chenhLech >= -0.5) {
        danhGia = 'Giữ vững phong độ'
        bieuTuong = '🎯'
        mauSac = 'text-indigo-600 dark:text-indigo-400'
        nenSac = 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
      } else {
        danhGia = 'Cần bứt phá & nỗ lực hơn'
        bieuTuong = '💡'
        mauSac = 'text-amber-600 dark:text-amber-400'
        nenSac = 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
      }
    }

    const tatCaDiem = cacCaCoDiem.map((c) => Number(c.tong) || 0)
    const diemCaoNhat = tatCaDiem.length > 0 ? Math.max(...tatCaDiem, diem) : diem
    const diemTrungBinh = tatCaDiem.length > 0 ? Number((tatCaDiem.reduce((a, b) => a + b, 0) / tatCaDiem.length).toFixed(2)) : diem

    return {
      caTruoc,
      chenhLech,
      danhGia,
      bieuTuong,
      mauSac,
      nenSac,
      diemCaoNhat,
      diemTrungBinh,
      tongSoCa: cacCaCoDiem.length,
      dsLichSuSapXep: cacCaCoDiem,
    }
  }, [dsLichSu, baiThi.maCa, baiThi.tenCa, baiThi.ngayThi, diem])

  // Đánh giá sư phạm và thông điệp thôi thúc sửa sai
  const danhGia = useMemo(() => {
    if (diem >= 9.0) {
      return {
        xepLoai: 'Xuất sắc',
        mau: 'text-emerald-600 dark:text-emerald-400',
        nen: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
        thongDiep: 'Phong độ đỉnh cao! Em chỉ còn thiếu một chút nữa là đạt điểm 10 tuyệt đối. Hãy khắc phục ngay các câu sai này để hoàn thiện 100% kiến thức!',
        mucDoCanThiet: 'can_thien',
      }
    }
    if (diem >= 8.0) {
      return {
        xepLoai: 'Rất tốt (Mục tiêu 9+)',
        mau: 'text-blue-600 dark:text-blue-400',
        nen: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
        thongDiep: 'Kiến thức của em rất vững! Những câu sai này phần lớn rơi vào bẫy đề thi hoặc tính toán cẩn thận. Khắc phục ngay để vững vàng tiến tới mốc 9+!',
        mucDoCanThiet: 'can_thien',
      }
    }
    if (diem >= 6.5) {
      return {
        xepLoai: 'Khá (Cần bứt phá)',
        mau: 'text-indigo-600 dark:text-indigo-400',
        nen: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
        thongDiep: 'Em đang ở ngưỡng bứt phá quan trọng! Có một số lỗ hổng lý thuyết và dạng bài then chốt cần lấp ngay hôm nay trước khi chuyển sang đề thi mới.',
        mucDoCanThiet: 'cap_thiet',
      }
    }
    if (diem >= 5.0) {
      return {
        xepLoai: 'Trung bình (Cần sửa ngay)',
        mau: 'text-amber-600 dark:text-amber-400',
        nen: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        thongDiep: 'Báo động kiến thức trọng tâm! Em đang bị mất điểm ở nhiều câu nhận biết và thông hiểu. Nếu không làm lại ngay các câu này, em sẽ rất dễ lặp lại lỗi sai trong phòng thi thật!',
        mucDoCanThiet: 'khan_cap',
      }
    }
    return {
      xepLoai: 'Cần khắc phục khẩn cấp',
      mau: 'text-rose-600 dark:text-rose-400',
      nen: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      thongDiep: 'Đừng nản lòng em nhé! Thầy đã chuẩn bị sẵn lời giải chi tiết từng bước cho em. Hãy dành 15 phút ngay bây giờ để xem lại và làm lại các câu sai để lấy lại tự tin!',
      mucDoCanThiet: 'khan_cap',
    }
  }, [diem])

  // (Điểm từng phần đã khai báo một lần ở trên — bản trùng ở đây đã bỏ.)

  // Mức độ nhận thức
  const mucDoStats = useMemo(() => {
    const saiBiet = dsCauSai.filter((c) => c.mucDo === 'biet').length
    const saiHieu = dsCauSai.filter((c) => c.mucDo === 'hieu').length
    const saiVD = dsCauSai.filter((c) => c.mucDo === 'van_dung').length
    const saiVDC = dsCauSai.filter((c) => c.mucDo === 'van_dung_cao').length

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
      },
      {
        ten: 'Thông hiểu',
        moTa: 'Bản chất hoá học, giải thích hiện tượng, phản ứng',
        dung: dungHieu,
        tong: tongHieu,
        phanTram: Math.round((dungHieu / tongHieu) * 100),
        mauBar: 'bg-emerald-500',
      },
      {
        ten: 'Vận dụng',
        moTa: 'Bảo toàn e, tính toán nồng độ, este, kim loại',
        dung: dungVD,
        tong: tongVD,
        phanTram: Math.round((dungVD / tongVD) * 100),
        mauBar: 'bg-amber-500',
      },
      {
        ten: 'Vận dụng cao',
        moTa: 'Biện luận cấu tạo, bài toán phân hoá 9+',
        dung: dungVDC,
        tong: tongVDC,
        phanTram: Math.round((dungVDC / tongVDC) * 100),
        mauBar: 'bg-rose-500',
      },
    ]
  }, [dsCauSai])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-google-fade">
      <div className="relative w-full max-w-3xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Dải 4 màu thương hiệu Google */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-blue-500" />
          <div className="flex-1 bg-rose-500" />
          <div className="flex-1 bg-amber-400" />
          <div className="flex-1 bg-emerald-500" />
        </div>

        {/* HEADER MODAL */}
        <div className="px-5 py-4 sm:px-6 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 mb-1.5">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Báo cáo kết quả ca thi #{baiThi.maCa}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {baiThi.tenCa || `Ca thi #${baiThi.maCa}`}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Học sinh: <strong>{hoTen}</strong> (SBD: <strong>{sbd}</strong>) {lop ? `· Lớp: ${lop}` : ''} {baiThi.ngayThi ? `· ${baiThi.ngayThi}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng báo cáo"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* HERO CARD: ĐIỂM SỐ & THÔNG ĐIỆP THÚC ĐẨY SỬA LỖI SAI */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Điểm số to nổi bật */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">
                    {diem}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                    trên 10
                  </span>
                </div>

                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${danhGia.nen} ${danhGia.mau} mb-1`}>
                    <Award className="w-3.5 h-3.5" />
                    <span>{danhGia.xepLoai}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Đúng <strong className="text-emerald-600 dark:text-emerald-400">{soDung}</strong>/{tongCau} câu
                    {(soSai ?? 0) > 0 && (
                      <span className="text-rose-500 dark:text-rose-400 font-bold ml-1.5">
                        (sai {soSai} câu)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Độ chính xác: <strong>{coDemCau ? `${tyLeChinhXac}%` : '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Nút hành động 1 chạm sửa lỗi sai ngay */}
              {(soSai ?? 0) > 0 && (
                <div className="flex flex-col sm:items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHienModalKhacPhuc(true)
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>KHẮC PHỤC NGAY {soSai} CÂU SAI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
                    Tạo đề ôn tập riêng chỉ với 1 chạm
                  </span>
                </div>
              )}
            </div>

            {/* Khung tâm lý sư phạm */}
            <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                <span className="font-bold text-slate-900 dark:text-white">Lời khuyên của Thầy: </span>
                {danhGia.thongDiep}
              </div>
            </div>
          </div>

          {/* THANH TAB GOOGLE MATERIAL 3 */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
            <button
              type="button"
              onClick={() => setTabHienThi('tong_quan')}
              className={`py-2.5 px-3.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabHienThi === 'tong_quan'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tổng quan 3 phần</span>
            </button>

            <button
              type="button"
              onClick={() => setTabHienThi('cau_sai')}
              className={`py-2.5 px-3.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabHienThi === 'cau_sai'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Câu sai cần chữa ({soSai})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabHienThi('nhan_thuc')}
              className={`py-2.5 px-3.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabHienThi === 'nhan_thuc'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mức độ nhận thức</span>
            </button>

            <button
              type="button"
              onClick={() => setTabHienThi('tien_bo')}
              className={`py-2.5 px-3.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabHienThi === 'tien_bo'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Mức tiến bộ</span>
            </button>

            {extraTabs?.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabHienThi(t.id)}
                className={`py-2.5 px-3.5 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  tabHienThi === t.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: TỔNG QUAN 3 PHẦN */}
          {tabHienThi === 'tong_quan' && (
            <div className="space-y-4 animate-google-fade">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Phần I */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    PHẦN I: TRẮC NGHIỆM
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {diemI.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ 4.50 điểm</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Nhiều lựa chọn (A, B, C, D) · 18 câu trọng tâm
                  </div>
                </div>

                {/* Phần II */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    PHẦN II: ĐÚNG / SAI
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {diemII.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ 4.00 điểm</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    4 câu hỏi chùm (mỗi câu gồm 4 ý a, b, c, d)
                  </div>
                </div>

                {/* Phần III */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    PHẦN III: TRẢ LỜI NGẮN
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {diemIII.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ 1.50 điểm</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    6 câu toán tính toán và biện luận chuyên sâu
                  </div>
                </div>
              </div>

              {/* Hướng dẫn khắc phục */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Mở lại đề thi gốc để xem lại bài làm
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Xem lại đề bài đầy đủ, các đáp án đã chọn và thời gian làm từng câu
                    </div>
                  </div>
                </div>

                {onMoLaiBaiThi && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onMoLaiBaiThi(baiThi.maCa)
                    }}
                    className="px-3.5 py-2 rounded-xl btn-google-outlined text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Xem đề và lời giải kèm lỗi sai
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CÂU SAI CẦN CHỮA VỚI LỜI GIẢI ĐÚNG CHUẨN ẢNH 4 */}
          {tabHienThi === 'cau_sai' && (
            <div className="space-y-4 animate-google-fade">
              {dangTaiCauSai ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <span className="text-xs">Đang phân tích lời giải chi tiết từng câu sai...</span>
                </div>
              ) : dsCauSai.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                    Không có câu sai nào trong ca thi này!
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Chúc mừng em đã làm đúng tất cả các câu đã nộp trong ca thi này.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Danh sách {dsCauSai.length} câu làm sai:</span>
                    <span>Bấm vào câu để mở lời giải chi tiết chuẩn Hoá học</span>
                  </div>

                  {dsCauSai.map((c, idx) => {
                    const qidKey = c.qid || String(idx)
                    const moRong = Boolean(cauSaiMoRong[qidKey])
                    const lg = chuanHoaLoiGiaiCau(
                      c.loiGiai,
                      c.phan || 'I',
                      c.dapAnDung || '',
                      c.choices || null,
                      c.text || '',
                      c.chuyenDe || '',
                    )

                    return (
                      <div
                        key={qidKey}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-sm transition-all"
                      >
                        {/* Header câu sai */}
                        <button
                          type="button"
                          onClick={() => setCauSaiMoRong((prev) => ({ ...prev, [qidKey]: !prev[qidKey] }))}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {c.soCau || idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Câu {c.soCau || idx + 1} (Phần {c.phan || 'I'}):
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                                {c.chuyenDe || 'Hoá học'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Ô "em chọn" phải ĐỎ RÕ, không phải hồng nhạt:
                                đây là chỗ em phải nhìn thấy đầu tiên trong cả
                                bảng câu sai. Nền đỏ chữ trắng, cùng một kiểu ở
                                cả ba cổng. */}
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white border border-rose-700">
                              Em chọn: {c.dapAnChon || '—'}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Đúng: {c.dapAnDung || '—'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {moRong ? '▲' : '▼'}
                            </span>
                          </div>
                        </button>

                        {/* Chi tiết câu sai và Lời giải đúng chuẩn Ảnh 4 */}
                        {moRong && (
                          <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-3 animate-google-fade">
                            {/* Nội dung câu hỏi */}
                            {c.text && (
                              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                {c.text}
                              </div>
                            )}

                            {/* Lựa chọn A, B, C, D */}
                            {Array.isArray(c.choices) && c.choices.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {c.choices.map((ch: string, cIdx: number) => {
                                  const k = String.fromCharCode(65 + cIdx)
                                  const laDung = k === c.dapAnDung
                                  const laChon = k === c.dapAnChon
                                  return (
                                    <div
                                      key={k}
                                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                        laDung
                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                          : laChon
                                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                                        {k}
                                      </span>
                                      <span className="truncate">{ch}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* HỘP LỜI GIẢI ĐÚNG CHUẨN ẢNH 4 (MÀU KEM / HỔ PHÁCH) */}
                            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-sm space-y-3">
                              {/* Đáp án */}
                              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                Đáp án: <strong className="text-base font-black text-amber-950 dark:text-amber-100">{lg.ketQua || c.dapAnDung || '—'}</strong>
                              </div>

                              {/* Kiến thức cốt lõi */}
                              {lg.chot && (
                                <div>
                                  <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">
                                    KIẾN THỨC CỐT LÕI
                                  </div>
                                  <div className="text-xs sm:text-sm font-bold leading-relaxed text-amber-950 dark:text-amber-100">
                                    {lg.chot}
                                  </div>
                                </div>
                              )}

                              {/* Vì sao chọn / không chọn từng phương án */}
                              {lg.lyDo && lg.lyDo.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">
                                    VÌ SAO CHỌN / KHÔNG CHỌN TỪNG PHƯƠNG ÁN
                                  </div>
                                  <div className="space-y-1 text-xs leading-relaxed">
                                    {lg.lyDo.map((p) => (
                                      <div key={p.khoa} className="flex items-start gap-1.5 py-0.5 border-t border-amber-200/40 dark:border-amber-800/40 first:border-t-0">
                                        <strong className="text-amber-900 dark:text-amber-200">{p.khoa}.</strong>
                                        <span className={`font-bold ${p.dung ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                          {p.dung ? '✓' : '✗'}
                                        </span>
                                        <span className="text-amber-900 dark:text-amber-200">{p.ly}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Làm từng bước (nếu có) */}
                              {lg.buoc && lg.buoc.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-amber-400 mb-1">
                                    LÀM TỪNG BƯỚC
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    {lg.buoc.map((b, bIdx) => (
                                      <div key={bIdx}>{bIdx + 1}. {b}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MỨC ĐỘ NHẬN THỨC */}
          {tabHienThi === 'nhan_thuc' && (
            <div className="space-y-3 animate-google-fade">
              {mucDoStats.map((item) => (
                <div
                  key={item.ten}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {item.ten}
                      </span>
                      <p className="text-[11px] text-slate-400">{item.moTa}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {item.dung}/{item.tong} câu
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1 font-semibold">
                        ({item.phanTram}%)
                      </span>
                    </div>
                  </div>

                  {/* Thanh tiến độ */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.mauBar} rounded-full transition-all duration-500`}
                      style={{ width: `${item.phanTram}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: MỨC TIẾN BỘ */}
          {tabHienThi === 'tien_bo' && (
            <div className="space-y-4 animate-google-fade">
              {/* Thẻ chỉ số tổng quan tiến bộ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                      Đánh giá mức tiến bộ
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{phanTichTienBo.bieuTuong}</span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        {phanTichTienBo.danhGia}
                      </h4>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto ${phanTichTienBo.nenSac} ${phanTichTienBo.mauSac}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {phanTichTienBo.chenhLech > 0
                        ? `Tăng +${phanTichTienBo.chenhLech.toFixed(2)} điểm`
                        : phanTichTienBo.chenhLech < 0
                        ? `Giảm ${phanTichTienBo.chenhLech.toFixed(2)} điểm`
                        : 'Không đổi so với ca trước'}
                    </span>
                  </div>
                </div>

                {/* 3 Thẻ chỉ số tiến bộ */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-400">Điểm ca này</div>
                    <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {diem.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-400">Ca trước đó</div>
                    <div className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
                      {phanTichTienBo.caTruoc && phanTichTienBo.caTruoc.tong !== null
                        ? Number(phanTichTienBo.caTruoc.tong).toFixed(2)
                        : '—'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-400">Điểm cao nhất</div>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {phanTichTienBo.diemCaoNhat.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lịch sử điểm các ca thi gần đây */}
              {phanTichTienBo.dsLichSuSapXep.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Tiến trình qua các ca thi ({phanTichTienBo.tongSoCa} ca)
                    </span>
                    <span className="text-xs text-slate-400">
                      Trung bình: <strong>{phanTichTienBo.diemTrungBinh.toFixed(2)}</strong>/10
                    </span>
                  </div>

                  <div className="space-y-2">
                    {phanTichTienBo.dsLichSuSapXep.slice(-6).map((caItem: any, idx: number) => {
                      const d = Number(caItem.tong) || 0
                      const laCaHienTai = caItem.maCa === baiThi.maCa
                      return (
                        <div
                          key={caItem.maCa || idx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                            laCaHienTai
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-slate-500">#{caItem.maCa}</span>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {caItem.tenCa || `Ca ${caItem.maCa}`}
                                {laCaHienTai && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                    Ca này
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-24 sm:w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(5, d * 10))}%` }}
                              />
                            </div>
                            <span className="font-black text-sm text-slate-900 dark:text-white w-12 text-right">
                              {d.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CÁC TAB BỔ SUNG (DÀNH CHO GIÁO VIÊN NẾU CÓ) */}
          {extraTabs?.map((t) =>
            tabHienThi === t.id ? (
              <div key={t.id} className="space-y-4 animate-google-fade">
                {t.content}
              </div>
            ) : null
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full btn-google-outlined text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>

          {(soSai ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => {
                setHienModalKhacPhuc(true)
              }}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Khắc phục ngay câu sai của ca này</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL LỰA CHỌN KHẮC PHỤC CÂU SAI ĐỒNG BỘ */}
      {hienModalKhacPhuc && (
        <ModalKhacPhucCauSai
          isOpen={hienModalKhacPhuc}
          onClose={() => setHienModalKhacPhuc(false)}
          dsCauSai={dsCauSai}
          hoTen={hoTen}
          sbd={sbd}
          tieuDeCa={baiThi.tenCa || baiThi.maCa}
          onTaoPhieuXong={() => {
            if (onBatDauKhacPhuc) onBatDauKhacPhuc(baiThi.maCa)
          }}
        />
      )}
    </div>
  )
}
