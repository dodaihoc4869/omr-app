// @vitest-environment node
// LIVE BẢNG — luật phòng (src/lib/bpu/phong-live.ts) + phòng thật (Durable Object, ctx giả). Đặc tả docs/dac-ta-live-bang-1011.md mục 4.3, 5, điểm quyết 2–4.
// Khoá: bật / tắt, chỉ MỘT `live-bat`, sẵn sàng + phiên SFU, công tắc buổi, hết buổi tự tắt, quá 15 phút tự tắt, phòng lưu bản cũ không có `live`,
// công tắc `cau_hinh.live_bang`, ai được xem, tiếng theo điểm quyết 3, số em đang xem, view đầy đủ CHỈ phát khi trạng thái đổi.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import * as L from '../src/lib/bpu/phong'
import * as LL from '../src/lib/bpu/phong-live'
import { gvBpuMo, liveBangBat } from '../server/src/phong-binh-phan-ung'
import type { Env } from '../server/src/kieu'
import { chu, datWebSocketPairGia, taoPhongGia, viewCuoi } from './_live-phong-gia'

const SS = { id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', tieng: 'thay', kenh: 'net' }
const phong = (o: { cho?: boolean; sfu?: boolean } = {}) => {
  const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1000, ds: [{ sbd: 'S1', ten: 'A', coMat: true, luc: 1 }, { sbd: 'S2', ten: 'B', coMat: true, luc: 2 }, { sbd: 'S3', ten: 'C', coMat: false }] })
  LL.datCoLive(st, { cho: o.cho ?? true, sfu: o.sfu ?? true }, 1000)
  return st
}

