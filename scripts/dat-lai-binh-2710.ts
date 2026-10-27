// ĐẶT LẠI BÌNH GIỮ CHUỖI VỀ 0 CHO MỌI HỌC SINH (thầy DUYỆT 27/10, chọn «Chỉ bình giữ chuỗi»). Chạy bằng workflow dat-lai-binh-2710.yml (workflow_dispatch),
// KHÔNG chạy từ máy local. Chỉ in SỐ ĐẾM (repo công khai: không sbd, không tên).
//
// Bình KHÔNG có cột đếm — số bình tính lại từ sổ mỗi lần (hàm thuần `chuoiNgayCuaEm`). Nên «đặt lại» = THÊM một dòng `chuoi_binh_mua` mỗi em đang có bình:
//   id `<sbd>|tt-binh-reset-2710`, nguon 'tt-binh-reset-2710', so = −(số bình lúc đặt lại, chỉ để truy vết), luc = MỐC lúc bắt đầu tính.
// Hàm thuần gặp dòng này ⇒ bình ngày đó về 0; bình mua SAU mốc vẫn cộng (em mua giữa lúc chạy không mất). KHÔNG xoá / sửa dòng sổ nào; KHÔNG đụng vang_so
// (tinh thể), exp_so (nguyên tử), chuỗi ngày, giải, nhiệm vụ.
//
// Cổng: (1) có ca thi mở ⇒ DỪNG; (2) Worker sống phải chạy bản ĐÃ có luật mới (thẻ commit của bản sống là con cháu của commit `MOC_LUAT`) ⇒ không ai mua bình
// giá cũ giữa chừng. Trước khi ghi: đếm (số em có bình > 0, tổng bình). Sau khi ghi: đếm lại (phải = 0, trừ bình mua sau mốc) + tổng tinh thể / nguyên tử của
// các dòng có trước mốc (rowid ≤ max lúc đầu) không đổi. Chạy lại: dòng đặt lại đã có (INSERT OR IGNORE) ⇒ không ghi thêm.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chuoiNgayCuaEm, ngayVn, NGUON_DAT_LAI_BINH, SO_NGAY_DOC, SQL_COT_BINH_MUA, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'

const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
const MOC_LUAT = process.env.MOC_LUAT ?? ''
const GHI = process.env.GHI === 'ghi'
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
if (!/^[a-f0-9]{7,40}$/.test(MOC_LUAT)) throw new Error('Thiếu commit luật mới (MOC_LUAT).')
const DB = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
type Row = Record<string, unknown>

async function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(60000),
  })
  const j = (await r.json()) as { success?: boolean; result?: { success?: boolean; results?: Row[] }[]; errors?: { message?: string }[] }
  if (!r.ok || !j.success || j.result?.some((x) => !x.success)) throw new Error(`D1 lỗi (${r.status}): ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 200)}`)
  return (j.result ?? []).flatMap((x) => x.results ?? [])
}
async function cf(path: string): Promise<Record<string, unknown>> {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
  const j = (await r.json()) as { success?: boolean; result?: Record<string, unknown> }
  if (!r.ok || !j.success || !j.result) throw new Error(`Chưa đọc được Cloudflare (${r.status}).`)
  return j.result
}
const log = (o: Record<string, unknown>) => console.log(JSON.stringify(o))

// (1) Ca thi mở ⇒ dừng.
const ca = (await query(readFileSync('scripts/kiem-ca-mo.sql', 'utf8').replace(/--[^\n]*/g, ' ')))[0] ?? {}
log({ buoc: 'ca_thi', soCaMo: ca.so_ca_mo, soLuotDangLam: ca.so_luot_dang_lam })
if (ca.so_ca_mo !== 0 || ca.so_luot_dang_lam !== 0) throw new Error('Có ca thi mở: DỪNG, chưa đặt lại bình.')

