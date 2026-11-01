// HÔM NAY · 4 BẢNG (thầy chốt 01/11) — lớp nối app THẦY ⇄ máy chủ: `/gv/bon-bang` (4 bảng) và `/gv/bon-bang/em` (bằng chứng một em). Hợp đồng kiểu:
// `src/lib/bon-bang-kieu.ts`. Đọc CHẶT: trường sai kiểu ⇒ bỏ / null, không bịa số. Bản 4 bảng lần trước giữ trong máy (bộ nhớ + localStorage) để màn vẽ
// NGAY khi mở, rồi thay bằng bản mới khi về.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import {
  THU_TU_BANG,
  type DiemBon, type DongBang, type MaBang, type NgayBon, type TheBangChung, type TraLoiBangChung, type TraLoiBonBang, type ViDuBon,
} from './bon-bang-kieu'

const CHU_CHUA_CO = 'Máy chủ chưa có lệnh 4 bảng — cần đẩy bản máy chủ mới.'
type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const s = (x: unknown) => (typeof x === 'string' ? x : '')
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const mang = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const laBang = (x: unknown): x is MaBang => x === 'ht' || x === 'dp' || x === 'ch' || x === 'lu'

const docDiem = (x: unknown): DiemBon => {
  const o = dt(x) ?? {}
  return { ht: so(o.ht), dp: so(o.dp), ch: so(o.ch), lu: so(o.lu) }
}
const docDong = (x: unknown): DongBang | null => {
  const o = dt(x)
  const diem = so(o?.diem)
  if (!o || !s(o.sbd) || diem === null) return null
  return { sbd: s(o.sbd), hoTen: s(o.hoTen) || s(o.sbd), lop: s(o.lop), khoi: s(o.khoi), diem, bc: s(o.bc) }
}

/** Đọc trả lời `/gv/bon-bang`; sai dạng ⇒ null. Thuần (có test). */
export function docBonBang(du: unknown): TraLoiBonBang | null {
  const o = dt(du)
  const bangO = dt(o?.bang)
  if (!o || !bangO) return null
  const bang = Object.fromEntries(THU_TU_BANG.map((k) => [k, mang(bangO[k]).map(docDong).filter((d): d is DongBang => d !== null)])) as Record<MaBang, DongBang[]>
  return {
    ok: true,
    tu: s(o.tu),
    den: s(o.den),
    tinhLuc: s(o.tinhLuc),
    daTinh: so(o.daTinh) ?? 0,
    tong: so(o.tong) ?? 0,
    bang,
    trungVi: docDiem(o.trungVi),
    ...(Array.isArray(o.theoDoi) ? { theoDoi: mang(o.theoDoi).map(docDong).filter((d): d is DongBang => d !== null) } : {}),
  }
}

const docViDu = (x: unknown): ViDuBon | null => {
  const o = dt(x)
  if (!o || !s(o.cau)) return null
  return { luc: s(o.luc), cau: s(o.cau), phu: s(o.phu), kq: s(o.kq), dung: o.dung === true ? true : o.dung === false ? false : null }
}
const docThe = (x: unknown): TheBangChung | null => {
  const o = dt(x)
  if (!o || !s(o.tieu) || !s(o.lon)) return null
  const t: TheBangChung = { ma: s(o.ma) || s(o.tieu), tieu: s(o.tieu), lon: s(o.lon) }
  if (s(o.nhoSo)) t.nhoSo = s(o.nhoSo)
  const em = so(o.so), lop = so(o.lop)
  if (em !== null) t.so = Math.max(0, Math.min(100, em))
  if (lop !== null) t.lop = Math.max(0, Math.min(100, lop))
  const ch = dt(o.chuoi)
  if (ch && s(ch.chu)) t.chuoi = { chu: s(ch.chu), dung: mang(ch.dung).map(so).filter((n): n is number => n !== null) }
  const hai = mang(o.hai).map((h) => { const q = dt(h); return q && s(q.so) ? { nhan: s(q.nhan), so: s(q.so), phu: s(q.phu), ...(q.lech === true ? { lech: true } : {}) } : null }).filter((h): h is NonNullable<typeof h> => h !== null)
  if (hai.length) t.hai = hai
  const vd = mang(o.viDu).map(docViDu).filter((v): v is ViDuBon => v !== null)
  if (vd.length) t.viDu = vd
  if (s(o.chu)) t.chu = s(o.chu)
  return t
}
const docNgay = (x: unknown): NgayBon | null => {
  const o = dt(x)
  if (!o || !s(o.ngay)) return null
  return { ngay: s(o.ngay), muc: so(o.muc) ?? 0, ky: so(o.ky) ?? 0, voi: so(o.voi) ?? 0 }
}

