// DỌN KÝ TỰ LẠ RƠI RA TỪ PDF GỐC.
//
// Đề tải về từ file Word/PDF của nhà xuất bản hay dính ký tự thuộc VÙNG DÙNG
// RIÊNG (Private Use Area, U+E000–U+F8FF). Nguồn phổ biến nhất: font Symbol.
// Trong font Symbol, dấu `[` nằm ở mã 0x5B; khi rút chữ ra khỏi PDF, bộ đọc
// ánh xạ nó thành **U+F05B** thay vì `[`. Máy học sinh không có font Symbol nên
// hiện ra Ô VUÔNG RỖNG.
//
// Thầy bắt được lỗi này ngày 04-09 ở Phần I câu 32 đề `12-C1-B1`: bốn phương án
// đều hiện `K C = ▯CH3COOH ▯▯ HOC2H5 ▯.` — thực ra là `K C = [CH3COOH][HOC2H5]`.
//
// Ánh xạ chuẩn: U+F020–U+F0FF ứng đúng ASCII 0x20–0xFF, chỉ việc trừ 0xF000.
// Đây KHÔNG phải đoán mò — đó là cách các bộ rút chữ PDF mã hoá font ký hiệu.
// Nhưng vẫn có ký tự lạ ngoài dải đó, và những chỗ đó thì KHÔNG đoán: cờ hoá
// để thầy mở ảnh gốc xem, chứ không thay bừa một ký tự nào cho đẹp mắt.

/** Dải Symbol gỡ được: U+F020–U+F0FF. */
const DAI_SYMBOL = /[\uF020-\uF0FF]/g
/** Ký tự vùng dùng riêng còn sót lại sau khi đã gỡ dải Symbol. */
const CON_LA = /[\uE000-\uF8FF]/

/** Thay ký tự Symbol (U+F020–U+F0FF) bằng ASCII tương ứng. */
export function goKyTuLa(s: string): string {
  if (!s) return s
  return s.replace(DAI_SYMBOL, (c) => String.fromCharCode(c.charCodeAt(0) - 0xf000))
}

/** Còn ký tự vùng dùng riêng nào KHÔNG gỡ được không — chỗ này phải cờ hoá. */
export function conKyTuLa(s: string): boolean {
  return CON_LA.test(s || '')
}

/** Gỡ ký tự lạ trong mọi trường chữ của một câu, và cho biết câu có còn ký tự
 * không đọc được hay không. Trả về đối tượng MỚI, không sửa dữ liệu vào.
 * Trường `src` (ảnh base64) được giữ nguyên, không quét. */
export function donCau<T>(q: T): { cau: T; conLa: boolean } {
  let conLa = false
  const di = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const s = goKyTuLa(v)
      if (conKyTuLa(s)) conLa = true
      return s
    }
    if (Array.isArray(v)) return v.map(di)
    if (v && typeof v === 'object') {
      const ra: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) ra[k] = k === 'src' ? x : di(x)
      return ra
    }
    return v
  }
  return { cau: di(q) as T, conLa }
}
