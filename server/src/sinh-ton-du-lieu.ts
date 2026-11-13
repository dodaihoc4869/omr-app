// DỮ LIỆU NGOÀI TRẬN của trò «Sinh Tồn · Trang vở» (đợt 4 — đặc tả docs/dac-ta-sinh-ton-v2-1311.md mục 8–10 + mục 4): tủ đồ bé ma, thành tích, đội cả học kỳ,
// thi đua đội tuần, danh hiệu tuần. Lõi thuần (danh mục đồ, quyền mặc, huy hiệu, tuần / học kỳ, xét danh hiệu) ở src/lib/live-khoi/tu-do.ts — dùng chung máy em.
//
// ĐƯỜNG (Worker chỉ nhận POST — thân JSON; index.ts chuyển MỘT dòng mọi `/sinh-ton/*` vào đây, trước cổng mã bí mật):
//  · `/sinh-ton/tu-do`  (em: `token` game HOẶC `ve` = vé phòng chờ ca): cấp EXP, chuỗi ngày, đồ đã mở + đang mặc, thành tích + huy hiệu, đội cả kỳ,
//    danh hiệu tuần của em (trao từ tuần trước), thi đua tuần của LỚP em (4 vạch, không tên bạn). Đọc SONG SONG một đợt; em chưa có đội cả kỳ ⇒ gán (một lô, một lần / học kỳ).
//  · `/sinh-ton/mac`    (em): mặc đồ — máy chủ KIỂM quyền mở theo cấp + chuỗi đọc lại tại chỗ, lưu `st_mac`.
//  · `/sinh-ton/thi-dua` (thầy, mã bí mật; `khoi` 10/11/12 hoặc `lop`): 4 vạch tuần này + người đang dẫn danh hiệu tuần này + danh hiệu tuần trước (có tên).
// GHI CUỐI VÁN: `ghiCuoiVanSinhTon` (bước ghép gọi khi đóng phòng / mỗi 5 ván) — MỘT `batch` cho cả phòng, bỏ máy bù (`~…`) và bé ma Thầy.
// Bảng CHỈ-THÊM, tạo tại chỗ bằng `chayDdlMotLan` CHỈ ở đường ghi; đường đọc bảng chưa có ⇒ coi như rỗng.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { kiemVeDau, tenGoi } from './dau-ion-ve'
import { chuoiBaiNeuBat } from './chuoi-ngay-bai-d1'
import { docChuoiNgayHoc } from './chuoi-ngay-hoc'
import { khoiTuLop } from './live-khoi'
import {
  DANH_HIEU, chuTuan, chuanMac, dsDaMo, huyHieuDat, kiemMac, maHocKy, maTuan, tuanTruoc, xetDanhHieu,
  type BoMac, type DongTuan, type ThanhTich, type TienDoEm,
} from '../../src/lib/live-khoi/tu-do'

type Row = Record<string, unknown>
type Dong = Record<string, unknown>

export const SQL_SINH_TON_DU_LIEU = [
  'CREATE TABLE IF NOT EXISTS st_mac (sbd TEXT PRIMARY KEY, mu TEXT, ao TEXT, dan TEXT, ha TEXT, luc INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS st_tuan (tuan TEXT NOT NULL, sbd TEXT NOT NULL, doi INTEGER, ha INTEGER NOT NULL DEFAULT 0, bi_ha INTEGER NOT NULL DEFAULT 0, ha_thay INTEGER NOT NULL DEFAULT 0, diet_tk INTEGER NOT NULL DEFAULT 0, van INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tuan, sbd))',
  'CREATE TABLE IF NOT EXISTS st_thanh_tich (sbd TEXT PRIMARY KEY, ha INTEGER NOT NULL DEFAULT 0, chuoi_max INTEGER NOT NULL DEFAULT 0, thu_khoa INTEGER NOT NULL DEFAULT 0, ha_thay INTEGER NOT NULL DEFAULT 0, van INTEGER NOT NULL DEFAULT 0, luc INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS st_doi_ky (sbd TEXT NOT NULL, ky TEXT NOT NULL, doi INTEGER NOT NULL, luc INTEGER NOT NULL, PRIMARY KEY (sbd, ky))',
  'CREATE INDEX IF NOT EXISTS idx_st_doi_ky_ky ON st_doi_ky (ky, doi)',
] as const
/** Tạo bảng (một lần mỗi isolate) — chỉ đường GHI gọi. */
export const taoBang = (env: Env) => chayDdlMotLan(env, 'sinh_ton_du_lieu', SQL_SINH_TON_DU_LIEU)

