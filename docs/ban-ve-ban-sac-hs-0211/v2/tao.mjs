// BỘ SINH BẢN VẼ «KÍNH» — mọi màn app học sinh từ cùng một bộ thành phần (đồng bộ tuyệt đối). Chạy: node tao.mjs ⇒ ghi <màn>.html.
import { writeFileSync } from 'node:fs'
const i = (k) => `<span data-i="${k}"></span>`
const oi = (k, sac = 'hs', co = '') => `<span class="oi" data-sac="${sac}"${co ? ` data-co="${co}"` : ''}>${i(k)}</span>`
const mol = (m) => `<span data-mol="${m}"></span>`
const chev = `<span class="chev">${i('phai')}</span>`
const trang = (tieu, than, { nav = 0, lop = '', mot = false, thanh = true } = {}) => `<!doctype html>
<html lang="vi" data-trong="hs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${tieu}</title>
<link rel="stylesheet" href="kinh.css">
</head><body${mot ? ' data-mot-man' : ''}${lop ? ` class="${lop}"` : ''}>
${than}
${thanh ? `<div class="thanh"><nav class="kinh" aria-label="Điều hướng học sinh">${[['sparkles', 'Hôm nay'], ['wrench', 'Luyện tập'], ['trophy', 'Thành tích'], ['luoi', 'Thêm']].map(([k, t], n) => `<a href="#"${n + 1 === nav ? ' aria-current="page"' : ''}>${i(k)}${t}${n === 3 ? '<span class="cham">1</span>' : ''}</a>`).join('')}</nav><button class="ai kinh" aria-label="Hỏi A.I Đỗ Đại Học">${i('chat')}</button></div>` : ''}
<script src="../ve.js"></script><script src="kve.js"></script><script src="binh.js"></script>
</body></html>
`
const DAU = (phu = 'Thứ Hai 02/11 · Lớp 12A3', ten = 'Chào An', tb = 2) => `<header class="dau"><span class="ava" data-hinh="banh"><b>AN</b></span><div class="giua"><span class="mo">${phu}</span><h1>${ten}</h1></div><button class="nut-tron kinh" aria-label="Thông báo${tb ? `, ${tb} chưa đọc` : ''}">${i('bell')}${tb ? `<span class="cham">${tb}</span>` : ''}</button></header>`
const TIEU = (t) => `<header class="tieu-trang"><h1>${t}</h1><button class="nut-tron kinh" aria-label="Thông báo, 2 chưa đọc">${i('bell')}<span class="cham">2</span></button></header>`
const CON = (t, phai = '') => `<header class="dau-con"><button class="nut-tron kinh" aria-label="Quay lại">${i('trai')}</button><h1>${t}</h1>${phai}</header>`
const CHIP = (lua = 5) => `<div class="chip-h"><span class="chip" data-k="lua" aria-label="Chuỗi ${lua} ngày">${i('flame')}${lua} ngày</span><span class="chip" data-k="nt" aria-label="Nguyên tử hôm nay">${i('atom')}128</span><span class="chip" data-k="tt" aria-label="Tinh thể">${i('gem')}42</span></div>`
const hang = (tt, tieu, phu, phai = '', tich = '') => `<button class="hang"${tt ? ` data-tt="${tt}"` : ''}><span class="tich"${tich}>${tt === 'xong' ? i('check') : tt === 'khoa' ? i('lock') : ''}</span><span class="giua"><b>${tieu}</b><span class="mo">${phu}</span></span>${phai}</button>`
const dong = (o, tieu, phu, phai = chev) => `<button class="hang">${o}<span class="giua"><b>${tieu}</b>${phu ? `<span class="mo">${phu}</span>` : ''}</span>${phai}</button>`
const loai = (k) => `<span class="the-loai" data-k="${k}"></span>`
const hero = ({ da, muc, chang, du, lua = 5, nhan, dong: dg }) => `<section class="kinh hero"${du ? ' data-du' : ''} aria-label="${du ? 'Đủ mức hôm nay' : 'Mức hôm nay'}">
    <div><span class="nhan"${du ? ' style="color:var(--tr-tim-chu)"' : ''}>${nhan || (du ? 'ĐỦ MỨC HÔM NAY' : 'MỨC HÔM NAY')}</span><div class="so-to">${du ? `${da}<small> câu</small>` : `${da}<small>/${muc} câu</small>`}</div><p class="dong">${dg}</p></div>
    <div class="binh-o" data-binh-dep data-da="${da}" data-muc="${muc}" data-chang="${chang}"></div>
    ${CHIP(lua)}
  </section>`
const nutLon = (icon, tieu, phu, sac = '') => `<button class="nut-lon"${sac ? ` data-sac="${sac}"` : ''}><span class="banh-o" data-hinh="banh">${i(icon)}</span><span class="giua"><b>${tieu}</b><span class="phu">${phu}</span></span>${i('phai')}</button>`
const molNoi = (m, loi) => `<div class="mol-noi"><span class="m">${mol(m)}</span><p class="kinh">${loi}</p></div>`
const goCua = `<section class="kinh hang" style="border-radius:26px;padding:10px 10px 10px 14px" aria-label="Bạn học cùng"><span class="ava" data-hinh="co" style="width:44px;height:44px"><b style="color:var(--tr-sao-chu)">GB</b></span><span class="giua"><b style="font-size:15px">Trần Gia Bảo chưa đủ mức hôm nay</b><span class="mo">Lửa đôi 3 ngày</span></span><button class="chip" style="height:44px;color:var(--tr-hs-chu)">${i('tay')}Gõ cửa</button></section>`
const P = {}

// ═════ HÔM NAY ═════
P['hom-nay'] = trang('Hôm nay · đang học', `<div class="rong"><main class="trang" style="padding-bottom:0">
  ${DAU()}
  ${hero({ da: 14, muc: 24, chang: '6,6,6,6', dong: 'Còn 10 câu nữa là dung dịch đổi màu.' })}
  ${molNoi('chao', 'Học tiếp nhé! Còn 10 câu nữa là đủ mức hôm nay.')}
  ${nutLon('sach', 'Học tiếp · Chặng 3', 'Amino acid (P1) · còn 4 câu')}
</main><aside class="trang" aria-label="Việc hôm nay">
  <section class="kinh viec"><h2>Việc hôm nay <span>3/7 xong</span></h2>
    ${hang('xong', 'Kiểm tra ôn tập', 'Đã nộp · điểm 8,5/10', loai('kiem'))}
    ${hang('xong', 'Chặng 1', '6 câu', loai('hoc'))}
    ${hang('xong', 'Chặng 2', '6 câu', loai('hoc'))}
    ${hang('dang', 'Chặng 3', 'Học tiếp · còn 4 câu', '<span class="phai">2/6</span>', ' data-vong="2/6"')}
    ${hang('khoa', 'Tự sửa lỗi · 3 câu', 'Làm xong các chặng phía trên để mở khoá', loai('sua'))}
    ${hang('khoa', 'Chặng 4', 'Hoàn thành các chặng trước để mở khoá', loai('hoc'))}
    ${hang('', 'Bài tập về nhà', '1 bài thầy đang giao', loai('bt'))}
  </section>
  ${goCua}
</aside></div>`, { nav: 1 })

