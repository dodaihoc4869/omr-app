#!/usr/bin/env node
// BỘ THỬ THẺ «ĐANG NÓI» TRONG KHAY CỦA NÚT «THÊM» — thầy 11/11 tối: (1) «cho nó ẩn luôn vào cái biểu tượng các nút để tôi bật chủ động»; (2) «phải hiện đủ
// bảng kích thước chức năng như mẫu»; (3) «khi học sinh bật mic thì tự động phát tiếng em ra loa lớp luôn nhé, bỏ luôn nút bật tắt đó đi … có thêm tắt mic tất cả».
// Chromium THẬT, tờ chiếu THẬT có cầu nối (trang thử ?vai=thay&noi=1) + phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-dang-noi-1111.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = <thư mục ảnh>/so-do-dang-noi-1111.json]
// Bật live bằng giao diện thật. Trạng thái «chưa ai nói» là trạng thái THẬT app gửi (máy thầy thật: thay.ts) — kiểm luôn mặc định mới «tự phát tiếng em ra loa»
// (ngheEm = true, không cần bấm). Trạng thái «có em nói / giơ tay» bơm từ trang thử (phòng thử không có máy chủ tiếng ⇒ không có em nói thật). Kiểm:
//   góc trống, dấu đỏ · mở khay ⇒ khối đầu khay là thẻ ĐẦY ĐỦ (chữ cái, tên, đội · mic đang bật, sóng, Thu mic, Tắt mic tất cả, giơ tay), không còn hàng loa ·
//   khối không làm khay rộng ra, ba nhóm một hàng, khay trọn trong màn · bấm Thu mic / Tắt mic tất cả / «2 em giơ tay» KHÔNG làm khay thu · Esc thu, bút vẫn bật ·
//   N mở lại tại khối · chạm ra ngoài thu · khổ hẹp (860) xếp dọc, cuộn được, khối ở đầu.
// Ảnh 1366 + 1920: that-7-khay-dang-noi-du-co-em-<W>.jpg, that-7-khay-dang-noi-du-chua-ai-<W>.jpg (JPG ≤ 150 KB).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-dang-noi-1111.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = [], soDo = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const KHO = [[1366, 768, true], [1920, 1080, true], [1180, 820, false], [860, 600, false]]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const EM_NOI = { sbd: 'S1', ten: 'Đỗ Đại Học', ky: 'ĐH', doi: 'Đội Natri', mau: '' }
const TAY = [{ sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '', luc: 1 }, { sbd: 'S3', ten: 'Trần Thu Hà', ky: 'TH', doi: 'Đội Natri', mau: '', luc: 2 }]
const tt = (them) => ({ co: true, pha: 'live', tu: Date.now() - 425_000, xem: 38, tong: 40, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: true, noi: [], ngheEm: true, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: true, nghe: 36, ghi: 'dang-ghi', ...them })

