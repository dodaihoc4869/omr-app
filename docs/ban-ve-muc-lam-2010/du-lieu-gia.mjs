// BẢNG SỐ LIỆU GIẢ DUY NHẤT của bản vẽ "Mức làm bài" (20/10/2026). Mọi con số trong muc-lam.html đều tính từ tệp này bằng các hàm bên dưới —
// không gõ tay số nào vào HTML. Số là GIẢ (tên giả, lớp giả); CÔNG THỨC và NGƯỠNG là đề xuất, NGƯỠNG TẠM chờ hiệu chỉnh bằng dữ liệu thật.
//
// Nguồn công thức (đều đã có trong repo, không thêm mô hình thứ tư):
//   T_đọc(câu)  = 8 + 0,35 × số_từ + 10 × số_hình   ← DOC_NEN_GIAY / DOC_GIAY_MOI_TU / DOC_HINH_GIAY (src/lib/len-bang-cau-hinh.ts, dùng ở thoi-gian-len-bang.ts)
//   hệ số đọc của em = e^(−τ_em) kẹp [0,75 ; 1,5], τ_em từ OMNI (server/src/omni-toc-do.ts: ln t = β_câu − τ_em); em chưa có τ ⇒ 1,0
//   kỳ vọng của em  = e^(β_câu − τ_em)  (chỉ tin khi lớp đã có ≥ 8 mẫu của câu — "β thật"); chưa đủ mẫu ⇒ KHÔNG xét Mức làm 4
//   sàn nghĩ theo phần: TẠM (I 6 s · II 12 s · III 15 s)
export const DOC = { nen: 8, moiTu: 0.35, hinh: 10 }
export const SAN_NGHI = { I: 6, II: 12, III: 15 }
export const NGUONG_TOP = 0.8 // Mức làm 4 từ 0,8 × kỳ vọng của em
export const NGUONG_CHAM = 2 // "Đúng nhưng chậm" của OMNI (> 2,0 × kỳ vọng), giữ nguyên, không phải một mức
export const HE_SO = { min: 0.75, max: 1.5 }
export const NGAY_BAT_DO = '21/10' // ngày bật đo đủ mọi nguồn (GIẢ để vẽ lượt cũ "chưa có số đo")
export const HOM_NAY = 'Thứ Ba 27/10/2026'

export const kep = (x, a, b) => Math.min(b, Math.max(a, x))
export const tDocGoc = (c) => Math.round(DOC.nen + DOC.moiTu * c.tu + DOC.hinh * c.hinh)
export const heSoDoc = (tau) => (tau == null ? 1 : kep(Math.exp(-tau), HE_SO.min, HE_SO.max))
export const tDocEm = (c, tau) => Math.round((DOC.nen + DOC.moiTu * c.tu + DOC.hinh * c.hinh) * heSoDoc(tau))
export const kyVongEm = (c, tau) => (c.kyVongLop == null ? null : Math.round(c.kyVongLop * Math.exp(-(tau ?? 0))))
export const sanNghi = (c) => SAN_NGHI[c.phan]

/** Mức làm của MỘT lượt đã đo được. Lượt `luot` (OMNI: sai và nộp ngay) tính thẳng Mức làm 1. Lượt không có số đo ⇒ 'chua'. */
export function mucCuaLuot({ giay, cau, tau = null, luot = false }) {
  if (luot) return { muc: 1, t: tDocEm(cau, tau), cham: false }
  if (giay == null) return { muc: 0 }
  const t = tDocEm(cau, tau)
  const san = sanNghi(cau)
  const kv = kyVongEm(cau, tau)
  const top = kv == null ? null : Math.round(NGUONG_TOP * kv)
  let muc = 1
  if (giay >= t) muc = 2
  if (giay >= t + san) muc = 3
  if (top != null && giay >= top && giay >= t + san) muc = 4
  return { muc, t, san, kv, top, cham: kv != null && giay > NGUONG_CHAM * kv }
}

