// LỚP PHÒNG THỦ CUỐI CHỐNG CÂU TỰ LUẬN — MÁY HỌC SINH / PHỤ HUYNH (thầy lệnh 21/09: "tuyệt đối không rút câu tự luận,
// chỉ rút trắc nghiệm, đúng sai, trả lời ngắn — TRỪ màn Gọi lên bảng"; đề bài `prompt-cam-rut-tu-luan.md`, phần Code 2).
// Máy chủ (Code 3) và máy thầy (Code 1) đã lọc ở NGUỒN; đây là chốt chặn cuối: nhận phải câu `laCauTuLuan` thì BỎ QUA câu đó
// (không dựng ô nhập đáp án ngắn cho nó, không tính vào chuỗi đúng/sai) và ghi MỘT dòng console.warn.
//
// CHỈ dùng ở chỗ RÚT TỰ ĐỘNG cho em (game, ôn lại, bịt lỗ hổng, thử thách, luyện đề). KHÔNG dùng ở:
//   · phiếu thi thật / đề thầy tự chọn nguyên tờ (ExamTakeScreen) — thầy chọn gì hiện đúng thế;
//   · màn Gọi lên bảng / tờ chiếu (làn thầy) — không nằm trong `src/` của máy học sinh.
// THUẦN trừ `console.warn`; không đọc đồng hồ, không mạng. Định nghĩa "tự luận" nằm MỘT chỗ: `cau-tu-luan.ts`.
import { lyDoTuLuan, type PhanCau } from './cau-tu-luan'

/** Mỗi câu chỉ cảnh báo MỘT lần (theo nguồn + mã câu) để một lượt chơi dài không tràn console. */
const daBao = new Set<string>()

/** Dùng cho test: xoá bộ nhớ "đã cảnh báo". */
export function quenDaBao(): void {
  daBao.clear()
}

const maCua = (c: unknown, viTri: number): string => {
  if (c !== null && typeof c === 'object') {
    const o = c as Record<string, unknown>
    for (const k of ['qid', 'id', 'maDe', 'ma_de']) if (typeof o[k] === 'string' && o[k]) return String(o[k])
  }
  return `#${viTri}`
}

/**
 * Bỏ mọi câu tự luận khỏi danh sách rút cho em. Giữ NGUYÊN thứ tự và đối tượng câu (không sao chép, không sửa).
 * `nguon` = tên chỗ rút ("game-v2/start", "on-lai/cau-theo-qid"…) để dòng cảnh báo chỉ đúng chỗ. Không phải mảng ⇒ [].
 */
export function chanCauTuLuan<T>(ds: readonly T[] | null | undefined, nguon: string, phanMacDinh?: PhanCau): T[] {
  if (!Array.isArray(ds)) return []
  const giu: T[] = []
  ds.forEach((c, i) => {
    const ly = lyDoTuLuan(c, phanMacDinh)
    if (ly === null) {
      giu.push(c)
      return
    }
    const khoa = `${nguon}|${maCua(c, i)}`
    if (daBao.has(khoa)) return
    daBao.add(khoa)
    console.warn(`[cấm tự luận] ${nguon}: bỏ câu ${maCua(c, i)} — ${ly}`)
  })
  return giu
}

/** MỘT câu: có được phép hiện cho em không (tiện cho chỗ nhận từng câu một, vd Đoàn Hộ Tống). Bỏ ⇒ ghi cảnh báo. */
export function choPhepCauChoEm(c: unknown, nguon: string, phanMacDinh?: PhanCau): boolean {
  return chanCauTuLuan([c], nguon, phanMacDinh).length === 1
}

/**
 * Phản hồi máy chủ có mảng `questions` (game): trả BẢN SAO phản hồi với `questions` đã lọc; không có `questions` ⇒ trả nguyên phản hồi.
 * Trường khác giữ nguyên. Không lọc `answered` (lịch sử em đã làm — không phục vụ lại).
 */
export function chanPhanHoiCau<R extends { questions?: unknown }>(r: R, nguon: string): R {
  if (!r || !Array.isArray(r.questions)) return r
  return { ...r, questions: chanCauTuLuan(r.questions as unknown[], nguon) }
}
