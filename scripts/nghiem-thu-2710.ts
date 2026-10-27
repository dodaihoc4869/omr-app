// NGHIỆM THU 27/10 — CHỈ ĐỌC, chỉ in SỐ ĐẾM (repo công khai: không sbd, không tên). Chạy bằng workflow nghiem-thu-2710.yml.
// Dùng đúng hàm thuần chuỗi ngày của máy chủ (chuoiNgayCuaEm) để so: chuỗi nhìn từ 27/10 và từ 28/10 (ngày bảo trì 27/10 không ai mất chuỗi / tốn bình),
// trần bình tuần, lượt đặt lại bình 00:01, bài kiểm tra ôn tập dời 28/10, lặp câu trong ngày (nguyên tử lần lặp).
import { chuoiNgayCuaEm, NGAY_CHUOI_DU_MUC, SQL_CAU_TINH_MUC, SQL_COT_BINH_MUA, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'

const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
const DB = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
type Row = Record<string, unknown>
async function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE)\b/i.test(sql)) throw new Error('Chỉ đọc.')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DB}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(90000),
  })
  const j = (await r.json()) as { success?: boolean; result?: { results?: Row[] }[]; errors?: { message?: string }[] }
  if (!r.ok || !j.success) throw new Error(`D1 ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  return j.result?.[0]?.results ?? []
}
const log = (o: Record<string, unknown>) => console.log(JSON.stringify(o))
const an = async (ten: string, f: () => Promise<unknown>) => { try { log({ khoi: ten, ...(await f() as Row) }) } catch (e) { log({ khoi: ten, loi: String(e instanceof Error ? e.message : e).slice(0, 200) }) } }

const TU = '2025-09-20', TU_ISO = '2025-09-19T00:00:00Z'
const NGAY_A = '2026-10-27', NGAY_B = process.env.NGAY_B || '2026-10-28'

await an('chuoi_bao_tri', async () => {
  const [sk, sua, phep, mua, muc] = await Promise.all([
    query(`SELECT sbd, ngay_vn AS n, COUNT(DISTINCT qid) AS c, COUNT(DISTINCT CASE WHEN ngay_vn >= '${NGAY_CHUOI_DU_MUC}' AND ${SQL_CAU_TINH_MUC} THEN qid END) AS c7
      FROM su_kien_hoc WHERE ngay_vn >= ? AND ket_qua IS NOT NULL GROUP BY sbd, ngay_vn`, [TU]),
    query("SELECT DISTINCT sbd, date(dong_luc, '+7 hours') AS n FROM chua_loi_dot WHERE trang_thai_day = 'da_tu_sua' AND dong_luc >= ?", [TU_ISO]).catch(() => [] as Row[]),
    query("SELECT DISTINCT d.sbd AS sbd, date(b.mo_luc, '+7 hours') AS n FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id WHERE d.trang_thai = 'co_phep' AND b.mo_luc >= ?", [TU_ISO]).catch(() => [] as Row[]),
    query(`SELECT m.sbd AS sbd, ${SQL_COT_BINH_MUA} FROM chuoi_binh_mua m WHERE m.luc >= ? GROUP BY m.sbd, n`, [TU_ISO]),
    query('SELECT sbd, ngay AS n, muc AS m FROM goi_bai_7_muc_ngay WHERE ngay >= ?', [NGAY_CHUOI_DU_MUC]).catch(() => [] as Row[]),
  ])
  type Nk = { soCau: Map<string, number>; soCau7: Map<string, number>; tuSua: Set<string>; phep: Set<string>; mua: Map<string, number>; datLai: Set<string>; muc: Map<string, number> }
  const nk = new Map<string, Nk>()
  const lay = (s: unknown) => { const k = String(s); let m = nk.get(k); if (!m) nk.set(k, (m = { soCau: new Map(), soCau7: new Map(), tuSua: new Set(), phep: new Set(), mua: new Map(), datLai: new Set(), muc: new Map() })); return m }
  for (const x of sk) { const m = lay(x.sbd), n = String(x.n); m.soCau.set(n, Number(x.c) || 0); if (n >= NGAY_CHUOI_DU_MUC) m.soCau7.set(n, Number(x.c7) || 0) }
  for (const x of sua) if (x.n) lay(x.sbd).tuSua.add(String(x.n))
  for (const x of phep) if (x.n) lay(x.sbd).phep.add(String(x.n))
  for (const x of mua) if (x.n) { const m = lay(x.sbd); m.mua.set(String(x.n), Number(x.s) || 0); if (Number(x.r) === 1) m.datLai.add(String(x.n)) }
  for (const x of muc) if (Number(x.m) > 0) lay(x.sbd).muc.set(String(x.n), Number(x.m))
  let soEm = 0, coChuoiA = 0, mat = 0, matCuu = 0, cuuA = 0, binhB = 0, emBinhB = 0, tuanB1 = 0, tuanB2 = 0, chanMua = 0, tongA = 0, tongB = 0
  const kieu27: Record<string, number> = {}
  for (const [, n] of nk) {
    soEm++
    const a = chuoiNgayCuaEm(n as NhatKyChuoi, NGAY_A), b = chuoiNgayCuaEm(n as NhatKyChuoi, NGAY_B)
    if (a.so > 0) coChuoiA++
    tongA += a.so; tongB += b.so
    if (b.so < a.so) mat++
    if (a.cuu) { cuuA++; if (b.so === 0) matCuu++ }
    const k = b.lich7.find((x) => x.ngay === NGAY_A)?.kieu ?? '?'
    kieu27[k] = (kieu27[k] ?? 0) + 1
    if (b.giuChuoi > 0) { emBinhB++; binhB += b.giuChuoi }
    if (b.binhTuanNay >= 1) tuanB1++
    if (b.binhTuanNay >= 2) tuanB2++
    if (b.binhTuanNay >= 1 && b.giuChuoi === 0) chanMua++
  }
  return { soEm, coChuoi27: coChuoiA, tongChuoi27: tongA, tongChuoi28: tongB, matChuoiQua27: mat, dangCuu27: cuuA, matCoHoiCuu: matCuu, kieuNgay27: kieu27,
    emCoBinh28: emBinhB, tongBinh28: binhB, binhTuanNay_ge1: tuanB1, binhTuanNay_ge2: tuanB2, chanMuaDuBinh0: chanMua }
})
await an('dat_lai_binh', async () => ({ nguon: await query("SELECT nguon, COUNT(*) AS dong, MIN(luc) AS luc, SUM(so) AS tongSo FROM chuoi_binh_mua WHERE nguon LIKE 'tt-binh-reset%' GROUP BY nguon") }))
await an('binh_tuan_vi', async () => ({ ds: await query("SELECT substr(khoa_yeu_cau, 4, 10) AS ngay, COUNT(*) AS khoan, COUNT(DISTINCT sbd) AS soEm FROM vang_so WHERE khoa_yeu_cau LIKE 'tt|2026-10-2%|%binh%' GROUP BY 1 ORDER BY 1") }))
await an('ktcn', async () => ({ ds: await query(`SELECT ngay, trang_thai AS tt, (nop_luc IS NULL) AS chuaNop, (han_luc <= ?) AS quaHan, COUNT(*) AS n,
    MIN(datetime(mo_luc/1000, 'unixepoch', '+7 hours')) AS moSom, MAX(datetime(han_luc/1000, 'unixepoch', '+7 hours')) AS hanMuon
    FROM kiem_tra_ca_nhan WHERE ngay IN ('2026-10-27', '2026-10-28') GROUP BY 1, 2, 3, 4 ORDER BY 1, 2`, [Date.now()]) }))
await an('lap_cau', async () => ({ ds: await query(`SELECT ngay_vn AS ngay, COUNT(*) AS cauLap, COALESCE(SUM(t), 0) AS nguyenTuLap FROM (
    SELECT sbd, CASE WHEN instr(qid, '~') > 0 THEN substr(qid, 1, instr(qid, '~') - 1) ELSE qid END AS goc, ngay_vn, COUNT(*) AS c, SUM(exp) - MAX(exp) AS t
    FROM exp_so WHERE ngay_vn >= '2026-10-26' AND qid IS NOT NULL AND exp > 0 GROUP BY 1, 2, 3 HAVING c > 1) GROUP BY 1 ORDER BY 1`) }))
await an('lap_phat', async () => ({ ds: await query(`SELECT ngay_vn AS ngay, COUNT(*) AS cauNgay, SUM(c > 1) AS lap, SUM(c > 1 AND d > 0) AS lapSauDung FROM (
    SELECT sbd, CASE WHEN instr(qid, '~') > 0 THEN substr(qid, 1, instr(qid, '~') - 1) ELSE qid END AS goc, ngay_vn, COUNT(*) AS c, SUM(ket_qua = 1) AS d
    FROM su_kien_hoc WHERE ngay_vn >= '2026-10-26' AND ket_qua IS NOT NULL AND nguon <> 'thi' AND ma_nguon NOT LIKE 'ktcn:%' GROUP BY 1, 2, 3) GROUP BY 1 ORDER BY 1`) }))
await an('cong_tac', async () => ({ ds: await query("SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN ('hs_tam_dong')") }))
