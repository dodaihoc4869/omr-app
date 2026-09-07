// MÃ DẠNG PHẢI ĐI ĐƯỢC TỪ KHO VÀO APP — đặc tả RÚT CÂU CHỮA v3 mục 4.
//
// Kho trên máy thầy đã gán mã dạng cho 2 213 câu. Nhưng cửa nạp đề của app
// (`buildTeacherSourceFromKhoDe`) chép TỪNG TRƯỜNG một sang câu hỏi, nên trường
// nào quên chép là rơi im lặng: kho gán xong mà app vẫn không thấy mã nào, cổng
// `rutDeChua` trả về rỗng, thầy tưởng luật rút hỏng.
//
// Bộ test này canh đúng chỗ đó: mã dạng vào được câu hỏi, mã rác bị chặn, và
// chuỗi kho -> nguồn -> cổng rút chữa chạy thông từ đầu tới cuối.
import { describe, it, expect } from 'vitest'
import { parseKhoDeJsonText, buildTeacherSourceFromKhoDe, parseDang } from '../src/lib/exam-kho-de-import'
import { rutDeChua } from '../src/lib/rut-de-chua'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

/** Bảng chi tiết câu của một em: câu 1 đúng, câu 2 sai. */
const rowsSaiCau2 = (): ChiTietCauRow[] => [
  { phan: 'I', soCau: 1, qid: '12-C1-B9-I-1', chuyenDe: 'Ester – lipid', mucDo: 'hieu', dapAnChon: 'A', dapAnDung: 'A', dungSai: true, giay: 20 },
  { phan: 'I', soCau: 2, qid: '12-C1-B9-I-2', chuyenDe: 'Ester – lipid', mucDo: 'hieu', dapAnChon: 'B', dapAnDung: 'A', dungSai: false, giay: 40 },
]

const MA = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const TEN = 'Xà phòng hoá — tính khối lượng'

function cauI(so: number, dang: unknown, them: Record<string, unknown> = {}) {
  return {
    phan: 'I',
    so,
    de: `Câu ${so}: Xà phòng hoá chất béo cần bao nhiêu gam NaOH?`,
    pa: { A: 'a', B: 'b', C: 'c', D: 'd' },
    dap_an: 'A',
    chuyen_de: 'Ester – lipid',
    muc_do: 'hieu',
    dang,
    ...them,
  }
}

function khoJson(cau: unknown[]) {
  return JSON.stringify({ ma_de: '12-C1-B9', nguon: 'kho', ngay_nap: '2026-09-06', cau })
}

function nguonTu(cau: unknown[]): TeacherExamSource {
  const p = parseKhoDeJsonText(khoJson(cau))
  expect(p.ok, p.errors.join(' | ')).toBe(true)
  const b = buildTeacherSourceFromKhoDe(p.json!)
  expect(b.errors).toEqual([])
  return b.source
}

describe('parseDang — chỉ nhận mã đúng khuôn ba tầng', () => {
  it('nhận mã ba tầng', () => {
    expect(parseDang({ ma: MA, ten: TEN })).toEqual({ ma: MA, ten: TEN })
  })

  it('thiếu tên thì lấy mã làm tên, không để rỗng', () => {
    expect(parseDang({ ma: MA })).toEqual({ ma: MA, ten: MA })
  })

  it.each([
    ['hai tầng', 'ESTER.THUY_PHAN_BASE'],
    ['bốn tầng', 'ESTER.THUY_PHAN_BASE.TINH.KHOI_LUONG'],
    ['chữ thường', 'ester.thuy_phan_base.tinh_khoi_luong'],
    ['có dấu cách', 'ESTER.THUY PHAN BASE.TINH_KHOI_LUONG'],
    ['rỗng', ''],
  ])('bỏ mã %s', (_ten, ma) => {
    expect(parseDang({ ma, ten: 'gì đó' })).toBeNull()
  })

  it.each([[null], [undefined], ['chuỗi'], [[]], [42]])('bỏ giá trị lạ %s', (v) => {
    expect(parseDang(v)).toBeNull()
  })
})

