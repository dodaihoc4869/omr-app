#!/usr/bin/env node
// ĐO «PHẦN ĐỀ CỦA HỌC SINH BỊ NHẤP NHÁY» (thầy 11/11 trên bản sống #1618) — Chromium THẬT, phòng THẬT trong Node (may-chu.mjs), dữ liệu giả.
// Ở từng trạng thái, gắn MutationObserver lên VÙNG ĐỀ của máy em và đếm: số lần nút DOM của đề bị THÊM / GỠ (dựng lại), số lần đổi thuộc tính / lớp / style,
// số lần đổi chữ; song song chụp liên tiếp vùng đề và đếm số cặp khung liền nhau KHÁC nhau (đề đứng yên thì phải 0).
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <dist>
//   node scripts/thu-live-1011/do-nhap-nhay-1111.mjs <dist> <tệp số đo .json> [giây mỗi trạng thái = 8]
// Trạng thái: (A) màn câu hỏi, thầy đang live đứng yên · (B) em gửi ⇒ bảng live, đứng yên · (C) thầy viết trên bảng · (D) mở / đóng khay ·
// (E) máy em thứ hai CHƯA gửi bị thầy gọi lên bảng ép vào bảng live (câu Đúng / Sai) · (F) bút thầy tới gần tay nắm.
import { existsSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const SO_DO = resolve(process.argv[3] ?? 'so-do-nhap-nhay.json')
const GIAY = Number(process.argv[4] ?? 8)
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const loiTrang = []
const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
// Câu 1: trắc nghiệm chữ thuần (trùng câu trên tờ chiếu của trang thử); câu 2: Đúng / Sai (tờ chiếu chiếu câu khác ⇒ máy em phải dựng giấy theo cách thường)
const CAU1 = { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] }
const CAU2 = { qid: 'Q9', maDe: 'm', version: '1', group: 'g', phan: 'II', text: 'Thủy phân peptide là một phản ứng hóa học quan trọng để xác định cấu trúc của chúng. Xét quá trình thủy phân pentapeptide có trình tự: Gly-Ala-Val-Gly-Ala.', choices: [], ideas: ['Phản ứng thủy phân peptide chỉ xảy ra bởi xúc tác bởi acid hoặc base.', 'Bản chất của quá trình thủy phân là cắt đứt các liên kết peptide.', 'Pentapeptide trên được tạo nên từ 5 loại α-amino acid khác nhau.', 'Khi thủy phân không hoàn toàn pentapeptide trên, thu được tối đa 2 loại dipeptide trong phân tử có chứa gốc glycine (Gly).'], hinhAnh: [], dang: null, tenDang: 'Peptide', mucDo: 'hieu', sao: 2, kienThuc: [] }

const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
await may.moLuot(CAU1, 'B')
async function trangEm(sbd, w, h, dpr) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: w < 1200 })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
  await t.locator('.bpu-hs').waitFor({ timeout: 20000 })
  return t
}
// NN_EM2=1971x1247@1: khổ máy em thứ hai (em chưa gửi bị ép vào bảng live) · NN_CHI_E=1: chỉ đo các trạng thái E
const [e2w, e2h, e2d] = (process.env.NN_EM2 ?? '1280x800@1').split(/[x@]/).map(Number), CHI_E = !!process.env.NN_CHI_E
const em = await trangEm('S1', 844, 390, 2), em2 = await trangEm('S2', e2w, e2h, e2d || 1)
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(500)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await ngu(2500)

