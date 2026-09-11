// CÁI THƯỚC — việc ĐẦU TIÊN của đợt bỏ hẳn Apps Script, trước khi chuyển một
// lệnh nào.
//
// VÌ SAO NÓ ĐI TRƯỚC: ngày 11/09 tôi đưa ra BỐN đường nhanh. Cả bốn đều có mặt
// trong mã, chạy đúng logic, và KHÔNG đường nào phục vụ được ai:
//
//   1. máy học sinh không có đường nào biết địa chỉ máy chủ mới;
//   2. tôi đo bằng trang `/do-tai` do chính Worker phục vụ nên lúc nào cũng 0 lỗi;
//   3. cờ `sinh_tai_d1` chỉ bật cho ca mở TỪ NAY — 88 ca cũ không ca nào có;
//   4. cửa `xinKeyBank` chặn đường nhanh vĩnh viễn trên điện thoại thầy.
//
// Cả bốn chỉ lộ ra khi ĐẾM ở chỗ dữ liệu của người dùng đọng lại. Không có cái
// thước này thì mỗi lần cắt một khối là một lần tin lời nhau.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CHUA_DUNG, daChuyenXong, dungBangDoiChieu, type SoMayChuMoi } from '../src/lib/doi-chieu-hai-ben'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const DC = fs.readFileSync(path.join(process.cwd(), 'src/lib/doi-chieu-hai-ben.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/components/KhoiMayChuMoi.tsx'), 'utf8')

const SO_DAY: SoMayChuMoi = {
  ca: 89, caChuaXoa: 70, luot: 311, luotCoDiem: 311, luotCoTen: 311, luotChuaVeSheet: 0,
  danhSach: 258, phongCho: 30, trangThai: 31, chanVao: 0, caSinhTaiD1: 89,
  chiTietCau: 900, banDoSai: 40, tienDoHs: 258,
}

describe('CHỈ ĐỌC — cái thước không được sửa gì ở đâu cả', () => {
  it('đường `/doi-chieu` chỉ có câu SELECT', () => {
    const han = WK.slice(WK.indexOf('async function doiChieuSo('), WK.indexOf('/** Mốc thời gian thành mili giây'))
    for (const cam of ['INSERT', 'UPDATE ', 'DELETE', 'ALTER', 'DROP']) {
      expect(han.toUpperCase(), cam).not.toContain(cam)
    }
  })

  it('tệp máy thầy cũng không ghi gì', () => {
    for (const cam of ['saveCauHinhMayChu', "method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },\n      body: JSON.stringify({ ca"]) {
      expect(DC).not.toContain(cam)
    }
  })

  it('đường đếm nằm trong khối ĐÒI mã bí mật', () => {
    expect(WK.indexOf("p === '/doi-chieu'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })

  it('cái thước KHÔNG còn đọc Google — 12/09 không còn bên kia để so', () => {
    // Trước 12/09 tệp này đặt số Sheet cạnh số máy chủ mới. Google bị cắt hẳn
    // thì việc còn lại là ĐẾM, và đếm ở đúng chỗ dữ liệu đọng lại.
    expect(DC).not.toContain('laySoSheet')
    expect(DC).not.toContain('sheet:')
    expect(MAN).not.toContain('laySoSheet')
  })
})

describe('BẢNG CHƯA DỰNG KHÁC HẲN BẢNG RỖNG', () => {
  it('Worker trả -1 khi truy vấn hỏng vì bảng chưa có', () => {
    const han = WK.slice(WK.indexOf('async function doiChieuSo('), WK.indexOf('async function doiChieuSo(') + 800)
    expect(han).toContain('return -1')
  })

  it('dòng chưa dựng được đánh dấu riêng, không lẫn với số 0', () => {
    const b = dungBangDoiChieu({ ...SO_DAY, chiTietCau: CHUA_DUNG })
    const d = b.find((x) => x.ten === 'Chi tiết từng câu')!
    expect(d.mayChuMoi).toBe(CHUA_DUNG)
    expect(d.daDung).toBe(false)
  })

  it('CHƯA DỰNG thì máy chủ CHƯA sẵn sàng', () => {
    expect(daChuyenXong(dungBangDoiChieu({ ...SO_DAY, chiTietCau: CHUA_DUNG }))).toBe(false)
  })

  it('bảng RỖNG thì vẫn là sẵn sàng — thầy vừa xoá sạch ca là rỗng đúng', () => {
    const b = dungBangDoiChieu({ ...SO_DAY, ca: 0, caChuaXoa: 0, luot: 0, luotCoDiem: 0, chiTietCau: 0, banDoSai: 0, tienDoHs: 0 })
    expect(daChuyenXong(b)).toBe(true)
  })
})

describe('MỖI DÒNG NÓI RÕ RỖNG THÌ MẤT GÌ', () => {
  it('không để thầy đoán ý nghĩa của một con số', () => {
    for (const d of dungBangDoiChieu(SO_DAY)) expect(d.nghia.length, d.ten).toBeGreaterThan(20)
  })

  it('dòng danh sách lớp nói thẳng hậu quả khi rỗng — mất cổng chặn số báo danh lạ', () => {
    const d = dungBangDoiChieu(SO_DAY).find((x) => x.ten === 'Danh sách lớp')!
    expect(d.nghia).toContain('cổng chặn')
  })
})

describe('MÀN CÀI ĐẶT', () => {
  it('có nút đếm và nói rõ nút chỉ đọc', () => {
    expect(MAN).toContain('Đếm dữ liệu trên máy chủ')
    expect(MAN).toContain('chỉ ĐỌC, không sửa gì')
  })

  it('hiện "chưa dựng" chứ không hiện số 0', () => {
    expect(MAN).toContain('chưa dựng')
    expect(MAN).toContain('d.mayChuMoi === CHUA_DUNG')
  })

  it('phân biệt rõ "chưa dựng" với số 0 ngay trên màn hình', () => {
    expect(MAN).toContain('0 là bảng')
    expect(MAN).toContain('chưa dựng là bảng chưa tồn tại')
  })
})
