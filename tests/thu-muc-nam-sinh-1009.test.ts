// CÂY THƯ MỤC NĂM SINH, VÀ PHẠM VI RÚT CÂU SAI (thầy chốt 10/09).
//
//   "bạn tạo cây thư mục 2009, 2010, 2011. mỗi khi tôi tạo ca bạn phải tự gom
//    vào thư mục của năm sinh, tôi tạo ca thì luôn để năm sinh ở đầu."
//
//   "khi chọn ca thi rút câu sai, bạn phải quét hết thư mục năm sinh đó, tìm ra
//    lần thi gần nhất của từng học sinh, hoặc 3 lần ngẫu nhiên để phân 30% câu
//    sai trước đó."
//
// VIỆC NÀY KHÔNG CHỈ LÀ CÁI THƯ MỤC. Đường rút câu sai trước nay xếp MỌI ca của
// MỌI khối chung một danh sách theo giờ mở rồi lấy ba ca gần nhất. Đúng ngày
// 10/09 ca khối 10 thi 14:37 và ca khối 12 thi 17:40 nằm sát nhau — nên ca 2011
// hoàn toàn có thể rút "câu em từng sai" từ một ca 2009. Khác đề, khác chương,
// và sai IM LẶNG vì đề vẫn dựng ra bình thường.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { THU_MUC_KHAC, cungNamSinh, gomCaTheoNamSinh, namSinhTuTenCa } from '../src/lib/nam-sinh-ca'
import { chonCaTheoPhamVi } from '../src/lib/de-rieng-nguon'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../src/lib/cau-hinh-de-rieng'

/** Đúng tên ca thật trên màn Lịch sử ca của thầy, chụp 18:48 ngày 10/09. */
const TEN_THAT = [
  '2009 - Doll - L2',
  '2009 - Lớp 1 - L2',
  '2011 - Lớp 1 - L1',
  '2009 - Lớp TH - L1',
  '2009 - Lớp 2 - L1',
  '2009 - Toàn - L1',
]

describe('ĐỌC NĂM SINH Ở ĐẦU TÊN CA', () => {
  it('đọc đúng cả sáu tên ca thật của thầy', () => {
    expect(TEN_THAT.map(namSinhTuTenCa)).toEqual(['2009', '2009', '2011', '2009', '2009', '2009'])
  })

  it('chịu được cách gõ khác nhau — thầy gõ tay nên dấu và khoảng trắng không đều', () => {
    expect(namSinhTuTenCa('2010-Lớp 3')).toBe('2010')
    expect(namSinhTuTenCa('2010 Lớp 3')).toBe('2010')
    expect(namSinhTuTenCa('  2010 - Lớp 3  ')).toBe('2010')
  })

  it('KHÔNG ĐOÁN khi tên không mở đầu bằng năm', () => {
    expect(namSinhTuTenCa('Lớp 12 - buổi 3')).toBeNull()
    expect(namSinhTuTenCa('')).toBeNull()
    expect(namSinhTuTenCa(null)).toBeNull()
    // Mã ca lọt vào đầu tên KHÔNG được nhận nhầm là năm sinh.
    expect(namSinhTuTenCa('890691 - Lớp 1')).toBeNull()
    // Năm ngoài khoảng hợp lý cũng không nhận.
    expect(namSinhTuTenCa('1999 - Lớp 1')).toBeNull()
  })

  it('năm phải đứng RIÊNG, không dính vào số dài hơn', () => {
    expect(namSinhTuTenCa('20091 - Lớp 1')).toBeNull()
  })
})