const so0 = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }
const RE_SBD = /^[A-Za-z0-9_-]{1,40}$/
/** Em thật: số báo danh hợp lệ, không phải máy bù (`~…`), không phải bé ma Thầy. */
export const laEmThat = (id: unknown, idThay?: string): id is string => typeof id === 'string' && RE_SBD.test(id) && id !== idThay && id !== 'gv' && id !== 'thay'
/** Lớp để chia đội / thi đua: tên lớp thầy đặt, không có thì cột `lop` (cùng biểu thức ở SQL dưới). */
const SQL_LOP = "COALESCE(NULLIF(h.ten_lop, ''), h.lop)"
const bamSbd = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 4 }
/** Gán đội cả kỳ LẦN ĐẦU: đội đang ít em nhất trong cùng lớp ở học kỳ này (hoà ⇒ xoay theo băm số báo danh). Đã có ⇒ bỏ qua (INSERT OR IGNORE). */
const SQL_GAN_DOI = `INSERT OR IGNORE INTO st_doi_ky (sbd, ky, doi, luc)
  SELECT ?1, ?2, d.doi, ?4 FROM (SELECT 0 AS doi UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) d
  LEFT JOIN (SELECT k.doi, COUNT(*) AS n FROM st_doi_ky k JOIN hoc_sinh h ON h.sbd = k.sbd
    WHERE k.ky = ?2 AND ${SQL_LOP} = (SELECT ${SQL_LOP} FROM hoc_sinh h WHERE h.sbd = ?1) GROUP BY k.doi) c ON c.doi = d.doi
  ORDER BY COALESCE(c.n, 0), (d.doi + 4 - ?3) % 4 LIMIT 1`
const ganDoi = (env: Env, sbd: string, ky: string, luc: number) => env.DB.prepare(SQL_GAN_DOI).bind(sbd, ky, bamSbd(sbd), luc)

/** Kết quả một em (cộng dồn từ một hay nhiều ván của phòng). `doi` (đội trong trận) KHÔNG dùng cho thi đua tuần: thi đua luôn theo ĐỘI CẢ KỲ. */
export interface KetQuaVanEm { id: string; ha?: number; biHa?: number; haThay?: number; dietTk?: number; chuoiMax?: number; thuKhoa?: number; van?: number; doi?: number }

/**
 * GHI CUỐI VÁN cho cả phòng — MỘT `DB.batch` (sau DDL một lần mỗi isolate): mỗi em thật một lệnh gán đội cả kỳ (nếu chưa có), rồi hai lệnh gộp `json_each`
 * cộng dồn `st_tuan` (tuần VN của `phong.luc`) và `st_thanh_tich` (kỷ lục hạ liền lấy MAX). Bỏ máy bù (`~…`), bé ma Thầy (`phong.idThay`), id sai dạng.
 * Trả số em đã ghi. Không ai ⇒ 0 lệnh D1.
 */
