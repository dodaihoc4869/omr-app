// LỜI GIẢI TỪNG BƯỚC — LÕI THUẦN (phương án A, thầy chốt 29/09/2026: "chọn cách 2, chạy 4 phiên khối 12 trước").
// Thiết kế: DE-XUAT-LOI-GIAI-A-2909.md. Một khung trình bày cố định + mỗi câu một HỒ SƠ DỮ LIỆU (JSON) do máy soạn.
//
// THUẦN: không IO, không đồng hồ, không ngẫu nhiên — máy chủ (kiểm lại lúc nộp), máy soạn của thầy và app cùng import.
// Máy chủ Worker CẤM `eval`/`new Function` nên con số được tính lại bằng bộ đọc biểu thức tự viết (`tinhBieuThuc`).
//
// SÁU KHOÁ ĐÚNG FILE (mục 3 bản đề xuất):
//   1. mã câu `qid`            — hồ sơ ghi đúng qid được giao;
//   2. dấu vân tay `bam`       — băm nội dung câu (đề + ý + đáp án + bảng + hình); thầy sửa đề ⇒ băm đổi ⇒ hồ sơ cũ hết hiệu lực;
//   3. khớp đáp án kho         — từng ý / phương án / đáp số trùng đáp án chính thức, KHÔNG BAO GIỜ đổi;
//   4. tính lại mọi con số     — `phepTinh` được máy tính lại, lệch là trượt;
//   5. thầy duyệt              — theo đề, lúc giao (cách 2);
//   6. cổng công bố            — học sinh chỉ xem sau khi ca công bố hoặc sau khi đã tự làm câu ấy.
// Chỉ ba dạng: trắc nghiệm (I), Đúng/Sai (II), trả lời ngắn (III). Tự luận bỏ (thầy chốt 29/09; luật chung `cau-tu-luan.ts`).

import { chuoiDapAn, laCauTuLuan, laMaDeTuLuan, type PhanCau } from './cau-tu-luan'

export const KHUON_HO_SO = '1.2'
export type DangLoiGiai = 'tn' | 'ds' | 'tln'
/** Cờ máy soạn ghi lại. CHỈ `dapAn` bắt thầy phải xem trước khi duyệt; `hienThi`, `loiDe` vào danh sách sửa kho. */
export type LoaiCo = 'dapAn' | 'hienThi' | 'loiDe'
export const LOAI_CO: readonly LoaiCo[] = ['dapAn', 'hienThi', 'loiDe']
export type TangSoan = 'gon' | 'du' | 'sau'

type Obj = Record<string, unknown>
const laObj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '').normalize('NFC')

// ---------------------------------------------------------------- câu kho chuẩn hoá

export interface HinhCau { viTri: string; duLieu: string }
export interface CauKho {
  qid: string
  maDe: string
  phan: PhanCau
  so: string
  de: string
  /** Phương án trắc nghiệm A–D (phần I). */
  pa: Record<string, string> | null
  /** Ý a–d (phần II). */
  y: Record<string, string> | null
  /** Đáp án về MỘT chuỗi: "C" · "DSSD" · "3,5". */
  dapAn: string
  bang: string[][] | null
  hinh: HinhCau[]
  chuong: string
  mucDo: string
  dangMa: string
  sao: number
  loiGiai: Obj | null
}

function banDo(v: unknown, nhan: readonly string[]): Record<string, string> | null {
  if (Array.isArray(v)) {
    if (!v.length) return null
    const o: Record<string, string> = {}
    v.forEach((x, i) => { if (i < nhan.length) o[nhan[i]] = chuoi(laObj(x) ? (x.t ?? x.text ?? x.noi_dung) : x) })
    return o
  }
  if (laObj(v)) {
    const o: Record<string, string> = {}
    for (const [k, x] of Object.entries(v)) o[k] = chuoi(laObj(x) ? (x.t ?? x.text ?? x.noi_dung) : x)
    return Object.keys(o).length ? o : null
  }
  return null
}

/** Đáp án Đúng/Sai về dạng "DSSD" (nhận "ĐSĐS", "D S D S", {a:true…}). */
function dapAnDs(v: unknown): string {
  return chuoiDapAn(v).toUpperCase().replace(/Đ/g, 'D').replace(/[^DS]/g, '')
}

