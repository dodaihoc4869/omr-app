// @vitest-environment node
// LIVE BẢNG — mã hoá nhị phân nét (src/lib/live/ma-net.ts) + sửa SDP Opus (src/lib/live/sfu.ts). Đặc tả mục 4.2, 4.3.
// Khoá: khứ hồi KHÔNG MẤT so với bộ máy bút (cùng số ⇒ cùng hình); nét rất dài chia nhiều khung ≤ 16 KB; gói lạc phiên bị bỏ; khung hỏng / quá 16 KB bị từ chối;
// gói điểm ≤ 1.100 byte; mất gói lẻ không thủng nét nhờ lô lặp.
import { describe, expect, it } from 'vitest'
import { taoLoiBut, type DiemBut, type NetBut } from '../src/lib/but-bang-loi'
import { KHUNG_TOI_DA } from '../src/lib/bpu/phong-live'
import { DIEM_TOI_DA_MOT_GOI, DIEM_TOI_DA_MOT_KHUNG, GOI_DIEM_TOI_DA, giaiGoi, giaiSo, maBangMoi, maGoiDiem, maHoanTac, maNetXong, maNhac, maTro, maXoaHet, maXoaNet } from '../src/lib/live/ma-net'
import { taoDemPhat } from '../src/lib/live/noi-suy'
import { suaSdpOpus } from '../src/lib/live/sfu'

const loi = taoLoiBut()
/** Nét thật của bộ máy bút: điểm đi qua `LoiBut.diem` (làm tròn 5 số lẻ, áp lực 2 số lẻ, t nguyên). */
function netBut(id: string, n: number, cong: 'but' | 'tay' = 'but'): NetBut {
  const diem: DiemBut[] = []
  for (let i = 0; i < n; i++) diem.push(loi.diem(100 + i * 3.7 + Math.sin(i / 5) * 40, 300 + Math.cos(i / 7) * 120, 0.3 + 0.5 * Math.abs(Math.sin(i / 11)), i * 5 + (i % 3), 1600, 820))
  return { id, cong, mau: 'rgb(244,239,228)', co: 2.3, diem }
}

describe('sổ nét — khứ hồi không mất', () => {
  it('nét xong: giải ra ĐÚNG từng số của bộ máy bút ⇒ đường bao dựng ra y hệt', () => {
    const net = netBut('nk3f9a1b', 180)
    const khung = maNetXong(net)
    expect(khung.length).toBe(1)
    const m = giaiSo(khung[0]!)!
    expect(m).toMatchObject({ k: 'net', stt: 0, vt: null, tu: 0, het: true })
    if (m.k !== 'net') throw new Error('sai loại')
    expect(m.net).toEqual(net)
    const kh = loi.khung(1280, 656)
    expect(loi.dungNet(m.net, kh)).toEqual(loi.dungNet(net, kh))
    // Vị trí chèn (hoàn tác xoá / làm lại) + bút tẩy + bề rộng lẻ.
    const tay = { ...netBut('n2', 3, 'tay'), co: 7.25 }
    const m2 = giaiSo(maNetXong(tay, 4)[0]!)!
    expect(m2).toMatchObject({ k: 'net', vt: 4, net: tay })
    // Nét một điểm (chấm) và nét rỗng.
    expect(giaiSo(maNetXong(netBut('cham', 1))[0]!)).toMatchObject({ k: 'net', net: netBut('cham', 1) })
    expect(giaiSo(maNetXong({ ...net, diem: [] })[0]!)).toMatchObject({ k: 'net', het: true, net: { diem: [] } })
  })
  it('nét rất dài chia nhiều khung, mỗi khung ≤ 16 KB; ghép lại đủ và đúng', () => {
    const net = netBut('dai', DIEM_TOI_DA_MOT_KHUNG * 2 + 37)
    const khung = maNetXong(net)
    expect(khung.length).toBe(3)
    for (const k of khung) expect(k.length).toBeLessThanOrEqual(KHUNG_TOI_DA)
    const phan = khung.map((k) => giaiSo(k)!)
    expect(phan.map((m) => (m.k === 'net' ? [m.tu, m.het] : null))).toEqual([[0, false], [DIEM_TOI_DA_MOT_KHUNG, false], [DIEM_TOI_DA_MOT_KHUNG * 2, true]])
    expect(phan.flatMap((m) => (m.k === 'net' ? m.net.diem : []))).toEqual(net.diem)
  })
  it('xoá nét (nhiều mã), xoá hết, bảng mới (khoá trang + tỉ lệ), hoàn tác', () => {
    expect(giaiSo(maXoaNet(['a', 'bé-ơi', 'c'])[0]!)).toEqual({ stt: 0, k: 'xoa', id: ['a', 'bé-ơi', 'c'] })
    expect(giaiSo(maXoaNet('một')[0]!)).toEqual({ stt: 0, k: 'xoa', id: ['một'] })
    expect(maXoaNet(Array.from({ length: 450 }, (_, i) => `n${i}`)).length).toBe(3)
    expect(giaiSo(maXoaHet())).toEqual({ stt: 0, k: 'xoa-het' })
    expect(giaiSo(maBangMoi('7', 1.7778))).toEqual({ stt: 0, k: 'bang', trang: '7', tiLe: 1.7778 })
    expect(giaiSo(maHoanTac())).toEqual({ stt: 0, k: 'hoan-tac' })
  })
  it('khung hỏng / lạ / quá 16 KB ⇒ null, không ném', () => {
    expect(giaiSo(new Uint8Array(0))).toBeNull()
    expect(giaiSo(new Uint8Array([0x11, 0, 0, 0, 0]))).toBeNull() // thiếu thân
    expect(giaiSo(new Uint8Array([0x99, 0, 0, 0, 0, 1, 2]))).toBeNull()
    const to = new Uint8Array(KHUNG_TOI_DA + 1); to[0] = 0x13
    expect(giaiSo(to)).toBeNull()
    const cut = maNetXong(netBut('x', 50))[0]!
    expect(giaiSo(cut.subarray(0, cut.length - 5))).toBeNull() // bị cắt cụt
    expect(giaiGoi(new Uint8Array([0x21, 0, 0, 0, 0, 0, 0, 200]))).toBeNull()
  })
})

