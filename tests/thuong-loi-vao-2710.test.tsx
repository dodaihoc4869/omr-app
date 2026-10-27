// @vitest-environment jsdom
// LỐI VÀO «HỌC CÙNG BẠN» + «THỬ THÁCH KIM CƯƠNG» (thầy 27/10: «làm không bỏ sót, tự làm theo đề xuất thông minh»):
//   · thẻ Lộ trình (TheBanLoTrinh): bạn chưa học ⇒ «<tên> chưa học hôm nay» + Gõ cửa (POST /hs/ban/go-cua, một lần) · bấm chữ ⇒ mở Học cùng bạn;
//     chưa có bạn ⇒ lời mời có nút đóng, đóng ⇒ ẩn tới hết ngày (localStorage); công tắc bạn bè tắt / chưa biết ⇒ không vẽ;
//   · Chuỗi ngày: khối «Lửa đôi» (tên bạn + số lửa đôi, không điểm / nguyên tử) bấm ⇒ mở Học cùng bạn; công tắc tắt ⇒ ẩn;
//   · ManThuong man="kim-cuong" không kèm chuyên đề ⇒ danh sách /hs/kim-cuong/ds; «Thử thách» ⇒ màn mời của đúng chuyên đề; công tắc tắt ⇒ ẩn.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import * as M from './_thuong-mau'
import { DUONG, _quenTam, ngayVn } from '../src/lib/thuong-api'
import { TheBanLoTrinh } from '../src/components/thuong/TheBanLoTrinh'
import ManThuong, { ManChuoiNgay } from '../src/components/thuong/ManThuong'