describe('luật phòng live (thuần)', () => {
  it('phòng lưu bản cũ không có `live` ⇒ view không có khối live, mọi lệnh live bị bỏ', () => {
    const st = L.taoPhong({ buoiId: 'b', lop: 'L', nay: 1, ds: [{ sbd: 'S1', ten: 'A', coMat: true }] })
    expect(st.live).toBeUndefined()
    expect(L.viewBang(st).live).toBeNull()
    expect(L.viewEm(st, 'S1').live).toBeNull()
    expect(LL.liveBat(st, 2)).toBe(false)
    expect(LL.liveSan(st, { ss: SS }, 2)).toBe(false)
    expect(LL.duocXemLive(st, 'S1')).toBe(false)
  })
  it('công tắc `cau_hinh.live_bang`: vắng dòng / hỏng ⇒ BẬT; {"bat":false} ⇒ tắt; tắt công tắc khi đang live ⇒ tắt live, view về null', () => {
    expect(liveBangBat(null)).toBe(true)
    expect(liveBangBat('')).toBe(true)
    expect(liveBangBat('{hỏng')).toBe(true)
    expect(liveBangBat('{"bat":true}')).toBe(true)
    expect(liveBangBat('{"bat":false}')).toBe(false)
    const st = phong()
    expect(LL.liveBat(st, 2000)).toBe(true)
    LL.datCoLive(st, { cho: false, sfu: true }, 3000)
    expect(st.live!.bat).toBe(false)
    expect(L.viewBang(st).live).toBeNull()
    expect(L.viewEm(st, 'S1').live).toBeNull()
    expect(LL.liveBat(st, 4000)).toBe(false)
  })
  it('bật / tắt: chỉ MỘT `live-bat` khi chưa live; mỗi lần bật `phien` + 1; tắt giữ sẵn sàng + phiên SFU', () => {
    const st = phong()
    expect(LL.liveSan(st, { ss: SS }, 1500)).toBe(true)
    expect(LL.liveSan(st, { ss: SS }, 1600)).toBe(false) // không đổi ⇒ không phát lại
    expect(LL.liveBat(st, 2000)).toBe(true)
    expect(LL.liveBat(st, 2001)).toBe(false) // bấm lặp / máy thầy thứ hai
    expect(st.live).toMatchObject({ bat: true, tu: 2000, phien: 1, san: true, ss: SS })
    expect(LL.liveTat(st, 3000)).toBe(true)
    expect(LL.liveTat(st, 3001)).toBe(false)
    expect(st.live).toMatchObject({ bat: false, tu: null, phien: 1, san: true, ss: SS })
    expect(LL.liveBat(st, 4000)).toBe(true)
    expect(st.live!.phien).toBe(2)
    // Thầy tải lại trang giữa lúc live ⇒ phiên SFU mới ⇒ phien + 1 (máy em kéo lại track, bỏ gói phiên cũ).
    expect(LL.liveSan(st, { ss: { ...SS, id: 'ffffffffffffffffffffffffffffffff' } }, 4500)).toBe(true)
    expect(st.live!.phien).toBe(3)
  })
  it('phiên SFU sai dạng bị bỏ; SFU chưa cấu hình ⇒ không nhận phiên, tieng = chua-cau-hinh, live vẫn bật được (chỉ hình)', () => {
    expect(LL.chuanPhienSfu({ id: '../x', tieng: 'thay', kenh: 'net' })).toBeNull()
    expect(LL.chuanPhienSfu({ id: SS.id, tieng: 'Tên Lạ', kenh: 7 })).toEqual({ id: SS.id, tieng: null, kenh: null })
    const st = phong({ sfu: false })
    expect(LL.liveSan(st, { ss: SS }, 1500)).toBe(true)
    expect(st.live!.ss).toBeNull()
    expect(LL.liveBat(st, 2000)).toBe(true)
    expect(L.viewBang(st).live).toMatchObject({ bat: true, tieng: 'chua-cau-hinh', ss: null })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: true, tieng: 'chua-cau-hinh', ss: null })
  })
  it('điểm quyết 3 + 4: em trong lớp mặc định TẮT tiếng, em ở xa mặc định bật; «cho em ở xa» mặc định tắt', () => {
    const st = phong()
    LL.liveSan(st, { ss: SS }, 1500); LL.liveBat(st, 2000)
    expect(st.live).toMatchObject({ xa: false, tiengLop: false })
    expect(L.viewEm(st, 'S1').live).toMatchObject({ duocXem: true, bat: true, tieng: 'tat', ss: SS })
    // S3 thuộc lớp nhưng chưa điểm danh: chưa được xem, không nhận phiên SFU.
    expect(LL.duocXemLive(st, 'S3')).toBe(false)
    expect(L.viewEm(st, 'S3').live).toMatchObject({ duocXem: false, bat: false, san: false, ss: null, tu: null })
    expect(LL.liveDat(st, { xa: true }, 2500)).toBe(true)
    expect(LL.liveDat(st, { xa: true }, 2600)).toBe(false)
    expect(LL.duocXemLive(st, 'S3')).toBe(true)
    expect(L.viewEm(st, 'S3').live).toMatchObject({ duocXem: true, bat: true, tieng: 'bat', ss: SS })
    // Em lạ (không thuộc lớp) không bao giờ được xem.
    expect(LL.duocXemLive(st, 'LA')).toBe(false)
    expect(L.viewEm(st, 'LA').live).toMatchObject({ duocXem: false, bat: false, ss: null })
    expect(LL.liveDat(st, { tiengLop: true }, 2700)).toBe(true)
    expect(L.viewEm(st, 'S1').live!.tieng).toBe('bat')
    expect(L.viewBang(st).live).toMatchObject({ xa: true, tiengLop: true, tieng: 'bat' })
  })
  it('hết buổi ⇒ live tắt; thầy quên tắt: quá 15 phút không nhịp ⇒ hết hạn, có nhịp thì không', () => {
    const st = phong()
    LL.liveBat(st, 2000)
    expect(LL.liveHetHan(st, 2000 + LL.TU_TAT_LIVE_MS)).toBe(false)
    expect(LL.liveHetHan(st, 2001 + LL.TU_TAT_LIVE_MS)).toBe(true)
    LL.liveNhip(st, 2000 + LL.TU_TAT_LIVE_MS)
    expect(LL.liveHetHan(st, 2001 + LL.TU_TAT_LIVE_MS)).toBe(false)
    L.ketThuc(st, 9000)
    expect(st.live!.bat).toBe(false)
    expect(L.viewEm(st, 'S1').live).toMatchObject({ bat: false, duocXem: false })
    expect(LL.liveBat(st, 9001)).toBe(false)
  })
  it('mã khung nhị phân: nhóm sổ nét / điểm đang viết; số thứ tự ghi tại chỗ', () => {
    expect([0x11, 0x12, 0x13, 0x14, 0x15].map(LL.nhomKhung)).toEqual(['so', 'so', 'so', 'so', 'so'])
    expect([0x21, 0x22, 0x23].map(LL.nhomKhung)).toEqual(['diem', 'diem', 'diem'])
    expect([0, 0x10, 0x16, 0x20, 0x24, 255].map(LL.nhomKhung)).toEqual([null, null, null, null, null, null])
    const k = new Uint8Array([0x13, 0, 0, 0, 0, 9])
    LL.ghiStt(k, 0x01020304)
    expect([...k]).toEqual([0x13, 4, 3, 2, 1, 9])
    expect(LL.docStt(k)).toBe(0x01020304)
    LL.ghiStt(k, 0xfffffffe)
    expect(LL.docStt(k)).toBe(0xfffffffe)
  })
})

