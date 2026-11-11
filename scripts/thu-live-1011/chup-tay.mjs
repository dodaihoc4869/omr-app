#!/usr/bin/env node
// ẢNH BA PHƯƠNG ÁN BÀN TAY CẦM BÚT (11/11, thầy: «có hiển thị tay cầm bút giống người viết, nhỏ phù hợp tinh tế đẹp và thân thiện ko bị rối mắt»).
// Vẽ bằng ĐÚNG hàm `veTay` của app (src/components/live/tro-but.ts) trong Chromium thật: mỗi phương án phóng to + đúng cỡ trên máy em (bảng cao 374 px
// ⇒ bàn tay ≈ 21 px), trên nền bảng đen và nền giấy, lúc đang viết và lúc lơ lửng. Màu lấy từ bảng màu màn chiếu (src/lib/bpu/mau-chieu.ts) + --p-cam.
//   node scripts/thu-live-1011/chup-tay.mjs [thư mục ảnh = docs/ban-ve-but-1011]
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import sharp from 'sharp'

const GOC = resolve(import.meta.dirname, '../..')
const ANH = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011'))
mkdirSync(ANH, { recursive: true })
const goi = await build({ stdin: { contents: `import * as T from './src/components/live/tro-but.ts'; import { MAU } from './src/lib/bpu/mau-chieu.ts'; window.T = T; window.MAU = MAU`, resolveDir: GOC, loader: 'ts' }, bundle: true, write: false, format: 'iife', target: 'es2019' })
const cam = /--p-cam:\s*([^;]+);/.exec(readFileSync(join(GOC, 'src/styles/tokens.css'), 'utf8'))?.[1]?.trim() ?? 'orange'

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const trang = await (await trinh.newContext({ viewport: { width: 1180, height: 640 }, deviceScaleFactor: 2 })).newPage()
await trang.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#101214;font:600 15px system-ui,sans-serif"><canvas id="c" style="width:1180px;height:640px"></canvas><script>${goi.outputFiles[0].text}</script>`)
await trang.evaluate((cam) => {
  const { veTay, tiLeTay, coTay, RO_TAY } = window.T, M = window.MAU
  const c = document.getElementById('c'), d = 2
  c.width = 1180 * d; c.height = 640 * d
  const g = c.getContext('2d')
  const mau = (muc) => ({ than: M.giay, bong: M.bang, dai: cam, muc })
  const PHAN = 'rgb(240,236,226)', MUC = 'rgb(34,38,43)'
  // nét mẫu kết thúc tại ngòi (x, y): một quãng chữ viết tay
  let cat = null
  function net(x, y, s, m) {
    g.save(); g.setTransform(d, 0, 0, d, 0, 0); if (cat) { g.beginPath(); g.rect(cat[0], cat[1], cat[2], cat[3]); g.clip() } g.strokeStyle = m; g.lineWidth = Math.max(1.2, 1.7 * s); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath()
    g.moveTo(x - 150 * s, y - 6 * s); g.bezierCurveTo(x - 120 * s, y - 60 * s, x - 100 * s, y + 30 * s, x - 76 * s, y - 14 * s); g.bezierCurveTo(x - 62 * s, y - 44 * s, x - 44 * s, y + 22 * s, x - 22 * s, y - 4 * s); g.quadraticCurveTo(x - 10 * s, y - 16 * s, x, y); g.stroke(); g.restore()
  }
  function tay(x, y, co, dang, m, mo, bong) {
    const s = tiLeTay(co)
    // vẽ ra một hình rời rồi dán với độ rõ `mo` — đúng cách app làm (độ rõ đều cả hình)
    const t = document.createElement('canvas'), le = 20 * s * d + 4
    t.width = Math.ceil(110 * s * d + le * 2); t.height = Math.ceil(110 * s * d + le * 2)
    const gt = t.getContext('2d'); gt.setTransform(d * s, 0, 0, d * s, le + 12 * s * d, le + 54 * s * d)
    veTay(gt, dang, m, bong)
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = mo; g.drawImage(t, Math.round(x * d - le - 12 * s * d), Math.round(y * d - le - 54 * s * d)); g.restore()
  }
  const chu = (t, x, y, m, co = 15) => { g.save(); g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = m; g.font = `600 ${co}px system-ui, sans-serif`; g.fillText(t, x, y); g.restore() }
  const DANG = [['nam', 'A · bàn tay mềm (mặc định)'], ['gon', 'B · khối gọn'], ['vien', 'C · chỉ nét viền']]
  const coThat = coTay(374)
  DANG.forEach(([dang, ten], i) => {
    const x0 = 20 + i * 388, w = 372
    // nửa trên: bảng đen · nửa dưới: giấy
    g.save(); g.setTransform(d, 0, 0, d, 0, 0)
    g.fillStyle = M.bang; g.beginPath(); g.roundRect(x0, 44, w, 330, 14); g.fill()
    g.fillStyle = M.giay; g.beginPath(); g.roundRect(x0, 388, w, 236, 14); g.fill(); g.restore()
    chu(ten, x0 + 4, 28, M.giay, 17)
    cat = [x0 + 8, 44, w - 16, 580]
    // phóng to ×7
    net(x0 + 150, 190, 2.4, PHAN); tay(x0 + 150, 190, coThat * 7, dang, mau(PHAN), RO_TAY.viet, true)
    chu('phóng to 7 lần', x0 + 14, 66, M.phu, 12)
    // đúng cỡ trên máy em: đang viết · lơ lửng · nghỉ
    chu('đúng cỡ máy em:  đang viết        lơ lửng        đứng yên lâu', x0 + 14, 318, M.phu, 12)
    ;[[RO_TAY.viet, 0], [RO_TAY.lo, 1], [RO_TAY.nghi, 1]].forEach(([mo, nang], k) => { const x = x0 + 150 + k * 78, y = 350 - nang * 3; if (!k) net(x, y, 0.36, PHAN); else net(x - nang, y + nang * 3, 0.36, PHAN); tay(x + nang * 1.5, y, coThat, dang, mau(PHAN), mo, true) })
    // trên giấy
    net(x0 + 130, 470, 1.2, MUC); tay(x0 + 130, 470, coThat * 3, dang, mau(MUC), RO_TAY.viet, true)
    chu('trên giấy · phóng to 3 lần', x0 + 14, 410, M.phu, 12)
    chu('đúng cỡ:', x0 + 14, 596, M.phu, 12)
    ;[[RO_TAY.viet, 0], [RO_TAY.lo, 1]].forEach(([mo, nang], k) => { const x = x0 + 150 + k * 90, y = 596 - nang * 3; net(x - nang, y + nang * 3, 0.36, MUC); tay(x + nang * 1.5, y, coThat, dang, mau(MUC), mo, true) })
  })
}, cam)
const buf = await trang.locator('#c').screenshot({ type: 'png' })
let q = 90, ra
do { ra = await sharp(buf).jpeg({ quality: q, mozjpeg: true }).toBuffer(); q -= 5 } while (ra.length > 150 * 1024 && q > 40)
writeFileSync(join(ANH, '10-tay-ba-phuong-an.jpg'), ra)
console.log(`ảnh 10-tay-ba-phuong-an.jpg ${Math.round(ra.length / 1024)} KB`)
await trinh.close()
