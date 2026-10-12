// @vitest-environment jsdom
// THẺ "HÔM NAY CỦA EM" (thầy 12/10: "Bạn gộp 2 phần làm bài này vào làm một thôi nhé. Tập trung vào việc nhắc học sinh làm bao nhiêu câu. Thiết kế đẹp,
// trực quan, khoa học thân thiện nhất với hs nhé"; "Cho hs bấm vào bảng lười chăm"). Kiểm: "Còn N câu" = M − đã làm của Sảnh · MỘT nút học · Lười k/6 +
// "còn N câu nữa là được k+1/6 ngày" theo M của Sảnh (không theo số cũ của /hs/nhip-hoc) · Chăm / Chưa đều có Việc tiếp · /hs/nhip-hoc lỗi vẫn đủ phần
// chính · đủ mức · "Thầy cũng thấy bảng này." · nút "Xem hồ sơ làm bài của em" chỉ khi có onMoHoSo · đang tải = khung xương · bản nhớ 60 giây · tương phản
// tính từ GIÁ TRỊ BIẾN THẬT trong src/styles/tokens.css (sáng + tối) cho đúng các màu thẻ khai ở hoc-tap.css.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import TheHomNayEm, { chiaChang, chuNutHoc, xoaNhoNhipHocEm } from '../src/components/hoc-tap/TheHomNayEm'
import { soHomNay } from '../src/components/hoc-tap/lam-bai'
import { docSanh } from '../src/components/hoa2/api'
import { chuDuMucEm, chuRaKhoiLuoi, chuViecTiep, nhipTheoSanh } from '../src/lib/nhip-hoc-em'
import { NHIP_EM_CHAM, NHIP_EM_CHUA_DEU, NHIP_EM_LUOI, NHIP_EM_LUOI_DANG_THOAT } from '../scripts/chup-v2/gia/nhip-hoc-em'
import type { KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  xoaNhoNhipHocEm()
})

const traLoi = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
const goi = (x: Partial<TomTatGoi7>): TomTatGoi7 => ({
  bat: true, ngay: '2026-10-12', toiThieu: 32, daLamHomNay: 7, tuLamCon: 25, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-11', han: '2026-10-16', tong: 164, daGap: 15, con: 149, quota: 32, gapHomNay: 7, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'] }],
  ...x,
})
const nut = { onXemLai: vi.fn(), onChua: vi.fn(), onThi: vi.fn(), onTuLuyen: vi.fn(), onLichSu: vi.fn(), onBaiTap: vi.fn(), onGiaDinh: vi.fn(), onTaiLai: vi.fn(), onDangXuat: vi.fn() }
/** Màn Hôm nay THẬT với Sảnh Gói 7 (đúng ảnh thầy: 7/32 · 25 câu tự làm · 0 câu học có hỗ trợ) + `/hs/nhip-hoc` giả. */
function ve(o: { g?: TomTatGoi7; con?: number; nhip?: KetQuaNhipHocEm | 'loi'; onHoc?: () => void; onMoHoSo?: () => void; token?: string | null } = {}) {
  const g = o.g ?? goi({})
  vi.stubGlobal('fetch', vi.fn(async () => (o.nhip === 'loi' ? traLoi({ ok: false, error: 'Chưa tải được.' }, 500) : traLoi(o.nhip ?? NHIP_EM_LUOI))))
  const con = o.con ?? Math.max(0, g.toiThieu - g.daLamHomNay)
  return render(
    <HocTapHomNay token={o.token === null ? undefined : (o.token ?? 'tk')} ten="Đỗ Đại Học" lop="12 - Lớp Thường" dangTai={false} loi="" coCa={false} onHoc={o.onHoc ?? vi.fn()} onMoHoSo={o.onMoHoSo}
      ketQua={docSanh({ cheDo2: true, theLuc: { con, tong: g.daLamHomNay + con }, goi7: g })} {...nut} />,
  )
}
const the = () => screen.getByRole('region', { name: 'Hôm nay của em' })
const nutHoc = () => screen.getAllByRole('button').filter((b) => /^(Bắt đầu học|Học tiếp|Học thêm|Học ngay|Tiếp tục học|Đã làm hết câu được giao)/.test(b.textContent ?? ''))