function mot(c: Obj, maDe: string, phanMacDinh?: PhanCau): { qid: string; cau: CauKho } | null {
  const phanTho = chuoi(c.phan ?? phanMacDinh ?? '').trim().toUpperCase()
  const phan = (({ I: 'I', II: 'II', III: 'III', TN: 'I', DS: 'II', TLN: 'III' }) as Record<string, PhanCau>)[phanTho]
  if (!phan) return null
  const so = chuoi(c.so).trim()
  const qid = chuoi(c.qid ?? c.id).trim() || (so ? `${maDe}-${phan}-${so}` : '')
  if (!qid) return null
  const dangO = c.dang
  const hinhTho = c.hinh ?? c.hinhAnh
  const hinh: HinhCau[] = Array.isArray(hinhTho)
    ? hinhTho.filter(laObj).map((h) => ({ viTri: chuoi(h.vi_tri ?? h.viTri) || 'sau_de', duLieu: chuoi(h.du_lieu ?? h.duLieu ?? h.src) }))
        .filter((h) => /^data:image\/(png|jpe?g|gif|webp);base64,/.test(h.duLieu))
    : []
  const bangTho = c.bang
  const bang = Array.isArray(bangTho) && bangTho.every(Array.isArray) ? (bangTho as unknown[][]).map((r) => r.map(chuoi)) : null
  const cc = laObj(c.can_chua) ? c.can_chua : {}
  const da = c.dap_an ?? c.correct ?? c.dapAn
  return {
    qid,
    cau: {
      qid, maDe, phan, so,
      de: chuoi(c.de ?? c.text),
      pa: phan === 'I' ? banDo(c.pa ?? c.choices ?? c.luaChon, ['A', 'B', 'C', 'D']) : null,
      y: phan === 'II' ? banDo(c.y ?? c.ideas, ['a', 'b', 'c', 'd']) : null,
      dapAn: phan === 'II' ? dapAnDs(da) : chuoiDapAn(da).trim(),
      bang,
      hinh,
      chuong: chuoi(c.chuyen_de ?? c.chuyenDe).trim(),
      mucDo: chuoi(c.muc_do ?? c.mucDo).trim(),
      dangMa: chuoi(laObj(dangO) ? dangO.ma : dangO).trim(),
      sao: Number(cc.sao ?? 0) || 0,
      loiGiai: laObj(c.loi_giai) ? c.loi_giai : laObj(c.loiGiai) ? c.loiGiai : null,
    },
  }
}

/** Mọi câu của một gói đề trên R2 (ba dáng `cau[]` · `items[]` · `phanI/II/III`), đã chuẩn hoá. Không bỏ tự luận ở đây — xem `loaiCau`. */
export function cauTrongGoi(maDe: string, goi: unknown): CauKho[] {
  if (!laObj(goi)) return []
  const ra: CauKho[] = []
  const them = (c: unknown, p?: PhanCau) => { if (laObj(c)) { const m = mot(c, maDe, p); if (m) ra.push(m.cau) } }
  if (Array.isArray(goi.cau)) goi.cau.forEach((c) => them(c))
  else if (Array.isArray(goi.items)) goi.items.forEach((c) => them(c))
  else for (const p of ['I', 'II', 'III'] as const) { const v = goi[`phan${p}`]; if (Array.isArray(v)) v.forEach((c) => them(c, p)) }
  return ra
}

/** Dạng lời giải của câu, hoặc `null` nếu KHÔNG soạn (tự luận, thiếu đáp án, thiếu phương án/ý). */
export function loaiCau(c: CauKho): DangLoiGiai | null {
  if (laMaDeTuLuan(c.maDe)) return null
  const tho = { phan: c.phan, de: c.de, pa: c.pa ? Object.values(c.pa) : undefined, y: c.y ? Object.values(c.y) : undefined, dap_an: c.dapAn, hinh: c.hinh.map((h) => ({ viTri: h.viTri, src: h.duLieu })) }
  if (laCauTuLuan(tho, c.phan)) return null
  if (c.phan === 'I') return c.pa && Object.keys(c.pa).length === 4 && /^[A-D]$/.test(c.dapAn) ? 'tn' : null
  if (c.phan === 'II') return c.y && Object.keys(c.y).length === 4 && /^[DS]{4}$/.test(c.dapAn) ? 'ds' : null
  return c.dapAn && c.dapAn.length <= 8 ? 'tln' : null
}

