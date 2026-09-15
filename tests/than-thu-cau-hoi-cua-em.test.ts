/**
 * KIỂM BỘ ĐỔI CÂU SAI CỦA EM SANG CÂU CHƠI ĐƯỢC.
 *
 * Luật cần bảo vệ: thà bỏ câu và ĐẾM còn hơn hiện một câu hỏng cho em làm.
 */
import { describe, it, expect } from 'vitest'
import {
  doiCauSaiThanhCauChoi,
  bacTheoMucDo,
  tenDangCua,
  locTheoBac,
  TEN_LY_DO,
  type CauSaiTho,
} from '../src/game/than-thu-hoa-hoc/cau-hoi-cua-em'

const CAU_TOT: CauSaiTho = {
  qid: 'q1',
  maCa: '123456',
  tenCa: 'Ca 12 — Ester',
  phan: 'I',
  soCau: 7,
  chuyenDe: 'Ester',
  mucDo: 'Thông hiểu',
  dapAnDung: 'C',
  dapAnChon: 'A',
  text: 'Ester nào sau đây có mùi chuối chín?',
  choices: ['Ethyl formate', 'Methyl acetate', 'Isoamyl acetate', 'Ethyl butyrate'],
  loiGiai: 'Isoamyl acetate cho mùi chuối chín.',
  dang: { ma: 'HC-ES-01', ten: 'Nhận biết ester theo mùi' },
  dangMa: 'HC-ES-01',
}

describe('doiCauSaiThanhCauChoi', () => {
  it('đổi được câu phần I đủ điều kiện', () => {
    const kq = doiCauSaiThanhCauChoi([CAU_TOT])
    expect(kq.dsCau).toHaveLength(1)
    expect(kq.soBoQua).toBe(0)
    const c = kq.dsCau[0]!
    expect(c.dung).toBe(2)
    expect(c.phuongAn[2]).toBe('Isoamyl acetate')
    expect(c.chuyenDe).toBe('Ester')
    expect(c.bac).toBe(2)
    expect(c.qid).toBe('q1')
    expect(c.maDang).toBe('HC-ES-01')
  })

  it('đáp án đúng luôn trỏ đúng phương án, thử cả bốn chữ cái', () => {
    for (const [i, ch] of ['A', 'B', 'C', 'D'].entries()) {
      const kq = doiCauSaiThanhCauChoi([{ ...CAU_TOT, qid: 'x' + ch, dapAnDung: ch }])
      expect(kq.dsCau[0]!.dung).toBe(i)
      expect(kq.dsCau[0]!.phuongAn[kq.dsCau[0]!.dung]).toBe(CAU_TOT.choices![i])
    }
  })

  it('bỏ câu phần II và phần III, có đếm lý do', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', phan: 'II' },
      { ...CAU_TOT, qid: 'b', phan: 'III' },
    ])
    expect(kq.dsCau).toHaveLength(0)
    expect(kq.soBoQua).toBe(2)
    expect(kq.lyDoBoQua.khongPhaiPhanI).toBe(2)
  })

  it('bỏ câu thiếu phương án hoặc phương án rỗng', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', choices: ['x', 'y', 'z'] },
      { ...CAU_TOT, qid: 'b', choices: ['x', '', 'z', 't'] },
      { ...CAU_TOT, qid: 'c', choices: undefined },
    ])
    expect(kq.dsCau).toHaveLength(0)
    expect(kq.lyDoBoQua.thieuPhuongAn).toBe(3)
  })

  it('bỏ câu đáp án đúng không phải A/B/C/D', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', dapAnDung: '' },
      { ...CAU_TOT, qid: 'b', dapAnDung: 'E' },
      { ...CAU_TOT, qid: 'c', dapAnDung: '12,5' },
    ])
    expect(kq.dsCau).toHaveLength(0)
    expect(kq.lyDoBoQua.dapAnKhongHopLe).toBe(3)
  })

  it('bỏ câu có hình ảnh — màn đấu chỉ hiện chữ', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', imageDataUrl: 'data:image/png;base64,iVBOR' },
      { ...CAU_TOT, qid: 'b', hinhAnh: [{ viTri: 'thanCau' }] },
    ])
    expect(kq.dsCau).toHaveLength(0)
    expect(kq.lyDoBoQua.coAnh).toBe(2)
  })

  it('bỏ câu trùng qid, giữ bản đầu', () => {
    const kq = doiCauSaiThanhCauChoi([CAU_TOT, { ...CAU_TOT, text: 'Bản trùng' }])
    expect(kq.dsCau).toHaveLength(1)
    expect(kq.dsCau[0]!.cau).toBe(CAU_TOT.text)
    expect(kq.lyDoBoQua.trungQid).toBe(1)
  })

  it('tổng số câu vào + bỏ = tổng đầu vào, không rơi câu nào im lặng', () => {
    const vao: CauSaiTho[] = [
      CAU_TOT,
      { ...CAU_TOT, qid: 'a', phan: 'II' },
      { ...CAU_TOT, qid: 'b', choices: ['1', '2'] },
      { ...CAU_TOT, qid: 'c', dapAnDung: 'Z' },
      { ...CAU_TOT, qid: 'd', imageDataUrl: 'data:x' },
      { ...CAU_TOT, qid: 'e', text: '   ' },
      { ...CAU_TOT, qid: 'f' },
    ]
    const kq = doiCauSaiThanhCauChoi(vao)
    expect(kq.dsCau.length + kq.soBoQua).toBe(vao.length)
  })

  it('không có lời giải thì nói rõ em đã chọn gì, không bịa lời giải', () => {
    const kq = doiCauSaiThanhCauChoi([{ ...CAU_TOT, loiGiai: '' }])
    expect(kq.dsCau[0]!.giaiThich).toBe('Lần thi trước em chọn A, đáp án đúng là C.')
  })

  it('gom đúng danh sách chuyên đề và dạng em đã đụng', () => {
    const kq = doiCauSaiThanhCauChoi([
      CAU_TOT,
      { ...CAU_TOT, qid: 'q2', chuyenDe: 'Điện phân', dang: 'Điện phân dung dịch', dangMa: 'VC-DP-03' },
    ])
    expect(kq.dsChuyenDe).toEqual(['Điện phân', 'Ester'])
    expect(kq.dsDang).toContain('Điện phân dung dịch')
  })
})

