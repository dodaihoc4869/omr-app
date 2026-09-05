// TÁM KÊNH ĐO DẤU VẾT CHỤP — phép kiểm của ĐỢT 0 (BAOMATCATHI.md mục 11).
//
// Đợt 0 chưa khoá ai, nên chỗ đáng kiểm nhất là hai luật sẽ quyết định khoá ở
// đợt sau: luật trùng khớp ≥ 2 kênh, và nhận dạng xung bóp nút. Sai hai chỗ này
// là khoá bài em không làm gì.
import { describe, expect, it } from 'vitest'
import {
  BAT_DUNG_TOI_THIEU,
  MS_LECH_DONG_HO,
  MS_RAF_NGHI,
  MS_TRUNG_KHOP,
  NGUONG_XUNG,
  kenhDuocKhoaMotMinh,
  nhanDangXungBop,
  phanLoaiRaMan,
  soKenhKhacNhau,
  vanBanNhatKy,
  xepLoaiKenh,
  xetTrungKhop,
  type MauChuyenDong,
  type NguongXung,
  type PhieuKenh,
} from '../src/lib/do-dau-vet'

const p = (kenh: PhieuKenh['kenh'], luc: number): PhieuKenh => ({ kenh, luc, chiTiet: '' })

describe('luật trùng khớp — chính xác nhờ trùng, không nhờ nhạy', () => {
  it('hai kênh cách nhau 250 ms → đủ khoá', () => {
    const kq = xetTrungKhop([p('nhip_ve', 1000), p('xung_chuyen_dong', 1250)])
    expect(kq.duKhoa).toHaveLength(1)
    expect(kq.donLe).toHaveLength(0)
  })

  it('hai kênh cách nhau 400 ms → KHÔNG khoá, chỉ là hai phiếu đơn lẻ', () => {
    const kq = xetTrungKhop([p('nhip_ve', 1000), p('xung_chuyen_dong', 1400)])
    expect(kq.duKhoa).toHaveLength(0)
    expect(kq.donLe).toHaveLength(2)
  })

  it('CÙNG một kênh báo hai lần KHÔNG thành hai phiếu — một mặt lặp lại không phải bằng chứng', () => {
    const kq = xetTrungKhop([p('nhip_ve', 1000), p('nhip_ve', 1100)])
    expect(kq.duKhoa).toHaveLength(0)
    expect(soKenhKhacNhau([p('nhip_ve', 1000), p('nhip_ve', 1100)])).toBe(1)
  })

  it('ba kênh trong cùng cửa sổ vẫn là MỘT nhóm', () => {
    const kq = xetTrungKhop([p('an_trang', 1000), p('tieu_diem', 1050), p('nhip_ve', 1200)])
    expect(kq.duKhoa).toHaveLength(1)
    expect(soKenhKhacNhau(kq.duKhoa[0])).toBe(3)
  })

  it('cửa sổ tính từ phiếu ĐẦU nhóm, không trượt theo phiếu cuối', () => {
    // 1000, 1250, 1500: phiếu thứ ba cách phiếu đầu 500 ms nên sang nhóm khác.
    const kq = xetTrungKhop([p('an_trang', 1000), p('tieu_diem', 1250), p('nhip_ve', 1500)])
    expect(kq.duKhoa).toHaveLength(1)
    expect(kq.duKhoa[0]).toHaveLength(2)
    expect(kq.donLe.map((x) => x.kenh)).toEqual(['nhip_ve'])
  })

  it('cửa sổ trùng khớp đúng 300 ms như đặc tả', () => {
    expect(MS_TRUNG_KHOP).toBe(300)
  })
})

describe('chưa đo thì chưa kênh nào được khoá một mình', () => {
  it('ba kênh số đo trực tiếp được khoá một mình ngay', () => {
    expect(kenhDuocKhoaMotMinh('toan_man')).toBe(true)
    expect(kenhDuocKhoaMotMinh('kich_thuoc')).toBe(true)
    expect(kenhDuocKhoaMotMinh('phim_chup')).toBe(true)
  })

  it('kênh dấu vết chụp CHƯA được khoá một mình khi ngưỡng còn để trống', () => {
    expect(MS_RAF_NGHI).toBeNull()
    expect(MS_LECH_DONG_HO).toBeNull()
    expect(NGUONG_XUNG).toBeNull()
    expect(kenhDuocKhoaMotMinh('nhip_ve')).toBe(false)
    expect(kenhDuocKhoaMotMinh('lech_dong_ho')).toBe(false)
    expect(kenhDuocKhoaMotMinh('xung_chuyen_dong')).toBe(false)
    expect(kenhDuocKhoaMotMinh('an_trang')).toBe(false)
    expect(kenhDuocKhoaMotMinh('tieu_diem')).toBe(false)
  })
})

