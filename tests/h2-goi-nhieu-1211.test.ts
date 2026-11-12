// @vitest-environment node
// NHÓM H2 (12/11, đợt 3 giảm chi phí D1): câu GỌI RẤT NHIỀU, mỗi lượt đọc vài chục–vài trăm hàng. Bản mới phải cho KẾT QUẢ Y HỆT bản cũ
// (so trên D1 thật trong bộ nhớ — node:sqlite, lược đồ thật của repo) + EXPLAIN QUERY PLAN chứng minh không còn quét bảng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { caDangBaoVe } from '../server/src/game-v2-bank'
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
