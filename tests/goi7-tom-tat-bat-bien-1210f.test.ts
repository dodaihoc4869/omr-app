// @vitest-environment node
// KHẨN 12/10 21h30 (thầy: "lúc chiều thì hiện 31 câu giờ lại hiện 2 chặng mà không bấm làm được"): BẤT BIẾN của `tomTatGoi7` (máy chủ) — app đọc
// tóm tắt này; một trường lệch từng làm app bỏ cả gói. Mỗi gói: `to` chỉ gồm chuỗi khác rỗng · `daGap` chỉ đếm câu THUỘC gói và ≤ `tong` ·
// `con = tong − daGap ≥ 0` · số đếm hữu hạn ≥ 0 · `diemDaDo` chỉ gồm mục hợp lệ. Và app (`docTomTatGoi7`) nhận nguyên vẹn tóm tắt ấy.
import { describe, expect, it } from 'vitest'
import { tomTatGoi7, type GoiCuaEm7 } from '../server/src/goi-bai-7'
import type { CauGoi7 } from '../server/src/goi-bai-7-loi'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'

type Lap = Parameters<typeof tomTatGoi7>[0]
const NOW = Date.parse('2026-10-12T14:30:00Z') // 21h30 giờ Việt Nam
const cau = (qid: string, x: Partial<CauGoi7> = {}): CauGoi7 => ({ qid, maDe: 'DH-B8', maTo: 'DH-B8-TN', version: 'v1', group: qid, phan: 'I', kho: false, tinhToan: false, kyNang: [], ...x })
const goi = (x: Partial<GoiCuaEm7> = {}): GoiCuaEm7 => ({
  id: 'g7:amine', ten: 'Bài 8. Amine', khoaBai: 'b8', batDau: '2026-10-11', han: '2026-10-16', maDeNguon: ['DH-B8'], nguonDayDu: true, quota: 32,
  cau: [cau('q1'), cau('q2'), cau('q3'), cau('q4')], daGap: new Set(['q1', 'q2']), gapNgay: new Set(['q2']), tuLamNgay: new Set(), choThay: new Set(), ...x,
})
const lap = (x: Partial<Lap> = {}): Lap => ({
  goi: [goi()], plan: { viec: [{ qid: 'q3', vai: 'moi', huongDan: false }], thieuPhu: 0, tuLam: 1, tiepCan: 0 }, toiThieu: 32, daLamNgay: 7,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [], ...x,
} as unknown as Lap)

function batBien(t: ReturnType<typeof tomTatGoi7>) {
  for (const g of t.goi) {
    expect(g.to.every((m) => typeof m === 'string' && m.trim().length > 0)).toBe(true)
    expect(g.daGap).toBeLessThanOrEqual(g.tong)
    expect(g.con).toBe(g.tong - g.daGap)
    expect(g.con).toBeGreaterThanOrEqual(0)
    for (const n of [g.tong, g.daGap, g.quota, g.gapHomNay, g.canBoSung]) expect(Number.isFinite(n) && n >= 0).toBe(true)
  }
  for (const n of [t.tuLamCon, t.tiepCanCon, t.thieuPhu, t.thieuNgay]) expect(Number.isFinite(n) && n >= 0).toBe(true)
  for (const d of t.diemDaDo) {
    expect(typeof d.goiId === 'string' && typeof d.maDe === 'string' && typeof d.luc === 'string').toBe(true)
    expect(Number.isFinite(d.diem) && d.diem >= 0 && d.diem <= 10 && d.cauMoi >= 0 && d.cauMoi <= d.tong).toBe(true)
  }
  // JSON khứ hồi (đúng đường máy chủ → app) vẫn được app nhận đủ: không trường nào làm app bỏ gói
  const app = docTomTatGoi7(JSON.parse(JSON.stringify(t)))
  expect(app).toBeDefined()
  expect(app!.goi.map((g) => [g.id, g.tong, g.daGap, g.con])).toEqual(t.goi.map((g) => [g.id, g.tong, g.daGap, g.con]))
  return app!
}

