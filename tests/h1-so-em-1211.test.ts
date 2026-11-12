// @vitest-environment node
// H1 (12/11, hoá đơn D1 đợt 3 — câu đọc SỔ HỌC theo em). Khoá cho các câu đã đổi: KẾT QUẢ Y HỆT câu cũ trên dữ liệu giả ngẫu nhiên + KẾ HOẠCH đi đúng chỉ mục.
//   (a) `so_em_dem` (trigger trên sổ) = COUNT / MAX(COALESCE(received_at,0)) của sổ qua 600 lệnh ghi ngẫu nhiên (thêm, trùng, ON CONFLICT DO UPDATE đổi mốc,
//       đổi sbd, đổi mốc, xoá, mốc NULL, mốc lùi); câu đọc `SQL_DEM_SO` = câu cũ, có dấu lẫn không dấu; nhánh không dùng không đọc dòng nào.
//   (b) chỉ mục bộ phận lượt chưa đúng: ba câu nợ (docQidSaiV2, docQidSaiTaiLop, docQidSaiCaDaCongBo) trả CÙNG dòng như câu cũ (đường lùi khi thiếu chỉ mục)
//       và kế hoạch dùng idx_skh_em_chua_dung.
//   (c) loi_giai_hoi: «xem trong 12 giờ» (mốc chữ + julianday) y hệt câu cũ.
//   (d) Thi đua hôm nay: phần hôm nay dò (sbd, luc) từ max(mốc, ngày − 2) — cùng dòng như câu cũ.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_DEM_SO, SQL_DEM_SO_CU } from '../server/src/omni-d1'
import { docQidSaiV2 } from '../server/src/hang-chua-loi'
import { docQidSaiCaDaCongBo, docQidSaiTaiLop } from '../server/src/srs2-d1'
import { mocXemGan7, SQL_XEM_GAN_7, SQL_XEM_GAN_7_CU } from '../server/src/goi-bai-7-xem-gan'
import { ngayTruocCuaChuoi, SQL_SO_CAU_LOP } from '../server/src/thi-dua-hom-nay'
import { CHI_MUC_CRON_DEM } from '../server/src/chi-muc-luc-chay'
import { readFileSync } from 'node:fs'

type Sql = D1That['sql']
type R = Record<string, unknown>
const plan = (sql: Sql, q: string): string => (sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail).join(' | ')
function ngauNhien(hat: number) { let s = hat >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 } }
const chon = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]!
const xep = (rows: unknown[]) => rows.map((x) => JSON.stringify(x)).sort()
/** Ghi lại câu SQL + dòng trả của mọi lượt `all()` (để so đúng câu mà mã máy chủ gửi D1). */
function ghiLai(env: Env): { q: string; rows?: R[]; loi?: boolean }[] {
  const log: { q: string; rows?: R[]; loi?: boolean }[] = []
  const db = env.DB as unknown as { prepare: (s: string) => { all: () => Promise<{ results: R[] }> } }
  const goc = db.prepare.bind(db)
  db.prepare = (s: string) => {
    const st = goc(s), all0 = st.all.bind(st)
    st.all = async () => { try { const r = await all0(); log.push({ q: s, rows: r.results }); return r } catch (e) { log.push({ q: s, loi: true }); throw e } }
    return st
  }
  return log
}

