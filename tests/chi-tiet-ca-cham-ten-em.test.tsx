// CHI TIẾT CA — chạm tên em ⇒ hồ sơ đầy đủ (tách từ tests/phieu-zalo-va-anh.test.tsx khi thầy lệnh "Bỏ phiếu Zalo", 21/09).
// Phần phiếu/tin/ảnh Zalo đã gỡ cùng khối; ba điều KHÔNG liên quan Zalo vẫn khoá ở đây, cộng một khoá mới: hồ sơ em KHÔNG còn khối phiếu Zalo.
import { describe, expect, it } from 'vitest'
import maChiTietCa from '../src/screens/ExamMonitorScreen.tsx?raw'
import maHoSoHS from '../src/screens/HocSinhScreen.tsx?raw'
import maModalBaoCao from '../src/components/BaoCaoCaThiHocSinhModal.tsx?raw'

describe('Chi tiết ca — chạm tên em', () => {
  it('tên em là NÚT mở hồ sơ', () => {
    expect(maChiTietCa).toContain('onClick={() => setSbdHoSo(e.sbd)}')
  })

  it('hồ sơ có đủ mạnh–yếu và lịch sử ca (ở màn Hồ sơ học sinh)', () => {
    expect(maHoSoHS).toContain('<KhoiChuyenDe chuyenDe={hoSo.chuyenDe} />')
    expect(maHoSoHS).toContain('<KhoiLichSuCa ca={hoSo.ca}')
  })

  it('báo cáo trên màn Chi tiết ca CHỈ còn bốn thẻ, không thẻ phụ nào', () => {
    expect(maChiTietCa).not.toContain('extraTabs')
    expect(maModalBaoCao).not.toContain('extraTabs')
  })

  it('thầy lệnh "Bỏ phiếu Zalo": hồ sơ em KHÔNG còn khối phiếu/tin Zalo gửi phụ huynh, không còn nút bật nó', () => {
    expect(maHoSoHS).not.toMatch(/PhieuZalo|hienZalo|phieu-zalo/)
    expect(maHoSoHS).not.toContain('Nhắn phụ huynh')
    expect(maHoSoHS).not.toContain('Gửi phụ huynh')
  })
})
