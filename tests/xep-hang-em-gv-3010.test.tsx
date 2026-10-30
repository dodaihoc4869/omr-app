// @vitest-environment jsdom
// XẾP HẠNG HỌC SINH trên Hôm nay của thầy (thầy 30/10 «nhìn vào là tôi biết e nào lười nhất chăm nhất học thật nhất», src/components/hom-nay-thay/XepHangEm.tsx).
// Khoá: 4 cột Lười nhất · Chăm nhất · Học thật nhất · Đối phó nhiều nhất, mỗi cột 5 em đầu ĐÚNG thứ tự đã xếp, có số hạng 1–5; «Xem đủ N em» gọi đúng
// cột; bấm em ⇒ mở hồ sơ đúng mã; Học thật = bậc 1 của bảng tuần, Điểm Thật cao trước, lọc khối / lớp theo Nhịp học; điện thoại ⇒ 4 thẻ chọn;
// bảng Học thật tắt / chưa tải ⇒ nói rõ, không bịa; Hôm nay «Một trang» đặt dải ngay dưới dải số.
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import XepHangEm, { chuDoiPho, xepHocThat, type HocThatLop } from '../src/components/hom-nay-thay/XepHangEm'
import type { DongNhipHoc } from '../src/lib/nhip-hoc-thay'
import type { EmLop } from '../src/lib/hoc-that-api'

afterEach(cleanup)

const dong = (i: number, them: Partial<DongNhipHoc> = {}): DongNhipHoc => ({
  sbd: `S${i}`, hoTen: `Em Số ${i}`, lop: i % 2 ? '12A1' : '11B2', khoi: i % 2 ? '12' : '11', ngayVao: '2026-10-01', nhom: 'luoi', soNgayQua: 10, soNgayDu: 2,
  soNgayThieu: 8, tongCauThieu: 120, soNgayKhongLam: 3, tongLam: 90, chuoiKhongLam: null, chuoiDuGanNhat: 0, homNay: null, o: [], doiPho: null, ...them,
})
const em = (i: number, diem: number, bac: EmLop['bac'] = 1, lop = '12A1'): EmLop => ({
  sbd: `S${i}`, ten: `Em Số ${i}`, lop, tuan: '2026-10-26', diem, bac, bacTuan: bac, duDuLieu: true, coDo: false, phat: [], soLieu: null, tienBo: null,
  lyDo: ['đọc kỹ đề'], viec: null, bangChung: null,
})
const LUOI = Array.from({ length: 7 }, (_, i) => dong(i + 1, { soNgayThieu: 10 - i }))
const CHAM = Array.from({ length: 3 }, (_, i) => dong(20 + i, { nhom: 'cham', soNgayDu: 10 - i, soNgayThieu: i }))
const DOI_PHO = [dong(30, { doiPho: { quaNhanh: { nhanh: 23, coGiay: 54, dungNhanh: 28, dungThuong: 78, coTuTinh: false }, chonLap: null, lyDo: ['x'] } })]
const HT_DS = [em(40, 97), em(41, 91), em(42, 88)]
const HT: HocThatLop = { tt: 'co', cheDo: 'ngam', em: HT_DS }

function ve(them: Partial<Parameters<typeof XepHangEm>[0]> = {}) {
  const onMoEm = vi.fn(), onXemDu = vi.fn()
  render(<XepHangEm luoi={LUOI} cham={CHAM} doiPho={DOI_PHO} hocThat={HT} hocThatDs={HT_DS} hep={false} tenLoc="" onMoEm={onMoEm} onXemDu={onXemDu} {...them} />)
  return { onMoEm, onXemDu }
}

