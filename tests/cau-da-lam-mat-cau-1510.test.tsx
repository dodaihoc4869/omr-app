// TEST ĐỎ (Kiểm thử, văn phòng 3995d8066e73, 15/10): học sinh lớp 10 báo Ôn & sửa › "Câu đã làm" giờ "ít câu hơn trước, có 3 câu thôi".
// Tái hiện trên bản sống (phiên chỉ đọc, 21:35 15/10): `hoa2-cau-da-lam` trả 252 câu em đã làm ở 3 mục, nhưng màn chỉ cho xem 4 câu.
// Gốc: đợt 18 (e4fc3f9a, 13/10) `chienDichHienChon` bỏ Hành trình (164 câu) VÀ mục tên mã nội bộ "#cd42011c1c2" (84 câu) khỏi ô chọn;
// còn đúng một bài thật ⇒ ô chọn ẩn, 248 câu không còn đường nào để mở. Dữ liệu dưới đây giữ đúng hình dạng thật (mã, tên, số câu mỗi mục).
// Luật test (theo KẾT QUẢ, không ép cách sửa): mọi câu máy chủ trả về phải xem được ở màn này bằng cách nào đó (ô chọn, mục gộp...).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import CauDaLam from '../src/components/hoa2/CauDaLam'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const BAI9 = { id: '3c954a63-cbe1-4409-9a87-3e285ecd9040', ten: 'Bài 9 · Ôn tập chương 2 (đề 2)', hanNop: '2026-10-14', tong: 18 }
const MA = { id: '9c1d4f24-ea90-48f6-ba5d-3be8bb859321', ten: '#cd42011c1c2', hanNop: '2026-10-05', tong: 125 }
const HT = { id: 'hanh-trinh-v3-khoi-10', ten: 'Hành trình giỏi hoá · Khối 10', hanNop: '9999-12-31', tong: 2628 }
const lo = (cd: { id: string }, n: number, ngay: string, nguon?: string) =>
  Array.from({ length: n }, (_, i) => ({
    qid: `${cd.id.slice(0, 6)}-${i + 1}`, chienDichId: cd.id, stt: i + 1, phan: 'I', mucDo: 'hieu', tenDang: `Dạng ${cd.id.slice(0, 4)} ${i + 1}`,
    trangThai: 'dang_on', lanCuoiDung: i % 2 === 0, henOn: '2026-10-17', lichSu: [{ ngay, dung: i % 2 === 0, coGoiY: false, ...(nguon ? { nguon } : {}) }],
  }))
const CAU = [...lo(BAI9, 4, '2026-10-14'), ...lo(MA, 84, '2026-10-05', 'dao'), ...lo(HT, 164, '2026-10-14')]

const moCdl = () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true, status: 200,
    json: async () => (new URL(String(url)).pathname === '/game-v2/hoa2-cau-da-lam' ? { ok: true, chienDich: [BAI9, MA, HT], cau: CAU } : { ok: true, cau: [] }),
  })))
  return render(<CauDaLam token="tk" hoTen="Em lớp 10" sbd="S1" onVe={() => {}} />)
}
const soTatCa = (c: HTMLElement): number => {
  const nut = [...c.querySelectorAll('button')].find((b) => /Tất cả\s*\d+/.test(b.textContent ?? ''))
  return Number((nut?.textContent ?? '').match(/Tất cả\s*(\d+)/)?.[1] ?? 0)
}

describe('Câu đã làm không được giấu câu em đã làm (báo 15/10, tái hiện bản sống)', () => {
  it('máy chủ trả 252 câu ở 3 mục ⇒ em phải xem được đủ 252 câu (hiện chỉ 4: ô chọn ẩn, chỉ còn Bài 9)', async () => {
    const { container } = moCdl()
    await waitFor(() => expect(soTatCa(container)).toBeGreaterThan(0))
    const chon = screen.queryByRole('combobox') as HTMLSelectElement | null
    let tong = 0
    if (!chon) tong = soTatCa(container)
    else {
      for (const o of [...chon.options]) {
        fireEvent.change(chon, { target: { value: o.value } })
        await waitFor(() => expect(chon.value).toBe(o.value))
        tong += soTatCa(container)
      }
    }
    // Các mục của máy chủ rời nhau (một câu thuộc đúng một mục) ⇒ cộng số "Tất cả" của mọi lựa chọn phải phủ đủ; có mục gộp thì vượt cũng được.
    expect(tong, `em chỉ mở được ${tong}/${CAU.length} câu`).toBeGreaterThanOrEqual(CAU.length)
  })
  it('84 câu của bài đã đóng mang tên mã "#cd…" vẫn phải tới được tay em (không lộ mã nội bộ)', async () => {
    const { container } = moCdl()
    await waitFor(() => expect(soTatCa(container)).toBeGreaterThan(0))
    const chon = screen.queryByRole('combobox') as HTMLSelectElement | null
    const coMucMa = !!chon && [...chon.options].some((o) => o.value === MA.id)
    const daGop = soTatCa(container) >= 4 + 84
    expect(coMucMa || daGop, 'mục 84 câu không có trong ô chọn và không được gộp vào danh sách').toBe(true)
    expect(container.textContent).not.toContain('#cd42011c1c2')
  })
})
