// @vitest-environment node
// LÀM LẠI CUỐI CHẶNG KIỂU DUOLINGO (thầy 26/10; docs/de-xuat-phan-cau-kieu-duolingo-2610.md A3) — chạy thật trên D1 giả: em sai một câu trong chặng ⇒ lệnh
// `hoc-tap-lam-lai` cấp câu ANH EM cùng dạng (không phải câu vừa sai, không kèm đáp án) ⇒ nộp câu ấy là CÓ HỖ TRỢ (không EXP) ⇒ gọi lại không cấp vòng hai ⇒
// chặng sau không chứa câu làm lại.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Question } from '../src/game/than-thu-v2/core'

const NOW = Date.parse('2026-10-10T02:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })
async function kho(n = 240, co: string | null = '{"cheDo":"bat","lop":[]}') {
  const k = taoKhoOmni({ 'DH-12-B1': n })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-12-B1','Bài mới','12',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-12-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  if (co) k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('duolingo_bai','${co}','x')`)
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('latest', '12A1', 'B1', 'Bài mới', 1, '["DH-12-B1"]', '2026-10-09T18:30:00Z')
  k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='gia' WHERE sbd='S1'").run()
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-12-B1'), maDe: ['DH-12-B1'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
const traLoiSai = (q: Question) => q.phan === 'I' ? 'A' : q.phan === 'II' ? 'SSSS' : '9'
const traLoiDung = (q: Question) => q.phan === 'I' ? 'B' : q.phan === 'II' ? 'DSDS' : '4'

it('sai một câu ⇒ câu anh em cùng dạng, không lộ đáp án; nộp là có hỗ trợ, không EXP; gọi lại không cấp thêm; chặng sau không chứa câu làm lại', async () => {
  const k = await kho()
  const r = await startGoi7(k.env, 'S1', NOW)
  const ds = r!.questions as Question[]
  expect(ds.length).toBeGreaterThan(0)
  // Em đúng mọi câu trừ câu đầu.
  for (const [i, q] of ds.entries()) await gameV2(k.env, 'answer', { token: k.token, session: r!.id, qid: q.qid, answer: i === 0 ? traLoiSai(q) : traLoiDung(q), assisted: false, msLam: 20000 })
  const ll = await gameV2(k.env, 'hoc-tap-lam-lai', { token: k.token, session: r!.id }) as { ok: boolean; questions: (Question & { vaiGoi7?: string; lamLaiCua?: string })[] }
  expect(ll.ok).toBe(true)
  expect(ll.questions).toHaveLength(1)
  const x = ll.questions[0]!
  expect(x.qid).not.toBe(ds[0]!.qid)
  expect(x.dang).toBe(ds[0]!.dang)
  expect(x.vaiGoi7).toBe('lam_lai'); expect(x.lamLaiCua).toBe(ds[0]!.qid)
  expect(x).not.toHaveProperty('correct'); expect(x).not.toHaveProperty('solution')
  const kq = await gameV2(k.env, 'answer', { token: k.token, session: r!.id, qid: x.qid, answer: traLoiDung(x), assisted: false, msLam: 20000 }) as { correct: boolean; attempt: { assisted: boolean } }
  expect(kq.correct).toBe(true)
  expect(kq.attempt.assisted).toBe(true) // máy chủ ép có hỗ trợ dù máy em gửi assisted:false
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM exp_so WHERE khoa LIKE ?").get(`%cau_game|${r!.id}|${x.qid}`)).toMatchObject({ n: 0 })
  // Gọi lại: không cấp vòng hai, không cấp lại câu đã làm.
  const lai = await gameV2(k.env, 'hoc-tap-lam-lai', { token: k.token, session: r!.id }) as { questions: unknown[] }
  expect(lai.questions).toEqual([])
  // Chặng sau: không có câu làm lại.
  const sau = await startGoi7(k.env, 'S1', NOW + 60_000)
  expect((sau!.questions as Question[]).map(q => q.qid)).not.toContain(x.qid)
})

it('chặng không sai câu nào ⇒ không có vòng làm lại', async () => {
  const k = await kho()
  const r = await startGoi7(k.env, 'S1', NOW)
  for (const q of r!.questions as Question[]) await gameV2(k.env, 'answer', { token: k.token, session: r!.id, qid: q.qid, answer: traLoiDung(q), assisted: false, msLam: 20000 })
  const ll = await gameV2(k.env, 'hoc-tap-lam-lai', { token: k.token, session: r!.id }) as { questions: unknown[] }
  expect(ll.questions).toEqual([])
})

it('cờ duolingo_bai tắt (vắng dòng) ⇒ không có vòng làm lại dù có câu sai', async () => {
  const k = await kho(240, null)
  const r = await startGoi7(k.env, 'S1', NOW)
  const q = (r!.questions as Question[])[0]!
  await gameV2(k.env, 'answer', { token: k.token, session: r!.id, qid: q.qid, answer: traLoiSai(q), assisted: false, msLam: 20000 })
  const ll = await gameV2(k.env, 'hoc-tap-lam-lai', { token: k.token, session: r!.id }) as { questions: unknown[] }
  expect(ll.questions).toEqual([])
})

it('cờ thử theo lớp: lớp có trong danh sách ⇒ có vòng làm lại; lớp khác ⇒ không', async () => {
  for (const [lop, co] of [['12A1', 1], ['12A9', 0]] as const) {
    const k = await kho(240, `{"cheDo":"thu","lop":["${lop}"]}`)
    const r = await startGoi7(k.env, 'S1', NOW)
    const q = (r!.questions as Question[])[0]!
    await gameV2(k.env, 'answer', { token: k.token, session: r!.id, qid: q.qid, answer: traLoiSai(q), assisted: false, msLam: 20000 })
    const ll = await gameV2(k.env, 'hoc-tap-lam-lai', { token: k.token, session: r!.id }) as { questions: unknown[] }
    expect(ll.questions.length > 0 ? 1 : 0).toBe(co)
    xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe()
  }
})
