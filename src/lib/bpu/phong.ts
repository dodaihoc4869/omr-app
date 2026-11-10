// BÌNH PHẢN ỨNG — LUẬT PHÒNG THUẦN (thầy 06/11: «khi chiếu đề nào thì học sinh ở dưới nhận được đề trên app … chọn đáp án thì hiện lên bảng»;
// đặc tả + bản vẽ thầy duyệt «build luôn»: docs/ban-ve-binh-phan-ung-0611/GHI-CHU.md). Dùng chung: Durable Object máy chủ (server/src/phong-binh-phan-ung.ts)
// giữ trạng thái và gọi các hàm này; app thầy / máy em chỉ dùng phần chia đội + chữ. KHÔNG đọc mạng, KHÔNG đọc đồng hồ (nơi gọi truyền `nay`).
// BẤT BIẾN AN TOÀN: `viewEm` không bao giờ mang đáp án (`dung`) khi lượt chưa mở đáp án — test tests/bpu-phong-0611.test.ts khoá.
// Điểm trong buổi là «kJ» (năng lượng) — KHÔNG phải «tinh thể» (tinh thể là phần thưởng tích luỹ sẵn có của app học sinh).
import { laEmXaDangLive, liveTat, viewLiveBang, viewLiveEm, type LivePhong } from './phong-live'

export type PhanCau = 'I' | 'II' | 'III'
export type PhaLuot = 'tra-loi' | 'goi' | 'lam-bang' | 'mo'

/** Bốn đội màu thử ngọn lửa: Na vàng cam · K tím · Cu xanh lục (đúng màu ngọn lửa đồng) · Ca đỏ — biến màu CỐ ĐỊNH sẵn có ở tokens.css (không đổi theo nền, cùng giá trị ở bảng chiếu và máy em; không thêm byte vào tờ màu lúc mở app). */
export const DOI_BPU = [
  { ten: 'Đội Natri', ky: 'Na', mau: '--p-cam' },
  { ten: 'Đội Kali', ky: 'K', mau: '--p-tim-2' },
  { ten: 'Đội Đồng', ky: 'Cu', mau: '--p-xanh' },
  { ten: 'Đội Canxi', ky: 'Ca', mau: '--p-do' },
] as const

export const KJ = {
  dung: 100,
  nhanhToiDa: 50,
  moiYDung: 25,
  vaoLop: 10,
  duQuanDau: 50,
  kichHoat: 30,
  /** Lên bảng ĐẠT: đội +200 (`doiThuong`) và em được gọi +100 (`lenBangDatEm`). */
  lenBangDat: 200,
  lenBangDatEm: 100,
  /** Lên bảng CHƯA ĐẠT mà trên máy em ĐÃ ĐÚNG câu này (thầy 09/11 «làm dưới đúng nhưng lên bảng làm sai … bị trừ cả đội và cá nhân»): em −100, đội −100.
   *  Trên máy sai / không gửi ⇒ lên bảng để chữa, không trừ. */
  lenBangTru: 100,
  doanDung: 20,
  /** LUẬT CHẶT 09/11 (thầy «thoát màn hình cảnh báo bị trừ cả đội và cá nhân»): mỗi lần rời màn (em chưa đang ở «đang rời») ⇒ em −50 VÀ đội −50. kJ em kẹp ≥ 0. */
  roiMan: 50,
  /** CHUỖI ĐÚNG (09/11): em đúng và chuỗi sau lượt ≥ 3 ⇒ +20 × (chuỗi − 2), tối đa +60. */
  chuoi: 20,
  chuoiToiDa: 60,
  /** «Em chưa biết làm» (thầy 07/11 «để học sinh thành thật»): +20 kJ cho em, không bị gọi lên bảng; đoán bừa sai thì 0 kJ và vẫn có thể được gọi. */
  thanhThat: 20,
} as const
export const NGUONG_KICH_HOAT = 0.75
export const TIEP_SUC_TOI_DA = 10
/** Gửi trễ hơn hạn bao lâu vẫn nhận (mạng chậm). */
export const AN_HAN_MS = 2000
/** Số mục biến động kJ giữ trong phòng (mới nhất). */
export const BIEN_DONG_GIU = 30

/** MỘT BIẾN ĐỘNG kJ (thầy 09/11 «cộng trừ hiệu ứng bay thẳng vào ống nghiệm của đội»): bảng chiếu thấy `id` mới ⇒ số «+100 kJ / −50 kJ» bay vào ống đội + dòng lý do;
 *  máy em thấy mục của mình ⇒ thẻ nhỏ bay lên. `kjEm` = kJ em THỰC đổi (sau kẹp ≥ 0), `kjDoi` = thưởng/phạt riêng của đội (`doiThuong`) ⇒ ống đội đổi `kjEm + kjDoi`.
 *  Mở đáp án gộp MỘT mục mỗi em mỗi lượt. `sbd: null` = việc của cả đội (đội đủ quân). CHỈ để hoạt cảnh — không phải sổ cái (chia lại đội dời `doiThuong` không ghi mục). */
export interface BienDong { id: number; sbd: string | null; doi: number; kjEm: number; kjDoi: number; lyDo: string; luc: number }

