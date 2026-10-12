// @vitest-environment jsdom
// BẢNG "NHỊP HỌC CỦA EM · TỪ 01/10" ở app học sinh (thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi: "hiện rõ một bảng ngay đầu thông tin lười hay chăm
// chỉ … ghi thêm 1 câu trong bảng thầy cũng thấy điều này"; "6 ngày liền làm đủ mới thoát nhóm lười nhé"). Kiểm: dữ liệu giả của bản vẽ KHỚP phép
// thuần máy chủ · đọc trả lời chặt · chữ (việc tiếp, ra khỏi nhóm Lười, tốc độ, ô ngày).
// SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10: "gộp hai phần làm một"): bảng "Nhịp học của em" riêng (NhipHocEm.tsx — số lớn, dòng điều kiện, ba ô số, khối
// "Cách ra khỏi nhóm Lười" có nút "Học ngay") đã GỠ; Nhịp học nay là phần dưới của thẻ "Hôm nay của em" (TheHomNayEm.tsx), MỘT nút học. Giao diện + nạp /
// bản nhớ / lỗi ẩn gọn / đứng đầu màn ⇒ tests/the-hom-nay-em-1210e.test.tsx. Ở đây bỏ test của các hàm đã gỡ theo giao diện cũ (chuDieuKienEm, chuThoatLuoi,
// chuNutHocNgay, oSoEm); câu Lười mới = `chuRaKhoiLuoi`.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

import { chuRaKhoiLuoi, chuTocDo, chuViecTiep, docNhipHocEm, layNhipHocEm, loaiONgay } from '../src/lib/nhip-hoc-em'
import { tomTatNhip, viecTiepNhip } from '../server/src/nhip-hoc-luat'
import { NHIP_EM_CHAM, NHIP_EM_CHUA_DEU, NHIP_EM_CHUA_DU, NHIP_EM_LUOI, NHIP_EM_LUOI_DANG_THOAT } from '../scripts/chup-v2/gia/nhip-hoc-em'

afterEach(() => {
  vi.unstubAllGlobals()
})

const traLoi = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })

describe('dữ liệu giả của bản vẽ khớp đúng phép thuần máy chủ (em và thầy cùng một số)', () => {
  it.each([
    ['Chăm', NHIP_EM_CHAM],
    ['Lười', NHIP_EM_LUOI],
    ['Lười đang thoát', NHIP_EM_LUOI_DANG_THOAT],
    ['Chưa đều', NHIP_EM_CHUA_DEU],
    ['Chưa đủ dữ liệu', NHIP_EM_CHUA_DU],
  ] as const)('%s', (_, k) => {
    const t = tomTatNhip(k.ngay, k.homNay)
    expect({ nhom: t.nhom, soNgayQua: t.soNgayQua, soNgayDu: t.soNgayDu, chuoi: t.chuoiDuGanNhat, thieu: t.tongCauThieu, lam: t.tongLam + (t.homNay?.lam ?? 0), gan: t.ngayDuGanNhat, bo: t.chuoiKhongLam })
      .toEqual({ nhom: k.nhom, soNgayQua: k.soNgayQua, soNgayDu: k.soNgayDu, chuoi: k.chuoiDuGanNhat, thieu: k.tongCauThieu, lam: k.tongDaLam, gan: k.ngayDuGanNhat, bo: k.chuoiBo })
    expect(viecTiepNhip(t)).toEqual(k.viecTiep)
  })
})

describe('đọc trả lời /hs/nhip-hoc (chặt — sai ⇒ null, bảng ẩn)', () => {
  it('đúng hợp đồng ⇒ giữ nguyên; thiếu khung / ngày hỏng / việc tiếp lệch nhóm ⇒ null', () => {
    expect(docNhipHocEm(JSON.parse(JSON.stringify(NHIP_EM_LUOI)))).toEqual(NHIP_EM_LUOI)
    expect(docNhipHocEm({ ok: false, error: 'x' })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, nhom: 'gioi' })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, ngay: [{ ngay: '12/10', muc: 1, lam: 1 }] })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, viecTiep: NHIP_EM_LUOI.viecTiep })).toBeNull()
    expect(docNhipHocEm({ ...NHIP_EM_CHAM, tocDo: { soNhanh: 'x' } })).toMatchObject({ tocDo: null })
  })
  it('layNhipHocEm: gửi đúng token tới /hs/nhip-hoc; máy chủ lỗi / 404 / mất mạng / không token ⇒ null', async () => {
    const f = vi.fn(async () => traLoi(NHIP_EM_CHAM))
    vi.stubGlobal('fetch', f)
    expect(await layNhipHocEm('tk-em')).toEqual(NHIP_EM_CHAM)
    expect(f).toHaveBeenCalledWith('https://may.test/hs/nhip-hoc', expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'tk-em' }) }))
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: false, error: 'Em đăng nhập lại để xem nhịp học.' })))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({}, 404)))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await layNhipHocEm('tk-em')).toBeNull()
    expect(await layNhipHocEm('')).toBeNull()
  })
})

