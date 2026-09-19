// Bộ chuyển nhiệm vụ cho màn "Bảng nhiệm vụ" (prompt-giao-dien-nhiem-vu-hoc-sinh-phu-huynh.md):
// hai nguồn ra CÙNG cấu trúc, 4 bậc đúng 4 vai trò màu, cổng đúng, trống thì không bịa.
import { describe, expect, it } from 'vitest'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import {
  docThanThu,
  dongGoiBanNho,
  dungBangNhiemVu,
  laKeHoachNgayHopLe,
  phucHoiBanNho,
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

// Hình dạng THẬT của POST /hs/ke-hoach-ngay (docs/ke-hoach-ngay-api-1909.md; server/src/ke-hoach-ngay.ts).
const dsBtvnMay = [
  { maBtvn: 'BT-ANCOL', maCa: 'CA-ANCOL', tenBtvn: 'BTVN Ancol', soCau: 12 },
  { maBtvn: 'BT-ESTE', maCa: 'CA-ESTE', tenBtvn: 'BTVN Este', soCau: 12 },
]
const momDangLam = { id: 'M9', tieuDe: 'Bài của Mẹ giao', soCau: 8, trangThai: 'dang_lam' }
const momMoi = { id: 'M1', tieuDe: 'Bài Mẹ mới nhận', soCau: 6, trangThai: 'chua_lam' }
const phu = { dsBtvn: dsBtvnMay, dsMomGiao: [momDangLam] }
const v = (o: object) => ({ thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
const keHoachMayChu: KeHoachNgayMayChu = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    v({ id: 'mom:M9', loai: 'mom', soCau: 8, hanCung: gio(0.7), hanMem: gio(0.7), batBuoc: true, khan: true, nhan: 'khan_cap', ghiChu: 'Bài Mom đã bắt đầu — hết giờ sau 120 phút.', chiTiet: { id: 'M9' } }),
    v({ id: 'btvn_lo:BT-ANCOL:1', loai: 'btvn_lo', soCau: 6, hanCung: gio(1.5), hanMem: gio(1), batBuoc: true, khan: true, nhan: 'khan_cap', cong: 'mom:M9', ghiChu: 'Lô 2/4', chiTiet: { ma: 'BT-ANCOL', chiSo: 1, tongLo: 4, treNhip: false } }),
    v({ id: 'btvn_lo:BT-ESTE:0', loai: 'btvn_lo', soCau: 6, hanCung: gio(40), hanMem: gio(20), batBuoc: true, cong: 'btvn_lo:BT-ANCOL:1', ghiChu: 'Lô 1/2', chiTiet: { ma: 'BT-ESTE', chiSo: 0, tongLo: 2, treNhip: false } }),
    v({ id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, hien: false, nhan: 'bu', cong: 'btvn_lo:BT-ESTE:0', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } }),
    v({ id: 'than_thu:CARBOHYDRATE.UNG_DUNG', loai: 'than_thu', soCau: 6, hien: false, nhan: 'tuy_chon', cong: 'on_lai:2026-09-19', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'CARBOHYDRATE.UNG_DUNG' } }),
  ],
  canhBao: [
    { loai: 'qua_tai', noiDung: 'Hôm nay dồn 26 câu, vượt mức 12 câu (+14).' },
    { loai: 'chua_do_toc_do', noiDung: 'chưa đo được tốc độ (2/5 mẫu), tạm tính 90 giây/câu' },
  ],
  quaHan: [{ loai: 'btvn', ma: 'BT-CU', hanNop: gio(-30), conLai: 10 }],
  tienBo: { daLamCau: 6, lenBac: 2, tutBac: 0, dat: true, toiThieuCau: 6, conThieu: 0 },
  chuoiDat: 5,
  lanNghi: false,
  capNhatLuc: gio(-0.2),
}

