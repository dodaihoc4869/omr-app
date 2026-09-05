// @vitest-environment node
//
// ĐỊNH NGHĨA HOÀN THÀNH của MATKHAUMOAPP.md mục 8, mười một phép kiểm tự động.
//
// Chạy ở môi trường `node` chứ không `jsdom`: jsdom có `crypto.getRandomValues`
// nhưng KHÔNG có `crypto.subtle`, mà cả tính năng này dựng trên Web Crypto.
// Node 20+ có đủ, và đó cũng chính là bộ API trình duyệt sẽ chạy.
//
// Phép kiểm số 3 là quan trọng nhất: bản ghi cất đi không được chứa mã bí mật
// lẫn mật khẩu ở bất kỳ trường nào.
//
// TIMEOUT RỘNG cho mọi phép kiểm chạm tới mã hoá: 210.000 vòng PBKDF2 mất vài
// trăm mili giây trên máy thầy, nhưng máy chạy CI chậm hơn hẳn và một `it` gọi
// tới năm lần dẫn xuất khoá thì vượt mốc 5 giây mặc định. Đây KHÔNG phải nới
// test — số vòng thật vẫn nguyên, chỉ cho nó đủ thời gian chạy.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Đủ rộng cho máy chạy CI chậm nhất. */
const HAN = 60_000
import {
  CHO_BAN_DAU_GIAY,
  CHO_TOI_DA_GIAY,
  DAI_IV,
  DAI_MUOI,
  HOI_LAI_MAC_DINH,
  SAI_TRUOC_KHI_CHO,
  SO_VONG_PBKDF2,
  TOI_THIEU_KY_TU,
  conChoGiay,
  datMatKhau,
  doiMatKhau,
  giayChoCua,
  hopLeMatKhau,
  moKhoa,
  phaiHoiLai,
  sauKhiDung,
  sauKhiSai,
} from '../src/lib/khoa-app'
import { laManThayQuanLy } from '../src/lib/vai-tro'

const MA_BI_MAT = 'DbfBrY8sgaESWqih4upyEzU8'
const MK = 'thayhoa2026'

describe('1 + 2. mã hoá và giải mã', () => {
  it('1. đặt rồi mở bằng đúng mật khẩu → ra ĐÚNG mã bí mật ban đầu', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    expect(await moKhoa(MK, b)).toBe(MA_BI_MAT)
   }, HAN)

  it('2. mật khẩu sai → null, KHÔNG ném lỗi lộ thông tin', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    await expect(moKhoa('sai-mat-khau', b)).resolves.toBeNull()
    // Dữ liệu hỏng cũng trả về ĐÚNG null ấy — phân biệt được là cho kẻ dò biết
    // nó đang đi đúng hướng.
    await expect(moKhoa(MK, { ...b, maHoa: b.maHoa.slice(0, -4) + 'AAAA' })).resolves.toBeNull()
    await expect(moKhoa(MK, { ...b, muoi: 'khong-phai-base64!!' })).resolves.toBeNull()
   }, HAN)

  it('mã bí mật có dấu tiếng Việt và ký tự lạ vẫn ra nguyên vẹn', async () => {
    const ma = 'Mã-bí-mật · Đỗ Đại Học · 100%'
    const b = await datMatKhau(MK, ma)
    expect(await moKhoa(MK, b)).toBe(ma)
   }, HAN)
})

describe('3. BẢN GHI KHÔNG CHỨA MÃ BÍ MẬT LẪN MẬT KHẨU — phép kiểm quan trọng nhất', () => {
  it('quét thẳng chuỗi JSON của bản ghi', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    const s = JSON.stringify(b)
    expect(s).not.toContain(MA_BI_MAT)
    expect(s).not.toContain(MK)
    // cũng không có dạng băm để "kiểm tra nhanh" — mục 9 cấm
    expect(Object.keys(b).sort()).toEqual(['hoiLai', 'iv', 'maHoa', 'mocMoLai', 'muoi', 'soLanSai', 'soVong'])
   }, HAN)

  it('mã bí mật không lọt ra kể cả dưới dạng base64', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    const s = JSON.stringify(b)
    expect(s).not.toContain(Buffer.from(MA_BI_MAT, 'utf8').toString('base64'))
   }, HAN)
})