// ------------------------------------------------------------------------------------------------ (a)
describe('H1 (a) — so_em_dem: số dòng sổ + mốc tiếp nhận lớn nhất của từng em tính sẵn', () => {
  it('600 lệnh ghi ngẫu nhiên: bảng = GROUP BY của sổ; SQL_DEM_SO = câu cũ (có dấu / gỡ dấu)', () => {
    const d = taoD1That(), r = ngauNhien(11)
    const EM = ['E1', 'E2', 'E3', 'E4']
    const moc = () => (r() < 0.12 ? null : 1_762_000_000_000 + Math.floor(r() * 5_000_000)) // mốc lùi / tiến tuỳ ý, có NULL
    const them = d.sql.prepare("INSERT OR IGNORE INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,received_at) VALUES(?,?,?,'game','m','2026-11-01T00:00:00Z','2026-11-01',?)")
    const capNhat = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,received_at) VALUES(?,?,'Q','thi','ca','2026-11-02T00:00:00Z','2026-11-02',?) ON CONFLICT(khoa) DO UPDATE SET ket_qua = 1, received_at = COALESCE(excluded.received_at, su_kien_hoc.received_at)")
    let k = 0
    const khoaCo = () => (d.sql.prepare('SELECT khoa FROM su_kien_hoc ORDER BY khoa LIMIT 1 OFFSET ?').get(Math.floor(r() * Math.max(1, k))) as { khoa: string } | undefined)?.khoa
    const soSanh = () => {
      const that = xep(d.sql.prepare("SELECT sbd, COUNT(*) AS n, MAX(COALESCE(received_at, 0)) AS r FROM su_kien_hoc GROUP BY sbd").all())
      const bang = xep(d.sql.prepare("SELECT sbd, n, r FROM so_em_dem WHERE sbd <> '*' AND n > 0").all())
      expect(bang).toEqual(that)
      const ds = JSON.stringify([...EM, 'E9'])
      expect(xep(d.sql.prepare(SQL_DEM_SO).all(ds))).toEqual(xep(d.sql.prepare(SQL_DEM_SO_CU).all(ds)))
    }
    for (let i = 0; i < 600; i++) {
      const loai = r()
      if (loai < 0.45 || k < 5) them.run(`k${k++}`, chon(r, EM), `Q${Math.floor(r() * 9)}`, moc())
      else if (loai < 0.55) { const kk = khoaCo(); if (kk) them.run(kk, chon(r, EM), 'Q1', moc()) } // trùng khoá ⇒ bỏ qua
      else if (loai < 0.68) { const kk = khoaCo(); if (kk) capNhat.run(kk, chon(r, EM), moc()) } // chấm lại: đổi mốc (có thể lùi)
      else if (loai < 0.76) { const kk = khoaCo(); if (kk) d.sql.prepare('UPDATE su_kien_hoc SET sbd = ? WHERE khoa = ?').run(chon(r, EM), kk) } // đổi SBD
      else if (loai < 0.84) { const kk = khoaCo(); if (kk) d.sql.prepare('UPDATE su_kien_hoc SET received_at = ? WHERE khoa = ?').run(moc(), kk) }
      else if (loai < 0.9) { const kk = khoaCo(); if (kk) d.sql.prepare("UPDATE su_kien_hoc SET ket_qua = 0, visibility = 'released' WHERE khoa = ?").run(kk) } // cột khác
      else { const kk = khoaCo(); if (kk) d.sql.prepare('DELETE FROM su_kien_hoc WHERE khoa = ?').run(kk) }
      if (i % 50 === 0) soSanh()
    }
    soSanh()
    // Gỡ dấu ⇒ nhánh sổ (y câu cũ); nạp lại (chạy lại tệp migration) ⇒ vẫn đúng.
    d.sql.exec("DELETE FROM so_em_dem WHERE sbd = '*'")
    const ds = JSON.stringify(EM)
    expect(xep(d.sql.prepare(SQL_DEM_SO).all(ds))).toEqual(xep(d.sql.prepare(SQL_DEM_SO_CU).all(ds)))
    d.sql.exec(readFileSync('server/migration-z-1211-a-so-em-dem.sql', 'utf8'))
    d.sql.exec(readFileSync('server/migration-z-1211-dau-so-em-dem.sql', 'utf8'))
    soSanh()
  })

  it('kế hoạch: nhánh bảng dò khoá chính so_em_dem; nhánh sổ nằm sau tập rỗng (không quét) — không còn quét chỉ mục sổ theo em', () => {
    const d = taoD1That()
    const p = plan(d.sql, SQL_DEM_SO)
    expect(p).toMatch(/SEARCH so_em_dem USING PRIMARY KEY \(sbd=\?\)/)
    expect(p).not.toMatch(/SCAN su_kien_hoc/)
    // Có dấu ⇒ tập dò của nhánh sổ rỗng: đếm bước VM của câu (đo thô) không tăng theo cỡ sổ.
    const them = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,received_at) VALUES(?,?,'Q','game','m','2026-11-01T00:00:00Z','2026-11-01',?)")
    for (let i = 0; i < 300; i++) them.run(`k${i}`, 'E1', i)
    expect(d.sql.prepare(SQL_DEM_SO).all('["E1"]')).toEqual([{ sbd: 'E1', n: 300, r: 299 }])
  })
})

