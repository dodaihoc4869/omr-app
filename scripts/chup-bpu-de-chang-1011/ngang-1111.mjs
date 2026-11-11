#!/usr/bin/env node
// ĐO + CHỤP «BỐ CỤC NGANG màn câu hỏi Bình Phản Ứng trên máy em» (thầy 11/11 tối: «câu hỏi xoay ngang trên máy học sinh thì hiển thị giao diện xoay
// ngang, một bên đề một bên chọn đáp án»). Chromium THẬT (isMobile + hasTouch), trang chụp có phòng giả lõi thật (trang.tsx), dữ liệu giả.
//   npx vite build --config scripts/chup-bpu-de-chang-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-bpu-de-chang-1011/ngang-1111.mjs <thư mục tạm> [nhãn: truoc|sau] [thư mục ảnh = docs/ban-ve-live-1011]
// Mỗi cảnh (dạng câu × khổ): đã chọn đủ (nút «Gửi» đã bật) rồi đo —
//   trangCuon  trang / gốc màn / thân màn cuộn dọc được (ngang: phải KHÔNG)          traCuon  cột trả lời phải cuộn mới thấy hết (phải KHÔNG)
//   ngoai      số nút trả lời nằm ngoài khung nhìn hoặc bị cắt / bị che (điểm giữa không chạm được)   nho  số nút < 44 px
//   haiCot     cột trả lời nằm bên phải đề        deCuon  đề dài cuộn được trong cột trái (chỉ cảnh đề dài)   bdDe  thẻ ±kJ đè nút trả lời / nút «Gửi»
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-bpu')
const NHAN = process.argv[3] ?? 'sau'
const ANH = resolve(process.argv[4] ?? join(import.meta.dirname, '../../docs/ban-ve-live-1011'))
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-bpu-de-chang-1011/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** Chọn đủ để nút «Gửi» bật (trạng thái em sắp gửi — nút nổi đã trượt vào mép phải). */
const CHON = {
  I: async (t) => { await t.getByRole('radio').nth(1).click() },
  II: async (t) => { for (const [i, v] of ['Đúng', 'Sai', 'Đúng', 'Sai'].entries()) await t.getByRole('group', { name: `Chọn cho ý ${'abcd'[i]}` }).getByRole('button', { name: new RegExp(`^${v}`) }).click() },
  III: async (t) => { for (const s of ['6', ',', '4', '8']) await t.locator('.bpu-phim button', { hasText: new RegExp(`^${s}$`) }).click() },
}
const PHAN = { tn: 'I', 'tn-dai': 'I', ngan: 'I', ds: 'II', dai: 'II', tln: 'III' }
const NGANG = [[640, 360], [740, 360], [844, 390], [932, 430]]
/** Cảnh: dạng câu × khổ. `anh` = lưu ảnh (tên sau tiền tố bpu-ngang-<nhãn>-). */
const CANH = []
for (const cau of ['tn', 'ds', 'tln']) for (const [w, h] of NGANG) CANH.push({ cau, w, h, anh: w === 740 || (w === 640 && cau === 'ds') || (w === 932 && cau === 'tn') })
for (const [w, h] of NGANG) CANH.push({ cau: 'dai', w, h, anh: w === 844 })
for (const [w, h] of NGANG) CANH.push({ cau: 'tn-dai', w, h, anh: w === 640 })
CANH.push({ cau: 'tn', w: 740, h: 360, bd: true, anh: true })
CANH.push({ cau: 'ds', w: 740, h: 360, toi: true, anh: NHAN === 'sau' })
for (const cau of ['tn', 'ds', 'tln', 'dai']) CANH.push({ cau, w: 390, h: 844, doc: true, anh: cau === 'ds' })
for (const cau of ['tn', 'ds', 'tln', 'dai']) CANH.push({ cau, w: 1366, h: 768, anh: cau === 'ds' || cau === 'dai' })

