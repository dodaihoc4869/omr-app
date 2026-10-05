#!/usr/bin/env node
// SO ĐIỂM ẢNH hai bộ ảnh giao diện (thầy 05/10: "app của học sinh giữ nguyên mọi thứ giao diện, hình nền màu nhé").
//
//   node scripts/do-app-hs.mjs --dist=<bản trước> --kich=anh --anh=<A>      (rồi --dist=<bản sau> --anh=<B>, cùng --omni / --gio)
//   node scripts/do-app-hs/so-anh.mjs <A> <B> [--ra=<thư mục ảnh vùng khác>] [--nguong=2]
//
// So TỪNG điểm ảnh bằng canvas của Chromium (không cần thư viện ảnh). Một điểm "khác thấy được" khi kênh màu lệch > ngưỡng (mặc định 2/255 —
// lệch 1–2 là nhiễu dựng lớp của trình duyệt, mắt không thấy). Thoát mã 1 nếu: thiếu ảnh ở một bên, khác cỡ, hoặc có điểm khác thấy được.
// `--ra`: ghi ảnh JPG tô ĐỎ vùng khác (khac-<màn>.jpg) để xem nhanh chỗ nào đổi.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const [A, B] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const RA = arg('ra', '')
const NGUONG = Number(arg('nguong', '2'))
if (!A || !B) {
  console.error('Cách dùng: node scripts/do-app-hs/so-anh.mjs <thư mục trước> <thư mục sau> [--ra=<thư mục>] [--nguong=2]')
  process.exit(2)
}
if (RA) mkdirSync(RA, { recursive: true })

function timChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM
  const goc = '/opt/pw-browsers'
  if (!existsSync(goc)) return undefined
  for (const d of readdirSync(goc).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = join(goc, d, 'chrome-linux', 'chrome')
    if (existsSync(p)) return p
  }
  return undefined
}

const ten = [...new Set([...readdirSync(A), ...readdirSync(B)])].filter((f) => f.endsWith('.png')).sort()
const trinh = await chromium.launch({ headless: true, executablePath: timChromium() })
const p = await trinh.newPage()
const kq = []
for (const f of ten) {
  if (!existsSync(join(A, f)) || !existsSync(join(B, f))) {
    kq.push({ man: f, loi: `thiếu ảnh ở ${existsSync(join(A, f)) ? 'bản sau' : 'bản trước'}` })
    continue
  }
  const du = (x) => 'data:image/png;base64,' + readFileSync(join(x, f)).toString('base64')
  const r = await p.evaluate(async ([da, db, nguong, ghi]) => {
    const nap = (s) => new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi; i.src = s })
    const [ia, ib] = await Promise.all([nap(da), nap(db)])
    if (ia.width !== ib.width || ia.height !== ib.height) return { loi: `khác cỡ ${ia.width}×${ia.height} / ${ib.width}×${ib.height}` }
    const c = document.createElement('canvas')
    c.width = ia.width
    c.height = ia.height
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(ia, 0, 0)
    const x = g.getImageData(0, 0, c.width, c.height).data
    g.drawImage(ib, 0, 0)
    const yy = g.getImageData(0, 0, c.width, c.height)
    const y = yy.data
    let nho = 0, ro = 0, lechMax = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    for (let i = 0; i < x.length; i += 4) {
      const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]))
      if (!d) continue
      lechMax = Math.max(lechMax, d)
      if (d <= nguong) { nho++; continue }
      ro++
      const k = i / 4, px = k % c.width, py = (k - px) / c.width
      x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py)
      y[i] = 255; y[i + 1] = 0; y[i + 2] = 0
    }
    let anh = null
    if (ro && ghi) {
      g.putImageData(yy, 0, 0)
      anh = c.toDataURL('image/jpeg', 0.5)
    }
    return { tong: c.width * c.height, ro, nho, lechMax, vung: ro ? `x ${x0}–${x1}, y ${y0}–${y1}` : '', anh }
  }, [du(A), du(B), NGUONG, !!RA])
  if (r.anh) writeFileSync(join(RA, `khac-${f.replace(/\.png$/, '.jpg')}`), Buffer.from(r.anh.split(',')[1], 'base64'))
  delete r.anh
  kq.push({ man: f.replace(/\.png$/, ''), ...r })
}
await trinh.close()

console.log(`| Màn | Điểm ảnh | Khác thấy được (> ${NGUONG}/255) | Lệch nhỏ (≤ ${NGUONG}) | Lệch lớn nhất | Vùng khác |`)
console.log('|---|---:|---:|---:|---:|---|')
for (const r of kq) console.log(r.loi ? `| ${r.man} | — | **${r.loi}** | | | |` : `| ${r.man} | ${r.tong} | **${r.ro}** | ${r.nho} | ${r.lechMax} | ${r.vung} |`)
const hong = kq.filter((r) => r.loi || r.ro > 0)
console.log(hong.length ? `\nKHÁC ở ${hong.length}/${kq.length} màn: ${hong.map((r) => r.man).join(', ')}` : `\nTRÙNG cả ${kq.length} màn.`)
process.exit(hong.length || !kq.length ? 1 : 0)
