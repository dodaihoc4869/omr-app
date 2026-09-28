// Dữ liệu giả CÓ CHỦ Ý DÀI (tên em, tên lớp, tên chiến dịch, tên dạng) để dò tràn chữ.
export const TEN = ['Nguyễn Thị Phương Thảo Nguyên', 'Trần Bảo', 'Lê Hoàng Minh Khôi', 'Phạm Ngọc Bảo Châu', 'Võ Thị Thanh Huyền', 'Đặng Quốc Anh', 'Huỳnh Tấn Phát', 'Bùi Thị Mỹ Duyên', 'Hồ Nguyễn Khánh Linh', 'Dương Minh Trí', 'Tôn Nữ Hoàng Yến Nhi', 'Lý Gia Hân']
export const LOP = '12A1 Chuyên Hoá'
export const DANG = ['Danh pháp ester và đồng đẳng', 'Đồng phân cấu tạo', 'Thuỷ phân ester đơn chức trong môi trường kiềm', 'Chất béo', 'Đốt cháy hỗn hợp ester', 'Xà phòng hoá']
const now = Date.now()
const iso = (ms) => new Date(ms).toISOString()
const ngay = (d) => new Date(now + d * 86400000).toISOString().slice(0, 10)
export const HOM_NAY = ngay(0)

