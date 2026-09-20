// SINH src/components/m3/m3-tuong-thich.css — lớp TƯƠNG THÍCH Material 3 cho các component độc lập của cổng
// học sinh / phụ huynh (việc C, Code 4).
//
// VÌ SAO: các component cũ vẽ bằng lớp màu Tailwind (bg-slate-50, text-amber-700, dark:bg-slate-900…) và có test
// khoá NGUYÊN chuỗi lớp. Viết lại ~1.250 chỗ dùng bằng tay vừa dễ lệch, vừa phải sửa test. Thay vào đó: mỗi lớp màu
// được ÁNH XẠ sang biến --m3-* của bang-nhiem-vu/m3-theme.css, CHỈ dưới phần tử gốc `.m3`. Tệp sinh KHÔNG phân lớp
// (@layer) nên thắng lớp tiện ích Tailwind; app giáo viên và game thần thú (không có `.m3`) không đổi một điểm ảnh.
//
// Dùng:  node scripts/sinh-m3-tuong-thich.mjs           → ghi tệp
//        node scripts/sinh-m3-tuong-thich.mjs --kiem    → thoát 1 nếu tệp trên đĩa khác bản sinh lại
// THÊM component vào phạm vi: thêm đường dẫn vào TEP bên dưới rồi chạy lại (test so bản sinh với bản đã commit).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// vitest nạp tệp này qua vite-node (import.meta.url không phải file:) → rơi về thư mục làm việc (gốc repo)
const GOC = (() => {
  try {
    return fileURLToPath(new URL('..', import.meta.url))
  } catch {
    return process.cwd() + '/'
  }
})()
const DICH = 'src/components/m3/m3-tuong-thich.css'

// CHỈ các tệp đã được 0.Planer duyệt vào phạm vi (nhóm B). Mỗi nhóm sau thêm tệp của nhóm đó.
export const TEP = [
  'src/components/LuyenDeChuan.tsx',
  'src/components/KhoiKhacPhuc3CheDo.tsx',
  'src/components/ModalKhacPhucCauSai.tsx',
  'src/components/KhoiCauSai.tsx',
  // nhóm C — báo cáo + tiến bộ (và các khối con nằm TRONG hai modal báo cáo)
  'src/components/BaoCaoCaThiHocSinhModal.tsx',
  'src/components/BaoCaoCaThiPhuHuynhModal.tsx',
  'src/components/BieuDoTienBoGoogle.tsx',
  'src/components/KhoiBaPhan.tsx',
  'src/components/DongDemCau.tsx',
  // nhóm A2 — vào thi (luồng thi thật)
  'src/components/PhongChoGame.tsx',
  // C8 — sheet Bảng tin (học sinh + phụ huynh)
  'src/components/BangTinPhuHuynh.tsx',
  // C9 — cổng phụ huynh: phần ngoài Bảng nhiệm vụ (đăng nhập, khung sheet toàn màn)
  'src/screens/ParentPortalScreen.tsx',
  // APP GIÁO VIÊN (G1 21/09): vỏ `.m3` bao cả app thầy nên các màn + khối dùng chung của thầy cũng đổi lớp màu Tailwind sang vai trò M3.
  // Màn của Code 1 (GoiLenBangScreen) chỉ được đổi MÀU qua bộ sinh này — không sửa một dòng của tệp ấy.
  'src/screens/ExamHubScreen.tsx',
  'src/screens/ExamSetupScreen.tsx',
  'src/screens/PhanCongScreen.tsx',
  'src/screens/HocSinhScreen.tsx',
  'src/screens/LichSuCaScreen.tsx',
  'src/screens/ExamMonitorScreen.tsx',
  'src/screens/NganHangDeScreen.tsx',
  'src/screens/CauHoiScreen.tsx',
  'src/screens/ClassListScreen.tsx',
  'src/screens/GoiLenBangScreen.tsx',
  'src/screens/CaiDatScreen.tsx',
  'src/components/BangTinGiaoVien.tsx',
  'src/components/HopChonDe.tsx',
  'src/components/KhoiMayChuMoi.tsx',
  'src/components/KhoiMatKhauApp.tsx',
  'src/components/NutQuayLai.tsx',
]

// ── họ màu Tailwind → vai trò M3 ────────────────────────────────────────────
const VAI_TRO = {
  slate: 'trung', gray: 'trung', zinc: 'trung', neutral: 'trung', stone: 'trung',
  blue: 'primary', indigo: 'primary', violet: 'primary', purple: 'primary', fuchsia: 'primary',
  sky: 'secondary', cyan: 'secondary', teal: 'secondary',
  emerald: 'tertiary', green: 'tertiary', lime: 'tertiary',
  rose: 'error', red: 'error', pink: 'error',
  // amber/yellow/orange mang nghĩa CẢNH BÁO / chú ý (0.Planer duyệt), KHÔNG phải primary
  amber: 'canhbao', yellow: 'canhbao', orange: 'canhbao',
}

