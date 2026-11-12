// Runtime workerd/D1 cục bộ (Miniflare), dữ liệu TỔNG HỢP; không kết nối production. Chạy: npx vitest run --config vitest.config.d1.ts tests/d1-runtime-h1-so-em-1211.test.ts
// H1 (12/11, hoá đơn D1 đợt 3): ĐO `meta.rows_read` (đúng bộ đếm D1 tính tiền) câu CŨ ↔ MỚI của nhóm sổ học theo em, trên lược đồ tối thiểu tự dựng
// (không phụ thuộc LUOC_DO_SQL): một em ~1.500 dòng sổ / 45 ngày + 40 em khác, ~700 dòng xem lời giải. Kết quả hai câu phải bằng nhau.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { xoaMoiDem } from '../server/src/dem-chung'
import { SQL_DEM_SO, SQL_DEM_SO_CU } from '../server/src/omni-d1'
import { docQidSaiV2 } from '../server/src/hang-chua-loi'
import { docQidSaiCaDaCongBo, docQidSaiTaiLop } from '../server/src/srs2-d1'
import { mocXemGan7, SQL_XEM_GAN_7, SQL_XEM_GAN_7_CU } from '../server/src/goi-bai-7-xem-gan'
import { ngayTruocCuaChuoi, SQL_SO_CAU_LOP } from '../server/src/thi-dua-hom-nay'

const E = env as unknown as Env
type Row = Record<string, unknown>
const NOW = Date.parse('2026-11-12T13:00:00.000Z'), HOM_NAY = '2026-11-12'
const CHI_MUC = 'CREATE INDEX IF NOT EXISTS idx_skh_em_chua_dung ON su_kien_hoc(sbd, nguon, ket_qua, qid, luc, ma_nguon) WHERE ket_qua IS NOT 1'
const DDL = [
  'DROP TABLE IF EXISTS su_kien_hoc', 'DROP TABLE IF EXISTS loi_giai_hoi', 'DROP TABLE IF EXISTS so_em_dem', 'DROP TABLE IF EXISTS ca', 'DROP TABLE IF EXISTS luot',
  `CREATE TABLE su_kien_hoc (khoa TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT NOT NULL, ma_nguon TEXT NOT NULL, lan INTEGER NOT NULL DEFAULT 1, ket_qua INTEGER,
    giay INTEGER, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, ma_dang TEXT, chuyen_de TEXT, muc_do TEXT, attempt_id TEXT, assistance TEXT, visibility TEXT, correction_of TEXT,
    policy_version TEXT, purpose TEXT, raw_json TEXT, subitem_json TEXT, received_at INTEGER)`,
  'CREATE INDEX idx_skh_em_ngay ON su_kien_hoc(sbd, ngay_vn)', 'CREATE INDEX idx_skh_em_qid ON su_kien_hoc(sbd, qid)', 'CREATE INDEX idx_skh_nguon ON su_kien_hoc(nguon, ma_nguon)',
  'CREATE INDEX idx_skh_luc ON su_kien_hoc(luc, sbd, ket_qua, ma_dang)', 'CREATE INDEX idx_skh_em_qid_ngay ON su_kien_hoc(sbd, qid, ngay_vn, ket_qua)',
  'CREATE INDEX idx_skh_em_ngay_qid ON su_kien_hoc(sbd, ngay_vn, qid, ket_qua)', 'CREATE INDEX idx_skh_tiep_nhan ON su_kien_hoc(sbd, received_at, khoa)',
  'CREATE INDEX idx_skh_sua_diem ON su_kien_hoc(correction_of)', 'CREATE INDEX idx_skh_em_luc ON su_kien_hoc(sbd, luc)', 'CREATE INDEX idx_skh_qid ON su_kien_hoc(qid)',
  'CREATE TABLE loi_giai_hoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, co_ho_so INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(sbd,qid,luc))',
  'CREATE INDEX idx_lg_hoi_em_cau_luc ON loi_giai_hoi(sbd,qid,luc)', 'CREATE INDEX idx_lg_hoi_em_luc ON loi_giai_hoi(sbd, luc)',
  "CREATE TABLE ca (ma_ca TEXT PRIMARY KEY, trang_thai TEXT NOT NULL, cong_bo TEXT, cap_nhat_luc TEXT NOT NULL DEFAULT 'x')",
  'CREATE TABLE luot (ma_ca TEXT, sbd TEXT, trang_thai TEXT, het_gio_luc TEXT)', 'CREATE INDEX idx_luot_em ON luot(ma_ca, sbd)', 'CREATE INDEX idx_luot_ca_tt ON luot(ma_ca, trang_thai, het_gio_luc)',
  'CREATE TABLE so_em_dem (sbd TEXT NOT NULL PRIMARY KEY, n INTEGER NOT NULL, r INTEGER NOT NULL) WITHOUT ROWID',
  CHI_MUC,
]
function hat(seed: number) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 2 ** 32 } }

