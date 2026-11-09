// LOẠI NGÀY trên app học sinh — khối B đợt 1 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, «duyệt, build và đẩy lên bản sống luôn»).
// Khoá: máy chủ gửi `goi7.loaiNgay` ⇒ thẻ mức hôm nay mang nhãn «Ngày học mới» / «Ngày sửa lỗi» (màu theo loại); nút chính ngày sửa lỗi nói «Bắt đầu sửa lỗi» /
// «Sửa lỗi tiếp» và mang màu sửa; ngày Kiểm tra ôn tập giữ nhãn riêng; không có loại ⇒ y như cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { chuNutHoc } from '../src/components/hoc-tap/nhip-hom-nay'
import { chuNutLoai, nhomDangSua } from '../src/components/hoc-tap/loai-ngay'
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
    expect(chuNutLoai(chuNutHoc(null, false), 'sua')).toBe('Bắt đầu sửa lỗi')
    expect(chuNutLoai(chuNutHoc(so(0), false), 'sua')).toBe('Bắt đầu sửa lỗi · 28 câu')
    expect(chuNutLoai(chuNutHoc(so(10), false), 'sua')).toBe('Sửa lỗi tiếp · 18 câu')
    expect(chuNutLoai(chuNutHoc(so(10), false), 'moi')).toBe('Học tiếp · 18 câu')
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

describe('nút chính ngày Sửa: «Sửa nhóm N» (khối B lát 5, bản vẽ dt-sang-3)', () => {
  const ns = [{ ten: 'Khối lượng muối của amine', so: 8, xong: 8 }, { ten: 'Tính base của amine', so: 6, xong: 2 }, { ten: 'Đồng phân amine', so: 4, xong: 0 }]
  it('nhóm đang sửa = nhóm đầu chưa xong; thô hỏng / hết nhóm ⇒ null', () => {
    expect(nhomDangSua(ns)).toEqual({ i: 2, ten: 'Tính base của amine' })
    expect(nhomDangSua([{ ten: 'X', so: 2, xong: 2 }])).toBeNull()
    expect(nhomDangSua('x')).toBeNull()
    expect(nhomDangSua([{ ten: '', so: 2 }, { ten: 'Y', so: 3 }])).toEqual({ i: 2, ten: 'Y' })
  })
  it('Lộ trình ngày Sửa có nhóm ⇒ nút chính ghi «Sửa nhóm 2» + tên dạng; ngày học mới / Kiểm tra ôn tập ⇒ như cũ', () => {
    const { container, rerender } = render(<MotTrangHs {...goc({ loaiNgay: 'sua', goi7: { nhomSua: ns, goi: [] } as never })} />)
    expect(container.querySelector('.kb-cta')!.textContent).toContain('Sửa nhóm 2')
    expect(container.querySelector('.kb-cta')!.textContent).toContain('Tính base của amine')
    rerender(<MotTrangHs {...goc({ loaiNgay: 'moi', goi7: { nhomSua: ns, goi: [] } as never })} />)
    expect(container.querySelector('.kb-cta')!.textContent).not.toContain('Sửa nhóm')
    rerender(<MotTrangHs {...goc({ loaiNgay: 'sua', ngayKiem: true, goi7: { nhomSua: ns, goi: [] } as never })} />)
    expect(container.querySelector('.kb-cta')?.textContent ?? '').not.toContain('Sửa nhóm')
  })
})

describe('ngày có loại = 28 câu, không chặng Tự sửa lỗi (thầy 10/11 «Đếm của Mol và tổng số câu có sai ko» — ảnh 1/56 vs «còn 27»; «mỗi ngày hs làm 28 câu hay 56 câu»)', () => {
  it('ngày Sửa: thẻ mức = 28 (khớp lời Mol); ngày thường vẫn cộng hàng Tự sửa lỗi như cũ', () => {
    const so = { daLam: 1, muc: 28, chang: 1, soChang: 5 } as PropsMotTrang['so']
    const { container, rerender } = render(<MotTrangHs {...goc({ so, loaiNgay: 'sua', soSua: 28 })} />)
    expect(container.querySelector('.kb-so')!.textContent).toBe('1/28 câu')
    expect(container.textContent).toContain('Còn 27 câu nữa')
    // ngày học mới (bản vẽ dt-sang-1: 5 chặng 6·6·6·6·4 = 28): cũng đúng 28, không chặng Tự sửa lỗi trên đường
    rerender(<MotTrangHs {...goc({ so, loaiNgay: 'moi', soSua: 28 })} />)
    expect(container.querySelector('.kb-so')!.textContent).toBe('1/28 câu')
    expect(container.querySelector('[aria-label^="Tự sửa lỗi"]')).toBeNull()
    rerender(<MotTrangHs {...goc({ so, soSua: 28 })} />)
    expect(Number(/^1\/(\d+) câu$/.exec(container.querySelector('.kb-so')!.textContent ?? '')?.[1])).toBeGreaterThan(28) // ngày thường: mức + hàng Tự sửa lỗi hôm nay (như cũ)
  })
})
