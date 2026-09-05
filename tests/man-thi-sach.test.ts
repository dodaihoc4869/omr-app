// MÀN THI SẠCH — luật khoá theo tín hiệu mới (BAOMATCATHI.md mục 3, 4.1, 4.3).
//
// Chỗ đáng kiểm nhất không phải "có bắt được chụp màn hình không" mà là "có
// khoá oan em không làm gì không". Luật một-lần-là-khoá không có ân hạn, nên
// mỗi cái sai ở đây là một em bị dừng bài giữa giờ.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mocRoiMan } from '../src/lib/chong-gian-lan'
import { MS_TRUNG_KHOP, type PhieuKenh } from '../src/lib/do-dau-vet'
import {
  HO_CUA_KENH,
  LOI_KHOA,
  MS_LECH_DONG_HO_CHOT,
  MS_RAF_NGHI_CHOT,
  MUC_NGAT_CA_CU,
  NGUONG_XUNG_CHOT,
  SO_NGON_CHUP,
  TEN_LY_DO_KHOA,
  TI_LE_CO_MAN_CHOT,
  chuNhomPhieu,
  chuanHoaMucNgat,
  coKhoa,
  duKhoaMotMinh,
  laCuaSoNoi,
  LOI_CHE_BAT_DONG,
  MS_BAT_DONG_CHE,
  MS_KHONG_CHAM_QUANH_PHIEU,
  MS_NHIP_SOI_TIEU_DIEM,
  nhomDuKhoa,
  soHoKhacNhau,
  xetCoMan,
  type TrangThaiCoMan,
} from '../src/lib/man-thi-sach'

const p = (kenh: PhieuKenh['kenh'], luc: number): PhieuKenh => ({ kenh, luc, chiTiet: '' })

describe('HỌ KÊNH — chỗ chống khoá oan', () => {
  it('kênh 5 và kênh 6 cùng một họ: cuộn nhanh làm cả hai cùng báo cũng KHÔNG khoá', () => {
    // Luồng chính nghẽn thì nhịp vẽ và lệch đồng hồ luôn báo cùng nhau. Đếm
    // theo kênh thì đủ "2 kênh" và khoá oan; đếm theo họ thì chỉ một phiếu.
    expect(soHoKhacNhau([p('nhip_ve', 1000), p('lech_dong_ho', 1050)])).toBe(1)
    expect(nhomDuKhoa([p('nhip_ve', 1000), p('lech_dong_ho', 1050)])).toHaveLength(0)
  })

  it('kênh 1 và kênh 2 cùng một họ: chuyển app bắn cả hai cũng KHÔNG thành dấu vết chụp', () => {
    expect(soHoKhacNhau([p('an_trang', 1000), p('tieu_diem', 1010)])).toBe(1)
    expect(nhomDuKhoa([p('an_trang', 1000), p('tieu_diem', 1010)])).toHaveLength(0)
  })

  it('bóp nút + lớp phủ + luồng chính nghẽn = BA họ độc lập → khoá', () => {
    const nhom = nhomDuKhoa([p('xung_chuyen_dong', 1000), p('an_trang', 1080), p('nhip_ve', 1200)])
    expect(nhom).toHaveLength(1)
    expect(soHoKhacNhau(nhom[0])).toBe(3)
  })

  it('hai họ cách nhau quá 300 ms → không khoá', () => {
    expect(nhomDuKhoa([p('xung_chuyen_dong', 1000), p('nhip_ve', 1400)])).toHaveLength(0)
  })

  it('mỗi kênh thuộc đúng một họ, không sót kênh nào', () => {
    expect(Object.keys(HO_CUA_KENH)).toHaveLength(8)
    expect(HO_CUA_KENH.nhip_ve).toBe(HO_CUA_KENH.lech_dong_ho)
    expect(HO_CUA_KENH.an_trang).toBe(HO_CUA_KENH.tieu_diem)
    expect(HO_CUA_KENH.xung_chuyen_dong).toBe('vat_ly')
  })

  it('câu ghi nhật ký nói rõ kênh nào đã báo', () => {
    expect(chuNhomPhieu([p('nhip_ve', 1), p('xung_chuyen_dong', 2)])).toBe('kênh 5 (nhịp vẽ khung) + kênh 8 (xung chuyển động)')
  })

  it('cửa sổ gộp vẫn đúng 300 ms', () => {
    expect(MS_TRUNG_KHOP).toBe(300)
  })
})

