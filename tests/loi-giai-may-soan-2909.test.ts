// @vitest-environment node
// Máy soạn trên máy thầy (scripts/loi-giai/may-soan.mjs) chạy THẬT từ đầu tới cuối: Worker thật (SQLite) sau một cổng HTTP cục bộ,
// `claude` giả (chép hồ sơ mẫu vào ra/) — kiểm: nhận lô cùng chương, dựng thư mục lô, bộ kiểm trong lô chạy được, nộp, máy chủ tự duyệt hồ sơ sạch.
import { afterAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'may-soan-'))
afterAll(() => fs.rmSync(TAM, { recursive: true, force: true }))

function dungMayChu(d: ReturnType<typeof taoD1That>) {
  const sv = http.createServer(async (req, res) => {
    let body = ''
    for await (const c of req) body += c
    const r = await worker.fetch(new Request(`https://test${req.url}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': String(req.headers['x-ma-bi-mat'] ?? '') }, body }), d.env)
    res.writeHead(r.status, { 'content-type': 'application/json' })
    res.end(await r.text())
  })
  return new Promise<{ url: string; dong: () => void }>((ok) => sv.listen(0, '127.0.0.1', () => {
    const a = sv.address() as { port: number }
    ok({ url: `http://127.0.0.1:${a.port}`, dong: () => sv.close() })
  }))
}

/** `claude` giả: với mỗi vao/<tệp>, chép hồ sơ mẫu theo qid gốc (đổi qid/bam cho khớp đầu vào) vào ra/<tệp>. */
function dungClaudeGia() {
  const bin = path.join(TAM, 'bin')
  fs.mkdirSync(bin, { recursive: true })
  const map = { 'I-6': '02-12-KT-C1-D4-I-6.json', 'II-4': '04-12-KT-C1-D4-II-4.json', 'III-6': '06-12-KT-C1-D2-III-6.json' }
  fs.writeFileSync(path.join(bin, 'claude'), `#!/usr/bin/env node
const fs = require('fs'), path = require('path')
const MAP = ${JSON.stringify(map)}, RA2 = ${JSON.stringify(RA2)}
const nhac = fs.readFileSync(0, 'utf8')
if (nhac.includes('goi-chot.md')) {
  // phiên CHỐT giả: giữ đáp án kho, chuyển cờ sang daChot
  for (const f of fs.readFileSync('chot.txt', 'utf8').split(String.fromCharCode(10)).filter(Boolean)) {
    const h = JSON.parse(fs.readFileSync('ra/' + f, 'utf8'))
    h.daChot = h.co.map((c) => ({ ghi: c.ghi, chot: 'Giữ đáp án kho: thử' }))
    h.co = []
    fs.writeFileSync('ra/' + f, JSON.stringify(h))
  }
  process.stdout.write(JSON.stringify({ result: 'chốt', usage: { input_tokens: 3, output_tokens: 2 } }))
  process.exit(0)
}
let n = 0
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json'))) {
  const v = JSON.parse(fs.readFileSync('vao/' + f, 'utf8'))
  const khoa = Object.keys(MAP).find((k) => v.qid.endsWith('-' + k))
  const h = JSON.parse(fs.readFileSync(path.join(RA2, MAP[khoa]), 'utf8'))
  const { canThayChot, de, so, nguon, chuong, ...r } = h
  r.y = (r.y || []).map(({ t, ...y }) => y)
  if (r.mc) r.mc = { d: r.mc.d }
  const co = khoa === 'II-4' ? [{ loai: 'dapAn', ghi: 'thử cờ cho phiên chốt' }] : []
  fs.writeFileSync('ra/' + f, JSON.stringify({ ...r, qid: v.qid, bam: v.bam, co }))
  n++
}
const kiem = require('child_process').execFileSync(process.execPath, ['kiem.mjs'], { encoding: 'utf8' })
fs.writeFileSync('kiem-log.txt', kiem)
process.stdout.write(JSON.stringify({ result: n + ' câu', usage: { input_tokens: 10, output_tokens: 5 } }))
`)
  fs.chmodSync(path.join(bin, 'claude'), 0o755)
  return bin
}

function chayMaySoan(url: string, bin: string, them: string[]) {
  return new Promise<{ ma: number | null; ra: string }>((ok) => {
    const p = spawn(process.execPath, [path.join(GOC, 'scripts/loi-giai/may-soan.mjs'), ...them], {
      cwd: GOC, env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, OMR_MAY_CHU: url, OMR_MA_BI_MAT: 'bi-mat-thu', OMR_THU_MUC_LAM: path.join(TAM, 'lam') },
    })
    let ra = ''
    p.stdout.on('data', (x) => { ra += x })
    p.stderr.on('data', (x) => { ra += x })
    p.on('close', (ma) => ok({ ma, ra }))
  })
}

