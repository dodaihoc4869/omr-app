// TRỢ LÝ TRONG APP — định nghĩa hoàn thành của TRO-LY-TRONG-APP.md.
//
// Hai tầng thuần (hiểu câu hỏi, dựng câu trả lời) kiểm được hết ở đây, không
// cần trình duyệt. Số liệu so BẰNG SỐ với dữ liệu giả nạp vào, không so mắt.
//
// Phép kiểm quan trọng nhất là mục "không bịa": câu ngoài phạm vi phải ra
// `khong_hieu`, và câu trả lời lúc đó KHÔNG được chứa một con số nào.
import { describe, expect, it } from 'vitest'
import type { CaTomTat, EmTomTat, HoSoEm, LuotThiRow, ParentMessage } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'
import type { CauHoiCuaEm } from '../src/lib/hoi-bai'
import { CAU_GOI_Y, chuanHoaHoi, docChuyenDe, docMaCa, docYDinh } from '../src/lib/tro-ly/y-dinh'
import { dungTraLoi, khongHieu, timEm, TRAN_DONG, type DuLieu } from '../src/lib/tro-ly/tra-loi'

const MOC = Date.parse('2026-09-06T10:00:00+07:00')

function ca(maCa: string, tenCa: string, trangThai: CaTomTat['trangThai'], moLuc: string, lop = '12A1'): CaTomTat {
  return {
    maCa, tenCa, lop, thoiGianPhut: 45, moLuc, batDau: '', hetHanVao: '', trangThai,
    phamVi: 'tudo' as CaTomTat['phamVi'], congBo: 'ngay' as CaTomTat['congBo'], loai: 'thi' as CaTomTat['loai'],
    hanNop: '', lenBang: true,
  } as CaTomTat
}

function luot(sbd: string, hoTen: string, trangThai: string, tong: number | null): LuotThiRow {
  return {
    sbd, hoTen, lanThu: 1, trangThai: trangThai as LuotThiRow['trangThai'], vaoLuc: '2026-09-06T02:00:00Z',
    hetGioLuc: '', nopLuc: '', soLanRoiMan: 0, tongGiayRoiMan: 0, diemI: null, diemII: null, diemIII: null,
    tong, duyetBoi: '', duyetLuc: '', ghiChu: '', dapAn: null, integrity: null, giayCau: null,
  }
}

function em(sbd: string, hoTen: string, diem: number | null): EmTomTat {
  return { sbd, hoTen, namSinh: '', lop: '12A1', trangThai: '', soCa: 3, diemGanNhat: diem, caGanNhat: 'CA1', nopGanNhat: '' }
}

function cauQ(chuyenDe: string): TeacherExamSource['phanI'][number] {
  return { id: 'x', text: 'x', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe } as TeacherExamSource['phanI'][number]
}

function hoiCuaEm(maCa: string, sbd: string, daChua: boolean, tenCa = 'Ca thử'): CauHoiCuaEm {
  return { maCa, tenCa, sbd, hoTen: `Em ${sbd}`, qids: ['q1', 'q2'], ghiChu: '', guiLuc: '2026-09-06T01:00:00Z', daChua, chuaLuc: '' }
}

/** Có con số nào trong câu trả lời không — dùng cho phép kiểm chống bịa. */
function coSo(t: { chu: string; dong: string[] }): boolean {
  return /\d/.test(t.chu + ' ' + t.dong.join(' '))
}

