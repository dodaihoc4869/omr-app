// MODAL BÁO CÁO CA THI CHI TIẾT DÀNH CHO HỌC SINH — CHUẨN GOOGLE MATERIAL 3
// Phân tích toàn diện chỉ số thi, chỉ rõ lỗ hổng kiến thức, truyền cảm hứng & thôi thúc sửa lỗi sai ngay lập tức.
// Tuân thủ nghiêm ngặt: Không dùng mã màu hex trong file .tsx.

import { useEffect, useState, useMemo } from 'react'
import DongDemCau, { DongDemYPhanII, docSoDem } from './DongDemCau'
import { DongCauSai } from './KhoiCauSai'
import KhoiBaPhan from './KhoiBaPhan'
import TheTienBo, { type CaLichSu } from './TheTienBo'
import { danhGiaBai } from '../lib/danh-gia-bai'
import { createPortal } from 'react-dom'
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
  FileQuestion,
} from 'lucide-react'
import { hsCauSaiApi, hsLichSuCaApi } from '../lib/exam-api'
import ModalKhacPhucCauSai from './ModalKhacPhucCauSai'
import { dungM3 } from './m3'

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
  /** Bốn nhóm rời nhau + đếm theo Ý phần II (thêm 14/09, ca Test4).
   * Xem `src/lib/dem-ket-qua.ts` — một luật cho cả ba app. */
  soCauDungMotPhan?: number | null
  soCauBoTrong?: number | null
  soYDungII?: number | null
  soYTongII?: number | null
  lanThu?: number
}

// BÁO CÁO CHỈ CÓ ĐÚNG BỐN THẺ (thầy chốt 14/09): Tổng quan 3 phần · Câu sai cần
// chữa · Mức độ nhận thức · Mức tiến bộ. Cơ chế "thẻ bổ sung" đã bỏ hẳn — còn
// nó là màn nào cũng chèn thêm được một thẻ riêng, và báo cáo lại lệch nhau.

