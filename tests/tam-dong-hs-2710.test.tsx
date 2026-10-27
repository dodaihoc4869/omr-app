// @vitest-environment jsdom
// TẠM ĐÓNG APP HỌC SINH (thầy 27/10 tối: «Tắt app, để tối ưu xong rồi mở lại cho tôi»):
//  - máy chủ: khoá `cau_hinh.hs_tam_dong` = 'bat' ⇒ đang đóng; vắng / lạ ⇒ mở. Đọc CÙNG câu công tắc thưởng (không thêm câu / vòng chờ);
//  - /hs/thuong trả `tamDong` ⇒ Lộ trình phủ «App đang bảo trì» (chữ thầy chốt), tự đọc lại mỗi 60 giây;
//  - Lộ trình bị che bởi tấm kiểm tra / ca thi (cổng đặt `inert`) ⇒ KHÔNG phủ: em làm dở vẫn nộp được.
import { readFileSync } from 'node:fs'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import { KHOA_TAM_DONG_HS, dsChoPhepTamDong, tamDongChoEm, tamDongTuDong, congTacTuDong } from '../server/src/thuong-luat'
import { _quenTam, docTongQuan } from '../src/lib/thuong-api'
import GacTamDong, { PhuTamDong, TAM_DONG_KIEM_MS } from '../src/components/hoc-tap/TrongHs'
import { KHOA_CONG_TAC } from '../src/lib/thi-dua-tuan-api'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('máy chủ: khoá hs_tam_dong', () => {
  it("chỉ 'bat' là đang đóng; vắng dòng / lạ ⇒ mở", () => {
    expect(KHOA_TAM_DONG_HS).toBe('hs_tam_dong')
    expect(tamDongTuDong([])).toBe(false)
    expect(tamDongTuDong([{ khoa: 'hs_tam_dong', gia_tri: 'tat' }])).toBe(false)
    expect(tamDongTuDong([{ khoa: 'hs_tam_dong', gia_tri: 'xyz' }])).toBe(false)
    expect(tamDongTuDong([{ khoa: 'hs_tam_dong', gia_tri: 'bat' }])).toBe(true)
    expect(tamDongTuDong([{ khoa: 'hs_tam_dong', gia_tri: '"bat"' }])).toBe(true)
  })
  it('không làm lệch 4 công tắc thưởng (dòng hs_tam_dong cùng lô bị bỏ qua)', () => {
    expect(congTacTuDong([{ khoa: 'hs_tam_dong', gia_tri: 'bat' }])).toEqual({ thuong_giai_tuan: 'bat', thuong_thang_hoa: 'bat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' })
  })
  it('/hs/thuong đọc khoá + danh sách được vào trong CÙNG câu công tắc (không thêm câu) và trả tamDong theo SBD', () => {
    const src = readFileSync('server/src/thuong-d1.ts', 'utf8')
    expect(src).toMatch(/const KHOA_GHI = \[\.\.\.KHOA_CONG_TAC, KHOA_TAM_DONG_HS\]/)
    expect(src).toMatch(/const KHOA_DOC = \[\.\.\.KHOA_GHI, KHOA_TAM_DONG_CHO_PHEP\]/)
    expect(src).toMatch(/tamDong: tamDongChoEm\(dongCt, sbd\)/)
    // lệnh thầy không ghi được danh sách (chỉ workflow ghi) — chỉ nhận khoá bat / tat
    expect(src).toMatch(/!\(KHOA_GHI as readonly string\[\]\)\.includes\(khoa\)/)
  })
  it('danh sách được vào (thầy thử trước): có SBD ⇒ không đóng; không có ⇒ đóng; so khớp chính xác, bỏ khoảng trắng', () => {
    const bat = { khoa: 'hs_tam_dong', gia_tri: 'bat' }
    const ds = { khoa: 'hs_tam_dong_cho_phep', gia_tri: ' 12121212 , 99990001,,' }
    expect(dsChoPhepTamDong([ds])).toEqual(['12121212', '99990001'])
    expect(tamDongChoEm([bat, ds], '12121212')).toBe(false)
    expect(tamDongChoEm([bat, ds], ' 12121212 ')).toBe(false)
    expect(tamDongChoEm([bat, ds], '1212121')).toBe(true)
    expect(tamDongChoEm([bat, ds], '121212120')).toBe(true)
    expect(tamDongChoEm([bat], '12121212')).toBe(true)
    expect(tamDongChoEm([bat, { khoa: 'hs_tam_dong_cho_phep', gia_tri: '' }], '12121212')).toBe(true)
    expect(tamDongChoEm([{ khoa: 'hs_tam_dong', gia_tri: 'tat' }], 'x')).toBe(false)
  })
  it('app thầy có dòng công tắc tạm đóng', () => {
    expect(KHOA_CONG_TAC).toContain('hs_tam_dong')
    expect(readFileSync('src/screens/ThiDuaTuanScreen.tsx', 'utf8')).toMatch(/ten: 'Tạm đóng app học sinh'/)
  })
})

