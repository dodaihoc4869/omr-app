// TỜ MÁY CHIẾU — GỌI HAI EM LÊN BẢNG MỘT ĐỢT.
//
// Thầy chốt 14/09: "tạo ra 1 file html thiết kế theo chuẩn quay ngang được chia
// làm 2 phần, mỗi một trang sẽ in tên 2 học sinh vào 2 nửa và đề bài đi kèm để
// gọi lên bảng, đề bài có nút hiện lời giải, phần dưới trắng để học sinh lên
// bảng làm ở trên bảng khi tôi chiếu lên, file html này xong 1 đợt thì lại kéo
// xuống hoặc bấm tiếp để hiện 2 đề và 2 học sinh tiếp theo."
//
// Đọc ra bốn ràng buộc, và đây là chỗ giữ cả bốn:
//   1. QUAY NGANG, chia đôi theo chiều dọc — hai nửa là hai nửa bảng thật.
//   2. Mỗi nửa: TÊN EM trên cùng, ĐỀ BÀI ngay dưới, rồi CHỪA TRẮNG. Khoảng
//      trắng ấy chiếu lên bảng chính là chỗ em viết, nên nó phải thật sự trắng
//      và phải chiếm nửa dưới màn hình.
//   3. Mỗi nửa có nút hiện lời giải RIÊNG — chữa xong em nào thì mở em ấy.
//   4. Một đợt một màn. Kéo xuống hay bấm "Tiếp" đều sang hai em tiếp theo.
//
// Chữ và công thức đi qua đúng `chuHtml` của phiếu, nên mhchem, chỉ số dưới và
// ký tự hoá học hiện y như mọi tờ khác. Lời giải dùng lại `oGiaiHtml` — cùng
// một khuôn với báo cáo và phiếu, không dựng khuôn thứ hai.
import type { CauLuyen } from './bai-tap-pdf'
import { CSS_PHIEU, anhHtml, bangHtml, chuHtml, hinhTaiViTri, oGiaiHtml, thoat } from './html-phieu'

/** Một ô bảng: một em, một câu. */
export interface OBang {
  sbd: string
  hoTen: string
  /** Số thứ tự câu in cho em nhìn. */
  soCau: number
  cau: CauLuyen
  /** Vì sao gọi đúng em này lên câu này — in nhỏ dưới tên. */
  viSao?: string
}

export interface TuyChonMayChieu {
  tenBuoi?: string
  ngay?: Date
}

const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']

