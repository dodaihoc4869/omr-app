// @vitest-environment node
// GÓI KHIÊN (thầy lệnh 21/09): RESET mảnh + khiên rèn chưa dùng theo MỐC `khien_moc` (bảng lưu, SQL một lần, SQL lùi, tin cho em) + khiên quà tiến hoá ĐẦU chỉ mở khi ≥ 21 ngày đạt (phương án B)
// + mất 1 khiên khi vắng 7 ngày liên tiếp (cron 00:01). D1 GIẢ BẰNG SQLITE THẬT; tệp SQL thật (server/dat-2109-khien-moc*.sql) được chạy nguyên văn.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { congVaoHoSoGame } from '../server/src/exp-d1'
import { khienConLai, khienQuaTienHoa, khienRenChuaDung } from '../server/src/exp-ho-so-game'
import { loiBaoSapMat, loiDaMat, matKhienVangNgay, soNgayVang } from '../server/src/khien-mat'
import { gvBangTin } from '../server/src/gv-bang-tin'
import { taoD1That, type D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())
const SQL_DAT = readFileSync('server/dat-2109-khien-moc.sql', 'utf8')
const SQL_LUI = readFileSync('server/dat-2109-khien-moc-lui.sql', 'utf8')
const SINCE = '2026-08-01T00:00:00.000Z'
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

