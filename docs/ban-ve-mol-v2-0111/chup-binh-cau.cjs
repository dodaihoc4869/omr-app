// Chụp Mol BÌNH CẦU từ MÃ THẬT (01/11 tối: «giữ hình cầu, cảm xúc dễ thương, thêm 6,022, phối màu mịn»):
//   node docs/ban-ve-mol-v2-0111/chup-binh-cau.cjs  ⇒ anh/binh-cau-*.jpg (≤ 150 KB)
// Đóng gói src/components/linh-vat/mol-dong.ts (esbuild) + CSS thật (tokens.css, trong.css, trong-hs-mau.css, mol.css) dưới <html data-trong="hs">;
// Mol CŨ lấy từ origin/main (git show) để đặt cạnh. Sáng / tối = prefers-color-scheme của Chromium (token tự đổi như trong app).
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const { execFileSync } = require('child_process')
const path = require('path'), fs = require('fs'), os = require('os')
const GOC = path.resolve(__dirname, '../..'), RA = path.join(__dirname, 'anh'), TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'mol-'))
fs.mkdirSync(RA, { recursive: true })
const doc = (f) => fs.readFileSync(path.join(GOC, f), 'utf8')
const goi = (tep, ten) => esbuild.buildSync({ entryPoints: [tep], bundle: true, format: 'iife', globalName: ten, loader: { '.css': 'empty' }, write: false, absWorkingDir: GOC }).outputFiles[0].text
// Mol mới (cây làm việc) + Mol cũ (origin/main)
const jsMoi = goi(path.join(GOC, 'src/components/linh-vat/mol-dong.ts'), 'MOL')
fs.mkdirSync(path.join(TAM, 'linh-vat'), { recursive: true })
fs.writeFileSync(path.join(TAM, 'linh-vat/mol-dong.ts'), execFileSync('git', ['show', 'origin/main:src/components/linh-vat/mol-dong.ts'], { cwd: GOC, encoding: 'utf8' }).replace("import '../../styles/mol.css'\n", '').replace(/from '\.\/lua-dong'/, `from '${path.join(GOC, 'src/components/linh-vat/lua-dong')}'`))
const jsCu = goi(path.join(TAM, 'linh-vat/mol-dong.ts'), 'MOLCU')
const cssCu = execFileSync('git', ['show', 'origin/main:src/styles/mol.css'], { cwd: GOC, encoding: 'utf8' }).replace(/\.mol-svg/g, '.cu .mol-svg').replace(/html\.may-yeu \.cu /g, 'html.may-yeu ')
const font = (w, f) => `@font-face{font-family:'DDH Rounded';font-weight:${w};src:url(file://${path.join(GOC, 'src/styles/phong-ddh', f)}) format('woff2')}`
const css = [doc('src/styles/tokens.css'), doc('src/styles/trong.css'), doc('src/styles/trong-hs-mau.css'), doc('src/styles/mol.css'), cssCu,
  doc('src/styles/bi.css').replace(/@import[^;]*;/g, ''), doc('src/styles/trong-hs.css').replace(/@import[^;]*;/g, ''),
  font('100 549', 'ddh-rounded-de-vietnamese.woff2'), font('100 549', 'ddh-rounded-de-latin.woff2'), font('550 1000', 'ddh-rounded-dam-vietnamese.woff2'), font('550 1000', 'ddh-rounded-dam-latin.woff2'), `
/* Ba tổ hợp màu ĐÃ THỬ (chỉ trong trang chụp — bản build dùng tổ hợp 1 trong mol.css) */
.thu2 .mol-svg{--mol-x:var(--tr-tin);--mol-x-sang:color-mix(in oklab,var(--tr-tin) 45%,var(--btg-chu-doan-dam));--mol-x-toi:var(--tr-tin-day);
  --mol-vanh:color-mix(in oklab,var(--tr-tin-day) 62%,var(--btg-chu-doan));--mol-vien:color-mix(in oklab,var(--tr-tin-day) 45%,var(--btg-chu-doan));
  --mol-nuoc:var(--tr-tim);--mol-nuoc-sang:color-mix(in oklab,var(--tr-tim) 50%,var(--btg-chu-doan-dam));--mol-nuoc-toi:var(--tr-tim-day)}
.thu3 .mol-svg{--mol-x:var(--tr-hs);--mol-x-sang:color-mix(in oklab,var(--tr-hs) 42%,var(--btg-chu-doan-dam));--mol-x-toi:var(--tr-hs-nut);
  --mol-nuoc:var(--tr-chu-y);--mol-nuoc-sang:color-mix(in oklab,var(--tr-sao) 50%,var(--tr-chu-y));--mol-nuoc-toi:var(--tr-chu-y-day)}
*{box-sizing:border-box} body{margin:0;background:var(--tr-nen);color:var(--tr-chu);font:500 15px/1.45 'DDH Rounded',sans-serif;-webkit-font-smoothing:antialiased}
main{width:1200px;padding:20px;display:flex;flex-direction:column;gap:18px}
.khoi{background:var(--tr-mat);border:2px solid var(--tr-vien);border-radius:24px;padding:18px 18px 20px}
.khoi h2{margin:0 0 4px;font-size:19px;font-weight:800} .khoi p{margin:0 0 12px;color:var(--tr-chu-2);font-size:14px}
.luoi{display:grid;gap:8px} figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border-radius:18px;background:var(--tr-nen);font-size:13.5px;font-weight:800;color:var(--tr-chu-2);text-align:center}
figure small{font-weight:600;font-size:11.5px;color:var(--tr-chu-3)} .moi-nhan{color:var(--tr-tim)}
.bi{display:inline-block} .bi > svg{display:block;width:100%;height:100%}
.nhan-hang{font-size:15px;font-weight:800;color:var(--tr-chu-2);align-self:center}
.toi-khoi{background:var(--tr-nen)}
/* điện thoại Lộ trình + bong bóng (giống bản vẽ mol-v2.html) */
.dt{width:390px;height:844px;position:relative;overflow:hidden;background:var(--tr-nen)}
.dt .tren{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:2px solid var(--tr-vien)}
.dt .o{display:flex;align-items:center;gap:5px;font-size:16.5px;font-weight:800} .dt .o svg{width:23px;height:23px}
.dt .lua{color:var(--tr-chu-y)} .dt .nt{color:var(--tr-nguyen-tu-so)} .dt .tt{color:var(--tr-tim-chu)}
.dt .vong{width:44px;height:44px;border-radius:50%;padding:4px;background:conic-gradient(var(--tr-hs) 62%,var(--tr-mat-3) 0)}
.dt .vong > span{width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--tr-hs-nhat);display:block}
.dt .hero{margin:14px 16px 0;padding:16px 18px 20px;border-radius:20px;background:var(--tr-hs-nut);box-shadow:inset 0 -6px 0 var(--tr-hs-day);color:var(--tr-hs-tren)}
.dt .hero small{display:block;font-size:13px;font-weight:700;letter-spacing:.04em} .dt .hero b{display:block;font-size:26px;font-weight:800;margin:2px 0 12px}
.dt .thanh{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:800}
.dt .thanh i{flex:1;height:12px;border-radius:99px;background:color-mix(in srgb,var(--tr-hs-tren) 30%,transparent);position:relative;overflow:hidden}
.dt .thanh i::after{content:'';position:absolute;inset:0 71% 0 0;border-radius:99px;background:var(--tr-hs-tren)}
.dt .chang{position:absolute;width:72px;height:64px;border-radius:50%;display:grid;place-items:center;color:var(--tr-hs-tren)}
.dt .xong{background:var(--tr-hs-nut);box-shadow:inset 0 -6px 0 var(--tr-hs-day)} .dt .khoa{background:var(--tr-mat-3);box-shadow:inset 0 -6px 0 var(--tr-vien-2)}
.dt .dang{width:80px;height:74px;background:var(--tr-hs-nut);box-shadow:inset 0 -7px 0 var(--tr-hs-day)} .dt .chang svg{width:30px;height:30px}
.dt .vong-dang{position:absolute;width:104px;height:104px;border-radius:50%;border:7px dashed var(--tr-mat-3)}
.dt .bat-dau{position:absolute;padding:8px 16px;border-radius:14px;background:var(--tr-mat);border:2px solid var(--tr-vien);color:var(--tr-dung-chu);font-weight:800;font-size:16px}
.dt .chu-nen{position:absolute;color:var(--tr-mat-3);font-size:22px;font-weight:700}
.dt .day{position:absolute;left:0;right:0;bottom:0;height:68px;background:var(--tr-mat);border-top:2px solid var(--tr-vien);display:flex;justify-content:space-around;align-items:center}
.dt .day span{width:56px;height:44px;border-radius:14px;display:grid;place-items:center;color:var(--tr-chu-3)} .dt .day span.dang2{background:var(--tr-hs-nhat);color:var(--tr-hs-nut)}
.bb{--bb-nen:var(--tr-sai-nhat);--bb-vien:color-mix(in oklab,var(--tr-sai) 60%,var(--tr-chu-y));--bb-chu:var(--tr-sai-chu);position:absolute;max-width:220px;padding:8px 13px 9px;border-radius:16px;
  border:2px solid var(--bb-vien);background:var(--bb-nen);color:var(--bb-chu);font:700 14.5px/1.32 'DDH Rounded',sans-serif;box-shadow:0 3px 0 color-mix(in srgb,var(--bb-vien) 40%,transparent)}
.bb::after{content:'';position:absolute;left:var(--duoi,50%);bottom:-8px;width:13px;height:13px;margin-left:-7px;background:var(--bb-nen);border-right:2px solid var(--bb-vien);border-bottom:2px solid var(--bb-vien);border-bottom-right-radius:4px;transform:rotate(45deg)}
`].join('\n')
const MAT = [['vui', 'vui'], ['khen', 'khen'], ['chao', 'chào'], ['nghi', 'nghĩ'], ['ngac', 'ngạc nhiên'], ['buon', 'buồn'], ['ngu', 'ngủ'], ['doi', 'dỗi · 2'], ['buc', 'bực · 3'], ['cau', 'cáu · 4'], ['ratCau', 'rất cáu · 5'],
  ['nguong', 'ngượng', 1], ['me', 'mê', 1], ['nhay', 'vui nhảy', 1], ['tuTin', 'tự tin', 1]]
