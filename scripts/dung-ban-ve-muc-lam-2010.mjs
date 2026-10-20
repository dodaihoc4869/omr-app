#!/usr/bin/env node
// DỰNG BẢN VẼ "MỨC LÀM BÀI" (20/10/2026): ghép docs/ban-ve-muc-lam-2010/muc-lam.html từ bảng số liệu giả duy nhất (du-lieu-gia.mjs).
//   node scripts/dung-ban-ve-muc-lam-2010.mjs
// Mọi con số hiện trên bản vẽ được TÍNH từ bảng đó (tDocEm, mucCuaLuot, demTheoMuc…), không gõ tay. Chưa sửa src/.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as D from '../docs/ban-ve-muc-lam-2010/du-lieu-gia.mjs'

const GOC = resolve(import.meta.dirname, '..')
const RA = join(GOC, 'docs/ban-ve-muc-lam-2010/muc-lam.html')
const fonts = readFileSync(join(GOC, 'docs/ban-ve-tu-sua-2010/tu-sua.html'), 'utf8').split('\n').filter((l) => l.startsWith('@font-face')).join('\n')

const vi = (n) => String(n).replace('.', ',')
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const pct = (n, t) => D.phanTram(n, t)

// ───────────────────────── BỘ PHẬN DÙNG CHUNG
const CHIP_DAI = (m) => D.TEN_MUC[m].ngan
const pip = (n) => `<span class="pip" data-n="${n}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`
function chip(m, { dai = false, hs = false } = {}) {
  if (m === 0) return `<span class="ch" data-m="0"><b>Chưa có số đo</b></span>`
  const ten = hs ? D.TEN_MUC[m].dai : CHIP_DAI(m)
  return `<span class="ch" data-m="${m}">${pip(m)}<b>Mức làm ${m}</b>${dai ? `<span>${e(ten)}</span>` : ''}</span>`
}
function nhanVe(k, chu) { return `<span class="ve" data-k="${k}">${chu}</span>` }

/** Thước: vùng 4 mức theo giây, mốc T_đọc / T_đọc+sàn / 0,8×kỳ vọng, chấm "giây của em". */
function thuoc({ giay, t, san, top, max, nho = false, nhanDiem = true }) {
  const p = (x) => Math.min(100, (100 * x) / max)
  const vung = [[0, t, 1], [t, t + san, 2], [t + san, top ?? max, 3]]
  if (top != null) vung.push([top, max, 4])
  const moc = [[t, ''], [t + san, ''], ...(top != null ? [[top, '']] : [])]
  const gioiHan = vung.map(([a, b, m]) => `<i data-m="${m}" style="left:${p(a)}%;width:${p(b) - p(a)}%"></i>`).join('')
  if (nho) {
    return `<span class="thn" role="img" aria-label="${giay} giây, đọc hết đề cần ${t} giây">${gioiHan}<u class="thn-t" style="left:${p(t)}%"></u>${giay != null ? `<b class="thn-d" style="left:${p(giay)}%"></b>` : ''}</span>`
  }
  return `<div class="th" role="img" aria-label="Làm ${giay} giây; đọc hết đề cần ${t} giây; có thời gian nghĩ từ ${t + san} giây${top != null ? `; làm kỹ từ ${top} giây` : ''}">
    ${nhanDiem && giay != null ? `<span class="th-diem" style="left:${p(giay)}%"><b>${giay} giây</b></span>` : ''}
    <div class="th-vung"><div class="th-z">${gioiHan}</div>${giay != null ? `<b class="th-ch" style="left:${p(giay)}%"></b>` : ''}</div>
    <div class="th-moc">${[[0, '0'], ...moc.map(([x]) => [x, String(x)])].map(([x, s]) => `<span style="left:${p(x)}%">${s}</span>`).join('')}<span class="th-cuoi" style="left:100%">${max} giây</span></div>
  </div>`
}

const kyHieuMo = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>`
const kyHieuAn = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12s3.5-6 9-6c1.5 0 2.9.4 4.1 1M21 12s-3.5 6-9 6c-1.5 0-2.9-.4-4.1-1M4 4l16 16"/></svg>`
const kyHieuDong = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`
const kyHieuLui = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>`

/** Thanh chồng 4 mức (số lượt) kèm chú giải có số. */
function thanhMuc(dem, tong, { kieu = '', chuGiai = true } = {}) {
  return `<div class="tm ${kieu}">
    <div class="tm-thanh" role="img" aria-label="${dem.map((n, i) => `Mức làm ${i + 1}: ${n} lượt`).join('; ')}">${dem.map((n, i) => (n ? `<i data-m="${i + 1}" style="flex:${n}"></i>` : '')).join('')}</div>
    ${chuGiai ? `<ul class="tm-cg">${dem.map((n, i) => `<li data-m="${i + 1}"><span class="tm-d"></span><b>Mức làm ${i + 1}</b><span class="tm-s">${n} lượt · ${pct(n, tong)}%</span></li>`).join('')}</ul>` : ''}
  </div>`
}

