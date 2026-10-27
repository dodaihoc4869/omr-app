// @vitest-environment jsdom
// «BẮT ĐẦU TỪ ĐÂU?» CHỈ HIỆN KHI CÂU CÓ GỢI Ý THẬT (thầy 27/10, ảnh câu lý thuyết «Phát biểu nào…»: «Câu nào không có Bắt đầu từ đâu thì ẩn đi nhé, có
// mới hiện»). Khoá:
//  (1) câu tính có số liệu / câu có cốt lõi thầy soạn ⇒ có nút ngay, KHÔNG hỏi máy chủ trước;
//  (2) câu lý thuyết không số liệu, không cốt lõi ⇒ hỏi máy chủ có bản sơ đồ không (KHÔNG kèm phiên ⇒ không bị tính «có trợ giúp»): không có ⇒ không nút;
//      có ⇒ nút hiện;
//  (3) trong tấm bóng đèn Duo: câu lý thuyết không gợi ý ⇒ chỉ còn «Hỏi thầy», bóng đèn vẫn hiện, KHÔNG chấm «chưa xem»; câu tính ⇒ đủ dòng + chấm.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChemText } from '../src/lib/chem-format'
import { VungChamDe } from '../src/components/goi-y-cham/VungChamDe'
import { TroGiupDuo } from '../src/components/hoc-tap/TroGiupDuo'
import { taiGoiYSoDo } from '../src/lib/goi-y-cham/api'
import type { GoiYTraVe } from '../src/lib/goi-y-cham/kieu'
import { BAN_PYRITE, DE_ESTER, TU_DIEN_GIA } from './_goi-y-cham-gia'

vi.mock('../src/lib/goi-y-cham/api', async (goc) => ({ ...await goc<typeof import('../src/lib/goi-y-cham/api')>(), taiGoiYSoDo: vi.fn(async () => ({ ok: true, co: false })) }))
afterEach(() => { cleanup(); vi.mocked(taiGoiYSoDo).mockClear() })

const DE_LY_THUYET = 'Phát biểu nào sau đây đúng?'
const KHONG = { ok: true, co: false } as GoiYTraVe
const CO_BAN = { ok: true, co: true, giaiDoan: 'truoc', ban: BAN_PYRITE } as unknown as GoiYTraVe
const De = ({ text }: { text: string }) => <p><ChemText text={text} /></p>
const nutBatDau = () => screen.queryByRole('button', { name: /Bắt đầu từ đâu/ })
/** Chờ ruột nạp xong + qua lượt hỏi máy chủ (300 ms sau khi bọc chữ đề). */
const choRuot = () => act(() => new Promise((r) => setTimeout(r, 700)))

