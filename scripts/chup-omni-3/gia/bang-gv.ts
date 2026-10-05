// DỮ LIỆU GIẢ cho ảnh BẢNG CHIẾN DỊCH của thầy (trang chụp OMNI 3) — hình dữ liệu chép từ tests/omni-3-thay-bang-bai.test.tsx, thêm em/dạng
// cho giống một lớp thật. Không có dữ liệu học sinh thật. `BANG` = bảng cũ (OMNI tắt dùng y nguyên); `OMNI_BANG` = `/gv/omni bang` khi OMNI bật.
import type { BangChienDich as DuBang, EmBang } from '../../../src/components/chien-dich/api'
import type { BangOmni } from '../../../server/src/omni-kieu'

const DANG = ['Danh pháp ester', 'Thuỷ phân ester đơn chức', 'Ester của phenol', 'Chất béo', 'Hiệu suất ester hoá']
const MA = ['D-DP', 'D-TP', 'D-PH', 'D-CB', 'D-HS']
const TEN = ['Nguyễn An', 'Trần Bình', 'Lê Chi', 'Phạm Dũng', 'Hoàng Giang', 'Vũ Hà', 'Đặng Khoa', 'Bùi Linh', 'Đỗ Minh', 'Ngô Nam']
// Tỉ lệ thành thạo theo dạng (bảng cũ) — mỗi hàng một em; null = dạng chưa có câu em làm.
const TI_LE: (number | null)[][] = [
  [0.92, 0.71, 0.4, 0.88, 0.62],
  [0.5, 0.2, 0.15, 0.7, null],
  [0.9, 0.8, 0.66, 0.95, 0.81],
  [0.35, 0.3, 0.1, 0.45, 0.2],
  [0.75, 0.6, 0.5, 0.8, 0.55],
  [0.98, 0.9, 0.85, 0.96, 0.9],
  [0.6, 0.45, 0.25, 0.65, 0.4],
  [0.82, 0.74, 0.55, 0.9, 0.7],
  [0.42, 0.38, 0.2, 0.5, null],
  [0.88, 0.85, 0.7, 0.92, 0.78],
]
const em = (i: number): EmBang => ({
  sbd: `S${i + 1}`,
  ten: TEN[i]!,
  coXat: 18 + ((i * 7) % 20),
  thanhThao: 6 + ((i * 5) % 14),
  canDayLai: i === 1 ? 2 : i === 3 ? 1 : 0,
  treNhip: i === 8 ? 3 : 0,
  huyetChien: i === 3,
  theoDang: Object.fromEntries(DANG.map((d, k) => [d, TI_LE[i]![k] ?? null])),
})

export const NOW_BANG = Date.UTC(2026, 9, 7, 3, 0, 0)

export const BANG: DuBang = {
  chienDich: { id: 'cd-1', ten: 'Bài 1 · Ester', lop: '12A1', maDe: ['DH-12-C1-B1'], hanNop: '2026-10-12', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 30, soEm: 10 },
  homNay: '2026-10-07',
  hetHan: false,
  lop: { coXat: 0.64, thanhThao: 0.38, huyetChien: 1, canDayLaiCau: 3, canDayLaiLuot: 7 },
  dang: DANG,
  em: TEN.map((_, i) => em(i)),
  canDayLai: [
    { qid: 'DH-12-C1-B1-I-17', stt: 17, dang: 'Ester của phenol', soEm: 4, mucDo: 'van_dung', qidCung: ['DH-12-C1-B1-I-17'] },
    { qid: 'DH-12-C1-B1-I-9', stt: 9, dang: 'Thuỷ phân ester đơn chức', soEm: 2 },
    { qid: 'DH-12-C1-B1-I-5', stt: 5, dang: 'Danh pháp ester', soEm: 1 },
  ],
} as DuBang

// P vi kỹ năng theo dạng (OMNI) — gần tỉ lệ cũ nhưng là xác suất đã vững; n = số câu em TỰ làm (không hỗ trợ, không lướt).
const P: number[][] = [
  [0.96, 0.82, 0.41, 0.93, 0.7],
  [0.55, 0.22, 0.12, 0.74, 0.3],
  [0.97, 0.9, 0.71, 0.98, 0.88],
  [0.38, 0.33, 0.09, 0.5, 0.18],
  [0.84, 0.66, 0.52, 0.87, 0.6],
  [0.99, 0.96, 0.92, 0.99, 0.95],
  [0.63, 0.47, 0.27, 0.7, 0.43],
  [0.9, 0.8, 0.58, 0.94, 0.77],
  [0.45, 0.4, 0.21, 0.55, 0.25],
  [0.95, 0.91, 0.77, 0.96, 0.85],
]
const trangThai = (p: number, n: number) => (n < 5 ? 'chua_du' : p >= 0.95 ? 'vung' : p < 0.6 ? 'chua_vung' : 'chua_du') as 'vung' | 'chua_vung' | 'chua_du'

export const OMNI_BANG: BangOmni = {
  ok: true,
  chienDich: { id: 'cd-1', ten: 'Bài 1 · Ester', hanNop: '2026-10-12', lop: '12A1' },
  em: TEN.map((ten, i) => ({ sbd: `S${i + 1}`, ten })),
  dang: DANG.map((ten, k) => ({ ma: MA[k]!, ten })),
  o: Object.fromEntries(TEN.map((_, i) => [`S${i + 1}`, Object.fromEntries(MA.map((ma, k) => {
    const n = 3 + ((i + k * 3) % 9)
    const p = P[i]![k]!
    return [ma, { p, n, trangThai: trangThai(p, n) }]
  }))])),
  sEm: Object.fromEntries(TEN.map((_, i) => [`S${i + 1}`, [0.04, 0.07, 0.03, 0.09, 0.05, 0.02, 0.06, 0.13, 0.08, 0.04][i]!])),
  khoangCach8: Object.fromEntries(TEN.map((_, i) => [`S${i + 1}`, [0.3, 1.8, 0, 2.4, 0.9, 0, 1.4, 0.4, 2.1, 0.1][i]!])),
  sanSang: Object.fromEntries(TEN.map((_, i) => [`S${i + 1}`, [0.81, 0.22, 0.95, 0.12, 0.6, 0.98, 0.35, 0.78, 0.18, 0.9][i]!])),
  hieuChuan: { soCaChot: 2, du: false },
  canThayChua: [
    { loai: 'nut_that', tieuDe: 'Vi kỹ năng: Hệ số NaOH với ester của phenol', phu: 'đã qua thang tự gỡ · 3 thẻ nút thắt', soEm: 4, qids: ['DH-12-C1-B1-I-17', 'DH-12-C1-B1-I-18'], vkn: 'D-PH#2' },
    { loai: 'nut_that', tieuDe: 'Vi kỹ năng: Bảo toàn khối lượng khi xà phòng hoá', phu: 'đã qua thang tự gỡ · 2 thẻ nút thắt', soEm: 3, qids: ['DH-12-C1-B1-I-22'], vkn: 'nen:bao_toan_khoi_luong' },
    { loai: 'so_y', tieuDe: 'Sơ ý cao: Bùi Linh (13%)', phu: 'Kiến thức vững nhưng sai khi chắc', soEm: 1, sbd: ['S8'] },
  ],
}

/** `/gv/omni cau-hinh-doc` cho thẻ cài đặt OMNI (hình của tests/omni-3-gv.test.ts). */
export const CAU_HINH_OMNI = { theLucLop: { '12A1': 40 }, maTran: { I: 18, II: 4, III: 6 }, macDinh: { theLuc: 40, maTran: { I: 18, II: 4, III: 6 } } }