/** Bảng chéo: hàng = Mức làm 1..4, cột = đúng / sai. */
function bangCheo(cheo) {
  const dung = cheo.reduce((a, r) => a + r[0], 0), sai = cheo.reduce((a, r) => a + r[1], 0)
  return `<div class="cheo" role="table" aria-label="Mức làm theo đúng và sai"><div class="cheo-d" role="row"><span></span><span role="columnheader">Đúng</span><span role="columnheader">Sai</span></div>
    ${cheo.map((r, i) => `<div class="cheo-h" role="row" data-m="${i + 1}"><span role="rowheader" class="cheo-c">${chip(i + 1)}<small>${D.TEN_MUC[i + 1].ngan}</small></span><b class="so" role="cell">${r[0]}</b><b class="so sai" role="cell">${r[1]}</b></div>`).join('')}
    <div class="cheo-h cheo-t" role="row"><span role="rowheader">Cộng</span><b class="so" role="cell">${dung}</b><b class="so" role="cell">${sai}</b></div></div>`
}
/** Chú giải thước: màu 1–4, vạch đứng, chấm. */
const chuGiaiThuoc = () => `<p class="cgt"><span><i data-m="1"></i>Mức làm 1</span><span><i data-m="2"></i>2</span><span><i data-m="3"></i>3</span><span><i data-m="4"></i>4</span><span><u></u>Đọc hết đề</span><span><b></b>Giây em làm</span></p>`
/** Biểu đồ chấm của lớp: mỗi chấm một lượt sai, KHÔNG tên. Màu chấm = mức theo thước riêng của từng em. */
function chamLop(ds, { t, max = 100, kieu = '' }) {
  const p = (x) => Math.min(100, (100 * x) / max)
  const bin = new Map()
  const cham = ds.map((x) => { const b = Math.floor(x.giay / 5); const k = bin.get(b) ?? 0; bin.set(b, k + 1); return { ...x, k } })
  const cao = Math.max(...cham.map((x) => x.k)) + 1
  return `<div class="cl ${kieu}" style="--cao:${cao}" role="img" aria-label="${ds.length} lượt sai theo số giây; vạch đứng là thời gian đọc hết đề ${t} giây">
    <div class="cl-vung">${cham.map((x) => `<i data-m="${x.muc}" style="left:${p(x.giay)}%;--k:${x.k}"></i>`).join('')}<u style="left:${p(t)}%"></u></div>
    <div class="th-moc"><span style="left:0">0</span><span style="left:${p(t)}%">${t}</span><span style="left:50%">50</span><span class="th-cuoi" style="left:100%">${max} giây</span></div></div>`
}

const c12 = D.CAU.c12
const emA = D.EM
const tong = D.tongDo()
const demMuc = D.CHEO.map((r) => r[0] + r[1])
const saiVoi = D.CHEO[0][1] + D.CHEO[1][1]
const saiNghi = D.CHEO[2][1] + D.CHEO[3][1]
const dungNhanh = D.CHEO[0][0]

// ───────────────────────── KHUNG 1 · THANG BỐN MỨC
function khungThang() {
  const t = D.tDocEm(c12, null), san = D.sanNghi(c12), top = D.kyVongEm(c12, null)
  const topS = Math.round(D.NGUONG_TOP * top)
  const th = (giay) => thuoc({ giay, t, san, top: topS, max: 90 })
  const bangEm = [['Phạm Quốc Huy', 0.2], ['Em chưa có τ', null], ['Bùi Tuấn Kiệt', -0.2]]
  return `<section class="kh" id="k-thang" data-ap="gv" hidden>
  <div class="trang"><header class="dau-trang"><h1>Thang Mức làm bài</h1><p>Một câu, một thước. Câu 12 · Pin điện hóa · Phần I · ${c12.tu} từ, không hình.</p></header>
  <div class="luoi">
  <article class="the">
    <h2>Bốn mức theo số giây em làm câu này</h2>
    ${nhanVe('moi', 'Thêm')}
    ${th(31)}
    <p class="ghi">Chấm trên thước là một lượt làm 31 giây. Thước của mỗi câu, mỗi em tự co giãn theo độ dài đề và nhịp đọc của em.</p>
    <ul class="dn">
      <li data-m="1"><span class="dn-m">${chip(1)}</span><div><b>${D.TEN_MUC[1].ngan}</b><span>Nộp khi chưa tới <b class="so">${t}</b> giây: chưa đủ thời gian đọc hết đề.</span></div></li>
      <li data-m="2"><span class="dn-m">${chip(2)}</span><div><b>${D.TEN_MUC[2].ngan}</b><span>Từ <b class="so">${t}</b> tới <b class="so">${t + san - 1}</b> giây: đủ đọc, chưa tới ${san} giây để nghĩ.</span></div></li>
      <li data-m="3"><span class="dn-m">${chip(3)}</span><div><b>${D.TEN_MUC[3].ngan}</b><span>Từ <b class="so">${t + san}</b> tới <b class="so">${topS - 1}</b> giây: đọc xong và còn dành thời gian nghĩ.</span></div></li>
      <li data-m="4"><span class="dn-m">${chip(4)}</span><div><b>${D.TEN_MUC[4].ngan}</b><span>Từ <b class="so">${topS}</b> giây, tức ${vi(D.NGUONG_TOP)} × thời gian thường của lớp (<b class="so">${top}</b> giây).</span></div></li>
      <li data-m="0"><span class="dn-m">${chip(0)}</span><div><b>Lượt cũ, không đo lùi được</b><span>Trước ${D.NGAY_BAT_DO} nhiều nguồn không có giây. Không ước, không xếp mức.</span></div></li>
    </ul>
  </article>
  <div class="cot-phu">
  <article class="the">
    <h2>Cách tính, đều dùng số đã có trong hệ thống</h2>
    ${nhanVe('moi', 'Thêm')}
    <ol class="cong-thuc">
      <li><b>Đọc hết đề</b><span class="ct">8 + 0,35 × ${c12.tu} từ + 10 × ${c12.hinh} hình = <b class="so">${D.tDocGoc(c12)} giây</b></span><small>Công thức đã dùng cho thời gian lên bảng.</small></li>
      <li><b>Nhịp đọc của em</b><span class="ct">e<sup>−τ</sup>, kẹp 0,75 – 1,5. Chưa có τ ⇒ 1,0</span><small>τ lấy từ tốc độ OMNI của em.</small></li>
      <li><b>Sàn nghĩ</b><span class="ct">Phần I ${D.SAN_NGHI.I} · Phần II ${D.SAN_NGHI.II} · Phần III ${D.SAN_NGHI.III} giây</span><small>Ngưỡng tạm, chỉnh theo dữ liệu thật.</small></li>
      <li><b>Mức làm 4</b><span class="ct">≥ ${vi(D.NGUONG_TOP)} × thời gian thường của em</span><small>Lớp chưa đủ 8 lượt của câu thì không xét Mức làm 4.</small></li>
    </ol>
  </article>
  <article class="the">
    <h2>Cùng một câu, thước mỗi em một khác</h2>
    <div class="ba-thuoc">${bangEm.map(([ten, tau]) => {
      const te = D.tDocEm(c12, tau), ke = D.kyVongEm(c12, tau)
      return `<div class="ba-hang"><div class="ba-ten"><b>${e(ten)}</b><span>${tau == null ? 'chưa có τ · hệ số 1,0' : `τ ${vi(tau)} · hệ số ${vi(D.heSoDoc(tau).toFixed(2))}`} · đọc hết đề <b class="so">${te}</b> giây</span></div>${thuoc({ giay: null, t: te, san, top: Math.round(D.NGUONG_TOP * ke), max: 90, nho: true })}</div>`
    }).join('')}</div>
    <p class="ghi">Vạch đứng là mốc đọc hết đề của từng em.</p>
  </article>
  <article class="the the-luu">
    <h2>Câu trả lời đúng thì sao?</h2>
    <p>Đúng mà làm chậm hơn thời gian đọc: bình thường, không xếp mức vội.</p>
    <p>Đúng mà nộp trước khi đọc hết đề: chỉ ghi chú riêng cho thầy, “đúng trước khi đọc hết đề”. Không đếm là lượt vội.</p>
    ${nhanVe('moi', 'Thêm')}
  </article></div></div></div></section>`
}

