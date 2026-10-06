#!/usr/bin/env node
// QUÉT TỆP MỒ CÔI + EXPORT CHẾT bằng máy (thầy 06/10: "gọn mã"). Chỉ ĐỌC, không sửa tệp nào.
//
//   node scripts/quet-to-mo-coi.mjs           in danh sách (chạy ở gốc kho)
//   node scripts/quet-to-mo-coi.mjs --json    in JSON
//   node scripts/quet-to-mo-coi.mjs --xuat    thêm danh sách `export` chết hẳn
//   node scripts/quet-to-mo-coi.mjs --kiem    thoát mã 1 nếu còn tệp MỒ CÔI (dùng làm cổng)
//
// PHẠM VI XÉT XOÁ: src/**/*.{ts,tsx,css} và server/src/**/*.ts (tệp git theo dõi).
// NGƯỜI DÙNG = MỌI tệp git theo dõi ngoài phạm vi (tests, scripts, vite/vitest/wrangler/tsconfig, HTML kể cả src/**/xem-thu.html,
// functions/, .claude/m3-xem, docs có mã). *.md / *.txt chỉ là ghi chú, KHÔNG giữ tệp nguồn sống. Điểm vào trong phạm vi: src/main.tsx,
// src/sw.ts, server/src/index.ts, mọi *.d.ts. Cạnh của đồ thị có 3 độ mạnh:
//   3 vị trí mô-đun (import / export-from / import() / require / vi.mock / new URL(…, import.meta.url) / ?raw), <script src> và <link href>
//     của HTML, @import / url() của CSS, đường dẫn trong cấu hình (package.json, workflows, toml…)
//   2 chuỗi đường dẫn chính xác ('src/lib/x.ts', '../src/lib/x.ts') ở chỗ khác trong mã
//   1 tham chiếu yếu: tên tệp trần ('x.ts'), khớp đuôi đường dẫn, khuôn mẫu import động `./x/${a}.json`
// Nhận thừa còn hơn bỏ sót. Ba nhóm in ra:
//   1. MỒ CÔI — không có đường nào từ người dùng / điểm vào tới. Ứng viên xoá; VẪN PHẢI `grep -rn` tên tệp toàn kho + dựng + test.
//   2. CHỈ GIỮ BỞI THAM CHIẾU YẾU — soi tay.
//   3. CHỈ TEST/CÔNG CỤ DÙNG — không đi từ điểm vào gói app/Worker nào (không có mặt trong dist / gói Worker), nhưng có test, script
//      hay trang xem thử nhập. KHÔNG xoá nếu chưa xoá kèm test (luật: không xoá test) — việc của điều phối.
//   4. (--xuat) EXPORT CHẾT HẲN — soi tay trước khi gỡ: tên được .md/hợp đồng nhắc, tham số có § trong đặc tả, test khoá nguồn đọc chữ tệp,
//      và bộ đọc của một bộ ghi còn nằm trong gói (gỡ bộ đọc buộc gỡ bộ ghi ⇒ gói đổi) đều phải GIỮ.
// Chứng minh "không đổi hành vi" sau khi gỡ: npx tsc -b + tsc server; npm run build (đồng hồ ghim) so sha256 từng tệp dist; wrangler deploy
// --dry-run so sha256 index.js; vitest so TÊN test đỏ với nền. Gỡ mà gói đổi byte ⇒ hoàn lại phần đó.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { posix } from 'node:path'

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()) // chạy được từ thư mục con
const ts = createRequire(process.cwd() + '/package.json')('typescript')
const co = new Set(process.argv.slice(2))
const MANH = 3
const CHUOI = 2
const YEU = 1

const tep = execFileSync('git', ['ls-files', '-z'], { maxBuffer: 1 << 29 })
  .toString()
  .split('\0')
  .filter((p) => p && !/^(\.dist-old-|node_modules\/|\.claude\/worktrees\/|dist\/)/.test(p))
