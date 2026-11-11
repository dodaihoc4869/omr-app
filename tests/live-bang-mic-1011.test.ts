// @vitest-environment node
// LIVE BẢNG 1C (thầy 10/11): «Khi bấm nút live, khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như bình thường, khi bấm gọi lên bảng …
// lập tức màn hình hs chuyển sang chế độ live để xem thầy và bạn được gọi lên bảng chữa bài, tự động bật mic cho bạn lên bảng». Đặc tả mục 4.3c.
// Khoá: (1) cờ `live.bang` theo lượt; (2) chuyển câu KHÔNG tắt live, không đổi phiên; (3) quyền phát mic: chỉ em đang được gọi, một em mỗi lúc, hết lượt thu lại;
// (4) cửa `/bpu/live/phat` cho em hỏi PHÒNG thật, em khác bị từ chối không chạm SFU, thu mic thì máy chủ đóng track ở SFU; (5) view không lộ đáp án.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'
import { bpuLive } from '../server/src/live-sfu'
import { kyVeBpu } from '../server/src/phong-binh-phan-ung'
import type { Env } from '../server/src/kieu'
import { maBangMoi } from '../src/lib/live/ma-net'
import { datWebSocketPairGia, taoPhongGia, viewCuoi } from './_live-phong-gia'

const SS = { id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', tieng: 'thay', kenh: 'net' }
const PHIEN_EM = 'e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1', DAP_AN = 'ĐÁP-ÁN-BÍ-MẬT-XYZ'
const SDP = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n'
function phong() {
  const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: 2 }, { sbd: 'XA', ten: 'Em Ở Xa', coMat: false }] })
  LL.datCoLive(st, { cho: true, sfu: true }, 1000)
  LL.liveSan(st, { ss: SS }, 1100)
  return st
}
const luot = (st: L.TrangThaiPhong, nay: number) => L.moLuot(st, { qid: 'q', phan: 'I', tuLuan: false, cau: { text: 'Đề' }, dung: DAP_AN, hanGiay: null }, nay)
const mic = (st: L.TrangThaiPhong, sbd: string, nay: number, mid = '3') => LL.liveMicBat(st, { sbd, id: PHIEN_EM, tieng: 'mic', mid }, nay)

describe('cờ `live.bang` theo lượt (thuần)', () => {
  it('bật live ⇒ chỉ có tiếng (bang tắt); gọi em lên bảng ⇒ bang BẬT ngay; chấm + mở đáp án ⇒ GIỮ; lượt mới ⇒ TẮT mà live vẫn chạy, phiên không đổi', () => {
    const st = phong()
    luot(st, 1200)
    expect(LL.liveBat(st, 1300)).toBe(true)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, bang: false })
    expect(L.viewBang(st).live).toMatchObject({ bat: true, bang: false })
    L.nhanTra(st, 'S1', 'A', 1400)
    expect(st.live!.bang).toBe(false) // em gửi đáp án không bật bảng
    expect(L.goiLenBang(st, 'S2', ['lý do'], 1500)).toBe(true)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, bang: true })
    L.lamBang(st, 1600)
    L.chamLenBang(st, true, 1700)
    expect(st.live!.bang).toBe(true)
    L.moDapAn(st, 1800, () => false)
    expect(st.live!.bang).toBe(true) // thầy còn chữa tiếp trên bảng
    const phien = st.live!.phien
    luot(st, 1900)
    expect(st.live).toMatchObject({ bat: true, bang: false, phien, ss: SS, tu: 1300 })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, bang: false, phien, ss: SS })
    // Bỏ lượt dở (thầy chọn câu khác) cũng đưa máy em về màn câu hỏi, không tắt live.
    L.goiLenBang(st, 'S1', [], 2000)
    expect(st.live!.bang).toBe(true)
    L.boLuot(st, 2100)
    expect(st.live).toMatchObject({ bat: true, bang: false, phien })
  })
  it('thầy bật / tắt TAY bằng `live-dat { bang }` (chỉ khi đang live); bật live lúc đang có em được gọi ⇒ bang bật sẵn; tắt live ⇒ bang tắt; chưa live gọi lên bảng không bật', () => {
    const st = phong()
    luot(st, 1200)
    expect(LL.liveDat(st, { bang: true }, 1250)).toBe(false) // chưa live
    L.goiLenBang(st, 'S1', [], 1260)
    expect(st.live!.bang).toBeFalsy()
    LL.liveBat(st, 1300)
    expect(st.live!.bang).toBe(true)
    expect(LL.liveDat(st, { bang: false }, 1400)).toBe(true)
    expect(L.viewEm(st, 'S2').live!.bang).toBe(false)
    expect(LL.liveDat(st, { bang: false }, 1401)).toBe(false)
    expect(LL.liveDat(st, { bang: true }, 1500)).toBe(true)
    LL.liveTat(st, 1600)
    expect(st.live).toMatchObject({ bat: false, bang: false })
    expect(L.viewEm(st, 'S2').live!.bang).toBe(false)
    // Em không được xem (chưa điểm danh, thầy chưa cho em ở xa) không bao giờ thấy bang.
    LL.liveBat(st, 1700); LL.liveDat(st, { bang: true }, 1800)
    expect(L.viewEm(st, 'XA').live).toMatchObject({ duocXem: false, bat: false, bang: false })
  })
})

