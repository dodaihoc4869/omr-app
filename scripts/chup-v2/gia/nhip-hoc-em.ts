// LÀN NHỊP EM 12/10C — trả lời GIẢ của `/hs/nhip-hoc` (bảng "Nhịp học của em" ở app học sinh), dựng ĐÚNG số trên hai bản vẽ thầy duyệt
// (HS-Cham: 10/11 ngày · 6 ngày liền · 352 câu · 18/30 · 2/96 lượt dưới 8 giây · "còn 12 câu … chuỗi 7 ngày liền";
//  HS-Luoi: 2/11 ngày · bỏ 4 ngày liền 06–09/10 · 236 câu còn thiếu · 04/10 · 0/30 · 21/49 lượt đúng 28% · 0/6 · "Học ngay · 30 câu hôm nay").
// Dùng chung cho trang chụp ảnh (trang.tsx) và test giao diện (tests/nhip-hoc-em-1210c.test.tsx). Không dữ liệu học sinh thật.
import type { KetQuaNhipHocEm } from '../../../server/src/nhip-hoc-kieu'
import { tomTatNhip, viecTiepNhip } from '../../../server/src/nhip-hoc-luat'

const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const dai = (lam: readonly number[], muc = 30) => lam.map((l, i) => ({ ngay: NGAY[i]!, muc, lam: l }))

/** Em Chăm (bản vẽ HS-Cham): đ đ đ đ (thiếu ít) đ đ đ đ đ đ · hôm nay 18/30. */
export const NHIP_EM_CHAM: KetQuaNhipHocEm = {
  ok: true, tu: '2026-10-01', homNay: '2026-10-12', nhom: 'cham', soNgayQua: 11, soNgayDu: 10, phanTram: 91,
  ngay: dai([30, 32, 30, 33, 20, 30, 34, 30, 31, 32, 32, 18]),
  chuoiDuGanNhat: 6, tongDaLam: 352, tongCauThieu: 10, ngayDuGanNhat: '2026-10-11', homNayMuc: { muc: 30, lam: 18 }, chuoiBo: null,
  tocDo: { soNhanh: 2, soCoGiay: 96, dungNhanh: 50, coTuTinh: false, muc: 'tot' },
  viecTiep: { loai: 'giu-chuoi', cauConHomNay: 12, homNayDu: false, chuoiNeuDu: 7 },
}

/** Em Lười (bản vẽ HS-Luoi): đ · thiếu ít · thiếu nhiều · đ · thiếu nhiều · 4 ngày không làm · thiếu ít · thiếu nhiều · hôm nay 0/30. */
export const NHIP_EM_LUOI: KetQuaNhipHocEm = {
  ok: true, tu: '2026-10-01', homNay: '2026-10-12', nhom: 'luoi', soNgayQua: 11, soNgayDu: 2, phanTram: 18,
  ngay: dai([30, 15, 2, 30, 1, 0, 0, 0, 0, 15, 1, 0]),
  chuoiDuGanNhat: 0, tongDaLam: 94, tongCauThieu: 236, ngayDuGanNhat: '2026-10-04', homNayMuc: { muc: 30, lam: 0 },
  chuoiBo: { dai: 4, tu: '2026-10-06', den: '2026-10-09' },
  tocDo: { soNhanh: 21, soCoGiay: 49, dungNhanh: 28, coTuTinh: false, muc: 'xau' },
  viecTiep: { loai: 'thoat-luoi', coNgay: 0, canNgay: 6, cauConHomNay: 30, homNayDu: false },
}

/** Em Lười đang trên đường thoát: đủ 3 ngày liền tới hôm qua, hôm nay 12/30. */
export const NHIP_EM_LUOI_DANG_THOAT: KetQuaNhipHocEm = {
  ...NHIP_EM_LUOI,
  ngay: dai([30, 15, 2, 0, 0, 0, 0, 1, 30, 31, 30, 12]),
  soNgayDu: 4, phanTram: 36, chuoiDuGanNhat: 3, tongDaLam: 151, tongCauThieu: 192, ngayDuGanNhat: '2026-10-11', homNayMuc: { muc: 30, lam: 12 },
  chuoiBo: { dai: 4, tu: '2026-10-04', den: '2026-10-07' },
  viecTiep: { loai: 'thoat-luoi', coNgay: 3, canNgay: 6, cauConHomNay: 18, homNayDu: false },
}