export const TEN_MUC = {
  1: { ngan: 'Chưa đọc hết đề', dai: 'Nộp trước khi đọc hết đề' },
  2: { ngan: 'Đọc xong, chưa kịp nghĩ', dai: 'Đọc xong thì nộp ngay' },
  3: { ngan: 'Có nghĩ', dai: 'Có thời gian nghĩ' },
  4: { ngan: 'Làm kỹ', dai: 'Làm kỹ, đúng nhịp lớp' },
}

// ───────────────────────────── CÂU MẪU
export const CAU = {
  c12: { id: 'c12', so: 12, phan: 'I', tu: 46, hinh: 0, kyVongLop: 68, chuyenDe: 'Pin điện hóa', dang: 'Suất điện động của pin' },
  c07: { id: 'c07', so: 7, phan: 'III', tu: 72, hinh: 1, kyVongLop: 150, chuyenDe: 'Điện phân', dang: 'Điện phân dung dịch, tính khối lượng' },
  c15: { id: 'c15', so: 15, phan: 'II', tu: 88, hinh: 0, kyVongLop: 120, chuyenDe: 'Ăn mòn điện hóa', dang: 'Đúng – sai, ăn mòn' },
  c09: { id: 'c09', so: 9, phan: 'I', tu: 52, hinh: 0, kyVongLop: 60, chuyenDe: 'Pin điện hóa', dang: 'Chiều dòng điện' },
  c21: { id: 'c21', so: 21, phan: 'I', tu: 61, hinh: 0, kyVongLop: 75, chuyenDe: 'Điện phân', dang: 'Thứ tự điện phân' },
  c03: { id: 'c03', so: 3, phan: 'I', tu: 40, hinh: 0, kyVongLop: null, chuyenDe: 'Đại cương kim loại', dang: 'Dãy hoạt động' },
}

// ───────────────────────────── 19 EM SAI CÂU 12 (BTVN tuần 43) — 34 em làm, 15 đúng
export const LOP = { ten: '12A1', siSo: 34 }
export const BAI = { ten: 'BTVN tuần 43', han: '26/10' }
const SAI_C12 = [
  ['Phạm Quốc Huy', 0.2, 6], ['Nguyễn Hải Đăng', null, 9], ['Lê Thu Hà', -0.1, 11], ['Vũ Minh Quân', 0.05, 14], ['Đỗ Khánh Linh', null, 19],
  ['Trần Bảo Ngọc', 0.1, 25], ['Hoàng Gia Bảo', null, 27], ['Bùi Tuấn Kiệt', -0.2, 31], ['Ngô Diệp Chi', null, 28], ['Đặng Phúc Lâm', 0.25, 23], ['Lý Anh Thư', 0, 29],
  ['Phan Đức Thịnh', null, 38], ['Võ Mai Phương', 0.15, 41], ['Trịnh Nhật Nam', null, 47], ['Dương Ngọc Anh', -0.15, 52], ['Mai Hồng Nhung', null, 36], ['Cao Văn Tùng', 0.1, 44],
  ['Lương Tuệ Minh', null, 61], ['Tô Gia Hân', 0.2, 58],
]
export const SAI_CAU12 = SAI_C12.map(([ten, tau, giay]) => {
  const r = mucCuaLuot({ giay, cau: CAU.c12, tau })
  return { ten, tau, giay, ...r }
}).sort((a, b) => a.muc - b.muc || a.giay - b.giay)
export const SO_LAM_C12 = 34
// Lượt sai KHÁC của cùng câu 12 ở nơi làm khác (tờ chiếu "ai sai" thật gộp mọi nơi làm: 300 lượt gần nhất)
const THEM_C12 = [
  ['Phạm Quốc Huy', 0.2, 9, 'Luyện theo dạng', '24/10', '20:12'], ['Vũ Minh Quân', 0.05, 21, 'Luyện theo dạng', '24/10', '20:31'],
  ['Lương Tuệ Minh', null, 70, 'Luyện theo dạng', '24/10', '21:05'], ['Mai Hồng Nhung', null, 33, 'Luyện theo dạng', '24/10', '21:20'],
  ['Đỗ Khánh Linh', null, 17, 'Luyện theo dạng', '24/10', '21:44'], ['Lê Thu Hà', -0.1, 24, 'Tự sửa lỗi', '25/10', '19:08'],
  ['Bùi Tuấn Kiệt', -0.2, 38, 'Tự sửa lỗi', '25/10', '19:40'], ['Tô Gia Hân', 0.2, 49, 'Tự sửa lỗi', '25/10', '20:03'],
]
const gioBtvn = (i) => { const ph = 18 * 60 + 30 + i * 9; return `${String(Math.floor(ph / 60)).padStart(2, '0')}:${String(ph % 60).padStart(2, '0')}` }
const byTen = new Map(SAI_C12.map((r, i) => [r[0], i]))
export const LUOT_SAI_C12 = [
  ...SAI_C12.map(([ten, tau, giay], i) => ({ ten, tau, giay, nguon: 'BTVN', ngay: '26/10', gio: gioBtvn(i) })),
  ...THEM_C12.map(([ten, tau, giay, nguon, ngay, gio]) => ({ ten, tau, giay, nguon, ngay, gio })),
].map((l) => ({ ...l, ...mucCuaLuot({ giay: l.giay, cau: CAU.c12, tau: l.tau }) }))
export const EM_SAI_C12 = [...new Set(LUOT_SAI_C12.map((l) => l.ten))]
export const giayTbSaiC12 = () => Math.round(LUOT_SAI_C12.reduce((a, l) => a + l.giay, 0) / LUOT_SAI_C12.length)
export const SO_DUNG_C12 = SO_LAM_C12 - SAI_CAU12.length

