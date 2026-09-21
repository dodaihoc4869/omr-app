// CỬA HÀNG PHỤ KIỆN · B1 — hàm THUẦN của lớp màn (lời chỉ đường D2 với hằng 80 EXP/ngày, trạng thái món, ghép danh mục, đọc lỗi)
// + MÁY CHỦ GIẢ đúng hợp đồng docs/hop-dong-shop-phu-kien-2109.md (khoá lặp không ghi hai lần, thứ tự kiểm của shop-mua, luôn giữ lại 200 EXP, cờ tắt, mất mạng).
import { describe, expect, it } from 'vitest'
import { DANH_MUC_PHU_KIEN } from '../src/lib/phu-kien-danh-muc'
import { ShopApiGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import { LoiShopApi } from '../src/game/than-thu-v2/shop/kieu'
import type { EmCo, MonMayChu, MonShop } from '../src/game/than-thu-v2/shop/kieu'
import {
  DU_MOI_NGAY,
  cauMonKe,
  chiDuongKhoa,
  chiDuongThieuVang,
  chuKhoaCanDai,
  chuKhoaChuaMua,
  chuKhoaNgan,
  chuSoLuongChiTiet,
  chuSoLuongThe,
  chuanDangMac,
  demDangThu,
  docLoi,
  ghepDanhMuc,
  hienThiTrenThu,
  kepSoExp,
  monDangThu,
  ngayAnCua,
  ngayConThieuVang,
  oSapMo,
  sinhKhoa,
  trangThaiMon,
  xepTheoGia,
} from '../src/game/than-thu-v2/shop/logic-shop'

const goc = (ma: string, sua: Partial<MonMayChu> = {}): MonMayChu => ({ ma, gia: 100, daCo: false, dangMac: false, moKhoa: true, thieu: null, suatCon: null, suatTong: null, ...sua })
const mon = (ma: string, sua: Partial<MonMayChu> = {}): MonShop => ghepDanhMuc([goc(ma, sua)])[0]!
const em = (chuoiNgay: number, anThachSang = 0): EmCo => ({ chuoiNgay, anThachSang })
const loi = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as LoiShopApi
  }
  return null
}

describe('lời chỉ đường D2 (chỉ là chữ, hằng 80 EXP dư/ngày, không phải số dư tự tính)', () => {
  it('hằng 80; số ngày = làm tròn lên của (vàng còn thiếu − EXP thừa đổi được) ÷ 80; 0 ⇒ EXP thừa đã đủ', () => {
    expect(DU_MOI_NGAY).toBe(80)
    expect(ngayConThieuVang(2060, 420)).toBe(21) // 1640 / 80 = 20,5 ⇒ 21
    expect(ngayConThieuVang(500, 0)).toBe(7) // 6,25 ⇒ 7
    expect(ngayConThieuVang(260, 420)).toBe(0) // đủ EXP thừa
    expect(ngayConThieuVang(420, 420)).toBe(0) // vừa đủ
    expect(ngayConThieuVang(421, 420)).toBe(1)
    expect(ngayConThieuVang(500, 420)).toBe(1) // đúng 80
    expect(ngayConThieuVang(501, 420)).toBe(2)
    expect(ngayConThieuVang(100, -50)).toBe(2) // doiToiDa âm coi như 0
    expect(ngayConThieuVang(160, 0, 80)).toBe(2)
    expect(ngayConThieuVang(0, 0)).toBe(0)
  })
  it('chiDuongThieuVang: [D1] khi EXP thừa đủ, [D2] "khoảng N ngày" khi chưa', () => {
    expect(chiDuongThieuVang(260, 420)).toBe('Em có đủ EXP thừa. Đổi vàng là mua được.')
    expect(chiDuongThieuVang(2060, 420)).toBe('Học đều khoảng 21 ngày nữa là đủ vàng.')
    expect(chiDuongThieuVang(2060, 420)).toMatch(/khoảng/)
    expect(chiDuongThieuVang(500, 0)).toBe('Học đều khoảng 7 ngày nữa là đủ vàng.')
  })
})

