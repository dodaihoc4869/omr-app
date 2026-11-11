#!/usr/bin/env node
// KỊCH BẢN CHROMIUM THẬT: BÚT BẬT thì CON LĂN vẫn cuộn đề / cuộn bảng (thầy 11/11: «Khi bật bút thì con lăn cuộn đề không hoạt động, sửa bật bút con lăn
// cuộn đề và bảng hoạt động bình thường nhé»). Tờ chiếu THẬT (src/lib/html-may-chieu.ts) với một câu DÀI hơn khung giấy + sự kiện chuột / con lăn / phím THẬT.
//   node scripts/but-bang-1011/thu-con-lan-1111.mjs [gốc mã = repo này]      ⇒ in số đo, có mục nào sai thì thoát mã 1
// Gốc mã khác (bản giải nén của origin/main) ⇒ tái hiện lỗi cũ: mục «bút BẬT, lăn trên giấy» ra 0.
import { existsSync, mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '../..')
const GOC_MA = resolve(process.argv[2] ?? GOC)
const TAM = mkdtempSync(join(tmpdir(), 'con-lan-'))

/** Tờ chiếu thật, một đợt, câu dài (đề + 4 phương án dài) ⇒ sau khi bấm L giấy đề phải cuộn. */
async function taoToDai() {
  const vao = join(TAM, 'vao.ts')
  const doan = 'Hỗn hợp X gồm axit axetic, axit acrylic và phenol. Chia X thành ba phần bằng nhau rồi tiến hành các thí nghiệm sau đây theo đúng thứ tự, mỗi thí nghiệm ghi lại hiện tượng và khối lượng sản phẩm thu được. '
  writeFileSync(vao, `import { taoHtmlMayChieu } from ${JSON.stringify(join(GOC_MA, 'src/lib/html-may-chieu.ts'))}
const cau = (id, text, luaChon) => ({ phan: 'I', id, maDe: '', chuyenDe: 'Axit cacboxylic', dang: 'Tính theo phương trình', sao: 2, mucDo: '', text, luaChon, dapAn: 'B', chot: 'Axit + bazơ → muối + nước.', lyDo: [{ khoa: 'B', ly: 'n = 0,1 mol.' }], buoc: ['Viết phương trình.', 'Tính số mol.'] })
const o = (sbd, hoTen, c, soCau) => ({ sbd, hoTen, qid: 'DE-I-' + sbd, soCau, sao: 2, cau: c, bacUoc: 2, lop: '12A1', lanLenBang: 3 })
const doan = ${JSON.stringify(doan)}
export const html = taoHtmlMayChieu([
  o('A01', 'Nguyễn Minh Anh', cau('DE-I-1', [1, 2, 3, 4, 5, 6, 7, 8].map((i) => 'Thí nghiệm ' + i + ': ' + doan).join('\\n'), ['Phần một tác dụng vừa đủ với 50 ml dung dịch NaOH 1M', 'Phần hai tác dụng vừa đủ với 100 ml dung dịch NaOH 1M', 'Phần ba làm mất màu vừa đủ 150 ml dung dịch brom 1M', 'Cả ba phần đều cần 200 ml dung dịch NaOH 1M']), 12),
] as never, { tenBuoi: 'Thử con lăn 11/11' } as never)
`)
  const ra = join(TAM, 'to.mjs')
  await build({ entryPoints: [vao], bundle: true, platform: 'node', format: 'esm', outfile: ra, logLevel: 'warning', nodePaths: [join(GOC, 'node_modules')], loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl', '.woff2': 'dataurl', '.woff': 'dataurl', '.wasm': 'empty' } })
  const tep = join(TAM, 'to.html')
  writeFileSync(tep, (await import(pathToFileURL(ra).href)).html)
  return tep
}

const tep = await taoToDai()
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const DPR = Number(process.env.MAT_DO || 1)
const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DPR, reducedMotion: 'reduce', locale: 'vi-VN' })
const t = await ctx.newPage(), loi = [], sai = [], so = {}
t.on('pageerror', (e) => loi.push(e.message))
// deltaY mà TRANG nhận được: ở mật độ điểm ảnh giả lập khác 1, Chromium không đầu chia deltaY của sự kiện cho mật độ trong khi vẫn tự cuộn đủ số gốc
// (máy thật: deltaY = đúng quãng trình duyệt tự cuộn) ⇒ ở mật độ khác 1 so với deltaY trang thấy, không so với số gửi vào.
await t.addInitScript(() => { window.__dy = 0; addEventListener('wheel', (e) => { window.__dy = e.deltaY }, true) })
const dyThay = () => t.evaluate(() => window.__dy)
await t.goto(pathToFileURL(tep).href)
await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
await t.evaluate(() => document.fonts.ready)

