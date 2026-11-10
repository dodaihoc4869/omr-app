// LỊCH BÀI (khối B, bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-1 «Lịch Bài 8 · Amine»; thầy 10/11 «Làm nốt mấy việc còn lại đi đẩy hết lên bản sống»).
// Mỗi ngày của bài đang học, từ ngày giao tới hạn chung: Học mới · Sửa lỗi · Kiểm tra ôn tập · Dự phòng. Ngày đã qua và hôm nay = loại ĐÃ CHỐT (bảng
// goi_bai_7_loai_ngay); ngày tới = DỰ KIẾN bằng CHÍNH luật đang chạy — `chonLoaiNgay7` (goi-bai-7-loi.ts) cho Mới / Sửa, `ngayKtTheoBai`
// (kiem-tra-chu-ky-bai.ts) cho ngày Kiểm tra ôn tập — giả định em làm đủ mức mỗi ngày và không thêm câu sai mới (app ghi «Ngày sau là dự kiến: A.I Đỗ Đại
// Học xếp lại mỗi sáng theo kết quả của em»). Không đánh dấu «xong» ngày cũ: chưa có sổ hoàn thành theo ngày. Thuần CPU, 0 lệnh D1.
import { chonLoaiNgay7, congNgay7, MUC_NGAY_CO_DINH, type LoaiNgay7 } from './goi-bai-7-loi'
import { ngayKtTheoBai } from './kiem-tra-chu-ky-bai'
import type { GoiCuaEm7 } from './goi-bai-7'
import type { MucLoai7 } from './goi-bai-7-loai-ngay'

export type LoaiLich7 = LoaiNgay7 | 'kiem' | 'du'
export interface NgayLich7 { ngay: string; loai: LoaiLich7 }
export interface LichBai7 { goiId: string; ten: string; han: string; ngay: NgayLich7[] }

/** Tối đa số ngày vẽ (gói 7 ngày, hạn chung có thể dời thêm) — thẻ một hàng cuộn ngang. */
export const TRAN_NGAY_LICH = 21

export function duKienLichBai7(a: {
  homNay: string
  goi: { id: string; ten: string; batDau: string; han: string; conMoi: number }
  /** Loại đã chốt theo ngày (gồm hôm nay nếu đã chốt). */
  daChot: ReadonlyMap<string, LoaiNgay7>
  /** Loại hôm nay (đã chốt hoặc vừa chọn) — null ⇒ ngày không gắn loại. */
  loaiHomNay: LoaiNgay7 | null
  /** Loại các ngày có loại TRƯỚC hôm nay, mới trước (như `chonLoaiNgay7`). */
  truoc: readonly string[]
  /** Câu mới còn (mọi bài đang luyện) và câu sai đang chờ sửa — số của lúc lập kế hoạch hôm nay. */
  soMoiCon: number
  soSua: number
  /** Câu mới của hôm nay theo kế hoạch (đã trừ khỏi phần còn của ngày mai). */
  moiHomNay: number
  /** Ngày các lịch Kiểm tra ôn tập ĐÃ LẬP của gói này (đã làm / sắp làm). */
  ktDaCo?: readonly string[]
}): LichBai7 | null {
  const { homNay, goi } = a
  if (!goi.id || !goi.batDau || !goi.han || goi.han < homNay) return null
  const ngay: NgayLich7[] = []
  let d = goi.batDau < homNay ? goi.batDau : homNay
  const kt = new Set(a.ktDaCo ?? [])
  for (let i = 0; d < homNay && i < TRAN_NGAY_LICH; i++, d = congNgay7(d, 1)) ngay.push({ ngay: d, loai: kt.has(d) ? 'kiem' : a.daChot.get(d) ?? 'du' })
  ngay.push({ ngay: homNay, loai: kt.has(homNay) ? 'kiem' : a.loaiHomNay ?? 'du' })
  // ngày tới: mô phỏng đúng luật — em làm đủ mức 28 / ngày; số câu chờ sửa giữ nguyên (câu sửa đúng còn chờ kiểm lại vẫn tính như luật chọn ngày)
  let moi = Math.max(0, a.soMoiCon - a.moiHomNay), moiGoi = Math.max(0, goi.conMoi - a.moiHomNay), daKt = kt.size
  const sua = a.soSua, truoc = a.loaiHomNay ? [a.loaiHomNay, ...a.truoc] : [...a.truoc]
  for (d = congNgay7(homNay, 1); d <= goi.han && ngay.length < TRAN_NGAY_LICH; d = congNgay7(d, 1)) {
    if (kt.has(d)) { ngay.push({ ngay: d, loai: 'kiem' }); continue }
    const q = ngayKtTheoBai(congNgay7(d, -1), [{ id: goi.id, han: goi.han, conMoi: moiGoi, daKt }])
    if (q && 'ngay' in q && q.ngay === d) { ngay.push({ ngay: d, loai: 'kiem' }); daKt++; continue }
    const loai = chonLoaiNgay7({ ngay: d, truoc, soSua: sua, soMoiCon: moi })
    ngay.push({ ngay: d, loai: loai ?? 'du' })
    if (!loai) continue
    truoc.unshift(loai)
    if (loai === 'moi') { const n = Math.min(MUC_NGAY_CO_DINH, moi); moi -= n; moiGoi = Math.max(0, moiGoi - n) }
  }
  return { goiId: goi.id, ten: goi.ten, han: goi.han, ngay }
}

/** Lịch của bài ĐANG HỌC (gói còn hạn, giao gần nhất) cho tóm tắt Gói 7 — số liệu đúng của lượt lập kế hoạch hôm nay. Câu đọc thiếu cột lịch ⇒ null. */
export function lichBaiEm7(ngay: string, goi: readonly GoiCuaEm7[], ml: MucLoai7, loaiNgay: LoaiNgay7 | null, conMoi7: (g: GoiCuaEm7) => number,
  soSua: number, soMoiCon: number, viec: readonly { vai: string }[]): LichBai7 | null {
  const g = ml.lich && [...goi].filter((x) => x.han >= ngay).sort((a, b) => b.batDau.localeCompare(a.batDau) || a.han.localeCompare(b.han))[0]
  if (!g || !ml.lich) return null
  return duKienLichBai7({ homNay: ngay, goi: { id: g.id, ten: g.ten, batDau: g.batDau, han: g.han, conMoi: conMoi7(g) }, daChot: ml.lich.daChot, loaiHomNay: loaiNgay,
    truoc: ml.truoc, soMoiCon, soSua, moiHomNay: viec.filter((v) => v.vai === 'moi' || v.vai === 'tiep_can').length, ktDaCo: ml.lich.kt.flatMap(([d, id]) => (id === g.id ? [d] : [])) })
}
