// @vitest-environment node
// THÊM PHÚT cho ca đang chạy — PHÍA MÁY CHỦ (server/src/them-phut.ts; hợp đồng docs/hop-dong-them-phut-2109.md mục 1): `/ca/them-phut`, `examStatus` trả `hetGioLuc`, `/ca/chi-tiet` trả `themPhutTong`.
// (Tệp `tests/them-phut-1909.test.ts` là của Code 2, phía màn thi học sinh.)
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { moKhoaEm } from '../server/src/goi-cu'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-21T03:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const luot = (d: D1That, sbd: string, tt: string, het: string | null, o: { nop?: string | null; dapAn?: string; diem?: number } = {}) =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,het_gio_luc,nop_luc,trang_thai,dap_an_json,diem_i,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,?,?,?,?)")
    .run(`C1|${sbd}|1`, 'C1', sbd, iso(T0), het, o.nop ?? null, tt, o.dapAn ?? '{"phanI":{"q1":"A"}}', o.diem ?? 0, 'x')
const han = (d: D1That, sbd: string) => (d.sql.prepare("SELECT het_gio_luc AS h FROM luot WHERE sbd = ?").get(sbd) as { h: string | null }).h
const caRow = (d: D1That) => d.sql.prepare("SELECT thoi_gian_phut AS p, them_phut_tong AS t, het_han_vao AS v, trang_thai AS s FROM ca WHERE ma_ca='C1'").get() as { p: number; t: number; v: string; s: string }
const goi = (d: D1That, b: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, '/ca/them-phut', b, thay)
const HET = iso(T0 + 45 * 60_000)

/** Ca thi C1 đang mở 45 phút; S1, S2 ĐANG LÀM; S3 đã nộp; S4 bị khoá (chờ thầy mở khoá); S5 đang làm nhưng chưa có hạn; S6 chờ duyệt lại; S7 đang làm nhưng hạn hỏng (không đọc được). */
function dung(caO: string[] = []): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,het_han_vao,cap_nhat_luc) VALUES('C1','Ca 1','mo','thi',45,?,'x')").run(iso(T0 + 3_600_000))
  for (const q of caO) d.sql.exec(q)
  luot(d, 'S1', 'dang_lam', HET); luot(d, 'S2', 'dang_lam', iso(T0 + 50 * 60_000))
  luot(d, 'S3', 'da_nop', HET, { nop: iso(T0 + 20 * 60_000), diem: 7 }); luot(d, 'S4', 'khoa', HET, { nop: iso(T0 + 10 * 60_000) })
  luot(d, 'S5', 'dang_lam', ''); luot(d, 'S6', 'duoc_duyet_lai', HET); luot(d, 'S7', 'dang_lam', 'khong-phai-ngay')
  return d
}

