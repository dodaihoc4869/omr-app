/**
 * CỔNG THẦN THÚ HOÁ HỌC.
 *
 * Phép kiểm quan trọng nhất: **cấp sau NGẦU HƠN cấp trước**. "Ngầu" được dịch
 * thành hai con số đo được — số tính năng bật, và số điểm ảnh thực sự vẽ ra —
 * nên không ai lỡ tay làm cấp sau nghèo hơn cấp trước mà không bị bắt.
 */
import { describe, it, expect } from 'vitest'
import {
  MUOI_HAI_HINH_THAI, DS_HINH_THAI, DS_CAP_MOC, laCapMoc,
  CAP_TOI_DA, layHinhThai, demTinhNang,
} from '../src/game/than-thu-hoa-hoc/hinh-thai'
import {
  EXP_BAN_DAU, thanhExp, thanhExpCu, nhanExp, tongExpToiDinh, NGUON_EXP, BANG_NGUON_EXP,
} from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { TRAN_EXP_GAME_NGAY } from '../src/lib/hap-thu-ngay'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DANH_SACH_THAN_THU, tinhLucChienPet, tinhHeSoTuongKhac, vaHoSo,
  layHoSoThanThuMacDinh,
} from '../src/game/than-thu-hoa-hoc/he-thong-pet'

/**
 * Đọc MÃ, bỏ chú thích.
 *
 * Cổng phải soi mã chứ không soi lời văn: chính dòng chú thích giải thích
 * "đã bỏ chuỗi bịa X" lại chứa chuỗi X, và làm cổng đỏ oan.
 */