export async function ghiCuoiVanSinhTon(env: Env, phong: { ma: string; luc?: number; idThay?: string }, dsKetQua: readonly KetQuaVanEm[]): Promise<{ ghi: number }> {
  const luc = Number.isFinite(phong.luc) ? Number(phong.luc) : Date.now()
  const gop = new Map<string, Required<Omit<KetQuaVanEm, 'id' | 'doi'>>>()
  for (const k of dsKetQua) {
    if (!k || !laEmThat(k.id, phong.idThay)) continue
    const c = gop.get(k.id) ?? { ha: 0, biHa: 0, haThay: 0, dietTk: 0, chuoiMax: 0, thuKhoa: 0, van: 0 }
    c.ha += so0(k.ha); c.biHa += so0(k.biHa); c.haThay += so0(k.haThay); c.dietTk += so0(k.dietTk); c.thuKhoa += so0(k.thuKhoa)
    c.van += k.van == null ? 1 : so0(k.van); c.chuoiMax = Math.max(c.chuoiMax, so0(k.chuoiMax))
    gop.set(k.id, c)
  }
  if (!gop.size) return { ghi: 0 }
  await taoBang(env)
  const ky = maHocKy(luc), tuan = maTuan(luc)
  const ds = JSON.stringify([...gop].map(([s, c]) => ({ s, ...c })))
  await env.DB.batch([
    ...[...gop.keys()].map((s) => ganDoi(env, s, ky, luc)),
    env.DB.prepare(`INSERT INTO st_tuan (tuan, sbd, doi, ha, bi_ha, ha_thay, diet_tk, van)
      SELECT ?1, j.s, (SELECT k.doi FROM st_doi_ky k WHERE k.sbd = j.s AND k.ky = ?2), j.ha, j.bi_ha, j.ha_thay, j.diet_tk, j.van
      FROM (SELECT json_extract(value, '$.s') AS s, json_extract(value, '$.ha') AS ha, json_extract(value, '$.biHa') AS bi_ha, json_extract(value, '$.haThay') AS ha_thay,
        json_extract(value, '$.dietTk') AS diet_tk, json_extract(value, '$.van') AS van FROM json_each(?3)) j WHERE true
      ON CONFLICT (tuan, sbd) DO UPDATE SET doi = excluded.doi, ha = ha + excluded.ha, bi_ha = bi_ha + excluded.bi_ha, ha_thay = ha_thay + excluded.ha_thay,
        diet_tk = diet_tk + excluded.diet_tk, van = van + excluded.van`).bind(tuan, ky, ds),
    env.DB.prepare(`INSERT INTO st_thanh_tich (sbd, ha, chuoi_max, thu_khoa, ha_thay, van, luc)
      SELECT json_extract(value, '$.s'), json_extract(value, '$.ha'), json_extract(value, '$.chuoiMax'), json_extract(value, '$.thuKhoa'), json_extract(value, '$.haThay'),
        json_extract(value, '$.van'), ?2 FROM json_each(?1) WHERE true
      ON CONFLICT (sbd) DO UPDATE SET ha = ha + excluded.ha, chuoi_max = MAX(chuoi_max, excluded.chuoi_max), thu_khoa = thu_khoa + excluded.thu_khoa,
        ha_thay = ha_thay + excluded.ha_thay, van = van + excluded.van, luc = excluded.luc`).bind(ds, luc),
  ])
  return { ghi: gop.size }
}

// ── Xác thực em: vé phòng chờ ca (`ve`, chỉ kiểm chữ ký — 0 D1) hoặc token game (`token`, hai bước: biết sbd ngay, mật khẩu kiểm song song lượt đọc) ──
async function emSom(env: Env, b: Dong): Promise<{ sbd: string; xong: Promise<string> }> {
  if (typeof b.ve === 'string' && b.ve) {
    const v = await kiemVeDau(String(env.MA_BI_MAT ?? ''), b.ve)
    if (!v) throw new Error('Phiên chơi đã hết hạn. Em tải lại trang.')
    return { sbd: v.s, xong: Promise.resolve(v.s) }
  }
  return gameIdentityHaiBuoc(env, b)
}
const rongNeuLoi = <T>(p: Promise<T>, rong: T): Promise<T> => p.catch(() => rong)
const tatCa = (env: Env, sql: string, ...v: unknown[]) => rongNeuLoi(env.DB.prepare(sql).bind(...v).all<Row>().then((r) => r.results ?? []), [] as Row[])
const mot = (env: Env, sql: string, ...v: unknown[]) => rongNeuLoi(env.DB.prepare(sql).bind(...v).first<Row>(), null)

