import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { DeBai } from '../src/game/than-thu-v2/DoanCau'
import { apSongSinh } from '../server/src/song-sinh-game'
import { locBoTro } from '../server/src/cau-bo-tro'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'

afterEach(cleanup)
it('nạp dữ kiện bảng → tạo biến thể → màn Hộ Tống hiện đủ hàng cột, không lộ đáp án', () => {
  const goc = { qid: 'Q', maDe: 'D', version: 'v', group: 'g', phan: 'III', text: 'Gốc', choices: [], ideas: [], hinhAnh: [],
    dang: 'D1', tenDang: '', mucDo: 'hieu', sao: 1, kienThuc: [], correct: '99', solution: {}, reviewed: true } satisfies PrivateQuestion
  const ss = locBoTro({ song_sinh: [{ de: 'Thành phần acid béo trong bảng sau.', bang: [['Acid béo', 'Phần trăm'], ['Oleic acid', '40'], ['Linoleic acid', '60']], dap_an: '145' }] }).songSinh[0]!
  render(<DeBai q={publicQuestion(apSongSinh(goc, ss, 0)!)} onZoom={() => {}} />)
  const table = screen.getByRole('table')
  expect(table.querySelectorAll('tr')).toHaveLength(3)
  expect(table.querySelectorAll('td')).toHaveLength(4)
  expect(table.textContent).toContain('Oleic acid40')
  expect(table.textContent).toContain('Linoleic acid60')
  expect(document.body.textContent).not.toContain('145')
})
