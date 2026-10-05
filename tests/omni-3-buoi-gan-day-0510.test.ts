// @vitest-environment node
// OMNI 3 (05/10) — thầy: "cho thêm chỗ chọn giao cho hs nhé (bạn bê luôn cái chọn hs ở chiến dịch cũ, cho chọn hs theo điểm danh nữa)".
// Lệnh CHỈ ĐỌC `POST /gv/buoi-hoc {action:'gan-day', soNgay?, lop?}`: các buổi gần đây (còn mở HOẶC đã đóng) kèm SBD em có mặt từng buổi,
// để bước tick bài chọn nhanh em giao theo điểm danh. Khoá: mới nhất trước; buổi đã đóng vẫn có; em bị bớt không còn trong danh sách;
// lọc theo lớp; ngoài cửa sổ ngày thì không có; KHÔNG trả bí mật/mã buổi; không ghi gì vào D1.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { _xoaDemSai, gvBuoiHoc } from '../server/src/buoi-hoc'

const T0 = Date.parse('2026-10-05T11:00:30.000Z') // 18:00 giờ VN
const NGAY = 86_400_000

function fixture() {
  const d = taoD1That()
  d.sql.exec(
    "INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12','mk1','x'),('S2','Trần Bảo','12','mk2','x'),('S3','Lê Chi','11','mk3','x'),('S4','Phạm Dung','12','mk4','x')",
  )
  return { d, env: d.env }
}
const demDong = (d: ReturnType<typeof taoD1That>) =>
  ['buoi_hoc', 'buoi_hoc_diem_danh'].map((t) => Number((d.sql.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n))

beforeEach(() => _xoaDemSai())

describe('gan-day — buổi gần đây kèm danh sách có mặt (chọn em giao bài theo điểm danh)', () => {
  it('mới nhất trước · buổi đã đóng vẫn có · em bị bớt không còn · đúng số có mặt · không bí mật/mã · không ghi gì', async () => {
    const { d, env } = fixture()
    const a = (await gvBuoiHoc(env, { action: 'mo', lop: '12' }, T0 - 2 * NGAY)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: a.buoi.id, sbd: ['S1', 'S2', 'S4'] }, T0 - 2 * NGAY + 60_000)
    await gvBuoiHoc(env, { action: 'bot-em', id: a.buoi.id, sbd: 'S4' }, T0 - 2 * NGAY + 120_000)
    await gvBuoiHoc(env, { action: 'dong', id: a.buoi.id }, T0 - 2 * NGAY + 3_600_000)
    const b = (await gvBuoiHoc(env, { action: 'mo', lop: '11' }, T0)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: b.buoi.id, sbd: ['S3'] }, T0 + 60_000)

    const truoc = demDong(d)
    const r = (await gvBuoiHoc(env, { action: 'gan-day' }, T0 + 120_000)) as any
    expect(demDong(d)).toEqual(truoc)
    expect(r.ok).toBe(true)
    expect(r.buoi.map((x: any) => x.id)).toEqual([b.buoi.id, a.buoi.id])
    expect(r.buoi[0]).toMatchObject({ lop: '11', dangMo: true, soCoMat: 1, coMat: ['S3'] })
    expect(r.buoi[1]).toMatchObject({ lop: '12', dangMo: false, soCoMat: 2, coMat: ['S1', 'S2'] })
    expect(r.buoi[1].dongLuc).toBeTruthy()
    const chuoi = JSON.stringify(r)
    expect(chuoi).not.toMatch(/bi_mat|biMat|"ma"/)
  })

  it('lọc theo lớp · ngoài cửa sổ ngày thì không có (mặc định 7 ngày, tối đa 30) · lớp lạ ⇒ rỗng', async () => {
    const { env } = fixture()
    const cu = (await gvBuoiHoc(env, { action: 'mo', lop: '12' }, T0 - 10 * NGAY)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: cu.buoi.id, sbd: ['S1'] }, T0 - 10 * NGAY + 60_000)
    const moi = (await gvBuoiHoc(env, { action: 'mo', lop: '12' }, T0 - NGAY)) as any
    await gvBuoiHoc(env, { action: 'them-em', id: moi.buoi.id, sbd: ['S2'] }, T0 - NGAY + 60_000)
    await gvBuoiHoc(env, { action: 'mo', lop: '11' }, T0 - NGAY + 1000)

    const macDinh = (await gvBuoiHoc(env, { action: 'gan-day', lop: '12' }, T0)) as any
    expect(macDinh.buoi.map((x: any) => x.id)).toEqual([moi.buoi.id])
    const rong = (await gvBuoiHoc(env, { action: 'gan-day', lop: '12', soNgay: 30 }, T0)) as any
    expect(rong.buoi.map((x: any) => x.id)).toEqual([moi.buoi.id, cu.buoi.id])
    expect(rong.buoi[1].coMat).toEqual(['S1'])
    const quaTran = (await gvBuoiHoc(env, { action: 'gan-day', lop: '12', soNgay: 999 }, T0)) as any
    expect(quaTran.buoi).toHaveLength(2)
    const la = (await gvBuoiHoc(env, { action: 'gan-day', lop: 'Không có' }, T0)) as any
    expect(la).toEqual({ ok: true, buoi: [] })
  })

  it('tối đa 12 buổi, buổi không ai có mặt vẫn hiện với số 0', async () => {
    const { env } = fixture()
    for (let i = 0; i < 15; i++) await gvBuoiHoc(env, { action: 'mo', lop: '12' }, T0 - i * 3_600_000)
    const r = (await gvBuoiHoc(env, { action: 'gan-day' }, T0 + 1000)) as any
    expect(r.buoi).toHaveLength(12)
    expect(r.buoi.every((x: any) => x.soCoMat === 0 && Array.isArray(x.coMat) && x.coMat.length === 0)).toBe(true)
  })
})

describe('buoiGanDay (app thầy) — đọc chặt từng trường', () => {
  it('bỏ buổi thiếu id, bỏ SBD rỗng/trùng, đếm lại số có mặt từ danh sách', async () => {
    vi.resetModules()
    vi.doMock('../src/lib/goi-lenh-thay', () => ({
      goiLenh: async (duong: string, body: Record<string, unknown>) => {
        expect(duong).toBe('/gv/buoi-hoc')
        expect(body).toEqual({ action: 'gan-day', lop: '12', soNgay: 7 })
        return {
          ok: true,
          du: {
            buoi: [
              { id: 'B1', ten: 'Buổi học 05/10 · 12', lop: '12', moLuc: '2026-10-05T11:00:00.000Z', hetHan: 'x', dongLuc: null, dangMo: true, soCoMat: 99, coMat: ['S1', 'S2', 'S2', '', 7] },
              { ten: 'thiếu id' },
            ],
          },
        }
      },
    }))
    const { buoiGanDay } = await import('../src/lib/buoi-hoc-api')
    const r = await buoiGanDay('12')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.du).toHaveLength(1)
    expect(r.du[0]).toMatchObject({ id: 'B1', dangMo: true, soCoMat: 3, coMat: ['S1', 'S2', '7'] })
    vi.doUnmock('../src/lib/goi-lenh-thay')
  })
})