// ---------------------------------------------------------------- KÊNH 8
const NG: NguongXung = { xoan: 2, msMin: 40, msMax: 200, tiLeZToiDa: 1 }

/** Dựng chuỗi mẫu 60 Hz: `dinh` là các đoạn có xoắn/z cao. */
function chuoi(dai: number, dinh: { tu: number; den: number; xoan: number; z: number }[]): MauChuyenDong[] {
  const ra: MauChuyenDong[] = []
  for (let t = 0; t <= dai; t += 16) {
    const d = dinh.find((x) => t >= x.tu && t <= x.den)
    ra.push({ luc: t, xoan: d ? d.xoan : 0.1, z: d ? d.z : 0.2 })
  }
  return ra
}

describe('nhận dạng xung bóp hai nút cứng', () => {
  it('chuỗi mẫu BÓP NÚT → khớp', () => {
    const kq = nhanDangXungBop(chuoi(3000, [{ tu: 2000, den: 2100, xoan: 3.5, z: 0.5 }]), [], NG)
    expect(kq.khop).toHaveLength(1)
    expect(kq.khop[0].dinhXoan).toBeCloseTo(3.5)
  })

  it('chuỗi mẫu GÕ MÀN HÌNH (z trội) → KHÔNG khớp', () => {
    const kq = nhanDangXungBop(chuoi(3000, [{ tu: 2000, den: 2100, xoan: 2.2, z: 9 }]), [], NG)
    expect(kq.khop).toHaveLength(0)
    expect(kq.loai[0].lyDo).toBe('z_troi')
  })

  it('nhát quá NGẮN → không khớp', () => {
    const kq = nhanDangXungBop(chuoi(3000, [{ tu: 2000, den: 2016, xoan: 4, z: 0.3 }]), [], NG)
    expect(kq.khop).toHaveLength(0)
    expect(kq.loai[0].lyDo).toBe('ngan_qua')
  })

  it('rung KÉO DÀI (xe chạy, đi bộ) → không khớp', () => {
    const kq = nhanDangXungBop(chuoi(3000, [{ tu: 1000, den: 2000, xoan: 3, z: 0.5 }]), [], NG)
    expect(kq.khop).toHaveLength(0)
    expect(kq.loai[0].lyDo).toBe('dai_qua')
  })

  it('có CHẠM MÀN trong 200 ms quanh xung → không khớp', () => {
    const mau = chuoi(3000, [{ tu: 2000, den: 2100, xoan: 3.5, z: 0.5 }])
    expect(nhanDangXungBop(mau, [1950], NG).khop).toHaveLength(0)
    expect(nhanDangXungBop(mau, [1950], NG).loai[0].lyDo).toBe('co_cham_man')
    // chạm cách xa thì không ảnh hưởng
    expect(nhanDangXungBop(mau, [1000], NG).khop).toHaveLength(1)
  })

  it('chuỗi xung LIÊN TIẾP (đặt máy xuống bàn, đi lại) → chỉ nhát đầu còn lại, các nhát sau bị loại', () => {
    const kq = nhanDangXungBop(
      chuoi(4000, [
        { tu: 1000, den: 1100, xoan: 3.5, z: 0.4 },
        { tu: 1400, den: 1500, xoan: 3.5, z: 0.4 },
        { tu: 1800, den: 1900, xoan: 3.5, z: 0.4 },
      ]),
      [],
      NG,
    )
    expect(kq.khop).toHaveLength(1)
    expect(kq.loai.filter((l) => l.lyDo === 'khong_dung_mot_minh')).toHaveLength(2)
  })

  it('máy nằm yên → không có xung nào', () => {
    expect(nhanDangXungBop(chuoi(3000, []), [], NG).khop).toHaveLength(0)
  })
})