describe('số EXP đổi', () => {
  it('kepSoExp: nguyên, không vượt doiToiDa (do máy chủ tính), không âm, không phải số ⇒ 0', () => {
    expect(kepSoExp(180.9, 420)).toBe(180)
    expect(kepSoExp(999, 420)).toBe(420)
    expect(kepSoExp(-5, 420)).toBe(0)
    expect(kepSoExp(Number.NaN, 420)).toBe(0)
    expect(kepSoExp(50, 0)).toBe(0)
  })
  it('ngayAnCua: 1 ngày ăn = giữ lại 200 EXP', () => {
    expect(ngayAnCua(620, 200)).toBe(3)
    expect(ngayAnCua(440, 200)).toBe(2)
    expect(ngayAnCua(199, 200)).toBe(0)
    expect(ngayAnCua(500, 0)).toBe(0)
  })
})

describe('ghép danh mục + chỗ đeo "Sắp mở"', () => {
  it('ghép tên/bậc/chỗ đeo/Bật mí/điều kiện từ danh mục; mã lạ bị bỏ', () => {
    const r = ghepDanhMuc([goc('KT-08', { gia: 6000 }), goc('XX-99'), goc('HQ-05')])
    expect(r.map((m) => m.ma)).toEqual(['KT-08', 'HQ-05'])
    expect(r[0]).toMatchObject({ ten: 'Khung Vàng 999', bac: 5, oGan: 'khung', canChuoi: 14, canAnThach: null })
    expect(r[0]!.batMi).toContain('Vàng 999')
    expect(r[1]).toMatchObject({ ten: 'Vòng Sáng Neon', bac: 3, oGan: 'hao-quang' })
  })
  it('oSapMo: chỗ không có món nào trong danh sách máy chủ VÀ danh mục nói mở đợt sau', () => {
    const dot1 = ghepDanhMuc(DANH_MUC_PHU_KIEN.filter((x) => x.moBan === 1).map((x) => goc(x.ma)))
    expect(oSapMo('hao-quang', dot1)).toBe(false)
    expect(oSapMo('vet', dot1)).toBe(false)
    expect(oSapMo('khung', dot1)).toBe(false)
    expect(oSapMo('dau', dot1)).toBe(true)
    expect(oSapMo('co-lung', dot1)).toBe(true)
    // đợt 2 mở: máy chủ trả món ⇒ hết "Sắp mở" dù hằng của bản dựng còn cũ
    const dot2 = ghepDanhMuc(DANH_MUC_PHU_KIEN.map((x) => goc(x.ma)))
    expect(oSapMo('dau', dot2)).toBe(false)
    // hoặc hằng đợt mở đã là 2
    expect(oSapMo('dau', dot1, DANH_MUC_PHU_KIEN, 2)).toBe(false)
  })
})

