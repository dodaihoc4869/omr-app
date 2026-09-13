// KHỬ TRÙNG CÂU GIỮA HAI NHÁNH KHO — ưu tiên bản nằm trong "Bộ đề".
//
// Vì sao có file này: từ 09/09 kho được xếp lại theo bài (khối → chương → bài),
// nhưng các ĐỀ CHUẨN CẤU TRÚC (18 · 4 · 6) còn được giữ thêm một bản NGUYÊN VẸN
// ở nhánh "Bộ đề". Cùng một câu vì thế nằm ở hai chỗ với hai mã đề khác nhau,
// nên `id` câu (`<mã đề>-I-<số>`) KHÔNG bắt được trùng. Thầy tích cả hai nhánh
// cho một ca là bộ câu có câu lặp: học sinh gặp lại đúng câu vừa làm, và tỉ lệ
// random giữa các em tụt xuống mà không ai biết vì sao.
//
// Luật thầy chốt 09/09: TRÙNG THÌ LẤY BẢN Ở "BỘ ĐỀ". Bản trong Bộ đề mang đủ
// ngữ cảnh của đề gốc (đứng đúng vị trí trong đề thi thật), nên giữ nó có ích
// hơn giữ bản đã cắt rời theo bài.
//
// Mọi luật nằm ở ĐÂY, thuần, có test. Màn hình chỉ gọi `khuTrungNguon` một lần
// ngay chỗ chốt danh sách đề đã chọn, rồi phần dưới chạy nguyên như cũ.
import type { TeacherExamSource } from '../data/examContent'

/** Tên chương của một nguồn — phần sau dấu chấm giữa của `nhom`, vd
 * "12 · Bộ đề chuẩn cấu trúc" → "bộ đề chuẩn cấu trúc". Chữ thường để so.
 *
 * KHÔNG đọc từ `maDe`: mã đề trong Bộ đề là mã gốc thầy đặt (vd "100"), không
 * theo khuôn nào, nên bám vào đó là đoán mò. */
function chuongCua(s: Pick<TeacherExamSource, 'nhom'>): string {
  const n = (s.nhom || '').trim()
  if (!n) return ''
  const i = n.indexOf('·')
  return (i >= 0 ? n.slice(i + 1) : n).trim().toLowerCase()
}

export function laNhanhBoDe(s: Pick<TeacherExamSource, 'nhom'>): boolean {
  return chuongCua(s).startsWith('bộ đề')
}

/** Nhánh "Kho cũ trước 09-09": bản lưu của các đề trước khi kho xếp lại theo
 * bài. Cùng câu với cây theo bài, chỉ khác cách chia đề. */
export function laNhanhKhoCu(s: Pick<TeacherExamSource, 'nhom'>): boolean {
  return chuongCua(s).startsWith('kho cũ')
}

/** THỨ TỰ ƯU TIÊN khi một câu nằm ở nhiều nhánh — số nhỏ thắng.
 *
 * 0 Bộ đề    — giữ được ngữ cảnh đề thi thật, thầy chốt 09/09 lấy bản này.
 * 1 cây bài  — bản đang dùng để ra đề hằng ngày.
 * 2 Kho cũ   — chỉ để tra lại, không bao giờ thắng bản đang dùng. */
export function hangUuTien(s: Pick<TeacherExamSource, 'nhom'>): number {
  if (laNhanhBoDe(s)) return 0
  if (laNhanhKhoCu(s)) return 2
  return 1
}

/** Gộp khoảng trắng và bỏ khoảng trắng hai đầu. Hai bản của cùng một câu đi ra
 * từ CÙNG một JSON gốc nên chữ giống hệt nhau; chuẩn hoá ở đây chỉ để một lần
 * xuống dòng thừa lúc soạn tay không làm sổng câu trùng. Cố ý KHÔNG bỏ dấu và
 * KHÔNG hạ chữ thường: "Cl" và "cl" là hai thứ khác nhau trong Hoá. */
const rut = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim()

/** KHOÁ NHẬN DẠNG một câu, dựng từ NỘI DUNG chứ không từ `id`.
 *
 * Thân câu thôi thì chưa đủ: nhiều câu dùng chung một đoạn dẫn ("Cho các chất
 * sau: …") rồi hỏi khác nhau ở phương án. Nên khoá gồm cả phương án / các ý. */
export function khoaCau(q: {
  text: string
  choices?: string[]
  ideas?: string[]
}): string {
  const phu = q.choices ? q.choices.map(rut).join('|') : q.ideas ? q.ideas.map(rut).join('|') : ''
  return `${rut(q.text)}⟂${phu}`
}

export interface KetQuaKhuTrung {
  /** Danh sách nguồn đã bỏ câu trùng. Nguồn nào sạch hết câu thì biến mất. */
  nguon: TeacherExamSource[]
  /** Số câu bị bỏ, tách theo phần — để màn hình nói cho thầy biết. */
  boQua: { I: number; II: number; III: number }
}

/** Bỏ câu trùng trong một danh sách đề đã chọn, ưu tiên giữ bản ở "Bộ đề".
 *
 * Không có nguồn Bộ đề nào trong danh sách ⇒ không có gì để ưu tiên, hàm chỉ
 * bỏ câu lặp y hệt (nếu có) và giữ nguyên thứ tự. Đây là đường chạy của mọi ca
 * cũ, nên phải không đổi hành vi. */
export function khuTrungNguon(ds: TeacherExamSource[]): KetQuaKhuTrung {
  // Vòng 1: với mỗi khoá câu, ghi lại HẠNG TỐT NHẤT mà nó xuất hiện. Vòng 2
  // chỉ giữ bản nào đúng hạng đó — thứ tự thầy tích không được đổi kết quả.
  const hangTot = new Map<string, number>()
  for (const s of ds) {
    const h = hangUuTien(s)
    for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) {
      const k = khoaCau(q)
      const cu2 = hangTot.get(k)
      if (cu2 === undefined || h < cu2) hangTot.set(k, h)
    }
  }

  const daCo = new Set<string>()
  const boQua = { I: 0, II: 0, III: 0 }
  const nguon: TeacherExamSource[] = []

  for (const s of ds) {
    const hang = hangUuTien(s)
    const giu = <T extends { text: string; choices?: string[]; ideas?: string[] }>(ds2: T[], phan: 'I' | 'II' | 'III'): T[] =>
      ds2.filter((q) => {
        const k = khoaCau(q)
        // Thua hạng thì bỏ; cùng hạng thì bản tới trước giữ.
        if (daCo.has(k) || hang > (hangTot.get(k) ?? hang)) {
          boQua[phan] += 1
          return false
        }
        daCo.add(k)
        return true
      })

    const con: TeacherExamSource = {
      ...s,
      phanI: giu(s.phanI, 'I'),
      phanII: giu(s.phanII, 'II'),
      phanIII: giu(s.phanIII, 'III'),
    }
    if (con.phanI.length + con.phanII.length + con.phanIII.length > 0) nguon.push(con)
  }

  return { nguon, boQua }
}

export const tongBoQua = (b: KetQuaKhuTrung['boQua']) => b.I + b.II + b.III
