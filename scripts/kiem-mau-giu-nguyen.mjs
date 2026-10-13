#!/usr/bin/env node
// KIỂM MÀU GIỮ NGUYÊN — thầy 05/10: "Tôi muốn giữ nguyên mọi màu sắc các lớp trong 3 app hiện tại, bạn thêm thì phải đồng bộ đúng chuẩn nhé."
//
//   node scripts/kiem-mau-giu-nguyen.mjs [mốc=origin/main]
//
// So cây làm việc với MỐC (bản đang chạy thật), chỉ trong src/ (CSS, TS, TSX) và index.html:
//   1. KHÔNG khai báo màu nào đang có bị xoá hay đổi giá trị. Khai báo màu = `thuộc-tính: giá-trị` với thuộc tính màu (color, background…,
//      border…, outline…, fill, stroke, box-shadow, text-shadow, caret/accent-color) hoặc biến `--x:` mà giá trị là màu. So theo TẬP khai báo
//      của từng tệp (dòng bị viết lại nhưng khai báo màu y nguyên thì không tính là đổi).
//   2. Khai báo màu THÊM mới không có màu thô (rgb/rgba/hsl/hsla/hex/tên màu) — chỉ dùng biến màu đã có (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md
//      mục 8 "chỉ token", C11 "cùng một thứ cùng màu").
//   3. Mọi `var(--x)` trong khai báo màu thêm mới đều đã được định nghĩa ở đâu đó trong src/ (không có biến "ma" ⇒ màu rơi về trong suốt).
// Thoát mã 1 nếu vi phạm (in từng dòng: tệp · khai báo). Màu thật sự cần đổi ⇒ thầy duyệt trước, rồi ghi lý do trong commit.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'

const MOC = process.argv[2] || 'origin/main'
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })

