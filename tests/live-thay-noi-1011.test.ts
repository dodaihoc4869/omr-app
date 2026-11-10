// LIVE BẢNG — MÁY THẦY, phần nối ở cửa sổ app (src/components/live/thay-noi.ts) + cầu nối phòng (src/components/bpu/cau-live.ts) + mặt live trên tờ chiếu
// (src/lib/live-to-chieu.ts). Thư viện WebRTC (src/lib/live) thay bằng bản giả ghi lại lệnh gọi; phòng = WebSocket giả phát `viewBang` theo luật phòng thật.
// Khoá: phòng không có khối live ⇒ tờ không có nút; lần đầu ⇒ thẻ chọn mic, các lần sau live ngay; sự kiện bút của tờ tới thư viện với khoá trang mang ô giấy /
// ô bảng; công tắc «Bảng → máy em», «Thu mic»; em rời màn ⇒ thẻ có tên + đội; nút Live trên bảng đua theo luật «live = tiếng, bảng không cần lui».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, moLuot, nhanTra, roiMan, taoPhong, viewBang, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveSan } from '../src/lib/bpu/phong-live'
import { giaiTrang } from '../src/components/live/bo-cuc'
import { CSS_LIVE_TO_CHIEU, JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'
import { CSS_LEN_BANG_MOI, jsLenBangMoi } from '../src/lib/len-bang-moi-to-chieu'

const goi: [string, unknown[]][] = []
let khiTt: ((t: Record<string, unknown>) => void) | null = null
let micOk = true
vi.mock('../src/lib/live', () => ({
  taoLiveThay: (tuy: { khiTrangThai?: (t: Record<string, unknown>) => void; layAnh?: () => unknown }) => {
    khiTt = tuy.khiTrangThai ?? null
    const ghi = (ten: string) => (...a: unknown[]) => { goi.push([ten, a]) }
    return {
      noiSan: async () => { goi.push(['noiSan', []]) }, dsMic: async () => [{ id: 'm1', ten: 'Micro không dây (USB)' }, { id: 'm2', ten: 'Mic máy tính' }],
      moMic: async (id: unknown) => { goi.push(['moMic', [id]]); return micOk ? { ok: true } : { ok: false, lyDo: 'mic-tu-choi' } },
      bat: async (o: unknown) => { goi.push(['bat', [o]]); return { ok: true } },
      tat: ghi('tat'), thaMic: ghi('thaMic'), mucAm: () => 0.3, dat: ghi('dat'), thuMic: ghi('thuMic'), datNgheEm: ghi('datNgheEm'), nhanSuKienBut: ghi('nhanSuKienBut'), guiAnh: ghi('guiAnh'),
      nhanTinPhong: ghi('nhanTinPhong'), khiNoiLai: ghi('khiNoiLai'), huy: ghi('huy'), layAnh: () => tuy.layAnh?.(),
    }
  },
}))
vi.mock('../src/components/bpu/gan-gv', () => ({ datLive: (t: unknown) => { goi.push(['datLive', [t]]) } }))

class WsGia extends EventTarget { readyState = 1; binaryType = 'blob'; gui: unknown[] = []; send(d: unknown) { this.gui.push(d) }
  mo() { this.dispatchEvent(new Event('open')) } dong() { this.readyState = 3; this.dispatchEvent(new Event('close')) }
  nhan(v: unknown) { this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(v) })) } }

const T0 = Date.now()
function phong(coLive = true): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Lê Gia Huy', coMat: true, luc: T0 }, { sbd: 'S3', ten: 'Phạm Khánh Vy', coMat: false, luc: null }] })
  if (coLive) datCoLive(st, { cho: true, sfu: true }, T0)
  return st
}
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', text: 'Đề', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }
const cho = () => new Promise((r) => setTimeout(r, 0))
type Tt = { co: boolean; pha: string; tong: number; xem: number; bang: boolean; the: { ds: unknown[]; chon: string; loi: string } | null; roi: { sbd: string; ten: string; doi: string }[]; noi: { sbd: string; ten: string }[]; chuaGui: number; coTieng: boolean }

