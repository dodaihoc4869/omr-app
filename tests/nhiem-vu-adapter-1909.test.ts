// Bộ chuyển nhiệm vụ cho màn "Bảng nhiệm vụ" (prompt-giao-dien-nhiem-vu-hoc-sinh-phu-huynh.md):
// hai nguồn ra CÙNG cấu trúc, 4 bậc đúng 4 vai trò màu, cổng đúng, trống thì không bịa.
import { describe, expect, it } from 'vitest'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import {
  dungBangNhiemVu,
  THU_TU_BAC,
  tuKeHoachNgay,
  tuKeHoachTroLy,
  type DuLieuBangNhiemVu,
  type KeHoachNgayMayChu,
} from '../src/lib/nhiem-vu-adapter'

const NOW = Date.parse('2026-09-19T19:00:00+07:00')
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()

// Tài khoản nghiệm thu NT1: 1 BTVN khẩn + 1 lô hôm nay + 1 bài mẹ giao.
const btKhan = { maBtvn: 'B-KHAN', tenBtvn: 'BTVN Ancol', soCau: 12, giaoLuc: gio(-30), hanNop: gio(1.5) }
const btHomNay = { maBtvn: 'B-HOMNAY', tenBtvn: 'BTVN Este', soCau: 12, giaoLuc: gio(-30), hanNop: gio(40) }
const momChuaLam = { id: 'M1', tieuDe: 'Bài của Mẹ giao', soCau: 8, trangThai: 'chua_lam' }

function troLy(over: Partial<Parameters<typeof tongHopKeHoachTroLy>[0]> = {}) {
  return tongHopKeHoachTroLy({
    sbd: 'test',
    hoTen: 'Minh',
    dsBtvn: [],
    dsMomGiao: [],
    dsLichSu: [],
    tongCauSai: 0,
    now: NOW,
    ...over,
  })
}

function tatCaViec(d: DuLieuBangNhiemVu) {
  return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)]
}

const keHoachMayChu: KeHoachNgayMayChu = {
  viec: [
    { id: 'lo1', loai: 'btvn_lo', tieuDe: 'BTVN Ancol · Lô 2/4', soCau: 6, hanCung: gio(2), batBuoc: true, khan: false, cong: null, trangThai: 'chua_lam' },
    { id: 'mom1', loai: 'mom', tieuDe: 'Bài của Mẹ giao', soCau: 8, hanCung: gio(0.7), batBuoc: true, khan: true, cong: 'lo1', trangThai: 'dang_lam' },
    { id: 'on1', loai: 'on_toi_han', soCau: 3, batBuoc: true, khan: false, cong: 'mom1', trangThai: 'chua_lam' },
    { id: 'thi1', loai: 'on_thi', soCau: 4, batBuoc: false, nhan: 'bu', cong: 'on1', trangThai: 'chua_lam' },
    { id: 'tt1', loai: 'thu_thach', soCau: 2, batBuoc: false, nhan: 'tuy_chon', cong: 'thi1', trangThai: 'chua_lam' },
  ],
  nganSach: { mucTieuCau: 12, vanToc: 78 },
  soCauDaLam: 6,
  chuoiDat: 5,
}

describe('hai nguồn ra cùng một cấu trúc', () => {
  const a = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam] }))
  const b = tuKeHoachNgay(keHoachMayChu, NOW)

  it('cùng bộ khoá ở gốc, ở từng bậc và ở từng thẻ', () => {
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort())
    for (const d of [a, b]) {
      expect(d.cacBac.map((x) => x.bac)).toEqual([...THU_TU_BAC])
      expect(Object.keys(d.tienDo).sort()).toEqual(['daLam', 'mucTieu', 'phanTram'])
      for (const v of tatCaViec(d)) {
        expect(v.id).toBeTruthy()
        expect(v.tieuDe).toBeTruthy()
        expect(typeof v.biCong).toBe('boolean')
        expect(v.hanhDong.loai).toMatch(/^mo_/)
        expect(v.hanhDong.nhanNut).toBeTruthy()
      }
    }
  })

  it('cửa vào duy nhất chọn kế hoạch máy chủ khi có, không có thì trợ lý', () => {
    const kh = troLy({ dsMomGiao: [momChuaLam] })
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: null, now: NOW }).nguon).toBe('tro_ly')
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: keHoachMayChu, now: NOW }).nguon).toBe('ke_hoach_ngay')
  })
})

