// KHÔNG LẶNG LẼ BỎ QUA VIỆC ĐẨY DANH SÁCH SANG MÁY CHỦ MỚI — 11/09.
//
// CHUYỆN THẬT HÔM NAY. Thầy bấm "Đồng bộ danh sách", màn hình báo xanh, số em
// đúng. Nhưng đếm trên D1:
//
//     SELECT COUNT(*) FROM danh_sach  →  0
//
// Bảng `danh_sach` là CỔNG VÀO THI của máy chủ mới. Nó rỗng thì Worker cố ý
// không chặn ai — tức ai có mã ca cũng gõ một số báo danh bất kỳ rồi vào thi.
// Thầy tưởng cổng đã đóng, mà nó mở toang.
//
// NGUYÊN NHÂN GỐC: `dayDanhSachMoi` trả `false` khi cờ máy chủ mới đang TẮT,
// và `napDanhSachLop` nuốt luôn giá trị trả về trong một `try {} catch {}`
// không đọc kết quả. Cờ tắt → đẩy trượt → không ai biết.
//
// Không sửa bằng cách "đẩy kể cả khi cờ tắt" — cờ tắt là thầy chủ ý tắt. Sửa
// bằng cách NÓI RA: mỗi lượt đồng bộ phải kết luận máy chủ mới đã nhận hay
// chưa, và "chưa" thì nút phải ĐỎ.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { tomTatDongBo } from '../src/components/NutDongBoDanhSach'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const NUT = fs.readFileSync(path.join(process.cwd(), 'src/components/NutDongBoDanhSach.tsx'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ClassListScreen.tsx'), 'utf8')

const NEN = { soDong: 250, them: [], bo: [], doiTen: [] }

describe('LỜI BÁO PHẢI NÓI MÁY CHỦ MỚI CÓ NHẬN KHÔNG', () => {
  it('đẩy trượt ⇒ nói to, bằng CHỮ HOA', () => {
    const t = tomTatDongBo({ ...NEN, mayChuMoi: 'hong' })
    expect(t).toContain('MÁY CHỦ MỚI CHƯA NHẬN')
  })

  it('đẩy được ⇒ vẫn nói, để thầy biết cổng đã đóng thật', () => {
    expect(tomTatDongBo({ ...NEN, mayChuMoi: 'ok' })).toContain('máy chủ mới đã nhận')
  })

  it('cờ đang tắt ⇒ KHÔNG bịa là đã nhận, cũng không kêu hỏng', () => {
    const t = tomTatDongBo({ ...NEN, mayChuMoi: 'tat' })
    expect(t).toBe('250 em')
  })

  it('vẫn giữ nguyên mọi con số cũ', () => {
    const t = tomTatDongBo(
      { soDong: 250, them: [{ sbd: '12050', hoTen: 'A' }], bo: [{ sbd: '12001', hoTen: 'B' }], doiTen: [], mayChuMoi: 'ok' },
      1,
    )
    expect(t).toBe('250 em · +1 mới · −1 bỏ · 1 SBD trùng · máy chủ mới đã nhận')
  })
})

describe('NÚT PHẢI ĐỎ KHI CỔNG CHƯA ĐÓNG', () => {
  it('`hong` xếp cùng nhóm với "có em bị bỏ" — đều là chuyện phải nhìn', () => {
    expect(NUT).toContain("kq.mayChuMoi === 'hong' ? { kieu: 'loi', chu: tom }")
  })
})

describe('HÀM `napDanhSachLop` PHẢI KẾT LUẬN, KHÔNG ĐƯỢC NUỐT', () => {
  const HAM = API.slice(API.indexOf('export async function napDanhSachLop'), API.indexOf('export async function napDanhSachLop') + 1600)

  it('đọc giá trị trả về của `dayDanhSachMoi`, không gọi suông', () => {
    expect(HAM).toMatch(/mayChuMoi = \(await dayDanhSachMoi\(chMoi, secret, items\)\) \? 'ok' : 'hong'/)
  })

  it('cờ tắt thì KHÔNG gọi — cờ tắt là thầy chủ ý tắt', () => {
    expect(HAM).toContain('if (chMoi.BAT && chMoi.URL)')
  })

  it('lỗi ném ra cũng thành `hong`, không thành im lặng', () => {
    expect(HAM).toMatch(/\} catch \{\s*\n\s*mayChuMoi = 'hong'\s*\n\s*\}/)
  })

  it('kết luận đi ra ngoài cùng kết quả', () => {
    expect(HAM).toContain('mayChuMoi,')
  })

  it('nạp danh sách vào Sheet vẫn chạy TRƯỚC — đường cũ không phụ thuộc đường mới', () => {
    const iSheet = HAM.indexOf("action: 'napDanhSachLop'")
    const iMoi = HAM.indexOf('dayDanhSachMoi')
    expect(iSheet).toBeGreaterThan(0)
    expect(iMoi).toBeGreaterThan(iSheet)
  })
})

describe('MÀN DANH SÁCH LỚP CŨNG PHẢI NÓI', () => {
  it('toast nêu rõ khi máy chủ mới chưa nhận, và tô đỏ', () => {
    expect(MAN).toContain('MÁY CHỦ MỚI CHƯA NHẬN — bấm đồng bộ lại')
    expect(MAN).toContain("kq.mayChuMoi === 'hong' ? 'error'")
  })
})

describe('CA ĐO TẢI ĐƯỢC MIỄN CỔNG DANH SÁCH', () => {
  const W = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')

  it('số báo danh `DOTAI…` không phải nhét vào danh sách lớp mới đo được', () => {
    expect(W).toContain('if (maCa !== CA_DO_TAI && ca && (await coDanhSach(env)) && !(await docDanhSach(env, sbd)))')
  })

  it('mã ca đo là HẰNG SỐ trong mã, không nhận từ ngoài — nếu không đây là cửa sau', () => {
    const DT = fs.readFileSync(path.join(process.cwd(), 'server/src/do-tai.ts'), 'utf8')
    expect(DT).toContain("export const CA_DO_TAI = 'DOTAI'")
    // Worker KHÔNG được đọc mã ca đo từ thân yêu cầu ở bất kỳ đâu.
    expect(W).not.toMatch(/CA_DO_TAI\s*=\s*String\(b\./)
  })

  it('cổng vẫn chặn số báo danh lạ ở MỌI ca khác', () => {
    expect(W).toContain("lyDo: 'khong_co_sbd'")
    expect(W).toContain("SELECT 1 AS co FROM danh_sach LIMIT 1")
  })
})