describe('4. muối ngẫu nhiên', () => {
  it('hai lần đặt cùng một mật khẩu → muối và bản mã KHÁC nhau', async () => {
    const a = await datMatKhau(MK, MA_BI_MAT)
    const b = await datMatKhau(MK, MA_BI_MAT)
    expect(a.muoi).not.toBe(b.muoi)
    expect(a.iv).not.toBe(b.iv)
    expect(a.maHoa).not.toBe(b.maHoa)
    // nhưng cả hai vẫn mở ra đúng một thứ
    expect(await moKhoa(MK, a)).toBe(MA_BI_MAT)
    expect(await moKhoa(MK, b)).toBe(MA_BI_MAT)
   }, HAN)

  it('muối 16 byte, IV 12 byte, đúng số vòng đã chốt', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    expect(Buffer.from(b.muoi, 'base64')).toHaveLength(DAI_MUOI)
    expect(Buffer.from(b.iv, 'base64')).toHaveLength(DAI_IV)
    expect(b.soVong).toBe(SO_VONG_PBKDF2)
    expect(SO_VONG_PBKDF2).toBe(210000)
   }, HAN)
})

describe('5. đổi mật khẩu', () => {
  it('mở bằng mật khẩu mới ra đúng mã cũ; mật khẩu cũ HẾT mở được', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    const b2 = await doiMatKhau(MK, 'matkhaumoi', b)
    expect(b2).not.toBeNull()
    expect(await moKhoa('matkhaumoi', b2!)).toBe(MA_BI_MAT)
    expect(await moKhoa(MK, b2!)).toBeNull()
   }, HAN)

  it('mật khẩu cũ sai → null, không đổi gì', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT)
    expect(await doiMatKhau('sai', 'matkhaumoi', b)).toBeNull()
    expect(await moKhoa(MK, b)).toBe(MA_BI_MAT)
   }, HAN)

  it('giữ nguyên nấc hỏi lại khi đổi mật khẩu', async () => {
    const b = await datMatKhau(MK, MA_BI_MAT, 'sau_15_phut')
    const b2 = await doiMatKhau(MK, 'matkhaumoi', b)
    expect(b2!.hoiLai).toBe('sau_15_phut')
   }, HAN)
})

describe('6 + 7. chống dò', () => {
  const goc = { muoi: 'x', soVong: 1, iv: 'y', maHoa: 'z', soLanSai: 0, mocMoLai: 0, hoiLai: HOI_LAI_MAC_DINH } as const

  it('6. sai đủ 5 lần → đặt mốc chờ; trong lúc chờ thì chưa thử tiếp được', () => {
    let b = { ...goc }
    const T = 1_000_000
    for (let i = 0; i < SAI_TRUOC_KHI_CHO - 1; i++) {
      b = sauKhiSai(b, T)
      expect(conChoGiay(b, T)).toBe(0) // chưa tới ngưỡng thì chưa chờ
    }
    b = sauKhiSai(b, T)
    expect(b.soLanSai).toBe(SAI_TRUOC_KHI_CHO)
    expect(conChoGiay(b, T)).toBe(CHO_BAN_DAU_GIAY)
    // hết giờ chờ thì thử lại được
    expect(conChoGiay(b, T + CHO_BAN_DAU_GIAY * 1000)).toBe(0)
  })

  it('7. chờ nhân đôi mỗi 5 lần sai, KHÔNG vượt trần 30 phút', () => {
    expect(giayChoCua(0)).toBe(0)
    expect(giayChoCua(4)).toBe(0)
    expect(giayChoCua(5)).toBe(60)
    expect(giayChoCua(10)).toBe(120)
    expect(giayChoCua(15)).toBe(240)
    expect(giayChoCua(20)).toBe(480)
    expect(giayChoCua(25)).toBe(960)
    expect(giayChoCua(30)).toBe(CHO_TOI_DA_GIAY)
    expect(giayChoCua(500)).toBe(CHO_TOI_DA_GIAY)
    expect(CHO_TOI_DA_GIAY).toBe(1800)
  })

  it('mở được thì xoá sạch dấu vết dò', () => {
    const b = sauKhiDung({ ...goc, soLanSai: 7, mocMoLai: 9_999_999 })
    expect(b.soLanSai).toBe(0)
    expect(b.mocMoLai).toBe(0)
    expect(conChoGiay(b, 0)).toBe(0)
  })

  it('mốc chờ nằm TRONG bản ghi nên tải lại trang không xoá được', () => {
    // Bản ghi là thứ được cất xuống IndexedDB; số lần sai và mốc chờ là hai
    // trường của chính nó, không phải biến trong bộ nhớ.
    const b = sauKhiSai({ ...goc, soLanSai: 4 }, 1000)
    expect(Object.keys(b)).toContain('soLanSai')
    expect(Object.keys(b)).toContain('mocMoLai')
  })
})

