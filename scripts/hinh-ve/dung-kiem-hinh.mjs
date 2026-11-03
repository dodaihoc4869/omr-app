// Gói bộ kiểm hình vẽ lại (src/lib/hinh-ve/kieu.ts) thành MỘT tệp node chạy được trong thư mục lô. Dựng lại khi sửa bộ kiểm: node scripts/hinh-ve/dung-kiem-hinh.mjs
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const RA = path.join(GOC, 'scripts/hinh-ve/kiem-hinh.bundle.mjs')
export async function dungKiemHinh() {
  const r = await build({ stdin: { contents: "export * from './src/lib/hinh-ve/kieu'; export * from './src/lib/hinh-ve/chi-so'", resolveDir: GOC, loader: 'ts', sourcefile: 'kiem-hinh-vao.ts' },
    bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, legalComments: 'none', charset: 'utf8',
    banner: { js: '/* eslint-disable */\n// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/hinh-ve/dung-kiem-hinh.mjs' } })
  return r.outputFiles[0].text
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const js = await dungKiemHinh(); fs.writeFileSync(RA, js); console.log('đã dựng', path.relative(GOC, RA), Math.round(js.length / 1024), 'KB') }
