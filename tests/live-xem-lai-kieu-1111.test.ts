// XEM LẠI LIVE — hợp đồng net.bin (src/lib/live/xem-lai-kieu.ts): ghi rồi đọc ra đúng từng byte; khúc cụt không ném lỗi; khung của Live giải lại được.
import { describe, expect, it } from 'vitest'
import { DAU_BAN_GHI_NET, KHUNG_NET_TOI_DA, docNetBin, ghiNetBin } from '../src/lib/live/xem-lai-kieu'
import { giaiSo, maBangMoi, maXoaHet } from '../src/lib/live/ma-net'

describe('net.bin của Xem lại Live', () => {
  const k1 = maBangMoi('cau-1', 1.5), k2 = maXoaHet()
  const than = ghiNetBin([{ t: 0, khung: k1 }, { t: 12345, khung: k2 }])

  it('ghi rồi đọc ra đúng giờ và đúng khung', () => {
    const { muc, du } = docNetBin(than)
    expect(du).toBe(than.length)
    expect(muc.map(m => m.t)).toEqual([0, 12345])
    expect(Array.from(muc[0]!.khung)).toEqual(Array.from(k1))
    expect(giaiSo(muc[0]!.khung)?.k).toBe('bang')
    expect(giaiSo(muc[1]!.khung)?.k).toBe('xoa-het')
  })

  it('khúc cụt giữa bản ghi: bỏ bản ghi dở, báo đúng số byte đã đọc trọn', () => {
    const { muc, du } = docNetBin(than.subarray(0, than.length - 2))
    expect(muc.length).toBe(1)
    expect(du).toBe(DAU_BAN_GHI_NET + k1.length)
  })

  it('đọc tiếp từ vị trí byte của một bản ghi (tải Range theo mocBang)', () => {
    const { muc } = docNetBin(than.subarray(DAU_BAN_GHI_NET + k1.length))
    expect(muc.map(m => m.t)).toEqual([12345])
  })

  it('bỏ khung rỗng và khung quá dài', () => {
    const b = ghiNetBin([{ t: 1, khung: new Uint8Array(0) }, { t: 2, khung: new Uint8Array(KHUNG_NET_TOI_DA + 1) }, { t: 3, khung: k2 }])
    expect(docNetBin(b).muc.map(m => m.t)).toEqual([3])
  })
})