P['hom-nay-du'] = trang('Hôm nay · đủ mức, dung dịch đổi hồng', `<div class="rong"><main class="trang" style="padding-bottom:0">
  ${DAU()}
  ${hero({ da: 17, muc: 12, chang: '6,6', du: true, lua: 6, dong: 'Mức 12 — tới điểm tương đương, dung dịch đã hồng!' })}
  ${molNoi('khen', 'Đủ mức rồi! Giờ đến Bài tập về nhà nhé.')}
  ${nutLon('pen', 'Làm Bài tập về nhà', '1 bài thầy đang giao', 'bt')}
</main><aside class="trang" aria-label="Việc hôm nay">
  <section class="kinh viec"><h2>Việc hôm nay <span>4/5 xong</span></h2>
    ${hang('xong', 'Kiểm tra ôn tập', 'Đã nộp · điểm 8,5/10', loai('kiem'))}
    ${hang('xong', 'Chặng 1', '6 câu', loai('hoc'))}
    ${hang('xong', 'Chặng 2', '11 câu', loai('hoc'))}
    ${hang('xong', 'Tự sửa lỗi', 'Hôm nay đã sửa xong', loai('sua'))}
    ${hang('dang', 'Bài tập về nhà', '1 bài thầy đang giao', '<span class="phai" style="color:var(--tr-chu-y-chu)">Làm bài</span>')}
  </section>
  <button class="kinh hang" style="border-radius:26px;justify-content:center;font-weight:800;color:var(--tr-hs-chu)">Học thêm câu mới ${i('phai')}</button>
</aside></div>`, { nav: 1 })

P['hom-nay-kt'] = trang('Hôm nay · ngày có Kiểm tra ôn tập, điểm danh đang mở', `<div class="rong"><main class="trang" style="padding-bottom:0">
  ${DAU('Thứ Năm 06/11 · Lớp 12A3', 'Chào An', 1)}
  <section class="kinh hang" style="border-radius:26px;padding:12px 12px 12px 14px;box-shadow:inset 0 0 0 2px var(--tr-hs-day),var(--kinh-bong)" aria-label="Điểm danh buổi học">${oi('qr')}<span class="giua"><b>Điểm danh buổi học</b><span class="mo">Buổi 06/11 · gõ mã 6 số trên máy chiếu</span></span><button class="nut" data-l="chinh" style="min-height:44px;padding:0 16px;font-size:15px">Điểm danh</button></section>
  ${hero({ da: 0, muc: 12, chang: '6,6', dong: 'Hôm nay làm Kiểm tra ôn tập trước, rồi mới học chặng.' })}
  ${molNoi('chao', 'Hôm nay có Kiểm tra ôn tập. Em làm xong là mở khoá các chặng nhé.')}
  <button class="nut-lon" style="background:var(--tr-tin-chu);box-shadow:0 18px 32px -16px var(--tr-tin-day);color:var(--tr-trang)"><span class="banh-o" data-hinh="banh">${i('binh')}</span><span class="giua"><b>Bắt đầu Kiểm tra ôn tập</b><span class="phu">20 câu · khoảng 30 phút · hạn nộp 21:00</span></span>${i('phai')}</button>
</main><aside class="trang" aria-label="Việc hôm nay">
  <section class="kinh viec"><h2>Việc hôm nay <span>0/4 xong</span></h2>
    ${hang('dang', 'Kiểm tra ôn tập', '20 câu · 4 chặng', '<span class="phai" style="color:var(--tr-tin-chu)">Bắt đầu</span>', ' data-vong="0/4"')}
    ${hang('khoa', 'Chặng 1', 'Làm Kiểm tra ôn tập trước để mở khoá', loai('hoc'))}
    ${hang('khoa', 'Chặng 2', 'Làm Kiểm tra ôn tập trước để mở khoá', loai('hoc'))}
    ${hang('khoa', 'Tự sửa lỗi', 'Làm Kiểm tra ôn tập trước để mở khoá', loai('sua'))}
  </section>
</aside></div>`, { nav: 1 })

P['hom-nay-ca'] = trang('Hôm nay · có ca kiểm tra đang mở', `<div class="rong"><main class="trang" style="padding-bottom:0">
  ${DAU()}
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:14px;box-shadow:inset 0 0 0 2px var(--tr-tin-day),var(--kinh-bong)" aria-label="Ca kiểm tra đang mở">
    <div style="display:flex;gap:12px;align-items:center">${oi('clip', 'tin', 'to')}<div><b style="font-size:19px;display:block">Ca kiểm tra đang mở</b><span class="mo">Nhập mã ca thầy cho để vào làm</span></div></div>
    <button class="nut" data-l="tin" data-rong>Vào ca kiểm tra</button>
  </section>
  ${hero({ da: 14, muc: 24, chang: '6,6,6,6', dong: 'Học tiếp sau khi nộp bài kiểm tra.' })}
  ${molNoi('chao', 'Có ca kiểm tra đang mở. Em vào ca trước nhé.')}
</main><aside class="trang" aria-label="Việc hôm nay">
  <section class="kinh viec"><h2>Việc hôm nay <span>3/7 xong</span></h2>
    ${hang('xong', 'Kiểm tra ôn tập', 'Đã nộp · điểm 8,5/10', loai('kiem'))}
    ${hang('xong', 'Chặng 1 · Chặng 2', '12 câu', loai('hoc'))}
    ${hang('', 'Chặng 3', 'Chờ ca kiểm tra đóng', loai('hoc'))}
    ${hang('khoa', 'Tự sửa lỗi · 3 câu', 'Làm xong các chặng phía trên để mở khoá', loai('sua'))}
  </section>
</aside></div>`, { nav: 1 })

// ═════ LÀM CÂU ═════
const tien = (ds) => `<div class="tien" role="progressbar" aria-label="Câu trong chặng">${ds.map((x) => `<i${x ? ` data-${x}` : ''}></i>`).join('')}</div>`
const lamTren = (ds, cau) => `<header class="lam-tren"><button class="nut-tron kinh" aria-label="Nghỉ và về Hôm nay">${i('x')}</button>${tien(ds)}<span class="dem-c">Câu ${cau}/6</span></header>`
const deTN = `<section class="kinh de"><div class="nhan-de"><span class="chip" data-sac="hs" data-nho>Chặng 3</span><span class="chip" data-nho>Trắc nghiệm</span></div>Cho 8,9 gam alanine tác dụng vừa đủ với dung dịch NaOH theo phương trình dưới đây, thu được m gam muối. Giá trị của m là
  <div class="ct-dai" tabindex="0" aria-label="Phương trình, kéo ngang để xem hết">H<sub>2</sub>N–CH(CH<sub>3</sub>)–COOH + NaOH → H<sub>2</sub>N–CH(CH<sub>3</sub>)–COONa + H<sub>2</sub>O &nbsp;&nbsp;(M = 89; M<sub>muối</sub> = 111)</div></section>`
