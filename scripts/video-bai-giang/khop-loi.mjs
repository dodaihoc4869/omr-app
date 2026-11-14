// KHỚP LỜI (thầy 14/11 «nói tới đâu thì hình ảnh bảng hoặc hoạt hoạ phải phối hợp ăn ý tới đó»): lời TÓM TẮT của văn phòng (chữ đẹp, đúng thuật ngữ — dùng làm
// phụ đề) ⇄ lời NGUYÊN VĂN máy nghe được (PhoWhisper chạy trên máy, có giờ từng chữ nhưng sai chữ chuyên môn, có tên học sinh ⇒ KHÔNG BAO GIỜ hiện ra).
// Cả hai đổi về cùng bộ «âm» (thuật ngữ hoá học gom một âm: «nao áo hát» = naoh, «g li» = gly, «hát cộng» = h+, số đọc thành chữ…), rồi gióng hàng
// (quy hoạch động, bỏ chữ thừa của lời nguyên văn gần như miễn phí vì lời tóm tắt ngắn hơn) ⇒ giây Thầy nói từng chữ của phụ đề.
const MAU = [ // [các cách máy nghe ra (đã thường hoá), âm chuẩn]
  [['c ô hát', 'cờ ô hát', 'co hát', 'co h', 'c o o h', 'c ô ô hát', 'cô hát', 'c o h'], 'cooh'],
  [['c ô n a', 'c ô na', 'cô na', 'co na', 'c o o n a', 'c ô ô na'], 'coona'],
  [['nao áo hát', 'n ao hát', 'n a o hát', 'na ô hát', 'nao hát', 'lao h', 'n a o h', 'na oh', 'naoh'], 'naoh'],
  [['o h trừ', 'ô hát trừ', 'oh trừ'], 'oh-'], [['o h', 'ô hát', 'oh'], 'oh'], [['hát cộng', 'h cộng'], 'h+'],
  [['g li', 'gờ li', 'gi li', 'gli', 'gly'], 'gly'], [['a la', 'ala'], 'ala'], [['ba giờ', 'ba zơ', 'bazơ', 'bazo', 'base'], 'base'], [['axit', 'a xít', 'acid'], 'acid'],
  [['blue stress', 'bờ ron stết', 'brønsted', 'bronsted'], 'bronsted'], [['hát cờ lờ', 'hcl'], 'hcl'],
  [['bảy mươi lăm', 'bảy năm', '75'], '75'], [['hai mươi ba', 'hai ba', '23'], '23'], [['hai mươi hai', 'hai hai', '22'], '22'], [['tám mươi chín', '89'], '89'],
  [['ba a'], '3a'], [['ly sin', 'li sin', 'lisin', 'lysine', 'lys'], 'lys'], [['ni tơ', 'nitơ', 'nitrogen'], 'nitrogen'], [['gờ lu', 'glu'], 'glu'], [['va lin', 'valin', 'val'], 'val'], [['bốn a'], '4a'], [['năm a'], '5a'], [['hai a'], '2a'], [['n à', 'n a', 'na'], 'na'], [['cờ'], 'c'], [['nờ'], 'n'], [['mờ'], 'm'], [['hát'], 'h'], [['pép tít', 'pep tít', 'peptide'], 'peptide'],
].map(([ds, chuan]) => [ds.map((x) => x.split(' ')), chuan]).sort((a, b) => Math.max(...b[0].map((x) => x.length)) - Math.max(...a[0].map((x) => x.length)))
const thuong = (w) => w.toLowerCase().normalize('NFC').replace(/[.,:;!?()«»"…]/g, '')
/** Lời nguyên văn [[giây đầu, giây cuối, chữ], …] ⇒ dãy âm chuẩn [{ a, t }]. */
export function amNguyenVan(tu) {
  const w = tu.map(([a, , c]) => ({ a, c: thuong(c) })).filter((x) => x.c), ra = []
  for (let i = 0; i < w.length;) {
    let khop = null
    for (const [ds, chuan] of MAU) { for (const m of ds) if (m.every((x, k) => w[i + k] && w[i + k].c === x)) { khop = [m.length, chuan]; break } if (khop) break }
    if (khop) { ra.push({ a: w[i].a, t: khop[1] }); i += khop[0] } else { ra.push({ a: w[i].a, t: w[i].c }); i++ }
  }
  return ra
}
const SO = { 0: 'không', 1: 'một', 2: 'hai', 3: 'ba', 4: 'bốn', 5: 'năm', 6: 'sáu', 7: 'bảy', 8: 'tám', 9: 'chín', 10: 'mười' }
/** Một chữ của phụ đề ⇒ các âm chuẩn của nó. */
export function amPhuDe(w) {
  const c = thuong(w).replace(/₂/g, '2').replace(/⁺/g, '+').replace(/⁻/g, '-')
  const dac = { cooh: 'cooh', coona: 'coona', naoh: 'naoh', 'oh-': 'oh-', oh: 'oh', 'h+': 'h+', gly: 'gly', ala: 'ala', base: 'base', acid: 'acid', 'brønsted': 'bronsted', hcl: 'hcl', na: 'na', c: 'c', n: 'n', m: 'm', h: 'h', h2o: 'nước', peptide: 'peptide', lysine: 'lys', lys: 'lys', nitrogen: 'nitrogen', glu: 'glu', val: 'val' }
  if (dac[c]) return [dac[c]]
  if (/^(75|23|22|89|2a|3a|4a|5a)$/.test(c)) return [c]
  const m = c.match(/^(\d+)([a-z]*)$/); if (m) { const n = Number(m[1]); return [...(SO[n] ? [SO[n]] : [m[1]]), ...(m[2] ? [m[2]] : [])] }
  return [c]
}
// Chữ ĐỆM (có ở khắp nơi trong lời nói ⇒ khớp chỗ nào cũng được, không dùng làm neo). Neo = thuật ngữ, con số, động từ chính của ý.
const DEM = new Set(['là', 'thì', 'có', 'một', 'và', 'với', 'mà', 'nên', 'này', 'nữa', 'không', 'được', 'cũng', 'còn', 'lại', 'bên', 'khi', 'lúc', 'chỗ', 'đi', 'ra', 'vào',
  'đấy', 'như', 'vậy', 'nó', 'thằng', 'cái', 'các', 'đó', 'ở', 'gì', 'đây', 'tức', 'nhá', 'đúng', 'hai', 'ba', 'thôi', 'kia', 'chỉ', 'a'])
const NHIP = 4.5 // âm / giây khi nói liền
const soAm = (w) => Math.max(1, amPhuDe(w).length)
/** Gióng hàng: phụ đề (mảng chữ) ⇄ âm nguyên văn trong khung giờ của câu ⇒ giây (tiếng gốc) từng chữ phụ đề.
 *  Chỉ chữ NEO được ghép giờ thật; chữ đệm tính lùi / tiến từ chữ neo gần nhất trong CÙNG cụm theo nhịp nói, giữa hai neo thì chia đều. */
export function gioTungChu(chu, am, s0, s1) {
  const P = []; chu.forEach((w, j) => amPhuDe(w).forEach((t) => P.push({ t, j })))
  const A = am.filter((x) => x.a >= s0 - 1.5 && x.a <= s1 + 1.5), n = P.length, m = A.length
  if (!n || !m) return null
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1)), T = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1))
  for (let i = 1; i <= n; i++) { D[i][0] = D[i - 1][0] - 0.8; T[i][0] = 2 }
  for (let i = 1; i <= n; i++) for (let k = 1; k <= m; k++) {
    let best = D[i][k - 1] - 0.02, tr = 1
    const bo = DEM.has(P[i - 1].t) ? 0 : -0.8
    if (D[i - 1][k] + bo > best) { best = D[i - 1][k] + bo; tr = 2 }
    if (!DEM.has(P[i - 1].t) && P[i - 1].t === A[k - 1].t) { const v = D[i - 1][k - 1] + 3; if (v > best) { best = v; tr = 3 } }
    D[i][k] = best; T[i][k] = tr
  }
  const gio = new Array(n).fill(null); let i = n, k = m
  while (i > 0 && k > 0) { const tr = T[i][k]; if (tr === 3) { gio[i - 1] = A[k - 1].a; i--; k-- } else if (tr === 2) i--; else k-- }
  const tu = chu.map(() => null); P.forEach((p, x) => { if (gio[x] != null && tu[p.j] == null) tu[p.j] = gio[x] })
  const khop = tu.filter((x) => x != null).length
  if (!khop) return null
  const neo = tu.slice()
  // cụm theo dấu phẩy
  const cum = []; let bd = 0; chu.forEach((w, j) => { if (/[,;:]$/.test(w) || j === chu.length - 1) { cum.push([bd, j + 1]); bd = j + 1 } })
  const am2 = (x, y) => chu.slice(x, y).reduce((z, w) => z + soAm(w), 0)
  for (const [x, y] of cum) {
    const id = []; for (let j = x; j < y; j++) if (neo[j] != null) id.push(j)
    if (!id.length) continue
    for (let j = x; j < id[0]; j++) tu[j] = neo[id[0]] - am2(j, id[0]) / NHIP
    for (let j = id[id.length - 1] + 1; j < y; j++) tu[j] = neo[id[id.length - 1]] + am2(id[id.length - 1], j) / NHIP
    for (let q = 0; q + 1 < id.length; q++) for (let j = id[q] + 1; j < id[q + 1]; j++) tu[j] = neo[id[q]] + ((neo[id[q + 1]] - neo[id[q]]) * am2(id[q], j)) / am2(id[q], id[q + 1])
  }
  // cụm không có neo: chia đều giữa hai cụm bên cạnh
  const co = tu.map((x, j) => (x != null ? j : -1)).filter((j) => j >= 0)
  for (let j = 0; j < tu.length; j++) if (tu[j] == null) {
    const tr = co.filter((x) => x < j).pop(), sa = co.find((x) => x > j)
    tu[j] = tr == null ? Math.max(s0, tu[sa] - am2(j, sa) / NHIP) : sa == null ? Math.min(s1, tu[tr] + am2(tr, j) / NHIP) : tu[tr] + ((tu[sa] - tu[tr]) * (j - tr)) / (sa - tr)
  }
  for (let j = 1; j < tu.length; j++) if (tu[j] < tu[j - 1]) tu[j] = tu[j - 1]
  return { tu: tu.map((x) => Math.max(s0 - 0.3, x)), khop, tong: chu.length, neo }
}
