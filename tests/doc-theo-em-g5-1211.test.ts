// @vitest-environment node
// G5 (12/11, hoá đơn D1 — «câu đọc theo từng em, gọi rất nhiều»). Khoá cho bốn câu đọc:
//   (a) `docCauDaLamMoiNguon` — bảng tính sẵn `cau_lam_cuoi` (trigger trên sổ) cho Map Y HỆT câu cũ `MAX(luc) … GROUP BY qid` qua mọi kiểu ghi sổ
//       (thêm / bỏ qua trùng / ON CONFLICT DO UPDATE / UPDATE / DELETE), cả khi chưa có dấu và khi D1 chưa có bảng; nhánh không dùng có khoá dò NULL.
//   (b) điều kiện KHỚP của `cau_meta` — dấu '*k' do trigger giữ: còn dấu ⇒ điều kiện đầy đủ đúng (thử ngẫu nhiên); không còn quét game_v2_index;
//       câu đọc srs2 đặt điều kiện trong danh sách qid.
//   (c) truy vấn 1 của `layCauChoEm` — `da_gap` và `nghi` cho cùng kết quả với câu cũ (trên mọi gốc câu xin); không quét `cau_nghi_dap_an`.
//   (d) `docLanLam` > 200 câu — trong một lượt dùng chung một lần đọc sổ, kết quả y hệt.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import { docCauDaLamMoiNguon, SQL_DA_LAM, SQL_DA_LAM_CU } from '../server/src/game-v2-cau-moi'
import { dongBoCauMeta, KHOP, KHOP_DAY_DU } from '../server/src/cau-meta'
import { docMetaCau, docLanLam } from '../server/src/srs2-d1'
import { layCauChoEm } from '../server/src/cau-theo-qid'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import { xoaMoiDem } from '../server/src/dem-chung'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

type Sql = D1That['sql']
const plan = (sql: Sql, q: string): string[] => (sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail)
/** Bắt câu SQL mà một hàm máy chủ gửi D1 (để soi kế hoạch đúng câu đang chạy). */
function batSql(env: Env): string[] {
  const ds: string[] = []
  const db = env.DB as unknown as { prepare: (s: string) => unknown }
  const goc = db.prepare.bind(db)
  db.prepare = (s: string) => { ds.push(s); return goc(s) }
  return ds
}
/**
 * Khoá «nhánh không dùng không đọc dòng nào»: trong mã máy của câu, MỌI lượt dò (`SeekGE`) trên chỉ mục `chiMuc` có khoá là thanh ghi được kiểm `IsNull`
 * (nhảy qua cả vòng) TRƯỚC lượt dò — tức điều kiện dấu nằm trong khoá dò, không phải kiểm sau từng dòng.
 */
function doBiChanBoiKhoaNull(sql: Sql, q: string, chiMuc: string): number {
  const goc = (sql.prepare('SELECT rootpage FROM sqlite_master WHERE name = ?').get(chiMuc) as { rootpage: number }).rootpage
  const ma = sql.prepare(`EXPLAIN ${q}`).all() as { addr: number; opcode: string; p1: number; p2: number; p3: number }[]
  const conTro = new Set(ma.filter((x) => x.opcode === 'OpenRead' && x.p2 === goc).map((x) => x.p1))
  let n = 0
  for (const x of ma) {
    if (!conTro.has(x.p1) || !/^(Seek|Rewind|Last)/.test(x.opcode)) continue
    if (x.opcode === 'Rewind' || x.opcode === 'Last') throw new Error(`quét cả ${chiMuc}`)
    const chan = ma.some((y) => y.addr < x.addr && y.opcode === 'IsNull' && y.p1 === x.p3 && y.p2 > x.addr)
    if (!chan) throw new Error(`lượt dò ${chiMuc} @${x.addr} không có khoá NULL chặn trước`)
    n++
  }
  return n
}

// ------------------------------------------------------------------------------------------------ (a)
const ghiSo = (sql: Sql, khoa: string, sbd: string, qid: string, luc: string) =>
  sql.prepare("INSERT OR IGNORE INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn) VALUES(?,?,?,'game','x',?,substr(?,1,10))").run(khoa, sbd, qid, luc, luc)
