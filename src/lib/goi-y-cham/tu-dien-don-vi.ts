// Từ điển ĐƠN VỊ cho «Chạm để hiểu đề» (thầy chốt build 26/10).
// Thẻ ngắn, đúng chương trình GDPT 2018, kèm công thức CHUNG — KHÔNG tính hộ số của đề (chỉ đọc lại số đề cho).
// Thầy 26/10: «Tạm thời bỏ tư duy tiền nhà» ⇒ nói thẳng bằng thuật ngữ (số mol, tỉ lệ hệ số, hiệu suất), không ẩn dụ tiền / nhà / thuế.
import type { TheGiaiNghia } from './kieu'

/** Cách viết đơn vị trong đề → mã đơn vị. Dài trước ngắn sau. Chữ hoa/thường giữ nguyên (M ≠ m). */
export const CACH_VIET_DON_VI: readonly [string, string][] = [
  ['g/cm³', 'D'], ['g/cm3', 'D'], ['g/mL', 'D'], ['g/ml', 'D'], ['gam/mL', 'D'], ['gam/ml', 'D'],
  ['gam/mol', 'g/mol'], ['g/mol', 'g/mol'], ['kJ/mol', 'kJ'], ['mol/lít', 'M'], ['mol/L', 'M'], ['mol/l', 'M'],
  ['tấn', 'tan'], ['kg', 'kg'], ['mg', 'mg'], ['gam', 'g'], ['g', 'g'],
  ['mL', 'mL'], ['ml', 'mL'], ['lít', 'L'], ['L', 'L'],
  ['dm³', 'L'], ['dm3', 'L'], ['cm³', 'mL'], ['cm3', 'mL'], ['m³', 'm3'], ['m3', 'm3'],
  ['mmol', 'mmol'], ['mol', 'mol'], ['M', 'M'],
  ['%', '%'], ['°C', 'oC'], ['⁰C', 'oC'], ['oC', 'oC'], ['K', 'K'], ['atm', 'atm'], ['bar', 'bar'],
  ['kJ', 'kJ'], ['J', 'J'], ['Ω', 'ohm'], ['A', 'A'],
  ['giây', 's'], ['phút', 'phut'], ['giờ', 'gio'], ['s', 's'], ['h', 'gio'],
]

