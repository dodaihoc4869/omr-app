// ĐỀ RIÊNG RÚT LÚC BẤM BẮT ĐẦU, không phải lúc mở ca (thầy chốt 08/09).
//
// "Nút này bạn phải tự động quét tất cả học sinh vào thi ca mới nhất ở trong
// màn hình chờ sau đó tôi bấm bắt đầu thì bạn rút bộ câu cho từng học sinh,
// áp dụng cho chọn từng em và chọn số báo danh, khi chọn chế độ này thì tự
// kích hoạt màn hình chờ."
//
// Bản đầu bó vào phạm vi "tích từng em" và thầy bắt được ngay: mở test32 ở chế
// độ khác thì không có bộ nào, màn ca thi không có gì để báo.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const GS = doc('docs/apps-script-kiem-tra.gs')
const MO_CA = doc('src/screens/ExamSetupScreen.tsx')
const THEO_DOI = doc('src/screens/ExamMonitorScreen.tsx')
const KHOI = doc('src/components/KhoiRutDe.tsx')

describe('máy chủ nhớ ai đang chờ', () => {
  it('CỔNG PHÒNG CHỜ GHI TÊN EM — trước nay không ai biết ai đang chờ', () => {
    expect(GS).toContain("const SHEET_CHO = 'PhongCho'")
    expect(GS).toContain('function ghiPhongCho_(')
    const than = GS.slice(GS.indexOf('if (ca.phongCho && !ca.batDauThiLuc && !luot) {'))
    expect(than.slice(0, 400)).toContain('ghiPhongCho_(maCa, sbd,')
  })

  it('GHI HỎNG KHÔNG ĐƯỢC CHẶN EM vào phòng chờ', () => {
    const than = GS.slice(GS.indexOf('function ghiPhongCho_('), GS.indexOf('function docPhongCho_('))
    expect(than).toContain('try {')
    expect(than).toContain('catch (err) {')
  })

  it('MỘT EM MỘT DÒNG — vào lại thì cập nhật, không đẻ dòng mới', () => {
    const than = GS.slice(GS.indexOf('function ghiPhongCho_('), GS.indexOf('function docPhongCho_('))
    expect(than).toContain('findRowByKey_(sh, 0, khoa)')
    expect(than).toContain('setValues([dong])')
  })

  it('`chiTietCa` TRẢ danh sách em đang chờ', () => {
    expect(GS).toContain('dsCho: docPhongCho_(maCa)')
    expect(doc('src/lib/exam-api.ts')).toContain('dsCho?: { sbd: string; hoTen: string; vaoLuc: string }[]')
  })
})

describe('bản đồ ghi lúc bấm Bắt đầu', () => {
  it('`batDauThi` NHẬN bản đồ và ghi TRƯỚC mốc giờ', () => {
    const than = GS.slice(GS.indexOf("if (action === 'batDauThi') {"), GS.indexOf("if (action === 'tenTheoSbd') {"))
    expect(than).toContain('body.boTheoEm')
    // Mốc giờ là thứ mở cổng phát đề — ghi nó trước là có em nhận đề khi bản
    // đồ chưa có.
    expect(than.indexOf('_botheoem')).toBeLessThan(than.indexOf('shBD.getRange(rowBD, 27).setValue(lucBD)'))
  })

  it('BẢN ĐỒ CẤT CỘT RIÊNG, không nhét vào gói đề nằm trên Drive', () => {
    expect(GS).toContain('function gopBoTheoEm_(')
    expect(GS).toContain('bank: gopBoTheoEm_(docJsonLon_(ca.bankRef), ca.boTheoEmRef)')
    expect(GS).toContain('gopBoTheoEm_(docJsonLon_(caXD.keyBankRef), caXD.boTheoEmRef)')
  })
})

describe('màn Mở ca', () => {
  it('CHẾ ĐỘ NÀY TỰ BẬT PHÒNG CHỜ, và không tắt được', () => {
    expect(MO_CA).toContain('phongCho: phongCho || deRiengBat')
    expect(MO_CA).toContain('disabled={deRiengBat}')
    expect(MO_CA).toContain('Bật sẵn và không tắt được')
  })

  it('KHÔNG còn bó vào phạm vi "tích từng em"', () => {
    expect(MO_CA).not.toContain('dsSbdVaoCa')
    expect(KHOI).not.toContain('dsSbdChot')
    expect(KHOI).not.toContain('chọn phạm vi "tích từng em"')
  })

  it('LÚC MỞ CA KHÔNG gắn bản đồ — chưa biết em nào tới', () => {
    expect(MO_CA).not.toContain('const boTheoEm = boRut?.deRieng?.boTheoEm')
    expect(MO_CA).toContain('luuCheDoDeRieng(maCa, true)')
  })

  it('ĐẨY LÊN KHO RỘNG để lúc bấm Bắt đầu còn câu mà rút', () => {
    expect(KHOI).toContain('soCau: deRieng ? soCau : {')
  })
})

describe('màn Theo dõi ca', () => {
  it('BẤM BẮT ĐẦU thì rút bộ câu cho ĐÚNG em đang chờ', () => {
    const than = THEO_DOI.slice(THEO_DOI.indexOf('const batDauCaNay = async () => {'), THEO_DOI.indexOf('/** HUỶ CA ĐANG CHỜ'))
    expect(than).toContain('chiTiet.dsCho ?? []')
    expect(than).toContain('dungDeRiengChoCa(')
    expect(than).toContain('luuDeRiengCa(chiTiet.ca.maCa')
    expect(than).toContain('batDauThi(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, boTheoEm)')
  })

  it('CHƯA EM NÀO CHỜ thì KHÔNG bắt đầu, nói thẳng', () => {
    const than = THEO_DOI.slice(THEO_DOI.indexOf('const batDauCaNay = async () => {'), THEO_DOI.indexOf('/** HUỶ CA ĐANG CHỜ'))
    expect(than).toContain('Chưa em nào vào phòng chờ')
    expect(than).toContain('return')
  })

  it('HIỆN TRƯỚC ai đang chờ, không bắt thầy bấm rồi mới biết', () => {
    expect(THEO_DOI).toContain('em đang chờ')
    expect(THEO_DOI).toContain('chưa em nào vào.')
  })

  it('CA THƯỜNG vẫn bắt đầu như cũ, không đòi phòng chờ có người', () => {
    const than = THEO_DOI.slice(THEO_DOI.indexOf('const batDauCaNay = async () => {'), THEO_DOI.indexOf('/** HUỶ CA ĐANG CHỜ'))
    expect(than).toContain('if (caCanDeRieng) {')
  })
})
