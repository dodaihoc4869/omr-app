// @vitest-environment node
// BUỔI HỌC + ĐIỂM DANH (bảng DẠY HỌC của Lên bảng, thầy lệnh 28/09) — máy chủ `server/src/buoi-hoc.ts` chạy trên D1 thật (node:sqlite, đủ migration).
// Khoá: mã 6 số đổi mỗi 60 giây (nhận phút này + phút trước), mã cũ / buổi hết 24 giờ / buổi đã kết thúc bị từ chối; em chỉ điểm danh CHO MÌNH
// (SBD từ token, `sbd` trong thân bị lờ); buổi gắn lớp; thầy bớt em thì mã không tự thêm lại; lệnh em không bao giờ trả mã; sức học đọc đúng sổ;
// bảng mới thuộc XOÁ khi reset.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { CHU_KY_MA_MS, HAN_BUOI_MS, _xoaDemSai, gvBuoiHoc, gvSucHocBuoi, hsBuoiHocDangMo, hsDiemDanh, maCuaBuoi, cuaSoCua } from '../server/src/buoi-hoc'
import { gameToken } from '../server/src/game-v2-auth'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { BANG_XOA } from '../server/src/reset-toan-app'

const T0 = Date.parse('2026-09-28T11:00:30.000Z') // 18:00 giờ VN

function fixture() {
  const d = taoD1That()
  d.sql.exec(
    "INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12','mk1','x'),('S2','Trần Bảo','12','mk2','x'),('S3','Lê Chi','11','mk3','x')",
  )
  return { d, env: d.env }
}
const biMat = (d: ReturnType<typeof taoD1That>, id: string) => String((d.sql.prepare('SELECT bi_mat FROM buoi_hoc WHERE id = ?').get(id) as { bi_mat: string }).bi_mat)

beforeEach(() => _xoaDemSai())

describe('mở buổi + mã đổi mỗi phút', () => {
  it('mở ⇒ mã 6 số + mốc đổi mã; xem lại cùng phút ⇒ cùng mã; sang phút sau ⇒ mã khác', async () => {
    const { d, env } = fixture()
    const r = (await gvBuoiHoc(env, { action: 'mo', lop: '12 - Lớp Thường', kemLop: true }, T0)) as any
    expect(r.ok).toBe(true)
    expect(r.ma).toMatch(/^\d{6}$/)
    expect(r.doiMaLuc).toBe((cuaSoCua(T0) + 1) * CHU_KY_MA_MS)
    expect(r.buoi).toMatchObject({ lop: '12 - Lớp Thường', dangMo: true })
    expect(r.siSo).toBe(2)
    // lopEm = cả trường (để thêm tay em học ghép lớp khác); sĩ số vẫn theo lớp của buổi
    expect(r.lopEm.map((e: any) => e.sbd).sort()).toEqual(['S1', 'S2', 'S3'])
    expect(r.lopEm.find((e: any) => e.sbd === 'S3').tenLop).toBe('11')
    const r2 = (await gvBuoiHoc(env, { action: 'xem', id: r.buoi.id }, T0 + 5_000)) as any
    expect(r2.ma).toBe(r.ma)
    // mã = HMAC(bí mật buổi, phút): phút sau ra mã khác (xác suất trùng 1/900 000 — dùng hai phút để chắc)
    const bm = biMat(d, r.buoi.id)
    expect(r.ma).toBe(await maCuaBuoi(bm, cuaSoCua(T0)))
    expect([await maCuaBuoi(bm, cuaSoCua(T0) + 1), await maCuaBuoi(bm, cuaSoCua(T0) + 2)]).not.toEqual([r.ma, r.ma])
  })
})