describe('dải 4 cột (máy tính)', () => {
  it('đủ 4 cột, số em mỗi cột; Lười nhất 5 em đầu đúng thứ tự có hạng 1–5 + «Xem đủ 7 em»', () => {
    const { onXemDu } = ve()
    for (const ten of ['Lười nhất', 'Chăm nhất', 'Học thật nhất', 'Đối phó nhiều nhất']) expect(screen.getByRole('heading', { name: ten })).toBeTruthy()
    const luoi = screen.getByRole('heading', { name: 'Lười nhất' }).closest('section')!
    const nut = within(luoi).getAllByRole('button', { name: /^Hạng/ })
    expect(nut.map((b) => b.getAttribute('data-hang'))).toEqual(['1', '2', '3', '4', '5'])
    expect(nut[0]!.getAttribute('aria-label')).toContain('Em Số 1, 12A1, Thiếu 10/10 ngày')
    expect(luoi.textContent).toContain('7 em')
    fireEvent.click(within(luoi).getByRole('button', { name: /Xem đủ 7 em/ }))
    expect(onXemDu).toHaveBeenCalledWith('luoi')
  })
  it('cột ít hơn 5 em ⇒ không có «Xem đủ»; bấm em ⇒ mở hồ sơ đúng mã', () => {
    const { onMoEm } = ve()
    const cham = screen.getByRole('heading', { name: 'Chăm nhất' }).closest('section')!
    expect(within(cham).queryByRole('button', { name: /Xem đủ/ })).toBeNull()
    fireEvent.click(within(cham).getAllByRole('button', { name: /^Hạng/ })[1]!)
    expect(onMoEm).toHaveBeenCalledWith('S21', expect.anything())
  })
  it('Học thật: Điểm Thật của bảng tuần; Đối phó: tín hiệu nặng nhất bằng số', () => {
    ve()
    const ht = screen.getByRole('heading', { name: 'Học thật nhất' }).closest('section')!
    expect(within(ht).getAllByRole('button', { name: /^Hạng/ }).map((b) => b.textContent)).toEqual([expect.stringContaining('Điểm Thật 97'), expect.stringContaining('Điểm Thật 91'), expect.stringContaining('Điểm Thật 88')])
    const dp = screen.getByRole('heading', { name: 'Đối phó nhiều nhất' }).closest('section')!
    expect(dp.textContent).toContain('23/54 câu quá nhanh')
  })
  it('bảng Học thật tắt / chưa tải / lỗi ⇒ nói rõ lý do, không bịa em', () => {
    ve({ hocThat: { tt: 'co', cheDo: 'tat', em: [] }, hocThatDs: [] })
    expect(screen.getByText(/Thầy đang tắt xếp Học thật · Đối phó/)).toBeTruthy()
    cleanup()
    ve({ hocThat: { tt: 'cho' }, hocThatDs: [] })
    expect(screen.getByText('Đang tải bảng Học thật…')).toBeTruthy()
    cleanup()
    ve({ hocThat: { tt: 'loi', chu: 'Mất mạng.' }, hocThatDs: [] })
    expect(screen.getByText(/Chưa tải được bảng Học thật\. Mất mạng\./)).toBeTruthy()
  })
})

describe('điện thoại: 4 thẻ chọn', () => {
  it('mặc định Lười; bấm «Học thật» ⇒ danh sách Học thật', () => {
    ve({ hep: true })
    const tab = screen.getAllByRole('tab')
    expect(tab.map((t) => t.textContent)).toEqual(['Lười 7', 'Chăm 3', 'Học thật 3', 'Đối phó 1'])
    expect(screen.getByRole('tabpanel').textContent).toContain('Thiếu 10/10 ngày')
    fireEvent.click(screen.getByRole('tab', { name: /Học thật/ }))
    expect(screen.getByRole('tabpanel').textContent).toContain('Điểm Thật 97')
  })
})

describe('hàm thuần', () => {
  it('xepHocThat: chỉ bậc Học thật đủ dữ liệu, Điểm Thật cao trước; lọc khối / lớp theo Nhịp học', () => {
    const ds = [em(1, 80), em(2, 95), em(3, 70, 2), { ...em(4, 99), duDuLieu: false }, em(5, 90, 1, '11B2')]
    const nhip = [{ sbd: 'S1', khoi: '12', lop: '12A1' }, { sbd: 'S2', khoi: '12', lop: '12A1' }, { sbd: 'S5', khoi: '11', lop: '11B2' }]
    expect(xepHocThat(ds, nhip, { khoi: null, lop: '' }).map((e) => e.sbd)).toEqual(['S2', 'S5', 'S1'])
    expect(xepHocThat(ds, nhip, { khoi: '12', lop: '' }).map((e) => e.sbd)).toEqual(['S2', 'S1'])
    expect(xepHocThat(ds, nhip, { khoi: null, lop: '11B2' }).map((e) => e.sbd)).toEqual(['S5'])
  })
  it('chuDoiPho: quá nhanh nặng hơn ⇒ câu quá nhanh; chọn lặp nặng hơn ⇒ câu chọn lặp', () => {
    expect(chuDoiPho(DOI_PHO[0]!).chinh).toBe('23/54 câu quá nhanh')
    expect(chuDoiPho(dong(1, { doiPho: { quaNhanh: { nhanh: 2, coGiay: 50, dungNhanh: null, dungThuong: null, coTuTinh: false }, chonLap: { trongChuoi: 12, tong: 70, dai: 6, chu: 'D' }, lyDo: [] } })))
      .toEqual({ chinh: '12/70 câu chọn lặp', phu: 'chọn D 6 lần liền' })
  })
})

describe('chỗ đặt trên Hôm nay «Một trang»', () => {
  it('dải xếp hạng ngay dưới dải số; ô «Em cần thầy để ý» 3 em đã gộp vào dải; bảng Học thật chỉ nạp ở bản «Một trang»', () => {
    const src = readFileSync('src/components/hom-nay-thay/NhipHocThay.tsx', 'utf8')
    expect(src.indexOf('<XepHangEm')).toBeGreaterThan(src.indexOf('{nhtODs}\n        </div>'))
    expect(src).not.toContain('mt-de-y')
    expect(src).toContain('useHocThatLop(trong)')
    const css = readFileSync('src/styles/trong-gv-hom-nay.css', 'utf8')
    expect(css).toContain("grid-template-areas: 'so so so' 'xep xep xep' 'viec lop cot3'")
  })
})