describe('Hiểu câu hỏi — mỗi nhóm ít nhất ba cách hỏi', () => {
  it('bỏ dấu và thường hoá đúng', () => {
    expect(chuanHoaHoi('Ca nào đang mở?')).toBe('ca nao dang mo')
    expect(chuanHoaHoi('  ĐIỂM   cao nhất ')).toBe('diem cao nhat')
    expect(chuanHoaHoi('')).toBe('')
  })

  it('ca đang mở', () => {
    for (const q of ['Ca nào đang mở?', 'ca nao dang mo', 'còn ca nào mở không']) {
      expect(docYDinh(q).loai).toBe('ca_dang_mo')
    }
  })

  it('ca gần đây', () => {
    for (const q of ['hôm nay có mấy ca', 'bao nhieu ca hom nay', 'danh sách ca']) {
      expect(docYDinh(q).loai).toBe('ca_gan_day')
    }
  })

  it('ai chưa nộp', () => {
    for (const q of ['ca ABC123 ai chưa nộp', 'em nao chua nop ca ABC123', 'ca ABC123 còn ai chưa làm']) {
      const y = docYDinh(q)
      expect(y.loai).toBe('ca_chua_nop')
      expect(y.maCa).toBe('ABC123')
    }
  })

  it('điểm của một ca', () => {
    for (const q of ['điểm ca ABC123', 'ca ABC123 diem cao nhat', 'kết quả ca ABC123']) {
      expect(docYDinh(q).loai).toBe('ca_diem')
    }
  })

  it('em dưới ngưỡng điểm, đọc đúng ngưỡng', () => {
    expect(docYDinh('ai dưới 5 điểm').loai).toBe('em_diem_thap')
    expect(docYDinh('ai duoi 6.5 diem').nguongDiem).toBe(6.5)
    expect(docYDinh('em nào dưới 4 điểm').nguongDiem).toBe(4)
    // Không ghi ngưỡng thì mặc định 5, KHÔNG đoán số khác.
    expect(docYDinh('em nào yếu').nguongDiem).toBe(5)
  })

  it('hồ sơ một em, theo tên và theo số báo danh', () => {
    expect(docYDinh('SBD 100001 điểm thế nào')).toMatchObject({ loai: 'em_ho_so', em: '100001' })
    expect(docYDinh('em Minh điểm thế nào')).toMatchObject({ loai: 'em_ho_so', em: 'Minh' })
    expect(docYDinh('em Nguyễn Văn Minh yếu gì')).toMatchObject({ loai: 'em_ho_so' })
  })

  it('kho đề', () => {
    expect(docYDinh('kho có bao nhiêu câu').loai).toBe('kho_tong_quan')
    expect(docYDinh('ngân hàng có bao nhiêu đề').loai).toBe('kho_tong_quan')
    expect(docYDinh('kho de co bao nhieu cau ester')).toMatchObject({ loai: 'kho_theo_chuyen_de', chuyenDe: 'Ester – lipid' })
    expect(docYDinh('còn câu nào nghi đáp án sai').loai).toBe('kho_nghi_dap_an')
  })

  it('học sinh hỏi và tin nhắn', () => {
    for (const q of ['ca nào có em chờ Thầy chữa', 'con em nao chua chua', 'học sinh hỏi']) {
      expect(docYDinh(q).loai).toBe('hoi_bai')
    }
    expect(docYDinh('có tin nhắn mới không').loai).toBe('tin_nhan')
  })

  it('HỎI CÁCH LÀM thắng hỏi dữ liệu — "mở ca thế nào" không phải danh sách ca', () => {
    expect(docYDinh('mở ca thế nào')).toMatchObject({ loai: 'huong_dan', muc: 'mo_ca' })
    expect(docYDinh('mở app bằng vân tay ở đâu')).toMatchObject({ loai: 'huong_dan', muc: 'van_tay' })
    expect(docYDinh('nạp đề mới làm sao')).toMatchObject({ loai: 'huong_dan', muc: 'nap_de' })
  })

  it('chuyên đề khớp từ khoá DÀI trước', () => {
    expect(docChuyenDe('can bang hoa hoc')).toBe('Cân bằng hoá học')
    expect(docChuyenDe('tinh bot')).toBe('Carbohydrate')
  })

  it('mã ca đọc từ câu gốc, KHÔNG nhầm với con số trong câu', () => {
    expect(docMaCa('ca ABC123 ai chưa nộp')).toBe('ABC123')
    expect(docMaCa('ai dưới 5 điểm')).toBeUndefined()
    expect(docMaCa('có 12 em chưa nộp')).toBeUndefined()
  })
})

