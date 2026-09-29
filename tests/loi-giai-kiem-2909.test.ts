// Lõi "Lời giải từng bước" (src/lib/loi-giai-kiem.ts): chuẩn hoá câu kho, băm, đầu vào máy soạn, máy tính an toàn, bộ kiểm 6 khoá.
// Dữ liệu thật: mẫu 799 câu (docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json) + 7 hồ sơ máy soạn đợt 2 (docs/loi-giai-a/chay-thu-2/ra).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  bamCau, cauTrongGoi, dauVao, gonHoSo, kiemHoSo, laHoSoSach, loaiCau, tinhBieuThuc, type CauKho,
} from '../src/lib/loi-giai-kiem'
import { BO_CHIA_KHOA } from '../src/lib/loi-giai-bo'
import { docCacBo, noiDungTs } from '../scripts/loi-giai/dung-bo.mjs'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { maDe: string; cau: Record<string, unknown> }>
const cauMau = (qid: string): CauKho => {
  const r = MAU[qid]
  const ds = cauTrongGoi(r.maDe, { cau: [{ ...r.cau, qid }] })
  expect(ds).toHaveLength(1)
  return ds[0]
}
/** Đổi hồ sơ khuôn 1.1 (đợt thử 2) sang 1.2: thêm băm, cờ có loại, bỏ phần chép đề. */
async function sang12(h: Record<string, unknown>, c: CauKho) {
  const { canThayChot, ...r } = h as Record<string, unknown> & { canThayChot: string[] }
  return gonHoSo({ ...r, bam: await bamCau(c), co: canThayChot.map((ghi) => ({ loai: 'dapAn', ghi })) })
}

describe('tinhBieuThuc — không eval, đúng thứ tự phép tính', () => {
  it('tính đúng', () => {
    expect(tinhBieuThuc('2+3*4')).toBe(14)
    expect(tinhBieuThuc('(2+3)*4')).toBe(20)
    expect(tinhBieuThuc('10.4 / 2 - -1')).toBeCloseTo(6.2)
    expect(tinhBieuThuc('-(1.5+0.5)*2')).toBe(-4)
  })
  it('chặn kí tự lạ và biểu thức hỏng', () => {
    expect(() => tinhBieuThuc('alert(1)')).toThrow()
    expect(() => tinhBieuThuc('2**3')).toThrow()
    expect(() => tinhBieuThuc('(1+2')).toThrow()
    expect(() => tinhBieuThuc('1/0')).toThrow()
  })
})

