// Gói bộ kiểm hồ sơ (src/lib/loi-giai-kiem.ts + bộ chìa khoá) thành MỘT tệp JS chạy thẳng bằng node trên máy thầy:
// scripts/loi-giai/kiem.bundle.mjs — máy soạn và các phiên soạn tự kiểm bằng ĐÚNG hàm máy chủ dùng lúc nhận hồ sơ.
// Chạy lại khi sửa lõi hoặc bộ chìa khoá:  node scripts/loi-giai/dung-kiem.mjs   (test loi-giai-kiem-2909 bắt lệch)
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const RA_KIEM = path.join(GOC, 'scripts/loi-giai/kiem.bundle.mjs')

export async function dungKiem() {
  const r = await build({
    stdin: {
      contents: "export * from './src/lib/loi-giai-kiem'; export { BO_CHIA_KHOA } from './src/lib/loi-giai-bo'",
      resolveDir: GOC, loader: 'ts', sourcefile: 'kiem-vao.ts',
    },
    bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, legalComments: 'none', charset: 'utf8',
    banner: { js: '// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai/dung-kiem.mjs (nguồn src/lib/loi-giai-kiem.ts + loi-giai-bo.ts)' },
  })
  return r.outputFiles[0].text
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const js = await dungKiem()
  fs.writeFileSync(RA_KIEM, js)
  console.log('đã dựng', path.relative(GOC, RA_KIEM), Math.round(js.length / 1024), 'KB')
}
