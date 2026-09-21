// BỘ NÃO — CÁC LỆNH MÁY CHỦ (Code 1, 21/09/2026). Hợp đồng: `docs/hop-dong-bo-nao-2109.md`. Lõi tính toán thuần: `src/lib/bo-nao-*.ts`.
//
// Mỗi hàm nhận `(env, b)` và trả một đối tượng thường (như `goi-cu.ts`); `index.ts` (Code 3 nối) bọc bằng `ra(...)` SAU cổng `laThay`. KHÔNG có hàm nào tự kiểm mã bí mật.
//   boNaoCauHinh        đọc / ghi cờ `cau_hinh.bo_nao {bat, cheDo:'bong'|'that', lopThat[]}`
//   boNaoHoSoNgay       dựng THẺ + HỒ SƠ ngày THEO YÊU CẦU cho MỘT TRANG em (hoặc bức tranh cả lớp) và LƯU thẻ để lúc nộp kiểm lại đúng bộ số ấy
//   boNaoNop            nhận điều chỉnh + bản tin, KIỂM LẦN NỮA bằng `kiemKhuon`, lưu; chế độ BÓNG ⇒ lưu nhưng KHÔNG áp dụng (`ap_dung = 0`)
//   boNaoDemQua         bản tin sáng cho app thầy (chỉ đọc)
//   boNaoNhatKy         nhật ký điều chỉnh + lời đã gửi của một em (chỉ đọc)
//   boNaoBoDieuChinh    thầy bỏ một điều chỉnh
// TỰ HÀNH: hôm sau bộ não TỰ CHẤM điều chỉnh của đêm trước (lúc dựng hồ sơ ngày); `xau_di` ⇒ TỰ GỠ (`huy = 1`, `tu_go = 1`) và cờ `xau_di_hom_qua` đẩy em vào luồng soi kỹ.
import type { D1PreparedStatement, Env } from './kieu'
import { docMocReset } from './reset-toan-app'
import {
  danhGiaDieuChinh,
  chotLuongCaLop,
  phanLuong,
  themNgay,
  tinhBucTranhLop,
  tinhDacTrung,
  type BucTranhLop,
  type DauVaoEm,
  type DieuChinhDaNop,
  type HoSoDayDu,
  type KetQuaDieuChinh,
  type Luong,
  type TheCuaEmLop,
  type TheNgan,
} from '../../src/lib/bo-nao-dac-trung'
import { HAN_MUC_BO_NAO, kiemBanTin, kiemKhuon, lamSachDauRa, type CoBoNao, type DauRaEm, type DongBanTin, type KhacPhucEm } from '../../src/lib/bo-nao-khuon'

type Obj = Record<string, unknown>

export interface CauHinhBoNao {
  bat: boolean
  cheDo: 'bong' | 'that'
  lopThat: string[]
  /** THỬ THÁCH RIÊNG hôm nay (Nấc 1, docs/hop-dong-thu-thach-rieng-2109.md): tắt ⇒ máy chủ vẫn nhận/lưu nhưng KHÔNG phát thẻ cho em. Mặc định BẬT (chỉ có tác dụng khi lớp em ở chế độ `that`). */
  thuThach?: boolean
}
export const CAU_HINH_BO_NAO_MAC_DINH: CauHinhBoNao = { bat: true, cheDo: 'bong', lopThat: [], thuThach: true }
const KHOA_CAU_HINH = 'bo_nao'
const CO_TRANG_MAC_DINH = 40
const CO_TRANG_TOI_DA = 60
const NOP_TOI_DA = 100
/** Bao nhiêu ngày lùi lại để lấy sự kiện / kế hoạch / câu. */
const NGAY_LUI_SU_KIEN = 14
const NGAY_LUI_CA_THI = 14
const NGAY_LUI_LOI_NHAN = 10
const CUA_SO_LOI_PHU_HUYNH = 7 // trần lời cho phụ huynh tính trong cửa sổ này (cùng số với `NGUONG_BO_NAO.CUA_SO_LOI_PHU_HUYNH`)
const CHUNK_BATCH = 25

// ══════════════════════════════ TIỆN ÍCH ══════════════════════════════

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v)).trim()
const laNgay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !!themNgay(s, 0)

/** Ngày hôm nay theo giờ Việt Nam (UTC+7) từ mốc ms. */
export function ngayVnTuMs(ms: number): string {
  return new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
}

function parseJson<T>(s: unknown, macDinh: T): T {
  try {
    return typeof s === 'string' && s ? (JSON.parse(s) as T) : macDinh
  } catch {
    return macDinh
  }
}

/** Chia mảng thành các lô nhỏ. */
function chia<T>(a: T[], n: number): T[][] {
  const ra: T[][] = []
  for (let i = 0; i < a.length; i += n) ra.push(a.slice(i, i + n))
  return ra
}

async function chayBatch(env: Env, ds: D1PreparedStatement[]): Promise<void> {
  for (const lo of chia(ds, CHUNK_BATCH)) await env.DB.batch(lo)
}

/** Tên em ghép từ SBD (`hoc_sinh` trước, `danh_sach` sau). */
async function tenTheoSbd(env: Env, sbds: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  if (sbds.length === 0) return ra
  const j = JSON.stringify([...new Set(sbds)])
  const [a, b] = await env.DB.batch<{ sbd: string; ho_ten: string }>([
    env.DB.prepare(`SELECT sbd, COALESCE(ho_ten,'') AS ho_ten FROM danh_sach WHERE sbd IN (SELECT value FROM json_each(?))`).bind(j),
    env.DB.prepare(`SELECT sbd, COALESCE(ho_ten,'') AS ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))`).bind(j),
  ])
  for (const r of a.results ?? []) if (r.ho_ten) ra.set(String(r.sbd), r.ho_ten)
  for (const r of b.results ?? []) if (r.ho_ten) ra.set(String(r.sbd), r.ho_ten) // hồ sơ tài khoản thắng danh sách
  return ra
}

// ══════════════════════════════ CẤU HÌNH ══════════════════════════════

function chuanCauHinh(v: unknown): CauHinhBoNao {
  const o = (v && typeof v === 'object' ? v : {}) as Obj
  const lop = Array.isArray(o.lopThat) ? o.lopThat.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 60).slice(0, 50) : []
  return {
    bat: typeof o.bat === 'boolean' ? o.bat : CAU_HINH_BO_NAO_MAC_DINH.bat,
    cheDo: o.cheDo === 'that' ? 'that' : 'bong',
    lopThat: [...new Set(lop)],
    thuThach: o.thuThach !== false,
  }
}

