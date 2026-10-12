// @vitest-environment jsdom
// MỘT CON SỐ trên màn Hôm nay của em (thầy 12/10: "học sinh làm 24 câu nhưng lại báo 31 câu làm"; ảnh: vòng "2 trên 24 câu", tiêu đề "31 câu tự làm",
// "còn 22 câu", "4 chặng", thẻ gói "lịch tối thiểu 32 câu"). Sau sửa: vòng, "còn x câu", số chặng, tiêu đề và chữ đạt cùng MỘT mức M do máy chủ chốt;
// thẻ gói ghi "Câu mới hôm nay: g/q (nằm trong M câu của ngày)", không còn chữ "lịch tối thiểu".
// SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10: "gộp hai phần làm một"): vòng tròn "Mục tiêu hôm nay" (`.ht2-vong`, tiêu đề h2 việc còn lại, "Đã đạt mục tiêu hôm nay")
// thay bằng thẻ "Hôm nay của em": "Còn N câu" · "Đã làm x/M câu hôm nay" · "Xong k/n chặng" · dòng phụ "<bài> · x câu tự làm · y câu học có hỗ trợ" ·
// đủ mức ⇒ "Đủ mức hôm nay". Cùng ý kiểm: mọi số đi theo MỘT mức M.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import HocTapHomNay, { chuViecGoi7 } from '../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../src/components/hoa2/api'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'

afterEach(() => cleanup())
const goi = (x: Partial<TomTatGoi7>, g: Partial<TomTatGoi7['goi'][number]> = {}): TomTatGoi7 => ({
  bat: true, ngay: '2026-10-12', toiThieu: 32, daLamHomNay: 2, tuLamCon: 30, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-11', han: '2026-10-16', tong: 164, daGap: 8, con: 156, quota: 32, gapHomNay: 1, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'], ...g }],
  ...x,
})
const ve = (g: TomTatGoi7, con: number) =>
  render(<HocTapHomNay ten="Đỗ Đại Học" lop="12 - Lớp Thường" ketQua={docSanh({ cheDo2: true, theLuc: { con, tong: g.daLamHomNay + con }, goi7: g })} dangTai={false} loi="" coCa={false}
    onHoc={vi.fn()} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)

it('ảnh thầy sau sửa: đã làm 2/32 · còn 30 câu (= 32 − 2) · dòng phụ 30 câu tự làm · 6 chặng · câu mới 1/32 nằm trong 32 câu; không còn "lịch tối thiểu"', () => {
  const { container } = ve(goi({}), 30)
  expect(container.querySelector('.ht2-hn-so')!.textContent).toBe('Còn 30 câu')
  expect(container.querySelector('.ht2-hn-da')!.textContent).toBe('Đã làm 2/32 câu hôm nay')
  expect(container.querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 30 câu tự làm · 0 câu học có hỗ trợ')
  expect(container.querySelectorAll('.ht2-hn-vach i')).toHaveLength(6)
  expect(screen.getByText('Xong 0/6 chặng')).toBeTruthy()
  expect(screen.getByText('mỗi chặng tối đa 6 câu')).toBeTruthy()
  expect(screen.getByText('Câu mới hôm nay: 1/32 (nằm trong 32 câu của ngày). Còn 156 câu trong bài.')).toBeTruthy()
  expect(container.textContent).not.toMatch(/lịch tối thiểu/)
  expect(screen.getByRole('region', { name: 'Hôm nay của em' })).toBeTruthy()
})

it('đạt mục tiêu khi đã làm ≥ M — đúng "đủ mức" phía thầy; câu mới theo lịch chưa gặp hết KHÔNG chặn chữ đạt (trước 12/10 thì chặn)', () => {
  const { container } = ve(goi({ toiThieu: 24, daLamHomNay: 24, tuLamCon: 0 }, { quota: 3, gapHomNay: 2 }), 0)
  expect(container.querySelector('.ht2-hn-so')!.textContent).toBe('Đủ mức hôm nay')
  expect(container.querySelector('.ht2-hn-da')!.textContent).toContain('Đã làm 24/24 câu hôm nay · em có thể nghỉ.')
  expect(screen.getByText('Câu mới hôm nay: 2/3 (nằm trong 24 câu của ngày). Còn 156 câu trong bài.')).toBeTruthy()
})

it('chưa đạt M thì KHÔNG hiện đạt, dù kế hoạch hết câu (kho thiếu): tiêu đề cộng câu chờ bổ sung để tổng vẫn = M − đã làm', () => {
  const { container } = ve(goi({ toiThieu: 24, daLamHomNay: 20, tuLamCon: 1, tiepCanCon: 0, thieuNgay: 3 }, { quota: 3, gapHomNay: 3 }), 1)
  expect(container.textContent).not.toContain('Đủ mức hôm nay')
  expect(container.querySelector('.ht2-hn-so')!.textContent).toBe('Còn 4 câu')
  expect(container.querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 1 câu tự làm · 0 câu học có hỗ trợ · 3 câu chờ thầy bổ sung')
  expect(chuViecGoi7({ tuLamCon: 18, tiepCanCon: 6, thieuNgay: 0 })).toBe('18 câu tự làm · 6 câu học có hỗ trợ')
})
