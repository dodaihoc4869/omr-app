// HỌC LIỆU BỔ TRỢ TỪNG CÂU — Vòng học khép kín v2. Kho đề mang thêm 3 trường (chỉ thêm, GĐ1 soạn bằng máy + Python kiểm):
//   · `song_sinh`: 2 câu cùng cách giải, đổi số liệu ({de, pa?, dap_an, buoc, gia_tri_dung}) — làm lại kín không nhớ đáp án.
//   · `cau_kiem`: câu hỏi kiểm từng bước lời giải ({buoc, kieu: so|chon, hoi, dap_an|lua_chon+dung, sai_so}) — đọc lời giải chủ động.
//   · `nhan_nen`: nhãn kiến thức nền của từng bước ({buoc, nen}) — hỏng bước nào thì luyện nền đó.
// Đọc gói R2 mỗi lần em làm thì quá chậm ⇒ lúc NẠP ĐỀ (mọi đường nạp đi qua `dayDeKho` → móc này) chép 3 trường vào bảng `cau_bo_tro`
// theo BĂM nội dung câu (bản trùng ở nhiều đề dùng chung một dòng). Bảng CHỈ THÊM, tự tạo lần đầu dùng; bản SQL: migration-0210-v2.sql.
import type { D1PreparedStatement, Env } from './kieu'
import { bamCau, cauTrongGoi } from '../../src/lib/loi-giai-kiem'
import { bangSongSinh } from '../../src/lib/bang-song-sinh'

type Obj = Record<string, unknown>
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

export interface SongSinh { de: string; pa?: Record<string, string>; bang?: string[][]; dap_an: string; buoc?: string[]; gia_tri_dung?: string }
export interface CauKiem { buoc: number; kieu: 'so' | 'chon'; hoi: string; dap_an?: string; sai_so?: string; lua_chon?: string[]; dung?: number }
export interface NhanNen { buoc: number; nen: string }
export interface BoTro { bam: string; qidMau: string; songSinh: SongSinh[]; cauKiem: CauKiem[]; nhanNen: NhanNen[]; buoc: string[] }

