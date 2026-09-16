/**
 * ẢNH VÀ BẢNG PHẢI ĐI ĐƯỢC TỚI MẮT HỌC SINH — 16-09.
 *
 * Thầy chốt 15-09: *"tất cả các câu có hình ảnh, bảng biểu đều mang vào game
 * được, hiển thị đúng chuẩn cấu trúc nhé"*.
 *
 * Ngày 15-09 mới làm được NỬA việc: `doiCauSaiThanhCauChoi` thôi vứt câu có
 * ảnh, nhưng màn chiến đấu vẫn chỉ in chữ. Câu "dựa vào đồ thị bên dưới" hiện
 * ra không kèm đồ thị nào — em buộc phải đoán, rồi cái đoán sai ấy được ghi
 * vào sổ như em học kém. Phép kiểm dưới đây chặn đúng ba lỗi đã xảy ra.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { doiCauSaiThanhCauChoi, type CauSaiTho } from '../src/game/than-thu-hoa-hoc/cau-hoi-cua-em'

const A = (k: string) => `data:image/png;base64,${k}`

function cauTho(them: Partial<CauSaiTho> = {}): CauSaiTho {
  return {
    phan: 'I', qid: 'q1', maCa: 'CA1', soCau: 1, text: 'Đề bài',
    choices: ['một', 'hai', 'ba', 'bốn'], dapAnDung: 'A',
    ...them,
  } as CauSaiTho
}

describe('ảnh của câu vào game', () => {
  it('VỊ TRÍ ẢNH LÀ CHUỖI, không phải số — ép Number() là mất sạch vị trí', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({ hinhAnh: [{ src: A('de'), viTri: 'sau_de' }, { src: A('cuoi'), viTri: 'cuoi_cau' }] }),
    ])
    expect(kq.dsCau).toHaveLength(1)
    const c = kq.dsCau[0]!
    expect(c.anhXen.map((h) => h.viTri)).toEqual(['sau_de', 'cuoi_cau'])
    for (const h of c.anhXen) expect(Number.isNaN(Number(h.viTri))).toBe(true)
  })

  it('ẢNH PHƯƠNG ÁN nằm ở phương án, KHÔNG dồn lên thân câu', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({
        hinhAnh: [
          { src: A('paA'), viTri: 'sau_pa_A' },
          { src: A('paC'), viTri: 'sau_pa_C' },
          { src: A('de'), viTri: 'sau_de' },
        ],
      }),
    ])
    const c = kq.dsCau[0]!
    expect(c.anhPhuongAn).toEqual([A('paA'), '', A('paC'), ''])
    // Thân câu chỉ còn ảnh `sau_de` — hai ảnh phương án không được lọt vào.
    expect(c.anhXen.map((h) => h.url)).toEqual([A('de')])
  })

  it('`choiceImgs` thắng ảnh `sau_pa_*` khi có cả hai', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({
        choiceImgs: [A('thay'), undefined, undefined, undefined],
        hinhAnh: [{ src: A('sau'), viTri: 'sau_pa_A' }],
      }),
    ])
    expect(kq.dsCau[0]!.anhPhuongAn[0]).toBe(A('thay'))
  })

  it('PHƯƠNG ÁN CHỈ CÓ ẢNH vẫn chơi được — trước đây vứt cả câu', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({ choices: ['', '', '', ''], choiceImgs: [A('a'), A('b'), A('c'), A('d')] }),
    ])
    expect(kq.dsCau).toHaveLength(1)
    expect(kq.lyDoBoQua.thieuPhuongAn ?? 0).toBe(0)
  })

  it('thiếu CẢ chữ LẪN ảnh ở một phương án thì vẫn phải bỏ — không bịa ra phương án', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({ choices: ['', 'hai', 'ba', 'bốn'], choiceImgs: [undefined, A('b'), A('c'), A('d')] }),
    ])
    expect(kq.dsCau).toHaveLength(0)
    expect(kq.lyDoBoQua.thieuPhuongAn).toBe(1)
  })

  it('BẢNG BIỂU giữ nguyên hàng cột, không tự điền ô trống', () => {
    const kq = doiCauSaiThanhCauChoi([
      cauTho({ table: [['Chất', 'pH'], ['HCl', '1'], ['NaOH', '']] }),
    ])
    expect(kq.dsCau[0]!.bang).toEqual([['Chất', 'pH'], ['HCl', '1'], ['NaOH', '']])
  })
})

describe('màn chiến đấu thật sự vẽ ảnh và bảng ra', () => {
  const GAME = readFileSync('src/components/ThanThuHoaHocGame.tsx', 'utf8')
  const KHUNG = readFileSync('src/components/CauHoiTrongGame.tsx', 'utf8')

  it('cả HAI màn hỏi (leo tháp và săn boss) đều dựng thân câu bằng `ThanCauGame`', () => {
    expect(GAME.split('<ThanCauGame').length - 1).toBe(2)
  })

  it('cả hai màn đều dựng phương án bằng `NoiDungPhuongAn` — không in chuỗi trơ', () => {
    expect(GAME.split('<NoiDungPhuongAn').length - 1).toBe(2)
    // Không còn chỗ nào in thẳng `{pa}` — đó là cách cũ, nuốt mất ảnh.
    expect(GAME).not.toContain('<span>{pa}</span>')
  })

  it('khung câu dùng lại đúng bộ hiển thị của thẻ câu thi, không tự nghĩ kiểu mới', () => {
    expect(KHUNG).toContain("from './QuestionMedia'")
    expect(KHUNG).toContain('BangSoLieu')
    expect(KHUNG).toContain('ZoomableImage')
    expect(KHUNG).toContain('CauHinh')
  })
})