describe('phần chính: MỘT con số câu hôm nay, khớp Sảnh', () => {
  it('ảnh thầy (Lười, 7/32): "Còn 25 câu" = 32 − 7 · "Đã làm 7/32 câu hôm nay" · 6 chặng (xong 1, chặng 2 đang làm) · dòng phụ tổng = 25 · MỘT nút học', async () => {
    const hoc = vi.fn()
    ve({ onHoc: hoc })
    const t = the()
    expect(within(t).getByRole('heading', { level: 2 }).textContent).toMatch(/^Hôm nay · (Chủ nhật|Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)) \d{2}\/\d{2}$/)
    expect(t.querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(t.querySelector('.ht2-hn-da')!.textContent).toBe('Đã làm 7/32 câu hôm nay')
    const vach = within(t).getByRole('progressbar', { name: 'Tiến độ hôm nay' })
    expect(vach.getAttribute('aria-valuenow')).toBe('7')
    expect(vach.getAttribute('aria-valuemax')).toBe('32')
    expect([...vach.querySelectorAll('i')].map((i) => i.getAttribute('data-tt'))).toEqual(['xong', 'dang', 'cho', 'cho', 'cho', 'cho'])
    expect(t.querySelector('.ht2-hn-chang')!.textContent).toBe('Xong 1/6 chặngmỗi chặng tối đa 6 câu')
    expect(t.querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 25 câu tự làm · 0 câu học có hỗ trợ')
    await within(t).findByText('Thầy cũng thấy bảng này.')
    // MỘT nút học trên cả màn Hôm nay (bảng Nhịp học cũ có thêm "Học ngay · 25 câu hôm nay" — đã gỡ)
    expect(nutHoc()).toHaveLength(1)
    expect(nutHoc()[0]!.textContent).toBe('Học tiếp · 25 câu')
    expect(screen.queryByText(/Học ngay/)).toBeNull()
    fireEvent.click(nutHoc()[0]!)
    expect(hoc).toHaveBeenCalledOnce()
    // gỡ khối cũ: không còn vòng "Mục tiêu hôm nay", không còn bảng "Nhịp học của em · từ …"
    expect(screen.queryByRole('region', { name: 'Mục tiêu hôm nay' })).toBeNull()
    expect(document.querySelector('.ht2-chinh, .ht2-vong, .ht2-nhe')).toBeNull()
  })

  it('chưa làm câu nào ⇒ "Bắt đầu học · M câu"; hết câu được giao ⇒ nút khoá đúng chữ cũ; ca kiểm tra mở ⇒ nút học lùi thành nút viền', () => {
    ve({ g: goi({ daLamHomNay: 0, tuLamCon: 32 }), nhip: 'loi' })
    expect(the().querySelector('.ht2-hn-so')!.textContent).toBe('Còn 32 câu')
    expect(nutHoc()[0]!.textContent).toBe('Bắt đầu học · 32 câu')
    cleanup()
    ve({ g: goi({ daLamHomNay: 20, tuLamCon: 0, thieuNgay: 12 }), con: 0, nhip: 'loi' })
    const b = nutHoc()[0] as HTMLButtonElement
    expect(b.textContent).toBe('Đã làm hết câu được giao')
    expect(b.disabled).toBe(true)
    expect(the().querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 0 câu tự làm · 0 câu học có hỗ trợ · 12 câu chờ thầy bổ sung')
    expect(chuNutHoc(null, false)).toBe('Bắt đầu học')
    expect(chuNutHoc({ daLam: 30, muc: 30, chang: 5, soChang: 5 }, false)).toBe('Học thêm')
  })

  it('đủ mức ⇒ "Đủ mức hôm nay" + "em có thể nghỉ", không còn "Còn N câu"; nút lùi thành viền "Học thêm"', async () => {
    ve({ g: goi({ toiThieu: 30, daLamHomNay: 31, tuLamCon: 0 }), con: 6, nhip: NHIP_EM_CHAM })
    const t = the()
    expect(t.querySelector('.ht2-hn-so')!.textContent).toBe('Đủ mức hôm nay')
    expect(t.querySelector('.ht2-hn-da')!.textContent).toContain('Đã làm 31/30 câu hôm nay · em có thể nghỉ.')
    expect(t.textContent).not.toMatch(/Còn \d+ câu/)
    expect(nutHoc()[0]!.textContent).toBe('Học thêm')
    expect(nutHoc()[0]!.getAttribute('data-phu')).toBe('true')
    // phần Nhịp học theo kịp: hôm nay đã đủ (Sảnh 31/30) dù /hs/nhip-hoc còn ghi 18/30
    expect((await within(t).findByText(/^Việc tiếp:/, { selector: 'b' })).parentElement!.textContent).toBe(
      'Việc tiếp: hôm nay em đã đủ mức — chuỗi đang là 7 ngày liền đủ mức. Mai làm đủ mức để giữ chuỗi.',
    )
  })

  it('đang tải Sảnh lần đầu ⇒ khung xương (aria-busy), không số bịa; Nhịp học đang tải ⇒ khung xương riêng', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    render(<TheHomNayEm so={null} dangTai ngayChu="Thứ Hai 12/10" onHoc={vi.fn()} khoaHoc hetCau={false} token="tk-cho" />)
    const t = the()
    expect(t.getAttribute('aria-busy')).toBe('true')
    expect(t.querySelector('.ht2-hn-xuong')).toBeTruthy()
    expect(t.textContent).not.toMatch(/Còn \d/)
    expect(screen.getByLabelText('Đang tải nhịp học của em')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Bắt đầu học' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('/hs/nhip-hoc lỗi ⇒ phần Nhịp học ẩn gọn (không chip, không "Thầy cũng thấy"), phần chính vẫn đủ số + nút; không token ⇒ không gọi máy chủ', async () => {
    ve({ nhip: 'loi' })
    await waitFor(() => expect(the().getAttribute('data-mot')).toBe('true'))
    const t = the()
    expect(t.querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(nutHoc()).toHaveLength(1)
    expect(t.querySelector('.ht2-hn-nhip, .ht2-nhe-nhom')).toBeNull()
    expect(t.textContent).not.toContain('Thầy cũng thấy bảng này.')
    cleanup()
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    render(<TheHomNayEm so={{ daLam: 7, muc: 32, chang: 2, soChang: 6 }} dangTai={false} ngayChu="Thứ Hai 12/10" onHoc={vi.fn()} khoaHoc={false} hetCau={false} />)
    expect(the().querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(f).not.toHaveBeenCalled()
  })
})

describe('phần Nhịp học trong thẻ (số hôm nay = số Sảnh)', () => {
  it('Lười: chip Lười · "Đủ mức 2/11 ngày từ 01/10" · dải 12 ô (ô hôm nay 7/32 của Sảnh) · "Ra khỏi nhóm Lười … 0/6 ngày, hôm nay còn 25 câu nữa là được 1/6 ngày." + 6 ô · tốc độ xấu có số · "Thầy cũng thấy bảng này."', async () => {
    ve()
    const t = the()
    await within(t).findByText('Thầy cũng thấy bảng này.')
    expect(t.getAttribute('data-nhom')).toBe('luoi')
    expect(t.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Lười')
    expect(within(t).getByText('Đủ mức 2/11 ngày từ 01/10')).toBeTruthy()
    const o = t.querySelectorAll('.ht2-hn-dai i')
    expect(o).toHaveLength(12)
    expect(o[11]!.getAttribute('title')).toBe('12/10 (hôm nay): đã làm 7/32 câu — đang làm') // /hs/nhip-hoc ghi 0/30 — thẻ dùng số Sảnh
    expect(o[11]!.getAttribute('data-loai')).toBe('thieu-it')
    expect(within(t).getByRole('img', { name: 'Từ 01/10 tới hôm nay: đủ mức 2/11 ngày đã qua; hôm nay 7/32 câu' })).toBeTruthy()
    expect(t.querySelector('.ht2-hn-luoi p')!.textContent).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 0/6 ngày, hôm nay còn 25 câu nữa là được 1/6 ngày.')
    const sau = within(t).getByRole('img', { name: '0 trên 6 ngày liền đủ mức' })
    expect([...sau.querySelectorAll('i')].map((i) => i.getAttribute('data-tt'))).toEqual(['dang', 'cho', 'cho', 'cho', 'cho', 'cho'])
    expect(t.querySelector('.ht2-hn-toc')!.textContent).toBe('21/49 lượt em trả lời dưới 8 giây, nhóm này chỉ đúng 28%. Đọc hết đề rồi mới chọn.')
    expect(t.textContent).not.toContain('Việc tiếp:')
    expect(nutHoc()).toHaveLength(1) // KHÔNG có nút thứ hai trong phần Lười
  })

  it('Lười đang thoát 3/6: câu dùng M của Sảnh (Sảnh 12/32 ⇒ còn 20, không phải 18 của /hs/nhip-hoc); Sảnh đã đủ ⇒ k cộng hôm nay', () => {
    const k = nhipTheoSanh(NHIP_EM_LUOI_DANG_THOAT, { muc: 32, daLam: 12 })
    expect(chuRaKhoiLuoi(k)).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 3/6 ngày, hôm nay còn 20 câu nữa là được 4/6 ngày.')
    const du = nhipTheoSanh(NHIP_EM_LUOI_DANG_THOAT, { muc: 30, daLam: 30 })
    expect(du.nhom).toBe('luoi')
    expect(chuRaKhoiLuoi(du)).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 4/6 ngày, đã tính hôm nay. Mai làm đủ mức là được 5/6 ngày.')
  })

  it('Chăm và Chưa đều: dòng "Việc tiếp" (số hôm nay theo Sảnh); tốc độ bình thường thì ẩn cho gọn', async () => {
    ve({ g: goi({ toiThieu: 30, daLamHomNay: 18, tuLamCon: 12 }), nhip: NHIP_EM_CHAM })
    let t = the()
    await within(t).findByText('Thầy cũng thấy bảng này.')
    expect(t.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Chăm')
    expect(t.querySelector('.ht2-hn-tiep')!.textContent).toBe('Việc tiếp: còn 12 câu nữa là đủ mức hôm nay — em giữ được chuỗi 7 ngày liền.')
    expect(t.querySelector('.ht2-hn-toc')).toBeNull()
    expect(t.querySelector('.ht2-hn-luoi')).toBeNull()
    cleanup()
    xoaNhoNhipHocEm()
    ve({ g: goi({ toiThieu: 30, daLamHomNay: 5, tuLamCon: 19, tiepCanCon: 6 }), nhip: NHIP_EM_CHUA_DEU })
    t = the()
    await within(t).findByText('Thầy cũng thấy bảng này.')
    expect(t.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Chưa đều')
    expect(t.querySelector('.ht2-hn-tiep')!.textContent).toContain('Việc tiếp: cần thêm 14 ngày đủ mức (tính cả hôm nay) để lên nhóm Chăm — hôm nay còn 25 câu.')
    expect(t.querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 19 câu tự làm · 6 câu học có hỗ trợ')
    expect(t.querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
  })

  it('onMoHoSo: khối dải ngày là MỘT nút "Xem hồ sơ làm bài của em" (≥ 44 px ở CSS), bấm gọi onMoHoSo; nút học không nằm trong; không truyền ⇒ không có nút', async () => {
    const hoSo = vi.fn()
    const hoc = vi.fn()
    ve({ onMoHoSo: hoSo, onHoc: hoc })
    const b = await screen.findByRole('button', { name: 'Xem hồ sơ làm bài của em' })
    expect(b.getAttribute('aria-describedby')).toBeTruthy()
    expect(b.textContent).toContain('Đủ mức 2/11 ngày từ 01/10')
    expect(b.querySelectorAll('.ht2-hn-dai i')).toHaveLength(12)
    expect(b.contains(nutHoc()[0]!)).toBe(false)
    fireEvent.click(b)
    expect(hoSo).toHaveBeenCalledOnce()
    expect(hoc).not.toHaveBeenCalled()
    cleanup()
    xoaNhoNhipHocEm()
    ve()
    await within(the()).findByText('Thầy cũng thấy bảng này.')
    expect(screen.queryByRole('button', { name: 'Xem hồ sơ làm bài của em' })).toBeNull()
    expect(screen.queryByText('Xem hồ sơ')).toBeNull()
    expect(readFileSync('src/components/hoc-tap/hoc-tap.css', 'utf8')).toMatch(/button\.ht2-hn-nhip-bam\{min-height:44px;/)
  })

  it('bản nhớ 10 phút: về lại Hôm nay vẽ ngay, không gọi lại máy chủ; số câu hôm nay đổi KHÔNG nạp lại (khẩn 12/10 21h — số hôm nay lấy từ Sảnh)', async () => {
    const f = vi.fn(async () => traLoi(NHIP_EM_CHAM))
    vi.stubGlobal('fetch', f)
    const p = { dangTai: false, ngayChu: 'Thứ Hai 12/10', onHoc: vi.fn(), khoaHoc: false, hetCau: false, token: 'tk-nho' }
    const r1 = render(<TheHomNayEm {...p} so={{ daLam: 18, muc: 30, chang: 4, soChang: 5 }} />)
    expect(await screen.findByText('Thầy cũng thấy bảng này.')).toBeTruthy()
    r1.unmount()
    const r2 = render(<TheHomNayEm {...p} so={{ daLam: 18, muc: 30, chang: 4, soChang: 5 }} />)
    expect(screen.getByText('Thầy cũng thấy bảng này.')).toBeTruthy()
    expect(f).toHaveBeenCalledTimes(1)
    r2.rerender(<TheHomNayEm {...p} so={{ daLam: 19, muc: 30, chang: 4, soChang: 5 }} />)
    await new Promise((r) => setTimeout(r, 30))
    expect(f).toHaveBeenCalledTimes(1) // giờ cao điểm: không gọi /hs/nhip-hoc sau mỗi câu
    expect(screen.getByText('Thầy cũng thấy bảng này.')).toBeTruthy()
  })
})

describe('phép thuần', () => {
  it('nhipTheoSanh: thay ô hôm nay bằng số Sảnh, tính lại chuỗi / việc tiếp bằng phép thuần máy chủ; thiếu số Sảnh ⇒ giữ nguyên; thiếu ô hôm nay ⇒ thêm cuối', () => {
    expect(nhipTheoSanh(NHIP_EM_CHAM, null)).toBe(NHIP_EM_CHAM)
    expect(nhipTheoSanh(NHIP_EM_CHAM, { muc: 0, daLam: 3 })).toBe(NHIP_EM_CHAM)
    const k = nhipTheoSanh(NHIP_EM_CHAM, { muc: 30, daLam: 30 })
    expect(k.homNayMuc).toEqual({ muc: 30, lam: 30 })
    expect(k.ngay[11]).toEqual({ ngay: '2026-10-12', muc: 30, lam: 30 })
    expect(k.chuoiDuGanNhat).toBe(7)
    expect(k.viecTiep).toEqual({ loai: 'giu-chuoi', cauConHomNay: 0, homNayDu: true, chuoiNeuDu: 7 })
    expect([k.soNgayQua, k.soNgayDu]).toEqual([11, 10]) // ngày đã qua không đổi
    const thieu = nhipTheoSanh({ ...NHIP_EM_CHAM, ngay: NHIP_EM_CHAM.ngay.slice(0, 11), homNayMuc: null }, { muc: 24, daLam: 6 })
    expect(thieu.ngay).toHaveLength(12)
    expect(thieu.homNayMuc).toEqual({ muc: 24, lam: 6 })
    expect(chuViecTiep(thieu)).toBe('còn 18 câu nữa là đủ mức hôm nay — em giữ được chuỗi 7 ngày liền.')
    expect(chuDuMucEm({ ...NHIP_EM_CHAM, soNgayQua: 0, soNgayDu: 0 })).toBe('Bắt đầu đếm từ hôm nay 12/10')
  })

  it('chiaChang: 32 câu ⇒ 6 chặng (6·5 + 2), chặng đang làm tô theo câu đã làm trong chặng; soHomNay lấy số chặng CÙNG nguồn với M (Gói 7 ⇒ ceil(M/6))', () => {
    const c = chiaChang({ daLam: 7, muc: 32, chang: 2, soChang: 6 })
    expect(c.map((x) => x.co)).toEqual([6, 6, 6, 6, 6, 2])
    expect(c.map((x) => x.tt)).toEqual(['xong', 'dang', 'cho', 'cho', 'cho', 'cho'])
    expect(c[1]!.phan).toBe(17)
    expect(chiaChang({ daLam: 32, muc: 32, chang: 6, soChang: 6 }).every((x) => x.tt === 'xong')).toBe(true)
    const kq = docSanh({ cheDo2: true, theLuc: { con: 25, tong: 32 }, goi7: goi({}), hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 } })
    expect(soHomNay(kq)).toEqual({ daLam: 7, muc: 32, chang: 2, soChang: 6 })
  })
})

describe('tương phản tính từ giá trị biến THẬT (tokens.css) — sáng + tối', () => {
  const tok = readFileSync('src/styles/tokens.css', 'utf8')
  const css = readFileSync('src/components/hoc-tap/hoc-tap.css', 'utf8')
  const khoi = (s: string) => Object.fromEntries([...s.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]))
  const sang = khoi(tok.slice(tok.indexOf(':root {'), tok.indexOf('}', tok.indexOf(':root {'))))
  // khối tối của biến app học sinh = khối `@media (prefers-color-scheme: dark) { :root { … } }` có `--the:` (tokens.css còn khối tối của biến khác)
  const khoiToi = tok.split('@media (prefers-color-scheme: dark) {').slice(1).map((x) => x.slice(0, x.indexOf('}'))).find((x) => /--the:\s*#/.test(x)) ?? ''
  const toi = { ...sang, ...khoi(khoiToi) }
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const tron = (a: string, p: number, b: string) => '#' + rgb(a).map((x, i) => Math.round((x * p + rgb(b)[i]! * (100 - p)) / 100).toString(16).padStart(2, '0')).join('')
  const L = (h: string) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! }
  const tp = (a: string, b: string) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  // màu thẻ — mỗi dòng KHỚP đúng một khai báo ở hoc-tap.css (kiểm bên dưới) để số đo không lệch khỏi CSS
  const mau = (t: Record<string, string>) => ({
    the: t.the!, nhat: t.nhat!, muc: t.muc!, lg: t['lg-nhan']!,
    oCho: tron(t.nhat!, 75, t.the!), du: tron(t.xanh!, 75, t.muc!), thieuIt: tron(t['cam']!, 65, t.muc!), khong: tron(t.do!, 85, t.muc!),
    nheXanh: tron(t.xanh!, 50, t.muc!), nenLuoi: tron(t['lg-nhan']!, 8, t.the!), nenToc: tron(t['cam']!, 14, t.the!), chuToc: tron(t['cam']!, 38, t.muc!),
  })
  it('các màu đo đúng là màu thẻ khai ở hoc-tap.css', () => {
    for (const k of ['--hn-o-cho:color-mix(in srgb,var(--nhat) 75%,var(--the))', '--hn-du:color-mix(in srgb,var(--xanh) 75%,var(--muc))', '--hn-thieu-it:color-mix(in srgb,var(--cam) 65%,var(--muc))',
      '--hn-khong:color-mix(in srgb,var(--do) 85%,var(--muc))', 'color-scheme:light dark', '.ht2-hn-nut{width:100%;min-height:56px'])
      expect(css).toContain(k)
    expect(Object.keys(toi).length).toBeGreaterThan(10)
    expect(toi.the).toBe('#202730')
  })
  it.each([['sáng', sang], ['tối', toi]] as const)('%s: ô / vạch / nút ≥ 3:1 với nền thẻ; chữ ≥ 4,5:1', (_, t) => {
    const m = mau(t)
    for (const [ten, a, b] of [['ô xong / nút', m.lg, m.the], ['viền ô chờ', m.oCho, m.the], ['viền ô chờ trên nền Lười', m.oCho, m.nenLuoi], ['ô Đủ mức', m.du, m.the],
      ['ô Thiếu ít', m.thieuIt, m.the], ['ô Không làm / viền Thiếu nhiều', m.khong, m.the], ['ô hôm nay (viền)', m.lg, m.the]] as const)
      expect(tp(a, b), ten).toBeGreaterThanOrEqual(3)
    for (const [ten, a, b] of [['số Còn N', m.lg, m.the], ['chữ nút', m.the, m.lg], ['chữ thường', m.muc, m.the], ['chữ phụ', m.nhat, m.the], ['Đủ mức hôm nay', m.nheXanh, m.the],
      ['chữ Lười', m.muc, m.nenLuoi], ['chữ tốc độ', m.chuToc, m.nenToc], ['Thầy cũng thấy / Xem hồ sơ', m.lg, m.the]] as const)
      expect(tp(a, b), ten).toBeGreaterThanOrEqual(4.5)
  })
})
