// So hai lượt đo của ban.mjs: node scripts/do-ca-3009/so-sanh.mjs docs/do-ca-3009/<truoc>.json docs/do-ca-3009/<sau>.json
import { readFileSync } from 'node:fs'
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')))
const theo = (x) => new Map(x.bang.map((r) => [r.lenh, r]))
const A = theo(a), B = theo(b)
const pt = (t, s) => (t > 0 ? `${s <= t ? '−' : '+'}${Math.round((Math.abs(t - s) / t) * 100)}%` : '—')
const dong = []
for (const [lenh, t] of A) {
  const s = B.get(lenh)
  if (!s) continue
  dong.push(`| ${lenh} | ${t.n} / ${s.n} | ${t.loi} / ${s.loi} | ${t.p50} → ${s.p50} | ${t.p95} → ${s.p95} (${pt(t.p95, s.p95)}) | ${t.vongTb} → ${s.vongTb} | ${t.cauTb} → ${s.cauTb} | ${t.docTb} → ${s.docTb} | ${t.r2DocTb} (${t.r2KBTb} KB) → ${s.r2DocTb} (${s.r2KBTb} KB) |`)
}
console.log(`| Lệnh | Lượt | Lỗi | p50 ms | p95 ms | Vòng D1/lượt | Câu D1/lượt | Dòng đọc/lượt | Đọc R2/lượt |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${dong.join('\n')}`)
const tt = (x) => x.tong
console.log(`\nTổng: lượt gọi ${tt(a).luot} → ${tt(b).luot} · lỗi ${tt(a).loi} → ${tt(b).loi} · vòng D1 ${tt(a).vongD1} → ${tt(b).vongD1} (${pt(tt(a).vongD1, tt(b).vongD1)}) · câu D1 ${tt(a).cauD1} → ${tt(b).cauD1} · dòng đọc ${tt(a).docD1} → ${tt(b).docD1} · lượt R2 ${tt(a).r2Doc} → ${tt(b).r2Doc} · MB R2 ${tt(a).r2MB} → ${tt(b).r2MB}`)
for (const [lenh, s] of B) if (s.loi) console.log(`LỖI sau: ${lenh}: ${s.mauLoi.join(' · ')}`)
for (const [lenh, t] of A) if (t.loi) console.log(`LỖI trước: ${lenh}: ${t.mauLoi.join(' · ')}`)
