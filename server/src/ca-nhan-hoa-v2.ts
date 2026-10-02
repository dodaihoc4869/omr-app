// CÁ NHÂN HOÁ SÂU — Vòng học khép kín v2 (thầy 02/10: "khắc phục luôn giới hạn này" — giới hạn: chỉ cá nhân hoá theo lịch sử làm bài, ngưỡng
// luật dùng chung cả trung tâm). Bốn thứ đo RIÊNG từng em từ dữ liệu thật của em, ít dữ liệu thì kéo về mức chung (không đoán):
//   1. NGƯỠNG LUẬT ĐÓNG LỖI riêng: tỉ lệ em SAI LẠI ở lượt kiểm duy trì ⇒ em hay quên: đòi cách lần sai xa hơn + kiểm duy trì SỚM hơn;
//      em nhớ tốt: giãn ra. Co về tỉ lệ chung bằng "10 lượt kiểm ảo" (em mới ⇒ gần như mức chung). Tính hằng tuần (tu-hoan-thien.ts).
//   2. TỐC ĐỘ ĐỌC riêng: ngưỡng "lướt" của cổng nỗ lực = 35 % tốc độ đọc thường ngày của chính em (giây/bước, trung vị), trong [2, 5] giây.
//   3. NHỊP HỌC riêng: số câu em THỰC làm mỗi ngày (14 ngày) so với số câu nợ đến hạn ⇒ tỉ lệ trần nợ trong kế hoạch ngày 50 % → 80 %.
//   4. KÊNH riêng: em không mở Đoàn 7 ngày mà vẫn chơi Đảo ⇒ câu ôn Phần I/III vào Đảo (không kẹt ở kênh em không dùng).
import type { Env } from './kieu'
import { THAM_SO_GOC, type ThamSoLuat } from './loi-hoc-luat'

type Row = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
const kep = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

/** Số lượt kiểm "ảo" kéo tỉ lệ riêng về tỉ lệ chung (co Bayes). */
export const LUOT_AO = 10
/** Tỉ lệ sai lại chung mặc định khi chưa đo được. */
export const TY_LE_CHUNG_MAC_DINH = 0.15

/** 1. Ngưỡng riêng từ (lượt kiểm, sai lại) của em + tỉ lệ chung + tham số chung. */
export function thamSoRieng(kiem: number, saiLai: number, tyLeChung: number, chung: ThamSoLuat = THAM_SO_GOC): { ts: ThamSoLuat; tyLe: number } {
  const p0 = kep(Number.isFinite(tyLeChung) && tyLeChung > 0 ? tyLeChung : TY_LE_CHUNG_MAC_DINH, 0.03, 0.6)
  const p = kep((saiLai + LUOT_AO * p0) / (kiem + LUOT_AO), 0.03, 0.8)
  // Mỗi 10 điểm % sai lại hơn mức chung ⇒ thêm 1 ngày cách; kém hơn ⇒ bớt (2..7).
  const cach = kep(Math.round(chung.cachSaiCuoi + (p - p0) / 0.1), 2, 7)
  // Mốc kiểm duy trì theo đường quên: tỉ lệ sai lại gấp 4 ⇒ kiểm sớm gấp 2 (căn bậc hai), trong [7, 28] ngày; mốc 2 ≈ gấp đôi + 2 ngày.
  const moc1 = kep(Math.round((chung.mocDuyTri[0] ?? 14) * Math.sqrt(p0 / p)), 7, 28)
  const moc2 = kep(Math.round(moc1 * 2 + 2), 14, 60)
  return { ts: { ...chung, cachSaiCuoi: cach, mocDuyTri: [moc1, moc2] }, tyLe: p }
}

/** 2. Ngưỡng lướt (giây/bước) từ các lần em đọc lời giải: giây mỗi lần ÷ số bước em mở. < 5 lần đo ⇒ 5 giây (mặc định cũ). */
export function nguongLuot(lanDoc: readonly { giay: number; soBuoc: number }[]): number {
  const ds = lanDoc.filter((x) => x.giay > 0 && x.soBuoc > 0).map((x) => x.giay / x.soBuoc).sort((a, b) => a - b)
  if (ds.length < 5) return 5
  const trungVi = ds[Math.floor(ds.length / 2)]!
  return kep(Math.round(trungVi * 0.35 * 10) / 10, 2, 5)
}

