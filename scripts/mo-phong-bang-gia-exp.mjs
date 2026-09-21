#!/usr/bin/env node
// MÔ PHỎNG BẢNG GIÁ EXP HỌC TẬP (Code 1, 21/09/2026; Điều 10) — in bảng "kiếm mỗi ngày → ngày tới cấp 10" cho ba kiểu em, bảng CŨ và MỚI. `npm run mo-phong:bang-gia-exp`.
// Thuần, không D1, không mạng. Sai bất biến (bảng mới không đưa cả ba kiểu em tới cấp 10 đúng ngày 21) ⇒ thoát mã 1.
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
registerHooks({
  resolve(spec, ctx, next) {
    try { return next(spec, ctx) } catch (e) { if (spec.startsWith('.') && !/\.\w+$/.test(spec)) return next(`${spec}.ts`, ctx); throw e }
  },
})
const goc = join(dirname(fileURLToPath(import.meta.url)), '..')
const { KIEU_EM, BANG_GIA_CU, BANG_GIA_MOI, expMotNgay, ngayToiCap } = await import(pathToFileURL(join(goc, 'src/lib/mo-phong-bang-gia-exp.ts')).href)
const dong = (t, c) => t.padEnd(32) + c
/** Trung bình một tuần ổn định (ngày 31…37, chuỗi đã tối đa): chặng đúng nhịp 5/7 số ngày. */
const tb = (k, b) => Math.round([31, 32, 33, 34, 35, 36, 37].reduce((s, d) => s + expMotNgay(k, b, d), 0) / 7)
console.log('BẢNG GIÁ EXP HỌC TẬP — em đạt mọi ngày; thú hấp thụ tối đa 200 EXP/ngày; cấp 10 = 4 200 EXP ⇒ sớm nhất ngày 21')
console.log(dong('Kiểu em', 'Bảng cũ: kiếm/ngày (ổn định) → ngày tới cấp 10      Bảng mới: kiếm/ngày → ngày tới cấp 10'))
let loi = 0
for (const k of KIEU_EM) {
  const cu = ngayToiCap(k, BANG_GIA_CU), moi = ngayToiCap(k, BANG_GIA_MOI)
  console.log(dong(k.ten, `${String(tb(k, BANG_GIA_CU)).padStart(4)} EXP → ngày ${String(cu).padEnd(3)}                          ${String(tb(k, BANG_GIA_MOI)).padStart(4)} EXP → ngày ${moi}`))
  if (moi !== 21) loi++
}
if (loi) { console.error(`SAI: bảng MỚI không đưa ${loi} kiểu em tới cấp 10 đúng ngày 21`); process.exit(1) }
console.log('ĐẠT: bảng mới — chăm là đủ (cả ba kiểu em tới cấp 10 đúng ngày 21).')