export async function docCauHinhBoNao(env: Env): Promise<CauHinhBoNao> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CAU_HINH).first<{ gia_tri: string }>()
  return chuanCauHinh(parseJson(r?.gia_tri, {}))
}

/** Chế độ HIỆU LỰC của một lớp: nằm trong `lopThat` thì `that`, không thì theo `cheDo` chung. */
export function cheDoHieuLuc(ch: CauHinhBoNao, lop: string): 'bong' | 'that' {
  return ch.lopThat.includes(lop) ? 'that' : ch.cheDo
}

/** `POST /ai/cau-hinh` — thân rỗng = ĐỌC; có `bat` / `cheDo` / `lopThat` / `thuThach` = GHI (trộn vào giá trị cũ). */
export async function boNaoCauHinh(env: Env, b: Obj = {}): Promise<Obj> {
  const cu = await docCauHinhBoNao(env)
  const coGhi = 'bat' in b || 'cheDo' in b || 'lopThat' in b || 'thuThach' in b
  if (!coGhi) return { ok: true, cauHinh: cu }
  const moi: CauHinhBoNao = { ...cu }
  if ('bat' in b) {
    if (typeof b.bat !== 'boolean') return { ok: false, error: 'bat phải là true hoặc false' }
    moi.bat = b.bat
  }
  if ('thuThach' in b) {
    if (typeof b.thuThach !== 'boolean') return { ok: false, error: 'thuThach phải là true hoặc false' }
    moi.thuThach = b.thuThach
  }
  if ('cheDo' in b) {
    if (b.cheDo !== 'bong' && b.cheDo !== 'that') return { ok: false, error: 'cheDo chỉ nhận "bong" hoặc "that"' }
    moi.cheDo = b.cheDo
  }
  if ('lopThat' in b) {
    if (!Array.isArray(b.lopThat) || b.lopThat.length > 50 || b.lopThat.some((x) => typeof x !== 'string' || x.length === 0 || x.length > 60)) {
      return { ok: false, error: 'lopThat phải là mảng ≤ 50 tên lớp, mỗi tên 1–60 ký tự' }
    }
    moi.lopThat = [...new Set(b.lopThat as string[])]
  }
  await env.DB.prepare(
    'INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc',
  )
    .bind(KHOA_CAU_HINH, JSON.stringify(moi), new Date().toISOString())
    .run()
  return { ok: true, cauHinh: moi }
}

// ══════════════════════════════ DỰNG HỒ SƠ NGÀY ══════════════════════════════

interface DongDs {
  sbd: string
  lop: string
}

/** Danh sách em (tài khoản chưa khoá ∪ danh sách lớp), sắp theo SBD, một trang. Trả thêm tổng số em. */
async function docDanhSachEm(env: Env, trang: number, coTrang: number): Promise<{ ds: DongDs[]; tong: number }> {
  const goc = `SELECT sbd, COALESCE(lop,'') AS lop FROM hoc_sinh WHERE COALESCE(trang_thai,'') <> 'khoa' AND COALESCE(sbd,'') <> ''
               UNION ALL SELECT sbd, COALESCE(lop,'') AS lop FROM danh_sach WHERE COALESCE(sbd,'') <> ''`
  const [t, d] = await env.DB.batch<{ n: number } & DongDs>([
    env.DB.prepare(`SELECT COUNT(DISTINCT sbd) AS n FROM (${goc})`),
    env.DB.prepare(`SELECT sbd, MAX(lop) AS lop FROM (${goc}) GROUP BY sbd ORDER BY sbd LIMIT ? OFFSET ?`).bind(coTrang, (trang - 1) * coTrang),
  ])
  return { tong: Number((t.results?.[0] as { n?: number } | undefined)?.n ?? 0), ds: (d.results ?? []).map((r) => ({ sbd: String(r.sbd), lop: String(r.lop ?? '') })) }
}

interface DuLieuTrang {
  cuoi: Map<string, string | null>
  dau: Map<string, string | null>
  suKien: Map<string, DauVaoEm['suKien']>
  cau: Map<string, DauVaoEm['cau']>
  dang: Map<string, DauVaoEm['dang']>
  noOn: Map<string, number>
  keHoach: Map<string, DauVaoEm['keHoach']>
  btvn: Map<string, DauVaoEm['btvn']>
  exp: Map<string, DauVaoEm['exp']>
  ca: Map<string, DauVaoEm['caGanNhat']>
  dcHomQua: Map<string, Obj>
  theHomTruoc: Map<string, TheNgan>
  loiGanDay: Map<string, string[]>
  loiPhuHuynh7: Map<string, NonNullable<DauVaoEm['loiPhuHuynh7']>>
  baiCaNhan: Map<string, NonNullable<DauVaoEm['baiCaNhan']>>
}

const them = <T>(m: Map<string, T[]>, k: string, v: T) => {
  const a = m.get(k)
  if (a) a.push(v)
  else m.set(k, [v])
}

