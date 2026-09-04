// PHÂN TÍCH CÁCH LÀM BÀI — phần dễ trượt sang bịa nhất của cả app.
//
// Hai luật phải giữ, và cả hai đều có test riêng ở đây:
//   1. Mỗi nhận định phải kèm CON SỐ lấy từ bảng chấm. Không đủ dữ liệu thì
//      KHÔNG bật nhận định, chứ không hạ ngưỡng cho có cái mà nói.
//   2. Mô tả HÀNH VI, không gán TÍNH CÁCH (quy tắc viết của thầy, điều 28).
import { describe, expect, it } from 'vitest'
import { boTrong, ducKetKienThuc, thongKeLamBai, tinHieuLamBai } from '../src/lib/phan-tich-lam-bai'
import type { ChiTietCauRow } from '../src/lib/exam-api'

function cau(p: Partial<ChiTietCauRow>): ChiTietCauRow {
  return {
    phan: 'I',
    soCau: 1,
    qid: 'q',
    chuyenDe: 'Ester – lipid',
    mucDo: 'hieu',
    dapAnChon: 'A',
    dapAnDung: 'A',
    dungSai: true,
    giay: 30,
    ...p,
  } as ChiTietCauRow
}

// Từ chỉ tính cách — tuyệt đối không được xuất hiện trong bất kỳ nhận định nào.
const TU_CAM_TINH_CACH = ['cẩu thả', 'lười', 'ẩu', 'chủ quan', 'thiếu tập trung', 'kém', 'yếu kém', 'thông minh', 'chăm chỉ']

describe('boTrong', () => {
  it('Phần I và III: chuỗi rỗng là bỏ trống', () => {
    expect(boTrong({ phan: 'I', dapAnChon: '' })).toBe(true)
    expect(boTrong({ phan: 'III', dapAnChon: '   ' })).toBe(true)
    expect(boTrong({ phan: 'I', dapAnChon: 'B' })).toBe(false)
    expect(boTrong({ phan: 'III', dapAnChon: '0' })).toBe(false)
  })

  it('Phần II: toàn dấu gạch là chưa tick ý nào', () => {
    expect(boTrong({ phan: 'II', dapAnChon: '----' })).toBe(true)
    expect(boTrong({ phan: 'II', dapAnChon: 'D-S-' })).toBe(false)
    expect(boTrong({ phan: 'II', dapAnChon: 'DSDS' })).toBe(false)
  })
})

describe('thongKeLamBai', () => {
  const rows = [
    cau({ soCau: 1, dungSai: true, giay: 40 }),
    cau({ soCau: 2, dungSai: false, giay: 10, dapAnChon: 'B', dapAnDung: 'C' }),
    cau({ soCau: 3, phan: 'III', dungSai: false, giay: 20, dapAnChon: '', dapAnDung: '5', mucDo: 'van_dung' }),
  ]

  it('đếm đúng tổng, sai, bỏ trống', () => {
    const tk = thongKeLamBai(rows)
    expect(tk.tongCau).toBe(3)
    expect(tk.soSai).toBe(2)
    expect(tk.soBoTrong).toBe(1)
  })

  it('tách trung bình giây của câu đúng và câu sai', () => {
    const tk = thongKeLamBai(rows)
    expect(tk.giayCauDungTB).toBe(40)
    expect(tk.giayCauSaiTB).toBe(15)
  })

  it('ca không đo được giây thì trả null, KHÔNG trả 0', () => {
    const tk = thongKeLamBai(rows.map((r) => ({ ...r, giay: null })))
    expect(tk.giayTB).toBeNull()
    expect(tk.giayCauSaiTB).toBeNull()
    expect(tk.cauLauNhat).toBeNull()
  })

  it('tính số phút đã dùng từ giờ vào và giờ nộp', () => {
    const tk = thongKeLamBai(rows, { vaoLuc: '2026-09-04T02:00:00Z', nopLuc: '2026-09-04T02:18:00Z', thoiLuongPhut: 45 })
    expect(tk.phutDaDung).toBe(18)
    expect(tk.phutChoPhep).toBe(45)
  })

  it('giờ vào/nộp lộn ngược hoặc hỏng thì không ra số phút âm', () => {
    const tk = thongKeLamBai(rows, { vaoLuc: '2026-09-04T03:00:00Z', nopLuc: '2026-09-04T02:00:00Z' })
    expect(tk.phutDaDung).toBeNull()
  })

  it('bỏ phần và mức độ không có câu nào, không hiện dòng 0/0', () => {
    const tk = thongKeLamBai(rows)
    expect(tk.theoPhan.map((p) => p.phan)).toEqual(['I', 'III'])
    expect(tk.theoMucDo.map((m) => m.mucDo)).toEqual(['hieu', 'van_dung'])
  })
})

