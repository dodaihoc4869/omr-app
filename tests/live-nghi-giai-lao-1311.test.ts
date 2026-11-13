// @vitest-environment node
// NÚT «NGHỈ» (thầy 13/11: «khi bấm nút này thì toàn bộ được về màn hình chờ chơi game tiếp, trên màn hình chơi game có nút học tiếp bấm vào là vào đúng chỗ
// live đã nghỉ»; duyệt bản vẽ 67–70). Phòng: cờ `khoi.giaiLao` (giờ bắt đầu nghỉ) + live tạm dừng; `gd` / `che` giữ nguyên để học tiếp đúng chỗ.
import { describe, expect, it } from 'vitest'
import { chuanKhoi, khoiDangChoi, liveBat, liveDat, viewLiveEm } from '../src/lib/bpu/phong-live'
import { datLuat, biMoiRa } from '../src/lib/bpu/phong-luat'
import { KJ, roiMan, taoPhong, vaoLop, veMan, viewBang, type TrangThaiPhong } from '../src/lib/bpu/phong'

const NAY = 1_700_000_000_000
function phong(): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b', lop: 'Live Khối 10', nay: NAY, ds: [{ sbd: 'S1', ten: 'Gia Bảo', coMat: true, luc: 1 }] })
  vaoLop(st, 'S1', NAY)
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveBat(st, NAY); liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang' } }, NAY)
  return st
}

describe('nghỉ giải lao', () => {
  it('cờ `giaiLao` chỉ nhận khi đang live (gd = dang), số dương; phòng chờ / số sai ⇒ bỏ', () => {
    expect(chuanKhoi({ k: 10, gd: 'dang', che: 'bang', giaiLao: NAY + 0.7 })).toEqual({ k: 10, gd: 'dang', che: 'bang', giaiLao: NAY })
    expect(chuanKhoi({ k: 10, gd: 'cho', che: 'hoc', giaiLao: NAY })).toEqual({ k: 10, gd: 'cho', che: 'hoc' })
    for (const x of [0, -5, 'abc', null, undefined]) expect(chuanKhoi({ k: 10, gd: 'dang', che: 'hoc', giaiLao: x })).toEqual({ k: 10, gd: 'dang', che: 'hoc' })
    expect(khoiDangChoi({ k: 10, gd: 'cho', che: 'hoc' })).toBe(true); expect(khoiDangChoi({ k: 10, gd: 'dang', che: 'hoc' })).toBe(false)
    expect(khoiDangChoi({ k: 10, gd: 'dang', che: 'hoc', giaiLao: NAY })).toBe(true); expect(khoiDangChoi(null)).toBe(false)
  })
  it('thầy bấm «Nghỉ»: máy em nhận cờ nghỉ, live tạm dừng (không tiếng), chế độ GIỮ NGUYÊN; «Học tiếp»: gỡ cờ, live chạy lại đúng chế độ cũ', () => {
    const st = phong()
    expect(liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang', giaiLao: NAY + 5000 }, nghi: true }, NAY + 5000)).toBe(true)
    expect(viewLiveEm(st, 'S1')).toMatchObject({ khoi: { gd: 'dang', che: 'bang', giaiLao: NAY + 5000 }, nghi: true, bat: true })
    expect(liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang' }, nghi: false }, NAY + 200_000)).toBe(true)
    const v = viewLiveEm(st, 'S1')!
    expect(v).toMatchObject({ khoi: { gd: 'dang', che: 'bang' }, nghi: false, bat: true }); expect(v.khoi).not.toHaveProperty('giaiLao')
  })
  it('đang nghỉ: em rời app KHÔNG bị trừ kJ, không lên bảng báo rời màn, luật rời màn KHÔNG đếm; học tiếp thì tính lại như thường', () => {
    const st = phong()
    st.ds[0].kj = 500
    datLuat(st, { bat: true, n: 2 }, NAY)
    liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang', giaiLao: NAY + 1000 }, nghi: true }, NAY + 1000)
    for (let i = 0; i < 4; i++) { roiMan(st, 'S1', NAY + 2000 + i * 100); veMan(st, 'S1', NAY + 2050 + i * 100) }
    expect(st.ds[0].kj).toBe(500); expect(st.live!.luat!.dem).toEqual({}); expect(biMoiRa(st, 'S1')).toBe(false)
    roiMan(st, 'S1', NAY + 3000); expect(viewBang(st).roiNay).toEqual([])
    veMan(st, 'S1', NAY + 3050)
    liveDat(st, { khoi: { k: 10, gd: 'dang', che: 'bang' }, nghi: false }, NAY + 9000)
    roiMan(st, 'S1', NAY + 10_000)
    expect(st.ds[0].kj).toBe(500 - KJ.roiMan); expect(st.live!.luat!.dem).toEqual({ S1: 1 }); expect(viewBang(st).roiNay).toEqual(['S1'])
  })
})