/** Đọc TOÀN BỘ dữ liệu của một trang em bằng MỘT lượt `batch` (≈ 12 truy vấn). */
async function docDuLieuTrang(env: Env, sbds: string[], ngay: string): Promise<DuLieuTrang> {
  const j = JSON.stringify(sbds)
  const homQua = themNgay(ngay, -1)
  const tuNgay = themNgay(ngay, -NGAY_LUI_SU_KIEN)
  const tuLuc = `${tuNgay}T00:00:00.000Z`
  const tuCa = `${themNgay(ngay, -NGAY_LUI_CA_THI)}T00:00:00.000Z`
  const tuKh = themNgay(ngay, -7)
  const tuLoi = themNgay(ngay, -NGAY_LUI_LOI_NHAN)
  const P = (q: string, ...a: unknown[]) => env.DB.prepare(q).bind(...a)
  const IN = `sbd IN (SELECT value FROM json_each(?))`
  const dsTruyVan = (coSoChang: boolean) => [
    // 0 — ngày hoạt động cuối / đầu (theo chỉ mục (sbd, ngay_vn); không quét cả bảng)
    P(`SELECT h.value AS sbd, (SELECT MAX(ngay_vn) FROM su_kien_hoc s WHERE s.sbd = h.value) AS cuoi, (SELECT MIN(ngay_vn) FROM su_kien_hoc s WHERE s.sbd = h.value) AS dau FROM json_each(?) h`, j),
    // 1 — sự kiện 14 ngày trước `ngay` (KHÔNG gồm hôm nay)
    P(`SELECT sbd, qid, nguon, ket_qua, giay, ngay_vn FROM su_kien_hoc WHERE ${IN} AND ngay_vn >= ? AND ngay_vn < ?`, j, tuNgay, ngay),
    // 2 — câu vừa có hoạt động (để tra dạng, số lần sai, trạng thái)
    P(`SELECT sbd, qid, COALESCE(NULLIF(ma_dang,''), 'CD:' || COALESCE(chuyen_de,'')) AS dang, lan_sai, trang_thai FROM nam_kt_cau WHERE ${IN} AND luc_cuoi >= ?`, j, tuLuc),
    // 3 — hồ sơ theo dạng
    P(`SELECT sbd, ma_dang, bac, so_gap, so_sai, so_da_khac_phuc, so_chua_thay_sai FROM nam_kt_dang WHERE ${IN}`, j),
    // 4 — nợ ôn (tới hạn mà chưa ôn)
    P(`SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE ${IN} AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ? GROUP BY sbd`, j, ngay),
    // 5 — kế hoạch ngày 7 ngày trước
    P(`SELECT sbd, ngay, ket_qua, la_ngay_nghi FROM ke_hoach_ngay WHERE ${IN} AND ngay >= ? AND ngay < ?`, j, tuKh, ngay),
    // 6 — BTVN đang mở (chưa nộp, chưa thu hồi, chưa xoá, chưa quá hạn quá 3 ngày)
    P(
      `SELECT e.sbd, COALESCE(e.lo_da_xong,0) AS xong, ${coSoChang ? 'e.so_chang' : 'NULL'} AS tong FROM btvn_em e JOIN btvn b ON b.ma_btvn = e.ma_btvn
        WHERE e.${IN} AND e.nop_luc IS NULL AND COALESCE(e.thu_hoi,0) = 0 AND COALESCE(b.da_xoa,0) = 0 AND b.han_nop >= ?`,
      j,
      `${themNgay(ngay, -3)}T00:00:00.000Z`,
    ),
    // 7 — EXP tổng + cấp từ hồ sơ thần thú
    P(`SELECT sbd, json_extract(json,'$.earned') AS tong, json_extract(json,'$.cap') AS cap FROM game_v2_profile WHERE ${IN}`, j),
    // 8 — ca thi đã nộp trong 14 ngày (mới nhất trước)
    P(
      `SELECT l.sbd, l.nop_luc, l.tong, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca
        WHERE l.${IN} AND l.trang_thai = 'da_nop' AND l.nop_luc >= ? AND COALESCE(c.trang_thai,'') <> 'da_xoa' ORDER BY l.nop_luc DESC`,
      j,
      tuCa,
    ),
    // 9 — điều chỉnh đêm qua
    P(`SELECT sbd, json, che_do, ap_dung FROM ai_dieu_chinh WHERE ${IN} AND ngay = ?`, j, homQua),
    // 10 — thẻ đêm trước
    P(`SELECT sbd, the_json FROM ai_ho_so_ngay WHERE ${IN} AND ngay = ?`, j, homQua),
    // 11 — lời nhắn gần đây (chống lặp)
    P(`SELECT sbd, json, ngay FROM ai_dieu_chinh WHERE ${IN} AND ngay >= ? AND ngay < ? ORDER BY ngay DESC`, j, tuLoi, ngay),
  ]
  // `btvn_em.so_chang` chỉ có sau migration BTVN nâng đỡ; máy chủ chưa có cột ấy thì hỏi lại không có nó (bài cũ không có chặng).
  let kq: Awaited<ReturnType<typeof env.DB.batch<Obj>>>
  try {
    kq = await env.DB.batch<Obj>(dsTruyVan(true))
  } catch (e) {
    if (!/so_chang/.test(e instanceof Error ? e.message : String(e))) throw e
    kq = await env.DB.batch<Obj>(dsTruyVan(false))
  }
  const R = (i: number): Obj[] => (kq[i]?.results ?? []) as Obj[]
  const ra: DuLieuTrang = { cuoi: new Map(), dau: new Map(), suKien: new Map(), cau: new Map(), dang: new Map(), noOn: new Map(), keHoach: new Map(), btvn: new Map(), exp: new Map(), ca: new Map(), dcHomQua: new Map(), theHomTruoc: new Map(), loiGanDay: new Map(), loiPhuHuynh7: new Map(), baiCaNhan: new Map() }
  for (const r of R(0)) {
    ra.cuoi.set(chuoi(r.sbd), r.cuoi ? chuoi(r.cuoi) : null)
    ra.dau.set(chuoi(r.sbd), r.dau ? chuoi(r.dau) : null)
  }
  for (const r of R(1)) them(ra.suKien, chuoi(r.sbd), { qid: chuoi(r.qid), nguon: chuoi(r.nguon), ketQua: r.ket_qua === 1 ? 1 : r.ket_qua === 0 ? 0 : null, giay: typeof r.giay === 'number' ? r.giay : null, ngay: chuoi(r.ngay_vn) })
  for (const r of R(2)) {
    const tt = chuoi(r.trang_thai)
    them(ra.cau, chuoi(r.sbd), { qid: chuoi(r.qid), dang: chuoi(r.dang), lanSai: Number(r.lan_sai) || 0, trangThai: tt === 'chua_thay_sai' || tt === 'moi_sai' || tt === 'dang_on' || tt === 'da_khac_phuc' ? tt : null })
  }
  for (const r of R(3)) them(ra.dang, chuoi(r.sbd), { ma: chuoi(r.ma_dang), bac: (Number(r.bac) === 0 ? 0 : Number(r.bac) === 2 ? 2 : 1) as 0 | 1 | 2, soGap: Number(r.so_gap) || 0, soSai: Number(r.so_sai) || 0, soDaKhacPhuc: Number(r.so_da_khac_phuc) || 0, soChuaThaySai: Number(r.so_chua_thay_sai) || 0 })
  for (const r of R(4)) ra.noOn.set(chuoi(r.sbd), Number(r.n) || 0)
  for (const r of R(5)) them(ra.keHoach, chuoi(r.sbd), { ngay: chuoi(r.ngay), ketQua: r.ket_qua === 'dat' || r.ket_qua === 'mot_phan' || r.ket_qua === 'khong' ? r.ket_qua : null, laNgayNghi: Number(r.la_ngay_nghi) === 1 })
  for (const r of R(6)) them(ra.btvn, chuoi(r.sbd), { changXong: Number(r.xong) || 0, tongChang: r.tong === null || r.tong === undefined ? null : Number(r.tong) })
  for (const r of R(7)) ra.exp.set(chuoi(r.sbd), { tong: r.tong === null || r.tong === undefined ? null : Number(r.tong), cap: r.cap === null || r.cap === undefined ? null : Number(r.cap) })
  for (const r of R(8)) {
    const s = chuoi(r.sbd)
    if (ra.ca.has(s)) continue // mới nhất trước
    const tong = r.tong === null || r.tong === undefined ? null : Number(r.tong)
    const cong = [r.diem_i, r.diem_ii, r.diem_iii].every((x) => x === null || x === undefined) ? null : Number(r.diem_i ?? 0) + Number(r.diem_ii ?? 0) + Number(r.diem_iii ?? 0)
    ra.ca.set(s, { diem: tong ?? (cong === null ? null : Math.round(cong * 100) / 100), ngayNop: ngayVnTuMs(Date.parse(chuoi(r.nop_luc)) || 0) })
  }
  for (const r of R(9)) ra.dcHomQua.set(chuoi(r.sbd), r)
  for (const r of R(10)) {
    const t = parseJson<TheNgan | null>(r.the_json, null)
    if (t) ra.theHomTruoc.set(chuoi(r.sbd), t)
  }
  const tuPh = themNgay(ngay, -CUA_SO_LOI_PHU_HUYNH)
  for (const r of R(11)) {
    const d = parseJson<Partial<DauRaEm>>(r.json, {})
    if (typeof d.loiNhanChoEm === 'string' && d.loiNhanChoEm) {
      const a = ra.loiGanDay.get(chuoi(r.sbd)) ?? []
      if (a.length < 3) {
        a.push(d.loiNhanChoEm)
        ra.loiGanDay.set(chuoi(r.sbd), a)
      }
    }
    // lời cho PHỤ HUYNH trong 7 ngày trước (đếm trần 2 lời/7 ngày; không tính thư tuần) + các dạng đã xử lý hôm đó
    if (typeof d.loiNhanChoPhuHuynh === 'string' && d.loiNhanChoPhuHuynh.trim() !== '' && chuoi(r.ngay) >= tuPh) {
      const dang = [...(d.dang ?? []).map((x) => chuoi(x?.ma)), ...((d.khacPhuc ?? []) as KhacPhucEm[]).map((x) => chuoi(x?.dang))].filter(Boolean)
      them(ra.loiPhuHuynh7, chuoi(r.sbd), { ngay: chuoi(r.ngay), dang })
    }
  }
  ra.baiCaNhan = await docBaiCaNhan(env, sbds, ngay)
  return ra
}

