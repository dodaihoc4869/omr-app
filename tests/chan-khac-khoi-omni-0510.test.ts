// @vitest-environment node
// LUẬT THẦY 05/10 — kênh OMNI (chỉ có trên nhánh OMNI): vé thử thách, đề thử nửa, Trạm hồi phục (câu thấp hơn), ôn bài cũ — chỉ câu ĐÚNG khối em.
// Nguyên văn: "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   · "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác".
// D1 THẬT (node:sqlite). Lớp D1 OMNI / phạm vi đã dạy / hạng em là của làn khác ⇒ TIÊM bằng vi.mock (như tests/omni-3-tra-loi-ve-de-thu.test.ts).
// Kho: em S1 lớp 12A1; mỗi kênh có ứng viên ở BỐN tờ cùng mã dạng, cùng mức: khối 12 (`DH-12-…`, đúng), khối 10 (`DH-10-…`), KHÔNG RÕ (`DH-LA-…`),
// MÂU THUẪN (`DH-11-…` nhưng JSON câu ghi `lop: '12'`). Câu khối 12 em ĐÃ GẶP hôm qua (xếp sau) ⇒ bộ lọc hở là câu khác khối được chọn trước.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gvChienDich } from '../server/src/srs2-gv'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { CAC_KHUNG_GIO, type HoSoOmniEm, type QCau } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const tiem = vi.hoisted(() => ({
  bat: true,
  phamVi: null as null | { maDe: string[]; tick?: { ma: string; chienDichId: string } },
  dangCua: new Map<string, string>(),
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async () => tiem.bat),
    hoSoOmniEm: vi.fn(async (_e: Env, sbd: string) => ({
      sbd, vkn: {}, sEm: 0.08, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])), luotHomNay: 0, cursor: '', phienBan: 'test',
    }) as HoSoOmniEm),
    qCuaCau: vi.fn(async (_e: Env, qids: readonly string[]) => new Map(qids.map((q) => [q, { qid: q, phan: 'I', maDang: tiem.dangCua.get(q) ?? null, mucDo: null, vkn: [`dang:${tiem.dangCua.get(q) ?? q}`], nguon: 'mac_dinh' } as QCau]))),
  }
})
vi.mock('../server/src/bai-da-day', async (goc) => {
  const that = await goc<typeof import('../server/src/bai-da-day')>()
  return {
    ...that,
    lopCuaEm: vi.fn(async () => '12A1'),
    phamViCuaEm: vi.fn(async () => tiem.phamVi ? {
      lop: '12A1', maDe: new Set(tiem.phamVi.maDe),
      baiTheoMaDe: new Map(tiem.phamVi.maDe.map((m, i) => [m, { khoaBai: m, tenBai: `Bài ${m}`, viTri: i }])),
      baiDaTick: tiem.phamVi.tick ? [{ khoaBai: tiem.phamVi.tick.ma, tenBai: `Bài ${tiem.phamVi.tick.ma}`, viTri: tiem.phamVi.maDe.indexOf(tiem.phamVi.tick.ma), chienDichId: tiem.phamVi.tick.chienDichId, tickLuc: '2026-10-01T01:00:00.000Z' }] : [],
    } : null),
  }
})
vi.mock('../server/src/srs2-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/srs2-d1')>()
  return { ...that, docHangEm: vi.fn(async () => ({ hangTheoDang: {}, hangChung: 'L4' as const })) }
})

