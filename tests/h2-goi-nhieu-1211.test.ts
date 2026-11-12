// @vitest-environment node
// NHÓM H2 (12/11, đợt 3 giảm chi phí D1): câu GỌI RẤT NHIỀU, mỗi lượt đọc vài chục–vài trăm hàng. Bản mới phải cho KẾT QUẢ Y HỆT bản cũ
// (so trên D1 thật trong bộ nhớ — node:sqlite, lược đồ thật của repo) + EXPLAIN QUERY PLAN chứng minh không còn quét bảng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { caDangBaoVe } from '../server/src/game-v2-bank'
import { chayDdlMotLan, lamMoiTenDoiTuongChung, SQL_TEN_DOI_TUONG, SQL_TEN_DOI_TUONG_CU } from '../server/src/ddl-mot-lan'
import type { Env } from '../server/src/kieu'

type Row = Record<string, unknown>
const keHoach = (sql: { prepare(s: string): { all(...a: unknown[]): unknown[] } }, q: string, ...b: unknown[]) =>
  (sql.prepare('EXPLAIN QUERY PLAN ' + q).all(...b) as { detail: string }[]).map((r) => r.detail)

// ---------------------------------------------------------------- (2)(3) bảng ca
/** Câu caDangBaoVe CŨ (trước 12/11 H2) — chép NGUYÊN VĂN. */
const SQL_CA_BAO_VE_CU = `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca) ELSE 0 END entered,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='da_nop') ELSE 0 END submitted,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='dang_lam' AND (l.het_gio_luc IS NULL OR l.het_gio_luc>?)) ELSE 0 END active
    FROM ca WHERE ca.trang_thai<>'da_xoa' AND (ca.trang_thai='mo' OR COALESCE(NULLIF(ca.bat_dau,''),ca.cap_nhat_luc)>=?) ORDER BY ca.ma_ca`

