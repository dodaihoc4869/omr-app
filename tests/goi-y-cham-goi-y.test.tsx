// «BẮT ĐẦU TỪ ĐÂU?» — gợi ý 3 tầng (làn B, 26/10): onHoTro đúng một lần, tầng mở dần, soi sáng, sơ đồ của thầy, chạm thừa số,
// KHÔNG BAO GIỜ hiện kết quả trước khi nộp (kể cả máy chủ lỡ gửi), gợi ý tự sinh / mất mạng, nút đặt qua `nutBatDau`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'
import { VungChamDe } from '../src/components/goi-y-cham/VungChamDe'
import { docGoiYTraVe } from '../src/lib/goi-y-cham/api'
import type { GoiYTraVe } from '../src/lib/goi-y-cham/kieu'
import { BAN_PYRITE, DE_ESTER, DE_PYRITE, TU_DIEN_GIA } from './_goi-y-cham-gia'

afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-gyc-cot-phai') })

const De = ({ text }: { text: string }) => <p><ChemText text={text} /></p>
// Máy chủ «lỡ» gửi kết quả ở giai đoạn trước nộp ⇒ máy em phải tự cắt.
const BAN_LO = { ok: true, co: true, giaiDoan: 'sau', ban: BAN_PYRITE } as unknown as GoiYTraVe

describe('mở dần 3 tầng + soi sáng', () => {
  it('bấm «Bắt đầu từ đâu?» ⇒ onHoTro 1 lần, tầng 1 mở, tầng 2–3 khoá; «Gợi ý tiếp» mở dần; không lộ 76,8', async () => {
    const onHoTro = vi.fn()
    const tai = vi.fn(async () => BAN_LO)
    const { container } = render(<VungChamDe q={{ qid: 'q-pyrite' }} tuDien={TU_DIEN_GIA} onHoTro={onHoTro} taiGoiY={tai}><De text={DE_PYRITE} /></VungChamDe>)
    await screen.findByText('8%', { selector: '.gyc-v' })
    const nut = (await screen.findByRole('button', { name: /Bắt đầu từ đâu/ }))
    fireEvent.click(nut)
    expect(onHoTro).toHaveBeenCalledTimes(1)
    expect(tai).toHaveBeenCalledWith('q-pyrite')
    await screen.findByText(/Theo dấu nguyên tố S/)
    expect(screen.getByLabelText('Gợi ý 2 còn khoá')).toBeTruthy()
    expect(screen.getByLabelText('Gợi ý 3 còn khoá')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Đã mở 1 trên 3 gợi ý' })).toBeTruthy()
    // soi sáng: đề mờ, chất sáng ở tầng 1; số liệu sáng từ tầng 2
    const de = container.querySelector('.gyc-de')!
    expect(de.classList).toContain('gyc-soi')
    expect(container.querySelector('.gyc-chat')!.classList).toContain('gyc-sang')
    expect(screen.getByText('8%', { selector: '.gyc-v' }).classList).not.toContain('gyc-sang')

    fireEvent.click(screen.getByRole('button', { name: /Gợi ý tiếp/ }))
    expect(screen.getByText('Tóm tắt của thầy Đỗ Đại Học')).toBeTruthy()
    expect(screen.getByText('H = 90%')).toBeTruthy()
    expect(screen.getByText('1 tấn quặng')).toBeTruthy()
    expect(screen.getByText('m kg = ?').className).toContain('gyc-hoi-sd')
    expect(screen.getByText('Tính xuôi: × H/100').className).toContain('gyc-dung')
    expect(screen.getByText('8%', { selector: '.gyc-v' }).classList).toContain('gyc-sang')

    fireEvent.click(screen.getByRole('button', { name: /Gợi ý tiếp/ }))
    expect(screen.getByRole('group', { name: 'Một phép tính' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Gợi ý tiếp/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Em tự bấm máy tính' })).toBeTruthy()
    expect(document.body.textContent).toContain('= ?')
    expect(document.body.textContent).not.toContain('76,8')
    // đóng rồi mở lại: không gọi onHoTro lần hai
    fireEvent.click(nut); fireEvent.click(nut)
    expect(onHoTro).toHaveBeenCalledTimes(1)
  })

  it('chạm thừa số «2» ⇒ ba số trước sáng (✓), «2» đặc, các số sau mờ; bóng nói nghĩa', async () => {
    render(<VungChamDe q={{ qid: 'q-pyrite' }} tuDien={TU_DIEN_GIA} taiGoiY={async () => BAN_LO}><De text={DE_PYRITE} /></VungChamDe>)
    fireEvent.click((await screen.findByRole('button', { name: /Bắt đầu từ đâu/ })))
    await screen.findByText(/Theo dấu nguyên tố S/)
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý tiếp/ }))
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý tiếp/ }))
    expect(document.querySelector('.gyc-bong-so')!.textContent).toContain('Chạm từng số')
    const so2 = screen.getByRole('button', { name: 'Thừa số 4: 2' })
    fireEvent.click(so2)
    const thua = [...document.querySelectorAll('.gyc-thua')]
    expect(thua.slice(0, 3).every((t) => t.classList.contains('gyc-qua'))).toBe(true)
    expect(so2.classList).toContain('gyc-dang')
    expect(so2.getAttribute('aria-pressed')).toBe('true')
    expect(thua.slice(4).every((t) => t.classList.contains('gyc-sau'))).toBe(true)
    const bong = document.querySelector('.gyc-bong-so')!.textContent!
    expect(bong).toContain('bảo toàn S')
    expect(bong).toContain('tới đây là: số mol SO')
    expect(document.querySelectorAll('.gyc-dong-yn.gyc-qua svg').length).toBe(3)
    // phân số vẽ chồng (tử / mẫu)
    expect(screen.getByRole('button', { name: 'Thừa số 2: 8/100' }).querySelector('b')!.textContent).toBe('8')
    expect(screen.getByRole('button', { name: 'Thừa số 1: 10^6' }).querySelector('sup')!.textContent).toBe('6')
  })
})

