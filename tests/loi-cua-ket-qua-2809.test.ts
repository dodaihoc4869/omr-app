// Lời lỗi máy chủ trong phản hồi ok:false — lớp gọi game-v2 (Game.tsx) và Sảnh 2.0 (hoa2/api.ts) cùng đọc `error` rồi `loi` (28/09: rương chưa đủ chỉ hiện lời chung).
import { describe, expect, it } from 'vitest'
import { loiCuaKetQua } from '../src/game/than-thu-v2/loi-het-tran'

describe('loiCuaKetQua', () => {
  it('lệnh Game Hóa 2.0 chỉ có `loi` (hoa2-ruong-mo chưa đủ) ⇒ lấy `loi`', () => {
    expect(loiCuaKetQua({ ok: false, ma: 'chua_du', loi: 'Em làm xong 40/40 câu hôm nay thì rương mở.' })).toBe('Em làm xong 40/40 câu hôm nay thì rương mở.')
  })
  it('có `error` ⇒ `error` thắng; `error` rỗng ⇒ rơi về `loi`', () => {
    expect(loiCuaKetQua({ ok: false, error: 'A', loi: 'B' })).toBe('A')
    expect(loiCuaKetQua({ ok: false, error: '  ', loi: 'B' })).toBe('B')
  })
  it('không có lời / không phải chuỗi / null ⇒ chuỗi rỗng', () => {
    expect(loiCuaKetQua({ ok: false })).toBe('')
    expect(loiCuaKetQua({ ok: false, error: 3, loi: {} })).toBe('')
    expect(loiCuaKetQua(null)).toBe('')
  })
})
