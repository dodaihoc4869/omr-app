#!/usr/bin/env node
// MÁY SOẠN LỜI GIẢI + HỌC LIỆU — chạy trên MÁY THẦY bằng gói Claude đang dùng (không tốn API). Thầy chốt 29/09: 4 luồng song song, khối 12 trước.
//
//   node scripts/loi-giai/may-soan.mjs                 # 4 luồng, khối 12, chạy mãi (hết việc thì 30 phút hỏi lại)
//   node scripts/loi-giai/may-soan.mjs --mot-lan       # làm hết hàng hiện có rồi dừng
//   node scripts/loi-giai/may-soan.mjs --de 12-KT-C1-D4 --mot-lan   # đề sắp giao: đưa lên đầu hàng rồi soạn
//   node scripts/loi-giai/may-soan.mjs --nap-hang      # LẦN ĐẦU: xếp cả kho cũ vào hàng (đề mới nạp thì tự vào hàng)
//   node scripts/loi-giai/may-soan.mjs --tong          # xem hàng việc theo chương
//   node scripts/loi-giai/may-soan.mjs --hang-em-sai   # xem hàng câu EM ĐÃ SAI chưa có bản khác (làm mới ngay)
//   Tuỳ chọn: --luong 4 · --lop 12 (--lop tat-ca = mọi lớp) · --so 12 (câu mỗi lô) · --model <tên> · --thu (1 lô 3 câu, không nộp)
//             --khong-bo-tro (chỉ soạn hồ sơ lời giải như trước 05/10, không soạn bản khác / ý Đúng–Sai)
//
// Cần: `claude` (Claude Code) đã đăng nhập; biến OMR_MA_BI_MAT = mã bí mật của thầy (hoặc tệp ~/.omr-ma-bi-mat). Không in mã ra đâu cả.
// Mỗi lô: máy chủ phát tới 12 câu CÙNG CHƯƠNG (câu em đã sai chưa có bản khác lên trước) ⇒ thư mục .may-soan/<ngày>/<lô>/ (vao/, bo.json,
// gói giao việc, bộ kiểm) ⇒ `claude -p` soạn + tự kiểm ⇒ máy này kiểm lại ⇒ nộp; máy chủ kiểm lần nữa với đáp án KHO rồi mới lưu.
//
// 05/10 (thầy: "làm tất nhé, tôi ko duyệt gì cả, tôi chỉ chữa câu học sinh cần chữa thôi nhé") — KHÔNG BƯỚC NÀO CHỜ THẦY DUYỆT:
//   1. lượt SOẠN (claude -p #1): hồ sơ lời giải ra/ + HỌC LIỆU THÊM bo-tro/ theo `vao.can` của máy chủ — tới 4 BẢN KHÁC (Phần I/III: song sinh đổi
//      số cho câu tính toán, biến thể lí thuyết cho câu lí thuyết) và 8–12 Ý ĐÚNG–SAI MỚI cùng đề dẫn (Phần II);
//   2. phiên CHỐT (như 29/09) cho hồ sơ có cờ đáp án;
//   3. lượt KIỂM MÙ (claude -p #2, thư mục TẠM riêng ngoài thư mục lô, chỉ đọc/ghi): tự giải từng bản khác, từng ý mới và câu gốc còn cờ đáp án —
//      KHÔNG thấy đáp án đề xuất, đáp án kho, lời giải hay hồ sơ;
//   4. ghép: chỉ giữ mục hai lượt KHỚP (mơ hồ "?" ⇒ bỏ); cờ đáp án: giải lại khớp đáp án kho ⇒ máy duyệt, lệch ⇒ máy chủ đưa câu vào diện nghi.
//   Bản sao đầu vào + trả lời lượt kiểm mù để ở <lô>/kiem-mu/ (soát được); tổng kết từng câu ở <lô>/tong-ket.json.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cauGocTuVao, coDapAnConLai, docTraLoiMu, dungVaoMu, ghepHaiLuot, kiemBoTro, kiemHoSo, tuXuCoDapAn } from './kiem.bundle.mjs'

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
const BO_TRO = !co('--khong-bo-tro')
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
const docJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }
const CAN_CU = { hoSo: true, banKhac: 0, kieuBan: 'tu_chon', yDs: 0 }
const canCua = (vao) => ({ ...CAN_CU, ...(vao?.can ?? {}) })
const canBoTro = (can) => BO_TRO && ((can.banKhac ?? 0) > 0 || (can.yDs ?? 0) > 0)

