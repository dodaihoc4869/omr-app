// ĐO BỐ CỤC TỜ MÁY CHIẾU BẰNG TRÌNH DUYỆT THẬT (M2, 19/09/2026).
//
// Chạy: dev server đang sống ở http://localhost:5173, rồi `node scripts/do-bo-cuc-to-chieu.mjs`.
// Với 40 câu mẫu (`tests/fixtures/cau-mau-to-chieu.ts`), ở 1280×720, 1920×1080, 1366×768 và 1600×900 (hai khung sau KHÔNG dùng để hiệu chỉnh — chỉ để kiểm ước lượng ở khung lạ):
//   1. dựng tờ ghép cặp liền kề, đo: MỌI vùng đề `.mc-vung-de` phải KHÔNG tràn (scrollHeight ≤ clientHeight, scrollWidth ≤ clientWidth),
//      cỡ chữ ≥ sàn; ghi số đợt bị tách, số đợt bậc 5, số đợt cảnh báo;
//   2. ghép TỪNG câu với một bạn cực ngắn để biết bậc thật của câu ấy (bậc 1 nếu ghép đôi được) — dùng hiệu chỉnh `uoc-luong-bo-cuc.ts`;
//   3. chụp ảnh các đợt tiêu biểu vào `docs/anh-man-chieu-1909/`.
// Thoát mã 1 nếu có bất kỳ vùng đề nào tràn hoặc cỡ chữ dưới sàn.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const URL = process.env.URL_DEV || 'http://localhost:5173/'
const OUT = 'docs/anh-man-chieu-1909'
const VIEWS = [[1280, 720], [1920, 1080], [1366, 768], [1600, 900]]
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ket = { taiLuc: new Date().toISOString(), khung: {} }
let hong = 0

/** Chạy trong trang: đọc mọi đợt của tờ đã đo. */
const docTo = () =>
  [...document.querySelectorAll('#mc-ray > .mc-dot:not(.mc-dot-da)')].map((x, i) => ({
    stt: i + 1,
    ten: [...x.querySelectorAll('.mc-ten')].map((t) => t.textContent).join(' + '),
    bac: Number(x.dataset.bac),
    co: Number(x.dataset.co),
    vua: x.dataset.vua ?? '1',
    tach: x.dataset.tach === '1',
    soEm: x.querySelectorAll('.mc-nua').length,
    tran: [...x.querySelectorAll('.mc-vung-de')].some((v) => v.scrollHeight > v.clientHeight + 1 || v.scrollWidth > v.clientWidth + 1),
    ghiChu: x.querySelector(':scope > .mc-ghi-chu')?.textContent ?? '',
  }))