/** Thẻ đơn vị. `{so}` được thay bằng số đề cho (chỉ đọc lại, không tính). */
type MauThe = { ten: string; doan: string[]; congThuc?: string; nhoDoi?: string }
const MAU: Record<string, MauThe> = {
  g: { ten: 'g · gam (khối lượng)', doan: ['{so} g là khối lượng chất.', 'Muốn ra số mol thì chia khối lượng cho M.'], congThuc: 'n = m : M', nhoDoi: '1 kg = 1000 g' },
  kg: { ten: 'kg · kilôgam (khối lượng)', doan: ['{so} kg là khối lượng chất.', 'Đổi ra gam trước rồi mới chia M để ra số mol.'], congThuc: 'n = m : M (m tính bằng gam)', nhoDoi: '1 kg = 1000 g' },
  tan: { ten: 'tấn (khối lượng)', doan: ['{so} tấn là khối lượng rất lớn, hay gặp trong bài sản xuất.', 'Đổi ra gam (hoặc giữ tấn và nhớ đổi lại ở cuối) rồi mới chia M.'], congThuc: 'n = m : M', nhoDoi: '1 tấn = 1000 kg = 10⁶ g' },
  mg: { ten: 'mg · miligam (khối lượng)', doan: ['{so} mg là khối lượng rất nhỏ.'], congThuc: 'n = m : M (m tính bằng gam)', nhoDoi: '1 g = 1000 mg' },
  mL: { ten: 'mL · mililít (thể tích)', doan: ['{so} mL là thể tích.', 'Đổi ra lít trước khi dùng trong công thức.'], congThuc: 'V (L) = V (mL) : 1000', nhoDoi: '1000 mL = 1 L · 1 mL = 1 cm³' },
  L: { ten: 'L · lít (thể tích)', doan: ['{so} L là thể tích dung dịch hoặc thể tích khí.', 'Dung dịch: số mol chất tan = C_M × V. Chất khí: chia cho thể tích 1 mol khí theo đúng điều kiện đề ghi (đkc hay đktc).'], congThuc: 'n = C_M × V · n khí = V : V_mol', nhoDoi: '1 L = 1 dm³ = 1000 mL' },
  m3: { ten: 'm³ · mét khối (thể tích)', doan: ['{so} m³ là thể tích lớn, hay gặp ở khí trong bài sản xuất.'], congThuc: 'V (L) = V (m³) × 1000', nhoDoi: '1 m³ = 1000 L' },
  mol: { ten: 'mol · số mol', doan: ['Số mol là lượng chất; từ số mol tính ra khối lượng, thể tích, nồng độ.', '{so} mol đề cho sẵn, không cần đổi.'], congThuc: 'm = n × M', nhoDoi: '1 mol = 1000 mmol' },
  mmol: { ten: 'mmol · milimol', doan: ['{so} mmol là số mol nhỏ (một phần nghìn mol).'], congThuc: 'n (mol) = n (mmol) : 1000', nhoDoi: '1 mol = 1000 mmol' },
  M: { ten: 'M · nồng độ mol', doan: ['{so} M đọc là {so} mol trên lít: cứ 1 lít dung dịch có {so} mol chất tan', 'Nhân C_M với thể tích (lít) là ra số mol chất tan.'], congThuc: 'n = C_M × V (V tính bằng lít)', nhoDoi: '1000 mL = 1 L' },
  '%': { ten: '% · phần trăm', doan: ['{so}% nghĩa là {so} phần trong 100 phần.', 'Đọc kỹ: phần trăm của cái gì, so với cái gì?'], congThuc: 'phần = tổng × %/100' },
  '%m': { ten: '% · phần trăm khối lượng', doan: ['Cứ 100 g hỗn hợp có {so} g chất đó.'], congThuc: '%m = m chất : m hỗn hợp × 100%' },
  '%V': { ten: '% · phần trăm thể tích', doan: ['Cứ 100 thể tích hỗn hợp có {so} thể tích chất đó.', 'Với chất khí cùng điều kiện, phần trăm thể tích bằng phần trăm số mol.'], congThuc: '%V = V chất : V hỗn hợp × 100%' },
  '%C': { ten: '% · nồng độ phần trăm (C%)', doan: ['Cứ 100 g dung dịch có {so} g chất tan.'], congThuc: 'C% = m chất tan : m dung dịch × 100%', nhoDoi: 'm chất tan = m dung dịch × C% : 100' },
  '%H': { ten: '% · hiệu suất (H)', doan: ['Hiệu suất {so}%: chỉ {so} phần trong 100 phần thực sự thành sản phẩm.', 'Tính xuôi (nguyên liệu → sản phẩm) × H/100; tính ngược (sản phẩm → nguyên liệu) × 100/H.'], congThuc: 'H = lượng thực tế : lượng lý thuyết × 100%' },
  D: { ten: 'g/mL · khối lượng riêng (D)', doan: ['{so} g/mL nghĩa là 1 mL chất (dung dịch) nặng {so} gam.', 'Dùng để đổi thể tích dung dịch ra khối lượng dung dịch.'], congThuc: 'm = D × V', nhoDoi: '1 mL = 1 cm³' },
  'g/mol': { ten: 'g/mol · khối lượng mol (M)', doan: ['M là khối lượng của 1 mol chất (gam).'], congThuc: 'm = n × M · n = m : M' },
  dkc: { ten: 'đkc · điều kiện chuẩn', doan: ['Điều kiện chuẩn: 25 °C và 1 bar.', 'Ở đkc, 1 mol khí bất kì chiếm 24,79 lít.'], congThuc: 'V = n × 24,79 · n = V : 24,79', nhoDoi: '24,79 L/mol (đkc)' },
  dktc: { ten: 'đktc · điều kiện tiêu chuẩn', doan: ['Cách ghi của chương trình cũ: 0 °C và 1 atm.', 'Ở đktc, 1 mol khí bất kì chiếm 22,4 lít.'], congThuc: 'V = n × 22,4 · n = V : 22,4', nhoDoi: '22,4 L/mol (đktc)' },
  oC: { ten: '°C · độ C (nhiệt độ)', doan: ['{so} °C là nhiệt độ.'], nhoDoi: 'T (K) = t (°C) + 273' },
  K: { ten: 'K · kelvin (nhiệt độ)', doan: ['{so} K là nhiệt độ tuyệt đối.'], nhoDoi: 'T (K) = t (°C) + 273' },
  atm: { ten: 'atm · atmôtphe (áp suất)', doan: ['{so} atm là áp suất khí.'], nhoDoi: '1 atm ≈ 1,013 bar' },
  bar: { ten: 'bar (áp suất)', doan: ['{so} bar là áp suất khí. Điều kiện chuẩn dùng 1 bar.'], nhoDoi: '1 bar = 10⁵ Pa' },
  kJ: { ten: 'kJ · kilôjun (nhiệt lượng)', doan: ['Năng lượng, nhiệt của phản ứng (biến thiên enthalpy ΔrH).', 'ΔrH < 0: phản ứng toả nhiệt; ΔrH > 0: phản ứng thu nhiệt.'], nhoDoi: '1 kJ = 1000 J' },
  J: { ten: 'J · jun (năng lượng)', doan: ['{so} J là năng lượng (nhiệt lượng).'], nhoDoi: '1 kJ = 1000 J' },
  ohm: { ten: 'Ω · ohm (điện trở)', doan: ['{so} Ω là điện trở.'], congThuc: 'U = I × R' },
  A: { ten: 'A · ampe (cường độ dòng điện)', doan: ['{so} A là cường độ dòng điện khi điện phân.', 'Điện lượng cho biết số mol electron đi qua.'], congThuc: 'n e = I × t : F (t tính bằng giây, F = 96485)' },
  s: { ten: 's · giây (thời gian)', doan: ['{so} giây là thời gian điện phân.'], congThuc: 'n e = I × t : F (t tính bằng giây)', nhoDoi: '1 giờ = 3600 giây' },
  phut: { ten: 'phút (thời gian)', doan: ['{so} phút là thời gian; đổi ra giây khi dùng công thức điện phân.'], nhoDoi: '1 phút = 60 giây' },
  gio: { ten: 'giờ (thời gian)', doan: ['{so} giờ là thời gian; đổi ra giây khi dùng công thức điện phân.'], nhoDoi: '1 giờ = 3600 giây' },
}

