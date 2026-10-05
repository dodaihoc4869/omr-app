// @vitest-environment node
// OMNI 3 · TICK BÀI ĐÃ DẠY → CHIẾN DỊCH THEO BÀI (server/src/bai-da-day.ts, `POST /gv/bai-da-day`). Khoá:
//   (1) tick tạo ĐÚNG MỘT chiến dịch bằng đường có sẵn (`gvChienDich` tao): đúng tờ (bỏ tự luận, bỏ Ví dụ minh hoạ), tên "Bài N · Tên", em của lớp lúc tick,
//       hạn tự tính D ∈ [7, 14] từ lượt cần của em trung vị (`suc-chua`) + thể lực lớp; tick lần hai / hai lượt đồng thời không tạo thêm;
//   (2) xem-truoc đủ 6 con số, không ghi gì; duDiem8 null khi OMNI tắt, bật ⇒ đếm theo `xetChungChi` (tiêm bằng vi.mock — không phụ thuộc stub);
//   (3) bỏ tick: chưa có lượt làm từ lúc tạo ⇒ huỷ, có ⇒ đóng; (4) phạm vi = bài tick ∪ bài trước, không đè dòng 'tick';
//   (5) lớp của em theo nguồn màn Học sinh; (6) danh-sach: trạng thái, hạn, còn ngày, chứng chỉ, chờ bài mới; (7) bảng tạo lúc chạy = bản SQL.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { xoaMoiDem } from '../server/src/dem-chung'

const co = vi.hoisted(() => ({ omni: new Set<string>(), uoc: new Map<string, { dat: boolean; uocNgay: number | null }>(), hoSoGoi: [] as string[][], nhip: [] as number[] }))
vi.mock('../server/src/omni-d1', async (orig) => {
  const m = await orig<typeof import('../server/src/omni-d1')>()
  return {
    ...m,
    omniBat: async (_env: unknown, sbd: string) => co.omni.has(sbd),
    hoSoOmniNhieuEm: async (_env: unknown, ds: readonly string[]) => { co.hoSoGoi.push([...ds]); return new Map(ds.map((s) => [s, { sbd: s }])) },
    qCuaCau: async (_env: unknown, qids: readonly string[]) => new Map(qids.map((q) => [q, { qid: q, phan: 'I', maDang: null, mucDo: null, vkn: [`cau:${q}`], nguon: 'mac_dinh' }])),
  }
})
vi.mock('../server/src/du-bao-diem', async (orig) => ({
  ...(await orig<typeof import('../server/src/du-bao-diem')>()),
  duBaoDiem: () => ({ kyVong: 0, p8: 0.5, saiSo: 0, pmf: [], conDuong: null, conThieu: { vkn: [], soY: 0 }, soBangChung: 0 }),
}))
vi.mock('../server/src/omni-chung-chi', async (orig) => ({
  ...(await orig<typeof import('../server/src/omni-chung-chi')>()),
  xetChungChi: (hs: { sbd: string }, _cau: unknown, _db: unknown, _ca: unknown, nhip: number) => {
    co.nhip.push(nhip)
    const u = co.uoc.get(hs.sbd) ?? { dat: false, uocNgay: null }
    return { dat: u.dat, doTin: 0.5, thieu: [], conThieu: { vkn: [], soY: 0 }, uocNgay: u.uocNgay }
  },
}))
const { gvBaiDaDay, phamViLop, phamViCuaEm, lopCuaEm, tenChienDichBai, dungPhamVi, SQL_BANG_BAI_DA_DAY } = await import('../server/src/bai-da-day')

const T0 = Date.parse('2026-10-05T09:00:00+07:00') // hôm nay (VN) 2026-10-05
const NGAY = 86_400_000
const LOP = '12 - Tinh Hoa'
const B6 = 'DH-12-C2-B6'
const MA_B6 = [`${B6}-TN`, `${B6}-DS`, `${B6}-TLN`, `${B6}-DT`]
/** Tờ thật sự vào bài (thầy 05/10: chỉ Trắc nghiệm / Đúng sai / Trả lời ngắn — máy chủ tự bỏ -VD / -DT / -TL kể cả khi app cũ còn gửi). */
const MA_B6_GIAO = [`${B6}-TN`, `${B6}-DS`, `${B6}-TLN`]
const TEN_B6 = 'Bài 6. Tinh bột và cellulose'
const BAI_TRUOC = [
  { khoaBai: 'B4', tenBai: 'Bài 4. Glucose và fructose', viTri: 4, maDe: ['DH-12-C2-B4-TN'] },
  { khoaBai: 'B5', tenBai: 'Bài 5. Saccharose và maltose', viTri: 5, maDe: ['DH-12-C2-B5-TN', 'DH-12-C2-B5-DS'] },
]

