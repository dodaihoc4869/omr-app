// @vitest-environment node
// LIVE — SỬA KHẨN 11/11 sau khi thầy test máy thật + luật ĐỢT 2 (đàm thoại hai chiều, giao diện chưa mở — cờ `GIAO_DIEN_DOT_2`).
// Khoá ở tầng LUẬT PHÒNG (thuần) và PHÒNG THẬT (Durable Object trên kho giả):
//   K3  tạm dừng live: `live.nghi` chỉ thầy đặt, chỉ khi đang live; tắt live ⇒ hết; không phát mic lúc dừng; chờ tự tắt lâu gấp bốn; tên trường không trùng khoá đáp án.
//   B2  kiểu rời màn máy em báo ⇒ `viewBang.roiKieu`; em về ⇒ mất; kiểu lạ ⇒ bỏ.
//   Đợt 2  giơ tay theo thứ tự · mời nói (một em) · «Để sau» · không bật được mic · thu mic · em lên bảng bị thu không tự bật lại · em ở xa · nhật ký trong kho của phòng
//          (không D1) · vé «em ở xa» không điểm danh, không gửi đáp án.
import { beforeAll, describe, expect, it } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'
import { datWebSocketPairGia, taoPhongGia, viewCuoi } from './_live-phong-gia'

const SS = { id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', tieng: 'thay', kenh: 'net' }
const PHIEN_EM = 'e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1', DAP_AN = 'ĐÁP-ÁN-BÍ-MẬT-XYZ'
function phong() {
  const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: 2 }, { sbd: 'S3', ten: 'Lê Khánh Vy', coMat: true, luc: 3 }, { sbd: 'XA', ten: 'Em Ở Xa', coMat: false, luc: null }] })
  LL.datCoLive(st, { cho: true, sfu: true }, 1000)
  LL.liveSan(st, { ss: SS }, 1100)
  return st
}
const luot = (st: L.TrangThaiPhong, nay: number) => L.moLuot(st, { qid: 'q', phan: 'I', tuLuan: false, cau: { text: 'Đề' }, dung: DAP_AN, hanGiay: null }, nay)
const mic = (st: L.TrangThaiPhong, sbd: string, nay: number, mid = '3') => LL.liveMicBat(st, { sbd, id: PHIEN_EM, tieng: 'mic', mid }, nay)

describe('K3 · tạm dừng live (thuần)', () => {
  it('chỉ đặt được khi đang live; hai view cùng báo `nghi`; tiếp tục ⇒ hết; tắt live / bật lại ⇒ không còn dừng', () => {
    const st = phong()
    expect(LL.liveDat(st, { nghi: true }, 1200)).toBe(false) // chưa live
    LL.liveBat(st, 1300)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, nghi: false })
    expect(LL.liveDat(st, { nghi: true }, 1400)).toBe(true)
    expect(LL.liveDat(st, { nghi: true }, 1401)).toBe(false) // bấm lặp không phát lại view
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, nghi: true })
    expect(L.viewBang(st).live).toMatchObject({ bat: true, nghi: true })
    // phiên SFU, số phiên, giờ bật KHÔNG đổi ⇒ tiếp tục là có lại ngay
    expect(st.live).toMatchObject({ phien: 1, ss: SS, tu: 1300 })
    expect(LL.liveDat(st, { nghi: false }, 1500)).toBe(true)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, nghi: false, phien: 1 })
    LL.liveDat(st, { nghi: true }, 1600); LL.liveTat(st, 1700)
    expect(st.live!.nghi).toBe(false)
    LL.liveBat(st, 1800)
    expect(L.viewBang(st).live).toMatchObject({ bat: true, nghi: false, phien: 2 })
  })
  it('đang dừng: em lên bảng không phát được mic, mic đang phát bị thu; chờ tự tắt lâu gấp bốn (60 phút thay 15)', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300)
    L.goiLenBang(st, 'S1', [], 1400)
    expect(mic(st, 'S1', 1500)).toBe(true)
    LL.liveDat(st, { nghi: true }, 2000)
    expect(st.live!.mic).toBeNull()
    expect(LL.duocPhatMic(st, 'S1')).toBe(false)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emDuocMoi: false, emNoi: false })
    expect(LL.liveHetHan(st, 2000 + LL.TU_TAT_LIVE_MS + 1)).toBe(false)
    expect(LL.liveHetHan(st, 2000 + LL.TU_TAT_LIVE_MS * 4 + 1)).toBe(true)
    LL.liveDat(st, { nghi: false }, 3000)
    expect(LL.duocPhatMic(st, 'S1')).toBe(true)
    expect(LL.liveHetHan(st, 3000 + LL.TU_TAT_LIVE_MS + 1)).toBe(true)
  })
  it('AN TOÀN: view máy em lúc tạm dừng không chứa đáp án, không có khoá `dung` (tên trường tạm dừng là `nghi`)', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300); LL.liveDat(st, { nghi: true }, 1400)
    for (const s of ['S1', 'XA']) { const chu = JSON.stringify(L.viewEm(st, s)); expect(chu).not.toContain(DAP_AN); expect(chu).not.toContain('"dung"') }
  })
})