// ───────────────────────── KHUNG 2 · ĐO MỌI LƯỢT
const NGUON = [
  ['Ca thi', 'Có giây từng câu, dừng khi tab ẩn.', 'Giữ nguyên'],
  ['BTVN · BTVN lỡ · Khắc phục (phiếu)', 'Không có giây.', 'Đồng hồ trong phiếu, gửi cùng đáp án'],
  ['Game (Làm bài tập)', 'Máy em gửi, máy chủ bỏ khi OMNI tắt.', 'Máy chủ ghi cả khi OMNI tắt'],
  ['Chữa lỗi', 'Giờ máy chủ, cộng cả lúc em rời màn.', 'Đồng hồ máy em, dừng khi rời màn'],
  ['Ôn lại', 'Máy chủ nhận giây, máy em không gửi.', 'Máy em gửi giây'],
  ['Tự luyện', 'Giây nằm ở bảng riêng, sổ để trống.', 'Ghi vào sổ chung'],
  ['Mở bài · Luyện đề · Nền · Kiểm tra cá nhân', 'Không có giây.', 'Đồng hồ chung, gửi cùng lượt'],
  ['Lên bảng · Đầu giờ (thầy chấm)', 'Giây thực nằm ở bảng riêng.', 'Chuyển vào sổ để xếp mức'],
]
const PHU = [['Ca thi', 34, 34], ['BTVN · Khắc phục', 412, 412], ['Game', 240, 240], ['Tự luyện', 96, 96], ['Ôn lại', 58, 61], ['Kiểm tra cá nhân', 27, 27]]
function khungDo() {
  const sum = D.GIAO_BAI.map(D.tDocGoc)
  const tongDoc = sum.reduce((a, b) => a + b, 0)
  const mm = (s) => `${Math.floor(s / 60)} phút ${String(s % 60).padStart(2, '0')} giây`
  return `<section class="kh" id="k-do" data-ap="gv" hidden>
  <div class="trang"><header class="dau-trang"><h1>Mọi câu đều có số đo</h1><p>Đã làm, đang làm và sắp làm. Lượt nào cũng có giây đo thật, không ước.</p></header>
  <div class="ba-the">
    <article class="the"><h2>Đã làm</h2>${nhanVe('moi', 'Thêm')}<ul class="dong-y"><li>Từ <b>${D.NGAY_BAT_DO}</b>, mọi lượt mới đều có giây đo thật.</li><li><b>Đã có trong sổ:</b> ca thi, chữa lỗi (chữa lỗi cộng cả lúc em rời màn, nên chỉ có thể thiếu Mức làm 1, không bịa ra).</li><li><b>Còn ở kho khác, nạp lùi được nếu thầy duyệt:</b> tự luyện, game có OMNI, lên bảng.</li><li><b>Mất hẳn, hiện “Chưa có số đo”:</b> BTVN, khắc phục, mở bài, luyện đề, nền, kiểm tra cá nhân, ôn lại trước ${D.NGAY_BAT_DO}.</li></ul></article>
    <article class="the"><h2>Đang làm</h2>${nhanVe('moi', 'Thêm')}<ul class="dong-y"><li>Một cách đo chung cho mọi màn làm câu: từ lúc câu hiện đủ trên màn tới lúc em nộp.</li><li>Dừng khi tab ẩn, khóa màn hình hoặc em không chạm màn 180 giây (tạm).</li><li>Trần ${900} giây một lượt. Làm lại câu là lượt mới, giây riêng.</li></ul></article>
    <article class="the"><h2>Sắp làm</h2>${nhanVe('moi', 'Thêm')}<p>Thời gian đọc hết đề tính sẵn cho từng câu trong kho, thầy thấy ngay khi giao bài. Ví dụ bài sắp giao:</p>
      <ul class="gb">${D.GIAO_BAI.map((c) => `<li><span>Câu ${c.so} · ${e(c.chuyenDe)}</span><b class="so">${D.tDocGoc(c)} giây</b></li>`).join('')}<li class="gb-tong"><span>Đọc hết ${D.GIAO_BAI.length} câu</span><b class="so">${mm(tongDoc)}</b></li></ul></article>
  </div>
  <article class="the"><h2>Từng nguồn: hiện tại và sau khi đổi</h2>${nhanVe('moi', 'Thêm')}
    <div class="bang" role="table" aria-label="Nguồn và cách đo"><div class="bang-d" role="row"><span role="columnheader">Nguồn</span><span role="columnheader">Hiện tại</span><span role="columnheader">Sau khi đổi</span></div>
    ${NGUON.map(([n, a, b]) => `<div class="bang-h" role="row"><b role="cell">${n}</b><span role="cell">${a}</span><span role="cell" class="sau">${b}</span></div>`).join('')}</div>
  </article>
  <article class="the"><h2>Độ phủ đo, 7 ngày gần nhất</h2>${nhanVe('moi', 'Thêm')}
    <ul class="phu">${PHU.map(([n, d, t]) => `<li${d < t ? ' class="thieu"' : ''}><span>${n}</span><span class="phu-th"><i style="width:${pct(d, t)}%"></i></span><b class="so">${d}/${t} lượt · ${pct(d, t)}%</b></li>`).join('')}</ul>
    <p class="ghi">Nguồn nào dưới 100% hiện màu cảnh báo (như Ôn lại ở trên, thiếu 3 lượt) và ghi vào nhật ký điều phối để sửa ngay.</p>
  </article></div></section>`
}