type Tho = Record<string, unknown>
const cau = (maDe: string, qid: string, phan: 'I' | 'II' | 'III', o: Tho = {}) => JSON.stringify({
  qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: [phan === 'II' ? 'cellulose' : 'tinh_bot'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'c' }, ...o,
})
function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  // Lớp Tinh Hoa: S1, S2, S3. S4 lớp khác. S5 cùng lớp nhưng đã khoá. S6 chỉ có trong danh sách cổng (khối 12, chưa xếp lớp ⇒ "12 - Lớp Thường").
  const hs = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)')
  for (const [s, ten, tl, tt] of [['S1', 'An', LOP, null], ['S2', 'Bảo', LOP, null], ['S3', 'Chi', LOP, null], ['S4', 'Dũng', '12 - Chuyên', null], ['S5', 'Em', LOP, 'khoa']] as const) hs.run(s, ten, '12', tl, tt, 'x')
  const ds = d.sql.prepare('INSERT INTO danh_sach(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,?,?)')
  for (const [s, ten] of [['S1', 'An'], ['S2', 'Bảo'], ['S6', 'Phúc']]) ds.run(s, ten, '12', 'x')
  const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const them = (maDe: string, qid: string, phan: 'I' | 'II' | 'III', o: Tho = {}) => q.run(maDe, qid, 'v1', `g-${qid}`, 'D1', cau(maDe, qid, phan, o))
  // Bài 6: 6 câu Phần I, 2 Phần II, 2 Phần III (1 tự luận) + tờ Dạng toán trọng tâm 2 câu + tờ Ví dụ minh hoạ 2 câu (không giao).
  for (let i = 1; i <= 6; i++) them(B6, `${B6}-I-${i}`, 'I')
  for (let i = 1; i <= 2; i++) them(B6, `${B6}-II-${i}`, 'II')
  them(B6, `${B6}-III-1`, 'III')
  them(B6, `${B6}-III-2`, 'III', { correct: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên' })
  for (let i = 1; i <= 2; i++) them(`${B6}-DT`, `${B6}-DT-I-${i}`, 'I')
  for (let i = 1; i <= 2; i++) them(`${B6}-VD`, `${B6}-VD-I-${i}`, 'I')
  for (let i = 1; i <= 2; i++) them('DH-12-C2-B7', `DH-12-C2-B7-I-${i}`, 'I')
  them('DH-12-C3-B9', 'DH-12-C3-B9-I-1', 'I')
  return { d, env }
}
/** Câu vào chiến dịch: bỏ câu tự luận III-2 và câu tờ "-DT" (luật tự luận chung `laMaDeTuLuan`), không có tờ Ví dụ minh hoạ (thầy không tích). */
const QID_B6 = [...[1, 2, 3, 4, 5, 6].map((i) => `${B6}-I-${i}`), `${B6}-II-1`, `${B6}-II-2`, `${B6}-III-1`]
const tickB6 = (env: Env, them: Tho = {}, nowMs = T0) =>
  gvBaiDaDay(env, { action: 'tick', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6, phamVi: BAI_TRUOC, nguoi: 'thầy Học', ...them }, nowMs)
const chienDich = (d: D1That, id: string) => d.sql.prepare('SELECT * FROM chien_dich WHERE id = ?').get(id) as Record<string, string | number | null>
const suKien = (d: D1That, khoa: string, sbd: string, qid: string, luc: string, purpose: string | null = null) =>
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,purpose) VALUES(?,?,?,?,?,1,1,?,?,?)').run(khoa, sbd, qid, 'game', 'G1', luc, luc.slice(0, 10), purpose)

