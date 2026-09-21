// TÍN HIỆU CHỈ-ĐỌC CHO THẦY: "sai rất nhanh hôm trước, đúng hôm sau" (Boss 21/09 chiều; hàm THUẦN, Code 1).
// Vì sao: thưởng lên bậc (6) và khắc phục (30) không có trần ngày, câu sai quay lại từ NGÀY HÔM SAU ⇒ em có thể cố ý bấm bừa (dưới vài giây) để hôm sau "đúng lại" nhặt thưởng. Hấp thụ 200/ngày đã chặn lợi ích lên cấp
// (chỉ phình ống nghiệm), nên KHÔNG phạt tự động; chỉ báo để thầy biết. Đây là con số ĐO (tất định), không phải nhãn năng lực; KHÔNG hiện cho em và phụ huynh.
//
// Định nghĩa: trong cửa sổ `cuaSoNgay` ngày VN gần nhất (mặc định 7, gồm hôm nay), đếm số câu KHÁC NHAU (qid) có một lần làm SAI với thời gian trả lời < `nguongGiay` (mặc định 5) vào ngày D
// VÀ một lần làm ĐÚNG vào ngày D + 1 (ngày VN liền sau). Từ `nguongSoCau` (mặc định 8) câu trở lên ⇒ `co = true`.
export const TIN_HIEU_SAI_NHANH = { cuaSoNgay: 7, nguongGiay: 5, nguongSoCau: 8 } as const

export interface SuKienSaiNhanh { qid: string; ngayVn: string; ketQua: 0 | 1 | null; giay: number | null }
export interface KetQuaSaiNhanh {
  /** Số câu KHÁC NHAU thoả định nghĩa. */
  soCau: number
  /** Ngưỡng báo, ngưỡng giây và cửa sổ đã dùng (để câu chữ nói đúng số, kể cả khi gọi với ngưỡng riêng). */
  nguongSoCau: number
  nguongGiay: number
  cuaSoNgay: number
  tuNgay: string
  /** `soCau ≥ nguongSoCau`. */
  co: boolean
}

const MS_NGAY = 86_400_000
const ngaySau = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MS_NGAY).toISOString().slice(0, 10)

export function demSaiNhanhDungLai(ds: readonly SuKienSaiNhanh[], homNay: string, tuyChon: { cuaSoNgay?: number; nguongGiay?: number; nguongSoCau?: number } = {}): KetQuaSaiNhanh {
  const cuaSoNgay = Math.max(2, Math.floor(tuyChon.cuaSoNgay ?? TIN_HIEU_SAI_NHANH.cuaSoNgay))
  const nguongGiay = tuyChon.nguongGiay ?? TIN_HIEU_SAI_NHANH.nguongGiay
  const nguongSoCau = Math.max(1, Math.floor(tuyChon.nguongSoCau ?? TIN_HIEU_SAI_NHANH.nguongSoCau))
  const tuNgay = ngaySau(homNay, -(cuaSoNgay - 1))
  const saiNhanh = new Map<string, Set<string>>() // qid → các ngày có lần sai nhanh
  const dung = new Map<string, Set<string>>() // qid → các ngày có lần đúng
  for (const e of ds) {
    if (e.ngayVn < tuNgay || e.ngayVn > homNay) continue
    if (e.ketQua === 1) (dung.get(e.qid) ?? dung.set(e.qid, new Set()).get(e.qid)!).add(e.ngayVn)
    else if (e.ketQua === 0 && typeof e.giay === 'number' && Number.isFinite(e.giay) && e.giay >= 0 && e.giay < nguongGiay) (saiNhanh.get(e.qid) ?? saiNhanh.set(e.qid, new Set()).get(e.qid)!).add(e.ngayVn)
  }
  let soCau = 0
  for (const [qid, ngays] of saiNhanh) {
    const d = dung.get(qid)
    if (d && [...ngays].some((n) => d.has(ngaySau(n, 1)))) soCau++
  }
  return { soCau, nguongSoCau, nguongGiay, cuaSoNgay, tuNgay, co: soCau >= nguongSoCau }
}

/** Dòng cho thầy (Bảng tin / Hồ sơ em): chữ thường, có số thật và nhãn, không nhãn năng lực. Không có tín hiệu ⇒ chuỗi rỗng. */
export function chuTinHieuSaiNhanh(k: KetQuaSaiNhanh): string {
  return k.co ? `Em có ${k.soCau} câu sai rất nhanh (dưới ${k.nguongGiay} giây) rồi làm đúng vào hôm sau trong ${k.cuaSoNgay} ngày gần nhất. Thầy có thể xem cách em làm bài.` : ''
}
