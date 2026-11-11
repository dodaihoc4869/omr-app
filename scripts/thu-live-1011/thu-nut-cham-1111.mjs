#!/usr/bin/env node
// BỘ THỬ HAI NÚT CHẤM «Đạt» / «Không đạt» TRÊN THANH ĐÁY TỜ CHIẾU (thầy 11/11 tối: «nút đạt và không đạt hiện ở live không đẹp, không khớp với khung, làm lại
// phần hiện đó nhỏ lại tinh tế và đẹp mắt hơn»). Chromium THẬT, tờ chiếu THẬT có cầu nối (?vai=thay&noi=1) + phòng THẬT trong Node (may-chu.mjs), dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-nut-cham-1111.mjs <thư mục tạm> <tiền tố ảnh: truoc | sau> [thư mục ảnh = docs/ban-ve-live-1011]
// Nút thầy THẤY là D / K của thanh đáy (#mc-phim-nhom > [data-k="D"|"K"]); hai nút `.mc-cham` trong `.mc-giai-vung` chỉ còn cho trình đọc màn hình (tờ M3
// giấu vùng đó). Mỗi khổ (1366 × 768, 1920 × 1080) đi ba cảnh: chưa live · đang live · đang live + Bình Phản Ứng giao em (cảnh tổng hợp: tờ có cầu nối; tờ
// Bình Phản Ứng thật không có cầu nối nên không có hai nút này — chấm bằng phím D / K). Đo HỘP BAO THẬT: cùng hàng, vùng chạm ≥ 40 px, viên thấy được nhỏ
// hơn vùng chạm và giữa thanh, D và K LIỀN nhau (khe ≈ 0, không đè), không đè «Thầy chữa» / viên Live / trạng thái / nút «thêm», trọn trong thanh; rê chuột
// lên «Đạt» vẫn trong viên. Ảnh nut-cham-<tiền tố>-<cảnh>-<khổ>.jpg (JPG ≤ 150 KB). Tiền tố «truoc» (mã cũ) chỉ đo, không đòi đạt.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const TIEN_TO = process.argv[3] ?? 'sau'
const ANH = resolve(process.argv[4] ?? join(GOC, 'docs/ban-ve-live-1011'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }
const KHO = [[1366, 768], [1920, 1080]]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** D / K trên thanh + hàng xóm: hộp bao (vùng chạm), hộp padding (viên thấy được), màu ô phím. */
const doDK = (to) => to.locator('#mc-thanh').evaluate((thanh) => {
  const hien = (e) => { if (!e) return false; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0.5 && r.height > 0.5 && s.visibility !== 'hidden' && s.display !== 'none' }
  const hop = (e) => { if (!hien(e)) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 10) / 10) }
  const vien = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e), c = s.backgroundClip === 'padding-box'; return [r.left + (c ? parseFloat(s.borderLeftWidth) : 0), r.top + (c ? parseFloat(s.borderTopWidth) : 0), r.right - (c ? parseFloat(s.borderRightWidth) : 0), r.bottom - (c ? parseFloat(s.borderBottomWidth) : 0)].map((v) => Math.round(v * 10) / 10) }
  const nhom = document.getElementById('mc-phim-nhom'), D = nhom.querySelector(':scope > [data-k="D"]'), K = nhom.querySelector(':scope > [data-k="K"]')
  if (!hien(D) || !hien(K)) return { co: false }
  const R = thanh.getBoundingClientRect(), cs = getComputedStyle(thanh)
  const kieu = (b) => { const s = getComputedStyle(b), k = b.querySelector('kbd'), ks = k ? getComputedStyle(k) : null; return { nen: s.backgroundColor, cat: s.backgroundClip, vien: `${s.borderTopWidth} ${s.borderTopColor}`, chu: `${s.fontSize}/${s.fontWeight} ${s.color}`, phim: ks && ks.display !== 'none' ? `${ks.backgroundColor} / ${ks.color}` : 'ẩn' } }
  return {
    co: true, live: document.body.classList.contains('mc-live'), gon: thanh.getAttribute('data-gon') || '0',
    thanh: [R.left + parseFloat(cs.paddingLeft), R.top, R.right - parseFloat(cs.paddingRight), R.bottom].map((v) => Math.round(v * 10) / 10),
    D: hop(D), K: hop(K), vD: vien(D), vK: vien(K), kD: kieu(D), kK: kieu(K),
    C: hop(nhom.querySelector(':scope > [data-k="C"]')), them: hop(document.getElementById('mc-them')), pha: hop(document.getElementById('mc-pha')),
    lv: [...thanh.querySelectorAll('.mc-lv-cum, .mc-lv-nut')].filter(hien).map(hop),
  }
})
const giao = (a, b) => !!a && !!b && a[0] < b[2] - 0.6 && a[2] > b[0] + 0.6 && a[1] < b[3] - 0.6 && a[3] > b[1] + 0.6
const trong = (a, b) => !!a && !!b && a[0] >= b[0] - 0.6 && a[1] >= b[1] - 0.6 && a[2] <= b[2] + 0.6 && a[3] <= b[3] + 0.6

