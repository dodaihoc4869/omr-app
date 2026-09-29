#!/usr/bin/env node
// MÔ PHỎNG KINH TẾ EXP v4 (thầy chốt 29/09/2026, docs/DE-XUAT-EXP-2909.md mục 4) — `npm run mo-phong:bang-gia-exp`.
// Chạy bằng CHÍNH hàm sản phẩm (src/lib/mo-phong-bang-gia-exp.ts). Thuần, không D1, không mạng.
// Sai bất biến (em chăm nhất: ngày 20 còn cấp 9, ngày 21 lên cấp 10, khiên đầu ngày 21) ⇒ thoát mã 1.
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
const f = (x) => (x == null ? '>60' : String(x))
console.log('KINH TẾ EXP v4 — nạp tự do, khoá mốc cấp 10 cần 21 ngày đạt, 1 vàng / 5 EXP, khiên 21 mảnh + 21 ngày đạt + 1 400 vàng (60 ngày, không mua đồ)')
console.log('Hồ sơ'.padEnd(14) + 'EXP/ngày  cấp 5  cấp 10  khiên đầu  vàng n7/14/21/30')
for (const k of ['cham', 'tb', 'yeu']) {
  const r = chayMoPhong(HO_SO_MO_PHONG[k], 60)
  console.log(HO_SO_MO_PHONG[k].ten.padEnd(14) + `${String(Math.round(r.tbNgay)).padStart(8)}  ${f(r.cap[5]).padStart(5)}  ngày ${f(r.cap[10]).padEnd(3)} ngày ${f(r.khienDau).padEnd(5)} ${[7, 14, 21, 30].map((n) => r.vangTichLuy[n]).join('/')}`)
}
const c = chayMoPhong(HO_SO_MO_PHONG.cham, 60)
if (!(c.capNgay[20] === 9 && c.cap[10] === 21 && c.khienDau === 21)) {
  console.error(`SAI: em chăm nhất ngày 20 cấp ${c.capNgay[20]}, cấp 10 ngày ${c.cap[10]}, khiên đầu ngày ${c.khienDau} (cần 9 · 21 · 21)`)
  process.exit(1)
}
console.log('ĐẠT: em chăm nhất ngày 20 cấp 9, ngày 21 lên cấp 10, khiên đầu ngày 21.')
