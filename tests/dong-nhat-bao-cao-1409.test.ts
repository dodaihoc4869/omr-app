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
import { anhCuaCau, anhPhuongAn } from '../src/components/KhoiCauSai'
import { danhGiaBai } from '../src/lib/danh-gia-bai'
import { gomCaChoBieuDo } from '../src/components/TheTienBo'

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

describe('THẺ MỨC TIẾN BỘ — đúng một thẻ, đúng một biểu đồ, ở mọi báo cáo', () => {
  // 14/09 thầy bảo bỏ thẻ ấy vì màn Ca thi chèn thêm MỘT thẻ nữa gần trùng tên,
  // thành hai thẻ "Mức tiến bộ" / "Mức độ tiến bộ" nằm sát nhau. Sau đó thầy
  // chốt lại: giữ ĐÚNG MỘT thẻ, vẽ biểu đồ điểm các ca và đánh giá mức tiến bộ,
  // đồng bộ vào mọi báo cáo. Phép kiểm này khoá cả hai vế: có thẻ, và chỉ một.
  const HS = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
  const MON = doc('src/screens/ExamMonitorScreen.tsx')

  it('cả hai cổng đều có thẻ, và vẽ bằng CÙNG một khối', () => {
    for (const [t, ten] of [[HS, 'HS'], [PH, 'PH']] as const) {
      expect(t, ten).toContain("'tien_bo'")
      expect(t, ten).toContain('<span>Mức tiến bộ</span>')
      expect(t, ten).toContain('<TheTienBo')
      // Không cổng nào tự vẽ lại biểu đồ hay tự tính tiến bộ.
      expect(t, ten).not.toContain('BieuDoTienBoGoogle')
      expect(t, ten).not.toContain('phanTichTienBo')
    }
  })

  it('màn Ca thi KHÔNG chèn thẻ nào nữa — báo cáo đúng BỐN thẻ ở mọi app', () => {
    // Thầy chốt 14/09: "mỗi báo cáo chỉ có 4 phần ... Còn lại xoá hết."
    expect(MON).not.toContain('extraTabs')
    expect(MON).not.toContain("label: 'Hồ sơ em'")
    expect(MON).not.toContain("label: 'Mức độ tiến bộ'")
    expect(MON).not.toContain('BieuDoTienBoGoogle')
    // Và cơ chế thẻ phụ bị gỡ khỏi chính component báo cáo, nên không app nào
    // chèn thêm được nữa.
    expect(HS).not.toContain('extraTabs')
    expect(HS).not.toContain('ExtraTabItem')
  })

  it('BỐN THẺ BÁO CÁO giống hệt nhau ở cả hai cổng', () => {
    for (const t of [HS, PH]) {
      expect(t).toContain('Câu sai cần chữa')
      expect(t).toContain('Mức độ nhận thức')
      expect(t).toContain('Mức tiến bộ')
    }
  })

  it('ca ĐANG MỞ luôn có mặt trên biểu đồ, kể cả khi lịch sử chưa về', () => {
    const t = doc('src/components/TheTienBo.tsx')
    expect(t).toContain('if (!ds.some((c) => c.maCa === dangMo.maCa))')
    // Và điểm vừa chấm tại chỗ đè lên bản máy chủ.
    expect(t).toContain('diemDe')
  })

  it('gom lịch sử: đủ ca, đúng thứ tự dữ liệu, không mất ca đang mở', () => {
    const ca = gomCaChoBieuDo(
      [{ maCa: 'A', tenCa: 'Ca A', nopLuc: '2026-09-01T00:00:00Z', tong: 5 }],
      { maCa: 'B', tenCa: 'Ca B', ngayThi: '2026-09-02T00:00:00Z', diem: 7 },
    )
    expect(ca).toHaveLength(2)
    expect(ca.map((c) => c.maCa)).toEqual(['A', 'B'])
    expect(ca[1].tong).toBe(7)
  })

  it('lịch sử đã có ca đang mở thì KHÔNG thêm lần hai', () => {
    const ca = gomCaChoBieuDo(
      [{ maCa: 'B', tenCa: 'Ca B', nopLuc: '2026-09-02T00:00:00Z', tong: 7 }],
      { maCa: 'B', tenCa: 'Ca B', diem: 7 },
    )
    expect(ca).toHaveLength(1)
  })
})

