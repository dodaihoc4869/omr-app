// Đề "đã đọc sẵn" — pipeline "Nạp đề mới" (Cowork) đọc PDF bằng thị giác,
// giải mù, đối chiếu đáp án, xuất JSON theo khuôn dưới rồi đẩy lên kho đề
// Apps Script; app trên máy thầy tải về (exam-sync.ts) và build thành
// TeacherExamSource bằng file này. App KHÔNG đọc PDF/DOCX nữa.
//
// AN TOÀN DỮ LIỆU: hàm ở đây CHỈ build dữ liệu trong bộ nhớ, KHÔNG tự lưu,
// KHÔNG tự gửi đi đâu — nơi gọi (exam-sync.ts, màn Ngân hàng) mới lưu vào
// IndexedDB máy thầy qua saveExamSource() sẵn có. File JSON có đáp án này
// KHÔNG BAO GIỜ được commit lên git (repo omr-app đang PUBLIC — xem
// kho-de/.gitignore) hay tải lên bất kỳ server nào.
import type { HinhAnh, LoiGiaiCauTruc, LyDoY, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion, TrangThaiLoiGiai, ViTriHinh } from '../data/examContent'

/** Lời giải do pipeline "giải mù" rồi đối chiếu đáp án đề (NAPDETUDONG.md
 * B2–B3). `dap_an_de` là đáp án in trong đề — luôn dùng để CHẤM. */
export interface KhoDeLyDo {
  dung: boolean
  vi_sao: string
}
export interface KhoDeLoiGiai {
  /** Bản cũ: một chuỗi liền. Bản mới: `chot` + `tung_pa`/`tung_y`/`buoc`. */
  noi_dung?: string
  chot?: string
  tung_pa?: Partial<Record<'A' | 'B' | 'C' | 'D', KhoDeLyDo>>
  tung_y?: Partial<Record<'a' | 'b' | 'c' | 'd', KhoDeLyDo>>
  buoc?: string[]
  ket_qua?: string
  dap_an_de?: string
  dap_an_tu_giai?: string
  trang_thai?: TrangThaiLoiGiai
  ghi_chu?: string | null
}

const GIOI_HAN_TU_CHOT = 20
const GIOI_HAN_TU_VI_SAO = 25
const demTu = (t: string) => t.trim().split(/\s+/).filter(Boolean).length

/** Kiểm tra QUY TẮC VIẾT lời giải có cấu trúc — trả về cảnh báo (không chặn):
 * chốt ≤ 20 từ, mỗi lý do ≤ 25 từ và không rỗng, đủ 4 phương án/ý. */
export function kiemTraLoiGiaiCauTruc(lg: KhoDeLoiGiai, phan: 'I' | 'II' | 'III', nhan: string): string[] {
  const w: string[] = []
  if (lg.chot && demTu(lg.chot) > GIOI_HAN_TU_CHOT) w.push(`${nhan}: câu chốt ${demTu(lg.chot)} từ (> ${GIOI_HAN_TU_CHOT})`)
  const kiemLyDo = (obj: Partial<Record<string, KhoDeLyDo>> | undefined, khoa: string[], ten: string) => {
    if (!obj) {
      w.push(`${nhan}: thiếu ${ten}`)
      return
    }
    for (const k of khoa) {
      const y = obj[k]
      if (!y || !y.vi_sao || !y.vi_sao.trim()) w.push(`${nhan}: ${ten}.${k} thiếu lý do`)
      else if (demTu(y.vi_sao) > GIOI_HAN_TU_VI_SAO) w.push(`${nhan}: ${ten}.${k} dài ${demTu(y.vi_sao)} từ (> ${GIOI_HAN_TU_VI_SAO})`)
    }
  }
  if (phan === 'I') kiemLyDo(lg.tung_pa, ['A', 'B', 'C', 'D'], 'tung_pa')
  if (phan === 'II') kiemLyDo(lg.tung_y, ['a', 'b', 'c', 'd'], 'tung_y')
  if (phan === 'III') {
    if (!lg.buoc || lg.buoc.length === 0) w.push(`${nhan}: thiếu "buoc" (các bước tính)`)
    if (!lg.ket_qua || !lg.ket_qua.trim()) w.push(`${nhan}: thiếu "ket_qua"`)
  }
  return w
}