describe('hai nguồn ra cùng một cấu trúc', () => {
  const a = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam] }))
  const b = tuKeHoachNgay(keHoachMayChu, NOW, phu)

  it('cùng bộ khoá ở gốc, ở từng bậc và ở từng thẻ', () => {
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort())
    for (const d of [a, b]) {
      expect(d.cacBac.map((x) => x.bac)).toEqual([...THU_TU_BAC])
      expect(Object.keys(d.tienDo).sort()).toEqual(['daLam', 'ghiChu', 'mucTieu', 'phanTram'])
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
    for (const d of [tuKeHoachNgay(keHoachMayChu, NOW, phu), tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam], tongCauSai: 12 }))]) {
      for (const nhom of d.cacBac) {
        expect(nhom.vaiTroMau).toBe(mong[nhom.bac])
        for (const v of nhom.viec) expect(v.vaiTroMau).toBe(mong[v.bac])
      }
      if (d.lamNgay) expect(d.lamNgay.vaiTroMau).toBe(mong[d.lamNgay.bac])
    }
  })

  it('nguồn máy chủ: khan/khan_cap → KHẨN, batBuoc → BẮT BUỘC, nhan "bu" → NÊN LÀM, "tuy_chon" → TUỲ CHỌN', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW, phu)
    const bac = Object.fromEntries(tatCaViec(d).map((x) => [x.id, x.bac]))
    expect(bac).toEqual({
      'mom:M9': 'khan',
      'btvn_lo:BT-ANCOL:1': 'khan',
      'btvn_lo:BT-ESTE:0': 'bat_buoc',
      'on_lai:2026-09-19': 'nen_lam',
      'than_thu:CARBOHYDRATE.UNG_DUNG': 'tuy_chon',
    })
  })

  it('nhan khan_cap một mình (không cờ khan) vẫn là KHẨN; không nhãn nào cả thì NÊN LÀM, không giả khẩn/bắt buộc', () => {
    const kh: KeHoachNgayMayChu = { ...keHoachMayChu, viec: [v({ id: 'a', loai: 'on_lai', soCau: 2, nhan: 'khan_cap', ghiChu: 'A' }), v({ id: 'b', loai: 'on_lai', soCau: 2, ghiChu: 'B' })] as any }
    const bac = Object.fromEntries(tatCaViec(tuKeHoachNgay(kh, NOW)).map((x) => [x.id, x.bac]))
    expect(bac).toEqual({ a: 'khan', b: 'nen_lam' })
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

  it('không xếp lại: thứ tự việc = thứ tự viec[] của máy chủ; Làm ngay = việc đầu đang hiện', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW, phu)
    expect(d.lamNgay?.id).toBe('mom:M9')
    expect(tatCaViec(d).map((x) => x.id)).toEqual(keHoachMayChu.viec.map((x) => x.id))
    // Đảo thứ tự đầu vào ⇒ đầu ra đảo theo (adapter không tự xếp).
    const dao = { ...keHoachMayChu, viec: [...keHoachMayChu.viec].reverse() }
    expect(tatCaViec(tuKeHoachNgay(dao, NOW, phu)).map((x) => x.id).sort()).toEqual(keHoachMayChu.viec.map((x) => x.id).sort())
    expect(tuKeHoachNgay(dao, NOW, phu).lamNgay?.id).toBe('btvn_lo:BT-ESTE:0')
  })

  it('nguồn trợ lý: thứ tự trong từng bậc là thứ tự của dữ liệu', () => {
    const kh = troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam] })
    const thuTuNguon = kh.top3.map((t) => t.id)
    const ra = tatCaViec(tuKeHoachTroLy(kh))
    for (const bac of THU_TU_BAC) {
      const trongBac = ra.filter((x) => x.bac === bac).map((x) => x.id)
      expect(trongBac).toEqual(thuTuNguon.filter((id) => trongBac.includes(id)))
    }
    expect(ra.map((x) => x.id).sort()).toEqual([...thuTuNguon].sort())
  })
})

