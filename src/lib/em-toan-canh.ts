// LỚP NỐI "TOÀN CẢNH MỘT EM" của app thầy (Hôm nay v2, bước 5; thầy lệnh 21/09). Chỉ tệp này biết hình dạng lệnh máy chủ `POST /gv/em-toan-canh` (hợp đồng
// `docs/hop-dong-hom-nay-v2-2109.md` mục 8, Code 3). Trường có `?` thiếu ⇒ màn ẨN phần đó, KHÔNG bịa. Máy chủ chưa có lệnh ⇒ `KetQuaLenh` báo thật.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

export type LoaiSuKien = 'ca' | 'btvn' | 'on_lai' | 'bai_rieng' | 'len_bang' | 'game' | 'exp' | 'bo_nao' | 'canh_bao' | 'mo_app'
/** Thứ tự bộ lọc (chữ theo docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md: "Ca kiểm tra", "Bài tập về nhà", "Ôn lại", "Bộ não A.I", "Gửi cảnh báo"). */
export const LOAI_SU_KIEN: readonly LoaiSuKien[] = ['ca', 'btvn', 'on_lai', 'bai_rieng', 'len_bang', 'game', 'exp', 'bo_nao', 'canh_bao', 'mo_app']
export const TEN_LOAI: Record<LoaiSuKien, string> = {
  ca: 'Ca kiểm tra',
  btvn: 'Bài tập về nhà',
  on_lai: 'Ôn lại',
  bai_rieng: 'Bài riêng',
  len_bang: 'Gọi lên bảng',
  game: 'Game',
  exp: 'EXP',
  bo_nao: 'Bộ não A.I',
  canh_bao: 'Cảnh báo của thầy',
  mo_app: 'Mở app',
}

export type MucChip = 'tot' | 'sai' | 'trung'
export interface ChipSuKien {
  chu: string
  muc: MucChip
}
export interface SuKienEm {
  luc: string
  loai: LoaiSuKien
  tieuDe: string
  /** Câu mô tả 1–2 dòng do MÁY CHỦ dựng từ số liệu thật (`chiTiet.mota`, hoặc `chiTiet` là chuỗi). Thiếu ⇒ ''. */
  mota: string
  maCa: string
  maBtvn: string
  chips: ChipSuKien[]
}
export interface DangCuaEm {
  ma: string
  ten: string
  bac: 'biet' | 'hieu' | 'van_dung' | ''
  gap: number | null
  sai: number | null
  khacPhuc: number | null
  xuHuong: 'tang' | 'giam' | 'giu' | ''
  cauSaiGanNhat: { stt: string; emChon: string; dapAn: string } | null
}
export interface HoSoToanCanh {
  sbd: string
  hoTen: string
  lop: string
  namSinh: string
  thanThu: { ten: string; cap: number | null } | null
  chuoiNgay: number | null
  hoatDongCuoi: { luc: string; viec: string } | null
  phuHuynhXemCuoi: string
  diemCaGanNhat: { diem: number; tenCa: string; maCa: string; luc: string } | null
  expHomNay: number | null
  expTong: number | null
}
export interface NhipNgay {
  ngay: string
  muc: 0 | 1 | 2 | 3
}
export interface ToanCanh {
  em: HoSoToanCanh
  dong: SuKienEm[]
  conNua: string
  dang: DangCuaEm[]
  nhip30: NhipNgay[]
}

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const chu = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '')
const doiTuong = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null)
const laLoai = (v: unknown): v is LoaiSuKien => typeof v === 'string' && (LOAI_SU_KIEN as readonly string[]).includes(v)

function docSuKien(x: unknown): SuKienEm | null {
  const o = doiTuong(x)
  if (!o || !laLoai(o.loai) || !chu(o.luc) || !chu(o.tieuDe)) return null
  const ct = doiTuong(o.chiTiet)
  const chips: ChipSuKien[] = (Array.isArray(o.chips) ? o.chips : [])
    .map((c) => doiTuong(c))
    .filter((c): c is Record<string, unknown> => !!c && !!chu(c.chu))
    .map((c) => ({ chu: chu(c.chu), muc: c.muc === 'tot' || c.muc === 'sai' ? c.muc : 'trung' }))
  return {
    luc: chu(o.luc),
    loai: o.loai,
    tieuDe: chu(o.tieuDe),
    mota: typeof o.chiTiet === 'string' ? o.chiTiet : chu(ct?.mota),
    maCa: chu(ct?.maCa),
    maBtvn: chu(ct?.maBtvn),
    chips,
  }
}

