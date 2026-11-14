// VIDEO BÀI GIẢNG — bước 3/3: CHỤP KHUNG. Mở khung.html bằng Chromium, nạp kịch bản, gọi ve(t) cho từng khung rồi đẩy ảnh vào ffmpeg.
// Dùng:  node chup-khung.mjs <thư mục kịch bản> video <ra.mp4> <khung đầu> <khung cuối (không gồm)>
//        node chup-khung.mjs <thư mục kịch bản> anh <thư mục ảnh> <giây>,<giây>,…
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const [kbDir, cheDo, ra, a, b] = process.argv.slice(2)
const kb = JSON.parse(readFileSync(join(kbDir, 'kich-ban.json'), 'utf8')), net = JSON.parse(readFileSync(join(kbDir, 'net.json'), 'utf8'))
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb', '--disable-lcd-text'] })
const trang = await trinh.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const loi = []; trang.on('pageerror', (e) => loi.push(e.message)); trang.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
await trang.goto('file://' + join(dirname(fileURLToPath(import.meta.url)), '../../public/video-bai/khung.html'))
await trang.evaluate(([k, n]) => window.nap(k, n), [kb, net])
await trang.waitForTimeout(300)

if (cheDo === 'anh') {
  mkdirSync(ra, { recursive: true })
  for (const g of a.split(',').map(Number)) {
    await trang.evaluate((t) => window.ve(t), g)
    await trang.screenshot({ path: join(ra, `k-${String(g.toFixed(1)).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 82 })
  }
} else {
  const fps = kb.fps, tu = Number(a), den = Math.min(Number(b), Math.ceil(kb.tong * fps))
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '15', '-pix_fmt', 'yuv420p', ra], { stdio: ['pipe', 'inherit', 'inherit'] })
  const bd = Date.now()
  for (let f = tu; f < den; f++) {
    await trang.evaluate((t) => window.ve(t), f / fps)
    const buf = await trang.screenshot({ type: 'jpeg', quality: 94 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if ((f - tu) % 300 === 299) console.log(`  [${tu}-${den}] ${f - tu + 1} khung · ${((Date.now() - bd) / (f - tu + 1)).toFixed(0)} ms/khung`)
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r))
}
if (loi.length) console.log('LỖI TRANG:', [...new Set(loi)].slice(0, 5).join(' | '))
await trinh.close()