/** Đọc trả lời `/gv/bon-bang/em`; sai dạng ⇒ null. Thuần (có test). */
export function docBangChung(du: unknown): TraLoiBangChung | null {
  const o = dt(du)
  const em = dt(o?.em)
  if (!o || !em || !s(em.sbd)) return null
  const hang = dt(o.hang)
  const thu = so(hang?.thu), tong = so(hang?.tong)
  return {
    ok: true,
    em: { sbd: s(em.sbd), hoTen: s(em.hoTen) || s(em.sbd), lop: s(em.lop) },
    tu: s(o.tu),
    den: s(o.den),
    tinhLuc: s(o.tinhLuc),
    diem: docDiem(o.diem),
    trungVi: docDiem(o.trungVi),
    soLuot: so(o.soLuot) ?? 0,
    bang: laBang(o.bang) ? o.bang : 'ht',
    hang: thu !== null && tong !== null ? { thu, tong } : null,
    ketLuan: s(o.ketLuan),
    the: mang(o.the).map(docThe).filter((t): t is TheBangChung => t !== null),
    ngay: mang(o.ngay).map(docNgay).filter((n): n is NgayBon => n !== null),
  }
}

// ───────────── bộ nhớ đệm 4 bảng (vẽ ngay bản lần trước) ─────────────
const KHOA_DEM = 'ddh.gvhn.bon.v1'
let demBo: { luc: number; du: TraLoiBonBang } | null = null

/** Bản 4 bảng lần trước (bộ nhớ, rồi localStorage). Không có / hỏng ⇒ null. */
export function docDemBonBang(): { luc: number; du: TraLoiBonBang } | null {
  if (demBo) return demBo
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KHOA_DEM) : null
    const o = raw ? (JSON.parse(raw) as { luc?: unknown; du?: unknown }) : null
    const du = o ? docBonBang(o.du) : null
    const luc = so(o?.luc)
    if (du && luc !== null) demBo = { luc, du }
  } catch {
    // localStorage bị chặn / hỏng ⇒ coi như chưa có
  }
  return demBo
}
function ghiDemBonBang(du: TraLoiBonBang, luc: number): void {
  demBo = { luc, du }
  try {
    localStorage.setItem(KHOA_DEM, JSON.stringify(demBo))
  } catch {
    // đầy / bị chặn ⇒ chỉ giữ trong bộ nhớ
  }
}
/** Chỉ cho test. */
export function xoaDemBonBang(): void {
  demBo = null
  try { localStorage.removeItem(KHOA_DEM) } catch { /* bỏ qua */ }
}

export async function layBonBang(): Promise<KetQuaLenh<TraLoiBonBang>> {
  const r = await goiLenh('/gv/bon-bang', {}, CHU_CHUA_CO)
  if (!r.ok) return r
  const du = docBonBang(r.du)
  if (!du) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả 4 bảng không đúng dạng.' }
  ghiDemBonBang(du, Date.now())
  return { ok: true, du }
}

export async function layBangChung(sbd: string, bang: MaBang): Promise<KetQuaLenh<TraLoiBangChung>> {
  const r = await goiLenh('/gv/bon-bang/em', { sbd, bang }, CHU_CHUA_CO)
  if (!r.ok) return r
  const du = docBangChung(r.du)
  return du ? { ok: true, du } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả bằng chứng không đúng dạng.' }
}
