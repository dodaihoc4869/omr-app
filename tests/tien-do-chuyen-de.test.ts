// TỔNG HỢP THEO CHUYÊN ĐỀ (BA-APP.md đợt 2) — kiểm chứng 3: bảng mạnh/yếu của
// một em phải khớp với số tay-tính lại từ chi tiết từng câu. Nạp thẳng file
// Apps Script vào Node để test đúng bản sẽ dán lên Google.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import { laYeu, toneXepLoai, NGUONG_YEU, SO_CAU_DU_TIN } from '../src/screens/HocSinhScreen'

interface Cau {
  chuyenDe?: string
  dungSai?: boolean | null
  qid?: string
}
interface Gs {
  gomTheoChuyenDe_: (cau: Cau[]) => Record<string, { soCau: number; soSai: number }>
  xuHuongChuyenDe_: (dong: unknown[][]) => Record<string, string>
  SO_CA_GAN_DAY: number
  SO_CAU_TOI_THIEU: number
  NGUONG_XU_HUONG: number
  TIENDO_CA_HEADERS: string[]
  TIENDO_HS_HEADERS: string[]
  QID_HEADERS: string[]
}

const gs: Gs = new Function(
  'Utilities',
  `${gsCode}\nreturn { gomTheoChuyenDe_, xuHuongChuyenDe_, SO_CA_GAN_DAY, SO_CAU_TOI_THIEU, NGUONG_XU_HUONG, TIENDO_CA_HEADERS, TIENDO_HS_HEADERS, QID_HEADERS }`,
)({ getUuid: () => 'x' })

/** Dòng TienDoCa: [SBD, MaCa, ChuyenDe, SoCau, SoSai, NopLuc, CapNhatLuc] */
const dong = (cd: string, soCau: number, soSai: number, ngay: string) => ['110234', 'ca', cd, soCau, soSai, `2026-0${ngay}T07:00:00Z`, '']

describe('gomTheoChuyenDe_ — đếm đúng số câu, số sai', () => {
  it('đếm theo từng chuyên đề, chỉ dungSai === false mới tính là sai', () => {
    const kq = gs.gomTheoChuyenDe_([
      { chuyenDe: 'pH và tính acid–base', dungSai: false },
      { chuyenDe: 'pH và tính acid–base', dungSai: false },
      { chuyenDe: 'pH và tính acid–base', dungSai: true },
      { chuyenDe: 'Cân bằng hoá học', dungSai: true },
      { chuyenDe: 'Cân bằng hoá học', dungSai: null },
    ])
    expect(kq['pH và tính acid–base']).toEqual({ soCau: 3, soSai: 2 })
    // câu chưa chấm được (null) vẫn tính vào số câu nhưng KHÔNG tính là sai
    expect(kq['Cân bằng hoá học']).toEqual({ soCau: 2, soSai: 0 })
  })

  it('câu thiếu chuyên đề gom vào "(chưa phân loại)", không đoán và không bỏ im lặng', () => {
    const kq = gs.gomTheoChuyenDe_([{ dungSai: false }, { chuyenDe: '  ', dungSai: true }])
    expect(kq['(chưa phân loại)']).toEqual({ soCau: 2, soSai: 1 })
  })

  it('kiểm chứng 3: tổng số câu gom lại luôn bằng số câu đưa vào', () => {
    const cau: Cau[] = []
    const ten = ['A', 'B', 'C', '']
    for (let i = 0; i < 28; i++) cau.push({ chuyenDe: ten[i % 4], dungSai: i % 3 === 0 ? false : true })
    const kq = gs.gomTheoChuyenDe_(cau)
    const tongCau = Object.values(kq).reduce((s, v) => s + v.soCau, 0)
    const tongSai = Object.values(kq).reduce((s, v) => s + v.soSai, 0)
    expect(tongCau).toBe(28)
    expect(tongSai).toBe(cau.filter((c) => c.dungSai === false).length)
  })
})

