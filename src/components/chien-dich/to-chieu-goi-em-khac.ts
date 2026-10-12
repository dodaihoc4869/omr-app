// TỜ CHIẾU · NÚT "GỌI EM KHÁC" (12/10B — Hành trình › Chữa bài › "Chữa câu khó & tính toán", bản vẽ ToChieu-ChuaCauKho thầy duyệt 12/10).
//
// Tờ chuẩn Chiếu lên bảng (`dungToChieu` → `taoHtmlMayChieu`): mỗi đợt MỘT câu MỘT em. Ở đây mỗi câu có SẴN danh sách em của lớp làm sai câu ấy
// (`OChieu.ungVien`, người đầu = em của ô). Mảnh này CHỈ THÊM (không sửa CSS/JS cũ của tờ):
//   · mỗi đợt mang `data-goi-em` = { em: [{sbd, ten, khoa, nhan}], coGhi, chuLop } (JSON đã thoát) — đọc bằng script, không hiện chữ nào;
//   · nút "Gọi em khác" (phím E) trong nhóm nút thanh dưới, ngay sau D / K — chỉ hiện khi ĐÃ GỌI em (pha `chua`), đợt còn em khác, chưa "Thầy chữa";
//     bấm ⇒ em kế tiếp (hết danh sách thì quay về em đầu): đổi tên + dòng "Sai câu này N lần · gần nhất dd/mm · số giây" trong thẻ tên, nhãn vùng làm
//     bài, KHOÁ ô chấm (`.mc-cham[data-khoa]`, dựng lại đúng mảnh `mangNutChamToChieu` — cầu nối đọc khoá lúc bấm) + khoá nút Thầy chữa / mốc X;
//     ô đang chờ ghi ("Đang ghi…") thì chưa cho đổi. Chờ gọi KHÔNG lộ tên ai (luật 4 bản vẽ 28/09): danh sách chỉ nằm trong thuộc tính.
//   · câu THIẾU chuyên đề (`coGhi` false — luật cũ: máy chủ không ghi được): ẩn D / K của đợt ấy, phím D / K chỉ báo "chưa có chuyên đề", không
//     gắn nhãn Đạt giả lên thẻ tên;
//   · dòng số liệu lớp của câu ở thanh dưới ("18/34 em lớp sai câu này").
// Màu: CHỈ biến sẵn có của tờ (`--mc-*`), không màu thô (cổng `kiem:mau-giu`).

/** Một em gọi được của một đợt. `khoa` = khoá ô `sbd|qid` (rỗng ⇒ đợt không có ô ghi / mốc). `nhan` = dòng trong thẻ tên. */
export interface UngVienDot {
  sbd: string
  ten: string
  khoa: string
  nhan: string
}
export interface DotGoiEm {
  em: UngVienDot[]
  /** Đợt có nút Đạt / Chưa đạt (câu có chuyên đề, tờ có cầu nối). */
  coGhi: boolean
  chuLop: string
}

const thoat = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** CHỈ bố cục (không màu mới ngoài biến sẵn có của tờ): dòng số liệu lớp co lại được (không đẩy "Cài đặt" ra ngoài thanh); đợt có danh sách em:
 *  dòng "Sai câu này N lần · gần nhất … · số giây" trong thẻ tên được xuống dòng (cột 1/3 hẹp), đã gọi em thì bỏ nút mờ "Đã gọi lên bảng" (pha "ĐANG CHỮA"
 *  đã nói) và chữ của Tab / ? (giữ phím) để thanh dưới đủ chỗ cho Đạt · Chưa đạt · Gọi em khác như bản vẽ. */
export const CSS_GOI_EM_KHAC = `
.mc-tc-lop-sai{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font:600 max(13px,calc(var(--u)*1.05)) var(--mc-sans);color:var(--mc-bang-phu);white-space:nowrap}
.mc-tc-lop-sai[hidden]{display:none}
body.mc .mc-dot[data-goi-em] .mc-em .mc-ls-chu{white-space:normal;font-size:clamp(12px,1.05vw,20px);line-height:1.3;padding:.2em .7em}
body[data-tc-goi-em][data-pha="chua"] #mc-len-bang,body[data-tc-goi-em][data-pha="goi"] #mc-len-bang{display:none}
body[data-tc-goi-em] .mc-phim-nhom [data-k="Tab"] .mc-nut-chu,body[data-tc-goi-em] .mc-phim-nhom [data-k="?"] .mc-nut-chu{display:none}
body[data-tc-khong-ghi] #mc-phim-nhom [data-k="D"],body[data-tc-khong-ghi] #mc-phim-nhom [data-k="K"]{display:none!important}
@media print{.mc-nut-em-khac,.mc-tc-lop-sai{display:none!important}}
`