/** Tầng soạn: gọn (biết) · đủ (hiểu, vận dụng) · sâu (vận dụng tính nhiều bước, hoặc đáng chữa ≥ 2 sao). */
export function tangCau(c: CauKho, dang: DangLoiGiai): TangSoan {
  const buoc = Array.isArray(c.loiGiai?.buoc) ? (c.loiGiai?.buoc as unknown[]).length : 0
  if (c.mucDo === 'biet' && dang !== 'tln') return 'gon'
  if ((c.mucDo === 'van_dung' && (buoc >= 3 || dang === 'tln')) || c.sao >= 2) return 'sau'
  return 'du'
}

/** Lớp của câu: đọc từ mã đề (`12-…`, `DB-12-…`). */
export function lopCua(maDe: string): string {
  return (maDe.match(/(?:^|-)(10|11|12)(?:-|$)/) ?? [])[1] ?? ''
}

/** Mã bộ chìa khoá (= tiền tố mã dạng bài: `ESTER.CAU_TAO.…` ⇒ `ESTER`), rỗng nếu câu chưa gắn dạng. */
export function boCua(c: CauKho): string {
  return c.dangMa.split('.')[0]?.trim().toUpperCase() ?? ''
}

// ---------------------------------------------------------------- dấu vân tay

const chuanChu = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:]/g, '').trim()

/** Chuỗi đem băm. Hai câu trùng nội dung ở hai đề ⇒ cùng chuỗi ⇒ dùng chung một hồ sơ. Đổi đề / ý / đáp án / bảng / hình ⇒ khác. */
export function chuoiBam(c: CauKho): string {
  const chu = [c.de, JSON.stringify(c.pa ?? c.y ?? ''), c.dapAn, JSON.stringify(c.bang ?? '')].map(chuanChu).join('|')
  return chu + '|' + c.hinh.map((h) => h.duLieu).join('|')
}

/** Băm SHA-1 → 16 kí tự hex (Worker và Node ≥ 18 đều có `crypto.subtle`). */
export async function bamCau(c: CauKho): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(chuoiBam(c)))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

// ---------------------------------------------------------------- đề ra HTML (khung và máy soạn cùng dùng)

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] as string)
export function chuHtml(s: string): string { return esc(s).replace(/\n/g, '<br>') }

/** Đề ra HTML an toàn: chữ được thoát, bảng, hình (data URL đã lọc ở `mot`). */
export function deHtml(c: CauKho, kemHinh = true): string {
  let h = '<p>' + chuHtml(c.de) + '</p>'
  if (c.bang?.length) h += '<div class="tbl"><table>' + c.bang.map((r, i) => '<tr>' + r.map((x) => (i ? `<td>${chuHtml(x)}</td>` : `<th>${chuHtml(x)}</th>`)).join('') + '</tr>').join('') + '</table></div>'
  if (kemHinh) for (const g of c.hinh) h += `<p><img alt="Hình trong đề" src="${g.duLieu}"></p>`
  return h
}

// ---------------------------------------------------------------- đầu vào cho máy soạn

export interface DauVao {
  khuon: string
  qid: string
  bam: string
  nguon: string
  so: string
  dang: DangLoiGiai
  bo: string
  chuong: string
  mucDo: string
  dangBai: string
  tang: TangSoan
  de: string
  hinh: { viTri: string; duLieu: string }[]
  y: { id: string; t: string }[]
  dapAn: Record<string, string>
  mc?: { hoi: string; o: [string, string][]; dapAn: string }
  loiGiaiCo: Obj | null
}

