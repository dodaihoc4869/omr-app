// PHIẾU CHỈ CÓ ĐỀ TUYỆT ĐỐI KHÔNG ĐƯỢC MỌC ĐƯỜNG NỘP.
//
// TỆP NÀY SINH RA TỪ MỘT LỖI TÔI ĐÃ GÂY RA TRÊN BẢN LIVE, 09/09.
//
// Thầy báo "rút đề tạo khắc phục nhưng bấm chọn đáp án không được". Tôi đọc
// `dungPhieu` thấy điều kiện `!anGiai && tuyChon.nop`, thấy CSS có luật
// `body.chi-de .q-opt.dung {…!important}` giấu đáp án, rồi KẾT LUẬN SAI rằng
// `anGiai` chỉ giấu đáp án bằng CSS nên vẫn chấm được. Tôi gỡ điều kiện đó và
// đẩy lên (`287f5a4`).
//
// SỰ THẬT NGƯỢC LẠI, nằm ngay trong tệp cùng file, cách chỗ tôi sửa 20 dòng:
//
//     export function boLoiGiai(c: CauLuyen): CauLuyen {
//       return { ...c, dapAn: '', chot: '', lyDo: null, buoc: null, ketQua: '', … }
//     }
//
// `anGiai` XOÁ HẲN trường `dapAn` khỏi DỮ LIỆU — đúng như thiết kế, để em mở
// "xem mã nguồn" cũng không thấy đáp án. Luật CSS kia là lớp phòng thủ thứ
// hai cho những bản CÓ đáp án, không phải cơ chế chính.
//
// HẬU QUẢ CỦA BẢN VÁ SAI: phiếu đề mọc thanh nộp, gói `du-nop` mang
// `dapAn: ''` cho MỌI câu ⇒ em bấm Nộp thì `chamTaiCho()` chấm sai hết, ra
// **0 điểm**, và con số 0 đó được `gui()` ghi thẳng lên sheet `NopKhacPhuc`.
// Không phải hỏng hiển thị — là ghi số sai vào dữ liệu của thầy.
//
// Bản vá đã bị lùi. Tệp này khoá lại để không ai (kể cả tôi ở phiên sau) gỡ
// điều kiện đó lần nữa: chừng nào `boLoiGiai` còn xoá `dapAn`, phiếu `anGiai`
// còn PHẢI là phiếu chỉ đọc.
//
// PHÉP KIỂM CŨ CỦA TÔI ĐÃ MÙ CHỖ NÀO: nó đòi thẻ `<button class="q-opt lam-o">`
// và `id="du-nop"` xuất hiện, nhưng KHÔNG hề mở gói `du-nop` ra xem `dapAn`
// bên trong còn gì không. Nên nó xanh trơn trong khi mã đã hỏng. Ở đây phép
// kiểm đọc THẲNG nội dung gói.
import { describe, expect, it } from 'vitest'
import { boLoiGiai, dungPhieu } from '../src/lib/html-phieu'
import { chamKhacPhuc } from '../src/lib/cau-hinh-nop-khac-phuc'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({
    phan: 'I',
    id: 'x',
    maDe: 'X',
    chuyenDe: 'Carbohydrate',
    dang: 'chua_ro',
    sao: 0,
    mucDo: 'hieu',
    text: 'Đề',
    luaChon: ['a', 'b', 'c', 'd'],
    dapAn: 'A',
    chot: 'c',
    lyDo: null,
    buoc: null,
    ketQua: '',
    ...o,
  }) as CauLuyen

const CAU: CauLuyen[] = [
  C({ id: 'q1', dapAn: 'C' }),
  C({ id: 'q2', phan: 'II', dapAn: 'DSDS' }),
  C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5' }),
]

const TT = { hoTen: 'Nguyễn Văn A', sbd: '12050', ngay: new Date(2026, 8, 9), tenChuyenDe: 'Carbohydrate', ketQua: '', hienDapAn: true }
const NOP = { ma: 'abcd1234ef', sbd: '12050', url: 'https://script.google.com/x/exec' }

/** Bóc gói JSON `du-nop` ra khỏi tài liệu. Trả `null` khi phiếu không có gói. */
function goiNop(html: string): { ma: string; sbd: string; cau: { id: string; phan: string; dapAn: string }[] } | null {
  const dau = html.indexOf('id="du-nop">')
  if (dau < 0) return null
  const cuoi = html.indexOf('</script>', dau)
  return JSON.parse(html.slice(dau + 'id="du-nop">'.length, cuoi).replace(/\\u003c/g, '<'))
}

