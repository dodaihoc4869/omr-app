#!/usr/bin/env node
// QUÉT KHO (CHỈ ĐỌC) để lập kế hoạch soạn hồ sơ lời giải (phương án A).
// Không ghi gì lên máy chủ. Không in mã bí mật.
//
// Cách chạy:
//   A) Đọc thẳng R2/D1 qua Cloudflare API (cần biến môi trường CLOUDFLARE_API_TOKEN chỉ-đọc + CLOUDFLARE_ACCOUNT_ID,
//      mạng cho phép api.cloudflare.com):
//        node docs/loi-giai-a/quet-kho.mjs --cloudflare
//   B) Đọc một thư mục chứa các gói kho đã tải về (mỗi tệp một gói <maDe>.json):
//        node docs/loi-giai-a/quet-kho.mjs --thu-muc <thư-mục>
//   C) Đọc tệp sao lưu dạng {qid: {maDe, cau}} (ví dụ docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json):
//        node docs/loi-giai-a/quet-kho.mjs --sao-luu <tệp>
// Kết quả: docs/loi-giai-a/ket-qua-quet.json + in bảng tóm tắt.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
const has = (k) => process.argv.includes(k)

// Hằng số đo từ chạy thử 29/09 (xem KET-QUA-CHAY-THU.md). Sửa lại khi đo trên máy thầy.
const DO = {
  giayMoiCauLe: Number(arg('--giay-le') ?? 190),     // một phiên soạn một câu
  giayMoiCauLo: Number(arg('--giay-lo') ?? 90),      // một phiên soạn liền cả lô (đo ở đợt 2)
  songSong: Number(arg('--song-song') ?? 4),         // số phiên chạy cùng lúc trên máy thầy
  gioChayMoiNgay: Number(arg('--gio-ngay') ?? 20),   // máy bật, trừ giờ thầy dùng
}

