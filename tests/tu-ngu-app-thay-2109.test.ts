// RÀ SOÁT TỪ NGỮ APP THẦY — khoá các cụm đã sửa (docs/ra-soat-tu-ngu-2109-code4.md, Boss duyệt 21/09; chuẩn docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md mục A).
// Mỗi cụm: chữ MỚI có mặt + chữ CŨ không quay lại ở đúng các tệp giao diện của cụm. KHÔNG khoá luồng thi thật.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { moTaCauChoThay, nhanCuaCau, TEN_CAU_MAT } from '../src/lib/btvn-nang-do-thay'

const doc = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
/** Bỏ chú thích để chỉ soi CHỮ HIỆN RA (giữ nguyên chuỗi trong JSX/JS). */
const chuHienRa = (f: string) => doc(f).split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n')

describe('CỤM 1 · Giao bài tập về nhà + Xem trước + theo dõi (hàng 2, 3, 5, 6, 7, 11, 12)', () => {
  const TEP = ['src/screens/PhanCongScreen.tsx', 'src/components/KhoiBtvnLo.tsx', 'src/components/KhoiCaNhanHoa.tsx', 'src/components/XemTruocPhanBo.tsx', 'src/components/HocSinhNhanBai.tsx', 'src/lib/btvn-nang-do-thay.ts']

  it('hàng 2 + 3: "chặng" thay "lô", "Bài tập về nhà đã giao" thay "Đợt bài đã giao"', () => {
    const pc = chuHienRa('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('Chia chặng theo hạn nộp')
    expect(pc).toContain('Bài tập về nhà đã giao')
    expect(pc).not.toMatch(/Chia lô theo hạn nộp|Đợt bài đã giao/)
    const lo = chuHienRa('src/components/KhoiBtvnLo.tsx')
    expect(lo).toContain('Chặng {b.loHienTai} trong {b.tongLo} chặng')
    expect(lo).not.toMatch(/\blô \{|Lô \$\{/)
  })

  it('hàng 5 + 7: "câu cốt lõi" / "câu dành riêng cho em" — không còn "lõi"/"riêng" trơn ở chữ hiện ra; cột "CÂU CỐT LÕI / DÀNH RIÊNG"; tên màn "Xem trước phân bổ" GIỮ', () => {
    for (const f of TEP) {
      const c = chuHienRa(f)
      expect(c, f).not.toMatch(/(?<!cốt )[Ll]õi chung|LÕI \/ RIÊNG|\{[^}]*\} lõi ·|Lõi: \{|câu lõi trong|thêm vào lõi|phần riêng|bộ riêng|lõi \{t\.soLoi|phần lõi\./)
    }
    const xt = chuHienRa('src/components/XemTruocPhanBo.tsx')
    expect(xt).toContain('CÂU CỐT LÕI / DÀNH RIÊNG')
    expect(xt).toContain('Xem trước phân bổ') // tên màn: Boss giữ
    expect(chuHienRa('src/components/HocSinhNhanBai.tsx')).toContain('Câu cốt lõi: {e.soDungLoi}/{e.soCauLoi}')
  })

  it('hàng 6: nhãn câu theo chuẩn — "Câu cốt lõi" · "Câu dành riêng cho em" · "Câu thử thách (sai không sao)"', () => {
    expect(nhanCuaCau('loi').chu).toBe('Câu cốt lõi')
    expect(nhanCuaCau('dang_yeu').chu).toBe('Câu dành riêng cho em')
    expect(nhanCuaCau('cung_co').chu).toBe('Câu dành riêng cho em')
    expect(nhanCuaCau('thu_thach').chu).toBe('Câu thử thách (sai không sao)')
    expect(nhanCuaCau('khoi_dong').chu).toBe('Khởi động')
  })

  it('hàng 11: không bao giờ hiện mã dạng / mã câu nội bộ — chưa biết dạng ⇒ "chưa gắn dạng"; có mã mà chưa có tên ⇒ "dạng chưa đặt tên"; câu mất ⇒ lời thường', () => {
    const c = { chuyenDe: 'Este – khái niệm', dang: 'ESTE.KHAI_NIEM', mucDo: 0 as const, phan: 'I' }
    expect(moTaCauChoThay(14, c)).toBe('Câu 14 · Este – khái niệm · Biết · phần I')
    expect(moTaCauChoThay(3, { ...c, chuyenDe: '  ' })).toBe('Câu 3 · dạng chưa đặt tên · Biết · phần I')
    expect(moTaCauChoThay(3, { ...c, chuyenDe: '', dang: null })).toBe('Câu 3 · chưa gắn dạng · Biết · phần I')
    for (const s of [moTaCauChoThay(3, { ...c, chuyenDe: '' }), TEN_CAU_MAT]) expect(s).not.toMatch(/ESTE\.|[A-Z]{2,}[-.][A-Z]/)
    expect(TEN_CAU_MAT).toBe('Câu không còn trong bài')
    // nơi dựng chip ghim / dòng câu không còn rơi về mã qid
    expect(doc('src/components/KhoiCaNhanHoa.tsx')).not.toMatch(/: qid\}|: qid\)/)
    expect(doc('src/components/XemTruocPhanBo.tsx')).not.toMatch(/: qid\b/)
  })

  it('hàng 12: hộp xác nhận Giao bài — nút theo VIỆC ("Cho làm lại" / "Thu hồi bài") + "Giữ nguyên"; không còn "Hủy"/"Xác nhận" trơn', () => {
    const pc = chuHienRa('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('Giữ nguyên</button>')
    expect(pc).toContain('{xacNhan.nut}</button>')
    expect(pc).toContain("nut: 'Thu hồi bài'")
    expect(pc).toContain("nut: 'Cho làm lại'")
    expect(pc).not.toMatch(/>Hủy<\/button>|>Xác nhận<\/button>/)
  })
})

describe('CỤM 2 · Hồ sơ em / Bộ não / Ngân hàng đề (hàng 8, 10, 15)', () => {
  it('hàng 8 + 10: hoạt động gọi "Ôn lại" (không "Khắc phục:"); không mã dạng trơ trọi trong nhật ký điều chỉnh', () => {
    const bn = chuHienRa('src/lib/bo-nao-thay.ts')
    expect(bn).toContain('`Ôn lại: ${tenDangHienThi(k.dang, k.tenDang)}')
    expect(bn).not.toContain('`Khắc phục: ')
    expect(bn).not.toMatch(/: \$\{x\.ma\}`|: \$\{k\.dang\}`/) // mã dạng đi qua tenDangHienThi, không nối thẳng
    // "đã khắc phục" (trạng thái) và "Khắc phục sau ca" (phiếu quen) GIỮ — không khoá ở đây
  })

  it('hàng 15: Ngân hàng đề viết đầy đủ "Trắc nghiệm · Đúng–sai · Trả lời ngắn" (không TN / Đ/S / TLN); lỗi soạn đề nói "Đúng/Sai"', () => {
    const nh = chuHienRa('src/screens/NganHangDeScreen.tsx')
    expect(nh).toContain('· Trắc nghiệm {s.phanI.length}')
    expect(nh).toContain('· Đúng–sai {s.phanII.length}')
    expect(nh).toContain('· Trả lời ngắn {s.phanIII.length}')
    expect(nh).not.toMatch(/· TN \{|· Đ\/S \{|· TLN \{/)
    expect(chuHienRa('src/data/examContent.ts')).toContain('chưa đánh dấu đủ Đúng/Sai cho cả 4 ý')
  })
})

describe('CỤM 3 · Bộ não A.I · ngày giờ · Gọi lên bảng (hàng 9, 13, 18)', () => {
  it('hàng 9: "Bộ não A.I" ở mọi chữ hiện ra của app thầy (thông báo, nhãn nút, aria, lời lỗi) — không "bộ não" trơn', () => {
    for (const f of ['src/components/KhoiBoNaoDemQua.tsx', 'src/components/KhoiBoNaoCaiDat.tsx', 'src/components/NhatKyDieuChinh.tsx', 'src/lib/bo-nao-thay.ts', 'src/screens/CaiDatScreen.tsx']) {
      const c = chuHienRa(f).replace(/\/\^Bộ não A\\\.I/g, '') // bỏ regex nội bộ dò tiêu đề
      expect(c, f).not.toMatch(/\b[Bb]ộ não(?! A\.I)/)
    }
    expect(chuHienRa('src/components/KhoiBoNaoCaiDat.tsx')).toContain('aria-label="Bật Bộ não A.I"')
    expect(chuHienRa('src/components/KhoiBoNaoCaiDat.tsx')).not.toContain('câu khắc phục') // hoạt động gọi "ôn lại"
  })

  it('hàng 13: Gọi lên bảng hiện ngày giờ kiểu chuẩn "Hạn nộp 23:59 · Thứ … dd/mm/yyyy" (gioDayDu), không toLocaleDateString', () => {
    const g = chuHienRa('src/screens/GoiLenBangScreen.tsx')
    expect(g).toContain('Hạn nộp {gioDayDu(bt.hanNop)}')
    expect(g).toContain('Giao {gioDayDu(bt.giaoLuc)}')
    expect(g).not.toContain('toLocaleDateString(\'vi-VN\')}</span>')
  })

  it('hàng 18: một từ — mục "Gọi lên bảng" ở thanh bên và bộ lọc Toàn cảnh (nhãn ngắn thanh dưới điện thoại "Lên bảng" giữ vì hết chỗ)', () => {
    expect(chuHienRa('src/components/ThanhBenTrai.tsx')).toContain("ten: 'Gọi lên bảng'")
    expect(chuHienRa('src/lib/em-toan-canh.ts')).toContain("len_bang: 'Gọi lên bảng'")
  })
})

describe('CỤM 4 · Ngày giờ một kiểu (hàng 14) — giờ VN, 24 giờ, đủ số 0; danh sách gọn giữ "dd/mm HH:mm"', () => {
  it('ngayDayDu: "dd/mm/yyyy" đủ số 0 theo GIỜ VIỆT NAM (17:30Z đã sang ngày sau); mốc hỏng ⇒ chuỗi rỗng', async () => {
    const { ngayDayDu } = await import('../src/lib/ngay-gio-24')
    expect(ngayDayDu('2026-09-24T16:59:00Z')).toBe('24/09/2026')
    expect(ngayDayDu('2026-09-04T17:30:00Z')).toBe('05/09/2026')
    expect(ngayDayDu(Date.parse('2026-01-02T01:00:00Z'))).toBe('02/01/2026')
    expect(ngayDayDu('hỏng')).toBe('')
    expect(ngayDayDu(undefined, '—')).toBe('—')
  })

  it('HoSoEmView.ngayGio + gioPhutVN nhận số: "21/09 20:14" giờ VN, không lệ thuộc máy; 17:30Z ⇒ ngày kế', async () => {
    const { ngayGio } = await import('../src/components/HoSoEmView')
    const { gioPhutVN } = await import('../src/lib/em-toan-canh')
    expect(ngayGio('2026-09-21T13:14:00Z')).toBe('21/09 20:14')
    expect(ngayGio('2026-09-20T17:30:00Z')).toBe('21/09 00:30')
    expect(ngayGio('hỏng')).toBe('')
    expect(gioPhutVN(Date.parse('2026-09-21T13:14:00Z'))).toBe('20:14')
  })

  it('không còn toLocaleDateString/toLocaleString(vi-VN) trơ ở các chỗ đã sửa (ngày kiểu máy: "25/9/2026", "12:59:00")', () => {
    for (const f of ['src/screens/NganHangDeScreen.tsx', 'src/components/HoSoEmView.tsx', 'src/components/KhoiThoiGianCa.tsx', 'src/screens/CauHoiScreen.tsx', 'src/screens/LichSuCaScreen.tsx']) {
      expect(chuHienRa(f), f).not.toMatch(/toLocaleTimeString\('vi-VN'|toLocaleString\('vi-VN'|toLocaleDateString\('vi-VN'\)/)
    }
    expect(chuHienRa('src/screens/NganHangDeScreen.tsx')).toContain('ngayDayDu(s.ngayNap)')
  })
})

describe('Bộ soi G04 · thanh tiến độ giữ hoạt ảnh BỀ RỘNG (Boss dặn 21/09)', () => {
  it('ModalXacNhanNop: thanh có style width dùng transition-[width,background-color], KHÔNG transition-colors (mất hoạt ảnh bề rộng)', () => {
    const c = chuHienRa('src/components/ModalXacNhanNop.tsx')
    expect(c).toContain('transition-[width,background-color] duration-300')
    expect(c).not.toContain('transition-colors duration-300')
  })

  it('mọi tệp làn thầy đã đổi transition-all: không có dòng transition-colors nào đứng ngay trên một style width (thanh bề rộng)', () => {
    for (const f of ['src/components/DesignSystem.tsx', 'src/components/NhomCaThuGon.tsx', 'src/components/NutQuayLai.tsx', 'src/screens/CauHoiScreen.tsx', 'src/screens/ClassListScreen.tsx', 'src/screens/LichSuCaScreen.tsx', 'src/screens/ExamSetupScreen.tsx', 'src/screens/GoiLenBangScreen.tsx', 'src/components/HoSoEmView.tsx', 'src/components/ModalXacNhanNop.tsx', 'src/screens/PhanCongScreen.tsx', 'src/screens/HocSinhScreen.tsx']) {
      const dong = doc(f).split('\n')
      dong.forEach((l, i) => {
        if (!/transition-colors/.test(l)) return
        const gan = dong.slice(i, i + 8).join('\n')
        expect(/style=\{\{\s*width\s*:/.test(gan), `${f}:${i + 1} có transition-colors ngay trên thanh style width`).toBe(false)
      })
    }
  })
})