/**
 * Bài tập về nhà CÁ NHÂN HOÁ đang chạy của các em + số câu CHƯA GIAO theo dạng × mức (cho thẻ `coBaiCaNhanDangChay` / `soCauConLaiCungDang`: AI chỉ được hứa `khac_phuc` khi máy chủ làm được).
 * "Đang chạy" = bộ đã chốt (`chot_luc`, có `so_chang`), chưa nộp, chưa thu hồi/xoá, hạn chưa qua (theo ngày của lượt chạy) và còn ≥ 1 chặng sau chặng đang làm (`so_chang − lo_da_xong ≥ 2`).
 * "Chưa giao" = câu trong kho của bài (`btvn_cau`) KHÔNG phải lõi và KHÔNG nằm trong bộ của em (`btvn_em_cau`) — đúng nguồn ứng viên của `apKhacPhuc` (lõi nâng đỡ). Nhiều bài đang chạy ⇒ lấy số lớn nhất theo dạng.
 * Lỗi truy vấn (máy chủ chưa có cột/bảng của BTVN nâng đỡ…) ⇒ bản đồ rỗng (mọi em coi như không có bài cá nhân: AI không được dùng `khac_phuc`, an toàn).
 */
export async function docBaiCaNhan(env: Env, sbds: string[], ngay: string): Promise<DuLieuTrang['baiCaNhan']> {
  const ra: DuLieuTrang['baiCaNhan'] = new Map()
  try {
    const j = JSON.stringify(sbds)
    const denNgay = `${ngay}T00:00:00.000Z`
    const DANG_CHAY = `e.sbd IN (SELECT value FROM json_each(?)) AND e.chot_luc IS NOT NULL AND e.so_chang IS NOT NULL AND e.nop_luc IS NULL AND COALESCE(e.thu_hoi,0) = 0 AND COALESCE(b.da_xoa,0) = 0 AND b.han_nop >= ?`
    // MỘT câu lệnh (UNION ALL), không dùng thêm lượt `batch`: ngân sách truy vấn mỗi trang em (≤ 4 lượt batch) đã kín.
    const kq = await env.DB.prepare(
      `SELECT 'a' AS k, e.sbd, e.ma_btvn, NULL AS dang, NULL AS muc, NULL AS n, COALESCE(e.lo_da_xong,0) AS xong, e.so_chang AS tong
         FROM btvn_em e JOIN btvn b ON b.ma_btvn = e.ma_btvn WHERE ${DANG_CHAY}
       UNION ALL
       SELECT 'c', e.sbd, e.ma_btvn, COALESCE(NULLIF(k.dang,''), 'CD:' || COALESCE(k.chuyen_de,'')), k.muc_do, COUNT(*), NULL, NULL
         FROM btvn_em e JOIN btvn b ON b.ma_btvn = e.ma_btvn JOIN btvn_cau k ON k.ma_btvn = e.ma_btvn
        WHERE ${DANG_CHAY} AND COALESCE(k.loi,0) = 0
          AND NOT EXISTS (SELECT 1 FROM btvn_em_cau c WHERE c.ma_btvn = e.ma_btvn AND c.sbd = e.sbd AND c.qid = k.qid)
        GROUP BY e.sbd, e.ma_btvn, 4, k.muc_do`,
    ).bind(j, denNgay, j, denNgay).all<Obj>()
    const a = (kq.results ?? []).filter((r) => r.k === 'a')
    const c = (kq.results ?? []).filter((r) => r.k === 'c')
    const conChang = new Set<string>() // `sbd|ma_btvn` còn chặng để chèn
    for (const r of a) {
      const dangChay = (Number(r.tong) || 0) - (Number(r.xong) || 0) >= 2
      if (!ra.has(chuoi(r.sbd))) ra.set(chuoi(r.sbd), { dangChay: false, chuaGiao: {} })
      if (dangChay) {
        ra.get(chuoi(r.sbd))!.dangChay = true
        conChang.add(`${chuoi(r.sbd)}|${chuoi(r.ma_btvn)}`)
      }
    }
    for (const r of c) {
      if (!conChang.has(`${chuoi(r.sbd)}|${chuoi(r.ma_btvn)}`)) continue
      const m = Math.max(0, Math.min(2, Math.trunc(Number(r.muc) || 0)))
      const cua = ra.get(chuoi(r.sbd))!.chuaGiao
      const ma = chuoi(r.dang)
      const mang = cua[ma] ?? [0, 0, 0]
      mang[m] = Math.max(mang[m], Number(r.n) || 0)
      cua[ma] = mang
    }
  } catch {
    return new Map()
  }
  return ra
}

