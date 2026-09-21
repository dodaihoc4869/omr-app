// Ô NGÀY / THÁNG / NĂM + GIỜ : PHÚT 24 GIỜ dùng chung (`ONgayGio24`) — thầy yêu cầu 21/09: không phụ thuộc máy hiện AM/PM hay mm/dd, đồng bộ mọi nơi.
// Giá trị ra GIỮ NGUYÊN dạng cũ ('YYYY-MM-DDTHH:mm' / 'YYYY-MM-DD') ⇒ payload các hàm cũ không đổi (ExamSetup = LUỒNG THI: chỉ đổi ô nhập, test khoá).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { useState } from 'react'
import ONgayGio24 from '../src/components/ONgayGio24'
import NhanHanBaiTap from '../src/components/NhanHanBaiTap'
import { bayGio, buocO, daQua, ghepGiaTri, gioDayDu, hienGiaTri, nutNhanh, soNgayTrongThang, tachGiaTri } from '../src/lib/ngay-gio-24'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
const T = (ten: string) => screen.getByLabelText(ten) as HTMLInputElement
const go = (ten: string, v: string) => fireEvent.change(T(ten), { target: { value: v } })

describe('ngay-gio-24 — phần THUẦN', () => {
  it('ghép + kiểm: hợp lệ ra đúng dạng datetime-local / date; năm nhuận; ngày không có thật; giờ/phút ngoài khoảng; chưa đủ', () => {
    expect(ghepGiaTri({ d: '25', m: '09', y: '2026', h: '23', p: '59' }, true)).toMatchObject({ gia: '2026-09-25T23:59', loi: '' })
    expect(ghepGiaTri({ d: '5', m: '9', y: '2026', h: '7', p: '3' }, true).gia).toBe('2026-09-05T07:03') // bù số 0
    expect(ghepGiaTri({ d: '25', m: '09', y: '2026', h: '', p: '' }, false)).toMatchObject({ gia: '2026-09-25', loi: '' })
    expect(ghepGiaTri({ d: '29', m: '02', y: '2028', h: '10', p: '00' }, true).gia).toBe('2028-02-29T10:00') // nhuận
    expect(ghepGiaTri({ d: '29', m: '02', y: '2026', h: '10', p: '00' }, true)).toMatchObject({ gia: '', loi: 'Ngày 29/02/2026 không có thật (năm 2026 không nhuận).' })
    expect(ghepGiaTri({ d: '31', m: '04', y: '2026', h: '10', p: '00' }, true).loi).toBe('Ngày 31/04/2026 không có thật.')
    expect(ghepGiaTri({ d: '10', m: '13', y: '2026', h: '10', p: '00' }, true).loi).toContain('Tháng 13 không có thật')
    expect(ghepGiaTri({ d: '10', m: '10', y: '1999', h: '10', p: '00' }, true).loi).toContain('Năm 1999')
    expect(ghepGiaTri({ d: '10', m: '10', y: '2026', h: '24', p: '00' }, true).loi).toContain('Giờ phải từ 00 đến 23')
    expect(ghepGiaTri({ d: '10', m: '10', y: '2026', h: '10', p: '60' }, true).loi).toContain('phút từ 00 đến 59')
    expect(ghepGiaTri({ d: '10', m: '10', y: '26', h: '10', p: '00' }, true).loi).toContain('Nhập đủ') // năm phải 4 số
    expect(ghepGiaTri({ d: '10', m: '', y: '', h: '', p: '' }, true)).toMatchObject({ gia: '', daNhap: true })
    expect(ghepGiaTri({ d: '', m: '', y: '', h: '', p: '' }, true)).toEqual({ gia: '', loi: '', daNhap: false }) // để trống KHÔNG là lỗi
    expect(soNgayTrongThang(2, 2100)).toBe(28) // 2100 không nhuận (chia hết 100, không chia hết 400)
    expect(soNgayTrongThang(2, 2000)).toBe(29)
  })

  it('tách giá trị cũ: datetime-local · date · chuỗi lạ ⇒ rỗng', () => {
    expect(tachGiaTri('2026-09-25T20:05')).toEqual({ d: '25', m: '09', y: '2026', h: '20', p: '05' })
    expect(tachGiaTri('2026-09-25')).toEqual({ d: '25', m: '09', y: '2026', h: '', p: '' })
    expect(tachGiaTri('25/09/2026')).toEqual({ d: '', m: '', y: '', h: '', p: '' })
    expect(tachGiaTri('')).toEqual({ d: '', m: '', y: '', h: '', p: '' })
  })

  it('"đã qua" tính theo múi của giá trị (VN cố định UTC+7 / giờ máy); chỉ-ngày tính hết ngày 23:59', () => {
    const nay = Date.parse('2026-09-21T10:00:00+07:00')
    expect(bayGio(nay, 'vn')).toBe('2026-09-21T10:00')
    expect(bayGio(Date.parse('2026-09-21T17:30:00Z'), 'vn')).toBe('2026-09-22T00:30') // 00:30 ngày 22 giờ VN
    expect(daQua('2026-09-21T09:59', nay, 'vn')).toBe(true)
    expect(daQua('2026-09-21T10:00', nay, 'vn')).toBe(false)
    expect(daQua('2026-09-21', nay, 'vn')).toBe(false) // hết ngày 21 chưa qua
    expect(daQua('2026-09-20', nay, 'vn')).toBe(true)
    expect(daQua('', nay, 'vn')).toBe(false)
  })

  it('bốn nút nhanh: Hôm nay 23:59 · Mai 23:59 · +3 ngày · +7 ngày (theo ngày VN, qua nửa đêm, sang tháng/năm)', () => {
    const n = nutNhanh(Date.parse('2026-09-21T10:00:00+07:00'), 'vn', true)
    expect(n.map((x) => x.nhan)).toEqual(['Hôm nay 23:59', 'Mai 23:59', '+3 ngày', '+7 ngày'])
    expect(n.map((x) => x.gia)).toEqual(['2026-09-21T23:59', '2026-09-22T23:59', '2026-09-24T23:59', '2026-09-28T23:59'])
    expect(nutNhanh(Date.parse('2026-09-21T17:30:00Z'), 'vn', true)[0].gia).toBe('2026-09-22T23:59') // 00:30 ngày 22 giờ VN ⇒ "hôm nay" là 22
    expect(nutNhanh(Date.parse('2026-12-30T10:00:00+07:00'), 'vn', true)[3].gia).toBe('2027-01-06T23:59')
    expect(nutNhanh(Date.parse('2026-09-21T10:00:00+07:00'), 'vn', false).map((x) => x.gia)).toEqual(['2026-09-21', '2026-09-22', '2026-09-24', '2026-09-28'])
  })

  it('mũi tên: ngày vòng theo số ngày của THÁNG (28/29/30/31), tháng 12→01, giờ 23→00, phút 59→00, năm kẹp 2000..2100; ô trống lấy từ "bây giờ"', () => {
    const f = { d: '28', m: '02', y: '2026', h: '23', p: '59' }
    const moc = { d: '21', m: '09', y: '2026', h: '10', p: '30' }
    expect(buocO('d', f, 1, moc)).toBe('01') // tháng 2/2026 chỉ có 28 ngày
    expect(buocO('d', { ...f, y: '2028' }, 1, moc)).toBe('29')
    expect(buocO('d', { ...f, d: '01' }, -1, moc)).toBe('28')
    expect(buocO('m', { ...f, m: '12' }, 1, moc)).toBe('01')
    expect(buocO('h', f, 1, moc)).toBe('00')
    expect(buocO('h', { ...f, h: '00' }, -1, moc)).toBe('23')
    expect(buocO('p', f, 1, moc)).toBe('00')
    expect(buocO('y', { ...f, y: '2100' }, 1, moc)).toBe('2100')
    expect(buocO('h', { d: '', m: '', y: '', h: '', p: '' }, 1, moc)).toBe('11')
  })

  it('HIỆN: "HH:mm · Thứ … dd/mm/yyyy" (giờ VN, 24 giờ); chỉ-ngày không giờ; mốc sai ⇒ chữ cũ', () => {
    expect(hienGiaTri('2026-09-25T23:59')).toBe('23:59 · Thứ Sáu 25/09/2026')
    expect(hienGiaTri('2026-09-21T08:05')).toBe('08:05 · Thứ Hai 21/09/2026')
    expect(hienGiaTri('2026-09-27T20:00')).toBe('20:00 · Chủ nhật 27/09/2026')
    expect(hienGiaTri('2026-09-25')).toBe('Thứ Sáu 25/09/2026')
    expect(hienGiaTri('2026-02-30T10:00')).toBe('')
    expect(gioDayDu('2026-09-25T16:59:00Z')).toBe('23:59 · Thứ Sáu 25/09/2026') // 16:59Z = 23:59 VN
    expect(gioDayDu('2026-09-25T17:30:00Z')).toBe('00:30 · Thứ Bảy 26/09/2026') // qua nửa đêm giờ VN = ngày khác
    expect(gioDayDu(Date.parse('2026-09-21T01:05:00Z'))).toBe('08:05 · Thứ Hai 21/09/2026')
    expect(gioDayDu('không phải ngày')).toBe('Chưa có hạn hợp lệ')
    expect(gioDayDu(undefined)).toBe('Chưa có hạn hợp lệ')
  })
})