// (2) Bản sống đã có luật mới.
const dep = await cf('workers/scripts/omr/deployments')
const ban = ((dep.deployments as Row[] | undefined) ?? [])[0]?.versions as { version_id: string; percentage: number }[] | undefined
if (!ban?.length || ban.length !== 1 || ban[0]!.percentage !== 100) throw new Error('Worker chưa chạy một bản 100%.')
const ver = await cf(`workers/scripts/omr/versions/${ban[0]!.version_id}`)
const the = ((ver.annotations ?? (ver.metadata as Row | undefined)?.annotations) as Row | undefined)?.['workers/tag']
if (typeof the !== 'string' || !/^[a-f0-9]{40}$/.test(the)) throw new Error('Bản Worker sống không có thẻ commit.')
try { execFileSync('git', ['merge-base', '--is-ancestor', MOC_LUAT, the]) } catch { throw new Error('Worker sống CHƯA có luật bình mới — dừng (chạy lại sau khi deploy xanh).') }
log({ buoc: 'ban_song', coLuatMoi: true })

// (3) Bảng bình (chỉ-thêm, cùng DDL của B3) — có sẵn thì không đổi gì.
await query('CREATE TABLE IF NOT EXISTS chuoi_binh_mua (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, so INTEGER NOT NULL, nguon TEXT NOT NULL, luc TEXT NOT NULL)')
await query('CREATE INDEX IF NOT EXISTS idx_chuoi_binh_mua_sbd ON chuoi_binh_mua (sbd, luc)')

