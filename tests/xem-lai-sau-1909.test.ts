// "Xem lại sau" — phần lưu TẠI MÁY (src/lib/xem-lai-sau.ts): khoá riêng theo ca + SBD, tập qid, mọi lỗi bị nuốt, không đụng gì khác trong storage.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docXemLai, doiDauXemLai, khoaXemLai, luuXemLai, TIEN_TO_KHOA_XEM_LAI } from '../src/lib/xem-lai-sau'
import { donKhiDoiMocReset, quenMocDaDonTrongPhien, TIEN_TO_LOCAL_DON } from '../src/components/bang-nhiem-vu/don-moc-reset'

afterEach(() => {
  vi.unstubAllGlobals() // trước: có ca thay localStorage bằng bản giả
  localStorage.clear()
  quenMocDaDonTrongPhien()
})

describe('khoá và đọc/ghi', () => {
  it('khoá theo ca + SBD, bắt đầu `ddh.xemlai.`; hai em/hai ca không lẫn nhau', () => {
    expect(khoaXemLai('abc123', '12121212')).toBe('ddh.xemlai.abc123.12121212')
    luuXemLai('abc123', '12121212', new Set(['q1', 'q2']))
    luuXemLai('abc123', '99999999', new Set(['q9']))
    luuXemLai('zzz999', '12121212', new Set(['q5']))
    expect([...docXemLai('abc123', '12121212')].sort()).toEqual(['q1', 'q2'])
    expect([...docXemLai('abc123', '99999999')]).toEqual(['q9'])
    expect([...docXemLai('zzz999', '12121212')]).toEqual(['q5'])
    expect(TIEN_TO_KHOA_XEM_LAI).toBe('ddh.xemlai.')
  })

  it('tập rỗng ⇒ xoá khoá (không để rác); chưa có gì ⇒ tập rỗng', () => {
    expect(docXemLai('a', 'b').size).toBe(0)
    luuXemLai('a', 'b', new Set(['q1']))
    expect(localStorage.getItem('ddh.xemlai.a.b')).toBe('["q1"]')
    luuXemLai('a', 'b', new Set())
    expect(localStorage.getItem('ddh.xemlai.a.b')).toBeNull()
  })

  it('dữ liệu hỏng/lạ: không ném, chỉ giữ chuỗi hợp lệ, chặn số lượng', () => {
    for (const t of ['{', 'null', '{"a":1}', '123', '"x"']) {
      localStorage.setItem('ddh.xemlai.a.b', t)
      expect(docXemLai('a', 'b').size, t).toBe(0)
    }
    localStorage.setItem('ddh.xemlai.a.b', JSON.stringify(['ok', 5, null, '', { x: 1 }, 'ok2', 'x'.repeat(500)]))
    expect([...docXemLai('a', 'b')]).toEqual(['ok', 'ok2'])
    localStorage.setItem('ddh.xemlai.a.b', JSON.stringify(Array.from({ length: 1000 }, (_, i) => 'q' + i)))
    expect(docXemLai('a', 'b').size).toBe(300)
  })

  it('storage bị chặn/đầy: đọc → rỗng, ghi → im lặng (màn thi không bao giờ hỏng vì dấu này)', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('đầy') }, removeItem: () => { throw new Error('chặn') } })
    expect(docXemLai('a', 'b').size).toBe(0)
    expect(() => luuXemLai('a', 'b', new Set(['q']))).not.toThrow()
    expect(() => luuXemLai('a', 'b', new Set())).not.toThrow()
  })

  it('ghi KHÔNG đụng khoá nào khác (bài làm dở, id thiết bị, phiên…)', () => {
    localStorage.setItem('ddh.lam.abc123.12121212', '{"bai":"lam"}')
    localStorage.setItem('ddh_id_thiet_bi', 'tb-1')
    luuXemLai('abc123', '12121212', new Set(['q1']))
    luuXemLai('abc123', '12121212', new Set())
    expect(localStorage.getItem('ddh.lam.abc123.12121212')).toBe('{"bai":"lam"}')
    expect(localStorage.getItem('ddh_id_thiet_bi')).toBe('tb-1')
    expect(localStorage.length).toBe(2)
  })
})

describe('doiDauXemLai', () => {
  it('bật/tắt một qid, KHÔNG sửa tập cũ (dùng thẳng với setState)', () => {
    const a = new Set(['q1'])
    const b = doiDauXemLai(a, 'q2')
    expect([...b].sort()).toEqual(['q1', 'q2'])
    expect([...a]).toEqual(['q1'])
    const c = doiDauXemLai(b, 'q1')
    expect([...c]).toEqual(['q2'])
    expect(c).not.toBe(b)
  })
})

describe('dọn khi máy chủ đặt lại mùa', () => {
  it('tiền tố `ddh.xemlai.` nằm trong danh sách dọn: dấu của ca cũ bị xoá, khoá khác giữ nguyên', () => {
    expect(TIEN_TO_LOCAL_DON).toContain('ddh.xemlai.')
    luuXemLai('abcd1234', '12121212', new Set(['q1']))
    localStorage.setItem('ddh_id_thiet_bi', 'tb-1')
    const r = donKhiDoiMocReset('2026-09-22')
    expect(r.don).toBe(true)
    expect(localStorage.getItem('ddh.xemlai.abcd1234.12121212')).toBeNull()
    expect(localStorage.getItem('ddh_id_thiet_bi')).toBe('tb-1')
  })
})
