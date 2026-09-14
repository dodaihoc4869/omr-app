// DÒNG ĐẾM CÂU — MỘT KHUÔN CHUNG CHO CẢ BA APP.
//
// Thầy bắt được 14/09, ca Test4: em được 2,00 điểm mà cả ba app đều in "Đúng
// 0/12 câu · Sai 12 câu". Mỗi app trước đây tự nặn dòng ấy theo một công thức
// riêng — cổng học sinh lấy `tongCau - soCauDung`, cổng phụ huynh cũng thế,
// báo cáo thì lấy `soCauSai`. Ba công thức, ba con số, không chỗ nào sửa được
// một lần cho cả ba.
//
// Nay một khuôn duy nhất, đọc thẳng bốn con số RỜI NHAU máy chủ trả về.
import { chuTomTat, type KetQuaDem } from '../lib/dem-ket-qua'

export interface SoDemCau {
  tongCau?: number | null
  soCauDung?: number | null
  soCauSai?: number | null
  soCauDungMotPhan?: number | null
  soCauBoTrong?: number | null
  soYDungII?: number | null
  soYTongII?: number | null
}

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Gói bốn nhóm về dạng `KetQuaDem`. Trả `null` khi ca chưa chấm — chỗ gọi phải
 * GIẤU dòng đếm, cấm in "Đúng 0/0 câu". */
export function docSoDem(x: SoDemCau | null | undefined): KetQuaDem | null {
  const tong = so(x?.tongCau)
  if (tong === null || tong <= 0) return null
  const dung = so(x?.soCauDung) ?? 0
  const motPhan = so(x?.soCauDungMotPhan) ?? 0
  const trong = so(x?.soCauBoTrong) ?? 0
  // Máy chủ bản cũ chưa trả `soCauSai` theo luật mới ⇒ suy ra phần còn lại, chứ
  // không bịa thêm câu nào: bốn nhóm luôn cộng đúng bằng tổng.
  const saiMC = so(x?.soCauSai)
  const sai = saiMC !== null ? Math.max(0, Math.min(saiMC, tong - dung - motPhan - trong)) : Math.max(0, tong - dung - motPhan - trong)
  return {
    tongCau: tong,
    soDung: dung,
    soDungMotPhan: motPhan,
    soSai: sai,
    soBoTrong: Math.max(0, tong - dung - motPhan - sai),
    yPhanII: { tong: so(x?.soYTongII) ?? 0, dung: so(x?.soYDungII) ?? 0 },
  }
}

/** Dòng "Đúng a/N câu · m câu đúng một phần · Sai s câu · Bỏ trống b câu". */
export default function DongDemCau({ so: nguon, kieu = 'thuong' }: { so: SoDemCau | null | undefined; kieu?: 'thuong' | 'dam' }) {
  const k = docSoDem(nguon)
  if (!k) return null
  const dam = kieu === 'dam'
  return (
    <span className={dam ? 'text-sm font-semibold text-slate-800 dark:text-slate-200' : undefined}>
      Đúng <strong className="text-emerald-600 dark:text-emerald-400">{k.soDung}</strong>/{k.tongCau} câu
      {k.soDungMotPhan > 0 && (
        <span className="text-amber-600 dark:text-amber-400 font-medium ml-1.5">· {k.soDungMotPhan} câu đúng một phần</span>
      )}
      {k.soSai > 0 && <span className="text-rose-500 dark:text-rose-400 font-medium ml-1.5">· Sai {k.soSai} câu</span>}
      {k.soBoTrong > 0 && <span className="text-slate-400 font-medium ml-1.5">· Bỏ trống {k.soBoTrong} câu</span>}
    </span>
  )
}

/** Dòng phụ chỉ hiện khi ca CÓ phần II: "Phần II: đúng 6/8 ý". Đây là con số
 * giải thích vì sao em có điểm mà không có câu nào đúng trọn. */
export function DongDemYPhanII({ so: nguon }: { so: SoDemCau | null | undefined }) {
  const k = docSoDem(nguon)
  if (!k || k.yPhanII.tong <= 0) return null
  return (
    <span>
      Phần II: đúng <strong>{k.yPhanII.dung}</strong>/{k.yPhanII.tong} ý
    </span>
  )
}

export { chuTomTat }
