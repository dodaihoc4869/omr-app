// Thẻ giải nghĩa khi chạm một vùng của «Chạm để hiểu đề» (thầy chốt build 26/10). Hàm thuần, từ điển trên máy.
// Không bao giờ đọc đáp án / lời giải; không tính hộ số của đề (chỉ đọc lại số đề cho, và M do máy tính từ công thức).
// THẦY 27/10 («Soát kĩ quá vô nghĩa», trước đó «giải thích ngu»): thẻ nào không cho em thêm kiến thức CỤ THỂ so với chính câu đề thì BỎ
// (trả null ⇒ chữ không tô, không chạm được). Không còn lời khuyên chung «đọc kĩ», «tự hỏi có đúng ý đề không», «gạch phương án», «đó là điều đề hỏi».
// Thẻ hiện kiểu Duolingo: dòng đầu đậm = `ten`, dưới là `doan` (1–2 dòng).
import type { TheGiaiNghia, VungCham } from './kieu'
import { cachTinhM, chuanCongThuc, dangDep, soViet, tachDienTich, tinhM, traCongThuc, traTen, type BangNtk, type Chat } from './tu-dien-chat'
import { theDonVi } from './tu-dien-don-vi'
import { theThenChot } from './tu-then-chot'

/** Thẻ có thêm vài trường cho giao diện (vẫn gán được vào `TheGiaiNghia`). */
export type TheGiaiNghiaDu = TheGiaiNghia & {
  loai?: string // nhãn loại chất: «Base mạnh», «Ester»…
  cachTinhM?: string // «Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)»
  congThucChat?: string // công thức đẹp (chỉ số dưới Unicode)
  tenIupac?: string // tên IUPAC theo SGK 2018
  ungVien?: string[] // công thức ứng với nhiều chất (C6H12O6: glucose, fructose)
}

/** «natri hiđroxit (xút ăn da)»: bỏ tên ngắn đã nằm trong tên dài hơn («xút» trong «xút ăn da»). */
function noiTenCu(vao: string[]): string | undefined {
  const ds = vao.filter((t, i) => !vao.some((u, j) => j !== i && u.startsWith(t + ' ')))
  return ds.length ? ds[0] + (ds.length > 1 ? ` (${ds.slice(1).join(', ')})` : '') : undefined
}

function dongM(ct: string, ntk?: BangNtk): { M?: number; cach?: string } {
  const M = tinhM(ct, ntk)
  const cach = cachTinhM(ct, ntk)
  return M === null ? {} : { M, cach: cach ?? undefined }
}

/** Dòng «M = … g/mol» (polymer: M một mắt xích); ghi M + cách tính vào thẻ. */
function dongM2(ct: string, ntk: BangNtk | undefined, the: TheGiaiNghiaDu): string | null {
  const { M, cach } = dongM(ct, ntk)
  if (M === undefined) return null
  the.M = M
  if (cach) the.cachTinhM = cach
  return `${/\)n$/.test(chuanCongThuc(ct)) ? 'M một mắt xích' : 'M'} = ${soViet(M)} g/mol`
}

/**
 * Thẻ của MỘT chất (mở từ tên hoặc từ công thức). Thầy 27/10: «Hiện tên, công thức, M thôi, bỏ tính chất» + «Bỏ cái dòng tên cũ anilin đi»
 * ⇒ đúng 3 dòng: tên theo chương trình GDPT 2018 · công thức · M. Không loại, bậc, tính chất, tên cũ (từ điển vẫn nhận tên cũ để DÒ chất trong đề).
 */
function theChat(c: Chat, ntk: BangNtk | undefined, nhan: TheGiaiNghia['nhan']): TheGiaiNghiaDu {
  const the: TheGiaiNghiaDu = { ten: c.ten, nhan, doan: [], loai: c.loai, tenIupac: c.ten }
  const cu = noiTenCu(c.tenCu.filter((t) => t.toLowerCase() !== c.ten.toLowerCase()))
  if (cu) the.tenCu = cu // chỉ là dữ liệu, KHÔNG hiện
  if (!c.congThuc) { the.doan.push('Mạch rất dài, không có công thức ngắn'); return the }
  the.congThucChat = dangDep(c.congThuc)
  the.doan.push(the.congThucChat)
  const m = dongM2(c.congThuc, ntk, the)
  if (m) the.doan.push(m)
  return the
}

