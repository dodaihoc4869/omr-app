// THỬ MÀN HỌC SINH XEM «NHẬT KÝ BÀI DẠY» (thầy 13/11) trên Chromium thật: trang tĩnh public/nhat-ky/ + dữ liệu máy chủ GIẢ (kịch bản mẫu của bản vẽ, nét phấn
// mẫu net-mau.js theo đúng dạng /live-tep/<id>/trang.json, tiếng mẫu). Kiểm: mở được, bìa + đủ cảnh, bảng phấn của Thầy có nét, «Xem như Thầy giảng» chạy,
// nút «Về buổi live» báo app đóng khung, không lỗi trang, khổ điện thoại + máy tính, sáng + tối.
// Chạy: node scripts/thu-nhat-ky/thu-nhat-ky-1311.mjs <thư mục ảnh>
import { createServer } from 'node:http'
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import vm from 'node:vm'
import { chromium } from 'playwright'

const GOC = process.cwd(), ANH = process.argv[2] || '/tmp/thu-nhat-ky', BV = join(GOC, 'docs/ban-ve-nhat-ky-bai-day-1311')
mkdirSync(ANH, { recursive: true })
const KIEU = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8' }
const may = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  try { const b = readFileSync(join(GOC, 'public', p)); res.writeHead(200, { 'content-type': KIEU[extname(p)] || 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end('') }
})
await new Promise((r) => may.listen(0, '127.0.0.1', r))
const TRANG = `http://127.0.0.1:${may.address().port}`, API = 'https://may-chu.thu'

// dữ liệu giả của «máy chủ»
let kb = JSON.parse(readFileSync(join(BV, 'kich-ban-lien-ket.json'), 'utf8'))
delete kb.mau; kb.buoi = { ten: kb.buoi.ten, lop: 'Live Khối 10', ngay: '2026-11-12', thu: 'Thứ Năm', gioBatDau: '20:18', phutLive: 39, ban: 2 }
const hop = { window: {} }; vm.runInNewContext(readFileSync(join(BV, 'net-mau.js'), 'utf8'), hop)
let trang = { trang: [{ stt: 1, loai: 'bang', ...hop.window.NET_MAU['lien-ket'] }] }
// THAT=<thư mục>: bài THẬT văn phòng đã soạn (nhat-ky.json) + nét phấn thật (net.bin, buoi.json) — trang.json dựng y như máy chủ (src/lib/nhat-ky/trang-bang.ts)
if (process.env.THAT) {
  const { build } = await import('esbuild'), ra = join(ANH, 'trang-bang.mjs')
  await build({ entryPoints: [join(GOC, 'src/lib/nhat-ky/trang-bang.ts')], bundle: true, format: 'esm', platform: 'node', outfile: ra, logLevel: 'silent' })
  const TB = await import(ra), D = process.env.THAT
  kb = JSON.parse(readFileSync(join(D, 'nhat-ky.json'), 'utf8'))
  const bj = JSON.parse(readFileSync(join(D, 'buoi.json'), 'utf8')), M = { nen: 'rgb(19,31,36)', mucXanh: 'rgb(125,170,255)', macDinh: 'rgb(244,239,228)' }
  trang = { trang: TB.tachTrang(new Uint8Array(readFileSync(join(D, 'net.bin'))), bj.msLive).map((t) => ({ stt: t.stt, loai: t.loai, ...TB.netKhuon(t, M) })) }
  console.log(`bài thật: ${kb.canh.length} cảnh · ${trang.trang.length} trang bảng`)
}
const mp3 = readFileSync(join(BV, 'tieng-mau.mp3'))