export function dauVao(c: CauKho, bam: string): DauVao | null {
  const dang = loaiCau(c)
  if (!dang) return null
  const lg = c.loiGiai ?? {}
  const base = {
    khuon: KHUON_HO_SO, qid: c.qid, bam, nguon: c.maDe, so: `Câu ${c.so}`, dang, bo: boCua(c), chuong: c.chuong, mucDo: c.mucDo,
    dangBai: c.dangMa, tang: tangCau(c, dang), de: deHtml(c, false), hinh: c.hinh,
    loiGiaiCo: { chot: lg.chot ?? '', tung: lg.tung_pa ?? lg.tung_y ?? null, buoc: lg.buoc ?? [], ket_qua: lg.ket_qua ?? '', trang_thai: lg.trang_thai ?? '' },
  }
  if (dang === 'tn') {
    const pa = c.pa as Record<string, string>
    // Xếp A–D như màn thi (exam-kho-de-import), KHÔNG theo thứ tự khoá lưu trong kho.
    const ids = Object.keys(pa).sort()
    return { ...base, y: ids.map((k) => ({ id: k, t: pa[k] })), dapAn: Object.fromEntries(ids.map((k) => [k, k === c.dapAn ? 'D' : 'S'])), mc: { hoi: 'Chọn đáp án', o: ids.map((k) => [k, pa[k]] as [string, string]), dapAn: c.dapAn } }
  }
  if (dang === 'ds') {
    const y = c.y as Record<string, string>
    // Chuỗi đáp án "DSSD" là theo a, b, c, d (màn thi ghép y.a…y.d). Kho có câu lưu khoá lệch (a,b,d,c) ⇒ phải xếp lại.
    const ids = Object.keys(y).sort()
    return { ...base, y: ids.map((k) => ({ id: k, t: y[k] })), dapAn: Object.fromEntries(ids.map((k, i) => [k, c.dapAn[i]])) }
  }
  return { ...base, y: [], dapAn: { kq: c.dapAn } }
}

// ---------------------------------------------------------------- máy tính an toàn

/** Tính biểu thức chỉ gồm số (dấu chấm thập phân), + − × ÷ và ngoặc. Kí tự lạ ⇒ ném lỗi. KHÔNG dùng eval. */
export function tinhBieuThuc(bt: string): number {
  const s = bt.replace(/\s+/g, '')
  if (!/^[0-9.+\-*/()]+$/.test(s)) throw new Error('biểu thức có kí tự lạ: ' + bt)
  let i = 0
  const so = (): number => {
    if (s[i] === '(') { i++; const v = cong(); if (s[i] !== ')') throw new Error('thiếu ngoặc đóng: ' + bt); i++; return v }
    if (s[i] === '-') { i++; return -so() }
    if (s[i] === '+') { i++; return so() }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i))
    if (!m) throw new Error('biểu thức hỏng: ' + bt)
    i += m[0].length
    return Number(m[0])
  }
  const nhan = (): number => {
    let v = so()
    while (s[i] === '*' || s[i] === '/') { const op = s[i++]; const r = so(); v = op === '*' ? v * r : v / r }
    return v
  }
  const cong = (): number => {
    let v = nhan()
    while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const r = nhan(); v = op === '+' ? v + r : v - r }
    return v
  }
  const v = cong()
  if (i !== s.length) throw new Error('biểu thức thừa kí tự: ' + bt)
  if (!Number.isFinite(v)) throw new Error('biểu thức ra vô cực: ' + bt)
  return v
}

// ---------------------------------------------------------------- bộ chìa khoá

export interface BoChiaKhoa {
  ma: string
  chuong: string
  KEYS: Record<string, { ten: string; rule: string }>
  TRAPS_THEM?: Record<string, { ten: string; hoi: string }>
  /** Chỉ chương có phòng thí nghiệm ảo (Ester): id chìa khoá → id preset. */
  LAB_PRESETS?: Record<string, string[]>
}
/** 7 kiểu bẫy dùng chung mọi chương (khung có sẵn màu + từ khoá gạch chân). */
export const BAY_CHUNG = ['nguyennhan', 'tuyetdoi', 'xuhuong', 'conso', 'doivai', 'antoan', 'tengoi'] as const
/** Biểu tượng khung có sẵn (SVG trong khung). */
export const BIEU_TUONG = [
  'i-flask', 'i-funnel', 'i-reflux', 'i-distill', 'i-bubbles', 'i-salt', 'i-dry', 'i-ice', 'i-filter', 'i-crystal', 'i-scale', 'i-ir',
  'i-heat', 'i-chart', 'i-hex', 'i-thermo', 'i-lens', 'i-bolt', 'i-battery', 'i-chain', 'i-atom',
] as const

// ---------------------------------------------------------------- bộ kiểm hồ sơ