describe('/hs/diem-danh', () => {
  it('em điểm danh CHO MÌNH bằng mã đang chiếu; `sbd` trong thân bị lờ; thầy thấy tên em trong danh sách có mặt', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '12 - Lớp Thường' }, T0)) as any
    const token = await gameToken(env, 'S1')
    const r = (await hsDiemDanh(env, { token, ma: mo.ma, sbd: 'S2' }, T0 + 20_000)) as any
    expect(r).toMatchObject({ ok: true, buoi: { id: mo.buoi.id, daDiemDanh: true } })
    const x = (await gvBuoiHoc(env, { action: 'xem', id: mo.buoi.id }, T0 + 25_000)) as any
    expect(x.coMat.map((e: any) => [e.sbd, e.hoTen, e.cach])).toEqual([['S1', 'Nguyễn An', 'ma']])
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM buoi_hoc_diem_danh WHERE sbd = 'S2'").get() as any).n).toBe(0)
  })

  it('không token / token giả ⇒ từ chối, không ghi', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    expect((await hsDiemDanh(env, { ma: mo.ma, sbd: 'S1' }, T0)).ok).toBe(false)
    expect((await hsDiemDanh(env, { token: 'abc.def', ma: mo.ma }, T0)).ok).toBe(false)
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM buoi_hoc_diem_danh').get() as any).n).toBe(0)
  })

  it('MÃ HẾT HẠN: mã phút trước còn nhận (em đang gõ), mã cách 2 phút bị từ chối; mã sai bị từ chối', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    const bm = biMat(d, mo.buoi.id)
    const token = await gameToken(env, 'S1')
    // 70 giây sau: đã sang phút mới — mã cũ vẫn nhận (phút trước)
    expect((await hsDiemDanh(env, { token, ma: mo.ma }, T0 + 70_000)).ok).toBe(true)
    const token2 = await gameToken(env, 'S2')
    // 3 phút sau: mã ban đầu đã quá hai cửa sổ ⇒ từ chối (trừ khi trùng ngẫu nhiên với mã mới)
    const maMoi = [await maCuaBuoi(bm, cuaSoCua(T0 + 180_000)), await maCuaBuoi(bm, cuaSoCua(T0 + 180_000) - 1)]
    if (!maMoi.includes(mo.ma)) {
      const r = (await hsDiemDanh(env, { token: token2, ma: mo.ma }, T0 + 180_000)) as any
      expect(r).toMatchObject({ ok: false, lyDo: 'ma_sai' })
    }
    const sai = mo.ma === '123456' ? '654321' : '123456'
    expect(((await hsDiemDanh(env, { token: token2, ma: sai }, T0)) as any).lyDo).toBe('ma_sai')
    expect(((await hsDiemDanh(env, { token: token2, ma: '12' }, T0)) as any).lyDo).toBe('ma_sai')
  })

  it('buổi quá 24 giờ hoặc thầy đã Kết thúc ⇒ mã (kể cả đúng) bị từ chối', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    const bm = biMat(d, mo.buoi.id)
    const token = await gameToken(env, 'S1')
    const sau = T0 + HAN_BUOI_MS + 1000
    const maLucDo = await maCuaBuoi(bm, cuaSoCua(sau))
    expect(((await hsDiemDanh(env, { token, ma: maLucDo }, sau)) as any).ok).toBe(false)
    const mo2 = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    const dong = (await gvBuoiHoc(env, { action: 'dong', id: mo2.buoi.id }, T0 + 1000)) as any
    expect(dong.buoi.dangMo).toBe(false)
    expect(dong.ma).toBeUndefined()
    expect(((await hsDiemDanh(env, { token, ma: mo2.ma }, T0 + 2000)) as any).ok).toBe(false)
  })

  it('buổi gắn lớp ⇒ em lớp khác bị từ chối (lyDo khac_lop)', async () => {
    const { env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '12 - Lớp Thường' }, T0)) as any
    const r = (await hsDiemDanh(env, { token: await gameToken(env, 'S3'), ma: mo.ma }, T0)) as any
    expect(r).toMatchObject({ ok: false, lyDo: 'khac_lop' })
  })

  it('thầy BỚT em ⇒ mã không tự thêm lại; thầy THÊM tay ⇒ có mặt (cách "thay")', async () => {
    const { env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    const token = await gameToken(env, 'S1')
    await hsDiemDanh(env, { token, ma: mo.ma }, T0)
    const bot = (await gvBuoiHoc(env, { action: 'bot-em', id: mo.buoi.id, sbd: 'S1' }, T0)) as any
    expect(bot.coMat).toEqual([])
    expect(((await hsDiemDanh(env, { token, ma: mo.ma }, T0 + 1000)) as any).lyDo).toBe('thay_da_bo')
    const them = (await gvBuoiHoc(env, { action: 'them-em', id: mo.buoi.id, sbd: ['S1', 'S3', 'KHONG_CO'] }, T0 + 2000)) as any
    expect(them.coMat.map((e: any) => [e.sbd, e.cach]).sort()).toEqual([
      ['S1', 'ma'],
      ['S3', 'thay'],
    ])
  })

  it('nhập sai quá 8 lần trong 10 phút ⇒ phải chờ', async () => {
    const { env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    const token = await gameToken(env, 'S2')
    const sai = mo.ma === '111111' ? '222222' : '111111'
    for (let i = 0; i < 8; i++) await hsDiemDanh(env, { token, ma: sai }, T0 + i)
    expect(((await hsDiemDanh(env, { token, ma: mo.ma }, T0 + 100)) as any).lyDo).toBe('cho')
  })
})