const paTN = (chon, kq) => `<div class="pa">${[['A', '11,10'], ['B', '9,70'], ['C', '11,15'], ['D', '12,50']].map(([k, v]) => `<button class="kinh" aria-pressed="${k === chon}"${kq && k === chon ? ` data-kq="${kq}"` : ''}><span class="ky">${k}</span>${v}</button>`).join('')}</div>`
P['lam-moi'] = trang('Làm câu · câu mới: Học cách giải hay Tự làm', `<div class="lam">${lamTren(['x', 'h', 'dang', '', '', ''], 3)}
<div class="lam-than" data-hai><div class="cot">${deTN.replace('theo phương trình dưới đây, ', '')}</div><div class="cot">${paTN('', '')}
  <p class="mo" style="text-align:center;font-weight:700">Câu này mới với em. Em muốn bắt đầu thế nào?</p>
  <div class="hai-loi"><button class="kinh loi-vao" data-chinh>${oi('pen')}<b>Tự làm câu này</b><span class="mo">Làm đúng ngay được tính tự làm đúng</span></button><button class="kinh loi-vao">${oi('sach', 'sao')}<b>Học cách giải</b><span class="mo">Xem từng bước rồi làm lại câu tương tự</span></button></div>
</div></div></div>`, { thanh: false, mot: true })
P['lam-chon'] = trang('Làm câu · trắc nghiệm đang chọn, phương trình dài', `<div class="lam">${lamTren(['x', 'h', 'dang', '', '', ''], 3)}
<div class="lam-than" data-hai><div class="cot">${deTN}<button class="nut" data-l="kinh" style="align-self:flex-start;min-height:44px;font-size:15px">${i('den')}Gợi ý</button></div>
<div class="cot">${paTN('A', '')}<div class="chan"><button class="nut" data-l="chinh" data-rong style="min-height:60px">Kiểm tra</button></div></div></div></div>`, { thanh: false, mot: true })
P['lam-ds'] = trang('Làm câu · Đúng–sai, kết quả chưa đúng', `<div class="lam">${lamTren(['x', 'h', 'x', 'dang', '', ''], 4)}
<div class="lam-than" data-hai><div class="cot"><section class="kinh de"><div class="nhan-de"><span class="chip" data-sac="hs" data-nho>Chặng 3</span><span class="chip" data-nho>Đúng–sai</span></div>Cho các phát biểu về glycine (H<sub>2</sub>N–CH<sub>2</sub>–COOH). Mỗi ý em chọn Đúng hoặc Sai.</section></div>
<div class="cot"><div class="ds-y">${[['a', 'Ở điều kiện thường, glycine là chất rắn kết tinh.', 'dung'], ['b', 'Dung dịch glycine làm quỳ tím hoá xanh.', 'sai'], ['c', 'Glycine tác dụng được với cả dung dịch HCl và dung dịch NaOH.', 'dung'], ['d', 'Phân tử khối của glycine là 75.', 'dung']].map(([k, t, kq]) => `<div class="kinh y" data-kq="${kq}"><p><b>${k})</b>${t}</p><button aria-pressed="true" aria-label="Đúng">Đ</button><button aria-pressed="false" aria-label="Sai">S</button></div>`).join('')}</div>
<section class="kq" data-tt="sai" role="status"><div class="dau-kq">${oi('giot', 'sai', 'to')}<div><h2>Chưa đúng · đúng 3/4 ý</h2><p>Ý b: glycine có một nhóm –NH<sub>2</sub> và một nhóm –COOH nên dung dịch không làm quỳ tím đổi màu.</p></div></div><div class="hai"><button class="nut" data-l="kinh">Xem lời giải đầy đủ</button><button class="nut" data-l="sai">Câu tiếp theo</button></div></section></div></div></div>`, { thanh: false, mot: true })
P['lam-tln'] = trang('Làm câu · Trả lời ngắn, kết quả đúng', `<div class="lam">${lamTren(['x', 'h', 'x', 's', 'dang', ''], 5)}
<div class="lam-than" data-hai><div class="cot"><section class="kinh de"><div class="nhan-de"><span class="chip" data-sac="hs" data-nho>Chặng 3</span><span class="chip" data-nho>Trả lời ngắn</span></div>Cho 0,1 mol glycine tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? <span class="mo">(làm tròn đến hàng phần trăm)</span></section></div>
<div class="cot"><div class="kinh o-so" data-kq="dung" aria-label="Đáp án em nhập">11,15</div>
<section class="kq" data-tt="dung" role="status"><div class="dau-kq">${oi('check', 'dung', 'to')}<div><h2>Chính xác!</h2><p>Tự làm đúng · bình hôm nay 15/24 câu</p></div></div><div class="loi-giai"><b>Cách nghĩ</b>n<sub>muối</sub> = n<sub>glycine</sub> = 0,1 ⇒ m = 0,1 × 111,5 = 11,15 g</div><button class="nut" data-l="dung" data-rong>Câu tiếp theo</button></section></div></div></div>`, { thanh: false, mot: true })
P['lam-ban-phim'] = trang('Làm câu · Trả lời ngắn, đang nhập', `<div class="lam">${lamTren(['x', 'h', 'x', 's', 'dang', ''], 5)}
<div class="lam-than" data-hai><div class="cot"><section class="kinh de"><div class="nhan-de"><span class="chip" data-sac="hs" data-nho>Chặng 3</span><span class="chip" data-nho>Trả lời ngắn</span></div>Cho 0,1 mol glycine tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? <span class="mo">(làm tròn đến hàng phần trăm)</span></section></div>
<div class="cot"><div class="kinh o-so" aria-label="Đáp án em nhập">11,1<span style="width:3px;height:34px;border-radius:2px;background:var(--tr-hs-day);margin-left:3px"></span></div>
<div class="phim">${['7', '8', '9', 'xoa', '4', '5', '6', ',', '1', '2', '3', '−'].map((k) => `<button class="kinh"${['xoa', ',', '−'].includes(k) ? ' data-phu' : ''}${k === 'xoa' ? ' aria-label="Xoá"' : ''}>${k === 'xoa' ? i('xoa') : k}</button>`).join('')}<button class="kinh" style="grid-column:span 2">0</button><button class="nut" data-l="chinh" style="grid-column:span 2;min-height:54px">Kiểm tra</button></div></div></div></div>`, { thanh: false, mot: true })

P['hoc-cach-giai'] = trang('Học cách giải · từng bước theo sơ đồ cột dọc', `<div class="lam"><header class="lam-tren"><button class="nut-tron kinh" aria-label="Quay lại câu">${i('trai')}</button><b style="flex:1;font-size:18px">Học cách giải</b><span class="dem-c">Bước 2/3</span></header>
<div class="lam-than" data-hai><div class="cot"><section class="kinh de" style="font-size:16.5px"><div class="nhan-de"><span class="chip" data-sac="sao" data-nho>Câu 3 · Chặng 3</span></div>Cho 8,9 gam alanine tác dụng vừa đủ với dung dịch NaOH, thu được m gam muối. Giá trị của m là</section>
<section class="kinh the-p"><div class="buoc-hd"><span class="so-b">${i('check')}</span><div class="giua"><b>Vẽ sơ đồ cột dọc theo chất</b><div class="cot-doc"><div class="chat">Alanine<small>8,9 g · M 89</small></div><span class="mui">→</span><div class="chat">Muối Na<small>M 111</small></div><span class="gia-tri">0,1 mol</span><span></span><span class="gia-tri">0,1 mol</span></div></div></div></section></div>
<div class="cot"><section class="kinh the-p" style="box-shadow:inset 0 0 0 2px var(--tr-hs-day),var(--kinh-bong)"><div class="buoc-hd"><span class="so-b">2</span><div class="giua"><b>Bảo toàn nguyên tố ⇒ một phép tính</b><p class="mo" style="font-size:15px;color:var(--tr-chu-2)">Một phân tử alanine cho đúng một phân tử muối, nên số mol bằng nhau.</p><div class="loi-giai">m = 0,1 × 111 = <b style="display:inline;font-size:16px;color:var(--tr-hs-chu)">11,10 g</b></div></div></div></section>
<section class="kinh the-p"><div class="buoc-hd" data-cho><span class="so-b">3</span><div class="giua"><b>Tự làm câu tương tự</b><span class="mo">Câu đổi số, em làm lại không gợi ý</span></div></div></section>
<div class="chan"><button class="nut" data-l="chinh" data-rong style="min-height:60px">Hiểu rồi · sang bước 3</button></div></div></div></div>`, { thanh: false, mot: true })

