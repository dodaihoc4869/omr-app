// BẢN VẼ MẪU (Code 4) — "BỘ NÃO ĐÊM QUA" — chạy: node docs/ban-ve-bo-nao-2109/sinh-ban-ve.mjs (dùng chung khung với docs/ban-ve-btvn-nang-do-2109/sinh-ban-ve.mjs)
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
const require = createRequire(new URL('../../package.json', import.meta.url))
const { chromium } = require('playwright')
const D = path.dirname(fileURLToPath(import.meta.url))
const F = "'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"
const PRI = '#0b57d0', PRIC = '#d3e3fd', ONPRIC = '#041e49', SEC = '#c2e7ff', TER = '#c4eed0', ONTER = '#0f5223', ERR = '#f9dedc', ONERR = '#8c1d18', WARN = '#fef7e0', ONWARN = '#5c4400'
const SUR = '#fdfbff', SC = '#f0f4f9', SCH = '#e9eef6', TXT = '#1f1f1f', SUB = '#444746', LINE = '#c4c7c5', VIEN = '#e1e3e1'
const ic = (d, s = 22, c = 'currentColor') => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const I = {
  nay: '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>', hs: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  ca: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', de: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  btvn: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', bang: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  hoi: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', cai: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  tim: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', them: '<path d="M12 5v14M5 12h14"/>', ghim: '<path d="M12 17v5"/><path d="M9 3h6l-1 7 3 3v2H7v-2l3-3z"/>',
  tich: '<path d="M20 6 9 17l-5-5"/>', xem: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', dong: '<path d="M18 6 6 18M6 6l12 12"/>', phai: '<path d="m9 18 6-6-6-6"/>', lich: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', cho: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', thongtin: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
}
const MUC = [['nay', 'Hôm nay'], ['hs', 'Học sinh'], ['ca', 'Ca thi'], ['de', 'Ngân hàng đề'], ['btvn', 'Bài tập về nhà'], ['bang', 'Gọi lên bảng'], ['hoi', 'Học sinh hỏi']]
const chip = (t, bg, fg, extra = '') => `<span style="display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:14px;background:${bg};color:${fg};font-size:12.5px;font-weight:700;white-space:nowrap;${extra}">${t}</span>`
const nut = (t, kieu = 'tonal', icon = '', extra = '') => {
  const st = { chinh: `background:${PRI};color:#fff;`, tonal: `background:${SEC};color:#004a77;`, vien: `box-shadow:inset 0 0 0 1px ${LINE};color:${PRI};` }[kieu]
  return `<span style="display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 22px;border-radius:22px;font-size:14px;font-weight:700;white-space:nowrap;${st}${extra}">${icon ? ic(icon, 18) : ''}${t}</span>`
}
const nhan = (t, extra = '') => `<div style="font-size:12px;font-weight:800;letter-spacing:.1em;color:${SUB};${extra}">${t}</div>`
const the = (noi, bg = '#fff', extra = '') => `<div style="border-radius:24px;background:${bg};padding:22px;${bg === '#fff' ? `box-shadow:inset 0 0 0 1px ${VIEN};` : ''}${extra}">${noi}</div>`
const cham = (bg, fg, t) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${bg};color:${fg};font-weight:800;font-size:15px;">${t}</span>`
const gach = (x, y, mau) => `<span style="display:inline-block;width:${x}px;height:${y}px;border-radius:4px;background:${mau};"></span>`