describe('bacTheoMucDo', () => {
  it('đọc đúng bốn mức thầy gắn, không phân biệt dấu và hoa thường', () => {
    expect(bacTheoMucDo('Nhận biết')).toBe(1)
    expect(bacTheoMucDo('nhan biet')).toBe(1)
    expect(bacTheoMucDo('THÔNG HIỂU')).toBe(2)
    expect(bacTheoMucDo('Vận dụng')).toBe(2)
    expect(bacTheoMucDo('Vận dụng cao')).toBe(3)
    expect(bacTheoMucDo('van dung cao')).toBe(3)
  })

  it('"vận dụng cao" phải ra bậc 3, không bị "vận dụng" nuốt mất', () => {
    expect(bacTheoMucDo('Vận dụng cao')).not.toBe(2)
  })

  it('chưa gắn mức độ thì về mặc định bậc 2', () => {
    expect(bacTheoMucDo(undefined)).toBe(2)
    expect(bacTheoMucDo('')).toBe(2)
    expect(bacTheoMucDo('chưa rõ')).toBe(2)
  })
})

describe('tenDangCua', () => {
  it('ưu tiên mã dạng máy chủ trả, tên đi kèm', () => {
    expect(tenDangCua({ dangMa: 'HC-ES-01', dang: 'Nhận biết ester' }))
      .toEqual({ ma: 'HC-ES-01', ten: 'Nhận biết ester' })
  })
  it('dạng là chuỗi thuần thì lấy làm tên', () => {
    expect(tenDangCua({ dang: 'Điện phân' }).ten).toBe('Điện phân')
  })
  it('chưa gắn dạng thì rỗng, không bịa tên', () => {
    expect(tenDangCua({})).toEqual({ ma: '', ten: '' })
  })
})

describe('locTheoBac', () => {
  it('lấy đúng bậc khi có; hết bậc thì trả cả kho chứ không trả rỗng', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', mucDo: 'Nhận biết' },
      { ...CAU_TOT, qid: 'b', mucDo: 'Vận dụng cao' },
    ])
    expect(locTheoBac(kq.dsCau, 1)).toHaveLength(1)
    expect(locTheoBac(kq.dsCau, 3)).toHaveLength(1)
    expect(locTheoBac(kq.dsCau, 2)).toHaveLength(2)
  })
})

describe('TEN_LY_DO', () => {
  it('mọi lý do bỏ câu đều có chữ hiện ra được cho em đọc', () => {
    const kq = doiCauSaiThanhCauChoi([
      { ...CAU_TOT, qid: 'a', phan: 'II' },
      { ...CAU_TOT, qid: 'b', choices: ['1'] },
      { ...CAU_TOT, qid: 'c', dapAnDung: 'Z' },
      { ...CAU_TOT, qid: 'd', imageDataUrl: 'data:x' },
      { ...CAU_TOT, qid: 'e', text: '' },
      CAU_TOT, CAU_TOT,
    ])
    for (const ly of Object.keys(kq.lyDoBoQua)) {
      expect(TEN_LY_DO[ly as keyof typeof TEN_LY_DO]).toBeTruthy()
    }
  })
})
