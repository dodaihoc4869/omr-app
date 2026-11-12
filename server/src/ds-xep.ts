// DANH SÁCH KHOÁ CHO `FROM json_each(?) j CROSS JOIN <bảng> … = j.value` (12/11 H2, hoá đơn D1 hàng đọc).
// `x IN (SELECT value FROM json_each(?))` khiến D1 đọc danh sách HAI lần (dựng chỉ mục tạm rồi duyệt) — đo miniflare: 150 khoá ⇒ thêm 150 hàng đọc mỗi lượt.
// Nối thẳng json_each (CROSS JOIN giữ json_each làm vòng ngoài) chỉ đọc một lần. Để dòng ra Y HỆT câu cũ (SQLite duyệt chỉ mục tạm: khoá DUY NHẤT, xếp
// tăng theo BINARY = thứ tự byte UTF-8), danh sách gửi đi được bỏ trùng + xếp theo điểm mã (= thứ tự byte UTF-8). Các dòng cùng một khoá vẫn theo thứ tự
// chỉ mục của bảng như cũ.
/** So hai chuỗi theo điểm mã Unicode (= thứ tự byte UTF-8 = BINARY của SQLite); JS `<` so theo đơn vị UTF-16 (lệch với ký tự ngoài BMP). */
export function soDiemMa(a: string, b: string): number {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a.codePointAt(i)!, y = b.codePointAt(i)!
    if (x !== y) return x - y
    if (x > 0xffff) i++
  }
  return a.length - b.length
}
/** JSON của danh sách khoá đã bỏ trùng + xếp đúng thứ tự BINARY của SQLite. */
export function dsXep(ds: Iterable<string>): string {
  return JSON.stringify([...new Set(ds)].sort(soDiemMa))
}