const doCanh = (t) => t.evaluate(() => {
  const W = innerWidth, H = innerHeight
  const hop = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const cat = (a, b) => a.x < b.r - 1 && b.x < a.r - 1 && a.y < b.b - 1 && b.y < a.b - 1
  const g = document.querySelector('.bpu-hs'), than = document.querySelector('.bpu-hs-than'), tra = document.querySelector('.bpu-tra')
  const cuon = (e) => !!e && e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflowY !== 'hidden' && getComputedStyle(e).overflowY !== 'clip'
  const se = document.scrollingElement
  const trangCuon = se.scrollHeight > H + 1 || cuon(g) || cuon(than)
  const traCuon = cuon(tra)
  // nút trả lời thật sự chạm được: trong khung nhìn + điểm giữa không bị phần tử khác che (cắt bởi khung cuộn ⇒ điểm giữa rơi vào phần tử khác)
  const nut = tra ? [...tra.querySelectorAll('button, [role=radio], .ht2-lam-o-hang')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }) : []
  const ngoai = nut.filter((e) => {
    const r = hop(e)
    if (r.x < -0.5 || r.y < -0.5 || r.r > W + 0.5 || r.b > H + 0.5) return true
    const o = document.elementFromPoint(r.x + r.w / 2, r.y + r.h / 2)
    return !o || !(e === o || e.contains(o) || o.contains(e))
  }).map((e) => (e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 18))
  const nho = nut.filter((e) => !e.matches('.ht2-lam-o-hang') && (hop(e).h < 43.5 || hop(e).w < 43.5)).map((e) => `${(e.textContent || '').trim().slice(0, 8)}:${Math.round(hop(e).w)}×${Math.round(hop(e).h)}`)
  const de = document.querySelector('.bpu-cot-de') ?? document.querySelector('.bpu-hs-than > .bpu-de-chang') ?? document.querySelector('.bpu-hs-than .ht2-lam-de')
  const haiCot = !!de && !!tra && hop(tra).x >= hop(de).r - 1 && hop(tra).y < hop(de).b
  // cột đề cuộn RIÊNG (sau) — trước: cả thân màn cuộn
  const cotDe = document.querySelector('.bpu-cot-de')
  let deCuon = null
  const khungDe = cotDe && cuon(cotDe) ? cotDe : null
  if (khungDe) { const t0 = khungDe.scrollTop; khungDe.scrollTop = 99999; deCuon = khungDe.scrollTop > t0; khungDe.scrollTop = t0 }
  const gui = document.querySelector('.bpu-gui-noi[data-hien="true"]')
  const deNut = gui ? nut.filter((e) => cat(hop(e), hop(gui))).length : 0
  const bd = document.querySelector('.bpu-bd-the')
  const bdDe = bd ? nut.filter((e) => cat(hop(e), hop(bd))).length + (gui && cat(hop(bd), hop(gui)) ? 1 : 0) : null
  const tren = document.querySelector('.bpu-hs-tren')
  const gt = document.querySelector('.duo-gt-nv svg')
  const bong = document.querySelector('.duo-gt-bong')
  const deChu = document.querySelector('.ht2-lam-de')
  // bảng lớn cuộn NGANG trong khung riêng (LamCau.BangDe, có bóng mép) ⇒ đo khung bảng, không đo bảng
  const tranDe = deChu && bong ? [...deChu.querySelectorAll('.ht2-lam-de-chu, img, table')].map((x) => (x.matches('table') ? x.closest('.bang-de') ?? x : x)).filter((x) => x.getBoundingClientRect().width > 0 && (hop(x).r > hop(bong).r + 1 || hop(x).x < hop(bong).x - 1)).length : 0
  const cuonNgang = (than && than.scrollWidth > than.clientWidth + 1) || se.scrollWidth > W + 1
  // ảnh cuối câu: NGANG ⇒ trong cột đề (cuộn cùng đề) · DỌC ⇒ nằm SAU phần trả lời như trước (thứ tự hiển thị, không phải thứ tự cây)
  const anhCuoi = document.querySelector('.bpu-hs-than img[alt="Hình cuối câu"]')
  const cuoi = !anhCuoi || !tra ? null : getComputedStyle(than).display === 'grid' ? (anhCuoi.closest('.bpu-cot-de') ? 'cot-de' : 'SAI-cho') : hop(anhCuoi).y >= hop(tra).b - 1 ? 'sau-tra' : 'SAI-truoc-tra'
  return { trangCuon, traCuon, soNut: nut.length, ngoai, nho, haiCot, deCuon, deNut, bdDe, cuonNgang, tranDe, dauCao: tren ? Math.round(hop(tren).h) : 0, giamThi: gt ? Math.round(hop(gt).w) : 0, cuoi, phieu: !!document.querySelector('.bpu-hs-than[data-gon]') }
})