describe('/ca/them-phut: chỉ cộng, đúng lượt, đúng ca', () => {
  it('cộng phút cho ca, cho lượt ĐANG LÀM và lượt KHOÁ có hạn; lượt đã nộp/chưa hạn/hạn hỏng/chờ duyệt lại, hạn vào, điểm, đáp án y nguyên', async () => {
    const d = dung()
    const truoc = d.sql.prepare('SELECT * FROM luot ORDER BY sbd').all() as Record<string, unknown>[]
    const r = await goi(d, { maCa: 'C1', phut: 5 })
    expect(r).toMatchObject({ ok: true, phut: 5, soLuotCong: 2, soLuotKhoaCong: 1, thoiGianPhut: 50, themPhutTong: 5 }) // soLuotCong chỉ đếm lượt đang làm
    expect(han(d, 'S1')).toBe(iso(T0 + 50 * 60_000))
    expect(han(d, 'S2')).toBe(iso(T0 + 55 * 60_000))
    const sau = d.sql.prepare('SELECT * FROM luot ORDER BY sbd').all() as Record<string, unknown>[]
    for (let i = 0; i < truoc.length; i++) {
      const { het_gio_luc: h0, cap_nhat_luc: c0, ...con0 } = truoc[i]!
      const { het_gio_luc: h1, cap_nhat_luc: c1, ...con1 } = sau[i]!
      expect(con1).toEqual(con0) // đáp án, điểm, trạng thái, nộp lúc... không đổi
      if (['S1', 'S2', 'S4'].includes(String(truoc[i]!.sbd))) expect(Date.parse(String(h1))).toBe(Date.parse(String(h0)) + 5 * 60_000)
      else expect(h1).toBe(h0)
    }
    expect(caRow(d)).toEqual({ p: 50, t: 5, v: iso(T0 + 3_600_000), s: 'mo' })
    expect(han(d, 'S4')).toBe(iso(T0 + 50 * 60_000)); expect(han(d, 'S3')).toBe(HET); expect(han(d, 'S5')).toBe(''); expect(han(d, 'S6')).toBe(HET); expect(han(d, 'S7')).toBe('khong-phai-ngay') // hạn hỏng: giữ nguyên, không xoá, không tính vào soLuotCong
  })
  it('em bị khoá được thầy MỞ KHOÁ sau khi thêm phút nhận đúng hạn mới (không thiệt giờ)', async () => {
    const d = dung()
    await goi(d, { maCa: 'C1', phut: 5 })
    await goi(d, { maCa: 'C1', phut: 3 })
    expect(await moKhoaEm(d.env, { maCa: 'C1', sbd: 'S4' })).toMatchObject({ ok: true, soDong: 1 })
    expect(d.sql.prepare("SELECT trang_thai, het_gio_luc FROM luot WHERE sbd = 'S4'").get()).toEqual({ trang_thai: 'dang_lam', het_gio_luc: iso(T0 + 53 * 60_000) })
  })
  it('hạn mới là ISO chuẩn đúng định dạng của JS (…T…​.sssZ), cộng đúng tới từng mili giây', async () => {
    const d = dung()
    d.sql.prepare("UPDATE luot SET het_gio_luc = '2026-09-21T03:44:59.123Z' WHERE sbd = 'S1'").run()
    await goi(d, { maCa: 'C1', phut: 15 })
    expect(han(d, 'S1')).toBe('2026-09-21T03:59:59.123Z')
    expect(new Date(han(d, 'S1')!).toISOString()).toBe(han(d, 'S1'))
  })
  it('CHỈ CỘNG, không bao giờ trừ: hạn lượt và thời gian ca tăng đúng bằng số phút thêm, qua nhiều lần gọi', async () => {
    const d = dung()
    let truocCa = caRow(d).p
    let truocHan = Date.parse(han(d, 'S1')!)
    for (const phut of [1, 5, 3, 15, 5]) {
      const r = await goi(d, { maCa: 'C1', phut })
      expect(r.ok).toBe(true)
      expect(caRow(d).p).toBe(truocCa + phut)
      expect(Date.parse(han(d, 'S1')!)).toBe(truocHan + phut * 60_000)
      truocCa = caRow(d).p; truocHan = Date.parse(han(d, 'S1')!)
    }
    expect(caRow(d).t).toBe(29)
  })
  it('trần 30 phút mỗi ca: 25 + 10 bị từ chối và KHÔNG đổi gì; 25 + 5 = 30 được; sau đó mọi lần thêm đều bị từ chối', async () => {
    const d = dung()
    expect((await goi(d, { maCa: 'C1', phut: 15 })).ok).toBe(true)
    expect((await goi(d, { maCa: 'C1', phut: 10 })).ok).toBe(true) // 25
    const truoc = [caRow(d), han(d, 'S1')]
    const tu = await goi(d, { maCa: 'C1', phut: 10 })
    expect(tu.ok).toBe(false)
    expect(String(tu.error)).toMatch(/đã thêm 25 phút.*trần 30/)
    expect([caRow(d), han(d, 'S1')]).toEqual(truoc)
    expect(await goi(d, { maCa: 'C1', phut: 5 })).toMatchObject({ ok: true, themPhutTong: 30, thoiGianPhut: 75 })
    expect((await goi(d, { maCa: 'C1', phut: 1 })).ok).toBe(false)
    expect(caRow(d).t).toBe(30)
  })
  it('từ chối có lý do bằng lời: thiếu mã, phút sai (0, 16, 2.5, chữ, null, âm), ca không có, ca không mở, bài tập; và đòi mã bí mật', async () => {
    const d = dung(["INSERT INTO ca(ma_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('DONG','dong','thi',45,'x'), ('XOA','da_xoa','thi',45,'x'), ('BT','mo','baitap',45,'x')"])
    expect(await goi(d, { phut: 5 })).toMatchObject({ ok: false, error: 'Thiếu mã ca' })
    for (const p of [0, 16, 2.5, '5', null, -1, undefined, true]) expect(await goi(d, { maCa: 'C1', phut: p }), String(p)).toMatchObject({ ok: false, error: expect.stringMatching(/số nguyên từ 1 đến 15/) })
    expect(await goi(d, { maCa: 'KHONG', phut: 5 })).toMatchObject({ ok: false, error: 'Không tìm thấy ca.' })
    for (const ma of ['DONG', 'XOA']) expect(await goi(d, { maCa: ma, phut: 5 })).toMatchObject({ ok: false, error: expect.stringMatching(/không đang mở/) })
    expect(await goi(d, { maCa: 'BT', phut: 5 })).toMatchObject({ ok: false, error: expect.stringMatching(/Bài tập/) })
    expect(caRow(d)).toEqual({ p: 45, t: 0, v: iso(T0 + 3_600_000), s: 'mo' })
    expect((await goi(d, { maCa: 'C1', phut: 5 }, false)).ok).not.toBe(true)
    expect(caRow(d).t).toBe(0)
  })
  it('CHỒNG NHAU (đọc cũ trong lúc lệnh khác đã thêm): batch không đổi gì, báo thử lại, KHÔNG lệch giữa giờ ca và giờ lượt', async () => {
    const d = dung()
    const batch = d.env.DB.batch.bind(d.env.DB)
    d.env.DB.batch = (async (c: never) => {
      // Lệnh khác chen vào giữa lúc đọc và ghi: cộng 5 phút cho ca và lượt như thể đã xong.
      d.sql.exec("UPDATE ca SET thoi_gian_phut = thoi_gian_phut + 5, them_phut_tong = them_phut_tong + 5 WHERE ma_ca = 'C1'")
      d.sql.exec("UPDATE luot SET het_gio_luc = strftime('%Y-%m-%dT%H:%M:%fZ', het_gio_luc, '+5 minutes') WHERE trang_thai = 'dang_lam' AND het_gio_luc <> ''")
      return batch(c)
    }) as never
    const r = await goi(d, { maCa: 'C1', phut: 5 })
    expect(r).toMatchObject({ ok: false, thuLai: true })
    expect(caRow(d)).toMatchObject({ p: 50, t: 5 }) // chỉ lệnh chen vào có tác dụng
    expect(han(d, 'S1')).toBe(iso(T0 + 50 * 60_000)) // đúng +5, không +10
    expect(han(d, 'S2')).toBe(iso(T0 + 55 * 60_000))
  })
  it('chưa chạy migration (thiếu cột them_phut_tong): lệnh báo lỗi bằng lời và không đổi gì; /ca/chi-tiet và examStatus vẫn chạy', async () => {
    const d = dung()
    d.sql.exec('ALTER TABLE ca DROP COLUMN them_phut_tong')
    const r = await goi(d, { maCa: 'C1', phut: 5 })
    expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/migration-2109-them-phut/) })
    expect(han(d, 'S1')).toBe(HET)
    const ct = await goiWorker(worker, d.env, '/ca/chi-tiet', { maCa: 'C1' }, true)
    expect(ct.ok).toBe(true)
    expect(ct.ca.themPhutTong).toBe(0)
    expect((await goiWorker(worker, d.env, '/trang-thai', { sbd: 'S1', maCa: 'C1', dangLam: true })).ok).toBe(true)
  })
})

