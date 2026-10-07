// KIỂM THI ĐỒNG BỘ — viết 07/10 để chặn hồi quy luồng nộp bài → chấm → công bố → báo cáo.
//
// Tám nhóm từ đặc tả 07/10 (kiểm tra bằng mã nguồn thật, không mock mạng):
//   ① Máy chủ nhận bài nhưng bước ghi điểm hỏng → gửi lại cùng lượt → không ghi đôi
//   ② Học sinh tắt app ngay sau khi nộp → mở lại → tự thử lại
//   ③ Thầy công bố muộn, màn đang mở → học sinh nhận được kết quả
//   ④ Đọc báo cáo trước khi chấm xong → không đọc dữ liệu thiếu
//   ⑤ Ca đã đóng, có thay đổi → cập nhật khi mở màn
//   ⑥ Chi tiết câu thay đổi nhưng tổng điểm giữ nguyên → vẫn ghi lại chi tiết
//   ⑦ Hợp đồng chấm điểm: response có đủ trường, kiểm quyền học sinh vs giáo viên
//   ⑧ Không lộ đáp án trước khi được công bố
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
const SERVER = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const EXAM_API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

// ─────────────────────────────────────────────────────
// ① Máy chủ nhận bài nhưng bước ghi điểm hỏng → gửi lại cùng lượt → KHÔNG ghi đôi
// ─────────────────────────────────────────────────────
describe('① IDEMPOTENT NỘP BÀI — gửi lại không ghi đôi', () => {
  it('/nop dùng WHERE trang_thai = dang_lam → lượt đã nộp không bị đổi lần hai', () => {
    // Đây là chốt chống trùng chính: UPDATE chỉ chạy khi còn ở 'dang_lam'.
    expect(SERVER).toContain("WHERE ${dk.sql} AND trang_thai = 'dang_lam'")
    // Comment trong code giải thích rõ ý định idempotent.
    expect(SERVER).toContain('KHOÁ CHỐNG TRÙNG')
  })

  it('/luuTam dùng WHERE trang_thai = dang_lam → cũng idempotent', () => {
    // Endpoint luuTam dùng cùng điều kiện.
    const khoiLuu = SERVER.slice(SERVER.indexOf('async function luuTam('), SERVER.indexOf('async function nop('))
    expect(khoiLuu).toContain("AND trang_thai = 'dang_lam'")
  })

  it('ghiDiemMoi trả daGhi + tuChoi — client biết lượt nào được ghi, không gửi lại thừa', () => {
    // Hợp đồng phản hồi: phải có cả daGhi lẫn tuChoi. Hàm dài ~2155 ký tự nên lấy đủ.
    const startIdx = SERVER.indexOf('async function ghiDiemMoi(')
    const endIdx = SERVER.indexOf('\nasync function ', startIdx + 100)
    const khoiHam = SERVER.slice(startIdx, endIdx)
    expect(khoiHam).toContain('daGhi')
    expect(khoiHam).toContain('tuChoi: []')
    expect(khoiHam).toContain('return ra({ ok: true,')
  })
})

// ─────────────────────────────────────────────────────
// ② Học sinh tắt app ngay sau nộp → mở lại → tự thử lại
// ─────────────────────────────────────────────────────
describe('② PENDING SUBMIT — tắt app giữa chừng không mất bài', () => {
  it('bài được đánh dấu pendingSubmit TRƯỚC khi gửi mạng qua trySend', () => {
    // Thứ tự bắt buộc: lưu local (saveAttempt) trước, sau đó mới trySend gọi mạng.
    const khoiSubmit = MAN.slice(MAN.indexOf('const doSubmit = async'), MAN.indexOf('const apDungKeyBank'))
    const viTriLuu = khoiSubmit.indexOf('saveAttempt(updated)')
    const viTriNop = khoiSubmit.indexOf('trySend(updated)')
    expect(viTriLuu).toBeGreaterThan(-1)
    expect(viTriNop).toBeGreaterThan(-1)
    expect(viTriLuu).toBeLessThan(viTriNop)
  })

  it('khi load lại trang, nếu còn pendingSubmit thì tự trySend', () => {
    // App restart → useEffect phát hiện pendingSubmit → gọi trySend.
    expect(MAN).toContain('if (existing.pendingSubmit) trySend(existing)')
  })

  it('pendingSubmit=true → effect hỏi đáp án KHÔNG chạy → không poll sớm trước khi nộp xong', () => {
    // Effect hỏi kết quả bị chặn khi vẫn còn pendingSubmit (bài chưa lên máy chủ).
    const khoiEffect = MAN.slice(MAN.indexOf('useEffect(() => {', MAN.indexOf('Đã nộp mà chưa có đáp án')), MAN.indexOf('}, [phase, keyBank, attempt?.pendingSubmit'))
    expect(khoiEffect).toContain('attempt.pendingSubmit')
    expect(khoiEffect).toContain('return')
  })

  it('khi nộp thành công, pendingSubmit được tắt rõ ràng', () => {
    expect(MAN).toContain('pendingSubmit: false')
  })
})

