#!/usr/bin/env node
// MÁY SOẠN LỜI GIẢI — chạy trên MÁY THẦY bằng gói Claude đang dùng (không tốn API). Thầy chốt 29/09: 4 luồng song song, khối 12 trước.
//
//   node scripts/loi-giai/may-soan.mjs                 # 4 luồng, khối 12, chạy mãi (hết việc thì 30 phút hỏi lại)
//   node scripts/loi-giai/may-soan.mjs --mot-lan       # làm hết hàng hiện có rồi dừng
//   node scripts/loi-giai/may-soan.mjs --de 12-KT-C1-D4 --mot-lan   # đề sắp giao: đưa lên đầu hàng rồi soạn
//   node scripts/loi-giai/may-soan.mjs --nap-hang      # LẦN ĐẦU: xếp cả kho cũ vào hàng (đề mới nạp thì tự vào hàng)
//   node scripts/loi-giai/may-soan.mjs --tong          # xem hàng việc theo chương
//   Tuỳ chọn: --luong 4 · --lop 12 (--lop tat-ca = mọi lớp) · --so 12 (câu mỗi lô) · --model <tên> · --thu (1 lô 3 câu, không nộp)
//
// Cần: `claude` (Claude Code) đã đăng nhập; biến OMR_MA_BI_MAT = mã bí mật của thầy (hoặc tệp ~/.omr-ma-bi-mat). Không in mã ra đâu cả.
// Mỗi lô: máy chủ phát 12 câu CÙNG CHƯƠNG ⇒ thư mục .may-soan/<ngày>/<lô>/ (vao/, bo.json, gói giao việc, bộ kiểm) ⇒ `claude -p`
// soạn + tự kiểm ⇒ máy này kiểm lại ⇒ nộp từng hồ sơ; máy chủ kiểm lần nữa với đáp án KHO rồi mới xếp "chờ thầy duyệt".
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { kiemHoSo } from './kiem.bundle.mjs'

const DAY = path.dirname(fileURLToPath(import.meta.url))
const GOC = path.resolve(DAY, '../..')
const argv = process.argv.slice(2)
const co = (k) => argv.includes(k)
const lay = (k, md) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : md }

const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const LUONG = Math.max(1, Math.min(8, Number(lay('--luong', '4')) || 4))
const LOP = lay('--lop', '12') === 'tat-ca' ? '' : lay('--lop', '12')
const SO_CAU_LO = co('--thu') ? 3 : Math.max(1, Math.min(20, Number(lay('--so', '12')) || 12))
const MODEL = lay('--model', '')
const PHUT_CHO_KHI_HET = 30
const THU_MUC_LAM = process.env.OMR_THU_MUC_LAM || path.join(GOC, '.may-soan')
const NHAT_KY = path.join(THU_MUC_LAM, 'nhat-ky.jsonl')

function maBiMat() {
  if (process.env.OMR_MA_BI_MAT) return process.env.OMR_MA_BI_MAT.trim()
  const tep = path.join(os.homedir(), '.omr-ma-bi-mat')
  if (fs.existsSync(tep)) return fs.readFileSync(tep, 'utf8').trim()
  console.error('Thiếu mã bí mật: đặt biến OMR_MA_BI_MAT hoặc ghi vào ~/.omr-ma-bi-mat (một dòng).')
  process.exit(2)
}
const SECRET = maBiMat()

