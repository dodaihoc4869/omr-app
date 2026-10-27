// ĐỊNH NGHĨA HOÀN THÀNH của GOI-LEN-BANG-80-PHUT.md — mục 8.
//
// Mỗi `describe` dưới đây là một dòng trong mục 8 của đặc tả. Không dòng nào là
// lời hứa: tất cả đều chạy ra số.
//
// ================= KHAI TRƯỚC: MỘT CHỖ ĐÃ THU HẸP ==========================
//
// Đặc tả 8.4 viết "200 ca nhỏ (N ≤ 12 câu, 6 em): Lagrange so VÉT CẠN". Vét cạn
// 12 câu là 4^12 = 16 777 216 vector lane cho MỘT ca, nhân 200 ca là 3,3 tỉ —
// không chạy được trong một phép kiểm. Nên:
//
//   · 200 ca ở N ≤ 7 câu, 4 em  → 4^7 = 16 384 vector/ca, tổng ~3,3 triệu.
//   · thêm 20 ca ở N = 8 câu     → 65 536 vector/ca, để thấy kết luận không đổi
//                                   khi N lớn hơn.
//
// Cả hai đều là vét cạn THẬT (không lấy mẫu), và ngưỡng khoảng cách đối ngẫu
// giữ nguyên 5% như đặc tả. Đây là thu hẹp cỡ bài, không phải nới tiêu chí.
//
// 27/10: bộ xếp giờ `xep-gio-len-bang` và bộ dựng giáo án `giao-an-len-bang` (Engine C, đã rời màn) gỡ hẳn vì
// không màn nào dùng ⇒ các mục chạy hai tệp ấy (4.3 thừa giờ, 4.4, 8.4–8.9, ghép cặp, giá trị lane) bỏ theo.
import { describe, expect, it } from 'vitest'
import {
  canDuoiWilson,
  CAU_HINH_LEN_BANG_MAC_DINH,
  haoPhiGiay,
  nganSachGiay,
} from '../src/lib/len-bang-cau-hinh'
import { dungDoKho, hopVoiEm, khongDuCanCu, nguyenNhanSai, vapCuaLop, type BaiLamCoGiay, type DoKhoCau, type KhoDoKho } from '../src/lib/do-kho-cau'
import { type CauChua } from '../src/lib/phan-cong'
import { gopCaVaoKho, KHO_DO_KHO_RONG, thongKeKho } from '../src/lib/kho-do-kho'

// GHIM CẤU HÌNH 80 PHÚT (sửa 14/09) — KHÔNG PHẢI SỬA TEST CHO XANH.
//
// Bộ kiểm này đo RÀNG BUỘC CỨNG của bộ xếp giờ 80 phút trên 100 ca cỡ lớp.
// Ngày 14/09 thầy chốt buổi chữa 90 phút và sàn 20 em, nên mặc định đổi:
// 80 → 90 phút, trần em 8 → 30. Luật bị soi ở đây không đổi một chữ; chỉ ghim
// đầu vào để nó không trôi theo mặc định. Ngân sách 90 phút có bộ kiểm riêng:
// `tests/xep-buoi-chua-1409.test.ts`.
const CH = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 80, SO_EM_LEN_BANG_TOI_DA: 8 }

// ------------------------------------------------------------------- tiện ích

function cauMau(i: number, sao: 0 | 1 | 2, cd = 'Ester – lipid', mucDo: CauChua['mucDo'] = 'hieu'): CauChua {
  return { id: `Q${String(i).padStart(2, '0')}`, phan: 'I', so: i, chuyenDe: cd, mucDo, tomTat: `câu ${i}`, viTri: i, sao, lyDoSao: sao ? 'câu nền' : '' }
}