const TK = 'tk-em'
let mayChu: Record<string, unknown> = {}
const daGoi: { duong: string; than: Record<string, unknown> }[] = []
beforeEach(() => {
  daGoi.length = 0
  _quenTam()
  try { localStorage.clear() } catch { /* bỏ qua */ }
  mayChu = { [DUONG.tongQuan]: M.tongQuanGia(), [DUONG.ban]: M.BAN_GIA, [DUONG.kimCuongDs]: M.DS_KC_GIA, [DUONG.kimCuong]: M.PHIEN_KC }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const duong = new URL(url).pathname
    daGoi.push({ duong, than: init?.body ? JSON.parse(String(init.body)) : {} })
    return new Response(JSON.stringify(mayChu[duong] ?? { ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('thẻ Học cùng bạn trên Lộ trình', () => {
  it('bạn chưa học ⇒ một thẻ gọn + Gõ cửa (một lần, đúng mã bạn); bấm chữ ⇒ mở Học cùng bạn', async () => {
    const onMo = vi.fn()
    render(<TheBanLoTrinh token={TK} bat onMo={onMo} />)
    expect(await screen.findByText('Trần Gia Bảo chưa học hôm nay')).toBeTruthy()
    expect(screen.getByText('Lửa đôi 3 ngày')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Gõ cửa' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đã gõ cửa' }).hasAttribute('disabled')).toBe(true))
    expect(daGoi.filter((g) => g.duong === DUONG.goCua).map((g) => g.than.ma)).toEqual(['b2'])
    fireEvent.click(screen.getByRole('button', { name: 'Đã gõ cửa' }))
    expect(daGoi.filter((g) => g.duong === DUONG.goCua)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /Trần Gia Bảo chưa học hôm nay.*Mở Học cùng bạn/ }))
    expect(onMo).toHaveBeenCalledTimes(1)
    // chỉ tên + lửa đôi + đã học chưa — không điểm / nguyên tử / lớp của bạn
    expect(document.body.textContent).not.toMatch(/nguyên tử|điểm|12A2/)
  })

  it('cả hai chưa học ⇒ «… cũng chưa học hôm nay», KHÔNG nút Gõ cửa (luật màn Học cùng bạn: em xong bài rồi mới gõ)', async () => {
    mayChu[DUONG.ban] = { ...M.BAN_GIA, ban: [{ ...M.BAN_GIA.ban[1]!, homNay: 'ca_hai_chua' }] }
    render(<TheBanLoTrinh token={TK} bat onMo={() => {}} />)
    expect(await screen.findByText('Trần Gia Bảo cũng chưa học hôm nay')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Gõ cửa' })).toBeNull()
  })

  it('mọi bạn đã học ⇒ không thẻ; công tắc tắt / chưa biết ⇒ không thẻ', async () => {
    mayChu[DUONG.ban] = { ...M.BAN_GIA, ban: [M.BAN_GIA.ban[0]] }
    const { container, unmount } = render(<TheBanLoTrinh token={TK} bat onMo={() => {}} />)
    await waitFor(() => expect(daGoi.some((g) => g.duong === DUONG.ban)).toBe(true))
    expect(container.textContent).toBe('')
    unmount()
    mayChu[DUONG.ban] = M.BAN_GIA
    for (const bat of [false, undefined]) {
      const r = render(<TheBanLoTrinh token={TK} bat={bat} onMo={() => {}} />)
      await new Promise((x) => setTimeout(x, 20))
      expect(r.container.textContent).toBe('')
      r.unmount()
    }
  })

  it('chưa có bạn ⇒ lời mời nhẹ; đóng ⇒ ẩn tới hết ngày (nhớ ở máy), mở lại vẫn ẩn', async () => {
    mayChu[DUONG.ban] = { ...M.BAN_GIA, ban: [] }
    const r = render(<TheBanLoTrinh token={TK} bat onMo={() => {}} />)
    expect(await screen.findByText('Học cùng bạn để giữ lửa đôi')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng lời mời học cùng bạn' }))
    expect(r.container.textContent).toBe('')
    expect(localStorage.getItem('ddh.thuong.moi-ban-an')).toBe(ngayVn())
    r.unmount()
    const r2 = render(<TheBanLoTrinh token={TK} bat onMo={() => {}} />)
    await waitFor(() => expect(daGoi.filter((g) => g.duong === DUONG.ban).length).toBeGreaterThan(1))
    expect(r2.container.textContent).toBe('')
  })

  it('có lời mời đang chờ ⇒ «<tên> mời em học cùng» mở Học cùng bạn', async () => {
    mayChu[DUONG.ban] = { ...M.BAN_GIA, ban: [], loiMoi: [{ ma: 'm1', ten: 'Trần Thu Lan', lop: '12A1' }] }
    const onMo = vi.fn()
    render(<TheBanLoTrinh token={TK} bat onMo={onMo} />)
    fireEvent.click(await screen.findByRole('button', { name: /Trần Thu Lan mời em học cùng/ }))
    expect(onMo).toHaveBeenCalled()
  })
})

describe('tên bạn ĐỦ họ tên + ô chữ đầu + nhãn lớp (thầy 27/10 «Cho hiện đủ tên nhé, chuẩn tên nhé»)', () => {
  it('tên 4 chữ, có dấu, rất dài: hiện nguyên văn đúng thứ tự (không «Minh Đức L.»); ô chữ đầu = tên đệm + tên; lớp «11» ⇒ «Lớp 11»', async () => {
    const DAI = 'Tôn Nữ Hoàng Thị Phương Uyên Khánh Linh'
    mayChu[DUONG.ban] = { ...M.BAN_GIA, ban: [
      { ma: 'x1', ten: 'Nguyễn Thị Minh Khai', lop: '11', chuoiDoi: 2, homNay: 'ca_hai', daGoCua: false },
      { ma: 'x2', ten: '  Lê   Minh  Đức ', lop: '12A1', chuoiDoi: 5, homNay: 'ca_hai', daGoCua: false },
      { ma: 'x3', ten: DAI, lop: '12 - Lớp Thường', chuoiDoi: 1, homNay: 'ca_hai', daGoCua: false },
    ] }
    const { ManHocCungBan } = await import('../src/components/thuong/ManThuong')
    render(<ManHocCungBan token={TK} />)
    const the = (ma: string) => document.querySelector(`[data-ban="${ma}"]`)!
    await waitFor(() => expect(the('x1')).toBeTruthy())
    expect(the('x1').querySelector('.giua b')!.textContent).toBe('Nguyễn Thị Minh Khai')
    expect(the('x1').querySelector('.tp-av')!.textContent).toBe('MK')
    expect(the('x1').querySelector('.giua span')!.textContent).toBe('Lớp 11')
    expect(the('x2').querySelector('.giua b')!.textContent).toBe('Lê Minh Đức')
    expect(the('x2').querySelector('.tp-av')!.textContent).toBe('MĐ')
    expect(the('x2').querySelector('.giua span')!.textContent).toBe('Lớp 12A1')
    expect(the('x3').querySelector('.giua b')!.textContent).toBe(DAI)
    expect(the('x3').querySelector('.giua span')!.textContent).toBe('12 - Lớp Thường')
    expect(document.body.textContent).not.toMatch(/[A-ZĐ]\.(?!\w)/) // không kiểu tắt «… L.»
  })
  it('kết quả tìm bạn: đủ họ tên, «Lớp 11» có nhãn', async () => {
    mayChu[DUONG.timBan] = { ok: true, bat: true, ketQua: [{ ma: 't1', ten: 'Lê Minh Đức', lop: '11', trangThai: null }] }
    const { ManMoiBan } = await import('../src/components/thuong/ManThuong')
    render(<ManMoiBan token={TK} onDong={() => {}} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '11010' } })
    const o = await screen.findByText('Lê Minh Đức')
    const dong = o.closest('.dong-b')!
    expect(dong.textContent).toContain('Lớp 11')
    expect(dong.querySelector('.tp-av')!.textContent).toBe('MĐ')
  })
})