describe('K1 / K2 · luật phòng không đổi: gọi lên bảng khoá lượt, không gửi hộ đáp án', () => {
  it('thầy gọi lên bảng lúc em chưa gửi ⇒ cờ `bang` bật cho MỌI em (kể cả em chưa gửi); đáp án gửi sau đó bị từ chối `da-khoa`', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300)
    L.nhanTra(st, 'S1', 'A', 1400)
    expect(L.viewEm(st, 'S2').live).toMatchObject({ bat: true, bang: false }) // S2 chưa gửi, cờ chưa bật ⇒ máy S2 giữ màn làm bài
    L.goiLenBang(st, 'S1', [], 1500)
    for (const s of ['S1', 'S2', 'S3']) expect(L.viewEm(st, s).live).toMatchObject({ bat: true, bang: true })
    expect(L.nhanTra(st, 'S2', 'B', 1600)).toEqual({ ok: false, ly: 'da-khoa' })
    expect(st.luot!.tra.S2).toBeUndefined() // không ai gửi hộ
    expect(JSON.stringify(L.viewEm(st, 'S2'))).not.toContain(DAP_AN)
  })
})

describe('B2 · kiểu rời màn', () => {
  it('máy em báo kiểu ⇒ `viewBang.roiKieu`; em về ⇒ mất; kiểu lạ / máy bản cũ không báo ⇒ không có', () => {
    const st = phong(); luot(st, 1200)
    expect(LL.liveBat(st, 1300)).toBe(true)
    L.roiMan(st, 'S1', 1400, L.kieuRoiCua('chia'))
    L.roiMan(st, 'S2', 1410, L.kieuRoiCua('bịa-ra'))
    L.roiMan(st, 'S3', 1420, L.kieuRoiCua('an'))
    expect(L.viewBang(st).roiNay).toEqual(['S1', 'S2', 'S3'])
    expect(L.viewBang(st).roiKieu).toEqual({ S1: 'chia', S3: 'an' })
    L.veMan(st, 'S1', 1500)
    expect(L.viewBang(st).roiKieu).toEqual({ S3: 'an' })
    expect(JSON.stringify(L.viewEm(st, 'S2'))).not.toContain('roiKieu') // kiểu rời chỉ ra màn chiếu
    L.ketThuc(st, 1600)
    expect(L.viewBang(st).roiKieu).toEqual({})
  })
  it('phòng thật: em gửi `roi` kèm `k` ⇒ máy thầy thấy kiểu; `ve` ⇒ hết', async () => {
    datWebSocketPairGia()
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'chao' }); await ph.gui(e1, { t: 'chao' })
    await ph.gui(e1, { t: 'roi', k: 'noi' })
    expect(viewCuoi(gv)).toMatchObject({ roiNay: ['S1'], roiKieu: { S1: 'noi' } })
    await ph.gui(e1, { t: 've' })
    expect(viewCuoi(gv)).toMatchObject({ roiNay: [], roiKieu: {} })
  })
})