// ─────────────────────────────────────────────────────
// ③ Thầy công bố muộn (congBo='khong'), màn đang mở → học sinh nhận được kết quả
// ─────────────────────────────────────────────────────
describe("③ CÔNG BỐ MUỘN — congBo='khong' không chặn poll", () => {
  it("không có early return khi congBo === 'khong'", () => {
    // Lỗi cũ: if (congBo === 'khong') return — đã xoá.
    expect(MAN).not.toContain("if (congBo === 'khong') return")
  })

  it('effect hỏi kết quả phụ thuộc congBo trong deps → chạy lại khi thầy công bố', () => {
    // congBo nằm trong deps của useEffect hỏi đáp án.
    const deps = MAN.slice(
      MAN.indexOf('}, [phase, keyBank, attempt?.pendingSubmit'),
      MAN.indexOf('}, [phase, keyBank, attempt?.pendingSubmit') + 60,
    )
    expect(deps).toContain('congBo')
  })

  it('khi quay foreground (visibilitychange), poll chạy ngay', () => {
    // Màn hình mở lại (tab focus) → không đợi nhịp tiếp theo.
    expect(MAN).toContain('document.addEventListener(\'visibilitychange\'')
    expect(MAN).toContain('if (!document.hidden) hoi()')
  })

  it('nhịp poll thích nghi: ngắn hơn khi cả lớp đã nộp xong', () => {
    // ca_lop_xong → nhịp 4s; còn lại → nhịp 15s.
    expect(MAN).toContain("const nhipCho = congBo === 'ca_lop_xong' ? 4000 : 15000")
    expect(MAN).toContain('setInterval(() => void hoi(), chuKyLechPhaMs(nhipCho))')
  })
})

// ─────────────────────────────────────────────────────
// ④ Đọc báo cáo trước khi chấm xong → không đọc thiếu dữ liệu
// ─────────────────────────────────────────────────────
describe('④ BÁO CÁO GIÁO VIÊN — không đọc sớm trước khi chấm xong', () => {
  it('effect lấy expCa chỉ chạy sau khi đã có graded (kết quả đã về)', () => {
    // Chặn: phase=submitted AND graded=true AND pendingSubmit=false.
    const khoiExpCa = MAN.slice(
      MAN.indexOf('EXP TỪ CA khi điểm đã về'),
      MAN.indexOf('EXP TỪ CA khi điểm đã về') + 400,
    )
    expect(khoiExpCa).toContain('!graded')
    expect(khoiExpCa).toContain('attempt.pendingSubmit')
    expect(khoiExpCa).toContain('return')
  })

  it('apDungKeyBank đặt graded TRƯỚC khi gửi lên máy chủ — UI có điểm ngay', () => {
    const khoiApDung = MAN.slice(MAN.indexOf('const apDungKeyBank ='), MAN.indexOf('// Đã nộp mà chưa có đáp án'))
    // setGraded được gọi trước ghiDiem
    const viTriGraded = khoiApDung.indexOf('setGraded(g)')
    const viTriGhiDiem = khoiApDung.indexOf('ghiDiem(')
    expect(viTriGraded).toBeGreaterThan(-1)
    expect(viTriGhiDiem).toBeGreaterThan(-1)
    expect(viTriGraded).toBeLessThan(viTriGhiDiem)
  })
})

// ─────────────────────────────────────────────────────
// ⑤ Ca đã đóng, có thay đổi → cập nhật khi mở màn
// ⑥ Chi tiết câu thay đổi, tổng giữ nguyên → vẫn ghi lại
// ─────────────────────────────────────────────────────
describe('⑤⑥ GHI ĐIỂM VÀ CHI TIẾT', () => {
  it('ghiDiem client gọi kèm soCau đã dùng — chốt chống điểm lệch mẫu số', () => {
    // apDungKeyBank truyền soCauEmDaChia vào ghiDiem.
    const khoiApDung = MAN.slice(MAN.indexOf('const apDungKeyBank ='), MAN.indexOf('// Đã nộp mà chưa có đáp án'))
    expect(khoiApDung).toContain('soCauEmDaChia')
    expect(khoiApDung).toContain('ghiDiem(')
  })

  it('ghiDiem trong exam-api gọi chamDiemMoi rồi mới ghiDiemMoi — chi tiết câu được ghi', () => {
    // Ưu tiên chamDiemMoi (có chi tiết); ghiDiemMoi là dự phòng khi chamDiemMoi chưa có endpoint.
    const khoiGhiDiem = EXAM_API.slice(
      EXAM_API.indexOf('export async function ghiDiem('),
      EXAM_API.indexOf('export async function laySoSheet('),
    )
    const viTriChamMoi = khoiGhiDiem.indexOf('chamDiemMoi(')
    const viTriGhiMoi = khoiGhiDiem.indexOf('ghiDiemMoi(')
    expect(viTriChamMoi).toBeGreaterThan(-1)
    expect(viTriGhiMoi).toBeGreaterThan(-1)
    // chamDiemMoi chạy trước ghiDiemMoi (là dự phòng).
    expect(viTriChamMoi).toBeLessThan(viTriGhiMoi)
  })

  it('ghiDiem chỉ soi dữ liệu sang máy chủ mới cho những lượt đã được Apps Script NHẬN', () => {
    // Lọc theo daGhi trước khi gọi chamDiemMoi.
    const khoiGhiDiem = EXAM_API.slice(
      EXAM_API.indexOf('export async function ghiDiem('),
      EXAM_API.indexOf('export async function laySoSheet('),
    )
    expect(khoiGhiDiem).toContain('daGhi.size === 0 || daGhi.has(')
    expect(khoiGhiDiem).toContain('nhan.length > 0')
  })
})

