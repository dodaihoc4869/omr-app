// NHÓM LỖI NGÀY SỬA — khối B đợt 2 lát 3 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3, «làm hết sạch đẩy luôn lên bản sống»).
// Khoá: câu sửa của kế hoạch gom theo dạng, loại lỗi nặng nhất em chạm («Vì sao em sai?», bảng goi_bai_7_ly_do) — đọc CÙNG câu đọc mức ngày (0 lệnh thêm);
// chỉ ngày Sửa có `nhomSua`; app đọc chặt; thẻ «Nhóm lỗi hôm nay» hiện số thứ tự · tên dạng · loại lỗi · số câu.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { nhomSua7 } from '../server/src/goi-bai-7-nhom-sua'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'
import { docNhomSua } from '../src/components/hoc-tap/nhom-sua-doc'
import NhomSuaHomNay from '../src/components/hoc-tap/NhomSuaHomNay'

afterEach(() => cleanup())

describe('nhomSua7 (luật thuần)', () => {
  const meta = new Map([
    ['a1', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['a2', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }],
    ['b1', { dang: 'D2', tenDang: 'Tính base của amine' }], ['c1', { dang: null, tenDang: null }],
  ])
  it('gom theo dạng theo thứ tự kế hoạch; loại nặng nhất; câu song sinh quy về gốc; không dạng ⇒ «Câu sai khác»', () => {
    const ly = new Map([['a1', 'tinh'], ['a2', 'cach'], ['b1', 'tinh']] as const)
    expect(nhomSua7(['a1', 'b1', 'a2~ss0', 'c1'], meta, ly)).toEqual([
      { ten: 'Khối lượng muối của amine', so: 2, loai: 'cach' },
      { ten: 'Tính base của amine', so: 1, loai: 'tinh' },
      { ten: 'Câu sai khác', so: 1 },
    ])
    expect(nhomSua7(['a1'], meta, new Map([['a1', 'nham']]))[0]).toEqual({ ten: 'Khối lượng muối của amine', so: 1, loai: 'nham' })
  })
  it('quá 8 dạng ⇒ 7 nhóm đầu + «Các dạng khác» (đủ tổng câu)', () => {
    const m = new Map(Array.from({ length: 10 }, (_, i) => [`q${i}`, { dang: `D${i}`, tenDang: `Dạng ${i}` }]))
    const ds = nhomSua7([...m.keys()], m, new Map([['q9', 'nham']]))
    expect(ds).toHaveLength(8)
    expect(ds[7]).toEqual({ ten: 'Các dạng khác', so: 3, loai: 'nham' })
    expect(ds.reduce((s, n) => s + n.so, 0)).toBe(10)
  })
})

describe('app đọc nhomSua', () => {
  const tt = { bat: true, ngay: '2026-11-10', toiThieu: 28, daLamHomNay: 0, goi: [{ id: 'g7:a', ten: 'Bài 8. Amine', batDau: '2026-11-08', han: '2026-11-17', tong: 112, daGap: 28, con: 84, quota: 28, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['DH-B8'] }], diemDaDo: [], loaiNgay: 'sua' }
  it('tóm tắt chỉ chuyển tiếp (0 byte đường mở); mảnh lười đọc chặt: bỏ nhóm sai kiểu / loại lạ', () => {
    const tho = [{ ten: 'Tính base của amine', so: 6, loai: 'nham' }, { ten: 'X', so: 2, loai: 'la' }, { ten: '', so: 1 }, { ten: 'Y', so: 0 }, 'z']
    expect(docTomTatGoi7({ ...tt, nhomSua: tho })?.nhomSua).toEqual(tho)
    expect(docTomTatGoi7(tt)?.nhomSua).toBeUndefined()
    expect(docNhomSua(docTomTatGoi7({ ...tt, nhomSua: 'x' })?.nhomSua)).toEqual([])
    expect(docNhomSua(tho)).toEqual([{ ten: 'Tính base của amine', so: 6, loai: 'nham' }, { ten: 'X', so: 2 }])
    expect(docNhomSua(null)).toEqual([])
  })
})

describe('thẻ Nhóm lỗi hôm nay', () => {
  it('số thứ tự · tên dạng · nhãn loại · số câu; tổng ở đầu thẻ', () => {
    const { container } = render(<NhomSuaHomNay tho={[{ ten: 'Khối lượng muối của amine', so: 8, loai: 'cach' }, { ten: 'Tính base của amine', so: 6, loai: 'nham' }, { ten: 'Đồng phân amine', so: 4 }]} />)
    expect(container.querySelector('h2')!.textContent).toBe('Nhóm lỗi hôm nay3 nhóm · 18 câu')
    const dong = [...container.querySelectorAll('li')].map(li => li.textContent)
    expect(dong).toEqual(['1Khối lượng muối của amineChưa biết cách8 câu', '2Tính base của amineHiểu nhầm6 câu', '3Đồng phân amine4 câu'])
    expect(container.querySelector('.kb-ns-loai[data-l=nham]')).toBeTruthy()
  })
  it('không nhóm ⇒ không vẽ', () => {
    expect(render(<NhomSuaHomNay tho={[]} />).container.innerHTML).toBe('')
  })
})
