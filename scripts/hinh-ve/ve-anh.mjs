#!/usr/bin/env node
// Dựng ẢNH của cảnh svg đã vẽ (đúng phông DDH Rounded, bảng màu app, chỉ số chuẩn) để phiên SOÁT đối chiếu với ảnh gốc.
//   node scripts/hinh-ve/ve-anh.mjs <thư-mục-lô>   ⇒ ra/<bam>.png cho mỗi ra/<bam>.json có cảnh svg đạt bộ kiểm
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { kiemCanhHinh, chiSoChuan } from './kiem-hinh.bundle.mjs'
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { chromium } = createRequire(path.join(GOC, 'package.json'))('playwright')
const dir = path.resolve(process.argv[2] || '.')
const doc = (f) => fs.readFileSync(path.join(GOC, f), 'utf8')
const phong = doc('src/styles/trong-hs.css').split('\n').filter((l) => l.startsWith("@font-face { font-family: 'DDH Rounded'")).map((l) => l.replace(/url\('\.\/phong-ddh\//g, `url('file://${GOC}/src/styles/phong-ddh/`).replace('font-display: optional', 'font-display: block')).join('\n')
const kieu = `${phong}\n${doc('src/styles/trong-hs-mau.css')}\n${doc('src/components/hinh-ve/hinh-ve.css')}\nbody{margin:0;padding:16px;background:var(--tr-nen);font-family:'DDH Rounded',sans-serif;color:var(--tr-chu)}.hv-the{width:420px}`
const br = await chromium.launch({ executablePath: process.env.OMR_CHROMIUM || '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 460, height: 700 }, deviceScaleFactor: 2 })
let n = 0
for (const f of fs.readdirSync(path.join(dir, 'ra')).filter((x) => x.endsWith('.json'))) {
  const bam = f.replace('.json', '')
  let ra; try { ra = JSON.parse(fs.readFileSync(path.join(dir, 'ra', f), 'utf8')) } catch { continue }
  const v = JSON.parse(fs.readFileSync(path.join(dir, 'vao', f), 'utf8'))
  const k = kiemCanhHinh(ra, v.phienAm || [])
  if (!k.ok || k.hinh.canh.loai !== 'svg') continue
  const c = k.hinh.canh
  await p.setContent(`<!doctype html><html data-trong="hs"><head><style>${kieu}</style></head><body><section class="hv-the" id="x"><span class="hv-nhan-the">Hình của đề · vẽ lại</span><b class="hv-tieu-de">${k.hinh.tieuDe}</b><div class="hv-san"><svg viewBox="0 0 ${c.rong} ${c.cao}" class="hv-svg hv-tu-do">${chiSoChuan(c.svg)}</svg></div></section></body></html>`)
  await p.evaluate(() => document.fonts.ready)
  await p.addStyleTag({ content: '*{animation:none!important}' })
  await (await p.$('#x')).screenshot({ path: path.join(dir, 'ra', `${bam}.png`) })
  n++
}
await br.close()
console.log(`dựng ${n} ảnh`)