const mapCu = (sql: Sql, sbd: string) => {
  const ra = new Map<string, number>()
  for (const x of sql.prepare(SQL_DA_LAM_CU).all(sbd) as { qid: string; luc: string }[]) { const t = Date.parse(String(x.luc)); ra.set(String(x.qid), Number.isFinite(t) ? t : 0) }
  return ra
}
const sapXep = (m: Map<string, number>) => [...m].sort((a, b) => (a[0] < b[0] ? -1 : 1))
/** Bộ sinh số giả tất định. */
function ngauNhien(hat: number) { let s = hat >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 } }

describe('G5 (a) — lần cuối em làm mỗi câu: bảng tính sẵn cau_lam_cuoi', () => {
  it('Map y hệt câu cũ qua 600 lệnh ghi sổ ngẫu nhiên (thêm, trùng, sửa luc / qid / sbd, đổi cột khác, xoá); bảng = GROUP BY của sổ', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const r = ngauNhien(7)
    const em = ['E1', 'E2', 'E3'], cau = Array.from({ length: 25 }, (_, i) => `Q${i}`)
    const chon = <T,>(a: T[]) => a[Math.floor(r() * a.length)]!
    const luc = () => `2026-1${Math.floor(r() * 2)}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}T${String(Math.floor(r() * 24)).padStart(2, '0')}:00:00.000Z`
    let k = 0
    for (let i = 0; i < 600; i++) {
      const loai = r()
      const khoaCo = () => (d.sql.prepare('SELECT khoa FROM su_kien_hoc ORDER BY khoa LIMIT 1 OFFSET ?').get(Math.floor(r() * Math.max(1, k))) as { khoa: string } | undefined)?.khoa
      if (loai < 0.5 || k < 5) { ghiSo(d.sql, `k${k++}`, chon(em), chon(cau), luc()) }
      else if (loai < 0.6) { const kk = khoaCo(); if (kk) ghiSo(d.sql, kk, chon(em), chon(cau), luc()) } // trùng khoá ⇒ bỏ qua
      else if (loai < 0.7) { const kk = khoaCo(); if (kk) d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn) VALUES(?,?,?,'thi','x',?,'x') ON CONFLICT(khoa) DO UPDATE SET luc=excluded.luc, ket_qua=1").run(kk, 'E1', 'Q0', luc()) }
      else if (loai < 0.78) { const kk = khoaCo(); if (kk) d.sql.prepare('UPDATE su_kien_hoc SET luc=? WHERE khoa=?').run(luc(), kk) }
      else if (loai < 0.83) { const kk = khoaCo(); if (kk) d.sql.prepare('UPDATE su_kien_hoc SET qid=?, sbd=? WHERE khoa=?').run(chon(cau), chon(em), kk) }
      else if (loai < 0.9) { const kk = khoaCo(); if (kk) d.sql.prepare("UPDATE su_kien_hoc SET visibility='released', ket_qua=0 WHERE khoa=?").run(kk) }
      else { const kk = khoaCo(); if (kk) d.sql.prepare('DELETE FROM su_kien_hoc WHERE khoa=?').run(kk) }
      if (i % 50 === 49) for (const s of em) expect(sapXep(await docCauDaLamMoiNguon(env, s))).toEqual(sapXep(mapCu(d.sql, s)))
    }
    // bảng đúng bằng GROUP BY của sổ (trừ dòng dấu)
    expect(d.sql.prepare("SELECT sbd, qid, luc FROM cau_lam_cuoi WHERE sbd <> '*' ORDER BY sbd, qid").all())
      .toEqual(d.sql.prepare('SELECT sbd, qid, MAX(luc) AS luc FROM su_kien_hoc GROUP BY sbd, qid ORDER BY sbd, qid').all())
    // xoá cả sổ một em (như sửa tay / reset) ⇒ bảng không còn dòng nào của em
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE sbd='E2'").run()
    expect(await docCauDaLamMoiNguon(env, 'E2')).toEqual(new Map())
    expect(d.sql.prepare("SELECT COUNT(*) n FROM cau_lam_cuoi WHERE sbd='E2'").get()).toEqual({ n: 0 })
    d.sql.close()
  })

  it('nạp sổ CŨ (D1 thật có sổ trước khi có trigger) bằng migration: chạy lại tệp vô hại, kết quả y hệt; chưa có dấu ⇒ đường cũ, y hệt', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    for (const s of ['DROP TRIGGER cau_lam_cuoi_sau_them', 'DROP TRIGGER cau_lam_cuoi_sau_sua', 'DROP TRIGGER cau_lam_cuoi_sau_xoa', 'DROP TABLE cau_lam_cuoi']) d.sql.exec(s)
    for (let i = 0; i < 300; i++) ghiSo(d.sql, `c${i}`, `E${i % 4}`, `Q${i % 37}`, `2026-10-${String(1 + (i * 7) % 28).padStart(2, '0')}T00:00:00Z`)
    const truoc = ['E0', 'E1', 'E2', 'E3', 'KHONG-CO'].map((s) => sapXep(mapCu(d.sql, s)))
    // chưa có bảng ⇒ lỗi «no such table» ⇒ câu cũ (đúng)
    expect(await Promise.all(['E0', 'E1', 'E2', 'E3', 'KHONG-CO'].map(async (s) => sapXep(await docCauDaLamMoiNguon(env, s))))).toEqual(truoc)
    const tep = readFileSync('server/migration-z-1211-cau-lam-cuoi.sql', 'utf8')
    d.sql.exec(tep); d.sql.exec(tep) // chạy hai lần: vô hại
    expect(d.sql.prepare("SELECT COUNT(*) n FROM cau_lam_cuoi WHERE sbd='*'").get()).toEqual({ n: 0 }) // dấu ở tệp riêng, chạy sau khi soát
    // soát như hướng dẫn trong tệp dấu: số dòng bảng = số cặp (sbd, qid) của sổ
    expect(d.sql.prepare("SELECT COUNT(*) n FROM cau_lam_cuoi WHERE sbd <> '*'").get()).toEqual(d.sql.prepare('SELECT COUNT(*) n FROM (SELECT 1 FROM su_kien_hoc GROUP BY sbd, qid)').get())
    d.sql.exec(readFileSync('server/migration-z-1211-dau-cau-lam-cuoi.sql', 'utf8'))
    expect(d.sql.prepare("SELECT COUNT(*) n FROM cau_lam_cuoi WHERE sbd='*'").get()).toEqual({ n: 1 })
    for (const [i, s] of ['E0', 'E1', 'E2', 'E3', 'KHONG-CO'].entries()) expect(sapXep(new Map((d.sql.prepare(SQL_DA_LAM).all(s) as { qid: string; luc: string }[]).map((x) => [x.qid, Date.parse(x.luc)])))).toEqual(truoc[i])
    // bỏ dấu ⇒ nhánh sổ, cùng kết quả
    d.sql.exec("DELETE FROM cau_lam_cuoi WHERE sbd='*'")
    for (const [i, s] of ['E0', 'E1', 'E2', 'E3', 'KHONG-CO'].entries()) expect(sapXep(new Map((d.sql.prepare(SQL_DA_LAM).all(s) as { qid: string; luc: string }[]).map((x) => [x.qid, Date.parse(x.luc)])))).toEqual(truoc[i])
    d.sql.close()
  })

  it('kế hoạch: nhánh bảng dò khoá chính (sbd=?); nhánh sổ chỉ dò khi KHÔNG có dấu — khoá dò NULL chặn trước (không duyệt sổ của em)', () => {
    const d = taoD1That()
    const p = plan(d.sql, SQL_DA_LAM)
    expect(p).toContain('SEARCH cau_lam_cuoi USING PRIMARY KEY (sbd=?)')
    expect(p.some((x) => /^SCAN (su_kien_hoc|cau_lam_cuoi)\b/.test(x))).toBe(false)
    expect(doBiChanBoiKhoaNull(d.sql, SQL_DA_LAM, 'idx_skh_em_qid')).toBeGreaterThan(0)
    // khoá dò của nhánh sổ là NULL khi có dấu, là sbd khi không có
    d.sql.exec("INSERT OR IGNORE INTO cau_lam_cuoi VALUES('*','*','')")
    const khoa = "SELECT (SELECT ?1 WHERE NOT EXISTS (SELECT 1 FROM cau_lam_cuoi WHERE sbd = '*' AND qid = '*')) AS k"
    expect(d.sql.prepare(khoa).get('E1')).toEqual({ k: null })
    d.sql.exec("DELETE FROM cau_lam_cuoi WHERE sbd='*'")
    expect(d.sql.prepare(khoa).get('E1')).toEqual({ k: 'E1' })
    d.sql.close()
  })
})

