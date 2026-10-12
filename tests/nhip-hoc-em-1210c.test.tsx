// @vitest-environment jsdom
// BẢNG "NHỊP HỌC CỦA EM · TỪ 01/10" ở app học sinh (thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi: "hiện rõ một bảng ngay đầu thông tin lười hay chăm
// chỉ … ghi thêm 1 câu trong bảng thầy cũng thấy điều này"; "6 ngày liền làm đủ mới thoát nhóm lười nhé"). Kiểm: dữ liệu giả của bản vẽ KHỚP phép
// thuần máy chủ · đọc trả lời chặt · chữ (điều kiện, việc tiếp, thoát Lười, tốc độ, ba ô số) · GIAO DIỆN: Chăm, Lười có 6 ô + nút Học ngay, Chưa đều,
// Chưa đủ dữ liệu, câu "Thầy cũng thấy bảng này.", đang tải = khung xương, lỗi = ẩn gọn, đứng ĐẦU màn Hôm nay (trên khối Hôm nay chính).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

import NhipHocEm, { BangNhipHocEm, xoaNhoNhipHocEm } from '../src/components/hoc-tap/NhipHocEm'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../src/components/hoa2/api'
import { chuDieuKienEm, chuNutHocNgay, chuThoatLuoi, chuTocDo, chuViecTiep, docNhipHocEm, layNhipHocEm, loaiONgay, oSoEm } from '../src/lib/nhip-hoc-em'
import { tomTatNhip, viecTiepNhip } from '../server/src/nhip-hoc-luat'
import { NHIP_EM_CHAM, NHIP_EM_CHUA_DEU, NHIP_EM_CHUA_DU, NHIP_EM_LUOI, NHIP_EM_LUOI_DANG_THOAT } from '../scripts/chup-v2/gia/nhip-hoc-em'
import type { KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  xoaNhoNhipHocEm()
})

const traLoi = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })

describe('dữ liệu giả của bản vẽ khớp đúng phép thuần máy chủ (em và thầy cùng một số)', () => {
  it.each([
    ['Chăm', NHIP_EM_CHAM],
    ['Lười', NHIP_EM_LUOI],
    ['Lười đang thoát', NHIP_EM_LUOI_DANG_THOAT],
    ['Chưa đều', NHIP_EM_CHUA_DEU],
    ['Chưa đủ dữ liệu', NHIP_EM_CHUA_DU],
  ] as const)('%s', (_, k) => {
    const t = tomTatNhip(k.ngay, k.homNay)
    expect({ nhom: t.nhom, soNgayQua: t.soNgayQua, soNgayDu: t.soNgayDu, chuoi: t.chuoiDuGanNhat, thieu: t.tongCauThieu, lam: t.tongLam + (t.homNay?.lam ?? 0), gan: t.ngayDuGanNhat, bo: t.chuoiKhongLam })
      .toEqual({ nhom: k.nhom, soNgayQua: k.soNgayQua, soNgayDu: k.soNgayDu, chuoi: k.chuoiDuGanNhat, thieu: k.tongCauThieu, lam: k.tongDaLam, gan: k.ngayDuGanNhat, bo: k.chuoiBo })
    expect(viecTiepNhip(t)).toEqual(k.viecTiep)
  })
})

describe('đọc trả lời /hs/nhip-hoc (chặt — sai ⇒ null, bảng ẩn)', () => {
  it('đúng hợp đồng ⇒ giữ nguyên; thiếu khung / ngày hỏng / việc tiếp lệch nhóm ⇒ null', () => {
    expect(docNhipHocEm(JSON.parse(JSON.stringify(NHIP_EM_LUOI)))).toEqual(NHIP_EM_LUOI)
    expect(docNhipHocEm({ ok: false, error: 'x' })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, nhom: 'gioi' })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, ngay: [{ ngay: '12/10', muc: 1, lam: 1 }] })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, viecTiep: NHIP_EM_LUOI.viecTiep })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, tocDo: { soNhanh: 'x' } })).toMatchObject({ tocDo: null })
  })
  it('layNhipHocEm: gửi đúng token tới /hs/nhip-hoc; máy chủ lỗi / 404 / mất mạng / không token ⇒ null', async () => {
    const f = vi.fn(async () => traLoi(NHIP_EM_CHAM))
    vi.stubGlobal('fetch', f)
    expect(await layNhipHocEm('tk-em')).toEqual(NHIP_EM_CHAM)
    expect(f).toHaveBeenCalledWith('https://may.test/hs/nhip-hoc', expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'tk-em' }) }))
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: false, error: 'Em đăng nhập lại để xem nhịp học.' })))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({}, 404)))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    expect(await layNhipHocEm('')).toBeNull()
  })
})

