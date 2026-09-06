// BA LỖI THẦY BÁO 06/09 — mỗi lỗi một khối, mỗi khối dựng đúng cảnh gây lỗi.
//
// 1. Nút gạt "Giữ để đọc" bấm không ăn.
// 2. iPhone khoá bài dù em không thoát app lần nào.
// 3. Bàn phím iPhone không có dấu trừ ở ô trả lời ngắn.
//
// Lỗi 2 và 3 là MỘT DÂY: em chạm ô trả lời ngắn → bàn phím ảo bật → iOS bắn
// `blur` → app tính là rời màn → ba lần là khoá.
import { describe, expect, it, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MS_XAC_NHAN_BLUR, laMayCamUng, tinhLaRoiMan, mucKhiRoiMan, NGUONG_MAC_DINH } from '../src/lib/chong-gian-lan'
import TheCau, { doiDau, laAm } from '../src/components/TheCau'
import { phaiHoanBanMoi } from '../src/lib/cap-nhat-app'

afterEach(() => cleanup())

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

// ---------------------------------------------------------------------------

describe('Lỗi 2 — iPhone khoá bài dù em không vi phạm', () => {
  it('máy CẢM ỨNG: bàn phím ảo bật (blur) KHÔNG tính là rời màn', () => {
    expect(tinhLaRoiMan('mat_tieu_diem', true, true)).toBe(false)
    // Kể cả khi tiêu điểm chưa về, máy cảm ứng vẫn không tính — vì `blur` ở đó
    // không phân biệt được bàn phím với thoát app.
    expect(tinhLaRoiMan('mat_tieu_diem', true, false)).toBe(false)
  })

  it('nhưng THOÁT APP THẬT vẫn bắt được: hidden luôn tính, kể cả máy cảm ứng', () => {
    expect(tinhLaRoiMan('an', true, true)).toBe(true)
    expect(tinhLaRoiMan('thoat_toan_man', true, true)).toBe(true)
  })

  it('máy CÓ CHUỘT: blur chỉ tính khi tiêu điểm KHÔNG quay lại', () => {
    expect(tinhLaRoiMan('mat_tieu_diem', false, false)).toBe(true)
    expect(tinhLaRoiMan('mat_tieu_diem', false, true)).toBe(false)
  })

  it('đo máy cảm ứng bằng số điểm chạm, không đọc tên máy (iPad khai là Mac)', () => {
    expect(laMayCamUng({ maxTouchPoints: 5 })).toBe(true)
    expect(laMayCamUng({ maxTouchPoints: 0 })).toBe(false)
    expect(laMayCamUng(null)).toBe(false)
    expect(laMayCamUng(undefined as never)).toBe(false)
  })

  it('CẢNH ĐÚNG CỦA THẦY: ba lần chạm ô đáp án trên iPhone', () => {
    const nguong = NGUONG_MAC_DINH // khoá ở lần thứ 3
    // Đếm số lần được tính khi em chạm ô đáp án BA lần trên iPhone (mỗi lần
    // bàn phím bật là một `blur`, tiêu điểm không hề rời trang).
    const dem = (camUng: boolean) => {
      let n = 0
      for (let i = 0; i < 3; i++) if (tinhLaRoiMan('mat_tieu_diem', camUng, true)) n += 1
      return n
    }
    // iPhone: KHÔNG lần nào được tính ⇒ chưa tới mức cảnh báo nào.
    expect(dem(true)).toBe(0)
    // Máy có chuột mà tiêu điểm quay lại ngay (bàn phím, hộp thoại nhỏ) cũng
    // không tính — nhịp xác nhận lo phần đó.
    expect(dem(false)).toBe(0)
    // Còn ba lần rời màn THẬT thì vẫn khoá đúng như cũ.
    expect(mucKhiRoiMan(3, 0, nguong)).toBe('khoa')
  })

  it('màn làm bài đã nối đúng: bỏ blur trên máy cảm ứng, có nhịp xác nhận', () => {
    const man = doc('src/screens/ExamTakeScreen.tsx')
    const dau = man.indexOf('const onVis = ')
    const cuoi = man.indexOf("document.addEventListener('visibilitychange', onVis)")
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const khoi = man.slice(dau, cuoi)
    expect(khoi).toContain('const camUng = laMayCamUng()')
    expect(khoi).toContain('if (camUng) return')
    expect(khoi).toContain('MS_XAC_NHAN_BLUR')
    expect(khoi).toContain('document.hasFocus()')
    // `hidden` phải giữ nguyên đường cũ — không được nới cả cái này.
    expect(khoi).toContain("logEvent(document.hidden ? 'hidden' : 'visible')")
  })

  it('nhịp chờ đủ dài để bàn phím kịp trả tiêu điểm, không dài tới mức bỏ sót', () => {
    expect(MS_XAC_NHAN_BLUR).toBeGreaterThanOrEqual(300)
    expect(MS_XAC_NHAN_BLUR).toBeLessThanOrEqual(1000)
  })
})

// ---------------------------------------------------------------------------

