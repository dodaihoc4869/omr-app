// TRANG CHỤP ẢNH TU LUYỆN (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật. `?man=sanh|tl`.
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-700.css'
import '@fontsource/noto-serif/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/components/m3'
import '../../src/components/bang-nhiem-vu/sheet-m3.css'
import SanhBanDo from '../../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import ManTuLuyen from '../../src/components/tu-luyen/ManTuLuyen'
import BatLinhShell from '../../src/components/bat-linh/BatLinhShell'

const man = new URLSearchParams(location.search).get('man') ?? 'tl'
const now = Date.now()
const noop = () => {}
try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk-gia', sbd: 'GIA' })) } catch { /* bỏ qua */ }

// ---------------------------------------------------------------- máy chủ giả
const CAU = [
  { qid: 'q1', phan: 'I', text: 'Thuỷ phân hoàn toàn ethyl acetate (CH_{3}COOC_{2}H_{5}) trong dung dịch NaOH dư, đun nóng, thu được muối nào sau đây?', luaChon: ['CH_{3}COONa', 'HCOONa', 'C_{2}H_{5}COONa', 'CH_{3}ONa'], tenDang: 'Phản ứng thuỷ phân ester', sao: 1, loai: 'ly_thuyet' },
  { qid: 'q2', phan: 'I', text: 'Chất nào sau đây là ester no, đơn chức, mạch hở?', luaChon: ['HCOOCH=CH_{2}', 'CH_{3}COOCH_{3}', 'CH_{2}=CHCOOCH_{3}', 'C_{6}H_{5}COOCH_{3}'], tenDang: 'Khái niệm, danh pháp ester', sao: 0, loai: 'ly_thuyet' },
  { qid: 'q3', phan: 'II', text: 'Cho các phát biểu về chất béo:', luaChon: ['Chất béo là triester của glycerol với acid béo.', 'Chất béo lỏng chứa chủ yếu gốc acid béo no.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.', 'Chất béo tan tốt trong nước.'], tenDang: 'Chất béo (lipid)', sao: 2, loai: 'ly_thuyet' },
  { qid: 'q4', phan: 'III', text: 'Đun nóng 8,8 gam ethyl acetate với 150 mL dung dịch NaOH 1M đến phản ứng hoàn toàn. Cô cạn dung dịch thu được m gam chất rắn khan. Tính m (làm tròn đến hàng phần mười).', luaChon: null, tenDang: 'Bài toán thuỷ phân ester', sao: 2, loai: 'bai_tap' },
  { qid: 'q5', phan: 'I', text: 'Bảng dưới đây cho nhiệt độ sôi của ba chất. Chất X là', luaChon: ['CH_{3}COOH', 'HCOOCH_{3}', 'C_{2}H_{5}OH', 'CH_{3}CHO'], bang: [['Chất', 'X', 'Y', 'Z'], ['Nhiệt độ sôi (°C)', '32', '78', '118']], tenDang: 'So sánh nhiệt độ sôi', sao: 1, loai: 'ly_thuyet' },
]
const DAP_AN: Record<string, string> = { q1: 'A', q2: 'B', q3: 'DSDS', q4: '10,2', q5: 'B' }
const LOI_GIAI: Record<string, unknown> = {
  q1: { chot: 'CH_{3}COOC_{2}H_{5} + NaOH → CH_{3}COONa + C_{2}H_{5}OH.', tungPa: { A: { dung: true, viSao: 'Gốc acid là CH_{3}COO– nên muối là sodium acetate.' }, B: { dung: false, viSao: 'HCOONa sinh từ ester của formic acid.' } } },
  q2: { chot: 'Ester no, đơn chức, mạch hở có công thức C_{n}H_{2n}O_{2} (n ≥ 2).', tungPa: { B: { dung: true, viSao: 'Methyl acetate C_{3}H_{6}O_{2}.' }, A: { dung: false, viSao: 'Có liên kết C=C.' } } },
  q3: { chot: 'Chất béo là triester; dầu thực vật chứa chủ yếu gốc acid béo không no.', tungY: { a: { dung: true, viSao: 'Đúng định nghĩa.' }, b: { dung: false, viSao: 'Chất béo lỏng chứa chủ yếu gốc không no.' }, c: { dung: true, viSao: 'Xà phòng hoá.' }, d: { dung: false, viSao: 'Không tan trong nước.' } } },
  q4: { chot: 'NaOH dư; chất rắn gồm muối và NaOH dư.', buoc: ['n(ester) = 8,8 : 88 = 0,1 mol; n(NaOH) = 0,15 mol.', 'm = 0,1 × 82 + 0,05 × 40 = 10,2 gam.'], ketQua: '10,2' },
  q5: { chot: 'Ester không có liên kết hydrogen liên phân tử nên sôi thấp nhất.' },
}
const TRA_LOI_GIA: Record<string, string> = { q1: 'A', q2: 'C', q3: 'DSDD', q4: '10,2', q5: 'B' }
const CHUA = Array.from({ length: 12 }, (_, i) => ({
  qid: `chua-${i + 1}`,
  trangThai: i === 1 ? 'dang_chua_buoc' : i === 4 ? 'cho_gap_lai_2' : i === 7 ? 'dang_kiem_chung' : 'thieu_hoc_lieu',
  ...(i === 4 ? { denHan: new Date(now + 2 * 86_400_000).toISOString() } : {}),
}))