const MOC_MS = Date.now()
const MOC_ISO = new Date(MOC_MS).toISOString()
const homNay = ngayVn(MOC_MS)
const tu = new Date(Date.parse(`${homNay}T00:00:00Z`) - SO_NGAY_DOC * 86_400_000).toISOString().slice(0, 10)
const tuIso = `${new Date(Date.parse(`${tu}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)}T00:00:00Z`

/** Bình của MỌI em (đúng hàm thuần + đúng cách đọc của máy chủ). `denIso` ⇒ chỉ tính bình mua tới mốc đó. */
async function binhMoiEm(denIso?: string): Promise<Map<string, number>> {
  const [sk, sua, phep, mua] = await Promise.all([
    query('SELECT sbd, ngay_vn AS n, COUNT(DISTINCT qid) AS c FROM su_kien_hoc WHERE ngay_vn >= ? AND ngay_vn <= ? AND ket_qua IS NOT NULL GROUP BY sbd, ngay_vn', [tu, homNay]),
    query("SELECT DISTINCT sbd, date(dong_luc, '+7 hours') AS n FROM chua_loi_dot WHERE trang_thai_day = 'da_tu_sua' AND dong_luc >= ?", [tuIso]).catch(() => [] as Row[]),
    query("SELECT DISTINCT d.sbd AS sbd, date(b.mo_luc, '+7 hours') AS n FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id WHERE d.trang_thai = 'co_phep' AND b.mo_luc >= ?", [tuIso]).catch(() => [] as Row[]),
    query(`SELECT m.sbd AS sbd, ${SQL_COT_BINH_MUA} FROM chuoi_binh_mua m WHERE m.luc >= ?${denIso ? ' AND m.luc <= ?' : ''} GROUP BY m.sbd, n`, denIso ? [tuIso, denIso] : [tuIso]),
  ])
  const nk = new Map<string, { soCau: Map<string, number>; tuSua: Set<string>; phep: Set<string>; mua: Map<string, number>; datLai: Set<string> }>()
  const lay = (s: unknown) => { const k = String(s); let m = nk.get(k); if (!m) nk.set(k, (m = { soCau: new Map(), tuSua: new Set(), phep: new Set(), mua: new Map(), datLai: new Set() })); return m }
  for (const x of sk) lay(x.sbd).soCau.set(String(x.n), Number(x.c) || 0)
  for (const x of sua) if (x.n) lay(x.sbd).tuSua.add(String(x.n))
  for (const x of phep) if (x.n) lay(x.sbd).phep.add(String(x.n))
  for (const x of mua) if (x.n) { const m = lay(x.sbd); m.mua.set(String(x.n), Number(x.s) || 0); if (Number(x.r) === 1) m.datLai.add(String(x.n)) }
  const ra = new Map<string, number>()
  for (const [sbd, n] of nk) ra.set(sbd, chuoiNgayCuaEm(n as NhatKyChuoi, homNay).giuChuoi)
  return ra
}
const dem = (m: Map<string, number>) => { let soEm = 0, tong = 0; for (const v of m.values()) if (v > 0) { soEm++; tong += v }; return { soEm, tongBinh: tong } }
async function tongSo() {
  const v = (await query('SELECT COUNT(*) AS n, COALESCE(SUM(so_vang), 0) AS s, COALESCE(MAX(rowid), 0) AS m FROM vang_so'))[0]!
  const e = (await query('SELECT COUNT(*) AS n, COALESCE(SUM(exp), 0) AS s, COALESCE(MAX(rowid), 0) AS m FROM exp_so'))[0]!
  return { v, e }
}

const truoc = await binhMoiEm(MOC_ISO)
const daDatLai = Number((await query('SELECT COUNT(*) AS n FROM chuoi_binh_mua WHERE nguon = ?', [NGUON_DAT_LAI_BINH]))[0]?.n ?? 0)
const t0 = await tongSo()
log({ buoc: 'truoc', moc: MOC_ISO, ngayVn: homNay, soEmDaTinh: truoc.size, ...dem(truoc), dongDatLaiDaCo: daDatLai })

if (!GHI) { log({ buoc: 'chi_dem', ghi: false }); process.exit(0) }

const can = [...truoc].filter(([, v]) => v > 0).map(([s, v]) => ({ s, v }))
let daGhi = 0
for (let i = 0; i < can.length; i += 200) {
  const phan = can.slice(i, i + 200)
  // Một câu cho cả lô (json_each), INSERT OR IGNORE theo id ⇒ chạy lại không ghi đôi.
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      sql: `INSERT OR IGNORE INTO chuoi_binh_mua (id, sbd, so, nguon, luc)
        SELECT json_extract(j.value, '$.s') || '|' || ?1, json_extract(j.value, '$.s'), -json_extract(j.value, '$.v'), ?1, ?2 FROM json_each(?3) j`,
      params: [NGUON_DAT_LAI_BINH, MOC_ISO, JSON.stringify(phan)],
    }),
  })
  const j = (await r.json()) as { success?: boolean; result?: { meta?: { changes?: number } }[] }
  if (!r.ok || !j.success) throw new Error(`Ghi dòng đặt lại lỗi (${r.status}).`)
  daGhi += Number(j.result?.[0]?.meta?.changes ?? 0)
}

const sau = await binhMoiEm(MOC_ISO)
const sauTatCa = await binhMoiEm()
const t1 = await tongSo()
const v1 = (await query('SELECT COUNT(*) AS n, COALESCE(SUM(so_vang), 0) AS s FROM vang_so WHERE rowid <= ?', [t0.v.m]))[0]!
const e1 = (await query('SELECT COUNT(*) AS n, COALESCE(SUM(exp), 0) AS s FROM exp_so WHERE rowid <= ?', [t0.e.m]))[0]!
const tinhTheGiu = Number(v1.n) === Number(t0.v.n) && Number(v1.s) === Number(t0.v.s)
const nguyenTuGiu = Number(e1.n) === Number(t0.e.n) && Number(e1.s) === Number(t0.e.s)
log({
  buoc: 'sau', dongVuaGhi: daGhi, ...dem(sau), coBinhDoMuaSauMoc: dem(sauTatCa).soEm,
  tinhThe: { truoc: Number(t0.v.s), sauCungDong: Number(v1.s), giuNguyen: tinhTheGiu, dongMoiSauMoc: Number(t1.v.n) - Number(t0.v.n) },
  nguyenTu: { truoc: Number(t0.e.s), sauCungDong: Number(e1.s), giuNguyen: nguyenTuGiu, dongMoiSauMoc: Number(t1.e.n) - Number(t0.e.n) },
})
if (dem(sau).soEm !== 0) throw new Error('Còn em có bình sau khi đặt lại (không tính bình mua sau mốc) — kiểm lại.')
if (!tinhTheGiu || !nguyenTuGiu) throw new Error('Tổng tinh thể / nguyên tử của các dòng cũ bị đổi — kiểm lại ngay.')
