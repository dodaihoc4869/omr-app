// Khung lời giải `public/loi-giai/khung.html` nhúng sẵn BO_CAC_CHUONG lúc dựng. Quên dựng lại sau khi thêm bộ chìa khoá
// ⇒ datBo() không thấy bộ, lùi về chìa khoá Ester ⇒ học sinh thấy SAI tên chìa khoá (lỗi 01/10: thiếu 13 bộ khối 10–11).
// Dựng lại: node scripts/loi-giai/dung-khung.mjs
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { BO_CHIA_KHOA } from '../src/lib/loi-giai-bo'
import { dungKhung } from '../scripts/loi-giai/dung-khung.mjs'

const GOC = path.resolve(__dirname, '..')
const KHUNG = fs.readFileSync(path.join(GOC, 'public/loi-giai/khung.html'), 'utf8')

type BoKhung = Record<string, { KEYS: Record<string, { ten: string; rule: string }> }>
function boTrongKhung(html: string): BoKhung {
  const m = html.match(/const BO_CAC_CHUONG = (\{.*\});\n/)
  if (!m) throw new Error('khung.html thiếu BO_CAC_CHUONG')
  return JSON.parse(m[1])
}

describe('khung lời giải chứa đủ bộ chìa khoá', () => {
  const bo = boTrongKhung(KHUNG)
  const ten = (b: { KEYS: Record<string, { ten: string }> }) => Object.values(b.KEYS).map((k) => k.ten)

  it('có bộ HYDROCARBON (khối 11) với đúng tên chìa khoá, không lùi về Ester', () => {
    expect(BO_CHIA_KHOA.HYDROCARBON).toBeTruthy()
    expect(bo.HYDROCARBON, 'khung thiếu HYDROCARBON ⇒ datBo lùi về Ester').toBeTruthy()
    expect(ten(bo.HYDROCARBON)).toEqual(ten(BO_CHIA_KHOA.HYDROCARBON))
  })

  it('mọi bộ trong loi-giai-bo.ts đều có trong khung.html, cùng chìa khoá', () => {
    expect(Object.keys(BO_CHIA_KHOA).filter((ma) => !bo[ma])).toEqual([])
    for (const ma of Object.keys(BO_CHIA_KHOA)) {
      const mong = Object.fromEntries(Object.entries(BO_CHIA_KHOA[ma].KEYS).map(([k, v]) => [k, { ten: v.ten, rule: v.rule }]))
      expect(bo[ma].KEYS, ma).toEqual(mong)
    }
  })

  it('khung.html đúng bằng bản dựng từ nguồn (quên chạy dung-khung.mjs thì đỏ)', () => {
    expect(KHUNG === dungKhung(), 'chạy lại: node scripts/loi-giai/dung-khung.mjs').toBe(true)
  })
})
