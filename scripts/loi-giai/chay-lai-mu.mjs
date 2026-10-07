#!/usr/bin/env node
// Giải mù lại tất cả bam trong noi-dung/ với input SẠCH (không đáp án).
// Chạy sau khi sửa lỗi kiem-mu-vao.json lộ dap_an.
//
//   OMR_MA_BI_MAT=Hoahoc2024 node scripts/loi-giai/chay-lai-mu.mjs
//
// Không gọi Worker, không thay đổi soan.json/goc.json/da-co.json.
// Chỉ ghi lại: kiem-mu-vao.json, kiem-mu-ra.json, ung-vien.json.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dungVaoMu, docTraLoiMu, ghepHaiLuot, kiemBoTro, cauGocTuVao } from './kiem.bundle.mjs'

const DAY = path.dirname(fileURLToPath(import.meta.url))
const GOC = path.resolve(DAY, '../..')
const THU_MUC_BAN_GIAO = path.join(GOC, '.may-soan', 'ban-giao-sau-ban')
const LUONG = 3

const docJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }
const ghiJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)) }
const gio = () => new Date().toLocaleTimeString('vi-VN', { hour12: false })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))

const MODEL = process.argv.includes('--model') ? process.argv[process.argv.indexOf('--model') + 1] : ''

const NHAC_MU = (ten) => `Đọc goi-kiem-mu.md trong thư mục hiện tại và làm đúng. \
Có ${ten.length} tệp cần giải (đọc trong vao/, danh sách ở danh-sach.txt): ${ten.join(', ')}. \
Ghi kết quả vào ra/ (cùng tên tệp).`

function moiTruongSon() {
  const env = { ...process.env, OMR_MA_BI_MAT: '' }
  for (const k of Object.keys(env)) {
    if (/^(CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|SYNC_SESSION_REFS|POST_FOR_SESSION_INGRESS_V2|MESSAGING_\w+))$/.test(k)) delete env[k]
  }
  return env
}

function chayClaude(dir, soCau, loiNhac, cong = 'Read,Write', luot = 20 + soCau * 4) {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', cong, '--max-turns', String(luot)]
  if (MODEL) thamSo.push('--model', MODEL)
  return new Promise((xong) => {
    const p = spawn('claude', thamSo, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], env: moiTruongSon() })
    let ra = '', loi = ''
    p.stdout.on('data', (d) => { ra += d })
    p.stderr.on('data', (d) => { loi += d })
    p.on('error', (e) => xong({ ok: false, loi: 'không chạy được claude: ' + e.message }))
    p.on('close', (ma) => {
      let j = null; try { j = JSON.parse(ra) } catch { j = null }
      xong({ ok: ma === 0, ma, ketQua: j?.result, loi: ma === 0 ? '' : (loi || ra).slice(0, 800) })
    })
    p.stdin.end(loiNhac)
  })
}

// Giải mù sạch: tạo thư mục tạm, chỉ ghi de/pa/bang — không đáp án.
async function kiemMuSach(cauGoc, vaoMu) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'omr-mu2-'))
  try {
    fs.mkdirSync(path.join(tam, 'vao'), { recursive: true })
    fs.mkdirSync(path.join(tam, 'ra'), { recursive: true })
    const gmSrc = path.join(DAY, 'goi-kiem-mu.md')
    if (fs.existsSync(gmSrc)) fs.copyFileSync(gmSrc, path.join(tam, 'goi-kiem-mu.md'))
    const te = `01-${cauGoc.qid}.json`
    // Kiểm trước khi ghi: không có khóa cấm
    const KHOA_CAM = new Set(['dap_an','dapAn','correct','buoc','chot','phepTinh','kiem','lyDo','lyDo2'])
    for (const m of vaoMu.muc ?? []) {
      const lo = Object.keys(m).filter(k => KHOA_CAM.has(k))
      if (lo.length) throw new Error(`vaoMu còn khóa cấm: ${lo.join(',')} — qid ${cauGoc.qid}`)
    }
    fs.writeFileSync(path.join(tam, 'vao', te), JSON.stringify(vaoMu, null, 1))
    fs.writeFileSync(path.join(tam, 'danh-sach.txt'), te + '\n')
    const soMuc = vaoMu.muc?.length ?? 0
    const kq = await chayClaude(tam, 1, NHAC_MU([te]), 'Read,Write', 20 + soMuc * 4)
    const tra = docTraLoiMu(docJson(path.join(tam, 'ra', te)))
    return { kq, tra, soMuc }
  } finally {
    fs.rmSync(tam, { recursive: true, force: true })
  }
}

// Xây cauGoc từ goc.json (không cần mc đủ — chỉ cần de, dang, qid, bam)
function cauGocTuGocJson(goc) {
  // Phương án TN từ mc.o: [['A','...'],['B','...']]
  const mc = goc.mc
  const y = mc?.o ? mc.o.map(([id, t]) => ({ id, t })) : []
  const v = {
    qid: goc.qid,
    bam: goc.bam,
    dang: goc.dang,
    phan: goc.phan,
    deTho: goc.deTho,
    de: goc.deTho,
    dapAn: goc.dapAn,
    mc: mc ?? null,
    y,
    kieuKho: ''
  }
  return cauGocTuVao(v)
}

