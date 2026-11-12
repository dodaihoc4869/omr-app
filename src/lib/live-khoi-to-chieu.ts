// LIVE THEO KHỐI — PHẦN CHỈ CỦA BUỔI LIVE THEO KHỐI TRÊN TỜ CHIẾU (12/11): cỡ chữ đề của buổi live + nối «Lên bảng» / Đạt / Chưa đạt của tờ vào phòng.
// Đoạn JS (ES5) chèn vào cuối JS_LIVE_TO_CHIEU (cùng phạm vi: LV · lvGui · body · dot · pha · S · dauKq · baoNhanh). Tách tệp riêng vì cổng cỡ tệp.
// Tin ra: { nguon:'to-chieu', loai:'live', viec:'len', sbd? } · { …, viec:'cham', dat }   ·   tin vào: { nguon:'bpu-bang', lenh:'live-bao', chu } (live-to-chieu.ts).
import { JS_LIVE_NOP } from './live-nop-to-chieu'

export const CSS_LIVE_KHOI = `
.mc-lv-dau{position:fixed;left:50%;top:47%;z-index:60;padding:.16em .55em;border:.11em solid currentColor;border-radius:.3em;outline:.04em solid currentColor;outline-offset:.12em;background:color-mix(in srgb,color-mix(in srgb,currentColor 12%,var(--mc-bang-chu)) 92%,transparent);color:var(--mc-do);font:900 clamp(48px,15vmin,150px)/1.05 var(--mc-sans);letter-spacing:.06em;text-align:center;white-space:nowrap;pointer-events:none;transform:translate(-50%,-50%) rotate(-10deg);animation:mc-lv-dau 3s cubic-bezier(.2,.9,.3,1) both}
.mc-lv-dau.dat{color:var(--mc-luc)}
.mc-lv-dau small{display:block;margin-top:.25em;font-size:.2em;font-weight:800;letter-spacing:.12em}
@keyframes mc-lv-dau{0%{opacity:0;transform:translate(-50%,-58%) rotate(-16deg) scale(3)}7%{opacity:1;transform:translate(-50%,-50%) rotate(-10deg) scale(.9)}10%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.06)}13%{transform:translate(-50%,-50%) rotate(-11deg) scale(.98)}16%,86%{opacity:1;transform:translate(-50%,-50%) rotate(-10deg) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) rotate(-10deg) scale(1.03)}}
@media (prefers-reduced-motion:reduce){.mc-lv-dau{animation:none}}
`