function vo(chon, tieuDe, phu, noiDung, phaiDau = '') {
  const muc = (k, t) => `<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;border-radius:26px;${k === chon ? `background:${PRIC};color:${ONPRIC};font-weight:800;` : `color:${SUB};font-weight:500;`}font-size:15px;">${ic(I[k])}<span>${t}</span></div>`
  return `<div style="width:1440px;height:900px;display:grid;grid-template-columns:264px 1fr;background:${SC};color:${TXT};font-family:${F};overflow:hidden;">
  <div style="display:flex;flex-direction:column;gap:6px;padding:20px 14px;">
    <div style="display:flex;align-items:center;gap:12px;padding:4px 10px 18px;"><div style="width:40px;height:40px;border-radius:12px;background:${PRI};"></div><div style="display:flex;flex-direction:column;line-height:1.15"><span style="font-weight:900;font-size:17px;">ĐỖ ĐẠI HỌC</span><span style="font-size:11px;font-weight:800;color:${PRI};letter-spacing:.06em;">GIÁO VIÊN</span></div></div>
    <div style="display:flex;align-items:center;gap:10px;height:56px;padding:0 20px;margin-bottom:10px;border-radius:18px;background:${PRI};color:#fff;font-size:15px;font-weight:700;">${ic(I.them)}Mở ca kiểm tra</div>
    ${MUC.map(([k, t]) => muc(k, t)).join('')}
    <div style="margin-top:auto;display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;color:${SUB};font-size:15px;">${ic(I.cai)}Cài đặt</div>
  </div>
  <div style="margin:12px 12px 12px 0;border-radius:28px;background:${SUR};display:flex;flex-direction:column;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:16px;padding:22px 32px 14px;"><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:28px;font-weight:800;letter-spacing:-.01em;">${tieuDe}</span><span style="font-size:14px;color:${SUB};">${phu}</span></div><div style="margin-left:auto;display:flex;gap:10px;align-items:center;">${phaiDau}</div></div>
    <div style="flex:1;padding:6px 32px 24px;overflow:hidden;">${noiDung}</div>
  </div></div>`
}

// BẢN VẼ MẪU (Code 4) — "BỘ NÃO ĐÊM QUA" (bản tin sáng ở màn Hôm nay) + "NHẬT KÝ ĐIỀU CHỈNH" (hồ sơ em) + CÔNG TẮC (Cài đặt) + hai trạng thái lỗi.
// Chạy: node docs/ban-ve-bo-nao-2109/sinh-ban-ve.mjs → 2 JPG cùng thư mục (mỗi tệp ≤150 KB). Số liệu là MẪU minh hoạ. Thiết kế: DE-XUAT-BO-NAO-AI-2109.md mục 5; đề bài: prompt-bo-nao.md (mục Code 4).
Object.assign(I, {
  nao: '<path d="M12 3l1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6L5.5 9.5l4.7-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  dongho: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', tin: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  canh: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  phai: '<path d="m9 18 6-6-6-6"/>', bo: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
})
const nhan2 = (t, bg, fg) => `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:96px;height:26px;padding:0 10px;border-radius:8px;background:${bg};color:${fg};font-size:11.5px;font-weight:800;letter-spacing:.06em;white-space:nowrap;">${t}</span>`
const BONG = (extra = '') => `<span style="display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 14px;border-radius:15px;background:${WARN};color:${ONWARN};box-shadow:inset 0 0 0 1px #e8c95a;font-size:12.5px;font-weight:800;letter-spacing:.03em;white-space:nowrap;${extra}">${ic(I.nao, 16)}CHẠY BÓNG — chưa tác động tới học sinh</span>`
const nutNho = (t, kieu = 'tonal', icon = '') => nut(t, kieu, icon, 'height:44px;padding:0 18px;')
const tuaDe = (k) => `<div style="display:flex;align-items:center;gap:12px;">${k}</div>`
const o4 = (bg, fg, tieu, so, phu) => `<div style="flex:1;border-radius:24px;background:${bg};color:${fg};padding:16px 20px;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;">${tieu}</div><div style="font-size:34px;font-weight:800;line-height:1.15;">${so}</div><div style="font-size:13px;opacity:.85;">${phu}</div></div>`

