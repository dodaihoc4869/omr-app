#!/usr/bin/env node
// RUNNER NGOẠI TUYẾN — soạn song sinh + xuất gói bàn giao, KHÔNG nộp vào D1 thật.
//
//   node scripts/loi-giai/song-sinh-ngoai-tuyen.mjs                   # 2 luồng, mọi khối, soạn mãi đến khi xong
//   node scripts/loi-giai/song-sinh-ngoai-tuyen.mjs --mot-lan         # làm hết rồi dừng
//   node scripts/loi-giai/song-sinh-ngoai-tuyen.mjs --lop 12 --so 4   # chỉ khối 12, 4 câu/lô
//   node scripts/loi-giai/song-sinh-ngoai-tuyen.mjs --xuat-goi        # chỉ tạo manifest/do-phu từ checkpoint đã có
//
//   Tùy chọn: --luong 2 · --lop 12 · --so 6 (câu/lô) · --model <tên>
//             --sau <qid>  (bắt đầu từ con trỏ checkpoint)
//
// Yêu cầu:
//   - `claude` CLI đã đăng nhập (gói Claude, KHÔNG dùng ANTHROPIC_API_KEY).
//   - OMR_MA_BI_MAT: mã bí mật Worker ĐÃ DEPLOY với endpoint /kho/may-soan/xuat-cau-cho-sinh.
//   - Worker đã deploy từ commit chứa hàm xuatCauChoSinh (nhánh claude/laughing-bohr-1ixzp4).
//
// ĐẦU RA: .may-soan/ban-giao-sau-ban/<bam>/{goc,da-co,soan,kiem-mu-vao,kiem-mu-ra,ung-vien}.json
//         .may-soan/ban-giao-sau-ban/checkpoint.json (cursor để --resume)
//         .may-soan/ban-giao-sau-ban/do-phu-qid.json (sau --xuat-goi)
//         .may-soan/ban-giao-sau-ban/manifest.json   (sau --xuat-goi)

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cauGocTuVao, dungVaoMu, docTraLoiMu, ghepHaiLuot, kiemBoTro } from './kiem.bundle.mjs'

const DAY = path.dirname(fileURLToPath(import.meta.url))
const GOC = path.resolve(DAY, '../..')
const argv = process.argv.slice(2)
const co = (k) => argv.includes(k)
const lay = (k, md) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : md }

const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const LUONG = Math.max(1, Math.min(4, Number(lay('--luong', '2')) || 2))
const LOP = lay('--lop', '') === 'tat-ca' ? '' : lay('--lop', '')
const SO_CAU_LO = Math.max(1, Math.min(12, Number(lay('--so', '4')) || 4))
const MODEL = lay('--model', '')
const PHUT_CHO_KHI_HET = 30
const THU_MUC_BAN_GIAO = path.join(GOC, '.may-soan', 'ban-giao-sau-ban')
const THU_MUC_LAM = path.join(GOC, '.may-soan', 'lo-ngoai-tuyen')
const CHECKPOINT = path.join(THU_MUC_BAN_GIAO, 'checkpoint.json')

function maBiMat() {
  if (process.env.OMR_MA_BI_MAT) return process.env.OMR_MA_BI_MAT.trim()
  const tep = path.join(os.homedir(), '.omr-ma-bi-mat')
  if (fs.existsSync(tep)) return fs.readFileSync(tep, 'utf8').trim()
  console.error('Thiếu OMR_MA_BI_MAT: đặt biến môi trường hoặc ghi vào ~/.omr-ma-bi-mat.')
  process.exit(2)
}
const SECRET = maBiMat()

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const gio = () => new Date().toLocaleTimeString('vi-VN', { hour12: false })
const docJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }
const ghiJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)) }

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

/** Loại biến môi trường liên quan đến phiên cha để phiên con không ghi chung nhật ký/định danh. */
function moiTruongSon() {
  const env = { ...process.env, OMR_MA_BI_MAT: '' }
  for (const k of Object.keys(env)) {
    if (/^(CLAUDECODE|SESSION_INGRESS_URL|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|SYNC_SESSION_REFS|POST_FOR_SESSION_INGRESS_V2|MESSAGING_\w+))$/.test(k)) delete env[k]
  }
  return env
}