describe('cổng', () => {
  it('nguồn máy chủ: hien:false ⇒ bị cổng (mờ) với nhãn "Mở sau khi xong: <tên việc có id = cong>"; hien:true ⇒ mở, kể cả khan', () => {
    const d = tuKeHoachNgay(keHoachMayChu, NOW, phu)
    const theo = Object.fromEntries(tatCaViec(d).map((x) => [x.id, x]))
    expect(theo['mom:M9'].biCong).toBe(false)
    expect(theo['btvn_lo:BT-ANCOL:1'].biCong).toBe(false)
    expect(theo['on_lai:2026-09-19'].biCong).toBe(true)
    expect(theo['on_lai:2026-09-19'].moSauKhiXong).toBe('BTVN Este: Lô 1/2')
    expect(theo['than_thu:CARBOHYDRATE.UNG_DUNG'].biCong).toBe(true)
    expect(theo['than_thu:CARBOHYDRATE.UNG_DUNG'].moSauKhiXong).toBe('Ôn 3 câu đã tới hạn nhắc lại')
    // Chỉ việc bị cổng mới có nhãn.
    expect(theo['mom:M9'].moSauKhiXong).toBeUndefined()
  })

  it('adapter KHÔNG tự tính lại cổng: tin máy chủ (mọi việc hien:true thì không cái nào bị cổng)', () => {
    const mo = { ...keHoachMayChu, viec: keHoachMayChu.viec.map((x) => ({ ...x, hien: true })) }
    expect(tatCaViec(tuKeHoachNgay(mo, NOW, phu)).every((x) => !x.biCong)).toBe(true)
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
    for (const d of [tuKeHoachNgay(keHoachMayChu, NOW, phu), tuKeHoachTroLy(troLy({ dsBtvn: [btHomNay], tongCauSai: 9 }))]) {
      expect(d.lamNgay).not.toBeNull()
      expect(d.lamNgay!.biCong).toBe(false)
    }
  })
})

