// Chụp bản vẽ «Nhật ký bài dạy» bằng Chromium thật + tự soát + quay video.
// Chạy từ gốc repo:  node docs/ban-ve-nhat-ky-bai-day-1311/chup.mjs [lọc tên ảnh] [--video] [--chi-video]
//   · dựng kich-ban-nhung.js từ các kich-ban-*.json (để Thầy mở thẳng tệp HTML từ ổ đĩa vẫn chạy)
//   · mở trang qua máy chủ nhỏ http://127.0.0.1 (đúng đường đọc JSON thật; file:// bị trình duyệt chặn fetch)
//   · soát: lỗi trang, tràn ngang, đích bấm < 44 px, chữ bị cắt, ảnh > 150 KB; riêng trang HỌC SINH soát chữ:
//     dấu «—», emoji, câu > 30 chữ, chữ tiền / nhà / giàu / thuế, viết tắt của bảng (VD, LK, CHT, KPC, ntố, QT), mã khuôn lộ ra.
//   · --video: quay hai video bài liên kết (1366×768 và 390×844), đổi sang MP4 H.264 nếu có ffmpeg.
// Máy không có Chromium đúng bản của Playwright: PW_CHROMIUM=<đường tới chrome> (mặc định /opt/pw-browsers/chromium).
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { existsSync, statSync, writeFileSync, readFileSync, readdirSync, mkdtempSync, rmSync, renameSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import http from 'node:http'
const can = createRequire(import.meta.url)
const { chromium } = can(process.env.PLAYWRIGHT_DUONG || 'playwright')
let sharp = null
try { sharp = can('sharp') } catch { /* không có sharp ⇒ dùng bộ nén JPEG của Chromium */ }
const DAY = dirname(fileURLToPath(import.meta.url)), GOC = join(DAY, '..', '..'), exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const thamSo = process.argv.slice(2), loc = thamSo.find((x) => !x.startsWith('--')) || '', VIDEO = thamSo.includes('--video') || thamSo.includes('--chi-video'), CHI_VIDEO = thamSo.includes('--chi-video')
const DUONG = '/docs/ban-ve-nhat-ky-bai-day-1311/'

// ── 1. bản nhúng kịch bản (sinh từ JSON, không sửa tay) ──
const nhung = {}
for (const t of readdirSync(DAY).filter((x) => /^kich-ban-.+\.json$/.test(x)).sort()) nhung[t.replace(/^kich-ban-|\.json$/g, '')] = JSON.parse(readFileSync(join(DAY, t), 'utf8'))
writeFileSync(join(DAY, 'kich-ban-nhung.js'), `// TỰ SINH bởi chup.mjs từ kich-ban-*.json. KHÔNG sửa tay. Chỉ dùng khi mở thẳng tệp HTML từ ổ đĩa (file://), nơi trình duyệt chặn đọc JSON.\nwindow.KB_NHUNG = ${JSON.stringify(nhung)}\n`)

// ── 2. máy chủ tĩnh nhỏ ở gốc repo ──
const KIEU = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' }
const may = http.createServer((yc, tl) => {
  const u = decodeURIComponent(yc.url.split('?')[0]), f = join(GOC, u)
  if (!f.startsWith(GOC) || !existsSync(f) || !statSync(f).isFile()) { tl.writeHead(404); return tl.end() }
  tl.writeHead(200, { 'content-type': KIEU[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); tl.end(readFileSync(f))
}).listen(0, '127.0.0.1')
await new Promise((ok) => may.once('listening', ok))
const GOC_URL = `http://127.0.0.1:${may.address().port}${DUONG}`

// [tên ảnh, tệp, tham số, rộng, cao, nền, soát chữ học sinh?]
const ANH = [
  ['01-nhat-ky-may-tinh-1366-sang', 'nhat-ky.html', 'tua=1', 1366, 768, 'sang', true],
  ['02-nhat-ky-may-tinh-1366-toi-vi-du-va-thang', 'nhat-ky.html', 'tua=1&cuon=c7&le=70', 1366, 768, 'toi', true],
  ['03-nhat-ky-ngang-844-sang', 'nhat-ky.html', 'tua=1', 844, 390, 'sang', true],
  ['04-nhat-ky-ngang-844-toi-cong-thuc-electron', 'nhat-ky.html', 'tua=1&cuon=c3&le=56', 844, 390, 'toi', true],
  ['05-nhat-ky-doc-390-sang', 'nhat-ky.html', 'tua=1', 390, 844, 'sang', true],
  ['06-nhat-ky-doc-390-toi-doan-nhanh-da-cham', 'nhat-ky.html', 'tua=1&chon=c4:0&cuon=c4&le=64', 390, 844, 'toi', true],
  ['07-khung-giua-keo-co-dang-thanh-ion-1366-toi', 'nhat-ky.html', 'dung=c5:7700&cuon=c5&le=70', 1366, 768, 'toi', true],
  ['08-khung-giua-lewis-dang-ve-cap-chung-390-sang', 'nhat-ky.html', 'dung=c3:2550&cuon=c3&le=64', 390, 844, 'sang', true],
  ['09-khung-giua-thang-kim-dang-chay-844-sang', 'nhat-ky.html', 'dung=c8:4350&cuon=c8&le=56', 844, 390, 'sang', true],
  ['10-bai-fes2-vi-du-cot-doc-1366-sang', 'nhat-ky.html', 'kb=fes2&tua=1&cuon=f2&le=70', 1366, 768, 'sang', true],
  ['11-duyet-thay-1366-sang', 'duyet.html', 'chon=c8', 1366, 768, 'sang', false],
  ['12-cho-gan-may-tinh-1366-sang', 'cho-gan.html', 'nk=5200', 1366, 768, 'sang', false],
  ['13-cho-gan-doc-390-sang', 'cho-gan.html', 'nk=5200', 390, 844, 'sang', false],
]

const b = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

async function soatTrang(p, chuHs) {
  return p.evaluate((chuHs) => {
    const tran = document.documentElement.scrollWidth - window.innerWidth
    const thay = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight }
    const nho = [...document.querySelectorAll('button, a[href], [role="slider"], input')].map((e) => (e.matches('input[type=radio], input[type=checkbox]') && e.closest('label') ? e.closest('label') : e)).filter((e) => { const r = e.getBoundingClientRect(); return thay(e) && (r.width < 44 || r.height < 44) && !e.closest('.bv') }).map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 40))
    const cat = [...document.querySelectorAll('h1, h2, h3, button, .canh-loai, .td-nhan, .td-o b, .vd-cot li, .vd-pt, .tk-nghe, .thanh-dem')].filter((e) => thay(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).webkitLineClamp === 'none' && getComputedStyle(e).overflow !== 'visible').map((e) => (e.textContent || '').trim().slice(0, 40))
    const loiChu = []
    if (chuHs) {
      const sao = document.body.cloneNode(true); sao.querySelectorAll('.bv, script, style').forEach((x) => x.remove())
      const chu = [...sao.querySelectorAll('*')].filter((x) => !x.children.length || [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((x) => x.textContent.trim()).filter(Boolean)
      const tat = (document.querySelector('.nk') ? [...document.querySelectorAll('.nk *:not(.bv):not(.bv *)')] : []).map((x) => x.getAttribute && (x.getAttribute('aria-label') || '')).filter(Boolean)
      const ds = [...new Set(chu.concat(tat))]
      for (const t of ds) {
        if (t.includes('—')) loiChu.push('dấu gạch ngang dài: ' + t.slice(0, 50))
        if (/\p{Extended_Pictographic}/u.test(t)) loiChu.push('emoji: ' + t.slice(0, 50))
        for (const c of t.split(/(?<=[.!?])\s+/)) { const n = c.split(/\s+/).filter(Boolean).length; if (n > 30) loiChu.push(`câu ${n} chữ: ` + c.slice(0, 50)) }
        const tu = t.split(/[^\p{L}\p{N}₀-₉]+/u)
        for (const w of ['tiền', 'nhà', 'giàu', 'thuế']) if (tu.map((x) => x.toLowerCase()).includes(w)) loiChu.push(`chữ «${w}»: ` + t.slice(0, 50))
        for (const w of ['VD', 'VD1', 'VD2', 'LK', 'CHT', 'KPC', 'kpc', 'ntố', 'QT', 'QT₃', 'QT3', 'Hùng', 'Kiên', 'Angola']) if (tu.includes(w)) loiChu.push(`chữ «${w}» trên màn học sinh: ` + t.slice(0, 50))
        for (const k of ['keo-co', 'thang-delta', 'lewis', 'quy-tac', 'vi-du-cot-doc', 'doan-nhanh', 'tong-ket']) if (t.includes(k)) loiChu.push(`lộ mã khuôn «${k}»: ` + t.slice(0, 50))
      }
    }
    return { tran, nho: [...new Set(nho)], cat: [...new Set(cat)], loiChu: [...new Set(loiChu)] }
  }, chuHs)
}

if (!CHI_VIDEO) for (const [ten, tep, ts, w, h, nen, chuHs] of ANH) {
  if (loc && !ten.includes(loc)) continue
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: nen === 'toi' ? 'dark' : 'light', hasTouch: w < 900, isMobile: w < 900, reducedMotion: 'no-preference' })
  const loi = []
  p.on('pageerror', (e) => loi.push(String(e.message))); p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
  await p.goto(`${GOC_URL}${tep}?${ts}`)
  await p.waitForSelector('html[data-san]', { timeout: 10000 }).catch(() => loi.push('trang không báo sẵn sàng'))
  await p.waitForTimeout(450)
  const kq = await soatTrang(p, chuHs)
  const duong = join(DAY, `${ten}.jpg`)
  let q = 90
  // chụp ở deviceScaleFactor 2 (chữ nét); ảnh rộng mà phải nén dưới 60 thì thu về 75 % bề ngang rồi nén lại (giữ chữ đọc rõ, ≤ 150 KB)
  if (sharp) {
    const png = await p.screenshot({ type: 'png' })
    const nen = async (rong) => { q = 90; do { q -= 4; const anh = rong ? sharp(png).resize({ width: rong }) : sharp(png); writeFileSync(duong, await anh.jpeg({ quality: q, mozjpeg: true }).toBuffer()) } while (statSync(duong).size > 148000 && q > 30) }
    await nen(0); if (q < 60) await nen(Math.round(w * 2 * 0.75))
  }
  else do { q -= 6; await p.screenshot({ path: duong, type: 'jpeg', quality: q }) } while (statSync(duong).size > 148000 && q > 26)
  const kb = Math.ceil(statSync(duong).size / 1000)
  soat.push({ anh: `${ten}.jpg`, kb, loiTrang: loi, tranNgang: Math.max(0, kq.tran), dichNho: kq.nho, chuBiCat: kq.cat, chuHocSinh: kq.loiChu })
  console.log(`${String(kb).padStart(4)} KB  q${q}  ${ten}.jpg${loi.length ? `  LỖI: ${loi.join(' | ')}` : ''}${kq.tran > 0 ? `  TRÀN ${kq.tran}px` : ''}${kq.nho.length ? `  ĐÍCH NHỎ: ${kq.nho.join(' | ')}` : ''}${kq.cat.length ? `  CHỮ CẮT: ${kq.cat.join(' | ')}` : ''}${kq.loiChu.length ? `  CHỮ HS: ${kq.loiChu.join(' | ')}` : ''}`)
  await p.close()
}