function chayClaude(dir, soCau, loiNhac, cong = 'Read,Write,Edit,Glob', luot = 40 + soCau * 12) {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', cong, '--max-turns', String(luot)]
  if (MODEL) thamSo.push('--model', MODEL)
  return new Promise((xong) => {
    const t0 = Date.now()
    const p = spawn('claude', thamSo, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'], env: moiTruongSon() })
    let ra = '', loi = ''
    p.stdout.on('data', (d) => { ra += d })
    p.stderr.on('data', (d) => { loi += d })
    p.on('error', (e) => xong({ ok: false, loi: 'không chạy được claude: ' + e.message, giay: 0 }))
    p.on('close', (ma) => {
      let j = null; try { j = JSON.parse(ra) } catch { j = null }
      xong({ ok: ma === 0, ma, giay: Math.round((Date.now() - t0) / 1000), usage: j?.usage, ketQua: j?.result, loi: ma === 0 ? '' : (loi || ra).slice(0, 800) })
    })
    p.stdin.end(loiNhac)
  })
}

// Lời nhắc soạn học liệu: phiên soạn chỉ viết bo-tro/, không soạn hồ sơ (can.hoSo = false).
const NHAC_SOAN = (n) => `Đọc goi-may-soan.md trong thư mục hiện tại và làm đúng. Lô này có ${n} câu trong vao/. \
Tất cả câu đều có can.hoSo = false — KHÔNG viết ra/. \
Chỉ viết bo-tro/ (cùng tên tệp) với đủ bản khác (banKhac) và ý Đúng–Sai mới (yDs) theo vao.can. \
Chạy node kiem-hl.mjs để tự kiểm học liệu và sửa.`

// Lời nhắc giải mù (giống goi-kiem-mu.md nhưng tên danh sách sẵn trong nhắc).
const NHAC_MU = (ten) => `Đọc goi-kiem-mu.md trong thư mục hiện tại và làm đúng. \
Có ${ten.length} tệp cần giải (đọc trong vao/, danh sách ở danh-sach.txt): ${ten.join(', ')}. \
Ghi kết quả vào ra/ (cùng tên tệp).`

// Bộ kiểm học liệu trong thư mục lô (chỉ bo-tro/, không có ra/).
const BO_KIEM_HL = `import fs from 'node:fs'
import { kiemBoTro, cauGocTuVao } from './kiem.bundle.mjs'
let dat = 0, tong = 0
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json')).sort()) {
  const vao = JSON.parse(fs.readFileSync('vao/' + f, 'utf8'))
  const can = vao.can || {}
  if (!(can.banKhac > 0 || can.yDs > 0)) continue
  tong++
  const btf = 'bo-tro/' + f
  if (!fs.existsSync(btf)) { console.log(f + ': CHƯA CÓ bo-tro/' + f); continue }
  let bt; try { bt = JSON.parse(fs.readFileSync(btf, 'utf8')) } catch (e) { console.log(f + ': JSON hỏng ' + e.message); continue }
  const { loi, canhBao } = kiemBoTro(cauGocTuVao(vao), can, bt, vao.daCo || { banKhac: [], yDs: [] })
  if (!loi.length) dat++
  console.log(f + ': ' + (loi.length ? 'TRƯỢT\\n  ✕ ' + loi.join('\\n  ✕ ') : 'ĐẠT') + (canhBao.length ? '\\n  ! ' + canhBao.join('\\n  ! ') : ''))
}
console.log('TỔNG: ' + dat + '/' + tong + ' đạt')
`

/** Dựng thư mục lô (chỉ học liệu, không có ra/). */
function dungLo(cauViec, cauGoc, luong) {
  const ngay = new Date().toISOString().slice(0, 10)
  const bam0 = cauViec[0]?.bam ?? 'X'
  const dir = path.join(THU_MUC_LAM, ngay, `${luong}-${bam0.slice(0, 8)}-${Date.now().toString(36)}`)
  fs.mkdirSync(path.join(dir, 'vao/img'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'bo-tro'), { recursive: true })
  const tep = []
  for (let i = 0; i < cauViec.length; i++) {
    const v = cauViec[i], c = cauGoc[i]
    if (!c) continue
    const ten = `${String(i + 1).padStart(2, '0')}-${v.qid}.json`
    const vao = { ...v, can: { hoSo: false, ...v.can } }
    fs.writeFileSync(path.join(dir, 'vao', ten), JSON.stringify(vao, null, 1))
    tep.push({ ten, vao, cauGoc: c })
  }
  fs.writeFileSync(path.join(dir, 'bo.json'), JSON.stringify({}, null, 1))
  for (const f of ['goi-may-soan.md', 'vi-du-bo-tro.json', 'kiem.bundle.mjs']) {
    const src = path.join(DAY, f)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f))
  }
  fs.writeFileSync(path.join(dir, 'kiem-hl.mjs'), BO_KIEM_HL)
  return { dir, tep }
}

