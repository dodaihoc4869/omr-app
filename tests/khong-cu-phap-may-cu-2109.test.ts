// CHỐT CHẶN "MÁY HỌC SINH CŨ" (Boss P0, 21/09/2026): iPhone cũ (iOS < 16.4 — 6s/7/SE đời đầu kẹt ở iOS 15) NÉM SyntaxError ngay khi nạp một mô-đun có regex nhìn-lùi (lookbehind) ⇒ cả cổng học sinh / phụ huynh
// chết ("App chưa mở xong… Thử nạp bản mới"). Ca thật: `cau-tu-luan.ts` (2c102e1) + `bo-nao-khuon.ts` (6fe92d0). Test này quét MỌI tệp `src/**/*.{ts,tsx}` và cấm:
//   • regex nhìn-lùi;  • gọi TRẦN các API mới: `.at(`, `structuredClone(`, `Object.hasOwn(`, `.findLast(`, `.findLastIndex(`, `.toSorted(`, `.toReversed(`, `.toSpliced(`, `AbortSignal.timeout(`;
//   • `crypto.randomUUID()` mà tệp không có nhánh dự phòng (`typeof … .randomUUID === 'function'` hoặc `'randomUUID' in …`) — dùng `sinhMaNgauNhien` ở `lib/thiet-bi.ts`.
// Cần dùng thật thì viết bản có dự phòng (`x[x.length - 1]`, `JSON.parse(JSON.stringify(x))`, `[...x].sort()`…).
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const GOC = join(process.cwd(), 'src')
const LOOKBEHIND = /\(\?<[=!]/
const API_MOI: [RegExp, string][] = [
  [/\.at\(/, '.at('],
  [/\bstructuredClone\(/, 'structuredClone('],
  [/\bObject\.hasOwn\(/, 'Object.hasOwn('],
  [/\.findLast\(/, '.findLast('],
  [/\.findLastIndex\(/, '.findLastIndex('],
  [/\.toSorted\(/, '.toSorted('],
  [/\.toReversed\(/, '.toReversed('],
  [/\.toSpliced\(/, '.toSpliced('],
  [/\bAbortSignal\.timeout\(/, 'AbortSignal.timeout('],
]
const CO_DU_PHONG_UUID = /randomUUID\s*===\s*['"]function['"]|['"]randomUUID['"]\s+in\s+/

/** Các vi phạm trong MỘT tệp (đưa chuỗi vào để tự kiểm được). Dòng chú thích thuần (`//`, `*`, `/*`) không tính. */
export function tim(chu: string): string[] {
  const ra: string[] = []
  const coDuPhong = CO_DU_PHONG_UUID.test(chu)
  chu.split('\n').forEach((d, i) => {
    const t = d.trimStart()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return
    if (LOOKBEHIND.test(d)) ra.push(`dòng ${i + 1}: regex nhìn-lùi (?<= / (?<!`)
    for (const [re, ten] of API_MOI) if (re.test(d)) ra.push(`dòng ${i + 1}: gọi trần ${ten}`)
    if (/\bcrypto\.randomUUID\(\)/.test(d) && !coDuPhong) ra.push(`dòng ${i + 1}: crypto.randomUUID() trần, tệp không có nhánh dự phòng`)
  })
  return ra
}

function tepMa(thuMuc: string): string[] {
  return readdirSync(thuMuc).flatMap((ten) => {
    const p = join(thuMuc, ten)
    if (ten === 'graphify-out' || ten === 'node_modules') return []
    return statSync(p).isDirectory() ? tepMa(p) : /\.(ts|tsx)$/.test(ten) ? [p] : []
  })
}

describe('không dùng cú pháp / API mà iPhone cũ (iOS 14–15) không chạy được', () => {
  it('TỰ KIỂM bộ quét: bắt đúng từng kiểu, không bắt bản có dự phòng', () => {
    for (const x of ['const r = /(?<![a-z])x/u', 'const r = /(?<=a)b/', 'a.at(-1)', 'structuredClone(o)', 'Object.hasOwn(o, "k")', 'a.findLast((x) => x)', 'a.toSorted()', 'AbortSignal.timeout(5000)', 'const id = crypto.randomUUID()'])
      expect(tim(x), x).toHaveLength(1)
    for (const x of ['const r = /(^|[^a-z])x(?![a-z])/u', 'a[a.length - 1]', 'JSON.parse(JSON.stringify(o))', '// (?<!x) chỉ là chú thích', ' * dùng .at(-1) trong ví dụ', "const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'x'", "if ('randomUUID' in crypto) return crypto.randomUUID()", 'a.attr(x)', 'format(x)'])
      expect(tim(x), x).toEqual([])
  })

  it('MỌI tệp src/**/*.{ts,tsx} (trừ graphify-out): 0 vi phạm', () => {
    const vp = tepMa(GOC).flatMap((p) => tim(readFileSync(p, 'utf8')).map((m) => `${relative(process.cwd(), p)} ${m}`))
    expect(vp, vp.join('\n')).toEqual([])
  })
})
