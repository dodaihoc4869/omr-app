// HÀNH TRÌNH GIỎI HÓA — một chiến dịch sống lâu cho mỗi khối.
// Bảng phụ giữ danh tính hành trình; bảng chien_dich cũ vẫn là nguồn câu/sổ sự kiện để mọi màn cũ tiếp tục chạy.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { khoiCuaLop, khoiCuaMaDe, type Khoi } from '../../src/lib/khoi-cau'
import { xoaDemCauHinh } from './cau-hinh-dem'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mang = (v: unknown): string[] => {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.map(str).map((x) => x.trim()).filter(Boolean) : []
  } catch { return [] }
}
const hop = (...ds: readonly (readonly string[])[]): string[] => [...new Set(ds.flat().map((x) => x.trim()).filter(Boolean))]

export const HAN_HANH_TRINH = '9999-12-31'
export const CUA_SO_HANH_TRINH_NGAY = 7
export const KHOA_BAT_KE_HOACH_PHUT = 'chien_dich_phut_v1'
/** Khoá phát hành một lần: cron tự gộp dữ liệu thật sau khi Worker mới lên, không cần thầy mở màn hình. */
export const KHOA_HOP_NHAT_0810 = 'hanh_trinh_gioi_hoa_hop_nhat_0810_v1'
export const SQL_HANH_TRINH_GIOI_HOA: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS hanh_trinh_gioi_hoa (
    khoi TEXT PRIMARY KEY, chien_dich_id TEXT NOT NULL UNIQUE, phien_ban INTEGER NOT NULL DEFAULT 1,
    tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_hop_nhat (
    chien_dich_cu TEXT PRIMARY KEY, chien_dich_moi TEXT NOT NULL, khoi TEXT NOT NULL, hop_nhat_luc TEXT NOT NULL
  )`,
]

export function damBaoBangHanhTrinh(env: Env): Promise<void> {
  return chayDdlMotLan(env, 'hanh_trinh_gioi_hoa', SQL_HANH_TRINH_GIOI_HOA)
}

export async function docKhoiHanhTrinhMap(env: Env, ids: readonly string[]): Promise<Map<string, Khoi>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT chien_dich_id, khoi FROM hanh_trinh_gioi_hoa WHERE chien_dich_id IN (SELECT value FROM json_each(?))')
    .bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, Khoi>()
  for (const x of r.results ?? []) {
    const k = Number(x.khoi)
    if (k === 10 || k === 11 || k === 12) ra.set(str(x.chien_dich_id), k)
  }
  return ra
}

export interface BoSungHanhTrinh {
  khoi: Khoi
  sbd: readonly string[]
  maDe: readonly string[]
  qids: readonly string[]
  nowMs: number
  /** Giữ mốc sớm nhất khi gộp chiến dịch cũ để không làm mất lịch sử năng lực. */
  mocSomNhat?: string | null
}

/** Tạo hoặc nối câu/em vào đúng một Hành trình của khối; lặp lại an toàn, không nhân đôi câu. */
export async function boSungHanhTrinh(env: Env, v: BoSungHanhTrinh): Promise<{ id: string; daCo: boolean; soCau: number; soEm: number }> {
  await damBaoBangHanhTrinh(env)
  const luc = new Date(v.nowMs).toISOString()
  const khoa = String(v.khoi)
  const map = await env.DB.prepare('SELECT chien_dich_id FROM hanh_trinh_gioi_hoa WHERE khoi = ?').bind(khoa).first<Row>()
  let id = str(map?.chien_dich_id)
  const daCo = !!id
  if (!id) id = `hanh-trinh-gioi-hoa-khoi-${khoa}`

  const sbdMoi = hop(v.sbd)
  const maDeMoi = hop(v.maDe)
  const qidsMoi = hop(v.qids)
  const moc = [str(v.mocSomNhat), luc].filter(Boolean).sort()[0]!

  await env.DB.batch([
    // Tạo một lần rồi hợp các mảng bằng SQL. Mỗi UPDATE đọc trạng thái vừa được commit nên hai lớp
    // bổ sung gần như đồng thời cũng không thể ghi đè/mất câu của nhau.
    env.DB.prepare(`INSERT OR IGNORE INTO chien_dich
      (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai)
      VALUES (?,?,?,?,?,?,?,?,0,NULL,?,'dang_chay')`)
      .bind(id, `Hành trình giỏi Hóa · Khối ${khoa}`, `Khối ${khoa}`, JSON.stringify(sbdMoi), JSON.stringify(maDeMoi), JSON.stringify(qidsMoi), HAN_HANH_TRINH, 40, moc),
    env.DB.prepare(`UPDATE chien_dich SET
      ten=?, lop=?,
      sbd_json=(SELECT json_group_array(value) FROM (
        SELECT value FROM json_each(COALESCE(chien_dich.sbd_json,'[]'))
        UNION SELECT value FROM json_each(?)
      )),
      ma_de_json=(SELECT json_group_array(value) FROM (
        SELECT value FROM json_each(COALESCE(chien_dich.ma_de_json,'[]'))
        UNION SELECT value FROM json_each(?)
      )),
      qid_json=(SELECT json_group_array(value) FROM (
        SELECT value FROM json_each(COALESCE(chien_dich.qid_json,'[]'))
        UNION SELECT value FROM json_each(?)
      )),
      han_nop=?, the_luc_ngay=40, huyet_chien=0, trang_thai='dang_chay', dong_luc=NULL,
      tao_luc=CASE WHEN COALESCE(tao_luc,'')='' OR tao_luc>? THEN ? ELSE tao_luc END
      WHERE id=?`)
      .bind(`Hành trình giỏi Hóa · Khối ${khoa}`, `Khối ${khoa}`, JSON.stringify(sbdMoi), JSON.stringify(maDeMoi), JSON.stringify(qidsMoi), HAN_HANH_TRINH, moc, moc, id),
    env.DB.prepare(`INSERT INTO hanh_trinh_gioi_hoa (khoi, chien_dich_id, phien_ban, tao_luc, cap_nhat_luc)
      VALUES (?,?,1,?,?) ON CONFLICT(khoi) DO UPDATE SET chien_dich_id=excluded.chien_dich_id,
      phien_ban=hanh_trinh_gioi_hoa.phien_ban+1, cap_nhat_luc=excluded.cap_nhat_luc`).bind(khoa, id, luc, luc),
    env.DB.prepare(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)
      ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri, cap_nhat_luc=excluded.cap_nhat_luc`)
      .bind(KHOA_BAT_KE_HOACH_PHUT, JSON.stringify({ mode: 'active', phienBan: 1 }), luc),
  ])
  xoaDemCauHinh(env, KHOA_BAT_KE_HOACH_PHUT)
  const sau = await env.DB.prepare('SELECT sbd_json, qid_json FROM chien_dich WHERE id=?').bind(id).first<Row>()
  return { id, daCo, soCau: mang(sau?.qid_json).length, soEm: mang(sau?.sbd_json).length }
}

