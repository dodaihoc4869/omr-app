// ĐIỂM CA 447479 BỊ ĐÈ LẦN THỨ BA — chiều 09/09, sau khi đã siết tem ở v66.
//
// TÔI ĐÃ ĐOÁN SAI HAI LẦN về việc MÁY NÀO ghi, và cả hai lần đều bị chính dữ
// liệu bác bỏ:
//
//   lần 1 "máy thầy chạy bản app cũ"  → sai: gọi thật `ghiDiem` bỏ tem thì máy
//                                       chủ TỪ CHỐI cả 3 em, mà điểm vẫn bị đè
//   lần 2 "thiếu bản đồ đề riêng"     → sai: đọc máy chủ, ca 447479 KHÔNG phải
//                                       ca đề riêng, `goiDeRieng` rỗng
//
// NÊN PHÉP KIỂM NÀY KHÔNG KHOÁ MỘT GIẢ THUYẾT NÀO VỀ MÁY. Nó khoá đúng cái SAI
// ĐO ĐƯỢC, là MẪU SỐ.
//
// SỐ LIỆU THẬT (chi tiết từng câu máy thầy chấm cho em 12052, ca 447479):
//
//   phần I : em làm 8 câu, đúng 5     phần II: làm 2 câu    phần III: làm 2, đúng 1
//
// Hai bên chấm ra CÙNG số câu đúng nhưng khác điểm, vì khác mẫu số:
//
//   em 12038, 4 câu đúng phần I → 4 × (4,50/8)  = 2,25   ← máy chấm ĐÚNG
//                                 4 × (4,50/18) = 1,00   ← bên chấm SAI
//
// Cả ba phần đều lệch đúng kiểu ấy, ra 5,75 so với 2,50 — khớp từng chữ số với
// hai con số thầy chụp được.
//
// CHỐT: bên ghi điểm phải KHAI mẫu số nó đã dùng; máy chủ đối chiếu với số câu
// thật của ca (`keyBank.soCau`, thứ nó đang giữ) rồi mới cho ghi.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

/** Bóc một hàm khỏi tệp .gs bằng KHỚP NGOẶC rồi chạy nó thật. */
function layHam(ten: string): string {
  const dau = GS.indexOf('function ' + ten + '(')
  expect(dau, 'không thấy ' + ten).toBeGreaterThan(0)
  let n = 0
  for (let i = GS.indexOf('{', dau); i < GS.length; i++) {
    if (GS[i] === '{') n++
    else if (GS[i] === '}') {
      n--
      if (n === 0) return GS.slice(dau, i + 1)
    }
  }
  throw new Error(ten + ' không đóng ngoặc')
}

/** `mauSoKhop_` thật, với `soCauThatCuaCa_` thay bằng bản đọc thẳng — để phép
 * kiểm không phải dựng cả Drive lẫn Sheets của Apps Script. */
function mauSoKhop(caSoCau: { I: number; II: number; III: number } | null, body: unknown) {
  const gia = `function soCauThatCuaCa_(ca) { return ca && ca.__soCau ? ca.__soCau : null }`
  const f = new Function(`${gia}\n${layHam('mauSoKhop_')}\nreturn mauSoKhop_`)() as (
    ca: unknown,
    body: unknown,
  ) => { khop: boolean; lyDo: string }
  return f(caSoCau ? { __soCau: caSoCau } : null, body)
}

const CA = { I: 8, II: 2, III: 2 } // số câu THẬT của ca 447479

describe('mẫu số phải khớp số câu thật của ca', () => {
  it('khai ĐÚNG mẫu số ⇒ cho ghi', () => {
    expect(mauSoKhop(CA, { soCau: { I: 8, II: 2, III: 2 } }).khop).toBe(true)
  })

  it('TÁI HIỆN LỖI THẬT: khai 18/4/6 trong khi ca là 8/2/2 ⇒ TỪ CHỐI', () => {
    const r = mauSoKhop(CA, { soCau: { I: 18, II: 4, III: 6 } })
    expect(r.khop).toBe(false)
    // Lý do phải nói RA hai con số, không chỉ "sai" — thầy đọc là biết ngay.
    expect(r.lyDo).toContain('18/4/6')
    expect(r.lyDo).toContain('8/2/2')
  })

  it('lệch dù chỉ MỘT phần cũng từ chối', () => {
    expect(mauSoKhop(CA, { soCau: { I: 8, II: 2, III: 6 } }).khop).toBe(false)
    expect(mauSoKhop(CA, { soCau: { I: 9, II: 2, III: 2 } }).khop).toBe(false)
  })

  it('KHÔNG KHAI ⇒ cho qua, không tự chặn bản app chưa kịp cập nhật', () => {
    // Chặn cả bản chưa cập nhật là tự bịt đường ghi điểm của chính mình giữa ca
    // thi. Nhật ký vẫn ghi lại là "khong_khai" để soi sau.
    expect(mauSoKhop(CA, {}).khop).toBe(true)
    expect(mauSoKhop(CA, { soCau: null }).khop).toBe(true)
  })

  it('ca chưa có gói đáp án ⇒ không có gì để đối chiếu, cho qua', () => {
    expect(mauSoKhop(null, { soCau: { I: 18, II: 4, III: 6 } }).khop).toBe(true)
  })

  it('gói rác không làm hàm nổ', () => {
    for (const b of [null, undefined, 0, '', [], { soCau: 'linh tinh' }]) {
      expect(() => mauSoKhop(CA, b)).not.toThrow()
    }
  })
})