interface Props {
  baiThi: ThongTinBaiThiHocSinh
  hoTen: string
  sbd: string
  lop?: string
  scriptUrl: string
  onClose: () => void
  /** Bấm "Bắt đầu làm bài" trong modal khắc phục.
   *
   * `html` là TỜ PHIẾU vừa dựng xong. Bản trước bỏ tham số này, `onTaoPhieuXong`
   * nhận html rồi vứt đi và chỉ gọi `onBatDauKhacPhuc(maCa)` — mà nhánh ấy bên
   * `StudentPortalScreen` lại đi tải câu sai rồi MỞ LẠI ĐÚNG modal vừa bấm.
   * Em bấm "Bắt đầu làm bài" thì quay về chính màn ấy, không bao giờ ra đề.
   * Đó là lỗi thầy báo 14/09: "khắc phục lỗi sai trên điện thoại app học sinh
   * không chạy". Nay tờ phiếu đi kèm để chỗ gọi mở thẳng. */
  onBatDauKhacPhuc: (maCa: string, html?: string) => void
  onMoLaiBaiThi?: (maCa: string) => void
  tabMacDinh?: string
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
  tabMacDinh = 'tong_quan',
}: Props) {
  const [dsLichSu, setDsLichSu] = useState<CaLichSu[]>([])
  const [dsCauSai, setDsCauSai] = useState<any[]>([])
  const [dangTaiCauSai, setDangTaiCauSai] = useState(false)
  /** Vì sao chưa lấy được danh sách — hiện ra, cấm nuốt lỗi im lặng. */
  const [loiCauSai, setLoiCauSai] = useState('')
  const [tabHienThi, setTabHienThi] = useState<string>(tabMacDinh)
  const [hienModalKhacPhuc, setHienModalKhacPhuc] = useState(false)

  // Tải lịch sử ca thi để phân tích mức tiến bộ
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

  // Tải danh sách chi tiết các câu làm sai trong ca này
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
  const diemGoc = typeof baiThi.diem === 'number' ? baiThi.diem : 0
  const diemI = baiThi.diemI !== null && baiThi.diemI !== undefined ? baiThi.diemI : Number((diemGoc * 0.45).toFixed(2))
  const diemII = baiThi.diemII !== null && baiThi.diemII !== undefined ? baiThi.diemII : Number((diemGoc * 0.40).toFixed(2))
  const diemIII = baiThi.diemIII !== null && baiThi.diemIII !== undefined ? baiThi.diemIII : Number((diemGoc * 0.15).toFixed(2))

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
  const diem = Number(diemGoc.toFixed(2))
  const tongCau = baiThi.tongCau && baiThi.tongCau > 0 ? baiThi.tongCau : null
  const soDung = typeof baiThi.soCauDung === 'number' ? baiThi.soCauDung : null
  // Danh sách câu sai (bao gồm cả câu chưa làm / bỏ trống)
  // BỐN NHÓM RỜI NHAU, KHÔNG TRỪ NGƯỢC (thầy bắt 14/09, ca Test4).
  //
  // Bản cũ lấy `soSai = tongCau - soDung`. Phép trừ ấy dồn cả câu BỎ TRỐNG lẫn
  // câu phần II ĐÚNG MỘT PHẦN vào "sai", nên bài được 2,00 điểm nhờ 6/8 ý phần
  // II vẫn bị in là "Sai 12 câu" — con số chọi thẳng vào cột điểm ngay cạnh nó.
  // Nay đọc đúng bốn con số máy chủ trả, qua một khuôn chung cho cả ba app.
  const dem = docSoDem(baiThi)
  // SỐ CÂU CẦN KHẮC PHỤC — mọi câu KHÔNG đúng trọn vẹn.
  //
  // Thầy chốt 14/09: "Câu bỏ trống cũng được tính vào khắc phục câu sai, câu
  // đúng sai mà không đúng hết thì cũng tính vào khắc phục câu sai."
  //
  // Con số này phải khớp ĐÚNG số dòng máy chủ trả về ở danh sách câu sai
  // (`hsCauSai` lọc `COALESCE(dung_sai,0) = 0`). Bản trước dùng `soSai` — chỉ
  // đếm câu sai hẳn — nên nút ghi "10 CÂU SAI" trong khi danh sách có 12 dòng.
  const soKhacPhuc = dem ? dem.soCanKhacPhuc : dsCauSai.length
  const soSaiRaw = typeof baiThi.soCauSai === 'number' ? baiThi.soCauSai : dsCauSai.length > 0 ? dsCauSai.length : null
  const soSai = dem ? dem.soSai : soSaiRaw
  const soMotPhan = dem ? dem.soDungMotPhan : 0
  const soBoTrongDem = dem ? dem.soBoTrong : 0
  const coDemCau = tongCau !== null && soDung !== null
  const soBoTrong = 0
  const tyLeChinhXac = coDemCau && tongCau !== null ? Math.min(100, Math.max(0, Math.round(((soDung ?? 0) / tongCau) * 100))) : null

  // Phân tích mức độ tiến bộ qua các ca thi


  // NHẬN XÉT PHẢI ĐÚNG VỚI CON SỐ CỦA CHÍNH BÀI NÀY.
  //
  // Bản cũ chỉ nhìn điểm, nên bài 10/10 vẫn được khen "chỉ còn thiếu một chút
  // nữa là đạt điểm 10" kèm lời hối thúc khắc phục một danh sách rỗng (thầy bắt
  // được 14/09). Nay dùng chung `danhGiaBai` với cổng phụ huynh: cùng một xếp
  // loại, cùng một câu chữ, và câu nào cũng nhắc đúng số câu còn phải chữa.
  const danhGia = useMemo(() => danhGiaBai(diem, soKhacPhuc, tongCau), [diem, soKhacPhuc, tongCau])

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

  if (typeof document === 'undefined') return null
  // Modal này còn được app giáo viên mở (HocSinhScreen, ExamMonitorScreen): CHỈ cổng học sinh / phụ huynh / màn thi mặc M3.
  const m3 = dungM3()
  return createPortal(
    <div className={`${m3 ? 'm3 ' : ''}fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-google-fade`}>
      <div className="relative w-full max-w-3xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Dải 4 màu thương hiệu Google */}
        <div className={`${m3 ? 'm3-an ' : ''}h-1.5 w-full flex`}>
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
                  {coDemCau ? (
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <DongDemCau so={baiThi} />
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {(soSai ?? 0) > 0 ? `Sai ${soSai} câu` : 'Bài thi đã hoàn thành'}
                    </div>
                  )}
                  {/* VÌ SAO EM CÓ ĐIỂM MÀ KHÔNG CÂU NÀO ĐÚNG TRỌN — phần II
                      chấm theo Ý, nên dòng này là câu trả lời bằng số. */}
                  {(soMotPhan > 0 || soBoTrongDem > 0) && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <DongDemYPhanII so={baiThi} />
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Độ chính xác: <strong>{coDemCau ? `${tyLeChinhXac}%` : '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Nút hành động 1 chạm sửa lỗi sai ngay */}
              {/* CỔNG MỞ NÚT VÀ RUỘT CỦA MODAL PHẢI CÙNG MỘT NGUỒN.
                  Thầy bắt 15/09, ca Test7: nút mở theo `soSai` (đếm từ bảng
                  chấm) nhưng modal chạy trên `dsCauSai` (danh sách `hsCauSai`
                  trả về). Hai nguồn lệch nhau một nhịp là ra đúng màn thầy
                  chụp: "0 câu làm sai" mà vẫn có nút bấm. Nay nút chỉ sống
                  khi DANH SÁCH THẬT có câu, còn lệch thì nói rõ lệch. */}
              {soKhacPhuc > 0 && (
                <div className="flex flex-col sm:items-end gap-2">
                  <button
                    type="button"
                    disabled={dsCauSai.length === 0}
                    onClick={() => {
                      setHienModalKhacPhuc(true)
                    }}
                    className={m3
                      ? 'm3-nut-chinh w-full sm:w-auto cursor-pointer'
                      : 'w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'}
                  >
                    <Flame className={m3 ? 'w-4 h-4' : 'w-4 h-4 text-amber-200 animate-pulse'} />
                    <span>
                      {`KHẮC PHỤC NGAY ${soKhacPhuc} CÂU SAI`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
                    {dsCauSai.length > 0
                      ? 'Tạo đề ôn tập riêng chỉ với 1 chạm'
                      : dangTaiCauSai
                        ? 'Đang tải danh sách câu sai…'
                        : loiCauSai || 'Chưa lấy được danh sách câu sai của ca này'}
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
              <span>Câu sai cần chữa ({soKhacPhuc})</span>
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
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mức tiến bộ</span>
            </button>


          </div>

          {/* TAB 1: TỔNG QUAN 3 PHẦN */}
          {tabHienThi === 'tong_quan' && (
            <div className="space-y-4 animate-google-fade">
              <KhoiBaPhan diemI={diemI} diemII={diemII} diemIII={diemIII} />

              {/* CHỈ CÒN CÁI NÚT.
                  Hai dòng chữ giải thích ở đây bị ép vào một cột hẹp trên điện
                  thoại nên rơi thành mỗi dòng một chữ, cao gần hết màn hình
                  (thầy chụp 14/09). Nút đã tự nói nó làm gì. */}
              <div className="flex justify-center">
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
                <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                  {soDung === tongCau && (tongCau ?? 0) > 0 ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        Tuyệt đối xuất sắc: Đúng tất cả {tongCau} câu!
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Chúc mừng em đã hoàn thành trọn vẹn và chính xác tất cả các câu trong ca thi này.
                      </div>
                    </>
                  ) : (soBoTrong ?? 0) > 0 ? (
                    <>
                      <FileQuestion className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Không có câu làm sai, nhưng còn {soBoTrong} câu chưa làm
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Em hãy ôn luyện lại kiến thức và dành thời gian làm hết các câu trong lần thi tiếp theo nhé.
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        Không có câu sai nào trong ca thi này!
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Chúc mừng em đã làm đúng tất cả các câu đã nộp trong ca thi này.
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Danh sách {dsCauSai.length} câu làm sai:</span>
                    <span>Bấm vào câu để mở lời giải chi tiết chuẩn Hoá học</span>
                  </div>

                  {dsCauSai.map((c, idx) => (
                    <DongCauSai key={c.qid || idx} c={c} stt={c.soCau || idx + 1} />
                  ))}
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

          {/* THẺ MỨC TIẾN BỘ — dùng chung `TheTienBo` với cổng phụ huynh. */}
          {tabHienThi === 'tien_bo' && <TheTienBo lichSu={dsLichSu} dangMo={{ ...baiThi, diem }} />}

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

          {soKhacPhuc > 0 && dsCauSai.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setHienModalKhacPhuc(true)
              }}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>{`Khắc phục ngay ${soKhacPhuc} câu sai của ca này`}</span>
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
          onTaoPhieuXong={(html) => {
            setHienModalKhacPhuc(false)
            if (onBatDauKhacPhuc) onBatDauKhacPhuc(baiThi.maCa, html)
          }}
        />
      )}
    </div>,
    document.body,
  )
}
