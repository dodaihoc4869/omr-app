// Tên lớp hiệu lực là lớp 12 («12 - Lớp Thường», «12 Tinh Hoa», «12A1»…) — tách nhỏ để màn Hôm nay quyết định giữ chỗ thẻ đếm ngược mà không nạp cả thẻ.
export const laLop12 = (lop: string | null | undefined): boolean => /^\s*12(?!\d)/.test(String(lop ?? ''))
