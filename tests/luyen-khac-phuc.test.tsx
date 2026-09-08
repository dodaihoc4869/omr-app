// LUYỆN CÂU KHẮC PHỤC — khối ở ngay màn Ca thi (thầy chốt 08/09).
//
// "Nút xem học sinh có luyện câu khắc phục không để luôn ngoài này. Bấm vào sẽ
// liệt kê đã làm câu khắc phục ca nào bao nhiêu lần hay chưa làm lần nào. Có ô
// tìm kiếm sẽ ra tên học sinh, bấm vào sẽ ra lịch sử luyện câu khắc phục."
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { gomLuyen, khongDau } from '../src/components/KhoiLuyenKhacPhuc'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const KHOI = doc('src/components/KhoiLuyenKhacPhuc.tsx')

const CA = [
  { maCa: 'c1', tenCa: 'Bài 1', moLuc: '2026-09-01T00:00:00Z' },
  { maCa: 'c2', tenCa: 'Bài 2', moLuc: '2026-09-05T00:00:00Z' },
]

const p = (sbd: string, hoTen: string, soLanXem: number, xemLanCuoi = '', loai = 'baitap') => ({ sbd, hoTen, soLanXem, xemLanCuoi, loai })

function phieu() {
  return new Map<string, ReturnType<typeof p>[]>([
    // Duy mở bài 1 hai lần (hai bản phiếu), bài 2 chưa mở.
    ['c1', [p('10038', 'Triệu Đức Duy', 1, '2026-09-02T10:00:00Z'), p('10038', 'Triệu Đức Duy', 1, '2026-09-03T10:00:00Z'), p('10039', 'Đào Nhật Long', 0)]],
    ['c2', [p('10038', 'Triệu Đức Duy', 0), p('10039', 'Đào Nhật Long', 0)]],
  ])
}

describe('gom lịch sử mở phiếu khắc phục', () => {
  it('CỘNG MỌI BẢN của cùng một ca — dựng lại phiếu không làm mất dấu vết', () => {
    const ds = gomLuyen(CA, phieu())
    const duy = ds.find((e) => e.sbd === '10038')!
    expect(duy.bai[0]).toMatchObject({ tenCa: 'Bài 1', soLanXem: 2 })
    expect(duy.tongMo).toBe(2)
    expect(duy.soBaiDaMo).toBe(1)
  })

  it('LẦN 1 LÀ BÀI ĐẦU TIÊN — xếp ca cũ tới mới, không phải mới tới cũ', () => {
    const ds = gomLuyen(CA, phieu())
    expect(ds.find((e) => e.sbd === '10038')!.bai.map((b) => b.tenCa)).toEqual(['Bài 1', 'Bài 2'])
  })

  it('EM CHƯA NỘP ĐỨNG ĐẦU — nộp mới là LÀM, mở chỉ là mở', () => {
    const ds = gomLuyen(CA, phieu())
    expect(ds.every((e) => e.tongNop === 0)).toBe(true)
    // Cùng chưa nộp thì em chưa mở đứng trước em đã mở.
    expect(ds[0].sbd).toBe('10039')
    expect(ds[0].tongMo).toBe(0)
  })

  it('LƯỢT NỘP THẬT vào đúng bài, đúng em, xếp theo lần', () => {
    const nop = new Map([
      [
        'c1',
        [
          { ma: 'p1', sbd: '10038', lanThu: 2, nopLuc: '2026-09-03T11:00:00Z', soCau: 10, soDung: 8, qidSai: ['q3'] },
          { ma: 'p1', sbd: '10038', lanThu: 1, nopLuc: '2026-09-02T11:00:00Z', soCau: 10, soDung: 4, qidSai: ['q1', 'q3'] },
        ],
      ],
    ])
    const ds = gomLuyen(CA, phieu(), nop)
    const duy = ds.find((e) => e.sbd === '10038')!
    expect(duy.tongNop).toBe(2)
    expect(duy.soBaiDaNop).toBe(1)
    expect(duy.bai[0].luot.map((l) => l.lanThu)).toEqual([1, 2])
    expect(duy.bai[0].luot.map((l) => l.soDung)).toEqual([4, 8])
    // Bài 2 chưa nộp thì rỗng, KHÔNG mượn lượt của bài 1.
    expect(duy.bai[1].luot).toHaveLength(0)
    // Em khác không bị dính lượt của Duy.
    expect(ds.find((e) => e.sbd === '10039')!.tongNop).toBe(0)
    // Và em đã nộp xuống dưới em chưa nộp.
    expect(ds[ds.length - 1].sbd).toBe('10038')
  })

  it('CHỈ ĐẾM PHIẾU BÀI TẬP, không lẫn phiếu kết quả gửi phụ huynh', () => {
    const m = new Map([['c1', [p('10038', 'Duy', 9, '', 'ketqua'), p('10038', 'Duy', 1, '2026-09-02T10:00:00Z')]]])
    const ds = gomLuyen([CA[0]], m)
    expect(ds[0].tongMo).toBe(1)
  })

  it('TÌM KIẾM BỎ DẤU — gõ "duc duy" ra "Triệu Đức Duy"', () => {
    expect(khongDau('Triệu Đức Duy')).toBe('trieu duc duy')
    expect(khongDau('Đào Nhật Long').includes('dao nhat long')).toBe(true)
    // `ð`/`Ð` nhìn y hệt `đ`/`Đ` — gộp cả bốn, đúng như cổng vào thi.
    expect(khongDau('Ðức')).toBe('duc')
  })
})