describe('tomTatGoi7 — bất biến của tóm tắt gửi app', () => {
  it('dữ liệu bình thường: số đúng, app nhận nguyên vẹn (M = 32, đã làm 7, thiếu ngày = 32 − 7 − 1)', () => {
    const t = tomTatGoi7(lap(), NOW)
    expect(t.goi[0]).toMatchObject({ tong: 4, daGap: 2, con: 2, to: ['DH-B8-TN'], gapHomNay: 1, quaHan: false })
    expect([t.toiThieu, t.daLamHomNay, t.thieuNgay]).toEqual([32, 7, 24])
    const app = batBien(t)
    expect([app.toiThieu, app.daLamHomNay, app.thieuNgay]).toEqual([32, 7, 24])
  })

  it('`to` chỉ gồm chuỗi khác rỗng: câu thiếu maTo/maDe hoặc mã rỗng/khác kiểu bị lọc', () => {
    const g = goi({ cau: [cau('q1'), cau('q2', { maTo: undefined, maDe: undefined as unknown as string }), cau('q3', { maTo: '', maDe: '' }), cau('q4', { maTo: 12028 as unknown as string })] })
    const t = tomTatGoi7(lap({ goi: [g] }), NOW)
    expect(t.goi[0]!.to).toEqual(['DH-B8-TN'])
    batBien(t)
  })

  it('`daGap` chỉ đếm câu THUỘC gói, ≤ tong; con = tong − daGap ≥ 0 (cả khi sổ gặp lẫn câu ngoài gói / câu trùng)', () => {
    const g = goi({ cau: [cau('q1'), cau('q2'), cau('q2')], daGap: new Set(['q1', 'q2', 'ngoai-1', 'ngoai-2', 'ngoai-3']), gapNgay: new Set(['ngoai-1', 'q1']) })
    const t = tomTatGoi7(lap({ goi: [g] }), NOW)
    expect(t.goi[0]).toMatchObject({ tong: 2, daGap: 2, con: 0, gapHomNay: 1 })
    batBien(t)
  })

  it('`diemDaDo` chỉ giữ mục hợp lệ (điểm NaN / > 10 · câu mới > tổng · thiếu mã bị bỏ)', () => {
    const tot = { goiId: 'g7:amine', maDe: 'DH-B8-TN', diem: 8.5, luc: '2026-10-12T13:00:00Z', cauMoi: 2, tong: 4 }
    const t = tomTatGoi7(lap({ diemDaDo: [tot, { ...tot, diem: NaN }, { ...tot, diem: 12 }, { ...tot, cauMoi: 5 }, { ...tot, maDe: '' }, { ...tot, tong: NaN }] }), NOW)
    expect(t.diemDaDo).toEqual([tot])
    batBien(t)
  })

  it('số đếm lạ (quota NaN, plan lạ) ⇒ 0, không thành null trong JSON', () => {
    const t = tomTatGoi7(lap({ goi: [goi({ quota: NaN })], plan: { viec: [], thieuPhu: NaN, tuLam: 0, tiepCan: 0 } } as unknown as Partial<Lap>), NOW)
    expect([t.goi[0]!.quota, t.thieuPhu]).toEqual([0, 0])
    const kh = JSON.parse(JSON.stringify(t)) as { goi: { quota: unknown }[]; thieuPhu: unknown }
    expect([kh.goi[0]!.quota, kh.thieuPhu]).toEqual([0, 0])
    batBien(t)
  })

  it('kho thiếu: chỉ xếp được 1 việc ⇒ thieuNgay = 24 (M − đã làm − xếp được) — app hiện "Còn 25 câu", không "Còn 1 câu"', () => {
    const t = tomTatGoi7(lap(), NOW)
    expect(t.thieuNgay).toBe(24)
    expect(t.toiThieu - t.daLamHomNay).toBe(25)
    expect(t.tuLamCon + t.tiepCanCon + t.thieuNgay).toBe(25)
  })
})