P['ket-chang'] = trang('Kết chặng · xong chặng 3 (dạng story)', `<main class="story">
  <div class="thanh-story" aria-hidden="true"><i data-x></i><i></i><i></i></div>
  <div style="display:flex;justify-content:space-between;align-items:center"><span class="chip" data-sac="hs">Amino acid (P1)</span><button class="nut-tron kinh" aria-label="Đóng">${i('x')}</button></div>
  <div style="display:grid;grid-template-columns:1fr 132px;align-items:end;gap:8px"><p class="lon">Xong<br><em>chặng 3</em></p><span>${mol('khen')}</span></div>
  <div><div class="dong-s"><b style="color:var(--tr-hs-chu)">4</b><span>câu tự làm đúng</span></div><div class="dong-s"><b style="color:var(--tr-sao-chu)">1</b><span>câu có hỗ trợ</span></div><div class="dong-s"><b style="color:var(--tr-sai-chu)">1</b><span>câu cần sửa · đã vào Tự sửa lỗi</span></div><div class="dong-s"><b>7</b><span>phút cho 6 câu</span></div></div>
  <section class="kinh hang" style="border-radius:26px;padding:12px 16px"><span style="width:56px;flex:none" data-binh-dep data-da="18" data-muc="24" data-chang="6,6,6,6"></span><span class="giua"><b>Bình hôm nay 18/24 câu</b><span class="mo">Còn 6 câu nữa là đủ mức hôm nay</span></span></section>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:auto"><button class="nut" data-l="chinh" data-rong style="min-height:60px">Học tiếp chặng 4</button><button class="nut" data-l="chu" data-rong>Nghỉ và về Hôm nay</button></div>
</main>`, { thanh: false, mot: true })

// ═════ LUYỆN TẬP ═════
P['luyen-tap'] = trang('Luyện tập · bento', `<main class="trang" data-rong-1>
  ${TIEU('Luyện tập')}
  <div class="bento">
    <button class="kinh ob" data-to style="box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--tr-sai) 45%,transparent),var(--kinh-bong)">${oi('wrench', 'sai', 'to')}<span style="display:flex;flex-direction:column"><b style="font-size:20px">Tự sửa lỗi</b><span class="mo">Câu cần sửa hôm nay · nên làm trước</span></span><span class="so-g" style="color:var(--tr-sai-chu)">3<small>câu</small></span></button>
    <button class="kinh ob">${oi('target', 'tin')}<span class="so-g" style="color:var(--tr-tin-chu)">20<small>câu</small></span><b>Kiểm tra ôn tập</b><span class="mo">Thứ Năm 06/11 · còn 4 ngày</span></button>
    <button class="kinh ob">${oi('pen', 'chu-y')}<span class="so-g" style="color:var(--tr-chu-y-chu)">1<small>bài</small></span><b>Bài tập về nhà</b><span class="mo">Thầy đang giao</span></button>
    <button class="kinh ob">${oi('history', 'dung')}<b>Câu đã làm</b><span class="mo">Lời giải và lịch ôn từng câu</span></button>
    <button class="kinh ob">${oi('layers', 'sao')}<b>Tu luyện</b><span class="mo">Luyện thêm theo chương, dạng, mức</span></button>
    <button class="kinh ob" data-to>${oi('refresh', 'tim')}<span style="display:flex;flex-direction:column"><b>Luyện lại từ bài kiểm tra</b><span class="mo">Câu sai trong các bài kiểm tra</span></span>${chev}</button>
  </div>
</main>`, { nav: 2 })

P['tu-sua-loi'] = trang('Tự sửa lỗi · danh sách câu cần sửa', `<main class="trang" data-rong-1>
  ${CON('Tự sửa lỗi')}
  <section class="kinh the-p" style="display:grid;grid-template-columns:1fr auto;align-items:end;gap:10px">
    <div><span class="nhan" style="font-size:14px;font-weight:800;color:var(--tr-chu-3)">HÔM NAY CẦN SỬA</span><div class="so-lon" style="color:var(--tr-sai-chu)">3<small>câu</small></div><p class="mo" style="margin-top:6px">Đã tự sửa 12/20 câu · chờ lần gặp lại 5 câu</p></div>
    <span style="width:92px">${mol('nghi')}</span>
    <div class="vach-t" style="grid-column:1/-1" aria-label="Đã tự sửa 12/20 câu">${'<i data-d></i>'.repeat(12)}${'<i></i>'.repeat(8)}</div>
  </section>
  <button class="nut" data-l="sai" data-rong style="min-height:60px">Bắt đầu sửa · 3 câu</button>
  <h2 class="tieu-nho">Cần sửa <span>3 câu</span></h2>
  <section class="kinh ds">
    ${dong(oi('wrench', 'sai', 'nho'), 'Câu 12 · Amino acid', 'Đang sửa từng bước · bước 2/4', '<span class="chip" data-sac="sai" data-nho>Sửa tiếp</span>')}
    ${dong(oi('wrench', 'sai', 'nho'), 'Câu 7 · Ester – Lipid', 'Chưa bắt đầu')}
    ${dong(oi('wrench', 'sai', 'nho'), 'Câu 3 · Amine', 'Chờ chữa trên lớp · em sửa trước được')}
  </section>
  <h2 class="tieu-nho">Đang chờ lần gặp lại <span>5 câu</span></h2>
  <section class="kinh ds">
    ${dong(oi('dong_ho', 'sao', 'nho'), 'Câu 9 · Glucose', 'Gặp lại Thứ Tư 04/11', '<span class="chip" data-sac="sao" data-nho>Chờ</span>')}
    ${dong(oi('check', 'dung', 'nho'), 'Câu 5 · Ester – Lipid', 'Đã tự sửa', '<span class="chip" data-sac="dung" data-nho>Xong</span>')}
  </section>
</main>`, { nav: 2 })

P['chua-cau-sai'] = trang('Chữa câu sai · đường tự gỡ từng bước', `<div class="lam"><header class="lam-tren"><button class="nut-tron kinh" aria-label="Quay lại">${i('trai')}</button><b style="flex:1;font-size:18px">Sửa câu 12</b><span class="chip" data-sac="sai" data-nho>Sửa từng bước</span></header>
<div class="lam-than" data-hai><div class="cot">
  <section class="kinh the-p"><b style="font-size:15px;color:var(--tr-chu-3)">ĐƯỜNG TỰ GỠ · 1/4 bước</b>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">${[['Tìm chỗ vướng', 'xong'], ['Hiểu cách làm', 'dang'], ['Vì sao cách này đúng?', ''], ['Thử điều vừa hiểu với bài mới', '']].map(([t, tt], n) => `<div class="buoc-hd"${tt ? '' : ' data-cho'}><span class="so-b">${tt === 'xong' ? i('check') : n + 1}</span><div class="giua" style="justify-content:center"><b style="${tt === 'dang' ? 'color:var(--tr-hs-chu)' : tt ? '' : 'color:var(--tr-chu-3)'}">${t}</b></div></div>`).join('')}</div></section>
  <button class="nut" data-l="kinh" style="align-self:flex-start;min-height:44px;font-size:15px">${i('mat')}Xem lại đề gốc</button>
</div><div class="cot">
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:12px;box-shadow:inset 0 0 0 2px var(--tr-hs-day),var(--kinh-bong)"><span class="chip" data-sac="hs" data-nho style="align-self:flex-start">Bước 2 · Hiểu cách làm</span>
    <p style="font-size:17px;font-weight:650;line-height:1.5">Muối của glycine với HCl có công thức nào?</p>
    <div class="pa">${[['A', 'H<sub>2</sub>N–CH<sub>2</sub>–COOCl'], ['B', 'ClH<sub>3</sub>N–CH<sub>2</sub>–COOH'], ['C', 'H<sub>2</sub>N–CH<sub>2</sub>–COONa']].map(([k, v]) => `<button class="kinh" aria-pressed="${k === 'B'}"><span class="ky">${k}</span><span>${v}</span></button>`).join('')}</div>
    <p class="mo">Một gợi mở: HCl gắn vào nhóm nào của amino acid?</p></section>
  <div class="chan"><button class="nut" data-l="chinh" data-rong style="min-height:60px">Kiểm tra bước này</button></div>
</div></div></div>`, { thanh: false, mot: true })