for (const [W, H, coAnh] of KHO) {
  const may = await moMayChu({ dist: DIST })
  const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, permissions: ['microphone'] })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const thay = await ctx.newPage()
  thay.on('pageerror', (e) => loiTrang.push(`${W}: ${e.message}`))
  const N = `${W}×${H}`, hep = W <= 900
  const chup = async (ten) => {
    if (!coAnh) return
    let q = 84, buf
    do { buf = await thay.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
    writeFileSync(join(ANH, `that-7-khay-dang-noi-du-${ten}-${W}.jpg`), buf)
    console.log(`  ảnh that-7-khay-dang-noi-du-${ten}-${W}.jpg ${Math.round(buf.length / 1024)} KB`)
  }
  const to = thay.frameLocator('iframe')
  const guiTo = (tin) => thay.evaluate((m) => document.querySelector('iframe').contentWindow.postMessage(m, '*'), tin)
  const bom = async (them) => { await guiTo({ nguon: 'bpu-bang', lenh: 'live-tt', tt: tt(them) }); await ngu(300) }
  const phim = (k) => to.locator('body').press(k)
  const dangMo = () => to.locator('body').evaluate((b) => b.classList.contains('mc-khay-mo'))
  const moKhay = async () => { if (!(await dangMo())) await to.locator('#mc-them').click(); await ngu(260) }
  const sach = () => to.locator('body').evaluate(() => { if (document.activeElement) document.activeElement.blur() })
  const goc = () => to.locator('.mc-lv-roi').evaluate((e) => e.hidden)
  const tin = (viec) => thay.evaluate((v) => window.__tinTo.filter((m) => m.viec === v), viec)
  /** Khay + khối «Đang nói»: hộp khay, ba nhóm có chung một hàng không, khối có ở đầu và trên ba nhóm không, ô chạm, khay trọn trong màn. */
  const doKhay = () => to.locator('#mc-khay').evaluate((k) => {
    const R = k.getBoundingClientRect(), d = k.querySelector('.mc-khay-noi'), D = d && !d.hidden ? d.getBoundingClientRect() : null
    const nhom = [...k.querySelectorAll('.mc-khay-nhom')].filter((g) => !g.hidden).map((g) => g.getBoundingClientRect())
    const nut = d && !d.hidden ? [...d.querySelectorAll('button')].map((b) => ({ chu: b.innerText.replace(/\s+/g, ' ').trim(), cao: Math.round(b.getBoundingClientRect().height) })) : []
    const s = getComputedStyle(k)
    return { w: Math.round(R.width), h: Math.round(R.height), top: Math.round(R.top), bottom: Math.round(R.bottom), hien: s.visibility === 'visible', huong: s.flexDirection, cuon: k.scrollHeight > k.clientHeight + 1, ngang: k.scrollWidth > k.clientWidth + 1, scrollTop: k.scrollTop,
      dauKhay: k.firstElementChild === d, khoi: D ? { t: Math.round(D.top), b: Math.round(D.bottom), w: Math.round(D.width) } : null, chu: d && !d.hidden ? d.innerText.replace(/\s+/g, ' ').trim() : '',
      motHang: nhom.length > 0 && nhom.every((g) => Math.abs(g.top - nhom[0].top) < 1), nhomTop: nhom.length ? Math.round(Math.min(...nhom.map((g) => g.top))) : 0,
      nut, trongMan: R.top >= 0 && R.bottom <= innerHeight + 0.6 && R.left >= 0 && R.right <= innerWidth + 0.6,
      vach: d ? d.querySelectorAll('#mc-lv-me i').length : 0, loa: !!document.querySelector('[data-nghe="0"],[data-nghe="1"]') || document.body.innerText.includes('Phát tiếng em ra loa lớp') }
  })
  const dau = () => to.locator('#mc-them').evaluate((e) => { const s = getComputedStyle(e, '::before'); return { noi: e.getAttribute('data-noi'), nhan: e.getAttribute('aria-label'), hien: s.display === 'block', trai: Math.round(parseFloat(s.left)) } })

  await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
  await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
  await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
  await guiTo({ type: 'ddh-mc-ket-noi', maPhien: 'thu1111' })
  await to.locator('body.mc-noi').waitFor({ timeout: 6000 })
  await ngu(500)
  // ── chưa live: bề rộng gốc của khay (không có khối) ──
  await moKhay()
  const goc0 = await doKhay()
  kiem(`${N} · chưa live: khay không có khối «Đang nói»`, !goc0.khoi && !goc0.chu, JSON.stringify({ w: goc0.w, h: goc0.h }))
  await phim('Escape'); await ngu(220)
  await to.locator('.mc-lv-nut').click()
  await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
  await ngu(400)
  await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
  await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
  await ngu(900)
  await thay.evaluate(() => { window.__tinTo = []; window.addEventListener('message', (e) => { if (e.data && e.data.nguon === 'to-chieu' && e.data.loai === 'live') window.__tinTo.push(e.data) }) })

  // ── A · CHƯA AI NÓI — trạng thái THẬT app gửi: máy thầy mặc định tự phát tiếng em ra loa; khay có đúng một dòng «Chưa có em nào nói» ──
  const ttThat = await to.locator('body').evaluate(() => window.__mcLive && window.__mcLive.tt())
  kiem(`${N} · máy thầy THẬT (thay.ts) báo «phát tiếng em ra loa» BẬT sẵn, không cần bấm`, ttThat && ttThat.pha === 'live' && ttThat.ngheEm === true && !(ttThat.noi || []).length, JSON.stringify({ pha: ttThat && ttThat.pha, ngheEm: ttThat && ttThat.ngheEm }))
  await moKhay()
  const a = await doKhay(), dA = await dau()
  soDo[`${W}_chuaAi`] = { khay: { w: a.w, h: a.h, top: a.top }, goc: { w: goc0.w, h: goc0.h }, khoi: a.khoi }
  kiem(`${N} · chưa ai nói: khối đầu khay chỉ một dòng «Chưa có em nào nói», không nút, không hàng loa, không dấu`, a.dauKhay && a.chu === 'Chưa có em nào nói' && !a.nut.length && !a.loa && !dA.hien, a.chu)
  kiem(`${N} · ${hep ? 'khổ hẹp: khay xếp dọc, khối ở đầu' : 'khối không làm khay rộng ra, ba nhóm vẫn một hàng dưới khối'}; khay trọn trong màn, không tràn ngang`, (hep ? a.huong === 'column' : Math.abs(a.w - goc0.w) <= 1 && a.motHang && a.khoi.b <= a.nhomTop) && a.trongMan && !a.ngang, `khay ${goc0.w} ⇒ ${a.w} · ${a.huong}`)
  await sach(); await ngu(150)
  await chup('chua-ai')
  await phim('Escape'); await ngu(220)

  // ── B · CÓ EM NÓI + 2 em giơ tay: góc trống, dấu đỏ; mở khay ⇒ thẻ đầy đủ như mẫu ──
  await bom({ noi: [EM_NOI], tay: TAY })
  const dB = await dau()
  kiem(`${N} · có em nói: thẻ KHÔNG tự bung (góc phải dưới trống); nút «thêm» có dấu đỏ góc trái, nhãn đọc tên em`, await goc() && dB.noi === 'noi' && dB.hien && dB.trai <= 4 && /Đại Học đang nói, 2 em giơ tay/.test(dB.nhan), dB.nhan)
  await moKhay()
  const b = await doKhay()
  soDo[`${W}_coEm`] = { khay: { w: b.w, h: b.h, top: b.top }, khoi: b.khoi, nut: b.nut }
  const du = ['Đang nói', 'ĐH', 'Đỗ Đại Học', 'Đội Natri · mic đang bật', 'Thu mic', 'Tắt mic tất cả', '2 em giơ tay'].every((c) => b.chu.includes(c))
  kiem(`${N} · mở khay ⇒ khối đầu khay là thẻ ĐẦY ĐỦ: chữ cái, tên, «Đội Natri · mic đang bật», sóng 5 vạch, Thu mic, Tắt mic tất cả, «2 em giơ tay»; không hàng loa`, b.dauKhay && du && b.vach === 5 && !b.loa, b.chu.slice(0, 140))
  kiem(`${N} · ${hep ? 'khổ hẹp: xếp dọc, khay đủ rộng cho thẻ' : 'khay giữ bề rộng, ba nhóm một hàng dưới thẻ'}, trọn trong màn, không tràn ngang; mọi nút trong thẻ ≥ 40 px`, (hep ? b.huong === 'column' : Math.abs(b.w - goc0.w) <= 1 && b.motHang && b.khoi.b <= b.nhomTop) && b.trongMan && !b.ngang && b.nut.every((x) => x.cao >= 40), `${b.w}×${b.h} top ${b.top} · ${b.nut.map((x) => `${x.chu} ${x.cao}`).join(' | ')}`)
  await sach(); await ngu(150)
  await chup('co-em')
  // ── bấm trong thẻ: khay KHÔNG thu ──
  await to.locator('#mc-khay .mc-khay-noi .mc-lv-em [data-thu]').click(); await ngu(250)
  const t1 = await tin('thu-mic'), mo1 = await dangMo()
  await bom({ noi: [EM_NOI], tay: TAY }); await moKhay()
  await to.locator('#mc-khay .mc-khay-noi .mc-lv-cuoi [data-thu]').click(); await ngu(250)
  const t2 = await tin('thu-mic'), mo2 = await dangMo()
  kiem(`${N} · bấm «Thu mic» rồi «Tắt mic tất cả» trong khay ⇒ gửi app đúng lệnh như thẻ cũ, khay KHÔNG thu`, t1.length === 1 && t1[0].sbd === 'S1' && mo1 && t2.length === 2 && !('sbd' in t2[1]) && mo2, JSON.stringify(t2))
  await bom({ noi: [EM_NOI], tay: TAY }); await moKhay()
  await to.locator('#mc-khay .mc-khay-noi [data-tay]').click(); await ngu(250)
  const c = await doKhay()
  kiem(`${N} · chạm «2 em giơ tay» trong khay ⇒ hàng chờ mở («Mời nói», «Hạ hết tay»), khay KHÔNG thu`, (await dangMo()) && c.chu.includes('Mời nói') && c.chu.includes('Hạ hết tay'), c.chu.slice(-90))
  // trường hợp cao nhất: em nói + hàng chờ mở + dòng «Máy chưa phát được tiếng em» ⇒ khay vẫn trọn trong màn (cao quá thì cuộn trong khay)
  await bom({ noi: [EM_NOI], tay: TAY, emKet: true }); await moKhay()
  const d = await doKhay()
  soDo[`${W}_caoNhat`] = { khay: { w: d.w, h: d.h, top: d.top }, cuon: d.cuon }
  kiem(`${N} · cao nhất (em nói + hàng chờ mở + «Máy chưa phát được tiếng em»): khay trọn trong màn${d.cuon ? ', cuộn trong khay' : ''}, không tràn ngang`, d.trongMan && d.top >= 0 && !d.ngang && d.chu.includes('Máy chưa phát được tiếng em') && d.chu.includes('Mời nói'), `${d.w}×${d.h} top ${d.top}`)
  if (hep) {
    await to.locator('#mc-khay').evaluate((k) => { k.scrollTop = k.scrollHeight })
    await phim('Escape'); await ngu(200); await phim('n'); await ngu(260)
    const e = await doKhay()
    kiem(`${N} · khổ hẹp: khay xếp dọc, cuộn được; phím N mở lại ngay tại khối (cuộn về đầu)`, e.huong === 'column' && e.cuon && (await dangMo()) && e.scrollTop === 0 && e.dauKhay && e.khoi && e.khoi.t >= e.top - 1, `cuộn ${e.cuon} · scrollTop ${e.scrollTop}`)
  }
  // ── Esc thu khay, bút vẫn bật; N mở; chạm ra ngoài thu ──
  await bom({ noi: [EM_NOI] }); await moKhay()
  const butTruoc = await to.locator('body').evaluate((x) => x.classList.contains('mc-co-but'))
  await phim('Escape'); await ngu(220)
  kiem(`${N} · Esc thu khay, bút vẫn bật`, !(await dangMo()) && butTruoc && await to.locator('body').evaluate((x) => x.classList.contains('mc-co-but')))
  await phim('n'); await ngu(260)
  const moN = await dangMo(), khoiN = (await doKhay()).chu.includes('Thu mic')
  await thay.mouse.click(Math.round(W * 0.35), Math.round(H * 0.4)); await ngu(260)
  kiem(`${N} · phím N mở khay tại thẻ; chạm ra ngoài thu`, moN && khoiN && !(await dangMo()))
  await ctx.close(); await may.dong()
}

kiem('Không lỗi JavaScript trên trang nào', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
const hong = ket.filter((x) => !x.dat)
writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, tờ chiếu thật có cầu nối, phòng thật trong Node, dữ liệu giả («chưa ai nói» là trạng thái thật của app; «có em nói» bơm từ trang thử).', soDo, kiem: ket }, null, 2) + '\n')
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt`)
await trinh.close()
process.exit(hong.length ? 1 : 0)
