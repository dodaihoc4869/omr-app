// @vitest-environment node
// Kiểm vòng lặp CLI thật; nhà soạn giả cố ý trả JSON không đạt, không dùng LLM/D1 thật.
import { it, expect } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
async function chay(args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'chua-cli-limit-'))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  writeFileSync(
    join(bin, 'claude'),
    `#!${process.execPath}\nconst fs=require('node:fs');
if(process.argv.includes('--version')){console.log('local-test-provider');}
else{fs.writeFileSync('hoc-lieu.json','{}');process.stdin.resume();process.stdin.on('end',()=>console.log('{"type":"result"}'));}
`,
    { mode: 0o700 },
  )
  const viec = [1, 2].map(i => ({
    cau: { qid: `local-${i}`, version: 'v1', reviewed: true, phan: 'III' },
    daCo: {},
  }))
  let layHang = 0, nap = 0
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    res.setHeader('content-type', 'application/json')
    if (req.headers['x-ma-bi-mat'] !== 'local-test-only') {
      res.writeHead(403).end('{}'); return
    }
    if (req.url === '/kho/may-soan/vong-chua-viec') {
      layHang++
      const b = JSON.parse(body)
      res.end(JSON.stringify({ ok: true, viec: viec.filter(v => !b.daLam.includes(v.cau.qid)).slice(0, 1) }))
    } else {
      nap++
      res.end(JSON.stringify({ ok: false }))
    }
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
  const address = server.address() as { port: number }
  try {
    const r = await exec(process.execPath, [resolve('scripts/loi-giai/may-soan-vong-chua.mjs'), ...args], {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        OMR_MA_BI_MAT: 'local-test-only',
        OMR_MAY_CHU: `http://127.0.0.1:${address.port}`,
        OMR_THU_MUC_CHUA: join(dir, 'ho-so'),
      },
      timeout: 15000,
    })
    const events = r.stdout.trim().split('\n').map(x => JSON.parse(x))
    expect(r.stdout).not.toContain('local-test-only')
    return { events, layHang, nap }
  } finally {
    await new Promise<void>(r => server.close(() => r()))
    rmSync(dir, { recursive: true, force: true })
  }
}

it('lượt tối đa một câu dừng sau câu bị loại, không lấy câu kế hoặc nạp dữ liệu sai', async () => {
  const r = await chay(['--mot-lan', '--so-cau', '1'])
  expect(r.layHang).toBe(1)
  expect(r.nap).toBe(0)
  expect(r.events.at(-1)).toMatchObject({ dat: 0, truot: 1, hetHangTrongLuot: false, datGioiHanLuot: true, gioiHanSoCau: 1 })
  expect(r.events.some(x => x.buoc === 'bat_dau_soan')).toBe(true)
  expect(r.events.find(x => x.dat === false)?.lyDo).toContain('hoc_lieu_sai_cau_truc')
}, 20000)

it('không đặt giới hạn vẫn đi hết hàng trong lượt, giữ số câu bị loại và không nạp', async () => {
  const r = await chay(['--mot-lan'])
  expect(r.layHang).toBe(3)
  expect(r.nap).toBe(0)
  expect(r.events.at(-1)).toMatchObject({ dat: 0, truot: 2, hetHangTrongLuot: true })
  expect(r.events.filter(x => x.dat === false).map(x => x.qid)).toEqual(['local-1', 'local-2'])
}, 20000)
