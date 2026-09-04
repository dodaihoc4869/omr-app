// GÓI DỮ LIỆU BÁO CÁO GỬI PHỤ HUYNH.
//
// Đây là chỗ dữ liệu chấm bài biến thành thứ phụ huynh đọc. Sai ở đây thì phụ
// huynh đọc sai về con mình mà không có cách nào biết, nên test bám đúng hai
// điều: số phải khớp bảng chấm, và thiếu dữ liệu thì mục đó BIẾN MẤT chứ không
// hiện ra với số 0 giả.
import { describe, expect, it } from 'vitest'
import { dungCauSai, dungPhieu, BAN_PHIEU } from '../src/lib/phieu-du-lieu'
import type { ChiTietCauRow, CaCuaEm, HoSoEm } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const bank: TeacherExamSource[] = [
  {
    maDe: '100',
    phanI: [
      {
        id: 'q1',
        text: 'Ester nào sau đây có mùi chuối chín?',
        choices: ['Ethyl acetate', 'Isoamyl acetate', 'Methyl formate', 'Benzyl acetate'],
        correct: 'B',
        chuyenDe: 'Ester – lipid',
        mucDo: 'biet',
        loiGiai: {
          chot: 'Isoamyl acetate cho mùi chuối chín.',
          tungPa: {
            A: { dung: false, viSao: 'Ethyl acetate mùi dứa.' },
            B: { dung: true, viSao: 'Đúng, mùi chuối chín.' },
          },
        },
      },
    ],
    phanII: [
      {
        id: 'q2',
        text: 'Về phản ứng thuỷ phân ester:',
        ideas: ['Trong kiềm là một chiều', 'Trong acid là thuận nghịch', 'Luôn cho alcohol', 'Không cần đun'],
        correct: ['D', 'D', 'S', 'S'],
        chuyenDe: 'Ester – lipid',
        mucDo: 'hieu',
        loiGiai: { chot: 'Thuỷ phân trong kiềm là phản ứng một chiều.' },
      },
    ],
    phanIII: [
      {
        id: 'q3',
        text: 'Tính khối lượng xà phòng thu được.',
        correct: '6,8',
        chuyenDe: 'Ester – lipid',
        mucDo: 'van_dung',
        loiGiai: { chot: 'Bảo toàn khối lượng cho phản ứng xà phòng hoá.', buoc: ['n NaOH = 0,3 mol', 'm = 6,8 tấn'], ketQua: '6,8 tấn' },
      },
    ],
  },
]

const rows: ChiTietCauRow[] = [
  { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: 'Ester – lipid', mucDo: 'biet', dapAnChon: 'A', dapAnDung: 'B', dungSai: false, giay: 12 },
  { phan: 'II', soCau: 1, qid: 'q2', chuyenDe: 'Ester – lipid', mucDo: 'hieu', dapAnChon: 'DSSS', dapAnDung: 'DDSS', dungSai: false, giay: 40 },
  { phan: 'III', soCau: 1, qid: 'q3', chuyenDe: 'Ester – lipid', mucDo: 'van_dung', dapAnChon: '', dapAnDung: '6,8', dungSai: false, giay: 55 },
]

const ca: CaCuaEm = {
  maCa: '743710',
  tenCa: 'Test',
  lop: '12',
  lanThu: 1,
  nopLuc: '2026-09-04T02:20:21.482Z',
  trangThai: 'da_nop',
  diemI: 0.75,
  diemII: 0.95,
  diemIII: 0,
  tong: 1.7,
  hang: 1,
  siSo: 1,
  soLanRoiMan: 0,
}

const hoSo: HoSoEm = {
  em: { sbd: '12121212', hoTen: 'Đỗ Đại Học', namSinh: '1990', lop: '12' },
  chuyenDe: [{ ten: 'Ester – lipid', soCau: 32, soSai: 26, tiLeSai: 0.81, xuHuong: 'xau' }],
  ca: [ca],
  caGanNhat: ca,
  chuyenDeCaGanNhat: [{ ten: 'Ester – lipid', soCau: 3, soSai: 3 }],
  soCauSaiCaGanNhat: 3,
}

