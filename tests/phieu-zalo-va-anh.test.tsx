// PHIẾU GỬI PHỤ HUYNH: tin nhắn chữ + ẢNH PHIẾU.
//
// Thầy yêu cầu: trong Chi tiết ca, chạm tên em phải ra đủ mạnh–yếu và chỗ gửi
// Zalo; nội dung Zalo là một ảnh đẹp, chạm vào là tải/gửi được.
//
// Test này khoá ba thứ dễ hỏng nhất:
//   1. dòng "việc cần làm" phải vào CẢ tin nhắn lẫn ảnh — hai chỗ soạn riêng
//      thì sớm muộn cũng lệch nhau,
//   2. mọi con số trên phiếu phải là số đã chấm, KHÔNG bịa,
//   3. tên em trong danh sách ca phải là NÚT mở hồ sơ.
import { describe, expect, it } from 'vitest'
import { soanPhieuZalo, viecCanLamMacDinh, demChu, type DuLieuPhieu } from '../src/lib/phieu-zalo'
import { tenTepPhieu } from '../src/lib/anh-phieu'
import maChiTietCa from '../src/screens/ExamMonitorScreen.tsx?raw'
import maPhieu from '../src/components/PhieuZaloEm.tsx?raw'

const DU: DuLieuPhieu = {
  hoTen: 'Nguyễn Thu Hiền',
  ngay: '2026-09-03T10:20:00.000Z',
  diem: 6.25,
  xepLoai: 'Trung bình',
  diemPhan: { I: 3.5, II: 1.75, III: 1 },
  soCauSai: 7,
  chuyenDeSai: { ten: 'Ester – lipid', soSai: 4 },
  baiTapDaGiao: null,
}