const T0 = Date.parse('2026-10-05T09:00:00+07:00') // thứ Hai
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe(); tiem.bat = true; tiem.phamVi = null; tiem.dangCua.clear() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Phan = 'I' | 'II' | 'III'
/** Bốn "khối" của một nhóm tờ: tờ đúng khối 12 + ba tờ phải bị chặn. */
const BON = (ten: string) => ({ dung: `DH-12-${ten}`, khac: `DH-10-${ten}`, la: `DH-LA-${ten}`, mt: `DH-11-${ten}` })
const laDung = (qid: string) => /^DH-12-/.test(qid)
interface CauFx { maDe: string; qid: string; phan: Phan; dang: string; mucDo: string; correct: string }
const dapAn = (phan: Phan, i: number) => (phan === 'I' ? 'ABCD'[i % 4]! : phan === 'II' ? ['DSDS', 'SSDD', 'DDSS'][i % 3]! : String(i + 1))
function boTo(ten: string, mau: (maDe: string) => Omit<CauFx, 'maDe'>[]): CauFx[] {
  return Object.values(BON(ten)).flatMap((maDe) => mau(maDe).map((c) => ({ ...c, maDe })))
}
const CAU: CauFx[] = [
  // chiến dịch đang luyện (dạng D2 — kế hoạch hôm nay không có câu D1 thấp hơn để Trạm lấy)
  ...[1, 2, 3, 4].map((i) => ({ maDe: 'DH-12-B1', qid: `DH-12-B1-I-${i}`, phan: 'I' as Phan, dang: 'D2', mucDo: 'NB', correct: 'B' })),
  // vé thử thách: D1 Vận dụng ở bốn tờ
  ...boTo('B2', (ma) => [1, 2, 3, 4].map((i) => ({ qid: `${ma}-I-${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: 'VD', correct: 'C' }))),
  // đề thử nửa: 12 · 3 · 5 câu ở bốn tờ
  ...boTo('B3', (ma) => [
    ...Array.from({ length: 12 }, (_, i) => ({ qid: `${ma}-I-${i}`, phan: 'I' as Phan, dang: 'D3', mucDo: 'TH', correct: dapAn('I', i) })),
    ...Array.from({ length: 3 }, (_, i) => ({ qid: `${ma}-II-${i}`, phan: 'II' as Phan, dang: 'D4', mucDo: 'TH', correct: dapAn('II', i) })),
    ...Array.from({ length: 5 }, (_, i) => ({ qid: `${ma}-III-${i}`, phan: 'III' as Phan, dang: 'D5', mucDo: 'VD', correct: dapAn('III', i) })),
  ]),
  // Trạm: D1 Thông hiểu (thấp hơn Vận dụng một bậc) ở bốn tờ
  ...boTo('B4', (ma) => [1, 2].map((i) => ({ qid: `${ma}-I-${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: 'TH', correct: 'A' }))),
  // ôn bài cũ: bài trước bài đã tick, bốn tờ
  ...boTo('B0', (ma) => [1, 2, 3].map((i) => ({ qid: `${ma}-I-${i}`, phan: 'I' as Phan, dang: 'D6', mucDo: 'NB', correct: 'D' }))),
]
function cauJson(c: CauFx) {
  return JSON.stringify({
    qid: c.qid, maDe: c.maDe, ...(c.maDe.startsWith('DH-11-') ? { lop: '12' } : {}), version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Câu ${c.qid}`,
    choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: c.phan === 'II' ? ['a', 'b', 'c', 'd'] : [], hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`,
    mucDo: c.mucDo, sao: 1, kienThuc: ['k'], correct: c.correct, reviewed: true, solution: { chot: `Lời giải ${c.qid}` },
  })
}
async function dung(): Promise<{ d: D1That; env: Env; token: string; cd: string }> {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const ma of [...new Set(CAU.map((c) => c.maDe))]) {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,0,'v1')").run(ma, ma, CAU.filter((c) => c.maDe === ma).length)
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(ma)
  }
  for (const c of CAU) { st.run(c.maDe, c.qid, 'v1', `g-${c.qid}`, c.dang, cauJson(c)); tiem.dangCua.set(c.qid, c.dang) }
  // Câu ĐÚNG khối em đã gặp hôm qua (đúng) ⇒ bộ xếp ưu tiên câu chưa gặp — tức câu khác khối — nếu bộ lọc hở.
  const daGap = CAU.filter((c) => laDung(c.qid) && !c.maDe.endsWith('B1') && !c.maDe.endsWith('B3') && !c.maDe.endsWith('B0'))
  await ghiSuKien(env, daGap.map((c, i) => ({ nguon: 'luyen' as const, maNguon: `cu-${i}`, sbd: 'S1', qid: c.qid, lan: 1, ketQua: 1 as const, luc: new Date(T0 - 86_400_000).toISOString() })))
  const token = await gameToken(env, 'S1')
  await gameV2(env, 'choose', { token, pet: 'dat_quy' })
  const r = await gvChienDich(env, { action: 'tao', ten: 'Bài 1', lop: '12A1', maDe: ['DH-12-B1'], hanNop: '2026-10-12' }, T0 - 86_400_000) as { id: string }
  return { d, env, token, cd: String(r.id) }
}
type KQ = Record<string, any>

