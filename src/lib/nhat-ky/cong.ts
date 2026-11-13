// NHẬT KÝ BÀI DẠY — CỔNG TỰ KIỂM (thầy 13/11: «Tôi ko chốt html gì cả. Máy tự làm hết» · «nhật kí sau khi live xong gửi cho văn phòng soạn»).
// Văn phòng soạn kịch bản (lược đồ ./luoc-do.json) rồi gửi về `/gv/live-nhat-ky-ghi`; KHÔNG có người duyệt ⇒ cổng này là chốt chặn duy nhất. Máy chủ chạy
// cổng lúc nhận, máy em chạy lại đúng cổng này lúc hiện (một mô-đun, hai nơi không lệch nhau). Bản gốc: docs/ban-ve-nhat-ky-bai-day-1311/khuon.js (kiemCong,
// quaCong) — test khoá hai bản cho cùng kết quả trên kịch bản mẫu và kịch bản đã sửa hỏng.
// Luật: (a) số liệu tính lại bằng BẢNG CỦA MÁY (độ âm điện, electron lớp ngoài, nguyên tử khối) — kịch bản không được mang số riêng; (b) mọi số / công thức
// trên cảnh phải có trên bảng (`nguon.chep`) hoặc trong lời Thầy; (c) luật chữ (không emoji, câu ≤ 30 chữ, không ẩn dụ tiền / nhà); (d) cảnh hỏng bị BỎ, đủ
// cảnh đạt mới phát hành. Thuần, không DOM.
/* eslint-disable @typescript-eslint/no-explicit-any */
type O = any

// ── Bảng số cố định của app (Hoá 10, chương trình 2018). ──
export const CHI: Record<string, number> = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Cl: 3.16, K: 0.82 } // độ âm điện Pauling
export const E_NGOAI: Record<string, number> = { H: 1, C: 4, N: 5, O: 6, F: 7, Na: 1, Cl: 7, K: 1, S: 6 } // electron lớp ngoài cùng
export const KHOI: Record<string, number> = { H: 1, C: 12, N: 14, O: 16, Na: 23, S: 32, Cl: 35.5, K: 39, Fe: 56 } // nguyên tử khối
export const TEN_LOAI: Record<string, string> = { 'khong-phan-cuc': 'Cộng hoá trị không phân cực', 'phan-cuc': 'Cộng hoá trị phân cực', ion: 'Liên kết ion', 'cong-hoa-tri': 'Liên kết cộng hoá trị' }
export const KHUON = ['keo-co', 'thang-delta', 'lewis', 'quy-tac', 'vi-du-cot-doc', 'doan-nhanh', 'tong-ket'] as const
/** Phát hành khi có ít nhất `itNhat` cảnh đạt và tỉ lệ cảnh đạt ≥ `tiLe`. */
export const CONG = { itNhat: 4, tiLe: 0.6 } as const

const soVi = (x: number, k?: number): string => (k == null ? String(x) : x.toFixed(k)).replace('.', ',')
const soChi = (x: number): string => soVi(x, 2)
const soDelta = (x: number): string => (Math.abs(x) < 1e-9 ? '0' : soVi(x, 2))
const soGon = (x: number): string => String(+x.toFixed(2)).replace('.', ',')
const DUOI = '₀₁₂₃₄₅₆₇₈₉', TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const boDuoi = (t: unknown): string => String(t).replace(/[₀-₉]/g, (c) => String(DUOI.indexOf(c)))
export const boDam = (t: unknown): string => String(t).replace(/\*\*/g, '')
/** «FeS₂» ⇒ { Fe: 1, S: 2 } */
export function phanTichCT(ct: unknown): Record<string, number> {
  const ra: Record<string, number> = {}, t = boDuoi(ct).replace(/^\d+/, '')
  for (const m of t.matchAll(/([A-Z][a-z]?)(\d*)/g)) ra[m[1]!] = (ra[m[1]!] || 0) + (m[2] ? +m[2] : 1)
  return ra
}
export function khoiMol(ct: unknown): number | null { const p = phanTichCT(ct); let m = 0; for (const k in p) { if (KHOI[k] == null) return null; m += KHOI[k]! * p[k]! } return m }
/** «10⁶», «8/100», «2,55», «76,8» ⇒ số */
export function docSo(t0: unknown): number {
  const t = String(t0).trim()
  let m = t.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/)
  if (m) return Math.pow(+m[1]!, +[...m[2]!].map((c) => TREN.indexOf(c)).join(''))
  m = t.match(/^(\d+(?:,\d+)?)\s*\/\s*(\d+(?:,\d+)?)$/)
  if (m) return +m[1]!.replace(',', '.') / +m[2]!.replace(',', '.')
  m = t.match(/^-?\d+(?:,\d+)?$/)
  return m ? +t.replace(',', '.') : NaN
}

