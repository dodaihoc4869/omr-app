// LIVE — TRỄ TIẾNG (thầy 11/11: «làm cho tức thì tốt nhất thế giới hiện tại», «tiếng phải trong nhất»). Phần THUẦN: ước tính trễ, đường nối tới SFU, khung Opus.
// Số đo thật trên Chromium (trước / sau, từng chặng): scripts/thu-live-1011/do-tre.mjs → docs/do-live-1011.md mục 5.
import { describe, expect, it } from 'vitest'
import { TRE_CHUOI, TRE_CO_DINH_EM, treKhungOpus, treTiengUocTinh } from '../src/lib/live/so-do'
import { docSoWebRtc, OPUS_THAY, suaSdpOpus } from '../src/lib/live/sfu'
import { LAM_RO } from '../src/lib/live/chuoi-tieng'

const SDP = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n'

describe('trễ tiếng ước tính', () => {
  it('cộng đúng từng phần: thu + chuỗi + khung Opus + nửa RTT mỗi phía + đệm rung máy em; thiếu số máy em ⇒ `du: false` và chỉ ra phần máy thầy', () => {
    expect(treKhungOpus(10)).toBe(12)
    expect(treKhungOpus(20)).toBe(17)
    expect(treTiengUocTinh({ thu: 10, chuoi: TRE_CHUOI.khung!, ma: treKhungOpus(10), mangThay: 24, mangEm: 30, demEm: 32 })).toEqual({ ms: 10 + 0 + 12 + 12 + 15 + 32, du: true })
    expect(treTiengUocTinh({ thu: 10, chuoi: TRE_CHUOI.nen!, ma: treKhungOpus(20), mangThay: 24, mangEm: null, demEm: null })).toEqual({ ms: 10 + 33 + 17 + 12, du: false })
    // chuỗi từng khung không thêm trễ; hai kiểu Web Audio có (đo Chromium)
    expect(TRE_CHUOI.khung).toBe(0)
    expect(TRE_CHUOI.nhanh).toBeGreaterThan(15)
    expect(TRE_CHUOI.nen).toBeGreaterThan(TRE_CHUOI.nhanh!)
    expect(TRE_CO_DINH_EM).toBe(65) // đệm phát nét của máy em đang dựa vào hằng số này
    // MÁY THẬT 11/11: mic USB báo bộ đệm thu ÂM ⇒ từng hiện «trễ tiếng ước tính −121 ms». Phần nào âm / không phải số thì bỏ, tổng không bao giờ âm.
    expect(treTiengUocTinh({ thu: -158, chuoi: 0, ma: 17, mangThay: 24, mangEm: 20, demEm: 8 }).ms).toBe(17 + 12 + 10 + 8)
    expect(treTiengUocTinh({ thu: NaN, chuoi: 0, ma: 17, mangThay: -5, mangEm: null, demEm: null }).ms).toBe(17)
  })
  it('đường nối tới SFU đọc từ `getStats`: loại ứng viên + giao thức của cặp đang dùng, kèm RTT (thầy nhìn được có rơi về TURN / TCP không)', () => {
    const bc = (uv: Record<string, unknown>) => new Map<string, unknown>([
      ['cp', { type: 'candidate-pair', nominated: true, currentRoundTripTime: 0.018, localCandidateId: 'L1' }],
      ['L1', { type: 'local-candidate', id: 'L1', ...uv }], ['L2', { type: 'local-candidate', id: 'L2', candidateType: 'host', protocol: 'tcp' }],
    ]) as unknown as RTCStatsReport
    expect(docSoWebRtc(bc({ candidateType: 'srflx', protocol: 'udp' }))).toMatchObject({ rtt: 18, duong: 'srflx/udp' })
    expect(docSoWebRtc(bc({ candidateType: 'relay', protocol: 'udp', relayProtocol: 'tcp' })).duong).toBe('relay/tcp')
    expect(docSoWebRtc(new Map() as unknown as RTCStatsReport).duong).toBeNull()
  })
})

describe('Opus của thầy + bộ nâng mức', () => {
  it('khung Opus của thầy ghi vào SDP bằng `a=ptime`; 64 kb/s mono dải rộng, sửa lỗi trong băng, không DTX', () => {
    const s = suaSdpOpus(SDP, OPUS_THAY)
    expect(s).toMatch(/a=fmtp:111 [^\r\n]*maxaveragebitrate=64000/)
    expect(s).toMatch(/usedtx=0/)
    expect(s).toMatch(/useinbandfec=1/)
    expect(s).toMatch(/stereo=0/)
    const ptime = OPUS_THAY.ptime ?? 20
    if (ptime === 20) expect(s).not.toMatch(/a=ptime:/)
    else expect(s).toContain(`a=ptime:${ptime}`)
    expect(suaSdpOpus(SDP, { ...OPUS_THAY, ptime: 10 })).toContain('a=ptime:10')
  })
  it('bộ nâng mức nhẹ tay: nhắm −18 … −14 dBFS RMS, trần đỉnh dưới 0 dBFS, trôi chậm (không «thở»)', () => {
    const db = (v: number) => 20 * Math.log10(v)
    expect(db(LAM_RO.dich)).toBeGreaterThanOrEqual(-19) // đo ở đầu nhận: mức nói ≈ đích + 2 dB ⇒ rơi vào −18 … −14 dBFS
    expect(db(LAM_RO.dich)).toBeLessThanOrEqual(-14)
    expect(db(LAM_RO.tran)).toBeLessThanOrEqual(-2) // đỉnh gửi đi ≤ −2 dBFS
    expect(db(LAM_RO.tran)).toBeGreaterThan(-3) // chặn đỉnh chỉ chạm khi sắp vỡ
    expect(LAM_RO.len).toBeLessThanOrEqual(3) // dB / giây
  })
})
