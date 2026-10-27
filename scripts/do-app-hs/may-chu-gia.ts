// MÁY CHỦ GIẢ cho scripts/do-app-hs.mjs — trả lời mọi lệnh app học sinh gọi khi mở app và khi vào từng màn, bằng DỮ LIỆU MẪU
// Dữ liệu học tập mẫu; không tài khoản thật, không đáp án trong câu gửi xuống trước khi nộp.
// Nạp bằng Vite SSR (ssrLoadModule); không phụ thuộc fixture Cửa hàng đã ngừng.
import { nhipGia } from '../chup-ph-dot19/gia'

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

/** `gio`: giờ máy chủ cố định (ms) cho ảnh giao diện tất định (do-app-hs --kich=anh) — null ⇒ giờ thật. */
export const kichBan: { lanSanh: number; omni: boolean; gio: number | null } = { lanSanh: 0, omni: false, gio: null }
const bayGio = () => kichBan.gio ?? Date.now()

/** Sảnh khi lớp BẬT OMNI (hình dữ liệu như scripts/chup-omni-3/trang.tsx `SANH_OMNI`) — chỉ gửi khi `kichBan.omni` (do-app-hs --omni=1). */
const SANH_OMNI = {
  bat: true,
  baiDangLuyen: [{ id: 'cd6', ten: 'Bài 6 · Tinh bột và cellulose', hanNop: '2026-10-06' }, { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04' }],
  dangVung: { a: 5, b: 8 }, conDangDe8: 2, sEm: 0.06, sMucTieu: 0.07,
  chungChi: [{ ten: 'Bài 4', doTin: 0.92, ngay: '2026-09-28' }], ve: { con: 2, tong: 2 },
  choBaiMoi: false, onBaiCu: 6, metGio: null, nhatKy: null, deThu: { duoc: true, soCau: 14, phut: 25 },
}

const sanh = (): Obj => ({
  ok: true, cheDo2: true, ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 12, canDayLai: 3, thanhThaoTangTu: null },
  theLuc: { con: 28, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false, loiKhoaDao: '',
  ruong: { daLam: 12, tong: 40, moDuoc: false, daMo: false },
  hanhTrinh: { tang: 2, toiThieu: 40, daLam: 12, daXep: 40, conThieu: 0, soChang: 5, changHienTai: 2, cauTrongChang: 8 },
  bia: null, tamGiuCa: 0,
  ...(kichBan.omni ? { omni: SANH_OMNI } : {}),
})

const hoSo = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 120, wallet: 340, earned: 900, tower: 3, mastery: [], arena: null, academic: { total: 900, today: 40, lastGain: 4, dailyLimit: 200 }, shields: { manh: 3, moiKhien: 10, khien: [] } }

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

// LÀM CHẶNG (27/10, scripts/do-muot-hs.mjs): 8 câu trắc nghiệm, đáp án luôn A (kịch bản bấm phương án đầu ⇒ chuỗi đúng, có combo / thưởng — ca nặng nhất
// của hiệu ứng). Đáp án / lời giải chỉ trả SAU `answer` như máy chủ thật.
const CAU_CHANG = Array.from({ length: 8 }, (_, i) => ({ qid: `K${i}`, version: '1', group: 'g', phan: 'I', maDe: 'BAI1', tenDang: DANG[i % 6], mucDo: 'hieu', sao: 0, kienThuc: [], hinhAnh: [], ideas: [],
  text: `Câu ${i + 1}: ${chu(i, 2)}. Chất nào sau đây thoả mãn?`, choices: [chu(i, 1), chu(i + 1, 1), chu(i + 2, 1), chu(i + 3, 1)] }))
const lamChang = { daNop: 0, chuoi: 0, daTra: new Set<string>() }

export function datLai() {
  lamChang.daNop = 0; lamChang.chuoi = 0; lamChang.daTra.clear()
  kichBan.lanSanh = 0
  kichBan.omni = false
  kichBan.gio = null
}

export async function traLoi(duong: string, body: Obj): Promise<Obj> {
  const lenh = duong.startsWith('/game-v2/') ? duong.slice(9) : ''
  switch (duong) {
    case '/hs/dang-nhap': {
      const dn = { ok: true, token: 'tk-gia', sbd: body.sbd, hoTen: 'Học Sinh Thử', lop: '12A0', namSinh: '2008' }
      // Máy chủ mới (D1 06/10): máy em xin `kemSanh` ⇒ trả THEO LUỒNG (NDJSON): dòng 1 = đăng nhập, dòng 2 = `{sanh}` (phản hồi hoa2-sanh). Máy em cũ không xin ⇒ y như trước.
      // (Playwright không phát được thân theo từng nhịp: máy chủ giả trả cả hai dòng một lúc — trong máy chủ giả thời gian xử lý của mọi lệnh bằng nhau nên đo ra như nhau.)
      if (body.kemSanh === true) {
        kichBan.lanSanh++
        return { __ndjson: [dn, { sanh: { ...sanh(), serverNow: bayGio(), nhipDeNghi: 1 } }] }
      }
      return dn
    }
    case '/hs/buoi-hoc':
      return { ok: true, buoi: { id: 'BUOI-GIA', ten: 'Buổi học mẫu', lop: '12A0', daDiemDanh: true } }
    case '/hs/nhip-hoc':
      return nhipGia()
    case '/hs/chua-cau-sai/co':
      return { ok: true, bat: false }
    case '/hs/ca-dang-mo':
      return { ok: true, coCaMo: false, soCa: 0 }
    case '/mom/list':
    case '/student-news/list':
      return { ok: true, items: [], caDangMo: null }
    case '/presence':
      return { ok: true }
    case '/hs/ke-hoach-ngay':
      return { ok: true, ngay: '2026-09-30', viec: [], nganSach: { mucTieuCau: 20 }, tienBo: { daLamCau: 12, soCauHienThi: 12, dat: false, toiThieuCau: 20, conThieu: 8 }, thanThu: { pet: 'lua_phuong', cap: 7, nickname: 'Lửa Nhỏ', shopBat: true }, exp: { homNay: 40, expConThieu: 120, ongNghiem: 620 }, doanMo: true, capNhatLuc: new Date().toISOString() }
    case '/luyen-de/dieu-kien':
      return { ok: true, trangThai: 'mo', lyDo: '', items: [] }
    case '/hs/tu-luyen/nguon':
      return nguonTuLuyen()
    case '/hs/tu-luyen/tong-hop':
      return { ok: true, luot: Array.from({ length: 12 }, (_, i) => ({ luotId: `L${i}`, cheDo: ['cau_sai', 'dang', 'de', 'tu_do'][i % 4], tieuDe: `Lượt ${i + 1}`, soCau: 10, soDung: 6 + (i % 4), diem: 6 + (i % 4), nopLuc: Date.now() - i * 86400000 })), cau: [], luyenDe: [], khacPhuc: null }
    case '/hs/tu-luyen/xem-truoc':
      return { ok: true, tongToiDa: 30, loi: '', thongKe: DANG.map((t) => ({ tenDang: t, soCauSai: 3, soUngVien: 12 })), nguonDang: { kieu: 'cau_sai', nhan: 'Theo câu sai của em', loi: '' } }
    case '/hs/tu-luyen/rut':
      return { ok: true, luotId: 'L-moi', cheDo: body.cheDo ?? 'cau_sai', tieuDe: 'Luyện câu sai', taoLuc: bayGio(), cau: cauTuLuyen(Number(body.soCau) || 10) }
    case '/hs/tu-luyen/cham-cau':
      return { ok: true, qid: body.qid, dung: true, dapAn: 'A', traLoi: body.traLoi, loiGiai: { chot: 'Chốt lời giải' } }
  }
  switch (lenh) {
    case 'hoc-tap-sanh':
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
    case 'hoc-tap-start':
      return { ok: true, id: 'phien-gia', questions: CAU_CHANG, goi7: { bat: true, ngay: '2026-09-30', toiThieu: 40, daLamHomNay: 12 + lamChang.daNop, tuLamCon: 20, tiepCanCon: 8, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
        kienThucCu: { tong: 0, dat: 0, tyLe: null }, goi: [{ id: 'g1', ten: 'Ester – Lipid', batDau: '2026-09-28', han: '2026-10-04', tong: 40, daGap: 12, con: 28, quota: 8, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['BAI1'] }], diemDaDo: [] } }
    case 'hoc-tap-dem':
      return { ok: true, daLamHomNay: 12 + lamChang.daNop, toiThieu: 40 }
    case 'hoc-tap-lam-lai':
      return { ok: true, questions: [] }
    case 'answer': {
      const dung = String(body.answer ?? '') === 'A'
      lamChang.daNop++; lamChang.daTra.add(String(body.qid))
      lamChang.chuoi = dung ? lamChang.chuoi + 1 : 0
      const c = lamChang.chuoi
      return { ok: true, correct: dung, answer: 'A', solution: { chot: 'Chốt lời giải: phương án A đúng vì thoả mãn điều kiện đề bài.' }, solutionImages: [],
        thuong: dung ? { tinh: true, nguyenTu: 10 + (c >= 3 ? 2 : 0), dong: [{ nhan: 'Đúng', so: 10 }, ...(c >= 3 ? [{ nhan: `Chuỗi đúng ${c}`, so: 2 }] : [])], chuoiDung: c, cauKho: false }
          : { tinh: true, nguyenTu: 2, dong: [{ nhan: 'Làm nghiêm túc', so: 2 }], chuoiDung: 0, cauKho: false } }
    }
    case 'hoa2-cau-da-lam':
      return cauDaLam()
    case 'hoa2-cau-chi-tiet': {
      // Câu ĐÃ LÀM ⇒ có đáp án + lời giải (đúng hợp đồng: chỉ câu em đã nộp).
      const ds = (Array.isArray(body.qids) ? body.qids : [body.qid]).map(String)
      return { ok: true, cau: ds.map((qid, k) => { const i = Number(qid.slice(1)) || k; return { de: { qid, phan: 'I', text: `${chu(i, 3)} Tính $\\dfrac{m_{${i}}}{M} = \\dfrac{12,${i}}{${100 + i}}$ rồi chọn đáp án đúng.`, choices: [chu(i + 1, 1), chu(i + 2, 1), `$${i}\\,\\text{mol}$`, chu(i + 3, 1)], ideas: [], hinhAnh: [], tenDang: DANG[i % 6], mucDo: 'hieu', maDe: 'DE', sao: 2 }, dapAn: 'A', loiGiai: { chot: `Chốt: $n = \\dfrac{m}{M}$ = 0,${i} mol.` }, emTraLoi: i % 4 === 0 ? 'B' : 'A' } }) }
    }
  }
  return { ok: false, error: 'Máy chủ giả chưa có lệnh học tập: ' + duong }
}