const VIET_TAT: [RegExp, string][] = [[/\bVD\s?(\d)/g, 'Ví dụ $1'], [/\bVD\b/g, 'Ví dụ'], [/\bLK\b/g, 'liên kết'], [/\bCHT\b/g, 'cộng hoá trị'], [/\b(KPC|kpc)\b/g, 'không phân cực'], [/\bPC\b/g, 'phân cực'], [/\bntố\b/g, 'nguyên tố'], [/\bko\b/g, 'không'], [/\bQT\s?[₀-₉\d]*/g, 'Quy tắc'], [/\s*—\s*/g, ', ']]
/** Chữ do máy sinh: tự sửa viết tắt của bảng và dấu gạch ngang dài (không bỏ cảnh vì lỗi chữ sửa được). */
export const sachChu = (t: unknown): string => VIET_TAT.reduce((x, [a, b]) => x.replace(a, b), String(t))
export function kiemChu(t: unknown): string[] {
  const loi: string[] = [], x = boDam(t)
  if (/\p{Extended_Pictographic}/u.test(x)) loi.push('có emoji')
  for (const cau of x.split(/(?<=[.!?])\s+/)) { const n = cau.trim().split(/\s+/).filter(Boolean).length; if (n > 30) loi.push(`câu ${n} chữ (quá 30)`) }
  const tok = x.toLowerCase().split(/[^\p{L}\p{N}₀-₉]+/u)
  for (const w of ['tiền', 'nhà', 'giàu', 'thuế']) if (tok.includes(w)) loi.push(`có chữ «${w}»`)
  for (const k of KHUON) if (x.includes(k)) loi.push(`lộ mã khuôn «${k}»`)
  return loi
}
export interface Nguong { kpc: number; ion: number; lonHon: boolean; nguon: { kpc: string; ion: string }; moTa: string; vung: O[] }
/** Ngưỡng Δχ máy tự dùng: bảng hoặc lời Thầy có ghi thì theo Thầy, không thì theo SGK Hoá 10 (2018). */
export function nguongTuDong(kb: O): Nguong {
  let kpc = 0.4, nKpc = 'sgk', ion = 1.7, lonHon = false, nIon = 'sgk'
  const chu = kb ? (kb.canh as O[]).flatMap((c) => [(c.nguon || {}).chep || ''].concat((c.loi || []).map((l: O) => l.chu))).join(' \n ') : ''
  let m = chu.match(/Δχ\s*(>|≥|>=)\s*(\d+(?:,\d+)?)/)
  if (m) { ion = +m[2]!.replace(',', '.'); lonHon = m[1] === '>'; nIon = 'bang' }
  m = chu.match(/Δχ\s*<\s*(0,\d+)/)
  if (m) { kpc = +m[1]!.replace(',', '.'); nKpc = 'bang' }
  return {
    kpc, ion, lonHon, nguon: { kpc: nKpc, ion: nIon },
    moTa: `Không phân cực khi Δχ < ${soGon(kpc)} (${nKpc === 'bang' ? 'theo Thầy' : 'theo SGK'}); liên kết ion khi Δχ ${lonHon ? '>' : '≥'} ${soGon(ion)} (${nIon === 'bang' ? 'theo bảng Thầy' : 'theo SGK'})`,
    vung: [{ loai: 'khong-phan-cuc', tu: 0, den: kpc }, { loai: 'phan-cuc', tu: kpc, den: ion, denBang: lonHon }, { loai: 'ion', tu: ion, den: null, lonHon }],
  }
}
export function phanLoai(d: number, ng0?: Nguong | null): string {
  const ng = ng0 && ng0.vung ? ng0 : nguongTuDong(null)
  if (d < ng.kpc - 1e-9) return 'khong-phan-cuc'
  if (ng.lonHon ? d > ng.ion + 1e-9 : d >= ng.ion - 1e-9) return 'ion'
  return 'phan-cuc'
}
function chuCua(canh: O): string[] {
  const ra: string[] = [canh.tieuDe]
  const di = (v: O): void => { if (typeof v === 'string') ra.push(v); else if (Array.isArray(v)) v.forEach(di); else if (v && typeof v === 'object') for (const k in v) if (!['khuon', 'loai', 'kieu', 'ky', 'a', 'b', 'mau', 'ct', 'nt', 'tuCt', 'denCt', 'tro', 'dau', 'chi', 'canh'].includes(k)) di(v[k]) }
  di(canh.duLieu); return ra.filter(Boolean)
}
export interface MucKiem { ok: boolean; chu: string; nguon?: boolean }
function kiemKeoCo(d: O, ng: Nguong, kq: MucKiem[]): void {
  d.pha.forEach((p: O, i: number) => {
    const cT = d.trai.ky ? CHI[d.trai.ky] : p.chiTrai, cP = d.phai.ky ? CHI[d.phai.ky] : p.chiPhai
    if (cT == null || cP == null) { kq.push({ ok: false, chu: `Pha ${i + 1}: thiếu độ âm điện` }); return }
    const delta = Math.abs(cP - cT), loai = phanLoai(delta, ng), that = d.trai.ky && d.phai.ky
    kq.push({ ok: p.loai === loai, chu: that ? `Pha ${i + 1}: Δχ = ${soChi(Math.max(cT, cP))} − ${soChi(Math.min(cT, cP))} = ${soDelta(delta)} ⇒ ${TEN_LOAI[loai]}` : `Pha ${i + 1}: lực kéo minh hoạ (không in số), lệch ${soDelta(delta)} ⇒ ${TEN_LOAI[loai]}` })
  })
}
function kiemThang(d: O, ng: Nguong, kq: MucKiem[]): void {
  d.kim.forEach((k: O) => {
    if (CHI[k.a] == null || CHI[k.b] == null) { kq.push({ ok: false, chu: `${boDam(k.nhan)}: nguyên tố ngoài bảng độ âm điện` }); return }
    const delta = Math.abs(CHI[k.a]! - CHI[k.b]!), loai = phanLoai(delta, ng), khop = Math.abs(delta - k.delta) < 0.005
    kq.push({ ok: khop, chu: `${boDam(k.nhan)}: |${soChi(CHI[k.a]!)} − ${soChi(CHI[k.b]!)}| = ${soDelta(delta)}` + (khop ? '' : ` (kịch bản ghi ${soDelta(k.delta)})`) })
    kq.push({ ok: k.loai === loai, chu: `${boDam(k.nhan)}: ${soDelta(delta)} thuộc vùng «${TEN_LOAI[loai]}»` })
  })
}
function kiemLewis(d: O, kq: MucKiem[]): void {
  d.nguyenTu.forEach((a: O, i: number) => {
    const chungI = (d.lienKet as O[]).filter((l) => l.a === i || l.b === i).reduce((x: number, l: O) => x + l.cap, 0), rieng = d.capRieng[i] || 0
    const cua = 2 * rieng + chungI, quanh = 2 * rieng + 2 * chungI, can = a.ky === 'H' ? 2 : 8
    if (E_NGOAI[a.ky] == null) { kq.push({ ok: false, chu: `${a.ky}: chưa có trong bảng electron lớp ngoài` }); return }
    kq.push({ ok: cua === E_NGOAI[a.ky] && quanh === can, chu: `${a.ky} thứ ${i + 1}: góp ${cua} electron (cần ${E_NGOAI[a.ky]}), quanh có ${quanh} (cần ${can})` })
  })
}
function kiemViDu(d: O, kq: MucKiem[]): void {
  d.soDo.chat.forEach((c: O) => c.so.forEach((x: O) => {
    if (x.chi) { const m = String(x.hien).match(/(\d+(?:,\d+)?)\s*$/), v = m ? +m[1]!.replace(',', '.') : NaN; kq.push({ ok: Math.abs(v - (CHI[x.chi] ?? NaN)) < 0.005, chu: `χ của ${x.chi} trên sơ đồ ${m ? m[1] : '?'}, bảng của máy ${soChi(CHI[x.chi] ?? NaN)}` }) }
    if (x.M) { const M = khoiMol(c.ct); kq.push({ ok: M === x.M, chu: `M ${c.ct} = ${soVi(M as number)} (sơ đồ ghi ${x.M})` }) }
  }))
  let v: number | null = null
  d.tinh.thuaSo.forEach((f: O, i: number) => {
    const gt = f.mau ? f.tu / f.mau : f.gt, doc = docSo(f.hien)
    if (Math.abs(doc - gt) > 1e-9 * Math.max(1, Math.abs(gt))) kq.push({ ok: false, chu: `Thừa số «${f.hien}» đọc ra ${doc}, kịch bản ghi ${gt}` })
    if (f.loai === 'chia-M') { const M = khoiMol(f.ct) as number; kq.push({ ok: Math.abs(gt - 1 / M) < 1e-12, chu: `«${f.hien}»: chia M ${f.ct} = ${soVi(M)}` }) }
    if (f.loai === 'nhan-M') { const M = khoiMol(f.ct) as number; kq.push({ ok: gt === M, chu: `«${f.hien}»: nhân M ${f.ct} = ${soVi(M)}` }) }
    if (f.loai === 'bao-toan') { const a = phanTichCT(f.tuCt)[f.nt] || 0, b = phanTichCT(f.denCt)[f.nt] || 0; kq.push({ ok: b > 0 && Math.abs(gt - a / b) < 1e-12, chu: `«${f.hien}»: bảo toàn ${f.nt}, 1 ${f.tuCt} có ${a} ${f.nt}, 1 ${f.denCt} có ${b} ${f.nt} ⇒ × ${soVi(a / b)}` }) }
    if (f.loai === 'hieu-suat-xuoi') kq.push({ ok: Math.abs(gt - f.H / 100) < 1e-12, chu: `«${f.hien}»: tính xuôi × H/100 với H = ${soVi(f.H)} %` })
    if (f.loai === 'hieu-suat-nguoc') kq.push({ ok: Math.abs(gt - 100 / f.H) < 1e-12, chu: `«${f.hien}»: tính ngược × 100/H với H = ${soVi(f.H)} %` })
    const dau = f.dau || (i === 0 ? null : '·')
    v = i === 0 ? gt : dau === '−' ? (v as number) - gt : dau === '+' ? (v as number) + gt : (v as number) * gt
  })
  const kq0 = d.tinh.ketQua, vv = v as unknown as number, sai = Math.abs(vv - kq0.gt) > 1e-6 * Math.max(1, Math.abs(kq0.gt)), docKq = docSo(kq0.hien)
  kq.push({ ok: !sai && Math.abs(docKq - kq0.gt) < 1e-9, chu: `Tính lại cả chuỗi: ${d.tinh.ten} = ${soVi(Math.round(vv * 1e6) / 1e6)}${kq0.donVi ? ' ' + kq0.donVi : ''} (kịch bản ghi ${kq0.hien})` })
}
// (b) có nguồn: số và công thức trên cảnh phải có trên bảng hoặc trong lời Thầy (cả bài). Bỏ qua: phương án sai của câu đoán (nhiễu), mốc ngưỡng.
const soTrong = (t: unknown): number[] => (boDuoi(String(t)).match(/\d+(?:,\d+)?/g) || []).map((x) => +x.replace(',', '.'))
const ctTrong = (t: unknown): string[] => (String(t).match(/(?:[A-Z][a-z]?[₀-₉]*){2,}|[A-Z][a-z]?[₀-₉]+/g) || []).map(boDuoi)
function chuCanNguon(canh: O): string[] {
  const d = canh.duLieu, ra: string[] = []
  if (canh.khuon === 'doan-nhanh') { ra.push(d.hoi, d.giai); (d.luaChon as O[]).filter((c) => c.dung).forEach((c) => ra.push(c.chu)) }
  else if (canh.khuon === 'tong-ket') d.y.forEach((y: O) => ra.push(y.chu))
  else ra.push(...chuCua(canh).slice(1))
  if (canh.khuon === 'thang-delta') d.kim.forEach((k: O) => ra.push(k.nhan, soDelta(k.delta)))
  return ra
}
function kiemNguon(canh: O, kb: O, kq: MucKiem[]): void {
  const ng = canh.nguon || {}
  if (canh.khuon !== 'tong-ket') {
    if (!(ng.trang >= 1)) kq.push({ ok: false, nguon: true, chu: 'Không trỏ được tới trang bảng nào' })
    if (!(ng.den > ng.tu)) kq.push({ ok: false, nguon: true, chu: 'Không có đoạn tiếng của Thầy' })
    const ngoai = (canh.loi || []).filter((l: O) => l.tu < ng.tu - 1 || l.den > ng.den + 1)
    if (ngoai.length) kq.push({ ok: false, nguon: true, chu: `${ngoai.length} câu lời Thầy nằm ngoài đoạn tiếng của cảnh` })
  } else if (canh.duLieu.y.some((y: O) => !(kb.canh as O[]).some((c) => c.id === y.canh))) kq.push({ ok: false, nguon: true, chu: 'Ý tổng kết trỏ tới cảnh không có' })
  const nguonChu = (kb.canh as O[]).flatMap((c) => [(c.nguon || {}).chep || ''].concat((c.loi || []).map((l: O) => l.chu))).join(' ')
  const soNguon = soTrong(nguonChu), ctNguon = new Set(ctTrong(nguonChu))
  const thieuSo = new Set<string>(), thieuCt = new Set<string>()
  for (const t of chuCanNguon(canh)) {
    for (const x of soTrong(t)) if (!soNguon.some((y) => Math.abs(x - y) < 1e-9)) thieuSo.add(soVi(x))
    for (const c of ctTrong(t)) if (!ctNguon.has(c)) thieuCt.add(c)
  }
  if (thieuSo.size || thieuCt.size) kq.push({ ok: false, nguon: true, chu: `Không có trên bảng, không có trong lời Thầy: ${[...thieuCt, ...thieuSo].join(', ')}` })
  else kq.push({ ok: true, chu: 'Mọi số và công thức trên cảnh đều có trên bảng hoặc trong lời Thầy' })
}
export function kiemCanh(canh: O, ng: Nguong, kb: O): MucKiem[] {
  const kq: MucKiem[] = [], d = canh.duLieu || {}
  if (!(KHUON as readonly string[]).includes(canh.khuon)) { kq.push({ ok: false, chu: `Khuôn «${canh.khuon}» không có trong thư viện` }); return kq }
  try {
    if (canh.khuon === 'keo-co') kiemKeoCo(d, ng, kq)
    if (canh.khuon === 'thang-delta') kiemThang(d, ng, kq)
    if (canh.khuon === 'lewis') kiemLewis(d, kq)
    if (canh.khuon === 'vi-du-cot-doc') kiemViDu(d, kq)
    if (canh.khuon === 'doan-nhanh') {
      const n = (d.luaChon as O[]).filter((c) => c.dung).length
      kq.push({ ok: n === 1, chu: `Đúng ${n} đáp án được đánh dấu là đúng (cần 1)` })
      kiemCanh({ khuon: d.mo.khuon, duLieu: d.mo.duLieu, tieuDe: '' }, ng, null).forEach((x) => kq.push(Object.assign({}, x, { chu: 'Hoạt hoạ mở đáp án: ' + x.chu })))
    }
    if (kb) kiemNguon(canh, kb, kq)
  } catch (e) { kq.push({ ok: false, chu: 'Dữ liệu cảnh sai dạng: ' + (e instanceof Error ? e.message : String(e)) }) }
  for (const t of chuCua(canh).concat((canh.loi || []).map((l: O) => l.chu))) for (const l of kiemChu(t)) kq.push({ ok: false, chu: `Chữ «${boDam(t).slice(0, 40)}…»: ${l}` })
  return kq
}
export interface KetQuaCong { nguong: Nguong; dat: string[]; bo: { id: string; tieuDe: string; lyDo: string[] }[]; chiTiet: Record<string, MucKiem[]>; phatHanh: boolean; soCau: number }
/** Cổng: cảnh đạt / cảnh bỏ (kèm lý do), ngưỡng đã dùng, có phát hành bài hoạt hoạ không. `them` = lỗi máy chủ tự thêm theo cảnh (trang bảng không có,
 *  giờ nằm ngoài trục tiếng…) — cảnh có lỗi thêm bị bỏ như lỗi của cổng. */