/** 3. Tỉ lệ trần nợ riêng: nợ đến hạn so với số câu em thực làm một ngày (tối thiểu coi như 5 câu/ngày). */
export function tiLeNoRieng(noDenHan: number, nhipNgay: number): number {
  const nhip = Math.max(5, nhipNgay)
  if (noDenHan > 2 * nhip) return 0.8
  if (noDenHan > nhip) return 0.65
  return 0.5
}

/** 4. Kênh riêng: em không mở Đoàn (7 ngày) mà có chơi Đảo ⇒ câu ôn vào Đảo. */
export const onVaoDaoRieng = (luotDao: number, luotDoan: number): boolean => luotDoan === 0 && luotDao > 0

/** Đọc nhịp + kênh của em (2 truy vấn nhẹ, mỗi lần lập kế hoạch ngày — kế hoạch chốt một lần/ngày). Lỗi đọc ⇒ không cá nhân hoá. */
export async function docNhipKenh(env: Env, sbd: string, nowMs: number): Promise<{ nhipNgay: number; luotDao: number; luotDoan: number } | null> {
  try {
    const tu14 = new Date(nowMs + 7 * 3_600_000 - 14 * 86_400_000).toISOString().slice(0, 10)
    const tu7 = new Date(nowMs - 7 * 86_400_000).toISOString()
    const [a, b] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND nguon <> 'nen'`).bind(sbd, tu14).first<Row>(),
      env.DB.prepare(`SELECT SUM(CASE WHEN json_extract(json, '$.doan') IS NOT NULL THEN 1 ELSE 0 END) AS doan,
          SUM(CASE WHEN json_extract(json, '$.doan') IS NULL AND COALESCE(json_extract(json, '$.bia'), 0) = 0 THEN 1 ELSE 0 END) AS dao
        FROM game_v2_session WHERE sbd = ? AND created_at >= ?`).bind(sbd, tu7).first<Row>(),
    ])
    return { nhipNgay: Number(a?.n ?? 0) / 14, luotDao: Number(b?.dao ?? 0), luotDoan: Number(b?.doan ?? 0) }
  } catch {
    return null
  }
}

/** Ngưỡng lướt của em: 40 lần đọc lời giải gần nhất. */
export async function docNguongLuot(env: Env, sbd: string): Promise<number> {
  const r = await env.DB.prepare('SELECT giay, su_kien_json FROM doc_loi_giai WHERE sbd = ? ORDER BY id DESC LIMIT 40').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  const lan = (r.results ?? []).map((x) => {
    let ds: unknown[] = []
    try { const v = JSON.parse(str(x.su_kien_json) || '[]'); if (Array.isArray(v)) ds = v } catch { /* hỏng ⇒ 0 bước */ }
    const buoc = ds.filter((e): e is Row => !!e && typeof e === 'object' && (e as Row).k === 'mo_buoc').map((e) => str(e.y))
    return { giay: Number(x.giay) || 0, soBuoc: new Set(buoc).size }
  })
  return nguongLuot(lan)
}

const TAO_BANG_EM = `CREATE TABLE IF NOT EXISTS v2_tham_so_em (sbd TEXT PRIMARY KEY, tham_so_json TEXT NOT NULL, ty_le REAL, n_kiem INTEGER NOT NULL, n_sai_lai INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)`
export async function damBaoBangThamSoEm(env: Env): Promise<void> {
  await env.DB.prepare(TAO_BANG_EM).run()
}

/** Ngưỡng luật của em (đã tính tuần này); chưa có ⇒ null (dùng tham số chung). */
export async function docThamSoEm(env: Env, sbd: string): Promise<ThamSoLuat | null> {
  const r = await env.DB.prepare('SELECT tham_so_json FROM v2_tham_so_em WHERE sbd = ?').bind(sbd).first<Row>().catch(() => null)
  if (!r) return null
  try {
    const o = JSON.parse(str(r.tham_so_json)) as ThamSoLuat
    return Number.isInteger(o.cachSaiCuoi) && Array.isArray(o.mocDuyTri) && o.mocDuyTri.length ? { ...THAM_SO_GOC, ...o } : null
  } catch {
    return null
  }
}
