#!/usr/bin/env node
// MÁY SOẠN LỜI GIẢI KÍNH bằng Claude Code (thầy 02/11: «khi hết hạn mức thì chuyển sang phiên này giải luôn, liên tục không dừng tới lúc xong»).
// Chạy ở phiên Claude Code đám mây (hoặc máy thầy) có biến OMR_MA_BI_MAT. KHÔNG in mã, KHÔNG in đề / đáp án (chỉ số đếm + qid).
//
//   node scripts/loi-giai-kinh/may-soan-kinh.mjs --nap-hang        # xếp cả kho vào hàng (gọi lại được)
//   node scripts/loi-giai-kinh/may-soan-kinh.mjs --tong            # số phủ: đạt / tổng
//   node scripts/loi-giai-kinh/may-soan-kinh.mjs                   # 4 luồng, chạy tới hết hàng (hết thì 10 phút hỏi lại, có việc trả lại là làm tiếp)
//   node scripts/loi-giai-kinh/may-soan-kinh.mjs --bu-goc         # bù chữ phương án gốc cho bản nộp trước 03/11 (gọi lại được)
//   node scripts/loi-giai-kinh/may-soan-kinh.mjs --thu             # 1 lô 3 câu, KHÔNG nộp (soát chất lượng)
//   Tuỳ chọn: --luong 4 · --so 10 · --mot-lan (hết hàng thì dừng) · --model <tên> · --bo ESTER
//
// Mỗi lô: máy chủ phát tới N câu CÙNG CHƯƠNG ⇒ .may-soan-kinh/<ngày>/<lô>/ (vao/, mục kiến thức gần nhất của skill lý thuyết, bảng thần chú, 3 bản mẫu
// thầy duyệt, bộ kiểm) ⇒ `claude -p` soạn + tự kiểm ⇒ máy này kiểm lại ⇒ nộp; máy chủ kiểm lần nữa với đáp án KHO rồi mới lưu.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { THAN_CHU } from './kiem-kinh.bundle.mjs'

const DAY = path.dirname(fileURLToPath(import.meta.url))
const GOC = path.resolve(DAY, '../..')
const argv = process.argv.slice(2)
const co = (k) => argv.includes(k)
const lay = (k, md) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : md }
const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const LUONG = Math.max(1, Math.min(10, Number(lay('--luong', '4')) || 4))
const SO_CAU = co('--thu') ? 3 : Math.max(1, Math.min(20, Number(lay('--so', '10')) || 10))
const MODEL = lay('--model', '')
const BO = lay('--bo', '')
const THU_MUC_LAM = process.env.OMR_THU_MUC_LAM || path.join(GOC, '.may-soan-kinh')
const SECRET = (process.env.OMR_MA_BI_MAT || '').trim()
if (!SECRET) { console.error('Thiếu biến OMR_MA_BI_MAT.'); process.exit(2) }

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

// ---------------------------------------------------------------- chọn mục kiến thức gần nhất (skill lý thuyết của thầy)
const TRI_THUC = docJson(path.join(DAY, 'tri-thuc.json'))
if (!TRI_THUC) { console.error('Thiếu tri-thuc.json — chạy node scripts/loi-giai-kinh/dung-tri-thuc.mjs'); process.exit(2) }
// Skill viết theo chữ cũ (este, axit, ancol…), đề viết theo SGK mới (ester, acid, alcohol…) ⇒ đưa cả hai về một dạng trước khi so.
const DONG_NGHIA = { ester: 'este', acid: 'axit', alcohol: 'ancol', aldehyde: 'anđehit', oxide: 'oxit', amine: 'amin', base: 'bazơ', ketone: 'xeton', lipid: 'lipit', polymer: 'polyme', carbohydrate: 'cacbohiđrat' }
const tu = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/<[^>]*>/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter((w) => w.length >= 2).map((w) => DONG_NGHIA[w] ?? w)
const BO_CHU = { ESTER: 'ester este lipit lipid', CARBOHYDRATE: 'carbohydrat glucose saccharose tinh bột cellulose', CAN_BANG: 'cân bằng', HOP_CHAT_N: 'amin amino peptide protein nitrogen',
  POLYMER: 'polyme polymer', DIEN_PHAN: 'điện phân pin điện hoá', KIM_LOAI: 'kim loại', KIM_LOAI_IA_IIA: 'nhóm ia iia', NITROGEN_SULFUR: 'nitrogen sulfur nitric ammonia',
  NGUYEN_TU: 'nguyên tử cấu hình electron', PHUC_CHAT: 'phức chất', HYDROCARBON: 'hydrocarbon alkane alkene', ALCOHOL_PHENOL: 'ancol alcohol phenol', CARBONYL_ACID: 'carbonyl aldehyde acid carboxylic',
  HALOGEN: 'halogen', LIEN_KET: 'liên kết', NANG_LUONG_HH: 'năng lượng enthalpy nhiệt', OXI_HOA_KHU: 'oxi hoá khử oxh', TOC_DO: 'tốc độ', BANG_TUAN_HOAN: 'bảng tuần hoàn', HUU_CO_DAI_CUONG: 'hữu cơ nền tảng' }