describe('máy soạn chạy thật với máy chủ thật', () => {
  it('nhận lô → soạn → tự kiểm → nộp; máy chủ tự duyệt đủ 3 hồ sơ sạch', async () => {
    const d = taoD1That()
    const { url, dong } = await dungMayChu(d)
    try {
      const goi = { cau: [{ ...MAU['12-KT-C1-D4-I-6'].cau, so: 6 }, { ...MAU['12-KT-C1-D4-II-4'].cau, so: 4 }, { ...MAU['12-KT-C1-D2-III-6'].cau, so: 6 }] }
      const r = await worker.fetch(new Request('https://test/kho/day', { method: 'POST', body: JSON.stringify({ secret: 'bi-mat-thu', maDe: '12-THU-MS', lop: '12', de: goi, cau: [] }) }), d.env)
      expect(((await r.json()) as { loiGiai: { vaoHang: number } }).loiGiai.vaoHang).toBe(3)
      const bin = dungClaudeGia()
      const kq = await chayMaySoan(url, bin, ['--mot-lan', '--luong', '2', '--so', '2'])
      expect(kq.ma, kq.ra).toBe(0)
      expect(kq.ra).toContain('Kết thúc: đạt 3 · trượt 0 · thiếu 0')
      // Phiên chốt chạy cho đúng câu có cờ đáp án ⇒ cả 3 hồ sơ đều sạch ⇒ máy duyệt ngay lúc nộp (thầy chốt 29/09), quyết định giữ lại trong daChot.
      expect(kq.ra).toContain('chốt 1 hồ sơ có cờ đáp án')
      expect(d.dem('loi_giai', "trang_thai='da_duyet' AND so_co_dap_an=0 AND ghi_chu='máy duyệt'")).toBe(3)
      expect(d.dem('loi_giai', "trang_thai='cho_duyet'")).toBe(0)
      const bam = (d.sql.prepare("SELECT bam FROM loi_giai_cau WHERE qid='12-THU-MS-II-4'").get() as { bam: string }).bam
      expect(JSON.parse(d.objects.get(`giai/${bam}.json`) as string).daChot).toEqual([{ ghi: 'thử cờ cho phiên chốt', chot: 'Giữ đáp án kho: thử' }])
      // Bộ kiểm trong thư mục lô chạy được và ra ĐẠT (phiên soạn thật dựa vào nó để tự sửa).
      const nk = fs.readFileSync(path.join(TAM, 'lam/nhat-ky.jsonl'), 'utf8').trim().split('\n').map((x) => JSON.parse(x)).filter((x) => x.maLuot)
      const lo = nk.slice(-2)
      expect(lo.reduce((s, x) => s + x.dat, 0)).toBe(3)
      const thuMuc = fs.readdirSync(path.join(TAM, 'lam', new Date().toISOString().slice(0, 10))).filter((x) => lo.some((l) => x.endsWith(String(l.maLuot).slice(0, 8))))
      for (const t of thuMuc) expect(fs.readFileSync(path.join(TAM, 'lam', new Date().toISOString().slice(0, 10), t, 'kiem-log.txt'), 'utf8')).toMatch(/TỔNG: (\d)\/\1 đạt/)
    } finally {
      dong()
    }
  }, 60_000)
})
