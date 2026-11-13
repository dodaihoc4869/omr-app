// CHẤM LAZE TRÊN TỜ CHIẾU (thầy 13/11: «nút laze để lại nhưng cho tôi một phím tắt để bật tắt và nó phải soi được mọi chỗ trên màn chiếu nhé, mặc định tắt
// nhé» · «ẩn laze trong video nhé»). Đoạn ES5 chèn vào JS_LIVE_KHOI_TO_CHIEU (cùng phạm vi: LV · lvGui · dichApp · baoNhanh · S của bút).
//   · PHÍM P (đang live, không gõ chữ) ⇒ báo app (việc `lz`). APP giữ trạng thái (thay-noi.ts `doiLaze`) rồi báo lại tờ đang chiếu bằng lệnh `live-lz` — phím P
//     bấm ở cửa sổ app (cột tin nhắn, tấm hoạt động) cũng đổi được; tờ mới lên chiếu nhận đúng trạng thái. MẶC ĐỊNH TẮT mỗi buổi, không nhớ qua lần mở.
//   · Bật ⇒ chấm đỏ bám con trỏ ở MỌI chỗ trên tờ (cả khi bút tắt, cả trên thanh đáy), con trỏ hệ thống ẩn; đặt bút / bấm chuột ⇒ chấm ẩn tới lúc nhả.
//   · Máy em: bút (but-bang-to-chieu.ts) gửi vị trí trong gói CON TRỎ kèm cờ laze ⇒ máy em vẽ chấm đỏ đúng chỗ (ve-bang.ts). Gói con trỏ là luồng điểm KHÔNG
//     lưu (phòng chỉ chuyển tiếp, sổ nét không ghi) ⇒ video xem lại không có chấm laze.
export const CSS_LIVE_LAZE = `
html.mc-lz-hien,html.mc-lz-hien *{cursor:none!important}`

export const JS_LIVE_LAZE = `
  (function () {
    if (typeof S === 'undefined') return;
    var cham = document.createElement('i'), nhan = false;
    cham.className = 'mc-laze'; cham.hidden = true; cham.setAttribute('aria-hidden', 'true'); document.body.appendChild(cham);
    function an() { if (!cham.hidden) cham.hidden = true; document.documentElement.classList.remove('mc-lz-hien'); }
    function dat(v) {
      var cu = !!S.lz; S.lz = !!v;
      if (!S.lz) an();
      if (cu !== S.lz && typeof baoNhanh === 'function') baoNhanh(S.lz ? 'Chấm laze: bật · phím P để tắt' : 'Chấm laze: tắt', 1600);
    }
    window.addEventListener('message', function (e) {
      var m = e.data;
      if (!m || m.nguon !== 'bpu-bang' || e.source !== dichApp() || m.lenh !== 'live-lz') return;
      dat(m.bat === true);
    });
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if ((e.key !== 'p' && e.key !== 'P' && e.code !== 'KeyP') || e.ctrlKey || e.metaKey || e.altKey || e.repeat || !(LV.tt && (LV.tt.pha === 'live' || LV.tt.khoi)) || (t && t.closest && t.closest('input,textarea,select,[contenteditable]'))) return;
      e.preventDefault(); e.stopImmediatePropagation(); lvGui('lz');
    }, true);
    document.addEventListener('pointermove', function (e) {
      if (!S.lz || nhan || e.pointerType === 'touch') { if (!cham.hidden) an(); return; }
      cham.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      if (cham.hidden) { cham.hidden = false; document.documentElement.classList.add('mc-lz-hien'); }
    }, true);
    document.addEventListener('pointerdown', function () { nhan = true; an(); }, true);
    function nha() { nhan = false; }
    document.addEventListener('pointerup', nha, true); document.addEventListener('pointercancel', nha, true);
    document.documentElement.addEventListener('mouseleave', an);
  })();
`
