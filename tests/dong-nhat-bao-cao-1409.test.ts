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
import { anhCuaCau } from '../src/components/KhoiCauSai'
import { danhGiaBai } from '../src/lib/danh-gia-bai'

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
  it('biểu điểm theo ý nằm trong khối dùng chung, nên hai cổng đều có', () => {
    const k = doc('src/components/KhoiCauSai.tsx')
    expect(k).toContain('chuDiemTheoY(')
    expect(k).toContain('soYDungPhanII(')
    // Và cả hai cổng vẽ danh sách câu sai bằng đúng khối ấy.
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) {
      expect(doc(f), f).toContain('<DongCauSai key=')
    }
  })
})

describe('BỎ HẲN thẻ Mức tiến bộ khỏi mọi báo cáo', () => {
  // Thầy chốt 14/09: "bỏ thẻ mức tiến bộ trong báo cáo". Trước đó màn theo dõi
  // ca còn chèn thêm MỘT thẻ "Mức độ tiến bộ" nữa qua `extraTabs`, nên báo cáo
  // mở từ đó có hai thẻ gần trùng tên — đúng cảnh thầy chụp.
  const HS = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
  const MON = doc('src/screens/ExamMonitorScreen.tsx')

  it('không modal nào còn thẻ tiến bộ', () => {
    for (const [t, ten] of [[HS, 'HS'], [PH, 'PH']] as const) {
      expect(t, ten).not.toContain("'tien_bo'")
      expect(t, ten).not.toContain('BieuDoTienBoGoogle')
      expect(t, ten).not.toContain('phanTichTienBo')
    }
  })

  it('màn theo dõi ca không còn thẻ nào tên "tiến bộ" nữa', () => {
    // Thẻ phụ của thầy được giữ (mạnh–yếu, lịch sử ca) nhưng đổi tên đúng bản
    // chất là "Hồ sơ em", và biểu đồ tiến bộ trong đó đã bỏ hẳn.
    expect(MON).toContain("label: 'Hồ sơ em'")
    expect(MON).not.toContain("label: 'Mức độ tiến bộ'")
    expect(MON).not.toContain('BieuDoTienBoGoogle')
  })

  it('BA THẺ BÁO CÁO giống hệt nhau ở cả hai cổng', () => {
    for (const t of [HS, PH]) {
      expect(t).toContain('Câu sai cần chữa')
      expect(t).toContain('Mức độ nhận thức')
    }
  })
})

describe('câu sai hiện đủ đề, ảnh, bốn ý phần II và lời giải chuẩn', () => {
  const HS = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
  const KHOI = doc('src/components/KhoiCauSai.tsx')

  it('cả hai cổng vẽ câu sai bằng CÙNG một khối, cả đầu dòng lẫn thân dòng', () => {
    expect(HS).toContain('<DongCauSai key={c.qid || idx} c={c} stt={c.soCau || idx + 1} />')
    expect(PH).toContain('<DongCauSai key={c.qid || i} c={c} stt={c.soCau || i + 1} />')
    // Không cổng nào còn tự dựng đầu dòng hay lời giải nữa.
    expect(HS).not.toContain('chuanHoaLoiGiaiCau')
    expect(PH).not.toContain('chuanHoaLoiGiaiCau')
    expect(HS).not.toContain('cauSaiMoRong')
  })

  it('KHÔNG còn khối chữ dài ngoằng cạnh nút mở đề', () => {
    // Trên điện thoại nó rơi thành mỗi dòng một chữ, cao gần hết màn hình.
    expect(HS).not.toContain('Mở lại đề thi gốc để xem lại bài làm')
    expect(HS).not.toContain('các đáp án đã chọn và thời gian làm từng câu')
    expect(HS).toContain('Xem đề và lời giải kèm lỗi sai')
  })

  it('khối ấy vẽ đủ ảnh, bảng, bốn ý phần II và trả lời ngắn', () => {
    expect(KHOI).toContain('anhCuaCau')
    expect(KHOI).toContain('<img')
    expect(KHOI).toContain('c.table')
    expect(KHOI).toContain('c.ideas')
    expect(KHOI).toContain("phan === 'III'")
    expect(KHOI).toContain('LoiGiaiCauSai')
  })

  it('nhận ảnh ở mọi kiểu kho đề từng dùng', () => {
    expect(anhCuaCau({ imageDataUrl: 'data:image/png;base64,AAAAAAAAAAAA' })).toHaveLength(1)
    expect(anhCuaCau({ hinhAnh: ['https://vi.du/a.png'] })).toHaveLength(1)
    expect(anhCuaCau({ hinhAnh: 'https://vi.du/b.png' })).toHaveLength(1)
    // Rác thì bỏ, không vẽ thẻ ảnh vỡ.
    expect(anhCuaCau({ hinhAnh: 'x', imageDataUrl: '' })).toHaveLength(0)
    expect(anhCuaCau({})).toHaveLength(0)
  })
})

describe('nhận xét phải đúng với con số của chính bài đó', () => {
  it('bài 10 điểm KHÔNG còn bị khen "thiếu một chút nữa là 10"', () => {
    const d = danhGiaBai(10, 0, 12)
    expect(d.xepLoai).toBe('Trọn điểm')
    expect(d.thongDiep).toContain('làm đúng hết trên 12 câu')
    expect(d.thongDiep).not.toContain('thiếu một chút')
    expect(d.thongDiep).not.toContain('khắc phục')
  })

  it('còn câu phải chữa thì nhận xét nhắc ĐÚNG số câu ấy', () => {
    expect(danhGiaBai(9.5, 2, 12).thongDiep).toContain('2 câu cần chữa')
    expect(danhGiaBai(2, 12, 12).thongDiep).toContain('12 câu cần chữa')
  })

  it('không câu nào dùng dấu chấm than hay lời khen suông', () => {
    for (const [d, c] of [[10, 0], [9.5, 1], [8.2, 3], [7, 5], [5.5, 8], [2, 12]] as const) {
      const t = danhGiaBai(d, c, 12).thongDiep
      expect(t, `${d}/${c}`).not.toContain('!')
      expect(t, `${d}/${c}`).not.toContain('Đừng nản lòng')
      expect(t, `${d}/${c}`).not.toContain('Phong độ đỉnh cao')
    }
  })

  it('chưa biết tổng số câu thì KHÔNG bịa ra', () => {
    expect(danhGiaBai(7, 3, null).thongDiep).not.toContain('trên')
  })

  it('hai cổng dùng chung một hàm xếp loại', () => {
    for (const f of ['src/components/BaoCaoCaThiHocSinhModal.tsx', 'src/components/BaoCaoCaThiPhuHuynhModal.tsx']) {
      expect(doc(f), f).toContain('danhGiaBai(diem, soKhacPhuc, tongCau)')
    }
  })
})