describe('chữ của bảng (đúng bản vẽ, lời thẳng)', () => {
  it('điều kiện dưới số lớn', () => {
    expect(chuDieuKienEm(NHIP_EM_CHAM)).toBe('91% số ngày đã qua · nhóm Chăm cần từ 80%')
    expect(chuDieuKienEm(NHIP_EM_LUOI)).toBe('18% số ngày đã qua · bỏ 4 ngày liền (06–09/10)')
    expect(chuDieuKienEm({ ...NHIP_EM_LUOI, chuoiBo: { dai: 2, tu: '2026-10-06', den: '2026-10-07' } })).toBe('18% số ngày đã qua · từ 40% trở xuống là nhóm Lười')
    expect(chuDieuKienEm(NHIP_EM_CHUA_DU)).toBe('Cần ít nhất 3 ngày đã qua để xếp nhóm — còn 2 ngày nữa.')
  })
  it('việc tiếp: Chăm giữ chuỗi · Chưa đều số ngày cần thêm + nhắc giữ chuỗi · hôm nay đã đủ', () => {
    expect(chuViecTiep(NHIP_EM_CHAM)).toBe('còn 12 câu nữa là đủ mức hôm nay — em giữ được chuỗi 7 ngày liền.')
    expect(chuViecTiep({ ...NHIP_EM_CHAM, homNayMuc: { muc: 30, lam: 30 }, viecTiep: { loai: 'giu-chuoi', cauConHomNay: 0, homNayDu: true, chuoiNeuDu: 7 } }))
      .toBe('hôm nay em đã đủ mức — chuỗi đang là 7 ngày liền đủ mức. Mai làm đủ mức để giữ chuỗi.')
    expect(chuViecTiep(NHIP_EM_CHUA_DEU)).toBe(
      'cần thêm 14 ngày đủ mức (tính cả hôm nay) để lên nhóm Chăm — hôm nay còn 25 câu. Em đang ở ngoài nhóm Lười nhờ 6 ngày liền đủ mức — giữ chuỗi này để không quay lại.',
    )
    expect(chuViecTiep({ ...NHIP_EM_CHUA_DEU, viecTiep: { loai: 'len-cham', ngayCanThem: 0, cauConHomNay: 0, homNayDu: true, nhoChuoi: false, chuoi: 3 } })).toBe('hôm nay em đã đủ mức — hết hôm nay em lên nhóm Chăm.')
  })
  it('thoát nhóm Lười: x/6, câu còn hôm nay; hôm nay đủ ⇒ đã cộng; nút Học ngay chỉ khi còn câu', () => {
    expect(chuThoatLuoi(NHIP_EM_LUOI)).toBe('Em đang có 0/6 ngày — bắt đầu từ hôm nay với 30 câu.')
    expect(chuThoatLuoi(NHIP_EM_LUOI_DANG_THOAT)).toBe('Em đang có 3/6 ngày — hôm nay làm đủ thêm 18 câu để lên 4/6.')
    const du = { ...NHIP_EM_LUOI_DANG_THOAT, homNayMuc: { muc: 30, lam: 30 }, viecTiep: { loai: 'thoat-luoi' as const, coNgay: 4, canNgay: 6, cauConHomNay: 0, homNayDu: true } }
    expect(chuThoatLuoi(du)).toBe('Em đang có 4/6 ngày, đã tính hôm nay — mai làm đủ mức để lên 5/6.')
    expect(chuNutHocNgay(NHIP_EM_LUOI)).toBe('Học ngay · 30 câu hôm nay')
    expect(chuNutHocNgay(du)).toBeNull()
  })
  it('tốc độ làm bài: bình thường · quá nhanh mà đúng thấp · cần để mắt · chưa đủ lượt', () => {
    expect(chuTocDo(NHIP_EM_CHAM.tocDo!)).toBe('Tốc độ làm bài bình thường: 2/96 lượt dưới 8 giây.')
    expect(chuTocDo(NHIP_EM_LUOI.tocDo!)).toBe('21/49 lượt em trả lời dưới 8 giây, nhóm này chỉ đúng 28%. Đọc hết đề rồi mới chọn.')
    expect(chuTocDo({ soNhanh: 10, soCoGiay: 38, dungNhanh: 20, coTuTinh: true, muc: 'chu-y' })).toBe(
      '10/38 lượt em trả lời quá nhanh (dưới 8 giây, câu tự tính dưới 15 giây) (26%), nhóm này đúng 20%. Đọc hết đề rồi mới chọn.',
    )
    expect(chuTocDo(NHIP_EM_CHUA_DU.tocDo!)).toBe('Tốc độ làm bài: cần ít nhất 20 lượt đo được số giây để xét, em đang có 7.')
  })
  it('ba ô số: Chăm (ngày liền · câu đã làm · câu hôm nay) / Lười (câu còn thiếu · ngày đủ gần nhất · câu hôm nay); ô ngày', () => {
    expect(oSoEm(NHIP_EM_CHAM).map((o) => [o.so, o.nhan])).toEqual([['6', 'ngày liền đủ mức'], ['352', 'câu đã làm từ 01/10'], ['18/30', 'câu hôm nay']])
    expect(oSoEm(NHIP_EM_LUOI).map((o) => [o.so, o.nhan])).toEqual([['236', 'câu còn thiếu từ 01/10'], ['04/10', 'ngày đủ mức gần nhất'], ['0/30', 'câu hôm nay']])
    expect(oSoEm({ ...NHIP_EM_LUOI, ngayDuGanNhat: null, tongCauThieu: 1234 }).map((o) => o.so)).toEqual(['1.234', 'Chưa có', '0/30'])
    expect(NHIP_EM_LUOI.ngay.map((x) => loaiONgay(x, NHIP_EM_LUOI.homNay))).toEqual(['du', 'thieu-it', 'thieu-nhieu', 'du', 'thieu-nhieu', 'khong-lam', 'khong-lam', 'khong-lam', 'khong-lam', 'thieu-it', 'thieu-nhieu', 'cho'])
    expect(loaiONgay(NHIP_EM_CHAM.ngay[11]!, NHIP_EM_CHAM.homNay)).toBe('thieu-it')
  })
})