describe('đẩy lại ca (publish, /ca/nhieu) không làm mất phút đã thêm', () => {
  const dayCa = (d: D1That, maCa: string, phut: number) => goiWorker(worker, d.env, '/goi', { action: 'publish', ca: { maCa, tenCa: 'Ca', trangThai: 'mo', loai: 'thi', thoiGianPhut: phut } }, true)
  const phut = (d: D1That, ma: string) => (d.sql.prepare('SELECT thoi_gian_phut AS p FROM ca WHERE ma_ca = ?').get(ma) as { p: number }).p
  it('publish: ca đã thêm phút giữ số lớn hơn (app gửi 45 thì vẫn 55; gửi 60 thì 60); ca chưa thêm phút theo đúng số app gửi (hạ được như cũ)', async () => {
    const d = dung(["INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('C9','Ca chưa thêm','mo','thi',45,'x')"])
    await goi(d, { maCa: 'C1', phut: 10 }) // 55
    expect((await dayCa(d, 'C1', 45)).ok).toBe(true)
    expect(phut(d, 'C1')).toBe(55)
    expect((await dayCa(d, 'C1', 60)).ok).toBe(true)
    expect(phut(d, 'C1')).toBe(60)
    expect((await dayCa(d, 'C9', 40)).ok).toBe(true)
    expect(phut(d, 'C9')).toBe(40)
    expect(caRow(d).t).toBe(10) // tổng đã thêm không bị đụng
  })
  it('/ca/nhieu: cùng luật cho từng ca trong lượt đẩy', async () => {
    const d = dung(["INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('C9','Ca chưa thêm','mo','thi',45,'x')"])
    await goi(d, { maCa: 'C1', phut: 10 })
    const r = await goiWorker(worker, d.env, '/ca/nhieu', { ca: [{ maCa: 'C1', tenCa: 'Ca 1', trangThai: 'mo', thoiGianPhut: 45 }, { maCa: 'C9', tenCa: 'Ca 9', trangThai: 'mo', thoiGianPhut: 40 }] }, true)
    expect(r.ok).toBe(true)
    expect(phut(d, 'C1')).toBe(55)
    expect(phut(d, 'C9')).toBe(40)
  })
  it('chưa chạy migration (thiếu cột them_phut_tong): publish và /ca/nhieu vẫn ghi như cũ, không vỡ', async () => {
    const d = dung()
    d.sql.exec('ALTER TABLE ca DROP COLUMN them_phut_tong')
    expect((await dayCa(d, 'C1', 50)).ok).toBe(true)
    expect(phut(d, 'C1')).toBe(50)
    expect((await goiWorker(worker, d.env, '/ca/nhieu', { ca: [{ maCa: 'C1', tenCa: 'Ca 1', trangThai: 'mo', thoiGianPhut: 47 }] }, true)).ok).toBe(true)
    expect(phut(d, 'C1')).toBe(47)
  })
})

