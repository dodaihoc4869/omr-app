// Gói bộ kiểm hồ sơ (src/lib/loi-giai-kiem.ts + bộ chìa khoá) thành MỘT tệp JS chạy thẳng bằng node trên máy thầy:
// scripts/loi-giai/kiem.bundle.mjs — máy soạn và các phiên soạn tự kiểm bằng ĐÚNG hàm máy chủ dùng lúc nhận hồ sơ.
// 05/10: gói thêm bộ kiểm HỌC LIỆU (server/src/may-soan-kiem.ts: bản khác, ý Đ–S mới, ghép hai lượt, tự xử cờ đáp án) — cùng hàm máy chủ dùng lúc nhận.
// Chạy lại khi sửa lõi, bộ chìa khoá hoặc may-soan-kiem:  node scripts/loi-giai/dung-kiem.mjs   (test may-soan-hoc-lieu-0510 bắt lệch)
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const RA_KIEM = path.join(GOC, 'scripts/loi-giai/kiem.bundle.mjs')

export async function dungKiem() {
  const r = await build({
    stdin: {
      contents: "export * from './src/lib/loi-giai-kiem'; export { BO_CHIA_KHOA } from './src/lib/loi-giai-bo'; export * from './server/src/may-soan-kiem'",
      resolveDir: GOC, loader: 'ts', sourcefile: 'kiem-vao.ts',
    },
    bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, legalComments: 'none', charset: 'utf8',
    banner: { js: '// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai/dung-kiem.mjs (nguồn src/lib/loi-giai-kiem.ts + loi-giai-bo.ts + server/src/may-soan-kiem.ts)' },
  })
  return r.outputFiles[0].text
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const js = await dungKiem()
  fs.writeFileSync(RA_KIEM, js)
  console.log('đã dựng', path.relative(GOC, RA_KIEM), Math.round(js.length / 1024), 'KB')
}