describe('xuHuongChuyenDe_ — so 3 ca gần nhất với các ca trước', () => {
  it('sai giảm rõ → tốt; sai tăng rõ → xấu', () => {
    // 3 ca gần nhất (tháng 6,7,8): sai 1/12 ; trước đó (tháng 1,2): sai 6/8
    const tot = [dong('X', 4, 0, '6'), dong('X', 4, 1, '7'), dong('X', 4, 0, '8'), dong('X', 4, 3, '1'), dong('X', 4, 3, '2')]
    expect(gs.xuHuongChuyenDe_(tot).X).toBe('tot')
    const xau = [dong('X', 4, 3, '6'), dong('X', 4, 3, '7'), dong('X', 4, 4, '8'), dong('X', 4, 0, '1'), dong('X', 4, 1, '2')]
    expect(gs.xuHuongChuyenDe_(xau).X).toBe('xau')
  })

  it('chênh lệch dưới ngưỡng → đi ngang', () => {
    const deu = [dong('X', 10, 5, '6'), dong('X', 10, 5, '7'), dong('X', 10, 5, '8'), dong('X', 10, 5, '1'), dong('X', 10, 5, '2')]
    expect(gs.xuHuongChuyenDe_(deu).X).toBe('deu')
  })

  it('chưa đủ dữ liệu một bên → chua_du, KHÔNG đoán', () => {
    const it3 = [dong('X', 4, 1, '6'), dong('X', 4, 0, '7'), dong('X', 4, 0, '8')]
    expect(gs.xuHuongChuyenDe_(it3).X).toBe('chua_du')
    const moiCo1 = [dong('X', 1, 1, '6'), dong('X', 1, 0, '1')]
    expect(gs.xuHuongChuyenDe_(moiCo1).X).toBe('chua_du')
  })

  it('chỉ lấy đúng SO_CA_GAN_DAY ca gần nhất, sắp theo giờ nộp', () => {
    expect(gs.SO_CA_GAN_DAY).toBe(3)
    // ca tháng 8 sai hết nhưng nằm trong nhóm "gần đây" → phải ra 'xau'
    const ds = [dong('X', 4, 4, '8'), dong('X', 4, 3, '7'), dong('X', 4, 3, '6'), dong('X', 4, 0, '2'), dong('X', 4, 0, '1')]
    expect(gs.xuHuongChuyenDe_(ds).X).toBe('xau')
  })
})

describe('Sheet tổng hợp — tiêu đề cột', () => {
  it('khai đúng cột để app đọc không lệch', () => {
    expect(gs.TIENDO_CA_HEADERS).toEqual(['SBD', 'MaCa', 'ChuyenDe', 'SoCau', 'SoSai', 'NopLuc', 'CapNhatLuc'])
    expect(gs.TIENDO_HS_HEADERS).toEqual(['SBD', 'ChuyenDe', 'SoCau', 'SoSai', 'CapNhatLuc'])
    expect(gs.QID_HEADERS).toEqual(['SBD', 'DanhSachQid', 'SoCau', 'CapNhatLuc'])
  })
})

describe('App — chuyên đề yếu và xếp loại', () => {
  it('yếu = sai trên 30% VÀ đã làm đủ 4 câu', () => {
    expect(NGUONG_YEU).toBe(0.3)
    expect(SO_CAU_DU_TIN).toBe(4)
    expect(laYeu({ tiLeSai: 0.62, soCau: 8 })).toBe(true)
    expect(laYeu({ tiLeSai: 0.12, soCau: 8 })).toBe(false)
    // sai 100% nhưng mới làm 2 câu → chưa kết luận
    expect(laYeu({ tiLeSai: 1, soCau: 2 })).toBe(false)
  })

  it('màu xếp loại theo đúng thang classify()', () => {
    expect(toneXepLoai(8)).toBe('xanh')
    expect(toneXepLoai(6.6)).toBe('tim')
    expect(toneXepLoai(5)).toBe('cam')
    expect(toneXepLoai(4.9)).toBe('do')
    expect(toneXepLoai(null)).toBe('xam')
  })
})
