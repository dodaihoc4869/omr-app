// 28/10 (claude/kv-san-sang-2810) — BẢN SAO ĐỌC D1 (read replication) + KV cho Sảnh lập sẵn. CHỈ cấu hình, KHÔNG đọc / ghi dòng dữ liệu nào.
// Lệnh (dòng đầu lenh-kv.txt): `hoi` (chế độ bản sao đọc của D1 thật + sao, danh sách KV omr-*), `kv-tao` (tạo KV omr-san-sang + omr-thu-tai-san-sang nếu chưa có),
// `bat-sao` (bật bản sao đọc cho D1 SAO), `bat-that` (bật cho D1 THẬT — chỉ cấu hình, đảo được bằng `tat-that`). In: mã HTTP, chế độ, mã KV (không bí mật).
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC, DB_THAT, LENH = '' } = process.env
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const API = `https://api.cloudflare.com/client/v4/accounts/${ACC}`
const an = (s) => String(s).replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '<…>').slice(0, 300)
const goi = async (pt, duong, than) => { const r = await fetch(API + duong, { method: pt, headers: H, body: than ? JSON.stringify(than) : undefined }); let j = null; try { j = await r.json() } catch { /* */ } return { ma: r.status, j } }
const dsD1 = (await goi('GET', '/d1/database?per_page=100')).j?.result ?? []
const sao = dsD1.find((d) => d.name === 'omr-thu-tai')?.uuid
const cheDo = async (ten, id) => { if (!id) return console.log(`D1 ${ten}: không thấy`); const r = await goi('GET', `/d1/database/${id}`); console.log(`D1 ${ten}: HTTP ${r.ma} · bản sao đọc = ${JSON.stringify(r.j?.result?.read_replication ?? null)} · vùng chính = ${r.j?.result?.running_in_region ?? r.j?.result?.primary_location_hint ?? '?'}${r.j?.success ? '' : ' · lỗi ' + an(JSON.stringify(r.j?.errors))}`) }
const bat = async (ten, id, mode) => {
  if (!id) return
  if (ten === 'thật' && id !== DB_THAT) return console.log('DỪNG: mã D1 thật không khớp')
  for (const pt of ['PUT', 'PATCH']) {
    const r = await goi(pt, `/d1/database/${id}`, { read_replication: { mode } })
    console.log(`Đặt bản sao đọc D1 ${ten} = ${mode} (${pt}): HTTP ${r.ma} · ${r.j?.success ? 'thành công' : an(JSON.stringify(r.j?.errors))}`)
    if (r.j?.success) break
  }
}
if (/\bbat-sao\b/.test(LENH)) await bat('sao', sao, 'auto')
if (/\bbat-that\b/.test(LENH)) await bat('thật', DB_THAT, 'auto')
if (/\btat-that\b/.test(LENH)) await bat('thật', DB_THAT, 'disabled')
await cheDo('thật', DB_THAT); await cheDo('sao', sao)
const dsKv = async () => (await goi('GET', '/storage/kv/namespaces?per_page=100')).j?.result ?? []
let kv = await dsKv()
if (/\bkv-tao\b/.test(LENH)) for (const t of ['omr-san-sang', 'omr-thu-tai-san-sang']) if (!kv.some((n) => n.title === t)) { const r = await goi('POST', '/storage/kv/namespaces', { title: t }); console.log(`Tạo KV ${t}: HTTP ${r.ma} · ${r.j?.success ? 'thành công' : an(JSON.stringify(r.j?.errors))}`) }
kv = await dsKv()
for (const n of kv.filter((n) => /^omr/.test(n.title))) console.log(`KV ${n.title} = ${n.id}`)