function dieuChinhDaNopTuDong(r: Obj | undefined): DieuChinhDaNop | null {
  if (!r) return null
  const d = parseJson<Partial<DauRaEm>>(r.json, {})
  if (!d.nhip) return null
  return {
    ngay: '',
    cheDo: r.che_do === 'that' ? 'that' : 'bong',
    apDung: Number(r.ap_dung) === 1,
    nhip: { lech: Number(d.nhip.lech) || 0, khoiDong: Number(d.nhip.khoiDong) || 2 },
    dang: (d.dang ?? []).map((x) => ({ ma: x.ma, hanhDong: x.hanhDong })),
    khacPhuc: (d.khacPhuc ?? []) as KhacPhucEm[],
    co: (d.co ?? 'khong') as CoBoNao,
  }
}

/** `POST /ai/ho-so-ngay` — dựng thẻ/hồ sơ ngày cho MỘT TRANG em (`phan:'em'`, mặc định) hoặc bức tranh cả lớp (`phan:'lop'`). Lưu thẻ vào `ai_ho_so_ngay`. */
/** Phần PHỤ nối từ ngoài (giữ tệp này chỉ import lõi thuần + kiểu): số thật thần thú của cả trang em (Nấc 1, docs/hop-dong-thu-thach-rieng-2109.md). */
export interface PhuHoSoNgay {
  thanThu?: (dsSbd: string[]) => Promise<Map<string, unknown>>
}

export async function boNaoHoSoNgay(env: Env, b: Obj = {}, nowMs: number = Date.now(), phu: PhuHoSoNgay = {}): Promise<Obj> {
  const ch = await docCauHinhBoNao(env)
  if (!ch.bat) return { ok: false, error: 'Bộ não đang tắt (Cài đặt → Bộ não)' }
  const ngay = b.ngay === undefined || b.ngay === '' ? ngayVnTuMs(nowMs) : b.ngay
  if (!laNgay(ngay)) return { ok: false, error: 'ngay phải có dạng YYYY-MM-DD' }
  if (b.phan === 'lop') {
    const kq = await chotLuongVaBucTranhLop(env, ngay)
    return { ok: true, ngay, lop: kq.lop, doiLuong: kq.doiLuong, tran: kq.tran }
  }

  const trang = Math.max(1, Math.floor(Number(b.trang) || 1))
  const coTrang = Math.min(CO_TRANG_TOI_DA, Math.max(1, Math.floor(Number(b.coTrang) || CO_TRANG_MAC_DINH)))
  const { ds, tong } = await docDanhSachEm(env, trang, coTrang)
  const sbds = ds.map((d) => d.sbd)
  const dl = sbds.length ? await docDuLieuTrang(env, sbds, ngay) : null
  const thanThuCuaEm = phu.thanThu && sbds.length ? await phu.thanThu(sbds).catch(() => new Map<string, unknown>()) : new Map<string, unknown>() // SỐ THẬT thần thú: ẩn danh, em không có thú ⇒ vắng
  const mocReset = await docMocReset(env, nowMs) // ngày xoá sổ toàn app gần nhất (null nếu chưa từng): tín hiệu suy từ kế hoạch/BTVN chưa đáng tin ngay sau đó
  const tao = new Date(nowMs).toISOString()
  const luu: D1PreparedStatement[] = []
  const capNhatChamDiem: D1PreparedStatement[] = []
  const cacEm: Obj[] = []
  const homQua = themNgay(ngay, -1)

  for (const d of ds) {
    const cuoi = dl?.cuoi.get(d.sbd) ?? null
    const v: DauVaoEm = {
      ngay,
      sbd: d.sbd,
      lop: d.lop,
      ngayHoatDongCuoi: cuoi,
      ngayHoatDongDau: dl?.dau.get(d.sbd) ?? null,
      suKien: dl?.suKien.get(d.sbd) ?? [],
      cau: dl?.cau.get(d.sbd) ?? [],
      dang: dl?.dang.get(d.sbd) ?? [],
      noOn: dl?.noOn.get(d.sbd) ?? 0,
      keHoach: dl?.keHoach.get(d.sbd) ?? [],
      btvn: dl?.btvn.get(d.sbd) ?? [],
      exp: dl?.exp.get(d.sbd) ?? { tong: null, cap: null },
      caGanNhat: dl?.ca.get(d.sbd) ?? null,
      dieuChinhHomQua: dieuChinhDaNopTuDong(dl?.dcHomQua.get(d.sbd)),
      theHomTruoc: dl?.theHomTruoc.get(d.sbd) ?? null,
      loiNhanGanDay: dl?.loiGanDay.get(d.sbd) ?? [],
      mocReset,
      loiPhuHuynh7: dl?.loiPhuHuynh7.get(d.sbd) ?? [],
      baiCaNhan: dl?.baiCaNhan.get(d.sbd) ?? { dangChay: false, chuaGiao: {} },
    }
    if (v.dieuChinhHomQua) v.dieuChinhHomQua.ngay = homQua
    if (!cuoi) {
      cacEm.push({ sbd: d.sbd, lop: d.lop, luong: 'bo_qua', lyDoLuong: ['chưa có hoạt động'] })
      continue
    }
    const { the, hoSo } = tinhDacTrung(v)
    const tt = thanThuCuaEm.get(d.sbd)
    if (tt) { (the as { thanThu?: unknown }).thanThu = tt; (hoSo as { thanThu?: unknown }).thanThu = tt }
    // TỰ CHẤM điều chỉnh đêm qua; `xau_di` ⇒ cờ + TỰ GỠ nếu đang áp dụng
    let dg = null as ReturnType<typeof danhGiaDieuChinh> | null
    const hq = dl?.dcHomQua.get(d.sbd)
    if (hq) {
      dg = danhGiaDieuChinh(v.theHomTruoc ?? null, the)
      the.homQuaDanhGia = dg
      hoSo.homQuaDanhGia = dg
      if (dg.ketQua === 'xau_di') {
        the.co.push('xau_di_hom_qua')
        hoSo.co.push('xau_di_hom_qua')
      }
      const tuGo = dg.ketQua === 'xau_di' && Number(hq.ap_dung) === 1
      capNhatChamDiem.push(
        env.DB.prepare(
          `UPDATE ai_dieu_chinh SET ket_qua = ?, ket_qua_chu = ?, huy = CASE WHEN ? = 1 THEN 1 ELSE huy END, tu_go = CASE WHEN ? = 1 THEN 1 ELSE tu_go END WHERE sbd = ? AND ngay = ?`,
        ).bind(dg.ketQua, dg.chu, tuGo ? 1 : 0, tuGo ? 1 : 0, d.sbd, homQua),
      )
    }
    const pl = phanLuong(the, { sbd: d.sbd, ngay })
    const daDoc = pl.luong === 'sau' ? hoSo : the
    luu.push(
      env.DB.prepare(
        `INSERT INTO ai_ho_so_ngay (sbd, ngay, lop, luong, ly_do_luong, the_json, tao_luc) VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(sbd, ngay) DO UPDATE SET lop = excluded.lop, luong = excluded.luong, ly_do_luong = excluded.ly_do_luong, the_json = excluded.the_json, tao_luc = excluded.tao_luc`,
      ).bind(d.sbd, ngay, d.lop, pl.luong, JSON.stringify(pl.lyDo), JSON.stringify(daDoc), tao),
    )
    cacEm.push({ sbd: d.sbd, lop: d.lop, luong: pl.luong, lyDoLuong: pl.lyDo, the, ...(pl.luong === 'sau' ? { hoSo } : {}) })
  }
  await chayBatch(env, [...luu, ...capNhatChamDiem])
  return { ok: true, ngay, trang, soTrang: Math.max(1, Math.ceil(tong / coTrang)), soEm: tong, cacEm }
}