describe('đo kích thước — bốn chỗ dễ khoá oan nhất', () => {
  const nen = (rong: number, cao: number): TrangThaiCoMan => ({ moc: rong * cao, nhoTu: null })
  const d = (rong: number, cao: number, bayGio: number, dangGoO = false) => ({ rong, cao, dangGoO, bayGio, tiLe: TI_LE_CO_MAN_CHOT, msXacNhan: 600 })

  it('BÀN PHÍM ẢO lúc gõ Phần III → không bao giờ khoá', () => {
    const kq = xetCoMan(nen(390, 844), d(390, 420, 5000, true))
    expect(kq.khoa).toBe(false)
  })

  it('XOAY NGANG máy → không khoá, vì so diện tích chứ không so chiều', () => {
    const kq = xetCoMan(nen(390, 844), d(844, 390, 5000))
    expect(kq.khoa).toBe(false)
    expect(kq.tiLeHienTai).toBe(1)
  })

  it('chia đôi màn hình giữ 600 ms → KHOÁ', () => {
    let tt = nen(390, 844)
    let kq = xetCoMan(tt, d(390, 400, 1000))
    expect(kq.khoa).toBe(false)
    tt = kq.tt
    kq = xetCoMan(tt, d(390, 400, 1600))
    expect(kq.khoa).toBe(true)
  })

  it('thu nhỏ rồi trả lại trong 300 ms → KHÔNG khoá', () => {
    let tt = nen(390, 844)
    tt = xetCoMan(tt, d(390, 400, 1000)).tt
    const kq = xetCoMan(tt, d(390, 844, 1300))
    expect(kq.khoa).toBe(false)
    expect(kq.tt.nhoTu).toBeNull()
  })

  it('mốc TỰ NÂNG khi cửa sổ to hơn, KHÔNG BAO GIỜ hạ', () => {
    const tt = xetCoMan(nen(390, 844), d(390, 900, 1000)).tt
    expect(tt.moc).toBe(390 * 900)
    // sau đó nhỏ lại về cỡ ban đầu vẫn tính theo mốc mới
    const sau = xetCoMan(tt, d(390, 844, 2000))
    expect(sau.tt.moc).toBe(390 * 900)
    expect(sau.khoa).toBe(false)
  })
})

describe('ba mức ngặt', () => {
  it('Bình thường → mọi tín hiệu mới KHÔNG khoá, giống hệt bản đang chạy', () => {
    for (const ly of ['cua_so_noi', 'thu_nho_man', 'thoat_toan_man', 'dau_vet_chup'] as const) {
      expect(coKhoa('binh_thuong', ly)).toBe(false)
    }
  })

  it('Ngặt → cửa sổ nổi lần đầu chỉ cảnh báo, lần hai mới khoá', () => {
    expect(coKhoa('ngat', 'cua_so_noi', 1)).toBe(false)
    expect(coKhoa('ngat', 'cua_so_noi', 2)).toBe(true)
    expect(coKhoa('ngat', 'dau_vet_chup', 1)).toBe(true)
  })

  it('Rất ngặt → khoá ngay lần đầu cả bốn tín hiệu', () => {
    for (const ly of ['cua_so_noi', 'thu_nho_man', 'thoat_toan_man', 'dau_vet_chup'] as const) {
      expect(coKhoa('rat_ngat', ly, 1)).toBe(true)
    }
  })

  it('ca mở trước bản này (không có cột MucNgat) rơi về Bình thường', () => {
    expect(chuanHoaMucNgat(undefined)).toBe(MUC_NGAT_CA_CU)
    expect(chuanHoaMucNgat('')).toBe('binh_thuong')
    expect(chuanHoaMucNgat('rat_ngat')).toBe('rat_ngat')
  })
})

describe('lời lẽ máy sinh ra', () => {
  it('không câu nào kết luận gian lận', () => {
    for (const v of [...Object.values(LOI_KHOA), ...Object.values(TEN_LY_DO_KHOA)]) {
      expect(v).not.toMatch(/gian lận|quay cóp|vi phạm/i)
    }
  })

  it('mỗi lý do khoá đều bảo em giơ tay gọi Thầy — khoá là dừng bài chờ thầy, không phải mất bài', () => {
    for (const v of Object.values(LOI_KHOA)) expect(v).toContain('giơ tay gọi Thầy')
  })
})

describe('ngưỡng chốt — nhạy nhất mà vẫn trên nhiễu', () => {
  it('nhịp vẽ ≥ 10 khung ở 60 fps, cao hơn hẳn nhiễu cuộn', () => {
    expect(MS_RAF_NGHI_CHOT / (1000 / 60)).toBeGreaterThan(10)
  })

  it('xung bóp nút giữ đúng khoảng 40–200 ms của đặc tả, z không được trội', () => {
    expect(NGUONG_XUNG_CHOT.msMin).toBe(40)
    expect(NGUONG_XUNG_CHOT.msMax).toBe(200)
    expect(NGUONG_XUNG_CHOT.tiLeZToiDa).toBeLessThan(1)
  })
})

