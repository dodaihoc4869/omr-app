// 13 PHÉP KIỂM HIỂN THỊ — mục E8 của LUATGOCKHODE.md, chạy ở KHỔ 360px.
//
// Chạy trên DOM THẬT (tests/xuat-dom-hien-thi.test.tsx dựng ra) kèm CSS ĐÃ
// BUILD trong dist/, bằng Chromium thật để có bố cục thật. Không chụp màn hình:
// chấm bằng getComputedStyle và getBoundingClientRect.
//
//   npx vitest run tests/xuat-dom-hien-thi.test.tsx && npm run build && node scripts/kiem-13.mjs
//
// Một phép trượt -> thoát mã 1 và in đúng phép nào trượt, để sửa ĐÚNG mục
// tương ứng chứ không sửa mò nhiều chỗ.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOM = resolve(GOC, '.kiem-hien-thi/the-cau.html')
const DIST = resolve(GOC, 'dist/assets')

if (!existsSync(DOM)) {
  console.error('Chưa có DOM. Chạy trước: npx vitest run tests/xuat-dom-hien-thi.test.tsx')
  process.exit(2)
}
if (!existsSync(DIST)) {
  console.error('Chưa có dist/. Chạy trước: npm run build')
  process.exit(2)
}

const css = readdirSync(DIST)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(resolve(DIST, f), 'utf8'))
  .join('\n')
const than = readFileSync(DOM, 'utf8')

// Nền và cỡ chữ gốc y như index.html thật.
const trang = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
<style>body{margin:0;padding:12px;background:var(--nen)}</style>
</head><body>${than}</body></html>`

// Container này có sẵn Chromium ở PLAYWRIGHT_BROWSERS_PATH nhưng bản build có
// thể lệch số hiệu với gói playwright — trỏ thẳng vào file thật khi có.
const SAN_CO = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch(existsSync(SAN_CO) ? { executablePath: SAN_CO } : {})
const trang360 = await trinh.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })
await trang360.setContent(trang, { waitUntil: 'load' })
await trang360.evaluate(() => document.fonts.ready)

const ketQua = await trang360.evaluate(() => {
  const K = []
  const kt = (ten, dk) => K.push([ten, !!dk])
  const q = (s) => document.querySelector(s)
  const cs = (s) => {
    const e = q(s)
    return e ? getComputedStyle(e) : null
  }

  kt(
    'NFC',
    [...document.querySelectorAll('.cau-de,.pa-noi-dung,.lg-chu')].every((e) => e.textContent === e.textContent.normalize('NFC')),
  )
  kt('không oC', !document.body.innerText.match(/\d\s*o\s*C\b/))
  kt('không dấu chấm thập phân', !document.body.innerText.match(/\d+\.\d+\s*(gam|mol|M|tấn)/))
  kt('dấu nối đúng vị trí', !document.body.innerText.match(/[A-Za-z][⁻¯–][A-Za-z]/))
  kt(
    'tên chất không bọc ce',
    [...document.querySelectorAll('.katex')].filter((e) => /Gly|Ala|Val|glucose|methyl|formate|diene/i.test(e.textContent)).length === 0,
  )
  kt('katex inline', !q('.cau-de .katex-display'))
  kt('katex cùng cỡ', cs('.katex')?.fontSize === cs('.cau-de')?.fontSize)
  kt('baseline', cs('.pa-hang')?.alignItems === 'baseline')
  kt('mã cùng cỡ nội dung', cs('.pa-ma')?.fontSize === cs('.pa-noi-dung')?.fontSize)
  kt('hình hiện sẵn', ![...document.querySelectorAll('.cau-hinh')].some((e) => e.hidden))
  kt('lời giải không nghiêng', !q('.lg-chot') || cs('.lg-chot')?.fontStyle === 'normal')
  kt('không tràn ngang', document.documentElement.scrollWidth <= window.innerWidth + 1)
  kt(
    'vùng chạm ≥48px',
    ![...document.querySelectorAll('.pa-hang')].some((e) => e.getBoundingClientRect().height < 48),
  )

  // Số liệu phụ để soi khi trượt — KHÔNG tính vào 13 phép.
  const soLieu = {
    katex: cs('.katex')?.fontSize,
    cauDe: cs('.cau-de')?.fontSize,
    paMa: cs('.pa-ma')?.fontSize,
    paNoiDung: cs('.pa-noi-dung')?.fontSize,
    alignItems: cs('.pa-hang')?.alignItems,
    phongDe: cs('.cau-de')?.fontFamily,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    caoHangThapNhat: Math.min(...[...document.querySelectorAll('.pa-hang')].map((e) => e.getBoundingClientRect().height)),
  }
  return { K, soLieu }
})

await trinh.close()

const { K, soLieu } = ketQua
for (const [ten, ok] of K) console.log(`  ${ok ? '✓' : '✕'}  ${ten}`)
const dat = K.every((x) => x[1])
console.log('KẾT LUẬN:', dat ? 'ĐẠT' : 'CHƯA ĐẠT')
if (!dat) {
  console.log('Số đo:', JSON.stringify(soLieu, null, 1))
  process.exit(1)
}
