// "RÚT ĐỀ TẠO KHẮC PHỤC NHƯNG BẤM CHỌN ĐÁP ÁN KHÔNG ĐƯỢC" — thầy báo 09/09
// 19:30, kèm ảnh chụp màn hình máy tính.
//
// Ảnh cho biết ĐÚNG đường đi: địa chỉ là `?vai=diem&examCode=335663` (màn XEM
// ĐIỂM), phiếu mở ra mang nhãn **"Phiếu chỉ có đề"**, bốn ô A/B/C/D xám ngắt.
//
// NGUYÊN NHÂN GỐC — một điều kiện thừa ở HAI chỗ:
//
//     const nop = !anGiai && tuyChon.nop ? tuyChon.nop : null   // html-phieu
//     const nop = !anGiai && ma && sbdEm ? {...} : null          // PhieuScreen
//
// Lý do ghi kèm là "phiếu chỉ có đề thì không có đáp án để chấm". SAI. `anGiai`
// chỉ bỏ LỜI GIẢI (`boLoiGiai`); trường `dapAn` của từng câu vẫn nằm nguyên
// trong gói, và chính nó là thứ `chamTaiCho()` dùng để chấm. Đáp án được giấu
// bằng CSS (`body.chi-de`), KHÔNG phải bằng cách xoá đi.
//
// Hậu quả: link ĐỀ — đúng cái em nhận để LÀM — là link duy nhất em không bấm
// chọn được. Mở ra chỉ đọc, không làm, không nộp.
//
// Ba lớp `co-lam` + `chua-nop` + `chi-de` chạy cùng nhau vốn đã được lo từ
// 08/09: luật giấu đáp án và luật tô ô ĐANG CHỌN đều có `!important` cho cả hai
// thân, nên ô em chọn vẫn nổi bật mà đáp án vẫn kín.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dungPhieu } from '../src/lib/html-phieu'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')

const TT = {
  hoTen: 'Nguyễn Hồng Sơn',
  sbd: '12036',
  ngay: new Date('2026-09-09T12:00:00.000Z'),
  tenChuyenDe: 'Carbohydrate',
  ketQua: '',
  hienDapAn: false,
  nhanBia: 'Đề luyện theo đúng chỗ em mất điểm',
  oBia: [],
}

const CAU = [
  {
    phan: 'I' as const,
    id: 'q-1',
    maDe: '12-C1-B1',
    chuyenDe: 'Carbohydrate',
    dang: 'ly_thuyet',
    sao: 1,
    mucDo: 'nhan_biet',
    text: 'Saccharose tham gia phản ứng nào sau đây?',
    luaChon: ['Tollens', 'Nước bromine', 'Cu(OH)2 tạo dung dịch xanh lam', 'Thuỷ phân'],
    dapAn: 'C',
    chot: '',
    lyDo: null,
    buoc: null,
    ketQua: '',
  },
]

const NOP = { ma: 'abc12345', sbd: '12036', url: 'https://script.google.com/macros/s/X/exec' }

function phieu(tuyChon: Record<string, unknown>): string {
  return dungPhieu(TT as never, CAU as never, tuyChon as never)
}

describe('bản CHỈ ĐỀ vẫn bấm chọn được và nộp được', () => {
  it('TÁI HIỆN ẢNH THẦY GỬI: bản chỉ đề + có mã nộp ⇒ ô là NÚT bấm được', () => {
    const h = phieu({ anGiai: true, nop: NOP })
    expect(h).toContain('<button type="button" class="q-opt')
    expect(h).toContain('lam-o')
    expect(h).toContain('data-chon="A"')
  })

  it('trước bản vá thì ô là DIV chết — giữ phép so sánh để thấy rõ khác biệt', () => {
    // Không có mã nộp thì vẫn chỉ đọc, đúng như cũ.
    const h = phieu({ anGiai: true })
    expect(h).not.toContain('<button type="button" class="q-opt')
    expect(h).toContain('<div class="q-opt')
  })

  it('bản chỉ đề nộp được thì CÓ thanh nộp và gói dữ liệu nộp', () => {
    const h = phieu({ anGiai: true, nop: NOP })
    expect(h).toContain('id="du-nop"')
    expect(h).toContain('abc12345')
  })

  it('ĐÁP ÁN VẪN KÍN: đáp án đi kèm để chấm, nhưng bị CSS giấu', () => {
    const h = phieu({ anGiai: true, nop: NOP })
    // Luật giấu của cả hai thân còn nguyên, kèm !important.
    expect(h).toMatch(/body\.chi-de \.q-opt\.dung \{[^}]*!important/)
    expect(h).toMatch(/body\.chua-nop \.q-opt\.dung \{[^}]*!important/)
    // Và ô ĐANG CHỌN vẫn nổi bật ở cả hai thân — nếu không thì em bấm mà không
    // thấy gì, đúng lỗi đã dính 08/09.
    expect(h).toContain('body.chi-de .q-opt.lam-o[aria-checked="true"]')
    expect(h).toContain('body.chua-nop .q-opt.lam-o[aria-checked="true"]')
  })

  it('bản chỉ đề KHÔNG kèm lời giải — vẫn giữ đúng ý bản đề', () => {
    const h = phieu({ anGiai: true, nop: NOP })
    expect(h).not.toContain('Bấm vào từng câu để xem lời giải')
  })

  it('NỘP XONG mở cả hai lớp giấu, không mở lời giải vào chỗ vẫn bị che', () => {
    const h = phieu({ anGiai: true, nop: NOP })
    const i = h.indexOf("classList.remove('chua-nop')")
    expect(i).toBeGreaterThan(0)
    expect(h.slice(i, i + 400)).toContain("classList.remove('chi-de')")
  })

  it('bản CÓ lời giải không đổi hành vi', () => {
    const h = phieu({ nop: NOP })
    expect(h).toContain('<button type="button" class="q-opt')
    expect(h).toContain('id="du-nop"')
  })

  it('KHÔNG có nop thì vẫn chỉ đọc ở cả hai bản — không tự bật bừa', () => {
    for (const tc of [{ anGiai: true }, {}, { anGiai: false }]) {
      expect(phieu(tc)).not.toContain('id="du-nop"')
    }
  })
})

describe('màn xem điểm truyền mã nộp cho CẢ bản chỉ đề', () => {
  it('bỏ điều kiện !anGiai ở PhieuScreen', () => {
    expect(MAN).toContain('const nop = ma && sbdEm ? { ma, sbd: sbdEm, url } : null')
    expect(MAN).not.toContain('const nop = !anGiai && ma && sbdEm')
  })

  it('vẫn đòi đủ mã phiếu và SBD — thiếu thì chỉ đọc như cũ', () => {
    const dau = MAN.indexOf('const nop = ma && sbdEm')
    expect(dau).toBeGreaterThan(0)
    expect(MAN.slice(dau, dau + 60)).toContain('? { ma, sbd: sbdEm, url } : null')
  })

  it('html-phieu cũng bỏ điều kiện đó', () => {
    const lib = fs.readFileSync(path.join(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8')
    expect(lib).toContain('const nop = tuyChon.nop ?? null')
    expect(lib).not.toContain('const nop = !anGiai && tuyChon.nop')
  })
})
