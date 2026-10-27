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

/** Thẻ đơn vị. `doan` = đúng các dòng hiện trên thẻ (tối đa 2, có công thức đổi). `{so}` = số đề cho (chỉ đọc lại, không tính).
 *  `{khi}` = dòng thể tích mol theo điều kiện ĐỀ GHI (đkc 24,79 · đktc 22,4); đề không ghi ⇒ dòng `khiKhong`. */
type MauThe = { ten: string; doan: string[]; khiKhong?: string; congThuc?: string; nhoDoi?: string }
// Thầy 27/10 («Soát kĩ quá vô nghĩa»): bỏ câu chỉ nhắc lại đề («{so} g là khối lượng chất»), bỏ lời khuyên chung («Đọc kỹ…»);
// «%» không rõ phần trăm của gì ⇒ không có thẻ.
const MAU: Record<string, MauThe> = {
  g: { ten: 'g · gam (khối lượng)', doan: ['Ra số mol: n = m : M'], congThuc: 'n = m : M', nhoDoi: '1 kg = 1000 g' },
  kg: { ten: 'kg · kilôgam (khối lượng)', doan: ['Đổi ra gam rồi chia M: n = m : M', '1 kg = 1000 g'], congThuc: 'n = m : M (m tính bằng gam)', nhoDoi: '1 kg = 1000 g' },
  tan: { ten: 'tấn (khối lượng)', doan: ['Đổi ra gam rồi chia M (hoặc giữ tấn, cuối bài đổi lại)', '1 tấn = 1000 kg = 10⁶ g'], congThuc: 'n = m : M', nhoDoi: '1 tấn = 1000 kg = 10⁶ g' },
  mg: { ten: 'mg · miligam (khối lượng)', doan: ['n = m : M (m tính bằng gam)', '1 g = 1000 mg'], congThuc: 'n = m : M (m tính bằng gam)', nhoDoi: '1 g = 1000 mg' },
  mL: { ten: 'mL · mililít (thể tích)', doan: ['Đổi ra lít trước khi tính: chia cho 1000', '1 mL = 1 cm³'], congThuc: 'V (L) = V (mL) : 1000', nhoDoi: '1000 mL = 1 L · 1 mL = 1 cm³' },
  L: { ten: 'L · lít (thể tích)', doan: ['{dd}', '{khi}'], khiKhong: '1 L = 1 dm³ = 1000 mL', congThuc: 'n = C_M × V', nhoDoi: '1 L = 1 dm³ = 1000 mL' },
  m3: { ten: 'm³ · mét khối (thể tích)', doan: ['1 m³ = 1000 L'], congThuc: 'V (L) = V (m³) × 1000', nhoDoi: '1 m³ = 1000 L' },
  mol: { ten: 'mol · số mol', doan: ['m = n × M', '{khiV}'], khiKhong: 'Dung dịch: n = C_M × V', congThuc: 'm = n × M', nhoDoi: '1 mol = 1000 mmol' },
  mmol: { ten: 'mmol · milimol', doan: ['1 mol = 1000 mmol'], congThuc: 'n (mol) = n (mmol) : 1000', nhoDoi: '1 mol = 1000 mmol' },
  M: { ten: 'M · nồng độ mol', doan: ['{so} M: cứ 1 lít dung dịch có {so} mol chất tan', 'n = C_M × V (V: lít; 1000 mL = 1 L)'], congThuc: 'n = C_M × V (V tính bằng lít)', nhoDoi: '1000 mL = 1 L' },
  '%m': { ten: '% · phần trăm khối lượng', doan: ['Cứ 100 g hỗn hợp có {so} g chất đó', '%m = m chất : m hỗn hợp × 100%'], congThuc: '%m = m chất : m hỗn hợp × 100%' },
  '%V': { ten: '% · phần trăm thể tích', doan: ['Chất khí cùng điều kiện: %V = %n (phần trăm số mol)', '%V = V chất : V hỗn hợp × 100%'], congThuc: '%V = V chất : V hỗn hợp × 100%' },
  '%C': { ten: '% · nồng độ phần trăm (C%)', doan: ['Cứ 100 g dung dịch có {so} g chất tan', 'm chất tan = m dung dịch × C% : 100'], congThuc: 'C% = m chất tan : m dung dịch × 100%', nhoDoi: 'm chất tan = m dung dịch × C% : 100' },
  '%H': { ten: '% · hiệu suất (H)', doan: ['Chỉ {so}% lượng lý thuyết thành sản phẩm', 'Tính xuôi (nguyên liệu → sản phẩm) × H/100; tính ngược × 100/H'], congThuc: 'H = lượng thực tế : lượng lý thuyết × 100%' },
  D: { ten: 'g/mL · khối lượng riêng (D)', doan: ['1 mL dung dịch nặng {so} g', 'm dung dịch = D × V · 1 mL = 1 cm³'], congThuc: 'm = D × V', nhoDoi: '1 mL = 1 cm³' },
  'g/mol': { ten: 'g/mol · khối lượng mol (M)', doan: ['Khối lượng của 1 mol chất, tính bằng gam', 'm = n × M · n = m : M'], congThuc: 'm = n × M · n = m : M' },
  dkc: { ten: 'đkc · điều kiện chuẩn', doan: ['25 °C, 1 bar: 1 mol khí bất kì chiếm 24,79 L', 'V = n × 24,79 · n = V : 24,79'], congThuc: 'V = n × 24,79 · n = V : 24,79', nhoDoi: '24,79 L/mol (đkc)' },
  dktc: { ten: 'đktc · điều kiện tiêu chuẩn', doan: ['Cách ghi cũ: 0 °C, 1 atm; 1 mol khí chiếm 22,4 L', 'V = n × 22,4 · n = V : 22,4'], congThuc: 'V = n × 22,4 · n = V : 22,4', nhoDoi: '22,4 L/mol (đktc)' },
  oC: { ten: '°C · độ C (nhiệt độ)', doan: ['T (K) = t (°C) + 273'], nhoDoi: 'T (K) = t (°C) + 273' },
  K: { ten: 'K · kelvin (nhiệt độ)', doan: ['T (K) = t (°C) + 273'], nhoDoi: 'T (K) = t (°C) + 273' },
  atm: { ten: 'atm · atmôtphe (áp suất)', doan: ['1 atm ≈ 1,013 bar'], nhoDoi: '1 atm ≈ 1,013 bar' },
  bar: { ten: 'bar (áp suất)', doan: ['Điều kiện chuẩn dùng áp suất 1 bar', '1 bar = 10⁵ Pa'], nhoDoi: '1 bar = 10⁵ Pa' },
  kJ: { ten: 'kJ · kilôjun (nhiệt lượng)', doan: ['Nhiệt của phản ứng (biến thiên enthalpy ΔrH)', 'ΔrH < 0: toả nhiệt · ΔrH > 0: thu nhiệt'], nhoDoi: '1 kJ = 1000 J' },
  J: { ten: 'J · jun (năng lượng)', doan: ['1 kJ = 1000 J'], nhoDoi: '1 kJ = 1000 J' },
  ohm: { ten: 'Ω · ohm (điện trở)', doan: ['U = I × R'], congThuc: 'U = I × R' },
  A: { ten: 'A · ampe (cường độ dòng điện)', doan: ['Số mol electron trao đổi khi điện phân:', 'n e = I × t : F (t tính bằng giây, F = 96485)'], congThuc: 'n e = I × t : F (t tính bằng giây, F = 96485)' },
  s: { ten: 's · giây (thời gian)', doan: ['n e = I × t : F (t tính bằng giây)', '1 giờ = 3600 giây'], congThuc: 'n e = I × t : F (t tính bằng giây)', nhoDoi: '1 giờ = 3600 giây' },
  phut: { ten: 'phút (thời gian)', doan: ['Đổi ra giây khi dùng n e = I × t : F', '1 phút = 60 giây'], nhoDoi: '1 phút = 60 giây' },
  gio: { ten: 'giờ (thời gian)', doan: ['Đổi ra giây khi dùng n e = I × t : F', '1 giờ = 3600 giây'], nhoDoi: '1 giờ = 3600 giây' },
}