const NGAY = 86_400_000
const DANG = [
  { ma: 'DB-12-B1-D1', ten: 'Phản ứng thuỷ phân ester', bai: 'Bài 1. Ester – Lipid' },
  { ma: 'DB-12-B1-D2', ten: 'Bài toán thuỷ phân ester', bai: 'Bài 1. Ester – Lipid' },
  { ma: 'DB-12-B2-D1', ten: 'Chất béo (lipid)', bai: 'Bài 2. Xà phòng và chất giặt rửa' },
  { ma: 'DB-12-B3-D1', ten: 'Glucose và fructose', bai: 'Bài 4. Giới thiệu về carbohydrate' },
  { ma: 'DB-12-B3-D2', ten: 'Saccharose, maltose', bai: 'Bài 5. Saccharose và maltose' },
]
function tongHopGia() {
  const luot: unknown[] = [], cau: unknown[] = []
  // 14 lượt trong 6 tuần, tỉ lệ đúng tăng dần; dạng 2 tiến bộ mạnh, dạng 5 còn yếu
  for (let i = 0; i < 14; i++) {
    const ngayTruoc = [40, 36, 33, 29, 26, 22, 19, 15, 12, 8, 5, 3, 2, 1][i]
    const luc = now - ngayTruoc * NGAY - 3600_000
    const id = `L${i}`
    let dung = 0
    for (let k = 0; k < 10; k++) {
      const d = DANG[(i + k) % DANG.length]
      const p = d.ma === 'DB-12-B3-D2' ? 0.35 : d.ma === 'DB-12-B1-D2' ? 0.3 + i * 0.05 : 0.5 + i * 0.03
      const ok = (k * 37 + i * 11) % 100 < p * 100
      if (ok) dung++
      cau.push({ luotId: id, cheDo: (i % 4) + 1, luc, qid: `${id}-${k}`, phan: ['I', 'I', 'II', 'III'][k % 4], dung: ok, dangMa: d.ma, dangTen: d.ten, bai: d.bai, lop: '12', sao: k % 3, giay: 40 })
    }
    luot.push({ id, cheDo: (i % 4) + 1, tieuDe: ['Sửa câu sai · Ca kiểm tra Ester 21/09', 'Dạng câu sai · 10 câu cùng dạng', 'Dạng bài · Bài toán thuỷ phân ester', 'Tự do · 2 sao + Bài tập'][i % 4], taoLuc: luc - 600_000, nopLuc: luc, soCau: 10, soDung: dung, giay: 540 + i * 13 })
  }
  return { ok: true, luot, cau }
}
const MAY_CHU: Record<string, (b: Record<string, unknown>) => unknown> = {
  nguon: () => ({
    ok: true, khoi: 12, soCauSai: 17, loiCauSai: '', loiDanhMuc: '', dangThi: false,
    khoCauSai: {
      tong: 23, tuCa: 15, tuChienDich: 8, loi: '', tongTuMoc: 29, daKhacPhuc: 6, toiHan: 3, choHen: 2,
      // Chọn nguồn (30/09): 23 câu duy nhất; bit 1 ca · 2 Đảo · 4 Đoàn · 8 Bi-a · 16 Tu luyện · 32 Luyện đề (0 câu).
      theoNguon: { ca: 15, dao: 4, doan: 3, bia: 2, tu_luyen: 2, luyen_de: 0 },
      theoMat: { 1: 12, 3: 2, 17: 1, 2: 2, 4: 3, 8: 2, 16: 1 },
    },
    cacCa: [{ maCa: 'C1', tenCa: 'Ca kiểm tra Ester – Lipid · 21/09', soCauSai: 9 }, { maCa: 'C2', tenCa: 'Ca kiểm tra Carbohydrate · 26/09', soCauSai: 8 }],
    danhMuc: [
      { lop: '11', bais: [{ tenBai: 'Bài 12. Alkane', dangs: [{ ma: 'DB-11-B12-D1', ten: 'Danh pháp alkane', soCau: 40 }] }] },
      { lop: '12', bais: [
        { tenBai: 'Bài 1. Ester – Lipid', dangs: [{ ma: 'DB-12-B1-D1', ten: 'Phản ứng thuỷ phân ester', soCau: 64 }, { ma: 'DB-12-B1-D2', ten: 'Bài toán thuỷ phân ester', soCau: 120 }, { ma: 'DB-12-B1-D3', ten: 'Đồng phân ester C_{n}H_{2n}O_{2}', soCau: 36 }] },
        { tenBai: 'Bài 5. Saccharose và maltose', dangs: [{ ma: 'DB-12-B3-D2', ten: 'Saccharose, maltose', soCau: 52 }] },
      ] },
    ],
  }),
  'xem-truoc': (b) => ({ ok: true, tongToiDa: b.cheDo === 2 ? 34 : b.cheDo === 3 ? 120 : 86, thongKe: b.cheDo === 2 ? [{ tenDang: 'Phản ứng thuỷ phân ester', soCauSai: 5, soUngVien: 22 }, { tenDang: 'Glucose và fructose', soCauSai: 4, soUngVien: 12 }] : undefined }),
  rut: (b) => b.cheDo === 1
    ? { ok: true, luotId: 'tl_gia000001', cheDo: 1, tieuDe: 'Sửa câu sai · 5 câu', taoLuc: now, tongToiDa: 23, cau: CAU.map((c, i) => ({ ...c, nhanLuyen: ['Luyện lần đầu', 'Luyện lại lần 2', 'Luyện lần đầu', 'Luyện lại lần 3', 'Luyện lần đầu'][i], saiGoc: ['Sai gốc: Ca kiểm tra Ester – Lipid · 29/09', 'Sai gốc: Chiến dịch Ester – Lipid · Đoàn Hộ Tống · 30/09', 'Sai gốc: Bi-a · 30/09 và 1 lần khác', 'Sai gốc: Ca kiểm tra Carbohydrate · 29/09', 'Sai gốc: Đảo thần thú · 30/09'][i] })) }
    : { ok: true, luotId: 'tl_gia000001', cheDo: b.cheDo, tieuDe: 'Dạng bài · Phản ứng thuỷ phân ester', taoLuc: now, tongToiDa: 120, cau: CAU },
  nop: () => {
    const cau = CAU.map((c) => {
      const tl = TRA_LOI_GIA[c.qid], da = DAP_AN[c.qid]
      const yDung = c.phan === 'II' ? [...da].filter((x, i) => tl[i] === x).length : undefined
      const dung = tl === da
      return { qid: c.qid, phan: c.phan, dung, diem: dung ? 1 : yDung === 3 ? 0.5 : 0, traLoi: tl, dapAn: da, ...(yDung !== undefined ? { yDung } : {}), loiGiai: LOI_GIAI[c.qid] }
    })
    return { ok: true, luotId: 'tl_gia000001', cheDo: 3, tieuDe: 'Dạng bài · Phản ứng thuỷ phân ester', soCau: 5, soDung: 3, diem: 7, giay: 412, nopLuc: now, cau }
  },
  'tong-hop': () => tongHopGia(),
}
// ---------------------------------------------------------------- luyện đề cấu trúc giả (/luyen-de/*) — `?ld=khoa` thẻ khoá, `?ld=gap` còn 4 phút
const ld = new URLSearchParams(location.search).get('ld') ?? ''
const MAU_I = [
  ['Chất nào sau đây là ester?', ['CH_{3}COOC_{2}H_{5}', 'CH_{3}COOH', 'C_{2}H_{5}OH', 'CH_{3}CHO']],
  ['Kim loại nào sau đây có tính khử mạnh nhất?', ['K', 'Fe', 'Cu', 'Ag']],
  ['Polymer nào sau đây được điều chế bằng phản ứng trùng ngưng?', ['Nylon-6,6', 'Polyethylene', 'Poly(vinyl chloride)', 'Polystyrene']],
  ['Dung dịch nào sau đây làm quỳ tím chuyển màu xanh?', ['CH_{3}NH_{2}', 'C_{6}H_{5}NH_{2}', 'H_{2}NCH_{2}COOH', 'CH_{3}COOH']],
] as const
const BANK_LD = {
  phanI: Array.from({ length: 18 }, (_, i) => { const m = MAU_I[i % 4]; return { id: `ld-a${i + 1}`, text: m[0], choices: [...m[1]] } }),
  phanII: Array.from({ length: 4 }, (_, i) => ({ id: `ld-b${i + 1}`, text: 'Cho các phát biểu về chất béo và xà phòng:', ideas: ['Chất béo là triester của glycerol với acid béo.', 'Dầu thực vật chứa chủ yếu gốc acid béo no.', 'Xà phòng hoá chất béo thu được glycerol.', 'Chất béo tan tốt trong nước.'] })),
  phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `ld-c${i + 1}`, text: `Đun nóng ${(8.8 + i).toLocaleString('vi-VN')} gam ethyl acetate với 150 mL dung dịch NaOH 1M đến phản ứng hoàn toàn. Tính khối lượng chất rắn khan (gam, làm tròn đến hàng phần mười).` })),
}
const DA_LD: Record<string, unknown> = {}
BANK_LD.phanI.forEach((q) => (DA_LD[q.id] = 'A'))
BANK_LD.phanII.forEach((q) => (DA_LD[q.id] = ['D', 'S', 'D', 'S']))
BANK_LD.phanIII.forEach((q) => (DA_LD[q.id] = '10,2'))
const TL_LD: Record<string, string> = {}
BANK_LD.phanI.forEach((q, i) => (TL_LD[q.id] = i % 4 === 3 ? 'B' : 'A'))
BANK_LD.phanII.forEach((q, i) => (TL_LD[q.id] = i < 2 ? 'DSDS' : 'DSDD'))
BANK_LD.phanIII.forEach((q, i) => (TL_LD[q.id] = i < 4 ? '10,2' : '9,8'))
const DANG_LAM: Record<string, string> = {}
Object.keys(TL_LD).slice(0, 11).forEach((k) => (DANG_LAM[k] = TL_LD[k]))
function chiTietLd() {
  const detail: Record<string, { correct: unknown; points: number }> = {}
  let diem = 0
  for (const q of BANK_LD.phanI) { const p = TL_LD[q.id] === DA_LD[q.id] ? 0.25 : 0; diem += p; detail[q.id] = { correct: DA_LD[q.id], points: p } }
  for (const q of BANK_LD.phanII) { const n = (DA_LD[q.id] as string[]).filter((v, i) => v === TL_LD[q.id][i]).length; const p = [0, 0.1, 0.25, 0.5, 1][n]; diem += p; detail[q.id] = { correct: DA_LD[q.id], points: p } }
  for (const q of BANK_LD.phanIII) { const p = TL_LD[q.id] === DA_LD[q.id] ? 0.25 : 0; diem += p; detail[q.id] = { correct: DA_LD[q.id], points: p } }
  return { score: Math.round(diem * 100) / 100, detail }
}
const LICH_LD = [
  { id: 'ld3', createdAt: now - 2 * NGAY, status: 'submitted', score: 7.25 },
  { id: 'ld2', createdAt: now - 6 * NGAY, status: 'submitted', score: 6.5 },
  { id: 'ld1', createdAt: now - 11 * NGAY, status: 'submitted', score: 5.75 },
]
const deHetLuc = now + (ld === 'gap' ? 4 * 60_000 + 12_000 : 37 * 60_000 + 25_000)
const MAY_LD: Record<string, (b: Record<string, unknown>) => unknown> = {
  'dieu-kien': () => (ld === 'khoa' ? { ok: true, trangThai: 'khoa', lyDo: 'Mục này chỉ dành cho học sinh khối 12.', items: [] } : { ok: true, trangThai: 'mo', lyDo: '', items: LICH_LD }),
  history: () => ({ ok: true, items: ld === 'khoa' ? [] : LICH_LD }),
  start: () => ({ ok: true, id: 'ld4', status: 'active', deadline: deHetLuc, serverNow: Date.now(), answers: DANG_LAM, bank: BANK_LD }),
  open: () => ({ ok: true, id: 'ld4', status: 'active', deadline: deHetLuc, serverNow: Date.now(), answers: DANG_LAM, bank: BANK_LD }),
  save: () => ({ ok: true, serverNow: Date.now() }),
  submit: () => ({
    ok: true, id: 'ld4', status: 'submitted', deadline: deHetLuc, serverNow: Date.now(), answers: TL_LD, bank: BANK_LD, result: chiTietLd(),
    solutions: [{ maDe: 'gia', phanI: BANK_LD.phanI.map((q) => ({ ...q, correct: 'A', explanation: 'Chất có nhóm –COO– liên kết với gốc hydrocarbon là ester.' })), phanII: BANK_LD.phanII.map((q) => ({ ...q, correct: DA_LD[q.id] })), phanIII: BANK_LD.phanIII.map((q) => ({ ...q, correct: '10,2', explanation: 'm = 0,1 × 82 + 0,05 × 40 = 10,2 gam.' })) }],
  }),
}