const THE_DUOC = new Set(['b', 'i', 'sub', 'sup', 'br'])
const TRUONG_BUOC = ['qid', 'bam', 'dang', 'ten', 'keys', 'dung', 'y', 'ket', 'nho', 'phepTinh', 'tuongTu', 'co'] as const

interface PhepTinh { ten?: unknown; bieuThuc?: unknown; ketQua?: unknown; lamTron?: unknown; laDapSo?: unknown }

function kiemPhepTinh(ds: unknown, noi: string, loi: string[]): number {
  if (!Array.isArray(ds)) { loi.push(`${noi}: phepTinh không phải mảng`); return 0 }
  for (const p of ds as PhepTinh[]) {
    const ten = chuoi(p?.ten)
    try {
      const v = tinhBieuThuc(chuoi(p?.bieuThuc))
      const d = Number(p?.lamTron ?? 2)
      const sai = 0.5 * Math.pow(10, -d) + 1e-9
      if (typeof p?.ketQua !== 'number') loi.push(`${noi}: "${ten}" ketQua không phải số`)
      else if (Math.abs(v - p.ketQua) > sai) loi.push(`KHOÁ SỐ ${noi}: "${ten}" máy tính ra ${v.toFixed(d + 2)} ≠ ghi ${p.ketQua}`)
    } catch (e) { loi.push(`${noi}: "${ten}" ${(e as Error).message}`) }
  }
  return ds.length
}

function chuTrongHoSo(h: Obj): string[] {
  const ra: unknown[] = [h.ten, h.nho, h.ket]
  for (const s of (h.dung as Obj[] | undefined) ?? []) { ra.push(s?.t, s?.p); for (const x of (s?.io as unknown[][] | undefined) ?? []) ra.push(Array.isArray(x) ? x[1] : x) }
  for (const y of (h.y as Obj[] | undefined) ?? []) ra.push(y?.soi, y?.giai, ...(((y?.g as unknown[]) ?? [])))
  for (const t of (h.tuongTu as Obj[] | undefined) ?? []) ra.push(t?.t, t?.giai)
  const tl = h.tl as Obj | undefined
  if (tl) ra.push(tl.soi, tl.giai, ...(((tl.g as unknown[]) ?? [])))
  for (const c of (h.co as Obj[] | undefined) ?? []) ra.push(c?.ghi, c?.chot)
  for (const c of (Array.isArray(h.daChot) ? (h.daChot as Obj[]) : [])) ra.push(c?.ghi, c?.chot)
  return ra.filter((x): x is string => typeof x === 'string')
}

const chuanKet = (s: string) => s.replace(/\s+/g, ' ').replace(/[-—]/g, '–').trim()
const soTuChu = (s: string) => Number(s.trim().replace(',', '.'))

/**
 * KIỂM MỘT HỒ SƠ đối chiếu ĐẦU VÀO LẤY TỪ KHO (không lấy từ máy soạn gửi lên).
 * `loi` rỗng ⇔ qua khoá 1–4 + đúng khuôn + an toàn nội dung. `canhBao` không chặn.
 */
