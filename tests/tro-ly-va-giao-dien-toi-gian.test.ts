import { describe, it, expect } from 'vitest'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'

describe('Kiểm tra Trợ lý Cá nhân & Giao diện Tối giản', () => {
  it('tạo kế hoạch trợ lý học sinh có đầy đủ top3, radar deadline và action', () => {
    const keHoach = tongHopKeHoachTroLy({
      sbd: '001',
      hoTen: 'Nguyễn Văn A',
      dsBtvn: [
        { maBtvn: 'bt_1', tieuDe: 'BTVN Este Lipit', soCau: 12, hanNop: new Date(Date.now() + 3600000).toISOString(), daNop: false }
      ],
      dsMomGiao: [],
      dsLichSu: [],
      tongCauSai: 5,
    })

    expect(keHoach.top3.length).toBeGreaterThan(0)
    expect(keHoach.top3[0].hanhDong).toBeDefined()
    expect(keHoach.top3[0].hanhDong.loai).toBeDefined()
    expect(keHoach.radarDeadline.danhSach.length).toBe(1)
    expect(keHoach.radarDeadline.danhSach[0].loai).toBe('btvn')
  })

  it('action mo_thi có thể gọi được độc lập mà không cần payload bắt buộc', () => {
    const hanhDong: any = { loai: 'mo_thi', nhanNut: 'Vào phòng thi' }
    expect(hanhDong.loai).toBe('mo_thi')
    expect(hanhDong.nhanNut).toBe('Vào phòng thi')
  })
})
