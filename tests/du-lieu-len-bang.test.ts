// NỐI DỮ LIỆU MỘT CA VÀO PHÂN CÔNG LÊN BẢNG.
//
// Một ca, hai việc: phiếu gửi phụ huynh và bảng gọi lên bảng. Phép kiểm ở đây
// canh đúng chỗ dễ sai nhất — câu bỏ trống, em thi lại, em vắng, hồ sơ hỏng —
// vì bốn chỗ đó mà sai thì thầy gọi nhầm em ngay trên lớp.
import { describe, expect, it } from 'vitest'
import type { AnswerRecord } from '../src/lib/exam-db'
import { baiLamTuCa, cauTuBanDe, daCoBaiLam, demTheoChuyenDe, emTuCa, luotMoiNhat, tomTatCau, type BanDeCa, type HoSoRutGon, type LuotCa } from '../src/lib/du-lieu-len-bang'
import { phanCong, MAC_DINH } from '../src/lib/phan-cong'

const tn = (n: number, cd: string, correct: 'A' | 'B' | 'C' | 'D' = 'A', sao: 0 | 1 | 2 = 0) => ({
  id: `q${n}`,
  text: `Câu trắc nghiệm ${n}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct,
  chuyenDe: cd,
  mucDo: 'hieu' as const,
  canChua: sao ? { sao, ly_do: 'câu nền' } : undefined,
})

const ds = (n: number, cd: string) => ({
  id: `d${n}`,
  text: `Câu đúng sai ${n}`,
  ideas: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: ['D', 'S', 'D', 'S'] as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'],
  chuyenDe: cd,
})

const BANK = {
  phanI: [tn(1, 'Ester – lipid', 'A', 2), tn(2, 'Ester – lipid', 'B'), tn(3, 'Carbohydrate', 'C'), tn(4, 'Carbohydrate', 'D', 1)],
  phanII: [ds(1, 'Ester – lipid')],
  phanIII: [],
} as unknown as BanDeCa

const traLoi = (phanI: Record<string, 'A' | 'B' | 'C' | 'D'>, phanII: Record<string, ('D' | 'S' | null)[]> = {}): AnswerRecord => ({ phanI, phanII, phanIII: {} })

const luot = (sbd: string, hoTen: string, dapAn: AnswerRecord | null, trangThai = 'da_nop', lanThu = 1): LuotCa => ({ sbd, hoTen, lanThu, trangThai, dapAn, giayCau: null })

describe('câu của ca', () => {
  it('lấy HẾT câu, kể cả câu không em nào làm', () => {
    const c = cauTuBanDe(BANK)
    expect(c).toHaveLength(5)
    expect(c.filter((x) => x.phan === 'I').map((x) => x.so)).toEqual([1, 2, 3, 4])
    expect(c.find((x) => x.id === 'd1')?.so).toBe(1)
  })

  it('mang theo sao cần chữa và chuyên đề của kho, không đoán', () => {
    const c = cauTuBanDe(BANK)
    expect(c.find((x) => x.id === 'q1')?.sao).toBe(2)
    expect(c.find((x) => x.id === 'q1')?.lyDoSao).toBe('câu nền')
    expect(c.find((x) => x.id === 'q2')?.sao).toBe(0)
    expect(c.find((x) => x.id === 'q3')?.chuyenDe).toBe('Carbohydrate')
  })

  it('câu tích thêm ngoài ca đánh số TIẾP, không đánh lại từ 1', () => {
    const them = cauTuBanDe(BANK, { I: 4, II: 1, III: 0 })
    expect(them.filter((x) => x.phan === 'I').map((x) => x.so)).toEqual([5, 6, 7, 8])
    expect(them.find((x) => x.phan === 'II')?.so).toBe(2)
  })

  it('tóm tắt bỏ vỏ mhchem cho thầy đọc được', () => {
    expect(tomTatCau('Cho $\\ce{H2SO4}$ tác dụng')).toBe('Cho H2SO4 tác dụng')
  })
})

describe('lượt thi', () => {
  it('em thi lại thì lấy LẦN MỚI NHẤT', () => {
    const r = luotMoiNhat([luot('1', 'An', traLoi({ q1: 'A' }), 'da_nop', 1), luot('1', 'An', traLoi({ q1: 'B' }), 'da_nop', 2)])
    expect(r).toHaveLength(1)
    expect(r[0].lanThu).toBe(2)
    expect(r[0].dapAn?.phanI.q1).toBe('B')
  })

  it('em đang làm dở KHÔNG tính — đọc bài chưa xong rồi kết luận em sai là oan', () => {
    expect(daCoBaiLam(luot('1', 'An', traLoi({ q1: 'A' }), 'dang_lam'))).toBe(false)
    expect(daCoBaiLam(luot('1', 'An', null, 'da_nop'))).toBe(false)
    expect(daCoBaiLam(luot('1', 'An', traLoi({ q1: 'A' }), 'khoa'))).toBe(true)
  })
})

describe('bài làm từng câu', () => {
  const L = [luot('1', 'An', traLoi({ q1: 'B', q2: 'B', q3: 'C', q4: 'D' })), luot('2', 'Bình', traLoi({ q1: 'B', q2: 'A', q3: 'C', q4: 'D' }))]

  it('chấm đúng/sai theo đáp án kho', () => {
    const bl = baiLamTuCa(BANK, 'CA1', L)
    const cua1 = bl.filter((b) => b.sbd === '1')
    expect(cua1.find((b) => b.idCau === 'q1')?.dung).toBe(false) // đáp án A, em chọn B
    expect(cua1.find((b) => b.idCau === 'q2')?.dung).toBe(true)
  })

  it('câu BỎ TRỐNG tính là làm SAI, không phải chưa làm', () => {
    const bl = baiLamTuCa(BANK, 'CA1', [luot('9', 'Trống', traLoi({}))])
    expect(bl).toHaveLength(5)
    expect(bl.every((b) => b.dung === false)).toBe(true)
    expect(bl.find((b) => b.idCau === 'q1')?.chon).toBeUndefined()
  })

  it('giữ ĐÁP ÁN GỐC em chọn để tính được độ chụm', () => {
    const bl = baiLamTuCa(BANK, 'CA1', L)
    const q1 = bl.filter((b) => b.idCau === 'q1')
    expect(q1.map((b) => b.chon)).toEqual(['B', 'B'])
  })

  it('Phần II ghi cả bốn ý thành một chuỗi, sai một ý là sai câu', () => {
    const bl = baiLamTuCa(BANK, 'CA1', [luot('1', 'An', traLoi({}, { d1: ['D', 'S', 'D', 'D'] }))])
    const d1 = bl.find((b) => b.idCau === 'd1')
    expect(d1?.chon).toBe('DSDD')
    expect(d1?.dung).toBe(false)
  })
})

describe('danh sách em', () => {
  const L = [luot('2', 'Bình', traLoi({ q1: 'B' })), luot('1', 'An', traLoi({ q1: 'B' })), luot('3', 'Chi', traLoi({ q1: 'A' }), 'dang_lam')]
  const hoSo: Record<string, HoSoRutGon> = {
    '1': { sbd: '1', hoTen: 'Nguyễn An', chuyenDe: [{ ten: 'Ester – lipid', soCau: 10, soSai: 8 }] },
  }

  it('chỉ lấy em CÓ BÀI, xếp theo tên tiếng Việt', () => {
    const em = emTuCa(L, hoSo, cauTuBanDe(BANK))
    // Em 3 đang làm dở nên rơi ra. Tên lấy từ hồ sơ khi có (SBD 1 = Nguyễn An),
    // nên thứ tự là Bình rồi Nguyễn An.
    expect(em.map((e) => e.hoTen)).toEqual(['Bình', 'Nguyễn An'])
    expect(em.map((e) => e.sbd)).toEqual(['2', '1'])
  })

  it('em vắng vẫn còn trong danh sách nhưng coMat = false', () => {
    const em = emTuCa(L, hoSo, cauTuBanDe(BANK), {}, new Set(['2']))
    expect(em.find((e) => e.sbd === '2')?.coMat).toBe(false)
    expect(em.find((e) => e.sbd === '1')?.coMat).toBe(true)
  })

  it('hồ sơ hỏng thì chuyên đề RỖNG, không bịa số', () => {
    const em = emTuCa(L, hoSo, cauTuBanDe(BANK))
    expect(em.find((e) => e.sbd === '2')?.chuyenDe).toEqual([])
    expect(em.find((e) => e.sbd === '1')?.chuyenDe[0].soSai).toBe(8)
  })

  it('câu đã gọi trong buổi đếm sang bậc khó của chuyên đề đó', () => {
    const em = emTuCa(L, hoSo, cauTuBanDe(BANK), { '1': ['q1', 'q2', 'q3'] })
    const e1 = em.find((e) => e.sbd === '1')!
    expect(e1.daGoiCau).toEqual(['q1', 'q2', 'q3'])
    expect(e1.soLanLenBang).toBe(3)
    expect(e1.daGoiTheoCd['ester - lipid']).toBe(2)
    expect(e1.daGoiTheoCd['carbohydrate']).toBe(1)
  })

  it('demTheoChuyenDe bỏ qua id không có trong danh sách câu', () => {
    expect(demTheoChuyenDe(['khong-co'], cauTuBanDe(BANK))).toEqual({})
  })
})

// CHUỖI ĐẦY ĐỦ: ca thật → thống kê → phân công. Đây là phép kiểm quan trọng
// nhất, vì nó chạy đúng đường mà màn hình chạy.
describe('cả chuỗi từ ca ra bảng phân công', () => {
  // 10 em, 9 em cùng chọn B ở q1 (đáp án A) → một hiểu nhầm chung.
  const L: LuotCa[] = Array.from({ length: 10 }, (_, i) =>
    luot(String(i + 1), `Em ${i + 1}`, traLoi({ q1: i < 9 ? 'B' : 'A', q2: 'B', q3: 'C', q4: i < 2 ? 'A' : 'D' })),
  )
  const hoSo: Record<string, HoSoRutGon> = Object.fromEntries(
    L.map((l) => [l.sbd, { sbd: l.sbd, hoTen: l.hoTen, chuyenDe: [{ ten: 'Carbohydrate', soCau: 10, soSai: 7 }] }]),
  )
  const dsCau = cauTuBanDe(BANK)
  const baiLam = baiLamTuCa(BANK, 'CA1', L)
  const dsEm = emTuCa(L, hoSo, dsCau)

  it('câu cả lớp cùng chọn một phương án sai → GIẢNG CẢ LỚP, không gọi ai', () => {
    const kq = phanCong(dsCau, baiLam, dsEm)
    expect(kq.giangCaLop.map((t) => t.cau.id)).toContain('q1')
    expect(kq.phanCong.some((p) => p.cau.id === 'q1')).toBe(false)
  })

  it('câu cả lớp làm đúng → CHỈ ĐỌC ĐÁP ÁN, không gọi ai', () => {
    const kq = phanCong(dsCau, baiLam, dsEm)
    expect(kq.chiDocDapAn.map((t) => t.cau.id)).toContain('q2')
    expect(kq.phanCong.some((p) => p.cau.id === 'q2')).toBe(false)
  })

  it('mọi dòng phân công đều có lý do bằng chữ và mức độ nhắm tới', () => {
    const kq = phanCong(dsCau, baiLam, dsEm)
    expect(kq.phanCong.length).toBeGreaterThan(0)
    for (const p of kq.phanCong) {
      expect(p.viSao.length).toBeGreaterThan(3)
      expect(['biet', 'hieu', 'van_dung']).toContain(p.mucDoNham)
    }
  })

  it('không em nào nhận hai câu trong một lượt, không câu nào phân cho hai em', () => {
    const kq = phanCong(dsCau, baiLam, dsEm, { ...MAC_DINH, soLuot: 4 })
    const cap = kq.phanCong.map((p) => `${p.luot}:${p.sbd}`)
    expect(new Set(cap).size).toBe(cap.length)
    const cau = kq.phanCong.map((p) => p.cau.id)
    expect(new Set(cau).size).toBe(cau.length)
  })

  it('em vắng không xuất hiện trong bảng nhưng bài của em vẫn tính vào tỉ lệ câu', () => {
    const vang = emTuCa(L, hoSo, dsCau, {}, new Set(['1', '2', '3']))
    const kq = phanCong(dsCau, baiLam, vang)
    expect(kq.phanCong.some((p) => ['1', '2', '3'].includes(p.sbd))).toBe(false)
    // q1 vẫn giữ nguyên 10 em làm — độ chụm không đổi vì ba em vắng
    expect(kq.thongKe.find((t) => t.cau.id === 'q1')?.soEmLam).toBe(10)
  })
})

// THẦY BÁO 05/09 TỐI: tích đề chương 2 mà máy vẫn phân câu chương 1. Nguyên do:
// câu của ca đã thi có bài làm nên điểm cao hơn, chen hết chỗ của câu thầy tích.
describe('thầy tự chọn bài thì CHỈ chữa bài đó', () => {
  const cauC1 = (n: number, sao: 0 | 1 | 2 = 0) => ({ ...tn(n, 'Ester – lipid', 'A', sao), id: `c1q${n}` })
  const cauC2 = (n: number, sao: 0 | 1 | 2 = 0) => ({ ...tn(n, 'Carbohydrate', 'A', sao), id: `c2q${n}` })

  const BANK_CA = { phanI: [cauC1(1, 2), cauC1(2, 1), cauC1(3)], phanII: [], phanIII: [] } as unknown as BanDeCa
  const BANK_TICH = { phanI: [cauC2(1), cauC2(2, 2), cauC2(3, 1)], phanII: [], phanIII: [] } as unknown as BanDeCa

  it('màn Gọi lên bảng bỏ hẳn câu của ca khi thầy tự chọn bài', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain("if (cachLayCau === 'tu_chon') return cauTuBanDe(bankThem)")
  })

  it('danh sách chữa chỉ còn chuyên đề của bài đã tích', () => {
    const cauCa = cauTuBanDe(BANK_CA)
    const cauTich = cauTuBanDe(BANK_TICH)
    expect(cauCa.every((c) => c.chuyenDe === 'Ester – lipid')).toBe(true)
    expect(cauTich.every((c) => c.chuyenDe === 'Carbohydrate')).toBe(true)
    // không trộn: hai danh sách rời nhau hoàn toàn
    expect(cauTich.some((c) => cauCa.map((x) => x.id).includes(c.id))).toBe(false)
  })

  it('trong bài đã tích, câu 2 SAO được phân trước 1 sao rồi 0 sao', () => {
    const dsCau = cauTuBanDe(BANK_TICH)
    const em = emTuCa(
      [luot('1', 'An', traLoi({}))],
      { '1': { sbd: '1', hoTen: 'An', chuyenDe: [{ ten: 'Carbohydrate', soCau: 10, soSai: 8 }] } },
      dsCau,
    )
    const kq = phanCong(dsCau, [], em, { ...MAC_DINH, soLuot: 1 })
    expect(kq.phanCong[0].cau.sao).toBe(2)
    // xếp hạng điểm giữ đúng thứ tự sao
    const theoSao = kq.thongKe.slice().sort((a, b) => b.diem - a.diem).map((t) => t.cau.sao)
    expect(theoSao).toEqual([2, 1, 0])
  })

  it('em yếu chuyên đề đó hơn được gọi trước ở cùng mức', () => {
    const dsCau = cauTuBanDe(BANK_TICH)
    const em = emTuCa(
      [luot('1', 'Ít yếu', traLoi({})), luot('2', 'Rất yếu', traLoi({}))],
      {
        '1': { sbd: '1', hoTen: 'Ít yếu', chuyenDe: [{ ten: 'Carbohydrate', soCau: 10, soSai: 2 }] },
        '2': { sbd: '2', hoTen: 'Rất yếu', chuyenDe: [{ ten: 'Carbohydrate', soCau: 10, soSai: 9 }] },
      },
      dsCau,
    )
    const kq = phanCong(dsCau, [], em, { ...MAC_DINH, soLuot: 1 })
    // câu 2 sao đứng đầu phải rơi vào em yếu chuyên đề đó nhất
    expect(kq.phanCong[0].hoTen).toBe('Rất yếu')
  })
})
