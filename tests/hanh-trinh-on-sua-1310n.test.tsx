// @vitest-environment jsdom
// ĐỢT 19 · LÀN N (13/10) — Hành trình + Ôn & sửa thiết kế lại; biểu tượng Tự sửa lỗi vẽ riêng.
// LỖI GỐC "Chưa có danh sách bài." (ảnh thầy 13/10: tab Hành trình trống trong khi Hôm nay hiện "Bài học trong 7 ngày · Bài 8. Amine"): khi Gói 7 bật,
// máy chủ trả `hoc-tap-sanh` dạng gọn `{ goi7, theLuc, … }` — KHÔNG có `hanhTrinh` (server/src/game-v2.ts, nhánh `lapGoi7`) — mà màn Hành trình chỉ
// lấy bài từ `sanh.hanhTrinh.bai` (bản `hoa2-sanh`). Sau sửa: danh sách bài dựng từ `goi7.goi` đã có; tầng chỉ hiện khi máy chủ gửi số thật.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../src/components/hoa2/api'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'

afterEach(() => cleanup())

const goi7 = (x: Partial<TomTatGoi7> = {}, g: Partial<TomTatGoi7['goi'][number]> = {}): TomTatGoi7 => ({
  bat: true, ngay: '2026-10-13', toiThieu: 24, daLamHomNay: 15, tuLamCon: 9, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 164, daGap: 13, con: 151, quota: 24, gapHomNay: 3, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'], ...g }],
  ...x,
})
const ve = (sanhTho: Record<string, unknown>, p: Partial<Record<'onChua' | 'onXemLai' | 'onTuLuyen' | 'onLuyenLai' | 'onHoc', () => void>> = {}) =>
  render(<HocTapHomNay ten="Đỗ Đại Học" lop="12 - Lớp Thường" ketQua={docSanh(sanhTho)} dangTai={false} loi="" coCa={false}
    onHoc={p.onHoc ?? vi.fn()} onXemLai={p.onXemLai ?? vi.fn()} onChua={p.onChua ?? vi.fn()} onThi={vi.fn()} onTuLuyen={p.onTuLuyen ?? vi.fn()} onLuyenLai={p.onLuyenLai}
    onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)
// Phản hồi `hoc-tap-sanh` khi Gói 7 bật — ĐÚNG hình máy chủ trả (game-v2.ts): không có `hanhTrinh`.
const sanhGoi7 = (g: TomTatGoi7 = goi7()) => ({ ok: true, cheDo2: true, ngay: g.ngay, goi7: g, theLuc: { con: 9, tong: 24 }, chienDich: null, doan: { con: 0 }, dao: { con: 9 } })
const moTab = async (ten: 'Hành trình' | 'Ôn & sửa') => { fireEvent.click(screen.getByRole('button', { name: ten })); await screen.findByRole('heading', { level: 1, name: ten }) }

it('Gói 7 bật (không có hanhTrinh): Hành trình hiện bài em đang học từ goi7 — không còn "Chưa có danh sách bài."', async () => {
  ve(sanhGoi7())
  await moTab('Hành trình')
  const bai = await screen.findByRole('article', { name: 'Bài 8. Amine' })
  expect(bai.textContent).toContain('Gặp câu gốc')
  expect(bai.textContent).toContain('13/164 câu')
  expect(bai.textContent).toContain('Hạn 16/10')
  expect(document.body.textContent).not.toContain('Chưa có danh sách bài')
})

it('Hành trình: không còn dòng chú giải màu; nút Học tiếp ghi số câu, bấm gọi đúng hàm học', async () => {
  const onHoc = vi.fn()
  ve(sanhGoi7(), { onHoc })
  await moTab('Hành trình')
  await screen.findByRole('article', { name: 'Bài 8. Amine' })
  expect(document.body.textContent).not.toMatch(/Vàng trầm|chàm: đang luyện|xám: còn khoá/)
  const nut = screen.getByRole('button', { name: 'Học tiếp · 9 câu' })
  expect(nut.className).toContain('htn-nut')
  fireEvent.click(nut)
  expect(onHoc).toHaveBeenCalledOnce()
})

it('máy chủ chưa gửi tầng (Gói 7 hiện nay) ⇒ thang 4 tầng trung tính: không nhãn "Đang luyện" / "Đã vững", thẻ bài không ghi tầng (không bịa)', async () => {
  ve(sanhGoi7())
  await moTab('Hành trình')
  const thang = await screen.findByRole('list', { name: 'Thang 4 tầng' })
  expect(thang.textContent).toBe('NềnHiểuVận dụngTổng hợp')
  expect(screen.getByRole('article', { name: 'Bài 8. Amine' }).textContent).not.toMatch(/tầng/i)
})

