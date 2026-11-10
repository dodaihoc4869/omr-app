// @vitest-environment node
// LIVE BẢNG — BẤT BIẾN AN TOÀN ĐÁP ÁN (đặc tả mục 4.3, 5; CLAUDE.md «đáp án không xuống máy học sinh trước khi nộp»).
// Khoá: (1) `viewEm` có khối `live` vẫn KHÔNG mang `dung` / `giai` / `qid` trước pha `mo`; (2) khối `live` không có trường nào về đáp án;
// (3) suốt một buổi live đầy đủ (bật, viết, số đo, rời màn, gọi em, tắt) MỌI tin tới máy em — chữ lẫn nhị phân — không chứa đáp án / lời giải trước khi thầy mở;
// (4) em không mở được đáp án bằng lệnh live; (5) em không phát được track lên SFU (cửa `/bpu/live/phat`).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'
import { bpuLive } from '../server/src/live-sfu'
import { kyVeBpu } from '../server/src/phong-binh-phan-ung'
import { maNetXong } from '../src/lib/live/ma-net'
import { datWebSocketPairGia, taoPhongGia, viewCuoi, type WsGia } from './_live-phong-gia'

const DAP_AN = 'ĐÁP-ÁN-BÍ-MẬT-XYZ', LOI_GIAI = 'LỜI-GIẢI-BÍ-MẬT-QWE', QID = 'qid-bi-mat-123'
const KHOA_LIVE = ['duocXem', 'san', 'bat', 'tu', 'phien', 'ss', 'tieng', 'soNet', 'emTay', 'hangTay', 'emDuocMoi', 'emNoi', 'noi'].sort()
/** Mọi byte một máy em đã nhận, đọc như chữ (khung nhị phân giải UTF-8 lỏng) ⇒ soát chuỗi cấm. */
const moiChu = (ws: WsGia): string => ws.tin.map((t) => (typeof t === 'string' ? t : new TextDecoder('utf-8', { fatal: false }).decode(t))).join('\n')
const khongLo = (ws: WsGia) => { const s = moiChu(ws); expect(s).not.toContain(DAP_AN); expect(s).not.toContain(LOI_GIAI); expect(s).not.toContain(QID); expect(s).not.toContain('"dung"'); expect(s).not.toContain('"giai"') }

