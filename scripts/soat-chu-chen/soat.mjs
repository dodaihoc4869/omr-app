#!/usr/bin/env node
// BỘ SOÁT CHỮ CHÈN (thầy 26/10 tối: «Chữ vẫn bị chèn … check lại toàn bộ giao diện»). Chạy MỌI cảnh của scripts/chup-v2 (đọc thẳng danh sách DS và
// khối thao tác trong chup.mjs — không chép, nên cảnh mới ở chup.mjs tự vào bộ soát) + các cảnh chỉ có ở trang.tsx (CANH_THEM dưới đây), ở 8 khổ × sáng/tối.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node scripts/soat-chu-chen/soat.mjs <dist> <thư mục ra> [--chon tiền-tố,…] [--kho 390x700,…] [--nen light,dark] [--song-song 4] [--anh-moi 1]
// Ra: <thư mục ra>/ket-qua.json (mọi lỗi từng lượt) + <thư mục ra>/anh/*.jpg (ảnh khoanh vùng, ≤ 150 KB, một ảnh / (cảnh, loại lỗi)).
// Báo cáo: node scripts/soat-chu-chen/bao-cao.mjs <thư mục ra> docs/soat-chu-chen-2610.md docs/anh-soat-2610
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { cuon, kiemChe, kiemTrang, ve, xoaVe } from './kiem-trang.mjs'

const thamSo = process.argv.slice(2)
const lay = (ten, mac) => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : mac }
const [DIST_ARG, RA_ARG] = thamSo.filter((x, i) => !x.startsWith('--') && !thamSo[i - 1]?.startsWith('--'))
const DIST = resolve(DIST_ARG ?? 'dist-soat')
const RA = resolve(RA_ARG ?? 'soat-ra')
const CHON = (lay('--chon', '') ?? '').split(',').filter(Boolean)
const KHO = (lay('--kho', '390x700,360x640,412x780,390x844,844x390,740x360,1024x768,1440x900')).split(',').map((k) => k.split('x').map(Number))
const NEN = lay('--nen', 'light,dark').split(',')
const SONG = Number(lay('--song-song', '4'))
const ANH_MOI = Number(lay('--anh-moi', '1')) // số ảnh tối đa mỗi (cảnh, loại)
mkdirSync(join(RA, 'anh'), { recursive: true })

// ── danh sách cảnh: DS của chup.mjs (đoạn từ `const DS_HS12` tới `const loiTrang = []`) + khối thao tác (thân `try` trong vòng chụp)
const GOC = resolve(import.meta.dirname, '../..')
const nguon = readFileSync(join(GOC, 'scripts/chup-v2/chup.mjs'), 'utf8')
const iDs = nguon.indexOf('const DS_HS12'), iHetDs = nguon.indexOf('const loiTrang = []')
const iTry = nguon.indexOf("  try {\n    if (viec?.startsWith('nut:'))"), iCatch = nguon.indexOf('\n  } catch (e) {', iTry)
if (iDs < 0 || iHetDs < 0 || iTry < 0 || iCatch < 0) throw Error('chup.mjs đổi cấu trúc — sửa mốc cắt trong soat.mjs')
const DS = new Function(nguon.slice(iDs, iHetDs) + '\nreturn DS')()
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const thaoTac = new AsyncFunction('t', 'viec', 'ten', 'loiTrang', 'tran', 'tuongPhanThap', nguon.slice(iTry + '  try {'.length, iCatch))