describe('không đụng luật rời app đang chạy tốt', () => {
  it('mocRoiMan bỏ qua bốn loại sự kiện mới, cho kết quả y như khi không có chúng', () => {
    const cu = [
      { type: 'hidden', at: '2026-09-05T01:00:00.000Z' },
      { type: 'visible', at: '2026-09-05T01:00:05.000Z' },
    ]
    const lanMoi = [
      { type: 'hidden', at: '2026-09-05T01:00:00.000Z' },
      { type: 'co_man', at: '2026-09-05T01:00:01.000Z' },
      { type: 'dau_vet_chup', at: '2026-09-05T01:00:02.000Z' },
      { type: 'visible', at: '2026-09-05T01:00:05.000Z' },
      { type: 'khoa', at: '2026-09-05T01:00:06.000Z' },
    ]
    expect(mocRoiMan(lanMoi)).toEqual(mocRoiMan(cu))
  })
})

describe('màn làm bài nối đúng dây', () => {
  it('ba tấm đệm chống oan còn nguyên trong mã nguồn', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    // 1. ân hạn 3 giây đầu
    expect(ma).toContain('conAnHan()')
    expect(ma).toContain('MS_AN_HAN_VAO_BAI')
    // 2. nhịp chờ 900 ms trước khi kết luận cửa sổ nổi
    expect(ma).toContain('MS_XAC_NHAN_CUA_SO_NOI')
    expect(ma).toContain('laCuaSoNoi({ coTieuDiem: document.hasFocus()')
    // 3. màn khoá bảo em giơ tay gọi Thầy
    expect(ma).toContain('Em giơ tay gọi Thầy')
  })

  it('bàn phím ảo được loại trừ ngay tại chỗ đo kích thước', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement')
  })

  it('lá chắn CSS chỉ bật khi ĐÃ thật sự vào toàn màn hình', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain("if (document.fullscreenElement) document.documentElement.setAttribute('data-la-chan'")
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toContain('html[data-la-chan]:not(:fullscreen) .thi-noi-dung')
  })

  it('chặn sao chép đề: contextmenu, copy, cut, dragstart và chặn in', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain("'contextmenu', 'copy', 'cut', 'dragstart'")
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toContain('Đề thi không được in')
  })

  it('nội dung đề nằm trong .thi-noi-dung để lá chắn CSS che được', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('thi-hai-cot thi-noi-dung')
  })
})

// SỬA 05/09 tối — thầy thử thật: mở cửa sổ chat Messenger đè lên bài mà KHÔNG
// khoá. Bản trước ghi nhớ "đã từng thấy hidden chưa" rồi dùng cái nhớ đó để
// loại; Android bắn hidden một nhịp rồi visible lại ngay, thế là cả phiên bị
// đóng dấu "rời app" vĩnh viễn.
describe('cửa sổ nổi — xét trạng thái tại mốc 900 ms, không tin cái nhớ', () => {
  it('trang CÒN HIỆN mà mất tiêu điểm → là cửa sổ nổi, dù trước đó đã có hidden', () => {
    expect(laCuaSoNoi({ coTieuDiem: false, manConHien: true })).toBe(true)
  })

  it('trang đã khuất hẳn → KHÔNG phải cửa sổ nổi, để luật đếm rời app cũ lo', () => {
    expect(laCuaSoNoi({ coTieuDiem: false, manConHien: false })).toBe(false)
  })

  it('còn tiêu điểm → không phải cửa sổ nổi, kể cả khi màn còn hiện', () => {
    expect(laCuaSoNoi({ coTieuDiem: true, manConHien: true })).toBe(false)
  })

  it('soi đủ dày để khoá trong khoảng một giây, đúng tiêu chí đặc tả mục 8', () => {
    expect(MS_NHIP_SOI_TIEU_DIEM).toBeLessThanOrEqual(250)
  })

  it('màn làm bài có NHỊP SOI tiêu điểm — bắt cả ca overlay không bắn blur lần nào', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('nhipTieuDiem')
    expect(ma).toContain("khoaVi('cua_so_noi', 'nhịp soi tiêu điểm')")
    // vẫn phải giữ đủ 900 ms mới khoá — không bỏ nhịp chờ
    expect(ma).toContain('if (nay - mocMatTieuDiem < MS_XAC_NHAN_CUA_SO_NOI) return')
  })
})