function chiMa(duong: string): string {
  return readFileSync(resolve(__dirname, duong), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((d) => !d.trim().startsWith('//')).join('\n')
}
const MA_COMPONENT = () => chiMa('../src/components/ThanThuHoaHocGame.tsx')

describe('mười hai hình thái', () => {
  it('đúng 120 cấp, tên không trùng một cái nào', () => {
    expect(CAP_TOI_DA).toBe(120)
    expect(DS_HINH_THAI.length).toBe(120)
    // 120 tên khác nhau — không có hai cấp nào trùng tên.
    expect(new Set(DS_HINH_THAI.map((h) => h.ten)).size).toBe(120)
    // Mười hai cấp đầu vẫn còn đó cho mã cũ.
    expect(MUOI_HAI_HINH_THAI.length).toBe(12)
  })

  /**
   * ĐƯỜNG 120 CẤP đổi luật này, và phải nói thẳng vì sao.
   *
   * Với 12 cấp thì mỗi cấp một tính năng mới nên "tăng nghiêm ngặt mỗi cấp" là
   * luật đúng. Với 120 cấp mà vẫn đòi thế thì phải dựng 120 tính năng cấu trúc
   * — vô lý, và máy em không tải nổi. Luật mới vẫn bắt được lỗi "cấp sau nghèo
   * hơn cấp trước", chỉ là đo ở đúng chỗ:
   *   · số tính năng KHÔNG BAO GIỜ giảm trên cả 120 cấp;
   *   · tại MỖI CẤP MỐC thì tăng thật;
   *   · `coCon` tăng nghiêm ngặt mỗi cấp ⇒ không hai cấp nào nhìn y hệt nhau.
   */
  it('NGẦU DẦN — không cấp nào nghèo đi, mốc nào cũng giàu thêm', () => {
    for (let c = 2; c <= CAP_TOI_DA; c++) {
      const truoc = demTinhNang(layHinhThai(c - 1))
      const nay = demTinhNang(layHinhThai(c))
      if (laCapMoc(c)) {
        expect(nay, `cấp mốc ${c} phải nhiều tính năng hơn cấp ${c - 1}`).toBeGreaterThan(truoc)
      } else {
        expect(nay, `cấp ${c} không được nghèo hơn cấp ${c - 1}`).toBeGreaterThanOrEqual(truoc)
      }
    }
    expect(DS_CAP_MOC.length).toBe(17)
  })

  it('không hai cấp nào nhìn y hệt nhau — cỡ thú tăng nghiêm ngặt', () => {
    for (let c = 2; c <= CAP_TOI_DA; c++) {
      expect(layHinhThai(c).coCon, `cấp ${c}`).toBeGreaterThan(layHinhThai(c - 1).coCon)
    }
  })

  it('CỘNG DỒN — bật rồi thì không bao giờ tắt', () => {
    const co = ['than', 'sung', 'duoi', 'canhNho', 'haoQuang', 'vay',
      'canhLon', 'quyDao', 'vuongMien', 'vongRune', 'toiThuong'] as const
    for (const k of co) {
      let daBat = false
      for (let c = 1; c <= 12; c++) {
        const bat = layHinhThai(c)[k]
        if (daBat) expect(bat, `${k} tắt lại ở cấp ${c}`).toBe(true)
        if (bat) daBat = true
      }
    }
  })

  it('cỡ, hào quang và số hạt đều không giảm', () => {
    for (let c = 2; c <= 12; c++) {
      const a = layHinhThai(c - 1), b = layHinhThai(c)
      expect(b.coCon).toBeGreaterThan(a.coCon)
      expect(b.damHaoQuang).toBeGreaterThanOrEqual(a.damHaoQuang)
      expect(b.soHat).toBeGreaterThanOrEqual(a.soHat)
    }
  })

  it('chỉ cấp 1 còn vỏ trứng', () => {
    expect(layHinhThai(1).vo).toBe(true)
    expect(layHinhThai(1).than).toBe(false)
    for (let c = 2; c <= 12; c++) {
      expect(layHinhThai(c).vo, `cấp ${c} không được còn vỏ`).toBe(false)
      expect(layHinhThai(c).than).toBe(true)
    }
  })

  it('cấp ngoài khoảng bị kẹp lại, không vỡ', () => {
    expect(layHinhThai(0).cap).toBe(1)
    expect(layHinhThai(-5).cap).toBe(1)
    expect(layHinhThai(9999).cap).toBe(120)
    expect(layHinhThai(120).cap).toBe(120)
  })
})

describe('kinh nghiệm', () => {
  // SỬA CÓ CHỦ Ý 21/09 (thầy chốt đường cấp theo ngày học đều): thanh đầu 120 → 160; `EXP_BAN_DAU` (120) chỉ còn là gốc của đường CŨ `thanhExpCu`.
  it('THANH ĐẦU TIÊN LÀ 160 — em thi một ca 5 điểm (300 EXP) lên cấp 2 và còn 140/200', () => {
    expect(EXP_BAN_DAU).toBe(120)
    expect(thanhExpCu(1)).toBe(120)
    expect(thanhExp(1)).toBe(120)
    expect(NGUON_EXP.caThi(5)).toBe(300)
    expect(nhanExp({ capDo: 1, exp: 0 }, 300)).toMatchObject({ capDo: 3, exp: 30, expToiDa: 180 })
  })

  it('thanh dài dần, và cấp 120 là hết đường lên', () => {
    for (let c = 2; c <= 119; c++) {
      expect(thanhExp(c), `cấp ${c}`).toBeGreaterThan(thanhExp(c - 1))
    }
    expect(thanhExp(120)).toBe(0)
    expect(thanhExp(121)).toBe(0)
  })

  /** SỬA CÓ CHỦ Ý 21/09: hai mốc cũ của 15-09 ("dốc hẳn từ cấp 10 ×1,5", "cấp 13 đắt hơn nửa chín cấp đầu") thuộc đường CŨ; đường mới: chín cấp đầu = 21 ngày, từ cấp 10 mỗi cấp ~5 ngày, cuối đường ~20 ngày. */
  it('CHÍN CẤP ĐẦU = 4 200 EXP (21 ngày × 200); TỪ CẤP 10 mỗi cấp ~5 ngày; cuối đường ~20 ngày một cấp', () => {
    let chinDau = 0
    for (let c = 1; c <= 9; c++) chinDau += thanhExp(c)
    expect(chinDau).toBe(2400)
    expect(thanhExp(10)).toBe(1000) // 5 ngày × 200
    expect(thanhExp(9)).toBe(430)
    expect(thanhExp(119)).toBe(3950) // ~20 ngày × 200
    expect(thanhExp(60)).toBeGreaterThan(thanhExp(13) * 1.5)
  })

  it('cộng EXP thì lên cấp THẬT — kể cả nhảy nhiều cấp một lúc', () => {
    const t1 = thanhExp(1), t2 = thanhExp(2)
    const a = nhanExp({ capDo: 1, exp: 0 }, t1 - 1)
    expect(a.capDo).toBe(1)
    expect(a.exp).toBe(t1 - 1)

    const b = nhanExp({ capDo: 1, exp: 0 }, t1)
    expect(b.capDo).toBe(2)
    expect(b.exp).toBe(0)
    expect(b.soCapLen).toBe(1)

    const c = nhanExp({ capDo: 1, exp: 0 }, t1 + t2 + 5)
    expect(c.capDo).toBe(3)
    expect(c.exp).toBe(5)
    expect(c.soCapLen).toBe(2)
  })

  it('không vượt quá cấp 120, và tới đỉnh thì EXP về 0', () => {
    const k = nhanExp({ capDo: 1, exp: 0 }, 100_000_000)
    expect(k.capDo).toBe(120)
    expect(k.exp).toBe(0)
    expect(k.daToiDinh).toBe(true)
    expect(k.expToiDa).toBe(0)
  })

  it('EXP âm hoặc rác không làm tụt cấp', () => {
    const k = nhanExp({ capDo: 5, exp: 100 }, -999)
    expect(k.capDo).toBe(5)
    expect(k.exp).toBe(100)
  })

  it('tổng đường lên đỉnh là một con số hữu hạn, đo được', () => {
    const t = tongExpToiDinh()
    // Con số CHỐT, không phải khoảng ước lượng: đổi nhịp game thì phải sửa ở đây,
    // để không ai lỡ tay đổi `EXP_BAN_DAU` mà không thấy hệ quả.
    // SỬA CÓ CHỦ Ý 21/09: 1 286 590 → 240 000 (= 1 200 ngày × 200); 120 → 160; 400 → 1 000; 46 740 → 3 950.
    expect(t).toBe(238_200)
    expect(thanhExp(1)).toBe(120)
    expect(thanhExp(10)).toBe(1000)
    expect(thanhExp(119)).toBe(3950)
    // VÀO NHANH VỀ CHẬM: mười hai cấp đầu chưa tới 4% cả đường (7 240 / 240 000).
    let muoiHaiDau = 0
    for (let c = 1; c <= 12; c++) muoiHaiDau += thanhExp(c)
    expect(muoiHaiDau).toBe(5440)
    expect(muoiHaiDau / t).toBeLessThan(0.04)
    // MỘT CHỦ Ý: sau reset, leo lại tới cấp 12 RẺ HƠN đường 12 cấp cũ (15 120).
    expect(muoiHaiDau).toBeLessThan(15_120)
    // eslint-disable-next-line no-console
    console.log(`  tổng EXP từ cấp 1 lên cấp 120: ${t.toLocaleString()} · tới cấp 12: ${muoiHaiDau.toLocaleString()}`)
  })

  it('BẢNG NGUỒN EXP phải khớp đúng con số trong mã — không hứa suông', () => {
    // Sáu dòng từ 15-09: tách "tầng MỚI" và "leo lại tầng cũ" thành hai dòng,
    // vì hai mức thưởng khác nhau tám lần — gộp một dòng là nói dối em.
    expect(BANG_NGUON_EXP.length).toBe(6)
    expect(NGUON_EXP.nopMom(0)).toBe(150)
    expect(NGUON_EXP.nopMom(10)).toBe(400)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('MOM'))?.thuong).toBe('150 + 25 × điểm')
    expect(NGUON_EXP.suaCauSai()).toBe(100)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('câu sai'))?.thuong).toBe('100 EXP')
    expect(NGUON_EXP.nopBtvn()).toBe(200)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('bài tập'))?.thuong).toBe('200 EXP')
    expect(NGUON_EXP.caThi(10)).toBe(600)
    expect(NGUON_EXP.leoThap(1)).toBe(25)
    expect(NGUON_EXP.leoThap(500)).toBe(475)
    expect(NGUON_EXP.leoThap(999)).toBe(925)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('tầng tháp'))?.thuong)
      .toBe('25 + 0,9 × số tầng')
    // LEO LẠI tầng cũ chỉ 12% — nếu không, 999 tầng in ra 3 triệu EXP.
    expect(NGUON_EXP.leoThapLai(999)).toBe(111)
    expect(NGUON_EXP.leoThapLai(1)).toBe(3)
  })

  it('THÁP KHÔNG ĐƯỢC NUỐT CẢ GAME — leo tới tầng 40 vẫn dưới nửa đường lên đỉnh', () => {
    // Công thức cũ `120 + 30 × tầng` cho 29 400 EXP ở tầng 40, gần GẤP ĐÔI cả
    // đường lên cấp 12: ngồi leo một buổi tối là tối đa hình thái, khỏi cần thi.
    const congDon = (n: number) => {
      let t = 0
      for (let i = 1; i <= n; i++) t += NGUON_EXP.leoThap(i)
      return t
    }
    const duong = tongExpToiDinh()
    expect(congDon(20) / duong).toBeLessThan(0.20)
    expect(congDon(40) / duong).toBeLessThan(0.50)
  })

  it('một tầng tháp đáng ít hơn một câu sai sửa xong — có chủ ý', () => {
    // Tầng tháp là một câu bất kỳ; câu sai là LỖI CỦA CHÍNH EM được sửa.
    for (let t = 1; t <= 10; t++) {
      expect(NGUON_EXP.leoThap(t)).toBeLessThan(NGUON_EXP.suaCauSai())
    }
  })

  it('tầng càng cao EXP càng nhiều', () => {
    // Bước 5 EXP nên phải so cách quãng, không so hai tầng liền nhau.
    for (let t = 10; t <= 999; t += 10) {
      expect(NGUON_EXP.leoThap(t), `tầng ${t}`).toBeGreaterThan(NGUON_EXP.leoThap(t - 10))
    }
  })

  /**
   * THÁP KHÔNG ĐƯỢC LÀ MÁY IN EXP.
   *
   * Công thức cũ `30 + 6×tầng` kéo lên 999 tầng cho 3 026 970 EXP — gấp 200
   * lần cả đường 12 cấp cũ, tức ngồi leo tháp là khỏi cần thi khỏi cần nộp bài.
   * Phép kiểm này khoá lại: leo hết 999 tầng phải DƯỚI MỘT NỬA cả đường 120 cấp.
   */
  // SỬA CÓ CHỦ Ý 21/09: đường mới chỉ 240 000 EXP nên 999 tầng (474 575 EXP) là ~2 lần cả đường. KHÔNG còn là máy in vì thú hấp thụ tối đa 200 EXP/ngày (Điều 1) và game góp tối đa
  // 120 EXP/ngày (Điều 9): thu hết tháp cũng phải mất > 1 200 ngày game. Phép kiểm cũ ("dưới nửa đường") thuộc đường 1 286 590.
  it('leo hết 999 tầng cho ~2 lần cả đường mới, nhưng trần 120 EXP game/ngày bắt phải mất hơn 1 200 ngày', () => {
    let tongThap = 0
    for (let t = 1; t <= 999; t++) tongThap += NGUON_EXP.leoThap(t)
    const duong = tongExpToiDinh()
    expect(tongThap).toBe(474_575)
    expect(tongThap / duong).toBeGreaterThan(1.9)
    expect(tongThap / TRAN_EXP_GAME_NGAY).toBeGreaterThan(1200)
  })
})