/** Điều kiện đo khí chính đề ghi; đề không ghi ⇒ null (không đoán 24,79 hay 22,4). */
function dieuKien(chuDe: string): 'dkc' | 'dktc' | null {
  const lc = chuDe.toLowerCase()
  return /đktc|điều kiện tiêu chuẩn/.test(lc) ? 'dktc' : /đkc|điều kiện chuẩn/.test(lc) ? 'dkc' : null
}
const VMOL = { dkc: ['đkc', '24,79'], dktc: ['đktc', '22,4'] } as const

/** Mã đơn vị có thẻ. */
export const MA_DON_VI: readonly string[] = Object.keys(MAU)

/** Lấy phần số trong chữ chạm: «1,5 M» ⇒ «1,5»; «2,5.10^-3 mol» ⇒ «2,5.10^-3». */
export function soTrongChu(chu: string): string {
  const m = /^\s*([\d.,]+(?:\s*[×x.·*]\s*10\s*(?:\^\s*\(?[-−–+]?\s*\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|\^\s*\(?[-−]?\d+\)?|[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)/.exec(chu)
  return m ? m[1].trim() : ''
}

/** Thẻ giải nghĩa cho một đơn vị. `chu` là chữ chạm trong đề (để đọc lại số), `chuDe` = cả đề (điều kiện đo khí, «lít dung dịch» hay «lít khí»).
 *  Không có mã ⇒ null. */
export function theDonVi(ma: string, chu = '', chuDe = ''): TheGiaiNghia | null {
  const mau = MAU[ma]
  if (!mau) return null
  const so = soTrongChu(chu)
  const dk = dieuKien(chuDe)
  const i = chu ? chuDe.indexOf(chu) : -1
  const sau = i >= 0 ? chuDe.slice(i + chu.length, i + chu.length + 30).toLowerCase() : ''
  const laDd = /^\s*dung dịch/.test(sau), laKhi = !laDd && (/^\s*(khí|hơi)/.test(sau) || /^\s*[a-z0-9()]+\s*\(đk/.test(sau))
  const khi = dk ? `Khí ở ${VMOL[dk][0]}: n = V : ${VMOL[dk][1]}` : mau.khiKhong ?? ''
  const khiV = dk ? `Khí ở ${VMOL[dk][0]}: V = n × ${VMOL[dk][1]}` : mau.khiKhong ?? ''
  const dd = laKhi ? '' : 'Dung dịch: n = C_M × V'
  const dien = (s: string) => (so ? s.replaceAll('{so}', so) : s.replace(/\{so\}\s*/g, ''))
    .replace('{khi}', laDd ? '1 L = 1 dm³ = 1000 mL' : khi).replace('{khiV}', khiV).replace('{dd}', dd)
  const the: TheGiaiNghia = { ten: mau.ten, nhan: 'Đơn vị', doan: mau.doan.map(dien).filter((d) => d.trim()) }
  if (mau.congThuc) the.congThuc = mau.congThuc
  if (mau.nhoDoi) the.nhoDoi = mau.nhoDoi
  return the
}
