// THUẬT TOÁN PHÂN CÔNG LÊN BẢNG — BẢN VIẾT LẠI 14/09.
//
// Thầy chốt: "trong 90 phút danh sách lớp phải có ít nhất 20 em được lên bảng",
// "ưu tiên phân công câu 2 sao trước rồi đến 1 sao", "số câu khó và quan trọng
// nhất phải được chữa hết, số câu còn lại chỉ cần đọc đáp án".
import { describe, it, expect } from 'vitest'
import { xepBuoiChua, xepThuTuChua, bangChuBuoiChua, TRAN_LUOT_MOI_EM, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { BTVN_RONG, diemHopCau, gopHoSo, TRONG_SO, type HoSoEmDayDu } from '../src/lib/ho-so-lop'
import { CAU_HINH_LEN_BANG_MAC_DINH, giayLenBang, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import type { CauChua } from '../src/lib/phan-cong'

const CD = ['Ester – lipid', 'Carbohydrate', 'Cân bằng hoá học', 'Nguyên tử']

function cau(i: number, sao: 0 | 1 | 2, batBuoc = false): CauVaoXep {
  return {
    cau: { id: `Q${i}`, phan: 'I', so: i, chuyenDe: CD[i % CD.length], mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' },
    tiLeDung: 0.5,
    soEmLam: 20,
    batBuoc,
  }
}

function em(i: number, opt: Partial<HoSoEmDayDu> = {}): HoSoEmDayDu {
  return {
    sbd: `120${String(i).padStart(2, '0')}`,
    hoTen: `Em ${i}`,
    coMat: true,
    chuyenDe: CD.map((t) => ({ ten: t, soCau: 10, soSai: 4 })),
    cauSai: [],
    daLam: new Map(),
    lenBang: { soLan: 0, lanCuoi: '', qids: [] },
    // 14/09 thầy chốt thêm: hồ sơ em phải mang cả bài tập về nhà. Em dựng
    // trong test mặc định CHƯA có bài nào — muốn có thì truyền `btvn` vào.
    btvn: { ...BTVN_RONG, theoCau: new Map() },
    ...opt,
  }
}

const LOP = (n: number) => Array.from({ length: n }, (_, i) => em(i + 1))

describe('Ngân sách 90 phút', () => {
  it('cấu hình đúng 90 phút và sàn 20 em', () => {
    expect(CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT).toBe(90)
    expect(CAU_HINH_LEN_BANG_MAC_DINH.SO_EM_LEN_BANG_TOI_THIEU).toBe(20)
    expect(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH)).toBe(4920)
  })

  it('giá lên bảng theo ĐỘ KHÓ, không còn một giá chung', () => {
    expect(giayLenBang(CAU_HINH_LEN_BANG_MAC_DINH, 2)).toBe(300)
    expect(giayLenBang(CAU_HINH_LEN_BANG_MAC_DINH, 1)).toBe(180)
    expect(giayLenBang(CAU_HINH_LEN_BANG_MAC_DINH, 0)).toBe(120)
    // Bản cũ 420 giây cố định: 20 em là 8.400 giây, gấp đôi ngân sách.
    expect(20 * 420).toBeGreaterThan(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    // Bản mới, đúng phép tính đối chứng trong cấu hình.
    expect(6 * 300 + 8 * 180 + 6 * 120).toBeLessThan(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
  })
})

describe('Thứ tự chữa: 2 sao trước, rồi 1 sao', () => {
  it('xếp đúng bậc sao giảm dần, câu bắt buộc lên trên hết', () => {
    const ds = [cau(1, 0), cau(2, 1), cau(3, 2), cau(4, 0, true)]
    const ra = xepThuTuChua(ds).map((c) => c.cau.id)
    expect(ra[0]).toBe('Q4')
    expect(ra.slice(1)).toEqual(['Q3', 'Q2', 'Q1'])
  })

  it('cùng bậc sao thì câu lớp sai nhiều hơn đứng trước', () => {
    const a = { ...cau(1, 2), tiLeDung: 0.9 }
    const b = { ...cau(2, 2), tiLeDung: 0.2 }
    expect(xepThuTuChua([a, b]).map((c) => c.cau.id)).toEqual(['Q2', 'Q1'])
  })

  it('em lên bảng nhận câu 2 sao trước câu 1 sao', () => {
    const ds = [...Array.from({ length: 5 }, (_, i) => cau(i + 1, 1)), ...Array.from({ length: 5 }, (_, i) => cau(i + 20, 2))]
    const kq = xepBuoiChua(ds, LOP(30))
    const lenBang = kq.dong.filter((d) => d.tang === 'len_bang')
    const saoDauTien = lenBang.slice(0, 5).map((d) => d.cau.sao)
    expect(saoDauTien.every((s) => s === 2)).toBe(true)
  })
})

describe('SÀN 20 EM TRONG 90 PHÚT', () => {
  it('đủ câu thì ĐẠT sàn, và vẫn trong ngân sách', () => {
    const ds = [
      ...Array.from({ length: 6 }, (_, i) => cau(i + 1, 2)),
      ...Array.from({ length: 8 }, (_, i) => cau(i + 10, 1)),
      ...Array.from({ length: 10 }, (_, i) => cau(i + 30, 0)),
    ]
    const kq = xepBuoiChua(ds, LOP(30))
    expect(kq.soEmLenBang).toBeGreaterThanOrEqual(20)
    expect(kq.datSan).toBe(true)
    expect(kq.thieu).toBeNull()
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
  })

  it('ngân sách hết TRƯỚC khi hết em ⇒ mỗi em đúng MỘT lượt (chưa tới lúc phát lượt thêm)', () => {
    const ds = Array.from({ length: 40 }, (_, i) => cau(i + 1, (i % 3) as 0 | 1 | 2))
    const kq = xepBuoiChua(ds, LOP(30))
    const sbd = kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.em?.sbd)
    expect(new Set(sbd).size).toBe(sbd.length)
    expect(kq.soEmLenBang).toBeGreaterThanOrEqual(20)
  })

  it('LUẬT MỚI (thầy chốt 25/09): 40 câu 0 sao (vừa 4.920 s) / 30 em ⇒ MỌI em có mặt 1 lượt RỒI mới phát LƯỢT THÊM, cân bằng, không quá trần', () => {
    const ds = Array.from({ length: 40 }, (_, i) => cau(i + 1, 0))
    const kq = xepBuoiChua(ds, LOP(30))
    const sbd = kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.em?.sbd)
    expect(kq.soEmLenBang).toBe(30) // MỌI em có mặt đều lên bảng
    expect(sbd.length).toBeGreaterThan(30) // CÓ em được gọi lượt thứ hai
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
    const dem = new Map<string, number>()
    for (const s of sbd) dem.set(s!, (dem.get(s!) ?? 0) + 1)
    const so = [...dem.values()].sort((a, b) => a - b)
    expect(so[so.length - 1]! - so[0]!).toBeLessThanOrEqual(1) // CÂN BẰNG: chênh ≤ 1 lượt
    expect(so[so.length - 1]!).toBeLessThanOrEqual(TRAN_LUOT_MOI_EM) // không em nào quá trần
    const lanThuHai = sbd.findIndex((s, i) => sbd.slice(0, i).includes(s!))
    expect(lanThuHai).toBeGreaterThanOrEqual(30) // lượt thêm CHỈ tới sau khi đủ 30 em đã có lượt
  })

  it('lớp 40 em, đề 36 câu — vẫn đạt sàn', () => {
    const ds = Array.from({ length: 36 }, (_, i) => cau(i + 1, (i % 3) as 0 | 1 | 2, i < 4))
    const kq = xepBuoiChua(ds, LOP(40))
    expect(kq.datSan).toBe(true)
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
  })

  it('THIẾU CÂU thì nói thiếu bao nhiêu, KHÔNG bịa thêm em', () => {
    const ds = Array.from({ length: 8 }, (_, i) => cau(i + 1, 1))
    const kq = xepBuoiChua(ds, LOP(30))
    expect(kq.soEmLenBang).toBe(8)
    expect(kq.datSan).toBe(false)
    expect(kq.thieu?.soEmConThieu).toBe(12)
    expect(kq.thieu?.viSao).toContain('tích thêm')
  })

  it('LỚP ÍT EM thì nói đúng lý do là ít em', () => {
    const ds = Array.from({ length: 30 }, (_, i) => cau(i + 1, 1))
    const kq = xepBuoiChua(ds, LOP(12))
    expect(kq.soEmLenBang).toBe(12)
    expect(kq.thieu?.viSao).toContain('12 em có mặt')
  })
})

describe('Câu khó chữa hết, câu còn lại chỉ đọc đáp án', () => {
  it('mọi câu bắt buộc đều được gọi em, không câu nào rơi', () => {
    const ds = [
      ...Array.from({ length: 8 }, (_, i) => cau(i + 1, 2, true)),
      ...Array.from({ length: 30 }, (_, i) => cau(i + 20, 0)),
    ]
    const kq = xepBuoiChua(ds, LOP(30))
    const daChua = new Set(kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.cau.id))
    for (let i = 1; i <= 8; i++) expect(daChua.has(`Q${i}`)).toBe(true)
    expect(kq.batBuocChuaChua).toHaveLength(0)
  })

  it('câu không được chữa đi hết vào danh sách ĐỌC ĐÁP ÁN', () => {
    const ds = Array.from({ length: 50 }, (_, i) => cau(i + 1, (i % 3) as 0 | 1 | 2))
    const kq = xepBuoiChua(ds, LOP(25))
    const lenBang = kq.dong.filter((d) => d.tang === 'len_bang').length
    const doc = kq.dong.filter((d) => d.tang === 'doc_dap_an').length
    expect(lenBang + doc).toBe(50)
    expect(kq.cauDocDapAn).toHaveLength(doc)
    // Không câu nào vừa lên bảng vừa nằm trong danh sách đọc.
    const idLenBang = new Set(kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.cau.id))
    expect(kq.cauDocDapAn.some((c) => idLenBang.has(c.id))).toBe(false)
  })
})

