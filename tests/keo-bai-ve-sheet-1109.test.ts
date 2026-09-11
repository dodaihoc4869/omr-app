// NÚT "KÉO BÀI VỀ SHEET" — nối vào màn Chi tiết ca, 11/09 trước ca thi thật.
//
// VÌ SAO THIẾU NÚT NÀY LÀ CHẶN CẢ CA: lúc em nộp, bài cất vào D1 TRƯỚC rồi mới
// gọi Apps Script. Gần như mọi lần cả hai đều xong. Nhưng đúng cái lúc Apps
// Script treo — cả lớp bấm Nộp trong mười giây cuối — thì lượt đó CHỈ nằm ở D1.
// Bảng điểm, phiếu Zalo, hồ sơ em đều đọc từ Sheet, nên bài kẹt lại D1 là im
// lặng biến mất khỏi mọi báo cáo.
//
// Mã `dong-bo-nguoc.ts` xong từ đợt 3 nhưng KHÔNG tệp nào của app nhập nó — nên
// `tsc` cũng chưa soi tới, và nó đang mang một lỗi kiểu thật (xem phép kiểm cuối).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
const LIB = fs.readFileSync(path.join(process.cwd(), 'src/lib/dong-bo-nguoc.ts'), 'utf8')

describe('NÚT ĐÃ NỐI THẬT VÀO MÀN HÌNH', () => {
  it('màn Chi tiết ca nhập và gọi `dongBoNguoc`', () => {
    expect(MAN).toContain("from '../lib/dong-bo-nguoc'")
    expect(MAN).toContain('await dongBoNguoc(')
  })

  it('có đếm số bài còn kẹt, và nút mang đúng con số ấy', () => {
    expect(MAN).toContain('await demChuaDay(')
    expect(MAN).toContain('Kéo ${soChuaDay} bài về Sheet')
  })

  it('CHỈ hiện khi THẬT SỰ còn bài — không bày thêm chữ cho thầy đọc', () => {
    expect(MAN).toContain('soChuaDay !== null && soChuaDay > 0')
  })

  it('máy chủ mới TẮT thì không đếm, không hiện gì', () => {
    const i = MAN.indexOf('await demChuaDay(')
    const truoc = MAN.slice(Math.max(0, i - 400), i)
    expect(truoc).toContain('if (!ch.BAT) return')
  })

  it('em ĐANG LÀM DỞ không bị tính vào số chờ kéo', () => {
    // Kéo bài của em đang làm là chốt sổ sớm cho em.
    expect(MAN).toContain("l.trang_thai !== 'dang_lam'")
    expect(LIB).toContain("if (l.trang_thai === 'dang_lam')")
  })

  it('không bắn hai lượt kéo chồng nhau', () => {
    expect(MAN).toContain('if (!chiTiet || dangKeo) return')
  })

  it('kéo xong thì ĐẾM LẠI và TẢI LẠI bảng — thầy thấy ngay kết quả thật', () => {
    const i = MAN.indexOf('const handleKeoVeSheet')
    const than = MAN.slice(i, i + 1800)
    expect(than).toContain('await demChuaDay(')
    expect(than).toContain('await tai(chiTiet.ca.maCa, true)')
  })

  it('báo rõ cả ba con số: đẩy được, bỏ qua, và CÒN LẠI', () => {
    const i = MAN.indexOf('const handleKeoVeSheet')
    const than = MAN.slice(i, i + 1800)
    expect(than).toContain('kq.daDay')
    expect(than).toContain('kq.boQua')
    expect(than).toContain('kq.con')
    expect(than).toContain('kq.hong')
  })
})

describe('LỖI ĐỢT 3 mà việc nối màn hình vừa làm lộ ra', () => {
  it('đáp án rỗng phải đúng DÁNG, không phải `{}`', () => {
    // `{}` thiếu cả ba phần I/II/III. Đẩy về Sheet một bản ghi thiếu phần thì
    // đường chấm đọc `dapAn.phanII` ra `undefined`.
    expect(LIB).not.toContain('doc(l.dap_an_json, {})')
    expect(LIB).toContain('doc(l.dap_an_json, emptyAnswerRecord())')
    expect(LIB).toContain('doc(l.integrity_json, emptyIntegrityLog())')
  })

  it('và từ nay `tsc` có soi tệp này — vì màn hình đã nhập nó', () => {
    expect(MAN).toContain("from '../lib/dong-bo-nguoc'")
  })
})

describe('LUẬT AN TOÀN CỦA ĐỒNG BỘ NGƯỢC — giữ nguyên từ đợt 3', () => {
  it('ĐÁNH DẤU đã đẩy SAU CÙNG, và chỉ lượt Sheet đã xác nhận', () => {
    const iDay = LIB.indexOf('/da-day')
    const iSubmit = LIB.indexOf('await submitAnswers(')
    expect(iSubmit).toBeGreaterThan(0)
    expect(iDay).toBeGreaterThan(iSubmit)
    expect(LIB).toContain('if (xong.length > 0)')
  })

  it('chạy TUẦN TỰ, không bắn song song vào Apps Script', () => {
    expect(LIB).toContain('for (const l of ds)')
    expect(LIB).not.toContain('Promise.all')
  })

  it('chỉ ĐẨY, không xoá gì ở máy chủ mới', () => {
    expect(LIB).not.toMatch(/\bDELETE\b|\/xoa\b/)
  })
})