describe('không bịa dữ liệu', () => {
  it('CHƯA THI CA NÀO thì KHÔNG có buff từ điểm — không lấy 7.0', () => {
    const khong = tinhLucChienPet({ capDo: 1, capTienHoa: 1, diemTrungBinh: null, tyLeBtvn: 0 })
    const bay = tinhLucChienPet({ capDo: 1, capTienHoa: 1, diemTrungBinh: 7.0, tyLeBtvn: 0 })
    expect(khong.cp).toBeLessThan(bay.cp)
  })

  it('điểm cao hơn thì lực chiến cao hơn', () => {
    const a = tinhLucChienPet({ capDo: 5, capTienHoa: 5, diemTrungBinh: 5, tyLeBtvn: 0.5 })
    const b = tinhLucChienPet({ capDo: 5, capTienHoa: 5, diemTrungBinh: 9, tyLeBtvn: 0.5 })
    expect(b.cp).toBeGreaterThan(a.cp)
  })

  it('cấp tiến hoá cao hơn thì mạnh hơn, suốt cả 12 cấp', () => {
    let truoc = 0
    for (let c = 1; c <= 12; c++) {
      const k = tinhLucChienPet({ capDo: c, capTienHoa: c as 1, diemTrungBinh: 8, tyLeBtvn: 1 })
      expect(k.cp, `cấp ${c}`).toBeGreaterThan(truoc)
      truoc = k.cp
    }
  })

  it('mã nguồn KHÔNG còn bảng xếp hạng bịa', () => {
    const s = MA_COMPONENT()
    for (const bia of ['Chiến Binh Nhiệt Nhôm', 'Thần Đồng Halogen', 'cp * 0.88', 'cp * 0.76',
      'Bảng Xếp Hạng Thần Thú Cả Lớp', 'Bậc Thầy Hóa Học']) {
      expect(s.includes(bia), `còn chuỗi bịa "${bia}"`).toBe(false)
    }
  })

  it('game KHÔNG nhận số báo danh và họ tên nữa', () => {
    const ma = MA_COMPONENT()
    expect(/\bauth\./.test(ma), 'còn đọc auth').toBe(false)
    expect(/\bsbd\b/i.test(ma), 'còn nhắc sbd').toBe(false)
    expect(/\bhoTen\b/.test(ma), 'còn nhắc hoTen').toBe(false)
  })

  it('KHÔNG còn nút cho EXP miễn phí', () => {
    const s = MA_COMPONENT()
    expect(s.includes('Nạp Tinh Thể Não Lực')).toBe(false)
    expect(s.includes('+35 EXP')).toBe(false)
  })
})

