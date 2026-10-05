// @vitest-environment node
// OMNI 3 · LÀN B3 — `start` + vé thử thách (mã dạng / 'auto'), lời báo chế độ chờ bài mới, ĐỀ THỬ NỬA (lập 14 câu lạ, chấm khi nộp) trên D1 thật.
// Lớp D1 OMNI, phạm vi đã dạy (bai-da-day) và hạng em (srs2-d1 docHangEm) là của làn khác ⇒ TIÊM bằng vi.mock (không phụ thuộc con số stub).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gvChienDich } from '../server/src/srs2-gv'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { chamCauDeThu, diemThang10, hanNgachDeThu } from '../server/src/omni-game'
import { grade } from '../src/game/than-thu-v2/core'
import { CAC_KHUNG_GIO, THAM_SO_OMNI, type HoSoOmniEm, type QCau } from '../server/src/omni-kieu'
import { CHU_CHO_BAI_MOI } from '../src/lib/omni-chu'
import type { Env } from '../server/src/kieu'

const tiem = vi.hoisted(() => ({
  bat: false,
  p: {} as Record<string, number>,
  dangCua: new Map<string, string>(),
  phamVi: null as string[] | null,
  hang: null as null | 'L1' | 'L2' | 'L3' | 'L4',
  cheDoCho: false,
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async () => tiem.bat),
    hoSoOmniEm: vi.fn(async (_e: Env, sbd: string) => ({
      sbd, vkn: Object.fromEntries(Object.entries(tiem.p).map(([k, p]) => [k, { vkn: k, p, nTuLam: 3, nCau: 3, nNgay: 2, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du', ngayCuoi: null, dayLai: false }])),
      sEm: 0.08, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])), luotHomNay: 0, cursor: '', phienBan: 'test',
    }) as HoSoOmniEm),
    qCuaCau: vi.fn(async (_e: Env, qids: readonly string[]) => new Map(qids.map((q) => [q, { qid: q, phan: 'I', maDang: tiem.dangCua.get(q) ?? null, mucDo: null, vkn: [`dang:${tiem.dangCua.get(q) ?? q}`], nguon: 'mac_dinh' } as QCau]))),
  }
})
vi.mock('../server/src/bai-da-day', async (goc) => {
  const that = await goc<typeof import('../server/src/bai-da-day')>()
  return {
    ...that,
    phamViCuaEm: vi.fn(async () => tiem.phamVi ? { lop: '12A1', maDe: new Set(tiem.phamVi), baiTheoMaDe: new Map(), baiDaTick: [] } : null),
  }
})
vi.mock('../server/src/srs2-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/srs2-d1')>()
  return {
    ...that,
    docHangEm: vi.fn(async (...a: Parameters<typeof that.docHangEm>) => tiem.hang ? { hangTheoDang: {}, hangChung: tiem.hang } : that.docHangEm(...a)),
    layKeHoachHomNay: vi.fn(async (...a: Parameters<typeof that.layKeHoachHomNay>) => {
      const r = await that.layKeHoachHomNay(...a)
      if (tiem.cheDoCho) (r.hs as unknown as { omni: unknown }).omni = { bat: true, cheDoCho: true, onBaiCuSo: 0 }
      return r
    }),
  }
})