describe('dungCauSai', () => {
  const cs = dungCauSai(rows, bank)

  it('chỉ lấy câu SAI, đủ cả ba phần', () => {
    expect(cs).toHaveLength(3)
    expect(cs.map((c) => c.phan)).toEqual(['I', 'II', 'III'])
  })

  it('mang theo đề, phương án, đáp án đúng và đáp án em chọn', () => {
    const i = cs[0]
    expect(i.de).toContain('mùi chuối chín')
    expect(i.luaChon).toHaveLength(4)
    expect(i.dapAnDung).toBe('B')
    expect(i.dapAnChon).toBe('A')
  })

  it('mang lời giải có cấu trúc: chốt, lý do từng phương án, các bước, kết quả', () => {
    expect(cs[0].chot).toContain('Isoamyl acetate')
    expect(cs[0].lyDo?.map((l) => l.khoa)).toEqual(['A', 'B'])
    expect(cs[2].buoc).toEqual(['n NaOH = 0,3 mol', 'm = 6,8 tấn'])
    expect(cs[2].ketQua).toBe('6,8 tấn')
  })

  it('câu không tra được trong kho đề thì BỎ QUA, không dựng câu rỗng', () => {
    const la = [...rows, { ...rows[0], qid: 'khong-co', soCau: 9 }]
    expect(dungCauSai(la, bank)).toHaveLength(3)
  })

  it('câu làm ĐÚNG không lọt vào danh sách câu sai', () => {
    expect(dungCauSai(rows.map((r) => ({ ...r, dungSai: true })), bank)).toHaveLength(0)
  })
})

describe('dungPhieu', () => {
  const p = dungPhieu({ hoSo, ca, chuyenDeCa: hoSo.chuyenDeCaGanNhat, vieCanLam: 'Làm lại 10 câu ester.', rows, banks: bank, diemLop: [1.7], thoiLuongPhut: 45, vaoLuc: '2026-09-04T02:16:00Z' })

  it('gắn đúng phiên bản để trang đọc từ chối bản lạ', () => {
    expect(p.v).toBe(BAN_PHIEU)
  })

  it('số câu sai và tổng câu lấy từ bảng chấm, không lấy số cộng dồn', () => {
    expect(p.soCauSai).toBe(3)
    expect(p.tongSoCau).toBe(3)
  })

  it('có thống kê, nhận định, đúc kết và dải thời gian', () => {
    expect(p.thongKe).not.toBeNull()
    expect(p.tinHieu.length).toBeGreaterThan(0)
    expect(p.ducKet[0].chuyenDe).toBe('Ester – lipid')
    expect(p.dai).toHaveLength(3)
    expect(p.dai[0]).toEqual({ nhan: 'Phần I câu 1', giay: 12, dung: false })
  })

  it('KHÔNG có bảng chấm thì bỏ hẳn phần cách làm bài và câu sai, không dựng phần rỗng', () => {
    const q = dungPhieu({ hoSo, ca, chuyenDeCa: hoSo.chuyenDeCaGanNhat, vieCanLam: '', rows: null, banks: null })
    expect(q.thongKe).toBeNull()
    expect(q.tinHieu).toEqual([])
    expect(q.cauSai).toEqual([])
    expect(q.dai).toEqual([])
    // Vẫn giữ được phần điểm và chuyên đề — báo cáo rút gọn chứ không rỗng.
    expect(q.diem).toBe(1.7)
    expect(q.chuyenDeCa).toHaveLength(1)
  })

  it('lịch sử sắp CŨ TRƯỚC MỚI SAU và bỏ ca chưa chấm', () => {
    const nhieu: HoSoEm = {
      ...hoSo,
      ca: [
        { ...ca, maCa: 'c3', nopLuc: '2026-09-03T00:00:00Z', tong: 8 },
        { ...ca, maCa: 'c1', nopLuc: '2026-09-01T00:00:00Z', tong: 5 },
        { ...ca, maCa: 'c2', nopLuc: '2026-09-02T00:00:00Z', tong: null },
      ],
    }
    const q = dungPhieu({ hoSo: nhieu, ca, chuyenDeCa: [], vieCanLam: '' })
    expect(q.lichSu.map((x) => x.maCa)).toEqual(['c1', 'c3'])
  })

  it('điểm lớp lọc bỏ giá trị không phải số — biểu đồ phân bố không được ăn rác', () => {
    const q = dungPhieu({ hoSo, ca, chuyenDeCa: [], vieCanLam: '', diemLop: [5, NaN, 8, Infinity] as number[] })
    expect(q.diemLop).toEqual([5, 8])
  })
})
