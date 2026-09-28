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
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { baoCaoCuaEm } from '../src/lib/bao-cao-cua-em'
import { nguonBaoCaoEmMoi } from './_bao-cao-em-moi'
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

// 28/09: hộp báo cáo cũ `BaoCaoCaThiHocSinhModal` + hàm gói `goiBaiThi` (lib/goi-bao-cao) ĐÃ XOÁ (thầy cho phép) — mọi lối
// mở báo cáo của em đi qua BẢN MỚI (BaoCaoCaCuaEm → baoCaoCuaEm → BaoCaoChiTiet chế độ em). LUẬT "một ca một bộ số ở mọi app"
// giữ nguyên, kiểm trên bản mới: số từ gói máy chủ của em PHẢI khớp số đếm từ bảng chấm bên máy thầy (`demKetQua`).
/** Bảng chấm Test4 dưới dạng `/hs/cau-da-thi` của em. */
const TEST4_CAU_EM = TEST4_BANG_CHAM.map((c, i) => ({ ...c, maCa: '814335', qid: `q${i}`, soCau: i + 1 }))

describe('một gói, một con số — ba app phải khớp', () => {
  it('gói máy chủ của em và bảng chấm máy thầy ra ĐÚNG cùng bộ số', () => {
    const em = baoCaoCuaEm(TEST4_MAY_CHU, TEST4_CAU_EM)
    const thay = demKetQua(TEST4_BANG_CHAM)
    expect(em.tongCau).toBe(thay.tongCau)
    expect(em.dung).toBe(thay.soDung)
    expect(em.motPhan).toBe(thay.soDungMotPhan)
    expect(em.cauXemLai.length).toBe(thay.soCanKhacPhuc)
  })

  it('ca Test4: 12 câu cần khắc phục, KHÔNG phải 10', () => {
    expect(baoCaoCuaEm(TEST4_MAY_CHU, TEST4_CAU_EM).cauXemLai).toHaveLength(12)
  })

  it('chưa tải được câu thì vẫn chép NGUYÊN số máy chủ, không tự tính cái nào', () => {
    const g = baoCaoCuaEm(TEST4_MAY_CHU, null)
    expect(g.tongCau).toBe(12)
    expect(g.dung).toBe(0)
    expect(g.motPhan).toBe(2)
    expect(g.tong).toBe(2)
  })

  it('ca CHƯA CHẤM thì GIẤU số đếm, không in 0/0', () => {
    const g = baoCaoCuaEm({ maCa: '1', tong: null }, null)
    expect(g.dung).toBeNull()
    expect(g.tongCau).toBeNull()
  })
})

describe('không chỗ gọi nào được tự nhặt trường nữa', () => {
  // Xem điểm bản 2 (thầy chốt 21/09): màn Theo dõi ca của THẦY đổi sang trang báo cáo một em mới (`BaoCaoMotEm`), không còn dùng hộp báo cáo
  // chung nên không còn gọi `goiBaiThi`. Nó vẫn đếm bằng ĐÚNG luật chung `demKetQua` (kiểm ở test dưới), không đếm kiểu khác.
  // SỬA CÓ CHỦ Ý 28/09 (bản vẽ ca thi): màn Học sinh của THẦY không mở hộp báo cáo chung nữa — trỏ về Báo cáo chi tiết › Từng em (moChiTietCa(maCa, sbd)).
  const goi = ['src/screens/StudentPortalScreen.tsx']
  const chiaSe = ['src/screens/ExamMonitorScreen.tsx', 'src/lib/bao-cao-mot-em.ts']

  it('cổng học sinh và màn thi mở BÁO CÁO BẢN MỚI (BaoCaoCaCuaEm → BaoCaoChiTiet chế độ em), không còn hộp báo cáo cũ', () => {
    // 28/09 thầy: "báo cáo chi tiết đã sửa bản mới rồi, thay thế hết bằng bản mới".
    for (const f of [...goi, 'src/screens/ExamTakeScreen.tsx']) {
      expect(doc(f), f).toContain("import('../components/ca-thi/BaoCaoCaCuaEm')")
      expect(doc(f), f).not.toContain('BaoCaoCaThiHocSinhModal')
      expect(doc(f), f).not.toContain('goiBaiThi(')
    }
    expect(doc('src/components/ca-thi/BaoCaoCaCuaEm.tsx')).toContain('cheDo="hs"')
    expect(doc('src/screens/HocSinhScreen.tsx')).not.toContain('BaoCaoCaThiHocSinhModal')
    // 28/09 (thầy cho xoá): bản cũ và hàm gói tay của nó không còn tồn tại — không ai lỡ nối lại được.
    expect(existsSync(resolve(__dirname, '..', 'src/components/BaoCaoCaThiHocSinhModal.tsx'))).toBe(false)
    expect(existsSync(resolve(__dirname, '..', 'src/lib/goi-bao-cao.ts'))).toBe(false)
    expect(doc('src/screens/HocSinhScreen.tsx')).toContain('moChiTietCa(caBaoCao.maCa, hoSo.em.sbd)')
  })

  it('trang báo cáo một em của thầy đếm câu bằng `demKetQua` dùng chung, và màn Theo dõi ca không tự đếm', () => {
    expect(doc('src/lib/bao-cao-mot-em.ts')).toContain("import { demKetQua, soYDungPhanII } from './dem-ket-qua'")
    expect(doc('src/lib/bao-cao-mot-em.ts')).toContain('demKetQua(rows)')
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('BaoCaoCaThiHocSinhModal')
  })

  it('không chỗ nào còn tự tính số câu sai bằng phép trừ', () => {
    for (const f of [...goi, ...chiaSe]) {
      const t = doc(f)
      expect(t, f).not.toMatch(/Math\.max\(0,\s*caBaoCao\.tongCau\s*-\s*caBaoCao\.soCauDung\)/)
      expect(t, f).not.toMatch(/soCauSai:\s*Math\.max/)
    }
  })
})