type Ho = Record<string, any>
const hoSo = (o: Ho = {}): Ho => ({ pet: 'dat_quy', choice: false, legacy: null, cap: 5, exp: 100, wallet: 3, earned: 500, tower: 2, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z', nickname: 'Biệt danh', shields: { used: 0, activeUntil: 0 }, ...o })
const themHs = (d: D1That, sbd: string, o: Ho = {}) => d.sql.prepare('INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,1,?,?)').run(sbd, JSON.stringify(hoSo(o)), 'x')
const doc = (d: D1That, sbd: string): Ho => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_profile WHERE sbd = ?').get(sbd) as { json: string }).json)
const rev = (d: D1That, sbd: string): number => (d.sql.prepare('SELECT revision FROM game_v2_profile WHERE sbd = ?').get(sbd) as { revision: number }).revision
const manhRow = (d: D1That, sbd: string, ngay: string, loai = 'dat', so = 1) =>
  d.sql.prepare('INSERT OR IGNORE INTO manh_khien_so(khoa,sbd,ngay_vn,loai,so,luc,ghi_chu) VALUES(?,?,?,?,?,?,?)').run(`${sbd}|manh|${loai}|${ngay}`, sbd, ngay, loai, so, `${ngay}T05:00:00.000Z`, 'x')
const datMoc = (d: D1That, v: string | null) => {
  d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'khien_moc'")
  if (v !== null) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('khien_moc',?,'x')").run(v)
}
const cauHinh = (d: D1That, khoa: string, v: string) => d.sql.prepare('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run(khoa, v, 'x')
const T = (s: string): number => Date.parse(`${s}+07:00`)

describe('khiên QUÀ tiến hoá đầu chỉ mở khi ≥ 21 ngày đạt từ mốc (phương án B); máy chủ là nguồn duy nhất của "khiên còn lại"', () => {
  it('biên 20 / 21 ngày đạt, cấp 9 / 10 / 30; các mốc tiến hoá khác không đổi; khiên rèn cộng thêm', () => {
    const q = (cap: number, ngayDat?: number) => khienQuaTienHoa({ cap, expMoi: ngayDat === undefined ? undefined : { daCong: 0, manhDaTinh: 0, ngayDat } })
    expect(q(9, 0)).toBe(0) // chưa tới mốc tiến hoá đầu: 0 như cũ
    expect(q(10)).toBe(0); expect(q(10, 20)).toBe(0); expect(q(10, 21)).toBe(1); expect(q(10, 100)).toBe(1)
    expect(q(30, 20)).toBe(2); expect(q(30, 21)).toBe(3) // 1 + 2 = 3 khi mở; chỉ khiên quà ĐẦU bị khoá
    expect(q(50, 0)).toBe(5); expect(q(100, 0)).toBe(11); expect(q(100, 21)).toBe(12)
    const p = { cap: 10, shields: { used: 0 }, khienRen: { manh: 0, daRen: 1 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 20 } }
    expect(khienConLai(p)).toBe(1) // chỉ khiên rèn
    expect(khienConLai({ ...p, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 21 } })).toBe(2)
  })
})

describe('reset: tệp SQL thật (mốc → chép lưu → đặt lại → tin → marker) và lùi', () => {
  const dung = (): D1That => {
    const d = taoD1That()
    themHs(d, 'A', { cap: 5, khienRen: { manh: 11, daRen: 1 }, expMoi: { daCong: 500, manhDaTinh: 12 } }) // 11 mảnh + 1 khiên rèn chưa dùng
    themHs(d, 'B', { cap: 30, khienRen: { manh: 30, daRen: 5 }, shields: { used: 2, activeUntil: 0 }, expMoi: { daCong: 900, manhDaTinh: 40 } })
    themHs(d, 'C', { cap: 3 }) // chưa có khienRen
    themHs(d, 'D', { cap: 10, khienRen: { manh: 4, daRen: 2 }, shields: { used: 3, activeUntil: 0 }, expMoi: { daCong: 10, manhDaTinh: 4 } }) // khiên rèn ĐÃ dùng hết
    themHs(d, 'E', { cap: 120, khienRen: { manh: 7, daRen: 0 }, expMoi: { daCong: 1, manhDaTinh: 7 } })
    for (const s of ['A', 'B', 'D', 'E']) for (const n of [-2, -1]) manhRow(d, s, themNgay('2026-09-21', n)) // mảnh CŨ trong sổ (trước mốc)
    return d
  }
  it('sau tệp SQL: mảnh 0, khiên rèn chưa dùng 0 (giữ phần đã dùng), quà tiến hoá giữ theo công thức; KHÔNG đụng EXP/cấp/thú/ví/biệt danh; mốc + marker đặt', () => {
    const d = dung()
    const truoc = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((s) => [s, doc(d, s)]))
    d.sql.exec(SQL_DAT)
    expect((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'khien_moc'").get() as { gia_tri: string }).gia_tri).toBe('2026-09-21')
    expect(d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'khien_reset_da_chay'").get()).toBeTruthy()
    for (const s of ['A', 'B', 'D', 'E']) {
      const p = doc(d, s)
      expect(p.khienRen.manh, s).toBe(0)
      expect(khienRenChuaDung(p), s).toBe(0)
      expect(p.expMoi.manhDaTinh, s).toBe(0)
      expect(p.expMoi.ngayDat, s).toBe(0)
      expect(p.expMoi.daCong, s).toBe(truoc[s].expMoi.daCong) // EXP đã cộng giữ nguyên
      const { khienRen: _k, expMoi: _e, ...con } = p
      const { khienRen: _k0, expMoi: _e0, ...con0 } = truoc[s]
      expect(con, s).toEqual(con0) // cấp, exp, thú, ví, biệt danh, shields... y nguyên
      expect(rev(d, s)).toBe(2)
    }
    expect(doc(d, 'A').khienRen).toEqual({ manh: 0, daRen: 0 }); expect(khienConLai(doc(d, 'A'))).toBe(0)
    expect(doc(d, 'B').khienRen).toEqual({ manh: 0, daRen: 0 }); expect(khienConLai(doc(d, 'B'))).toBe(0) // quà 3 → 2 (khoá đầu), đã dùng 2
    expect(doc(d, 'D').khienRen).toEqual({ manh: 0, daRen: 2 }) // khiên rèn đã dùng hết: giữ để "đã dùng" khớp
    expect(khienConLai(doc(d, 'E'))).toBe(11) // cấp 120: quà 12 − 1 khoá
    expect(doc(d, 'C')).toEqual(truoc.C); expect(rev(d, 'C')).toBe(1) // em chưa có khienRen: không đụng
    expect(d.dem('game_v2_profile')).toBe(5)
  })
  it('BẢNG LƯU chép đúng giá trị cũ của mọi em (kể cả em chưa có khiên); tin cho từng em có hồ sơ, một tin duy nhất, nói đúng luật', () => {
    const d = dung()
    d.sql.exec(SQL_DAT)
    const luu = Object.fromEntries((d.sql.prepare('SELECT * FROM khien_truoc_reset_2109').all() as Ho[]).map((x) => [x.sbd, x]))
    expect(Object.keys(luu).sort()).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(luu.A).toMatchObject({ manh: 11, da_ren: 1, da_dung: 0, exp_manh_da_tinh: 12, cap: 5, da_ren_moi: 0, revision: 1 })
    expect(luu.B).toMatchObject({ manh: 30, da_ren: 5, da_dung: 2, exp_manh_da_tinh: 40, cap: 30, da_ren_moi: 0 })
    expect(luu.D).toMatchObject({ manh: 4, da_ren: 2, da_dung: 3, cap: 10, da_ren_moi: 2 })
    expect(luu.C).toMatchObject({ manh: 0, da_ren: 0, da_dung: 0 })
    const tin = d.sql.prepare("SELECT * FROM student_notice WHERE target = 'khien'").all() as Ho[]
    expect(tin).toHaveLength(5)
    expect(new Set(tin.map((x) => x.sbd))).toEqual(new Set(['A', 'B', 'C', 'D', 'E']))
    for (const x of tin) {
      expect(x.title).toBe('A.I Đỗ Đại Học · Khiên của em')
      expect(x.body).toContain('A.I Đỗ Đại Học báo em')
      expect(x.body).toContain('đủ 36 mảnh rèn một khiên') // nội dung SQL đã phát hành ngày 21/09, giữ lịch sử
      expect(x.body).toContain('cùng bắt đầu lại từ 0')
      expect(x.id).toMatch(/^khien\|reset\|[A-E]\|2026-09-21$/)
    }
  })
  it('CHẠY LẠI tệp SQL: không đặt lại lần hai (mảnh em vừa kiếm không mất), không gửi tin đôi, bản lưu gốc không bị ghi đè', () => {
    const d = dung()
    d.sql.exec(SQL_DAT)
    const p = doc(d, 'A')
    p.khienRen.manh = 3; p.expMoi.manhDaTinh = 3
    d.sql.prepare('UPDATE game_v2_profile SET json = ? WHERE sbd = ?').run(JSON.stringify(p), 'A')
    d.sql.exec(SQL_DAT)
    expect(doc(d, 'A').khienRen.manh).toBe(3)
    expect(doc(d, 'A').expMoi.manhDaTinh).toBe(3)
    expect(d.dem('student_notice', "target = 'khien'")).toBe(5)
    expect((d.sql.prepare("SELECT manh FROM khien_truoc_reset_2109 WHERE sbd = 'A'").get() as { manh: number }).manh).toBe(11)
  })
  it('CÔNG THỨC "khiên rèn chưa dùng" của SQL = hàm thuần của mã, trên lưới (cấp × đã rèn × đã dùng)', () => {
    const d = taoD1That()
    const ca: [string, number, number, number][] = []
    for (const cap of [1, 9, 10, 29, 30, 49, 50, 69, 70, 99, 100, 120]) for (const r of [0, 1, 2, 5]) for (const u of [0, 1, 2, 3, 6, 9, 13]) ca.push([`c${cap}r${r}u${u}`, cap, r, u])
    for (const [s, cap, r, u] of ca) themHs(d, s, { cap, khienRen: { manh: 5, daRen: r }, shields: { used: u, activeUntil: 0 }, expMoi: { daCong: 0, manhDaTinh: 5 } })
    d.sql.exec(SQL_DAT)
    for (const [s, cap, r, u] of ca) {
      const goc = { cap, khienRen: { manh: 0, daRen: r }, shields: { used: u }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 0 } }
      const mong = r - khienRenChuaDung(goc)
      const p = doc(d, s)
      expect(p.khienRen.daRen, `${s}`).toBe(mong)
      expect(khienRenChuaDung(p), `${s} sau reset`).toBe(0)
      expect(khienConLai(p), `${s} còn lại`).toBe(Math.max(0, khienQuaTienHoa(goc) - u)) // chỉ còn khiên quà (đã trừ phần khoá) − đã dùng
    }
  })
  it('LÙI: về đúng số cũ (mảnh, khiên rèn, đã dùng, bộ đếm), bỏ mốc + marker + tin; bảng lưu còn để đối soát', () => {
    const d = dung()
    const truoc = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((s) => [s, doc(d, s)]))
    d.sql.exec(SQL_DAT)
    const b = doc(d, 'B'); b.shields.used += 1 // sau reset, một khiên bị trừ vì vắng ⇒ lùi phải trả `đã dùng` về số cũ
    d.sql.prepare('UPDATE game_v2_profile SET json = ? WHERE sbd = ?').run(JSON.stringify(b), 'B')
    d.sql.exec(SQL_LUI)
    for (const s of ['A', 'B', 'D', 'E']) {
      const p = doc(d, s)
      expect(p.khienRen, s).toEqual(truoc[s].khienRen)
      expect(p.shields, s).toEqual(truoc[s].shields)
      expect(p.expMoi.manhDaTinh, s).toBe(truoc[s].expMoi.manhDaTinh)
      expect(p.expMoi, s).not.toHaveProperty('ngayDat')
      expect(p.expMoi.daCong, s).toBe(truoc[s].expMoi.daCong)
    }
    expect(doc(d, 'C')).toEqual(truoc.C)
    expect(d.sql.prepare("SELECT 1 FROM cau_hinh WHERE khoa IN ('khien_moc','khien_reset_da_chay')").get()).toBeUndefined()
    expect(d.dem('student_notice', "target = 'khien'")).toBe(0)
    expect(d.dem('khien_truoc_reset_2109')).toBe(5)
  })
})

describe('mốc: mảnh chỉ tính từ dòng ngay_vn ≥ mốc; đạt 21/09 ⇒ 1/21; ngày thứ 21 đạt ⇒ rèn khiên đầu tiên và mở khiên quà đầu', () => {
  const dungMoc = (o: Ho = {}) => {
    const d = taoD1That()
    themHs(d, 'A', { cap: 10, khienRen: { manh: 11, daRen: 1 }, expMoi: { daCong: 0, manhDaTinh: 12 }, ...o })
    for (const n of [-3, -2, -1]) manhRow(d, 'A', themNgay('2026-09-21', n)) // mảnh cũ
    return d
  }
  it('em có 11 mảnh + 1 khiên rèn chưa dùng trước mốc ⇒ sau reset 0/21, 0 khiên rèn; đạt 21/09 ⇒ 1/21; mảnh CŨ trong sổ không được đếm', async () => {
    const d = dungMoc()
    d.sql.exec(SQL_DAT)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 0, daRen: 0 })
    expect(await congVaoHoSoGame(d.env, 'A', SINCE)).toEqual({ exp: 0, manh: 0, khienMoi: 0 }) // sổ ≥ mốc chưa có gì: KHÔNG cộng lại 3 mảnh cũ
    expect(doc(d, 'A').khienRen).toEqual({ manh: 0, daRen: 0 })
    manhRow(d, 'A', '2026-09-21')
    expect(await congVaoHoSoGame(d.env, 'A', SINCE)).toEqual({ exp: 0, manh: 1, khienMoi: 0 })
    expect(doc(d, 'A').khienRen).toEqual({ manh: 1, daRen: 0 })
    expect(doc(d, 'A').expMoi).toMatchObject({ manhDaTinh: 1, ngayDat: 1 })
  })
  it('20 ngày đạt ⇒ 20/21, chưa khiên; ngày thứ 21 ⇒ rèn khiên đầu tiên (mảnh về 0) VÀ khiên quà đầu (cấp 10) mở', async () => {
    const d = dungMoc()
    d.sql.exec(SQL_DAT)
    for (let n = 0; n < 20; n++) manhRow(d, 'A', themNgay('2026-09-21', n))
    await congVaoHoSoGame(d.env, 'A', SINCE)
    let p = doc(d, 'A')
    expect(p.khienRen).toEqual({ manh: 20, daRen: 0 })
    expect(khienConLai(p)).toBe(0) // cấp 10 nhưng quà đầu còn khoá
    manhRow(d, 'A', themNgay('2026-09-21', 20))
    await congVaoHoSoGame(d.env, 'A', SINCE)
    p = doc(d, 'A')
    expect(p.khienRen).toEqual({ manh: 0, daRen: 1 })
    expect(p.expMoi.ngayDat).toBe(21)
    expect(khienConLai(p)).toBe(2) // 1 khiên rèn + 1 khiên quà đầu vừa mở
  })
  it('mảnh thưởng chuỗi 7 / dạng rời yếu (so = 0) không làm lệch; chỉ dòng loai = dat được đếm là NGÀY ĐẠT', async () => {
    const d = dungMoc()
    d.sql.exec(SQL_DAT)
    manhRow(d, 'A', '2026-09-21'); manhRow(d, 'A', '2026-09-22'); manhRow(d, 'A', '2026-09-22', 'chuoi7', 0); manhRow(d, 'A', '2026-09-22', 'dang', 0)
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').expMoi).toMatchObject({ manhDaTinh: 2, ngayDat: 2 })
  })
  it('dòng `dang` (+2) và `chuoi7` (+3) sinh TRƯỚC lệnh thầy nhưng nằm trong/sau ngày mốc KHÔNG được cộng lại sau reset (chỉ `dat` tính); vắng mốc thì đếm hết như cũ', async () => {
    const d = dungMoc()
    d.sql.exec(SQL_DAT)
    manhRow(d, 'A', '2026-09-21') // đạt hôm nay: +1
    manhRow(d, 'A', '2026-09-21', 'dang', 2); d.sql.prepare("INSERT OR IGNORE INTO manh_khien_so(khoa,sbd,ngay_vn,loai,so,luc,ghi_chu) VALUES('A|manh|dang|X|2','A','2026-09-21','dang',2,'2026-09-21T06:00:00.000Z','x')").run()
    manhRow(d, 'A', '2026-09-21', 'chuoi7', 3)
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 1, daRen: 0 }) // không phải 1 + 2 + 2 + 3
    datMoc(d, null)
    const e = taoD1That()
    themHs(e, 'A', { cap: 5, expMoi: { daCong: 0, manhDaTinh: 0 } })
    manhRow(e, 'A', '2026-09-21'); manhRow(e, 'A', '2026-09-21', 'dang', 2); manhRow(e, 'A', '2026-09-21', 'chuoi7', 3)
    await congVaoHoSoGame(e.env, 'A', SINCE)
    expect(doc(e, 'A').khienRen).toEqual({ manh: 6, daRen: 0 }) // vắng mốc: y hệt cũ (1 + 2 + 3)
  })
  it('hồ sơ cũ (đã bắt kịp sổ nhưng chưa có `ngayDat`): lần cộng kế ghi số ngày đạt dù không có mảnh mới', async () => {
    const d = taoD1That()
    themHs(d, 'A', { cap: 5, khienRen: { manh: 3, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 3 } })
    for (const n of [-3, -2, -1]) manhRow(d, 'A', themNgay('2026-09-21', n))
    expect(await congVaoHoSoGame(d.env, 'A', SINCE)).toEqual({ exp: 0, manh: 0, khienMoi: 0 })
    expect(doc(d, 'A').expMoi).toEqual({ daCong: 0, manhDaTinh: 3, ngayDat: 3 })
  })
  it('KHÔNG có mốc ⇒ y hệt cũ (tính mọi dòng); giá trị mốc sai dạng cũng bị bỏ qua', async () => {
    for (const v of [null, 'hôm nay', '21/09/2026', '2026-9-21']) {
      const d = taoD1That()
      themHs(d, 'A', { cap: 5, expMoi: { daCong: 0, manhDaTinh: 0 } })
      for (const n of [-3, -2, -1, 0]) manhRow(d, 'A', themNgay('2026-09-21', n))
      datMoc(d, v)
      await congVaoHoSoGame(d.env, 'A', SINCE)
      expect(doc(d, 'A').khienRen, String(v)).toEqual({ manh: 4, daRen: 0 })
    }
    const d = taoD1That()
    themHs(d, 'A', { cap: 5, expMoi: { daCong: 0, manhDaTinh: 0 } })
    for (const n of [-3, -2, -1, 0]) manhRow(d, 'A', themNgay('2026-09-21', n))
    datMoc(d, '2026-09-21')
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 1, daRen: 0 }) // đối chứng: có mốc chỉ tính 21/09
  })
  it('lùi rồi bỏ mốc: mảnh kiếm SAU mốc được cộng bù, không mất (sổ 3 dòng cũ đã tính + 2 dòng mới)', async () => {
    const d = dungMoc({ khienRen: { manh: 3, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 3 } })
    d.sql.exec(SQL_DAT)
    manhRow(d, 'A', '2026-09-21'); manhRow(d, 'A', '2026-09-22')
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').khienRen.manh).toBe(2)
    d.sql.exec(SQL_LUI)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 3, daRen: 0 })
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 5, daRen: 0 }) // 5 dòng trong sổ − 3 đã tính = +2
  })
  it('lùi khi sổ chưa vượt mức đã tính: hồ sơ về đúng số cũ và giữ nguyên', async () => {
    const d = dungMoc()
    d.sql.exec(SQL_DAT)
    manhRow(d, 'A', '2026-09-21')
    await congVaoHoSoGame(d.env, 'A', SINCE)
    d.sql.exec(SQL_LUI)
    await congVaoHoSoGame(d.env, 'A', SINCE)
    expect(doc(d, 'A').khienRen).toEqual({ manh: 11, daRen: 1 }) // 4 dòng < 12 đã tính ⇒ không cộng thêm
  })
})