// ------------------------------------------------------------------------------------------------ (b)
describe('G5 (b) — KHỚP của cau_meta qua dấu do trigger giữ', () => {
  const kiem = (sql: Sql) => sql.prepare(`SELECT ${KHOP} AS moi, ${KHOP_DAY_DU} AS du`).get() as { moi: number; du: number }

  it('còn dấu ⇒ điều kiện khớp đầy đủ đúng, qua 300 bước ngẫu nhiên (lập lại chỉ mục, thêm / xoá tờ, đổi phiên bản nguồn, cron dựng dần)', async () => {
    const k = taoKhoOmni()
    k.d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) SELECT DISTINCT ma_de,'v','m0' FROM game_v2_question")
    const r = ngauNhien(11)
    const to = (k.d.sql.prepare('SELECT ma_de FROM game_v2_index ORDER BY ma_de').all() as { ma_de: string }[]).map((x) => x.ma_de)
    let coKhop = 0
    for (let i = 0; i < 300; i++) {
      const x = r(), t = to[Math.floor(r() * to.length)]!
      if (x < 0.35) await dongBoCauMeta(k.env, 1 + Math.floor(r() * 3))
      else if (x < 0.55) k.d.sql.prepare('UPDATE game_v2_index SET indexed_at=? WHERE ma_de=?').run(`m${i}`, t)
      else if (x < 0.65) k.d.sql.prepare('UPDATE game_v2_index SET source_version=? WHERE ma_de=?').run(`s${i}`, t)
      else if (x < 0.72) k.d.sql.prepare('DELETE FROM game_v2_index WHERE ma_de=?').run(t)
      else if (x < 0.8) k.d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v',?)").run(t, `m${i}`)
      else if (x < 0.85) k.d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v',?) ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at").run(t, `n${i}`)
      else await dongBoCauMeta(k.env, 40)
      const v = kiem(k.d.sql)
      if (v.moi) { expect(v.du).toBe(1); coKhop++ }
    }
    expect(coKhop).toBeGreaterThan(3) // nhánh bảng thật sự được dùng (xoá tờ còn câu ⇒ tờ mồ côi ⇒ hết khớp tới khi thêm lại tờ)
    // ổn định: thêm lại mốc mọi tờ có câu (hết tờ mồ côi), cron chạy tới khi hết lệch ⇒ có dấu, khớp
    k.d.sql.exec("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) SELECT DISTINCT ma_de,'v','cuoi' FROM game_v2_question")
    for (let i = 0; i < 20; i++) if (!(await dongBoCauMeta(k.env, 40)).conNua) break
    await dongBoCauMeta(k.env, 40)
    expect(kiem(k.d.sql)).toEqual({ moi: 1, du: 1 })
    k.d.sql.close()
  })

  it('trigger: đổi mốc / thêm / xoá tờ xoá dấu ngay; đổi phiên bản nguồn (mốc giữ nguyên) không xoá; cron ghi lại khi không còn tờ lệch', async () => {
    const k = taoKhoOmni()
    k.d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) SELECT DISTINCT ma_de,'v','m0' FROM game_v2_question")
    expect(await dongBoCauMeta(k.env, 40)).toMatchObject({ khop: true })
    const coDau = () => (k.d.sql.prepare("SELECT COUNT(*) n FROM cau_meta_to WHERE ma_de='*k'").get() as { n: number }).n
    expect(coDau()).toBe(1)
    k.d.sql.exec("UPDATE game_v2_index SET source_version='khac' WHERE ma_de='DH-B1'")
    expect(coDau()).toBe(1)
    k.d.sql.exec("UPDATE game_v2_index SET indexed_at='m1' WHERE ma_de='DH-B1'")
    expect(coDau()).toBe(0)
    expect(await dongBoCauMeta(k.env, 40)).toMatchObject({ dung: 1, khop: true })
    expect(coDau()).toBe(1)
    k.d.sql.exec("UPDATE game_v2_index SET indexed_at='m2' WHERE ma_de='DH-B1'; UPDATE game_v2_index SET indexed_at='m1' WHERE ma_de='DH-B1'") // đổi đi rồi đổi lại: không lệch
    expect(coDau()).toBe(0)
    expect(await dongBoCauMeta(k.env, 40)).toMatchObject({ dung: 0, khop: true }) // nhánh «không lệch, có '*', thiếu '*k'» ⇒ ghi lại
    expect(coDau()).toBe(1)
    k.d.sql.exec("DELETE FROM game_v2_index WHERE ma_de='DH-B1'")
    expect(coDau()).toBe(0)
    // không có trigger ⇒ cron KHÔNG BAO GIỜ ghi dấu '*k' (đọc luôn đi đường cũ)
    k.d.sql.exec('DROP TRIGGER cau_meta_khop_sau_xoa')
    await dongBoCauMeta(k.env, 40)
    expect(coDau()).toBe(0)
    k.d.sql.close()
  })

  it('kế hoạch: không còn quét game_v2_index / cau_meta_to; câu đọc srs2 đặt KHỚP trong danh sách qid (nhánh không dùng có danh sách rỗng)', async () => {
    const k = taoKhoOmni()
    k.d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) SELECT DISTINCT ma_de,'v','m0' FROM game_v2_question")
    expect(plan(k.d.sql, `SELECT ${KHOP}`).some((x) => /^SCAN (?!CONSTANT ROW)/.test(x))).toBe(false)
    expect(plan(k.d.sql, `SELECT ${KHOP_DAY_DU}`).some((x) => /^SCAN gi\b/.test(x))).toBe(true) // câu cũ quét cả bảng mốc — đúng thứ đã bỏ
    const ds = batSql(k.env)
    xoaMoiDem()
    await docMetaCau(k.env, ['DH-B1-0', 'DH-B1-1'])
    const cau = ds.find((s) => /FROM cau_meta WHERE/.test(s))!
    expect(cau).toBeTruthy()
    const p = (k.d.sql.prepare(`EXPLAIN QUERY PLAN ${cau}`).all() as { id: number; parent: number; detail: string }[])
    expect(p.some((x) => /^SCAN (gi|game_v2_index|cau_meta_to|cau_meta|game_v2_question)\b/.test(x.detail))).toBe(false)
    // mọi lượt dò cau_meta_to (điều kiện KHỚP) nằm DƯỚI một LIST SUBQUERY (danh sách qid), không ở vòng dò câu
    const cha = new Map(p.map((x) => [x.id, x]))
    const duoiDanhSach = (x: { parent: number }): boolean => { let c = cha.get(x.parent); while (c) { if (/^LIST SUBQUERY/.test(c.detail)) return true; c = cha.get(c.parent) } return false }
    const doDau = p.filter((x) => /cau_meta_to/.test(x.detail))
    expect(doDau.length).toBe(4)
    expect(doDau.every(duoiDanhSach)).toBe(true)
    k.d.sql.close()
  })
})