P['cau-da-lam'] = trang('Câu đã làm · lọc và lịch ôn', `<main class="trang" data-rong-1>
  ${CON('Câu đã làm', `<button class="nut-tron kinh" aria-label="Chọn bài">${i('loc')}</button>`)}
  <div class="hang-chip" role="tablist">${['Tất cả', 'Sai lần gần nhất', 'Cần ôn', 'Thành thạo', 'Cần thầy dạy lại'].map((t, n) => `<button class="chip kinh" role="tab" aria-pressed="${n === 2}">${t}</button>`).join('')}</div>
  <section class="kinh ds">
    ${dong(oi('dong_ho', 'sao', 'nho'), 'Câu 9 · Glucose và fructose', 'Đến lịch ôn lại hôm nay · đã làm 3 lần', '<span class="chip" data-sac="sao" data-nho>Cần ôn</span>')}
    ${dong(oi('dong_ho', 'sao', 'nho'), 'Câu 14 · Saccharose', 'Đến lịch ôn lại 04/11 · sai lần gần nhất', '<span class="chip" data-sac="sao" data-nho>Cần ôn</span>')}
    ${dong(oi('check', 'dung', 'nho'), 'Câu 2 · Amino acid', 'Chuyển sang lịch ôn xa hơn · 12/11', '<span class="chip" data-sac="dung" data-nho>Thành thạo</span>')}
    ${dong(oi('users', 'tin', 'nho'), 'Câu 21 · Peptide', 'Sai 4 lần · thầy sẽ chữa trên lớp', '<span class="chip" data-sac="tin" data-nho>Thầy dạy lại</span>')}
  </section>
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:10px"><b>Câu 9 · Lịch sử làm câu này</b>
    <div class="vach-t" style="max-width:200px" aria-label="3 lần: sai, có hỗ trợ, đúng"><i data-s></i><i data-h></i><i data-d></i></div>
    <span class="mo">28/10 sai · 30/10 có hỗ trợ · 01/11 đúng</span>
    <div style="display:flex;gap:8px"><button class="nut" data-l="chinh" style="flex:1">Xem lời giải</button><button class="nut" data-l="kinh" style="flex:1">Làm lại</button></div></section>
</main>`, { nav: 2 })

P['tu-luyen'] = trang('Tu luyện · chọn chế độ và bộ lọc', `<main class="trang" data-rong-1>
  ${CON('Tu luyện')}
  <div class="phan kinh" role="tablist"><button role="tab" aria-selected="true">Luyện</button><button role="tab" aria-selected="false">Tổng hợp</button><button role="tab" aria-selected="false">Luyện đề</button></div>
  <div class="bento">
    <button class="kinh ob" style="box-shadow:inset 0 0 0 2.5px var(--tr-hs-day),var(--kinh-bong)">${oi('wrench', 'sai')}<b>Sửa câu sai</b><span class="mo">Làm lại câu em đã sai từ 29/09</span></button>
    <button class="kinh ob">${oi('refresh', 'tim')}<b>Dạng câu sai</b><span class="mo">Câu mới cùng dạng với câu em sai</span></button>
    <button class="kinh ob">${oi('layers', 'hs')}<b>Dạng bài</b><span class="mo">Chọn Lớp → Bài → Dạng để luyện sâu</span></button>
    <button class="kinh ob">${oi('sparkles', 'sao')}<b>Tự do</b><span class="mo">Rút ngẫu nhiên, lọc theo sao và loại câu</span></button>
  </div>
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;justify-content:space-between"><b>Số câu</b><div style="display:flex;align-items:center;gap:12px"><button class="nut-tron kinh" aria-label="Bớt">−</button><b style="font-size:22px;min-width:32px;text-align:center">10</b><button class="nut-tron kinh" aria-label="Thêm">${i('cong')}</button></div></div>
    <div style="display:flex;flex-direction:column;gap:8px"><b>Loại câu</b><div class="hang-chip">${['Ngẫu nhiên', '2 sao', '1 sao', 'Lý thuyết'].map((t, n) => `<button class="chip kinh" aria-pressed="${n === 0}">${t}</button>`).join('')}</div></div>
    <div class="phan kinh" style="background:var(--kinh-dam)"><button aria-selected="true">Chấm từng câu</button><button aria-selected="false">Làm hết rồi nộp</button></div>
  </section>
  <button class="nut" data-l="chinh" data-rong style="min-height:60px">Bắt đầu luyện · 10 câu</button>
</main>`, { nav: 2 })

P['bai-tap'] = trang('Bài tập về nhà · danh sách và hạn nộp', `<main class="trang" data-rong-1>
  ${CON('Bài tập về nhà')}
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:14px;box-shadow:inset 0 0 0 2px var(--tr-chu-y-nut),var(--kinh-bong)">
    <div style="display:flex;gap:12px;align-items:center">${oi('pen', 'chu-y', 'to')}<div style="flex:1"><b style="font-size:18px;display:block">BTVN Amino acid · đề 2</b><span class="mo">30 câu · thầy giao 01/11</span></div><span class="chip" data-sac="chu-y" data-nho>Hạn 05/11</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">${[['Chặng đang mở', '1/3'], ['Chặng sau', '2'], ['Nộp bài', 'Chưa']].map(([a, b]) => `<div class="kinh" style="padding:10px 6px;border-radius:18px;background:var(--kinh-dam)"><b style="display:block;font-size:18px">${b}</b><span class="mo" style="font-size:12.5px">${a}</span></div>`).join('')}</div>
    <button class="nut" data-l="chinh" data-rong>Vào làm bài</button>
  </section>
  <h2 class="tieu-nho">Đã nộp</h2>
  <section class="kinh ds">
    ${dong(oi('check', 'dung', 'nho'), 'BTVN Ester – Lipid', 'Đã nộp 28/10 · 8,0 điểm', '<span class="chip" data-sac="dung" data-nho>Xem lại bài</span>')}
    ${dong(oi('refresh', 'xam', 'nho'), 'BTVN Carbohydrate', 'Đã nộp 22/10 · 6,5 điểm · còn 2/3 lượt làm lại', chev)}
  </section>
</main>`, { nav: 2 })

// ═════ THÀNH TÍCH ═════
const doThi = () => { const v = [12, 24, 26, 18, 24, 0, 24, 30, 24, 25, 24, 28, 24, 14], W = 320, H = 120, x = (n) => 8 + (n * (W - 16)) / 13, y = (c) => H - 14 - (c / 32) * (H - 30)
  let d = `M${x(0)} ${y(v[0])}`; for (let n = 1; n < 14; n++) { const cx = (x(n - 1) + x(n)) / 2; d += ` C${cx} ${y(v[n - 1])} ${cx} ${y(v[n])} ${x(n)} ${y(v[n])}` }
  return `<div class="do-thi"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Số câu mỗi ngày trong 14 ngày, mức 24"><path class="vung-t" d="${d} L${x(13)} ${H - 14} L${x(0)} ${H - 14} Z"/><line class="muc-t" x1="0" x2="${W}" y1="${y(24)}" y2="${y(24)}"/><text class="nhan-muc" x="${W}" y="${y(24) - 6}" text-anchor="end">mức 24</text><path class="duong-t" d="${d}"/><circle class="cham-t" cx="${x(13)}" cy="${y(14)}" r="5"/><text x="${x(0)}" y="${H}">20/10</text><text x="${x(13)}" y="${H}" text-anchor="end">Hôm nay</text></svg></div>` }
