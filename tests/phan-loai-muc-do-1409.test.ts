// KHỐI "PHÂN LOẠI MỨC ĐỘ" TRONG PHIẾU HTML — dùng chung cho cả 3 app.
//
// Thầy chốt 14/09: "thiết kế lại chỗ này của html tinh tế đẹp và phù hợp hơn,
// đồng bộ với tất cả html của 3 app". Ba lỗi của bản cũ:
//   1. Dồn tên mức, dãy số câu, số câu và tên chuyên đề vào MỘT dòng chữ 13px.
//   2. Mỗi dòng mang lề âm -10px trong khung chỉ đệm 14px ⇒ nền dòng tràn sát
//      mép khung, nhìn như bị cắt cụt.
//   3. Màu "Thông hiểu" là hồng — không nằm trên thang dễ → khó nào cả.
import { describe, expect, it } from 'vitest'
import { tongQuanHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({
    phan: 'I', id: `q${Math.random()}`, maDe: 'D1', chuyenDe: 'Cấu tạo nguyên tử',
    dang: 'ly_thuyet', sao: 1, mucDo: 'biet', text: 'x', luaChon: ['A', 'B', 'C', 'D'],
    dapAn: 'A', chot: '', lyDo: '', buoc: [], ketQua: 'A', bang: null,
    ...o,
  }) as CauLuyen

describe('phân loại mức độ — bố cục hai tầng', () => {
  const cau = [C({ mucDo: 'biet' }), C({ mucDo: 'hieu' }), C({ mucDo: 'van_dung' })]

  it('tên mức nằm riêng một tầng, dãy số câu xuống tầng dưới', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('<span class="topic-ten"><strong>Nhận biết</strong>')
    expect(h).toContain('<span class="topic-cau">Câu 1 · 1 câu</span>')
    // Bản cũ nối tất cả vào một dòng sau dấu hai chấm — không được còn nữa.
    expect(h).not.toContain('<strong>Nhận biết:</strong>')
  })

  it('tên chuyên đề tách thành nhãn mờ riêng, không nối đuôi sau số câu', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('<span class="topic-cd">Cấu tạo nguyên tử</span>')
    expect(h).not.toContain('câu — Cấu tạo nguyên tử')
  })

  it('KHÔNG còn lề âm làm dòng tràn mép khung', () => {
    const h = tongQuanHtml(cau)
    expect(h).not.toContain('margin: 0 -10px')
  })

  it('màu mức độ đi theo thang dễ → khó, bỏ hẳn màu hồng lạc thang', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('background:#1e8e3e')
    expect(h).toContain('background:#e37400')
    expect(h).toContain('background:#c5221f')
    expect(h).not.toContain('#f472b6')
    expect(h).not.toContain('#34d399')
  })

  it('vẫn là nút lọc và vẫn có <strong> cho kịch bản lọc đọc nhãn', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('class="topic-item" data-loc="muc:hieu"')
    expect(h).toContain('aria-pressed="false"')
    expect(h.match(/<strong>/g)?.length).toBe(3)
  })

  it('không emoji — quy tắc viết của thầy', () => {
    expect(tongQuanHtml(cau)).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })
})