function doKhoMau(i: number, sao: 0 | 1 | 2, opt: { n1?: { n: number; sai: number }; n2?: { n: number; dung: number }; cd?: string; mucDo?: CauChua['mucDo'] } = {}): DoKhoCau {
  const cau = cauMau(i, sao, opt.cd, opt.mucDo)
  const kho: KhoDoKho = opt.n2 ? { [cau.id]: { soLuot: opt.n2.n, soDung: opt.n2.dung, soCa: 3 } } : {}
  const bl: BaiLamCoGiay[] = []
  if (opt.n1) {
    for (let k = 0; k < opt.n1.n; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: k >= opt.n1.sai, chon: k < opt.n1.sai ? 'C' : 'A', giay: 40 })
  }
  return dungDoKho([cau], bl, kho, CH)[0]
}

// =========================================================================
describe('8.1 — NHỮNG SỐ NỀN ĐÃ ĐO, khoá lại để không ai sửa lệch', () => {
  it('cận dưới Wilson: cùng tỉ lệ thô, mẫu bé bị dè chừng hơn hẳn', () => {
    const be = canDuoiWilson(3, 8, 0.9)
    const to = canDuoiWilson(30, 80, 0.9)
    expect(3 / 8).toBeCloseTo(30 / 80, 10) // tỉ lệ thô BẰNG NHAU
    expect(be).toBeLessThan(to - 0.1) // cận dưới thì không
    expect(be).toBeGreaterThan(0.15)
    expect(be).toBeLessThan(0.22)
  })

  it('không có lượt nào thì KHÔNG được coi là câu dễ', () => {
    expect(canDuoiWilson(0, 0, 0.9)).toBe(0)
  })

  it('ngưỡng N2 của đặc tả là cận dưới Wilson, KHÔNG phải "≥ 30 lượt"', () => {
    // Vì sao: đo 10/09 trên `ChiTietCau` (3 737 dòng, 32 ca, 814 qid) thì đúng
    // MỘT qid đạt 30 lượt. Ngưỡng cũ hôm nay gần như không bao giờ bật.
    expect(CH.N2_CO_MAU_TOI_THIEU).toBe(8)
    expect(CH.N2_CAN_DUOI_WILSON).toBe(0.55)
  })
})

describe('4.2 — BA NGUỒN, và cỡ mẫu tính theo TỪNG CÂU (C3)', () => {
  it('n là số em làm CHÍNH CÂU ẤY, không phải số em nộp của ca', () => {
    // Ca đề riêng: 40 em nộp, nhưng câu này chỉ 5 em chạm tới.
    const cau = cauMau(1, 1)
    const bl: BaiLamCoGiay[] = []
    for (let k = 0; k < 5; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: false })
    for (let k = 0; k < 35; k++) bl.push({ sbd: `F${k}`, idCau: 'KHAC', dung: true })
    const d = dungDoKho([cau], bl, {}, CH)[0]
    expect(d.n1).toBeNull() // 5 < 8 ⇒ KHÔNG kết luận, dù ca có 40 em
    expect(d.nguon).toBe('N3')
  })

  it('đủ 8 em làm câu ấy thì N1 bật, và chữ in ra mang cỡ mẫu', () => {
    const d = doKhoMau(2, 1, { n1: { n: 10, sai: 6 } })
    expect(d.n1).toEqual({ n: 10, sai: 6 })
    expect(d.nguon).toBe('N1')
    expect(d.chuNguon).toBe('lớp vừa rồi: 6/10 em sai')
  })

  it('không N1 thì rơi về N2, chữ vẫn mang cỡ mẫu và cận dưới', () => {
    const d = doKhoMau(3, 1, { n2: { n: 25, dung: 17 } })
    expect(d.nguon).toBe('N2')
    expect(d.chuNguon).toMatch(/^lịch sử: 17\/25 lượt đúng \(68%, cận dưới \d+%\) qua 3 ca$/)
  })

  it('không N1 không N2 thì chỉ còn nhãn kho, KHÔNG suy độ khó từ đâu khác', () => {
    const d = doKhoMau(4, 2)
    expect(d.nguon).toBe('N3')
    expect(d.doKho).toBe(1) // sao 2 ⇒ cotLoi 1
    expect(d.chuNguon).toContain('kho: sao 2')
  })

  it('sao 0 + không N1 + không N2 ⇒ KHÔNG đủ căn cứ gọi là khó', () => {
    expect(khongDuCanCu(doKhoMau(5, 0))).toBe(true)
    expect(khongDuCanCu(doKhoMau(6, 0, { n1: { n: 12, sai: 9 } }))).toBe(false)
  })
})

