// SO PROPS CHO `memo` Ở MÀN THI (máy yếu, 29/09).
//
// Đo trên điện thoại giả lập yếu (CPU chậm ×6, scripts/do-may-yeu.mjs): mỗi lần em chạm MỘT phương án, cả ~40 thẻ câu
// (≈ 1 100 component: đề, phương án, bảng, ảnh, minh hoạ thí nghiệm) chạy lại ⇒ 1,1–1,6 giây mới thấy ô chuyển màu; nhịp
// lưu tạm 10 giây cũng vẽ lại cả đề ⇒ giật khi đang cuộn. Nguyên nhân: mỗi lần vẽ, màn thi tạo HÀM MỚI (`onSelect`,
// `onChange`) và object/mảng mới (`cauHoiLai`, `selected` rỗng) cho từng thẻ ⇒ `memo` mặc định (so `===`) luôn thấy khác.
//
// Hàm so dưới đây coi hai bộ props là BẰNG NHAU khi:
//   · chuỗi / số / boolean / null: `Object.is`;
//   · mảng: cùng độ dài và từng phần tử `Object.is` (vd `selected` Phần II `[null,null,null,null]` tạo mới mỗi lần);
//   · object thường (không phải mảng, không phải phần tử React): cùng khoá và từng giá trị `Object.is` (vd `cauHoiLai`, `daLamO`);
//   · HÀM: coi như bằng nhau — CHỈ dùng khi nơi gọi bảo đảm hàm truyền vào có hành vi KHÔNG phụ thuộc lần vẽ
//     (chỉ gọi setState dạng hàm, ref, hằng — xem chỗ dùng ở ExamTakeScreen). Hàm đọc state của lần vẽ thì KHÔNG được dùng.
// Không đổi dữ liệu, không đổi chấm điểm: chỉ quyết định có vẽ lại thẻ hay không.

function bangNongMang(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false
  return true
}

function laObjectThuong(x: unknown): x is Record<string, unknown> {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false
  const proto = Object.getPrototypeOf(x)
  return (proto === Object.prototype || proto === null) && !('$$typeof' in (x as object))
}

function bangNongObject(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  for (const k of ka) if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) return false
  return true
}

/** So một giá trị prop theo luật ở đầu tệp. */
export function bangGiaTriProp(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a === 'function' && typeof b === 'function') return true
  if (Array.isArray(a) && Array.isArray(b)) return bangNongMang(a, b)
  if (laObjectThuong(a) && laObjectThuong(b)) return bangNongObject(a, b)
  return false
}

/** Hàm so props cho `memo(Component, bangPropsBoQuaHam)`. */
export function bangPropsBoQuaHam<P extends object>(truoc: Readonly<P>, sau: Readonly<P>): boolean {
  const a = truoc as Record<string, unknown>
  const b = sau as Record<string, unknown>
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!bangGiaTriProp(a[k], b[k])) return false
  }
  return true
}
