// VIDEO BÀI GIẢNG — chép BỘ MÁY BÚT của live (`JS_LOI_BUT`, src/lib/but-bang-loi.ts — chuỗi ES5 mà tờ chiếu chạy) ra public/video-bai/loi-but.js để
// video + trang xem dựng nét Y HỆT bảng live (thầy 14/11 «làm thật mượt như live»). Một nguồn: sửa bút ở src/lib rồi chạy lại lệnh này; test
// tests/video-bai-loi-but-1411.test.ts báo đỏ nếu bản chép lệch nguồn. Dùng: npx jiti scripts/video-bai-giang/xuat-loi-but.ts
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JS_LOI_BUT } from '../../src/lib/but-bang-loi'

export const DAU_LOI_BUT = '/* eslint-disable */ // TỆP SINH TỰ ĐỘNG từ src/lib/but-bang-loi.ts (JS_LOI_BUT) bằng scripts/video-bai-giang/xuat-loi-but.ts — KHÔNG sửa tay.\n'
const goc = join(dirname(fileURLToPath(import.meta.url)), '../..')
writeFileSync(join(goc, 'public/video-bai/loi-but.js'), DAU_LOI_BUT + JS_LOI_BUT.trim() + '\n')
console.log('đã chép public/video-bai/loi-but.js')
