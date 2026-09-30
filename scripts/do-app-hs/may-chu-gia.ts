// MÁY CHỦ GIẢ cho scripts/do-app-hs.mjs — trả lời mọi lệnh app học sinh gọi khi mở app và khi vào từng màn, bằng DỮ LIỆU MẪU
// (lấy hình từ các phép kiểm tests/dao2-luong-2709, tests/doan-tran-chon-dap-an-2109, tests/doan-sanh-nut-khoa-2109 và
// cửa hàng mẫu `ShopApiGia`). Không có dữ liệu học sinh thật; không có đáp án trong câu gửi xuống trước khi nộp.
// Nạp bằng Vite SSR (ssrLoadModule) để dùng lại mô-đun TS của app.
import { ShopApiGia } from '../../src/game/than-thu-v2/shop/du-lieu-mau'

type Obj = Record<string, unknown>
const MAU = [
  'Thuỷ phân hoàn toàn ethyl acetate trong dung dịch NaOH dư, đun nóng',
  'Chất béo là triester của glycerol với acid béo',
  'Cho các phát biểu sau về ester và lipid',
  'Đốt cháy hoàn toàn m gam hỗn hợp X gồm hai ester no, đơn chức, mạch hở',
  'Xà phòng hoá hoàn toàn triolein bằng dung dịch KOH',
  'Số đồng phân ester ứng với công thức phân tử C4H8O2 là',
]
const chu = (i: number, n = 2) => Array.from({ length: n }, (_, k) => MAU[(i * 7 + k * 3) % MAU.length]).join('. ')
const DANG = ['Chất béo', 'Danh pháp ester', 'Thuỷ phân ester', 'Đốt cháy ester', 'Xà phòng hoá', 'Đồng phân']

export const kichBan = { doanTran: false, ruongMoDuoc: false, lanSanh: 0 }

const sanh = (): Obj => ({
  ok: true, cheDo2: true, ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 12, canDayLai: 3, thanhThaoTangTu: null },
  theLuc: { con: 28, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false, loiKhoaDao: '',
  ruong: kichBan.ruongMoDuoc ? { daLam: 40, tong: 40, moDuoc: true, daMo: false } : { daLam: 12, tong: 40, moDuoc: false, daMo: false },
  bia: null, tamGiuCa: 0,
})

