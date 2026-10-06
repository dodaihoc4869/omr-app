// @vitest-environment node
// HUỶ CHIẾN DỊCH ⇒ NHẢ DẤU TICK CỦA BÀI GẮN CHIẾN DỊCH (thầy 06/10: "hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết").
// Chiến dịch tạo bằng "tick bài đã dạy" gắn vào dòng `bai_da_day`. Trước: huỷ ở danh sách chiến dịch chỉ đổi `trang_thai`, bài VẪN "đã dạy" ⇒ câu bài ấy
// quay lại làm "Ôn bài cũ" cho chính các em được giao, và tick lại bài chỉ trả chiến dịch đã huỷ (`daCo`). Nay huỷ nhả dấu tick đúng như `bo-tick` (chỉ ghi `bo_tick_luc`);
// KẾT THÚC (`dong`) giữ bài "đã dạy". Cùng nền D1 thật với tests/omni-3-tick-bai-0510.test.ts.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { gvBaiDaDay, phamViCuaEm, phamViLop } from '../server/src/bai-da-day'
import { gvChienDich } from '../server/src/srs2-gv'

const T0 = Date.parse('2026-10-05T09:00:00+07:00')
const LOP = '12 - Tinh Hoa'
const B6 = 'DH-12-C2-B6'
const B7 = 'DH-12-C2-B7'
const MA_B6 = [`${B6}-TN`, `${B6}-DS`, `${B6}-TLN`]
const MA_B7 = [`${B7}-TN`]
const TEN_B6 = 'Bài 6. Tinh bột và cellulose'
const TEN_B7 = 'Bài 7. Polime'
type Tho = Record<string, unknown>
const cau = (maDe: string, qid: string, phan: 'I' | 'II' | 'III') => JSON.stringify({
  qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'c' },
} as Tho)
function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const hs = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)')
  for (const [s, ten] of [['S1', 'An'], ['S2', 'Bảo'], ['S3', 'Chi']]) hs.run(s, ten, '12', LOP, null, 'x')
  const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 6; i++) q.run(B6, `${B6}-I-${i}`, 'v1', `g-${B6}-I-${i}`, 'D1', cau(B6, `${B6}-I-${i}`, 'I'))
  for (let i = 1; i <= 2; i++) q.run(B6, `${B6}-II-${i}`, 'v1', `g-${B6}-II-${i}`, 'D1', cau(B6, `${B6}-II-${i}`, 'II'))
  q.run(B6, `${B6}-III-1`, 'v1', `g-${B6}-III-1`, 'D1', cau(B6, `${B6}-III-1`, 'III'))
  for (let i = 1; i <= 4; i++) q.run(B7, `${B7}-I-${i}`, 'v1', `g-${B7}-I-${i}`, 'D1', cau(B7, `${B7}-I-${i}`, 'I'))
  return { d, env }
}
const tick = (env: Env, khoaBai: string, tenBai: string, viTri: number, maDe: string[], nowMs = T0) =>
  gvBaiDaDay(env, { action: 'tick', lop: LOP, khoaBai, tenBai, viTri, maDe, phamVi: [], nguoi: 'thầy Học' }, nowMs)
const dongTick = (d: D1That, khoaBai: string) => d.sql.prepare('SELECT chien_dich_id, bo_tick_luc FROM bai_da_day WHERE khoa_bai = ? ORDER BY tick_luc').all(khoaBai) as { chien_dich_id: string | null; bo_tick_luc: string | null }[]
const huy = (env: Env, id: string, ms: number) => gvChienDich(env, { action: 'huy', id }, ms) as Promise<{ ok: boolean; thuHoi?: { soEm: number; soLuotDangMo: number; nhaTick: boolean } }>

