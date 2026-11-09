// ĐO VÙNG AN TOÀN MASKABLE của các icon 512 (Chromium thật): điểm xa tâm nhất của HÌNH (khác màu nền góc) phải nằm trong
// vòng tròn bán kính 40% cạnh — chuẩn maskable: hệ điều hành có thể cắt icon theo hình tròn. Thoát mã 1 nếu có tệp vượt.
//   node scripts/do-logo-maskable.mjs
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEP = ['logo-gv-512-maskable-v3.png', 'logo-hs-512-maskable-v3.png', 'logo-ph-512-maskable-v3.png', 'icon-512-maskable.png', 'logo-hs-512-maskable-cn.png', 'logo-hs-512-maskable-mol.png']
// Bản TRÀN Ô (mặt Mol phủ kín như Duolingo — thầy chốt 09/11): nền là thân Mol, không có «màu nền góc» phẳng ⇒ đo NÉT MẶT (lòng trắng mắt,
// viền / con ngươi / miệng tối, mũi cam) phải nằm trong vòng 40%; má hồng / mép nước được phép bị cắt.
const TRAN_O = ['logo-hs-512-maskable-mol.png']
const KHONG_MASKABLE = ['logo-gv-512-v3.png'] // đối chứng: bản tràn nền chưa thu nhỏ PHẢI vượt (chứng minh phép đo có bắt được)
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch({ headless: true, executablePath: (await import('node:fs')).existsSync(exe) ? exe : undefined })
const page = await (await browser.newContext()).newPage()
let hong = 0
for (const t of [...TEP, ...KHONG_MASKABLE]) {
  const b64 = readFileSync(resolve(GOC, 'public', t)).toString('base64')
  const r = await page.evaluate(async ([b64, tranO]) => {
    const im = new Image()
    im.src = 'data:image/png;base64,' + b64
    await im.decode()
    const c = document.createElement('canvas')
    c.width = c.height = im.width
    const x = c.getContext('2d')
    x.drawImage(im, 0, 0)
    const W = c.width
    const d = x.getImageData(0, 0, W, W).data
    const bg = [d[0], d[1], d[2]]
    let maxR = 0
    for (let y = 0; y < W; y++)
      for (let xx = 0; xx < W; xx++) {
        const i = (y * W + xx) * 4
        const [R, G, B] = [d[i], d[i + 1], d[i + 2]]
        const hinh = tranO ? (R > 235 && G > 235 && B > 235) || R + G + B < 200 || (R > 200 && G < 170 && B < 120) : Math.abs(R - bg[0]) + Math.abs(G - bg[1]) + Math.abs(B - bg[2]) > 60
        if (hinh) maxR = Math.max(maxR, Math.hypot(xx - W / 2 + 0.5, y - W / 2 + 0.5))
      }
    return { W, maxR }
  }, [b64, TRAN_O.includes(t)])
  const pct = (r.maxR / r.W) * 100
  const trong = pct <= 40
  const doiChung = KHONG_MASKABLE.includes(t)
  if (doiChung ? trong : !trong) hong++
  console.log(`${doiChung ? '(đối chứng) ' : ''}${TRAN_O.includes(t) ? '(tràn ô — nét mặt) ' : ''}${t}: điểm xa nhất ${r.maxR.toFixed(1)} px = ${pct.toFixed(1)}% cạnh → ${trong ? 'TRONG' : 'NGOÀI'} vòng an toàn 40%`)
}
await browser.close()
if (hong) {
  console.error(`❌ ${hong} tệp không đúng kỳ vọng`)
  process.exit(1)
}
console.log('✅ Mọi icon maskable nằm trọn vùng an toàn; đối chứng vượt như dự kiến')