/** Thẻ khi chạm CÔNG THỨC (NaOH, SO₄²⁻, C₆H₁₂O₆…). */
function theTheoCongThuc(khoa: string, ntk: BangNtk | undefined): TheGiaiNghiaDu | null {
  const k = chuanCongThuc(khoa)
  const ds = traCongThuc(k)
  if (ds.length === 1) return theChat(ds[0], ntk, 'Công thức')
  const { goc, dienTich } = tachDienTich(k)
  const dep = dangDep(dienTich ? `${goc} ${dienTich}` : goc)
  const the: TheGiaiNghiaDu = { ten: dep, nhan: 'Công thức', doan: [], congThucChat: dep }
  if (ds.length > 1) {
    the.ungVien = ds.map((c) => c.ten)
    if (ds.every((c) => c.loai === ds[0].loai)) the.loai = ds[0].loai
    the.doan.push(`Có thể là ${the.ungVien.join(' hoặc ')}`)
  }
  const m = dongM2(k, ntk, the)
  if (m) the.doan.push(m)
  return the.doan.length ? the : null
}

// ───────────── Đề hỏi ─────────────
const STOP_CUM = new Set(['tác', 'phản', 'vào', 'với', 'thu', 'cần', 'bằng', 'trong', 'ở', 'khi', 'và', 'thì', 'có', 'là', 'sau', 'để', 'cho', 'gồm', 'chứa', 'được', 'đã', 'của', 'từ', 'ra', 'tạo'])
const DV_BIEN = '(gam|g|kg|tấn|lít|L|mL|ml|mol|M|%)'

/** Biến của đề («m», «V», «a») gắn với số liệu nào: «thu được m gam chất rắn khan» ⇒ {dv: 'gam', cum: 'chất rắn khan'}. */
function ganBien(bien: string, chuDe: string): { dv: string; cum: string } | null {
  const re = new RegExp(`${bien}\\s+${DV_BIEN}(?![\\p{L}\\p{N}])([^,.;:?!()\\n]*)`, 'gu')
  for (const m of chuDe.matchAll(re)) {
    if (m.index! > 0 && /[\p{L}\p{N}]/u.test(chuDe[m.index! - 1])) continue
    const cum: string[] = []
    for (const w of m[2].trim().split(/\s+/).filter(Boolean)) { if (STOP_CUM.has(w.toLowerCase()) || cum.length >= 5) break; cum.push(w) }
    return { dv: m[1], cum: cum.join(' ') }
  }
  return null
}

/** Dòng thể tích theo ngữ cảnh: khí (đkc / đktc đề ghi) hay dung dịch. Không rõ ⇒ null (không đoán 24,79 hay 22,4). */
function dongTheTich(ngu: string, chuDe: string): string | null {
  const lc = ngu.toLowerCase(), de = chuDe.toLowerCase()
  if (/dung dịch/.test(lc)) return 'Dung dịch: V = n : C_M (V tính bằng lít)'
  if (/đktc|điều kiện tiêu chuẩn/.test(de)) return 'Khí ở đktc: V = n × 22,4'
  if (/đkc|điều kiện chuẩn/.test(de)) return 'Khí ở đkc: V = n × 24,79'
  return null
}