describe('Lỗi 3 — bàn phím iPhone không có dấu trừ', () => {
  it('đổi dấu qua lại, ô trống bấm cũng ra dấu trừ', () => {
    expect(doiDau('')).toBe('-')
    expect(doiDau('12,5')).toBe('-12,5')
    expect(doiDau('-12,5')).toBe('12,5')
    expect(doiDau('-')).toBe('')
    // Em gõ lỡ khoảng trắng đầu thì vẫn đúng chỗ.
    expect(doiDau(' 92,4')).toBe(' -92,4')
    expect(doiDau(' -92,4')).toBe(' 92,4')
  })

  it('laAm đọc đúng cả khi có khoảng trắng đầu', () => {
    expect(laAm('-3')).toBe(true)
    expect(laAm('  -3')).toBe(true)
    expect(laAm('3')).toBe(false)
    expect(laAm('')).toBe(false)
    expect(laAm(null)).toBe(false)
  })

  it('ô trả lời ngắn có NÚT DẤU ÂM, bấm là ra dấu', () => {
    const doi = vi.fn()
    render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected="" onChange={doi} />)
    const nut = document.querySelector('[aria-label="Thêm dấu âm"]') as HTMLElement
    expect(nut).toBeTruthy()
    fireEvent.click(nut)
    expect(doi).toHaveBeenCalledWith('-')
  })

  it('đang âm thì nút đổi nhãn thành BỎ dấu âm, bấm là bỏ', () => {
    const doi = vi.fn()
    render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected="-92,4" onChange={doi} />)
    const nut = document.querySelector('[aria-label="Bỏ dấu âm"]') as HTMLElement
    expect(nut).toBeTruthy()
    fireEvent.click(nut)
    expect(doi).toHaveBeenCalledWith('92,4')
  })

  it('vẫn giữ bàn phím số — em gõ số là chính', () => {
    render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected="" onChange={() => {}} />)
    const o = document.querySelector('input[inputmode="decimal"]')
    expect(o).toBeTruthy()
  })

  it('gõ tay dấu trừ vẫn nhận — ô không lọc ký tự', () => {
    const doi = vi.fn()
    render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected="" onChange={doi} />)
    const o = document.querySelector('input[inputmode="decimal"]') as HTMLInputElement
    fireEvent.change(o, { target: { value: '-4,5' } })
    expect(doi).toHaveBeenCalledWith('-4,5')
  })
})

// ---------------------------------------------------------------------------

describe('Lỗi 1 — nút gạt Giữ để đọc bấm không ăn', () => {
  const man = doc('src/screens/ExamSetupScreen.tsx')

  it('CẢ HÀNG là nút, không phải chỉ ô gạt bé ở mép phải', () => {
    const dau = man.indexOf('aria-label="Giữ để đọc"')
    expect(dau).toBeGreaterThan(0)
    const khoi = man.slice(Math.max(0, dau - 500), dau + 900)
    expect(khoi).toContain('className="tap-target w-full flex items-center justify-between"')
    // Tiêu đề nằm TRONG nút, nên chạm vào chữ cũng đổi được.
    expect(khoi).toContain('<span style={TIEU_DE_MUC}>Giữ để đọc</span>')
  })

  it('vùng chạm đạt 44px — dưới ngưỡng là ngón tay trượt ra ngoài', () => {
    const dau = man.indexOf('aria-label="Giữ để đọc"')
    const khoi = man.slice(dau, dau + 700)
    expect(khoi).toContain('minHeight: 44')
    expect(khoi).not.toMatch(/minHeight:\s*3[0-9]\b/)
  })

  it('nút gạt Giữ đăng nhập ở Cài đặt cũng đủ 44px', () => {
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    const dau = kh.indexOf('aria-label="Giữ đăng nhập trong tab này"')
    expect(dau).toBeGreaterThan(0)
    const khoi = kh.slice(dau, dau + 700)
    expect(khoi).toContain('minHeight: 44')
  })
})

// ---------------------------------------------------------------------------

describe('Bản mới tới tay thầy — vì sao máy vẫn chạy bản cũ', () => {
  it('đang mở khoá MÀ CÓ phiên theo tab → KHÔNG hoãn, thầy nhận bản mới ngay', () => {
    expect(phaiHoanBanMoi(false, true, true)).toBe(false)
  })

  it('đang mở khoá mà KHÔNG có phiên → vẫn hoãn, không hỏi mật khẩu giữa buổi dạy', () => {
    expect(phaiHoanBanMoi(false, true, false)).toBe(true)
  })

  it('EM ĐANG LÀM BÀI thì hoãn tuyệt đối, có phiên hay không cũng vậy', () => {
    expect(phaiHoanBanMoi(true, false, true)).toBe(true)
    expect(phaiHoanBanMoi(true, true, true)).toBe(true)
    expect(phaiHoanBanMoi(true, false, false)).toBe(true)
  })

  it('không mở khoá, không làm bài → tải lại bình thường', () => {
    expect(phaiHoanBanMoi(false, false, false)).toBe(false)
  })

  it('chốt tải lại dùng đúng hàm này, không còn kiểm rời rạc', () => {
    const ma = doc('src/lib/cap-nhat-app.ts')
    const dau = ma.indexOf('export function batTuTaiLaiKhiDoiBan')
    const khoi = ma.slice(dau)
    expect(khoi).toContain('phaiHoanBanMoi(dangLamBaiKhong(), dangMoKhoaKhong(), coGoiPhien())')
    expect(khoi).not.toContain('if (dangMoKhoaKhong()) return')
  })
})