// ------------------------------------------------------------------------------------------------ (c)
const SQL_TV1_CU = `SELECT CASE WHEN EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = ?) OR EXISTS (SELECT 1 FROM danh_sach WHERE sbd = ?) OR EXISTS (SELECT 1 FROM luot WHERE sbd = ?)
                 THEN 1 ELSE 0 END AS co,
            (SELECT json_group_array(qid) FROM (SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)))) AS da_gap,
            (SELECT gia_tri FROM cau_hinh WHERE khoa = 'cau_snapshot') AS co_snapshot,
            (SELECT gia_tri FROM cau_hinh WHERE khoa = 'pham_vi_hoc') AS co_pham_vi,
            (SELECT gia_tri FROM cau_hinh WHERE khoa = 'ngan_sach_luot') AS co_ngan_sach,
            (SELECT json_group_array(qid) FROM (SELECT qid FROM cau_nghi_dap_an WHERE trang_thai = 'nghi' LIMIT 5000)) AS nghi`
const gocKhoi = (q: string) => q.split('~')[0]!

describe('G5 (c) — truy vấn 1 của layCauChoEm: da_gap + câu nghi chỉ theo câu xin', () => {
  it('cùng kết quả với câu cũ (da_gap y hệt; câu nghi: cùng câu trả lời «gốc này có nghi không» với mọi gốc câu xin); không quét bảng', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('H1','x','12','x')").run()
    d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,lop,cap_nhat_luc) VALUES('D1','x','12','x')").run()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('cau_snapshot','bat','x')").run()
    const ten = ['A1', 'A12', 'A1~ss0', 'A1~ss3', 'A2', 'B', 'B~bt1', 'B-1', 'C', '~x', 'A1-z', 'A1}']
    let i = 0
    for (const sbd of ['H1', 'D1']) for (const q of ten) for (let n = 0; n < 1 + (q.length % 3); n++) ghiSo(d.sql, `s${i++}`, sbd, q, '2026-10-01T00:00:00Z')
    const nghi = d.sql.prepare("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES(?,10,8,0.8,?,'x')")
    for (const [q, tt] of [['A1~ss1', 'nghi'], ['A12', 'nghi'], ['B', 'da_sua'], ['B~bt1', 'nghi'], ['C', 'nghi'], ['A1-z', 'nghi'], ['Z9', 'nghi'], ['~y', 'nghi']] as const) nghi.run(q, tt)
    const ds = batSql(env)
    const xinBo = [['A1', 'B', 'C', 'KHONG'], ['A1~ss0', 'A12', 'B-1'], ['~x', 'A1}', 'A1-z', 'Z9'], ['A2'], ['C~ss2', 'B~bt1']]
    for (const sbd of ['H1', 'D1', 'L1', 'KHONG-CO']) for (const xin of xinBo) {
      ds.length = 0
      await layCauChoEm(env, sbd, xin)
      const cauMoi = ds[0]!
      const moi = d.sql.prepare(cauMoi).get(sbd, JSON.stringify(xin)) as Record<string, string | number>
      const cu = d.sql.prepare(SQL_TV1_CU).get(sbd, sbd, sbd, sbd, JSON.stringify(xin)) as Record<string, string | number>
      const { nghi: nMoi, ...restMoi } = moi, { nghi: nCu, ...restCu } = cu
      expect(restMoi).toEqual(restCu)
      const tap = (j: unknown) => new Set((JSON.parse(String(j)) as string[]).map(gocKhoi).filter(Boolean))
      const a = tap(nMoi), b = tap(nCu)
      for (const q of xin) for (const k of [q, gocKhoi(q)]) expect([k, a.has(k)]).toEqual([k, b.has(k)])
    }
    const cauMoi = ds[0]!
    const p = plan(d.sql, cauMoi)
    expect(p.some((x) => /^SCAN (cau_nghi_dap_an|su_kien_hoc|n|s)\b/.test(x))).toBe(false)
    expect(p.some((x) => /cau_nghi_dap_an/.test(x) && /qid/.test(x))).toBe(true)
    expect(plan(d.sql, SQL_TV1_CU)).toContain('SCAN cau_nghi_dap_an') // câu cũ quét cả bảng — đúng thứ đã bỏ
    d.sql.close()
  })
})