/** Mã đơn vị có thẻ. */
export const MA_DON_VI: readonly string[] = Object.keys(MAU)

/** Lấy phần số trong chữ chạm: «1,5 M» ⇒ «1,5»; «2,5.10^-3 mol» ⇒ «2,5.10^-3». */
export function soTrongChu(chu: string): string {
  const m = /^\s*([\d.,]+(?:\s*[×x.·*]\s*10\s*(?:\^\s*\(?[-−–+]?\s*\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|\^\s*\(?[-−]?\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)/.exec(chu)
  return m ? m[1].trim() : ''
}

/** Thẻ giải nghĩa cho một đơn vị. `chu` là chữ chạm trong đề (để đọc lại số). Không có mã ⇒ null. */
export function theDonVi(ma: string, chu = ''): TheGiaiNghia | null {
  const mau = MAU[ma]
  if (!mau) return null
  const so = soTrongChu(chu)
  const dien = (s: string) => (so ? s.replaceAll('{so}', so) : s.replace(/\{so\}\s*/g, ''))
  const the: TheGiaiNghia = { ten: mau.ten, nhan: 'Đơn vị', doan: mau.doan.map(dien).filter((d) => d.trim()) }
  if (mau.congThuc) the.congThuc = mau.congThuc
  if (mau.nhoDoi) the.nhoDoi = mau.nhoDoi
  return the
}
