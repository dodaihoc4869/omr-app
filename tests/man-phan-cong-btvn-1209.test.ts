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
    // Từ 12/09 tick được NHIỀU tờ đề, nên điều kiện là "đã tick ít nhất một tờ".
    expect(PC).toContain('disabled={dangGiao || !maCa || daChon.size === 0}')
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
    const h = CHO_EM.slice(CHO_EM.indexOf('export async function dungPhieuBtvn('), CHO_EM.indexOf('function veCauLuyen('))
    for (const cam of ['sort(', 'shuffle', 'slice(0,']) {
      expect(h, cam).not.toContain(cam)
    }
  })

  it('thoát HTML khi in nội dung câu — đề của thầy có dấu < >', () => {
    // Phiếu nay dựng bằng CHÍNH bộ `html-phieu.ts` đang chạy cho phiếu khắc
    // phục, nên việc thoát chữ do `thoat`/`chuHtml` bên ấy lo — một chỗ, không
    // hai bộ dựng song song (và nhờ vậy `check:mau` không còn bắt mã màu gõ tay).
    expect(CHO_EM).toContain("await import('./html-phieu')")
    expect(CHO_EM).toContain('taiLieuHtml(')
    expect(CHO_EM).toContain('theCauHtml(')
    // Đáp án bị xoá khỏi DỮ LIỆU trước khi dựng — em xem mã nguồn cũng không thấy.
    expect(CHO_EM).toContain('boLoiGiai(')
    const HP = fs.readFileSync(path.join(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8')
    expect(HP).toContain("replace(/</g, '&lt;')")
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

// CHỌN ĐỀ — DÙNG ĐÚNG HỘP CỦA MÀN MỞ CA.
//
// Thầy chốt 12/09, sau khi nhìn bản đầu (một cây tự viết riêng): "phần giao
// btvn tôi muốn hiển thị đúng như trong mở ca". Nên hộp riêng ấy bị gỡ, và màn
// này lồng NGUYÊN `HopChonDe` — thứ Mở ca và Gọi lên bảng đang dùng. Một hộp,
// ba màn: sửa một chỗ là cả ba đổi theo, và thầy chỉ phải học một cách bấm.
describe('CHỌN ĐỀ Y NHƯ MÀN MỞ CA', () => {
  const WK = doc('server/src/index.ts')
  const MO_CA = doc('src/screens/ExamSetupScreen.tsx')

  it('lồng nguyên HopChonDe, không dựng hộp thứ hai', () => {
    expect(PC).toContain('<HopChonDe')
    expect(PC).toContain("import HopChonDe from '../components/HopChonDe'")
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/CayChonDe.tsx'))).toBe(false)
  })

  it('cùng NGUỒN và cùng cách tách phần với màn Mở ca', () => {
    for (const x of ['tachNhieuTheoPhan(', 'loadExamSources()']) {
      expect(PC, x).toContain(x)
      expect(MO_CA, x).toContain(x)
    }
    // Cùng bộ tham số: tick nhiều, có chip nhóm, có nút chọn cả nhánh.
    for (const x of ['chonNhieu', 'nhomLoc={nhomLoc}', 'onChonTatCa']) expect(PC, x).toContain(x)
  })

  it('CHỈ hiện tờ máy chủ đã có — tick tờ chưa chuyển thì bấm Giao mới báo là quá muộn', () => {
    expect(PC).toContain('maTrenMayChu')
    expect(PC).toContain('nguonGiaoDuoc')
    // Ẩn bao nhiêu tờ thì nói ra con số, kèm cách làm cho chúng hiện lên.
    expect(PC).toContain('soChuaChuyen')
    expect(PC).toContain('Chuyển KHO ĐỀ sang máy chủ mới')
  })

  it('đếm số câu theo ĐÚNG phần đã tick, không lấy tổng cả tờ', () => {
    expect(PC).toContain('d.phanI.length + d.phanII.length + d.phanIII.length')
  })

  it('máy chủ hiểu mã đã tách theo phần — hậu tố TN · DS · TLN', () => {
    const han = WK.slice(WK.indexOf('export function goPhanKhoiMaDe('), WK.indexOf('/** THẦY GIAO BÀI cho một ca đã thi.'))
    expect(han).toContain("['-TN', 'I']")
    expect(han).toContain("['-DS', 'II']")
    expect(han).toContain("['-TLN', 'III']")
    // Mã không hậu tố �⇒ cả tờ, để ca giao trước khi có tính năng này vẫn đọc được.
    expect(han).toContain("return { goc: ma, phan: null }")
  })

  it('hậu tố phải khớp TỪNG KÝ TỰ với bảng bên máy thầy', () => {
    const TP = doc('src/lib/tach-phan-de.ts')
    expect(TP).toContain("{ I: 'TN', II: 'DS', III: 'TLN' }")
  })

  it('giao bài ĐẾM CÂU THẬT theo phần, không lấy tổng cả tờ làm số câu một phần', () => {
    const han = WK.slice(WK.indexOf('async function giaoBtvn('), WK.indexOf('/** EM MỞ BÀI TẬP CỦA MÌNH.'))
    expect(han).toContain("cau.filter((c) => String(c.phan ?? '') === phan).length")
    expect(han).toContain('Những tờ đã tick không có câu nào')
  })

  it('em mở bài chỉ nhận ĐÚNG phần đã tick, và mỗi tờ chỉ tải một lần', () => {
    const han = WK.slice(WK.indexOf('async function btvnCuaEm('), WK.indexOf('async function nopBtvn('))
    expect(han).toContain('const daDoc = new Map<string, Record<string, unknown>[]>()')
    expect(han).toContain("phan ? cau.filter((x) => String(x.phan ?? '') === phan) : cau")
  })

  it('máy chủ nhận NHIỀU tờ đề một lượt giao, và vẫn nhận dáng một tờ của bản cũ', () => {
    const han = WK.slice(WK.indexOf('async function giaoBtvn('), WK.indexOf('/** EM MỞ BÀI TẬP CỦA MÌNH.'))
    expect(han).toContain('Array.isArray(b.dsMaDe)')
    expect(han).toContain("String(b.maDe ?? '').trim()")
    // Thiếu tờ nào thì NÓI ĐÚNG TỜ ẤY — tick năm tờ mà báo chung chung thì
    // không biết bỏ tờ nào.
    expect(han).toContain('Không có trong kho:')
  })

  it('em mở bài thì gộp câu của mọi tờ, đúng thứ tự thầy tick, KHÔNG xáo', () => {
    const han = WK.slice(WK.indexOf('async function btvnCuaEm('), WK.indexOf('async function nopBtvn('))
    expect(han).toContain("String(bt.ma_de ?? '')")
    expect(han).toContain('docCauTuGoiDe(')
    for (const cam of ['sort(', 'shuffle', 'Math.random']) expect(han, cam).not.toContain(cam)
  })
})