const fetchGoc = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
  if (url.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  const m = /\/hs\/tu-luyen\/([a-z-]+)/.exec(url)
  if (m) {
    await new Promise((r) => setTimeout(r, 120))
    const b = init?.body ? JSON.parse(String(init.body)) : {}
    return tra(MAY_CHU[m[1]]?.(b) ?? { ok: false, error: 'không có' })
  }
  const c = /\/hs\/chua-cau-sai\/([a-z-]+)/.exec(url)
  if (c) {
    await new Promise((r) => setTimeout(r, 80))
    return tra(c[1] === 'danh-sach' ? { ok: true, ds: CHUA } : { ok: false, error: 'không có' })
  }
  const l = /\/luyen-de\/([a-z-]+)/.exec(url)
  if (l) {
    await new Promise((r) => setTimeout(r, 120))
    const b = init?.body ? JSON.parse(String(init.body)) : {}
    return tra(MAY_LD[l[1]]?.(b) ?? { ok: false, error: 'không có' })
  }
  if (url.includes('may-chu-gia')) return tra({ ok: false, error: 'giả' })
  return fetchGoc(input, init)
}

const SANH = {
  ok: true, cheDo2: true, ngay: '2026-09-29',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false, loiKhoaDao: '',
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
}
const con = man === 'sanh'
  ? h(SanhBanDo, {
      ketQua: docSanh(SANH) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 },
      chuoiNgay: 5, caDangMo: false, now, token: 'tk', shopBat: true, onVaoThi: noop, onPhaPhucKich: noop, onKhamPhaDao: noop, onCauDaLam: noop,
      onTuiDo: noop, onCuaHang: noop, onMoThanThu: noop, onChonThu: noop, onDangXuat: noop, onTaiLai: noop, onTuLuyen: noop,
    })
  : h(ManTuLuyen, { token: 'tk-gia', sbd: 'GIA', onVe: noop })
createRoot(document.getElementById('root')!).render(h(BatLinhShell, { vai: 'hs' }, con))