// ── 3. video: chạy lần lượt các cảnh của bài liên kết ──
const VID = []
if (VIDEO) {
  let coFfmpeg = true
  try { execFileSync('ffmpeg', ['-hide_banner', '-version'], { stdio: 'ignore' }) } catch { coFfmpeg = false }
  for (const [ten, w, h, nen, dpr] of [['video-nhat-ky-may-tinh-1366', 1366, 768, 'sang', 1], ['video-nhat-ky-dien-thoai-390', 390, 844, 'toi', 2]]) {
    const tam = mkdtempSync(join(tmpdir(), 'nk-video-'))
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: nen === 'toi' ? 'dark' : 'light', hasTouch: w < 900, isMobile: w < 900, recordVideo: { dir: tam, size: { width: w * dpr, height: h * dpr } } })
    const p = await ctx.newPage(), batDau = Date.now()
    await p.goto(`${GOC_URL}nhat-ky.html?toc=1.5&ghi=0`)
    await p.waitForSelector('html[data-san]', { timeout: 10000 })
    const tai = (Date.now() - batDau) / 1000
    await p.waitForTimeout(3600)
    const toi = async (id, them) => {
      await p.evaluate((id) => { const e = document.getElementById(id); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? 64 : 72), behavior: 'smooth' }) }, id)
      await p.waitForTimeout(900)
      const ms = await p.evaluate((id) => window.NK_TRANG.dk[id].thoiLuong, id)
      await p.waitForTimeout(Math.min(9000, ms + (them || 300)))
    }
    await toi('c1')
    await toi('c3')
    await toi('c4', 0)
    await p.click('#c4 .dn-pa >> nth=0'); await p.waitForTimeout(400)
    await p.evaluate(() => { const e = document.querySelector('#c4 .dn-mo'); e.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
    await p.waitForTimeout(3300)
    await toi('c5')
    await toi('c7')
    await toi('c8')
    await toi('c11', -2600)
    const tong = (Date.now() - batDau) / 1000
    await ctx.close()
    const webm = readdirSync(tam).find((x) => x.endsWith('.webm'))
    let ra = join(DAY, `${ten}.webm`)
    if (coFfmpeg) {
      ra = join(DAY, `${ten}.mp4`)
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(Math.max(0, tai + 0.2)), '-i', join(tam, webm), '-c:v', 'libx264', '-preset', 'slow', '-crf', dpr > 1 ? '27' : '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', ra])
    } else renameSync(join(tam, webm), ra)
    rmSync(tam, { recursive: true, force: true })
    const mb = statSync(ra).size / 1e6
    VID.push({ video: ra.split('/').pop(), giay: Math.round(tong - tai), mb: +mb.toFixed(2) })
    console.log(`VIDEO ${ra.split('/').pop()}  ${(tong - tai).toFixed(1)} giây  ${mb.toFixed(2)} MB`)
  }
}