describe('phòng live (Durable Object)', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('thầy bật ⇒ mọi máy nhận view có live.bat; em gửi lệnh của thầy không có tác dụng; máy thầy thứ hai bật ⇒ «đang live»', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const gv = await ph.noi('gv'), gv2 = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'chao' }); await ph.gui(e1, { t: 'chao' })
    expect(viewCuoi(gv).live).toMatchObject({ bat: false, san: false, tieng: 'chua-cau-hinh', xem: 0 })
    await ph.gui(e1, { t: 'live-bat' })
    await ph.gui(e1, { t: 'live-san', ss: SS })
    await ph.gui(e1, { t: 'live-dat', xa: true })
    expect(viewCuoi(gv).live).toMatchObject({ bat: false, san: false, xa: false })
    await ph.gui(gv, { t: 'live-san', ss: null })
    await ph.gui(gv, { t: 'live-bat' })
    expect(viewCuoi(gv).live).toMatchObject({ bat: true, phien: 1, san: true })
    expect(viewCuoi(e1).live).toMatchObject({ bat: true, phien: 1, duocXem: true })
    await ph.gui(gv2, { t: 'live-bat' })
    expect(chu(gv2).filter((m) => m.t === 'live-kq')).toEqual([{ t: 'live-kq', lenh: 'bat', ok: false, lyDo: 'dang-live' }])
    await ph.gui(gv, { t: 'live-tat' })
    expect(viewCuoi(e1).live).toMatchObject({ bat: false, san: true })
    // Số đo của lần live vừa xong được ghi lại lúc tắt.
    expect(ph.kho.du.has('live-do')).toBe(true)
  })
  it('số em đang xem: đếm theo `live-ok` của phiên này, báo máy thầy bằng tin NHỎ `live-xem` (gom) — KHÔNG phát lại view đầy đủ cho cả lớp', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'S3' }])
    const gv = await ph.noi('gv'), em = [await ph.noi('hs', 'S1'), await ph.noi('hs', 'S2'), await ph.noi('hs', 'S3')]
    await ph.gui(gv, { t: 'live-bat' })
    const truoc = em.map((w) => w.tin.length), truocGv = chu(gv).filter((m) => m.t === 'bang').length
    await ph.gui(em[0]!, { t: 'live-ok', dc: true })
    await ph.gui(em[1]!, { t: 'live-ok', dc: false })
    await ph.gui(em[1]!, { t: 'live-ok', dc: false }) // báo trùng
    // Em thứ hai của S2 trên máy khác: vẫn đếm MỘT em.
    const e2b = await ph.noi('hs', 'S2')
    await ph.gui(e2b, { t: 'live-ok', dc: false })
    await vi.advanceTimersByTimeAsync(400)
    expect(em.map((w) => w.tin.length)).toEqual(truoc) // không view nào tới máy em vì `live-ok`
    expect(chu(gv).filter((m) => m.t === 'bang').length).toBe(truocGv)
    expect(chu(gv).filter((m) => m.t === 'live-xem')).toEqual([{ t: 'live-xem', xem: 2, ws: 1, nghe: 0 }])
    // Em rời màn không tính là đang xem; kết nối đóng ⇒ báo lại.
    await ph.gui(em[0]!, { t: 'roi' })
    expect(viewCuoi(gv).live).toMatchObject({ xem: 1, ws: 1 })
    await ph.gui(em[0]!, { t: 've' })
    expect(viewCuoi(gv).live).toMatchObject({ xem: 2, ws: 1 })
    await ph.dong(em[1]!); await ph.dong(e2b)
    await vi.advanceTimersByTimeAsync(400)
    expect(chu(gv).filter((m) => m.t === 'live-xem').pop()).toEqual({ t: 'live-xem', xem: 1, ws: 0, nghe: 0 })
    // Bật lại (phiên mới) ⇒ đếm lại từ đầu.
    await ph.gui(gv, { t: 'live-tat' }); await ph.gui(gv, { t: 'live-bat' })
    expect(viewCuoi(gv).live).toMatchObject({ bat: true, phien: 2, xem: 0 })
  })
  it('số em ĐANG NGHE (thầy 11/11: vạch mic chạy mà em không nghe): máy em báo `nghe` trong `live-ok` khi loa phát tiếng thầy thật ⇒ thầy nhận `live-xem` có `nghe`; em tắt tiếng ⇒ số giảm; view bảng mang `live.nghe`', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'S3' }])
    const gv = await ph.noi('gv'), em = [await ph.noi('hs', 'S1'), await ph.noi('hs', 'S2'), await ph.noi('hs', 'S3')]
    await ph.gui(gv, { t: 'live-bat' })
    for (const w of em) await ph.gui(w, { t: 'live-ok', dc: true }) // máy em trong lớp mặc định tắt tiếng
    await vi.advanceTimersByTimeAsync(400)
    expect(chu(gv).filter((m) => m.t === 'live-xem').pop()).toEqual({ t: 'live-xem', xem: 3, ws: 0, nghe: 0 })
    const truoc = em.map((w) => w.tin.length)
    await ph.gui(em[0]!, { t: 'live-ok', dc: true, nghe: true }); await ph.gui(em[1]!, { t: 'live-ok', dc: true, nghe: true })
    await vi.advanceTimersByTimeAsync(400)
    expect(chu(gv).filter((m) => m.t === 'live-xem').pop()).toEqual({ t: 'live-xem', xem: 3, ws: 0, nghe: 2 })
    expect(em.map((w) => w.tin.length)).toEqual(truoc) // không view nào tới máy em
    await ph.gui(em[0]!, { t: 'live-ok', dc: true, nghe: false })
    await vi.advanceTimersByTimeAsync(400)
    expect(chu(gv).filter((m) => m.t === 'live-xem').pop()).toMatchObject({ xem: 3, nghe: 1 })
    await ph.gui(gv, { t: 'live-dat', tiengLop: true })
    expect(viewCuoi(gv).live).toMatchObject({ xem: 3, nghe: 1 })
  })
  it('công tắc tắt / phòng mở bằng Worker bản cũ (không gửi `live`): không khối live, lệnh live và khung nhị phân đều bị bỏ, luật cũ chạy y nguyên', async () => {
    for (const live of [{ cho: false, sfu: true }, null]) {
      const ph = taoPhongGia()
      await ph.khoi([{ sbd: 'S1' }], live)
      const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
      await ph.gui(gv, { t: 'live-bat' })
      await ph.guiNp(gv, new Uint8Array([0x13, 0, 0, 0, 0]))
      await ph.gui(gv, { t: 'chao' }); await ph.gui(e1, { t: 'chao' })
      expect(viewCuoi(gv).live).toBeNull()
      expect(viewCuoi(e1).live).toBeNull()
      expect(e1.tin.every((t) => typeof t === 'string')).toBe(true)
      await ph.post('/luot', { qid: 'q', phan: 'I', tuLuan: false, cau: {}, dung: 'A', hanGiay: 0 })
      await ph.gui(e1, { t: 'tra', chon: 'A' }); await ph.gui(gv, { t: 'mo' })
      expect(viewCuoi(e1).luot.ketQua.dung).toBe(true)
    }
  })
  it('thầy quên tắt: quá 15 phút không nhịp ⇒ lần tới có máy em nhắn / chào thì phòng tự tắt live; nhịp `live-nhip` giữ live', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv'), e1 = await ph.noi('hs', 'S1')
    await ph.gui(gv, { t: 'live-bat' }); await ph.gui(e1, { t: 'live-ok' })
    await vi.advanceTimersByTimeAsync(14 * 60_000)
    await ph.gui(gv, { t: 'live-nhip' })
    await vi.advanceTimersByTimeAsync(14 * 60_000)
    await ph.gui(e1, { t: 'live-do', d: 40 })
    expect(viewCuoi(e1).live.bat).toBe(true)
    await vi.advanceTimersByTimeAsync(2 * 60_000)
    await ph.gui(e1, { t: 'live-do', d: 40 })
    expect(viewCuoi(e1).live.bat).toBe(false)
    expect(viewCuoi(gv).live.bat).toBe(false)
  })
  it('số đo `live-do` của các em: gộp trong bộ nhớ, báo máy thầy tối đa 10 giây một lần, không phát view, không ghi storage', async () => {
    const ph = taoPhongGia()
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }, { sbd: 'S3' }])
    const gv = await ph.noi('gv'), em = [await ph.noi('hs', 'S1'), await ph.noi('hs', 'S2'), await ph.noi('hs', 'S3')]
    await ph.gui(gv, { t: 'live-bat' })
    for (const w of em) await ph.gui(w, { t: 'live-ok', dc: true })
    const ghi = ph.kho.ghi, truoc = em.map((w) => w.tin.length)
    await vi.advanceTimersByTimeAsync(11_000)
    await ph.gui(em[0]!, { t: 'live-do', d: 40, j: 10, m: 0, rtt: 30, tt: 110, dc: true })
    await ph.gui(em[1]!, { t: 'live-do', d: 60, j: 20, m: 15, rtt: 50, tt: 130, dc: true })
    await ph.gui(em[2]!, { t: 'live-do', d: 'x', j: -5, rtt: 1e9, dc: false })
    expect(chu(gv).filter((m) => m.t === 'live-do').length).toBe(1) // lần đầu báo ngay, hai lần sau trong 10 giây thì gom
    await vi.advanceTimersByTimeAsync(10_000)
    await ph.gui(em[0]!, { t: 'live-do', d: 40, j: 10, m: 0, rtt: 30, tt: 110, dc: true })
    const do2 = chu(gv).filter((m) => m.t === 'live-do')
    expect(do2.length).toBe(2)
    expect(do2[1]).toMatchObject({ so: 3, dc: 2, d: { tv: 40, p95: 60 }, rtt: { tv: 50, p95: 10000 } }) // số sai dạng bị bỏ, số quá lớn bị kẹp
    expect(ph.kho.ghi).toBe(ghi)
    expect(em.map((w) => w.tin.length)).toEqual(truoc)
  })
})