describe('bốn bậc đúng bốn vai trò màu', () => {
  it('mỗi thẻ mang vai trò màu của bậc mình, không lẫn', () => {
    const mong = { khan: 'error', bat_buoc: 'primary', nen_lam: 'secondary', tuy_chon: 'tertiary' } as const
    for (const d of [tuKeHoachNgay(keHoachMayChu, NOW), tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam], tongCauSai: 12 }))]) {
      for (const nhom of d.cacBac) {
        expect(nhom.vaiTroMau).toBe(mong[nhom.bac])
        for (const v of nhom.viec) expect(v.vaiTroMau).toBe(mong[v.bac])
      }
      if (d.lamNgay) expect(d.lamNgay.vaiTroMau).toBe(mong[d.lamNgay.bac])
    }
  })

  it('nguồn máy chủ: khan → KHẨN, batBuoc → BẮT BUỘC, bù → NÊN LÀM, tuỳ chọn → TUỲ CHỌN', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW)
    const bac = Object.fromEntries(tatCaViec(d).map((v) => [v.id, v.bac]))
    expect(bac).toEqual({ lo1: 'bat_buoc', mom1: 'khan', on1: 'bat_buoc', thi1: 'nen_lam', tt1: 'tuy_chon' })
  })

  it('nguồn trợ lý (NT1): "Làm ngay" là BTVN khẩn, payload giữ nguyên {bt}', () => {
    const d = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam] }))
    expect(d.lamNgay?.bac).toBe('khan')
    expect(d.lamNgay?.hanhDong.loai).toBe('mo_btvn')
    expect(d.lamNgay?.hanhDong.payload).toEqual({ bt: btKhan })
    expect(d.lamNgay?.tienDoLo?.hienTai).toBe(1)
    // "Làm ngay" không lặp lại trong danh sách.
    expect(d.cacBac.flatMap((b) => b.viec).some((v) => v.id === d.lamNgay!.id)).toBe(false)
  })

  it('không xếp lại: thứ tự trong từng bậc là thứ tự của dữ liệu', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW)
    // `lo1` là việc mở đầu tiên ⇒ Làm ngay; `on1` còn lại trong bậc bắt buộc.
    expect(d.lamNgay?.id).toBe('lo1')
    expect(d.cacBac.find((b) => b.bac === 'bat_buoc')!.viec.map((v) => v.id)).toEqual(['on1'])
    const kh = troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam] })
    const thuTuNguon = kh.top3.map((t) => t.id)
    const thuTuRa = tatCaViec(tuKeHoachTroLy(kh)).map((v) => v.id)
    for (const bac of THU_TU_BAC) {
      const trongBac = tatCaViec(tuKeHoachTroLy(kh)).filter((v) => v.bac === bac).map((v) => v.id)
      expect(trongBac).toEqual(thuTuNguon.filter((id) => trongBac.includes(id)))
    }
    expect(thuTuRa.sort()).toEqual([...thuTuNguon].sort())
  })
})

