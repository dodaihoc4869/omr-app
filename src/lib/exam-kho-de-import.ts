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
import type { TeacherExamSource, TeacherMcqQuestion, TeacherTrueFalseQuestion, TeacherShortAnswerQuestion } from '../data/examContent'

export interface KhoDeHinh {
  trang: number // số trang PDF (từ 1)
  x0: number // toạ độ tỉ lệ 0..1 theo chiều rộng trang, gốc trên-trái
  y0: number
  x1: number
  y1: number
}

export interface KhoDeCau {
  phan: 'I' | 'II' | 'III'
  so: number
  de: string // mhchem/LaTeX cho công thức Hoá
  pa?: Partial<Record<'A' | 'B' | 'C' | 'D', string>> // Phần I
  y?: Partial<Record<'a' | 'b' | 'c' | 'd', string>> // Phần II
  dap_an: string | Partial<Record<'a' | 'b' | 'c' | 'd', 'D' | 'S'>> // I: "A".."D" — II: "DSDS" hoặc {a,b,c,d} — III: chuỗi giá trị
  bang?: string[][] | null
  hinh?: KhoDeHinh | null
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
    if (typeof c.de !== 'string' || !c.de.trim()) {
      errors.push(`Phần ${c.phan} câu ${c.so}: thiếu "de"`)
      return
    }
    if (c.dap_an === undefined || c.dap_an === null || c.dap_an === '') {
      errors.push(`Phần ${c.phan} câu ${c.so}: thiếu "dap_an"`)
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
      hinh: (c.hinh as KhoDeHinh | null | undefined) ?? null,
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

/** Bước 2 — build TeacherExamSource từ KhoDeJson đã parse. `resolveHinh` do
 * nơi gọi cung cấp (cắt ảnh thật từ file PDF gốc bằng cropRegionFromPdf) để
 * hàm này KHÔNG đụng PDF/DOM — build thuần, test được không cần trình
 * duyệt. `errors` (thiếu đáp án/phương án) CHẶN lưu; `warnings` (vd cắt ảnh
 * hình lỗi) KHÔNG chặn, câu vẫn vào ngân hàng nhưng thiếu ảnh minh hoạ. */
export async function buildTeacherSourceFromKhoDe(
  json: KhoDeJson,
  resolveHinh?: (hinh: KhoDeHinh) => Promise<string>,
): Promise<{ source: TeacherExamSource; errors: string[]; warnings: string[]; canXemList: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  const canXemList: string[] = []

  const phanI: TeacherMcqQuestion[] = []
  const phanII: TeacherTrueFalseQuestion[] = []
  const phanIII: TeacherShortAnswerQuestion[] = []

  for (const c of json.cau) {
    const nhan = `Phần ${c.phan} câu ${c.so}`
    let imageDataUrl: string | undefined
    if (c.hinh) {
      if (resolveHinh) {
        try {
          imageDataUrl = await resolveHinh(c.hinh)
        } catch (err) {
          warnings.push(`${nhan}: cắt ảnh hình thất bại — ${err instanceof Error ? err.message : 'lỗi không rõ'} (câu vẫn lưu, thiếu ảnh minh hoạ)`)
        }
      } else {
        warnings.push(`${nhan}: có "hinh" cần cắt nhưng chưa chọn file gốc kèm theo (câu vẫn lưu, thiếu ảnh minh hoạ)`)
      }
    }
    if (c.can_xem) canXemList.push(nhan)

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
      phanI.push({ id: `${json.ma_de}-I-${c.so}`, text: c.de, choices, correct, table: c.bang ?? undefined, imageDataUrl, tieuDe: c.tieu_de, canXem: c.can_xem })
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
      phanII.push({ id: `${json.ma_de}-II-${c.so}`, text: c.de, ideas, correct, table: c.bang ?? undefined, imageDataUrl, tieuDe: c.tieu_de, canXem: c.can_xem })
    } else {
      const correct = typeof c.dap_an === 'string' ? c.dap_an.trim() : ''
      if (!correct) {
        errors.push(`${nhan}: thiếu "dap_an"`)
        continue
      }
      phanIII.push({ id: `${json.ma_de}-III-${c.so}`, text: c.de, correct, table: c.bang ?? undefined, imageDataUrl, tieuDe: c.tieu_de, canXem: c.can_xem })
    }
  }

  return { source: { maDe: json.ma_de, phanI, phanII, phanIII }, errors, warnings, canXemList }
}
