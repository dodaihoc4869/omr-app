// LIVE THEO KHỐI — PHẦN CHỈ CỦA BUỔI LIVE THEO KHỐI TRÊN TỜ CHIẾU (12/11): cỡ chữ đề của buổi live + nối «Lên bảng» / Đạt / Chưa đạt của tờ vào phòng.
// Đoạn JS (ES5) chèn vào cuối JS_LIVE_TO_CHIEU (cùng phạm vi: LV · lvGui · body · dot · pha · S · dauKq · baoNhanh). Tách tệp riêng vì cổng cỡ tệp.
// Tin ra: { nguon:'to-chieu', loai:'live', viec:'len', sbd? } · { …, viec:'cham', dat }   ·   tin vào: { nguon:'bpu-bang', lenh:'live-bao', chu } (live-to-chieu.ts).
export const JS_LIVE_KHOI_TO_CHIEU = `
  // CỠ CHỮ ĐỀ CỦA BUỔI LIVE (thầy 12/11 «cỡ chữ đề trên máy học sinh to hơn … chữ hiện tại nhỏ quá»): máy em soi ĐÚNG cách xuống dòng của giấy thầy (để nét
  // gạch chân khớp chữ) nên chữ máy em to theo chữ của tờ. Buổi live mặc định «Chữ rất lớn» (1,2); thầy đổi trong Cài đặt của tờ thì máy em theo ngay và
  // nhớ RIÊNG cho live (mc-lk-scale) — cỡ chữ buổi trên lớp (mc-projector-scale) giữ nguyên.
  function lvCoChu() {
    var sz = document.getElementById('mc-size'), goc = null, luu = null;
    if (!sz || LV.coChu) return;
    LV.coChu = 1;
    try { goc = localStorage.getItem('mc-projector-scale'); luu = localStorage.getItem('mc-lk-scale'); } catch (e) {}
    sz.value = luu || (parseFloat(sz.value) > 1.2 ? sz.value : '1.2');
    if (!sz.value) sz.value = '1.2';
    document.documentElement.style.setProperty('--mc-scale', sz.value);
    if (window.__mcFitOptions) window.__mcFitOptions();
    if (window.__mcBoCuc) window.__mcBoCuc.doiLai();
    sz.addEventListener('change', function () { try { localStorage.setItem('mc-lk-scale', sz.value); if (goc === null) localStorage.removeItem('mc-projector-scale'); else localStorage.setItem('mc-projector-scale', goc); } catch (e) {} });
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
  if (typeof dauKq === 'function') { var lvDauKq = dauKq; dauKq = function (khoa, dat) { lvDauKq(khoa, dat); if (LV.len) { LV.len = ''; lvGui('cham', { dat: !!dat }); } }; }
  // «chưa có em»: đợt không có thẻ tên (pha rỗng) HOẶC thẻ «Cả lớp» không mang số báo danh (tờ bài chọn từ kho) ⇒ xin bảng chọn em thay cho màn gọi «Cả lớp»
  function lvChuaCoEm() { var p = lvPha(); return lvKhoi() && !lvS.bpuLen && (!p || (p === 'cho' && !lvSbdThe())); }
  function lvXinGoi(e) { if (!lvChuaCoEm()) return false; if (e) { e.preventDefault(); e.stopImmediatePropagation(); } lvGui('len', {}); return true; }
  // nút «Lên bảng» của thanh đáy vốn ẩn khi đợt chưa có em — buổi live phải bấm được (bảng ẩn, không còn nút nào khác để gọi em)
  function lvNutLen() { var n = document.getElementById('mc-len-bang'); if (!n || !lvKhoi() || lvPha() || lvS.bpuLen) return; if (n.hidden) n.hidden = false; if (n.disabled) n.disabled = false; if (n.textContent !== 'Lên bảng') n.textContent = 'Lên bảng'; }
  (function () { var n = document.getElementById('mc-len-bang'); if (!n) return; new MutationObserver(lvNutLen).observe(n, { attributes: true, attributeFilter: ['hidden', 'disabled'] }); })();
  document.addEventListener('click', function (e) { var t = e.target; if (t && t.closest && t.closest('#mc-len-bang')) lvXinGoi(e); }, true);
  // Buổi live: phím F của tờ KHÔNG bật toàn màn hình nữa (thầy 12/11 «màn giáo viên không cần full màn hình … vẫn có một chỗ bấm vào full màn hình»); nút «Toàn màn hình» trong Cài đặt vẫn còn cho lúc thầy chủ động cần.
  window.addEventListener('keydown', function (e) { if ((e.key === 'f' || e.key === 'F') && LV.tt && LV.tt.khoi && !e.ctrlKey && !e.metaKey && !e.altKey) e.stopImmediatePropagation(); }, true);
  document.addEventListener('keydown', function (e) { var t = e.target; if ((e.key !== 'l' && e.key !== 'L') || e.ctrlKey || e.metaKey || e.altKey || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return; lvXinGoi(e); }, true);
`
