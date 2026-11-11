// ĐO TIẾNG TỪ XA (11/11 tối — thầy: «mất tiếng thật» mà mọi bộ thử đều xanh ⇒ lần live kế tiếp phải TỰ trả lời câu hỏi «câm ở đâu»).
// Mỗi máy (em + thầy) cứ ≈ 5 giây đo một cửa sổ 2 giây trên PeerConnection của mình: trạng thái nối + ICE, loại đường đang dùng, và cho TỪNG luồng tiếng nhận:
// số kb/s thật sự tới, năng lượng tiếng (`inbound-rtp.totalAudioEnergy` — Chrome chỉ tăng khi có thẻ đang kéo tiếng ra loa), thẻ <audio> có dừng / tắt tiếng /
// âm lượng / `currentTime` có chạy; nếu máy đang phát mic: kb/s gửi + mức tiếng nguồn (`media-source`). Bản tóm tắt gọn đi kèm tin `live-do` có sẵn (trường `ti`);
// phòng giữ bản mới nhất của mỗi máy, chuyển cho máy thầy và ghi một dòng nhật ký máy chủ mỗi 10 giây khi đang live. Thuần ngoài hai hàm đọc số đo.

import type { SoNhan, SoTieng } from './so-tieng'
export type { SoNhan, SoTieng } from './so-tieng'

interface AnhNhan { byte: number; goi: number; nl: number | null; pt: { d: boolean; ct: number; m: boolean; v: number } | null }
interface Anh { luc: number; cs: string; ice: string; uv: string; n: AnhNhan | null; b: AnhNhan | null; g: { byte: number; muc: number; nl: number } | null }
export interface NguonDo { pc: RTCPeerConnection | null; n?: { thu: RTCRtpReceiver | null; the: HTMLMediaElement | null }; b?: { thu: RTCRtpReceiver | null; the: HTMLMediaElement | null }; g?: RTCRtpSender | null }

const so = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
async function anhNhan(r: { thu: RTCRtpReceiver | null; the: HTMLMediaElement | null } | undefined): Promise<AnhNhan | null> {
  if (!r?.thu?.getStats) return null
  let a: AnhNhan | null = null
  try { (await r.thu.getStats()).forEach((s: Record<string, unknown>) => { if (s.type === 'inbound-rtp') a = { byte: so(s.bytesReceived), goi: so(s.packetsReceived), nl: typeof s.totalAudioEnergy === 'number' ? s.totalAudioEnergy : null, pt: null } }) } catch { return null }
  const e = r.the
  if (a && e?.srcObject) (a as AnhNhan).pt = { d: e.paused, ct: e.currentTime, m: e.muted, v: e.volume }
  return a
}
/** Chụp một lần các số đo cần thiết. */
export async function chupTieng(o: NguonDo, luc: number): Promise<Anh> {
  const pc = o.pc
  let uv = '', g: Anh['g'] = null
  if (pc) {
    try {
      const bc = await pc.getStats(), loai = new Map<string, string>(); let chon = ''
      bc.forEach((s: Record<string, unknown>) => {
        if (s.type === 'local-candidate') loai.set(String(s.id), `${String(s.candidateType ?? '?')}/${String(s.relayProtocol ?? s.protocol ?? '?')}`)
        else if (s.type === 'candidate-pair' && (s.nominated === true || s.selected === true) && s.state === 'succeeded') chon = String(s.localCandidateId ?? '')
      })
      uv = loai.get(chon) ?? ''
    } catch { /* trình duyệt cũ */ }
  }
  if (o.g?.getStats) {
    try { const x = { byte: 0, muc: 0, nl: 0 }; (await o.g.getStats()).forEach((s: Record<string, unknown>) => { if (s.type === 'outbound-rtp') x.byte = so(s.bytesSent); else if (s.type === 'media-source') { x.muc = so(s.audioLevel); x.nl = so(s.totalAudioEnergy) } }); g = x } catch { /* bỏ */ }
  }
  return { luc, cs: pc?.connectionState ?? 'khong', ice: pc?.iceConnectionState ?? 'khong', uv, n: await anhNhan(o.n), b: await anhNhan(o.b), g }
}
const r1 = (v: number): number => Math.round(v * 10) / 10
function hieuNhan(a: AnhNhan | null, b: AnhNhan | null, giay: number): SoNhan | undefined {
  if (!b) return undefined
  const c = a ?? { byte: b.byte, goi: b.goi, nl: b.nl, pt: null }
  return { kb: Math.max(0, Math.round(((b.byte - c.byte) * 8) / 1000 / giay)), nl: b.nl == null || c.nl == null ? null : Math.max(0, Math.round((b.nl - c.nl) * 1e5) / 100), goi: Math.max(0, b.goi - c.goi),
    pt: b.pt ? { d: b.pt.d ? 1 : 0, ct: r1(Math.max(0, b.pt.ct - (c.pt?.ct ?? b.pt.ct))), m: b.pt.m ? 1 : 0, v: Math.round(b.pt.v * 100) / 100 } : null }
}
/** Hai lần chụp ⇒ bản tóm tắt. */
export function tomTatTieng(a: Anh, b: Anh): SoTieng {
  const giay = Math.max(0.5, (b.luc - a.luc) / 1000), ra: SoTieng = { cs: b.cs, ice: b.ice, uv: b.uv }
  const n = hieuNhan(a.n, b.n, giay), bb = hieuNhan(a.b, b.b, giay)
  if (n) ra.n = n
  if (bb) ra.b = bb
  if (b.g) ra.g = { kb: Math.max(0, Math.round(((b.g.byte - (a.g?.byte ?? b.g.byte)) * 8) / 1000 / giay)), muc: Math.round(b.g.muc * 1000) / 1000, nl: Math.max(0, Math.round((b.g.nl - (a.g?.nl ?? b.g.nl)) * 1e5) / 100) }
  return ra
}
/** Một cửa sổ đo `ms` (mặc định 2 giây). */
export async function doTieng(lay: () => NguonDo, dongHo: () => number, cho: (ms: number) => Promise<void>, ms = 2000): Promise<SoTieng> {
  const a = await chupTieng(lay(), dongHo())
  await cho(ms)
  return tomTatTieng(a, await chupTieng(lay(), dongHo()))
}
