// Rà từng câu kho đề: áp luật sửa TRÌNH BÀY, ghi đề xuất + danh sách cần thầy xem.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { nhanTruocMuiTenVeSau, tachDongSoDo } from '/home/user/omr-app/.claude/worktrees/agent-a79222f3cef4cfca0/src/lib/chem-format-so-do'

const D = '/tmp/claude-0/-home-user-omr-app/372d898c-b8fd-5f51-b347-5c27b972161c/scratchpad/hienthi'
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const NGUYEN_TO = new Set(
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Ag Cd Sn Sb I Xe Cs Ba Au Hg Pb Pt'.split(' '),
)

type Luat = { ma: string; ten: string; chiDe?: boolean; f: (s: string) => string }

function chiSoAscii(s: string): string {
  return s.replace(/(?<![A-Za-z0-9_₀-₉])\(?(?:[A-Z][a-z]?\d*)+(?:\)\d+(?:[A-Z][a-z]?\d*)*)?/g, (m) => {
    const soChiSo = (m.match(/[A-Za-z)]\d+/g) ?? []).length
    if (soChiSo < 2) return m
    const kyHieu = m.match(/[A-Z][a-z]?/g) ?? []
    if (!kyHieu.every((k) => NGUYEN_TO.has(k))) return m
    return m.replace(/([A-Za-z)])(\d+)/g, (_x, a: string, so: string) => a + [...so].map((c) => SUB[c]).join(''))
  })
}

function nSauNgoac(s: string): string {
  return s.replace(/([)\]])n(?=[\s,.;+)]|$)/g, (m, dong: string, viTri: number) => {
    const mo = dong === ')' ? '(' : '['
    let sau = 0
    for (let j = viTri; j >= 0; j--) {
      if (s[j] === dong) sau++
      else if (s[j] === mo) {
        sau--
        if (sau === 0) return /[A-Z]/.test(s.slice(j, viTri)) ? `${dong}ₙ` : m
      }
    }
    return m
  })
}