describe('Gọi ĐÚNG em bằng cả ba đường dữ liệu', () => {
  const c: CauChua = { id: 'Q1', phan: 'I', so: 1, chuyenDe: 'Ester – lipid', mucDo: 'hieu', tomTat: '', viTri: 1, sao: 2, lyDoSao: '' }

  it('em SAI ĐÚNG CÂU ẤY và chưa chữa được ưu tiên cao nhất', () => {
    const saiChuaChua = em(1, { cauSai: [{ qid: 'Q1', chuyenDe: 'Ester – lipid', mucDo: 'hieu', soLanSai: 2, daChua: false, maCa: 'A' }] })
    const thuong = em(2)
    expect(diemHopCau(saiChuaChua, c).diem).toBeGreaterThan(diemHopCau(thuong, c).diem)
    expect(diemHopCau(saiChuaChua, c).viSao).toContain('sai câu này')
  })

  it('CHỮA RỒI thì nhẹ hẳn — gọi lại là phí lượt của em khác', () => {
    const chuaRoi = em(1, { cauSai: [{ qid: 'Q1', chuyenDe: 'Ester – lipid', mucDo: 'hieu', soLanSai: 2, daChua: true, maCa: 'A' }] })
    const chuaChua = em(2, { cauSai: [{ qid: 'Q1', chuyenDe: 'Ester – lipid', mucDo: 'hieu', soLanSai: 2, daChua: false, maCa: 'A' }] })
    expect(diemHopCau(chuaRoi, c).diem).toBeLessThan(diemHopCau(chuaChua, c).diem)
    expect(diemHopCau(chuaRoi, c).viSao).toContain('đã chữa')
  })

  it('câu ĐÃ LÀM qua bài tập về nhà thì không còn là câu mới', () => {
    const daLamBtvn = em(1, { daLam: new Map([['Q1', 2]]) })
    const chuaLam = em(2)
    expect(diemHopCau(daLamBtvn, c).diem).toBeLessThan(diemHopCau(chuaLam, c).diem)
    expect(diemHopCau(daLamBtvn, c).viSao).toContain('đã làm câu này')
  })

  it('em lên bảng nhiều rồi thì nhường em chưa lên', () => {
    const lenNhieu = em(1, { lenBang: { soLan: 6, lanCuoi: '', qids: [] } })
    const chuaLen = em(2)
    expect(diemHopCau(chuaLen, c).diem).toBeGreaterThan(diemHopCau(lenNhieu, c).diem)
    expect(diemHopCau(chuaLen, c).viSao).toContain('chưa lên bảng lần nào')
  })

  it('em yếu chuyên đề của câu hơn thì được gọi trước', () => {
    const yeu = em(1, { chuyenDe: [{ ten: 'Ester – lipid', soCau: 10, soSai: 9 }] })
    const gioi = em(2, { chuyenDe: [{ ten: 'Ester – lipid', soCau: 10, soSai: 1 }] })
    expect(diemHopCau(yeu, c).diem).toBeGreaterThan(diemHopCau(gioi, c).diem)
  })

  it('trọng số cộng đúng 1,0 — đổi một số phải bù số khác', () => {
    const tong =
      TRONG_SO.BTVN_CHINH_CAU +
      TRONG_SO.SAI_CHINH_CAU +
      TRONG_SO.YEU_CHUYEN_DE +
      TRONG_SO.CHUA_LAM +
      TRONG_SO.IT_LEN_BANG
    expect(tong).toBeCloseTo(1, 6)
  })

  it('em chưa có dữ liệu vẫn có cơ hội, không bị loại', () => {
    const trong = em(9, { chuyenDe: [], cauSai: [], daLam: new Map(), lenBang: { soLan: 3, lanCuoi: '', qids: [] } })
    const d = diemHopCau(trong, c)
    expect(d.diem).toBeGreaterThan(0)
    expect(d.viSao).toContain('chưa có dữ liệu')
  })

  it('thuật toán THẬT SỰ gọi em sai câu ấy lên đúng câu ấy', () => {
    const dsEm = [
      ...LOP(25),
      em(99, { cauSai: [{ qid: 'Q1', chuyenDe: CD[1], mucDo: 'hieu', soLanSai: 3, daChua: false, maCa: 'A' }] }),
    ]
    const kq = xepBuoiChua([cau(1, 2, true), ...Array.from({ length: 25 }, (_, i) => cau(i + 5, 1))], dsEm)
    const q1 = kq.dong.find((d) => d.cau.id === 'Q1' && d.tang === 'len_bang')
    expect(q1?.em?.sbd).toBe('12099')
  })
})