let hong = 0
const kiem = (ten, ok, chi = '') => { console.log(`${ok ? '✓' : '✗'} ${ten}${chi ? ' — ' + chi : ''}`); if (!ok) hong++ }
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' // trình duyệt cài sẵn của máy (như bộ thử live)
const tr = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
for (const [kho, w, h, toi] of [['dien-thoai', 390, 844, true], ['may-tinh', 1366, 768, false]]) {
  const ctx = await tr.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', hasTouch: kho === 'dien-thoai' })
  const p = await ctx.newPage(), loi = []
  p.on('pageerror', (e) => loi.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
  await p.route(`${API}/**`, async (rt) => {
    const u = new URL(rt.request().url())
    if (!u.searchParams.get('ve')) return rt.fulfill({ status: 403, body: '{}' })
    if (u.pathname.endsWith('/nhat-ky.json')) return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(kb) })
    if (u.pathname.endsWith('/trang.json')) return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trang) })
    if (u.pathname.endsWith('/tieng.mp3')) return rt.fulfill({ status: 200, contentType: 'audio/mpeg', body: mp3 })
    return rt.fulfill({ status: 404, body: '{}' })
  })
  await p.goto(`${TRANG}/nhat-ky/?id=b1&ve=ve-thu&goc=${encodeURIComponent(API)}`)
  await p.waitForSelector('html[data-san]', { timeout: 15000 })
  const bia = await p.evaluate(() => ({ ten: document.getElementById('bia-ten')?.textContent ?? '', canh: document.querySelectorAll('section.canh').length, nut: !!document.getElementById('nut-giang'), tieuDe: document.title }))
  kiem(`[${kho}] mở được: bìa có tên bài, đủ cảnh, nút «Xem như Thầy giảng»`, !!bia.ten && bia.canh >= 4 && bia.nut, JSON.stringify(bia))
  const vungDung = await p.evaluate(() => { const T = window.NK_TRANG; return T ? T.ds.length : 0 })
  kiem(`[${kho}] đủ cảnh dựng xong`, vungDung === bia.canh, String(vungDung))
  await p.screenshot({ path: join(ANH, `nk-${kho}-bia.jpg`), type: 'jpeg', quality: 60 })
  // cuộn tới cảnh đầu: bảng phấn của Thầy có nét (canvas có điểm ảnh khác nền)
  await p.evaluate(() => document.querySelector('section.canh')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(2500)
  const net = await p.evaluate(() => { const c = document.querySelector('section.canh .bp canvas'); if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 30) n++; return n })
  kiem(`[${kho}] bảng phấn của Thầy ở cảnh đầu có nét thật (nét từ trang bảng)`, net > 200, `điểm có mực: ${net}`)
  const soBang = await p.evaluate(() => [...document.querySelectorAll('section.canh')].filter((s) => s.getAttribute('data-khuon') !== 'tong-ket').map((s) => { const c = s.querySelector('.bp canvas'); return !!c }))
  kiem(`[${kho}] mọi cảnh (trừ tổng kết) có ô «Bảng của Thầy»`, soBang.every(Boolean), JSON.stringify(soBang))
  await p.screenshot({ path: join(ANH, `nk-${kho}-canh.jpg`), type: 'jpeg', quality: 60 })
  // Xem như Thầy giảng
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#nut-giang'); await p.waitForTimeout(1500)
  const giang = await p.evaluate(() => ({ trinh: !document.getElementById('trinh').hidden, ten: document.getElementById('tr-ten').textContent }))
  kiem(`[${kho}] «Xem như Thầy giảng»: thanh trình phát hiện, đang ở cảnh đầu`, giang.trinh && !!giang.ten, JSON.stringify(giang))
  await p.screenshot({ path: join(ANH, `nk-${kho}-giang.jpg`), type: 'jpeg', quality: 60 })
  await p.click('#tr-thoat').catch(() => {})
  // nút «Về buổi live» ⇒ báo app đóng khung
  const bao = await p.evaluate(() => new Promise((ok) => { window.addEventListener('message', (e) => ok(e.data), { once: true }); document.querySelector('.lui').click(); setTimeout(() => ok(null), 800) }))
  kiem(`[${kho}] nút «Về buổi live» báo app đóng khung`, !!bao && bao.nguon === 'nhat-ky' && bao.loai === 'dong', JSON.stringify(bao))
  kiem(`[${kho}] không lỗi trang`, loi.length === 0, loi.slice(0, 3).join(' | '))
  await ctx.close()
}
// chưa có nhật ký / vé sai ⇒ báo dịu, không trắng trang
{
  const p = await tr.newPage()
  await p.route(`${API}/**`, (rt) => rt.fulfill({ status: 404, body: '{}' }))
  await p.goto(`${TRANG}/nhat-ky/?id=b1&ve=x&goc=${encodeURIComponent(API)}`); await p.waitForSelector('html[data-san]', { timeout: 15000 })
  kiem('chưa có nhật ký ⇒ báo «Chưa tải được nhật ký. Em thử lại.»', /Chưa tải được nhật ký/.test(await p.textContent('#nk')))
}
await tr.close(); may.close()
console.log(hong ? `HỎNG ${hong}` : 'TẤT CẢ ĐẠT'); process.exit(hong ? 1 : 0)
