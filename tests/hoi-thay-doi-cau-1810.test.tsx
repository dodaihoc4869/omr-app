import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'

beforeEach(() => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'thu' })))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })
const cau = (qid: string) => ({ qid, so: 'Câu 3', chuong: '', de: `<p>Nội dung ${qid}</p>`, y: {}, nguon: 'DE' })

it('gõ trước khi đề tới: đổi từ mã chấm sang mã nội dung không xóa câu hỏi đang gõ', async () => {
  let tra!: (r: Response) => void
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/hs/hoi-thay') ? new Promise<Response>((r) => { tra = r }) : Promise.resolve(Response.json({ ok: false }))))
  render(<NutHoiThay qid="DE-III-3~2" luotId="tl_abcdef18" nguon="tu_luyen" />)
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
  const hop = await screen.findByRole('dialog')
  const o = within(hop).getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement
  fireEvent.change(o, { target: { value: 'Em đếm H như thế nào?' } })
  await waitFor(() => expect(tra).toBeTypeOf('function'))
  await act(async () => { tra(Response.json({ ok: true, hoiThem: true, cau: cau('DE-III-8') })) })
  await waitFor(() => expect(hop.textContent).toContain('Nội dung DE'))
  expect((within(hop).getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement).value).toBe('Em đếm H như thế nào?')
})

it('đổi câu khi phản hồi còn chờ: kết quả cũ không mở nhầm hộp trên câu mới', async () => {
  let tra!: (r: Response) => void
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/hs/hoi-thay') ? new Promise<Response>((r) => { tra = r }) : Promise.resolve(Response.json({ ok: false }))))
  const { rerender } = render(<NutHoiThay qid="DE-I-3" nguon="tu_luyen" />)
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
  await waitFor(() => expect(tra).toBeTypeOf('function'))
  await screen.findByRole('dialog')
  rerender(<NutHoiThay qid="DE-I-7" nguon="tu_luyen" />)
  await act(async () => { tra(Response.json({ ok: true, hoiThem: true, cau: cau('DE-I-3') })) })
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('bài cũ lưu dở: Câu 7 mang nguyên mã ~2 và lượt; hỏi tiếp dùng mã nội dung máy chủ đã xác minh', async () => {
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  const goi: { duong: string; b: Record<string, unknown> }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const duong = new URL(url).pathname, b = JSON.parse(String(init?.body ?? '{}'))
    goi.push({ duong, b })
    if (duong === '/hs/hoi-thay') return Response.json({ ok: true, hoiThem: true, cau: { ...cau('DE-III-8'), de: '<p>Amphetamine và methamphetamine</p>' } })
    if (duong === '/hs/hoi-tro-ly') return Response.json({ ok: true, traLoi: 'Em đếm từng nhóm.', conLai: 35 })
    return Response.json({ ok: true, trangThai: 'mo', items: [], danhMuc: [], cacCa: [] })
  }))
  const ds = Array.from({ length: 7 }, (_, i) => ({ qid: i === 6 ? 'DE-III-3~2' : `DE-III-${i + 1}`, phan: 'III', text: i === 6 ? 'Amphetamine và methamphetamine' : `Đề ${i + 1}`, luaChon: null, tenDang: '', sao: 0, loai: 'bai_tap' }))
  localStorage.setItem('ddh.tuluyen.dang.E1', JSON.stringify({ luotId: 'tl_abcdef18', cheDo: 1, tieuDe: 'Sửa câu sai', taoLuc: Date.now(), cau: ds, traLoi: {}, giay: 0, giayCau: {}, coGoiY: [] }))
  render(<ManTuLuyen token="thu" sbd="E1" onVe={() => {}} />)
  const nut = await screen.findAllByRole('button', { name: 'Hỏi thầy' })
  fireEvent.click(nut[6]!)
  const hop = await screen.findByRole('dialog')
  await waitFor(() => expect(hop.textContent).toContain('Amphetamine'))
  expect(hop.textContent).toContain('Câu 7')
  expect(goi.find((x) => x.duong === '/hs/hoi-thay')?.b).toMatchObject({ qid: 'DE-III-3~2', luotId: 'tl_abcdef18', chiHoi: true })
  fireEvent.change(within(hop).getByLabelText('Chỗ em thắc mắc về câu này'), { target: { value: 'Em đếm H như thế nào?' } })
  fireEvent.click(within(hop).getByRole('button', { name: 'Gửi' }))
  await waitFor(() => expect(goi.find((x) => x.duong === '/hs/hoi-tro-ly')?.b).toMatchObject({ qid: 'DE-III-8', qidTrongLuot: 'DE-III-3~2', luotId: 'tl_abcdef18' }))
})

it('đổi câu sau khi mở: đóng hội thoại cũ, không giữ nội dung và lỗi của câu trước', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, hoiThem: true, cau: cau('DE-I-3') })))
  const { rerender } = render(<NutHoiThay qid="DE-I-3" nguon="tu_luyen" />)
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
  await screen.findByRole('dialog')
  rerender(<NutHoiThay qid="DE-I-7" nguon="tu_luyen" />)
  expect(screen.queryByRole('dialog')).toBeNull()
})
