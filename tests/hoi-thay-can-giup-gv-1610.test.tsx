import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may-thu' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'ma-thu' }))
import CanGiupHoiThay from '../src/components/chien-dich/CanGiupHoiThay'
import { docCanGiupHoiThay } from '../src/lib/hoi-thay-gv-api'

type J = Record<string, unknown>
const dong = (sbd: string, qid = 'Q1', lop = '12A1', revision = 0) => ({ sbd, qid, ten: `Em ${sbd}`, lop, tieuDe: `Câu ${qid}`, lyDo: 'Em chưa hiểu quan hệ mol.', guiLuc: 1792110000000, capNhatLuc: 1792110000000, revision })
let tra: (url: string, body: J) => J | Promise<J>
let goi: { url: string; body: J; ma: string; signal: AbortSignal | null }[]
beforeEach(() => {
  goi = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input), body = JSON.parse(String(init?.body ?? '{}')) as J
    goi.push({ url, body, ma: (init?.headers as Record<string, string>)['x-ma-bi-mat'], signal: init?.signal ?? null })
    return new Response(JSON.stringify(await tra(url, body)), { headers: { 'content-type': 'application/json' } })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const mo = async () => { fireEvent.click(screen.getByRole('button', { name: 'Xem chỗ cần giúp' })); await screen.findByText(/Đang xem/) }
const choTai = () => waitFor(() => expect((screen.getByRole('button', { name: 'Tải lại chỗ cần giúp' }) as HTMLButtonElement).disabled).toBe(false))

describe('chỗ cần thầy giúp · 16/10', () => {
  it('không gọi khi mở; nhóm đúng lớp/câu, ưu tiên số em đã tải; cursor và tổng thật, không nhân yêu cầu khi trang trùng', async () => {
    const moc = { luc: 12, sbd: 'E3', qid: 'Q2' }
    tra = (_url, b) => b.sau ? { ok: true, tong: 135, ds: [dong('E3', 'Q2'), dong('E5', 'Q2')] }
      : { ok: true, tong: 135, ds: [dong('E1'), dong('E2'), dong('E3', 'Q2'), dong('E4', 'Q1', '12A2')], sau: moc }
    const { container } = render(<CanGiupHoiThay />)
    expect(goi).toHaveLength(0)
    await mo(); await choTai()
    expect(container.textContent).toContain('Đang xem 4/135 yêu cầu · 3 nhóm trong danh sách đã tải')
    const nhom = screen.getAllByRole('article')
    expect(nhom[0].textContent).toContain('2 em cần giúp')
    expect(nhom[0].textContent).toContain('12A1')
    expect(nhom[2].textContent).toContain('12A2')
    fireEvent.click(screen.getByRole('button', { name: 'Xem tiếp các yêu cầu' }))
    await waitFor(() => expect(container.textContent).toContain('Đang xem 5/135 yêu cầu'))
    expect(goi[1].body).toEqual({ sau: moc })
    expect(goi.every((x) => x.ma === 'ma-thu' && x.signal instanceof AbortSignal)).toBe(true)
    expect(screen.queryByRole('button', { name: 'Xem tiếp các yêu cầu' })).toBeNull()
  })

  it('gửi tối đa 50 em với phiên bản vừa xem; giữ màn, cập nhật tổng, không xác nhận em đã hiểu', async () => {
    const em = Array.from({ length: 51 }, (_, i) => dong(`E${i}`, 'Q1', '12A1', i))
    let daGui = false
    tra = (url) => {
      if (url.endsWith('/ho-tro')) { daGui = true; return { ok: true, soEm: 50, thongBao: 'Đã gửi hướng dẫn cho 50 em. Các em sẽ tự kiểm lại.' } }
      return { ok: true, tong: daGui ? 1 : 51, ds: daGui ? [em[50]] : em }
    }
    const { container } = render(<CanGiupHoiThay />)
    await mo(); await choTai()
    fireEvent.change(screen.getByLabelText('Hướng dẫn gửi các em'), { target: { value: '  Em đổi đơn vị trước.  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn cho 50 em' }))
    expect((await screen.findByRole('status')).textContent).toContain('Các em sẽ tự kiểm lại')
    await waitFor(() => expect(container.textContent).toContain('Đang xem 1/1 yêu cầu'))
    const b = goi.find((x) => x.url.endsWith('/ho-tro'))!.body
    expect(b).toMatchObject({ qid: 'Q1', loiGo: 'Em đổi đơn vị trước.', em: em.slice(0, 50).map((x) => ({ sbd: x.sbd, revision: x.revision })) })
    expect(b.requestId).toMatch(/^hoi-thay-[a-f0-9]{32}$/)
    expect(b).not.toHaveProperty('daHieu')
    expect(screen.getByRole('heading', { name: 'Chỗ cần thầy giúp' })).toBeTruthy()
  })

  it('mất phản hồi giữ nguyên mã/nội dung/phiên bản khi thử gửi lại, khoá sửa nội dung cho tới biên nhận', async () => {
    let lanGui = 0
    tra = (url) => {
      if (url.endsWith('/ho-tro')) {
        if (++lanGui === 1) throw new Error('Mất phản hồi sau khi máy chủ ghi')
        return { ok: true, soEm: 1, thongBao: 'Đã gửi hướng dẫn cho 1 em. Các em sẽ tự kiểm lại.', idempotent: true }
      }
      return { ok: true, tong: lanGui > 1 ? 0 : 1, ds: lanGui > 1 ? [] : [dong('E1', 'Q1', '12A1', 8)] }
    }
    render(<CanGiupHoiThay />); await mo(); await choTai()
    fireEvent.change(screen.getByLabelText('Hướng dẫn gửi các em'), { target: { value: 'Em viết phản ứng trước.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn cho 1 em' }))
    await screen.findByRole('button', { name: 'Thử gửi lại' })
    expect((screen.getByLabelText('Hướng dẫn gửi các em') as HTMLTextAreaElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Tải lại chỗ cần giúp' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Thử gửi lại' }))
    await screen.findByRole('status')
    const gui = goi.filter((x) => x.url.endsWith('/ho-tro'))
    expect(gui).toHaveLength(2)
    expect(gui[1].body).toEqual(gui[0].body)
  })

  it('phiên bản đổi báo tại nhóm và cho tải lại; lần gửi sau dùng phiên bản mới, không tự bỏ qua lỗi', async () => {
    let lanDoc = 0, lanGui = 0
    tra = (url) => url.endsWith('/ho-tro')
      ? (++lanGui === 1 ? { ok: false, ma: 'tien_do_doi', error: 'Danh sách vừa thay đổi. Thầy tải lại rồi gửi hướng dẫn nhé.' } : { ok: true, soEm: 1, thongBao: 'Đã gửi hướng dẫn cho 1 em.' })
      : { ok: true, tong: 1, ds: [dong('E1', 'Q1', '12A1', ++lanDoc)] }
    render(<CanGiupHoiThay />); await mo(); await choTai()
    fireEvent.change(screen.getByLabelText('Hướng dẫn gửi các em'), { target: { value: 'Em kiểm tra đơn vị.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn cho 1 em' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Danh sách vừa thay đổi')
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại chỗ cần giúp' })); await choTai()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn cho 1 em' }))
    await screen.findByRole('status')
    const gui = goi.filter((x) => x.url.endsWith('/ho-tro'))
    expect(gui[0].body.em).toEqual([{ sbd: 'E1', revision: 1 }])
    expect(gui[1].body.em).toEqual([{ sbd: 'E1', revision: 2 }])
    expect(gui[1].body.requestId).not.toBe(gui[0].body.requestId)
  })

  it('lỗi tải vẫn giữ danh sách đã xem và báo ngay cạnh khung', async () => {
    let lan = 0
    tra = () => ++lan === 1 ? { ok: true, tong: 1, ds: [dong('E1')] } : { ok: false, error: 'Máy chủ đang bận.' }
    render(<CanGiupHoiThay />); await mo(); await choTai()
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại chỗ cần giúp' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Máy chủ đang bận.')
    expect(within(screen.getByRole('article')).getByRole('heading', { name: 'Câu Q1' })).toBeTruthy()
  })

  it('rời màn khi đang tải không chèn dữ liệu cũ vào lần mở khác', async () => {
    let traCu!: (j: J) => void
    tra = () => new Promise<J>((resolve) => { traCu = resolve })
    const cu = render(<CanGiupHoiThay />)
    fireEvent.click(screen.getByRole('button', { name: 'Xem chỗ cần giúp' }))
    await waitFor(() => expect(goi).toHaveLength(1))
    cu.unmount()
    tra = () => ({ ok: true, tong: 0, ds: [] })
    render(<CanGiupHoiThay />); await mo(); await choTai()
    traCu({ ok: true, tong: 1, ds: [dong('E-CU')] })
    await waitFor(() => expect(screen.getByText('Chưa có em nào đang chờ thầy hỗ trợ.')).toBeTruthy())
    expect(screen.queryByText(/E-CU/)).toBeNull()
  })

  it('dọn timer cả khi mạng hoặc phần đọc JSON lỗi, không để bộ hẹn giờ treo', async () => {
    const don = vi.spyOn(globalThis, 'clearTimeout')
    tra = () => { throw new Error('Mất mạng') }
    const r = await docCanGiupHoiThay()
    expect(r).toMatchObject({ ok: false, ma: 'ket_noi' })
    expect(don).toHaveBeenCalled()
    don.mockClear()
    vi.mocked(fetch).mockResolvedValueOnce({ json: async () => { throw new Error('JSON lỗi') } } as Response)
    expect(await docCanGiupHoiThay()).toMatchObject({ ok: false, ma: 'ket_noi' })
    expect(don).toHaveBeenCalled()
  })
})
