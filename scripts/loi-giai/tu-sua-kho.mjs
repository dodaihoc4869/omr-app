#!/usr/bin/env node
// TỰ SỬA KHO ĐỀ theo kết luận của máy soạn lời giải (thầy lệnh 29/09 14:10: "câu nào thấy đề sai hay lời giải sai thì tự động sửa cho đúng").
//
//   node scripts/loi-giai/tu-sua-kho.mjs <ke-hoach.json>           # CHẠY THỬ: in việc sẽ làm, không ghi gì
//   node scripts/loi-giai/tu-sua-kho.mjs <ke-hoach.json> --that    # ghi thật qua /kho/day
//   node scripts/loi-giai/tu-sua-kho.mjs --lui <qid,...> --that     # trả câu về bản sao lưu
//
// Kế hoạch = mảng việc { qid, maDe, phan, so, viec, truong?, truoc?, sau?, lyDo }:
//   viec 'thay'     — thay đoạn `truoc` (phải có ĐÚNG 1 lần) bằng `sau` trong trường `de` | `pa.X` | `y.x` | `bang`;
//   viec 'dapAn'    — đổi `dap_an` từ `truoc` sang `sau` (chỉ khi kho đang đúng bằng `truoc`);
//   viec 'xepY'     — xếp lại khoá `y` về a, b, c, d (dây chuyền lời giải ghép đáp án theo thứ tự khoá).
// AN TOÀN: sao lưu nguyên câu (trừ dữ liệu ảnh, không bao giờ bị sửa) vào docs/loi-giai-a/tu-sua-2909/sao-luu/<mã đề>.json
// TRƯỚC khi ghi, không bao giờ ghi đè bản sao lưu đầu tiên của một câu; có ca thi mở / chưa công bố ⇒ DỪNG; đọc lại sau khi ghi.
// Chỉ mục câu dựng lại đúng như /kho/chi-muc-lay trả (giữ lớp, chuyên đề, mức độ; tờ DB- vẫn rỗng). Băm câu đổi ⇒ máy chủ
// tự xếp câu vào lại hàng soạn lời giải. Mã bí mật: biến OMR_MA_BI_MAT hoặc ~/.omr-ma-bi-mat, không in ra.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const THU_MUC = path.join(GOC, 'docs/loi-giai-a/tu-sua-2909')
const SAO_LUU = path.join(THU_MUC, 'sao-luu')
const NHAT_KY = path.join(THU_MUC, 'da-tu-sua.md')
const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const argv = process.argv.slice(2)
const THAT = argv.includes('--that')
const SECRET = (process.env.OMR_MA_BI_MAT || (fs.existsSync(path.join(os.homedir(), '.omr-ma-bi-mat')) ? fs.readFileSync(path.join(os.homedir(), '.omr-ma-bi-mat'), 'utf8') : '')).trim()
if (!SECRET) { console.error('Thiếu mã bí mật (OMR_MA_BI_MAT hoặc ~/.omr-ma-bi-mat).'); process.exit(2) }
const NGAY = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)

