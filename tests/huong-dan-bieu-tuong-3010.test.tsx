// @vitest-environment jsdom
// TẤM HƯỚNG DẪN BIỂU TƯỢNG (thầy 30/10 «hs khi bấm vào các biểu tượng tinh thể nguyên tử lửa đều có hướng dẫn dễ hiểu», src/components/thuong/TamHuongDan.tsx).
// Khoá: (1) chữ đúng số luật (chuỗi, nguyên tử từng câu, cách kiếm / tiêu tinh thể) và theo số của em; công tắc tắt ⇒ dòng ẩn;
//       (2) thanh số trong menu: chạm lửa / nguyên tử / tinh thể ⇒ tấm mở; nút chính ⇒ mở đúng màn + đóng tấm; «Đã hiểu» / Esc / chạm nền ⇒ đóng;
//       (3) không có onMo (màn làm chặng) ⇒ chỉ «Đã hiểu»; (4) không thêm vào nhóm mở app: tấm đi trong mảnh nạp lười ManThuong.
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import * as M from './_thuong-mau'
import { DUONG, _quenTam, docTongQuan, ghiTam, khoaTam, type TongQuanThuong } from '../src/lib/thuong-api'
import { ThanhThuong } from '../src/components/thuong/ThanhThuong'
import { noiDungHuongDan, TamHuongDan } from '../src/components/thuong/TamHuongDan'

const TK = 'tk-hd'
function datTam(tq: Record<string, unknown>) {
  _quenTam()
  try { localStorage.clear() } catch { /* bỏ qua */ }
  const d = docTongQuan(tq)
  if (d) ghiTam(khoaTam(DUONG.tongQuan, TK), d)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(tq), { status: 200, headers: { 'content-type': 'application/json' } })))
}
const tqMau = (them: Record<string, unknown> = {}) => M.tongQuanGia(them) as unknown as TongQuanThuong
beforeEach(() => datTam(M.tongQuanGia()))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('noiDungHuongDan — chữ đúng luật, theo số của em', () => {
  it('lửa: số chuỗi, còn bao nhiêu câu hôm nay, bình đang có, mốc thưởng', () => {
    const nd = noiDungHuongDan('lua', tqMau({ mucTieu: { daXong: 2, can: 7, cau: 40, cauDaLam: 12, dat: false } }))
    expect(nd.tieu).toBe('Chuỗi 12 ngày')
    expect(nd.nay).toBe('Hôm nay còn 28 câu nữa là giữ được chuỗi.')
    expect(nd.cach.map((d) => d.chu).join(' | ')).toContain('em đang có 1 bình')
    expect(nd.dung).toContain('7 ngày: +10 tinh thể')
    expect(nd.nut).toEqual({ chu: 'Xem lịch chuỗi', man: 'chuoi' })
    expect(noiDungHuongDan('lua', tqMau({ mucTieu: { daXong: 7, can: 7, cau: 40, cauDaLam: 41, dat: true } })).nay).toBe('Hôm nay em đã giữ được chuỗi.')
    expect(noiDungHuongDan('lua', tqMau({ chuoiNgay: { so: 0, giuChuoi: 0, sucChua: 2, lich7: [] } })).tieu).toBe('Chưa có chuỗi ngày')
  })
  it('nguyên tử: đúng số của exp-cau-hinh (10 · khó +5 · chuỗi +2/+5 · gợi ý 5 · sai nghiêm túc 2 · hoàn hảo 20 · tự sửa 2); giải tắt ⇒ không nhắc giải', () => {
    const nd = noiDungHuongDan('nt', tqMau())
    expect(nd.tieu).toBe('147 nguyên tử hôm nay')
    expect(nd.cach.map((d) => `${d.chu}=${d.so}`)).toEqual([
      'Đúng, tự làm=+10', 'Câu khó làm đúng=thêm +5', 'Đúng liền từ 3 câu / từ 5 câu=thêm +2 / +5', 'Đúng nhờ gợi ý=+5',
      'Sai nhưng làm nghiêm túc=+2', 'Cả chặng đúng hết (từ 3 câu)=+20', 'Tự sửa đúng câu cũ (tối đa 12 câu mỗi ngày)=+2',
    ])
    expect(nd.nut?.man).toBe('giai')
    const tat = noiDungHuongDan('nt', tqMau({ bat: { ...M.tongQuanGia().bat, giai: false } }))
    expect(tat.dung.join(' ')).not.toContain('Giải tuần')
    expect(tat.nut?.man).toBe('nhiem-vu')
    expect(noiDungHuongDan('nt', null, 36).tieu).toBe('36 nguyên tử bài này')
  })
  it('tinh thể: cách kiếm như màn Cửa hàng; giá bình theo máy chủ; công tắc tắt ⇒ dòng ẩn; thăng hoa ⇒ lưu ý', () => {
    const nd = noiDungHuongDan('tt', tqMau({ binh: { gia: 120, daMuaTuan: false } }))
    expect(nd.tieu).toBe('245 tinh thể')
    expect(nd.dung[0]).toBe('Mua bình giữ chuỗi: 120 tinh thể, mỗi tuần 1 bình.')
    expect(nd.dung[1]).toBe('Cược chuỗi 7 ngày: đặt 50, giữ chuỗi đủ 7 ngày nhận về 100.')
    const tat = noiDungHuongDan('tt', tqMau({ bat: { giai: false, thangHoa: false, banBe: false, kimCuong: false } }))
    expect(tat.cach.map((d) => d.chu)).not.toContain('Lên hạng Giải tuần')
    expect(tat.cach.map((d) => d.chu)).not.toContain('Thử thách Kim cương')
    expect(tat.luuY).toBeUndefined()
  })
})