export interface EmPhong {
  sbd: string
  ten: string
  doi: number
  vao: boolean
  /** Giờ điểm danh (ms) — để hiện «Vừa vào lớp». */
  luc: number | null
  kj: number
  dungSo: number
  chuoi: number
  roi: number
  daLenBang: number
  /** NĂNG LỰC 0..1 (máy chủ nạp lúc mở phòng — công thức ở server/src/phong-binh-phan-ung.ts `docNangLucBpu`); thiếu ⇒ 0,5. Chỉ để chia đội công bằng, KHÔNG ra view. */
  nangLuc?: number
}
/** `kb` = em bấm «Em chưa biết làm» (cờ riêng, KHÔNG giả làm một lựa chọn ⇒ không bao giờ được chấm là đúng). */
export interface TraLoi { chon: string; t: number; kb?: boolean }
export interface GoiLenBang {
  sbd: string
  lyDo: string[]
  duDoan: Record<string, 0 | 1>
  tiep: Record<string, number>
  dat: boolean | null
  /** (10/11) kJ ĐỘI do lên bảng — ghi lúc mở đáp án (+200 / −100 / 0); trước đó không có. Máy các em hiện «đội +200 kJ» khi bạn lên bảng xong. */
  kjDoi?: number
}
export interface KetQuaEm { dung: boolean; soY: number | null; kj: number; nhanh: number | null; kb?: boolean }
export interface LuotPhong {
  so: number
  qid: string
  phan: PhanCau
  tuLuan: boolean
  /** Câu công khai (không đáp án) — nguyên dạng máy em dùng (`cauCongKhai`). */
  cau: Record<string, unknown>
  /** Đáp án — CHỈ trong phòng, chỉ ra ngoài sau khi mở. */
  dung: string
  batDau: number
  han: number | null
  pha: PhaLuot
  tra: Record<string, TraLoi>
  roiMe: string[]
  goi: GoiLenBang | null
  ketQua: Record<string, KetQuaEm> | null
  kich: boolean
  /** LỜI GIẢI (thầy 07/11: máy em hiện lời giải Kính / thu gọn sau khi mở đáp án): lời giải kho + ảnh lời giải — CHỈ trong phòng, chỉ ra máy em khi pha «mo». */
  giai?: { solution: unknown; anh: { src: string; viTri: string; alt?: string }[] } | null
}
export interface TomTatLuot { so: number; qid: string; soDung: number; soGui: number; tuLuan: boolean }
export interface TrangThaiPhong {
  buoiId: string
  lop: string
  thang: string
  mo: number
  ds: EmPhong[]
  luot: LuotPhong | null
  soLuot: number
  doiThuong: number[]
  doiDu: number | null
  /** Số đội 2 | 4 (thầy 09/11 «dưới 12 học sinh thì tự động chia 2 đội, từ học sinh thứ 13 trở lên lập tức chia thành 4 đội»): theo số em ĐANG CÓ MẶT.
   *  Phòng lưu trước bản 07/11 không có ⇒ 4. */
  soDoi?: number
  /** Em ĐANG Ở NGOÀI APP (thầy 09/11 «thoát app là báo động viền đỏ nhấp nháy trên bảng cộng thẻ tên»): `roiMan` thêm, `veMan` gỡ; lượt mới / mở đáp án ⇒ rỗng.
   *  Phòng lưu trước 09/11 không có ⇒ coi như rỗng. */
  roiNay?: string[]
  /** Biến động kJ mới nhất (≤ `BIEN_DONG_GIU`, `id` tăng dần). Phòng lưu trước 09/11 không có ⇒ rỗng. */
  bienDong?: BienDong[]
  /** LIVE BẢNG (10/11, luật ở phong-live.ts — CHỈ THÊM): bật / tắt, phiên SFU của thầy, công tắc buổi. Phòng lưu trước 10/11 không có ⇒ coi như tắt. */
  live?: LivePhong
  vuaVao: string[]
  lichSu: TomTatLuot[]
  ketThuc: boolean
  capNhat: number
}

/** Không / sai số năng lực ⇒ 0,5 (giữa thang). Kẹp 0..1, làm tròn 3 chữ số ⇒ xếp tất định. */
export const nangLucCua = (v: unknown): number => { const n = typeof v === 'number' ? v : NaN; return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(1, n)) * 1000) / 1000 : 0.5 }
/** Tới ngần này em CÓ MẶT ⇒ hai đội; em có mặt thứ 13 ⇒ bốn đội (thầy 09/11). */
export const IT_EM_HAI_DOI = 12
export const soDoiTheo = (coMat: number): number => (coMat > IT_EM_HAI_DOI ? 4 : 2)
export const soDoiCua = (st: Pick<TrangThaiPhong, 'soDoi'>): number => (st.soDoi === 2 ? 2 : 4)
const soSanhSbd = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** CHIA ĐỘI CÔNG BẰNG THEO NĂNG LỰC (thầy 09/11 «chia thật công bằng dựa trên năng lực của học sinh»). Tất định:
 *  (1) xếp năng lực giảm dần (hoà ⇒ sbd tăng dần); (2) chia rắn 0-1-2-3-3-2-1-0… (hai đội 0-1-1-0…) ⇒ số em các đội chênh ≤ 1;
 *  (3) ĐỔI CHỖ CỤC BỘ: mỗi vòng chọn cặp đổi (hai em ở hai đội) GIẢM NHIỀU NHẤT tổng bình phương tổng năng lực các đội — đổi chỗ giữ nguyên số em —
 *  tới khi hết cải thiện (bình phương thay vì «cao nhất − thấp nhất»: bốn đội thì một lần đổi thường không hạ được khoảng cách nhưng vẫn làm đều hơn). */
