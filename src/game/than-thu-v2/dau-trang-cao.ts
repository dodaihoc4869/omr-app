// Đầu trang game cũ (`.spirit-game > .spirit-header`, sticky top:0, z-index:40, có nút "Về app học sinh") luôn dính mép trên vùng cuộn ⇒ mọi thứ khác muốn DÍNH mép trên (dòng "Lượt n/12" của Võ đài) phải dính NGAY DƯỚI nó, không thì chui xuống dưới (z-index thấp hơn). Chiều cao đầu trang không cố định (chữ xuống dòng ở màn hẹp, vùng an toàn, cỡ chữ hệ thống) ⇒ ĐO THẬT rồi đặt vào biến CSS `--spirit-dau-cao` (px) trên phần tử `el`; escort.css đọc: top = biến + 8 px. Không có đầu trang (vỏ Đảo mới, trang thử) ⇒ gỡ biến, CSS dùng vùng an toàn. Thuần DOM, không React ⇒ bộ thử Chromium chạy đúng tệp này.
const dauTrangCua = (el: Element): Element | null => {
  const game = el.closest('.spirit-game')
  return game ? ([...game.children].find((c) => c.classList.contains('spirit-header')) ?? null) : null
}

/** Chiều cao thật (px, làm tròn LÊN để không hở 1 px) của đầu trang chứa `el`; không có đầu trang hoặc chưa dựng hình (cao 0) ⇒ null. */
export function docDauTrangCao(el: Element | null): number | null {
  const h = el ? dauTrangCua(el) : null
  if (!h) return null
  const c = h.getBoundingClientRect().height
  return c > 0 ? Math.ceil(c) : null
}

/** Đặt `--spirit-dau-cao` trên `el` ngay, rồi đặt lại mỗi khi đầu trang đổi cỡ (ResizeObserver) hoặc cửa sổ đổi cỡ. Trả hàm gỡ. `el` rỗng ⇒ không làm gì. */
export function ganDauTrangCao(el: HTMLElement | null): () => void {
  if (!el) return () => {}
  const dat = () => {
    const c = docDauTrangCao(el)
    if (c === null) el.style.removeProperty('--spirit-dau-cao')
    else el.style.setProperty('--spirit-dau-cao', `${c}px`)
  }
  dat()
  const h = dauTrangCua(el)
  const ro = h && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(dat) : null
  if (h) ro?.observe(h)
  window.addEventListener('resize', dat)
  return () => {
    ro?.disconnect()
    window.removeEventListener('resize', dat)
    el.style.removeProperty('--spirit-dau-cao')
  }
}