P['thanh-tich'] = trang('Thành tích · chuỗi, biểu đồ 14 ngày, huy hiệu', `<main class="trang" data-rong-1>
  ${TIEU('Thành tích')}
  <section class="kinh the-p" style="display:grid;grid-template-columns:1fr 104px;align-items:center;gap:6px">
    <div><span style="font-size:14px;font-weight:800;color:var(--tr-chu-3)">CHUỖI NGÀY</span><div class="so-lon" style="color:var(--tr-sao-chu)">12<small>ngày</small></div><p class="mo" style="margin-top:6px">Mỗi ngày đủ mức giữ chuỗi · dài nhất 21 ngày</p></div>
    <span>${mol('vui')}</span>
  </section>
  <section class="kinh the-p"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><b>14 ngày gần nhất</b><span class="mo">12/14 ngày đủ mức</span></div>${doThi()}</section>
  <h2 class="tieu-nho">Huy hiệu <span>7/18</span></h2>
  <section class="kinh the-p"><div class="huy">${[['banh', 'flame', 'sao', '7 ngày liền', 'Đã có'], ['hoa', 'target', 'tin', 'Kiểm tra 8,5', 'Đã có'], ['co', 'check', 'dung', 'Đủ mức hôm nay', 'Đã có'], ['luc', 'atom', 'hs', '1 000 nguyên tử', '128 nữa'], ['song', 'wrench', 'sai', 'Sửa 50 lỗi', '12/50'], ['vien', 'trophy', '', '30 ngày liền', 'Còn 18 ngày']].map(([h, ic, c, t, p]) => `<figure${c ? '' : ' data-khoa'}><span class="hk" data-hinh="${h}"${c ? ` style="--c:var(--tr-${c === 'hs' ? 'hs-day' : c === 'sai' ? 'sai' : c === 'dung' ? 'dung-nut' : c + '-day'})"` : ''}>${i(c ? ic : 'lock')}</span><figcaption>${t}<small>${p}</small></figcaption></figure>`).join('')}</div></section>
  <section class="kinh ds">
    ${dong(oi('route', 'tin', 'nho'), 'Giải tuần', 'Hạng 4 trong nhóm')}
    ${dong(oi('users', 'dung', 'nho'), 'Học cùng bạn', 'Lửa đôi với Gia Bảo 3 ngày')}
    ${dong(oi('award', 'tin', 'nho'), 'Thử thách Kim cương', '10 câu khó của chuyên đề em đã vững')}
    ${dong(oi('gem', 'tim', 'nho'), 'Cửa hàng', 'Tinh thể và bình giữ chuỗi', '<span class="chip" data-k="tt" style="height:30px">' + i('gem') + '42</span>')}
  </section>
  <h2 class="tieu-nho">Điểm thầy đã công bố</h2>
  <section class="kinh ds">
    ${dong(oi('chart', 'tin', 'nho'), 'Ca kiểm tra', 'Điểm và lời giải ca đã công bố')}
    ${dong(oi('clip', 'chu-y', 'nho'), 'Kết quả bài đã nộp', 'Điểm và báo cáo đã công bố')}
  </section>
</main>`, { nav: 3 })

P['chuoi-ngay'] = trang('Chuỗi ngày · lịch tháng và bình giữ chuỗi', `<main class="trang" data-rong-1>
  ${CON('Chuỗi ngày')}
  <section class="kinh the-p" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px"><span style="width:96px">${mol('vui')}</span><div class="so-lon" style="color:var(--tr-sao-chu)">12<small>ngày</small></div><span class="mo">Chuỗi dài nhất 21 ngày</span></section>
  <section class="kinh the-p"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>Tháng 11</b><span class="mo">${i('flame')}</span></div>
    <div class="lich">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((t) => `<span class="t">${t}</span>`).join('')}${[27, 28, 29, 30, 31].map((n) => `<i data-d>${n}</i>`).join('')}<i data-d>1</i><i data-nay>2</i>${Array.from({ length: 28 }, (_, n) => `<i>${n + 3}</i>`).join('')}</div>
    <div style="display:flex;gap:14px;margin-top:12px;font-size:13px;font-weight:700;color:var(--tr-chu-3)"><span><i style="display:inline-block;width:12px;height:12px;border-radius:6px;background:var(--tr-sao-nhat);box-shadow:inset 0 0 0 2px var(--tr-sao);vertical-align:-1px"></i> đủ mức</span><span><i style="display:inline-block;width:12px;height:12px;border-radius:6px;box-shadow:inset 0 0 0 2px var(--tr-tin-day);vertical-align:-1px"></i> dùng bình giữ chuỗi</span></div></section>
  <section class="kinh hang" style="border-radius:26px;padding:14px">${oi('khien', 'tin', 'to')}<span class="giua"><b>Bình giữ chuỗi · 1</b><span class="mo">Tự dùng khi em lỡ một ngày</span></span><button class="nut" data-l="kinh" style="min-height:44px;font-size:15px">Mua thêm</button></section>
</main>`, { nav: 3 })

P['giai-tuan'] = trang('Giải tuần · bảng nhóm', `<main class="trang" data-rong-1>
  ${CON('Giải tuần')}
  <section class="kinh the-p" style="display:flex;align-items:center;gap:14px">${oi('trophy', 'sao', 'to')}<div style="flex:1"><b style="font-size:18px;display:block">Nhóm Bạc · tuần 45</b><span class="mo">Còn 4 ngày · top 5 lên nhóm Vàng</span></div></section>
  <section class="kinh ds xh">
    ${[['1', 'MT', 'Mai Thu', '512', 'sao'], ['2', 'QH', 'Quang Huy', '488', 'tin'], ['3', 'LP', 'Lan Phương', '430', 'dung'], ['4', 'AN', 'Hoài An (em)', '312', 'hs'], ['5', 'GB', 'Gia Bảo', '296', 'chu-y']].map(([h, v, t, d, c], n) => `<button class="hang"${n === 3 ? ' data-em' : ''}><span class="h">${h}</span><span class="ava-n" style="background:var(--tr-${c}-nhat);color:var(--tr-${c}-chu)">${v}</span><span class="giua"><b>${t}</b></span><span class="so-p">${d}</span></button>`).join('')}
    <div class="vung" data-k="len">Vùng lên nhóm</div>
    ${[['6', 'TN', 'Thảo Nhi', '270', 'tim'], ['7', 'ĐK', 'Đăng Khoa', '244', 'tin']].map(([h, v, t, d, c]) => `<button class="hang"><span class="h">${h}</span><span class="ava-n" style="background:var(--tr-${c === 'tim' ? 'hs' : c}-nhat);color:var(--tr-${c === 'tim' ? 'tim' : c}-chu)">${v}</span><span class="giua"><b>${t}</b></span><span class="so-p">${d}</span></button>`).join('')}
    <div class="vung" data-k="xuong">Vùng xuống nhóm</div>
    <button class="hang"><span class="h">12</span><span class="ava-n" style="background:var(--tr-mat-2);color:var(--tr-chu-2)">PL</span><span class="giua"><b>Phương Linh</b></span><span class="so-p">61</span></button>
  </section>
</main>`, { nav: 3 })

