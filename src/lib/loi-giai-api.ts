// LỜI GIẢI TỪNG BƯỚC — máy khách (máy chủ: server/src/loi-giai.ts; lõi: src/lib/loi-giai-kiem.ts).
// Học sinh: token lấy từ phiên cổng học sinh đã lưu (`omr_student_portal_auth`) — không có phiên thì nút không hiện.
// Thầy: mã bí mật như mọi lệnh của thầy (`x-ma-bi-mat`).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

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

async function goiHs(duong: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
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

export type KetQuaLoiGiai = { ok: true; hoSo: HoSoLoiGiai; cau: CauChoKhung } | { ok: false; loi: string }

export async function taiLoiGiai(qid: string): Promise<KetQuaLoiGiai> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để mở lời giải.' }
  const j = await goiHs('/hs/loi-giai', { token, qid })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa mở được lời giải.') }
  if (j.coLoiGiai !== true) return { ok: false, loi: 'Câu này chưa có lời giải từng bước.' }
  return { ok: true, hoSo: j.hoSo as HoSoLoiGiai, cau: j.cau as CauChoKhung }
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
export type KetQuaHoiThay =
  | { ok: true; cau: CauChoKhung; hoSo: HoSoLoiGiai; loiGiaiChu?: undefined; kiem?: KiemKhung }
  | { ok: true; cau: CauChoKhung; hoSo?: undefined; loiGiaiChu: LoiGiaiChu }
  | { ok: false; loi: string; khoa?: 'dang_kiem_tra' | 'ca_chua_cong_bo' }

/** `nguon`: nơi em bấm (on_lai, luyen_de, khac_phuc, btvn, gia_dinh, game, dao, doan, vo_dai, bi_a…) — chỉ để thầy xem thống kê. */
export async function hoiThay(qid: string, nguon: string): Promise<KetQuaHoiThay> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để hỏi thầy.' }
  const j = await goiHs('/hs/hoi-thay', { token, qid, nguon })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa mở được lời giải.'), khoa: j.khoa as 'dang_kiem_tra' | 'ca_chua_cong_bo' | undefined }
  if (j.coLoiGiai === true) return { ok: true, cau: j.cau as CauChoKhung, hoSo: j.hoSo as HoSoLoiGiai, ...(j.kiem ? { kiem: j.kiem as KiemKhung } : {}) }
  return { ok: true, cau: j.cau as CauChoKhung, loiGiaiChu: j.loiGiaiChu as LoiGiaiChu }
}

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
export async function guiCauKiem(qid: string, buoc: number, traLoi: string, giay: number): Promise<KetQuaCauKiem> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để trả lời.' }
  const j = await goiHs('/hs/cau-kiem', { token, qid, buoc, traLoi, giay })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa kiểm được câu trả lời.') }
  return { ok: true, dung: j.dung === true, ...(typeof j.dapAn === 'string' ? { dapAn: j.dapAn } : {}), ...(typeof j.nhanNen === 'string' ? { nhanNen: j.nhanNen, tenNen: String(j.tenNen ?? '') } : {}) }
}

export interface MucCong { ma: 'tu_lam' | 'doc_het' | 'lam_lai' | 'chi_buoc' | 'khong_bua'; dat: boolean; viec: string }
export interface ThangGo { bac: 1 | 2 | 3 | 4 | 5; cong: MucCong[]; coTheGui: boolean; soBuoc: number; buocVuong?: number; nhanNenVuong?: string; tenNenVuong?: string }

/** Em đang ở bậc nào của thang tự gỡ. `dang`: thao tác của lần đọc đang mở (máy chủ chỉ tính, không ghi). null = lỗi / câu không có thang. */
export async function thangGo(qid: string, dang?: { giay: number; suKien: SuKienKhung[] }): Promise<ThangGo | null> {
  const token = docTokenHs()
  if (!token) return null
  const j = await goiHs('/hs/thang-go', { token, qid, ...(dang ? { dang: { giay: dang.giay, suKien: dang.suKien.slice(0, 200) } } : {}) })
  if (!j || j.ok !== true || j.coThang !== true) return null
  return j as unknown as ThangGo
}

