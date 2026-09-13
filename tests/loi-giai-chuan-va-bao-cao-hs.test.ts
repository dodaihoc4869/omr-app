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

  it('tự động hoàn thiện kiến thức cốt lõi và từng phương án cho câu hạt nhân nếu thiếu cấu trúc', () => {
    const res = chuanHoaLoiGiaiCau(
      '',
      'I',
      'C',
      ['Electron.', 'Neutron.', 'Proton.', 'Photon.'],
      'Loại hạt được tìm thấy trong hạt nhân và mang điện tích dương?',
      'Cấu tạo nguyên tử'
    )

    expect(res.chot).toContain('Trong hạt nhân có proton')
    expect(res.lyDo).toHaveLength(4)
    expect(res.lyDo?.[2].khoa).toBe('C')
    expect(res.lyDo?.[2].dung).toBe(true)
    expect(res.lyDo?.[2].ly).toContain('Proton')
  })

  it('khi nạp vào oGiaiHtml sinh đầy đủ Kiến thức cốt lõi và Vì sao chọn từng phương án theo chuẩn Ảnh 4', () => {
    const lg = chuanHoaLoiGiaiCau(
      '',
      'I',
      'C',
      ['Electron.', 'Neutron.', 'Proton.', 'Photon.'],
      'Loại hạt được tìm thấy trong hạt nhân và mang điện tích dương?',
      'Cấu tạo nguyên tử'
    )

    const c: CauLuyen = {
      phan: 'I',
      id: 'cau_1',
      maDe: 'test',
      chuyenDe: 'Cấu tạo nguyên tử',
      dang: 'ly_thuyet',
      sao: 1,
      mucDo: 'biet',
      text: 'Loại hạt được tìm thấy trong hạt nhân và mang điện tích dương?',
      luaChon: ['Electron.', 'Neutron.', 'Proton.', 'Photon.'],
      dapAn: 'C',
      chot: lg.chot,
      lyDo: lg.lyDo,
      buoc: lg.buoc,
      ketQua: lg.ketQua,
    }

    const html = oGiaiHtml(c)
    expect(html).toContain('Đáp án: <b>C</b>')
    expect(html).toContain('Kiến thức cốt lõi')
    expect(html).toContain('sol-cot-loi')
    expect(html).toContain('Vì sao chọn / không chọn từng phương án')
    expect(html).toContain('<strong>A.</strong> ✗')
    expect(html).toContain('<strong>C.</strong> ✓')
  })
})