// ------------------------------------------------------------------------------------------------ (d)
describe('G5 (d) — docLanLam > 200 câu: một lượt đọc sổ dùng chung trong cùng request', () => {
  it('kết quả y hệt đọc riêng; cùng mốc ⇒ một lần đọc; đã đọc cả sổ ⇒ mốc sau lọc tại chỗ; lệnh ghi sổ xoá bản nhớ', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const qids = Array.from({ length: 260 }, (_, i) => `Q${i}`)
    const purpose = [null, 'xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc', 'on']
    const st = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,ket_qua,purpose,visibility,raw_json) VALUES(?,?,?,'game','x',?,'x',?,?,?,?)")
    for (let i = 0; i < 900; i++) st.run(`k${i}`, i % 5 ? 'E1' : 'E2', i % 3 ? `Q${i % 300}` : `Q${i % 300}~ss${i % 4}`, `2026-10-${String(1 + (i * 11) % 28).padStart(2, '0')}T0${i % 10}:00:00.000Z`, i % 2, purpose[i % purpose.length], i % 13 ? 'released' : 'embargoed', i % 7 ? null : JSON.stringify({ tc: `Q${i % 50}` }))
    const MOC = '2026-10-15T00:00:00.000Z'
    const rieng = { a: await docLanLam(env, 'E1', qids, ''), b: await docLanLam(env, 'E1', qids, MOC) }
    expect(rieng.a.length).toBeGreaterThan(rieng.b.length)
    expect(rieng.b.length).toBeGreaterThan(0)
    // một request (bản gộp): cả sổ trước, mốc sau ⇒ một lần đọc
    const gop = { ...env, DB: gopDocD1(env.DB) } as Env
    const ds = batSql(gop)
    const a = await docLanLam(gop, 'E1', qids, '')
    const b = await docLanLam(gop, 'E1', qids, MOC)
    const a2 = await docLanLam(gop, 'E1', qids, '')
    expect([a, b, a2]).toEqual([rieng.a, rieng.b, rieng.a])
    expect(ds.filter((s) => /FROM su_kien_hoc WHERE sbd = \? AND luc >= \?/.test(s)).length).toBe(1)
    // ghi sổ trong lượt ⇒ đọc lại (thấy dòng mới)
    await gop.DB.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn,ket_qua) VALUES('moi','E1','Q1','game','x','2026-10-30T00:00:00.000Z','x',1)").run()
    const c = await docLanLam(gop, 'E1', qids, MOC)
    expect(c.length).toBe(rieng.b.length + 1)
    expect(c).toEqual(await docLanLam(env, 'E1', qids, MOC))
    // THỨ TỰ THẬT của hồ sơ (docHoSo2): lượt chính từ mốc X bắt đầu TRƯỚC (đang bay), ôn bài cũ cả sổ bắt đầu sau ⇒ chỉ đọc thêm phần `luc < X`
    const gop2 = { ...env, DB: gopDocD1(env.DB) } as Env
    const ds2 = batSql(gop2)
    const pChinh = docLanLam(gop2, 'E1', qids, MOC)
    const pOn = docLanLam(gop2, 'E1', qids.slice(30), '')
    const [chinh, on] = await Promise.all([pChinh, pOn])
    expect(chinh).toEqual(await docLanLam(env, 'E1', qids, MOC))
    expect(on).toEqual(await docLanLam(env, 'E1', qids.slice(30), ''))
    expect(ds2.filter((s) => /FROM su_kien_hoc WHERE sbd = \? AND luc >= \?/.test(s)).length).toBe(1)
    expect(ds2.filter((s) => /FROM su_kien_hoc WHERE sbd = \? AND luc < \?/.test(s)).length).toBe(1)
    // em khác không dùng nhầm sổ của em này
    expect(await docLanLam(gop2, 'E2', qids, '')).toEqual(await docLanLam(env, 'E2', qids, ''))
    d.sql.close()
  })
})