/** Ảnh cắt sẵn từ đề gốc (200 DPI, mép 8px, nền trắng) — pipeline "Nạp đề
 * mới" vừa lưu file PNG vào kho-de/xong/<mã đề>/anh/<tep> vừa nhúng base64
 * vào `du_lieu` để file JSON tự chứa, nhập 1 lần là đủ. */
export interface KhoDeHinh {
  tep: string // vd "I_16.png" — <phần>_<số câu>[_<thứ tự>].png
  vi_tri: ViTriHinh
  du_lieu?: string // data URL base64 — thiếu thì câu vẫn lưu, chỉ thiếu ảnh (cảnh báo)
}

export interface KhoDeCau {
  phan: 'I' | 'II' | 'III'
  so: number
  de: string // công thức bọc $\ce{...}$ (hoặc \ce{...} trần) — KHÔNG dùng $$...$$
  pa?: Partial<Record<'A' | 'B' | 'C' | 'D', string>> // Phần I
  y?: Partial<Record<'a' | 'b' | 'c' | 'd', string>> // Phần II
  dap_an: string | Partial<Record<'a' | 'b' | 'c' | 'd', 'D' | 'S'>> // I: "A".."D" — II: "DSDS" hoặc {a,b,c,d} — III: chuỗi giá trị
  bang?: string[][] | null // bảng ĐƠN GIẢN (≤5 cột, không ô gộp) — phức tạp hơn thì cắt ảnh
  hinh?: KhoDeHinh[] | null
  tieu_de?: string
  can_xem?: boolean
  loi_giai?: KhoDeLoiGiai | null
  /** Chuyên đề (theo chương trình 2018, vd "Este – lipid") — QUANLYCATHI mục 5. Thiếu → không ghi, không đoán. */
  chuyen_de?: string
  /** Mức độ: biet | hieu | van_dung (ma trận đề 2025). */
  muc_do?: MucDo
}

export type MucDo = 'biet' | 'hieu' | 'van_dung'
const MUC_DO_HOP_LE = new Set<string>(['biet', 'hieu', 'van_dung'])
/** Nhận cả cách viết có dấu của pipeline cũ ("Nhận biết", "Thông hiểu", "Vận dụng"). */
export function chuanHoaMucDo(v: unknown): MucDo | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim().toLowerCase()
  if (MUC_DO_HOP_LE.has(t)) return t as MucDo
  const khongDau = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  if (/^(nhan )?biet$/.test(khongDau) || khongDau === 'nb') return 'biet'
  if (/^(thong )?hieu$/.test(khongDau) || khongDau === 'th') return 'hieu'
  if (/^van dung( cao)?$/.test(khongDau) || khongDau === 'vd' || khongDau === 'vdc') return 'van_dung'
  return undefined
}

export interface KhoDeJson {
  ma_de: string
  nguon?: string
  ngay_nap?: string
  /** Thư mục con trong kho-de/moi/ chứa file gốc (nhóm đề) — tuỳ chọn. */
  nhom?: string
  cau: KhoDeCau[]
}

export interface KhoDeParseResult {
  ok: boolean
  json?: KhoDeJson
  errors: string[]
}

const VI_TRI_HOP_LE = new Set<string>(['sau_de', 'sau_pa_A', 'sau_pa_B', 'sau_pa_C', 'sau_pa_D', 'sau_y_a', 'sau_y_b', 'sau_y_c', 'sau_y_d', 'cuoi_cau'])
const TRANG_THAI_HOP_LE = new Set<string>(['khop', 'lech_co_hd', 'nghi_dap_an_sai', 'thieu_dap_an'])

function parseLyDoMap(raw: unknown, khoa: string[]): Record<string, KhoDeLyDo> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const o = raw as Record<string, unknown>
  const out: Record<string, KhoDeLyDo> = {}
  for (const k of khoa) {
    const y = o[k]
    if (typeof y === 'object' && y !== null) {
      const yy = y as Record<string, unknown>
      out[k] = { dung: yy.dung === true, vi_sao: typeof yy.vi_sao === 'string' ? yy.vi_sao : '' }
    } else if (typeof y === 'string') {
      // dạng rút gọn: "A": "lý do" (không có cờ đúng/sai)
      out[k] = { dung: false, vi_sao: y }
    }
  }
  return Object.keys(out).length ? out : undefined
}