describe('Gộp hồ sơ từ máy chủ', () => {
  it('ghép đủ bốn nguồn, em không có dữ liệu vẫn có dòng', () => {
    const goi = {
      em: {
        '12001': {
          chuyenDe: [{ ten: 'Ester – lipid', soCau: 10, soSai: 7 }],
          qidSai: [{ qid: 'Q1', chuyenDe: 'Ester – lipid', mucDo: 'hieu', soLanSai: 2, daChua: false, maCa: 'A' }],
          qidDaLam: [{ qid: 'Q5', soLan: 3 }],
          lenBang: { soLan: 2, lanCuoi: '2026-09-10', qids: ['Q9'] },
        },
      },
    }
    const ra = gopHoSo(goi, [
      { sbd: '12001', hoTen: 'Em A', coMat: true },
      { sbd: '12002', hoTen: 'Em B', coMat: true },
    ])
    expect(ra).toHaveLength(2)
    expect(ra[0].cauSai).toHaveLength(1)
    expect(ra[0].daLam.get('Q5')).toBe(3)
    expect(ra[0].lenBang.soLan).toBe(2)
    expect(ra[1].chuyenDe).toEqual([])
    expect(ra[1].daLam.size).toBe(0)
  })
})

describe('Bảng chữ cho thầy', () => {
  it('in số em, số phút và danh sách câu chỉ đọc đáp án', () => {
    const ds = Array.from({ length: 40 }, (_, i) => cau(i + 1, (i % 3) as 0 | 1 | 2))
    const kq = xepBuoiChua(ds, LOP(30))
    const chu = bangChuBuoiChua(kq, 'Ca 543998')
    expect(chu).toContain('GỌI LÊN BẢNG')
    expect(chu).toContain('CHỈ ĐỌC ĐÁP ÁN')
    expect(chu).toContain(`${kq.soEmLenBang} em lên bảng`)
  })
})