const VAI = ['moi', 'moi', 'on_lai', 'moi', 'moi', 'trum']
const cauDao = (i: number): Obj => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu ${i + 1}: ${chu(i)} $\\dfrac{m}{M} = 0,${i + 1}\\,\\text{mol}$`, choices: [chu(i + 1, 1), chu(i + 2, 1), `$${i + 2}\\,\\text{mol}$`, chu(i + 3, 1)], ideas: [], hinhAnh: [], dang: 'D' + (i % 6), tenDang: DANG[i % 6], mucDo: 'hieu', sao: 2, kienThuc: [], vai: VAI[i % 6] })

const hoSo = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 120, wallet: 340, earned: 900, tower: 3, mastery: [], arena: null, academic: { total: 900, today: 40, lastGain: 4, dailyLimit: 200 }, shields: { manh: 3, moiKhien: 10, khien: [] } }

// Đoàn Hộ Tống — trong trận (hình của tests/doan-tran-chon-dap-an-2109).
const ghe = [
  { ghe: 0, ten: 'Học Sinh Thử', pet: 2, cap: 7, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 3, ten: 'Lan', pet: 0, cap: 8, laMay: true, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null },
]
let revDoan = 5
const tranDoan = (): Obj => ({
  ma: 'DH1', revision: revDoan, laChu: true, batDau: true, ghe, gioMayChu: Date.now(),
  tran: { tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }, { ma: 6, loai: 'khoi_oxi_hoa', hp: 12 }], trumVoGiap: [],
    nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] },
  cau: { qid: 'Q1', nhan: 'toi_han_on', de: { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I', text: `${chu(3)} Tính $n_{CO_2}$.`, choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] } },
  tiepSuc: { conLuotNhan: 2, daXin: false, theNhan: null, banCan: [], daGiup: false, lienKichSanSang: false },
})
const sanhDoan = (): Obj => ({
  lop: '12 - Tinh Hoa', tenDoan: 'Đoàn Hộ Tống', mua: { so: 3, conNgay: 12 }, ve: 2, mienPhiHomNay: true,
  chuoi: { ngay: 3, daDiHomNay: false, mocKe: 7, conNgay: 4 },
  doanLop: { lop: '12 - Tinh Hoa', tram: 5, tongTram: 12, changThang: 3, changMoiTram: 4, conChangToiTramKe: 2, mocKe: 8, tenMocKe: 'Cổng Ester', conTramToiMoc: 3, gopSucHomNay: 11, siSo: 30 },
  trumLop: { dangMo: false, chuNhat: '2026-10-04', moSauMs: 4 * 24 * 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false },
  quaMoi: [], changHomNay: { daDi: 1, toiDa: 6 },
})

// Câu đã làm: 360 câu (3 chiến dịch) — đúng cỡ một em chăm sau 3 tuần.
const TT = ['dang_on', 'thanh_thao', 'can_day_lai']
const cauDaLam = (): Obj => ({
  ok: true, cheDo2: true,
  chienDich: [{ id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', tong: 120 }, { id: 'cd0', ten: 'Carbohydrate', hanNop: '2026-09-27', tong: 120 }, { id: 'cdx', ten: 'Amine – Amino acid', hanNop: '2026-09-20', tong: 120 }],
  cau: Array.from({ length: 360 }, (_, i) => ({
    qid: `C${i}`, chienDichId: ['cd1', 'cd0', 'cdx'][i % 3], stt: Math.floor(i / 3) + 1, phan: ['I', 'II', 'III'][i % 3], mucDo: ['biet', 'hieu', 'van_dung'][i % 3], tenDang: DANG[i % 6], trangThai: TT[i % 3],
    lanCuoiDung: i % 4 !== 0, henOn: i % 5 === 0 ? '2026-10-02' : null,
    lichSu: Array.from({ length: 1 + (i % 4) }, (_, k) => ({ ngay: `2026-09-${String(10 + ((i + k) % 19)).padStart(2, '0')}`, dung: (i + k) % 3 !== 0, coGoiY: k === 1, nguon: ['dao', 'doan', 'thi', 'len_bang'][k % 4] })),
    ...(i % 4 === 0 ? { nhan: `Sai ${1 + (i % 3)} lần · Ca ${10 + (i % 19)}/09` } : {}),
  })),
})

// Tu luyện (hình của src/components/tu-luyen/api.ts).
const nguonTuLuyen = (): Obj => ({
  ok: true, cacCa: [{ maCa: 'CA1', tenCa: 'Kiểm tra Ester 26/09', soCauSai: 7 }, { maCa: 'CA2', tenCa: 'Kiểm tra Lipid 28/09', soCauSai: 4 }], soCauSai: 11, loiCauSai: '',
  danhMuc: [{ lop: '12', bais: [{ tenBai: 'Ester – Lipid', dangs: DANG.map((t, i) => ({ ma: 'D' + i, ten: t, soCau: 30 + i })) }, { tenBai: 'Carbohydrate', dangs: DANG.map((t, i) => ({ ma: 'E' + i, ten: t + ' (carb)', soCau: 20 + i })) }] }],
  loiDanhMuc: '', dangThi: false,
  khoCauSai: { tong: 42, tuCa: 11, tuChienDich: 20, tuLuyenDe: 6, tuTuLuyen: 5, loi: '', tongTuMoc: 50, daKhacPhuc: 8, toiHan: 6, choHen: 3, theoNguon: { ca: 11, chien_dich: 20, luyen_de: 6, tu_luyen: 5 }, theoMat: {} },
  dangCauSai: { kieu: 'cau_sai', nhan: 'Theo câu sai của em', loi: '' }, tuDo: { kieu: 'kho_cau_sai', nhan: 'Kho câu sai', loi: '' }, dangNenLuyen: { ma: 'D1', ten: DANG[1] },
})
const cauTuLuyen = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `T${i}`, phan: 'I', text: `Câu ${i + 1}: ${chu(i + 2)} $\\Delta H = -${i + 10}\\,kJ$`, choices: [chu(i, 1), chu(i + 1, 1), chu(i + 2, 1), chu(i + 3, 1)], ideas: [], hinhAnh: [], tenDang: DANG[i % 6], mucDo: 'hieu' }))

let shop = new ShopApiGia()
export function datLai() {
  shop = new ShopApiGia()
  kichBan.doanTran = false
  kichBan.ruongMoDuoc = false
  kichBan.lanSanh = 0
  revDoan = 5
}

export async function traLoi(duong: string, body: Obj): Promise<Obj> {
  const lenh = duong.startsWith('/game-v2/') ? duong.slice(9) : ''
  switch (duong) {
    case '/hs/dang-nhap':
      return { ok: true, token: 'tk-gia', sbd: body.sbd, hoTen: 'Học Sinh Thử', lop: '12A0', namSinh: '2008' }
    case '/hs/ke-hoach-ngay':
      return { ok: true, ngay: '2026-09-30', viec: [], nganSach: { mucTieuCau: 20 }, tienBo: { daLamCau: 12, soCauHienThi: 12, dat: false, toiThieuCau: 20, conThieu: 8 }, thanThu: { pet: 'lua_phuong', cap: 7, nickname: 'Lửa Nhỏ', shopBat: true }, exp: { homNay: 40, expConThieu: 120, ongNghiem: 620 }, doanMo: true, capNhatLuc: new Date().toISOString() }
    case '/hs/tu-luyen/nguon':
      return nguonTuLuyen()
    case '/hs/tu-luyen/tong-hop':
      return { ok: true, luot: Array.from({ length: 12 }, (_, i) => ({ luotId: `L${i}`, cheDo: ['cau_sai', 'dang', 'de', 'tu_do'][i % 4], tieuDe: `Lượt ${i + 1}`, soCau: 10, soDung: 6 + (i % 4), diem: 6 + (i % 4), nopLuc: Date.now() - i * 86400000 })), cau: [], luyenDe: [], khacPhuc: null }
    case '/hs/tu-luyen/xem-truoc':
      return { ok: true, tongToiDa: 30, loi: '', thongKe: DANG.map((t) => ({ tenDang: t, soCauSai: 3, soUngVien: 12 })), nguonDang: { kieu: 'cau_sai', nhan: 'Theo câu sai của em', loi: '' } }
    case '/hs/tu-luyen/rut':
      return { ok: true, luotId: 'L-moi', cheDo: body.cheDo ?? 'cau_sai', tieuDe: 'Luyện câu sai', taoLuc: Date.now(), cau: cauTuLuyen(Number(body.soCau) || 10) }
    case '/hs/tu-luyen/cham-cau':
      return { ok: true, qid: body.qid, dung: true, dapAn: 'A', traLoi: body.traLoi, loiGiai: { chot: 'Chốt lời giải' } }
  }
  switch (lenh) {
    case 'hoa2-sanh':
      kichBan.lanSanh++
      return sanh()
    case 'profile':
      return { ok: true, profile: hoSo, revision: 1, doanMo: true }
    case 'academic-sync':
      return { ok: true, profile: hoSo, revision: 1 }
    case 'recommendations':
      return { ok: true, suggestions: DANG.map((t) => ({ title: t, source: 'Ester', part: 'I' })), remaining: 28, dailyUsed: 12, shopBat: true }
    case 'so-tay':
      return { ok: true, dang: DANG.map((t, i) => ({ key: 'D' + i, ten: t })) }
    case 'resume':
      return { ok: true, questions: [] }
    case 'sync':
      return { ok: true, remaining: 0 }
    case 'start':
      return { ok: true, id: 's1', questions: VAI.map((_, i) => cauDao(i)), theLuc: { con: 28, tong: 40 }, dao: { con: 28 }, doan: { con: 4 } }
    case 'answer':
      return { ok: true, correct: body.qid !== 'q0', answer: 'A', traLoi: body.answer, solution: { chot: 'Chốt: dùng bảo toàn khối lượng.' }, reward: body.qid !== 'q0' ? 4 : 0, stage: 1, lyDoThuong: { moc: 1, exp: 4, chu: '+4 · Đúng câu mới' } }
    case 'complete':
      return { ok: true, correct: 5, total: 6 }
    case 'hoa2-cau-da-lam':
      return cauDaLam()
    case 'hoa2-cau-chi-tiet': {
      // Câu ĐÃ LÀM ⇒ có đáp án + lời giải (đúng hợp đồng: chỉ câu em đã nộp).
      const ds = (Array.isArray(body.qids) ? body.qids : [body.qid]).map(String)
      return { ok: true, cau: ds.map((qid, k) => { const i = Number(qid.slice(1)) || k; return { de: { qid, phan: 'I', text: `${chu(i, 3)} Tính $\\dfrac{m_{${i}}}{M} = \\dfrac{12,${i}}{${100 + i}}$ rồi chọn đáp án đúng.`, choices: [chu(i + 1, 1), chu(i + 2, 1), `$${i}\\,\\text{mol}$`, chu(i + 3, 1)], ideas: [], hinhAnh: [], tenDang: DANG[i % 6], mucDo: 'hieu', maDe: 'DE', sao: 2 }, dapAn: 'A', loiGiai: { chot: `Chốt: $n = \\dfrac{m}{M}$ = 0,${i} mol.` }, emTraLoi: i % 4 === 0 ? 'B' : 'A' } }) }
    }
    case 'hoa2-ruong-mo':
      return { ok: true, qua: { vang: 30 }, ruong: { daLam: 40, tong: 40, moDuoc: false, daMo: true, qua: { vang: 30 } } }
    case 'doan-sanh':
      return { ok: true, sanh: sanhDoan(), anThach: null, banDongHanh: null, ...(kichBan.doanTran ? { dangDo: 'DH1' } : {}) }
    case 'doan-xem':
      return { ok: true, doan: tranDoan() }
    case 'doan-nop':
      revDoan++
      return { ok: true, doan: { ...tranDoan(), cau: { ...(tranDoan().cau as Obj), daChot: true, hanhDong: 'danh', ketQua: null } }, ketQuaCau: { correct: true, answer: 'B', solution: 'Chốt lời giải', reward: 20 } }
    case 'vang-xem':
      return { ok: true, ...(await shop.vangXem()) }
    case 'shop-danh-sach':
      return { ok: true, ...(await shop.shopDanhSach()) }
    case 'shop-mua':
      return { ok: true, ...(await shop.shopMua(String(body.maMon), Number(body.giaThay), String(body.khoaYeuCau))) }
    case 'thu-mac-do':
      return { ok: true, ...(await shop.thuMacDo(body.oGan as never, (body.maMon as string) ?? null)) }
    case 'vang-doi':
      return { ok: true, ...(await shop.vangDoi(Number(body.soExp), String(body.khoaYeuCau))) }
  }
  return { ok: true }
}
