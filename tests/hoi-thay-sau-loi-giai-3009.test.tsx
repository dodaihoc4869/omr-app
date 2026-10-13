// SỬA CÓ CHỦ Ý 13/10 — thầy lệnh mới: "Nút hỏi bài phải đặt ở tất cả các câu, trừ các câu trong màn kiểm tra và gọi lên bảng. Đặt ở vị trí
// để học sinh dễ nhìn thấy thuận tiện ưu tiên hỏi bài thầy mọi lúc nếu cần" (thay luật 30/09 "chỉ khi hiện lời giải mới hiện nút").
// Nay: nút "Hỏi thầy" ngay DƯỚI phần trả lời ở mọi chế độ; đang làm ⇒ chỉ Hỏi thầy (Thầy gợi hướng, máy chủ không trả đáp án);
// "Lời giải từng bước" vẫn chỉ khi lời giải đang hiện (giữ phần ấy của luật 30/09). Áp cho TheCau, LoiGiaiCauSai, phiếu HTML.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
import TheCau from '../src/components/TheCau'
import { LoiGiaiCauSai } from '../src/components/KhoiCauSai'
import { dungPhieu, theCauHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

beforeEach(() => { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'E1', token: 'tok' })) })
afterEach(() => { cleanup(); localStorage.clear() })

const nut = () => screen.queryByRole('button', { name: /Hỏi thầy/ })
const nutGiai = () => screen.queryByRole('button', { name: /Lời giải từng bước/ })
const CHUNG = { stt: 1, text: 'Chất nào là ester?', phan: 'I' as const, choices: ['A1', 'B1', 'C1', 'D1'] as [string, string, string, string], choicePerm: [0, 1, 2, 3], selected: 'A' as const, hoiThay: { qid: '12-X-I-1', nguon: 'luyen_de', gon: true } }

describe('TheCau: Hỏi thầy ở mọi câu, ngay dưới phần trả lời', () => {
  it('đang làm ⇒ có Hỏi thầy, KHÔNG có Lời giải từng bước; xem lại có lời giải ⇒ đủ hai nút, đứng trên khối lời giải', () => {
    const { rerender } = render(<TheCau {...CHUNG} cheDo="thi" />)
    expect(nut()).not.toBeNull()
    expect(nutGiai()).toBeNull()
    rerender(<TheCau {...CHUNG} cheDo="xem_lai" correct="B" loiGiai={{ chot: 'Ester có nhóm COO' }} />)
    expect(nut()).not.toBeNull()
    expect(nutGiai()).not.toBeNull()
    expect(nut()!.closest('.lg-nut-hang')!.nextElementSibling!.querySelector('.loi-giai')).toBeTruthy()
    rerender(<TheCau {...CHUNG} cheDo="thi" />)
    expect(nutGiai()).toBeNull()
  })
  it('xem lại nhưng câu KHÔNG có lời giải ⇒ vẫn Hỏi thầy, không Lời giải từng bước', () => {
    render(<TheCau {...CHUNG} cheDo="xem_lai" correct="B" />)
    expect(screen.getByText(/Thầy chưa nhập lời giải/)).toBeTruthy()
    expect(nut()).not.toBeNull()
    expect(nutGiai()).toBeNull()
  })
  it('không truyền hoiThay (màn thi, Gọi lên bảng, app thầy) ⇒ không nút dù có lời giải', () => {
    const { hoiThay: _bo, ...khong } = CHUNG
    render(<TheCau {...khong} cheDo="xem_lai" correct="B" loiGiai={{ chot: 'x' }} />)
    expect(nut()).toBeNull()
  })
})

describe('LoiGiaiCauSai (game Đảo cũ, ôn lại, Võ đài): hộp lời giải', () => {
  it('có lời giải ⇒ hai nút; hộp trống lời giải ⇒ chỉ Hỏi thầy; hộp chưa vẽ ⇒ không nút', () => {
    const { rerender, container } = render(<LoiGiaiCauSai c={{ text: 'x', phan: 'I', dapAnDung: 'B', loiGiai: { chot: 'Chốt thử' } } as never} qid="q1" nguon="game" />)
    expect(nut()).not.toBeNull()
    expect(nutGiai()).not.toBeNull()
    rerender(<LoiGiaiCauSai c={{ text: 'x', phan: 'I', dapAnDung: 'B' } as never} qid="q1" nguon="game" />)
    expect(nut()).not.toBeNull()
    expect(nutGiai()).toBeNull()
    rerender(<></>)
    expect(container.innerHTML).toBe('')
    expect(nut()).toBeNull()
  })
})

