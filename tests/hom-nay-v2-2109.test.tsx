// HÔM NAY BẢN 2 — ô tra cứu lớn + ô VIỆC GẤP "chưa nộp bài tập về nhà" + nút "Gửi cảnh báo" (thầy lệnh 21/09; bản vẽ docs/ban-ve-hom-nay-v2-2109/; chuẩn chữ docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md).
// Nói thật: máy chủ chưa có lệnh ⇒ lời thật, KHÔNG giả "đã gửi". Chỉ thầy bấm mới gửi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ViecGap from '../src/components/hom-nay/ViecGap'
import OTraCuu from '../src/components/hom-nay/OTraCuu'
import { useAppStore } from '../src/store/appStore'
import { baiViecGap, boDau, chuTuDongNhac, conLaiChu, daiNhacCuaEm, demTuNhacHomNay, docTuDongNhac, hanNopChu, lanKeTuDong, layBtvnDangChay, layTuDongNhac, loiCanhBaoMacDinh, timEm, tongChuaNop, trangThaiChuaNop } from '../src/lib/hom-nay-v2'
import type { DongTheoDoiBtvn } from '../src/lib/btvn-may-chu-moi'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean }
function dungMayChu(bang: Record<string, (body: Record<string, unknown>) => Tra>) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    goi(duong, body, init.headers)
    const h = bang[duong]
    if (!h) return { status: 404, ok: false, json: async () => ({}) }
    const r = h(body)
    if (r.cham) {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    }
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.useRealTimers()
})

const NAY = Date.parse('2026-09-21T13:31:00Z') // 20:31 Thứ Hai 21/09/2026 giờ VN
const HAN_NAY = '2026-09-21T16:59:00Z' // 23:59 hôm nay VN
const HAN_QUA = '2026-09-20T16:59:00Z' // 23:59 hôm qua — đã quá 20 giờ 32 phút
const em = (o: Record<string, unknown>) => ({ sbd: '1', hoTen: 'A', nopLuc: null, soDung: null, soCau: null, thuHoi: false, ...o })
const bai = (o: Partial<DongTheoDoiBtvn>, hs: Record<string, unknown>[]): DongTheoDoiBtvn =>
  ({ maBtvn: 'B1', maCa: 'C1', maDe: 'DH-12-C1-B2-TN', soCau: 46, giaoLuc: '2026-09-18T02:00:00Z', hanNop: HAN_NAY, quaHan: false, tong: hs.length, daNop: hs.filter((h) => h.nopLuc).length, chuaNop: [], hocSinh: hs, ...o }) as unknown as DongTheoDoiBtvn

