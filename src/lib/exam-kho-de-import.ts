// Nhập đề "đã đọc sẵn" — Claude đọc PDF/docx bằng thị giác (ngoài luồng app,
// trong hội thoại hoặc qua tác vụ định kỳ "Nạp đề mới"), xuất JSON đầy đủ
// đáp án theo khuôn cố định bên dưới, thầy dán/chọn file JSON này vào màn
// Tải đề để lưu thẳng vào ngân hàng câu hỏi — KHÔNG đi qua lại bước tách
// câu bằng lớp chữ pdftotext/geometry, vì Claude đã đọc và cấu trúc hoá sẵn.
//
// AN TOÀN DỮ LIỆU: hàm ở đây CHỈ build dữ liệu trong bộ nhớ, KHÔNG tự lưu,
// KHÔNG tự gửi đi đâu — nơi gọi (ExamImportScreen) mới quyết định lưu vào
// IndexedDB máy thầy qua saveExamSource() sẵn có. File JSON có đáp án này
// KHÔNG BAO GIỜ được commit lên git (repo omr-app đang PUBLIC — xem
// kho-de/.gitignore) hay tải lên bất kỳ server nào.
import type { HinhAnh, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion, ViTriHinh } from '../data/examContent'

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
}

export interface KhoDeJson {
  ma_de: string
  nguon?: string
  ngay_nap?: string
  cau: KhoDeCau[]
}

export interface KhoDeParseResult {
  ok: boolean
  json?: KhoDeJson
  errors: string[]
}

const VI_TRI_HOP_LE = new Set<string>(['sau_de', 'sau_pa_A', 'sau_pa_B', 'sau_pa_C', 'sau_pa_D', 'sau_y_a', 'sau_y_b', 'sau_y_c', 'sau_y_d', 'cuoi_cau'])

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
    const chung = { text: c.de, table: c.bang ?? undefined, hinhAnh, tieuDe: c.tieu_de, canXem: c.can_xem }

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

  return { source: { maDe: json.ma_de, phanI, phanII, phanIII }, errors, warnings, canXemList }
}