describe('trạng thái một món (bảy trạng thái chuẩn)', () => {
  it('thứ tự: đang mặc → đã có → đã hết → còn khoá → thiếu vàng → đủ vàng', () => {
    expect(trangThaiMon(goc('A', { dangMac: true, daCo: true }), 0).loai).toBe('dang-mac')
    expect(trangThaiMon(goc('A', { daCo: true }), 0).loai).toBe('da-co')
    expect(trangThaiMon(goc('A', { suatCon: 0, suatTong: 30, moKhoa: false }), 9999).loai).toBe('het')
    expect(trangThaiMon(goc('A', { moKhoa: false }), 9999).loai).toBe('khoa')
    expect(trangThaiMon(goc('A', { gia: 600 }), 340)).toEqual({ loai: 'thieu-vang', thieu: 260 })
    expect(trangThaiMon(goc('A', { gia: 600 }), 600).loai).toBe('du-vang')
  })
  it('khoá nói em đang ở đâu: dạng ngắn, dạng dài [S1]+[S2], [S4], lời chỉ đường [D3]/[D4]', () => {
    const kt08 = mon('KT-08', { moKhoa: false, thieu: 'Cần chuỗi 14 ngày' })
    expect(chuKhoaNgan(kt08, em(9))).toBe('Cần chuỗi 14 ngày')
    expect(chuKhoaCanDai(kt08, em(9))).toBe('Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)')
    expect(chuKhoaChuaMua(kt08, em(9))).toBe('Chưa mua được — cần chuỗi 14 ngày (em đang chuỗi 9 ngày)')
    expect(chiDuongKhoa(kt08, em(9))).toBe('Giữ chuỗi thêm 5 ngày nữa là mở.')
    const hq08 = mon('HQ-08', { moKhoa: false, thieu: 'Cần chuỗi 14 ngày + 5 ấn thạch sáng' })
    expect(chuKhoaNgan(hq08, em(9, 3))).toBe('Cần chuỗi 14 ngày + 5 ấn thạch sáng')
    expect(chuKhoaCanDai(hq08, em(9, 3))).toBe('Cần chuỗi 14 ngày (em đang chuỗi 9 ngày) và 5 ấn thạch sáng (em đang có 3 ấn thạch)')
    expect(chiDuongKhoa(hq08, em(9, 3))).toBe('Giữ chuỗi thêm 5 ngày nữa là mở. Kiếm thêm 2 ấn thạch sáng ở Đoàn Hộ Tống là mở.')
    // chuỗi đã đủ, chỉ còn ấn thạch ⇒ chỉ nói ấn thạch
    expect(chuKhoaNgan(hq08, em(20, 3))).toBe('Cần 5 ấn thạch sáng')
    expect(chiDuongKhoa(hq08, em(20, 3))).toBe('Kiếm thêm 2 ấn thạch sáng ở Đoàn Hộ Tống là mở.')
    // không có số điều kiện ⇒ dùng nguyên lời máy chủ
    const la = { ...kt08, canChuoi: null } as MonShop
    expect(chuKhoaNgan(la, em(9))).toBe('Cần chuỗi 14 ngày')
    expect(chuKhoaChuaMua(la, null)).toBe('Chưa mua được — cần chuỗi 14 ngày')
  })
  it('số lượng: chưa ai mua ⇒ "Mùa 1 chỉ có N cái"; còn ít ⇒ "Chỉ còn N cái"; hết ⇒ "Đã hết"; không giới hạn ⇒ rỗng', () => {
    expect(chuSoLuongThe(goc('A', { suatCon: 25, suatTong: 25 }))).toBe('Mùa 1 chỉ có 25 cái')
    expect(chuSoLuongThe(goc('A', { suatCon: 12, suatTong: 30 }))).toBe('Chỉ còn 12 cái')
    expect(chuSoLuongThe(goc('A', { suatCon: 0, suatTong: 30 }))).toBe('Đã hết')
    expect(chuSoLuongThe(goc('A'))).toBe('')
    expect(chuSoLuongChiTiet(goc('A', { suatCon: 12, suatTong: 30 }))).toBe('Chỉ còn 12 cái · mùa 1 có 30 cái')
  })
})

describe('câu chỉ món kế [M2]', () => {
  const ds = ghepDanhMuc([goc('HQ-01', { gia: 20 }), goc('HQ-03', { gia: 150 }), goc('HQ-04', { gia: 220 }), goc('HQ-05', { gia: 600 }), goc('HQ-08', { gia: 9000, moKhoa: false })])
  it('món ĐẮT NHẤT còn đủ vàng (máy chủ trả), bỏ món đã có / còn khoá', () => {
    expect(cauMonKe(ds, 220, 0)).toBe('Em vẫn đủ vàng cho Thảm Tinh Thể Xanh, giá 220 vàng.')
    expect(cauMonKe(ds, 199, 0)).toBe('Em vẫn đủ vàng cho Vòng Lửa Vàng, giá 150 vàng.')
    expect(cauMonKe(ds.map((m) => (m.ma === 'HQ-04' ? { ...m, daCo: true } : m)), 220, 0)).toBe('Em vẫn đủ vàng cho Vòng Lửa Vàng, giá 150 vàng.')
  })
  it('không món nào vừa ⇒ món RẺ NHẤT chưa có + [D2]; EXP thừa đủ ⇒ [D1]; hết món ⇒ rỗng', () => {
    expect(cauMonKe(ds, 10, 0)).toBe('Vòng Sương Mai: Học đều khoảng 1 ngày nữa là đủ vàng.')
    expect(cauMonKe(ds, 10, 500)).toBe('Vòng Sương Mai: Em có đủ EXP thừa. Đổi vàng là mua được.')
    expect(cauMonKe([], 500, 0)).toBe('')
  })
})

