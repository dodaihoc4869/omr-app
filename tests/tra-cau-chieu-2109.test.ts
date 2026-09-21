// TRA CÂU CHO TỜ CHIẾU + DÒNG BÁO THIẾU NỘI DUNG (`src/lib/tra-cau-chieu.ts`, Code 1, 21/09/2026; Boss: tờ VẪN mở bằng câu dự phòng nhưng thầy phải được báo).
// Khoá: hàm tra giữ nguyên hành vi cũ của tờ chiếu (khớp nguyên văn rồi khớp đuôi); đếm câu KHÁC NHAU; 0 câu thiếu ⇒ không có chữ; nguồn màn nối đúng.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { chuThieuNoiDung, demCauThieuNoiDung, timCauTheoId } from '../src/lib/tra-cau-chieu'

const tra = (...ids: string[]) => new Map(ids.map((id) => [id, { id }]))

describe('timCauTheoId — y hệt cách tờ chiếu tra trước đây', () => {
  it('khớp nguyên văn; không có thì khớp đuôi hai chiều (mã có/không tiền tố tờ đề); không khớp ⇒ undefined', () => {
    const m = tra('DH-12-C1-B2-I-49', 'q7')
    expect(timCauTheoId(m, 'DH-12-C1-B2-I-49')).toEqual({ id: 'DH-12-C1-B2-I-49' })
    expect(timCauTheoId(m, 'B2-I-49')).toEqual({ id: 'DH-12-C1-B2-I-49' }) // id ngắn hơn: đuôi của khoá
    expect(timCauTheoId(m, 'TO-KHAC-DH-12-C1-B2-I-49')).toEqual({ id: 'DH-12-C1-B2-I-49' }) // id dài hơn: khoá là đuôi của id
    expect(timCauTheoId(m, 'khong-co')).toBeUndefined()
    expect(timCauTheoId(new Map(), 'q1')).toBeUndefined()
  })
  it('mã rỗng và khoá rỗng KHÔNG bao giờ khớp nhầm (mọi chuỗi đều "kết thúc bằng" chuỗi rỗng)', () => {
    expect(timCauTheoId(tra('q1', 'q2'), '')).toBeUndefined()
    expect(timCauTheoId(new Map([['', { id: 'rong' }]]), 'q1')).toBeUndefined()
  })
})

describe('demCauThieuNoiDung', () => {
  it('đếm câu KHÔNG tra được; một câu chia cho nhiều em chỉ tính MỘT; câu tra được không tính', () => {
    const m = tra('a', 'b')
    expect(demCauThieuNoiDung(['a', 'b', 'a'], m)).toBe(0)
    expect(demCauThieuNoiDung(['a', 'x', 'x', 'y', 'b', 'x'], m)).toBe(2)
    expect(demCauThieuNoiDung([], m)).toBe(0)
    expect(demCauThieuNoiDung(['x'], new Map())).toBe(1)
  })
  it('khớp đuôi cũng coi là TRA ĐƯỢC (khớp đúng điều kiện mà tờ chiếu dùng để không thay thế)', () => {
    expect(demCauThieuNoiDung(['B2-I-49'], tra('DH-12-C1-B2-I-49'))).toBe(0)
  })
})

describe('chuThieuNoiDung — lời báo mềm', () => {
  it('0 câu thiếu ⇒ null (KHÔNG hiện dòng báo); ≥ 1 ⇒ đúng chữ theo chuẩn: có nhãn + đơn vị, nói thật', () => {
    expect(chuThieuNoiDung(0)).toBeNull()
    expect(chuThieuNoiDung(-3)).toBeNull()
    expect(chuThieuNoiDung(1)).toBe('1 câu chưa tra được nội dung đề — tờ chiếu sẽ hiện dòng thay thế')
    expect(chuThieuNoiDung(12)).toBe('12 câu chưa tra được nội dung đề — tờ chiếu sẽ hiện dòng thay thế')
    expect(chuThieuNoiDung(3)).not.toMatch(/lỗi|hỏng|kém|giỏi|nắm chắc/i)
  })
})

describe('màn Gọi lên bảng nối đúng (khoá nguồn)', () => {
  const ma = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')
  it('một hàm tra cho cả tờ chiếu lẫn dòng báo; dòng báo tính TRƯỚC khi mở tờ từ đúng nguồn của tờ; hiện chỉ khi có câu thiếu; không chặn, không hộp thoại', () => {
    expect(ma).toContain("from '../lib/tra-cau-chieu'")
    expect(ma).toContain('timCauTheoId(traCau, p.cau.id)') // tờ chiếu
    expect(ma).toContain('demCauThieuNoiDung(ids, traCau)') // dòng báo
    expect(ma).toMatch(/const dongLen = kqBuoi \? kqBuoi\.dong\.filter\(\(d\) => d\.tang === 'len_bang' && d\.em\) : \[\]/) // cùng nguồn `dongLenBang` của moMayChieu
    expect(ma).toContain('(kq?.phanCong ?? []).map((p) => p.cau.id)')
    expect(ma).toContain('const dongBaoThieuNoiDung = chuThieuNoiDung(soCauThieuNoiDung)')
    // hiện dòng chỉ khi có chữ (0 câu ⇒ null ⇒ không vẽ), đúng MỘT dòng: khối buổi hoặc, khi chưa có khối buổi, ngay trên nút chiếu viền
    expect((ma.match(/\{dongBaoThieuNoiDung && \(/g) ?? []).length).toBe(1)
    expect(ma).toContain('!kqBuoi && dongBaoThieuNoiDung && (')
    expect((ma.match(/data-thieu-noi-dung/g) ?? []).length).toBe(2)
    // tờ vẫn mở bằng câu dự phòng, không chặn: vẫn còn câu dự phòng và không có hộp thoại xác nhận cho việc này
    expect(ma).toContain('Tạo câu luyện dự phòng đảm bảo tờ chiếu 100% mở được')
    expect(ma).not.toMatch(/confirm\([^)]*tra được/)
  })
})