const LUAT: Luat[] = [
  { ma: 'ky-tu-la', ten: 'Ký tự lạ/khoảng trắng đặc biệt', f: (s) => s.replace(/[ \t]/g, ' ').replace(/[​-‍﻿\r]/g, '') },
  { ma: 'nhan-ngoac-kep', ten: 'Số hiệu mũi tên bị bọc hai lớp ngoặc "→((1))"', f: (s) => s.replace(/([→←⇌])\(\((\d{1,2})\)\)/g, '$1($2)') },
  {
    ma: 'nhan-mu-truoc-mui',
    ten: 'Điều kiện gõ bằng chữ mũ trước mũi tên "⁺O²,t°,xt→" — đưa lên mũi tên, chữ thường',
    f: (s) =>
      s.replace(/(?<=\s)(⁺[^\s→⇌]*)(→|⇌)[ \t]*/g, (_m, nhan: string, mui: string) => {
        const doi: Record<string, string> = { '⁺': '+', '²': '₂', '³': '₃', '⁴': '₄' }
        const n = [...nhan].map((c) => doi[c] ?? c).join('').replace(/(?<=\S)\+/g, ', +').replace(/,(?=\S)/g, ', ').replace(/, ,/g, ',')
        return `${mui}(${n}) `
      }),
  },
  { ma: 'nhan-truoc-mui', ten: 'Số hiệu/điều kiện đặt TRƯỚC mũi tên ("(1) →", "⁽¹⁾→", "t°→", "—(xt)→") — đưa lên trên mũi tên', f: (s) => nhanTruocMuiTenVeSau(s).replace(/ {2,}/g, ' ').replace(/ +\n/g, '\n').replace(/ +$/, '') },
  {
    ma: 'nhan-ngoac-hong',
    ten: 'Ngoặc trong điều kiện mũi tên bị đảo',
    f: (s) => s.replace(/\(\+\[Ag\(NH₃\)₂\)OH\]\[t°\]/g, '(+[Ag(NH₃)₂]OH)[t°]').replace(/\(\+\[Ag\(NH₃\)₂\)OH, t°\]/g, '(+[Ag(NH₃)₂]OH, t°)'),
  },
  { ma: 'mui-lap', ten: 'Mũi tên thuận nghịch bị viết lặp quanh điều kiện', f: (s) => s.replace(/⇌ \(\+OH⁻ \/ \+H⁺\) ⇌/g, '⇌(+OH⁻)[+H⁺]') },
  { ma: 'n-sau-ngoac', ten: 'Chỉ số n của polymer viết thường "]n" → "]ₙ"', f: nSauNgoac },
  { ma: 'chi-so-ascii', ten: 'Công thức gõ số thường "C17H35COO" → chỉ số dưới', f: chiSoAscii },
  { ma: 'chi-so-roi', ten: 'Chỉ số tách rời "-CH 2 -"', f: (s) => s.replace(/-CH 2 -/g, '-CH₂-') },
  { ma: 'lien-ket-cach', ten: 'Liên kết viết có dấu cách "(C = O)"', f: (s) => s.replace(/\(([A-Z]) ([=-]) ([A-Z])\)/g, '($1$2$3)') },
  { ma: 'don-vi-ml', ten: 'Đơn vị "ml" → "mL" (chuẩn SGK)', f: (s) => s.replace(/(\d ?|\b)ml\b/g, '$1mL') },
  { ma: 'cach-truoc-dau', ten: 'Dấu cách thừa trước dấu chấm/phẩy', f: (s) => s.replace(/(?<=[^\s\d.…]) +([.,;])(?=\s|$)/g, '$1') },
  {
    ma: 'so-hieu-cuoi-dong',
    ten: 'Số hiệu phương trình rơi xuống cuối dòng trên',
    chiDe: true,
    // Dòng "(k) … (k+1)" rồi xuống dòng: số hiệu (k+1) thuộc về dòng SAU. Chỉ nhận
    // đúng dãy liên tiếp — "Hình (1)\nHình (2)" hay "… 2NH₃(g) (1)" (số hiệu phương
    // trình đặt bên phải) giữ nguyên.
    f: (s) => {
      const dong = s.split('\n')
      for (let i = 0; i + 1 < dong.length; i++) {
        const dau = /^\((\d{1,2})\)\s/.exec(dong[i])
        const cuoi = / \((\d{1,2})\)$/.exec(dong[i])
        if (!dau || !cuoi || Number(cuoi[1]) !== Number(dau[1]) + 1 || /^\(/.test(dong[i + 1])) continue
        dong[i] = dong[i].slice(0, cuoi.index)
        dong[i + 1] = `(${cuoi[1]}) ${dong[i + 1]}`
      }
      return dong.join('\n')
    },
  },
  {
    ma: 'tach-dong-so-do',
    ten: 'Sơ đồ/phương trình dính vào câu chữ — xuống dòng',
    chiDe: true,
    f: (s) =>
      tachDongSoDo(s)
        .map((k) => k.v)
        .join('\n'),
  },
]

/** Liệt kê "(1) … (2) …" / "(a) … (b) …" dính trên một dòng → mỗi mục một dòng.
 * Chỉ nhận dãy mục LIÊN TIẾP từ 1 (hoặc a), mục đầu ở đầu dòng hoặc sau dấu ":",
 * mục sau đứng sau dấu , ; . hoặc dính ngay sau công thức / sau phương trình. */
function tachLietKe(s: string): string {
  return s
    .split('\n')
    .map((dong) => {
      const re = /\((\d{1,2}|[a-h])\)\s/g
      const ms: { i: number; k: string }[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(dong)) !== null) ms.push({ i: m.index, k: m[1] })
      if (ms.length < 2) return dong
      const laSo = /\d/.test(ms[0].k)
      const ten = (n: number) => (laSo ? String(n + 1) : String.fromCharCode(97 + n))
      // Tìm dãy liên tiếp bắt đầu từ mục 1/a
      const bd = ms.findIndex((x) => x.k === ten(0))
      if (bd < 0) return dong
      const day = [ms[bd]]
      for (let j = bd + 1; j < ms.length && ms[j].k === ten(day.length); j++) day.push(ms[j])
      if (day.length < 2) return dong
      const truocDau = dong.slice(0, day[0].i)
      if (truocDau.trim() !== '' && !/:\s*$/.test(truocDau)) return dong
      for (let j = 1; j < day.length; j++) {
        const doan = dong.slice(day[j - 1].i, day[j].i)
        const hop = /[,;.]\s*$/.test(doan) || /[A-Za-z₀-₉⁺⁻)°]$/.test(doan) || (/[→⇌←]/.test(doan) && /\s$/.test(doan))
        if (!hop) return dong
      }
      let ra = ''
      let tu = 0
      for (let j = 0; j < day.length; j++) {
        if (j === 0 && truocDau.trim() === '') continue
        ra += dong.slice(tu, day[j].i).replace(/\s+$/, '') + '\n'
        tu = day[j].i
      }
      return ra + dong.slice(tu)
    })
    .join('\n')
}
LUAT.splice(LUAT.length - 1, 0, { ma: 'liet-ke-dinh', ten: 'Các mục (1) (2)… / (a) (b)… dính trên một dòng — mỗi mục một dòng', chiDe: true, f: tachLietKe })

