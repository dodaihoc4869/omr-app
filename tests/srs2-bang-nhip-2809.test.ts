// @vitest-environment node
// Bản vẽ app thầy 28/09 (GV-BangChienDich · GV-ChienDichDaGiao): trường CHỈ-THÊM của `bang` và `danh-sach` —
// nhịp của em (vượt / đúng / trễ 1–2 / trễ ≥ 3 ngày), % đã làm qua theo dạng (ô "Chưa làm"), trung bình + hạng lớp theo dạng
// (ngưỡng thuật toán Yếu < 40 · TB 40–65 · Khá 65–85 · Giỏi > 85), so với hôm qua, mức độ câu cần dạy lại, số câu theo mức độ,
// và số liệu lớp của từng chiến dịch trong `danh-sach` khi xin `thongKe`.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich, mocNhip, nhipEm } from '../server/src/srs2-gv'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const GIAO = Date.parse('2026-09-28T02:00:00Z') // 09:00 VN Thứ Hai 28/09
const NGAY = 86_400_000
const cau = (qid: string, dang: string, mucDo: string) => JSON.stringify({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'c' },
})
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x'),('S2','Bảo','12','x'),('S3','Chi','12','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  // Dạng A: Q1, Q2 (Nhận biết) · Dạng B: Q3, Q4 (Vận dụng)
  for (const [q, dg, md] of [['Q1', 'A', 'Nhận biết'], ['Q2', 'A', 'Nhận biết'], ['Q3', 'B', 'Vận dụng'], ['Q4', 'B', 'Vận dụng']] as const) st.run('DE1', q, 'v1', `g-${q}`, dg, cau(q, dg, md))
  const t = await gvChienDich(env, { action: 'tao', ten: 'T', sbd: ['S1', 'S2', 'S3'], maDe: ['DE1'], hanNop: '2026-10-07' }, GIAO) as { id: string }
  return { d, env, id: t.id }
}
const lam = (env: Env, sbd: string, qid: string, ketQua: 0 | 1, luc: string, ma: string) =>
  ghiSuKien(env, [{ nguon: 'game', maNguon: ma, sbd, qid, lan: 1, ketQua, luc }] as never)

describe('nhịp của em (thuần)', () => {
  it('trễ ≥ 3 ⇒ tre3 · 1–2 ⇒ tre12 · không trễ: vượt khi đã làm qua ≥ mức cần + 10 điểm, còn lại đúng nhịp', () => {
    expect(nhipEm(3, 1, 0.5)).toBe('tre3')
    expect(nhipEm(2, 1, 0.5)).toBe('tre12')
    expect(nhipEm(1, 0, 0.5)).toBe('tre12')
    expect(nhipEm(0, 0.6, 0.5)).toBe('vuot')
    expect(nhipEm(0, 0.59, 0.5)).toBe('dung')
    expect(nhipEm(0, 0, 0.1)).toBe('dung')
    expect(nhipEm(0, 1, 0.95)).toBe('vuot') // mức cần cộng 10 điểm không vượt 100%
  })
  it('mốc nhịp: ngày thứ mấy / tổng ngày tới hạn, tính cả ngày giao', () => {
    expect(mocNhip('2026-09-28T02:00:00Z', '2026-10-07', '2026-09-28')).toEqual({ ngayGiao: '2026-09-28', ngayThu: 1, tongNgay: 10, mucCanHomNay: 0.1 })
    expect(mocNhip('2026-09-28T02:00:00Z', '2026-10-07', '2026-10-02').mucCanHomNay).toBe(0.5)
    expect(mocNhip('2026-09-28T02:00:00Z', '2026-10-07', '2026-10-20').ngayThu).toBe(10)
  })
})

