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
    theTen(the);
    S.bpuLen = { sbd: String(em.sbd || '') };
    // 10/11 thầy «bấm L lên bảng màn chiếu cũ hiện cuộn nếu đề dài luôn, ko bấm space nữa»: từ đây tờ này CUỘN NGAY (cả lúc chờ gọi, mọi đợt) —
    // đề dài cuộn bằng bánh xe / bàn di / kéo chạm / ↑ ↓ PageUp PageDown, mép mờ «còn nữa ↓»; không còn lật trang «Trang i/n · Space».
    S.bpuCuon = true;
    if (window.__mcVaoLai) window.__mcVaoLai();
    luaDoi(d, em); // sau __mcVaoLai (vào lại đợt phát 'mc-vao-dot' ⇒ xoá lửa cũ)
    cuonBpu(d);
    // 09/11 thầy «bấm L lên bảng thì đổi mượt mà sang tờ chiếu cũ chứ không tự động gọi lên bảng»: goiNgay=false ⇒ tờ ở «chờ gọi», thẻ tên em đã đặt; thầy bấm L để mời em.
    // 09/11 (lần 3) thầy «bấm L cái là thu về màn cũ hiện thẻ tên luôn … thẻ tên thu nhỏ vào đẹp tinh tế siêu đẹp, tôn vinh»: thẻ tên hiện NGAY — bay từ giữa
    // màn (to) thu nhỏ về chỗ của nó, viền + quầng màu đội; tờ vẫn «chờ gọi» (L mời em như tờ cũ, D / K chấm thẳng).
    if (em.goiNgay === false) {
      the.hidden = false;
      var mauThe = String(em.mau || '').trim();
      if (mauThe && /^[#a-z0-9(),.%\\s-]+$/i.test(mauThe)) { the.style.setProperty('--bpu-doi', mauThe); the.classList.add('bpu-the-ton'); }
      vuaThe(the); // trước khi đo chỗ bay: thẻ đã đúng cỡ cuối
      try {
        var r = the.getBoundingClientRect(), dx = window.innerWidth / 2 - (r.left + r.width / 2), dy = window.innerHeight / 2 - (r.top + r.height / 2);
        var lang = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu');
        if (!lang && the.animate) the.animate([
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(2.4)', opacity: 0 },
          { transform: 'translate(' + dx * 0.9 + 'px,' + dy * 0.9 + 'px) scale(2.2)', opacity: 1, offset: 0.3 },
          { transform: 'translate(0,0) scale(1)', opacity: 1 }
        ], { duration: 1150, easing: 'cubic-bezier(.22,.8,.2,1)' });
      } catch (x) { /* trình duyệt cũ */ }
      baoNhanh('L — mời ' + String(em.ten || '') + ' lên bảng · D Đạt · K Chưa đạt', 3200);
      return;
    }
    if (window.__mcLenBang) window.__mcLenBang();
    vuaThe(the);
    if (window.requestAnimationFrame) requestAnimationFrame(function () { vuaThe(the); });
  }
  // 10/11 thầy «thẻ tên co vừa với tên, đẹp, chuyên nghiệp — thẻ chỉ hiện "Đỗ…"» (luật chung của tờ cắt tên một dòng bằng «…» trong ô hẹp):
  // thẻ của Bình Phản Ứng ÔM SÁT tên (bề ngang theo chữ, giữa cột), chỉ còn tên đầy đủ một dòng; tên dài hơn cột ⇒ thu cỡ chữ tới khi vừa, không «…».
  // Mọi luật kèm :not([hidden]) ⇒ display:flex!important không đè thuộc tính hidden khi tờ giấu thẻ.
  var CSS_THE = '.mc-em.bpu-the:not([hidden]){display:flex!important;align-items:center;justify-content:center;gap:clamp(10px,1vw,18px);justify-self:center;align-self:start;width:fit-content!important;max-width:100%!important;min-width:0!important;box-sizing:border-box;margin-left:auto!important;margin-right:auto!important;padding:clamp(8px,.8vw,16px) clamp(22px,2.2vw,44px)!important;text-align:center}'
    + '.mc-em.bpu-the:not([hidden]) .mc-em-trai,.mc-em.bpu-the:not([hidden]) .mc-em-hang1,.mc-em.bpu-the:not([hidden]) .mc-ten-hang{display:flex!important;align-items:center;justify-content:center;gap:.4em;flex:0 1 auto!important;min-width:0!important;max-width:100%;width:auto!important}'
    + '.mc-em.bpu-the:not([hidden]) .mc-ten{display:block;flex:none;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:normal!important;max-width:none!important;font-size:var(--bpu-co,clamp(30px,3vw,60px))!important;font-weight:800!important;line-height:1.15!important;letter-spacing:-.01em}'
    + '.mc-em.bpu-the:not([hidden]) .mc-phu,.mc-em.bpu-the:not([hidden]) .mc-xem-ct,.mc-em.bpu-the:not([hidden]) .mc-thu,.mc-em.bpu-the:not([hidden]) .mc-ls{display:none!important}';
  function theTen(the) {
    if (!document.getElementById('bpu-the-css')) { var st = document.createElement('style'); st.id = 'bpu-the-css'; st.textContent = CSS_THE; document.head.appendChild(st); }
    the.classList.add('bpu-the');
  }
  /** Thu cỡ chữ tên tới khi thẻ (chạm mép cột) chứa trọn tên; thẻ đang ẩn (chưa đo được) thì thôi — lần hiện sau đo lại. */
  function vuaThe(the) {
    var t = the && the.querySelector('.mc-ten'); if (!t || the.hidden || !the.clientWidth) return;
    the.style.removeProperty('--bpu-co');
    var co = parseFloat(getComputedStyle(t).fontSize) || 40, i = 0;
    while (the.scrollWidth > the.clientWidth + 1 && co > 16 && i++ < 80) { co -= 1; the.style.setProperty('--bpu-co', co + 'px'); }
  }
  // 09/11 thầy «học sinh đội nào lên bảng thì có ngọn lửa đội đó cháy ở góc đề siêu đẹp … đủ to để cả lớp phải wow»: ngọn lửa màu đội (mã màu bảng gửi)
  // nằm ở góc trên TRÁI của đề, lõi sáng, tia lửa bay lên; chấm xong / sang đợt khác thì tắt.
  // 10/11 thầy «phần đề bao quanh ngọn lửa để tối ưu diện tích hiển thị đề»: lửa float trong dòng chảy (cuộn cùng đề), shape-outside theo dáng
  // ngọn lửa (đỉnh nhọn hẹp, thân + nhãn đội rộng) ⇒ chữ đề ôm sát mép lửa, hết chiều cao lửa thì tràn sang trái hết bề ngang — không còn cột trái riêng.
  var CSS_LUA = '.bpu-lua-doi{float:left;position:relative;width:236px;height:296px;margin:-8px 22px 8px -8px;shape-outside:polygon(0 0,56% 0,72% 24%,84% 46%,84% 100%,0 100%) border-box;shape-margin:14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;pointer-events:none;animation:bpuLuaVao .7s cubic-bezier(.2,.8,.2,1) both}'
    + '.bpu-lua-doi svg{width:210px;height:252px;overflow:visible;filter:drop-shadow(0 0 22px var(--doi)) drop-shadow(0 0 6px var(--doi))}'
    + '.bpu-lua-doi .l1{fill:var(--doi);transform-origin:50% 100%;animation:bpuLuaCay 1.1s ease-in-out infinite alternate}'
    + '.bpu-lua-doi .l2{fill:Canvas;opacity:.55;transform-origin:50% 100%;animation:bpuLuaCay .8s ease-in-out infinite alternate-reverse}'
    + '.bpu-lua-doi .l3{fill:Canvas;opacity:.92;transform-origin:50% 100%;animation:bpuLuaCay .6s ease-in-out infinite alternate}'
    + '.bpu-lua-doi .tia{fill:var(--doi);opacity:0;animation:bpuTia 1.6s ease-out infinite}'
    + '.bpu-lua-doi .tia:nth-of-type(2){animation-delay:.5s}.bpu-lua-doi .tia:nth-of-type(3){animation-delay:1s}'
    + '.bpu-lua-doi b{margin-top:2px;padding:4px 16px;border-radius:999px;background:var(--doi);color:Canvas;font:800 22px/1.3 inherit;letter-spacing:.04em;white-space:nowrap;box-shadow:0 0 18px var(--doi)}'
    + '.bpu-lua-doi b{font-size:22px;font-weight:800;line-height:1.3}'
    + '.mc-em.bpu-the-ton{display:flex;justify-content:center;text-align:center}.mc-em.bpu-the-ton .mc-em-trai{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;text-align:center}.mc-em.bpu-the-ton .mc-em-hang1,.mc-em.bpu-the-ton .mc-ten-hang{justify-content:center;text-align:center;width:100%}'
    + '.mc-em.bpu-the-ton{border-radius:16px;box-shadow:0 0 0 4px var(--bpu-doi),0 0 40px var(--bpu-doi);animation:bpuTheSang 2.4s ease-in-out infinite alternate}'
    + '@keyframes bpuTheSang{from{box-shadow:0 0 0 4px var(--bpu-doi),0 0 22px var(--bpu-doi)}to{box-shadow:0 0 0 4px var(--bpu-doi),0 0 52px var(--bpu-doi)}}'
    + '@keyframes bpuLuaCay{0%{transform:scale(1,1) skewX(0)}50%{transform:scale(.96,1.07) skewX(2deg)}100%{transform:scale(1.03,.95) skewX(-2deg)}}'
    + '@keyframes bpuTia{0%{opacity:0;transform:translate(0,0) scale(1)}20%{opacity:.95}100%{opacity:0;transform:translate(var(--tx,8px),-90px) scale(.3)}}'
    + '@keyframes bpuLuaVao{from{opacity:0;transform:scale(.4) translateY(30px)}to{opacity:1;transform:none}}'
    // danh sách ý / phương án MỘT cột: khung thôi là lưới / flex (khối lưới né cả khung lửa suốt chiều cao) ⇒ từng dòng ý tự né lửa, xuống dưới lửa dùng hết bề ngang.
    // ảnh / bảng rộng bắt đầu cạnh lửa (bị bóp) ⇒ xuống hẳn dưới lửa (clear).
    + 'body.mc-bc .mc-vung-de .mc-ds-pa.bpu-pa-chay{display:block}body.mc-bc .mc-vung-de .mc-ds-pa.bpu-pa-chay>*+*{margin-top:6px}.mc-vung-de .bpu-duoi-lua{clear:left}'
    + '@media (prefers-reduced-motion:reduce){.bpu-lua-doi,.bpu-lua-doi *{animation:none!important}.bpu-lua-doi .tia{display:none}}html.may-yeu .bpu-lua-doi *{animation:none!important}';
  function xoaLua() { Array.prototype.forEach.call(document.querySelectorAll('.bpu-lua-doi'), function (x) { x.remove(); }); ['bpu-the-ton', 'bpu-pa-chay', 'bpu-duoi-lua'].forEach(function (k) { Array.prototype.forEach.call(document.querySelectorAll('.' + k), function (x) { x.classList.remove(k); }); });
    // trả số cột phương án tờ đã chia lúc chưa có lửa (baoLua chia lại theo bề ngang cạnh lửa)
    Array.prototype.forEach.call(document.querySelectorAll('.mc-auto-options'), function (g) { if (g.__bpuCot === undefined) return; if (g.__bpuCot) g.style.setProperty('--mc-option-cols', g.__bpuCot); else g.style.removeProperty('--mc-option-cols'); g.__bpuCot = undefined; }); }
  // 10/11 chữ đề bao quanh lửa: (1) danh sách ý / phương án MỘT cột ⇒ bpu-pa-chay (khung thường, từng ý né lửa riêng, dưới lửa hết bề ngang); 2 / 4 cột giữ lưới.
  // (2) ảnh / bảng bắt đầu cạnh lửa mà bị bóp hẹp hơn cỡ đủ, lưới 2 / 4 cột chỉ chạm mép dưới lửa ⇒ bpu-duoi-lua (clear) — xét theo thứ tự, gặp khối đầu tiên đã dưới lửa thì thôi.
  // Đo lại khi bố cục xong / ảnh nạp xong (số cột do tờ chia lại được).
  function baoLua(v) {
    ['bpu-pa-chay', 'bpu-duoi-lua'].forEach(function (k) { Array.prototype.forEach.call(v.querySelectorAll('.' + k), function (x) { x.classList.remove(k); }); });
    var l = v.querySelector(':scope > .bpu-lua-doi'); if (!l) return;
    // chia lại số cột theo bề ngang CÒN LẠI cạnh lửa (tờ chia lúc chưa có lửa ⇒ 2 cột bị bóp, phương án dài tràn mép); còn 1 cột ⇒ chảy quanh lửa
    Array.prototype.forEach.call(v.querySelectorAll('.mc-auto-options'), function (g) { if (g.__bpuCot === undefined) g.__bpuCot = g.style.getPropertyValue('--mc-option-cols'); });
    if (window.__mcFitOptions) window.__mcFitOptions(v);
    Array.prototype.forEach.call(v.querySelectorAll('.mc-ds-pa'), function (x) {
      var cs = getComputedStyle(x), cot = x.classList.contains('mc-auto-options') ? parseInt(cs.getPropertyValue('--mc-option-cols'), 10) || 1
        : cs.display === 'grid' ? String(cs.gridTemplateColumns || '').trim().split(' ').length : cs.display === 'flex' && cs.flexDirection === 'row' ? 2 : 1;
      if (cot <= 1) x.classList.add('bpu-pa-chay');
    });
    var day = l.getBoundingClientRect().bottom + (parseFloat(getComputedStyle(l).marginBottom) || 0), csv = getComputedStyle(v);
    var trong = v.clientWidth - (parseFloat(csv.paddingLeft) || 0) - (parseFloat(csv.paddingRight) || 0);
    var ds = v.querySelectorAll('.mc-ds-pa,img.q-hinh:not(.mc-anh-pa),.q-bang-cuon');
    for (var i = 0; i < ds.length; i++) {
      var x = ds[i], r = x.getBoundingClientRect(), hep = false;
      if (x.classList.contains('bpu-pa-chay') || (x.parentElement && x.parentElement.closest('.mc-ds-pa'))) continue;
      if (r.top >= day - 1) break;
      if (x.classList.contains('mc-ds-pa')) hep = day - r.top < r.height / 2; // lưới 2 / 4 cột chỉ chạm mép dưới lửa ⇒ xuống hẳn, khỏi bóp cả lưới
      else {
        var muon = 0, b = x.tagName === 'IMG' ? null : x.querySelector('table');
        if (!b) muon = Math.min(trong, x.naturalWidth || 0, x.naturalHeight ? (parseFloat(getComputedStyle(x).maxHeight) || 1e9) * x.naturalWidth / x.naturalHeight : 1e9);
        else { r = b.getBoundingClientRect(); b.style.width = 'max-content'; muon = Math.min(trong, b.getBoundingClientRect().width); b.style.width = ''; }
        hep = muon > r.width + 2;
      }
      if (hep) { x.classList.add('bpu-duoi-lua'); break; }
    }
  }
  function cuonBpu(d) {
    if (!d || !S.bpuCuon) return;
    Array.prototype.forEach.call(d.querySelectorAll('.mc-vung-de'), function (v) {
      baoLua(v); conNua(v);
      // ảnh nạp sau làm đề cao thêm ⇒ đo lại mép mờ «còn nữa ↓» và chỗ ảnh / bảng cạnh lửa
      Array.prototype.forEach.call(v.querySelectorAll('img'), function (im) { if (!im.complete && !im.__bpuNghe) { im.__bpuNghe = true; im.addEventListener('load', function () { baoLua(v); conNua(v); }); } });
    });
  }
  document.addEventListener('mc-bo-cuc-xong', function () { if (S.bpuCuon) cuonBpu(dot()); });
  function luaDoi(d, em) {
    xoaLua();
    var mau = String(em.mau || '').trim(); if (!mau || !/^[#a-z0-9(),.%\\s-]+$/i.test(mau)) return;
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
  // 09/11 Esc một lần ⇒ app ra Hôm nay (đang có phiên Bình Phản Ứng); tờ dùng riêng (không phiên) ⇒ app bỏ qua tin.
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; try { var app = dichApp(); if (app) app.postMessage({ nguon: 'to-chieu', loai: 'bpu-esc' }, '*'); } catch (x) { /* app đã đóng */ } }, true);
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
    baoNhanh((dat ? 'Đạt' : 'Chưa đạt') + (document.body.classList.contains('mc-lk') ? '' : ' — về Bình Phản Ứng')); // buổi live theo khối: ở nguyên màn chiếu, không có màn đua để về
    return true;
  }
`