const MUC = TRI_THUC.muc.map((m) => {
  const ten = new Set(tu(m.ten)), than = new Set([...tu(m.buoc.join(' ')), ...tu(m.meo), ...tu(m.nham), ...tu(m.bai)])
  return { m, ten, than, bai: m.bai.toLowerCase() }
})
const DF = new Map()
for (const x of MUC) for (const w of new Set([...x.ten, ...x.than])) DF.set(w, (DF.get(w) || 0) + 1)
const IDF = (w) => Math.log(1 + MUC.length / (1 + (DF.get(w) || 0)))
function chonMuc(v, toiDa = 6) {
  const q = new Set(tu([v.deTho || v.de, ...(v.y || []).map((y) => y.t), v.chuong].join(' ')))
  const goiY = tu(BO_CHU[v.bo] || '')
  const diem = MUC.map((x) => {
    let d = 0
    for (const w of q) { if (x.ten.has(w)) d += 2 * IDF(w); else if (x.than.has(w)) d += IDF(w) }
    if (goiY.some((w) => x.bai.includes(w))) d *= 1.3
    return { m: x.m, d }
  }).filter((x) => x.d > 0).sort((a, b) => b.d - a.d)
  return diem.slice(0, toiDa).map((x) => x.m)
}

// ---------------------------------------------------------------- dựng lô
const BO_KIEM_LO = `import fs from 'node:fs'
import { THAN_CHU } from './kiem-kinh.bundle.mjs'
let dat = 0, tong = 0
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json') && !x.endsWith('.muc.json')).sort()) {
  tong++
  const v = JSON.parse(fs.readFileSync('vao/' + f, 'utf8')), muc = JSON.parse(fs.readFileSync('vao/' + f.replace(/\\.json$/, '.muc.json'), 'utf8'))
  if (!fs.existsSync('ra/' + f)) { console.log(f + ': CHƯA CÓ ra/' + f); continue }
  let ban = null; try { ban = JSON.parse(fs.readFileSync('ra/' + f, 'utf8')) } catch (e) { console.log(f + ': TRƯỢT · JSON hỏng ' + e.message); continue }
  const dapAn = v.phan === 'III' ? String(v.dapAn?.kq ?? '') : v.phan === 'I' ? (Object.entries(v.dapAn || {}).find(([, d]) => d === 'D')?.[0] ?? '') : ['a','b','c','d'].map((k) => v.dapAn?.[k] ?? '?').join('')
  const luaChon = v.phan === 'I' ? Object.fromEntries((v.y || []).map((y) => [y.id, String(y.t || '').replace(/<[^>]*>/g, ' ')])) : undefined
  const kiemSo = ({ soDo, buoc, ketQua }) => { const k = kiemCong({ qid: v.qid, phienBan: 1, deNoiGi: '', ...(soDo ? { soDo } : {}), buoc, ...(ketQua ? { ketQua } : {}) }, { phan: v.phan, dapAn, ...(luaChon ? { luaChon } : {}) }); return { ok: k.ket === 'dat' || k.ket === 'lo_dap_an', lyDo: k.lyDo } }
  const k = kiemBanKinh(ban, { phan: v.phan, dapAn, qid: v.qid, kiemSo, nguon: { thanChu: THAN_CHU.map((t) => t.chu), thayNoi: muc.flatMap((m) => m.noi), meo: muc.map((m) => m.meo).filter(Boolean) } })
  if (k.ket === 'dat') dat++
  console.log(f + ': ' + (k.ket === 'dat' ? 'ĐẠT' : k.ket.toUpperCase() + ' · ' + k.lyDo) + (k.boKhoi.length ? '\\n   ! bỏ khối: ' + k.boKhoi.join('; ') : ''))
}
console.log('TỔNG: ' + dat + '/' + tong + ' đạt')
`
function dungLo(lo, luong) {
  const dir = path.join(THU_MUC_LAM, new Date().toISOString().slice(0, 10), `${luong}-${lo.bo || 'X'}-${lo.maLuot.slice(0, 8)}`)
  fs.mkdirSync(path.join(dir, 'vao/img'), { recursive: true }); fs.mkdirSync(path.join(dir, 'ra'), { recursive: true })
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
    const vao = { ...v, hinh }
    const muc = chonMuc(v)
    fs.writeFileSync(path.join(dir, 'vao', ten), JSON.stringify(vao, null, 1))
    fs.writeFileSync(path.join(dir, 'vao', ten.replace(/\.json$/, '.muc.json')), JSON.stringify(muc, null, 1))
    tep.push({ ten, vao, muc })
  })
  fs.writeFileSync(path.join(dir, 'than-chu.json'), JSON.stringify(THAN_CHU, null, 1))
  for (const f of ['goi-may-soan-kinh.md', 'vi-du-kinh.json', 'tu-duy-day-hoa.md', 'kiem-kinh.bundle.mjs']) fs.copyFileSync(path.join(DAY, f), path.join(dir, f))
  fs.writeFileSync(path.join(dir, 'kiem.mjs'), BO_KIEM_LO)
  return { dir, tep }
}
function moiTruongPhienSoan() {
  const env = { ...process.env, OMR_MA_BI_MAT: '' }
  for (const k of Object.keys(env)) if (/^(CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|SYNC_SESSION_REFS|POST_FOR_SESSION_INGRESS_V2|MESSAGING_\w+))$/.test(k)) delete env[k]
  return env
}
const NHAC = (n) => `Đọc goi-may-soan-kinh.md trong thư mục hiện tại và làm đúng. Lô này có ${n} câu trong vao/ (mỗi câu kèm tệp .muc.json). Ghi lời giải vào ra/ (cùng tên tệp), chạy node kiem.mjs, sửa tới khi ĐẠT. Trả lời cuối đúng 1 dòng.`
function chayClaude(dir, soCau) {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', 'Read,Write,Edit,Glob,Bash(node kiem.mjs),Bash(node kiem.mjs:*)', '--max-turns', String(60 + soCau * 14)]
  if (MODEL) thamSo.push('--model', MODEL)
  return new Promise((xong) => {
    const t0 = Date.now()
    const p = spawn('claude', thamSo, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], env: moiTruongPhienSoan() })
    let ra = '', loi = ''
    p.stdout.on('data', (d) => { ra += d }); p.stderr.on('data', (d) => { loi += d })
    p.on('error', (e) => xong({ ok: false, loi: 'không chạy được claude: ' + e.message, giay: 0 }))
    p.on('close', (ma) => { let j = null; try { j = JSON.parse(ra) } catch { /* */ } xong({ ok: ma === 0, giay: Math.round((Date.now() - t0) / 1000), ketQua: j?.result, hetHan: /limit|quota|usage/i.test(String(j?.result || loi)) && ma !== 0, loi: ma === 0 ? '' : (loi || ra).slice(0, 300) }) })
    p.stdin.end(NHAC(soCau))
  })
}