describe('xem-truoc — dòng xác nhận, không ghi gì', () => {
  it('đủ 6 con số; hạn tự tính D ∈ [7,14] từ lượt cần của em trung vị; không tạo chiến dịch, không ghi bảng', async () => {
    const { d, env } = dung()
    const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6 }, T0)
    // 9 câu dùng được: tờ "-DT" bị bỏ NGAY ở đầu vào (lưới an toàn 05/10 — chỉ Trắc nghiệm / Đúng sai / Trả lời ngắn) ⇒ chỉ còn 1 câu Phần III tự luận
    // bị bỏ ⇒ soTuLuan 1; em mới: 18 lượt; thể lực mặc định 40 ⇒ D nhỏ nhất với 18 ≤ 0,8 × D × 40 là 7.
    expect(r).toEqual({ ok: true, soCau: 9, soTuLuan: 1, hanNop: '2026-10-11', D: 7, luotCan: 18, sucChua: 280, soEmChon: 3, duLuot: 3, tongEm: 3, duDiem8: null, quaTai: [], theLucNgay: 40 })
    expect([d.dem('chien_dich'), d.dem('bai_da_day'), d.dem('pham_vi_lop')]).toEqual([0, 0, 0])
  })
  it('thể lực lớp đọc từ cau_hinh.the_luc_lop; thể lực quá thấp ⇒ D = 14 và danh sách em quá tải có tên', async () => {
    const { d, env } = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('the_luc_lop',?,'x')").run(JSON.stringify({ [LOP]: 3 }))
    const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6 }, T0)
    expect(r).toMatchObject({ ok: true, theLucNgay: 3, D: 8, hanNop: '2026-10-12', luotCan: 18, sucChua: 24, duLuot: 3, quaTai: [] }) // 18 ≤ 0,8 × 8 × 3 (D = 7 ⇒ 16,8 < 18)
    const r1 = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, theLucNgay: 1 }, T0)
    expect(r1).toMatchObject({ ok: true, theLucNgay: 1, D: 14, hanNop: '2026-10-18', sucChua: 14, duLuot: 0, tongEm: 3 })
    expect(r1.quaTai).toEqual([{ sbd: 'S1', ten: 'An' }, { sbd: 'S2', ten: 'Bảo' }, { sbd: 'S3', ten: 'Chi' }])
  })
  it('hạn tự tính luôn trong [7, 14] ngày và = hôm nay + D − 1, với mọi thể lực', async () => {
    const { env } = dung()
    for (const theLucNgay of [1, 2, 3, 5, 40, 500]) {
      const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, theLucNgay }, T0)
      const D = Number(r.D)
      expect(D, `thể lực ${theLucNgay}`).toBeGreaterThanOrEqual(7)
      expect(D, `thể lực ${theLucNgay}`).toBeLessThanOrEqual(14)
      expect(r.hanNop).toBe(new Date(Date.parse('2026-10-05T00:00:00Z') + (D - 1) * NGAY).toISOString().slice(0, 10))
    }
  })
  it('hạn thầy đặt ⇒ dùng đúng hạn ấy (D tính cả hôm nay); hạn đã qua / sai dạng ⇒ từ chối', async () => {
    const { env } = dung()
    expect(await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, hanNop: '2026-10-16' }, T0)).toMatchObject({ ok: true, hanNop: '2026-10-16', D: 12, sucChua: 480 })
    expect((await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, hanNop: '2026-10-01' }, T0)).ok).toBe(false)
    expect((await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, hanNop: '16/10' }, T0)).ok).toBe(false)
  })
  it('duDiem8: null khi OMNI tắt cho cả lớp; bật ⇒ số em đạt hoặc ước ngày ≤ D (chỉ em OMNI bật), nhịp = thể lực ngày', async () => {
    const { env } = dung()
    co.omni = new Set(['S1', 'S2', 'S3'])
    co.uoc = new Map([['S1', { dat: false, uocNgay: 5 }], ['S2', { dat: false, uocNgay: 30 }], ['S3', { dat: true, uocNgay: null }]])
    co.hoSoGoi = []; co.nhip = []
    const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6 }, T0)
    expect(r).toMatchObject({ ok: true, D: 7, duDiem8: 2 })
    expect(co.hoSoGoi).toEqual([['S1', 'S2', 'S3']])
    expect(new Set(co.nhip)).toEqual(new Set([40]))
    co.omni = new Set(['S2'])
    expect((await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6 }, T0)).duDiem8).toBe(0)
    co.omni = new Set()
    expect((await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6 }, T0)).duDiem8).toBeNull()
  })
})

