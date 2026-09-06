// ĐỊNH NGHĨA HOÀN THÀNH của GIUDEDOC.md mục 8, chín phép kiểm logic + ba phép
// kiểm giao diện. Đánh số đúng như đặc tả để đối chiếu.
//
// CI xanh KHÔNG phải bằng chứng — phép kiểm 13–20 phải làm bằng mắt trên điện
// thoại thật của thầy, quan trọng nhất là số 14 (mở cửa sổ nổi Gemini đè lên).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AN_HAN_CHON_GIAY,
  BAT_MAC_DINH_BAI_TAP,
  BAT_MAC_DINH_CA_THI,
  CHU_TAM_PHU,
  MS_AN_HAN_NHA_TAY,
  MS_HIEN_LAI,
  MS_BAT_DONG_CHE,
  MS_NHIP_SOI_GIU,
  PX_COI_LA_DI_CHUYEN,
  anHanMsCua,
  batCuaCa,
  batMacDinh,
  chamDiChuyen,
  chamLen,
  chamXuong,
  chuDanTruoc,
  chuTatDe,
  coCamUng,
  coMat,
  dangGoOnhap,
  ghiHoatDong,
  moTrangThaiGiu,
  type BoiCanhGiu,
} from '../src/lib/giu-de-doc'

const BC: BoiCanhGiu = { coCamUng: true, dangGoO: false, anHanMs: MS_AN_HAN_NHA_TAY }

