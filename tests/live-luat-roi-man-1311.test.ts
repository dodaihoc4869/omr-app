// @vitest-environment node
// LUẬT «RỜI MÀN N LẦN ⇒ BỊ MỜI RA KHỎI LỚP» (thầy chốt build 13/11): «khi bắt đầu vào chế độ bảng hoặc học mà học sinh bị cảnh báo rời màn 3 lần sẽ tự
// động bị đuổi ra khỏi phòng, học sinh bấm tham gia lại gv duyệt mới cho vào», «số lần có thể chỉnh được», «thầy có nút duyệt và từ chối».
import { describe, expect, it } from 'vitest'
import { duocXemLive, liveBat, liveDat, liveTat, viewLiveEm } from '../src/lib/bpu/phong-live'
import { biCam, biMoiRa, datLuat, luatDuyet, luatXin, tinBaoVanPhong } from '../src/lib/bpu/phong-luat'
import { KJ, roiMan, taoPhong, vaoLop, veMan, viewBang, viewEm, type TrangThaiPhong } from '../src/lib/bpu/phong'

const NAY = 1_700_000_000_000
function phong(gd: 'cho' | 'dang' = 'dang'): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b', lop: 'Live Khối 10', nay: NAY, ds: [{ sbd: 'S1', ten: 'Gia Bảo', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Minh Khôi', coMat: true, luc: 1 }] })
  vaoLop(st, 'S1', NAY); vaoLop(st, 'S2', NAY)
  st.live = { cho: true, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], xa: false, tiengLop: true, soNet: 0, nhip: 0 }
  liveBat(st, NAY); liveDat(st, { khoi: { k: 10, gd, che: 'bang' } }, NAY)
  return st
}
/** Em rời rồi quay lại `lan` lần. */
const roiVe = (st: TrangThaiPhong, sbd: string, lan: number, tu = NAY + 1000) => { for (let i = 0; i < lan; i++) { roiMan(st, sbd, tu + i * 100); veMan(st, sbd, tu + i * 100 + 50) } }

describe('luật rời màn — bật / tắt / chỉnh số lần', () => {
  it('mặc định 3 lần; chỉnh được 1–9 (ngoài khoảng thì kẹp); đổi số lần giữ số đã đếm; tắt thì gỡ', () => {
    const st = phong()
    expect(st.live!.luat ?? null).toBeNull()
    expect(datLuat(st, { bat: true }, NAY + 1)).toBe(true)
    expect(st.live!.luat).toMatchObject({ n: 3, tu: NAY + 1, dem: {}, ra: {} })
    expect(datLuat(st, { bat: true, n: 3 }, NAY + 2)).toBe(false) // không đổi ⇒ không phát lại
    roiVe(st, 'S1', 1)
    expect(datLuat(st, { bat: true, n: 5 }, NAY + 3)).toBe(true)
    expect(st.live!.luat).toMatchObject({ n: 5, tu: NAY + 1, dem: { S1: 1 } })
    datLuat(st, { bat: true, n: 99 }, NAY + 4); expect(st.live!.luat!.n).toBe(9)
    datLuat(st, { bat: true, n: 0 }, NAY + 5); expect(st.live!.luat!.n).toBe(1)
    expect(datLuat(st, { bat: false }, NAY + 6)).toBe(true)
    expect(st.live!.luat).toBeNull()
    for (const x of [null, 3, {}, { bat: 'co' }]) expect(datLuat(st, x, NAY)).toBe(false)
  })
  it('luật TẮT ⇒ rời bao nhiêu lần cũng không bị mời ra (vẫn trừ kJ như cũ)', () => {
    const st = phong()
    st.ds[0].kj = 500
    roiVe(st, 'S1', 5)
    expect(biMoiRa(st, 'S1')).toBe(false)
    expect(st.ds[0].kj).toBe(500 - 5 * KJ.roiMan)
    expect(viewEm(st, 'S1').em).not.toHaveProperty('luat')
  })
})