// ───────── A. HÔM NAY · khối "Bộ não đêm qua" ─────────
function homNay() {
  const dong = (nh, van, nutHtml) => `<div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid ${VIEN};">${nh}<div style="flex:1;font-size:15px;line-height:1.45;">${van}</div>${nutHtml}</div>`
  const b = (t) => `<b>${t}</b>`
  const rows = [
    dong(nhan2('CẦN THẦY Ý', ERR, ONERR), `${b('Nguyễn Minh Khôi')} · 12A1 bỏ dở chặng ${b('2 ngày liền')}, chuỗi ${b('12 ngày')} vừa gãy. Đề xuất: giảm ${b('3 câu')}, khởi động 3.`, nutNho('Xem hồ sơ', 'vien')),
    dong(nhan2('CẦN THẦY Ý', ERR, ONERR), `${b('Lê Hoàng Nam')} · 12A2 sai ${b('4/5')} câu Xà phòng hoá trong 7 ngày, ${b('3 lần')} chọn nhầm phương án C.`, nutNho('Gọi lên bảng dạng này', 'tonal')),
    dong(nhan2('CẢ LỚP', SEC, '#004a77'), `${b('Oxi hoá ancol')} · 12A1: ${b('21/34')} em sai từ 2 câu trở lên trong tuần.`, nutNho('Đưa vào buổi chữa', 'tonal')),
    dong(nhan2('GỌI LÊN BẢNG', PRIC, ONPRIC), `${b('Trần Thu Hà')} · 12A1 sai lặp ${b('3 lần')} dạng Thuỷ phân ester (${b('5/8')} câu).`, nutNho('Thêm vào Gọi lên bảng', 'tonal')),
    dong(nhan2('ĐIỀU CHỈNH', TER, ONTER), `Hôm qua chỉnh ${b('9 em')}: ${b('7/9')} xong chặng hôm nay. Đêm qua thêm ${b('9')} em giảm nhịp, ${b('6')} em thử lên bậc.`, nutNho('Xem nhật ký', 'vien')),
    dong(nhan2('THẦY XEM LẠI', WARN, ONWARN), `${b('2 em')} đúng ${b('12/12')} câu, ${b('4 giây')}/câu (thường ${b('11 giây')}/câu). Bộ não chỉ báo thầy, không đổi gì cho em.`, nutNho('Xem 2 em', 'vien')),
  ].join('')
  const khoi = the(
    `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${TER};color:${ONTER};">${ic(I.nao, 24)}</span>
      <div style="flex:1;min-width:280px;"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;color:${SUB};">BỘ NÃO ĐÊM QUA · TỐI 21 → SÁNG 22/09</div>
      <div style="font-size:13.5px;color:${SUB};margin-top:2px;display:flex;align-items:center;gap:6px;">${ic(I.dongho, 15)}Chạy lần cuối <b style="color:${TXT};">04:07 sáng nay</b> · soi <b style="color:${TXT};">261</b> em (19 soi kỹ · 4 vắng)</div></div>
      ${BONG()}
      ${nutNho('Nhật ký đêm', 'vien', I.phai)}
    </div>
    <div style="margin-top:14px;">${rows}</div>
    <div style="display:flex;align-items:flex-start;gap:10px;margin-top:6px;padding:12px 16px;border-radius:16px;background:${SC};font-size:13px;line-height:1.5;color:${SUB};">${ic(I.tin, 18)}<span>Bản tin do bộ não viết từ số liệu tối qua — <b style="color:${TXT};">thầy quyết định</b>. Đang ở chế độ <b style="color:${TXT};">bóng</b>: điều chỉnh chỉ được lưu để thầy soi; kế hoạch ngày và bài tập của học sinh <b style="color:${TXT};">chưa đổi</b>.</span></div>`,
    '#fff', 'padding:20px 24px;')
  const o = `<div style="display:flex;gap:14px;margin-bottom:14px;">${o4(TER, ONTER, 'ĐẠT NHIỆM VỤ HÔM NAY', '142/261', '54% · hôm qua 49%')}${o4(PRIC, ONPRIC, 'BTVN ĐÚNG NHỊP', '86%', '3 bài đang chạy')}${o4(SEC, '#004a77', 'CÂU TỚI HẠN ÔN', '1.179', 'cả trường · 939 mở được')}${o4(ERR, ONERR, 'EM CẦN THẦY Ý', '17', 'trễ nhịp ≥ 3 ngày hoặc tụt bậc')}</div>`
  return vo('nay', 'Chào thầy Học', 'Thứ Ba, 22/09 · 261 học sinh · 8 lớp', o + khoi)
}

