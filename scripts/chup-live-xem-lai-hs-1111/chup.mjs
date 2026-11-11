#!/usr/bin/env node
// CHỤP + ĐO «Xem lại Live — máy em» (đợt X2, 11/11) — Chromium thật, dữ liệu giả đúng hợp đồng (tests/_live-xem-lai-hs-gia.ts).
//   npx vite build --config scripts/chup-live-xem-lai-hs-1111/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-live-xem-lai-hs-1111/chup.mjs <thư mục tạm> <thư mục ảnh> [cảnh,cảnh… | do]
// Máy chủ GIẢ = chặn mọi yêu cầu tới https://may-chu-gia.test: `/hs/live-ds`, `/hs/live-buoi`, `/live-tep/<id>/<tệp>` (có Range ⇒ 206, kể cả tệp tiếng).
// `do` = chỉ đo khung hình trình phát (CPU ×1, ×4, máy yếu ×4), in bảng số. Mỗi cảnh in: lỗi trang, cuộn ngang, cỡ ảnh.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-chup-xl')
const ANH = resolve(process.argv[3] ?? 'docs/ban-ve-live-xem-lai-1011')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
const CHI_DO = CHON.includes('do')
mkdirSync(ANH, { recursive: true })

// ── dữ liệu giả: đóng gói bộ sinh (TypeScript) rồi nạp ──
const tam = mkdtempSync(join(tmpdir(), 'xl-gia-'))
await build({ entryPoints: [join(GOC, 'tests/_live-xem-lai-hs-gia.ts')], bundle: true, platform: 'node', format: 'esm', outfile: join(tam, 'gia.mjs'), logLevel: 'warning' })
const gia = await import(pathToFileURL(join(tam, 'gia.mjs')).href)
const kho = new Map()
/** Bộ tệp của buổi giả theo (giấy tối, có tiếng). Tệp tiếng là WAV 8 kHz (máy chủ thật trả MP3). */
function buoiGia(giayToi, coTieng) {
  const k = `${giayToi}|${coTieng}`
  if (!kho.has(k)) {
    const b = gia.taoBuoiGia({ giayToi, coTieng })
    kho.set(k, { buoi: b.buoi, net: Buffer.from(b.net), tieng: coTieng ? Buffer.from(gia.taoTiengGia(b.buoi.msLive, b.coTieng)) : null })
  }
  return kho.get(k)
}
const homNayVn = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)

