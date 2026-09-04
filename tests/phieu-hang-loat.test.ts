// TẢI PHIẾU HÀNG LOẠT — gói .zip tự viết và bảng chuyên đề của riêng một ca.
//
// Tệp zip hỏng thì thầy chỉ biết lúc giải nén trước mặt phụ huynh, nên test
// này đọc ngược lại từng byte header thay vì chỉ xem hàm có ném lỗi không.
import { describe, expect, it } from 'vitest'
import { crc32, taoZip } from '../src/lib/zip'
import { chuyenDeTuChiTiet, tenTepZipCa } from '../src/lib/phieu-hang-loat'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const bytes = (s: string) => new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>

describe('CRC-32', () => {
  // Giá trị chuẩn của chuỗi "123456789" — mọi bảng CRC-32 đều phải ra số này.
  it('khớp giá trị chuẩn', () => {
    expect(crc32(bytes('123456789'))).toBe(0xcbf43926)
  })
  it('dữ liệu rỗng cho 0', () => {
    expect(crc32(new Uint8Array(0))).toBe(0)
  })
})

describe('Gói .zip', () => {
  it('có đủ chữ ký khối cục bộ, thư mục trung tâm và khối kết thúc', async () => {
    const b = taoZip([{ ten: 'a.txt', duLieu: bytes('xin chao') }])
    const u = new Uint8Array(await b.arrayBuffer())
    const dv = new DataView(u.buffer)
    expect(dv.getUint32(0, true)).toBe(0x04034b50)
    // khối kết thúc nằm ở 22 byte cuối
    expect(dv.getUint32(u.length - 22, true)).toBe(0x06054b50)
    expect(dv.getUint16(u.length - 22 + 10, true)).toBe(1) // 1 tệp
  })

  it('ghi đúng số tệp và vị trí thư mục trung tâm khi có nhiều tệp', async () => {
    const ds = ['a.png', 'b.png', 'c.png'].map((ten) => ({ ten, duLieu: bytes(ten.repeat(20)) }))
    const u = new Uint8Array(await taoZip(ds).arrayBuffer())
    const dv = new DataView(u.buffer)
    const cuoi = u.length - 22
    expect(dv.getUint16(cuoi + 8, true)).toBe(3)
    const dauTT = dv.getUint32(cuoi + 16, true)
    expect(dv.getUint32(dauTT, true)).toBe(0x02014b50)
    expect(dauTT + dv.getUint32(cuoi + 12, true)).toBe(cuoi)
  })

  it('không nén: kích thước nén = kích thước gốc, CRC ghi đúng', async () => {
    const du = bytes('noi dung thu')
    const u = new Uint8Array(await taoZip([{ ten: 't.txt', duLieu: du }]).arrayBuffer())
    const dv = new DataView(u.buffer)
    expect(dv.getUint16(8, true)).toBe(0) // 0 = store
    expect(dv.getUint32(14, true)).toBe(crc32(du))
    expect(dv.getUint32(18, true)).toBe(du.length)
    expect(dv.getUint32(22, true)).toBe(du.length)
  })

  it('bật cờ UTF-8 để tên tệp có dấu tiếng Việt không vỡ trên Windows', async () => {
    const u = new Uint8Array(await taoZip([{ ten: 'phiếu-Hiền.png', duLieu: bytes('x') }]).arrayBuffer())
    const dv = new DataView(u.buffer)
    expect(dv.getUint16(6, true) & 0x0800).toBe(0x0800)
    const dai = dv.getUint16(26, true)
    expect(new TextDecoder().decode(u.slice(30, 30 + dai))).toBe('phiếu-Hiền.png')
  })
})

const row = (chuyenDe: string, dungSai: boolean | null): ChiTietCauRow => ({
  phan: 'I',
  soCau: 1,
  qid: Math.random().toString(36),
  chuyenDe,
  mucDo: '',
  dapAnChon: '',
  dapAnDung: '',
  dungSai,
  giay: null,
})

describe('Chuyên đề của riêng một ca', () => {
  it('đếm đúng số câu và số câu sai từng chuyên đề', () => {
    const cd = chuyenDeTuChiTiet([
      row('Ester – lipid', false),
      row('Ester – lipid', true),
      row('Ester – lipid', false),
      row('Carbohydrate', true),
    ])
    expect(cd[0]).toEqual({ ten: 'Ester – lipid', soCau: 3, soSai: 2 })
    expect(cd[1]).toEqual({ ten: 'Carbohydrate', soCau: 1, soSai: 0 })
  })

  it('sắp giảm dần theo số câu sai', () => {
    const cd = chuyenDeTuChiTiet([row('A', true), row('B', false), row('B', false)])
    expect(cd.map((c) => c.ten)).toEqual(['B', 'A'])
  })

  it('câu không ghi chuyên đề thì BỎ, không gộp vào ô "khác"', () => {
    expect(chuyenDeTuChiTiet([row('', false), row('  ', false)])).toEqual([])
  })

  it('câu bỏ trống (dungSai null) không tính là sai', () => {
    expect(chuyenDeTuChiTiet([row('A', null), row('A', true)])[0]).toEqual({ ten: 'A', soCau: 2, soSai: 0 })
  })
})

describe('Tên tệp zip', () => {
  it('bỏ dấu, kèm ngày', () => {
    expect(tenTepZipCa('Kiểm tra 45 phút — Ester', '802553', new Date('2026-09-04T08:00:00+07:00'))).toBe('phieu-Kiem-tra-45-phut-Ester-20260904.zip')
  })
  it('ca không đặt tên thì lấy mã ca', () => {
    expect(tenTepZipCa('', '802553', new Date('2026-09-04T08:00:00+07:00'))).toBe('phieu-ca-802553-20260904.zip')
  })
})