async function xuLyBam(bamDir, idx, tong) {
  const bam = path.basename(bamDir)
  const soanPath = path.join(bamDir, 'soan.json')
  const gocPath = path.join(bamDir, 'goc.json')
  const dacPath = path.join(bamDir, 'da-co.json')
  if (!fs.existsSync(soanPath) || !fs.existsSync(gocPath)) return { bam, bo: 'khong-co-soan' }

  const soan = docJson(soanPath)
  const goc = docJson(gocPath)
  const daCo = docJson(dacPath) ?? { banKhac: [], yDs: [] }
  if (!soan || !goc) return { bam, bo: 'json-hong' }

  const cauGoc = cauGocTuGocJson(goc)
  if (!cauGoc) return { bam, bo: 'cau-goc-hong' }

  // Kiểm cấu trúc lại để có hopLe
  const can = { hoSo: false, banKhac: 6, yDs: 0 }
  const r = kiemBoTro(cauGoc, can, soan, daCo)
  const hopLe = { songSinh: r.songSinh, yMoi: r.yMoi }

  if (!hopLe.songSinh.length && !hopLe.yMoi.length) return { bam, bo: 'khong-co-hop-le' }

  const vaoMu = dungVaoMu(cauGoc, hopLe, false)
  if (!vaoMu || !vaoMu.muc?.length) return { bam, bo: 'vao-mu-rong' }

  console.log(`[${gio()}] [${idx}/${tong}] ${goc.qid}: giải mù ${vaoMu.muc.length} mục`)
  const { kq, tra, soMuc } = await kiemMuSach(cauGoc, vaoMu)
  if (!kq.ok) console.log(`[${gio()}]   lỗi claude: ${kq.loi?.slice(0,80)}`)

  const KHOA_CAM = new Set(['dap_an','dapAn','correct','buoc','chot','phepTinh','kiem','lyDo','lyDo2','kq'])
  const muVaoLog = [
    ...(soan.songSinh ?? []).map((s, i) => ({ id: `ss${i+1}`, loai: 'ban_khac', ...(s.dang ? {dang: s.dang} : {}), de: s.de, ...(s.pa ? {pa: s.pa} : {}), ...(s.bang ? {bang: s.bang} : {}) })),
    ...(soan.yMoi ?? []).map((y, i) => ({ id: `y${i+1}`, loai: 'y', dang: 'ds', t: y.t })),
  ]
  if (muVaoLog.some(m => Object.keys(m).some(k => KHOA_CAM.has(k)))) {
    throw new Error(`muVaoLog vẫn còn khóa cấm — bam ${bam}`)
  }

  const g = ghepHaiLuot(cauGoc, hopLe, tra)
  ghiJson(path.join(bamDir, 'kiem-mu-vao.json'), muVaoLog)
  ghiJson(path.join(bamDir, 'kiem-mu-ra.json'), tra ?? [])
  const ungVien = goc.dang === 'ds'
    ? { qid: goc.qid, bam, yMoi: g.yMoi }
    : { qid: goc.qid, bam, songSinh: g.songSinh }
  ghiJson(path.join(bamDir, 'ung-vien.json'), ungVien)

  const soGiu = g.songSinh.length + g.yMoi.length
  console.log(`[${gio()}] [${idx}/${tong}] ${goc.qid}: xong — giữ ${soGiu}/${soMuc}`)
  return { bam, qid: goc.qid, giữ: soGiu, muc: soMuc }
}

async function main() {
  const noicDungDir = path.join(THU_MUC_BAN_GIAO, 'noi-dung')
  if (!fs.existsSync(noicDungDir)) { console.error('Chưa có noi-dung/'); process.exit(1) }

  const bams = fs.readdirSync(noicDungDir)
    .filter(f => fs.statSync(path.join(noicDungDir, f)).isDirectory())
    .filter(f => fs.existsSync(path.join(noicDungDir, f, 'soan.json')))
    .map(f => path.join(noicDungDir, f))

  console.log(`[${gio()}] Giải mù lại: ${bams.length} bam · ${LUONG} luồng`)

  // Phân công bam theo luồng
  const ket = []
  const hang = [...bams.entries()]
  let cur = 0
  const lock = () => { const i = cur; cur++; return i < hang.length ? hang[i] : null }

  async function luong(id) {
    while (true) {
      const item = lock()
      if (!item) return
      const [idx, bamDir] = item
      try {
        const r = await xuLyBam(bamDir, idx + 1, bams.length)
        ket.push(r)
      } catch (e) {
        console.log(`[${gio()}] lỗi bam ${path.basename(bamDir)}: ${e.message}`)
        ket.push({ bam: path.basename(bamDir), bo: 'loi: ' + e.message })
      }
    }
  }

  await Promise.all(Array.from({ length: LUONG }, (_, i) => luong(i + 1)))

  const ok = ket.filter(r => r.giữ !== undefined)
  const bo = ket.filter(r => r.bo)
  console.log(`\n=== KẾT QUẢ ===`)
  console.log(`Giải mù xong: ${ok.length} · Bỏ qua/lỗi: ${bo.length}`)
  console.log(`Tổng ứng viên giữ: ${ok.reduce((s, r) => s + (r.giữ ?? 0), 0)}`)
  if (bo.length) console.log('Bỏ qua:', bo.map(r => `${r.bam}(${r.bo})`).join(', '))

  // Cập nhật goc.json thêm mc cho các bam chưa có
  let capNhat = 0
  for (const { bam } of ok) {
    const gocPath = path.join(noicDungDir, bam, 'goc.json')
    const goc = docJson(gocPath)
    if (goc && !goc.mc) {
      // Tìm mc từ soan.json không có — không có nguồn → skip
      capNhat++
    }
  }

  console.log(`\nHoàn tất. Chạy --xuat-goi để cập nhật manifest.`)
}

main().catch(e => { console.error(e); process.exit(1) })