/** Em Chưa đều (vừa ra khỏi nhóm Lười nhờ 6 ngày liền). */
export const NHIP_EM_CHUA_DEU: KetQuaNhipHocEm = {
  ...NHIP_EM_LUOI,
  nhom: 'chua-deu', ngay: dai([0, 0, 0, 0, 0, 30, 30, 30, 30, 30, 30, 5]),
  soNgayDu: 6, phanTram: 55, chuoiDuGanNhat: 6, tongDaLam: 185, tongCauThieu: 150, ngayDuGanNhat: '2026-10-11', homNayMuc: { muc: 30, lam: 5 },
  chuoiBo: { dai: 5, tu: '2026-10-01', den: '2026-10-05' },
  tocDo: { soNhanh: 4, soCoGiay: 60, dungNhanh: 75, coTuTinh: false, muc: 'tot' },
  viecTiep: { loai: 'len-cham', ngayCanThem: 14, cauConHomNay: 25, homNayDu: false, nhoChuoi: true, chuoi: 6 },
}

/** Em mới vào (11/10): mới 1 ngày đã qua ⇒ Chưa đủ dữ liệu. */
export const NHIP_EM_CHUA_DU: KetQuaNhipHocEm = {
  ok: true, tu: '2026-10-11', homNay: '2026-10-12', nhom: 'chua-du', soNgayQua: 1, soNgayDu: 1, phanTram: 100,
  ngay: [{ ngay: '2026-10-11', muc: 24, lam: 24 }, { ngay: '2026-10-12', muc: 24, lam: 6 }],
  chuoiDuGanNhat: 1, tongDaLam: 30, tongCauThieu: 0, ngayDuGanNhat: '2026-10-11', homNayMuc: { muc: 24, lam: 6 }, chuoiBo: null,
  tocDo: { soNhanh: 0, soCoGiay: 7, dungNhanh: null, coTuTinh: false, muc: 'chua-du' },
  viecTiep: { loai: 'chua-du', conNgay: 2, cauConHomNay: 18, homNayDu: false },
}

/** Dải dài (30 ngày, hôm nay 30/10) — kiểm dải ô xuống hàng (14 ô/hàng điện thoại, 21 ô/hàng máy tính). Số tính lại bằng đúng phép thuần máy chủ. */
export function nhipEmDai(): KetQuaNhipHocEm {
  const ngay = Array.from({ length: 30 }, (_, i) => ({ ngay: `2026-10-${String(i + 1).padStart(2, '0')}`, muc: 30, lam: i === 29 ? 20 : i % 9 === 4 ? 18 : 30 + (i % 3) }))
  const t = tomTatNhip(ngay, '2026-10-30')
  return {
    ok: true, tu: '2026-10-01', homNay: '2026-10-30', nhom: t.nhom, soNgayQua: t.soNgayQua, soNgayDu: t.soNgayDu, phanTram: Math.round((100 * t.soNgayDu) / t.soNgayQua), ngay,
    chuoiDuGanNhat: t.chuoiDuGanNhat, tongDaLam: t.tongLam + (t.homNay?.lam ?? 0), tongCauThieu: t.tongCauThieu, ngayDuGanNhat: t.ngayDuGanNhat, homNayMuc: t.homNay,
    chuoiBo: t.chuoiKhongLam, tocDo: NHIP_EM_CHAM.tocDo, viecTiep: viecTiepNhip(t),
  }
}

/** Chọn bộ giả theo tham số trang chụp `nhe=cham|cham-dai|luoi|luoi-thoat|chua-deu|chua-du|loi`. */
export function nhipEmGia(loai: string | null): KetQuaNhipHocEm | { ok: false; error: string } {
  if (loai === 'loi') return { ok: false, error: 'Chưa tải được nhịp học của em. Em thử lại sau ít phút.' }
  if (loai === 'cham-dai') return nhipEmDai()
  return loai === 'luoi' ? NHIP_EM_LUOI : loai === 'luoi-thoat' ? NHIP_EM_LUOI_DANG_THOAT : loai === 'chua-deu' ? NHIP_EM_CHUA_DEU : loai === 'chua-du' ? NHIP_EM_CHUA_DU : NHIP_EM_CHAM
}
