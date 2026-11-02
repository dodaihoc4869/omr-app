// TRANG THỬ MOL SỐNG ĐỘNG từ MÃ THẬT (02/11): đóng gói src/components/linh-vat/mol-dong.ts (esbuild) + CSS thật (tokens.css, trong.css, trong-hs-mau.css,
// lua.css, mol.css) dưới <html data-trong="hs"> ⇒ một tệp HTML tự đủ. Dùng cho ảnh nghiệm thu, video 15 giây và đo khung hình riêng của Mol (do-mol.cjs).
//   require('./trang-mol.cjs').dungTrang() ⇒ đường dẫn tệp HTML (thư mục tạm). Trang có:
//     #luoi  — 15 mặt (11 mặt + 4 phương án) ở chế độ máy thường, cỡ 120 px;
//     #san   — một Mol to (240 px, kéo được) + Mol cạnh (104 px) + Mol nhỏ 34 px (khung tròn) để quay video / đo;
//     window.MOLTHU = { mol, dat(cam|cap), cham(), hang } điều khiển từ Playwright. ?che=gon|tinh|day-du chọn chế độ cho #san.
const esbuild = require('esbuild')
const path = require('path'), fs = require('fs'), os = require('os')
const GOC = path.resolve(__dirname, '../..')
const doc = (f) => fs.readFileSync(path.join(GOC, f), 'utf8')
/** `o.moDong` / `o.molCss`: thay mã Mol (vd. bản trước của origin/main để đo so sánh). */
function dungTrang(o = {}) {
  const js = esbuild.buildSync({ entryPoints: [o.moDong || path.join(GOC, 'src/components/linh-vat/mol-dong.ts')], bundle: true, format: 'iife', globalName: 'MOL', loader: { '.css': 'empty' }, write: false, absWorkingDir: GOC }).outputFiles[0].text
  const font = (w, f) => `@font-face{font-family:'DDH Rounded';font-weight:${w};src:url(file://${path.join(GOC, 'src/styles/phong-ddh', f)}) format('woff2')}`
  const css = [doc('src/styles/tokens.css'), doc('src/styles/trong.css'), doc('src/styles/trong-hs-mau.css'), doc('src/styles/lua.css'), o.molCss || doc('src/styles/mol.css'),
    font('100 549', 'ddh-rounded-de-vietnamese.woff2'), font('100 549', 'ddh-rounded-de-latin.woff2'), font('550 1000', 'ddh-rounded-dam-vietnamese.woff2'), font('550 1000', 'ddh-rounded-dam-latin.woff2'), `
*{box-sizing:border-box} body{margin:0;background:var(--tr-nen);color:var(--tr-chu);font:500 15px/1.45 'DDH Rounded',sans-serif;-webkit-font-smoothing:antialiased}
main{padding:16px;display:flex;flex-direction:column;gap:14px}
.khoi{background:var(--tr-mat);border:2px solid var(--tr-vien);border-radius:22px;padding:14px 14px 16px}
.khoi h2{margin:0 0 4px;font-size:18px;font-weight:800} .khoi p{margin:0 0 10px;color:var(--tr-chu-2);font-size:13.5px}
.luoi{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 2px 6px;border-radius:16px;background:var(--tr-nen);font-size:13px;font-weight:800;color:var(--tr-chu-2)}
figure small{font-weight:600;font-size:11px;color:var(--tr-chu-3)}
#san{position:relative;display:grid;grid-template-columns:1fr auto;align-items:end;gap:10px;padding-top:40px;min-height:380px;touch-action:none}
#san .to{justify-self:center}
#san .phu{display:flex;flex-direction:column;align-items:center;gap:16px}
.ten{position:absolute;left:16px;top:12px;font-weight:800;font-size:15px;color:var(--tr-hs-chu);background:var(--tr-hs-nhat);border:2px solid var(--tr-hs);border-radius:999px;padding:2px 12px}
.vong{width:44px;height:44px;border-radius:50%;padding:4px;background:conic-gradient(var(--tr-hs) 62%,var(--tr-mat-3) 0);display:grid;place-items:center}
`].join('\n')
  const html = `<!doctype html><html lang="vi" data-trong="hs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>
<main><section class="khoi" id="khoi-san"><h2>Mol sống động · chạm, kéo, mắt dõi theo tay</h2><div id="san"><span class="ten" id="ten">Chào</span><span class="bi lua to" id="to" data-goc="phai" style="--lv-w:240px"></span>
<div class="phu"><span class="bi lua" id="canh" style="--lv-w:104px"></span><span class="vong"><span class="bi lua" id="nho" data-khung="tron" data-nho style="--lv-w:34px"></span></span></div></div></section>
<section class="khoi" id="khoi-luoi"><h2>15 mặt · chuyển trộn bằng lò xo</h2><p>11 mặt đang dùng + 4 mặt phương án. Giận đổi sắc, nút bấc bung trên lửa; 6,022·10²³ ở dung dịch.</p><div class="luoi" id="luoi"></div></section></main>
<script>${js}</script><script>
const q = new URLSearchParams(location.search), che = q.get('che') || 'day-du'
const TEN = { vui: 'Vui', khen: 'Khen', chao: 'Chào', nghi: 'Nghĩ', ngac: 'Ngạc nhiên', buon: 'Buồn', ngu: 'Ngủ', doi: 'Dỗi · cấp 2', buc: 'Bực · cấp 3', cau: 'Cáu · cấp 4', ratCau: 'Rất cáu · cấp 5', nguong: 'Ngượng', me: 'Mê', nhay: 'Vui nhảy', tuTin: 'Tự tin' }
const luoi = document.getElementById('luoi')
if (!q.has('khong-luoi')) for (const m of Object.keys(TEN)) {
  const fg = document.createElement('figure'), s = document.createElement('span')
  s.className = 'bi lua'; s.style.setProperty('--lv-w', '120px'); fg.appendChild(s); fg.insertAdjacentHTML('beforeend', '<span>' + TEN[m] + '</span>'); luoi.appendChild(fg)
  MOL.taoLua(s, { mat: m, cheDo: che === 'gon' ? 'gon' : che === 'tinh' ? 'tinh' : 'day-du' })
}
const mol = MOL.taoLua(document.getElementById('to'), { trangThai: 'chao', cheDo: che, goc: 'phai', keo: true })
const canh = MOL.taoLua(document.getElementById('canh'), { trangThai: 'vui', cheDo: che })
const nho = MOL.taoLua(document.getElementById('nho'), { trangThai: 'vui', cheDo: 'nho' })
const MAT_TT = { vui: 'vui', khen: 'combo', chao: 'chao', nghi: 'nghi', ngac: 'choc', buon: 'buon', ngu: 'ngu' }
const TEN_CAP = { 2: 'Dỗi', 3: 'Bực', 4: 'Cáu', 5: 'Rất cáu' }
window.MOLTHU = {
  mol, canh, nho, dem: MOL._demMol,
  dat(x) { const ten = document.getElementById('ten')
    if (typeof x === 'number') { for (const l of [mol, canh, nho]) l.datCap(x); ten.textContent = TEN_CAP[x] || 'Vui'; return }
    for (const l of [mol, canh, nho]) { l.datCap(0); l.datTrangThai(MAT_TT[x] || x) } ten.textContent = TEN[x] || x },
  cham() { mol.cham() },
}
</script></body></html>`
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'mol-song-'))
  const f = path.join(tam, 'mol.html')
  fs.writeFileSync(f, html)
  return f
}
module.exports = { dungTrang }