const doc = () => t.evaluate(() => {
  const v = window.__mcDot().querySelector('.mc-vung-de'), c = v.querySelector(':scope > .mc-con-nua'), r = v.getBoundingClientRect()
  return { cuon: v.classList.contains('mc-cuon'), top: Math.round(v.scrollTop), cao: v.clientHeight, tong: v.scrollHeight, conNua: !!c && c.classList.contains('mc-hien'), o: [r.left, r.top, r.right, r.bottom].map(Math.round), bang: window.__mcBut ? +window.__mcBut.cuon().toFixed(4) : null, vung: window.__mcBut ? window.__mcBut.vung() : null, trang: v.getAttribute('data-trang') }
})
const kiem = (ten, dung, chiTiet) => { console.log((dung ? '✓ ' : '✗ ') + ten + (chiTiet ? ' — ' + chiTiet : '')); if (!dung) sai.push(ten) }
/** Số điểm ảnh có mực của lớp hiện mực trong ô (px CSS). */
const muc = (x, y, w, h) => t.evaluate(([x, y, w, h]) => {
  const c = document.querySelector('canvas.mc-but:not(.mc-but-song)'), d = Math.min(devicePixelRatio, 3), a = c.getContext('2d').getImageData(Math.round(x * d), Math.round(y * d), Math.round(w * d), Math.round(h * d)).data
  let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 40) n++
  return n
}, [x, y, w, h])

// 0 · CHỜ GỌI, giấy lật TRANG (chữ dời bằng translateY, không cuộn): nét viết ở TRANG 2 không dính vào giấy ⇒ bấm L (giấy chuyển sang cuộn,
// scrollTop = đầu trang 2) thì nét KHÔNG nhảy lên cả trang — đứng yên như cũ.
const p0 = await doc()
await t.keyboard.press('b'); await t.waitForTimeout(250)
await t.keyboard.press('ArrowDown'); await t.waitForTimeout(250)
const p1 = await doc(), PX = Math.round((p1.o[0] + p1.o[2]) / 2), PY = Math.round((p1.o[1] + p1.o[3]) / 2)
await t.mouse.move(PX - 200, PY); await t.mouse.down(); await t.mouse.move(PX, PY + 3, { steps: 8 }); await t.mouse.up(); await t.waitForTimeout(150)
const oP = [PX - 205, PY - 12, 215, 28], mP0 = await muc(...oP)
await t.keyboard.press('b'); await t.waitForTimeout(150)
await t.keyboard.press('l'); await t.waitForTimeout(2800)
const p2 = await doc(), mP1 = await muc(...oP)
so.trang2 = { trang: [p0.trang, p1.trang], scrollTopSauL: p2.top, muc: [mP0, mP1] }
kiem('chờ gọi · nét viết ở trang 2 rồi bấm L ⇒ nét không nhảy theo scrollTop của giấy', !p0.cuon && p1.trang && p1.trang.startsWith('2/') && p2.cuon && p2.top > 100 && mP0 > 100 && Math.abs(mP1 - mP0) <= mP0 * 0.02, `trang ${p0.trang} → ${p1.trang} · scrollTop sau L ${p2.top} · mực ${mP0} → ${mP1}`)
await t.evaluate(() => { window.__mcBut.nhap({ net: [] }); window.__mcDot().querySelector('.mc-vung-de').scrollTop = 0 }); await t.waitForTimeout(150)
const datTop = (v) => t.evaluate((y) => { window.__mcDot().querySelector('.mc-vung-de').scrollTop = y }, v)
const lan = async (x, y, dy, tuy) => { await t.mouse.move(x, y); if (tuy?.ctrl) await t.keyboard.down('Control'); await t.mouse.wheel(0, dy); if (tuy?.ctrl) await t.keyboard.up('Control'); await t.waitForTimeout(160) }