/** Lượt kiểm mù: thư mục tạm riêng, chỉ có đề/phương án/ý, phiên Claude chỉ Read+Write. */
async function kiemMu(dirLo, viecMu) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'omr-mu-'))
  try {
    fs.mkdirSync(path.join(tam, 'vao/img'), { recursive: true })
    fs.mkdirSync(path.join(tam, 'ra'), { recursive: true })
    const gmSrc = path.join(DAY, 'goi-kiem-mu.md')
    if (fs.existsSync(gmSrc)) fs.copyFileSync(gmSrc, path.join(tam, 'goi-kiem-mu.md'))
    const ten = []
    for (const { te, vaoMu } of viecMu) {
      fs.writeFileSync(path.join(tam, 'vao', te), JSON.stringify(vaoMu, null, 1))
      ten.push(te)
    }
    fs.writeFileSync(path.join(tam, 'danh-sach.txt'), ten.join('\n') + '\n')
    const soMuc = viecMu.reduce((s, x) => s + (x.vaoMu?.muc?.length ?? 0), 0)
    const kq = await chayClaude(tam, viecMu.length, NHAC_MU(ten), 'Read,Write', 20 + soMuc * 4)
    const tra = new Map()
    for (const { te } of viecMu) tra.set(te, docTraLoiMu(docJson(path.join(tam, 'ra', te))))
    // Sao chép vao/ + ra/ vào dirLo/kiem-mu/ để soát lại.
    fs.cpSync(tam, path.join(dirLo, 'kiem-mu'), { recursive: true })
    return { kq, tra, soMuc }
  } finally {
    fs.rmSync(tam, { recursive: true, force: true })
  }
}

/** Lưu kết quả một câu vào gói bàn giao. */
function luuGoi(bam, ten, vao, btRaw, traLuotMu, hopLe) {
  const dir = path.join(THU_MUC_BAN_GIAO, 'noi-dung', bam)
  fs.mkdirSync(dir, { recursive: true })
  ghiJson(path.join(dir, 'goc.json'), { qid: vao.qid, bam, dang: vao.dang, phan: vao.phan, deTho: vao.deTho, dapAn: vao.dapAn })
  ghiJson(path.join(dir, 'da-co.json'), vao.daCo ?? { banKhac: [], yDs: [] })
  if (btRaw) ghiJson(path.join(dir, 'soan.json'), btRaw)
  // kiem-mu-vao / kiem-mu-ra
  if (traLuotMu !== null) {
    const muVao = (btRaw?.songSinh ?? btRaw?.yMoi ?? []).map((m, i) => ({ id: `ss${i + 1}`, ...m }))
    ghiJson(path.join(dir, 'kiem-mu-vao.json'), muVao)
    ghiJson(path.join(dir, 'kiem-mu-ra.json'), traLuotMu ?? [])
  }
  // ung-vien: chỉ bản/ý vượt qua hai lượt
  if (hopLe) {
    const ungVien = vao.dang === 'ds'
      ? { qid: vao.qid, bam, yMoi: hopLe.yMoi }
      : { qid: vao.qid, bam, songSinh: hopLe.songSinh }
    ghiJson(path.join(dir, 'ung-vien.json'), ungVien)
  }
}

