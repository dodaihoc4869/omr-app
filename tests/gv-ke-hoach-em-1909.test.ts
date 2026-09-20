// @vitest-environment node
// `POST /gv/ke-hoach-em {sbd}` (server/src/gv-ke-hoach-em.ts): lệnh THẦY, CHỈ ĐỌC. SQLite thật, lược đồ thật + mọi migration.
// Lý do tồn tại: `/hs/ke-hoach-ngay` LẬP kế hoạch và chạy `capNhatExp`, nên thầy mở màn Học sinh mà gọi nó là NUỐT `expNhan` của em. Test khoá: 0 ghi.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { gvKeHoachEm } from '../server/src/gv-ke-hoach-em'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const bam = (d: D1That, t: string) => JSON.stringify(d.sql.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())
const bamTatCa = (d: D1That) => Object.fromEntries((d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((x) => [x.name, bam(d, x.name)]))
const CAM_GHI = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|VACUUM|PRAGMA\s+\w+\s*=)/i
/** Ghi lại MỌI câu SQL đi qua D1 giả (cả prepare lẫn batch). */
function ghiLai(d: D1That): string[] {
  const sqls: string[] = []
  const prepare = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { sqls.push(q); return prepare(q) }) as never
  const batch = d.env.DB.batch.bind(d.env.DB)
  d.env.DB.batch = (async (c: never) => { sqls.push('BATCH'); return batch(c) }) as never
  return sqls
}
const goi = (d: D1That, b: Record<string, unknown> = { sbd: 'S1' }, thay = true) => goiWorker(worker, d.env, '/gv/ke-hoach-em', b, thay)
const cauKho = (d: D1That, qid: string) =>
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', qid, 'v', `g-${qid}`, 'AA.BB', JSON.stringify({ qid, phan: 'I', sao: 2 }))

/** Em S1 có thú, EXP mới bật, 3 câu ĐÚNG hôm nay (sẽ sinh khoản EXP khi `capNhatExp` chạy), và (nếu `lap`) một dòng kế hoạch hôm nay đã lập. */
async function dung(lap = true) {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A','mk','x')").run()
  d.sql.prepare("INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES('S1',0,?,'x')").run(JSON.stringify({ pet: 'hoa_long', choice: false, legacy: null, cap: 7, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z', nickname: 'Bé Lửa' }))
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
  for (const q of ['q1', 'q2', 'q3']) cauKho(d, q)
  const luc = new Date().toISOString()
  expect((await ghiSuKien(d.env, ['q1', 'q2', 'q3'].map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: q, lan: i + 1, ketQua: 1 as const, luc })))).ok).toBe(true)
  if (lap) await lapVaLuuKeHoach(d.env, ['S1'], Date.now())
  return d
}