/** Dựng thư mục một lô: ảnh ra tệp (phiên soạn phải Read ảnh), đầu vào, bộ chìa khoá, gói giao việc, bộ kiểm. */
function dungLo(lo, luong) {
  const ngay = new Date().toISOString().slice(0, 10)
  const dir = path.join(THU_MUC_LAM, ngay, `${luong}-${lo.bo}-${lo.maLuot.slice(0, 8)}`)
  fs.mkdirSync(path.join(dir, 'vao/img'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'ra'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'bo-tro'), { recursive: true })
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
    // `--khong-bo-tro`: phiên soạn chỉ thấy việc hồ sơ.
    const vao = BO_TRO ? { ...v, hinh } : { ...v, hinh, can: { ...canCua(v), banKhac: 0, yDs: 0 } }
    fs.writeFileSync(path.join(dir, 'vao', ten), JSON.stringify(vao, null, 1))
    tep.push({ ten, vao })
  })
  fs.writeFileSync(path.join(dir, 'bo.json'), JSON.stringify(lo.bo_ ?? {}, null, 1))
  for (const f of ['goi-may-soan.md', 'goi-chot.md', 'vi-du-mau.json', 'vi-du-bo-tro.json', 'kiem.bundle.mjs']) fs.copyFileSync(path.join(DAY, f), path.join(dir, f))
  fs.writeFileSync(path.join(dir, 'kiem.mjs'), BO_KIEM_LO)
  return { dir, tep }
}
// Bộ kiểm trong thư mục lô: kiểm ra/*.json (hồ sơ) và bo-tro/*.json (học liệu thêm) đối chiếu vao/*.json + bo.json bằng đúng hàm của máy chủ.
const BO_KIEM_LO = `import fs from 'node:fs'
import { kiemHoSo, kiemBoTro, cauGocTuVao } from './kiem.bundle.mjs'
const bo = JSON.parse(fs.readFileSync('bo.json', 'utf8'))
let dat = 0, tong = 0, btDat = 0, btTong = 0
const in_ = (ten, loi, canhBao) => console.log(ten + ': ' + (loi.length ? 'TRƯỢT' : 'ĐẠT') + (loi.length ? '\\n   ✕ ' + loi.join('\\n   ✕ ') : '') + (canhBao.length ? '\\n   ! ' + canhBao.join('\\n   ! ') : ''))
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json')).sort()) {
  const vao = JSON.parse(fs.readFileSync('vao/' + f, 'utf8'))
  const can = { hoSo: true, banKhac: 0, yDs: 0, ...(vao.can || {}) }
  if (can.hoSo !== false) {
    tong++
    if (!fs.existsSync('ra/' + f)) console.log(f + ': CHƯA CÓ ra/' + f)
    else {
      let h = null; try { h = JSON.parse(fs.readFileSync('ra/' + f, 'utf8')) } catch (e) { console.log(f + ': TRƯỢT · JSON hỏng ' + e.message) }
      if (h) { const { loi, canhBao } = kiemHoSo(vao, h, bo); if (!loi.length) dat++; in_(f, loi, canhBao) }
    }
  }
  if ((can.banKhac || 0) > 0 || (can.yDs || 0) > 0) {
    btTong++
    const can_ = (can.banKhac ? can.banKhac + ' bản khác' : '') + (can.yDs ? (can.banKhac ? ', ' : '') + 'ý mới (' + Math.min(8, can.yDs) + '–' + can.yDs + ')' : '')
    if (!fs.existsSync('bo-tro/' + f)) { console.log('bo-tro/' + f + ': CHƯA CÓ (cần ' + can_ + ')'); continue }
    let bt = null; try { bt = JSON.parse(fs.readFileSync('bo-tro/' + f, 'utf8')) } catch (e) { console.log('bo-tro/' + f + ': TRƯỢT · JSON hỏng ' + e.message); continue }
    const { loi, canhBao } = kiemBoTro(cauGocTuVao(vao), can, bt, vao.daCo || { banKhac: [], yDs: [] })
    if (!loi.length) btDat++
    in_('bo-tro/' + f, loi, canhBao)
  }
}
console.log('Học liệu thêm đạt: ' + btDat + '/' + btTong)
console.log('TỔNG: ' + dat + '/' + tong + ' đạt')
`

