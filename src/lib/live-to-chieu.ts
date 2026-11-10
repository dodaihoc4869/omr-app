// LIVE BẢNG TRÊN TỜ CHIẾU (thầy duyệt 10/11 «CHỐT BUILD»; đặc tả docs/dac-ta-live-bang-1011.md mục 2.1, 3; bản vẽ docs/ban-ve-live-1011 ảnh 01–09).
// Đoạn JS + CSS chèn vào tờ (len-bang-moi-to-chieu.ts, cùng phạm vi: body · tao · thanh · dichApp · baoNhanh). Tách tệp riêng vì cổng cỡ tệp.
// Tờ CHỈ LÀ MẶT: nút «Live», thẻ bật live + chọn mic, viên đỏ ba ngăn, «Tắt live», thẻ gọn «N em rời màn» + viền đỏ mảnh. MÁY CHẠY ở cửa sổ app
// (src/components/live/thay-noi.ts): mic + WebRTC + phòng nằm ở đó vì (1) tờ là khung dựng lại mỗi lần thầy chọn câu — nối ở tờ thì rớt live;
// (2) khung `srcdoc` / tờ mở cửa sổ riêng không chắc có quyền mic; (3) WebSocket của phòng vốn ở app.
// LUẬT (thầy chốt tối 10/11): bật live = TIẾNG chạy suốt buổi, qua mọi lần chuyển câu / dựng lại tờ; BẢNG chỉ xuống máy em khi cờ phòng `live.bang` bật
// (tự bật lúc gọi em lên bảng, tự tắt lúc mở lượt mới) — công tắc «Bảng → máy em» trong cụm Live để thầy bật / tắt tay. Em lên bảng mở mic ⇒ thẻ «Đang nói» + «Thu mic».
// Tờ → app:  { nguon:'to-chieu', loai:'live', viec, … }   viec = chao · bam · the-dong · chon-mic · bat-dau · khong-tieng · thu-lai · tieng-lop · tat · bang · thu-mic · nghe-em · but · anh · vung
// App → tờ:  { nguon:'bpu-bang', lenh:'live-tt', tt }  (toàn bộ trạng thái để vẽ)   ·   { nguon:'bpu-bang', lenh:'live-muc', v }  (mức âm mic 0..1, ~11 lần / giây)
// Bút: mọi sự kiện của `window.__mcBut.nghe` chuyển nguyên văn sang app (`viec:'but'`); sự kiện `trang` kèm ô giấy / ô bảng (`__mcBut.vung()`) + kiểu giấy
// ⇒ máy em dựng đúng bố cục (src/components/live/bo-cuc.ts). Bấm Live ⇒ bút bật sẵn.
// Màu: chỉ biến sẵn có của tờ (--mc-*); màu đội của em rời màn là dữ liệu app gửi sang (đặt vào biến --doi sau khi lọc ký tự).