describe('/gv/ke-hoach-em: đọc kế hoạch hôm nay đã lập', () => {
  it('trả ngày, lanNghi, nganSach, viec, tienBo, thanThu, exp; đúng bằng dòng ke_hoach_ngay đã lưu', async () => {
    const d = await dung()
    const r = await goi(d)
    const dong = d.sql.prepare("SELECT * FROM ke_hoach_ngay WHERE sbd = 'S1'").get() as Record<string, string | number>
    expect(r).toMatchObject({ ok: true, sbd: 'S1', ngay: dong.ngay, lanNghi: false, capNhatLuc: dong.cap_nhat_luc, ketQua: null })
    expect(r.nganSach).toEqual(JSON.parse(String(dong.ngan_sach_json)))
    const phan = JSON.parse(String(dong.viec_json))
    expect(r.viec).toEqual(phan.viec)
    expect(r.tienBo).toEqual(phan.tienBo)
    expect(r.quaHan).toEqual(phan.quaHan)
    expect(r.canhBao).toEqual(JSON.parse(String(dong.canh_bao_json)))
    expect(r.thanThu).toEqual({ pet: 'hoa_long', cap: 7, nickname: 'Bé Lửa' })
    expect(r.exp).toMatchObject({ homNay: 0, manhKhien: expect.objectContaining({ moiKhien: expect.any(Number), choCongVaoHoSo: false }) })
    expect(r.exp.chiTietHomNay).toEqual([])
    for (const cam of ['expNhan', 'manhNhan', 'chuoiDat', 'datNgay']) expect(cam in r, cam).toBe(false)
  })
  it('ngày nghỉ và ngày đã chốt: lanNghi và ketQua theo dòng đã lưu', async () => {
    const d = await dung()
    d.sql.exec("UPDATE ke_hoach_ngay SET la_ngay_nghi = 1, ket_qua = 'dat'")
    expect(await goi(d)).toMatchObject({ ok: true, lanNghi: true, ketQua: 'dat' })
  })
  it('chưa có dòng của hôm nay ⇒ {ok:true, chuaCo:true} và KHÔNG tạo dòng nào; em không có thật, thiếu SBD ⇒ ok:false; đòi mã bí mật', async () => {
    const d = await dung(false)
    const truoc = bamTatCa(d)
    expect(await goi(d)).toMatchObject({ ok: true, chuaCo: true })
    expect(await goi(d, { sbd: 'KHONG-CO' })).toMatchObject({ ok: false })
    expect(await goi(d, { sbd: 'x'.repeat(41) })).toMatchObject({ ok: false })
    expect(await goi(d, {})).toMatchObject({ ok: false })
    expect(bamTatCa(d)).toEqual(truoc)
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM ke_hoach_ngay').get()).toEqual({ n: 0 })
    expect((await goi(d, { sbd: 'S1' }, false)).ok).not.toBe(true)
  })
  it('dòng kế hoạch hỏng ⇒ ok:false có chữ; thiếu bảng ke_hoach_ngay ⇒ chuaCo', async () => {
    const d = await dung()
    d.sql.exec("UPDATE ke_hoach_ngay SET viec_json = '{hỏng'")
    const r = await goi(d)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toMatch(/đọc không được/)
    d.sql.exec('DROP TABLE ke_hoach_ngay')
    expect(await goi(d)).toMatchObject({ ok: true, chuaCo: true })
  })
})

describe('/gv/ke-hoach-em: TUYỆT ĐỐI 0 ghi, không nuốt expNhan của em', () => {
  it('không câu INSERT/UPDATE/DELETE/DDL nào đi qua D1, không batch, mọi bảng y nguyên từng byte — cả khi có dòng kế hoạch lẫn khi không có', async () => {
    for (const lap of [true, false]) {
      const d = await dung(lap)
      const truoc = bamTatCa(d)
      const sqls = ghiLai(d)
      expect(await goi(d)).toMatchObject({ ok: true })
      expect(sqls.length).toBeGreaterThan(0)
      expect(sqls.filter((q) => CAM_GHI.test(q) || q === 'BATCH'), `lap=${lap}`).toEqual([])
      expect(bamTatCa(d)).toEqual(truoc)
    }
  })
  it('KHÔNG chạy capNhatExp: sổ EXP vẫn trống sau lệnh thầy; em mở app SAU ĐÓ vẫn nhận đủ `expNhan` (không bị nuốt); lệnh thầy lần sau thấy EXP đã có', async () => {
    const d = await dung()
    const truoc = await goi(d)
    expect(truoc.exp.homNay).toBe(0)
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM exp_so').get()).toEqual({ n: 0 })
    // Thầy mở màn Học sinh nhiều lần: vẫn không ghi gì.
    await goi(d); await goi(d)
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM exp_so').get()).toEqual({ n: 0 })
    // Em mở app: nhận EXP + thông báo.
    const hs = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(hs.ok).toBe(true)
    expect(Array.isArray(hs.expNhan) && hs.expNhan.length > 0).toBe(true)
    expect(hs.exp.homNay).toBeGreaterThan(0)
    // Giờ sổ EXP có khoản: lệnh thầy ĐỌC ra đúng số ấy (vẫn không ghi).
    const sau = await goi(d)
    expect(sau.exp.homNay).toBe(hs.exp.homNay)
    expect(sau.exp.chiTietHomNay.length).toBeGreaterThan(0)
    expect('expNhan' in sau).toBe(false)
  })
  it('gvKeHoachEm gọi trực tiếp với giờ tuỳ ý cũng chỉ đọc: ngày lấy theo giờ truyền vào (giờ VN)', async () => {
    const d = await dung()
    expect(await gvKeHoachEm(d.env, { sbd: 'S1' }, Date.now() + 5 * 86_400_000)).toMatchObject({ ok: true, chuaCo: true }) // 5 ngày sau: chưa có dòng
  })
})
