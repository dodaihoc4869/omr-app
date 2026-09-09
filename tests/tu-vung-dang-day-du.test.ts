import { describe, expect, it } from 'vitest'
import { CO_CHE, DS_CHUONG, TEN_CHUONG, VIEC, maTrongTuVung, tenCua } from '../src/lib/tu-vung-dang'

// 09/09/2026 — app báo "143 câu mang mã NGOÀI bảng đóng" trong khi kho chạy
// `gan_dang.py --thu` lại báo "Mã lạ 0". Không bên nào tự sai: bản TS là bản
// CHÉP TAY của `kho-de/cong-cu/tu_vung_dang.py` và đã trôi — thiếu 2 việc,
// 3 chương và 7 cơ chế. Nay bản TS do máy sinh; các phép kiểm dưới đây dựng
// từ ĐÚNG những mã app đã kêu (đếm trên kho 09/09: đúng 143 câu rơi vào 17 mã
// dưới đây và họ hàng của chúng), để lần trôi sau bị bắt ngay tại đây.
const MA_APP_TUNG_KEU = [
  'NGUYEN_TU.THANH_PHAN.XAC_DINH_DIEN_TICH',
  'NGUYEN_TU.CAU_HINH_E.XAC_DINH_DIEN_TICH',
  'LIEN_KET.QUY_TAC_OCTET.NHAN_DANG',
  'LIEN_KET.XEN_PHU_AO.NHAN_DANG',
  'LIEN_KET.NANG_LUONG_LIEN_KET.CHON_PHAT_BIEU',
  'NITROGEN_SULFUR.SULFURIC_ACID.NHAN_DANG',
  'NITROGEN_SULFUR.AMMONIA_AMMONIUM.CHON_PHAT_BIEU',
  'HALOGEN.DON_CHAT_HALOGEN.NHAN_DANG',
  'HALOGEN.UNG_DUNG_DIEU_CHE.TINH_KHOI_LUONG',
  'BANG_TUAN_HOAN.CAU_TRUC_BTH.NHAN_DANG',
  'CAN_BANG.PH_DUNG_DICH.TINH_TI_SO',
  'HUU_CO_DAI_CUONG.TACH_CHAT.CHON_PHAT_BIEU',
  'TOC_DO.DUONG_CONG_DONG_HOC.NHAN_DANG',
  'HYDROCARBON.LIEN_KET_PHAN_TU.DEM_LIEN_KET_PI',
  'HUU_CO_DAI_CUONG.CAU_TAO_HH.NHAN_DANG',
  'HUU_CO_DAI_CUONG.TACH_CHAT.NHAN_DANG',
]

describe('từ vựng mã dạng phải phủ đủ mã kho đang dùng', () => {
  it.each(MA_APP_TUNG_KEU)('nhận mã %s', (ma) => {
    expect(maTrongTuVung(ma)).toBe(true)
  })

  it('ba chương mở sau cùng đều có bảng cơ chế', () => {
    for (const ch of ['BANG_TUAN_HOAN', 'HALOGEN', 'NITROGEN_SULFUR']) {
      expect(Object.keys(CO_CHE[ch] ?? {}).length).toBeGreaterThan(0)
    }
  })

  it('hai việc thêm sau cùng đều có trong VIEC', () => {
    expect(VIEC.XAC_DINH_DIEN_TICH).toBeTruthy()
    expect(VIEC.TINH_TI_SO).toBeTruthy()
  })
})

describe('bảng từ vựng tự nhất quán', () => {
  it('mọi chương trong CO_CHE đều có tên tiếng Việt', () => {
    const thieu = DS_CHUONG.filter((ch) => !TEN_CHUONG[ch])
    expect(thieu).toEqual([])
  })

  it('tên chương không thừa chương lạ', () => {
    const thua = Object.keys(TEN_CHUONG).filter((ch) => !(ch in CO_CHE))
    expect(thua).toEqual([])
  })

  it('tenCua đọc ra tiếng Việt cho mã hợp lệ, trả nguyên mã cho mã lạ', () => {
    expect(tenCua('NGUYEN_TU.THANH_PHAN.XAC_DINH_DIEN_TICH')).toBe('Thành phần nguyên tử — xác định điện tích')
    expect(tenCua('KHONG_CO.KHONG_CO.KHONG_CO')).toBe('KHONG_CO.KHONG_CO.KHONG_CO')
  })
})