describe('ẢNH TRONG CÂU SAI vẽ đúng chuẩn của phiếu HTML', () => {
  const K = doc('src/components/KhoiCauSai.tsx')

  it('KHÔNG ép ảnh rộng bằng cả khung — ảnh nhỏ giữ nguyên cỡ thật', () => {
    // `.q-hinh` của html-phieu.ts: block · max-width:100% · height:auto · căn giữa.
    expect(K).toContain('block mx-auto max-w-full h-auto')
    expect(K).not.toContain('className="w-full max-w-full h-auto rounded-xl')
  })

  it('ảnh cao quá thì thu lại vừa khung, KHÔNG cắt xén', () => {
    expect(K).toContain('max-h-[420px]')
    expect(K).toContain('object-contain')
  })

  it('bảng số liệu cũng theo chuẩn: hàng đầu là tiêu đề, cuộn ngang được', () => {
    expect(K).toContain('<thead>')
    expect(K).toContain('c.table.slice(1)')
    expect(K).toContain('overflow-x-auto')
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

describe('ảnh của PHƯƠNG ÁN phải nằm ở phương án, không dồn lên đầu câu', () => {
  // Thầy bắt được 14/09: câu có bốn phương án bằng ảnh thì báo cáo dồn cả bốn
  // ảnh lên đầu câu, còn bốn dòng phương án chỉ còn chữ "(xem hình phương án
  // A)". Em không biết ảnh nào là của phương án nào.
  const A = 'data:image/png;base64,AAAAAAAAAAAAAA'
  const B = 'data:image/png;base64,BBBBBBBBBBBBBB'
  const THAN = 'data:image/png;base64,TTTTTTTTTTTTTT'

  it('`choiceImgs` là ảnh THAY CHỮ của đúng phương án đó', () => {
    const c = { phan: 'I', choiceImgs: [A, B, undefined, undefined] }
    expect(anhPhuongAn(c, 'I', 0)).toBe(A)
    expect(anhPhuongAn(c, 'I', 1)).toBe(B)
    expect(anhPhuongAn(c, 'I', 2)).toBe('')
  })

  it('ảnh đặt SAU một phương án cũng về đúng phương án ấy', () => {
    const c = { phan: 'I', hinhAnh: [{ src: A, viTri: 'sau_pa_A' }, { src: B, viTri: 'sau_pa_C' }] }
    expect(anhPhuongAn(c, 'I', 0)).toBe(A)
    expect(anhPhuongAn(c, 'I', 2)).toBe(B)
    expect(anhPhuongAn(c, 'I', 1)).toBe('')
  })

  it('ý a–d của phần II cũng vậy', () => {
    expect(anhPhuongAn({ phan: 'II', ideaImgs: [undefined, A] }, 'II', 1)).toBe(A)
    expect(anhPhuongAn({ phan: 'II', hinhAnh: [{ src: B, viTri: 'sau_y_c' }] }, 'II', 2)).toBe(B)
  })

  it('THÂN CÂU chỉ lấy ảnh của thân câu — ảnh phương án KHÔNG trôi lên đầu', () => {
    const c = {
      phan: 'I',
      thanCauImg: THAN,
      choiceImgs: [A, B, undefined, undefined],
      hinhAnh: [{ src: A, viTri: 'sau_pa_A' }, { src: THAN, viTri: 'sau_de' }],
    }
    const than = anhCuaCau(c)
    expect(than).toEqual([THAN])
    expect(than).not.toContain(A)
    expect(than).not.toContain(B)
  })

  it('máy chủ trả riêng ba trường ảnh, không gộp làm một', () => {
    const srv = doc('server/src/goi-cu.ts')
    expect(srv).toContain('thanCauImg: fullQ ? fullQ.thanCauImg : undefined')
    expect(srv).toContain('choiceImgs: fullQ && Array.isArray(fullQ.choiceImgs)')
    expect(srv).toContain('ideaImgs: fullQ && Array.isArray(fullQ.ideaImgs)')
    // Không còn gộp ảnh thân câu vào `imageDataUrl`.
    expect(srv).not.toContain('fullQ.imageDataUrl || fullQ.thanCauImg')
  })

  it('màn hình vẽ ảnh phương án thay cho chữ "(xem hình…)"', () => {
    const K = doc('src/components/KhoiCauSai.tsx')
    expect(K).toContain("anhPhuongAn(c, 'I', i)")
    expect(K).toContain("anhPhuongAn(c, 'II', i)")
    expect(K).toContain('alt={`Phương án ${k}`}')
  })
})
