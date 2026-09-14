// BÁO CÁO PHẢI ĐỒNG NHẤT 100% Ở MỌI CHỖ, MỌI APP.
//
// Thầy bắt được 14/09: cùng ca Test4, ba chỗ mở báo cáo ra ba con số khác nhau
//   · "Đúng 0/12 · 2 câu đúng một phần · Sai 10"  (cổng học sinh)
//   · "Đúng 0/12 · Sai 10 · Bỏ trống 2"           (màn Hồ sơ của thầy)
//   · "Đúng 0/12 · Sai 12"                        (một màn khác nữa)
// và nút khắc phục ghi khi thì 10, khi thì 12.
//
// Nguyên nhân gốc: cùng MỘT component báo cáo, nhưng bốn chỗ gọi tự tay nhặt
// từng trường rồi truyền vào — mỗi chỗ nhặt thiếu một kiểu, có chỗ còn tự tính
// `soCauSai = tongCau - soCauDung`.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { goiBaiThi } from '../src/lib/goi-bao-cao'
import { docSoDem } from '../src/components/DongDemCau'
import { demKetQua, type CauDeDem } from '../src/lib/dem-ket-qua'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

/** Gói máy chủ THẬT của ca 814335 "Test4", SBD 12121212, đo ngày 14/09. */
const TEST4_MAY_CHU = {
  maCa: '814335',
  tenCa: 'Test4',
  lanThu: 1,
  nopLuc: '2026-09-14T05:17:45.807Z',
  tong: 2,
  diemI: 0,
  diemII: 2,
  diemIII: 0,
  thoiGianPhut: 5,
  tongCau: 12,
  soCauDung: 0,
  soCauSai: 10,
  soCauDungMotPhan: 2,
  soCauBoTrong: 0,
  soYDungII: 6,
  soYTongII: 8,
}

/** Cùng ca ấy, nhưng đếm từ bảng chấm ở phía máy thầy. */
const TEST4_BANG_CHAM: CauDeDem[] = [
  ...Array.from({ length: 8 }, () => ({ phan: 'I' as const, dapAnChon: 'A', dapAnDung: 'B', dungSai: false })),
  { phan: 'II', dapAnChon: 'SDDS', dapAnDung: 'DDDS', dungSai: false },
  { phan: 'II', dapAnChon: 'DDDS', dapAnDung: 'DDDD', dungSai: false },
  { phan: 'III', dapAnChon: '2', dapAnDung: '6', dungSai: false },
  { phan: 'III', dapAnChon: '3', dapAnDung: '9', dungSai: false },
]

describe('một gói, một con số — ba app phải khớp', () => {
  it('gói máy chủ và bảng chấm máy thầy ra ĐÚNG cùng bộ số', () => {
    const tuMayChu = docSoDem(goiBaiThi(TEST4_MAY_CHU))!
    const tuBangCham = demKetQua(TEST4_BANG_CHAM)
    for (const k of ['tongCau', 'soDung', 'soDungMotPhan', 'soSai', 'soBoTrong', 'soCanKhacPhuc'] as const) {
      expect(tuMayChu[k], k).toBe(tuBangCham[k])
    }
    expect(tuMayChu.yPhanII).toEqual(tuBangCham.yPhanII)
  })

  it('ca Test4: 12 câu cần khắc phục, KHÔNG phải 10', () => {
    expect(docSoDem(goiBaiThi(TEST4_MAY_CHU))!.soCanKhacPhuc).toBe(12)
  })

  it('`goiBaiThi` chép nguyên bảy con số, không tự tính cái nào', () => {
    const g = goiBaiThi(TEST4_MAY_CHU)
    expect(g.tongCau).toBe(12)
    expect(g.soCauDung).toBe(0)
    expect(g.soCauSai).toBe(10)
    expect(g.soCauDungMotPhan).toBe(2)
    expect(g.soCauBoTrong).toBe(0)
    expect(g.soYDungII).toBe(6)
    expect(g.soYTongII).toBe(8)
  })

  it('gói của cổng phụ huynh (tongSoCau) cũng ra đúng con số ấy', () => {
    const { tongCau, ...conLai } = TEST4_MAY_CHU
    const g = goiBaiThi({ ...conLai, tongSoCau: tongCau })
    expect(docSoDem(g)!.soCanKhacPhuc).toBe(12)
  })

  it('ca CHƯA CHẤM thì mọi chỗ đều GIẤU dòng đếm, không chỗ nào in 0/0', () => {
    const g = goiBaiThi({ maCa: '1', tenCa: 'x', tong: null })
    expect(docSoDem(g)).toBeNull()
  })
})

