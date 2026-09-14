// GỘP DẤU TIẾNG VIỆT VỀ MỘT KÝ TỰ (NFC) — MỌI PHIẾU, MỌI BÁO CÁO, MỌI CA.
//
// Thầy 14/09 kèm ảnh tờ chiếu: "Hợp châ ́t", "tiê ́t ra", "vê ̀ mô ́i nguy hiểm",
// "tâ ́n công", "câ ́u tạo", "liên kê ́t" — dấu sắc và dấu huyền rơi ra đứng
// riêng sau chữ cái.
//
// NGUYÊN NHÂN GỐC: đề rút từ PDF hay ra chữ ở dạng NFD — 'ấ' được ghi thành
// 'â' (U+00E2) + U+0301 (dấu sắc tổ hợp). Hai cách ghi cùng một chữ, nhưng
// phông nào không có bảng gộp dấu thì vẽ thành hai ký tự rời. Cỡ chữ càng lớn
// càng lộ, nên tờ chiếu lên bảng thấy trước — phiếu và báo cáo cũng dính, chỉ
// là chữ nhỏ nên khó thấy.
//
// CHỮA Ở TẦNG HIỂN THỊ, không phải ở kho: `goKyTuLa` nằm trên đường của
// `chuHtml`, nên mọi ca cũ và mọi link phiếu đã gửi đi tự đúng, không phải nạp
// lại một tờ đề nào.
//
// CHUỖI ĐỐI CHỨNG VIẾT BẰNG MÃ THOÁT, không viết chữ thẳng: chính tệp nguồn
// trên máy thầy cũng đang lưu ở dạng NFD (macOS), nên gõ chữ vào đây là không
// biết mình đang cầm dạng nào.
import { describe, it, expect } from 'vitest'
import { goKyTuLa } from '../src/lib/chu-la-pdf'
import { chuHtml, thoat } from '../src/lib/html-phieu'

const SAC = '\u0301'
const HUYEN = '\u0300'

/** "Hợp chất" — 'ấ' tách thành 'â' + dấu sắc. */
const NFD_CHAT = 'H\u1ee3p ch\u00e2' + SAC + 't'
/** "tiết" — 'ế' tách thành 'ê' + dấu sắc. */
const NFD_TIET = 'ti\u00ea' + SAC + 't'
/** "về mối" — dấu huyền và dấu sắc đều tách. */
const NFD_VE_MOI = 'v\u00ea' + HUYEN + ' m\u00f4' + SAC + 'i'

describe('Gộp dấu NFD → NFC', () => {
  it('chuỗi đối chứng thật sự ở dạng NFD', () => {
    expect(NFD_CHAT.includes(SAC)).toBe(true)
    expect(NFD_VE_MOI.includes(HUYEN)).toBe(true)
    expect(NFD_CHAT.normalize('NFC')).not.toBe(NFD_CHAT)
  })

  it('goKyTuLa gộp dấu sắc, không để dấu đứng rời', () => {
    const ra = goKyTuLa(NFD_CHAT)
    expect(ra).toBe('H\u1ee3p ch\u1ea5t')
    expect(ra.includes(SAC)).toBe(false)
    expect(goKyTuLa(NFD_TIET)).toBe('ti\u1ebft')
  })

  it('gộp cả dấu huyền', () => {
    const ra = goKyTuLa(NFD_VE_MOI)
    expect(ra).toBe('v\u1ec1 m\u1ed1i')
    expect(ra.includes(HUYEN)).toBe(false)
  })

  it('chuHtml — đường của mọi phiếu, mọi báo cáo, tờ chiếu — cũng gộp', () => {
    const ra = chuHtml(NFD_CHAT + ' ' + NFD_TIET)
    expect(ra).toContain('H\u1ee3p ch\u1ea5t')
    expect(ra).toContain('ti\u1ebft')
    expect(ra.includes(SAC)).toBe(false)
  })

  it('thoat — tên em, tiêu đề — cũng gộp', () => {
    const ten = 'Nguy\u1ec5n V\u0103n Tu\u00e2' + SAC + 'n'
    expect(thoat(ten)).toBe('Nguy\u1ec5n V\u0103n Tu\u1ea5n')
  })

  it('chữ đã đúng sẵn thì KHÔNG đổi', () => {
    const dung = 'C\u00e2n b\u1eb1ng ho\u00e1 h\u1ecdc'
    expect(goKyTuLa(dung)).toBe(dung)
    expect(thoat(dung)).toBe(dung)
  })

  it('công thức và chỉ số dưới vẫn chạy như cũ', () => {
    expect(chuHtml('CH3COOH')).toContain('sub')
  })

  it('rỗng và null vẫn an toàn', () => {
    expect(goKyTuLa('')).toBe('')
    expect(goKyTuLa(null)).toBe('')
    expect(goKyTuLa(undefined)).toBe('')
  })
})
