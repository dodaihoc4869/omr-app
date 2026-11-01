// CHỤP BẢN VẼ «Đấu Nguyên Tử» 3 ĐẤU 3 trên BẢN BUILD THẬT (dist/, `npm run build` trước) bằng Chromium có sẵn — KHÔNG tải trình duyệt.
//   node docs/ban-ve-dau-ion-3v3-0111/chup.mjs
// Máy chủ giả qua page.route (vào thi → phòng chờ); phòng đấu = phong-3v3.ts chạy LÕI THẬT trong Node, nối bằng page.routeWebSocket.
// Ảnh: A sanh · B tran · C vao-thay · D het-van (huy hiệu) · goi-y-dau (gợi ý lần đầu) · E so-do-san (SVG từ đúng số liệu lõi). JPG ≤ 150 KB + kiem.json.
// Tên đều GIẢ; ảnh trận không có số báo danh.
import { chromium } from 'playwright'
import { build } from 'esbuild'
import { mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../..')
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
const trinh = await chromium.launch({ executablePath: exe })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const tam = mkdtempSync(join(tmpdir(), 'dau-ion-3v3-'))
await build({ entryPoints: [resolve(DAY, 'phong-3v3.ts')], bundle: true, format: 'esm', platform: 'node', outfile: resolve(tam, 'phong-3v3.mjs'), logLevel: 'warning' })
const L = await import(pathToFileURL(resolve(tam, 'phong-3v3.mjs')).href)
const { preview } = await import('vite')
const sv = await preview({ root: GOC, configFile: false, logLevel: 'error', preview: { port: 0, host: '127.0.0.1' }, build: { outDir: 'dist' } })
const goc = sv.resolvedUrls.local[0].replace(/\/$/, '')

async function chup(p, tep, clip) {
  for (const q of [78, 68, 58, 48, 40, 32]) {
    await p.screenshot({ path: tep, type: 'jpeg', quality: q, ...(clip ? { clip } : {}) })
    if (statSync(tep).size <= 150_000) break
  }
  return Math.round(statSync(tep).size / 1024)
}
const KIEM = () => {
  const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden' }
  const nho = [...document.querySelectorAll('.dn-the button, .dn-man button, .dn-the input')].filter(hien).filter((e) => { const r = (e.type === 'checkbox' ? e.closest('label') : e).getBoundingClientRect(); return r.height < 44 || (e.type !== 'checkbox' && r.width < 44) })
  const man = document.querySelector('.dn-man'), cv = document.querySelector('.dn-khung canvas')
  const sbd = /12121/.test(document.body.innerText)
  return { tran: document.scrollingElement.scrollWidth > innerWidth + 1, nho: nho.map((e) => `«${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}»`), sbdHien: sbd,
    san: cv ? { w: Math.round(cv.getBoundingClientRect().width), h: Math.round(cv.getBoundingClientRect().height), phuManNgang: +(cv.getBoundingClientRect().width / innerWidth).toFixed(2), phuManDoc: +(cv.getBoundingClientRect().height / innerHeight).toFixed(2), doc: man?.dataset.doc } : null }
}

/** Một trang đã vào phòng chờ của ca 123456 (máy chủ giả) + phòng đấu 3 đấu 3 mẫu. */
async function moTrang(k, phong) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', colorScheme: k.nen === 'toi' ? 'dark' : 'light', serviceWorkers: 'block' })
  await ctx.addInitScript((daXem) => { try { if (!localStorage.getItem('ddh.dauIon')) localStorage.setItem('ddh.dauIon', JSON.stringify({ nt: 3, an: false, vao: false, daXemGoiY: daXem })) } catch { /* bỏ qua */ } }, !k.goiY)
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  await ctx.route((u) => !u.href.startsWith(goc), async (r) => {
    const u = new URL(r.request().url())
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors })
    const tra = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(o) })
    let b = {}; try { b = r.request().postDataJSON() ?? {} } catch { /* GET */ }
    if (b.action === 'tenTheoSbd') return tra({ ok: true, sbd: '12121', hoTen: 'Nguyễn Khánh Ngọc', lop: '12A1', tenCa: 'Kiểm tra 15 phút · Ester' })
    if (u.pathname.endsWith('/vao-thi') || b.action === 'vaoThi') return tra({ ok: true, cach: 'cho', lop: '12A1', thoiGianPhut: 15, congBo: 'khong', tenCa: 'Kiểm tra 15 phút · Ester', veDau: 've-mau' })
    if (u.pathname.endsWith('/phong-cho') || b.action === 'trangThaiPhongCho') return tra({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'cho' })
    if (/\.(woff2?|png|svg|jpg)$/.test(u.pathname)) return r.abort()
    return tra({ ok: true })
  })
  const p = await ctx.newPage()
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  await p.routeWebSocket(/\/dau-ion\//, (ws) => {
    const may = phong.noi((d) => ws.send(typeof d === 'string' ? d : Buffer.from(d)))
    ws.onMessage((m) => may.nhan(typeof m === 'string' ? m : new Uint8Array(m)))
    ws.onClose(() => may.dong())
  })
  await p.goto(`${goc}/t/123456`)
  await p.getByLabel('Số báo danh').fill('12121')
  await p.getByLabel('Số báo danh').press('Enter')
  await p.waitForSelector('text=Nguyễn Khánh Ngọc', { timeout: 20000 })
  await p.locator('button', { hasText: /Đúng|Bắt đầu|Vào/ }).last().click()
  await p.waitForSelector('.pc-room .dn-the', { timeout: 30000 })
  await p.evaluate(() => document.fonts.ready)
  return { ctx, p, loi }
}