describe('mã dạng đi từ kho vào câu hỏi của app', () => {
  it('câu Phần I giữ nguyên mã và tên dạng', () => {
    const s = nguonTu([cauI(1, { ma: MA, ten: TEN })])
    expect(s.phanI[0].dang).toEqual({ ma: MA, ten: TEN })
  })

  it('câu Phần II và Phần III cũng giữ mã', () => {
    const p = parseKhoDeJsonText(
      khoJson([
        { phan: 'II', so: 1, de: 'Ý nào đúng?', y: { a: 'a', b: 'b', c: 'c', d: 'd' }, dap_an: 'DSDS', dang: { ma: 'ESTER.CAU_TAO.CHON_PHAT_BIEU', ten: 'x' } },
        { phan: 'III', so: 1, de: 'Giá trị của m là bao nhiêu?', dap_an: '12,5', dang: { ma: 'ESTER.CAU_TAO.DEM_DONG_PHAN', ten: 'y' } },
      ]),
    )
    const b = buildTeacherSourceFromKhoDe(p.json!)
    expect(b.source.phanII[0].dang?.ma).toBe('ESTER.CAU_TAO.CHON_PHAT_BIEU')
    expect(b.source.phanIII[0].dang?.ma).toBe('ESTER.CAU_TAO.DEM_DONG_PHAN')
  })

  it('câu chưa gán để dang = null, không bịa mã', () => {
    const s = nguonTu([cauI(1, null, { viSaoNull: 'chưa nhận ra cơ chế' })])
    expect(s.phanI[0].dang).toBeNull()
    expect(s.phanI[0].viSaoNull).toBe('chưa nhận ra cơ chế')
  })

  it('mã rác trong kho bị chặn ngay cửa nạp, không lọt vào app', () => {
    const s = nguonTu([cauI(1, { ma: 'ESTER.XA_PHONG', ten: 'mã bịa' })])
    expect(s.phanI[0].dang).toBeNull()
  })

  it('kienThuc và loiThuongGap rỗng thì không nhét mảng rỗng vào câu', () => {
    const s = nguonTu([cauI(1, { ma: MA, ten: TEN }, { kienThuc: [], loiThuongGap: [] })])
    expect(s.phanI[0].kienThuc).toBeUndefined()
    expect(s.phanI[0].loiThuongGap).toBeUndefined()
  })

  it('kienThuc có nội dung thì giữ, bỏ phần tử rỗng', () => {
    const s = nguonTu([cauI(1, { ma: MA, ten: TEN }, { kienThuc: ['bảo toàn khối lượng', '  ', ''] })])
    expect(s.phanI[0].kienThuc).toEqual(['bảo toàn khối lượng'])
  })
})

describe('chuỗi kho -> nguồn -> cổng rút câu chữa chạy thông', () => {
  it('rút được câu chữa cùng mã sau khi nạp đề từ kho', () => {
    const nguon = nguonTu([1, 2, 3, 4].map((i) => cauI(i, { ma: MA, ten: TEN })))
    // ĐỔI YÊU CẦU 07/09 (thầy: "kéo nhiều thì ghép nhiều câu chữa"): xin 10 câu
    // thì cổng phát tới khi hết hàng, không dừng ở 2. Kho có 4 câu cùng mã, trừ
    // chính câu sai và câu em đã làm ⇒ còn 3.
    const kq = rutDeChua({ khoDe: [nguon], rows: rowsSaiCau2(), soCau: 10 })
    expect(kq.cau.length).toBe(3)
    // v4: xin 10 mà kho chỉ có 3 câu cùng dạng thì phải NÓI ra, không nuốt.
    expect(kq.thieu[0].vi).toMatch(/chỉ còn 3\/10/)
    expect(kq.tongUngVien).toBe(3)
    for (const c of kq.cau) {
      expect(c.chuaCho?.maDang).toBe(MA)
      expect(c.id).not.toBe('12-C1-B9-I-2')
    }
    // Xin đúng 2 thì vẫn ra đúng 2 — trần do người gọi đặt, không phải do cổng.
    expect(rutDeChua({ khoDe: [nguon], rows: rowsSaiCau2(), soCau: 2 }).cau.length).toBe(2)
  })

  it('kho chưa gán mã thì cổng báo thiếu chứ không rút bừa', () => {
    const nguon = nguonTu([1, 2, 3, 4].map((i) => cauI(i, null, { viSaoNull: 'chưa nhận ra cơ chế' })))
    const kq = rutDeChua({ khoDe: [nguon], rows: rowsSaiCau2(), soCau: 10 })
    // Kho KHÔNG gán mã nào ⇒ cổng chưa vận hành được. Luật "đưa lại câu sai cho
    // em làm lại" (thầy chốt 07/09) chỉ chạy khi kho đã có mã; ở đây chỗ gọi lui
    // hẳn về bài luyện chung, nên cổng trả rỗng đúng như cũ.
    expect(kq.cau).toEqual([])
    expect(kq.thieu.length).toBe(1)
  })
})