// ───────────────────────── KHUNG 3 · BẢNG ĐIỂM DANH CỦA THẦY (màn riêng, không chiếu)
function khungDiemDanh() {
  const em = D.EM_CHIEU
  const TEN_NHOM = { cham: 'Chăm', 'chua-deu': 'Chưa đều', luoi: 'Lười' }
  const dem = { cham: 0, 'chua-deu': 0, luoi: 0 }
  em.forEach((x) => { dem[D.nhomCua(x.bac)]++ })
  const vua = [['18:31', em[12]], ['18:29', em[5]], ['18:27', em[20]], ['18:26', em[28]], ['18:24', em[14]], ['18:22', em[2]]]
  const dongVua = ([g, x]) => {
    const tg = x.mini.reduce((a, b) => a + b, 0), voi = x.mini[0] + x.mini[1], n = D.nhomCua(x.bac)
    return `<li class="dd-hang"><span class="dd-gio so">${g}</span><b class="dd-ten">${e(x.ten)}</b><span class="dd-chips"><span class="dd-nhom" data-n="${n}">${TEN_NHOM[n]}</span><span class="dd-bac">Bậc ${x.bac}</span></span>
      <div class="dd-cach"><span class="cd-mini" aria-label="Mức làm 14 ngày">${x.mini.map((n2, k) => `<i data-m="${k + 1}" style="flex:${n2}"></i>`).join('')}</span><small>Mức làm 1–2: <b class="so">${voi}/${tg}</b> lượt</small></div></li>`
  }
  const vang = D.EM_LOP.filter((x) => !x.coMat).map((x) => x.ten)
  return `<section class="kh" id="k-diem-danh" data-ap="gv" hidden>
  <div class="trang"><header class="dau-trang"><h1>Điểm danh — việc đầu tiên của buổi</h1><p>${D.LOP.ten} · ${D.HOM_NAY.replace('/2026', '')} · màn của thầy, không chiếu.</p></header>
  <div class="dd-ba">
    <article class="the dd-xam"><h2>Mã buổi</h2><div class="dd-mq"><span class="dd-qr" aria-hidden="true"></span><div><p class="dd-ma so">4827 19</p><p class="ghi">Mở 18:10 · mã đổi mỗi phút</p></div></div>${nhanVe('giu', 'Giữ')}</article>
    <article class="the dd-xam"><h2>Có mặt</h2><p class="dd-co"><b class="so">${em.length}</b><span>/${D.LOP.siSo} em</span></p><span class="phu-th"><i style="width:${pct(em.length, D.LOP.siSo)}%"></i></span><p class="ghi">Chăm ${dem.cham} · Chưa đều ${dem['chua-deu']} · Lười ${dem.luoi}</p>${nhanVe('giu', 'Giữ')}</article>
    <article class="the dd-xam"><h2>Vắng ${vang.length} em</h2><p class="dobao">${vang.join(' · ')}</p>${nhanVe('giu', 'Giữ')}</article>
  </div>
  <article class="the"><div class="the-dau"><h2>Vừa điểm danh <small>· bấm em ⇒ hồ sơ làm bài</small></h2></div>${nhanVe('moi', 'Thêm thanh Mức làm')}
    <p class="ghi">Thanh nhỏ bên phải: số lượt làm 14 ngày theo Mức làm 1 → 4. Màn riêng của thầy.</p>
    ${chuGiaiThuoc().replace('<span><u></u>Đọc hết đề</span><span><b></b>Giây em làm</span>', '')}
    <ul class="dd-ds">${vua.map(dongVua).join('')}</ul>
  </article></div></section>`
}

// ───────────────────────── KHUNG 4 · HỒ SƠ LÀM BÀI CỦA EM (giáo viên, riêng tư)
function dongLuot(l) {
  const nho = l.muc === 0
  const chu = !nho && l.ketQua === 1 && l.muc === 1 ? 'Đúng trước khi đọc hết đề: ghi chú riêng, không tính là vội.' : null
  return `<li class="lh" data-m="${l.muc}">
    <div class="lh-c"><b>Câu ${l.cau.so} · ${e(l.cau.chuyenDe)}</b><span>${e(l.nguon)} · ${l.ngay} · ${l.ketQua ? 'Đúng' : 'Sai'}</span></div>
    ${nho ? `<div class="lh-t"><span class="lh-s">Lượt cũ, trước ${D.NGAY_BAT_DO}</span></div>` : `<div class="lh-t"><span class="lh-s"><b class="so">${l.giay}</b> giây · đọc hết đề <b class="so">${l.t}</b> giây</span>${thuoc({ giay: l.giay, t: l.t, san: l.san, top: l.top == null ? null : l.top, max: Math.max(100, Math.ceil((l.top ?? l.t * 3) * 1.3 / 10) * 10), nho: true })}${chu ? `<span class="lh-s lh-gc">${chu}</span>` : ''}</div>`}
    <div class="lh-m">${chip(l.muc)}</div>
  </li>`
}
function khungHoSo() {
  const vois = pct(saiVoi, D.tongSai()), nghi = pct(saiNghi, D.tongSai())
  const x = D.EM_LOP.find((r) => r.ten === emA.ten)
  const thieu = [2, 9].slice(0, 14 - x.du)
  const lich = Array.from({ length: 14 }, (_, i) => (thieu.includes(i) ? 'thieu' : 'du'))
  return `<section class="kh" id="k-ho-so" data-ap="gv" hidden>
  <div class="tam" data-bo="hs"><header class="tam-dau"><button class="nut-lui" aria-label="Đóng hồ sơ">${kyHieuDong}</button><span class="ava">ĐA</span><div><h1>${e(emA.ten)}</h1><p>${emA.lop} · SBD ${emA.sbd} · 14 ngày gần nhất</p></div></header>
  <div class="tam-than">
    <article class="the the-rong"><div class="the-dau"><h2>Đầu tấm: nhóm, lý do, lịch 14 ngày</h2>${nhanVe('giu', 'Giữ nguyên')}</div>
      <p class="dobao">Nhãn nhóm <b>Chăm</b> · đủ mức <b class="so">${x.du}/14</b> ngày · lý do và độ tin cậy như hiện có.</p>
      <ol class="lich14" aria-label="Lịch làm bài theo ngày">${lich.map((k, i) => `<li data-k="${k}"><span>${13 + i > 31 ? 13 + i - 31 : 13 + i}</span></li>`).join('')}</ol></article>
    <article class="the the-lon"><div class="the-dau"><h2>Cách làm bài</h2>${nhanVe('moi', 'Thêm')}</div>
      <p class="dobao">Đo được <b class="so">${tong}/${D.TONG_LUOT}</b> lượt. <b class="so">${D.chuaCoSoDo()}</b> lượt cũ (trước ${D.NGAY_BAT_DO}) chưa có số đo.</p>
      ${thanhMuc(demMuc, tong)}
      ${bangCheo(D.CHEO)}
      <div class="hai-so"><div><b class="so">${saiVoi}/${D.tongSai()}</b><span>lượt sai là lúc làm vội (Mức làm 1–2), ${vois}%</span></div><div><b class="so">${saiNghi}/${D.tongSai()}</b><span>lượt sai dù đã nghĩ (Mức làm 3–4), ${nghi}%</span></div></div>
      <p class="ghi">${dungNhanh} lượt đúng nộp trước khi đọc hết đề. Chỉ ghi chú, không tính là vội.</p>
    </article>
    <article class="the"><div class="the-dau"><h2>Lịch sử làm câu</h2></div>${nhanVe('doi', 'Đổi: thêm thước và Mức làm')}${chuGiaiThuoc()}<ul class="lh-ds">${D.LUOT_GAN_DAY.map(dongLuot).join('')}</ul></article>
    <article class="the"><div class="the-dau"><h2>Sáu tín hiệu thái độ</h2></div>
      <ul class="tin-hieu">
        <li><b>a</b><span>Ngày đủ mức</span><em>Giữ</em></li>
        <li class="doi"><b>b</b><span>Trả lời quá nhanh: <b class="so">${saiVoi}/${D.tongSai()}</b> lượt sai ở Mức làm 1–2</span><em>Đổi</em></li>
        <li><b>c</b><span>Dồn bài cuối ngày</span><em>Giữ</em></li>
        <li><b>d</b><span>Dùng gợi ý, đọc lời giải</span><em>Giữ</em></li>
        <li><b>e</b><span>Chọn lặp một phương án</span><em>Giữ</em></li>
        <li><b>f</b><span>Độ đúng theo thời gian</span><em>Giữ</em></li>
      </ul>
    </article>
  </div></div></section>`
}

