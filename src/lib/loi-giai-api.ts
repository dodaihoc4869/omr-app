// LỜI GIẢI TỪNG BƯỚC — máy khách (máy chủ: server/src/loi-giai.ts; lõi: src/lib/loi-giai-kiem.ts).
// Học sinh: token lấy từ phiên cổng học sinh đã lưu (`omr_student_portal_auth`) — không có phiên thì nút không hiện.
// Lệnh của THẦY (duyệt lời giải) ở `loi-giai-gv-api.ts` — tách 13/10 (luật tốc độ): máy học sinh không tải phần ấy lúc mở app.
import { layDiaChiMayChu } from './dia-chi-may-chu'

/** Hồ sơ khuôn 1.2 (dữ liệu thuần do máy soạn viết, đã qua bộ kiểm máy chủ) — khung tự vẽ, app không đọc sâu. */
export type HoSoLoiGiai = Record<string, unknown> & { qid: string; bam: string; dang: 'tn' | 'ds' | 'tln'; bo?: string; ten: string; co?: { loai: 'dapAn' | 'hienThi' | 'loiDe'; ghi: string }[] }
/** Câu để khung vẽ: đề + chữ từng ý / phương án, máy chủ đã thoát HTML. */
export interface CauChoKhung { qid: string; so: string; nguon: string; chuong: string; de: string; y: Record<string, string> }

export function docTokenHs(): string {
  try {
    const o = JSON.parse(localStorage.getItem('omr_student_portal_auth') || 'null') as { token?: unknown } | null
    return typeof o?.token === 'string' ? o.token : ''
  } catch {
    return ''
  }
}

