// TRA CÂU CHO TỜ CHIẾU + LỜI BÁO KHI THIẾU NỘI DUNG (màn Gọi lên bảng, Code 1, 21/09/2026; Boss quyết: tờ VẪN mở bằng câu dự phòng, nhưng thầy phải biết có câu thiếu nội dung).
// Từ 18/09 tờ chiếu dựng câu dự phòng ("Nội dung câu hỏi <số>") khi không tra được câu trong đề trên máy, và KHÔNG còn báo gì — thầy có thể chiếu chỗ trống mà không biết.
// THUẦN: không IO. Cùng MỘT hàm tra cho tờ chiếu và cho dòng báo, để số "N câu" trên màn khớp đúng những câu tờ sẽ thay thế.

/** Tra theo mã câu; không khớp nguyên văn thì khớp đuôi (mã có/không tiền tố tờ đề, như lúc tờ chiếu dựng). Khoá/mã rỗng không bao giờ khớp. */
export function timCauTheoId<T>(tra: ReadonlyMap<string, T>, id: string): T | undefined {
  const thang = tra.get(id)
  if (thang !== undefined) return thang
  if (!id) return undefined
  for (const [k, v] of tra.entries()) if (k && (k.endsWith(id) || id.endsWith(k))) return v
  return undefined
}

/** Số câu KHÁC NHAU (theo mã) không tra được nội dung. Một câu chia cho nhiều em chỉ đếm MỘT lần — thầy đọc "N câu", không phải "N ô". */
export function demCauThieuNoiDung(ids: readonly string[], tra: ReadonlyMap<string, unknown>): number {
  const thieu = new Set<string>()
  for (const id of ids) if (!thieu.has(id) && timCauTheoId(tra, id) === undefined) thieu.add(id)
  return thieu.size
}

/** Dòng báo mềm cho thầy; 0 câu thiếu ⇒ `null` (không hiện gì). Chữ theo chuẩn từ ngữ: có nhãn + đơn vị, nói thật, không doạ. */
export function chuThieuNoiDung(soCau: number): string | null {
  return soCau > 0 ? `${soCau} câu chưa tra được nội dung đề — tờ chiếu sẽ hiện dòng thay thế` : null
}