describe('SỐ HỌC CỦA CHÍNH CA 447479 — vì sao 2,50 và 5,75 cùng ra từ một bài', () => {
  /** Điểm một phần: số câu đúng × (trần phần ÷ mẫu số). */
  const diem = (soCauDung: number, tranPhan: number, mauSo: number) =>
    Math.round((soCauDung * (tranPhan / mauSo)) * 100) / 100

  it('em 12038: cùng 4 · 1 · 2 câu đúng, mẫu số đúng ra 5,75 — khớp ảnh thầy chụp', () => {
    const I = diem(4, 4.5, 8)
    const II = diem(1, 4.0, 2)
    const III = diem(2, 1.5, 2)
    expect(I).toBe(2.25)
    expect(II).toBe(2)
    expect(III).toBe(1.5)
    expect(Math.round((I + II + III) * 100) / 100).toBe(5.75)
  })

  it('em 12038: cùng 4 · 1 · 2 câu đúng, mẫu số 18/4/6 ra 2,50 — cũng khớp ảnh', () => {
    const I = diem(4, 4.5, 18)
    const II = diem(1, 4.0, 4)
    const III = diem(2, 1.5, 6)
    expect(I).toBe(1)
    expect(II).toBe(1)
    expect(III).toBe(0.5)
    expect(Math.round((I + II + III) * 100) / 100).toBe(2.5)
  })
})

describe('CẢ HAI cửa ghi điểm đều phải qua chốt', () => {
  it('ghiDiem: từ chối khi mẫu số lệch, và nói rõ lý do', () => {
    expect(GS).toContain("ketQuaGhi = 'tu_choi_mau_so'")
    expect(GS).toContain("tuChoi.push(sbd + ': ' + mauSo.lyDo + ' — điểm giữ nguyên')")
  })

  it('sendFeedback: chặn TRƯỚC khi ghi dòng nhận xét, không ghi rồi mới chặn', () => {
    const dau = GS.indexOf("if (action === 'sendFeedback')")
    expect(dau).toBeGreaterThan(0)
    const than = GS.slice(dau, dau + 4000)
    const viChot = than.indexOf('if (!mauSoNX.khop)')
    const viGhiNhanXet = than.indexOf('getSheet_(SHEET_NHANXET')
    expect(viChot).toBeGreaterThan(0)
    expect(viGhiNhanXet).toBeGreaterThan(viChot)
  })

  it('KHÔNG SÓT: mọi chỗ ghi cột điểm 14..17 đều nằm sau một chốt', () => {
    const cho = [...GS.matchAll(/getRange\([^,]+,\s*14,\s*1,\s*4\)\.setValues/g)].map((m) => m.index ?? 0)
    expect(cho.length).toBe(2) // ghiDiem và sendFeedback, không có cửa thứ ba
    for (const i of cho) {
      const truoc = GS.slice(Math.max(0, i - 2500), i)
      expect(truoc, 'chỗ ghi điểm ở ' + i + ' không có chốt mẫu số').toMatch(/mauSo(NX)?\.khop|mauSoKhop_/)
    }
  })
})

describe('nhật ký ghi điểm — để lần sau khỏi phải đoán', () => {
  it('ghi lại đủ thứ cần để truy: lệnh, em, điểm, mẫu số, máy, kết quả', () => {
    expect(GS).toContain("getSheet_('NhatKyDiem', ['Luc', 'Lenh', 'MaCa', 'SBD', 'Tong', 'MauSoKhai', 'CoMat', 'IdThietBi', 'LuatDiem', 'KetQua'])")
    expect(GS).toContain("'khong_khai'")
  })

  it('nhật ký hỏng thì NUỐT lỗi — không được làm chết luồng ghi điểm', () => {
    const than = layHam('ghiNhatKyDiem_')
    expect(than).toMatch(/catch \(err\) \{\}/)
  })

  it('cả hai cửa đều ghi nhật ký, kể cả lượt bị từ chối', () => {
    expect(GS).toContain("ghiNhatKyDiem_('ghiDiem'")
    expect(GS).toContain("ghiNhatKyDiem_('sendFeedback'")
    expect(GS).toContain("'tu_choi_khong_tem'")
    expect(GS).toContain("'tu_choi_mau_so'")
  })
})