describe('điểm đang viết', () => {
  const net = netBut('n-dang-viet', 40)
  const dau = { id: net.id, cong: net.cong, mau: net.mau, co: net.co }
  it('gói điểm khứ hồi đúng: t của điểm vẫn là ms từ đầu nét; gói ≤ 1.100 byte; quá nhiều điểm ⇒ lấy phần đuôi', () => {
    const g = giaiGoi(maGoiDiem({ phien: 3, tGui: 5120, dau, tGoc: 5000, tu: 8, diem: net.diem.slice(8, 20) }))!
    expect(g).toMatchObject({ k: 'diem', phien: 3, tGui: 5120, tGoc: 5000, tu: 8, dau })
    if (g.k !== 'diem') throw new Error('sai loại')
    expect(g.diem).toEqual(net.diem.slice(8, 20))
    const dai = netBut('dai', DIEM_TOI_DA_MOT_GOI + 30)
    const goi = maGoiDiem({ phien: 1, tGui: 0, dau: { ...dau, id: 'x'.repeat(60), mau: 'y'.repeat(60) }, tGoc: 0, tu: 0, diem: dai.diem })
    expect(goi.length).toBeLessThanOrEqual(GOI_DIEM_TOI_DA)
    const gd = giaiGoi(goi)!
    expect(gd.k === 'diem' && [gd.tu, gd.diem.length]).toEqual([30, DIEM_TOI_DA_MOT_GOI])
    expect(gd.k === 'diem' && gd.diem).toEqual(dai.diem.slice(30))
    expect(giaiGoi(maTro({ phien: 3, tGui: 9, x: 0.1234, y: 0.9876 }))).toEqual({ phien: 3, tGui: 9, k: 'tro', x: 0.1234, y: 0.9876 })
    expect(giaiGoi(maNhac({ phien: 3, tGui: 9, id: net.id, tong: 40 }))).toEqual({ phien: 3, tGui: 9, k: 'nhac', id: net.id, tong: 40 })
  })
  it('gói lạc phiên cũ bị bỏ', () => {
    const goi = maGoiDiem({ phien: 3, tGui: 1, dau, tGoc: 0, tu: 0, diem: net.diem.slice(0, 4) })
    expect(giaiGoi(goi, 3)).not.toBeNull()
    expect(giaiGoi(goi, 4)).toBeNull()
    expect(giaiGoi(maTro({ phien: 2, tGui: 1, x: 0, y: 0 }), 3)).toBeNull()
  })
  it('mất MỘT gói lẻ không thủng nét nhờ lô lặp (gói = lô trước + lô mới)', () => {
    const dem = taoDemPhat()
    // Thầy gửi 10 lô, mỗi lô 4 điểm, gói mang cả lô liền trước; gói thứ 3 và thứ 7 mất.
    for (let lo = 0; lo < 10; lo++) {
      if (lo === 3 || lo === 7) continue
      const tu = Math.max(0, (lo - 1) * 4), den = (lo + 1) * 4
      dem.nap(giaiGoi(maGoiDiem({ phien: 1, tGui: 1000 + lo * 20, dau, tGoc: 1000, tu, diem: net.diem.slice(tu, den) }), 1)!, 5000 + lo * 20)
    }
    dem.nap(giaiGoi(maNhac({ phien: 1, tGui: 1200, id: net.id, tong: 40 }), 1)!, 5200)
    const ra: DiemBut[] = []
    let xong = false
    for (let t = 5000; t < 6000 && !xong; t += 16) for (const n of dem.khung(t).net) { ra.push(...n.moi); xong = xong || n.xong }
    expect(xong).toBe(true)
    expect(ra).toEqual(net.diem) // đủ 40 điểm, đúng thứ tự, không trùng
    expect(dem.soDo(6000).mat).toBe(0)
  })
  it('mất HAI gói liền ⇒ nối thẳng qua chỗ thủng, đếm số điểm mất (bản chốt từ sổ nét sẽ thay)', () => {
    const dem = taoDemPhat()
    for (const lo of [0, 1, 4, 5]) { const tu = Math.max(0, (lo - 1) * 4), den = (lo + 1) * 4; dem.nap(giaiGoi(maGoiDiem({ phien: 1, tGui: 1000 + lo * 20, dau, tGoc: 1000, tu, diem: net.diem.slice(tu, den) }))!, 5000 + lo * 20) }
    const ra: DiemBut[] = []
    for (let t = 5000; t < 6000; t += 16) for (const n of dem.khung(t).net) ra.push(...n.moi)
    expect(ra).toEqual([...net.diem.slice(0, 8), ...net.diem.slice(12, 24)])
    expect(dem.soDo(6000).mat).toBe(4)
  })
})

