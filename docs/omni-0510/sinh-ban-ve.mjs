// BẢN VẼ MINH HOẠ — OMNI bản 3 (05/10/2026). Chạy: node docs/omni-0510/sinh-ban-ve.mjs → 8 JPG cùng thư mục (≤ 150 KB).
// Chụp bằng Chromium headless có sẵn ở /opt/pw-browsers (không cần node_modules), đổi JPG bằng ImageMagick `convert`.
// Số liệu, tên là MẪU minh hoạ, không phải dữ liệu thật. Chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const D = path.dirname(fileURLToPath(import.meta.url))
const CHROME = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p))
if (!CHROME) throw new Error('Không thấy Chromium trong /opt/pw-browsers')

const F = "'Be Vietnam Pro', 'DejaVu Sans', system-ui, sans-serif"
// Màu app thầy (M3, như bản vẽ 21/09 và 28/09)
const PRI = '#0b57d0', PRIC = '#d3e3fd', ONPRIC = '#041e49', SEC = '#c2e7ff', TER = '#c4eed0', ONTER = '#0f5223', ERR = '#f9dedc', ONERR = '#8c1d18', WARN = '#fef7e0', ONWARN = '#5c4400'
const SC = '#f0f4f9', TXT = '#1f1f1f', SUB = '#444746', LINE = '#c4c7c5', VIEN = '#e1e3e1'
// Màu Sảnh học sinh (token --h2-* của sanh-ban-do.css)
const H2 = { chu: 'rgb(24 30 62)', phu: 'rgb(62 72 108)', kinh: 'rgb(255 255 255 / 0.82)', vang: 'rgb(255 196 46)', cam: 'rgb(246 146 18)', ngoc: 'rgb(0 170 175)', ngocDam: 'rgb(0 110 118)', hong: 'rgb(214 40 96)', xanh: 'rgb(16 122 76)', nau: 'rgb(66 32 0)' }
const NEN_SANH = 'linear-gradient(180deg, rgb(150 146 232) 0%, rgb(255 190 176) 18%, rgb(150 214 222) 34%, rgb(70 180 200) 100%)'

const thanh = (pct, mau, nen = 'rgb(255 255 255 / 0.6)') => `<div style="height:10px;border-radius:5px;background:${nen};overflow:hidden"><div style="width:${pct}%;height:100%;background:${mau}"></div></div>`
const kinh = (noi, extra = '') => `<div style="background:${H2.kinh};border:1px solid rgb(255 255 255 / 0.95);border-radius:22px;padding:14px 16px;box-shadow:0 10px 28px rgb(70 40 120 / 0.18);${extra}">${noi}</div>`
const nhan = (t) => `<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:${H2.phu};text-transform:uppercase">${t}</div>`
const nutHs = (t, nen = H2.vang, chu = H2.nau, extra = '') => `<div style="display:flex;align-items:center;justify-content:center;height:48px;border-radius:24px;background:${nen};color:${chu};font-weight:800;font-size:15px;${extra}">${t}</div>`