export const demTheoMuc = (ds) => [1, 2, 3, 4].map((m) => ds.filter((x) => x.muc === m).length)
export const phanTram = (n, tong) => Math.round((100 * n) / tong)

// ───────────────────────────── HỒ SƠ MỘT EM (14 ngày: 13/10 → 27/10)
export const EM = { ten: 'Nguyễn Đức Anh', lop: '12A1', sbd: '12A1-07', tau: 0.05 }
// Bảng chéo: hàng = Mức làm 1..4, cột = [đúng, sai] (64 lượt đo được)
export const CHEO = [[4, 9], [5, 8], [22, 6], [9, 2]]
export const TONG_LUOT = 87
export const tongDo = () => CHEO.flat().reduce((a, b) => a + b, 0)
export const tongSai = () => CHEO.reduce((a, r) => a + r[1], 0)
export const tongDung = () => CHEO.reduce((a, r) => a + r[0], 0)
export const chuaCoSoDo = () => TONG_LUOT - tongDo()
export const LUOT_GAN_DAY = [
  { cau: CAU.c12, nguon: 'BTVN tuần 43', ngay: '26/10', giay: 14, ketQua: 0 },
  { cau: CAU.c07, nguon: 'BTVN tuần 43', ngay: '26/10', giay: 47, ketQua: 0 },
  { cau: CAU.c15, nguon: 'Luyện theo dạng', ngay: '25/10', giay: 96, ketQua: 1 },
  { cau: CAU.c09, nguon: 'BTVN tuần 43', ngay: '26/10', giay: 8, ketQua: 1 },
  { cau: CAU.c21, nguon: 'Tự sửa lỗi', ngay: '24/10', giay: 41, ketQua: 0 },
  { cau: CAU.c03, nguon: 'BTVN tuần 42', ngay: '19/10', giay: null, ketQua: 0 },
].map((l) => ({ ...l, ...mucCuaLuot({ giay: l.giay, cau: l.cau, tau: EM.tau }) }))

// ───────────────────────────── EM ĐƯỢC GỌI LÊN BẢNG: Lê Thu Hà (đúng là em #3 trong 19 em sai câu 12, τ −0,1, 11 giây)
export const HA = { ten: 'Lê Thu Hà', tau: -0.1 }
export const HA_CHEO = [[2, 6], [3, 6], [26, 5], [10, 2]] // 14 ngày: đo được 60 lượt
export const LUOT_HA = [
  { cau: CAU.c12, nguon: 'BTVN tuần 43', ngay: '26/10', giay: 11, ketQua: 0 },
  { cau: CAU.c09, nguon: 'BTVN tuần 43', ngay: '26/10', giay: 52, ketQua: 1 },
  { cau: CAU.c21, nguon: 'Luyện theo dạng', ngay: '25/10', giay: 22, ketQua: 0 },
].map((l) => ({ ...l, ...mucCuaLuot({ giay: l.giay, cau: l.cau, tau: HA.tau }) }))

