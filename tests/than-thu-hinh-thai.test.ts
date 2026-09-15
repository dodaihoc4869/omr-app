/**
 * CỔNG THẦN THÚ HOÁ HỌC.
 *
 * Phép kiểm quan trọng nhất: **cấp sau NGẦU HƠN cấp trước**. "Ngầu" được dịch
 * thành hai con số đo được — số tính năng bật, và số điểm ảnh thực sự vẽ ra —
 * nên không ai lỡ tay làm cấp sau nghèo hơn cấp trước mà không bị bắt.
 */
import { describe, it, expect } from 'vitest'
import {
  MUOI_HAI_HINH_THAI, CAP_TOI_DA, layHinhThai, demTinhNang,
} from '../src/game/than-thu-hoa-hoc/hinh-thai'
import {
  EXP_BAN_DAU, thanhExp, nhanExp, tongExpToiDinh, NGUON_EXP, BANG_NGUON_EXP,
} from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
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
  it('đúng 12 cấp, tên không trùng', () => {
    expect(MUOI_HAI_HINH_THAI.length).toBe(12)
    expect(CAP_TOI_DA).toBe(12)
    expect(new Set(MUOI_HAI_HINH_THAI.map((h) => h.ten)).size).toBe(12)
  })

  it('NGẦU DẦN — số tính năng tăng nghiêm ngặt từ cấp 2 lên 12', () => {
    for (let c = 3; c <= 12; c++) {
      const truoc = demTinhNang(layHinhThai(c - 1))
      const nay = demTinhNang(layHinhThai(c))
      expect(nay, `cấp ${c} phải nhiều tính năng hơn cấp ${c - 1}`).toBeGreaterThan(truoc)
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
    expect(layHinhThai(99).cap).toBe(12)
  })
})

describe('kinh nghiệm', () => {
  it('THANH ĐẦU TIÊN LÀ 300 — tính theo nhịp kiếm EXP thật', () => {
    expect(EXP_BAN_DAU).toBe(300)
    expect(thanhExp(1)).toBe(300)
    // 300 = đúng một ca thi 5 điểm. Em học xong buổi đầu là thấy thanh nhảy.
    expect(NGUON_EXP.caThi(5)).toBe(300)
  })

  it('thanh dài dần, và cấp 12 là hết đường lên', () => {
    for (let c = 2; c <= 11; c++) {
      expect(thanhExp(c)).toBeGreaterThan(thanhExp(c - 1))
    }
    expect(thanhExp(12)).toBe(0)
    expect(thanhExp(13)).toBe(0)
  })

  it('cộng EXP thì lên cấp THẬT — kể cả nhảy nhiều cấp một lúc', () => {
    const a = nhanExp({ capDo: 1, exp: 0 }, 299)
    expect(a.capDo).toBe(1)
    expect(a.exp).toBe(299)

    const b = nhanExp({ capDo: 1, exp: 0 }, 300)
    expect(b.capDo).toBe(2)
    expect(b.exp).toBe(0)
    expect(b.soCapLen).toBe(1)

    // 300 (thanh cấp 1) + 380 (thanh cấp 2) + 5 dư
    const c = nhanExp({ capDo: 1, exp: 0 }, 300 + 380 + 5)
    expect(c.capDo).toBe(3)
    expect(c.exp).toBe(5)
    expect(c.soCapLen).toBe(2)
  })

  it('không vượt quá cấp 12, và tới đỉnh thì EXP về 0', () => {
    const k = nhanExp({ capDo: 1, exp: 0 }, 10_000_000)
    expect(k.capDo).toBe(12)
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
    expect(t).toBe(15_120)
    expect(thanhExp(1)).toBe(300)
    expect(thanhExp(11)).toBe(3_540)
    // VÀO NHANH VỀ CHẬM: năm cấp đầu ≤ 20% cả đường, ba cấp cuối ≥ 50%.
    const namCapDau = thanhExp(1) + thanhExp(2) + thanhExp(3) + thanhExp(4) + thanhExp(5)
    const baCapCuoi = thanhExp(9) + thanhExp(10) + thanhExp(11)
    expect(namCapDau / t).toBeLessThan(0.20)
    expect(baCapCuoi / t).toBeGreaterThan(0.50)
    // eslint-disable-next-line no-console
    console.log(`  tổng EXP từ cấp 1 lên cấp 12: ${t.toLocaleString()}`)
  })

  it('BẢNG NGUỒN EXP phải khớp đúng con số trong mã — không hứa suông', () => {
    expect(BANG_NGUON_EXP.length).toBe(4)
    expect(NGUON_EXP.suaCauSai()).toBe(100)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('câu sai'))?.thuong).toBe('100 EXP')
    expect(NGUON_EXP.nopBtvn()).toBe(200)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('bài tập'))?.thuong).toBe('200 EXP')
    expect(NGUON_EXP.caThi(10)).toBe(600)
    expect(NGUON_EXP.leoThap(1)).toBe(36)
    expect(NGUON_EXP.leoThap(10)).toBe(90)
    expect(BANG_NGUON_EXP.find((n) => n.viec.includes('tầng tháp'))?.thuong)
      .toBe('30 + 6 × số tầng')
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
    for (let t = 2; t <= 20; t++) {
      expect(NGUON_EXP.leoThap(t)).toBeGreaterThan(NGUON_EXP.leoThap(t - 1))
    }
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

  it('hồ sơ mặc định bắt đầu bằng thanh 300', () => {
    expect(layHoSoThanThuMacDinh().expToiDa).toBe(300)
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