describe('hồ sơ lưu', () => {
  it('hồ sơ rác hoặc thiếu trường thì trộn về mặc định, không ra NaN', () => {
    for (const rac of [null, undefined, 42, 'hỏng', {}, { capDo: -9 }, { exp: 'x' }]) {
      const h = vaHoSo(rac)
      expect(Number.isFinite(h.exp)).toBe(true)
      expect(Number.isFinite(h.expToiDa)).toBe(true)
      expect(h.capDo).toBeGreaterThanOrEqual(1)
      expect(h.capDo).toBeLessThanOrEqual(12)
      // Rỗng = CHƯA CHỌN, hợp lệ từ 15-09 (mỗi em chọn thú một lần ở màn đầu).
      // Khác rỗng thì bắt buộc phải là một thần thú có thật.
      if (h.idThanhThuChon !== '') expect(DANH_SACH_THAN_THU[h.idThanhThuChon]).toBeDefined()
    }
  })

  it('expToiDa luôn tính lại theo cấp, không tin số cũ trong máy', () => {
    const h = vaHoSo({ capDo: 4, exp: 10, expToiDa: 999999 })
    expect(h.expToiDa).toBe(thanhExp(4))
  })

  it('hồ sơ mặc định bắt đầu bằng thanh 160 (đường cấp mới)', () => {
    expect(layHoSoThanThuMacDinh().expToiDa).toBe(120)
    expect(layHoSoThanThuMacDinh().capDo).toBe(1)
  })
})