// ───────────────────────────── LỚP 12A1 CÓ MẶT HÔM NAY (31/34): tên, bậc, điểm chăm, 14 ngày theo Mức làm — để vẽ bản chiếu
const DUNG_TEN = ['Nguyễn Đức Anh', 'Trần Minh Châu', 'Lê Hoàng Long', 'Phạm Thanh Trúc', 'Vũ Gia Huy', 'Đỗ Phương Thảo', 'Hoàng Bảo Khang', 'Bùi Ngọc Mai', 'Ngô Quang Vinh', 'Đặng Thu Trang', 'Lý Hải Nam', 'Phan Khánh Vy', 'Võ Tuấn Anh', 'Trịnh Diệu Linh', 'Cao Thái Sơn']
const VANG_MAT = new Set(['Võ Tuấn Anh', 'Trịnh Diệu Linh', 'Cao Thái Sơn'])
const KIEU = { voi: [12, 10, 20, 6], deu: [5, 8, 26, 9], ky: [2, 4, 24, 18] }
const BAC = { voi: [2, 3, 4, 5, 6], deu: [6, 7, 8, 9], ky: [9, 10, 11, 12] }
const goc34 = [
  ...SAI_CAU12.map((x) => ({ ten: x.ten, kieu: x.muc <= 2 ? 'voi' : 'deu' })),
  ...DUNG_TEN.map((ten, i) => ({ ten, kieu: i < 7 ? 'ky' : 'deu' })),
]
export const EM_CHIEU = goc34.filter((x) => !VANG_MAT.has(x.ten)).map((x, i) => {
  const bac = BAC[x.kieu][i % BAC[x.kieu].length]
  let mini = KIEU[x.kieu].map((n, j) => Math.max(1, n + ((i * 3 + j * 5) % 5) - 2))
  if (x.ten === EM.ten) mini = CHEO.map((r) => r[0] + r[1])
  if (x.ten === HA.ten) mini = HA_CHEO.map((r) => r[0] + r[1])
  return { ten: x.ten, bac, diem: Math.min(99, Math.round(bac * 8.1 + ((i * 7) % 9))), mini }
}).sort((a, b) => b.bac - a.bac || b.diem - a.diem)
const VANG_BAC = { 'Cao Thái Sơn': [8, 70], 'Trịnh Diệu Linh': [9, 82], 'Võ Tuấn Anh': [6, 52] }
export const EM_LOP = [
  ...EM_CHIEU.map((x) => ({ ...x, coMat: true })),
  ...Object.entries(VANG_BAC).map(([ten, [bac, diem]]) => ({ ten, bac, diem, mini: KIEU.deu, coMat: false })),
].map((x) => ({ ...x, du: Math.round((x.diem / 100) * 14) })).sort((a, b) => b.bac - a.bac || b.diem - a.diem)
export const nhomCua = (bac) => (bac >= 8 ? 'cham' : bac >= 6 ? 'chua-deu' : 'luoi')
export const THANG_BAC = Array.from({ length: 12 }, (_, i) => EM_CHIEU.filter((x) => x.bac === i + 1).length)

// ───────────────────────────── CẢ LỚP, HÔM QUA (BTVN, thứ Hai 26/10): 412 lượt, đo được 412
export const LOP_HOM_QUA = { luot: 412, mucDem: [38, 61, 233, 80], saiTheoMuc: [31, 38, 52, 21] }

// ───────────────────────────── ĐỘ PHỦ ĐO THEO NGUỒN — điền sau khi có kết quả khảo sát đường nộp (xem dung-ban-ve-muc-lam-2010.mjs)
export const GIAO_BAI = ['c12', 'c07', 'c15', 'c09', 'c21'].map((k) => CAU[k])
