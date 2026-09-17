// BỘ LỌC RÚT ĐỀ / RÚT CÂU — CHUẨN HOÁ CHO TOÀN BỘ HỆ THỐNG
//
// Yêu cầu của thầy:
// 1. Không rút câu có nhãn dán thuộc phần "Ví dụ minh hoạ" và "Các dạng toán trọng tâm".
// 2. Không rút câu tự luận vì không điền được đáp án chính xác (chỉ nhận trắc nghiệm chuẩn & trả lời ngắn có đáp án số/ngắn điền được).

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
 * Kiểm tra xem câu có phải câu tự luận (không điền được đáp án chính xác) hay không.
 *
 * Phần I (trắc nghiệm 4 phương án) và Phần II (đúng/sai 4 ý) là trắc nghiệm chuẩn, không phải tự luận.
 * Phần III là phần trả lời ngắn: nếu đáp án là một câu văn dài, đoạn văn giải thích, quá trình phản ứng...
 * thì đó là câu tự luận, học sinh không thể điền khớp đáp án chính xác vào ô input.
 */
export function laCauTuLuan(phan: string, dapAn: unknown, text?: string): boolean {
  // Phần I và Phần II luôn có phương án hoặc ý A/B/C/D, D/S -> trắc nghiệm chuẩn, không phải tự luận
  if (phan === 'I' || phan === 'II') return false

  const da = String(dapAn ?? '').trim()
  // Nếu không có đáp án hoặc đáp án rỗng ở phần III -> không chấm được
  if (!da) return true

  // Đáp án chứa dấu xuống dòng, dấu chấm phẩy, mũi tên phản ứng, dấu hai chấm
  if (/[\n;→⇌:]/.test(da)) return true

  // Đáp án dài quá 20 ký tự và có chứa khoảng trắng (câu văn / đoạn văn)
  if (da.length > 20 && /\s/.test(da)) return true

  // Đáp án chứa các từ giải thích tự luận tiếng Việt
  if (
    /\b(là|và|để|có|của|thì|ở|trong|giải thích|vì|phản ứng|quá trình|chất oxi|chất khử|phương trình|kết luận|hình thành|liệt kê|xác định)\b/i.test(
      da,
    )
  ) {
    return true
  }

  // Nếu đề bài yêu cầu giải thích, viết quá trình, chứng minh... mà đáp án không phải là số ngắn
  if (text) {
    const t = text.toLowerCase()
    const laYeuCauTuLuan =
      t.includes('giải thích') ||
      t.includes('viết một quá trình') ||
      t.includes('viết quá trình') ||
      t.includes('trình bày') ||
      t.includes('chứng minh') ||
      t.includes('nêu hiện tượng')
    if (laYeuCauTuLuan && !/^[+-]?\d+(?:[.,]\d+)?$/.test(da)) {
      return true
    }
  }

  return false
}

/**
 * Điều kiện kiểm tra câu hợp lệ để rút:
 * Loại bỏ câu ví dụ minh hoạ, dạng toán trọng tâm, và câu tự luận.
 */
export function hopLeDeRut(c: {
  phan?: string
  maDe?: string
  nhom?: string
  nguon?: string
  dapAn?: unknown
  text?: string
  id?: string
  q?: any
}): boolean {
  const phan = c.phan || c.q?.phan || ''
  const maDe = c.maDe || c.q?.maDe || ''
  const nhom = c.nhom || ''
  const nguon = c.nguon || ''
  const q = c.q || c

  if (laViDuHoacDangToan(maDe, nhom, nguon, q)) return false

  const da = c.dapAn !== undefined ? c.dapAn : (q.correct ?? q.dap_an ?? q.dapAn)
  const txt = c.text || q.text || q.de || ''
  if (laCauTuLuan(phan, da, txt)) return false

  return true
}