const NHAC_SOAN = (n) => `Đọc goi-may-soan.md trong thư mục hiện tại và làm đúng. Lô này có ${n} câu trong vao/. Ghi hồ sơ vào ra/ và học liệu thêm vào bo-tro/ (cùng tên tệp, theo vao.can), chạy node kiem.mjs để tự kiểm và sửa.`
const NHAC_CHOT = (n) => `Đọc goi-chot.md trong thư mục hiện tại và làm đúng. Có ${n} hồ sơ cần chốt, liệt kê trong chot.txt. Sửa thẳng ra/ rồi chạy node kiem.mjs.`
// Lượt kiểm mù chỉ có Read + Write (không Glob / Bash) ⇒ tên tệp nằm sẵn trong lời nhắc và danh-sach.txt.
const NHAC_MU = (ten) => `Đọc goi-kiem-mu.md trong thư mục hiện tại và làm đúng. Có ${ten.length} tệp cần giải (đọc trong vao/, danh sách cũng ở danh-sach.txt): ${ten.join(', ')}. Ghi kết quả vào ra/ (cùng tên tệp).`
/** Còn cờ đáp án chưa chốt (cờ đã chốt "đáp án kho sai" có trường `chot` — giữ nguyên, không chốt lại). */
const canChot = (h) => Array.isArray(h?.co) && h.co.some((c) => c?.loai === 'dapAn' && !c?.chot)
const CONG_SOAN = 'Read,Write,Edit,Glob,Bash(node kiem.mjs),Bash(node kiem.mjs:*)'

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

function chayClaude(dir, soCau, loiNhac = NHAC_SOAN(soCau), cong = CONG_SOAN, luot = 40 + soCau * 12) {
  const thamSo = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', cong, '--max-turns', String(luot)]
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

/**
 * LƯỢT KIỂM MÙ: thư mục TẠM riêng (ngoài thư mục lô — phiên kiểm không với tới ra/, bo-tro/, vao/ của lượt soạn), chỉ có đề / phương án / chữ ý
 * (KHÔNG đáp án, lí do, lời giải), công cụ chỉ Read + Write. Xong thì chép đầu vào + trả lời về <lô>/kiem-mu/ để soát, xoá thư mục tạm.
 */
async function kiemMu(dirLo, viecMu) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'omr-kiem-mu-'))
  try {
    fs.mkdirSync(path.join(tam, 'vao/img'), { recursive: true })
    fs.mkdirSync(path.join(tam, 'ra'), { recursive: true })
    fs.copyFileSync(path.join(DAY, 'goi-kiem-mu.md'), path.join(tam, 'goi-kiem-mu.md'))
    let soMuc = 0
    for (const { ten, vaoMu, hinh } of viecMu) {
      const hinhMu = hinh.map((h, j) => {
        const dich = `img/${ten.replace(/\.json$/, '')}-${j}${path.extname(h.tep)}`
        fs.copyFileSync(path.join(dirLo, h.tep), path.join(tam, 'vao', dich))
        return { viTri: h.viTri, tep: 'vao/' + dich }
      })
      fs.writeFileSync(path.join(tam, 'vao', ten), JSON.stringify({ ...vaoMu, cau: { ...vaoMu.cau, ...(hinhMu.length ? { hinh: hinhMu } : {}) } }, null, 1))
      soMuc += vaoMu.muc.length
    }
    const ten = viecMu.map((x) => x.ten)
    fs.writeFileSync(path.join(tam, 'danh-sach.txt'), ten.join('\n') + '\n')
    const kq = await chayClaude(tam, viecMu.length, NHAC_MU(ten), 'Read,Write', 20 + soMuc * 3)
    const tra = new Map()
    for (const { ten } of viecMu) tra.set(ten, docTraLoiMu(docJson(path.join(tam, 'ra', ten))))
    fs.cpSync(tam, path.join(dirLo, 'kiem-mu'), { recursive: true })
    return { kq, tra, soMuc }
  } finally {
    fs.rmSync(tam, { recursive: true, force: true })
  }
}

let dung = false
process.on('SIGINT', () => { if (dung) process.exit(130); dung = true; console.log(`\n[${gio()}] Dừng nhận việc mới — đợi các lô đang chạy xong (bấm Ctrl+C lần nữa để thoát ngay).`) })

