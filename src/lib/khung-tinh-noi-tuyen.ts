// KHUNG TĨNH LỘ TRÌNH — phần NHÚNG VÀO index.html lúc build (vite.config.ts `napTruocManEm`): hằng số, khung xương, đoạn mã dựng lớp phủ. KHÔNG nhập
// mô-đun nào, không dùng kiểu DOM (vite.config.ts biên dịch tệp này với cấu hình Node). Phần chạy trong app (chụp, gỡ): khung-tinh-hs.ts.

/** Khoá localStorage của ảnh tĩnh (một ảnh cho máy — gắn số báo danh + ngày + bề rộng màn). */
export const KHOA_KHUNG_TINH = 'ddh.khung-tinh-hs'
/** id lớp phủ (đoạn mã nội tuyến dựng). */
export const ID_KHUNG_TINH = 'khung-tinh-hs'
/** Phiên bản dạng ảnh — đổi khi cấu trúc ảnh đổi (ảnh cũ bị bỏ, dùng khung xương). */
export const PHIEN_BAN_KHUNG = 2
/** Độ lệch ngang các nút chặng (= LECH của TrongHs `DuongChang`) — khung xương đặt nút đúng chỗ. */
const LECH_XUONG = [0, -52, -80, -52, 0, 52]
/**
 * Khung xương Lộ trình (chưa có ảnh): thẻ bài trên cùng + đường chặng uốn lượn — khối xám nhạt pha từ màu chữ (`color-mix`, không mã màu thô; tờ kiểu
 * «Trong» chưa có lúc này).
 * Chuỗi HTML tĩnh, dựng lúc build (vite.config.ts) và nhúng vào index.html.
 */
export function taoKhungXuong(): string {
  const nut = LECH_XUONG.map((x) => `<div style="width:64px;height:64px;border-radius:50%;background:color-mix(in srgb,currentColor 9%,transparent);transform:translateX(${x}px)"></div>`).join('')
  return '<div aria-busy="true"><div style="max-width:560px;margin:0 auto;padding:16px 64px 0 16px">' +
    '<div style="height:84px;border-radius:16px;background:color-mix(in srgb,currentColor 9%,transparent)"></div>' +
    `<div style="display:flex;flex-direction:column;align-items:center;gap:24px;margin-top:44px">${nut}</div></div></div>`
}

/**
 * ĐOẠN MÃ NỘI TUYẾN (index.html, ngay sau `<main id="root">`, trước mã chính): dựng lớp phủ khung tĩnh. TỰ CHỨA, ES5 (chèn nguyên văn bằng
 * `toString()`). `css`: các tờ kiểu của Lộ trình (vỏ HS + cổng + «Trong») ĐÚNG THỨ TỰ trình nạp mảnh của Vite tự chèn khi app chạy (vite.config.ts
 * `cssSauThuTu`) và CÙNG href ⇒ Vite thấy thẻ đã có, không chèn lại: thứ tự tầng kiểu y như trước, không luật nào nạp hai lần (đo 28/10: thử nhúng CSS
 * cốt lõi vào ảnh — 67 KB luật trùng làm React dựng chậm hơn; thử thẻ `#khung` riêng rồi gỡ — luật trùng, tính kiểu gấp đôi). Thẻ giữ lại sau khi gỡ
 * lớp phủ (chính là các tờ app sắp dùng). `blocking=render` ⇒ khung đầu đã có kiểu. Chưa có ảnh ⇒ khung xương (khối xám nhạt theo màu chữ).
 * Kèm: app đang toàn màn mà bị Android đóng hộp vùng tai thỏ (dải đen) ⇒ báo lại `viewport-fit=cover` NGAY lúc mở (trước đây chờ mảnh «Trong»).
 */
