// @vitest-environment node
// LIVE BẢNG — RỜI MÀN LÚC LIVE (đặc tả mục 4.7 + điểm quyết 2): dùng lại `roi` / `ve` / `dangRoi` của Bình Phản Ứng.
// Khoá: đang live em rời ⇒ bảng thấy tên NGAY (`roiNay`), em có đội bị trừ y như BPU (em −50, đội −50, kẹp 0), không tính là «đang xem»;
// `ve` có xác nhận ⇒ tên mất, `dangRoi` tắt; báo trùng không trừ lần hai; em ở xa (không đội) chỉ bị cảnh báo tên, không trừ gì;
// em nối lại (`chao`) coi như đã về; không live thì em ở xa rời màn không có gì.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'
import { chu, datWebSocketPairGia, taoPhongGia, viewCuoi } from './_live-phong-gia'

describe('rời màn lúc live', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('em có đội rời màn lúc live ⇒ bảng thấy tên ngay, trừ như Bình Phản Ứng; `ve` ⇒ tên mất; báo trùng không trừ lần hai', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(e1, { t: 'live-ok', dc: false }); await ph.gui(e2, { t: 'live-ok', dc: false })
    // Cho S1 có 120 kJ để thấy rõ mức trừ.
    await ph.post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    await ph.gui(e1, { t: 'tra', chon: 'A' }); await ph.gui(gv, { t: 'mo' })
    const kjTruoc = viewCuoi(gv).ds.find((x: { sbd: string }) => x.sbd === 'S1').kj as number
    const doiTruoc = (viewCuoi(gv).doiThuong as number[]).reduce((a, b) => a + b, 0)
    expect(kjTruoc).toBeGreaterThanOrEqual(100)
    const soTinGv = gv.tin.length
    await ph.gui(e1, { t: 'roi' })
    expect(gv.tin.length).toBe(soTinGv + 1) // bảng nhận NGAY trong cùng lần xử lý tin
    let b = viewCuoi(gv)
    expect(b.roiNay).toEqual(['S1'])
    expect(b.live).toMatchObject({ bat: true, xem: 1 }) // em đang rời không tính là đang xem
    expect(b.ds.find((x: { sbd: string }) => x.sbd === 'S1')).toMatchObject({ kj: kjTruoc - L.KJ.roiMan, roi: 1 })
    expect((b.doiThuong as number[]).reduce((a, c) => a + c, 0)).toBe(doiTruoc - L.KJ.roiMan)
    expect(b.bienDong.at(-1)).toMatchObject({ sbd: 'S1', kjEm: -50, kjDoi: -50, lyDo: 'Rời màn hình' })
    expect(viewCuoi(e1).em.dangRoi).toBe(true)
    expect(viewCuoi(e1).live.bat).toBe(true) // live vẫn chạy; máy em vẫn phát tiếng thầy (12/11), chỉ tắt mic (thư viện `datRoiMan`)
    await ph.gui(e1, { t: 'roi' }) // máy em báo trùng trước khi về
    b = viewCuoi(gv)
    expect(b.ds.find((x: { sbd: string }) => x.sbd === 'S1').kj).toBe(kjTruoc - L.KJ.roiMan)
    await ph.gui(e1, { t: 've' })
    b = viewCuoi(gv)
    expect(b.roiNay).toEqual([])
    expect(b.live.xem).toBe(2)
    expect(viewCuoi(e1).em.dangRoi).toBe(false)
    // Rời lần hai ⇒ trừ tiếp.
    await ph.gui(e1, { t: 'roi' })
    expect(viewCuoi(gv).ds.find((x: { sbd: string }) => x.sbd === 'S1')).toMatchObject({ kj: kjTruoc - 2 * L.KJ.roiMan, roi: 3 })
    // Tắt hẳn app rồi mở lại (không kịp gửi `ve`): `chao` ⇒ coi như đã về.
    await ph.gui(e1, { t: 'chao' })
    expect(viewCuoi(gv).roiNay).toEqual([])
  })
  it('em Ở XA (thuộc lớp, chưa điểm danh, thầy bật «cho em ở xa») rời màn lúc live ⇒ CHỈ cảnh báo tên, không trừ kJ, không biến động', () => {
    const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: [{ sbd: 'S1', ten: 'A', coMat: true, luc: 1 }, { sbd: 'XA', ten: 'Em Ở Xa', coMat: false }] })
    LL.datCoLive(st, { cho: true, sfu: true }, 1000)
    const doi = [...st.doiThuong], bd = (st.bienDong ?? []).length
    // Chưa live / chưa bật «cho em ở xa» ⇒ như cũ: em chưa điểm danh rời màn không có gì.
    expect(L.roiMan(st, 'XA', 1100)).toBe(false)
    LL.liveBat(st, 1200)
    expect(L.roiMan(st, 'XA', 1300)).toBe(false)
    LL.liveDat(st, { xa: true }, 1400)
    expect(LL.laEmXaDangLive(st, 'XA')).toBe(true)
    expect(L.roiMan(st, 'XA', 1500)).toBe(true)
    expect(st.roiNay).toEqual(['XA'])
    expect(st.ds.find((e) => e.sbd === 'XA')).toMatchObject({ kj: 0, roi: 1, vao: false })
    expect(st.doiThuong).toEqual(doi)
    expect((st.bienDong ?? []).length).toBe(bd)
    expect(L.viewBang(st).roiNay).toEqual(['XA'])
    expect(L.viewEm(st, 'XA').em).toMatchObject({ dangRoi: true, vao: false })
    expect(L.veMan(st, 'XA', 1600)).toBe(true)
    expect(st.roiNay).toEqual([])
    // Tắt live ⇒ em ở xa rời màn lại không có gì; em có đội vẫn theo luật BPU.
    LL.liveTat(st, 1700)
    expect(L.roiMan(st, 'XA', 1800)).toBe(false)
    expect(L.roiMan(st, 'S1', 1900)).toBe(true)
    expect(st.roiNay).toEqual(['S1'])
  })
  it('rời màn KHÔNG làm phòng phát lại sổ nét hay tắt live; em về nhận nét mới bình thường', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'live-bat' }); await ph.gui(e1, { t: 'live-ok', dc: false })
    await ph.gui(e1, { t: 'roi' })
    await ph.guiNp(gv, new Uint8Array([0x13, 0, 0, 0, 0]))
    await ph.gui(e1, { t: 've' })
    expect(chu(e1).filter((m) => m.t === 'live-so')).toEqual([])
    expect(e1.tin.filter((t) => typeof t !== 'string').length).toBe(1)
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, soNet: 1 })
  })
})
