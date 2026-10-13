// BẢN DUYỆT V2 (thầy 09/10/2026) — khoá hành vi các màn mới: Hôm nay V2 (00/01), Thần thú (06), trận (08/09: nhãn môn), Hành trình thầy (14), Ma trận đề (18).
// Số trên màn phải là số máy chủ gửi (không số minh hoạ); lỗi màn V2 ⇒ rơi về Sảnh cũ.
// SỬA CÓ CHỦ Ý (bản vẽ tối giản thầy chốt 09/10, canvas-v3 HS-HomNay/HS-HanhTrinh/HS-ThanThu/HS-CauDaLam/BoGop):
//   · Hôm nay: bỏ bước "Thử thách +1 bậc", bỏ thẻ Rương có thanh riêng (rương thành bước 3), bỏ "Đang mạnh lên", Túi đồ/Cửa hàng/Đăng xuất,
//     Ca gần nhất, Tu luyện, Bi-a; ca đang mở ⇒ CHỈ một dải "Vào thi" (trước có 2 nút cùng mở vào thi); Thần thú một lối vào (thanh dưới).
//   · Hành trình: tầng của từng bài (`hanhTrinh.bai`, đọc phòng thủ) + "Luyện thêm" (Thử sức thêm bật lại, Vé, Đề thử, Tu luyện, Bi-a).
//   · Thần thú: nút vàng "Cửa hàng" cạnh "Túi đồ" + hàng chữ "Đăng xuất". Câu đã làm: thẻ "Ca kiểm tra gần nhất" ở đầu màn.
// SỬA CÓ CHỦ Ý lần 2 (TRUNG TU giao diện 3 app, bản vẽ thầy duyệt 09/10 — trung-tu-canvas HS-HomNay/HS-HanhTrinh/HS-OnLai/HS-CuaEm):
//   · Hôm nay: chip CHỈ ở bước đang làm ⇒ "Còn 18 câu" (trùng số lớn 12/30) không còn trên màn (hàm baBuoc vẫn trả chip như cũ);
//     bỏ 3 nút "Chọn cách học" ⇒ Hôm nay không còn nút nào mở Thần thú (lối vào duy nhất: mục "Của em" → thẻ Thần thú).
//   · Hành trình: bỏ khối "Học cùng trò chơi" (ô Đoàn/Đảo — đã có nút Bắt đầu ở Hôm nay) ⇒ test "cửa Đảo trong mục trò chơi" đổi thành khoá
//     "không còn ô Đoàn/Đảo, Đảo khoá thì không lối nào mở Đảo"; ô tầng chưa tới đọc "Chưa mở" (khớp chú giải Vững/Đang luyện/Chưa mở, trước "Khoá");
//     tầng chung + chặng thành thanh bậc 4 tầng + ô số "3/5 · chặng · còn 6 câu" + "5/8 · dạng vững" (trước là câu "Hôm nay: Chặng …").
//   · Của em: thẻ Thần thú là MỘT nút lớn (tên truy cập bắt đầu bằng "Thần thú của em", kèm biệt danh + loài · hệ · cấp).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { docBaiHanhTrinh, docSanh, type KetQuaSanh, type SanhHoa2 } from '../src/components/hoa2/api'
import CauDaLam from '../src/components/hoa2/CauDaLam'
import { chiSoNhip, chuongCuaKhoi, khoiCuaHanhTrinh } from '../src/components/chien-dich/HanhTrinhV2'
import { CHUA_GAN_CHUYEN_DE, dungMaTranDe } from '../src/lib/ma-tran-de'
import type { TeacherExamSource } from '../src/data/examContent'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

const SANH = {
  ok: true, cheDo2: true, ngay: '2026-10-09',
  hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 },
  chienDich: null, theLuc: { con: 18, tong: 30 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: true, loiKhoaDao: 'Gỡ xong lỗi cũ để mở cầu.',
  ruong: { daLam: 12, tong: 30, moDuoc: false, daMo: false, qua: null }, bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 12,
}
const BAI = [
  { khoa: 'b1', ten: 'Bài 1 · Ester', tangMo: 2, vung: { a: 5, b: 8 } },
  { khoa: 'b2', ten: 'Bài 2 · Lipid', tangMo: 1, vung: null },
]
const sanh = (o: Record<string, unknown> = {}) => (docSanh({ ...SANH, ...o }) as Extract<KetQuaSanh, { sanh: SanhHoa2 }>).sanh

