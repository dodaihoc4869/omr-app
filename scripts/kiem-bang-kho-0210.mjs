// Rà soát CHỈ ĐỌC kho thật. Nhật ký chỉ có số lượng và mã câu, không đề, đáp án,
// lời giải, thông tin học sinh hoặc khoá truy cập. Không ghi D1/R2.
const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare của quy trình phát hành')
if (/\s/.test(token) || !/^[0-9a-f]{32}$/i.test(account)) throw new Error('Cấu hình Cloudflare chưa được chuẩn hoá')
const database = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
async function query(sql, params = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }),
  })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(`Không đọc được D1: HTTP ${r.status}; mã ${(j.errors ?? []).map(x => x.code).join(',')}`)
  return j.result.flatMap(x => x.results ?? [])
}
const parsed = s => { try { return JSON.parse(s ?? 'null') } catch { return null } }
const hasTable = t => Array.isArray(t) && t.length >= 2 && Array.isArray(t[0]) && t[0].length >= 2 && t.every(r => Array.isArray(r) && r.length === t[0].length)
const hasImage = a => Array.isArray(a) && a.some(h => (h.src || h.du_lieu) && ['sau_de', 'cuoi_cau'].includes(h.viTri ?? h.vi_tri))
function missing(q) {
  return /bảng\s*(?:(?:số liệu|dữ liệu|thành phần|giá trị|kết quả)\s*)?(?:sau|dưới|trên|bên|kèm|này|cho|\d|:)/iu.test(q.text ?? '')
    && !hasTable(parsed(q.bang)) && !hasImage(parsed(q.hinh)) && !q.anh
    && !(/[^\n|]+\|[^\n|]+\|[^\n|]+/.test(q.text ?? '') && /\d/.test(q.text ?? ''))
}
const report = { luc: new Date().toISOString(), chiDoc: true, cauGocDaQuet: 0, cauGocCoBang: 0, cauGocNghiThieuBang: [], songSinhDaQuet: 0, songSinhCoBang: 0, songSinhNghiThieuBang: [], doiChieuNguon: [] }
const targets = new Map()
for (let offset = 0; ; offset += 300) {
  const rows = await query(`SELECT q.qid, q.ma_de AS maDe, d.r2_khoa AS r2, json_extract(q.json,'$.text') AS text,
    json_extract(q.json,'$.table') AS bang, json_extract(q.json,'$.hinhAnh') AS hinh,
    COALESCE(json_extract(q.json,'$.thanCauImg'),json_extract(q.json,'$.imageDataUrl')) AS anh
    FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de
    WHERE COALESCE(d.da_xoa,0)=0 AND json_valid(q.json) ORDER BY q.ma_de,q.qid LIMIT 300 OFFSET ?`, [offset])
  for (const q of rows) {
    report.cauGocDaQuet++; if (hasTable(parsed(q.bang))) report.cauGocCoBang++
    if (missing(q)) report.cauGocNghiThieuBang.push(q.qid)
    if (missing(q) || /nghiên cứu thành phần chất béo/u.test(q.text ?? '')) targets.set(q.qid, q)
  }
  if (rows.length < 300) break
}
for (let offset = 0; ; offset += 300) {
  const rows = await query(`SELECT b.qid_mau || '~ss' || s.key AS qid, json_extract(s.value,'$.de') AS text,
    json_extract(s.value,'$.bang') AS bang, json_extract(s.value,'$.hinh') AS hinh
    FROM cau_bo_tro b, json_each(b.song_sinh_json) s ORDER BY b.bam,s.key LIMIT 300 OFFSET ?`, [offset])
  for (const q of rows) { report.songSinhDaQuet++; if (hasTable(parsed(q.bang))) report.songSinhCoBang++; if (missing(q)) report.songSinhNghiThieuBang.push(q.qid) }
  if (rows.length < 300) break
}
console.log(JSON.stringify(report))
// Đối chiếu đúng gói R2 đã cấp cho chỉ mục; không ghi và không xuất dữ kiện/đáp án.
const objects = new Map()
for (const q of targets.values()) {
  const key = q.r2 || `kho/${q.maDe}.json`
  if (!objects.has(key)) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/omr-de/objects/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } })
    objects.set(key, r.ok ? await r.json() : { readError: r.status })
  }
  const raw = objects.get(key)
  const list = raw.cau ?? ['I','II','III'].flatMap(p => (raw[`phan${p}`] ?? []).map(c => ({ ...c, phan: p })))
  const c = list.find(c => (c.qid ?? c.id ?? `${q.maDe}-${c.phan}-${c.so}`) === q.qid)
  report.doiChieuNguon.push({ qid: q.qid, docNguon: !!c, loiDoc: raw.readError ?? null,
    bangChiMuc: hasTable(parsed(q.bang)), anhChiMuc: hasImage(parsed(q.hinh)) || !!q.anh,
    bangNguon: !!c && hasTable(c.bang ?? c.table), anhNguon: !!c && hasImage(c.hinh ?? c.hinhAnh),
    nhacBang: /bảng/iu.test(q.text ?? ''), bangLaChu: (q.text ?? '').includes('|'),
    soSongSinh: c?.song_sinh?.length ?? 0,
    songSinh: (c?.song_sinh ?? []).map((ss, i) => ({ i, coBang: hasTable(ss.bang ?? ss.table), coAnh: hasImage(ss.hinh), nhacBang: /bảng/iu.test(ss.de ?? '') })),
  })
}
console.log(JSON.stringify({ doiChieuNguon: report.doiChieuNguon }))