describe('đang mặc + đang thử', () => {
  it('chuanDangMac đủ năm khoá; hienThiTrenThu: món đang THỬ đè lên món đang MẶC; đếm + thứ tự chỗ đeo cố định', () => {
    expect(chuanDangMac({ vet: 'VD-04' })).toEqual({ 'hao-quang': null, vet: 'VD-04', khung: null, dau: null, 'co-lung': null })
    expect(chuanDangMac(null)['co-lung']).toBeNull()
    const mac = chuanDangMac({ khung: 'KT-03', vet: 'VD-01' })
    const thu = chuanDangMac({ vet: 'VD-04', 'hao-quang': 'HQ-05' })
    expect(hienThiTrenThu(mac, thu)).toMatchObject({ 'hao-quang': 'HQ-05', vet: 'VD-04', khung: 'KT-03' })
    expect(demDangThu(thu)).toBe(2)
    const ds = ghepDanhMuc(['KT-03', 'VD-04', 'HQ-05'].map((m) => goc(m)))
    expect(monDangThu(ds, thu).map((m) => m.ma)).toEqual(['HQ-05', 'VD-04'])
  })
  it('xepTheoGia: giá tăng dần, cùng giá theo mã, lọc theo chỗ đeo', () => {
    const ds = ghepDanhMuc(['HQ-05', 'HQ-01', 'VD-01', 'HQ-02'].map((m) => goc(m, { gia: DANH_MUC_PHU_KIEN.find((x) => x.ma === m)!.gia })))
    expect(xepTheoGia(ds, 'tat-ca').map((m) => m.ma)).toEqual(['HQ-01', 'VD-01', 'HQ-02', 'HQ-05'])
    expect(xepTheoGia(ds, 'vet').map((m) => m.ma)).toEqual(['VD-01'])
  })
})

describe('đọc lỗi + khoá yêu cầu', () => {
  it('docLoi: lời máy chủ trước; không lời ⇒ lời chung theo mã (mã mới) ⇒ mất mạng ⇒ lỗi không rõ', () => {
    expect(docLoi(new LoiShopApi('thieu_vang', 'Chưa đủ vàng — còn thiếu 260 vàng.'))).toEqual({ ma: 'thieu_vang', loi: 'Chưa đủ vàng — còn thiếu 260 vàng.' })
    expect(docLoi({ ma: 'sap_mo', message: '' }).loi).toBe('Món này sắp mở bán. Em ghé lại sau nhé.')
    expect(docLoi({ ma: 'khong_co_mon' }).loi).toBe('Cửa hàng không có món này. Em tải lại Cửa hàng rồi chọn lại nhé.')
    expect(docLoi({ ma: 'sai_dau_vao' }).loi).toBe('Có gì đó chưa đúng. Em tải lại trang rồi thử lại nhé.')
    expect(docLoi({ ma: 'mat_mang' }).loi).toBe('Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.')
    expect(docLoi(new Error('boom'))).toEqual({ ma: '', loi: 'boom' })
    expect(docLoi(undefined).loi).toBe('Cửa hàng chưa tải được. Em bấm Thử lại nhé.')
  })
  it('sinhKhoa: 8–64 ký tự [A-Za-z0-9_-], mỗi lần một khoá khác', () => {
    const a = sinhKhoa('mua')
    const b = sinhKhoa('mua')
    expect(a).toMatch(/^mua-[A-Za-z0-9]{6,}$/)
    expect(sinhKhoa('doi')).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(a).not.toBe(b)
  })
})