describe('nhánh máy chủ: tên, payload khi bấm, quá hạn, cảnh báo', () => {
  const d = tuKeHoachNgay(keHoachMayChu, NOW, phu)
  const theo = Object.fromEntries(tatCaViec(d).map((x) => [x.id, x]))

  it('btvn_lo: tên "<BTVN>: Lô i/n", vạch lô, payload {bt} đúng bài (giữ nguyên đối tượng thô)', () => {
    const lo = theo['btvn_lo:BT-ANCOL:1']
    expect(lo.tieuDe).toBe('BTVN Ancol: Lô 2/4')
    expect(lo.tienDoLo).toEqual({ hienTai: 2, tong: 4 })
    expect(lo.hanhDong).toEqual({ loai: 'mo_btvn', payload: { bt: dsBtvnMay[0] }, nhanNut: 'Làm Lô 2' })
    expect(theo['btvn_lo:BT-ESTE:0'].hanhDong.payload).toEqual({ bt: dsBtvnMay[1] })
  })

  it('btvn_lo mà màn chưa có bài thô: vẫn hiện, không payload (màn cổng rơi về mở danh sách BTVN), không bịa tên', () => {
    const x = tatCaViec(tuKeHoachNgay(keHoachMayChu, NOW)).find((t) => t.id === 'btvn_lo:BT-ANCOL:1')!
    expect(x.tieuDe).toBe('BTVN: Lô 2/4')
    expect(x.hanhDong.payload).toBeUndefined()
  })

  it('mom: tên từ bài thô, payload {id, bai}; on_lai/than_thu: không lộ mã dạng/qid ra chữ', () => {
    expect(theo['mom:M9'].tieuDe).toBe('Bài của Mẹ giao')
    expect(theo['mom:M9'].hanhDong).toMatchObject({ loai: 'mo_mom', payload: { id: 'M9', bai: momDangLam } })
    expect(theo['on_lai:2026-09-19'].tieuDe).toBe('Ôn 3 câu đã tới hạn nhắc lại')
    // Chữ HIỂN THỊ không lộ mã dạng thô (id là khoá máy, không hiển thị).
    const chuHienThi = tatCaViec(d).map((x) => `${x.tieuDe} ${x.moTa} ${x.hanhDong.nhanNut}`).join(' | ')
    expect(chuHienThi).not.toMatch(/CARBOHYDRATE|UNG_DUNG/)
    expect(theo['than_thu:CARBOHYDRATE.UNG_DUNG'].tieuDe).toBe('Thần thú: luyện dạng còn yếu')
    expect(theo['than_thu:CARBOHYDRATE.UNG_DUNG'].hanhDong.loai).toBe('mo_than_thu')
  })

  it('trễ nhịp được nói ra; btvn_nop có nút Nộp bài', () => {
    const kh: KeHoachNgayMayChu = { ...keHoachMayChu, viec: [
      v({ id: 'btvn_lo:BT-ANCOL:0', loai: 'btvn_lo', soCau: 6, hanCung: gio(10), batBuoc: true, khan: true, nhan: 'khan_cap', chiTiet: { ma: 'BT-ANCOL', chiSo: 0, tongLo: 2, treNhip: true } }),
      v({ id: 'btvn_nop:BT-ESTE', loai: 'btvn_nop', soCau: 0, hanCung: gio(10), batBuoc: true, khan: true, nhan: 'khan_cap', chiTiet: { ma: 'BT-ESTE' } }),
    ] as any }
    const ra = tatCaViec(tuKeHoachNgay(kh, NOW, phu))
    expect(ra[0].moTa).toContain('đã trễ nhịp — làm trước')
    expect(ra[1].tieuDe).toBe('BTVN Este: nộp bài')
    expect(ra[1].hanhDong).toMatchObject({ loai: 'mo_btvn', nhanNut: 'Nộp bài', payload: { bt: dsBtvnMay[1] } })
  })

  it('quaHan liệt kê RIÊNG, không thành nhiệm vụ: BTVN chỉ đọc, bài Mẹ hết giờ mở được để nộp', () => {
    expect(d.quaHan.length).toBe(1)
    expect(d.quaHan[0]).toMatchObject({ loai: 'btvn', chu: 'Đã quá hạn — cần Thầy gia hạn' })
    expect(d.quaHan[0].hanhDong).toBeUndefined()
    expect(tatCaViec(d).some((x) => x.id.includes('BT-CU'))).toBe(false)
    const kh = { ...keHoachMayChu, quaHan: [{ loai: 'mom' as const, ma: 'M9', hanNop: gio(-1), conLai: 8 }] }
    const q = tuKeHoachNgay(kh, NOW, phu).quaHan[0]
    expect(q.hanhDong).toMatchObject({ loai: 'mo_mom', payload: { id: 'M9', bai: momDangLam } })
  })

  it('canhBao: in nguyên văn câu của máy chủ, trừ chua_do_toc_do (đã ở dòng tốc độ)', () => {
    expect(d.canhBao).toEqual([{ loai: 'qua_tai', noiDung: 'Hôm nay dồn 26 câu, vượt mức 12 câu (+14).' }])
  })

  it('tiến bộ nói "đã làm N câu, M câu lên bậc", không "nắm chắc"', () => {
    expect(d.tienDo).toMatchObject({ daLam: 6, mucTieu: 12, phanTram: 50 })
    expect(d.tienDo.ghiChu).toBe('Đã làm 6 câu, 2 câu lên bậc ôn · đã đủ số câu tối thiểu hôm nay')
    const thieu = tuKeHoachNgay({ ...keHoachMayChu, tienBo: { daLamCau: 2, lenBac: 0, conThieu: 4 } }, NOW, phu)
    expect(thieu.tienDo.ghiChu).toBe('Đã làm 2 câu · còn 4 câu là đạt hôm nay')
    expect(JSON.stringify(d)).not.toMatch(/nắm chắc/i)
  })

  it('mất mạng mà còn bản cuối: hiện "Kế hoạch lúc <giờ VN>"; bản mới thì không có dòng này', () => {
    const cuDan = tuKeHoachNgay(keHoachMayChu, NOW, phu, true)
    const gio2 = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(keHoachMayChu.capNhatLuc!))
    expect(cuDan.ghiChuCu).toBe(`Kế hoạch lúc ${gio2} — chưa cập nhật được, đang hiện bản cuối.`)
    expect(d.ghiChuCu).toBeUndefined()
    expect(d.capNhatLuc).toBe(keHoachMayChu.capNhatLuc)
  })

  it('ngày nghỉ được báo; chuỗi lấy chuoiDat', () => {
    expect(tuKeHoachNgay({ ...keHoachMayChu, lanNghi: true }, NOW, phu).ngayNghi).toBe(true)
    expect(d.ngayNghi).toBe(false)
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

describe('chỉ còn việc tuỳ chọn ⇒ trạng thái trống (nút thần thú nằm ở thẻ trống)', () => {
  it('nhánh máy chủ', () => {
    const kh = { ...keHoachMayChu, viec: [v({ id: 'than_thu:X', loai: 'than_thu', soCau: 6, nhan: 'tuy_chon', ghiChu: 'Luyện dạng còn yếu với thần thú' })] as any }
    const d = tuKeHoachNgay(kh, NOW)
    expect(d.trong).toBe(true)
    expect(d.lamNgay).toBeNull()
  })
})

describe('nhánh máy chủ: bài Mẹ giao mới nhận (chưa bắt đầu) không được biến mất', () => {
  // Máy chủ chỉ đưa bài Mẹ ĐÃ BẮT ĐẦU (hạn 120') vào viec[]; bài mới nhận không có trong đó.
  it('bài chưa bắt đầu được bù ở CUỐI, bậc BẮT BUỘC, mở đúng payload; không chen lên trước', () => {
    const ra = tatCaViec(tuKeHoachNgay(keHoachMayChu, NOW, { dsBtvn: dsBtvnMay, dsMomGiao: [momDangLam, momMoi] }))
    const d = tuKeHoachNgay(keHoachMayChu, NOW, { dsBtvn: dsBtvnMay, dsMomGiao: [momDangLam, momMoi] })
    // Trong nhóm BẮT BUỘC: việc của máy chủ trước, bài bù đứng sau; Làm ngay không đổi.
    expect(d.cacBac.find((b) => b.bac === 'bat_buoc')!.viec.map((x) => x.id)).toEqual(['btvn_lo:BT-ESTE:0', 'mom:M1'])
    expect(d.lamNgay?.id).toBe('mom:M9')
    expect(ra.map((x) => x.id).sort()).toEqual([...keHoachMayChu.viec.map((x) => x.id), 'mom:M1'].sort())
    const moi = ra.find((x) => x.id === 'mom:M1')!
    expect(moi).toMatchObject({ bac: 'bat_buoc', biCong: false, tieuDe: 'Bài Mẹ mới nhận', soCau: 6 })
    expect(moi.hanhDong).toMatchObject({ loai: 'mo_mom', payload: { id: 'M1', bai: momMoi } })
  })

  it('không nhân đôi bài đã có trong kế hoạch, không bù bài đã nộp hay đã hết giờ', () => {
    const xong = { ...momMoi, id: 'M2', trangThai: 'da_nop' }
    const het = { ...momMoi, id: 'M3', trangThai: 'dang_lam' }
    const kh = { ...keHoachMayChu, quaHan: [{ loai: 'mom' as const, ma: 'M3', hanNop: gio(-1), conLai: 6 }] }
    const ra = tatCaViec(tuKeHoachNgay(kh, NOW, { dsBtvn: dsBtvnMay, dsMomGiao: [momDangLam, xong, het] })).map((x) => x.id)
    expect(ra.filter((i) => i === 'mom:M9').length).toBe(1)
    expect(ra).not.toContain('mom:M2')
    expect(ra).not.toContain('mom:M3')
  })

  it('viec rỗng nhưng có bài Mẹ mới nhận ⇒ KHÔNG trống, "Làm ngay" là bài Mẹ', () => {
    const d = tuKeHoachNgay({ ...keHoachMayChu, viec: [] }, NOW, { dsBtvn: [], dsMomGiao: [momMoi] })
    expect(d.trong).toBe(false)
    expect(d.lamNgay?.id).toBe('mom:M1')
  })
})

describe('kế hoạch máy chủ hợp lệ hay không, và rơi về trợ lý', () => {
  it('chỉ nhận JSON đủ nganSach + tienBo + viec[]; HTML, {ok:true,items:[]}, ok:false, null đều bị từ chối', () => {
    expect(laKeHoachNgayHopLe(keHoachMayChu)).toBe(true)
    for (const xau of [null, undefined, {}, { ok: true, items: [] }, { ok: false, viec: [] }, { viec: [], nganSach: { mucTieuCau: 8 } }, { ...keHoachMayChu, tienBo: undefined }, { ...keHoachMayChu, nganSach: undefined }, { ...keHoachMayChu, viec: [null] }, { ...keHoachMayChu, viec: [{ loai: 'mom' }] }, 'html', 5]) {
      expect(laKeHoachNgayHopLe(xau)).toBe(false)
    }
  })

  it('cửa vào duy nhất: hợp lệ → nguồn máy chủ; hỏng/thiếu → nguồn trợ lý (không ném lỗi)', () => {
    const kh = troLy({ dsMomGiao: [momChuaLam] })
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: keHoachMayChu, now: NOW }).nguon).toBe('ke_hoach_ngay')
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: { ok: true, items: [] } as any, now: NOW }).nguon).toBe('tro_ly')
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: null, now: NOW }).nguon).toBe('tro_ly')
  })

  it('cờ cu đi qua cửa vào duy nhất', () => {
    const kh = troLy()
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: keHoachMayChu, now: NOW, cu: true }).ghiChuCu).toMatch(/^Kế hoạch lúc /)
    expect(dungBangNhiemVu({ keHoachTroLy: kh, keHoachNgay: keHoachMayChu, now: NOW }).ghiChuCu).toBeUndefined()
  })
})