const T0 = Date.parse('2026-10-05T09:00:00+07:00') // thứ Hai
let bayGio = T0
const toi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => {
  bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  Object.assign(tiem, { bat: false, p: {}, phamVi: null, hang: null, cheDoCho: false })
  tiem.dangCua.clear()
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Phan = 'I' | 'II' | 'III'
interface CauFx { maDe: string; qid: string; phan: Phan; dang: string; mucDo: string; correct: string }
const dapAn = (phan: Phan, i: number) => (phan === 'I' ? 'ABCD'[i % 4]! : phan === 'II' ? ['DSDS', 'SSDD', 'DDSS'][i % 3]! : String(i + 1))
const CAU: CauFx[] = [
  // Bài 1 (chiến dịch đang luyện): dạng D1, D2 mức thấp
  ...[1, 2, 3, 4].map((i) => ({ maDe: 'DH-B1', qid: `B1-${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: i <= 2 ? 'NB' : 'TH', correct: 'B' })),
  ...[5, 6].map((i) => ({ maDe: 'DH-B1', qid: `B1-${i}`, phan: 'I' as Phan, dang: 'D2', mucDo: 'NB', correct: 'B' })),
  // Bài 2 (bài cũ — trong phạm vi đã dạy, ngoài chiến dịch): D1 Vận dụng ×4, D1 Vận dụng cao ×1, D2 Vận dụng ×3
  ...[1, 2, 3, 4].map((i) => ({ maDe: 'DH-B2', qid: `B2-${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: 'VD', correct: 'C' })),
  { maDe: 'DH-B2', qid: 'B2-5', phan: 'I', dang: 'D1', mucDo: 'VDC', correct: 'C' },
  ...[6, 7, 8].map((i) => ({ maDe: 'DH-B2', qid: `B2-${i}`, phan: 'I' as Phan, dang: 'D2', mucDo: 'VD', correct: 'C' })),
  // Tờ TU LUYỆN (không mã DH-): D1 Vận dụng — KHÔNG được ra vé
  ...[1, 2].map((i) => ({ maDe: 'TL-X', qid: `TL-${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: 'VD', correct: 'C' })),
  // Bài 3 (đề thử): 12 câu Phần I (D3), 3 câu Phần II (D4), 5 câu Phần III (D5)
  ...Array.from({ length: 12 }, (_, i) => ({ maDe: 'DH-B3', qid: `B3-I-${i}`, phan: 'I' as Phan, dang: i % 2 ? 'D3' : 'D6', mucDo: 'TH', correct: dapAn('I', i) })),
  ...Array.from({ length: 3 }, (_, i) => ({ maDe: 'DH-B3', qid: `B3-II-${i}`, phan: 'II' as Phan, dang: 'D4', mucDo: 'TH', correct: dapAn('II', i) })),
  ...Array.from({ length: 5 }, (_, i) => ({ maDe: 'DH-B3', qid: `B3-III-${i}`, phan: 'III' as Phan, dang: 'D5', mucDo: 'VD', correct: dapAn('III', i) })),
]
const theoQid = new Map(CAU.map((c) => [c.qid, c]))
function cauJson(c: CauFx) {
  return JSON.stringify({
    qid: c.qid, maDe: c.maDe, version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Câu ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [],
    ideas: c.phan === 'II' ? ['a', 'b', 'c', 'd'] : [], hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['k'], correct: c.correct,
    reviewed: true, solution: { chot: `Lời giải ${c.qid}` },
  })
}
async function dung(o: { chienDich?: boolean } = {}) {
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
  const token = await gameToken(env, 'S1')
  await gameV2(env, 'choose', { token, pet: 'dat_quy' })
  if (o.chienDich !== false) await gvChienDich(env, { action: 'tao', ten: 'Bài 1', lop: '12A1', maDe: ['DH-B1'], hanNop: '2026-10-12' }, T0 - 86_400_000)
  return { d, env, token }
}
type KQ = Record<string, any>
const start = (env: Env, token: string, them: Record<string, unknown> = {}) => gameV2(env, 'start', { token, mode: 'adventure', ...them }) as Promise<KQ>

// ---------------------------------------------------------------- vé thử thách
describe('OMNI 3 · B3 — vé thử thách', () => {
  it('cờ tắt ⇒ `start` có `ve` y hệt `start` thường (trả lại chính chuyến đang chờ, không phiên vé, không trừ vé)', async () => {
    const { d, env, token } = await dung()
    const thuong = await start(env, token)
    expect(thuong.ok).toBe(true)
    expect(thuong.questions.length).toBeGreaterThan(0)
    const coVe = await start(env, token, { ve: 'D1' })
    expect(JSON.stringify(coVe)).toBe(JSON.stringify(thuong))
    expect(coVe.veDang).toBeUndefined()
    const phien = d.sql.prepare('SELECT json FROM game_v2_session').all() as { json: string }[]
    expect(phien.every((x) => JSON.parse(x.json).ve === undefined)).toBe(true)
    expect(d.sql.prepare("SELECT name FROM sqlite_master WHERE name = 'omni_ve'").get()).toBeTruthy() // bảng có từ migration, nhưng KHÔNG dòng nào
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM omni_ve').get() as { n: number }).n).toBe(0)
  })
  it('còn vé ⇒ 3 câu cao hơn bậc em MỘT bậc (DẠY HỌC, trong phạm vi, ưu tiên chưa gặp), vai thu_thach, trừ vé; hết vé ⇒ het_ve; tuần sau có vé mới', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.hang = 'L4' // chưa thành thạo mức nào ⇒ theo hạng L4 = Thông hiểu ⇒ vé lấy Vận dụng
    tiem.phamVi = ['DH-B1', 'DH-B2', 'TL-X']
    // em đã gặp B2-1 hôm qua ⇒ xếp sau câu chưa gặp
    await ghiSuKien(env, [{ nguon: 'luyen', maNguon: 'x', sbd: 'S1', qid: 'B2-1', lan: 1, ketQua: 0, luc: new Date(T0 - 86_400_000).toISOString() }])
    const r1 = await start(env, token, { ve: 'D1' })
    expect(r1.ok).toBe(true)
    expect(r1.questions.map((q: KQ) => q.qid).sort()).toEqual(['B2-2', 'B2-3', 'B2-4'])
    for (const q of r1.questions) {
      expect(q.vai).toBe('thu_thach')
      expect(q.correct).toBeUndefined()
      expect(q.solution).toBeUndefined()
      expect(theoQid.get(q.qid)).toMatchObject({ maDe: 'DH-B2', dang: 'D1', mucDo: 'VD' })
    }
    expect(r1.ve).toEqual({ con: 1, tong: THAM_SO_OMNI.VE_MOI_TUAN })
    expect(r1.veDang).toEqual({ ma: 'D1', ten: 'Dạng D1' })
    const phien = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(r1.id) as { json: string }).json)
    expect(phien).toMatchObject({ hoa2: 1, ve: 1, veDang: 'D1' })
    expect(phien.questions.every((x: KQ) => x.role === 'thu_thach')).toBe(true)
    expect(d.sql.prepare('SELECT tuan, da_dung FROM omni_ve WHERE sbd = ?').all('S1')).toEqual([{ tuan: '2026-10-05', da_dung: 1 }])
    // trả lời sai ở vé: sổ ghi thật (purpose 'probe'), kết quả mang ve:true (không trừ Máu)
    const sai = await gameV2(env, 'answer', { token, session: r1.id, qid: r1.questions[0].qid, answer: 'A', msLam: 50_000 }) as KQ
    expect(sai).toMatchObject({ ok: true, correct: false, ve: true })
    expect(d.sql.prepare('SELECT ket_qua, purpose FROM su_kien_hoc WHERE ma_nguon = ?').get(r1.id)).toEqual({ ket_qua: 0, purpose: 'probe' })
    const r2 = await start(env, token, { ve: 'D1' })
    expect(r2.ok).toBe(true)
    expect(r2.ve).toEqual({ con: 0, tong: 2 })
    const r3 = await start(env, token, { ve: 'D1' })
    expect(r3).toMatchObject({ ok: false, lyDo: 'het_ve' })
    expect((d.sql.prepare('SELECT da_dung FROM omni_ve WHERE sbd = ?').get('S1') as { da_dung: number }).da_dung).toBe(2)
    toi(7 * 86_400_000) // thứ Hai tuần sau
    const r4 = await start(env, token, { ve: 'D1' })
    expect(r4.ok).toBe(true)
    expect(r4.ve).toEqual({ con: 1, tong: 2 })
  })
  it("ve:'auto' ⇒ dạng CHƯA VỮNG có P thấp nhất của bài đang luyện hạn gần nhất; không có câu ⇒ báo, KHÔNG trừ vé", async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.hang = 'L4'
    tiem.phamVi = ['DH-B1', 'DH-B2']
    tiem.p = { 'dang:D1': 0.8, 'dang:D2': 0.2 }
    const r = await start(env, token, { ve: 'auto' })
    expect(r.ok).toBe(true)
    expect(r.veDang).toEqual({ ma: 'D2', ten: 'Dạng D2' })
    expect(r.questions.map((q: KQ) => q.qid).sort()).toEqual(['B2-6', 'B2-7', 'B2-8'])
    // dạng không có câu bậc cao hơn trong phạm vi ⇒ không trừ vé
    tiem.phamVi = ['DH-B1']
    const khong = await start(env, token, { ve: 'D1' })
    expect(khong).toMatchObject({ ok: false, lyDo: 'khong_co_cau' })
    expect((d.sql.prepare('SELECT da_dung FROM omni_ve WHERE sbd = ?').get('S1') as { da_dung: number }).da_dung).toBe(1)
  })
  it('ngày chưa có câu nào: chế độ chờ bài mới (OMNI) ⇒ lời "chờ thầy giao bài mới"; không ⇒ lời cũ', async () => {
    const { env, token } = await dung({ chienDich: false })
    const cu = await start(env, token)
    expect(cu).toMatchObject({ ok: true, questions: [], lyDo: 'xong_ke_hoach', message: 'Hôm nay chưa có câu nào cho em. Thầy giao chiến dịch là đảo mở.' })
    tiem.cheDoCho = true
    const cho = await start(env, token)
    expect(cho).toMatchObject({ ok: true, questions: [], lyDo: 'xong_ke_hoach', message: CHU_CHO_BAI_MOI })
  })
})

// ---------------------------------------------------------------- đề thử nửa
describe('OMNI 3 · B3 — đề thử nửa', () => {
  it('hàm thuần: hạn ngạch 9·2·3; chấm I/III 0,25, II theo số ý; thang 10 theo khung của đề', () => {
    expect(hanNgachDeThu(14)).toEqual({ I: 9, II: 2, III: 3 })
    expect(hanNgachDeThu(28)).toEqual({ I: 18, II: 4, III: 6 })
    expect(chamCauDeThu({ phan: 'I', correct: 'B' }, 'B')).toEqual({ dung: true, diem: 0.25 })
    expect(chamCauDeThu({ phan: 'II', correct: 'DSDS' }, 'DSDD')).toEqual({ dung: false, diem: 0.5, yDung: 3 })
    expect(chamCauDeThu({ phan: 'II', correct: 'DSDS' }, '')).toEqual({ dung: false, diem: 0, yDung: 0 })
    expect(chamCauDeThu({ phan: 'III', correct: '0,54' }, '0,54')).toEqual({ dung: true, diem: 0.25 })
    // Phần III chấm ĐÚNG hàm của game (`grade`, khớp số chặt) — không nới riêng cho đề thử
    expect(chamCauDeThu({ phan: 'III', correct: '0,54' }, '0,540').dung).toBe(grade({ phan: 'III', correct: '0,54' }, '0,540'))
    const khung = [...Array(9).fill({ phan: 'I', diem: 0.25 }), { phan: 'II', diem: 1 }, { phan: 'II', diem: 1 }, ...Array(3).fill({ phan: 'III', diem: 0.25 })]
    expect(diemThang10(khung)).toBe(10)
    expect(diemThang10(khung.map((c) => ({ ...c, diem: 0 })))).toBe(0)
  })
  it('14 câu LẠ (bỏ câu đã làm), DẠY HỌC trong phạm vi, 9·2·3, không lộ đáp án; gọi lại trả chính đề ấy; nộp ⇒ chấm đúng điểm + sổ + đáp án sau khi nộp', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.phamVi = ['DH-B3']
    await ghiSuKien(env, ['B3-I-0', 'B3-I-1', 'B3-III-0'].map((qid) => ({ nguon: 'luyen' as const, maNguon: 'cu', sbd: 'S1', qid, lan: 1, ketQua: 1 as const, luc: new Date(T0 - 2 * 86_400_000).toISOString() })))
    const de = await gameV2(env, 'hoa2-omni-de-thu', { token }) as KQ
    expect(de.ok).toBe(true)
    expect(de.phut).toBe(25)
    expect(de.hetLuc).toBe(new Date(T0 + 25 * 60_000).toISOString())
    expect(de.cau).toHaveLength(14)
    const qids: string[] = de.cau.map((q: KQ) => q.qid)
    expect(new Set(qids).size).toBe(14)
    expect(qids.filter((q) => ['B3-I-0', 'B3-I-1', 'B3-III-0'].includes(q))).toEqual([])
    const demPhan = (p: Phan) => qids.filter((q) => theoQid.get(q)!.phan === p).length
    expect([demPhan('I'), demPhan('II'), demPhan('III')]).toEqual([9, 2, 3])
    for (const q of de.cau) { expect(q.correct).toBeUndefined(); expect(q.solution).toBeUndefined() }
    expect(JSON.stringify(de)).not.toMatch(/Lời giải/)
    const lai = await gameV2(env, 'hoa2-omni-de-thu', { token }) as KQ
    expect(lai.id).toBe(de.id)
    expect(lai.cau.map((q: KQ) => q.qid)).toEqual(qids)
    // Bài làm: I đúng hết (9 × 0,25) · II câu đầu đúng hết (1), câu sau đúng 3 ý (0,5) · III đúng 2, bỏ trống 1 ⇒ 4,25 / 5 ⇒ 8,5
    const tl: Record<string, string> = {}
    const II = qids.filter((q) => theoQid.get(q)!.phan === 'II'), III = qids.filter((q) => theoQid.get(q)!.phan === 'III')
    for (const q of qids.filter((x) => theoQid.get(x)!.phan === 'I')) tl[q] = theoQid.get(q)!.correct
    tl[II[0]!] = theoQid.get(II[0]!)!.correct
    const dsII = theoQid.get(II[1]!)!.correct
    tl[II[1]!] = dsII.slice(0, 3) + (dsII[3] === 'D' ? 'S' : 'D')
    tl[III[0]!] = theoQid.get(III[0]!)!.correct
    tl[III[1]!] = theoQid.get(III[1]!)!.correct
    toi(10 * 60_000)
    const nop = await gameV2(env, 'hoa2-omni-de-thu-nop', { token, id: de.id, traLoi: tl, msLam: { [qids[0]!]: 30_000 } }) as KQ
    expect(nop).toMatchObject({ ok: true, diem: 8.5, dung: 12, tong: 14 })
    expect(nop.quaGio).toBeUndefined()
    const c0 = nop.cau.find((c: KQ) => c.qid === qids[0])
    expect(c0).toEqual({ qid: qids[0], dung: true, traLoi: theoQid.get(qids[0]!)!.correct, dapAn: theoQid.get(qids[0]!)!.correct, loiGiai: { chot: `Lời giải ${qids[0]}` } })
    expect(nop.cau.find((c: KQ) => c.qid === III[2])).toMatchObject({ dung: false, traLoi: '' })
    const so = d.sql.prepare("SELECT qid, ket_qua, purpose, nguon, raw_json FROM su_kien_hoc WHERE ma_nguon = ? ORDER BY qid").all(`de_thu:${de.id}`) as KQ[]
    expect(so).toHaveLength(14)
    expect(so.every((x) => x.purpose === 'de_thu' && x.nguon === 'luyen')).toBe(true)
    expect(so.find((x) => x.qid === III[2])!.ket_qua).toBeNull()
    expect(JSON.parse(so.find((x) => x.qid === qids[0])!.raw_json)).toEqual({ chon: theoQid.get(qids[0]!)!.correct, ms: 30_000 })
    expect(d.sql.prepare('SELECT diem, nop_luc FROM omni_de_thu WHERE id = ?').get(de.id)).toEqual({ diem: 8.5, nop_luc: new Date(T0 + 10 * 60_000).toISOString() })
    // nộp lại (mạng chập chờn) với bài khác ⇒ chấm lại ĐÚNG bài đã ghi sổ, không thêm dòng
    const nopLai = await gameV2(env, 'hoa2-omni-de-thu-nop', { token, id: de.id, traLoi: {} }) as KQ
    expect(nopLai).toMatchObject({ ok: true, diem: 8.5, dung: 12, tong: 14 })
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE ma_nguon = ?').get(`de_thu:${de.id}`) as { n: number }).n).toBe(14)
  })
  it('quá hạn + 2 phút vẫn chấm nhưng mang quaGio; không đủ câu lạ ⇒ chua_du_cau', async () => {
    const { env, token } = await dung()
    tiem.bat = true
    tiem.phamVi = ['DH-B3']
    const de = await gameV2(env, 'hoa2-omni-de-thu', { token }) as KQ
    expect(de.ok).toBe(true)
    toi(28 * 60_000)
    const nop = await gameV2(env, 'hoa2-omni-de-thu-nop', { token, id: de.id, traLoi: {} }) as KQ
    expect(nop).toMatchObject({ ok: true, diem: 0, dung: 0, tong: 14, quaGio: true })
    tiem.phamVi = ['DH-B1']
    const thieu = await gameV2(env, 'hoa2-omni-de-thu', { token }) as KQ
    expect(thieu).toMatchObject({ ok: false, lyDo: 'chua_du_cau' })
  })
})