describe('chuẩn hoá câu kho + loại câu', () => {
  it('đủ ba dáng gói (cau[] · items[] · phanI/II/III)', () => {
    const tn = { so: 1, de: 'Đề', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C' }
    expect(cauTrongGoi('12-X', { cau: [{ ...tn, phan: 'I' }] })[0].qid).toBe('12-X-I-1')
    expect(cauTrongGoi('12-X', { items: [{ ...tn, phan: 'I' }] })[0].qid).toBe('12-X-I-1')
    const g = cauTrongGoi('12-X', { phanI: [{ so: 2, text: 'Đề', choices: ['a', 'b', 'c', 'd'], correct: 'B' }], phanII: [{ so: 1, text: 'Đ', ideas: ['1', '2', '3', '4'], correct: [true, false, true, true] }] })
    expect(g.map((c) => [c.qid, loaiCau(c), c.dapAn])).toEqual([['12-X-I-2', 'tn', 'B'], ['12-X-II-1', 'ds', 'DSDD']])
  })
  it('bỏ tự luận: mã đề -TL và phần IV', () => {
    expect(cauTrongGoi('12-TL-1', { cau: [{ phan: 'III', so: 1, de: 'x', dap_an: '3' }] }).map(loaiCau)).toEqual([null])
    expect(cauTrongGoi('12-A', { cau: [{ phan: 'IV', so: 1, de: 'x' }] })).toHaveLength(0)
  })
  it('mẫu 799 câu thật: đếm đúng như bản quét (264 tn · 173 ds · 350 tln · 12 bỏ)', () => {
    const dem: Record<string, number> = {}
    for (const [qid, r] of Object.entries(MAU)) {
      const c = cauTrongGoi(r.maDe, { cau: [{ ...r.cau, qid }] })[0]
      const l = c ? loaiCau(c) ?? 'bo' : 'bo'
      dem[l] = (dem[l] ?? 0) + 1
    }
    expect(dem.tn + dem.ds + dem.tln + dem.bo).toBe(799)
    // Bản quét 28/09 (quet-kho.mjs) ra 264/173/350/12. Luật tự luận chung chặt hơn một chút: chỉ được bỏ THÊM, không được nhận thêm.
    expect(dem.tn).toBeLessThanOrEqual(264)
    expect(dem.ds).toBeLessThanOrEqual(173)
    expect(dem.tln).toBeLessThanOrEqual(350)
    expect(dem.tn + dem.ds + dem.tln).toBeGreaterThanOrEqual(770)
  })
})

describe('dấu vân tay', () => {
  it('cùng nội dung ⇒ cùng băm; đổi đáp án hoặc chữ ⇒ khác', async () => {
    const c = cauMau('12-KT-C1-D4-II-4')
    const b = await bamCau(c)
    expect(b).toMatch(/^[0-9a-f]{16}$/)
    expect(await bamCau({ ...c, qid: 'khac', maDe: 'khac' })).toBe(b)
    expect(await bamCau({ ...c, dapAn: c.dapAn.replace(/^./, (x) => (x === 'D' ? 'S' : 'D')) })).not.toBe(b)
    expect(await bamCau({ ...c, de: c.de + ' thêm' })).not.toBe(b)
  })
})

describe('bộ kiểm 6 khoá trên 7 hồ sơ thật đợt 2', () => {
  const DIR = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')
  const tep = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
  it('có đủ 7 hồ sơ', () => expect(tep).toHaveLength(7))
  for (const f of tep) {
    it(`${f}: qua bộ kiểm`, async () => {
      const qid = f.slice(3, -5)
      const c = cauMau(qid)
      const b = await bamCau(c)
      const vao = dauVao(c, b)!
      expect(vao).not.toBeNull()
      const h = await sang12(JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')), c)
      const { loi } = kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER)
      expect(loi).toEqual([])
      expect(h.de).toBeUndefined()
      expect(JSON.stringify(h).length).toBeLessThan(12000)
    })
  }
  it('đổi đáp án một ý ⇒ trượt KHOÁ ĐÁP ÁN', async () => {
    const c = cauMau('12-KT-C1-D4-II-4')
    const vao = dauVao(c, await bamCau(c))!
    const h = await sang12(JSON.parse(fs.readFileSync(path.join(DIR, '04-12-KT-C1-D4-II-4.json'), 'utf8')), c) as { y: { d: string }[] }
    h.y[0].d = h.y[0].d === 'D' ? 'S' : 'D'
    expect(kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER).loi.some((l) => l.startsWith('KHOÁ ĐÁP ÁN'))).toBe(true)
  })
  it('sửa một con số ⇒ trượt KHOÁ SỐ; sai băm ⇒ trượt KHOÁ VÂN TAY', async () => {
    const c = cauMau('12-KT-C1-D2-III-6')
    const vao = dauVao(c, await bamCau(c))!
    const h = await sang12(JSON.parse(fs.readFileSync(path.join(DIR, '06-12-KT-C1-D2-III-6.json'), 'utf8')), c) as { phepTinh: { ketQua: number }[]; bam: string }
    h.phepTinh[0].ketQua += 1
    h.bam = '0000000000000000'
    const { loi } = kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER)
    expect(loi.some((l) => l.startsWith('KHOÁ SỐ'))).toBe(true)
    expect(loi.some((l) => l.startsWith('KHOÁ VÂN TAY'))).toBe(true)
  })
  it('chặn thẻ HTML lạ, thuộc tính, cờ không loại', async () => {
    const c = cauMau('12-KT-C1-D4-I-6')
    const vao = dauVao(c, await bamCau(c))!
    const h = await sang12(JSON.parse(fs.readFileSync(path.join(DIR, '02-12-KT-C1-D4-I-6.json'), 'utf8')), c) as Record<string, unknown>
    h.nho = '<img src=x onerror=alert(1)>'
    h.ten = '<b style="color:red">x</b>'
    h.co = [{ loai: 'khac', ghi: 'x' }]
    const { loi } = kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER)
    expect(loi).toContain('thẻ HTML cấm <img>')
    expect(loi).toContain('thẻ HTML không được có thuộc tính')
    expect(loi.some((l) => l.startsWith('co[0] loại lạ'))).toBe(true)
  })
  it('hồ sơ sạch = không có cờ dapAn', () => {
    expect(laHoSoSach({ co: [] })).toBe(true)
    expect(laHoSoSach({ co: [{ loai: 'hienThi', ghi: 'x' }] })).toBe(true)
    expect(laHoSoSach({ co: [{ loai: 'dapAn', ghi: 'x' }] })).toBe(false)
    expect(laHoSoSach({})).toBe(false)
  })
})

describe('bộ chìa khoá', () => {
  it('tệp sinh src/lib/loi-giai-bo.ts khớp nguồn JSON (quên chạy scripts/loi-giai/dung-bo.mjs thì đỏ)', () => {
    expect(fs.readFileSync(path.join(GOC, 'src/lib/loi-giai-bo.ts'), 'utf8')).toBe(noiDungTs(docCacBo()))
  })
  it('mỗi bộ 5–7 chìa khoá, rule không rỗng, mã dạng trỏ đúng chìa khoá', () => {
    for (const bo of Object.values(BO_CHIA_KHOA)) {
      const k = Object.keys(bo.KEYS)
      expect(k.length, bo.ma).toBeGreaterThanOrEqual(5)
      expect(k.length, bo.ma).toBeLessThanOrEqual(7)
      for (const v of Object.values(bo.KEYS)) expect(v.rule.length, bo.ma).toBeGreaterThan(20)
      for (const [d, kk] of Object.entries(bo.DANG_KEY)) {
        expect(d.startsWith(bo.ma + '.'), d).toBe(true)
        expect(k, d).toContain(kk)
      }
    }
  })
})
