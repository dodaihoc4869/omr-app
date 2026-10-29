// APP HỌC SINH LUÔN TRÀN TOÀN MÀN (thầy chụp 28/10 máy Android: «App lúc full màn hình lúc lại không full, có dải đen ở trên, bạn cho full hẳn nhé»).
//
// Nguyên nhân: manifest-hs đã `display: fullscreen` và index.html đã `viewport-fit=cover`, nên cả hai ảnh đều KHÔNG còn thanh trạng thái. Dải đen
// trong ảnh lỗi là vùng TAI THỎ / CAMERA bị Android «đóng hộp» (chế độ cắt màn mặc định) — Chrome chỉ cho trang tràn vào vùng đó khi nó NHẬN được
// `viewport-fit=cover` lúc trang đang toàn màn. Trang chỉ báo giá trị ấy khi nó ĐỔI; nghi (chưa đọc được mã Chrome) lúc app mở nguội / quay lại
// từ nền / xoay máy, Chrome dựng lại cửa sổ trước khi trang báo nên rơi về chế độ mặc định và không ai báo lại ⇒ lúc tràn, lúc dải đen. Màu thanh không cứu được: vùng
// đóng hộp nằm NGOÀI cửa sổ trang, Android luôn tô đen.
//
// Cách sửa: khi app đang toàn màn mà vùng an toàn trên = 0 trong khi cửa sổ trang NGẮN HƠN màn hình (dấu hiệu đang bị đóng hộp) ⇒ gỡ rồi gắn lại
// `viewport-fit=cover` qua hai khung hình để Chrome nhận một lần ĐỔI và áp lại chế độ tràn. Kiểm lúc mở, lúc quay lại app, lúc xoay máy. Máy không
// tai thỏ / iPhone / trình duyệt thường: không khớp điều kiện ⇒ không làm gì.
// Kèm: màu thanh trạng thái (`theme-color`) theo đúng nền app học sinh đang vẽ (sáng / tối) — khi mở trong trình duyệt, thanh trên cùng màu nền.

/** Số đo một lượt kiểm (đơn vị px CSS). */
export type SoDoMan = {
  toanMan: boolean
  /** env(safe-area-inset-top) đo được. */
  anToanTren: number
  manRong: number
  manCao: number
  trongRong: number
  trongCao: number
  /** Đang gõ chữ (bàn phím ảo làm cửa sổ ngắn lại — không phải đóng hộp). */
  dangGo: boolean
}

/** Phần thiếu tối thiểu để coi là bị đóng hộp: tai thỏ / camera đục lỗ nhỏ nhất ~20 px CSS; dưới 12 px là sai số làm tròn. */
const THIEU_TOI_THIEU = 12

/** Đang bị Android đóng hộp vùng tai thỏ (dải đen) ⇒ cần báo lại `viewport-fit=cover`. Hàm thuần để kiểm. */
export function biDongHop(s: SoDoMan): boolean {
  if (!s.toanMan || s.dangGo || s.anToanTren > 0) return false
  // screen.* trên vài máy chưa đổi theo hướng xoay ⇒ ghép cạnh dài với cạnh dài.
  const ngang = s.trongRong > s.trongCao
  const manTheoHuong = ngang ? Math.max(s.manRong, s.manCao) : Math.min(s.manRong, s.manCao)
  const manTheoDoc = ngang ? Math.min(s.manRong, s.manCao) : Math.max(s.manRong, s.manCao)
  const thieu = ngang ? manTheoHuong - s.trongRong : manTheoDoc - s.trongCao
  return thieu >= THIEU_TOI_THIEU
}

const COVER = /,?\s*viewport-fit\s*=\s*cover/i

/** Nội dung thẻ viewport KHÔNG có cover (bước gỡ) — luôn còn phần còn lại. */
export function boCover(noiDung: string): string {
  return noiDung.replace(COVER, '').trim() || 'width=device-width, initial-scale=1.0'
}

/** Nội dung thẻ viewport CÓ cover (bước gắn lại / bổ sung nếu thiếu). */
export function coCover(noiDung: string): string {
  return COVER.test(noiDung) ? noiDung : `${boCover(noiDung)}, viewport-fit=cover`
}

let daGan = false

/** Gắn một lần cho app học sinh / màn thi. An toàn khi gọi nhiều lần, khi không có window (test), khi máy chặn gì đó. */
export function giuToanManHs(): void {
  if (daGan || typeof window === 'undefined' || typeof document === 'undefined') return
  daGan = true
  try {
    const mq = (q: string) => (typeof window.matchMedia === 'function' ? window.matchMedia(q) : null)
    const toanMan = mq('(display-mode: fullscreen)')
    const toi = mq('(prefers-color-scheme: dark)')
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    if (viewport && !COVER.test(viewport.content)) viewport.content = coCover(viewport.content)

    // Ô đo vùng an toàn trên (không chiếm chỗ, không bắt chạm).
    const o = document.createElement('div')
    o.setAttribute('aria-hidden', 'true')
    o.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'
    document.body.appendChild(o)

    const dangGo = () => {
      const a = document.activeElement as HTMLElement | null
      return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)
    }

    let lanThu = 0
    const kiem = () => {
      if (typeof document === 'undefined') return // hẹn giờ chạy sau khi môi trường test đã dỡ (đỏ oan bước phát hành 29/10)
      if (document.visibilityState === 'hidden' || !viewport) return
      const s: SoDoMan = {
        toanMan: !!toanMan?.matches,
        anToanTren: o.getBoundingClientRect().height,
        manRong: window.screen?.width ?? 0,
        manCao: window.screen?.height ?? 0,
        trongRong: window.innerWidth,
        trongCao: window.innerHeight,
        dangGo: dangGo(),
      }
      if (!biDongHop(s) || lanThu >= 2) return
      lanThu++
      const cu = viewport.content
      viewport.content = boCover(cu)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        viewport.content = coCover(cu)
        window.setTimeout(kiem, 400) // chưa ăn thì thử thêm một lần
      }))
    }
    const kiemLai = () => { lanThu = 0; window.setTimeout(kiem, 120) }

    // Màu thanh trạng thái = nền app đang vẽ (đọc từ CSS, không ghi mã màu vào đây).
    const datMauThanh = () => {
      const nen = getComputedStyle(document.body).backgroundColor
      if (!nen || nen === 'transparent' || /rgba\(.*,\s*0\)$/.test(nen)) return
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
        if (m.content !== nen) m.content = nen
      })
    }

    // 28/10 MƯỢT (hồ sơ mở lại Lộ trình CPU ×6: đọc màu nền ~190 ms ép tính kiểu cả trang giữa lúc màn đang dựng): đọc SAU khung vẽ (rAF → setTimeout)
    // — kiểu vừa tính xong cho khung ấy nên `getComputedStyle` gần như không tốn.
    const sauVe = (f: () => void) => requestAnimationFrame(() => { window.setTimeout(f, 0) })
    const moi = () => { sauVe(datMauThanh); kiemLai() }
    if (document.readyState === 'complete') requestAnimationFrame(moi)
    else window.addEventListener('load', moi, { once: true })
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kiemLai() })
    window.addEventListener('orientationchange', kiemLai)
    toanMan?.addEventListener?.('change', kiemLai)
    toi?.addEventListener?.('change', () => sauVe(datMauThanh))
    window.setTimeout(() => sauVe(datMauThanh), 1500) // CSS màn em nạp lười xong
  } catch {
    /* máy chặn: giữ nguyên như cũ */
  }
}