await b.close(); may.close()
if (!loc && !CHI_VIDEO) {
  const tong = { anh: soat.length, loiTrang: soat.reduce((s, x) => s + x.loiTrang.length, 0), tranNgang: soat.filter((x) => x.tranNgang > 0).length, dichNho: soat.reduce((s, x) => s + x.dichNho.length, 0), chuBiCat: soat.reduce((s, x) => s + x.chuBiCat.length, 0), chuHocSinh: soat.reduce((s, x) => s + x.chuHocSinh.length, 0), anhQua150KB: soat.filter((x) => x.kb > 150).length }
  const cu = existsSync(join(DAY, 'soat.json')) ? JSON.parse(readFileSync(join(DAY, 'soat.json'), 'utf8')) : {}
  writeFileSync(join(DAY, 'soat.json'), JSON.stringify({ tong, anh: soat, video: VID.length ? VID : cu.video || [] }, null, 1) + '\n')
  console.log('TỔNG', JSON.stringify(tong))
} else if (VID.length && existsSync(join(DAY, 'soat.json'))) {
  const cu = JSON.parse(readFileSync(join(DAY, 'soat.json'), 'utf8')); cu.video = VID; writeFileSync(join(DAY, 'soat.json'), JSON.stringify(cu, null, 1) + '\n')
}