const bang = () => screen.getByRole('region', { name: /^Nhịp học của em/ })

describe('giao diện bảng', () => {
  it('Chăm: nhãn nhóm, số lớn, dải 12 ô (hôm nay viền), ba ô số, tốc độ bình thường, Việc tiếp, "Thầy cũng thấy bảng này."', () => {
    render(<BangNhipHocEm kq={NHIP_EM_CHAM} onHoc={vi.fn()} />)
    const b = bang()
    expect(b.getAttribute('data-nhom')).toBe('cham')
    expect(within(b).getByRole('heading', { name: 'Nhịp học của em · từ 01/10' })).toBeTruthy()
    expect(b.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Chăm')
    expect(b.querySelector('.ht2-nhe-lon')!.textContent).toBe('Em đủ mức 10/11 ngày')
    expect(within(b).getByText('91% số ngày đã qua · nhóm Chăm cần từ 80%')).toBeTruthy()
    const o = b.querySelectorAll('.ht2-nhe-o-ngay i')
    expect(o).toHaveLength(12)
    expect([...o].filter((x) => x.getAttribute('data-hom-nay') === 'true')).toHaveLength(1)
    expect(o[11]!.getAttribute('title')).toBe('12/10 (hôm nay): đã làm 18/30 câu — đang làm')
    expect(within(b).getByRole('img', { name: 'Từ 01/10 tới hôm nay: đủ mức 10/11 ngày đã qua; hôm nay 18/30 câu' })).toBeTruthy()
    expect([...b.querySelectorAll('.ht2-nhe-o-mot')].map((x) => x.textContent)).toEqual(['ngày liền đủ mức6', 'câu đã làm từ 01/10352', 'câu hôm nay18/30'])
    expect(b.querySelector('.ht2-nhe-toc')!.getAttribute('data-muc')).toBe('tot')
    expect(b.textContent).toContain('Việc tiếp: còn 12 câu nữa là đủ mức hôm nay — em giữ được chuỗi 7 ngày liền.')
    expect(b.querySelector('.ht2-nhe-thoat')).toBeNull()
    expect(within(b).queryByRole('button')).toBeNull()
    expect(within(b).getByText('Thầy cũng thấy bảng này.')).toBeTruthy()
  })

  it('Lười: viền + nhãn Lười, "bỏ 4 ngày liền", khối Cách ra khỏi nhóm Lười có 6 ô tiến độ x/6 và nút Học ngay gọi onHoc', () => {
    const hoc = vi.fn()
    render(<BangNhipHocEm kq={NHIP_EM_LUOI_DANG_THOAT} onHoc={hoc} />)
    const b = bang()
    expect(b.getAttribute('data-nhom')).toBe('luoi')
    expect(b.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Lười')
    expect(b.querySelector('.ht2-nhe-lon')!.textContent).toBe('Em đủ mức 4/11 ngày')
    const thoat = b.querySelector('.ht2-nhe-thoat') as HTMLElement
    expect(thoat.textContent).toContain('Cách ra khỏi nhóm Lười: làm đủ mức 6 ngày liền. Em đang có 3/6 ngày — hôm nay làm đủ thêm 18 câu để lên 4/6.')
    const sau = within(thoat).getByRole('img', { name: '3 trên 6 ngày liền đủ mức' })
    expect(sau.querySelectorAll('i')).toHaveLength(6)
    expect(sau.querySelectorAll('i[data-xong="true"]')).toHaveLength(3)
    expect([...b.querySelectorAll('.ht2-nhe-o-mot dd')].map((x) => x.textContent)).toEqual(['192', '11/10', '12/30'])
    fireEvent.click(within(b).getByRole('button', { name: 'Học ngay · 18 câu hôm nay' }))
    expect(hoc).toHaveBeenCalledOnce()
    expect(b.textContent).not.toContain('Việc tiếp:')
    expect(within(b).getByText('Thầy cũng thấy bảng này.')).toBeTruthy()
  })

  it('Lười đúng bản vẽ: 0/6, tốc độ cảnh báo bằng số; nút tắt khi đang khoá học (ca kiểm tra / đang làm mới)', () => {
    render(<BangNhipHocEm kq={NHIP_EM_LUOI} onHoc={vi.fn()} tatHoc />)
    const b = bang()
    expect(b.textContent).toContain('18% số ngày đã qua · bỏ 4 ngày liền (06–09/10)')
    expect(b.querySelectorAll('.ht2-nhe-sau i[data-xong="true"]')).toHaveLength(0)
    expect(b.querySelector('.ht2-nhe-toc')!.getAttribute('data-muc')).toBe('xau')
    expect(b.querySelector('.ht2-nhe-toc')!.textContent).toBe('21/49 lượt em trả lời dưới 8 giây, nhóm này chỉ đúng 28%. Đọc hết đề rồi mới chọn.')
    expect((within(b).getByRole('button', { name: 'Học ngay · 30 câu hôm nay' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('Chưa đều và Chưa đủ dữ liệu: câu thân thiện, không khối thoát Lười, không mã nội bộ', () => {
    render(<BangNhipHocEm kq={NHIP_EM_CHUA_DEU} onHoc={vi.fn()} />)
    expect(bang().querySelector('.ht2-nhe-nhom')!.textContent).toBe('Chưa đều')
    expect(bang().textContent).toContain('Việc tiếp: cần thêm 14 ngày đủ mức (tính cả hôm nay) để lên nhóm Chăm')
    cleanup()
    render(<BangNhipHocEm kq={NHIP_EM_CHUA_DU} onHoc={vi.fn()} />)
    const b = bang()
    expect(b.querySelector('.ht2-nhe-nhom')!.textContent).toBe('Chưa đủ dữ liệu')
    expect(b.textContent).toContain('Nhịp học của em · từ 11/10')
    expect(b.textContent).toContain('Cần ít nhất 3 ngày đã qua để xếp nhóm — còn 2 ngày nữa.')
    expect(b.textContent).toContain('Việc tiếp: làm đủ mức mỗi ngày — hôm nay còn 18 câu.')
    expect(b.textContent).toContain('Thầy cũng thấy bảng này.')
    expect(b.textContent).not.toMatch(/chua-du|luoi|cham|sbd|qid/)
  })

  it('nạp: đang tải = khung xương → bảng; lỗi = ẩn gọn; không token = không gọi máy chủ', async () => {
    let tra: (r: Response) => void = () => {}
    const cho = vi.fn(() => new Promise<Response>((r) => { tra = r }))
    vi.stubGlobal('fetch', cho)
    const { container, unmount } = render(<NhipHocEm token="tk" onHoc={vi.fn()} />)
    expect(screen.getByLabelText('Đang tải nhịp học của em').getAttribute('aria-busy')).toBe('true')
    await waitFor(() => expect(cho).toHaveBeenCalled())
    tra(traLoi(NHIP_EM_CHAM))
    expect(await screen.findByText('Thầy cũng thấy bảng này.')).toBeTruthy()
    unmount()
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: false, error: 'Chưa tải được nhịp học của em.' }, 500)))
    const r2 = render(<NhipHocEm token="tk-loi" onHoc={vi.fn()} />)
    await waitFor(() => expect(r2.container.querySelector('.ht2-nhe')).toBeNull())
    expect(r2.container.textContent).toBe('')
    r2.unmount()
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const r3 = render(<NhipHocEm onHoc={vi.fn()} />)
    expect(r3.container.textContent).toBe('')
    expect(f).not.toHaveBeenCalled()
    expect(container).toBeTruthy()
  })

  it('bản nhớ 60 giây: về lại Hôm nay vẽ ngay, không gọi lại máy chủ; số câu hôm nay đổi ⇒ nạp lại', async () => {
    const f = vi.fn(async () => traLoi(NHIP_EM_CHAM))
    vi.stubGlobal('fetch', f)
    const r1 = render(<NhipHocEm token="tk-nho" onHoc={vi.fn()} lamMoi={18} />)
    expect(await screen.findByText('Thầy cũng thấy bảng này.')).toBeTruthy()
    r1.unmount()
    const r2 = render(<NhipHocEm token="tk-nho" onHoc={vi.fn()} lamMoi={18} />)
    expect(screen.getByText('Thầy cũng thấy bảng này.')).toBeTruthy() // vẽ ngay, không khung xương
    expect(f).toHaveBeenCalledTimes(1)
    r2.rerender(<NhipHocEm token="tk-nho" onHoc={vi.fn()} lamMoi={19} />)
    await waitFor(() => expect(f).toHaveBeenCalledTimes(2))
  })

  it('màn Hôm nay: bảng đứng ĐẦU, trên khối Hôm nay chính; nút Học ngay dùng đúng onHoc của màn', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi(NHIP_EM_LUOI as KetQuaNhipHocEm)))
    const hoc = vi.fn()
    const sanh = docSanh({ cheDo2: true, theLuc: { con: 30, tong: 30 }, hanhTrinh: { tang: 1, toiThieu: 30, daLam: 0, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 1, cauTrongChang: 6 } })
    render(<HocTapHomNay token="tk" ten="Ngọc Ánh" lop="12A1" ketQua={sanh} dangTai={false} loi="" coCa={false} onHoc={hoc} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)
    const b = await screen.findByRole('region', { name: /^Nhịp học của em/ })
    const chinh = screen.getByRole('region', { name: 'Mục tiêu hôm nay' })
    expect(b.compareDocumentPosition(chinh) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(within(b).getByRole('button', { name: 'Học ngay · 30 câu hôm nay' }))
    expect(hoc).toHaveBeenCalledOnce()
    // mục khác (Hành trình) không có bảng
    fireEvent.click(screen.getByRole('button', { name: 'Hành trình' }))
    expect(screen.queryByRole('region', { name: /^Nhịp học của em/ })).toBeNull()
  })
})