// cảnh chỉ có ở trang.tsx (không nằm trong DS) + cảnh SOÁT 26/10 — [tên, ?man=, chờ chữ, thao tác]
const CANH_THEM = [
  ['hs-mot-thuong', 'hs-mot', /Chào Minh Anh/],
  ['hs-mot-ca-mo', 'hs-mot&tt=ca', /Chào Minh Anh/],
  ['hs-mot-du-da-diem-danh', 'hs-mot&tt=du&dd=xong', /Chào Minh Anh/],
  ['hs-mot-khong-buoi', 'hs-mot&dd=khong', /Chào Minh Anh/],
  ['hs-menu-thu-gon', 'hs-menu', /Chào Minh Anh/],
  ['hs-menu-mo', 'hs-menu', /Chào Minh Anh/, 'nut:Mở menu'],
  ['hs-menu-ca-mo', 'hs-menu&ca=1', /Chào Minh Anh/],
  ['hs-dang-nhap', 'hs-dang-nhap', /Đăng nhập/],
  ...['btvn', 'lich-su', 'gia-dinh', 'vao-thi', 'cau-da-lam', 'ca', 'khac-phuc', 'ai'].map((tam) => [`hs-tam-${tam}`, `hs-sheet&tam=${tam}`, /Chào Minh Anh/]),
  ['ph-vao', 'ph-vao', /Số báo danh của con/],
  ['ph-mot-trang-vo-that', 'ph&mot=1&bl=1', /Hôm nay của con/, 'mtp:'],
  // ═══ SOÁT 26/10 (khối cùng tên ở trang.tsx): các màn thầy chụp ảnh điện thoại
  ['soat-kiem-tra-on-tap', 'soat-ktcn', /Kiểm tra ôn tập/],
  ['soat-kiem-tra-on-tap-lam-chang', 'soat-ktcn', /Kiểm tra ôn tập/, 'nut:Làm tiếp chặng 2'],
  ['soat-kiem-tra-on-tap-ket-qua', 'soat-ktcn&kt=ket', /Kiểm tra ôn tập/],
  ['soat-ca-kiem-tra-khong-ca-mo', 'gv-lich-su-ca&soat=khong-ca', /Ca kiểm tra/],
  ['soat-hom-nay-thay-khong-ca-mo', 'gv-hom-nay&nh=1&soat=khong-ca', /Hôm nay của thầy/, 'mg:cho'],
  ['soat-ph-mot-trang-dai', 'ph&mot=1&bl=1&soat=dai', /Hôm nay của con/, 'mtp:'],
  ['soat-ph-mot-trang-dai-tam-btvn', 'ph&mot=1&bl=1&soat=dai', /Hôm nay của con/, 'mtp:Bài tập về nhà'],
]
// gộp: mỗi (man, thao tác) một cảnh; tên cảnh = tên ảnh đầu tiên bỏ hậu tố khổ/nền
const boKho = (ten) => ten.replace(/-(doc|ngang|may-tinh|dien-thoai|1024|1280|1440|1920|sang|light|dark)(?=-|$)/g, '').replace(/-toi$/, '').replace(/-toi(?=-)/, '')
const CANH = new Map()
for (const [ten, man, , , , , cho, viec] of DS) { const k = `${man}|${viec ?? ''}`; if (!CANH.has(k)) CANH.set(k, { ten: boKho(ten), man, cho, viec }) }
for (const [ten, man, cho, viec] of CANH_THEM) { const k = `${man}|${viec ?? ''}`; if (!CANH.has(k)) CANH.set(k, { ten, man, cho, viec }) }
// cảnh trùng bố cục: ép nút Sáng/Tối trong Cài đặt (đã có sáng + tối máy)
for (const [k, c] of CANH) if (/&giao=/.test(c.man)) CANH.delete(k)
const canh = [...CANH.values()].filter((c) => !CHON.length || CHON.some((p) => c.ten.startsWith(p) || c.man.startsWith(p)))
const viec = canh.flatMap((c) => KHO.flatMap(([w, h]) => NEN.map((nen) => ({ ...c, w, h, nen }))))
console.log(`${canh.length} cảnh × ${KHO.length} khổ × ${NEN.length} nền = ${viec.length} lượt, ${SONG} song song`)

// ── máy phục vụ tĩnh (như chup.mjs)
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = join(GOC, 'public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const ketQua = []
const daAnh = new Map() // `${tên cảnh}|${loại}` → số ảnh
const TEN_LOAI = { a: 'cắt chữ', 'a…': 'ba chấm cố ý', b: 'tràn khung', c: 'chồng nhau', d: 'nổi/ghim che', e: 'chạm lòng vòng', f: 'dòng mở bằng ·', g: 'vỡ từng dòng', h: 'tràn ngang', j: 'ô rơi hàng' }
const CO_ANH = ['a', 'd', 'c', 'e', 'g', 'b', 'h', 'f', 'j']
const ten = (v) => `${v.ten}__${v.w}x${v.h}${v.nen === 'dark' ? '-toi' : ''}`
async function chupKhoanh(t, v, loai, loi) {
  const khoa = `${v.ten}|${loai}`
  if ((daAnh.get(khoa) ?? 0) >= ANH_MOI) return null
  daAnh.set(khoa, (daAnh.get(khoa) ?? 0) + 1)
  const cap = loi.filter((l) => l.loai === loai).slice(0, 12).map((l) => [l.id, l.id2])
  await t.evaluate(ve, { cap, nhan: `${TEN_LOAI[loai]} · ${v.ten} · ${v.w}×${v.h}${v.nen === 'dark' ? ' tối' : ''}` })
  await t.waitForTimeout(80)
  const tep = `${ten(v)}__${loai === 'a…' ? 'a3' : loai}.jpg`
  for (const q of [70, 55, 42, 32, 24, 16]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 16) { writeFileSync(join(RA, 'anh', tep), buf); break }
  }
  await t.evaluate(xoaVe)
  return tep
}