describe('QUÉT DIỆN RỘNG — sàn 20 em phải đứng vững', () => {
  // Thầy viết hoa: "BẠN PHẢI LÀM ĐƯỢC ĐIỀU NÀY BẮT BUỘC". Một ca mẫu chạy được
  // chưa đủ để nói thế. Quét mọi tổ hợp hợp lý của buổi chữa thật.
  it('mọi buổi có ĐỦ CÂU và ĐỦ EM đều đạt sàn, không buổi nào vượt ngân sách', () => {
    const truot: string[] = []
    let soCa = 0
    for (const soEm of [20, 25, 30, 36, 40]) {
      for (const soCau of [24, 28, 30, 36, 40, 50]) {
        for (const tiLeHai of [0, 0.1, 0.25, 0.4, 0.6, 0.8, 1]) {
          for (const soBatBuoc of [0, 2, 4, 6]) {
            soCa++
            const soHai = Math.round(soCau * tiLeHai)
            const ds: CauVaoXep[] = Array.from({ length: soCau }, (_, i) =>
              cau(i + 1, (i < soHai ? 2 : i % 2 === 0 ? 1 : 0) as 0 | 1 | 2, i < soBatBuoc),
            )
            const kq = xepBuoiChua(ds, LOP(soEm))
            if (kq.tongGiay > kq.nganSach) truot.push(`VƯỢT GIỜ: ${soEm} em · ${soCau} câu · ${soHai} câu 2 sao · ${kq.tongGiay}/${kq.nganSach}s`)

            // PHẠM VI BẮT BUỘC ĐẠT SÀN — chốt bằng SỐ ĐO CỦA KHO, không phải
            // bằng con số dễ chịu. Đếm 14/09 trên 128 tờ đề trong kho:
            //   0 sao 48% · 1 sao 30% · 2 sao 21%
            //   tờ đậm nhất 54% câu 2 sao · KHÔNG tờ nào quá 60%
            // Trên 60% câu 2 sao là ca không có trong kho, và cũng vô nghiệm
            // thật: 20 em × 300 giây = 6.000 giây, vượt hẳn 4.920 giây của 90
            // phút. Buổi như thế thuật toán phải BÁO THIẾU, không được bịa em.
            const trongPhamVi = soCau >= 20 && soEm >= 20 && tiLeHai <= 0.6
            if (trongPhamVi && kq.soEmLenBang < 20) {
              truot.push(`THIẾU EM: ${soEm} em · ${soCau} câu · ${soHai} câu 2 sao · ${soBatBuoc} bắt buộc → ${kq.soEmLenBang} em`)
            }
            if (!kq.datSan && !kq.thieu) truot.push(`IM LẶNG: chưa đạt sàn mà không nói lý do (${soEm} em · ${soCau} câu)`)
            const sbdLen = kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.em?.sbd)
            // LUẬT MỚI (thầy chốt 25/09): CHO LƯỢT THÊM, nhưng (a) không em nào quá `TRAN_LUOT_MOI_EM` lượt,
            // (b) KHÔNG ai được lượt thứ hai khi còn một em có mặt CHƯA có lượt nào (không "một em lên bốn lượt").
            const demLen = new Map<string, number>()
            for (const s of sbdLen) demLen.set(s!, (demLen.get(s!) ?? 0) + 1)
            const quaTran = [...demLen.entries()].find(([, n]) => n > TRAN_LUOT_MOI_EM)
            if (quaTran) truot.push(`QUÁ TRẦN LƯỢT: ${soEm} em · ${soCau} câu · ${quaTran[0]} ${quaTran[1]} lượt`)
            const lanThuHai = sbdLen.findIndex((s, i) => sbdLen.slice(0, i).includes(s!))
            if (lanThuHai >= 0) {
              const daCoLuot = new Set(sbdLen.slice(0, lanThuHai)).size
              if (daCoLuot < Math.min(soEm, soCau)) truot.push(`LƯỢT THÊM QUÁ SỚM: ${soEm} em · ${soCau} câu · mới ${daCoLuot} em có lượt`)
            }
          }
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log(`[xếp buổi chữa] quét ${soCa} tổ hợp · trượt ${truot.length}`)
    expect(truot.slice(0, 5)).toEqual([])
    expect(soCa).toBeGreaterThan(500)
  }, 60000)

  it('câu bắt buộc luôn được chữa trước, kể cả khi ngân sách chật', () => {
    for (const soBatBuoc of [1, 3, 5, 8, 10]) {
      const ds = Array.from({ length: 30 }, (_, i) => cau(i + 1, i < soBatBuoc ? 2 : 0, i < soBatBuoc))
      const kq = xepBuoiChua(ds, LOP(30))
      const daChua = new Set(kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.cau.id))
      for (let i = 1; i <= soBatBuoc; i++) {
        expect(daChua.has(`Q${i}`), `câu bắt buộc Q${i} phải được chữa (${soBatBuoc} câu bắt buộc)`).toBe(true)
      }
    }
  })

  it('ngân sách 60 phút thì nói thẳng là hết giờ, không bịa em', () => {
    const hep = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 60 }
    const ds = Array.from({ length: 40 }, (_, i) => cau(i + 1, 2))
    const kq = xepBuoiChua(ds, LOP(30), { cauHinh: hep })
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
    if (!kq.datSan) expect(kq.thieu?.viSao).toContain('ngân sách')
  })
})