describe('cổng', () => {
  it('nguồn máy chủ: việc sau một việc bắt buộc chưa xong thì bị cổng, trừ việc khẩn', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW)
    const theo = Object.fromEntries(tatCaViec(d).map((v) => [v.id, v]))
    expect(theo.lo1.biCong).toBe(false)
    expect(theo.mom1.biCong).toBe(false) // khẩn vượt cổng
    expect(theo.on1.biCong).toBe(true)
    expect(theo.tt1.biCong).toBe(true)
    expect(theo.tt1.moSauKhiXong).toBe('BTVN Ancol · Lô 2/4')
  })

  it('nguồn máy chủ: việc bắt buộc đã xong thì mở cổng cho việc sau và không còn hiện', () => {
    const xong: KeHoachNgayMayChu = {
      ...keHoachMayChu,
      viec: keHoachMayChu.viec.map((v) => (v.batBuoc ? { ...v, trangThai: 'xong' } : v)),
    }
    const d = tuKeHoachNgay(xong, NOW)
    expect(tatCaViec(d).map((v) => v.id)).toEqual(['thi1', 'tt1'])
    expect(tatCaViec(d).every((v) => !v.biCong)).toBe(true)
    expect(d.lamNgay?.id).toBe('thi1')
  })

  it('nguồn trợ lý: thử thách tự chọn bị cổng khi còn việc khẩn/bắt buộc, có nhãn tên việc chặn', () => {
    const d = tuKeHoachTroLy(troLy({ dsMomGiao: [momChuaLam] }))
    const tuyChon = d.cacBac.find((b) => b.bac === 'tuy_chon')!.viec
    expect(tuyChon.length).toBe(1)
    expect(tuyChon[0].biCong).toBe(true)
    expect(tuyChon[0].moSauKhiXong).toBe('Bài của Mẹ giao')
    expect(d.lamNgay?.biCong).toBe(false)
  })

  it('"Làm ngay" không bao giờ là việc bị cổng', () => {
    for (const d of [tuKeHoachNgay(keHoachMayChu, NOW), tuKeHoachTroLy(troLy({ dsBtvn: [btHomNay], tongCauSai: 9 }))]) {
      expect(d.lamNgay).not.toBeNull()
      expect(d.lamNgay!.biCong).toBe(false)
    }
  })
})

describe('bài Mẹ giao không bao giờ rơi khỏi trang chủ (top3 cắt mất)', () => {
  // Kịch bản đo được trên bản dựng thật: em có câu sai + 2 BTVN tới mốc + 1 bài Mẹ giao.
  // `tongHopKeHoachTroLy` chỉ giữ 3 việc và "Luyện sửa lỗi" đẩy bài Mẹ ra ngoài.
  const dsBtvn = [btKhan, btHomNay]
  const dsMomGiao = [momChuaLam]
  const kh = () => troLy({ dsBtvn, dsMomGiao, tongCauSai: 12 })

  it('nguồn trợ lý gốc thật sự làm rơi bài Mẹ giao (điều kiện tái hiện)', () => {
    expect(kh().top3.some((t) => t.id === 'mom_M1')).toBe(false)
    expect(kh().radarDeadline.danhSach.some((r) => r.id === 'mom_M1' && r.trangThai !== 'da_xong')).toBe(true)
  })

  it('có dsMomGiao thì bài Mẹ được bổ sung ở CUỐI, bấm ra đúng payload {id, bai}, không chen lên trước', () => {
    const d = tuKeHoachTroLy(kh(), { dsMomGiao, now: NOW })
    const ids = tatCaViec(d).map((v) => v.id)
    expect(ids).toContain('mom_M1')
    expect(ids.slice(0, 3)).toEqual(kh().top3.map((t) => t.id))
    const me = tatCaViec(d).find((v) => v.id === 'mom_M1')!
    expect(me.hanhDong).toMatchObject({ loai: 'mo_mom', nhanNut: 'Làm bài của Mom', payload: { id: 'M1', bai: momChuaLam } })
    expect(me.biCong).toBe(false)
    expect(d.lamNgay?.id).toBe(kh().top3[0].id)
  })

  it('không bổ sung BTVN từ radar (BTVN có luật nhịp lô riêng), không bổ sung bài đã nộp, không lặp', () => {
    const d = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay, { ...btHomNay, maBtvn: 'B-XA', giaoLuc: gio(-1), hanNop: gio(300) }], dsMomGiao: [momChuaLam, { ...momChuaLam, id: 'M2', trangThai: 'da_nop' }], tongCauSai: 12 }), { dsMomGiao: [momChuaLam, { ...momChuaLam, id: 'M2', trangThai: 'da_nop' }], now: NOW })
    const ids = tatCaViec(d).map((v) => v.id)
    expect(ids.filter((i) => i === 'mom_M1').length).toBe(1)
    expect(ids).not.toContain('mom_M2')
    expect(ids.some((i) => i.startsWith('bt_'))).toBe(false)
  })

  it('bài Mẹ quá hạn vẫn hiện (phải mở để nộp phần đã lưu), bậc KHẨN, không bị nhân đôi', () => {
    const cu = { ...momChuaLam, id: 'M3', taoLuc: gio(-5), batDauLuc: gio(-4), trangThai: 'dang_lam' }
    const nguon = troLy({ dsBtvn, dsMomGiao: [cu], tongCauSai: 12 })
    // Quá hạn thì `tongHopKeHoachTroLy` tự đưa vào top3 (đo được): adapter giữ nguyên, không thêm lần nữa.
    expect(nguon.top3.map((t) => t.id)).toContain('mom_M3')
    const d = tuKeHoachTroLy(nguon, { dsMomGiao: [cu], now: NOW })
    const cacThe = tatCaViec(d).filter((v) => v.id === 'mom_M3')
    expect(cacThe.length).toBe(1)
    expect(cacThe[0].bac).toBe('khan')
    expect(cacThe[0].trangThai).toBe('dang_lam')
    expect(cacThe[0].hanhDong.nhanNut).toBe('Mở để hoàn tất nộp bài')
  })

  it('không có dsMomGiao thì hành vi cũ, không bổ sung gì', () => {
    const ids = tatCaViec(tuKeHoachTroLy(kh())).map((v) => v.id)
    expect(ids).toEqual(kh().top3.map((t) => t.id))
  })

  it('cửa vào duy nhất truyền dsMomGiao xuống nguồn trợ lý', () => {
    const d = dungBangNhiemVu({ keHoachTroLy: kh(), now: NOW, dsMomGiao })
    expect(tatCaViec(d).map((v) => v.id)).toContain('mom_M1')
  })
})

