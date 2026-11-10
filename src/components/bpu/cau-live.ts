// BÌNH PHẢN ỨNG ↔ LIVE BẢNG — CẦU NỐI PHÒNG (10/11). Bảng chiếu (BangBinhPhanUng) giữ WebSocket của phòng; phần live của máy thầy
// (src/components/live/thay-noi.ts, nạp lười) cần gửi / nhận trên CHÍNH kết nối đó. Tệp nhỏ này là chỗ hai bên gặp nhau — bảng chỉ gọi `noiLive(w, vé, gốc)`
// một lần mỗi kết nối, không biết gì về live. Chưa ai nghe ⇒ không giải mã, không tốn gì.
export interface PhongThay {
  ve: string
  goc: string
  gui(tin: Record<string, unknown>): void
  guiNhiPhan(khung: Uint8Array): void
}
let phong: PhongThay | null = null
let bangCuoi = ''
const taiPhong = new Set<() => void>()
const taiTin = new Set<(tin: unknown) => void>()

/** Phòng đang nối của máy thầy (null = chưa nối / vừa rớt). */
export const layPhong = (): PhongThay | null => phong
/** `viewBang` gần nhất phòng đã gửi (phần live nạp sau khi phòng nối vẫn biết trạng thái); chưa có ⇒ null. */
export function layBangCuoi(): unknown { try { return bangCuoi ? JSON.parse(bangCuoi) : null } catch { return null } }
/** Nghe phòng nối / rớt. Trả hàm gỡ. */
export function nghePhong(f: () => void): () => void { taiPhong.add(f); return () => { taiPhong.delete(f) } }
/** Nghe MỌI tin của phòng: khung nhị phân (ArrayBuffer) hoặc đối tượng đã giải mã của tin chữ có liên quan (`bang`, `live-*`). Trả hàm gỡ. */
export function ngheTin(f: (tin: unknown) => void): () => void { taiTin.add(f); return () => { taiTin.delete(f) } }
const phat = (): void => { for (const f of taiPhong) { try { f() } catch { /* nơi nghe lỗi không làm rớt phòng */ } } }

/** Bảng gọi ngay sau khi tạo WebSocket của phòng. */
export function noiLive(w: WebSocket, ve: string, goc: string): void {
  if (typeof w.addEventListener !== 'function') return // WebSocket giả tối giản (test cũ): bảng chạy như trước, không có live
  w.binaryType = 'arraybuffer'
  const p: PhongThay = {
    ve, goc,
    gui: (tin) => { if (w.readyState === 1) { try { w.send(JSON.stringify(tin)) } catch { /* rớt */ } } },
    guiNhiPhan: (khung) => { if (w.readyState === 1) { try { w.send(khung as Uint8Array<ArrayBuffer>) } catch { /* rớt */ } } },
  }
  w.addEventListener('open', () => { phong = p; phat() })
  w.addEventListener('close', () => { if (phong === p) { phong = null; bangCuoi = ''; phat() } })
  w.addEventListener('message', (e: MessageEvent) => {
    if (typeof e.data === 'string' && e.data.includes('"t":"bang"')) bangCuoi = e.data // giữ tham chiếu chuỗi (không chép, không giải mã)
    if (!taiTin.size) return
    let tin: unknown = e.data
    if (typeof tin === 'string') {
      if (!tin.includes('"bang"') && !tin.includes('"live')) return
      try { tin = JSON.parse(tin) } catch { return }
    }
    for (const f of taiTin) { try { f(tin) } catch { /* nơi nghe lỗi không làm rớt phòng */ } }
  })
}
