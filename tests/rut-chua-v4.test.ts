// ĐẶC TẢ v4 — bảng nghiệm thu mục 8, đo bằng test.
//
// Bốn thứ v4 đổi so với v3:
//   1. Nguồn là CẢ KHO, không phải phần đề đã tích cho ca.
//   2. KHÔNG còn trần cứng. Trần là `tongUngVien` — số câu PHÂN BIỆT trong kho
//      mang nhãn của những câu em sai.
//   3. Chia suất bằng vòng tròn CÓ SỨC CHỨA. Xem ghi chú ở khối vector: vector
//      đầu của đặc tả (kéo 30 -> [10,10,10]) không thể đúng về số học.
//   4. `CHO_BAC_2` mặc định false.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { rutDeChua } from '../src/lib/rut-de-chua'
import { CHO_BAC_2, SO_CAU_MAC_DINH } from '../src/lib/cau-hinh-chua'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

const A = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const B = 'ESTER.ESTER_HOA.TINH_HIEU_SUAT'
const C = 'ESTER.CAU_TAO.DEM_DONG_PHAN'
const NHANH_A2 = 'ESTER.THUY_PHAN_BASE.GOI_TEN' // cùng nhánh với A, khác việc

const cau = (id: string, ma: string) => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: 'A' as const,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu' as const,
  dang: { ma, ten: ma },
})

/** Dựng nhiều đề để chứng minh nguồn là CẢ KHO, không bó theo một đề. */
const khoNhieuDe = (nhom: ReturnType<typeof cau>[][]): TeacherExamSource[] =>
  nhom.map((cs, i) => ({ maDe: `D${i + 1}`, ngayNap: '2026-09-07', phanI: cs, phanII: [], phanIII: [] }) as unknown as TeacherExamSource)

const day = (ma: string, n: number, tien: string) => Array.from({ length: n }, (_, i) => cau(`${tien}${i + 1}`, ma))

const row = (soCau: number, qid: string, dung: boolean, muc = 'hieu'): ChiTietCauRow => ({
  phan: 'I',
  soCau,
  qid,
  chuyenDe: 'Ester – lipid',
  mucDo: muc,
  dapAnChon: 'B',
  dapAnDung: 'A',
  dungSai: dung,
  giay: 30,
})

/** Ba câu sai với pool đúng 60 · 25 · 5 — vector nghiệm thu của mục 8. */
function kho60_25_5() {
  return khoNhieuDe([
    [cau('s1', A), cau('s2', B), cau('s3', C)],
    day(A, 60, 'a'),
    [...day(B, 25, 'b'), ...day(C, 5, 'c')],
  ])
}
const ROWS3 = [row(1, 's1', false), row(2, 's2', false), row(3, 's3', false)]
const demTheoCauSai = (kq: { cau: { chuaCho?: { qid: string } }[] }) => {
  const d = new Map<string, number>()
  for (const c of kq.cau) d.set(c.chuaCho!.qid, (d.get(c.chuaCho!.qid) ?? 0) + 1)
  return d
}

describe('mục 8 — nguồn là CẢ KHO', () => {
  it('ca chỉ tích 1 đề, câu chữa vẫn lấy được từ cả 3 đề', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 90 })
    // Câu chữa nằm ở đề 2 và đề 3, trong khi câu sai nằm ở đề 1.
    expect(kq.cau.length).toBe(90)
    expect(kq.cau.every((c) => !['s1', 's2', 's3'].includes(c.id))).toBe(true)
  })

  it('không chỗ nào trong cổng lọc theo đề của ca', () => {
    const t = doc('src/lib/rut-de-chua.ts')
    expect(t).not.toContain('deTichCa')
    expect(t).not.toMatch(/maDeCa|loc.*theo.*đề của ca/i)
  })
})

describe('mục 8 — max thanh kéo', () => {
  it('pool [60,25,5] cho tongUngVien = 90', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 0 })
    expect(kq.tongUngVien).toBe(90)
    expect(kq.poolTheoCauSai.map((p) => p.pool)).toEqual([60, 25, 5])
  })

  it('ĐẾM PHÂN BIỆT: một câu khớp nhãn của hai câu sai chỉ đếm một lần', () => {
    // Hai câu sai CÙNG mã A ⇒ chung một pool 3 câu, không phải 6.
    const k = khoNhieuDe([[cau('s1', A), cau('s2', A)], day(A, 3, 'a')])
    const rows = [row(1, 's1', false), row(2, 's2', false)]
    const kq = rutDeChua({ khoDe: k, rows, soCau: 100 })
    expect(kq.tongUngVien).toBe(3)
    expect(kq.cau.length).toBe(3)
    expect(new Set(kq.cau.map((c) => c.id)).size).toBe(3)
  })

  it('kéo tới max thì trả ĐÚNG tongUngVien câu, không thiếu, không trùng', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 90 })
    expect(kq.cau.length).toBe(kq.tongUngVien)
    expect(new Set(kq.cau.map((c) => c.id)).size).toBe(90)
    expect(kq.cau.every((c) => c.chuaCho)).toBe(true)
  })

  it('xin quá max thì kẹp xuống max, không hứa nhiều hơn kho có', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 500 })
    expect(kq.cau.length).toBe(90)
  })

  it('bật bậc 2 thì max ĐỔI NGAY, vì pool rộng thêm', () => {
    const k = khoNhieuDe([[cau('s1', A)], day(A, 2, 'a'), day(NHANH_A2, 4, 'n')])
    const rows = [row(1, 's1', false)]
    expect(rutDeChua({ khoDe: k, rows, soCau: 0 }).tongUngVien).toBe(2)
    expect(rutDeChua({ khoDe: k, rows, soCau: 0, choBac2: true }).tongUngVien).toBe(6)
  })
})

