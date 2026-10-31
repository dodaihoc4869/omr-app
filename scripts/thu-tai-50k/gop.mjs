// GỘP KẾT QUẢ THỬ TẢI (31/10): đọc mọi tệp JSON của may-tai.mjs dưới một thư mục, gộp theo giai đoạn, in bảng gọn từng đường.
//   node scripts/thu-tai-50k/gop.mjs <thư mục> [--cong <giai đoạn>] [--md <tệp markdown>] [--json <tệp tóm tắt>]
// --cong: kiểm cổng sang giai đoạn sau ⇒ in `qua=1|0` vào $GITHUB_OUTPUT (nếu có): lỗi (ramp + ổn định) ≤ 20 %, không lát nào dừng sớm,
//         `answer` ok ≥ 80 % (đúng chức năng), có ít nhất 1 lệnh.
import { readdirSync, readFileSync, statSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const thuMuc = process.argv[2] ?? '.'
const tham = (ten) => { const i = process.argv.indexOf(`--${ten}`); return i > 0 ? process.argv[i + 1] : undefined }
const tepJson = []
const duyet = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) duyet(p); else if (/^ket-qua-.*\.json$/.test(f)) tepJson.push(p) } }
duyet(thuMuc)

const theoGd = new Map()
for (const p of tepJson) {
  const j = JSON.parse(readFileSync(p, 'utf8'))
  const g = theoGd.get(j.giaiDoan) ?? []; g.push(j); theoGd.set(j.giaiDoan, g)
}
const pv = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null)
const phanTram = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0)
const md = []
const tom = {}
const in2 = (s) => { console.log(s); md.push(s) }

