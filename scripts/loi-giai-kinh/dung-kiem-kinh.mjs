// Gói bộ kiểm Lời giải Kính (src/lib/loi-giai-kinh/kiem.ts + kiemCong của máy chủ + bảng thần chú) thành MỘT tệp node chạy được trong thư mục lô.
// Chạy lại khi sửa bộ kiểm:  node scripts/loi-giai-kinh/dung-kiem-kinh.mjs
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const RA = path.join(GOC, 'scripts/loi-giai-kinh/kiem-kinh.bundle.mjs')
export async function dungKiemKinh() {
  const r = await build({
    stdin: { contents: "export * from './src/lib/loi-giai-kinh/kiem'; export { kiemCong } from './server/src/so-do-cong'; export { THAN_CHU } from './server/src/kinh-than-chu'", resolveDir: GOC, loader: 'ts', sourcefile: 'kiem-kinh-vao.ts' },
    bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, legalComments: 'none', charset: 'utf8',
    banner: { js: '/* eslint-disable */\n// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai-kinh/dung-kiem-kinh.mjs' },
  })
  return r.outputFiles[0].text
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const js = await dungKiemKinh(); fs.writeFileSync(RA, js); console.log('đã dựng', path.relative(GOC, RA), Math.round(js.length / 1024), 'KB') }