describe('tick — tạo đúng một chiến dịch theo bài', () => {
  it('đúng tờ (bỏ tự luận, không Ví dụ minh hoạ), đúng tên, đúng em của lớp, hạn tự tính, Huyết Chiến + rải đều bật; ghi bai_da_day + pham_vi_lop + learner_scope', async () => {
    const { d, env } = dung()
    const r = await tickB6(env)
    expect(r).toMatchObject({ ok: true, daCo: false, hanNop: '2026-10-11' })
    const id = String(r.chienDichId)
    const cd = chienDich(d, id)
    expect(cd).toMatchObject({ ten: 'Bài 6 · Tinh bột và cellulose', lop: LOP, han_nop: '2026-10-11', the_luc_ngay: 40, huyet_chien: 1, trang_thai: 'dang_chay' })
    expect(JSON.parse(String(cd.sbd_json))).toEqual(['S1', 'S2', 'S3'])
    expect(JSON.parse(String(cd.ma_de_json))).toEqual([B6]) // tờ -DT app gửi kèm đã bị bỏ trước khi tạo chiến dịch
    expect(JSON.parse(String(cd.qid_json))).toEqual(QID_B6)
    expect(d.sql.prepare('SELECT rai_deu FROM chien_dich_tuy_chon WHERE id = ?').get(id)).toEqual({ rai_deu: 1 })
    const coBangBatDau = (d.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'chien_dich_bat_dau'").get() as { n: number }).n
    if (coBangBatDau) expect(d.dem('chien_dich_bat_dau')).toBe(0) // bắt đầu hôm nay ⇒ không cần dòng ngày bắt đầu (bảng phụ tạo lúc chạy có thể chưa có)
    const dong = d.sql.prepare('SELECT lop, khoa_bai, ten_bai, vi_tri, ma_to_json, nguoi, chien_dich_id, bo_tick_luc FROM bai_da_day').all()
    expect(dong).toEqual([{ lop: LOP, khoa_bai: 'B6', ten_bai: TEN_B6, vi_tri: 6, ma_to_json: JSON.stringify(MA_B6_GIAO), nguoi: 'thầy Học', chien_dich_id: id, bo_tick_luc: null }])
    expect(d.sql.prepare('SELECT khoa_bai, nguon, vi_tri FROM pham_vi_lop ORDER BY vi_tri').all()).toEqual([
      { khoa_bai: 'B4', nguon: 'truoc', vi_tri: 4 }, { khoa_bai: 'B5', nguon: 'truoc', vi_tri: 5 }, { khoa_bai: 'B6', nguon: 'tick', vi_tri: 6 },
    ])
    expect(d.sql.prepare("SELECT sbd, skill_id, state, source FROM learner_scope ORDER BY sbd, skill_id").all()).toEqual(
      ['S1', 'S2', 'S3'].flatMap((s) => [{ sbd: s, skill_id: 'cellulose', state: 'taught', source: 'thay' }, { sbd: s, skill_id: 'tinh_bot', state: 'taught', source: 'thay' }]),
    )
  })
  it('tick lần hai cùng lớp cùng bài ⇒ daCo + chiến dịch cũ, không tạo thêm; lớp khác tick cùng bài ⇒ chiến dịch riêng', async () => {
    const { d, env } = dung()
    const r = await tickB6(env)
    const r2 = await tickB6(env, {}, T0 + 3_600_000)
    expect(r2).toEqual({ ok: true, chienDichId: r.chienDichId, hanNop: '2026-10-11', daCo: true })
    expect(d.dem('chien_dich')).toBe(1)
    expect(d.dem('bai_da_day')).toBe(1)
    const khac = await gvBaiDaDay(env, { action: 'tick', lop: '12 - Chuyên', khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6, phamVi: [] }, T0)
    expect(khac).toMatchObject({ ok: true, daCo: false })
    expect(JSON.parse(String(chienDich(d, String(khac.chienDichId)).sbd_json))).toEqual(['S4'])
    expect(d.dem('chien_dich')).toBe(2)
  })
  it('hai lượt tick đồng thời (bấm đúp) ⇒ đúng một chiến dịch', async () => {
    const { d, env } = dung()
    const [a, b] = await Promise.all([tickB6(env), tickB6(env)])
    expect([a.ok, b.ok]).toEqual([true, true])
    expect([a.daCo, b.daCo].filter(Boolean)).toHaveLength(1)
    expect(d.dem('chien_dich')).toBe(1)
    expect(d.dem('bai_da_day')).toBe(1)
    expect(d.dem('bai_da_day', 'chien_dich_id IS NOT NULL')).toBe(1)
  })
  it('dòng giữ chỗ còn mới (lượt khác đang tạo) ⇒ daCo, chưa có chiến dịch; dòng treo quá 2 phút ⇒ lượt sau dùng lại dòng và tạo chiến dịch', async () => {
    const { d, env } = dung()
    const giuCho = d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc,nguoi,chien_dich_id,bo_tick_luc) VALUES('giu',?,'B6',?,6,'[]',?,NULL,NULL,NULL)")
    giuCho.run(LOP, TEN_B6, new Date(T0 - 30_000).toISOString())
    expect(await tickB6(env)).toEqual({ ok: true, chienDichId: null, hanNop: null, daCo: true })
    expect(d.dem('chien_dich')).toBe(0)
    d.sql.prepare("UPDATE bai_da_day SET tick_luc = ? WHERE id = 'giu'").run(new Date(T0 - 5 * 60_000).toISOString())
    const r = await tickB6(env)
    expect(r).toMatchObject({ ok: true, daCo: false, hanNop: '2026-10-11' })
    expect(d.sql.prepare('SELECT id, chien_dich_id, ma_to_json FROM bai_da_day').all()).toEqual([{ id: 'giu', chien_dich_id: r.chienDichId, ma_to_json: JSON.stringify(MA_B6_GIAO) }])
    expect(d.dem('chien_dich')).toBe(1)
  })
  it('hạn và thể lực thầy đặt ⇒ dùng nguyên', async () => {
    const { d, env } = dung()
    const r = await tickB6(env, { hanNop: '2026-10-20', theLucNgay: 25 })
    expect(r).toMatchObject({ ok: true, hanNop: '2026-10-20' })
    expect(chienDich(d, String(r.chienDichId))).toMatchObject({ han_nop: '2026-10-20', the_luc_ngay: 25 })
  })
  it('tạo chiến dịch lỗi (tờ không có câu dùng được) ⇒ báo lỗi, không để lại dòng tick; thiếu lớp/bài/tờ hoặc lớp không có em ⇒ từ chối', async () => {
    const { d, env } = dung()
    const r = await gvBaiDaDay(env, { action: 'tick', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: ['KHONG-CO-TN'] }, T0)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('không có câu dùng được')
    expect(d.dem('bai_da_day')).toBe(0)
    expect((await tickB6(env)).daCo).toBe(false) // tick lại được ngay
    for (const thieu of [{ lop: '' }, { khoaBai: '' }, { tenBai: '' }, { viTri: null }, { maDe: [] }]) expect((await tickB6(env, thieu)).ok, JSON.stringify(thieu)).toBe(false)
    expect((await gvBaiDaDay(env, { action: 'tick', lop: 'Lớp ma', khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6 }, T0)).ok).toBe(false)
    expect((await gvBaiDaDay(env, { action: 'khong-co' }, T0)).ok).toBe(false)
  })
  it('lưới an toàn 05/10: app gửi kèm tờ -VD / -DT / -TL (ở bài tick lẫn phamVi) ⇒ máy chủ bỏ trước khi tính / giao; chỉ còn tờ ấy ⇒ từ chối, không ghi gì', async () => {
    const { d, env } = dung()
    const phamVi = [
      { khoaBai: 'B4', tenBai: 'Bài 4. Glucose và fructose', viTri: 4, maDe: ['DH-12-C2-B4-TN', 'DH-12-C2-B4-VD', 'DH-12-C2-B4-DT'] },
      { khoaBai: 'B5', tenBai: 'Bài 5. Saccharose và maltose', viTri: 5, maDe: ['DH-12-C2-B5-VDMH', 'DH-12-C2-B5-TL', 'DH-12-C2-B5-DS'] },
    ]
    const xem = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: [...MA_B6, `${B6}-VD`] }, T0)
    expect(xem).toMatchObject({ ok: true, soCau: 9, soTuLuan: 1 }) // tờ -VD/-DT không góp câu nào, kể cả vào số câu tự luận đã bỏ
    const r = await tickB6(env, { maDe: [`${B6}-VD`, ...MA_B6, `${B6}-VDMH`], phamVi })
    expect(r).toMatchObject({ ok: true, daCo: false })
    expect(JSON.parse(String(chienDich(d, String(r.chienDichId)).qid_json))).toEqual(QID_B6)
    expect(d.sql.prepare('SELECT ma_to_json FROM bai_da_day').get()).toEqual({ ma_to_json: JSON.stringify(MA_B6_GIAO) })
    expect(d.sql.prepare('SELECT khoa_bai, ma_de_json FROM pham_vi_lop ORDER BY vi_tri').all()).toEqual([
      { khoa_bai: 'B4', ma_de_json: JSON.stringify(['DH-12-C2-B4-TN']) },
      { khoa_bai: 'B5', ma_de_json: JSON.stringify(['DH-12-C2-B5-DS']) },
      { khoa_bai: 'B6', ma_de_json: JSON.stringify(MA_B6_GIAO) },
    ])
    // Bài chỉ có Ví dụ minh hoạ / Các dạng toán trọng tâm ⇒ cùng một lời ở cả xem-truoc lẫn tick; không ghi dòng nào.
    const chiMucDayHoc = { lop: LOP, khoaBai: 'B9', tenBai: 'Bài 9. Thử', viTri: 9, maDe: ['DH-12-C3-B9-VD', 'DH-12-C3-B9-DT', 'DH-12-C3-B9-DTTT'] }
    for (const action of ['xem-truoc', 'tick']) {
      expect(await gvBaiDaDay(env, { action, ...chiMucDayHoc }, T0), action).toEqual({ ok: false, error: 'Bài này chưa có tờ Trắc nghiệm / Đúng sai / Trả lời ngắn.' })
    }
    expect(d.dem('bai_da_day', "khoa_bai = 'B9'")).toBe(0)
    expect(d.dem('chien_dich')).toBe(1)
  })

  it('bảng chưa có (CI không chạy migration) ⇒ tick tự tạo bảng', async () => {
    const { d, env } = dung()
    d.sql.exec('DROP TABLE bai_da_day; DROP TABLE pham_vi_lop')
    expect((await tickB6(env)).ok).toBe(true)
    expect([d.dem('bai_da_day'), d.dem('pham_vi_lop')]).toEqual([1, 3])
  })
})

