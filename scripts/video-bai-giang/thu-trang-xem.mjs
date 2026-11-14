// BẤM THỬ TRANG XEM VIDEO TÓM TẮT (public/video-bai/) như máy em: mở ⇒ Xem ⇒ tiếng chạy, khung vẽ ⇒ Mục lục ⇒ nhảy tới «Đoán nhanh» ⇒ trang dừng cho
// chọn ⇒ chạm đáp án ⇒ chạy tiếp từ cuối khoảng chờ. Chụp ảnh từng bước. Dùng: node thu-trang-xem.mjs <địa chỉ trang> <thư mục ảnh>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [diaChi, ra] = process.argv.slice(2)
mkdirSync(ra, { recursive: true })
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=user-gesture-required'] })
const ketQua = []
const kiem = (ten, dung, chiTiet = '') => { ketQua.push(dung); console.log(`${dung ? 'ĐẠT ' : 'HỎNG'} · ${ten}${chiTiet ? ` · ${chiTiet}` : ''}`) }
for (const [khoName, w, h] of [['ngang', 844, 390], ['doc', 390, 844]]) {
  const tr = await trinh.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true })
  const loi = []; tr.on('pageerror', (e) => loi.push(e.message))
  await tr.goto(diaChi)
  await tr.waitForSelector('#nut-xem:not(.an-ui)', { timeout: 20000 })
  await tr.screenshot({ path: join(ra, `${khoName}-1-bia.jpg`), type: 'jpeg', quality: 70 })
  if (khoName === 'doc') { kiem('khổ dọc: bìa + gợi ý xoay ngang hiện', await tr.isVisible('#xoay')); await tr.close(); continue }
  await tr.click('#nut-xem')
  await tr.waitForTimeout(3500)
  const t1 = await tr.evaluate(() => document.querySelector('#am').currentTime)
  kiem('bấm Xem ⇒ tiếng chạy', t1 > 2, `t = ${t1.toFixed(1)} s`)
  await tr.screenshot({ path: join(ra, `${khoName}-2-dang-xem.jpg`), type: 'jpeg', quality: 70 })
  await tr.mouse.click(w / 2, h / 2); await tr.waitForTimeout(200)
  await tr.click('#dk-muc'); await tr.waitForTimeout(300)
  await tr.screenshot({ path: join(ra, `${khoName}-3-muc-luc.jpg`), type: 'jpeg', quality: 70 })
  const soMuc = await tr.$$eval('#muc button', (b) => b.length)
  // số phần + cảnh có Đoán nhanh + đáp án đúng lấy từ kịch bản đang phát (K12: 13 phần, đoán ở phần 10; K10 khác)
  // eslint-disable-next-line no-undef -- KB là biến toàn cục của khung.js trong trang
  const kb = await tr.evaluate(() => { const c = KB.doan.filter((d) => d.loai === 'canh'), i = c.findIndex((d) => d.doVui); return { so: c.length, dv: i + 1, dung: i < 0 ? 0 : c[i].doVui.luaChon.findIndex((x) => x[2]) + 1 } })
  kiem('mục lục đủ phần', soMuc === kb.so, `${soMuc} dòng`)
  await tr.click(`#muc button:nth-child(${kb.dv})`)
  const dung = await tr.waitForFunction(() => !document.querySelector('#chon').classList.contains('an-ui'), null, { timeout: 30000 }).then(() => true, () => false)
  kiem('tới Đoán nhanh ⇒ dừng cho chọn', dung && await tr.evaluate(() => document.querySelector('#am').paused))
  await tr.waitForTimeout(700)
  await tr.screenshot({ path: join(ra, `${khoName}-4-do-vui.jpg`), type: 'jpeg', quality: 70 })
  const tTruoc = await tr.evaluate(() => document.querySelector('#am').currentTime)
  await tr.click(`#dv-lc .lc:nth-child(${kb.dung})`)
  await tr.waitForTimeout(2500)
  const sau = await tr.evaluate(() => ({ t: document.querySelector('#am').currentTime, dung: document.querySelector('#am').paused, chon: !!document.querySelector('.mini-lc > div[data-chon="1"]') }))
  kiem('chạm đáp án ⇒ chạy tiếp, nhảy qua khoảng chờ, đánh dấu lựa chọn', !sau.dung && sau.t > tTruoc + 3 && sau.chon, `t ${tTruoc.toFixed(1)} → ${sau.t.toFixed(1)} s`)
  await tr.screenshot({ path: join(ra, `${khoName}-5-sau-chon.jpg`), type: 'jpeg', quality: 70 })
  kiem('không lỗi trang', loi.length === 0, loi.slice(0, 2).join(' | '))
  await tr.close()
}
await trinh.close()
console.log(`${ketQua.filter(Boolean).length}/${ketQua.length} đạt`)
process.exit(ketQua.every(Boolean) ? 0 : 1)
