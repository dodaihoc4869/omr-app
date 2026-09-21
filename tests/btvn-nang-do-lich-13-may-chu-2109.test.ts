// @vitest-environment node
// BTVN "NÂNG ĐỠ" bản 1.3 ở MÁY CHỦ — nối `lichDaiSomHon` (Code 1, src/lib/btvn-nang-do-lich.ts) vào nơi ĐỌC `btvn_em.chang_mo_json` cho em ĐÃ chốt trước bản vá (Boss 21/09):
// hạn dài rơi buổi trưa ⇒ chặng CHƯA MỞ được mở SỚM hơn (chặng cuối không còn nằm ở ngày hạn sau giờ hạn), KHÔNG BAO GIỜ muộn hơn, không migration, áp lại vẫn cùng kết quả; hạn 23:59 y hệt.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { docLichDaLuu, moLucChang } from '../server/src/btvn-nang-do-chang'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, cauThay, dung, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const VN = (ngay: string, hhmm: string): string => new Date(Date.parse(`${ngay}T${hhmm}:00+07:00`)).toISOString()
const CHOT = BAY_GIO.toISOString() // 22/09 10:00 VN
const HAN_12H = VN('2026-09-26', '12:00')
const HAN_23H59 = VN('2026-09-26', '23:59')
const giaoHan = (d: D1That, hanIso: string) => goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: hanIso, caNhan: true, cau: cauThay(), ghim: [], hatGiong: 'hg-1' }, true)
const lichCu = (chot: string, n: number) => JSON.stringify({ cheDo: 'dai', chang: moLucChang(chot, n).map((m, chiSo) => ({ chiSo, moLuc: m, dungNhipTruoc: '' })) })

describe('docLichDaLuu có ngữ cảnh (hàm thuần)', () => {
  const cu5 = lichCu(CHOT, 5) // lịch cũ: chặng k mở 00:00 ngày (chốt + k) ⇒ chặng cuối 00:00 26/09 = NGÀY HẠN
  const nguCanh = (o: Partial<{ chotLuc: string; hanNop: string; nowMs: number }> = {}) => ({ chotLuc: CHOT, hanNop: HAN_12H, nowMs: Date.parse(CHOT), ...o })
  it('hạn 12:00 trưa: chỉ chặng chưa mở đổi, chỉ SỚM hơn (chặng cuối 00:00 ngày 25 thay vì ngày hạn 26)', () => {
    const cu = docLichDaLuu(cu5, 5)!.moLuc
    const moi = docLichDaLuu(cu5, 5, nguCanh())!.moLuc
    expect(cu[4]).toBe(VN('2026-09-26', '00:00'))
    expect(moi.slice(0, 4)).toEqual(cu.slice(0, 4))
    expect(moi[4]).toBe(VN('2026-09-25', '00:00'))
    for (let k = 0; k < 5; k++) expect(Date.parse(moi[k]!), `chặng ${k}`).toBeLessThanOrEqual(Date.parse(cu[k]!))
    for (let k = 1; k < 5; k++) expect(Date.parse(moi[k]!)).toBeGreaterThanOrEqual(Date.parse(moi[k - 1]!))
  })
  it('hạn 23:59: Y HỆT lịch cũ; áp lại nhiều lần cùng kết quả; không truyền ngữ cảnh ⇒ lịch cũ nguyên vẹn', () => {
    expect(docLichDaLuu(cu5, 5, nguCanh({ hanNop: VN('2026-09-26', '23:59') }))!.moLuc).toEqual(docLichDaLuu(cu5, 5)!.moLuc)
    const mot = docLichDaLuu(cu5, 5, nguCanh())!
    expect(docLichDaLuu(JSON.stringify({ cheDo: 'dai', chang: mot.moLuc.map((m, chiSo) => ({ chiSo, moLuc: m })) }), 5, nguCanh())!.moLuc).toEqual(mot.moLuc)
    expect(docLichDaLuu(cu5, 5)!.moLuc).toEqual(moLucChang(CHOT, 5))
  })
  it('chặng ĐÃ MỞ (mốc cũ ≤ bây giờ) giữ nguyên; lịch theo giờ (cheDo ngan) không đổi; hạn hỏng ⇒ giữ lịch đã lưu (không ném lỗi)', () => {
    const muon = docLichDaLuu(cu5, 5, nguCanh({ nowMs: Date.parse(VN('2026-09-25', '08:00')) }))!.moLuc
    expect(muon[3]).toBe(VN('2026-09-25', '00:00')) // đã mở lúc 25/09 00:00 ⇒ giữ
    expect(muon[4]).toBe(VN('2026-09-25', '00:00')) // vẫn chưa quá mốc cũ 26/09 ⇒ tính lại sớm hơn
    const ngan = cu5.replace('"dai"', '"ngan"')
    expect(docLichDaLuu(ngan, 5, nguCanh())!.moLuc).toEqual(docLichDaLuu(ngan, 5)!.moLuc)
    expect(docLichDaLuu(cu5, 5, nguCanh({ hanNop: 'rác' }))!.moLuc).toEqual(docLichDaLuu(cu5, 5)!.moLuc)
    expect(docLichDaLuu(cu5, 5, nguCanh({ chotLuc: '' }))!.moLuc).toEqual(docLichDaLuu(cu5, 5)!.moLuc)
    expect(docLichDaLuu(null, 5, nguCanh())).toBeNull()
  })
})

