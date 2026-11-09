// «CHƯA CHẮC» + LƯỢT ĐÚNG THEO LOẠI LỖI — khối B lát 5 (thầy 09/11 «làm luôn để đẩy lên hết lúc 23h40»; bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-5, đặc tả mục 2).
// Khoá: chip «Chưa chắc» chỉ trên câu sửa trước khi chấm; bật ⇒ lệnh nộp câu ấy mang tuTin 'chua_chac' (dùng một lần); máy chủ: câu sửa làm đúng + chưa chắc ⇒ dấu
// cc:<qid>, đúng + chắc ⇒ xoá dấu; ngày Sửa sau xếp lại câu có dấu và câu «Hiểu nhầm» đã đóng lỗi mà chưa đủ 3 ngày đúng; dấu không thành loại nhóm.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { ChipChuaChac } from '../src/components/hoc-tap/ChipChuaChac'
import { thanLyDoSai, daGuiLyDoSai } from '../src/components/hoc-tap/vi-sao-sai'
import { themSua7, nhomSua7 } from '../server/src/goi-bai-7-nhom-sua'
import { docCotLyDo } from '../server/src/ly-do-sai'

afterEach(() => { cleanup(); daGuiLyDoSai(thanLyDoSai()); localStorage.clear() })

describe('chip Chưa chắc (máy em)', () => {
  it('mặc định Chắc; chạm ⇒ bật, lệnh nộp câu ấy mang tuTin một lần; câu khác không mang', () => {
    const { getByRole } = render(<ChipChuaChac qid="s1" />)
    const nut = getByRole('button', { name: 'Chưa chắc' })
    expect(nut.getAttribute('aria-pressed')).toBe('false')
    expect(thanLyDoSai('s1')).toEqual({})
    act(() => { fireEvent.click(nut) })
    expect(nut.getAttribute('aria-pressed')).toBe('true')
    expect(thanLyDoSai('khac')).toEqual({})
    expect(thanLyDoSai('s1')).toEqual({ tuTin: 'chua_chac' })
    expect(thanLyDoSai('s1')).toEqual({})
  })
  it('màn làm bài: chip chỉ trên câu sửa chưa chấm; thân lệnh nộp đọc theo câu', () => {
    const src = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')
    expect(src).toContain("{q.vaiGoi7 === 'sua' && !k && <ChipChuaChac qid={q.qid} />}")
    expect(src).toContain('const ly = thanLyDoSai(q.qid), than =')
  })
})

describe('máy chủ: dấu Chưa chắc + lượt đúng theo loại', () => {
  it('đọc cột lý do giữ dấu cc:<qid>, bỏ dấu sai dạng', () => {
    expect([...docCotLyDo('[["q1","nham"],["cc:q2","cc"],["q3","cc"]]')]).toEqual([['q1', 'nham'], ['cc:q2', 'cc']])
  })
  it('ngày Sửa thêm vào cuối hàng: câu có dấu Chưa chắc; câu Hiểu nhầm đã đóng lỗi mà chưa đủ 3 ngày đúng; không thêm câu đã làm hôm nay / đủ 3 ngày / chưa từng sai', () => {
    const cau = ['a', 'b', 'c', 'd', 'e', 'f'].map(qid => ({ qid }))
    const loiV2 = new Map([
      ['b', { soLanSai: 1, saiCuoi: '2026-11-01', trangThai: 'dong', ngayDung: ['2026-11-03', '2026-11-05'] }],
      ['c', { soLanSai: 1, saiCuoi: '2026-11-01', trangThai: 'dong', ngayDung: ['2026-11-02', '2026-11-04', '2026-11-06'] }],
      ['d', { soLanSai: 2, saiCuoi: '2026-11-07', trangThai: 'mo', ngayDung: ['2026-11-08'] }],
      ['e', { soLanSai: 1, saiCuoi: '2026-11-01', trangThai: 'dong', ngayDung: ['2026-11-03', '2026-11-10'] }],
    ])
    const lyDo = new Map<string, 'nham' | 'cc'>([['b', 'nham'], ['c', 'nham'], ['cc:d', 'cc'], ['e', 'nham'], ['cc:f', 'cc']])
    expect(themSua7(['a'], { cau, loiV2 }, lyDo, '2026-11-10')).toEqual(['a', 'b', 'd'])
    expect(themSua7(['a'], { cau, loiV2 }, new Map(), '2026-11-10')).toEqual(['a'])
  })
  it('dấu Chưa chắc không thành loại nhóm', () => {
    const meta = new Map([['d', { dang: 'D1', tenDang: 'Dạng 1' }]])
    expect(nhomSua7([{ qid: 'd', vai: 'sua' }], { meta }, new Map([['cc:d', 'cc'], ['d', 'cc']]))).toEqual([{ ten: 'Dạng 1', so: 1, xong: 0 }])
  })
})
