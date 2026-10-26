// «CHẠM ĐỂ HIỂU ĐỀ» (làn B, 26/10): tô màu sẵn, giữ nguyên cấu trúc đề (sub/sup), chạm mở/đóng thẻ giải nghĩa, Tab/Enter/Esc,
// màn cha vẽ lại / sang câu mới không vỡ DOM, gỡ bọc trả DOM y như cũ, `tat` ⇒ đề trơn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { ChemText } from '../src/lib/chem-format'
import { VungChamDe } from '../src/components/goi-y-cham/VungChamDe'
import { bocVung } from '../src/components/goi-y-cham/boc-chu'
import { DE_ESTER, DE_PYRITE, TU_DIEN_GIA, phatHienGia } from './_goi-y-cham-gia'

afterEach(() => { cleanup(); try { sessionStorage.clear() } catch { /* */ } })

function De({ text, stt = 1 }: { text: string; stt?: number }) {
  return <p className="de"><b>Câu {stt}.</b> <ChemText text={text} /><img alt="hình đề" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" /></p>
}
const cho = async (chu: string) => { const el = await screen.findByText(chu, { selector: '.gyc-v' }); return el as HTMLElement }

describe('tô màu sẵn + giữ cấu trúc đề', () => {
  it('đề cho / đề hỏi / chất / từ then chốt có lớp riêng; chữ đề và thẻ <img> giữ nguyên', async () => {
    const { container } = render(<VungChamDe q={{ qid: 'q1' }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
    const p = container.querySelector('p.de')!
    const truoc = p.textContent
    expect((await cho('8,8 gam')).classList).toContain('gyc-cho')
    expect((await cho('Giá trị của m là')).classList).toContain('gyc-hoi')
    expect((await cho('ethyl acetate')).classList).toContain('gyc-chat')
    expect((await cho('Cô cạn')).classList).toContain('gyc-dam')
    expect(p.textContent).toBe(truoc)
    expect(p.querySelector('img')).not.toBeNull()
    expect(p.querySelector('b')!.textContent).toBe('Câu 1.')
    // Đề hỏi không có thẻ giải nghĩa (theCho = null) ⇒ không nhận Tab
    expect((await cho('Giá trị của m là')).tabIndex).toBe(-1)
    expect((await cho('8,8 gam')).tabIndex).toBe(0)
    // dải chú giải
    expect(screen.getByText('Chạm chữ tô màu để hiểu đề')).toBeTruthy()
  })

  it('công thức có chỉ số dưới (FeS₂): <sub> giữ nguyên, vùng thành nhiều mảnh cùng data-vung', async () => {
    const { container } = render(<VungChamDe q={{ qid: 'q2' }} tuDien={TU_DIEN_GIA}><De text={DE_PYRITE} /></VungChamDe>)
    await cho('8%')
    const sub = [...container.querySelectorAll('sub')].find((s) => s.textContent === '2' && s.previousSibling?.textContent?.endsWith('FeS'))
      ?? [...container.querySelectorAll('sub')][0]
    expect(sub).toBeTruthy()
    const manh = container.querySelectorAll('.gyc-chat.gyc-nhieu')
    expect(manh.length).toBeGreaterThanOrEqual(2)
    expect(sub!.querySelector('.gyc-v')).not.toBeNull() // mảnh chữ nằm TRONG <sub>, <sub> không bị dời
  })
})

describe('chạm mở / đóng thẻ giải nghĩa', () => {
  it('chạm «1,5 M» ⇒ thẻ đơn vị; «Đã hiểu» đóng; không gọi onHoTro', async () => {
    const onHoTro = vi.fn()
    render(<VungChamDe q={{ qid: 'q3' }} tuDien={TU_DIEN_GIA} onHoTro={onHoTro}><De text={DE_ESTER} /></VungChamDe>)
    fireEvent.click(await cho('1,5 M'))
    const the = await screen.findByRole('dialog', { name: /M · nồng độ mol/ })
    expect(the.textContent).toContain('Nhớ đổi: 1000 mL = 1 L')
    expect((await cho('1,5 M')).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onHoTro).not.toHaveBeenCalled()
  })

  it('chạm chất ⇒ tên + tên cũ + M; chạm lần nữa (đã ghim) ⇒ đóng; chạm ra ngoài ⇒ đóng', async () => {
    const { container } = render(<VungChamDe q={{ qid: 'q4' }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
    const naoh = await cho('NaOH')
    fireEvent.click(naoh)
    const the = await screen.findByRole('dialog')
    expect(the.textContent).toContain('sodium hydroxide')
    expect(the.textContent).toContain('tên cũ: natri hiđroxit')
    expect(the.textContent).toContain('M = 40 g/mol')
    fireEvent.click(naoh)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(naoh)
    await screen.findByRole('dialog')
    fireEvent.pointerDown(container.querySelector('p b')!)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('Tab tới chữ, Enter mở (không lọt ra phím của màn), Esc đóng và trả con trỏ về chữ', async () => {
    const phimMan = vi.fn()
    window.addEventListener('keydown', phimMan)
    try {
      render(<VungChamDe q={{ qid: 'q5' }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
      const v = await cho('8,8 gam')
      v.focus()
      fireEvent.keyDown(v, { key: 'Enter' })
      await screen.findByRole('dialog')
      expect(phimMan).not.toHaveBeenCalled()
      await waitFor(() => expect(document.activeElement?.textContent).toBe('Đã hiểu'))
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(document.activeElement).toBe(v)
    } finally { window.removeEventListener('keydown', phimMan) }
  })
})

describe('an toàn DOM', () => {
  it('màn cha vẽ lại (chọn đáp án) rồi sang câu mới: không lỗi, câu mới được tô lại', async () => {
    const loi = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Man() {
      const [cau, setCau] = useState(0), [chon, setChon] = useState('')
      const de = [DE_ESTER, DE_PYRITE][cau]
      return <>
        <VungChamDe q={{ qid: `c${cau}` }} tuDien={TU_DIEN_GIA}><De text={de} stt={cau + 1} /><span>đã chọn {chon || 'chưa'}</span></VungChamDe>
        <button onClick={() => setChon('B')}>chọn B</button>
        <button onClick={() => setCau(1)}>câu sau</button>
      </>
    }
    render(<Man />)
    await cho('8,8 gam')
    fireEvent.click(screen.getByText('chọn B'))
    expect(screen.getByText('đã chọn B')).toBeTruthy()
    expect(document.querySelectorAll('.gyc-v').length).toBeGreaterThan(3)
    fireEvent.click(screen.getByText('câu sau'))
    await cho('90%')
    expect(screen.queryByText('8,8 gam')).toBeNull()
    expect(document.querySelector('p b')!.textContent).toBe('Câu 2.')
    expect(loi.mock.calls.filter((c) => /removeChild|insertBefore|NotFoundError/.test(String(c[0])))).toEqual([])
    loi.mockRestore()
  })

  it('bocVung rồi go() ⇒ DOM y hệt ban đầu (StrictMode chạy hai lần vẫn đúng)', () => {
    const { container } = render(<De text={DE_PYRITE} />)
    const goc = container.firstElementChild as HTMLElement
    const truoc = goc.innerHTML
    const nutGoc = [...goc.querySelectorAll('span')].flatMap((s) => [...s.childNodes].filter((n) => n.nodeType === 3))
    const kq = bocVung(goc, phatHienGia, () => true)
    expect(kq.vung.length).toBeGreaterThan(4)
    expect(goc.innerHTML).not.toBe(truoc)
    for (const n of nutGoc) expect(n.isConnected).toBe(true) // nút chữ React đang giữ không bao giờ bị dời khỏi chỗ
    kq.go()
    expect(goc.innerHTML).toBe(truoc)
    const kq2 = bocVung(goc, phatHienGia, () => true)
    kq2.go()
    expect(goc.innerHTML).toBe(truoc)
  })

  it('phatHien ném lỗi / trả vùng hỏng ⇒ đề trơn, không vỡ', () => {
    const { container } = render(<De text={DE_ESTER} />)
    const goc = container.firstElementChild as HTMLElement
    const truoc = goc.innerHTML
    expect(bocVung(goc, () => { throw new Error('x') }, () => true).vung).toEqual([])
    expect(bocVung(goc, () => [{ loai: 'cho', tu: 5, den: 2, chu: '' }, { loai: 'xyz' as never, tu: 0, den: 3, chu: '' }], () => true).vung).toEqual([])
    expect(goc.innerHTML).toBe(truoc)
  })

  it('tat ⇒ trả nguyên children, không nút, không tô', async () => {
    const { container } = render(<VungChamDe q={{ qid: 'q6' }} tuDien={TU_DIEN_GIA} tat><De text={DE_ESTER} /></VungChamDe>)
    await act(async () => { await new Promise((r) => setTimeout(r, 30)) })
    expect(container.querySelector('.gyc-v')).toBeNull()
    expect(screen.queryByRole('button', { name: /Bắt đầu từ đâu/ })).toBeNull()
  })
})

describe('chú giải màu: 3 câu đầu mỗi phiên, sau đó thu thành nút «?»', () => {
  it('câu thứ 4 ⇒ nút «?» 44px mở lại chú giải', async () => {
    for (const qid of ['a', 'b', 'c']) {
      const r = render(<VungChamDe q={{ qid }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
      await screen.findByText('Chạm chữ tô màu để hiểu đề')
      r.unmount()
    }
    render(<VungChamDe q={{ qid: 'd' }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
    const nut = await screen.findByRole('button', { name: 'Xem chú giải màu' })
    expect(screen.queryByText('Chạm chữ tô màu để hiểu đề')).toBeNull()
    fireEvent.click(nut)
    expect(screen.getByText('Chạm chữ tô màu để hiểu đề')).toBeTruthy()
  })
})

describe('lõi THẬT của làn A (không truyền tuDien)', () => {
  it('nạp lười phat-hien + the-cham: «1,5 M» là đề cho, chạm NaOH ra sodium hydroxide + M = 40', async () => {
    render(<VungChamDe q={{ qid: 'that' }}><De text={DE_ESTER} /></VungChamDe>)
    const m = await screen.findByText('1,5 M', { selector: '.gyc-v' }, { timeout: 4000 })
    expect(m.classList).toContain('gyc-cho')
    fireEvent.click(await screen.findByText('NaOH', { selector: '.gyc-v' }))
    const the = await screen.findByRole('dialog')
    expect(the.textContent).toContain('sodium hydroxide')
    expect(the.textContent).toContain('M = 40 g/mol')
  })

  it('câu lý thuyết (không số liệu): chỉ tô «Đề hỏi», không tô chất / từ then chốt', async () => {
    const { container } = render(<VungChamDe q={{ qid: 'lt' }}><p><ChemText text="Phát biểu nào sau đây không đúng về khí nitrogen N2 khi đun nóng?" /></p></VungChamDe>)
    await waitFor(() => expect(container.querySelector('.gyc-hoi')).not.toBeNull(), { timeout: 4000 })
    expect(container.querySelector('.gyc-chat, .gyc-dam, .gyc-cho')).toBeNull()
  })
})