describe('/hs/buoi-hoc — thẻ trên app em', () => {
  it('buổi đang mở của lớp em ⇒ có (KHÔNG có mã); lớp khác ⇒ null; đã điểm danh ⇒ daDiemDanh', async () => {
    const { env } = fixture()
    expect(((await hsBuoiHocDangMo(env, { token: await gameToken(env, 'S1') }, T0)) as any).buoi).toBeNull()
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '12 - Lớp Thường', ten: 'Ester buổi 3' }, T0)) as any
    const r = (await hsBuoiHocDangMo(env, { token: await gameToken(env, 'S1') }, T0)) as any
    expect(r.buoi).toEqual({ id: mo.buoi.id, ten: 'Ester buổi 3', lop: '12 - Lớp Thường', daDiemDanh: false })
    expect(JSON.stringify(r)).not.toContain(mo.ma)
    expect(((await hsBuoiHocDangMo(env, { token: await gameToken(env, 'S3') }, T0)) as any).buoi).toBeNull()
    await hsDiemDanh(env, { token: await gameToken(env, 'S1'), ma: mo.ma }, T0)
    expect(((await hsBuoiHocDangMo(env, { token: await gameToken(env, 'S1') }, T0)) as any).buoi.daDiemDanh).toBe(true)
  })

  it('thầy xem buổi đang mở (nối tiếp khi mở lại app) — kèm số em có mặt', async () => {
    const { env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo' }, T0)) as any
    await hsDiemDanh(env, { token: await gameToken(env, 'S2'), ma: mo.ma }, T0)
    const r = (await gvBuoiHoc(env, { action: 'dang-mo' }, T0 + 1000)) as any
    expect(r.buoi.map((b: any) => [b.id, b.soCoMat])).toEqual([[mo.buoi.id, 1]])
  })
})

describe('/gv/buoi-hoc/suc-hoc — số thật cho thuật toán chọn em', () => {
  it('đếm theo tổng / câu / dạng / chuyên đề (60 ngày), bậc nam_kt_dang, lên bảng (tổng, đạt, hôm nay)', async () => {
    const { d, env } = fixture()
    const luc = (n: number) => new Date(T0 - n * 864e5).toISOString()
    await ghiSuKien(env, [
      { nguon: 'game', maNguon: 'P1', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: luc(2), maDang: 'D1', chuyenDe: 'Ester' },
      { nguon: 'game', maNguon: 'P2', sbd: 'S1', qid: 'Q2', lan: 1, ketQua: 0, luc: luc(3), maDang: 'D1', chuyenDe: 'Ester' },
      { nguon: 'game', maNguon: 'P3', sbd: 'S1', qid: 'Q9', lan: 1, ketQua: 1, luc: luc(90), maDang: 'D1', chuyenDe: 'Ester' },
      { nguon: 'game', maNguon: 'P4', sbd: 'S2', qid: 'Q1', lan: 1, ketQua: 0, luc: luc(1), maDang: 'D1', chuyenDe: 'Ester' },
    ])
    d.sql.exec("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|D1','S1','D1',3,1,0,0,0,2,'x')")
    d.sql.exec(`INSERT INTO len_bang(sbd,qid,dat,luc) VALUES('S1','Q1',1,'${new Date(T0 - 60_000).toISOString()}'),('S1','Q2',0,'${luc(5)}')`)
    const r = (await gvSucHocBuoi(env, { sbd: ['S1', 'S2', 'S3'], cau: [{ qid: 'Q1', maDang: 'D1', chuyenDe: 'Ester' }] }, T0)) as any
    expect(r.ok).toBe(true)
    expect(r.em.S1.tong).toEqual({ n: 2, d: 1 }) // câu 90 ngày trước không tính
    expect(r.em.S1.qid.Q1).toEqual({ n: 1, d: 1 })
    expect(r.em.S1.dang.D1).toEqual({ n: 2, d: 1 })
    expect(r.em.S1.chuyenDe.Ester).toEqual({ n: 2, d: 1 })
    expect(r.em.S1.bac).toEqual({ D1: 2 })
    expect(r.em.S1.lenBang).toEqual({ n: 2, dat: 1, homNay: 1 })
    expect(r.em.S2.qid.Q1).toEqual({ n: 1, d: 0 })
    expect(r.em.S3.tong).toEqual({ n: 0, d: 0 })
    expect(((await gvSucHocBuoi(env, { sbd: [] }, T0)) as any).ok).toBe(false)
  })
})

describe('reset', () => {
  it('hai bảng mới thuộc XOÁ (cùng họ len_bang)', () => {
    expect(BANG_XOA).toContain('buoi_hoc')
    expect(BANG_XOA).toContain('buoi_hoc_diem_danh')
  })
})