const g0 = await doc()
kiem('đề dài hơn khung giấy, giấy ở chế độ cuộn', g0.cuon && g0.tong > g0.cao + 200, `khung ${g0.cao} px, nội dung ${g0.tong} px`)
const GX = Math.round((g0.o[0] + g0.o[2]) / 2), GY = Math.round((g0.o[1] + g0.o[3]) / 2)
const TRAN = g0.tong - g0.cao

// 1 · BÚT TẮT: con lăn trên giấy cuộn đề (mốc để so)
await lan(GX, GY, 300)
so.tat = (await doc()).top
kiem('bút TẮT · lăn 300 trên giấy ⇒ đề cuộn', so.tat === 300, `scrollTop 0 → ${so.tat}`)
await datTop(0); await t.waitForTimeout(80)

// 2 · BÚT BẬT: con lăn trên giấy
await t.keyboard.press('b'); await t.waitForTimeout(350)
const B = (await doc()).vung.bang, BXg = Math.round((B[0] + B[2]) / 2 * 1920), BYg = Math.round((B[1] + B[3]) / 2 * 1080)
await lan(GX, GY, 300)
let g = await doc(); so.bat = g.top
const dy300 = await dyThay()
kiem('bút BẬT · lăn 300 trên giấy ⇒ đề cuộn y như bút tắt', so.bat > 0 && (DPR === 1 ? so.bat === so.tat : Math.abs(so.bat - dy300) <= 1), `scrollTop 0 → ${so.bat} (bút tắt: ${so.tat}; deltaY trang nhận: ${dy300})`)
kiem('bút BẬT · lăn trên giấy ⇒ bảng đen đứng yên', g.bang === 0, `độ cuộn bảng ${g.bang}`)
kiem('«còn nữa ↓» còn hiện khi chưa tới cuối', g.conNua === true)
await lan(GX, GY, 99999)
g = await doc(); so.cuoi = g.top
kiem('bút BẬT · lăn quá tay ⇒ dừng đúng cuối đề, «còn nữa ↓» tắt', Math.abs(g.top - TRAN) <= 1 && g.conNua === false, `scrollTop ${g.top} / trần ${TRAN}`)
await lan(GX, GY, -99999)
g = await doc()
kiem('bút BẬT · lăn ngược quá tay ⇒ về đúng đầu đề, «còn nữa ↓» hiện lại', g.top === 0 && g.conNua === true, `scrollTop ${g.top}`)
await lan(GX, GY, 300, { ctrl: true })
g = await doc()
kiem('bút BẬT · Ctrl + lăn (thu phóng) ⇒ không cuộn đề', g.top === 0, `scrollTop ${g.top}`)

// 3 · BÚT BẬT: con lăn trên bảng đen ⇒ cuộn bảng, đề đứng yên
await lan(BXg, BYg, 216)
g = await doc(); so.bang = g.bang
kiem('bút BẬT · lăn 216 trên bảng đen ⇒ bảng cuộn đúng deltaY (0,2 lần bề dọc ở mật độ 1)', Math.abs(g.bang - (await dyThay()) / 1080) < 0.002 && g.bang > 0, `độ cuộn bảng 0 → ${g.bang}`)
kiem('bút BẬT · lăn trên bảng đen ⇒ đề đứng yên', g.top === 0, `scrollTop ${g.top}`)
await lan(BXg, BYg, -99999)

// 4 · ĐANG ĐÈ BÚT thì con lăn không làm trôi nét dở; nhấc bút là cuộn được
await t.mouse.move(GX - 200, GY); await t.mouse.down(); await t.mouse.move(GX - 100, GY + 4, { steps: 6 })
await t.mouse.wheel(0, 300); await t.waitForTimeout(160)
g = await doc(); so.dangViet = g.top
kiem('đang đè bút trên giấy · lăn ⇒ đề KHÔNG cuộn', g.top === 0, `scrollTop ${g.top}`)
await t.mouse.move(GX, GY + 2, { steps: 6 }); await t.mouse.up(); await t.waitForTimeout(120)
const net1 = await t.evaluate(() => window.__mcBut.xuat().net.length)
kiem('nét dở vẫn nguyên một nét sau khi lăn giữa chừng', net1 === 1, `${net1} nét`)
await t.mouse.move(BXg - 100, BYg); await t.mouse.down(); await t.mouse.move(BXg, BYg + 3, { steps: 6 })
await t.mouse.wheel(0, 300); await t.waitForTimeout(160)
g = await doc()
kiem('đang đè bút trên bảng · lăn ⇒ bảng KHÔNG cuộn', g.bang === 0, `độ cuộn bảng ${g.bang}`)
await t.mouse.up(); await t.waitForTimeout(120)

