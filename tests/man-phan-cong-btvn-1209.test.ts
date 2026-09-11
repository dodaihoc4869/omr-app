// MÀN PHÂN CÔNG + NÚT NỘP BTVN — phần nhìn thấy được của bài tập về nhà.
//
// Đặc tả `claude/PHAN-CONG-GIAO-BTVN.md`, và điều CẤM nặng nhất trong đó:
// **cấm đụng vào mục Gọi lên bảng đang chạy**. Nên màn cũ được lồng NGUYÊN vào
// thẻ thứ hai, không sửa một dòng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { demNguoc } from '../src/components/NutNopBtvn'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const PC = doc('src/screens/PhanCongScreen.tsx')
const APP = doc('src/App.tsx')
const THANH = doc('src/components/ThanhBenTrai.tsx')
const NUT = doc('src/components/NutNopBtvn.tsx')
const CHO_EM = doc('src/lib/btvn-cho-em.ts')
const TAKE = doc('src/screens/ExamTakeScreen.tsx')

describe('KHÔNG ĐỤNG MÀN GỌI LÊN BẢNG', () => {
  it('màn cũ được lồng NGUYÊN vào, không chép lại', () => {
    expect(PC).toContain("import GoiLenBangScreen from './GoiLenBangScreen'")
    expect(PC).toContain('<GoiLenBangScreen />')
  })

  it('đổi nhãn mục thành “Phân công” ở cả hai chỗ', () => {
    expect(APP).toContain("goilenbang: 'Phân công'")
    expect(THANH).toContain("ten: 'Phân công'")
  })
})

describe('THẺ GIAO BÀI — nói thẳng khi chưa chuyển kho đề', () => {
  it('kho rỗng thì chỉ đúng việc thầy phải làm, không để thầy đoán', () => {
    expect(PC).toContain('Kho đề trên máy chủ mới đang rỗng')
    expect(PC).toContain('Chuyển KHO ĐỀ sang máy chủ mới')
  })

  it('nút Giao khoá khi chưa chọn đủ ca và đề', () => {
    expect(PC).toContain('disabled={dangGiao || !maCa || !maDe}')
  })

  it('bảng theo dõi kê TÊN em chưa nộp', () => {
    expect(PC).toContain('t.chuaNop.map((e) =>')
  })

  it('nói rõ hạn 48 giờ chặn ở MÁY CHỦ, không phải ẩn nút', () => {
    expect(PC).toContain('máy chủ')
    expect(PC).toContain('không phải chỉ ẩn nút ở máy em')
  })

  it('kho đề đọc từ máy chủ mới, không đọc Apps Script', () => {
    expect(PC).toContain('/kho/danh-sach')
    expect(PC).not.toContain('danhSachDe(')
  })
})

describe('NÚT NỘP BTVN trên màn của em', () => {
  it('đứng cạnh nút Xem điểm', () => {
    expect(TAKE).toContain('<NutNopBtvn maCa={maCa.trim()} sbd={sbd.trim()} />')
    const i = TAKE.indexOf('Xem điểm của em')
    const j = TAKE.indexOf('<NutNopBtvn')
    expect(j).toBeGreaterThan(i)
    expect(j - i).toBeLessThan(700)
  })

  it('dùng NGUYÊN VĂN câu chữ máy chủ trả về', () => {
    // "Bạn đã quá hạn nộp BTVN" là câu thầy chốt. Máy em không được chế lại.
    expect(NUT).toContain("setLoi(r.error || 'Không mở được bài tập')")
  })

  it('máy em KHÔNG cầm mã bí mật', () => {
    expect(NUT).not.toContain('loadTeacherSecret')
    expect(CHO_EM).not.toContain('loadTeacherSecret')
    expect(CHO_EM).not.toContain('x-ma-bi-mat')
  })

  it('chờ nạp địa chỉ xong rồi mới đọc cấu hình', () => {
    expect(CHO_EM).toContain('await xongNapDiaChi()')
  })

  it('KHÔNG lọc, KHÔNG xáo, KHÔNG cắt câu của tờ đề', () => {
    const h = CHO_EM.slice(CHO_EM.indexOf('export function dungPhieuBtvn('), CHO_EM.indexOf('function thoatHtml('))
    for (const cam of ['sort(', 'shuffle', 'slice(0,']) {
      expect(h, cam).not.toContain(cam)
    }
  })

  it('thoát HTML khi in nội dung câu — đề của thầy có dấu < >', () => {
    expect(CHO_EM).toContain('function thoatHtml(')
    expect(CHO_EM).toContain("replace(/</g, '&lt;')")
  })
})

describe('ĐỒNG HỒ ĐẾM NGƯỢC', () => {
  const HAN = '2026-09-13T12:00:00.000Z'

  it('trên một ngày thì đếm theo ngày', () => {
    expect(demNguoc(HAN, Date.parse('2026-09-11T12:00:00.000Z'))).toBe('còn 2 ngày 0 giờ')
  })

  it('dưới một ngày thì đếm giờ và phút', () => {
    expect(demNguoc(HAN, Date.parse('2026-09-13T09:30:00.000Z'))).toBe('còn 2 giờ 30 phút')
  })

  it('dưới một giờ thì chỉ đếm phút', () => {
    expect(demNguoc(HAN, Date.parse('2026-09-13T11:45:00.000Z'))).toBe('còn 15 phút')
  })

  it('hết giờ thì trả RỖNG để chỗ gọi hiện câu quá hạn', () => {
    expect(demNguoc(HAN, Date.parse('2026-09-13T12:00:01.000Z'))).toBe('')
  })

  it('mốc hỏng thì trả rỗng, không nổ', () => {
    expect(demNguoc('khong-phai-ngay')).toBe('')
    expect(demNguoc('')).toBe('')
  })
})