describe('OMNI · chỉ câu ĐÚNG khối em (luật thầy 05/10)', () => {
  it('vé thử thách: 3 câu Vận dụng dạng D1 đều của tờ khối 12 — không khối 10, không câu không rõ khối, không câu mâu thuẫn khối', async () => {
    const { env, token } = await dung()
    tiem.phamVi = { maDe: Object.values(BON('B2')).concat('DH-12-B1') }
    const r = await gameV2(env, 'start', { token, mode: 'adventure', ve: 'D1' }) as KQ
    expect(r.ok).toBe(true)
    const qids = (r.questions as KQ[]).map((q) => String(q.qid))
    expect(qids.length).toBeGreaterThan(0)
    expect(qids.filter((q) => !laDung(q))).toEqual([])
    expect(qids.every((q) => q.startsWith('DH-12-B2-'))).toBe(true)
  })
  it('đề thử nửa: đủ 14 câu, MỌI câu của tờ khối 12', async () => {
    const { env, token } = await dung()
    tiem.phamVi = { maDe: Object.values(BON('B3')) }
    const de = await gameV2(env, 'hoa2-omni-de-thu', { token }) as KQ
    expect(de.ok).toBe(true)
    const qids = (de.cau as KQ[]).map((q) => String(q.qid))
    expect(qids).toHaveLength(14)
    expect(qids.filter((q) => !q.startsWith('DH-12-B3-'))).toEqual([])
  })
  it('Trạm hồi phục: câu thấp hơn một bậc thay ải kế tiếp là câu khối 12 (không lấy câu khác khối / không rõ / mâu thuẫn dù CHƯA gặp)', async () => {
    const { d, env, token } = await dung()
    tiem.phamVi = { maDe: Object.values(BON('B4')).concat(Object.values(BON('B2'))) }
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('P1', 'S1', JSON.stringify({
      mode: 'adventure', created: Date.now(), hoa2: 1, tram: 1,
      questions: ['DH-12-B2-I-1', 'DH-12-B2-I-2'].map((q) => ({ qid: q, maDe: 'DH-12-B2', version: 'v1', group: `g-${q}`, novel: true, role: 'moi' })),
    }), new Date().toISOString())
    const r = await gameV2(env, 'hoa2-omni-tram-xong', { token, session: 'P1' }) as KQ
    expect(r.ok).toBe(true)
    expect(r.cau).toBeTruthy()
    expect(String(r.cau.qid)).toMatch(/^DH-12-B4-/)
  })
  it('ôn bài cũ (bài trước bài đã tick): ứng viên chỉ câu tờ khối 12', async () => {
    const { env, cd } = await dung()
    const { docHoSo2 } = await import('../server/src/srs2-d1')
    tiem.phamVi = { maDe: [...Object.values(BON('B0')), 'DH-12-B1'], tick: { ma: 'DH-12-B1', chienDichId: cd } }
    const hs = await docHoSo2(env, 'S1', '2026-10-05')
    const on = (hs.onBaiCu ?? []).map((c) => c.qid)
    expect(on.length).toBeGreaterThan(0)
    expect(on.filter((q) => !q.startsWith('DH-12-B0-'))).toEqual([])
    // câu khác khối cũng không còn trong siêu dữ liệu hồ sơ (⇒ không kênh Hoá 2.0 nào phát được)
    for (const ma of [BON('B0').khac, BON('B0').la, BON('B0').mt]) expect([...hs.meta.keys()].some((q) => q.startsWith(`${ma}-`)), ma).toBe(false)
  })
})