describe('ĐỢT 2 · giơ tay, mời nói, thu mic (thuần — giao diện chưa mở)', () => {
  it('cờ giao diện đợt 2 đang TẮT (phiên chính dời đợt 2 sang lượt sau)', () => { expect(LL.GIAO_DIEN_DOT_2).toBe(false) })
  it('giơ tay xếp hàng theo thứ tự; em thấy thứ tự của mình; hạ tay ⇒ hàng dồn lên; thầy hạ hết', () => {
    const st = phong()
    expect(LL.liveTay(st, 'S1', true, 1200)).toBe(false) // chưa live
    LL.liveBat(st, 1300)
    expect(LL.liveTay(st, 'S2', true, 1400)).toBe(true)
    expect(LL.liveTay(st, 'S1', true, 1500)).toBe(true)
    expect(LL.liveTay(st, 'S1', true, 1501)).toBe(false) // bấm lặp
    expect(LL.liveTay(st, 'LA', true, 1502)).toBe(false) // em lạ
    expect(LL.liveTay(st, 'XA', true, 1503)).toBe(false) // em ở xa khi thầy chưa bật «cho em ở xa»
    expect(L.viewBang(st).live!.tay.map((x) => x.sbd)).toEqual(['S2', 'S1'])
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emTay: true, hangTay: 2 })
    expect(L.viewEm(st, 'S3').live).toMatchObject({ emTay: false, hangTay: null })
    expect(LL.liveTay(st, 'S2', false, 1600)).toBe(true)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emTay: true, hangTay: 1 })
    LL.liveTay(st, 'S3', true, 1700)
    expect(LL.liveHaTay(st, 1800)).toBe(true)
    expect(L.viewBang(st).live!.tay).toEqual([])
    expect(LL.liveHaTay(st, 1801)).toBe(false)
  })
  it('mời nói: MỘT em mỗi lúc, em ra khỏi hàng, được phép bật mic (không tự bật); «Để sau» ⇒ thôi; máy không bật được mic ⇒ màn chiếu thấy `micLoi`', () => {
    const st = phong(); LL.liveBat(st, 1300)
    LL.liveTay(st, 'S1', true, 1400); LL.liveTay(st, 'S2', true, 1500)
    expect(LL.liveMoi(st, 'S1', 1600)).toBe(true)
    expect(L.viewBang(st).live).toMatchObject({ moi: { sbd: 'S1' }, tay: [{ sbd: 'S2' }] })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emMoi: true, emDuocMoi: true, emTay: false })
    expect(L.viewEm(st, 'S2').live).toMatchObject({ emMoi: false, emDuocMoi: false, hangTay: 1 })
    expect(LL.duocPhatMic(st, 'S2')).toBe(false)
    expect(LL.liveDeSau(st, 'S2', 1650)).toBe(false) // chỉ em được mời mới «Để sau» được
    expect(LL.liveDeSau(st, 'S1', 1700)).toBe(true)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emMoi: false, emDuocMoi: false })
    LL.liveMoi(st, 'S2', 1800)
    expect(LL.liveMicLoi(st, 'S2', 'tu-choi', 1900)).toBe(true)
    expect(L.viewBang(st).live).toMatchObject({ moi: null, micLoi: { sbd: 'S2', ly: 'tu-choi' } })
    expect(LL.liveMoi(st, 'LA', 2000)).toBe(false)
  })
  it('em được mời bật mic ⇒ cả lớp thấy `noi`; mời em khác ⇒ em trước bị thu (đóng track); «Thu mic» ⇒ hết lời mời, không phát lại được; em tự «Xong, tắt mic»', () => {
    const st = phong(); LL.liveBat(st, 1300)
    LL.liveMoi(st, 'S1', 1400)
    expect(mic(st, 'S2', 1450)).toBe(false) // em không được mời
    expect(mic(st, 'S1', 1500, '4')).toBe(true)
    expect(L.viewEm(st, 'S3').live!.noi.map((n) => n.sbd)).toEqual(['S1'])
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emNoi: true, emMoi: true })
    LL.liveMoi(st, 'S2', 1600)
    expect(st.live!.mic).toBeNull()
    expect(LL.rutMicDong(st)).toEqual([{ id: PHIEN_EM, mid: '4' }]) // phòng đóng track của S1 ở SFU, không chờ máy em
    expect(mic(st, 'S2', 1700, '5')).toBe(true)
    expect(LL.liveThu(st, 1800, 'S2')).toBe(true)
    expect(L.viewEm(st, 'S2').live).toMatchObject({ emNoi: false, emMoi: false, emDuocMoi: false })
    expect(mic(st, 'S2', 1900, '6')).toBe(false)
    LL.liveMoi(st, 'S3', 2000); mic(st, 'S3', 2100, '7')
    expect(LL.liveEmTatMic(st, 'S3', 2200)).toBe(true)
    expect(L.viewBang(st).live).toMatchObject({ moi: null, noi: [] })
    expect(LL.liveEmTatMic(st, 'S1', 2300)).toBe(false) // bạn khác không gỡ được gì
  })
  it('lời mời không gắn với lượt: sang lượt mới em được mời nói tiếp; gọi bạn lên bảng ⇒ thôi (bạn lên bảng tự bật mic); em lên bảng bị thầy thu mic ⇒ không tự bật lại tới khi gọi lại', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300)
    LL.liveMoi(st, 'S1', 1400); mic(st, 'S1', 1500)
    luot(st, 1600)
    expect(st.live!.mic?.sbd).toBe('S1')
    L.goiLenBang(st, 'S2', [], 1700)
    expect(st.live).toMatchObject({ mic: null, moi: null })
    expect(LL.duocPhatMic(st, 'S2')).toBe(true)
    mic(st, 'S2', 1800)
    expect(LL.liveThu(st, 1900)).toBe(true) // «Tắt mic tất cả»
    expect(LL.duocPhatMic(st, 'S2')).toBe(false)
    expect(L.viewEm(st, 'S2').live).toMatchObject({ emDuocMoi: false, emNoi: false })
    L.lamBang(st, 2000)
    expect(LL.duocPhatMic(st, 'S2')).toBe(true)
  })
  it('em rời màn ⇒ ra khỏi hàng tay, thôi lời mời, thu mic; em đang rời không giơ tay / không được mời', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300)
    LL.liveTay(st, 'S1', true, 1400); LL.liveMoi(st, 'S2', 1500); mic(st, 'S2', 1600)
    L.roiMan(st, 'S1', 1700); L.roiMan(st, 'S2', 1710)
    expect(st.live).toMatchObject({ tay: [], moi: null, mic: null })
    expect(LL.liveTay(st, 'S1', true, 1800)).toBe(false)
    expect(LL.liveMoi(st, 'S1', 1810)).toBe(false)
    L.veMan(st, 'S1', 1900)
    expect(LL.liveTay(st, 'S1', true, 1910)).toBe(true)
  })
  it('em ở xa (điểm quyết 4): mặc định TẮT; thầy bật ⇒ em thuộc lớp chưa điểm danh được xem (luôn thấy bảng), giơ tay, được mời; rời màn chỉ báo tên, không kJ; thầy tắt ⇒ ra hết', () => {
    const st = phong(); luot(st, 1200); LL.liveBat(st, 1300)
    expect(L.viewEm(st, 'XA').live).toMatchObject({ duocXem: false, bat: false, bang: false, xa: false })
    expect(LL.laEmXaDangLive(st, 'XA')).toBe(false)
    LL.liveDat(st, { xa: true }, 1400)
    expect(LL.laEmXaDangLive(st, 'XA')).toBe(true); expect(LL.laEmXaDangLive(st, 'S1')).toBe(false); expect(LL.laEmXaDangLive(st, 'LA')).toBe(false)
    expect(L.viewEm(st, 'XA').live).toMatchObject({ duocXem: true, bat: true, bang: true, xa: true, tieng: 'bat' })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ xa: false, bang: false, tieng: 'tat' }) // em trong lớp: mặc định tắt tiếng (điểm quyết 3)
    expect(LL.liveTay(st, 'XA', true, 1500)).toBe(true)
    expect(LL.liveMoi(st, 'XA', 1600)).toBe(true)
    expect(mic(st, 'XA', 1700)).toBe(true)
    expect(L.viewBang(st).live!.noi[0]).toMatchObject({ sbd: 'XA', xa: true }) // máy thầy chỉ tự phát ra loa khi em ở xa nói
    const kj = st.ds.find((e) => e.sbd === 'XA')!.kj, doi = [...st.doiThuong]
    expect(L.roiMan(st, 'XA', 1800, 'an')).toBe(true)
    expect(st.ds.find((e) => e.sbd === 'XA')).toMatchObject({ kj, vao: false })
    expect(st.doiThuong).toEqual(doi)
    expect(L.viewBang(st)).toMatchObject({ roiNay: ['XA'], roiKieu: { XA: 'an' } })
    expect(st.live!.mic).toBeNull()
    L.veMan(st, 'XA', 1900); LL.liveTay(st, 'XA', true, 2000)
    LL.liveDat(st, { xa: false }, 2100)
    expect(st.live!.tay).toEqual([])
    expect(L.viewEm(st, 'XA').live).toMatchObject({ duocXem: false, bat: false })
  })
  it('nhật ký: ai giơ tay, được mời, nói từ giờ nào tới giờ nào, vì sao thôi — rút ra MỘT lần', () => {
    const st = phong(); LL.liveBat(st, 1300)
    LL.liveTay(st, 'S1', true, 1400); LL.liveMoi(st, 'S1', 1500); mic(st, 'S1', 1600); LL.liveThu(st, 1900, 'S1')
    LL.liveTay(st, 'S2', true, 2000); LL.liveTay(st, 'S2', false, 2100)
    const nk = LL.rutNhatKy(st)
    expect(nk.map((m) => `${m.k}:${m.sbd}`)).toEqual(['tay:S1', 'moi:S1', 'noi:S1', 'thoi:S1', 'tay:S2', 'ha:S2'])
    expect(nk[3]).toEqual({ k: 'thoi', sbd: 'S1', luc: 1900, tu: 1600, vi: 'thay' })
    expect(LL.rutNhatKy(st)).toEqual([])
    expect(JSON.stringify(nk)).not.toContain(DAP_AN)
  })
  it('bố cục giấy đề: chỉ nhận SỐ, tối đa 24 khối; sai dạng ⇒ bỏ; máy em chỉ thấy khi đang live', () => {
    const st = phong(); LL.liveBat(st, 1300)
    const g = { k: '3', w: 1260, h: 980, la: false, o: [[2, 0, 30, 90, 1180, 96, 280, 448, 4, 512, 52]] }
    expect(LL.chuanGiay({ ...g, o: [[2, 0, 'đáp án B']] })).toBeNull()
    expect(LL.chuanGiay({ ...g, o: Array.from({ length: 25 }, () => g.o[0]) })).toBeNull()
    expect(LL.chuanGiay({ ...g, chu: 'thừa' })).toEqual(g) // trường lạ bị bỏ — không có chỗ cho chữ
    expect(LL.liveDat(st, { giay: g }, 1400)).toBe(true)
    expect(LL.liveDat(st, { giay: g }, 1401)).toBe(false)
    expect(L.viewEm(st, 'S1').live!.giay).toEqual(g)
    LL.liveTat(st, 1500)
    expect(L.viewEm(st, 'S1').live!.giay).toBeNull()
  })
})

