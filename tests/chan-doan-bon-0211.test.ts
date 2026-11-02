// @vitest-environment node
// CHẨN ĐOÁN 4 BẢNG TRÊN DỮ LIỆU THẬT (scripts/chan-doan-bon-0211.ts, 02/11): khoá (1) bọc CHỈ ĐỌC — lệnh ghi bị chặn, CREATE … IF NOT EXISTS bỏ qua; (2) nhúng
// tham số đúng (bỏ qua chuỗi); (3) chạy trọn đường đọc thật (`docDauVaoBon`) + lõi trên lược đồ thật (SQLite trong máy) ⇒ mỗi câu ca thi đúng MỘT lý do,
// tổng lý do = số câu thi, không SBD / tên trong kết quả.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { chayChanDoan, demChan, demSql, laCauDoc, laTaoNeuChuaCo, nhungThamSo, taoD1ChiDoc } from '../scripts/chan-doan-bon-0211'
import type { Env } from '../server/src/kieu'

describe('bọc chỉ đọc', () => {
  it('chỉ SELECT / WITH đi qua; ghi bị chặn; CREATE IF NOT EXISTS bỏ qua', () => {
    expect(laCauDoc("SELECT replace(x, 'a', 'b') FROM t WHERE y = 'DELETE'")).toBe(true)
    expect(laCauDoc('WITH a AS (SELECT 1) SELECT * FROM a')).toBe(true)
    expect(laCauDoc('INSERT INTO t VALUES (1)')).toBe(false)
    expect(laCauDoc('SELECT 1; DELETE FROM t')).toBe(false)
    expect(laCauDoc('WITH a AS (SELECT 1) UPDATE t SET x = 1')).toBe(false)
    expect(laCauDoc('REPLACE INTO t VALUES (1)')).toBe(false)
    expect(laTaoNeuChuaCo('CREATE TABLE IF NOT EXISTS a (x)')).toBe(true)
    expect(laTaoNeuChuaCo('CREATE TABLE a (x)')).toBe(false)
  })
  it('nhúng tham số ?N và ? (bỏ qua chuỗi có dấu ?)', () => {
    expect(nhungThamSo("SELECT ?1, '?2', ?2, ? FROM t", [4, "o'k", null])).toBe("SELECT 4, '?2', 'o''k', 4 FROM t")
  })
})

describe('chạy chẩn đoán trên lược đồ thật (SQLite trong máy)', () => {
  it('mỗi câu ca thi đúng một lý do; nhãn đủ 3 cửa sổ; lệnh ghi = 0', async () => {
    const d = taoD1That()
    d.sql.exec(`CREATE TABLE IF NOT EXISTS bon_chi_so_em (sbd TEXT PRIMARY KEY, ngay TEXT NOT NULL, tinh_luc TEXT NOT NULL, ht REAL, dp REAL, ch REAL, lu REAL,
      so_luot INTEGER NOT NULL DEFAULT 0, so_lieu_json TEXT, bc_json TEXT, ket_json TEXT, the_json TEXT, ngay_json TEXT)`)
    const them = d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, chuyen_de, muc_do) VALUES (?,?,?,?,?,1,?,30,?,?,?,?)`)
    const meta = d.sql.prepare(`INSERT INTO cau_meta (ma_de, qid, thu_tu, chuyen_de) VALUES ('DE1', ?, 1, ?)`)
    for (let i = 0; i < 20; i++) {
      const ngay = `2026-10-${String(10 + Math.floor(i / 2)).padStart(2, '0')}`
      meta.run(`E${i}`, 'Este - Lipit')
      them.run(`l${i}`, 'S1', `E${i}`, 'luyen', 'chang', i % 4 ? 1 : 0, `${ngay}T03:00:0${i % 10}.000Z`, ngay, null, 'hieu')
    }
    d.sql.exec(`INSERT INTO ca (ma_ca, trang_thai, loai, cap_nhat_luc) VALUES ('CA1', 'dong', 'thi', '2026-10-25T12:00:00Z')`)
    for (let i = 0; i < 8; i++) {
      if (i < 4) meta.run(`X${i}`, 'Este - Lipit')
      them.run(`t${i}`, 'S1', `X${i}`, 'thi', 'CA1', i % 2, '2026-10-25T12:00:00.000Z', '2026-10-25', i >= 4 && i < 6 ? 'Amin' : null, 'hieu')
    }
    demChan.chan = 0
    const env = { ...d.env, DB: taoD1ChiDoc(async (sql, b) => d.sql.prepare(sql).all(...(b as never[])) as Record<string, unknown>[]) } as unknown as Env
    const now = Date.parse('2026-11-02T04:00:00Z')
    const kq = await chayChanDoan(env, now, { em: [{ sbd: 'S1', hoTen: 'Em Thử', lop: '12A', khoi: '12', goi7Tu: null }] })
    expect(Object.values(kq.ghep).reduce((a, b) => a + b, 0)).toBe(8)
    expect(kq.ghep.ghep).toBe(4)
    expect(kq.ghep.thieuDv).toBe(2)
    expect(kq.ghep.dvChuaLuyen).toBe(2)
    expect(kq.nhan).toHaveLength(3)
    expect(kq.retest).toHaveLength(2)
    expect(kq.chan.chan).toBe(0)
    expect(JSON.stringify(kq)).not.toMatch(/S1|Em Thử/)
    const sql = await demSql(env, now)
    expect((sql.cauThi as Record<string, number>).tong).toBe(8)
    expect((sql.phuDonVi as Record<string, number>).cau_meta_co_cd).toBe(4)
    expect(demChan.chan).toBe(0)
  }, 60_000)
})