export const CSS_LIVE_TO_CHIEU = `
/* 7c · live 10/11: nút Live, viên đỏ ba ngăn, thẻ mic, thẻ gọn em rời màn */
body.mc .mc-thanh .mc-lv-nut,body.mc .mc-thanh .mc-lv-tat{flex:none;display:inline-flex;align-items:center;gap:.5em;min-height:calc(var(--u)*2.5);padding:0 1em 0 .8em;border:0;border-radius:999px;background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-chu);font:800 max(13px,calc(var(--u)*1.15)) var(--mc-sans);white-space:nowrap;cursor:pointer}
.mc-lv-nut i{display:block;width:.68em;height:.68em;border-radius:50%;background:var(--mc-do);box-shadow:0 0 0 .22em color-mix(in srgb,var(--mc-do) 30%,transparent)}
body.mc .mc-thanh .mc-lv-tat{padding:0 1em;background:transparent;box-shadow:inset 0 0 0 1.5px var(--mc-bang-vien);font-weight:700}
body.mc .mc-thanh .mc-lv-cum{flex:none;display:inline-flex;align-items:stretch;min-height:calc(var(--u)*2.7);padding:0;border:0;border-radius:999px;overflow:hidden;background:var(--mc-do);color:var(--mc-bang-chu);font:800 max(13px,calc(var(--u)*1.12)) var(--mc-sans);white-space:nowrap;cursor:pointer;box-shadow:0 0 0 calc(var(--u)*.22) color-mix(in srgb,var(--mc-do) 28%,transparent);font-variant-numeric:tabular-nums}
.mc-lv-cum>span{display:inline-flex;align-items:center;gap:.45em;padding:0 .75em}
.mc-lv-cum>span+span{box-shadow:inset 1px 0 0 color-mix(in srgb,var(--mc-bang-chu) 28%,transparent)}
.mc-lv-cum i.cham{display:block;width:.62em;height:.62em;border-radius:50%;background:var(--mc-bang-chu)}
.mc-lv-cum small{font-size:.8em;font-weight:600;opacity:.9;margin-left:-.2em}
.mc-lv-cum svg,.mc-lv-roi svg,.mc-lv-the svg{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.mc-lv-muc{display:inline-flex;align-items:flex-end;gap:.16em;height:1.25em}
.mc-lv-muc i{display:block;width:.28em;border-radius:.1em;background:color-mix(in srgb,var(--mc-bang-chu) 35%,transparent)}
.mc-lv-muc i.b{background:var(--mc-bang-chu)}
.mc-lv-cum.vang{background:var(--mc-qua-nen);color:var(--mc-qua-chu);box-shadow:none}
.mc-lv-cum .im{animation:mcLvNhay 1s steps(2,jump-none) infinite}
@keyframes mcLvNhay{from{background:transparent;color:inherit}to{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}}
body.mc-live .mc-thanh [data-k="T"] .mc-nut-chu,body.mc-live .mc-thanh [data-k="Tab"] .mc-nut-chu{display:none}
body.mc.mc-live .mc-phim-nhom [data-k="P"] .mc-nut-chu{display:none!important}
body.mc .mc-thanh .mc-lv-bg{gap:.45em;padding:0 .8em}
.mc-lv-bg i{display:block;width:.62em;height:.62em;border-radius:50%;box-shadow:inset 0 0 0 1.5px currentColor}
.mc-lv-bg[aria-pressed="true"]{background:var(--mc-bang-chu)!important;color:var(--mc-bang)!important;box-shadow:none!important}
.mc-lv-bg[aria-pressed="true"] i{background:var(--mc-do);box-shadow:none}
/* màn chiếu hẹp (1366): cụm Live gọn lại để «Tắt live» + «Cài đặt» không bị đẩy khỏi thanh */
@media (max-width:1500px){.mc-lv-cum small,.mc-lv-bg span{display:none}body.mc-live .mc-thanh{gap:calc(var(--u)*.3)}.mc-lv-cum>span{padding:0 .6em}}
body.mc-live .mc-thanh{gap:calc(var(--u)*.4)}
.mc-lv-nhac{display:inline-flex;align-items:center;height:calc(var(--u)*2.3);padding:0 1em;border-radius:999px;background:var(--mc-thanh-nen);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);color:var(--mc-bang-phu);font:600 calc(var(--u)*.9) var(--mc-sans);white-space:nowrap;font-variant-numeric:tabular-nums}
body.mc-live .mc-thanh [data-k="?"]{display:none}
/* thẻ nổi neo trên thanh */
.mc-lv-the,.mc-lv-roi{position:fixed;right:calc(var(--u)*.75);bottom:calc(var(--u)*5);z-index:45;font-family:var(--mc-sans);color:var(--mc-bang-chu)}
.mc-lv-roi{display:flex;flex-direction:column;align-items:flex-end;gap:calc(var(--u)*.6)}
.mc-lv-noi{width:calc(var(--u)*23);padding:calc(var(--u)*.9) calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 1px var(--mc-bang-vien)}
.mc-lv-noi h3{margin:0;font:800 calc(var(--u)*1.15) var(--mc-sans)}
.mc-lv-noi .mc-lv-n{height:calc(var(--u)*2.6);font-size:calc(var(--u)*.95)}
.mc-lv-the{width:calc(var(--u)*27);max-width:calc(100vw - var(--u)*1.5);padding:calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 1px var(--mc-bang-vien)}
.mc-lv-the[hidden],.mc-lv-roi[hidden],.mc-lv-vien[hidden]{display:none}
.mc-lv-the h3{margin:0 0 .2em;font:800 calc(var(--u)*1.3) var(--mc-sans)}
.mc-lv-the p{margin:0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.97)/1.45 var(--mc-sans)}
.mc-lv-the .loi{color:var(--mc-vang-noi);font-weight:700;margin-top:.6em}
.mc-lv-chon{display:flex;align-items:center;gap:.6em;height:calc(var(--u)*3.25);margin-top:calc(var(--u)*.75);padding:0 calc(var(--u)*.9);border-radius:calc(var(--u)*.9);background:var(--mc-bang-nut);box-shadow:inset 0 0 0 1px var(--mc-bang-vien);font:600 calc(var(--u)*1.03) var(--mc-sans)}
.mc-lv-chon select{flex:1;min-width:0;height:100%;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-overflow:ellipsis}
.mc-lv-chon select option{background:var(--mc-thanh-nen);color:var(--mc-bang-chu)}
.mc-lv-dong{display:flex;justify-content:space-between;align-items:center;gap:.8em;margin-top:calc(var(--u)*.75);color:var(--mc-bang-phu);font:500 calc(var(--u)*.85) var(--mc-sans)}
.mc-lv-dong b{color:var(--mc-bang-chu);font-weight:700;font-size:calc(var(--u)*.97)}
.mc-lv-thuoc{height:calc(var(--u)*.75);margin-top:calc(var(--u)*.5);border-radius:999px;background:var(--mc-bang-nut);overflow:hidden}
.mc-lv-thuoc i{display:block;height:100%;width:100%;border-radius:999px;background:var(--mc-lam-nen);transform-origin:0 50%;transform:scaleX(0);transition:transform .09s linear}
.mc-lv-hang{display:flex;gap:calc(var(--u)*.6);margin-top:calc(var(--u)*.9)}
.mc-lv-n{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:.5em;height:calc(var(--u)*3.25);padding:0 1.1em;border:0;border-radius:999px;background:transparent;box-shadow:inset 0 0 0 1.5px var(--mc-bang-vien);color:var(--mc-bang-chu);font:800 calc(var(--u)*1.05) var(--mc-sans);white-space:nowrap;cursor:pointer}
.mc-lv-n.do{flex:1;background:var(--mc-do);box-shadow:none;font-size:calc(var(--u)*1.15)}
.mc-lv-n.do i{display:block;width:.62em;height:.62em;border-radius:50%;background:var(--mc-bang-chu)}
.mc-lv-n.nho{height:calc(var(--u)*2.3);font-size:calc(var(--u)*.9);font-weight:700}
.mc-lv-n[aria-pressed="true"]{background:var(--mc-bang-chu);color:var(--mc-bang);box-shadow:none}
.mc-lv-n:focus-visible,.mc-lv-nut:focus-visible,.mc-lv-tat:focus-visible,.mc-lv-cum:focus-visible,.mc-lv-roi-gon:focus-visible{outline:3px solid var(--mc-vang-noi);outline-offset:2px}
/* em rời màn: viền đỏ mảnh đứng yên (nháy 2 nhịp khi có em MỚI rời) + thẻ gọn ở góc phải, bấm / có em mới ⇒ mở tên, 4 giây tự thu */
.mc-lv-vien{position:fixed;inset:0;z-index:38;pointer-events:none;border:calc(var(--u)*.3) solid var(--mc-do);border-radius:calc(var(--u)*.4);box-shadow:inset 0 0 calc(var(--u)*2.5) color-mix(in srgb,var(--mc-do) 35%,transparent)}
.mc-lv-vien.nhay{animation:mcLvVien .5s ease-in-out 2}
@keyframes mcLvVien{50%{opacity:.25}}
.mc-lv-roi-gon{display:inline-flex;align-items:center;gap:.55em;height:calc(var(--u)*3.25);padding:0 .65em 0 1em;border:0;border-radius:999px;background:var(--mc-do-nen);color:var(--mc-do);font:800 calc(var(--u)*1.12) var(--mc-sans);white-space:nowrap;cursor:pointer;box-shadow:0 calc(var(--u)*.75) calc(var(--u)*2.1) color-mix(in srgb,var(--mc-bang) 50%,transparent);font-variant-numeric:tabular-nums}
.mc-lv-ky{flex:none;display:inline-grid;place-items:center;width:calc(var(--u)*2.1);height:calc(var(--u)*2.1);border-radius:50%;background:var(--doi,var(--mc-bang-chu));color:var(--mc-bang);font:800 calc(var(--u)*.8) var(--mc-sans)}
.mc-lv-roi-gon .mc-lv-ky{margin-left:-.45em;box-shadow:0 0 0 2px var(--mc-do-nen)}
.mc-lv-roi-gon .mc-lv-ky:first-of-type{margin-left:.1em}
.mc-lv-roi-mo{width:calc(var(--u)*20.6);padding:calc(var(--u)*1.1);border-radius:calc(var(--u)*1.5);background:var(--mc-thanh-nen);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*3.75) color-mix(in srgb,var(--mc-bang) 55%,transparent),inset 0 0 0 2px var(--mc-do)}
.mc-lv-roi-mo h3{display:flex;align-items:center;gap:.4em;margin:0 0 .2em;color:var(--mc-do-nen);font:800 calc(var(--u)*1.3) var(--mc-sans)}
.mc-lv-roi-mo p{margin:calc(var(--u)*.4) 0 0;color:var(--mc-bang-phu);font:500 calc(var(--u)*.9)/1.45 var(--mc-sans)}
.mc-lv-em{display:flex;align-items:center;gap:calc(var(--u)*.75);min-height:calc(var(--u)*3.5);padding:calc(var(--u)*.35) 0}
.mc-lv-em+.mc-lv-em{box-shadow:inset 0 1px 0 var(--mc-bang-vien)}
.mc-lv-em .mc-lv-ky{width:calc(var(--u)*2.5);height:calc(var(--u)*2.5);font-size:calc(var(--u)*.92)}
.mc-lv-em span{flex:1;min-width:0;font:700 calc(var(--u)*1.12)/1.2 var(--mc-sans);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-lv-em small{display:block;margin-top:.15em;color:var(--mc-bang-phu);font:500 calc(var(--u)*.85) var(--mc-sans);font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:reduce){.mc-lv-vien.nhay,.mc-lv-cum .im{animation:none}.mc-lv-thuoc i{transition:none}}
html.may-yeu .mc-lv-vien.nhay,html.may-yeu .mc-lv-cum .im{animation:none}
`

