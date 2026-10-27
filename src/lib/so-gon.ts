// SỐ GỌN cho viên đếm nổi mép trái (thầy chốt P2 27/10): viên rộng 44 px ⇒ số dài phải rút gọn, số ĐẦY ĐỦ nằm ở nhãn (aria-label) và thẻ bật khi chạm.
//   ≤ 9.999 giữ nguyên (kiểu vi-VN: «1.250») · từ 10.000 ⇒ «12,3k» (một chữ số lẻ, bỏ «,0») · từ 1 triệu ⇒ «1,2tr».

const phay = (x: number) => String(x).replace('.', ',')

export function soGon(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) < 10000) return n.toLocaleString('vi-VN')
  const am = n < 0 ? '-' : ''
  const a = Math.abs(n)
  const k = Math.round(a / 100) / 10
  if (k < 1000) return `${am}${phay(k)}k`
  return `${am}${phay(Math.round(a / 100000) / 10)}tr`
}