/** Em CHỐT TRƯỚC bản vá: giao hạn 12:00 rồi ép bộ thành 1 chặng nhiều hơn (tách chặng cuối làm hai) + ghi lại lịch cũ (chặng cuối mở ngày hạn 00:00). */
async function emChotTruocBanVa(han: string): Promise<{ d: D1That; n: number }> {
  gio(BAY_GIO)
  const d = dung()
  expect((await giaoHan(d, han)).ok).toBe(true)
  const m = await mo(d)
  expect(m.ok).toBe(true)
  const n0 = Number(m.soChang)
  const cuoi = d.sql.prepare('SELECT qid FROM btvn_em_cau WHERE sbd = ? AND chang = ? ORDER BY thu_tu').all('S1', n0 - 1) as { qid: string }[]
  expect(cuoi.length).toBeGreaterThanOrEqual(2)
  d.sql.prepare('UPDATE btvn_em_cau SET chang = ? WHERE sbd = ? AND qid = ?').run(n0, 'S1', cuoi[cuoi.length - 1]!.qid)
  d.sql.prepare('UPDATE btvn_em SET so_chang = ?, chang_mo_json = ? WHERE sbd = ?').run(n0 + 1, lichCu(CHOT, n0 + 1), 'S1')
  return { d, n: n0 + 1 }
}

describe('MÁY CHỦ đọc lịch đã lưu của em chốt trước bản vá', () => {
  const moLucTra = (m: { chang: { moLuc: string }[] }) => m.chang.map((c) => c.moLuc)
  it('hạn 12:00: /btvn/cua-em trả mốc mở chặng cuối SỚM hơn (00:00 ngày hạn − 1), các chặng trước y nguyên; áp lại nhiều lần cùng kết quả', async () => {
    const { d, n } = await emChotTruocBanVa(HAN_12H)
    gio(new Date(VN('2026-09-22', '11:00')))
    const m = await mo(d)
    expect(m.soChang).toBe(n)
    const cu = moLucChang(CHOT, n)
    expect(Date.parse(moLucTra(m)[n - 1]!)).toBeLessThan(Date.parse(cu[n - 1]!))
    expect(moLucTra(m)[n - 1]).toBe(VN('2026-09-25', '00:00'))
    expect(moLucTra(m).slice(0, n - 1)).toEqual(cu.slice(0, n - 1))
    expect(moLucTra(await mo(d))).toEqual(moLucTra(m))
  })
  it('hạn 23:59: Y HỆT lịch đã lưu (kể cả khi lưu theo lịch cũ)', async () => {
    gio(BAY_GIO)
    const d = dung()
    expect((await giaoHan(d, HAN_23H59)).ok).toBe(true)
    const n = Number((await mo(d)).soChang)
    d.sql.prepare('UPDATE btvn_em SET chang_mo_json = ? WHERE sbd = ?').run(lichCu(CHOT, n), 'S1')
    gio(new Date(VN('2026-09-22', '11:00')))
    expect(moLucTra(await mo(d))).toEqual(moLucChang(CHOT, n))
  })
  it('nộp chặng cuối: sau mốc SỚM mà chưa tới mốc cũ ⇒ nhận; trước mốc SỚM ⇒ vẫn "chưa mở" (không mở quá sớm)', async () => {
    const { d, n } = await emChotTruocBanVa(HAN_12H)
    d.sql.prepare('UPDATE btvn_em SET lo_da_xong = ? WHERE sbd = ?').run(n - 1, 'S1') // xong n−1 chặng đầu
    const qidCuoi = boCuaEm(d).filter((c) => c.chang === n - 1).map((c) => c.qid)
    const dapAn = Object.fromEntries(qidCuoi.map((q) => [q, DAP_AN_DUNG(q)]))
    gio(new Date(VN('2026-09-24', '20:00'))) // trước mốc mới 25/09 00:00
    expect(await nopChang(d, n - 1, dapAn)).toMatchObject({ ok: false, lyDo: 'chang_chua_mo' })
    gio(new Date(VN('2026-09-25', '08:00'))) // sau mốc mới, trước mốc cũ 26/09 00:00
    const r = await nopChang(d, n - 1, dapAn)
    expect(r.ok, JSON.stringify(r).slice(0, 200)).toBe(true)
    void maBtvn
  })
})