describe('luật rời màn — đếm, mời ra, xin vào lại, duyệt / từ chối', () => {
  it('chỉ đếm LẦN RỜI MỚI từ lúc bật; lần 1 và 2 em thấy số đã rời; đủ 3 ⇒ bị mời ra, hết quyền xem live, vào sổ', () => {
    const st = phong()
    roiVe(st, 'S1', 2) // trước khi bật: không tính
    datLuat(st, { bat: true, n: 3 }, NAY + 500)
    expect(viewEm(st, 'S1').em!.luat).toEqual({ n: 3, tu: NAY + 500, da: 0, ra: false, xin: false, cam: false })
    roiMan(st, 'S1', NAY + 600); roiMan(st, 'S1', NAY + 610) // báo trùng trong cùng một lần rời ⇒ chỉ tính một
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ da: 1, ra: false })
    veMan(st, 'S1', NAY + 700)
    roiVe(st, 'S1', 1, NAY + 800)
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ da: 2, ra: false })
    expect(duocXemLive(st, 'S1')).toBe(true)
    roiMan(st, 'S1', NAY + 900)
    expect(biMoiRa(st, 'S1')).toBe(true)
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ da: 3, ra: true, xin: false })
    expect(duocXemLive(st, 'S1')).toBe(false)
    const lv = viewLiveEm(st, 'S1')!
    expect(lv).toMatchObject({ duocXem: false, bat: false, ss: null, khoi: { gd: 'dang' } }) // không tiếng, không bảng; vẫn có cờ khối để hiện màn «bị mời ra»
    expect(viewBang(st).luat).toMatchObject({ bat: true, n: 3, dem: {}, ra: [{ sbd: 'S1', luc: NAY + 900, xin: false }], cam: [], so: [{ sbd: 'S1', luc: NAY + 900, lan: 3 }] })
    expect(biMoiRa(st, 'S2')).toBe(false)
    // đã bị mời ra: rời thêm không đếm, không trừ kJ nữa
    const kj = st.ds[0].kj
    veMan(st, 'S1', NAY + 950); expect(roiMan(st, 'S1', NAY + 960)).toBe(false)
    expect(st.ds[0].kj).toBe(kj)
  })
  it('em xin vào lại ⇒ thầy thấy; DUYỆT ⇒ vào lại, đếm lại từ đầu, sổ vẫn giữ', () => {
    const st = phong()
    datLuat(st, { bat: true, n: 2 }, NAY)
    roiVe(st, 'S1', 2)
    expect(luatXin(st, 'S1', NAY + 3000)).toBe(true)
    expect(luatXin(st, 'S1', NAY + 3001)).toBe(false) // đang chờ duyệt: bấm lặp không làm gì
    expect(viewBang(st).luat!.ra).toEqual([{ sbd: 'S1', luc: NAY + 1100, xin: true }])
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ ra: true, xin: true, cam: false })
    expect(luatDuyet(st, 'S1', true, NAY + 70_000)).toBe(true)
    expect(biMoiRa(st, 'S1')).toBe(false)
    expect(duocXemLive(st, 'S1')).toBe(true)
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ da: 0, ra: false })
    expect(viewBang(st).luat).toMatchObject({ ra: [], so: [{ sbd: 'S1', lan: 2 }] })
    expect(luatXin(st, 'S2', NAY)).toBe(false); expect(luatDuyet(st, 'LA', true, NAY)).toBe(false); expect(luatDuyet(st, 'S2', false, NAY)).toBe(false) // em không bị mời ra: không có gì để duyệt / từ chối
  })
  it('TỪ CHỐI (kể cả khi em chưa xin) ⇒ CẤM tới hết buổi live: không xin lại được, không xem live, không còn cờ khối (máy em ra màn Hôm nay); tắt luật vẫn cấm; thầy «Cho vào lại» hoặc tắt live mới gỡ', () => {
    const st = phong()
    datLuat(st, { bat: true, n: 2 }, NAY)
    roiVe(st, 'S1', 2)
    expect(luatDuyet(st, 'S1', false, NAY + 2000)).toBe(true) // em chưa xin, thầy vẫn từ chối được
    expect(biCam(st, 'S1')).toBe(true); expect(biMoiRa(st, 'S1')).toBe(true)
    expect(luatXin(st, 'S1', NAY + 3000)).toBe(false); expect(luatXin(st, 'S1', NAY + 9_999_999)).toBe(false) // không xin lại được, chờ bao lâu cũng vậy
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ ra: true, xin: false, cam: true })
    expect(duocXemLive(st, 'S1')).toBe(false)
    const lv = viewLiveEm(st, 'S1')!
    expect(lv).toMatchObject({ duocXem: false, bat: false, ss: null }); expect(lv).not.toHaveProperty('khoi') // mất cờ khối ⇒ lớp nổi live trên máy em tự gỡ
    expect(viewBang(st).luat).toMatchObject({ ra: [], cam: [{ sbd: 'S1', luc: NAY + 2000 }], so: [{ sbd: 'S1', lan: 2 }] })
    expect(tinBaoVanPhong(viewBang(st).luat!, (s) => `Em ${s}`)).toMatch(/Thầy không cho vào lại tới hết buổi: Em S1\./)
    const kj = st.ds[0].kj
    expect(roiMan(st, 'S1', NAY + 4000)).toBe(false); expect(st.ds[0].kj).toBe(kj) // đã ở ngoài: rời thêm không đếm, không trừ kJ
    // thầy tắt luật: em đang CHỜ được vào lại, em bị TỪ CHỐI vẫn bị cấm
    roiVe(st, 'S2', 2, NAY + 5000)
    expect(biMoiRa(st, 'S2')).toBe(true)
    datLuat(st, { bat: false }, NAY + 9000)
    expect(biMoiRa(st, 'S2')).toBe(false); expect(biCam(st, 'S1')).toBe(true)
    expect(viewEm(st, 'S1').em!.luat).toMatchObject({ ra: true, cam: true }); expect(viewEm(st, 'S2').em!.luat ?? null).toBeNull()
    expect(viewBang(st).luat).toMatchObject({ bat: false, ra: [], cam: [{ sbd: 'S1' }] })
    datLuat(st, { bat: true, n: 2 }, NAY + 9500) // bật lại luật: em bị cấm vẫn bị cấm, không bị đếm thêm
    expect(biCam(st, 'S1')).toBe(true); expect(viewBang(st).luat!.dem).toEqual({})
    // thầy đổi ý «Cho vào lại»
    expect(luatDuyet(st, 'S1', true, NAY + 10_000)).toBe(true)
    expect(biCam(st, 'S1')).toBe(false); expect(duocXemLive(st, 'S1')).toBe(true); expect(viewLiveEm(st, 'S1')).toMatchObject({ khoi: { gd: 'dang' } })
    // tắt live gỡ mọi lệnh cấm
    roiVe(st, 'S1', 2, NAY + 11_000); luatDuyet(st, 'S1', false, NAY + 12_000)
    expect(biCam(st, 'S1')).toBe(true)
    liveTat(st, NAY + 13_000)
    expect(biCam(st, 'S1')).toBe(false); expect(biMoiRa(st, 'S1')).toBe(false)
  })
  it('phòng chờ không đếm; thầy tắt luật hoặc tắt live ⇒ không em nào kẹt ngoài lớp', () => {
    const cho = phong('cho')
    datLuat(cho, { bat: true, n: 1 }, NAY)
    roiVe(cho, 'S1', 3)
    expect(biMoiRa(cho, 'S1')).toBe(false)
    expect(cho.live!.luat!.dem).toEqual({})
    const st = phong()
    datLuat(st, { bat: true, n: 1 }, NAY); roiMan(st, 'S1', NAY + 10)
    expect(biMoiRa(st, 'S1')).toBe(true)
    datLuat(st, { bat: false }, NAY + 20)
    expect(biMoiRa(st, 'S1')).toBe(false); expect(duocXemLive(st, 'S1')).toBe(true)
    datLuat(st, { bat: true, n: 1 }, NAY + 30); veMan(st, 'S1', NAY + 31); roiMan(st, 'S1', NAY + 40)
    expect(biMoiRa(st, 'S1')).toBe(true)
    liveTat(st, NAY + 50)
    expect(st.live!.luat).toBeNull()
  })
})
