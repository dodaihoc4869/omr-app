#!/usr/bin/env node
// MÁY VẼ LẠI HÌNH CỦA ĐỀ bằng Claude Code (thầy 03/11: «chỉ cần đề có hình là vẽ lại… áp dụng cả cho nạp đề mới sau này»; «chỉ vẽ những câu có hình»).
// Chạy ở phiên Claude Code đám mây (hoặc máy thầy) có biến OMR_MA_BI_MAT. KHÔNG in mã, KHÔNG in đề / đáp án (chỉ số đếm + mã băm ảnh).
//
//   node scripts/hinh-ve/may-ve-hinh.mjs --nap-hang      # quét cả kho: ảnh CỦA ĐỀ vào hàng (gọi lại được; đề nạp mới tự vào hàng)
//   node scripts/hinh-ve/may-ve-hinh.mjs --tong          # số đếm: hàng việc / đạt / giữ gốc
//   node scripts/hinh-ve/may-ve-hinh.mjs --thu           # 1 lô, KHÔNG nộp (soát chất lượng, xem .may-ve-hinh/…)
//   node scripts/hinh-ve/may-ve-hinh.mjs                 # chạy tới hết hàng (--mot-lan: hết hàng thì dừng — dùng cho lịch hằng ngày)
//   Tuỳ chọn: --ngau-nhien (lấy ảnh ngẫu nhiên khắp kho — dùng khi chạy thử để ước tỉ lệ vẽ được) · --luong 3 · --so 5 (ảnh mỗi lô, ≤ 8) · --mot-lan · --model <tên>
//
// Mỗi lô: máy chủ phát N ảnh ⇒ HAI phiên âm ĐỘC LẬP (hai phiên claude khác nhau chép chữ trong ảnh) ⇒ phải khớp nhau (≥ 90 % hai chiều) ⇒ phiên thứ ba vẽ cảnh chỉ bằng chữ đã
// phiên âm ⇒ bộ kiểm trong lô ⇒ nộp. Máy chủ kiểm lại: chữ ngoài ảnh / hai phiên âm lệch / khuôn chưa hỗ trợ ⇒ «giu_goc» (app giữ ảnh gốc, không vẽ).
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { phienAmKhop } from './kiem-hinh.bundle.mjs'