describe('8. mật khẩu tối thiểu 6 ký tự', () => {
  it('dưới 6 ký tự bị từ chối ngay', async () => {
    expect(TOI_THIEU_KY_TU).toBe(6)
    expect(hopLeMatKhau('12345')).toBe(false)
    expect(hopLeMatKhau('123456')).toBe(true)
    await expect(datMatKhau('12345', MA_BI_MAT)).rejects.toThrow()
   }, HAN)

  it('KHÔNG ép chữ hoa, chữ số, ký tự đặc biệt', () => {
    // Ép phức tạp trên điện thoại chỉ dẫn tới việc thầy viết mật khẩu ra giấy
    // dán cạnh máy — đó mới là lỗ hổng thật.
    expect(hopLeMatKhau('aaaaaa')).toBe(true)
    expect(hopLeMatKhau('      ')).toBe(true)
  })
})

describe('9. VAI KHÔNG PHẢI GIÁO VIÊN THÌ KHÔNG BAO GIỜ HỎI MẬT KHẨU', () => {
  // Sai chỗ này là cả ca thi đứng hình. Kiểm ĐỦ từng đường.
  it('vào thi — cả đường ngắn lẫn tham số truy vấn', () => {
    expect(laManThayQuanLy('', '/omr-app/t/123456')).toBe(false)
    expect(laManThayQuanLy('?examCode=123456', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('?examCode=123456', '/omr-app/t/123456')).toBe(false)
  })

  it('báo cáo phụ huynh', () => {
    expect(laManThayQuanLy('', '/omr-app/p')).toBe(false)
    expect(laManThayQuanLy('?vai=phieu', '/omr-app/')).toBe(false)
  })

  it('link riêng cũ của em và phụ huynh', () => {
    expect(laManThayQuanLy('', '/omr-app/hs/abcd1234efgh')).toBe(false)
    expect(laManThayQuanLy('', '/omr-app/ph/abcd1234efgh')).toBe(false)
    expect(laManThayQuanLy('?vai=hs', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('?vai=ph', '/omr-app/')).toBe(false)
  })

  it('CHỈ app quản lý của thầy mới hỏi', () => {
    expect(laManThayQuanLy('', '/omr-app/')).toBe(true)
    expect(laManThayQuanLy('', '/omr-app/gv')).toBe(true)
    expect(laManThayQuanLy('?vai=gv', '/omr-app/')).toBe(true)
  })
})

describe('10 + 11. cất giữ và gỡ', () => {
  const db = readFileSync(resolve(process.cwd(), 'src/lib/exam-db.ts'), 'utf8')

  it('10. đặt mật khẩu xong thì XOÁ khoá teacherSecret', () => {
    expect(db).toContain("await db.delete(STORE_SETTINGS, 'teacherSecret')")
    // cất bản ghi TRƯỚC rồi mới xoá — xoá trước mà cất hỏng là thầy mất chìa
    const i = db.indexOf('export async function batKhoaApp')
    const khoi = db.slice(i, db.indexOf('\n}\n', i))
    expect(khoi.indexOf("db.put(STORE_SETTINGS, b, 'khoaApp')")).toBeLessThan(khoi.indexOf("db.delete(STORE_SETTINGS, 'teacherSecret')"))
  })

  it('11. gỡ mật khẩu → teacherSecret quay lại, khoaApp bị xoá', () => {
    const i = db.indexOf('export async function goKhoaApp')
    const khoi = db.slice(i, db.indexOf('\n}\n', i))
    expect(khoi).toContain("db.put(STORE_SETTINGS, maBiMat, 'teacherSecret')")
    expect(khoi).toContain("db.delete(STORE_SETTINGS, 'khoaApp')")
  })

  it('mã bí mật giải ra KHÔNG ghi xuống đĩa — không localStorage, không sessionStorage', () => {
    const lib = readFileSync(resolve(process.cwd(), 'src/lib/khoa-app.ts'), 'utf8')
    const man = readFileSync(resolve(process.cwd(), 'src/screens/KhoaAppScreen.tsx'), 'utf8')
    for (const [ten, ma] of [
      ['khoa-app.ts', lib],
      ['KhoaAppScreen.tsx', man],
    ] as const) {
      expect(ma, ten).not.toContain('localStorage')
      expect(ma, ten).not.toContain('sessionStorage')
      // mật khẩu không rời khỏi máy thầy
      expect(ma, ten).not.toContain('fetch(')
    }
    // và nó sống trong một biến của module, không phải trong IndexedDB
    expect(db).toContain('let maBiMatPhien: string | null = null')
  })
})

describe('không có cửa sau', () => {
  it('repo là public — không mật khẩu mặc định, không mã khôi phục dựng sẵn', () => {
    const lib = readFileSync(resolve(process.cwd(), 'src/lib/khoa-app.ts'), 'utf8')
    const man = readFileSync(resolve(process.cwd(), 'src/screens/KhoaAppScreen.tsx'), 'utf8')
    for (const ma of [lib, man]) {
      expect(ma).not.toMatch(/MAT_KHAU_MAC_DINH|matKhauMacDinh|MA_KHOI_PHUC|backdoor/i)
    }
    // đường lùi duy nhất là nhập lại MÃ BÍ MẬT
    expect(man).toContain('Đặt lại bằng mã bí mật')
  })

  it('màn khoá không có trường gợi ý mật khẩu nào để mà hiện', () => {
    const man = readFileSync(resolve(process.cwd(), 'src/screens/KhoaAppScreen.tsx'), 'utf8')
    // Bỏ ghi chú rồi mới soi: bản thân ghi chú có nhắc "KHÔNG hiện gợi ý".
    const ma = man.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(ma).not.toMatch(/goiY|hint|nhacNho/i)
    // Không đọc hồ sơ thầy: màn này người lạ cầm máy cũng nhìn thấy.
    expect(ma).not.toContain('hoTen')
    expect(ma).not.toContain('classlist-db')
  })
})

describe('nấc hỏi lại', () => {
  it('mặc định MỖI LẦN MỞ — chuyển app khác rồi quay lại thì không hỏi', () => {
    expect(HOI_LAI_MAC_DINH).toBe('moi_lan_mo')
    expect(phaiHoiLai('moi_lan_mo', 0)).toBe(false)
    expect(phaiHoiLai('moi_lan_mo', 99 * 60000)).toBe(false)
  })

  it('hai nấc kia hỏi lại đúng mốc', () => {
    expect(phaiHoiLai('sau_15_phut', 14 * 60000)).toBe(false)
    expect(phaiHoiLai('sau_15_phut', 15 * 60000)).toBe(true)
    expect(phaiHoiLai('sau_60_phut', 59 * 60000)).toBe(false)
    expect(phaiHoiLai('sau_60_phut', 60 * 60000)).toBe(true)
  })
})

describe('app tự tải bản mới thì KHÔNG hỏi lại (mục 4C)', () => {
  it('đang mở khoá là một chốt chặn tải lại, ngang với đang làm bài', () => {
    const ma = readFileSync(resolve(process.cwd(), 'src/lib/cap-nhat-app.ts'), 'utf8')
    expect(ma).toContain('export function datDangMoKhoa')
    expect(ma).toContain('if (dangMoKhoaKhong()) return')
    const i = ma.indexOf('if (dangLamBaiKhong()) return')
    const j = ma.indexOf('if (dangMoKhoaKhong()) return')
    expect(j).toBeGreaterThan(i) // cùng một chỗ, ngay cạnh nhau
  })
})
