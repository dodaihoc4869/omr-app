// TÁCH MÃ ĐỀ THÀNH BA MÃ THEO PHẦN.
//
// Luật sống còn của tính năng này: `id` từng câu KHÔNG ĐƯỢC ĐỔI. Mọi thứ khác
// trong app tra câu bằng id — chấm bài, bảng chi tiết từng câu, `locNguonTheoId`
// lúc mở ca, `qidDaRaTuCacCa` để tránh phát lại câu tuần trước. Đổi id là hỏng
// hết mà không có lỗi nào bắn ra.
import { describe, expect, it } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'
import { goMaDeTachRa, maDeTheoPhan, tachNhieuTheoPhan, tachTheoPhan } from '../src/lib/tach-phan-de'

const de = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  nhom: '12 · CI - Ester lipid',
  nguon: 'Bài 1',
  ngayNap: '2026-09-04T09:30:00+07:00',
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `I${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i + 1}`, text: `II${i}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i + 1}`, text: `III${i}`, correct: '1' })) as never,
})

describe('tachTheoPhan', () => {
  it('một mã ra ba mã, mỗi mã chỉ giữ đúng phần của mình', () => {
    const ra = tachTheoPhan(de('12-C1-B2', 51, 19, 23))
    expect(ra.map((s) => s.maDe)).toEqual(['12-C1-B2-TN', '12-C1-B2-DS', '12-C1-B2-TLN'])
    expect(ra[0].phanI).toHaveLength(51)
    expect(ra[0].phanII).toHaveLength(0)
    expect(ra[0].phanIII).toHaveLength(0)
    expect(ra[1].phanII).toHaveLength(19)
    expect(ra[2].phanIII).toHaveLength(23)
  })

  it('GIỮ NGUYÊN id từng câu — đây là điều kiện để chấm bài và lịch sử ca không hỏng', () => {
    const goc = de('11-C1-B2', 3, 2, 1)
    const ra = tachTheoPhan(goc)
    expect(ra[0].phanI.map((q) => q.id)).toEqual(goc.phanI.map((q) => q.id))
    expect(ra[1].phanII.map((q) => q.id)).toEqual(goc.phanII.map((q) => q.id))
    expect(ra[2].phanIII.map((q) => q.id)).toEqual(goc.phanIII.map((q) => q.id))
  })

  it('giữ nhóm, nguồn, ngày nạp để màn Mở ca vẫn lọc và sắp xếp được', () => {
    const ra = tachTheoPhan(de('10-C1-B1', 1, 1, 1))
    for (const s of ra) {
      expect(s.nhom).toBe('12 · CI - Ester lipid')
      expect(s.nguon).toBe('Bài 1')
      expect(s.ngayNap).toBe('2026-09-04T09:30:00+07:00')
    }
  })

  it('phần rỗng thì KHÔNG sinh mã — thầy không phải nhìn dòng "0 câu" rồi tích nhầm', () => {
    expect(tachTheoPhan(de('X', 5, 0, 0)).map((s) => s.maDe)).toEqual(['X-TN'])
    expect(tachTheoPhan(de('Y', 0, 0, 0))).toEqual([])
  })

  it('tổng số câu sau khi tách bằng đúng tổng trước khi tách', () => {
    const goc = [de('A', 90, 26, 31), de('B', 51, 19, 23)]
    const dem = (ds: TeacherExamSource[]) => ds.reduce((n, s) => n + s.phanI.length + s.phanII.length + s.phanIII.length, 0)
    expect(dem(tachNhieuTheoPhan(goc))).toBe(dem(goc))
  })

  it('không có câu nào lọt ra hai mã — mỗi id xuất hiện đúng một lần', () => {
    const ra = tachNhieuTheoPhan([de('A', 4, 3, 2)])
    const ids = ra.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(9)
  })
})

describe('goMaDeTachRa', () => {
  it('suy ngược được mã gốc và phần', () => {
    expect(goMaDeTachRa('12-C1-B2-TN')).toEqual({ goc: '12-C1-B2', phan: 'I' })
    expect(goMaDeTachRa('12-C1-B2-DS')).toEqual({ goc: '12-C1-B2', phan: 'II' })
    expect(goMaDeTachRa('12-C1-B2-TLN')).toEqual({ goc: '12-C1-B2', phan: 'III' })
  })

  it('mã cũ chưa tách thì trả nguyên mã, phần = null — ca mở trước tính năng này vẫn đọc được', () => {
    expect(goMaDeTachRa('12-C1-B1')).toEqual({ goc: '12-C1-B1', phan: null })
    expect(goMaDeTachRa('100')).toEqual({ goc: '100', phan: null })
  })

  it('đi vòng: tách rồi gỡ ra đúng mã gốc', () => {
    for (const p of ['I', 'II', 'III'] as const) {
      expect(goMaDeTachRa(maDeTheoPhan('10-C1-B3', p))).toEqual({ goc: '10-C1-B3', phan: p })
    }
  })
})
