// CHUẨN HOÁ TỪ NGỮ · CỤM 4 "Ca thi → Ca kiểm tra" (Boss duyệt bảng docs/ra-soat-tu-ngu-2109-code2.md; CHUAN-TU-NGU A2:
// màn học sinh/phụ huynh dùng "Ca kiểm tra"; APP THẦY và màn THI THẬT giữ "Ca thi" — không nằm trong tệp dưới đây).
// Mã ca không bao giờ làm TÊN ("Ca thi #12001" ⇒ "Ca kiểm tra mã 12001"). Nhãn cổng vào ca chỉ đổi CHỮ, không đổi luật kiểm mã.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const doc = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
/** Các dòng CHỮ HIỆN RA (bỏ dòng chú thích). */
const dongChu = (p: string) =>
  doc(p)
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l) && !/\*\/\}?\s*$/.test(l)) // bỏ dòng chú thích (kể cả dòng kết thúc khối chú thích)
    .map((l) => l.replace(/\s\/\/\s.*$/, ''))

const TEP_HS_PH = [
  'src/components/bang-nhiem-vu/LichSuCaM3.tsx',
  'src/components/bang-nhiem-vu/muc-menu.tsx',
  'src/components/bang-nhiem-vu/VaoThiForm.tsx',
  'src/components/bang-nhiem-vu/NutVaoThi.tsx',
  'src/lib/nhiem-vu-adapter.ts',
  'src/lib/tro-ly-ca-nhan.ts',
  'src/screens/StudentPortalScreen.tsx',
  'src/screens/ParentPortalScreen.tsx',
  'src/components/KhoiKhacPhuc3CheDo.tsx',
  'src/components/ModalKhacPhucCauSai.tsx',
  'src/components/BangTinPhuHuynh.tsx',
  'src/components/BaoCaoCaThiPhuHuynhModal.tsx',
  'src/components/BaoCaoCaThiHocSinhModal.tsx',
  'src/components/InfographicHuongDan.tsx',
  'src/components/xem-diem/TheCaGanNhat.tsx', // thay CardCaThiGanNhat.tsx (mồ côi, đã xoá 21/09)
  'src/components/BieuDoTienBoGoogle.tsx',
  'src/components/ThanThuHoaHocGame.tsx',
]
// "phòng thi" của khung bao MÀN THI THẬT (aria "Đóng phòng thi", "Đang mở phòng thi…") thuộc luồng thi: không đụng.
const NGOAI_LE = /Đóng phòng thi|Đang mở phòng thi/

describe('Học sinh / phụ huynh: không còn "ca thi", "bài thi", "Lịch sử thi", "phòng thi" trong chữ hiện ra', () => {
  it.each(TEP_HS_PH)('%s', (t) => {
    const xau = dongChu(t).filter((l) => /[Cc]a thi|[Bb]ài thi|Lịch sử thi|Ca Thi|phòng thi/.test(l) && !NGOAI_LE.test(l))
    expect(xau).toEqual([])
  })
})

describe('chữ mới đúng chuẩn', () => {
  it('menu + tiêu đề sheet: "Xem điểm & lịch sử ca kiểm tra", "Báo cáo điểm các ca kiểm tra"', () => {
    const menu = doc('src/components/bang-nhiem-vu/muc-menu.tsx')
    expect(menu).toContain("nhan: 'Xem điểm & lịch sử ca kiểm tra'")
    expect(menu).toContain("nhan: 'Báo cáo điểm các ca kiểm tra'")
    expect(doc('src/screens/StudentPortalScreen.tsx')).toContain("tab === 'diem' ? 'Xem điểm & lịch sử ca kiểm tra'")
  })
  it('mã ca KHÔNG làm tên: "Ca kiểm tra mã …" (HS lịch sử, PH danh sách, khắc phục, thẻ gần nhất, báo cáo)', () => {
    for (const t of ['src/components/bang-nhiem-vu/LichSuCaM3.tsx', 'src/lib/the-ca-gan-nhat.ts', 'src/screens/ParentPortalScreen.tsx', 'src/screens/StudentPortalScreen.tsx'])
      expect(doc(t), t).toMatch(/Ca kiểm tra mã /)
    for (const t of TEP_HS_PH) expect(dongChu(t).join('\n'), t).not.toMatch(/Ca (thi|kiểm tra) #/)
    expect(doc('src/components/BaoCaoCaThiHocSinhModal.tsx')).toContain('ca kiểm tra (mã {baiThi.maCa})')
  })
  it('cổng vào ca: nhãn "Vào ca kiểm tra trực tuyến", "Mã ca kiểm tra (thường 6 chữ số)", "Vào ca kiểm tra"; LUẬT kiểm mã 4–8 chữ số GIỮ NGUYÊN', () => {
    const form = doc('src/components/bang-nhiem-vu/VaoThiForm.tsx')
    expect(form).toContain('Vào ca kiểm tra trực tuyến')
    expect(form).toContain('Mã ca kiểm tra (thường 6 chữ số)')
    expect(form).toContain('<span>Vào ca kiểm tra</span>')
    const cong = doc('src/screens/StudentPortalScreen.tsx')
    expect(cong).toContain('Mã ca kiểm tra (thường 6 chữ số)')
    expect(cong).toContain('Vui lòng nhập mã ca kiểm tra hợp lệ (từ 4 đến 8 chữ số)') // luật 4–8 chữ số không đổi (chỉ đổi chữ)
  })
  it('nút nổi khi ca đang mở: "Vào ca kiểm tra (đang mở)"; không ca: vẫn "Vào thi"', () => {
    expect(doc('src/components/bang-nhiem-vu/NutVaoThi.tsx')).toContain("caDangMo ? 'Vào ca kiểm tra (đang mở)' : 'Vào thi'")
  })
  it('trợ lý: "Ôn trước ca kiểm tra"', () => {
    expect(doc('src/lib/nhiem-vu-adapter.ts')).toContain("on_thi: 'Ôn trước ca kiểm tra'")
  })
})