// ---------- đọc kho ----------
async function cfFetch(url, opt = {}) {
  const tok = process.env.CLOUDFLARE_API_TOKEN
  if (!tok) throw new Error('Thiếu CLOUDFLARE_API_TOKEN')
  const r = await fetch(url, { ...opt, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...(opt.headers || {}) } })
  return r
}
async function docCloudflare() {
  const acc = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!acc) throw new Error('Thiếu CLOUDFLARE_ACCOUNT_ID')
  const base = `https://api.cloudflare.com/client/v4/accounts/${acc}`
  const bucket = arg('--bucket') ?? ((fs.readFileSync(path.join(HERE, '../../server/wrangler.toml'), 'utf8').match(/bucket_name\s*=\s*"([^"]+)"/) || [])[1] ?? 'omr-de')
  // 1) danh sách gói: thử D1 (de_kho), không được thì liệt kê R2 theo tiền tố kho/
  let keys = []
  const toml = fs.readFileSync(path.join(HERE, '../../server/wrangler.toml'), 'utf8')
  const dbId = arg('--d1') ?? (toml.match(/database_id\s*=\s*"([^"]+)"/) || [])[1]
  if (!dbId) throw new Error('Không đọc được database_id trong server/wrangler.toml')
  let r = await cfFetch(`${base}/d1/database/${dbId}/query`, { method: 'POST', body: JSON.stringify({ sql: 'SELECT ma_de, r2_khoa FROM de_kho WHERE da_xoa = 0' }) })
  if (r.ok) {
    const j = await r.json()
    keys = (j.result?.[0]?.results ?? []).map((x) => x.r2_khoa || `kho/${x.ma_de}.json`)
    console.error(`D1 de_kho: ${keys.length} gói`)
  } else {
    console.error(`D1 trả ${r.status} → chuyển sang liệt kê R2`)
    let cursor = ''
    do {
      r = await cfFetch(`${base}/r2/buckets/${bucket}/objects?prefix=kho/&per_page=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
      if (!r.ok) throw new Error(`Liệt kê R2 trả ${r.status}: token cần quyền "Workers R2 Storage: Read"`)
      const j = await r.json()
      keys.push(...(j.result ?? []).map((o) => o.key).filter((k) => k.endsWith('.json')))
      cursor = j.result_info?.cursor ?? ''
    } while (cursor)
  }
  const goi = []
  for (const [i, k] of keys.entries()) {
    const o = await cfFetch(`${base}/r2/buckets/${bucket}/objects/${encodeURIComponent(k)}`)
    if (!o.ok) { console.error(`  bỏ ${k}: ${o.status}`); continue }
    goi.push({ maDe: path.basename(k, '.json'), goi: await o.json() })
    if (i % 20 === 0) console.error(`  đã đọc ${i + 1}/${keys.length}`)
  }
  return goi
}
function docThuMuc(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ maDe: path.basename(f, '.json'), goi: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }))
}
// Gói có 3 dạng: cau[] | items[] | phanI/II/III. Trả về danh sách {qid, maDe, cau} theo dạng cau[].
function cauTrongGoi(maDe, g) {
  const out = []
  if (Array.isArray(g.cau)) for (const c of g.cau) out.push({ qid: c.qid || `${maDe}-${c.phan}-${c.so}`, maDe, cau: c })
  else if (Array.isArray(g.items)) for (const c of g.items) out.push({ qid: c.qid || c.id || `${maDe}-${c.phan}-${c.so}`, maDe, cau: c })
  else for (const p of ['I', 'II', 'III']) for (const c of g[`phan${p}`] ?? []) out.push({ qid: c.qid || c.id || `${maDe}-${p}-${c.so}`, maDe, cau: { ...c, phan: p, de: c.de ?? c.text, pa: c.pa ?? c.choices, y: c.y ?? c.ideas, dap_an: c.dap_an ?? c.correct, loi_giai: c.loi_giai ?? c.loiGiai, chuyen_de: c.chuyen_de ?? c.chuyenDe, muc_do: c.muc_do ?? c.mucDo, hinh: c.hinh ?? c.hinhAnh } })
  return out
}

// ---------- phân loại một câu ----------
function loaiCau(c) {
  const p = String(c.phan ?? '')
  const kieu = String(c.kieu ?? '').toLowerCase()
  if (/tu[_ ]?luan|tự luận/.test(kieu)) return 'tuluan'
  if (p === 'I' && c.pa && c.dap_an) return 'tn'
  if (p === 'II' && c.y && c.dap_an) return 'ds'
  if (p === 'III' && c.dap_an != null && String(c.dap_an).trim().length <= 8) return 'tln'
  return 'tuluan'
}
function tangCau(c, loai) {
  // Tầng soạn: gon (biết) · du (hiểu, vận dụng) · sau (vận dụng + tính nhiều bước hoặc đáng chữa cao)
  const md = c.muc_do ?? ''
  const buoc = (c.loi_giai?.buoc ?? []).length
  const sao = c.can_chua?.sao ?? 0
  if (md === 'biet' && loai !== 'tln') return 'gon'
  if ((md === 'van_dung' && (buoc >= 3 || loai === 'tln')) || sao >= 2) return 'sau'
  return 'du'
}
const HE_SO_TANG = { gon: 0.6, du: 1, sau: 1.4 }

async function main() {
  let ds = []
  if (has('--cloudflare')) for (const { maDe, goi } of await docCloudflare()) ds.push(...cauTrongGoi(maDe, goi))
  else if (arg('--thu-muc')) for (const { maDe, goi } of docThuMuc(arg('--thu-muc'))) ds.push(...cauTrongGoi(maDe, goi))
  else if (arg('--sao-luu')) ds = Object.entries(JSON.parse(fs.readFileSync(arg('--sao-luu'), 'utf8'))).map(([qid, r]) => ({ qid, maDe: r.maDe, cau: r.cau }))
  else { console.error('Chọn --cloudflare | --thu-muc <dir> | --sao-luu <file>'); process.exit(2) }

  const T = { tong: 0, boTuLuan: 0, theoLoai: {}, theoLop: {}, theoChuong: {}, theoMucDo: {}, theoTang: {}, coHinh: 0, coBang: 0, trangThaiLoiGiai: {}, khongLoiGiai: 0 }
  const bump = (o, k, v = 1) => { o[k] = (o[k] ?? 0) + v }
  const nhom = new Map() // băm nội dung → danh sách qid (câu trùng dùng chung một hồ sơ)
  const dang = new Map()
  const hangCho = []
  for (const { qid, maDe, cau: c } of ds) {
    T.tong++
    const loai = loaiCau(c)
    if (loai === 'tuluan') { T.boTuLuan++; continue }
    bump(T.theoLoai, loai)
    const lop = (maDe.match(/(?:^|-)(10|11|12)(?:-|$)/) || [])[1] ?? '?'
    bump(T.theoLop, lop); bump(T.theoChuong, c.chuyen_de || '—'); bump(T.theoMucDo, c.muc_do || '—')
    if ((c.hinh ?? []).length) T.coHinh++
    if (c.bang) T.coBang++
    const lg = c.loi_giai
    if (!lg || !(lg.chot || lg.tung_pa || lg.tung_y || (lg.buoc ?? []).length)) T.khongLoiGiai++
    bump(T.trangThaiLoiGiai, lg?.trang_thai || '—')
    const noiDung = [c.de, JSON.stringify(c.pa ?? c.y ?? ''), String(c.dap_an)].join('|').toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:]/g, '')
    const bam = crypto.createHash('sha1').update(noiDung).digest('hex').slice(0, 16)
    if (!nhom.has(bam)) nhom.set(bam, [])
    nhom.get(bam).push(qid)
    if (nhom.get(bam).length === 1) {
      const tang = tangCau(c, loai); bump(T.theoTang, tang)
      const dm = c.dang?.ma || '—'; dang.set(dm, (dang.get(dm) ?? 0) + 1)
      // Điểm ưu tiên: đáng chữa (sao) · mức độ · dạng đông câu (khuôn dùng lại) · lời giải cũ chưa khớp phải để thầy xem
      const diem = (c.can_chua?.sao ?? 0) * 3 + ({ van_dung: 2, hieu: 1 }[c.muc_do] ?? 0) + (lop === '12' ? 2 : 0)
      hangCho.push({ qid, maDe, bam, loai, tang, lop, chuong: c.chuyen_de, mucDo: c.muc_do, dang: dm, coHinh: !!(c.hinh ?? []).length, trangThai: lg?.trang_thai || '', diem })
    }
  }
  const soDuyNhat = nhom.size
  const cauTrung = [...nhom.values()].reduce((s, v) => s + v.length - 1, 0)
  hangCho.sort((a, b) => b.diem - a.diem)
  // ước lượng thời gian máy (giờ) theo tầng
  const heSo = hangCho.reduce((s, q) => s + HE_SO_TANG[q.tang] * (q.coHinh ? 1.2 : 1), 0)
  const gioLo = heSo * DO.giayMoiCauLo / 3600 / DO.songSong
  const gioLe = heSo * DO.giayMoiCauLe / 3600 / DO.songSong
  const kq = {
    ...T, soDuyNhat, cauTrung, soDangBai: dang.size,
    cauTrongDangTu3: [...dang.values()].filter((v) => v >= 3).reduce((a, b) => a + b, 0),
    uocLuong: { ...DO, gioMayCheDoLo: +gioLo.toFixed(1), ngayCheDoLo: +(gioLo / DO.gioChayMoiNgay).toFixed(1), gioMayCheDoLe: +gioLe.toFixed(1) },
    hangCho50Dau: hangCho.slice(0, 50),
  }
  fs.writeFileSync(path.join(HERE, 'ket-qua-quet.json'), JSON.stringify({ ...kq, hangCho }, null, 1))
  console.log(JSON.stringify({ ...kq, hangCho50Dau: undefined }, null, 1))
}
main().catch((e) => { console.error('LỖI:', e.message); process.exit(1) })
