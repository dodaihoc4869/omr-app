// @vitest-environment jsdom
// TẠM ĐÓNG APP HỌC SINH (thầy 27/10 tối: «Tắt app, để tối ưu xong rồi mở lại cho tôi»):
//  - máy chủ: khoá `cau_hinh.hs_tam_dong` = 'bat' ⇒ đang đóng; vắng / lạ ⇒ mở. Đọc CÙNG câu công tắc thưởng (không thêm câu / vòng chờ);
//  - /hs/thuong trả `tamDong` ⇒ Lộ trình phủ «App đang bảo trì» (chữ thầy chốt), tự đọc lại mỗi 60 giây;
//  - Lộ trình bị che bởi tấm kiểm tra / ca thi (cổng đặt `inert`) ⇒ KHÔNG phủ: em làm dở vẫn nộp được.
import { readFileSync } from 'node:fs'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import { KHOA_TAM_DONG_HS, tamDongTuDong, congTacTuDong } from '../server/src/thuong-luat'
import { docTongQuan } from '../src/lib/thuong-api'
import { PhuTamDong, TAM_DONG_KIEM_MS } from '../src/components/hoc-tap/TrongHs'
import { KHOA_CONG_TAC } from '../src/lib/thi-dua-tuan-api'

afterEach(() => { cleanup(); vi.useRealTimers() })

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
  it('/hs/thuong đọc khoá trong CÙNG câu công tắc (không thêm câu) và trả tamDong', () => {
    const src = readFileSync('server/src/thuong-d1.ts', 'utf8')
    expect(src).toMatch(/const KHOA_DOC = \[\.\.\.KHOA_CONG_TAC, KHOA_TAM_DONG_HS\]/)
    expect(src).toMatch(/tamDong: tamDongTuDong\(dongCt\)/)
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