export const JS_GOI_EM_KHAC = `
(function () {
  var body = document.body, nhom = document.getElementById('mc-phim-nhom'), thanh = document.getElementById('mc-thanh');
  if (!body || !window.__mcDot) return;
  body.setAttribute('data-tc-goi-em', '');
  function $$(g, s) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function dot() { return window.__mcDot ? window.__mcDot() : null; }
  function du(d) {
    if (!d) return null;
    if (d.__gek === undefined) { var x = null; try { x = JSON.parse(d.getAttribute('data-goi-em') || 'null'); } catch (e) { x = null; } d.__gek = x && Array.isArray(x.em) ? x : null; d.__gekI = 0; }
    return d.__gek;
  }
  function pha() { return body.getAttribute('data-pha') || ''; }
  function baoNhanh(chu) {
    var b = document.querySelector('.mc-bao'); if (!b) return;
    b.textContent = chu; b.classList.add('mc-hien'); clearTimeout(baoNhanh.h);
    baoNhanh.h = setTimeout(function () { b.classList.remove('mc-hien'); }, 1600);
  }
  function tenGoi(t) { var a = String(t || '').trim().split(/\\s+/); return a[a.length - 1] || t; }
  var nut = null;
  if (nhom) {
    nut = document.createElement('button');
    nut.type = 'button'; nut.className = 'mc-nut-phim mc-nut-em-khac'; nut.hidden = true;
    nut.innerHTML = '<kbd>E</kbd><span class="mc-nut-chu">Gọi em khác</span>';
    var k = nhom.querySelector('[data-k="K"]');
    nhom.insertBefore(nut, k ? k.nextSibling : nhom.firstChild);
    nut.addEventListener('click', function () { doiEm(); });
  }
  var lopSai = null;
  if (thanh) {
    lopSai = document.createElement('span'); lopSai.className = 'mc-tc-lop-sai'; lopSai.hidden = true;
    thanh.insertBefore(lopSai, document.getElementById('mc-tiep'));
  }
  /** Gắn khoá em đang gọi lên khung đợt — bảng chi tiết em (bấm thẻ tên) đọc khoá này trước. */
  function ganKhoa(d, e) { var n = d.querySelector('.mc-nua'); if (n && e && e.khoa) n.setAttribute('data-khoa', e.khoa); }
  function khongGhi(d) { var x = du(d); return !!(x && x.em.length && !x.coGhi); }
  function ve() {
    var d = dot(), x = du(d), n = x ? x.em.length : 0;
    if (d && x && n && d.__gekGan === undefined) { d.__gekGan = true; ganKhoa(d, x.em[d.__gekI || 0]); }
    if (nut) {
      nut.hidden = !(n > 1 && pha() === 'chua' && d && !d.hasAttribute('data-thay-chua'));
      var sau = n ? ((d.__gekI || 0) + 1) % n : 0;
      nut.setAttribute('aria-label', n > 1 ? 'Gọi em khác: em ' + (sau + 1) + ' trong ' + n + ' em làm sai câu này' : 'Gọi em khác');
    }
    if (lopSai) { lopSai.textContent = x && x.chuLop ? x.chuLop : ''; lopSai.hidden = !lopSai.textContent; }
    if (khongGhi(d)) body.setAttribute('data-tc-khong-ghi', ''); else body.removeAttribute('data-tc-khong-ghi');
  }
  function doiEm() {
    var d = dot(), x = du(d);
    if (!d || !x || x.em.length < 2) { baoNhanh('Câu này không còn em nào khác làm sai'); return; }
    if (pha() !== 'chua') { baoNhanh('Gọi em lên bảng trước (L)'); return; }
    if (d.hasAttribute('data-thay-chua')) { baoNhanh('Câu này thầy chữa — không gọi em'); return; }
    var cham = d.querySelector('.mc-cham'), tc = d.querySelector('.mc-thay-chua[data-khoa-tc]');
    if ((cham && cham.getAttribute('data-cham') === 'dang') || (tc && tc.getAttribute('data-trang') === 'dang')) { baoNhanh('Đang ghi kết quả — chờ một chút'); return; }
    var i = ((d.__gekI || 0) + 1) % x.em.length, e = x.em[i];
    d.__gekI = i;
    var the = d.querySelector('.mc-em[id]');
    if (the) {
      var ten = the.querySelector('.mc-ten'); if (ten) { ten.textContent = e.ten || e.sbd; ten.classList.remove('mc-ten-reveal'); void ten.offsetWidth; ten.classList.add('mc-ten-reveal'); }
      var sbd = the.querySelector('.mc-sbd'); if (sbd) sbd.textContent = e.sbd;
      var ls = the.querySelector('.mc-ls-chu'); if (ls) ls.textContent = e.nhan || '';
      var kq = the.querySelector('.mc-dau-kq'); if (kq) { kq.hidden = true; kq.textContent = ''; kq.className = 'mc-dau-kq'; }
      $$(the, '.mc-lam-tot').forEach(function (x) { x.remove(); });
      the.classList.remove('mc-em-dat', 'mc-pop'); void the.offsetWidth; the.classList.add('mc-pop');
    }
    $$(d, '[data-nhan-em]').forEach(function (x) { x.setAttribute('data-nhan-em', 'Phần làm bài của ' + tenGoi(e.ten || e.sbd)); if (the && !the.hidden) x.setAttribute('data-nhan', x.getAttribute('data-nhan-em')); });
    if (cham && e.khoa) {
      cham.setAttribute('data-khoa', e.khoa); cham.setAttribute('data-cham', 'cho');
      cham.innerHTML = '<button type="button" class="mc-cham-nut" data-kq="1">Đạt</button><button type="button" class="mc-cham-nut" data-kq="0">Chưa đạt</button><span class="mc-cham-tin" role="status" aria-live="polite"></span>';
    }
    if (tc && e.khoa && tc.getAttribute('data-trang') !== 'dang') tc.setAttribute('data-khoa-tc', e.khoa);
    ganKhoa(d, e);
    baoNhanh('Gọi em khác: ' + (e.ten || e.sbd));
    try { document.dispatchEvent(new CustomEvent('mc-doi-em', { detail: { khoa: e.khoa, sbd: e.sbd } })); } catch (x2) {}
    ve();
  }
  window.__mcGoiEmKhac = doiEm;
  // D / K ở đợt THIẾU chuyên đề: không ghi được ⇒ chặn trước lớp phím của tờ (không gắn nhãn Đạt giả lên thẻ tên), nói thật vì sao.
  window.addEventListener('keydown', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('input,textarea,select')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = String(ev.key || '').toLowerCase();
    if ((k === 'd' || k === 'k') && khongGhi(dot()) && (pha() === 'chua' || pha() === 'goi')) {
      ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation();
      baoNhanh('Câu này chưa có chuyên đề — chưa ghi Đạt / Chưa đạt vào sổ được');
    }
  }, true);
  document.addEventListener('keydown', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('input,textarea,select')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'e' || ev.key === 'E') { ev.preventDefault(); doiEm(); }
  });
  ['mc-vao-dot', 'mc-doi-pha', 'mc-thay-chua', 'mc-noi'].forEach(function (t) { document.addEventListener(t, ve); });
  if (window.MutationObserver) new MutationObserver(ve).observe(body, { attributes: true, attributeFilter: ['data-pha'] });
  ve();
})();
`

/** Chèn dữ liệu đợt + mảnh "Gọi em khác" vào tờ. `dot[i]` ứng với đợt thứ i (`.mc-dot-don[data-dot="i+1"]`); null ⇒ đợt ấy không mang gì.
 *  Số đợt đơn trên tờ khác số phần tử (tờ đổi khuôn) ⇒ trả NGUYÊN tờ: thà không có nút còn hơn gắn nhầm em vào câu khác. */
export function chenGoiEmKhac(html: string, dot: readonly (DotGoiEm | null)[]): string {
  const MO = /<div class="mc-dot mc-dot-don" data-dot="(\d+)"/g
  const soDot = html.match(MO)?.length ?? 0
  if (soDot !== dot.length || !dot.some(Boolean) || !html.includes('</body>')) return html
  const co = html.replace(MO, (m, so: string) => {
    const x = dot[Number(so) - 1]
    return x ? `${m} data-goi-em="${thoat(JSON.stringify(x))}"` : m
  })
  const i = co.lastIndexOf('</body>')
  return `${co.slice(0, i)}<style>${CSS_GOI_EM_KHAC}</style><script>${JS_GOI_EM_KHAC}</script>${co.slice(i)}`
}