const KHO = [
  { ten: '390', w: 390, h: 844, dt: true, nen: 'sang', canh: ['sanh', 'tran', 'vao-thay', 'het-van'] },
  { ten: '390', w: 390, h: 844, dt: true, nen: 'toi', canh: ['sanh'] },
  { ten: '844', w: 844, h: 390, dt: true, nen: 'sang', goiY: true, canh: ['sanh', 'goi-y-dau', 'tran', 'vao-thay', 'het-van'] },
  { ten: '844', w: 844, h: 390, dt: true, nen: 'toi', canh: ['tran'] },
  { ten: '932', w: 932, h: 430, dt: true, nen: 'sang', canh: ['tran'] },
  { ten: '1440', w: 1440, h: 900, dt: false, nen: 'sang', canh: ['sanh', 'tran', 'het-van'] },
]
const bang = [], loiTrang = []
for (const k of KHO) {
  const phong = new L.Phong3v3(3)
  const { ctx, p, loi } = await moTrang(k, phong)
  const ghi = async (canh, clip) => { const tep = resolve(DAY, `${canh}-${k.ten}-${k.nen}.jpg`); bang.push({ anh: tep.slice(GOC.length + 1), kb: await chup(p, tep, clip), ...(await p.evaluate(KIEM)) }) }
  if (k.canh.includes('sanh')) {
    // Thẻ game: cuộn cho đầu thẻ sát mép trên (không lộ đầu trang có số báo danh).
    await p.evaluate(() => { const e = document.querySelector('.dn-the'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) })
    await cho(500)
    await ghi('sanh')
  }
  if (k.canh.length > 1 || !k.canh.includes('sanh')) {
    await p.getByRole('button', { name: 'Đấu', exact: true }).click()
    await p.waitForSelector('.dn-man canvas', { timeout: 15000 })
    if (k.canh.includes('goi-y-dau')) { await cho(1100); await ghi('goi-y-dau'); await cho(2600) } else await cho(1800)
    if (k.canh.includes('tran')) { await cho(700); await ghi('tran') }
    if (k.canh.includes('vao-thay')) { phong.thay(); await cho(380); await ghi('vao-thay') }
    if (k.canh.includes('het-van')) { if (!k.canh.includes('vao-thay')) { phong.thay(); await cho(400) } await cho(600); phong.ket(); await cho(1300); await ghi('het-van') }
  }
  loiTrang.push(...loi.map((x) => `${k.ten}-${k.nen}: ${x}`))
  phong.dung(); await ctx.close()
}

