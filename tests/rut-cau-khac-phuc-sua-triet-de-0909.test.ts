// RÚT CÂU KHẮC PHỤC — SỬA TRIỆT ĐỂ. Thầy báo BA lần tối 09/09, lần cuối kèm
// video và một câu chốt: "trên máy của học sinh đang rút câu khắc phục, TẤT CẢ
// học sinh đều không bấm chọn đáp án và không có nút nộp".
//
// ================= NGUYÊN NHÂN GỐC, ĐO ĐƯỢC TRONG MÃ ========================
//
// Hai lệnh khắc phục đi qua ĐÚNG MỘT cổng máy chủ (`quaCongLuot_`), nhưng gửi
// id thiết bị theo hai cách khác nhau:
//
//     cauKhacPhuc       → attempt.idThietBi || layIdThietBi()    CÓ đường lùi
//     ghiPhieuKhacPhuc  → a.idThietBi ?? ''                      KHÔNG có
//
// `idThietBi` là trường TUỲ CHỌN trên `ExamAttempt` (`idThietBi?: string`), chỉ
// được đặt lúc `vaoThi`. Lượt lưu từ bản app cũ, hoặc lượt mở lại bằng
// `moLaiDaNop(existing)`, thì trường này rỗng. Khi đó:
//
//   · `cauKhacPhuc` rơi về id thật của máy  ⇒ CHẠY  ⇒ em thấy đủ câu;
//   · `ghiPhieuKhacPhuc` gửi chuỗi rỗng ⇒ máy chủ chặn ngay dòng đầu
//     (`if (!maCaGP || !sbdGP || !idTbGP) return LOI_GP`) ⇒ không có mã ⇒
//     `nop` rỗng ⇒ phiếu tụt xuống bản chỉ đề.
//
// Khớp từng chi tiết video: đề hiện ra ĐẦY ĐỦ mà không có nút nộp, không bấm
// chọn được — vì đường LẤY CÂU chạy còn đường XIN MÃ chết.
//
// Đây cũng là lý do bốn giả thuyết trước của tôi đều sai: tôi cứ tìm một cái
// cổng hỏng, trong khi cổng vẫn tốt (đọc `LuotThi`: ca 335663 có 41/41 lượt
// qua đủ cổng) — thứ hỏng là DỮ LIỆU MỘT BÊN GỬI LÊN.
//
// ================= HAI LỚP SỬA =============================================
//
// 1. MỘT NGUỒN SỰ THẬT ở máy em: `idThietBiCuaLuot()`, cả hai đường cùng gọi.
//    Hết chỗ cho hai đường lệch nhau.
// 2. Máy chủ nới cổng cho HAI lệnh khắc phục: chỉ đòi LƯỢT CÓ THẬT (mã ca + số
//    báo danh, đã nộp hoặc bị khoá), không đòi đúng máy đã thi. Thầy chốt sau
//    khi tôi hỏi thẳng, vì em nhận link qua Zalo rồi mở bằng trình duyệt trong
//    Zalo là đã ra một id khác. Lịch sử điểm GIỮ NGUYÊN cổng chặt.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

