// APP HỌC SINH › "HỒ SƠ LÀM BÀI CỦA EM" (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé").
// Thành phần `HoSoCuaEmHs` bọc tấm thầy `HoSoLamCauEm` ở chế độ học sinh, nguồn = hai lệnh `/hs/...` (token, không SBD). Kiểm:
//   · ĐỦ mọi phần số liệu như thầy thấy (đầu tấm nhóm + lý do, Hôm nay, năm ô số, lịch ngày, độ đúng, số giây, sáu tín hiệu, bốn thẻ câu);
//   · tiêu đề "Hồ sơ làm bài của em · từ 01/10" + "Thầy cũng xem hồ sơ này."; KHÔNG nút / đường của thầy (Mở hồ sơ đầy đủ, SBD, kho thiếu…);
//   · không đáp án em chọn, không mã câu nội bộ trên màn; lệnh gửi token, không SBD;
//   · khoá trang phía sau khi mở, Esc ⇒ đóng, đóng xong focus về đúng nút đã mở, gỡ khoá;
//   · chế độ thầy (mặc định) GIỮ NGUYÊN: tên em làm tiêu đề, SBD, "Mở hồ sơ đầy đủ", gọi hai lệnh thầy theo SBD.
// Số từ bộ giả của trang chụp ảnh (scripts/chup-v2/gia), bản em đi qua ĐÚNG hàm lọc của máy chủ (server/src/ho-so-em-hs-loc.ts). Tên em là tên giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu-gia.example.com/', quenDiaChiMayChu: () => {} }))

import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSuGia } from '../scripts/chup-v2/gia/lich-su-lam-cau'
import { banHocSinhHoSoThaiDo, banHocSinhLichSu } from '../server/src/ho-so-em-hs-loc'
import { THUOC_TINH_KHOA_CUON } from '../src/lib/khoa-cuon-trang'
const { default: HoSoCuaEmHs } = await import('../src/components/hoc-tap/HoSoCuaEmHs')
const { default: HoSoLamCauEm } = await import('../src/components/chien-dich/HoSoLamCauEm')

const SBD = '11010'
const TD = hoSoThaiDoGia(SBD)
const LS = lichSuGia(SBD, TD.em.hoTen)
const goiFetch: { duong: string; body: Record<string, unknown> }[] = []