const html = `<!doctype html><html lang="vi" data-trong="hs"><head><meta charset="utf-8"><style>${css}</style></head><body><main id="m"></main><div id="dt"></div>
<script>${jsMoi}</script><script>${jsCu}</script><script>
const bi = (m, w, o = {}) => '<span class="bi lua' + (o.cu ? ' cu' : '') + '"' + (w < 64 ? ' data-nho' : '') + ' style="width:' + w + 'px;height:' + Math.round(w * 1.15) + 'px"><svg class="lua-svg mol-svg" viewBox="0 -26 200 230" data-mat="' + m + '"' + (o.bo ? ' data-mol-mau="' + o.bo + '"' : '') + ' data-tinh>' + (o.cu ? MOLCU.svgMol(m) : MOL.svgMol(m)) + '</svg></span>'
const nua = (m, w) => '<span class="bi lua"' + (w < 64 ? ' data-nho' : '') + ' style="width:' + w + 'px;height:' + w + 'px;overflow:hidden;border-radius:50%"><svg class="lua-svg mol-svg" viewBox="5 6 190 190" data-mat="' + m + '" data-tinh>' + MOL.svgMol(m) + '</svg></span>'
const MAT = ${JSON.stringify(MAT)}
const q = new URLSearchParams(location.search)
const m = document.getElementById('m')
const cu5 = ['vui', 'khen', 'buon', 'cau', 'ratCau']
m.innerHTML =
 '<section class="khoi" id="cu-moi"><h2>Mol cũ (đang chạy, #713) · Mol mới (mã thật nhánh này)</h2><p>Giữ hình cầu + cổ bình. Mới: thân chàm sáng mịn, mắt tròn to, mí + mày nói cảm xúc, má hồng phấn, 6,022·10²³ trắng nổi ở dung dịch dưới bụng, giận đổi sắc + nút bấc bung trên lửa.</p>' +
 '<div class="luoi" style="grid-template-columns:90px repeat(5,1fr)"><span class="nhan-hang">Cũ</span>' + cu5.map((k) => '<figure>' + bi(k, 150, { cu: 1 }) + k + '</figure>').join('') +
 '<span class="nhan-hang">Mới</span>' + cu5.map((k) => '<figure>' + bi(k, 150) + k + '</figure>').join('') + '</div></section>' +
 '<section class="khoi" id="cam-xuc"><h2>Mol bình cầu · 11 mặt + 4 mặt phương án</h2><p>Cười = mí dưới cong; chán / giận = mí trên sụp nghiêng; mày mềm; miệng nhỏ. Giận không răng. Cáu, rất cáu: đổi sắc đỏ sẫm, tròng hồng đỏ, nút bấc bung trên lửa, dung dịch đỏ dâng.</p>' +
 '<div class="luoi" style="grid-template-columns:repeat(8,1fr)">' + MAT.map(([k, t, moi]) => '<figure>' + bi(k, 128) + '<span' + (moi ? ' class="moi-nhan"' : '') + '>' + t + (moi ? ' · mới' : '') + '</span></figure>').join('') + '</div></section>' +
 '<section class="khoi" id="mau"><h2>Ba tổ hợp màu đã thử (token có sẵn)</h2><p>1 · chàm sáng --tr-hs-nut + ngọc lam --tr-tin (CHỌN) · 2 · ngọc lam --tr-tin + hồng --tr-tim · 3 · chàm nhạt --tr-hs + cam --tr-chu-y (gần Mol cũ).</p>' +
 '<div class="luoi" style="grid-template-columns:repeat(3,1fr)">' + ['', 'thu2', 'thu3'].map((c, i) => '<figure class="' + c + '"><div style="display:flex;gap:4px">' + ['vui', 'khen', 'cau'].map((k) => bi(k, 118)).join('') + '</div>' + ['1 · chàm sáng + ngọc lam (chọn)', '2 · ngọc lam + hồng', '3 · chàm nhạt + cam'][i] + '</figure>').join('') + '</div></section>' +
 '<section class="khoi" id="bo-mau"><h2>Ba bộ màu đổi mỗi ngày (theo ngày Việt Nam, qua 00:00 đổi) · nền ' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'tối' : 'sáng') + '</h2>' +
 '<p>Bộ = số ngày VN mod 3 (src/lib/mau-mol-ngay.ts) · cùng ngày mọi máy cùng màu (giờ máy chủ). Giận đỏ sẫm dùng chung.</p><div class="luoi" style="grid-template-columns:repeat(3,1fr)">' +
 [['0', 'Bộ 0 · chàm sáng + ngọc lam'], ['1', 'Bộ 1 · ngọc lam + hồng'], ['2', 'Bộ 2 · chàm nhạt + cam']].map(([b, t]) => '<figure><div style="display:flex;gap:4px;align-items:flex-end">' + ['vui', 'khen', 'buon', 'cau'].map((k) => bi(k, 92, { bo: b })).join('') + '</div>' + t + '</figure>').join('') + '</div></section>' +
 '<section class="khoi" id="so"><h2>Cận cảnh 6,022·10²³ ở dung dịch dưới bụng · vui / cáu / rất cáu</h2><p>Chữ trắng 88 % + bóng mảnh, cong theo đáy cầu, đứng yên khi dung dịch đỏ dâng. Hàng dưới: cỡ thật 48 (ẩn chữ) / 64 / 96 px.</p>' +
 '<div class="luoi" style="grid-template-columns:repeat(3,1fr)">' + ['vui', 'cau', 'ratCau'].map((k) => '<figure><span class="bi lua" style="width:330px;height:160px;overflow:hidden;border-radius:14px"><svg class="lua-svg mol-svg" viewBox="38 128 124 60" data-mat="' + k + '" data-tinh style="width:330px;height:160px;overflow:hidden">' + MOL.svgMol(k) + '</svg></span><div style="display:flex;align-items:flex-end;gap:12px;margin-top:6px">' + [48, 64, 96].map((w) => bi(k, w)).join('') + '</div>' + k + '</figure>').join('') + '</div></section>' +
 '<section class="khoi" id="co-nho"><h2>Cỡ nhỏ · 28 / 40 / 48 / 64 px (toàn hình) và vòng 40 px · nền ' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'tối' : 'sáng') + '</h2><p>Chữ 6,022·10²³ ở bụng hiện từ 64 px (đã thử 48 px: chữ cao ~3,5 px, không đọc được ⇒ ẩn).</p>' +
 '<div class="luoi" style="grid-template-columns:repeat(5,1fr)">' + ['vui', 'khen', 'buon', 'cau', 'ratCau'].map((k) => '<figure><div style="display:flex;align-items:flex-end;gap:10px">' + [28, 40, 48, 64].map((w) => bi(k, w)).join('') + '<span class="vong" style="display:inline-block;padding:3px;border-radius:50%;background:var(--tr-hs)">' + nua(k, 40) + '</span></div>' + k + '</figure>').join('') + '</div></section>'
// Điện thoại Lộ trình + BONG BÓNG THẬT trên đầu Mol (markup + CSS như TrongHs.tsx / trong-hs.css; tự căn như LoiBi: rộng ≤ 280, không tràn mép đường đi)
const kiem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
const DT = { cau: ['cau', 4, 'cau', 'Không biết học đối phó có lợi ích gì?'], cau5: ['ratCau', 5, 'ratCau', 'Tại sao phải đối phó với một giáo viên top 3 miền Bắc dạy Hoá?'],
  doi: ['doi', 2, 'doi', 'Để học giỏi Hoá cần 2 điều kiện: hiểu tiếng Việt và giỏi toán lớp 4.'], cn: ['vui', 0, 'vui', '«Tập trung vào quá trình, kết quả là tất yếu.»', 1] }
const [mat, cap, cx, cau, laCn] = DT[q.get('dt')] || DT.cau
const MW = 104, MX = 236, MY = 380, tamX = MX + MW / 2, tamY = MY + MW * 1.15 / 2, L = 16, Rp = 374
const rong = Math.round(Math.max(150, Math.min(280, (Rp - L) - 16))), trai = Math.round(Math.min(Math.max(tamX - rong / 2, L + 8), Rp - 8 - rong) - tamX), duoi = Math.round(Math.min(Math.max(-trai - 20, 18), rong - 18))
document.getElementById('dt').innerHTML = '<div class="dt"><div class="tren"><span class="o lua">🔥12</span><span class="o nt">⚛ 340</span><span class="o tt">★ 5</span><span class="vong">' + nua(mat, 36) + '</span></div>' +
 '<div class="hero"><small>CHƯƠNG 1 · HOÁ 12</small><b>Este – Lipid</b><div class="thanh"><i></i>2/7 chặng</div></div>' +
 '<span class="chu-nen" style="left:24px;top:330px">n = m / M</span><span class="chu-nen" style="left:30px;top:690px">CaCO₃ → CaO + CO₂</span><span class="chu-nen" style="left:230px;top:620px">pV = nRT</span>' +
 '<span class="chang xong" style="left:150px;top:268px">' + kiem + '</span><span class="chang xong" style="left:76px;top:420px">' + kiem + '</span>' +
 '<span class="vong-dang" style="left:58px;top:556px"></span><span class="chang dang" style="left:70px;top:570px">★</span><span class="bat-dau" style="left:52px;top:500px">BẮT ĐẦU</span>' +
 '<span class="chang khoa" style="left:126px;top:700px">🔒</span>' +
 '<div style="position:absolute;left:' + MX + 'px;top:' + MY + 'px">' + bi(mat, MW) + '</div>' +
 '<span class="da-lv-loi-o"' + (cap >= 4 ? ' data-cap="' + cap + '"' : '') + ' style="left:' + tamX + 'px;top:' + tamY + 'px;transform:none;--rong:' + rong + 'px;--trai:' + trai + 'px;--duoi:' + duoi + 'px">' +
 '<div class="bi-loi-boc" data-ben=""><div class="bi-loi" data-khong-bi=""><p class="bi-loi-bong"' + (cap >= 4 ? ' data-cap="' + cap + '"' : '') + ' data-cx="' + cx + '"' + (laCn ? ' data-chan-ngon=""' : '') + '><span aria-hidden="true">' + cau + '<span class="bi-loi-con"></span></span></p></div></div></span>' +
 '<nav class="day"><span class="dang2">◎</span><span>✎</span><span>🏆</span><span>☰</span></nav></div>'
if (q.has('dt')) m.style.display = 'none'; else document.getElementById('dt').style.display = 'none'
// NÉ NÚT (cùng thuật toán LoiBi trong TrongHs.tsx): bong bóng giao nút chặng / nhãn ⇒ thu hẹp về phía Mol (≥ 130 px), không được thì nâng lên trên nút
if (q.has('dt')) {
  const neo = document.querySelector('.da-lv-loi-o'), bb = neo.querySelector('.bi-loi-bong'), k = document.querySelector('.dt').getBoundingClientRect()
  const r = { left: k.left + L, right: k.left + Rp, top: k.top + 205, width: Rp - L }, o = neo.getBoundingClientRect()
  const dat = (rong, trai, nang = 0) => { neo.style.setProperty('--rong', rong + 'px'); neo.style.setProperty('--trai', trai + 'px'); neo.style.setProperty('--duoi', Math.round(Math.min(Math.max(-trai - 20, 18), rong - 18)) + 'px'); neo.style.setProperty('--nang', nang + 'px') }
  const nut = Array.from(document.querySelectorAll('.dt .chang, .dt .bat-dau')).map((e) => e.getBoundingClientRect())
  const giao = () => { const b = bb.getBoundingClientRect(); return nut.filter((n) => n.left < b.right && n.right > b.left && n.top < b.bottom && n.bottom > b.top) }
  let g = giao()
  if (g.length) {
    const phai = o.left > r.left + r.width / 2, mep = phai ? Math.max(...g.map((n) => n.right)) + 8 : Math.min(...g.map((n) => n.left)) - 8
    const rongHep = Math.round(phai ? r.right - 8 - mep : mep - (r.left + 8))
    let xong = false
    const b = bb.getBoundingClientRect(), nang = Math.ceil(b.bottom - (Math.min(...g.map((n) => n.top)) - 8))
    if (nang > 0 && b.top - nang >= r.top) { dat(rong, trai, nang); xong = !giao().length }
    if (!xong) { dat(rong, trai); if (rongHep >= 130) { dat(rongHep, Math.round((phai ? mep : r.left + 8) - o.left)); xong = !giao().length } }
    if (!xong) dat(rong, trai)
    document.body.dataset.ne = xong ? 'da-ne' : 'giu-mac-dinh'
  } else document.body.dataset.ne = 'khong-giao'
}
</script></body></html>`
const TRANG = path.join(TAM, 'binh-cau.html'); fs.writeFileSync(TRANG, html)
async function luu(chup, ten) {
  for (let q = 86; ; q -= 6) {
    const buf = await chup({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q <= 32) { fs.writeFileSync(path.join(RA, ten), buf); return `${ten} ${Math.round(buf.length / 1024)} KB q${q}` }
  }
}
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const kq = []
  const mo = async (toi, hoi = '', w = 1240, dsf = 1.4) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: dsf, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce' })
    const loi = []; p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto('file://' + TRANG + hoi); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
    if (loi.length) console.log('LỖI', loi)
    return p
  }
  const s = await mo(false)
  kq.push(await luu((o) => s.locator('#cu-moi').screenshot(o), 'binh-cau-cu-moi.jpg'))
  kq.push(await luu((o) => s.locator('#cam-xuc').screenshot(o), 'binh-cau-cam-xuc-sang.jpg'))
  kq.push(await luu((o) => s.locator('#mau').screenshot(o), 'binh-cau-mau.jpg'))
  kq.push(await luu((o) => s.locator('#so').screenshot(o), 'binh-cau-so-can-canh.jpg'))
  kq.push(await luu((o) => s.locator('#bo-mau').screenshot(o), 'binh-cau-3-bo-mau-sang.jpg'))
  await s.close()
  const t = await mo(true)
  kq.push(await luu((o) => t.locator('#cam-xuc').screenshot(o), 'binh-cau-cam-xuc-toi.jpg'))
  kq.push(await luu((o) => t.locator('#bo-mau').screenshot(o), 'binh-cau-3-bo-mau-toi.jpg'))
  await t.close()
  // cỡ nhỏ: ghép sáng + tối thành một ảnh (chụp hai lượt, xếp chồng bằng trang phụ)
  const anh = []
  for (const toi of [false, true]) { const p = await mo(toi, '', 1240, 2); anh.push((await p.locator('#co-nho').screenshot({ type: 'png' })).toString('base64')); await p.close() }
  const g = await b.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1 })
  await g.setContent(`<body style="margin:0"><div id="g" style="display:flex;flex-direction:column;width:1240px">${anh.map((a) => `<img src="data:image/png;base64,${a}" style="width:1240px">`).join('')}</div></body>`)
  await g.waitForTimeout(100)
  kq.push(await luu((o) => g.locator('#g').screenshot(o), 'binh-cau-co-nho.jpg'))
  await g.close()
  for (const [k, toi, ten] of [['cau', true, 'binh-cau-lo-trinh-toi.jpg'], ['cau5', true, 'binh-cau-lo-trinh-cap5-toi.jpg'], ['doi', false, 'binh-cau-lo-trinh-doi-sang.jpg'], ['cn', false, 'binh-cau-lo-trinh-chan-ngon-sang.jpg']]) {
    const d = await mo(toi, '?dt=' + k, 390, 2)
    kq.push(await luu((o) => d.locator('.dt').screenshot(o), ten) + ' · ' + await d.evaluate(() => document.body.dataset.ne))
    await d.close()
  }
  console.log(kq.join('\n'))
  await b.close()
})()