export function chiaDoi(ds: readonly { sbd: string; nangLuc?: number }[], soDoi = 4): Map<string, number> {
  const k = soDoi === 2 ? 2 : 4
  const xep = [...new Map(ds.map((x) => [x.sbd, nangLucCua(x.nangLuc)])).entries()].sort((a, b) => b[1] - a[1] || soSanhSbd(a[0], b[0]))
  const doi = xep.map((_, i) => { const v = Math.floor(i / k), r = i % k; return v % 2 === 0 ? r : k - 1 - r })
  const tong = Array<number>(k).fill(0)
  xep.forEach(([, n], i) => { tong[doi[i]!]! += n })
  for (let vong = 0; vong < 200; vong++) {
    let tot = -1e-9, x = -1, y = -1
    for (let i = 0; i < xep.length; i++) for (let j = i + 1; j < xep.length; j++) {
      const a = doi[i]!, b = doi[j]!, d = xep[j]![1] - xep[i]![1]
      if (a === b || d === 0) continue
      // Đổi i (đội a) ↔ j (đội b): tổng a += d, tổng b −= d ⇒ tổng bình phương đổi 2d(Ta − Tb) + 2d².
      const doiBp = 2 * d * (tong[a]! - tong[b]!) + 2 * d * d
      if (doiBp < tot) { tot = doiBp; x = i; y = j }
    }
    if (x < 0) break
    const a = doi[x]!, b = doi[y]!, d = xep[y]![1] - xep[x]![1]
    tong[a]! += d; tong[b]! -= d; doi[x] = b; doi[y] = a
  }
  return new Map(xep.map(([s], i) => [s, doi[i]!]))
}
/** Tổng năng lực các em CÓ MẶT của một đội. */
export const tongNangLuc = (st: Pick<TrangThaiPhong, 'ds'>, d: number): number => st.ds.reduce((s, e) => s + (e.vao && e.doi === d ? nangLucCua(e.nangLuc) : 0), 0)
/** Em CHƯA VÀO giữ một đội «dự kiến» (bảng hiện «đã vào/tổng» mỗi đội và «đội đủ quân trước»): lấp cho tổng số em các đội đều nhau; em có mặt KHÔNG bị dời.
 *  Em chưa vào xếp năng lực giảm dần (hoà ⇒ sbd), mỗi em vào đội đang ít em nhất (hoà ⇒ tổng năng lực thấp hơn ⇒ số đội nhỏ hơn). */
function xepEmChuaVao(st: TrangThaiPhong): void {
  const k = soDoiCua(st), dem = Array<number>(k).fill(0), nl = Array.from({ length: k }, (_, d) => tongNangLuc(st, d))
  for (const e of st.ds) if (e.vao) dem[e.doi] = (dem[e.doi] ?? 0) + 1
  const vang = st.ds.filter((e) => !e.vao).sort((a, b) => nangLucCua(b.nangLuc) - nangLucCua(a.nangLuc) || soSanhSbd(a.sbd, b.sbd))
  for (const e of vang) {
    let d = 0
    for (let i = 1; i < k; i++) if (dem[i]! < dem[d]! || (dem[i] === dem[d] && nl[i]! < nl[d]! - 1e-9)) d = i
    e.doi = d; dem[d]! += 1; nl[d]! += nangLucCua(e.nangLuc)
  }
}
/** CHIA LẠI mọi em có mặt thành `soDoi` đội (em thứ 13 vào ⇒ 4 đội; phòng mở khi đã có em điểm danh): kJ cá nhân GIỮ theo em; thưởng đội
 *  (`doiThuong`) cộng tổng rồi CHIA ĐỀU cho các đội mới (làm tròn xuống, phần dư cho đội đầu); «đội đủ quân đầu tiên» giữ (không thưởng lần hai). */
