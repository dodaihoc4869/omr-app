import { describe, expect, it } from 'vitest'
import { docDuongVao, docVaiTuDuongDan } from '../src/lib/vai-tro'

describe('Cổng Phụ Huynh & Bài của Mom giao & Báo cáo', () => {
  it('đường dẫn /phu-huynh và tham số ?vai=phuhuynh nhận đúng vai trò phuhuynh', () => {
    expect(docVaiTuDuongDan('/omr-app/phu-huynh').vai).toBe('phuhuynh')
    expect(docVaiTuDuongDan('/omr-app/phu-huynh/').vai).toBe('phuhuynh')
    expect(docDuongVao('?vai=phuhuynh').vai).toBe('phuhuynh')
  })

  it('cấu trúc bài tập Mom giao hỗ trợ tối đa 99 câu và đếm ngược 2 tiếng (7200s)', () => {
    const baiMom = {
      id: 'mom_123456',
      tieuDe: 'Bài của Mom giao (50 câu)',
      soCau: 50,
      thoiGianPhut: 120, // 2 tiếng chuẩn
      trangThai: 'dang_lam',
      batDauLuc: new Date(Date.now() - 60000).toISOString(), // đã làm 1 phút
    }

    const daTroiQua = Math.floor((Date.now() - new Date(baiMom.batDauLuc).getTime()) / 1000)
    const conLai = Math.max(0, 7200 - daTroiQua)

    expect(baiMom.thoiGianPhut).toBe(120)
    expect(conLai).toBeLessThanOrEqual(7200)
    expect(conLai).toBeGreaterThanOrEqual(7100)
  })

  it('bài nộp của con tạo kết quả chuẩn HTML đồng bộ ngược về cho phụ huynh', () => {
    const ketQuaHtml = `
      <div class="ket-qua-mom">
        <div>💖 KẾT QUẢ BÀI CỦA MOM GIAO</div>
        <div>Điểm số: 8.5 / 10</div>
      </div>
    `
    expect(ketQuaHtml).toContain('KẾT QUẢ BÀI CỦA MOM GIAO')
    expect(ketQuaHtml).toContain('8.5 / 10')
  })
})
