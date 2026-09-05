// GỌI LÊN BẢNG — khoá đúng những chỗ sai là thầy chỉ phát hiện lúc đứng lớp.
import { describe, expect, it } from 'vitest'
import { chuanChuyenDe, chuyenDeYeuNhat, mucDoNenGoi, phanCongCauHoi, bangPhanCongChu, type CauCoTheGoi, type EmDeGoi } from '../src/lib/goi-len-bang'

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

  // ĐỔI LUẬT 04-09: trước đây luôn lấy câu khó nhất. Ngược với việc giúp em
  // tiến bộ — em sai 40% mà bị gọi lên chữa câu vận dụng thì đứng im.
  it('lấy câu ĐÚNG TẦM của em, không phải câu khó nhất', () => {
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Ester – lipid', soCau: 10, soSai: 4 }])], KHO)
    expect(kq[0].cau?.mucDo).toBe('hieu')
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
    expect(t).toContain('Phần I câu 3')
    expect(t).toContain('sai 4/10')
  })
})

// MÀN GỌI LÊN BẢNG từ 05/09 chiều chạy engine `phan-cong.ts` và lấy dữ liệu từ
// CHÍNH ca lớp vừa làm — cùng một ca với phiếu gửi phụ huynh. Bản cũ chỉ biết
// "em yếu chuyên đề gì"; bản này biết em nào sai câu nào.
describe('Màn Gọi lên bảng', () => {
  it('chạy engine phân công mới trên bài làm thật của ca', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain("from '../lib/phan-cong'")
    expect(ma).toContain("from '../lib/du-lieu-len-bang'")
    expect(ma).toContain('phanCong(dsCau, baiLam, dsEmCa,')
    expect(ma).toContain('baiLamTuCa(du.bank, du.maCa, du.luot)')
    // engine cũ không được sống song song trong màn này
    expect(ma).not.toContain('phanCongCauHoi(')
  })

  it('tìm theo tên, và chạm dòng ra câu kèm lời giải', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('Tìm theo tên hoặc số báo danh')
    // câu hiện bằng ĐÚNG thẻ của màn xem lại, không vẽ kiểu hiển thị thứ hai
    expect(ma).toContain('cheDo="xem_lai"')
    expect(ma).toContain('loiGiai={day.q.loiGiai}')
  })

  it('khối GIẢNG CẢ LỚP đứng TRƯỚC các lượt gọi', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    const giang = ma.indexOf('data-khoi="giang-ca-lop"')
    const luot = ma.indexOf('data-luot={luot}')
    expect(giang).toBeGreaterThan(0)
    expect(luot).toBeGreaterThan(giang)
  })

  it('mỗi dòng ghi VÌ SAO chọn em này và nhắm mức độ nào', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('data-vi-sao')
    expect(ma).toContain('{p.viSao} · nhắm {TEN_MUC_NHAM[p.mucDoNham]}')
  })

  it('nút GỌI LƯỢT sau chỉ hiện khi CÒN CÂU chưa phân', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    const i = ma.indexOf('kq.chuaPhan.length > 0')
    expect(i).toBeGreaterThan(0)
    expect(ma.slice(i, i + 900)).toContain('GỌI LƯỢT {soLuot + 1}')
  })

  it('ca không có bản đề kèm đáp án thì báo thẳng, không phân công mò', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('loadSessionTeacherBank(ca.maCa)')
    expect(ma).toContain('không có bản đề kèm đáp án')
  })
})

