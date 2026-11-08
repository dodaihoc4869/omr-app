// BÌNH PHẢN ỨNG GIAO EM CHO TỜ CHIẾU CŨ (thầy 08/11: «khi gọi hs lên bảng thì chuyển về màn chiếu cũ (bỏ màn chiếu mới đi) khi bấm đạt hoặc ko đạt thì
// tự động chuyển sang bình phản ứng»). Đoạn JS chèn vào script tờ chiếu (len-bang-moi-to-chieu.ts, cùng phạm vi: dot · chiSo · CHAM · S · dauKq · dichApp · baoNhanh).
// Tách tệp riêng vì cổng cỡ tệp. Tin vào: {nguon:'bpu-bang', lenh:'len-bang', em:{sbd, ten}} · tin ra: {nguon:'to-chieu', loai:'bpu-cham', dat}.
export const JS_LEN_BANG_BPU = `
  // 08/11 BÌNH PHẢN ỨNG GIAO EM (thầy «gọi hs lên bảng thì chuyển về màn chiếu cũ»): đặt tên em vào thẻ tên của đợt (đợt chưa có thẻ ⇒ dựng thẻ gọn),
  // chạy ĐÚNG màn lên bảng cũ. Chấm (D / K / nút) ⇒ báo về bảng (bảng ghi + mở đáp án), KHÔNG ghi qua cầu nối cho em đã xếp lịch của đợt.
  function lenBangBpu(em) {
    var d = dot(); if (!d || !em) return;
    var the = d.querySelector('.mc-em[id]');
    if (!the) {
      var nua = d.querySelector('.mc-nua') || d;
      the = document.createElement('header'); the.className = 'mc-em'; the.id = 'em-bpu-' + chiSo(); the.hidden = true;
      the.innerHTML = '<div class="mc-em-trai"><div class="mc-em-hang1"><div class="mc-ten-hang"><span class="mc-ten"></span><span class="mc-dau-kq" hidden></span></div><div class="mc-phu"><span class="mc-sbd"></span></div></div></div>'
        + (CHAM ? '<div class="' + CHAM.slice(1) + '" data-cham="cho"><button type="button" class="' + CHAM.slice(1) + '-nut" data-kq="1">Đạt</button><button type="button" class="' + CHAM.slice(1) + '-nut" data-kq="0">Chưa đạt</button></div>' : '');
      nua.insertBefore(the, nua.firstChild);
    }
    Array.prototype.forEach.call(the.children, function (c) { if (!c.classList.contains('mc-em-trai') && !(CHAM && c.matches(CHAM))) c.style.display = 'none'; });
    var t = the.querySelector('.mc-ten'); if (t) t.textContent = String(em.ten || em.sbd || '');
    var s = the.querySelector('.mc-sbd'); if (s) s.textContent = String(em.sbd || '');
    var cs = the.querySelector('.mc-cau-so'); if (cs) cs.style.display = 'none';
    S.bpuLen = { sbd: String(em.sbd || '') };
    if (window.__mcVaoLai) window.__mcVaoLai();
    if (window.__mcLenBang) window.__mcLenBang();
  }
  document.addEventListener('click', function (e) {
    var n = S.bpuLen && CHAM && e.target && e.target.closest ? e.target.closest(CHAM + '-nut') : null;
    if (!n) return;
    e.preventDefault(); e.stopPropagation(); cham(n.getAttribute('data-kq') === '1');
  }, true);
  function chamBpu(dat) {
    if (!S.bpuLen) return false;
    S.bpuLen = null;
    dauKq(String(chiSo()), dat);
    try { var app = dichApp(); if (app) app.postMessage({ nguon: 'to-chieu', loai: 'bpu-cham', dat: !!dat }, '*'); } catch (x) { /* app đã đóng */ }
    baoNhanh((dat ? 'Đạt' : 'Chưa đạt') + ' — về Bình Phản Ứng');
    return true;
  }
`
