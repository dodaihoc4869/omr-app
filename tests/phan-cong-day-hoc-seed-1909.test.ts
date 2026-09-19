// PHÂN CÔNG DẠY HỌC TẤT ĐỊNH — SEED THEO MÃ CA (GĐ 6, 19/09/2026).
//
// Trước đây `phanCongDayHoc` bốc thăm bằng `Math.random`: bấm hai lần ra hai bảng khác nhau, và không thể
// dựng lại bảng thầy đã cầm hôm qua. Nay nhận seed (số hoặc chuỗi, qua `hashSeed`/`mulberry32` của
// `exam-shuffle.ts` — cùng bộ máy đã dùng để xáo đề theo ca) và MẶC ĐỊNH cũng tất định.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { phanCongDayHoc } from '../src/lib/phan-cong-day-hoc'
import { hashSeed, mulberry32, seededPermutation } from '../src/lib/exam-shuffle'
import type { CauChua, EmGoi } from '../src/lib/phan-cong'

const cau = (n: number): CauChua[] =>
  Array.from({ length: n }, (_, i) => ({ id: `Q${i}`, phan: 'I', so: i + 1, chuyenDe: 'Ester', mucDo: 'hieu', tomTat: '', viTri: i, sao: 1, lyDoSao: '' }))
/** Em NGANG HỆT nhau (cùng số lượt, cùng chuyên đề) ⇒ mọi câu đều rơi vào chỗ phải BỐC THĂM. */
const emNgang = (n: number): EmGoi[] =>
  Array.from({ length: n }, (_, i) => ({ sbd: `12${String(i).padStart(3, '0')}`, hoTen: `Em ${i}`, coMat: true, soLanLenBang: 0, chuyenDe: [{ ten: 'Ester', soCau: 10, soSai: 3 }], daGoiTheoCd: {}, daGoiCau: [] }))

const ai = (r: ReturnType<typeof phanCongDayHoc>) => r.phanCong.map((p) => `${p.cau.id}→${p.sbd}`)

afterEach(() => vi.restoreAllMocks())

describe('phanCongDayHoc nhận seed', () => {
  it('cùng seed, cùng đầu vào ⇒ CÙNG bảng (chuỗi và số đều được)', () => {
    for (const seed of ['CA-111111', hashSeed('CA-111111'), 42]) {
      expect(ai(phanCongDayHoc(cau(20), emNgang(30), seed))).toEqual(ai(phanCongDayHoc(cau(20), emNgang(30), seed)))
    }
  })

  it('chuỗi seed và `hashSeed(chuỗi)` là MỘT — bảng dựng lại được từ mã ca', () => {
    expect(ai(phanCongDayHoc(cau(20), emNgang(30), 'CA-111111'))).toEqual(ai(phanCongDayHoc(cau(20), emNgang(30), hashSeed('CA-111111'))))
  })

  it('khác seed ⇒ bảng KHÁC (bốc thăm thật sự phụ thuộc seed, không phải bảng cố định)', () => {
    const a = ai(phanCongDayHoc(cau(20), emNgang(30), 'CA-111111'))
    const b = ai(phanCongDayHoc(cau(20), emNgang(30), 'CA-222222'))
    const c = ai(phanCongDayHoc(cau(20), emNgang(30), 'CA-333333'))
    expect(new Set([a.join(), b.join(), c.join()]).size).toBeGreaterThan(1)
  })

  it('KHÔNG gọi Math.random — kể cả khi không truyền seed', () => {
    const rnd = vi.spyOn(Math, 'random')
    phanCongDayHoc(cau(20), emNgang(30))
    phanCongDayHoc(cau(20), emNgang(30), 'CA-111111')
    phanCongDayHoc(cau(20), emNgang(30), 7)
    expect(rnd).not.toHaveBeenCalled()
  })

  it('KHÔNG truyền seed ⇒ vẫn tất định (hai lần liền ra cùng bảng)', () => {
    expect(ai(phanCongDayHoc(cau(20), emNgang(30)))).toEqual(ai(phanCongDayHoc(cau(20), emNgang(30))))
  })

  it('vẫn nhận HÀM ngẫu nhiên như cũ (test truyền tay)', () => {
    const dau = phanCongDayHoc(cau(4), emNgang(6), () => 0).phanCong[0].sbd
    const cuoi = phanCongDayHoc(cau(4), emNgang(6), () => 0.99).phanCong[0].sbd
    expect(dau).not.toBe(cuoi)
  })

  it('với MỌI seed, ba nguyên tắc bất biến vẫn giữ: không trùng em trong cặp, cân lượt, bỏ em vắng', () => {
    for (const seed of ['a', 'b', 'c', 1, 2, 3, hashSeed('CA-9')]) {
      const es = emNgang(31).map((e, i) => (i === 5 ? { ...e, coMat: false } : e))
      const r = phanCongDayHoc(cau(30), es, seed)
      expect(r.phanCong.every((p) => p.sbd !== es[5].sbd)).toBe(true)
      for (let i = 0; i + 1 < r.phanCong.length; i += 2) expect(r.phanCong[i].sbd).not.toBe(r.phanCong[i + 1].sbd)
      const dem = new Map<string, number>()
      for (const p of r.phanCong) dem.set(p.sbd, (dem.get(p.sbd) ?? 0) + 1)
      // 30 câu / 30 em có mặt (em thứ 6 vắng) ⇒ mỗi em đúng 1 câu.
      expect(Math.max(...dem.values()) - Math.min(...dem.values())).toBeLessThanOrEqual(1)
    }
  })
})

describe('`exam-shuffle.ts` không đổi hành vi (mọi seed của mọi ca thi đi qua tệp này)', () => {
  it('hashSeed và seededPermutation cho đúng những giá trị đã khoá', () => {
    expect(hashSeed('CA-111111:12001')).toBe(HASH_MAU)
    expect(seededPermutation(10, 12345)).toEqual(HOAN_VI_MAU)
  })

  it('mulberry32 cùng seed cùng dãy, nằm trong [0,1)', () => {
    const a = mulberry32(99)
    const b = mulberry32(99)
    for (let i = 0; i < 50; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('Nối vào màn Gọi lên bảng', () => {
  const MAN = readFileSync(join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')
  const LIB = readFileSync(join(process.cwd(), 'src/lib/phan-cong-day-hoc.ts'), 'utf8')

  it('thư viện không còn dùng Math.random', () => {
    expect(LIB.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')).not.toContain('Math.random')
  })

  it('màn truyền seed theo MÃ CA cho phanCongDayHoc', () => {
    expect(MAN).toContain("hashSeed(`day-hoc:${du?.maCa ?? ''}`)")
    expect(MAN).toMatch(/phanCongDayHoc\(dsCau, [\s\S]*?, hashSeed\(`day-hoc:\$\{du\?\.maCa \?\? ''\}`\)\)/)
  })
})

// Đo bằng bản `exam-shuffle.ts` CHƯA sửa (trước khi thêm chữ `export`) — 19/09/2026.
const HASH_MAU = 2709744386
const HOAN_VI_MAU = [6, 4, 8, 0, 1, 7, 5, 3, 2, 9]