describe('KHÔNG BỊA — điều quan trọng nhất', () => {
  it('câu ngoài phạm vi ra khong_hieu', () => {
    for (const q of ['hôm nay trời mưa không', 'giải giúp tôi câu này', 'abc xyz', '']) {
      expect(docYDinh(q).loai).toBe('khong_hieu')
    }
  })

  it('câu trả lời lúc không hiểu KHÔNG chứa số liệu nào', () => {
    const t = khongHieu()
    expect(t.khongHieu).toBe(true)
    // Câu dẫn tuyệt đối không có số; phần dưới CHỈ được là câu gợi ý, không
    // được là dữ liệu — đây mới là chỗ dễ bịa.
    expect(/\d/.test(t.chu)).toBe(false)
    expect(t.nguon).toBe('')
    expect(t.dong).toEqual(CAU_GOI_Y)
  })

  it('CHƯA LẤY ĐƯỢC DỮ LIỆU thì nói thẳng, không dựng số', () => {
    const t = dungTraLoi({ loai: 'ca_dang_mo' }, {})
    expect(t.chu).toContain('Chưa lấy được')
    expect(t.dong).toEqual([])
    expect(t.nguon).toBe('')
  })

  it('dữ liệu RỖNG thì nói chưa có, không vỡ', () => {
    expect(dungTraLoi({ loai: 'ca_dang_mo' }, { ca: [] }).chu).toContain('Không có ca nào đang mở')
    expect(dungTraLoi({ loai: 'kho_tong_quan' }, { kho: [] }).chu).toContain('chưa có đề nào')
    expect(dungTraLoi({ loai: 'hoi_bai' }, { cauHoi: [] }).chu).toContain('Chưa em nào gửi câu hỏi')
    expect(dungTraLoi({ loai: 'tin_nhan' }, { tinNhan: [] }).chu).toContain('Hộp thư trống')
  })
})