// ---------------------------------------------------------------- một luồng
const dem = { lo: 0, nop: 0, dat: 0, truot: 0, nghi: 0 }
async function motLuong(luong) {
  for (;;) {
    const lo = await goi('/kho/loi-giai-kinh/viec', { so: SO_CAU, ...(BO ? { bo: BO } : {}) })
    if (!lo.ok) { console.log(`[${gio()}] luồng ${luong}: lỗi nhận việc: ${String(lo.error).slice(0, 120)}`); await ngu(60_000); continue }
    if (lo.het || !lo.viec?.length) { if (co('--mot-lan') || co('--thu')) return; console.log(`[${gio()}] luồng ${luong}: hết hàng, 10 phút hỏi lại`); await ngu(600_000); continue }
    const viec = co('--thu') ? lo.viec.slice(0, 3) : lo.viec
    const { dir, tep } = dungLo({ ...lo, viec }, luong)
    dem.lo++
    const kq = await chayClaude(dir, tep.length)
    if (!kq.ok) console.log(`[${gio()}] luồng ${luong}: phiên soạn lỗi (${kq.giay}s) ${kq.loi.replace(/\d{4,}/g, '…').slice(0, 160)}`)
    if (kq.hetHan) { console.log(`[${gio()}] luồng ${luong}: có vẻ hết hạn mức Claude — nghỉ 30 phút`); await ngu(1_800_000) }
    let datLo = 0
    for (const { ten, vao, muc } of tep) {
      const ban = docJson(path.join(dir, 'ra', ten))
      if (!ban) continue
      if (co('--thu')) continue
      const { nghiDapAn, ...banGon } = ban
      const r = await goi('/kho/loi-giai-kinh/nop', { qid: vao.qid, bam: vao.bam, ban: banGon, nguonMay: 'claude', ...(nghiDapAn ? { nghiDapAn: String(nghiDapAn) } : {}),
        nguon: { thayNoi: muc.flatMap((m) => m.noi), meo: muc.map((m) => m.meo).filter(Boolean) } })
      dem.nop++
      if (r.ok && r.ket === 'dat') { dem.dat++; datLo++; if (r.nghiDapAn) dem.nghi++ } else dem.truot++
    }
    console.log(`[${gio()}] luồng ${luong}: lô ${lo.bo} ${datLo}/${tep.length} đạt (${kq.giay}s) · tổng đạt ${dem.dat}, trượt ${dem.truot}, nghi đáp án ${dem.nghi}${co('--thu') ? ` · CHẠY THỬ, xem ${path.relative(GOC, dir)}` : ''}`)
    if (co('--thu')) return
  }
}