for (const [W, H] of VIEWS) {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(URL)
  const html = await page.evaluate(async () => {
    const T = await import('/src/lib/html-may-chieu.ts')
    const F = await import('/tests/fixtures/cau-mau-to-chieu.ts')
    return T.taoHtmlMayChieu(F.CAU_MAU.map((x) => x.o), { tenBuoi: 'Buổi mẫu 40 câu' })
  })
  await page.setContent(html)
  await page.waitForSelector('body[data-bo-cuc="xong"]')
  await page.waitForTimeout(1500)
  const dot = await page.evaluate(docTo)
  const coSan = Math.round((W * 24) / 1920)
  const tran = dot.filter((d) => d.tran)
  const duoiSan = dot.filter((d) => d.co < coSan - 1e-9 && d.bac !== 5)
  const khongVua = dot.filter((d) => d.vua === '0')
  hong += tran.length + duoiSan.length
  ket.khung[`${W}x${H}`] = {
    soDot: dot.length,
    bac: dot.map((d) => d.bac).join(''),
    tach: dot.filter((d) => d.tach).length,
    bac5: dot.filter((d) => d.bac === 5).length,
    khongVua: khongVua.map((d) => d.ten),
    tran: tran.map((d) => d.ten),
    coMin: Math.min(...dot.map((d) => d.co)),
    coSan,
    dot,
  }

  // ── ẢNH 6 ĐỢT TIÊU BIỂU (chỉ hai khung của đặc tả): 1920×1080 bậc 1, 2, 4 · 1280×720 bậc 3, tách đợt, bậc 5 ──
  const chupDot = async (stt, ten) => {
    await page.evaluate((i) => {
      const ray = document.getElementById('mc-ray')
      ray.style.scrollBehavior = 'auto'
      ray.style.scrollSnapType = 'none'
      ray.scrollLeft = (i - 1) * ray.clientWidth
    }, stt)
    await page.waitForTimeout(200)
    await page.screenshot({ path: `${OUT}/m2-${W}x${H}-${ten}.png` })
  }
  const bacCan = W === 1920 ? [1, 2, 4] : W === 1280 ? [3] : []
  for (const b of bacCan) {
    const k = dot.find((d) => d.bac === b)
    if (k) await chupDot(k.stt, `dot${String(k.stt).padStart(2, '0')}-bac${b}`)
  }
  if (W === 1280) {
    // (a) chữ cực lớn ×1,4 ⇒ nhiều đợt đôi không còn vừa ⇒ TÁCH đợt (có ghi chú cho thầy)
    await page.selectOption('#mc-size', '1.4')
    await page.waitForTimeout(1200)
    const sau = await page.evaluate(docTo)
    const t = sau.find((d) => d.tach)
    ket.khung['1280x720'].chuCucLon = { soDot: sau.length, tach: sau.filter((d) => d.tach).length, tran: sau.filter((d) => d.tran).length, bac5: sau.filter((d) => d.bac === 5).length }
    hong += sau.filter((d) => d.tran).length
    if (t) await chupDot(t.stt, `dot${String(t.stt).padStart(2, '0')}-tach-chu-1.4`)
    await page.selectOption('#mc-size', '1')
    // (b) một câu dài tới mức chiếm CẢ bảng (bậc 5)
    const html5 = await page.evaluate(async () => {
      const T = await import('/src/lib/html-may-chieu.ts')
      const F = await import('/tests/fixtures/cau-mau-to-chieu.ts')
      const base = F.CAU_MAU.find((x) => x.ten === 'cực-I-đề-160').o
      const chuoi = base.cau.text.split(' ')
      const dai = { ...base, cau: { ...base.cau, text: Array.from({ length: 4 }, () => base.cau.text).join(' '), luaChon: base.cau.luaChon } }
      return { html: T.taoHtmlMayChieu([dai], { tenBuoi: 'Câu quá dài' }), tu: chuoi.length * 4 }
    })
    await page.setContent(html5.html)
    await page.waitForSelector('body[data-bo-cuc="xong"]')
    await page.waitForTimeout(800)
    const d5 = (await page.evaluate(docTo))[0]
    ket.khung['1280x720'].cauCucDai = { tu: html5.tu, bac: d5.bac, co: d5.co, vua: d5.vua, tran: d5.tran, ghiChu: d5.ghiChu }
    if (d5.tran) hong++
    await page.screenshot({ path: `${OUT}/m2-${W}x${H}-dot01-bac${d5.bac}-cau-cuc-dai.png` })
    await page.setContent(html)
    await page.waitForSelector('body[data-bo-cuc="xong"]')
    await page.waitForTimeout(600)
  }

  // ── BẬC THẬT của từng câu: ghép câu với một bạn cực ngắn, ép "có thể ghép đôi" (bacUoc = 1) rồi xem tờ đo ra sao ──
  //   · đợt còn nguyên hai em ⇒ câu vừa nửa bảng ⇒ bậc 1;
  //   · đợt bị tách ⇒ bậc = bậc của đợt đơn chứa câu ấy (≥ 2).
  const tung = await page.evaluate(async () => {
    const T = await import('/src/lib/html-may-chieu.ts')
    const F = await import('/tests/fixtures/cau-mau-to-chieu.ts')
    const ban = { ...F.CAU_MAU[0].o, sbd: 'BAN', hoTen: 'Bạn ghép', qid: 'QBAN', bacUoc: 1 }
    return F.CAU_MAU.map((x) => ({ ten: x.ten, html: T.taoHtmlMayChieu([{ ...x.o, bacUoc: 1 }, ban], {}) }))
  })
  const rieng = []
  for (const t of tung) {
    await page.setContent(t.html)
    await page.waitForSelector('body[data-bo-cuc="xong"]')
    await page.waitForTimeout(350)
    const ds = await page.evaluate(docTo)
    const d = ds[0]
    rieng.push({ ten: t.ten, bac: d.bac, co: d.co, vua: d.vua, tran: ds.some((x) => x.tran), tach: d.tach })
    if (ds.some((x) => x.tran)) hong++
  }
  ket.khung[`${W}x${H}`].rieng = rieng
  await page.close()
}
await browser.close()
writeFileSync(`${OUT}/do-bo-cuc-40-cau.json`, JSON.stringify(ket, null, 1))
for (const [k, v] of Object.entries(ket.khung)) {
  console.log(`${k}: ${v.soDot} đợt · bậc ${v.bac} · tách ${v.tach} · bậc5 ${v.bac5} · không vừa ${v.khongVua.length} · TRÀN ${v.tran.length} · chữ nhỏ nhất ${v.coMin}px (sàn ${v.coSan}px)`)
}
console.log(hong === 0 ? 'ĐẠT: 0 vùng đề tràn, không cỡ chữ dưới sàn' : `TRƯỢT: ${hong} vùng tràn/dưới sàn`)
process.exit(hong === 0 ? 0 : 1)
