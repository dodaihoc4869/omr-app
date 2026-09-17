// BỘ LỌC CÂU CHUẨN TRÊN MÁY CHỦ — KHÓA VĨNH VIỄN CÂU TỰ LUẬN
// CHỈ RÚT 3 DẠNG CHUẨN:
// 1. Phần I: Trắc nghiệm 4 lựa chọn (có choices >= 2, đáp án A-D).
// 2. Phần II: Đúng / Sai 4 ý (đáp án 4 ký tự Đ/S).
// 3. Phần III: Trả lời ngắn — ĐÁP ÁN BẮT BUỘC LÀ 1 CON SỐ DUY NHẤT.
//
// Mọi câu ghép cột, chia nhánh tự luận a,b,c, câu hỏi mở -> KHÓA VĨNH VIỄN!

/**
 * Kiểm tra xem câu / đề có thuộc phần "Ví dụ minh hoạ" hoặc "Các dạng toán trọng tâm" không.
 */
export function laViDuHoacDangToan(
  maDe?: string,
  nhom?: string,
  nguon?: string,
  q?: { tieu_de?: unknown; dang?: unknown; text?: string; id?: string; chuyen_de?: string },
): boolean {
  const ma = String(maDe || '').toUpperCase().trim()
  if (/(?:-VD|-DT)(?:-|$)/i.test(ma)) return true
  if (/-VD\b/i.test(ma) || /-DT\b/i.test(ma)) return true

  const nh = String(nhom || '').toUpperCase()
  if (nh.includes('VÍ DỤ') || nh.includes('VI DU') || nh.includes('DẠNG TOÁN') || nh.includes('DANG TOAN')) return true

  const ng = String(nguon || '').toUpperCase()
  if (
    ng.includes('VÍ DỤ MINH HO') ||
    ng.includes('VI DU MINH HO') ||
    ng.includes('DẠNG TOÁN TRỌNG TÂM') ||
    ng.includes('DANG TOAN TRONG TAM') ||
    ng.includes('VÍ DỤ - DẠNG TOÁN') ||
    ng.includes('VI DU - DANG TOAN')
  ) {
    return true
  }

  if (q) {
    const qid = String(q.id || '').toUpperCase()
    if (/(?:-VD|-DT)(?:-|$)/i.test(qid)) return true

    const td = String(q.tieu_de || '').toUpperCase()
    if (td.includes('VÍ DỤ') || td.includes('DẠNG TOÁN TRỌNG TÂM') || td.includes('DANG TOAN TRONG TAM')) return true

    const dang = typeof q.dang === 'string' ? q.dang.toUpperCase() : ''
    if (dang.includes('VÍ DỤ') || dang.includes('DẠNG TOÁN TRỌNG TÂM') || dang.includes('DANG TOAN TRONG TAM')) return true
  }

  return false
}

/**
 * KIỂM TRA MỘT CÂU CÓ THUỘC 3 DẠNG CHUẨN ĐƯỢC PHÉP RÚT HAY KHÔNG.
 */
export function hopLe3DangChuan(c: {
  phan?: string
  text?: string
  dapAnDung?: unknown
  dapAn?: unknown
  choices?: unknown
  ideas?: unknown
  maDe?: string
  nhom?: string
  nguon?: string
  id?: string
}): boolean {
  if (laViDuHoacDangToan(c.maDe, c.nhom, c.nguon, c)) return false

  const da = String(c.dapAnDung ?? c.dapAn ?? '').trim()
  const txt = String(c.text ?? '')
  const choices = Array.isArray(c.choices) ? c.choices : Array.isArray(c.ideas) ? c.ideas : null

  // 1. Loại bỏ các câu chứa từ khoá tự luận, ghép cột, chia nhánh câu hỏi mở
  if (
    /\b(ghép\s+(?:mỗi\s+)?(?:biểu\s+diễn|cột|ô|nối|đôi)|cột\s*[Aa]\b[\s\S]*cột\s*[Bb]\b|nối\s+(?:cột|ô)|liệt\s+kê\s+đáp\s+án\s+theo\s+trình\s+tự)\b/i.test(
      txt
    )
  ) {
    return false
  }

  if (
    /(?:được\s+không\s*\?|có\s+(?:hay\s+)?không\s*\?|tại\s+sao\s*\?|giải\s+thích\b|hãy\s+cho\s+biết\b|trình\s+bày\b|chứng\s+minh\b|nêu\s+hiện\s+tượng\b|viết\s+(?:các\s+)?phương\s+trình\b|tự\s+luận\b|tính\s+toán\s+và\s+giải\s+thích)/i.test(
      txt
    )
  ) {
    return false
  }

  // 2. Chuẩn hoá Phần
  let p = String(c.phan || '').toUpperCase().trim()
  if (p === '1') p = 'I'
  if (p === '2') p = 'II'
  if (p === '3') p = 'III'

  if (p !== 'I' && p !== 'II' && p !== 'III') return false

  // PHẦN I: Trắc nghiệm 4 lựa chọn
  if (p === 'I') {
    if (choices && choices.length < 2) return false
    if (da && !/^[ABCD1-4]$/i.test(da)) return false
    if (/(?:^|\n|\s)a\)\s+[\s\S]+(?:^|\n|\s)b\)\s+/i.test(txt)) return false
    return true
  }

  // PHẦN II: Đúng / Sai
  if (p === 'II') {
    const daClean = da.replace(/[^dđstfDĐSTF]/g, '')
    if (daClean.length !== 4 && (!choices || choices.length !== 4)) return false
    return true
  }

  // PHẦN III: Trả lời ngắn
  if (p === 'III') {
    const laSoDuyNhat = /^[+-]?\d+(?:[.,]\d+)?$/.test(da)
    if (!laSoDuyNhat) return false
    if (/(?:^|\n|\s)a\)\s+[\s\S]+(?:^|\n|\s)b\)\s+/i.test(txt)) return false
    if (/[\n;→⇌:]/.test(da)) return false
    return true
  }

  return false
}