/** Thẻ «giá trị của m / V / a»: biến là gì, gắn với chất nào, công thức ra nó. Biến lạ, không gắn được với số liệu nào ⇒ null. */
function theBien(bien: string, chuDe: string): TheGiaiNghiaDu | null {
  const g = ganBien(bien, chuDe)
  const dv = g?.dv ?? (bien === 'm' ? 'gam' : bien === 'V' ? 'lít' : '')
  const cum = g?.cum ? ` ${g.cum}` : ''
  const dvChu = dv === 'g' ? 'gam' : dv === 'L' ? 'lít' : dv === 'ml' ? 'mL' : dv
  let dai: string, dong: string | null
  if (/^(gam|g|kg|tấn)$/.test(dv)) { dai = 'khối lượng'; dong = dv === 'kg' ? 'Tính bằng kg: m (gam) = n × M, rồi chia 1000' : dv === 'tấn' ? 'Tính bằng tấn: 1 tấn = 10⁶ g' : 'Tính bằng gam: m = n × M' }
  else if (/^(lít|L|mL|ml)$/.test(dv)) { dai = 'thể tích'; const t = dongTheTich(cum, chuDe); dong = t && /^ml$/i.test(dv) ? `${t} · 1 L = 1000 mL` : t }
  else if (dv === 'mol') { dai = 'số mol'; dong = 'n = m : M' }
  else if (dv === 'M') { dai = 'nồng độ mol'; dong = 'C_M = n : V (V tính bằng lít)' }
  else if (dv === '%') { dai = 'phần trăm'; dong = null }
  else return null
  if (!g && !dong) return null
  return { ten: `${bien}: ${dai}${cum}${g ? '' : ` (${dvChu})`}`, nhan: 'Đề hỏi', doan: dong ? [dong] : [`Tính bằng ${dvChu}`] }
}

// Đại lượng đề yêu cầu tính ⇒ công thức ra nó (dài trước ngắn sau: «phần trăm khối lượng» trước «khối lượng»).
const DAI_LUONG: [RegExp, string, (ngu: string, chuDe: string) => string | null][] = [
  [/phần trăm khối lượng/, 'phần trăm khối lượng', () => '%m = m chất : m hỗn hợp × 100%'],
  [/phần trăm thể tích/, 'phần trăm thể tích', () => '%V = V chất : V hỗn hợp × 100%'],
  [/phần trăm số mol/, 'phần trăm số mol', () => '%n = n chất : n hỗn hợp × 100%'],
  [/nồng độ phần trăm|c%/, 'nồng độ phần trăm', () => 'C% = m chất tan : m dung dịch × 100%'],
  [/nồng độ mol/, 'nồng độ mol', () => 'C_M = n : V (V tính bằng lít)'],
  [/nồng độ/, 'nồng độ', () => 'C_M = n : V (lít) · C% = m chất tan : m dung dịch × 100%'],
  [/khối lượng/, 'khối lượng', () => 'm = n × M'],
  [/thể tích/, 'thể tích', dongTheTich],
  [/số mol/, 'số mol', () => 'n = m : M'],
  [/hiệu suất/, 'hiệu suất', () => 'H = lượng phản ứng : lượng ban đầu × 100%' /* thầy 27/10 */],
  [/tỉ khối/, 'tỉ khối', () => 'd A/B = M_A : M_B'],
]

/** Thẻ «đếm»: chỉ khi biết đếm cái gì. */
function theDem(thuong: string): TheGiaiNghiaDu | null {
  const dung = /\sđúng/.test(thuong) ? ' đúng' : ''
  if (/^số (phát biểu|ý|nhận định|mệnh đề)/.test(thuong)) return { ten: `Đếm số phát biểu${dung}`, nhan: 'Đề hỏi', doan: ['Đáp án là một con số, không phải một phát biểu.', 'Đánh dấu Đ/S cạnh từng ý rồi mới đếm: nhẩm dễ sót.'] }
  if (/^số đồng phân/.test(thuong)) return { ten: 'Đếm số đồng phân', nhan: 'Đề hỏi', doan: ['Kể lần lượt theo mạch carbon và vị trí nhóm chức; bỏ cấu tạo trùng nhau.'] }
  if (/^số (thí nghiệm|trường hợp|phản ứng)/.test(thuong)) return { ten: 'Đếm số thí nghiệm thoả yêu cầu', nhan: 'Đề hỏi', doan: ['Đáp án là một con số.', 'Đánh dấu từng thí nghiệm thoả rồi mới đếm: nhẩm dễ sót.'] }
  if (/^số (chất|hợp chất|dung dịch|kim loại|ion|polymer|tơ|ester|amine)/.test(thuong)) return { ten: 'Đếm số chất thoả yêu cầu', nhan: 'Đề hỏi', doan: ['Đáp án là một con số.', 'Đánh dấu từng chất thoả rồi mới đếm: nhẩm dễ sót.'] }
  return null
}