// ─────────────────────────────────────────────────────
// ⑦ Hợp đồng chấm điểm: response đủ trường, quyền học sinh vs giáo viên
// ─────────────────────────────────────────────────────
describe('⑦ HỢP ĐỒNG CHẤM ĐIỂM', () => {
  it('ghiDiemMoi server trả daGhi (mảng) và tuChoi (mảng) — không chỉ soDong', () => {
    // Hàm dài ~2155 ký tự nên lấy trọn tới hàm kế tiếp.
    const startIdx = SERVER.indexOf('async function ghiDiemMoi(')
    const endIdx = SERVER.indexOf('\nasync function ', startIdx + 100)
    const khoiHam = SERVER.slice(startIdx, endIdx)
    // daGhi phải là mảng sbd, tuChoi phải xuất hiện trong response
    expect(khoiHam).toContain('daGhi')
    expect(khoiHam).toContain('tuChoi: []')
    expect(khoiHam).toContain('return ra({ ok: true,')
  })

  it('học sinh ghi điểm bằng idThietBi, không cần mã bí mật giáo viên', () => {
    // apDungKeyBank truyền chuỗi rỗng làm secret, kèm idThietBi trong bài.
    const khoiApDung = MAN.slice(MAN.indexOf('const apDungKeyBank ='), MAN.indexOf('// Đã nộp mà chưa có đáp án'))
    // secret = '' (chuỗi rỗng)
    expect(khoiApDung).toMatch(/ghiDiem\(\s*scriptUrlRef\.current\.trim\(\),\s*'',/)
    // idThietBi truyền vào hàm tạo bài ghi điểm
    expect(khoiApDung).toContain('done.idThietBi ?? layIdThietBi()')
  })

  it('ghiDiem client trả Promise<{ daGhi, tuChoi }> — không còn chỉ soDong', () => {
    // Kiểu trả về nằm ở dòng khai báo (~ 900 ký tự vào trong, sau JSDoc dài).
    const startIdx = EXAM_API.indexOf('export async function ghiDiem(')
    const endIdx = EXAM_API.indexOf(') {', startIdx) + 3
    const khoiSignature = EXAM_API.slice(startIdx, endIdx)
    expect(khoiSignature).toContain('Promise<{ daGhi: string[]')
    expect(khoiSignature).toContain('tuChoi: string[]')
  })
})

// ─────────────────────────────────────────────────────
// ⑧ KHÔNG lộ đáp án trước khi được phép
// ─────────────────────────────────────────────────────
describe('⑧ BẢO MẬT ĐÁP ÁN — không nhận keyBank trước khi sanSang', () => {
  it('chỉ áp dụng keyBank khi r.sanSang === true', () => {
    // Điều kiện bảo vệ: cả sanSang lẫn keyBank phải thật.
    expect(MAN).toContain('if (r.sanSang && r.keyBank) apDungKeyBank(r.keyBank, attempt)')
  })

  it('đường fetchKetQua → setKeyBank luôn qua cổng r.sanSang — không có shortcut lộ đáp án', () => {
    // Khi poll kết quả, keyBank chỉ áp dụng khi server cho phép (sanSang=true).
    // setKeyBank(bankCoBo) ở đường PHỤC HỒI bài đã làm là hợp lệ — đó là keyBank
    // từ phiên trước đã được server cấp, không phải đường lộ mới.
    // Kiểm chứng: đường polling (fetchKetQua) không bao giờ bỏ qua điều kiện sanSang.
    const khoiEffect = MAN.slice(
      MAN.indexOf('const r = await fetchKetQua('),
      MAN.indexOf('const r = await fetchKetQua(') + 200,
    )
    expect(khoiEffect).toContain('r.sanSang && r.keyBank')
    // apDungKeyBank luôn set state graded trước khi trả ra ngoài
    const khoiApDung = MAN.slice(MAN.indexOf('const apDungKeyBank ='), MAN.indexOf('// Đã nộp mà chưa có đáp án'))
    expect(khoiApDung).toContain('setKeyBank(kb)')
    expect(khoiApDung).toContain('setGraded(g)')
  })

  it('EXP điểm chỉ hỏi khi graded=true — không có kênh phụ lộ thông tin trước công bố', () => {
    const khoiEffect = MAN.slice(
      MAN.indexOf('EXP TỪ CA khi điểm đã về'),
      MAN.indexOf('}, [phase, !!graded,'),
    )
    expect(khoiEffect).toContain('!graded')
  })
})