describe('công tắc + khoá SFU nạp vào phòng lúc thầy mở (`/gv/bpu/mo`)', () => {
  /** D1 giả tối thiểu: batch mở phòng, năng lực (rỗng), một dòng `cau_hinh`. Đếm ĐỢT chờ D1 nối tiếp trước khi gọi phòng. */
  function moiTruong(giaTri: string | null, o: Partial<Env> = {}) {
    let dangCho = 0, dot = 0, dotLucGoiPhong = -1, than: Record<string, any> | null = null
    const theo = <T,>(p: Promise<T>): Promise<T> => { if (dangCho === 0) dot++; dangCho++; return p.finally(() => { dangCho-- }) }
    const lenh = (q: string) => ({ q, bind() { return this }, all: () => theo(Promise.resolve({ results: [] })), first: () => theo(Promise.resolve(q.includes('cau_hinh') ? (giaTri == null ? null : { gia_tri: giaTri }) : null)) })
    const DB = { prepare: lenh, batch: () => theo(Promise.resolve([{ results: [{ id: 'B1', ten: 'Buổi', lop: '12A1', dong_luc: null }] }, { results: [{ sbd: 'S1', ho_ten: 'A', lop: '12', ten_lop: '12A1' }] }, { results: [] }, { results: [] }])) }
    const env = { DB, MA_BI_MAT: 'x', PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: async (r: Request) => { dotLucGoiPhong = dot; than = (await r.json()) as Record<string, any>; return new Response('{"ok":true}') } }) }, ...o } as unknown as Env
    return { env, than: () => than, dot: () => dotLucGoiPhong }
  }
  it('vắng dòng công tắc ⇒ live BẬT; Worker chưa có khoá SFU ⇒ sfu false; đọc công tắc SONG SONG với batch mở phòng (vẫn MỘT đợt chờ D1)', async () => {
    const m = moiTruong(null)
    expect((await gvBpuMo(m.env, { buoiId: 'B1' })).ok).toBe(true)
    expect(m.than()!.live).toEqual({ cho: true, sfu: false })
    expect(m.dot()).toBe(1)
  })
  it('{"bat":false} ⇒ tắt; có đủ REALTIME_APP_ID + REALTIME_APP_SECRET ⇒ sfu true', async () => {
    const tat = moiTruong('{"bat":false}', { REALTIME_APP_ID: 'a', REALTIME_APP_SECRET: 'b' })
    await gvBpuMo(tat.env, { buoiId: 'B1' })
    expect(tat.than()!.live).toEqual({ cho: false, sfu: true })
    const thieu = moiTruong('{"bat":true}', { REALTIME_APP_ID: 'a' })
    await gvBpuMo(thieu.env, { buoiId: 'B1' })
    expect(thieu.than()!.live).toEqual({ cho: true, sfu: false })
  })
})
