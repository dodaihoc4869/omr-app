// @vitest-environment node
// BTVN "NÂNG ĐỠ" bản 1.4 ở MÁY CHỦ (Code 1 viết lõi `nganSachHanNgan`, Boss duyệt hệ số 1,0; Code 3 nối ở `nganSachVaSucChua`): hạn ngắn có TRẦN TỔNG — em mở MUỘN không bao giờ nhận nhiều câu hơn em mở SỚM;
// hạn dài Y HỆT cũ; lõi bắt buộc luôn đủ; đáp án / hạn nộp / điểm / schema không đổi. CA SỐ THẬT của Boss: bài 113 câu, hạn 24/09 12:00, 12 câu/tối.
import { describe, expect, it } from 'vitest'
import { dungBoChoEm, nganSachVaSucChua } from '../server/src/btvn-nang-do-d1'
import { chonLoi, type BaiNangDo, type CauGiao } from '../src/lib/btvn-nang-do'

const vn = (s: string): number => new Date(`${s}+07:00`).getTime()
const HAN = vn('2026-09-24T12:00')
/** 28 dạng × 4 câu + 1 = 113 câu (như bài thật). */
const CAU: CauGiao[] = (() => {
  const ra: CauGiao[] = []
  for (let d = 0; d < 28; d++) ([0, 0, 1, 2] as const).forEach((m, k) => ra.push({ qid: `q${d}-${k}`, dang: `D${d}`, chuyenDe: `CD${d % 6}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: 'I' }))
  ra.push({ qid: 'q28-0', dang: 'D28', chuyenDe: 'CD1', mucDo: 0, sao: 1, phan: 'I' })
  return ra
})()
const LOI_DAY = chonLoi(CAU, []) // 34 câu lõi
const DV = { mauGiay: [], phutNgay: null, lichSu: [], soBaiChuaNop: 1 }
const HS = { hoSo: { dang: {}, cau: {} }, coHoSo: false, chuaKhacPhuc: 0, toiHan: 0 }
const bai = (loi: string[]): BaiNangDo => ({ cau: CAU, loi, ghim: [] })
const bo = (loi: string[], chot: string, han = HAN) => dungBoChoEm(bai(loi), 'HG', 'S1', vn(chot), han, DV, HS)
const tong = (loi: string[], chot: string, han = HAN) => bo(loi, chot, han).bo.tomTat.tong

describe('ngân sách hạn ngắn có TRẦN (bài 113 câu, hạn 24/09 12:00, 12/tối)', () => {
  const LOI_NHO = LOI_DAY.slice(0, 6)
  it('CA SỐ THẬT: mở 21/09 20:30 = 36 · mở 22/09 21:00 = 24 (bản cũ: 60) · mở 23/09 20:30 = 12 (bản cũ: 30) — mở muộn KHÔNG nhiều hơn mở sớm', () => {
    expect([tong(LOI_NHO, '2026-09-21T20:30'), tong(LOI_NHO, '2026-09-22T21:00'), tong(LOI_NHO, '2026-09-23T20:30')]).toEqual([36, 24, 12])
    const m = bo(LOI_NHO, '2026-09-22T21:00')
    expect(m.sc.cheDo).toBe('ngan')
    expect(m.nganSach.tongToiDa).toBe(24)
    expect(bo(LOI_NHO, '2026-09-23T20:30').nganSach.tongToiDa).toBe(12)
  })
  it('chặng VỪA ĐỦ, không vụn: 22/09 = 3 chặng × 8 câu; 23/09 = 2 chặng × 6 câu (không dùng hết số phiên)', () => {
    expect(bo(LOI_NHO, '2026-09-22T21:00').bo.chang.map((c) => c.length)).toEqual([8, 8, 8])
    expect(bo(LOI_NHO, '2026-09-23T20:30').bo.chang.map((c) => c.length)).toEqual([6, 6])
  })
  it('HẠN DÀI Y HỆT cũ: mở 20/09 09:00 = 4 ngày × 12 = 48, KHÔNG có trần; hạn 24/09 23:59 mở 22/09 21:00 cũng dài', () => {
    const m = bo(LOI_NHO, '2026-09-20T09:00')
    expect(m.sc.cheDo).toBe('dai')
    expect(m.nganSach).toEqual({ soNgay: 4, cauMoiNgay: 12, onLaiMoiNgay: 0 })
    expect(m.bo.tomTat.tong).toBe(48)
    expect(bo(LOI_NHO, '2026-09-21T20:30').nganSach).not.toHaveProperty('tongToiDa')
  })
  it('LÕI BẮT BUỘC luôn đủ: lõi 34 câu > trần ⇒ tổng = lõi (chỉ phần riêng + thử thách bị chặn), vẫn không vượt mức mở sớm; số chặng vừa đủ cho lõi', () => {
    expect([tong(LOI_DAY, '2026-09-21T20:30'), tong(LOI_DAY, '2026-09-22T21:00'), tong(LOI_DAY, '2026-09-23T20:30')]).toEqual([36, 34, 34])
    expect(bo(LOI_DAY, '2026-09-22T21:00').nganSach.soNgay).toBe(4) // ceil(max(trần 24, lõi 34) / 10 câu mỗi phiên); truyền số câu lõi nên không xếp hết 6 phiên
    expect(bo(LOI_DAY, '2026-09-22T21:00').bo.chang.length).toBe(4)
  })
  it('tính chất: quét mỗi 30 phút từ 20/09 đến hạn — tổng câu KHÔNG BAO GIỜ tăng khi mở muộn hơn (lõi nhỏ và lõi đầy đủ)', () => {
    for (const loi of [LOI_NHO, LOI_DAY]) {
      let truoc = Infinity
      for (let t = vn('2026-09-20T07:00'); t < HAN - 60_000; t += 30 * 60_000) {
        const iso = new Date(t + 7 * 3_600_000).toISOString().slice(0, 16)
        const n = tong(loi, iso)
        expect(n, `mở ${iso} (lõi ${loi.length})`).toBeLessThanOrEqual(truoc)
        truoc = n
      }
    }
  })
  it('nganSachVaSucChua có `soLoi` tuỳ chọn: bỏ trống ⇒ số ngày = số phiên như cũ (chỉ thêm trần); hạn dài không bị ảnh hưởng', () => {
    const a = nganSachVaSucChua('S1', vn('2026-09-22T21:00'), HAN, DV, HS)
    expect(a.nganSach.soNgay).toBe(a.sc.soPhien)
    expect(a.nganSach.tongToiDa).toBe(24)
    const b = nganSachVaSucChua('S1', vn('2026-09-20T09:00'), HAN, DV, HS, 999)
    expect(b.nganSach).toEqual({ soNgay: 4, cauMoiNgay: 12, onLaiMoiNgay: 0 })
  })
})
