// TRANG CHÍNH BỊ MÀN CON CHE KÍN ⇒ TRÌNH DUYỆT BỎ QUA NÓ (27/10, thầy: «tối ưu chuyên sâu … mượt tức thì như app cũ»).
//
// Cổng học sinh giữ Lộ trình (HocTapHomNay) trong cây trang suốt lúc em làm chặng / mở màn con (khung `inert` phía sau lớp `fixed inset-0`), để về là
// hiện ngay đúng chỗ cũ. Nhưng mỗi lần màn con đổi nút, trình duyệt vẫn tính kiểu cho cả ~650 phần tử của Lộ trình (đo CPU ×4, scripts/do-muot-hs.mjs:
// một lượt tính kiểu toàn trang 104 ms, ẩn Lộ trình còn 32 ms). `content-visibility: hidden` ⇒ trình duyệt bỏ qua kiểu / bố cục / vẽ của khối ấy,
// GIỮ NGUYÊN cây React, trạng thái, vị trí cuộn; gỡ ra là vẽ lại đúng như cũ.
//
// An toàn giao diện: chỉ bật SAU khi màn con đã vào hẳn (450 ms — hết hoạt ảnh mờ dần của tấm) và chỉ khi tấm thật sự che kín: năm điểm (giữa + bốn
// góc) đều rơi vào phần tử KHÔNG thuộc trang chính và có nền đặc trên đường lên tới lớp phủ. Kích thước khối được ghim bằng `contain-intrinsic-size`
// đúng số đo lúc ẩn ⇒ chiều cao trang không đổi, vị trí cuộn không nhảy. Đóng màn con ⇒ gỡ ngay trong cùng lượt.
const nenDac = (e: Element): boolean => {
  const c = getComputedStyle(e).backgroundColor
  const m = /rgba?\(([^)]+)\)/.exec(c)
  if (!m) return false
  const p = m[1]!.split(/[ ,/]+/).filter(Boolean)
  return p.length < 4 || Number(p[3]) >= 0.99
}

/** Điểm (x, y) có bị một lớp nền đặc KHÔNG thuộc `trang` che không. */
export function diemBiChe(trang: Element, x: number, y: number): boolean {
  const e = document.elementFromPoint(x, y)
  if (!e || trang.contains(e)) return false
  // chỉ tính nền của các lớp NẰM TRÊN trang chính (dừng ở tổ tiên chung — nền của khung cổng cũng nằm dưới trang chính)
  for (let n: Element | null = e; n && n !== document.body && !n.contains(trang); n = n.parentElement) if (nenDac(n)) return true
  return false
}

/** Bắt đầu theo dõi: màn con đã che kín `el` ⇒ ẩn hiển thị (content-visibility). Trả hàm gỡ (gọi khi màn con đóng). Gọi từ chính màn con
 *  (ManLamBaiTap — mảnh nạp lười) ⇒ lượt mở /hs không cộng byte. */
export function batAnKhiBiChe(el: HTMLElement): () => void {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports?.('content-visibility', 'hidden')) return () => {}
  let daAn = false, id = 0, lan = 0
  const thu = () => {
    const w = window.innerWidth, h = window.innerHeight
    const diem: Array<[number, number]> = [[w / 2, h / 2], [6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]
    // Màn con chưa vẽ xong (mảnh mã đang tải qua mạng chậm) ⇒ thử lại mỗi giây, tối đa 20 lần; không che kín thì không ẩn gì.
    if (!diem.every(([x, y]) => diemBiChe(el, x, y))) { if (++lan < 20) id = window.setTimeout(thu, 1000); return }
    const r = el.getBoundingClientRect()
    el.style.containIntrinsicSize = `${Math.round(r.width)}px ${Math.round(r.height)}px`
    el.style.contentVisibility = 'hidden'
    daAn = true
  }
  id = window.setTimeout(thu, 450)
  return () => {
    window.clearTimeout(id)
    if (daAn) { el.style.contentVisibility = ''; el.style.containIntrinsicSize = '' }
  }
}
