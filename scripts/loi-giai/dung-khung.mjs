// Dựng KHUNG LỜI GIẢI `public/loi-giai/khung.html` — trang tĩnh chạy trong iframe sandbox của app (học sinh + màn duyệt của thầy).
// Nguồn: docs/loi-giai-a/khung/ (mã Phòng thí nghiệm Ester) + p2-khung.html + p7-nhung.js + bộ chìa khoá docs/loi-giai-a/bo-chia-khoa.
// Chạy lại khi sửa khung hoặc thêm bộ chìa khoá:  node scripts/loi-giai/dung-khung.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { docCacBo } from './dung-bo.mjs'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const K = (f) => fs.readFileSync(path.join(GOC, 'docs/loi-giai-a/khung', f), 'utf8')
const RA = path.join(GOC, 'public/loi-giai/khung.html')

export function dungKhung() {
  const TU_KHOI_DONG = "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();"
  const quiz = K('p6-quiz.js')
  if (!quiz.includes(TU_KHOI_DONG)) throw new Error('p6-quiz.js đổi dòng khởi động — sửa dung-khung.mjs')
  const bo = docCacBo()
  const head = K('p1-head.html')
    .replace('<title>Phòng thí nghiệm Ester</title>', '<title>Lời giải từng bước</title>')
    .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Lời giải từng bước cho một câu Hoá — chìa khoá, dựng, gắn, soi, chốt.">')
  // Không mạng ra ngoài ngoài phông chữ; không form, không kết nối — khung chỉ nhận dữ liệu qua postMessage.
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'">`
  const nhung = '<style>[data-next]{display:none!important}#qbar{display:none!important}.hdr .nav{display:none}'
    + '.luat{list-style:none;margin:0;padding:16px 20px 20px;display:grid;gap:10px;font-size:16px;line-height:1.6}'
    + '.luat li{position:relative;padding-left:20px}'
    + '.luat li::before{content:"";position:absolute;left:3px;top:.62em;width:8px;height:8px;border-radius:50%;background:var(--kc)}'
    + '.luat b{color:var(--ink)}</style>'
  return [
    '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n',
    csp, '\n', head, nhung, '\n</head>\n<body>\n', K('p2-khung.html'),
    '<script>\n', K('p3-data.js'), '\n', K('p4-core.js'), '\n', K('p5-labs.js'), '\n', quiz.replace(TU_KHOI_DONG, '/* khởi động khi app gửi hồ sơ — p7-nhung.js */'), '\n',
    `const BO_CAC_CHUONG = ${JSON.stringify(bo)};\n`, K('p7-nhung.js'), '\n</script>\n</body>\n</html>\n',
  ].join('')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.dirname(RA), { recursive: true })
  const html = dungKhung()
  fs.writeFileSync(RA, html)
  console.log('đã dựng', path.relative(GOC, RA), Math.round(html.length / 1024), 'KB')
}
