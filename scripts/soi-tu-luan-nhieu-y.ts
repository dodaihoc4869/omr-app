// SOI LUẬT «PHẦN III NHIỀU Ý YÊU CẦU» TRÊN KHO THẬT (chỉ đọc, 01/11). Đầu vào: JSON hàng {qid, ma_de, phan, text, correct, tl} (wrangler d1 execute --json).
// In MÃ CÂU + động từ đầu mỗi ý bị kết tội — KHÔNG in nội dung câu (repo công khai).
import { readFileSync } from 'node:fs'
import { laCauTuLuan, soYConYeuCau } from '../src/lib/cau-tu-luan'

const rows = (JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as { results: Record<string, unknown>[] }[])[0]!.results
let tong = 0, moi = 0
const theoTo = new Map<string, number>()
for (const r of rows) {
  const text = String(r.text ?? ''), c = { qid: r.qid, phan: r.phan, text, correct: r.correct }
  tong++
  if (soYConYeuCau(text) < 2 || !laCauTuLuan(c)) continue
  if (Number(r.tl) === 1) continue
  moi++
  theoTo.set(String(r.ma_de), (theoTo.get(String(r.ma_de)) ?? 0) + 1)
  const dongTu = [...text.normalize('NFC').matchAll(/(?:^|[\s.:;?!])\(?([a-e])\)\s*([^\s,]+(?:\s[^\s,]+)?)/giu)].map((m) => `${m[1]}:${m[2]!.toLowerCase().slice(0, 14)}`).join(' ')
  console.log(`${r.qid} · ${dongTu}`)
}
console.log(`== phần III có ý a)/b): ${tong} câu · luật mới kết tội thêm: ${moi} câu`)
for (const [k, v] of [...theoTo].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)

// NGHI NGỜ KHÁC (phần III đang rút được nhưng chữ đề có dấu hiệu tự luận) — chỉ in mã câu + dấu hiệu, để soát tay.
const DAU_HIEU: [string, RegExp][] = [
  ['giải thích/trình bày/nhận xét/đề xuất', /(?:^|[^\p{L}])(?:giải thích|trình bày|nhận xét|đề xuất|đề nghị|so sánh)(?![\p{L}])/iu],
  ['vì sao/tại sao', /vì sao|tại sao/iu],
  ['… hay …?', /cho biết[^.?]{0,80}\bhay\b/iu],
  ['viết biểu thức/cấu hình', /viết (?:biểu thức|cấu hình|công thức|phương trình)/iu],
  ['≥ 2 dấu hỏi', /\?[^?]+\?/u],
]
let nghi = 0
for (const r of (JSON.parse(readFileSync(process.argv[3] ?? process.argv[2]!, 'utf8')) as { results: Record<string, unknown>[] }[])[0]!.results) {
  const text = String(r.text ?? '')
  if (Number(r.tl) === 1 || laCauTuLuan({ qid: r.qid, phan: r.phan, text, correct: r.correct })) continue
  const co = DAU_HIEU.filter(([, re]) => re.test(text)).map(([k]) => k)
  if (!co.length) continue
  nghi++
  console.log(`NGHI ${r.qid} · ${co.join(' + ')} · đáp án ${String(r.correct ?? '').slice(0, 12)}`)
  // Mẩu ngắn quanh dấu hiệu — CHỈ tờ luyện tập (không in tờ kiểm tra `-KT-` / VIP), để soát tay luật.
  if (!/-KT-|^VIP/.test(String(r.qid))) for (const [, re] of DAU_HIEU) { const m = re.exec(text); if (m) { const i = Math.max(0, m.index - 70); console.log(`   … ${text.slice(i, m.index + 90).replace(/\s+/g, ' ')} …`) } }
}
console.log(`== nghi ngờ còn lại: ${nghi} câu`)