it('máy chủ gửi tầng (goi7.tang, goi[].tang) ⇒ lộ trình đánh dấu đúng tầng; mỗi bài ghi tầng đang luyện của chính nó', async () => {
  const g = goi7({ tang: 2 }, { tang: 3 })
  g.goi.push({ ...g.goi[0]!, id: 'g7:ester', ten: 'Bài 1. Ester', tang: 1, han: '2026-10-12', quaHan: true, daGap: 30, tong: 40, con: 10 })
  ve(sanhGoi7(g))
  await moTab('Hành trình')
  const thang = await screen.findByRole('list', { name: 'Tầng đang luyện: Hiểu' })
  expect([...thang.querySelectorAll('li')].map((x) => x.textContent)).toEqual(['NềnĐã vững', 'HiểuĐang luyện', 'Vận dụngCòn khoá', 'Tổng hợpCòn khoá'])
  expect(screen.getByRole('heading', { name: 'Em đang luyện tầng Hiểu' })).toBeTruthy()
  expect(screen.getByRole('article', { name: 'Bài 8. Amine' }).textContent).toContain('Đang luyện tầng Vận dụng')
  const ester = screen.getByRole('article', { name: 'Bài 1. Ester' })
  expect(ester.textContent).toContain('Đang luyện tầng Nền')
  expect(ester.textContent).toContain('30/40 câu')
  expect(ester.textContent).toContain('Đã qua hạn 12/10')
  expect(screen.getByRole('heading', { name: /^Bài đang luyện/ }).textContent).toBe('Bài đang luyện · 2 bài')
})

it('bản Hành trình (không Gói 7) vẫn hiện bài từ hanhTrinh.bai với tầng của từng bài', async () => {
  ve({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 2, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6,
    bai: [{ khoa: 'B6', ten: 'Bài 6. Ester', tangMo: 2 }, { khoa: 'B7', ten: 'Bài 7. Lipid', tangMo: 1 }] } })
  await moTab('Hành trình')
  expect((await screen.findByRole('article', { name: 'Bài 6. Ester' })).textContent).toContain('Đang luyện tầng Hiểu')
  expect(screen.getByRole('article', { name: 'Bài 7. Lipid' }).textContent).toContain('Đang luyện tầng Nền')
  expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' })).toBeTruthy()
})

it('không có bài nào ⇒ trạng thái trống nói thật, không còn chữ cũ', async () => {
  ve({ cheDo2: true, theLuc: { con: 0, tong: 0 } })
  await moTab('Hành trình')
  expect(await screen.findByText('Chưa có bài đang luyện.')).toBeTruthy()
})

it('Ôn & sửa: đủ 4 thẻ đúng tên, mỗi thẻ gọi đúng hàm bấm cũ (onChua, onXemLai, onTuLuyen, onLuyenLai)', async () => {
  const f = { onChua: vi.fn(), onXemLai: vi.fn(), onTuLuyen: vi.fn(), onLuyenLai: vi.fn() }
  ve(sanhGoi7(), f)
  await moTab('Ôn & sửa')
  const bon: [RegExp, keyof typeof f][] = [[/^Tự sửa lỗi/, 'onChua'], [/^Câu đã làm/, 'onXemLai'], [/^Tu luyện/, 'onTuLuyen'], [/^Luyện lại từ bài kiểm tra/, 'onLuyenLai']]
  for (const [ten, ham] of bon) {
    fireEvent.click(await screen.findByRole('button', { name: ten }))
    expect(f[ham]).toHaveBeenCalledOnce()
  }
  expect(screen.getByRole('button', { name: /^Câu đã làm/ }).textContent).toContain('Lời giải và lịch ôn từng câu')
  expect(screen.getByRole('button', { name: /^Tu luyện/ }).textContent).toContain('Luyện thêm theo chương, dạng, mức')
  expect(screen.getByRole('button', { name: /^Luyện lại từ bài kiểm tra/ }).textContent).toContain('Câu sai trong các bài kiểm tra')
})

it('Ôn & sửa: không có onLuyenLai ⇒ chỉ 3 thẻ', async () => {
  ve(sanhGoi7())
  await moTab('Ôn & sửa')
  await screen.findByRole('button', { name: /^Tự sửa lỗi/ })
  expect(screen.queryByRole('button', { name: /^Luyện lại từ bài kiểm tra/ })).toBeNull()
})

it('Tự sửa lỗi: thẻ lớn có số câu kèm nhãn; 0 câu ⇒ nói thật, không số; cùng MỘT hình vẽ với thẻ mời ở Hôm nay', async () => {
  const { default: HanhTrinhOnSua } = await import('../src/components/hoc-tap/HanhTrinhOnSua')
  const { TheMoiTuSua } = await import('../src/components/hoc-tap/HocTapHomNay')
  const p = { muc: 'on-lai' as const, sanh: null, dangTai: false, nut: null, onChua: vi.fn(), onXemLai: vi.fn(), onTuLuyen: vi.fn() }
  const { rerender } = render(<HanhTrinhOnSua {...p} soSua={100} />)
  const the = screen.getByRole('button', { name: /^Tự sửa lỗi/ })
  expect(the.textContent).toContain('Câu đang chờ em sửa')
  expect(the.textContent).toContain('100 câu')
  expect(the.querySelector('svg.bt64[data-sac="sua"]')).toBeTruthy()
  rerender(<HanhTrinhOnSua {...p} soSua={0} />)
  expect(screen.getByRole('button', { name: /^Tự sửa lỗi/ }).textContent).toBe('Tự sửa lỗiKhông còn câu cần sửa')
  cleanup()
  const moi = render(<TheMoiTuSua so={100} onChua={vi.fn()} />)
  await vi.waitFor(() => expect(moi.container.querySelector('.ht2-moi-sua-bt svg.bt64[data-sac="sua"]')).toBeTruthy())
})
