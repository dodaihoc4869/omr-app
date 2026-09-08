// CHO THI LẠI — rút ĐỀ MỚI cho đúng một em (thầy chốt 08/09).
//
// > "trong ca thi nút cho thi lại sẽ xoá lịch sử của bài thi trước, khi bấm cho
// >  thi lại học sinh đăng nhập đúng máy đã thi trước và rút lại đề mới"
//
// BA VIỆC, ba chỗ làm:
//   · xoá lịch sử + khoá máy  → máy chủ, lệnh `choThiLai`;
//   · rút đề mới              → ĐÂY (máy thầy có kho, máy chủ không có);
//   · phát đề mới             → bản đồ `boTheoEm` của ca, ghi trong cùng lệnh.
//
// VÌ SAO KHÔNG ĐỔI LUẬT HASH để ra đề mới: `assignStudentQuestions(bank, maCa,
// sbd)` không nhận lần thi, và đổi chữ ký của nó là mọi ca cũ chấm lại ra bộ
// câu khác — tức là điểm đã gửi phụ huynh không dựng lại được. Ghi thẳng bộ câu
// mới vào bản đồ đi qua đúng nhánh sẵn có, không đụng gì tới ca cũ.
//
// RÚT TRONG ĐÚNG KHO CỦA CA, không nối thêm câu: ca đang chạy mà kho đổi là các
// bạn còn lại nhìn một kho khác em này.
import { assignStudentQuestions } from './exam-assign'
import { docDeRiengCa, docSoCauCa, loadSessionTeacherBank } from './exam-db'
import { mergeAndStrip } from '../data/examContent'
import type { PublicExamBank } from '../data/examContent'
import { dungUngVien, rutDe, PHAN_DE } from './rut-de'
import { hashSeed } from './exam-shuffle'
import { chiTietCa, choThiLai } from './exam-api'

export interface KetQuaThiLai {
  soLuotXoa: number
  soCauXoa: number
  khoaMay: boolean
  daDoiDe: boolean
  /** Số câu KHÁC hẳn bộ cũ. Bằng 0 nghĩa là kho quá hẹp, đề mới trùng đề cũ. */
  soCauKhac: number
  soCauMoi: number
}

/** Bộ câu em ĐÃ nhận ở lượt cũ — để đề mới tránh đúng những câu đó.
 *
 * Hai nguồn, đúng thứ tự máy phát đề dùng: bản đồ đề riêng nếu ca có, còn không
 * thì dựng lại bằng chính hàm phát đề. Đoán sai chỗ này là "đề mới" hoá ra
 * trùng y đề cũ mà không ai biết. */
export function boCauCu(bank: PublicExamBank, maCa: string, sbd: string, boTheoEm?: Record<string, string[]>): string[] {
  const rieng = boTheoEm?.[sbd]
  if (rieng && rieng.length > 0) return [...rieng]
  try {
    const asg = assignStudentQuestions(bank, maCa, sbd)
    return [...asg.phanI.map((x) => x.qid), ...asg.phanII.map((x) => x.qid), ...asg.phanIII.map((x) => x.qid)]
  } catch {
    return []
  }
}

/** CHO MỘT EM THI LẠI: rút đề mới rồi gọi máy chủ xoá lịch sử + khoá máy. */
export async function choEmThiLai(url: string, mat: string, maCa: string, sbd: string): Promise<KetQuaThiLai> {
  const ma = maCa.trim()
  const em = sbd.trim()
  if (!em) throw new Error('Thiếu số báo danh')

  const bank = await loadSessionTeacherBank(ma)
  if (!bank || bank.length === 0) throw new Error('Máy này chưa có bản đề CÓ đáp án của ca — mở lại màn Ca thi rồi thử lại')
  const sc = await docSoCauCa(ma)
  if (!sc) throw new Error('Ca này chưa ghi số câu mỗi phần')

  // Bản đồ hiện tại: bản máy này giữ trước, rồi tới bản máy chủ trả về. Thiếu
  // nó thì `boCauCu` dựng lại bằng luật hash — đúng cách ca thường phát đề.
  const rieng = await docDeRiengCa(ma).catch(() => undefined)
  let boTheoEm = rieng?.boTheoEm
  if (!boTheoEm) {
    const ct = await chiTietCa(url, mat, ma, true).catch(() => null)
    const bo = (ct?.keyBank as { boTheoEm?: Record<string, string[]> } | null | undefined)?.boTheoEm
    if (bo && Object.keys(bo).length > 0) boTheoEm = bo
  }

  const cong = mergeAndStrip(bank, sc)
  const cu = boCauCu(cong, ma, em, boTheoEm)

  // ĐỀ MỚI: cùng số câu mỗi phần, TRÁNH câu cũ. Seed gắn giờ để bấm hai lần ra
  // hai đề khác nhau — thầy cho thi lại lần nữa thì phải là đề khác nữa.
  const uv = dungUngVien(bank)
  const kq = rutDe(uv, { soCau: sc, chuyenDe: [], mucDo: [], tranhQid: cu, seed: hashSeed(`${ma}:${em}:thi-lai:${Date.now()}`) })
  const boMoi = PHAN_DE.flatMap((p) => kq.chon[p].map((c) => c.id))
  if (boMoi.length === 0) throw new Error('Kho của ca không rút được câu nào — không đổi đề được')

  const boCu = new Set(cu)
  const soCauKhac = boMoi.filter((q) => !boCu.has(q)).length

  const ra = await choThiLai(url, mat, ma, em, boMoi)
  return { ...ra, soCauKhac, soCauMoi: boMoi.length }
}