// ───────── B. HỒ SƠ EM · nhật ký điều chỉnh ─────────
function nhatKy() {
  const chipKQ = (t, bg, fg) => `<span style="display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:14px;background:${bg};color:${fg};font-size:12.5px;font-weight:800;white-space:nowrap;">${t}</span>`
  const cot = 'display:grid;grid-template-columns:132px 236px 1fr 200px 180px;gap:16px;align-items:start;padding:14px 0;border-top:1px solid ' + VIEN + ';'
  const dau = `<div style="${cot}border-top:0;padding:4px 0 8px;font-size:11.5px;font-weight:800;letter-spacing:.09em;color:${SUB};"><span>NGÀY</span><span>NÚM BỘ NÃO VẶN</span><span>LÝ DO (BẰNG SỐ)</span><span>KẾT QUẢ HÔM SAU</span><span></span></div>`
  const ngay = (d, phu, act) => `<div style="display:flex;flex-direction:column;gap:4px;"><b style="font-size:15px;">${d}</b><span style="font-size:12.5px;color:${act ? ONWARN : SUB};">${phu}</span></div>`
  const num = (a, b) => `<div style="display:flex;flex-direction:column;gap:6px;font-size:14.5px;line-height:1.35;"><b>${a}</b>${b ? `<span style="color:${SUB};">${b}</span>` : ''}</div>`
  const ly = (t, phu = '') => `<div style="font-size:14px;line-height:1.5;">${t}${phu ? `<div style="margin-top:8px;padding:10px 12px;border-radius:12px;background:${SC};font-size:13px;color:${SUB};line-height:1.5;">${phu}</div>` : ''}</div>`
  const bo = (h) => nut('Bỏ điều chỉnh này', 'vien', I.bo, 'height:44px;padding:0 16px;color:' + ONERR + ';box-shadow:inset 0 0 0 1px #d99;' + (h ? '' : ''))
  const hang = (a, b, c, d, e) => `<div style="${cot}">${a}${b}${c}${d}<div style="display:flex;justify-content:flex-end;">${e}</div></div>`
  const rows = [
    hang(ngay('Hôm nay · 22/09', 'còn hiệu lực tới 25/09', true), num('Nhịp −2 · khởi động 3', 'Ưu tiên: Thuỷ phân ester'), ly('Sai <b>5/8</b> câu Thuỷ phân ester trong 7 ngày; bỏ dở chặng 3 hôm qua ở câu <b>4/6</b>.', '<b>Lời nhắn (khi bật thật):</b> “Hôm qua em làm xong 4 câu đầu chặng 3. Hôm nay thử 3 câu Thuỷ phân ester bậc Hiểu nhé.” · <b>Bộ não đang thử:</b> giảm 2 câu, chờ xem em có xong chặng.'), chipKQ('Chờ dữ liệu ngày mai', SCH, SUB), bo()),
    hang(ngay('21/09', 'còn hiệu lực tới 24/09', true), num('Hạ một bậc', 'Oxi hoá ancol · Vận dụng → Hiểu'), ly('Đúng <b>2/6</b> câu Oxi hoá ancol, hai chặng liền.'), `<div style="display:flex;flex-direction:column;gap:6px;">${chipKQ('Có hiệu quả', TER, ONTER)}<span style="font-size:12.5px;color:${SUB};">xong chặng · đúng 4/6 ở bậc Hiểu</span></div>`, bo()),
    hang(ngay('19/09', 'đã hết hạn'), num('Nhịp +1', 'Thử lên bậc: Xà phòng hoá'), ly('Đúng <b>9/10</b> câu ở bậc Hiểu, <b>6 giây</b>/câu.'), `<div style="display:flex;flex-direction:column;gap:6px;">${chipKQ('Không đổi', SCH, SUB)}<span style="font-size:12.5px;color:${SUB};">đúng 8/10 ở bậc mới</span></div>`, ''),
    hang(ngay('17/09', 'đã hết hạn'), num('Tạm nghỉ', 'Glucose tráng bạc'), ly('Đúng <b>7/7</b> câu Glucose tráng bạc trong 7 ngày.'), `<div style="display:flex;flex-direction:column;gap:6px;">${chipKQ('Chưa hiệu quả', ERR, ONERR)}<span style="font-size:12.5px;color:${SUB};">bỏ dở chặng 2 ở câu 3/5</span></div>`, ''),
  ].join('')
  const ho = the(`<div style="display:flex;align-items:center;gap:16px;"><span style="display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:${TER};color:${ONTER};font-size:24px;font-weight:800;">T</span><div style="flex:1;"><div style="font-size:24px;font-weight:800;">Trần Thu Hà</div><div style="display:flex;gap:8px;margin-top:6px;">${chip('#12121007', PRIC, ONPRIC)}${chip('Lớp 12A1', TER, ONTER)}</div></div>${nut('Giao bài riêng', 'chinh')}${nut('Nhắn phụ huynh', 'vien')}</div>`, '#fff', 'padding:18px 24px;')
  const khoi = the(
    `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${TER};color:${ONTER};">${ic(I.nao, 24)}</span>
      <div style="flex:1;min-width:260px;"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;color:${SUB};">NHẬT KÝ ĐIỀU CHỈNH · BỘ NÃO</div><div style="font-size:13.5px;color:${SUB};margin-top:2px;">4 lần gần nhất · chỉ thầy thấy</div></div>
      ${BONG()}
    </div>
    <div style="margin-top:12px;">${dau}${rows}</div>
    <div style="display:flex;align-items:flex-start;gap:10px;margin-top:4px;padding:12px 16px;border-radius:16px;background:${SC};font-size:13px;line-height:1.5;color:${SUB};">${ic(I.tin, 18)}<span><b style="color:${TXT};">Bỏ điều chỉnh này</b>: kế hoạch của em về đúng như thuật toán tự chọn; bộ não ghi nhận thầy đã bỏ. Đang chạy bóng nên hiện chưa có gì đổi với em — bỏ ở đây chỉ để bộ não biết thầy không đồng ý.</span></div>`,
    '#fff', 'padding:20px 24px;')
  return `<div style="width:1416px;margin:0 12px;display:flex;flex-direction:column;gap:14px;font-family:${F};color:${TXT};">${ho}${khoi}</div>`
}