export function chiaLaiDoi(st: TrangThaiPhong, soDoi: number): void {
  const k = soDoi === 2 ? 2 : 4
  const ra = chiaDoi(st.ds.filter((e) => e.vao), k)
  for (const e of st.ds) { const d = ra.get(e.sbd); if (d != null) e.doi = d }
  const tong = st.doiThuong.reduce((a, b) => a + (Number(b) || 0), 0), deu = Math.floor(tong / k)
  st.doiThuong = Array.from({ length: k }, (_, d) => deu + (d === 0 ? tong - deu * k : 0))
  if (st.doiDu != null && st.doiDu >= k) st.doiDu = st.doiDu % k
  st.soDoi = k
  xepEmChuaVao(st)
}
/** Tên cũ (07/11) giữ cho tương thích: chia lại thành hai đội theo năng lực. */
export function gopHaiDoi(st: TrangThaiPhong): void { if (soDoiCua(st) !== 2) chiaLaiDoi(st, 2) }
export const thangCua = (nay: number): string => {
  const d = new Date(nay + 7 * 3_600_000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
/** Tên gọi trên bảng: hai chữ cuối. */
export const tenNgan = (ten: string): string => { const p = ten.trim().split(/\s+/); return p.slice(-2).join(' ') || ten }
/** Kí hiệu ô nguyên tố: hai chữ cái đầu của chữ cuối, bỏ dấu. */
export function kyHieu(ten: string): string {
  const p = ten.trim().split(/\s+/), cuoi = (p[p.length - 1] || '?').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  return (cuoi[0] || '?').toUpperCase() + (cuoi[1] || '').toLowerCase()
}

export function taoPhong(o: { buoiId: string; lop: string; nay: number; ds: readonly { sbd: string; ten: string; coMat: boolean; luc?: number | null; nangLuc?: number }[] }): TrangThaiPhong {
  const st: TrangThaiPhong = {
    buoiId: o.buoiId, lop: o.lop, thang: thangCua(o.nay), mo: o.nay,
    ds: [...new Map(o.ds.map((x) => [x.sbd, x])).values()].map((x) => ({ sbd: x.sbd, ten: x.ten || x.sbd, doi: 0, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0, nangLuc: nangLucCua(x.nangLuc) })),
    luot: null, soLuot: 0, doiThuong: [0, 0], doiDu: null, soDoi: 2, roiNay: [], vuaVao: [], lichSu: [], ketThuc: false, capNhat: o.nay,
  }
  xepEmChuaVao(st)
  // Em đã điểm danh trước khi thầy mở bảng: vào lần lượt theo giờ (thưởng vào lớp, đội đủ quân) rồi CHIA LẠI MỘT LẦN cho cả nhóm (công bằng hơn xếp từng em).
  const coMat = [...o.ds].filter((x) => x.coMat).sort((a, b) => (a.luc ?? 0) - (b.luc ?? 0))
  for (const x of coMat) vaoLop(st, x.sbd, x.luc ?? o.nay)
  if (coMat.length) chiaLaiDoi(st, soDoiTheo(st.ds.filter((e) => e.vao).length))
  return st
}
const em = (st: TrangThaiPhong, sbd: string): EmPhong | undefined => st.ds.find((x) => x.sbd === sbd)
/** Ghi các biến động kJ (theo thứ tự truyền vào, `id` tăng dần), giữ `BIEN_DONG_GIU` mục mới nhất. */
function ghiBienDong(st: TrangThaiPhong, ds: readonly Omit<BienDong, 'id' | 'luc'>[], nay: number): void {
  if (!ds.length) return
  const cu = st.bienDong ?? []
  let id = cu[cu.length - 1]?.id ?? 0
  st.bienDong = [...cu, ...ds.map((x) => ({ ...x, lyDo: x.lyDo.slice(0, 80), id: ++id, luc: nay }))].slice(-BIEN_DONG_GIU)
}
/** Cộng/trừ kJ một em, KẸP ≥ 0 — trả số kJ thực đổi. */
function congEm(e: EmPhong, kj: number): number { const truoc = e.kj; e.kj = Math.max(0, truoc + kj); return e.kj - truoc }
const vietHoa = (x: string): string => (x ? x[0]!.toUpperCase() + x.slice(1) : x)

/** Thêm em vào danh sách phòng (CHƯA vào lớp) nếu chưa có; có rồi ⇒ chỉ cập nhật năng lực (thầy mở lại bảng, số mới). Đội dự kiến: lấp cho các đội đều số em. */
export function themEm(st: TrangThaiPhong, sbd: string, ten: string, nangLuc?: number): void {
  if (!sbd) return
  const cu = em(st, sbd)
  if (cu) { if (nangLuc != null) cu.nangLuc = nangLucCua(nangLuc); return }
  st.ds.push({ sbd, ten: ten || sbd, doi: 0, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0, nangLuc: nangLucCua(nangLuc) })
  xepEmChuaVao(st)
}
/** Em điểm danh / vào phòng: +10 kJ cho đội; đội đủ quân đầu tiên +50. Em lạ (không thuộc lớp, không kèm tên) ⇒ false.
 *  ĐỘI (thầy 09/11): em có mặt thứ 13 ⇒ NGAY LÚC ĐÓ chia lại mọi em có mặt thành 4 đội (`chiaLaiDoi`). Số đội không đổi ⇒ em vào đội có TỔNG NĂNG LỰC
 *  (em có mặt) THẤP NHẤT, chỉ xét các đội đang ÍT EM NHẤT để số em các đội luôn chênh ≤ 1 (hoà ⇒ đội số nhỏ hơn). Em có mặt khác KHÔNG bị dời. */
export function vaoLop(st: TrangThaiPhong, sbd: string, nay: number, ten?: string, nangLuc?: number): boolean {
  let e = em(st, sbd)
  if (!e) {
    if (!ten) return false
    e = { sbd, ten, doi: 0, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0, nangLuc: nangLucCua(nangLuc) }
    st.ds.push(e)
  } else if (nangLuc != null && !e.vao) e.nangLuc = nangLucCua(nangLuc)
  if (e.vao) return true
  const k = soDoiCua(st), moi = soDoiTheo(st.ds.filter((x) => x.vao).length + 1)
  if (moi === k) {
    const dem = Array<number>(k).fill(0)
    for (const x of st.ds) if (x.vao) dem[x.doi] = (dem[x.doi] ?? 0) + 1
    const it = Math.min(...dem)
    let d = 0, nl = Infinity
    for (let i = 0; i < k; i++) if (dem[i] === it) { const t = tongNangLuc(st, i); if (t < nl - 1e-9) { nl = t; d = i } }
    e.doi = d
  }
  e.vao = true; e.luc = nay
  st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) + KJ.vaoLop
  if (moi !== k) chiaLaiDoi(st, moi)
  else xepEmChuaVao(st)
  ghiBienDong(st, [{ sbd, doi: e.doi, kjEm: 0, kjDoi: KJ.vaoLop, lyDo: 'Vào lớp' }], nay)
  st.vuaVao = [...st.vuaVao.filter((s) => s !== sbd), sbd].slice(-6)
  // Đội đủ quân: xét đội của em trước, rồi các đội khác (xếp lại em chưa vào có thể làm một đội khác vừa đủ quân).
  if (st.doiDu == null) {
    const k2 = soDoiCua(st)
    for (const d of [e.doi, ...Array.from({ length: k2 }, (_, i) => i).filter((i) => i !== e!.doi)]) {
      const thanh = st.ds.filter((x) => x.doi === d)
      if (thanh.length && thanh.every((x) => x.vao)) { st.doiDu = d; st.doiThuong[d] = (st.doiThuong[d] ?? 0) + KJ.duQuanDau; ghiBienDong(st, [{ sbd: null, doi: d, kjEm: 0, kjDoi: KJ.duQuanDau, lyDo: 'Đội đủ quân đầu tiên' }], nay); break }
    }
  }
  st.capNhat = nay
  return true
}

/** Lượt đang mở mà CHƯA em nào gửi, chưa gọi ai ⇒ bỏ (không đánh số mới cho câu kế tiếp). Trả true nếu đã bỏ. */
export function boLuotRong(st: TrangThaiPhong): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo' || l.goi || Object.keys(l.tra).length) return false
  st.luot = null
  st.soLuot = Math.max(0, st.soLuot - 1)
  return true
}
/** BỎ LƯỢT DỞ (thầy 10/11 «chọn câu khác ⇒ bắt đầu lượt mới và xoá lượt câu cũ»): lượt CHƯA mở đáp án ⇒ bỏ hẳn, dù em đã gửi hay thầy đã gọi em —
 *  không chấm, không cộng / trừ kJ, không chuỗi, không ghi tổng kết, đáp án không ra ngoài (không qua `moDapAn`). Lượt đã mở đáp án ⇒ giữ kết quả (false). */
