#!/usr/bin/env node
// CHỤP HỎI THẦY BẢN THẬT (13/10, bước nghiệm thu của docs/ban-ve-hoi-thay-1310/GHI-CHU.md mục 7): linh kiện thật qua vite dev
// (docs/ban-ve-hoi-thay-1310/that/), Chromium thật, mạng /hs/hoi-thay + /hs/hoi-tro-ly chặn bằng Playwright, trả dữ liệu mẫu đúng khuôn máy chủ.
//   node scripts/chup-hoi-thay-that-1310.mjs [thư mục ra = docs/ban-ve-hoi-thay-1310/anh-that]
// Soát: lỗi trang · tràn ngang trong hộp · đích chạm < 44 px (nút/summary trong hộp). JPG ≤ 150 KB.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-hoi-thay-1310/anh-that'))
mkdirSync(RA, { recursive: true })

const CAU = {
  tln: {
    cau: { qid: 'Q', so: 'Câu 4', chuong: 'Hợp chất chứa nitrogen', de: '<p>Trong số các amine sau: methylamine, ethylamine, dimethylamine, trimethylamine và aniline.<br>Có bao nhiêu amine ở thể khí trong điều kiện thường?</p>', y: {} },
    hoi: 'Em dùng kiến thức gì để giải câu này ạ',
    ct: {
      yChinh: 'Em dùng **tính chất vật lý của amine**: có ==4 amine== ở thể khí.',
      buoc: [
        { ten: 'Nhớ quy tắc', chu: 'Amine phân tử khối nhỏ là **chất khí**, mùi khai, tan nhiều trong nước.' },
        { ten: 'Xét từng chất', chu: 'So trạng thái của năm chất ở điều kiện thường.' },
        { ten: 'Đếm', chu: '4 chất khí ⇒ đáp số **4**.' },
      ],
      bang: { cot: ['Chất', 'Công thức', 'Thể'], dong: [['methylamine', 'CH3NH2', 'khí'], ['ethylamine', 'C2H5NH2', 'khí'], ['dimethylamine', '(CH3)2NH', 'khí'], ['trimethylamine', '(CH3)3N', 'khí'], ['aniline', 'C6H5NH2', 'lỏng']], sauBuoc: 2 },
      ghiNho: 'Bốn amine khí: CH3NH2, (CH3)2NH, (CH3)3N, C2H5NH2. Aniline là chất lỏng, ít tan trong nước.',
      hoiTiep: ['Vì sao aniline là chất lỏng?', 'Amine nào tan tốt trong nước?'],
    },
  },
  tn: {
    cau: { qid: 'Q', so: 'Câu 12', chuong: 'Hợp chất chứa nitrogen', de: '<p>Chất nào sau đây là amine bậc hai?</p>', y: { A: 'CH3NH2', B: '(CH3)2NH', C: '(CH3)3N', D: 'C6H5NH2' } },
    hoi: 'Vì sao (CH3)3N không phải bậc hai ạ',
    ct: {
      yChinh: 'Bậc amine = **số gốc hydrocarbon gắn vào N**. (CH3)3N có 3 gốc nên là ==bậc ba==.',
      buoc: [
        { ten: 'Đếm gốc gắn vào N', chu: '(CH3)3N: N gắn 3 gốc CH3, không còn H ⇒ bậc ba.' },
        { ten: 'Tìm chất bậc hai', chu: '(CH3)2NH: N gắn 2 gốc CH3 và 1 H ⇒ bậc hai ⇒ đáp án **B**.' },
        { ten: 'Loại phần còn lại', chu: 'CH3NH2 và C6H5NH2 chỉ có 1 gốc ⇒ bậc một.' },
      ],
      bang: null,
      ghiNho: 'Bậc amine đếm **số gốc gắn vào N**, không đếm số nguyên tử C.',
      hoiTiep: ['Bậc amine khác bậc alcohol thế nào?'],
    },
  },
  ds: {
    dangLam: true,
    cau: { qid: 'Q', so: 'Câu 2', chuong: 'Hợp chất chứa nitrogen', de: '<p>Cho các phát biểu về aniline (C6H5NH2):</p>', y: { a: 'Dung dịch aniline làm quỳ tím hoá xanh.', b: 'Aniline tác dụng với nước bromine tạo kết tủa trắng.', c: 'Aniline là chất lỏng ở điều kiện thường.', d: 'Tính base của aniline mạnh hơn methylamine.' } },
    hoi: 'Ý a em không chắc ạ',
    ct: {
      yChinh: 'Em so **tính base của aniline** với mức cần để quỳ tím đổi màu.',
      buoc: [
        { ten: 'Nhìn cấu tạo', chu: 'Vòng benzene C6H5– hút electron của nguyên tử N.' },
        { ten: 'Suy ra', chu: 'Cặp electron trên N kém linh động ⇒ tính base của aniline **rất yếu**.' },
        { ten: 'Em tự kết luận', chu: 'Base yếu cỡ đó có đủ làm quỳ tím hoá xanh không?' },
      ],
      bang: null,
      ghiNho: '',
      hoiTiep: ['Gợi ý thêm cho ý d'],
    },
  },
}
// [tên, loại, rộng, cao, tối?, mở đề lại sau khi Thầy trả lời?]
const KHUNG = [
  ['01-tra-loi-ngan-doc-toi', 'tln', 390, 844, true, false],
  ['02-tra-loi-ngan-doc-toi-toan-bo', 'tln', 390, 1720, true, true],
  ['03-tra-loi-ngan-doc-sang', 'tln', 390, 844, false, false],
  ['04-trac-nghiem-doc-toi-toan-bo', 'tn', 390, 1480, true, true],
  ['05-dung-sai-dang-lam-goi-huong-toi-toan-bo', 'ds', 390, 1500, true, true],
  ['06-trac-nghiem-ngang-toi', 'tn', 844, 390, true, false],
  ['07-tra-loi-ngan-may-tinh-sang', 'tln', 1440, 900, false, true],
  ['08-trac-nghiem-may-tinh-toi', 'tn', 1440, 900, true, false],
]