// 5 · NÉT TRÊN GIẤY CUỘN THEO ĐỀ: nét gạch ngang ở y = GY; cuộn đề 200 ⇒ mực ở y = GY − 200, chỗ cũ sạch; cuộn về ⇒ mực về chỗ cũ
const o1 = [GX - 205, GY - 12, 215, 28], S1 = Math.round(200 * dy300 / 300), o2 = [GX - 205, GY - 12 - S1, 215, 28]
const m0 = [await muc(...o1), await muc(...o2)]
const phat = await t.evaluate(() => { window.__sk = []; window.__mcBut.nghe((sk) => { if (sk.loai !== 'tro') window.__sk.push(JSON.parse(JSON.stringify(sk))) }); return true })
await lan(GX, GY + 150, 200); await t.waitForTimeout(700)
g = await doc()
const m1 = [await muc(...o1), await muc(...o2)]
so.net = { truoc: m0, sau: m1 }
kiem('nét trên giấy CUỘN THEO đề (máy thầy)', g.top === S1 && m0[0] > 100 && m0[1] === 0 && m1[0] === 0 && Math.abs(m1[1] - m0[0]) <= m0[0] * 0.02, `đề cuộn ${g.top} px · mực [chỗ cũ, chỗ cũ − ${S1}]: ${m0} → ${m1}`)
const sk = await t.evaluate(() => window.__sk)
const y0 = GY / 1080, moi = sk.filter((s) => s.loai === 'net-moi' && s.xong), yMoi = moi.length ? moi[moi.length - 1].net.diem[0][1] : null
so.mayEm = { suKien: sk.map((s) => s.loai), yTruoc: +y0.toFixed(4), ySau: yMoi }
kiem('máy em được báo nét đã dời (xoa + net-moi có xong, toạ độ màn mới)', sk.some((s) => s.loai === 'xoa') && yMoi != null && Math.abs(yMoi - (GY - S1) / 1080) < 0.002, `sự kiện: ${sk.map((s) => s.loai).join(', ') || 'không có'} · y nét ${y0.toFixed(4)} → ${yMoi}`)
const xuat = await t.evaluate(() => window.__mcBut.xuat().net.map((n) => n.diem[0][1]))
kiem('ảnh trạng thái (xuat) mang toạ độ MÀN đang thấy', xuat.length >= 1 && Math.abs(xuat[0] - (GY - S1) / 1080) < 0.002, `y = ${xuat[0]}`)
await t.mouse.move(BXg - 100, BYg); await t.waitForTimeout(60)
await lan(GX, GY + 150, -200); await t.waitForTimeout(500)
const m2 = [await muc(...o1), await muc(...o2)]
kiem('cuộn về ⇒ nét về đúng chỗ cũ, từng điểm ảnh', m2[0] === m0[0] && m2[1] === 0, `mực ${m2}`)
// viết lúc đề đang cuộn, rồi cuộn tiếp: nét mới cũng dính vào đề
await lan(GX, GY + 150, 300); await t.waitForTimeout(200)
await t.mouse.move(GX - 200, GY + 100); await t.mouse.down(); await t.mouse.move(GX, GY + 103, { steps: 8 }); await t.mouse.up(); await t.waitForTimeout(150)
const S2 = Math.round(100 * dy300 / 300), o3 = [GX - 205, GY + 88, 215, 28], o4 = [GX - 205, GY + 88 + S2, 215, 28]
const m3 = [await muc(...o3), await muc(...o4)]
await lan(GX, GY + 150, -100); await t.waitForTimeout(500)
const m4 = [await muc(...o3), await muc(...o4)]
kiem('nét viết lúc đề đang cuộn cũng dính vào đề', m3[0] > 100 && m3[1] === 0 && m4[0] === 0 && Math.abs(m4[1] - m3[0]) <= m3[0] * 0.02, `mực [chỗ viết, chỗ viết + ${S2}]: ${m3} → ${m4}`)
// tẩy theo nét khi đề đang cuộn: kéo tẩy qua chỗ nét ĐANG HIỆN
await t.keyboard.press('e'); await t.mouse.move(GX - 100, GY + 70 + S2); await t.mouse.down(); await t.mouse.move(GX - 100, GY + 130 + S2, { steps: 6 }); await t.mouse.up(); await t.keyboard.press('e'); await t.waitForTimeout(150)
const net2 = await t.evaluate(() => window.__mcBut.xuat().net.length), m5 = await muc(...o4)
kiem('tẩy theo nét trúng nét đang hiện khi đề đã cuộn', m5 === 0, `mực còn ${m5} · còn ${net2} nét`)
await t.keyboard.press('Control+z'); await t.waitForTimeout(150)
kiem('hoàn tác tẩy ⇒ nét về đúng chỗ', Math.abs(await muc(...o4) - m4[1]) <= 2)
await datTop(0); await t.waitForTimeout(400)

