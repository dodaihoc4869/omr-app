// BỐN LỖI THẦY BẮT ĐƯỢC 07/09, mỗi lỗi một hàng nghiệm thu.
//
// Ảnh chụp màn hình thầy gửi có đúng bốn chỗ sai, và cả bốn đều là lỗi thật:
//
//   1. Dòng cảnh báo đọc thành `kho chưa có câu nào cùng dạng "Ester – lipid"`
//      lặp ba lần. "Ester – lipid" là tên CHƯƠNG, không phải tên dạng — cổng
//      trả `cau.chuyenDe` làm tên dạng. Ba câu sai khác dạng in ra ba dòng y
//      hệt nhau, thầy không biết phải bổ sung câu gì vào kho.
//
//   2. `Chưa có câu chữa cho: câu 2` trong khi phiếu vẫn in 5 câu khắc phục
//      cho "câu 2". Số câu đánh lại từ 1 ở MỖI PHẦN, nên "câu 2" trần là hai
//      câu khác nhau. Thiếu chữ "phần" là hai câu bị gộp làm một.
//
//   3. Câu sai CÓ HÌNH bị báo "chưa gắn dạng" dù kho đã gán mã cho nó — cổng
//      tra dạng câu sai bằng danh sách ỨNG VIÊN (đã lọc bỏ câu có hình).
//
//   4. Phần "vì sao phương án em chọn sai" luôn trống: hàm đọc `c.loiGiai`,
//      trường đó không tồn tại trên `CauLuyen` (đã dàn thành `lyDo`).
import { describe, expect, it } from 'vitest'
import { rutDeChua, viSaoChonSai, banDoDang } from '../src/lib/rut-de-chua'
import { khoiChuaGiHtml } from '../src/lib/html-phieu'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const MA_A = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const TEN_A = 'Thuỷ phân ester trong base, tính khối lượng'
const MA_B = 'CARB.THUY_PHAN.TINH_KHOI_LUONG'
const TEN_B = 'Thuỷ phân carbohydrate, tính khối lượng'

type Them = { dang?: { ma: string; ten: string } | null; thanCauImg?: string; loiGiai?: unknown }

const cau = (id: string, them: Them = {}) => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: 'A' as const,
  // CHUYÊN ĐỀ CỐ Ý ĐẶT KHÁC TÊN DẠNG. Nếu cổng lại lấy chuyên đề làm tên dạng,
  // chuỗi này sẽ lòi ra trong lời cảnh báo và test bắt được ngay.
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu' as const,
  dang: { ma: MA_A, ten: TEN_A },
  ...them,
})

/** Phần II là câu đúng/sai bốn ý — hình dạng KHÁC hẳn Phần I. */
const cauII = (id: string, them: Them = {}) => ({
  id,
  text: `Đề ${id}`,
  ideas: ['ý a', 'ý b', 'ý c', 'ý d'] as [string, string, string, string],
  correct: [true, false, false, false] as [boolean, boolean, boolean, boolean],
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu' as const,
  dang: { ma: MA_A, ten: TEN_A },
  ...them,
})

const kho = (phanI: unknown[], phanII: unknown[] = []): TeacherExamSource[] =>
  [{ maDe: 'D1', ngayNap: '2026-09-07', phanI, phanII, phanIII: [] } as unknown as TeacherExamSource]

const row = (phan: 'I' | 'II' | 'III', soCau: number, qid: string, dung = false): ChiTietCauRow => ({
  phan,
  soCau,
  qid,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  dapAnChon: 'B',
  dapAnDung: 'A',
  dungSai: dung,
  giay: 30,
})

describe('lỗi 1 — nói TÊN DẠNG, không nói tên chuyên đề', () => {
  it('kho hết câu cùng dạng thì lời nhắn nêu đúng tên dạng', () => {
    const k = kho([cau('s1')])
    const kq = rutDeChua({ khoDe: k, rows: [row('I', 2, 's1')], soCau: 10 })
    expect(kq.thieu[0].vi).toContain(TEN_A)
    expect(kq.thieu[0].tenDang).toBe(TEN_A)
    // Tên chương tuyệt đối không được đứng vào chỗ tên dạng.
    expect(kq.thieu[0].vi).not.toContain('Ester – lipid')
  })

  it('hai câu sai KHÁC DẠNG cho ra hai lời nhắn khác nhau', () => {
    const k = kho([cau('s1'), cau('s2', { dang: { ma: MA_B, ten: TEN_B } })])
    const kq = rutDeChua({ khoDe: k, rows: [row('I', 2, 's1'), row('I', 3, 's2')], soCau: 10 })
    const vi = kq.thieu.map((t) => t.vi)
    expect(new Set(vi).size).toBe(2)
    expect(vi.join(' ')).toContain(TEN_A)
    expect(vi.join(' ')).toContain(TEN_B)
  })
})

