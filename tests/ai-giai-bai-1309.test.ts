import { describe, expect, it } from 'vitest'
import { giaiBaiTapAI } from '../src/lib/tro-ly/ai-giai-bai'

describe('AI Trợ lý Em Yêu - Tự động giải bài tập chuẩn HTML', () => {
  it('giải câu hỏi Hoá học este và sinh cấu trúc HTML hoàn chỉnh', async () => {
    const res = await giaiBaiTapAI({
      noiDung: 'Thủy phân hoàn toàn 8.8 gam ethyl acetate trong dung dịch NaOH đun nóng. Tính khối lượng muối thu được.',
    })

    expect(res).toBeDefined()
    expect(res.tieuDe).toContain('ESTE')
    expect(res.phuongPhap).toBeTruthy()
    expect(res.loiGiaiChiTiet).toBeTruthy()
    expect(res.dapAn).toBeTruthy()
    // Kiểm tra cấu trúc HTML
    expect(res.htmlToanBo).toContain('ai-giai-bai-hop')
    expect(res.htmlToanBo).toContain('Phương pháp giải')
    expect(res.htmlToanBo).toContain('Lời giải chi tiết')
    expect(res.htmlToanBo).toContain('CH₃COONa')
  })

  it('giải câu hỏi trắc nghiệm có 4 phương án A, B, C, D', async () => {
    const res = await giaiBaiTapAI({
      noiDung: 'Chất nào sau đây là este?\nA. CH3COOH\nB. C2H5OH\nC. CH3COOCH3\nD. HCHO',
    })

    expect(res.dapAn).toMatch(/[ABCD]/)
    expect(res.htmlToanBo).toContain('Đáp án:')
  })

  it('xử lý ảnh đính kèm (có link ảnh / base64)', async () => {
    const res = await giaiBaiTapAI({
      noiDung: 'Nhờ AI giải giúp câu trong ảnh',
      urlAnh: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    })

    expect(res).toBeDefined()
    expect(res.htmlToanBo).toContain('Ảnh đề bài kèm theo')
  })
})
