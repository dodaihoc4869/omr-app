/** MÀN "HÔM NAY" BẢN 2 của thầy — phần THUẦN + lớp nối máy chủ (đề bài `prompt-hom-nay-gv-v2.md`, bản vẽ `docs/ban-ve-hom-nay-v2-2109/`, chuẩn chữ `docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md`).
 *
 *  Nói thật: mọi con số hiện trên màn đến từ dữ liệu thật của máy chủ; chưa có lệnh ⇒ MỘT câu nói thật, KHÔNG giả số, KHÔNG giả "đã gửi". Không kết luận năng lực từ điểm. */
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import { gioDayDu } from './ngay-gio-24'
import type { DongTheoDoiBtvn } from './btvn-may-chu-moi'
import { nhomBtvn, type NhomBtvn } from './nhom-btvn'

// ─────────────────────────────── Ô TRA CỨU ───────────────────────────────

/** Bỏ dấu tiếng Việt + chữ thường ("Trần Thu Hà" → "tran thu ha"). */
export function boDau(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export interface EmTraCuu {
  sbd: string
  hoTen: string
  lop: string
}
export interface KetQuaTim extends EmTraCuu {
  diem: number
}

/** Tìm em trong danh sách lớp trên máy thầy: theo SBD (đầu/giữa) hoặc tên KHÔNG DẤU (mọi từ gõ đều phải có; từ đầu tên/tên gọi xếp trước). Tối đa `toiDa` gợi ý. Chuỗi rỗng ⇒ []. */
export function timEm(ds: EmTraCuu[], q: string, toiDa = 6): KetQuaTim[] {
  const k = boDau(q)
  if (!k) return []
  const tu = k.split(' ').filter(Boolean)
  const kq: KetQuaTim[] = []
  for (const e of ds) {
    const sbd = String(e.sbd ?? '').toLowerCase()
    const ten = boDau(e.hoTen)
    let diem = 0
    if (sbd === k) diem = 100
    else if (k.length >= 2 && /^\d+$/.test(k) && sbd.startsWith(k)) diem = 80
    else if (k.length >= 3 && /^\d+$/.test(k) && sbd.includes(k)) diem = 60
    else {
      const kho = `${ten} ${boDau(e.lop)} ${sbd}`
      if (!tu.every((t) => kho.includes(t))) continue
      const tenGoi = ten.split(' ').pop() ?? ''
      diem = 40
      if (ten.startsWith(k)) diem += 12
      else if (tenGoi.startsWith(tu[tu.length - 1])) diem += 8
      if (ten === k) diem += 20
    }
    kq.push({ sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, diem })
  }
  return kq.sort((a, b) => b.diem - a.diem || a.hoTen.localeCompare(b.hoTen, 'vi')).slice(0, toiDa)
}

// ─────────────────────────────── THỜI GIAN ───────────────────────────────

/** "còn 3 giờ 28 phút" / "còn 1 ngày 3 giờ" / "đã quá 20 giờ" — kèm mốc thật ở chỗ gọi ("Hạn nộp 23:59 · Thứ Hai 21/09/2026 (còn …)"). */
export function conLaiChu(hanIso: string, nayMs: number): string {
  const han = Date.parse(hanIso)
  if (!Number.isFinite(han)) return ''
  const chenh = han - nayMs
  const ngay = (ms: number) => Math.floor(ms / 86_400_000)
  const gio = (ms: number) => Math.floor((ms % 86_400_000) / 3_600_000)
  const phut = (ms: number) => Math.floor((ms % 3_600_000) / 60_000)
  const x = Math.abs(chenh)
  const doan = ngay(x) > 0 ? `${ngay(x)} ngày${gio(x) > 0 ? ` ${gio(x)} giờ` : ''}` : gio(x) > 0 ? `${gio(x)} giờ${phut(x) > 0 && chenh > 0 ? ` ${phut(x)} phút` : ''}` : `${Math.max(1, phut(x))} phút`
  return chenh > 0 ? `còn ${doan}` : `đã quá ${doan}`
}

/** "Hạn nộp 23:59 · Thứ Hai 21/09/2026 (còn 3 giờ 28 phút)". */
export function hanNopChu(hanIso: string, nayMs: number): string {
  const c = conLaiChu(hanIso, nayMs)
  return `Hạn nộp ${gioDayDu(hanIso)}${c ? ` (${c})` : ''}`
}

// ─────────────────────────────── VIỆC GẤP · CHƯA NỘP BÀI TẬP VỀ NHÀ ───────────────────────────────

export type MucChuaNop = 'chua_mo' | 'do' | 'gan_xong'

export interface EmChuaNop {
  sbd: string
  hoTen: string
  lop: string
  muc: MucChuaNop
  /** Trạng thái THẬT bằng chữ: "Chưa mở bài" · "Dở chặng 2 trong 7 chặng · đã xong 1 chặng". */
  chu: string
  /** 0..1 (chặng đã xong / tổng chặng); `null` khi chưa biết. */
  tienDo: number | null
  /** Mã bài (dòng btvn) của CHÍNH em này — bài giao theo nhiều ca có nhiều mã. */
  maBtvn: string
}

export interface BaiViecGap {
  /** Khoá ổn định: mã bài gốc của nhóm. */
  ma: string
  maDe: string
  han: string
  quaHan: boolean
  tong: number
  daNop: number
  caNhan: boolean
  chuaNop: EmChuaNop[]
}

const SO_CHUA_NOP_TOI_DA_NGAY = 14

/** Trạng thái thật của MỘT em chưa nộp. Bài nâng đỡ có tiến độ chặng; bài cũ chỉ biết "chưa nộp". */
export function trangThaiChuaNop(bai: Pick<DongTheoDoiBtvn, 'caNhan'>, e: { soCauCuaEm?: number | null; soChang?: number | null; loDaXong?: number | null }): { muc: MucChuaNop; chu: string; tienDo: number | null } {
  if (!bai.caNhan) return { muc: 'chua_mo', chu: 'Chưa nộp bài', tienDo: null }
  if (e.soCauCuaEm == null) return { muc: 'chua_mo', chu: 'Chưa mở bài', tienDo: 0 }
  const tong = e.soChang ?? 0
  const xong = e.loDaXong ?? 0
  if (tong <= 0) return { muc: 'do', chu: 'Đã mở bài · chưa nộp', tienDo: null }
  const td = Math.min(1, xong / tong)
  if (xong <= 0) return { muc: 'do', chu: `Đã mở bài · chưa xong chặng 1 trong ${tong} chặng`, tienDo: 0 }
  return { muc: td >= 0.7 ? 'gan_xong' : 'do', chu: `Dở chặng ${Math.min(xong + 1, tong)} trong ${tong} chặng · đã xong ${xong} chặng`, tienDo: td }
}

/** Các bài ĐANG CÒN em chưa nộp, xếp theo mức gấp: chưa quá hạn trước (hạn gần nhất lên đầu), rồi bài đã quá hạn (mới quá hạn trước). Trong bài: chưa mở → dở ít → dở nhiều → tên.
 *  Bỏ em đã thu hồi; bỏ bài quá hạn hơn 14 ngày (không còn là "việc gấp"). `lopCua` tra lớp từ danh sách lớp trên máy thầy. */
export function baiViecGap(ds: DongTheoDoiBtvn[], nayMs: number, lopCua: (sbd: string) => string = () => ''): BaiViecGap[] {
  const kq: BaiViecGap[] = []
  for (const t of nhomBtvn(ds) as NhomBtvn[]) {
    const han = Date.parse(t.hanNop)
    if (Number.isFinite(han) && nayMs - han > SO_CHUA_NOP_TOI_DA_NGAY * 86_400_000) continue
    const chua: EmChuaNop[] = []
    for (const e of (t.hocSinh ?? []) as NonNullable<DongTheoDoiBtvn['hocSinh']>) {
      if (e.nopLuc || e.thuHoi) continue
      const st = trangThaiChuaNop(t, e)
      chua.push({ sbd: e.sbd, hoTen: e.hoTen, lop: lopCua(e.sbd), ...st, maBtvn: t.maTheoSbd?.[e.sbd] ?? t.maBtvn })
    }
    if (chua.length === 0) continue
    chua.sort((a, b) => (a.tienDo ?? -1) - (b.tienDo ?? -1) || a.hoTen.localeCompare(b.hoTen, 'vi'))
    kq.push({ ma: t.maBtvn, maDe: t.maDe, han: t.hanNop, quaHan: t.quaHan || (Number.isFinite(han) && han <= nayMs), tong: t.tong, daNop: t.daNop, caNhan: t.caNhan === true, chuaNop: chua })
  }
  return kq.sort((a, b) => Number(a.quaHan) - Number(b.quaHan) || (a.quaHan ? Date.parse(b.han) - Date.parse(a.han) : Date.parse(a.han) - Date.parse(b.han)))
}

/** Tổng số em chưa nộp và số bài, đếm theo SBD (em có mặt ở nhiều bài chỉ đếm một lần). */
export function tongChuaNop(bai: BaiViecGap[]): { soEm: number; soBai: number } {
  return { soEm: new Set(bai.flatMap((b) => b.chuaNop.map((e) => e.sbd))).size, soBai: bai.length }
}

/** Lời cảnh báo MẶC ĐỊNH — tế nhị, đúng sự thật, không doạ, không so với bạn; thầy sửa được trước khi gửi. */
export function loiCanhBaoMacDinh(tenBai: string, hanIso: string): string {
  return `Thầy nhắc: em chưa nộp bài tập về nhà “${tenBai}” — hạn nộp ${gioDayDu(hanIso)}. Em vào làm tiếp nhé, thầy chờ bài của em.`
}

// ─────────────────────────────── MÁY CHỦ ───────────────────────────────

/** Bài tập về nhà + tiến độ từng em (lệnh thầy CHỈ ĐỌC sẵn có `/btvn/theo-doi`). Khác `theoDoiBtvn` cũ: KHÔNG nuốt lỗi — báo thật để màn nói "chưa đọc được" thay vì "không có ai chưa nộp". */
export async function layBtvnDangChay(): Promise<KetQuaLenh<DongTheoDoiBtvn[]>> {
  const r = await goiLenh('/btvn/theo-doi', { maCa: '' }, 'Máy chủ chưa có lệnh theo dõi bài tập về nhà.')
  if (!r.ok) return r
  return { ok: true, du: Array.isArray(r.du.ds) ? (r.du.ds as DongTheoDoiBtvn[]) : [] }
}

export interface KetQuaCanhBao {
  /** Số em đã được gửi cảnh báo (máy chủ nói). */
  daGui: number
  boQua: { sbd: string; lyDo: string }[]
  /** Giờ gửi (ISO) nếu máy chủ trả. */
  luc: string
}

/** GỬI CẢNH BÁO của thầy (lệnh GHI `POST /gv/canh-bao-nop-bai {maBtvn, dsSbd[], loiNhan?}`): hiện thẻ nhắc ở app học sinh VÀ thông báo cho phụ huynh. Trần một cảnh báo/em/bài/ngày ở máy chủ.
 *  Chưa có lệnh ⇒ lời thật "chưa gửi được gì"; quá hạn chờ ⇒ "CHƯA CHẮC đã gửi" (lệnh có thể đã tới) — KHÔNG bao giờ giả là đã gửi. */
export async function guiCanhBaoNopBai(maBtvn: string, dsSbd: string[], loiNhan: string): Promise<KetQuaLenh<KetQuaCanhBao>> {
  const r = await goiLenh(
    '/gv/canh-bao-nop-bai',
    { maBtvn, dsSbd, loiNhan },
    'Máy chủ chưa có lệnh Gửi cảnh báo — chưa gửi gì cho em và phụ huynh.',
    'Máy chủ trả lời chậm — CHƯA CHẮC đã gửi cảnh báo. Mở lại màn Hôm nay để xem trạng thái thật (đừng bấm gửi lại ngay).',
  )
  if (!r.ok) return r
  const g = r.du.daGui
  const boQua = Array.isArray(r.du.boQua) ? (r.du.boQua as Record<string, unknown>[]).map((x) => ({ sbd: String(x.sbd ?? ''), lyDo: String(x.lyDo ?? '') })) : []
  return { ok: true, du: { daGui: Array.isArray(g) ? g.length : Number(g) || 0, boQua, luc: typeof r.du.luc === 'string' ? r.du.luc : '' } }
}

// ─────────────────────────────── HÀNG CUỐI: CA KIỂM TRA · TRUY CẬP TRỰC TUYẾN ───────────────────────────────

export interface BangTinNgay {
  caHomNay: { ma: string; ten: string; trangThai: string; daNop: number; luot: number }[]
  /** `null` = máy chủ không trả số truy cập. */
  truyCap: { dangOnline: number; hocSinhOnline: number; phuHuynhOnline: number; luotHomNay: number } | null
}

/** Ca kiểm tra + truy cập trong ngày — nguồn: lệnh thầy sẵn có `/teacher-news` (CHỈ ĐỌC; app học sinh/phụ huynh ghi `app_presence`). Không có ⇒ lời thật. */
export async function layBangTinNgay(): Promise<KetQuaLenh<BangTinNgay>> {
  const r = await goiLenh('/teacher-news', {}, 'Máy chủ chưa có lệnh bảng tin trong ngày.')
  if (!r.ok) return r
  const exams = Array.isArray(r.du.exams) ? (r.du.exams as Record<string, unknown>[]) : []
  const visits = Array.isArray(r.du.visits) ? (r.du.visits as Record<string, unknown>[]) : null
  const v = (role: string) => visits?.find((x) => x.role === role)
  return {
    ok: true,
    du: {
      caHomNay: exams.map((c) => ({ ma: String(c.ma_ca ?? ''), ten: String(c.ten_ca ?? '') || String(c.ma_ca ?? ''), trangThai: String(c.trang_thai ?? ''), daNop: Number(c.da_nop) || 0, luot: Number(c.luot) || 0 })).filter((c) => c.ma),
      truyCap: visits
        ? {
            dangOnline: ['gv', 'hs', 'ph'].reduce((n, k) => n + (Number(v(k)?.online) || 0), 0),
            hocSinhOnline: Number(v('hs')?.online) || 0,
            phuHuynhOnline: Number(v('ph')?.online) || 0,
            luotHomNay: ['gv', 'hs', 'ph'].reduce((n, k) => n + (Number(v(k)?.visits) || 0), 0),
          }
        : null,
    },
  }
}

// ─────────────────────────────── EM CẦN THẦY GIÚP (chi tiết dạng) ───────────────────────────────

export type BacDang = 'biet' | 'hieu' | 'van_dung' | ''
export const TEN_BAC_DANG: Record<Exclude<BacDang, ''>, string> = { biet: 'Biết', hieu: 'Hiểu', van_dung: 'Vận dụng' }
export type XuHuong = 'giam' | 'tang' | 'giu' | ''
/** Nói SỰ VIỆC (không phán xét em): "đang giảm" / "đang lên" / "giữ nguyên". */
export const TEN_XU_HUONG: Record<Exclude<XuHuong, ''>, string> = { giam: 'đang giảm', tang: 'đang lên', giu: 'giữ nguyên' }

export interface DangCanGiup {
  ma: string
  ten: string
  sai: number | null
  gap: number | null
  bac: BacDang
  xuHuong: XuHuong
}
export interface EmCanGiup {
  sbd: string
  hoTen: string
  lop: string
  lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu' | ''
  ngayTre: number | null
  dang: DangCanGiup[]
}
export interface CanGiup {
  tong: number
  lop: string[]
  ds: EmCanGiup[]
}

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const chu = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Câu "vì sao em cần giúp" bằng SỐ, không kết luận năng lực. */
export function lyDoCanGiup(e: Pick<EmCanGiup, 'lyDo' | 'ngayTre'>): string {
  if (e.lyDo === 'tre_nhip') return e.ngayTre != null ? `Trễ nhịp ${e.ngayTre} ngày (chưa làm câu nào trong thời gian ấy)` : 'Trễ nhịp'
  if (e.lyDo === 'tut_bac') return 'Tụt bậc ở một dạng trong 3 ngày'
  if (e.lyDo === 'dang_yeu') return 'Sai nhiều ở một dạng trong 7 ngày'
  return 'Cần thầy để ý'
}

export function docCanGiup(j: Record<string, unknown>): CanGiup {
  const ds = Array.isArray(j.ds) ? (j.ds as Record<string, unknown>[]) : []
  const em: EmCanGiup[] = []
  for (const x of ds) {
    if (!x || typeof x !== 'object' || !chu(x.sbd)) continue
    const lyDo = x.lyDo === 'tre_nhip' || x.lyDo === 'tut_bac' || x.lyDo === 'dang_yeu' ? x.lyDo : ''
    const dang = (Array.isArray(x.dang) ? (x.dang as Record<string, unknown>[]) : [])
      .filter((d) => d && (chu(d.ten) || chu(d.ma)))
      .map((d): DangCanGiup => ({
        ma: chu(d.ma),
        ten: chu(d.ten) || chu(d.ma),
        sai: so(d.sai),
        gap: so(d.gap),
        bac: d.bac === 'biet' || d.bac === 'hieu' || d.bac === 'van_dung' ? d.bac : '',
        xuHuong: d.xuHuong === 'giam' || d.xuHuong === 'tang' || d.xuHuong === 'giu' ? d.xuHuong : '',
      }))
    em.push({ sbd: chu(x.sbd), hoTen: chu(x.hoTen), lop: chu(x.lop), lyDo, ngayTre: so(x.ngayTre), dang })
  }
  return { tong: so(j.tong) ?? em.length, lop: Array.isArray(j.lop) ? (j.lop as unknown[]).map(String) : [], ds: em }
}

/** Danh sách em cần thầy giúp, kèm chi tiết dạng (lệnh thầy CHỈ ĐỌC `/gv/can-giup {lop?}`, Code 3). Chưa có lệnh ⇒ lời thật; màn rơi về danh sách rút gọn của `/ke-hoach/hom-nay-thay`. */
export async function layCanGiup(lop?: string): Promise<KetQuaLenh<CanGiup>> {
  const r = await goiLenh('/gv/can-giup', lop ? { lop } : {}, 'Máy chủ chưa có lệnh chi tiết "Em cần thầy giúp" — đang hiện danh sách rút gọn.')
  if (!r.ok) return r
  // Trả lời thiếu hẳn `ds` ≠ "không có em nào": không được nói "hôm nay không ai cần giúp" khi thật ra chưa đọc được.
  if (!Array.isArray(r.du.ds)) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả danh sách em cần giúp không đúng dạng — đang hiện danh sách rút gọn.' }
  return { ok: true, du: docCanGiup(r.du) }
}

// ─────────────────────────────── VINH DANH HÔM NAY ───────────────────────────────

export interface NguoiVinhDanh {
  sbd: string
  hoTen: string
  lop: string
}
export interface VinhDanhNgay {
  ngay: string
  chamNhat: (NguoiVinhDanh & { exp: number }) | null
  tienBoNhat: (NguoiVinhDanh & { soDangLenBac: number | null; soCauDungLai: number | null }) | null
  benBiNhat: (NguoiVinhDanh & { chuoiNgay: number }) | null
  diemCao: (NguoiVinhDanh & { diem: number; tenCa: string }) | null
}

function docNguoi(v: unknown): NguoiVinhDanh | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  return chu(o.hoTen) || chu(o.sbd) ? { sbd: chu(o.sbd), hoTen: chu(o.hoTen) || `SBD ${chu(o.sbd)}`, lop: chu(o.lop) } : null
}