async function dung() {
  vi.resetModules()
  const M = await import('../src/components/live/thay-noi')
  const C = await import('../src/components/bpu/cau-live')
  const tin: Record<string, unknown>[] = []
  const to = { postMessage: (m: Record<string, unknown>) => { tin.push(m) } } as unknown as Window
  const ws = new WsGia()
  const ttCuoi = (): Tt => [...tin].reverse().find((m) => m.lenh === 'live-tt')!.tt as Tt
  return { M, C, to, ws, tin, ttCuoi, noi: () => { C.noiLive(ws as unknown as WebSocket, 've-gv', 'https://may-chu'); ws.mo() } }
}

beforeEach(() => { goi.length = 0; khiTt = null; micOk = true; localStorage.clear() })
afterEach(() => { vi.useRealTimers() })

describe('phần nối live của máy thầy', () => {
  it('chưa có phòng / phòng không có khối live ⇒ tờ nhận `co: false` (nút Live ẩn), không nạp thư viện', async () => {
    const { M, to, ws, ttCuoi, noi } = await dung()
    M.nhanTinTo({ viec: 'chao' }, to)
    expect(ttCuoi().co).toBe(false)
    noi()
    ws.nhan(viewBang(phong(false)))
    await cho()
    expect(ttCuoi().co).toBe(false)
    expect(goi.some(([t]) => t === 'noiSan')).toBe(false)
    expect(ws.binaryType).toBe('arraybuffer')
  })

  it('phòng bật công tắc ⇒ nút Live; lần đầu bấm ⇒ thẻ chọn mic (mở mic, liệt kê mic); «Bắt đầu live» ⇒ bat; lần sau bấm là live ngay', async () => {
    const { M, to, ws, ttCuoi, noi } = await dung()
    const st = phong()
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(st))
    await cho(); await cho()
    expect(ttCuoi()).toMatchObject({ co: true, pha: 'tat', tong: 2, coTieng: true })
    expect(goi.some(([t]) => t === 'noiSan')).toBe(true) // nối sẵn (track câm) ngay khi có phòng
    M.nhanTinTo({ viec: 'bam' }, to)
    await cho(); await cho(); await cho()
    expect(goi.some(([t]) => t === 'moMic')).toBe(true)
    expect(ttCuoi().the).toMatchObject({ loi: '', ds: [{ id: 'm1' }, { id: 'm2' }] })
    M.nhanTinTo({ viec: 'chon-mic', id: 'm2' }, to)
    expect(localStorage.getItem('ddh.live.mic')).toBe('m2')
    M.nhanTinTo({ viec: 'bat-dau' }, to)
    await cho(); await cho()
    expect(goi.filter(([t]) => t === 'bat').at(-1)![1][0]).toMatchObject({ khongTieng: false })
    expect(localStorage.getItem('ddh.live.da-bat')).toBe('1')
    expect(ttCuoi().the).toBeNull()
    // phòng xác nhận đang live
    liveSan(st, { san: true, ss: null }, T0); liveBat(st, T0 + 1); ws.nhan(viewBang(st))
    expect(ttCuoi()).toMatchObject({ pha: 'live', bang: false })
    // tắt rồi bấm lại: đã nhớ mic ⇒ live ngay, không mở thẻ
    M.nhanTinTo({ viec: 'tat' }, to)
    expect(goi.some(([t]) => t === 'tat')).toBe(true)
    st.live!.bat = false; ws.nhan(viewBang(st))
    const truoc = goi.filter(([t]) => t === 'bat').length
    M.nhanTinTo({ viec: 'bam' }, to)
    await cho(); await cho()
    expect(goi.filter(([t]) => t === 'bat').length).toBe(truoc + 1)
    expect(goi.filter(([t]) => t === 'bat').at(-1)![1][0]).toMatchObject({ mic: 'm2' })
  })

  it('mic bị từ chối ⇒ thẻ báo lỗi; «Live không tiếng» ⇒ bat({ khongTieng: true }); «Để sau» ⇒ thả mic', async () => {
    micOk = false
    const { M, to, ws, ttCuoi, noi } = await dung()
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(phong()))
    await cho(); await cho()
    M.nhanTinTo({ viec: 'bam' }, to)
    await cho(); await cho(); await cho()
    expect(ttCuoi().the!.loi).toBe('mic-tu-choi')
    M.nhanTinTo({ viec: 'the-dong' }, to) // «Để sau»
    expect(goi.some(([t]) => t === 'thaMic')).toBe(true)
    expect(ttCuoi().the).toBeNull()
    M.nhanTinTo({ viec: 'bam' }, to); await cho(); await cho(); await cho()
    M.nhanTinTo({ viec: 'khong-tieng' }, to)
    await cho(); await cho()
    expect(goi.filter(([t]) => t === 'bat').at(-1)![1][0]).toMatchObject({ khongTieng: true })
  })

  it('sự kiện bút của tờ ⇒ thư viện; sự kiện «trang» mang ô giấy / ô bảng trong khoá trang; ảnh trạng thái gửi lại khi ô đổi', async () => {
    const { M, to, ws, noi } = await dung()
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(phong()))
    await cho(); await cho()
    const vung = { giay: [0.005, 0.009, 0.661, 0.919], bang: [0.667, 0.019, 0.995, 0.919] }
    M.nhanTinTo({ viec: 'anh', trang: '0', tiLe: 1.7786, net: [], vung, giayToi: false }, to)
    const anh = goi.filter(([t]) => t === 'guiAnh').at(-1)![1][0] as { trang: string; tiLe: number }
    expect(giaiTrang(anh.trang)).toMatchObject({ khoa: '0', vung: { giayToi: false } })
    expect(giaiTrang(anh.trang).vung.bang[0]).toBeCloseTo(0.667, 3)
    const net = { id: 'n1', cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: [[0.7, 0.2, 0.5, 0]] }
    M.nhanTinTo({ viec: 'but', sk: { loai: 'net-moi', trang: '0', net } }, to)
    M.nhanTinTo({ viec: 'but', sk: { loai: 'them-diem', trang: '0', id: 'n1', diem: [[0.71, 0.21, 0.5, 8]] } }, to)
    M.nhanTinTo({ viec: 'but', sk: { loai: 'net-xong', trang: '0', id: 'n1' } }, to)
    expect(goi.filter(([t]) => t === 'nhanSuKienBut').map(([, a]) => (a[0] as { loai: string }).loai)).toEqual(['net-moi', 'them-diem', 'net-xong'])
    // chuyển câu: trang mới, giấy tối
    M.nhanTinTo({ viec: 'but', sk: { loai: 'trang', trang: '1', net: [], tiLe: 1.7786 }, vung, giayToi: true }, to)
    const sk = goi.filter(([t]) => t === 'nhanSuKienBut').at(-1)![1][0] as { loai: string; trang: string }
    expect(sk.loai).toBe('trang')
    expect(giaiTrang(sk.trang)).toMatchObject({ khoa: '1', vung: { giayToi: true } })
    // bố cục đợt mới xếp xong, ô bảng đổi ⇒ gửi lại ảnh trạng thái với khoá mới; ô không đổi ⇒ không gửi
    const soAnh = goi.filter(([t]) => t === 'guiAnh').length
    M.nhanTinTo({ viec: 'vung', trang: '1', vung, giayToi: true }, to)
    expect(goi.filter(([t]) => t === 'guiAnh').length).toBe(soAnh)
    M.nhanTinTo({ viec: 'vung', trang: '1', vung: { ...vung, bang: [0.7, 0.019, 0.995, 0.919] }, giayToi: true }, to)
    expect(goi.filter(([t]) => t === 'guiAnh').length).toBe(soAnh + 1)
  })

  it('đang live: em rời màn ⇒ thẻ có tên + đội; gọi em lên bảng ⇒ `bang` bật; công tắc «Bảng → máy em» và «Thu mic» tới thư viện; còn em chưa gửi ⇒ nhắc', async () => {
    const { M, to, ws, ttCuoi, noi } = await dung()
    const st = phong(); moLuot(st, cau, T0); liveBat(st, T0 + 1)
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(st))
    await cho(); await cho()
    expect(ttCuoi()).toMatchObject({ pha: 'live', chuaGui: 2, roi: [], bang: false })
    nhanTra(st, 'S1', 'B', T0 + 500); roiMan(st, 'S2', T0 + 600); ws.nhan(viewBang(st))
    expect(ttCuoi().chuaGui).toBe(1)
    expect(ttCuoi().roi).toMatchObject([{ sbd: 'S2', ten: 'Lê Gia Huy' }])
    expect(ttCuoi().roi[0]!.doi).toMatch(/^Đội /)
    goiLenBang(st, 'S1', ['Chưa lên bảng'], T0 + 900); ws.nhan(viewBang(st))
    expect(ttCuoi().bang).toBe(true)
    M.nhanTinTo({ viec: 'bang', v: false }, to)
    expect(goi.filter(([t]) => t === 'dat').at(-1)![1][0]).toEqual({ bang: false })
    M.nhanTinTo({ viec: 'thu-mic' }, to)
    expect(goi.some(([t]) => t === 'thuMic')).toBe(true)
    M.nhanTinTo({ viec: 'nghe-em', v: true }, to) // công tắc «Phát tiếng em ra loa lớp» trên thẻ «Đang nói»
    expect(goi.filter(([t]) => t === 'datNgheEm').at(-1)![1][0]).toBe(true)
    // nút Live trên bảng đua + ẩn viền đỏ toàn màn: gan-gv được báo «đang live»
    await cho()
    expect(goi.filter(([t]) => t === 'datLive').at(-1)![1][0]).toEqual({ co: true, bat: true })
  })

  it('nút Live trên bảng đua: chưa từng bật ⇒ lui về tờ để chọn mic; đã nhớ mic ⇒ live tại chỗ (bảng không lui); đang live ⇒ lui về tờ để điều khiển', async () => {
    const { M, to, ws, noi } = await dung()
    const st = phong()
    expect(M.bamTuBang()).toBe(false) // chưa có phòng
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(st))
    await cho(); await cho()
    expect(M.bamTuBang()).toBe(true) // lần đầu: thẻ chọn mic nằm trên tờ
    await cho(); await cho(); await cho()
    M.nhanTinTo({ viec: 'the-dong' }, to)
    localStorage.setItem('ddh.live.da-bat', '1')
    const truoc = goi.filter(([t]) => t === 'bat').length
    expect(M.bamTuBang()).toBe(false)
    await cho(); await cho()
    expect(goi.filter(([t]) => t === 'bat').length).toBe(truoc + 1)
    liveBat(st, T0 + 1); ws.nhan(viewBang(st))
    expect(M.bamTuBang()).toBe(true)
  })

  it('phòng rớt khi đang live ⇒ tờ thấy «đang nối lại» (không mất nút); nối lại ⇒ thư viện được báo', async () => {
    const { M, C, to, ws, ttCuoi, noi } = await dung()
    const st = phong(); liveBat(st, T0 + 1)
    M.nhanTinTo({ viec: 'chao' }, to); noi(); ws.nhan(viewBang(st))
    await cho(); await cho()
    ws.dong()
    expect((ttCuoi() as unknown as { noiLai: boolean }).noiLai).toBe(true)
    expect(ttCuoi().co).toBe(true)
    const ws2 = new WsGia()
    C.noiLive(ws2 as unknown as WebSocket, 've-gv', 'https://may-chu'); ws2.mo()
    expect(goi.some(([t]) => t === 'khiNoiLai')).toBe(true)
    void khiTt
  })
})