/** Cấp EXP (thần thú) + chuỗi ngày (chuỗi theo chặng nếu bật cho em, không thì chuỗi ngày cũ) — hai nguồn đọc song song. */
function docTienDo(env: Env, envDoc: Env, sbd: string, nay: number): Promise<TienDoEm> {
  return Promise.all([
    mot(envDoc, "SELECT json_extract(json, '$.cap') AS cap FROM game_v2_profile WHERE sbd = ?", sbd),
    chuoiBaiNeuBat(env, sbd, nay, envDoc).catch(() => null),
    docChuoiNgayHoc(envDoc, sbd, nay).catch(() => 0),
  ]).then(([p, bai, cu]) => ({ cap: so0(p?.cap), chuoi: bai ? so0(bai.so) : so0(cu) }))
}
const lopCuaDong = (r: Row | null): string => String((r?.ten_lop as string) || (r?.lop as string) || (r?.lop_ds as string) || '')
const dongTuan = (r: Row): DongTuan => ({ sbd: String(r.sbd), ha: so0(r.ha), dietTk: so0(r.diet_tk), haThay: so0(r.ha_thay) })
const vachDoi = (ds: readonly Row[]): number[] => { const v = [0, 0, 0, 0]; for (const r of ds) { const d = Number(r.doi); if (d >= 0 && d < 4) v[d]! += so0(r.ha) } return v }
const SQL_TUAN_HAI = `SELECT t.tuan, t.sbd, t.doi, t.ha, t.diet_tk, t.ha_thay, h.lop, h.ten_lop, h.ho_ten FROM st_tuan t LEFT JOIN hoc_sinh h ON h.sbd = t.sbd WHERE t.tuan IN (?, ?)`

