// PHÉP KIỂM "HIỆN ĐỀ KHÔNG ĐƯỢC LỘ ĐÁP ÁN".
//
// Thầy bắt 15/09: bấm "Hiện đề" trong phiếu khắc phục mà ô đáp án vẫn khác màu
// ba ô còn lại. Bản cũ giấu bằng cách TÔ LẠI ô đáp án cho "trung hoà", mà bộ
// màu tô lại không trùng bộ màu ô thường — nên vẫn nhìn ra.
//
// Tệp này CHẤM BẰNG SỐ, không bằng mắt: mở phiếu thật bằng Chromium, bấm đúng
// nút "Hiện đề", rồi so getComputedStyle của ô đáp án với từng ô còn lại. Lệch
// một thuộc tính là trượt, và in ra đúng thuộc tính nào lệch.
//
//   npx vitest run tests/lo-dap-an-chi-de-1509.test.ts && node scripts/kiem-lo-dap-an.mjs
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PHIEU = resolve(GOC, '.kiem-hien-thi/phieu-lo-dap-an.html')

if (!existsSync(PHIEU)) {
  console.error('Chưa có phiếu. Chạy trước: npx vitest run tests/lo-dap-an-chi-de-1509.test.ts')
  process.exit(2)
}

const SAN_CO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch(existsSync(SAN_CO) ? { executablePath: SAN_CO } : {})
const trang = await trinh.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
await trang.goto('file://' + PHIEU, { waitUntil: 'load' })

/** Đọc bộ thuộc tính NHÌN THẤY ĐƯỢC của một ô phương án. */
const DOC = () =>
  trang.evaluate(() => {
    const doThe = (e) => {
      const cs = getComputedStyle(e)
      const chu = e.querySelector('.q-opt-letter')
      const csChu = chu ? getComputedStyle(chu) : null
      return {
        nen: cs.backgroundColor,
        chu: cs.color,
        dam: cs.fontWeight,
        vien: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].join('|'),
        vienDay: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join('|'),
        chuNen: csChu ? csChu.backgroundColor : '',
        chuMau: csChu ? csChu.color : '',
        chuDam: csChu ? csChu.fontWeight : '',
        opacity: cs.opacity,
        laDapAn: e.getAttribute('data-dung') === '1',
        coLopDung: e.classList.contains('dung'),
        chuTrongThe: (e.textContent || '').trim().slice(0, 24),
      }
    }
    return [...document.querySelectorAll('.q-card')].map((the) => ({
      stt: the.getAttribute('data-stt') || '',
      o: [...the.querySelectorAll('.q-opt')].map(doThe),
      loDap: [...the.querySelectorAll('.lo-dap')].map((x) => getComputedStyle(x).display),
      giai: [...the.querySelectorAll('.sol-wrap')].map((x) => getComputedStyle(x).display),
    }))
  })

const K = []
const kt = (ten, dk, them) => K.push([ten, !!dk, them || ''])

// --- 1. Mặc định: phiếu có nút, đáp án được tô (đây là bản dò bài) ---
const truoc = await DOC()
kt('mặc định: ô đáp án CÓ lớp dung', truoc.every((c) => c.o.some((o) => o.laDapAn && o.coLopDung)))

// --- 2. Bấm đúng nút "Hiện đề" như em vẫn bấm ---
await trang.click('#chi-de')
await trang.waitForTimeout(400)
const sau = await DOC()

kt('bấm Hiện đề: KHÔNG ô nào còn lớp dung', sau.every((c) => c.o.every((o) => !o.coLopDung)))
kt('bấm Hiện đề: dấu data-dung vẫn còn để bật lại được', sau.every((c) => c.o.some((o) => o.laDapAn)))

const THUOC = ['nen', 'chu', 'dam', 'vien', 'vienDay', 'chuNen', 'chuMau', 'chuDam', 'opacity']
const lech = []
for (const c of sau) {
  const dap = c.o.find((o) => o.laDapAn)
  const thuong = c.o.filter((o) => !o.laDapAn)
  if (!dap || thuong.length === 0) continue
  for (const t of thuong) {
    for (const k of THUOC) {
      if (dap[k] !== t[k]) lech.push(`câu ${c.stt} · ${k}: đáp án "${dap[k]}" ≠ ô thường "${t[k]}"`)
    }
  }
}
kt('bấm Hiện đề: ô đáp án giống ô thường TỪNG THUỘC TÍNH', lech.length === 0, lech.slice(0, 6).join(' · '))
kt('bấm Hiện đề: lời giải bị giấu', sau.every((c) => c.giai.every((d) => d === 'none')))
kt('bấm Hiện đề: mệnh đề "đáp án đúng X" bị giấu', sau.every((c) => c.loDap.every((d) => d === 'none')))

// --- 3. Bản IN cũng phải giấu y như màn hình ---
await trang.emulateMedia({ media: 'print' })
await trang.waitForTimeout(200)
const inRa = await DOC()
const lechIn = []
for (const c of inRa) {
  const dap = c.o.find((o) => o.laDapAn)
  const thuong = c.o.filter((o) => !o.laDapAn)
  if (!dap || thuong.length === 0) continue
  for (const t of thuong) for (const k of THUOC) if (dap[k] !== t[k]) lechIn.push(`câu ${c.stt} · ${k}`)
}
kt('bản IN ở chế độ Hiện đề cũng không lộ', lechIn.length === 0, lechIn.slice(0, 6).join(' · '))
await trang.emulateMedia({ media: 'screen' })

// --- 4. Bấm lại thì đáp án phải hiện lại — giấu chứ không xoá ---
await trang.click('#chi-de')
await trang.waitForTimeout(400)
const lai = await DOC()
kt('bấm lần nữa: đáp án hiện lại', lai.every((c) => c.o.some((o) => o.laDapAn && o.coLopDung)))
const hienLai = lai.some((c) => {
  const dap = c.o.find((o) => o.laDapAn)
  const thuong = c.o.find((o) => !o.laDapAn)
  return dap && thuong && dap.nen !== thuong.nen
})
kt('bấm lần nữa: đáp án lại NỔI BẬT so với ô thường', hienLai)

await trinh.close()

let truot = 0
for (const [ten, dat, them] of K) {
  console.log(`  ${dat ? '✓' : '✗'}  ${ten}${them ? `\n        ${them}` : ''}`)
  if (!dat) truot++
}
console.log(`KẾT LUẬN LỘ ĐÁP ÁN: ${truot === 0 ? 'ĐẠT' : 'TRƯỢT'}  ${K.length - truot}/${K.length}`)
process.exit(truot === 0 ? 0 : 1)
