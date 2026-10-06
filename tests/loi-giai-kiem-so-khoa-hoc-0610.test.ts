// Khoá số của bộ kiểm hồ sơ với ĐÁP SỐ DẠNG a.10ⁿ (thầy 06/10 "tự làm luôn hết"; sổ việc OMNI 3 mục (4)).
// Gốc lỗi: ba câu `DH-10-C1-B2-III-23`, `DH-10-C1-B2-III-24`, `DB-11-B2-D6-III-3` (đáp số "1,1.10²³", "1,3.10²³", "1,3.10⁻³") bị khoá số từ chối mãi:
//   (1) `soTuChu("1,1.10²³")` = Number("1.1.10²³") = NaN ⇒ phép tính cuối không bao giờ "bằng đáp số";
//   (2) `tinhBieuThuc` không nhận số khoa học ⇒ máy không viết được `0.2*6.02e23` ⇒ chỉ ghi phần a;
//   (3) sai số tuyệt đối ± 0,5·10^−d không thể thoả với số cỡ 10²³.
// Dữ liệu thật: câu `12-KT-C1-D2-III-6` + hồ sơ đợt thử 2 (đã qua bộ kiểm) — chỉ đổi đáp số sang dạng khoa học.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { bamCau, cauTrongGoi, dauVao, gonHoSo, kiemHoSo, saiSoLamTron, soTuChu, tinhBieuThuc, type CauKho } from '../src/lib/loi-giai-kiem'
import { BO_CHIA_KHOA } from '../src/lib/loi-giai-bo'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { maDe: string; cau: Record<string, unknown> }>
const QID = '12-KT-C1-D2-III-6'
const cauMau = (): CauKho => {
  const r = MAU[QID]
  const ds = cauTrongGoi(r.maDe, { cau: [{ ...r.cau, qid: QID }] })
  expect(ds).toHaveLength(1)
  return ds[0]
}
type HoSo = Record<string, unknown> & { tl: Record<string, unknown>; phepTinh: Record<string, unknown>[] }

/** Hồ sơ tln hợp lệ cho đáp số khoa học `kq` (phép tính cuối `ketQua`/`bieuThuc` do từng ca chỉnh). */
async function dungCa(kq: string, cuoi: { bieuThuc: string; ketQua: number; lamTron: number }) {
  const c = { ...cauMau(), dapAn: kq }
  const bam = await bamCau(c)
  const vao = dauVao(c, bam)!
  const goc = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra/06-12-KT-C1-D2-III-6.json'), 'utf8')) as Record<string, unknown> & { canThayChot: string[]; tl: Record<string, unknown> }
  const { canThayChot, ...r } = goc
  const h = gonHoSo({ ...r, bam, co: canThayChot.map((ghi) => ({ loai: 'dapAn', ghi })) }) as HoSo
  h.tl = { ...goc.tl, dapAn: kq, giai: `Đáp số: ${kq}. Số hạt = n × N_A.` }
  h.ket = `Đáp số: ${kq}`
  h.phepTinh = [
    { ten: 'n (mol)', bieuThuc: '0.2', ketQua: 0.2, lamTron: 1 },
    { ten: 'Số hạt', ...cuoi, laDapSo: true },
  ]
  return { vao, h }
}
const kiem = ({ vao, h }: { vao: NonNullable<ReturnType<typeof dauVao>>; h: HoSo }) => kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER)

describe('soTuChu — đáp số kho thành số, hiểu kí hiệu khoa học', () => {
  it('a.10ⁿ viết bằng dấu chấm, chữ nhỏ, ^, ×, ·, e — đúng giá trị (so tương đối)', () => {
    const gan = (a: number, b: number) => Math.abs(a - b) <= Math.abs(b) * 1e-12
    for (const [s, v] of [
      ['1,1.10²³', 1.1e23], ['1,3.10²³', 1.3e23], ['1,3.10⁻³', 1.3e-3], ['6,02.10^23', 6.02e23], ['6,02×10^23', 6.02e23], ['1,6·10⁻¹⁹', 1.6e-19],
      ['2,5 x 10^-4', 2.5e-4], ['1.1E23', 1.1e23],
    ] as const) expect(gan(soTuChu(s), v), `${s} → ${soTuChu(s)}`).toBe(true)
  })
  it('số thường vẫn như cũ', () => {
    expect(soTuChu('12,5')).toBe(12.5)
    expect(soTuChu(' 58 ')).toBe(58)
    expect(soTuChu('-3,36')).toBe(-3.36)
    expect(soTuChu('1,237')).toBe(1.237) // MỘT dấu ⇒ luôn thập phân như luật cũ
  })
  it('không phải số thuần (có đơn vị, chữ, rỗng) ⇒ NaN — khoá số không đoán', () => {
    for (const s of ['', 'abc', '12 kJ', '1,2.10²³ hạt', '--3']) expect(Number.isNaN(soTuChu(s)), JSON.stringify(s)).toBe(true)
  })
})

describe('tinhBieuThuc — số khoa học, vẫn không eval', () => {
  it('nhận 6.02e23, 1.3e-3, 2E+2 và phép tính trộn', () => {
    expect(tinhBieuThuc('6.02e23')).toBe(6.02e23)
    expect(tinhBieuThuc('1.3e-3')).toBe(1.3e-3)
    expect(tinhBieuThuc('2E+2*3')).toBe(600)
    expect(Math.abs(tinhBieuThuc('0.2*6.02e23') - 1.204e23)).toBeLessThan(1e9)
    expect(tinhBieuThuc('(1+2)*1e3')).toBe(3000)
  })
  it('chữ e lạc chỗ vẫn bị chặn', () => {
    for (const bt of ['1e', 'e5', '1e+', '2e3e4', 'alert(1)', '2**3', '1e999999']) expect(() => tinhBieuThuc(bt), bt).toThrow()
  })
})

