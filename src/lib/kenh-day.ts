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
/** Báo thẻ khác cùng máy sau khi lệnh ghi xong (≈ CHO_PHAT_MS của máy chủ: việc phụ sau phản hồi đã ghi) — gom mọi lệnh trong khoảng này thành MỘT tin. */
export const CHO_BC_MS = 1200
/** Đường lệnh LÀM ĐỔI tiến độ — CÙNG danh sách `LENH_DOI` của server/src/kenh-day.ts (test kenh-day-the-0311 khoá hai bên khớp nhau). */
export const LENH_DOI_DUONG = /^\/(?:game-v2\/(?:answer|complete|hoc-tap-kiem-nop|hoc-tap-ktcn-nop|hoc-tap-ktcn-chot-chang)|hs\/(?:chua-cau-sai\/(?:gon-nop|nop-item)|on-lai\/nop|luyen-nen\/nop|thu-thach-hom-nay\/nop|hoi-tro-ly\/kiem\/nop|tu-luyen\/nop|thuong\/(?:mua-binh|mo-ruong|cuoc)|diem-danh)|mom\/submit)$/

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
  // THẦY GIAO BÀI MỚI (tin `k: goi`, thầy 01/11): phần luyện hôm nay vừa xếp lại ⇒ tải lại NGAY gói cả ngày (câu + đáp án đã khoá) — không chờ hết chặng. `luon` =
  // bỏ nhịp 10 phút. Nối lại sau khi mất kết nối ⇒ tải theo nhịp thường (tin lúc mất kết nối không tới).
  // Qua mảnh màn làm bài (đã nạp sẵn ở Lộ trình để mở chặng tức thì) — không tách thêm mảnh mới (giữ trần precache).
  const napGoi = (luon: boolean) => { void import('../components/hoc-tap/ManLamBaiTap').then((m) => m.napGoiNgay(token, undefined, Date.now(), luon)).catch(() => {}) }
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
        if (daMo) { bao(); napGoi(false) }
        daMo = true
      }
      // BÌNH PHẢN ỨNG (06/11): tin `bpu` = thầy vừa chiếu câu cho cả lớp ⇒ CHỈ mở màn Bình Phản Ứng (không đọc lại Lộ trình: 40 máy đọc cùng lúc là nghẽn).
      w.onmessage = (e) => { if (typeof e.data !== 'string' || !e.data.includes('"doi"')) return; if (e.data.includes('"live"')) { try { window.dispatchEvent(new Event('ddh-live-khoi')) } catch { /* trình duyệt cũ */ } return } if (e.data.includes('"bpu"')) { void import('../components/bpu/gan-hs').then((m) => m.moBpuHs(token, null)).catch(() => {}); return } if (e.data.includes('"goi"')) napGoi(true); bao() }
      w.onclose = () => { if (ws !== w) return; ws = null; tatPing(); henLai() }
      w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
    } catch {
      henLai()
    } finally {
      dangNoi = false
    }
  }
  // THẺ KHÁC CÙNG MÁY (thầy 03/11 «đồng bộ tức thì cho các thiết bị mọi chỗ»): máy chủ bỏ qua máy vừa làm theo chữ ký token ⇒ hai thẻ / cửa sổ cùng trình duyệt
  // (chung token) KHÔNG báo nhau qua WebSocket. ⇒ BroadcastChannel: thẻ này gọi THÀNH CÔNG một lệnh làm đổi tiến độ (cùng danh sách LENH_DOI của máy chủ —
  // server/src/kenh-day.ts) ⇒ sau CHO_PHAT (máy chủ ghi xong việc phụ) báo các thẻ khác ⇒ chúng đọc lại như khi có tin đẩy. Bọc `fetch` CHỈ để nhìn đường +
  // trạng thái (không đọc thân, không đổi gì), gỡ khi đóng kênh. Không có BroadcastChannel ⇒ như cũ.
  const BC = (window as Window & { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel
  const bc = typeof BC === 'function' ? new BC('ddh-doi-hs') : null
  let henBc: ReturnType<typeof setTimeout> | undefined
  const fetchGoc = window.fetch
  const boc: typeof fetch = function (this: unknown, ...a: Parameters<typeof fetch>) {
    const p = fetchGoc.apply(this, a)
    try {
      const v = a[0], yc = v instanceof Request ? v : null
      const m = String(a[1]?.method || yc?.method || 'GET').toUpperCase()
      if (m === 'POST' && LENH_DOI_DUONG.test(new URL(yc ? yc.url : String(v), location.href).pathname))
        void p.then((r) => { if (r.ok && bc && !henBc) henBc = setTimeout(() => { henBc = undefined; try { bc.postMessage(1) } catch { /* đã đóng */ } }, CHO_BC_MS) }, () => {})
    } catch { /* đường lạ ⇒ bỏ qua */ }
    return p
  }
  if (bc) { bc.onmessage = () => { if (!an()) bao() }; window.fetch = boc }
  const khiHien = () => { if (!an() && !ws) { if (hen) { clearTimeout(hen); hen = undefined } void noi() } }
  document.addEventListener('visibilitychange', khiHien)
  window.addEventListener('online', khiHien)
  void noi()
  return () => {
    dung = true
    if (hen) clearTimeout(hen)
    if (gop) clearTimeout(gop)
    if (henBc) clearTimeout(henBc)
    if (window.fetch === boc) window.fetch = fetchGoc
    try { bc?.close() } catch { /* đã đóng */ }
    tatPing()
    document.removeEventListener('visibilitychange', khiHien)
    window.removeEventListener('online', khiHien)
    const w = ws
    ws = null
    try { w?.close(1000) } catch { /* đã đóng */ }
  }
}