describe('Chuỗi ngày · khối Lửa đôi', () => {
  it('liệt kê bạn + số lửa đôi; bấm ⇒ mở Học cùng bạn; không điểm / nguyên tử của bạn', async () => {
    const onBan = vi.fn()
    render(<ManChuoiNgay token={TK} onBan={onBan} />)
    const nut = await screen.findByRole('button', { name: 'Lửa đôi với 2 bạn — mở Học cùng bạn' })
    expect(nut.textContent).toContain('Minh Châu')
    expect(nut.textContent).toContain('Lửa đôi 9 ngày')
    expect(nut.textContent).toContain('bạn chưa học hôm nay')
    expect(nut.textContent).not.toMatch(/nguyên tử|12A2/)
    fireEvent.click(nut)
    expect(onBan).toHaveBeenCalledTimes(1)
  })
  it('ManThuong man="chuoi" nối onMo(«ban»); công tắc bạn bè tắt ⇒ khối ẩn', async () => {
    const onMo = vi.fn()
    const r = render(<ManThuong man="chuoi" token={TK} onMo={onMo} />)
    fireEvent.click(await screen.findByRole('button', { name: /Lửa đôi với 2 bạn/ }))
    expect(onMo).toHaveBeenCalledWith('ban')
    r.unmount()
    _quenTam(); localStorage.clear()
    mayChu[DUONG.tongQuan] = M.tongQuanGia({ bat: { ...M.BAT, banBe: false } })
    render(<ManChuoiNgay token={TK} onBan={() => {}} />)
    await screen.findByText('Luật chuỗi')
    await new Promise((x) => setTimeout(x, 20))
    expect(screen.queryByRole('region', { name: 'Lửa đôi' })).toBeNull()
  })
})

describe('Thử thách Kim cương · danh sách chuyên đề', () => {
  it('danh sách đúng trạng thái; «Thử thách» ⇒ màn mời của đúng chuyên đề; đóng ⇒ về danh sách', async () => {
    render(<ManThuong man="kim-cuong" token={TK} onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Thử thách Kim cương' })).toBeTruthy()
    expect(screen.getByText('Em đang làm dở lượt này')).toBeTruthy()
    expect(screen.getByText('Đã đạt · thử lại được')).toBeTruthy()
    expect(screen.getByText(/^Làm lại từ \d\d:\d\d /)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Làm tiếp Ester – lipid' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Thử thách Cấu tạo nguyên tử' }))
    expect(await screen.findByText(/Cấu tạo nguyên tử · em đã vững chuyên đề này/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thử thách' }))
    await waitFor(() => expect(daGoi.find((g) => g.duong === DUONG.kimCuong)?.than.chuyenDe).toBe('NGUYEN_TU'))
  })
  it('chưa vững chuyên đề nào ⇒ nói thật cách mở; công tắc Kim cương tắt ⇒ ẩn hẳn', async () => {
    mayChu[DUONG.kimCuongDs] = { ok: true, bat: true, ds: [] }
    const r = render(<ManThuong man="kim-cuong" token={TK} onVe={() => {}} />)
    expect(await screen.findByText('Chưa có chuyên đề nào mở thử thách')).toBeTruthy()
    r.unmount()
    _quenTam(); localStorage.clear()
    mayChu[DUONG.tongQuan] = M.tongQuanGia({ bat: { ...M.BAT, kimCuong: false } })
    const r2 = render(<ManThuong man="kim-cuong" token={TK} onVe={() => {}} />)
    await waitFor(() => expect(daGoi.some((g) => g.duong === DUONG.tongQuan)).toBe(true))
    await new Promise((x) => setTimeout(x, 20))
    expect(r2.container.textContent).toBe('')
  })
})