describe('chọn em được giao (thầy 05/10: app gửi sbd ở xem-truoc và tick)', () => {
  it('lọc sbd: bỏ trùng, bỏ SBD không có trong danh sách học sinh hoặc đã khoá; soEmChon = số em sau lọc, tongEm = số em của lớp; số liệu tính trên em được giao', async () => {
    const { env } = dung()
    const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, sbd: ['S3', 'S1', 'S1', ' S3 ', 'S5', 'KHONG-CO', ''] }, T0)
    expect(r).toMatchObject({ ok: true, soEmChon: 2, tongEm: 3, duLuot: 2, quaTai: [] })
    const r1 = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, sbd: ['S3', 'S1'], theLucNgay: 1 }, T0)
    expect(r1).toMatchObject({ ok: true, soEmChon: 2, tongEm: 3, duLuot: 0 })
    expect(r1.quaTai).toEqual([{ sbd: 'S1', ten: 'An' }, { sbd: 'S3', ten: 'Chi' }])
    // Em lớp khác vẫn có trong danh sách học sinh ⇒ được nhận (thầy chủ động chọn).
    expect(await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, sbd: ['S1', 'S4'] }, T0)).toMatchObject({ ok: true, soEmChon: 2, tongEm: 3 })
    // Không gửi sbd ⇒ cả lớp.
    expect(await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6 }, T0)).toMatchObject({ ok: true, soEmChon: 3, tongEm: 3 })
  })
  it('còn 0 em hợp lệ (chỉ em khoá / SBD lạ / mảng rỗng) ⇒ "Chưa chọn em nào hợp lệ." ở cả xem-truoc lẫn tick, không ghi gì', async () => {
    const { d, env } = dung()
    for (const sbd of [['S5', 'KHONG-CO'], [], ['  ']]) {
      expect(await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, maDe: MA_B6, sbd }, T0), JSON.stringify(sbd)).toEqual({ ok: false, error: 'Chưa chọn em nào hợp lệ.' })
      expect(await tickB6(env, { sbd }), JSON.stringify(sbd)).toEqual({ ok: false, error: 'Chưa chọn em nào hợp lệ.' })
    }
    expect([d.dem('chien_dich'), d.dem('bai_da_day'), d.dem('pham_vi_lop')]).toEqual([0, 0, 0])
  })
  it('tick giao đúng em được chọn; learner_scope chỉ ghi cho em được chọn (em vắng không bị đánh dấu đã dạy)', async () => {
    const { d, env } = dung()
    const r = await tickB6(env, { sbd: ['S2', 'S1', 'S5'] })
    expect(r).toMatchObject({ ok: true, daCo: false })
    expect(JSON.parse(String(chienDich(d, String(r.chienDichId)).sbd_json))).toEqual(['S1', 'S2'])
    expect(d.sql.prepare('SELECT DISTINCT sbd FROM learner_scope ORDER BY sbd').all()).toEqual([{ sbd: 'S1' }, { sbd: 'S2' }])
  })
  it('tick lần hai cùng bài với danh sách em KHÁC ⇒ vẫn daCo, không tạo chiến dịch mới, không đổi em của chiến dịch cũ', async () => {
    const { d, env } = dung()
    const r = await tickB6(env, { sbd: ['S1', 'S2'] })
    const r2 = await tickB6(env, { sbd: ['S3'] }, T0 + 3_600_000)
    expect(r2).toEqual({ ok: true, chienDichId: r.chienDichId, hanNop: '2026-10-11', daCo: true })
    expect(d.dem('chien_dich')).toBe(1)
    expect(JSON.parse(String(chienDich(d, String(r.chienDichId)).sbd_json))).toEqual(['S1', 'S2'])
    expect(d.dem('learner_scope', "sbd = 'S3'")).toBe(0)
  })
})