describe('không có bản soạn / mất mạng / đặt nút', () => {
  it('co:false ⇒ gợi ý tự sinh từ đề (Đề cho · Đề hỏi · Bước đầu)', async () => {
    render(<VungChamDe q={{ qid: 'e1' }} tuDien={TU_DIEN_GIA} taiGoiY={async () => ({ ok: true, co: false })}><De text={DE_ESTER} /></VungChamDe>)
    await screen.findByText('8,8 gam', { selector: '.gyc-v' })
    fireEvent.click((await screen.findByRole('button', { name: /Bắt đầu từ đâu/ })))
    await screen.findByText(/^Đề cho/, { selector: '.gyc-t-ten' })
    expect(document.querySelector('.gyc-goi-y .gyc-chip.gyc-tin')!.textContent).toBe('8,8 gam')
  })

  it('lỗi mạng ⇒ báo «Chưa tải được gợi ý» + Thử lại, kèm gợi ý tự sinh', async () => {
    const tai = vi.fn(async () => null)
    render(<VungChamDe q={{ qid: 'e2' }} tuDien={TU_DIEN_GIA} taiGoiY={tai}><De text={DE_ESTER} /></VungChamDe>)
    fireEvent.click((await screen.findByRole('button', { name: /Bắt đầu từ đâu/ })))
    await screen.findByText(/Chưa tải được gợi ý soạn sẵn/)
    expect(screen.getByText(/^Đề cho/, { selector: '.gyc-t-ten' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(tai).toHaveBeenCalledTimes(2))
  })

  it('không có token/phiên ⇒ không gọi mạng, gợi ý tự sinh', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    render(<VungChamDe q={{ qid: 'e3' }} tuDien={TU_DIEN_GIA}><De text={DE_ESTER} /></VungChamDe>)
    fireEvent.click((await screen.findByRole('button', { name: /Bắt đầu từ đâu/ })))
    await screen.findByText(/^Đề cho/, { selector: '.gyc-t-ten' })
    expect(f).not.toHaveBeenCalled()
    f.mockRestore()
  })

  it('nutBatDau ⇒ màn tự đặt nút ở hàng nút đáy; mở gợi ý ⇒ <html data-gyc-cot-phai>', async () => {
    render(<>
      <VungChamDe q={{ qid: 'e4' }} tuDien={TU_DIEN_GIA} nutBatDau={(nut) => <div data-testid="hang-day">{nut}</div>}><De text={DE_ESTER} /></VungChamDe>
    </>)
    const nut = (await screen.findByRole('button', { name: /Bắt đầu từ đâu/ }))
    expect(screen.getByTestId('hang-day').contains(nut)).toBe(true)
    fireEvent.click(nut)
    await screen.findByText('Bắt đầu từ đâu?', { selector: 'h2' })
    expect(document.documentElement.hasAttribute('data-gyc-cot-phai')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Em tự làm tiếp' }))
    await waitFor(() => expect(document.documentElement.hasAttribute('data-gyc-cot-phai')).toBe(false))
  })
})

describe('đọc chặt phản hồi máy chủ', () => {
  it('trước nộp: mọi ketQua bị cắt; sau nộp: giữ', () => {
    const truoc = docGoiYTraVe({ ok: true, co: true, giaiDoan: 'truoc', ban: BAN_PYRITE })
    expect(truoc && truoc.co && truoc.ban.ketQua).toBeFalsy()
    expect(truoc && truoc.co && truoc.ban.buoc[0].ketQua).toBeFalsy()
    const sau = docGoiYTraVe({ ok: true, co: true, giaiDoan: 'sau', ban: BAN_PYRITE })
    expect(sau && sau.co && sau.ban.ketQua).toBe('76,8')
    expect(docGoiYTraVe({ ok: true, co: true, giaiDoan: 'truoc', ban: { qid: 'x' } })).toEqual({ ok: true, co: false })
    expect(docGoiYTraVe({ ok: false })).toBeNull()
    expect(docGoiYTraVe({ ok: true, co: true, ban: { ...BAN_PYRITE, soDo: { nut: [{ chat: 'A', soLieu: [] }], muiTen: [], chieu: 'xuoi' } } })).toMatchObject({ co: true })
  })
})
