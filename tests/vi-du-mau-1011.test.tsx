// VÍ DỤ MẪU + LUẬT «TÍNH / ĐỌC ĐỀ SAI ⇒ ĐÚNG 1 LẦN» — khối B lát 6 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-4, đặc tả mục 2;
// 10/11 «Làm nốt hết đi đẩy lên bản sống luôn nhé»).
// Khoá: máy chủ chọn ví dụ mẫu cho nhóm «Chưa biết cách» / «Học lại» = câu cùng dạng em đã làm, lần cuối đúng, không trong kế hoạch hôm nay, không còn lỗi mở
// (ưu tiên câu thành thạo); nhóm loại khác không có; thẻ có nút «Xem ví dụ mẫu» (chỉ khi có token, nhóm chưa xong) mở tấm lười tải câu qua lệnh «Câu đã làm»;
// hàng sửa ngày Sửa bỏ câu «Tính / đọc đề sai» đã đúng ≥ 1 ngày sau lần sai cuối (trừ khi còn dấu Chưa chắc).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { nhomSua7, themSua7 } from '../server/src/goi-bai-7-nhom-sua'
import { docNhomSua } from '../src/components/hoc-tap/nhom-sua-doc'
import NhomSuaHomNay from '../src/components/hoc-tap/NhomSuaHomNay'

vi.mock('../src/components/hoa2/tai-chi-tiet', () => ({ taiChiTiet: vi.fn(async () => []) }))
afterEach(() => cleanup())

const meta = new Map([
  ['s1', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['v1', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['v2', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }],
  ['v3', { dang: 'D1', tenDang: 'Khối lượng muối của amine' }], ['b1', { dang: 'D2', tenDang: 'Tính base của amine' }], ['w1', { dang: 'D2', tenDang: 'Tính base của amine' }],
])
const tt = (o: Partial<{ laMoi: boolean; lanCuoiDung: boolean | null; thanhThao: boolean; catTia: boolean }>) => ({ laMoi: false, lanCuoiDung: true, thanhThao: false, catTia: false, ...o })

describe('chọn ví dụ mẫu (máy chủ)', () => {
  it('nhóm Chưa biết cách ⇒ câu cùng dạng đã làm đúng, ưu tiên thành thạo; không chọn câu mới / lần cuối sai / đang trong kế hoạch; nhóm Tính / đọc đề sai không có', () => {
    const hs = { meta, tt: new Map([['v1', tt({})], ['v2', tt({ thanhThao: true })], ['v3', tt({ laMoi: true, thanhThao: true })], ['s1', tt({})], ['w1', tt({ thanhThao: true })]]) }
    const ds = nhomSua7([{ qid: 's1', vai: 'sua' }, { qid: 'b1', vai: 'sua' }], hs, new Map([['s1', 'cach'], ['b1', 'tinh']]))
    expect(ds[0]).toMatchObject({ ten: 'Khối lượng muối của amine', loai: 'cach', viDu: 'v2' })
    expect(ds[1]).not.toHaveProperty('viDu')
    const sai = { meta, tt: new Map([['v1', tt({ lanCuoiDung: false })]]) }
    expect(nhomSua7([{ qid: 's1', vai: 'sua' }], sai, new Map([['s1', 'cach']]))[0]).not.toHaveProperty('viDu')
  })
})

describe('luật Tính / đọc đề sai ⇒ đúng 1 lần là đủ (hàng sửa ngày Sửa)', () => {
  it('bỏ câu tinh đã đúng ≥ 1 ngày sau lần sai cuối; giữ câu tinh chưa đúng lần nào / còn dấu Chưa chắc; câu loại khác giữ', () => {
    const loiV2 = new Map([
      ['t1', { soLanSai: 1, saiCuoi: '2026-11-05', trangThai: 'cho_kiem', ngayDung: ['2026-11-07'] }],
      ['t2', { soLanSai: 1, saiCuoi: '2026-11-05', trangThai: 'mo', ngayDung: [] }],
      ['t3', { soLanSai: 1, saiCuoi: '2026-11-05', trangThai: 'cho_kiem', ngayDung: ['2026-11-07'] }],
      ['c1', { soLanSai: 1, saiCuoi: '2026-11-05', trangThai: 'cho_kiem', ngayDung: ['2026-11-07'] }],
    ])
    const lyDo = new Map<string, 'tinh' | 'cach' | 'cc'>([['t1', 'tinh'], ['t2', 'tinh'], ['t3', 'tinh'], ['cc:t3', 'cc'], ['c1', 'cach']])
    expect(themSua7(['t1', 't2', 't3', 'c1'], { cau: [], loiV2 }, lyDo, '2026-11-10')).toEqual(['t2', 't3', 'c1'])
  })
})

describe('thẻ: nút Xem ví dụ mẫu', () => {
  const G = { bat: true as const, ngay: '2026-11-11', toiThieu: 28, daLamHomNay: 0, tuLamCon: 28, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [], goi: [], loaiNgay: 'sua' as const,
    nhomSua: [{ ten: 'Khối lượng muối của amine', so: 8, xong: 0, loai: 'cach', viDu: 'v2' }, { ten: 'Tính base của amine', so: 6, xong: 0, loai: 'tinh' }, { ten: 'Đồng phân amine', so: 4, xong: 4, loai: 'cach', viDu: 'v9' }] }
  it('đọc chặt viDu; chỉ nhóm có ví dụ + chưa xong + có token mới có nút; bấm ⇒ mở tấm ví dụ mẫu', async () => {
    expect(docNhomSua([{ ten: 'X', so: 2, viDu: 'q'.repeat(201) }])).toEqual([{ ten: 'X', so: 2, xong: 0 }])
    const { rerender } = render(<NhomSuaHomNay g={G as never} />)
    expect(screen.queryByRole('button', { name: 'Xem ví dụ mẫu' })).toBeNull()
    rerender(<NhomSuaHomNay g={G as never} token="tk" />)
    const nut = screen.getAllByRole('button', { name: 'Xem ví dụ mẫu' })
    expect(nut).toHaveLength(1)
    act(() => { fireEvent.click(nut[0]!) })
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(await screen.findByText('Chưa mở được ví dụ mẫu.', { exact: false })).toBeTruthy()
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu — làm nhóm này' })) })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