describe('GOM THÀNH CÂY THƯ MỤC', () => {
  const ds = TEN_THAT.map((tenCa, i) => ({ maCa: `ma${i}`, tenCa }))

  it('sáu ca thật gom thành 2 thư mục: 2011 rồi 2009', () => {
    const cay = gomCaTheoNamSinh(ds, (c) => c.tenCa)
    expect(cay.map((t) => t.nam)).toEqual(['2011', '2009'])
    expect(cay[0].ca).toHaveLength(1)
    expect(cay[1].ca).toHaveLength(5)
  })

  it('ca không có năm rơi vào "Khác", và "Khác" luôn đứng CUỐI', () => {
    const cay = gomCaTheoNamSinh([{ maCa: 'x', tenCa: 'Ca lẻ' }, ...ds, { maCa: 'y', tenCa: '2010 - Lớp 5' }], (c) => c.tenCa)
    expect(cay.map((t) => t.nam)).toEqual(['2011', '2010', '2009', THU_MUC_KHAC])
    expect(cay[cay.length - 1].ca.map((c) => c.maCa)).toEqual(['x'])
  })

  it('GIỮ NGUYÊN thứ tự ca trong thư mục — chỗ gọi đã xếp theo giờ mở', () => {
    const cay = gomCaTheoNamSinh(ds, (c) => c.tenCa)
    expect(cay[1].ca.map((c) => c.maCa)).toEqual(['ma0', 'ma1', 'ma3', 'ma4', 'ma5'])
  })
})

describe('CÙNG THƯ MỤC HAY KHÔNG', () => {
  it('2011 và 2009 KHÔNG cùng thư mục — đây chính là chỗ trộn khối cũ', () => {
    expect(cungNamSinh('2011 - Lớp 1 - L1', '2009 - Lớp 2 - L1')).toBe(false)
  })
  it('hai ca cùng năm thì cùng thư mục dù phần sau khác hẳn', () => {
    expect(cungNamSinh('2009 - Doll - L2', '2009 - Lớp TH - L1')).toBe(true)
  })
  it('hai ca ĐỀU không có năm thì cùng "Khác"; một có một không thì KHÔNG', () => {
    expect(cungNamSinh('Ca lẻ', 'Ca khác')).toBe(true)
    expect(cungNamSinh('Ca lẻ', '2009 - Lớp 1')).toBe(false)
  })
})

describe('PHẠM VI QUÉT — cả thư mục, không còn chặn ở 3 ca', () => {
  const nhieuCa = Array.from({ length: 12 }, (_, i) => ({ maCa: `c${i}` }))

  it('`gan_nhat` giữ CẢ danh sách, không cắt còn 3', () => {
    const ra = chonCaTheoPhamVi(nhieuCa, 'c-nay', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'gan_nhat' })
    expect(ra).toHaveLength(12)
  })

  it('vẫn có TRẦN AN TOÀN để một năm hàng trăm ca không làm treo lượt dựng đề', () => {
    const rat = Array.from({ length: 200 }, (_, i) => ({ maCa: `c${i}` }))
    const ra = chonCaTheoPhamVi(rat, 'c-nay', { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'gan_nhat' })
    expect(ra).toHaveLength(CAU_HINH_DE_RIENG_MAC_DINH.TRAN_CA_QUET)
  })

  it('`ba_ca` cũng quét CẢ thư mục, và vẫn TẤT ĐỊNH', () => {
    // VIẾT LẠI 10/09 tối theo lệnh của thầy: "quét tất cả các mã trong thư mục
    // ca thi chứa năm sinh đó". Bốc 3 ca trong toàn bộ danh sách rồi mới xem em
    // có mặt không là trò may rủi — trần 3 ca nay nằm ở `chonCauLapChoEm`, tính
    // trên đúng những ca CHÍNH EM có nộp.
    const c = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    const a = chonCaTheoPhamVi(nhieuCa, 'ca-nay', c).map((x) => x.maCa)
    const b = chonCaTheoPhamVi(nhieuCa, 'ca-nay', c).map((x) => x.maCa)
    expect(a).toEqual(nhieuCa.map((x) => x.maCa))
    expect(a).toEqual(b)
  })

  it('`ba_ca` bốc từ CẢ thư mục chứ không chỉ trong 3 ca gần nhất', () => {
    const c = { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: 'ba_ca' as const }
    // Chạy nhiều mã ca khác nhau: nếu chỉ bốc trong 3 ca đầu thì không bao giờ
    // chạm tới c3…c11.
    const cham = new Set<string>()
    for (let i = 0; i < 40; i++) for (const x of chonCaTheoPhamVi(nhieuCa, `ca-${i}`, c)) cham.add(x.maCa)
    // eslint-disable-next-line no-console
    console.log(`[thư mục năm] ba_ca chạm ${cham.size}/12 ca trong thư mục`)
    expect(cham.size).toBeGreaterThan(3)
  })
})

