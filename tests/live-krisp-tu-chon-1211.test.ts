// KRISP TỰ CHỌN (12/11 chiều, thầy: «cấu hình luôn mic trên app chọn Krisp tự động và tự động tắt lọc ồn các thứ») — src/components/live/thay-noi.ts.
// Lần ĐẦU máy thầy thấy mic ảo Krisp lúc CHƯA live ⇒ chọn Krisp + «Lọc ồn» Tắt + «Tiếng» Chuẩn trình duyệt, qua đúng đường các nút sẵn có; MỘT lần mỗi máy
// (thầy chọn lại BOYALINK thì giữ); không có Krisp ⇒ không đổi gì; đang live ⇒ không tự đổi mic; máy từng live (bấm là live ngay) ⇒ lần đầu thấy Krisp mở thẻ mic.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoPhong, viewBang } from '../src/lib/bpu/phong'
import { datCoLive, liveBat } from '../src/lib/bpu/phong-live'

const goi: [string, unknown[]][] = []
let dsGia: { id: string; ten: string }[] = []
vi.mock('../src/lib/live', () => ({
  taoLiveThay: () => {
    const ghi = (ten: string) => (...a: unknown[]) => { goi.push([ten, a]) }
    return { noiSan: async () => {}, dsMic: async () => dsGia, moMic: async (...a: unknown[]) => { goi.push(['moMic', a]); return { ok: true } }, bat: async (...a: unknown[]) => { goi.push(['bat', a]); return { ok: true } },
      tat: ghi('tat'), thaMic: ghi('thaMic'), mucAm: () => 0, mucAmEm: () => 0, dat: ghi('dat'), thuMic: ghi('thuMic'), datNgheEm: ghi('datNgheEm'), nhanSuKienBut: ghi('nhanSuKienBut'),
      guiAnh: ghi('guiAnh'), nhanTinPhong: ghi('nhanTinPhong'), khiNoiLai: ghi('khiNoiLai'), huy: ghi('huy'), tamDung: ghi('tamDung'), moiNoi: ghi('moiNoi'), haTay: ghi('haTay'),
      datLocOn: ghi('datLocOn'), datKieuTieng: ghi('datKieuTieng') }
  },
}))
vi.mock('../src/components/bpu/gan-gv', () => ({ datLive: () => {} }))
class WsGia extends EventTarget { readyState = 1; binaryType = 'blob'; send() {} mo() { this.dispatchEvent(new Event('open')) }
  nhan(v: unknown) { this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(v) })) } }

const KRISP = { id: 'kr', ten: 'Krisp Microphone (Krisp Audio)' }, BOYA = { id: 'by', ten: 'Microphone (BOYALINK)' }, MAY = { id: 'may', ten: 'Microphone Array (Intel® Smart Sound)' }
const cho = () => new Promise((r) => setTimeout(r, 20))
async function dung(o: { live?: boolean } = {}) {
  goi.length = 0
  vi.resetModules()
  const M = await import('../src/components/live/thay-noi')
  const C = await import('../src/components/bpu/cau-live')
  const to = { postMessage: () => {} } as unknown as Window
  const ws = new WsGia()
  const T0 = Date.now()
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', coMat: true, luc: T0 }] })
  datCoLive(st, { cho: true, sfu: true }, T0)
  if (o.live) liveBat(st, T0 + 1)
  C.noiLive(ws as unknown as WebSocket, 've-gv', 'https://may-chu'); ws.mo()
  M.nhanTinTo({ viec: 'chao' }, to)
  ws.nhan(viewBang(st))
  await cho()
  const bam = async () => { M.nhanTinTo({ viec: 'bam' }, to); await cho() }
  const tin = (v: Record<string, unknown>) => M.nhanTinTo(v, to)
  return { M, bam, tin, ten: (t: string) => goi.filter(([x]) => x === t).map(([, a]) => a) }
}
afterEach(async () => { localStorage.clear(); dsGia = []; const M = await import('../src/components/live/thay-noi'); M._datLaiLiveThay() })