function voHs(noi, nen = NEN_SANH, chu = H2.chu) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0}*{box-sizing:border-box}</style></head><body>
  <div style="width:390px;height:844px;overflow:hidden;background:${nen};color:${chu};font-family:${F};padding:14px 14px 0;display:flex;flex-direction:column;gap:12px">${noi}</div></body></html>`
}

// ---------------------------------------------------------------- 1. Sảnh học sinh
const hsSanh = voHs(`
  ${kinh(`<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:900;font-size:17px">Thần thú của em: Mập Địch · Cấp 7</div><div style="font-size:12.5px;color:${H2.phu}">EXP 1 240 · còn 60 EXP lên cấp 8 · Chuỗi 5 ngày</div></div><div style="width:46px;height:46px;border-radius:50%;background:${H2.vang}"></div></div>
  <div style="margin-top:10px;display:flex;justify-content:space-between;font-size:12.5px;font-weight:700"><span>Thể lực hôm nay</span><span>28/40 câu</span></div>${thanh(70, H2.ngoc)}`)}
  ${kinh(`${nhan('Bài đang luyện')}<div style="font-weight:900;font-size:18px;margin-top:2px">Bài 6 · Ester</div><div style="font-size:12.5px;color:${H2.phu}">Hạn: còn 5 ngày (tới 23:59 Chủ nhật 12/10)</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:12.5px;font-weight:700"><div>Cọ xát 46 %${thanh(46, H2.cam)}</div><div>Thành thạo 21 %${thanh(21, H2.xanh)}</div></div>
  <div style="margin-top:12px;padding:10px 12px;border-radius:14px;background:rgb(255 255 255 / 0.7)"><div style="font-weight:800;font-size:14px">Dạng vững 2/9</div><div style="font-size:12.5px;color:${H2.phu}">Còn 3 dạng cần vững để chạm mốc 8 · Sơ ý tuần này 6 % (mục tiêu dưới 7 %)</div></div>
  <div style="margin-top:8px;font-size:12.5px;color:${H2.xanh};font-weight:800">✓ Bài 5: Sẵn sàng 8+ · độ tin 91 % · kiểm bằng 28 câu lạ ngày 05/10</div>`)}
  ${kinh(`<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:900;font-size:16px">Đoàn Hộ Tống</div><div style="font-size:12.5px;color:${H2.phu}">9 câu ôn đang chờ · 3 câu đến lịch hôm nay</div></div>${nutHs('Lên đường', H2.ngoc, '#fff', 'padding:0 18px;height:40px')}</div>`)}
  ${kinh(`<div style="display:flex;justify-content:space-between;align-items:center;opacity:.75"><div><div style="font-weight:900;font-size:16px">Bát Linh Đảo</div><div style="font-size:12.5px;color:${H2.phu}">28 câu mới · mở sau khi xong Đoàn</div></div><div style="font-size:12px;font-weight:800;color:${H2.phu}">🔒 Khoá</div></div>`)}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
    ${kinh(`<div style="font-size:11px;font-weight:800;color:${H2.phu}">VÉ THỬ THÁCH</div><div style="font-weight:900;font-size:18px">2/2</div><div style="font-size:11px;color:${H2.phu}">3 câu cao hơn một bậc</div>`, 'padding:12px')}
    ${kinh(`<div style="font-size:11px;font-weight:800;color:${H2.phu}">THỬ SỨC THÊM</div><div style="font-weight:900;font-size:18px">6 câu</div><div style="font-size:11px;color:${H2.phu}">không bắt buộc</div>`, 'padding:12px')}
    ${kinh(`<div style="font-size:11px;font-weight:800;color:${H2.phu}">RƯƠNG</div><div style="font-weight:900;font-size:18px">Khoá</div><div style="font-size:11px;color:${H2.phu}">mở khi xong 40 câu</div>`, 'padding:12px')}
  </div>
  ${kinh(`<div style="font-size:12.5px;color:${H2.phu}">Hôm nay còn 3 câu ôn bài cũ (Bài 4, dạng em đang luyện thêm) · Câu đã làm · Tu luyện</div>`, 'padding:10px 16px')}