describe('ONgayGio24 — ô nhập', () => {
  function Dung(p: { init?: string; onRa?: (v: string) => void; onLoi?: (l: string) => void; chiNgay?: boolean; nhanh?: boolean; khongQuaKhu?: boolean }) {
    const [v, setV] = useState(p.init ?? '')
    return (
      <>
        <ONgayGio24
          nhan="Hạn thử"
          value={v}
          onChange={(x) => {
            setV(x)
            p.onRa?.(x)
          }}
          onLoi={p.onLoi}
          chiNgay={p.chiNgay}
          nhanh={p.nhanh}
          khongQuaKhu={p.khongQuaKhu}
        />
        <output data-testid="ra">{v}</output>
      </>
    )
  }

  it('KHÔNG dùng ô datetime-local/date của trình duyệt (hết AM/PM, mm/dd): năm ô số, bàn phím số trên điện thoại, 24 giờ', () => {
    const { container } = render(<Dung />)
    expect(container.querySelector('input[type="datetime-local"], input[type="date"], input[type="time"]')).toBeNull()
    const cac = container.querySelectorAll('input')
    expect(cac).toHaveLength(5)
    cac.forEach((i) => {
      expect(i.getAttribute('inputmode')).toBe('numeric')
      expect(i.getAttribute('pattern')).toBe('[0-9]*')
    })
    expect(container.textContent).toContain('24 giờ')
    expect(container.textContent).not.toMatch(/AM|PM/)
  })

  it('gõ liền một mạch: tự nhảy ô (ngày "25" → tháng "09" → năm "2026" → giờ "23" → phút "59"); ra đúng YYYY-MM-DDTHH:mm; hiện "HH:mm · Thứ … dd/mm/yyyy"', () => {
    const ra = vi.fn()
    render(<Dung onRa={ra} />)
    T('Ngày').focus()
    go('Ngày', '25')
    expect(document.activeElement).toBe(T('Tháng'))
    go('Tháng', '09')
    expect(document.activeElement).toBe(T('Năm'))
    go('Năm', '2026')
    expect(document.activeElement).toBe(T('Giờ'))
    go('Giờ', '23')
    expect(document.activeElement).toBe(T('Phút'))
    go('Phút', '59')
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-25T23:59')
    expect(ra).toHaveBeenLastCalledWith('2026-09-25T23:59')
    expect(document.querySelector('[data-khoi="ong24-hien"]')!.textContent).toBe('23:59 · Thứ Sáu 25/09/2026')
  })

  it('chữ số đầu đã "không thể là chữ số đầu của số hai chữ số hợp lệ" ⇒ nhảy ngay (ngày 4→04, tháng 9→09, giờ 7→07, phút 8→08); "1" ở tháng thì ĐỢI số 2', () => {
    render(<Dung />)
    go('Ngày', '4')
    expect(document.activeElement).toBe(T('Tháng'))
    go('Tháng', '1')
    expect(document.activeElement).toBe(T('Tháng')) // có thể là 10, 11, 12
    go('Tháng', '')
    go('Tháng', '9')
    expect(document.activeElement).toBe(T('Năm'))
    go('Năm', '2026')
    go('Giờ', '7')
    expect(document.activeElement).toBe(T('Phút'))
    go('Phút', '8')
    fireEvent.blur(T('Phút'))
    fireEvent.blur(T('Ngày'))
    fireEvent.blur(T('Giờ'))
    expect(screen.getByTestId('ra').textContent).toMatch(/^2026-09-0?4T0?7:0?8$/)
  })

  it('gõ TỪNG PHÍM (2 rồi 5): tự nhảy ô KHÔNG bù số 0 đè lên "25" (blur do nhảy ô chạy trước khi vẽ lại); rời ô mới bù "5"→"05"; năm 2 số "26"→"2026"', () => {
    render(<Dung />)
    T('Ngày').focus()
    go('Ngày', '2')
    go('Ngày', '25')
    expect(document.activeElement).toBe(T('Tháng'))
    expect(T('Ngày').value).toBe('25')
    go('Tháng', '1')
    go('Tháng', '12')
    expect(T('Tháng').value).toBe('12')
    go('Năm', '2')
    go('Năm', '20')
    go('Năm', '202')
    go('Năm', '2026')
    expect(T('Năm').value).toBe('2026')
    go('Giờ', '2')
    go('Giờ', '20')
    go('Phút', '5')
    fireEvent.blur(T('Phút')) // rời ô phút
    expect(T('Phút').value).toBe('05')
    expect(screen.getByTestId('ra').textContent).toBe('2026-12-25T20:05')
    go('Năm', '26')
    fireEvent.blur(T('Năm'))
    expect(T('Năm').value).toBe('2026')
  })

  it('mũi tên lên/xuống đổi từng ô và VÒNG (giờ 23↑ → 00, phút 00↓ → 59); Backspace ở ô trống lùi ô trước; chỉ nhận chữ số', () => {
    render(<Dung init="2026-09-25T23:00" />)
    fireEvent.keyDown(T('Giờ'), { key: 'ArrowUp' })
    expect(T('Giờ').value).toBe('00')
    fireEvent.keyDown(T('Phút'), { key: 'ArrowDown' })
    expect(T('Phút').value).toBe('59')
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-25T00:59')
    go('Ngày', '2a')
    expect(T('Ngày').value).toBe('2') // chữ không vào
    go('Tháng', '')
    T('Tháng').focus()
    fireEvent.keyDown(T('Tháng'), { key: 'Backspace' })
    expect(document.activeElement).toBe(T('Ngày'))
  })

  it('ngày KHÔNG CÓ THẬT ⇒ báo lỗi ngay + giá trị ra rỗng (không phát ngày sai); chưa đủ thì im cho tới khi rời ô rồi mới báo', () => {
    const onLoi = vi.fn()
    render(<Dung onLoi={onLoi} />)
    for (const [t, v] of [['Ngày', '31'], ['Tháng', '02'], ['Năm', '2026'], ['Giờ', '10'], ['Phút', '00']] as const) go(t, v)
    expect(screen.getByRole('alert').textContent).toBe('Ngày 31/02/2026 không có thật.')
    expect(screen.getByTestId('ra').textContent).toBe('')
    expect(onLoi).toHaveBeenLastCalledWith('Ngày 31/02/2026 không có thật.')
    cleanup()
    const onLoi2 = vi.fn()
    render(<Dung onLoi={onLoi2} />)
    go('Ngày', '25')
    expect(screen.queryByRole('alert')).toBeNull() // đang gõ dở — chưa la
    expect(onLoi2).toHaveBeenLastCalledWith('Nhập đủ ngày, tháng, năm (4 số), giờ và phút.') // nhưng nơi dùng đã biết (để chặn nút Giao)
    fireEvent.blur(T('Ngày'))
    expect(screen.getByRole('alert').textContent).toContain('Nhập đủ')
  })

  it('"đã qua" (khongQuaKhu): CHỈ báo khi thầy vừa chỉnh — giá trị cũ vốn đã qua (gia hạn bài quá hạn) KHÔNG đỏ từ đầu; chỉnh về quá khứ thì báo + vẫn phát giá trị', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-21T03:00:00Z')) // 10:00 giờ VN
    const ra = vi.fn()
    const onLoi = vi.fn()
    render(<Dung init="2026-09-15T23:59" khongQuaKhu onRa={ra} onLoi={onLoi} />)
    expect(screen.queryByRole('alert')).toBeNull() // hạn cũ đã qua nhưng thầy chưa đụng
    expect(onLoi).toHaveBeenLastCalledWith('')
    go('Ngày', '16')
    expect(screen.getByRole('alert').textContent).toBe('Hạn nộp phải ở sau thời điểm hiện tại.')
    expect(ra).toHaveBeenLastCalledWith('2026-09-16T23:59') // vẫn phát (nơi dùng có luật riêng); Giao/Lưu bị chặn nhờ onLoi
    expect(onLoi).toHaveBeenLastCalledWith('Hạn nộp phải ở sau thời điểm hiện tại.')
    go('Ngày', '28')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(onLoi).toHaveBeenLastCalledWith('')
  })

  it('nút nhanh đặt đúng 23:59: Hôm nay · Mai · +3 ngày · +7 ngày (theo ngày VN); chỉnh tay sau đó vẫn được', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-21T03:00:00Z'))
    render(<Dung nhanh />)
    const nhom = within(screen.getByRole('group', { name: 'Hạn thử — chọn nhanh' }))
    expect(nhom.getAllByRole('button').map((b) => b.textContent)).toEqual(['Hôm nay 23:59', 'Mai 23:59', '+3 ngày', '+7 ngày'])
    fireEvent.click(nhom.getByRole('button', { name: 'Mai 23:59' }))
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-22T23:59')
    expect(T('Giờ').value).toBe('23')
    expect(T('Phút').value).toBe('59')
    fireEvent.click(nhom.getByRole('button', { name: '+7 ngày' }))
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-28T23:59')
    go('Giờ', '20')
    go('Phút', '05')
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-28T20:05')
  })

  it('chiNgay: chỉ ba ô, ra YYYY-MM-DD (như type="date"); nơi dùng đổi giá trị từ ngoài thì các ô nạp lại, còn giá trị do ô tự phát thì không giật', () => {
    const { rerender } = render(<ONgayGio24 nhan="Ngày thử" value="2026-09-25" onChange={() => {}} chiNgay />)
    expect(document.querySelectorAll('input')).toHaveLength(3)
    expect(T('Ngày').value).toBe('25')
    rerender(<ONgayGio24 nhan="Ngày thử" value="2026-10-03" onChange={() => {}} chiNgay />)
    expect(T('Ngày').value).toBe('03')
    expect(T('Tháng').value).toBe('10')
    cleanup()
    render(<Dung chiNgay init="2026-09-25" />)
    go('Ngày', '26')
    expect(screen.getByTestId('ra').textContent).toBe('2026-09-26')
    expect(document.querySelector('[data-khoi="ong24-hien"]')!.textContent).toBe('Thứ Bảy 26/09/2026')
  })

  it('giá trị ra là chuỗi mà hàm cũ (new Date(local) / hanNhapVietNam) đọc y như ô datetime-local cũ ⇒ payload không đổi', () => {
    render(<Dung init="2026-09-25T20:05" />)
    go('Phút', '07')
    const ra = screen.getByTestId('ra').textContent!
    expect(ra).toBe('2026-09-25T20:07')
    expect(ra).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) // đúng regex của hanNhapVietNam
    expect(Number.isFinite(new Date(ra).getTime())).toBe(true) // đúng cách ExamSetup đọc (giờ máy)
  })
})