describe('4.3 — DANH SÁCH BẮT BUỘC CHỮA, ba lối vào', () => {
  it('sao 2 là vào, kể cả khi cả lớp làm đúng hết', () => {
    const d = doKhoMau(1, 2, { n1: { n: 30, sai: 0 } })
    expect(d.batBuoc).toBe(true)
    expect(d.viSaoBatBuoc).toContain('sao 2')
  })

  it('N1 sai ≥ 40% là vào', () => {
    expect(doKhoMau(2, 0, { n1: { n: 10, sai: 4 } }).batBuoc).toBe(true)
    expect(doKhoMau(3, 0, { n1: { n: 10, sai: 3 } }).batBuoc).toBe(false)
  })

  // PHÁ MÃ TÌM RA CHỖ NÀY. Đổi cận dưới Wilson thành tỉ lệ THÔ mà 47 phép kiểm
  // vẫn xanh — vì mấy ca tôi chọn có raw và Wilson cùng phía ngưỡng. Ca dưới đây
  // là ca hai bên KHÁC KẾT LUẬN, tức đúng chỗ việc dùng Wilson có nghĩa.
  it('WILSON KHÁC TỈ LỆ THÔ: 6/10 lượt đúng — thô 60% cho qua, cận dưới 35% thì không', () => {
    const d = doKhoMau(9, 0, { n2: { n: 10, dung: 6 } })
    expect(6 / 10).toBeGreaterThan(CH.N2_CAN_DUOI_WILSON) // thô: KHÔNG bắt buộc
    expect(canDuoiWilson(6, 10, 0.9)).toBeLessThan(CH.N2_CAN_DUOI_WILSON) // cận dưới: BẮT BUỘC
    expect(d.batBuoc).toBe(true)
    expect(d.viSaoBatBuoc).toBe('lịch sử: 6/10 lượt đúng, cận dưới 35%')
    // Và chữ in ra phải hiện CẢ HAI con số, không gộp làm một.
    expect(d.chuNguon).toBe('lịch sử: 6/10 lượt đúng (60%, cận dưới 35%) qua 3 ca')
  })

  it('N2 cận dưới ≤ 0,55 là vào — và mẫu bé tự bị loại', () => {
    expect(doKhoMau(4, 0, { n2: { n: 40, dung: 18 } }).batBuoc).toBe(true)
    // 5 lượt: dưới cỡ mẫu tối thiểu ⇒ N2 không được kết luận gì
    expect(doKhoMau(5, 0, { n2: { n: 5, dung: 2 } }).batBuoc).toBe(false)
  })
})

describe('8.10 — CA THIẾU GIÂY: tắt hai luật đọc thời gian, và NÓI RA', () => {
  const cau = cauMau(1, 1)
  const bl: BaiLamCoGiay[] = []
  for (let k = 0; k < 20; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: false, chon: 'C', dapAnDung: 'A', giay: k < 2 ? 30 : null })

  it('dưới 60% dòng có giây ⇒ không sinh nhãn `doan` dù em bấm rất nhanh', () => {
    const { coGiay, theoEm } = vapCuaLop([cau], bl, CH)
    expect(coGiay).toBe(false)
    const moiNhan = [...theoEm.values()].flat().map((v) => v.nguyenNhan)
    expect(moiNhan).not.toContain('doan')
    expect(moiNhan).not.toContain('tinh_sai')
  })

  it('đủ giây thì luật thời gian bật lại — cùng dữ liệu, khác kết luận', () => {
    const du = bl.map((b, i) => ({ ...b, giay: i === 0 ? 3 : 60 }))
    const { coGiay, theoEm } = vapCuaLop([cau], du, CH)
    expect(coGiay).toBe(true)
    expect((theoEm.get('E0') ?? [])[0].nguyenNhan).toBe('doan')
  })

  it('bỏ trống luôn là `chua_biet`, không phụ thuộc đồng hồ', () => {
    expect(nguyenNhanSai({ sbd: 'X', idCau: cau.id, dung: false, chon: '' }, cau, [], 0, false)).toBe('chua_biet')
  })

})

