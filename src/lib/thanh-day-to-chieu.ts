// THANH ĐÁY GỌN CỦA TỜ CHIẾU (thầy 11/11, kèm ảnh màn chiếu lúc chưa live: «Phần nút ở dưới chưa gọn, làm cho gọn lại tinh tế đẹp»).
// Trước: thanh xếp ngang hàng Live · đợt · trạng thái · «Lên bảng» · Ai sai · Giải · T · B · P Bình Phản Ứng · Tab · ? · Cài đặt ⇒ chật, tràn mép phải,
// nhiều nút chỉ còn một chữ cái trơ trọi. Bản «K5» sáng 11/11 chỉ gom lúc ĐANG LIVE (nút lưới bấm thì các nút xoè lại thành hàng ngang).
// Nay MỘT cơ chế cho mọi trạng thái (chưa live lẫn đang live):
//   · Trên thanh, từ trái: viên Live · ◂ Đợt k/n ▸ · trạng thái lượt · nút THEO NGỮ CẢNH («Lên bảng» là nút chính; «Thầy chữa», «Đạt», «Không đạt»,
//     «Gọi em khác» chỉ hiện đúng lúc dùng được — vẫn là con trực tiếp của #mc-phim-nhom như cũ) · ghi chú · nút «thêm» (lưới) ở mép phải.
//   · Mọi nút phụ thường trực vào KHAY của nút «thêm»: có NHÃN CHỮ + phím tắt, ba nhóm «Câu này» (Giải, Ai sai, Thống kê) · «Lớp và bảng»
//     (Bình Phản Ứng, Bút, Thu gọn tên) · «Màn chiếu» (Tổng quan, Phím tắt, Cài đặt). Chạm ra ngoài / Esc / chọn xong / 8 giây không chạm ⇒ khay thu.
//   · Nút đang bật (lời giải mở, thống kê, bút) ⇒ CHẤM trên nút «thêm» + dòng tô đặc trong khay.
//   · 11/11 tối · đang live ⇒ thẻ «Đang nói» ĐẦY ĐỦ là khối đầu khay, trọn một hàng trên ba nhóm (mặt live dựng: live-to-chieu.ts lvVeKhoi); có em nói /
//     giơ tay ⇒ DẤU ĐỎ ở góc trái nút «thêm» (__mcKhay.noi). Khối không phải nhóm ⇒ dau() không đụng; bấm trong khối KHÔNG làm khay thu, khay không tự thu
//     sau 8 giây khi có khối (như thẻ cũ: chỉ Esc / chạm ra ngoài).
// CÁCH LÀM: không dựng nút mới — CHUYỂN chính các nút cũ vào khay nằm TRONG #mc-phim-nhom ⇒ bộ nghe bấm của nhóm, veThanh (ẩn / hiện, «Giải» ⇄ «Ẩn giải»,
// mc-bat) và mọi phím tắt chạy y như cũ; khay chỉ là lối bấm chuột / chạm. Tờ không có nhóm phím ⇒ đoạn này không làm gì.
// Bàn phím: Tab của tờ vốn là phím tắt «Tổng quan» ⇒ CHỈ khi khay đang mở, Tab / Shift+Tab mới đi giữa các nút của khay (Enter để chọn, Esc để thu).
// Đoạn JS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · thanh · nhom). Màu: chỉ biến sẵn có của tờ (--mc-*). Dáng nút «thêm» (.mc-lv-gon)
// khai ở live-to-chieu.ts từ bản K5 — giữ nguyên chỗ (cổng giữ màu so theo tệp).