export function boLuot(st: TrangThaiPhong, nay: number): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo') return false
  // Số lượt KHÔNG lùi (khác `boLuotRong`): lượt mới mang số mới ⇒ bảng / máy em không nhận nhầm trạng thái của lượt vừa bỏ (gọi em, phương án, đã gửi).
  st.luot = null
  st.capNhat = nay
  return true
}
export function moLuot(st: TrangThaiPhong, c: { qid: string; phan: PhanCau; tuLuan: boolean; cau: Record<string, unknown>; dung: string; hanGiay: number | null; giai?: LuotPhong['giai'] }, nay: number): LuotPhong {
  // SỐ ĐỘI theo em có mặt (thầy 09/11) do `vaoLop` lo ngay lúc em vào; ở đây chỉ nắn phòng lưu trước 09/11 (4 đội mà có mặt ≤ 12 em ⇒ 2 đội).
  const can = soDoiTheo(st.ds.filter((e) => e.vao).length)
  if (can !== soDoiCua(st) && st.ds.some((e) => e.vao)) chiaLaiDoi(st, can)
  // 09/11 (lần 3) thầy «học sinh thoát ra làm việc khác … báo động như báo cháy»: «đang rời» GIỮ qua lượt mới / mở đáp án — chỉ tắt khi em quay lại (`ve` / nối lại).
  st.soLuot += 1
  st.luot = {
    so: st.soLuot, qid: c.qid, phan: c.phan, tuLuan: c.tuLuan, cau: c.cau, dung: c.dung, batDau: nay,
    han: c.hanGiay && c.hanGiay > 0 ? nay + c.hanGiay * 1000 : null, pha: 'tra-loi', tra: {}, roiMe: [], goi: null, ketQua: null, kich: false, giai: c.giai ?? null,
  }
  st.capNhat = nay
  return st.luot
}

export type LyDoTuChoi = 'khong-co-luot' | 'da-khoa' | 'het-gio' | 'da-gui' | 'la' | 'rong'
/** Nhận đáp án: chỉ lần gửi ĐẦU theo (sbd, lượt); quá hạn (+2 s) ⇒ từ chối. Em chưa điểm danh mà gửi ⇒ tính là vào lớp. */
export function nhanTra(st: TrangThaiPhong, sbd: string, chon: string, nay: number, kb = false): { ok: true } | { ok: false; ly: LyDoTuChoi } {
  const l = st.luot
  if (!l) return { ok: false, ly: 'khong-co-luot' }
  if (l.pha !== 'tra-loi') return { ok: false, ly: 'da-khoa' }
  if (l.han != null && nay > l.han + AN_HAN_MS) return { ok: false, ly: 'het-gio' }
  const e = em(st, sbd)
  if (!e) return { ok: false, ly: 'la' }
  if (l.tra[sbd]) return { ok: false, ly: 'da-gui' }
  const v = kb ? '' : l.tuLuan ? 'xong' : String(chon ?? '').trim().slice(0, 40)
  if (!v && !kb) return { ok: false, ly: 'rong' }
  if (!e.vao) vaoLop(st, sbd, nay)
  l.tra[sbd] = kb ? { chon: '', t: Math.max(0, nay - l.batDau), kb: true } : { chon: v, t: Math.max(0, nay - l.batDau) }
  st.capNhat = nay
  return { ok: true }
}

/** Em rời màn (máy em tự đo): đếm lần, ghi vào lượt, ĐANG RỜI (`roiNay`) ⇒ bảng báo động viền đỏ nhấp nháy + thẻ tên.
 *  LUẬT CHẶT 09/11 (thầy «thoát màn hình cảnh báo bị trừ cả đội và cá nhân»): mỗi LẦN RỜI MỚI (em chưa nằm trong `roiNay`) ⇒ em −50 (kẹp ≥ 0), đội −50;
 *  máy em báo trùng (`roi` hai lần trước khi `ve`) không trừ lần hai. Rớt kết nối WebSocket KHÔNG phải rời màn (chỉ khi máy em tự báo `roi`). */
export function roiMan(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const e = em(st, sbd)
  // 09/11 (lần 3): rời màn tính MỌI LÚC trong buổi (cả lúc chờ giữa lượt, sau mở đáp án) — em chỉ thoát khi thầy kết thúc buổi.
  if (!e || st.ketThuc) return false
  // LIVE (10/11, điểm quyết 2): em Ở XA đang xem live (thuộc lớp, chưa điểm danh ⇒ không đội, không kJ) rời màn ⇒ CHỈ cảnh báo tên trên màn chiếu, không trừ gì.
  if (!e.vao) {
    if (!laEmXaDangLive(st, sbd)) return false
    e.roi += 1
    st.roiNay = [...(st.roiNay ?? []).filter((s) => s !== sbd), sbd]
    st.capNhat = nay
    return true
  }
  e.roi += 1
  if (st.luot && st.luot.pha !== 'mo' && !st.luot.roiMe.includes(sbd)) st.luot.roiMe.push(sbd)
  if (!st.roiNay?.includes(sbd)) {
    const kjEm = congEm(e, -KJ.roiMan)
    st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) - KJ.roiMan
    ghiBienDong(st, [{ sbd, doi: e.doi, kjEm, kjDoi: -KJ.roiMan, lyDo: 'Rời màn hình' }], nay)
  }
  st.roiNay = [...(st.roiNay ?? []).filter((s) => s !== sbd), sbd]
  st.capNhat = nay
  return true
}
/** Em quay lại app (máy em gửi `ve` sau `roi`) ⇒ gỡ khỏi «đang rời». Em không đang rời ⇒ false (không phát lại). */
export function veMan(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  if (!st.roiNay?.includes(sbd)) return false
  st.roiNay = st.roiNay.filter((s) => s !== sbd)
  st.capNhat = nay
  return true
}