export const JS_LIVE_TO_CHIEU = `
  // ── V · live bảng (thầy 10/11) — mặt của tờ; máy chạy ở app: src/components/live/thay-noi.ts ──
  var LV = { tt: null, moRoi: false, hRoi: 0, roiCu: '', hDh: 0, anhXong: false, vungCu: '' };
  var lvNut = document.createElement('button'), lvCum = document.createElement('button'), lvTat = document.createElement('button'), lvBg = document.createElement('button');
  var lvThe = tao('div', 'mc-lv-the', body), lvRoi = tao('div', 'mc-lv-roi', body), lvVien = tao('div', 'mc-lv-vien', body);
  var LV_BT = {
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    mat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    roi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3.2v.3"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
  };
  function lvSach(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lvMau(m) { m = String(m || '').trim(); return m && /^[#a-z0-9(),.%\\s-]+$/i.test(m) ? m : ''; }
  function lvGui(viec, them) {
    var d = dichApp(), m = { nguon: 'to-chieu', loai: 'live', viec: viec }, k;
    if (!d) return false;
    if (them) for (k in them) if (Object.prototype.hasOwnProperty.call(them, k)) m[k] = them[k];
    try { d.postMessage(m, '*'); return true; } catch (e) { return false; }
  }
  function lvGiay() { return document.documentElement.getAttribute('data-projector') !== 'matte-light'; }
  function lvVung() { return window.__mcBut && window.__mcBut.vung ? window.__mcBut.vung() : {}; }
  function lvDongHo(tu) { var s = Math.max(0, Math.floor((Date.now() - tu) / 1000)), p = Math.floor(s / 60); s = s % 60; return (p < 10 ? '0' : '') + p + ':' + (s < 10 ? '0' : '') + s; }
  function lvLau(luc) { var s = Math.max(0, Math.floor((Date.now() - luc) / 1000)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  lvNut.type = lvCum.type = lvTat.type = lvBg.type = 'button';
  lvBg.className = 'mc-lv-tat mc-lv-bg'; lvBg.hidden = true; lvBg.title = 'Bảng → máy em: máy cả lớp xem bảng thầy viết (tự bật khi gọi em lên bảng, tự tắt khi sang lượt mới)';
  lvNut.className = 'mc-lv-nut'; lvNut.hidden = true; lvNut.setAttribute('aria-label', 'Bật live'); lvNut.title = 'Live: cả lớp xem bảng + nghe thầy trên máy (phím V)'; lvNut.innerHTML = '<i></i>Live';
  lvCum.className = 'mc-lv-cum'; lvCum.hidden = true;
  lvTat.className = 'mc-lv-tat'; lvTat.hidden = true; lvTat.textContent = 'Tắt live';
  lvThe.hidden = lvRoi.hidden = lvVien.hidden = true;
  lvThe.setAttribute('role', 'dialog'); lvThe.setAttribute('aria-label', 'Bật live');
  (function () { var c = document.getElementById('mc-cai-btn'); if (thanh && c) { thanh.insertBefore(lvNut, c); thanh.insertBefore(lvCum, c); thanh.insertBefore(lvBg, c); thanh.insertBefore(lvTat, c); } })();
  function lvBam() { if (!LV.tt || !LV.tt.co) { baoNhanh('Mở Điểm danh (Bình Phản Ứng) trước rồi bật Live', 2200); return; } lvGui('bam'); }
  lvNut.addEventListener('click', lvBam); lvCum.addEventListener('click', lvBam);
  lvTat.addEventListener('click', function () { lvGui('tat'); });
  lvBg.addEventListener('click', function () { lvGui('bang', { v: !(LV.tt && LV.tt.bang) }); });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest('input,textarea,select'))) return;
    if (e.key === 'v' || e.key === 'V') { e.preventDefault(); lvBam(); }
    else if (e.key === 'Escape' && !lvThe.hidden) { e.stopImmediatePropagation(); lvGui('the-dong'); }
  }, true);
  lvThe.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-lv]'); if (b) lvGui(b.getAttribute('data-lv'), b.hasAttribute('data-v') ? { v: b.getAttribute('data-v') === '1' } : null); });
  lvThe.addEventListener('change', function (e) { if (e.target && e.target.tagName === 'SELECT') lvGui('chon-mic', { id: e.target.value }); });
  lvRoi.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-thu]');
    if (b) { lvGui('thu-mic', { sbd: b.getAttribute('data-thu') }); return; }
    b = e.target.closest && e.target.closest('[data-nghe]');
    if (b) { lvGui('nghe-em', { v: b.getAttribute('data-nghe') === '1' }); return; }
    if (lvVien.hidden || (e.target.closest && e.target.closest('.mc-lv-noi'))) return;
    LV.moRoi = !LV.moRoi; lvVeRoi(); lvHenThu();
  });
  function lvHenThu() { clearTimeout(LV.hRoi); if (LV.moRoi) LV.hRoi = setTimeout(function () { LV.moRoi = false; lvVeRoi(); }, 4000); }
  function lvVeRoi() {
    var live = !!LV.tt && LV.tt.pha === 'live', ds = (live && LV.tt.roi) || [], noi = (live && LV.tt.noi) || [], n = ds.length, h = '', i, e;
    function ky(e) { var m = lvMau(e.mau); return '<b class="mc-lv-ky"' + (m ? ' style="--doi:' + m + '"' : '') + '>' + lvSach(e.ky) + '</b>'; }
    lvVien.hidden = !n;
    if (!n) LV.moRoi = false;
    // em lên bảng đang mở mic: thẻ «Đang nói» + «Thu mic»
    if (noi.length) {
      h += '<div class="mc-lv-noi" role="status"><h3>Đang nói</h3>';
      for (i = 0; i < noi.length; i++) { e = noi[i]; h += '<div class="mc-lv-em">' + ky(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'mic đang bật</small></span><button type="button" class="mc-lv-n do" style="flex:none" data-thu="' + lvSach(e.sbd) + '">Thu mic</button></div>'; }
      // em đứng trong lớp: loa lớp phát lại giọng em qua mic máy em dễ hú ⇒ mặc định tắt; em ở xa ⇒ mặc định bật. Thầy đổi tại đây.
      h += '<div class="mc-lv-dong" style="margin-top:0"><span><b>Phát tiếng em ra loa lớp</b><br>Em đứng cạnh loa thì nên tắt (dễ hú)</span><button type="button" class="mc-lv-n nho" data-nghe="' + (LV.tt.ngheEm ? '0' : '1') + '" aria-pressed="' + (!!LV.tt.ngheEm) + '">' + (LV.tt.ngheEm ? 'Đang bật' : 'Đang tắt') + '</button></div>';
      h += '</div>';
    }
    if (n && !LV.moRoi) {
      h += '<button type="button" class="mc-lv-roi-gon" aria-label="' + n + ' em rời màn, bấm để xem tên">' + LV_BT.roi + '<span>' + n + ' em rời màn</span>';
      for (i = 0; i < Math.min(3, n); i++) h += ky(ds[i]);
      h += '</button>';
    } else if (n) {
      h += '<div class="mc-lv-roi-mo" role="status"><h3>' + LV_BT.roi + n + ' em rời màn</h3>';
      for (i = 0; i < Math.min(3, n); i++) { e = ds[i]; h += '<div class="mc-lv-em">' + ky(e) + '<span>' + lvSach(e.ten) + '<small>' + (e.doi ? lvSach(e.doi) + ' · ' : '') + 'rời màn · ' + lvLau(e.luc) + '</small></span></div>'; }
      if (n > 3) h += '<p>+' + (n - 3) + ' em nữa</p>';
      h += '<p>Em quay lại thì tên tự mất.</p></div>';
    } else if (live && LV.tt.chuaGui && !noi.length) {
      // không em nào rời: chỗ này nhắc «Lượt đang mở · N em chưa gửi» (thầy viết lời giải khi lượt chưa mở đáp án — đặc tả mục 5)
      h += '<span class="mc-lv-nhac" role="status">Lượt đang mở · ' + LV.tt.chuaGui + ' em chưa gửi</span>';
    }
    lvRoi.hidden = !h;
    if (lvRoi.__h !== h) { lvRoi.__h = h; lvRoi.innerHTML = h; }
  }
  function lvVeThe() {
    var t = LV.tt && LV.tt.the, h, i, m, loi;
    lvThe.hidden = !t;
    if (!t) return;
    loi = t.loi === 'mic-tu-choi' ? 'trình duyệt chưa cho dùng mic' : t.loi === 'khong-mic' ? 'máy này không thấy mic nào' : t.loi ? 'mic chưa mở được' : '';
    h = '<h3>' + (LV.tt.pha === 'live' ? 'Mic đang live' : 'Bật live cho ' + (LV.tt.lop ? 'lớp ' + lvSach(LV.tt.lop) : 'cả lớp')) + '</h3>'
      + '<p>' + (LV.tt.tong || 0) + ' em đã vào phòng sẽ thấy màn chiếu này' + (LV.tt.coTieng ? ' và nghe tiếng thầy ngay.' : '. Buổi này live chưa có tiếng trên máy em.') + '</p>';
    if (LV.tt.coTieng) {
      if (loi) h += '<p class="loi">Chưa dùng được mic: ' + loi + '.</p>';
      else {
        h += '<label class="mc-lv-chon">' + LV_BT.mic + '<select aria-label="Chọn mic">';
        for (i = 0; i < t.ds.length; i++) { m = t.ds[i]; h += '<option value="' + lvSach(m.id) + '"' + (m.id === t.chon ? ' selected' : '') + '>Mic: ' + lvSach(m.ten) + '</option>'; }
        if (!t.ds.length) h += '<option>Mic mặc định của máy</option>';
        h += '</select></label><div class="mc-lv-dong"><span>Mức âm khi thầy nói thử</span><span id="mc-lv-nx"></span></div><div class="mc-lv-thuoc"><i id="mc-lv-th"></i></div>'
          + '<div class="mc-lv-dong"><span><b>Lọc tiếng ồn + khử vọng</b><br>Đang bật — hợp với loa lớp</span><span class="mc-lv-n nho" aria-hidden="true">Đang bật</span></div>';
      }
      h += '<div class="mc-lv-dong"><span><b>Tiếng trên máy em</b><br>Em trong lớp nghe thầy trực tiếp</span><span style="display:inline-flex;gap:.4em">'
        + '<button type="button" class="mc-lv-n nho" data-lv="tieng-lop" data-v="0" aria-pressed="' + (!t.tiengLop) + '">Em ở xa</button><button type="button" class="mc-lv-n nho" data-lv="tieng-lop" data-v="1" aria-pressed="' + (!!t.tiengLop) + '">Tất cả</button></span></div>';
    }
    h += '<div class="mc-lv-hang">';
    if (LV.tt.pha === 'live') h += '<button type="button" class="mc-lv-n" data-lv="the-dong" style="flex:1">Xong</button>';
    else if (loi) h += '<button type="button" class="mc-lv-n do" data-lv="khong-tieng"><i></i>Live không tiếng</button><button type="button" class="mc-lv-n" data-lv="thu-lai">Thử lại</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    else h += '<button type="button" class="mc-lv-n do" data-lv="' + (LV.tt.coTieng ? 'bat-dau' : 'khong-tieng') + '"><i></i>Bắt đầu live</button><button type="button" class="mc-lv-n" data-lv="the-dong">Để sau</button>';
    lvThe.innerHTML = h + '</div>';
  }
  function lvVeMuc(v) {
    var ds = lvCum.querySelectorAll('.mc-lv-muc i'), n = Math.round(Math.min(1, v * 2.2) * ds.length), i, th = document.getElementById('mc-lv-th'), nx = document.getElementById('mc-lv-nx');
    for (i = 0; i < ds.length; i++) ds[i].className = i < n ? 'b' : '';
    if (th) th.style.transform = 'scaleX(' + Math.min(1, v * 2.2).toFixed(2) + ')';
    if (nx) nx.textContent = v < 0.04 ? 'Chưa nghe thấy' : v < 0.12 ? 'Hơi nhỏ' : v < 0.6 ? 'Vừa đủ' : 'Hơi to';
  }
  function lvVe() {
    var t = LV.tt, live = !!t && t.pha === 'live', dang = !!t && t.pha === 'dang-bat', h, i, khoa;
    lvNut.hidden = !t || !t.co || live || dang;
    lvCum.hidden = !(live || dang); lvTat.hidden = lvBg.hidden = !live;
    if (live) { lvBg.setAttribute('aria-pressed', t.bang ? 'true' : 'false'); lvBg.innerHTML = '<i></i>Bảng<span>&nbsp;→ máy em</span>'; lvBg.setAttribute('aria-label', 'Bảng xuống máy em: ' + (t.bang ? 'đang bật' : 'đang tắt')); }
    body.classList.toggle('mc-live', live);
    clearInterval(LV.hDh);
    if (dang) { lvCum.className = 'mc-lv-cum'; lvCum.innerHTML = '<span><i class="cham"></i>Đang bật live…</span>'; }
    if (live) {
      lvCum.className = 'mc-lv-cum' + (t.noiLai || t.mayKhac ? ' vang' : '');
      lvCum.setAttribute('aria-label', 'Đang live, ' + t.xem + ' trên ' + t.tong + ' em đang xem. Bấm để chỉnh mic');
      if (t.noiLai) lvCum.innerHTML = '<span>Đang nối lại…</span>';
      else if (t.mayKhac) lvCum.innerHTML = '<span>Đang live ở máy khác</span>';
      else {
        h = '';
        for (i = 0; i < 7; i++) h += '<i style="height:' + [36, 59, 82, 100, 73, 45, 27][i] + '%"></i>';
        lvCum.innerHTML = '<span><i class="cham"></i>LIVE <b id="mc-lv-dh">' + lvDongHo(t.tu || Date.now()) + '</b></span>'
          + '<span>' + LV_BT.mat + '<b>' + t.xem + '</b><small>/' + t.tong + ' em xem</small></span>'
          + (t.coTieng && !t.khongTieng ? '<span class="' + (t.micIm ? 'im' : '') + '" aria-label="Mức mic">' + LV_BT.mic + (t.micIm ? 'Mic đang im' : '<span class="mc-lv-muc">' + h + '</span>') + '</span>' : '<span>Không tiếng</span>');
        LV.hDh = setInterval(function () { var d = document.getElementById('mc-lv-dh'); if (d && LV.tt && LV.tt.tu) d.textContent = lvDongHo(LV.tt.tu); if (LV.moRoi) lvVeRoi(); }, 1000);
      }
    }
    lvVeThe();
    // em MỚI rời ⇒ viền nháy 2 nhịp + thẻ tự mở 4 giây
    khoa = live && t.roi ? t.roi.map(function (e) { return e.sbd; }).join(',') : '';
    if (khoa && khoa !== LV.roiCu && khoa.split(',').some(function (s) { return (',' + LV.roiCu + ',').indexOf(',' + s + ',') < 0; })) {
      LV.moRoi = true; lvHenThu();
      lvVien.classList.remove('nhay'); void lvVien.offsetWidth; lvVien.classList.add('nhay');
    }
    LV.roiCu = khoa;
    lvVeRoi();
  }
  // Bút ⇒ app: mọi sự kiện, nguyên văn. Sự kiện «trang» kèm ô giấy / ô bảng; bố cục đợt mới xếp xong (0,7 s) mà ô đổi thì báo lại.
  function lvBaoVung(tr) {
    var v = lvVung(), k = JSON.stringify(v);
    if (k === LV.vungCu) return;
    LV.vungCu = k; lvGui('vung', { trang: tr, vung: v, giayToi: lvGiay() });
  }
  function lvAnh() {
    var b = window.__mcBut, x;
    if (!b) return;
    x = b.xuat(); LV.vungCu = JSON.stringify(lvVung());
    lvGui('anh', { trang: b.trang(), tiLe: x.tiLe, net: x.net, vung: lvVung(), giayToi: lvGiay() });
    LV.anhXong = true;
  }
  if (window.__mcBut) window.__mcBut.nghe(function (sk) {
    if (!LV.anhXong) return;
    if (sk.loai === 'trang') { LV.vungCu = JSON.stringify(lvVung()); lvGui('but', { sk: sk, vung: lvVung(), giayToi: lvGiay() }); setTimeout(function () { if (window.__mcBut.trang() === sk.trang) lvBaoVung(sk.trang); }, 700); }
    else lvGui('but', { sk: sk });
  });
  ['mc-doi-pha', 'mc-bo-cuc-xong'].forEach(function (t) { document.addEventListener(t, function () { if (LV.anhXong && window.__mcBut) setTimeout(function () { lvBaoVung(window.__mcBut.trang()); }, 650); }); });
  window.addEventListener('resize', function () { if (LV.anhXong && window.__mcBut) setTimeout(lvAnh, 300); });
  window.addEventListener('message', function (e) {
    var m = e.data, truoc;
    if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp()) return;
    if (m.lenh === 'live-muc') { lvVeMuc(+m.v || 0); return; }
    if (m.lenh !== 'live-tt') return;
    truoc = LV.tt; LV.tt = m.tt || null;
    if (LV.tt && LV.tt.co && !LV.anhXong) lvAnh();
    // vừa vào live ⇒ bút bật sẵn trên bảng đen
    if (LV.tt && LV.tt.pha === 'live' && !(truoc && truoc.pha === 'live') && window.__mcBut) window.__mcBut.bat(true);
    lvVe();
  });
  window.__mcLive = { tt: function () { return LV.tt; }, bam: lvBam };
  lvGui('chao');
`