export function moKhungTinh(w: any, d: any, css: string[], xuong: string, khoa: string, khoaPhien: string): void {
  try {
    var l = w.location, duong = String(l.pathname || '').toLowerCase(), q = String(l.search || '')
    var laHs = /^\/(?:hs|hoc-sinh|hocsinh)\/?$/.test(duong) || (/^\/?$/.test(duong) && /[?&]vai=hocsinh/.test(q))
    if (!laHs) return
    // Tai thỏ (xem src/lib/toan-man-hs.ts `biDongHop`): toàn màn + vùng an toàn trên = 0 + cửa sổ ngắn hơn màn ≥ 12 px ⇒ gỡ rồi gắn lại cover.
    try {
      if (w.matchMedia && w.matchMedia('(display-mode: fullscreen)').matches) {
        var vp = d.querySelector('meta[name="viewport"]'), lan = 0
        var kiem = function () {
          if (!vp || lan > 1 || d.visibilityState === 'hidden') return
          var o = d.createElement('div')
          o.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);width:0;visibility:hidden'
          d.body.appendChild(o)
          var an = o.getBoundingClientRect().height
          o.remove()
          var s = w.screen || {}, ngang = w.innerWidth > w.innerHeight
          var thieu = ngang ? Math.max(s.width || 0, s.height || 0) - w.innerWidth : Math.max(s.width || 0, s.height || 0) - w.innerHeight
          if (an > 0 || thieu < 12) return
          lan++
          var cu = vp.content
          vp.content = cu.replace(/,?\s*viewport-fit\s*=\s*cover/i, '')
          w.requestAnimationFrame(function () { w.requestAnimationFrame(function () { vp.content = cu }) })
        }
        w.requestAnimationFrame(function () { w.requestAnimationFrame(kiem) })
        w.setTimeout(kiem, 900)
      }
    } catch (e) { /* bỏ qua */ }
    if (q.replace(/^\?/, '').replace(/(?:^|&)vai=hocsinh/, '')) return // đường có tham số khác (thông báo, link riêng) ⇒ màn khác Lộ trình
    var s2 = w.localStorage
    if (s2.getItem('ddh.trong') === 'tat') return
    var p = JSON.parse(s2.getItem(khoaPhien) || 'null')
    // Đã đăng xuất (máy dùng chung) ⇒ xoá ảnh Lộ trình + linh vật của em trước ngay lần mở này.
    if (!p || !p.token) { s2.removeItem(khoa); s2.removeItem('ddh.bi-tinh'); return }
    var k: any = null
    try { k = JSON.parse(s2.getItem(khoa) || 'null') } catch (e) { k = null }
    var hom = new Date(Date.now() + 25200000).toISOString().slice(0, 10)
    // Khổ màn so bằng media query (đọc innerWidth lúc này ép trình duyệt tính bố cục giữa lúc phân tích HTML — đo CPU ×4: ~11 ms).
    var kho = k && k.w > 0 && w.matchMedia && w.matchMedia('(min-width: ' + (k.w - 47) + 'px) and (max-width: ' + (k.w + 47) + 'px)').matches
    var dung = k && k.v === 2 && k.sbd === String(p.sbd || '').trim() && k.ngay === hom && kho && typeof k.html === 'string'
    var html = dung ? k.html : xuong
    var g = d.documentElement
    g.setAttribute('data-trong', 'hs')
    g.setAttribute('data-ht2', '')
    var o2 = d.createElement('div'), cho = 0
    var hien = function () { if (--cho <= 0 && o2) o2.style.visibility = '' }
    o2.id = 'khung-tinh-hs'
    o2.setAttribute('aria-hidden', 'true')
    o2.setAttribute('inert', '')
    o2.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;overflow:hidden;background:var(--tr-nen)'
    for (var i = 0; i < css.length; i++) {
      var e = d.createElement('link')
      e.rel = 'stylesheet'
      e.crossOrigin = ''
      e.href = css[i]
      // Máy không hiểu `blocking=render` (Safari): lớp phủ ẩn tới khi đủ tờ kiểu (không loé ảnh chưa có kiểu).
      if (!(e.blocking && e.blocking.supports && e.blocking.supports('render'))) { o2.style.visibility = 'hidden'; cho++; e.onload = e.onerror = hien }
      e.setAttribute('blocking', 'render')
      d.head.appendChild(e)
    }
    o2.innerHTML = '<style>#khung-tinh-hs *{animation:none!important;transition:none!important}</style>' + html
    d.body.appendChild(o2)
    var go = function () {
      if (!o2) return
      o2.remove()
      if (!d.querySelector('#root .ht2')) g.removeAttribute('data-ht2')
      o2 = null
      w.__ddhGoKhungTinh = null
    }
    w.__ddhGoKhungTinh = go
    w.setTimeout(go, 10000) // lưới an toàn: React chưa dựng được gì sau 10 giây ⇒ trả lại màn của app (màn chờ / báo lỗi khởi động)
  } catch (e) { /* máy chặn lưu / ảnh hỏng ⇒ như cũ */ }
}
