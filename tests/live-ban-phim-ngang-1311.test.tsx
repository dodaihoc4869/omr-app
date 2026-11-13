// @vitest-environment jsdom
// BÀN PHÍM TRONG APP của ngăn «Tin nhắn lớp» máy em (thầy 13/11 «ép bàn phím xoay ngang»): hình live đang xoay 90° thì bàn phím hệ thống nằm ngang chữ
// ⇒ ngăn tự vẽ bàn phím nằm ngang theo hình, chữ gõ đi qua bộ gõ Telex; ô nhập không gọi bàn phím hệ thống.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import BanPhimNgang from '../src/components/live-khoi/BanPhimNgang'
import { NganChatEm, type ChatLop } from '../src/components/live-khoi/ChatEm'
import type { TinChat } from '../src/lib/live-khoi/chat-loi'

afterEach(() => { cleanup(); vi.useRealTimers() })

const tin = (o: Partial<TinChat>): TinChat => ({ id: '1-S1', sbd: 'S1', ten: 'Nguyễn Thị Hà', doi: 1, luc: Date.parse('2026-11-13T12:50:00Z'), chu: 'Em hiểu rồi ạ', hoi: false, thay: false, ...o })
function dung(banPhimRieng: boolean, khoa = false, ketQua: ReturnType<ChatLop['gui']> = 'ok') {
  const gui = vi.fn(() => ketQua)
  const chat = { ds: [tin({}), tin({ id: '3-gv', sbd: 'gv', ten: 'Thầy', doi: -1, chu: 'Carbon dioxide', thay: true })], khoa, moi: 0, tinMoi: null, gui, danhDauDoc: vi.fn() } as unknown as ChatLop
  const r = render(<NganChatEm chat={chat} toiSbd="S1" soEm={62} ghim={false} coGhim={false} tieuDiem={0} onDong={vi.fn()} onGhim={vi.fn()} banPhimRieng={banPhimRieng} />)
  const ngan = r.container.querySelector<HTMLElement>('.lc-ngan')!
  const o = ngan.querySelector('input')!
  /** Bấm lần lượt các phím: mỗi mục là chữ trên phím, hoặc tên phím chức năng. */
  const bam = (...ds: string[]) => {
    for (const k of ds) {
      const p = [...ngan.querySelectorAll<HTMLButtonElement>('.lc-bp button')].find((b) => b.getAttribute('aria-label') === k || (!b.getAttribute('aria-label') && b.textContent === k))
      if (!p) throw new Error(`không thấy phím «${k}»`)
      fireEvent.pointerDown(p); fireEvent.pointerUp(p)
    }
  }
  const go = (chu: string) => bam(...[...chu].map((c) => (c === ' ' ? 'Dấu cách' : c)))
  return { ...r, gui, ngan, o, bam, go }
}
const HOA = 'Chữ hoa', SO = 'Sang số và dấu', CHU = 'Về bàn phím chữ', XOA = 'Xoá lùi', GUI = 'Gửi tin'

