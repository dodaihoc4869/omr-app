// PHIẾU BÀI TẬP RIÊNG — chọn câu và xuất PDF để thầy gửi cho từng em.
//
// Khác "Giao bài tập" (đợt 3) ở chỗ: giao bài tập là tạo một CA cho em làm
// trong app; còn cái này là một TỜ GIẤY thầy tải về, in ra hoặc gửi thẳng cho
// em qua Zalo. Cùng nguồn câu hỏi, khác đường ra.
//
// BA LUẬT CHỌN CÂU:
//   1. Chỉ lấy câu thuộc chuyên đề em đang yếu.
//   2. Ưu tiên câu em CHƯA từng làm; hết câu mới mới lấy lại câu cũ, và nói rõ
//      đã lấy lại bao nhiêu câu chứ không lặng lẽ phát lại.
//   3. Bậc tiến bộ: chuyên đề sai càng nhiều thì bắt đầu càng thấp, và trong
//      cùng một phiếu câu xếp từ nhận biết lên vận dụng. Em làm xong, tỉ lệ sai
//      giảm và số câu đã làm tăng, nên phiếu lần sau tự nâng bậc — tiến bộ do
//      SỐ LIỆU THẬT đẩy lên chứ không do đếm số lần bấm nút.
//
// BỎ CÂU CÓ HÌNH: phiếu PDF không kèm ảnh cắt từ đề (ảnh base64 làm file phình
// lên hàng megabyte). Một câu có hình mà in ra không có hình là câu không làm
// được, nên thà bỏ hẳn còn hơn phát cho em một câu cụt.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'

export type MucDoCau = 'biet' | 'hieu' | 'van_dung'
const BAC: MucDoCau[] = ['biet', 'hieu', 'van_dung']

export interface CauLuyen {
  phan: 'I' | 'II' | 'III'
  id: string
  chuyenDe: string
  mucDo: MucDoCau | ''
  text: string
  luaChon: string[] | null
  dapAn: string
  chot: string
  lyDo: { khoa: string; dung: boolean; ly: string }[] | null
  buoc: string[] | null
  ketQua: string
}

export interface KetQuaChonCau {
  cau: CauLuyen[]
  /** Số câu phải lấy lại từ những câu em đã làm vì kho không đủ câu mới. */
  lapLai: number
  /** Số câu còn thiếu so với số câu thầy muốn. */
  thieu: number
}

/** Mức khởi điểm theo tỉ lệ sai — cùng thang với màn Gọi lên bảng để hai chỗ
 * không đưa ra hai kết luận khác nhau về cùng một em. */
export function mucKhoiDiem(tiLeSai: number): MucDoCau {
  if (tiLeSai >= 0.6) return 'biet'
  if (tiLeSai >= 0.3) return 'hieu'
  return 'van_dung'
}

/** Bậc mục tiêu cho N câu: một nửa ở mức khởi điểm, phần còn lại nâng dần lên.
 * Trong một phiếu em đi từ dễ tới khó, làm xong là thấy mình lên được một bậc. */
export function thangBac(khoiDiem: MucDoCau, soCau: number): MucDoCau[] {
  const i0 = BAC.indexOf(khoiDiem)
  const ra: MucDoCau[] = []
  const nen = Math.ceil(soCau * 0.5)
  const giua = Math.ceil((soCau - nen) * 0.6)
  for (let i = 0; i < soCau; i++) {
    const b = i < nen ? i0 : i < nen + giua ? i0 + 1 : i0 + 2
    ra.push(BAC[Math.min(BAC.length - 1, b)])
  }
  return ra
}

