// @vitest-environment node
// LIVE BẢNG — NỐI DÂY ĐẦU-CUỐI không cần SFU: bộ máy bút THẬT của máy thầy (`taoLoiBut().taoSo()`) → `taoLiveThay` → phòng THẬT (Durable Object, ctx giả)
// → `taoLiveEm` → `apSuKien` của bộ máy bút trên máy em. Đây là đường «chỉ hình» khi Worker chưa có khoá SFU (`tieng: 'chua-cau-hinh'`),
// cũng là đường dự phòng của máy em không mở được DataChannel.
// Khoá: nét máy em dựng lại GIỐNG HỆT nét máy thầy (từng số); đang viết thì nét dở lớn dần theo tay thầy; viết trước khi bật live vẫn tới;
// tẩy / hoàn tác / làm lại / sang trang đúng; em nối lại và em vào muộn bắt kịp; thầy gửi ≤ 30 lô/giây; rời màn thì bỏ điểm đang viết.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoLoiBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { taoLiveEm, taoLiveThay, type TrangThaiLiveEm, type TrangThaiLiveThay } from '../src/lib/live'
import { datWebSocketPairGia, nhiPhan, taoDongHoGia, taoKenhGia, taoPhongGia, type PhongGia, type WsGia } from './_live-phong-gia'

const loi = taoLoiBut()
const MAU = 'rgb(244,239,228)'

async function dung(soEm = 2) {
  const ph = taoPhongGia(), dh = taoDongHoGia()
  await ph.khoi(Array.from({ length: soEm }, (_, i) => ({ sbd: `S${i + 1}` })), { cho: true, sfu: false })
  const gv = await ph.noi('gv'), kGv = taoKenhGia(ph, gv)
  let dem = 0
  const so = loi.taoSo({ taoId: (n) => `n${n}-${++dem}` })
  so.datTiLe(1.9512)
  const ttThay: TrangThaiLiveThay[] = []
  const lt = taoLiveThay({ ve: 've-gv', goc: 'https://may-chu.example', kenh: kGv.kenh, layAnh: () => ({ trang: so.trang(), ...so.xuat() }), khiTrangThai: (t) => ttThay.push(t), moiTruong: dh.mt })
  gv.nhan = (d) => lt.nhanTinPhong(d)
  so.nghe((sk) => lt.nhanSuKienBut(sk))
  const kenh = [kGv]
  /** Một máy em: thư viện live + mảng nét mà lớp vẽ giữ (áp sự kiện bằng bộ máy bút). */
  async function em(sbd: string) {
    const ds: NetBut[] = [], sk: SuKienBut[] = [], tt: TrangThaiLiveEm[] = []
    let ws: WsGia = await ph.noi('hs', sbd)
    let kn = taoKenhGia(ph, ws)
    const k = { gui: (tin: Record<string, unknown>) => kn.kenh.gui(tin), guiNhiPhan: (x: Uint8Array) => kn.kenh.guiNhiPhan(x) }
    kenh.push({ kenh: k, xong: () => kn.xong() })
    const le = taoLiveEm({ ve: 've-hs', goc: 'https://may-chu.example', kenh: k, khiBut: (s) => { sk.push(s); loi.apSuKien(ds, s) }, khiTrangThai: (t) => tt.push(t), moiTruong: dh.mt })
    ws.nhan = (d) => le.nhanTinPhong(d)
    await ph.gui(ws, { t: 'vao' }); await ph.gui(ws, { t: 'chao' })
    return {
      le, ds, sk, tt, ws: () => ws,
      rot: async () => { ws.nhan = undefined; await ph.dong(ws) },
      noiLai: async () => { ws = await ph.noi('hs', sbd); kn = taoKenhGia(ph, ws); ws.nhan = (d) => le.nhanTinPhong(d); await ph.gui(ws, { t: 'chao' }); le.khiNoiLai(); await kn.xong() },
    }
  }
  /** Thời gian trôi `ms`: hẹn giờ của thư viện, tin đang trên đường, hẹn giờ của phòng. */
  async function troi(ms: number) {
    for (let con = ms; con > 0; con -= 4) {
      dh.tien(Math.min(4, con))
      for (const k of kenh) await k.xong()
      await vi.advanceTimersByTimeAsync(Math.min(4, con))
    }
    for (const k of kenh) await k.xong()
  }
  await ph.gui(gv, { t: 'chao' })
  return { ph, dh, gv, so, lt, ttThay, em, troi }
}
/** Thầy viết MỘT nét `n` điểm (200 điểm/giây, mỗi 16 ms một lô như tờ chiếu), máy em vẽ mỗi khung; trả số điểm nét dở của máy em sau từng khung. */
async function viet(b: Awaited<ReturnType<typeof dung>>, cac: { le: { khung(nay?: number): unknown }; ds: NetBut[] }[], n: number, y = 0.3, nhac = true) {
  const net = b.so.batDau({ mau: MAU, co: 2.3, diem: loi.diem(100, y * 820, 0.5, 0, 1600, 820) })
  const lon: number[] = []
  for (let i = 1; i < n;) {
    const lo = []
    for (let k = 0; k < 3 && i < n; k++, i++) lo.push(loi.diem(100 + i * 4, y * 820 + Math.sin(i / 6) * 30, 0.4 + (i % 5) / 20, i * 5, 1600, 820))
    b.so.themDiem(lo)
    await b.troi(16)
    for (const e of cac) e.le.khung(b.dh.gio())
    lon.push(cac[0]?.ds.find((x) => x.id === net.id)?.diem.length ?? 0)
  }
  if (nhac) b.so.ketThuc()
  return { id: net.id, lon }
}
const veCho = async (b: Awaited<ReturnType<typeof dung>>, cac: { le: { khung(nay?: number): unknown } }[], ms: number) => { for (let t = 0; t < ms; t += 16) { await b.troi(16); for (const e of cac) e.le.khung(b.dh.gio()) } }
const demLo = (ph: PhongGia, ws: WsGia) => { void ph; return nhiPhan(ws).filter((k) => k[0] === 0x21).length }

