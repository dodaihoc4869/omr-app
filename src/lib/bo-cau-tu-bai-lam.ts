// BỘ CÂU THẬT SỰ CỦA MỘT EM — dựng lại TỪ BÀI LÀM, không rút lại bằng hạt giống.
//
// VÌ SAO CÓ TỆP NÀY (thầy bắt được 10/09, hai lần trong một ngày).
//
// `assignStudentQuestions` rút bộ câu của em bằng `hash(mãCa + SBD)` trên kho
// HIỆN TẠI. Chú thích của nó hứa "tái tạo lại được y hệt khi cần phúc khảo /
// chấm lại" — lời hứa ấy CHỈ đúng khi kho không đổi và khi bên gọi có `boTheoEm`.
// Ca đề riêng rút 8 câu từ kho 26 câu: không có `boTheoEm` thì hạt giống rút ra
// MỘT BỘ KHÁC HẲN bộ em đã làm, và sai IM LẶNG vì điểm vẫn ra một con số trông
// như thật.
//
//   · Sáng 10/09: `chamLaiCa` ở máy thầy ghi đè điểm của cả 28 em ca 890691 —
//     5,85 thành 1,60. Vá ở `gomCa` (commit 480e6ef).
//   · Tối 10/09: ca 234641, máy EM cũng dính đúng lỗi đó. Máy em chấm xong hiện
//     popup điểm rồi ghi lên Sheet:
//
//         Trần Minh Đăng  đúng 5,69  ·  máy em ghi 2,56
//         Lưu Ngọc Tuân   đúng 7,56  ·  máy em ghi 1,88
//         Đỗ Anh Toàn     đúng 8,88  ·  máy em ghi 3,13
//
//     Và màn XEM LẠI sau khi nộp bày ra bộ câu rút lại đó, nên "các câu trong
//     đề hiển thị sai hết" — em đọc lời giải của những câu em chưa từng thấy.
//
// Vá ở `gomCa` là vá đúng một nửa: nửa còn lại nằm ở máy em. Nay một nơi dựng,
// hai bên cùng dùng.
//
// HAI NGUỒN DẤU VẾT, phải gộp cả hai:
//   · `dapAn` — qid của câu em ĐÃ trả lời.
//   · `giayCau` — qid của câu em ĐÃ XEM, kể cả câu xem rồi bỏ trống.
//
// VÀ PHẢI BÙ CHO ĐỦ MẪU SỐ. Em bỏ trống hẳn một câu mà cũng không kịp xem thì
// câu ấy không để lại dấu nào; danh sách dựng lại chỉ còn 7 câu thay vì 8.
// `scoreStudent` lấy ĐỘ DÀI danh sách làm mẫu số, nên thiếu một câu là điểm bị
// thổi lên. Câu bù KHÔNG đổi số câu đúng — em không trả lời nó nên luôn tính
// sai — nó chỉ có mặt để mẫu số đúng bằng `soCau`. Bù tất định theo hạt giống
// để hai lần chạy ra cùng một danh sách.
import { pick } from './exam-assign'

/** Bài làm đã ghi, rút gọn còn đúng phần cần để dựng lại bộ câu. */
export interface DauVetBaiLam {
  phanI?: Record<string, unknown> | null
  phanII?: Record<string, unknown> | null
  phanIII?: Record<string, unknown> | null
}

/** Kho câu của ca, tách theo ba phần. Chỉ cần `id`. */
export interface KhoBaPhan {
  phanI: { id: string }[]
  phanII: { id: string }[]
  phanIII: { id: string }[]
}

/** Số câu mỗi phần của ca — MẪU SỐ. Thiếu thì lấy cả kho. */
export interface SoCauMoiPhan {
  I: number
  II: number
  III: number
}

/** MỌI QID EM ĐỂ LẠI DẤU: đã trả lời, hoặc đã xem mà bỏ trống. */
export function qidDaGap(dapAn: DauVetBaiLam | null | undefined, giayCau?: Record<string, unknown> | null): Set<string> {
  const ra = new Set<string>()
  for (const k of Object.keys(dapAn?.phanI ?? {})) ra.add(k)
  for (const k of Object.keys(dapAn?.phanII ?? {})) ra.add(k)
  for (const k of Object.keys(dapAn?.phanIII ?? {})) ra.add(k)
  for (const k of Object.keys(giayCau ?? {})) ra.add(k)
  return ra
}

/** Lấy đúng câu của em trong một phần, bù thêm cho đủ `can` câu.
 *
 * Giữ THỨ TỰ CỦA KHO chứ không theo thứ tự em trả lời: đề của em vốn xếp theo
 * kho, và hai lần dựng phải ra cùng một thứ tự thì mới đối chiếu được. */
export function buChoDuPhan(cua: Set<string>, kho: { id: string }[], can: number, hatGiong: string): string[] {
  const cuaEm = kho.filter((q) => cua.has(q.id)).map((q) => q.id)
  if (cuaEm.length >= can) return cuaEm
  const daCo = new Set(cuaEm)
  return [...cuaEm, ...pick(kho.filter((q) => !daCo.has(q.id)), can - cuaEm.length, hatGiong).map((q) => q.id)]
}

/** BỘ CÂU CỦA MỘT EM, dựng từ bài làm và bù cho đủ mẫu số.
 *
 * `hatGiong` phải gắn với (mã ca, SBD) để mỗi em bù một kiểu và lần nào cũng
 * ra đúng danh sách ấy. */
export function boCauTuBaiLam(
  kho: KhoBaPhan,
  maCa: string,
  sbd: string,
  dapAn: DauVetBaiLam | null | undefined,
  giayCau?: Record<string, unknown> | null,
  soCau?: SoCauMoiPhan | null,
): string[] {
  const cua = qidDaGap(dapAn, giayCau)
  return [
    ...buChoDuPhan(cua, kho.phanI, soCau?.I ?? kho.phanI.length, `${maCa}:${sbd}:phanI:bu`),
    ...buChoDuPhan(cua, kho.phanII, soCau?.II ?? kho.phanII.length, `${maCa}:${sbd}:phanII:bu`),
    ...buChoDuPhan(cua, kho.phanIII, soCau?.III ?? kho.phanIII.length, `${maCa}:${sbd}:phanIII:bu`),
  ]
}