describe('quyền phát mic của em được gọi lên bảng (thuần)', () => {
  it('chỉ em ĐANG được gọi, lúc đang live, thầy chưa chấm, lượt chưa mở, không đang rời màn; em khác / em lạ bị từ chối', () => {
    const st = phong()
    luot(st, 1200)
    L.goiLenBang(st, 'S2', [], 1250)
    expect(LL.duocPhatMic(st, 'S2')).toBe(false) // chưa live
    LL.liveBat(st, 1300)
    expect(LL.duocPhatMic(st, 'S2')).toBe(true)
    expect(LL.duocPhatMic(st, 'S1')).toBe(false)
    expect(LL.duocPhatMic(st, 'LA')).toBe(false)
    expect(LL.duocPhatMic(st, '')).toBe(false)
    expect(L.viewEm(st, 'S2').live).toMatchObject({ emDuocMoi: true, emNoi: false, noi: [] })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emDuocMoi: false, emNoi: false })
    expect(mic(st, 'S1', 1400)).toBe(false)
    expect(LL.liveMicBat(st, { sbd: 'S2', id: '../x', tieng: 'mic', mid: '3' }, 1400)).toBe(false) // phiên sai dạng
    expect(mic(st, 'S2', 1400)).toBe(true)
    const noi = [{ sbd: 'S2', ten: 'Trần Gia Bảo', doi: st.ds.find((e) => e.sbd === 'S2')!.doi, xa: false, ss: { id: PHIEN_EM, tieng: 'mic' } }]
    expect(L.viewEm(st, 'S2').live).toMatchObject({ emDuocMoi: true, emNoi: true, noi })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ emNoi: false, noi })
    expect(L.viewBang(st).live!.noi).toEqual(noi)
    // SFU chưa có khoá ⇒ không ai được phát mic.
    const st2 = phong(); LL.datCoLive(st2, { cho: true, sfu: false }, 1150); luot(st2, 1200); LL.liveBat(st2, 1300); L.goiLenBang(st2, 'S1', [], 1400)
    expect(LL.duocPhatMic(st2, 'S1')).toBe(false)
    expect(st2.live!.bang).toBe(true) // bảng live (hình) vẫn bật
  })
  const sauKhi: [string, (st: L.TrangThaiPhong) => void, boolean][] = [
    ['thầy chấm Đạt', (st) => { L.chamLenBang(st, true, 2000) }, true],
    ['thầy chấm Chưa đạt', (st) => { L.chamLenBang(st, false, 2000) }, true],
    ['mở đáp án', (st) => { L.moDapAn(st, 2000, () => false) }, true],
    ['mở lượt mới', (st) => { luot(st, 2000) }, false],
    ['bỏ lượt dở', (st) => { L.boLuot(st, 2000) }, false],
    ['gọi em KHÁC lên bảng', (st) => { L.goiLenBang(st, 'S1', [], 2000) }, true],
    ['thầy tắt live', (st) => { LL.liveTat(st, 2000) }, false],
    ['thầy bấm «Thu mic»', (st) => { LL.liveThuMic(st, 2000) }, true],
    ['em rời màn', (st) => { L.roiMan(st, 'S2', 2000) }, true],
    ['hết buổi', (st) => { L.ketThuc(st, 2000) }, false],
    ['công tắc live bị tắt', (st) => { LL.datCoLive(st, { cho: false, sfu: true }, 2000) }, false],
  ]
  it.each(sauKhi)('tự THU mic khi %s (bảng live giữ hay tắt đúng luật); track vào hàng chờ đóng ở SFU', (_ten, lam, bangCon) => {
    const st = phong()
    luot(st, 1200); LL.liveBat(st, 1300); L.goiLenBang(st, 'S2', [], 1400)
    expect(mic(st, 'S2', 1500, '7')).toBe(true)
    lam(st)
    expect(st.live!.mic).toBeNull()
    expect(st.live!.noi).toEqual([])
    expect(!!st.live!.bang).toBe(bangCon)
    expect(LL.rutMicDong(st)).toEqual([{ id: PHIEN_EM, mid: '7' }])
    expect(LL.rutMicDong(st)).toEqual([])
    expect(L.viewBang(st).live?.noi ?? []).toEqual([])
  })
  it('một em mỗi lúc: em KHÁC rời màn không thu mic của em đang nói; em đã bị chấm không mở lại được; em ở xa được gọi ⇒ `xa: true`', () => {
    const st = phong()
    luot(st, 1200); LL.liveBat(st, 1300); L.goiLenBang(st, 'S2', [], 1400); mic(st, 'S2', 1500)
    L.roiMan(st, 'S1', 1600)
    expect(st.live!.mic?.sbd).toBe('S2')
    expect(LL.liveThuMic(st, 1700, 'S1')).toBe(false) // em khác không gỡ được mic của bạn
    L.chamLenBang(st, false, 1800)
    expect(LL.duocPhatMic(st, 'S2')).toBe(false)
    expect(mic(st, 'S2', 1900)).toBe(false)
    luot(st, 2000); LL.liveDat(st, { xa: true }, 2100); L.goiLenBang(st, 'XA', [], 2200)
    expect(mic(st, 'XA', 2300)).toBe(true)
    expect(L.viewBang(st).live!.noi[0]).toMatchObject({ sbd: 'XA', xa: true })
    // Em ở xa đang nói mà rời màn ⇒ cũng thu.
    L.roiMan(st, 'XA', 2400)
    expect(st.live!.mic).toBeNull()
  })
  it('AN TOÀN: view của em khi bảng live bật + có bạn đang phát mic vẫn không có đáp án trước khi mở', () => {
    const st = phong()
    luot(st, 1200); LL.liveBat(st, 1300); L.nhanTra(st, 'S1', 'A', 1350); L.goiLenBang(st, 'S2', ['x'], 1400); mic(st, 'S2', 1500)
    for (const s of ['S1', 'S2', 'XA', 'LA']) {
      const chu = JSON.stringify(L.viewEm(st, s))
      expect(chu).not.toContain(DAP_AN); expect(chu).not.toContain('"dung"'); expect(chu).not.toContain('"giai"')
    }
    expect(JSON.stringify(L.viewBang(st).live)).not.toContain(DAP_AN)
  })
})

