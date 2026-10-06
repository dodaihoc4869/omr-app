/**
 * TÊN THẦN THÚ — VỪA HOÁ HỌC VỪA THẦN THÚ, 16-09.
 *
 * Thầy chốt 15-09: *"bạn đặt lại tên cho vừa hoá học vừa thần thú cho ngầu
 * hơn nữa nhé"*.
 *
 * Luật đặt tên, và phép kiểm dưới đây giữ đúng luật ấy:
 *   `ten`      = [thuật ngữ Hoá có thật] + [tên thần thú]
 *   `danhHieu` = [công thức/tỉ lệ có thật] + [danh xưng]
 *   `kyNangNo` = tên chiêu tối thượng đúng ảnh thầy gửi (chữ IN tiếng Anh)
 *               + nghĩa tiếng Việt.
 *
 * Không có phép kiểm này thì lần đổi tên sau rất dễ đánh rơi một nửa: đặt cho
 * kêu mà mất sạch chất Hoá, hoặc ngược lại.
 */
// GỌN MÃ 06/10 (lần 2, docs/gon-ma-0610-lan-2.md): game Thần thú v1 bị xoá (he-thong-pet.ts, am-thanh-pet.ts, ThanThuHoaHocGame.tsx).
// Đã gỡ ĐÚNG phần dùng chúng — khối 'tên sáu thần thú', 'âm chưởng tối thượng' và một `it` lặp qua DANH_SACH_THAN_THU; ba `it` đọc bảng bậc ở `hinh-thai` (mã còn sống) giữ NGUYÊN.
import { describe, expect, it } from 'vitest'
import { TEN_BAC_THEO_THU } from '../src/game/than-thu-hoa-hoc/hinh-thai'

/** Tên thần thú — long, ly, quy, phượng, lân, thuỷ long. */
const CHU_THU = ['long', 'lân', 'quy', 'phượng', 'kỳ lân', 'thần thú']

const co = (s: string, ds: string[]) => ds.some((t) => s.toLowerCase().includes(t))

describe('tên sáu bậc tiến hoá', () => {
  it('bậc 1 là TRỨNG, bậc cuối là TỐI THƯỢNG viết hoa', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      expect(ds[0]!.toLowerCase(), id).toContain('trứng')
      expect(ds[ds.length - 1]!, id).toBe(ds[ds.length - 1]!.toUpperCase())
      expect(ds[ds.length - 1]!, id).toContain('TỐI THƯỢNG')
    }
  })

  it('từ bậc 2 trở lên, bậc nào cũng nêu được THẦN THÚ của nó', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      for (const ten of ds.slice(1)) {
        expect(co(ten, [...CHU_THU, 'đế', 'vương', 'chủ', 'thần']), `${id}: ${ten}`).toBe(true)
      }
    }
  })

  it('trong một con, sáu bậc KHÔNG tên nào trùng tên nào', () => {
    for (const [id, ds] of Object.entries(TEN_BAC_THEO_THU)) {
      expect(new Set(ds).size, id).toBe(ds.length)
    }
  })
})