export function kiemCong(kb: O, them?: Readonly<Record<string, readonly string[]>>): KetQuaCong {
  const ng = nguongTuDong(kb), dat: string[] = [], bo: KetQuaCong['bo'] = [], chiTiet: Record<string, MucKiem[]> = {}
  for (const c of kb.canh as O[]) {
    const kq = kiemCanh(c, ng, kb); chiTiet[c.id] = kq
    for (const l of them?.[c.id] ?? []) kq.push({ ok: false, nguon: true, chu: l })
    const sai = kq.filter((x) => x.ok === false)
    if (sai.length) bo.push({ id: c.id, tieuDe: c.tieuDe, lyDo: sai.map((x) => x.chu) }); else dat.push(c.id)
  }
  const phatHanh = dat.length >= CONG.itNhat && dat.length / kb.canh.length >= CONG.tiLe
  return { nguong: ng, dat, bo, chiTiet, phatHanh, soCau: kb.canh.length }
}
/** Che tên người: tên trong danh sách lớp xuất hiện trong chữ học sinh thấy (kể cả lời Thầy) ⇒ «một bạn». */
export const cheTen = (t: string, tenLop: readonly string[]): string => (tenLop || []).filter(Boolean).reduce((x, ten) => x.replace(new RegExp(`(^|[^\\p{L}])(?:[Bb]ạn\\s+)?${ten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'gu'), (_m: string, truoc: string, vt: number) => truoc + (vt === 0 || /[.!?]\s*$/.test(x.slice(0, vt + truoc.length)) ? 'Một bạn' : 'một bạn')), t)
/** Kịch bản sau cổng: bỏ cảnh hỏng, sửa chữ viết tắt, che tên người, tổng kết bỏ ý của cảnh đã bỏ; bản phát hành không mang chữ chép bảng (`chep`). */
export function quaCong(kb: O, opt?: { tenLop?: readonly string[]; them?: Readonly<Record<string, readonly string[]>> }): { kb: O; cong: KetQuaCong } {
  const cong = kiemCong(kb, opt?.them), giu = new Set(cong.dat), tenLop = opt?.tenLop ?? []
  const sach = (v: O): O => (typeof v === 'string' ? cheTen(sachChu(v), tenLop) : Array.isArray(v) ? v.map(sach) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ['chep', 'khuon', 'loai', 'kieu', 'ky', 'ct', 'nt', 'tuCt', 'denCt', 'tro'].includes(k) ? x : sach(x)])) : v)
  const canh = (kb.canh as O[]).filter((c) => giu.has(c.id)).map(sach).map((c) => Object.assign(c, { nguon: Object.assign({}, c.nguon, { chep: '' }) }))
  canh.forEach((c) => { if (c.khuon === 'tong-ket') c.duLieu.y = c.duLieu.y.filter((y: O) => giu.has(y.canh)) })
  return { kb: Object.assign({}, kb, { canh }), cong }
}
