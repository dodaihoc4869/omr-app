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