describe('LỚP 1 — máy em: một nguồn sự thật cho id thiết bị', () => {
  it('có hàm dùng chung, và nó CÓ đường lùi về id thật của máy', () => {
    expect(MAN).toContain('function idThietBiCuaLuot(a: { idThietBi?: string } | null | undefined): string {')
    expect(MAN).toContain('return (a?.idThietBi || layIdThietBi() || \'\').trim()')
  })

  it('CẢ HAI đường khắc phục cùng gọi hàm đó', () => {
    expect(MAN).toContain('idThietBiCuaLuot(attempt),')
    expect(MAN).toContain('idThietBiCuaLuot(a),')
    // Ba chỗ gọi: cauKhacPhuc · ghiPhieuKhacPhuc · lichSuEm. Lịch sử điểm dùng
    // chung hàm cho khỏi lệch, dù cổng máy chủ của nó vẫn chặt.
    expect(MAN).toContain('idThietBiCuaLuot(attempt))')
    expect((MAN.match(/idThietBiCuaLuot\(/g) || []).length).toBe(4)
  })

  it('CẤM QUAY LẠI lối cũ — chuỗi rỗng không được lọt lên máy chủ', () => {
    // Chỉ soi DÒNG MÃ, bỏ dòng chú thích: chính chú thích của hàm mới có trích
    // lại hai lối cũ để giải thích, trích dẫn không phải là mã chạy.
    const maChay = MAN.split('\n')
      .filter((d) => {
        const t = d.trim()
        return t !== '' && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
      })
      .join('\n')
    expect(maChay).not.toContain("a.idThietBi ?? ''")
    expect(maChay).not.toContain('attempt.idThietBi || layIdThietBi()')
  })

  it('TÁI HIỆN LỖI: lượt KHÔNG có idThietBi vẫn phải ra id không rỗng', () => {
    const dau = MAN.indexOf('function idThietBiCuaLuot(')
    const than = MAN.slice(dau, MAN.indexOf('\n}', dau) + 2)
    const ma = than.replace('function idThietBiCuaLuot(a: { idThietBi?: string } | null | undefined): string', 'function f(a)')
    const f = new Function('layIdThietBi', `${ma}; return f`)(() => 'may-that-123')
    // Đây chính là ca hỏng: lượt cũ không mang idThietBi.
    expect(f({})).toBe('may-that-123')
    expect(f({ idThietBi: '' })).toBe('may-that-123')
    expect(f(null)).toBe('may-that-123')
    expect(f(undefined)).toBe('may-that-123')
    // Có id thì tôn trọng id của lượt.
    expect(f({ idThietBi: 'may-da-thi-999' })).toBe('may-da-thi-999')
  })

  it('máy chủ VẪN chặn khi id rỗng — đường lùi ở máy em, không phải nới ở máy chủ', () => {
    expect(GS).toContain('if (!maCaGP || !sbdGP || !idTbGP) return jsonResponse_(LOI_GP)')
  })
})

describe('LỚP 2 — máy chủ: cổng khắc phục chỉ đòi lượt có thật', () => {
  /** Chạy ĐÚNG hàm bóc từ tệp `.gs`, không chép lại luật. */
  function quaCong(A: unknown[][], maCa: string, sbd: string, idTb: string, boQuaMay?: boolean): boolean {
    const dau = GS.indexOf('function quaCongLuot_(')
    const than = GS.slice(dau, GS.indexOf('\n}', dau) + 2)
    return new Function(`${than}; return quaCongLuot_`)()(A, maCa, sbd, idTb, boQuaMay)
  }

  // Cột: 0 MaCa · 1 SBD · 3 IdThietBi · 7 TrangThai
  const hang = (maCa: string, sbd: string, idTb: string, tt: string) => {
    const r: unknown[] = new Array(8).fill('')
    r[0] = maCa
    r[1] = sbd
    r[3] = idTb
    r[7] = tt
    return r
  }
  const BANG = [new Array(8).fill('tieu de'), hang('335663', '12090', 'may-A', 'da_nop')]

  it('ĐÚNG MÁY vẫn qua, ở cả hai chế độ', () => {
    expect(quaCong(BANG, '335663', '12090', 'may-A')).toBe(true)
    expect(quaCong(BANG, '335663', '12090', 'may-A', true)).toBe(true)
  })

  it('MÁY KHÁC: chế độ chặt CHẶN, chế độ khắc phục CHO QUA', () => {
    expect(quaCong(BANG, '335663', '12090', 'may-B-zalo')).toBe(false)
    expect(quaCong(BANG, '335663', '12090', 'may-B-zalo', true)).toBe(true)
  })

  it('NỚI MÁY KHÔNG PHẢI NỚI HẾT — sai mã ca hoặc sai SBD vẫn chặn', () => {
    expect(quaCong(BANG, '999999', '12090', 'may-A', true)).toBe(false)
    expect(quaCong(BANG, '335663', '99999', 'may-A', true)).toBe(false)
  })

  it('LƯỢT CHƯA NỘP vẫn chặn — phải là lượt đã nộp hoặc bị khoá', () => {
    const dangLam = [new Array(8).fill('tieu de'), hang('335663', '12090', 'may-A', 'dang_lam')]
    expect(quaCong(dangLam, '335663', '12090', 'may-A', true)).toBe(false)
    const khoa = [new Array(8).fill('tieu de'), hang('335663', '12090', 'may-A', 'khoa')]
    expect(quaCong(khoa, '335663', '12090', 'may-B', true)).toBe(true)
  })

  it('ĐÚNG HAI lệnh khắc phục được nới; LỊCH SỬ ĐIỂM giữ cổng chặt', () => {
    expect(GS).toContain('quaCongLuot_(shLGP.getRange(1, 1, nLGP, 8).getValues(), maCaGP, sbdGP, idTbGP, true)')
    expect(GS).toContain('quaCongLuot_(shL.getRange(1, 1, nL, 8).getValues(), maCa, sbd, idTb, true)')
    // Lịch sử điểm: KHÔNG có tham số thứ năm.
    expect(GS).toContain('if (!quaCongLuot_(A, maCa, sbd, idTb)) return jsonResponse_(LOI_LS)')
    expect((GS.match(/, true\)\) return jsonResponse_/g) || []).length).toBe(2)
  })

  it('CÒN NGUYÊN thuộc tính SPREADSHEET_ID — dán nhầm là mất cả kho', () => {
    expect(GS).toContain("PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')")
  })
})