async function motLuong(luong, dem) {
  while (!dung) {
    const lo = await goi('/kho/loi-giai/viec', { so: SO_CAU_LO, lop: LOP, boTro: BO_TRO })
    if (!lo.ok) { console.log(`[${gio()}] luồng ${luong}: máy chủ báo lỗi — ${lo.error}`); await ngu(60_000); continue }
    if (lo.het || !lo.viec?.length) {
      if (co('--mot-lan') || co('--thu')) return
      console.log(`[${gio()}] luồng ${luong}: hết việc, ${PHUT_CHO_KHI_HET} phút nữa hỏi lại`)
      await ngu(PHUT_CHO_KHI_HET * 60_000)
      continue
    }
    const { dir, tep } = dungLo({ ...lo, bo: lo.bo?.ma ?? 'X', bo_: lo.bo }, luong)
    const soHoSo = tep.filter(({ vao }) => canCua(vao).hoSo !== false).length, soHocLieu = tep.filter(({ vao }) => canBoTro(canCua(vao))).length
    console.log(`[${gio()}] luồng ${luong}: nhận ${tep.length} câu chương ${lo.bo?.chuong ?? lo.bo?.ma} (hồ sơ ${soHoSo} · học liệu thêm ${soHocLieu}) → ${path.relative(GOC, dir)}`)
    const kq = await chayClaude(dir, tep.length, NHAC_SOAN(tep.length), CONG_SOAN, 40 + soHoSo * 12 + soHocLieu * 10)
    if (!kq.ok) console.log(`[${gio()}] luồng ${luong}: phiên soạn dừng lỗi (${kq.ma ?? '?'}): ${kq.loi}`)
    // PHIÊN CHỐT (thầy giao máy tự chốt, 29/09): hồ sơ còn cờ đáp án ⇒ một phiên nữa giải lại và ra quyết định cuối.
    const docRa = (ten) => docJson(path.join(dir, 'ra', ten))
    const phaiChot = tep.filter(({ ten, vao }) => canCua(vao).hoSo !== false && canChot(docRa(ten))).map(({ ten }) => ten)
    let kqChot = null
    if (phaiChot.length) {
      fs.writeFileSync(path.join(dir, 'chot.txt'), phaiChot.join('\n') + '\n')
      console.log(`[${gio()}] luồng ${luong}: chốt ${phaiChot.length} hồ sơ có cờ đáp án`)
      kqChot = await chayClaude(dir, phaiChot.length, NHAC_CHOT(phaiChot.length))
      kq.giay += kqChot.giay
      if (!kqChot.ok) console.log(`[${gio()}] luồng ${luong}: phiên chốt dừng lỗi (${kqChot.ma ?? '?'}): ${kqChot.loi}`)
    }

    // ---- HAI LƯỢT ĐỘC LẬP: lọc học liệu bằng bộ kiểm, rồi lượt kiểm mù giải lại từng mục + câu gốc còn cờ đáp án.
    const cau = tep.map(({ ten, vao }) => {
      const can = canCua(vao), goc = cauGocTuVao(vao)
      const bt = canBoTro(can) ? docJson(path.join(dir, 'bo-tro', ten)) : null
      const r = bt && goc ? kiemBoTro(goc, can, bt, vao.daCo ?? { banKhac: [], yDs: [] }) : null
      const hoSo = can.hoSo !== false ? docRa(ten) : null
      return {
        ten, vao, can, goc, hoSo,
        hopLe: { songSinh: r?.songSinh ?? [], yMoi: r?.yMoi ?? [] },
        deXuat: { songSinh: Array.isArray(bt?.songSinh) ? bt.songSinh.length : 0, yMoi: Array.isArray(bt?.yMoi) ? bt.yMoi.length : 0 },
        boKiem: { songSinh: r?.boSongSinh ?? [], yMoi: r?.boY ?? [] },
        kiemGoc: !!(goc && hoSo && coDapAnConLai(hoSo)),
      }
    })
    const viecMu = cau.map((x) => ({ x, vaoMu: x.goc ? dungVaoMu(x.goc, x.hopLe, x.kiemGoc) : null })).filter((y) => y.vaoMu)
      .map(({ x, vaoMu }) => ({ ten: x.ten, vaoMu, hinh: vaoMu.muc.some((m) => m.loai !== 'ban_khac') ? (x.vao.hinh ?? []) : [] }))
    let mu = { kq: null, tra: new Map(), soMuc: 0 }
    if (viecMu.length) {
      mu = await kiemMu(dir, viecMu)
      kq.giay += mu.kq.giay
      console.log(`[${gio()}] luồng ${luong}: lượt kiểm mù ${viecMu.length} câu · ${mu.soMuc} mục${mu.kq.ok ? '' : ` — dừng lỗi (${mu.kq.ma ?? '?'}): ${mu.kq.loi}`}`)
    }

    // ---- GHÉP + TỰ XỬ CỜ ĐÁP ÁN + NỘP
    let dat = 0, truot = 0, thieu = 0
    const hl = { deXuatSS: 0, giuSS: 0, deXuatY: 0, giuY: 0, luuSS: 0, luuY: 0, khop: 0, nghi: 0, choLai: 0 }
    const tongKet = []
    for (const x of cau) {
      const tra = mu.tra.get(x.ten) ?? null
      const g = x.goc ? ghepHaiLuot(x.goc, x.hopLe, tra) : { songSinh: [], yMoi: [], boSongSinh: [], boY: [] }
      const kqCau = { qid: x.vao.qid, can: x.can, hoSo: null, tuXu: 'khong_can', banKhac: { deXuat: x.deXuat.songSinh, quaBoKiem: x.hopLe.songSinh.length, khopHaiLuot: g.songSinh.length, boBoKiem: x.boKiem.songSinh, boHaiLuot: g.boSongSinh }, yDs: { deXuat: x.deXuat.yMoi, quaBoKiem: x.hopLe.yMoi.length, khopHaiLuot: g.yMoi.length, boBoKiem: x.boKiem.yMoi, boHaiLuot: g.boY } }
      // Cờ đáp án còn lại sau phiên chốt ⇒ quyết định theo lượt giải lại độc lập. Lượt kiểm mù hỏng ⇒ không nộp hồ sơ (việc tự về hàng sau 45 phút),
      // trừ khi câu đã thử ≥ 3 lần ⇒ nộp với kết quả "không giải lại được" (máy chủ đưa câu vào diện nghi — thà loại nhầm còn hơn công bố đáp án nghi).
      if (x.kiemGoc) {
        const m = tra?.find((t) => t.id === 'goc')
        if (!m && Number(x.vao.soLan ?? 0) < 3) { kqCau.tuXu = 'cho_lai'; hl.choLai++ }
        else {
          const r = tuXuCoDapAn(x.hoSo, x.goc, m)
          kqCau.tuXu = r.ketQua
          if (r.ketQua === 'khop') hl.khop++; else hl.nghi++
          fs.writeFileSync(path.join(dir, 'ra', x.ten), JSON.stringify(r.hoSo, null, 1))
        }
      }
      if (x.can.hoSo !== false) {
        const f = path.join(dir, 'ra', x.ten)
        if (kqCau.tuXu === 'cho_lai' || !fs.existsSync(f)) { thieu++; kqCau.hoSo = kqCau.tuXu === 'cho_lai' ? 'cho_lai' : 'thieu' }
        else {
          const h = docJson(f)
          if (!h) { truot++; kqCau.hoSo = 'truot' }
          else if (co('--thu')) { const { loi } = kiemHoSo(x.vao, h, lo.bo); loi.length ? truot++ : dat++; kqCau.hoSo = loi.length ? 'truot' : 'dat' }
          else {
            const r = await goi('/kho/loi-giai/nop', { qid: x.vao.qid, bam: x.vao.bam, hoSo: h })
            if (r.ok) { dat++; kqCau.hoSo = r.nghiDapAn ? 'dat_nghi' : 'dat' }
            else { truot++; kqCau.hoSo = 'truot'; console.log(`   ✕ ${x.vao.qid}: ${(r.loi || [r.error]).slice(0, 3).join(' | ')}`) }
          }
        }
      }
      if (canBoTro(x.can)) {
        hl.deXuatSS += x.deXuat.songSinh; hl.giuSS += g.songSinh.length; hl.deXuatY += x.deXuat.yMoi; hl.giuY += g.yMoi.length
        // Nộp cả khi rỗng: máy chủ trả việc "chỉ học liệu" về hàng / đóng việc. --thu: không nộp gì.
        if (!co('--thu')) {
          const r = await goi('/kho/may-soan/nop-bo-tro', { qid: x.vao.qid, bam: x.vao.bam, ...(x.goc?.dang === 'ds' ? { yMoi: g.yMoi } : { songSinh: g.songSinh }) })
          if (r.ok) { hl.luuSS += r.banKhac?.giu ?? 0; hl.luuY += r.yDs?.giu ?? 0; kqCau.mayChu = { banKhac: r.banKhac, yDs: r.yDs, viec: r.viec } }
          else { kqCau.mayChu = { loi: r.error ?? r.loi }; console.log(`   ✕ học liệu ${x.vao.qid}: ${r.error ?? r.loi}`) }
        }
      }
      tongKet.push(kqCau)
    }
    fs.writeFileSync(path.join(dir, 'tong-ket.json'), JSON.stringify({ maLuot: lo.maLuot, thu: co('--thu'), luc: new Date().toISOString(), hocLieu: hl, cau: tongKet }, null, 1))
    dem.dat += dat; dem.truot += truot; dem.thieu += thieu; dem.giay += kq.giay
    for (const k of Object.keys(hl)) dem.hl[k] = (dem.hl[k] ?? 0) + hl[k]
    const demToken = (u) => (u ? (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) : 0)
    const token = kq.usage ? demToken(kq.usage) + demToken(kqChot?.usage) + demToken(mu.kq?.usage) : null
    ghiNhatKy({ luong, bo: lo.bo?.ma, maLuot: lo.maLuot, soCau: tep.length, soChot: phaiChot.length, dat, truot, thieu, hocLieu: hl, giay: kq.giay, token, thu: co('--thu') })
    const chuHl = soHocLieu ? ` · bản khác giữ ${hl.giuSS}/${hl.deXuatSS} · ý Đ–S giữ ${hl.giuY}/${hl.deXuatY}` : ''
    const chuCo = hl.khop + hl.nghi + hl.choLai ? ` · cờ đáp án tự xử: khớp ${hl.khop}, nghi ${hl.nghi}${hl.choLai ? `, chờ lại ${hl.choLai}` : ''}` : ''
    console.log(`[${gio()}] luồng ${luong}: xong lô — đạt ${dat}, trượt ${truot}, thiếu ${thieu}${chuHl}${chuCo} · ${kq.giay} giây${token ? ` · ${Math.round(token / 1000)} nghìn token` : ''}`)
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
    for (const r of t.hocLieu ?? []) { const k = `${r.lop || '?'} · ${r.bo || '(chưa gắn dạng)'}`; (bang[k] ??= {})['học liệu ' + r.trang_thai] = r.n }
    console.table(bang)
    return console.log('Chương đã có bộ chìa khoá:', t.boCo.join(', '))
  }
  if (co('--hang-em-sai')) {
    const t = await goi('/kho/may-soan/hang-em-sai', { lamMoi: true, ...(LOP ? { lop: LOP } : {}) })
    if (!t.ok) return console.log('Lỗi:', t.error)
    console.log('Làm mới:', JSON.stringify(t.lamMoi))
    console.table([...t.hocLieu, ...t.hoSo].slice(0, 40).map((r) => ({ qid: r.qid, viec: r.so_em_sai !== undefined ? 'học liệu' : 'hồ sơ', soEmSai: r.so_em_sai ?? '', thieu: r.thieu ?? '', uuTien: r.uu_tien, trangThai: r.trang_thai })))
    return
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
  const dem = { dat: 0, truot: 0, thieu: 0, giay: 0, hl: {} }
  console.log(`[${gio()}] Máy soạn: ${LUONG} luồng · ${LOP ? 'khối ' + LOP : 'mọi khối'} · ${SO_CAU_LO} câu/lô · ${BO_TRO ? 'hồ sơ + học liệu thêm (hai lượt độc lập)' : 'chỉ hồ sơ'} · máy chủ ${MAY_CHU}`)
  await Promise.all(Array.from({ length: co('--thu') ? 1 : LUONG }, (_, i) => ngu(i * 3000).then(() => motLuong(i + 1, dem))))
  const h = dem.hl
  const chuHl = BO_TRO ? ` · bản khác giữ ${h.giuSS ?? 0}/${h.deXuatSS ?? 0} · ý Đ–S giữ ${h.giuY ?? 0}/${h.deXuatY ?? 0} · cờ đáp án tự xử: khớp ${h.khop ?? 0}, nghi ${h.nghi ?? 0}` : ''
  console.log(`[${gio()}] Kết thúc: đạt ${dem.dat} · trượt ${dem.truot} · thiếu ${dem.thieu}${chuHl}. Nhật ký: ${path.relative(GOC, NHAT_KY)}`)
}
main()
