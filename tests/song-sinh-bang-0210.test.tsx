import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { locBoTro } from '../server/src/cau-bo-tro'
import { apSongSinh } from '../server/src/song-sinh-game'
import { phuNeuCan } from '../server/src/hang-chua-loi'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { DeBai } from '../src/game/than-thu-v2/DoanCau'
import { cauTuSongSinh } from '../src/lib/de-rieng-v2'
import { loiTuHoSo } from '../server/src/rut-de-v2'
import type { HoSo2 } from '../server/src/srs2-d1'

afterEach(cleanup)
const goc: PrivateQuestion = {
  qid: 'LIPID-III-1', maDe: 'DE1', version: 'v1', group: 'g1', phan: 'III',
  text: 'Dầu hướng dương có thành phần như bảng sau. Tính chỉ số iodine.',
  table: [['Acid béo', 'Hàm lượng (%)'], ['Oleic acid', '30'], ['Linoleic acid', '60']],
  choices: [], ideas: [], hinhAnh: [], dang: 'LIPID', tenDang: 'Chỉ số chất béo',
  mucDo: 'TH', sao: 1, kienThuc: [], correct: '136', solution: {}, reviewed: true,
}
const ss = { de: 'Dầu hướng dương có thành phần như bảng sau. Tính chỉ số iodine.', dap_an: '140' }

describe('song sinh phải có bảng riêng đủ dữ kiện', () => {
  it('bản thiếu bảng quay về nguyên câu gốc và hiển thị bảng gốc, giữ đúng đáp án gốc', () => {
    expect(apSongSinh(goc, ss, 0)).toBeNull()
    const bt = { bam: 'b', qidMau: goc.qid, ...locBoTro({ song_sinh: [ss] }) }
    const q = phuNeuCan(goc, new Map([[goc.qid, 0]]), new Map([[goc.qid, bt]]))
    expect(q).toBe(goc)
    render(<DeBai q={publicQuestion(q)} onZoom={vi.fn()} />)
    expect(screen.getByRole('table').textContent).toContain('30')
    expect(q.correct).toBe('136')
  })
  it('bảng song sinh đi từ gói nhập tới thẻ câu, không trộn số cũ hay lộ đáp án', () => {
    const bang = [['Acid béo', 'Hàm lượng (%)'], ['Oleic acid', '25'], ['Linoleic acid', '65']]
    const bt = locBoTro({ song_sinh: [{ ...ss, bang }] })
    const q = apSongSinh(goc, bt.songSinh[0]!, 0)!
    expect(q.qid).toBe(`${goc.qid}~ss0`)
    const pub = publicQuestion(q)
    expect(pub).not.toHaveProperty('correct')
    expect(pub).not.toHaveProperty('solution')
    render(<DeBai q={pub} onZoom={vi.fn()} />)
    const table = screen.getByRole('table')
    expect(table.textContent).toContain('65')
    expect(table.textContent).not.toContain('60')
    expect(q.correct).toBe('140')
  })
  it('bảng hỏng hoặc thiếu hàng dữ liệu không được phục vụ', () => {
    for (const bang of [[['Acid', 'Phần trăm']], [['Acid', 'Phần trăm'], ['Oleic']], [['Acid'], [null]]]) {
      expect(apSongSinh(goc, { ...ss, bang } as never, 0)).toBeNull()
      expect(locBoTro({ song_sinh: [{ ...ss, bang }] }).songSinh[0]?.bang).toBeUndefined()
    }
  })
  it('câu gốc không có bảng nhưng song sinh dẫn tới bảng thiếu cũng bị chặn', () => {
    expect(apSongSinh({ ...goc, table: undefined }, ss, 0)).toBeNull()
    for (const de of ['Xem bảng: <table></table>', 'Bảng:\nAcid | % | M\n--- | --- | ---']) {
      expect(apSongSinh(goc, { ...ss, de }, 0)).toBeNull()
    }
  })
  it('đường rút đề cũng giữ bảng riêng, loại song sinh thiếu bảng ngay trên máy chủ và máy thầy', () => {
    const bang = [['Acid béo', 'Hàm lượng (%)'], ['Oleic acid', '25'], ['Linoleic acid', '65']]
    const hs = (them: object) => ({
      loiV2: new Map([[goc.qid, { trangThai: 'mo', denHan: '2026-10-02', nenSongSinh: true }]]),
      meta: new Map([[goc.qid, { phan: 'III', coBang: true }]]), songSinhCho: new Map([[goc.qid, 0]]),
      boTro: new Map([[goc.qid, { songSinh: [{ ...ss, ...them }] }]]),
    }) as unknown as HoSo2
    expect(loiTuHoSo(hs({}))[0]).not.toHaveProperty('cauSongSinh')
    const l = loiTuHoSo(hs({ bang }))[0]!
    expect(l.cauSongSinh?.table).toEqual(bang)
    const input = { ...l, trangThai: 'mo', denHan: '2026-10-02' }
    expect(cauTuSongSinh(input, goc)?.cau.table).toEqual(bang)
    expect(cauTuSongSinh({ ...input, cauSongSinh: { ...l.cauSongSinh!, table: undefined } }, goc)).toBeNull()
  })
  it('song sinh không cần bảng vẫn dùng được; bảng viết đủ trong đề vẫn giữ nguyên', () => {
    expect(apSongSinh({ ...goc, table: undefined }, { de: 'Cho 0,1 mol chất X. Tính khối lượng.', dap_an: '14' }, 0)?.correct).toBe('14')
    const de = 'Thành phần như bảng sau:\nAcid | Hàm lượng | M\nOleic | 25 | 282\nLinoleic | 65 | 280'
    expect(apSongSinh(goc, { ...ss, de }, 0)?.text).toBe(de)
  })
})