export async function goiHs(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const dk = new AbortController()
  const t = setTimeout(() => dk.abort(), 15000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const r = await fetch(`${url}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: dk.signal })
    return (await r.json()) as Record<string, unknown>
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// Gom các câu hỏi "có lời giải không" của cùng một lượt vẽ thành MỘT lệnh (báo cáo có thể có vài chục câu cần chữa).
let hangCho: { qid: string; tra: (co: boolean) => void }[] = []
let henGio: ReturnType<typeof setTimeout> | null = null
const daBiet = new Map<string, boolean>()

export function coLoiGiai(qid: string): Promise<boolean> {
  const token = docTokenHs()
  if (!token || !qid) return Promise.resolve(false)
  const biet = daBiet.get(qid)
  if (biet !== undefined) return Promise.resolve(biet)
  return new Promise((tra) => {
    hangCho.push({ qid, tra })
    if (henGio) return
    henGio = setTimeout(async () => {
      const lo = hangCho
      hangCho = []
      henGio = null
      const qids = [...new Set(lo.map((x) => x.qid))].slice(0, 80)
      const j = await goiHs('/hs/loi-giai/co', { token, qids })
      const co = new Set(Array.isArray(j?.qids) ? (j.qids as string[]) : [])
      if (j?.ok === true) for (const q of qids) daBiet.set(q, co.has(q))
      for (const x of lo) x.tra(co.has(x.qid))
    }, 30)
  })
}

// ---------------------------------------------------------------- nút "Hỏi thầy" (mọi câu luyện tập, trừ lúc kiểm tra)

/** Lời giải chữ của kho — hiện khi câu chưa có hồ sơ từng bước (máy chủ đã đẩy câu lên đầu hàng soạn). */
export interface LoiGiaiChu { dapAn: string; chot: string; tung: { id: string; dung: boolean; viSao: string }[]; buoc: string[]; ketQua: string }
/** Vòng học v2 (thang tự gỡ, bậc 2): chữ từng bước + câu kiểm (KHÔNG đáp án — máy chủ chấm) + lời thầy gỡ. Bước đánh số từ 0. */
export interface KiemKhung {
  buoc: string[]
  cauKiem: { buoc: number; kieu: 'so' | 'chon'; hoi: string; lua_chon?: string[] }[]
  loiGo: { buoc: number; noiDung: string }[]
}
/** `emVaCau` (thầy 21/10): dữ liệu THÔ của thẻ «Em và câu này» — chỉ có khi máy em xin (mở hộp Hỏi Thầy); hộp tự kiểm khuôn (`docEmVaCau`). */
type EmKem = { emVaCau?: unknown }
export type KetQuaHoiThay =
  | ({ ok: true; cau: CauChoKhung; hoSo: HoSoLoiGiai; loiGiaiChu?: undefined; kiem?: KiemKhung; hoiThem?: boolean } & EmKem)
  | ({ ok: true; cau: CauChoKhung; hoSo?: undefined; loiGiaiChu: LoiGiaiChu; hoiThem?: boolean } & EmKem)
  /** Em ĐANG LÀM câu (chưa nộp): chỉ đề cho hộp hỏi Thầy — KHÔNG đáp án, KHÔNG lời giải (thầy 13/10). */
  | ({ ok: true; chiHoi: true; cau: CauChoKhung; hoSo?: undefined; loiGiaiChu?: undefined; hoiThem?: boolean } & EmKem)
  | { ok: false; loi: string; khoa?: 'dang_kiem_tra' | 'ca_chua_cong_bo' }

/** `nguon`: nơi em bấm (on_lai, luyen_de, khac_phuc, btvn, gia_dinh, game, dao, doan, vo_dai, bi_a…) — chỉ để thầy xem thống kê. */
/** Em đang làm câu mà phần hỏi Thầy chưa bật cho em ⇒ lời nhắc (không mở lời giải trước khi em làm xong). */
export const CHU_LAM_XONG = 'Em làm xong câu này rồi bấm Hỏi thầy để xem lời giải nhé.'

// Lệnh chỉ dùng sau khi bấm: nạp cùng hộp Hỏi Thầy, không mang phần mạng vào gói mở app.
const napLenh = () => import('./hoi-them-thay-api')
const loiMang = () => ({ ok: false as const, loi: 'Chưa nối được máy chủ. Em thử lại sau.' })
export function hoiThay(...args: [qid: string, nguon: string, chiHoi?: boolean, luotId?: string, emVaCau?: boolean]): Promise<KetQuaHoiThay> {
  return napLenh().then((m) => m.hoiThay(...args)).catch(loiMang)
}

// ---------------------------------------------------------------- hỏi thêm Thầy (AI theo lời giải của Thầy, server/src/hoi-tro-ly.ts)

export type KetQuaHoiThem =
  // `cauTruc`: câu trả lời có cấu trúc (ý chính · bước · bảng · ghi nhớ · hỏi tiếp) — khung hỏi thêm kiểm khuôn (TraLoiThay.docCauTruc).
  | { ok: true; traLoi: string; cauTruc?: unknown; conLai: number; ngoaiPhamVi: boolean }
  | { ok: false; loi: string; ma: string; conLai?: number }

/** Em nhắn một câu hỏi về câu đang mở lời giải. Chờ tối đa 45 giây (Thầy suy nghĩ rồi mới trả lời). */
export const hoiThemThay = (...a: Parameters<typeof import('./hoi-them-thay-api').hoiThemThay>): Promise<KetQuaHoiThem> =>
  napLenh().then(m => m.hoiThemThay(...a)).catch(() => ({ ok: false, ma: 'mang', loi: 'Chưa nối được máy chủ. Em thử lại sau.' }))

/** Một thao tác em làm trong khung lời giải (GĐ1 v2): chọn Đ/S một ý, xin gợi ý, gắn chìa khoá, câu tương tự, trả lời số, chốt. */
export interface SuKienKhung { k: string; y?: string; d?: boolean; m?: number; t: number }

/** GĐ1 v2 (02/10): đóng khung lời giải ⇒ gửi máy chủ em đã đọc bao lâu, làm những gì. Không chờ, không báo lỗi cho em —
 *  mất một lần ghi chỉ thiếu dữ liệu, không ảnh hưởng em. `keepalive` để vẫn tới khi em đóng trang ngay sau đó. */
export function baoDocLoiGiai(qid: string, nguon: string, giay: number, suKien: SuKienKhung[]): void {
  const token = docTokenHs()
  if (!token || !qid) return
  void layDiaChiMayChu().then((url) => {
    if (!url) return
    return fetch(`${url}/hs/doc-loi-giai`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ token, qid, nguon, giay, suKien: suKien.slice(0, 200) }),
    })
  }).catch(() => undefined)
}

// ---------------------------------------------------------------- thang tự gỡ (Vòng học v2 GĐ2 — máy chủ: server/src/thang-tu-go.ts)

export type KetQuaCauKiem = { ok: true; dung: boolean; dapAn?: string; nhanNen?: string; tenNen?: string } | { ok: false; loi: string }

/** Câu kiểm một bước: máy chủ chấm (đáp án không có ở máy em). */
export const guiCauKiem = (...a: Parameters<typeof import('./hoi-them-thay-api').guiCauKiem>): ReturnType<typeof import('./hoi-them-thay-api').guiCauKiem> => napLenh().then((m) => m.guiCauKiem(...a)).catch(loiMang)

export interface MucCong { ma: 'tu_lam' | 'doc_het' | 'lam_lai' | 'chi_buoc' | 'khong_bua'; dat: boolean; viec: string }
export interface ThangGo { bac: 1 | 2 | 3 | 4 | 5; cong: MucCong[]; coTheGui: boolean; soBuoc: number; buocVuong?: number; nhanNenVuong?: string; tenNenVuong?: string }

/** Em đang ở bậc nào của thang tự gỡ. `dang`: thao tác của lần đọc đang mở (máy chủ chỉ tính, không ghi). null = lỗi / câu không có thang. */
export const thangGo = (...a: Parameters<typeof import('./hoi-them-thay-api').thangGo>): ReturnType<typeof import('./hoi-them-thay-api').thangGo> => napLenh().then((m) => m.thangGo(...a)).catch(() => null)

export interface CauNen { id: string; muc: number; kieu: 'so' | 'tn'; de: string; pa?: Record<string, string> }
export const luyenNen = (...a: Parameters<typeof import('./hoi-them-thay-api').luyenNen>): ReturnType<typeof import('./hoi-them-thay-api').luyenNen> => napLenh().then((m) => m.luyenNen(...a)).catch(loiMang)
export type KetQuaNopNen = { ok: true; dung: boolean; dapAn: string; giai: string[]; meo: string } | { ok: false; loi: string }
export const nopLuyenNen = (...a: Parameters<typeof import('./hoi-them-thay-api').nopLuyenNen>): ReturnType<typeof import('./hoi-them-thay-api').nopLuyenNen> => napLenh().then((m) => m.nopLuyenNen(...a)).catch(loiMang)

export const guiThay = (...a: Parameters<typeof import('./hoi-them-thay-api').guiThay>): ReturnType<typeof import('./hoi-them-thay-api').guiThay> => napLenh().then((m) => m.guiThay(...a)).catch(loiMang)