describe('Chấm câu trên bảng', () => {
  it('có nút Đạt / Không đạt, ghi vào log mạnh–yếu rồi bỏ dòng khỏi bảng', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('cham(p, true)')
    expect(ma).toContain('cham(p, false)')
    expect(ma).toContain('ghiLenBang(cauHinh.url, cauHinh.mat')
    // bỏ khỏi bảng CHỈ SAU khi máy chủ nhận — mất dòng mà chưa ghi là thầy tưởng xong rồi
    const i = ma.indexOf('await ghiLenBang')
    const j = ma.indexOf('cu.phanCong.filter((x) => !(x.sbd === p.sbd && x.cau.id === p.cau.id))')
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

describe('Phân công cho em TIẾN BỘ', () => {
  it('em hổng gốc (sai ≥60%) nhận câu NHẬN BIẾT, không phải vận dụng', () => {
    expect(mucDoNenGoi(25 / 28)).toBe('biet')
    const kq = phanCongCauHoi([em('1', 'An', [{ ten: 'Ester – lipid', soCau: 28, soSai: 25 }])], KHO)
    expect(kq[0].cau?.mucDo).toBe('biet')
    expect(kq[0].mucDoNham).toBe('biet')
    expect(kq[0].viSao).toContain('89%')
  })

  it('sai vừa (30–60%) nhận thông hiểu; sai ít (<30%) mới nhận vận dụng', () => {
    expect(mucDoNenGoi(0.5)).toBe('hieu')
    expect(mucDoNenGoi(0.2)).toBe('van_dung')
    expect(phanCongCauHoi([em('1', 'A', [{ ten: 'Ester – lipid', soCau: 10, soSai: 5 }])], KHO)[0].cau?.mucDo).toBe('hieu')
    expect(phanCongCauHoi([em('1', 'A', [{ ten: 'Ester – lipid', soCau: 10, soSai: 2 }])], KHO)[0].cau?.mucDo).toBe('van_dung')
  })

  it('mỗi câu đã chữa nâng một bậc — gọi lại là câu khó hơn', () => {
    expect(mucDoNenGoi(0.9, 0)).toBe('biet')
    expect(mucDoNenGoi(0.9, 1)).toBe('hieu')
    expect(mucDoNenGoi(0.9, 2)).toBe('van_dung')
    expect(mucDoNenGoi(0.9, 9)).toBe('van_dung')
  })

  // Đây là điều thầy yêu cầu thẳng: phân công lại KHÔNG được lặp câu cũ.
  it('phân công lại KHÔNG lặp lại câu đã gọi', () => {
    const ds = [em('1', 'An', [{ ten: 'Ester – lipid', soCau: 28, soSai: 25 }])]
    const l1 = phanCongCauHoi(ds, KHO)
    const l2 = phanCongCauHoi(ds, KHO, { '1': [l1[0].cau!.id] })
    const l3 = phanCongCauHoi(ds, KHO, { '1': [l1[0].cau!.id, l2[0].cau!.id] })
    const ids = [l1[0].cau!.id, l2[0].cau!.id, l3[0].cau!.id]
    expect(new Set(ids).size).toBe(3)
    // và mỗi lần một bậc khó hơn
    expect([l1[0].cau!.mucDo, l2[0].cau!.mucDo, l3[0].cau!.mucDo]).toEqual(['biet', 'hieu', 'van_dung'])
  })

  it('hết câu mới trong chuyên đề thì NÓI THẲNG, không lặng lẽ đưa lại câu cũ', () => {
    const ds = [em('1', 'An', [{ ten: 'Ester – lipid', soCau: 28, soSai: 25 }])]
    const kq = phanCongCauHoi(ds, KHO, { '1': ['a1', 'a2', 'a3'] })
    expect(kq[0].lyDo).toBe('het_cau_moi')
    expect(kq[0].ghiChu).toContain('đã chữa hết câu')
  })

  it('em đã chữa gần hết chuyên đề được chia trước em còn nhiều lựa chọn', () => {
    const ds = [
      em('1', 'Còn nhiều', [{ ten: 'Ester – lipid', soCau: 10, soSai: 6 }]),
      em('2', 'Sắp hết', [{ ten: 'Ester – lipid', soCau: 10, soSai: 6 }]),
    ]
    const kq = phanCongCauHoi(ds, KHO, { '2': ['a1', 'a3'] })
    expect(kq[1].cau?.id).toBe('a2')
    expect(kq[0].cau?.id).not.toBe('a2')
  })
})

describe('Màn nhớ câu đã gọi', () => {
  it('câu đã chấm xong không quay lại ở lượt sau của chính em đó', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('const [daGoiCau, setDaGoiCau]')
    // ghi vào daGoiCau NGAY sau khi chấm, và daGoiCau chảy vào dsEm → engine
    expect(ma).toContain('setDaGoiCau((cu) => ({ ...cu, [p.sbd]: [...new Set([...(cu[p.sbd] ?? []), p.cau.id])] }))')
    expect(ma).toContain('emTuCa(du.luot, du.hoSo, dsCau, daGoiCau, vang)')
  })

  it('lấy hồ sơ chuyên đề song song có chặn, không tuần tự 27 lời gọi', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('hoSoEm(cauHinh.url, { secret: cauHinh.mat, sbd })')
    expect(ma).toContain('songSong(')
  })
})

// SAO CẦN CHỮA ở màn Gọi lên bảng cũ (thầy báo 05/09: "không thấy gắn sao vào
// câu đã phân công"). Sao phải đi tới tận dòng phân công, và ở cùng mức độ thì
// câu nhiều sao được gọi trước.
describe('sao cần chữa trong phân công', () => {
  const c = (id: string, so: number, mucDo: 'biet' | 'hieu' | 'van_dung', sao: 0 | 1 | 2): CauCoTheGoi => ({
    id,
    phan: 'I',
    so,
    viTri: so - 1,
    chuyenDe: 'Ester',
    mucDo,
    tomTat: 't',
    sao,
    lyDoSao: sao ? 'câu nền' : '',
  })

  it('cùng mức độ thì câu NHIỀU SAO được phân trước', () => {
    const em = [{ sbd: '1', hoTen: 'A', chuyenDeCaGanNhat: [{ ten: 'Ester', soCau: 10, soSai: 2 }] }]
    const kq = phanCongCauHoi(em, [c('q0', 1, 'van_dung', 0), c('q2', 2, 'van_dung', 2)])
    expect(kq[0].cau?.id).toBe('q2')
  })

  it('MỨC ĐỘ vẫn thắng sao: em hổng gốc không bị lôi lên chữa câu vận dụng hai sao', () => {
    // Sai 9/10 (90%) → nhắm nhận biết.
    const em = [{ sbd: '1', hoTen: 'A', chuyenDeCaGanNhat: [{ ten: 'Ester', soCau: 10, soSai: 9 }] }]
    const kq = phanCongCauHoi(em, [c('kho', 1, 'van_dung', 2), c('de', 2, 'biet', 0)])
    expect(kq[0].cau?.id).toBe('de')
  })

  it('bảng chữ copy sang Zalo có ★ của câu', () => {
    const em = [{ sbd: '1', hoTen: 'An', chuyenDeCaGanNhat: [{ ten: 'Ester', soCau: 10, soSai: 5 }] }]
    const t = bangPhanCongChu(phanCongCauHoi(em, [c('q2', 7, 'hieu', 2)]), 'ĐỀ-1')
    expect(t).toContain('câu 7 ★★')
  })
})