// ───────── C. CÀI ĐẶT · công tắc + chế độ theo lớp ─────────
function caiDat() {
  const seg = (bong) => `<span style="display:inline-flex;padding:4px;border-radius:24px;background:${SCH};">${['Chạy bóng', 'Thật'].map((t, i) => { const on = (i === 0) === bong; return `<span style="display:inline-flex;align-items:center;height:40px;padding:0 22px;border-radius:20px;font-size:14px;font-weight:700;${on ? `background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.18);color:${i === 0 ? ONWARN : ONTER};` : `color:${SUB};`}">${on ? ic(I.tich, 16) + '&nbsp;' : ''}${t}</span>` }).join('')}</span>`
  const lop = (t, n, bong) => `<div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid ${VIEN};"><div style="flex:1;"><b style="font-size:15px;">${t}</b> <span style="font-size:13.5px;color:${SUB};">· ${n} em</span></div>${seg(bong)}</div>`
  const cong = `<span style="display:inline-flex;align-items:center;width:64px;height:36px;border-radius:18px;background:${PRI};padding:0 4px;justify-content:flex-end;"><span style="width:28px;height:28px;border-radius:50%;background:#fff;"></span></span>`
  return `<div style="width:1416px;margin:0 12px;font-family:${F};color:${TXT};">${the(
    `<div style="display:flex;align-items:center;gap:16px;">
      <span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${TER};color:${ONTER};">${ic(I.nao, 24)}</span>
      <div style="flex:1;"><div style="font-size:18px;font-weight:800;">Bộ não (huấn luyện viên AI)</div><div style="font-size:14px;color:${SUB};margin-top:2px;line-height:1.5;">Mỗi đêm đọc số liệu học của từng em, đề xuất chỉnh nhịp/dạng và viết bản tin cho thầy. Chạy trên máy thầy; học sinh chỉ thấy bài vừa sức hơn.</div></div>
      ${cong}
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin:14px 0 6px;">${chip('Đã chạy 04:07 sáng nay · 5 giờ trước', TER, ONTER)}${chip('Đêm nay: 04:00', SCH, TXT)}</div>
    <div style="margin-top:18px;font-size:12px;font-weight:800;letter-spacing:.1em;color:${SUB};">CHẾ ĐỘ THEO LỚP</div>
    ${lop('12A1', 34, true)}${lop('12A2', 30, true)}${lop('11B1', 28, true)}
    <div style="display:flex;align-items:flex-start;gap:10px;margin-top:6px;padding:12px 16px;border-radius:16px;background:${WARN};font-size:13px;line-height:1.5;color:${ONWARN};">${ic(I.tin, 18)}<span><b>Chạy bóng</b>: bộ não vẫn đọc và viết điều chỉnh, nhưng <b>không tầng nào đọc</b> — kế hoạch ngày và bài tập của học sinh không đổi một byte. Chuyển sang <b>Thật</b> từng lớp sau khi thầy soi bản tin vài đêm; chuyển sẽ hỏi xác nhận.</span></div>`,
    '#fff', 'padding:20px 24px;')}</div>`
}