function docDang(x: unknown): DangCuaEm | null {
  const o = doiTuong(x)
  if (!o || !(chu(o.ten) || chu(o.ma))) return null
  const c = doiTuong(o.cauSaiGanNhat)
  return {
    ma: chu(o.ma),
    ten: chu(o.ten) || chu(o.ma),
    bac: o.bac === 'biet' || o.bac === 'hieu' || o.bac === 'van_dung' ? o.bac : '',
    gap: so(o.gap),
    sai: so(o.sai),
    khacPhuc: so(o.khacPhuc),
    xuHuong: o.xuHuong === 'tang' || o.xuHuong === 'giam' || o.xuHuong === 'giu' ? o.xuHuong : '',
    cauSaiGanNhat: c && (chu(c.stt) || chu(c.emChon)) ? { stt: chu(c.stt), emChon: chu(c.emChon), dapAn: chu(c.dapAn) } : null,
  }
}

/** Đọc CÓ CHỐNG SAI KIỂU: thiếu `em.sbd` ⇒ null (không dựng trang cho "không ai"). */
export function docToanCanh(j: Record<string, unknown>): ToanCanh | null {
  const e = doiTuong(j.em)
  if (!e || !chu(e.sbd)) return null
  const tt = doiTuong(e.thanThu)
  const hd = doiTuong(e.hoatDongCuoi)
  // `diemCaGanNhat` nhận cả số trần lẫn đối tượng { diem, tenCa?, maCa?, luc? } (Code 3 chưa chốt hẳn dạng nào).
  const dc = doiTuong(e.diemCaGanNhat)
  const diemTran = so(e.diemCaGanNhat)
  const diem = dc ? so(dc.diem) : diemTran
  return {
    em: {
      sbd: chu(e.sbd),
      hoTen: chu(e.hoTen) || `SBD ${chu(e.sbd)}`,
      lop: chu(e.lop),
      namSinh: chu(e.namSinh),
      thanThu: tt && chu(tt.ten) ? { ten: chu(tt.ten), cap: so(tt.cap) } : null,
      chuoiNgay: so(e.chuoiNgay),
      hoatDongCuoi: hd && chu(hd.luc) ? { luc: chu(hd.luc), viec: chu(hd.viec) } : null,
      phuHuynhXemCuoi: chu(e.phuHuynhXemCuoi),
      diemCaGanNhat: diem != null ? { diem, tenCa: chu(dc?.tenCa), maCa: chu(dc?.maCa), luc: chu(dc?.luc) } : null,
      expHomNay: so(e.expHomNay),
      expTong: so(e.expTong),
    },
    dong: (Array.isArray(j.dong) ? j.dong : []).map(docSuKien).filter((x): x is SuKienEm => !!x),
    conNua: chu(j.conNua),
    dang: (Array.isArray(j.dang) ? j.dang : []).map(docDang).filter((x): x is DangCuaEm => !!x),
    nhip30: (Array.isArray(j.nhip30) ? j.nhip30 : [])
      .map((n) => doiTuong(n))
      .filter((n): n is Record<string, unknown> => !!n && /^\d{4}-\d{2}-\d{2}$/.test(chu(n.ngay)))
      .map((n) => ({ ngay: chu(n.ngay), muc: (n.muc === 1 || n.muc === 2 || n.muc === 3 ? n.muc : 0) as 0 | 1 | 2 | 3 })),
  }
}

/** Toàn cảnh một em — lệnh thầy CHỈ ĐỌC. `truoc` (ISO) = lấy việc CŨ HƠN mốc ấy; `loai` = lọc loại. Chưa có lệnh ⇒ lời thật. */
export async function layToanCanh(sbd: string, tuyChon: { truoc?: string; loai?: LoaiSuKien[] } = {}): Promise<KetQuaLenh<ToanCanh>> {
  const body: Record<string, unknown> = { sbd }
  if (tuyChon.truoc) body.truoc = tuyChon.truoc
  if (tuyChon.loai?.length) body.loai = tuyChon.loai
  const r = await goiLenh('/gv/em-toan-canh', body, 'Máy chủ chưa có lệnh Toàn cảnh một em — chưa có dòng thời gian của em.')
  if (!r.ok) return r
  const tc = docToanCanh(r.du)
  return tc ? { ok: true, du: tc } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả toàn cảnh của em không đúng dạng.' }
}