describe('Trả lời đúng số — so bằng số, không so mắt', () => {
  const DU: DuLieu = {
    bayGio: MOC,
    ca: [ca('CA1', 'Ester lần 1', 'mo', '2026-09-06T01:00:00Z'), ca('CA2', 'Amine', 'dong', '2026-09-06T02:00:00Z'), ca('CU', 'Ca cũ', 'dong', '2026-08-01T02:00:00Z')],
  }

  it('ca đang mở đếm đúng và chỉ lấy ca mở', () => {
    const t = dungTraLoi({ loai: 'ca_dang_mo' }, DU)
    expect(t.chu).toContain('Đang mở 1 ca')
    expect(t.dong).toHaveLength(1)
    expect(t.dong[0]).toContain('Ester lần 1')
  })

  it('hôm nay đếm đúng số ca trong ngày, bỏ ca cũ', () => {
    const t = dungTraLoi({ loai: 'ca_gan_day' }, DU)
    expect(t.chu).toContain('Hôm nay có 2 ca')
    expect(t.dong.some((d) => d.includes('Ca cũ'))).toBe(false)
  })

  it('ai chưa nộp — đếm đúng, ca đã nộp hết thì nói hết', () => {
    const luots = [luot('1', 'A', 'da_nop', 8), luot('2', 'B', 'dang_lam', null), luot('3', 'C', 'khoa', 5)]
    const t = dungTraLoi({ loai: 'ca_chua_nop' }, { caDangXem: DU.ca![0], luot: luots })
    expect(t.chu).toContain('còn 1/3 em chưa nộp')
    expect(t.dong).toHaveLength(1)
    expect(t.dong[0]).toContain('B')

    const het = dungTraLoi({ loai: 'ca_chua_nop' }, { caDangXem: DU.ca![0], luot: [luot('1', 'A', 'da_nop', 8)] })
    expect(het.chu).toContain('cả 1 em đã nộp')
  })

  it('điểm của ca — trung bình, cao nhất, thấp nhất tính đúng', () => {
    const luots = [luot('1', 'A', 'da_nop', 8), luot('2', 'B', 'da_nop', 4), luot('3', 'C', 'dang_lam', null)]
    const t = dungTraLoi({ loai: 'ca_diem' }, { caDangXem: DU.ca![0], luot: luots })
    expect(t.chu).toContain('2 bài đã chấm')
    expect(t.chu).toContain('trung bình 6')
    expect(t.chu).toContain('cao nhất 8')
    expect(t.chu).toContain('thấp nhất 4')
    // Xếp từ cao xuống thấp.
    expect(t.dong[0]).toContain('A')
    expect(t.dong[1]).toContain('B')
  })

  it('ai dưới ngưỡng — lọc đúng, xếp thấp trước, bỏ em chưa có điểm', () => {
    const ds = [em('1', 'A', 8), em('2', 'B', 3), em('3', 'C', 4.5), em('4', 'D', null)]
    const t = dungTraLoi({ loai: 'em_diem_thap', nguongDiem: 5 }, { em: ds })
    expect(t.chu).toContain('2 em dưới 5 điểm')
    expect(t.dong[0]).toContain('B')
    expect(t.dong[1]).toContain('C')
  })

  it('kho tổng quan đếm đúng số đề, số câu, số chuyên đề', () => {
    const kho: TeacherExamSource[] = [
      { maDe: 'D1', phanI: [cauQ('Ester – lipid'), cauQ('Carbohydrate')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
      { maDe: 'D2', phanI: [cauQ('Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource,
    ]
    const t = dungTraLoi({ loai: 'kho_tong_quan' }, { kho })
    expect(t.chu).toContain('2 đề')
    expect(t.chu).toContain('3 câu')
    expect(t.chu).toContain('2 chuyên đề')
    // Chuyên đề nhiều câu nhất đứng đầu.
    expect(t.dong[0]).toContain('Ester – lipid: 2 câu')
  })

  it('kho theo chuyên đề — không có thì nói không có', () => {
    const kho: TeacherExamSource[] = [{ maDe: 'D1', phanI: [cauQ('Ester – lipid')], phanII: [], phanIII: [] } as unknown as TeacherExamSource]
    expect(dungTraLoi({ loai: 'kho_theo_chuyen_de', chuyenDe: 'Ester – lipid' }, { kho }).chu).toContain('1 câu ở 1 đề')
    expect(dungTraLoi({ loai: 'kho_theo_chuyen_de', chuyenDe: 'Polymer' }, { kho }).chu).toContain('chưa có câu nào')
  })

  it('học sinh hỏi — đếm đúng số em chờ và số ca', () => {
    const ch = [hoiCuaEm('CA1', '1', false), hoiCuaEm('CA1', '2', true), hoiCuaEm('CA2', '1', false)]
    const t = dungTraLoi({ loai: 'hoi_bai' }, { cauHoi: ch })
    expect(t.chu).toContain('2 em đang chờ Thầy chữa, ở 2 ca')
  })

  it('tin nhắn — chỉ đếm tin chưa đọc', () => {
    const tn = [
      { id: '1', sdt: '', hoTenPhuHuynh: '', sbd: '1', lop: '', hoTenHocSinh: 'A', noiDung: 'xin chào', thoiGian: '', daDoc: false, nguoiGui: 'phuhuynh' },
      { id: '2', sdt: '', hoTenPhuHuynh: '', sbd: '2', lop: '', hoTenHocSinh: 'B', noiDung: 'ok', thoiGian: '', daDoc: true, nguoiGui: 'hocsinh' },
    ] as ParentMessage[]
    expect(dungTraLoi({ loai: 'tin_nhan' }, { tinNhan: tn }).chu).toContain('1 tin chưa đọc')
  })

  it('hồ sơ em — xếp chuyên đề sai nhiều nhất lên trước', () => {
    const hs = {
      em: { sbd: '100001', hoTen: 'Nguyễn Văn A', namSinh: '', lop: '12A1' },
      chuyenDe: [
        { ten: 'Ester – lipid', soCau: 10, soSai: 2, tiLeSai: 0.2, xuHuong: 'deu' },
        { ten: 'Carbohydrate', soCau: 10, soSai: 8, tiLeSai: 0.8, xuHuong: 'xuong' },
      ],
      ca: [{}, {}],
      caGanNhat: { maCa: 'CA1', tenCa: 'Ester lần 1', tong: 6.5 },
      chuyenDeCaGanNhat: [],
      soCauSaiCaGanNhat: 3,
    } as unknown as HoSoEm
    const t = dungTraLoi({ loai: 'em_ho_so' }, { hoSo: hs })
    expect(t.chu).toContain('Nguyễn Văn A')
    expect(t.dong.some((d) => d.includes('Đã làm 2 ca'))).toBe(true)
    const iCarb = t.dong.findIndex((d) => d.startsWith('Carbohydrate'))
    const iEster = t.dong.findIndex((d) => d.startsWith('Ester'))
    expect(iCarb).toBeGreaterThan(-1)
    expect(iCarb).toBeLessThan(iEster)
  })

  it('cắt bớt khi quá dài và NÓI RÕ còn bao nhiêu dòng', () => {
    const nhieu = Array.from({ length: TRAN_DONG + 5 }, (_, i) => em(String(i), `Em ${i}`, 1))
    const t = dungTraLoi({ loai: 'em_diem_thap', nguongDiem: 5 }, { em: nhieu })
    expect(t.dong).toHaveLength(TRAN_DONG + 1)
    expect(t.dong[TRAN_DONG]).toContain('còn 5 dòng nữa')
  })
})

describe('Tìm em', () => {
  const ds = [em('100001', 'Nguyễn Văn Minh', 5), em('100002', 'Trần Minh', 7), em('100003', 'Lê Hoa', 8)]

  it('số báo danh khớp chính xác', () => {
    expect(timEm(ds, '100002').map((e) => e.sbd)).toEqual(['100002'])
  })

  it('tên khớp một phần, không dấu cũng ra', () => {
    expect(timEm(ds, 'minh')).toHaveLength(2)
    expect(timEm(ds, 'Hoa').map((e) => e.sbd)).toEqual(['100003'])
  })

  it('không thấy thì trả rỗng, KHÔNG chọn đại một em', () => {
    expect(timEm(ds, 'Khoa')).toEqual([])
    expect(timEm(ds, '')).toEqual([])
  })
})

describe('Bong bóng nổi dựng đúng cách', () => {
  it('có hai thẻ, mang đúng TÊN thầy đặt, và hộp thư cũ KHÔNG bị gỡ', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const fab = readFileSync(resolve(__dirname, '../src/components/MessagesFab.tsx'), 'utf8')
    expect(fab).toContain('<KhoiTroLy')
    expect(fab).toContain("setThe('thu')")
    // Tên khai MỘT chỗ, đổi tên không phải đi sửa từng nơi.
    expect(fab).toContain("export const TEN_TRO_LY = 'Trợ lý em yêu'")
    expect(fab.split("'Trợ lý em yêu'").length - 1).toBe(1)
    // Hộp thư giữ nguyên đường lấy tin và đánh dấu đã đọc.
    expect(fab).toContain('listParentMessages')
    expect(fab).toContain('markMessagesRead')
  })

  it('mở bong bóng KHÔNG kéo hộp thư ngay — vào thẻ Tin nhắn mới tải', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const fab = readFileSync(resolve(__dirname, '../src/components/MessagesFab.tsx'), 'utf8')
    const moPopup = fab.slice(fab.indexOf('Không kéo (chỉ bấm)'), fab.indexOf('Popup là 1 thẻ nổi'))
    expect(moPopup).not.toContain('load(scriptUrl)')
  })

  it('trợ lý KHÔNG tự chứa luật nhận dạng câu hỏi — một nguồn sự thật', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/components/KhoiTroLy.tsx'), 'utf8')
    expect(man).toContain('docYDinh')
    // Cấm rải từ khoá nhận dạng trong component.
    for (const tu of ['dang mo', 'chua nop', 'kho de', 'tin nhan']) expect(man).not.toContain(tu)
  })
})
