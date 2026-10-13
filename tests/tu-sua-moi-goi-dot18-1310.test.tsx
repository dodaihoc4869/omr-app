// @vitest-environment jsdom
// ĐỢT 18 · TỰ SỬA LỖI MỜI GỌI (thầy 13/10): "Mời gọi học sinh tự sửa lỗi, trong hồ sơ của học sinh những câu chưa sửa lỗi mà có trong tự sửa lỗi mới
// hiện sửa câu này, nếu chưa có thì chưa hiện. Làm nổi bật phần tự sửa lỗi lên và mời gọi thân thiện" · "Bỏ hết các gợi ý hướng dẫn".
// Khoá:
//   · hồ sơ (chế độ học sinh): nút "Sửa câu này" CHỈ ở hộp có khoá mở nằm trong tập câu còn cần sửa; vắng tập ⇒ không nút, không chữ gợi ý; dòng mời có số;
//     thầy / phụ huynh: không nút dù có tập;
//   · HoSoCuaEmHs: dựng tập từ danh sách Tự sửa lỗi (chỉ câu nhóm 'can'); danh sách lỗi / chưa mở ⇒ không nút, tấm vẫn đủ;
//   · Hôm nay: thẻ mời có số + nhãn + nút "Sửa lỗi ngay" khi còn câu; 0 câu / chưa có số ⇒ không thẻ (dòng "Tự sửa lỗi" thường hiện lại);
//   · luật nhóm MỘT chỗ (`nhomMucChua`) + bản nhớ trong phiên (`taiTuSuaLoi`): lần sau dùng lại, `moi` hỏi lại và báo người nghe, lỗi không ghi nhớ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-cau-sai-api')>()), apiDanhSachTuChua: api.apiDanhSachTuChua }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))

import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { khoaMoChua } from '../server/src/ho-so-em-hs-loc'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { docSanh } from '../src/components/hoa2/api'
import { nhomMucChua, soCauCanSua, taiTuSuaLoi, ngheTuSua, xoaNhoTuSua } from '../src/lib/tu-sua-loi'
const { default: HoSoLamCauEm, coNutSua } = await import('../src/components/chien-dich/HoSoLamCauEm')
const { default: HoSoCuaEmHs, khoaCanSua } = await import('../src/components/hoc-tap/HoSoCuaEmHs')
const { default: HocTapHomNay, TheMoiTuSua } = await import('../src/components/hoc-tap/HocTapHomNay')
const { xoaNhoNhipHocEm } = await import('../src/components/hoc-tap/TheHomNayEm')

const QID = ['DH-12-C1-B6-TN-I-3', 'DH-12-C1-B6-TN-II-1', 'DH-12-C1-B6-TN-III-2']
const G = QID.map(khoaMoChua)
const TD = hoSoThaiDoGia('11010')
const cau = (i: number, sua = false) => ({
  qid: `c${i}`,
  tieuDe: `Câu ${i + 1} · Thuỷ phân ester`,
  mucDo: 'hieu',
  soLan: 2,
  soSai: sua ? 1 : 2,
  soDung: sua ? 1 : 0,
  lanCuoiDung: sua,
  lanCuoi: '2026-10-12T03:00:00Z',
  giaySai: [30, 40],
  moChua: G[i] ?? khoaMoChua(`khac-${i}`),
})
const LS: KetQuaLichSuLamCau = {
  ok: true,
  em: { sbd: '11010', hoTen: TD.em.hoTen, lop: '12A1' },
  tong: { soLuot: 8, soDung: 1, soSai: 7, soBoTrong: 0, soCau: 4, soCauSai: 4, giayTb: 35, tongGiay: 280 },
  lan: [],
  cauSai: [cau(0), cau(1), cau(2), cau(3, true)],
  conNua: false,
  catBot: false,
}
const nguon = { hoSoThaiDo: async () => ({ ok: true as const, du: TD }), lichSu: async () => ({ ok: true as const, du: LS }) }
vi.mock('../src/lib/ho-so-em-hs-api', () => ({ taoNguonHoSoEm: () => nguon }))

