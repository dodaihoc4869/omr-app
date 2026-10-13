// @vitest-environment node
// Đợt 21 · tối ưu máy chủ chuyên sâu (thầy 13/10: "tối ưu máy chủ chuyên sâu hơn nữa, đảm bảo 100% app load tức thì và máy chủ phản hồi tức thì").
// Khoá: cron gộp ba hành trình KHÔNG quét lại cả kho / ghi lại ba dòng chiến dịch lớn khi kho câu, danh sách em, chiến dịch không đổi (dấu vân tay);
// có đổi (lập lại chỉ mục một tờ, thêm em) ⇒ gộp lại đầy đủ như cũ.
import { afterEach, expect, it } from 'vitest'
import { dongBoBaHanhTrinh, idHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { taoKhoOmni, themChienDich, T_SANG } from './omni-3-ke-hoach-chung'
import { taoD1That } from './_d1-that'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { gvNhipHoc } from '../server/src/nhip-hoc'
import type { Env } from '../server/src/kieu'

const PHUT = 60_000
const kho = () => {
  const k = taoKhoOmni({ 'DH-B0': 0, 'DH-B1': 60, 'DH-B2': 0, 'DH-B3': 0, 'KHO-A': 0 })
  const rows = k.d.sql.prepare('SELECT qid,json FROM game_v2_question').all() as { qid: string; json: string }[]
  for (const r of rows) k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({ ...JSON.parse(r.json), mucDo: 'NB' }), r.qid)
  themChienDich(k.d, { id: 'nguon', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1', 'S2'], taoLuc: '2026-10-01T02:00:00Z', hanNop: '2026-10-09' })
  return k
}
afterEach(() => xoaDemChienDich())

it('không đổi gì ⇒ bỏ qua: không đọc kho, không ghi; đổi kho / thêm em ⇒ gộp lại đầy đủ', async () => {
  const k = kho()
  // T_SANG là buổi sáng (ngoài cao điểm) ⇒ chu kỳ 5 phút.
  expect((await dongBoBaHanhTrinh(k.env, T_SANG)).trangThai).toBe('vua_hop_nhat')
  const qidTruoc = (k.d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as { qid_json: string }).qid_json

  // Lượt kế (qua chu kỳ), không gì đổi ⇒ "khong_doi", không lệnh đọc kho câu, không lệnh ghi.
  const sqls: string[] = []
  const prepare = k.env.DB.prepare.bind(k.env.DB)
  ;(k.env.DB as { prepare: typeof prepare }).prepare = (sql: string) => { sqls.push(sql); return prepare(sql) }
  expect((await dongBoBaHanhTrinh(k.env, T_SANG + 6 * PHUT)).trangThai).toBe('khong_doi')
  expect(sqls.some((s) => /FROM game_v2_question g/.test(s))).toBe(false)
  expect(sqls.some((s) => /^\s*(INSERT|UPDATE)/i.test(s))).toBe(false)
  // Bốn lệnh nhẹ: ca mở · mốc gộp trước · vân tay (một lệnh) · danh sách em.
  expect(sqls.length).toBeLessThanOrEqual(4)

  // Trong cùng chu kỳ của isolate ⇒ không hỏi D1 lần nữa.
  sqls.length = 0
  expect((await dongBoBaHanhTrinh(k.env, T_SANG + 7 * PHUT)).trangThai).toBe('da_cap_nhat')
  expect(sqls.length).toBe(0)

  // Một tờ vừa lập lại chỉ mục (game_v2_index.indexed_at đổi) ⇒ gộp lại đầy đủ.
  k.d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v2',?) ON CONFLICT(ma_de) DO UPDATE SET source_version=excluded.source_version,indexed_at=excluded.indexed_at").run('2026-10-13T09:00:00Z')
  expect((await dongBoBaHanhTrinh(k.env, T_SANG + 12 * PHUT)).trangThai).toBe('da_dong_bo')
  expect((k.d.sql.prepare('SELECT qid_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as { qid_json: string }).qid_json).toBe(qidTruoc)

  // Lượt sau nữa không đổi ⇒ lại bỏ qua; thêm một em ⇒ gộp lại.
  expect((await dongBoBaHanhTrinh(k.env, T_SANG + 18 * PHUT)).trangThai).toBe('khong_doi')
  k.d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S9','Em mới','12','2026-10-13T09:00:00Z')").run()
  expect((await dongBoBaHanhTrinh(k.env, T_SANG + 24 * PHUT)).trangThai).toBe('da_dong_bo')
  expect(JSON.parse((k.d.sql.prepare('SELECT sbd_json FROM chien_dich WHERE id=?').get(idHanhTrinh(12)) as { sbd_json: string }).sbd_json)).toContain('S9')
  k.d.sql.close()
})

// ── Nhịp học của thầy: cờ "đối phó" (hai truy vấn quét sổ 14 ngày cả trường) nhớ 5 phút theo isolate ──

it('Nhịp học thầy: cờ đối phó đọc sổ MỘT lần trong 5 phút; qua 5 phút đọc lại; kết quả y hệt', async () => {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('D', 'Đỗ Dũng', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run('D', 'Đỗ Dũng', '12', '12 - Tinh Hoa', null, 'x')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES ('hanh-trinh-v3-khoi-12','HT','Khối 12','[\"D\"]','[]','[]','9999-12-31','2026-10-01T00:00:00Z','dang_chay')").run()
  for (let i = 0; i < 8; i++) d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${i}`, 'D', `D-I-${i}`, 'game', 'P', 1, i % 2, i < 5 ? 4 : 30, `2026-10-13T0${i}:00:00Z`, '2026-10-13', JSON.stringify({ chon: 'C' }))
  const env = d.env as unknown as Env
  const NOW = Date.parse('2026-10-14T05:00:00Z')
  const dem = { n: 0 }
  const prepare = env.DB.prepare.bind(env.DB)
  ;(env.DB as { prepare: typeof prepare }).prepare = (sql: string) => { if (/^WITH (r|t) AS/.test(sql)) dem.n++; return prepare(sql) }
  const a = await gvNhipHoc(env, {}, NOW)
  const soLan1 = dem.n
  expect(soLan1).toBeGreaterThan(0)
  const b = await gvNhipHoc(env, {}, NOW + 60_000)
  expect(dem.n).toBe(soLan1)
  expect(JSON.stringify((b as { em: unknown[] }).em)).toBe(JSON.stringify((a as { em: unknown[] }).em))
  await gvNhipHoc(env, {}, NOW + 6 * 60_000)
  expect(dem.n).toBe(2 * soLan1)
  d.sql.close()
})