describe('hom-nay-v2 — phần THUẦN', () => {
  it('boDau + timEm: tên KHÔNG DẤU, SBD đầu/giữa, từ đầu tên xếp trước, tối đa 6, chuỗi rỗng ⇒ []', () => {
    expect(boDau('Trần Thu Hà · Đỗ')).toBe('tran thu ha · do')
    const ds = [
      { sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1' },
      { sbd: '11111022', hoTen: 'Trần Thu Hải', lop: '11B1' },
      { sbd: '12121033', hoTen: 'Trần Thị Hà My', lop: '12A2' },
      { sbd: '12121002', hoTen: 'Phạm Gia Bảo', lop: '12A1' },
    ]
    expect(timEm(ds, 'tran thu ha').map((x) => x.sbd)).toEqual(['12121007', '11111022']) // "ha" là tiền tố của "hai" cũng ra; "Thị" ≠ "thu"
    expect(timEm(ds, 'TRẦN THỊ HÀ').map((x) => x.sbd)).toEqual(['12121033']) // hoa/thường + có dấu đều ra
    expect(timEm(ds, 'tran thu hoa')).toHaveLength(0) // mọi từ gõ đều phải có
    expect(timEm(ds, 'bao 12a1')[0].sbd).toBe('12121002') // nhiều từ, kể cả lớp
    expect(timEm(ds, '12121007')[0].sbd).toBe('12121007')
    expect(timEm(ds, '1212').map((x) => x.sbd)).toEqual(expect.arrayContaining(['12121007', '12121033', '12121002']))
    expect(timEm(ds, '   ')).toEqual([])
    expect(timEm(Array.from({ length: 20 }, (_, i) => ({ sbd: String(100 + i), hoTen: `Em Số ${i}`, lop: 'x' })), 'em', 6)).toHaveLength(6)
  })

  it('conLaiChu / hanNopChu: "còn 3 giờ 28 phút" · "còn 1 ngày 3 giờ" · "đã quá 20 giờ"; mốc "HH:mm · Thứ … dd/mm/yyyy"', () => {
    expect(conLaiChu(HAN_NAY, NAY)).toBe('còn 3 giờ 28 phút')
    expect(conLaiChu('2026-09-22T16:59:00Z', NAY)).toBe('còn 1 ngày 3 giờ')
    expect(conLaiChu(HAN_QUA, NAY)).toBe('đã quá 20 giờ')
    expect(conLaiChu('2026-09-21T13:40:00Z', NAY)).toBe('còn 9 phút')
    expect(conLaiChu('hỏng', NAY)).toBe('')
    expect(hanNopChu(HAN_NAY, NAY)).toBe('Hạn nộp 23:59 · Thứ Hai 21/09/2026 (còn 3 giờ 28 phút)')
    expect(hanNopChu(HAN_QUA, NAY)).toBe('Hạn nộp 23:59 · Chủ nhật 20/09/2026 (đã quá 20 giờ)')
  })

  it('trạng thái THẬT của em chưa nộp: bài cũ chỉ "Chưa nộp bài"; bài nâng đỡ: chưa mở / chưa xong chặng 1 / dở chặng 2 trong 7 chặng; gần xong ≥ 70 %', () => {
    const cu = { caNhan: false }
    const np = { caNhan: true }
    expect(trangThaiChuaNop(cu, {})).toMatchObject({ muc: 'chua_mo', chu: 'Chưa nộp bài', tienDo: null })
    expect(trangThaiChuaNop(np, { soCauCuaEm: null })).toMatchObject({ muc: 'chua_mo', chu: 'Chưa mở bài', tienDo: 0 })
    expect(trangThaiChuaNop(np, { soCauCuaEm: 46, soChang: 7, loDaXong: 0 }).chu).toBe('Đã mở bài · chưa xong chặng 1 trong 7 chặng')
    expect(trangThaiChuaNop(np, { soCauCuaEm: 46, soChang: 7, loDaXong: 1 })).toMatchObject({ muc: 'do', chu: 'Dở chặng 2 trong 7 chặng · đã xong 1 chặng' })
    expect(trangThaiChuaNop(np, { soCauCuaEm: 46, soChang: 7, loDaXong: 5 }).muc).toBe('gan_xong')
    expect(trangThaiChuaNop(np, { soCauCuaEm: 46, soChang: 0, loDaXong: 0 }).chu).toBe('Đã mở bài · chưa nộp')
  })

  it('baiViecGap: bỏ em đã nộp / đã thu hồi; xếp bài chưa quá hạn (hạn gần nhất trước) rồi bài quá hạn; trong bài chưa mở → dở ít → dở nhiều; bỏ bài quá hạn > 14 ngày; đếm em một lần', () => {
    const np = (o: Record<string, unknown>) => em({ soCauCuaEm: 46, soChang: 7, ...o })
    const ds = [
      bai({ maBtvn: 'GAN', hanNop: HAN_NAY, caNhan: true }, [np({ sbd: '1', hoTen: 'Lê Hoàng Nam', loDaXong: 1 }), np({ sbd: '2', hoTen: 'Nguyễn Minh Khôi', soCauCuaEm: null }), np({ sbd: '3', hoTen: 'Phạm Gia Bảo', loDaXong: 4 }), np({ sbd: '4', hoTen: 'Đã Nộp', nopLuc: '2026-09-21T01:00:00Z' }), np({ sbd: '5', hoTen: 'Thu Hồi', thuHoi: true })]),
      bai({ maBtvn: 'QUA', maDe: 'DB-12-B6-D3', hanNop: HAN_QUA, quaHan: true, giaoLuc: '2026-09-17T02:00:00Z' }, [em({ sbd: '1', hoTen: 'Lê Hoàng Nam' }), em({ sbd: '6', hoTen: 'Vũ Đức An' })]),
      bai({ maBtvn: 'XA', hanNop: '2026-08-01T16:59:00Z', quaHan: true, giaoLuc: '2026-07-20T02:00:00Z' }, [em({ sbd: '9', hoTen: 'Cũ Quá' })]),
      bai({ maBtvn: 'XONG', hanNop: '2026-09-25T16:59:00Z', giaoLuc: '2026-09-19T02:00:00Z' }, [em({ sbd: '7', hoTen: 'Nộp Hết', nopLuc: '2026-09-21T02:00:00Z' })]),
    ]
    const kq = baiViecGap(ds, NAY, (s) => (s === '3' ? '12A2' : '12A1'))
    expect(kq.map((b) => b.ma)).toEqual(['GAN', 'QUA'])
    expect(kq[0].chuaNop.map((e) => e.hoTen)).toEqual(['Nguyễn Minh Khôi', 'Lê Hoàng Nam', 'Phạm Gia Bảo']) // chưa mở → dở 1/7 → dở 4/7
    expect(kq[0].chuaNop[2].lop).toBe('12A2')
    expect(kq[0].quaHan).toBe(false)
    expect(kq[1].quaHan).toBe(true)
    expect(tongChuaNop(kq)).toEqual({ soEm: 4, soBai: 2 }) // Nam có ở hai bài nhưng chỉ đếm một lần
  })

  it('lời cảnh báo mặc định: tế nhị, có tên bài + hạn nộp đúng định dạng, không doạ, không so với bạn, không nhãn năng lực', () => {
    const l = loiCanhBaoMacDinh('Dạng bài / Lớp 12 / Bài 6', HAN_NAY)
    expect(l).toContain('hạn nộp 23:59 · Thứ Hai 21/09/2026')
    expect(l).toContain('Dạng bài / Lớp 12 / Bài 6')
    expect(l).not.toMatch(/bạn khác|các bạn|yếu|kém|lười|nắm chắc|bị trừ|phạt/i)
  })
})

describe('OTraCuu — ô tra cứu lớn', () => {
  const DS = [
    { sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1' },
    { sbd: '11111022', hoTen: 'Trần Thu Hải', lop: '11B1' },
    { sbd: '12121002', hoTen: 'Phạm Gia Bảo', lop: '12A1' },
  ]
  const dung = (ds = DS) => {
    const onMoEm = vi.fn()
    const onMoCa = vi.fn()
    render(<OTraCuu ds={ds} onMoEm={onMoEm} onMoCa={onMoCa} />)
    return { onMoEm, onMoCa, o: screen.getByRole('combobox') as HTMLInputElement }
  }

  it('gõ KHÔNG DẤU ⇒ gợi ý ngay; ↑↓ chọn; Enter mở TOÀN CẢNH em đang chọn; ô sạch sau khi mở', () => {
    const { onMoEm, o } = dung()
    fireEvent.focus(o)
    fireEvent.change(o, { target: { value: 'tran thu' } })
    const ds = within(screen.getByRole('listbox'))
    expect(ds.getAllByRole('option').map((x) => x.textContent)).toEqual(['HTrần Thu Hà12A1 · SBD 12121007', 'HTrần Thu Hải11B1 · SBD 11111022'])
    fireEvent.keyDown(o, { key: 'ArrowDown' })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoEm).toHaveBeenCalledWith('11111022')
    expect(o.value).toBe('')
  })

  it('bấm vào gợi ý mở em; Esc đóng + xoá; 6 số ⇒ "Mở ca kiểm tra mã …"; không có ⇒ nói thật ngay trong ô; danh sách lớp trống ⇒ hướng dẫn nạp', () => {
    const { onMoEm, onMoCa, o } = dung()
    fireEvent.change(o, { target: { value: '12121002' } })
    fireEvent.mouseDown(screen.getAllByRole('option')[0])
    expect(onMoEm).toHaveBeenCalledWith('12121002')
    fireEvent.change(o, { target: { value: 'ba' } })
    fireEvent.keyDown(o, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(o.value).toBe('')
    fireEvent.change(o, { target: { value: '123456' } })
    expect(screen.getByRole('option', { name: /Mở ca kiểm tra mã 123456/ })).toBeTruthy()
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(onMoCa).toHaveBeenCalledWith('123456')
    fireEvent.change(o, { target: { value: 'không ai' } })
    expect(screen.getByText('Không tìm thấy “không ai” trong danh sách lớp trên máy này.')).toBeTruthy()
    cleanup()
    dung([])
    expect(screen.getByText(/Chưa có danh sách lớp trên máy này/)).toBeTruthy()
  })
})

describe('ViecGap — ô VIỆC GẤP (chưa nộp bài tập về nhà)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NAY)
    useAppStore.setState({ classList: [{ sbd: '1', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', sdt: '', namSinh: '', raw: {} }, { sbd: '2', hoTen: 'Lê Hoàng Nam', lop: '12A1', sdt: '', namSinh: '', raw: {} }, { sbd: '3', hoTen: 'Vũ Đức An', lop: '12A1', sdt: '', namSinh: '', raw: {} }] as never, toast: null } as never)
  })
  const ds = () => [
    bai(
      { maBtvn: 'B1', caNhan: true, tong: 6, daNop: 3 },
      [em({ sbd: '1', hoTen: 'Nguyễn Minh Khôi', soCauCuaEm: null }), em({ sbd: '2', hoTen: 'Lê Hoàng Nam', soCauCuaEm: 46, soChang: 7, loDaXong: 1 }), em({ sbd: '3', hoTen: 'Vũ Đức An', soCauCuaEm: 46, soChang: 7, loDaXong: 5 }), em({ sbd: '4', hoTen: 'X', nopLuc: '2026-09-21T01:00:00Z' }), em({ sbd: '5', hoTen: 'Y', nopLuc: '2026-09-21T01:00:00Z' }), em({ sbd: '6', hoTen: 'Z', nopLuc: '2026-09-21T01:00:00Z' })],
    ),
  ]
  const chay = async (theoDoi: () => Tra, canhBao?: (b: Record<string, unknown>) => Tra) => {
    dungMayChu({ '/btvn/theo-doi': theoDoi, ...(canhBao ? { '/gv/canh-bao-nop-bai': canhBao } : {}) })
    const { container } = render(<ViecGap />)
    await waitFor(() => expect(container.querySelector('[data-khoi="viec-gap"] .hn2-so-to')!.textContent).not.toBe('…'))
    return container
  }

  it('CÓ DỮ LIỆU: "3 em" chưa nộp · hạn nộp "HH:mm · Thứ … dd/mm/yyyy (còn …)" · đã nộp 3/6 · thanh tiến độ · mỗi em MỘT trạng thái thật + nút nhỏ "Nhắc ngay" · KHÔNG còn nút đỏ lớn (thầy lệnh 21/09: máy chủ tự nhắc)', async () => {
    const c = await chay(() => ({ json: { ok: true, ds: ds() } }))
    expect(c.querySelector('.hn2-so-to')!.textContent).toBe('3 em')
    expect(c.textContent).toContain('chưa nộp · 1 bài đang chạy')
    expect(c.textContent).toContain('Hạn nộp 23:59 · Thứ Hai 21/09/2026 (còn 3 giờ 28 phút)')
    expect(c.querySelector('.hn2-bai-so')!.textContent).toBe('3/6 đã nộp')
    expect((c.querySelector('.hn2-thanh i') as HTMLElement).style.width).toBe('50%')
    const dong = [...c.querySelectorAll('.hn2-em')].map((d) => d.querySelector('.hn2-em-tt')!.textContent)
    expect(dong).toEqual(['Chưa mở bài', 'Dở chặng 2 trong 7 chặng · đã xong 1 chặng', 'Dở chặng 6 trong 7 chặng · đã xong 5 chặng'])
    expect(screen.getAllByRole('button', { name: /^Nhắc ngay cho / })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Nhắc ngay cả 3' })).toBeTruthy() // liên kết nhỏ ở chân bài
    expect(c.querySelector('.hn2-nut--canh-dam')).toBeNull() // bỏ nút đỏ lớn
    expect(c.textContent).not.toMatch(/Gửi cảnh báo|Chỉ thầy bấm mới gửi/)
    expect(c.textContent).not.toMatch(/nắm chắc|lười|yếu kém/i)
  })

  it('TRỐNG / LỖI / ĐANG TẢI: không có em chưa nộp ⇒ nói rõ + việc tiếp; máy chủ chưa có lệnh ⇒ lời thật + Thử lại (KHÔNG nói "không có ai chưa nộp")', async () => {
    dungMayChu({ '/btvn/theo-doi': () => ({ json: { ok: true, ds: [] } }) })
    const { container } = render(<ViecGap />)
    expect(container.querySelector('.hn2-so-to')!.textContent).toBe('…') // đang tải
    await screen.findByText(/Hôm nay chưa có em nào chưa nộp bài đang chạy/)
    cleanup()
    dungMayChu({})
    render(<ViecGap />)
    expect(await screen.findByText('Máy chủ chưa có lệnh theo dõi bài tập về nhà.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(document.body.textContent).not.toContain('Hôm nay chưa có em nào chưa nộp')
    expect(document.body.textContent).toContain('—') // số to là "—", không bịa 0
  })

  it('NHẮC NGAY một em: hộp hỏi với lời mặc định (sửa được); "Không nhắc" ⇒ không gọi máy chủ; máy chủ chưa có lệnh ⇒ lời thật, KHÔNG "đã nhắc"', async () => {
    await chay(() => ({ json: { ok: true, ds: ds() } })) // chưa có /gv/canh-bao-nop-bai ⇒ 404
    fireEvent.click(screen.getByRole('button', { name: 'Nhắc ngay cho Nguyễn Minh Khôi' }))
    const hop = screen.getByRole('dialog', { name: 'Nhắc ngay em chưa nộp bài tập về nhà' })
    const o = within(hop).getByLabelText('Lời nhắn (thầy sửa được)') as HTMLTextAreaElement
    expect(o.value).toContain('Thầy nhắc: em chưa nộp bài tập về nhà')
    expect(o.value).toContain('hạn nộp 23:59 · Thứ Hai 21/09/2026')
    expect(within(hop).getByText('Nhắc ngay Nguyễn Minh Khôi?')).toBeTruthy()
    fireEvent.click(within(hop).getByRole('button', { name: 'Không nhắc' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(goi.mock.calls.some((x) => x[0] === '/gv/canh-bao-nop-bai')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Nhắc ngay cho Nguyễn Minh Khôi' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Nhắc ngay 1 em' }))
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toBe('Máy chủ chưa có lệnh Nhắc ngay — chưa nhắc gì cho em và phụ huynh.')
    expect(document.body.textContent).not.toMatch(/Đã nhắc/)
    expect(useAppStore.getState().toast).toBeNull()
  })

  it('NHẮC NGAY THÀNH CÔNG: gọi /gv/canh-bao-nop-bai {maBtvn, dsSbd, loiNhan(đã sửa)}; báo số em máy chủ nói; dòng đổi thành "Đã nhắc HH:mm"; nút biến thành chip "Đã nhắc"', async () => {
    const c = await chay(
      () => ({ json: { ok: true, ds: ds() } }),
      () => ({ json: { ok: true, daGui: 1, boQua: [], luc: '2026-09-21T13:15:00Z' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nhắc ngay cho Lê Hoàng Nam' }))
    const hop = screen.getByRole('dialog')
    fireEvent.change(within(hop).getByLabelText('Lời nhắn (thầy sửa được)'), { target: { value: 'Em ơi, tối nay nộp giúp thầy nhé.' } })
    fireEvent.click(within(hop).getByRole('button', { name: 'Nhắc ngay 1 em' }))
    await within(hop).findByText(/Đã nhắc 1 em/)
    const lan = goi.mock.calls.find((x) => x[0] === '/gv/canh-bao-nop-bai')!
    expect(lan[1]).toEqual({ maBtvn: 'B1', dsSbd: ['2'], loiNhan: 'Em ơi, tối nay nộp giúp thầy nhé.' })
    expect((lan[2] as Record<string, string>)['x-ma-bi-mat']).toBe('mat-thu')
    fireEvent.click(within(hop).getByRole('button', { name: 'Đóng' }))
    const dong = c.querySelector('[data-sbd="2"]')!
    expect(dong.textContent).toContain('Đã nhắc 20:15') // giờ máy chủ trả (13:15Z = 20:15 VN)
    expect(within(dong as HTMLElement).queryByRole('button', { name: /Nhắc ngay cho/ })).toBeNull()
    expect(useAppStore.getState().toast?.text).toBe('Đã nhắc 1 em.')
  })

  it('NHẮC NGAY CẢ 3 EM: một lệnh cho mỗi dòng bài; em bị bỏ qua (trần 1 lần/ngày) hiện lý do máy chủ và KHÔNG bị đánh dấu "đã nhắc"; quá hạn chờ ⇒ "CHƯA CHẮC"', async () => {
    const c = await chay(
      () => ({ json: { ok: true, ds: ds() } }),
      (b) => ({ json: { ok: true, daGui: (b.dsSbd as string[]).length - 1, boQua: [{ sbd: '1', lyDo: 'đã cảnh báo hôm nay' }], luc: '' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nhắc ngay cả 3' }))
    const hop = screen.getByRole('dialog')
    fireEvent.click(within(hop).getByRole('button', { name: 'Nhắc ngay 3 em' }))
    await within(hop).findByText(/Bỏ qua 1 em: 1: đã cảnh báo hôm nay/)
    expect(goi.mock.calls.filter((x) => x[0] === '/gv/canh-bao-nop-bai')).toHaveLength(1)
    fireEvent.click(within(hop).getByRole('button', { name: 'Đóng' }))
    expect(c.querySelector('[data-sbd="1"]')!.textContent).not.toContain('Đã nhắc')
    expect(c.querySelector('[data-sbd="2"]')!.textContent).toContain('Đã nhắc')
    cleanup()
    await chay(
      () => ({ json: { ok: true, ds: ds() } }),
      () => ({ cham: true }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nhắc ngay cho Vũ Đức An' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Nhắc ngay 1 em' }))
    expect((await screen.findByRole('alert')).textContent).toContain('CHƯA CHẮC đã nhắc')
  })
})

describe('ViecGap — bản B: khung cuộn + trạng thái TỰ ĐỘNG NHẮC', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NAY)
    useAppStore.setState({ classList: [], toast: null } as never)
  })
  const ds = () => [
    bai({ maBtvn: 'B1', caNhan: true, tong: 3, daNop: 0 }, [em({ sbd: '1', hoTen: 'Nguyễn Minh Khôi', soCauCuaEm: null }), em({ sbd: '2', hoTen: 'Lê Hoàng Nam', soCauCuaEm: 46, soChang: 7, loDaXong: 1 }), em({ sbd: '3', hoTen: 'Vũ Đức An', soCauCuaEm: 46, soChang: 7, loDaXong: 5 })]),
  ]
  const CHUA_NOP = {
    ok: true,
    tuDong: { bat: true, lanKe: '2026-09-21T14:00:00Z' },
    homNay: { soEm: 12, soPhuHuynh: 5 },
    bai: [{ maBtvn: 'B1', em: [
      { sbd: '1', daNhac: [{ moc: 'M2', luc: '2026-09-21T13:00:00Z', emDaXem: true, phDaXem: false }] },
      { sbd: '2', nhacKe: { moc: 'M3', luc: '2026-09-21T14:00:00Z' } },
    ] }],
  }
  const chay = async (tuDong?: () => Tra) => {
    dungMayChu({ '/btvn/theo-doi': () => ({ json: { ok: true, ds: ds() } }), ...(tuDong ? { '/gv/chua-nop': tuDong } : {}) })
    const r = render(<ViecGap />)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="viec-gap"] .hn2-so-to')!.textContent).toBe('3 em'))
    return r.container
  }

  it('CÓ TRẠNG THÁI: "Tự động nhắc: ĐANG BẬT · lượt kế 21:00" + "Hôm nay đã tự nhắc 12 em · 5 phụ huynh"; mỗi em một dải ("Đã tự nhắc 20:00 · em đã xem · phụ huynh chưa xem" / "Sẽ nhắc 21:00"); em không có gì ⇒ không dải', async () => {
    const c = await chay(() => ({ json: CHUA_NOP }))
    const dong = await waitFor(() => {
      const el = c.querySelector('[data-khoi="tu-dong"]')
      expect(el).toBeTruthy()
      return el as HTMLElement
    })
    expect(dong.textContent).toBe('Tự động nhắc: ĐANG BẬT · lượt kế 21:00 · Hôm nay đã tự nhắc 12 em · 5 phụ huynh')
    expect(c.querySelector('[data-sbd="1"] .hn2-em-dai')!.textContent).toBe('Đã tự nhắc 20:00 · em đã xem · phụ huynh chưa xem')
    expect(c.querySelector('[data-sbd="2"] .hn2-em-dai')!.textContent).toBe('Sẽ nhắc 21:00')
    expect(c.querySelector('[data-sbd="3"] .hn2-em-dai')).toBeNull()
    // nút tay chỉ là "Nhắc ngay" nhỏ; không còn nút đỏ lớn / chữ "Chỉ thầy bấm mới gửi"
    expect(c.querySelector('.hn2-nut--canh-dam')).toBeNull()
    expect(c.textContent).not.toMatch(/Gửi cảnh báo|Chỉ thầy bấm mới gửi/)
  })

  it('MÁY CHỦ CHƯA CÓ TRẠNG THÁI (404): nói thật "Máy chủ chưa báo trạng thái tự động nhắc." — danh sách em vẫn hiện, không dải, không nói "đang bật"', async () => {
    const c = await chay()
    const dong = await waitFor(() => {
      const el = c.querySelector('[data-khoi="tu-dong"]')
      expect(el).toBeTruthy()
      return el as HTMLElement
    })
    expect(dong.textContent).toBe('Máy chủ chưa báo trạng thái tự động nhắc.')
    expect(c.textContent).not.toContain('ĐANG BẬT')
    expect(c.querySelectorAll('.hn2-em')).toHaveLength(3)
    expect(c.querySelector('.hn2-em-dai')).toBeNull()
  })

  it('CỜ TẮT: "ĐANG TẮT" (không giả bật); thiếu số hôm nay ⇒ đếm trong danh sách và ghi rõ', async () => {
    const c = await chay(() => ({ json: { ...CHUA_NOP, tuDong: { bat: false }, homNay: undefined } }))
    const dong = await waitFor(() => {
      const el = c.querySelector('[data-khoi="tu-dong"]')
      expect(el).toBeTruthy()
      return el as HTMLElement
    })
    expect(dong.textContent).toContain('Tự động nhắc: ĐANG TẮT')
    expect(dong.textContent).toContain('Hôm nay đã tự nhắc 1 em · 1 phụ huynh (trong danh sách này)')
  })

  it('KHUNG CUỘN: đầu ô (tiêu đề một dòng + số + trạng thái) NẰM NGOÀI khung cuộn; thân là region có tên, focus được; chân ô "Xem tất cả" ⇒ màn Bài tập về nhà; tên em bấm ⇒ Toàn cảnh, cắt "…" có title', async () => {
    const c = await chay(() => ({ json: CHUA_NOP }))
    const khung = c.querySelector('.hn2-khung-than') as HTMLElement
    expect(khung.getAttribute('role')).toBe('region')
    expect(khung.getAttribute('aria-label')).toBe('Danh sách em chưa nộp bài tập về nhà')
    expect(khung.getAttribute('tabindex')).toBe('0')
    const dau = c.querySelector('.hn2-khung-dau') as HTMLElement
    expect(dau.contains(khung)).toBe(false)
    expect(dau.querySelector('h2')!.className).toContain('hn2-tieu-de--1dong')
    expect(dau.querySelector('h2')!.textContent).toBe('Việc gấp · chưa nộp bài tập về nhà')
    expect(khung.querySelector('.hn2-tieu-de')).toBeNull()
    expect(c.querySelector('[data-sbd="1"] .hn2-em-ten')!.getAttribute('title')).toBe('Nguyễn Minh Khôi')
    fireEvent.click(screen.getByRole('button', { name: /Nguyễn Minh Khôi.*mở toàn cảnh/ }))
    expect([useAppStore.getState().screen, useAppStore.getState().sbdToanCanh]).toEqual(['toancanh', '1'])
    useAppStore.setState({ screen: 'examhub' } as never)
    fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả' }))
    expect(useAppStore.getState().screen).toBe('giaobtvn')
  })
})

describe('TỰ ĐỘNG NHẮC (thầy lệnh 21/09: máy chủ tự gửi, thầy chỉ xem) — phần THUẦN', () => {
  const CHUA_NOP = {
    ok: true,
    tuDong: { bat: true, gioTu: '07:00', gioDen: '21:30', lanKe: '2026-09-21T14:00:00Z' }, // 21:00 giờ VN
    homNay: { soEm: 12, soPhuHuynh: 5 },
    bai: [{ maBtvn: 'B1', em: [
      { sbd: '1', daNhac: [{ moc: 'M2', luc: '2026-09-21T13:00:00Z', emDaXem: true, phDaXem: false }, { moc: 'M1', luc: '2026-09-21T02:00:00Z', emDaXem: true, phDaXem: null }] }, // máy chủ trả LỘN THỨ TỰ: app tự xếp theo giờ
      { sbd: '2', nhacKe: { moc: 'M3', luc: '2026-09-21T14:00:00Z' } },
      { sbd: '3', daNhac: [{ moc: 'M1', luc: '2026-09-21T02:00:00Z', emDaXem: false, phDaXem: null }] },
    ] }],
  }
  it('docTuDongNhac: cờ, giờ kế, số hôm nay, dải từng em theo (maBtvn, sbd); trường thiếu/sai kiểu ⇒ null/rỗng (không bịa)', () => {
    const t = docTuDongNhac(CHUA_NOP)
    expect(t.bat).toBe(true)
    expect(t.homNay).toEqual({ soEm: 12, soPhuHuynh: 5 })
    expect(Object.keys(t.theoEm)).toEqual(['B1|1', 'B1|2', 'B1|3'])
    expect(t.theoEm['B1|1'].daNhac.map((d) => d.moc)).toEqual(['M1', 'M2']) // xếp theo giờ
    expect(t.theoEm['B1|1'].daNhac[0].phDaXem).toBeNull() // mốc không gửi phụ huynh
    const rong = docTuDongNhac({ ok: true, tuDong: { bat: 'bật' }, homNay: { soEm: 'nhiều' }, bai: [{ em: [{ sbd: '1' }] }, { maBtvn: 'X', em: [{}] }] })
    expect(rong).toEqual({ bat: null, lanKe: '', homNay: null, theoEm: {} })
  })

  it('daiNhacCuaEm: "Đã tự nhắc HH:mm · em đã/chưa xem · phụ huynh đã/chưa xem" (mốc mới nhất; mốc không gửi phụ huynh ⇒ bỏ đoạn phụ huynh) · "Sẽ nhắc HH:mm" (chưa qua) · không có gì ⇒ null', () => {
    const t = docTuDongNhac(CHUA_NOP)
    expect(daiNhacCuaEm(t.theoEm['B1|1'], NAY)).toEqual({ chu: 'Đã tự nhắc 20:00 · em đã xem · phụ huynh chưa xem', vai: 'da' })
    expect(daiNhacCuaEm(t.theoEm['B1|3'], NAY)).toEqual({ chu: 'Đã tự nhắc 09:00 · em chưa xem', vai: 'da' })
    expect(daiNhacCuaEm(t.theoEm['B1|2'], NAY)).toEqual({ chu: 'Sẽ nhắc 21:00', vai: 'ke' })
    expect(daiNhacCuaEm(t.theoEm['B1|2'], NAY + 3 * 3600000)).toBeNull() // mốc kế đã qua ⇒ không nói "sẽ nhắc" nữa
    expect(daiNhacCuaEm(undefined, NAY)).toBeNull()
  })

  it('chuTuDongNhac / lanKeTuDong / demTuNhacHomNay: ĐANG BẬT + lượt kế · ĐANG TẮT · chưa báo cờ; lượt kế lấy nhacKe sớm nhất khi máy chủ không trả lanKe; đếm hôm nay ưu tiên số máy chủ, thiếu thì đếm trong danh sách và nói rõ', () => {
    const t = docTuDongNhac(CHUA_NOP)
    expect(chuTuDongNhac(t, NAY)).toBe('Tự động nhắc: ĐANG BẬT · lượt kế 21:00')
    expect(chuTuDongNhac({ ...t, bat: false }, NAY)).toBe('Tự động nhắc: ĐANG TẮT')
    expect(chuTuDongNhac({ ...t, bat: null }, NAY)).toBe('Tự động nhắc: máy chủ chưa báo đang bật hay tắt')
    expect(chuTuDongNhac({ ...t, lanKe: '' }, NAY)).toBe('Tự động nhắc: ĐANG BẬT · lượt kế 21:00') // suy từ nhacKe
    expect(lanKeTuDong({ ...t, lanKe: '', theoEm: {} }, NAY)).toBe('')
    expect(chuTuDongNhac({ ...t, lanKe: '', theoEm: {} }, NAY)).toBe('Tự động nhắc: ĐANG BẬT') // không có mốc kế ⇒ không bịa giờ
    expect(demTuNhacHomNay(t, NAY)).toEqual({ soEm: 12, soPhuHuynh: 5, tuDanhSach: false })
    expect(demTuNhacHomNay({ ...t, homNay: null }, NAY)).toEqual({ soEm: 2, soPhuHuynh: 1, tuDanhSach: true }) // em 1 và 3 có nhắc hôm nay; chỉ em 1 có phụ huynh
    expect(demTuNhacHomNay({ ...t, homNay: null, theoEm: {} }, NAY)).toBeNull()
  })

  it('layTuDongNhac: POST /gv/chua-nop; 404 ⇒ lời thật', async () => {
    dungMayChu({ '/gv/chua-nop': () => ({ json: CHUA_NOP }) })
    const a = await layTuDongNhac()
    expect(a.ok && a.du.bat).toBe(true)
    expect(goi.mock.calls.at(-1)![0]).toBe('/gv/chua-nop')
    dungMayChu({})
    expect(await layTuDongNhac()).toMatchObject({ ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa báo trạng thái tự động nhắc.' })
  })
})

describe('lớp nối máy chủ', () => {
  it('layBtvnDangChay: POST /btvn/theo-doi kèm mã bí mật; 404 ⇒ lời thật (không trả [] giả)', async () => {
    dungMayChu({ '/btvn/theo-doi': () => ({ json: { ok: true, ds: [{ maBtvn: 'B1' }] } }) })
    const r = await layBtvnDangChay()
    expect(r).toEqual({ ok: true, du: [{ maBtvn: 'B1' }] })
    expect(goi.mock.calls[0][0]).toBe('/btvn/theo-doi')
    expect((goi.mock.calls[0][2] as Record<string, string>)['x-ma-bi-mat']).toBe('mat-thu')
    dungMayChu({})
    const l = await layBtvnDangChay()
    expect(l.ok).toBe(false)
  })
})
