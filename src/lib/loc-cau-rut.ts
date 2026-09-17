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
 * KIỂM TRA MỘT CÂU CÓ PHẢI LÀ CÂU TỰ LUẬN HOẶC KHÔNG THUỘC 3 DẠNG CHUẨN HAY KHÔNG.
 *
 * YÊU CẦU CỦA THẦY:
 * - Khoá vĩnh viễn tất cả câu tự luận bị rút sai.
 * - CHỈ RÚT 3 DẠNG CHUẨN:
 *   1. Trắc nghiệm nhiều lựa chọn (Phần I: có phương án A, B, C, D rõ ràng).
 *   2. Đúng / Sai (Phần II: có 4 ý a,b,c,d mỗi ý chọn Đúng/Sai, đáp án dạng 4 ký tự Đ/S).
 *   3. Trả lời ngắn (Phần III: ĐÁP ÁN BẮT BUỘC PHẢI LÀ MỘT CON SỐ DUY NHẤT).
 * - Mọi câu ghép cột, câu tự luận nhiều ý con a,b,c, câu hỏi mở "được không?", "có/không", "giải thích",
 *   câu có đáp án dạng chữ, khoảng giá trị, dãy số -> KHÓA VĨNH VIỄN!
 */
export function laCauTuLuan(
  phan: string,
  dapAn: unknown,
  text?: string,
  extra?: { luaChon?: unknown; choices?: unknown; ideas?: unknown },
): boolean {
  const da = String(dapAn ?? '').trim()
  const txt = String(text ?? '')
  const choices = Array.isArray(extra?.luaChon)
    ? extra.luaChon
    : Array.isArray(extra?.choices)
    ? extra.choices
    : Array.isArray(extra?.ideas)
    ? extra.ideas
    : null

  // 1. Nhận diện dạng tự luận qua các từ khoá trong đề bài (áp dụng cho mọi phần):
  // Câu ghép nối ô / ghép cột: "Ghép mỗi biểu diễn...", "cột A... cột B", "liệt kê đáp án theo trình tự", "nối cột"
  if (
    /\b(ghép\s+(?:mỗi\s+)?(?:biểu\s+diễn|cột|ô|nối|đôi)|cột\s*[Aa]\b[\s\S]*cột\s*[Bb]\b|nối\s+(?:cột|ô)|liệt\s+kê\s+đáp\s+án\s+theo\s+trình\s+tự)\b/i.test(
      txt,
    )
  ) {
    return true
  }

  // Câu hỏi mở tự luận (không thể chấm khách quan bằng máy):
  if (
    /(?:được\s+không\s*\?|có\s+(?:hay\s+)?không\s*\?|tại\s+sao\s*\?|giải\s+thích\b|hãy\s+cho\s+biết\b|trình\s+bày\b|chứng\s+minh\b|nêu\s+hiện\s+tượng\b|viết\s+(?:các\s+)?phương\s+trình\b|tự\s+luận\b|tính\s+toán\s+và\s+giải\s+thích)/i.test(
      txt,
    )
  ) {
    return true
  }

  // 2. Chuẩn hoá phần: CHỈ CHẤP NHẬN 3 DẠNG CHUẨN (I, II, III).
  // Ngoài 3 dạng này -> KHÓA VĨNH VIỄN!
  let p = String(phan || '').toUpperCase().trim()
  if (p === '1') p = 'I'
  if (p === '2') p = 'II'
  if (p === '3') p = 'III'

  if (p !== 'I' && p !== 'II' && p !== 'III') {
    return true
  }

  // PHẦN I: Trắc nghiệm nhiều lựa chọn
  if (p === 'I') {
    // Phải có danh sách phương án lựa chọn (ít nhất 2 phương án)
    if (choices && choices.length < 2) return true
    // Nếu có đáp án, phải là ký tự trắc nghiệm A, B, C, D (hoặc 1-4)
    if (da && !/^[ABCD1-4]$/i.test(da)) return true
    // Nếu đề bài có dấu hiệu chia nhiều ý a), b), c) tự luận -> loại
    if (/(?:^|\n|\s)a\)\s+[\s\S]+(?:^|\n|\s)b\)\s+/i.test(txt)) return true
    return false
  }

  // PHẦN II: Đúng / Sai
  if (p === 'II') {
    // Đáp án chuẩn Đúng/Sai phải là 4 ký tự Đ/S (hoặc D/S, T/F)
    const daClean = da.replace(/[^dđstfDĐSTF]/g, '')
    if (daClean.length !== 4 && (!choices || choices.length !== 4)) return true
    return false
  }

  // PHẦN III: Trả lời ngắn
  if (p === 'III') {
    // ĐÁP ÁN BẮT BUỘC PHẢI LÀ MỘT CON SỐ DUY NHẤT (số nguyên hoặc số thập phân chuẩn)
    // Ví dụ hợp lệ: "100", "99,97", "99.97", "-5", "0.25", "+12"
    const laSoDuyNhat = /^[+-]?\d+(?:[.,]\d+)?$/.test(da)
    if (!laSoDuyNhat) {
      // Nếu đáp án chứa chữ ("có", "không"), khoảng ("1000-2000"), dãy số ("123, 231"), công thức -> TỰ LUẬN!
      return true
    }

    // Đề bài Phần III có chứa các ý con tự luận a), b), c) -> TỰ LUẬN!
    if (/(?:^|\n|\s)a\)\s+[\s\S]+(?:^|\n|\s)b\)\s+/i.test(txt)) {
      return true
    }

    // Đáp án chứa dấu xuống dòng, dấu chấm phẩy, mũi tên phản ứng, dấu hai chấm
    if (/[\n;→⇌:]/.test(da)) return true

    return false
  }

  return false
}

/**
 * Điều kiện kiểm tra câu hợp lệ để rút:
 * 1. Loại bỏ câu ví dụ minh hoạ, dạng toán trọng tâm.
 * 2. CHỈ rút 3 dạng chuẩn: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn có đáp án số đơn nhất.
 * 3. Khoá vĩnh viễn câu tự luận.
 */
export function hopLeDeRut(c: {
  phan?: string
  maDe?: string
  nhom?: string
  nguon?: string
  dapAn?: unknown
  dapAnDung?: unknown
  text?: string
  id?: string
  choices?: unknown
  luaChon?: unknown
  ideas?: unknown
  q?: any
}): boolean {
  const phan = c.phan || c.q?.phan || ''
  const maDe = c.maDe || c.q?.maDe || ''
  const nhom = c.nhom || ''
  const nguon = c.nguon || ''
  const q = c.q || c

  if (laViDuHoacDangToan(maDe, nhom, nguon, q)) return false

  const da =
    c.dapAnDung !== undefined
      ? c.dapAnDung
      : c.dapAn !== undefined
      ? c.dapAn
      : (q.correct ?? q.dap_an ?? q.dapAn ?? q.dapAnDung)
  const txt = c.text || q.text || q.de || ''
  const choices = c.choices || c.luaChon || c.ideas || q.choices || q.luaChon || q.ideas

  if (laCauTuLuan(phan, da, txt, { choices })) return false

  return true
}