const vite = await createServer({ root: GOC, logLevel: 'error', server: { port: 0, host: '127.0.0.1', watch: null, hmr: false } })
await vite.listen()
const goc = vite.resolvedUrls.local[0]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
for (const [ten, k, w, h, toi, moDe] of KHUNG) {
  const m = CAU[k]
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : h > 1000 ? 1.25 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  await ctx.addInitScript(() => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok-thu' })))
  await ctx.route('**/hs/hoi-thay', (r) => r.fulfill({ json: m.dangLam ? { ok: true, chiHoi: true, cau: m.cau, hoiThem: true } : { ok: true, coLoiGiai: true, cau: m.cau, hoSo: { qid: 'Q', bam: 'b', dang: k, ten: 'T', co: [] }, hoiThem: true } }))
  await ctx.route('**/hs/hoi-tro-ly', (r) => r.fulfill({ json: { ok: true, traLoi: 'chữ phẳng', cauTruc: m.ct, conLai: 18, ngoaiPhamVi: false } }))
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${goc}docs/ban-ve-hoi-thay-1310/that/index.html?dangLam=${m.dangLam ? 1 : 0}`)
  await t.getByRole('button', { name: 'Hỏi thầy' }).click()
  await t.getByRole('dialog', { name: 'Hỏi Thầy' }).waitFor()
  await t.getByLabel('Chỗ em thắc mắc về câu này').fill(m.hoi)
  await t.getByRole('button', { name: 'Gửi' }).click()
  await t.locator('.lg-tl').waitFor()
  if (moDe) await t.locator('.lg-hh-de > summary').click()
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate(() => {
    const hop = document.querySelector('.lg-hh')
    const tran = [...hop.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0 && !e.closest('.lg-tl-bang-cuon')).map((e) => e.className || e.tagName)
    if (document.documentElement.scrollWidth > innerWidth + 1) tran.push('trang')
    const nho = [...hop.querySelectorAll('button, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  if (kq.tran.length) soat.push(`${ten}: TRÀN NGANG ${kq.tran.join(' | ')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (h > 1000) await t.evaluate(() => { const c = document.querySelector('.lg-hh'); c.style.maxHeight = 'none'; c.style.height = 'auto' })
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); await vite.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