describe('MÁY CHỦ GIẢ · khớp hợp đồng', () => {
  it('vang-xem đúng ví dụ hợp đồng; cờ tắt ⇒ {ok:true,bat:false}', async () => {
    const api = new ShopApiGia()
    expect(await api.vangXem()).toEqual({ ok: true, bat: true, vang: 340, ongNghiem: 620, giuLai: 200, doiToiDa: 420, ngayAn: 3, chuoiNgay: 9, anThachSang: 3, mua: 'm1' })
    api.congTac.batShop = false
    expect(await api.vangXem()).toEqual({ ok: true, bat: false })
  })
  it('shop-danh-sach: CHỈ món đợt 1 (24); có dangMac + emCo; thieu ngắn / null; suatCon null khi không giới hạn', async () => {
    const d = await new ShopApiGia().shopDanhSach()
    expect(d.mon).toHaveLength(24)
    expect(d.mon.every((m) => /^(HQ|VD|KT)-/.test(m.ma))).toBe(true)
    expect(d.phienBan).toBe('m1-v1')
    expect(d.vang).toBe(340)
    expect(d.dangMac).toEqual({ 'hao-quang': null, vet: null, khung: 'KT-03', dau: null, 'co-lung': null })
    expect(d.emCo).toEqual({ chuoiNgay: 9, anThachSang: 3 })
    const theo = (ma: string) => d.mon.find((m) => m.ma === ma)!
    expect(theo('KT-08')).toEqual({ ma: 'KT-08', gia: 6000, daCo: false, dangMac: false, moKhoa: false, thieu: 'Cần chuỗi 14 ngày', suatCon: 12, suatTong: 30 })
    expect(theo('HQ-08')).toMatchObject({ moKhoa: false, thieu: 'Cần chuỗi 14 ngày + 5 ấn thạch sáng', suatCon: 20, suatTong: 20 })
    expect(theo('VD-08')).toMatchObject({ suatCon: 0, suatTong: 25 })
    expect(theo('HQ-01')).toEqual({ ma: 'HQ-01', gia: 20, daCo: false, dangMac: false, moKhoa: true, thieu: null, suatCon: null, suatTong: null })
    expect(theo('KT-03')).toMatchObject({ daCo: true, dangMac: true })
    expect(theo('VD-01')).toMatchObject({ daCo: true, dangMac: false })
    // đợt 2 mở ⇒ đủ 40
    expect((await new ShopApiGia({ dotMoBan: 2 }).shopDanhSach()).mon).toHaveLength(40)
  })

  it('vang-doi: đúng ví dụ hợp đồng; luôn giữ lại 200 EXP (duoi_nguong + lời L1); soExp nguyên ≥ 1; KHÔNG bắt bội của 10', async () => {
    const api = new ShopApiGia()
    const l1 = await loi(api.vangDoi(421, 'doi-abcd1234'))
    expect(l1?.ma).toBe('duoi_nguong')
    expect(l1?.message).toBe('Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.')
    for (const sai of [0, -1, 1.5, Number.NaN]) expect((await loi(api.vangDoi(sai, 'doi-abcd1234')))?.ma).toBe('sai_dau_vao')
    expect((await loi(api.vangDoi(10, 'ngan')))?.ma).toBe('sai_dau_vao') // khoá < 8 ký tự
    expect(api.ghi.doi).toBe(0)
    expect(await api.vangDoi(7, 'doi-le-7abcd')).toMatchObject({ daDoi: 7, vang: 347, ongNghiem: 613, ngayAn: 3, lapLai: false })
    expect(await api.vangDoi(180, 'doi-7f3a-aaaa')).toEqual({ ok: true, daDoi: 180, vang: 527, ongNghiem: 433, ngayAn: 2, lapLai: false })
    // đổi hết phần thừa còn lại ⇒ ống nghiệm đúng 200, không thấp hơn
    expect((await api.vangXem() as { doiToiDa: number }).doiToiDa).toBe(233)
    await api.vangDoi(233, 'doi-het-abcd1')
    expect((await api.vangXem() as { ongNghiem: number }).ongNghiem).toBe(200)
    expect((await loi(api.vangDoi(1, 'doi-them-abcd1')))?.ma).toBe('duoi_nguong')
  })
  it('vang-doi: đúng ví dụ 180 EXP ⇒ {daDoi:180,vang:520,ongNghiem:440,ngayAn:2}', async () => {
    expect(await new ShopApiGia().vangDoi(180, 'doi-7f3a-bbbb')).toEqual({ ok: true, daDoi: 180, vang: 520, ongNghiem: 440, ngayAn: 2, lapLai: false })
  })
  it('vang-doi: cùng khoá ⇒ KHÔNG ghi thêm, lapLai:true, daDoi của lần gốc + số HIỆN TẠI', async () => {
    const api = new ShopApiGia()
    await api.vangDoi(180, 'doi-lap-lai-1')
    const lai = await api.vangDoi(180, 'doi-lap-lai-1')
    expect(lai).toEqual({ ok: true, daDoi: 180, vang: 520, ongNghiem: 440, ngayAn: 2, lapLai: true })
    expect(api.ghi.doi).toBe(1)
    expect(api.vang).toBe(520)
    // khoá cũ nhưng số EXP khác: vẫn trả kết quả cũ, không ghi
    expect((await api.vangDoi(10, 'doi-lap-lai-1')).daDoi).toBe(180)
    expect(api.ghi.doi).toBe(1)
  })

  it('shop-mua: đúng ví dụ hợp đồng, TỰ MẶC; cùng khoá ⇒ lapLai:true, không ghi thêm, kể cả khi cờ đã tắt (khoá đã ghi trả TRƯỚC mọi kiểm khác)', async () => {
    const api = new ShopApiGia()
    expect(await api.shopMua('VD-04', 120, 'mua-91c2-aaaa')).toEqual({ ok: true, maMon: 'VD-04', vang: 220, daMac: true, lapLai: false })
    expect(api.dangMac.vet).toBe('VD-04')
    api.congTac.batShop = false
    expect(await api.shopMua('VD-04', 120, 'mua-91c2-aaaa')).toEqual({ ok: true, maMon: 'VD-04', vang: 220, daMac: true, lapLai: true })
    expect(api.ghi.mua).toBe(1)
    expect(api.vang).toBe(220)
    api.congTac.batShop = true
    const d = await api.shopDanhSach()
    expect(d.mon.find((m) => m.ma === 'VD-04')).toMatchObject({ daCo: true, dangMac: true })
    expect(d.dangMac.vet).toBe('VD-04')
  })
  it('shop-mua: thứ tự kiểm tam_dong → khong_co_mon → sap_mo → da_co → het_suat → chua_mo → gia_doi → thieu_vang (mỗi mã đúng lời chốt)', async () => {
    const mua = (api: ShopApiGia, ma: string, gia: number, k = 'mua-thu-abcdef') => loi(api.shopMua(ma, gia, k))
    // tam_dong đứng đầu dù mã lạ
    const dong = new ShopApiGia({ congTac: { batShop: false } })
    expect((await mua(dong, 'XX-99', 1))?.ma).toBe('tam_dong')
    expect((await mua(dong, 'XX-99', 1))?.message).toBe('Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.')
    const api = new ShopApiGia({ dotMoBan: 1, vang: 340 })
    expect((await mua(api, 'XX-99', 1))?.ma).toBe('khong_co_mon')
    expect((await mua(api, 'DA-01', 30))?.ma).toBe('sap_mo') // đợt 2 chưa bán
    expect((await mua(api, 'VD-01', 20))?.ma).toBe('da_co') // đã có (kiểm trước hết suất, khoá, giá)
    expect((await mua(api, 'VD-08', 7500))?.ma).toBe('het_suat')
    expect((await mua(api, 'VD-08', 7500))?.message).toBe('Món này đã hết. Mùa 1 chỉ có 25 cái.')
    const chuaMo = await mua(api, 'KT-08', 6000)
    expect(chuaMo?.ma).toBe('chua_mo')
    expect(chuaMo?.message).toBe('Món này cần chuỗi 14 ngày. Em đang chuỗi 9 ngày.')
    expect((await mua(api, 'HQ-05', 599))?.ma).toBe('gia_doi') // giá lệch kiểm TRƯỚC thiếu vàng
    expect((await mua(api, 'HQ-05', 599))?.message).toBe('Giá vừa thay đổi, em xem lại rồi mua nhé.')
    const thieu = await mua(api, 'HQ-05', 600)
    expect(thieu?.ma).toBe('thieu_vang')
    expect(thieu?.message).toBe('Chưa đủ vàng — còn thiếu 260 vàng.')
    expect(api.ghi.mua).toBe(0)
    expect(api.vang).toBe(340)
  })
  it('shop-mua: món có số cái ⇒ suatCon giảm khi mua; hết cái ⇒ het_suat', async () => {
    const api = new ShopApiGia({ vang: 99999, chuoiNgay: 30, anThachSang: 9, daBan: { 'HQ-08': 19 } })
    await api.shopMua('HQ-08', 9000, 'mua-cai-cuoi-1')
    expect((await api.shopDanhSach()).mon.find((m) => m.ma === 'HQ-08')).toMatchObject({ suatCon: 0, daCo: true })
    const khac = new ShopApiGia({ vang: 99999, chuoiNgay: 30, anThachSang: 9, daBan: { 'HQ-08': 20 } })
    expect((await loi(khac.shopMua('HQ-08', 9000, 'mua-cai-cuoi-2')))?.ma).toBe('het_suat')
  })

  it('thu-mac-do: chua_co (chưa có / sai chỗ đeo), sai_dau_vao (chỗ đeo lạ), cởi bằng null, vẫn chạy khi cờ tắt', async () => {
    const api = new ShopApiGia()
    expect((await loi(api.thuMacDo('vet', 'VD-04')))?.ma).toBe('chua_co')
    expect((await loi(api.thuMacDo('vet', 'VD-04')))?.message).toBe('Em chưa có món này nên chưa mặc được.')
    expect((await loi(api.thuMacDo('vet', 'KT-03')))?.ma).toBe('chua_co') // có món nhưng sai chỗ đeo
    expect((await loi(api.thuMacDo('nguoc' as never, null)))?.ma).toBe('sai_dau_vao')
    api.congTac.batShop = false
    expect(await api.thuMacDo('vet', 'VD-01')).toEqual({ ok: true, dangMac: { 'hao-quang': null, vet: 'VD-01', khung: 'KT-03', dau: null, 'co-lung': null } })
    expect((await api.thuMacDo('khung', null)).dangMac.khung).toBeNull()
  })

  it('cờ tắt: vang-xem {bat:false}; vang-doi, shop-danh-sach, shop-mua ⇒ tam_dong', async () => {
    const api = new ShopApiGia({ congTac: { batShop: false } })
    expect((await loi(api.shopDanhSach()))?.ma).toBe('tam_dong')
    expect((await loi(api.vangDoi(10, 'doi-thu-abcdef')))?.ma).toBe('tam_dong')
    expect((await loi(api.shopMua('VD-04', 120, 'mua-thu-abcdef')))?.ma).toBe('tam_dong')
  })
  it('mất mạng: MỌI lệnh ném mat_mang với lời L9; số lần gọi vẫn ghi vào nhật ký', async () => {
    const api = new ShopApiGia({ congTac: { matMang: true } })
    for (const p of [api.vangXem(), api.shopDanhSach(), api.vangDoi(10, 'doi-thu-abcdef'), api.shopMua('VD-04', 120, 'mua-thu-abcdef'), api.thuMacDo('vet', null)]) {
      const e = await loi(p)
      expect(e?.ma).toBe('mat_mang')
      expect(e?.message).toBe('Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.')
    }
    expect(api.nhatKy).toEqual(['vang-xem', 'shop-danh-sach', 'vang-doi', 'shop-mua', 'thu-mac-do'])
  })
  it('công tắc lỗi giả bắn MỘT lần rồi tự tắt; số dư "lạ" của lần ghi kế tiếp được dùng đúng một lần', async () => {
    const api = new ShopApiGia()
    api.congTac.epLoi = 'thieu_vang'
    expect((await loi(api.shopMua('VD-04', 120, 'mua-ep-abcdef1')))?.ma).toBe('thieu_vang')
    expect(api.congTac.epLoi).toBeNull()
    api.congTac.vangSauGhi = 777
    expect((await api.shopMua('VD-04', 120, 'mua-ep-abcdef2')).vang).toBe(777)
    expect(api.vang).toBe(777)
    expect(api.congTac.vangSauGhi).toBeNull()
    expect((await api.shopMua('HQ-01', 20, 'mua-ep-abcdef3')).vang).toBe(757)
    // gia_doi thật sự làm giá đổi: lần sau có giá mới
    api.congTac.epLoi = 'gia_doi'
    expect((await loi(api.shopMua('HQ-03', 150, 'mua-ep-abcdef4')))?.ma).toBe('gia_doi')
    expect((await api.shopDanhSach()).mon.find((m) => m.ma === 'HQ-03')!.gia).toBe(160)
  })
  it('độ chậm: mỗi lệnh chờ đúng `tre` ms (tối đa 1500)', async () => {
    const api = new ShopApiGia({ tre: 60 })
    const t0 = Date.now()
    await api.vangXem()
    expect(Date.now() - t0).toBeGreaterThanOrEqual(50)
    expect(new ShopApiGia({ tre: 99999 }).tre).toBe(1500)
  })
})