// ───────── D. TRẠNG THÁI KHI BỘ NÃO KHÔNG BÁO ─────────
function loi() {
  const the2 = (mau, fg, icon, tieu, van, nutHtml) => `<div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:18px 22px;border-radius:24px;background:${mau};color:${fg};"><div style="display:flex;align-items:center;gap:12px;">${ic(icon, 24)}<b style="font-size:16px;">${tieu}</b></div><div style="font-size:14px;line-height:1.5;">${van}</div><div>${nutHtml}</div></div>`
  return `<div style="width:1416px;margin:0 12px;display:flex;gap:14px;font-family:${F};">
    ${the2(WARN, ONWARN, I.canh, 'Bộ não chưa chạy 40 giờ', 'Lần cuối <b>20/09 20:11</b> (quá 36 giờ). Kiểm tra máy thầy còn thức và hai mã lệnh còn được phép. <b>Học sinh vẫn học bình thường.</b>', nut('Xem hướng dẫn', 'vien', '', 'height:44px;background:#fff;'))}
    ${the2(ERR, ONERR, I.canh, 'Máy chủ chưa có bản tin bộ não', 'Bộ não chưa chạy lần nào (máy chủ chưa có lệnh bản tin bộ não). Chưa có số nào để hiện — không phải lỗi của học sinh hay lớp.', nut('Thử lại', 'vien', '', 'height:44px;background:#fff;'))}
  </div>`
}

const cap = (t) => `<div style="width:1416px;margin:0 12px;padding:6px 4px;font-family:${F};font-size:14px;font-weight:800;color:${SUB};">${t}</div>`
const khung = (noi) => `<div style="width:1440px;display:flex;flex-direction:column;gap:12px;background:${SC};padding-bottom:16px;">${noi}</div>`
const tam1 = khung(`${cap('A · Màn HÔM NAY — khối mới “Bộ não đêm qua” (bản tin ≤ 6 dòng, mỗi dòng một nút; quá 36 giờ thì cảnh báo — xem D)')}${homNay()}`)
const tam2 = khung(`${cap('B · HỒ SƠ EM — “Nhật ký điều chỉnh”: ngày · núm · lý do bằng số · kết quả hôm sau + nút “Bỏ điều chỉnh này” (chỉ khi còn hiệu lực)')}${nhatKy()}
${cap('C · CÀI ĐẶT — công tắc bộ não + chế độ Chạy bóng / Thật theo từng lớp')}${caiDat()}
${cap('D · Khi bộ não không báo — nói thật, không giả số')}${loi()}`)

const b = await chromium.launch({ headless: true })
const chup = async (html, ten) => {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage()
  await p.setContent(`<html><body style="margin:0;background:${SC}">${html}</body></html>`)
  await p.waitForTimeout(300)
  let q = 82, buf
  do { buf = await p.screenshot({ type: 'jpeg', quality: q, fullPage: true }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  fs.writeFileSync(path.join(D, ten), buf)
  console.log(ten, Math.round(buf.length / 1024) + ' KB')
  await p.close()
}
await chup(tam1, '1-hom-nay-bo-nao-dem-qua.jpg')
await chup(tam2, '2-nhat-ky-cai-dat-trang-thai.jpg')
await b.close()