describe('SDP Opus của máy thầy (đặc tả 4.2)', () => {
  const SDP = ['v=0', 'm=audio 9 UDP/TLS/RTP/SAVPF 111 63', 'a=rtpmap:111 opus/48000/2', 'a=fmtp:111 minptime=10;useinbandfec=1', 'a=rtpmap:63 red/48000/2', 'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', ''].join('\r\n')
  it('bật DTX + FEC, mono, trần 24 kb/s; giữ tham số sẵn có; không đụng dòng khác', () => {
    const s = suaSdpOpus(SDP)
    expect(s).toContain('a=fmtp:111 minptime=10;useinbandfec=1;stereo=0;sprop-stereo=0;usedtx=1;maxaveragebitrate=24000\r\n')
    expect(s).toContain('a=rtpmap:63 red/48000/2\r\nm=application')
    expect(s.split('\r\n').length).toBe(SDP.split('\r\n').length)
    expect(suaSdpOpus(s)).toBe(s) // áp hai lần không đổi
  })
  it('tuỳ chọn Đợt 0: tắt DTX, khung 10 ms, bitrate khác; không có dòng fmtp thì thêm; không có Opus thì giữ nguyên', () => {
    const s = suaSdpOpus(SDP, { dtx: false, ptime: 10, bitrate: 32000 })
    expect(s).toContain('usedtx=0')
    expect(s).toContain('maxaveragebitrate=32000')
    expect(s).toContain('\r\na=ptime:10\r\n')
    const khongFmtp = SDP.replace('a=fmtp:111 minptime=10;useinbandfec=1\r\n', '')
    expect(suaSdpOpus(khongFmtp)).toContain('a=rtpmap:111 opus/48000/2\r\na=fmtp:111 stereo=0;sprop-stereo=0;useinbandfec=1;usedtx=1;maxaveragebitrate=24000\r\n')
    expect(suaSdpOpus('v=0\r\nm=audio 9 RTP/AVP 0\r\n')).toBe('v=0\r\nm=audio 9 RTP/AVP 0\r\n')
  })
})