// 6 · PHÍM cuộn đề: bút bật = bút tắt
const phim = async (k) => { await datTop(0); await t.waitForTimeout(80); await t.keyboard.press(k); await t.waitForTimeout(200); return (await doc()).top }
const phimBat = {}, phimTat = {}
for (const k of ['Space', 'ArrowDown', 'PageDown']) phimBat[k] = await phim(k)
await datTop(TRAN); await t.waitForTimeout(80); await t.keyboard.press('PageUp'); await t.waitForTimeout(200); phimBat.PageUp = (await doc()).top
await datTop(TRAN); await t.waitForTimeout(80); await t.keyboard.press('ArrowUp'); await t.waitForTimeout(200); phimBat.ArrowUp = (await doc()).top
await t.keyboard.press('b'); await t.waitForTimeout(250)
for (const k of ['Space', 'ArrowDown', 'PageDown']) phimTat[k] = await phim(k)
await datTop(TRAN); await t.waitForTimeout(80); await t.keyboard.press('PageUp'); await t.waitForTimeout(200); phimTat.PageUp = (await doc()).top
await datTop(TRAN); await t.waitForTimeout(80); await t.keyboard.press('ArrowUp'); await t.waitForTimeout(200); phimTat.ArrowUp = (await doc()).top
so.phim = { bat: phimBat, tat: phimTat }
kiem('Space / ↓ / PageDown / ↑ / PageUp cuộn đề: bút bật = bút tắt', JSON.stringify(phimBat) === JSON.stringify(phimTat) && phimTat.Space > 0, JSON.stringify(phimBat) + ' · tắt ' + JSON.stringify(phimTat))
// bút TẮT sau khi đã viết: lăn trên giấy vẫn cuộn tự nhiên và nét vẫn theo đề
await datTop(0); await t.waitForTimeout(300)
const m6 = await muc(...o1)
await lan(GX, GY, 200); await t.waitForTimeout(300)
const m7 = [await muc(...o1)]
// (bút tắt: trình duyệt tự cuộn đủ 200 px ở mọi mật độ ⇒ ô soi lùi đúng 200 px)
const o5 = [GX - 205, GY - 212, 215, 28], m8 = await muc(...o5)
kiem('bút TẮT (đã có nét) · lăn trên giấy ⇒ đề cuộn, nét theo đề', (await doc()).top === 200 && m6 > 100 && m7[0] === 0 && Math.abs(m8 - m6) <= m6 * 0.02, `mực ${m6} → chỗ cũ ${m7[0]}, chỗ cũ − 200: ${m8}`)

await trinh.close()
console.log(JSON.stringify({ matDo: DPR, phat, ...so }))
if (loi.length) { console.error('LỖI TRANG:', loi); process.exit(1) }
if (sai.length) { console.error(`${sai.length} mục SAI:\n  ` + sai.join('\n  ')); process.exit(1) }
console.log('thu-con-lan-1111: mọi mục đúng.')