for (const [W, H] of KHO) {
  for (const canh of ['chua-live', 'dang-live', 'bpu-live']) {
    const may = await moMayChu({ dist: DIST })
    const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, permissions: ['microphone'] })
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const thay = await ctx.newPage()
    thay.on('pageerror', (e) => loiTrang.push(`${W} ${canh}: ${e.message}`))
    const to = thay.frameLocator('iframe')
    const guiTo = (tin) => thay.evaluate((m) => document.querySelector('iframe').contentWindow.postMessage(m, '*'), tin)
    await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
    await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
    await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
    await guiTo({ type: 'ddh-mc-ket-noi', maPhien: 'thu1111' })
    await to.locator('body.mc-noi').waitFor({ timeout: 6000 })
    await ngu(400)
    if (canh !== 'chua-live') {
      await to.locator('.mc-lv-nut').click()
      await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
      await ngu(400)
      await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
      await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
      await thay.mouse.click(Math.round(W * 0.3), Math.round(H * 0.4)); await ngu(500)
    }
    if (canh === 'bpu-live') await guiTo({ nguon: 'bpu-bang', lenh: 'len-bang', em: { sbd: 'S5', ten: 'Trần Minh Anh', goiNgay: true, mau: '', doi: '' } })
    else await to.locator('#mc-len-bang').click()
    await to.locator('#mc-phim-nhom > [data-k="D"]').waitFor({ state: 'visible', timeout: 15000 })
    await ngu(2200)
    const N = `${W}×${H} · ${canh}`
    const d = await doDK(to)
    kiem(`${N}: «Đạt» / «Không đạt» đang hiện trên thanh`, d.co)
    if (d.co) {
      console.log(`  D ${JSON.stringify(d.D)} viên ${JSON.stringify(d.vD)} ${JSON.stringify(d.kD)}`)
      console.log(`  K ${JSON.stringify(d.K)} viên ${JSON.stringify(d.vK)} ${JSON.stringify(d.kK)} · mức gọn ${d.gon}`)
      const caoD = d.D[3] - d.D[1], caoK = d.K[3] - d.K[1], vCao = d.vD[3] - d.vD[1], khe = d.K[0] - d.D[2]
      const giuaThanh = (d.thanh[1] + d.thanh[3]) / 2, giuaVien = (d.vD[1] + d.vD[3]) / 2
      kiem(`${N}: cùng hàng, VÙNG CHẠM mỗi nút ≥ 40 px (${caoD.toFixed(1)} / ${caoK.toFixed(1)})`, Math.abs(d.D[1] - d.K[1]) <= 0.6 && caoD >= 40 && caoK >= 40)
      if (TIEN_TO !== 'truoc') {
        kiem(`${N}: viên thấy được NHỎ hơn vùng chạm (cao ${vCao.toFixed(1)} < ${caoD.toFixed(1)}), giữa thanh (lệch ${Math.abs(giuaVien - giuaThanh).toFixed(1)} px)`, vCao < caoD - 4 && vCao >= 26 && Math.abs(giuaVien - giuaThanh) <= 1.5 && JSON.stringify([d.vD[1], d.vD[3]]) === JSON.stringify([d.vK[1], d.vK[3]]))
        kiem(`${N}: D và K LIỀN một khối (khe ${khe.toFixed(1)} px), không đè nhau`, Math.abs(khe) <= 0.6 && Math.abs(d.vK[0] - d.vD[2]) <= 0.6)
        kiem(`${N}: màu chỉ ở ô phím (D xanh mạ, K vàng; không khối đặc, không đỏ), nền viên cắt ở padding-box`, d.kD.cat === 'padding-box' && d.kK.cat === 'padding-box' && !/rgb\(20, 108, 67\)|rgb\(185, 28, 28\)/.test(d.kD.nen + d.kK.nen) && (d.gon >= '2' || (d.kD.phim.startsWith('rgb(196, 238, 208)') && d.kK.phim.startsWith('rgb(253, 214, 99)'))), `${d.kD.phim} · ${d.kK.phim}`)
      }
      kiem(`${N}: trọn trong thanh, không đè «Thầy chữa», trạng thái, viên Live, nút «thêm»`, trong(d.D, d.thanh) && trong(d.K, d.thanh) && ![d.D, d.K].some((n) => giao(n, d.C) || giao(n, d.them) || giao(n, d.pha) || d.lv.some((l) => giao(n, l))))
    }
    let q = 84, buf
    do { buf = await thay.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
    writeFileSync(join(ANH, `nut-cham-${TIEN_TO}-${canh}-${W}.jpg`), buf)
    console.log(`  ảnh nut-cham-${TIEN_TO}-${canh}-${W}.jpg ${Math.round(buf.length / 1024)} KB`)
    if (W === 1366 && canh === 'dang-live' && d.co) { // rê chuột lên «Đạt»: nền đổi nhưng vẫn trong viên (không tràn ra vùng chạm, không quầng sáng)
      await to.locator('#mc-phim-nhom > [data-k="D"]').hover(); await ngu(250)
      const r = await to.locator('#mc-phim-nhom > [data-k="D"]').evaluate((b) => { const s = getComputedStyle(b); return { nen: s.backgroundColor, cat: s.backgroundClip, bong: s.boxShadow } })
      if (TIEN_TO !== 'truoc') kiem(`${N}: rê chuột lên «Đạt» ⇒ nền ửng xanh mạ, vẫn cắt trong viên, không quầng sáng`, r.cat === 'padding-box' && r.bong === 'none' && r.nen !== d.kD.nen, JSON.stringify(r))
      const R = await to.locator('#mc-thanh').boundingBox()
      writeFileSync(join(ANH, `nut-cham-${TIEN_TO}-re-chuot-dat-${W}.jpg`), await thay.screenshot({ type: 'jpeg', quality: 86, clip: { x: R.x, y: R.y - 6, width: R.width, height: R.height + 12 } }))
    }
    await ctx.close(); await may.dong()
  }
}
kiem('Không lỗi JavaScript trên trang nào', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
const hong = ket.filter((x) => !x.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt`)
await trinh.close()
process.exit(hong.length ? 1 : 0)