export function goiLenBang(st: TrangThaiPhong, sbd: string, lyDo: readonly string[], nay: number): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo' || !em(st, sbd)) return false
  l.pha = 'goi'
  l.goi = { sbd, lyDo: lyDo.map((x) => String(x).slice(0, 200)).slice(0, 3), duDoan: {}, tiep: {}, dat: null }
  st.capNhat = nay
  return true
}
export function lamBang(st: TrangThaiPhong, nay: number): boolean {
  const l = st.luot
  if (!l || !l.goi || l.pha === 'mo') return false
  l.pha = 'lam-bang'; st.capNhat = nay
  return true
}
export function duDoan(st: TrangThaiPhong, sbd: string, v: 0 | 1, nay: number): boolean {
  const l = st.luot
  // 10/11: thầy đã chấm (bảng hiện kết quả trước khi mở đáp án) ⇒ hết đoán — không ai đoán sau khi đã thấy kết quả.
  if (!l?.goi || l.pha === 'mo' || l.goi.dat != null || l.goi.sbd === sbd || !em(st, sbd) || l.goi.duDoan[sbd] != null) return false
  l.goi.duDoan[sbd] = v ? 1 : 0; st.capNhat = nay
  return true
}
export function tiepSuc(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.luot
  if (!l?.goi || l.pha === 'mo' || l.goi.sbd === sbd || !em(st, sbd)) return false
  const n = l.goi.tiep[sbd] ?? 0
  if (n >= TIEP_SUC_TOI_DA) return false
  l.goi.tiep[sbd] = n + 1; st.capNhat = nay
  return true
}
export function chamLenBang(st: TrangThaiPhong, dat: boolean, nay: number): boolean {
  const l = st.luot
  if (!l?.goi || l.pha === 'mo') return false
  l.goi.dat = dat; st.capNhat = nay
  return true
}
export const tongTiep = (g: GoiLenBang | null): number => (g ? Object.values(g.tiep).reduce((a, b) => a + b, 0) : 0)

/** Chấm một câu trả lời. `chamSo` = luật so đáp số Phần III của app (truyền vào để module này không kéo bộ chấm). */
export function chamTra(l: Pick<LuotPhong, 'phan' | 'dung' | 'tuLuan'>, chon: string, chamSo: (traLoi: string, dapAn: string) => boolean): { dung: boolean; soY: number | null } {
  if (l.tuLuan) return { dung: false, soY: null }
  const a = chon.trim().toUpperCase(), d = l.dung.trim().toUpperCase()
  if (l.phan === 'III') return { dung: chamSo(chon, l.dung), soY: null }
  if (l.phan === 'II') {
    let soY = 0
    for (let i = 0; i < Math.max(4, d.length); i++) if (d[i] && a[i] === d[i]) soY++
    return { dung: a === d, soY }
  }
  return { dung: a === d, soY: null }
}

/** MỞ ĐÁP ÁN: khoá nhận bài trước, chấm, cộng kJ — LUẬT 09/11 (thầy «làm lại luật cộng trừ kJ cho cuộc chơi thật hấp dẫn»):
 *  đúng +100 (Đúng–sai 25/ý) + nhanh tối đa 50 (Đúng–sai đủ 4 ý mới có nhanh); CHUỖI đúng ≥ 3 ⇒ +20 × (chuỗi − 2) tối đa +60; sai 0; «chưa biết làm» +20;
 *  năng lượng hoạt hoá (≥ 75% em có mặt đúng ⇒ mọi em có mặt +30); đoán đúng bạn lên bảng +20;
 *  lên bảng ĐẠT ⇒ em +100, đội +200; CHƯA ĐẠT mà trên máy đã đúng ⇒ em −100, đội −100 (trên máy sai / không gửi ⇒ không trừ).
 *  Mọi thay đổi của một em GỘP một lần (kẹp ≥ 0) ⇒ `ketQua[sbd].kj` = kJ thực đổi trong lượt + MỘT mục `bienDong`. Gọi lại khi đã mở ⇒ không làm gì.
 *  Kết quả lên bảng chỉ tính ở đây (không lúc thầy chấm `dat`) ⇒ cả lớp không biết trước em được gọi đúng/sai trên máy. */
