#!/usr/bin/env node
// CHỤP BẢN VẼ BÚT VIẾT BẢNG (10/11) bằng Chromium THẬT (/opt/pw-browsers/chromium) trên TỜ CHIẾU THẬT (dựng từ src/lib/html-may-chieu.ts).
//   node scripts/but-bang-1011/chup.mjs [thư mục ra = docs/ban-ve-but-1011]
// Nét trong ảnh KHÔNG vẽ tay: phát lại dữ liệu điểm (200 Hz, có lực giả lập — scripts/but-bang-1011/chu-tay-mau.mjs) qua API `__mcBut.nhap`.
// Ảnh: 1 tờ 1920 có chữ + công thức + vòng benzen trên bảng đen · 2 cận cảnh ×3 · 3 nét cũ / nét mới cùng một dữ liệu · 4 thanh bút · 5 cùng dữ liệu ở 1280.
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { taoNgauNhien, vietDong, vongBenzen, camBut, thanhNet } from './chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const LA_CHINH = import.meta.url === pathToFileURL(process.argv[1]).href
const RA = resolve((LA_CHINH && process.argv[2]) || join(GOC, 'docs/ban-ve-but-1011'))
const TAM = mkdtempSync(join(tmpdir(), 'but-bang-'))

/** Tờ chiếu thật: hai đợt (một em một câu). `gocMa` = thư mục chứa src/ (mặc định repo này; đo so bản cũ thì trỏ sang bản giải nén của origin/main). */
export async function taoTo(gocMa = GOC, ten = 'to') {
  const vao = join(TAM, ten + '-vao.ts')
  writeFileSync(vao, `import { taoHtmlMayChieu } from ${JSON.stringify(join(gocMa, 'src/lib/html-may-chieu.ts'))}
const cau = (id, text, luaChon) => ({ phan: 'I', id, maDe: '', chuyenDe: 'Axit cacboxylic', dang: 'Tính theo phương trình', sao: 2, mucDo: '', text, luaChon, dapAn: 'B', chot: 'Axit + bazơ → muối + nước.', lyDo: [{ khoa: 'B', ly: 'n = 0,1 mol.' }], buoc: ['Viết phương trình.', 'Tính số mol.'] })
const o = (sbd, hoTen, c, soCau) => ({ sbd, hoTen, qid: 'DE-I-' + sbd, soCau, sao: 2, cau: c, bacUoc: 2, lop: '12A1', lanLenBang: 3 })
export const html = taoHtmlMayChieu([
  o('A01', 'Nguyễn Minh Anh', cau('DE-I-1', 'Cho 6,0 gam axit axetic (CH₃COOH) tác dụng vừa đủ với dung dịch NaOH 1M. Thể tích dung dịch NaOH đã dùng là bao nhiêu? Biết phản ứng xảy ra hoàn toàn, muối thu được là natri axetat.', ['50 ml', '100 ml', '150 ml', '200 ml']), 12),
  o('B02', 'Trần Gia Bảo', cau('DE-I-2', 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', ['NaCl', 'NaOH', 'HCl', 'NaHCO₃']), 13),
] as never, { tenBuoi: 'Buổi chữa 10/11' } as never)
`)
  const ra = join(TAM, ten + '.mjs')
  await build({ entryPoints: [vao], bundle: true, platform: 'node', format: 'esm', outfile: ra, logLevel: 'warning', nodePaths: [join(GOC, 'node_modules')], loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl', '.woff2': 'dataurl', '.woff': 'dataurl' } })
  const tep = join(TAM, ten + '.html')
  writeFileSync(tep, (await import(pathToFileURL(ra).href)).html)
  return tep
}

const TRANG = 'rgb(244,239,228)', VANG = 'rgb(255,210,122)', NGOC = 'rgb(110,231,183)', HONG = 'rgb(253,164,175)', MUC = 'rgb(36,86,201)'
/** Bài viết mẫu ở khổ 1920 × 1080: bảng đen (cột phải) + hai nét mực xanh trên giấy đề. Trả về mảng nét vectơ. */
export function baiMau() {
  const rnd = taoNgauNhien(1011), net = []
  const them = (ds, mau, co = 2.3) => ds.forEach((m) => net.push(thanhNet(m, 1920, 1080, { mau, co, id: 'm' + net.length })))
  them(vietDong('Giải:', 1312, 168, 44, { rnd }), VANG)
  them(vietDong('CH_3COOH + NaOH', 1312, 262, 42, { rnd }), TRANG)
  them(vietDong('> CH_3COONa + H_2O', 1338, 352, 42, { rnd }), TRANG)
  them(vietDong('n = 0,1 mol', 1312, 458, 42, { rnd }), NGOC)
  them([camBut([[1306, 522], [1420, 526], [1560, 521]], { rnd, vMax: 900 })], NGOC)
  const v = vongBenzen(1402, 690, 74, { rnd })
  them(v.net, TRANG)
  them(vietDong('OH', v.noi[0], v.noi[1] - 34, 42, { rnd }), HONG)
  them(vietDong('+ NaOH >', 1602, 668, 40, { rnd }), TRANG)
  them(vietDong('C_6H_5ONa + H_2O', 1312, 836, 42, { rnd }), TRANG, 3.4)
  // mực xanh trên giấy đề: khoanh đáp án B, gạch chân «6,0 gam»
  const khoanh = []
  for (let k = 0; k <= 13; k++) { const g = -2.3 + k * 0.52; khoanh.push([455 + 132 * Math.cos(g) + (rnd() - 0.5) * 5, 440 + 44 * Math.sin(g) + (rnd() - 0.5) * 4]) }
  them([camBut(khoanh, { rnd, vMax: 900 })], MUC, 3.4)
  them([camBut([[146, 172], [250, 175], [362, 171]], { rnd, vMax: 900 })], MUC, 3.4)
  return net
}

async function chup(t, ten, tuy = {}) {
  let q = 88, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, ...tuy }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(RA, ten), buf)
  console.log(`${ten}: ${Math.round(buf.length / 1024)} KB (q${q + 6})`)
}