describe('mặt live trên tờ chiếu (chuỗi chèn vào tờ)', () => {
  it('có đủ nút / chữ chuẩn, không mã màu thô, cú pháp JS hợp lệ', () => {
    for (const chu of ['Live', 'Tắt live', 'Bắt đầu live', 'em rời màn', 'Bảng', 'Thu mic', 'Live không tiếng', 'Lọc tiếng ồn + khử vọng']) expect(JS_LIVE_TO_CHIEU).toContain(chu)
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/stream|phát sóng|trực tuyến|mute|kick/i) // bảng từ chuẩn: Live · Tiếng · Thu mic
    expect(CSS_LIVE_TO_CHIEU + JS_LIVE_TO_CHIEU).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/=>|\bconst\b|\blet\b|`/) // tờ chạy cả trên máy chiếu cũ: ES5
    expect(() => new Function('body', 'tao', 'thanh', 'dichApp', 'baoNhanh', JS_LIVE_TO_CHIEU)).not.toThrow()
  })
  it('đã chèn vào tờ chiếu thật (cùng chỗ với bút)', () => {
    expect(CSS_LEN_BANG_MOI).toContain('.mc-lv-nut')
    const js = jsLenBangMoi()
    expect(js).toContain('window.__mcLive')
    expect(js.indexOf('window.__mcBut =')).toBeLessThan(js.indexOf('window.__mcLive')) // live nghe bút ⇒ phải đứng sau bút
  })
})
