// GAME HÓA 2.0 · Đoàn Hộ Tống — hai tấm phủ "Tung chưởng" và "Tiếp sức" đổi sang giao diện mới CHỈ khi chế độ 2.0 (cheDo2).
// Cờ tắt ⇒ đúng bản cũ (không lớp dh2-*, còn "chạm để bỏ qua"). Cách chơi y nguyên: một chạm bỏ qua, ba thẻ gọi đúng loại, "Để sau" đóng.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanTungChuong from '../src/game/than-thu-v2/DoanTungChuong'
import DoanTiepSuc from '../src/game/than-thu-v2/DoanTiepSuc'
import type { KhungNhinHiep } from '../src/game/than-thu-v2/doan-core'
import type { GheXem, GoiYTiepSuc } from '../src/game/than-thu-v2/doan-kieu'

afterEach(() => { cleanup() })
const doc = (t: string) => readFileSync(resolve(__dirname, '..', t), 'utf8')

const ghe: GheXem[] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'da_chot', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const kq: KhungNhinHiep = {
  hiep: 2, laTrum: false, tongSatThuong: 42, tongChan: 0, quaiHaGuc: 1, quaiConLai: 3, linhTamMat: 6, linhTamHoi: 0, linhTamSau: 74, trum: null,
  cuaEm: { ghe: 0, nop: true, dung: true, tuLam: true, hanhDong: 'danh', tenChieu: 'Lôi Hỏa', satThuong: 30, heSo: { dung: 1.5, lienKich: 1, anThach: 1 }, lienKich: false,
    chan: 0, hoi: 0, lan: 0, haGuc: 1, giup: null, giupThanhCong: false, duocGiupBoi: null, nangLuongSau: 2, yGiu: [], yDung: [] },
  ban: [{ ghe: 1, ra: 'don', tenChieu: 'Thủy Tiễn', satThuong: 12, haGuc: 0, lienKich: false }],
}
const goiY: GoiYTiepSuc = { den: 1, ten: 'Thu Hà', pet: 1, cap: 30, tenDang: 'Ester', de: 'Thuỷ phân ethyl acetate thu được',
  the: [{ loai: 'nhac_cong_thuc', tieuDe: 'Nhắc công thức', moTa: 'Gửi bạn kiến thức gốc' }, { loai: 'buoc_dau', tieuDe: 'Chỉ bước đầu', moTa: 'Hé bước đầu' }] }

const tung = (cheDo2: boolean, onXong = vi.fn()) => {
  render(<div className={`dh ${cheDo2 ? 'dh2' : ''}`}><DoanTungChuong kq={kq} ghe={ghe} loaiQuai="bun_acid" tenQuai="Bùn Acid" tinh={false} onXong={onXong} cheDo2={cheDo2} /></div>)
  return { onXong, phu: screen.getByRole('dialog', { name: 'Cả đội ra đòn' }) }
}
const tiep = (cheDo2: boolean) => {
  const onChon = vi.fn(), onDong = vi.fn()
  render(<div className={`dh ${cheDo2 ? 'dh2' : ''}`}><DoanTiepSuc goiY={goiY} ban={false} loi="" onChon={onChon} onDong={onDong} cheDo2={cheDo2} /></div>)
  return { onChon, onDong, tam: screen.getByRole('dialog', { name: 'Tiếp sức cho Thu Hà' }) }
}

describe('Tung chưởng · chế độ 2.0', () => {
  it('có lớp dh2-chuong, nút "Bỏ qua" thật, số sát thương có nhãn', () => {
    const { phu, onXong } = tung(true)
    expect(phu.classList.contains('dh2-chuong')).toBe(true)
    expect(phu.getAttribute('data-che-do')).toBe('2')
    expect(screen.queryByText('chạm để bỏ qua')).toBeNull()
    expect(screen.getByText('SÁT THƯƠNG CẢ ĐỘI')).toBeTruthy()
    expect(screen.getByText('−42')).toBeTruthy()
    expect(screen.getByText(/Linh Tâm mất 6 máu, còn 74 máu/).className).toContain('dh2-chuong-linh')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }))
    expect(onXong).toHaveBeenCalledTimes(1) // nút không kích thêm lần chạm nền
  })
  it('giữ cách chơi: một chạm bất kỳ bỏ qua; Esc cũng bỏ qua', () => {
    const { phu, onXong } = tung(true)
    fireEvent.click(phu); expect(onXong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onXong).toHaveBeenCalledTimes(2)
  })
})