function* truong(c: Record<string, unknown>): Generator<[string, string]> {
  yield ['de', String(c.de ?? '')]
  for (const [k, v] of Object.entries((c.pa as Record<string, string>) ?? {})) yield [`pa.${k}`, String(v ?? '')]
  for (const [k, v] of Object.entries((c.y as Record<string, string>) ?? {})) yield [`y.${k}`, String(v ?? '')]
  const lg = c.loi_giai as Record<string, unknown> | null
  if (lg && typeof lg === 'object') {
    if (typeof lg.chot === 'string') yield ['loi_giai.chot', lg.chot]
  }
  if (lg && Array.isArray(lg.buoc)) for (let i = 0; i < lg.buoc.length; i++) if (typeof lg.buoc[i] === 'string') yield [`loi_giai.buoc.${i}`, lg.buoc[i] as string]
  if (lg && typeof lg.ket_qua === 'string') yield ['loi_giai.ket_qua', lg.ket_qua]
}

function ngoacLech(s: string): string | null {
  const bo = s
  for (const [a, b] of [
    ['(', ')'],
    ['[', ']'],
  ]) {
    let sau = 0
    for (let i = 0; i < bo.length; i++) {
      const ch = bo[i]
      if (ch === a) sau++
      else if (ch === b) {
        // "a)", "1)", "c)" liệt kê: dấu đóng không có dấu mở, đứng sau 1–2 ký tự đầu từ.
        if (sau === 0 && b === ')' && /(^|[\s;,(\-–|])[a-zA-Z0-9]{1,2}$/.test(bo.slice(Math.max(0, i - 3), i))) continue
        sau--
      }
      if (sau < 0) return `thừa "${b}"`
    }
    if (sau > 0) return `thiếu "${b}"`
  }
  return null
}

const sua: Record<string, unknown>[] = []
const canXem: Record<string, unknown>[] = []
const demLoai: Record<string, { cau: Set<string>; truong: number }> = {}
let soCau = 0
let soTruong = 0
const tep = readdirSync(`${D}/kho`).filter((f) => f.endsWith('.json')).sort()
for (const f of tep) {
  const g = JSON.parse(readFileSync(`${D}/kho/${f}`, 'utf8'))
  const maDe = String(g.ma_de)
  for (const c of g.cau as Record<string, unknown>[]) {
    soCau++
    const qid = `${maDe}-${String(c.phan).toUpperCase()}-${c.so}`
    for (const [ten, goc] of truong(c)) {
      if (!goc) continue
      soTruong++
      let s = goc
      const loai: string[] = []
      for (const l of LUAT) {
        if (l.chiDe && ten !== 'de') continue
        const moi = l.f(s)
        if (moi !== s) {
          loai.push(l.ma)
          s = moi
        }
      }
      if (s !== goc) {
        sua.push({ qid, maDe, phan: c.phan, so: c.so, truong: ten, truoc: goc, sau: s, lyDo: loai.map((m) => LUAT.find((l) => l.ma === m)!.ten).join('; '), loai })
        for (const m of loai) {
          demLoai[m] ??= { cau: new Set(), truong: 0 }
          demLoai[m].cau.add(qid)
          demLoai[m].truong++
        }
      }
      const lech = ngoacLech(s)
      if (lech) canXem.push({ qid, maDe, truong: ten, van: s.slice(0, 300), lyDo: `Ngoặc lệch (${lech}) — không tự đoán được chỗ đúng` })
      if (ten === 'de' && /( \| .*){3,}/.test(s)) canXem.push({ qid, maDe, truong: ten, van: s.slice(0, 300), lyDo: 'Bảng bị dàn thành chữ có dấu | — nên nhập lại thành bảng (trường bang) hoặc ảnh' })
      else if (ten === 'de' && /(?:[–-]?\d+,\d+ ){3,}/.test(s)) canXem.push({ qid, maDe, truong: ten, van: s.slice(0, 300), lyDo: 'Dãy số liệu của một bảng bị dàn thành chữ — nên nhập lại thành bảng' })
      if (/[A-Za-z₀-₉][²³⁴⁵¹][A-Za-z]{1,3}[a-z][⁰-⁹²³¹]/.test(s) && !/s[²¹]np/.test(s)) canXem.push({ qid, maDe, truong: ten, van: s.slice(0, 300), lyDo: 'Điều kiện phản ứng bị vỡ chữ khi chép từ PDF (vd "O₂V²tOo⁵2SO₃") — cần gõ lại' })
      if (ten.startsWith('pa.') && /(^|\s)[A-D]\.\s/.test(s)) canXem.push({ qid, maDe, truong: ten, van: s, lyDo: 'Phương án có vẻ chứa phương án khác' })
    }
    if (String(c.phan) === 'I' && (!c.pa || Object.keys(c.pa as object).length < 4) && !c.hinh) {
      canXem.push({ qid, maDe, truong: 'pa', van: String(c.de ?? '').slice(0, 200), lyDo: 'Câu phần I thiếu phương án chữ (có thể là ảnh hoặc dính vào đề)' })
    }
  }
}
writeFileSync(`${D}/sua-tung-cau.json`, JSON.stringify(sua, null, 1))
writeFileSync(`${D}/can-xem.json`, JSON.stringify(canXem, null, 1))
const tom = {
  soTo: tep.length,
  soCau,
  soTruong,
  soMucSua: sua.length,
  soCauSua: new Set(sua.map((x) => x.qid)).size,
  soToSua: new Set(sua.map((x) => x.maDe)).size,
  theoLoai: Object.fromEntries(Object.entries(demLoai).map(([k, v]) => [k, { cau: v.cau.size, truong: v.truong }])),
  canXem: canXem.length,
  canXemTheoLyDo: canXem.reduce((a: Record<string, number>, x) => ((a[String(x.lyDo).split(' (')[0].split(' —')[0]] = (a[String(x.lyDo).split(' (')[0].split(' —')[0]] ?? 0) + 1), a), {}),
}
writeFileSync(`${D}/tom-tat.json`, JSON.stringify(tom, null, 1))
console.log(JSON.stringify(tom, null, 1))
