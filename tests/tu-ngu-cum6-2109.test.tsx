// TỪ NGỮ · CỤM 6 (nút, hộp thoại, emoji — bảng duyệt docs/ra-soat-tu-ngu-2109-code2.md, 21/09): khoá chữ mới ở Võ đài, Đoàn Hộ Tống,
// Khiên, bài Mom, phiếu; và khoá "không emoji" ở các tệp chữ hiện cho học sinh (biểu tượng nét thay vào).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { it, expect, vi, afterEach, describe } from 'vitest'
import { render, screen, fireEvent, cleanup, within, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/SpiritArt', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/EscortGuide', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: () => {}, playBattleSound: () => {}, battleMuted: () => true, setBattleMuted: () => {} }))
vi.mock('../src/game/than-thu-v2/EscortQuestion', () => ({ default: ({ onAnswered }: { onAnswered: (n: number) => void }) => <button onClick={() => onAnswered(2)}>Chấm câu thử</button> }))
import EscortRoom from '../src/game/than-thu-v2/EscortRoom'
import ImmortalShield from '../src/game/than-thu-v2/ImmortalShield'
import { newEscort, player } from '../src/game/than-thu-v2/escort-core'
import { JS_PHIEU } from '../src/lib/html-phieu'

// Chạy chung cả bộ 8000 test máy rất nặng: nới hạn chờ của findBy để không đỏ oan vì chậm (không đo thời gian ở đây).
configure({ asyncUtilTimeout: 8000 })
afterEach(() => { cleanup(); sessionStorage.clear() })

const doc = (tep: string) => readFileSync(resolve(__dirname, '..', tep), 'utf8')
// Chữ tượng hình (emoji) + vài ký hiệu hay bị máy vẽ thành emoji. Chỉ soi tệp có chữ HIỆN cho học sinh/phụ huynh.
const EMOJI = /[\u{1F300}-\u{1FAFF}✨⏳⚔❤⚡✅❌]/u
const DONG_LENH = /^\s*(\/\/|\*|\/\*|\{\/\*)/

describe('cụm 6 · không còn emoji ở chữ hiện cho em', () => {
  const TEP = [
    'src/game/than-thu-v2/EscortRoom.tsx',
    'src/game/than-thu-v2/DoanSanh.tsx',
    'src/game/than-thu-v2/DoanTiepSuc.tsx',
    'src/game/than-thu-v2/ImmortalShield.tsx',
    'src/components/bang-nhiem-vu/MomM3.tsx',
    'src/lib/html-phieu.ts',
  ]
  for (const t of TEP) {
    it(`${t} không có emoji`, () => {
      const dong = doc(t).split('\n').map((d, i) => ({ d, i: i + 1 })).filter(x => !DONG_LENH.test(x.d) && EMOJI.test(x.d))
      expect(dong.map(x => `${x.i}: ${x.d.trim().slice(0, 80)}`)).toEqual([])
    })
  }
  it('cổng học sinh: hai chip Mom "Đã nộp" / "Đang làm" không dùng ✓ và ⏳', () => {
    const s = doc('src/screens/StudentPortalScreen.tsx')
    expect(s).not.toContain('✓ Đã nộp')
    expect(s).not.toContain('⏳ Đang làm')
  })
  it('phiếu: kịch bản mở toàn bộ câu dùng biểu tượng SVG kèm chữ, không dùng ✨', () => {
    expect(JS_PHIEU).not.toContain('✨')
  })
})

describe('cụm 6 · Võ đài (G10–G13)', () => {
  it('sảnh: "Đấu đội", "Nhập mã phòng", "Quái trùm"; không còn PvP / Boss / mã LT', () => {
    const { container } = render(<EscortRoom active storageKey="cum6" call={vi.fn(async () => ({}))} />)
    const chu = container.textContent!
    expect(chu).toContain('Luyện với Quái trùm')
    expect(chu).toContain('Đấu đội')
    expect(chu).not.toMatch(/PvP|Boss/)
    expect(screen.getByPlaceholderText('Nhập mã phòng')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Chọn thể thức đấu đội' })).toBeTruthy()
  })
  it('trong phòng: "Tải lại phòng"; nút xác nhận nói việc sẽ làm ("Đi ô này" / "Dùng chiêu này") và chiêu tốn "2 năng lượng"', async () => {
    const base = newEscort('1', 1, 1, Date.now())
    const room = { ...base, id: 'LTcum6', owner: true, started: true, revision: 1, deadline: Date.now() + 480000, players: [{ ...player('p0', 1, 1, 0), self: true, ready: false, alias: 'Rồng Lam' }, { ...player('p1', 2, 1, 1), self: false, ready: false, alias: 'Quái' }] }
    sessionStorage.setItem('escort:cum6', room.id)
    const call = vi.fn(async () => ({ escort: room }))
    render(<EscortRoom active storageKey="cum6" call={call} />)
    await screen.findByText(/Phòng LTcum6/)
    expect(screen.getByRole('button', { name: 'Tải lại phòng' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cập nhật' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ô 2,2' }))
    fireEvent.click(screen.getByText('Chấm câu thử'))
    fireEvent.click(await screen.findByRole('button', { name: 'Di chuyển', exact: true }))
    expect(screen.getByRole('button', { name: 'Xác nhận Di chuyển' }).textContent).toContain('Đi ô này')
    fireEvent.click(screen.getByRole('button', { name: 'Tung chưởng', exact: true }))
    const hop = screen.getByRole('group', { name: 'Tung chưởng' })
    expect(within(hop).getByRole('button', { name: 'Xác nhận Tung chưởng' }).textContent).toContain('Dùng chiêu này')
    expect(hop.textContent).toContain('Tốn 2 năng lượng')
    expect(document.body.textContent).not.toContain('Thực hiện')
  })
})

describe('cụm 6 · Khiên (G21): tên ngắn + một dòng nói ĐÚNG tác dụng trong mã', () => {
  it('"Khiên · N lượt", nút "Dùng khiên", dòng phụ "hiện 10 giây và trừ 1 lượt"; hết chữ "chống đuổi"', () => {
    const onUse = vi.fn(async () => ({}))
    const { container } = render(<ImmortalShield level={34} busy={false} onUse={onUse} />)
    const chu = container.textContent!
    expect(chu).toContain('Khiên · 3 lượt')
    expect(chu).toContain('Mỗi lần dùng: khiên hiện 10 giây và trừ 1 lượt.')
    expect(chu).not.toContain('chống đuổi')
    fireEvent.click(screen.getByRole('button', { name: 'Dùng khiên' }))
    expect(onUse).toHaveBeenCalledTimes(1)
  })
})

describe('cụm 6 · nút phiếu (H40)', () => {
  it('nút trên phiếu nói việc sẽ làm: "Ẩn lời giải", "Mở hết lời giải", "Đóng hết lời giải"', () => {
    const s = doc('src/lib/html-phieu.ts')
    expect(s).toContain('<span class="chu-mo">Ẩn lời giải</span><span class="chu-dong">Hiện cả lời giải</span>')
    expect(s).toContain('<span class="chu-mo">Mở hết lời giải</span><span class="chu-dong">Đóng hết lời giải</span>')
    expect(s).not.toContain('<span class="chu-mo">Hiện đề</span>')
    expect(s).not.toContain('<span class="chu-mo">Mở tất cả</span>')
  })
})