export const JS_LIVE_KHOI_TO_CHIEU = `
  // CỠ CHỮ ĐỀ CỦA BUỔI LIVE (thầy 12/11 «cỡ chữ đề trên máy học sinh to hơn … chữ hiện tại nhỏ quá»): máy em soi ĐÚNG cách xuống dòng của giấy thầy (để nét
  // gạch chân khớp chữ) nên chữ máy em to theo chữ của tờ. Buổi live mặc định «Chữ rất lớn» (1,2); thầy đổi trong Cài đặt của tờ thì máy em theo ngay và
  // nhớ RIÊNG cho live (mc-lk-scale) — cỡ chữ buổi trên lớp (mc-projector-scale) giữ nguyên.
  function lvCoChu() {
    var sz = document.getElementById('mc-size'), goc = null, luu = null;
    if (!sz || LV.coChu) return;
    LV.coChu = 1;
    try { goc = localStorage.getItem('mc-projector-scale'); luu = localStorage.getItem('mc-lk-scale'); } catch (e) {}
    // tờ ghi cỡ chữ vào bộ nhớ «buổi trên lớp» ở MỌI lần đổi cỡ cửa sổ (kể cả lúc đổi Học ⇄ Bảng) ⇒ sau mỗi lần ấy trả lại giá trị của buổi trên lớp
    function tra() { try { if (goc === null) localStorage.removeItem('mc-projector-scale'); else localStorage.setItem('mc-projector-scale', goc); } catch (e) {} }
    sz.value = luu || (parseFloat(sz.value) > 1.2 ? sz.value : '1.2');
    if (!sz.value) sz.value = '1.2';
    document.documentElement.style.setProperty('--mc-scale', sz.value);
    if (window.__mcFitOptions) window.__mcFitOptions();
    if (window.__mcBoCuc) window.__mcBoCuc.doiLai();
    sz.addEventListener('change', function () { try { localStorage.setItem('mc-lk-scale', sz.value); } catch (e) {} tra(); });
    window.addEventListener('resize', tra);
    document.addEventListener('fullscreenchange', tra);
  }
  // LÊN BẢNG / CHẤM TRONG BUỔI LIVE THEO KHỐI (thầy 12/11 «lên bảng máy hs chưa hiện thông báo, bấm đạt không đạt cũng chưa hiện»). Buổi live bảng Bình
  // Phản Ứng ẩn nên mọi việc gọi / chấm làm TRÊN TỜ — tờ phải báo app để app gửi lệnh vào phòng (máy em hiện «… lên bảng», con dấu Đạt / Không đạt):
  //  · tờ có em xếp sẵn (Chữa câu khó, đầu giờ…): thầy bấm L / «Lên bảng» / «Gọi em khác» ⇒ việc len kèm sbd của thẻ tên;
  //  · tờ chưa có em (bài chọn từ kho): L / nút «Lên bảng» ⇒ việc len KHÔNG sbd ⇒ bảng (đang ẩn) chọn em như phím L của bảng rồi giao lại cho tờ;
  //  · chấm em xếp sẵn (mọi đường đều qua dauKq) ⇒ việc cham. Em do bảng giao thì tờ đã báo bằng tin bpu-cham sẵn có.
  // Biến của tờ (len-bang-moi-to-chieu.ts) đọc phòng thủ: đoạn này cũng được dựng riêng trong test với phạm vi tối thiểu (body · tao · thanh · dichApp · baoNhanh).
  var lvS = typeof S === 'object' && S ? S : {};
  function lvPha() { return body.getAttribute('data-pha') || ''; }
  function lvKhoi() { return !!(LV.tt && LV.tt.khoi) && !body.classList.contains('mc-che-bang'); }
  function lvLen(sbd) { if (sbd) { LV.len = sbd; lvGui('len', { sbd: sbd }); } }
  function lvSbdThe() { var d = window.__mcDot ? window.__mcDot() : null, t = d ? d.querySelector('.mc-em[id]') : null, s = t ? t.querySelector('.mc-sbd') : null; return s ? String(s.textContent || '').trim() : ''; }
  var lvPhaCu = lvPha();
  new MutationObserver(function () {
    var p = lvPha(), cu = lvPhaCu; lvPhaCu = p;
    lvNutLen();
    if (!lvKhoi() || (p !== 'goi' && p !== 'chua') || cu === 'goi' || cu === 'chua') return;
    if (!lvS.bpuLen) lvLen(lvSbdThe());
  }).observe(body, { attributes: true, attributeFilter: ['data-pha'] });
  document.addEventListener('mc-doi-em', function (e) { var d = (e && e.detail) || {}; if (lvKhoi() && !lvS.bpuLen && d.sbd) lvLen(String(d.sbd)); });
  if (typeof dauKq === 'function') { var lvDauKq = dauKq; dauKq = function (khoa, dat) { lvDauKq(khoa, dat); if (lvKhoi()) lvDau(!!dat); if (LV.len) { LV.len = ''; lvGui('cham', { dat: !!dat }); } }; }
  // «chưa có em»: đợt không có thẻ tên (pha rỗng) HOẶC thẻ «Cả lớp» không mang số báo danh (tờ bài chọn từ kho) ⇒ xin bảng chọn em thay cho màn gọi «Cả lớp»
  function lvChuaCoEm() { var p = lvPha(); return lvKhoi() && !lvS.bpuLen && (!p || (p === 'cho' && !lvSbdThe())); }
  // CON DẤU TRÊN MÁY THẦY (thầy 12/11 «hiệu ứng bấm Đạt không đạt cũng hiển thị lên máy thầy», bản vẽ 27): mọi đường chấm của tờ đều qua dauKq ⇒ đóng dấu
  // giữa màn chiếu 3 giây, cùng kiểu con dấu máy em (đè cả giấy đề lẫn bảng), kèm tên em trên thẻ.
  function lvDau(dat) {
    var d = window.__mcDot ? window.__mcDot() : null, t = d ? d.querySelector('.mc-em[id] .mc-ten') : null, ten = t ? String(t.textContent || '').trim() : '', e = document.getElementById('mc-lv-dau'), n;
    if (e) e.remove();
    e = document.createElement('div'); e.id = 'mc-lv-dau'; e.className = 'mc-lv-dau' + (dat ? ' dat' : ''); e.setAttribute('role', 'status');
    e.textContent = dat ? 'ĐẠT' : 'KHÔNG ĐẠT';
    if (ten && ten !== 'Cả lớp') { n = document.createElement('small'); n.textContent = ten + ' · lên bảng'; e.appendChild(n); }
    body.appendChild(e); setTimeout(function () { if (e.parentNode) e.remove(); }, 3000);
  }
  function lvXinGoi(e) { if (!lvChuaCoEm()) return false; if (e) { e.preventDefault(); e.stopImmediatePropagation(); } lvGui('len', {}); return true; }
  // nút «Lên bảng» của thanh đáy vốn ẩn khi đợt chưa có em — buổi live phải bấm được (bảng ẩn, không còn nút nào khác để gọi em)
  function lvNutLen() { var n = document.getElementById('mc-len-bang'); if (!n || !lvKhoi() || lvPha() || lvS.bpuLen) return; if (n.hidden) n.hidden = false; if (n.disabled) n.disabled = false; if (n.textContent !== 'Lên bảng') n.textContent = 'Lên bảng'; }
  (function () { var n = document.getElementById('mc-len-bang'); if (!n) return; new MutationObserver(lvNutLen).observe(n, { attributes: true, attributeFilter: ['hidden', 'disabled'] }); })();
  document.addEventListener('click', function (e) { var t = e.target; if (t && t.closest && t.closest('#mc-len-bang')) lvXinGoi(e); }, true);
  // PHÍM TAB = đổi Học ⇄ Bảng (thầy 12/11 «cho tôi một phím tắt trên bàn phím để chuyển đổi giữa hai chế độ cực kì mượt mà chuẩn xác»): đổi NGAY trên tờ
  // (lvDoiChe) rồi báo app; nét của từng chế độ nằm ở trang bút riêng nên đổi qua lại không mất gì.
  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key !== 'Tab' || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || !(LV.tt && LV.tt.khoi) || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return;
    e.preventDefault(); e.stopImmediatePropagation();
    lvDoiChe(body.classList.contains('mc-che-bang') ? 'hoc' : 'bang');
  }, true);
  // Buổi live: phím F của tờ KHÔNG bật toàn màn hình nữa (thầy 12/11 «màn giáo viên không cần full màn hình … vẫn có một chỗ bấm vào full màn hình»); nút «Toàn màn hình» trong Cài đặt vẫn còn cho lúc thầy chủ động cần.
  window.addEventListener('keydown', function (e) { if ((e.key === 'f' || e.key === 'F') && LV.tt && LV.tt.khoi && !e.ctrlKey && !e.metaKey && !e.altKey) e.stopImmediatePropagation(); }, true);
  document.addEventListener('keydown', function (e) { var t = e.target; if ((e.key !== 'l' && e.key !== 'L') || e.ctrlKey || e.metaKey || e.altKey || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return; lvXinGoi(e); }, true);
${JS_LIVE_NOP}`