export interface CauNen { id: string; muc: number; kieu: 'so' | 'tn'; de: string; pa?: Record<string, string> }
export async function luyenNen(nhan: string): Promise<{ ok: true; ten: string; cau: CauNen[] } | { ok: false; loi: string }> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để luyện.' }
  const j = await goiHs('/hs/luyen-nen', { token, nhan })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa mở được bài luyện.') }
  return { ok: true, ten: String(j.ten ?? ''), cau: Array.isArray(j.cau) ? (j.cau as CauNen[]) : [] }
}
export type KetQuaNopNen = { ok: true; dung: boolean; dapAn: string; giai: string[]; meo: string } | { ok: false; loi: string }
export async function nopLuyenNen(id: string, traLoi: string, qid: string): Promise<KetQuaNopNen> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để nộp.' }
  const j = await goiHs('/hs/luyen-nen/nop', { token, id, traLoi, qid })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok !== true) return { ok: false, loi: String(j.error ?? 'Chưa nộp được.') }
  return { ok: true, dung: j.dung === true, dapAn: String(j.dapAn ?? ''), giai: Array.isArray(j.giai) ? (j.giai as unknown[]).map(String) : [], meo: String(j.meo ?? '') }
}

export async function guiThay(qid: string, buoc: number, viet: string): Promise<{ ok: true } | { ok: false; loi: string; cong?: MucCong[] }> {
  const token = docTokenHs()
  if (!token) return { ok: false, loi: 'Em đăng nhập lại để gửi.' }
  const j = await goiHs('/hs/gui-thay', { token, qid, buoc, viet })
  if (!j) return { ok: false, loi: 'Chưa nối được máy chủ. Em thử lại sau.' }
  if (j.ok === true) return { ok: true }
  const cong = Array.isArray(j.cong) ? (j.cong as MucCong[]) : undefined
  return { ok: false, loi: String(j.error ?? cong?.find((c) => !c.dat)?.viec ?? 'Chưa gửi được.'), ...(cong ? { cong } : {}) }
}

// ---------------------------------------------------------------- thầy

async function goiThay(duong: string, body: Record<string, unknown>): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
    if (!ch.URL) return { ok: false, error: 'Chưa cài địa chỉ máy chủ.' }
    const dk = new AbortController()
    const t = setTimeout(() => dk.abort(), 20000)
    const r = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' }, body: JSON.stringify(body), signal: dk.signal })
    clearTimeout(t)
    return (await r.json()) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'Chưa nối được máy chủ.' }
  }
}

export type TrangThaiLoiGiai = 'da_duyet' | 'cho_duyet' | 'tra_lai' | 'dang_soan' | 'truot' | 'chua_co_bo'
export interface CauChoDuyet {
  qid: string
  bam: string
  dang: 'tn' | 'ds' | 'tln'
  bo: string
  trangThai: TrangThaiLoiGiai
  sach: boolean
  /** Máy tự duyệt lúc nộp (hồ sơ sạch — thầy chốt 29/09). */
  mayDuyet?: boolean
  co: { loai: string; ghi: string; chot?: string; sua?: { truong: string; truoc: string; sau: string } }[]
  ghiChu: string
  loiMay: string
  soLan: number
}
export interface KetQuaChoDuyet {
  ok: boolean
  error?: string
  maDe?: string
  cau?: CauChoDuyet[]
  tong?: { cau: number; daDuyet: number; choDuyet: number; sach: number; dangSoan: number; traLai: number; truot: number; chuaCoBo: number }
}

export const gvChoDuyet = (maDe: string) => goiThay('/gv/loi-giai/cho-duyet', { maDe }) as Promise<KetQuaChoDuyet>
export const gvXemLoiGiai = (qid: string) => goiThay('/gv/loi-giai/xem', { qid }) as Promise<{ ok: boolean; error?: string; hoSo?: HoSoLoiGiai; cau?: CauChoKhung }>
export const gvDuyetLoiGiai = (b: { quyet: 'duyet' | 'tra_lai'; bam?: string[]; maDe?: string; caLoSach?: boolean; ghiChu?: string }) =>
  goiThay('/gv/loi-giai/duyet', b) as Promise<{ ok: boolean; error?: string; soCau?: number }>
export const gvSoanGap = (maDe: string) => goiThay('/gv/loi-giai/soan-gap', { maDe }) as Promise<{ ok: boolean; error?: string; soCau?: number }>
export const gvTongHang = () => goiThay('/kho/loi-giai/tong', {}) as Promise<{ ok: boolean; viec?: { bo: string; lop: string; trang_thai: string; n: number }[]; hoSo?: { bo: string; lop: string; trang_thai: string; n: number }[] }>
