#!/usr/bin/env node
// SINH BẢN VẼ thẻ "ĐƯỜNG VỀ ĐÍCH" — DE-XUAT-DON-VE-DICH-2109.md (Điều 2 + Điều 3). CHỈ LÀ MẪU VẼ: không đụng mã chạy thật.
//   node docs/ban-ve-don-ve-dich-2109/sinh-ban-ve.mjs          ghi HTML tĩnh tự chứa vào thư mục này
//   node docs/ban-ve-don-ve-dich-2109/sinh-ban-ve.mjs --anh    thêm: chụp Chromium (cách chụp lấy từ docs/ban-ve-thi-dua-2109/sinh-ban-ve.mjs) — mỗi trạng thái 390 sáng;
//                                                              trạng thái 1, 2 thêm 390 tối; trạng thái 1 thêm 1440 sáng. JPG ≤ 150 KB vào ./anh/. Tự đo: tràn ngang, đích chạm < 48, tương phản < 4,5:1, chiều cao thẻ.
// Dữ liệu và tên là GIẢ. Màu đọc từ tokens.css + m3-theme.css của app. Bài: "Ester – Lipid", 5 chặng (Chủ Nhật 20/09 → Thứ Năm 24/09), Hạn nộp 12:00 · Thứ Sáu 25/09/2026.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const CSS = [doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'don-ve-dich.css'), 'utf8')].join('\n')

const IC = {
  tich: '<path d="M20 6 9 17l-5-5"/>',
  lo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  co: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  dongho: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  trang: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  matTroi: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  toi: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  phai: '<path d="m9 18 6-6-6-6"/>',
  xuong: '<path d="m6 9 6 6 6-6"/>',
  len: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  muc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  tin: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  lua: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  thu: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  sach: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  on: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
}
const ic = (t, cls = '') => `<svg class="vd-i ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${IC[t]}</svg>`