export function moDapAn(st: TrangThaiPhong, nay: number, chamSo: (traLoi: string, dapAn: string) => boolean): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo') return false
  l.pha = 'mo'
  // LƯỢT RỖNG (không em nào gửi — thầy lật qua câu): không đụng chuỗi đúng của ai, không ghi vào tổng kết (tỉ lệ đúng, «lượt khó nhất»).
  if (!Object.keys(l.tra).length && !l.goi) { l.ketQua = {}; st.capNhat = nay; return true }
  const kq: Record<string, KetQuaEm> = {}
  const cong = new Map<string, { em: number; doi: number; ly: string[] }>()
  const them = (s: string, kjEm: number, kjDoi: number, ly?: string) => { const c = cong.get(s) ?? { em: 0, doi: 0, ly: [] }; c.em += kjEm; c.doi += kjDoi; if (ly) c.ly.push(ly); cong.set(s, c) }
  const dungTheoGio = Object.entries(l.tra).filter(([, t]) => !t.kb && chamTra(l, t.chon, chamSo).dung).sort((a, b) => a[1].t - b[1].t).map(([s]) => s)
  const thoiLuong = l.han != null ? l.han - l.batDau : 60_000
  for (const e of st.ds) {
    const t = l.tra[e.sbd]
    if (!t) { if (!l.tuLuan) e.chuoi = 0; continue }
    // Chưa biết làm: +20 kJ thành thật (câu tự luận 0), không chấm, không cộng nhanh; chuỗi đúng giữ nguyên (không phạt sự thành thật).
    if (t.kb) { kq[e.sbd] = { dung: false, soY: 0, kj: 0, nhanh: null, kb: true }; if (!l.tuLuan) them(e.sbd, KJ.thanhThat, 0, 'thành thật: chưa biết làm'); continue }
    const c = chamTra(l, t.chon, chamSo)
    const nhanh = Math.round(KJ.nhanhToiDa * Math.max(0, 1 - t.t / Math.max(1, thoiLuong)))
    const k = dungTheoGio.indexOf(e.sbd)
    kq[e.sbd] = { dung: c.dung, soY: c.soY, kj: 0, nhanh: k >= 0 ? k + 1 : null }
    if (l.tuLuan) continue
    if (c.dung) { e.dungSo += 1; e.chuoi += 1 } else e.chuoi = 0
    const thuongChuoi = c.dung && e.chuoi >= 3 ? Math.min(KJ.chuoiToiDa, KJ.chuoi * (e.chuoi - 2)) : 0
    const kj = (l.phan === 'II' ? (c.soY ?? 0) * KJ.moiYDung : c.dung ? KJ.dung : 0) + (c.dung ? nhanh + thuongChuoi : 0)
    const ly = c.dung ? ['đúng', ...(k >= 0 && k < 3 ? [`nhanh thứ ${k + 1}`] : []), ...(thuongChuoi ? [`chuỗi ${e.chuoi}`] : [])].join(' · ')
      : l.phan === 'II' && c.soY ? `đúng ${c.soY}/4 ý` : ''
    if (kj || ly) them(e.sbd, kj, 0, ly)
  }
  const coMat = st.ds.filter((e) => e.vao).length
  l.kich = !l.tuLuan && coMat > 0 && dungTheoGio.length / coMat >= NGUONG_KICH_HOAT
  if (l.kich) for (const e of st.ds) if (e.vao) them(e.sbd, KJ.kichHoat, 0, 'năng lượng hoạt hoá')
  const g = l.goi, duoc = g ? em(st, g.sbd) : undefined
  if (g && duoc) {
    duoc.daLenBang += 1
    if (g.dat === true) them(duoc.sbd, KJ.lenBangDatEm, KJ.lenBangDat, 'giải đúng trên bảng')
    else if (g.dat === false) {
      const t = l.tra[duoc.sbd], dungTrenMay = !!t && !t.kb && !l.tuLuan && chamTra(l, t.chon, chamSo).dung
      if (dungTrenMay) them(duoc.sbd, -KJ.lenBangTru, -KJ.lenBangTru, 'đúng trên máy, chưa giải được trên bảng')
      else them(duoc.sbd, 0, 0, 'lên bảng chữa, không trừ')
    }
  }
  if (g && g.dat != null) for (const [s, v] of Object.entries(g.duDoan)) if ((v === 1) === g.dat && em(st, s)) them(s, KJ.doanDung, 0, 'đoán đúng bạn lên bảng')
  // Áp một lần mỗi em (kẹp ≥ 0). Mục ghi theo |biến động| tăng dần, em lên bảng cuối ⇒ lớp đông vượt 30 mục thì mất các mục nhỏ (+30 hoạt hoá) trước.
  const muc: (Omit<BienDong, 'id' | 'luc'> & { cuoi: boolean })[] = []
  for (const [s, c] of cong) {
    const e = em(st, s)
    if (!e) continue
    const kjEm = congEm(e, c.em)
    st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) + c.doi
    if (kq[s]) kq[s]!.kj = kjEm
    const cuoi = duoc?.sbd === s && g?.dat != null
    if (cuoi) g!.kjDoi = c.doi
    if (kjEm || c.doi || cuoi) muc.push({ sbd: s, doi: e.doi, kjEm, kjDoi: c.doi, lyDo: vietHoa(c.ly.join(' · ')), cuoi })
  }
  muc.sort((a, b) => Number(a.cuoi) - Number(b.cuoi) || Math.abs(a.kjEm + a.kjDoi) - Math.abs(b.kjEm + b.kjDoi))
  ghiBienDong(st, muc.map(({ cuoi: _c, ...x }) => x), nay)
  l.ketQua = kq
  st.lichSu.push({ so: l.so, qid: l.qid, soDung: dungTheoGio.length, soGui: Object.keys(l.tra).length, tuLuan: l.tuLuan })
  st.capNhat = nay
  return true
}

export const diemDoi = (st: TrangThaiPhong, d: number): number => st.ds.reduce((s, e) => s + (e.doi === d ? e.kj : 0), 0) + (st.doiThuong[d] ?? 0)
/** Xếp hạng đội theo TỔNG kJ (con số hiện trên bảng — cả lớp nhìn là hiểu); hoà ⇒ trung bình mỗi bạn có mặt cao hơn. Chia đội lệch nhau tối đa 1 bạn. */
export function xepDoi(st: TrangThaiPhong): { doi: number; tong: number; coMat: number; tb: number }[] {
  return Array.from({ length: soDoiCua(st) }, (_, d) => d).map((d) => { const coMat = st.ds.filter((e) => e.doi === d && e.vao).length, tong = diemDoi(st, d); return { doi: d, tong, coMat, tb: coMat ? tong / coMat : tong } })
    .sort((a, b) => b.tong - a.tong || b.tb - a.tb || a.doi - b.doi)
}
export const xepEm = (st: TrangThaiPhong): EmPhong[] => [...st.ds].filter((e) => e.vao).sort((a, b) => b.kj - a.kj || a.ten.localeCompare(b.ten))

/** Thông tin cho BẢNG CHIẾU (máy thầy): đủ mọi thứ; đáp án chỉ khi đã mở.
 *  `chamSo` (máy chủ truyền, 10/11): lượt trắc nghiệm đang «tra-loi» ⇒ thêm `kiem` {sbd: [đúng 1/0, giây gửi]} CHỈ cho bộ chọn em lên bảng (ưu tiên em đúng
 *  trên máy để kiểm thật, có lượt chọn em sai để chữa). KHÔNG vẽ, KHÔNG vào lý do (lộ đúng/sai làm hỏng trò đoán của lớp), không bao giờ ra `viewEm`. */