beforeEach(() => {
  api.apiDanhSachTuChua.mockReset()
  xoaNhoTuSua()
  xoaNhoNhipHocEm()
  // Thẻ Hôm nay hỏi /hs/nhip-hoc — máy chủ giả không có ⇒ phần Nhịp học ẩn gọn (không liên quan tới thẻ mời).
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function moTamEm(coTheChua?: ReadonlySet<string>, cheDo: 'hoc-sinh' | 'thay' | 'phu-huynh' = 'hoc-sinh') {
  const onChuaCau = vi.fn()
  render(<HoSoLamCauEm em={{ sbd: '', ten: 'Em', khoi: null }} nguon={nguon} cheDo={cheDo} onDong={() => {}} onChuaCau={onChuaCau} coTheChua={coTheChua} />)
  const tam = await screen.findByRole('dialog')
  await within(tam).findByText('Số lượt làm câu')
  return { tam, onChuaCau }
}
const nutSua = (tam: HTMLElement) => within(tam).queryAllByRole('button', { name: /^Sửa câu này: / })

describe('Hồ sơ của em: "Sửa câu này" chỉ ở câu đang có trong Tự sửa lỗi', () => {
  it('chỉ hộp có khoá trong tập là nút; hộp khác là hộp thường, không chữ gợi ý; dòng mời có số câu', async () => {
    const { tam, onChuaCau } = await moTamEm(new Set([G[0]!, G[2]!]))
    const nut = nutSua(tam)
    expect(nut.map((n) => n.getAttribute('aria-label'))).toEqual(['Sửa câu này: Câu 1 · Thuỷ phân ester', 'Sửa câu này: Câu 3 · Thuỷ phân ester'])
    const hop = [...tam.querySelectorAll('.hslc-cs-nhom[data-loai="chua"] .hslc-o')]
    expect(hop).toHaveLength(3)
    expect(hop[1]!.querySelector('button')).toBeNull()
    expect(hop[1]!.textContent).not.toMatch(/Sửa câu này|Tự chữa|Bấm/)
    expect(tam.querySelector('.hslc-cs-moi')!.textContent).toBe('2 câu đang chờ em tự sửa')
    expect(tam.textContent).not.toMatch(/Bấm một câu/)
    fireEvent.click(nut[1]!)
    expect(onChuaCau).toHaveBeenCalledWith(G[2])
  })

  it('không có tập (đang tải / lỗi) ⇒ không nút, không dòng mời; tấm vẫn đủ', async () => {
    const { tam } = await moTamEm(undefined)
    expect(nutSua(tam)).toHaveLength(0)
    expect(tam.querySelector('.hslc-cs-moi')).toBeNull()
    expect(within(tam).getByRole('heading', { name: /Chưa sửa được/ })).toBeTruthy()
    expect(tam.querySelectorAll('.hslc-cs-nhom[data-loai="chua"] .hslc-o')).toHaveLength(3)
  })

  it('tập rỗng ⇒ không nút', async () => {
    const { tam } = await moTamEm(new Set())
    expect(nutSua(tam)).toHaveLength(0)
    expect(tam.querySelector('.hslc-cs-moi')).toBeNull()
  })

  it('thầy và phụ huynh: không nút dù có tập', async () => {
    for (const cd of ['thay', 'phu-huynh'] as const) {
      const { tam } = await moTamEm(new Set(G), cd)
      expect(nutSua(tam)).toHaveLength(0)
      expect(tam.querySelector('.hslc-cs-moi')).toBeNull()
      cleanup()
    }
    expect(coNutSua({ moChua: G[0] }, new Set([G[0]!]))).toBe(true)
    expect(coNutSua({}, new Set([G[0]!]))).toBe(false)
    expect(coNutSua({ moChua: G[0] }, undefined)).toBe(false)
  })

  it('học sinh / phụ huynh: bỏ chữ hướng dẫn và cách tính; thầy giữ', async () => {
    const { tam } = await moTamEm(new Set())
    fireEvent.click(within(tam).getByRole('tab', { name: /^Toàn bộ lịch sử/ }))
    expect(tam.textContent).not.toMatch(/Mỗi lượt: giờ|Vạch: |Cách tính độ tin cậy/)
    cleanup()
    const thay = await moTamEm(undefined, 'thay')
    fireEvent.click(within(thay.tam).getByRole('tab', { name: /^Toàn bộ lịch sử/ }))
    expect(thay.tam.textContent).toMatch(/Mỗi lượt: giờ/)
  })
})

describe('HoSoCuaEmHs dựng tập từ danh sách Tự sửa lỗi', () => {
  const vo = () => render(<HoSoCuaEmHs token="tk" tenEm="Em" onDong={() => {}} onChuaCau={() => {}} />)

  it('câu cần sửa ⇒ có nút; đã tự sửa / chờ lần gặp lại chưa tới giờ / câu không có trong danh sách ⇒ không', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [
      { qid: `${QID[0]}~2`, trangThai: 'dang_chua_buoc' },
      { qid: QID[1], trangThai: 'da_tu_sua' },
      { qid: QID[2], trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() + 5 * 3600_000).toISOString() },
    ] })
    vo()
    const tam = await screen.findByRole('dialog')
    const nut = await within(tam).findAllByRole('button', { name: /^Sửa câu này: / })
    expect(nut).toHaveLength(1)
    expect(nut[0]!.getAttribute('aria-label')).toBe('Sửa câu này: Câu 1 · Thuỷ phân ester')
    expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['lỗi mạng', { trangThai: 'loi', loi: 'Chưa nối được máy chủ.' }],
    ['vòng chữa chưa mở', { trangThai: 'tat' }],
  ])('%s ⇒ không nút, tấm vẫn đủ', async (_ten, kq) => {
    api.apiDanhSachTuChua.mockResolvedValue(kq)
    vo()
    const tam = await screen.findByRole('dialog')
    await within(tam).findByText('Số lượt làm câu')
    await waitFor(() => expect(api.apiDanhSachTuChua).toHaveBeenCalled())
    expect(nutSua(tam)).toHaveLength(0)
    expect(tam.querySelectorAll('.hslc-cs-nhom[data-loai="chua"] .hslc-o')).toHaveLength(3)
  })

  it('lệnh ném lỗi ⇒ không nút, không vỡ tấm', async () => {
    api.apiDanhSachTuChua.mockRejectedValue(new Error('mất mạng'))
    vo()
    const tam = await screen.findByRole('dialog')
    await within(tam).findByText('Số lượt làm câu')
    await waitFor(() => expect(api.apiDanhSachTuChua).toHaveBeenCalled())
    expect(nutSua(tam)).toHaveLength(0)
  })

  it('không có đường mở (onChuaCau vắng) ⇒ không hỏi danh sách', async () => {
    render(<HoSoCuaEmHs token="tk" tenEm="Em" onDong={() => {}} />)
    const tam = await screen.findByRole('dialog')
    await within(tam).findByText('Số lượt làm câu')
    expect(api.apiDanhSachTuChua).not.toHaveBeenCalled()
    expect(nutSua(tam)).toHaveLength(0)
  })

  it('khoaCanSua: chỉ câu nhóm cần sửa, theo mã gốc', () => {
    const k = khoaCanSua({ trangThai: 'bat', ds: [{ qid: `tc:${QID[0]}#3`, trangThai: 'can_thay' }, { qid: QID[1], trangThai: 'da_tu_sua' }] }, Date.now())
    expect([...k]).toEqual([G[0]])
    expect(khoaCanSua({ trangThai: 'loi', loi: 'x' }, Date.now()).size).toBe(0)
  })
})