const gds = [...theoGd.keys()].sort((a, b) => Number(a) - Number(b))
for (const gd of gds) {
  const ds = theoGd.get(gd)
  const soEm = ds.reduce((a, j) => a + j.soEmAo, 0)
  const onDinhPhut = (ds[0].onDinhMs ?? 180_000) / 60_000
  const tuyen = new Map()
  for (const j of ds) for (const [d, o] of Object.entries(j.tuyen)) {
    const t = tuyen.get(d) ?? { od: { n: 0, loi: 0, ngan: 0, ms: [] }, ramp: { n: 0, loi: 0, ngan: 0, ms: [] }, loiKieu: {} }
    for (const [k, src] of [['od', o.onDinh], ['ramp', o.ramp]]) { t[k].n += src.n; t[k].loi += src.loi; t[k].ngan += src.ngan; for (const x of src.ms) t[k].ms.push(x) }
    for (const [k, v] of Object.entries(o.loiKieu)) t.loiKieu[k] = (t.loiKieu[k] ?? 0) + v
    tuyen.set(d, t)
  }
  let nOd = 0, lOd = 0, nR = 0, lR = 0, ngOd = 0
  const tatMs = [], rampMs = []
  for (const t of tuyen.values()) { t.od.ms.sort((a, b) => a - b); t.ramp.ms.sort((a, b) => a - b); nOd += t.od.n; lOd += t.od.loi; nR += t.ramp.n; lR += t.ramp.loi; ngOd += t.od.ngan; tatMs.push(...t.od.ms); rampMs.push(...t.ramp.ms) }
  tatMs.sort((a, b) => a - b); rampMs.sort((a, b) => a - b)
  const dung = ds.filter((j) => j.dungSom)
  const tre = Math.max(0, ...ds.map((j) => j.treBatDauMs ?? 0))
  const ans = tuyen.get('/game-v2/answer')
  const ansOk = ans ? phanTram(ans.od.n + ans.ramp.n - ans.od.loi - ans.ramp.loi, ans.od.n + ans.ramp.n) : null
  in2(`\n### Giai đoạn ${gd} em ảo (${ds.length} lát · ${soEm} em) — ổn định ${Math.round(onDinhPhut * 10) / 10} phút`)
  in2(`- Ổn định: ${nOd} lệnh = ${(nOd / onDinhPhut / 60).toFixed(0)} lệnh/s = ${(nOd / Math.max(1, soEm) / onDinhPhut).toFixed(2)} lệnh/phút/em · p50/p95/p99 ${pv(tatMs, 0.5)}/${pv(tatMs, 0.95)}/${pv(tatMs, 0.99)} ms · lỗi ${phanTram(lOd, nOd)}% · x-ngan:1 ${phanTram(ngOd, nOd)}%`)
  in2(`- Ramp (mở app dồn): ${nR} lệnh · p50/p95/p99 ${pv(rampMs, 0.5)}/${pv(rampMs, 0.95)}/${pv(rampMs, 0.99)} ms · lỗi ${phanTram(lR, nR)}% · answer ok ${ansOk ?? '-'}% · đỉnh đang bay/lát ${Math.max(...ds.map((j) => j.dinhBay))} · lát nhận việc muộn nhất ${Math.round(tre / 1000)} s${dung.length ? ` · **DỪNG SỚM ${dung.length} lát** (${dung.map((j) => `${j.dungSom.tiLe}%@${Math.round(j.dungSom.luc / 1000)}s`).join(', ')})` : ''}`)
  const tk = ds.reduce((a, j) => { for (const [k, v] of Object.entries(j.thongKeEm ?? {})) a[k] = (a[k] ?? 0) + v; return a }, {})
  in2(`- Em ảo: ${JSON.stringify(tk)}`)
  const noi = ds.reduce((a, j) => { for (const [k, v] of Object.entries(j.noiChay ?? {})) a[k] = (a[k] ?? 0) + v; return a }, {})
  in2(`- Nơi chạy: ${Object.entries(noi).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ×${v}`).join(' · ')}`)
  in2('')
  in2('| đường | n (ổn định) | p50 | p95 | p99 ms | lỗi % | x-ngan:1 % | ramp p95 / lỗi % | lỗi hay gặp |')
  in2('|---|---:|---:|---:|---:|---:|---:|---:|---|')
  const hang = [...tuyen].sort((a, b) => (b[1].od.n + b[1].ramp.n) - (a[1].od.n + a[1].ramp.n))
  for (const [d, t] of hang) {
    const top = Object.entries(t.loiKieu).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${v}× ${k}`).join(' · ')
    in2(`| ${d} | ${t.od.n} | ${pv(t.od.ms, 0.5) ?? '-'} | ${pv(t.od.ms, 0.95) ?? '-'} | ${pv(t.od.ms, 0.99) ?? '-'} | ${phanTram(t.od.loi, t.od.n)} | ${phanTram(t.od.ngan, t.od.n)} | ${pv(t.ramp.ms, 0.95) ?? '-'} / ${phanTram(t.ramp.loi, t.ramp.n)} | ${top.replace(/\|/g, '/')} |`)
  }
  // Chuỗi thời gian 10 s (gộp mọi lát): số lệnh · lỗi % · p95.
  const ch = new Map()
  for (const j of ds) for (const [s, c] of Object.entries(j.chuoi ?? {})) { const o = ch.get(Number(s)) ?? { n: 0, loi: 0, ms: [] }; o.n += c.n; o.loi += c.loi; for (const x of c.ms) o.ms.push(x); ch.set(Number(s), o) }
  const dongCh = [...ch].sort((a, b) => a[0] - b[0]).map(([s, o]) => { o.ms.sort((a, b) => a - b); return `${s}s:${o.n}/${phanTram(o.loi, o.n)}%/p95=${pv(o.ms, 0.95)}` })
  in2(`\n<details><summary>Chuỗi 10 s (lệnh/lỗi%/p95 ms)</summary>\n\n${dongCh.join(' · ')}\n</details>`)
  tom[gd] = { soEm, nOd, loiOd: phanTram(lOd, nOd), nRamp: nR, loiRamp: phanTram(lR, nR), p50: pv(tatMs, 0.5), p95: pv(tatMs, 0.95), p99: pv(tatMs, 0.99), ngan: phanTram(ngOd, nOd), ansOk, dungSom: dung.length, batDau: Math.min(...ds.map((j) => j.batDau)), ketThuc: Math.max(...ds.map((j) => j.ketThuc)) }
}

const tepMd = tham('md'); if (tepMd) appendFileSync(tepMd, md.join('\n') + '\n')
const tepTom = tham('json'); if (tepTom) writeFileSync(tepTom, JSON.stringify(tom))
const cong = tham('cong')
if (cong) {
  const t = tom[cong]
  const lyDo = []
  if (!t) lyDo.push('không có kết quả')
  else {
    if (t.nOd + t.nRamp === 0) lyDo.push('0 lệnh')
    const loiChung = phanTram((t.loiOd * t.nOd + t.loiRamp * t.nRamp) / 100, t.nOd + t.nRamp)
    if (loiChung > 20) lyDo.push(`lỗi ${loiChung}% > 20%`)
    if (t.dungSom) lyDo.push(`${t.dungSom} lát dừng sớm`)
    if (t.ansOk !== null && t.ansOk < 80) lyDo.push(`answer ok ${t.ansOk}% < 80%`)
    if (t.ansOk === null) lyDo.push('không có lệnh answer nào')
  }
  const qua = lyDo.length ? 0 : 1
  console.log(`CỔNG giai đoạn ${cong}: ${qua ? 'QUA' : 'DỪNG — ' + lyDo.join(' · ')}`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `qua=${qua}\n`)
}
