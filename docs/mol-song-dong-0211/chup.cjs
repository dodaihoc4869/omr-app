// ẢNH + VIDEO NGHIỆM THU MOL SỐNG ĐỘNG từ MÃ THẬT (02/11):  node docs/mol-song-dong-0211/chup.cjs
//   ⇒ mat-sang.jpg / mat-toi.jpg (15 mặt + Mol to / cạnh đường / avatar), video-15s.mp4 (chào → chạm → mắt dõi tay → kéo thả → đổi mặt chuyển trộn → giận 2…5).
// Ảnh trong app (Lộ trình 390 sáng / tối, màn làm câu, avatar): node docs/mol-song-dong-0211/do-mol.mjs --dist=dist --chup=docs/mol-song-dong-0211
const { chromium } = require('playwright')
const { execFileSync } = require('child_process')
const path = require('path'), fs = require('fs')
const { dungTrang } = require('./trang-mol.cjs')
const RA = __dirname
;(async () => {
  const f = dungTrang()
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })
  for (const sc of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 760, height: 1150 }, colorScheme: sc, deviceScaleFactor: 1 })
    await p.goto('file://' + f)
    await p.waitForTimeout(1600)
    await p.screenshot({ path: path.join(RA, `mat-${sc === 'light' ? 'sang' : 'toi'}.jpg`), type: 'jpeg', quality: 72, fullPage: true })
    await p.close()
    // AVATAR: Mol 34 px trong vòng Mục tiêu (khung tròn, chế độ «nho» — mặt tĩnh + chớp CSS, không vòng JS), phóng ×4; kèm Mol cạnh đường 104 px
    const a = await b.newPage({ viewport: { width: 760, height: 470 }, colorScheme: sc, deviceScaleFactor: 4 })
    await a.goto('file://' + f + '?khong-luoi')
    await a.waitForTimeout(900)
    const v = await a.locator('#khoi-san .phu').boundingBox()
    await a.screenshot({ path: path.join(RA, `avatar-${sc === 'light' ? 'sang' : 'toi'}.jpg`), type: 'jpeg', quality: 70, clip: { x: v.x - 10, y: v.y - 10, width: v.width + 20, height: v.height + 20 } })
    await a.close()
  }
  // VIDEO 15 giây: khổ điện thoại, chỉ sân khấu
  const tam = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mol-vid-'))
  const ctx = await b.newContext({ viewport: { width: 420, height: 470 }, deviceScaleFactor: 1, recordVideo: { dir: tam, size: { width: 420, height: 470 } } })
  const p = await ctx.newPage()
  await p.goto('file://' + f + '?khong-luoi')
  await p.addStyleTag({ content: '#san{grid-template-columns:1fr;min-height:400px} #san .phu{position:absolute;right:8px;bottom:8px}' })
  await p.waitForTimeout(700)
  const box = await p.locator('#to').boundingBox()
  const cx = box.x + box.width / 2, cy = box.y + box.height * 0.62
  const cho = (ms) => p.waitForTimeout(ms)
  const dat = (x) => p.evaluate((x) => MOLTHU.dat(x), x)
  await cho(900); await dat('vui'); await cho(700)
  await p.mouse.click(cx, cy); await cho(650); await p.mouse.click(cx, cy); await cho(900)
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; await p.mouse.move(cx + Math.cos(a) * 170, cy - 60 + Math.sin(a) * 150); await cho(45) }
  await p.mouse.move(cx, cy); await p.mouse.down()
  for (let i = 1; i <= 10; i++) { await p.mouse.move(cx + i * 9, cy - i * 6); await cho(18) }
  for (let i = 1; i <= 10; i++) { await p.mouse.move(cx + 90 - i * 18, cy - 60 + i * 3); await cho(18) }
  await p.mouse.up(); await cho(1200)
  for (const [m, ms] of [['khen', 1300], ['ngac', 900], ['nghi', 900], ['buon', 1000], ['ngu', 1100]]) { await dat(m); await cho(ms) }
  await p.mouse.click(cx, cy); await cho(1300)
  for (const c of [2, 3, 4, 5]) { await dat(c); await cho(c >= 4 ? 1100 : 800) }
  await dat(0); await dat('vui'); await cho(1000)
  const v = p.video()
  await ctx.close()
  const webm = await v.path()
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-t', '15', '-vf', 'fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '30', '-preset', 'slow', '-movflags', '+faststart', path.join(RA, 'video-15s.mp4')])
  await b.close()
  console.log('xong', fs.statSync(path.join(RA, 'video-15s.mp4')).size)
})()