const trang = ({ tieuDe, body }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="m3 vd">${body}</body></html>`

// ── thành phần ────────────────────────────────────────────────────
const BAI = 'Ester – Lipid'
const chao = (ngayGio) => `<header class="vd-chao"><div class="vd-chao__chu"><p class="vd-chao__ngay vd-so">${ngayGio}</p><h1>Chào Minh</h1><p class="vd-chuoi">${ic('lua')}<span class="vd-so">Chuỗi 5 ngày</span></p></div>
  <div class="vd-thu" role="group" aria-label="Thần thú của em: Lửa Nhỏ"><i aria-hidden="true">${ic('thu')}</i><span>Thần thú của em: Lửa Nhỏ</span></div></header>`

const dauThe = () => `<div class="vd-dau"><p class="vd-dau__nhan">Đường về đích · Bài tập về nhà</p><h2 id="vd-t">${BAI}</h2></div>`

/** Đồng hồ đếm ngược — điểm nhấn của thẻ. `gap` ⇒ nền cam đậm (nợ nhiều ngày, vẫn CHƯA dùng đỏ vì còn > 6 giờ). */
const dongHo = ({ gio, phut, gap = false, ngayChu = 'Thứ Sáu' }) => `<div class="vd-dh${gap ? ' vd-dh--gap' : ''}" role="timer" aria-label="Còn ${gio} giờ ${phut} phút tới Hạn nộp 12:00 ${ngayChu} 25/09/2026">
  <div aria-hidden="true"><span class="vd-dh__con">Còn</span><p class="vd-dh__so"><b>${gio}</b>giờ <b>${phut}</b>phút</p></div>
  <p class="vd-dh__han vd-so" aria-hidden="true"><span>${ic('co')}Hạn nộp</span>12:00 · ${ngayChu}<br>25/09/2026</p></div>`

/** Đường chặng: `ds` = 5 mốc {loai: xong|vua|no|nay|toi, tt: chữ trạng thái}. Trạng thái KHÔNG chỉ bằng màu: mỗi loại có biểu tượng/cỡ riêng + chữ dưới mốc. */
const duong = (ds, { dich = 'Thứ Sáu' } = {}) => {
  const xongToi = ds.reduce((m, c, i) => (c.loai === 'xong' || c.loai === 'vua' ? i : m), 0)
  const nay = ds.findIndex((c) => c.loai === 'nay')
  const coNo = ds.some((c) => c.loai === 'no') // đoạn gạch đứt cam CHỈ vẽ khi còn mốc của ngày trước
  const doc = { xong: 'đã xong', vua: 'vừa xong', no: 'còn lại từ', nay: 'của hôm nay', toi: 'sắp tới,' }
  const moc = ds
    .map((c, i) => {
      const trong = c.loai === 'xong' || c.loai === 'vua' ? ic('tich') : c.loai === 'no' ? ic('lo') : String(i + 1)
      const nhan = c.loai === 'no' ? `Chặng ${i + 1}: ${doc.no} ${c.tt}` : c.loai === 'toi' ? `Chặng ${i + 1}: ${doc.toi} ${c.tt}` : `Chặng ${i + 1}: ${doc[c.loai]}`
      return `<li class="vd-moc vd-moc--${c.loai === 'vua' ? 'xong vd-moc--vua' : c.loai}" aria-label="${nhan}"><span class="vd-moc__o" aria-hidden="true"><span class="vd-moc__tron">${trong}</span></span><span class="vd-moc__ten vd-so" aria-hidden="true">Chặng ${i + 1}</span><span class="vd-moc__tt" aria-hidden="true">${c.tt}</span></li>`
    })
    .join('')
  return `<ol class="vd-duong" aria-label="Đường ${ds.length} chặng tới Hạn nộp"><li class="vd-duong__day" aria-hidden="true"><i class="vd-day--xong" style="left:0;width:${xongToi * 20}%"></i>${coNo && nay > xongToi ? `<i class="vd-day--no" style="left:${xongToi * 20}%;width:${(nay - xongToi) * 20}%"></i>` : ''}</li>${moc}
    <li class="vd-moc vd-moc--dich" aria-label="Đích: Hạn nộp 12:00 ${dich}"><span class="vd-moc__o" aria-hidden="true"><span class="vd-moc__tron">${ic('co')}</span></span><span class="vd-moc__ten" aria-hidden="true">Hạn nộp</span><span class="vd-moc__tt vd-so" aria-hidden="true">${dich}</span></li></ol>`
}
const keHoach = (dong) => `<div class="vd-kh" data-vung="ke-hoach">${dong.map((d) => `<p class="vd-kh__dong vd-so">${ic(d.ic)}<b>${d.chinh}</b>${d.phu ? `<small>${d.phu}</small>` : ''}</p>`).join('')}</div>`
const nut = (chu) => `<button class="vd-nut" type="button">${chu}${ic('toi')}</button>`
const hich = (ds) => `<ul class="vd-hich" aria-label="Em sắp đạt">${ds.map(([i, c]) => `<li class="vd-so">${ic(i)}<span>${c}</span></li>`).join('')}</ul>`

/** Khối "Còn lại từ các ngày trước": xếp theo NGÀY, mỗi món một dòng có số câu + phút, chạm là vào làm. */
const dongNo = ({ ngay, bieu, chinh, phu, xong = false }) => `<li><button class="vd-dong${xong ? ' vd-dong--xong' : ''}" type="button" aria-label="${ngay} · ${chinh} · ${phu}${xong ? ' · đã xong' : ' — chạm để làm'}"><i aria-hidden="true">${ic(xong ? 'tich' : bieu)}</i><span class="vd-dong__chu vd-so"><b>${chinh}</b><small>${phu}</small></span>${ic(xong ? 'tich' : 'phai')}</button></li>`
const khoiTruoc = ({ tong, ngay }) => `<section class="vd-khoi" aria-labelledby="vd-truoc-t" data-vung="ngay-truoc">
  <div class="vd-muc" style="--vd-cham:var(--cam)"><h2 id="vd-truoc-t"><i aria-hidden="true"></i>Còn lại từ các ngày trước</h2><span class="vd-so">${tong}</span></div>
  ${ngay.map((n) => `<div class="vd-ngay${n.xong ? ' vd-ngay--xong' : ''}" role="group" aria-label="${n.ten}${n.xong ? ' — đã trả xong' : ''}"><h3 class="vd-ngay__ten vd-so">${ic(n.xong ? 'tich' : 'lo')}<span>${n.ten}</span>${n.ghi ? `<small>· ${n.ghi}</small>` : ''}</h3><ul style="display:grid;gap:6px">${n.mon.map((m) => dongNo({ ...m, ngay: n.ten })).join('')}</ul></div>`).join('\n  ')}</section>`

const viecHomNay = (ds, ghi = '3 việc') => `<section class="vd-khoi" aria-labelledby="vd-viec-t" data-vung="viec-hom-nay">
  <div class="vd-muc"><h2 id="vd-viec-t"><i aria-hidden="true"></i>Việc hôm nay</h2><span class="vd-so">${ghi}</span></div>
  ${ds.map((v, i) => `<button class="vd-viec vd-viec--${Math.min(i + 1, 3)}" type="button"><i aria-hidden="true">${ic(v.ic)}</i><span class="vd-so"><b>${v.chinh}</b><small>${v.phu}</small></span><em>${v.chip}</em></button>`).join('\n  ')}</section>`
const VIEC_ON = { ic: 'on', chinh: 'Ôn lại · 6 câu đến lịch', phu: 'Khoảng 7 phút', chip: 'Chưa làm' }
const VIEC_THU = { ic: 'thu', chinh: 'Đảo thần thú', phu: '1 chuyến thám hiểm · 6 ải · không bắt buộc', chip: 'Tự chọn' }
const ghiChu = (t) => `<p class="vd-ghi-chu">${t}</p>`

// ── bốn trạng thái ─────────────────────────────────────────────────
const P = {}

P['vd-1-no-mot-chang'] = () => trang({ tieuDe: 'Đường về đích · còn lại 1 chặng của Thứ Hai', body: `<main class="vd-trang">
  <div class="vd-cot">${chao('Thứ Ba 22/09/2026 · 19:05')}
  <section class="vd-the" aria-labelledby="vd-t" data-vung="duong-ve-dich">
    ${dauThe()}
    ${dongHo({ gio: 64, phut: 55 })}
    ${duong([{ loai: 'xong', tt: 'Đã xong' }, { loai: 'no', tt: 'Thứ Hai' }, { loai: 'nay', tt: 'Hôm nay' }, { loai: 'toi', tt: 'Thứ Tư' }, { loai: 'toi', tt: 'Thứ Năm' }])}
    ${keHoach([{ ic: 'trang', chinh: 'Tối nay: 2 chặng · 24 câu', phu: 'Khoảng 36 phút · bắt đầu muộn nhất <b>21:30</b>' }])}
    ${nut('Làm chặng 2 ngay')}
    ${hich([['len', 'Xong 2 chặng tối nay là em về <b>đúng nhịp</b>'], ['muc', 'Còn 2 việc nữa là hôm nay <b>ĐẠT</b>']])}
  </section></div>
  <div class="vd-cot vd-cot--phai">
  ${khoiTruoc({ tong: '2 việc', ngay: [{ ten: 'Thứ Hai 21/09', ghi: 'khoảng 24 phút', mon: [
    { bieu: 'sach', chinh: 'Chặng 2 · 12 câu', phu: `${BAI} · khoảng 18 phút` },
    { bieu: 'on', chinh: '5 câu ôn lại đã quá lịch', phu: 'Khoảng 6 phút' }] }] })}
  ${viecHomNay([{ ic: 'sach', chinh: `Chặng 3 · ${BAI}`, phu: 'Bài tập về nhà · 12 câu · mở ngay sau chặng 2', chip: 'Chưa mở' }, VIEC_ON, VIEC_THU])}
  </div>
  ${ghiChu('<b>MẪU 1 · còn lại MỘT chặng.</b> Thứ Ba 22/09/2026, 19:05. Thẻ nằm ngay dưới lời chào; đồng hồ đếm ngược là điểm nhấn và LUÔN hiện khi em còn việc của ngày trước. Bốn loại mốc khác nhau bằng biểu tượng + cỡ + chữ, không chỉ bằng màu. Cả màn chỉ MỘT nút chính. Chưa dùng màu đỏ (chỉ dùng trong 6 giờ cuối). Dữ liệu giả; chưa build.')}</main>` })

P['vd-2-no-nhieu-ngay'] = () => trang({ tieuDe: 'Đường về đích · còn lại 3 ngày', body: `<main class="vd-trang">
  <div class="vd-cot">${chao('Thứ Năm 24/09/2026 · 20:10')}
  <section class="vd-the vd-the--gap" aria-labelledby="vd-t" data-vung="duong-ve-dich">
    ${dauThe()}
    ${dongHo({ gio: 15, phut: 50, gap: true, ngayChu: 'Thứ Sáu' })}
    ${duong([{ loai: 'xong', tt: 'Đã xong' }, { loai: 'no', tt: 'Thứ Hai' }, { loai: 'no', tt: 'Thứ Ba' }, { loai: 'no', tt: 'Thứ Tư' }, { loai: 'nay', tt: 'Hôm nay' }], { dich: 'Ngày mai' })}
    ${keHoach([
      { ic: 'trang', chinh: 'Tối nay: 2 chặng · 26 câu', phu: 'Khoảng 40 phút · bắt đầu muộn nhất <b>21:20</b>' },
      { ic: 'matTroi', chinh: 'Sáng mai trước 12:00: 2 chặng · 22 câu' }])}
    <p class="vd-noi-that vd-so">${ic('tin')}<span>A.I Đỗ Đại Học đã rút phần làm thêm để em kịp hạn; phần lõi còn <b>48 câu</b>.</span></p>
    ${nut('Làm chặng 2 ngay')}
    ${hich([['len', 'Từng chặng một: xong 2 chặng tối nay là em <b>vẫn kịp Hạn nộp</b>']])}
  </section></div>
  <div class="vd-cot vd-cot--phai">
  ${khoiTruoc({ tong: '3 chặng · 37 câu', ngay: [
    { ten: 'Thứ Hai 21/09', ghi: 'làm tối nay', mon: [{ bieu: 'sach', chinh: 'Chặng 2 · 12 câu', phu: `${BAI} · khoảng 18 phút` }] },
    { ten: 'Thứ Ba 22/09', ghi: 'làm tối nay', mon: [{ bieu: 'sach', chinh: 'Chặng 3 · 14 câu', phu: `${BAI} · khoảng 22 phút` }] },
    { ten: 'Thứ Tư 23/09', ghi: 'làm sáng mai', mon: [{ bieu: 'sach', chinh: 'Chặng 4 · 11 câu', phu: `${BAI} · khoảng 16 phút` }] }] })}
  ${viecHomNay([{ ic: 'sach', chinh: `Chặng 5 · ${BAI}`, phu: 'Bài tập về nhà · 11 câu · mở ngay sau chặng 4', chip: 'Chưa mở' }, VIEC_ON], '2 việc')}
  </div>
  ${ghiChu('<b>MẪU 2 · còn lại BA ngày.</b> Thứ Năm 24/09/2026, 20:10, còn 15 giờ 50 phút. Cảnh báo mạnh hơn (đồng hồ nền cam đậm, thẻ viền cam) nhưng giọng vẫn nâng đỡ: không mắng, không chữ chê. Kế hoạch chia 2 buổi đúng trần 2 chặng / 30 câu / 60 phút mỗi buổi; 26 + 22 = 48 câu phần lõi. Dòng nói thật dùng chủ ngữ "A.I Đỗ Đại Học". Vẫn chưa dùng màu đỏ vì còn hơn 6 giờ.')}</main>` })

P['vd-3-dung-nhip'] = () => trang({ tieuDe: 'Đường về đích · em đang đúng nhịp', body: `<main class="vd-trang">
  <div class="vd-cot">${chao('Thứ Ba 22/09/2026 · 19:05')}
  <button class="vd-nhip" type="button" data-vung="duong-ve-dich" aria-expanded="false" aria-label="Em đang đúng nhịp · Bài tập về nhà ${BAI} · chặng 3 trong 5 · Hạn nộp 12:00 Thứ Sáu 25/09. Chạm để xem cả đường về đích">
    <i aria-hidden="true">${ic('tich')}</i>
    <span class="vd-nhip__chu vd-so" aria-hidden="true"><b>Em đang đúng nhịp</b><small>Chặng 3 trong 5 · Hạn nộp 12:00 Thứ Sáu</small></span>
    ${ic('xuong')}
    <span class="vd-nho" aria-hidden="true"><i class="vd-nho--xong"></i><i class="vd-nho--xong"></i><i class="vd-nho--nay"></i><i></i><i></i>${ic('co')}</span>
  </button></div>
  <div class="vd-cot vd-cot--phai">
  ${viecHomNay([{ ic: 'sach', chinh: `Chặng 3 · ${BAI}`, phu: 'Bài tập về nhà · 12 câu · khoảng 18 phút', chip: 'Chưa làm' }, VIEC_ON, VIEC_THU])}
  </div>
  ${ghiChu('<b>MẪU 3 · ĐÚNG NHỊP.</b> Không còn việc của ngày trước ⇒ thẻ thu lại thành MỘT dòng xanh (cao dưới 96 px), không đồng hồ đếm ngược, nhường chỗ cho "Việc hôm nay". Đường chặng nhỏ: chấm đặc = đã xong, chấm to có vòng = hôm nay, chấm rỗng = sắp tới, cờ = Hạn nộp. Chạm vào dòng là mở cả đường.')}</main>` })

P['vd-4-vua-tra-no'] = () => trang({ tieuDe: 'Đường về đích · em vừa trả xong phần của Thứ Hai', body: `<main class="vd-trang">
  <div class="vd-cot">${chao('Thứ Ba 22/09/2026 · 19:29')}
  <section class="vd-the" aria-labelledby="vd-t" data-vung="duong-ve-dich">
    ${dauThe()}
    <div class="vd-mung" role="status" aria-live="polite"><i aria-hidden="true">${ic('tich')}</i><div><h3>Em vừa trả xong phần của Thứ Hai.</h3><p class="vd-so">Chặng 3 của hôm nay đã mở — khoảng 18 phút.</p></div></div>
    ${duong([{ loai: 'xong', tt: 'Đã xong' }, { loai: 'vua', tt: 'Vừa xong' }, { loai: 'nay', tt: 'Hôm nay' }, { loai: 'toi', tt: 'Thứ Tư' }, { loai: 'toi', tt: 'Thứ Năm' }])}
    <p class="vd-dh vd-dh--nhe vd-so" role="timer">${ic('co')}<span>Hạn nộp <b>12:00 · Thứ Sáu 25/09/2026</b> · còn <b>64 giờ 31 phút</b></span></p>
    ${nut('Làm chặng 3')}
    ${hich([['muc', 'Còn 1 việc nữa là hôm nay <b>ĐẠT</b>']])}
  </section></div>
  <div class="vd-cot vd-cot--phai">
  ${khoiTruoc({ tong: 'Đã trả xong', ngay: [{ ten: 'Thứ Hai 21/09', ghi: 'đã xong lúc 19:29', xong: true, mon: [
    { bieu: 'sach', chinh: 'Chặng 2 · 12 câu', phu: 'Đã xong · đúng 10 trong 12 câu', xong: true },
    { bieu: 'on', chinh: '5 câu ôn lại đã quá lịch', phu: 'Đã xong', xong: true }] }] })}
  ${viecHomNay([{ ic: 'sach', chinh: `Chặng 3 · ${BAI}`, phu: 'Bài tập về nhà · 12 câu · khoảng 18 phút', chip: 'Đã mở' }, VIEC_ON, VIEC_THU])}
  </div>
  ${ghiChu('<b>MẪU 4 · VỪA TRẢ XONG.</b> 19:29, ngay sau khi em làm xong phần của Thứ Hai: mốc cam đổi thành xanh có dấu tích (quầng toả một lần), tên ngày "Thứ Hai 21/09" và từng món bị gạch bằng hoạt ảnh 250 ms (tắt khi máy bật giảm chuyển động), chặng 3 mở NGAY. Đồng hồ lùi về một dòng nhỏ vì em không còn việc của ngày trước. Khối đã gạch tự ẩn ở lần mở sau.')}</main>` })

P.index = () => trang({ tieuDe: 'Bản vẽ thẻ "Đường về đích"', body: `<main class="vd-trang" style="display:flex"><p class="vd-ghi-chu"><b>Bản vẽ thẻ "Đường về đích"</b> (đề xuất Dồn về đích, Điều 2 + 3). Dữ liệu giả; chưa build. Mở từng trang; đổi sáng/tối theo máy.</p><div class="vd-hub">
  <a href="vd-1-no-mot-chang.html"><b>1 · Còn lại một chặng</b><span>Đồng hồ "Còn 64 giờ 55 phút", đường 5 mốc, kế hoạch tối nay, một nút "Làm chặng 2 ngay".</span></a>
  <a href="vd-2-no-nhieu-ngay.html"><b>2 · Còn lại ba ngày</b><span>Còn 15 giờ 50 phút; kế hoạch tối nay + sáng mai; dòng nói thật của A.I Đỗ Đại Học.</span></a>
  <a href="vd-3-dung-nhip.html"><b>3 · Đúng nhịp</b><span>Thẻ thu thành một dòng xanh + đường chặng nhỏ.</span></a>
  <a href="vd-4-vua-tra-no.html"><b>4 · Vừa trả xong</b><span>Mốc cam thành xanh, gạch "Thứ Hai 21/09", nút "Làm chặng 3".</span></a></div></main>` })

for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
console.log(`đã ghi ${Object.keys(P).length} trang HTML vào ${AQUI}`)

// ── chụp ảnh + tự đo ──────────────────────────────────────────────
if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  const TRAN = 150 * 1024
  // Phông Be Vietnam Pro lấy từ node_modules (@fontsource) nhúng base64 CHỈ lúc chụp ⇒ ảnh đúng phông mà không cần mạng; thiếu gói thì rơi về phông hệ thống.
  const THU_PHONG = join(GOC, 'node_modules', '@fontsource', 'be-vietnam-pro', 'files')
  const PHONG = [400, 500, 600, 700, 800]
    .flatMap((w) => ['vietnamese', 'latin-ext', 'latin'].map((bo) => [w, bo, join(THU_PHONG, `be-vietnam-pro-${bo}-${w}-normal.woff2`)]))
    .filter(([, , p]) => existsSync(p))
    .map(([w, bo, p]) => `@font-face{font-family:'Be Vietnam Pro';font-style:normal;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(p).toString('base64')}) format('woff2');unicode-range:${bo === 'vietnamese' ? 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB' : bo === 'latin-ext' ? 'U+0100-0101,U+0104-010F,U+0112-0127,U+012A-0167,U+016A-019F,U+01A2-01AE,U+01B1-02AF,U+1E00-1E9F,U+2020,U+20A0-20AA,U+20AC-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF' : 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'}}`)
    .join('\n')
  const browser = await chromium.launch()
  let xau = 0
  for (const ten of Object.keys(P)) {
    if (ten === 'index') continue
    const cauHinh = [[390, 844, false], ...(/^vd-[12]-/.test(ten) ? [[390, 844, true]] : []), ...(ten.startsWith('vd-1-') ? [[1440, 900, false]] : [])]
    for (const [w, h, toi] of cauHinh) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: 1, reducedMotion: 'reduce' })
      const tr = await ctx.newPage()
      const loi = []
      tr.on('pageerror', (e) => loi.push(String(e)))
      await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort())
      await tr.goto('file://' + join(AQUI, `${ten}.html`), { waitUntil: 'load' })
      if (PHONG) await tr.addStyleTag({ content: PHONG })
      await tr.evaluate(() => document.fonts.ready)
      await tr.waitForTimeout(300)
      const kt = await tr.evaluate(() => {
        const so = (s) => { let m = s.match(/^rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] } m = s.match(/^color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] } return [0, 0, 0, 0] }
        const tron = (tren, duoi) => { const a = tren[3]; return [0, 1, 2].map((i) => tren[i] * a + duoi[i] * (1 - a)).concat(1) }
        const sang = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
        const nenCua = (e) => { const lop = []; for (let x = e; x; x = x.parentElement) { const c = so(getComputedStyle(x).backgroundColor); if (c[3] > 0) { lop.push(c); if (c[3] >= 1) break } } let n = so(getComputedStyle(document.body).backgroundColor); for (const c of lop.reverse()) n = tron(c, n); return n }
        const kem = []
        for (const e of document.querySelectorAll('body *')) {
          if (e.closest('.vd-sr') || !e.getClientRects().length) continue
          if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
          const cs = getComputedStyle(e), nen = nenCua(e), chu = tron(so(cs.color), nen)
          const a = sang(chu), b = sang(nen), ti = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
          const co = parseFloat(cs.fontSize), lon = co >= 24 || (co >= 18.66 && +cs.fontWeight >= 700)
          if (ti < (lon ? 3 : 4.5)) kem.push(`${e.textContent.trim().slice(0, 28)} → ${ti.toFixed(2)}`)
        }
        const cao = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().height) : 0 }
        const dinh = (q) => { const e = document.querySelector(q); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : 0 }
        return {
          cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth,
          nho: [...document.querySelectorAll('button,a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 47.5 }).length,
          chuNho: [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).length,
          nhanTran: [...document.querySelectorAll('.vd-moc__ten,.vd-moc__tt,.vd-dh__han')].filter((e) => e.scrollWidth > e.clientWidth + 0.5).length,
          kem, the: cao('[data-vung="duong-ve-dich"]'), viec: dinh('[data-vung="viec-hom-nay"]'), phong: document.fonts.check('700 15px "Be Vietnam Pro"'),
        }
      })
      let ghi = 0
      for (const q of [82, 72, 62, 52, 44, 36]) {
        const buf = await tr.screenshot({ type: 'jpeg', quality: q, fullPage: true })
        if (buf.length <= TRAN) { writeFileSync(join(RA, `${ten}-${w}-${toi ? 'toi' : 'sang'}.jpg`), buf); ghi = buf.length; break }
      }
      const tranThe = w < 900 ? (ten.startsWith('vd-1-') ? 420 : ten.startsWith('vd-3-') ? 96 : 9999) : 9999
      console.log(`${ten}-${w}-${toi ? 'toi' : 'sang'}.jpg`.padEnd(38), `${Math.round(ghi / 1024)} KB · trang cao ${kt.cao} · thẻ cao ${kt.the}${tranThe < 9999 ? ` (trần ${tranThe})` : ''} · "Việc hôm nay" ở y=${kt.viec} · tràn ${kt.tran} · đích<48 ${kt.nho} · chữ<12 ${kt.chuNho} · nhãn mốc tràn ${kt.nhanTran} · tương phản kém ${kt.kem.length} · phông ${kt.phong ? 'Be Vietnam Pro' : 'hệ thống'} · lỗi ${loi.length}`)
      if (kt.kem.length) console.log('   tương phản kém:', kt.kem.join(' | '))
      if (!ghi || kt.tran > 0 || loi.length || kt.nho || kt.chuNho || kt.nhanTran || kt.kem.length || kt.the > tranThe) xau++
      await ctx.close()
    }
  }
  await browser.close()
  console.log(xau ? `${xau} ảnh có vấn đề` : 'sạch: ≤150 KB, 0 tràn, 0 đích <48, 0 chữ <12, 0 tương phản kém, thẻ trong trần cao')
}
