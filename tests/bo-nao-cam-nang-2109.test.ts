// BỘ NÃO — CẨM NANG KHỚP MÃ (`bo-nao/HUONG-DAN-BO-NAO.md`, Code 1, 21/09/2026): cẩm nang nói gì thì mã làm đúng vậy — hằng số, khuôn, điều kiện `khac_phuc`, vắng, lịch buổi tối/trần hạn ngắn.
// Đổi hằng số hoặc luật mà quên sửa cẩm nang ⇒ đỏ (lượt 04:00 không được hứa sai).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { HAN_MUC_BO_NAO, KHI_NAO_VIET_PHU_HUYNH } from '../src/lib/bo-nao-khuon'
import { VANG_TU_DONG_DEN, VANG_TU_DONG_TU } from '../src/lib/bo-nao-vang'

const camNang = readFileSync('bo-nao/HUONG-DAN-BO-NAO.md', 'utf8')
const H = HAN_MUC_BO_NAO
const so = (n: number) => String(n).replace('.', ',')

describe('cẩm nang khớp hằng số của khuôn', () => {
  it('độ dài lời, ngưỡng tin cậy, trần lời phụ huynh, số phần tử', () => {
    expect(camNang).toContain(`"loiNhanChoEm": "≤ ${H.LOI_NHAN_TOI_DA} ký tự`)
    expect(camNang).toContain(`≤ ${H.LOI_NHAN_TOI_DA} ký tự; tiếng Việt tự nhiên`) // luật lời cho em (từng là 140, sai)
    expect(camNang).not.toMatch(/≤ 140 ký tự/)
    expect(camNang).toContain(`"loiNhanChoPhuHuynh": "≤ ${H.LOI_PHU_HUYNH_TOI_DA} ký tự`)
    expect(camNang).toContain(`"thuTuan": "≤ ${H.THU_TUAN_TOI_DA} ký tự`)
    expect(camNang).toContain(`\`doTinCay\` < ${so(H.NGUONG_TIN_CAY)} ⇒ máy chủ chỉ ghi sổ`)
    expect(camNang).not.toMatch(/`doTinCay` < 0,5/)
    expect(camNang).toContain(`≥ ${so(H.NGUONG_TIN_CAY)} sẽ ĐƯỢC ÁP NGAY`)
    expect(camNang).toContain(`tối đa ${H.TRAN_LOI_PHU_HUYNH_7_NGAY} lời trong 7 ngày`)
    expect(camNang).toContain(`\`khacPhuc\` ≤ ${H.SO_KHAC_PHUC_TOI_DA} phần tử, \`soCau\` ∈ [${H.KHAC_PHUC_SO_CAU_TOI_THIEU}, ${H.KHAC_PHUC_SO_CAU_TOI_DA}]`)
    for (const k of KHI_NAO_VIET_PHU_HUYNH) void k // danh sách lý do nằm ở thẻ (`khiNaoVietPhuHuynh`); cẩm nang chỉ dẫn tới thẻ
    expect(camNang).toContain('`khiNaoVietPhuHuynh`')
  })
})

describe('cẩm nang nói ĐÚNG điều kiện của khắc phục luôn', () => {
  it('khac_phuc chỉ khi thẻ có coBaiCaNhanDangChay + soCauConLaiCungDang; ô đầu/ô hai theo bậc; không hứa "ngày mai" cho khac_phuc; không nêu số câu; vi phạm ⇒ loại cả phần tử', () => {
    expect(camNang).toContain('KHẮC PHỤC LUÔN — khi nào được dùng')
    expect(camNang).toContain('`coBaiCaNhanDangChay`')
    expect(camNang).toContain('`soCauConLaiCungDang[<dạng>]`')
    expect(camNang).toContain('`dung_bac` đọc ô đầu, `thap_hon_mot_bac` đọc ô hai')
    expect(camNang).toContain('chặng CHƯA MỞ kế tiếp')
    expect(camNang).toContain('không phải "ngày mai"')
    expect(camNang).toContain('LOẠI CẢ phần tử')
    expect(camNang).toContain('không nêu số câu')
    // câu cũ hứa suông đã bị gỡ
    expect(camNang).not.toContain('NGAY ngày mai ở bậc làm được')
    expect(camNang).not.toContain('mai mình xếp sẵn ba câu')
  })
  it('tên trường trong cẩm nang có thật trong mã của thẻ', () => {
    const the = readFileSync('src/lib/bo-nao-dac-trung.ts', 'utf8')
    for (const truong of ['coBaiCaNhanDangChay', 'soCauConLaiCungDang']) expect(the).toContain(truong)
  })
})

describe('cẩm nang khớp luồng vắng và lịch chặng bản 1.3/1.4', () => {
  it(`vắng ${VANG_TU_DONG_TU}–${VANG_TU_DONG_DEN} ngày do thuật toán, tệp vang chỉ từ ${VANG_TU_DONG_DEN + 1} ngày`, () => {
    expect(camNang).toContain('em vắng ≥ 5 ngày')
    expect(VANG_TU_DONG_DEN + 1).toBe(5)
    expect(camNang).toContain('`tu-dong/vang.json`')
    expect(camNang).toContain(`${VANG_TU_DONG_TU}–${VANG_TU_DONG_DEN} ngày do THUẬT TOÁN`)
    expect(camNang).not.toContain('`vao/vang.json` (em vắng ≥ 2 ngày')
  })
  it('lịch theo buổi tối: hạn buổi trưa ⇒ tối ngày hạn không tính; hạn ngắn có trần số câu ⇒ không hứa thêm câu, không hứa ngày mở chặng', () => {
    expect(camNang).toContain('BUỔI TỐI')
    expect(camNang).toContain('tối ngày hạn KHÔNG tính')
    expect(camNang).toContain('TRẦN số câu theo số buổi tối còn lại')
    expect(camNang).toContain('đừng hứa "thêm câu"')
    expect(camNang).toContain('Không hứa em "sẽ có chặng X vào ngày Y"')
  })
  it('LUAT-RUT-GON (trợ lý con đọc thay cẩm nang) cũng có dặn về trần hạn ngắn', () => {
    const luat = readFileSync('bo-nao/LUAT-RUT-GON.md', 'utf8')
    expect(luat).toContain('hạn ngắn có trần câu')
    expect(luat).toContain('đừng hứa thêm câu')
    expect(luat.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(1200)
  })
})