async function goi(duong, body, lan = 0) {
  try {
    const r = await fetch(`${MAY_CHU}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': SECRET }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({ ok: false, error: `máy chủ trả ${r.status}` }))
    if (r.status >= 500 && lan < 3) { await ngu(2000 * 2 ** lan); return goi(duong, body, lan + 1) }
    return j
  } catch (e) {
    if (lan < 3) { await ngu(2000 * 2 ** lan); return goi(duong, body, lan + 1) }
    return { ok: false, error: 'mạng: ' + e.message }
  }
}
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const gio = () => new Date().toLocaleTimeString('vi-VN', { hour12: false })
const ghiNhatKy = (o) => { fs.mkdirSync(THU_MUC_LAM, { recursive: true }); fs.appendFileSync(NHAT_KY, JSON.stringify({ luc: new Date().toISOString(), ...o }) + '\n') }

/** Dựng thư mục một lô: ảnh ra tệp (phiên soạn phải Read ảnh), đầu vào, bộ chìa khoá, gói giao việc, bộ kiểm. */
function dungLo(lo, luong) {
  const ngay = new Date().toISOString().slice(0, 10)
  const dir = path.join(THU_MUC_LAM, ngay, `${luong}-${lo.bo}-${lo.maLuot.slice(0, 8)}`)
  fs.mkdirSync(path.join(dir, 'vao/img'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'ra'), { recursive: true })
  const tep = []
  lo.viec.forEach((v, i) => {
    const ten = `${String(i + 1).padStart(2, '0')}-${v.qid}.json`
    const hinh = (v.hinh || []).map((h, j) => {
      const m = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/.exec(h.duLieu || '')
      if (!m) return null
      const f = `img/${v.qid}-${j}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`
      fs.writeFileSync(path.join(dir, 'vao', f), Buffer.from(m[2], 'base64'))
      return { viTri: h.viTri, tep: 'vao/' + f }
    }).filter(Boolean)
    fs.writeFileSync(path.join(dir, 'vao', ten), JSON.stringify({ ...v, hinh }, null, 1))
    tep.push({ ten, vao: v })
  })
  fs.writeFileSync(path.join(dir, 'bo.json'), JSON.stringify(lo.bo_, null, 1))
  fs.copyFileSync(path.join(DAY, 'goi-may-soan.md'), path.join(dir, 'goi-may-soan.md'))
  fs.copyFileSync(path.join(DAY, 'goi-chot.md'), path.join(dir, 'goi-chot.md'))
  fs.copyFileSync(path.join(DAY, 'vi-du-mau.json'), path.join(dir, 'vi-du-mau.json'))
  fs.copyFileSync(path.join(DAY, 'kiem.bundle.mjs'), path.join(dir, 'kiem.bundle.mjs'))
  fs.writeFileSync(path.join(dir, 'kiem.mjs'), BO_KIEM_LO)
  return { dir, tep }
}
// Bộ kiểm trong thư mục lô: kiểm ra/*.json đối chiếu vao/*.json + bo.json bằng đúng hàm của máy chủ.
const BO_KIEM_LO = `import fs from 'node:fs'
import { kiemHoSo } from './kiem.bundle.mjs'
const bo = JSON.parse(fs.readFileSync('bo.json', 'utf8'))
let dat = 0, tong = 0
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json')).sort()) {
  tong++
  const vao = JSON.parse(fs.readFileSync('vao/' + f, 'utf8'))
  if (!fs.existsSync('ra/' + f)) { console.log(f + ': CHƯA CÓ ra/' + f); continue }
  let h; try { h = JSON.parse(fs.readFileSync('ra/' + f, 'utf8')) } catch (e) { console.log(f + ': TRƯỢT · JSON hỏng ' + e.message); continue }
  const { loi, canhBao } = kiemHoSo(vao, h, bo)
  if (!loi.length) dat++
  console.log(f + ': ' + (loi.length ? 'TRƯỢT' : 'ĐẠT') + (loi.length ? '\\n   ✕ ' + loi.join('\\n   ✕ ') : '') + (canhBao.length ? '\\n   ! ' + canhBao.join('\\n   ! ') : ''))
}
console.log('TỔNG: ' + dat + '/' + tong + ' đạt')
`

const NHAC_SOAN = (n) => `Đọc goi-may-soan.md trong thư mục hiện tại và làm đúng. Lô này có ${n} câu trong vao/. Ghi kết quả vào ra/ (cùng tên tệp), chạy node kiem.mjs để tự kiểm và sửa.`
const NHAC_CHOT = (n) => `Đọc goi-chot.md trong thư mục hiện tại và làm đúng. Có ${n} hồ sơ cần chốt, liệt kê trong chot.txt. Sửa thẳng ra/ rồi chạy node kiem.mjs.`
/** Còn cờ đáp án chưa chốt (cờ đã chốt "đáp án kho sai" có trường `chot` — giữ nguyên, không chốt lại). */
const canChot = (h) => Array.isArray(h?.co) && h.co.some((c) => c?.loai === 'dapAn' && !c?.chot)

/**
 * Môi trường cho mỗi phiên soạn: KHÔNG mang mã bí mật của thầy, và khi máy soạn chạy bên trong một phiên Claude Code
 * (máy đám mây) thì bỏ các biến gắn với phiên cha — không thì phiên con ghi chung nhật ký / định danh với phiên cha.
 * Máy thầy không có các biến này ⇒ không đổi gì.
 */
function moiTruongPhienSoan() {
  const env = { ...process.env, OMR_MA_BI_MAT: '' }
  for (const k of Object.keys(env)) {
    if (/^(CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|SYNC_SESSION_REFS|POST_FOR_SESSION_INGRESS_V2|MESSAGING_\w+))$/.test(k)) delete env[k]
  }
  return env
}

function chayClaude(dir, soCau, loiNhac = NHAC_SOAN(soCau)) {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', 'Read,Write,Edit,Glob,Bash(node kiem.mjs),Bash(node kiem.mjs:*)', '--max-turns', String(40 + soCau * 12)]
  if (MODEL) thamSo.push('--model', MODEL)
  return new Promise((xong) => {
    const t0 = Date.now()
    const p = spawn('claude', thamSo, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], env: moiTruongPhienSoan() })
    let ra = '', loi = ''
    p.stdout.on('data', (d) => { ra += d })
    p.stderr.on('data', (d) => { loi += d })
    p.on('error', (e) => xong({ ok: false, loi: 'không chạy được lệnh claude: ' + e.message, giay: 0 }))
    p.on('close', (ma) => {
      let j = null
      try { j = JSON.parse(ra) } catch { j = null }
      xong({ ok: ma === 0, ma, giay: Math.round((Date.now() - t0) / 1000), usage: j?.usage, ketQua: j?.result, loi: ma === 0 ? '' : (loi || ra).slice(0, 600) })
    })
    p.stdin.end(loiNhac)
  })
}

let dung = false
process.on('SIGINT', () => { if (dung) process.exit(130); dung = true; console.log(`\n[${gio()}] Dừng nhận việc mới — đợi các lô đang chạy xong (bấm Ctrl+C lần nữa để thoát ngay).`) })

async function motLuong(luong, dem) {
  while (!dung) {
    const lo = await goi('/kho/loi-giai/viec', { so: SO_CAU_LO, lop: LOP })
    if (!lo.ok) { console.log(`[${gio()}] luồng ${luong}: máy chủ báo lỗi — ${lo.error}`); await ngu(60_000); continue }
    if (lo.het || !lo.viec?.length) {
      if (co('--mot-lan') || co('--thu')) return
      console.log(`[${gio()}] luồng ${luong}: hết việc, ${PHUT_CHO_KHI_HET} phút nữa hỏi lại`)
      await ngu(PHUT_CHO_KHI_HET * 60_000)
      continue
    }
    const { dir, tep } = dungLo({ ...lo, bo: lo.bo?.ma ?? 'X', bo_: lo.bo }, luong)
    console.log(`[${gio()}] luồng ${luong}: nhận ${tep.length} câu chương ${lo.bo?.chuong ?? lo.bo?.ma} → ${path.relative(GOC, dir)}`)
    const kq = await chayClaude(dir, tep.length)
    if (!kq.ok) console.log(`[${gio()}] luồng ${luong}: phiên soạn dừng lỗi (${kq.ma ?? '?'}): ${kq.loi}`)
    // PHIÊN CHỐT (thầy giao máy tự chốt, 29/09): hồ sơ còn cờ đáp án ⇒ một phiên nữa giải lại độc lập và ra quyết định cuối.
    const docRa = (ten) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'ra', ten), 'utf8')) } catch { return null } }
    const phaiChot = tep.filter(({ ten }) => canChot(docRa(ten))).map(({ ten }) => ten)
    let kqChot = null
    if (phaiChot.length) {
      fs.writeFileSync(path.join(dir, 'chot.txt'), phaiChot.join('\n') + '\n')
      console.log(`[${gio()}] luồng ${luong}: chốt ${phaiChot.length} hồ sơ có cờ đáp án`)
      kqChot = await chayClaude(dir, phaiChot.length, NHAC_CHOT(phaiChot.length))
      kq.giay += kqChot.giay
      if (!kqChot.ok) console.log(`[${gio()}] luồng ${luong}: phiên chốt dừng lỗi (${kqChot.ma ?? '?'}): ${kqChot.loi}`)
    }
    let dat = 0, truot = 0, thieu = 0
    for (const { ten, vao } of tep) {
      const f = path.join(dir, 'ra', ten)
      if (!fs.existsSync(f)) { thieu++; continue }
      let h
      try { h = JSON.parse(fs.readFileSync(f, 'utf8')) } catch { truot++; continue }
      const { loi } = kiemHoSo(vao, h, lo.bo)
      if (co('--thu')) { loi.length ? truot++ : dat++; continue }
      const r = await goi('/kho/loi-giai/nop', { qid: vao.qid, bam: vao.bam, hoSo: h })
      if (r.ok) dat++
      else { truot++; console.log(`   ✕ ${vao.qid}: ${(r.loi || [r.error]).slice(0, 3).join(' | ')}`) }
    }
    dem.dat += dat; dem.truot += truot; dem.thieu += thieu; dem.giay += kq.giay
    const demToken = (u) => (u ? (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) : 0)
    const token = kq.usage ? demToken(kq.usage) + demToken(kqChot?.usage) : null
    ghiNhatKy({ luong, bo: lo.bo?.ma, maLuot: lo.maLuot, soCau: tep.length, soChot: phaiChot.length, dat, truot, thieu, giay: kq.giay, token, thu: co('--thu') })
    console.log(`[${gio()}] luồng ${luong}: xong lô — đạt ${dat}, trượt ${truot}, thiếu ${thieu} · ${kq.giay} giây${token ? ` · ${Math.round(token / 1000)} nghìn token` : ''}`)
    if (co('--thu')) return
  }
}

async function main() {
  if (co('--tong')) {
    const t = await goi('/kho/loi-giai/tong', {})
    if (!t.ok) return console.log('Lỗi:', t.error)
    const bang = {}
    for (const r of t.viec) { const k = `${r.lop || '?'} · ${r.bo || '(chưa gắn dạng)'}`; (bang[k] ??= {})['việc ' + r.trang_thai] = r.n }
    for (const r of t.hoSo) { const k = `${r.lop || '?'} · ${r.bo || '(chưa gắn dạng)'}`; (bang[k] ??= {})['hồ sơ ' + r.trang_thai] = r.n }
    console.table(bang)
    return console.log('Chương đã có bộ chìa khoá:', t.boCo.join(', '))
  }
  if (co('--nap-hang')) {
    let tu = 0, soCau = 0, vaoHang = 0
    for (;;) {
      const r = await goi('/kho/loi-giai/nap-hang', { tu, so: 8, lop: LOP })
      if (!r.ok) { console.log('Lỗi:', r.error); break }
      soCau += r.soCau; vaoHang += r.vaoHang
      for (const l of r.loi) console.log('   ! ' + l)
      console.log(`[${gio()}] đã quét ${tu + r.daQuet.length} đề · ${soCau} câu · ${vaoHang} câu mới vào hàng`)
      if (r.tiep == null) break
      tu = r.tiep
    }
    return
  }
  const maDe = lay('--de', '')
  if (maDe) {
    const r = await goi('/gv/loi-giai/soan-gap', { maDe })
    console.log(r.ok ? `Đề ${maDe}: ${r.soCau} câu lên đầu hàng.` : `Lỗi: ${r.error}`)
  }
  const dem = { dat: 0, truot: 0, thieu: 0, giay: 0 }
  console.log(`[${gio()}] Máy soạn: ${LUONG} luồng · ${LOP ? 'khối ' + LOP : 'mọi khối'} · ${SO_CAU_LO} câu/lô · máy chủ ${MAY_CHU}`)
  await Promise.all(Array.from({ length: co('--thu') ? 1 : LUONG }, (_, i) => ngu(i * 3000).then(() => motLuong(i + 1, dem))))
  console.log(`[${gio()}] Kết thúc: đạt ${dem.dat} · trượt ${dem.truot} · thiếu ${dem.thieu}. Nhật ký: ${path.relative(GOC, NHAT_KY)}`)
}
main()
