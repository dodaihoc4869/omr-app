// NHÓM LỖI NGÀY SỬA — khối B đợt 2 lát 3 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3, «làm hết sạch đẩy luôn lên bản sống»).
// Khoá: câu sửa của kế hoạch gom theo dạng, loại lỗi nặng nhất em chạm («Vì sao em sai?», bảng goi_bai_7_ly_do) — đọc CÙNG câu đọc mức ngày (0 lệnh thêm);
// chỉ ngày Sửa có `nhomSua`; app đọc chặt; thẻ «Nhóm lỗi hôm nay» hiện số thứ tự · tên dạng · loại lỗi · số câu.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { nhomSua7, xepSuaTheoNhom, SAI_HOC_LAI } from '../server/src/goi-bai-7-nhom-sua'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'
import { docNhomSua } from '../src/components/hoc-tap/nhom-sua-doc'
import NhomSuaHomNay from '../src/components/hoc-tap/NhomSuaHomNay'

afterEach(() => cleanup())

describe('nhomSua7 (luật thuần)', () => {
  const meta = new Map([
    ['a1', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['a2', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['a3', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }],
    ['b1', { dang: 'D2', tenDang: 'Tính base của amine' }], ['c1', { dang: null, tenDang: null }], ['d1', { dang: 'D4', tenDang: 'Danh pháp amine' }],
  ])
  const sua = (...q: string[]) => q.map(qid => ({ qid, vai: 'sua' }))
  it('gom theo dạng theo thứ tự kế hoạch; loại nặng nhất; câu song sinh quy về gốc; không dạng ⇒ «Câu sai khác»; câu không phải sửa bỏ qua', () => {
    const ly = new Map([['a1', 'tinh'], ['a2', 'cach'], ['b1', 'tinh']] as const)
    expect(nhomSua7([...sua('a1', 'b1', 'a2~ss0', 'c1'), { qid: 'm1', vai: 'moi' }], { meta }, ly)).toEqual([
      { ten: 'Khối lượng muối của amine', so: 2, xong: 0, loai: 'cach' },
      { ten: 'Tính base của amine', so: 1, xong: 0, loai: 'tinh' },
      { ten: 'Câu sai khác', so: 1, xong: 0 },
    ])
  })
  it('sai từ 3 lần ⇒ nhóm «Học lại» (thắng mọi loại); câu lỗi cũ đã làm hôm nay ⇒ tính vào nhóm, phần xong; câu mới sai hôm nay không tính', () => {
    const loiV2 = new Map([['a3', { soLanSai: 1, saiCuoi: '2026-11-08' }], ['d1', { soLanSai: SAI_HOC_LAI, saiCuoi: '2026-11-07' }], ['m9', { soLanSai: 1, saiCuoi: '2026-11-10' }]])
    const ds = nhomSua7(sua('a1', 'd1'), { meta, loiV2 }, new Map([['d1', 'tinh']]), new Set(['a3', 'm9']), '2026-11-10')
    expect(ds).toEqual([{ ten: 'Khối lượng muối của amine', so: 2, xong: 1 }, { ten: 'Danh pháp amine', so: 1, xong: 0, loai: 'hoc_lai' }])
  })
  it('xếp câu sửa liền theo nhóm (nhóm theo câu đầu tiên, trong nhóm giữ thứ tự)', () => {
    expect(xepSuaTheoNhom(['a1', 'b1', 'a2~ss0', 'c1', 'a3'], meta)).toEqual(['a1', 'a2~ss0', 'a3', 'b1', 'c1'])
  })
  it('quá 8 dạng ⇒ 7 nhóm đầu + «Các dạng khác» (đủ tổng câu)', () => {
    const m = new Map(Array.from({ length: 10 }, (_, i) => [`q${i}`, { dang: `D${i}`, tenDang: `Dạng ${i}` }]))
    const ds = nhomSua7([...m.keys()].map(qid => ({ qid, vai: 'sua' })), { meta: m }, new Map([['q9', 'nham']]))
    expect(ds).toHaveLength(8)
    expect(ds[7]).toEqual({ ten: 'Các dạng khác', so: 3, xong: 0, loai: 'nham' })
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
    expect(docNhomSua(tho)).toEqual([{ ten: 'Tính base của amine', so: 6, xong: 0, loai: 'nham' }, { ten: 'X', so: 2, xong: 0 }])
    expect(docNhomSua([{ ten: 'Y', so: 4, xong: 9, loai: 'hoc_lai' }])).toEqual([{ ten: 'Y', so: 4, xong: 4, loai: 'hoc_lai' }])
    expect(docNhomSua(null)).toEqual([])
  })
})

const G = { bat: true as const, ngay: '2026-11-11', toiThieu: 28, daLamHomNay: 0, tuLamCon: 28, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:a', ten: 'Bài 8. Amine', batDau: '2026-11-08', han: '2026-11-17', tong: 112, daGap: 56, con: 56, quota: 28, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['DH-B8'] }] }
describe('thẻ Nhóm lỗi hôm nay', () => {
  it('ngày Sửa: số thứ tự · tên dạng · nhãn loại · tiến độ x/y; nhóm xong mang dấu ✓; đầu thẻ đếm nhóm xong', () => {
    const { container } = render(<NhomSuaHomNay g={{ ...G, loaiNgay: 'sua', nhomSua: [{ ten: 'Khối lượng muối của amine', so: 8, xong: 8, loai: 'cach' }, { ten: 'Tính base của amine', so: 6, xong: 2, loai: 'nham' }, { ten: 'Đồng phân amine', so: 4, xong: 0 }, { ten: 'Danh pháp amine', so: 10, xong: 0, loai: 'hoc_lai' }] }} />)
    expect(container.querySelector('h2')!.textContent).toBe('Nhóm lỗi hôm nay1/4 nhóm · 28 câu')
    const dong = [...container.querySelectorAll('li')].map(li => li.textContent)
    expect(dong).toEqual(['✓Khối lượng muối của amineChưa biết cách8/8', '2Tính base của amineHiểu nhầm2/6', '3Đồng phân amine0/4', '4Danh pháp amineHọc lại · em đã sai nhiều lần0/10'])
    expect(container.querySelector('.kb-ns-loai[data-l=hoc_lai]')).toBeTruthy()
    expect(container.querySelector('.kb-no-bai')).toBeNull()
  })
  it('ngày học mới: không vẽ nhóm (dù có dữ liệu); không nợ ⇒ không vẽ gì', () => {
    expect(render(<NhomSuaHomNay g={{ ...G, loaiNgay: 'moi', nhomSua: [{ ten: 'X', so: 2, xong: 0 }] }} />).container.innerHTML).toBe('')
    expect(render(<NhomSuaHomNay g={{ ...G, loaiNgay: 'sua', nhomSua: [] }} />).container.innerHTML).toBe('')
  })
  it('dải nợ bài cũ: bài qua hạn còn câu chưa gặp ⇒ «Còn của <bài>: N câu chưa gặp — làm trước câu của bài mới» (mọi loại ngày)', () => {
    const no = { ...G.goi[0]!, id: 'g7:cu', ten: 'Bài 7. Ester', han: '2026-11-08', quaHan: true, con: 6 }
    const { container } = render(<NhomSuaHomNay g={{ ...G, loaiNgay: 'moi', goi: [no, G.goi[0]!] }} />)
    expect(container.querySelector('.kb-no-bai')!.textContent).toBe('Còn của Bài 7. Ester: 6 câu chưa gặp — làm trước câu của bài mới.')
    expect(render(<NhomSuaHomNay g={{ ...G, goi: [{ ...no, con: 0 }] }} />).container.innerHTML).toBe('')
  })
})