describe('mục 8 — chia suất, ba vector của đặc tả', () => {
  // VECTOR ĐẦU CỦA ĐẶC TẢ KHÔNG THỂ ĐÚNG. v4 mục 4.3 ghi "pool [60,25,5], kéo
  // 30 ⇒ [10,10,10]" — nhưng câu sai thứ ba chỉ có 5 ứng viên trong kho, không
  // cách nào rút được 10 câu phân biệt từ đó. Luật "vòng tròn CÓ SỨC CHỨA" của
  // chính mục 4.3 cho [13,12,5]: ba câu sai chia đều tới khi câu thứ ba cạn ở 5,
  // phần dư 25 chia tiếp cho hai câu còn lại. Hai vector sau khớp đúng đặc tả.
  it.each([
    [30, [13, 12, 5]],
    [80, [50, 25, 5]],
    [90, [60, 25, 5]],
  ])('pool [60,25,5], kéo %i câu ⇒ %j', (xin, mong) => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: xin as number })
    const d = demTheoCauSai(kq)
    expect([d.get('s1'), d.get('s2'), d.get('s3')]).toEqual(mong)
    expect(kq.cau.length).toBe(xin)
  })

  it('câu hết chỗ tự rơi ra, phần dư dồn cho câu còn chỗ', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 40 })
    const d = demTheoCauSai(kq)
    expect(d.get('s3')).toBe(5) // pool 5, đã cạn
    expect((d.get('s1') ?? 0) + (d.get('s2') ?? 0)).toBe(35)
  })
})

describe('mục 8 — nhãn và luật dạng', () => {
  it('100% câu bậc 1 trùng ĐÚNG mã, 0 câu ngoài', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 90 })
    const maCua: Record<string, string> = { s1: A, s2: B, s3: C }
    for (const c of kq.cau) {
      expect(c.chuaCho!.bac).toBe(1)
      expect(c.chuaCho!.maDang).toBe(maCua[c.chuaCho!.qid])
    }
  })

  it('mọi nhãn trỏ đúng câu sai CÓ THẬT trong rows', () => {
    const kq = rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 20 })
    const sai = new Set(ROWS3.filter((r) => r.dungSai === false).map((r) => r.qid))
    for (const c of kq.cau) expect(sai.has(c.chuaCho!.qid)).toBe(true)
  })

  it('câu sai chưa gắn dạng: pool = 0, thieu[] nói rõ, KHÔNG đoán', () => {
    const chuaGan = { ...cau('s9', A), dang: null }
    const k = khoNhieuDe([[chuaGan as unknown as ReturnType<typeof cau>], day(A, 5, 'a')])
    const kq = rutDeChua({ khoDe: k, rows: [row(7, 's9', false)], soCau: 10 })
    expect(kq.cau).toHaveLength(0)
    expect(kq.tongUngVien).toBe(0)
    expect(kq.poolTheoCauSai[0].pool).toBe(0)
    expect(kq.thieu[0].vi).toContain('chưa gắn dạng')
  })

  it('kết quả TẤT ĐỊNH: 50 lần cùng đầu vào ra cùng một bộ câu', () => {
    const mot = () => rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 37 }).cau.map((c) => c.id).join(',')
    const dau = mot()
    for (let i = 0; i < 49; i++) expect(mot()).toBe(dau)
  })

  it('không gọi mạng lúc rút', () => {
    const cu = globalThis.fetch
    globalThis.fetch = (() => {
      throw new Error('cấm gọi mạng')
    }) as typeof fetch
    try {
      expect(rutDeChua({ khoDe: kho60_25_5(), rows: ROWS3, soCau: 30 }).cau.length).toBe(30)
    } finally {
      globalThis.fetch = cu
    }
  })
})

describe('mục 9 — cấm', () => {
  it('KHÔNG còn trần cứng trong cấu hình', () => {
    const t = doc('src/lib/cau-hinh-chua.ts')
    expect(t).not.toMatch(/export const TRAN_CAU_CHUA/)
    expect(t).not.toMatch(/export const SO_CAU_MOI_CAU_SAI/)
    expect(SO_CAU_MAC_DINH).toBe(10)
    expect(CHO_BAC_2).toBe(false)
  })

  it('không màn nào tự đặt trần cứng cho số câu chữa', () => {
    for (const f of ['src/components/NutBaiTapPdf.tsx', 'src/components/ThanhSoCauChua.tsx']) {
      const t = doc(f)
      expect(t).not.toMatch(/soCau\s*[<>]=?\s*\d+/)
    }
  })

  it('không component nào gọi thẳng chonCauLuyen', () => {
    for (const f of ['src/components/NutBaiTapPdf.tsx', 'src/components/ThanhSoCauChua.tsx']) {
      expect(doc(f)).not.toContain('chonCauLuyen')
    }
  })
})
