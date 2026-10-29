// ĐO «EM BỊ KHOÁ CHẶNG VÌ TỰ SỬA LỖI» (29/10 20:15, thầy: «sao vẫn có học sinh bị vậy» — ảnh Lộ trình cho bấm BẮT ĐẦU chặng 1 + «Tự sửa lỗi ✓ · Sửa 2 lỗi cũ 2/2» nhưng mở chặng
// báo «Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé»). CHỈ ĐỌC (D1 REST, chỉ SELECT), CHỈ IN SỐ ĐẾM, không in số báo danh.
// Với mọi em có dòng khoá Sửa lỗi hôm nay (`tu_sua_khoa_ngay`): chạy ĐÚNG hàm `conPhanNgay` của máy chủ (số câu phần ngày chưa xong phần) trên dữ liệu thật và phân loại.
import { writeSync } from 'node:fs'
import '../server/src/index'
import { conPhanNgay, chuanMuc, chuanMucTieu, SO_CAU_PHAN_NGAY } from '../server/src/tu-sua-viec-ngay'

type Row = Record<string, unknown>
const ra = (s: string): void => { writeSync(1, s + '\n') }
async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('CHỈ ĐỌC')
  const tai = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN, db = process.env.OMR_D1_ID
  for (let lan = 0; ; lan++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${tai}/d1/database/${db}/query`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ sql, params }) })
    const j = (await r.json().catch(() => ({}))) as { success?: boolean; result?: { results?: Row[] }[] }
    if (j.success) return j.result?.[0]?.results ?? []
    if (lan < 2) { await new Promise((ok) => setTimeout(ok, 1500)); continue }
    throw new Error(`D1 ${r.status}`)
  }
}
const now = Date.now()
const ngay = new Date(now + 7 * 3600_000).toISOString().slice(0, 10)
const khoa = await hoi('SELECT sbd, luc FROM tu_sua_khoa_ngay WHERE ngay_vn=?', [ngay])
ra(`hôm nay ${ngay} · em có dòng khoá Sửa lỗi: ${khoa.length}`)
const SQL = `SELECT k.luc AS khoa, v.muc_json AS m, v.xong_json AS x, v.cap_nhat_luc AS cn,
  (SELECT json_group_array(dot_id) FROM (SELECT DISTINCT dot_id FROM chua_gon_lan WHERE sbd=?1 AND ngay_vn=?2 AND (dung=1 OR lan>=2))) AS xg,
  (SELECT muc_tieu FROM tu_sua_muc_tieu_ngay WHERE sbd=?1 AND ngay_vn=?2) AS mt
  FROM tu_sua_khoa_ngay k LEFT JOIN tu_sua_viec_ngay v ON v.sbd=k.sbd AND v.ngay_vn=k.ngay_vn WHERE k.sbd=?1 AND k.ngay_vn=?2`
const dem = new Map<string, number>(), mau: string[] = []
let i = 0
async function xet(): Promise<void> {
  for (;;) {
    const k = khoa[i++]; if (!k) return
    const d = (await hoi(SQL, [String(k.sbd), ngay]))[0]
    if (!d) { dem.set('không đọc được', (dem.get('không đọc được') ?? 0) + 1); continue }
    const con = conPhanNgay(d)
    const m = (() => { try { return chuanMuc(JSON.parse(String(d.m ?? '[]'))) } catch { return [] } })()
    const mt = chuanMucTieu(d.mt) || SO_CAU_PHAN_NGAY
    const nhom = con === 0 ? 'KHÔNG chặn (con=0)' : m.length === 0 ? 'CHẶN · máy chủ không có việc hôm nay (muc rỗng)' : m.length < mt ? `CHẶN · việc ${m.length} < mục tiêu ${mt}` : 'CHẶN · đủ việc, câu chưa xong phần'
    dem.set(nhom, (dem.get(nhom) ?? 0) + 1)
    if (con > 0 && mau.length < 25) mau.push(`con=${con} · việc=${m.length} · mt=${chuanMucTieu(d.mt)} · x=${(() => { try { return JSON.parse(String(d.x ?? '[]')).length } catch { return -1 } })()} · xg=${(() => { try { return JSON.parse(String(d.xg ?? '[]')).length } catch { return -1 } })()} · khoá cách ${Math.round((now - Number(d.khoa)) / 60000)} phút · việc cập nhật cách ${d.cn ? Math.round((now - Number(d.cn)) / 60000) + ' phút' : 'chưa có'}`)
  }
}
await Promise.all([xet(), xet(), xet(), xet(), xet()])
for (const [k, n] of [...dem].sort((a, b) => b[1] - a[1])) ra(`${k}: ${n}`)
ra('--- mẫu em đang BỊ CHẶN (không số báo danh):')
for (const m of mau) ra('  ' + m)
process.exit(0)