describe('tinHieuLamBai — chỉ nói khi có số', () => {
  it('bỏ trống thì nêu đúng số câu bỏ trống', () => {
    const rows = [cau({ soCau: 1, dungSai: false, dapAnChon: '' }), cau({ soCau: 2, dungSai: true })]
    const t = tinHieuLamBai(thongKeLamBai(rows)).find((x) => x.ma === 'bo_trong')
    expect(t?.soLieu).toContain('1/2')
  })

  it('làm nhanh ở câu sai: cần ÍT NHẤT 3 câu sai có giây mới dám kết luận', () => {
    const it2 = [cau({ soCau: 1, dungSai: true, giay: 60 }), cau({ soCau: 2, dungSai: false, giay: 5 }), cau({ soCau: 3, dungSai: false, giay: 5 })]
    expect(tinHieuLamBai(thongKeLamBai(it2)).some((x) => x.ma === 'nhanh_o_cau_sai')).toBe(false)

    const du = [
      cau({ soCau: 1, dungSai: true, giay: 60 }),
      cau({ soCau: 2, dungSai: true, giay: 60 }),
      cau({ soCau: 3, dungSai: false, giay: 8 }),
      cau({ soCau: 4, dungSai: false, giay: 8 }),
      cau({ soCau: 5, dungSai: false, giay: 8 }),
    ]
    const t = tinHieuLamBai(thongKeLamBai(du)).find((x) => x.ma === 'nhanh_o_cau_sai')
    expect(t).toBeTruthy()
    expect(t?.soLieu).toContain('8')
    expect(t?.soLieu).toContain('60')
  })

  it('hổng nền và hụt vận dụng là HAI kết luận khác nhau, không bật cùng lúc', () => {
    const hong = Array.from({ length: 5 }, (_, i) => cau({ soCau: i + 1, mucDo: 'biet', dungSai: i > 2 }))
    const kq1 = tinHieuLamBai(thongKeLamBai(hong))
    expect(kq1.some((x) => x.ma === 'hong_nen')).toBe(true)
    expect(kq1.some((x) => x.ma === 'hut_van_dung')).toBe(false)

    const hut = [
      ...Array.from({ length: 4 }, (_, i) => cau({ soCau: i + 1, mucDo: 'biet', dungSai: true })),
      ...Array.from({ length: 4 }, (_, i) => cau({ soCau: 10 + i, mucDo: 'van_dung', dungSai: false })),
    ]
    const kq2 = tinHieuLamBai(thongKeLamBai(hut))
    expect(kq2.some((x) => x.ma === 'hut_van_dung')).toBe(true)
    expect(kq2.some((x) => x.ma === 'hong_nen')).toBe(false)
  })

  it('nộp sớm chỉ nêu khi CÒN SAI NHIỀU — làm nhanh mà đúng hết thì không có gì để nhắc', () => {
    const gioi = Array.from({ length: 10 }, (_, i) => cau({ soCau: i + 1, dungSai: true }))
    const kq = tinHieuLamBai(thongKeLamBai(gioi, { vaoLuc: '2026-09-04T02:00:00Z', nopLuc: '2026-09-04T02:10:00Z', thoiLuongPhut: 45 }))
    expect(kq.some((x) => x.ma === 'nop_som')).toBe(false)
  })

  it('không có gì bất thường thì NÓI THẲNG là không có, không nặn lời khuyên chung chung', () => {
    const deu = Array.from({ length: 10 }, (_, i) => cau({ soCau: i + 1, dungSai: i > 1, giay: 30 }))
    const kq = tinHieuLamBai(thongKeLamBai(deu))
    expect(kq).toHaveLength(1)
    expect(kq[0].ma).toBe('deu_tay')
  })

  it('ca rỗng thì không có nhận định nào', () => {
    expect(tinHieuLamBai(thongKeLamBai([]))).toEqual([])
  })

  it('KHÔNG nhận định nào gán tính cách, và nhận định nào cũng có số kèm lời khuyên', () => {
    const rows = [
      cau({ soCau: 1, dungSai: false, dapAnChon: '', giay: 5, mucDo: 'biet' }),
      cau({ soCau: 2, dungSai: false, giay: 5, mucDo: 'biet' }),
      cau({ soCau: 3, dungSai: false, giay: 6, mucDo: 'biet' }),
      cau({ soCau: 4, dungSai: true, giay: 50, mucDo: 'hieu' }),
      cau({ soCau: 5, dungSai: true, giay: 50, mucDo: 'hieu' }),
      cau({ soCau: 6, phan: 'III', dungSai: false, giay: 300, mucDo: 'van_dung' }),
    ]
    const kq = tinHieuLamBai(thongKeLamBai(rows, { vaoLuc: '2026-09-04T02:00:00Z', nopLuc: '2026-09-04T02:08:00Z', thoiLuongPhut: 45 }))
    expect(kq.length).toBeGreaterThan(1)
    for (const t of kq) {
      expect(t.soLieu).toMatch(/\d/)
      expect(t.loiKhuyen.length).toBeGreaterThan(20)
      const chu = `${t.nhan} ${t.soLieu} ${t.loiKhuyen}`.toLowerCase()
      for (const cam of TU_CAM_TINH_CACH) expect(chu).not.toContain(cam)
    }
  })
})