describe('không chỗ gọi nào được tự nhặt trường nữa', () => {
  const goi = [
    'src/screens/StudentPortalScreen.tsx',
    'src/screens/HocSinhScreen.tsx',
    'src/screens/ExamMonitorScreen.tsx',
  ]

  it('cả ba chỗ mở báo cáo đều đi qua `goiBaiThi`', () => {
    for (const f of goi) expect(doc(f), f).toContain('goiBaiThi(')
  })

  it('không chỗ nào còn tự tính số câu sai bằng phép trừ', () => {
    for (const f of goi) {
      const t = doc(f)
      expect(t, f).not.toMatch(/Math\.max\(0,\s*caBaoCao\.tongCau\s*-\s*caBaoCao\.soCauDung\)/)
      expect(t, f).not.toMatch(/soCauSai:\s*Math\.max/)
    }
  })
})

describe('khắc phục gộp cả bỏ trống lẫn phần II chưa trọn ý', () => {
  const HS = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')

  it('nút và tab của cổng học sinh đếm theo `soCanKhacPhuc`', () => {
    expect(HS).toContain('const soKhacPhuc = dem ? dem.soCanKhacPhuc : dsCauSai.length')
    expect(HS).toContain('KHẮC PHỤC NGAY ${soKhacPhuc} CÂU SAI')
    expect(HS).toContain('Câu sai cần chữa ({soKhacPhuc})')
    expect(HS).not.toContain('${soSai} CÂU SAI')
  })

  it('cổng phụ huynh dùng ĐÚNG con số ấy, cùng một chữ', () => {
    expect(PH).toContain('const soKhacPhuc = dem ? dem.soCanKhacPhuc : dsCauSai.length')
    expect(PH).toContain('Câu sai cần chữa ({soKhacPhuc})')
    expect(PH).toContain('Khắc phục {soKhacPhuc} câu sai này')
  })

  it('máy chủ trả sẵn con số ấy, khớp định nghĩa tổng trừ đúng', () => {
    expect(doc('server/src/goi-cu.ts')).toContain('soCanKhacPhuc: d ? Math.max(0, d.tong - d.dung) : null')
  })

  it('danh sách câu sai của máy chủ GỘP cả câu bỏ trống', () => {
    // `COALESCE(dung_sai, 0) = 0` gộp NULL (bỏ trống) và 0 (sai, kể cả phần II
    // đúng một phần). Đúng luật thầy chốt — ở ĐÂY thì giữ nguyên.
    expect(doc('server/src/goi-cu.ts')).toContain('WHERE c.sbd = ? AND COALESCE(c.dung_sai, 0) = 0')
  })
})

describe('ghi rõ tính điểm cho mấy ý', () => {
  it('cả hai cổng đều in biểu điểm theo ý cho câu phần II', () => {
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) {
      expect(doc(f), f).toContain('chuDiemTheoY(')
      expect(doc(f), f).toContain('soYDungPhanII(')
    }
  })
})

describe('mức độ tiến bộ — một biểu đồ duy nhất', () => {
  it('cả hai cổng vẽ bằng BieuDoTienBoGoogle, không màn nào tự vẽ nữa', () => {
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) {
      const t = doc(f)
      expect(t, f).toContain('<BieuDoTienBoGoogle ca={caChoBieuDo} />')
      // Khối tự vẽ cũ đã bỏ hẳn.
      expect(t, f).not.toContain('phanTichTienBo')
    }
  })

  it('ca đang mở luôn có mặt trên biểu đồ, kể cả khi lịch sử chưa về', () => {
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) {
      expect(doc(f), f).toContain("if (!ds.some((c) => c.maCa === baiThi.maCa))")
    }
  })
})