describe('Hôm nay: thẻ mời Tự sửa lỗi', () => {
  it('có số ⇒ nhãn + số câu + MỘT nút "Sửa lỗi ngay"; 0 / chưa có số ⇒ không vẽ', () => {
    const onChua = vi.fn()
    const { container, rerender } = render(<TheMoiTuSua so={3} onChua={onChua} />)
    const the = screen.getByRole('region', { name: '3 câu đang chờ em sửa' })
    expect(the.textContent).toContain('Tự sửa lỗi')
    const nut = within(the).getAllByRole('button')
    expect(nut).toHaveLength(1)
    expect(nut[0]!.textContent).toBe('Sửa lỗi ngay')
    fireEvent.click(nut[0]!)
    expect(onChua).toHaveBeenCalledOnce()
    rerender(<TheMoiTuSua so={0} onChua={onChua} />)
    expect(container.innerHTML).toBe('')
    rerender(<TheMoiTuSua so={null} onChua={onChua} />)
    expect(container.innerHTML).toBe('')
  })

  const sanh = docSanh({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 1, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6 } })
  const veHomNay = (onChua = vi.fn()) =>
    render(<HocTapHomNay ten="An" lop="12A1" ketQua={sanh} dangTai={false} loi="" coCa={false} token="tk" onHoc={vi.fn()} onXemLai={vi.fn()} onChua={onChua} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)

  it('màn Hôm nay thật: còn câu cần sửa ⇒ thẻ mời có đúng số (không đếm câu đã sửa / đang chờ); bấm ⇒ mở Tự sửa lỗi', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [
      { qid: 'Q1', trangThai: 'can_chan_doan' },
      { qid: 'Q2', trangThai: 'can_thay' },
      { qid: 'Q3', trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() - 60_000).toISOString() },
      { qid: 'Q4', trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() + 3600_000).toISOString() },
      { qid: 'Q5', trangThai: 'da_tu_sua' },
    ] })
    const onChua = vi.fn()
    veHomNay(onChua)
    // thẻ Hôm nay vẽ ngay, không chờ danh sách
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' })).toBeTruthy()
    const the = await screen.findByRole('region', { name: '3 câu đang chờ em sửa' })
    // khi thẻ mời hiện, dòng "Tự sửa lỗi" ở nhóm Ôn và sửa không lặp lại
    expect(within(screen.getByRole('region', { name: 'Ôn và sửa' })).queryByRole('button', { name: /Tự sửa lỗi/ })).toBeNull()
    fireEvent.click(within(the).getByRole('button', { name: 'Sửa lỗi ngay' }))
    expect(onChua).toHaveBeenCalledOnce()
    // Ôn & sửa: dòng Tự sửa lỗi mang số câu có nhãn. SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19, luật tốc độ): tab nạp khi mở ⇒ chờ thẻ hiện (findBy).
    fireEvent.click(screen.getByRole('button', { name: 'Ôn & sửa' }))
    expect((await screen.findByRole('button', { name: /Tự sửa lỗi/ })).textContent).toContain('3 câu')
  })

  it('không còn câu cần sửa ⇒ không thẻ mời, dòng "Tự sửa lỗi" nói thật', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [{ qid: 'Q5', trangThai: 'da_tu_sua' }] })
    veHomNay()
    const dong = await screen.findByRole('button', { name: /Tự sửa lỗi.*Không còn câu cần sửa/ })
    expect(dong).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sửa lỗi ngay' })).toBeNull()
  })

  it('danh sách lỗi ⇒ không thẻ mời, thẻ Hôm nay vẫn đủ', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'loi', loi: 'Chưa nối được máy chủ.' })
    veHomNay()
    await waitFor(() => expect(api.apiDanhSachTuChua).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Sửa lỗi ngay' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Tự sửa lỗi/ })).toBeTruthy()
  })
})

