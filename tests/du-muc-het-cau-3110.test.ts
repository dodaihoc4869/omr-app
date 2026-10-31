// 31/10 (ảnh thầy: Lộ trình «Bài 7 · 6/7 chặng», chặng 7 «Đã làm hết câu được giao» + nút Bắt đầu khoá): chặng cuối lấy chẵn 6 câu (mức 40 ⇒ chặng 7 tới câu 42)
// nên khi đã đủ mức mà máy chủ hết việc xếp được, chặng ấy không bao giờ đủ ⇒ em kẹt. `duNgay` ⇒ mọi chặng tính xong (lam-bai.ts, HocTapHomNay.tsx).
import { describe, expect, it } from 'vitest'
import { soChangXong, type SoHomNay } from '../src/components/hoc-tap/lam-bai'
import { chiaChang } from '../src/components/hoc-tap/nhip-hom-nay'

const so: SoHomNay = { daLam: 40, muc: 40, chang: 7, soChang: 7 }
describe('đủ mức + hết câu được giao ⇒ mọi chặng xong', () => {
  it('trước: 6/7 (chặng cuối đòi tới câu 42)', () => {
    expect(soChangXong(so)).toBe(6)
    expect(chiaChang(so).map((c) => c.tt)).toEqual(['xong', 'xong', 'xong', 'xong', 'xong', 'xong', 'dang'])
  })
  it('duNgay ⇒ 7/7, không còn chặng «đang»; cả khi máy còn ghi chặng dở', () => {
    expect(soChangXong({ ...so, duNgay: true })).toBe(7)
    expect(chiaChang({ ...so, duNgay: true }).every((c) => c.tt === 'xong')).toBe(true)
    expect(soChangXong({ ...so, duNgay: true, changDangDo: 7 })).toBe(7)
  })
})