describe('ducKetKienThuc', () => {
  it('gom theo chuyên đề, bỏ ý trùng', () => {
    const r = ducKetKienThuc([
      { chuyenDe: 'Ester – lipid', chot: 'Ester tạo từ acid và alcohol, mất nước.' },
      { chuyenDe: 'Ester – lipid', chot: 'ester tạo từ acid và  alcohol, mất nước.' },
      { chuyenDe: 'Ester – lipid', chot: 'Thuỷ phân ester trong kiềm là phản ứng một chiều.' },
      { chuyenDe: 'Carbohydrate', chot: 'Glucose có nhóm CHO nên tráng bạc.' },
    ])
    expect(r).toHaveLength(2)
    expect(r[0].chuyenDe).toBe('Ester – lipid')
    expect(r[0].lyThuyet).toHaveLength(2)
  })

  // Thầy chốt: đúc kết phải là lý thuyết và kỹ năng, KHÔNG phải chép lại bài
  // giải của một câu. "Acid 24/60 = 0,4 mol" chép vào sổ không dùng lại được ở
  // câu nào khác.
  it('LOẠI câu chốt là phép tính của riêng một câu', () => {
    const r = ducKetKienThuc([
      { chuyenDe: 'Ester – lipid', chot: 'Acid 24/60 = 0,4 mol, ester 26,4/88 = 0,3 mol, hiệu suất 0,3/0,4 = 75%.' },
      { chuyenDe: 'Ester – lipid', chot: 'Alcohol 0,17 mol là chất thiếu; ester thu 0,12 mol.' },
      { chuyenDe: 'Ester – lipid', chot: 'Ester không có H linh động nên ít tan trong nước.' },
    ])
    expect(r[0].lyThuyet.concat(r[0].kyNang)).toEqual(['Ester không có H linh động nên ít tan trong nước.'])
  })

  it('LOẠI câu quá dài — đúc kết là để chép vào sổ, không phải chép cả đoạn văn', () => {
    const dai = 'Ester ' + 'rất '.repeat(30) + 'quan trọng.'
    expect(ducKetKienThuc([{ chuyenDe: 'X', chot: dai }])).toEqual([])
  })

  it('tách hai ngăn: điều phải THUỘC và điều phải LÀM ĐƯỢC', () => {
    const r = ducKetKienThuc([
      { chuyenDe: 'Ester – lipid', chot: 'Ester không có H linh động nên ít tan trong nước.' },
      { chuyenDe: 'Ester – lipid', chot: 'Đếm số nhóm COO để biết ester mấy chức.' },
    ])
    expect(r[0].lyThuyet).toHaveLength(1)
    expect(r[0].kyNang).toHaveLength(1)
    expect(r[0].kyNang[0]).toContain('Đếm')
  })

  it('mỗi ngăn tối đa 5 ý — sổ của em không phải quyển sách', () => {
    const nhieu = Array.from({ length: 12 }, (_, i) => ({ chuyenDe: 'X', chot: `Tính chất số ${'a'.repeat(i + 1)} của ester.` }))
    const r = ducKetKienThuc(nhieu)
    expect(r[0].lyThuyet.length).toBeLessThanOrEqual(5)
  })

  it('câu không có chốt thì bỏ qua, KHÔNG tự nghĩ ra ý cho em chép vào sổ', () => {
    expect(ducKetKienThuc([{ chuyenDe: 'Ester – lipid', chot: '' }, { chuyenDe: 'Polymer', chot: '   ' }])).toEqual([])
  })

  it('câu chưa gắn chuyên đề vẫn giữ ý, xếp vào nhóm nói rõ là chưa phân loại', () => {
    const r = ducKetKienThuc([{ chuyenDe: '', chot: 'Đọc kỹ đơn vị trước khi tính.' }])
    expect(r[0].chuyenDe).toBe('Chưa phân loại chuyên đề')
  })
})