if (co('--bu-goc')) {
  for (let i = 0; i < 500; i++) { const r = await goi('/kho/loi-giai-kinh/bu-goc', {}); console.log(JSON.stringify(r)); if (!r.ok || !r.con) break }
  process.exit(0)
}
if (co('--nap-hang')) { console.log(JSON.stringify(await goi('/kho/loi-giai-kinh/nap-hang', {}))); process.exit(0) }
if (co('--tong')) {
  const t = await goi('/kho/loi-giai-kinh/tong', {})
  if (!t.ok) { console.log('Lỗi:', t.error); process.exit(1) }
  const cong = {}; for (const x of t.ban) cong[`${x.phan}·${x.cong}${x.nghi ? '·nghi' : ''}`] = x.n
  const hang = {}; for (const x of t.hang) hang[`${x.phan}·${x.trang_thai}`] = x.n
  console.log('Bản Kính (phiên bản', t.phienBan + '):', JSON.stringify(cong)); console.log('Hàng việc:', JSON.stringify(hang))
  process.exit(0)
}
console.log(`[${gio()}] Máy soạn Lời giải Kính: ${LUONG} luồng × ${SO_CAU} câu/lô${MODEL ? ' · model ' + MODEL : ''}${co('--thu') ? ' · CHẠY THỬ' : ''} · ${os.hostname()}`)
await Promise.all(Array.from({ length: co('--thu') ? 1 : LUONG }, (_, i) => motLuong(i + 1)))
console.log(`[${gio()}] Xong: ${JSON.stringify(dem)}`)
