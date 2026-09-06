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
import { dangCua, hopDang, LOC_DANG_MAC_DINH, type DangCau, type LocDang } from './dang-cau'
import { chuanChuyenDe } from './goi-len-bang'

export type MucDoCau = 'biet' | 'hieu' | 'van_dung'
const BAC: MucDoCau[] = ['biet', 'hieu', 'van_dung']

/** Ảnh đi kèm câu, đã gom mọi nguồn về MỘT dạng để bên in không phải biết dữ
 * liệu cũ hay mới. `viTri` theo đúng thang của kho đề (`ViTriHinh`). */
export interface HinhCau {
  src: string
  viTri: string
  alt?: string
}

export interface CauLuyen {
  phan: 'I' | 'II' | 'III'
  id: string
  /** Mã đề nguồn — chính là BÀI câu này được rút ra. Chuyên đề gộp cả chương
   * nên không đủ chặt; xem `maDeCa` trong `YeuCauLuyen`. */
  maDe: string
  chuyenDe: string
  /** Lý thuyết hay bài tập — suy ra, có thể là `chua_ro`. Xem `dang-cau.ts`. */
  dang: DangCau
  mucDo: MucDoCau | ''
  text: string
  luaChon: string[] | null
  dapAn: string
  chot: string
  lyDo: { khoa: string; dung: boolean; ly: string }[] | null
  buoc: string[] | null
  ketQua: string
  /** Ảnh cắt cả thân câu — có ảnh này thì ảnh LÀ đề, không in `text` nữa
   * (đúng như màn làm bài của học sinh). */
  anhThanCau?: string
  /** Ảnh riêng của từng phương án / từng ý, theo thứ tự A–D hoặc a–d. */
  anhLuaChon?: (string | undefined)[]
  /** Ảnh nhúng theo vị trí trong câu (sau đề, sau từng phương án, cuối câu). */
  hinh?: HinhCau[]
  /** Bảng số liệu thầy gõ trong đề. */
  bang?: string[][] | null
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

type CauNguon = { phan: 'I' | 'II' | 'III'; maDe: string; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

function coHinh(q: { thanCauImg?: string; choiceImgs?: (string | undefined)[]; ideaImgs?: (string | undefined)[] }): boolean {
  return Boolean(q.thanCauImg || q.choiceImgs?.some(Boolean) || q.ideaImgs?.some(Boolean))
}

function goiCau(nguon: TeacherExamSource[]): CauNguon[] {
  const ra: CauNguon[] = []
  for (const s of nguon) {
    const maDe = String(s.maDe || '')
    for (const q of s.phanI) ra.push({ phan: 'I', maDe, q })
    for (const q of s.phanII) ra.push({ phan: 'II', maDe, q })
    for (const q of s.phanIII) ra.push({ phan: 'III', maDe, q })
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
  // Ảnh: gom `hinhAnh` (dữ liệu mới) và `imageDataUrl` (dữ liệu cũ, luôn nằm
  // sau đề) về một danh sách. Ảnh thân câu và ảnh phương án giữ riêng vì chúng
  // THAY THẾ chữ chứ không đứng cạnh chữ.
  const hinh: HinhCau[] = [...(q.hinhAnh ?? []).map((h) => ({ src: h.src, viTri: String(h.viTri), alt: h.alt }))]
  if (q.imageDataUrl) hinh.unshift({ src: q.imageDataUrl, viTri: 'sau_de' })

  return {
    phan: c.phan,
    id: q.id,
    maDe: c.maDe,
    chuyenDe: String(q.chuyenDe || ''),
    dang: dangCua({
      phan: c.phan,
      text: q.text,
      luaChon: c.phan === 'I' ? (mcq.choices ?? []) : c.phan === 'II' ? (tf.ideas ?? []) : [],
      dapAn: c.phan === 'III' ? String(sa.correct ?? '') : '',
      mucDo: q.mucDo,
      dang: (q as { dang?: string }).dang,
    }),
    mucDo: (q.mucDo as MucDoCau) || '',
    text: q.text || '',
    luaChon: c.phan === 'I' ? [...(mcq.choices ?? [])] : c.phan === 'II' ? [...(tf.ideas ?? [])] : null,
    dapAn: c.phan === 'I' ? String(mcq.correct ?? '') : c.phan === 'II' ? (tf.correct ?? []).join('') : String(sa.correct ?? ''),
    chot: lg?.chot ?? '',
    lyDo,
    buoc: lg?.buoc ? [...lg.buoc] : null,
    ketQua: lg?.ketQua ?? '',
    anhThanCau: q.thanCauImg,
    anhLuaChon: c.phan === 'I' ? [...(mcq.choiceImgs ?? [])] : c.phan === 'II' ? [...(tf.ideaImgs ?? [])] : undefined,
    hinh: hinh.length > 0 ? hinh : undefined,
    bang: q.table ?? null,
  }
}

/** Đổi cả một kho đề sang danh sách câu để in phiếu, GIỮ NGUYÊN thứ tự gốc.
 *
 * Khác `chonCauLuyen`: không lọc chuyên đề, không tránh câu đã làm, không xáo.
 * Dùng khi thầy muốn in ĐÚNG đề của một ca hay của một em — in thiếu hay in
 * khác thứ tự là tờ giấy không đối chiếu được với bài em đã làm. */
export function cauLuyenTuNguon(nguon: TeacherExamSource[]): CauLuyen[] {
  return goiCau(nguon).map(doiSang)
}

/** Đổi đúng bộ câu MỘT EM đã làm sang danh sách in phiếu, theo đúng thứ tự em
 * nhìn thấy trên màn hình. */
export function cauLuyenTuBoCau(bo: { phan: 'I' | 'II' | 'III'; maDe?: string; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }[]): CauLuyen[] {
  // Bộ câu một em không mang mã đề nguồn (nó đi ra từ ngân hàng của ca), nên
  // để trống — chỗ này chỉ IN LẠI đúng bài em vừa làm, không rút thêm gì.
  return bo.map((c) => doiSang({ ...c, maDe: String(c.maDe || '') }))
}

export interface YeuCauLuyen {
  /** Chuyên đề em đang yếu TRONG CA NÀY, kèm tỉ lệ sai. Dùng để XẾP ƯU TIÊN và
   * chọn bậc khởi điểm — KHÔNG phải ranh giới. */
  chuyenDe: { ten: string; tiLeSai: number }[]
  /** RANH GIỚI CỨNG: chuyên đề của chính ca đó. Thầy chốt 06/09 —
   * "chỉ rút bài tập từ những chuyên đề được chọn của ca đó".
   *
   * LỖI ĐÃ SỬA: trước đây chỉ có `chuyenDe` ở trên, và khi em KHÔNG SAI chuyên
   * đề nào thì danh sách rỗng, hàm hiểu rỗng là "lấy toàn kho" — bài luyện rút
   * cả những chuyên đề ca đó chưa từng đụng tới. Rỗng nay vẫn là ranh giới. */
  chuyenDeCa?: string[]
  /** Câu em đã từng làm — tránh trước, chỉ dùng lại khi hết câu mới. */
  qidDaLam?: string[]
  /** RANH GIỚI CHẶT NHẤT: mã đề của chính ca đó — tức đúng những BÀI thầy đã
   * chọn để thi.
   *
   * VÌ SAO CẦN, thầy bắt được 06/09: em Tuân chỉ thi Ester bài 1, mà bài luyện
   * ra câu xà phòng. Câu đó KHÔNG sai nhãn — nó đúng chuyên đề "Ester – lipid".
   * Chuyên đề trong kho là cả chương, gộp ester với xà phòng làm một, nên lọc
   * theo chuyên đề không bao giờ đủ chặt.
   *
   * Có `maDeCa` thì nó THẮNG `chuyenDeCa`. Rỗng = không biết ca lấy từ bài nào
   * ⇒ rơi về ranh giới chuyên đề. */
  maDeCa?: string[]
  /** Chỉ lý thuyết, chỉ bài tập, hay ngẫu nhiên. Mặc định ngẫu nhiên. */
  dang?: LocDang
  soCau: number
  ngauNhien?: () => number
}

/** Chọn câu cho một phiếu luyện. Thuần logic, không đụng DOM, test được. */
export function chonCauLuyen(nguon: TeacherExamSource[], yc: YeuCauLuyen): KetQuaChonCau {
  const rnd = yc.ngauNhien ?? Math.random
  const daLam = new Set(yc.qidDaLam ?? [])
  const khoiDiem = yc.chuyenDe.length ? mucKhoiDiem(Math.max(...yc.chuyenDe.map((c) => c.tiLeSai))) : 'hieu'
  const loc = yc.dang ?? LOC_DANG_MAC_DINH

  // RANH GIỚI: chuyên đề của ca. Không truyền thì giữ nguyên hành vi cũ (toàn
  // kho) — ca cũ và chỗ gọi chưa cập nhật vẫn chạy.
  const trongCa = new Set((yc.chuyenDeCa ?? []).map((t) => chuanChuyenDe(t)).filter(Boolean))
  // ƯU TIÊN: chuyên đề em sai nhiều nhất trong ca này lên trước. Đây là chỗ
  // "theo điểm mạnh yếu của ca thi đó" được thi hành — xếp thứ tự, không phải
  // cắt bỏ, nên em không sai gì vẫn có bài luyện trong đúng phạm vi ca.
  const hangYeu = new Map<string, number>()
  ;[...yc.chuyenDe]
    .sort((a, b) => b.tiLeSai - a.tiLeSai)
    .forEach((c, i) => {
      const k = chuanChuyenDe(c.ten)
      if (k && !hangYeu.has(k)) hangYeu.set(k, i)
    })
  const uuTien = (c: CauLuyen) => hangYeu.get(chuanChuyenDe(c.chuyenDe)) ?? Number.MAX_SAFE_INTEGER

  // Kho câu dùng được: trong phạm vi ca, đúng dạng thầy chọn, KHÔNG có hình.
  //
  // HAI LUẬT, tuỳ chỗ gọi có truyền phạm vi ca hay không:
  //   · CÓ `chuyenDeCa` (báo cáo sau ca) — ranh giới là phạm vi ca, còn chuyên
  //     đề yếu chỉ xếp thứ tự. Em không sai gì vẫn có bài trong đúng phạm vi.
  //   · KHÔNG có — giữ NGUYÊN luật cũ: chuyên đề yếu là bộ lọc CỨNG. Hạ nó
  //     xuống thành ưu tiên ở đây là nới âm thầm cho mọi chỗ gọi cũ.
  const tenYeu = yc.chuyenDe.map((c) => c.ten.trim()).filter(Boolean)
  // BA TẦNG RANH GIỚI, chặt trước lỏng sau. Tầng nào có thì tầng đó quyết,
  // KHÔNG cộng dồn và KHÔNG tự nới khi thiếu câu — nới âm thầm chính là thứ đã
  // đẻ ra câu xà phòng trong bài luyện Ester bài 1.
  const trongDe = new Set((yc.maDeCa ?? []).map((m) => String(m || '').trim()).filter(Boolean))
  const trongPhamVi = (c: CauLuyen) => {
    if (trongDe.size > 0) return trongDe.has(c.maDe.trim())
    if (trongCa.size > 0) return trongCa.has(chuanChuyenDe(c.chuyenDe))
    return tenYeu.length === 0 || tenYeu.includes(c.chuyenDe.trim())
  }

  const kho = goiCau(nguon)
    .filter((c) => !coHinh(c.q as { thanCauImg?: string }))
    .map(doiSang)
    .filter(trongPhamVi)
    .filter((c) => hopDang(c.dang, loc))

  const xao = <T,>(xs: T[]): T[] => {
    const a = [...xs]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Xáo trước rồi mới xếp theo ưu tiên: trong cùng một chuyên đề vẫn ngẫu
  // nhiên, nhưng chuyên đề yếu hơn luôn được lấy trước.
  const conLai = xao(kho).sort((a, b) => uuTien(a) - uuTien(b))
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
