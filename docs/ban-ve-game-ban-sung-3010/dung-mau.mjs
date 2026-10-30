// DỰNG mau.html (bản vẽ chạy được của «Đấu Nguyên Tử») từ mau-nguon.tsx bằng esbuild: một tệp HTML tự đủ (JS + CSS + phông nhúng), mở thẳng bằng trình duyệt.
// Chạy: node docs/ban-ve-game-ban-sung-3010/dung-mau.mjs
import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DAY = import.meta.dirname
const goc = resolve(DAY, '../..')
const stub = {
  name: 'may-chu-mau',
  setup(b) {
    b.onResolve({ filter: /lib\/may-chu-moi$/ }, () => ({ path: 'may-chu-mau', namespace: 'mau' }))
    b.onLoad({ filter: /.*/, namespace: 'mau' }, () => ({ contents: "export async function layCauHinhMayChu() { return { BAT: true, URL: 'https://may-chu.mau' } }", loader: 'js' }))
  },
}
const r = await build({
  entryPoints: [resolve(DAY, 'mau-nguon.tsx')], absWorkingDir: goc, bundle: true, format: 'iife', minify: true, write: false, outdir: resolve(DAY, 'tam'),
  jsx: 'automatic', target: 'es2020', legalComments: 'none', logLevel: 'warning',
  loader: { '.woff2': 'dataurl', '.woff': 'base64', '.svg': 'dataurl', '.png': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production"}', __PHIEN_BAN__: '"mau"', __SW_BUILT_AT__: '0' },
  plugins: [stub],
})
const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text
const css = (r.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '').replace(/@font-face\{[^}]*\.woff\)[^}]*\}/g, '')
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Bản vẽ Đấu Nguyên Tử — game phòng chờ (30/10/2026)</title>
<style>${css}
html,body{margin:0;min-height:100%}body{background:var(--pc-page,var(--nen));font-family:var(--sans)}#goc{display:flex;justify-content:center;padding:8px 0 24px}</style></head>
<body><div id="goc"></div><script>${js.replace(/<\/script/g, '<\\/script')}</script></body></html>`
writeFileSync(resolve(DAY, 'mau.html'), html)
console.log(`mau.html: ${(html.length / 1024).toFixed(0)} KB`)
