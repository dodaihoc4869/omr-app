// Thầy lệnh 30/09: "TẤT CẢ các nút Hỏi thầy chỉ khi hiện lời giải thì mới hiện; chưa hiện lời giải thì chưa được hiện."
// Nút nằm BÊN TRONG khối lời giải dùng chung: TheCau (prop `hoiThay`, chỉ vẽ trong khối LỜI GIẢI của chế độ xem_lai),
// LoiGiaiCauSai (hộp lời giải game/ôn lại), phiếu HTML (trong .sol-wrap, ẩn khi thẻ chưa mở).
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
const CHUNG = { stt: 1, text: 'Chất nào là ester?', phan: 'I' as const, choices: ['A1', 'B1', 'C1', 'D1'] as [string, string, string, string], choicePerm: [0, 1, 2, 3], selected: 'A' as const, hoiThay: { qid: '12-X-I-1', nguon: 'luyen_de', gon: true } }

describe('TheCau: nút Hỏi thầy chỉ trong khối lời giải đang hiện', () => {
  it('chưa hiện lời giải (đang làm) ⇒ không nút; hiện lời giải ⇒ có nút; về lại chưa hiện ⇒ mất nút', () => {
    const { rerender } = render(<TheCau {...CHUNG} cheDo="thi" />)
    expect(nut()).toBeNull()
    rerender(<TheCau {...CHUNG} cheDo="xem_lai" correct="B" loiGiai={{ chot: 'Ester có nhóm COO' }} />)
    expect(nut()).not.toBeNull()
    // Nút nằm ngay dưới hộp LỜI GIẢI, cùng khối lời giải.
    expect(nut()!.closest('.lg-nut-hang')?.parentElement?.querySelector(':scope > .loi-giai')).toBeTruthy()
    rerender(<TheCau {...CHUNG} cheDo="thi" />)
    expect(nut()).toBeNull()
  })
  it('xem lại nhưng câu KHÔNG có lời giải ⇒ không nút', () => {
    render(<TheCau {...CHUNG} cheDo="xem_lai" correct="B" />)
    expect(screen.getByText(/Thầy chưa nhập lời giải/)).toBeTruthy()
    expect(nut()).toBeNull()
  })
  it('không truyền hoiThay (màn thi, app thầy) ⇒ không nút dù có lời giải', () => {
    const { hoiThay: _bo, ...khong } = CHUNG
    render(<TheCau {...khong} cheDo="xem_lai" correct="B" loiGiai={{ chot: 'x' }} />)
    expect(nut()).toBeNull()
  })
})

describe('LoiGiaiCauSai (game Đảo cũ, ôn lại): hộp lời giải', () => {
  it('có lời giải ⇒ có nút; hộp trống lời giải ⇒ không nút; hộp chưa vẽ ⇒ không nút', () => {
    const { rerender, container } = render(<LoiGiaiCauSai c={{ text: 'x', phan: 'I', dapAnDung: 'B', loiGiai: { chot: 'Chốt thử' } } as never} qid="q1" nguon="game" />)
    expect(nut()).not.toBeNull()
    rerender(<LoiGiaiCauSai c={{ text: 'x', phan: 'I', dapAnDung: 'B' } as never} qid="q1" nguon="game" />)
    expect(nut()).toBeNull()
    rerender(<></>)
    expect(container.innerHTML).toBe('')
    expect(nut()).toBeNull()
  })
})

describe('phiếu học sinh: nút nằm trong khối lời giải thu gọn', () => {
  const CAU = [{ id: '12-X-I-1', phan: 'I', text: 'Chất nào là ester?', luaChon: ['A1', 'B1', 'C1', 'D1'], dapAn: 'B', chot: 'x' }] as unknown as CauLuyen[]
  it('nút ở TRONG .sol-wrap; thẻ chưa mở (.q-card không .mo) thì CSS ẩn; mở thì hiện; không có lời giải ⇒ không nút', () => {
    const html = theCauHtml(CAU[0], 1, false, false, true, false, undefined, true)
    const d = document.createElement('div')
    d.innerHTML = html
    const n = d.querySelector('[data-hoi-thay]')
    expect(n).not.toBeNull()
    expect(n!.closest('.sol-wrap')).not.toBeNull()
    const phieu = dungPhieu({ hoTen: 'Em', tenChuyenDe: 'Ester', ngay: new Date('2026-09-29T00:00:00Z'), nhanBia: 'PHIẾU', oBia: [] } as never, CAU, { nop: { ma: 'P1', sbd: 'E1', url: 'https://x' } })
    expect(phieu).toContain('.q-card:not(.mo) .q-hoi-thay{display:none}')
    // Không có lời giải (anGiai) ⇒ không nút.
    expect(theCauHtml(CAU[0], 1, false, true, true, false, undefined, true)).not.toContain('data-hoi-thay')
  })
})

describe('không còn nút Hỏi thầy TRƯỚC khi hiện lời giải (đang làm câu)', () => {
  const doc = (p: string) => readFileSync(p, 'utf8')
  it('màn đang làm (Bi-a, Đảo 2 TheCauAi, Đảo cũ, Ôn lại) không gắn nút ngoài khối lời giải', () => {
    for (const tep of ['src/game/bi-a/TraLoiCau.tsx', 'src/game/than-thu-v2/Game.tsx', 'src/components/bang-nhiem-vu/LamCauOn.tsx', 'src/game/than-thu-v2/dao2/TrongAi.tsx']) {
      expect(doc(tep), tep).not.toMatch(/<NutHoiThay/)
    }
    expect(doc('src/game/than-thu-v2/dao2/TrongAi.tsx')).toContain('hoiThay={{qid:q.qid,nguon,gon:true}}')
  })
  it('mọi chỗ còn lại đi qua TheCau hoiThay (chỉ vẽ khi xem_lai + có lời giải), không vẽ nút riêng', () => {
    for (const tep of ['src/components/hoa2/CauDaLam.tsx', 'src/components/ca-thi/CauCanChua.tsx', 'src/components/LuyenDeChuan.tsx', 'src/components/KhoiKhacPhuc3CheDo.tsx', 'src/components/tu-luyen/LuyenDeCauTruc.tsx', 'src/components/tu-luyen/ManTuLuyen.tsx']) {
      const ma = doc(tep)
      expect(ma, tep).not.toMatch(/<NutHoiThay/)
      expect(ma, tep).toMatch(/hoiThay[=:]/)
    }
  })
})
