/** Live theo khối: chỉ khi phòng báo `live.khoi` mới nạp lười lớp nổi (buổi «Học» thường không tải thêm byte nào). Mảnh đã nạp ⇒ nối đồng bộ như cũ; đang nạp ⇒ giữ mọi tin chữ rồi phát lại theo thứ tự. */
let mKhoi: typeof import('../live-khoi/em-khoi') | null = null
export function noiKhoi(w: WebSocket): void {
  if (typeof w.addEventListener !== 'function') return
  if (mKhoi) { mKhoi.noiKhoi(w); return }
  let giu: string[] | null = null
  const h = (e: MessageEvent): void => {
    const d = e.data
    if (typeof d !== 'string') return
    if (giu) { giu.push(d); return }
    if (!d.startsWith('{"t":"em"') || !d.includes('"khoi":{')) return
    giu = [d]
    void import('../live-khoi/em-khoi').then((m) => {
      mKhoi = m; w.removeEventListener('message', h)
      m.noiKhoi(w, giu ?? [])
    }).catch(() => { w.removeEventListener('message', h) })
  }
  w.addEventListener('message', h)
}
