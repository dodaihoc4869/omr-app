// TỪ NGỮ · CỤM 7 (bảng duyệt docs/ra-soat-tu-ngu-2109-code2.md, 21/09): hộp thoại riêng thay confirm/alert (H38), đơn vị game (Chuyến/Hiệp/Trạm/Ải),
// nhãn bậc Bảng nhiệm vụ, tên nhóm câu trên phiếu. Chữ cũ bị khoá cho khỏi lộn lại.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { it, expect, afterEach, describe } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import { useHopThoai } from '../src/components/HopThoaiCong'
import { NHAN_BAC, NHAN_LAM_THEM } from '../src/lib/nhiem-vu-adapter'
import { tenBaiTapTrenThe } from '../src/lib/btvn-ca-nhan-kieu'

afterEach(cleanup)
const doc = (tep: string) => readFileSync(resolve(__dirname, '..', tep), 'utf8')

function Thu({ ghi }: { ghi: (s: string) => void }) {
  const { hoi, bao, hop } = useHopThoai()
  return (
    <div>
      <button onClick={() => void hoi({ tieuDe: 'Làm lại bài?', noiDung: 'Còn 2 lượt.', nutDongY: 'Làm lại bài', nutHuy: 'Để sau' }).then((ok) => ghi(ok ? 'dong-y' : 'huy'))}>mo-hoi</button>
      <button onClick={() => { void bao('Bài một.').then(() => ghi('bao-1')); void bao('Bài hai.', 'Tiêu đề hai').then(() => ghi('bao-2')) }}>mo-bao</button>
      {hop}
    </div>
  )
}

describe('cụm 7 · hộp thoại của cổng (H38)', () => {
  it('hỏi: nút nói việc; "Làm lại bài" → đồng ý, "Để sau" → huỷ, Esc → huỷ; focus rơi vào nút an toàn', async () => {
    const ghi: string[] = []
    render(<Thu ghi={(s) => ghi.push(s)} />)
    fireEvent.click(screen.getByText('mo-hoi'))
    let hop = screen.getByRole('alertdialog', { name: 'Làm lại bài?' })
    expect(hop.textContent).toContain('Còn 2 lượt.')
    expect(document.activeElement).toBe(within(hop).getByRole('button', { name: 'Để sau' }))
    await act(async () => { fireEvent.click(within(hop).getByRole('button', { name: 'Làm lại bài' })) })
    expect(ghi).toEqual(['dong-y']); expect(screen.queryByRole('alertdialog')).toBeNull()
    fireEvent.click(screen.getByText('mo-hoi'))
    await act(async () => { fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Để sau' })) })
    fireEvent.click(screen.getByText('mo-hoi'))
    hop = screen.getByRole('alertdialog')
    await act(async () => { fireEvent.keyDown(hop, { key: 'Escape' }) })
    expect(ghi).toEqual(['dong-y', 'huy', 'huy'])
  })
  it('báo: một nút "Đã hiểu"; hai hộp xin liền nhau hiện LẦN LƯỢT, không chồng', async () => {
    const ghi: string[] = []
    render(<Thu ghi={(s) => ghi.push(s)} />)
    fireEvent.click(screen.getByText('mo-bao'))
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1)
    let hop = screen.getByRole('alertdialog', { name: 'Thông báo' })
    expect(within(hop).getAllByRole('button')).toHaveLength(1)
    await act(async () => { fireEvent.click(within(hop).getByRole('button', { name: 'Đã hiểu' })) })
    hop = screen.getByRole('alertdialog', { name: 'Tiêu đề hai' })
    expect(hop.textContent).toContain('Bài hai.')
    await act(async () => { fireEvent.click(within(hop).getByRole('button', { name: 'Đã hiểu' })) })
    expect(ghi).toEqual(['bao-1', 'bao-2']); expect(screen.queryByRole('alertdialog')).toBeNull()
  })
  it('hai cổng không còn gọi confirm()/alert() của trình duyệt', () => {
    for (const t of ['src/screens/StudentPortalScreen.tsx', 'src/screens/ParentPortalScreen.tsx']) {
      const dong = doc(t).split('\n').filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d) && /(^|[^.\w])(alert|confirm)\(|window\.(alert|confirm)\(/.test(d))
      expect(dong, t).toEqual([])
    }
  })
})

describe('cụm 7 · nhãn Bảng nhiệm vụ và tên bài', () => {
  it('bốn bậc: "Sắp đến hạn nộp", "Bắt buộc hôm nay", "Nên làm", "Làm thêm (không bắt buộc)"', () => {
    expect(NHAN_BAC).toEqual({ khan: 'Sắp đến hạn nộp', bat_buoc: 'Bắt buộc hôm nay', nen_lam: 'Nên làm', tuy_chon: 'Làm thêm (không bắt buộc)' })
    expect(NHAN_LAM_THEM).toBe('Làm thêm (không bắt buộc)')
  })
  it('thẻ bài thiếu tên/tên giống mã ⇒ "Bài tập về nhà (chưa đặt tên)", không bao giờ "Bài tập ca <mã>"', () => {
    expect(tenBaiTapTrenThe({ tenBtvn: '' })).toBe('Bài tập về nhà (chưa đặt tên)')
    expect(tenBaiTapTrenThe({ tenBtvn: 'Este 12A1' })).toBe('Este 12A1')
    expect(doc('src/components/bang-nhiem-vu/BtvnM3.tsx')).not.toContain('Bài tập ca ')
  })
})

describe('cụm 7 · đơn vị trong game: Chuyến / Hiệp / Trạm / Ải; "chặng" chỉ còn ở Bài tập về nhà', () => {
  const HS_DOAN = ['DoanSanh.tsx', 'DoanTran.tsx', 'DoanKetChang.tsx', 'DoanHoTong.tsx']
  for (const f of HS_DOAN) {
    it(`${f}: chữ hiện cho em không nói "chặng" của game (trừ câu nhắc "chặng Bài tập về nhà")`, () => {
      const dong = doc(`src/game/than-thu-v2/${f}`).split('\n').filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d) && /[Cc]hặng|CHẶNG/.test(d) && !/chặng Bài tập về nhà/.test(d) && !/conChangToiTramKe|dh-chang|changThang|changMoiTram|chang[A-Z.]|\.chang\b|Chang\b/.test(d))
      expect(dong.map((d) => d.trim().slice(0, 90))).toEqual([])
    })
  }
  it('Khiên trong trận Đoàn là GIÁP ("+30 giáp cho Linh Tâm"), không "khiên 30"; máu có nhãn', () => {
    const tran = doc('src/game/than-thu-v2/DoanTran.tsx'); const tung = doc('src/game/than-thu-v2/DoanTungChuong.tsx')
    expect(tran).toContain('+{CHAN} giáp cho Linh Tâm'); expect(tran).not.toMatch(/khiên \{CHAN\}/)
    expect(tung).toContain('mất ${kq.linhTamMat} máu'); expect(tung).not.toMatch(/khiên \{toi\.chan/)
  })
  it('ghế máy tên "Bạn máy"; ôn lại nói "đến lịch ôn lại"; mức độ của em là "Biết · Hiểu · Vận dụng"', () => {
    expect(doc('src/game/than-thu-v2/doan-core.ts')).toContain("ten: 'Bạn máy'")
    expect(doc('src/game/than-thu-v2/doan-kieu.ts')).toContain("toi_han_on: 'đến lịch ôn lại'")
    expect(doc('src/game/than-thu-v2/dao/ThamHiem.tsx')).toContain("{biet:'Biết',hieu:'Hiểu',van_dung:'Vận dụng'}")
  })
})