describe('phiếu học sinh: nút luôn hiện dưới phần trả lời', () => {
  const CAU = [{ id: '12-X-I-1', phan: 'I', text: 'Chất nào là ester?', luaChon: ['A1', 'B1', 'C1', 'D1'], dapAn: 'B', chot: 'x' }] as unknown as CauLuyen[]
  const the = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; return d }
  it('có lời giải ⇒ nút trong .q-than (NGOÀI .sol-wrap), không bị CSS ẩn khi thẻ chưa mở; không đánh dấu đang làm', () => {
    const n = the(theCauHtml(CAU[0], 1, false, false, true, false, undefined, true)).querySelector('[data-hoi-thay]')
    expect(n).not.toBeNull()
    expect(n!.closest('.sol-wrap')).toBeNull()
    expect(n!.closest('.q-than')).not.toBeNull()
    expect(n!.hasAttribute('data-dang-lam')).toBe(false)
    const phieu = dungPhieu({ hoTen: 'Em', tenChuyenDe: 'Ester', ngay: new Date('2026-09-29T00:00:00Z'), nhanBia: 'PHIẾU', oBia: [] } as never, CAU, { nop: { ma: 'P1', sbd: 'E1', url: 'https://x' } })
    expect(phieu).not.toContain('.q-card:not(.mo) .q-hoi-thay{display:none}')
    expect(phieu).toContain("document.body.classList.contains('chua-nop')")
  })
  it('phiếu làm bài không kèm lời giải ⇒ nút mang data-dang-lam; phiếu chỉ xem (không cho làm) mà không lời giải ⇒ không nút', () => {
    const n = the(theCauHtml(CAU[0], 1, false, true, true, false, undefined, true)).querySelector('[data-hoi-thay]')
    expect(n?.getAttribute('data-dang-lam')).toBe('1')
    expect(theCauHtml(CAU[0], 1, false, true, false, false, undefined, true)).not.toContain('data-hoi-thay')
  })
})

describe('mọi màn em làm câu có Hỏi thầy; màn thi, Gọi lên bảng, lúc làm kiểm tra cá nhân / đề thử có giờ thì không', () => {
  const doc = (p: string) => readFileSync(p, 'utf8')
  it('lúc đang làm có nút', () => {
    expect(doc('src/components/bang-nhiem-vu/LamCauOn.tsx')).toContain('{!daCham && <NutHoiThay gon dangLam qid={c.qid} nguon="on_lai" />}')
    expect(doc('src/components/hoc-tap/ManLamBaiTap.tsx')).toMatch(/dangTraLoi && <NutHoiThay gon dangLam/)
    expect(doc('src/components/tu-luyen/ManTuLuyen.tsx')).toContain("cheDo: 'thi' as const,\n    // Thầy 13/10")
    expect(doc('src/components/tu-luyen/LuyenDeCauTruc.tsx')).toContain("cheDo: 'thi' as const, stt, hoiThay: { qid: q.id, nguon: 'luyen_de' } }")
    for (const tep of ['src/components/hoa2/CauDaLam.tsx', 'src/components/ca-thi/CauCanChua.tsx', 'src/components/LuyenDeChuan.tsx', 'src/components/KhoiKhacPhuc3CheDo.tsx', 'src/components/hoc-tap/ManKiemTraCaNhan.tsx']) {
      expect(doc(tep), tep).toMatch(/hoiThay[=:]/)
    }
  })
  it('màn thi, Gọi lên bảng, lúc làm kiểm tra cá nhân, đề thử có giờ: không nút', () => {
    expect(doc('src/screens/ExamTakeScreen.tsx')).not.toMatch(/NutHoiThay|hoiThay/)
    expect(doc('src/screens/GoiLenBangScreen.tsx')).not.toMatch(/NutHoiThay|hoiThay/)
    const kt = doc('src/components/hoc-tap/ManKiemTraCaNhan.tsx')
    expect(kt).toContain('<TheCau {...propsCauHoc(q,viTri+1,tra[q.qid]??\'\',v=>doi(q.qid,v),undefined,busy||sec===0)}/>')
    expect(kt.split('hoiThay').length).toBe(2) // chỉ ở phần KẾT QUẢ sau nộp
  })
})