describe('examStatus trả hetGioLuc; /ca/chi-tiet trả themPhutTong; luật nộp 1 phút cuối theo hạn mới', () => {
  const tt = (d: D1That, sbd: string, maCa: string | undefined) => goiWorker(worker, d.env, '/trang-thai', { sbd, ...(maCa === undefined ? {} : { maCa }), dangLam: true })
  it('lượt đang làm ⇒ hetGioLuc hiện hành (mới sau khi thêm phút); vắng khi không có maCa, không có lượt, lượt đã nộp/chưa có hạn; luôn ok:true', async () => {
    const d = dung()
    expect(await tt(d, 'S1', 'C1')).toMatchObject({ ok: true, hetGioLuc: HET })
    await goi(d, { maCa: 'C1', phut: 5 })
    expect(await tt(d, 'S1', 'C1')).toMatchObject({ ok: true, hetGioLuc: iso(T0 + 50 * 60_000) })
    for (const [sbd, ma] of [['S1', undefined], ['S1', 'KHAC'], ['S3', 'C1'], ['S4', 'C1'], ['S5', 'C1'], ['S6', 'C1'], ['S9', 'C1']] as const) {
      const r = await tt(d, sbd, ma)
      expect(r.ok, `${sbd}/${ma}`).toBe(true)
      expect('hetGioLuc' in r, `${sbd}/${ma}`).toBe(false)
    }
    // Vẫn ghi bảng trang_thai như cũ.
    expect(d.sql.prepare("SELECT ma_ca, dang_lam FROM trang_thai WHERE sbd = 'S1'").get()).toEqual({ ma_ca: 'KHAC', dang_lam: 1 })
  })
  it('/ca/chi-tiet: ca.themPhutTong và ca.thoiGianPhut theo lệnh; ca chưa thêm = 0', async () => {
    const d = dung()
    expect((await goiWorker(worker, d.env, '/ca/chi-tiet', { maCa: 'C1' }, true)).ca).toMatchObject({ themPhutTong: 0, thoiGianPhut: 45 })
    await goi(d, { maCa: 'C1', phut: 10 })
    expect((await goiWorker(worker, d.env, '/ca/chi-tiet', { maCa: 'C1' }, true)).ca).toMatchObject({ themPhutTong: 10, thoiGianPhut: 55 })
  })
  it('luật "chỉ nộp trong 1 phút cuối" tính theo hạn MỚI: còn 40 giây thì nộp được; đã thêm 5 phút thì bị từ chối (còn > 70 giây)', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,chi_nop_3_phut_cuoi,cap_nhat_luc) VALUES('C1','x','mo','thi',45,1,'x')").run()
    for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,het_gio_luc,trang_thai,cap_nhat_luc) VALUES(?,'C1',?,1,'x',?,'dang_lam','x')").run(`C1|${s}|1`, s, iso(Date.now() + 40_000))
    const nop = (sbd: string) => goiWorker(worker, d.env, '/nop', { maCa: 'C1', sbd, lanThu: 1, dapAn: {}, integrity: {} })
    expect((await nop('S2')).ok).toBe(true) // chưa thêm phút: còn 40 giây nên nộp được
    await goi(d, { maCa: 'C1', phut: 5 })
    const chan = await nop('S1') // hạn mới còn ~5 phút 40 giây
    expect(chan.ok).toBe(false)
    expect(chan.lyDo).toBe('chua_den_1_phut_cuoi')
    expect(d.sql.prepare("SELECT trang_thai FROM luot WHERE sbd = 'S1'").get()).toEqual({ trang_thai: 'dang_lam' })
  })
})