describe('Hành trình · đọc dữ liệu phòng thủ', () => {
  it('hanhTrinh.bai đọc phòng thủ: sai kiểu bỏ qua, vung sai kiểu chỉ bỏ vung; vắng ⇒ không có trường', () => {
    expect(docBaiHanhTrinh(undefined)).toBeNull()
    expect(docBaiHanhTrinh('x')).toBeNull()
    expect(docBaiHanhTrinh([])).toBeNull()
    expect(docBaiHanhTrinh([{ khoa: 'b1', ten: 'Bài 1', tangMo: 5 }, { khoa: '', ten: 'x', tangMo: 1 }, null, { khoa: 'b2', ten: 'Bài 2', tangMo: '2' }])).toBeNull()
    expect(docBaiHanhTrinh([{ khoa: 'b1', ten: ' Bài 1 ', tangMo: 3, vung: { a: 9, b: 6 } }, { khoa: 'b2', ten: 'Bài 2', tangMo: 1, vung: { a: 'x', b: 4 } }])).toEqual([
      { khoa: 'b1', ten: 'Bài 1', tangMo: 3, vung: { a: 6, b: 6 } },
      { khoa: 'b2', ten: 'Bài 2', tangMo: 1 },
    ])
    expect(sanh().hanhTrinh!.bai).toBeUndefined()
    expect(sanh({ hanhTrinh: { ...SANH.hanhTrinh, bai: BAI } }).hanhTrinh!.bai).toEqual([
      { khoa: 'b1', ten: 'Bài 1 · Ester', tangMo: 2, vung: { a: 5, b: 8 } },
      { khoa: 'b2', ten: 'Bài 2 · Lipid', tangMo: 1 },
    ])
  })
})

describe('Thần thú V2 · Câu đã làm (bản vẽ tối giản 09/10)', () => {
  const HO_SO = { pet: 'linh-ho', choice: false, cap: 7, exp: 120, wallet: 0, mastery: [], nickname: 'Linh Hồ' }
  it('Câu đã làm: thẻ "Ca kiểm tra gần nhất" ở đầu màn, bấm ⇒ Lịch sử ca; vắng dữ liệu ⇒ không thẻ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cheDo2: false }) })))
    const onLichSuCa = vi.fn()
    render(<CauDaLam token="tk" hoTen="Em" sbd="1" onVe={vi.fn()} caGanNhat={{ chu: 'Ca kiểm tra gần nhất: 8,0 điểm · 03/10', coDiem: true }} onLichSuCa={onLichSuCa} />)
    fireEvent.click(screen.getByRole('button', { name: /Ca kiểm tra gần nhất: 8,0 điểm · 03\/10/ }))
    expect(onLichSuCa).toHaveBeenCalledTimes(1)
    await waitFor(() => expect((globalThis.fetch as any).mock.calls.length).toBeGreaterThan(0))
    cleanup()
    render(<CauDaLam token="tk" hoTen="Em" sbd="1" onVe={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Ca kiểm tra gần nhất/ })).toBeNull()
  })
})

describe('Màn trận · Thần thú · thầy', () => {
  it('Hành trình thầy: khối từ nhãn; bốn chỉ số đếm từ bảng hôm nay; chương cộng bài + câu', () => {
    expect(khoiCuaHanhTrinh({ lop: 'Khối 12', ten: '' })).toBe('12')
    expect(khoiCuaHanhTrinh({ lop: null, ten: 'Hành trình giỏi hoá · Khối 10' })).toBe('10')
    const em = [
      { sbd: '1', ten: 'A', tang: 2, toiThieu: 30, daLam: 30, daXep: 30, conThieu: 0 },
      { sbd: '2', ten: 'B', tang: 3, toiThieu: 36, daLam: 0, daXep: 36, conThieu: 0 },
      { sbd: '3', ten: 'C', tang: 4, toiThieu: 36, daLam: 6, daXep: 30, conThieu: 6 },
      { sbd: '4', ten: 'D', tang: null, toiThieu: null, daLam: 0, daXep: 0, conThieu: 0 },
    ]
    expect(chiSoNhip(em)).toEqual({ tong: 4, duMuc: 1, coMuc: 3, chuaLam: 2, thieuCau: 1, tangCao: 2 })
    const bai = [
      { khoaBai: 'b1', tenBai: 'Bài 1', viTri: 1, chuong: 'C1', soCau: 30, to: [] },
      { khoaBai: 'b2', tenBai: 'Bài 2', viTri: 2, chuong: 'C1', soCau: 12, to: [] },
      { khoaBai: 'b3', tenBai: 'Bài 3', viTri: 3, chuong: 'C2', soCau: 20, to: [] },
    ]
    expect(chuongCuaKhoi(bai)).toEqual([{ chuong: 'C1', soBai: 2, soCau: 42 }, { chuong: 'C2', soBai: 1, soCau: 20 }])
  })
  it('ma trận đề: chuyên đề × Nhận biết/Thông hiểu/Vận dụng; câu thiếu nhãn vào "Chưa gắn"; tổng = số câu', () => {
    const c = (chuyenDe?: string, mucDo?: string) => ({ chuyenDe, mucDo }) as never
    const nguon = [{ maDe: 'D1', phanI: [c('Ester', 'biet'), c('Ester', 'hieu'), c('Ester', 'van_dung'), c('Lipid', 'biet')], phanII: [c('Ester', 'hieu')], phanIII: [c(undefined, undefined), c('Lipid', 'la')] }] as unknown as TeacherExamSource[]
    const mt = dungMaTranDe(nguon)
    expect(mt.tong).toBe(7)
    expect(mt.cot).toEqual({ biet: 2, hieu: 2, van_dung: 1, chua: 2 })
    expect(mt.hang.map((h) => [h.chuyenDe, h.tong])).toEqual([['Ester', 4], ['Lipid', 2], [CHUA_GAN_CHUYEN_DE, 1]])
    expect(mt.hang.reduce((a, h) => a + h.tong, 0)).toBe(mt.tong)
  })
})