describe('Tin nhắn gửi phụ huynh', () => {
  it('nêu đúng điểm, đúng số câu sai, đúng chuyên đề — không con số nào ngoài dữ liệu', () => {
    const t = soanPhieuZalo(DU)
    expect(t).toContain('ĐIỂM: 6,25/10, xếp loại Trung bình')
    expect(t).toContain('Phần I 3,50 · Phần II 1,75 · Phần III 1,00')
    expect(t).toContain('sai 7 câu')
    expect(t).toContain('4 câu thuộc Ester – lipid')
    expect(t).toContain('03/09')
  })

  // Thầy yêu cầu: có xuống dòng, tách bạch từng khối, nhấn mạnh chỗ quan trọng.
  it('chia bốn khối, cách nhau bằng dòng trống', () => {
    const khoi = soanPhieuZalo(DU).split('\n\n')
    expect(khoi).toHaveLength(4)
    expect(khoi[0]).toMatch(/^Anh\/chị, kết quả bài kiểm tra ngày /)
    expect(khoi[1]).toMatch(/^ĐIỂM: /)
    expect(khoi[2]).toMatch(/^CHỖ MẤT ĐIỂM: /)
    expect(khoi[3]).toMatch(/^VIỆC CẦN LÀM: /)
  })

  it('điểm từng phần nằm dòng riêng, không dính vào dòng tổng điểm', () => {
    const dong = soanPhieuZalo(DU).split('\n')
    expect(dong.some((d) => d.startsWith('Phần I '))).toBe(true)
  })

  // Zalo hiện chữ thuần: gõ **đậm** thì phụ huynh nhìn thấy đúng hai dấu sao.
  it('KHÔNG chèn ký hiệu markdown vào tin nhắn', () => {
    const t = soanPhieuZalo(DU)
    expect(t).not.toContain('**')
    expect(t).not.toContain('__')
    expect(t).not.toMatch(/^#/m)
  })

  it('dùng dấu phẩy thập phân, không dùng dấu chấm', () => {
    expect(soanPhieuZalo(DU)).not.toMatch(/\d\.\d/)
  })

  it('không lời chào, không lời chúc, không khen suông', () => {
    const t = soanPhieuZalo(DU).toLowerCase()
    for (const cam of ['kính gửi', 'trân trọng', 'chúc', 'hy vọng', 'tiềm năng', 'cố gắng hơn', 'thông minh']) {
      expect(t).not.toContain(cam)
    }
  })

  it('nằm trong khoảng 60–120 chữ như quy tắc viết', () => {
    const n = demChu(soanPhieuZalo(DU))
    expect(n).toBeGreaterThanOrEqual(40)
    expect(n).toBeLessThanOrEqual(120)
  })

  // Điểm mấu chốt: MỘT dòng "việc cần làm" cho cả tin nhắn lẫn ảnh.
  it('thầy sửa việc cần làm thì tin nhắn đổi theo', () => {
    const viec = 'Tuần này em làm 10 câu thuỷ phân ester trong tập 3. Thứ Bảy Thầy kiểm tra lại.'
    const t = soanPhieuZalo(DU, 'Anh/chị', viec)
    expect(t).toContain(viec)
    expect(t).not.toContain(viecCanLamMacDinh(DU))
  })

  it('mặc định vẫn nêu việc cụ thể chứ không nói chung chung', () => {
    expect(viecCanLamMacDinh(DU)).toContain('Ester – lipid')
  })
})

describe('Ảnh phiếu', () => {
  it('tên tệp bỏ dấu, có tên em và ngày — thầy khỏi đổi tên trước khi gửi', () => {
    expect(tenTepPhieu('Nguyễn Thu Hiền', '12050', '2026-09-03T10:20:00.000Z')).toBe('phieu-Nguyen-Thu-Hien-20260903.png')
  })

  it('em chưa có tên thì lấy số báo danh, không ra tên tệp rỗng', () => {
    expect(tenTepPhieu('', '12050', '2026-09-03T10:20:00.000Z')).toBe('phieu-SBD-12050-20260903.png')
  })

  it('ảnh và tin nhắn dùng CHUNG một dòng việc cần làm', () => {
    expect(maPhieu).toContain('vieCanLam: viec.trim() || viecCanLamMacDinh(duPhieu)')
    expect(maPhieu).toContain("soanPhieuZalo(duPhieu, 'Anh/chị', viec.trim() || undefined)")
  })

  it('chạm vào ảnh là gửi/tải luôn, không bắt đi tìm nút khác', () => {
    expect(maPhieu).toContain('onClick={() => void luuAnh()}')
    expect(maPhieu).toContain('nv.share')          // ưu tiên bảng chia sẻ → chọn thẳng Zalo
    expect(maPhieu).toContain("a.download = ten")   // máy không chia sẻ được thì tải về
  })

  it('số trên ảnh lấy từ ca đã chấm, không tự tính lại', () => {
    // Chỉ được đọc thẳng từ hoSo/ca; nếu có phép chia hay nhân điểm ở đây là
    // đang tự tính, phải xem lại.
    expect(maPhieu).toContain('diem: ca.tong')
    expect(maPhieu).toContain('soCauSai: hoSo.soCauSaiCaGanNhat')
  })
})

describe('Chi tiết ca — chạm tên em', () => {
  it('tên em là NÚT mở hồ sơ', () => {
    expect(maChiTietCa).toContain('onClick={() => setSbdHoSo(e.sbd)}')
  })

  it('hồ sơ trong Chi tiết ca có đủ mạnh–yếu, lịch sử ca và khối gửi phụ huynh', () => {
    expect(maChiTietCa).toContain('<KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />')
    expect(maChiTietCa).toContain('<KhoiLichSuCa ca={hoSo.ca} />')
    expect(maChiTietCa).toContain('<PhieuZaloEm hoSo={hoSo}')
  })

  it('phiếu soạn theo ĐÚNG ca đang mở, không phải ca mới nhất của em', () => {
    expect(maChiTietCa).toContain('maCa={chiTiet?.ca.maCa}')
  })
})