const HO = Object.keys(VAI_TRO).join('|')
// (biến thể:)* tiện ích - màu [/độ mờ]
const RE = new RegExp(
  String.raw`(?<![\w:\[-])((?:(?:dark|hover|focus|active|disabled|group-hover):)*)((bg|text|border(?:-[trblxy])?|divide|ring|accent|from|via|to)-(white|black|transparent|(${HO})-(\d{2,3}))(?:/(\d+))?)(?![\w-])`,
  'g',
)

export function quetLop(noiDung) {
  const ra = new Map()
  for (const m of noiDung.matchAll(RE)) {
    const [, bienThe, tenLop, tienIchGoc, mau, ho, bac, doMo] = m
    const [tienIch, canh] = tienIchGoc.startsWith('border-') ? ['border', tienIchGoc.slice(7)] : [tienIchGoc, '']
    ra.set(bienThe + tenLop, { bienThe, tenLop, tienIch, canh, mau, ho: ho || null, bac: bac ? Number(bac) : null, doMo: doMo ? Number(doMo) : null })
  }
  return ra
}

// ── một lớp → biến M3 ───────────────────────────────────────────────────────
const V = (t) => `var(--m3-${t})`

function biMau(c) {
  // trả về giá trị màu (chuỗi) hoặc null nếu không ánh xạ
  const { tienIch, mau, ho, bac, doMo, bienThe } = c
  const toi = bienThe.startsWith('dark:')
  if (mau === 'transparent') return 'transparent'
  // màu điểm dừng gradient (from-/via-/to-) ánh xạ như nền
  if (tienIch === 'from' || tienIch === 'via' || tienIch === 'to') return biMau({ ...c, tienIch: 'bg' })
  const vt = ho ? VAI_TRO[ho] : 'trung'
  const b = bac ?? (mau === 'white' ? 0 : 1000) // white ~ 0, black ~ 1000

  if (tienIch === 'accent') return V('primary')
  if (tienIch === 'ring') return V('primary')

  if (tienIch === 'bg') {
    // màn che mờ: đen / slate rất tối + độ mờ thấp
    if (doMo !== null && doMo <= 60 && (mau === 'black' || (vt === 'trung' && b >= 800))) return V('man-che')
    if (vt === 'trung') {
      if (mau === 'black') return V('on-surface')
      if (toi) {
        if (b >= 950) return V('surface')
        if (b >= 900) return V('surface-container-lowest')
        if (b >= 800) return V('surface-container')
        if (b >= 700) return V('surface-container-high')
        if (b >= 500) return V('outline')
        return V('surface-container-high')
      }
      if (mau === 'white') return V('surface-container-lowest')
      if (b <= 50) return V('surface-container-low')
      if (b <= 100) return V('surface-container')
      if (b <= 300) return V('surface-container-high')
      if (b <= 600) return V('outline')
      return V('on-surface')
    }
    if (vt === 'canhbao') return b >= 400 && !(toi && b >= 700) ? V('tren-canh-bao') : V('canh-bao')
    // primary / secondary / tertiary / error
    if (toi) return b >= 500 && b <= 600 ? V(vt) : V(`${vt}-container`)
    return b <= 300 ? V(`${vt}-container`) : V(vt)
  }

  if (tienIch === 'text') {
    // `dark:text-white` = chữ trên MẶT PHẲNG tối (on-surface). `text-white` trần KHÔNG ánh xạ trần (nó còn nằm trên
    // gradient, ảnh…): chỉ cặp ghép `bg-<đặc>.text-white` bên dưới mới đổi sang on-*.
    if (mau === 'white') return toi ? V('on-surface') : null
    if (vt === 'trung') {
      if (mau === 'black') return V('on-surface')
      if (toi) return b <= 300 ? V('on-surface') : V('on-surface-variant')
      if (b <= 200) return V('on-primary')
      if (b <= 500) return V('on-surface-variant')
      return V('on-surface')
    }
    if (vt === 'canhbao') return V('tren-canh-bao')
    if (toi) return b <= 100 || b >= 800 ? V(`on-${vt}-container`) : V(vt)
    if (b <= 200) return V('on-primary')
    if (b >= 800) return V(`on-${vt}-container`)
    return V(vt)
  }

  if (tienIch === 'border' || tienIch === 'divide') {
    if (vt === 'trung') {
      if (mau === 'white') return 'transparent'
      if (toi) return b >= 600 && b < 700 ? V('outline') : V('surface-container-high')
      return b <= 200 ? V('surface-container-high') : V('outline')
    }
    if (vt === 'canhbao') return b >= 400 && !toi ? V('tren-canh-bao') : V('canh-bao')
    if (toi) return b >= 500 && b <= 600 ? V(vt) : V(`${vt}-container`)
    return b >= 400 ? V(vt) : V(`${vt}-container`)
  }
  return null
}

const esc = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch)

