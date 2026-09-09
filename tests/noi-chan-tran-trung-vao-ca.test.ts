// NỐI THUẬT TOÁN CHẶN TRẦN TRÙNG VÀO ĐÚNG CHỖ BIẾT AI ĐANG TRONG PHÒNG.
//
// DE-RIENG-CHAN-TRAN-TRUNG.md đòi "điều phối cả lớp một lượt, không bốc độc lập
// từng em". Trong app chỉ có ĐÚNG MỘT chỗ biết chính xác em nào ngồi trong
// phòng: `batDauCaNay()` ở màn Ca thi, lúc thầy bấm Bắt đầu, đọc `chiTiet.dsCho`.
// Lúc MỞ ca thì chưa biết ai tới — chính vì vậy luồng đề riêng theo hồ sơ cũng
// rút ở đây chứ không rút lúc mở (thầy chốt 08/09).
//
// Tệp này khoá chỗ nối và khoá luôn mấy cái chốt an toàn quanh nó. Hành vi của
// bản thân thuật toán khoá ở `de-rieng-tran-trung.test.ts` và
// `de-rieng-blueprint.test.ts`.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
/** Thân hàm bấm Bắt đầu. */
const THAN = MAN.slice(MAN.indexOf('const batDauCaNay = async () => {'), MAN.indexOf('const kq = await batDauThi('))

describe('chỗ nối nằm đúng ở nút Bắt đầu', () => {
  it('gọi thuật toán trong `batDauCaNay`, không phải lúc mở ca', () => {
    expect(MAN).toContain("import { sinhBoTheoEm, TEN_MUC_PHAN_TANG } from '../lib/de-rieng-blueprint'")
    expect(THAN).toContain('sinhBoTheoEm(kho, dsCho, sc, chiTiet.ca.maCa)')
    // Màn MỞ ca không được đụng vào — lúc đó chưa biết em nào tới.
    const moCa = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamSetupScreen.tsx'), 'utf8')
    expect(moCa).not.toContain('sinhBoTheoEm')
  })

  it('lấy danh sách từ ĐÚNG phòng chờ, không phải danh sách lớp', () => {
    expect(THAN).toContain('const dsCho = (chiTiet.dsCho ?? []).map((x) => x.sbd).filter(Boolean)')
  })

  it('bản đồ đi vào `batDauThi` — máy chủ ghi TRƯỚC khi phát đề', () => {
    expect(MAN).toContain('const kq = await batDauThi(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, boTheoEm,')
  })
})

describe('CHỐT AN TOÀN — chỗ này sai là chấm sai cả lớp', () => {
  it('KHÔNG đụng ca chẩn đoán (đề riêng theo hồ sơ đã có bản đồ riêng)', () => {
    expect(THAN).toContain('if (!caCanDeRieng && !boTheoEm) {')
  })

  it('KHÔNG ghi đè bản đồ đã dựng — điều kiện `!boTheoEm` phải còn', () => {
    const dau = THAN.indexOf('if (!caCanDeRieng && !boTheoEm) {')
    expect(dau).toBeGreaterThan(0)
    // Và nhánh đề riêng theo hồ sơ chạy TRƯỚC, nên `boTheoEm` của nó luôn thắng.
    expect(THAN.indexOf('if (caCanDeRieng) {')).toBeLessThan(dau)
  })

  it('đòi đủ ba thứ mới chạy: ≥ 2 em · có kho · có số câu', () => {
    expect(THAN).toContain('if (dsCho.length >= 2 && kho.length > 0 && sc && sc.I + sc.II + sc.III > 0) {')
  })

  it('CHỈ gán bản đồ khi nó thật sự có em — không gán bảng rỗng', () => {
    expect(THAN).toContain('if (Object.keys(ra.boTheoEm).length > 0) {')
  })
})

describe('KHÔNG LẶNG LẼ — thầy phải thấy nó đã làm gì', () => {
  it('báo đỉnh trùng và mức phân tầng đã chọn', () => {
    expect(THAN).toContain('ra.dinhTrung === 0')
    expect(THAN).toContain('KHÔNG cặp nào trùng câu nào')
    expect(THAN).toContain('cặp trùng nhiều nhất ${ra.dinhTrung} câu')
    expect(THAN).toContain('TEN_MUC_PHAN_TANG[ra.mucPhanTang]')
  })

  it('kho thiếu thì nói rõ CÒN THIẾU BAO NHIÊU CÂU, không nói chung chung', () => {
    expect(THAN).toContain('Muốn về 0 cần thêm ${ra.thieuDeVeKhong} câu vào kho.')
  })

  it('chuyển cảnh báo của thuật toán ra màn, không nuốt', () => {
    expect(THAN).toContain('...ra.canhBao,')
  })

  it('HỎNG THÌ CA VẪN CHẠY, nhưng phải báo lỗi — không im lặng tụt về luật cũ', () => {
    expect(THAN).toContain("bcTranTrung = ['Không dựng được đề riêng chặn trùng — ca chạy theo luật cũ. '")
    expect(MAN).toContain("for (const d of bcTranTrung) showToast(d, d.startsWith('Không dựng được') ? 'error' : 'success')")
  })
})

describe('CHẤM BẰNG ĐÚNG BẢN ĐỒ EM ĐÃ LÀM', () => {
  it('màn Ca thi lấy bản đồ từ MÁY CHỦ trước, máy này sau', () => {
    // Bản đồ mới gửi lên máy chủ trong `batDauThi`, không cất ở IndexedDB. Nếu
    // chỗ chấm chỉ đọc IndexedDB thì máy khác mở ca sẽ chấm bằng luật hash
    // trong khi em làm bộ theo bản đồ — sai điểm mà màn hình không báo gì.
    expect(MAN).toContain('const boTheoEmDung = chiTiet?.boTheoEmCa ?? deRiengCa?.boTheoEm')
  })

  it('bấm Bắt đầu xong TẢI LẠI ca, để `boTheoEmCa` về trước khi chấm', () => {
    expect(MAN).toContain('await tai(chiTiet.ca.maCa)')
  })

  it('máy chủ báo ca đã phát đề trước khi có bản đồ thì KHÔNG nuốt', () => {
    expect(MAN).toContain('if (kq.thieuBoTheoEm) {')
    expect(MAN).toContain('Huỷ ca và mở lại.')
  })
})