// ── máy chủ tĩnh cho bản build ──
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = join(GOC, 'public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-live-xem-lai-hs-1111/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'content-range, accept-ranges, content-length' }
/** Gắn máy chủ giả vào một ngữ cảnh trình duyệt. `tt` (đổi được giữa cảnh): '' | rong | xuly | loi | go | mat. */
async function ganMayChu(ctx, c) {
  const st = { tt: c.tt ?? '', goi: [] }
  await ctx.route('https://may-chu-gia.test/**', async (route) => {
    const req = route.request(), u = new URL(req.url())
    st.goi.push(`${req.method()} ${u.pathname}${req.headers().range ? ` [${req.headers().range}]` : ''}`)
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const d = buoiGia(c.giay === 'toi', c.tieng !== 0)
    const json = (o, status = 200) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(o) })
    if (st.tt === 'mat') return route.abort('internetdisconnected')
    if (u.pathname === '/hs/live-ds') {
      if (st.tt === 'loi') return json({ ok: false }, 500)
      if (st.tt === 'rong') return json({ buoi: [] })
      const ds = gia.taoDsGia(d.buoi)
      if (st.tt === 'xuly') ds.buoi.unshift({ ...ds.buoi[1], id: 'buoi-gia-dang-dung', ngay: homNayVn, tenTuDong: '', trangThai: 'dang_xu_ly', tienDo: 62, ve: null, lenBang: [] })
      return json(ds)
    }
    if (u.pathname === '/hs/live-buoi') return st.tt === 'go' ? json({ ok: false }, 404) : json(gia.taoRiengGia(d.buoi))
    const m = /^\/live-tep\/([^/]+)\/([^/]+)$/.exec(u.pathname)
    if (!m || st.tt === 'go') return json({ ok: false }, 404)
    if (m[2] === 'buoi.json') return json(d.buoi)
    const than = m[2] === 'net.bin' ? d.net : m[2] === 'tieng.mp3' ? d.tieng : null
    if (!than) return json({ ok: false }, 404)
    const loai = m[2] === 'net.bin' ? 'application/octet-stream' : 'audio/wav'
    const r = /bytes=(\d+)-(\d*)/.exec(req.headers().range ?? '')
    if (!r) return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': loai, 'accept-ranges': 'bytes' }, body: than })
    const a = +r[1], b = Math.min(than.length - 1, r[2] ? +r[2] : than.length - 1)
    return route.fulfill({ status: 206, headers: { ...CORS, 'content-type': loai, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${than.length}` }, body: than.subarray(a, b + 1) })
  })
  return st
}

const cho = (t, ms) => t.waitForTimeout(ms)
/** Phần của đoạn câu `so` ngay TRƯỚC khoảng lặng dài của nó 2,5 giây (để chụp «Đã lược 0:42 khoảng lặng»). */
function truocLang(so) {
  const b = buoiGia(false, true).buoi, d = b.doan.find((x) => x.cau === so), k = b.lang.find((x) => x[0] > d.t0 && x[1] < d.t1)
  return (k[0] - 2500 - d.t0) / (d.t1 - d.t0)
}
/** Chạm thanh tua tại khúc thứ `i` (0..), phần `f` của khúc (hình xoay 90° ⇒ khúc nằm dọc trên màn). */
async function tuaToi(t, i, f) {
  const o = await t.locator('.xp-khuc').nth(i).boundingBox()
  const doc = o.height > o.width * 2
  await t.mouse.click(doc ? o.x + o.width / 2 : o.x + o.width * f, doc ? o.y + o.height * f : o.y + o.height - 6)
}
const moPhat = async (t, cau = 3) => { await t.locator(`#xl-cau-${cau} .xl-bia-nut`).first().click(); await t.locator('.xp').waitFor(); await cho(t, 900) }
const choBuoi = async (t) => { await t.locator('.xl-bia-buoi').waitFor(); await t.locator('.xl-de .ht2-lam-de').first().waitFor({ timeout: 15000 }).catch(() => {}); await cho(t, 400) }

/** Cảnh: tên ảnh, đường dẫn, khổ, sáng / tối, thao tác trước khi chụp. `cuon` = chụp thêm sau khi cuộn tới phần tử. */
const CANH = [
  // 1 · tấm «Thêm» có dòng «Live»
  { ten: '01-them-dong-live-390-sang', url: '?man=them', w: 390, h: 844, lam: async (t) => { await t.getByRole('button', { name: /^Thêm/ }).click(); await t.locator('.xl-chip-moi').waitFor() } },
  { ten: '02-them-dong-live-390-toi', url: '?man=them', w: 390, h: 844, toi: true, lam: async (t) => { await t.getByRole('button', { name: /^Thêm/ }).click(); await t.locator('.xl-chip-moi').waitFor() } },
  { ten: '03-them-dong-live-844-ngang-sang', url: '?man=them', w: 844, h: 390, lam: async (t) => { await t.getByRole('button', { name: /^Thêm/ }).click(); await t.locator('.xl-chip-moi').waitFor() } },
  { ten: '04-them-dong-live-1366-toi', url: '?man=them', w: 1366, h: 820, toi: true, mayTinh: true, lam: async (t) => { await t.getByRole('button', { name: /^Thêm/ }).click(); await t.locator('.xl-chip-moi').waitFor() } },
  // 2 · danh sách
  { ten: '05-danh-sach-390-sang', url: '?man=ds', w: 390, h: 844, lam: async (t) => { await t.locator('.xl-noi').waitFor() } },
  { ten: '06-danh-sach-390-toi', url: '?man=ds', w: 390, h: 844, toi: true, lam: async (t) => { await t.locator('.xl-noi').waitFor() } },
  { ten: '07-danh-sach-844-ngang-sang', url: '?man=ds', w: 844, h: 390, lam: async (t) => { await t.locator('.xl-noi').waitFor() } },
  { ten: '08-danh-sach-1366-sang', url: '?man=ds', w: 1366, h: 820, mayTinh: true, lam: async (t) => { await t.locator('.xl-noi').waitFor() } },
  { ten: '09-danh-sach-rong-390-sang', url: '?man=ds', w: 390, h: 844, tt: 'rong', lam: async (t) => { await t.locator('.xl-trong').waitFor() } },
  { ten: '10-danh-sach-dang-dung-390-toi', url: '?man=ds', w: 390, h: 844, toi: true, tt: 'xuly', lam: async (t) => { await t.locator('.xl-xuly').waitFor() } },
  { ten: '11-danh-sach-mat-mang-390-sang', url: '?man=ds', w: 390, h: 844, lam: async (t, st) => { await t.locator('.xl-noi').waitFor(); st.tt = 'mat'; await t.reload(); await t.locator('.xl-bao').waitFor() } },
  { ten: '12-danh-sach-loi-390-sang', url: '?man=ds', w: 390, h: 844, tt: 'loi', lam: async (t) => { await t.getByRole('button', { name: 'Thử lại' }).waitFor() } },
  { ten: '13-danh-sach-dang-tai-390-sang', url: '?man=ds', w: 390, h: 844, tt: 'treo', lam: async (t) => { await t.locator('.xl-xuong').first().waitFor() } },
  // 3 · trang buổi
  { ten: '14-buoi-390-sang-1-dau', url: '?man=buoi', w: 390, h: 844, lam: choBuoi },
  { ten: '15-buoi-390-sang-2-bang-vang', url: '?man=buoi', w: 390, h: 844, lam: async (t) => { await choBuoi(t); await t.locator('.xl-thang-doi').evaluate((e) => e.closest('.xl-the').scrollIntoView({ block: 'start' })); await cho(t, 200) } },
  { ten: '16-buoi-390-sang-3-cau', url: '?man=buoi', w: 390, h: 844, lam: async (t) => { await choBuoi(t); await t.locator('#xl-cau-3').evaluate((e) => e.scrollIntoView({ block: 'start' })); await t.locator('#xl-cau-3 .xl-mo').click(); await cho(t, 500) } },
  { ten: '17-buoi-390-toi-1-dau', url: '?man=buoi', w: 390, h: 844, toi: true, lam: choBuoi },
  { ten: '18-buoi-390-toi-3-cau', url: '?man=buoi', w: 390, h: 844, toi: true, lam: async (t) => { await choBuoi(t); await t.locator('#xl-cau-3').evaluate((e) => e.scrollIntoView({ block: 'start' })); await cho(t, 300) } },
  { ten: '19-buoi-844-ngang-sang', url: '?man=buoi', w: 844, h: 390, lam: choBuoi },
  { ten: '20-buoi-da-go-390-sang', url: '?man=buoi', w: 390, h: 844, tt: 'go', lam: async (t) => { await t.getByText('Thầy đã gỡ buổi này.').waitFor() } },
  // 4 · trình phát
  { ten: '21-phat-844-giay-sang-dang-phat', url: '?man=buoi', w: 844, h: 390, lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '22-phat-844-giay-toi-dang-phat', url: '?man=buoi', w: 844, h: 390, giay: 'toi', lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '23-phat-844-tam-dung', url: '?man=buoi', w: 844, h: 390, lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.4); await cho(t, 1500); await t.getByRole('button', { name: 'Tạm dừng' }).click(); await cho(t, 300) } },
  { ten: '24-phat-844-an-dieu-khien-luoc-lang', url: '?man=buoi', w: 844, h: 390, lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, truocLang(3)); await t.locator('.xp-luoc').waitFor({ timeout: 30000 }); await t.mouse.move(420, 120); await t.locator('.xp[data-an]').waitFor({ timeout: 8000 }); await cho(t, 300) } },
  { ten: '25-phat-390-iphone-doc-xoay', url: '?man=buoi', w: 390, h: 844, lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '26-phat-1180-may-bang', url: '?man=buoi', w: 1180, h: 820, mayBang: true, lam: async (t) => { await choBuoi(t); await t.locator('.xl-doan').first().click(); await t.locator('.xp').waitFor(); await cho(t, 900); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '27-phat-844-khong-tieng', url: '?man=buoi', w: 844, h: 390, tieng: 0, lam: async (t) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.3); await cho(t, 2600) } },
  { ten: '28-phat-844-mat-mang', url: '?man=buoi', w: 844, h: 390, lam: async (t, st, ctx) => { await choBuoi(t); await moPhat(t); await tuaToi(t, 2, 0.36); await cho(t, 2000); st.tt = 'mat'; await ctx.setOffline(true); await t.locator('.xp-mat').waitFor({ timeout: 8000 }); await cho(t, 300) } },
  // 5 · máy tính hai cột (trình phát nhúng, điều khiển dưới bảng)
  { ten: '29-buoi-may-tinh-1366-sang', url: '?man=buoi', w: 1366, h: 900, mayTinh: true, lam: async (t) => { await choBuoi(t); await t.locator('.xl-doan').first().click(); await cho(t, 900); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '30-buoi-may-tinh-1366-toi', url: '?man=buoi', w: 1366, h: 900, mayTinh: true, toi: true, giay: 'toi', lam: async (t) => { await choBuoi(t); await t.locator('.xl-doan').first().click(); await cho(t, 900); await tuaToi(t, 2, 0.36); await cho(t, 2600) } },
  { ten: '31-thay-mo-xem-1366-sang', url: '?man=gv', w: 1366, h: 900, mayTinh: true, lam: async (t) => { await choBuoi(t); await cho(t, 600) } },
]

async function moCanh(c) {
  const dt = !c.mayTinh
  const ctx = await trinh.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.mayTinh ? 1 : c.mayBang ? 1.25 : 2, isMobile: dt && !c.mayBang, hasTouch: dt, colorScheme: c.toi ? 'dark' : 'light', reducedMotion: (c.url ?? '').includes('yeu=1') ? 'reduce' : 'no-preference' })
  const st = await ganMayChu(ctx, c)
  if (c.tt === 'treo') await ctx.route('https://may-chu-gia.test/hs/live-ds**', () => {}) // không trả lời ⇒ khung xương
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  t.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(m.text())) loi.push(m.text()) })
  await t.goto(`${goc}/${c.url}`)
  await t.evaluate(() => document.fonts.ready)
  return { ctx, t, st, loi }
}