describe('khắc phục gộp cả bỏ trống lẫn phần II chưa trọn ý', () => {
  const HS = nguonBaoCaoEmMoi()
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')

  it('nút "Làm lại … câu cần chữa" của em đếm MỌI câu không đúng trọn (sai · đúng một phần · bỏ trống)', () => {
    expect(HS).toContain('Làm lại {b.cauXemLai.length} câu cần chữa')
    expect(HS).toContain(".filter((r) => r.dungSai !== true)")
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
    //
    // 15-09 thêm cờ `chiSai` cho Tháp Tri Thức (tháp lấy MỌI câu em đã thi).
    // Mệnh đề lọc câu sai nay nằm trong nhánh `chiSai ? … : ''` — vẫn còn
    // nguyên, chỉ là có thể tắt cho đúng một lệnh. Phép kiểm đổi theo, nhưng
    // vẫn khoá đúng cái phải khoá: mặc định là LỌC CÂU SAI.
    expect(doc('server/src/goi-cu.ts')).toContain("chiSai ? ' AND COALESCE(c.dung_sai, 0) = 0' : ''")
    expect(doc('server/src/goi-cu.ts')).toContain('const chiSai = b.chiSai !== false')
  })
})

describe('ghi rõ tính điểm cho mấy ý', () => {
  it('biểu điểm theo ý nằm trong khối dùng chung, nên hai cổng đều có', () => {
    const k = doc('src/components/KhoiCauSai.tsx')
    expect(k).toContain('chuDiemTheoY(')
    expect(k).toContain('soYDungPhanII(')
    // Cổng phụ huynh vẽ danh sách câu sai bằng đúng khối ấy. (Báo cáo em bản mới 28/09 vẽ câu cần chữa bằng khuôn
    // Câu đã làm `CauCanChua`/TheCau — kiểm ở tests/hs-lich-su-ca-2809.)
    expect(doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')).toContain('<DongCauSai key=')
  })
})

describe('THẺ MỨC TIẾN BỘ — đúng một thẻ, đúng một biểu đồ, ở mọi báo cáo', () => {
  // 14/09 thầy bảo bỏ thẻ ấy vì màn Ca thi chèn thêm MỘT thẻ nữa gần trùng tên,
  // thành hai thẻ "Mức tiến bộ" / "Mức độ tiến bộ" nằm sát nhau. Sau đó thầy
  // chốt lại: giữ ĐÚNG MỘT thẻ, vẽ biểu đồ điểm các ca và đánh giá mức tiến bộ,
  // đồng bộ vào mọi báo cáo. Phép kiểm này khoá cả hai vế: có thẻ, và chỉ một.
  // 28/09: báo cáo em bản mới (bản vẽ thầy chốt) thay thẻ tiến bộ bằng dòng "± điểm so với ca trước" — phần thẻ chỉ còn ở cổng phụ huynh.
  const HS = nguonBaoCaoEmMoi()
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
  const MON = doc('src/screens/ExamMonitorScreen.tsx')

  it('cổng phụ huynh có thẻ, vẽ bằng khối dùng chung; báo cáo em không tự vẽ biểu đồ/tự tính tiến bộ', () => {
    expect(HS).not.toContain('BieuDoTienBoGoogle')
    expect(HS).not.toContain('phanTichTienBo')
    for (const [t, ten] of [[PH, 'PH']] as const) {
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

  it('BỐN THẺ BÁO CÁO của cổng phụ huynh', () => {
    for (const t of [PH]) {
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
  const HS = nguonBaoCaoEmMoi()
  const PH = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')
  const KHOI = doc('src/components/KhoiCauSai.tsx')

  it('mỗi cổng vẽ câu sai bằng khối DÙNG CHUNG, không tự dựng lời giải', () => {
    expect(PH).toContain('<DongCauSai key={c.qid || i} c={c} stt={c.soCau || i + 1} />')
    // báo cáo em bản mới: khuôn Câu đã làm (CauCanChua → TheCau)
    expect(HS).toContain('<CauCanChua c={c.cau} stt={c.soCau} />')
    expect(HS).not.toContain('chuanHoaLoiGiaiCau')
    expect(PH).not.toContain('chuanHoaLoiGiaiCau')
    expect(HS).not.toContain('cauSaiMoRong')
  })

  it('KHÔNG còn khối chữ dài ngoằng cạnh nút mở đề', () => {
    // Trên điện thoại nó rơi thành mỗi dòng một chữ, cao gần hết màn hình.
    expect(HS).not.toContain('Mở lại đề thi gốc để xem lại bài làm')
    expect(HS).not.toContain('các đáp án đã chọn và thời gian làm từng câu')
    expect(HS).toContain('Xem đề và lời giải cả ca')
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

  it('cổng phụ huynh dùng hàm xếp loại chung; báo cáo em bản mới KHÔNG tự viết nhận xét/xếp loại riêng', () => {
    expect(doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')).toContain('danhGiaBai(diem, soKhacPhuc, tongCau)')
    expect(nguonBaoCaoEmMoi()).not.toMatch(/xepLoai|thongDiep|classify\(/)
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