const THUOC_TINH_MAU = /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|stop-color|box-shadow|text-shadow|caret-color|accent-color|column-rule(?:-color)?|text-decoration(?:-color)?|--[\w-]+)$/i
// Đủ 148 tên màu của CSS Color 4; currentColor và transparent là từ khoá hợp lệ, không phải màu thô.
const TEN_MAU_CSS = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey
darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue
lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver
skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`
  .split(/\s+/)
const MAU_THO = new RegExp(`(?<![\\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|#[0-9a-f]{3,8}\\b|(?<![\\w-])(?:${TEN_MAU_CSS.join('|')})(?![\\w-])`, 'i')

// Tên màu trong đường dẫn/fragment không phải màu: url('/icons/red.svg'), url('#blue').
// Giữ nguyên các phần khác, kể cả màu fallback trong var() và màu pha trong color-mix().
function vanMau(van) {
  return van.replace(/\burl\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^)]*)\s*\)/gi, '')
}
const LA_MAU = (gt) => {
  const van = vanMau(gt)
  return MAU_THO.test(van) || /var\(\s*--|color-mix\(|currentcolor|transparent|gradient\(/i.test(van)
}

// Chỉ lấy thuộc tính tô màu SVG, không lấy title/aria-label/data-fill hoặc chữ giao diện.
const THE_SVG = new Set('svg g path circle ellipse rect line polygon polyline text tspan textpath use symbol marker pattern mask clippath filter lineargradient radialgradient stop defs switch image foreignobject'.split(' '))
const TEN_THUOC_SVG = /^(?:fill|stroke|stopColor|stop-color)$/
function mauSvg(van, ten) {
  const ra = []
  const them = (ten, gt) => {
    if (LA_MAU(gt) || /^(?:none|inherit|initial|unset)$/i.test(gt)) ra.push(`${ten.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}: ${gt.replace(/\s+/g, ' ').trim()}`)
  }
  const html = (s) => {
    for (const m of s.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-z][\w:-]*)\b([^<>]*)>/gi)) {
      if (!THE_SVG.has(m[1].toLowerCase())) continue
      for (const a of m[2].matchAll(/(?<![\w:-])(fill|stroke|stopColor|stop-color)\s*=\s*(["'])(.*?)\2/g)) them(a[1], a[3])
    }
  }
  if (ten.endsWith('.html')) { html(van); return ra }
  const tep = ts.createSourceFile('mau-svg.tsx', van, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const doc = n => {
    if (ts.isJsxAttribute(n) && TEN_THUOC_SVG.test(n.name.getText(tep))) {
      const the = n.parent.parent
      if (THE_SVG.has(the.tagName?.getText(tep).toLowerCase())) {
        const init = n.initializer
        const giaTri = init && (ts.isStringLiteral(init) ? init : ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression) ? init.expression : null)
        if (giaTri) them(n.name.getText(tep), giaTri.text)
      }
    }
    // Các phiếu HTML dùng string/template; ghép bằng dấu ngăn để không đoán giá trị nội suy.
    if (ts.isStringLiteralLike(n) && !ts.isJsxAttribute(n.parent)) html(n.text)
    if (ts.isTemplateExpression(n)) html([n.head.text, ...n.templateSpans.map(x => x.literal.text)].join(' _bien_ '))
    ts.forEachChild(n, doc)
  }
  doc(tep)
  return ra
}

/** Khai báo màu trong một đoạn văn bản: CSS `a: b;` và style JSX `{ color: 'var(--x)' }` / `background: \`…\``. */
function khaiBaoMau(van, ten = '') {
  const ra = []
  const bo = (s) => s.replace(/\s+/g, ' ').trim()
  for (const m of vanMau(van).matchAll(/(?<![\w-])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+?)\s*(?=;|}|$)/gim)) {
    const tt = m[1].toLowerCase()
    if (!THUOC_TINH_MAU.test(tt)) continue
    const gt = bo(m[2])
    if (tt.startsWith('--') && !LA_MAU(gt)) continue
    if (!LA_MAU(gt) && !/^(?:none|inherit|initial|unset|0)$/i.test(gt)) continue
    ra.push(`${tt}: ${gt}`)
  }
  for (const m of van.matchAll(/\b(color|background(?:Color|Image)?|border(?:Color|Top|Bottom|Left|Right)?|outline(?:Color)?|fill|stroke|stopColor|boxShadow|textShadow|caretColor|accentColor)\s*:\s*(['"`])([^'"`]+)\2/g)) {
    const tt = m[1].replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
    if (LA_MAU(m[3])) ra.push(`${tt}: ${bo(m[3])}`)
  }
  if (!ten.endsWith('.css')) ra.push(...mauSvg(van, ten))
  return ra
}

// Ngoại lệ đóng 13/10: bỏ đúng mẫu HTML tự chấm Mom bằng đáp án đoán A.
// Kết quả nay dùng momReviewHtml(review) đã có, sau ACK máy chủ. CSS/palette của app giữ nguyên.
// Chỉ bỏ khai báo trong initializer đã xoá TOÀN BỘ; sửa mẫu hoặc màu khác cùng tệp vẫn bị kiểm.
function htmlMomTuCham(van) {
  const tep = ts.createSourceFile('StudentPortalScreen.tsx', van, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const ds = []
  const docKhoi = n => {
    if (ts.isFunctionLike(n)) return // Không lấy template của hàm/arrow con đang dùng.
    if (ts.isVariableDeclaration(n) && n.name.getText(tep) === 'htmlKetQua' && n.initializer && (ts.isTemplateExpression(n.initializer) || ts.isNoSubstitutionTemplateLiteral(n.initializer))) ds.push(n.initializer.getText(tep))
    ts.forEachChild(n, docKhoi)
  }
  const quet = n => {
    if (n.name?.getText(tep) === 'nopBaiCuaMom') {
      const fn = ts.isVariableDeclaration(n) ? n.initializer : ts.isFunctionDeclaration(n) ? n : null
      if (fn && ts.isFunctionLike(fn) && fn.body && ts.isBlock(fn.body)) docKhoi(fn.body)
    }
    ts.forEachChild(n, quet)
  }
  quet(tep)
  return ds.length === 1 ? ds[0] : ''
}
const HASH_HTML_MOM_CU = 'aa2e70cfa2703cdecc5fa07e0105e650e781b0ed097b751b3586349f81352f8e'

// Thầy giao gỡ quản lý chiến dịch cũ (14/10). Chỉ miễn màu của đúng thẻ đã
// ngừng dùng khi bỏ NGUYÊN khối; màu các thẻ Cài đặt còn lại vẫn được so đủ.
function theChienDichCu(van) {
  const tep = ts.createSourceFile('CaiDatScreen.tsx', van, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const ds = []
  const doc = n => {
    if (ts.isFunctionLike(n)) return
    if (ts.isJsxElement(n) && n.openingElement.tagName.getText(tep) === 'TheNoiDung') {
      const s = n.getText(tep)
      if (s.includes('Chiến dịch đã giao') && s.includes('onClick={moChienDichDaGiao}')) ds.push(s)
    }
    ts.forEachChild(n, doc)
  }
  for (const n of tep.statements) if (ts.isFunctionDeclaration(n) && n.name?.text === 'CaiDatScreen' && n.body) doc(n.body)
  return ds.length === 1 ? ds[0] : ''
}
const HASH_THE_CHIEN_DICH_CU = '7977f3eefcb87b9f79c99be702d1830deac0e35e78edc2bd563d4ceb2290689b'
// Snapshot sau khi gỡ đã được soát: đổi nhãn/callback của thẻ còn sống không
// được hiểu là đã gỡ. Mọi thay đổi khác trong hàm đều dùng cổng màu đầy đủ.
function hashCaiDat(van) {
  const tep = ts.createSourceFile('CaiDatScreen.tsx', van, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const fn = tep.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'CaiDatScreen')
  return fn ? createHash('sha256').update(fn.getText(tep)).digest('hex') : ''
}
const HASH_CAI_DAT_SAU_GO = '992464e17d32709a088761586ed3f47705d52043b3528e4bf9f5fde18957f297'

const LA_TEP = (f) => (/^src\/.*\.(css|tsx?|html)$/.test(f) || f === 'index.html') && !f.includes('graphify-out')
const doi = git('diff', '--name-status', MOC, '--', 'src', 'index.html').trim().split('\n').filter(Boolean)
  .map((d) => d.split('\t')).filter(([, f, f2]) => LA_TEP(f2 ?? f))

// Biến đã định nghĩa trong src/ hiện tại (CSS `--x:`, style JSX `'--x':`, setProperty('--x')).
const dinh = new Set()
const quet = (thu) => {
  for (const ten of readdirSync(thu)) {
    const p = join(thu, ten)
    if (ten === 'node_modules' || ten === 'graphify-out') continue
    if (statSync(p).isDirectory()) quet(p)
    else if (/\.(css|tsx?|html)$/.test(ten)) {
      const s = readFileSync(p, 'utf8')
      for (const m of s.matchAll(/(--[\w-]+)\s*:/g)) dinh.add(m[1])
      for (const m of s.matchAll(/['"](--[\w-]+)['"]\s*[:,]/g)) dinh.add(m[1])
    }
  }
}
quet('src')
for (const m of readFileSync('index.html', 'utf8').matchAll(/(--[\w-]+)\s*:/g)) dinh.add(m[1])

// TỆP MÃ CHẾT ĐÃ XOÁ NGUYÊN TỆP — ngoại lệ ĐÓNG (06/10, thầy giao "gọn mã"; liệt kê đủ đường dẫn, KHÔNG glob). Cổng này so VĂN BẢN từng tệp với mốc nên xoá cả tệp bị tính là
// "xoá màu đang có"; nhưng các tệp dưới đây KHÔNG nằm trong gói của app nào (máy quét `scripts/quet-to-mo-coi.mjs`: không có đường từ src/main.tsx · src/sw.ts · server/src/index.ts;
// bằng chứng từng tệp + từng test gỡ ở docs/gon-ma-0610-lan-2.md) ⇒ xoá chúng không đổi màu nào của ba app. CHỈ áp cho trạng thái D (xoá) của đúng các đường dẫn này; thêm tệp vào đây phải có
// bằng chứng ấy. Khi mốc origin/main đã không còn các tệp này thì danh sách vô hại, xoá lúc nào cũng được.
const DA_XOA_MA_CHET = new Set([
  // game Thần thú v1 (đã bị than-thu-v2 thay)
  'src/components/ThanThuHoaHocGame.tsx', 'src/components/ThanThu3D.tsx', 'src/components/DauTruongChanLy.tsx', 'src/components/CauHoiTrongGame.tsx',
  'src/components/KhungLoiGiaiGame.tsx', 'src/components/OngNghiemExp.tsx', 'src/components/PopupThuongExp.tsx', 'src/lib/anh-than-thu.ts',
  'src/game/than-thu-hoa-hoc/am-thanh-pet.ts', 'src/game/than-thu-hoa-hoc/can-bang-thap.ts', 'src/game/than-thu-hoa-hoc/canh-3d-chung.ts', 'src/game/than-thu-hoa-hoc/canh-nen-3d.ts',
  'src/game/than-thu-hoa-hoc/cau-hoi-cua-em.ts', 'src/game/than-thu-hoa-hoc/chieu-thuc-3d.ts', 'src/game/than-thu-hoa-hoc/dang-than-thu.ts', 'src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts',
  'src/game/than-thu-hoa-hoc/dong-bo.ts', 'src/game/than-thu-hoa-hoc/dung-than-thu-3d.ts', 'src/game/than-thu-hoa-hoc/he-thong-pet.ts', 'src/game/than-thu-hoa-hoc/kho-cau-hoi.ts',
  'src/game/than-thu-hoa-hoc/long-thu-3d.ts', 'src/game/than-thu-hoa-hoc/rut-cau-thap.ts', 'src/game/than-thu-hoa-hoc/tan-hu-vo-3d.ts', 'src/game/than-thu-hoa-hoc/tuong-khac.ts',
  'src/game/than-thu-hoa-hoc/ve-than-thu.ts',
  // báo cáo xem điểm cũ của thầy (đã bị ca-thi/BaoCaoChiTiet thay) + thẻ ca gần nhất PH cũ
  'src/components/xem-diem-gv/BaoCaoCaLop.tsx', 'src/components/xem-diem-gv/BaoCaoMotEm.tsx', 'src/components/xem-diem-gv/xem-diem-gv.css', 'src/components/xem-diem/TheCaGanNhat.tsx',
])

// 14/10: các đường dẫn chính xác có đồ thị trước/sau, giữ lõi học. Hash buộc
// bản bị gỡ đúng snapshot đã soát; không miễn tệp sửa một phần hoặc mã mới cùng tên.
const GAME_DA_GO = new Map(JSON.parse(readFileSync(new URL('../docs/don-game-1410/mau-tep-da-go.json', import.meta.url), 'utf8')).files.map(x => [x.path, x.sha256]))

// MÀU THẦY RA LỆNH THÊM — ngoại lệ ĐÓNG (09/10/2026, thầy: "Quét bảng màu từ Bảng G (ngà voi #FFFEF6, xanh ngọc #10B981, xanh navy #0F3D3A,
// vàng #F7A800) cập nhật vào tailwind…", rồi "Build rồi đẩy luôn"). Đúng BA khai báo gốc ở tokens.css (xanh ngọc trùng --xanh có sẵn nên không cần);
// mọi sắc dẫn xuất phải pha color-mix từ ba biến này. Liệt kê đủ tệp · khai báo, KHÔNG glob; thêm dòng mới phải có lệnh thầy kèm theo.
const MAU_THAY_RA_LENH = new Set([
  'src/styles/tokens.css · --v2-nga-voi: #fffef6',
  'src/styles/tokens.css · --v2-xanh-than: #0f3d3a',
  'src/styles/tokens.css · --v2-vang: #f7a800',
])

const loi = []
let soTep = 0
let soMaChet = 0
for (const [trangThai, f, f2] of doi) {
  const ten = f2 ?? f
  if (trangThai.startsWith('D') && DA_XOA_MA_CHET.has(f)) { soMaChet++; continue }
  if (trangThai === 'D' && GAME_DA_GO.has(f)) {
    const cu = git('show', `${MOC}:${f}`)
    if (createHash('sha256').update(cu).digest('hex') === GAME_DA_GO.get(f)) { soMaChet++; continue }
  }
  soTep++
  const cu = trangThai.startsWith('A') ? '' : (() => { try { return git('show', `${MOC}:${f}`) } catch { return '' } })()
  let moi = ''
  try { moi = trangThai.startsWith('D') ? '' : readFileSync(ten, 'utf8') } catch { moi = '' }
  const dem = (ds) => ds.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map())
  const a = dem(khaiBaoMau(cu, ten)), b = dem(khaiBaoMau(moi, ten))
  const htmlCu = trangThai === 'M' && ten === 'src/screens/StudentPortalScreen.tsx' ? htmlMomTuCham(cu) : ''
  if (htmlCu && createHash('sha256').update(htmlCu).digest('hex') === HASH_HTML_MOM_CU && !htmlMomTuCham(moi)) {
    for (const [k, n] of dem(khaiBaoMau(htmlCu))) a.set(k, Math.max(0, (a.get(k) ?? 0) - n))
  }
  const theCu = trangThai === 'M' && ten === 'src/screens/CaiDatScreen.tsx' ? theChienDichCu(cu) : ''
  if (theCu && createHash('sha256').update(theCu).digest('hex') === HASH_THE_CHIEN_DICH_CU && hashCaiDat(moi) === HASH_CAI_DAT_SAU_GO) {
    for (const [k, n] of dem(khaiBaoMau(theCu))) a.set(k, Math.max(0, (a.get(k) ?? 0) - n))
  }
  for (const [k, n] of a) if ((b.get(k) ?? 0) < n) loi.push(`ĐỔI/XOÁ màu đang có · ${ten} · ${k}`)
  for (const [k, n] of b) {
    if ((a.get(k) ?? 0) >= n) continue
    const gt = k.slice(k.indexOf(':') + 1)
    if (MAU_THO.test(vanMau(gt)) && !MAU_THAY_RA_LENH.has(`${ten} · ${k}`)) loi.push(`MÀU THÔ mới (phải dùng biến chuẩn) · ${ten} · ${k}`)
    for (const m of gt.matchAll(/var\(\s*(--[\w-]+)/g)) if (!dinh.has(m[1])) loi.push(`BIẾN MÀU chưa định nghĩa · ${ten} · ${k}`)
  }
}
console.log(`kiem-mau-giu-nguyen · mốc ${MOC} · ${soTep} tệp src/ đổi · ${loi.length} vi phạm` + (soMaChet ? ` · ${soMaChet} tệp mã chết đã xoá nguyên tệp (ngoại lệ đóng, không tính)` : ''))
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