/** Thẻ đã lưu của cả lớp trong một đêm (bỏ em `bo_qua`), kèm kết quả chấm điều chỉnh hôm qua và cột luồng/lý do đang lưu. */
async function docTheCaLop(env: Env, ngay: string): Promise<(TheCuaEmLop & { lyDoCu: string })[]> {
  const r = await env.DB.prepare(
    `SELECT a.sbd, a.lop, a.luong, a.ly_do_luong, a.the_json, d.ket_qua AS kq FROM ai_ho_so_ngay a LEFT JOIN ai_dieu_chinh d ON d.sbd = a.sbd AND d.ngay = ? WHERE a.ngay = ? AND a.luong <> 'bo_qua' ORDER BY a.sbd`,
  )
    .bind(themNgay(ngay, -1), ngay)
    .all<Obj>()
  const cacEm: (TheCuaEmLop & { lyDoCu: string })[] = []
  for (const x of r.results ?? []) {
    const the = parseJson<TheNgan | null>(x.the_json, null)
    if (!the) continue
    const kq = x.kq === 'an_thua' || x.kq === 'khong_doi' || x.kq === 'xau_di' || x.kq === 'chua_du_du_lieu' ? (x.kq as KetQuaDieuChinh) : null
    cacEm.push({ sbd: chuoi(x.sbd), lop: chuoi(x.lop), the, luong: chuoi(x.luong) as Luong, ketQuaHomQua: kq, lyDoCu: chuoi(x.ly_do_luong) || '[]' })
  }
  return cacEm
}

/** Bức tranh cả lớp của một đêm, dựng từ thẻ đã lưu (luồng như đang lưu — đã chốt nếu mã lệnh đã gọi `phan:'lop'`). */
async function bucTranhLopTuSo(env: Env, ngay: string): Promise<BucTranhLop> {
  return tinhBucTranhLop(ngay, await docTheCaLop(env, ngay))
}

/**
 * `phan:'lop'`: CHỐT LUỒNG CẢ LỚP (`chotLuongCaLop`) rồi trả bức tranh lớp. Dạng cả lớp cùng sai ⇒ `lop.dangCaLopYeu`, không đẩy từng em vào sâu vì lý do đó; luồng sâu ≤ 25 % số em có thẻ.
 * Ghi luồng/lý do đã chốt vào `ai_ho_so_ngay` (bản tin sáng, `/ai/dem-qua` và kiểm bản tin đọc đúng số đã chốt) và trả `doiLuong` = các em đổi luồng hoặc lý do so với lúc dựng từng trang,
 * để `lay.mjs` (đã cầm sẵn thẻ) xếp lại tệp. Chạy lại nhiều lần ra cùng kết quả (chỉ đọc thẻ).
 */
async function chotLuongVaBucTranhLop(env: Env, ngay: string): Promise<{ lop: BucTranhLop; doiLuong: { sbd: string; luong: Luong; lyDoLuong: string[] }[]; tran: Obj }> {
  const cacEm = await docTheCaLop(env, ngay)
  const kq = chotLuongCaLop(ngay, cacEm)
  const doiLuong: { sbd: string; luong: Luong; lyDoLuong: string[] }[] = []
  const luu: D1PreparedStatement[] = []
  for (const e of cacEm) {
    const cuoi = kq.luong.get(e.sbd)
    if (!cuoi) continue
    const lyDoMoi = JSON.stringify(cuoi.lyDo)
    if (cuoi.luong !== e.luong || lyDoMoi !== e.lyDoCu) {
      doiLuong.push({ sbd: e.sbd, luong: cuoi.luong, lyDoLuong: cuoi.lyDo })
      luu.push(env.DB.prepare('UPDATE ai_ho_so_ngay SET luong = ?, ly_do_luong = ? WHERE sbd = ? AND ngay = ?').bind(cuoi.luong, lyDoMoi, e.sbd, ngay))
      e.luong = cuoi.luong
    }
  }
  if (luu.length) await chayBatch(env, luu)
  return { lop: tinhBucTranhLop(ngay, cacEm), doiLuong, tran: kq.tran }
}

// ══════════════════════════════ NỘP ĐIỀU CHỈNH ══════════════════════════════