export const CSS_THANH_DAY = `
/* 7d · thanh đáy gọn 11/11: nút theo ngữ cảnh ở ngoài, nút phụ vào khay của nút «thêm» */
body.mc .mc-thanh{--td-cao:max(40px,calc(var(--u)*2.6))}
body.mc .mc-thanh #mc-len-bang,body.mc .mc-thanh .mc-lv-nut,body.mc .mc-thanh .mc-lv-cum{min-height:var(--td-cao)}
body.mc .mc-thanh .mc-phim-nhom>.mc-nut-phim{height:var(--td-cao)}
body.mc .mc-thanh .mc-td-them{position:relative;width:var(--td-cao);height:var(--td-cao);margin-left:auto;touch-action:manipulation;background:none;box-shadow:none}
.mc-td-vien{display:grid;place-items:center;width:64%;height:64%;border-radius:30%;background:color-mix(in srgb,var(--mc-bang-chu) 8%,var(--mc-bang-nut));box-shadow:inset 0 0 0 1px var(--mc-bang-vien),inset 0 1px 0 color-mix(in srgb,var(--mc-bang-chu) 18%,transparent);transition:transform .14s}
.mc-td-them:hover .mc-td-vien{transform:scale(1.07)}
body.mc .mc-thanh .mc-td-them svg{width:62%;height:62%}
.mc-td-them::after{content:"";position:absolute;top:11%;right:11%;display:none;width:max(9px,calc(var(--u)*.7));height:max(9px,calc(var(--u)*.7));border-radius:50%;background:var(--mc-vang-noi);box-shadow:0 0 0 2px var(--mc-thanh-nen)}
.mc-td-them[data-bat]::after{display:block}
body.mc .mc-thanh .mc-td-them[aria-expanded="true"]{background:none;box-shadow:none}
body.mc .mc-thanh .mc-td-them[aria-expanded="true"] .mc-td-vien{background:var(--mc-bang-chu);box-shadow:none;color:var(--mc-thanh2)}
body.mc-khay-mo .mc-thanh{z-index:46}
/* «Đã gọi lên bảng» (nút đã khoá) lặp lại đúng điều viên trạng thái «ĐANG CHỮA» / «MỜI LÊN BẢNG» đang nói ⇒ nhường chỗ cho nút dùng được */
body.mc .mc-thanh #mc-len-bang:disabled{display:none}
/* thanh chật (JS đo: nút «thêm» chạm mép phải) ⇒ gọn dần từng mức data-gon 1 → 4, không bao giờ tràn: (1) viên Live bỏ chữ phụ; (2) nút theo ngữ cảnh bỏ ô phím;
   (3) viên Live bỏ ngăn «em nghe» / «Đang ghi» khi hai ngăn ấy không báo lỗi; (4) bỏ viên trạng thái lượt */
body.mc .mc-thanh[data-gon]{gap:calc(var(--u)*.35)}
.mc-thanh[data-gon] .mc-lv-cum small,.mc-thanh[data-gon] .mc-lv-cum>span.ghi b{display:none}
.mc-thanh[data-gon] .mc-lv-cum>span{padding:0 .6em}
body.mc .mc-thanh[data-gon]:not([data-gon="1"]) .mc-phim-nhom>.mc-nut-phim kbd{display:none}
.mc-thanh[data-gon="3"] .mc-lv-cum>span.ghi,.mc-thanh[data-gon="4"] .mc-lv-cum>span.ghi,.mc-thanh[data-gon="3"] .mc-lv-cum>span[aria-label^="Số em đang nghe"]:not(.im),.mc-thanh[data-gon="4"] .mc-lv-cum>span[aria-label^="Số em đang nghe"]:not(.im){display:none}
body.mc .mc-thanh[data-gon="4"] .mc-pha{display:none}
.mc-khay{position:fixed;right:10px;bottom:calc(8px + max(44px,calc(var(--u)*3.6)) + var(--u)*.6);z-index:46;display:flex;align-items:stretch;gap:calc(var(--u)*.7);max-width:calc(100vw - 20px);padding:calc(var(--u)*.8);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);font-family:var(--mc-sans);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(calc(var(--u)*.5)) scale(.98);transform-origin:100% 100%;transition:opacity .14s ease-out,transform .14s ease-out,visibility 0s linear .14s}
body.mc-khay-mo .mc-khay{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s}
.mc-khay-nhom{flex:1 1 0;display:flex;flex-direction:column;gap:calc(var(--u)*.15);min-width:calc(var(--u)*12.5)}
.mc-khay-nhom[hidden]{display:none}
.mc-khay-nhom+.mc-khay-nhom{padding-left:calc(var(--u)*.7);border-left:1px solid var(--mc-bang-vien)}
.mc-khay-ten{padding:calc(var(--u)*.2) calc(var(--u)*.8) calc(var(--u)*.4);color:var(--mc-bang-phu);font:700 max(11px,calc(var(--u)*.78)) var(--mc-sans);letter-spacing:.07em;text-transform:uppercase;white-space:nowrap}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim,body.mc .mc-thanh .mc-khay #mc-cai-btn{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--u)*1.2);width:100%;height:auto;min-height:max(40px,calc(var(--u)*2.9));margin:0;padding:0 calc(var(--u)*.8);border:0;border-radius:calc(var(--u)*.8);background:transparent;box-shadow:none;color:var(--mc-bang-chu);font:600 max(13px,calc(var(--u)*1.1)) var(--mc-sans);text-align:left;white-space:nowrap;cursor:pointer;touch-action:manipulation}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim[hidden]{display:none}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim .mc-nut-chu{display:inline!important;margin:0;font-weight:inherit}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim kbd{order:2;flex:none;min-width:1.75em;padding:.12em .4em;border-radius:.35em;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-phu);font-size:.84em;font-weight:700}
@media (hover:hover){body.mc .mc-phim-nhom .mc-khay .mc-nut-phim:hover,body.mc .mc-thanh .mc-khay #mc-cai-btn:hover{background:var(--mc-bang-nut)}}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim.mc-bat,body.mc .mc-phim-nhom .mc-khay .mc-nut-phim[aria-pressed="true"]{background:var(--mc-bang-chu);color:var(--mc-thanh2)}
body.mc .mc-phim-nhom .mc-khay .mc-nut-phim.mc-bat kbd,body.mc .mc-phim-nhom .mc-khay .mc-nut-phim[aria-pressed="true"] kbd{background:var(--mc-thanh2);box-shadow:none;color:var(--mc-bang-chu)}
.mc-khay button:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:-3px}
/* hộp Cài đặt mở đúng chỗ khay vừa thu (trước neo cứng 58 px: màn rộng thì đè lên thanh) */
#mc-cai-dat{bottom:calc(8px + max(44px,calc(var(--u)*3.6)) + var(--u)*.6)}
/* 11/11 tối · dấu «có em nói» ở góc TRÁI nút «thêm» (chấm vàng «đang bật» ở góc phải): đặc đỏ = em đang nói / đã mời; vòng đỏ = chỉ có em giơ tay */
.mc-td-them::before{content:"";position:absolute;top:10%;left:10%;display:none;width:max(10px,calc(var(--u)*.78));height:max(10px,calc(var(--u)*.78));border-radius:50%;background:var(--mc-do);box-shadow:0 0 0 2px var(--mc-thanh-nen)}
.mc-td-them[data-noi]::before{display:block}
.mc-td-them[data-noi="tay"]::before{background:var(--mc-thanh-nen);box-shadow:inset 0 0 0 2.5px var(--mc-do),0 0 0 2px var(--mc-thanh-nen)}
/* dải «Đang nói» bản 11/11 (đã thay bằng khối đầy đủ bên dưới): giữ khai báo màu theo cổng kiem:mau-giu; .mc-khay-noi .mc-lv-n vẫn dùng (nút ≥ 40 px) */
.mc-khay-noi{position:absolute;right:0;bottom:calc(100% + var(--u)*.6);box-sizing:border-box;display:flex;align-items:center;gap:calc(var(--u)*.6);min-width:100%;max-width:calc(100vw - 20px);padding:calc(var(--u)*.5);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 2px var(--mc-do)}
.mc-khay-noi[hidden]{display:none}
.mc-khay-noi-mo{flex:1;min-width:0;display:flex;align-items:center;gap:calc(var(--u)*.6);min-height:max(40px,calc(var(--u)*2.9));padding:0 calc(var(--u)*.8);border:0;border-radius:calc(var(--u)*.8);background:transparent;color:var(--mc-bang-chu);font:600 max(13px,calc(var(--u)*1.1)) var(--mc-sans);text-align:left;white-space:nowrap;cursor:pointer;touch-action:manipulation}
.mc-khay-noi-mo svg{width:1.25em;height:1.25em;flex:none;fill:none;stroke:var(--mc-do);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.mc-khay-noi-chu{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.mc-khay-noi-chu b{overflow:hidden;text-overflow:ellipsis;font-weight:700}
.mc-khay-noi-chu small{color:var(--mc-bang-phu);font:600 max(11px,calc(var(--u)*.8)) var(--mc-sans)}
.mc-khay-noi-mo kbd{flex:none;min-width:1.75em;padding:.12em .4em;border-radius:.35em;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-phu);font-size:.84em;font-weight:700;text-align:center}
@media (hover:hover){.mc-khay-noi-mo:hover{background:var(--mc-bang-nut)}}
.mc-khay-noi-mo[aria-expanded="true"]{background:var(--mc-bang-chu);color:var(--mc-thanh2)}
.mc-khay-noi-mo[aria-expanded="true"] small{color:var(--mc-thanh2)}
.mc-khay-noi-mo[aria-expanded="true"] kbd{background:var(--mc-thanh2);box-shadow:none;color:var(--mc-bang-chu)}
.mc-khay-noi .mc-lv-n{flex:none;height:auto;min-height:max(40px,calc(var(--u)*2.9));padding:0 1.1em;font-size:max(13px,calc(var(--u)*1.05));touch-action:manipulation}
@media (max-width:900px){.mc-khay-noi{position:static;min-width:0;max-width:none;flex:none;box-shadow:inset 0 0 0 2px var(--mc-do)}}
/* khối «Đang nói» đầu khay: khay xuống dòng, khối trọn hàng trên ba nhóm và không làm khay rộng ra (contain + lề âm bù một khoảng gap); khay cao quá màn ⇒ cuộn */
.mc-khay{flex-wrap:wrap;max-height:calc(100vh - 18px - max(44px,calc(var(--u)*3.6)) - var(--u)*.6);overflow-y:auto;overscroll-behavior:contain}
.mc-khay-noi{position:static;flex:0 0 100%;contain:inline-size;margin-right:calc(var(--u)*-.7);flex-direction:column;align-items:flex-start;min-width:0;max-width:none;padding:0;border-radius:0;background:none;box-shadow:none}
.mc-khay-noi .mc-lv-noi{box-sizing:border-box;width:100%;box-shadow:inset 0 0 0 1px var(--mc-bang-vien)}
.mc-khay-noi.co-mic .mc-lv-noi:first-child{box-shadow:inset 0 0 0 2px var(--mc-do)}
.mc-khay-noi .mc-lv-noi.chua h3{color:var(--mc-bang-phu);font-weight:700}
.mc-khay-noi .mc-lv-roi-gon{min-height:40px;box-shadow:inset 0 0 0 1.5px var(--mc-vang-noi)}
.mc-khay-noi svg{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
@media (max-width:900px){.mc-khay{flex-wrap:nowrap}.mc-khay-noi{flex:none;contain:none;margin-right:0}}
@media (max-width:900px){.mc-khay{flex-direction:column;align-items:stretch;bottom:62px;max-height:calc(100vh - 76px);overflow-y:auto;overscroll-behavior:contain}.mc-khay-nhom{flex:none}.mc-khay-nhom+.mc-khay-nhom{padding-left:0;border-left:0}}
@media (prefers-reduced-motion:reduce){.mc-khay{transition:none;transform:none}}
html.may-yeu .mc-khay{transition:none;transform:none}
`