describe('Krisp tự chọn một lần', () => {
  it('máy lần đầu, có Krisp, chưa live ⇒ mở Krisp + nhớ; Lọc ồn Tắt; Tiếng Chuẩn trình duyệt; cờ một lần', async () => {
    localStorage.setItem('ddh.live.mic', 'by'); localStorage.setItem('ddh.live.kieu-tieng', 'lam-ro'); localStorage.setItem('ddh.live.loc-on', 'manh')
    dsGia = [BOYA, KRISP, MAY]
    const t = await dung()
    await t.bam()
    expect(t.ten('moMic').map((a) => a[0])).toContain('kr')
    expect(localStorage.getItem('ddh.live.mic')).toBe('kr')
    expect(localStorage.getItem('ddh.live.loc-on')).toBe('tat')
    expect(localStorage.getItem('ddh.live.kieu-tieng')).toBe('')
    expect(localStorage.getItem('ddh.live.krisp-da-chon')).toBe('1')
    expect(t.ten('datLocOn')).toEqual([['tat']])
    expect(t.ten('datKieuTieng')).toEqual([[true]])
    expect(t.ten('bat')).toEqual([]) // chưa live: thầy nói thử, thấy vạch rồi mới bấm bắt đầu
  })
  it('đã tự chọn một lần, thầy chọn lại BOYALINK ⇒ mở lại thẻ vẫn giữ BOYALINK, không đổi lọc', async () => {
    localStorage.setItem('ddh.live.krisp-da-chon', '1'); localStorage.setItem('ddh.live.mic', 'by')
    dsGia = [BOYA, KRISP]
    const t = await dung()
    await t.bam()
    t.tin({ viec: 'chon-mic', id: 'by' }); await cho()
    await t.bam(); await t.bam()
    expect(localStorage.getItem('ddh.live.mic')).toBe('by')
    expect(t.ten('moMic').map((a) => a[0])).not.toContain('kr')
    expect(t.ten('datLocOn')).toEqual([]); expect(t.ten('datKieuTieng')).toEqual([])
  })
  it('không có Krisp ⇒ không đổi gì (mic, lọc, tiếng, cờ)', async () => {
    localStorage.setItem('ddh.live.mic', 'by'); localStorage.setItem('ddh.live.loc-on', 'manh')
    dsGia = [BOYA, MAY]
    const t = await dung()
    await t.bam()
    expect(localStorage.getItem('ddh.live.mic')).toBe('by')
    expect(localStorage.getItem('ddh.live.loc-on')).toBe('manh')
    expect(localStorage.getItem('ddh.live.krisp-da-chon')).toBeNull()
    expect(t.ten('datLocOn')).toEqual([]); expect(t.ten('datKieuTieng')).toEqual([])
  })
  it('đang live khi Krisp mới xuất hiện ⇒ không tự đổi mic giữa giờ', async () => {
    localStorage.setItem('ddh.live.mic', 'by'); localStorage.setItem('ddh.live.da-bat', '1')
    dsGia = [BOYA, KRISP]
    const t = await dung({ live: true })
    await t.bam() // đang live: bấm ⇒ mở thẻ mic
    expect(localStorage.getItem('ddh.live.mic')).toBe('by')
    expect(t.ten('moMic').map((a) => a[0])).not.toContain('kr')
    expect(localStorage.getItem('ddh.live.krisp-da-chon')).toBeNull()
  })
  it('máy từng live (bấm là live ngay): lần đầu thấy Krisp ⇒ mở thẻ mic, KHÔNG live ngay; đã chọn rồi ⇒ bấm là live ngay như cũ', async () => {
    localStorage.setItem('ddh.live.mic', 'by'); localStorage.setItem('ddh.live.da-bat', '1')
    dsGia = [BOYA, KRISP]
    const t = await dung()
    await t.bam()
    expect(t.ten('bat')).toEqual([])
    expect(localStorage.getItem('ddh.live.mic')).toBe('kr')
    expect(localStorage.getItem('ddh.live.krisp-da-chon')).toBe('1')
    const t2 = await dung()
    await t2.bam() // thẻ đang đóng (dựng lại module) ⇒ live ngay
    expect(t2.ten('bat').length).toBe(1)
  })
  it('máy từng live, không có Krisp ⇒ bấm là live ngay như cũ', async () => {
    localStorage.setItem('ddh.live.mic', 'by'); localStorage.setItem('ddh.live.da-bat', '1')
    dsGia = [BOYA]
    const t = await dung()
    await t.bam()
    expect(t.ten('bat').length).toBe(1)
  })
})