/** `POST /ai/dieu-chinh/nop` — nhận + kiểm khuôn LẦN NỮA + lưu. Chế độ `bong` ⇒ `ap_dung = 0`. */
export async function boNaoNop(env: Env, b: Obj = {}, nowMs: number = Date.now()): Promise<Obj> {
  const ch = await docCauHinhBoNao(env)
  if (!ch.bat) return { ok: false, error: 'Bộ não đang tắt (Cài đặt → Bộ não)' }
  const ngay = b.ngay
  if (!laNgay(ngay)) return { ok: false, error: 'ngay phải có dạng YYYY-MM-DD' }
  const cacEm = Array.isArray(b.cacEm) ? (b.cacEm as Obj[]) : []
  if (cacEm.length > NOP_TOI_DA) return { ok: false, error: `Mỗi lượt nộp tối đa ${NOP_TOI_DA} em` }

  const sbds = [...new Set(cacEm.map((x) => chuoi(x?.sbd)).filter(Boolean))]
  const the = new Map<string, { the: TheNgan & Obj; lop: string }>()
  if (sbds.length) {
    const r = await env.DB.prepare(`SELECT sbd, lop, the_json FROM ai_ho_so_ngay WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))`).bind(ngay, JSON.stringify(sbds)).all<Obj>()
    for (const x of r.results ?? []) {
      const t = parseJson<(TheNgan & Obj) | null>(x.the_json, null)
      if (t) the.set(chuoi(x.sbd), { the: t, lop: chuoi(x.lop) })
    }
  }
  const nop = new Date(nowMs).toISOString()
  const hetHan = themNgay(ngay, HAN_MUC_BO_NAO.HAN_NGAY)
  const loai: { sbd: string; lyDo: string[] }[] = []
  const canhBao: { sbd: string; canhBao: string[] }[] = []
  const luu: D1PreparedStatement[] = []
  const daCo = new Set<string>()
  let nhan = 0
  let chiGhiSo = 0
  let soApDung = 0

  for (const x of cacEm) {
    const sbd = chuoi(x?.sbd)
    if (!sbd) {
      loai.push({ sbd: '', lyDo: ['thiếu sbd'] })
      continue
    }
    if (daCo.has(sbd)) {
      loai.push({ sbd, lyDo: ['trùng em trong lượt nộp (mỗi em một phần tử mỗi ngày)'] })
      continue
    }
    daCo.add(sbd)
    const t = the.get(sbd)
    if (!t) {
      loai.push({ sbd, lyDo: ['không có thẻ của em ngày này — chạy lại lay.mjs'] })
      continue
    }
    const { sbd: _s, ...dauRa } = x
    void _s
    const k = kiemKhuon({ ...dauRa, biDanh: sbd }, { ...t.the, biDanh: sbd, maDang: t.the.maDang, luotSoiKyTuan: t.the.luotSoiKyTuan, khiNaoVietPhuHuynh: t.the.khiNaoVietPhuHuynh })
    if (!k.hopLe) {
      loai.push({ sbd, lyDo: k.lyDo })
      continue
    }
    if (k.canhBao?.length) canhBao.push({ sbd, canhBao: k.canhBao })
    const sach = lamSachDauRa({ ...(dauRa as unknown as DauRaEm), biDanh: '' }, k)
    const cheDo = cheDoHieuLuc(ch, t.lop)
    const apDung = cheDo === 'that' && sach.doTinCay >= HAN_MUC_BO_NAO.NGUONG_TIN_CAY
    nhan++
    if (apDung) soApDung++
    else chiGhiSo++
    // `biDanh` rỗng: bí danh là chuyện của mã lệnh, không lưu ở máy chủ
    luu.push(
      env.DB.prepare(
        `INSERT INTO ai_dieu_chinh (sbd, ngay, json, do_tin, che_do, ap_dung, het_han, huy, tu_go, ly_do_bo, ket_qua, ket_qua_chu, nop_luc)
         VALUES (?,?,?,?,?,?,?,0,0,'[]',NULL,NULL,?)
         ON CONFLICT(sbd, ngay) DO UPDATE SET json = excluded.json, do_tin = excluded.do_tin, che_do = excluded.che_do, ap_dung = CASE WHEN ai_dieu_chinh.huy = 1 THEN 0 ELSE excluded.ap_dung END,
           het_han = excluded.het_han, nop_luc = excluded.nop_luc`,
      ).bind(sbd, ngay, JSON.stringify(sach), sach.doTinCay, cheDo, apDung ? 1 : 0, hetHan, nop),
    )
  }

  // BẢN TIN SÁNG
  let banTinNhan = 0
  const banTinLoi: string[] = []
  const banTinCanhBao: string[] = []
  if (b.banTin !== undefined) {
    const soLieuLop = await bucTranhLopTuSo(env, ngay)
    const bt = b.banTin as { cacDong?: (DongBanTin & { sbd?: string })[] }
    const kBt = kiemBanTin({ cacDong: (bt?.cacDong ?? []).map((d) => ({ ...d, biDanh: '' })) }, soLieuLop)
    banTinCanhBao.push(...(kBt.canhBao ?? []))
    if (!kBt.hopLe) banTinLoi.push(...kBt.lyDo)
    else {
      const cacDong = (bt.cacDong ?? []).map((d) => ({ loai: d.loai, sbd: chuoi(d.sbd), chu: d.chu, hanhDong: d.hanhDong, dang: d.dang }))
      banTinNhan = cacDong.length
      luu.push(
        env.DB.prepare(
          `INSERT INTO ai_ban_tin (ngay, json, che_do, nop_luc, so_em, so_nhanh, so_sau, so_vang, so_nhan, so_chi_ghi_so, so_bi_loai) VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(ngay) DO UPDATE SET json = excluded.json, che_do = excluded.che_do, nop_luc = excluded.nop_luc, so_em = excluded.so_em, so_nhanh = excluded.so_nhanh, so_sau = excluded.so_sau,
             so_vang = excluded.so_vang, so_nhan = excluded.so_nhan, so_chi_ghi_so = excluded.so_chi_ghi_so, so_bi_loai = excluded.so_bi_loai`,
        ).bind(ngay, JSON.stringify({ cacDong }), ch.cheDo, nop, soLieuLop.soEm, soLieuLop.soSoiNhanh, soLieuLop.soSoiKy, soLieuLop.soVang, nhan, chiGhiSo, loai.length),
        // mã lệnh nộp nhiều lô (≤ 100 em/lô) và gắn bản tin vào lô cuối: số "đã hỗ trợ" tính lại từ bảng để không chỉ đếm lô này
        env.DB.prepare(
          `UPDATE ai_ban_tin SET so_nhan = (SELECT COUNT(*) FROM ai_dieu_chinh WHERE ngay = ?), so_chi_ghi_so = (SELECT COUNT(*) FROM ai_dieu_chinh WHERE ngay = ? AND ap_dung = 0) WHERE ngay = ?`,
        ).bind(ngay, ngay, ngay),
      )
    }
  }
  await chayBatch(env, luu)
  return {
    ok: true,
    ngay,
    nhan,
    chiGhiSo,
    soApDung,
    biLoai: loai.length,
    loai,
    canhBao,
    banTin: { nhan: banTinNhan, loi: banTinLoi, canhBao: banTinCanhBao },
  }
}

// ══════════════════════════════ ĐỌC (APP THẦY) ══════════════════════════════

