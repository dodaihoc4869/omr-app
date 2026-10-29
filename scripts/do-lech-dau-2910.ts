// ĐO «BẢN LẬP SẴN LỆCH DẤU VÌ PHẦN NÀO» (29/10 20:00, thầy «Mở app phải tức thì 100%»; đo cao điểm 19:55: chỉ ~62 % lượt Sảnh / Mở chặng dùng bản lập sẵn, ~35 % đi đường lập kế hoạch nặng).
// CHỈ ĐỌC (D1 REST, chỉ SELECT), CHỈ IN SỐ ĐẾM: với mỗi bản lập sẵn hôm nay, đọc DẤU HIỆN TẠI (cùng câu SQL như lượt Sảnh) rồi so từng đoạn với dấu đã lưu ⇒ đếm bản khớp / lệch,
// và lệch ở đoạn nào (a/s/g… = việc học của chính em; ch/bdd/gg/cd… = thay đổi CHUNG của thầy/hệ thống). Không in số báo danh.
import { writeSync } from 'node:fs'
import '../server/src/index'
import { BAN_DAU, sqlDauSanSang, chuoiDau } from '../server/src/san-sang'
import { ngayVn7 } from '../server/src/goi-bai-7-loi'

type Row = Record<string, unknown>
const KHOA = ['a', 's', 'g', 'lg', 'cl', 'kt', 'goi', 'gg', 'hs', 'pv', 'ch', 'kho', 'dk', 'ca', 'ng', 'bt', 'cd', 'cde', 'bdd']
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
const now = Date.now(), ngay = ngayVn7(now)
const ban = await hoi('SELECT sbd, luc, dau FROM hoc_tap_san_sang WHERE ngay=?', [ngay])
ra(`bản lập sẵn hôm nay: ${ban.length} · cách tính dấu ${BAN_DAU}`)
const sql = sqlDauSanSang(new Set(), true)
let khop = 0, lech = 0, khacBan = 0
const theoKhoa = new Map<string, number>(), soDoan = new Map<number, number>(), tuoi: number[] = []
let chiRiengEm = 0, coChung = 0
const CHUNG = new Set(['gg', 'ch', 'kho', 'dk', 'ca', 'ng', 'cd', 'bdd'])
let i = 0
async function xet(): Promise<void> {
  for (;;) {
    const b = ban[i++]; if (!b) return
    const r = (await hoi(sql, [String(b.sbd)]))[0]
    const hienTai = chuoiDau(r)
    if (!hienTai) continue
    const luu = String(b.dau)
    if (luu === hienTai) { khop++; continue }
    if (!luu.startsWith(BAN_DAU + '§')) { khacBan++; continue }
    lech++
    const a = luu.split('§').slice(1), c = hienTai.split('§').slice(1)
    const khacKhoa: string[] = []
    for (let k = 0; k < KHOA.length; k++) if (a[k] !== c[k]) { khacKhoa.push(KHOA[k]!); theoKhoa.set(KHOA[k]!, (theoKhoa.get(KHOA[k]!) ?? 0) + 1) }
    soDoan.set(khacKhoa.length, (soDoan.get(khacKhoa.length) ?? 0) + 1)
    if (khacKhoa.some((k) => CHUNG.has(k))) coChung++; else chiRiengEm++
    tuoi.push(Math.round((now - Number(b.luc)) / 60000))
  }
}
await Promise.all([xet(), xet(), xet(), xet(), xet()])
tuoi.sort((x, y) => x - y)
ra(`KHỚP dấu (lượt Sảnh dùng được bản sẵn): ${khop} · LỆCH: ${lech} · bản theo cách tính dấu cũ: ${khacBan}`)
ra(`LỆCH — có đoạn CHUNG đổi (thầy / hệ thống): ${coChung} · chỉ việc học riêng của em: ${chiRiengEm}`)
ra(`LỆCH — theo đoạn: ${[...theoKhoa].sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k}=${n}`).join(' · ') || '—'}`)
ra(`LỆCH — số đoạn khác nhau: ${[...soDoan].sort((x, y) => x[0] - y[0]).map(([k, n]) => `${k}đoạn=${n}`).join(' · ') || '—'}`)
ra(`LỆCH — tuổi bản (phút) p50/p90/max: ${tuoi.length ? `${tuoi[Math.floor(tuoi.length / 2)]}/${tuoi[Math.floor(tuoi.length * 0.9)]}/${tuoi[tuoi.length - 1]}` : '—'}`)
process.exit(0)