// ───────────────────────── KHUNG 4 · AI ĐÃ SAI CÂU NÀY (giáo viên, riêng tư)
function dongSai(x) {
  return `<li class="as" data-m="${x.muc}"><div class="as-ten"><b>${e(x.ten)}</b><span>${x.tau == null ? 'chưa có τ' : `τ ${vi(x.tau)}`}</span></div>
    <div class="as-t"><span class="lh-s"><b class="so">${x.giay}</b> giây · đọc hết đề <b class="so">${x.t}</b> giây</span>${thuoc({ giay: x.giay, t: x.t, san: x.san, top: x.top, max: 100, nho: true })}</div>
    <div class="as-m">${chip(x.muc)}</div></li>`
}
function khungAiSai() {
  const ds = D.SAI_CAU12
  const dem = D.demTheoMuc(ds)
  const nghi = ds.filter((x) => x.muc >= 3), voi = ds.filter((x) => x.muc <= 2)
  const t = D.tDocEm(c12, null)
  return `<section class="kh" id="k-ai-sai" data-ap="gv" hidden>
  <div class="tam" data-bo="ai"><header class="tam-dau"><button class="nut-lui" aria-label="Quay lại">${kyHieuLui}</button><div><h1>Ai đã sai câu này</h1><p>Câu ${c12.so} · ${e(c12.chuyenDe)} · Phần ${c12.phan} · ${D.BAI.ten}</p></div></header>
  <div class="tam-than">
    <article class="the the-lon"><div class="the-dau"><h2>${D.SO_LAM_C12} em làm: ${D.SO_DUNG_C12} đúng, ${ds.length} sai</h2>${nhanVe('moi', 'Thêm')}</div>
      <p class="dobao">Đo được <b class="so">${ds.length}/${ds.length}</b> lượt sai. Đọc hết đề câu này cần <b class="so">${t}</b> giây (chưa tính nhịp đọc từng em).</p>
      ${thanhMuc(dem, ds.length)}
      ${chamLop(ds, { t, max: 100 })}
      <p class="ghi">Mỗi chấm là một lượt sai, không kèm tên. Vạch đứng: đọc hết đề ${t} giây (thước chung của câu). Màu chấm theo thước riêng của từng em.</p>
    </article>
    <article class="the"><div class="the-dau"><h2>Sai dù đã nghĩ · ${nghi.length} em</h2><span class="phu-s">Mức làm 3–4</span></div><ul class="as-ds">${nghi.map(dongSai).join('')}</ul></article>
    <article class="the"><div class="the-dau"><h2>Sai khi làm vội · ${voi.length} em</h2><span class="phu-s">Mức làm 1–2</span></div><ul class="as-ds">${voi.map(dongSai).join('')}</ul></article>
    ${chuGiaiThuoc()}
    <p class="ghi gc-rieng">${kyHieuAn}<span>Màn này chỉ thầy thấy. Tờ chiếu “ai sai câu này” (phím X) chỉ hiện số em theo mức, không hiện tên kèm mức.</span></p>
  </div></div></section>`
}

