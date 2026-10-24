// NẠP ĐỀ LÊN KHO TỪ PHIÊN ĐÁM MÂY (thầy 24/10: «Đẩy lớp 10 luôn cho tôi đi»). Phiên đám mây không có mã bí mật ghi kho,
// repo lại công khai ⇒ gói đề (có đáp án) KHÔNG được nằm trần trên git. Cách làm:
//   · Khoá X25519 của máy chạy suy TẤT ĐỊNH từ secret khoá Cloudflare (KHOA_HAT, băm SHA-256 kèm nhãn) ⇒ chỉ máy có secret mới giải được.
//   · Repo không có secret mã bí mật kho ⇒ (thầy cho phép 24/10) workflow chạy CHÍNH mã Worker của nhánh main bằng `wrangler dev`
//     nối THẲNG D1/R2 thật (remote bindings), mã bí mật là chuỗi ngẫu nhiên của riêng lượt chạy. Đường ghi vẫn là luuDe → dayDeKho.
//   · Không có tệp .nap-kho/*.enc ⇒ chỉ in KHOÁ CÔNG KHAI + nhãn `nhom` của vài tờ mẫu (không in đề/đáp án).
//   · Có tệp ⇒ giải mã → cổng kiểm gói (tệp TS đóng gói sẵn) → CHỈ THÊM mã đề chưa có trong kho → `luuDe` (đúng đường nút
//     «Đẩy file JSON» của app thầy) → dựng chỉ mục → đọc lại số câu. Log chỉ in mã đề và con số.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash, createPrivateKey, createPublicKey, diffieHellman, hkdfSync, createDecipheriv } from 'node:crypto'
import { gunzipSync } from 'node:zlib'

const MAY_CHU = (process.env.OMR_MAY_CHU || 'https://omr.ttadodaihoc.workers.dev').replace(/\/$/, '')
const SECRET = (process.env.OMR_MA_BI_MAT || '').trim()
const HAT = (process.env.KHOA_HAT || '').trim()
if (!SECRET || !HAT) { console.error('Thiếu OMR_MA_BI_MAT hoặc KHOA_HAT'); process.exit(2) }

const hat = createHash('sha256').update('nap-kho-ma-hoa-2410|' + HAT).digest()
const khoaRieng = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), hat]), format: 'der', type: 'pkcs8' })
const congKhai = createPublicKey(khoaRieng).export({ type: 'spki', format: 'der' }).toString('base64')
console.log('KHOA_CONG_KHAI ' + congKhai)

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

const THU_MUC = '.nap-kho'
const tep = existsSync(THU_MUC) ? readdirSync(THU_MUC).filter((f) => f.endsWith('.enc')).sort() : []

if (tep.length === 0) {
  // Chỉ in NHÃN của tờ mẫu (nhom, tên khoá) để gói mới xếp đúng cây kho — không in đề, đáp án.
  for (const maDe of ['DH-10-C2-B5', 'DH-10-C2-B5-VD', 'DH-10-C2-B9-D1', 'DH-10-C1-B4-D2', 'DH-11-C2-B5', 'DH-12-C3-B10']) {
    const { ma, j } = await goi('/kho/lay', { maDe })
    const g = j && (j.de || j.goi || j.data || j)
    const cau0 = Array.isArray(g?.cau) ? g.cau[0] : null
    console.log('MAU', maDe, ma, JSON.stringify({ nhom: g?.nhom ?? null, khoa: g ? Object.keys(g).filter((k) => k !== 'cau') : [], khoaCau: cau0 ? Object.keys(cau0) : [], khoaTraVe: j ? Object.keys(j) : [] }))
  }
  process.exit(0)
}

const { kiem } = await import(process.env.KIEM_MJS || '/tmp/nap-kho-kiem.mjs')
const ca = await goi('/ca/danh-sach', {})
console.log('CA_DANG_MO', Array.isArray(ca.j?.items) ? ca.j.items.filter((c) => c.trangThai === 'mo').length : '?', '(đề mới mã mới, không đụng ca đang mở)')
const ds = await goi('/kho/danh-sach', { keCaDaXoa: true })
const coSan = new Set((ds.j?.items || ds.j?.de || []).map((d) => String(d.maDe ?? d.ma_de ?? '')))
console.log('KHO_DANG_CO', coSan.size, 'đề')
if (coSan.size < 100) { console.error('Không đọc được danh sách kho đầy đủ — dừng cho an toàn'); process.exit(1) }

let loi = 0
for (const f of tep) {
  const b = JSON.parse(readFileSync(`${THU_MUC}/${f}`, 'utf8'))
  const tam = createPublicKey({ key: Buffer.from(b.tam, 'base64'), format: 'der', type: 'spki' })
  const chung = diffieHellman({ privateKey: khoaRieng, publicKey: tam })
  const k = Buffer.from(hkdfSync('sha256', chung, Buffer.from(b.tam, 'base64'), 'nap-kho-2410', 32))
  const d = createDecipheriv('aes-256-gcm', k, Buffer.from(b.iv, 'base64'))
  d.setAuthTag(Buffer.from(b.tag, 'base64'))
  const raw = gunzipSync(Buffer.concat([d.update(Buffer.from(b.ma, 'base64')), d.final()])).toString('utf8')
  const de = JSON.parse(raw)
  const maDe = String(de.ma_de || '')
  const kq = kiem(raw)
  if (!kq.sach) { console.log('LOI_CONG', maDe, JSON.stringify(kq.tom)); loi++; continue }
  if (coSan.has(maDe)) { console.log('BO_QUA_DA_CO', maDe, '(chỉ thêm, không ghi đè)'); continue }
  const r = await goi('/goi', { action: 'luuDe', secret: SECRET, de })
  if (r.ma !== 200 || r.j?.ok !== true) { console.log('LOI_DAY', maDe, r.ma, String(r.j?.error || '').slice(0, 200)); loi++; continue }
  const lai = await goi('/kho/lay', { maDe })
  const g = lai.j && (lai.j.de || lai.j.goi || lai.j)
  console.log('DA_DAY', maDe, 'soCau', r.j.soCau, 'docLai', Array.isArray(g?.cau) ? g.cau.length : '?', 'canXem', kq.tom.canXem)
}
for (let lan = 0; lan < 40; lan++) {
  const r = await goi('/goi', { action: 'dungChiMuc', secret: SECRET })
  if (r.j?.ok !== true || !(Number(r.j.conLai) > 0)) { console.log('CHI_MUC', r.ma, r.j?.ok, 'conLai', r.j?.conLai ?? 0); break }
}
process.exit(loi ? 1 : 0)
