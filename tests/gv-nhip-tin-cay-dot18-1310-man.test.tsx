// ĐỢT 18 (13/10) — GIAO DIỆN chip độ tin cậy trên Nhịp học của thầy (`NhipHocThay`). Phần máy chủ + ảnh chụp nhóm: tests/gv-nhip-tin-cay-dot18-1310.test.ts.
// Kiểm: mỗi dòng em có chip "Độ tin cậy N%" (từ 90% tông chắc) · dưới 90% "· đang theo dõi" + câu "cần thêm" khi trỏ chuột (title) và thành dòng chữ
// khi mở rộng cột ("Xem đủ") · cột Đối phó chip kèm tên nhóm · trình đọc màn hình nghe được độ tin cậy · máy chủ cũ (không gửi) ⇒ không chip, nhãn y cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { EmNhipHoc, KetQuaNhipHoc } from '../server/src/nhip-hoc-kieu'

vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({ default: () => <div role="dialog" aria-label="Hồ sơ làm bài" /> }))
vi.mock('../src/components/chien-dich/TheBaiHangNgay', () => ({ default: () => <section aria-label="Bảng giả" /> }))

import NhipHocThay from '../src/components/hom-nay-thay/NhipHocThay'

afterEach(() => cleanup())

const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = '2026-10-12'
const CAN_THEM = 'Cần thêm khoảng 4 ngày có số liệu (giữ nhịp như hiện nay) để độ tin cậy đạt 90%.'
const em = (sbd: string, lam: number, o: Partial<EmNhipHoc> = {}): EmNhipHoc => ({
  sbd, hoTen: `Em ${sbd}`, lop: '12A1', khoi: '12', ngayVao: NGAY[0]!, muc: NGAY.map(() => 10), lam: NGAY.map(() => lam), doiPho: null, ...o,
})
const DOI_PHO = { quaNhanh: { nhanh: 12, coGiay: 30, dungNhanh: 20, dungThuong: 70, coTuTinh: false }, chonLap: null, lyDo: ['12/30 lượt trả lời dưới 8 giây, nhóm này đúng 20% (lượt thường đúng 70%)'] }
const kq = (dsEm: EmNhipHoc[]): KetQuaNhipHoc => ({
  ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em: dsEm, lop: [{ tenLop: '12A1', khoi: '12', soEm: dsEm.length }], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [],
})
// Lười: L1 chắc (99) · Chăm: C1 chắc (95), C2..C7 tạm (72, kèm câu cần thêm) — 7 em ⇒ cột Chăm có "Xem đủ" · Đối phó: L1.
const KQ = kq([
  em('L1', 0, { doTinCay: 99, doiPho: DOI_PHO }),
  em('C1', 10, { doTinCay: 95 }),
  ...['C2', 'C3', 'C4', 'C5', 'C6', 'C7'].map((s) => em(s, 10, { doTinCay: 72, canThem: CAN_THEM })),
])
const nutEm = (vung: HTMLElement) => within(vung).getAllByRole('button').filter((b) => b.classList.contains('nht-em'))

describe('chip độ tin cậy mỗi dòng em', () => {
  it('Lười / Chăm: chip "Độ tin cậy N%"; dưới 90% "· đang theo dõi", title = câu cần thêm; trình đọc màn hình nghe được', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const luoi = nutEm(screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' }))
    const chipL = luoi[0]!.querySelector('.nht-tin')!
    expect(chipL.textContent).toBe('Độ tin cậy 99%')
    expect(chipL.getAttribute('data-du')).toBe('true')
    expect(chipL.getAttribute('title')).toBe('Kết luận chắc khi độ tin cậy từ 90%.')
    expect(luoi[0]!.getAttribute('aria-label')).toContain('; Độ tin cậy 99% — xem hồ sơ làm bài')

    const cham = nutEm(screen.getByRole('region', { name: 'Chăm nhất · đáng khen' }))
    const tam = cham.find((b) => b.getAttribute('data-sbd') === 'C2')!
    const chip = tam.querySelector('.nht-tin')!
    expect(chip.textContent).toBe('Độ tin cậy 72% · đang theo dõi')
    expect(chip.getAttribute('data-du')).toBe('false')
    expect(chip.getAttribute('title')).toBe(CAN_THEM)
    expect(tam.getAttribute('aria-label')).toContain(`Độ tin cậy 72% · đang theo dõi. ${CAN_THEM}`)
    // chưa mở rộng ⇒ câu cần thêm chưa thành dòng chữ (chỉ hiện khi trỏ chuột)
    expect(tam.querySelector('.nht-tin-them')).toBeNull()
  })

  it('mở rộng cột ("Xem đủ") ⇒ câu cần thêm hiện thành dòng chữ ở các em đang theo dõi; em chắc thì không', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const vung = screen.getByRole('region', { name: 'Chăm nhất · đáng khen' })
    fireEvent.click(within(vung).getByRole('button', { name: /Xem đủ 7 em chăm/ }))
    const ds = nutEm(vung)
    expect(ds).toHaveLength(7)
    expect(ds.find((b) => b.getAttribute('data-sbd') === 'C1')!.querySelector('.nht-tin-them')).toBeNull()
    expect(ds.filter((b) => b.querySelector('.nht-tin-them')?.textContent === CAN_THEM)).toHaveLength(6)
  })

  it('cột Đối phó: chip kèm tên nhóm của em ("Lười · Độ tin cậy 99%")', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const dp = nutEm(screen.getByRole('region', { name: /Có dấu hiệu đối phó · 1 em/ }))
    expect(dp[0]!.querySelector('.nht-tin')!.textContent).toBe('Lười · Độ tin cậy 99%')
  })

  it('máy chủ cũ (không gửi độ tin cậy) ⇒ không chip, nhãn trình đọc màn hình y như trước', () => {
    render(<NhipHocThay du={{ ok: true, kq: kq([em('L1', 0), em('C1', 10)]) }} dangTai={false} onThuLai={() => {}} />)
    expect(document.querySelector('.nht-tin')).toBeNull()
    const luoi = nutEm(screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' }))
    expect(luoi[0]!.getAttribute('aria-label')).toBe('Em L1, 12A1: Thiếu 11/11 ngày, 0 câu từ 01/10 — xem hồ sơ làm bài')
  })
})
