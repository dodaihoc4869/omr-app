// GỌI MÁY CHỦ «Bắt đầu từ đâu?» + ĐỌC CHẶT bản sơ đồ (làn B, 26/10). Hợp đồng dữ liệu: ./kieu.ts.
// Lệnh của làn C: POST /hs/goi-y-so-do {token, qid, session?} (server/src/loi-giai-so-do.ts) — gửi `session` thì máy chủ tự ghi câu là «có trợ giúp»
// (màn vẫn gọi `onHoTro()` như cũ). Đi qua `goiHs` (cùng địa chỉ máy chủ, hạn 15 giây) như các lệnh /hs khác.
// Đọc CHẶT: trường thiếu / sai kiểu thì bỏ, không bịa. TRƯỚC khi nộp (`giaiDoan: 'truoc'`) máy em tự cắt MỌI `ketQua` thêm một lần
// (máy chủ đã cắt — đây là lớp chắn thứ hai: đáp số không bao giờ hiện trên màn trước khi nộp).
import { goiHs } from '../loi-giai-api'
import type { BanSoDo, BuocTinh, GoiYTraVe, HienTuong, MuiSoDo, NutSoDo, SoDo, ThuaSo } from './kieu'

const chu = (x: unknown, dai = 600): string | undefined => (typeof x === 'string' && x.trim() ? x.trim().slice(0, dai) : undefined)
const dsChu = (x: unknown, toiDa = 8): string[] => (Array.isArray(x) ? x.map((y) => chu(y)).filter((y): y is string => !!y).slice(0, toiDa) : [])

function docNut(x: unknown): NutSoDo | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const chat = chu(o.chat, 60)
  if (!chat) return null
  const tong = chu(o.tong, 60)
  return { ...(tong ? { tong } : {}), chat, soLieu: dsChu(o.soLieu, 6) }
}
function docSoDo(x: unknown): SoDo | undefined {
  if (!x || typeof x !== 'object') return undefined
  const o = x as Record<string, unknown>
  const nut = Array.isArray(o.nut) ? o.nut.map(docNut) : []
  if (nut.length < 2 || nut.length > 4 || nut.some((n) => !n)) return undefined
  const muiTen: MuiSoDo[] = Array.from({ length: nut.length - 1 }, (_, i) => {
    const m = Array.isArray(o.muiTen) ? (o.muiTen[i] as Record<string, unknown> | undefined) : undefined
    const H = Number(m?.H)
    return m && Number.isFinite(H) && H > 0 && H <= 100 ? { H } : {}
  })
  return { nut: nut as NutSoDo[], muiTen, chieu: o.chieu === 'nguoc' ? 'nguoc' : 'xuoi' }
}
function docThuaSo(x: unknown): ThuaSo | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const so = chu(o.so, 24), nghia = chu(o.nghia, 300)
  if (!so || !nghia) return null
  const denDay = chu(o.denDay, 200)
  return { so, nghia, ...(denDay ? { denDay } : {}) }
}
function docBuoc(x: unknown, sau: boolean): BuocTinh | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const ten = chu(o.ten, 40)
  const thuaSo = Array.isArray(o.thuaSo) ? o.thuaSo.map(docThuaSo) : []
  if (!ten || !thuaSo.length || thuaSo.length > 12 || thuaSo.some((t) => !t)) return null
  const ketQua = sau ? chu(o.ketQua, 40) : undefined
  const donVi = chu(o.donVi, 20)
  return { ten, thuaSo: thuaSo as ThuaSo[], ...(ketQua ? { ketQua } : {}), ...(donVi ? { donVi } : {}) }
}
function docHienTuong(x: unknown): HienTuong | undefined {
  if (!x || typeof x !== 'object') return undefined
  const o = x as Record<string, unknown>
  const giaiThich = dsChu(o.giaiThich, 4)
  if (!giaiThich.length) return undefined
  const tn = o.thiNghiem as Record<string, unknown> | undefined
  const khung = tn && Array.isArray(tn.khung)
    ? tn.khung.map((k) => (k && typeof k === 'object' ? { tieuDe: chu((k as Record<string, unknown>).tieuDe, 60), moTa: chu((k as Record<string, unknown>).moTa, 160) } : null))
        .filter((k): k is { tieuDe: string; moTa: string } => !!k?.tieuDe && !!k.moTa).slice(0, 3)
    : []
  return { giaiThich, ...(khung.length >= 2 ? { thiNghiem: { mau: chu(tn?.mau, 40) ?? 'coc', khung } } : {}) }
}

/**
 * Bản sơ đồ THÔ (máy chủ / kết quả sau nộp) → `BanSoDo` đã kiểm; không đủ để vẽ ⇒ null.
 * `sau = false` (trước khi nộp) ⇒ bỏ mọi `ketQua` (kể cả khi máy chủ lỡ gửi).
 */
export function docBanSoDo(x: unknown, sau: boolean): BanSoDo | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const qid = chu(o.qid, 120), deNoiGi = chu(o.deNoiGi)
  if (!qid || !deNoiGi) return null
  const buoc = (Array.isArray(o.buoc) ? o.buoc.map((b) => docBuoc(b, sau)) : []).filter((b): b is BuocTinh => !!b).slice(0, 3)
  const soDo = docSoDo(o.soDo), hienTuong = docHienTuong(o.hienTuong)
  const chiaKhoa = chu(o.chiaKhoa), cauTuHoi = chu(o.cauTuHoi)
  if (!soDo && !buoc.length && !chiaKhoa && !cauTuHoi) return null
  const ketQua = sau ? chu(o.ketQua, 40) : undefined
  const phienBan = Number(o.phienBan)
  return {
    qid, phienBan: Number.isFinite(phienBan) ? phienBan : 1, deNoiGi, buoc,
    ...(soDo ? { soDo } : {}), ...(hienTuong ? { hienTuong } : {}), ...(chiaKhoa ? { chiaKhoa } : {}), ...(cauTuHoi ? { cauTuHoi } : {}), ...(ketQua ? { ketQua } : {}),
  }
}

/** Phản hồi thô của lệnh `goi-y-so-do` → `GoiYTraVe`. Hỏng / thiếu ⇒ null (màn báo «Chưa tải được gợi ý» + gợi ý tự sinh). */
export function docGoiYTraVe(r: unknown): GoiYTraVe | null {
  if (!r || typeof r !== 'object') return null
  const o = r as Record<string, unknown>
  if (o.ok !== true) return null
  if (o.co !== true) return { ok: true, co: false }
  const giaiDoan = o.giaiDoan === 'sau' ? 'sau' : 'truoc'
  const ban = docBanSoDo(o.ban, giaiDoan === 'sau')
  return ban ? { ok: true, co: true, giaiDoan, ban } : { ok: true, co: false }
}

/** Em bấm «Bắt đầu từ đâu?» ⇒ tải bản soạn sẵn của câu. Lỗi mạng / máy chủ ⇒ null. */
export async function taiGoiYSoDo(token: string, qid: string, session?: string): Promise<GoiYTraVe | null> {
  try {
    return docGoiYTraVe(await goiHs('/hs/goi-y-so-do', { token, qid, ...(session ? { session } : {}) }))
  } catch {
    return null
  }
}