function parseLoiGiai(raw: unknown): KhoDeLoiGiai | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const noiDung = typeof o.noi_dung === 'string' && o.noi_dung.trim() ? o.noi_dung : undefined
  const chot = typeof o.chot === 'string' && o.chot.trim() ? o.chot.trim() : undefined
  if (!noiDung && !chot) return null
  const tt = typeof o.trang_thai === 'string' && TRANG_THAI_HOP_LE.has(o.trang_thai) ? (o.trang_thai as TrangThaiLoiGiai) : undefined
  const dapAn = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'object' && v !== null ? JSON.stringify(v) : undefined)
  return {
    noi_dung: noiDung,
    chot,
    tung_pa: parseLyDoMap(o.tung_pa, ['A', 'B', 'C', 'D']) as KhoDeLoiGiai['tung_pa'],
    tung_y: parseLyDoMap(o.tung_y, ['a', 'b', 'c', 'd']) as KhoDeLoiGiai['tung_y'],
    buoc: Array.isArray(o.buoc) ? o.buoc.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : undefined,
    ket_qua: typeof o.ket_qua === 'string' && o.ket_qua.trim() ? o.ket_qua.trim() : undefined,
    dap_an_de: dapAn(o.dap_an_de),
    dap_an_tu_giai: dapAn(o.dap_an_tu_giai),
    trang_thai: tt,
    ghi_chu: typeof o.ghi_chu === 'string' ? o.ghi_chu : null,
  }
}

/** Chuyển lời giải kho đề → LoiGiaiCauTruc của app (chỉ khi có `chot`). */
function toLoiGiaiCauTruc(lg: KhoDeLoiGiai | undefined): LoiGiaiCauTruc | undefined {
  if (!lg?.chot) return undefined
  const map = <K extends string>(m: Partial<Record<K, KhoDeLyDo>> | undefined): Partial<Record<K, LyDoY>> | undefined => {
    if (!m) return undefined
    const out: Partial<Record<K, LyDoY>> = {}
    for (const k of Object.keys(m) as K[]) {
      const y = m[k]
      if (y) out[k] = { dung: y.dung, viSao: y.vi_sao }
    }
    return out
  }
  return { chot: lg.chot, tungPa: map(lg.tung_pa), tungY: map(lg.tung_y), buoc: lg.buoc, ketQua: lg.ket_qua }
}

function parseHinh(raw: unknown, nhan: string, errors: string[]): KhoDeHinh[] | null {
  if (raw === undefined || raw === null) return null
  if (!Array.isArray(raw)) {
    errors.push(`${nhan}: "hinh" phải là mảng [{tep, vi_tri, du_lieu}] hoặc null`)
    return null
  }
  const out: KhoDeHinh[] = []
  raw.forEach((h, i) => {
    if (typeof h !== 'object' || h === null) {
      errors.push(`${nhan}: hình thứ ${i + 1} không phải object`)
      return
    }
    const o = h as Record<string, unknown>
    if (typeof o.tep !== 'string' || !o.tep.trim()) {
      errors.push(`${nhan}: hình thứ ${i + 1} thiếu "tep"`)
      return
    }
    if (typeof o.vi_tri !== 'string' || !VI_TRI_HOP_LE.has(o.vi_tri)) {
      errors.push(`${nhan}: hình "${o.tep}" có "vi_tri" không hợp lệ (${String(o.vi_tri)})`)
      return
    }
    out.push({ tep: o.tep, vi_tri: o.vi_tri as ViTriHinh, du_lieu: typeof o.du_lieu === 'string' && o.du_lieu.startsWith('data:image/') ? o.du_lieu : undefined })
  })
  return out
}

/** Bước 1 — parse JSON thô + kiểm tra đủ trường bắt buộc từng câu (không
 * kiểm tra khớp số lượng/nội dung sâu hơn — việc đó làm ở bước build vì cần
 * biết context cả 3 phần). Sai bất kỳ câu nào -> trả lỗi, KHÔNG build gì. */