function khoiCuaDong(r: Row): Khoi | null {
  const tuLop = khoiCuaLop(r.lop)
  if (tuLop) return tuLop
  const ks = new Set(mang(r.ma_de_json).map(khoiCuaMaDe).filter((x): x is Khoi => x !== null))
  return ks.size === 1 ? [...ks][0]! : null
}

/**
 * Gộp mọi chiến dịch đang mở vào một Hành trình/khối. Không xoá dòng cũ: đóng + ghi bản đồ audit.
 * Kế hoạch hôm nay được đánh dấu cần đối chiếu; lần mở kế tiếp lập lại phần chưa làm, giữ câu đã hoàn thành từ sổ sự kiện.
 */
export async function hopNhatChienDichDangMo(env: Env, nowMs: number): Promise<{ khoi: { khoi: Khoi; id: string; soChienDich: number; soCau: number; soEm: number }[]; boQua: string[] }> {
  await damBaoBangHanhTrinh(env)
  const luc = new Date(nowMs).toISOString()
  const homNay = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
  const [rCd, rHt, rHs, rDs] = await Promise.all([
    env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai='dang_chay'").all<Row>(),
    env.DB.prepare('SELECT khoi, chien_dich_id FROM hanh_trinh_gioi_hoa').all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare("SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai,'') <> 'khoa'").all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT sbd, lop FROM danh_sach').all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const idHt = new Set((rHt.results ?? []).map((x) => str(x.chien_dich_id)))
  const theo = new Map<Khoi, Row[]>()
  const boQua: string[] = []
  for (const r of rCd.results ?? []) {
    if (idHt.has(str(r.id))) continue
    const k = khoiCuaDong(r)
    if (!k) { boQua.push(str(r.id)); continue }
    theo.set(k, [...(theo.get(k) ?? []), r])
  }
  // Học sinh hiện có của khối cũng được nối vào hành trình; phạm vi bài đã dạy của lớp vẫn là cổng câu cuối.
  const hsTheo = new Map<Khoi, Set<string>>([[10, new Set()], [11, new Set()], [12, new Set()]])
  for (const r of [...(rHs.results ?? []), ...(rDs.results ?? [])]) {
    const k = khoiCuaLop(r.ten_lop) ?? khoiCuaLop(r.lop)
    const s = str(r.sbd).trim()
    if (k && s) hsTheo.get(k)!.add(s)
  }
  const ra: { khoi: Khoi; id: string; soChienDich: number; soCau: number; soEm: number }[] = []
  for (const k of [10, 11, 12] as const) {
    const ds = theo.get(k) ?? []
    const coHt = (rHt.results ?? []).find((x) => Number(x.khoi) === k)
    if (!ds.length && !coHt) continue
    const sbd = hop([...hsTheo.get(k)!], ...ds.map((x) => mang(x.sbd_json)))
    const maDe = hop(...ds.map((x) => mang(x.ma_de_json)))
    const qids = hop(...ds.map((x) => mang(x.qid_json)))
    const moc = ds.map((x) => str(x.tao_luc)).filter(Boolean).sort()[0] ?? luc
    const ht = await boSungHanhTrinh(env, { khoi: k, sbd, maDe, qids, nowMs, mocSomNhat: moc })
    const ids = ds.map((x) => str(x.id)).filter((id) => id && id !== ht.id)
    if (ids.length) {
      const arr = JSON.stringify(ids)
      await env.DB.batch([
        env.DB.prepare("UPDATE chien_dich SET trang_thai='da_dong', dong_luc=? WHERE id IN (SELECT value FROM json_each(?)) AND trang_thai='dang_chay'").bind(luc, arr),
        env.DB.prepare('UPDATE bai_da_day SET chien_dich_id=? WHERE chien_dich_id IN (SELECT value FROM json_each(?))').bind(ht.id, arr),
        env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_hop_nhat (chien_dich_cu, chien_dich_moi, khoi, hop_nhat_luc)
          SELECT value, ?, ?, ? FROM json_each(?)`).bind(ht.id, String(k), luc, arr),
      ])
    }
    // Buộc đối chiếu lại toàn bộ kế hoạch của hôm nay khi em mở app; sổ đã làm vẫn được giữ bởi bộ lập kế hoạch.
    if (sbd.length) {
      const arrSbd = JSON.stringify(sbd)
      await env.DB.prepare("UPDATE srs2_ke_hoach_omni SET chien_dich_json='[]', cap_nhat_luc=? WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))")
        .bind(luc, homNay, arrSbd).run().catch(() => null)
      await env.DB.prepare("UPDATE srs2_ke_hoach_phut SET trang_thai='can_phan_lai', cap_nhat_luc=? WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))")
        .bind(luc, homNay, arrSbd).run().catch(() => null)
    }
    ra.push({ khoi: k, id: ht.id, soChienDich: ids.length, soCau: ht.soCau, soEm: ht.soEm })
  }
  return { khoi: ra, boQua }
}

/**
 * Tác vụ phát hành idempotent. Cron phút đầu tiên sau khi Worker mới được triển khai sẽ gộp các chiến dịch đang mở
 * và ghi biên nhận; những phút sau chỉ tốn một lượt đọc. Nếu lượt đầu lỗi, không có biên nhận nên cron tự thử lại.
 */
export async function hopNhatChienDichDangMoMotLan(env: Env, nowMs: number): Promise<{
  chay: boolean
  ketQua?: Awaited<ReturnType<typeof hopNhatChienDichDangMo>>
}> {
  const da = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').bind(KHOA_HOP_NHAT_0810).first<Row>().catch(() => null)
  if (str(da?.gia_tri).includes('"trangThai":"xong"')) return { chay: false }
  const ketQua = await hopNhatChienDichDangMo(env, nowMs)
  const luc = new Date(nowMs).toISOString()
  await env.DB.prepare(`INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?)
    ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri, cap_nhat_luc=excluded.cap_nhat_luc`)
    .bind(KHOA_HOP_NHAT_0810, JSON.stringify({ trangThai: 'xong', luc, ketQua }), luc).run()
  return { chay: true, ketQua }
}