describe('bo-tick — huỷ hay đóng chiến dịch', () => {
  it('chưa có lượt làm nào KỂ TỪ KHI TẠO ⇒ huỷ (lượt làm trước lúc tạo, dòng xem lời giải không tính)', async () => {
    const { d, env } = dung()
    const r = await tickB6(env)
    suKien(d, 'k-cu', 'S1', `${B6}-I-1`, new Date(T0 - NGAY).toISOString())
    suKien(d, 'k-xem', 'S2', `${B6}-I-2`, new Date(T0 + 60_000).toISOString(), 'xem_loi_giai')
    const b = await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 3_600_000)
    expect(b).toEqual({ ok: true, chienDich: 'da_huy' })
    expect(chienDich(d, String(r.chienDichId)).trang_thai).toBe('da_huy')
    expect(d.dem('bai_da_day', 'bo_tick_luc IS NOT NULL')).toBe(1)
  })
  it('đã có lượt làm (kể cả câu song sinh) ⇒ đóng', async () => {
    const { d, env } = dung()
    const r = await tickB6(env)
    suKien(d, 'k-ss', 'S2', `${B6}-I-3~ss0`, new Date(T0 + 60_000).toISOString())
    expect(await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 3_600_000)).toEqual({ ok: true, chienDich: 'da_dong' })
    expect(chienDich(d, String(r.chienDichId)).trang_thai).toBe('da_dong')
  })
  it('bỏ tick bài chưa tick ⇒ null; bỏ tick rồi tick lại ⇒ chiến dịch mới', async () => {
    const { d, env } = dung()
    expect(await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0)).toEqual({ ok: true, chienDich: null })
    const r1 = await tickB6(env)
    await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 60_000)
    expect(await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 90_000)).toEqual({ ok: true, chienDich: null })
    const r2 = await tickB6(env, {}, T0 + 120_000)
    expect(r2).toMatchObject({ ok: true, daCo: false })
    expect(r2.chienDichId).not.toBe(r1.chienDichId)
    expect([d.dem('bai_da_day'), d.dem('bai_da_day', 'bo_tick_luc IS NULL')]).toEqual([2, 1])
  })
})

