// HÌNH CỦA ĐỀ — VẼ LẠI · MÁY CHỦ (thầy 03/11 «chỉ cần đề có hình là vẽ lại màu mè đẹp… hình vẽ mới là một thẻ riêng ở phía dưới», «chỉ vẽ những câu có hình
// trong toàn kho thôi, câu khác lúc nào tôi bảo mới vẽ», «áp dụng cả cho nạp đề mới sau này»). Bộ kiểm thuần: src/lib/hinh-ve/kieu.ts.
//
//   /kho/hinh-ve/nap-hang  ⇒ quét gói R2 từng tờ: ảnh CỦA ĐỀ (không phải ảnh lời giải / phương án / ý) → bảng qid ↔ băm ảnh + hàng việc CHỈ-THÊM
//   /kho/hinh-ve/viec      ⇒ phát một lô ảnh (data URL) cho máy vẽ (khoá 45 phút)
//   /kho/hinh-ve/nop       ⇒ nhận cảnh + HAI lượt phiên âm độc lập: lệch nhau / chữ ngoài ảnh / khuôn chưa hỗ trợ ⇒ «giu_goc» (app giữ ảnh gốc, KHÔNG vẽ)
//   /kho/hinh-ve/tong      ⇒ số đếm
//   /hs/hinh-ve            ⇒ app học sinh đọc cảnh theo qid (một đợt D1); đóng khi em đang có ca kiểm tra mở
//   /gv/hinh-ve            ⇒ app thầy / màn chiếu (sau cổng mã bí mật)
// Đề nạp mới: `ghiHinhVaoHang` gọi từ `ghiCauVaoHang` (mọi đường nạp đề đi qua đó) ⇒ ảnh mới tự vào hàng, máy vẽ chạy định kỳ.
// KHÔNG đụng ảnh lời giải (có đáp số), ảnh phương án / ý (bị xáo theo em), ảnh cả thân câu (đề là ảnh).
import type { Env } from './kieu'
import { cauHienTai } from './loi-giai'
import { cauTrongGoi, type CauKho } from '../../src/lib/loi-giai-kiem'
import { PHIEN_BAN_HINH, hinhVeDungDuoc, kiemCanhHinh, phienAmKhop } from '../../src/lib/hinh-ve/kieu'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const mangChu = (v: unknown, tran: number, dai = 300) => (Array.isArray(v) ? v : []).map((x) => str(x).slice(0, dai)).filter(Boolean).slice(0, tran)

export const PHUT_GIU_VIEC_HINH = 45
export const SO_LAN_TOI_DA_HINH = 3
/** Thầy 03/11: «ko hình nào được dùng hình cũ» — máy KHÔNG tự xin giữ gốc; hàng chờ phát lại tới chừng này lượt rồi dừng để báo thầy xem tay. */
export const SO_LAN_PHAT_TOI_DA_HINH = 8
/** Ảnh nhỏ hơn mốc này (ký tự data URL) là icon / gạch trang trí, không vẽ lại. */
const CO_TOI_THIEU = 2500