describe('app học sinh: đọc tamDong', () => {
  it('chỉ true mới đóng; máy chủ cũ (vắng) ⇒ mở', () => {
    expect(docTongQuan({ ok: true, bat: {}, thongBao: [], tamDong: true })?.tamDong).toBe(true)
    expect(docTongQuan({ ok: true, bat: {}, thongBao: [], tamDong: false })?.tamDong).toBeUndefined()
    expect(docTongQuan({ ok: true, bat: {}, thongBao: [] })?.tamDong).toBeUndefined()
  })
})

describe('màn phủ «App đang bảo trì»', () => {
  it('tamDong ⇒ phủ đúng chữ thầy chốt, không nút «Thử lại»; tự đọc lại mỗi 60 giây', () => {
    vi.useFakeTimers()
    const kiemLai = vi.fn()
    render(<PhuTamDong onKiemLai={kiemLai} />)
    expect(screen.getByRole('dialog', { name: 'App đang bảo trì.' })).toBeTruthy()
    expect(document.body.textContent).toContain('Tối nay các em không phải làm.')
    expect(document.body.textContent).toContain('Ngày mai vào làm bình thường.')
    expect(screen.queryByRole('button')).toBeNull()
    expect(TAM_DONG_KIEM_MS).toBe(60_000)
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(kiemLai).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(120_000) })
    expect(kiemLai).toHaveBeenCalledTimes(3)
  })
  it('đang làm kiểm tra / ca thi (Lộ trình bị `inert` dưới tấm) ⇒ KHÔNG phủ', () => {
    render(<div inert><PhuTamDong onKiemLai={() => {}} /></div>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('còn bài kiểm tra dở / ca đang mở ⇒ có nút vào nộp tiếp', () => {
    const kiem = vi.fn(), thi = vi.fn()
    render(<PhuTamDong onKiemLai={() => {}} kiemDo={kiem} caMo={thi} />)
    act(() => { screen.getByRole('button', { name: 'Làm tiếp Kiểm tra ôn tập' }).click() })
    act(() => { screen.getByRole('button', { name: 'Vào ca kiểm tra' }).click() })
    expect(kiem).toHaveBeenCalledTimes(1)
    expect(thi).toHaveBeenCalledTimes(1)
  })
})

describe('giao diện cũ (ddh.trong = tat) cũng đóng', () => {
  const mayChu = (tamDong: boolean) => vi.stubGlobal('fetch', vi.fn(async () =>
    new Response(JSON.stringify({ ok: true, bat: {}, thongBao: [], ...(tamDong ? { tamDong: true } : {}) }), { status: 200, headers: { 'content-type': 'application/json' } })))
  it('tamDong ⇒ ép «Trong» (gắn data-trong) + phủ; gỡ ⇒ trả giao diện cũ', async () => {
    _quenTam(); localStorage.clear(); delete document.documentElement.dataset.trong
    mayChu(true)
    const r = render(<GacTamDong p={{ token: 'tk-cu', coCa: false } as never} />)
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'App đang bảo trì.' })).toBeTruthy())
    expect(document.documentElement.dataset.trong).toBe('hs')
    r.unmount()
    expect(document.documentElement.dataset.trong).toBeUndefined()
  })
  it('không đóng (hoặc SBD được vào) ⇒ không phủ, không đổi giao diện', async () => {
    _quenTam(); localStorage.clear(); delete document.documentElement.dataset.trong
    mayChu(false)
    render(<GacTamDong p={{ token: 'tk-cu2', coCa: false } as never} />)
    await waitFor(() => expect((fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.documentElement.dataset.trong).toBeUndefined()
  })
  it('Hôm nay cũ gắn cổng tạm đóng', () => {
    expect(readFileSync('src/components/hoc-tap/HocTapHomNay.tsx', 'utf8')).toContain('if (!huaTrong) return <>{ve(false)}<Suspense><GacTamDong p={p} kiem={kiem} /></Suspense></>')
  })
})