let hong = 0
if (!CHI_DO) for (const c of CANH) {
  if (CHON.length && !CHON.some((x) => c.ten.includes(x))) continue
  const { ctx, t, st, loi } = await moCanh(c)
  try { await c.lam?.(t, st, ctx) } catch (e) { loi.push(`thao tác: ${String(e.message).split('\n')[0]}`) }
  const tran = await t.evaluate(() => { const e = document.querySelector('.xl') ?? document.documentElement; return e.scrollWidth - e.clientWidth })
  const tep = join(ANH, `that-hs-${c.ten}.jpg`)
  let cl = 82, anh
  do { anh = await t.screenshot({ type: 'jpeg', quality: cl }); cl -= 8 } while (anh.length > 150 * 1024 && cl >= 30)
  writeFileSync(tep, anh)
  if (loi.length || tran > 1 || anh.length > 150 * 1024) hong += 1
  console.log(`${loi.length || tran > 1 ? '✗' : '✓'} ${c.ten} · ${(anh.length / 1024).toFixed(0)} KB · tràn ngang ${tran}px · lỗi ${loi.length}${loi.length ? ` → ${loi.slice(0, 3).join(' | ')}` : ''}`)
  await ctx.close()
}

// ── ĐO KHUNG HÌNH TRÌNH PHÁT: 20 giây đoạn nhiều nét (câu 3, 64 nét), tốc độ 2×; khoảng giữa hai khung liên tiếp ──
async function doKhung(nhan, { w, h, cpu, yeu, mayTinh }) {
  const { ctx, t, loi } = await moCanh({ url: `?man=buoi${yeu ? '&yeu=1' : ''}`, w, h, mayTinh })
  await choBuoi(t)
  if (mayTinh) { await t.locator('.xl-doan').first().click(); await cho(t, 900) } else await moPhat(t)
  await tuaToi(t, 2, 0.05)
  await t.getByRole('button', { name: 'Tốc độ 2 lần' }).click()
  const cdp = await ctx.newCDPSession(t)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await cho(t, 1500)
  const so = await t.evaluate(() => new Promise((xong) => {
    const ds = []; let truoc = 0
    const dau = performance.now()
    const f = (nay) => { if (truoc) ds.push(nay - truoc); truoc = nay; if (nay - dau < 20000) requestAnimationFrame(f); else xong(ds) }
    requestAnimationFrame(f)
  }))
  const dangPhat = await t.locator('.xp-n.chinh[aria-label="Tạm dừng"]').count()
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await ctx.close()
  const s = so.slice().sort((a, b) => a - b), pt = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))]
  const tb = so.reduce((x, y) => x + y, 0) / so.length
  console.log(`${nhan.padEnd(34)} khung ${String(so.length).padStart(4)} · tb ${tb.toFixed(1)} ms · p50 ${pt(0.5).toFixed(1)} · p95 ${pt(0.95).toFixed(1)} · p99 ${pt(0.99).toFixed(1)} · dài nhất ${s[s.length - 1].toFixed(0)} ms · > 20 ms: ${so.filter((x) => x > 20).length} · > 33 ms: ${so.filter((x) => x > 33.4).length} · đang phát: ${dangPhat ? 'có' : 'KHÔNG'} · lỗi ${loi.length}`)
}
// ── KIỂM HÀNH VI TRÌNH PHÁT trên Chromium thật (tiếng thật qua <audio>): hết đoạn tự sang đoạn kế · «Đã xem» · mất mạng dừng rồi phát tiếp · tua lùi ──
async function kiemHanhVi() {
  const { ctx, t, st, loi } = await moCanh({ url: '?man=buoi', w: 844, h: 390 })
  const ra = []
  const gio = async () => { const [m, s] = (await t.locator('.xp-gio > span').first().textContent()).split(':').map(Number); return m * 60 + s }
  await choBuoi(t); await moPhat(t)
  await tuaToi(t, 2, 0.992)
  if (process.env.XL_SOI) for (let i = 0; i < 8; i++) { await cho(t, 1000); console.log('soi', await t.locator('.xp-ten > span').textContent(), await t.locator('.xp-gio').textContent(), await t.locator('.xp-n.chinh').getAttribute('aria-label'), await t.evaluate(() => { const a = document.querySelector('.xp audio'); return a ? `${a.currentTime.toFixed(2)} paused=${a.paused} ended=${a.ended} rs=${a.readyState} dur=${a.duration}` : '' })) }
  await t.locator('.xp-ten > span', { hasText: 'Đoạn 4/5' }).waitFor({ state: 'attached', timeout: 15000 }).then(() => ra.push('✓ hết đoạn 3 ⇒ tự sang «Đoạn 4/5»'), () => ra.push('✗ không tự sang đoạn kế'))
  const net4 = st.goi.filter((x) => x.includes('net.bin')).length
  await tuaToi(t, 3, 0.5); await cho(t, 1200)
  const g1 = await gio(); await cho(t, 2200); const g2 = await gio()
  ra.push(`${g2 > g1 ? '✓' : '✗'} đang phát: giờ chạy ${g1}s → ${g2}s`)
  ra.push(`${st.goi.filter((x) => x.includes('net.bin')).length === net4 ? '✓' : '✗'} tua trong cùng khúc nét không tải lại net.bin`)
  await ctx.setOffline(true); st.tt = 'mat'
  await t.locator('.xp-mat').waitFor({ timeout: 8000 }).then(() => ra.push('✓ mất mạng ⇒ «Mất mạng · đang nối lại…»'), () => ra.push('✗ mất mạng không báo'))
  const g3 = await gio(); await cho(t, 2500); const g4 = await gio()
  ra.push(`${g4 === g3 ? '✓' : '✗'} mất mạng: dừng tại chỗ (${g3}s → ${g4}s)`)
  await ctx.setOffline(false); st.tt = ''
  await t.locator('.xp-mat').waitFor({ state: 'detached', timeout: 12000 }).then(() => ra.push('✓ có mạng ⇒ hết báo'), () => ra.push('✗ có mạng mà còn báo'))
  await cho(t, 2500); const g5 = await gio()
  ra.push(`${g5 > g4 && g5 - g4 < 8 ? '✓' : '✗'} có mạng: phát tiếp từ chỗ dừng (${g4}s → ${g5}s)`)
  await t.mouse.move(300, 100)
  await t.getByRole('button', { name: 'Lùi 10 giây' }).click(); await cho(t, 600); const g6 = await gio()
  ra.push(`${g6 < g5 && g5 - g6 >= 7 ? '✓' : '✗'} lùi 10 giây (${g5}s → ${g6}s)`)
  await t.mouse.move(300, 110)
  await t.getByRole('button', { name: 'Đóng trình phát' }).click()
  const daXem = await t.locator('.xl-doan .xem').count()
  ra.push(`${daXem >= 1 ? '✓' : '✗'} «Đã xem»: ${daXem} đoạn có dấu đã xem; dòng đầu danh sách: «${await t.locator('.xl-the[aria-label="Danh sách đoạn chữa bài"] h2 small').textContent()}»`)
  ra.push(`${loi.length ? '✗' : '✓'} lỗi trang: ${loi.length}${loi.length ? ` → ${loi.slice(0, 2).join(' | ')}` : ''}`)
  await ctx.close()
  console.log('\nHÀNH VI TRÌNH PHÁT (Chromium thật)\n' + ra.join('\n'))
  return ra.filter((x) => x.startsWith('✗')).length
}
if (CHI_DO || !CHON.length) hong += await kiemHanhVi()
if (CHI_DO || !CHON.length) {
  console.log('\nKHUNG HÌNH TRÌNH PHÁT (20 giây, đoạn câu 3 — 64 nét, tốc độ 2×; khoảng giữa hai khung, ms)')
  await doKhung('điện thoại 844×390 · CPU ×1', { w: 844, h: 390, cpu: 1 })
  await doKhung('điện thoại 844×390 · CPU ×4', { w: 844, h: 390, cpu: 4 })
  await doKhung('điện thoại 844×390 · CPU ×6', { w: 844, h: 390, cpu: 6 })
  await doKhung('máy yếu (30 khung/giây) · CPU ×4', { w: 844, h: 390, cpu: 4, yeu: true })
  await doKhung('máy tính 1366×900 nhúng · CPU ×1', { w: 1366, h: 900, cpu: 1, mayTinh: true })
  await doKhung('máy tính 1366×900 nhúng · CPU ×4', { w: 1366, h: 900, cpu: 4, mayTinh: true })
}
await trinh.close()
may.close()
console.log(hong ? `\n${hong} cảnh có lỗi` : '\nXong, không cảnh nào lỗi')
process.exit(hong ? 1 : 0)