/** Thẻ khi chạm vùng ĐỀ HỎI. Chỉ còn: bẫy phủ định · biến cần tìm · đại lượng cần tính (công thức) · đếm. «Chất nào sau đây», «… là» ⇒ null. */
function theDeHoi(v: VungCham, chuDe: string): TheGiaiNghiaDu | null {
  const chu = v.chu.trim()
  const thuong = chu.toLowerCase()
  const khongPhai = thuong.includes('không phải')
  if (v.khoa === 'phu-dinh') {
    return khongPhai
      ? { ten: 'Tìm phương án KHÔNG phải', nhan: 'Đề hỏi', doan: ['Ba phương án còn lại đều đúng ý đề.', 'Bẫy: đọc nhanh, chọn luôn phương án đúng đầu tiên.'] }
      : { ten: 'Chọn phương án SAI', nhan: 'Đề hỏi', doan: ['Ba phương án còn lại đều đúng.', 'Bẫy: đọc nhanh, chọn luôn phương án đúng đầu tiên.'] }
  }
  if (v.khoa === 'phu-dinh-dem') {
    return khongPhai
      ? { ten: 'Đếm cái KHÔNG phải', nhan: 'Đề hỏi', doan: ['Bẫy: đếm nhầm sang những cái đúng.'] }
      : { ten: 'Đếm số ý SAI', nhan: 'Đề hỏi', doan: ['Bẫy: đếm nhầm sang số ý đúng.'] }
  }
  if (v.khoa === 'phu-dinh-chung') return { ten: 'Đề hỏi điều SAI', nhan: 'Đề hỏi', doan: ['Bẫy: đọc nhanh, bỏ sót chữ «không», «sai».'] }
  if (v.khoa === 'nao-sau-day') return null
  if (v.khoa === 'gia-tri') {
    const bien = /giá trị\s+(?:gần nhất\s+)?(?:của\s+)?([a-zA-Z])(?![\p{L}\p{N}])/iu.exec(chu)?.[1]
    return bien ? theBien(bien, chuDe) : null
  }
  if (/^số\s/u.test(thuong) && !/^số (mol|gam)/u.test(thuong)) return theDem(thuong)
  for (const [re, ten, cong] of DAI_LUONG) {
    if (!re.test(thuong)) continue
    const i = chuDe.indexOf(chu)
    const ngu = i >= 0 ? chuDe.slice(i, i + chu.length + 40) : chu
    const dong = cong(ngu, chuDe)
    return dong ? { ten: `Cần tính: ${ten}`, nhan: 'Đề hỏi', doan: [dong] } : null
  }
  return null
}

/**
 * Thẻ giải nghĩa cho một vùng chạm. Không có thẻ có giá trị ⇒ null (giao diện không tô, không mở thẻ).
 * `ntk`: nguyên tử khối đề cho (từ `docNguyenTuKhoiTrongDe(chuDe).bang`), có thì M tính theo số của đề.
 * `chuDe`: cả chữ đề — biến «m» gắn với chất nào, khí đo ở đkc hay đktc.
 */
export function theCho(vung: VungCham, ntk?: BangNtk, chuDe = ''): TheGiaiNghiaDu | null {
  switch (vung.loai) {
    case 'cho': return vung.khoa ? theDonVi(vung.khoa, vung.chu, chuDe) : null
    case 'khoa': return vung.khoa ? theThenChot(vung.khoa, vung.chu) : null
    case 'hoi': return theDeHoi(vung, chuDe)
    case 'chat': {
      const theoTen = traTen(vung.chu)
      if (theoTen) return theChat(theoTen, ntk, 'Chất')
      return theTheoCongThuc(vung.khoa ?? vung.chu, ntk)
    }
  }
}
