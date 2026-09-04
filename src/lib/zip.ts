// ĐÓNG GÓI .ZIP — bản tối giản, KHÔNG nén (phương thức "store").
//
// Vì sao tự viết thay vì thêm thư viện: thứ duy nhất cần gói là ảnh PNG, mà
// PNG đã nén sẵn — nén lại chỉ tốn thời gian máy để giảm vài phần trăm. Bản
// store chỉ cần CRC-32 và hai khối header, gói cả lớp 30 phiếu trong tích tắc,
// và không thêm một megabyte nào vào app mà thầy phải tải về.
//
// Đúng chuẩn APPNOTE 6.3.2, đủ để Finder trên máy Mac, File Explorer trên
// Windows và mọi app điện thoại mở được. Không hỗ trợ Zip64 — 30 phiếu ảnh
// chỉ vài megabyte, không tới ngưỡng 4 GB.

const BANG_CRC = (() => {
  const b = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    b[i] = c >>> 0
  }
  return b
})()

export function crc32(du: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < du.length; i++) c = BANG_CRC[(c ^ du[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Giờ sửa tệp kiểu MS-DOS — thiếu thì một số trình giải nén báo tệp hỏng. */
function gioDos(d: Date): { gio: number; ngay: number } {
  return {
    gio: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    ngay: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

export interface TepTrongZip {
  ten: string
  duLieu: Uint8Array<ArrayBuffer>
}

/** Gộp nhiều tệp thành một Blob .zip. Tên tệp mã hoá UTF-8 và bật cờ ngôn ngữ
 * (bit 11) để tên có dấu tiếng Việt không thành ký tự lạ trên Windows. */
export function taoZip(ds: TepTrongZip[], luc = new Date()): Blob {
  const { gio, ngay } = gioDos(luc)
  const bo = new TextEncoder()
  // BlobPart chứ không phải Uint8Array: TS mới phân biệt Uint8Array<ArrayBuffer>
  // với Uint8Array<ArrayBufferLike>, gộp chung mảng là không biên dịch được.
  const phan: BlobPart[] = []
  const muc: BlobPart[] = []
  let viTri = 0

  for (const t of ds) {
    const ten = bo.encode(t.ten)
    const crc = crc32(t.duLieu)
    const cuc = t.duLieu.length

    const dau = new DataView(new ArrayBuffer(30))
    dau.setUint32(0, 0x04034b50, true) // chữ ký khối cục bộ
    dau.setUint16(4, 20, true) // cần bản 2.0
    dau.setUint16(6, 0x0800, true) // bit 11: tên tệp là UTF-8
    dau.setUint16(8, 0, true) // 0 = store, không nén
    dau.setUint16(10, gio, true)
    dau.setUint16(12, ngay, true)
    dau.setUint32(14, crc, true)
    dau.setUint32(18, cuc, true)
    dau.setUint32(22, cuc, true)
    dau.setUint16(26, ten.length, true)
    dau.setUint16(28, 0, true)
    phan.push(new Uint8Array(dau.buffer), ten as Uint8Array<ArrayBuffer>, t.duLieu)

    const mc = new DataView(new ArrayBuffer(46))
    mc.setUint32(0, 0x02014b50, true) // chữ ký mục thư mục trung tâm
    mc.setUint16(4, 20, true)
    mc.setUint16(6, 20, true)
    mc.setUint16(8, 0x0800, true)
    mc.setUint16(10, 0, true)
    mc.setUint16(12, gio, true)
    mc.setUint16(14, ngay, true)
    mc.setUint32(16, crc, true)
    mc.setUint32(20, cuc, true)
    mc.setUint32(24, cuc, true)
    mc.setUint16(28, ten.length, true)
    mc.setUint32(42, viTri, true) // chỗ bắt đầu khối cục bộ
    muc.push(new Uint8Array(mc.buffer), ten)

    viTri += 30 + ten.length + cuc
  }

  const dauTT = viTri
  const coTT = muc.reduce((s, x) => s + (x as Uint8Array).length, 0)
  const cuoi = new DataView(new ArrayBuffer(22))
  cuoi.setUint32(0, 0x06054b50, true)
  cuoi.setUint16(8, ds.length, true)
  cuoi.setUint16(10, ds.length, true)
  cuoi.setUint32(12, coTT, true)
  cuoi.setUint32(16, dauTT, true)

  return new Blob([...phan, ...muc, new Uint8Array(cuoi.buffer)], { type: 'application/zip' })
}