const tapHop = new Set(tep)
const NHI_PHAN = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|pdf|zip|tgz|gz|mobileconfig|docx|xlsx|pptx|mp4|mov|mp3|wav|ogg|glb|gltf|bin|wasm|data|avif|bmp)$/i
const trongPhamVi = (p) => /^src\/.*\.(ts|tsx|css)$/.test(p) || /^server\/src\/.*\.ts$/.test(p)
const duoi = (p) => (p.includes('.') ? p.slice(p.lastIndexOf('.') + 1).toLowerCase() : '')
const theoTen = new Map()
for (const p of tep) theoTen.set(posix.basename(p), [...(theoTen.get(posix.basename(p)) ?? []), p])

// ---- tham chiếu: tệp → Map<tệp đích, độ mạnh> ----
const DUOI_NGUON = /\.(ts|tsx|css|js|jsx|mjs|cjs|json|html|mts|cts)$/
function thuUng(goc) {
  const ra = []
  const thu = (q) => tapHop.has(q) && ra.push(q)
  thu(goc)
  for (const e of ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.css', '.json']) thu(goc + e)
  const m = goc.match(/^(.*)\.(js|jsx|mjs|cjs)$/)
  if (m) for (const e of ['.ts', '.tsx', '.mts', '.cts']) thu(m[1] + e)
  for (const e of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css']) thu(goc + '/index' + e)
  return ra
}
const gop = (ra, them) => {
  for (const [x, d] of them) ra.set(x, Math.max(ra.get(x) ?? 0, d))
  return ra
}
function chuoiThanh(tu, s, mm = CHUOI) {
  const ra = new Map()
  const dat = (a, m) => a.forEach((x) => ra.set(x, Math.max(ra.get(x) ?? 0, m)))
  const t = s.replace(/[?#].*$/, '').trim()
  if (!t || t.length > 300 || /^(https?:|data:|blob:|node:|mailto:|cloudflare:|virtual:|file:)/.test(t)) return ra
  const cd = posix.dirname(tu)
  if (t.startsWith('./') || t.startsWith('../')) {
    const g = posix.join(cd, t)
    if (!g.startsWith('..')) dat(thuUng(g), mm)
  } else if (t.startsWith('/')) {
    dat(thuUng(t.slice(1)), mm)
    dat(thuUng('public' + t), mm)
  } else if (t.includes('/') || DUOI_NGUON.test(t)) {
    const g = posix.normalize(t)
    if (!g.startsWith('..')) {
      dat(thuUng(g), g.includes('/') ? mm : YEU)
      dat(thuUng(posix.join(cd, g)), YEU)
      dat(thuUng(posix.join('server', g)), /^server\/.*\.(toml|json)$/.test(tu) ? mm : YEU) // wrangler.toml nằm ở server/
    }
    if (DUOI_NGUON.test(t)) for (const q of theoTen.get(posix.basename(t)) ?? []) if (q === t || q.endsWith('/' + t.replace(/^\.\//, ''))) ra.set(q, Math.max(ra.get(q) ?? 0, YEU))
  }
  return ra
}
function manhChuoi(tu, s, mm = CHUOI) {
  const ra = chuoiThanh(tu, s, mm)
  if (/[\s"'`=,;()[\]{}<>|&]/.test(s)) for (const m of s.split(/[\s"'`=,;()[\]{}<>|&]+/)) if (m && m !== s) gop(ra, chuoiThanh(tu, m, mm))
  return ra
}
const TEN_GOI = new Set(['mock', 'doMock', 'importActual', 'importMock', 'unmock', 'resolve', 'requireActual', 'requireMock'])
function laViTriModun(n) {
  const p = n.parent
  if (!p) return false
  if ((ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) && p.moduleSpecifier === n) return true
  if (ts.isExternalModuleReference(p)) return true
  if (ts.isLiteralTypeNode(p) && p.parent && ts.isImportTypeNode(p.parent)) return true
  if (ts.isCallExpression(p) && p.arguments[0] === n) {
    const e = p.expression
    if (e.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(e) && (e.text === 'require' || e.text === 'import'))) return true
    if (ts.isPropertyAccessExpression(e) && TEN_GOI.has(e.name.text)) return true
  }
  return ts.isNewExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 'URL' && p.arguments?.[0] === n
}
function trichJs(tu, text, loai) {
  const ra = new Map()
  const sf = ts.createSourceFile(tu, text, ts.ScriptTarget.Latest, true, loai)
  const thoat = (m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const duyet = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) gop(ra, manhChuoi(tu, n.text, laViTriModun(n) ? MANH : CHUOI))
    else if (ts.isTemplateExpression(n)) {
      // import động có biến: khuôn mẫu `./x/${a}.json` → mọi tệp khớp (nhận thừa)
      const m = [n.head.text, ...n.templateSpans.map((s) => s.literal.text)]
      const dau = m[0]
      if ((dau.length >= 2 || dau.includes('/')) && (dau.startsWith('.') || /^[\w@.-]+\//.test(dau)) && !/[<>\s]/.test(dau)) {
        const tuongDoi = dau.startsWith('./') || dau.startsWith('../')
        const g = tuongDoi ? posix.normalize(posix.join(posix.dirname(tu), dau)) : dau
        const re = new RegExp((tuongDoi ? '^' : '(?:^|/)') + [g, ...m.slice(1)].map(thoat).join('[^/]*') + '$')
        for (const q of tep) if (re.test(q)) ra.set(q, Math.max(ra.get(q) ?? 0, YEU))
      }
      for (const x of m) gop(ra, manhChuoi(tu, x))
    }
    ts.forEachChild(n, duyet)
  }
  duyet(sf)
  return ra
}
const kieuJs = (p) => (p.endsWith('.tsx') ? ts.ScriptKind.TSX : /\.(ts|mts|cts)$/.test(p) ? ts.ScriptKind.TS : p.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS)
const LA_JS = new Set(['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs'])
const LA_CAU_HINH = new Set(['json', 'toml', 'yml', 'yaml', 'sh', 'command', 'cmd', 'gs', 'conf', 'cfg', 'jsonc'])

const canh = new Map()
const vanBan = new Map()
for (const p of tep) {
  if (NHI_PHAN.test(p)) continue
  let text
  try {
    text = readFileSync(p, 'utf8')
  } catch {
    continue
  }
  vanBan.set(p, text)
  const d = duoi(p)
  let ra = new Map()
  if (LA_JS.has(d)) ra = trichJs(p, text, kieuJs(p))
  else if (d === 'html' || d === 'htm') {
    for (const m of text.matchAll(/(?:src|href|data-src|data-href|content|srcset|poster)\s*=\s*["']([^"']+)["']/gi)) gop(ra, manhChuoi(p, m[1], MANH))
    for (const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (m[1].trim()) gop(ra, trichJs(p + '#noi-tuyen.tsx', m[1], ts.ScriptKind.TSX))
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) gop(ra, manhChuoi(p, m[1] ?? m[2], MANH))
  } else if (d === 'css') {
    for (const m of text.matchAll(/@(?:import|source|config|plugin|reference|use|forward)\s+(?:url\()?\s*["']?([^"')\s;]+)|url\(\s*["']?([^"')]+)["']?\s*\)/gi)) gop(ra, manhChuoi(p, m[1] ?? m[2], MANH))
  } else if (LA_CAU_HINH.has(d)) for (const t of text.split(/[\s"'`=,;()[\]{}<>|&:]+/)) if (t) gop(ra, chuoiThanh(p, t, MANH))
  ra.delete(p)
  canh.set(p, ra)
}

const diemVao = new Set(['src/main.tsx', 'src/sw.ts', 'server/src/index.ts', ...tep.filter((p) => trongPhamVi(p) && p.endsWith('.d.ts'))])
const goc = new Set([...tep.filter((p) => !trongPhamVi(p) && !/\.(md|txt)$/.test(p)), ...diemVao])
function di(batDau, nguong) {
  const thay = new Set(batDau)
  const hang = [...batDau]
  while (hang.length) for (const [r, d] of canh.get(hang.pop()) ?? []) if (d >= nguong && !thay.has(r) && thay.add(r)) hang.push(r)
  return thay
}
const thayChuoi = di(goc, CHUOI)
const thayTatCa = di(goc, YEU)
// điểm vào của gói app / Worker / trang tĩnh (không tính tests, scripts, docs)
const vaoGoi = tep.filter((p) => /^(functions\/.*|public\/.*\.html|vite\.config\.ts|index\.html)$/.test(p)).concat('src/main.tsx', 'src/sw.ts', 'server/src/index.ts')
const thayGoi = di(new Set(vaoGoi), CHUOI)

const moCoi = []
const chiYeu = []
const chiTestCongCu = []
for (const p of tep.filter(trongPhamVi)) {
  if (diemVao.has(p)) continue
  if (!thayTatCa.has(p)) moCoi.push(p)
  else if (!thayChuoi.has(p)) chiYeu.push(p)
  else if (!thayGoi.has(p)) chiTestCongCu.push(p)
}

// ---- export chết hẳn: không tệp MÃ nào khác nhắc tới tên (ghi chú md/txt/log/json không tính), và trong tệp chỉ có dòng khai báo ----
function exportChet() {
  const chiMuc = new Map()
  for (const [p, t] of vanBan) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|html|htm|css|gs|sh|command|toml|ya?ml)$/.test(p)) continue
    const dem = new Map()
    for (const m of t.matchAll(/[A-Za-z_$][\w$]*/g)) dem.set(m[0], (dem.get(m[0]) ?? 0) + 1)
    for (const [k, v] of dem) chiMuc.set(k, (chiMuc.get(k) ?? new Map()).set(p, v))
  }
  const ra = []
  for (const p of tep) {
    if (!/^(src\/.*\.(ts|tsx)|server\/src\/.*\.ts)$/.test(p) || p.endsWith('.d.ts') || diemVao.has(p) || !vanBan.has(p)) continue
    const sf = ts.createSourceFile(p, vanBan.get(p), ts.ScriptTarget.Latest, true, kieuJs(p))
    for (const st of sf.statements) {
      const mod = st.modifiers ?? []
      if (!mod.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || mod.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) continue
      const ten = ts.isVariableStatement(st)
        ? st.declarationList.declarations.map((d) => (ts.isIdentifier(d.name) ? d.name.text : null))
        : st.name && (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isEnumDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st))
          ? [st.name.text]
          : []
      for (const t of ten) {
        const noi = t && chiMuc.get(t)
        if (noi && noi.size === 1 && noi.get(p) === 1) ra.push(`${p}:${sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1} ${t}`)
      }
    }
  }
  return ra
}

const ketQua = { moCoi, chiYeu, chiTestCongCu, ...(co.has('--xuat') ? { exportChet: exportChet() } : {}) }
if (co.has('--json')) console.log(JSON.stringify(ketQua, null, 1))
else {
  const dong = (p) => (vanBan.get(p) ?? '').split('\n').length
  const in_ = (tieuDe, ds) => {
    console.log(`\n${tieuDe}: ${ds.length}`)
    for (const p of ds) console.log(vanBan.has(p) ? `  ${p} (${dong(p)} dòng)` : `  ${p}`)
  }
  console.log(`Phạm vi: ${tep.filter(trongPhamVi).length} tệp (src/**/*.{ts,tsx,css}, server/src/**/*.ts); đọc ${vanBan.size} tệp văn bản.`)
  in_('1. MỒ CÔI (không ai trỏ tới)', moCoi)
  in_('2. CHỈ GIỮ BỞI THAM CHIẾU YẾU', chiYeu)
  in_('3. CHỈ TEST/CÔNG CỤ DÙNG (không vào gói app/Worker)', chiTestCongCu)
  if (ketQua.exportChet) in_('4. EXPORT CHẾT HẲN', ketQua.exportChet)
}
if (co.has('--kiem') && moCoi.length) process.exit(1)