// ------------------------------------------------ phân loại một lần ra màn
describe('phân loại ra khỏi màn — bốn nhịp', () => {
  it('ra rồi về trong 200 ms → góp phiếu dấu vết chụp, KHÔNG khoá', () => {
    expect(phanLoaiRaMan({ tRa: 0, tVe: 200, tHidden: null, tBayGio: 300 })).toBe('ve_som')
  })

  it('có hidden và ở ngoài 5 giây → rời app, đi luật cũ', () => {
    expect(phanLoaiRaMan({ tRa: 0, tVe: 5000, tHidden: 100, tBayGio: 5000 })).toBe('roi_app')
  })

  it('không hề có hidden, sau 900 ms vẫn ngoài → cửa sổ nổi', () => {
    expect(phanLoaiRaMan({ tRa: 0, tVe: null, tHidden: null, tBayGio: 900 })).toBe('cua_so_noi')
  })

  it('chưa tới 900 ms và chưa có hidden → CHƯA kết luận, không khoá vội', () => {
    expect(phanLoaiRaMan({ tRa: 0, tVe: null, tHidden: null, tBayGio: 500 })).toBe('chua_ket_luan')
  })

  it('cuộc gọi đến (hidden báo trễ 800 ms, ở ngoài lâu) vẫn là rời app', () => {
    expect(phanLoaiRaMan({ tRa: 0, tVe: null, tHidden: 800, tBayGio: 4000 })).toBe('roi_app')
  })
})

// --------------------------------------------------------- chấm điểm kênh
describe('chấm điểm CÁI MÁY, không phải chấm học sinh', () => {
  it('bắt đúng 9/10 và 0 báo nhầm → được khoá một mình', () => {
    expect(xepLoaiKenh({ kenh: 'xung_chuyen_dong', batDung: 9, soLanThu: 10, baoNham: 0 })).toBe('khoa_mot_minh')
  })

  it('chỉ MỘT lần báo nhầm là mất quyền khoá một mình, dù bắt đúng 10/10', () => {
    expect(xepLoaiKenh({ kenh: 'xung_chuyen_dong', batDung: 10, soLanThu: 10, baoNham: 1 })).toBe('gop_phieu')
  })

  it('bắt dưới 3/10 → tắt hẳn, không góp phiếu', () => {
    expect(xepLoaiKenh({ kenh: 'lech_dong_ho', batDung: 2, soLanThu: 10, baoNham: 0 })).toBe('tat_han')
  })

  it('ngưỡng đậu là 9/10 đúng như đặc tả', () => {
    expect(BAT_DUNG_TOI_THIEU).toBe(9)
  })
})

describe('nhật ký cho thầy đọc', () => {
  it('mỗi dòng có mốc mili giây, số hiệu kênh và bối cảnh', () => {
    const t = vanBanNhatKy([{ luc: 1234, kenh: 'xung_chuyen_dong', chiTiet: 'xoắn 2,4 rad/s trong 90 ms', boiCanh: 'visible · không chạm' }], 0)
    expect(t).toBe('+1234 ms · K8 Xung chuyển động · xoắn 2,4 rad/s trong 90 ms · visible · không chạm')
  })
})

describe('luật dữ liệu tầng đỏ', () => {
  it('bộ thu KHÔNG gửi gì lên máy chủ, không lưu đĩa', async () => {
    const ma = (await import('../src/lib/thu-tin-hieu.ts?raw')).default
    expect(ma).not.toContain('fetch(')
    expect(ma).not.toContain('localStorage')
    expect(ma).not.toContain('exam-api')
  })

  it('màn đo cũng không gọi máy chủ — Đợt 0 chỉ đo tại chỗ', async () => {
    const ma = (await import('../src/screens/DoTinHieuScreen.tsx?raw')).default
    expect(ma).not.toContain('exam-api')
    expect(ma).not.toContain('fetch(')
  })

  it('không chữ "gian lận", "quay cóp", "vi phạm" trong thứ máy sinh ra', async () => {
    const files = ['../src/lib/do-dau-vet.ts?raw', '../src/lib/thu-tin-hieu.ts?raw', '../src/screens/DoTinHieuScreen.tsx?raw']
    for (const f of files) {
      const ma = (await import(/* @vite-ignore */ f)).default as string
      expect(ma, f).not.toMatch(/gian lận|quay cóp/i)
    }
  })
})