describe('nói thật', () => {
  it('nguồn rỗng ⇒ trống, không thẻ nào, không bịa việc', () => {
    const rong: KeHoachNgayMayChu = { ...keHoachMayChu, viec: [], canhBao: [{ loai: 'thieu_nguon_bu', noiDung: 'Chưa đủ dữ liệu để tự phân thêm việc ôn.' }], quaHan: [], tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 } }
    for (const d of [tuKeHoachTroLy(troLy()), tuKeHoachNgay(rong, NOW)]) {
      expect(d.trong).toBe(true)
      expect(d.lamNgay).toBeNull()
      expect(d.cacBac.every((b) => b.viec.length === 0)).toBe(true)
    }
  })

  it('chưa đo được tốc độ thì nói "chưa đo"; đo được mới ghi số', () => {
    expect(tuKeHoachTroLy(troLy()).tocDo).toEqual({ chu: 'tốc độ: chưa đo' })
    const macDinh: KeHoachNgayMayChu = { ...keHoachMayChu, nganSach: { mucTieuCau: 8, vanTocGiay: 90, vanTocNguon: 'mac_dinh', ghiChuVanToc: 'chưa đo được tốc độ (2/5 mẫu), tạm tính 90 giây/câu' } }
    // In NGUYÊN VĂN câu của máy chủ, không tự viết lại.
    expect(tuKeHoachNgay(macDinh, NOW).tocDo).toEqual({ chu: 'chưa đo được tốc độ (2/5 mẫu), tạm tính 90 giây/câu' })
    expect(tuKeHoachNgay(keHoachMayChu, NOW, phu).tocDo).toEqual({ giayMoiCau: 78, chu: 'tốc độ 78 s/câu · đo 30 ngày' })
  })

  it('chuỗi ngày: trợ lý đếm ngày HỌC, máy chủ đếm ngày ĐẠT — adapter ghi đúng tên', () => {
    expect(tuKeHoachTroLy(troLy()).chuoiNgay.chu).toMatch(/ngày học liên tiếp$/)
    expect(tuKeHoachNgay(keHoachMayChu, NOW, phu).chuoiNgay).toEqual({ soNgay: 5, chu: '5 ngày đạt liên tiếp' })
  })

  it('không có chữ "nắm chắc" ở bất kỳ thẻ nào', () => {
    const d = tuKeHoachTroLy(troLy({ dsBtvn: [btKhan, btHomNay], dsMomGiao: [momChuaLam], tongCauSai: 20 }))
    expect(JSON.stringify(d)).not.toMatch(/nắm chắc/i)
  })
})