async function chay(v) {
  const ctx = await trinh.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, colorScheme: v.nen, hasTouch: v.w < 900, isMobile: v.w < 500 })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(8000)
  const loiTrang = [], tran = [], tp = []
  t.on('pageerror', (e) => loiTrang.push(`pageerror ${e.message.slice(0, 160)}`))
  const kq = { canh: v.ten, man: v.man, viec: v.viec ?? '', w: v.w, h: v.h, nen: v.nen, loi: [], anh: [], loiTrang }
  try {
    await t.goto(`${goc}/scripts/chup-v2/trang.html?man=${v.man}`)
    try {
      if (v.man.startsWith('gv-')) await t.getByRole('heading', { name: v.man === 'gv-kho' ? /Kho đề|Ngân hàng câu hỏi/ : v.cho }).first().waitFor({ timeout: 20000 })
      else await t.getByText(v.cho).first().waitFor({ timeout: 20000 })
    } catch { loiTrang.push(`không thấy chữ ${v.cho}`) }
    await thaoTac(t, v.viec, v.ten, loiTrang, tran, tp).catch((e) => loiTrang.push(`thao tác ${v.viec} hỏng — ${String(e).slice(0, 200)}`))
    await t.waitForTimeout(900)
    // trạng thái cảnh: a…j (trừ d), trong khung chính + từng khung con cùng gốc (tờ chiếu)
    const khung = t.frames()
    for (const f of khung) {
      if (f !== t.mainFrame()) {
        const fe = await f.frameElement().catch(() => null)
        if (!fe || !(await fe.isVisible().catch(() => false))) continue
      }
      const r = await f.evaluate(kiemTrang).catch((e) => ({ ra: [], loi: String(e).slice(0, 200) }))
      if (r.loi) loiTrang.push(`soát hỏng: ${r.loi}`)
      for (const l of r.ra) kq.loi.push({ ...l, khung: f === t.mainFrame() ? '' : 'tờ chiếu' })
    }
    const loiChinh = kq.loi.filter((l) => !l.khung)
    for (const loai of CO_ANH.filter((x) => x !== 'd')) if (loiChinh.some((l) => l.loai === loai)) { const a = await chupKhoanh(t, v, loai, loiChinh); if (a) kq.anh.push(a) }
    if (kq.loi.some((l) => l.loai === 'a…')) { const a = await chupKhoanh(t, v, 'a…', loiChinh); if (a) kq.anh.push(a) }
    // (d): cuộn về đầu (thanh trên, cạnh) rồi tới đáy (thanh đáy, nút nổi) — trang không cuộn ⇒ soát một lần mọi phần tử nổi
    const soCuon = await t.evaluate(cuon, 'dau')
    await t.waitForTimeout(250)
    const che = []
    if (!soCuon) che.push(...(await t.evaluate(kiemChe, 'ca')).ra)
    else {
      const d1 = (await t.evaluate(kiemChe, 'dau')).ra
      if (d1.length) { che.push(...d1); const a = await chupKhoanh(t, v, 'd', d1); if (a) kq.anh.push(a) }
      await t.evaluate(cuon, 'cuoi')
      await t.waitForTimeout(400)
      const d2 = (await t.evaluate(kiemChe, 'cuoi')).ra.map((l) => ({ ...l, ghi: `${l.ghi} · cuộn tới đáy` }))
      che.push(...d2)
      if (d2.length) { const a = await chupKhoanh(t, v, 'd', d2); if (a) kq.anh.push(a) }
    }
    if (!soCuon && che.length) { const a = await chupKhoanh(t, v, 'd', che); if (a) kq.anh.push(a) }
    kq.loi.push(...che)
  } catch (e) {
    loiTrang.push(`lượt hỏng — ${String(e).slice(0, 200)}`)
  }
  await ctx.close()
  return kq
}

let xong = 0
const batDau = Date.now()
const hang = [...viec]
await Promise.all(Array.from({ length: SONG }, async () => {
  for (let v = hang.shift(); v; v = hang.shift()) {
    const kq = await chay(v)
    ketQua.push(kq)
    xong++
    if (xong % 25 === 0 || xong === viec.length) {
      writeFileSync(join(RA, 'ket-qua.json'), JSON.stringify(ketQua))
      console.log(`${xong}/${viec.length} · ${Math.round((Date.now() - batDau) / 1000)} giây`)
    }
  }
}))
writeFileSync(join(RA, 'ket-qua.json'), JSON.stringify(ketQua))
await trinh.close()
may.close()
const dem = {}
for (const k of ketQua) for (const l of k.loi) dem[l.loai] = (dem[l.loai] ?? 0) + 1
console.log('Lỗi (chưa gộp):', JSON.stringify(dem))
console.log('Lượt có lỗi trang:', ketQua.filter((k) => k.loiTrang.length).length)