beforeEach(() => {
  goiFetch.length = 0
  m.goi.mockReset()
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const duong = new URL(url).pathname
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
    goiFetch.push({ duong, body })
    const du = duong === '/hs/ho-so-thai-do' ? banHocSinhHoSoThaiDo(TD) : duong === '/hs/lich-su-lam-cau' ? banHocSinhLichSu(LS) : null
    return new Response(JSON.stringify(du ?? { ok: false, error: 'không có' }), { status: du ? 200 : 404, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute(THUOC_TINH_KHOA_CUON)
})

/** Vỏ giả của nơi mở (thẻ Hôm nay của em — làn khác): nút mở + tấm nạp sẵn. */
function VoMo({ onDong }: { onDong?: () => void }) {
  const [mo, setMo] = useState(false)
  return (
    <main>
      <button type="button" onClick={() => setMo(true)}>
        Xem hồ sơ làm bài
      </button>
      {mo && (
        <HoSoCuaEmHs
          token="tk-em"
          tenEm="Nguyễn Minh Anh"
          lop="12A1"
          onDong={() => {
            onDong?.()
            setMo(false)
          }}
        />
      )}
    </main>
  )
}

async function moTam(onDong?: () => void) {
  render(<VoMo onDong={onDong} />)
  const nut = screen.getByRole('button', { name: 'Xem hồ sơ làm bài' })
  nut.focus()
  fireEvent.click(nut)
  const tam = await screen.findByRole('dialog')
  await within(tam).findByText('Số lượt làm câu')
  await within(tam).findByText(/^Làm bài từ/)
  return { nut, tam }
}

describe('HoSoCuaEmHs — em xem ĐỦ hồ sơ của chính mình', () => {
  it('đủ mọi phần số liệu như thầy thấy; tiêu đề + dòng "Thầy cũng xem hồ sơ này."; không đường của thầy', async () => {
    const { tam } = await moTam()
    expect(tam.parentElement?.parentElement).toBe(document.body) // vẽ qua cổng vào <body>
    expect(within(tam).getByRole('heading', { level: 2 }).textContent).toBe('Hồ sơ làm bài của em · từ 01/10')
    expect(within(tam).getByText('Thầy cũng xem hồ sơ này.')).toBeTruthy()
    expect(tam.querySelector('.gvv2-hs-mat')?.textContent).toBe(`${TD.em.hoTen} · Lớp ${TD.em.lop}`) // tên + lớp của em (máy chủ), không SBD
    // đầu tấm: nhóm Nhịp học (nhãn chính) + lý do bằng số; chữ của em ("Nhịp học của em"), không "Thái độ làm bài"
    expect(within(tam).getByText(/^Nhịp học của em ·/)).toBeTruthy()
    expect(tam.textContent).not.toMatch(/Thái độ làm bài/)
    expect(within(tam).getByRole('list', { name: 'Lý do' })).toBeTruthy()
    // Hôm nay · năm ô số · lịch · độ đúng · số giây · sáu tín hiệu
    expect(tam.querySelector('.gvv2-hs-hn')).toBeTruthy()
    for (const nhan of ['Đã làm', 'Đúng', 'Sai', 'Đã ôn', 'Giây trung bình']) expect(within(tam).getAllByText(nhan, { selector: 'dt' }).length).toBeGreaterThan(0)
    for (const tieu of [/^Lịch làm bài theo ngày/, /^Độ đúng theo ngày/, /^Số giây mỗi lượt/, /^Sáu tín hiệu và ngưỡng/, /^Toàn bộ sổ của em/])
      expect(within(tam).getByRole('heading', { name: tieu })).toBeTruthy()
    expect(within(tam).getByRole('list', { name: 'Lịch làm bài theo ngày' }).children.length).toBe(TD.ngay.length)
    expect(tam.querySelectorAll('.gvv2-tdo-th-o')).toHaveLength(6)
    // bốn thẻ câu
    for (const the of [/^Câu sai/, /^Câu đúng/, /^Câu đã ôn/, /^Toàn bộ lịch sử/]) expect(within(tam).getByRole('tab', { name: the })).toBeTruthy()
    // KHÔNG đường của thầy
    expect(within(tam).queryByRole('button', { name: /Mở hồ sơ đầy đủ/ })).toBeNull()
    expect(tam.textContent).not.toMatch(/SBD|Kho thiếu|Kiến thức cần bổ sung|Ca kiểm tra, EXP, phụ huynh/)
    // nút Đóng có chữ (đích chạm ≥ 44 px do lớp gvv2-nut-chu)
    expect(within(tam).getByRole('button', { name: 'Đóng' }).className).toMatch(/gvv2-nut-chu/)
  })

  it('không đáp án em chọn, không mã câu nội bộ trên màn; lệnh gửi token, KHÔNG SBD', async () => {
    const { tam } = await moTam()
    fireEvent.click(within(tam).getByRole('tab', { name: /^Toàn bộ lịch sử/ }))
    await within(tam).findAllByText(/lượt$/, { selector: '.gvv2-hs-ngay-tieu span' })
    expect(LS.lan.some((l) => l.chon)).toBe(true) // bản thầy có "Chọn …"
    expect(tam.textContent).not.toMatch(/Chọn [A-D]/)
    expect(tam.textContent).not.toMatch(/DH-12-|c\d+\b/)
    fireEvent.click(within(tam).getByRole('tab', { name: /^Câu đúng/ }))
    expect(tam.textContent).not.toMatch(/DH-12-/)
    const duong = goiFetch.map((g) => g.duong).sort()
    expect(duong).toEqual(['/hs/ho-so-thai-do', '/hs/lich-su-lam-cau'])
    for (const g of goiFetch) {
      expect(g.body.token).toBe('tk-em')
      expect(g.body).not.toHaveProperty('sbd')
    }
    expect(m.goi).not.toHaveBeenCalled() // không một lệnh thầy nào
  })

  it('mở ⇒ khoá trang phía sau; Esc ⇒ đóng; đóng xong focus về nút đã mở và gỡ khoá', async () => {
    const onDong = vi.fn()
    const { nut, tam } = await moTam(onDong)
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(true)
    expect(document.activeElement).toBe(within(tam).getByRole('button', { name: 'Đóng' }))
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(onDong).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(false)
    expect(document.activeElement).toBe(nut)
  })

  it('máy chủ cũ (404) ⇒ một câu nói thật + nút thử lại mang tên việc, không số bịa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
    render(<VoMo />)
    fireEvent.click(screen.getByRole('button', { name: 'Xem hồ sơ làm bài' }))
    const tam = await screen.findByRole('dialog')
    expect(await within(tam).findByText(/Chưa tải được nhịp học của em\. Máy chủ chưa có hồ sơ làm bài cho học sinh/)).toBeTruthy()
    expect(within(tam).getByRole('button', { name: 'Tải lại nhịp học' })).toBeTruthy()
    expect(await within(tam).findByText(/Chưa tải được lịch sử làm câu của em/)).toBeTruthy()
  })
})

describe('HoSoLamCauEm — chế độ thầy (mặc định) giữ nguyên', () => {
  it('tên em làm tiêu đề, SBD · lớp, "Thái độ làm bài", nút "Mở hồ sơ đầy đủ"; gọi hai lệnh thầy theo SBD', async () => {
    m.goi.mockImplementation(async (duong: string) =>
      duong === '/gv/ho-so-thai-do' ? { ok: true, du: TD } : duong === '/gv/lich-su-lam-cau' ? { ok: true, du: LS } : { ok: false, loai: 'chua_co_lenh', chu: 'x' },
    )
    render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} />)
    const tam = await screen.findByRole('dialog')
    await within(tam).findByText('Số lượt làm câu')
    await within(tam).findByText(/^Thái độ làm bài ·/)
    expect(within(tam).getByRole('heading', { level: 2 }).textContent).toBe(TD.em.hoTen)
    expect(within(tam).getByText(new RegExp(`^SBD ${SBD} · Lớp `))).toBeTruthy()
    expect(within(tam).getByRole('button', { name: /Mở hồ sơ đầy đủ/ })).toBeTruthy()
    expect(tam.textContent).not.toMatch(/Thầy cũng xem hồ sơ này/)
    expect(m.goi).toHaveBeenCalledWith('/gv/ho-so-thai-do', { sbd: SBD })
    expect(m.goi).toHaveBeenCalledWith('/gv/lich-su-lam-cau', { sbd: SBD })
    expect(goiFetch).toEqual([])
    // bản thầy có đáp án em chọn ở Toàn bộ lịch sử
    fireEvent.click(within(tam).getByRole('tab', { name: /^Toàn bộ lịch sử/ }))
    expect(tam.textContent).toMatch(/Chọn [A-D]/)
  })
})
