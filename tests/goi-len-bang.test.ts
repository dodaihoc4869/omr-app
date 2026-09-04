// GỌI LÊN BẢNG — khoá đúng những chỗ sai là thầy chỉ phát hiện lúc đứng lớp.
import { describe, expect, it } from 'vitest'
import { chuanChuyenDe, chuyenDeYeuNhat, phanCongCauHoi, bangPhanCongChu, type CauCoTheGoi, type EmDeGoi } from '../src/lib/goi-len-bang'

const cau = (id: string, phan: 'I' | 'II' | 'III', so: number, chuyenDe: string, mucDo?: 'biet' | 'hieu' | 'van_dung'): CauCoTheGoi => ({
  id,
  phan,
  so,
  chuyenDe,
  mucDo,
  tomTat: `câu ${so}`,
  viTri: so - 1,
})

const KHO: CauCoTheGoi[] = [
  cau('a1', 'I', 1, 'Ester – lipid', 'biet'),
  cau('a2', 'I', 2, 'Ester – lipid', 'van_dung'),
  cau('a3', 'I', 3, 'Ester – lipid', 'hieu'),
  cau('b1', 'I', 4, 'Carbohydrate', 'hieu'),
  cau('c1', 'III', 5, 'Polymer', 'van_dung'),
]

const em = (sbd: string, hoTen: string, cd: EmDeGoi['chuyenDeCaGanNhat']): EmDeGoi => ({ sbd, hoTen, chuyenDeCaGanNhat: cd })

describe('Chuyên đề yếu nhất', () => {
  it('lấy chuyên đề sai NHIỀU CÂU nhất', () => {
    const e = em('1', 'A', [
      { ten: 'Ester – lipid', soCau: 10, soSai: 4 },
      { ten: 'Carbohydrate', soCau: 4, soSai: 2 },
    ])
    expect(chuyenDeYeuNhat(e)?.ten).toBe('Ester – lipid')
  })

  it('bằng số câu sai thì lấy chuyên đề có tỉ lệ sai cao hơn', () => {
    const e = em('1', 'A', [
      { ten: 'Ester – lipid', soCau: 10, soSai: 3 },
      { ten: 'Carbohydrate', soCau: 4, soSai: 3 },
    ])
    expect(chuyenDeYeuNhat(e)?.ten).toBe('Carbohydrate')
  })

  it('chuyên đề không sai câu nào thì bỏ qua — chữa chỗ em làm đúng là phí giờ', () => {
    const e = em('1', 'A', [{ ten: 'Ester – lipid', soCau: 10, soSai: 0 }])
    expect(chuyenDeYeuNhat(e)).toBeNull()
  })

  it('chưa thi ca nào thì trả null, KHÔNG đoán', () => {
    expect(chuyenDeYeuNhat(em('1', 'A', []))).toBeNull()
  })
})

describe('So tên chuyên đề', () => {
  it('gạch en và gạch thường là một', () => {
    expect(chuanChuyenDe('Ester – lipid')).toBe(chuanChuyenDe('Ester - lipid'))
  })
  it('bỏ dấu và không phân biệt hoa thường', () => {
    expect(chuanChuyenDe('ĐẠI CƯƠNG kim loại')).toBe(chuanChuyenDe('Đại cương Kim Loại'))
  })
})

describe('Phân công câu lên bảng', () => {
  it('mỗi em nhận câu ĐÚNG chuyên đề mình yếu', () => {
    const ds = [
      em('1', 'An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
      em('2', 'Bình', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
    ]
    const kq = phanCongCauHoi(ds, KHO)
    expect(kq[0].cau?.chuyenDe).toBe('Ester – lipid')
    expect(kq[1].cau?.chuyenDe).toBe('Carbohydrate')
    expect(kq.every((p) => p.lyDo === 'dung_chuyen_de_yeu')).toBe(true)
  })

  it('KHÔNG hai em cùng một câu', () => {
    const ds = ['An', 'Bình', 'Chi'].map((t, i) => em(String(i + 1), t, [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]))
    const kq = phanCongCauHoi(ds, KHO)
    const ids = kq.map((p) => p.cau?.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('ưu tiên câu KHÓ hơn lên bảng', () => {
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }])], KHO)
    expect(kq[0].cau?.mucDo).toBe('van_dung')
  })

  // Đây là chỗ dễ hỏng nhất: em yếu chuyên đề hiếm câu mà bị xếp sau thì mất
  // câu cuối cùng vào tay em có cả chục câu để chọn.
  it('em yếu chuyên đề hiếm câu được ưu tiên, dù tích sau', () => {
    const ds = [
      em('1', 'Nhiều lựa chọn', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
      em('2', 'Ít lựa chọn', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
    ]
    // chỉ còn ĐÚNG MỘT câu Carbohydrate trong đề
    const kq = phanCongCauHoi(ds, KHO)
    expect(kq[1].cau?.chuyenDe).toBe('Carbohydrate')
    expect(kq[1].lyDo).toBe('dung_chuyen_de_yeu')
  })

  it('đề không có chuyên đề đó thì NÓI THẲNG, không im lặng đưa câu lạc đề', () => {
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Pin điện và điện phân', soCau: 5, soSai: 3 }])], KHO)
    expect(kq[0].lyDo).toBe('de_khong_co_chuyen_de_nay')
    expect(kq[0].ghiChu).toContain('Pin điện và điện phân')
    expect(kq[0].cau).not.toBeNull()
  })

  it('em chưa có dữ liệu thì ghi rõ, không đoán chuyên đề', () => {
    const kq = phanCongCauHoi([em('9', 'Mới', [])], KHO)
    expect(kq[0].lyDo).toBe('chua_co_du_lieu')
    expect(kq[0].chuyenDeYeu).toBeNull()
    expect(kq[0].cau).toBeNull()
  })

  it('giữ ĐÚNG thứ tự thầy tích, không phải thứ tự nội bộ của thuật toán', () => {
    const ds = [
      em('1', 'An', [{ ten: 'Carbohydrate', soCau: 6, soSai: 3 }]),
      em('2', 'Bình', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]),
    ]
    expect(phanCongCauHoi(ds, KHO).map((p) => p.sbd)).toEqual(['1', '2'])
  })

  it('nhiều em hơn số câu thì em cuối không có câu, chứ không trùng câu', () => {
    const ds = Array.from({ length: 7 }, (_, i) => em(String(i), `Em ${i}`, [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }]))
    const kq = phanCongCauHoi(ds, KHO)
    const co = kq.filter((p) => p.cau)
    expect(co.length).toBe(KHO.length)
    expect(new Set(co.map((p) => p.cau!.id)).size).toBe(KHO.length)
  })
})

