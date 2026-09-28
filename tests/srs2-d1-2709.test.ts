// @vitest-environment node
// Game Hóa 2.0 — tích hợp trên D1 thật (node:sqlite, lược đồ đủ migration): giao chiến dịch → Sảnh → khoá Đảo →
// Đoàn có gợi ý M3 → cắt tỉa → Chữa xong → Rương Bát Linh; kế hoạch ngày chốt, dựng lại từ sổ khớp 100% (N3).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { cheDo2, layKeHoachHomNay, sanh2, docHoSo2, LOI_KHOA_DAO } from '../server/src/srs2-d1'
import { startDao2, startDoan2, hoa2Action, docCotLoi, VANG_RUONG } from '../server/src/srs2-game'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T07:59:00Z') // 14:59 Thứ Tư 30/09 giờ VN
const NGAY = 86_400_000

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true,
    solution: { chot: `Cốt lõi của ${qid}`, tungPa: {} },
  })
}

function fixture(soCau = 12) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','x'),('S2','Trần Bảo','12A1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4'))
  }
  // một câu tự luận: phải bị loại khỏi chiến dịch
  st.run('DE1', 'QTL', 'v1', 'g-QTL', 'D0', JSON.stringify({ ...JSON.parse(cauJson('QTL', 'III', 'TH', 'D0', '')), text: 'Trình bày cách điều chế ester (tự luận)', tuLuan: true }))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}

const suKien = (sbd: string, qid: string, msLuc: number, dung: boolean, extra: Partial<SuKien> = {}): SuKien => ({
  nguon: 'game', maNguon: `phien-${msLuc}`, sbd, qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString(), ...extra,
})

async function giao(env: Env, hanNop = '2026-10-04', nowMs = T0 - NGAY) {
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop }, nowMs)
  expect(r.ok).toBe(true)
  return String(r.id)
}