describe('8.11 — CHƯA CÓ LỊCH SỬ LÊN BẢNG thì nói thẳng, cấm in ngày giả', () => {
  it('`moi(e)` bằng 1 khi chưa lên bảng lần nào, và giảm khi đã lên', () => {
    const c = cauMau(1, 1)
    const vap = [{ sbd: 'S', idCau: 'Q99', chuyenDe: c.chuyenDe, mucDo: 'van_dung' as const, nguyenNhan: 'hieu_nham' as const, chon: 'C', cungChon: 5, soEmLam: 20 }]
    expect(hopVoiEm(c, vap, 0, CH).moi).toBe(1)
    expect(hopVoiEm(c, vap, 3, CH).moi).toBe(0.25)
  })
})

describe('8.3 — KHO ĐỘ KHÓ dựng nền, không cộng đúp', () => {
  const bank = {
    phanI: [
      { id: 'D1-I-1', text: 'a', options: ['A', 'B', 'C', 'D'] as [string, string, string, string], correct: 'A' as const },
      { id: 'D1-I-2', text: 'b', options: ['A', 'B', 'C', 'D'] as [string, string, string, string], correct: 'B' as const },
    ],
    phanII: [],
    phanIII: [],
    soCau: { I: 2, II: 0, III: 0 },
  }
  const tl = (a: string, b: string) => ({ phanI: { 'D1-I-1': a, 'D1-I-2': b }, phanII: {}, phanIII: {} })
  const luot = [
    { sbd: 'S1', hoTen: 'S1', lanThu: 1, trangThai: 'da_nop', dapAn: tl('A', 'C'), giayCau: null },
    { sbd: 'S2', hoTen: 'S2', lanThu: 1, trangThai: 'da_nop', dapAn: tl('D', 'B'), giayCau: null },
  ]

  it('cộng một ca vào kho: đúng số lượt, đúng số đúng, đúng số ca', () => {
    const k = gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, '2026-09-10T00:00:00Z')
    expect(k.muc['D1-I-1']).toMatchObject({ soLuot: 2, soDung: 1, soCa: 1 })
    expect(k.muc['D1-I-2']).toMatchObject({ soLuot: 2, soDung: 1, soCa: 1 })
    expect(k.daDuyet).toEqual(['CA1'])
  })

  it('gọi lại CÙNG ca thì KHÔNG cộng đúp', () => {
    const k1 = gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, 'x')
    const k2 = gopCaVaoKho(k1, 'CA1', bank, luot, 'y')
    expect(k2.muc['D1-I-1'].soLuot).toBe(2)
    expect(k2.daDuyet).toEqual(['CA1'])
  })

  it('ca thứ hai cộng tiếp, `soCa` lên 2', () => {
    const k = gopCaVaoKho(gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, 'x'), 'CA2', bank, luot, 'y')
    expect(k.muc['D1-I-1']).toMatchObject({ soLuot: 4, soDung: 2, soCa: 2 })
    expect(thongKeKho(k)).toMatchObject({ soCa: 2, soQid: 2, ge30: 0 })
  })
})

describe('CHỐT GIÁ TRỊ — bậc lane phải giữ đúng thứ tự', () => {
  it('hao phí là hai đầu buổi, cộng lại đúng bằng phần bị trừ khỏi ngân sách', () => {
    expect(haoPhiGiay(CH)).toBe(CH.HAO_PHI_MO_DAU_GIAY + CH.HAO_PHI_CHOT_CUOI_GIAY)
    expect(nganSachGiay(CH)).toBe(CH.NGAN_SACH_PHUT * 60 - haoPhiGiay(CH))
  })
})