describe('G5 — đổi số báo danh (/gv/doi-sbd) với bảng dẫn xuất cau_lam_cuoi', () => {
  it('bảng không vào danh sách quét; trigger chuyển dòng của em sang số mới; bảng vẫn = GROUP BY của sổ', async () => {
    const { doiSbd } = await import('../server/src/doi-sbd')
    const d = taoD1That()
    const env = d.env as unknown as Env
    ghiSo(d.sql, '153169|100042|Q1', '100042', 'Q1', '2026-10-01T00:00:00Z')
    ghiSo(d.sql, 'k2', '100042', 'Q2-100042', '2026-10-02T00:00:00Z')
    ghiSo(d.sql, 'k3', '10042', 'Q1', '2026-10-03T00:00:00Z')
    const cot = (await doiSbd(env, { cu: '100042', moi: '10048', lietKeCot: true })).cot as string[]
    expect(cot.some((x) => x.startsWith('cau_lam_cuoi.'))).toBe(false)
    expect(await doiSbd(env, { cu: '100042', moi: '10048', chayThat: true })).toMatchObject({ ok: true })
    expect(d.sql.prepare("SELECT sbd, qid, luc FROM cau_lam_cuoi WHERE sbd <> '*' ORDER BY sbd, qid").all())
      .toEqual(d.sql.prepare('SELECT sbd, qid, MAX(luc) AS luc FROM su_kien_hoc GROUP BY sbd, qid ORDER BY sbd, qid').all())
    expect(sapXep(await docCauDaLamMoiNguon(env, '10048'))).toEqual(sapXep(mapCu(d.sql, '10048')))
    expect(await docCauDaLamMoiNguon(env, '100042')).toEqual(new Map())
    d.sql.close()
  })
})