/** Tủ đồ + thành tích + thẻ sảnh của em (một đợt đọc song song). */
export async function hsTuDo(env: Env, b: Dong, envDoc: Env = env, nay = Date.now()): Promise<Dong> {
  let em: { sbd: string; xong: Promise<string> }
  try { em = await emSom(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const sbd = em.sbd, ky = maHocKy(nay), tuan = maTuan(nay), truoc = tuanTruoc(tuan)
  const pTien = docTienDo(env, envDoc, sbd, nay)
  const pDoc = Promise.all([
    mot(envDoc, 'SELECT mu, ao, dan, ha FROM st_mac WHERE sbd = ?', sbd),
    mot(envDoc, 'SELECT ha, chuoi_max, thu_khoa, ha_thay, van FROM st_thanh_tich WHERE sbd = ?', sbd),
    mot(envDoc, 'SELECT doi FROM st_doi_ky WHERE sbd = ? AND ky = ?', sbd, ky),
    mot(envDoc, "SELECT h.lop, h.ten_lop, (SELECT lop FROM danh_sach WHERE sbd = x.s LIMIT 1) AS lop_ds FROM (SELECT ? AS s) x LEFT JOIN hoc_sinh h ON h.sbd = x.s", sbd),
    tatCa(envDoc, SQL_TUAN_HAI, tuan, truoc),
  ])
  pDoc.catch(() => 0); pTien.catch(() => 0)
  try { await em.xong } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const [tien, [mac, tt, doiKy, lopEm, tuanHai]] = await Promise.all([pTien, pDoc])
  let doi = doiKy == null ? null : Number(doiKy.doi)
  if (doi == null || !(doi >= 0 && doi < 4)) {
    // Lần đầu trong học kỳ: gán đội (một lô: gán + đọc lại) — chỉ một lần mỗi em mỗi học kỳ.
    try {
      await taoBang(env)
      const r = await env.DB.batch([ganDoi(env, sbd, ky, nay), env.DB.prepare('SELECT doi FROM st_doi_ky WHERE sbd = ? AND ky = ?').bind(sbd, ky)])
      const d = Number((r[1]?.results?.[0] as Row | undefined)?.doi)
      doi = d >= 0 && d < 4 ? d : null
    } catch { doi = null }
  }
  const lop = lopCuaDong(lopEm), khoi = khoiTuLop(lop) ?? khoiTuLop(lopEm?.lop) ?? khoiTuLop(lopEm?.lop_ds)
  const lopDong = (r: Row) => String((r.ten_lop as string) || (r.lop as string) || '')
  const nayLop = tuanHai.filter((r) => r.tuan === tuan && lop && lopDong(r) === lop)
  const truocKhoi = khoi ? tuanHai.filter((r) => r.tuan === truoc && (khoiTuLop(lopDong(r)) ?? khoiTuLop(r.lop)) === khoi) : []
  const thanhTich: ThanhTich = { ha: so0(tt?.ha), chuoiMax: so0(tt?.chuoi_max), thuKhoa: so0(tt?.thu_khoa), haThay: so0(tt?.ha_thay), van: so0(tt?.van) }
  const boMac: BoMac = chuanMac(mac)
  return {
    ok: true, cap: tien.cap, chuoi: tien.chuoi, mo: dsDaMo(tien), mac: boMac,
    thanhTich, huyHieu: huyHieuDat(thanhTich), doiKy: doi, hocKy: ky,
    danhHieu: xetDanhHieu(truocKhoi.map(dongTuan)).filter((d) => d.sbd.includes(sbd)).map((d) => d.loai),
    thiDua: { tuan, chuTuan: chuTuan(tuan), doi: vachDoi(nayLop) },
  }
}

/** Em mặc đồ: máy chủ đọc lại cấp + chuỗi và KIỂM từng món đã mở. */
export async function hsMacDo(env: Env, b: Dong, envDoc: Env = env, nay = Date.now()): Promise<Dong> {
  let em: { sbd: string; xong: Promise<string> }
  try { em = await emSom(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const pTien = docTienDo(env, envDoc, em.sbd, nay)
  pTien.catch(() => 0)
  try { await em.xong } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' } }
  const k = kiemMac(b.mac, await pTien)
  if (!k.ok) return { ok: false, error: k.loi, ma: 'chua_mo' }
  await taoBang(env)
  await env.DB.prepare(`INSERT INTO st_mac (sbd, mu, ao, dan, ha, luc) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (sbd) DO UPDATE SET mu = excluded.mu, ao = excluded.ao, dan = excluded.dan, ha = excluded.ha, luc = excluded.luc`)
    .bind(em.sbd, k.mac.mu, k.mac.ao, k.mac.dan, k.mac.ha, nay).run()
  return { ok: true, mac: k.mac }
}

/** Máy thầy: thi đua tuần (4 vạch) + người dẫn danh hiệu tuần này + danh hiệu đã trao (tuần trước), theo khối hoặc lớp. */
export async function gvThiDua(envDoc: Env, b: Dong, nay = Date.now()): Promise<Dong> {
  const khoi = [10, 11, 12].includes(Number(b.khoi)) ? Number(b.khoi) : null, lop = typeof b.lop === 'string' ? b.lop.trim() : ''
  if (!khoi && !lop) return { ok: false, error: 'Thiếu khối hoặc lớp.' }
  const tuan = maTuan(nay), truoc = tuanTruoc(tuan)
  const ds = await tatCa(envDoc, SQL_TUAN_HAI, tuan, truoc)
  const trong = (r: Row) => { const l = String((r.ten_lop as string) || (r.lop as string) || ''); return khoi ? (khoiTuLop(l) ?? khoiTuLop(r.lop)) === khoi : l === lop }
  const ten = new Map(ds.map((r) => [String(r.sbd), tenGoi(r.ho_ten) || 'Một bạn']))
  const nayDs = ds.filter((r) => r.tuan === tuan && trong(r)), truocDs = ds.filter((r) => r.tuan === truoc && trong(r))
  const coTen = (x: ReturnType<typeof xetDanhHieu>) => x.map((d) => ({ loai: d.loai, ten: DANH_HIEU.find((h) => h.loai === d.loai)!.ten, nguoi: d.sbd.map((s) => ten.get(s) ?? 'Một bạn'), so: d.so }))
  return {
    ok: true, tuan, chuTuan: chuTuan(tuan), doi: vachDoi(nayDs), soEm: nayDs.length,
    danhHieuTuanNay: coTen(xetDanhHieu(nayDs.map(dongTuan))), danhHieuTuanTruoc: coTen(xetDanhHieu(truocDs.map(dongTuan))),
  }
}

/** Cửa vào từ index.ts (MỘT dòng): `/sinh-ton/tu-do` · `/sinh-ton/mac` (em) · `/sinh-ton/thi-dua` (thầy). */
export async function sinhTonDuLieu(env: Env, p: string, b: Dong, thay: boolean, envDoc: Env = env): Promise<Dong> {
  if (p === '/sinh-ton/tu-do') return hsTuDo(env, b, envDoc)
  if (p === '/sinh-ton/mac') return hsMacDo(env, b, envDoc)
  if (p === '/sinh-ton/thi-dua') return thay ? gvThiDua(envDoc, b) : { ok: false, error: 'Sai mã bí mật' }
  return { ok: false, error: 'Không có lệnh này.' }
}