export const JS_THANH_DAY = `
  // ── W · thanh đáy gọn (thầy 11/11): nút phụ vào khay của nút «thêm»; nút theo ngữ cảnh + phím tắt giữ nguyên ──
  var TD = { mo: false, h: 0, cho: 0, ro: null, le: -1, noi: '', noiChu: '' };
  (function () {
    var XEP = [['Câu này', ['G', 'X', 'T']], ['Lớp và bảng', ['P', 'B', '#mc-st-nut']], ['Màn chiếu', ['Tab', '?', '#mc-cai-btn']]];
    var TEN = { G: 'Lời giải', T: 'Thống kê', B: 'Bút' };
    var nut, khay, i, j, g, b, c;
    if (!thanh || !nhom) return;
    nut = document.createElement('button'); khay = tao('div', 'mc-khay', nhom);
    khay.id = 'mc-khay'; khay.setAttribute('role', 'group'); khay.setAttribute('aria-label', 'Các nút điều khiển');
    for (i = 0; i < XEP.length; i++) {
      g = tao('div', 'mc-khay-nhom', khay); g.setAttribute('role', 'group'); g.setAttribute('aria-label', XEP[i][0]);
      c = tao('span', 'mc-khay-ten', g); c.textContent = XEP[i][0]; c.setAttribute('aria-hidden', 'true');
      for (j = 0; j < XEP[i][1].length; j++) {
        c = XEP[i][1][j];
        b = c.charAt(0) === '#' ? document.getElementById(c.slice(1)) : nhom.querySelector('[data-k="' + c + '"]');
        if (b) g.appendChild(b);
      }
    }
    c = khay.querySelector('[data-k="?"] .mc-nut-chu');
    if (c && c.textContent === 'Phím') c.textContent = 'Phím tắt';
    nut.type = 'button'; nut.id = 'mc-them'; nut.className = 'mc-lv-gon mc-td-them';
    nut.setAttribute('aria-expanded', 'false'); nut.setAttribute('aria-controls', 'mc-khay');
    nut.title = 'Thêm nút điều khiển (phím tắt vẫn dùng được)';
    // (thầy 12/11 «cái nút này làm nhỏ lại, đẹp hơn nữa») viên bo góc nhỏ gọn nằm giữa vùng bấm (vùng bấm vẫn đủ --td-cao), bốn ô nhỏ bo tròn
    nut.innerHTML = '<span class="mc-td-vien"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7.6" height="7.6" rx="2.4"/><rect x="13.4" y="3" width="7.6" height="7.6" rx="2.4"/><rect x="3" y="13.4" width="7.6" height="7.6" rx="2.4"/><rect x="13.4" y="13.4" width="7.6" height="7.6" rx="2.4"/></svg></span>';
    thanh.appendChild(nut);
    // các nút đang bấm được của khay (bỏ nút ẩn, nhóm ẩn)
    function ds() { return Array.prototype.filter.call(khay.querySelectorAll('button'), function (x) { return !x.hidden && !x.disabled && !x.parentNode.hidden; }); }
    function hen() { clearTimeout(TD.h); if (TD.mo && !khay.querySelector('.mc-khay-noi:not([hidden])')) TD.h = setTimeout(function () { mo(false); }, 8000); }
    function mo(v, tieu) {
      var d;
      TD.mo = !!v; body.classList.toggle('mc-khay-mo', TD.mo); nut.setAttribute('aria-expanded', TD.mo ? 'true' : 'false'); hen();
      if (TD.mo && tieu) { d = ds(); if (d[0]) d[0].focus(); }
    }
    // chấm «đang bật» trên nút thêm (lời giải mở · thống kê · bút) + nhóm không còn nút nào thì ẩn cả tên nhóm
    function dau() {
      var bat = [], gs = khay.children, i, j, bs, x, co, chu;
      for (i = 0; i < gs.length; i++) {
        if (!gs[i].classList.contains('mc-khay-nhom')) continue;
        bs = gs[i].querySelectorAll('button'); co = false;
        for (j = 0; j < bs.length; j++) {
          x = bs[j];
          if (x.hidden) continue;
          co = true;
          if (x.classList.contains('mc-bat')) { chu = x.querySelector('.mc-nut-chu'); bat.push(TEN[x.getAttribute('data-k')] || (chu ? chu.textContent : '')); }
        }
        if (gs[i].hidden !== !co) gs[i].hidden = !co;
      }
      chu = 'Thêm nút điều khiển' + (bat.length ? ', đang bật: ' + bat.join(', ') : '') + (TD.noiChu ? ', ' + TD.noiChu : '');
      if (nut.getAttribute('aria-label') !== chu) nut.setAttribute('aria-label', chu);
      if (bat.length) nut.setAttribute('data-bat', String(bat.length)); else nut.removeAttribute('data-bat');
      if (TD.noi) nut.setAttribute('data-noi', TD.noi); else nut.removeAttribute('data-noi');
    }
    // KHÔNG BAO GIỜ TRÀN: thanh chật ⇒ gọn dần từng mức (data-gon 1 → 4, CSS ở trên) tới khi nút «thêm» nằm trọn trong lề phải của thanh.
    // Đo lại khi cỡ một thứ trên thanh đổi (ResizeObserver); máy không có ⇒ đo lại khi một nút ẩn / hiện và khi tờ xếp lại bố cục.
    function le() { if (TD.le < 0) TD.le = parseFloat(getComputedStyle(thanh).paddingRight) || 8; return TD.le; }
    function vua() {
      var m = 0;
      TD.cho = 0;
      thanh.removeAttribute('data-gon');
      while (m < 4 && nut.getBoundingClientRect().right > thanh.getBoundingClientRect().right - le() + 0.5) thanh.setAttribute('data-gon', String(++m));
    }
    window.addEventListener('resize', function () { TD.le = -1; });
    function henVua() { if (!TD.cho) TD.cho = requestAnimationFrame(vua); }
    function xem() { var a = Array.prototype.slice.call(thanh.children).concat(Array.prototype.slice.call(nhom.children)), i; for (i = 0; i < a.length; i++) if (a[i] !== khay) TD.ro.observe(a[i]); }
    if (window.ResizeObserver && window.requestAnimationFrame) {
      TD.ro = new ResizeObserver(henVua); TD.ro.observe(thanh); xem();
      // nút thêm vào thanh / nhóm phím về sau («Gọi em khác», dòng «em lớp sai») cũng được theo dõi; KHÔNG theo cả cây con (đồng hồ viên Live đổi chữ mỗi giây)
      if (window.MutationObserver) [thanh, nhom].forEach(function (x) { new MutationObserver(function () { xem(); henVua(); }).observe(x, { childList: true }); });
    } else {
      if (window.MutationObserver) new MutationObserver(vua).observe(thanh, { attributes: true, attributeFilter: ['hidden'], subtree: true });
      document.addEventListener('mc-bo-cuc-xong', vua);
    }
    nut.addEventListener('click', function (e) { mo(!TD.mo, e.detail === 0); });
    // chọn xong ⇒ khay thu (bộ nghe của nhóm phím chạy ngay sau, lệnh không đổi); chọn bằng bàn phím ⇒ trả tiêu điểm về nút thêm
    khay.addEventListener('click', function (e) {
      var x = e.target.closest ? e.target.closest('button') : null;
      // bấm trong khối «Đang nói» (kể cả nút vừa bị vẽ lại, đã rời khay) ⇒ khay giữ nguyên
      if (!x || !khay.contains(x) || x.closest('.mc-khay-noi')) return;
      mo(false);
      if (e.detail === 0 && document.activeElement === x) nut.focus();
    });
    (window.PointerEvent ? ['pointerdown'] : ['touchstart', 'mousedown']).forEach(function (t) {
      document.addEventListener(t, function (e) { if (TD.mo) { if (khay.contains(e.target)) hen(); else if (!nut.contains(e.target)) mo(false); } }, true);
    });
    document.addEventListener('keydown', function (e) {
      var d, k;
      if (!TD.mo || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); k = khay.contains(document.activeElement); mo(false); if (k) nut.focus(); }
      else if (e.key === 'Tab') {
        e.preventDefault(); e.stopImmediatePropagation();
        d = ds(); k = d.indexOf(document.activeElement);
        k = e.shiftKey ? (k <= 0 ? d.length - 1 : k - 1) : (k + 1) % d.length;
        if (d[k]) d[k].focus();
        hen();
      }
    }, true);
    // sóng âm trong khối «Đang nói» đổi lớp ~11 lần / giây ⇒ bỏ qua, chỉ soát khi nút của nhóm đổi
    if (window.MutationObserver) new MutationObserver(function (r) { for (var i = 0; i < r.length; i++) if (!(r[i].target.closest && r[i].target.closest('.mc-khay-noi'))) { dau(); return; } }).observe(khay, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true });
    dau(); vua();
    window.__mcKhay = { mo: function (v) { mo(v); }, dangMo: function () { return TD.mo; }, vua: vua,
      // mặt live báo: kiểu dấu ('noi' | 'tay' | '' = không dấu) + câu đọc màn hình nối vào nhãn nút «thêm»
      noi: function (k, c) { k = k || ''; c = c || ''; if (TD.noi === k && TD.noiChu === c) return; TD.noi = k; TD.noiChu = c; dau(); } };
  })();
`