export const SQL_BANG_HINH: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS hinh_ve (bam TEXT PRIMARY KEY, canh_json TEXT, cong TEXT NOT NULL, ly_do TEXT, phien_am TEXT, phien_ban INTEGER NOT NULL, so_lan INTEGER NOT NULL DEFAULT 1, tao_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hinh_ve_cau (qid TEXT NOT NULL, bam TEXT NOT NULL, ma_de TEXT NOT NULL, vi_tri TEXT NOT NULL, PRIMARY KEY (qid, bam))`,
  'CREATE INDEX IF NOT EXISTS hinh_ve_cau_bam ON hinh_ve_cau(bam)',
  'CREATE INDEX IF NOT EXISTS hinh_ve_cau_de ON hinh_ve_cau(ma_de)',
  `CREATE TABLE IF NOT EXISTS hinh_ve_viec (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, ma_de TEXT NOT NULL, vi_tri TEXT NOT NULL, trang_thai TEXT NOT NULL, ma_luot TEXT, nhan_luc TEXT, so_lan INTEGER NOT NULL DEFAULT 0, loi TEXT, tao_luc TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS hinh_ve_viec_cho ON hinh_ve_viec(trang_thai, ma_de)',
]
let daTaoBang: Promise<void> | null = null
export function damBaoBangHinh(env: Env): Promise<void> {
  if (!daTaoBang) daTaoBang = env.DB.batch(SQL_BANG_HINH.map((q) => env.DB.prepare(q))).then(() => undefined).catch((e) => { daTaoBang = null; throw e })
  return daTaoBang
}

/** Vị trí ảnh là của ĐỀ (không phải phương án / ý / lời giải). */
export const laViTriDe = (vt: string) => !/^(?:pa|y)_|sau_(?:loi_giai|pa|y)|dap_an|loi_giai|giai/i.test(vt)

async function bamAnh(duLieu: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(duLieu))
  return [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Ảnh của ĐỀ trong một câu: [{ bam, viTri }] (bỏ ảnh quá nhỏ, trùng băm trong câu). */
export async function anhDeCuaCau(c: CauKho): Promise<{ bam: string; viTri: string }[]> {
  const ra: { bam: string; viTri: string }[] = []
  for (const h of c.hinh) {
    if (!laViTriDe(h.viTri) || h.duLieu.length < CO_TOI_THIEU) continue
    const bam = await bamAnh(h.duLieu)
    if (!ra.some((x) => x.bam === bam)) ra.push({ bam, viTri: h.viTri })
  }
  return ra
}

/** Ghi ảnh của đề một tờ vào hàng (gọi lại được; từ `ghiCauVaoHang` khi nạp đề mới). Thay mapping của tờ; hàng việc CHỈ-THÊM. */
export async function ghiHinhVaoHang(env: Env, maDe: string, goi: unknown): Promise<{ soAnh: number; moi: number }> {
  await damBaoBangHinh(env)
  const nay = new Date().toISOString()
  const lenh = [env.DB.prepare('DELETE FROM hinh_ve_cau WHERE ma_de = ?').bind(maDe)]
  const laViec: boolean[] = [false]
  let soAnh = 0
  for (const c of cauTrongGoi(maDe, goi)) {
    for (const a of await anhDeCuaCau(c)) {
      soAnh++
      lenh.push(env.DB.prepare('INSERT OR IGNORE INTO hinh_ve_cau (qid, bam, ma_de, vi_tri) VALUES (?,?,?,?)').bind(c.qid, a.bam, maDe, a.viTri)); laViec.push(false)
      lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO hinh_ve_viec (bam, qid_mau, ma_de, vi_tri, trang_thai, so_lan, tao_luc) SELECT ?,?,?,?,'cho',0,? WHERE NOT EXISTS (SELECT 1 FROM hinh_ve WHERE bam = ?)`)
        .bind(a.bam, c.qid, maDe, a.viTri, nay, a.bam)); laViec.push(true)
    }
  }
  let moi = 0
  for (let i = 0; i < lenh.length; i += 80) { const k = await env.DB.batch(lenh.slice(i, i + 80)); k.forEach((x, j) => { if (laViec[i + j]) moi += Number(x.meta?.changes ?? 0) }) }
  return { soAnh, moi }
}

/** LẤP KHO CŨ: quét gói R2 của `so` tờ kể từ `tu` (theo mã đề). Máy vẽ gọi lặp tới khi `tiep` = null. */
export async function napHangHinh(env: Env, b: Obj) {
  await damBaoBangHinh(env)
  const tu = Math.max(0, Number(b.tu ?? 0) || 0), so = Math.min(20, Math.max(1, Number(b.so ?? 8) || 8))
  const r = await env.DB.prepare('SELECT ma_de FROM de_kho WHERE da_xoa = 0 AND r2_khoa IS NOT NULL ORDER BY ma_de LIMIT ? OFFSET ?').bind(so, tu).all<Obj>()
  const ds = (r.results ?? []).map((x) => str(x.ma_de))
  let soAnh = 0, moi = 0
  const loi: string[] = []
  for (const maDe of ds) {
    try {
      const o = await env.DE.get(`kho/${maDe}.json`)
      const goi = o ? await new Response(o.body).json().catch(() => null) : null
      if (!goi) { loi.push(`${maDe}: không có gói`); continue }
      const k = await ghiHinhVaoHang(env, maDe, goi); soAnh += k.soAnh; moi += k.moi
    } catch (e) { loi.push(`${maDe}: ${(e as Error).message}`) }
  }
  return { ok: true, daQuet: ds.length, soAnh, moi, loi, tiep: ds.length === so ? tu + so : null }
}

/** Phát một lô ảnh cho máy vẽ: kèm ảnh (data URL), đề của câu (chữ) để máy hiểu ngữ cảnh. */
export async function layViecHinh(env: Env, b: Obj) {
  await damBaoBangHinh(env)
  const nay = Date.now()
  const so = Math.min(8, Math.max(1, Number(b.so ?? 5) || 5))
  const han = new Date(nay - PHUT_GIU_VIEC_HINH * 60_000).toISOString()
  await env.DB.prepare("UPDATE hinh_ve_viec SET trang_thai = 'cho', ma_luot = NULL WHERE trang_thai = 'dang' AND nhan_luc < ?").bind(han).run()
  const maLuot = crypto.randomUUID(), nhanLuc = new Date(nay).toISOString()
  await env.DB.prepare(
    `UPDATE hinh_ve_viec SET trang_thai = 'dang', ma_luot = ?, nhan_luc = ?, so_lan = so_lan + 1
     WHERE bam IN (SELECT bam FROM hinh_ve_viec WHERE trang_thai = 'cho' AND so_lan < ${SO_LAN_PHAT_TOI_DA_HINH} ORDER BY ${b.ngauNhien === true ? 'RANDOM()' : 'ma_de, qid_mau'} LIMIT ?)`,
  ).bind(maLuot, nhanLuc, so).run()
  const nhan = (await env.DB.prepare('SELECT * FROM hinh_ve_viec WHERE ma_luot = ? ORDER BY ma_de, qid_mau').bind(maLuot).all<Obj>()).results ?? []
  if (!nhan.length) return { ok: true, het: true, viec: [] }
  const boNho = new Map<string, unknown>()
  const viec: Obj[] = []
  for (const v of nhan) {
    const bam = str(v.bam)
    const ht = await cauHienTai(env, str(v.qid_mau), str(v.ma_de), boNho).catch(() => null)
    const anh = ht ? (await Promise.all(ht.c.hinh.map(async (h) => ({ h, b: laViTriDe(h.viTri) && h.duLieu.length >= CO_TOI_THIEU ? await bamAnh(h.duLieu) : '' })))).find((x) => x.b === bam) : null
    if (!ht || !anh) { await env.DB.prepare("UPDATE hinh_ve_viec SET trang_thai = 'bo', loi = 'ảnh không còn trong đề' WHERE bam = ?").bind(bam).run(); continue }
    viec.push({ bam, qid: ht.c.qid, maDe: ht.c.maDe, viTri: anh.h.viTri, phan: ht.c.phan, de: ht.c.de.slice(0, 600), anh: anh.h.duLieu, soLan: Number(v.so_lan ?? 0) })
  }
  if (!viec.length) return layViecHinh(env, b)
  return { ok: true, het: false, maLuot, viec }
}

/** Nhận một cảnh. `giuGoc` (máy vẽ báo khuôn chưa hỗ trợ) hoặc kiểm hỏng đủ lần ⇒ cong = giu_goc (app giữ ảnh gốc). */
export async function nopHinh(env: Env, b: Obj) {
  await damBaoBangHinh(env)
  const bam = str(b.bam)
  if (!bam) return { ok: false, error: 'Thiếu bam' }
  const ton = await env.DB.prepare('SELECT so_lan FROM hinh_ve_viec WHERE bam = ?').bind(bam).first<Obj>()
  if (!ton) return { ok: false, error: 'Không có việc này' }
  const a1 = mangChu(b.phienAm1, 80, 120), a2 = mangChu(b.phienAm2, 80, 120)
  let cong = 'dat', lyDo = '', canh: string | null = null
  if (b.giuGoc === true) { cong = 'lech'; lyDo = `máy xin giữ gốc: ${str(b.lyDo).slice(0, 160) || 'không rõ lý do'} — vẽ lại` }
  else if (!phienAmKhop(a1, a2)) { cong = 'lech'; lyDo = 'hai lượt phiên âm lệch nhau — làm lại' }
  else {
    const k = kiemCanhHinh(b.canh, a1)
    if (k.ok) canh = JSON.stringify(k.hinh)
    else { cong = 'lech'; lyDo = k.lyDo }
  }
  const nay = new Date().toISOString()
  const heLan = Number(ton.so_lan ?? 0) >= SO_LAN_PHAT_TOI_DA_HINH
  if (cong === 'lech' && heLan) { cong = 'giu_goc'; lyDo = `${lyDo} (đủ ${SO_LAN_PHAT_TOI_DA_HINH} lần — cần thầy xem tay)`.slice(0, 220) }
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO hinh_ve (bam, canh_json, cong, ly_do, phien_am, phien_ban, so_lan, tao_luc) VALUES (?,?,?,?,?,?,1,?)
       ON CONFLICT(bam) DO UPDATE SET canh_json = excluded.canh_json, cong = excluded.cong, ly_do = excluded.ly_do, phien_am = excluded.phien_am, phien_ban = excluded.phien_ban, so_lan = hinh_ve.so_lan + 1
       WHERE excluded.cong IN ('dat', 'giu_goc') OR hinh_ve.cong NOT IN ('dat', 'giu_goc')`,
    ).bind(bam, canh, cong === 'lech' ? 'lech' : cong, lyDo.slice(0, 220), JSON.stringify(a1).slice(0, 4000), PHIEN_BAN_HINH, nay),
    env.DB.prepare("UPDATE hinh_ve_viec SET trang_thai = CASE WHEN ? IN ('dat', 'giu_goc') THEN 'xong' ELSE 'cho' END, ma_luot = NULL, loi = ? WHERE bam = ?").bind(cong, lyDo.slice(0, 220), bam),
  ])
  return { ok: true, ket: cong, lyDo }
}

export async function tongHinh(env: Env) {
  await damBaoBangHinh(env)
  const [hang, ban, anh, cau] = await Promise.all([
    env.DB.prepare('SELECT trang_thai, COUNT(*) AS n FROM hinh_ve_viec GROUP BY 1').all<Obj>(),
    env.DB.prepare('SELECT cong, COUNT(*) AS n FROM hinh_ve WHERE phien_ban >= ? GROUP BY 1').bind(PHIEN_BAN_HINH).all<Obj>(),
    env.DB.prepare('SELECT COUNT(DISTINCT bam) AS anh FROM hinh_ve_cau').first<Obj>(),
    env.DB.prepare('SELECT COUNT(DISTINCT qid) AS cau FROM hinh_ve_cau').first<Obj>(),
  ])
  return { ok: true, phienBan: PHIEN_BAN_HINH, hang: hang.results ?? [], ban: ban.results ?? [], anhTrongKho: Number(anh?.anh ?? 0), cauCoHinh: Number(cau?.cau ?? 0) }
}

/** Cảnh đạt cho danh sách qid. Một câu D1. */
export function sqlHinhTheoQid(env: Env, qids: readonly string[]) {
  return env.DB.prepare(
    `SELECT c.qid, h.canh_json FROM hinh_ve_cau c JOIN hinh_ve h ON h.bam = c.bam
     WHERE c.qid IN (SELECT value FROM json_each(?)) AND h.cong = 'dat' AND h.canh_json IS NOT NULL AND h.phien_ban >= ? ORDER BY c.qid, c.vi_tri`,
  ).bind(JSON.stringify(qids.slice(0, 200)), PHIEN_BAN_HINH)
}
function gomCanh(rows: readonly Obj[] | undefined): Record<string, unknown[]> {
  const ra: Record<string, unknown[]> = {}
  for (const x of rows ?? []) { try { const h = hinhVeDungDuoc(JSON.parse(str(x.canh_json))); if (h) (ra[str(x.qid)] ??= []).push(h) } catch { /* bỏ */ } }
  return ra
}

/** `/gv/hinh-ve {qids}` — app thầy / màn chiếu (sau cổng mã bí mật). */
export async function gvHinhVe(env: Env, b: Obj) {
  await damBaoBangHinh(env)
  const qids = mangChu(b.qids, 200, 200)
  if (!qids.length) return { ok: true, ban: {} }
  const r = await sqlHinhTheoQid(env, qids).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  return { ok: true, ban: gomCanh(r.results) }
}

/** `/hs/hinh-ve {token, qids}` — app học sinh, MỘT đợt D1. Đóng khi em đang có ca kiểm tra mở (v1 chưa vẽ lại trong ca thi). */
export async function hsHinhVe(env: Env, b: Obj) {
  const { gameIdentityHaiBuoc } = await import('./game-v2-auth')
  const { trangThaiHoiThay } = await import('./hoi-thay-ca-nhan')
  const { qidTraSoDo } = await import('./loi-giai-so-do')
  const { sbd, xong } = await gameIdentityHaiBuoc(env, b)
  const vao = [...new Set(mangChu(b.qids, 60, 200))]
  if (!vao.length) { await xong; return { ok: true, ban: {} } }
  const tra = new Map(vao.map((q) => [q, qidTraSoDo(q)]))
  const tatCa = [...new Set([...tra.values()].flat())]
  const [, rows, tt] = await Promise.all([
    xong,
    sqlHinhTheoQid(env, tatCa).all<Obj>().then((r) => r.results ?? [], () => [] as Obj[]),
    trangThaiHoiThay(env, sbd, vao[0]!, Date.now()).catch(() => null),
  ])
  if (!tt || tt.dangKiemTra) return { ok: true, ban: {}, dong: true }
  const goc = gomCanh(rows)
  const ra: Record<string, unknown[]> = {}
  for (const q of vao) { const h = (tra.get(q) ?? [q]).map((x) => goc[x]).find(Boolean); if (h) ra[q] = h }
  return { ok: true, ban: ra }
}