// ------------------------------------------------------------------------------------------------ (b)
function dungSo(hat: number) {
  const d = taoD1That(), r = ngauNhien(hat)
  d.sql.exec(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('caA','dong','ca_lop_xong','x'),('caB','mo','ca_lop_xong','x'),('caC','mo','ngay','x'),('caD','da_xoa','ngay','x')`)
  const Q = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', '']
  d.sql.exec('CREATE TABLE IF NOT EXISTS game_v2_question (ma_de TEXT NOT NULL, qid TEXT NOT NULL, version TEXT NOT NULL, content_group TEXT NOT NULL, dang TEXT, json TEXT NOT NULL, PRIMARY KEY(ma_de,qid))')
  const them = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
  for (let i = 0; i < 900; i++) {
    const nguon = chon(r, ['thi', 'len_bang', 'dau_gio', 'game', 'luyen', 'chua_loi'])
    const ma = nguon === 'thi' ? chon(r, ['caA', 'caB', 'caC', 'caD', 'caX']) : chon(r, ['m', 'ktcn:1'])
    const ngay = `2026-${chon(r, ['09-20', '09-29', '10-05', '10-30', '11-11'])}`
    them.run(`k${i}`, chon(r, ['E1', 'E2']), chon(r, Q), nguon, ma, chon(r, [0, 0, 1, 1, 1, null, 2]), `${ngay}T0${Math.floor(r() * 9)}:00:00.000Z`, ngay,
      chon(r, [null, '', 'none', 'assisted']), chon(r, [null, 'released', 'embargoed']), chon(r, [null, 'xem_loi_giai', 'luot', 'chan_doan', 'luyen']))
  }
  return d
}
/** Câu MỚI (dùng chỉ mục bộ phận) và câu CŨ (đường lùi khi D1 chưa có chỉ mục) của cùng hàm trả CÙNG dòng. */
async function soCuMoi(hat: number, goi: (env: Env) => Promise<unknown>) {
  const moi = dungSo(hat), cu = dungSo(hat)
  cu.sql.exec('DROP INDEX idx_skh_em_chua_dung')
  const lMoi = ghiLai(moi.env as unknown as Env), lCu = ghiLai(cu.env as unknown as Env)
  const kqMoi = await goi(moi.env as unknown as Env), kqCu = await goi(cu.env as unknown as Env)
  const cauMoi = lMoi.find((x) => /su_kien_hoc/.test(x.q) && !x.loi)!, cauCu = lCu.find((x) => /su_kien_hoc/.test(x.q) && !x.loi)!
  expect(cauMoi.q).toMatch(/INDEXED BY idx_skh_em_chua_dung/)
  expect(cauCu.q).not.toMatch(/INDEXED BY/)
  expect(cauMoi.rows!.length).toBeGreaterThan(0)
  expect(xep(cauMoi.rows!)).toEqual(xep(cauCu.rows!))
  expect(kqMoi).toEqual(kqCu)
  return { moi, cauMoi }
}

describe('H1 (b) — chỉ mục bộ phận lượt chưa đúng: ba câu nợ của kế hoạch ngày', () => {
  for (const hat of [1, 2, 3]) {
    it(`docQidSaiV2 / docQidSaiTaiLop / docQidSaiCaDaCongBo y hệt câu cũ (hạt ${hat})`, async () => {
      for (const sbd of ['E1', 'E2']) {
        const a = await soCuMoi(hat, (env) => docQidSaiV2(env, sbd))
        expect(plan(a.moi.sql, a.cauMoi.q.replace(/\?/g, "'x'"))).toMatch(/USING INDEX idx_skh_em_chua_dung \(sbd=\?\)/)
        const b = await soCuMoi(hat, (env) => docQidSaiTaiLop(env, sbd))
        expect(plan(b.moi.sql, b.cauMoi.q)).toMatch(/USING COVERING INDEX idx_skh_em_chua_dung \(sbd=\? AND nguon=\? AND ket_qua=\?\)/)
        const nhan: string[][] = []
        const c = await soCuMoi(hat, (env) => docQidSaiTaiLop(env, sbd, { now: Date.parse('2026-11-12T00:00:00Z'), nhan: (q) => nhan.push(q) }))
        expect(c.cauMoi.q).toMatch(/UNION ALL/)
        const e = await soCuMoi(hat, (env) => docQidSaiCaDaCongBo(env, sbd))
        expect(plan(e.moi.sql, e.cauMoi.q)).toMatch(/USING INDEX idx_skh_em_chua_dung \(sbd=\? AND nguon=\?\)/)
      }
    })
  }
  it('chỉ mục có trong migration VÀ trong danh sách dựng cron đêm (cùng định nghĩa)', () => {
    const ddl = 'CREATE INDEX IF NOT EXISTS idx_skh_em_chua_dung ON su_kien_hoc(sbd, nguon, ket_qua, qid, luc, ma_nguon) WHERE ket_qua IS NOT 1'
    expect(readFileSync('server/migration-z-1211-skh-chua-dung.sql', 'utf8')).toContain(ddl)
    expect(CHI_MUC_CRON_DEM).toContain(ddl)
  })
})

// ------------------------------------------------------------------------------------------------ (c)
describe('H1 (c) — loi_giai_hoi: xem trong 12 giờ', () => {
  it('y hệt câu cũ trên nhiều dạng `luc` và kế hoạch không tra bảng / dò khoảng', () => {
    const d = taoD1That(), r = ngauNhien(5)
    const them = d.sql.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)')
    const NOW = Date.parse('2026-11-12T13:00:00.000Z')
    for (let i = 0; i < 700; i++) {
      const t = NOW - Math.floor(r() * 4 * 86_400_000) + Math.floor(r() * 3_600_000)
      const iso = new Date(t).toISOString()
      const luc = chon(r, [iso, iso, iso.replace('T', ' ').slice(0, 19), `${new Date(t + 7 * 3_600_000).toISOString().slice(0, 19)}+07:00`, '2026-09-30T00:00:00.000Z', '2026-09-28T23:00:00.000Z'])
      them.run(chon(r, ['E1', 'E2']), `Q${Math.floor(r() * 30)}`, 'x', luc)
    }
    for (const sbd of ['E1', 'E2', 'E9']) {
      for (const now of [NOW, NOW - 86_400_000, NOW - 5 * 3_600_000]) {
        const iso = new Date(now).toISOString()
        const moi = d.sql.prepare(SQL_XEM_GAN_7).all(sbd, mocXemGan7(now), iso), cu = d.sql.prepare(SQL_XEM_GAN_7_CU).all(sbd, iso)
        expect(moi).toEqual(xep(cu).map((x) => JSON.parse(x)))
        if (sbd !== 'E9') expect(moi.length).toBeGreaterThan(0)
      }
    }
    expect(plan(d.sql, SQL_XEM_GAN_7)).toMatch(/USING INDEX idx_lg_hoi_em_luc \(sbd=\? AND luc>\?\)/)
  })
})

// ------------------------------------------------------------------------------------------------ (d)
describe('H1 (d) — Thi đua hôm nay: phần hôm nay dò từ max(mốc, ngày − 2)', () => {
  it('y hệt câu cũ (mốc cũ / mốc trong hôm nay) và dò (sbd, luc) có cận dưới', () => {
    const d = taoD1That(), r = ngauNhien(9)
    const CU = SQL_SO_CAU_LOP.replace("luc >= max(?3, date(?2, '-2 days'))", 'luc >= ?3')
    expect(CU).not.toBe(SQL_SO_CAU_LOP)
    const them = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn) VALUES(?,?,?,'game','m',?,?,?)")
    const homNay = '2026-11-12'
    for (let i = 0; i < 800; i++) {
      const t = Date.parse('2026-11-12T16:59:00.000Z') - Math.floor(r() * 6 * 86_400_000)
      const ngay = new Date(t + 7 * 3_600_000).toISOString().slice(0, 10)
      them.run(`k${i}`, chon(r, ['E1', 'E2', 'E3']), `Q${Math.floor(r() * 20)}`, chon(r, [0, 1, null]), new Date(t).toISOString(), ngay)
    }
    for (const moc of ['2026-09-21T05:00:00.000Z', '2026-11-12T03:00:00.000Z', '2026-11-11T18:00:00.000Z']) {
      const tham = ['["E1","E2","E3"]', homNay, moc, JSON.stringify(ngayTruocCuaChuoi(homNay))]
      const moi = d.sql.prepare(SQL_SO_CAU_LOP).all(...tham), cu = d.sql.prepare(CU).all(...tham)
      expect(xep(moi)).toEqual(xep(cu))
      expect(moi.some((x) => (x as R).ngay_vn === homNay)).toBe(true)
    }
    expect(plan(d.sql, SQL_SO_CAU_LOP)).toMatch(/SEARCH su_kien_hoc USING INDEX idx_skh_em_luc \(sbd=\? AND luc>\?\)/)
  })
})
