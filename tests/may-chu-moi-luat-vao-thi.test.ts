// MÁY CHỦ MỚI — luật cho vào thi phải xử GIỐNG HỆT Apps Script.
//
// Hai máy chủ xử khác nhau cho cùng một em là hỏng kiểu tệ nhất: em vào được ở
// máy này, bị chặn ở máy kia, và thầy không hiểu vì sao. Nên luật tách thành
// hàm thuần và có phép kiểm riêng, chạy không cần D1.
import { describe, expect, it } from 'vitest'
import { khoaLuot, mocHetGio, quyetDinhVaoThi } from '../server/src/luat-vao-thi'
import type { DongCa, DongLuot } from '../server/src/kieu'

const NOW = Date.parse('2026-09-11T08:00:00Z')

function ca(p: Partial<DongCa> = {}): DongCa {
  return {
    ma_ca: '123456', ten_ca: '2009 - Lớp 1 - L1', trang_thai: 'mo',
    bat_dau: '2026-09-11T07:00:00Z', het_han_vao: '2026-09-11T09:00:00Z',
    thoi_gian_phut: 45, loai: 'thi', han_nop: '', cong_bo: 'khong',
    nguong_lan: 3, nguong_giay: 10, bank_r2: 'de/123456.json',
    so_cau_json: null, bo_theo_em_json: null, cap_nhat_luc: '', ...p,
  }
}
function luot(p: Partial<DongLuot> = {}): DongLuot {
  return {
    khoa: '123456|12001|1', ma_ca: '123456', sbd: '12001', lan_thu: 1,
    ma_de: null, id_thiet_bi: 'may-A', vao_luc: '2026-09-11T07:30:00Z',
    het_gio_luc: '2026-09-11T08:15:00Z', nop_luc: null, trang_thai: 'dang_lam',
    dap_an_json: null, giay_cau_json: null, integrity_json: null,
    so_lan_roi_man: 0, tong_giay_roi_man: 0, ghi_chu: null,
    cap_nhat_luc: '', da_day_sheet: 0, ...p,
  }
}

describe('cho vào hay chặn', () => {
  it('em mới, ca đang mở, còn hạn ⇒ vào mới, lần 1', () => {
    const r = quyetDinhVaoThi(ca(), null, 'may-A', NOW)
    expect(r).toMatchObject({ ok: true, cach: 'moi', lanThu: 1 })
  })

  it('không có ca ⇒ chặn, KHÔNG vỡ', () => {
    expect(quyetDinhVaoThi(null, null, 'may-A', NOW).lyDo).toBe('khong_co_ca')
  })

  it('ca đã khoá ⇒ chặn', () => {
    expect(quyetDinhVaoThi(ca({ trang_thai: 'dong' }), null, 'may-A', NOW).lyDo).toBe('da_dong')
  })

  it('ca đã xoá ⇒ chặn, khác hẳn lý do đã khoá', () => {
    expect(quyetDinhVaoThi(ca({ trang_thai: 'da_xoa' }), null, 'may-A', NOW).lyDo).toBe('da_xoa')
  })

  it('chưa tới giờ bắt đầu ⇒ chặn', () => {
    expect(quyetDinhVaoThi(ca({ bat_dau: '2026-09-11T09:00:00Z' }), null, 'may-A', NOW).lyDo).toBe('chua_mo')
  })

  it('quá hạn vào phòng, em CHƯA vào bao giờ ⇒ chặn', () => {
    expect(quyetDinhVaoThi(ca({ het_han_vao: '2026-09-11T07:30:00Z' }), null, 'may-A', NOW).lyDo).toBe('het_han_vao')
  })

  it('MẤT MẠNG RỒI QUAY LẠI SAU HẠN VÀO ⇒ vẫn khôi phục được bài đang làm dở', () => {
    // Chỗ này sai là em làm 30 phút rồi mất trắng chỉ vì rớt sóng đúng lúc.
    const r = quyetDinhVaoThi(ca({ het_han_vao: '2026-09-11T07:30:00Z' }), luot(), 'may-A', NOW)
    expect(r).toMatchObject({ ok: true, cach: 'khoi_phuc', lanThu: 1 })
  })

  it('đang làm ở MÁY KHÁC ⇒ chặn, không cho hai máy cùng một lượt', () => {
    const r = quyetDinhVaoThi(ca(), luot({ id_thiet_bi: 'may-B' }), 'may-A', NOW)
    expect(r.lyDo).toBe('dang_lam_may_khac')
  })

  it('đã nộp ⇒ chặn, kèm lần thứ mấy', () => {
    const r = quyetDinhVaoThi(ca(), luot({ trang_thai: 'da_nop', lan_thu: 2 }), 'may-A', NOW)
    expect(r).toMatchObject({ lyDo: 'da_nop', lanThu: 2 })
  })

  it('bài bị khoá vì rời màn ⇒ cũng chặn như đã nộp', () => {
    expect(quyetDinhVaoThi(ca(), luot({ trang_thai: 'khoa' }), 'may-A', NOW).lyDo).toBe('da_nop')
  })
})

describe('mốc hết giờ', () => {
  it('ca thi: vào lúc nào cộng đúng số phút của ca', () => {
    expect(mocHetGio(ca({ thoi_gian_phut: 45 }), NOW)).toBe('2026-09-11T08:45:00.000Z')
  })
  it('thiếu số phút ⇒ về 45, không ra NaN', () => {
    expect(mocHetGio(ca({ thoi_gian_phut: null }), NOW)).toBe('2026-09-11T08:45:00.000Z')
  })
  it('BÀI TẬP VỀ NHÀ đi theo hạn nộp, KHÔNG đếm ngược', () => {
    const b = ca({ loai: 'baitap', han_nop: '2026-09-20T17:00:00Z' })
    expect(mocHetGio(b, NOW)).toBe('2026-09-20T17:00:00Z')
  })
  it('bài tập không có hạn ⇒ rỗng, máy em không hiện đồng hồ', () => {
    expect(mocHetGio(ca({ loai: 'baitap', han_nop: '' }), NOW)).toBe('')
  })
})

describe('khoá lượt', () => {
  it('ghép đúng ba phần, đây là khoá chống nộp trùng', () => {
    expect(khoaLuot('123456', '12001', 2)).toBe('123456|12001|2')
  })
})