function luat(c) {
  const val = biMau(c)
  if (val === null) return null
  const goc = `.m3 .${esc(c.bienThe + c.tenLop)}`
  const gh = c.bienThe.includes('group-hover:') // `group-hover:text-…`: phần tử nằm trong `.group` đang được rê chuột
  const gia = gh ? '' : c.bienThe.includes('hover:') ? ':hover' : c.bienThe.includes('focus:') ? ':focus' : c.bienThe.includes('active:') ? ':active' : c.bienThe.includes('disabled:') ? ':disabled' : ''
  const chon = gh ? `.m3 .group:hover .${esc(c.bienThe + c.tenLop)}` : goc + gia
  switch (c.tienIch) {
    case 'bg': return `${chon} { background-color: ${val}; }`
    case 'text': return `${chon} { color: ${val}; }`
    case 'border': {
      const THUOC_TINH = { '': ['border-color'], t: ['border-top-color'], r: ['border-right-color'], b: ['border-bottom-color'], l: ['border-left-color'], x: ['border-left-color', 'border-right-color'], y: ['border-top-color', 'border-bottom-color'] }
      return `${chon} { ${THUOC_TINH[c.canh || ''].map((t) => `${t}: ${val};`).join(' ')} }`
    }
    case 'divide': return `.m3 .${esc(c.bienThe + c.tenLop)} > :not(:last-child) { border-color: ${val}; }`
    case 'ring': return `${chon} { --tw-ring-color: ${val}; }`
    case 'accent': return `${chon} { accent-color: ${val}; }`
    case 'from': return `${chon} { --tw-gradient-from: ${val}; }`
    case 'via': return `${chon} { --tw-gradient-via: ${val}; }`
    case 'to': return `${chon} { --tw-gradient-to: ${val}; }`
  }
  return null
}

export function sinh(doc = (p) => readFileSync(GOC + p, 'utf8')) {
  const tatCa = new Map()
  for (const p of TEP) for (const [k, v] of quetLop(doc(p))) tatCa.set(k, v)
  const sang = [], toi = []
  for (const c of [...tatCa.values()].sort((a, b) => (a.bienThe + a.tenLop).localeCompare(b.bienThe + b.tenLop))) {
    const r = luat(c)
    if (!r) continue
    // hover/focus đặt SAU luật thường để thắng cùng độ ưu tiên; dark trong @media riêng đặt cuối
    ;(c.bienThe.startsWith('dark:') ? toi : sang).push({ c, r })
  }
  // cặp ghép: nền đặc + text-white → chữ on-* tương ứng (sáng: trắng; tối: màu đậm trên nền sáng)
  const CAP = { primary: 'on-primary', secondary: 'on-primary', tertiary: 'on-primary', error: 'on-error', 'tren-canh-bao': 'canh-bao', 'on-surface': 'surface', outline: 'surface' }
  for (const c of [...tatCa.values()]) {
    if (c.tienIch !== 'bg' || c.bienThe !== '' || c.doMo !== null) continue
    const m = /^var\(--m3-([a-z-]+)\)$/.exec(biMau(c) || '')
    if (m && CAP[m[1]]) sang.push({ c: { bienThe: '', tenLop: c.tenLop + '.text-white', tienIch: 'ghep' }, r: `.m3 .${esc(c.tenLop)}.text-white { color: ${V(CAP[m[1]])}; }` })
  }
  // thứ tự: luật thường → viền theo CẠNH (phải đứng sau viền chung để thắng cùng độ ưu tiên) → biến thể hover/focus/active
  const thuTu = (a) => (a.c.bienThe.includes('hover:') || a.c.bienThe.includes('focus:') || a.c.bienThe.includes('active:') ? 2 : a.c.tienIch === 'border' && a.c.canh ? 1 : 0)
  sang.sort((a, b) => thuTu(a) - thuTu(b))
  toi.sort((a, b) => thuTu(a) - thuTu(b))
  return [
    '/* TỆP SINH TỰ ĐỘNG — sửa scripts/sinh-m3-tuong-thich.mjs, KHÔNG sửa tay tệp này.',
    ` * Phạm vi quét: ${TEP.map((t) => t.replace('src/components/', '')).join(', ')}.`,
    ' * Mọi bộ chọn đều mang tiền tố `.m3 ` (không có luật trần): app giáo viên, game thần thú và Bảng nhiệm vụ (.bnv)',
    ' * không bị chạm. Không phân lớp (@layer) nên thắng lớp tiện ích Tailwind. Màu chỉ là biến --m3-*. */',
    '',
    ...sang.map((x) => x.r),
    '',
    '@media (prefers-color-scheme: dark) {',
    ...toi.map((x) => '  ' + x.r),
    '}',
    '',
  ].join('\n')
}

// CLI
let laCli = false
try {
  laCli = !!process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
} catch {}
if (laCli) {
  const moi = sinh()
  if (process.argv.includes('--kiem')) {
    const cu = readFileSync(GOC + DICH, 'utf8')
    if (cu !== moi) {
      console.error(`❌ ${DICH} lệch bản sinh lại — chạy: node scripts/sinh-m3-tuong-thich.mjs`)
      process.exit(1)
    }
    console.log('✅ m3-tuong-thich.css khớp bản sinh lại')
  } else {
    writeFileSync(GOC + DICH, moi)
    console.log(`đã ghi ${DICH}: ${moi.split('\n').length} dòng`)
  }
}
