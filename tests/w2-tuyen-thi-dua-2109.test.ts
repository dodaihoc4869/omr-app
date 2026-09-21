// @vitest-environment node
// W2 — ĐỊNH TUYẾN hai lệnh đọc-chỉ của Code 4 (Điều 8, ô "Thi đua hôm nay"): `POST /hs/thi-dua-hom-nay {token}` và khối `chuaHocHomNay` trong `/gv/bang-tin`. Hàm gốc đã có test riêng (thi-dua-hom-nay-2109);
// ở đây chỉ khoá: đường có nối, đúng cổng (token em / bí mật thầy), khối bảng tin chỉ-thêm và không làm hỏng bảng tin.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,cap_nhat_luc) VALUES('S1','Nguyễn Văn A','mk1','12','x'),('S2','Trần Thị B','mk2','12','x')").run()
  return d
}

describe('POST /hs/thi-dua-hom-nay', () => {
  it('token đúng ⇒ ok:true, có bảng của lớp em; token sai / thiếu ⇒ ok:false, KHÔNG lộ dữ liệu', async () => {
    const d = dung()
    const token = await gameToken(d.env, 'S1')
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: new Date().toISOString() }])
    const r = await goiWorker(worker, d.env, '/hs/thi-dua-hom-nay', { token }) as any
    expect(r).toMatchObject({ ok: true, siSo: 2 })
    expect(r).toHaveProperty('top'); expect(r).toHaveProperty('cuaEm')
    const sai = await goiWorker(worker, d.env, '/hs/thi-dua-hom-nay', { token: token + 'x' }) as any
    expect(sai.ok).toBe(false); expect(sai).not.toHaveProperty('top')
    expect((await goiWorker(worker, d.env, '/hs/thi-dua-hom-nay', {}) as any).ok).toBe(false)
  })
})

describe('/gv/bang-tin có khối chuaHocHomNay (chỉ-thêm)', () => {
  it('trả {ngay, theoLop:[{lop, siSo, chuaHoc, em[]}]} với em CHƯA học hôm nay; bảng tin cũ nguyên vẹn (ok, soTruyVan)', async () => {
    const d = dung()
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: new Date().toISOString() }])
    const r = await goiWorker(worker, d.env, '/gv/bang-tin', {}, true) as any
    expect(r.ok).not.toBe(false)
    expect(r).toHaveProperty('soTruyVan')
    expect(r.chuaHocHomNay).toBeTruthy()
    const lop = (r.chuaHocHomNay.theoLop as { lop: string; siSo: number; chuaHoc: number; em: { sbd: string }[] }[])[0]!
    expect(lop).toMatchObject({ siSo: 2, chuaHoc: 1 })
    expect(lop.em.map((e) => e.sbd)).toEqual(['S2'])
  })
  it('không có bí mật thầy ⇒ bị chặn như mọi lệnh /gv/*', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/gv/bang-tin', {}, false) as any
    expect(r).not.toHaveProperty('chuaHocHomNay')
  })
})

describe('POST /ph/tat-ca-ve-con và /ph/chi-tiet-cau-ve-con (Code 4, đã soát) — chỉ định tuyến', () => {
  it('SBD trần hợp lệ ⇒ ok:true, khối kết quả có mặt và ghi truy cập đúng đường; SBD lạ / thiếu ⇒ ok:false hoặc lỗi chữ, không lộ dữ liệu', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/ph/tat-ca-ve-con', { sbd: 'S1' }) as any
    expect(r.ok).toBe(true)
    expect(d.sql.prepare("SELECT kieu FROM ph_truy_cap WHERE duong = 'ph-tat-ca-ve-con'").all()).toEqual([{ kieu: 'sbd_tran' }])
    const sai = await goiWorker(worker, d.env, '/ph/tat-ca-ve-con', { sbd: 'KHONG-CO' }) as any
    expect(sai.ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ph/tat-ca-ve-con', {}) as any).ok).toBe(false)
    const ct = await goiWorker(worker, d.env, '/ph/chi-tiet-cau-ve-con', { sbd: 'KHONG-CO' }) as any
    expect(ct.ok).toBe(false)
  })
})