// ───────────────────────── KHUNG 5 · EM ĐƯỢC GỌI LÊN BẢNG (giáo viên, riêng tư)
function khungLenBang() {
  const x = D.SAI_CAU12.find((r) => r.ten === D.HA.ten)
  const he = D.heSoDoc(x.tau)
  const top = D.kyVongEm(c12, x.tau)
  const mix = D.HA_CHEO.map((r) => r[0] + r[1])
  const tongHa = mix.reduce((a, b) => a + b, 0)
  return `<section class="kh" id="k-len-bang" data-ap="gv" hidden>
  <div class="tam tam-lb"><header class="tam-dau"><button class="nut-lui" aria-label="Đóng">${kyHieuDong}</button><span class="ava">TH</span><div><h1>${e(D.HA.ten)}</h1><p>Đang được gọi lên bảng · Câu ${c12.so} · ${e(c12.chuyenDe)}</p></div><span class="chi-thay">${kyHieuAn}<span>Chỉ thầy thấy</span></span></header>
  <div class="tam-than">
    <article class="the the-lon"><div class="the-dau"><h2>Em làm câu này thế nào</h2>${nhanVe('moi', 'Thêm')}</div>
      <p class="lb-so"><b class="so">${x.giay}</b><span>giây em làm</span><i></i><b class="so">${x.t}</b><span>giây đọc hết đề</span></p>
      ${thuoc({ giay: x.giay, t: x.t, san: x.san, top: x.top, max: 100 })}
      <div class="lb-chip">${chip(x.muc, { dai: true })}</div>
      <p class="ghi">Đề dài ${c12.tu} từ, không hình: đọc hết đề cần ${D.tDocGoc(c12)} giây. Nhịp đọc của Hà chậm hơn lớp một chút (hệ số ${vi(he.toFixed(2))}) nên mốc là ${x.t} giây. Thời gian thường của Hà ở câu này: ${top} giây.</p>
    </article>
    <article class="the"><div class="the-dau"><h2>Hà trong 14 ngày</h2>${nhanVe('moi', 'Thêm')}</div>
      <p class="dobao">Đo được <b class="so">${tongHa}</b> lượt.</p>
      ${thanhMuc(mix, tongHa, { chuGiai: false })}
      ${bangCheo(D.HA_CHEO)}
    </article>
    <article class="the"><div class="the-dau"><h2>Lượt gần đây của Hà</h2>${nhanVe('moi', 'Thêm')}</div>${chuGiaiThuoc()}<ul class="lh-ds">${D.LUOT_HA.map(dongLuot).join('')}</ul></article>
    <p class="ghi gc-rieng">${kyHieuAn}<span>Không hiện lên bản chiếu. Người được gọi vẫn do máy chọn như trước, mức chỉ để thầy nhìn.</span></p>
  </div></div></section>`
}

// ───────────────────────── KHUNG 6 · BẢN CHIẾU ĐIỂM DANH (chiếu, tổng hợp lớp)
function khungChieuA(bat) {
  const L = D.LOP_HOM_QUA
  const sai = L.saiTheoMuc.reduce((a, b) => a + b, 0)
  const voi = L.saiTheoMuc[0] + L.saiTheoMuc[1]
  const lop = D.EM_LOP, tg = lop.length
  const cot = { cham: lop.filter((x) => D.nhomCua(x.bac) === 'cham'), 'chua-deu': lop.filter((x) => D.nhomCua(x.bac) === 'chua-deu'), luoi: lop.filter((x) => D.nhomCua(x.bac) === 'luoi') }
  const TEN = { cham: 'Chăm', 'chua-deu': 'Chưa đều', luoi: 'Lười' }
  const DK = { cham: 'đủ mức ≥ 10/14 ngày', 'chua-deu': 'đủ mức 6–9/14 ngày', luoi: 'thoát khi đủ mức 6 ngày liền' }
  const hang = (x) => `<li class="nl-hang"${x.coMat ? '' : ' data-vang=""'}><span class="nl-bac">${x.bac}</span><span class="nl-ten">${e(x.ten)}${x.coMat ? '' : ' <small>vắng</small>'}</span>${bat ? `<span class="cd-mini nl-mini" aria-label="Mức làm 14 ngày">${x.mini.map((n, k) => `<i data-m="${k + 1}" style="flex:${n}"></i>`).join('')}</span>` : ''}<b class="so">${x.du}/14</b></li>`
  return `<section class="kh" id="k-chieu-${bat ? 'bat' : 'tat'}" data-ap="chieu" hidden>
  <div class="cd"><header class="cd-dau"><div><small>NHỊP HỌC ${D.LOP.ten}</small><b>Từ 13/10 đến 26/10 · 14 ngày đã qua</b></div><div class="cd-mat"><small>Có mặt ${lop.filter((x) => x.coMat).length}/${D.LOP.siSo} · Vắng ${lop.filter((x) => !x.coMat).length}</small></div></header>
  <div class="nl-nhom">${['cham', 'chua-deu', 'luoi'].map((k) => `<span data-g="${k}" style="flex:${cot[k].length}">${TEN[k]} ${cot[k].length} em · ${pct(cot[k].length, tg)}%</span>`).join('')}</div>
  <section class="cd-the cd-moi nl-moi">${nhanVe('moi', 'Thêm')}<div class="nl-moi-trai"><small>HÔM QUA LỚP LÀM BÀI THẾ NÀO</small><p class="cd-do"><b>${L.luot}</b> lượt BTVN · đo được <b>${L.luot}/${L.luot}</b></p></div>
    <div class="nl-moi-giua">${thanhMuc(L.mucDem, L.luot, { kieu: 'chieu' })}</div>
    <p class="cd-ket nl-moi-phai"><b>${voi}</b> trong <b>${sai}</b> lượt sai (<b>${pct(voi, sai)}%</b>) nộp khi chưa kịp nghĩ.</p></section>
  <div class="nl-ba">${['cham', 'chua-deu', 'luoi'].map((k) => `<section class="nl-cot" data-g="${k}"><div class="nl-cot-dau"><h2>${TEN[k]} <span>· ${cot[k].length} em</span></h2><small>${DK[k]}</small></div><ul class="nl-ds">${cot[k].map(hang).join('')}</ul></section>`).join('')}</div>
  <footer class="cd-chan"><span class="nl-chan-so">Hôm qua cả lớp <b>25/34</b> em đủ mức · hôm nay đã có <b>12</b> em đủ mức</span>
    <span class="nl-nut"><span class="nl-b">← Điểm danh</span><span class="nl-b"><kbd>H</kbd> Ẩn tên nhóm Lười</span><span class="nl-b nl-b-moi" data-bat="${bat ? '' : undefined}"><kbd>M</kbd> Mức làm từng em: ${bat ? 'Bật' : 'Tắt'}${nhanVe('moi', 'Thêm')}</span><span class="nl-b nl-b-chinh"><kbd>→</kbd> Sang Gọi lên bảng đầu giờ</span></span></footer></div></section>`
}