/** Bọc D1: cộng `meta.rows_read` của mọi câu (cả câu lỗi = 0). */
function dem() {
  const tong = { rowsRead: 0, cau: [] as { q: string; rows: number }[] }
  const db = E.DB
  const boc = (st: ReturnType<Env['DB']['prepare']>, q: string): ReturnType<Env['DB']['prepare']> => new Proxy(st, {
    get(t, p) {
      const v = Reflect.get(t, p) as unknown
      if (p === 'bind') return (...a: unknown[]) => boc((v as (...x: unknown[]) => ReturnType<Env['DB']['prepare']>).apply(t, a), q)
      if (p === 'all' || p === 'run' || p === 'first') return async () => {
        const r = (await (p === 'first' ? (t as unknown as { all: () => Promise<unknown> }).all() : (v as () => Promise<unknown>).apply(t))) as { meta?: { rows_read?: number }; results?: Row[] }
        const n = Number(r.meta?.rows_read ?? 0)
        tong.rowsRead += n; tong.cau.push({ q, rows: n })
        return p === 'first' ? (r.results?.[0] ?? null) : r
      }
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(t) : v
    },
  })
  return { env: { ...E, DB: { prepare: (q: string) => boc(db.prepare(q), q), batch: db.batch.bind(db) } } as unknown as Env, tong }
}
const doc = async (q: string, ...a: unknown[]) => { const r = await E.DB.prepare(q).bind(...a).all<Row>(); return { rows: r.results ?? [], doc: Number(r.meta.rows_read ?? 0) } }
const xep = (rows: unknown[]) => rows.map((x) => JSON.stringify(x)).sort()
const KQ: string[] = []

beforeAll(async () => {
  for (const s of DDL) await E.DB.prepare(s).run()
  await E.DB.batch([
    E.DB.prepare("INSERT INTO ca(ma_ca,trang_thai,cong_bo) VALUES('caA','dong','ca_lop_xong'),('caB','mo','ca_lop_xong'),('caC','dong','ngay'),('caD','da_xoa','ngay')"),
  ])
  const r = hat(1211)
  const em = ['H1', ...Array.from({ length: 40 }, (_, i) => `K${String(i).padStart(2, '0')}`)]
  let k = 0
  for (const s of em) {
    const n = s === 'H1' ? 1500 : 300, hang: unknown[] = []
    for (let i = 0; i < n; i++) {
      const t = NOW - Math.floor(r() * 45 * 86_400_000)
      const x = r(), nguon = x < 0.6 ? 'game' : x < 0.75 ? 'thi' : x < 0.78 ? 'len_bang' : x < 0.8 ? 'dau_gio' : x < 0.9 ? 'chua_loi' : 'luyen'
      const kq = r() < 0.6 ? 1 : r() < 0.62 ? 0 : null
      hang.push([`k${k++}`, s, `Q${Math.floor(r() * 400)}`, nguon, nguon === 'thi' ? ['caA', 'caB', 'caC', 'caD'][Math.floor(r() * 4)] : 'm', kq, new Date(t).toISOString(),
        new Date(t + 7 * 3_600_000).toISOString().slice(0, 10), r() < 0.1 ? 'assisted' : 'none', r() < 0.05 ? 'embargoed' : 'released', r() < 0.08 ? 'xem_loi_giai' : r() < 0.1 ? 'luot' : null, t])
    }
    for (let i = 0; i < hang.length; i += 400) {
      await E.DB.prepare(`INSERT INTO su_kien_hoc (khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility,purpose,received_at)
        SELECT json_extract(j.value,'$[0]'),json_extract(j.value,'$[1]'),json_extract(j.value,'$[2]'),json_extract(j.value,'$[3]'),json_extract(j.value,'$[4]'),json_extract(j.value,'$[5]'),
          json_extract(j.value,'$[6]'),json_extract(j.value,'$[7]'),json_extract(j.value,'$[8]'),json_extract(j.value,'$[9]'),json_extract(j.value,'$[10]'),json_extract(j.value,'$[11]') FROM json_each(?) j`)
        .bind(JSON.stringify(hang.slice(i, i + 400))).run()
    }
  }
  const lg: unknown[] = []
  for (let i = 0; i < 700; i++) lg.push(['H1', `Q${Math.floor(r() * 400)}`, new Date(NOW - Math.floor(r() * 45 * 86_400_000)).toISOString()])
  for (let i = 0; i < 300; i++) lg.push([`K0${i % 10}`, `Q${Math.floor(r() * 400)}`, new Date(NOW - Math.floor(r() * 45 * 86_400_000)).toISOString()])
  await E.DB.prepare("INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) SELECT json_extract(j.value,'$[0]'),json_extract(j.value,'$[1]'),json_extract(j.value,'$[2]') FROM json_each(?) j").bind(JSON.stringify(lg)).run()
  await E.DB.prepare("INSERT INTO so_em_dem (sbd, n, r) SELECT sbd, COUNT(*), MAX(COALESCE(received_at, 0)) FROM su_kien_hoc GROUP BY sbd").run()
  await E.DB.prepare("INSERT INTO so_em_dem (sbd, n, r) VALUES ('*', 0, 0)").run()
}, 120_000)