describe('ĐỢT 2 · phòng thật (Durable Object trên kho giả)', () => {
  beforeAll(datWebSocketPairGia)
  it('em giơ tay ⇒ thầy thấy hàng; thầy mời ⇒ máy em thấy `emMoi`; em chỉ đụng được tay / lời mời của CHÍNH mình; nhật ký nằm trong kho của phòng, KHÔNG gọi D1', async () => {
    let soD1 = 0
    const ph = taoPhongGia(null, { DB: { prepare: () => { soD1 += 1; throw new Error('đường live không được gọi D1') }, batch: () => { soD1 += 1; throw new Error('không D1') } } })
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'XA', coMat: false }], { cho: true, sfu: true })
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    for (const w of [gv, e1, e2]) await ph.gui(w, { t: 'chao' })
    await ph.gui(gv, { t: 'live-san', ss: SS }); await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(e1, { t: 'live-tay', v: true }); await ph.gui(e2, { t: 'live-tay' })
    expect(viewCuoi(gv).live.tay.map((x: { sbd: string }) => x.sbd)).toEqual(['S1', 'S2'])
    expect(viewCuoi(e2).live).toMatchObject({ emTay: true, hangTay: 2 })
    // em không mời được ai, không hạ được tay người khác, không thu được mic
    for (const t of ['live-moi', 'live-ha-tay', 'live-thu-mic']) await ph.gui(e2, { t, sbd: 'S1' })
    expect(viewCuoi(gv).live).toMatchObject({ moi: null })
    expect(viewCuoi(gv).live.tay.length).toBe(2)
    await ph.gui(gv, { t: 'live-moi', sbd: 'S1' })
    expect(viewCuoi(e1).live).toMatchObject({ emMoi: true, emDuocMoi: true, emTay: false })
    expect(viewCuoi(e2).live).toMatchObject({ emMoi: false, hangTay: 1 })
    await ph.gui(e2, { t: 'live-de-sau' }) // không phải em được mời ⇒ không tác dụng
    expect(viewCuoi(gv).live.moi).toMatchObject({ sbd: 'S1' })
    await ph.gui(e1, { t: 'live-mic-loi', ly: 'tu-choi' })
    expect(viewCuoi(gv).live).toMatchObject({ moi: null, micLoi: { sbd: 'S1', ly: 'tu-choi' } })
    await ph.gui(gv, { t: 'live-ha-tay' })
    expect(viewCuoi(gv).live.tay).toEqual([])
    await ph.choNen()
    const nk = (await ph.post('/live-nk', {})).nk as { k: string; sbd: string }[]
    expect(nk.map((m) => `${m.k}:${m.sbd}`)).toEqual(['tay:S1', 'tay:S2', 'moi:S1', 'mic-loi:S1', 'ha-het:S2'])
    expect(soD1).toBe(0)
    expect([...ph.kho.du.keys()].filter((k) => k.startsWith('nk:')).length).toBeGreaterThanOrEqual(4)
  })
  it('K3 phòng thật: chỉ THẦY tạm dừng / tiếp tục được; máy em nhận `nghi` ngay trong view kế', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'chao' }); await ph.gui(e1, { t: 'chao' })
    await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(e1, { t: 'live-dat', nghi: true }) // em gửi lệnh của thầy ⇒ bỏ
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, nghi: false })
    await ph.gui(gv, { t: 'live-dat', nghi: true })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, nghi: true })
    expect(viewCuoi(gv).live).toMatchObject({ bat: true, nghi: true })
    await ph.gui(gv, { t: 'live-dat', nghi: false })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, nghi: false })
    await ph.gui(gv, { t: 'live-tat' })
    expect(viewCuoi(e1).live).toMatchObject({ bat: false, nghi: false })
  })
  it('vé «em ở xa»: không tính điểm danh (`vao` bị bỏ), không gửi được đáp án, không đoán / tiếp sức; vẫn bị bắt rời màn lúc live; phòng trả lời `/live-xa` đúng lúc', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'XA', coMat: false }])
    const gv = await ph.noi('gv'), xa = await ph.noi('hs', 'XA', true)
    await ph.gui(gv, { t: 'chao' })
    expect((await ph.post('/live-xa', { sbd: 'XA' })).ok).toBe(false) // chưa live, chưa bật công tắc
    await ph.gui(gv, { t: 'live-bat' }); await ph.gui(gv, { t: 'live-dat', xa: true })
    expect((await ph.post('/live-xa', { sbd: 'XA' })).ok).toBe(true)
    expect((await ph.post('/live-xa', { sbd: 'S1' })).ok).toBe(false) // em đã điểm danh không cần vé «ở xa»
    expect((await ph.post('/live-xa', { sbd: 'LA' })).ok).toBe(false)
    await ph.post('/luot', { qid: 'q1', phan: 'I', tuLuan: false, cau: { text: 'Đề' }, dung: 'A', hanGiay: 0 })
    await ph.gui(xa, { t: 'vao' }); await ph.gui(xa, { t: 'chao' }); await ph.gui(xa, { t: 'tra', chon: 'A' }); await ph.gui(xa, { t: 'doan', v: 1 }); await ph.gui(xa, { t: 'tiep' })
    const ds = viewCuoi(gv).ds as { sbd: string; vao: boolean; kj: number }[]
    expect(ds.find((e) => e.sbd === 'XA')).toMatchObject({ vao: false, kj: 0 })
    expect(viewCuoi(gv).luot.daGui).toEqual([])
    expect(viewCuoi(xa).live).toMatchObject({ duocXem: true, bat: true, bang: true, xa: true })
    await ph.gui(xa, { t: 'roi', k: 'an' })
    expect(viewCuoi(gv)).toMatchObject({ roiNay: ['XA'], roiKieu: { XA: 'an' } })
  })
})