async function goi(duong, body) {
  for (let lan = 0; ; lan++) {
    try {
      const r = await fetch(MAY_CHU + duong, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': SECRET }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({ ok: false, error: `máy chủ trả ${r.status}` }))
      if (r.status >= 500 && lan < 3) { await new Promise((x) => setTimeout(x, 2000 * 2 ** lan)); continue }
      return { ma: r.status, j }
    } catch (e) {
      if (lan >= 3) throw e
      await new Promise((x) => setTimeout(x, 2000 * 2 ** lan))
    }
  }
}

/** Có ca nào đang mở hoặc chưa công bố ⇒ câu trong ca ấy bị khoá; không biết ca dùng câu nào nên DỪNG cả lượt. */
async function caDangKhoa() {
  const { ma, j } = await goi('/ca/danh-sach', {})
  if (ma !== 200 || !Array.isArray(j.items)) throw new Error(`không hỏi được danh sách ca (${ma}) — dừng cho an toàn`)
  // Đúng luật máy chủ (cong-bo-diem.ts laSanSangCongBo + game-v2-bank.ts protectedQuestions): `congBo` là CHẾ ĐỘ công bố
  // ('ngay' | 'ca_lop_xong' | 'khong'), không phải cờ đã công bố.
  const daCongBo = (c) => c.congBo === 'ngay' || (c.congBo === 'ca_lop_xong' && (c.trangThai === 'dong' || (Number(c.daVao) > 0 && Number(c.daNop) >= Number(c.daVao))))
  return j.items.filter((c) => c.trangThai !== 'da_xoa' && (c.trangThai === 'mo' || !daCongBo(c)))
}

const timCau = (g, phan, so) => g.cau.find((c) => String(c.phan) === String(phan) && String(c.so) === String(so))
function docTruong(c, t) {
  const [a, b] = t.split('.')
  if (a === 'de') return c.de
  if (a === 'bang') return typeof c.bang === 'string' ? c.bang : null
  return (c[a] || {})[b]
}
function ghiTruong(c, t, v) {
  const [a, b] = t.split('.')
  if (a === 'de' || a === 'bang') c[a] = v
  else c[a][b] = v
}
const soLan = (s, x) => (x ? s.split(x).length - 1 : 0)
const banSaoLuu = (c) => ({ ...c, hinh: Array.isArray(c.hinh) ? c.hinh.map(({ du_lieu, ...h }) => h) : c.hinh })

/** Áp một việc lên câu (trong bộ nhớ). Trả chuỗi mô tả nếu đổi, `null` nếu đã đúng sẵn, ném lỗi nếu không áp được. */
function apViec(c, v) {
  if (v.viec === 'dapAn') {
    if (c.dap_an === v.sau) return null
    if (c.dap_an !== v.truoc) throw new Error(`đáp án kho là ${JSON.stringify(c.dap_an)}, không phải ${JSON.stringify(v.truoc)}`)
    c.dap_an = v.sau
    return `đáp án ${v.truoc} → ${v.sau}`
  }
  if (v.viec === 'xepY') {
    const k = Object.keys(c.y || {})
    const dung = [...k].sort()
    if (k.join() === dung.join()) return null
    c.y = Object.fromEntries(dung.map((x) => [x, c.y[x]]))
    return `xếp ý ${k.join('')} → ${dung.join('')}`
  }
  if (v.viec !== 'thay') throw new Error('việc lạ: ' + v.viec)
  const cu = docTruong(c, v.truong)
  if (typeof cu !== 'string') throw new Error(`không có trường ${v.truong}`)
  // Kho viết xuống dòng bằng "\n", không dùng HTML ⇒ "<br>" của máy soạn đổi thành xuống dòng.
  const sau = /<[a-z]/i.test(cu) ? v.sau : v.sau.replace(/<br\s*\/?>/gi, '\n')
  if (!soLan(cu, v.truoc) && soLan(cu, sau) === 1) return null
  const n = soLan(cu, v.truoc)
  if (n !== 1) throw new Error(`đoạn nguyên văn có ${n} lần trong ${v.truong}`)
  ghiTruong(c, v.truong, cu.replace(v.truoc, sau))
  return `${v.truong}: «${v.truoc}» → «${sau}»`
}

function ghiSaoLuu(maDe, cauGoc) {
  fs.mkdirSync(SAO_LUU, { recursive: true })
  const f = path.join(SAO_LUU, `${maDe}.json`)
  const cu = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}
  for (const [qid, c] of Object.entries(cauGoc)) if (!cu[qid]) cu[qid] = { luc: new Date().toISOString(), cau: banSaoLuu(c) }
  fs.writeFileSync(f, JSON.stringify(cu, null, 1))
}

async function dayLai(maDe, g) {
  const cm = await goi('/kho/chi-muc-lay', { maDe })
  if (cm.ma !== 200 || !cm.j.ok || !Array.isArray(cm.j.items)) throw new Error(`không đọc được chỉ mục ${maDe}`)
  const cau = cm.j.items.map((x) => ({ qid: x.qid, phan: x.phan, chuyenDe: x.chuyen_de ?? '', mucDo: x.muc_do ?? '', lop: x.lop ?? '', loiGiai: x.co_loi_giai ? 1 : null }))
  g.ngay_nap = NGAY
  const r = await goi('/kho/day', { maDe, de: g, cau })
  if (r.ma !== 200 || !r.j.ok) throw new Error(`/kho/day ${maDe} trả ${r.ma} ${JSON.stringify(r.j).slice(0, 200)}`)
  return r.j
}

function ghiNhatKy(dong) {
  fs.mkdirSync(THU_MUC, { recursive: true })
  if (!fs.existsSync(NHAT_KY)) fs.writeFileSync(NHAT_KY, '# Danh sách đã tự sửa kho đề (thầy lệnh 29/09 14:10)\n\nSao lưu bản gốc từng câu: `sao-luu/<mã đề>.json`. Lùi: `node scripts/loi-giai/tu-sua-kho.mjs --lui <qid,...> --that`.\n\n| giờ | qid | sửa gì | lý do |\n|---|---|---|---|\n')
  fs.appendFileSync(NHAT_KY, dong + '\n')
}
const oBang = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')