describe('phạm vi đã dạy + lớp của em', () => {
  it('phạm vi = bài tick ∪ bài trước; tick bài sau không đè dòng tick; bỏ tick bài xa nhất ⇒ phạm vi lùi; bỏ hết ⇒ null', async () => {
    const { d, env } = dung()
    expect(await phamViLop(env, LOP)).toBeNull()
    const r = await tickB6(env)
    const pv = await phamViLop(env, LOP)
    expect([...pv!.maDe].sort()).toEqual(['DH-12-C2-B4', 'DH-12-C2-B5', B6]) // tờ -DT app gửi kèm không vào phạm vi (lưới an toàn 05/10)
    expect(pv!.baiDaTick).toEqual([{ khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, chienDichId: r.chienDichId, tickLuc: new Date(T0).toISOString() }])
    expect(pv!.baiTheoMaDe.get('DH-12-C2-B5')).toEqual({ khoaBai: 'B5', tenBai: 'Bài 5. Saccharose và maltose', viTri: 5 })
    const r7 = await gvBaiDaDay(env, {
      action: 'tick', lop: LOP, khoaBai: 'B7', tenBai: 'Bài 7. Amine', viTri: 7, maDe: ['DH-12-C2-B7-TN'],
      phamVi: [...BAI_TRUOC, { khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: [`${B6}-TN`] }],
    }, T0 + 3 * NGAY)
    expect(r7).toMatchObject({ ok: true, daCo: false })
    expect(d.sql.prepare("SELECT nguon, ma_de_json FROM pham_vi_lop WHERE khoa_bai = 'B6'").get()).toEqual({ nguon: 'tick', ma_de_json: JSON.stringify(MA_B6_GIAO) })
    const pv7 = await phamViLop(env, LOP)
    expect(pv7!.maDe.has('DH-12-C2-B7')).toBe(true)
    expect(pv7!.baiDaTick.map((b) => b.khoaBai)).toEqual(['B6', 'B7'])
    await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B7' }, T0 + 4 * NGAY)
    expect([...(await phamViLop(env, LOP))!.maDe].sort()).toEqual(['DH-12-C2-B4', 'DH-12-C2-B5', B6])
    await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 4 * NGAY)
    expect(await phamViLop(env, LOP)).toBeNull()
  })
  it('dựng phạm vi (thuần): bài đã bỏ tick đứng trước bài tick xa nhất vẫn là bài trước; đứng sau thì rời phạm vi', () => {
    const pv = dungPhamVi('L', [{ khoa_bai: 'B6', ten_bai: 'Bài 6', vi_tri: 6, ma_to_json: '["DH-6-TN","DH-6-DS"]', tick_luc: 't', chien_dich_id: 'cd6' }], [
      { khoa_bai: 'B4', ten_bai: 'Bài 4', vi_tri: 4, ma_de_json: '["DH-4"]' },
      { khoa_bai: 'B5', ten_bai: 'Bài 5', vi_tri: 5, ma_de_json: '["DH-5-TN"]' },
      { khoa_bai: 'B6', ten_bai: 'Bài 6 cũ', vi_tri: 6, ma_de_json: '["CU"]' },
      { khoa_bai: 'B8', ten_bai: 'Bài 8', vi_tri: 8, ma_de_json: '["DH-8"]' },
    ])
    expect([...pv!.maDe]).toEqual(['DH-4', 'DH-5', 'DH-6'])
    expect(pv!.baiDaTick).toEqual([{ khoaBai: 'B6', tenBai: 'Bài 6', viTri: 6, chienDichId: 'cd6', tickLuc: 't' }])
    expect(dungPhamVi('L', [], [{ khoa_bai: 'B4', ten_bai: 'Bài 4', vi_tri: 4, ma_de_json: '["DH-4"]' }])).toBeNull()
  })
  it('lớp của em theo nguồn màn Học sinh: tên lớp đã gán; chỉ có danh sách ⇒ lớp mặc định theo khối; em đã khoá / không có ⇒ null', async () => {
    const { env } = dung()
    expect(await lopCuaEm(env, 'S1')).toBe(LOP)
    expect(await lopCuaEm(env, 'S3')).toBe(LOP)
    expect(await lopCuaEm(env, 'S4')).toBe('12 - Chuyên')
    expect(await lopCuaEm(env, 'S6')).toBe('12 - Lớp Thường')
    expect(await lopCuaEm(env, 'S5')).toBeNull()
    expect(await lopCuaEm(env, 'KHONG')).toBeNull()
  })
  it('phạm vi của em: em của lớp ⇒ phạm vi lớp; em lớp chưa tick ⇒ null; em đổi lớp sau khi tick ⇒ lùi về lớp của chiến dịch gần nhất có em', async () => {
    const { d, env } = dung()
    await tickB6(env)
    expect((await phamViCuaEm(env, 'S1'))?.lop).toBe(LOP)
    expect(await phamViCuaEm(env, 'S4')).toBeNull()
    expect(await phamViCuaEm(env, 'S6')).toBeNull()
    d.sql.prepare("UPDATE hoc_sinh SET ten_lop = '12 - Chuyên' WHERE sbd = 'S1'").run()
    xoaMoiDem()
    expect(await lopCuaEm(env, 'S1')).toBe('12 - Chuyên')
    expect((await phamViCuaEm(env, 'S1'))?.lop).toBe(LOP)
  })
})