describe('ruột chạm-hiểu-đề: nút «Bắt đầu từ đâu?» chỉ khi có gợi ý thật', () => {
  it('câu tính có số liệu ⇒ có nút, không hỏi máy chủ trước khi em bấm', async () => {
    const tai = vi.fn(async () => KHONG)
    render(<VungChamDe q={{ qid: 't1' }} tuDien={TU_DIEN_GIA} taiGoiY={tai}><De text={DE_ESTER} /></VungChamDe>)
    await screen.findByRole('button', { name: /Bắt đầu từ đâu/ }, { timeout: 4000 })
    await choRuot()
    expect(tai).not.toHaveBeenCalled()
  })
  it('câu lý thuyết có cốt lõi thầy soạn (q.goiY) ⇒ có nút, không hỏi máy chủ', async () => {
    const tai = vi.fn(async () => KHONG)
    render(<VungChamDe q={{ qid: 't2', goiY: { cotLoi: 'Amine béo làm quỳ hoá xanh, aniline thì không.' } }} tuDien={TU_DIEN_GIA} taiGoiY={tai}><De text={DE_LY_THUYET} /></VungChamDe>)
    await screen.findByRole('button', { name: /Bắt đầu từ đâu/ }, { timeout: 4000 })
    expect(tai).not.toHaveBeenCalled()
  })
  it('câu lý thuyết không gợi ý, máy chủ không có bản ⇒ KHÔNG có nút (đã hỏi đúng một lần)', async () => {
    const tai = vi.fn(async () => KHONG)
    render(<VungChamDe q={{ qid: 't3' }} tuDien={TU_DIEN_GIA} taiGoiY={tai}><De text={DE_LY_THUYET} /></VungChamDe>)
    await waitFor(() => expect(tai).toHaveBeenCalledWith('t3'), { timeout: 4000 })
    await choRuot()
    expect(nutBatDau()).toBeNull()
    expect(tai).toHaveBeenCalledTimes(1)
  })
  it('câu lý thuyết nhưng thầy đã duyệt bản sơ đồ ⇒ nút hiện sau khi máy chủ báo có', async () => {
    render(<VungChamDe q={{ qid: 't4' }} tuDien={TU_DIEN_GIA} taiGoiY={async () => CO_BAN}><De text={DE_LY_THUYET} /></VungChamDe>)
    await screen.findByRole('button', { name: /Bắt đầu từ đâu/ }, { timeout: 4000 })
  })
  it('qua mạng thật: lượt hỏi «có bản không» KHÔNG kèm phiên (không đánh dấu có trợ giúp)', async () => {
    render(<VungChamDe q={{ qid: 't5' }} tuDien={TU_DIEN_GIA} token="tk" phien="phien-1"><De text={DE_LY_THUYET} /></VungChamDe>)
    await waitFor(() => expect(taiGoiYSoDo).toHaveBeenCalled(), { timeout: 4000 })
    expect(vi.mocked(taiGoiYSoDo).mock.calls[0]).toEqual(['tk', 't5'])
    await choRuot()
    expect(nutBatDau()).toBeNull()
  })
})

/** Như màn làm chặng Duo: bóng đèn chứa ô portal «Bắt đầu từ đâu?» + «Hỏi thầy» (luôn có). */
function ManDuo({ text, tai }: { text: string; tai: () => Promise<GoiYTraVe> }) {
  const [o, setO] = useState<HTMLElement | null>(null)
  return <div className="ht-app duo">
    <TroGiupDuo><span ref={setO} className="duo-o-nut-cham" /><div className="lg-nut-hang"><button type="button" className="lg-nut-hoi-thay">Hỏi thầy</button></div></TroGiupDuo>
    <VungChamDe q={{ qid: text.slice(0, 8) }} tuDien={TU_DIEN_GIA} taiGoiY={tai} nutBatDau={(nut) => (o ? createPortal(nut, o) : null)}><De text={text} /></VungChamDe>
  </div>
}
const tenTrongTam = () => [...document.querySelectorAll('.duo-tg-tam button')].map((b) => b.textContent)
const den = () => screen.getByRole('button', { name: /^Trợ giúp/ })

describe('tấm bóng đèn Duo', () => {
  it('câu lý thuyết không gợi ý ⇒ tấm chỉ có «Hỏi thầy»; bóng đèn vẫn hiện, không chấm «chưa xem»', async () => {
    render(<ManDuo text={DE_LY_THUYET} tai={async () => KHONG} />)
    await choRuot(); await choRuot()
    expect(tenTrongTam()).toEqual(['Hỏi thầy'])
    expect(den().hasAttribute('data-moi')).toBe(false)
    expect(den().getAttribute('aria-label')).toBe('Trợ giúp')
  })
  it('câu tính có gợi ý ⇒ đủ dòng (Bắt đầu từ đâu? + Hỏi thầy) và chấm «chưa xem»', async () => {
    render(<ManDuo text={DE_ESTER} tai={async () => KHONG} />)
    await waitFor(() => expect(tenTrongTam()).toEqual(['Bắt đầu từ đâu?', 'Hỏi thầy']), { timeout: 4000 })
    await waitFor(() => expect(den().hasAttribute('data-moi')).toBe(true))
  })
})