P['cua-hang'] = trang('Cửa hàng · tinh thể', `<main class="trang" data-rong-1>
  ${CON('Cửa hàng', `<span class="chip" data-k="tt" style="height:44px">${i('gem')}42</span>`)}
  <div class="bento">${[['khien', 'tin', 'Bình giữ chuỗi', 'Giữ chuỗi khi lỡ một ngày', '20'], ['sparkles', 'sao', 'Gấp đôi nguyên tử', '15 phút học nhân đôi', '30'], ['refresh', 'tim', 'Làm lại BTVN', 'Thêm một lượt làm lại', '40'], ['award', 'hs', 'Khung ảnh Kim cương', 'Hiện ở Giải tuần', '120']].map(([ic, c, t, p, g]) => `<div class="kinh ob" style="min-height:190px">${oi(ic, c, 'to')}<b>${t}</b><span class="mo">${p}</span><button class="nut" data-l="${+g > 42 ? 'kinh' : 'chinh'}" style="min-height:44px;font-size:15px;margin-top:8px;align-self:stretch"${+g > 42 ? ' disabled' : ''}>${i('gem')}${g}</button></div>`).join('')}</div>
</main>`, { nav: 3 })

P['hoc-cung-ban'] = trang('Học cùng bạn · lửa đôi', `<main class="trang" data-rong-1>
  ${CON('Học cùng bạn')}
  <section class="kinh the-p" style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center">
    <div style="display:flex;align-items:center;gap:6px"><span class="ava" data-hinh="banh" style="width:72px;height:72px"><b style="font-size:20px">AN</b></span><span class="oi" data-sac="sao" data-co="to" style="border-radius:50%">${i('flame')}</span><span class="ava" data-hinh="co" style="width:72px;height:72px"><b style="font-size:20px;color:var(--tr-sao-chu)">GB</b></span></div>
    <div class="so-lon" style="color:var(--tr-sao-chu);font-size:52px">3<small>ngày lửa đôi</small></div>
    <span class="mo">Hôm nay em đã đủ mức · Gia Bảo chưa học</span>
    <button class="nut" data-l="chinh" data-rong>${i('tay')}Gõ cửa Gia Bảo</button>
  </section>
  <h2 class="tieu-nho">Bạn học cùng</h2>
  <section class="kinh ds">
    ${dong('<span class="ava-n" style="background:var(--tr-tin-nhat);color:var(--tr-tin-chu)">QH</span>', 'Quang Huy', 'Lửa đôi 9 ngày · đã học hôm nay', '<span class="chip" data-sac="dung" data-nho>Đã học</span>')}
    ${dong('<span class="ava-n" style="background:var(--tr-dung-nhat);color:var(--tr-dung-chu)">LP</span>', 'Lan Phương', 'Mời học cùng', '<button class="chip" style="height:44px;padding:0 16px;color:var(--tr-hs-chu)">Mời</button>')}
  </section>
</main>`, { nav: 3 })

P['kim-cuong'] = trang('Thử thách Kim cương', `<main class="trang" data-rong-1>
  ${CON('Thử thách Kim cương')}
  <section class="kinh the-p" style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center">
    <div class="mh" style="width:150px"><svg viewBox="0 0 120 110" aria-hidden="true"><ellipse cx="60" cy="102" rx="38" ry="5" style="fill:var(--tr-phu);opacity:.3"/><path d="M28 18 H92 L114 44 L60 100 L6 44 Z" style="fill:var(--tr-tin)"/><path d="M28 18 L44 44 L60 18 L76 44 L92 18" style="fill:none;stroke:var(--tr-mat);stroke-width:2;opacity:.75"/><path d="M6 44 H114 M44 44 L60 100 L76 44" style="fill:none;stroke:var(--tr-mat);stroke-width:2;opacity:.75"/><path d="M28 18 L44 44 L6 44Z" style="fill:var(--tr-mat);opacity:.35"/><path d="M60 18 L76 44 H44Z" style="fill:var(--tr-mat);opacity:.2"/></svg></div>
    <b style="font-size:22px">10 câu khó · Ester – Lipid</b><span class="mo">Chuyên đề em đã vững. Sai không mất gì.</span>
    <div style="display:flex;gap:8px"><span class="chip" data-sac="tin">${i('dong_ho')}Khoảng 20 phút</span><span class="chip" data-sac="sao">${i('sao')}Mức Vận dụng cao</span></div>
    <button class="nut" data-l="tin" data-rong>Nhận thử thách</button>
  </section>
  <h2 class="tieu-nho">Chuyên đề mở được</h2>
  <section class="kinh ds">${dong(oi('award', 'tin', 'nho'), 'Ester – Lipid', 'Đã vững · chưa thử')}${dong(oi('lock', 'xam', 'nho'), 'Amino acid', 'Vững thêm 2 dạng để mở', '')}</section>
</main>`, { nav: 3 })

P['ket-qua'] = trang('Kết quả ca kiểm tra đã công bố', `<main class="trang" data-rong-1>
  ${CON('Kết quả ca kiểm tra')}
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;justify-content:space-between;align-items:end"><div><span class="mo">Ca 28/10 · Amino acid và peptide</span><div class="so-lon">8,25<small>/10</small></div></div><span style="width:84px">${mol('khen')}</span></div>
    ${[['Phần I · Trắc nghiệm', 15, 18, 'x'], ['Phần II · Đúng–sai', 13, 16, 'd'], ['Phần III · Trả lời ngắn', 4, 6, 'h']].map(([t, a, b, k]) => `<div><div style="display:flex;justify-content:space-between;font-size:15px;font-weight:750"><span>${t}</span><span>${a}/${b}</span></div><div class="vach-t" style="margin-top:6px">${`<i data-${k}></i>`.repeat(a)}${'<i></i>'.repeat(b - a)}</div></div>`).join('')}
  </section>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="nut" data-l="chinh">Xem đề &amp; lời giải</button><button class="nut" data-l="kinh">Hỏi thầy</button></div>
  <h2 class="tieu-nho">Các ca trước</h2>
  <section class="kinh ds">${dong(oi('chart', 'tin', 'nho'), 'Ca 21/10 · Carbohydrate', '7,50 điểm', chev)}${dong(oi('chart', 'tin', 'nho'), 'Ca 14/10 · Ester – Lipid', '6,75 điểm', chev)}</section>
</main>`, { nav: 3 })

