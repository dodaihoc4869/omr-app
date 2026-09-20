// BẢN VẼ MẪU (Code 4) — BTVN "nâng đỡ": (1) công tắc "Cá nhân hoá" + ghim câu cả lớp ở màn Giao bài; (2) màn "Xem trước phân bổ".
// Chạy: node docs/ban-ve-btvn-nang-do-2109/sinh-ban-ve.mjs  → 3 JPG cùng thư mục (≤150 KB). Số liệu là MẪU minh hoạ, không phải dữ liệu thật.
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

// ───────── 1. GIAO BÀI · công tắc cá nhân hoá + ghim ─────────
function giaoBai() {
  const buoc = (n, t, noi) => `<div style="display:flex;gap:14px;align-items:flex-start;">${cham(PRIC, ONPRIC, n)}<div style="flex:1;display:flex;flex-direction:column;gap:8px;"><span style="font-size:16px;font-weight:800;line-height:34px;">${t}</span>${noi}</div></div>`
  const dong = (a, b) => `<span style="font-size:14px;color:${SUB};">${a} <b style="color:${TXT};">${b}</b></span>`
  const tab = `<div style="display:flex;gap:6px;padding:4px;border-radius:24px;background:${SCH};width:max-content;margin-bottom:14px;"><span style="height:44px;padding:0 24px;display:flex;align-items:center;border-radius:20px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);font-weight:800;font-size:14px;color:${PRI};">Giao bài mới</span><span style="height:44px;padding:0 24px;display:flex;align-items:center;font-weight:600;font-size:14px;color:${SUB};">Đợt bài đã giao</span></div>`
  const trai = the(
    `<div style="display:flex;flex-direction:column;gap:20px;">
      ${buoc(1, 'Chọn lớp / ca', `<div style="display:flex;gap:8px;">${chip('12A1 · 34 em', PRIC, ONPRIC)}${chip('12A2 · 30 em', SCH, SUB)}</div>`)}
      ${buoc(2, 'Chọn đề', `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:${SC};"><div style="flex:1;"><div style="font-weight:800;font-size:15px;">Chương 1 · Ester – Lipid · bộ 80 câu</div><div style="font-size:13px;color:${SUB};margin-top:2px;">Phần I 48 · Phần II 20 · Phần III 12 · 12 dạng bài</div></div>${nut('Đổi đề', 'vien')}</div>`)}
      ${buoc(3, 'Hạn nộp', `<div style="display:flex;align-items:center;gap:12px;">${chip('Thứ Sáu 27/09 · 22:00', SCH, TXT)}${dong('còn', '7 ngày')}</div>`)}
    </div>`)
  const bat = the(
    `<div style="display:flex;align-items:flex-start;gap:16px;">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:18px;font-weight:800;">Cá nhân hoá</span>${chip('Khuyên dùng', TER, ONTER)}</div>
        <span style="font-size:14px;line-height:1.55;color:${SUB};">Mỗi em nhận bộ câu <b style="color:${TXT};">vừa sức</b> theo hồ sơ của em: <b style="color:${TXT};">lõi chung</b> (cả lớp giống nhau, phủ hết các dạng) + <b style="color:${TXT};">phần riêng</b>, chia thành chặng mỗi ngày. Em yếu không nhận câu vượt bậc; em khá bỏ bớt câu dễ đã đúng lại.</span>
      </div>
      <div style="flex:0 0 auto;width:60px;height:34px;border-radius:17px;background:${PRI};position:relative;margin-top:2px;"><div style="position:absolute;right:4px;top:4px;width:26px;height:26px;border-radius:50%;background:#fff;"></div></div>
    </div>
    <div style="margin-top:16px;padding:14px 16px;border-radius:16px;background:${PRIC};color:${ONPRIC};display:flex;gap:12px;align-items:flex-start;">${ic(I.thongtin, 20)}<span style="font-size:13.5px;line-height:1.5;"><b>Bộ câu của em chốt khi em mở bài lần đầu</b> — xem trước chỉ là ước tính theo hồ sơ hôm nay. Sau khi giao, không sửa thứ tự câu trong đề của bài này.</span></div>
    <div style="margin-top:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${[['26/80', 'câu LÕI chung', '≈ 32 % · tự tính theo số dạng', TER, ONTER], ['12', 'dạng được phủ', 'mỗi dạng 1–2 câu đại diện', PRIC, ONPRIC], ['2', 'câu ghim thêm', 'cả lớp bắt buộc', SEC, '#004a77']].map(([so, t, p, bg, fg]) => `<div style="padding:14px 16px;border-radius:18px;background:${bg};color:${fg};"><div style="font-size:30px;font-weight:800;line-height:1.1;">${so}</div><div style="font-size:13px;font-weight:800;margin-top:2px;">${t}</div><div style="font-size:12px;opacity:.85;margin-top:2px;">${p}</div></div>`).join('')}
    </div>
    <div style="margin-top:20px;">
      ${nhan('GHIM CÂU "CẢ LỚP BẮT BUỘC"')}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center;">
        ${chip(`${ic(I.ghim, 14)} Câu 12 · Thuỷ phân ester`, TER, ONTER)}${chip(`${ic(I.ghim, 14)} Câu 47 · Xà phòng hoá`, TER, ONTER)}${nut('Chọn câu để ghim…', 'vien', I.them)}
      </div>
      <div style="font-size:12.5px;color:${SUB};margin-top:8px;">Câu ghim luôn nằm trong bộ của MỌI em (thêm vào lõi). Tối đa 10 câu.</div>
    </div>
    <div style="margin-top:22px;display:flex;align-items:center;gap:12px;">${nut('Xem trước phân bổ', 'tonal', I.xem)}${nut('Giao bài cho 34 em', 'chinh')}<span style="font-size:13px;color:${SUB};">Tắt công tắc = như cũ: cả lớp nhận đủ 80 câu.</span></div>`)
  return vo('btvn', 'Giao bài tập về nhà', 'Chọn học sinh, chọn đề và đặt hạn nộp. Theo dõi bài chưa nộp ở mục Đã giao.', `${tab}<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:18px;align-items:start;">${trai}${bat}</div>`)
}

// ───────── 2. XEM TRƯỚC PHÂN BỔ ─────────
const EM = [
  ['Trần Thu Hà', '12121007', 46, 26, 20, [24, 17, 5], 7, 'đang yếu 3 dạng', ERR, ONERR],
  ['Nguyễn Minh Khôi', '12121034', 58, 26, 32, [19, 28, 11], 7, '', null, null],
  ['Lê Hoàng Nam', '12121019', 44, 26, 18, [27, 14, 3], 6, 'nợ ôn nhiều', WARN, ONWARN],
  ['Phạm Gia Bảo', '12121002', 72, 26, 46, [8, 33, 31], 8, '', null, null],
  ['Đỗ Khánh Linh', '12121015', 40, 26, 14, [25, 15, 0], 6, 'chưa có hồ sơ', SCH, SUB],
  ['Vũ Đức Anh', '12121031', 62, 26, 36, [12, 34, 16], 7, '', null, null],
  ['Hoàng Mai Chi', '12121011', 68, 26, 42, [10, 33, 25], 8, '', null, null],
]
function bangEm(chon) {
  const dong = (e, i) => {
    const [ten, sbd, tong, loi, rieng, [b, h, v], chang, ghi, gbg, gfg] = e
    const sel = i === chon
    return `<div style="display:grid;grid-template-columns:minmax(0,1.9fr) 38px 92px 150px 44px;gap:12px;align-items:center;padding:10px 14px;border-radius:16px;${sel ? `background:${PRIC};` : ''}">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;"><span style="flex:0 0 auto;">${cham(sel ? '#fff' : TER, sel ? ONPRIC : ONTER, ten.split(' ').pop()[0])}</span><div style="min-width:0;"><div style="font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ten}</div><div style="font-size:11.5px;color:${SUB};white-space:nowrap;">${sbd}</div>${ghi ? `<div style="margin-top:2px;">${chip(ghi, sel ? '#fff' : gbg, gfg, 'height:20px;font-size:10.5px;padding:0 8px;')}</div>` : ''}</div></div>
      <div style="font-size:19px;font-weight:800;text-align:right;">${tong}</div>
      <div><div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:${SCH};"><span style="width:${(loi / tong) * 100}%;background:${PRI};"></span><span style="width:${(rieng / tong) * 100}%;background:${SEC};"></span></div><div style="font-size:11px;color:${SUB};margin-top:4px;white-space:nowrap;">${loi} lõi · ${rieng} riêng</div></div>
      <div style="display:flex;gap:6px;">${[['Biết', b, TER, ONTER], ['Hiểu', h, PRIC, ONPRIC], ['Vận dụng', v, WARN, ONWARN]].map(([t, n, bg, fg]) => `<div style="flex:1;padding:4px 2px;border-radius:10px;background:${bg};color:${fg};text-align:center;"><div style="font-size:15px;font-weight:800;line-height:1.1;">${n}</div><div style="font-size:9.5px;font-weight:700;white-space:nowrap;">${t}</div></div>`).join('')}</div>
      <div style="text-align:right;font-size:15px;font-weight:800;line-height:1.1;">${chang}<div style="font-size:10.5px;font-weight:600;color:${SUB};">chặng</div></div></div>`
  }
  return `<div style="display:grid;grid-template-columns:minmax(0,1.9fr) 38px 92px 150px 44px;gap:12px;padding:0 14px 8px;font-size:11px;font-weight:800;letter-spacing:.08em;color:${SUB};"><span>HỌC SINH</span><span style="text-align:right;">TỔNG</span><span>LÕI / RIÊNG</span><span>BẬC</span><span style="text-align:right;">CHẶNG</span></div><div style="display:flex;flex-direction:column;gap:2px;">${EM.map(dong).join('')}</div>`
}
function chiTietEm() {
  const NH = { khoi_dong: ['Khởi động', TER, ONTER], loi: ['Cốt lõi', PRIC, ONPRIC], rieng: ['Dành riêng cho em', SEC, '#004a77'], thu_thach: ['Thử thách · sai không sao', WARN, ONWARN] }
  const cau = (so, dang, muc, phan, k, ly) => `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #eceeed;"><span style="width:52px;font-size:13px;font-weight:800;white-space:nowrap;">Câu ${so}</span><div style="flex:1;min-width:0;"><div style="font-size:13.5px;font-weight:700;">${dang} <span style="font-weight:500;color:${SUB};">· ${muc} · phần ${phan}</span></div>${ly ? `<div style="font-size:12px;color:${SUB};">${ly}</div>` : ''}</div>${chip(NH[k][0], NH[k][1], NH[k][2], 'height:24px;font-size:11.5px;')}</div>`
  const chang = (n, ngay, rows) => `<div style="margin-top:14px;"><div style="display:flex;align-items:baseline;gap:8px;"><span style="font-size:15px;font-weight:800;">Chặng ${n}</span><span style="font-size:12.5px;color:${SUB};">${ngay} · 7 câu · ≈ 12 phút</span></div>${rows}</div>`
  return the(
    `<div style="display:flex;align-items:center;gap:12px;">${cham(PRIC, ONPRIC, 'H')}<div style="flex:1;"><div style="font-size:19px;font-weight:800;">Trần Thu Hà <span style="font-size:13px;font-weight:600;color:${SUB};">· 12121007</span></div><div style="font-size:13px;color:${SUB};">46 câu · 7 chặng · lõi 26 + riêng 20 · thử thách 5 (≤ 20 %)</div></div></div>
     <div style="margin-top:12px;padding:10px 14px;border-radius:14px;background:${WARN};color:${ONWARN};font-size:12.5px;line-height:1.5;">Em đang yếu <b>Thuỷ phân ester</b> (2/7 câu đã khắc phục) · bậc <b>Biết</b> → em <b>không</b> nhận câu Vận dụng của dạng này; đúng 2 câu liền ở bậc Biết thì chặng sau mở bậc Hiểu.</div>
     ${chang(1, 'Ngày 1 · T2 23/09', cau(3, 'Este – khái niệm', 'Biết', 'I', 'khoi_dong', 'em từng làm đúng') + cau(9, 'Este – danh pháp', 'Biết', 'I', 'khoi_dong', 'em từng làm đúng') + cau(12, 'Thuỷ phân ester', 'Biết', 'I', 'loi', 'ghim: cả lớp bắt buộc') + cau(21, 'Thuỷ phân ester', 'Biết', 'I', 'rieng', 'dạng em đang yếu · đúng bậc của em') + cau(30, 'Xà phòng hoá', 'Biết', 'I', 'loi', '') + cau(36, 'Thuỷ phân ester', 'Biết', 'II', 'rieng', 'em từng sai, chưa đúng lại') + cau(41, 'Glucose tráng bạc', 'Hiểu', 'I', 'thu_thach', 'dạng em đang ổn · +1 bậc'))}
     ${chang(2, 'Ngày 2 · T3 24/09', cau(5, 'Este – khái niệm', 'Biết', 'I', 'khoi_dong', '') + cau(14, 'Chất béo', 'Biết', 'I', 'khoi_dong', '') + `<div style="padding:9px 0;border-top:1px solid #eceeed;font-size:12.5px;color:${SUB};">… 5 câu nữa</div>`)}
     <div style="margin-top:12px;font-size:12px;color:${SUB};">Chặng 3–7 được chọn lại sau mỗi chặng theo kết quả của em (Đợt 2).</div>`)
}
function xemTruoc() {
  const dau = `${nut('Đóng xem trước', 'vien', I.dong)}${nut('Giao bài cho 34 em', 'chinh')}`
  const tren = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">${chip('Chương 1 · Ester – Lipid', PRIC, ONPRIC)}${chip('12A1 · 34 em', SCH, TXT)}${chip('Hạn 27/09 · 7 ngày', SCH, TXT)}${chip('Lõi chung 26 câu · 12 dạng', TER, ONTER)}${chip('Xem trước — chưa ghi gì', WARN, ONWARN)}</div>`
  const luuY = `<div style="margin-top:10px;font-size:12.5px;color:${SUB};line-height:1.5;">Số liệu tính theo hồ sơ hôm nay; <b style="color:${TXT};">bộ thật của em chốt khi em mở bài lần đầu</b>. Bảng xem 50 em mỗi lượt. Không hiện thứ hạng giữa các em.</div>`
  return vo('btvn', 'Xem trước phân bổ', 'Từng em nhận bao nhiêu câu, ở bậc nào, chia mấy chặng — trước khi giao.', `${tren}<div style="display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:18px;align-items:start;">${the(bangEm(0) + luuY)}${chiTietEm()}</div>`, dau)
}
// ───────── 3. XEM TRƯỚC · điện thoại 390 ─────────
function xemTruocDienThoai() {
  const e = EM[0]
  return `<div style="box-sizing:border-box;width:390px;background:${SUR};color:${TXT};font-family:${F};padding:16px 16px 24px;display:flex;flex-direction:column;gap:14px;">
    <div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;"><div style="font-size:22px;font-weight:800;">Xem trước phân bổ</div><div style="font-size:13px;color:${SUB};">Chương 1 · 12A1 · hạn 27/09</div></div>${nut('Đóng', 'vien', '', 'padding:0 16px;')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${chip('Lõi 26 câu', TER, ONTER)}${chip('Xem trước — chưa ghi gì', WARN, ONWARN)}</div>
    ${EM.slice(0, 3).map((x, i) => {
      const [ten, sbd, tong, loi, rieng, [b, h, v], chang, ghi, gbg, gfg] = x
      return `<div style="border-radius:20px;padding:14px;${i === 0 ? `background:${PRIC};` : `box-shadow:inset 0 0 0 1px ${VIEN};`}">
        <div style="display:flex;align-items:center;gap:10px;">${cham(i === 0 ? '#fff' : TER, i === 0 ? ONPRIC : ONTER, ten.split(' ').pop()[0])}<div style="flex:1;"><div style="font-weight:800;font-size:15px;">${ten}</div><div style="font-size:12px;color:${SUB};">${sbd}</div></div><div style="text-align:right;"><div style="font-size:22px;font-weight:800;line-height:1;">${tong}</div><div style="font-size:11px;color:${SUB};">câu · ${chang} chặng</div></div></div>
        <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:${SCH};margin-top:12px;"><span style="width:${(loi / tong) * 100}%;background:${PRI};"></span><span style="width:${(rieng / tong) * 100}%;background:${SEC};"></span></div>
        <div style="font-size:12px;color:${SUB};margin-top:4px;">lõi <b>${loi}</b> · riêng <b>${rieng}</b></div>
        <div style="display:flex;gap:6px;margin-top:10px;">${[['Biết', b, TER, ONTER], ['Hiểu', h, PRIC === '' ? PRIC : '#fff', ONPRIC], ['Vận dụng', v, WARN, ONWARN]].map(([t, n, bg, fg]) => `<div style="flex:1;padding:6px;border-radius:12px;background:${bg};color:${fg};text-align:center;"><div style="font-size:16px;font-weight:800;line-height:1.1;">${n}</div><div style="font-size:10.5px;font-weight:700;">${t}</div></div>`).join('')}</div>
        ${ghi ? `<div style="margin-top:10px;">${chip(ghi, gbg, gfg)}</div>` : ''}
        ${i === 0 ? `<div style="margin-top:12px;display:flex;align-items:center;gap:6px;color:${PRI};font-weight:800;font-size:13.5px;">Xem danh sách câu ${ic(I.phai, 18)}</div>` : ''}
      </div>`
    }).join('')}
    <div style="font-size:12.5px;color:${SUB};line-height:1.5;">Bộ thật của em chốt khi em mở bài lần đầu.</div>
    ${nut('Giao bài cho 34 em', 'chinh', '', 'justify-content:center;width:100%;box-sizing:border-box;')}
  </div>`
}

const b = await chromium.launch({ headless: true })
const chup = async (html, ten, w, h, fullPage = false) => {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage()
  await p.setContent(`<html><body style="margin:0;background:${SC}">${html}</body></html>`)
  await p.waitForTimeout(300)
  let q = 82, buf
  do { buf = await p.screenshot({ type: 'jpeg', quality: q, fullPage }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  fs.writeFileSync(path.join(D, ten), buf)
  console.log(ten, Math.round(buf.length / 1024) + ' KB')
  await p.close()
}
await chup(giaoBai(), '1-giao-bai-ca-nhan-hoa.jpg', 1440, 900)
await chup(xemTruoc(), '2-xem-truoc-phan-bo.jpg', 1440, 900)
await chup(xemTruocDienThoai(), '3-xem-truoc-phan-bo-390.jpg', 390, 800, true)
await b.close()
