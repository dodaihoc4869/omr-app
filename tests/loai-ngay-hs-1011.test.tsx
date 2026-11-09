// LOẠI NGÀY trên app học sinh — khối B đợt 1 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, «duyệt, build và đẩy lên bản sống luôn»).
// Khoá: máy chủ gửi `goi7.loaiNgay` ⇒ thẻ mức hôm nay mang nhãn «Ngày học mới» / «Ngày sửa lỗi» (màu theo loại); nút chính ngày sửa lỗi nói «Bắt đầu sửa lỗi» /
// «Sửa lỗi tiếp» và mang màu sửa; ngày Kiểm tra ôn tập giữ nhãn riêng; không có loại ⇒ y như cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { chuNutHoc } from '../src/components/hoc-tap/nhip-hom-nay'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 6, muc: 28, chang: 2, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Bài 8. Amine', viec: 'Chặng 2/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 0, onChua: noop, ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [], ...them,
})
afterEach(() => cleanup())

describe('nhãn loại ngày', () => {
  it('ngày học mới / ngày sửa lỗi / không loại / ngày Kiểm tra ôn tập', () => {
    const { container, rerender } = render(<MotTrangHs {...goc({ loaiNgay: 'moi' })} />)
    const hero = () => container.querySelector('.kb-hero') as HTMLElement
    expect(hero().querySelector('.kb-nhan')!.textContent).toBe('Ngày học mới')
    expect(hero().getAttribute('data-loai')).toBe('moi')
    expect(hero().getAttribute('aria-label')).toMatch(/^Ngày học mới: 6\/28/)
    rerender(<MotTrangHs {...goc({ loaiNgay: 'sua' })} />)
    expect(hero().querySelector('.kb-nhan')!.textContent).toBe('Ngày sửa lỗi')
    expect(hero().getAttribute('data-loai')).toBe('sua')
    expect(container.querySelector('.kb-cta')!.getAttribute('data-sac')).toBe('sai')
    expect(container.querySelector('.kb-cta')!.textContent).toContain('Bắt đầu sửa lỗi')
    expect(container.querySelector('button[aria-label="Sửa lỗi tiếp · 22 câu"], .kb-dong[aria-label="Sửa lỗi tiếp · 22 câu"]')).toBeTruthy()
    rerender(<MotTrangHs {...goc()} />)
    expect(container.querySelector('.kb-cta')!.textContent).toContain('Bắt đầu')
    expect(container.querySelector('.kb-cta')!.textContent).not.toContain('sửa lỗi')
    expect(hero().querySelector('.kb-nhan')!.textContent).toBe('Tổng câu hôm nay')
    expect(hero().hasAttribute('data-loai')).toBe(false)
    expect(container.querySelector('.kb-cta')!.getAttribute('data-sac')).toBe('hs')
    // ngày Kiểm tra ôn tập: nhãn riêng thắng loại ngày của Gói 7
    rerender(<MotTrangHs {...goc({ loaiNgay: 'sua', ngayKiem: true })} />)
    expect(hero().querySelector('.kb-nhan')!.textContent).toBe('Ngày Kiểm tra ôn tập')
    expect(hero().hasAttribute('data-loai')).toBe(false)
  })
})

describe('chữ nút học', () => {
  it('ngày sửa lỗi: Bắt đầu sửa lỗi / Sửa lỗi tiếp; ngày học mới và không loại: như cũ', () => {
    const so = (daLam: number) => ({ daLam, muc: 28, chang: 1, soChang: 5 }) as never
    expect(chuNutHoc(null, false, undefined, 'sua')).toBe('Bắt đầu sửa lỗi')
    expect(chuNutHoc(so(0), false, undefined, 'sua')).toBe('Bắt đầu sửa lỗi · 28 câu')
    expect(chuNutHoc(so(10), false, undefined, 'sua')).toBe('Sửa lỗi tiếp · 18 câu')
    expect(chuNutHoc(so(10), false, undefined, 'moi')).toBe('Học tiếp · 18 câu')
    expect(chuNutHoc(so(0), false)).toBe('Bắt đầu học · 28 câu')
  })
})

describe('đọc tóm tắt Gói 7', () => {
  const tt = { bat: true, ngay: '2026-11-10', toiThieu: 28, daLamHomNay: 0, goi: [{ id: 'g7:a', ten: 'Bài 8. Amine', batDau: '2026-11-08', han: '2026-11-17', tong: 112, daGap: 28, con: 84, quota: 28, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['DH-B8'] }], diemDaDo: [] }
  it('nhận loaiNgay hợp lệ, bỏ giá trị lạ', () => {
    expect(docTomTatGoi7({ ...tt, loaiNgay: 'sua' })?.loaiNgay).toBe('sua')
    expect(docTomTatGoi7({ ...tt, loaiNgay: 'moi' })?.loaiNgay).toBe('moi')
    expect(docTomTatGoi7({ ...tt, loaiNgay: 'on' })).not.toHaveProperty('loaiNgay')
    expect(docTomTatGoi7(tt)).not.toHaveProperty('loaiNgay')
  })
})