// Bộ test runtime dùng CHUNG một D1 (isolatedStorage: false) ⇒ xoá các bảng tối thiểu vừa dựng để tệp sau tự dựng lại lược đồ đủ cột.
afterAll(async () => {
  for (const t of ['su_kien_hoc', 'loi_giai_hoi', 'so_em_dem', 'ca', 'luot']) await E.DB.prepare(`DROP TABLE IF EXISTS ${t}`).run()
})

describe('H1 — rows_read D1 thật (Miniflare) câu cũ ↔ mới, một em ~1.500 dòng sổ', () => {
  it('đếm sổ OMNI (so_em_dem)', async () => {
    const ds = '["H1"]'
    const cu = await doc(SQL_DEM_SO_CU, ds), moi = await doc(SQL_DEM_SO, ds)
    expect(moi.rows).toEqual(cu.rows)
    KQ.push(`đếm sổ: ${cu.doc} → ${moi.doc}`)
    expect(moi.doc).toBeLessThan(cu.doc / 50)
  })
  it('ba câu nợ (chỉ mục bộ phận lượt chưa đúng)', async () => {
    for (const [ten, f] of [['docQidSaiV2', (e: Env) => docQidSaiV2(e, 'H1')], ['docQidSaiTaiLop', (e: Env) => docQidSaiTaiLop(e, 'H1')], ['docQidSaiCaDaCongBo', (e: Env) => docQidSaiCaDaCongBo(e, 'H1')]] as const) {
      const a = dem(); const kqMoi = await f(a.env)
      const sMoi = a.tong.cau.filter((x) => /su_kien_hoc/.test(x.q))
      expect(sMoi[0]!.q).toMatch(/INDEXED BY/)
      await E.DB.prepare('DROP INDEX idx_skh_em_chua_dung').run()
      const b = dem(); const kqCu = await f(b.env)
      await E.DB.prepare(CHI_MUC).run()
      xoaMoiDem() // quên dấu «thiếu chỉ mục» (nhớ 10 phút) của lượt đo câu cũ
      const sCu = b.tong.cau.filter((x) => /su_kien_hoc/.test(x.q) && !/INDEXED BY/.test(x.q))
      expect(kqMoi).toEqual(kqCu)
      KQ.push(`${ten}: ${sCu.reduce((s, x) => s + x.rows, 0)} → ${sMoi[0]!.rows}`)
      expect(sMoi[0]!.rows).toBeLessThan(sCu.reduce((s, x) => s + x.rows, 0))
    }
  })
  it('loi_giai_hoi: xem 12 giờ', async () => {
    const iso = new Date(NOW).toISOString()
    const cuB = await doc(SQL_XEM_GAN_7_CU, 'H1', iso), moiB = await doc(SQL_XEM_GAN_7, 'H1', mocXemGan7(NOW), iso)
    expect(xep(moiB.rows)).toEqual(xep(cuB.rows))
    KQ.push(`xem 12 giờ: ${cuB.doc} → ${moiB.doc}`)
    expect(moiB.doc).toBeLessThan(cuB.doc / 5)
  })
  it('Thi đua hôm nay (cả lớp 41 em, mốc cũ)', async () => {
    const CU = SQL_SO_CAU_LOP.replace("luc >= max(?3, date(?2, '-2 days'))", 'luc >= ?3')
    const tham = [JSON.stringify(['H1', ...Array.from({ length: 40 }, (_, i) => `K${String(i).padStart(2, '0')}`)]), HOM_NAY, '2026-09-21T05:00:00.000Z', JSON.stringify(ngayTruocCuaChuoi(HOM_NAY))]
    const cu = await doc(CU, ...tham), moi = await doc(SQL_SO_CAU_LOP, ...tham)
    expect(xep(moi.rows)).toEqual(xep(cu.rows))
    KQ.push(`thi đua hôm nay: ${cu.doc} → ${moi.doc}`)
    console.log(`[H1 rows_read cũ → mới]\n  ${KQ.join('\n  ')}`)
    expect(moi.doc).toBeLessThan(cu.doc)
    console.log(`[H1 rows_read cũ → mới]\n  ${KQ.join('\n  ')}`)
  })
})