// ─────────────────────────────── CHỮ / NGÀY GIỜ (giờ Việt Nam, 24 giờ) ───────────────────────────────
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const NGAY_VN = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
const GIO_VN = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** 'YYYY-MM-DD' của một mốc, theo giờ Việt Nam ('' nếu mốc hỏng). */
export const ngayVN = (iso: string | number): string => {
  const ms = typeof iso === 'number' ? iso : Date.parse(iso)
  return Number.isFinite(ms) ? NGAY_VN.format(ms) : ''
}
export const gioPhutVN = (moc: string | number): string => {
  const ms = typeof moc === 'number' ? moc : Date.parse(moc)
  return Number.isFinite(ms) ? GIO_VN.format(ms) : ''
}
/** 'YYYY-MM-DD' → "Thứ Hai 21/09/2026" (thứ tính theo lịch, không lệ thuộc múi giờ máy). */
export function ngayThuChu(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  if (!m) return ''
  const thu = THU[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()]
  return `${thu} ${m[3]}/${m[2]}/${m[1]}`
}
const truNgay = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10)

/** Tiêu đề nhóm ngày của dòng thời gian: "Hôm nay · Thứ Hai 21/09/2026" · "Hôm qua · Chủ nhật 20/09/2026" · "Thứ Ba 15/09/2026". */
export function nhanNgay(ngay: string, nayMs: number): string {
  const hn = ngayVN(nayMs)
  const chuNgay = ngayThuChu(ngay)
  if (ngay === hn) return `Hôm nay · ${chuNgay}`
  if (ngay === truNgay(hn, 1)) return `Hôm qua · ${chuNgay}`
  return chuNgay
}

/** "hôm nay 20:14" · "hôm qua 21:32" · "15/09/2026 08:05" — dùng cho "hoạt động cuối", "phụ huynh xem app". */
export function moiXemChu(iso: string, nayMs: number): string {
  const ngay = ngayVN(iso)
  if (!ngay) return ''
  const gio = gioPhutVN(iso)
  const hn = ngayVN(nayMs)
  if (ngay === hn) return `hôm nay ${gio}`
  if (ngay === truNgay(hn, 1)) return `hôm qua ${gio}`
  const [y, m, d] = ngay.split('-')
  return `${d}/${m}/${y} ${gio}`
}

export interface NhomNgay {
  ngay: string
  nhan: string
  viec: SuKienEm[]
}
/** Gộp dòng thời gian theo NGÀY VN, giữ thứ tự máy chủ trả (mới nhất trước). */
export function nhomTheoNgay(dong: SuKienEm[], nayMs: number): NhomNgay[] {
  const kq: NhomNgay[] = []
  for (const v of dong) {
    const ngay = ngayVN(v.luc)
    const cuoi = kq[kq.length - 1]
    if (cuoi && cuoi.ngay === ngay) cuoi.viec.push(v)
    else kq.push({ ngay, nhan: ngay ? nhanNgay(ngay, nayMs) : 'Không rõ ngày', viec: [v] })
  }
  return kq
}

/** Lưới nhịp học kiểu lịch: mỗi HÀNG một tuần, thứ Hai → Chủ nhật; ô đầu/cuối ngoài phạm vi = null. */
export function luoiNhip(nhip: NhipNgay[]): (NhipNgay | null)[][] {
  if (nhip.length === 0) return []
  const dau = new Date(`${nhip[0].ngay}T00:00:00Z`).getUTCDay() // 0 = Chủ nhật
  const lech = (dau + 6) % 7 // thứ Hai = 0
  const o: (NhipNgay | null)[] = [...Array<null>(lech).fill(null), ...nhip]
  while (o.length % 7 !== 0) o.push(null)
  const hang: (NhipNgay | null)[][] = []
  for (let i = 0; i < o.length; i += 7) hang.push(o.slice(i, i + 7))
  return hang
}
/** Số ngày có học + chuỗi liền dài nhất TRONG các ngày đã trả (không suy ra ngoài khoảng ấy). */
export function tomTatNhip(nhip: NhipNgay[]): { ngayHoc: number; tong: number; chuoiDaiNhat: number } {
  let dai = 0
  let hienTai = 0
  let hoc = 0
  for (const n of nhip) {
    if (n.muc > 0) {
      hoc++
      hienTai++
      dai = Math.max(dai, hienTai)
    } else hienTai = 0
  }
  return { ngayHoc: hoc, tong: nhip.length, chuoiDaiNhat: dai }
}
