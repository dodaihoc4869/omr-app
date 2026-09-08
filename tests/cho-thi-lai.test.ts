// CHO THI LẠI — ba việc trong một nút (thầy chốt 08/09).
//
// > "trong ca thi nút cho thi lại sẽ xoá lịch sử của bài thi trước, khi bấm cho
// >  thi lại học sinh đăng nhập đúng máy đã thi trước và rút lại đề mới"
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { boCauCu } from '../src/lib/thi-lai'
import type { PublicExamBank } from '../src/data/examContent'

const goc = join(__dirname, '..')
const doc = (p: string) => readFileSync(join(goc, p), 'utf8')
const GS = doc('docs/apps-script-kiem-tra.gs')
const THI_LAI = doc('src/lib/thi-lai.ts')
const MAN_CA = doc('src/screens/ExamMonitorScreen.tsx')

const KHOI_TL = GS.slice(GS.indexOf("if (action === 'choThiLai')"), GS.indexOf("if (action === 'moKhoa')"))

const bank: PublicExamBank = {
  phanI: Array.from({ length: 12 }, (_, i) => ({ id: `I-${i}`, text: `c${i}`, choices: ['a', 'b', 'c', 'd'] })),
  phanII: Array.from({ length: 6 }, (_, i) => ({ id: `II-${i}`, text: `c${i}`, ideas: ['a', 'b', 'c', 'd'] })),
  phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `III-${i}`, text: `c${i}` })),
  soCau: { I: 4, II: 2, III: 2 },
} as unknown as PublicExamBank

describe('1. XOÁ LỊCH SỬ LƯỢT CŨ', () => {
  it('xoá lượt, chi tiết từng câu, bản đồ sai; tổng hợp chuyên đề về 0', () => {
    expect(KHOI_TL).toContain('shTL.deleteRow(xoaTL[i])')
    expect(KHOI_TL).toContain('ctShTL.deleteRow(xoaCt[i])')
    expect(KHOI_TL).toContain('bdSh.deleteRow(i + 1)')
    expect(KHOI_TL).toContain("tdSh.getRange(i + 1, 4, 1, 4).setValues([[0, 0, '', lucTL]])")
  })

  it('xoá TỪ DƯỚI LÊN — xoá từ trên xuống là chỉ số các dòng sau trôi hết', () => {
    expect(KHOI_TL).toContain('xoaTL.sort(function (a, b) { return b - a })')
    expect(KHOI_TL).toContain('xoaCt.sort(function (a, b) { return b - a })')
  })

  it('KHÔNG đụng phiếu đã dựng — link có thể đã gửi phụ huynh', () => {
    expect(KHOI_TL).not.toContain('SHEET_PHIEU')
    expect(GS).toContain('KHÔNG ĐỤNG PHIẾU đã dựng')
  })

  it('EM ĐANG LÀM thì từ chối, không cắt ngang bài đang gõ', () => {
    expect(KHOI_TL).toContain("if (String(dataTL[i][7] || '') === 'dang_lam') return jsonResponse_({ ok: false")
  })

  it('em chưa có lượt nào thì báo, không lặng lẽ tạo lượt rỗng', () => {
    expect(KHOI_TL).toContain("if (xoaTL.length === 0) return jsonResponse_({ ok: false, error: 'Em này chưa có lượt nào trong ca' })")
  })
})

describe('2. KHOÁ ĐÚNG MÁY ĐÃ THI', () => {
  it('giữ id thiết bị của lượt cũ rồi ghi vào lượt mới', () => {
    expect(KHOI_TL).toContain("if (lan >= lanCaoNhat && String(dataTL[i][3] || '')) { mayCu = String(dataTL[i][3]); lanCaoNhat = lan }")
    expect(KHOI_TL).toContain('rowMoiTL[3] = mayCu')
  })

  it('cổng vào thi CHẶN máy khác, và chỉ chặn khi có id — không đổi hành vi cũ', () => {
    expect(GS).toContain("if (luot && luot.trangThai === 'duoc_duyet_lai' && luot.idThietBi && idThietBi && luot.idThietBi !== idThietBi)")
    expect(GS).toContain("return { ok: false, lyDo: 'sai_may' }")
  })

  it('em bị chặn được nói ĐÚNG việc cần làm, không phải một mã lỗi', () => {
    expect(doc('src/lib/exam-api.ts')).toContain('Thầy cho em thi lại trên ĐÚNG máy em đã thi lần trước.')
  })

  it('lượt cũ KHÔNG ghi máy thì nói thẳng là không khoá được', () => {
    expect(KHOI_TL).toContain("'thi lại — lượt cũ không ghi máy, không khoá được'")
    expect(MAN_CA).toContain('lượt cũ không ghi máy nên KHÔNG khoá được máy')
  })
})

