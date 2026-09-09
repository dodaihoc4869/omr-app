// PHIẾU KHẮC PHỤC NGAY SAU KHI THI PHẢI NỘP ĐƯỢC.
//
// Thầy bắt được 08/09: "ca thi mới tôi bấm tạo đề khắc phục ngay sau lúc thi
// vẫn không có thanh nộp".
//
// Nguyên nhân: báo cáo em xem ngay sau khi nộp do CHÍNH MÁY EM dựng tại chỗ
// (`ExamTakeScreen` → `dungPhieuMayEm`), không phải phiếu thầy cất trên máy
// chủ. Nó không có `linkBaiTap`, mà `nopKhacPhuc` chấm theo mã phiếu — nên
// phiếu cũ (thầy đã dựng, có mã) thì nộp được, ca vừa thi xong thì không.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const goc = join(__dirname, '..')
const doc = (p: string) => readFileSync(join(goc, p), 'utf8')
const GS = doc('docs/apps-script-kiem-tra.gs')
const MAN_THI = doc('src/screens/ExamTakeScreen.tsx')
const API = doc('src/lib/exam-api.ts')

const KHOI = GS.slice(GS.indexOf("if (action === 'ghiPhieuKhacPhuc')"), GS.indexOf("if (action === 'nopKhacPhuc')"))

describe('máy em xin được mã cho bộ câu vừa nhận', () => {
  it('có lệnh công khai, KHÔNG đòi mã bí mật (máy em không bao giờ có)', () => {
    expect(KHOI.length).toBeGreaterThan(200)
    expect(KHOI).not.toContain('kiemTraMaBiMat_')
  })

  it('CỔNG là lượt thi CÓ THẬT của chính em, đúng máy đã thi', () => {
    // Cùng cổng với `cauKhacPhuc`: không ai xin mã cho ca mình không thi.
    expect(KHOI).toContain('quaCongLuot_(shLGP.getRange(1, 1, nLGP, 8).getValues(), maCaGP, sbdGP, idTbGP)')
  })

  it('DÙNG LẠI MÃ CŨ của em trong ca đó — không đẻ mã mới mỗi lần mở báo cáo', () => {
    expect(KHOI).toContain("String(dataGP[i][8] || '') === 'baitap'")
    expect(KHOI).toContain('if (!maGP) maGP = sinhToken_()')
  })

  it('ghi đúng ba cột `nopKhacPhuc` soi: mã ca, số báo danh, loại baitap', () => {
    expect(KHOI).toContain("shPGP.appendRow([maGP, maCaGP, sbdGP, goiGP.tt.hoTen, luuJsonLon_('phieu_' + maGP, goiGP, ''), lucGP, 0, '', 'baitap'])")
  })

  it('CHẶN gói rỗng và gói quá lớn', () => {
    expect(KHOI).toContain('if (dsCauGP.length === 0 || dsCauGP.length > TOI_DA_CAU_NOPKP) return jsonResponse_(LOI_GP)')
  })

  it('ĐÁNH ĐỔI ghi thẳng trong mã, không giấu', () => {
    expect(KHOI).toContain('ĐÁNH ĐỔI, ghi thẳng: đáp án trong gói do máy em gửi lên, máy chủ không')
  })
})

describe('màn làm bài gắn link vào báo cáo', () => {
  it('xin mã MỘT LẦN cho mỗi bộ câu, không gọi lại khi React dựng lại', () => {
    // 08/09: đổi từ "cờ đã xin" sang "giữ nguyên lời hứa đang bay" — hai chỗ
    // cùng cần link (hiệu ứng xin trước, và cú bấm của em) thì CHỜ CHUNG một
    // lượt gọi, thay vì chỗ thứ hai thấy cờ đã bật rồi bỏ đi tay không.
    expect(MAN_THI).toContain('const maBaiTapRef = useRef<{ khoa: string; hua: Promise<string> } | null>(null)')
    expect(MAN_THI).toContain('if (!maBaiTapRef.current || maBaiTapRef.current.khoa !== khoa) {')
    expect(MAN_THI).toContain('maBaiTapRef.current = { khoa, hua }')
  })

  it('gắn `linkBaiTap` vào bản báo cáo đưa cho màn phiếu', () => {
    expect(MAN_THI).toContain('linkBaiTap: taoLinkPhieu(`${location.origin}${import.meta.env.BASE_URL}`, maBaiTapEm)')
    expect(MAN_THI).toContain('<PhieuScreen duCoSan={phieuCuaEmCoLink} laCuaEm xinLink={xinLinkBaiTap} />')
  })

  it('KHÔNG xin mã khi chưa có câu khắc phục nào', () => {
    expect(MAN_THI).toContain('if (!url || !a || !phieuCuaEm || soCauKhacPhuc === 0) return')
  })

  it('xin hỏng thì im lặng — phiếu vẫn mở được, chỉ chưa nộp được', () => {
    expect(MAN_THI).toContain("const ma = await maBaiTapRef.current.hua.catch(() => '')")
    // Và XIN LẠI ĐƯỢC: treo một lời hứa hỏng là em bấm mãi không bao giờ có mã.
    expect(MAN_THI).toContain('if (maBaiTapRef.current && maBaiTapRef.current.khoa === khoa) maBaiTapRef.current = null')
    // Và khối bài luyện đã có sẵn dòng nói vì sao chưa nộp được.
    // CẬP NHẬT 09/09: đổi tên thành biến `lyDoKhongNop` vì lý do nay dùng hai
    // nơi — dòng trên trang app, và một dòng nhét thẳng vào phiếu (lớp phủ toàn
    // màn hình che mất dòng thứ nhất). Ý định giữ nguyên.
    expect(doc('src/components/KhoiBaiLuyen.tsx')).toContain("const lyDoKhongNop = nop ? '' : !maPhieu ? 'thieu_ma'")
  })

  it('client gửi ĐÚNG ba trường máy chủ cần để chấm', () => {
    expect(MAN_THI).toContain('.map((c) => ({ id: c.id, phan: c.phan, dapAn: c.dapAn }))')
    expect(API).toContain("postJson(scriptUrl, { action: 'ghiPhieuKhacPhuc', maCa, sbd, idThietBi, cau, hoTen: tt.hoTen || '', tenChuyenDe: tt.tenChuyenDe || '' }, 45)")
  })
})