// ── E: SƠ ĐỒ SÂN (SVG từ đúng toạ độ lõi; đường bắn kiểm bằng thayNhau của lõi) ──
{
  const { VAT_CAN, BE_PHE, CHO_XT, CHO_KH, SAN_W, SAN_H, R, thayNhau, dungVatCan } = L
  const XANH = '#00a5bd', DO = '#e5266d', XAM = '#5a587d', CHU = '#1b1938', NEN = '#f6f6fc'
  // Mọi chỗ đường bắn đi vào một vật che (✕ ở từng vật) — kiểm từng vật riêng, cùng ngưỡng với lõi (bán kính đạn − 2).
  const trong = (v, x, y) => v.k === 'tron' ? Math.hypot(x - v.x, y - v.y) < v.r + 3 : Math.hypot(x - Math.max(v.x, Math.min(x, v.x + v.w)), y - Math.max(v.y, Math.min(y, v.y + v.h))) < 3
  const chan = (a, b) => { const kq = [], da = new Set(), n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4); for (let i = 1; i < n; i++) { const x = a[0] + ((b[0] - a[0]) * i) / n, y = a[1] + ((b[1] - a[1]) * i) / n; VAT_CAN.forEach((v, k) => { if (!da.has(k) && trong(v, x, y)) { da.add(k); kq.push([x, y]) } }) } return kq }
  const duong = [
    { a: [840, 260], b: BE_PHE[0][1], ten: 'từ giữa sân bắn thẳng vào bệ giữa' },
    { a: [330, 330], b: [600, 220], ten: 'em → bạn nấp sau bình cầu' },
    { a: [700, 120], b: BE_PHE[0][0], ten: 'cánh trên → bệ cánh trên' },
  ].map((d) => ({ ...d, thay: thayNhau(d.a[0], d.a[1], d.b[0], d.b[1]), cham: chan(d.a, d.b) }))
  if (duong.some((d) => d.thay !== !d.cham.length)) throw new Error('sơ đồ: ✕ không khớp thayNhau của lõi')
  const moDuong = { a: [330, 330], b: [820, 330], ten: 'em → đối thủ XA nhưng lộ: tự ngắm + bắn' }
  const luc = (cx, cy, r) => Array.from({ length: 6 }, (_, k) => `${(cx + r * Math.cos((k * Math.PI) / 3)).toFixed(1)},${(cy + r * Math.sin((k * Math.PI) / 3)).toFixed(1)}`).join(' ')
  const vat = VAT_CAN.map((v) => v.k === 'tron'
    ? `<circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="#fff" stroke="${XAM}" stroke-width="3"/><circle cx="${v.x}" cy="${v.y}" r="${v.r - 6}" fill="${v.ve === 'binh-cau' ? '#00b37a' : v.mau === 4 ? '#f4b400' : '#a66df0'}" opacity=".45"/>`
    : `<rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" rx="8" fill="#fff" stroke="${v.phe === undefined ? XAM : v.phe ? DO : XANH}" stroke-width="3"/>${v.ve === 'gia-ong' ? [0, 1, 2, 3, 4].map((i) => `<circle cx="${v.x + v.w / 2}" cy="${v.y + 14 + i * 23}" r="6" fill="${v.phe ? DO : XANH}"/>`).join('') : `<rect x="${v.x + 7}" y="${v.y + 14}" width="${v.w - 14}" height="${v.h - 20}" rx="5" fill="#ff8a3d" opacity=".5"/>`}`).join('')
  const be = [0, 1].map((p) => BE_PHE[p].map(([x, y], i) => `<polygon points="${luc(x, y, 26)}" fill="${p ? DO : XANH}" fill-opacity=".18" stroke="${p ? DO : XANH}" stroke-width="2.5" stroke-dasharray="6 5"/><text x="${x}" y="${y + 5}" class="nho" text-anchor="middle" fill="${p ? DO : XANH}">${i === 1 ? 'Bệ giữa' : 'Bệ cánh'}</text>`).join('')).join('')
  const xt = CHO_XT.map(([x, y]) => `<polygon points="${luc(x, y, 15)}" fill="#fff" stroke="#f4b400" stroke-width="4"/><circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#f4b400" stroke-width="3"/>`).join('')
  const kh = CHO_KH.map(([x, y]) => `<path d="M${x} ${y - 15}q12 2 13 7q-1 15-13 22q-12-7-13-22q1-5 13-7z" fill="#7d6cf2" stroke="#4b3fb5" stroke-width="2"/>`).join('')
  const veDuong = (d, mau, dash) => `<line x1="${d.a[0]}" y1="${d.a[1]}" x2="${d.b[0]}" y2="${d.b[1]}" stroke="${mau}" stroke-width="3" stroke-dasharray="${dash}" stroke-linecap="round"/>` + (d.cham ?? []).map(([x, y]) => `<g transform="translate(${x},${y})"><circle r="10" fill="#fff" stroke="${DO}" stroke-width="3"/><path d="M-4.5-4.5L4.5 4.5M4.5-4.5L-4.5 4.5" stroke="${DO}" stroke-width="3" stroke-linecap="round"/></g>`).join('')
  const nhan = (x, y, s, anchor = 'start', mau = CHU) => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${mau}">${s}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -60 ${SAN_W + 40} ${SAN_H + 130}" width="1200">
  <style>text{font:700 17px 'Be Vietnam Pro',system-ui,sans-serif} .nho{font-size:13px} .to{font-size:20px;font-weight:800}</style>
  <defs><linearGradient id="hai" x1="0" x2="1"><stop offset="0" stop-color="${XANH}" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${DO}" stop-opacity=".16"/></linearGradient></defs>
  <rect x="0" y="0" width="${SAN_W}" height="${SAN_H}" rx="26" fill="${NEN}" stroke="${XAM}" stroke-width="3"/>
  <rect x="0" y="0" width="${SAN_W}" height="${SAN_H}" rx="26" fill="url(#hai)"/>
  <line x1="${SAN_W / 2}" y1="0" x2="${SAN_W / 2}" y2="${SAN_H}" stroke="${XAM}" stroke-width="2" stroke-dasharray="10 10" opacity=".5"/>
  ${be}${vat}${xt}${kh}
  ${duong.map((d) => veDuong(d, d.thay ? '#00b37a' : DO, '9 7')).join('')}
  ${veDuong({ ...moDuong, cham: [] }, '#00b37a', '2 0')}
  <circle cx="330" cy="330" r="${R}" fill="${XANH}" stroke="#fff" stroke-width="4"/><text x="330" y="336" text-anchor="middle" class="nho" fill="${CHU}">Em</text>
  <circle cx="600" cy="220" r="${R}" fill="${DO}" opacity=".85"/><circle cx="820" cy="330" r="${R}" fill="${DO}"/>
  ${nhan(10, -32, 'CĂN CỨ PHE BAZƠ (OH⁻) — trái', 'start', XANH)}${nhan(SAN_W - 10, -32, 'CĂN CỨ PHE AXIT (H⁺) — phải', 'end', DO)}
  ${nhan(SAN_W / 2, -32, 'Sân 1040 × 520 · đối xứng gương hai trục', 'middle')}
  ${nhan(166, 196, 'Tường chắn căn cứ', 'start')}${nhan(166, 216, '(che bệ giữa)', 'start', XAM)}
  ${nhan(520, 200, 'Bình cầu', 'middle')}
  ${nhan(548, 128, 'Bình nón', 'start')}${nhan(300, 66, 'Cốc', 'middle')}${nhan(740, 66, 'Cốc', 'middle')}
  ${nhan(400, 222, 'Bình nón nhỏ', 'middle')}${nhan(668, 238, 'bắn thẳng vào bệ giữa: 4 lớp chặn', 'start', DO)}
  ${nhan(520, 22, 'Xúc tác (tranh chấp)', 'middle', '#b07800')}${nhan(520, 508, 'Xúc tác (tranh chấp)', 'middle', '#b07800')}
  ${nhan(200, 300, 'Khiên', 'middle', '#4b3fb5')}${nhan(840, 300, 'Khiên', 'middle', '#4b3fb5')}
  ${nhan(110, 160, 'cánh trên → bệ cánh: chặn ở cốc', 'start', DO)}${nhan(130, 44, 'Hành lang cánh trên →', 'start', XAM)}${nhan(130, 496, 'Hành lang cánh dưới →', 'start', XAM)}${nhan(232, 292, 'Ngõ giữa →', 'start', XAM)}
  ${nhan(624, 214, 'nấp: KHÔNG bị bắn', 'start', DO)}${nhan(830, 372, 'lộ: bị ngắm dù xa', 'start', '#00875a')}
  <g transform="translate(0,${SAN_H + 30})">
    <line x1="0" y1="-6" x2="40" y2="-6" stroke="${DO}" stroke-width="3" stroke-dasharray="9 7"/>${nhan(48, 0, 'đường bắn BỊ CHẶN (✕ = chỗ vật che)')}
    <line x1="430" y1="-6" x2="470" y2="-6" stroke="#00b37a" stroke-width="3"/>${nhan(478, 0, 'đường bắn THÔNG (tự ngắm xa, cả sân)')}
  </g>${nhan(SAN_W, SAN_H + 56, 'Toạ độ & số đo ở DAC-TA.md mục 3 · ✕ kiểm bằng đúng hàm thayNhau của lõi', 'end', XAM)}</svg>`
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#fff;display:grid;place-items:center;min-height:100vh}h1{font:800 24px 'Be Vietnam Pro',system-ui,sans-serif;color:${CHU};margin:18px 0 0}</style><div><h1>Sơ đồ sân «Đấu Nguyên Tử» 3 đấu 3 (bản vẽ 01/11)</h1>${svg}</div>`
  const p = await trinh.newPage({ viewport: { width: 1240, height: 760 } })
  await p.setContent(html)
  const tep = resolve(DAY, 'so-do-san.jpg')
  bang.push({ anh: tep.slice(GOC.length + 1), kb: await chup(p, tep), duongBan: duong.map((d) => `${d.ten}: ${d.thay ? 'THÔNG' : 'CHẶN'}`) })
  await p.close()
}
writeFileSync(resolve(DAY, 'kiem.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang, anh: bang }, null, 1))
console.log(JSON.stringify({ loiTrang, anh: bang.map((b) => `${b.anh.split('/').pop()} ${b.kb}KB tran=${b.tran} nho=${b.nho?.length} sbd=${b.sbdHien} san=${JSON.stringify(b.san)}`) }, null, 1))
await new Promise((r) => sv.httpServer.close(r))
await trinh.close()
process.exit(0)