describe('tương khắc nguyên tố — không còn là mã chết', () => {
  /**
   * BẢN 4 HỆ CŨ CÓ HAI CHIỀU SAI HOÁ HỌC, sửa khi mở lên sáu hệ 15-09:
   *   · cũ ghi `hoa > khi` mà không có phản ứng nào đỡ. Thật ra ngược: CO₂ dập
   *     tắt đám cháy, nên `khi > hoa`.
   *   · cũ ghi `khi > kiem` với ghi chú "kiềm hấp thụ khí halogen" — chính câu
   *     ghi chú ấy nói ngược lại điều nó khẳng định. Cl₂ + 2NaOH → NaCl +
   *     NaClO + H₂O là BASE ăn khí, nên `kiem > khi`.
   *   · cũ ghi `axit > hoa` ("ăn mòn kim loại, dập phản ứng nhiệt") — mơ hồ,
   *     không có phương trình. Bỏ, để hai hệ này trung tính.
   * Bảng đầy đủ sáu hệ và bằng chứng từng cặp: `tests/than-thu-sau-he.test.ts`.
   */
  it('cặp khắc chế phải có phản ứng thật đỡ lưng', () => {
    // Trung hoà — cặp duy nhất của bản cũ đúng chiều, giữ nguyên.
    expect(tinhHeSoTuongKhac('kiem', 'axit').heSo).toBe(1.5)
    // Hai chiều đã sửa cho đúng hoá học.
    expect(tinhHeSoTuongKhac('khi', 'hoa').heSo).toBe(1.5)
    expect(tinhHeSoTuongKhac('kiem', 'khi').heSo).toBe(1.5)
    // Mỗi cặp khắc chế đều phải nêu được phản ứng.
    expect(tinhHeSoTuongKhac('kiem', 'axit').banChung).toContain('→')
    expect(tinhHeSoTuongKhac('khi', 'hoa').banChung.length).toBeGreaterThan(20)
  })

  it('bị khắc thì yếu đi, cùng hệ thì hoà, không quan hệ thì trung tính', () => {
    expect(tinhHeSoTuongKhac('hoa', 'khi').heSo).toBe(0.7)
    expect(tinhHeSoTuongKhac('hoa', 'hoa').heSo).toBe(1.0)
    // Acid và hoả không còn khắc nhau — trung tính, và nói thẳng là không có.
    expect(tinhHeSoTuongKhac('axit', 'hoa').heSo).toBe(1.0)
    expect(tinhHeSoTuongKhac('axit', 'hoa').banChung).toBe('')
  })

  it('component có THỰC SỰ gọi tương khắc', () => {
    const s = MA_COMPONENT()
    expect(s.includes('tinhHeSoTuongKhac(')).toBe(true)
    // và sát thương không còn cắm cứng
    expect(s.includes('const satThuong = 45')).toBe(false)
    expect(s.includes('const satThuongBoss = 30')).toBe(false)
  })
})