describe('GIỮ ĐỂ ĐỌC — máy trạng thái', () => {
  it('1. có ngón chạm → coMat đúng', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    expect(coMat(tt, 0, BC)).toBe(true)
    expect(coMat(tt, 5000, BC)).toBe(true) // vẫn dưới ngưỡng bất động
  })

  it('2. nhả tay: chưa hết ân hạn vẫn coMat, quá ân hạn thì hết', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    chamLen(tt, 1, 1000)
    expect(coMat(tt, 1000 + MS_AN_HAN_NHA_TAY - 1, BC)).toBe(true)
    expect(coMat(tt, 1000 + MS_AN_HAN_NHA_TAY, BC)).toBe(false)
  })

  // BỎ NGƯỠNG BẤT ĐỘNG — thầy chốt 06/09.
  //
  // Bản 05/09 có một dòng đứng trên tất cả: im quá `MS_BAT_DONG_CHE` là che,
  // kể cả khi ngón tay VẪN ĐANG trên màn. Em giữ tay đọc một câu dài quá sáu
  // giây là đề tắt trước mắt. Thầy yêu cầu bỏ.
  //
  // Đánh đổi nói thẳng: mẹo "kê một ngón im rồi soi máy khác" không còn bị
  // chặn bằng cách này. Cái chặn đó phải trả giá bằng việc tắt đề của mọi em
  // đọc chậm, nên không đáng.

  it('3. GIỮ TAY YÊN BAO LÂU CŨNG ĐƯỢC — đề không tự tắt nữa', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    expect(coMat(tt, MS_BAT_DONG_CHE, BC)).toBe(true)
    expect(coMat(tt, MS_BAT_DONG_CHE * 10, BC)).toBe(true)
    expect(coMat(tt, 999999, BC)).toBe(true)
  })

  it('3b. ngón kê im rồi NHẢ TAY thì mới tính ân hạn như thường', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    chamLen(tt, 1, 60000) // kê im một phút rồi mới nhả
    expect(coMat(tt, 60000 + MS_AN_HAN_NHA_TAY - 1, BC)).toBe(true)
    expect(coMat(tt, 60000 + MS_AN_HAN_NHA_TAY, BC)).toBe(false)
  })

  it('4. di chuyển ngón vẫn ghi mốc, nhưng không còn quyết định che nữa', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    chamDiChuyen(tt, 1, 100 + PX_COI_LA_DI_CHUYEN, 100, 5000)
    expect(coMat(tt, 5000 + MS_BAT_DONG_CHE, BC)).toBe(true)
  })

  it('5. rung tay nhỏ cũng không làm đề tắt', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    for (let t = 500; t < MS_BAT_DONG_CHE; t += 500) {
      chamDiChuyen(tt, 1, 100 + (t % 1000 === 0 ? 3 : -3), 100 + 2, t)
    }
    expect(coMat(tt, MS_BAT_DONG_CHE, BC)).toBe(true)
  })

  it('6. CARET TRONG Ô NHẬP: em tính toán rồi gõ đáp án, đề luôn hiện', () => {
    const tt = moTrangThaiGiu(0)
    const goO = { ...BC, dangGoO: true }
    expect(coMat(tt, MS_BAT_DONG_CHE, goO)).toBe(true)
    expect(coMat(tt, 999999, goO)).toBe(true)
  })

  it('7. có scroll trong ân hạn → ân hạn đếm lại từ lần cuộn cuối', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 100, 100, 0)
    chamLen(tt, 1, 1000)
    ghiHoatDong(tt, 2500) // cuộn quán tính còn trôi
    expect(coMat(tt, 1000 + MS_AN_HAN_NHA_TAY + 100, BC)).toBe(true)
    expect(coMat(tt, 2500 + MS_AN_HAN_NHA_TAY, BC)).toBe(false)
  })

  it('8. maxTouchPoints === 0 → cơ chế không bật, coMat luôn đúng', () => {
    const tt = moTrangThaiGiu(0)
    expect(coMat(tt, 999999, { ...BC, coCamUng: false })).toBe(true)
    expect(coCamUng({ maxTouchPoints: 0 })).toBe(false)
    expect(coCamUng({ maxTouchPoints: 5 })).toBe(true)
    expect(coCamUng({})).toBe(false)
  })

  it('9. ca cũ không có trường GiuDeDoc → tắt, hành vi giống hệt bản đang chạy', () => {
    expect(batCuaCa({})).toBe(false)
    expect(batCuaCa({ giuDeDoc: false })).toBe(false)
    expect(batCuaCa({ giuDeDoc: true })).toBe(true)
  })

  it('nhiều ngón: còn ngón trên màn là đề còn hiện', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 10, 10, 0) // ngón kê, nằm im
    chamXuong(tt, 2, 200, 200, 0)
    chamDiChuyen(tt, 2, 260, 260, 5000) // ngón thật vẫn cuộn
    expect(coMat(tt, MS_BAT_DONG_CHE + 500, BC)).toBe(true)
    chamLen(tt, 2, 5500)
    // ngón 1 VẪN còn trên màn ⇒ chưa phải ca "nhả hết tay", nên đề còn hiện
    // bao lâu cũng được (ngưỡng bất động đã bỏ 06/09).
    expect(coMat(tt, 5500 + MS_AN_HAN_NHA_TAY, BC)).toBe(true)
    expect(coMat(tt, 5500 + MS_BAT_DONG_CHE * 10, BC)).toBe(true)
  })

  it('NHẢ HẾT TAY mới tính ân hạn — còn một ngón thì chưa', () => {
    const tt = moTrangThaiGiu(0)
    chamXuong(tt, 1, 10, 10, 0)
    chamXuong(tt, 2, 20, 20, 0)
    chamLen(tt, 2, 100)
    // Ngón 1 còn trên màn: không phải ca nhả hết tay, đề vẫn hiện.
    expect(coMat(tt, 100 + MS_BAT_DONG_CHE, BC)).toBe(true)
    chamLen(tt, 1, 200)
    expect(coMat(tt, 200 + MS_AN_HAN_NHA_TAY - 1, BC)).toBe(true)
    expect(coMat(tt, 200 + MS_AN_HAN_NHA_TAY, BC)).toBe(false)
  })
})