/** Đo MỘT trạng thái trên trang `t`: quan sát `chon` (vùng đề) trong `giay` giây, vừa quan sát vừa chạy `lam` (nếu có) và chụp liên tiếp ô `clip` của vùng đề. */
async function do1(t, chon, giay, lam, catTren = 1) {
  const co = await t.evaluate((chon) => {
    const g = document.querySelector(chon)
    if (!g) return false
    const D = (window.__nn = { them: 0, go: 0, thuocTinh: {}, chu: 0, nut: {}, goc: g, gocThay: 0 })
    const ten = (n) => (n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.split(/\s+/).slice(0, 2).join('.') : ''}` : '#chữ')
    D.mo = new MutationObserver((ds) => {
      for (const m of ds) {
        if (m.type === 'childList') { D.them += m.addedNodes.length; D.go += m.removedNodes.length; for (const n of [...m.addedNodes, ...m.removedNodes]) { const k = ten(n); D.nut[k] = (D.nut[k] ?? 0) + 1 } }
        else if (m.type === 'attributes') { const k = `${ten(m.target)}@${m.attributeName}`; D.thuocTinh[k] = (D.thuocTinh[k] ?? 0) + 1 }
        else D.chu++
      }
    })
    D.mo.observe(g, { subtree: true, childList: true, attributes: true, characterData: true })
    // nút gốc của đề có bị thay cả cụm không (cha của nó gỡ nó ra)
    D.moCha = new MutationObserver((ds) => { for (const m of ds) for (const n of m.removedNodes) if (n === g || (n.contains && n.contains(g))) D.gocThay++ })
    D.moCha.observe(document.body, { subtree: true, childList: true })
    return true
  }, chon)
  if (!co) return { thieu: chon }
  const hop = await t.locator(chon).first().boundingBox()
  const clip = hop ? { x: Math.max(0, hop.x), y: Math.max(0, hop.y), width: Math.max(8, hop.width), height: Math.max(8, hop.height * catTren) } : undefined
  let khac = 0, tong = 0, truoc = null, dung = false
  const chup = (async () => { while (!dung) { const b = await t.screenshot({ type: 'png', clip }).catch(() => null); if (b) { if (truoc && !b.equals(truoc)) khac++; if (truoc) tong++; truoc = b } await ngu(60) } })()
  const viec = lam ? lam() : null
  await ngu(giay * 1000)
  if (viec) await viec
  dung = true; await chup
  const d = await t.evaluate(() => { const D = window.__nn; D.mo.disconnect(); D.moCha.disconnect(); return { themNut: D.them, goNut: D.go, nutBiThay: D.nut, doiThuocTinh: D.thuocTinh, doiChu: D.chu, gocBiGo: D.gocThay, gocConTrongTrang: document.contains(D.goc) } })
  return { ...d, capKhungKhacNhau: khac, capKhungDaSo: tong, giay }
}
const kq = {}
const in1 = (ten) => { const v = kq[ten]; console.log(`${ten.padEnd(52)} thêm/gỡ nút ${v.themNut ?? '-'}/${v.goNut ?? '-'} · gốc bị gỡ ${v.gocBiGo ?? '-'} · đổi thuộc tính ${v.doiThuocTinh ? Object.values(v.doiThuocTinh).reduce((a, b) => a + b, 0) : '-'} · đổi chữ ${v.doiChu ?? '-'} · khung khác ${v.capKhungKhacNhau ?? '-'}/${v.capKhungDaSo ?? '-'}${v.thieu ? ' · THIẾU ' + v.thieu : ''}`) }

// (A) MÀN CÂU HỎI lúc thầy đang live — vùng đề của chặng
// (chỉ khối CHỮ ĐỀ + phương án — hình giám thị của chặng tự cử động theo thiết kế, không tính)
const DE_HOI = '.ht2-lam-de'
if (!CHI_E) {
kq['A · màn câu hỏi, thầy live đứng yên'] = await do1(em, DE_HOI, GIAY); in1('A · màn câu hỏi, thầy live đứng yên')
}
const bang = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
const vietBang = async (giay, y0 = 0.2) => { const het = Date.now() + giay * 1000; let i = 0; while (Date.now() < het - 400) { const y = bang.y + bang.h * (y0 + (i % 8) * 0.06); await thay.mouse.move(bang.x + bang.w * 0.1, y); await thay.mouse.down(); for (let k = 1; k <= 20; k++) { await thay.mouse.move(bang.x + bang.w * (0.1 + 0.6 * k / 20), y + Math.sin(k / 2) * 6); await ngu(10) } await thay.mouse.up(); await ngu(150); i++ } }
if (!CHI_E) {
kq['A2 · màn câu hỏi, thầy đang viết trên bảng'] = await do1(em, DE_HOI, GIAY, () => vietBang(GIAY)); in1('A2 · màn câu hỏi, thầy đang viết trên bảng')

// (B) em gửi ⇒ BẢNG LIVE — ô giấy
await em.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await em.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
await em.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
await em.locator('.lv').waitFor({ timeout: 6000 })
kq['B0 · 3 giây đầu vừa vào bảng live'] = await do1(em, '.lv-giay', 3); in1('B0 · 3 giây đầu vừa vào bảng live')
kq['B · bảng live đứng yên'] = await do1(em, '.lv-giay', GIAY); in1('B · bảng live đứng yên')
// (C) thầy viết trên bảng — chỉ so nửa trên của ô giấy (chữ đề)
kq['C · bảng live, thầy đang viết trên bảng'] = await do1(em, '.lv-giay', GIAY, () => vietBang(GIAY), 0.6); in1('C · bảng live, thầy đang viết trên bảng')
// (D) mở / đóng khay 3 lần
kq['D · mở / đóng khay'] = await do1(em, '.lv-giay', Math.min(GIAY, 6), async () => { for (let i = 0; i < 3; i++) { await em.locator('.lv .lv-nam').tap().catch(() => {}); await ngu(700); await em.touchscreen.tap(200, 120); await ngu(700) } }, 0.6); in1('D · mở / đóng khay')
// (F) bút thầy tới gần tay nắm (mép phải bảng, giữa chiều cao)
kq['F · bút thầy rê gần tay nắm'] = await do1(em, '.lv-giay', 4, async () => { for (let i = 0; i < 6; i++) { await thay.mouse.move(bang.x + bang.w - 8, bang.y + bang.h * 0.5 + i * 3); await ngu(300); await thay.mouse.move(bang.x + 40, bang.y + 60); await ngu(300) } }, 0.6); in1('F · bút thầy rê gần tay nắm')

}
// (E) câu mới Đúng / Sai; máy em thứ hai CHƯA gửi ⇒ thầy gọi bạn lên bảng ⇒ bị ép vào bảng live
await may.moLuot(CAU2, 'DSSD')
await em2.locator('.bpu-hs').waitFor({ timeout: 8000 })
await ngu(1500)
kq['E0 · câu Đúng / Sai, màn câu hỏi (em chưa gửi)'] = await do1(em2, DE_HOI, GIAY); in1('E0 · câu Đúng / Sai, màn câu hỏi (em chưa gửi)')
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: ['Chưa lên bảng buổi này'] })))
await em2.locator('.lv').waitFor({ timeout: 6000 })
kq['E1 · 3 giây đầu bị ép vào bảng live (Đúng / Sai)'] = await do1(em2, '.lv-giay', 3); in1('E1 · 3 giây đầu bị ép vào bảng live (Đúng / Sai)')
kq['E · bị ép vào bảng live, đứng yên'] = await do1(em2, '.lv-giay', GIAY); in1('E · bị ép vào bảng live, đứng yên')
kq['E2 · bị ép vào bảng live, thầy đang viết'] = await do1(em2, '.lv-giay', GIAY, () => vietBang(GIAY, 0.5), 0.6); in1('E2 · bị ép vào bảng live, thầy đang viết')
const giayE = await em2.evaluate(() => ({ soi: document.querySelector('.lv')?.hasAttribute('data-soi') ?? null, nutTraLoi: document.querySelectorAll('.lv-giay button, .lv-giay [role="radio"], .lv-giay input').length }))

writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, phòng thật trong Node, dữ liệu giả. Mỗi trạng thái: MutationObserver trên vùng đề + chụp liên tiếp vùng đề (so từng cặp khung liền nhau).', dist: DIST, giayMoiTrangThai: GIAY, giayE, kq, loiTrang }, null, 1) + '\n')
console.log('ô giấy lúc bị ép vào bảng (Đúng / Sai):', JSON.stringify(giayE))
if (loiTrang.length) console.log('LỖI TRANG:', loiTrang.slice(0, 4).join(' | '))
await trinh.close(); await may.dong()
process.exit(0)