let soDo = 0
const bang = []
for (const c of CANH) {
  const ctx = await trinh.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2, isMobile: c.w < 1000, hasTouch: true, colorScheme: c.toi ? 'dark' : 'light' })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(`${goc}/?man=bpu&cau=${c.cau}`)
  await t.evaluate(() => document.fonts.ready)
  await t.locator('.ht2-lam-de').first().waitFor({ timeout: 15000 })
  await t.waitForTimeout(1600) // phông + giám thị nạp lười + quyết khung chữ L
  await CHON[PHAN[c.cau]](t)
  await t.waitForTimeout(700) // nút «Gửi» trượt vào
  if (c.bd) { await t.evaluate(() => window.__bpu.bd()); await t.waitForTimeout(320) }
  const so = await doCanh(t)
  const ten = `${c.cau}-${c.w}x${c.h}${c.bd ? '-the-kj' : ''}${c.toi ? '-toi' : ''}`
  if (c.anh) {
    let q = 80, buf
    do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1000 && q > 30)
    writeFileSync(join(ANH, `bpu-ngang-${NHAN}-${ten}.jpg`), buf)
  }
  // ĐẠT: ngang ⇒ hai cột + không cuộn trang + cột trả lời không cuộn + mọi nút trọn khung, chạm được, ≥ 44 px + không đè; dọc ⇒ chỉ cần chạm được / không đè
  const xau = [
    !c.doc && !so.haiCot && 'chưa hai cột', !c.doc && so.trangCuon && 'trang cuộn', !c.doc && so.traCuon && 'cột trả lời cuộn',
    !c.doc && so.ngoai.length && `nút ngoài khung ${so.ngoai.length}`, so.nho.length && `nút < 44 px ${so.nho.length}`, so.deNut && 'Gửi đè nút',
    so.bdDe && 'thẻ kJ đè nút', so.cuonNgang && 'cuộn ngang', so.tranDe && 'chữ đề tràn bong bóng', c.cau === 'dai' && !c.doc && c.h < 700 && so.deCuon === false && 'đề dài không cuộn trong cột',
    so.cuoi?.startsWith('SAI') && `ảnh cuối câu ${so.cuoi}`,
    loi.length && `lỗi JS: ${loi[0]}`,
  ].filter(Boolean)
  if (xau.length) soDo++
  bang.push({ ten, xau, so })
  console.log(`${xau.length ? 'ĐỎ' : 'ok'} ${ten.padEnd(26)} ${xau.join(' · ')}${xau.length ? ' · ' : ''}${JSON.stringify(so)}`)
  await ctx.close()
}
writeFileSync(join(DIST, '..', `bpu-ngang-${NHAN}.json`), JSON.stringify(bang, null, 1)) // số đo đủ, cạnh thư mục bản build tạm
await trinh.close(); may.close()
console.log(soDo ? `${soDo}/${CANH.length} cảnh đỏ` : `0 đỏ / ${CANH.length} cảnh`)
process.exit(soDo ? 1 : 0)