// ───────────────────────── KHUNG 7 · TỜ CHIẾU "AI SAI CÂU NÀY" (phím X)
function khungChieuX() {
  const ds = D.LUOT_SAI_C12, dem = D.demTheoMuc(ds), em = D.EM_SAI_C12
  const theoNoi = { BTVN: 0, 'Luyện theo dạng': 0, 'Tự sửa lỗi': 0 }
  ds.forEach((l) => { theoNoi[l.nguon]++ })
  const theoNgay = [['22/10', 0], ['23/10', 0], ['24/10', ds.filter((l) => l.ngay === '24/10').length], ['25/10', ds.filter((l) => l.ngay === '25/10').length], ['26/10', ds.filter((l) => l.ngay === '26/10').length]]
  const maxNg = Math.max(...theoNgay.map((x) => x[1]))
  const maxNoi = Math.max(...Object.values(theoNoi))
  const nhieu = em.map((ten) => ({ ten, l: ds.filter((l) => l.ten === ten).sort((a, b) => a.ngay.localeCompare(b.ngay) || a.gio.localeCompare(b.gio)) })).filter((x) => x.l.length > 1).slice(0, 8)
  const chuCai = (ten) => ten.split(' ').slice(-1)[0][0]
  const t = D.tDocGoc(c12)
  return `<section class="kh" id="k-chieu-x" data-ap="chieu" hidden>
  <div class="cd"><header class="cd-dau"><div><small>CÂU ${c12.so} · AI ĐÃ SAI?</small><b>Học sinh làm sai câu này</b></div><div class="cd-mat"><small>Đọc hết đề cần</small><b>${t}<i> giây</i></b></div></header>
  <div class="sai-o4"><div><b>${em.length}</b><span>em làm sai</span></div><div><b>${ds.length}</b><span>lượt làm sai</span></div><div><b>${D.giayTbSaiC12()} giây</b><span>trung bình mỗi lượt</span></div><div><b>BTVN</b><span>sai nhiều nhất (${theoNoi.BTVN} lượt)</span></div></div>
  <div class="sai-ba">
    <section class="cd-the"><small>LƯỢT SAI THEO NƠI LÀM</small>${Object.entries(theoNoi).map(([n, v]) => `<div class="sai-thanh"><span>${n}</span><i style="width:${Math.max(4, Math.round((v / maxNoi) * 100))}%"></i><em>${v}</em></div>`).join('')}${nhanVe('giu', 'Giữ')}</section>
    <section class="cd-the"><small>LƯỢT SAI THEO NGÀY</small><div class="sai-cot">${theoNgay.map(([n, v]) => `<div><b>${v}</b><i style="height:${Math.max(3, Math.round((v / maxNg) * 82))}%"></i></div>`).join('')}</div><div class="sai-ngay">${theoNgay.map(([n]) => `<span>${n}</span>`).join('')}</div>${nhanVe('giu', 'Giữ')}</section>
    <section class="cd-the cd-moi">${nhanVe('moi', 'Thêm')}<small>LƯỢT SAI THEO MỨC LÀM</small>
      ${thanhMuc(dem, ds.length, { kieu: 'chieu', chuGiai: false })}
      ${chamLop(ds, { t, max: 100, kieu: 'chieu' })}
      ${chuGiaiThuoc()}
      <p class="cd-ket"><b>${dem[0] + dem[1]}</b> trong <b>${ds.length}</b> lượt nộp trước khi kịp nghĩ.</p></section>
  </div>
  <section class="sai-em" aria-label="Từng em"><h3>Từng em</h3>${nhanVe('giu', 'Giữ')}<div class="sai-luoi">${nhieu.map((x) => `<article><span class="sai-anh" aria-hidden="true">${chuCai(x.ten)}</span><div><b>${e(x.ten)}</b><small>${x.l.length} lần sai · trung bình ${Math.round(x.l.reduce((a, l) => a + l.giay, 0) / x.l.length)} giây</small><p>${x.l.map((l) => `<span>${l.ngay} ${l.gio} · ${l.nguon} · <u>${l.giay} giây</u></span>`).join('')}</p></div></article>`).join('')}</div></section>
  <footer class="cd-chan"><span class="nl-nut"><span class="nl-b"><kbd>M</kbd> Mức làm từng lượt: Tắt${nhanVe('moi', 'Thêm')}</span></span><span class="cd-ghc">Mỗi chấm là một lượt sai, không kèm tên.</span></footer></div></section>`
}