describe('nói thật', () => {
  it('nguồn rỗng ⇒ trống, không thẻ nào, không bịa việc', () => {
    for (const d of [tuKeHoachTroLy(troLy()), tuKeHoachNgay({ viec: [] }, NOW)]) {
      expect(d.trong).toBe(true)
      expect(d.lamNgay).toBeNull()
      expect(d.cacBac.every((b) => b.viec.length === 0)).toBe(true)
    }
  })

  it('chưa đo được tốc độ thì nói "chưa đo"; đo được mới ghi số', () => {
    expect(tuKeHoachTroLy(troLy()).tocDo).toEqual({ chu: 'tốc độ: chưa đo' })
    expect(tuKeHoachNgay({ viec: [], nganSach: { vanToc: null, soMauTocDo: 2 } }, NOW).tocDo.chu).toBe('tốc độ: chưa đo (2/5 mẫu)')
    expect(tuKeHoachNgay(keHoachMayChu, NOW).tocDo).toEqual({ giayMoiCau: 78, chu: 'tốc độ 78 s/câu · đo 30 ngày' })
  })

  it('chuỗi ngày: trợ lý đếm ngày HỌC, máy chủ đếm ngày ĐẠT — adapter ghi đúng tên', () => {
    expect(tuKeHoachTroLy(troLy()).chuoiNgay.chu).toMatch(/ngày học liên tiếp$/)
    expect(tuKeHoachNgay(keHoachMayChu, NOW).chuoiNgay).toEqual({ soNgay: 5, chu: '5 ngày đạt liên tiếp' })
  })

  it('không có chữ "nắm chắc" ở bất kỳ thẻ nào', () => {
    const d = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam], tongCauSai: 20 }))
    expect(JSON.stringify(d)).not.toMatch(/nắm chắc/i)
  })
})