describe('GIỮ ĐỂ ĐỌC — cấu hình một nguồn sự thật', () => {
  it('bốn hằng số; 6 giây nay chỉ còn là TRẦN ân hạn, không còn che đề', () => {
    expect(MS_AN_HAN_NHA_TAY).toBe(3000)
    expect(MS_BAT_DONG_CHE).toBe(6000)
    expect(PX_COI_LA_DI_CHUYEN).toBe(8)
    expect(MS_HIEN_LAI).toBe(0)
  })

  it('nhịp soi ≤ 100 ms — "tắt đúng ân hạn ± 100 ms" (mục 5) phải là thật', () => {
    expect(MS_NHIP_SOI_GIU).toBeLessThanOrEqual(100)
  })

  it('bật mặc định cho ca thi, TẮT cho bài tập về nhà', () => {
    expect(BAT_MAC_DINH_CA_THI).toBe(true)
    expect(BAT_MAC_DINH_BAI_TAP).toBe(false)
    expect(batMacDinh('thi')).toBe(true)
    expect(batMacDinh('baitap')).toBe(false)
    expect(batMacDinh()).toBe(true)
  })

  it('ba mức ân hạn 2 / 3 / 5 giây, chặn trần ở ngưỡng cứng', () => {
    expect([...AN_HAN_CHON_GIAY]).toEqual([2, 3, 5])
    expect(anHanMsCua(5)).toBe(5000)
    expect(anHanMsCua(0)).toBe(MS_AN_HAN_NHA_TAY)
    expect(anHanMsCua(undefined)).toBe(MS_AN_HAN_NHA_TAY)
    expect(anHanMsCua(-3)).toBe(MS_AN_HAN_NHA_TAY)
    // ca cũ ghi 10 giây vẫn chạy, nhưng không vượt được ngưỡng cứng
    expect(anHanMsCua(10)).toBe(MS_BAT_DONG_CHE)
    for (const g of AN_HAN_CHON_GIAY) expect(anHanMsCua(g)).toBeLessThanOrEqual(MS_BAT_DONG_CHE)
  })

  it('chữ hiện ra không có chữ trách em', () => {
    for (const c of [CHU_TAM_PHU, chuDanTruoc(), chuDanTruoc(5)]) {
      expect(c).not.toMatch(/gian lận|quay cóp|vi phạm|khoá/i)
    }
    expect(CHU_TAM_PHU).toBe('Chạm để đọc tiếp')
    expect(chuDanTruoc()).toContain('3 giây')
    expect(chuDanTruoc(10)).toContain('10 giây')
    // KHÔNG còn hứa hẹn gì về "màn hình im" — luật đó đã bỏ 06/09, mà câu dặn
    // còn nhắc là em ngồi chờ đề tắt trong lo lắng vô cớ.
    expect(chuDanTruoc()).not.toContain('im quá')
    expect(chuDanTruoc()).toContain('Giữ tay yên đọc bao lâu cũng được')
  })

  it('dangGoOnhap nhận đúng ô nhập Phần III', () => {
    const o = document.createElement('input')
    const ta = document.createElement('textarea')
    const div = document.createElement('div')
    expect(dangGoOnhap(o)).toBe(true)
    expect(dangGoOnhap(ta)).toBe(true)
    expect(dangGoOnhap(div)).toBe(false)
    expect(dangGoOnhap(null)).toBe(false)
  })

  it('hai con số cho thầy: không kết luận gì, không gọi là vi phạm', () => {
    expect(chuTatDe(null)).toBe('')
    expect(chuTatDe({ soLanTatDe: 0, giayTatDe: 0 })).toBe('')
    expect(chuTatDe({ soLanTatDe: 4, giayTatDe: 45 })).toBe('đề tắt 4 lần / 45s')
    expect(chuTatDe({ soLanTatDe: 9, giayTatDe: 1205 })).toBe('đề tắt 9 lần / 20p05')
    expect(chuTatDe({ soLanTatDe: 2, giayTatDe: 90 })).not.toMatch(/vi phạm|gian lận/i)
  })
})