function datCa(now: number) {
  const d = taoD1That()
  const iso = (ms: number) => new Date(ms).toISOString()
  const TT = ['mo', 'dong', 'da_xoa', 'la', ''], CB = ['khong', 'ngay', 'ca_lop_xong', null, '', 'NGAY', ' ngay'], LOAI = ['thi', 'baitap', null]
  const LUOT = [[], ['da_nop'], ['da_nop', 'dang_lam'], ['dang_lam_het'], ['khoa', 'da_nop']]
  const GIO = [{ bd: iso(now - 3 * 3600e3), het: iso(now - 2 * 3600e3), han: iso(now - 3600e3), cn: '2026-09-01T00:00:00.000Z' },
    { bd: iso(now + 3600e3), het: iso(now + 2 * 3600e3), han: iso(now + 3600e3), cn: '2026-09-01T00:00:00.000Z' },
    { bd: '', het: '', han: '', cn: iso(now - 86400e3) }, { bd: '', het: '', han: '', cn: '2026-09-01T00:00:00.000Z' },
    { bd: '2026-09-20T00:00:00.000Z', het: '', han: '', cn: iso(now) }, { bd: null, het: null, han: null, cn: '2026-09-28T17:00:00.000Z' }]
  const themCa = d.sql.prepare(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,loai,bat_dau,het_han_vao,han_nop,thoi_gian_phut,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)`)
  const themLuot = d.sql.prepare(`INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,het_gio_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)`)
  let n = 0
  for (const tt of TT) for (const cb of CB) for (const loai of LOAI) for (const g of GIO) for (const ls of LUOT) {
    const ma = `c${String(n++).padStart(5, '0')}`
    themCa.run(ma, tt, cb, loai, g.bd, g.het, g.han, 30, n % 7 ? `de/${ma}.json` : null, g.cn)
    ls.forEach((t, i) => themLuot.run(`${ma}|E${i}|1`, ma, `E${i}`, 1, iso(now), t === 'dang_lam_het' ? 'dang_lam' : t, t === 'dang_lam_het' ? iso(now - 60e3) : t === 'dang_lam' ? iso(now + 600e3) : null, iso(now)))
  }
  return { d, n }
}

describe('(2)(3) bảng ca — chỉ mục trạng thái + chỉ mục bộ phận ca còn bảo vệ', () => {
  const now = Date.parse('2026-11-12T12:00:00Z')
  it('caDangBaoVe: DÒNG trả về (đủ cột, đúng thứ tự) y hệt câu cũ + bộ lọc JS, mọi tổ hợp trạng thái × công bố × loại × giờ × lượt', async () => {
    const { d, n } = datCa(now)
    const moi = await caDangBaoVe(d.env, now)
    const goc = d.env.DB
    let thay = 0
    const envCu = { ...d.env, DB: { ...goc, prepare: (s: string) => { thay++; return goc.prepare(SQL_CA_BAO_VE_CU) } } } as unknown as Env
    const cu = await caDangBaoVe(envCu, now)
    expect(thay).toBe(1)
    expect(cu.length).toBeGreaterThan(50)
    expect(cu.length).toBeLessThan(n)
    expect(moi).toEqual(cu)
    // Câu MỚI trả ÍT dòng thô hơn (ca đã đóng đã công bố không còn đọc) mà vẫn đủ mọi ca còn bảo vệ.
    const tho = (q: string) => (d.sql.prepare(q).all(new Date(now).toISOString(), '2026-09-28T17:00:00.000Z') as Row[]).length
    let qMoi = ''
    await caDangBaoVe({ ...d.env, DB: { ...goc, prepare: (s: string) => { qMoi = s; return goc.prepare(s) } } } as unknown as Env, now)
    expect(tho(qMoi)).toBeLessThan(tho(SQL_CA_BAO_VE_CU))
  })
  it('EXPLAIN: caDangBaoVe đi chỉ mục bộ phận idx_ca_bao_ve (không SCAN ca); đếm/kiểm ca mở SEARCH idx_ca_trang_thai', async () => {
    const { d } = datCa(now)
    let qMoi = ''
    const goc = d.env.DB
    await caDangBaoVe({ ...d.env, DB: { ...goc, prepare: (s: string) => { qMoi = s; return goc.prepare(s) } } } as unknown as Env, now)
    const kh = keHoach(d.sql, qMoi, 'x', 'y')
    expect(kh.some((x) => /^SCAN ca USING INDEX idx_ca_bao_ve/.test(x)), kh.join('\n')).toBe(true)
    expect(kh.filter((x) => /^SCAN (ca|l|luot)\b(?! USING INDEX idx_ca_bao_ve)/.test(x)), kh.join('\n')).toEqual([])
    expect(kh.filter((x) => /TEMP B-TREE/.test(x)), kh.join('\n')).toEqual([])
    for (const q of ["SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'", "SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1", "SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'"]) {
      const k = keHoach(d.sql, q)
      expect(k.some((x) => /^SEARCH ca USING COVERING INDEX idx_ca_trang_thai \(trang_thai=\?\)/.test(x)), `${q}\n${k.join('\n')}`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------- (4) tên đối tượng lược đồ — bản sao dùng chung
describe('(4) ddl-mot-lan: danh sách tên đối tượng dùng chung (ddl_ten_chung) thay cho đọc sqlite_master mỗi isolate', () => {
  const LENH = ['CREATE TABLE IF NOT EXISTS h2_thu (id TEXT PRIMARY KEY, x TEXT)', 'CREATE INDEX IF NOT EXISTS idx_h2_thu_x ON h2_thu(x)']
  /** Isolate mới = D1 gốc mới (đối tượng khác) trên cùng dữ liệu; đếm lô ghi + câu đọc. */
  const isolate = (d: ReturnType<typeof taoD1That>) => {
    const goc = d.env.DB as unknown as { prepare(q: string): unknown; batch(x: unknown[]): unknown }
    const dem = { lo: 0, doc: [] as string[] }
    const env = { ...d.env, DB: { prepare: (q: string) => { dem.doc.push(q); return goc.prepare(q) }, batch: (x: unknown[]) => { dem.lo++; return goc.batch(x) } } } as unknown as Env
    return { env, dem }
  }
  it('chưa có dòng chép ⇒ tên đọc từ sqlite_master (MỘT câu, như cũ); có dòng chép ⇒ dùng bản chép; bảng đã có ⇒ không lô ghi', async () => {
    const d = taoD1That()
    const a = isolate(d)
    await chayDdlMotLan(a.env, 'h2_thu', LENH)
    expect(a.dem.lo).toBe(1) // bảng chưa có ⇒ một lô tạo
    expect(a.dem.doc.filter((q) => q === SQL_TEN_DOI_TUONG)).toHaveLength(1)
    // isolate mới, chưa có bản chép ⇒ nhánh sqlite_master thấy bảng ⇒ không lô
    const b = isolate(d)
    await chayDdlMotLan(b.env, 'h2_thu', LENH)
    expect(b.dem.lo).toBe(0)
    expect(b.dem.doc).toEqual([SQL_TEN_DOI_TUONG])
    // cron chép ⇒ bản chép đủ tên; câu đọc trả MỘT dòng (k = 1), nhánh sqlite_master không trả gì
    expect(await lamMoiTenDoiTuongChung(d.env, 1)).toBe(true)
    const r = d.sql.prepare(SQL_TEN_DOI_TUONG).all() as { k: number; t: string }[]
    expect(r).toHaveLength(1)
    expect(r[0]!.k).toBe(1)
    const ten = new Set(JSON.parse(r[0]!.t) as string[])
    const that = new Set((d.sql.prepare(SQL_TEN_DOI_TUONG_CU).all() as { name: string }[]).map((x) => x.name))
    expect(ten).toEqual(that)
    const c = isolate(d)
    await chayDdlMotLan(c.env, 'h2_thu', LENH)
    expect(c.dem.lo).toBe(0)
    // bản chép CŨ thiếu tên mới (bảng tạo sau lần chép) ⇒ chạy lô IF NOT EXISTS như trước 31/10 (vô hại), lần chép sau có tên
    const LENH2 = ['CREATE TABLE IF NOT EXISTS h2_thu_2 (id TEXT PRIMARY KEY)']
    d.sql.exec(LENH2[0]!)
    const e = isolate(d)
    await chayDdlMotLan(e.env, 'h2_thu_2', LENH2)
    expect(e.dem.lo).toBe(1)
    await lamMoiTenDoiTuongChung(d.env, 2)
    const f = isolate(d)
    await chayDdlMotLan(f.env, 'h2_thu_2', LENH2)
    expect(f.dem.lo).toBe(0)
  })
  it('EXPLAIN: nhánh sqlite_master bị chặn bằng LIMIT khi có dòng chép (đo miniflare 663 → 2 hàng); bảng chép chưa có ⇒ lùi câu cũ, cron tự tạo bảng', async () => {
    const d = taoD1That()
    const kh = keHoach(d.sql, SQL_TEN_DOI_TUONG)
    expect(kh.filter((x) => /^SEARCH ddl_ten_chung USING INTEGER PRIMARY KEY/.test(x)).length, kh.join('\n')).toBeGreaterThanOrEqual(2)
    d.sql.exec('DROP TABLE ddl_ten_chung')
    const a = isolate(d)
    await chayDdlMotLan(a.env, 'h2_thu', LENH)
    expect(a.dem.doc.slice(0, 2)).toEqual([SQL_TEN_DOI_TUONG, SQL_TEN_DOI_TUONG_CU])
    const b = isolate(d)
    await chayDdlMotLan(b.env, 'h2_thu', LENH)
    expect(b.dem.lo).toBe(0)
    expect(await lamMoiTenDoiTuongChung(d.env, 3)).toBe(true)
    expect((d.sql.prepare(SQL_TEN_DOI_TUONG).all() as { k: number }[]).map((x) => x.k)).toEqual([1])
  })
})