describe('live không làm lộ đáp án', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('luật thuần: `viewEm` đang live, lượt chưa mở ⇒ không `dung`, không `giai`, không `qid`; khối live chỉ có đúng các trường đã khai', () => {
    const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: [{ sbd: 'S1', ten: 'A', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'B', coMat: true, luc: 2 }] })
    LL.datCoLive(st, { cho: true, sfu: true }, 1000)
    LL.liveSan(st, { ss: { id: 'a1b2c3d4e5f60718', tieng: 'thay', kenh: 'net' } }, 1100)
    LL.liveBat(st, 1200)
    L.moLuot(st, { qid: QID, phan: 'I', tuLuan: false, cau: { text: 'Đề', choices: ['a', 'b'] }, dung: DAP_AN, hanGiay: null, giai: { solution: LOI_GIAI, anh: [] } }, 1300)
    L.nhanTra(st, 'S1', 'A', 1400)
    for (const pha of ['tra-loi', 'goi', 'lam-bang'] as const) {
      if (pha === 'goi') L.goiLenBang(st, 'S2', ['lý do'], 1500)
      if (pha === 'lam-bang') { L.lamBang(st, 1600); L.chamLenBang(st, true, 1700) }
      for (const s of ['S1', 'S2', 'LA']) {
        const v = L.viewEm(st, s), chuoi = JSON.stringify(v)
        expect(v.luot).not.toHaveProperty('dung'); expect(v.luot).not.toHaveProperty('giai'); expect(v.luot).not.toHaveProperty('qid')
        expect(chuoi).not.toContain(DAP_AN); expect(chuoi).not.toContain(LOI_GIAI); expect(chuoi).not.toContain(QID)
        expect(Object.keys(v.live!).sort()).toEqual(KHOA_LIVE)
      }
    }
    // Khối live của bảng cũng không mang đáp án (đáp án của bảng chỉ nằm ở `luot` sau khi mở, như cũ).
    expect(JSON.stringify(L.viewBang(st).live)).not.toContain(DAP_AN)
    L.moDapAn(st, 2000, () => false)
    expect(L.viewEm(st, 'S1').luot).toMatchObject({ dung: DAP_AN, qid: QID })
    expect(JSON.stringify(L.viewEm(st, 'S1').live)).not.toContain(DAP_AN)
  })
  it('phòng thật: cả buổi live trước khi mở đáp án, không tin nào tới máy em chứa đáp án / lời giải; lệnh live của em không mở được gì', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }], { cho: true, sfu: true })
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1'), e2 = await ph.noi('hs', 'S2')
    await ph.gui(gv, { t: 'chao' }); await ph.gui(e1, { t: 'chao', net: 0 }); await ph.gui(e2, { t: 'chao' })
    await ph.gui(gv, { t: 'live-san', ss: { id: 'a1b2c3d4e5f60718', tieng: 'thay', kenh: 'net' } })
    await ph.post('/luot', { qid: QID, phan: 'I', tuLuan: false, cau: { text: 'Đề bài', choices: ['a', 'b', 'c', 'd'] }, dung: DAP_AN, hanGiay: 0, giai: { solution: LOI_GIAI, anh: [{ src: LOI_GIAI, viTri: 'sau_loi_giai' }] } })
    await ph.gui(gv, { t: 'live-bat' })
    await ph.gui(e1, { t: 'live-ok', dc: false }); await ph.gui(e2, { t: 'live-ok', dc: true })
    await ph.gui(e1, { t: 'tra', chon: 'A' })
    // Em thử mọi lệnh của thầy + lệnh live lạ.
    for (const t of ['mo', 'live-bat', 'live-tat', 'live-san', 'live-dat', 'live-nhip', 'live-moi', 'live-thu', 'live-xyz']) await ph.gui(e2, { t, sbd: 'S2', xa: true, v: true })
    await ph.guiNp(gv, maNetXong({ id: 'n1', cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: [[0.1, 0.1, 0.5, 0], [0.2, 0.2, 0.5, 9]] })[0]!)
    await ph.guiNp(gv, new Uint8Array([0x21, 1, 0, 0, 0, 0, 0, 1, 2, 3]))
    await ph.gui(e1, { t: 'live-do', d: 40, j: 5, rtt: 20 }); await ph.gui(e1, { t: 'live-bu', net: 0 })
    await ph.gui(e2, { t: 'roi' }); await ph.gui(e2, { t: 've' })
    await ph.gui(gv, { t: 'goi', sbd: 'S1', lyDo: ['a'] }); await ph.gui(gv, { t: 'lam-bang' }); await ph.gui(gv, { t: 'dat', v: true })
    await ph.gui(gv, { t: 'live-dat', xa: true, tiengLop: true })
    await ph.gui(gv, { t: 'live-tat' }); await ph.gui(gv, { t: 'live-bat' })
    await vi.advanceTimersByTimeAsync(1500)
    expect(viewCuoi(e2).live).toMatchObject({ bat: true, phien: 2 })
    expect(viewCuoi(e2).luot.pha).toBe('lam-bang') // lệnh `mo` của em không có tác dụng
    khongLo(e1); khongLo(e2)
    // Bảng chiếu (máy thầy) trước khi mở cũng chưa có đáp án.
    expect(gv.tin.filter((t): t is string => typeof t === 'string').join('\n')).not.toContain(DAP_AN)
    // Thầy mở ⇒ lúc này máy em mới nhận đáp án + lời giải, qua `luot` như cũ (không qua khối live).
    await ph.gui(gv, { t: 'mo' })
    const v = viewCuoi(e1)
    expect(v.luot).toMatchObject({ dung: DAP_AN, qid: QID })
    expect(JSON.stringify(v.luot.giai)).toContain(LOI_GIAI)
    expect(JSON.stringify(v.live)).not.toContain(DAP_AN)
  })
  it('em không trong `noi` gọi `/bpu/live/phat` bị từ chối (Đợt 1: mọi em), không gọi ra SFU', async () => {
    const goi = vi.fn()
    vi.stubGlobal('fetch', goi)
    const env = { MA_BI_MAT: 'bm', PHONG_BPU: {}, REALTIME_APP_ID: 'app', REALTIME_APP_SECRET: 's' } as never
    const ve = await kyVeBpu('bm', { b: 'b1', s: 'S1', v: 'hs', h: Date.now() + 60_000 })
    expect(await bpuLive(env, '/bpu/live/phat', { ve, phien: 'a1b2c3d4e5f60718', sdp: 'v=0\r\no=- 1 2 IN IP4 0.0.0.0\r\n', tracks: [{ mid: '0', ten: 'em' }] })).toEqual({ ok: false, lyDo: 'chua-duoc-moi' })
    expect(goi).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