describe('GIỮ ĐỂ ĐỌC — nối vào màn thi', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
  const man = readFileSync(resolve(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

  it('10. tắt đề = visibility trên thẻ bọc, KHÔNG display, KHÔNG unmount', () => {
    // Mục 9 cấm làm nhảy vị trí cuộn. `visibility` giữ nguyên chiều cao.
    expect(css).toMatch(/html\[data-giu-de-an\] \.thi-noi-dung \{\s*visibility: hidden;/)
    expect(css).not.toMatch(/html\[data-giu-de-an\] \.thi-noi-dung \{\s*display:/)
  })

  it('10b. thanh trên và vân tay nằm NGOÀI .thi-noi-dung nên vẫn hiện', () => {
    const iPhu = man.indexOf('<VanTay')
    const iND = man.indexOf('className="thi-hai-cot thi-noi-dung"')
    expect(iPhu).toBeGreaterThan(0)
    expect(iPhu).toBeLessThan(iND) // vân tay dựng trước, không nằm trong khối bị ẩn
  })

  it('11. tấm phủ nhận chạm và nằm DƯỚI vân tay, TRÊN nội dung', () => {
    const phu = readFileSync(resolve(process.cwd(), 'src/components/ManGiuDeDoc.tsx'), 'utf8')
    expect(phu).toContain('--z-giu-de')
    expect(phu).not.toContain('pointerEvents: \'none\'')
    const z = (ten: string) => Number(new RegExp(`--z-${ten}: (\\d+)`).exec(css)?.[1] ?? -1)
    expect(z('giu-de')).toBeGreaterThan(z('noi-dung'))
    expect(z('giu-de')).toBeLessThan(z('van-tay'))
    // phủ từ dưới thanh trên xuống, để đồng hồ còn nhìn thấy
    expect(phu).toContain('top: CAO_THANH_TREN')
  })

  it('11b. tấm phủ LUÔN trong DOM, ẩn hiện bằng CSS — không state, không render lại', () => {
    expect(css).toMatch(/\[data-giu-de-phu\] \{\s*display: none;/)
    expect(css).toMatch(/html\[data-giu-de-an\] \[data-giu-de-phu\] \{\s*display: flex;/)
    expect(man).toContain('<ManGiuDeDoc />')
    // effect chỉ đổi MỘT thuộc tính trên <html>
    expect(man).toContain("goc.setAttribute('data-giu-de-an', '1')")
    expect(man).toContain("goc.removeAttribute('data-giu-de-an')")
  })

  it('12. chạm là hiện lại NGAY trong cùng nhịp sự kiện, không đợi nhịp soi', () => {
    expect(man).toContain('dat(false, nay) // hiện lại NGAY, cùng nhịp sự kiện')
  })

  it('cuộn và gõ phím đều tính là còn làm bài (ca 2 và 3 của mục 2.2)', () => {
    expect(man).toContain("document.addEventListener('scroll', dong, { passive: true, capture: true })")
    expect(man).toContain("document.addEventListener('keydown', dong)")
    expect(man).toContain('dangGoO: dangGoOnhap(document.activeElement)')
    // gõ phím bỏ che NGAY, không đợi nhịp soi
    expect(man).toMatch(/const dong = \(\) => \{[\s\S]*?dat\(false, nay\)/)
  })

  it('CẤM khoá bài vì không chạm màn (mục 9)', () => {
    // Cắt đúng effect Giữ để đọc rồi soi: trong đó không được có khoaVi.
    const i = man.indexOf('// GIỮ ĐỂ ĐỌC — GIUDEDOC.md, effect RIÊNG')
    const j = man.indexOf('// LÁ CHẮN CSS')
    expect(i).toBeGreaterThan(0)
    expect(j).toBeGreaterThan(i)
    const khoi = man.slice(i, j)
    expect(khoi).not.toContain('khoaVi(')
    expect(khoi).not.toContain('blocked')
  })

  it('máy không cảm ứng thì effect thoát sớm, không gắn gì', () => {
    expect(man).toContain('if (!coCamUng()) return')
  })

  it('ca cũ (không bật) thì effect không chạy — hành vi cũ nguyên vẹn', () => {
    expect(man).toContain('if (!a || !batCuaCa(a)) return')
  })

  // 06/09: che-vì-bất-động của BAOMATCATHI đã GỠ HẲN cho mọi ca, nên không còn
  // gì phải nhường nhau nữa. Ca không bật Giữ để đọc thì đề hiện suốt.
  it('không còn tấm che thứ hai nào để chồng lên — che-vì-bất-động đã gỡ', () => {
    expect(man).not.toContain('nhipBatDong')
    expect(man).not.toContain('dangCheBatDong')
  })
})