export function docVinhDanh(j: Record<string, unknown>): VinhDanhNgay {
  const g = (k: string) => (j[k] && typeof j[k] === 'object' ? (j[k] as Record<string, unknown>) : null)
  const a = docNguoi(g('chamNhat')), b = docNguoi(g('tienBoNhat')), c = docNguoi(g('benBiNhat')), d = docNguoi(g('diemCao'))
  return {
    ngay: chu(j.ngay),
    chamNhat: a && so(g('chamNhat')?.exp) != null ? { ...a, exp: so(g('chamNhat')!.exp)! } : null,
    // Bục Tiến bộ cần ÍT NHẤT một con số máy chủ tính; số nào thiếu thì để null (dòng phụ bỏ phần đó), không điền 0.
    tienBoNhat: b && (so(g('tienBoNhat')!.soDangLenBac) != null || so(g('tienBoNhat')!.soCauDungLai) != null) ? { ...b, soDangLenBac: so(g('tienBoNhat')!.soDangLenBac), soCauDungLai: so(g('tienBoNhat')!.soCauDungLai) } : null,
    benBiNhat: c && so(g('benBiNhat')?.chuoiNgay) != null ? { ...c, chuoiNgay: so(g('benBiNhat')!.chuoiNgay)! } : null,
    diemCao: d && so(g('diemCao')?.diem) != null ? { ...d, diem: so(g('diemCao')!.diem)!, tenCa: chu(g('diemCao')!.tenCa) } : null,
  }
}

/** Vinh danh theo ngày (lệnh thầy CHỈ ĐỌC `/gv/vinh-danh-ngay`, Code 3). Không có số ⇒ ô thu gọn một dòng, KHÔNG bịa. */
export async function layVinhDanhNgay(): Promise<KetQuaLenh<VinhDanhNgay>> {
  const r = await goiLenh('/gv/vinh-danh-ngay', {}, 'Máy chủ chưa có lệnh vinh danh theo ngày.')
  return r.ok ? { ok: true, du: docVinhDanh(r.du) } : r
}