export function kiemHoSo(vao: DauVao, hoSo: unknown, bo: BoChiaKhoa): { loi: string[]; canhBao: string[] } {
  const loi: string[] = []
  const canhBao: string[] = []
  if (!laObj(hoSo)) return { loi: ['hồ sơ không phải đối tượng JSON'], canhBao }
  const h = hoSo
  for (const k of TRUONG_BUOC) if (h[k] === undefined) loi.push('thiếu trường ' + k)
  if (loi.length) return { loi, canhBao }
  const KEYS = Object.keys(bo.KEYS)
  const TRAPS = new Set<string>([...BAY_CHUNG, ...Object.keys(bo.TRAPS_THEM ?? {})])
  const ICONS = new Set<string>(BIEU_TUONG)
  const PRESET = bo.LAB_PRESETS ?? {}

  // khoá 1, 2
  if (h.qid !== vao.qid) loi.push(`KHOÁ MÃ CÂU: hồ sơ ghi ${chuoi(h.qid)} ≠ ${vao.qid}`)
  if (h.bam !== vao.bam) loi.push(`KHOÁ VÂN TAY: hồ sơ ghi ${chuoi(h.bam)} ≠ ${vao.bam} (đề đã đổi hoặc chép nhầm)`)
  if (h.dang !== vao.dang) loi.push(`dạng ${chuoi(h.dang)} ≠ ${vao.dang}`)

  const ten = chuoi(h.ten), nho = chuoi(h.nho), ket = chuoi(h.ket)
  if (!ten) loi.push('ten rỗng'); else if (ten.length > 70) canhBao.push(`ten dài ${ten.length} > 70`)
  if (!nho) loi.push('nho rỗng'); else if (nho.length > 120) canhBao.push(`nho dài ${nho.length} > 120`)

  if (!Array.isArray(h.keys) || !h.keys.length) loi.push('keys rỗng')
  else (h.keys as unknown[]).forEach((k) => { if (!KEYS.includes(chuoi(k))) loi.push('chìa khoá lạ ' + chuoi(k)) })

  const dung = h.dung
  if (!Array.isArray(dung) || dung.length < 2 || dung.length > 5) loi.push(`dung cần 2–5 bước`)
  else (dung as Obj[]).forEach((s, i) => {
    if (!ICONS.has(chuoi(s?.ic))) loi.push(`dung[${i}] biểu tượng lạ ${chuoi(s?.ic)}`)
    if (!chuoi(s?.t) || !chuoi(s?.p)) loi.push(`dung[${i}] thiếu t/p`)
    else if (chuoi(s.t).length > 40) canhBao.push(`dung[${i}] tiêu đề dài`)
    if (!Array.isArray(s?.io)) loi.push(`dung[${i}] io không phải mảng`)
  })

  const y = Array.isArray(h.y) ? (h.y as Obj[]) : null
  if (!y) loi.push('y không phải mảng')
  // khoá 3: đáp án
  if (y && vao.dang !== 'tln') {
    if (y.length !== vao.y.length) loi.push(`số ý ${y.length} ≠ ${vao.y.length}`)
    const tn = vao.dang === 'tn'
    y.forEach((yy, i) => {
      const id = chuoi(yy?.id)
      if (id !== vao.y[i]?.id) loi.push(`ý thứ ${i + 1}: id ${id} ≠ ${vao.y[i]?.id}`)
      const dung_ = vao.dapAn[id]
      if (yy?.d !== dung_) loi.push(`KHOÁ ĐÁP ÁN: ý ${id} ghi ${chuoi(yy?.d)}, đáp án kho ${dung_}`)
      if (!KEYS.includes(chuoi(yy?.k))) loi.push(`ý ${id}: chìa khoá lạ ${chuoi(yy?.k)}`)
      if (yy?.bay != null && !TRAPS.has(chuoi(yy.bay))) loi.push(`ý ${id}: bẫy lạ ${chuoi(yy.bay)}`)
      if (!tn && yy?.d === 'D' && yy?.bay) canhBao.push(`ý ${id}: ý ĐÚNG mà có bẫy`)
      if (!tn && yy?.d === 'S' && !yy?.bay) canhBao.push(`ý ${id}: ý SAI mà không gắn bẫy`)
      const g = Array.isArray(yy?.g) ? (yy.g as unknown[]) : null
      const n = g?.length ?? -1
      if (!g || (tn ? (yy.d === 'D' ? n !== 3 : n < 1 || n > 3) : n !== 3)) loi.push(`ý ${id}: số gợi ý sai (${n})`)
      else if (!/^Chìa khoá/.test(chuoi(g[0]))) canhBao.push(`ý ${id}: gợi ý 1 không mở đầu bằng "Chìa khoá"`)
      if (!chuoi(yy?.soi)) loi.push(`ý ${id}: thiếu soi`)
      const mo = chuoi(yy?.giai).trim().split(/[.\s]/)[0]
      const can = tn ? (yy?.d === 'D' ? 'Chọn' : 'Loại') : (yy?.d === 'D' ? 'Đúng' : 'Sai')
      if (mo !== can) loi.push(`ý ${id}: lời giải mở đầu "${mo}", cần "${can}"`)
      const lab = yy?.lab
      if (lab != null && !(Array.isArray(lab) && PRESET[chuoi(lab[0])]?.includes(chuoi(lab[1])))) loi.push(`ý ${id}: phòng thí nghiệm lạ ${JSON.stringify(lab)}`)
    })
  }
  if (vao.dang === 'tn') {
    const mc = h.mc as Obj | undefined
    if (!mc || mc.d !== vao.mc?.dapAn) loi.push(`KHOÁ ĐÁP ÁN: lựa chọn chốt ${chuoi(mc?.d)} ≠ ${vao.mc?.dapAn}`)
    if (ket !== `Đáp án ${vao.mc?.dapAn}`) loi.push(`ket "${ket}" ≠ "Đáp án ${vao.mc?.dapAn}"`)
  }
  if (vao.dang === 'ds') {
    const can = vao.y.map((x) => `${x.id} ${vao.dapAn[x.id] === 'D' ? 'Đ' : 'S'}`).join(' – ')
    if (chuanKet(ket) !== chuanKet(can)) loi.push(`ket "${ket}" ≠ "${can}"`)
  }
  if (vao.dang === 'tln') {
    if (y && y.length) loi.push('tln: y phải rỗng')
    const tl = laObj(h.tl) ? h.tl : null
    if (!tl) loi.push('tln: thiếu tl')
    else {
      if (chuoi(tl.dapAn) !== vao.dapAn.kq) loi.push(`KHOÁ ĐÁP ÁN: đáp số ${chuoi(tl.dapAn)} ≠ ${vao.dapAn.kq}`)
      if (!Array.isArray(tl.g) || tl.g.length !== 3) loi.push('tln: cần đúng 3 gợi ý')
      if (!/^Đáp số/.test(chuoi(tl.giai).trim())) loi.push('tln: lời giải phải mở đầu "Đáp số"')
      if (!KEYS.includes(chuoi(tl.k))) loi.push('tln: chìa khoá lạ ' + chuoi(tl.k))
      if (tl.bay != null && !TRAPS.has(chuoi(tl.bay))) loi.push('tln: bẫy lạ ' + chuoi(tl.bay))
      if (!chuoi(tl.soi)) loi.push('tln: thiếu soi')
    }
    if (!ket.startsWith('Đáp số')) loi.push('tln: ket phải mở đầu "Đáp số"')
    const cuoi = Array.isArray(h.phepTinh) ? (h.phepTinh as PhepTinh[]).filter((p) => p?.laDapSo).pop() : undefined
    if (!cuoi) loi.push('KHOÁ SỐ: thiếu phép tính laDapSo')
    else if (!(Math.abs(soTuChu(vao.dapAn.kq) - Number(cuoi.ketQua)) < 1e-9)) loi.push(`KHOÁ SỐ: phép tính cuối ra ${chuoi(cuoi.ketQua)} ≠ đáp số ${vao.dapAn.kq}`)
  }

  // khoá 4: con số
  const soPhep = kiemPhepTinh(h.phepTinh, 'phepTinh', loi)
  const tt = h.tuongTu
  const soTT = vao.tang === 'gon' ? [1, 1] : [1, 2]
  if (!Array.isArray(tt) || tt.length < 1 || tt.length > 2) loi.push('tuongTu cần 1–2 ý')
  else {
    if (tt.length < soTT[0] || tt.length > soTT[1]) canhBao.push(`tầng ${vao.tang}: nên có ${soTT[1]} ý tương tự`)
    ;(tt as Obj[]).forEach((t, i) => {
      if (!['D', 'S'].includes(chuoi(t?.d))) loi.push(`tuongTu[${i}] d lạ`)
      if (!chuoi(t?.t)) loi.push(`tuongTu[${i}] thiếu t`)
      if (t?.phepTinh !== undefined) kiemPhepTinh(t.phepTinh, `tuongTu[${i}]`, loi)
      const mo = chuoi(t?.giai).trim().split(/[.\s]/)[0]
      if ((t?.d === 'D' && mo !== 'Đúng') || (t?.d === 'S' && mo !== 'Sai')) loi.push(`tuongTu[${i}] lời giải mở đầu "${mo}" không khớp ${chuoi(t?.d)}`)
    })
  }
  const coSo = (y ?? []).some((yy) => /=\s*\d/.test(chuoi(yy?.giai) + ((yy?.g as unknown[]) ?? []).map(chuoi).join(' '))) || (laObj(h.tl) && /=\s*\d/.test(chuoi(h.tl.giai)))
  if (coSo && soPhep === 0) loi.push('KHOÁ SỐ: lời giải có phép tính nhưng phepTinh rỗng')

  // cờ
  if (!Array.isArray(h.co)) loi.push('co không phải mảng')
  else (h.co as Obj[]).forEach((c, i) => {
    if (!LOAI_CO.includes(c?.loai as LoaiCo)) loi.push(`co[${i}] loại lạ ${chuoi(c?.loai)} (chỉ dapAn | hienThi | loiDe)`)
    if (!chuoi(c?.ghi)) loi.push(`co[${i}] thiếu ghi`)
    // Đề xuất sửa kho (phiên chốt): đoạn NGUYÊN VĂN đang có trong đề → đoạn thay. Không bao giờ là đáp án.
    if (c?.sua !== undefined) {
      const su = c.sua as Obj
      if (!laObj(su) || !chuoi(su.truoc) || typeof su.sau !== 'string' || chuoi(su.truoc) === chuoi(su.sau)) loi.push(`co[${i}] sua cần { truong, truoc, sau } và truoc ≠ sau`)
      else if (!/^(de|pa\.[A-D]|y\.[a-d]|bang)$/.test(chuoi(su.truong))) loi.push(`co[${i}] sua.truong lạ ${chuoi(su.truong)} (de | pa.A–D | y.a–d | bang)`)
      else {
        const tr = chuoi(su.truong), truoc = String(su.truoc)
        const coMat = tr === 'de' ? vao.de.includes(chuHtml(truoc)) : tr === 'bang' ? true : (vao.y.find((x) => x.id === tr.split('.')[1])?.t ?? '').includes(truoc)
        if (!coMat) loi.push(`co[${i}] sua.truoc không có nguyên văn trong ${tr} của đề`)
      }
    }
    if (c?.chot !== undefined && !chuoi(c.chot)) loi.push(`co[${i}] chot rỗng`)
  })

  // quyết định của phiên chốt khi GIỮ đáp án kho (chỉ để thầy xem lại, không chặn công bố)
  if (h.daChot !== undefined) {
    if (!Array.isArray(h.daChot)) loi.push('daChot không phải mảng')
    else (h.daChot as Obj[]).forEach((c, i) => { if (!chuoi(c?.ghi) || !chuoi(c?.chot)) loi.push(`daChot[${i}] cần { ghi, chot }`) })
  }

  // an toàn nội dung + giọng văn
  for (const s of chuTrongHoSo(h)) {
    for (const m of s.matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) {
      if (!THE_DUOC.has(m[1].toLowerCase())) loi.push(`thẻ HTML cấm <${m[1]}>`)
      if (m[2].trim()) loi.push('thẻ HTML không được có thuộc tính')
    }
    let sau = 0
    for (const ch of s) {
      if (ch === '{') sau++
      if (ch === '}') sau--
      if (sau < 0 || sau > 1) break
    }
    if (sau !== 0) loi.push('ngoặc nhọn công thức lệch: ' + s.slice(0, 40))
    if (/(^|[^\p{L}])AI([^\p{L}]|$)/u.test(s)) canhBao.push('có chữ "AI"')
  }
  return { loi: [...new Set(loi)], canhBao: [...new Set(canhBao)] }
}

/** Hồ sơ "sạch" = không có cờ `dapAn` ⇒ thầy được bấm "Duyệt cả lô". */
export function laHoSoSach(hoSo: unknown): boolean {
  return laObj(hoSo) && Array.isArray(hoSo.co) && !(hoSo.co as Obj[]).some((c) => c?.loai === 'dapAn')
}

/** Bỏ các trường chép lại từ đề (khuôn 1.2 không lưu đề): nhẹ hồ sơ, và đề luôn lấy từ kho lúc hiển thị. */
export function gonHoSo(hoSo: Obj): Obj {
  const { de: _de, so: _so, nguon: _ng, chuong: _ch, ...con } = hoSo
  void _de; void _so; void _ng; void _ch
  if (Array.isArray(con.y)) con.y = (con.y as Obj[]).map((y) => { const { t: _t, ...r } = y; void _t; return r })
  if (laObj(con.mc)) con.mc = { d: con.mc.d }
  return { khuon: KHUON_HO_SO, ...con }
}