describe('Luật nhóm và bản nhớ', () => {
  it('nhomMucChua: một luật cho cả ba chỗ', () => {
    const nay = Date.parse('2026-10-13T10:00:00Z')
    expect(nhomMucChua({ trangThai: 'da_tu_sua' }, nay)).toBe('xong')
    expect(nhomMucChua({ trangThai: 'cho_gap_lai_2', denHan: '2026-10-13T11:00:00Z' }, nay)).toBe('cho')
    expect(nhomMucChua({ trangThai: 'cho_gap_lai_2', denHan: '2026-10-13T09:00:00Z' }, nay)).toBe('can')
    expect(nhomMucChua({ trangThai: 'cho_gap_lai_2' }, nay)).toBe('cho')
    for (const tt of ['can_chan_doan', 'dang_chua_buoc', 'dang_ghep_bai', 'dang_kiem_chung', 'can_thay', 'thieu_hoc_lieu', 'cau_thay_doi', 'tam_khoa'])
      expect(nhomMucChua({ trangThai: tt }, nay)).toBe('can')
    expect(soCauCanSua({ trangThai: 'tat' }, nay)).toBeNull()
    expect(soCauCanSua({ trangThai: 'bat', ds: [] }, nay)).toBe(0)
  })

  it('lần sau dùng bản nhớ; `moi` hỏi lại và báo người nghe; lỗi không ghi nhớ', async () => {
    const ds1 = { trangThai: 'bat', ds: [{ qid: 'Q1', trangThai: 'can_chan_doan' }] }
    const ds2 = { trangThai: 'bat', ds: [] }
    api.apiDanhSachTuChua.mockResolvedValueOnce({ trangThai: 'loi', loi: 'x' }).mockResolvedValueOnce(ds1).mockResolvedValueOnce(ds2)
    expect((await taiTuSuaLoi('t')).trangThai).toBe('loi')
    expect(await taiTuSuaLoi('t')).toEqual(ds1) // lỗi không ghi nhớ ⇒ hỏi lại
    expect(await taiTuSuaLoi('t')).toEqual(ds1) // bản nhớ
    expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(2)
    const nghe = vi.fn()
    const go = ngheTuSua(nghe)
    expect(await taiTuSuaLoi('t', { moi: true })).toEqual(ds2)
    expect(nghe).toHaveBeenCalledWith('t', ds2)
    go()
    expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(3)
  })
})