// SỐ ĐO THẬT của thầy 05/09 tối, chụp màn hình trên Android: CHỈ kênh 6 báo
// (lệch −210 ms), bảy kênh kia im, và dòng nhật ký ghi "không chạm".
//
// Luật "≥ 2 họ" vì thế không bao giờ đạt. Thêm đường thứ hai: một phiếu họ
// luồng-chính mà KHÔNG AI CHẠM MÀN cũng đủ khoá. Đây là điều kiện phủ định, chứ
// không phải hạ ngưỡng.
describe('khoá một mình khi không chạm màn', () => {
  it('nghẽn luồng chính mà KHÔNG ai chạm màn → đủ khoá', () => {
    expect(duKhoaMotMinh({ hoLuongChinh: true, coChamMan: false, dangLamBaiBinhThuong: true })).toBe(true)
  })

  it('nghẽn khi TAY ĐANG CHẠM MÀN (cuộn, gõ đáp án) → KHÔNG khoá', () => {
    expect(duKhoaMotMinh({ hoLuongChinh: true, coChamMan: true, dangLamBaiBinhThuong: true })).toBe(false)
  })

  it('kênh khác họ (xung chuyển động, ẩn trang) không được khoá một mình', () => {
    expect(duKhoaMotMinh({ hoLuongChinh: false, coChamMan: false, dangLamBaiBinhThuong: true })).toBe(false)
  })

  it('đang mất tiêu điểm thì để nhánh cửa sổ nổi lo, không tính là dấu vết chụp', () => {
    expect(duKhoaMotMinh({ hoLuongChinh: true, coChamMan: false, dangLamBaiBinhThuong: false })).toBe(false)
  })

  it('ngưỡng kênh 6 hạ xuống DƯỚI số đo thật 210 ms để chắc chắn bắt được', () => {
    expect(MS_LECH_DONG_HO_CHOT).toBeLessThan(210)
    // nhưng vẫn cao gấp hàng chục lần jitter thường thấy (vài ms)
    expect(MS_LECH_DONG_HO_CHOT).toBeGreaterThanOrEqual(100)
  })

  it('cửa sổ tránh chạm đủ rộng để bao trọn một nhát cuộn', () => {
    expect(MS_KHONG_CHAM_QUANH_PHIEU).toBeGreaterThanOrEqual(400)
  })

  it('màn làm bài đợi thêm rồi mới chốt — ngón tay có thể chạm NGAY SAU nhát nghẽn', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('const chamSau = performance.now() - mocChamManCuoi < MS_KHONG_CHAM_QUANH_PHIEU')
    expect(ma).toContain('duKhoaMotMinh({')
    expect(ma).toContain('không chạm màn')
  })
})

// VIDEO THỨ HAI của thầy 05/09 tối: cửa sổ nổi Gemini đè lên bài mà `hasFocus`
// vẫn true, `visibilityState` vẫn 'visible', cỡ cửa sổ không đổi — không API
// web nào nhìn thấy lớp phủ của app khác. Nên đổi cách: thôi cố nhìn thứ không
// nhìn được, quay sang hai thứ đo được chắc chắn.
describe('hai cách không dựa vào tín hiệu hệ điều hành', () => {
  it('ba ngón chạm cùng lúc là cử chỉ chụp màn hình, không phải thao tác làm bài', () => {
    // một ngón chọn đáp án, hai ngón phóng ảnh — ba ngón thì chỉ có chụp
    expect(SO_NGON_CHUP).toBe(3)
  })

  it('màn làm bài đếm số ngón và khoá ngay, không cần ngưỡng nào', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('if (!t || t.length < SO_NGON_CHUP) return')
    expect(ma).toContain("khoaVi('dau_vet_chup', `${t.length} ngón chạm cùng lúc`)")
    // vẫn tôn trọng ân hạn 3 giây đầu và mức ngặt
    expect(ma).toContain('if (daKhoa || conAnHan()) return')
  })

  it('che đề khi bất động — 20 giây, đủ dài để đọc câu dài nhất', () => {
    expect(MS_BAT_DONG_CHE).toBe(20000)
  })

  it('che vì bất động KHÔNG phải hình phạt: không trách em, chạm là hiện lại', () => {
    expect(LOI_CHE_BAT_DONG).toMatch(/Chạm vào màn hình/)
    expect(LOI_CHE_BAT_DONG).not.toMatch(/gian lận|quay cóp|vi phạm|khoá/i)
  })

  it('chạm là bỏ che NGAY, không đợi nhịp một giây', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma).toContain('if (dangCheBatDong) {')
    expect(ma).toContain('nhipBatDong')
    // cuộn và gõ phím cũng tính là còn làm bài
    expect(ma).toContain("document.addEventListener('scroll', ghiChamMan")
    expect(ma).toContain("document.addEventListener('keydown', ghiChamMan)")
  })
})