describe('live đầu-cuối qua phòng (chưa có SFU ⇒ chỉ hình)', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }) })
  afterEach(() => { vi.useRealTimers() })

  it('viết TRƯỚC khi bật live vẫn tới máy em; bật live ⇒ máy em nhận `bat`, báo `live-ok`, thầy thấy số em xem; trạng thái báo «chưa cấu hình tiếng»', async () => {
    const b = await dung()
    const e1 = await b.em('S1')
    await b.lt.noiSan()
    await b.troi(50)
    expect(b.lt.trangThai()).toMatchObject({ pha: 'san', tieng: 'chua-cau-hinh', kenhNet: 'ws' })
    expect(e1.le.trangThai()).toMatchObject({ duocXem: true, san: true, bat: false, tieng: 'chua-cau-hinh' })
    await viet(b, [e1], 30)
    await b.troi(50)
    expect(e1.ds).toEqual(b.so.ds()) // chưa live: nét xong vẫn vào sổ và tới máy em (tải ngầm)
    expect(demLo(b.ph, e1.ws())).toBe(0) // chưa live thì không có lô điểm đang viết
    expect((await b.lt.bat({ khongTieng: true })).ok).toBe(true)
    await b.troi(400)
    expect(b.lt.trangThai()).toMatchObject({ pha: 'live', tieng: 'chua-cau-hinh', xem: 1, xemWs: 1, mayKhacLive: false })
    expect(e1.le.trangThai()).toMatchObject({ bat: true, duBang: true, kenhNet: 'ws', nghe: false })
    expect(e1.ds).toEqual(b.so.ds())
    expect(e1.le.bang()).toMatchObject({ trang: b.so.trang(), tiLe: 1.9512 })
    b.lt.tat()
    await b.troi(50)
    expect(e1.le.trangThai().bat).toBe(false)
    expect(b.lt.trangThai()).toMatchObject({ pha: 'san', tu: null })
  })
  it('ĐANG VIẾT: nét dở trên máy em lớn dần theo tay thầy (không đợi nét xong); xong ⇒ GIỐNG HỆT nét máy thầy; thầy gửi ≤ 30 lô/giây', async () => {
    const b = await dung()
    const e1 = await b.em('S1'), e2 = await b.em('S2')
    await b.lt.bat({ khongTieng: true }); await b.troi(400)
    const t0 = b.dh.gio(), r = await viet(b, [e1, e2], 200, 0.3, false)
    const giay = (b.dh.gio() - t0) / 1000
    // Lớn dần: không bao giờ co lại, đã có điểm từ sớm, gần cuối đã theo kịp ≥ 80 % số điểm thầy viết.
    for (let i = 1; i < r.lon.length; i++) expect(r.lon[i]!).toBeGreaterThanOrEqual(r.lon[i - 1]!)
    expect(r.lon[Math.floor(r.lon.length / 4)]!).toBeGreaterThan(10)
    expect(r.lon[r.lon.length - 1]!).toBeGreaterThan(160)
    expect(e1.sk.filter((s) => s.loai === 'them-diem').length).toBeGreaterThan(20)
    const lo = demLo(b.ph, e1.ws())
    expect(lo / giay).toBeLessThanOrEqual(30)
    expect(lo / giay).toBeGreaterThan(20)
    // Đầu nét nội suy nằm giữa các điểm đã phát và điểm kế tiếp.
    const kh = e1.le.khung(b.dh.gio())
    expect(kh.dau.length).toBe(1)
    expect(kh.dau[0]!.id).toBe(r.id)
    b.so.ketThuc()
    await veCho(b, [e1, e2], 400)
    for (const e of [e1, e2]) {
      expect(e.ds).toEqual(b.so.ds())
      expect(loi.dungNet(e.ds[0]!, loi.khung(1280, 656))).toEqual(loi.dungNet(b.so.ds()[0]!, loi.khung(1280, 656)))
      expect(e.le.khung(b.dh.gio()).dau).toEqual([])
    }
    // Nét dở đã phát đủ điểm ⇒ bản chốt chỉ báo `net-xong`, không vẽ lại.
    expect(e1.sk.filter((s) => s.loai === 'net-xong').length).toBe(1)
    expect(e1.sk.filter((s) => s.loai === 'xoa' || (s.loai === 'net-moi' && s.xong)).length).toBe(0)
    expect(b.lt.soDo()).toMatchObject({ goiDc: 0, kenhNet: 'ws' })
    expect(e1.le.soDo().kenhNet).toBe('ws')
  })
  it('tẩy, hoàn tác (nét về ĐÚNG chỗ cũ), làm lại, sang trang rồi quay lại: mảng nét máy em luôn bằng máy thầy', async () => {
    const b = await dung()
    const e1 = await b.em('S1')
    await b.lt.bat({ khongTieng: true }); await b.troi(400)
    for (const y of [0.2, 0.4, 0.6, 0.8]) await viet(b, [e1], 20, y)
    await veCho(b, [e1], 300)
    const bang = () => b.so.ds().map((n) => ({ id: n.id, cong: n.cong, mau: n.mau, co: n.co, diem: n.diem }))
    expect(e1.ds).toEqual(bang())
    const ids = b.so.ds().map((n) => n.id)
    b.so.xoa([ids[1]!, ids[2]!]); await b.troi(60)
    expect(e1.ds.map((n) => n.id)).toEqual([ids[0], ids[3]])
    b.so.hoanTac(); await b.troi(60)
    expect(e1.ds).toEqual(bang())
    expect(e1.ds.map((n) => n.id)).toEqual(ids)
    b.so.hoanTac(); await b.troi(60) // hoàn tác nét thứ tư
    expect(e1.ds.map((n) => n.id)).toEqual(ids.slice(0, 3))
    b.so.lamLai(); await b.troi(60)
    expect(e1.ds).toEqual(bang())
    b.so.xoaHet(); await b.troi(60)
    expect(e1.ds).toEqual([])
    b.so.hoanTac(); await b.troi(60)
    expect(e1.ds).toEqual(bang())
    // Thầy chuyển câu ⇒ bảng mới; viết; quay lại câu cũ ⇒ các nét cũ về đủ.
    b.so.doiTrang('2'); await b.troi(60)
    expect(e1.ds).toEqual([])
    expect(e1.le.bang().trang).toBe('2')
    await viet(b, [e1], 15, 0.5); await veCho(b, [e1], 300)
    expect(e1.ds).toEqual(bang())
    b.so.doiTrang(''); await b.troi(60)
    expect(e1.ds).toEqual(bang())
    expect(e1.ds.map((n) => n.id)).toEqual(ids)
  })
  it('em RỚT MẠNG rồi nối lại nhận đúng phần thiếu; em VÀO MUỘN lúc đang live nhận cả bảng; rời màn thì bỏ điểm đang viết, về lại vẫn đủ nét', async () => {
    const b = await dung(3)
    const e1 = await b.em('S1')
    await b.lt.bat({ khongTieng: true }); await b.troi(400)
    await viet(b, [e1], 20, 0.2); await veCho(b, [e1], 300)
    await e1.rot()
    await viet(b, [], 20, 0.4); await viet(b, [], 20, 0.6); await b.troi(100)
    expect(e1.ds.length).toBe(1)
    await e1.noiLai(); await b.troi(400)
    expect(e1.ds).toEqual(b.so.ds())
    expect(e1.sk.filter((s) => s.loai === 'trang').length).toBe(1) // bù phần thiếu, KHÔNG dựng lại cả bảng (sự kiện `trang` duy nhất là ảnh lúc bật live)
    // Em vào muộn.
    const e2 = await b.em('S2')
    await b.troi(400)
    expect(e2.ds).toEqual(b.so.ds())
    expect(e2.le.trangThai()).toMatchObject({ bat: true, duBang: true })
    expect(b.lt.trangThai().xem).toBe(2)
    // Rời màn giữa lúc thầy đang viết: không nhận điểm đang viết; về lại, nét xong vẫn tới qua sổ.
    e2.le.datRoiMan(true)
    await viet(b, [e1, e2], 40, 0.8)
    await veCho(b, [e1, e2], 300)
    e2.le.datRoiMan(false)
    expect(e2.sk.filter((s) => s.loai === 'them-diem').length).toBe(0)
    expect(e2.ds).toEqual(b.so.ds())
    expect(e1.ds).toEqual(b.so.ds())
  })
  it('máy thầy thứ hai bấm Live khi buổi đang live ⇒ «đang live ở máy khác»; công tắc tắt ⇒ thư viện không gửi gì', async () => {
    const b = await dung()
    await b.lt.bat({ khongTieng: true }); await b.troi(100)
    const gv2 = await b.ph.noi('gv'), k2 = taoKenhGia(b.ph, gv2)
    const lt2 = taoLiveThay({ ve: 'v', goc: 'g', kenh: k2.kenh, moiTruong: b.dh.mt })
    gv2.nhan = (d) => lt2.nhanTinPhong(d)
    await b.ph.gui(gv2, { t: 'chao' })
    expect(await lt2.bat({ khongTieng: true })).toEqual({ ok: false, lyDo: 'dang-live' })
    expect(lt2.trangThai().mayKhacLive).toBe(true)
    // Công tắc tắt: phòng không có khối live ⇒ `bat` từ chối, sự kiện bút không sinh khung nào.
    const ph3 = taoPhongGia()
    await ph3.khoi([{ sbd: 'S1' }], { cho: false, sfu: true })
    const gv3 = await ph3.noi('gv'), k3 = taoKenhGia(ph3, gv3)
    const da: unknown[] = []
    const lt3 = taoLiveThay({ ve: 'v', goc: 'g', kenh: { gui: (t) => { da.push(t); k3.kenh.gui(t) }, guiNhiPhan: (k) => { da.push(k); k3.kenh.guiNhiPhan(k) } }, moiTruong: b.dh.mt })
    gv3.nhan = (d) => lt3.nhanTinPhong(d)
    await ph3.gui(gv3, { t: 'chao' })
    expect(await lt3.bat({ khongTieng: true })).toEqual({ ok: false, lyDo: 'chua-san' })
    lt3.nhanSuKienBut({ loai: 'net-moi', trang: '', net: { id: 'a', cong: 'but', mau: MAU, co: 2, diem: [[0.1, 0.1, 0.5, 0]] } })
    lt3.nhanSuKienBut({ loai: 'net-xong', trang: '', id: 'a' })
    expect(da).toEqual([])
  })
})