const DAY = path.dirname(fileURLToPath(import.meta.url))
const GOC = path.resolve(DAY, '../..')
const argv = process.argv.slice(2)
const co = (k) => argv.includes(k)
const lay = (k, md) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : md }
const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const LUONG = Math.max(1, Math.min(6, Number(lay('--luong', '3')) || 3))
const SO_ANH = Math.max(1, Math.min(8, Number(lay('--so', '5')) || 5))
const MODEL = lay('--model', '')
const THU_MUC_LAM = process.env.OMR_THU_MUC_LAM_HINH || path.join(GOC, '.may-ve-hinh')
const SECRET = (process.env.OMR_MA_BI_MAT || '').trim()
if (!SECRET) { console.error('Thiếu biến OMR_MA_BI_MAT'); process.exit(2) }

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const gio = () => new Date().toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })
const docJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }
async function goi(duong, body, lan = 0) {
  try {
    const r = await fetch(`${MAY_CHU}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': SECRET }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) })
    const j = await r.json().catch(() => ({ ok: false, error: `máy chủ trả ${r.status}` }))
    if (r.status >= 500 && lan < 4) { await ngu(3000 * 2 ** lan); return goi(duong, body, lan + 1) }
    return j
  } catch (e) {
    if (lan < 4) { await ngu(3000 * 2 ** lan); return goi(duong, body, lan + 1) }
    return { ok: false, error: 'mạng: ' + e.message }
  }
}

function moiTruongPhienVe() {
  const env = { ...process.env, OMR_MA_BI_MAT: '' }
  for (const k of Object.keys(env)) if (/^(CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|SYNC_SESSION_REFS|POST_FOR_SESSION_INGRESS_V2|MESSAGING_\w+))$/.test(k)) delete env[k]
  return env
}
function chayClaude(dir, nhac, soAnh, duocLenh = '') {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', `Read,Write,Edit,Glob${duocLenh}`, '--max-turns', String(30 + soAnh * 10)]
  if (MODEL) thamSo.push('--model', MODEL)
  return new Promise((xong) => {
    const t0 = Date.now()
    const p = spawn('claude', thamSo, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], env: moiTruongPhienVe() })
    let ra = '', loi = ''
    p.stdout.on('data', (d) => { ra += d }); p.stderr.on('data', (d) => { loi += d })
    p.on('error', (e) => xong({ ok: false, loi: 'không chạy được claude: ' + e.message, giay: 0 }))
    p.on('close', (ma) => { let j = null; try { j = JSON.parse(ra) } catch { /* */ } xong({ ok: ma === 0, giay: Math.round((Date.now() - t0) / 1000), hetHan: /limit|quota|usage/i.test(String(j?.result || loi)) && ma !== 0, loi: ma === 0 ? '' : (loi || ra).slice(0, 300) }) })
    p.stdin.end(nhac)
  })
}

/** Thư mục lô: vao/img/<bam>.png + vao/<bam>.json (đề) + ra/. `phienAm` nếu có thì ghi vào vao/<bam>.json. */
function dungThuMuc(ten, viec, phienAm) {
  const dir = path.join(THU_MUC_LAM, new Date().toISOString().slice(0, 10), ten)
  fs.mkdirSync(path.join(dir, 'vao/img'), { recursive: true }); fs.mkdirSync(path.join(dir, 'ra'), { recursive: true })
  for (const v of viec) {
    const m = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/.exec(v.anh || '')
    if (!m) continue
    fs.writeFileSync(path.join(dir, 'vao/img', `${v.bam}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`), Buffer.from(m[2], 'base64'))
    fs.writeFileSync(path.join(dir, 'vao', `${v.bam}.json`), JSON.stringify({ bam: v.bam, viTri: v.viTri, phan: v.phan, de: v.de, ...(phienAm ? { phienAm: phienAm.get(v.bam) ?? [] } : {}) }, null, 1))
  }
  return dir
}

const NHAC_PHIEN_AM = (n) => `Đọc goi-phien-am.md trong thư mục hiện tại và làm đúng. Có ${n} ảnh trong vao/img/. Ghi phiên âm từng ảnh vào ra/<bam>.json. Trả lời cuối đúng 1 dòng.`
const NHAC_VE = (n) => `Đọc goi-ve-hinh.md trong thư mục hiện tại và làm đúng. Có ${n} ảnh trong vao/img/ (mỗi ảnh kèm vao/<bam>.json có phienAm). Ghi cảnh vào ra/<bam>.json, chạy node kiem.mjs, sửa tới khi ĐẠT. Trả lời cuối đúng 1 dòng.`
const doc = (dir, bam) => { const j = docJson(path.join(dir, 'ra', `${bam}.json`)); return Array.isArray(j?.phienAm) ? j.phienAm.map(String) : null }

const dem = { lo: 0, nop: 0, dat: 0, giuGoc: 0, lech: 0 }
async function motLuong(luong) {
  for (;;) {
    const lo = await goi('/kho/hinh-ve/viec', { so: SO_ANH, ...(co('--ngau-nhien') ? { ngauNhien: true } : {}) })
    if (!lo.ok) { console.log(`[${gio()}] luồng ${luong}: lỗi nhận việc: ${String(lo.error).slice(0, 120)}`); await ngu(60_000); continue }
    if (lo.het || !lo.viec?.length) { if (co('--mot-lan') || co('--thu')) return; console.log(`[${gio()}] luồng ${luong}: hết hàng, 10 phút hỏi lại`); await ngu(600_000); continue }
    const viec = lo.viec
    dem.lo++
    const ma = lo.maLuot.slice(0, 8)
    // 1) HAI lượt phiên âm độc lập (hai phiên claude, hai thư mục)
    const dA = dungThuMuc(`${luong}-${ma}-a`, viec), dB = dungThuMuc(`${luong}-${ma}-b`, viec)
    for (const d of [dA, dB]) fs.copyFileSync(path.join(DAY, 'goi-phien-am.md'), path.join(d, 'goi-phien-am.md'))
    const [kA, kB] = await Promise.all([chayClaude(dA, NHAC_PHIEN_AM(viec.length), viec.length), chayClaude(dB, NHAC_PHIEN_AM(viec.length), viec.length)])
    if (kA.hetHan || kB.hetHan) { console.log(`[${gio()}] luồng ${luong}: có vẻ hết hạn mức Claude — nghỉ 30 phút`); await ngu(1_800_000) }
    const phienAm = new Map(), khop = new Map()
    for (const v of viec) {
      const a = doc(dA, v.bam), b = doc(dB, v.bam)
      khop.set(v.bam, { a, b, ok: !!a && !!b && phienAmKhop(a, b) })
      if (a && b && phienAmKhop(a, b)) phienAm.set(v.bam, a)
    }
    // 2) vẽ cảnh (chỉ các ảnh có phiên âm khớp và có chữ)
    const canVe = viec.filter((v) => phienAm.get(v.bam)?.length)
    let dC = null
    if (canVe.length) {
      dC = dungThuMuc(`${luong}-${ma}-ve`, canVe, phienAm)
      for (const f of ['goi-ve-hinh.md', 'vi-du-hinh.json', 'kiem-hinh.bundle.mjs']) fs.copyFileSync(path.join(DAY, f), path.join(dC, f))
      fs.copyFileSync(path.join(DAY, 'kiem-lo.mjs'), path.join(dC, 'kiem.mjs'))
      const kC = await chayClaude(dC, NHAC_VE(canVe.length), canVe.length, ',Bash(node kiem.mjs),Bash(node kiem.mjs:*)')
      if (!kC.ok) console.log(`[${gio()}] luồng ${luong}: phiên vẽ lỗi (${kC.giay}s) ${kC.loi.replace(/\d{4,}/g, '…').slice(0, 140)}`)
      if (kC.hetHan) { console.log(`[${gio()}] luồng ${luong}: có vẻ hết hạn mức Claude — nghỉ 30 phút`); await ngu(1_800_000) }
    }
    // 3) nộp
    const dong = { dat: 0, giuGoc: 0, lech: 0 }
    for (const v of viec) {
      const k = khop.get(v.bam)
      let body
      if (!k.a || !k.b) { console.log(`  ${v.bam}: phiên âm thiếu — để máy chủ giữ hàng chờ`); continue }
      if (!k.ok) body = { bam: v.bam, giuGoc: true, lyDo: 'hai lượt phiên âm lệch nhau', phienAm1: k.a, phienAm2: k.b }
      else if (!k.a.length) body = { bam: v.bam, giuGoc: true, lyDo: 'ảnh không có chữ — giữ ảnh gốc', phienAm1: k.a, phienAm2: k.b }
      else {
        const ra = dC ? docJson(path.join(dC, 'ra', `${v.bam}.json`)) : null
        if (!ra) { console.log(`  ${v.bam}: chưa có cảnh — để máy chủ giữ hàng chờ`); continue }
        body = ra.giuGoc === true ? { bam: v.bam, giuGoc: true, lyDo: String(ra.lyDo || 'khuôn chưa hỗ trợ'), phienAm1: k.a, phienAm2: k.b } : { bam: v.bam, canh: ra, phienAm1: k.a, phienAm2: k.b }
      }
      if (co('--thu')) { console.log(`  ${v.bam}: ${body.giuGoc ? 'GIỮ GỐC · ' + body.lyDo : 'có cảnh ' + (body.canh?.canh?.loai || '?')} (chạy thử, không nộp)`); continue }
      const r = await goi('/kho/hinh-ve/nop', body)
      dem.nop++
      if (r.ok && r.ket === 'dat') { dem.dat++; dong.dat++ } else if (r.ok && r.ket === 'giu_goc') { dem.giuGoc++; dong.giuGoc++ } else { dem.lech++; dong.lech++; console.log(`  ${v.bam}: ${String(r.lyDo || r.error || '').slice(0, 140)}`) }
    }
    console.log(`[${gio()}] luồng ${luong}: lô ${viec.length} ảnh · vẽ ${dong.dat} · giữ gốc ${dong.giuGoc} · lệch ${dong.lech} · tổng ${JSON.stringify(dem)}${co('--thu') ? ` · CHẠY THỬ, xem ${path.relative(GOC, path.dirname(dA))}` : ''}`)
    if (co('--thu')) return
  }
}

if (co('--nap-hang')) {
  let tu = 0, tongAnh = 0, tongMoi = 0
  for (let i = 0; i < 400; i++) {
    const r = await goi('/kho/hinh-ve/nap-hang', { tu, so: 8 })
    if (!r.ok) { console.log('Lỗi:', r.error); process.exit(1) }
    tongAnh += r.soAnh; tongMoi += r.moi
    if (r.loi?.length) console.log('  lỗi tờ:', r.loi.slice(0, 3).join(' · '))
    if (!r.tiep) break
    tu = r.tiep
  }
  console.log(JSON.stringify({ soAnh: tongAnh, vaoHangMoi: tongMoi })); process.exit(0)
}
if (co('--tong')) {
  const t = await goi('/kho/hinh-ve/tong', {})
  if (!t.ok) { console.log('Lỗi:', t.error); process.exit(1) }
  console.log('Hàng việc:', JSON.stringify(Object.fromEntries((t.hang || []).map((x) => [x.trang_thai, x.n])))); console.log('Kết quả:', JSON.stringify(Object.fromEntries((t.ban || []).map((x) => [x.cong, x.n]))))
  console.log(`Kho: ${t.anhTrongKho} ảnh của đề · ${t.cauCoHinh} câu có hình`); process.exit(0)
}
console.log(`[${gio()}] Máy vẽ hình của đề: ${LUONG} luồng × ${SO_ANH} ảnh/lô${MODEL ? ' · model ' + MODEL : ''}${co('--thu') ? ' · CHẠY THỬ' : ''} · ${os.hostname()}`)
await Promise.all(Array.from({ length: co('--thu') ? 1 : LUONG }, (_, i) => motLuong(i + 1)))
console.log(`[${gio()}] Xong: ${JSON.stringify(dem)}`)