describe('phòng thật + cửa `/bpu/live/phat` cho em', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  /** Phòng thật có khoá SFU + Worker env trỏ vào chính phòng đó + SFU giả ghi lại mọi lệnh. */
  async function dung() {
    const ph = taoPhongGia(null, { REALTIME_APP_ID: 'app', REALTIME_APP_SECRET: 'bi-mat' })
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }], { cho: true, sfu: true })
    const sfu: { duong: string; method: string; than: Record<string, any> | null }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, o?: RequestInit) => {
      const duong = String(url).split('/sessions/')[1] ?? String(url)
      sfu.push({ duong, method: o?.method ?? 'GET', than: o?.body ? JSON.parse(String(o.body)) : null })
      if (duong.endsWith('/tracks/new')) return new Response(JSON.stringify({ requiresImmediateRenegotiation: true, sessionDescription: { type: duong.includes(PHIEN_EM) && sfu[sfu.length - 1]!.than?.sessionDescription ? 'answer' : 'offer', sdp: SDP + 'a=sfu\r\n' }, tracks: [{ mid: '5', trackName: 'mic' }] }))
      return new Response(JSON.stringify({ tracks: [] }))
    }))
    const env = { MA_BI_MAT: 'x', REALTIME_APP_ID: 'app', REALTIME_APP_SECRET: 'bi-mat', PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: (r: Request) => ph.p.fetch(r) }) } } as unknown as Env
    const ve = (s: string) => kyVeBpu('x', { b: 'b1', s, v: 'hs', h: Date.now() + 60_000 })
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'live-san', ss: SS }); await ph.gui(gv, { t: 'live-bat' })
    await ph.post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: { text: 'Đề' }, dung: DAP_AN, hanGiay: 0 })
    const phat = async (sbd: string, mid = '5') => bpuLive(env, '/bpu/live/phat', { ve: await ve(sbd), phien: PHIEN_EM, sdp: SDP, tracks: [{ mid, ten: 'ten-em-tu-dat' }] })
    return { ph, sfu, env, ve, gv, e1, e2, phat }
  }

  it('chuyển câu lúc đang live: live KHÔNG tắt, phiên + phiên SFU không đổi (không rớt tiếng), máy em về màn câu hỏi; gọi lên bảng ⇒ bảng live bật trên mọi máy', async () => {
    const { ph, gv, e1, e2 } = await dung()
    const truoc = viewCuoi(e1).live
    expect(truoc).toMatchObject({ bat: true, bang: false, phien: 1, ss: SS })
    await ph.gui(gv, { t: 'goi', sbd: 'S2', lyDo: ['a'] })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, bang: true })
    expect(viewCuoi(e2).live).toMatchObject({ bang: true, emDuocMoi: true })
    expect(viewCuoi(gv).live).toMatchObject({ bang: true })
    await ph.gui(gv, { t: 'dat', v: true }); await ph.gui(gv, { t: 'mo' })
    expect(viewCuoi(e1).live.bang).toBe(true)
    await ph.guiNp(gv, maBangMoi('2', 1.75)) // bút sang trang «2» (bảng mới)
    await ph.post('/luot', { qid: 'q2', phan: 'I', tuLuan: false, cau: { text: 'Đề 2' }, dung: 'B', hanGiay: 0 })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, bang: false, phien: truoc.phien, ss: SS, tu: truoc.tu, soNet: 1 })
    expect(viewCuoi(e1).luot.cau.text).toBe('Đề 2')
    // Thầy bật tay bảng live để giảng mà không gọi ai; em gửi lệnh này không có tác dụng.
    await ph.gui(e1, { t: 'live-dat', bang: true })
    expect(viewCuoi(e2).live.bang).toBe(false)
    await ph.gui(gv, { t: 'live-dat', bang: true })
    expect(viewCuoi(e2).live.bang).toBe(true)
  })
  it('em được gọi phát mic: Worker hỏi phòng ⇒ SFU nhận track tên do MÁY CHỦ đặt ⇒ phòng ghi + phát cho mọi máy; em khác bị từ chối, KHÔNG chạm SFU', async () => {
    const { ph, sfu, gv, e1, e2, phat } = await dung()
    expect(await phat('S2')).toEqual({ ok: false, lyDo: 'chua-duoc-moi' }) // chưa ai được gọi
    await ph.gui(gv, { t: 'goi', sbd: 'S2', lyDo: [] })
    expect(await phat('S1')).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    expect(sfu.length).toBe(0)
    const r = await phat('S2')
    expect(r).toMatchObject({ ok: true, loai: 'answer', ten: 'mic' })
    expect(sfu).toEqual([{ duong: `${PHIEN_EM}/tracks/new`, method: 'POST', than: { sessionDescription: { type: 'offer', sdp: SDP }, tracks: [{ location: 'local', mid: '5', trackName: 'mic' }] } }])
    const noi = [{ sbd: 'S2', ten: 'Em S2', doi: viewCuoi(e2).em.doi, xa: false, ss: { id: PHIEN_EM, tieng: 'mic' } }]
    expect(viewCuoi(e1).live).toMatchObject({ emNoi: false, emDuocMoi: false, noi })
    expect(viewCuoi(e2).live).toMatchObject({ emNoi: true, emDuocMoi: true, noi })
    expect(viewCuoi(gv).live.noi).toEqual(noi)
    for (const w of [e1, e2]) expect(w.tin.filter((t): t is string => typeof t === 'string').join('\n')).not.toContain(DAP_AN)
    // Máy khác kéo track của em về nghe: lệnh `nhan` trên phiên đã có.
    const nghe = await bpuLive((await dung()).env, '/bpu/live/nhan', { ve: await kyVeBpu('x', { b: 'b1', s: 'S1', v: 'hs', h: Date.now() + 60_000 }), phien: 'f'.repeat(32), nguon: PHIEN_EM, ten: ['mic'] })
    expect(nghe).toMatchObject({ ok: true, loai: 'offer', canDap: true })
  })
  it('hết lượt THU lại: thầy chấm ⇒ phòng gỡ + ĐÓNG track ở SFU (force), em không phát lại được; «Thu mic», em tự tắt, em mất kết nối cũng vậy', async () => {
    const { ph, sfu, gv, e1, e2, phat } = await dung()
    const dong = () => sfu.filter((x) => x.duong.endsWith('/tracks/close'))
    await ph.gui(gv, { t: 'goi', sbd: 'S2', lyDo: [] })
    await phat('S2', '5')
    await ph.gui(gv, { t: 'dat', v: true }); await ph.choNen()
    expect(viewCuoi(e1).live.noi).toEqual([])
    expect(viewCuoi(e2).live).toMatchObject({ emNoi: false, emDuocMoi: false, bang: true })
    expect(dong()).toEqual([{ duong: `${PHIEN_EM}/tracks/close`, method: 'PUT', than: { tracks: [{ mid: '5' }], force: true } }])
    expect(await phat('S2')).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    // Lượt mới, gọi S1; thầy bấm «Thu mic».
    await ph.post('/luot', { qid: 'q2', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
    await ph.gui(gv, { t: 'goi', sbd: 'S1', lyDo: [] })
    expect((await phat('S1', '6')).ok).toBe(true)
    await ph.gui(e2, { t: 'live-mic-tat' }); await ph.gui(e2, { t: 'live-thu-mic' }) // bạn khác không gỡ được
    expect(viewCuoi(gv).live.noi.length).toBe(1)
    await ph.gui(gv, { t: 'live-thu-mic' }); await ph.choNen()
    expect(viewCuoi(gv).live.noi).toEqual([])
    expect(dong().length).toBe(2)
    // Đợt 2 (11/11): thầy đã «Thu mic» ⇒ em lên bảng KHÔNG tự bật lại được trong lượt gọi này; thầy cho làm bảng (`lam-bang`) ⇒ bật lại được; rồi tự tắt.
    expect(await phat('S1', '7')).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    await ph.gui(gv, { t: 'lam-bang' })
    expect((await phat('S1', '7')).ok).toBe(true)
    await ph.gui(e1, { t: 'live-mic-tat' }); await ph.choNen()
    expect(viewCuoi(gv).live.noi).toEqual([])
    expect(dong().length).toBe(3)
    // Bật lại, rồi em mất kết nối ⇒ thu.
    expect((await phat('S1', '8')).ok).toBe(true)
    await ph.dong(e1); await ph.choNen()
    expect(viewCuoi(gv).live.noi).toEqual([])
    expect(dong().pop()!.than).toEqual({ tracks: [{ mid: '8' }], force: true })
  })
  it('phòng từ chối SAU khi SFU đã nhận track (thầy vừa chấm giữa chừng) ⇒ Worker đóng track ngay, vẫn trả câu trả lời SDP để máy em về trạng thái ổn định', async () => {
    const { ph, sfu, gv, env, ve } = await dung()
    await ph.gui(gv, { t: 'goi', sbd: 'S2', lyDo: [] })
    // SFU giả: ngay lúc nhận track thì thầy chấm.
    const cu = globalThis.fetch
    vi.stubGlobal('fetch', vi.fn(async (url: string, o?: RequestInit) => { if (String(url).endsWith('/tracks/new')) await ph.gui(gv, { t: 'dat', v: false }); return cu(url, o) }))
    const r = await bpuLive(env, '/bpu/live/phat', { ve: await ve('S2'), phien: PHIEN_EM, sdp: SDP, tracks: [{ mid: '5' }] })
    expect(r).toMatchObject({ ok: false, lyDo: 'chua-duoc-moi', loai: 'answer' })
    expect(typeof r.sdp).toBe('string')
    expect(sfu.map((x) => x.duong.split('/').slice(1).join('/'))).toEqual(['tracks/new', 'tracks/close'])
    expect(viewCuoi(gv).live.noi).toEqual([])
  })
})
