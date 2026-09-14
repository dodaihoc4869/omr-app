import { describe, it, expect } from 'vitest'
import { chuanHoaLoiGiaiCau } from '../src/lib/chuan-hoa-loi-giai'
import { oGiaiHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

describe('Chuẩn hoá lời giải Hoá học theo chuẩn Ảnh 4', () => {
  it('xử lý đúng định dạng snake_case tung_pa và vi_sao từ kho đề', () => {
    const rawLg = {
      chot: 'Trong hạt nhân có proton (điện tích +1) và neutron (không mang điện).',
      tung_pa: {
        A: { dung: false, vi_sao: 'Electron mang điện âm và nằm ở lớp vỏ, không ở hạt nhân.' },
        B: { dung: false, vi_sao: 'Neutron ở trong hạt nhân nhưng không mang điện.' },
        C: { dung: true, vi_sao: 'Proton nằm trong hạt nhân và mang điện tích dương.' },
        D: { dung: false, vi_sao: 'Photon không phải hạt cấu tạo nên hạt nhân.' },
      },
    }

    const res = chuanHoaLoiGiaiCau(rawLg, 'I', 'C')
    expect(res.chot).toBe('Trong hạt nhân có proton (điện tích +1) và neutron (không mang điện).')
    expect(res.lyDo).toHaveLength(4)
    expect(res.lyDo?.[0]).toEqual({
      khoa: 'A',
      dung: false,
      ly: 'Electron mang điện âm và nằm ở lớp vỏ, không ở hạt nhân.',
    })
    expect(res.lyDo?.[2]).toEqual({
      khoa: 'C',
      dung: true,
      ly: 'Proton nằm trong hạt nhân và mang điện tích dương.',
    })
  })

  it('xử lý đúng chuỗi JSON stringified từ server', () => {
    const jsonStr = JSON.stringify({
      chot: 'Kim loại kiềm có 1 electron lớp ngoài cùng.',
      tungPa: {
        A: { dung: true, viSao: 'Na có cấu hình [Ne]3s1.' },
        B: { dung: false, viSao: 'Mg là kim loại kiềm thổ.' },
      },
    })

    const res = chuanHoaLoiGiaiCau(jsonStr, 'I', 'A')
    expect(res.chot).toBe('Kim loại kiềm có 1 electron lớp ngoài cùng.')
    expect(res.lyDo?.[0].dung).toBe(true)
    expect(res.lyDo?.[0].ly).toBe('Na có cấu hình [Ne]3s1.')
  })

  // SỬA 14/09 — THẦY ĐỔI LUẬT, KHÔNG PHẢI SỬA TEST CHO XANH.
  //
  // Hai ca dưới đây trước kia khoá đúng hành vi BỊA: thiếu lời giải thì tự ghép
  // một câu "Trong hạt nhân có proton…" theo từ khoá trong đề, hoặc chép chữ
  // bốn phương án rồi dán một câu khuôn vào sau. Thầy bắt được bản in phần III
  // ngày 14/09 và chốt: "đáp án trả lời ngắn phải có giải từng bước" — tức lấy
  // lời giải THẬT trong kho, còn kho chưa có thì nói thẳng là chưa có.
  //
  // Nên hai ca này nay khoá đúng điều ngược lại: CẤM BỊA.
  it('kho không có lời giải thì KHÔNG bịa, chỉ báo thiếu', () => {
    const res = chuanHoaLoiGiaiCau('', 'I', 'C')
    expect(res.thieu).toBe(true)
    expect(res.chot).toBe('')
    expect(res.lyDo).toBeNull()
    expect(res.buoc).toBeNull()
    expect(res.ketQua).toBe('C')
  })

  it('phần III có bước trong kho thì oGiaiHtml in đủ LÀM TỪNG BƯỚC', () => {
    const lg = chuanHoaLoiGiaiCau(
      {
        chot: 'Phản ứng toả nhiệt và có 3 mol khí chuyển thành 2 mol khí.',
        buoc: [
          'Phản ứng toả nhiệt và có 3 mol khí chuyển thành 2 mol khí.',
          '(2) tăng áp suất, (3) hạ nhiệt độ và (5) giảm nồng độ SO₃ đều đẩy chiều thuận.',
          '(1), (6) đẩy chiều nghịch, (4) không làm chuyển dịch. Vậy có 3 biện pháp.',
        ],
        ket_qua: '3',
      },
      'III',
      '3',
    )
    expect(lg.thieu).toBe(false)
    expect(lg.buoc).toHaveLength(3)

    const c: CauLuyen = {
      phan: 'III',
      id: 'cau_11',
      maDe: 'test',
      chuyenDe: 'Cân bằng hoá học',
      dang: 'bai_tap',
      sao: 2,
      mucDo: 'van_dung',
      text: 'Có bao nhiêu biện pháp làm cân bằng chuyển dịch theo chiều thuận?',
      luaChon: null,
      dapAn: '3',
      chot: lg.chot,
      lyDo: lg.lyDo,
      buoc: lg.buoc,
      ketQua: lg.ketQua,
    }

    const html = oGiaiHtml(c)
    expect(html).toContain('Đáp án: <b>3</b>')
    expect(html).toContain('Kiến thức cốt lõi')
    expect(html).toContain('(1), (6) đẩy chiều nghịch')
    expect(html.toLowerCase()).toContain('từng bước')
    // Câu độn cũ phải biến mất khỏi mọi bản in.
    expect(html).not.toContain('Cần chú ý định luật bảo toàn')
  })

  it('phần II đọc tung_y và giữ khoá ý in thường a–d', () => {
    const res = chuanHoaLoiGiaiCau(
      {
        chot: 'Ester no đơn chức mạch hở có công thức chung CnH2nO2.',
        tung_y: {
          a: { dung: true, vi_sao: 'Đúng với công thức chung.' },
          b: { dung: false, vi_sao: 'Sai vì còn một liên kết pi ở nhóm C=O.' },
        },
      },
      'II',
      'DSDD',
    )
    expect(res.lyDo?.map((p) => p.khoa)).toEqual(['a', 'b'])
    expect(res.lyDo?.[0].dung).toBe(true)
    expect(res.thieu).toBe(false)
  })
})
