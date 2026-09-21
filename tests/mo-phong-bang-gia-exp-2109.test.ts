// KHOÁ LÝ DO CỦA BẢNG GIÁ EXP HỌC TẬP MỚI (Điều 10, Code 1, 21/09/2026): em ĐẠT mọi ngày thì bảng MỚI đưa CẢ BA kiểu em (đúng 50 / 70 / 90 %) tới cấp 10 ĐÚNG ngày 21; bảng CŨ thì em 50 % chậm ~5–6 ngày.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { BU_DAT_NGAY, HAP_THU_DAT } from '../src/lib/hap-thu-ngay'
import { BANG_GIA_CU, BANG_GIA_MOI, KIEU_EM, coChangDungNhip, expMotNgay, ngayToiCap, thuongChuoi, type KieuEm } from '../src/lib/mo-phong-bang-gia-exp'
import { tongExpToiCap } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

const tbTuan = (k: KieuEm, b: typeof BANG_GIA_MOI) => [31, 32, 33, 34, 35, 36, 37].reduce((s, d) => s + expMotNgay(k, b, d), 0) / 7

describe('bảng giá EXP học tập: cũ → mới (Điều 10)', () => {
  it('giá trị khoá: đạt ngày 20 → 80 · chặng đúng nhịp 10 → 20 · câu đúng đầu ngày 0 → 10; bù chuyển đổi = 60 = 80 − 20', () => {
    expect(BANG_GIA_CU).toMatchObject({ datNgay: 20, loDungNhip: 10, dauNgay: 0 })
    expect(BANG_GIA_MOI).toMatchObject({ datNgay: 80, loDungNhip: 20, dauNgay: 10 })
    expect(BU_DAT_NGAY).toBe(BANG_GIA_MOI.datNgay - BANG_GIA_CU.datNgay)
  })
  it('thưởng chuỗi 2 × min(chuỗi, 10); chặng đúng nhịp 5 trong 7 ngày', () => {
    expect([0, 1, 5, 10, 11, 100].map(thuongChuoi)).toEqual([0, 2, 10, 20, 20, 20])
    expect(Array.from({ length: 14 }, (_, i) => coChangDungNhip(i + 1)).filter(Boolean)).toHaveLength(10)
    expect(Array.from({ length: 7 }, (_, i) => coChangDungNhip(i + 1))).toEqual([true, true, true, true, true, false, false])
  })
  it('kiếm/ngày ổn định khớp số của Boss (làm tròn): CŨ 165 · 203 · 234 (±3), MỚI 242 · 280 · 311 (±8, mô hình game 140 kẹp 120)', () => {
    const cu = [165, 203, 234], moi = [242, 280, 311]
    KIEU_EM.forEach((k, i) => {
      expect(Math.abs(tbTuan(k, BANG_GIA_CU) - cu[i]!), k.ten).toBeLessThanOrEqual(4)
      expect(Math.abs(tbTuan(k, BANG_GIA_MOI) - moi[i]!), k.ten).toBeLessThanOrEqual(8)
    })
  })
  it('BẢNG MỚI: cả ba kiểu em tới cấp 10 ĐÚNG ngày 21 (4 200 / 200) và MỖI ngày kiếm ≥ 200 EXP (chăm là đủ, kể cả ngày đầu); không kiểu em nào tới cấp 10 sớm hơn ngày 21', () => {
    expect(tongExpToiCap(10)).toBe(4200)
    for (const k of KIEU_EM) {
      expect(ngayToiCap(k, BANG_GIA_MOI), k.ten).toBe(21)
      for (let d = 1; d <= 40; d++) expect(expMotNgay(k, BANG_GIA_MOI, d), `${k.ten} ngày ${d}`).toBeGreaterThanOrEqual(HAP_THU_DAT)
    }
    // dù kiếm rất nhiều, không sớm hơn 21
    const giau: KieuEm = { ten: 'giàu', game: 999, cau: 500, lenBac: 200, khacPhuc: 200 }
    expect(ngayToiCap(giau, BANG_GIA_MOI)).toBe(21)
  })
  it('BẢNG CŨ (lý do phải đổi): em yếu mà chăm chậm hơn 5–7 ngày (ngày 26–28), em trung bình chậm 1–2 ngày, em giỏi đúng ngày 21; em yếu KHÔNG ngày nào đủ 200', () => {
    const [yeu, tb, gioi] = KIEU_EM as [KieuEm, KieuEm, KieuEm]
    const nYeu = ngayToiCap(yeu, BANG_GIA_CU)
    expect(nYeu).toBeGreaterThanOrEqual(26)
    expect(nYeu).toBeLessThanOrEqual(28)
    expect(ngayToiCap(tb, BANG_GIA_CU)).toBeGreaterThanOrEqual(21)
    expect(ngayToiCap(tb, BANG_GIA_CU)).toBeLessThanOrEqual(23)
    expect(ngayToiCap(gioi, BANG_GIA_CU)).toBe(21)
    for (let d = 1; d <= 60; d++) expect(expMotNgay(yeu, BANG_GIA_CU, d), `ngày ${d}`).toBeLessThan(HAP_THU_DAT)
    expect(nYeu).toBeGreaterThan(ngayToiCap(yeu, BANG_GIA_MOI) + 4)
  })
  it('lệnh `npm run mo-phong:bang-gia-exp` chạy được, in bảng và thoát 0 khi bảng mới đúng bất biến', () => {
    const ra = execFileSync(process.execPath, ['scripts/mo-phong-bang-gia-exp.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
    expect(ra).toContain('Yếu mà chăm')
    expect(ra).toContain('ĐẠT')
    expect(ra.split('\n').filter((l) => l.includes('ngày 21')).length).toBeGreaterThanOrEqual(4)
  })
})