export function parseKhoDeJsonText(raw: string): KhoDeParseResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, errors: ['Không đọc được JSON — kiểm tra lại cú pháp (dấu phẩy, ngoặc, dấu nháy kép...)'] }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, errors: ['JSON gốc phải là 1 object (không phải mảng)'] }
  const d = data as Record<string, unknown>
  const topErrors: string[] = []
  if (typeof d.ma_de !== 'string' || !d.ma_de.trim()) topErrors.push('Thiếu "ma_de"')
  if (!Array.isArray(d.cau) || d.cau.length === 0) topErrors.push('Thiếu mảng "cau" hoặc rỗng')
  if (topErrors.length > 0) return { ok: false, errors: topErrors }

  const cau: KhoDeCau[] = []
  const errors: string[] = []
  ;(d.cau as unknown[]).forEach((rawC, i) => {
    if (typeof rawC !== 'object' || rawC === null) {
      errors.push(`Phần tử thứ ${i + 1} trong "cau": không phải object`)
      return
    }
    const c = rawC as Record<string, unknown>
    if (c.phan !== 'I' && c.phan !== 'II' && c.phan !== 'III') {
      errors.push(`Phần tử thứ ${i + 1} trong "cau": "phan" phải là "I"/"II"/"III"`)
      return
    }
    if (typeof c.so !== 'number') {
      errors.push(`Phần ${c.phan}, phần tử thứ ${i + 1}: thiếu "so" (số thứ tự câu)`)
      return
    }
    const nhan = `Phần ${c.phan} câu ${c.so}`
    if (typeof c.de !== 'string' || !c.de.trim()) {
      errors.push(`${nhan}: thiếu "de"`)
      return
    }
    if (c.dap_an === undefined || c.dap_an === null || c.dap_an === '') {
      errors.push(`${nhan}: thiếu "dap_an"`)
      return
    }
    if (typeof c.de === 'string' && c.de.includes('$$')) {
      errors.push(`${nhan}: "de" chứa $$...$$ (chế độ khối) — công thức trong câu phải bọc $...$`)
      return
    }
    cau.push({
      phan: c.phan,
      so: c.so,
      de: c.de,
      pa: (c.pa as KhoDeCau['pa']) ?? undefined,
      y: (c.y as KhoDeCau['y']) ?? undefined,
      dap_an: c.dap_an as KhoDeCau['dap_an'],
      bang: (c.bang as string[][] | null | undefined) ?? null,
      hinh: parseHinh(c.hinh, nhan, errors),
      tieu_de: typeof c.tieu_de === 'string' ? c.tieu_de : undefined,
      can_xem: c.can_xem === true,
      loi_giai: parseLoiGiai(c.loi_giai),
      chuyen_de: typeof c.chuyen_de === 'string' && c.chuyen_de.trim() ? c.chuyen_de.trim() : undefined,
      muc_do: chuanHoaMucDo(c.muc_do),
    })
  })
  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    errors: [],
    json: {
      ma_de: String(d.ma_de),
      nguon: typeof d.nguon === 'string' ? d.nguon : undefined,
      ngay_nap: typeof d.ngay_nap === 'string' ? d.ngay_nap : undefined,
      nhom: typeof d.nhom === 'string' && d.nhom.trim() ? d.nhom.trim().replace(/^\/+|\/+$/g, '') : undefined,
      cau,
    },
  }
}

/** Bước 2 — build TeacherExamSource từ KhoDeJson đã parse. Thuần, không đụng
 * DOM — test được không cần trình duyệt. `errors` (thiếu đáp án/phương án)
 * CHẶN lưu; `warnings` (vd hình thiếu dữ liệu base64) KHÔNG chặn, câu vẫn vào
 * ngân hàng nhưng thiếu ảnh minh hoạ đó. */