describe('danh-sach — bài đã tick của lớp', () => {
  it('đang luyện: hạn + còn ngày + chứng chỉ; quá hạn ⇒ đã dạy + chờ bài mới; bài đã bỏ tick không hiện', async () => {
    const { d, env } = dung()
    const r = await tickB6(env)
    const id = String(r.chienDichId)
    const ds = await gvBaiDaDay(env, { action: 'danh-sach', lop: LOP }, T0)
    expect(ds).toEqual({ ok: true, choBaiMoi: null, bai: [{ khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, tickLuc: new Date(T0).toISOString(), chienDichId: id, trangThai: 'dang_luyen', hanNop: '2026-10-11', conNgay: 7, chungChi: { dat: 0, tong: 3 } }] })
    d.sql.prepare("INSERT INTO omni_chung_chi(sbd,chien_dich_id,cap_luc,do_tin) VALUES('S1',?,'x',0.92),('S2',?,'x',0.9)").run(id, id)
    const sau = await gvBaiDaDay(env, { action: 'danh-sach', lop: LOP }, T0 + 9 * NGAY) // 2026-10-14: quá hạn 3 ngày
    expect(sau).toMatchObject({ ok: true, choBaiMoi: { soNgay: 3 }, bai: [{ khoaBai: 'B6', trangThai: 'da_day', hanNop: '2026-10-11', conNgay: null, chungChi: { dat: 2, tong: 3 } }] })
    await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, T0 + 9 * NGAY)
    expect(await gvBaiDaDay(env, { action: 'danh-sach', lop: LOP }, T0 + 9 * NGAY)).toEqual({ ok: true, bai: [], choBaiMoi: null })
  })
  it('bảng omni_chung_chi chưa có ⇒ dat 0; thiếu lớp ⇒ từ chối', async () => {
    const { d, env } = dung()
    await tickB6(env)
    d.sql.exec('DROP TABLE omni_chung_chi')
    const ds = await gvBaiDaDay(env, { action: 'danh-sach', lop: LOP }, T0)
    expect((ds.bai as { chungChi: unknown }[])[0]!.chungChi).toEqual({ dat: 0, tong: 3 })
    expect((await gvBaiDaDay(env, { action: 'danh-sach' }, T0)).ok).toBe(false)
  })
})

describe('tên chiến dịch + bảng tạo lúc chạy', () => {
  it('"Bài N. Tên" ⇒ "Bài N · Tên"; tên khác dáng giữ nguyên', () => {
    expect(tenChienDichBai('Bài 6. Tinh bột và cellulose')).toBe('Bài 6 · Tinh bột và cellulose')
    expect(tenChienDichBai('  Bài 12:   Điện phân ')).toBe('Bài 12 · Điện phân')
    expect(tenChienDichBai('Bài 6 · Ester')).toBe('Bài 6 · Ester')
    expect(tenChienDichBai('Ôn tập chương 2')).toBe('Ôn tập chương 2')
  })
  it('câu tạo bai_da_day, chỉ mục, pham_vi_lop có đúng trong migration-0510-omni-3.sql', () => {
    const sql = readFileSync('server/migration-0510-omni-3.sql', 'utf8').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    const cau = sql.split(';').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean)
    for (const s of SQL_BANG_BAI_DA_DAY) expect(cau).toContain(s.replace(/\s+/g, ' ').trim())
  })
})