describe('saiSoLamTron — sai số làm tròn', () => {
  it('cỡ thường GIỮ NGUYÊN luật cũ (± 0,5·10^−d), kể cả số lớn / nhỏ dạng thường trong [10⁻⁸; 10¹²)', () => {
    for (const [kq, d] of [[22.4, 2], [0.07, 4], [58, 0], [1237500000, 0], [999999999999, 0], [0.0013, 4], [0.0000012, 6], [0.00000002, 8]] as const) expect(saiSoLamTron(kq, d), `${kq}/${d}`).toBeCloseTo(0.5 * 10 ** -d + 1e-9, 12)
  })
  it('cỡ khoa học (≥ 10¹² hoặc < 10⁻⁸): sai số theo bậc luỹ thừa của chính số đó', () => {
    expect(saiSoLamTron(1.2e23, 1)).toBeGreaterThanOrEqual(5e21)
    expect(saiSoLamTron(1.2e23, 1)).toBeLessThan(6e21)
    expect(saiSoLamTron(1.6e-19, 1)).toBeGreaterThanOrEqual(5e-21) // nửa đơn vị chữ số cuối của phần a: 0,05 × 10⁻¹⁹
    expect(saiSoLamTron(1.6e-19, 1)).toBeLessThan(6e-21)
    expect(saiSoLamTron(-6.02e23, 2)).toBeGreaterThanOrEqual(5e20)
    expect(saiSoLamTron(-6.02e23, 2)).toBeLessThan(6e20)
    expect(saiSoLamTron(1.2e-9, 1)).toBeLessThan(1e-9) // dưới 10⁻⁸: theo bậc của chính số (không còn ± 0,05 vô nghĩa)
  })
})

describe('kiemHoSo — khoá số với đáp số a.10ⁿ', () => {
  it('đáp số "1,2.10²³": phép tính cuối viết `0.2*6.02e23` = 1,204.10²³ làm tròn phần a (lamTron 1) = 1,2.10²³ ⇒ qua', async () => {
    const ca = await dungCa('1,2.10²³', { bieuThuc: '0.2*6.02e23', ketQua: 1.2e23, lamTron: 1 })
    expect(kiem(ca).loi).toEqual([])
  })
  it('đáp số "1,3.10⁻³" (số nhỏ) ⇒ qua khi phép tính cuối ra 0,0013', async () => {
    const ca = await dungCa('1,3.10⁻³', { bieuThuc: '1.3e-3', ketQua: 0.0013, lamTron: 4 })
    expect(kiem(ca).loi).toEqual([])
  })
  it('SAI SỐ MŨ ⇒ trượt khoá số (khoá phải khoá cả số mũ, không chỉ phần a)', async () => {
    const ca = await dungCa('1,2.10²³', { bieuThuc: '0.2*6.02e22', ketQua: 1.2e22, lamTron: 1 })
    expect(kiem(ca).loi.some((l) => l.startsWith('KHOÁ SỐ: phép tính cuối ra'))).toBe(true)
  })
  it('SAI PHẦN a ⇒ trượt khoá số', async () => {
    const ca = await dungCa('1,2.10²³', { bieuThuc: '0.3*6.02e23', ketQua: 1.8e23, lamTron: 1 })
    expect(kiem(ca).loi.some((l) => l.startsWith('KHOÁ SỐ: phép tính cuối ra'))).toBe(true)
  })
  it('chỉ ghi phần a (cách máy làm trước đây) ⇒ vẫn trượt — không khoá nửa vời', async () => {
    const ca = await dungCa('1,2.10²³', { bieuThuc: '0.2*6.02', ketQua: 1.2, lamTron: 1 })
    expect(kiem(ca).loi.some((l) => l.startsWith('KHOÁ SỐ: phép tính cuối ra'))).toBe(true)
  })
  it('biểu thức tính ra số khác con số ghi ⇒ trượt khoá số ở chính phép tính', async () => {
    const ca = await dungCa('1,2.10²³', { bieuThuc: '0.5*6.02e23', ketQua: 1.2e23, lamTron: 1 })
    expect(kiem(ca).loi.some((l) => l.startsWith('KHOÁ SỐ phepTinh'))).toBe(true)
  })
  it('đáp số thường vẫn như cũ: hồ sơ thật (58) qua; ghi 59 ⇒ trượt', async () => {
    const c = cauMau()
    const bam = await bamCau(c)
    const vao = dauVao(c, bam)!
    const goc = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra/06-12-KT-C1-D2-III-6.json'), 'utf8')) as Record<string, unknown> & { canThayChot: string[] }
    const { canThayChot, ...r } = goc
    const h = gonHoSo({ ...r, bam, co: canThayChot.map((ghi) => ({ loai: 'dapAn', ghi })) }) as HoSo
    expect(kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER).loi).toEqual([])
    const cuoi = h.phepTinh.filter((p) => p.laDapSo).pop()!
    cuoi.ketQua = 59
    expect(kiemHoSo(vao, h, BO_CHIA_KHOA.ESTER).loi.some((l) => l.startsWith('KHOÁ SỐ'))).toBe(true)
  })
})