// ═════ THÊM, THÔNG BÁO, A.I, ĐĂNG NHẬP, TẠM ĐÓNG ═════
P['them'] = trang('Thêm · điểm danh, ca kiểm tra, cài đặt, của em', `<main class="trang" data-rong-1>
  ${TIEU('Thêm')}
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:12px;box-shadow:inset 0 0 0 2px var(--tr-hs-day),var(--kinh-bong)" aria-label="Điểm danh buổi học">
    <div style="display:flex;gap:10px;align-items:center">${oi('qr')}<b style="font-size:18px">Điểm danh buổi học</b></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">${['2', '7', '4', '', '', ''].map((x, n) => `<span class="kinh" style="height:56px;border-radius:18px;display:grid;place-items:center;font-size:24px;font-weight:800;background:var(--kinh-dam)${n === 3 ? ';box-shadow:inset 0 0 0 2.5px var(--tr-hs-day)' : ''}">${x}</span>`).join('')}</div>
    <button class="nut" data-l="chinh" data-rong disabled>Điểm danh</button>
    <p class="mo" style="font-size:13.5px"><b>Buổi 02/11</b> · Gõ mã 6 số trên máy chiếu, hoặc quét mã QR</p>
  </section>
  <section class="kinh ds">
    ${dong(oi('clip', 'tin', 'nho'), 'Ca kiểm tra', 'Nhập mã ca thầy cho để vào làm')}
    ${dong(oi('chat', 'tim', 'nho'), 'Hỏi A.I Đỗ Đại Học', 'Chụp đề, hỏi bài, tâm sự')}
    ${dong(oi('bell', 'sai', 'nho'), 'Thông báo', '2 thông báo chưa đọc', '<span class="cham" style="position:static">2</span>')}
  </section>
  <h2 class="tieu-nho">Cài đặt</h2>
  <section class="kinh ds">
    <button class="hang" role="switch" aria-checked="true">${oi('loa', 'hs', 'nho')}<span class="giua"><b>Âm thanh</b></span><span class="cong" aria-hidden="true"></span></button>
    <button class="hang" role="switch" aria-checked="false">${oi('rung', 'hs', 'nho')}<span class="giua"><b>Rung</b></span><span class="cong" data-tat aria-hidden="true"></span></button>
    ${dong(oi('tai', 'dung', 'nho'), 'Cập nhật bài học', 'Tải bài mới thầy vừa giao')}
  </section>
  <h2 class="tieu-nho">Của em</h2>
  <section class="kinh ds">
    ${dong('<span class="ava" data-hinh="banh" style="width:40px;height:40px"><b style="font-size:13px">AN</b></span>', 'Nguyễn Hoài An', 'Số báo danh 120341 · Lớp 12A3', '')}
    ${dong(oi('pen', 'chu-y', 'nho'), 'Bài gia đình giao', '')}
    ${dong(oi('users', 'sao', 'nho'), 'Thông tin từ gia đình', '')}
    ${dong(oi('ra', 'xam', 'nho'), 'Đăng xuất', '', '')}
  </section>
</main>`, { nav: 4 })

P['thong-bao'] = trang('Thông báo · tấm trượt', `<main class="trang">${DAU()}${hero({ da: 14, muc: 24, chang: '6,6,6,6', dong: 'Còn 10 câu nữa là dung dịch đổi màu.' })}</main>
<div class="phu-mo"></div>
<section class="kinh tam" aria-label="Thông báo" style="background:var(--kinh-dam)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:22px">Thông báo</b><button class="nut" data-l="chu" style="min-height:44px;font-size:15px">Đọc hết</button></div>
  <div class="ds" style="padding:0">
    ${dong(oi('pen', 'chu-y', 'nho'), 'Thầy giao Bài tập về nhà mới', 'BTVN Amino acid · đề 2 · hạn 05/11 · 1 giờ trước', '<span class="cham" style="position:static;min-width:10px;height:10px;padding:0"></span>')}
    ${dong(oi('chart', 'tin', 'nho'), 'Đã có điểm ca 28/10', '8,25 điểm · hôm qua', '<span class="cham" style="position:static;min-width:10px;height:10px;padding:0"></span>')}
    ${dong(oi('tay', 'sao', 'nho'), 'Quang Huy gõ cửa em', 'Học cho đủ mức để giữ lửa đôi · 2 ngày trước', '')}
  </div></section>`, { thanh: false })

P['ai'] = trang('Hỏi A.I Đỗ Đại Học · ảnh đề thành nhãn dán', `<div class="lam" style="max-width:760px;margin:0 auto"><header class="lam-tren">${oi('chat', 'tim')}<span style="flex:1"><b style="display:block;font-size:17px">A.I Đỗ Đại Học</b><span class="mo" style="color:var(--tr-dung-chu);font-weight:700">● Đang trực, nhắn gì cũng được</span></span><button class="nut-tron kinh" aria-label="Đóng">${i('x')}</button></header>
<div class="lam-than" style="gap:12px">
  <p class="kinh bb" data-ai>Chào An! Có gì cứ nói với tôi nhé.</p>
  <div class="sticker" role="img" aria-label="Ảnh đề em gửi"><div class="giay"><b>Câu 12 · ảnh đề</b><i></i><i style="width:86%"></i><i style="width:92%"></i><i style="width:58%"></i></div></div>
  <p class="bb" data-em>Câu này tính khối lượng muối kiểu gì vậy?</p>
  <p class="kinh bb" data-ai>Bạn vẽ sơ đồ cột dọc nhé: glycine → muối ClH<sub>3</sub>N–CH<sub>2</sub>–COOH. Bảo toàn N: n<sub>muối</sub> = n<sub>glycine</sub> = 0,1 mol. Một phép tính: m = 0,1 × 111,5 = 11,15 gam.</p>
  <p class="mo" style="font-weight:700">Tôi đang nghe đây…</p>
  <div class="chan" style="display:flex;flex-direction:column;gap:8px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[['camera', 'Chụp ảnh đề'], ['anh', 'Chọn ảnh có sẵn'], ['dan', 'Dán đề bài']].map(([k, t]) => `<button class="kinh chip" style="height:56px;flex-direction:column;gap:2px;justify-content:center;font-size:13px;border-radius:20px;color:var(--tr-chu-2)">${i(k)}${t}</button>`).join('')}</div>
    <div class="kinh" style="display:flex;align-items:center;gap:8px;padding:6px 6px 6px 18px;border-radius:30px"><span class="mo" style="flex:1;font-size:16px">Nhắn gì cũng được…</span><button class="nut" data-l="chinh" style="width:48px;min-height:48px;padding:0" aria-label="Gửi">${i('gui')}</button></div>
    <p class="mo" style="text-align:center;font-size:13px">Hôm nay bạn còn 18/20 lượt nhắn</p>
  </div>
</div></div>`, { thanh: false, mot: true })

P['dang-nhap'] = trang('Đăng nhập học sinh', `<main class="trang" style="min-height:100dvh;justify-content:center;max-width:440px;padding-bottom:24px">
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:120px">${mol('chao')}</span><img src="../../../public/logo-hs-v3.svg" alt="" width="44" height="44"><h1 style="font-size:30px;font-weight:800;letter-spacing:-.02em">Hành trình giỏi Hóa</h1><span class="mo">Thầy Đỗ Đại Học</span></div>
  <section class="kinh the-p" style="display:flex;flex-direction:column;gap:14px">
    <label class="o-nhap">Số báo danh (SBD)<input data-dang inputmode="numeric" placeholder="Ví dụ: 110234 hoặc 12026" value="120341"></label>
    <label class="o-nhap">Mật khẩu <small>(Lần đầu chưa có để trống để đặt)</small><input type="password" value="matkhau1"></label>
    <button class="nut" data-l="chinh" data-rong style="min-height:58px">Đăng nhập</button>
  </section>
  <p class="mo" style="text-align:center">Quên mật khẩu: nhắn thầy để đặt lại.</p>
</main>`, { thanh: false })

P['tam-dong'] = trang('Thầy tạm đóng app', `<main class="trang" style="min-height:100dvh;justify-content:center;max-width:440px">
  <section class="kinh the-p" style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:28px 22px"><span style="width:130px">${mol('nghi')}</span><b style="font-size:24px">Thầy đang tạm đóng app</b><span class="mo" style="font-size:16px">Em nghỉ một chút nhé. App mở lại thì học tiếp như cũ.</span>
    <button class="nut" data-l="tin" data-rong>Vào ca kiểm tra đang mở để nộp</button></section>
</main>`, { thanh: false })

for (const [ten, html] of Object.entries(P)) writeFileSync(new URL(`./${ten}.html`, import.meta.url), html)
console.log(Object.keys(P).length, 'màn:', Object.keys(P).join(' '))