describe('lỗi 2 — câu 2 phần I không được lẫn với câu 2 phần II', () => {
  const dungKho = () =>
    kho(
      // Phần I câu 2 (`a1`) có tận 3 câu cùng dạng để chữa.
      [cau('a1'), cau('a2'), cau('a3'), cau('a4')],
      // Phần II câu 2 (`b1`) mang dạng khác và kho KHÔNG có câu nào cùng dạng.
      [cauII('b1', { dang: { ma: MA_B, ten: TEN_B } })],
    )

  it('poolTheoCauSai và thieu[] đều mang theo phần', () => {
    const kq = rutDeChua({ khoDe: dungKho(), rows: [row('I', 2, 'a1'), row('II', 2, 'b1')], soCau: 10 })
    const hetHang = kq.poolTheoCauSai.filter((p) => p.pool === 0)
    expect(hetHang.map((p) => `${p.soCau}/${p.phan}`)).toEqual(['2/II'])
    expect(kq.poolTheoCauSai.find((p) => p.phan === 'I')?.pool).toBeGreaterThan(0)
    for (const t of kq.thieu) expect(t.phan).toBeTruthy()
    expect(kq.thieu.every((t) => t.vi.includes('phần'))).toBe(true)
  })

  it('câu 2 phần II hết hàng KHÔNG kéo theo câu 2 phần I', () => {
    const kq = rutDeChua({ khoDe: dungKho(), rows: [row('I', 2, 'a1'), row('II', 2, 'b1')], soCau: 10 })
    // Câu 2 phần I vẫn nhận đủ câu chữa thật.
    const choPhanI = kq.cau.filter((c) => c.chuaCho?.phan === 'I' && !c.chuaCho?.laLamLai)
    expect(choPhanI.length).toBeGreaterThan(0)
    // Câu 2 phần II không có câu chữa nào, chỉ có thẻ làm lại chính nó.
    const choPhanII = kq.cau.filter((c) => c.chuaCho?.phan === 'II')
    expect(choPhanII.map((c) => c.id)).toEqual(['b1'])
    expect(choPhanII[0].chuaCho?.laLamLai).toBe(true)
  })

  it('bảng đầu phiếu tách hai dòng riêng, không gộp làm một', () => {
    const the = (phan: 'I' | 'II', soCau: number, id: string): CauLuyen =>
      ({ id, phan: 'I', chuaCho: { qid: id, soCau, phan, maDang: MA_A, tenDang: TEN_A, bac: 1 } }) as unknown as CauLuyen
    const h = khoiChuaGiHtml([the('I', 2, 'x1'), the('II', 2, 'y1')])
    expect(h).toContain('Câu 2 phần I')
    expect(h).toContain('Câu 2 phần II')
  })
})

describe('lỗi 3 — câu sai CÓ HÌNH vẫn tra được mã dạng', () => {
  it('banDoDang phủ cả câu có hình, câu ấy không bị gọi là "chưa gắn dạng"', () => {
    const k = kho([cau('co-hinh', { thanCauImg: 'data:image/png;base64,AAA' }), cau('a1'), cau('a2')])
    expect(banDoDang(k).get('co-hinh')?.ma).toBe(MA_A)
    const kq = rutDeChua({ khoDe: k, rows: [row('I', 1, 'co-hinh')], soCau: 10 })
    expect(kq.thieu.map((t) => t.vi).join(' ')).not.toContain('chưa gắn dạng')
    // Vẫn được chữa bằng hai câu cùng mã trong kho.
    expect(kq.cau.map((c) => c.id).sort()).toEqual(['a1', 'a2'])
  })

  it('nhưng câu có hình KHÔNG được dùng làm câu chữa cho câu khác', () => {
    const k = kho([cau('s1'), cau('co-hinh', { thanCauImg: 'data:image/png;base64,AAA' })])
    const kq = rutDeChua({ khoDe: k, rows: [row('I', 2, 's1')], soCau: 10 })
    expect(kq.cau.filter((c) => !c.chuaCho?.laLamLai)).toHaveLength(0)
  })
})

describe('lỗi 4 — vì sao phương án em chọn là sai', () => {
  const coGiai = cau('s1', {
    loiGiai: { chot: 'chốt', tungPa: { B: { dung: false, viSao: 'Em quên nhân hệ số 3 của glycerol.' } } },
  })

  it('đọc được lý do từ chính câu em sai', () => {
    // Kho chỉ có CHÍNH nó mang mã ⇒ cổng vận hành được nhưng pool của s1 = 0,
    // nên phiếu chỉ còn thẻ làm lại — đúng ca thầy muốn phân tích lỗi sai.
    const kq = rutDeChua({ khoDe: kho([coGiai]), rows: [row('I', 2, 's1')], soCau: 10 })
    const n = kq.cau.find((c) => c.chuaCho?.laLamLai)?.chuaCho
    expect(n?.daChon).toBe('B')
    expect(n?.viSaoSai).toBe('Em quên nhân hệ số 3 của glycerol.')
  })

  it('không có lời giải cho phương án đó thì để TRỐNG, không bịa', () => {
    const kq = rutDeChua({ khoDe: kho([cau('s1')]), rows: [row('I', 2, 's1')], soCau: 10 })
    expect(kq.cau.find((c) => c.chuaCho?.laLamLai)?.chuaCho?.viSaoSai).toBe('')
  })

  it('đọc mảng lyDo của CauLuyen, không đọc trường loiGiai đã bị dàn phẳng', () => {
    const c = { phan: 'I', lyDo: [{ khoa: 'B', dung: false, ly: 'B sai vì...' }] } as unknown as CauLuyen
    expect(viSaoChonSai(c, 'B')).toBe('B sai vì...')
    // Vật thử mang `loiGiai` mà không mang `lyDo` phải trả rỗng — đó chính là
    // hình dạng sai tôi đã dựa vào lúc đầu.
    const cu = { phan: 'I', loiGiai: { tungPa: { B: { viSao: 'x' } } } } as unknown as CauLuyen
    expect(viSaoChonSai(cu, 'B')).toBe('')
  })
})