const cdTom = (i, them = {}) => ({ id: 'cd-' + i, ten: ['Ester – Lipid: ôn tập toàn chương trước kiểm tra giữa kỳ', 'Cacbohiđrat', 'Amin – Amino axit – Peptit – Protein nâng cao'][i % 3], lop: i === 1 ? null : LOP, maDe: ['DE-ESTER-LIPID-01', 'DE-B'], hanNop: ngay(3 + i), theLucNgay: 40, huyetChien: i === 0, maCa: null, taoLuc: iso(now - 86400000 * 2), trangThai: 'dang_chay', soCau: 124, soEm: 38, hetHan: false, thongKe: { coXat: 0.93, thanhThao: 0.34, dungNhip: 21, emLamQuaDu: 12, quaTai: 3, canDayLaiCau: 14, canDayLaiLuot: 126, mucCanHomNay: 0.7 }, ...them })
const emBang = (i) => ({ sbd: 'HS' + (1000 + i), ten: TEN[i % TEN.length], coXat: 40 + i, thanhThao: 20 + i, canDayLai: i % 4, treNhip: i % 3 ? 0 : 5, huyetChien: i % 5 === 0, theoDang: Object.fromEntries(DANG.map((d, k) => [d, ((i * 7 + k * 13) % 100) / 100])), hangTheoDang: Object.fromEntries(DANG.map((d, k) => [d, 'L' + (1 + ((i + k) % 4))])), daLamTheoDang: Object.fromEntries(DANG.map((d, k) => [d, k === 2 && i % 2 ? 0 : 0.6])), nhip: ['vuot', 'dung', 'tre12', 'tre3'][i % 4], soNgayTre: i % 4 })
const bang = () => ({
  chienDich: cdTom(0),
  homNay: HOM_NAY, hetHan: false,
  lop: { coXat: 0.93, thanhThao: 0.34, huyetChien: 2, canDayLaiCau: 4, canDayLaiLuot: 16, homQua: { coXat: 0.85, thanhThao: 0.36 }, nhip: { vuot: 3, dung: 5, tre12: 3, tre3: 3 }, dungNhip: 21, mucCanHomNay: 0.7, ngayThu: 4, tongNgay: 10, theoDang: Object.fromEntries(DANG.map((d, k) => [d, k / 6])), hangTheoDang: Object.fromEntries(DANG.map((d, k) => [d, 'L' + (1 + (k % 4))])) },
  dang: DANG,
  em: Array.from({ length: 14 }, (_, i) => emBang(i)),
  canDayLai: Array.from({ length: 6 }, (_, i) => ({ qid: 'DE-A-I-' + (17 + i), stt: 17 + i, dang: DANG[i % DANG.length], soEm: 12 - i, mucDo: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'][i % 4] })),
})
const buoiChua = () => ({
  chienDich: cdTom(0, { hetHan: true }),
  cau: Array.from({ length: 6 }, (_, i) => ({ qid: 'DE-A-I-' + (5 + i), stt: 5 + i, dang: DANG[i % DANG.length], phan: ['I', 'II', 'III'][i % 3], mucDo: 'Vận dụng cao', soChuaThanhThao: 20 - i, soCanDayLai: 10 - i, diemChua: 90 - i * 7, giaiMau: { sbd: 'HS1000', ten: TEN[i % TEN.length] }, emSua: TEN.slice(0, 5).map((t, k) => ({ sbd: 'HS10' + k, ten: t })) })),
})

export function fxChienDich(body) {
  const a = body.action
  if (a === 'co-doc') return { ok: true, co: { bat: true, lop: [], sbd: [] } }
  if (a === 'danh-sach') return { ok: true, homNay: HOM_NAY, chienDich: [cdTom(0), cdTom(1), cdTom(2, { trangThai: 'da_dong', hetHan: true }), cdTom(3)] }
  if (a === 'bang') return { ok: true, ...bang() }
  if (a === 'buoi-chua') return { ok: true, ...buoiChua() }
  if (a === 'ds-em') return { ok: true, em: Array.from({ length: 24 }, (_, i) => ({ sbd: 'HS' + (1000 + i), hoTen: TEN[i % TEN.length], lop: i % 2 ? LOP : '12A2 Cơ bản buổi tối', khoi: '12', tenLop: i % 2 ? LOP : '12A2 Cơ bản buổi tối' })) }
  if (a === 'suc-chua') return { ok: true, soCau: 124, theLucDeXuat: 40, soCauTheoTo: { 'DE-ESTER-LIPID-01': 80, 'DE-B': 44 }, soCauTheoMucDo: { 'Nhận biết': 30, 'Thông hiểu': 40, 'Vận dụng': 34, 'Vận dụng cao': 20 }, soEm: 38, D: 6, sucChua: 240, khoiLuongTrungVi: 300, tachGiua: { cauMoi: 100, luotOn: 100 }, tiLe: 1.25, muc: 'vang', soEmQuaTai: 7, goiY: { rutCon: { soCau: 90, tiLe: 0.9 }, luiHan: { hanNop: ngay(9), tiLe: 0.8 } } }
  return { ok: true }
}

// Đề mẫu dạng KhoDeJson (layDe)
export const TEN_DANG = ['Danh pháp ester và đồng đẳng', 'Đồng phân cấu tạo', 'Thuỷ phân ester đơn chức trong môi trường kiềm', 'Chất béo', 'Đốt cháy hỗn hợp ester', 'Xà phòng hoá']
export function deMau(maDe) {
  const cau = []
  for (let i = 1; i <= 18; i++) cau.push({ qid: `${maDe}-I-${i}`, phan: 'I', so: i, de: `Thuỷ phân hoàn toàn ${i} gam ester X có công thức phân tử $\\ce{C4H8O2}$ trong dung dịch $\\ce{NaOH}$ dư, đun nóng, thu được muối Y và ancol Z. Tên gọi của X là`, pa: { A: 'etyl axetat', B: 'metyl propionat', C: 'propyl fomat', D: 'isopropyl fomat (propan-2-yl methanoate)' }, dap_an: 'A', muc_do: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'][i % 4], dang: { ma: 'd' + (i % 6), ten: TEN_DANG[i % 6] }, loi_giai: { tom_tat: 'Ester no đơn chức mạch hở; n = 0,1 mol.', cac_buoc: ['Bước 1: tính số mol', 'Bước 2: suy ra công thức'] } })
  for (let i = 1; i <= 4; i++) cau.push({ qid: `${maDe}-II-${i}`, phan: 'II', so: i, de: 'Cho các phát biểu sau về chất béo và xà phòng:', y: { a: 'Chất béo là triester của glycerol với acid béo.', b: 'Dầu thực vật ở điều kiện thường là chất lỏng do chứa nhiều gốc acid béo không no.', c: 'Xà phòng hoá tristearin thu được glycerol.', d: 'Hydrogen hoá dầu thực vật thu được bơ nhân tạo.' }, dap_an: 'DSDS', muc_do: 'Thông hiểu', dang: { ma: 'd3', ten: 'Chất béo' } })
  for (let i = 1; i <= 6; i++) cau.push({ qid: `${maDe}-III-${i}`, phan: 'III', so: i, de: 'Đốt cháy hoàn toàn 0,1 mol hỗn hợp ester thu được bao nhiêu gam $\\ce{CO2}$? (làm tròn đến hàng phần mười)', dap_an: '13,2', muc_do: 'Vận dụng', dang: { ma: 'd4', ten: 'Đốt cháy hỗn hợp ester' } })
  return { ma_de: maDe, nguon: 'Đề thi thử THPT Chuyên Lê Hồng Phong Nam Định lần 2 năm 2026', ngay_nap: '2026-09-20', nhom: 'Ester – Lipid', cau }
}
