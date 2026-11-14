// ĐO NHỊP KHUNG KHI PHÁT TRỰC TIẾP (video tóm tắt trong app, 14/11): mở public/video-bai/khung.html ở khổ điện thoại, hãm CPU ×N, chạy ve(t) bằng
// requestAnimationFrame theo giờ thật ở các đoạn nặng ⇒ trung vị / p95 khoảng cách khung (gồm cả tính kiểu + vẽ). Dùng: node do-nhip-truc-tiep.mjs <kịch bản> [×CPU] [nhe]
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const [kbDir, hamS = '4', nhe] = process.argv.slice(2)
const kb = JSON.parse(readFileSync(join(kbDir, 'kich-ban.json'), 'utf8')), net = JSON.parse(readFileSync(join(kbDir, 'net.json'), 'utf8'))
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const trang = await trinh.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })
await trang.goto('file://' + join(dirname(fileURLToPath(import.meta.url)), '../../public/video-bai/khung.html') + (nhe === 'nhe' ? '?nhe=1' : '?truc-tiep=1'))
await trang.evaluate(([k, n]) => window.nap(k, n), [kb, net])
await trang.addStyleTag({ content: 'html,body{width:844px;height:390px} #san{transform:scale(0.4396);transform-origin:0 0;width:1920px;height:1080px}' })
const cdp = await trang.context().newCDPSession(trang)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(hamS) })
const c = (id) => kb.doan.find((d) => d.id === id)
const b = c('c11')?.hoat?.loai === 'bazo' && !c('c2') ? c('c11').hoat.moc : null // kịch bản thử phần 10 (peptide + NaOH)
const DOAN = b ? { 'bút + mũi tên cong': b.a_cung0 - 0.5, 'H₂O thành': b.a_gH2O - 0.3, 'NaOH gắn đầu C': b.b_3a, 'nước rơi + đứt': b.c_can, 'Na gắn Gly': b.d_na } : {
  'thẻ chương': c('c2').t0 - 2.4,
  'chuỗi hạt c2': c('c2').hoat.moc.dem50,
  'quả cầu - que c3': c('c3').hoat.moc.noi - 0.3,
  'đố vui c10': c('c10').doVui.t0,
  'lộ đáp án c10': c('c10').doVui.tMo - 0.3,
  'biuret c13': c('c13').hoat.moc.tim,
}
for (const [ten, t0] of Object.entries(DOAN)) {
  const r = await trang.evaluate(async (t0) => {
    const gap = []
    await new Promise((xong) => {
      const bd = performance.now(); let truoc = bd
      const buoc = (nay) => { gap.push(nay - truoc); truoc = nay; window.ve(t0 + (nay - bd) / 1000); if (nay - bd < 2500) requestAnimationFrame(buoc); else xong() }
      requestAnimationFrame(buoc)
    })
    gap.shift(); gap.sort((a, b) => a - b)
    return { n: gap.length, tv: gap[Math.floor(gap.length / 2)], p95: gap[Math.floor(gap.length * 0.95)] }
  }, t0)
  console.log(`${ten.padEnd(20)} CPU×${hamS}${nhe ? ' nhẹ' : ''}: ${r.n} khung/2,5 s · trung vị ${r.tv.toFixed(1)} ms · p95 ${r.p95.toFixed(1)} ms`)
}
await trinh.close()
