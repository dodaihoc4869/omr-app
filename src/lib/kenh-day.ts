// KÊNH ĐẨY HAI THIẾT BỊ — máy em (thầy 31/10: «Làm luôn kênh đẩy»; máy chủ: server/src/kenh-day.ts). Em mở app trên 2 máy: máy kia vừa làm bài / sửa lỗi / đổi EXP ⇒
// ngăn của em trên máy chủ báo qua WebSocket ⇒ máy này phát sự kiện `SU_KIEN_DOI` trên window ⇒ các màn đang hiện tự đọc lại bằng ĐÚNG lệnh sẵn có (Lộ trình, kế hoạch
// ngày, EXP, bài mẹ giao, thưởng) — ~1–2 giây thay vì chờ quay lại app / nhịp nền vài phút. Tin không mang dữ liệu nào.
// Mảnh NẠP LƯỜI (StudentPortalScreen, kho chạy-lúc — không cất sẵn). Hỏng ở đâu cũng im lặng: app y như cũ (nhịp nền + quay lại app vẫn làm mới).
// Nối: xin vé `POST /hs/kenh-ve` (token trong thân, không nằm trên đường dẫn) ⇒ `wss://…/hs/kenh?ve=…`. Mất kết nối ⇒ nối lại lùi dần; app ẩn ⇒ không nối mới,
// hiện lại ⇒ nối ngay. Ping `p` mỗi 50 giây khi app hiện (máy chủ tự trả `o`, không đánh thức ngăn). Máy chủ tắt kênh (`tat`) ⇒ thôi hẳn tới lần mở app sau.
import { layDiaChiMayChu } from './dia-chi-may-chu'

/** Sự kiện trên window — nơi nghe ghi thẳng chuỗi này (không nhập mảnh lười). */
export const SU_KIEN_DOI = 'ddh:doi-may-khac'
const GOC_MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
/** Lùi khi nối hỏng (ms). */
export const LUI_NOI_MS: readonly number[] = [2_000, 5_000, 15_000, 30_000, 60_000]
const NHIP_PING_MS = 50_000
/** Hai tin sát nhau ⇒ một lượt đọc lại. */
const GOP_MS = 400

/** Mở kênh cho token của em; trả hàm đóng (đăng xuất / đổi em). */
export function moKenhDay(token: string): () => void {
  if (!token || typeof window === 'undefined' || typeof WebSocket === 'undefined') return () => {}
  let dung = false, ws: WebSocket | null = null, loi = 0, dangNoi = false, daMo = false
  let hen: ReturnType<typeof setTimeout> | undefined, ping: ReturnType<typeof setTimeout> | undefined, gop: ReturnType<typeof setTimeout> | undefined
  const an = () => typeof document !== 'undefined' && document.hidden
  const tatPing = () => { if (ping) clearTimeout(ping); ping = undefined }
  // Ping nối tiếp bằng hẹn giờ một lần (không vòng `setInterval` — tests/nhip-bang-2109): app ẩn thì không gửi, chỉ hẹn lại.
  const henPing = (w: WebSocket) => { ping = setTimeout(() => { if (!an() && w.readyState === 1) { try { w.send('p') } catch { /* đang đóng */ } } if (ws === w) henPing(w) }, NHIP_PING_MS) }
  const henLai = () => {
    if (dung || hen) return
    hen = setTimeout(() => { hen = undefined; void noi() }, LUI_NOI_MS[Math.min(loi++, LUI_NOI_MS.length - 1)])
  }
  const bao = () => {
    if (gop) return
    gop = setTimeout(() => { gop = undefined; window.dispatchEvent(new CustomEvent(SU_KIEN_DOI)) }, GOP_MS)
  }
  async function noi(): Promise<void> {
    if (dung || ws || dangNoi || an()) return
    dangNoi = true
    try {
      const goc = (await layDiaChiMayChu('')) || GOC_MAC_DINH
      const r = await fetch(`${goc}/hs/kenh-ve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; ve?: unknown; tat?: boolean } | null
      if (dung) return
      if (j?.tat) { dung = true; return } // máy chủ tắt kênh ⇒ nhịp nền như cũ
      if (!j?.ok || typeof j.ve !== 'string') { henLai(); return }
      const w = new WebSocket(`${goc.replace(/^http/, 'ws')}/hs/kenh?ve=${encodeURIComponent(j.ve)}`)
      ws = w
      w.onopen = () => {
        loi = 0
        tatPing()
        henPing(w)
        // NỐI LẠI (31/10): lúc mất kết nối máy kia có thể đã làm bài — tin đẩy khi ấy không tới ⇒ đọc lại một lượt. Lần nối ĐẦU không cần (màn vừa tự đọc lúc mở).
        if (daMo) bao()
        daMo = true
      }
      w.onmessage = (e) => { if (typeof e.data === 'string' && e.data.includes('"doi"')) bao() }
      w.onclose = () => { if (ws !== w) return; ws = null; tatPing(); henLai() }
      w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
    } catch {
      henLai()
    } finally {
      dangNoi = false
    }
  }
  const khiHien = () => { if (!an() && !ws) { if (hen) { clearTimeout(hen); hen = undefined } void noi() } }
  document.addEventListener('visibilitychange', khiHien)
  window.addEventListener('online', khiHien)
  void noi()
  return () => {
    dung = true
    if (hen) clearTimeout(hen)
    if (gop) clearTimeout(gop)
    tatPing()
    document.removeEventListener('visibilitychange', khiHien)
    window.removeEventListener('online', khiHien)
    const w = ws
    ws = null
    try { w?.close(1000) } catch { /* đã đóng */ }
  }
}