describe('nhãn hạn ở app giáo viên: "HH:mm · Thứ … dd/mm/yyyy"; app học sinh/phụ huynh KHÔNG đổi', () => {
  it('NhanHanBaiTap dayDu ⇒ định dạng mới; mặc định ⇒ chữ cũ', () => {
    const han = '2026-09-25T16:59:00Z'
    const nay = Date.parse('2026-09-20T00:00:00Z')
    const { container } = render(<NhanHanBaiTap han={han} now={nay} dayDu />)
    expect(container.textContent).toContain('23:59 · Thứ Sáu 25/09/2026 (giờ Việt Nam)')
    cleanup()
    const { container: c2 } = render(<NhanHanBaiTap han={han} now={nay} />)
    expect(c2.textContent).not.toContain('Thứ Sáu')
    expect(c2.textContent).toContain('25/09/2026')
  })
})

describe('nguồn: năm chỗ đã thay ô, giá trị gửi y cũ (test khoá)', () => {
  it('PhanCong (hạn mới + gia hạn) · GiaoBaiTap · ExamSetup · BangTin dùng ONgayGio24; không còn input datetime-local/date', () => {
    const pc = doc('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('<ONgayGio24 nhan="Hạn nộp bài mới"')
    expect(pc).toContain('nhan={`Hạn nộp ${t.maBtvn}`}')
    expect(doc('src/components/GiaoBaiTap.tsx')).toContain('<ONgayGio24 nhan="Hạn nộp bài tập"')
    expect(doc('src/screens/ExamSetupScreen.tsx')).toContain('<ONgayGio24 nhan="Thời điểm tự động mở ca" value={batDauLocal} onChange={setBatDauLocal} muiGio="may" />')
    expect(doc('src/components/BangTinGiaoVien.tsx')).toContain('<ONgayGio24 nhan="Ngày xem bảng tin"')
    for (const f of ['src/screens/PhanCongScreen.tsx', 'src/components/GiaoBaiTap.tsx', 'src/screens/ExamSetupScreen.tsx', 'src/components/BangTinGiaoVien.tsx']) {
      expect(doc(f)).not.toMatch(/type="(datetime-local|date|time)"/)
    }
  })
  it('GIÁ TRỊ GỬI Y CŨ: PhanCong vẫn hanNhapVietNam(hanMoi, …) và suaGiaoBtvn {hanNop: hanNhapVietNam(...)}; GiaoBaiTap vẫn hanNopISO(hanNgay); ExamSetup (LUỒNG THI) vẫn new Date(batDauLocal) + ISO + kiểm giờ đã qua', () => {
    const pc = doc('src/screens/PhanCongScreen.tsx')
    expect(pc).toContain('hanMoi ? hanNhapVietNam(hanMoi, nowHocTap) : undefined')
    expect(pc).toContain('{hanNop:hanNhapVietNam(suaHan[t.maBtvn], nowHocTap)}')
    expect(doc('src/components/GiaoBaiTap.tsx')).toContain('const hanNop = hanNopISO(hanNgay)')
    const es = doc('src/screens/ExamSetupScreen.tsx')
    expect(es).toContain('const t = new Date(batDauLocal).getTime()')
    expect(es).toContain("if (t < Date.now() - 60000) return showToast('Giờ bắt đầu đã qua")
    expect(es).toContain('batDauIso = new Date(t).toISOString()')
    expect(es).toContain('const [batDauLocal, setBatDauLocal] = useState(henGioMacDinh)')
  })
  it('Bảng tin giáo viên hiện hạn "HH:mm · Thứ … dd/mm/yyyy" (lỗi thật trong ảnh thầy: "12:59:00 24/9/2026" kiểu máy); không còn toLocaleString cho hạn', () => {
    const bt = doc('src/components/BangTinGiaoVien.tsx')
    expect(bt).toContain('Hạn: {gioDayDu(b.han_nop)}')
    expect(bt).not.toContain("toLocaleString('vi-VN')")
    expect(gioDayDu('2026-09-24T16:59:00Z')).toBe('23:59 · Thứ Năm 24/09/2026')
  })
  it('CSS mới không hex, không !important', () => {
    const css = doc('src/styles/o-ngay-gio-24.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
  })
})