describe('mất 1 khiên khi vắng 7 ngày liên tiếp không đạt nhiệm vụ ngày (cron 00:01)', () => {
  const NGAY_NGHI = '2026-09-22,2026-09-23'
  const dungMat = (): D1That => {
    const d = taoD1That()
    datMoc(d, '2026-09-21')
    themHs(d, 'R', { cap: 5, khienRen: { manh: 10, daRen: 2 } }) // 2 khiên rèn chưa dùng
    themHs(d, 'Q', { cap: 30, khienRen: { manh: 0, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 40 } }) // chỉ khiên quà (3)
    themHs(d, 'N', { cap: 5, khienRen: { manh: 9, daRen: 0 } }) // chưa có khiên
    themHs(d, 'D', { cap: 5, khienRen: { manh: 2, daRen: 2 } }) // đạt giữa chừng
    themHs(d, 'S', { cap: 30, khienRen: { manh: 1, daRen: 1 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 40 } }) // có cả quà và rèn
    manhRow(d, 'D', '2026-09-24')
    return d
  }
  const lucCron = (ngay: string): number => T(`${ngay}T00:01:00`)
  const daBao = (d: D1That, sbd: string) => d.sql.prepare("SELECT * FROM student_notice WHERE sbd = ? AND target = 'khien'").all(sbd) as Ho[]

  it('hàm thuần soNgayVang: ngày đạt cắt chuỗi, ngày nghỉ bỏ qua (không cộng, không cắt), cửa sổ bắt đầu từ mốc / ngày trừ', () => {
    const dat = new Set(['2026-09-24']); const nghi = new Set(['2026-09-22', '2026-09-23'])
    expect(soNgayVang('2026-09-27', '2026-09-21', new Set(), new Set())).toBe(7)
    expect(soNgayVang('2026-09-27', '2026-09-21', dat, new Set())).toBe(3) // 27, 26, 25 (24 đạt cắt)
    expect(soNgayVang('2026-09-27', '2026-09-21', new Set(), nghi)).toBe(5) // 21, 24, 25, 26, 27
    expect(soNgayVang('2026-09-27', '2026-09-28', new Set(), new Set())).toBe(0) // cửa sổ rỗng
    expect(soNgayVang('2026-09-27', '2026-09-27', new Set(), new Set())).toBe(1)
    expect(soNgayVang('2026-09-27', '2026-09-21', new Set(['2026-09-27']), new Set())).toBe(0)
    expect(soNgayVang('2026-09-27', '2026-09-21', new Set(), new Set(['2026-09-27', '2026-09-26']))).toBe(5)
  })

  it('7 ngày vắng (21→27/09): khiên rèn TRƯỚC, quà sau; em chưa có khiên không bị gì; đạt giữa chừng / ngày nghỉ không mất; mảnh KHÔNG bị trừ', async () => {
    const d = dungMat()
    const r = await matKhienVangNgay(d.env, lucCron('2026-09-28'))
    expect(r).toMatchObject({ chay: true, soTru: 3 }) // R, Q, S (D đạt 24/09 ⇒ chỉ 3 ngày vắng)
    expect(doc(d, 'R').khienRen).toEqual({ manh: 10, daRen: 1 }); expect(khienConLai(doc(d, 'R'))).toBe(1) // trừ rèn, mảnh 10 giữ
    expect(doc(d, 'Q').shields.used).toBe(1); expect(khienConLai(doc(d, 'Q'))).toBe(2) // chỉ có quà ⇒ trừ quà
    expect(doc(d, 'S').khienRen).toEqual({ manh: 1, daRen: 0 }); expect(doc(d, 'S').shields.used).toBe(0) // có cả hai ⇒ rèn trước
    expect(doc(d, 'N').khienRen).toEqual({ manh: 9, daRen: 0 }); expect(rev(d, 'N')).toBe(1)
    expect(doc(d, 'D').khienRen.daRen).toBe(2)
    const so = d.sql.prepare('SELECT sbd, ngay_vn, so_ngay_vang, tu, khoa FROM khien_mat_so ORDER BY sbd').all() as Ho[]
    expect(so).toEqual([
      { sbd: 'Q', ngay_vn: '2026-09-28', so_ngay_vang: 7, tu: 'qua', khoa: 'khien|mat|Q|2026-09-28' },
      { sbd: 'R', ngay_vn: '2026-09-28', so_ngay_vang: 7, tu: 'ren', khoa: 'khien|mat|R|2026-09-28' },
      { sbd: 'S', ngay_vn: '2026-09-28', so_ngay_vang: 7, tu: 'ren', khoa: 'khien|mat|S|2026-09-28' },
    ])
    expect(daBao(d, 'R').map((x) => [x.id, x.body])).toEqual([['khien|mat|R|2026-09-28', loiDaMat()]])
    expect(daBao(d, 'N')).toEqual([]) // em chưa có khiên: không tin nào
    expect(daBao(d, 'D')).toEqual([])
  })

  it('ngày nghỉ hợp lệ KHÔNG tính là vắng: 21→27/09 có 22, 23 nghỉ ⇒ 5 ngày vắng (không trừ, chỉ báo); nghỉ không cắt chuỗi: tới 30/09 đủ 7 ngày vắng ⇒ trừ', async () => {
    const d = dungMat()
    cauHinh(d, 'ngay_nghi', NGAY_NGHI)
    expect(await matKhienVangNgay(d.env, lucCron('2026-09-28'))).toMatchObject({ chay: true, soTru: 0, soBao: 3 })
    expect(d.dem('khien_mat_so')).toBe(0)
    const r = await matKhienVangNgay(d.env, lucCron('2026-09-30')) // 21, 24, 25, 26, 27, 28, 29 = 7 ngày vắng (22, 23 nghỉ)
    expect(r).toMatchObject({ soTru: 3 })
    expect(doc(d, 'R').khienRen.daRen).toBe(1)
  })

  it('CHẠY LẠI cùng ngày không trừ đôi; sau khi trừ bộ đếm về 0: 6 ngày sau chưa trừ, đủ 7 ngày nữa mới trừ tiếp; hết khiên thì dừng, không âm', async () => {
    const d = dungMat()
    d.sql.exec("DELETE FROM game_v2_profile WHERE sbd = 'D'") // D đạt ngày 24/09 ⇒ cửa sổ riêng (kiểm ở test khác)
    const nam = (ngay: string) => matKhienVangNgay(d.env, lucCron(ngay))
    await nam('2026-09-28')
    expect(await nam('2026-09-28')).toMatchObject({ chay: true, soTru: 0 })
    expect(doc(d, 'R').khienRen.daRen).toBe(1)
    expect(d.dem('khien_mat_so', "sbd = 'R'")).toBe(1)
    for (const ngay of ['2026-09-29', '2026-10-01', '2026-10-04']) expect(await nam(ngay), ngay).toMatchObject({ soTru: 0 }) // cửa sổ mới 28/09 →: tới 04/10 mới 6 ngày (28..03)
    expect(doc(d, 'R').khienRen.daRen).toBe(1)
    expect(await nam('2026-10-05')).toMatchObject({ soTru: 3 }) // 28/09..04/10 = 7 ngày vắng: R (rèn 1→0), Q (quà: used 1→2), S (đã hết rèn, trừ quà: used 0→1)
    expect(doc(d, 'R').khienRen.daRen).toBe(0)
    expect(doc(d, 'Q').shields.used).toBe(2); expect(doc(d, 'S').shields.used).toBe(1); expect(doc(d, 'S').khienRen.daRen).toBe(0)
    for (const ngay of ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']) await nam(ngay)
    for (const s of ['R', 'Q', 'S', 'N']) {
      const p = doc(d, s)
      expect(khienConLai(p), s).toBeGreaterThanOrEqual(0)
      expect(p.khienRen.daRen, s).toBeGreaterThanOrEqual(0)
      expect(p.shields.used, s).toBeLessThanOrEqual(khienQuaTienHoa(p) + 100)
    }
    expect(khienConLai(doc(d, 'R'))).toBe(0) // R hết khiên: không bị trừ thêm dù vắng tiếp
    expect(doc(d, 'R').shields.used).toBe(0) // không "trừ quà" khi em không có quà (không âm)
  })

  it('ngày vắng thứ 5: MỘT tin (chỉ em đang có khiên), đúng câu chữ, không lặp; chưa tới 5 hoặc quá 5 không tin', async () => {
    const d = dungMat()
    expect((await matKhienVangNgay(d.env, lucCron('2026-09-25'))).soBao).toBe(0) // 4 ngày vắng
    const r = await matKhienVangNgay(d.env, lucCron('2026-09-26')) // 21..25 = 5 ngày
    expect(r).toMatchObject({ chay: true, soTru: 0 })
    expect(r.soBao).toBe(3) // R, Q, S có khiên và 5 ngày vắng (D đạt 24 ⇒ 1 ngày); N không có khiên
    expect((await matKhienVangNgay(d.env, lucCron('2026-09-27'))).soBao).toBe(0) // 6 ngày vắng: quá mốc báo
    expect(daBao(d, 'R').map((x) => x.body)).toEqual(['Em đã nghỉ 5 ngày. Còn 2 ngày nữa chưa quay lại thì em mất 1 khiên — làm một việc nhỏ hôm nay là giữ được.'])
    expect(loiBaoSapMat()).toBe(daBao(d, 'R')[0]!.body)
    expect(daBao(d, 'N')).toEqual([])
    await matKhienVangNgay(d.env, lucCron('2026-09-26'))
    expect(daBao(d, 'R')).toHaveLength(1) // chạy lại không gửi đôi
    expect(daBao(d, 'D')).toEqual([])
    const muon = dungMat() // lần chạy ĐẦU TIÊN đã là ngày vắng thứ 6 (lỡ ngày thứ 5): không báo muộn
    expect(await matKhienVangNgay(muon.env, lucCron('2026-09-27'))).toMatchObject({ soTru: 0, soBao: 0 })
    expect(daBao(muon, 'R')).toEqual([])
  })

  it('chưa đặt mốc ⇒ không chạy; hôm qua còn trước mốc ⇒ không chạy; không có hồ sơ nào ⇒ chạy rỗng', async () => {
    const d = dungMat()
    datMoc(d, null)
    expect(await matKhienVangNgay(d.env, lucCron('2026-09-28'))).toEqual({ chay: false, lyDo: 'chua_dat_moc', soTru: 0, soBao: 0 })
    datMoc(d, '2026-09-21')
    expect(await matKhienVangNgay(d.env, lucCron('2026-09-21'))).toEqual({ chay: false, lyDo: 'chua_toi_ngay_moc', soTru: 0, soBao: 0 })
    expect(await matKhienVangNgay(d.env, lucCron('2026-09-22'))).toMatchObject({ chay: true, soTru: 0, soBao: 0 }) // 1 ngày vắng
    expect(d.dem('khien_mat_so')).toBe(0)
    const trong = taoD1That(); datMoc(trong, '2026-09-21')
    expect(await matKhienVangNgay(trong.env, lucCron('2026-10-30'))).toMatchObject({ chay: true, soTru: 0, soBao: 0 })
  })

  it('bảng tin của thầy: mayDaLam "A.I Đỗ Đại Học đã trừ 1 khiên của N em…" theo sổ hôm nay; vắng khi không ai bị trừ; vẫn ≤ 12 truy vấn', async () => {
    const d = dungMat()
    const NOW = lucCron('2026-09-28')
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
    const truoc = (await gvBangTin(d.env, {}, NOW)).mayDaLam as { loai: string }[]
    expect(truoc.find((x) => x.loai === 'khien_mat')).toBeUndefined()
    await matKhienVangNgay(d.env, NOW)
    const bt = await gvBangTin(d.env, {}, NOW)
    expect((bt.mayDaLam as { loai: string; so: number; chu: string }[]).find((x) => x.loai === 'khien_mat')).toEqual({ loai: 'khien_mat', so: 3, chu: 'A.I Đỗ Đại Học đã trừ 1 khiên của 3 em vắng nhiệm vụ ngày 7 ngày liên tiếp' })
    expect(bt.soTruyVan as number).toBeLessThanOrEqual(12)
  })
})
