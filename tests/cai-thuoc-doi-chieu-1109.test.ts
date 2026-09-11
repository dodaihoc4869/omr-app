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

  it('số của Sheet đọc bằng `chiDuongCu` — không tự soi gương', () => {
    // Bẫy đã mù cả ngày 11/09: đo bằng công cụ do chính máy chủ phục vụ thì lúc
    // nào cũng đẹp. Ở đây phải ép đi ĐƯỜNG CŨ mới có số để so.
    const han = API.slice(API.indexOf('export async function laySoSheet('), API.indexOf('export async function laySoSheet(') + 1400)
    expect(han).toContain('danhSachCaThat(scriptUrl, secret, false, true)')
    expect(han).toContain('danhSachCaThat(scriptUrl, secret, true, true)')
  })
})

describe('BẢNG CHƯA DỰNG KHÁC HẲN BẢNG RỖNG', () => {
  it('Worker trả -1 khi truy vấn hỏng vì bảng chưa có', () => {
    const han = WK.slice(WK.indexOf('async function doiChieuSo('), WK.indexOf('async function doiChieuSo(') + 800)
    expect(han).toContain('return -1')
  })

  it('dòng chưa dựng KHÔNG bị chấm là lệch', () => {
    const b = dungBangDoiChieu({ soCa: 89, soCaChuaXoa: 70, soLuot: 311, soDanhSach: null }, { ...SO_DAY, chiTietCau: CHUA_DUNG })
    const d = b.find((x) => x.ten === 'Chi tiết từng câu')!
    expect(d.mayChuMoi).toBe(CHUA_DUNG)
    expect(d.khop).toBeNull()
  })

  it('nhưng CHƯA DỰNG thì cũng CHƯA XONG', () => {
    const b = dungBangDoiChieu({ soCa: 89, soCaChuaXoa: 70, soLuot: 311, soDanhSach: null }, { ...SO_DAY, chiTietCau: CHUA_DUNG })
    expect(daChuyenXong(b)).toBe(false)
  })
})

describe('KHÔNG BỊA SỐ', () => {
  it('Apps Script không có số đếm danh sách lớp ⇒ trả null, không trả 0', () => {
    const han = API.slice(API.indexOf('export async function laySoSheet('), API.indexOf('export async function laySoSheet(') + 1400)
    expect(han).toContain('soDanhSach: null')
  })

  it('dòng không đối chiếu được thì `khop` là null, không phải false', () => {
    const b = dungBangDoiChieu({ soCa: 89, soCaChuaXoa: 70, soLuot: 311, soDanhSach: null }, SO_DAY)
    expect(b.find((x) => x.ten === 'Danh sách lớp')!.khop).toBeNull()
  })
})

describe('CHẤM KHỚP / LỆCH', () => {
  it('hai bên bằng nhau ⇒ khớp', () => {
    const b = dungBangDoiChieu({ soCa: 89, soCaChuaXoa: 70, soLuot: 311, soDanhSach: 258 }, SO_DAY)
    expect(b.find((x) => x.ten === 'Ca kiểm tra (kể cả đã xoá)')!.khop).toBe(true)
    expect(b.find((x) => x.ten === 'Lượt thi')!.khop).toBe(true)
    expect(daChuyenXong(b)).toBe(true)
  })

  it('lệch một dòng là CHƯA XONG, kể cả lệch đúng một đơn vị', () => {
    const b = dungBangDoiChieu({ soCa: 89, soCaChuaXoa: 70, soLuot: 312, soDanhSach: 258 }, SO_DAY)
    expect(b.find((x) => x.ten === 'Lượt thi')!.khop).toBe(false)
    expect(daChuyenXong(b)).toBe(false)
  })

  it('mỗi dòng nói rõ LỆCH THÌ MẤT GÌ — không để thầy đoán', () => {
    const b = dungBangDoiChieu({ soCa: 1, soCaChuaXoa: 1, soLuot: 1, soDanhSach: 1 }, SO_DAY)
    for (const d of b) expect(d.nghia.length, d.ten).toBeGreaterThan(20)
  })
})

describe('MÀN CÀI ĐẶT', () => {
  it('có nút đối chiếu và nói rõ nút chỉ đọc', () => {
    expect(MAN).toContain('Đối chiếu Sheet ↔ máy chủ mới')
    expect(MAN).toContain('chỉ ĐỌC, không sửa gì ở cả hai nơi')
  })

  it('hiện "chưa dựng" chứ không hiện số 0', () => {
    expect(MAN).toContain('chưa dựng')
    expect(MAN).toContain('d.mayChuMoi === CHUA_DUNG')
  })

  it('dấu — cho dòng không đối chiếu được, và giải thích nó', () => {
    expect(MAN).toContain("{d.sheet === null ? '—' : d.sheet}")
    expect(MAN).toContain('không phải bằng không')
  })
})
