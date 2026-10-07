// Cổng production chỉ đọc: chỉ in số tổng hợp, không đưa danh tính/đáp án vào Actions.
import { readFileSync } from 'node:fs'
const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
export async function query(sql) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }), signal: AbortSignal.timeout(30000),
  })
  const j = await r.json()
  if (!r.ok || !j.success || j.result?.some(x => !x.success)) throw new Error(`Không kiểm được D1 (${r.status}).`)
  return j.result.flatMap(x => x.results ?? [])
}
const ca = (await query(readFileSync('scripts/kiem-ca-mo.sql', 'utf8')))[0]
console.log(JSON.stringify({ soCaMo: ca.so_ca_mo, soLuotDangLam: ca.so_luot_dang_lam }))
if (ca.so_ca_mo !== 0 || ca.so_luot_dang_lam !== 0) throw new Error('Có ca thi mở: dừng phát hành.')
const cols = new Set((await query("SELECT name FROM pragma_table_info('su_kien_hoc')")).map(x => x.name))
if (!['assistance','purpose','visibility','raw_json'].every(x => cols.has(x))) throw new Error('Thiếu schema sổ sự kiện chung.')
if (process.argv.includes('--schema')) {
  const tables = await query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('chua_loi_dot','chua_loi_hoc_lieu','chua_loi_phien','chua_loi_item','chua_loi_nop','chua_loi_thay','chua_loi_trai_nghiem','chua_loi_tu_receipt','chua_loi_chua_lop')")
  const triggers = await query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name IN ('chua_giao_sai_sau_ghi','chua_giao_sai_sau_cong_bo')")
  if (tables[0].n !== 9 || triggers[0].n !== 2) throw new Error('Schema vòng chữa chưa đủ.')
  const stats = await query("SELECT (SELECT COUNT(*) FROM chua_loi_dot) AS soDot,(SELECT COUNT(*) FROM chua_loi_hoc_lieu WHERE trang_thai='du_dung') AS hocLieuDaDuyet,(SELECT COUNT(*) FROM hoc_sinh) AS soHocSinh")
  console.log(JSON.stringify({ soBang: tables[0].n, soTrigger: triggers[0].n, ...stats[0] }))
}
if (process.argv.includes('--live')) {
  const sha = process.env.CHUA_RELEASE_SHA
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Thiếu commit cần kiểm trên bản sống.')
  async function cf(path) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) })
    const j = await r.json()
    if (!r.ok || !j.success) throw new Error(`Chưa đọc được bản phát hành Cloudflare (${r.status}).`)
    return j.result
  }
  const deployments = await cf('workers/scripts/omr/deployments')
  const active = (deployments.deployments ?? deployments)[0]?.versions
  if (!active?.length || active.length !== 1 || active[0].percentage !== 100) throw new Error('Worker chưa chạy một bản 100%.')
  const version = await cf(`workers/scripts/omr/versions/${active[0].version_id}`)
  if ((version.annotations ?? version.metadata?.annotations)?.['workers/tag'] !== sha) throw new Error('Worker sống khác commit cần phát hành.')
  const pages = await cf('pages/projects/omr-app')
  const live = pages.canonical_deployment
  if (live?.deployment_trigger?.metadata?.commit_hash !== sha || live.latest_stage?.status !== 'success') throw new Error('Pages sống khác commit hoặc chưa phát hành xong.')
  for (const path of ['/', '/hs', '/ph', '/sw-version.json']) {
    const r = await fetch(`https://omr-app-b3u.pages.dev${path}?chua=${sha}`, { signal: AbortSignal.timeout(30000) })
    if (!r.ok) throw new Error(`Đường giao diện ${path} trả HTTP ${r.status}.`)
    if (path === '/sw-version.json' && !Number.isFinite((await r.json()).builtAt)) throw new Error('Thiếu phiên bản service worker.')
  }
  for (const [path, status] of [['/hs/chua-cau-sai/danh-sach',401],['/gv/chua-cau-sai/hang-chieu',403]]) {
    const r = await fetch(`https://omr.ttadodaihoc.workers.dev${path}`, { method:'POST', headers:{'content-type':'application/json'}, body:'{}', signal:AbortSignal.timeout(30000) })
    if (r.status !== status) throw new Error(`Đường vòng chữa sống chưa đúng cổng quyền (${r.status}).`)
  }
  console.log(JSON.stringify({ workerCommit:sha, pagesCommit:sha, duongGiaoDienTot:4, congQuyenVongChuaTot:2 }))
}