describe('máy khách khai mẫu số ở MỌI chỗ ghi điểm', () => {
  it('ghiDiem gửi soCau lên máy chủ', () => {
    expect(API).toContain("postJson(scriptUrl, { action: 'ghiDiem', secret, maCa, bai, luatDiem: LUAT_DIEM, soCau }")
  })

  it('sendParentFeedback gửi soCau lên máy chủ', () => {
    const dau = API.indexOf('export async function sendParentFeedback(')
    const than = API.slice(dau, API.indexOf('export async function pushExamStatus', dau))
    expect(than).toContain('soCau,')
  })

  it('BA chỗ gọi ghiDiem đều truyền mẫu số — sót một chỗ là chỗ đó ghi mù', () => {
    const nguon = [
      'src/lib/cham-lai-ca.ts',
      'src/screens/ExamMonitorScreen.tsx',
      'src/screens/ExamTakeScreen.tsx',
    ].map((f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8'))
    expect(nguon[0]).toContain('ghiDiem(url, mat, maCa, bai.slice(i, i + CO_LO), soCauCham)')
    expect(nguon[1]).toMatch(/ghiDiem\(scriptUrl\.trim\(\), secret\.trim\(\), chiTiet\.ca\.maCa, bai, \{/)
    // Máy em có HAI lượt gửi điểm (ghiDiem và sendParentFeedback) — bản đầu của
    // phép kiểm này chỉ đếm một lần xuất hiện nên bỏ sót khi tôi phá mã đúng một
    // trong hai. Nay đòi ĐỦ HAI.
    expect((nguon[2].match(/soCauEmDaChia,/g) || []).length).toBe(2)
  })

  // VIẾT LẠI 10/09 TỐI — Ý ĐỊNH GIỮ NGUYÊN, chỉ đổi chỗ neo.
  //
  // Bản cũ neo vào NGUYÊN VĂN hai dòng mã, và cả hai dòng ấy đều đã đổi vì lý do
  // chính đáng:
  //   · `gradeFromKeyBank` nay nhận thêm BỘ CÂU CỦA EM. Thiếu tham số đó thì máy
  //     em rút lại bộ câu bằng hạt giống và chấm em theo đề em chưa từng thấy —
  //     ca 234641 tối 10/09, điểm 5,69 bị ghi thành 2,56.
  //   · `(kb as { soCau?… })` bỏ đi vì kiểu `KeyBank` nay khai `soCau` đàng
  //     hoàng. Chính chỗ ép kiểu đó đã che mất việc kiểu cũ bỏ sót trường này.
  //
  // Neo vào nguyên văn là thứ khiến phép kiểm đỏ khi mã được sửa ĐÚNG. Nay neo
  // vào điều thật sự cần giữ: khai mẫu số LẤY TỪ CHÍNH `kb` đã đem đi chấm, và
  // đọc nó SAU khi chấm — chứ không phải một con số dựng ở chỗ khác.
  it('máy em khai ĐÚNG con số nó đã chia, không khai con số nó mong là đúng', () => {
    const man = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
    expect(man).toMatch(/const soCauEmDaChia = kb\.soCau \?\? undefined/)
    const viCham = man.indexOf('const g = gradeFromKeyBank(kb, done.maCa, done.sbd, done.answers,')
    const viKhai = man.indexOf('const soCauEmDaChia =')
    expect(viCham).toBeGreaterThan(0)
    expect(viKhai).toBeGreaterThan(viCham)
  })

  // CHỐT MỚI CỦA CHÍNH LẦN HỎNG NÀY: máy em KHÔNG được để `gradeFromKeyBank` tự
  // rút lại bộ câu. Cả hai chỗ chấm ở máy em đều phải đưa bộ câu vào.
  it('máy em LUÔN đưa bộ câu của em vào khi chấm — không để hàm tự rút lại', () => {
    const man = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
    const goi = man.match(/gradeFromKeyBank\([^)]*\)/g) ?? []
    expect(goi.length).toBeGreaterThan(0)
    for (const g of goi) {
      // Bốn tham số = bank, maCa, sbd, bài làm. Phải có tham số thứ NĂM.
      expect(g.split(',').length).toBeGreaterThanOrEqual(5)
    }
    expect(man).toContain("import { boCauTuBaiLam } from '../lib/bo-cau-tu-bai-lam'")
  })

  it('màn Ca thi khai theo CHÍNH bank đã gộp, không theo soCauCa thô', () => {
    const man = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    const dau = man.indexOf('ghiDiem(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, bai, {')
    expect(dau).toBeGreaterThan(0)
    const than = man.slice(dau, dau + 200)
    expect(than).toContain('I: bank.phanI.length')
    expect(than).toContain('II: bank.phanII.length')
    expect(than).toContain('III: bank.phanIII.length')
  })

  it('mã .gs vẫn hợp lệ cú pháp sau khi thêm chốt', () => {
    expect(() => new Function(GS)).not.toThrow()
  })
})