describe('SỰ THẬT NỀN: anGiai XOÁ dữ liệu, không phải giấu bằng CSS', () => {
  it('boLoiGiai xoá sạch dapAn, chot, lyDo, buoc, ketQua', () => {
    const c = boLoiGiai(C({ id: 'q1', dapAn: 'C', chot: 'c', ketQua: '12,5' }))
    expect(c.dapAn).toBe('')
    expect(c.chot).toBe('')
    expect(c.lyDo).toBeNull()
    expect(c.buoc).toBeNull()
    expect(c.ketQua).toBe('')
  })

  it('bản chỉ đề KHÔNG chứa chuỗi đáp án ở bất kỳ đâu trong tài liệu', () => {
    const h = dungPhieu(TT, [C({ id: 'q1', dapAn: 'C', chot: 'ĐÁP ÁN BÍ MẬT' })], { anGiai: true })
    expect(h).not.toContain('ĐÁP ÁN BÍ MẬT')
  })

  it('CHẤM BẰNG BỘ ĐÃ XOÁ ĐÁP ÁN thì mọi câu đúng đều thành SAI — đây là thiệt hại thật', () => {
    const daXoa = CAU.map(boLoiGiai).map((c) => ({ id: c.id, phan: c.phan, dapAn: c.dapAn }))
    // Em làm ĐÚNG cả ba câu.
    const traLoiDung = { q1: 'C', q2: 'DSDS', q3: '12,5' }
    const kq = chamKhacPhuc(daXoa, traLoiDung)
    expect(kq.soCau).toBe(3)
    expect(kq.soDung).toBe(0)
    // Đối chứng: cùng bài làm đó, chấm bằng bộ CÒN đáp án thì đúng cả ba.
    const conDapAn = CAU.map((c) => ({ id: c.id, phan: c.phan, dapAn: c.dapAn }))
    expect(chamKhacPhuc(conDapAn, traLoiDung).soDung).toBe(3)
  })
})

describe('KHOÁ: phiếu chỉ có đề không có đường nộp', () => {
  it('khai `nop` kèm `anGiai` thì gói du-nop KHÔNG được dựng', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP, anGiai: true })
    expect(goiNop(h)).toBeNull()
  })

  it('không có thanh nộp, không có nút nộp', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP, anGiai: true })
    expect(h).not.toContain('id="thanh-nop"')
    expect(h).not.toContain('id="nut-nop"')
  })

  it('không có ô bấm chọn — em không bị mời làm một việc sẽ bị chấm sai', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP, anGiai: true })
    expect(h).not.toContain('lam-o"')
    expect(h).not.toContain('data-chon=')
    expect(h).not.toContain('class="lam-nhap"')
  })

  it('không mang lớp co-lam trên body', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP, anGiai: true })
    const the = h.slice(h.indexOf('<body'), h.indexOf('>', h.indexOf('<body')) + 1)
    expect(the).not.toContain('co-lam')
  })

  it('ĐIỀU KIỆN CÒN NGUYÊN TRONG MÃ NGUỒN — chống gỡ lần nữa', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8')
    expect(src).toContain('const nop = !anGiai && tuyChon.nop ? tuyChon.nop : null')
    const man = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')
    expect(man).toContain('const nop = !anGiai && ma && sbdEm ? { ma, sbd: sbdEm, url } : null')
  })
})

describe('ĐỐI CHỨNG: bản CÓ đáp án vẫn nộp được bình thường', () => {
  it('không anGiai thì gói du-nop có đủ, và dapAn từng câu CÒN NGUYÊN', () => {
    const g = goiNop(dungPhieu(TT, CAU, { nop: NOP }))
    expect(g).not.toBeNull()
    expect(g!.cau.map((c) => c.id)).toEqual(['q1', 'q2', 'q3'])
    // Đây là phép kiểm mà bản trước của tôi thiếu: soi RUỘT gói, không chỉ soi vỏ.
    expect(g!.cau.map((c) => c.dapAn)).toEqual(['C', 'DSDS', '12,5'])
    for (const c of g!.cau) expect(c.dapAn).not.toBe('')
  })

  it('gói nộp không bao giờ được mang câu có dapAn rỗng', () => {
    const g = goiNop(dungPhieu(TT, CAU, { nop: NOP }))!
    expect(g.cau.filter((c) => String(c.dapAn).trim() === '')).toEqual([])
  })
})