describe('chữ của bảng (đúng bản vẽ, lời thẳng)', () => {
  it('việc tiếp: Chăm giữ chuỗi · Chưa đều số ngày cần thêm + nhắc giữ chuỗi · hôm nay đã đủ', () => {
    expect(chuViecTiep(NHIP_EM_CHAM)).toBe('còn 12 câu nữa là đủ mức hôm nay — em giữ được chuỗi 7 ngày liền.')
    expect(chuViecTiep({ ...NHIP_EM_CHAM, homNayMuc: { muc: 30, lam: 30 }, viecTiep: { loai: 'giu-chuoi', cauConHomNay: 0, homNayDu: true, chuoiNeuDu: 7 } }))
      .toBe('hôm nay em đã đủ mức — chuỗi đang là 7 ngày liền đủ mức. Mai làm đủ mức để giữ chuỗi.')
    expect(chuViecTiep(NHIP_EM_CHUA_DEU)).toBe(
      'cần thêm 14 ngày đủ mức (tính cả hôm nay) để lên nhóm Chăm — hôm nay còn 25 câu. Em đang ở ngoài nhóm Lười nhờ 6 ngày liền đủ mức — giữ chuỗi này để không quay lại.',
    )
    expect(chuViecTiep({ ...NHIP_EM_CHUA_DEU, viecTiep: { loai: 'len-cham', ngayCanThem: 0, cauConHomNay: 0, homNayDu: true, nhoChuoi: false, chuoi: 3 } })).toBe('hôm nay em đã đủ mức — hết hôm nay em lên nhóm Chăm.')
  })
  it('ra khỏi nhóm Lười: k/6 ngày, câu còn hôm nay; hôm nay đủ ⇒ đã cộng (không còn nút "Học ngay" — một nút học ở phần chính)', () => {
    expect(chuRaKhoiLuoi(NHIP_EM_LUOI)).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 0/6 ngày, hôm nay còn 30 câu nữa là được 1/6 ngày.')
    expect(chuRaKhoiLuoi(NHIP_EM_LUOI_DANG_THOAT)).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 3/6 ngày, hôm nay còn 18 câu nữa là được 4/6 ngày.')
    const du = { ...NHIP_EM_LUOI_DANG_THOAT, homNayMuc: { muc: 30, lam: 30 }, viecTiep: { loai: 'thoat-luoi' as const, coNgay: 4, canNgay: 6, cauConHomNay: 0, homNayDu: true } }
    expect(chuRaKhoiLuoi(du)).toBe('Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có 4/6 ngày, đã tính hôm nay. Mai làm đủ mức là được 5/6 ngày.')
    expect(chuViecTiep(NHIP_EM_LUOI)).toBe(chuRaKhoiLuoi(NHIP_EM_LUOI))
  })
  it('tốc độ làm bài: bình thường · quá nhanh mà đúng thấp · cần để mắt · chưa đủ lượt', () => {
    expect(chuTocDo(NHIP_EM_CHAM.tocDo!)).toBe('Tốc độ làm bài bình thường: 2/96 lượt dưới 8 giây.')
    expect(chuTocDo(NHIP_EM_LUOI.tocDo!)).toBe('21/49 lượt em trả lời dưới 8 giây, nhóm này chỉ đúng 28%. Đọc hết đề rồi mới chọn.')
    expect(chuTocDo({ soNhanh: 10, soCoGiay: 38, dungNhanh: 20, coTuTinh: true, muc: 'chu-y' })).toBe(
      '10/38 lượt em trả lời quá nhanh (dưới 8 giây, câu tự tính dưới 15 giây) (26%), nhóm này đúng 20%. Đọc hết đề rồi mới chọn.',
    )
    expect(chuTocDo(NHIP_EM_CHUA_DU.tocDo!)).toBe('Tốc độ làm bài: cần ít nhất 20 lượt đo được số giây để xét, em đang có 7.')
  })
  it('ô ngày: bốn mức của bảng Bài hằng ngày; hôm nay chưa làm ⇒ chờ', () => {
    expect(NHIP_EM_LUOI.ngay.map((x) => loaiONgay(x, NHIP_EM_LUOI.homNay))).toEqual(['du', 'thieu-it', 'thieu-nhieu', 'du', 'thieu-nhieu', 'khong-lam', 'khong-lam', 'khong-lam', 'khong-lam', 'thieu-it', 'thieu-nhieu', 'cho'])
    expect(loaiONgay(NHIP_EM_CHAM.ngay[11]!, NHIP_EM_CHAM.homNay)).toBe('thieu-it')
  })
})