let dung = false
process.on('SIGINT', () => { if (dung) process.exit(130); dung = true; console.log(`\n[${gio()}] Dừng — đợi lô đang chạy xong.`) })

async function motLuong(luong) {
  let sau = docJson(CHECKPOINT)?.[`luong${luong}`] ?? (lay('--sau', '') || '')
  while (!dung) {
    const res = await goi('/kho/may-soan/xuat-cau-cho-sinh', { sau, so: SO_CAU_LO, lop: LOP })
    if (!res.ok) { console.log(`[${gio()}] luồng ${luong}: lỗi từ Worker — ${res.error}`); await ngu(30_000); continue }
    const cauViec = res.viec ?? []
    if (!cauViec.length) {
      if (co('--mot-lan')) return
      console.log(`[${gio()}] luồng ${luong}: hết câu, ${PHUT_CHO_KHI_HET} phút nữa hỏi lại`)
      await ngu(PHUT_CHO_KHI_HET * 60_000)
      continue
    }
    // cauGocTuVao cần trường dang/phan/dapAn... lấy từ viec.
    const cauGocList = cauViec.map((v) => cauGocTuVao(v))
    const tepHopLe = cauViec.map((v, i) => cauGocList[i] ? v : null).filter(Boolean)
    const tuChoi = cauViec.length - tepHopLe.length
    if (tuChoi) console.log(`[${gio()}] luồng ${luong}: loại ${tuChoi} câu ngoài phạm vi (tự luận hoặc hỏng)`)
    if (!tepHopLe.length) { sau = res.tiep ?? ''; continue }

    const { dir, tep } = dungLo(tepHopLe, tepHopLe.map((v) => cauGocTuVao(v)), luong)
    console.log(`[${gio()}] luồng ${luong}: ${tep.length} câu → ${path.relative(GOC, dir)}`)

    // LƯỢT SOẠN: phiên soạn viết bo-tro/.
    const kqSoan = await chayClaude(dir, tep.length, NHAC_SOAN(tep.length), 'Read,Write,Edit,Glob,Bash(node kiem-hl.mjs)', 40 + tep.length * 12)
    if (!kqSoan.ok) console.log(`[${gio()}] luồng ${luong}: phiên soạn lỗi — ${kqSoan.loi}`)

    // KIỂM TRƯỚC MÙ: lọc qua kiemBoTro.
    const kiemTruocMu = tep.map(({ ten, vao, cauGoc }) => {
      const bt = docJson(path.join(dir, 'bo-tro', ten))
      if (!bt || !cauGoc) return { ten, vao, cauGoc, bt: null, hopLe: { songSinh: [], yMoi: [] }, boKiem: { songSinh: [], yMoi: [] } }
      const r = kiemBoTro(cauGoc, vao.can ?? {}, bt, vao.daCo ?? { banKhac: [], yDs: [] })
      return { ten, vao, cauGoc, bt, hopLe: { songSinh: r.songSinh, yMoi: r.yMoi }, boKiem: { songSinh: r.boSongSinh, yMoi: r.boY } }
    })

    // LƯỢT KIỂM MÙ: chỉ câu có học liệu qua vòng kiểm cấu trúc.
    const viecMu = kiemTruocMu
      .filter((x) => x.cauGoc && (x.hopLe.songSinh.length > 0 || x.hopLe.yMoi.length > 0))
      .map((x) => ({ te: x.ten, vaoMu: dungVaoMu(x.cauGoc, x.hopLe, false) }))
      .filter((x) => x.vaoMu && x.vaoMu.muc?.length > 0)

    let mu = { kq: null, tra: new Map(), soMuc: 0 }
    if (viecMu.length) {
      mu = await kiemMu(dir, viecMu)
      console.log(`[${gio()}] luồng ${luong}: giải mù ${viecMu.length} câu · ${mu.soMuc} mục${mu.kq.ok ? '' : ' — lỗi: ' + mu.kq.loi}`)
    }

    // GHÉP + LƯU GÓI
    let soGiu = 0, soLo = 0
    for (const x of kiemTruocMu) {
      const tra = mu.tra.get(x.ten) ?? null
      const g = x.cauGoc ? ghepHaiLuot(x.cauGoc, x.hopLe, tra) : { songSinh: [], yMoi: [] }
      soGiu += g.songSinh.length + g.yMoi.length
      soLo += (x.hopLe.songSinh.length - g.songSinh.length) + (x.hopLe.yMoi.length - g.yMoi.length)
      luuGoi(x.vao.bam, x.ten, x.vao, x.bt, tra, g)
    }
    console.log(`[${gio()}] luồng ${luong}: ghép — giữ ${soGiu} · loại ${soLo}`)

    // Cập nhật checkpoint.
    const cp = docJson(CHECKPOINT) ?? {}
    cp[`luong${luong}`] = res.tiep ?? ''
    cp.capNhat = new Date().toISOString()
    ghiJson(CHECKPOINT, cp)
    sau = res.tiep ?? ''
    if (co('--mot-lan') && !res.tiep) return
  }
}