// ───────────────────────── KHUNG 8 · APP HỌC SINH
function khungHs() {
  const [a, b, , , c, d] = D.LUOT_GAN_DAY
  const max = (l) => Math.max(100, Math.ceil((l.top * 1.3) / 10) * 10)
  const hang = (l, tt, ten) => `<li class="hs-hang"><div class="hs-ten"><b>${ten}</b><small>${e(l.nguon)} · ${l.ngay}</small><small class="hs-tt">${tt}</small>
      ${l.muc === 0 ? `<p class="hs-lan"><span>Lần làm trước chưa có số đo (trước ${D.NGAY_BAT_DO}).</span></p>` : `<p class="hs-lan"><span class="hs-nhan" data-m="${l.muc}">${pip(l.muc)}${D.TEN_MUC[l.muc].dai}</span><span class="so">${l.giay} giây · đọc hết đề cần ≈ ${l.t} giây</span></p>
      ${thuoc({ giay: l.giay, t: l.t, san: l.san, top: l.top, max: max(l), nho: true })}`}</div></li>`
  const lg = (m, chu) => `<li data-m="${m}"><i></i><span>${chu}</span></li>`
  return `<section class="kh" id="k-hs" data-ap="hs" hidden>
  <div class="app"><div class="cot-hs">
    <section class="the-hs"><div class="hs-dau"><h1>Chặng 1/3</h1><span>4 câu</span></div>
      <ul class="hs-ds">${hang(a, 'Sửa từng bước · bước 1', `Pin điện hóa · Câu ${a.cau.so}`)}${hang(b, 'Sửa từng bước · bước 2', `Điện phân · Câu ${b.cau.so}`)}${hang(c, 'Chỉ còn làm bản mới là xong', `Điện phân · Câu ${c.cau.so}`)}${hang(d, 'Sửa từng bước · bước 1', `Đại cương kim loại · Câu ${d.cau.so}`)}</ul>
      ${nhanVe('moi', 'Thêm')}</section>
    <section class="the-hs"><div class="hs-dau"><h2>Màn sửa câu</h2><span>Đầu màn, trước khi sửa</span></div>
      <div class="hs-ct"><p class="hs-lan"><b>Lần làm trước của em</b></p>
      <p class="lb-so"><b class="so">${a.giay}</b><span>giây em làm</span><i></i><b class="so">${a.t}</b><span>giây đọc hết đề cần</span></p>
      ${thuoc({ giay: a.giay, t: a.t, san: a.san, top: a.top, max: 100 })}
      <ul class="hs-cg">${lg(1, `Dưới ${a.t} giây: chưa đọc hết đề`)}${lg(2, `${a.t}–${a.t + a.san - 1} giây: đọc xong, nộp ngay`)}${lg(3, `${a.t + a.san}–${a.top - 1} giây: có thời gian nghĩ`)}${lg(4, `Từ ${a.top} giây: làm kỹ`)}</ul>
      </div>${nhanVe('moi', 'Thêm')}</section>
    <section class="the-hs"><div class="hs-dau"><h2>Câu đã làm</h2><span>Danh sách</span></div>
      <ul class="hs-ds hs-nho">${[D.LUOT_GAN_DAY[3], D.LUOT_GAN_DAY[2]].map((l) => `<li class="hs-hang"><div class="hs-ten"><b>${e(l.cau.chuyenDe)} · Câu ${l.cau.so}</b><small>${e(l.nguon)} · ${l.ngay} · ${l.ketQua ? 'Đúng' : 'Sai'}</small><p class="hs-lan">${l.ketQua && l.muc >= 3 ? `<span class="hs-nhan" data-m="${l.muc}">${pip(l.muc)}${D.TEN_MUC[l.muc].dai}</span>` : ''}<span class="so">${l.giay} giây · đọc hết đề cần ≈ ${l.t} giây</span></p></div></li>`).join('')}</ul>
      ${nhanVe('moi', 'Thêm')}</section>
  </div></div></section>`
}

// ───────────────────────── KHUNG 9 · PHỤ HUYNH
function khungPh() {
  const vois = saiVoi, ts = D.tongSai()
  return `<section class="kh" id="k-ph" data-ap="hs" hidden>
  <div class="app"><div class="cot-hs">
    <section class="the-hs"><div class="hs-dau"><h1>Cách làm bài của con</h1><span>14 ngày gần nhất</span></div>
      <p class="hs-doan">Trong <b>${ts}</b> lượt sai, <b>${vois}</b> lượt con nộp trước khi kịp nghĩ (nộp khi chưa đọc hết đề hoặc vừa đọc xong). <b>${saiNghi}</b> lượt sai còn lại con đã dành thời gian nghĩ.</p>
      ${thanhMuc(demMuc, tong, { kieu: 'ph' })}
      <p class="hs-gc">Đo được ${tong}/${D.TONG_LUOT} lượt. ${D.chuaCoSoDo()} lượt trước ${D.NGAY_BAT_DO} chưa có số đo.</p>${nhanVe('moi', 'Thêm')}</section>
    <section class="the-hs"><div class="hs-dau"><h2>Hai câu gần đây</h2><span>Số giây của con và của đề</span></div>
      <ul class="hs-ds">${[D.LUOT_GAN_DAY[0], D.LUOT_GAN_DAY[2]].map((l) => `<li class="hs-hang"><div class="hs-ten"><b>Câu ${l.cau.so} · ${e(l.cau.chuyenDe)}</b><small>${e(l.nguon)} · ${l.ngay} · ${l.ketQua ? 'Đúng' : 'Sai'}</small><p class="hs-lan"><span class="hs-nhan" data-m="${l.muc}">${pip(l.muc)}${D.TEN_MUC[l.muc].dai}</span><span class="so">${l.giay} giây · đọc hết đề cần ≈ ${l.t} giây</span></p>${thuoc({ giay: l.giay, t: l.t, san: l.san, top: l.top, max: Math.max(100, Math.ceil(l.top * 1.3 / 10) * 10), nho: true })}</div></li>`).join('')}</ul>${nhanVe('moi', 'Thêm')}</section>
  </div></div></section>`
}

const CSS = readFileSync(join(GOC, 'docs/ban-ve-muc-lam-2010/muc-lam.css'), 'utf8')
const KHUNG = [khungThang(), khungDo(), khungDiemDanh(), khungHoSo(), khungAiSai(), khungLenBang(), khungChieuA(false), khungChieuA(true), khungChieuX(), khungHs(), khungPh()]
const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bản vẽ Mức làm bài</title>
<!-- BẢN VẼ MỨC LÀM BÀI (20/10) — sinh bởi scripts/dung-ban-ve-muc-lam-2010.mjs từ docs/ban-ve-muc-lam-2010/du-lieu-gia.mjs. Số GIẢ, ngưỡng TẠM. Chưa sửa src/.
     Mở từng khung bằng #k=<khung>&toi=1 (xem scripts/chup-ban-ve-muc-lam-2010.mjs). Nhãn Thêm / Đổi / Giữ chỉ để thầy xem bản vẽ, không có trong app. -->
<style>
${fonts}
${CSS}
</style>
</head>
<body>
${KHUNG.join('\n')}
<script>
(() => {
  const q = new URLSearchParams(location.hash.slice(1))
  const k = q.get('k')
  if (q.get('toi')) document.documentElement.setAttribute('data-toi', '')
  const ds = [...document.querySelectorAll('.kh')]
  if (!k) { ds.forEach((s) => { s.hidden = false; s.classList.add('xem-het') }); return }
  const mot = ds.find((s) => s.id === 'k-' + k)
  if (mot) mot.hidden = false
})()
</script>
</body>
</html>
`
writeFileSync(RA, html)
console.log(`ĐÃ DỰNG ${RA.replace(GOC + '/', '')} · ${(html.length / 1024).toFixed(0)} KB · ${KHUNG.length} khung`)