describe('Bảng chữ để copy', () => {
  it('có tên em, phần và số câu, chuyên đề kèm số câu sai', () => {
    const kq = phanCongCauHoi([em('1', 'Nguyễn An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }])], KHO)
    const t = bangPhanCongChu(kq, '12-C1-B1')
    expect(t).toContain('12-C1-B1')
    expect(t).toContain('Nguyễn An')
    expect(t).toContain('Phần I câu 2')
    expect(t).toContain('sai 4/10')
  })
})

describe('Màn Gọi lên bảng', () => {
  it('có lọc khối, tìm theo tên, và chạm em ra câu kèm lời giải', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('Khối ${k}')
    expect(ma).toContain('khoiTuNamSinh(e.namSinh) !== khoiLoc')
    expect(ma).toContain('Tìm theo tên hoặc số báo danh')
    // câu hiện bằng ĐÚNG thẻ của màn xem lại, không vẽ kiểu hiển thị thứ hai
    expect(ma).toContain('cheDo="xem_lai"')
    expect(ma).toContain('loiGiai={day.q.loiGiai}')
  })

  it('bảng phân công có tích xoá và xoá hàng loạt', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('Xoá {tichXoa.size} em đã tích')
    expect(ma).toContain('xoaKhoiBang(tichXoa)')
    expect(ma).toContain('xoaKhoiBang(new Set([p.sbd]))')
    // Xoá KHÔNG được phân công lại: thầy đã đọc bảng, câu nhảy sang em khác là gọi nhầm.
    expect(ma).toContain('ketQua.filter((p) => !sbds.has(p.sbd))')
    expect(ma).not.toContain('phanCongCauHoi(con')
  })
})

describe('Chấm câu trên bảng', () => {
  it('có nút Đạt / Không đạt, ghi vào log mạnh–yếu rồi bỏ em khỏi bảng', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('chamLenBang(p, true)')
    expect(ma).toContain('chamLenBang(p, false)')
    expect(ma).toContain('ghiLenBang(cauHinh.url, cauHinh.mat')
    // bỏ khỏi bảng CHỈ SAU khi máy chủ nhận — mất dòng mà chưa ghi là thầy tưởng xong rồi
    const i = ma.indexOf('await ghiLenBang')
    const j = ma.indexOf('filter((x) => x.sbd !== p.sbd)')
    expect(i).toBeGreaterThan(0)
    expect(j).toBeGreaterThan(i)
  })

  it('câu không có chuyên đề thì không ghi bừa vào log', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('chưa ghi được vào log mạnh–yếu')
  })
})

describe('Máy chủ ghi câu lên bảng', () => {
  it('KHÔNG tạo lượt thi giả và không thành "ca gần nhất"', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("if (action === 'ghiLenBang')")
    expect(gs).toContain("'LENBANG-'")
    // chỉ ghi tiến độ chuyên đề, không đụng LuotThi
    const i = gs.indexOf("if (action === 'ghiLenBang')")
    const khoi = gs.slice(i, i + 1400)
    expect(khoi).toContain('ghiTienDo_(maCaLB, tomTat)')
    expect(khoi).not.toContain('sheetLuot_')
    expect(khoi).toContain('kiemTraMaBiMat_(body)')
  })

  it('chiTietCa chỉ trả ngân hàng có đáp án khi máy thầy xin', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain('body.xinKeyBank && ca.keyBankRef')
    expect(gs).toContain('keyBank: keyBank')
  })
})
