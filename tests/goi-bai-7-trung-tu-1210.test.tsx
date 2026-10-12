// @vitest-environment jsdom
// TRÙNG TU 12/10 — Hành trình › Bài mới trong 7 ngày (app thầy). Khoá: số ở hàng ô số / dải tiến độ cộng đúng; lọc + xếp danh sách chữa;
// "Học sinh cần hỗ trợ" ba nhóm không trùng em; tiến độ học sinh xếp + tìm không dấu; tấm soạn phần chữa GIỮ NGUYÊN lệnh `chi_tiet` / `chua`
// (`dungLoiGiaiSan`) / đóng, Esc không làm mất chữ chưa lưu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { goiLenh } from '../src/lib/goi-lenh-thay'
import BangGoi7 from '../src/components/chien-dich/BangGoi7'
import { chuConLai, demLoc, nhomHoTro, soNgayCon, tomTatLop, xepCau, xepEm, type CauDu, type DuGoi7, type EmDu } from '../src/components/chien-dich/goi7-ui'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))

const em = (sbd: string, ten: string, daGap: number, tuLam: number, kyNang: number | null = 50): EmDu => ({
  sbd, ten, tong: 10, daGap, tuLam, con: 10 - daGap, kyNang: kyNang === null ? { tong: 0, dat: 0, tyLe: null } : { tong: 10, dat: kyNang / 10, tyLe: kyNang }, diem: [],
})
const EM = [em('1', 'Nguyễn Minh Anh', 10, 8, 80), em('2', 'Trần Đức Huy', 2, 1, 10), em('3', 'Lê Phương Linh', 6, 3, null), em('4', 'Đỗ Quốc Việt', 4, 4, 40)]
const t = (sbd: string) => ({ sbd, ten: EM.find((e) => e.sbd === sbd)!.ten })
const cau = (qid: string, soCau: number, phan: 'I' | 'II' | 'III', o: Partial<CauDu> = {}): CauDu => ({
  qid, maDe: 'DH-12-C1-B6', maTo: `DH-12-C1-B6-${phan === 'I' ? 'TN' : phan === 'II' ? 'DS' : 'TLN'}`, soCau, version: 'v1', group: qid, phan, hopLe: true,
  kho: false, tinhToan: false, kyNang: [], lyDo: [], daChua: false, loiGo: '', daDo: 0, sai: 0, chuaGap: [], canKiem: [], ...o,
})
// Thứ tự máy chủ (đã xếp): q3 (em nhờ thầy chữa) → q1 (nhiều em sai) → q2 (tính toán) → q4 (đã chữa, mẫu nhỏ 2/2 sai)
const CAU = [
  cau('q3', 3, 'III', { tinhToan: true, lyDo: ['Có tính toán'], daDo: 6, sai: 2, chuaGap: [t('2')], canKiem: [t('2'), t('3'), t('4')], choChua: [t('3')] }),
  cau('q1', 1, 'I', { kho: true, lyDo: ['Câu khó', 'Nhiều học sinh sai'], daDo: 10, sai: 6, chuaGap: [t('2')], canKiem: [t('2'), t('4')] }),
  cau('q2', 2, 'II', { tinhToan: true, lyDo: ['Có tính toán'], daDo: 5, sai: 1, chuaGap: [], canKiem: [t('4')] }),
  cau('q4', 4, 'I', { daChua: true, loiGo: 'Đổi đơn vị trước khi tính số mol.', daDo: 2, sai: 2, chuaGap: [t('2'), t('3')], canKiem: [t('2'), t('3')] }),
]
const DU: DuGoi7 = {
  bat: true, nguonDayDu: true, goiId: 'g1', canChua: 3, canGap: 3, soEm: 4, soCau: 10, cau: CAU, em: EM,
  goi: [{ id: 'g1', ten: 'Ester', lop: '12A1', han: '2026-10-16', bat_dau: '2026-10-10' }, { id: 'g2', ten: 'Lipid', lop: '12A2', han: '2026-10-18', bat_dau: '2026-10-12' }],
}
const CAU_RIENG = { qid: 'q1', maDe: 'DH-12-C1-B6', version: 'v1', group: 'q1', phan: 'I' as const, text: 'Chất nào là ester?', choices: ['CH3COOCH3', 'CH3COOH', 'C2H5OH', 'HCHO'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: null, sao: 0, kienThuc: [], correct: 'A', solution: 'CH3COOCH3 là methyl acetate.', reviewed: true }

beforeEach(() => {
  vi.mocked(goiLenh).mockImplementation(async (_d, body) => {
    const b = body as Record<string, unknown>
    if (b.action === 'chi_tiet') return { ok: true, du: { ok: true, cau: { ...CAU_RIENG, qid: String(b.qid) } } }
    if (b.action === 'chua') return { ok: true, du: { ok: true, daLuu: true } }
    return { ok: true, du: DU as unknown as Record<string, unknown> }
  })
})
afterEach(() => { cleanup(); vi.resetAllMocks() })

const moBang = async () => {
  render(<BangGoi7 trangRieng />)
  await screen.findByText('Câu cần chữa')
  return screen.getByRole('region', { name: 'Bài mới trong 7 ngày' })
}
const oSo = (nhan: string) => [...document.querySelectorAll('.g7-o-nhan')].find((dt) => dt.textContent === nhan)?.parentElement?.querySelector('.g7-o-gt')?.textContent
const thuTuCau = () => [...document.querySelectorAll('.g7-cau-so b')].map((b) => b.textContent)

describe('phép thuần goi7-ui', () => {
  it('cộng cả lớp: đã gặp ⊇ đã tự làm; sai lần đầu = Σ sai / Σ đã tự làm', () => {
    const tt = tomTatLop(DU)
    expect(tt).toMatchObject({ tong: 40, gap: 22, tuLam: 16, gapChuaTuLam: 6, chuaGap: 18, sai: 11, daDo: 23, daCoChua: 1, theoPhan: { I: 2, II: 1, III: 1 } })
  })
  it('ba nhóm hỗ trợ không trùng em: nhờ thầy chữa → cần kiểm lại → chưa gặp', () => {
    const n = nhomHoTro(CAU[0]!)
    expect(n.choChua.map((e) => e.sbd)).toEqual(['3'])
    expect(n.canKiem.map((e) => e.sbd)).toEqual(['4'])
    expect(n.chuaGap.map((e) => e.sbd)).toEqual(['2'])
    expect(n.tong).toBe(3)
  })
  it('xếp theo tỉ lệ sai: câu đủ mẫu trước, mẫu nhỏ (dưới 5 em) sau dù 100% sai; mặc định giữ thứ tự máy chủ', () => {
    expect(xepCau(CAU, 'uu-tien').map((c) => c.qid)).toEqual(['q3', 'q1', 'q2', 'q4'])
    expect(xepCau(CAU, 'ti-le-sai').map((c) => c.qid)).toEqual(['q1', 'q3', 'q2', 'q4'])
  })
  it('số trên nút lọc đếm trong loại câu đang chọn', () => {
    expect(demLoc(CAU, 'tat-ca', 'moi').tinhTrang).toEqual({ 'tat-ca': 4, 'chua-duyet': 3, 'nhieu-sai': 1, 'tinh-toan': 2 })
    expect(demLoc(CAU, 'tinh-toan', 'I').phan).toEqual({ moi: 2, I: 0, II: 1, III: 1 })
  })
  it('tiến độ học sinh: mặc định còn nhiều câu chưa gặp lên đầu; kỹ năng chưa có bản đồ xếp cuối', () => {
    expect(xepEm(EM, 'chua-gap').map((e) => e.sbd)).toEqual(['2', '4', '3', '1'])
    expect(xepEm(EM, 'ky-nang').map((e) => e.sbd)).toEqual(['2', '4', '1', '3'])
  })
  it('số ngày còn lại tính cả hôm nay (cùng máy chủ)', () => {
    expect(soNgayCon('2026-10-16', '2026-10-12')).toBe(5)
    expect(chuConLai('2026-10-16', '2026-10-16')).toBe('hôm nay là ngày cuối')
    expect(chuConLai('2026-10-16', '2026-10-17')).toBe('đã qua hạn nộp')
    expect(chuConLai('16/10', '2026-10-17')).toBeNull()
  })
})

describe('thẻ Bài mới trong 7 ngày', () => {
  it('đầu thẻ: thẻ chọn bài có lớp + hạn nộp; sáu ô số có nhãn; dải tiến độ cả lớp', async () => {
    const bang = await moBang()
    expect(within(bang).getByRole('radio', { name: /^12A1 · Ester · hạn nộp 16\/10/ }).getAttribute('aria-checked')).toBe('true')
    expect([oSo('Học sinh nhận bài'), oSo('Câu của bài'), oSo('Câu cần chữa'), oSo('Đã gặp câu gốc'), oSo('Đã tự làm'), oSo('Sai ở lần tự làm đầu')]).toEqual(['4', '10', '3', '55%', '40%', '48%'])
    expect(within(bang).getByText('3 em còn câu chưa gặp')).toBeTruthy()
    expect(within(bang).getByText('11 sai trong 23 lần tự làm đầu')).toBeTruthy()
    const dai = within(bang).getByRole('region', { name: 'Tiến độ cả lớp' })
    expect(dai.textContent).toContain('4 em × 10 câu gốc = 40 lượt cần gặp')
    expect(dai.textContent).toContain('Đã tự làm16(40%)')
    expect(dai.textContent).toContain('Đã gặp, chưa tự làm6(15%)')
    expect(dai.textContent).toContain('Chưa gặp18(45%)')
  })

  it('đổi bài bằng thẻ chọn gọi lại máy chủ đúng goiId', async () => {
    const bang = await moBang()
    fireEvent.click(within(bang).getByRole('radio', { name: /^12A2 · Lipid/ }))
    await waitFor(() => expect(goiLenh).toHaveBeenLastCalledWith('/gv/goi-bai-7', { lop: '', goiId: 'g2' }, expect.any(String)))
  })

  it('danh sách chữa: mặc định thứ tự máy chủ; lọc tình trạng × loại câu; xếp theo tỉ lệ sai', async () => {
    const bang = await moBang()
    expect(thuTuCau()).toEqual(['Câu 3', 'Câu 1', 'Câu 2', 'Câu 4'])
    expect(within(bang).getByText('Đang hiện 4/4 câu')).toBeTruthy()
    fireEvent.click(within(bang).getByRole('radio', { name: /^Nhiều học sinh sai/ }))
    expect(thuTuCau()).toEqual(['Câu 1'])
    fireEvent.click(within(bang).getByRole('radio', { name: /^Chưa duyệt phần chữa/ }))
    expect(thuTuCau()).toEqual(['Câu 3', 'Câu 1', 'Câu 2'])
    fireEvent.click(within(bang).getByRole('radio', { name: /^Đúng–sai/ }))
    expect(thuTuCau()).toEqual(['Câu 2'])
    fireEvent.click(within(bang).getByRole('radio', { name: /^Mọi loại/ }))
    fireEvent.click(within(bang).getByRole('radio', { name: /^Tất cả/ }))
    fireEvent.click(within(bang).getByRole('radio', { name: 'Tỉ lệ sai cao trước' }))
    expect(thuTuCau()).toEqual(['Câu 1', 'Câu 3', 'Câu 2', 'Câu 4'])
    expect(within(bang).getByText('2/2 học sinh sai · mẫu nhỏ')).toBeTruthy()
    fireEvent.click(within(bang).getByRole('radio', { name: 'Thứ tự ưu tiên' }))
    expect(thuTuCau()).toEqual(['Câu 3', 'Câu 1', 'Câu 2', 'Câu 4'])
  })

  it('học sinh cần hỗ trợ mở ngay trong dòng, ba nhóm không trùng em', async () => {
    const bang = await moBang()
    const nut = within(bang).getByRole('button', { name: /Học sinh cần hỗ trợ · 3 em/ })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    const mo = document.getElementById(nut.getAttribute('aria-controls')!)!
    expect(within(mo).getByRole('region', { name: 'Nhờ thầy chữa: 1 em' }).textContent).toContain('Lê Phương Linh')
    expect(within(mo).getByRole('region', { name: 'Cần kiểm lại: 1 em' }).textContent).toContain('Đỗ Quốc Việt')
    expect(within(mo).getByRole('region', { name: 'Chưa gặp: 1 em' }).textContent).toContain('Trần Đức Huy')
  })

  it('tiến độ học sinh: thanh + số; mặc định em còn nhiều câu chưa gặp lên đầu; tìm không dấu; xếp tên', async () => {
    const bang = await moBang()
    fireEvent.click(within(bang).getByRole('tab', { name: /Tiến độ học sinh/ }))
    const ten = () => [...within(bang).getAllByRole('rowheader')].map((th) => th.querySelector('b')!.textContent)
    expect(ten()).toEqual(['Trần Đức Huy', 'Đỗ Quốc Việt', 'Lê Phương Linh', 'Nguyễn Minh Anh'])
    expect(within(bang).getByText('2/10 câu · còn 8')).toBeTruthy()
    expect(within(bang).getByText('1/10 câu')).toBeTruthy()
    expect(within(bang).getByText('1/10 kỹ năng (10%)')).toBeTruthy()
    expect(within(bang).getAllByText('Chưa có bản đồ kỹ năng')).toHaveLength(1)
    fireEvent.change(within(bang).getByRole('searchbox', { name: 'Tìm học sinh theo tên hoặc số báo danh' }), { target: { value: 'viet' } })
    expect(ten()).toEqual(['Đỗ Quốc Việt'])
    fireEvent.change(within(bang).getByRole('searchbox'), { target: { value: '' } })
    fireEvent.click(within(bang).getByRole('radio', { name: 'Tên A–Z' }))
    expect(ten()).toEqual(['Đỗ Quốc Việt', 'Lê Phương Linh', 'Nguyễn Minh Anh', 'Trần Đức Huy'])
  })

  it('Mở câu và chữa gọi `chi_tiet`; Lưu phần chữa gọi `chua` đúng version; đóng tấm, tải lại, focus về nút', async () => {
    const bang = await moBang()
    const nut = within(bang).getAllByRole('button', { name: 'Mở câu và chữa' })[1]! // Câu 1 (q1)
    fireEvent.click(nut)
    const tam = await screen.findByRole('dialog', { name: 'Câu 1 · Trắc nghiệm' })
    expect(goiLenh).toHaveBeenCalledWith('/gv/goi-bai-7', { action: 'chi_tiet', goiId: 'g1', qid: 'q1' }, expect.any(String))
    expect(within(tam).getByText('Chất nào là ester?')).toBeTruthy()
    const luu = within(tam).getByRole('button', { name: 'Lưu phần chữa' })
    expect(luu.hasAttribute('disabled')).toBe(true)
    fireEvent.change(within(tam).getByRole('textbox', { name: /Giải thích để học sinh học lại/ }), { target: { value: 'Ester có nhóm COO nối hai gốc hydrocarbon.' } })
    expect(luu.hasAttribute('disabled')).toBe(false)
    const lanGoi = vi.mocked(goiLenh).mock.calls.length
    fireEvent.click(luu)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(goiLenh).toHaveBeenCalledWith('/gv/goi-bai-7', { action: 'chua', goiId: 'g1', qid: 'q1', version: 'v1', loiGo: 'Ester có nhóm COO nối hai gốc hydrocarbon.', dungLoiGiaiSan: false }, expect.any(String))
    await waitFor(() => expect(vi.mocked(goiLenh).mock.calls.length).toBeGreaterThan(lanGoi + 1)) // tải lại danh sách sau khi lưu
    expect(vi.mocked(goiLenh).mock.calls.at(-1)?.[1]).toEqual({ lop: '', goiId: '' })
    expect(document.activeElement).toBe(nut)
  })

  it('Duyệt lời giải đã có gửi `dungLoiGiaiSan: true`; câu đã chữa mở lại với lời giải thích cũ', async () => {
    const bang = await moBang()
    fireEvent.click(within(bang).getAllByRole('button', { name: 'Mở câu và chữa' })[3]!) // Câu 4 đã có phần chữa
    const tam = await screen.findByRole('dialog')
    expect((within(tam).getByRole('textbox') as HTMLTextAreaElement).value).toBe('Đổi đơn vị trước khi tính số mol.')
    fireEvent.click(within(tam).getByRole('button', { name: 'Duyệt lời giải đã có' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(goiLenh).toHaveBeenCalledWith('/gv/goi-bai-7', expect.objectContaining({ action: 'chua', qid: 'q4', dungLoiGiaiSan: true }), expect.any(String))
  })

  it('Esc đóng tấm khi chưa gõ gì; còn chữ chưa lưu thì hỏi lại bằng chữ, không mất chữ', async () => {
    const bang = await moBang()
    fireEvent.click(within(bang).getAllByRole('button', { name: 'Mở câu và chữa' })[0]!)
    let tam = await screen.findByRole('dialog')
    await waitFor(() => expect(document.activeElement?.id).toBe('g7-tam-tieu')) // mở tấm ⇒ focus tiêu đề (hiệu ứng phím đã gắn)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(within(bang).getAllByRole('button', { name: 'Mở câu và chữa' })[0]!)
    tam = await screen.findByRole('dialog')
    await waitFor(() => expect(document.activeElement?.id).toBe('g7-tam-tieu'))
    fireEvent.change(within(tam).getByRole('textbox'), { target: { value: 'Nháp chưa lưu của thầy' } })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(within(tam).getByText(/Phần giải thích chưa lưu/)).toBeTruthy()
    const dong = within(tam).getByRole('button', { name: 'Bỏ thay đổi và đóng' })
    expect(document.activeElement).toBe(dong)
    fireEvent.click(dong)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(goiLenh).not.toHaveBeenCalledWith('/gv/goi-bai-7', expect.objectContaining({ action: 'chua' }), expect.any(String))
  })

  it('mở câu lỗi: báo ngay trong dòng (role=alert), không mở tấm', async () => {
    const bang = await moBang()
    vi.mocked(goiLenh).mockResolvedValueOnce({ ok: false, loai: 'mang', chu: 'Câu đã thay đổi trong kho.' })
    fireEvent.click(within(bang).getAllByRole('button', { name: 'Mở câu và chữa' })[0]!)
    expect((await within(bang).findByRole('alert')).textContent).toBe('Câu đã thay đổi trong kho.')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('thiếu nguồn: cảnh báo role=alert vẫn giữ; onBat báo bật', async () => {
    vi.mocked(goiLenh).mockResolvedValue({ ok: true, du: { ...DU, nguonDayDu: false } as unknown as Record<string, unknown> })
    const onBat = vi.fn()
    render(<BangGoi7 lop="12A1" onBat={onBat} />)
    expect((await screen.findByRole('alert')).textContent).toMatch(/Bộ bài chưa đủ nguồn/)
    expect(onBat).toHaveBeenLastCalledWith(true)
    expect(goiLenh).toHaveBeenCalledWith('/gv/goi-bai-7', { lop: '12A1', goiId: '' }, expect.any(String))
  })
})
