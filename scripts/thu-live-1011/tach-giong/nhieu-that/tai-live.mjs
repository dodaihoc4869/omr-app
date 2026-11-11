// ĐO NHIỄU THẬT (docs/do-live-1011.md mục 11.1) — bước 1: tải buoi.json + tieng.mp3 của các buổi «Xem lại Live» (id ở argv; trống = mọi buổi 'xong';
// buổi đã có tieng.mp3 thì bỏ qua). Mã thầy lấy từ biến môi trường OMR_MA_BI_MAT, chỉ dùng làm đầu mục request; KHÔNG in / ghi mã, vé. Tệp tiếng ở thư mục tạm,
// KHÔNG commit.
//   RA=<thư mục tạm> node tai-live.mjs [id …]  →  bash giai-ma.sh <RA>  →  python3 -I phan-tich.py <RA> <CAM++.onnx> <silero_vad.onnx> <ra>/cua-so.json
//   →  python3 -I so-a.py <ra>/cua-so.json <ra>/khung.npz <ra>/so-a.json   (cum2.py: cao độ F0 từng cụm · trong-em.py: cụm «khác» có phải người trong emNoi)
// CAM++: xem do-tach-giong.mjs (LV_TG). Silero VAD (MIT): `pip download --no-deps silero-vad` rồi giải nén lấy silero_vad/data/silero_vad.onnx.
// cua-so.json / khung.npz / tam-thay.npy chứa nhúng giọng của thầy (dữ liệu sinh trắc) ⇒ chỉ ở thư mục tạm.
import { mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from 'node:path'
const GOC = 'https://omr.ttadodaihoc.workers.dev'
const RA = process.env.RA
const r = await fetch(`${GOC}/gv/live-ds`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': process.env.OMR_MA_BI_MAT || '' }, body: '{}' })
const d = await r.json()
const muon = process.argv.slice(2)
for (const b of d.buoi) {
  if (b.trangThai !== 'xong' || !b.ve) continue
  if (muon.length && !muon.includes(b.id)) continue
  const thu = join(RA, b.id); if (existsSync(join(thu, "tieng.mp3"))) continue; mkdirSync(thu, { recursive: true })
  for (const tep of ['buoi.json', 'tieng.mp3']) {
    const u = `${GOC}/live-tep/${encodeURIComponent(b.id)}/${tep}?ve=${encodeURIComponent(b.ve)}`
    const t = await fetch(u, { headers: { range: 'bytes=0-' } })
    const buf = Buffer.from(await t.arrayBuffer())
    if (!t.ok) { console.log(b.id, tep, 'loi', t.status); continue }
    writeFileSync(join(thu, tep), buf)
    console.log(b.id, tep, t.status, buf.length)
  }
}