function ngayVn(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Thân câu cho máy chiếu: đề, bảng, ảnh, rồi các phương án / ý.
 *
 * KHÔNG in đáp án ở đây. Đáp án nằm trong khối lời giải, và khối ấy đóng cho
 * tới khi thầy bấm — nếu không thì chiếu lên là cả lớp đọc được đáp án trước
 * khi em kịp cầm phấn. */
function thanCauHtml(c: CauLuyen): string {
  const khoi: string[] = []

  if (c.anhThanCau) {
    khoi.push(anhHtml(c.anhThanCau, 'mc-anh', 'Ảnh đề bài'))
  } else {
    khoi.push(`<div class="mc-de">${chuHtml(c.text)}</div>`)
  }
  khoi.push(hinhTaiViTri(c, 'sau_de'))
  khoi.push(bangHtml(c.bang))

  if (c.phan === 'I' && c.luaChon && c.luaChon.length > 0) {
    const o = c.luaChon.map((nd, i) => {
      const anh = c.anhLuaChon?.[i]
      const than = anh ? anhHtml(anh, 'mc-anh-pa', `Phương án ${CHU_PA[i]}`) : chuHtml(nd)
      return `<div class="mc-pa"><span class="mc-ky">${CHU_PA[i] ?? i + 1}</span><span class="mc-pa-chu">${than}</span></div>${hinhTaiViTri(c, `sau_pa_${CHU_PA[i]}`)}`
    })
    khoi.push(`<div class="mc-ds-pa">${o.join('')}</div>`)
  } else if (c.phan === 'II' && c.luaChon && c.luaChon.length > 0) {
    const o = c.luaChon.map((nd, i) => {
      const anh = c.anhLuaChon?.[i]
      const than = anh ? anhHtml(anh, 'mc-anh-pa', `Ý ${CHU_Y[i]}`) : chuHtml(nd)
      return `<div class="mc-pa"><span class="mc-ky">${CHU_Y[i] ?? i + 1}</span><span class="mc-pa-chu">${than}</span></div>${hinhTaiViTri(c, `sau_y_${CHU_Y[i]}`)}`
    })
    khoi.push(`<div class="mc-ds-pa">${o.join('')}</div>`)
  } else if (c.phan === 'III') {
    khoi.push('<div class="mc-ngan">Trả lời ngắn — em viết kết quả và trình bày các bước lên bảng.</div>')
  }

  khoi.push(hinhTaiViTri(c, 'cuoi_cau'))
  return khoi.filter(Boolean).join('')
}

/** Một nửa bảng. `oB` rỗng nghĩa là đợt cuối lẻ một em — nửa kia để trắng hẳn,
 * không bịa thêm một em nào cho đủ cặp. */
function nuaHtml(o: OBang | undefined, viTri: 'trai' | 'phai', maDot: number): string {
  if (!o) {
    return `<section class="mc-nua mc-${viTri} mc-trong" aria-hidden="true"><div class="mc-trong-chu">Đợt này chỉ gọi một em</div></section>`
  }
  const ma = `giai-${maDot}-${viTri}`
  return `<section class="mc-nua mc-${viTri}">
  <header class="mc-em">
    <div class="mc-ten">${thoat(o.hoTen || o.sbd)}</div>
    <div class="mc-phu"><span class="mc-sbd">${thoat(o.sbd)}</span><span class="mc-cau-so">Câu ${o.soCau} · Phần ${o.cau.phan}</span></div>
    ${o.viSao ? `<div class="mc-viSao">${thoat(o.viSao)}</div>` : ''}
  </header>
  <div class="mc-than">${thanCauHtml(o.cau)}</div>
  <div class="mc-giai-vung">
    <button type="button" class="mc-nut-giai" aria-expanded="false" aria-controls="${ma}">
      <span class="mc-nut-chu">Hiện lời giải</span>
    </button>
    <div class="mc-giai" id="${ma}" hidden>${oGiaiHtml(o.cau)}</div>
  </div>
  <div class="mc-trang" aria-hidden="true"></div>
</section>`
}

/** CSS riêng cho máy chiếu. Chồng lên `CSS_PHIEU` nên khối lời giải vẫn y hệt
 * mọi tờ khác; chỉ cỡ chữ và bố cục là của phòng học có máy chiếu. */
const CSS_MAY_CHIEU = `
:root { --mc-vien: rgb(226, 232, 240); --mc-nen: rgb(255, 255, 255); --mc-muc: rgb(15, 23, 42); --mc-nhat: rgb(100, 116, 139); --mc-xanh: rgb(26, 115, 232); --mc-xanh-nen: rgb(232, 240, 254); }
@media (prefers-color-scheme: dark) {
  :root:not([data-sang]) { --mc-vien: rgb(51, 65, 85); --mc-nen: rgb(15, 23, 42); --mc-muc: rgb(241, 245, 249); --mc-nhat: rgb(148, 163, 184); --mc-xanh: rgb(138, 180, 248); --mc-xanh-nen: rgb(30, 41, 59); }
}
body.mc { margin: 0; background: var(--mc-nen); color: var(--mc-muc); }
.mc-thanh { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 12px; padding: 10px 20px; background: var(--mc-nen); border-bottom: 1px solid var(--mc-vien); font-family: var(--sans, system-ui, sans-serif); }
.mc-thanh-ten { font-weight: 800; font-size: 15px; }
.mc-thanh-phu { color: var(--mc-nhat); font-size: 13px; }
.mc-dem { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 15px; }
.mc-dieu { display: flex; gap: 8px; }
.mc-dieu button { min-height: 40px; padding: 0 18px; border: none; border-radius: 999px; background: var(--mc-xanh); color: rgb(255,255,255); font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; }
.mc-dieu button[disabled] { opacity: .38; cursor: default; }
.mc-dot { display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: calc(100vh - 61px); scroll-snap-align: start; border-bottom: 4px solid var(--mc-vien); }
.mc-nua { display: flex; flex-direction: column; padding: 18px 22px 0; min-width: 0; }
.mc-trai { border-right: 2px dashed var(--mc-vien); }
.mc-trong { align-items: center; justify-content: center; }
.mc-trong-chu { color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 15px; }
.mc-em { padding-bottom: 10px; border-bottom: 2px solid var(--mc-xanh); }
.mc-ten { font-family: var(--sans, system-ui, sans-serif); font-weight: 900; font-size: clamp(22px, 2.4vw, 34px); line-height: 1.2; }
.mc-phu { display: flex; gap: 14px; margin-top: 3px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 14px; font-variant-numeric: tabular-nums; }
.mc-viSao { margin-top: 4px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 13px; }
.mc-than { padding-top: 12px; }
.mc-de { font-family: var(--serif, Georgia, serif); font-size: clamp(17px, 1.5vw, 23px); line-height: 1.55; }
.mc-ds-pa { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.mc-pa { display: flex; gap: 10px; align-items: baseline; font-family: var(--serif, Georgia, serif); font-size: clamp(16px, 1.35vw, 21px); line-height: 1.5; }
.mc-ky { flex: none; width: 28px; height: 28px; border-radius: 999px; background: var(--mc-xanh-nen); color: var(--mc-xanh); font-family: var(--sans, system-ui, sans-serif); font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
.mc-pa-chu { min-width: 0; }
.mc-ngan { margin-top: 10px; color: var(--mc-nhat); font-family: var(--sans, system-ui, sans-serif); font-size: 14px; }
.mc-anh, .mc-anh-pa { display: block; max-width: 100%; height: auto; }
.mc-anh { max-height: 30vh; object-fit: contain; margin: 8px 0; }
.mc-anh-pa { max-height: 12vh; object-fit: contain; }
.mc-giai-vung { margin-top: 12px; }
.mc-nut-giai { min-height: 40px; padding: 0 16px; border: 1px solid var(--mc-vien); border-radius: 999px; background: transparent; color: var(--mc-muc); font-family: var(--sans, system-ui, sans-serif); font-weight: 700; font-size: 14px; cursor: pointer; }
.mc-nut-giai[aria-expanded="true"] { background: var(--mc-xanh-nen); color: var(--mc-xanh); border-color: var(--mc-xanh-nen); }
.mc-giai { margin-top: 10px; }
/* PHẦN TRẮNG — chỗ em viết trên bảng thật. Nó phải trắng, và phải còn lại. */
.mc-trang { flex: 1 1 auto; min-height: 34vh; }
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .mc-thanh { display: none; }
  .mc-dot { min-height: 0; page-break-after: always; border-bottom: none; }
  .mc-giai { display: block !important; }
}
@media (max-width: 900px) {
  .mc-dot { grid-template-columns: 1fr; }
  .mc-trai { border-right: none; border-bottom: 2px dashed var(--mc-vien); }
  .mc-trang { min-height: 22vh; }
}
`

const JS_MAY_CHIEU = `
(function () {
  var dots = Array.prototype.slice.call(document.querySelectorAll('.mc-dot'));
  var dem = document.getElementById('mc-dem');
  var truoc = document.getElementById('mc-truoc');
  var sau = document.getElementById('mc-sau');
  var i = 0;

  function ve() {
    if (dem) dem.textContent = 'Đợt ' + (i + 1) + '/' + dots.length;
    if (truoc) truoc.disabled = i <= 0;
    if (sau) sau.disabled = i >= dots.length - 1;
  }
  function den(k) {
    if (!dots.length) return;
    i = Math.max(0, Math.min(dots.length - 1, k));
    dots[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    ve();
  }
  if (truoc) truoc.addEventListener('click', function () { den(i - 1); });
  if (sau) sau.addEventListener('click', function () { den(i + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); den(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); den(i - 1); }
  });

  // Kéo tay cũng phải cập nhật số đợt, nếu không đếm một đằng chiếu một nẻo.
  if ('IntersectionObserver' in window) {
    var ob = new IntersectionObserver(function (mucs) {
      mucs.forEach(function (m) {
        if (!m.isIntersecting) return;
        var k = dots.indexOf(m.target);
        if (k >= 0) { i = k; ve(); }
      });
    }, { threshold: 0.5 });
    dots.forEach(function (d) { ob.observe(d); });
  }

  document.addEventListener('click', function (e) {
    var nut = e.target && e.target.closest ? e.target.closest('.mc-nut-giai') : null;
    if (!nut) return;
    var o = document.getElementById(nut.getAttribute('aria-controls'));
    if (!o) return;
    var mo = nut.getAttribute('aria-expanded') === 'true';
    nut.setAttribute('aria-expanded', mo ? 'false' : 'true');
    o.hidden = mo;
    var chu = nut.querySelector('.mc-nut-chu');
    if (chu) chu.textContent = mo ? 'Hiện lời giải' : 'Ẩn lời giải';
  });

  ve();
})();
`

/**
 * Dựng tờ máy chiếu từ danh sách ô bảng, hai ô một đợt.
 *
 * KHÔNG ĐỘN CHO ĐỦ CẶP: lẻ một em thì nửa còn lại để trắng và nói rõ, chứ không
 * gọi thêm một em không có trong phân công.
 */
export function taoHtmlMayChieu(dsO: OBang[], tuyChon: TuyChonMayChieu = {}): string {
  const ngay = tuyChon.ngay ?? new Date()
  const dot: string[] = []
  for (let k = 0; k < dsO.length; k += 2) {
    const so = k / 2 + 1
    dot.push(`<div class="mc-dot" data-dot="${so}">${nuaHtml(dsO[k], 'trai', so)}${nuaHtml(dsO[k + 1], 'phai', so)}</div>`)
  }
  const soDot = dot.length

  const than = `<div class="mc-thanh">
  <div>
    <div class="mc-thanh-ten">${thoat(tuyChon.tenBuoi || 'Gọi lên bảng')}</div>
    <div class="mc-thanh-phu">${ngayVn(ngay)} · ${dsO.length} em · ${soDot} đợt</div>
  </div>
  <div class="mc-dem" id="mc-dem">Đợt 1/${soDot}</div>
  <div class="mc-dieu">
    <button type="button" id="mc-truoc">◂ Đợt trước</button>
    <button type="button" id="mc-sau">Đợt tiếp ▸</button>
  </div>
</div>
${dot.join('')}`

  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thoat(tuyChon.tenBuoi || 'Gọi lên bảng')} — tờ máy chiếu</title>
<style>${CSS_PHIEU}</style><style>${CSS_MAY_CHIEU}</style></head>
<body class="mc">${than}
<script>${JS_MAY_CHIEU}</script></body></html>`
}