describe('Tung chưởng · cờ tắt giữ bản cũ', () => {
  it('không lớp dh2-*, còn "chạm để bỏ qua", không nút Bỏ qua, không nhãn mới', () => {
    const { phu, onXong } = tung(false)
    expect(phu.classList.contains('dh2-chuong')).toBe(false)
    expect(phu.hasAttribute('data-che-do')).toBe(false)
    expect(screen.getByText('chạm để bỏ qua')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bỏ qua' })).toBeNull()
    expect(screen.queryByText('SÁT THƯƠNG CẢ ĐỘI')).toBeNull()
    expect(phu.querySelector('[class*="dh2-"]')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onXong).not.toHaveBeenCalled()
  })
})

describe('Tiếp sức · chế độ 2.0', () => {
  it('tấm dh2-tam; ba thẻ gọi đúng loại; thẻ thiếu bị khoá; "Để sau" và Esc đóng', () => {
    const { tam, onChon, onDong } = tiep(true)
    expect(tam.classList.contains('dh2-tam')).toBe(true)
    expect(tam.parentElement!.classList.contains('dh2-tam-nen')).toBe(true)
    expect(screen.getByText('Tiếp sức cho Thu Hà').className).toContain('dh2-baloo')
    const nhom = screen.getByRole('group', { name: 'Chọn một thẻ gợi ý' })
    const the = nhom.querySelectorAll('button')
    expect(the).toHaveLength(3)
    expect((the[1] as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(the[2]!); expect(onChon).toHaveBeenCalledWith('buoc_dau')
    fireEvent.click(screen.getByRole('button', { name: 'Để sau' })); expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onDong).toHaveBeenCalledTimes(2)
  })
})

describe('Tiếp sức · cờ tắt giữ bản cũ', () => {
  it('không lớp dh2-*, Esc không làm gì, cách chơi như cũ', () => {
    const { tam, onChon, onDong } = tiep(false)
    expect(tam.className).toBe('dh-tam')
    expect(tam.parentElement!.className).toBe('dh-tam-nen')
    expect(tam.querySelector('[class*="dh2-"]')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onDong).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Nhắc công thức/ })); expect(onChon).toHaveBeenCalledWith('nhac_cong_thuc')
  })
})

describe('Nối và kiểu', () => {
  it('DoanHoTong truyền cheDo2={laHoa2} cho cả hai tấm phủ', () => {
    const s = doc('src/game/than-thu-v2/DoanHoTong.tsx')
    expect(s).toMatch(/<DoanTungChuong [^\n]*cheDo2=\{laHoa2\}/)
    expect(s).toMatch(/<DoanTiepSuc [^\n]*cheDo2=\{laHoa2\}/)
  })
  it('mọi quy tắc tấm phủ mới nằm dưới .dh2, có nhánh giảm chuyển động, đích chạm ≥ 44 px', () => {
    const css = doc('src/game/than-thu-v2/doan2/doan2.css')
    const dong = css.split('\n').filter(d => /dh2-(chuong|tam)/.test(d) && !d.startsWith('/*') && !d.startsWith('@media') && !d.startsWith('  '))
    expect(dong.length).toBeGreaterThan(10)
    for (const d of dong) expect(d.startsWith('.dh2 ')).toBe(true)
    expect(css).toMatch(/prefers-reduced-motion:reduce\)\{\.dh2 \.dh2-chuong-bo-qua/)
    expect(css).toMatch(/\.dh2-chuong-bo-qua\{[^}]*min-height:44px/)
    expect(css).toMatch(/\.dh2-tam \.dh-tam-chan button\{min-height:44px/)
  })
})