const TAO_BANG = [
  `CREATE TABLE IF NOT EXISTS cau_bo_tro (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, song_sinh_json TEXT, cau_kiem_json TEXT, nhan_nen_json TEXT, buoc_json TEXT, cap_nhat_luc TEXT NOT NULL)`,
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangBoTro(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(TAO_BANG.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

/** Lọc học liệu bổ trợ của một câu kho thô (dữ liệu máy soạn — chỉ giữ trường đúng kiểu). */
export function locBoTro(c: Obj): { songSinh: SongSinh[]; cauKiem: CauKiem[]; nhanNen: NhanNen[]; buoc: string[] } {
  const ss = Array.isArray(c.song_sinh) ? c.song_sinh.filter((x): x is Obj => laObj(x) && typeof x.de === 'string' && x.dap_an != null) : []
  const songSinh = ss.slice(0, 2).map((x) => ({
    de: String(x.de), dap_an: String(x.dap_an),
    ...(bangSongSinh(x.bang) ? { bang: bangSongSinh(x.bang) } : {}),
    ...(laObj(x.pa) ? { pa: Object.fromEntries(Object.entries(x.pa).map(([k, v]) => [k, String(v)])) } : {}),
    ...(Array.isArray(x.buoc) ? { buoc: x.buoc.map(String) } : {}),
    ...(x.gia_tri_dung != null ? { gia_tri_dung: String(x.gia_tri_dung) } : {}),
  }))
  const ck = Array.isArray(c.cau_kiem) ? c.cau_kiem.filter((x): x is Obj => laObj(x) && Number.isInteger(x.buoc) && (x.kieu === 'so' || x.kieu === 'chon') && typeof x.hoi === 'string') : []
  const cauKiem = ck.map((x) => x.kieu === 'so'
    ? { buoc: Number(x.buoc), kieu: 'so' as const, hoi: String(x.hoi), dap_an: String(x.dap_an ?? ''), sai_so: String(x.sai_so ?? '0.01') }
    : { buoc: Number(x.buoc), kieu: 'chon' as const, hoi: String(x.hoi), lua_chon: Array.isArray(x.lua_chon) ? x.lua_chon.map(String) : [], dung: Number(x.dung) })
  const nn = Array.isArray(c.nhan_nen) ? c.nhan_nen.filter((x): x is Obj => laObj(x) && Number.isInteger(x.buoc) && typeof x.nen === 'string') : []
  const lg = laObj(c.loi_giai) ? c.loi_giai : {}
  const buoc = Array.isArray(lg.buoc) ? lg.buoc.map(String) : []
  return { songSinh, cauKiem, nhanNen: nn.map((x) => ({ buoc: Number(x.buoc), nen: String(x.nen) })), buoc }
}

/** Các câu thô của gói kèm phần (để `cauTrongGoi` dựng qid đúng như mọi nơi khác). */
function cauTho(goi: unknown): { c: Obj; phan?: 'I' | 'II' | 'III' }[] {
  if (!laObj(goi)) return []
  if (Array.isArray(goi.cau)) return goi.cau.filter(laObj).map((c) => ({ c }))
  if (Array.isArray(goi.items)) return goi.items.filter(laObj).map((c) => ({ c }))
  const ra: { c: Obj; phan?: 'I' | 'II' | 'III' }[] = []
  for (const p of ['I', 'II', 'III'] as const) { const v = goi[`phan${p}`]; if (Array.isArray(v)) v.filter(laObj).forEach((c) => ra.push({ c, phan: p })) }
  return ra
}

/** Móc nạp đề: chép học liệu bổ trợ của gói vào `cau_bo_tro`. Câu không có trường nào thì bỏ qua (không xoá dòng cũ của bản trùng). */
export async function ghiCauBoTro(env: Env, maDe: string, goi: unknown): Promise<number> {
  await damBaoBangBoTro(env)
  const nay = new Date().toISOString()
  const lenh: D1PreparedStatement[] = []
  for (const { c, phan } of cauTho(goi)) {
    const bt = locBoTro(c)
    if (!bt.songSinh.length && !bt.cauKiem.length && !bt.nhanNen.length) continue
    const k = cauTrongGoi(maDe, phan ? { [`phan${phan}`]: [c] } : { cau: [c] })[0]
    if (!k) continue
    const bam = await bamCau(k)
    lenh.push(env.DB.prepare(
      `INSERT INTO cau_bo_tro (bam, qid_mau, song_sinh_json, cau_kiem_json, nhan_nen_json, buoc_json, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(bam) DO UPDATE SET qid_mau=excluded.qid_mau, song_sinh_json=excluded.song_sinh_json, cau_kiem_json=excluded.cau_kiem_json,
         nhan_nen_json=excluded.nhan_nen_json, buoc_json=excluded.buoc_json, cap_nhat_luc=excluded.cap_nhat_luc`,
    ).bind(bam, k.qid, JSON.stringify(bt.songSinh), JSON.stringify(bt.cauKiem), JSON.stringify(bt.nhanNen), JSON.stringify(bt.buoc), nay))
  }
  for (let i = 0; i < lenh.length; i += 100) await env.DB.batch(lenh.slice(i, i + 100))
  return lenh.length
}

const docJson = <T>(s: unknown): T[] => { try { const v = JSON.parse(String(s ?? '[]')); return Array.isArray(v) ? v as T[] : [] } catch { return [] } }

/** Một dòng `cau_bo_tro` → BoTro. */
export const dongBoTro = (x: Obj): BoTro => ({
  bam: String(x.bam), qidMau: String(x.qid_mau), songSinh: docJson<SongSinh>(x.song_sinh_json), cauKiem: docJson<CauKiem>(x.cau_kiem_json),
  nhanNen: docJson<NhanNen>(x.nhan_nen_json), buoc: docJson<string>(x.buoc_json),
})

/** Học liệu bổ trợ theo băm (≤ 90 băm mỗi truy vấn). Băm chưa có ⇒ vắng trong Map. */
export async function docBoTro(env: Env, bams: readonly string[]): Promise<Map<string, BoTro>> {
  await damBaoBangBoTro(env)
  const ra = new Map<string, BoTro>()
  const ds = [...new Set(bams.filter(Boolean))]
  for (let i = 0; i < ds.length; i += 90) {
    const lo = ds.slice(i, i + 90)
    const r = await env.DB.prepare(`SELECT * FROM cau_bo_tro WHERE bam IN (${lo.map(() => '?').join(',')})`).bind(...lo).all<Obj>()
    for (const x of r.results ?? []) ra.set(String(x.bam), dongBoTro(x))
  }
  return ra
}