describe('bàn phím trong app của ngăn tin nhắn', () => {
  it('banPhimRieng: ô nhập chỉ-đọc + không gọi bàn phím hệ thống; bàn phím 4 hàng 10 / 9 / 7 phím chữ, Shift đầu và xoá lùi cuối hàng 3, hàng 4 «123 · dấu cách · Gửi»; có dòng mẹo Telex', () => {
    const { ngan, o } = dung(true)
    expect(o.readOnly).toBe(true); expect(o.getAttribute('inputmode')).toBe('none'); expect(ngan.classList.contains('lc-bpr')).toBe(true)
    const hang = [...ngan.querySelectorAll('.lc-bp-h')].map((h) => [...h.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? b.textContent))
    expect(hang).toEqual([[...'qwertyuiop'], [...'asdfghjkl'], [HOA, ...'zxcvbnm', XOA], [SO, 'Dấu cách', GUI]])
    expect(ngan.querySelector('.lc-bp-meo')!.textContent).toBe('Gõ kiểu Telex: aa â · dd đ · s f r x j')
    expect(ngan.querySelector('.lc-bp')!.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
    // bàn phím nằm ngay dưới ô nhập; con trỏ nháy vẽ ở cuối chữ
    expect(ngan.querySelector('.lc-nhap')!.nextElementSibling).toBe(ngan.querySelector('.lc-bp')); expect(ngan.querySelector('.lc-bp-hien > span > i')).not.toBeNull()
  })
  it('bấm phím ⇒ chữ có dấu trong ô nhập (Telex); bản vẽ lại hiện đúng chữ đó', () => {
    const { o, go, ngan } = dung(true)
    go('thaayf owi cho em hoir')
    expect(o.value).toBe('thầy ơi cho em hỏi'); expect(ngan.querySelector('.lc-bp-hien')!.textContent).toBe('thầy ơi cho em hỏi')
  })
  it('Shift một lần = MỘT chữ hoa rồi về thường; hai lần = khoá hoa; lần ba = thôi', () => {
    const { o, go, bam, ngan } = dung(true)
    const shift = () => ngan.querySelector<HTMLButtonElement>('.lc-bp-h button.rong')!
    bam(HOA); expect(shift().getAttribute('aria-pressed')).toBe('true'); expect(ngan.querySelectorAll('.lc-bp-h')[0]!.textContent).toBe('QWERTYUIOP')
    bam('T'); expect(ngan.querySelectorAll('.lc-bp-h')[0]!.textContent).toBe('qwertyuiop'); expect(shift().getAttribute('aria-pressed')).toBe('false')
    go('haayf'); expect(o.value).toBe('Thầy')
    bam(HOA, HOA); expect(shift().getAttribute('aria-label')).toBe('Đang khoá chữ hoa')
    go(' NAOH'); expect(o.value).toBe('Thầy NAOH'); expect(ngan.querySelectorAll('.lc-bp-h')[0]!.textContent).toBe('QWERTYUIOP')
    bam('Đang khoá chữ hoa'); expect(shift().getAttribute('aria-label')).toBe(HOA); go('a'); expect(o.value).toBe('Thầy NAOHa')
  })
  it('lớp số và dấu: đủ 0–9 , . ? ! ( ) + - = →; công thức CH3COONa gõ ra nguyên vẹn; «ABC» về lại chữ', () => {
    const { o, go, bam, ngan } = dung(true)
    bam(SO)
    const so = [...ngan.querySelectorAll('.lc-bp-h')].slice(0, 2).map((h) => h.textContent)
    expect(so).toEqual(['1234567890', ',.?!()+-=→']); expect(ngan.querySelector(`.lc-bp-h button[aria-label="${CHU}"]`)!.textContent).toBe('ABC'); expect(ngan.querySelector(`.lc-bp-h button[aria-label="${HOA}"]`)).toBeNull()
    bam(CHU, HOA, HOA); go('CH'); bam(SO, '3', CHU); go('COON'); bam('Đang khoá chữ hoa'); go('a'); bam(SO); go(' = ?')
    expect(o.value).toBe('CH3COONa = ?')
  })
  it('xoá lùi: bấm một lần xoá một ký tự (chữ có dấu là một); GIỮ thì xoá lặp sau 380 ms, mỗi 70 ms, thả ra thì thôi', () => {
    vi.useFakeTimers()
    const { o, go, ngan } = dung(true)
    go('dduwowcj khoong'); expect(o.value).toBe('được không')
    const xoa = [...ngan.querySelectorAll<HTMLButtonElement>('.lc-bp button')].find((b) => b.getAttribute('aria-label') === XOA)!
    fireEvent.pointerDown(xoa); fireEvent.pointerUp(xoa); expect(o.value).toBe('được khôn')
    fireEvent.pointerDown(xoa); expect(o.value).toBe('được khô')
    act(() => { vi.advanceTimersByTime(379) }); expect(o.value).toBe('được khô')
    act(() => { vi.advanceTimersByTime(1) }); expect(o.value).toBe('được kh')
    act(() => { vi.advanceTimersByTime(140) }); expect(o.value).toBe('được ')
    fireEvent.pointerUp(xoa)
    act(() => { vi.advanceTimersByTime(1000) }); expect(o.value).toBe('được ')
  })
  it('«Gửi» gọi chat.gui với chuỗi đã gõ rồi xoá ô nhập; nút gửi cạnh ô nhập cũng vậy; gửi chưa được (nhanh quá) thì giữ chữ', () => {
    const a = dung(true)
    a.go('em chuwa hieeur aj'); a.bam(GUI)
    expect(a.gui).toHaveBeenCalledWith('em chưa hiểu ạ'); expect(a.o.value).toBe('')
    a.go('aj'); fireEvent.submit(a.ngan.querySelector('form')!); expect(a.gui).toHaveBeenLastCalledWith('ạ'); expect(a.o.value).toBe('')
    cleanup()
    const b = dung(true, false, 'nhanh-qua')
    b.go('aj'); b.bam(GUI); expect(b.gui).toHaveBeenCalledWith('ạ'); expect(b.o.value).toBe('ạ'); expect(b.ngan.querySelector('.lc-bao')!.textContent).toBe('Chờ 2 giây rồi gửi tiếp')
  })
  it('không gõ quá 200 ký tự; thầy tắt nhắn tin ⇒ cả bàn phím khoá, bấm không ra chữ', () => {
    const a = dung(true)
    a.go('m'.repeat(205)); expect(a.o.value).toHaveLength(200)
    cleanup()
    const b = dung(true, true)
    expect([...b.ngan.querySelectorAll<HTMLButtonElement>('.lc-bp button')].every((p) => p.disabled)).toBe(true)
    b.go('a'); expect(b.o.value).toBe(''); expect(b.ngan.querySelector('.lc-bp-hien i')).toBeNull()
  })
  it('banPhimRieng = false (màn ngang thật, máy tính): không có bàn phím trong app, ô nhập gõ bằng bàn phím hệ thống như cũ', () => {
    const { ngan, o } = dung(false)
    expect(ngan.querySelector('.lc-bp')).toBeNull(); expect(ngan.querySelector('.lc-bp-hien')).toBeNull(); expect(ngan.classList.contains('lc-bpr')).toBe(false)
    expect(o.readOnly).toBe(false); expect(o.hasAttribute('inputmode')).toBe(false)
    fireEvent.change(o, { target: { value: 'aa' } }); expect(o.value).toBe('aa') // không qua Telex
  })
  it('bàn phím đứng riêng: phát đúng phím; bấm không cướp tiêu điểm (chặn mặc định của pointerdown)', () => {
    const onPhim = vi.fn(), onXoa = vi.fn(), onGui = vi.fn()
    const { getByText, getByLabelText } = render(<BanPhimNgang onPhim={onPhim} onXoa={onXoa} onGui={onGui} />)
    expect(fireEvent.pointerDown(getByText('q'))).toBe(false); expect(onPhim).toHaveBeenLastCalledWith('q')
    fireEvent.pointerDown(getByLabelText('Dấu cách')); expect(onPhim).toHaveBeenLastCalledWith(' ')
    fireEvent.pointerDown(getByLabelText(XOA)); fireEvent.pointerUp(getByLabelText(XOA)); expect(onXoa).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(getByLabelText(GUI)); expect(onGui).toHaveBeenCalledTimes(1)
  })
  it('mã nguồn: hẹn giờ nối chuỗi (không setInterval); CSS chỉ dùng biến màu, phím cao 38 px (viên 36 px), touch-action: manipulation; LopNoiEm bật bàn phím đúng lúc hình xoay', () => {
    const ma = readFileSync('src/components/live-khoi/BanPhimNgang.tsx', 'utf8')
    expect(ma).not.toMatch(/setInterval/); expect(ma).toMatch(/onPointerDown/); expect(ma).toMatch(/preventDefault\(\)/)
    const css = readFileSync('src/components/live-khoi/chat.css', 'utf8'), bp = css.slice(css.indexOf('BÀN PHÍM TRONG APP'))
    expect(bp).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
    expect(bp).toMatch(/\.lc-goc \.lc-bp-p \{[^}]*height: 38px; padding: 1px 2px;[^}]*touch-action: manipulation;/)
    expect(bp).toMatch(/\.lc-ngan\.lc-bpr \.lc-dau, \.lc-ngan\.lc-bpr \.lc-nhanh \{ display: none; \}/)
    expect(bp).toMatch(/@container \(min-height: 436px\) \{ \.lc-ngan\.lc-bpr \.lc-nhanh \{ display: flex; \} \}/)
    expect(readFileSync('src/components/live-khoi/LopNoiEm.tsx', 'utf8')).toMatch(/<NganChatEm [^>]*banPhimRieng=\{xoay\}/)
  })
})