/** Tổng hợp gói bàn giao từ noi-dung/<bam>/ung-vien.json đã lưu. */
function xuatGoi() {
  const noicDungDir = path.join(THU_MUC_BAN_GIAO, 'noi-dung')
  if (!fs.existsSync(noicDungDir)) { console.log('Chưa có noi-dung/ — cần chạy soạn trước.'); return }
  const bams = fs.readdirSync(noicDungDir).filter((f) => fs.statSync(path.join(noicDungDir, f)).isDirectory())
  const doPhu = {}, stat = { tong: 0, duSauBangChung: 0, motPhan: 0, chuaCo: 0 }
  for (const bam of bams) {
    const uv = docJson(path.join(noicDungDir, bam, 'ung-vien.json'))
    const goc = docJson(path.join(noicDungDir, bam, 'goc.json'))
    if (!goc) continue
    stat.tong++
    const soSS = uv?.songSinh?.length ?? 0, soY = uv?.yMoi?.length ?? 0
    const du = goc.dang === 'ds' ? soY >= 24 : soSS >= 6
    if (du) stat.duSauBangChung++
    else if (soSS + soY > 0) stat.motPhan++
    else stat.chuaCo++
    doPhu[goc.qid] = { bam, phan: goc.phan, soBanCauTruc: soSS, soDaKiem: soSS, soYCauTruc: soY, soYDaKiem: soY, trangThai: du ? 'du' : soSS + soY > 0 ? 'mot_phan' : 'chua_co' }
  }
  ghiJson(path.join(THU_MUC_BAN_GIAO, 'do-phu-qid.json'), doPhu)
  const manifest = {
    phienBan: '0.1',
    luc: new Date().toISOString(),
    nguon: MAY_CHU,
    ghi_chu: 'Ứng viên đã tự kiểm hai lượt AI. Chưa được Codex kiểm độc lập. Chưa nạp D1.',
    so_bam: bams.length,
    thong_ke: stat,
    checkpoint: docJson(CHECKPOINT),
  }
  ghiJson(path.join(THU_MUC_BAN_GIAO, 'manifest.json'), manifest)
  console.log(`[${gio()}] Gói bàn giao: ${bams.length} bam · ${stat.duSauBangChung} đủ 6 · ${stat.motPhan} một phần · ${stat.chuaCo} chưa có.`)
  console.log(`  → ${path.relative(GOC, THU_MUC_BAN_GIAO)}`)
}

async function main() {
  if (co('--xuat-goi')) { xuatGoi(); return }
  fs.mkdirSync(THU_MUC_BAN_GIAO, { recursive: true })
  fs.mkdirSync(THU_MUC_LAM, { recursive: true })
  console.log(`[${gio()}] Soạn ngoại tuyến: ${LUONG} luồng · ${LOP ? 'khối ' + LOP : 'mọi khối'} · ${SO_CAU_LO} câu/lô · Worker ${MAY_CHU}`)
  await Promise.all(Array.from({ length: LUONG }, (_, i) => ngu(i * 2000).then(() => motLuong(i + 1))))
  console.log(`[${gio()}] Xong. Chạy --xuat-goi để tạo manifest và do-phu-qid.json.`)
}
main()