describe('huỷ chiến dịch của bài đã tick ⇒ nhả dấu tick', () => {
  it('huỷ ở danh sách chiến dịch: bài trở về "chưa dạy" (không còn trong phạm vi ôn bài cũ) và tick lại được thành chiến dịch MỚI', async () => {
    const { d, env } = dung()
    const t = await tick(env, 'B6', TEN_B6, 6, MA_B6)
    expect(t).toMatchObject({ ok: true, daCo: false })
    const id = String(t.chienDichId)
    expect((await phamViLop(env, LOP))?.baiDaTick.map((b) => b.khoaBai)).toEqual(['B6'])
    const luc = T0 + 3_600_000
    const r = await huy(env, id, luc)
    expect(r.ok).toBe(true)
    expect(r.thuHoi).toEqual({ soEm: 3, soLuotDangMo: 0, nhaTick: true })
    expect(dongTick(d, 'B6')).toEqual([{ chien_dich_id: id, bo_tick_luc: new Date(luc).toISOString() }])
    expect(await phamViLop(env, LOP)).toBeNull()      // lớp không còn bài tick nào ⇒ không lọc / không ôn bài ấy
    expect(await phamViCuaEm(env, 'S1')).toBeNull()
    const lai = await tick(env, 'B6', TEN_B6, 6, MA_B6, luc + 60_000)
    expect(lai).toMatchObject({ ok: true, daCo: false })
    expect(String(lai.chienDichId)).not.toBe(id)
  })

  it('đường `bo-tick` có sẵn không đổi: dấu tick ghi MỘT lần lúc bỏ tick (huỷ bên trong không ghi đè)', async () => {
    const { d, env } = dung()
    const t = await tick(env, 'B6', TEN_B6, 6, MA_B6)
    const luc = T0 + 7_200_000
    expect(await gvBaiDaDay(env, { action: 'bo-tick', lop: LOP, khoaBai: 'B6' }, luc)).toEqual({ ok: true, chienDich: 'da_huy' })
    expect(dongTick(d, 'B6')).toEqual([{ chien_dich_id: String(t.chienDichId), bo_tick_luc: new Date(luc).toISOString() }])
  })

  it('huỷ chiến dịch của bài này KHÔNG đụng dấu tick của bài khác', async () => {
    const { d, env } = dung()
    const t6 = await tick(env, 'B6', TEN_B6, 6, MA_B6)
    const t7 = await tick(env, 'B7', TEN_B7, 7, MA_B7)
    await huy(env, String(t6.chienDichId), T0 + 60_000)
    expect(dongTick(d, 'B6')[0]!.bo_tick_luc).not.toBeNull()
    expect(dongTick(d, 'B7')).toEqual([{ chien_dich_id: String(t7.chienDichId), bo_tick_luc: null }])
    expect((await phamViLop(env, LOP))?.baiDaTick.map((b) => b.khoaBai)).toEqual(['B7'])
  })

  it('chiến dịch KHÔNG gắn bài tick (giao tay): huỷ không nhả tick nào; kết thúc (dong) giữ bài "đã dạy"', async () => {
    const { d, env } = dung()
    const t = await tick(env, 'B6', TEN_B6, 6, MA_B6)
    const tay = await gvChienDich(env, { action: 'tao', ten: 'Giao tay', lop: LOP, sbd: ['S1'], maDe: [B7], hanNop: '2026-10-12', theLucNgay: 30 }, T0) as { ok: boolean; id: string }
    expect(tay.ok).toBe(true)
    const r = await huy(env, tay.id, T0 + 60_000)
    expect(r.thuHoi).toEqual({ soEm: 1, soLuotDangMo: 0, nhaTick: false })
    expect(dongTick(d, 'B6')).toEqual([{ chien_dich_id: String(t.chienDichId), bo_tick_luc: null }])
    // đóng (kết thúc) chiến dịch của bài tick: bài vẫn đã dạy
    expect((await gvChienDich(env, { action: 'dong', id: String(t.chienDichId) }, T0 + 120_000)).ok).toBe(true)
    expect(dongTick(d, 'B6')[0]!.bo_tick_luc).toBeNull()
  })

  it('huỷ hai lần cùng chiến dịch: lần hai không ghi đè dấu tick, không lỗi', async () => {
    const { d, env } = dung()
    const t = await tick(env, 'B6', TEN_B6, 6, MA_B6)
    const luc = T0 + 60_000
    await huy(env, String(t.chienDichId), luc)
    const r2 = await huy(env, String(t.chienDichId), luc + 60_000)
    expect(r2.ok).toBe(true)
    expect(r2.thuHoi?.nhaTick).toBe(false)
    expect(dongTick(d, 'B6')[0]!.bo_tick_luc).toBe(new Date(luc).toISOString())
  })

  it('bảng bai_da_day chưa có (chưa ai tick bài nào) ⇒ huỷ vẫn thành công', async () => {
    const { d, env } = dung()
    const tay = await gvChienDich(env, { action: 'tao', ten: 'Giao tay', lop: LOP, sbd: ['S1'], maDe: [B7], hanNop: '2026-10-12', theLucNgay: 30 }, T0) as { id: string }
    d.sql.exec('DROP TABLE IF EXISTS bai_da_day')
    const r = await huy(env, tay.id, T0 + 60_000)
    expect(r.ok).toBe(true)
    expect(r.thuHoi?.nhaTick).toBe(false)
  })
})