`)

// ---------------------------------------------------------------- 2. Câu hỏi + Chắc / Chưa chắc
const pa = (k, t, chon = false) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;background:${chon ? 'rgb(255 226 120)' : 'rgb(255 255 255 / 0.7)'};border:2px solid ${chon ? H2.cam : 'transparent'};font-size:14px"><b>${k}.</b><span>${t}</span></div>`
const hsCau = voHs(`
  ${kinh(`<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;color:${H2.phu}"><span>Bát Linh Đảo · Ải 3/6 · câu mới</span><span>Máu 83/100</span></div>${thanh(83, H2.hong)}`, 'padding:10px 16px')}
  ${kinh(`<div style="font-size:12px;font-weight:800;color:${H2.phu}">TRẮC NGHIỆM · THÔNG HIỂU · Thuỷ phân ester</div>
  <div style="font-size:15px;line-height:1.45;margin:8px 0 10px">Thuỷ phân hoàn toàn 8,8 gam ethyl acetate trong dung dịch NaOH vừa đủ, thu được m gam muối. Giá trị của m là</div>
  <div style="display:flex;flex-direction:column;gap:8px">${pa('A', '6,0')}${pa('B', '8,2', true)}${pa('C', '9,6')}${pa('D', '4,6')}</div>`)}
  ${kinh(`<div style="font-weight:900;font-size:16px;text-align:center">Em chắc không?</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">${nutHs('Chắc', H2.ngoc, '#fff')}${nutHs('Chưa chắc', 'rgb(255 255 255 / 0.9)', H2.chu)}</div>
  <div style="font-size:12px;color:${H2.phu};text-align:center;margin-top:8px">Bấm Chưa chắc giúp máy chọn đúng câu cho em hơn. Không trừ gì cả.</div>`)}
  ${kinh(`<div style="font-size:12.5px;color:${H2.phu}">Thời gian câu này: 1 phút 05 giây · mức thường của em ở câu Thông hiểu: 1 phút 20 giây</div>`, 'padding:10px 16px')}
`)

// ---------------------------------------------------------------- 3. Kết quả: đúng nhưng chậm
const hsKetQua = voHs(`
  ${kinh(`<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;color:${H2.phu}"><span>Bát Linh Đảo · Ải 4/6 · câu mới</span><span>Máu 83/100</span></div>${thanh(83, H2.hong)}`, 'padding:10px 16px')}
  ${kinh(`<div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:50%;background:${H2.xanh};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">✓</div><div><div style="font-weight:900;font-size:18px">Đúng rồi · +3 EXP</div><div style="font-size:12.5px;color:${H2.phu}">Em chọn B và đã bấm Chắc</div></div></div>
  <div style="margin-top:12px;padding:12px;border-radius:14px;background:rgb(255 247 214)"><div style="font-weight:800;font-size:14px;color:${H2.nau}">Đúng nhưng chậm</div><div style="font-size:13px;line-height:1.45;margin-top:4px">Em mất <b>3 phút 10 giây</b>, mức thường của em ở câu Vận dụng là <b>1 phút 35 giây</b>. Dạng này chưa tính vững. Mai gặp một câu tương tự để làm nhanh hơn.</div></div>
  <div style="margin-top:10px;font-size:12.5px;color:${H2.phu}">Dạng Hiệu suất ester hoá: 0,62 → <b>0,71</b> · 5 câu tự làm · 2 ngày · chưa có lượt trôi chảy</div>`)}
  ${kinh(`<div style="font-weight:800;font-size:14px">Lời giải từng bước</div><div style="font-size:13px;color:${H2.phu};margin-top:4px">Bước 1 · Số mol ester = 8,8 / 88 = 0,1 mol → <span style="color:${H2.xanh};font-weight:800">em đã qua</span></div><div style="font-size:13px;color:${H2.phu}">Bước 2 · Muối CH₃COONa: 0,1 × 82 = 8,2 gam → <span style="color:${H2.xanh};font-weight:800">em đã qua</span></div>`)}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${nutHs('Ải tiếp', H2.vang, H2.nau)}${nutHs('Hỏi thầy', 'rgb(255 255 255 / 0.9)', H2.chu)}</div>
`)

// ---------------------------------------------------------------- 4. Trạm hồi phục
const cauNen = (i, t) => `<div style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:rgb(255 255 255 / 0.75);font-size:13.5px"><span style="width:26px;height:26px;border-radius:50%;background:${H2.ngoc};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">${i}</span><span>${t}</span></div>`
const hsTram = voHs(`
  ${kinh(`<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;color:${H2.phu}"><span>Bát Linh Đảo · Ải 5/6</span><span>Máu 83/100 · không mất</span></div>${thanh(83, H2.hong)}`, 'padding:10px 16px')}
  ${kinh(`<div style="display:flex;align-items:center;gap:12px"><div style="width:52px;height:52px;border-radius:50%;background:${H2.ngoc}"></div><div><div style="font-size:11px;font-weight:800;color:${H2.phu};letter-spacing:.08em">TRẠM HỒI PHỤC</div><div style="font-weight:900;font-size:18px">Thần thú đưa em về trạm</div></div></div>
  <div style="margin-top:12px;font-size:14.5px;line-height:1.5">3 câu em vừa sai đều cần bước <b>cân bằng hệ số</b> trong phản ứng ester hoá. Làm 3 câu nhỏ về cân bằng trước, rồi quay lại ải 5. Không mất Máu, không tính sai thêm.</div>
  <div style="margin-top:10px;font-size:12.5px;color:${H2.phu}">Vi kỹ năng Cân bằng hệ số: 0,41 · 6 câu tự làm · đang luyện</div>`)}
  ${kinh(`<div style="font-weight:800;font-size:14px;margin-bottom:8px">3 câu nền</div><div style="display:flex;flex-direction:column;gap:8px">${cauNen(1, 'Cân bằng: CH₃COOH + C₂H₅OH ⇌ ? + H₂O')}${cauNen(2, 'Tỉ lệ mol acid : alcohol khi ester hoá hoàn toàn 1 mol acid')}${cauNen(3, 'Hệ số của NaOH khi thuỷ phân ester của phenol')}</div>`)}
  ${nutHs('Làm 3 câu nền', H2.vang, H2.nau)}
  <div style="font-size:12px;color:${H2.phu};text-align:center">Hoặc: Đọc lời giải từng bước của câu vừa sai · Hỏi thầy</div>
`)

// ---------------------------------------------------------------- 5. Cuối ngày + chứng chỉ
const dong = (t) => `<div style="display:flex;gap:8px;font-size:13.5px;line-height:1.45"><span style="color:${H2.ngoc};font-weight:900">•</span><span>${t}</span></div>`
const hsCuoiNgay = voHs(`
  ${kinh(`<div style="font-size:11px;font-weight:800;color:${H2.phu};letter-spacing:.08em">HÔM NAY EM TIẾN THÊM GÌ · THỨ TƯ 08/10</div><div style="font-weight:900;font-size:18px;margin-top:2px">34 câu · 29 đúng · 2 vi kỹ năng lên</div>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${dong('Cân bằng hệ số: 0,41 → <b>0,78</b> (9 câu, 2 ngày)')}${dong('Tỉ lệ mol ester – NaOH: 0,62 → <b>0,86</b> (7 câu)')}${dong('Thứ Ba em vướng bước cân bằng, hôm nay 3/3 câu nền đúng')}${dong('Sơ ý: 1/24 câu đã vững (4 %) — dưới mức 7 %')}${dong('2 câu đúng nhưng chậm, mai gặp lại dạng tương tự')}</div>`)}
  ${kinh(`${nhan('Chứng chỉ Bài 6 · Sẵn sàng 8+')}<div style="margin-top:6px;font-size:13.5px;line-height:1.45">Độ tin hiện tại <b>71 %</b>, cần 90 %. Còn thiếu: vi kỹ năng <b>Hiệu suất ester hoá</b> (0,71) và <b>3 ý Đúng–sai</b> về tính chất vật lí. Ước <b>2 ngày</b> theo nhịp của em.</div>${thanh(71, H2.xanh, 'rgb(255 255 255 / 0.7)')}
  <div style="margin-top:8px;font-size:12px;color:${H2.phu}">Ca chốt ngày 12/10: 28 câu lạ đúng khung thi, 50 phút.</div>`)}
  ${kinh(`<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:900;font-size:16px">Rương Bát Linh</div><div style="font-size:12.5px;color:${H2.phu}">Xong 40/40 câu hôm nay · +20 vàng · Chuỗi 6 ngày</div></div>${nutHs('Mở rương', H2.vang, H2.nau, 'padding:0 18px;height:40px')}</div>`)}
  ${kinh(`<div style="font-weight:800;font-size:14px">Lời thầy tuần này</div><div style="font-size:13.5px;line-height:1.45;margin-top:4px">Thầy Đỗ Đại Học: tuần này em đóng được 7 lỗi, dạng Tỉ lệ mol ester – NaOH đã vững. Giữ nhịp 20:30 mỗi tối như em đã chọn.</div>`)}
`)

// ---------------------------------------------------------------- vỏ app thầy
const ic = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const I = { ca: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', bang: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', them: '<path d="M12 5v14M5 12h14"/>', cai: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', tich: '<path d="M20 6 9 17l-5-5"/>' }
function voGv(chon, noi) {
  const muc = (k, t) => `<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;border-radius:26px;${k === chon ? `background:${PRIC};color:${ONPRIC};font-weight:800;` : `color:${SUB};font-weight:500;`}font-size:15px">${ic(I[k])}<span>${t}</span></div>`
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0}*{box-sizing:border-box}.so{font-variant-numeric:tabular-nums}</style></head><body>
  <div style="width:1440px;height:900px;display:grid;grid-template-columns:264px 1fr;background:${SC};color:${TXT};font-family:${F};overflow:hidden">
    <div style="display:flex;flex-direction:column;gap:6px;padding:20px 14px">
      <div style="display:flex;align-items:center;gap:12px;padding:4px 10px 18px"><div style="width:40px;height:40px;border-radius:12px;background:${PRI}"></div><div style="line-height:1.15"><div style="font-weight:900;font-size:17px">ĐỖ ĐẠI HỌC</div><div style="font-size:11px;font-weight:800;color:${PRI};letter-spacing:.06em">GIÁO VIÊN</div></div></div>
      <div style="display:flex;align-items:center;gap:10px;height:56px;padding:0 20px;margin-bottom:10px;border-radius:18px;background:${PRI};color:#fff;font-size:15px;font-weight:700">${ic(I.them)}Mở ca kiểm tra</div>
      ${muc('ca', 'Ca kiểm tra')}${muc('bang', 'Lên bảng · Dạy học')}
      <div style="height:1px;margin:10px 12px;background:${LINE}"></div><div style="padding:0 18px;font-size:13px;color:${SUB}">Thêm…</div>
      <div style="padding:0 18px;height:40px;display:flex;align-items:center;color:${SUB};font-size:14px">Học sinh</div><div style="padding:0 18px;height:40px;display:flex;align-items:center;color:${SUB};font-size:14px">Ngân hàng đề</div>
      <div style="margin-top:auto;display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;color:${SUB};font-size:15px">${ic(I.cai)}Cài đặt</div>
    </div>
    <div style="padding:24px 32px;display:flex;flex-direction:column;gap:16px;min-width:0">${noi}</div>
  </div></body></html>`
}
const the = (noi, extra = '') => `<div style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px ${VIEN};padding:18px 20px;${extra}">${noi}</div>`
const chip = (t, bg, fg) => `<span style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:13px;background:${bg};color:${fg};font-size:12px;font-weight:800;white-space:nowrap">${t}</span>`
const nutGv = (t, kieu = 'chinh') => `<span style="display:inline-flex;align-items:center;height:44px;padding:0 22px;border-radius:22px;font-size:14px;font-weight:700;white-space:nowrap;${kieu === 'chinh' ? `background:${PRI};color:#fff` : `box-shadow:inset 0 0 0 1px ${LINE};color:${PRI}`}">${t}</span>`

// ---------------------------------------------------------------- 6. Tick bài
const o = (daTick, t) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;${daTick ? `background:${PRI};color:#fff` : `box-shadow:inset 0 0 0 2px ${LINE}`}">${daTick ? ic(I.tich, 14) : ''}</span><span>${t}</span>`
const bai = (ten, trangThai, mau, tick = false, hienTai = false) => `<div style="display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 14px;border-radius:14px;background:${hienTai ? PRIC : 'transparent'};font-size:14.5px;${hienTai ? 'font-weight:800' : ''}"><div style="display:flex;align-items:center;gap:12px">${o(tick, ten)}</div>${chip(trangThai, mau[0], mau[1])}</div>`
const gvTick = voGv('bang', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-size:26px;font-weight:800">Dạy học · Lớp 12A1 · Bài hôm nay</div><div style="font-size:14px;color:${SUB}">Thứ Hai 06/10 · 44 em · tick bài vừa dạy, app tự giao luyện theo bài. Bài đứng trước bài đã tick là bài cũ ôn lại.</div></div>${chip('Thư mục DẠY HỌC', PRIC, ONPRIC)} </div>
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:16px;min-height:0">
    ${the(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:800;font-size:16px">Khối 12 › Chương 1 · Ester – Lipid</div><span style="font-size:12.5px;color:${SUB}">TU LUYỆN: 231 tờ · chỉ dùng ở Tu luyện và ca kiểm tra</span></div>
      ${bai('Bài 1. Ester', 'Đã dạy 22/09 · chứng chỉ 38/44', [TER, ONTER], true)}${bai('Bài 2. Lipid', 'Đã dạy 24/09 · chứng chỉ 35/44', [TER, ONTER], true)}${bai('Bài 3. Xà phòng và chất giặt rửa', 'Đã dạy 26/09 · chứng chỉ 40/44', [TER, ONTER], true)}
      ${bai('Bài 4. Glucose và fructose', 'Đã dạy 29/09 · chứng chỉ 31/44', [TER, ONTER], true)}${bai('Bài 5. Saccharose và maltose', 'Đang luyện · còn 2 ngày · chứng chỉ 19/44', [WARN, ONWARN], true)}
      ${bai('Bài 6. Tinh bột và cellulose', 'Bài hôm nay', [PRIC, ONPRIC], true, true)}${bai('Bài 7. Amine', 'Chưa dạy · khoá ở mọi kênh tự động', ['#eceff3', SUB])}${bai('Bài 8. Amino acid', 'Chưa dạy', ['#eceff3', SUB])}
      <div style="margin-top:10px;font-size:12.5px;color:${SUB}">Tờ của Bài 6 vào bài luyện: ${chip('Trắc nghiệm 60', PRIC, ONPRIC)} ${chip('Đúng–sai 20', PRIC, ONPRIC)} ${chip('Trả lời ngắn 32', PRIC, ONPRIC)} ${chip('Các dạng toán trọng tâm 20', PRIC, ONPRIC)} ${chip('Ví dụ minh hoạ · không (dùng khi dạy)', '#eceff3', SUB)}</div>`)}
    <div style="display:flex;flex-direction:column;gap:16px">
      ${the(`<div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:${SUB}">XÁC NHẬN TRƯỚC KHI GIAO</div><div style="font-size:20px;font-weight:800;margin-top:4px">Bài 6 · Tinh bột và cellulose</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-top:12px;font-size:14px" class="so">
          <div><div style="color:${SUB};font-size:12px">Câu rút được</div><b>112</b> (bỏ 6 tự luận)</div><div><div style="color:${SUB};font-size:12px">Hạn tự tính</div><b>23:59 Chủ nhật 12/10</b> (7 ngày)</div>
          <div><div style="color:${SUB};font-size:12px">Lớp cần / sức chứa</div><b>224 / 280 lượt</b> (80 %)</div><div><div style="color:${SUB};font-size:12px">Thể lực</div><b>40 lượt/ngày</b> (mặc định lớp)</div>
          <div><div style="color:${SUB};font-size:12px">Đủ lượt để luyện hết</div><b>41/44 em</b></div><div><div style="color:${SUB};font-size:12px">Đủ lượt để ca chốt ≥ 8</div><b>29/44 em</b></div>
        </div>
        <div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:${WARN};color:${ONWARN};font-size:13px">3 em quá tải (Huyết Chiến từ ngày 1): Minh, Hà, Phúc. Gợi ý: lùi hạn tới Thứ Ba 14/10 hoặc thể lực 50.</div>
        <div style="display:flex;gap:10px;margin-top:14px">${nutGv('Giao Bài 6 cho 12A1')}${nutGv('Sửa hạn hoặc thể lực', 'vien')}</div>`)}
      ${the(`<div style="font-weight:800;font-size:15px">Sau khi giao, app tự làm</div><div style="font-size:13.5px;color:${SUB};line-height:1.5;margin-top:6px">Mỗi em 40 lượt/ngày: nợ đến lịch → câu mới theo điểm còn lấy được → củng cố → ôn bài cũ. Trạm hồi phục khi sai 3 câu liền. Ngày 6 đề thử nửa. Ngày 7 ca chốt 28 câu lạ. Em chưa đạt kéo dài riêng; hạn lớp không đổi. Thầy chỉ còn việc: <b>chữa danh sách "Cần thầy chữa"</b>.</div>`)}
    </div>
  </div>
`)

// ---------------------------------------------------------------- 7. Bảng bài (lưới P, khoảng cách tới 8, cần thầy chữa)
const DANG = ['Danh pháp', 'Tính chất vật lí', 'Thuỷ phân', 'Ester hoá', 'Hiệu suất', 'Chỉ số acid', 'Đốt cháy', 'Hỗn hợp', 'Nhận biết']
const mauP = (p) => p >= 0.95 ? ['#146c2e', '#fff'] : p >= 0.8 ? [TER, ONTER] : p >= 0.5 ? [WARN, ONWARN] : [ERR, ONERR]
const oP = (p, n) => { const [bg, fg] = mauP(p); return `<div class="so" style="margin:3px 2px;height:38px;border-radius:8px;background:${bg};color:${fg};display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12.5px;font-weight:800;line-height:1.1;white-space:nowrap">${p.toFixed(2)}<span style="font-size:9.5px;font-weight:600;opacity:.85">${n} câu</span></div>` }
const hang = (ten, ps, s, kc, dot = '') => `<div style="display:grid;grid-template-columns:140px repeat(9,1fr) 70px 150px;align-items:center;border-bottom:1px solid ${VIEN};min-height:44px;font-size:13.5px"><span style="font-weight:700">${ten}</span>${ps.map(([p, n]) => oP(p, n)).join('')}<span class="so" style="text-align:center;font-weight:800;color:${s > 7 ? ONERR : ONTER}">${s} %</span><span style="padding-left:8px;font-size:12.5px">${kc}${dot}</span></div>`
const gvBang = voGv('bang', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-size:26px;font-weight:800">Bảng bài · Bài 6 · Tinh bột và cellulose · 12A1</div><div style="font-size:14px;color:${SUB}">Còn 5 ngày (tới 23:59 Chủ nhật 12/10) · ô = P nắm dạng kèm số câu tự làm · Sơ ý = tỉ lệ sai khi đã vững · Khoảng cách tới 8 chỉ thầy thấy (đang hiệu chỉnh: 2/3 ca chốt)</div></div><div style="display:flex;gap:8px">${chip('P ≥ 0,95 vững', '#146c2e', '#fff')}${chip('0,80–0,95', TER, ONTER)}${chip('0,50–0,80', WARN, ONWARN)}${chip('< 0,50', ERR, ONERR)}</div></div>
  <div style="display:grid;grid-template-columns:1fr 360px;gap:16px;min-height:0">
    ${the(`<div style="display:grid;grid-template-columns:140px repeat(9,1fr) 70px 150px;font-size:11px;font-weight:800;color:${SUB};letter-spacing:.04em;padding-bottom:6px"><span>EM</span>${DANG.map((d) => `<span style="text-align:center;padding:0 2px">${d}</span>`).join('')}<span style="text-align:center">SƠ Ý</span><span style="padding-left:8px">KHOẢNG CÁCH TỚI 8</span></div>
      ${hang('Nguyễn An', [[0.97, 11], [0.96, 9], [0.95, 12], [0.91, 8], [0.88, 7], [0.96, 6], [0.93, 7], [0.84, 5], [0.97, 6]], 4, '<b>0,0</b> · sẵn sàng 92 %')}
      ${hang('Trần Bình', [[0.95, 10], [0.88, 8], [0.78, 9], [0.62, 7], [0.41, 6], [0.9, 5], [0.86, 6], [0.55, 4], [0.93, 6]], 6, '<b>1,1</b> · Hiệu suất kéo nhiều nhất')}
      ${hang('Lê Chi', [[0.96, 10], [0.94, 8], [0.9, 9], [0.86, 7], [0.83, 6], [0.92, 5], [0.9, 6], [0.8, 4], [0.95, 6]], 11, '<b>0,6</b> · <span style="color:${ONERR};font-weight:800">sơ ý 11 %</span>')}
      ${hang('Phạm Dũng', [[0.72, 9], [0.65, 7], [0.44, 8], [0.31, 6], [0.28, 5], [0.6, 4], [0.52, 5], [0.3, 3], [0.7, 5]], 8, '<b>3,4</b> · Huyết Chiến · cần 12 ngày')}
      ${hang('Hoàng Em', [[0.93, 9], [0.9, 8], [0.87, 9], [0.8, 7], [0.76, 6], [0.9, 5], [0.88, 6], [0.7, 4], [0.92, 6]], 5, '<b>0,8</b> · 2 dạng cần vững')}
      ${hang('Vũ Giang', [[0.98, 11], [0.97, 9], [0.96, 12], [0.95, 8], [0.95, 7], [0.97, 6], [0.96, 7], [0.92, 5], [0.98, 6]], 3, '<b>0,0</b> · sẵn sàng 95 %')}
      ${hang('Đỗ Hà', [[0.85, 8], [0.7, 6], [0.5, 7], [0.42, 6], [0.35, 4], [0.7, 4], [0.6, 5], [0.4, 3], [0.8, 5]], 9, '<b>2,6</b> · Huyết Chiến')}
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;font-size:13px;color:${SUB}">Bấm một ô: ${chip('Thầy xác nhận em đã vững', TER, ONTER)} ${chip('Chưa đạt, dạy lại', ERR, ONERR)} <span>— ghi sổ, phát lại được</span></div>`)}
    <div style="display:flex;flex-direction:column;gap:16px">
      ${the(`<div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:${SUB}">CẦN THẦY CHỮA · BƯỚC CUỐI CỦA THẦY</div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
          <div style="padding:12px;border-radius:12px;background:${ERR};color:${ONERR}"><div style="font-weight:800">Vi kỹ năng: Hệ số NaOH với ester của phenol</div><div style="font-size:12.5px">9 em · đã qua thang tự gỡ · 3 thẻ nút thắt</div><div style="margin-top:8px">${nutGv('Chữa xong', 'vien')}</div></div>
          <div style="padding:12px;border-radius:12px;background:${WARN};color:${ONWARN}"><div style="font-weight:800">Câu 17 · Hiệu suất ester hoá</div><div style="font-size:12.5px">6 em sai ≥ 4 lần · đã rời kế hoạch</div></div>
          <div style="padding:12px;border-radius:12px;background:${WARN};color:${ONWARN}"><div style="font-weight:800">Sơ ý cao: Lê Chi (11 %), Đỗ Hà (9 %)</div><div style="font-size:12.5px">Kiến thức vững nhưng sai khi chắc · gợi ý: nhắc soát lại trước khi nộp</div></div>
        </div>`)}
      ${the(`<div style="font-weight:800;font-size:15px">Buổi chữa Thứ Hai 13/10 · đã xếp sẵn</div><div style="font-size:13.5px;color:${SUB};line-height:1.5;margin-top:6px">90 phút · 7 câu đại diện theo vi kỹ năng · mỗi em có mặt ≥ 1 lượt · ca chốt 28 câu lạ sau buổi chữa.</div><div style="margin-top:10px">${nutGv('Mở buổi chữa', 'vien')}</div>`)}
    </div>
  </div>
`)

// ---------------------------------------------------------------- 8. Phụ huynh
const NEN_PH = '#f7f9fc'
const thePh = (noi) => `<div style="border-radius:20px;background:#fff;box-shadow:inset 0 0 0 1px ${VIEN};padding:16px">${noi}</div>`
const phTienDo = voHs(`
  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:${SUB}">TIẾN ĐỘ CỦA CON · MINH · LỚP 12A1</div>
  ${thePh(`<div style="font-size:12px;color:${SUB}">Bài đang luyện</div><div style="font-weight:800;font-size:18px">Bài 6 · Tinh bột và cellulose</div><div style="font-size:13px;color:${SUB}">Hạn: còn 5 ngày (tới 23:59 Chủ nhật 12/10) · hôm nay con đã làm 34/40 câu</div>`)}
  ${thePh(`<div style="font-size:12px;color:${SUB}">Khoảng cách tới 8</div><div style="font-weight:800;font-size:28px;color:${PRI}" class="so">Còn 1,1 điểm</div><div style="font-size:13.5px;line-height:1.45">2 dạng cần vững: <b>Hiệu suất ester hoá</b>, <b>Hỗn hợp ester</b>. Con làm đúng khi chắc 94 % (sơ ý 6 %). Theo nhịp hiện tại, dự kiến sẵn sàng trong <b>2 ngày</b>.</div>`)}
  ${thePh(`<div style="font-size:12px;color:${SUB}">Chứng chỉ gần nhất</div><div style="font-weight:800;font-size:16px;color:${ONTER}">✓ Bài 5 · Sẵn sàng 8+ · độ tin 91 %</div><div style="font-size:13px;color:${SUB}">Kiểm bằng 28 câu lạ ngày 05/10 · điểm 8,5</div>`)}
  ${thePh(`<div style="display:flex;justify-content:space-between"><div><div style="font-size:12px;color:${SUB}">Chuỗi ngày</div><div style="font-weight:800;font-size:18px">6 ngày</div></div><div><div style="font-size:12px;color:${SUB}">Giờ học con chọn</div><div style="font-weight:800;font-size:18px">20:30</div></div><div><div style="font-size:12px;color:${SUB}">Cần thầy chữa</div><div style="font-weight:800;font-size:18px">1 chỗ</div></div></div>`)}
  ${thePh(`<div style="font-size:12px;color:${SUB}">Lời thầy tuần này</div><div style="font-size:13.5px;line-height:1.5;margin-top:4px">Thầy Đỗ Đại Học: tuần này con đóng được 7 lỗi, dạng Tỉ lệ mol ester – NaOH đã vững. Còn vướng bước hệ số NaOH với ester của phenol, thầy chữa trên lớp Thứ Hai.</div>`)}
  <div style="font-size:12px;color:${SUB};text-align:center;margin-top:auto;padding-bottom:12px">Hôm nay · Điểm số · Tiến bộ · Lời thầy</div>
`, NEN_PH, TXT)

// ---------------------------------------------------------------- chụp
const MAN = [
  ['HS-Sanh', hsSanh, 390, 844], ['HS-CauHoi-ChacChuaChac', hsCau, 390, 844], ['HS-KetQua-DungNhungCham', hsKetQua, 390, 844], ['HS-TramHoiPhuc', hsTram, 390, 844], ['HS-CuoiNgay-ChungChi', hsCuoiNgay, 390, 844],
  ['GV-TickBai', gvTick, 1440, 900], ['GV-BangBai', gvBang, 1440, 900], ['PH-TienDo', phTienDo, 390, 844],
]
for (const [ten, html, w, h] of MAN) {
  const htmlPath = path.join(D, `${ten}.html`), png = path.join(D, `${ten}.png`), jpg = path.join(D, `${ten}.jpg`)
  fs.writeFileSync(htmlPath, html)
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--window-size=${w},${h}`, `--screenshot=${png}`, `file://${htmlPath}`], { stdio: 'ignore' })
  let q = 88
  for (;;) { execFileSync('convert', [png, '-quality', String(q), jpg]); if (fs.statSync(jpg).size <= 150 * 1024 || q <= 50) break; q -= 8 }
  fs.unlinkSync(png)
  console.log(`${ten}.jpg · ${(fs.statSync(jpg).size / 1024).toFixed(0)} KB · chất lượng ${q}`)
}
