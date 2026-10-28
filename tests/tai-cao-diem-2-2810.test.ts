// @vitest-environment node
// THỬ TẢI 270 EM — lượt 2 (28/10 chiều). Khoá:
//  · dấu Sảnh sẵn KHÔNG đổi khi việc nền ghi bản đệm / con trỏ vào `cau_hinh` (vd Bảng tin thầy tính lại «sai nhanh» mỗi 10 phút) — đổi khi công tắc thật đổi.
//  · bản chụp kho dùng chung nén gzip ⇒ giải nén ra đúng chuỗi.
import { afterEach, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { dauSanSang, batDemDauChung, SQL_SAN_SANG, KHOA_CH_KHONG_DAU, moChangSanSang } from '../server/src/san-sang'
import { nen, giaiNen } from '../server/src/kho-chung'
import { chupHoSoTho, dungSanOmni, hoSoOmniEm, xoaDemOmni } from '../server/src/omni-d1'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { docChienDichCuaEm, xoaDemChienDich } from '../server/src/srs2-d1'
import { docCauHinhDem, xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import type { Env } from '../server/src/kieu'

afterEach(() => { batDemDauChung(false) })

it('dấu Sảnh sẵn: ghi bản đệm / con trỏ của việc nền ⇒ dấu giữ nguyên; đổi công tắc ⇒ dấu đổi', async () => {
  const d = taoD1That()
  for (const q of SQL_SAN_SANG) d.sql.exec(q)
  d.sql.exec(`CREATE TABLE IF NOT EXISTS goi_bai_7_gap (sbd TEXT, qid TEXT, luc TEXT); CREATE TABLE IF NOT EXISTS goi_bai_7_em (goi_id TEXT, sbd TEXT, bat_dau TEXT, han TEXT);
    CREATE TABLE IF NOT EXISTS goi_bai_7 (id TEXT PRIMARY KEY, tao_luc TEXT); CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT, sbd TEXT, them_luc TEXT, bot_luc TEXT)`)
  const env = d.env as unknown as Env
  batDemDauChung(false)
  const now = Date.parse('2026-10-28T12:00:00Z')
  const dau0 = await dauSanSang(env, 'S1', now)
  expect(dau0).toBeTruthy()
  for (const k of KHOA_CH_KHONG_DAU) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri, cap_nhat_luc=excluded.cap_nhat_luc").run(k, '{"x":1}', '2026-10-28T12:05:00.000Z')
  expect(await dauSanSang(env, 'S1', now)).toBe(dau0)
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{\"bat\":true}','2026-10-28T12:06:00.000Z') ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri, cap_nhat_luc=excluded.cap_nhat_luc").run()
  expect(await dauSanSang(env, 'S1', now)).not.toBe(dau0)
})

it('bản chụp kho: nén gzip + base64 ⇒ giải nén ra đúng chuỗi (chữ Việt, dài)', async () => {
  const chu = JSON.stringify({ cau: Array.from({ length: 3000 }, (_, i) => [`DH-B${i % 9}`, `q${i}`, 'Nhóm «este» — phản ứng xà phòng hoá', i % 3, null]), q: [] })
  const b64 = await nen(chu)
  expect(b64.length).toBeLessThan(chu.length / 3)
  expect(await giaiNen(b64)).toBe(chu)
})

it('dựng sẵn trước giờ học: điểm gọn thiếu ⇒ dựng đúng các dòng omni_p_vkn; prior lớp cất sẵn ⇒ hồ sơ y hệt tính như cũ', async () => {
  const k = taoKhoOmni({}, 8)
  k.d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x'),('omni','{"bat":true,"lop":["12A1"]}','x')`)
  const now = Date.parse('2026-10-12T08:30:00Z')
  const qs = k.qids('DH-B1')
  const st = k.d.sql.prepare("INSERT INTO su_kien_hoc (khoa, nguon, ma_nguon, sbd, qid, lan, ket_qua, luc, ngay_vn, ma_dang, received_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
  let i = 0
  for (let e = 1; e <= 8; e++) for (const q of qs.slice(0, 8)) { const luc = now - 86_400_000 * 2 - i * 60_000; st.run(`k${i++}`, 'game', 'p', `S${e}`, q, 1, (e + i) % 3 ? 1 : 0, new Date(luc).toISOString(), '2026-10-10', 'DH-B1.D0', luc) }
  const env = k.env as Env
  const ems = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
  await chupHoSoTho(env, ems, '2026-10-12')
  xoaDemOmni()
  const cu = await hoSoOmniEm(env, 'S3', now) // như cũ: prior tính từ hồ sơ thô cả lớp
  await new Promise((r) => setTimeout(r, 30))
  k.d.sql.exec('DELETE FROM omni_p_gon; DELETE FROM omni_prior_em')
  xoaDemOmni()
  const r = await dungSanOmni(env, now)
  expect(r.gon).toBe(8)
  expect(r.lop).toBe(1)
  const dong = k.d.sql.prepare('SELECT vkn_id,p,trang_thai FROM omni_p_vkn WHERE sbd=? ORDER BY vkn_id').all('S5') as Record<string, unknown>[]
  expect(JSON.parse((k.d.sql.prepare('SELECT json FROM omni_p_gon WHERE sbd=?').get('S5') as { json: string }).json)).toEqual(dong.map((x) => [x.vkn_id, x.p, x.trang_thai]))
  expect(k.d.dem('omni_prior_em')).toBeGreaterThanOrEqual(8)
  expect(await dungSanOmni(env, now)).toEqual({ gon: 0, lop: 0 }) // đã đủ ⇒ không làm lại
  xoaDemOmni()
  expect(JSON.stringify(await hoSoOmniEm(env, 'S3', now))).toBe(JSON.stringify(cu))
})

it('chặng RỖNG lập sẵn (em đã xong phần hôm nay) ⇒ mở chặng trả đúng phản hồi đã lập, không chạm D1', async () => {
  const rong = { ok: true, questions: [], goi7: { ngay: '2026-10-28' }, message: 'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.' }
  let cham = 0
  const env = { DB: { prepare: () => { cham++; throw new Error('không được chạm D1') }, batch: () => { cham++; throw new Error('không được chạm D1') } } } as unknown as Env
  const ban = { ngay: '2026-10-28', luc: 1000, dau: 'v3§x', sanh: null, chang: { rong } as never, phienMoi: 0 }
  expect(await moChangSanSang(env, 'S1', 2000, ban)).toEqual(rong)
  expect(cham).toBe(0)
  expect(await moChangSanSang(env, 'S1', 2000, { ...ban, phienMoi: 1500 })).toBeNull() // có đợt mới hơn bản sẵn ⇒ đường thường
})

it('đàn đọc dồn: D1 chậm hơn 240 ms ⇒ lượt đồng thời CHỜ lượt đang đọc (chiến dịch, cờ cấu hình) — một lượt D1 thay vì mỗi lượt một', async () => {
  const d = taoD1That()
  const goc = d.env as unknown as Env
  let lan = 0
  const cham = (q: string) => /FROM chien_dich WHERE trang_thai <> 'da_huy' OR|FROM cau_hinh WHERE khoa/.test(q)
  const env = { ...goc, DB: { ...goc.DB, prepare: (q: string) => {
    const st = (goc.DB as unknown as { prepare(x: string): Record<string, (...a: unknown[]) => unknown> }).prepare(q)
    if (!cham(q)) return st
    const boc = (x: Record<string, (...a: unknown[]) => unknown>): Record<string, unknown> => ({ bind: (...a: unknown[]) => boc(x.bind!(...a) as never), all: async () => { lan++; await new Promise((r) => setTimeout(r, 400)); return x.all!() }, first: async () => { lan++; await new Promise((r) => setTimeout(r, 400)); return x.first!() } })
    return boc(st)
  } } } as unknown as Env
  xoaDemChienDich()
  await Promise.all([docChienDichCuaEm(env, 'S1'), docChienDichCuaEm(env, 'S2'), docChienDichCuaEm(env, 'S3')])
  expect(lan).toBe(1)
  lan = 0
  xoaDemCauHinh(env)
  await Promise.all([docCauHinhDem(env, 'omni'), docCauHinhDem(env, 'omni'), docCauHinhDem(env, 'omni')])
  expect(lan).toBe(1)
})
