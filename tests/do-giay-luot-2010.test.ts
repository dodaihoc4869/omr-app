// Đo giây từng lượt (20/10): máy chủ chỉ làm sạch, không ước. Kiểm ranh giới và việc ghép `raw.doc`.
import { describe, expect, it } from 'vitest'
import { boSungKichThuocDe, docDoGiayMot, docDoGiayNhieu, ghepDocVaoRaw, lamSachDo, phanSoCuaDo } from '../server/src/do-giay-luot'

describe('lamSachDo', () => {
  it('nhận cụm hợp lệ và làm tròn', () => {
    expect(lamSachDo({ g: 14.4, t: 46, h: 0, p: 'I' })).toEqual({ giay: 14, tu: 46, hinh: 0, phan: 'I' })
  })
  it('giây < 1 hoặc > 900 bị bỏ (đồng hồ hỏng không thành Mức làm 1 oan), số từ vẫn giữ', () => {
    expect(lamSachDo({ g: 0, t: 30 })).toEqual({ giay: null, tu: 30, hinh: null, phan: null })
    expect(lamSachDo({ g: 0.4, t: 30 })?.giay).toBeNull()
    expect(lamSachDo({ g: 901, t: 30 })?.giay).toBeNull()
    expect(lamSachDo({ g: 900, t: 30 })?.giay).toBe(900)
  })
  it('sai khuôn / không có gì hợp lệ ⇒ null', () => {
    expect(lamSachDo(null)).toBeNull()
    expect(lamSachDo([])).toBeNull()
    expect(lamSachDo('x')).toBeNull()
    expect(lamSachDo({ g: 'abc', t: NaN })).toBeNull()
    expect(lamSachDo({ g: 0 })).toBeNull()
  })
  it('phần lạ và số từ ngoài khoảng bị bỏ', () => {
    expect(lamSachDo({ g: 10, t: 99999, p: 'IV' })).toEqual({ giay: 10, tu: null, hinh: null, phan: null })
    expect(lamSachDo({ g: 10, t: -1 })?.tu).toBeNull()
  })
  it('cờ hình nhận 0/1/true/false', () => {
    expect(lamSachDo({ g: 5, h: true })?.hinh).toBe(1)
    expect(lamSachDo({ g: 5, h: false })?.hinh).toBe(0)
    expect(lamSachDo({ g: 5, h: 'x' })?.hinh).toBeNull()
  })
})

describe('docDoGiayMot / docDoGiayNhieu', () => {
  it('một câu', () => {
    expect(docDoGiayMot({ qid: 'a', doGiay: { g: 22, t: 40, h: 1, p: 'III' } })).toEqual({ giay: 22, tu: 40, hinh: 1, phan: 'III' })
    expect(docDoGiayMot({ qid: 'a' })).toBeNull()
    expect(docDoGiayMot(undefined)).toBeNull()
  })
  it('nhiều câu theo qid, bỏ câu hỏng, tối đa 200', () => {
    const m = docDoGiayNhieu({ doGiay: { q1: { g: 9, t: 20 }, q2: { g: 0 }, q3: 'x', q4: { g: 30, t: 50, p: 'II' } } })
    expect([...m.keys()]).toEqual(['q1', 'q4'])
    const to: Record<string, unknown> = {}
    for (let i = 0; i < 300; i++) to[`q${i}`] = { g: 5 }
    expect(docDoGiayNhieu({ doGiay: to }).size).toBe(200)
    expect(docDoGiayNhieu({}).size).toBe(0)
  })
})

describe('ghép vào sổ', () => {
  it('raw.doc thêm vào, không đụng khoá khác', () => {
    expect(ghepDocVaoRaw({ ms: 9000, td: 'luot' }, { giay: 9, tu: 46, hinh: 0, phan: 'I' })).toEqual({ ms: 9000, td: 'luot', doc: { t: 46, h: 0, p: 'I' } })
    expect(ghepDocVaoRaw(undefined, { giay: 9, tu: 46, hinh: null, phan: null })).toEqual({ doc: { t: 46 } })
  })
  it('không có số từ ⇒ raw nguyên', () => {
    expect(ghepDocVaoRaw({ a: 1 }, { giay: 9, tu: null, hinh: null, phan: null })).toEqual({ a: 1 })
    expect(ghepDocVaoRaw(undefined, null)).toBeUndefined()
  })
  it('phanSoCuaDo chỉ trả trường có giá trị', () => {
    expect(phanSoCuaDo(null)).toEqual({})
    expect(phanSoCuaDo(null, { x: 1 })).toEqual({ raw: { x: 1 } })
    expect(phanSoCuaDo({ giay: null, tu: 12, hinh: 1, phan: null })).toEqual({ raw: { doc: { t: 12, h: 1 } } })
    expect(phanSoCuaDo({ giay: 7, tu: null, hinh: null, phan: null })).toEqual({ giay: 7 })
  })
})

describe('boSungKichThuocDe', () => {
  const d = { giay: 14, tu: null, hinh: null, phan: null } as const
  it('đo từ chính câu, bỏ số máy em khai', () => {
    const r = boSungKichThuocDe({ giay: 14, tu: 9999, hinh: 1, phan: 'III' }, 'I', { text: 'Đề một hai ba', choices: ['a b', 'c d', 'e f', 'g h'] })
    expect(r).toEqual({ giay: 14, tu: 4 + 8, hinh: 0, phan: 'I' })
  })
  it('không có giây thì trả nguyên; phần lạ thì trả nguyên', () => {
    expect(boSungKichThuocDe({ giay: null, tu: 5, hinh: null, phan: null }, 'I', { text: 'x' })).toEqual({ giay: null, tu: 5, hinh: null, phan: null })
    expect(boSungKichThuocDe(d, 'IV', { text: 'x' })).toEqual(d)
    expect(boSungKichThuocDe(null, 'I', {})).toBeNull()
  })
  it('câu khuôn lạ làm hàm đếm ném lỗi thì KHÔNG ném ra ngoài (không được làm mất dòng sổ), chỉ bỏ kích thước đề', () => {
    const doi = { get text(): string { throw new Error('khuôn lạ') } }
    expect(() => boSungKichThuocDe(d, 'I', doi)).not.toThrow()
    expect(boSungKichThuocDe(d, 'I', doi)).toEqual(d)
  })
})