describe('3. RÚT LẠI ĐỀ MỚI', () => {
  it('đề mới TRÁNH câu cũ, seed gắn giờ nên bấm hai lần ra hai đề', () => {
    expect(THI_LAI).toContain('tranhQid: cu')
    expect(THI_LAI).toContain('hashSeed(`${ma}:${em}:thi-lai:${Date.now()}`)')
  })

  it('KHÔNG đổi luật hash — ghi thẳng bộ câu mới vào bản đồ của ca', () => {
    expect(KHOI_TL).toContain('boTL[sbdTL] = body.boCauMoi')
    // Không đụng chữ ký `assignStudentQuestions`: ca cũ chấm lại phải ra điểm cũ.
    expect(THI_LAI).toContain('assignStudentQuestions(bank, maCa, sbd)')
    expect(doc('src/lib/exam-assign.ts')).toContain('export function assignStudentQuestions(bank: PublicExamBank, maCa: string, sbd: string): StudentAssignment {')
  })

  it('rút TRONG KHO CỦA CA, không nối thêm câu khi ca đang chạy', () => {
    expect(THI_LAI).toContain('const uv = dungUngVien(bank)')
    expect(THI_LAI).not.toContain('noiKhoCa')
  })

  it('ghi đề mới hỏng thì BÁO, không im lặng để em nhận đề cũ', () => {
    expect(KHOI_TL).toContain("return jsonResponse_({ ok: false, error: 'Đã xoá lượt cũ nhưng KHÔNG ghi được đề mới: ' + errTL })")
  })

  it('bộ câu cũ đọc từ bản đồ khi có, từ luật hash khi không', () => {
    // Có bản đồ: lấy đúng bộ đã ghi.
    expect(boCauCu(bank, 'ca1', '10001', { '10001': ['I-9', 'II-5'] })).toEqual(['I-9', 'II-5'])
    // Không có: dựng lại bằng chính hàm phát đề, đủ 4+2+2 câu.
    const cu = boCauCu(bank, 'ca1', '10001')
    expect(cu).toHaveLength(8)
    expect(new Set(cu).size).toBe(8)
    // Và ổn định: hỏi hai lần ra cùng một bộ.
    expect(boCauCu(bank, 'ca1', '10001')).toEqual(cu)
  })

  it('kho rút không ra câu nào thì DỪNG, không gọi máy chủ xoá lượt', () => {
    expect(THI_LAI).toContain("if (boMoi.length === 0) throw new Error('Kho của ca không rút được câu nào — không đổi đề được')")
    expect(THI_LAI.indexOf('boMoi.length === 0')).toBeLessThan(THI_LAI.indexOf('await choThiLai('))
  })
})

describe('màn Ca thi nói rõ trước khi xoá', () => {
  it('nút xác nhận nêu ĐÚNG những gì mất, và không khôi phục được', () => {
    expect(MAN_CA).toContain('Xoá hẳn điểm và bài làm lượt này của em, rút đề mới, và em chỉ vào lại được ở đúng máy cũ. Không khôi phục được.')
    expect(MAN_CA).toContain('Xoá lượt cũ và cho thi lại')
  })

  it('báo lại bằng SỐ, không phải "đã xong"', () => {
    expect(MAN_CA).toContain('`xoá ${kq.soLuotXoa} lượt cũ`')
    expect(MAN_CA).toContain('đề mới ${kq.soCauKhac}/${kq.soCauMoi} câu khác đề cũ')
  })

  it('đề không đổi được hoặc không khoá được máy thì cảnh báo, không báo thành công', () => {
    expect(MAN_CA).toContain("kq.daDoiDe && kq.khoaMay ? 'success' : 'warn'")
  })
})