describe('MÃ NGUỒN — hai chỗ chặn 3 ca đều phải bỏ, và phải lọc theo năm', () => {
  const NGUON = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng-nguon.ts'), 'utf8')
  const DUNG = fs.readFileSync(path.join(process.cwd(), 'src/lib/de-rieng.ts'), 'utf8')

  const MAN_CA_1009 = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf-8')

  it('`docCacCaTruoc` LỌC theo năm sinh — lấy từ HỒ SƠ EM trước, tên ca chỉ là đường lùi', () => {
    // 10/09 tối: tên ca là NHÃN GÕ TAY. Thầy đổi tên ca là bộ lọc tắt, rồi mã
    // âm thầm quét sang mọi khối và cả lớp ra "mới vào lớp, chưa có ca nào".
    // Nguồn sự thật nay là năm sinh của chính các em trong ca.
    expect(NGUON).toContain("import { namSinhDaSo, namSinhTuTenCa } from './nam-sinh-ca'")
    expect(NGUON).toContain('namNay = namSinhDaSo(')
    expect(NGUON).toContain("nguonNam = 'hoc_sinh'")
    expect(NGUON).toContain('namNay = namSinhTuTenCa(caNay?.tenCa)')
    expect(NGUON).toContain('.filter((c) => namNay === null || namSinhTuTenCa(c.tenCa) === namNay)')
  })

  it('KHÔNG lọc được thì phải KHAI RA, không im lặng quét rộng', () => {
    // Chỗ chết người của bản cũ: nó biết mình không lọc được mà vẫn chạy tiếp,
    // rồi đổ lỗi cho học sinh bằng nhãn "mới vào lớp".
    expect(NGUON).toContain("nguonNam: 'hoc_sinh' | 'ten_ca' | 'khong_xac_dinh'")
    expect(NGUON).toContain('namQuet: namNay')
    expect(MAN_CA_1009).toContain('KHÔNG xác định được năm sinh của ca này')
  })

  it('ca hiện tại KHÔNG đọc được năm thì không lọc — thà quét rộng còn hơn quét nhầm khối', () => {
    expect(NGUON).toContain('namNay === null ||')
  })

  it('CẢ HAI chỗ cắt 3 ca đều đã đổi sang trần an toàn', () => {
    expect(NGUON).not.toContain('SO_CA_TRA_NGUOC')
    expect(DUNG).not.toContain('SO_CA_TRA_NGUOC')
    expect(NGUON).toContain('ch.TRAN_CA_QUET')
    expect(DUNG).toContain('ch.TRAN_CA_QUET')
  })

  it('tỉ lệ 30% GIỮ NGUYÊN — thầy không đổi con số đó', () => {
    expect(CAU_HINH_DE_RIENG_MAC_DINH.TI_LE_CAU_LAP).toBe(0.3)
  })
})

describe('MÀN LỊCH SỬ CA dựng cây thư mục', () => {
  const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/LichSuCaScreen.tsx'), 'utf8')

  it('gom bằng hàm dùng chung, không viết bản thứ hai', () => {
    expect(MAN).toContain("import { THU_MUC_KHAC, gomCaTheoNamSinh } from '../lib/nam-sinh-ca'")
    expect(MAN).toContain('gomCaTheoNamSinh(dsLoc, (c) => c.tenCa)')
  })

  it('mỗi thư mục gấp lại được, và mặc định MỞ HẾT', () => {
    expect(MAN).toContain('const [gapNam, setGapNam] = useState<Record<string, boolean>>({})')
    expect(MAN).toContain('aria-expanded={!gapNam[tm.nam]}')
  })
})