describe('Game Hóa 2.0 trên D1 thật', () => {
  it('công tắc theo lớp; giao chiến dịch bỏ câu tự luận', async () => {
    const { d, env } = fixture()
    expect(await cheDo2(env, 'S1')).toBe(true)
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('X9','Khác lớp','11B2','x')")
    expect(await cheDo2(env, 'X9')).toBe(false)
    const id = await giao(env)
    const ds = await gvChienDich(env, { action: 'danh-sach' }, T0)
    expect((ds.chienDich as { id: string; soCau: number; soEm: number }[])[0]).toMatchObject({ id, soCau: 12, soEm: 2 })
  })

  it('Sảnh: thể lực = kế hoạch chốt; câu mới vào Đảo; chưa có câu ôn thì Đảo mở', async () => {
    const { env } = fixture()
    await giao(env)
    const s = await sanh2(env, 'S1', T0)
    expect(s.cheDo2).toBe(true)
    expect(s.khoaDao).toBe(false)
    expect((s.theLuc as { tong: number }).tong).toBe(12) // D = 5 > 3 ⇒ ceil(12 / 2) = 6 câu mới giữ chỗ, chỗ thừa trả câu mới ⇒ đủ 12
    expect((s.chienDich as { coXat: number; tong: number })).toMatchObject({ coXat: 0, tong: 12 })
    const dao = await startDao2(env, 'S1', T0)
    expect((dao.questions as unknown[]).length).toBe(6)
    expect(JSON.stringify(dao)).not.toContain('"correct"')
    expect(JSON.stringify(dao)).not.toContain('Cốt lõi của') // chưa đủ điều kiện gợi ý ⇒ không lộ lời giải
  })

  it('còn câu ôn hôm nay ⇒ Đảo khoá đúng lời thầy; Đoàn phát câu ôn; sai 2 lần ⇒ gạch 2 phương án, không lộ đáp án', async () => {
    const { env } = fixture()
    await giao(env, '2026-10-04', T0 - 3 * NGAY)
    await ghiSuKien(env, [suKien('S1', 'Q1', T0 - 2 * NGAY, false), suKien('S1', 'Q1', T0 - NGAY, false), suKien('S1', 'Q2', T0 - NGAY, false)])
    const dao = await startDao2(env, 'S1', T0)
    expect(dao).toMatchObject({ lyDo: 'khoa_cho_doan', message: LOI_KHOA_DAO })
    const doan = await startDoan2(env, 'S1', T0)
    const qs = doan.questions as { qid: string; goiY?: { gach?: string[] } }[]
    expect(qs.map((q) => q.qid).sort()).toEqual(['Q1', 'Q2'])
    const q1 = qs.find((q) => q.qid === 'Q1')!
    expect(q1.goiY?.gach).toHaveLength(2)
    expect(q1.goiY?.gach).not.toContain('B')
    expect(qs.find((q) => q.qid === 'Q2')!.goiY).toBeUndefined()
    expect(JSON.stringify(doan)).not.toContain('"correct"')
  })

  it('kế hoạch CHỐT trong ngày; xoá bảng đệm dựng lại từ sổ khớp 100% (N3)', async () => {
    const { d, env } = fixture()
    await giao(env, '2026-10-04', T0 - 3 * NGAY)
    await ghiSuKien(env, [suKien('S1', 'Q3', T0 - 2 * NGAY, true), suKien('S1', 'Q4', T0 - NGAY, false)])
    const a = (await layKeHoachHomNay(env, 'S1', T0)).kh
    const lai = (await layKeHoachHomNay(env, 'S1', T0 + 3_600_000)).kh
    expect([lai.dao, lai.doan]).toEqual([a.dao, a.doan])
    d.sql.exec('DELETE FROM srs2_ke_hoach')
    const dungLai = (await layKeHoachHomNay(env, 'S1', T0)).kh
    expect([dungLai.dao, dungLai.doan]).toEqual([a.dao, a.doan])
    const hs1 = await docHoSo2(env, 'S1', '2026-09-30'), hs2 = await docHoSo2(env, 'S1', '2026-09-30')
    expect([...hs1.tt.entries()]).toEqual([...hs2.tt.entries()])
  })

  it('câu Đúng–sai đến lịch ôn vào Đảo (Đoàn không chơi Đúng–sai); gợi ý Kiến thức cốt lõi', async () => {
    const { env } = fixture()
    await giao(env, '2026-10-04', T0 - 3 * NGAY)
    await ghiSuKien(env, [suKien('S1', 'Q4', T0 - 2 * NGAY, false), suKien('S1', 'Q4', T0 - NGAY, false)])
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    expect(kh.dao).toContain('Q4')
    expect(kh.doan).not.toContain('Q4')
    const dao = await startDao2(env, 'S1', T0)
    const q4 = (dao.questions as { qid: string; goiY?: { cotLoi?: string } }[]).find((q) => q.qid === 'Q4')
    expect(q4?.goiY?.cotLoi).toBe('Cốt lõi của Q4')
  })

  it('cắt tỉa sai ≥ 4 ⇒ Cần thầy dạy lại trên Bảng chiến dịch; "Chữa xong" ⇒ quay lại Đoàn hôm sau', async () => {
    const { env } = fixture()
    const id = await giao(env, '2026-10-04', T0 - 5 * NGAY)
    await ghiSuKien(env, [1, 2, 3, 4].map((k) => suKien('S1', 'Q1', T0 - (5 - k) * NGAY, false)))
    const b = await gvChienDich(env, { action: 'bang', id }, T0)
    expect((b.canDayLai as { qid: string; soEm: number }[])[0]).toMatchObject({ qid: 'Q1', soEm: 1 })
    expect((await layKeHoachHomNay(env, 'S1', T0)).kh.doan).not.toContain('Q1')
    const x = await gvChienDich(env, { action: 'chua-xong', id, qids: ['Q1'] }, T0)
    expect(x.soLuot).toBe(1)
    const mai = (await layKeHoachHomNay(env, 'S1', T0 + NGAY)).kh
    expect(mai.doan).toContain('Q1')
  })

  it('buổi chữa: điểm chữa = chưa thành thạo + 2 × cần dạy lại, mỗi dạng một câu, xếp giảm dần', async () => {
    const { env } = fixture()
    const id = await giao(env, '2026-10-04', T0 - 6 * NGAY)
    await ghiSuKien(env, [1, 2, 3, 4].map((k) => suKien('S1', 'Q1', T0 - (6 - k) * NGAY, false)))
    const r = await gvChienDich(env, { action: 'buoi-chua', id }, Date.parse('2026-10-05T02:00:00Z'))
    const cau = r.cau as { qid: string; dang: string; diemChua: number; soCanDayLai: number }[]
    expect(r.hetHan).toBe(true)
    expect(new Set(cau.map((c) => c.dang)).size).toBe(cau.length)
    expect(cau[0]).toMatchObject({ qid: 'Q1', soCanDayLai: 1, diemChua: 2 + 2 })
    for (let i = 1; i < cau.length; i++) expect(cau[i - 1]!.diemChua).toBeGreaterThanOrEqual(cau[i]!.diemChua)
  })

  it('đồng hồ sức chứa: tỉ lệ = khối lượng em giữa lớp / (D × thể lực)', async () => {
    const { env } = fixture()
    const r = await gvChienDich(env, { action: 'suc-chua', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04' }, T0)
    expect(r).toMatchObject({ soCau: 12, D: 5, sucChua: 200, khoiLuongTrungVi: 24, muc: 'xanh' })
  })

  it('Rương Bát Linh: chưa xong kế hoạch thì chưa mở; xong trọn ⇒ +20 vàng, mỗi ngày một lần', async () => {
    const { d, env } = fixture(4)
    await giao(env)
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    const chua = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, T0)
    expect(chua.ok).toBe(false)
    // 28/09: chỉ-thêm `error` cùng lời với `loi` (lớp gọi game-v2 chung đọc `error`)
    expect(chua).toMatchObject({ ma: 'chua_du' })
    expect(typeof chua.loi).toBe('string')
    expect(chua.error).toBe(chua.loi)
    expect(String(chua.loi)).toMatch(/rương mở/)
    await ghiSuKien(env, [...kh.dao, ...kh.doan].map((q, i) => suKien('S1', q, T0 + i * 60_000, true)))
    const mo = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, T0 + 3_600_000)
    expect(mo).toMatchObject({ ok: true, qua: { vang: VANG_RUONG }, lapLai: false })
    const lai = await hoa2Action(env, 'S1', 'hoa2-ruong-mo', {}, T0 + 7_200_000)
    expect(lai).toMatchObject({ ok: true, lapLai: true })
    expect(d.sql.prepare("SELECT SUM(so_vang) v FROM vang_so WHERE sbd='S1'").get()).toEqual({ v: VANG_RUONG })
  })

  it('Câu đã làm: chỉ câu em đã làm; chi tiết có đáp án + lời giải; câu chưa làm không lộ', async () => {
    const { env } = fixture()
    await giao(env, '2026-10-04', T0 - 3 * NGAY)
    await ghiSuKien(env, [suKien('S1', 'Q1', T0 - NGAY, false)])
    const ds = await hoa2Action(env, 'S1', 'hoa2-cau-da-lam', {}, T0)
    expect((ds.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['Q1'])
    const ct = await hoa2Action(env, 'S1', 'hoa2-cau-chi-tiet', { qids: ['Q1', 'Q2'] }, T0)
    const cau = ct.cau as { de: { qid: string }; dapAn: string; loiGiai: unknown }[]
    expect(cau.map((c) => c.de.qid)).toEqual(['Q1'])
    expect(cau[0]!.dapAn).toBe('B')
    expect(docCotLoi(cau[0]!.loiGiai)).toBe('Cốt lõi của Q1')
  })
})