export function buildTeacherSourceFromKhoDe(json: KhoDeJson): { source: TeacherExamSource; errors: string[]; warnings: string[]; canXemList: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const canXemList: string[] = []

  const phanI: TeacherMcqQuestion[] = []
  const phanII: TeacherTrueFalseQuestion[] = []
  const phanIII: TeacherShortAnswerQuestion[] = []

  for (const c of json.cau) {
    const nhan = `Phần ${c.phan} câu ${c.so}`
    let hinhAnh: HinhAnh[] | undefined
    if (c.hinh && c.hinh.length > 0) {
      hinhAnh = []
      for (const h of c.hinh) {
        if (h.du_lieu) hinhAnh.push({ src: h.du_lieu, viTri: h.vi_tri, alt: `Hình ${nhan} (${h.tep})` })
        else warnings.push(`${nhan}: hình "${h.tep}" thiếu dữ liệu ảnh (du_lieu) — câu vẫn lưu, thiếu ảnh này`)
      }
      if (hinhAnh.length === 0) hinhAnh = undefined
    }
    if (c.can_xem) canXemList.push(nhan)
    const lg = c.loi_giai ?? undefined
    if (lg?.chot) for (const w of kiemTraLoiGiaiCauTruc(lg, c.phan, nhan)) warnings.push(w)
    const chung = {
      text: c.de,
      table: c.bang ?? undefined,
      hinhAnh,
      tieuDe: c.tieu_de,
      canXem: c.can_xem,
      explanation: lg?.noi_dung,
      loiGiai: toLoiGiaiCauTruc(lg),
      loiGiaiTrangThai: lg?.trang_thai,
      dapAnTuGiai: lg?.dap_an_tu_giai,
      ghiChuLoiGiai: lg?.ghi_chu ?? undefined,
      chuyenDe: c.chuyen_de,
      mucDo: c.muc_do,
    }

    if (c.phan === 'I') {
      const pa = c.pa ?? {}
      const choices: [string, string, string, string] = [pa.A ?? '', pa.B ?? '', pa.C ?? '', pa.D ?? '']
      if (choices.some((x) => !x.trim())) {
        errors.push(`${nhan}: thiếu phương án (cần đủ A, B, C, D)`)
        continue
      }
      const correct = typeof c.dap_an === 'string' ? (c.dap_an.trim().toUpperCase() as 'A' | 'B' | 'C' | 'D') : undefined
      if (!correct || !['A', 'B', 'C', 'D'].includes(correct)) {
        errors.push(`${nhan}: "dap_an" phải là 1 trong A/B/C/D`)
        continue
      }
      phanI.push({ id: `${json.ma_de}-I-${c.so}`, ...chung, choices, correct })
    } else if (c.phan === 'II') {
      const y = c.y ?? {}
      const ideas: [string, string, string, string] = [y.a ?? '', y.b ?? '', y.c ?? '', y.d ?? '']
      if (ideas.some((x) => !x.trim())) {
        errors.push(`${nhan}: thiếu ý (cần đủ a, b, c, d)`)
        continue
      }
      let correct: ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'] | undefined
      if (typeof c.dap_an === 'string' && /^[DS]{4}$/i.test(c.dap_an)) {
        correct = c.dap_an.toUpperCase().split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']
      } else if (typeof c.dap_an === 'object' && c.dap_an !== null) {
        const o = c.dap_an as Partial<Record<'a' | 'b' | 'c' | 'd', 'D' | 'S'>>
        if (o.a && o.b && o.c && o.d) correct = [o.a, o.b, o.c, o.d]
      }
      if (!correct) {
        errors.push(`${nhan}: "dap_an" phải là chuỗi 4 ký tự D/S (vd "DSDS") hoặc object {a,b,c,d}`)
        continue
      }
      phanII.push({ id: `${json.ma_de}-II-${c.so}`, ...chung, ideas, correct })
    } else {
      const correct = typeof c.dap_an === 'string' ? c.dap_an.trim() : ''
      if (!correct) {
        errors.push(`${nhan}: thiếu "dap_an"`)
        continue
      }
      phanIII.push({ id: `${json.ma_de}-III-${c.so}`, ...chung, correct })
    }
  }

  return { source: { maDe: json.ma_de, phanI, phanII, phanIII, nguon: json.nguon, ngayNap: json.ngay_nap, nhom: json.nhom }, errors, warnings, canXemList }
}
