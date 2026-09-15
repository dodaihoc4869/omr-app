// CA KHÔNG SAI CÂU NÀO — CẤM MỜI EM LÀM MỘT PHIẾU TRẮNG. 15/09.
//
// Thầy gửi ảnh ca Test7 kèm "Sửa lại chỗ này nhé". Trên ảnh:
//   · Tiêu đề modal: "Test7 · 0 câu làm sai"
//   · Thẻ 1 vẫn mời: "1. Làm lại các câu sai (0 câu)"
//   · Nút "Bắt đầu làm bài" vẫn sáng — bấm vào ra phiếu trắng
//   · Dưới nút hiện: "Máy này chưa có kho đề của thầy nên chưa rút thêm câu
//     cùng dạng được."
//
// HAI NGUYÊN NHÂN GỐC, RỜI NHAU:
//
// 1. CỔNG CHẶN VÀ RUỘT MODAL ĐỌC HAI NGUỒN. Nút "KHẮC PHỤC NGAY N CÂU SAI"
//    trong báo cáo mở theo `soSai`/`dem` — đếm từ bảng chấm. Modal thì chạy
//    trên `dsCauSai` — danh sách `hsCauSai` trả về. Hai nguồn lệch một nhịp
//    (đang tải, hoặc máy chủ trả rỗng) là ra đúng màn thầy chụp.
//    Cùng một họ lỗi với vụ 60-vs-579 ngày 14/09.
//
// 2. CỔNG CHẶN NÚT CHỈ PHỦ CHẾ ĐỘ 2. Điều kiện cũ là
//    `cheDo === 2 && tongToiDaCheDo2 === 0 && dsCauSai.length === 0`, nên chế
//    độ 1 với 0 câu sai vẫn bật nút.
//
// Và dòng cảnh báo thì SAI LÝ DO: từ 15/09 modal luôn xin máy chủ, không đọc
// kho của máy đang mở nữa, nên "máy này chưa có kho đề của thầy" không còn là
// lý do có thật của bất kỳ ca nào.
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ModalKhacPhucCauSai, { KHONG_CO_KHO } from '../src/components/ModalKhacPhucCauSai'

afterEach(() => cleanup())

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
/** Bỏ chú thích trước khi soi MÃ CHẠY — chính các tệp này giải thích luật cũ. */
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

const MODAL_DAY_DU = doc('src/components/ModalKhacPhucCauSai.tsx')
const MODAL = boChuThich(MODAL_DAY_DU)
const BC_HS = boChuThich(doc('src/components/BaoCaoCaThiHocSinhModal.tsx'))
const BC_PH = boChuThich(doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx'))

// ---------------------------------------------------------------------------

describe('0 câu sai — modal nói thẳng là rỗng, không có nút nào bấm được', () => {
  it('không vẽ thẻ "Làm lại các câu sai" và không có nút "Bắt đầu làm bài"', () => {
    render(
      <ModalKhacPhucCauSai
        isOpen
        onClose={() => {}}
        dsCauSai={[]}
        hoTen="Nguyễn Văn A"
        sbd="000001"
        tieuDeCa="Test7"
      />,
    )
    expect(screen.queryByText(/Bắt đầu làm bài/)).toBeNull()
    expect(screen.queryByText(/Làm lại các câu sai/)).toBeNull()
    expect(screen.queryByText(/Xem trước đề/)).toBeNull()
  })

  it('nói đúng lý do: không có câu nào cần khắc phục, KHÔNG đổ cho kho đề', () => {
    const { container } = render(
      <ModalKhacPhucCauSai
        isOpen
        onClose={() => {}}
        dsCauSai={[]}
        hoTen="Nguyễn Văn A"
        sbd="000001"
        tieuDeCa="Test7"
      />,
    )
    expect(container.querySelector('[data-man="khac-phuc-khong-co-cau-sai"]')).not.toBeNull()
    expect(screen.getByText(/Không có câu nào cần khắc phục/)).toBeTruthy()
    expect(container.textContent || '').not.toContain('chưa có kho đề của thầy')
  })

  it('vẫn còn đúng một nút Đóng để thoát', () => {
    render(
      <ModalKhacPhucCauSai isOpen onClose={() => {}} dsCauSai={[]} hoTen="A" sbd="000001" />,
    )
    expect(screen.getByText('Đóng')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------

describe('Cổng chặn nút "Bắt đầu làm bài" phủ CẢ BA chế độ', () => {
  it('mã chạy không còn cổng cũ chỉ phủ chế độ 2', () => {
    expect(MODAL).not.toContain('cheDo === 2 && tongToiDaCheDo2 === 0')
  })

  it('dùng chung một con số `soCauSeRut` cho cả hai nút', () => {
    expect(MODAL).toContain('const soCauSeRut =')
    // Chế độ 1 lấy đúng số câu sai; chế độ 2 và 3 bị chặn trên bởi trần thật.
    expect(MODAL).toMatch(/soCauSeRut\s*=\s*\n?\s*cheDo === 1/)
    expect(MODAL).toContain('Math.min(soCauCheDo2, tongToiDaCheDo2)')
    expect(MODAL).toContain('Math.min(soCauCheDo3, tongToiDaCheDo3)')
    const soLanChan = MODAL.split('disabled={dangTao || soCauSeRut <= 0}').length - 1
    expect(soLanChan).toBe(2)
  })
})

// ---------------------------------------------------------------------------

describe('Dòng cảnh báo phải nói đúng lý do', () => {
  it('KHONG_CO_KHO không còn đổ cho kho đề của máy đang mở', () => {
    expect(KHONG_CO_KHO).not.toContain('Máy này chưa có kho đề của thầy')
    expect(KHONG_CO_KHO.toLowerCase()).toContain('máy chủ')
  })

  it('câu chữ cũ không còn trong mã chạy (chú thích giữ lại để khỏi viết lại)', () => {
    expect(MODAL).not.toContain('Máy này chưa có kho đề của thầy nên chưa rút thêm câu')
    expect(MODAL_DAY_DU).toContain('máy này chưa có kho đề của thầy')
  })
})

// ---------------------------------------------------------------------------

describe('Báo cáo ca thi — nút khắc phục đi theo DANH SÁCH THẬT', () => {
  it('app học sinh: cả nút đầu và nút cuối đều soi `dsCauSai`', () => {
    expect(BC_HS).toContain('disabled={dsCauSai.length === 0}')
    expect(BC_HS).toContain('{soKhacPhuc > 0 && dsCauSai.length > 0 && (')
    // Cổng cũ mở theo số đếm của bảng chấm — đã bỏ.
    expect(BC_HS).not.toContain('{((soSai ?? 0) > 0 || (soBoTrong ?? 0) > 0) && (')
  })

  it('app học sinh: lệch nguồn thì nói ra, không im lặng', () => {
    expect(BC_HS).toContain('Chưa lấy được danh sách câu sai của ca này')
    expect(BC_HS).toContain('Đang tải danh sách câu sai…')
  })

  it('app phụ huynh: nút "Tạo bài luyện khắc phục" không còn hiện vô điều kiện', () => {
    expect(BC_PH).toContain('{dsCauSai.length > 0 ? (')
    expect(BC_PH).toContain('Ca này con không có câu nào cần khắc phục')
  })
})