/** `POST /ai/dem-qua` — bản tin sáng + số đếm. Chưa chạy lần nào ⇒ `chayLanCuoi: null`, bản tin rỗng. */
export async function boNaoDemQua(env: Env, b: Obj = {}, nowMs: number = Date.now()): Promise<Obj> {
  const ch = await docCauHinhBoNao(env)
  const goc = { cheDo: ch.cheDo, bat: ch.bat, lopThat: ch.lopThat }
  const ngayYeuCau = laNgay(b.ngay) ? b.ngay : null
  const bt = ngayYeuCau
    ? await env.DB.prepare('SELECT * FROM ai_ban_tin WHERE ngay = ?').bind(ngayYeuCau).first<Obj>()
    : await env.DB.prepare('SELECT * FROM ai_ban_tin ORDER BY ngay DESC LIMIT 1').first<Obj>()
  const lan = await env.DB.prepare('SELECT MAX(nop_luc) AS n FROM ai_dieu_chinh').first<{ n: string | null }>()
  const chayLanCuoi = lan?.n ?? (bt ? chuoi(bt.nop_luc) : null)
  if (!bt) {
    return { ok: true, ngay: ngayYeuCau ?? ngayVnTuMs(nowMs), chayLanCuoi, ...goc, soEm: 0, soSoiNhanh: 0, soSoiKy: 0, soVang: 0, soDieuChinh: { nhan: 0, chiGhiSo: 0, biLoai: 0 }, soEmHoTro: 0, banTin: { cacDong: [] } }
  }
  const ngay = chuoi(bt.ngay)
  const dong = (parseJson<{ cacDong?: Obj[] }>(bt.json, {}).cacDong ?? []).slice(0, HAN_MUC_BO_NAO.BAN_TIN_SO_DONG_TOI_DA)
  const sbds = [...new Set(dong.map((d) => chuoi(d.sbd)).filter(Boolean))]
  const ten = await tenTheoSbd(env, sbds)
  const homQua = themNgay(ngay, -1)
  const dc = new Map<string, Obj>()
  const dcQua = new Map<string, Obj>()
  if (sbds.length) {
    const j = JSON.stringify(sbds)
    const [a, c] = await env.DB.batch<Obj>([
      env.DB.prepare(`SELECT sbd, ap_dung, huy FROM ai_dieu_chinh WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))`).bind(ngay, j),
      env.DB.prepare(`SELECT sbd, ket_qua, ket_qua_chu, tu_go FROM ai_dieu_chinh WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))`).bind(homQua, j),
    ])
    for (const r of a.results ?? []) dc.set(chuoi(r.sbd), r)
    for (const r of c.results ?? []) dcQua.set(chuoi(r.sbd), r)
  }
  const ho = await env.DB.prepare('SELECT COUNT(*) AS n FROM ai_dieu_chinh WHERE ngay = ? AND ap_dung = 1 AND huy = 0').bind(ngay).first<{ n: number }>()
  return {
    ok: true,
    ngay,
    chayLanCuoi,
    ...goc,
    soEm: Number(bt.so_em) || 0,
    soSoiNhanh: Number(bt.so_nhanh) || 0,
    soSoiKy: Number(bt.so_sau) || 0,
    soVang: Number(bt.so_vang) || 0,
    soDieuChinh: { nhan: Number(bt.so_nhan) || 0, chiGhiSo: Number(bt.so_chi_ghi_so) || 0, biLoai: Number(bt.so_bi_loai) || 0 },
    soEmHoTro: Number(ho?.n) || 0,
    banTin: {
      cacDong: dong.map((d) => {
        const s = chuoi(d.sbd)
        const hn = dc.get(s)
        const hq = dcQua.get(s)
        return {
          loai: d.loai,
          sbd: s,
          hoTen: ten.get(s) ?? '',
          chu: d.chu,
          hanhDong: d.hanhDong,
          dang: d.dang ?? '',
          apDung: hn ? Number(hn.ap_dung) === 1 && Number(hn.huy) === 0 : false,
          ngayDieuChinh: ngay,
          ketQua: hq ? (hq.ket_qua ?? null) : null,
          ketQuaChu: hq ? chuoi(hq.ket_qua_chu) : '',
          tuGo: hq ? Number(hq.tu_go) === 1 : false,
        }
      }),
    },
  }
}

/** `POST /ai/nhat-ky {sbd}` — ≤ 14 dòng mới nhất trước, kèm NGUYÊN VĂN lời đã gửi cho em và phụ huynh. */
export async function boNaoNhatKy(env: Env, b: Obj = {}): Promise<Obj> {
  const sbd = chuoi(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare('SELECT * FROM ai_dieu_chinh WHERE sbd = ? ORDER BY ngay DESC LIMIT 14').bind(sbd).all<Obj>()
  const ten = await tenTheoSbd(env, [sbd])
  return {
    ok: true,
    sbd,
    hoTen: ten.get(sbd) ?? '',
    ds: (r.results ?? []).map((x) => {
      const d = parseJson<Partial<DauRaEm>>(x.json, {})
      return {
        ngay: chuoi(x.ngay),
        hetHan: chuoi(x.het_han),
        cheDo: x.che_do === 'that' ? 'that' : 'bong',
        doTin: Number(x.do_tin) || 0,
        nhip: d.nhip ?? { lech: 0, khoiDong: 2 },
        dang: d.dang ?? [],
        khacPhuc: d.khacPhuc ?? [],
        co: d.co ?? 'khong',
        loiNhanChoEm: d.loiNhanChoEm ?? '',
        loiNhanChoPhuHuynh: d.loiNhanChoPhuHuynh ?? '',
        thuTuan: d.thuTuan ?? '',
        goiYChoThay: d.goiYChoThay ?? { chu: '', hanhDong: 'khong', dang: '' },
        ghiChuHlv: d.ghiChuHlv ?? '',
        apDung: Number(x.ap_dung) === 1 && Number(x.huy) === 0,
        lyDoBo: parseJson<string[]>(x.ly_do_bo, []),
        ketQua: x.ket_qua ?? null,
        ketQuaChu: chuoi(x.ket_qua_chu),
        tuGo: Number(x.tu_go) === 1,
        daBo: Number(x.huy) === 1 && Number(x.tu_go) !== 1,
      }
    }),
  }
}

/** `POST /ai/dieu-chinh/bo {sbd, ngay}` — thầy bỏ điều chỉnh (đặt `huy = 1`). Không có ⇒ `ok:true, daBo:false`. */
export async function boNaoBoDieuChinh(env: Env, b: Obj = {}): Promise<Obj> {
  const sbd = chuoi(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu số báo danh' }
  if (!laNgay(b.ngay)) return { ok: false, error: 'ngay phải có dạng YYYY-MM-DD' }
  const r = await env.DB.prepare('UPDATE ai_dieu_chinh SET huy = 1, ap_dung = 0 WHERE sbd = ? AND ngay = ?').bind(sbd, b.ngay).run()
  return { ok: true, daBo: (r.meta.changes ?? 0) > 0 }
}

/** Kiểu trả về của thẻ/hồ sơ (để test / index.ts dùng lại). */
export type { HoSoDayDu, TheNgan }
