// SỐ ĐO TIẾNG TỪ XA — phần THUẦN (dùng chung máy em, máy thầy, phòng ở máy chủ): kiểu bản tóm tắt, «đang nghe thật», chữ lý do, làm sạch tin nhận được.
// Phần đo trên trình duyệt: do-tieng.ts.

/** Một luồng tiếng nhận: kb/s tới · năng lượng tăng (×1000, 0 = không có tiếng ra) · gói tới · thẻ phát: d = dừng, ct = currentTime tăng (giây), m = tắt tiếng, v = âm lượng. */
/** `nl` = null khi trình duyệt KHÔNG báo năng lượng (không phải «không có tiếng»). */
export interface SoNhan { kb: number; nl: number | null; goi: number; pt: { d: 0 | 1; ct: number; m: 0 | 1; v: number } | null }
/** Tóm tắt tiếng của MỘT máy trong cửa sổ đo (gọn, đi qua WebSocket của phòng). `cs` connectionState · `ice` iceConnectionState · `uv` đường đang dùng
 *  («host/udp», «srflx/udp», «relay/tcp»…) · `n` tiếng chính nhận (máy em: tiếng thầy; máy thầy: tiếng em đang nói) · `b` tiếng bạn (máy em) · `g` mic đang gửi. */
export interface SoTieng { cs: string; ice: string; uv: string; n?: SoNhan; b?: SoNhan; g?: { kb: number; muc: number; nl: number }; /** trạng thái tiếng / mic của thư viện; r = 1 khi em đang rời màn */ tg?: string; mc?: string; r?: 1; /** lý do lần nối máy chủ tiếng gần nhất hỏng ('khong-noi' = ICE / DTLS không lên — mạng chặn) */ l?: string }

const so = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
/** ĐANG NGHE THẬT: tiếng có năng lượng tới VÀ thẻ phát đang chạy, không tắt tiếng, âm lượng > 0. */
export function ngheThat(s: SoNhan | undefined): boolean {
  // năng lượng không đo được (trình duyệt không báo) ⇒ dựa vào kb/s + thẻ phát
  return !!s && s.kb > 0 && (s.nl == null || s.nl > 0) && !!s.pt && !s.pt.d && !s.pt.m && s.pt.v > 0 && s.pt.ct > 0.5
}
/** Vì sao chưa nghe được (chữ gọn cho cửa sổ nút Live). '' = đang nghe tốt. */
export function viSaoCam(t: SoTieng | null | undefined, tenNhan = 'tiếng'): string {
  if (!t) return 'chưa có số đo'
  if (t.cs === 'khong') return t.l === 'khong-noi' ? 'ICE hỏng (mạng chặn đường tiếng)' : t.l ? `nối máy chủ tiếng lỗi (${t.l})` : 'chưa nối máy chủ tiếng'
  if (t.ice === 'failed' || t.cs === 'failed') return 'ICE hỏng (mạng chặn đường tiếng)'
  if (t.ice === 'disconnected' || t.cs === 'disconnected') return 'đường tiếng đang rớt'
  if (t.cs !== 'connected') return `đang nối (${t.ice})`
  const n = t.n
  if (!n) return `chưa nhận ${tenNhan}`
  if (n.kb === 0) return `không nhận được gói ${tenNhan}`
  if (!n.pt) return 'không có thẻ phát'
  if (n.pt.m) return 'đang tắt tiếng'
  if (n.pt.d || n.pt.ct < 0.5) return 'loa CHƯA phát (trình duyệt chặn — cần chạm)'
  if (n.pt.v === 0) return 'âm lượng 0'
  if (n.nl === 0) return 'có gói mà KHÔNG có năng lượng (tiếng câm từ nguồn)'
  return ''
}
/** MỘT dòng gọn cho một máy, vd. «Gia Huy: ICE ok (host/udp) · nhận 58 kb/s · năng lượng ↑ · loa đang phát». */
export function dongMay(ten: string, t: SoTieng | null | undefined, tenNhan = 'tiếng thầy'): string {
  const ly = viSaoCam(t, tenNhan)
  const ice = !t ? '' : t.ice === 'connected' || t.ice === 'completed' ? `ICE ok${t.uv ? ` (${t.uv})` : ''}` : `ICE ${t.ice}`
  const nhan = t?.n ? `nhận ${t.n.kb} kb/s · năng lượng ${t.n.nl == null ? '?' : t.n.nl > 0 ? '↑' : '0'}` : ''
  const gui = t?.g && t.g.kb > 0 ? ` · mic gửi ${t.g.kb} kb/s, mức ${Math.round(t.g.muc * 100)}` : ''
  return `${ten}: ${[ice, nhan].filter(Boolean).join(' · ')}${gui} · ${ly ? `⚠ ${ly}` : 'loa đang phát'}`
}
/** Làm sạch bản tóm tắt nhận từ máy khác (phòng / máy thầy): chỉ giữ đúng các trường, đúng kiểu, chữ ngắn. */
export function sachTieng(x: unknown): SoTieng | null {
  const o = x as Record<string, unknown> | null
  if (!o || typeof o !== 'object') return null
  const chu = (v: unknown): string => String(v ?? '').slice(0, 24)
  const nhan = (v: unknown): SoNhan | undefined => {
    const n = v as Record<string, unknown> | null
    if (!n || typeof n !== 'object') return undefined
    const p = n.pt as Record<string, unknown> | null
    return { kb: so(n.kb), nl: typeof n.nl === 'number' && Number.isFinite(n.nl) ? n.nl : null, goi: so(n.goi), pt: p && typeof p === 'object' ? { d: p.d ? 1 : 0, ct: so(p.ct), m: p.m ? 1 : 0, v: so(p.v) } : null }
  }
  const g = o.g as Record<string, unknown> | null
  const ra: SoTieng = { cs: chu(o.cs), ice: chu(o.ice), uv: chu(o.uv) }
  if (o.tg) ra.tg = chu(o.tg)
  if (o.mc) ra.mc = chu(o.mc)
  if (o.r) ra.r = 1
  if (o.l) ra.l = chu(o.l)
  const n = nhan(o.n), b = nhan(o.b)
  if (n) ra.n = n
  if (b) ra.b = b
  if (g && typeof g === 'object') ra.g = { kb: so(g.kb), muc: so(g.muc), nl: so(g.nl) }
  return ra
}