describe('bản nhớ (stale-while-revalidate): đóng gói và phục hồi', () => {
  const tuoi = () => tuKeHoachNgay(keHoachMayChu, NOW, phu)
  const jsonDi = (x: unknown) => JSON.parse(JSON.stringify(x))

  it('chỉ nhớ bản dựng TỪ MÁY CHỦ và MỚI: nguồn trợ lý và bản cuối (cu) không được nhớ', () => {
    expect(dongGoiBanNho(tuoi(), NOW)).toMatchObject({ ngay: '2026-09-19', luuLuc: NOW })
    expect(dongGoiBanNho(tuKeHoachTroLy(troLy()), NOW)).toBeNull()
    expect(dongGoiBanNho(tuKeHoachNgay(keHoachMayChu, NOW, phu, true), NOW)).toBeNull()
  })

  it('cùng ngày VN: phục hồi đủ việc, giữ payload {bt}/{id,bai}, gắn "Kế hoạch lúc <giờ VN> · đang cập nhật…"', () => {
    const b = jsonDi(dongGoiBanNho(tuoi(), NOW))
    const d = phucHoiBanNho(b, NOW + 10 * 60_000)!
    expect(d).not.toBeNull()
    expect(d.nguon).toBe('ke_hoach_ngay')
    expect(tatCaViec(d).map((x) => x.id)).toEqual(tatCaViec(tuoi()).map((x) => x.id))
    const lo = tatCaViec(d).find((x) => x.id === 'btvn_lo:BT-ANCOL:1')!
    expect(lo.hanhDong.payload).toEqual({ bt: dsBtvnMay[0] })
    const gio2 = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(keHoachMayChu.capNhatLuc!))
    expect(d.ghiChuCu).toBe(`Kế hoạch lúc ${gio2} · đang cập nhật…`)
  })

  it('thời gian còn lại được TÍNH LẠI theo giờ lúc mở (không dùng số cũ lúc lưu)', () => {
    const b = jsonDi(dongGoiBanNho(tuoi(), NOW))
    const truoc = tatCaViec(tuoi()).find((x) => x.id === 'mom:M9')!.conLaiMs!
    const sau = tatCaViec(phucHoiBanNho(b, NOW + 20 * 60_000)!).find((x) => x.id === 'mom:M9')!
    expect(sau.conLaiMs).toBe(truoc - 20 * 60_000)
    expect(sau.conLaiChu).toBeTruthy()
    // Quá hạn thì nói "Đã quá hạn", không còn số dương.
    const het = tatCaViec(phucHoiBanNho(b, NOW + 3 * 3600_000)!).find((x) => x.id === 'mom:M9')!
    expect(het.conLaiMs!).toBeLessThan(0)
    expect(het.conLaiChu).toBe('Đã quá hạn')
  })

  it('bản nhớ của NGÀY KHÁC (theo ngày VN) không dùng để vẽ việc', () => {
    const b = jsonDi(dongGoiBanNho(tuoi(), NOW))
    expect(phucHoiBanNho(b, NOW + 24 * 3600_000)).toBeNull()
    expect(phucHoiBanNho(b, NOW - 24 * 3600_000)).toBeNull()
    // Sát nửa đêm: 23:59 VN vẫn cùng ngày, 00:01 hôm sau thì không.
    const cuoiNgay = Date.parse('2026-09-19T23:59:00+07:00')
    expect(phucHoiBanNho(b, cuoiNgay)).not.toBeNull()
    expect(phucHoiBanNho(b, Date.parse('2026-09-20T00:01:00+07:00'))).toBeNull()
  })

  it('bản hỏng/thiếu phần/giả đều bị từ chối (không ném lỗi)', () => {
    const tot = jsonDi(dongGoiBanNho(tuoi(), NOW))
    const hong = [
      null, undefined, 'x', 5, {}, { ngay: '2026-09-19' },
      { ...tot, duLieu: null },
      { ...tot, duLieu: { ...tot.duLieu, nguon: 'tro_ly' } },
      { ...tot, duLieu: { ...tot.duLieu, cacBac: [] } },
      { ...tot, duLieu: { ...tot.duLieu, cacBac: tot.duLieu.cacBac.slice(0, 3) } },
      { ...tot, duLieu: { ...tot.duLieu, cacBac: [...tot.duLieu.cacBac].reverse() } },
      { ...tot, duLieu: { ...tot.duLieu, tienDo: null } },
      { ...tot, duLieu: { ...tot.duLieu, quaHan: 'x' } },
      { ...tot, duLieu: { ...tot.duLieu, lamNgay: { id: 1 } } },
      { ...tot, duLieu: { ...tot.duLieu, cacBac: tot.duLieu.cacBac.map((g: any) => ({ ...g, viec: [null] })) } },
    ]
    for (const x of hong) expect(() => phucHoiBanNho(x, NOW)).not.toThrow()
    for (const x of hong) expect(phucHoiBanNho(x, NOW)).toBeNull()
    expect(phucHoiBanNho(tot, NOW)).not.toBeNull()
  })
})