if (LA_CHINH) {
  mkdirSync(RA, { recursive: true })
  const tep = await taoTo()
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
  const loi = []
  const mo = async (w, h, dsf) => {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion: 'reduce', locale: 'vi-VN' })
    const t = await ctx.newPage()
    t.on('pageerror', (e) => loi.push(e.message))
    await t.goto(pathToFileURL(tep).href)
    await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
    await t.evaluate(() => document.fonts.ready)
    await t.keyboard.press('l'); await t.waitForTimeout(2600)
    await t.keyboard.press('b'); await t.waitForTimeout(250)
    return t
  }
  const bai = baiMau()

  // 1 + 5 · tờ thật 1920, rồi CÙNG dữ liệu sau khi đổi cỡ cửa sổ xuống 1280 (vẽ lại từ vectơ)
  let t = await mo(1920, 1080, 1)
  console.log('nhập', await t.evaluate((net) => window.__mcBut.nhap({ v: 1, net }), bai), 'nét ·', bai.reduce((s, n) => s + n.diem.length, 0), 'điểm')
  await t.mouse.move(1700, 960)
  await chup(t, '1-bang-den-1920.jpg')
  await t.setViewportSize({ width: 1280, height: 720 }); await t.waitForTimeout(500)
  await chup(t, '5-doi-co-cua-so-1280.jpg')
  await t.context().close()

  // 2 · cận cảnh ×3
  t = await mo(1920, 1080, 3)
  await t.evaluate((net) => window.__mcBut.nhap({ v: 1, net }), bai)
  await t.mouse.move(1700, 1000)
  await chup(t, '2-can-canh-cong-thuc.jpg', { clip: { x: 1296, y: 236, width: 300, height: 170 } })
  await chup(t, '2b-can-canh-vong-benzen.jpg', { clip: { x: 1300, y: 590, width: 300, height: 190 } })

  // 3 · nét cũ / nét mới từ CÙNG mẫu bút. Nét cũ = đúng mã cũ: mỗi pointermove (60 lần / giây, không lấy mẫu gộp) một đoạn lineTo, rộng u × 0,35, màu đỏ.
  const rnd = taoNgauNhien(77)
  const mauSS = [...vietDong('CH_3COOH', 1330, 250, 46, { rnd }), ...vongBenzen(1760, 300, 62, { rnd }).net]
  const xuong = (ds, dy) => ds.map((m) => m.map(([x, y, a, tm]) => [x, y + dy, a, tm]))
  await t.evaluate(({ cu, moi }) => {
    window.__mcBut.nhap({ v: 1, net: moi })
    const c = document.createElement('canvas'), dpr = devicePixelRatio
    c.width = innerWidth * dpr; c.height = innerHeight * dpr
    c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:29;pointer-events:none'
    document.body.appendChild(c)
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const u = Math.min(innerWidth, innerHeight * 16 / 9) / 100
    for (const m of cu) {
      // sự kiện không gộp: một mẫu mỗi khung hình (16,7 ms), toạ độ chuột nguyên px
      const sk = []; let moc = -1e9
      for (const d of m) if (d[3] - moc >= 16.6) { sk.push([Math.round(d[0]), Math.round(d[1])]); moc = d[3] }
      for (let i = 1; i < sk.length; i++) { g.strokeStyle = 'rgb(229,72,77)'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = u * 0.35; g.beginPath(); g.moveTo(sk[i - 1][0], sk[i - 1][1]); g.lineTo(sk[i][0], sk[i][1]); g.stroke() }
    }
    const nhan = (chu, y) => { const e = document.createElement('div'); e.textContent = chu; e.style.cssText = 'position:fixed;left:1318px;top:' + y + 'px;z-index:40;color:var(--mc-bang-phu);font:600 15px var(--mc-sans)'; document.body.appendChild(e) }
    nhan('NÉT CŨ · mỗi pointermove một đoạn thẳng, rộng cố định', 196)
    nhan('NÉT MỚI · 200 Hz + lọc 1€ + lực bút + thon đầu, tô đa giác', 426)
  }, { cu: mauSS, moi: xuong(mauSS, 230).map((m, i) => thanhNet(m, 1920, 1080, { id: 's' + i })) })
  await chup(t, '3-net-cu-net-moi.jpg', { clip: { x: 1300, y: 186, width: 560, height: 440 } })
  await chup(t, '3b-net-cu-phong-to.jpg', { clip: { x: 1320, y: 226, width: 150, height: 110 } })
  await chup(t, '3c-net-moi-phong-to.jpg', { clip: { x: 1320, y: 456, width: 150, height: 110 } })
  await t.context().close()

  // 4 · thanh bút (×2): đang cầm phấn trắng nét vừa · đang tẩy
  t = await mo(1920, 1080, 2)
  await t.evaluate((net) => window.__mcBut.nhap({ v: 1, net }), bai.slice(0, 12))
  const o = await t.evaluate(() => { const r = document.querySelector('.mc-but-cu').getBoundingClientRect(); return { x: Math.floor(r.left) - 24, y: Math.floor(r.top) - 12, width: Math.ceil(r.width) + 48, height: Math.ceil(r.height) + 30 } })
  await t.mouse.move(1500, 600)
  await chup(t, '4-thanh-but.jpg', { clip: o })
  await t.keyboard.press('e'); await t.waitForTimeout(200)
  await chup(t, '4b-thanh-but-dang-tay.jpg', { clip: o })
  await trinh.close()
  if (loi.length) { console.error('LỖI TRANG:', loi); process.exit(1) }
}
