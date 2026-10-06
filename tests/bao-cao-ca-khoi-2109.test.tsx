// XEM ĐIỂM BẢN 2 · GV-1 — khối VẼ "Báo cáo cả lớp" ở Chi tiết ca (components/xem-diem-gv/BaoCaoCaLop.tsx) + chỗ nối vào ExamMonitorScreen.
// Số đã có test riêng ở bao-cao-ca-lop-2109.test.ts; ở đây soi: gập/mở theo trạng thái ca, không số trùng, không bịa khi thiếu đáp án, chạm em ⇒ báo cáo của em.
// GỌN MÃ 06/10 (lần 2, docs/gon-ma-0610-lan-2.md): khối vẽ `BaoCaoCaLopKhoi` đã bị báo cáo chi tiết mới `ca-thi/BaoCaoChiTiet.tsx` thay (28/09) và bị xoá cùng xem-diem-gv/ — đã gỡ các khối vẽ nó
// ("gập/mở", "tính lười", "số hiện ra và không bịa", "em cần thầy để ý"); chỉ còn khối soi nguồn ExamMonitorScreen (mã còn sống).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('GV-1 · chỗ nối ở ExamMonitorScreen (chỉ phần nhìn)', () => {
  const nguon = readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')

  // (ca thi 28/09) Khối gập đã THAY bằng màn Kết thúc ca + Báo cáo chi tiết — chỗ nối mới khoá ở tests/ca-thi-man-moi-2809.test.tsx.
  it('chỉ GOM số đã có: không chấm lại, không gọi mạng, không đụng công bố/khoá/rời màn; phần nặng nằm TRONG hàm tính lười, không trong phần rẻ chạy mỗi lần làm mới', () => {
    const a = nguon.indexOf('const dungNganHangBaoCao = () =>')
    const khoi = nguon.slice(a, nguon.indexOf('const tinhBaoCaoLop = () =>', a))
    expect(khoi).not.toMatch(/gradeSubmissionFull|fetch|await|ghiDiem|khoaCa|moKhoa|congBo|setLoi|useState|useMemo/)
    expect(khoi).toContain('taoChiTietCau')
    // taoChiTietCau + mergeKeepAnswers không được nằm trong phần rẻ chạy theo dsEm
    const re = nguon.slice(nguon.indexOf('const tomTatLop = useMemo'), a)
    expect(re).not.toMatch(/taoChiTietCau|mergeKeepAnswers/)
  })
})
