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
    luaDoi(d, em); // sau __mcVaoLai (vào lại đợt phát 'mc-vao-dot' ⇒ xoá lửa cũ)
    // 09/11 thầy «bấm L lên bảng thì đổi mượt mà sang tờ chiếu cũ chứ không tự động gọi lên bảng»: goiNgay=false ⇒ tờ ở «chờ gọi», thẻ tên em đã đặt; thầy bấm L để mời em.
    if (em.goiNgay === false) { baoNhanh('Bấm L để mời ' + String(em.ten || '') + ' lên bảng', 2600); return; }
    if (window.__mcLenBang) window.__mcLenBang();
  }
  // 09/11 thầy «học sinh đội nào lên bảng thì có ngọn lửa đội đó cháy ở góc đề siêu đẹp … đủ to để cả lớp phải wow»: ngọn lửa màu đội (mã màu bảng gửi)
  // nằm ở góc phải trên của đề (float — chữ đề chảy quanh, không bị che), lõi sáng, tia lửa bay lên; chấm xong / sang đợt khác thì tắt.
  var CSS_LUA = '.bpu-lua-doi{float:right;position:relative;width:170px;height:214px;margin:-6px -6px 6px 18px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:none;animation:bpuLuaVao .7s cubic-bezier(.2,.8,.2,1) both}'
    + '.bpu-lua-doi svg{width:150px;height:180px;overflow:visible;filter:drop-shadow(0 0 22px var(--doi)) drop-shadow(0 0 6px var(--doi))}'
    + '.bpu-lua-doi .l1{fill:var(--doi);transform-origin:50% 100%;animation:bpuLuaCay 1.1s ease-in-out infinite alternate}'
    + '.bpu-lua-doi .l2{fill:white;opacity:.55;transform-origin:50% 100%;animation:bpuLuaCay .8s ease-in-out infinite alternate-reverse}'
    + '.bpu-lua-doi .l3{fill:white;opacity:.92;transform-origin:50% 100%;animation:bpuLuaCay .6s ease-in-out infinite alternate}'
    + '.bpu-lua-doi .tia{fill:var(--doi);opacity:0;animation:bpuTia 1.6s ease-out infinite}'
    + '.bpu-lua-doi .tia:nth-of-type(2){animation-delay:.5s}.bpu-lua-doi .tia:nth-of-type(3){animation-delay:1s}'
    + '.bpu-lua-doi b{margin-top:2px;padding:3px 14px;border-radius:999px;background:var(--doi);color:white;font:800 18px/1.3 inherit;letter-spacing:.04em;white-space:nowrap;box-shadow:0 0 18px var(--doi)}'
    + '@keyframes bpuLuaCay{0%{transform:scale(1,1) skewX(0)}50%{transform:scale(.96,1.07) skewX(2deg)}100%{transform:scale(1.03,.95) skewX(-2deg)}}'
    + '@keyframes bpuTia{0%{opacity:0;transform:translate(0,0) scale(1)}20%{opacity:.95}100%{opacity:0;transform:translate(var(--tx,8px),-90px) scale(.3)}}'
    + '@keyframes bpuLuaVao{from{opacity:0;transform:scale(.4) translateY(30px)}to{opacity:1;transform:none}}'
    + '@media (prefers-reduced-motion:reduce){.bpu-lua-doi,.bpu-lua-doi *{animation:none!important}.bpu-lua-doi .tia{display:none}}html.may-yeu .bpu-lua-doi *{animation:none!important}';
  function xoaLua() { Array.prototype.forEach.call(document.querySelectorAll('.bpu-lua-doi'), function (x) { x.remove(); }); }
  function luaDoi(d, em) {
    xoaLua();
    var mau = String(em.mau || '').trim(); if (!mau || !/^[#a-z0-9(),.%\s-]+$/i.test(mau)) return;
    var v = d.querySelector('.mc-vung-de'); if (!v) return;
    if (!document.getElementById('bpu-lua-css')) { var st = document.createElement('style'); st.id = 'bpu-lua-css'; st.textContent = CSS_LUA; document.head.appendChild(st); }
    var w = document.createElement('div'); w.className = 'bpu-lua-doi'; w.setAttribute('aria-hidden', 'true'); w.style.setProperty('--doi', mau);
    w.innerHTML = '<svg viewBox="0 0 100 120"><circle class="tia" cx="44" cy="40" r="3.4" style="--tx:-14px"/><circle class="tia" cx="58" cy="34" r="2.6" style="--tx:12px"/><circle class="tia" cx="50" cy="28" r="2" style="--tx:-4px"/>'
      + '<path class="l1" d="M50 4C62 26 86 42 86 74A36 36 0 0 1 14 74C14 54 26 44 32 30C36 44 42 48 46 48C44 32 44 18 50 4Z"/>'
      + '<path class="l2" d="M50 40C58 54 70 62 70 80A20 20 0 0 1 30 80C30 66 40 58 44 50C46 58 50 60 52 60C50 52 48 46 50 40Z"/>'
      + '<path class="l3" d="M50 66C54 74 60 78 60 88A10 10 0 0 1 40 88C40 80 46 76 50 66Z"/></svg><b></b>';
    w.querySelector('b').textContent = String(em.doi || '');
    v.insertBefore(w, v.firstChild);
  }
  document.addEventListener('mc-vao-dot', xoaLua);
  document.addEventListener('click', function (e) {
    var n = S.bpuLen && CHAM && e.target && e.target.closest ? e.target.closest(CHAM + '-nut') : null;
    if (!n) return;
    e.preventDefault(); e.stopPropagation(); cham(n.getAttribute('data-kq') === '1');
  }, true);
  function chamBpu(dat) {
    if (!S.bpuLen) return false;
    S.bpuLen = null;
    xoaLua();
    dauKq(String(chiSo()), dat);
    try { var app = dichApp(); if (app) app.postMessage({ nguon: 'to-chieu', loai: 'bpu-cham', dat: !!dat }, '*'); } catch (x) { /* app đã đóng */ }
    baoNhanh((dat ? 'Đạt' : 'Chưa đạt') + ' — về Bình Phản Ứng');
    return true;
  }
`
