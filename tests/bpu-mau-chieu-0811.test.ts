// Bảng Bình Phản Ứng dùng ĐÚNG bảng màu tờ chiếu cũ (thầy 08/11 «đo chính xác»): mỗi mã màu của src/lib/bpu/mau-chieu.ts phải có trong tờ.
import { describe, expect, it } from 'vitest'
import { MAU, MAU_CHIEU } from '../src/lib/bpu/mau-chieu'
import { GIAO_DIEN_TO_CHIEU, CSS_GIAO_DIEN_TO_CHIEU } from '../src/lib/giao-dien-to-chieu'
import fs from 'node:fs'
import path from 'node:path'

const toCss = fs.readFileSync(path.join(__dirname, '../src/lib/giao-dien-to-chieu.ts'), 'utf8').toLowerCase()
describe('bảng màu màn chiếu của Bình Phản Ứng = tờ chiếu cũ', () => {
  it('nền bảng / giấy / chữ / chữ phụ trùng hằng số của tờ', () => {
    expect(MAU.bang).toBe(GIAO_DIEN_TO_CHIEU.NEN_BANG)
    expect(MAU.giay).toBe(GIAO_DIEN_TO_CHIEU.GIAY)
    expect(MAU.chu).toBe(GIAO_DIEN_TO_CHIEU.CHU)
    expect(MAU.phu).toBe(GIAO_DIEN_TO_CHIEU.PHU)
    expect(typeof CSS_GIAO_DIEN_TO_CHIEU).toBe('string')
  })
  it('thẻ giấy, ba bậc giấy tối, nhãn xanh sáng / tối đều là giá trị có sẵn trong tờ', () => {
    for (const m of [MAU.the, MAU.mat, MAU.mat2, MAU.mat3, MAU.nhan, MAU.nhanToi]) expect(toCss).toContain(m)
  })
  it('gốc bảng nhận đủ 10 biến --tr-chieu-* mà bpu-bang.css dùng', () => {
    const css = fs.readFileSync(path.join(__dirname, '../src/components/bpu/bpu-bang.css'), 'utf8')
    const dung = new Set([...css.matchAll(/var\((--tr-chieu-[a-z0-9-]+)\)/g)].map((x) => x[1]))
    for (const v of dung) expect(Object.keys(MAU_CHIEU)).toContain(v)
    expect(Object.keys(MAU_CHIEU)).toHaveLength(10)
  })
})