describe('khối đứng ở màn Ca thi', () => {
  it('ĐƯỢC GẮN Ở MÀN CA THI, không phải trong chi tiết từng ca', () => {
    const man = doc('src/screens/LichSuCaScreen.tsx')
    expect(man).toContain("import KhoiLuyenKhacPhuc from '../components/KhoiLuyenKhacPhuc'")
    expect(man).toContain('<KhoiLuyenKhacPhuc scriptUrl={nguon.url} maBiMat={nguon.mat} />')
    // Và KHÔNG còn bản thứ hai trong màn chi tiết ca — hai bản thì sớm muộn lệch.
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('đã mở phiếu khắc phục')
  })

  it('BẤM LÀ ĐỒNG BỘ THẬT — hỏi máy chủ ngay, kèm mốc giờ của số liệu', () => {
    expect(KHOI).toContain('await danhSachCa(')
    expect(KHOI).toContain('await phieuTheoCa(')
    expect(KHOI).toContain('await nopKhacPhucTheoCa(')
    expect(KHOI).toContain('setLuc(new Date().toISOString())')
    expect(KHOI).toContain('số liệu lúc')
  })

  it('CÓ Ô TÌM KIẾM theo tên và số báo danh', () => {
    expect(KHOI).toContain('Tìm tên học sinh hoặc số báo danh')
    expect(KHOI).toContain('khongDau(e.hoTen).includes(q)')
    expect(KHOI).toContain('e.sbd.includes(tim.trim())')
    // Không khớp ai thì nói ra, không để danh sách trống câm.
    expect(KHOI).toContain('Không có em nào khớp')
  })

  it('BẤM VÀO MỘT EM ra LỊCH SỬ từng bài', () => {
    expect(KHOI).toContain('setEmMo(dangMo ? \'\' : e.sbd)')
    expect(KHOI).toContain('Lần {i + 1}')
    // Mỗi bài ghi rõ lượt nộp và giờ nộp; bài chưa nộp thì nói "chưa nộp".
    expect(KHOI).toContain('gioNgan(l.nopLuc)')
    expect(KHOI).toContain('chưa nộp</span>')
    expect(KHOI).toContain('mở {b.soLanXem} lần')
  })

  it('KHÔNG LẪN "MỞ" VỚI "NỘP" — hai con số, nói rõ cái nào là cái nào', () => {
    expect(KHOI).toContain('chưa nộp bài khắc phục nào')
    expect(KHOI).toContain('lượt ${l.lanThu} đúng ${l.soDung}/${l.soCau}')
    // Cảnh báo nói đúng chuyện: phiếu CŨ không có nút nộp nên chỉ có số mở.
    expect(KHOI).toContain('Phiếu dựng trước 08/09 không có nút nộp')
    // Và không có biến nào chở một con số "đã luyện" tự nghĩ ra.
    expect(KHOI).not.toMatch(/soCauDaLam|soCauLuyen|daLuyen|tongCauLam/)
  })

  it('MÁY CHỦ BẢN CŨ chưa có lệnh nộp thì KHÔNG chặn cả khối', () => {
    expect(KHOI).toContain('.catch(() => [])')
  })
})