async function main() {
  const khoa = await caDangKhoa()
  if (khoa.length) { console.log(`DỪNG: có ${khoa.length} ca đang mở hoặc chưa công bố — câu trong ca bị khoá, chờ công bố rồi chạy lại.`); process.exit(3) }

  if (argv.includes('--lui')) {
    const ds = argv[argv.indexOf('--lui') + 1].split(',')
    const theoDe = {}
    for (const f of fs.readdirSync(SAO_LUU)) {
      const sl = JSON.parse(fs.readFileSync(path.join(SAO_LUU, f), 'utf8'))
      for (const q of ds) if (sl[q]) (theoDe[f.replace(/\.json$/, '')] ??= []).push([q, sl[q].cau])
    }
    for (const [maDe, cs] of Object.entries(theoDe)) {
      const g = (await goi('/kho/lay', { maDe })).j
      for (const [q, goc] of cs) {
        const c = timCau(g, goc.phan, goc.so)
        for (const k of ['de', 'pa', 'y', 'dap_an', 'bang']) if (k in goc) c[k] = goc[k]
        console.log(`${THAT ? '' : '[thử] '}lùi ${q}`)
        if (THAT) ghiNhatKy(`| ${new Date().toISOString().slice(11, 19)} | ${q} | LÙI về bản sao lưu | yêu cầu lùi |`)
      }
      if (THAT) await dayLai(maDe, g)
    }
    return
  }

  const keHoach = JSON.parse(fs.readFileSync(argv.find((a) => a.endsWith('.json')), 'utf8'))
  const theoDe = {}
  for (const v of keHoach) (theoDe[v.maDe] ??= []).push(v)
  const tong = { de: 0, viec: 0, sanRoi: 0, boQua: [] }
  for (const [maDe, ds] of Object.entries(theoDe)) {
    const { ma, j: g } = await goi('/kho/lay', { maDe })
    if (ma !== 200 || !Array.isArray(g?.cau)) { tong.boQua.push(`${maDe}: không đọc được đề (${ma})`); continue }
    const goc = {}
    const daDoi = []
    for (const v of ds) {
      const c = timCau(g, v.phan, v.so)
      if (!c) { tong.boQua.push(`${v.qid}: không thấy câu`); continue }
      const truoc = structuredClone(c)
      try {
        const mo = apViec(c, v)
        if (!mo) { tong.sanRoi++; continue }
        goc[v.qid] ??= truoc
        daDoi.push({ v, mo })
      } catch (e) { tong.boQua.push(`${v.qid} ${v.truong ?? v.viec}: ${e.message}`) }
    }
    if (!daDoi.length) continue
    for (const { v, mo } of daDoi) console.log(`${THAT ? '' : '[thử] '}${v.qid} · ${mo}`)
    tong.de++; tong.viec += daDoi.length
    if (!THAT) continue
    ghiSaoLuu(maDe, goc)
    const kq = await dayLai(maDe, g)
    // Đọc lại: mọi việc phải thấy đúng bản mới.
    const moi = (await goi('/kho/lay', { maDe })).j
    const noiDung = (c) => JSON.stringify([c?.de, c?.pa, c?.y, c?.dap_an, c?.bang])
    for (const { v } of daDoi) {
      if (noiDung(timCau(moi, v.phan, v.so)) !== noiDung(timCau(g, v.phan, v.so))) { console.log(`LỆCH sau khi ghi: ${v.qid} — DỪNG`); process.exit(4) }
    }
    for (const { v, mo } of daDoi) ghiNhatKy(`| ${new Date().toISOString().slice(11, 19)} | ${v.qid} | ${oBang(mo)} | ${oBang(v.lyDo ?? '')} |`)
    console.log(`  ✓ ${maDe}: ghi ${daDoi.length} việc, đọc lại khớp · ${kq.loiGiai?.vaoHang ?? 0} câu vào lại hàng soạn`)
  }
  console.log(`TỔNG: ${tong.viec} việc / ${tong.de} đề${THAT ? '' : ' (CHẠY THỬ)'} · đã đúng sẵn ${tong.sanRoi} · bỏ qua ${tong.boQua.length}`)
  for (const b of tong.boQua) console.log('  bỏ qua: ' + b)
}
main().catch((e) => { console.error('LỖI:', e.message); process.exit(1) })