describe('thần thú CỦA EM đọc từ kế hoạch máy chủ (không bao giờ bịa con mặc định)', () => {
  it('docThanThu: có con → co; null → chua_chon; vắng → chua_biet; rác → không đoán', () => {
    expect(docThanThu({ pet: 'nuoc_long', cap: 37, nickname: 'Bông' })).toEqual({ kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' })
    expect(docThanThu({ pet: 'nuoc_long', cap: 0 })).toMatchObject({ kieu: 'co', cap: 1 })
    expect(docThanThu({ pet: 'nuoc_long', cap: '12.9' })).toMatchObject({ cap: 12 })
    expect(docThanThu({ pet: 'nuoc_long', cap: 5, nickname: '   ' })).toEqual({ kieu: 'co', pet: 'nuoc_long', cap: 5, ten: undefined })
    expect(docThanThu(null)).toEqual({ kieu: 'chua_chon' })
    expect(docThanThu({ pet: null, cap: 3 })).toEqual({ kieu: 'chua_chon' })
    expect(docThanThu({ pet: '  ', cap: 3 })).toEqual({ kieu: 'chua_chon' })
    expect(docThanThu({})).toEqual({ kieu: 'chua_chon' })
    expect(docThanThu(undefined)).toEqual({ kieu: 'chua_biet' })
    expect(docThanThu('nuoc_long')).toEqual({ kieu: 'chua_biet' })
    expect(docThanThu(7)).toEqual({ kieu: 'chua_biet' })
  })

  it('nhánh máy chủ lấy thanThu từ phản hồi; nhánh trợ lý (bảng V1, không có id) KHÔNG đoán', () => {
    const co = tuKeHoachNgay({ ...keHoachMayChu, thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' } }, NOW, phu)
    expect(co.thanThu).toEqual({ kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' })
    expect(tuKeHoachNgay({ ...keHoachMayChu, thanThu: null }, NOW, phu).thanThu).toEqual({ kieu: 'chua_chon' })
    expect(tuKeHoachNgay(keHoachMayChu, NOW, phu).thanThu).toEqual({ kieu: 'chua_biet' }) // máy chủ cũ, không có trường
    expect(tuKeHoachTroLy(troLy({ dsMomGiao: [momChuaLam] })).thanThu).toEqual({ kieu: 'chua_biet' })
    // Mọi đường ra đều không có "hoa_long" tự chế.
    for (const d of [co, tuKeHoachNgay(keHoachMayChu, NOW, phu), tuKeHoachTroLy(troLy())]) expect(JSON.stringify(d.thanThu)).not.toContain('hoa_long')
  })

  it('bản nhớ giữ nguyên thần thú (mở lại vẫn đúng con); bản nhớ đời cũ không có trường → chua_biet', () => {
    const tuoi = tuKeHoachNgay({ ...keHoachMayChu, thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' } }, NOW, phu)
    const jsonDi = (x: unknown) => JSON.parse(JSON.stringify(x))
    expect(phucHoiBanNho(jsonDi(dongGoiBanNho(tuoi, NOW)), NOW)!.thanThu).toEqual({ kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' })
    const chuaChon = tuKeHoachNgay({ ...keHoachMayChu, thanThu: null }, NOW, phu)
    expect(phucHoiBanNho(jsonDi(dongGoiBanNho(chuaChon, NOW)), NOW)!.thanThu).toEqual({ kieu: 'chua_chon' })
    const cu = jsonDi(dongGoiBanNho(tuoi, NOW))
    delete cu.duLieu.thanThu
    expect(phucHoiBanNho(cu, NOW)!.thanThu).toEqual({ kieu: 'chua_biet' })
    const hong = jsonDi(dongGoiBanNho(tuoi, NOW))
    hong.duLieu.thanThu = { kieu: 'co', pet: '', cap: 'x' }
    expect(phucHoiBanNho(hong, NOW)!.thanThu).toEqual({ kieu: 'chua_biet' })
  })
})