export function viewBang(st: TrangThaiPhong, chamSo?: (traLoi: string, dapAn: string) => boolean, demLive?: { xem: number; ws: number }) {
  const l = st.luot
  return {
    t: 'bang' as const,
    /** LIVE BẢNG (10/11): trạng thái live của buổi + số em đang xem (`demLive` do phòng đếm); công tắc tắt / phòng đời cũ ⇒ null. */
    live: viewLiveBang(st, demLive),
    buoiId: st.buoiId, lop: st.lop, soLuot: st.soLuot, ketThuc: st.ketThuc, doiThuong: st.doiThuong, doiDu: st.doiDu, soDoi: soDoiCua(st), vuaVao: st.vuaVao, lichSu: st.lichSu,
    /** Em đang ở ngoài app trong lượt chưa mở đáp án (thầy 09/11) — bảng vẽ viền đỏ nhấp nháy + thẻ tên khi mảng khác rỗng. */
    roiNay: st.roiNay ?? [],
    /** Biến động kJ mới nhất (thầy 09/11): mỗi `id` mới ⇒ số kJ bay vào ống đội + lý do. */
    bienDong: st.bienDong ?? [],
    ds: st.ds.map((e) => ({ sbd: e.sbd, ten: e.ten, doi: e.doi, vao: e.vao, luc: e.luc, kj: e.kj, dungSo: e.dungSo, chuoi: e.chuoi, roi: e.roi, daLenBang: e.daLenBang })),
    luot: l ? {
      so: l.so, qid: l.qid, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, batDau: l.batDau, han: l.han, pha: l.pha, roiMe: l.roiMe, kich: l.kich,
      daGui: Object.keys(l.tra),
      chuaBiet: Object.entries(l.tra).filter(([, t]) => t.kb).map(([s]) => s),
      ...(chamSo && l.pha === 'tra-loi' && !l.tuLuan ? { kiem: Object.fromEntries(Object.entries(l.tra).filter(([, t]) => !t.kb).map(([s, t]) => [s, [chamTra(l, t.chon, chamSo).dung ? 1 : 0, Math.max(1, Math.round(t.t / 1000))] as [0 | 1, number]])) } : {}),
      goi: l.goi ? { sbd: l.goi.sbd, lyDo: l.goi.lyDo, dat: l.goi.dat, doanDung: Object.values(l.goi.duDoan).filter((v) => v === 1).length, doanSai: Object.values(l.goi.duDoan).filter((v) => v === 0).length, tiep: tongTiep(l.goi) } : null,
      ...(l.pha === 'mo' ? { dung: l.dung, chon: Object.fromEntries(Object.entries(l.tra).filter(([, t]) => !t.kb).map(([s, t]) => [s, t.chon])), ketQua: l.ketQua } : {}),
    } : null,
  }
}
/** `roiNay` TUỲ CHỌN ở kiểu (bảng dựng sẵn view rỗng lúc chờ phòng) — `viewBang` luôn gửi mảng. `live` tuỳ chọn: phòng bản trước 10/11 không gửi. */
export type ViewBang = Omit<ReturnType<typeof viewBang>, 'roiNay' | 'bienDong' | 'live'> & { roiNay?: string[]; bienDong?: BienDong[]; live?: ReturnType<typeof viewLiveBang> }

/** Thông tin cho MÁY EM: chỉ việc của em; KHÔNG đáp án trước khi mở. */
export function viewEm(st: TrangThaiPhong, sbd: string) {
  const e = em(st, sbd), l = st.luot
  const xep = xepEm(st), hang = e ? xep.findIndex((x) => x.sbd === sbd) + 1 : 0
  const d = e ? e.doi : 0
  const goi = l?.goi ? (() => { const g = l.goi!, h = em(st, g.sbd); return { sbd: g.sbd, ten: h?.ten ?? g.sbd, doi: h?.doi ?? 0, lyDo: g.lyDo, emDoan: g.duDoan[sbd] ?? null, emTiep: g.tiep[sbd] ?? 0, tiep: tongTiep(g), dat: g.dat, ...(l.pha === 'mo' && g.kjDoi != null ? { kjDoi: g.kjDoi } : {}) } })() : null
  return {
    t: 'em' as const,
    ketThuc: st.ketThuc, soLuot: st.soLuot,
    /** LIVE BẢNG (10/11): thầy có đang live không, phiên SFU để kéo tiếng, tiếng mặc định bật / tắt. KHÔNG mang gì về đáp án. Công tắc tắt ⇒ null. */
    live: viewLiveEm(st, sbd),
    // `dangRoi` (10/11): phòng CÒN ghi em «đang rời» ⇒ máy em đã về mà cờ này còn bật thì gửi lại `ve` (tin `ve` trước có thể mất trong kết nối chết).
    em: e ? { sbd: e.sbd, ten: e.ten, doi: d, vao: e.vao, luc: e.luc, kj: e.kj, dungSo: e.dungSo, roi: e.roi, dangRoi: !!st.roiNay?.includes(e.sbd), hang, soEm: xep.length } : null,
    doi: { so: st.ds.filter((x) => x.doi === d && x.vao).length, tong: st.ds.filter((x) => x.doi === d).length, kj: diemDoi(st, d) },
    /** Biến động kJ của CHÍNH em (5 mục mới nhất, `id` tăng dần) — máy em hiện thẻ nhỏ bay lên khi có `id` mới. */
    bienDongEm: (st.bienDong ?? []).filter((x) => x.sbd === sbd).slice(-5),
    luot: l ? {
      so: l.so, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, batDau: l.batDau, han: l.han, pha: l.pha,
      daGui: Object.keys(l.tra).length, coMat: st.ds.filter((x) => x.vao).length,
      emTra: l.tra[sbd] ?? null, goi,
      ...(l.pha === 'mo' ? { dung: l.dung, ketQua: l.ketQua?.[sbd] ?? null, soDung: Object.values(l.ketQua ?? {}).filter((k) => k.dung).length, qid: l.qid, giai: l.giai ?? null } : {}),
    } : null,
  }
}
/** `live` tuỳ chọn ở kiểu: phòng bản trước 10/11 không gửi. */
export type ViewEm = Omit<ReturnType<typeof viewEm>, 'live'> & { live?: ReturnType<typeof viewLiveEm> }

export function ketThuc(st: TrangThaiPhong, nay: number): void { liveTat(st, nay); st.ketThuc = true; st.roiNay = []; st.capNhat = nay }
