// Thầy đã chọn tất cả học sinh và yêu cầu phát hành. Không sửa điểm hoặc tự duyệt học liệu.
import '../server/src/index'
import { execFileSync } from 'node:child_process'
import { taoDbVanHanh } from './chua-d1-van-hanh'
import { dongBoTuCu, giaoPilot } from '../server/src/chua-cau-sai-thay'
import { chuanCauHinh } from '../server/src/chua-cau-sai-cau-hinh'
import type { Env } from '../server/src/kieu'

const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`
const db = taoDbVanHanh(async sql => {
  const r = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }), signal: AbortSignal.timeout(60000) })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(`D1 không hoàn tất (${r.status}).`)
  return j.result
})
const env = { DB: db, DE: {
  async get(key: string) {
    const body = execFileSync('npx', ['wrangler','r2','object','get',`omr-de/${key}`,'--remote','--pipe','--config','server/wrangler.toml'], { maxBuffer: 32 * 1024 * 1024, stdio: ['ignore','pipe','pipe'] })
    return { body: new Uint8Array(body), async json() { return JSON.parse(body.toString()) } }
  },
  async put() { throw new Error('Công cụ này không được ghi R2.') },
  async delete() { throw new Error('Công cụ này không được xoá R2.') },
}, MA_BI_MAT: 'khong-dung' } as unknown as Env
const receiptKey = 'chua_cau_sai_phat_hanh_0710'
async function nhan(r: Response) { const j = await r.json(); if (!r.ok || !j.ok) throw new Error('Chưa hoàn tất thao tác vòng chữa; giữ vị trí để thử lại.'); return j }
async function main() {
  // Chỉ chạy sau khi workflow phát hành đúng commit thành công; kiểm thêm hai đường sống.
  for (const [path, status] of [['/hs/chua-cau-sai/danh-sach',401],['/gv/chua-cau-sai/hang-chieu',403]] as const) {
    const r = await fetch(`https://omr.ttadodaihoc.workers.dev${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    if (r.status !== status) throw new Error('Worker sống chưa đúng hợp đồng vòng chữa.')
  }
  const old = await db.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').bind(receiptKey).first<{gia_tri: string}>()
  if (!old) {
    const config = chuanCauHinh({
      bat: true, phamVi: 'tat_ca', lop: [], sbd: [], dongBoTuLuyen: true,
      kiemLaiSauGio: 24, chanDoanToiDa: 4, vongHoTroToiDaMoiBuoc: 2,
      phutToiDaMotLuot: 10, cuaSoDoNgay: 7, cohortId: 'toan-truong-chua-0710',
    })
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').bind(receiptKey, JSON.stringify({ bat: true, release: process.env.CHUA_RELEASE_SHA, cursor: '', offset: 0 }), new Date().toISOString()),
      db.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) SELECT 'chua_cau_sai_v1',?,? WHERE changes()=1 ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc").bind(JSON.stringify(config), new Date().toISOString()),
    ])
  }
  const cfg = await db.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='chua_cau_sai_v1'").first<{gia_tri: string}>()
  const c = chuanCauHinh(JSON.parse(cfg?.gia_tri ?? '{}'))
  if (!c.bat || c.phamVi !== 'tat_ca') throw new Error('Cấu hình hiện đã thay đổi; không tự bật lại.')
  console.log('Đã đọc lại cờ sống: bật cho tất cả học sinh; đồng bộ cũ bằng mã máy chủ đã phát hành.')
  const receipt = JSON.parse((await db.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').bind(receiptKey).first<{gia_tri: string}>())!.gia_tri)
  async function luu() { await db.prepare('UPDATE cau_hinh SET gia_tri=?,cap_nhat_luc=? WHERE khoa=?').bind(JSON.stringify(receipt), new Date().toISOString(), receiptKey).run() }
  let n = 0
  while (!receipt.tuXong) {
    const r = await nhan(await dongBoTuCu(env, { cursor: receipt.cursor }))
    receipt.cursor = r.cursor; receipt.tuXong = !r.con
    await luu()
    if (++n % 10 === 0 || receipt.tuXong) console.log(JSON.stringify({ soLuotTuDaRa: n, tuXong: receipt.tuXong }))
  }
  n = 0
  while (!receipt.giaoXong) {
    const r = await nhan(await giaoPilot(env, { offset: receipt.offset }))
    if (r.ds.some((x: {ok: boolean; ma?: string}) => !x.ok && x.ma !== 'CHUA_CO_LOI')) throw new Error('Có câu chưa giao được; giữ vị trí cũ.')
    receipt.offset = r.tiepOffset; receipt.giaoXong = !r.con
    await luu()
    n += r.ds.length
    if (n % 50 === 0 || receipt.giaoXong) console.log(JSON.stringify({ soCapEmCauDaRa: n, giaoXong: receipt.giaoXong }))
  }
  const stats = await db.prepare('SELECT trang_thai_day AS trangThai,COUNT(*) AS soDot,COUNT(DISTINCT sbd) AS soEm FROM chua_loi_dot WHERE dong_luc IS NULL GROUP BY trang_thai_day').all()
  const material = await db.prepare("SELECT COUNT(*) AS soHocLieuDaDuyet FROM chua_loi_hoc_lieu WHERE trang_thai='du_dung'").first()
  console.log(JSON.stringify({ dot: stats.results, hocLieu: material, dongBoCuHoanTat: true }))
}
main().catch(() => { console.error('Chưa hoàn tất bật/đồng bộ vòng chữa. Không in dữ liệu riêng; đọc lại receipt trong D1 khi chạy lại.'); process.exitCode = 1 })