describe('bang: trường chỉ-thêm', () => {
  it('nhịp, % đã làm qua theo dạng, trung bình + hạng lớp theo dạng, so với hôm qua, mức độ câu cần dạy lại', async () => {
    const { env, id } = await dung()
    // S1: 28/09 đúng Q1, Q2; 29/09 đúng Q1, Q2 (thành thạo dạng A); hôm nay 02/10 làm Q3 đúng.
    await lam(env, 'S1', 'Q1', 1, '2026-09-28T03:00:00Z', 'a1')
    await lam(env, 'S1', 'Q2', 1, '2026-09-28T03:01:00Z', 'a2')
    await lam(env, 'S1', 'Q1', 1, '2026-09-29T03:00:00Z', 'a3')
    await lam(env, 'S1', 'Q2', 1, '2026-09-29T03:01:00Z', 'a4')
    await lam(env, 'S1', 'Q3', 1, '2026-10-02T03:00:00Z', 'a5')
    // S2: chỉ làm 29/09 (Q1 sai) ⇒ tới 02/10 trễ 2 ngày.
    await lam(env, 'S2', 'Q1', 0, '2026-09-29T03:00:00Z', 'b1')
    // S3: sai Q4 bốn lần ⇒ cần dạy lại; lần cuối 02/10.
    for (let i = 0; i < 4; i++) await lam(env, 'S3', 'Q4', 0, `2026-09-${28 + i}T03:00:00Z`.replace('2026-09-31', '2026-10-01'), `c${i}`)
    await lam(env, 'S3', 'Q4', 0, '2026-10-02T03:00:00Z', 'c9')

    const b = await gvChienDich(env, { action: 'bang', id }, Date.parse('2026-10-02T10:00:00Z')) as {
      em: { sbd: string; nhip: string; soNgayTre: number; daLamTheoDang: Record<string, number | null>; theoDang: Record<string, number | null> }[]
      lop: { nhip: Record<string, number>; dungNhip: number; mucCanHomNay: number; ngayThu: number; tongNgay: number; theoDang: Record<string, number | null>; hangTheoDang: Record<string, string>; homQua: { coXat: number; thanhThao: number }; coXat: number }
      canDayLai: { qid: string; mucDo: string | null }[]
    }
    const e = Object.fromEntries(b.em.map((x) => [x.sbd, x]))
    expect(b.lop).toMatchObject({ ngayThu: 5, tongNgay: 10, mucCanHomNay: 0.5 })
    expect(e.S1).toMatchObject({ nhip: 'vuot', soNgayTre: 0, daLamTheoDang: { 'Dạng A': 1, 'Dạng B': 0.5 }, theoDang: { 'Dạng A': 1, 'Dạng B': 0 } })
    expect(e.S2).toMatchObject({ nhip: 'tre12', soNgayTre: 2, daLamTheoDang: { 'Dạng A': 0.5, 'Dạng B': 0 } })
    expect(e.S3).toMatchObject({ nhip: 'dung', soNgayTre: 0 })
    expect(b.lop.nhip).toEqual({ vuot: 1, dung: 1, tre12: 1, tre3: 0 })
    expect(b.lop.dungNhip).toBe(2)
    // Dạng A: 2 / (2 câu × 3 em) = 33% ⇒ Yếu; dạng B: 0 ⇒ Yếu
    expect(b.lop.theoDang['Dạng A']).toBeCloseTo(1 / 3)
    expect(b.lop.hangTheoDang).toEqual({ 'Dạng A': 'L1', 'Dạng B': 'L1' })
    // Hôm qua (trước 02/10) chưa có Q3 của S1 và lần 02/10 của S3 không đổi số câu đã làm qua của S3 ⇒ hôm qua ít hơn đúng 1 câu.
    expect(b.lop.coXat - b.lop.homQua.coXat).toBeCloseTo(1 / 12)
    expect(b.canDayLai).toEqual([expect.objectContaining({ qid: 'Q4', mucDo: 'Vận dụng' })])
  })
  it('em chưa làm câu nào: trễ tính từ ngày giao', async () => {
    const { env, id } = await dung()
    const b = await gvChienDich(env, { action: 'bang', id }, GIAO + 5 * NGAY) as { em: { nhip: string; soNgayTre: number; treNhip: number | null }[] }
    expect(b.em[0]).toMatchObject({ treNhip: null, soNgayTre: 4, nhip: 'tre3' })
  })
})

describe('danh-sach có thongKe + suc-chua có số câu theo mức độ', () => {
  it('thongKe chỉ khi xin; có đủ đã làm qua, thành thạo, đúng nhịp, quá tải, cần dạy lại', async () => {
    const { env } = await dung()
    await lam(env, 'S1', 'Q1', 1, '2026-09-28T03:00:00Z', 'a1')
    const tron = await gvChienDich(env, { action: 'danh-sach' }, GIAO + 60_000) as { chienDich: Record<string, unknown>[] }
    expect('thongKe' in tron.chienDich[0]!).toBe(false)
    const co = await gvChienDich(env, { action: 'danh-sach', thongKe: true }, GIAO + 60_000) as { chienDich: { thongKe: Record<string, number> }[] }
    expect(co.chienDich[0]!.thongKe).toMatchObject({ coXat: 1 / 12, thanhThao: 0, dungNhip: 3, quaTai: 0, canDayLaiCau: 0, canDayLaiLuot: 0, emLamQuaDu: 0 })
  })
  it('suc-chua trả số câu theo mức độ (cộng = tổng)', async () => {
    const { env } = await dung()
    const r = await gvChienDich(env, { action: 'suc-chua', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-07' }, GIAO) as { soCau: number; soCauTheoMucDo: Record<string, number> }
    expect(r.soCauTheoMucDo).toEqual({ 'Nhận biết': 2, 'Vận dụng': 2 })
  })
})
