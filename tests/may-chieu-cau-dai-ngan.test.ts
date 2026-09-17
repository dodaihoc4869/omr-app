import { describe, it, expect } from 'vitest'
import { taoHtmlMayChieu, laCauDai, type OBang } from '../src/lib/html-may-chieu'
import type { CauLuyen } from '../src/lib/types'

function taoCau(opts: Partial<CauLuyen> = {}): CauLuyen {
  return {
    phan: 'I',
    id: 'test-1',
    maDe: 'MD1',
    chuyenDe: 'Hóa học',
    dang: 'bai_tap',
    sao: 1,
    mucDo: 'biet',
    text: 'Đề bài ngắn gọn cho câu hỏi trắc nghiệm thông thường.',
    luaChon: ['A. Đáp án 1', 'B. Đáp án 2', 'C. Đáp án 3', 'D. Đáp án 4'],
    dapAn: 'A',
    buoc: [],
    ...opts,
  }
}

function taoO(sbd: string, cau: CauLuyen): OBang {
  return {
    sbd,
    hoTen: `Học sinh ${sbd}`,
    soCau: 1,
    cau,
  }
}

describe('Thuật toán laCauDai và chia đợt máy chiếu', () => {
  it('nhận diện câu ngắn chính xác', () => {
    const cauNgan = taoCau({
      text: 'Chất nào sau đây là ester?',
      luaChon: ['Ethyl acetate', 'Acetic acid', 'Ethanol', 'Acetaldehyde'],
    })
    expect(laCauDai(cauNgan)).toBe(false)
  })

  it('nhận diện câu dài có đề bài nhiều dòng hoặc văn bản dài', () => {
    const cauDai = taoCau({
      text: 'Đoạn văn mở đầu giới thiệu bài toán rất dài.\nTiếp theo là dữ kiện thí nghiệm thứ nhất với nhiều con số chi tiết.\nSau đó là dữ kiện thí nghiệm thứ hai.\nVà cuối cùng là câu hỏi yêu cầu tính toán kết quả cuối cùng.',
    })
    expect(laCauDai(cauDai)).toBe(true)
  })

  it('nhận diện câu có ảnh hoặc bảng là câu dài', () => {
    const cauAnh = taoCau({
      text: 'Cho đồ thị biểu diễn độ tan của chất X theo nhiệt độ như hình vẽ bên dưới. Hãy xác định nhiệt độ kết tinh.',
      anhThanCau: 'data:image/png;base64,mock',
    })
    expect(laCauDai(cauAnh)).toBe(true)
  })

  it('hai câu ngắn thì chia đôi bảng 50% - 50%', () => {
    const o1 = taoO('HS01', taoCau({ text: 'Câu ngắn 1' }))
    const o2 = taoO('HS02', taoCau({ text: 'Câu ngắn 2' }))
    const html = taoHtmlMayChieu([o1, o2])

    // Không có thẻ div class="mc-dot mc-dot-don"
    expect(html).not.toContain('class="mc-dot mc-dot-don"')
    // Có chứa cả 2 em trên cùng đợt
    expect(html).toContain('Học sinh HS01')
    expect(html).toContain('Học sinh HS02')
  })

  it('câu dài thì chiếu 2/3 bảng và 1/3 bảng để trống cho học sinh lên làm', () => {
    const cauDai = taoCau({
      text: 'Dòng 1 dữ kiện bài toán dài.\nDòng 2 dữ kiện tiếp theo.\nDòng 3 phản ứng xảy ra hoàn toàn.\nDòng 4 tính giá trị của m.',
    })
    const o1 = taoO('HS_DAI', cauDai)
    const o2 = taoO('HS_NGAN', taoCau({ text: 'Câu ngắn' }))
    const html = taoHtmlMayChieu([o1, o2])

    // Đợt 1 phải là đợt đơn mc-dot-don (2/3 + 1/3)
    expect(html).toContain('class="mc-dot mc-dot-don"')
    expect(html).toContain('mc-cot-lam-bai')
    expect(html).not.toContain('Bảng học sinh lên làm')
    expect(html).toContain('Học sinh HS_DAI')
  })

  it('thẻ tên học sinh có header nổi bật sticky trên đầu', () => {
    const o = taoO('HS01', taoCau())
    const html = taoHtmlMayChieu([o])
    expect(html).toContain('position: sticky; top: 0; z-index: 15')
    expect(html).toContain('<header class="mc-em"')
  })
})
