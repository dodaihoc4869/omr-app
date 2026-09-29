#!/usr/bin/env node
// MÔ PHỎNG KINH TẾ EXP v5 (THẦY ĐÃ CHỐT 29/09/2026, docs/DE-XUAT-EXP-V5-2909.md mục 7) — `npm run mo-phong:bang-gia-exp`.
// Chạy bằng CHÍNH hàm sản phẩm (src/lib/mo-phong-bang-gia-exp.ts). Thuần, không D1, không mạng.
// Sai bất biến (cày và chăm: cấp 10 ngày 21, cấp 120 ngày 1 200, khiên đầu ngày 36; chăm cấp 2 ≤ ngày 1, cấp 3 ≤ ngày 2) ⇒ thoát mã 1.
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
registerHooks({
  resolve(spec, ctx, next) {
    try { return next(spec, ctx) } catch (e) { if (spec.startsWith('.') && !/\.\w+$/.test(spec)) return next(`${spec}.ts`, ctx); throw e }
  },
})
const goc = join(dirname(fileURLToPath(import.meta.url)), '..')
const { HO_SO_MO_PHONG, chayMoPhong } = await import(pathToFileURL(join(goc, 'src/lib/mo-phong-bang-gia-exp.ts')).href)
const f = (x) => (x == null ? '>1300' : String(x))
console.log('KINH TẾ EXP v5 — không trần ngày, lên cấp cần đủ EXP VÀ đủ ngày đạt, EXP tràn đổi vàng + mảnh, khiên 36 mảnh + 2 600 vàng (1 300 ngày, không mua đồ)')
console.log('Hồ sơ'.padEnd(16) + 'EXP/ngày  cấp 10  cấp 120  khiên 1/2/3      vàng n7/21/36/100/365')
const kq = {}
for (const k of ['cay', 'cham', 'tb', 'yeu', 'quang']) {
  const r = chayMoPhong(HO_SO_MO_PHONG[k], 1300)
  kq[k] = r
  console.log(HO_SO_MO_PHONG[k].ten.padEnd(16) + `${String(Math.round(r.tbNgay)).padStart(8)}  ${f(r.cap[10]).padStart(6)}  ${f(r.cap[120]).padStart(7)}  ${[1, 2, 3].map((i) => f(r.khien[i])).join('/').padEnd(15)}  ${[7, 21, 36, 100, 365].map((n) => r.vangTichLuy[n]).join('/')}`)
}
const c = kq.cham, y = kq.cay
const dat = c.cap[10] === 21 && y.cap[10] >= 21 && Math.abs(c.cap[120] - 1200) <= 5 && y.cap[120] >= 1200 && c.khien[1] === 36 && y.khien[1] >= 36 && c.cap[2] <= 1 && c.cap[3] <= 2
if (!dat) {
  console.error(`SAI: chăm cấp 10 ngày ${c.cap[10]}, cấp 120 ngày ${c.cap[120]}, khiên đầu ngày ${c.khien[1]}; cày cấp 10 ngày ${y.cap[10]}, khiên đầu ngày ${y.khien[1]}`)
  process.exit(1)
}
console.log('ĐẠT: cày và chăm lên cấp 10 ngày 21, cấp 120 ngày 1 200, khiên đầu ngày 36; chăm lên cấp 2 ngày 1, cấp 3 ngày 2.')