describe('chạm biểu tượng trên thanh số ⇒ tấm hướng dẫn', () => {
  it('lửa ⇒ tấm «Chuỗi 12 ngày»; «Xem lịch chuỗi» mở màn chuỗi và đóng tấm', async () => {
    const mo = vi.fn()
    render(<ThanhThuong token={TK} onMo={mo} thongBao={false} menu />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chuỗi 12 ngày' }))
    const tam = await screen.findByRole('dialog', { name: 'Chuỗi 12 ngày' })
    expect(tam.textContent).toContain('Lửa đếm số ngày liền em làm đủ mức hôm nay.')
    expect(mo).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Xem lịch chuỗi' }))
    expect(mo).toHaveBeenCalledWith('chuoi')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
  it('nguyên tử ⇒ tấm; «Đã hiểu» đóng, không mở màn nào; Esc và chạm nền cũng đóng', async () => {
    const mo = vi.fn()
    const { container } = render(<ThanhThuong token={TK} onMo={mo} thongBao={false} menu />)
    await waitFor(() => expect(container.querySelector('[data-k="nt"]')).not.toBeNull())
    const nut = screen.getByRole('button', { name: '147 nguyên tử hôm nay' })
    fireEvent.click(nut)
    await screen.findByRole('dialog', { name: '147 nguyên tử hôm nay' })
    fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(nut)
    await screen.findByRole('dialog')
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(nut)
    await screen.findByRole('dialog')
    fireEvent.click(document.querySelector('.tp-hd-nen')!)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mo).not.toHaveBeenCalled()
  })
  it('tinh thể ⇒ «Mở Cửa hàng» mở màn cửa hàng', async () => {
    const mo = vi.fn()
    render(<ThanhThuong token={TK} onMo={mo} thongBao={false} menu />)
    fireEvent.click(await screen.findByRole('button', { name: '245 tinh thể' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mở Cửa hàng' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
  })
  it('không truyền onMo (đang làm chặng) ⇒ chỉ «Đã hiểu», con trỏ vào nút', () => {
    const dong = vi.fn()
    render(<TamHuongDan loai="nt" soBai={36} onDong={dong} />)
    expect(screen.getByRole('dialog', { name: '36 nguyên tử bài này' })).toBeTruthy()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Đã hiểu'])
    expect(document.activeElement?.textContent).toBe('Đã hiểu')
    fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu' }))
    expect(dong).toHaveBeenCalled()
  })
})

describe('nạp lười — không thêm byte mở app', () => {
  it('ThanhThuong và màn làm chặng nạp tấm qua mảnh ManThuong (import động), không nhập tĩnh TamHuongDan', () => {
    const tt = readFileSync('src/components/thuong/ThanhThuong.tsx', 'utf8')
    expect(tt).toMatch(/lazy\(\(\) => import\('\.\/ManThuong'\)\.then\(\(m\) => \(\{ default: m\.PhuThanhThuong \}\)\)\)/)
    expect(tt).not.toMatch(/^import \{[^}]*TamHuongDan[^}]*\} from '\.\/TamHuongDan'/m)
    expect(readFileSync('src/components/thuong/ManThuong.tsx', 'utf8')).toContain('export { TamHuongDan }')
    expect(readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')).toMatch(/import\('\.\.\/thuong\/ManThuong'\)\.then\(\(m\) => \(\{ default: m\.TamHuongDan \}\)\)/)
  })
})