type CauNguon = { phan: 'I' | 'II' | 'III'; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

function coHinh(q: { thanCauImg?: string; choiceImgs?: (string | undefined)[]; ideaImgs?: (string | undefined)[] }): boolean {
  return Boolean(q.thanCauImg || q.choiceImgs?.some(Boolean) || q.ideaImgs?.some(Boolean))
}

function goiCau(nguon: TeacherExamSource[]): CauNguon[] {
  const ra: CauNguon[] = []
  for (const s of nguon) {
    for (const q of s.phanI) ra.push({ phan: 'I', q })
    for (const q of s.phanII) ra.push({ phan: 'II', q })
    for (const q of s.phanIII) ra.push({ phan: 'III', q })
  }
  return ra
}

function doiSang(c: CauNguon): CauLuyen {
  const q = c.q
  const mcq = q as TeacherMcqQuestion
  const tf = q as TeacherTrueFalseQuestion
  const sa = q as TeacherShortAnswerQuestion
  const lg = q.loiGiai
  let lyDo: CauLuyen['lyDo'] = null
  if (c.phan === 'I' && lg?.tungPa) {
    lyDo = (['A', 'B', 'C', 'D'] as const).filter((k) => lg.tungPa?.[k]).map((k) => ({ khoa: k, dung: Boolean(lg.tungPa?.[k]?.dung), ly: String(lg.tungPa?.[k]?.viSao ?? '') }))
  } else if (c.phan === 'II' && lg?.tungY) {
    lyDo = (['a', 'b', 'c', 'd'] as const).filter((k) => lg.tungY?.[k]).map((k) => ({ khoa: k, dung: Boolean(lg.tungY?.[k]?.dung), ly: String(lg.tungY?.[k]?.viSao ?? '') }))
  }
  return {
    phan: c.phan,
    id: q.id,
    chuyenDe: String(q.chuyenDe || ''),
    mucDo: (q.mucDo as MucDoCau) || '',
    text: q.text || '',
    luaChon: c.phan === 'I' ? [...(mcq.choices ?? [])] : c.phan === 'II' ? [...(tf.ideas ?? [])] : null,
    dapAn: c.phan === 'I' ? String(mcq.correct ?? '') : c.phan === 'II' ? (tf.correct ?? []).join('') : String(sa.correct ?? ''),
    chot: lg?.chot ?? '',
    lyDo,
    buoc: lg?.buoc ? [...lg.buoc] : null,
    ketQua: lg?.ketQua ?? '',
  }
}

export interface YeuCauLuyen {
  /** Chuyên đề em đang yếu, kèm tỉ lệ sai để chọn bậc khởi điểm. */
  chuyenDe: { ten: string; tiLeSai: number }[]
  /** Câu em đã từng làm — tránh trước, chỉ dùng lại khi hết câu mới. */
  qidDaLam?: string[]
  soCau: number
  ngauNhien?: () => number
}

/** Chọn câu cho một phiếu luyện. Thuần logic, không đụng DOM, test được. */
export function chonCauLuyen(nguon: TeacherExamSource[], yc: YeuCauLuyen): KetQuaChonCau {
  const rnd = yc.ngauNhien ?? Math.random
  const daLam = new Set(yc.qidDaLam ?? [])
  const tenYeu = yc.chuyenDe.map((c) => c.ten.trim()).filter(Boolean)
  const khoiDiem = yc.chuyenDe.length ? mucKhoiDiem(Math.max(...yc.chuyenDe.map((c) => c.tiLeSai))) : 'hieu'

  // Kho câu dùng được: đúng chuyên đề yếu, KHÔNG có hình.
  const kho = goiCau(nguon)
    .filter((c) => !coHinh(c.q as { thanCauImg?: string }))
    .filter((c) => (tenYeu.length === 0 ? true : tenYeu.includes(String(c.q.chuyenDe || '').trim())))
    .map(doiSang)

  const xao = <T,>(xs: T[]): T[] => {
    const a = [...xs]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const conLai = xao(kho)
  const daChon: CauLuyen[] = []
  const daDung = new Set<string>()
  let lapLai = 0

  const lay = (muc: MucDoCau | null, choLapLai: boolean): CauLuyen | null => {
    const hop = conLai.filter((c) => !daDung.has(c.id) && (muc === null || c.mucDo === muc) && (choLapLai || !daLam.has(c.id)))
    if (hop.length === 0) return null
    const c = hop[0]
    daDung.add(c.id)
    if (daLam.has(c.id)) lapLai++
    return c
  }

  for (const muc of thangBac(khoiDiem, yc.soCau)) {
    // Đúng bậc và chưa làm → đúng bậc nhưng đã làm → bậc bất kỳ chưa làm →
    // cuối cùng mới chấp nhận câu đã làm. Mỗi bước lùi đều nói ra ở kết quả.
    const c = lay(muc, false) ?? lay(null, false) ?? lay(muc, true) ?? lay(null, true)
    if (c) daChon.push(c)
  }

  daChon.sort((a, b) => BAC.indexOf(a.mucDo as MucDoCau) - BAC.indexOf(b.mucDo as MucDoCau) || a.phan.localeCompare(b.phan))
  return { cau: daChon, lapLai, thieu: Math.max(0, yc.soCau - daChon.length) }
}

/** Bỏ đánh dấu công thức để in ra giấy: `$\ce{H2SO4}$` → `H2SO4`.
 *
 * PDF không dựng được mhchem như trên màn hình. Đổi sang chữ thuần chứ KHÔNG
 * bỏ nội dung: mất công thức là mất luôn đề bài. */
export function chuThuan(raw: string): string {
  let s = String(raw ?? '')
  s = s.replace(/\$\s*\\ce\s*\{([\s\S]*?)\}\s*\$/g, '$1')
  s = s.replace(/\\ce\s*\{([\s\S]*?)\}/g, '$1')
  s = s.replace(/\\text\s*\{([\s\S]*?)\}/g, '$1')
  s = s.replace(/\\mathrm\s*\{([\s\S]*?)\}/g, '$1')
  s = s.replace(/\\left|\\right/g, '')
  s = s.replace(/\\to\b|\\rightarrow\b/g, '→')
  s = s.replace(/\\leftrightarrow\b|\\rightleftharpoons\b/g, '⇌')
  s = s.replace(/\\times\b/g, '×')
  s = s.replace(/\\cdot\b/g, '·')
  s = s.replace(/\\%/g, '%')
  s = s.replace(/\$/g, '')
  s = s.replace(/[{}]/g, '')
  s = s.replace(/[ \t]+/g, ' ')
  return s.trim()
}

export function tenTepBaiTap(hoTen: string, sbd: string, khi = new Date()): string {
  const ten = (hoTen || `SBD-${sbd}`)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const d = `${khi.getFullYear()}${String(khi.getMonth() + 1).padStart(2, '0')}${String(khi.getDate()).padStart(2, '0')}`
  return `baitap-${ten}-${d}.pdf`
}
