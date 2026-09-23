// LỚP D1 CỦA KẾ HOẠCH NGÀY — GĐ 2 (đọc đầu vào, dựng hồ sơ khi sổ đổi, lưu, chốt ngày, cron).
//
// Đọc GỘP THEO LÔ EM (`sbd IN (SELECT value FROM json_each(?))`, ≤ 50 em/lượt): mỗi lô ~14 câu truy vấn bất kể số em,
// nên cron cả lớp 261 em ≈ 6 lô ≈ 100 câu truy vấn (dưới trần 1000 của một lượt chạy), chứ không phải 261 × 14.
//
// TƯƠI KHI ĐỌC, KHÔNG PHẢI KHI GHI: kế hoạch được lập lại mỗi lần em mở (và mỗi đêm bằng cron), nên "lập lại khi có sự
// kiện" của đề xuất đạt được mà không thêm một câu truy vấn nào vào đường nộp bài. Hồ sơ được dựng lại khi số dòng sổ
// của em khác số lúc lập kế hoạch trước (`so_su_kien`).
import { emCoGhi } from './dem-ke-hoach'
import type { D1Result, Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { dungLaiHoSo } from './ho-so-nam-kt'
import type { NamKtCau, NamKtDang } from './ho-so-nam-kt'
// P05 (02 §6): đánh giá ngày theo MỤC TIÊU CORE đã đóng băng.
import { chonCauChoLuot, familyTuNhan, type CauUngVien } from './bo-chon-that'
import { danhGiaCore, type KetQuaTaskCore } from './muc-tieu-core'
import {
  PHIEN_BAN_KE_HOACH, NGAY_LIET_KE_QUA_HAN, NGAY_ON_THI, NHIEM_VU_THAN_THU_MO_TOI_DA, PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU, SO_NGAY_DO_VAN_TOC, SO_NGAY_LICH_SU,
} from './ho-so-cau-hinh'
import { lapKeHoachNgay, ngayHocMom, type DauVaoKeHoach, type KeHoachNgay } from './ke-hoach-ngay'
import { baoVeMotLuot, qidPhucVuDuoc } from './cau-theo-qid'
// PHẠM VI HỌC CÁ NHÂN (CNH-1.0 P02): cổng cho hai danh sách TỰ ĐỘNG của kế hoạch ngày. Cờ TẮT ⇒ không đổi gì.
import { docPhamViNhieu, eligibleScope, phamViBat } from './pham-vi-hoc'
import { docCaSapMo, docKhoiVaLopCacEm } from './game-v2-bank'
import { cauHopKhoi, type Khoi } from '../../src/lib/khoi-cau'
import { ngayVn } from './su-kien-hoc'
import { tuLucHomNay } from './cau-da-lam'
import { docMocHienThi } from './moc-no'
import { docLichDaLuu, moLucChang } from './btvn-nang-do-chang'
import { ketQuaChotNgay } from '../../src/lib/dat-nhiem-vu-ngay'
import { docDieuChinhHieuLuc } from './bo-nao-doc'

export const TOI_DA_EM_MOI_LO = 50
const MOT_NGAY_MS = 86_400_000

const json = (v: unknown) => JSON.stringify(v)
const themNgay = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)
const chunk = <T>(a: T[], n: number): T[][] => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
const IN_EM = 'sbd IN (SELECT value FROM json_each(?))'

const trong = <T = Record<string, unknown>>(): D1Result<T> => ({ results: [], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } })

async function tat<T>(f: () => Promise<T>, dpr: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    // Bảng chưa có (migration chưa chạy) → coi như trống, kế hoạch vẫn ra; lỗi khác vẫn được ghi.
    if (!/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) console.error('[ke-hoach] truy vấn lỗi:', e)
    return dpr
  }
}

/** `mom_bai.qid_json` → mảng qid; NULL/hỏng → undefined (bài cũ: không chống trùng, không lỗi). */
function docQid(v: unknown): string[] | undefined {
  if (typeof v !== 'string' || !v) return undefined
  try {
    const a = JSON.parse(v) as unknown
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x !== '') : undefined
  } catch {
    return undefined
  }
}

/** Ngày nghỉ thầy đặt: `cau_hinh.ngay_nghi` = mảng JSON hoặc chuỗi cách nhau bởi dấu phẩy/xuống dòng. */
export async function docNgayNghi(env: Env): Promise<Set<string>> {
  const r = await tat(() => env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'ngay_nghi'").first<{ gia_tri: string }>(), null)
  return phanTichNgayNghi(String(r?.gia_tri ?? ''))
}

/**
 * CẤU HÌNH LIÊN QUAN KẾ HOẠCH, đọc trong MỘT truy vấn (không thêm chi phí D1 cho đường lập kế hoạch):
 * `ngay_nghi` (ngày nghỉ thầy đặt) + `ngan_sach_luot` (cờ dùng CHUNG ngân sách ngày & bộ chọn §7.1).
 */
export async function docCauHinhKeHoach(env: Env): Promise<{ ngayNghi: Set<string>; nganSachChung: boolean }> {
  const r = await tat(() => env.DB.prepare(
    "SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN ('ngay_nghi', 'ngan_sach_luot')",
  ).all<{ khoa: string; gia_tri: string }>(), trong())
  let nghi = ''
  let chung = false
  for (const x of r.results ?? []) {
    if (String(x.khoa) === 'ngay_nghi') nghi = String(x.gia_tri ?? '')
    else if (String(x.khoa) === 'ngan_sach_luot') chung = String(x.gia_tri ?? '').trim() === 'bat'
  }
  return { ngayNghi: phanTichNgayNghi(nghi), nganSachChung: chung }
}

/** Phần thuần của `docNgayNghi`: đọc giá trị `cau_hinh.ngay_nghi` (mảng JSON hoặc chuỗi cách nhau bởi dấu phẩy/chấm phẩy/khoảng trắng) thành tập ngày YYYY-MM-DD. */
export function phanTichNgayNghi(giaTri: string): Set<string> {
  const v = giaTri.trim()
  let ds: unknown[] = []
  if (v.startsWith('[')) {
    try { ds = JSON.parse(v) as unknown[] } catch { ds = [] }
  } else ds = v.split(/[,;\s]+/)
  return new Set(ds.map((x) => String(x).trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)))
}

/**
 * Tập qid phục vụ được trong `qids`; `null` = KHÔNG lọc (chưa lập chỉ mục game nào — máy chủ mới/fixture cũ — hoặc truy vấn lỗi). Lọc khi chưa có chỉ mục sẽ
 * làm trống việc ôn của cả trường, mà lệnh lấy đề lúc đó cũng không phục vụ được gì: giữ hành vi cũ.
 * `coChiMucDaBiet`/`baoVeDaBiet` (HẠ TẢI D1, Boss 22/09 M3): một lượt xử lý có thể gọi hàm này 2-3 lần (câu tới hạn, câu
 * ôn thi, bộ não kéo sớm) — truyền hai giá trị đã đọc MỘT LẦN đầu request để khỏi quét lại `game_v2_index`/`ca` mỗi lần.
 */
async function tapQidPhucVu(
  env: Env, qids: string[], coChiMucDaBiet?: boolean, baoVeDaBiet?: { baoVe: Set<string> | null; kiemDuocBaoVe: boolean },
): Promise<Set<string> | null> {
  if (qids.length === 0) return null
  try {
    const coChiMuc = coChiMucDaBiet ?? Boolean(await env.DB.prepare('SELECT 1 AS x FROM game_v2_index LIMIT 1').first())
    if (!coChiMuc) return null
    return (await qidPhucVuDuoc(env, qids, baoVeDaBiet)).duoc
  } catch (e) {
    console.error('[ke-hoach] không kiểm được qid phục vụ được (giữ nguyên hàng ôn):', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * CỔNG PHẠM VI HỌC cho các danh sách TỰ ĐỘNG của kế hoạch ngày (CNH-1.0 P02 — đặc tả 02 §2).
 *
 * Trả TẬP "bị loại" theo khoá `sbd\u0000qid`; `null` = KHÔNG lọc (cờ TẮT, lô rỗng, hoặc lỗi đọc ⇒ giữ hành vi cũ).
 * Cờ TẮT ⇒ không truy vấn thêm nào (ngoài một lần đọc cờ đã có đệm 30 giây trong isolate).
 * Cờ BẬT ⇒ câu thiếu nhãn `kienThuc`, chưa duyệt, hoặc kỹ năng chưa `taught` BỊ LOẠI — thiếu thì TRẢ THIẾU,
 * KHÔNG nới lọc và KHÔNG fallback sang kho lớp/toàn ngân hàng.
 * ÁNH XẠ TẠM (cần thầy xác nhận nhãn): `kienThuc` → skill_ids; `reviewed` → approved; nền (prerequisite) rỗng.
 */
export async function locPhamViChoKeHoach(
  env: Env, cap: readonly { sbd: string; qid: string }[], bat: boolean,
): Promise<Set<string> | null> {
  if (!bat || cap.length === 0) return null
  try {
    const phamViTheoEm = await docPhamViNhieu(env, [...new Set(cap.map((x) => x.sbd))])
    const qids = [...new Set(cap.map((x) => x.qid))]
    const nhan = new Map<string, { skillIds: string[]; version: string; group: string; approved: boolean }>()
    for (let i = 0; i < qids.length; i += 400) {
      const r = await env.DB.prepare(
        `SELECT q.qid, q.version, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
           JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
          WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`,
      ).bind(JSON.stringify(qids.slice(i, i + 400))).all<{ qid: string; version: string; content_group: string; json: string }>()
      for (const x of r.results ?? []) {
        const qid = String(x.qid)
        if (nhan.has(qid)) continue
        let json: Record<string, unknown> = {}
        try { json = JSON.parse(String(x.json)) as Record<string, unknown> } catch { continue }
        nhan.set(qid, {
          skillIds: Array.isArray(json.kienThuc) ? (json.kienThuc as string[]) : [],
          version: String(x.version ?? ''), group: String(x.content_group ?? ''), approved: json.reviewed === true,
        })
      }
    }
    const loai = new Set<string>()
    for (const c of cap) {
      const m = phamViTheoEm.get(c.sbd) ?? new Map<string, never>()
      const n = nhan.get(c.qid)
      const kq = n
        ? eligibleScope({
            qid: c.qid, version: n.version, contentGroup: n.group, skillIds: n.skillIds,
            prerequisiteIds: [], qualityStatus: n.approved ? 'approved' : 'chua_duyet',
          }, m)
        : { duoc: false as const, lyDo: 'THIEU_NHAN' as const }
      if (!kq.duoc) loai.add(`${c.sbd}\u0000${c.qid}`)
    }
    return loai
  } catch (e) {
    console.error('[ke-hoach] lọc phạm vi lỗi (giữ hành vi cũ, KHÔNG lọc):', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * TỔNG HỢP MỘT LƯỢT (HẠ TẢI D1, Boss 22/09 M3): MỘT truy vấn quét `su_kien_hoc` của lô em, thay cho BỐN truy vấn riêng
 * trước đây (đếm tổng số dòng sổ để biết hồ sơ cũ hay mới · tiến bộ hôm nay cho nhiệm vụ ngày/EXP, định nghĩa
 * `TIEN_BO_NGAY` · số câu HIỂN THỊ hôm nay, định nghĩa `cau-da-lam.ts` (ngưỡng `luc >= tuLuc` khác ngưỡng "tiến bộ",
 * CỐ Ý không gộp hai định nghĩa) · giây đo tốc độ trong `SO_NGAY_DO_VAN_TOC` ngày gần đây). CÙNG một lượt quét, mỗi
 * cột một điều kiện `CASE` giữ NGUYÊN điều kiện của truy vấn gốc — không đổi kết quả, chỉ đỡ ba lượt quét thêm.
 * Tham số theo đúng thứ tự các dấu `?`: homNay ×6 (bốn cột tiến bộ + hai cột hiển thị), tuLuc ×2, ngay30 ×1, rồi ds.
 */
export const TONG_HOP_EM_NGAY = `SELECT e.sbd,
       COUNT(*) AS so_su_kien,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? THEN e.qid END) AS da_lam,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.ket_qua = 1 THEN e.qid END) AS dung,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.ket_qua = 1 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND (p.ket_qua = 0 OR p.ket_qua IS NULL)) THEN e.qid END) AS len_bac,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.ket_qua = 0 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND p.ket_qua = 1) THEN e.qid END) AS tut_bac,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.luc >= ? AND e.ket_qua IS NOT NULL THEN e.qid END) AS hien_thi_so_cau,
       COUNT(DISTINCT CASE WHEN e.ngay_vn = ? AND e.luc >= ? AND e.ket_qua = 1 THEN e.qid END) AS hien_thi_so_dung,
       GROUP_CONCAT(CASE WHEN e.giay IS NOT NULL AND e.ngay_vn >= ? THEN e.giay END) AS giay_list
  FROM su_kien_hoc e
 WHERE e.sbd IN (SELECT value FROM json_each(?))
 GROUP BY e.sbd`

export interface TongHopEm {
  soSuKien: number
  daLam: number
  dung: number
  lenBac: number
  tutBac: number
  hienThiSoCau: number
  hienThiSoDung: number
  mauGiay: number[]
}

function docTongHopHang(rows: Record<string, unknown>[]): Map<string, TongHopEm> {
  const ra = new Map<string, TongHopEm>()
  for (const x of rows) {
    const giayTxt = x.giay_list ? String(x.giay_list) : ''
    ra.set(String(x.sbd), {
      soSuKien: Number(x.so_su_kien) || 0, daLam: Number(x.da_lam) || 0, dung: Number(x.dung) || 0,
      lenBac: Number(x.len_bac) || 0, tutBac: Number(x.tut_bac) || 0,
      hienThiSoCau: Number(x.hien_thi_so_cau) || 0, hienThiSoDung: Number(x.hien_thi_so_dung) || 0,
      mauGiay: giayTxt ? giayTxt.split(',').map(Number).filter((n) => Number.isFinite(n)) : [],
    })
  }
  return ra
}

/** Chạy `TONG_HOP_EM_NGAY`; `null` khi lỗi đọc (nơi gọi giữ mặc định, không bịa số — như mọi truy vấn "hiển thị" khác). */
export async function docTongHop(env: Env, arr: string, homNay: string, tuLuc: string, ngay30: string, denLuc?: string): Promise<Map<string, TongHopEm> | null> {
  try {
    // Chỉ đếm sự kiện đã xảy ra: khi sự kiện tương lai tới giờ, fingerprint đổi và replay tự chạy.
    const sql = denLuc ? TONG_HOP_EM_NGAY.replace(' GROUP BY e.sbd', ' AND julianday(e.luc) <= julianday(?) GROUP BY e.sbd') : TONG_HOP_EM_NGAY
    const args: unknown[] = [homNay, homNay, homNay, homNay, homNay, tuLuc, homNay, tuLuc, ngay30, arr]
    if (denLuc) args.push(denLuc)
    const r = await env.DB.prepare(sql).bind(...args).all<Record<string, unknown>>()
    return docTongHopHang(r.results ?? [])
  } catch (e) {
    console.error('[ke-hoach] không đọc được tổng hợp sổ học (bỏ tiến bộ/hiển thị hôm nay):', e instanceof Error ? e.message : e)
    return null
  }
}

// --- Gom đầu vào -------------------------------------------------------------------------

/** Bổ sung TUỲ CHỌN cho `docDauVao` — dữ liệu nơi gọi (`lapVaLuuKeHoach`) ĐÃ có sẵn từ CÙNG một lượt xử lý, dùng thay vì đọc lại D1 (HẠ TẢI, Boss 22/09 M3). */
export interface DauVaoBoSung {
  /** Hồ sơ ĐẦY ĐỦ (không chỉ phần thay đổi) của các em vừa `dungLaiHoSo` trong lượt này. Em không có ở đây ⇒ đọc D1 như cũ. */
  hoSoSan?: Map<string, { cau: NamKtCau[]; dang: NamKtDang[] }>
  /** Tổng hợp `su_kien_hoc` hôm nay (tiến bộ, số câu hiển thị, giây tốc độ) nơi gọi đã đọc. `null` = đã thử và lỗi (giữ mặc định, không đọc lại). */
  tongHop?: Map<string, TongHopEm> | null
}

export async function docDauVao(env: Env, dsSbd: string[], now: number, bo: DauVaoBoSung = {}): Promise<Map<string, DauVaoKeHoach>> {
  const em = [...new Set(dsSbd)]
  const arr = json(em)
  const homNay = ngayVn(now)
  const nowIso = new Date(now).toISOString()
  const cat14 = new Date(now - NGAY_LIET_KE_QUA_HAN * MOT_NGAY_MS).toISOString()
  const ngay30 = themNgay(homNay, -SO_NGAY_DO_VAN_TOC)
  const ngayLs = themNgay(homNay, -SO_NGAY_LICH_SU)
  // HẠ TẢI (Boss 21/09, D1 nghẽn): các truy vấn ĐỘC LẬP chỉ-đọc dưới đây chạy SONG SONG (trước đây tuần tự ~30 lượt chờ hàng đợi D1, mỗi lượt trả phí chờ; song song trả một lần). Kết quả dùng đúng chỗ cũ, đầu ra không đổi.
  // Mỗi lời hứa dưới đây KHÔNG ném lỗi (đã bọc `tat`) trừ khi ghi chú khác; ai ném thì được chặn cảnh báo chưa xử lý và vẫn ném đúng chỗ `await` cũ.
  const chan = <T,>(p: Promise<T>): Promise<T> => { p.catch(() => undefined); return p }
  // HẠ TẢI (Boss 22/09 M3): em có hồ sơ vừa dựng lại (`hoSoSan`) thì KHÔNG đọc `nam_kt_cau`/`nam_kt_dang` từ D1 nữa — hồ sơ nguồn không đổi giữa lúc dựng và lúc đọc lại (cùng một lượt xử lý); chỉ đọc D1 cho phần em còn lại (lô cron trộn em cũ/mới).
  const hoSoSan = bo.hoSoSan
  const emCanDocHoSo = hoSoSan ? em.filter((s) => !hoSoSan.has(s)) : em
  const arrCanDoc = json(emCanDocHoSo)
  const pCauHinh = chan(docCauHinhKeHoach(env))
  const pKhoiLop = chan(docKhoiVaLopCacEm(env, em).catch(() => ({ khoi: new Map<string, Khoi | null>(), lop: new Map<string, string>() })))
  const pRc = emCanDocHoSo.length === 0 ? Promise.resolve(trong<Record<string, unknown>>()) : chan(tat(() => env.DB.prepare(
    `SELECT sbd, qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau
      WHERE ${IN_EM} AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc','chua_thay_sai') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?`,
  ).bind(arrCanDoc, homNay).all<Record<string, unknown>>(), trong()))
  const pRd = emCanDocHoSo.length === 0 ? Promise.resolve(trong<Record<string, unknown>>()) : chan(tat(() => env.DB.prepare(`SELECT * FROM nam_kt_dang WHERE ${IN_EM}`).bind(arrCanDoc).all<Record<string, unknown>>(), trong()))
  const pRn = emCanDocHoSo.length === 0 ? Promise.resolve(trong<Record<string, unknown>>()) : chan(tat(() => env.DB.prepare(`SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE ${IN_EM} AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd`).bind(arrCanDoc).all<Record<string, unknown>>(), trong()))
  // Phục vụ được: `game_v2_index` có chỉ mục chưa (1 dòng) + đề đang bảo vệ (`ca`) — MỘT LẦN cho cả lượt (dưới còn 1-2 chỗ khác cần dùng lại, xem `coChiMuc`/`baoVe`).
  const pCoChiMuc = chan(tat(() => env.DB.prepare('SELECT 1 AS x FROM game_v2_index LIMIT 1').first(), null).then(Boolean))
  const pBaoVe = chan(baoVeMotLuot(env))
  const pTongHop = bo.tongHop !== undefined
    ? Promise.resolve(bo.tongHop)
    : chan((async () => { try { return await docTongHop(env, arr, homNay, tuLucHomNay(await docMocHienThi(env), now), ngay30, new Date(now).toISOString()) } catch { return null } })())
  const pRh = chan(tat(() => env.DB.prepare(`SELECT sbd, ngay, ket_qua FROM ke_hoach_ngay WHERE ${IN_EM} AND ngay < ? AND ngay >= ? ORDER BY ngay DESC`).bind(arr, homNay, ngayLs).all<Record<string, unknown>>(), trong()))
  const pRp = chan(tat(() => env.DB.prepare(`SELECT sbd, minutes FROM study_preferences WHERE ${IN_EM}`).bind(arr).all<Record<string, unknown>>(), trong()))
  const pRk = chan(tat(() => env.DB.prepare(`SELECT sbd, id, dang FROM game_v2_task WHERE ${IN_EM} AND completed_at IS NULL`).bind(arr).all<Record<string, unknown>>(), trong()))
  const denCa = new Date(now + NGAY_ON_THI * MOT_NGAY_MS).toISOString()
  // HẠ TẢI D1 (Boss 22/09): ca sắp mở đệm 30 giây (đọc qua docCaSapMo, game-v2-bank.ts — dùng chung móc bất hoạt với protectedQuestions).
  const pRca = chan(tat(() => docCaSapMo(env, nowIso, denCa), []))
  const pDieuChinh = chan(docDieuChinhHieuLuc(env, em, homNay)) // có thể ném lỗi: ném ở chỗ await cuối như cũ
  const pRb = chan((async () => {
    // BTVN chưa nộp (còn hạn hoặc mới quá hạn ≤ 14 ngày). Có phòng vệ khi cột `lo_da_xong` chưa có.
    const q = (cot: string, them = '') => `SELECT be.sbd, be.ma_btvn, ${cot} AS lo, b.so_cau, b.giao_luc, b.han_nop${them}
         FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd IN (SELECT value FROM json_each(?)) AND be.thu_hoi = 0 AND b.da_xoa = 0 AND be.nop_luc IS NULL AND b.han_nop > ?`
    // Ba cột BTVN "nâng đỡ" (migration-2109-btvn-nang-do.sql): chưa chạy migration thì lùi về truy vấn cũ, bài nào cũng là bài cũ.
    let rb = await tat(() => env.DB.prepare(q('COALESCE(be.lo_da_xong, 0)', ', b.ca_nhan, be.so_cau_em, be.chot_luc, be.chang_mo_json')).bind(arr, cat14).all<Record<string, unknown>>(), null)
    if (!rb) rb = await tat(() => env.DB.prepare(q('COALESCE(be.lo_da_xong, 0)')).bind(arr, cat14).all<Record<string, unknown>>(), null)
    if (!rb) rb = await tat(() => env.DB.prepare(q('0')).bind(arr, cat14).all<Record<string, unknown>>(), trong())
    return rb
  })())
  const pRm = chan((async () => {
    // Mom chưa nộp: đã bắt đầu (còn hạn 120 phút hoặc mới quá hạn ≤ 14 ngày, để liệt kê quá hạn) VÀ chưa bắt đầu (không hạn cứng nhưng vẫn là
    // việc em nợ). Bài hằng ngày `daily_<ngày>` của ngày cũ mà chưa bắt đầu thì bỏ ngay ở SQL — mỗi ngày một bài, không để dồn lại.
    // `qid_json` (mã câu của bài) có từ migration-1909-mom-qid.sql; chưa có cột thì đọc như cũ, không chống trùng được.
    const qm = (cot: string) => `SELECT sbd, id, question_count, created_at, started_at, ${cot} AS qid_json FROM mom_bai
        WHERE ${IN_EM} AND submitted_at IS NULL AND ((started_at IS NOT NULL AND started_at > ?) OR (started_at IS NULL AND (id NOT LIKE 'daily_%' OR id = ?)))`
    const tamMom = [arr, cat14, `daily_${ngayHocMom(now)}`] as const
    let rm = await tat(() => env.DB.prepare(qm('qid_json')).bind(...tamMom).all<Record<string, unknown>>(), null)
    if (!rm) rm = await tat(() => env.DB.prepare(qm('NULL')).bind(...tamMom).all<Record<string, unknown>>(), trong())
    return rm
  })())
  const cauHinh = await pCauHinh
  const nghi = cauHinh.ngayNghi

  const map = new Map<string, DauVaoKeHoach>()
  for (const sbd of em) {
    map.set(sbd, {
      sbd, now, homNay, phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [], nhiemVuThanThu: [],
      caSapToi: [], cauOnThi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: nghi.has(homNay),
    })
  }
  const cua = (x: Record<string, unknown>) => map.get(String(x.sbd))
  // LUẬT KHỐI (Boss 21/09): hàng ôn chỉ nhận câu khối em hoặc THẤP hơn — kể cả câu khối cao đã lọt vào sổ của em từ trước (mã tờ ở đầu qid). Không đọc được khối ⇒ không lọc.
  const { khoi: khoiEm, lop: lopEm } = await pKhoiLop
  const hopKhoi = (x: Record<string, unknown>) => cauHopKhoi(khoiEm.get(String(x.sbd)), String(x.qid))
  const coChiMuc = await pCoChiMuc
  const baoVe = await pBaoVe

  const rb = await pRb
  const baiChot = new Map<string, { chotLuc: string; sbd: string; lich: string | null }>() // `<ma_btvn>|<sbd>` → bài cá nhân hoá ĐÃ chốt (cần kích cỡ từng chặng)
  for (const x of rb.results ?? []) {
    const caNhan = Number(x.ca_nhan) === 1
    const chotLuc = caNhan && x.chot_luc ? String(x.chot_luc) : null
    if (chotLuc) baiChot.set(`${x.ma_btvn}|${x.sbd}`, { chotLuc, sbd: String(x.sbd), lich: x.chang_mo_json ? String(x.chang_mo_json) : null })
    cua(x)?.btvn.push({
      ma: String(x.ma_btvn), soCau: chotLuc ? Number(x.so_cau_em) || 0 : Number(x.so_cau) || 0, giaoLuc: String(x.giao_luc ?? ''), hanNop: String(x.han_nop ?? ''), loDaXong: Number(x.lo) || 0, daNop: false,
      ...(caNhan ? { caNhan: { chotLuc, cacChang: [] } } : {}),
    })
  }
  // Bài cá nhân hoá đã chốt: lô ≡ chặng — một truy vấn cho kích cỡ từng chặng của cả lô em.
  if (baiChot.size > 0) {
    const rcg = await tat(() => env.DB.prepare(
      `SELECT ma_btvn, sbd, chang, COUNT(*) AS n, json_group_array(qid) AS qids FROM btvn_em_cau WHERE chang >= 0 AND sbd IN (SELECT value FROM json_each(?)) AND ma_btvn IN (SELECT value FROM json_each(?)) GROUP BY ma_btvn, sbd, chang ORDER BY chang`,
    ).bind(arr, json([...new Set([...baiChot.keys()].map((k) => k.split('|')[0]))])).all<Record<string, unknown>>(), trong())
    const soCauChang = new Map<string, number[]>()
    const qidChang = new Map<string, string[][]>()
    for (const x of rcg.results ?? []) {
      const k = `${x.ma_btvn}|${x.sbd}`
      if (baiChot.has(k)) {
        soCauChang.set(k, [...(soCauChang.get(k) ?? []), Number(x.n) || 0])
        // Mã câu ĐÃ CHỐT của chặng (RV07 phụ: `coverage` đếm được task cùng kỹ năng) — cùng truy vấn, không thêm D1.
        qidChang.set(k, [...(qidChang.get(k) ?? []), docQid(x.qids) ?? []])
      }
    }
    for (const c of map.values()) {
      for (const b of c.btvn) {
        const k = `${b.ma}|${c.sbd}`
        const ban = baiChot.get(k)
        const kc = soCauChang.get(k)
        if (!b.caNhan || !ban || !kc) continue
        // Bản 1.1: lịch ĐÃ LƯU lúc chốt (chặng theo giờ khi hạn ngắn); bài chốt trước bản 1.1 ⇒ `moLucChang` cũ.
        const moLuc = docLichDaLuu(ban.lich, kc.length, { chotLuc: ban.chotLuc, hanNop: b.hanNop, nowMs: now })?.moLuc ?? moLucChang(ban.chotLuc, kc.length)
        b.caNhan = { chotLuc: ban.chotLuc, cacChang: kc.map((n, i) => ({ soCau: n, moLuc: moLuc[i]! })) }
        const qidTheoChang: Record<number, string[]> = {}
        for (let i = 0; i < kc.length; i++) { const q = qidChang.get(k)?.[i] ?? []; if (q.length) qidTheoChang[i] = q }
        if (Object.keys(qidTheoChang).length) b.qidTheoChang = qidTheoChang
      }
    }
  }

  const rm = await pRm
  for (const x of rm.results ?? []) {
    cua(x)?.mom.push({ id: String(x.id), soCau: Number(x.question_count) || 0, taoLuc: String(x.created_at ?? ''), batDauLuc: x.started_at ? String(x.started_at) : null, qid: docQid(x.qid_json) })
  }

  // Hồ sơ: câu tới hạn ôn (cả câu chưa từng sai khi FSRS đã tới hạn), dạng, và số câu sai chưa khắc phục.
  // Em có `hoSoSan` (sổ vừa đổi, hồ sơ vừa dựng lại trong CHÍNH lượt này) ⇒ lọc TRONG BỘ NHỚ, không đọc lại D1; em khác vẫn đọc D1 (`rc`/`rd`/`rn`, đã thu hẹp còn `emCanDocHoSo` ở trên).
  const rc = await pRc
  const denHanTuBoNho: Record<string, unknown>[] = hoSoSan
    ? [...hoSoSan.entries()].flatMap(([sbd, h]) => h.cau
        .filter((c) => (c.trangThai === 'moi_sai' || c.trangThai === 'dang_on' || c.trangThai === 'da_khac_phuc' || c.trangThai === 'chua_thay_sai') && !c.canDayLai && c.mocOnKe !== null && c.mocOnKe <= homNay)
        .map((c) => ({ sbd, qid: c.qid, ma_dang: c.maDang, moc_on_ke: c.mocOnKe, lan_sai: c.lanSai })))
    : []
  const denHan = [...(rc.results ?? []), ...denHanTuBoNho]
  const phucVu = await tapQidPhucVu(env, denHan.map((x) => String(x.qid)), coChiMuc, baoVe)
  // CỔNG PHẠM VI HỌC (P02): đọc cờ MỘT LẦN cho cả hai danh sách tự động của lượt này.
  const batPhamViHoc = await phamViBat(env)
  const phamViToiHan = await locPhamViChoKeHoach(env, denHan.map((x) => ({ sbd: String(x.sbd), qid: String(x.qid) })), batPhamViHoc)
  for (const x of denHan) {
    if (phucVu && !phucVu.has(String(x.qid))) continue
    if (!hopKhoi(x)) continue
    if (phamViToiHan?.has(`${String(x.sbd)}\u0000${String(x.qid)}`)) continue
    cua(x)?.cauToiHan.push({ qid: String(x.qid), maDang: x.ma_dang ? String(x.ma_dang) : null, mocOnKe: String(x.moc_on_ke), lanSai: Number(x.lan_sai) || 0 })
  }
  const rd = await pRd
  for (const x of rd.results ?? []) {
    cua(x)?.dang.push({
      sbd: String(x.sbd), maDang: String(x.ma_dang), soGap: Number(x.so_gap), soSai: Number(x.so_sai), soDaKhacPhuc: Number(x.so_da_khac_phuc),
      soMoiSai: Number(x.so_moi_sai), soChuaThaySai: Number(x.so_chua_thay_sai), bac: Number(x.bac),
      mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? String(x.moc_moi_sai) : null,
    } satisfies NamKtDang)
  }
  if (hoSoSan) for (const [sbd, h] of hoSoSan) for (const d of h.dang) { const c = map.get(sbd); if (c) c.dang.push(d) }
  const rn = await pRn
  for (const x of rn.results ?? []) { const c = cua(x); if (c) c.soCauChuaKhacPhuc = Number(x.n) || 0 }
  if (hoSoSan) for (const [sbd, h] of hoSoSan) { const c = map.get(sbd); if (c) c.soCauChuaKhacPhuc = h.cau.filter((x) => x.trangThai === 'moi_sai' || x.trangThai === 'dang_on').length }

  // Tốc độ đo thật từ sổ (chỉ những nguồn có đo giây — hiện là ca thi) + tiến bộ hôm nay + số câu hiển thị hôm nay: MỘT truy vấn gộp (`pTongHop`, HẠ TẢI M3).
  const tongHop = await pTongHop
  // Đọc lỗi (tongHop === null) ⇒ giữ mặc định `daLamHomNay = {soCau:0,...}` (như `tat()` mọi nơi khác) và VẮNG khoá `soCauHienThi` (không bịa 0, như trước).
  // Đọc THÀNH CÔNG ⇒ set cho MỌI em trong lô, kể cả em chưa có dòng sổ nào (`tongHop` chỉ có mặt em ĐÃ từng có sự kiện) — như `docCauDaLamHomNay` cũ vẫn set 0 cho toàn lô.
  if (tongHop) for (const sbd of em) {
    const c = map.get(sbd)
    if (!c) continue
    const t = tongHop.get(sbd)
    c.mauGiay = t?.mauGiay ?? []
    // "lên bậc" = đúng lại câu từng sai/trống, "tụt bậc" = sai lại câu từng đúng (định nghĩa `TIEN_BO_NGAY`, không đổi).
    c.daLamHomNay = { soCau: t?.daLam ?? 0, lenBac: t?.lenBac ?? 0, tutBac: t?.tutBac ?? 0, dung: t?.dung ?? 0 }
    // SỐ CÂU HIỂN THỊ (một định nghĩa, `cau-da-lam.ts`): KHÔNG thay `soCau` ở trên (nuôi luật đạt ngày/EXP/khiên) — chỉ thêm khoá.
    c.daLamHomNay.soCauHienThi = t?.hienThiSoCau ?? 0
  }

  // Lịch sử kết quả các ngày trước.
  const rh = await pRh
  for (const x of rh.results ?? []) {
    const k = x.ket_qua === 'dat' || x.ket_qua === 'mot_phan' || x.ket_qua === 'khong' ? x.ket_qua : null
    cua(x)?.lichSu.push({ ngay: String(x.ngay), ketQua: k })
  }
  // Ngày nghỉ trong cửa sổ lịch sử cũng phải "không đứt": thêm mục null cho ngày nghỉ chưa có dòng.
  for (const c of map.values()) {
    const co = new Set(c.lichSu.map((h) => h.ngay))
    for (const n of nghi) if (n < homNay && n >= ngayLs && !co.has(n)) c.lichSu.push({ ngay: n, ketQua: null })
    c.lichSu.sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0))
  }

  // Phút học/ngày em đã đặt, nhiệm vụ thần thú phụ huynh nhắc.
  const rp = await pRp
  for (const x of rp.results ?? []) {
    const c = cua(x)
    if (c) c.phutNgay = Math.max(PHUT_NGAY_TOI_THIEU, Math.min(PHUT_NGAY_TOI_DA, Number(x.minutes) || 0)) || null
  }
  const rk = await pRk
  for (const x of rk.results ?? []) cua(x)?.nhiemVuThanThu.push({ id: String(x.id), dang: String(x.dang) })

  // Ca thi sắp tới của lớp em (một truy vấn cho cả lô — `lopEm` đã đọc chung với khối ở `pKhoiLop`, đỡ một truy vấn `hoc_sinh` riêng).
  const rca = await pRca
  for (const c of map.values()) {
    for (const x of rca) {
      const lopCa = x.lop.trim()
      if (lopCa && lopCa !== lopEm.get(c.sbd)) continue
      c.caSapToi.push({ maCa: x.maCa, tenCa: x.tenCa, batDau: x.batDau })
    }
  }

  // Ứng viên cho việc `on_thi` — CHỈ em có ca sắp tới (không tốn truy vấn nào khi không có ca): câu từng sai còn đang ôn, lệnh lấy đề phục vụ được.
  // Em có `hoSoSan` ⇒ lọc trong bộ nhớ (cùng luật lọc); em khác mới đọc D1, và chỉ cho phần còn lại.
  const emCoCa = [...map.values()].filter((c) => c.caSapToi.length > 0).map((c) => c.sbd)
  if (emCoCa.length > 0) {
    const emCoCaCanDoc = hoSoSan ? emCoCa.filter((s) => !hoSoSan.has(s)) : emCoCa
    const ro = emCoCaCanDoc.length === 0 ? trong<Record<string, unknown>>() : await tat(() => env.DB.prepare(
      `SELECT sbd, qid, lan_sai, trang_thai FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') AND can_day_lai = 0`,
    ).bind(json(emCoCaCanDoc)).all<Record<string, unknown>>(), trong())
    const ungTuBoNho: Record<string, unknown>[] = hoSoSan
      ? emCoCa.filter((s) => hoSoSan.has(s)).flatMap((sbd) => hoSoSan.get(sbd)!.cau
          .filter((c) => (c.trangThai === 'moi_sai' || c.trangThai === 'dang_on') && !c.canDayLai)
          .map((c) => ({ sbd, qid: c.qid, lan_sai: c.lanSai, trang_thai: c.trangThai })))
      : []
    const ung = [...(ro.results ?? []), ...ungTuBoNho]
    const phucVuThi = await tapQidPhucVu(env, [...new Set(ung.map((x) => String(x.qid)))], coChiMuc, baoVe)
    const phamViThi = await locPhamViChoKeHoach(env, ung.map((x) => ({ sbd: String(x.sbd), qid: String(x.qid) })), batPhamViHoc)
    for (const x of ung) {
      if (phucVuThi && !phucVuThi.has(String(x.qid))) continue
      if (!hopKhoi(x)) continue
      if (phamViThi?.has(`${String(x.sbd)}\u0000${String(x.qid)}`)) continue
      cua(x)?.cauOnThi?.push({ qid: String(x.qid), lanSai: Number(x.lan_sai) || 0, moiSai: String(x.trang_thai) === 'moi_sai' })
    }
  }
  // BỘ NÃO A.I (chế độ THẬT): điều chỉnh còn hạn của các em — nhịp vào ngân sách ngày; `on_som` kéo `moc_on_ke` của câu vừa sai thuộc dạng đó VỀ NGÀY MAI (chỉ SỚM hơn).
  // Chạy thử / tắt ⇒ `docDieuChinhHieuLuc` trả rỗng, kế hoạch Y HỆT (một truy vấn cấu hình). Không đụng hạn nộp bài nào.
  const dieuChinh = await pDieuChinh
  for (const [sbd, dc] of dieuChinh) {
    const c = map.get(sbd)
    if (!c) continue
    if (dc.nhip !== 0) c.boNao = { nhip: dc.nhip }
    if (dc.onSom.length > 0) await keoOnSom(env, c, dc.onSom, themNgay(dc.ngay, 1), homNay, hopKhoi, coChiMuc, baoVe)
  }
  // CNH-1.0 RV07 mục 7 (02 §7.1): SẮP lại hai danh sách TỰ ĐỘNG của kế hoạch bằng CHÍNH bộ chọn chung.
  // Cờ đọc GỘP trong `docCauHinhKeHoach` (không thêm truy vấn cho đường lập kế hoạch).
  await sapDanhSachTuDongTheoBoChon(env, map, homNay, now, cauHinh.nganSachChung)
  return map
}

/**
 * RV07 mục 7 (02 §7.1): hai danh sách TỰ ĐỘNG của kế hoạch (`cauToiHan`, `cauOnThi`) đi qua CHÍNH bộ chọn chung
 * (`chonCauChoLuot`) — cùng pipeline với mọi kênh: trần độ khó theo mức đang luyện → luật lặp/family → điểm §7.2.
 *
 * KHÔNG đổi luật của kế hoạch: `tapQidPhucVu` đã lọc BẢO VỆ + phục vụ được TRƯỚC đó (giữ nguyên), ngân sách/tổng câu
 * vẫn do kế hoạch quyết (bộ chọn ở đây chỉ ĐỔI THỨ TỰ và LOẠI câu không hợp lệ ⇒ kế hoạch có thể NGẮN hơn, không dài thêm).
 * Cờ `cau_hinh.ngan_sach_luot` TẮT (mặc định) ⇒ giữ nguyên hành vi cũ, không truy vấn thêm.
 */
async function sapDanhSachTuDongTheoBoChon(env: Env, map: Map<string, DauVaoKeHoach>, homNay: string, now: number, bat: boolean): Promise<void> {
  if (!bat) return
  for (const c of map.values()) {
    const qids = [...new Set([...c.cauToiHan.map((x) => x.qid), ...(c.cauOnThi ?? []).map((x) => x.qid)])]
    if (qids.length === 0) continue
    // Nhãn cần cho bộ chọn (nhóm/dạng/mức/kỹ năng/family/version) đọc từ CHÍNH kho đã phục vụ.
    const nhan = new Map<string, { version: string; group: string; dang: string | null; mucDo: string | null; skillIds: string[]; family: string | null }>()
    for (let i = 0; i < qids.length; i += 400) {
      const r = await tat(() => env.DB.prepare(
        `SELECT q.qid, q.version, q.content_group, q.dang, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
           JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
          WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`,
      ).bind(json(qids.slice(i, i + 400))).all<{ qid: string; version: string; content_group: string; dang: string | null; json: string }>(), trong())
      for (const x of r.results ?? []) {
        if (nhan.has(String(x.qid))) continue
        let j: { kienThuc?: unknown; mucDo?: unknown } = {}
        try { j = JSON.parse(String(x.json)) as typeof j } catch { /* dòng hỏng: bỏ */ }
        nhan.set(String(x.qid), {
          version: String(x.version ?? ''), group: String(x.content_group ?? ''), dang: x.dang ? String(x.dang) : null,
          mucDo: typeof j.mucDo === 'string' ? j.mucDo : null,
          skillIds: Array.isArray(j.kienThuc) ? (j.kienThuc as string[]) : [],
          family: familyTuNhan(j),
        })
      }
    }
    const ungVien: CauUngVien[] = []
    for (const qid of qids) {
      const n = nhan.get(qid)
      if (!n) continue // không đọc được nhãn ⇒ không đưa vào bộ chọn (KHÔNG đoán)
      ungVien.push({ qid, version: n.version, part: 'I', mucDo: n.mucDo, group: n.group, dangKey: n.dang ?? n.group, skillIds: n.skillIds, familyId: n.family })
    }
    if (ungVien.length === 0) continue
    const mastery = c.cauToiHan.map((x) => ({ key: x.maDang ?? (nhan.get(x.qid)?.group ?? x.qid), due: Date.parse(`${x.mocOnKe}T00:00:00+07:00`) })).filter((m) => Number.isFinite(m.due))
    const kq = await chonCauChoLuot(env, ungVien, { sbd: c.sbd, ngay: homNay, nowMs: now, mastery, tranCau: ungVien.length })
    // §7.1: GIỮ đúng câu bộ chọn cho phát; câu bị CHẶN CỨNG (độ khó/lặp/family…) bị LOẠI khỏi danh sách.
    // Bộ chọn loại hết ⇒ danh sách RỖNG (kế hoạch NGẮN hơn, KHÔNG khôi phục câu không hợp lệ để lấp chỗ).
    const giu = new Set(kq.chon.map((v) => v.qid))
    if (giu.size === 0) {
      c.cauToiHan = []
      if (c.cauOnThi) c.cauOnThi = []
      continue
    }
    const thuTu = new Map(kq.chon.map((v, i) => [v.qid, i]))
    const theoThuTu = <T extends { qid: string }>(ds: T[]): T[] => ds.filter((x) => giu.has(x.qid)).sort((a, b) => (thuTu.get(a.qid) ?? 1e9) - (thuTu.get(b.qid) ?? 1e9))
    c.cauToiHan = theoThuTu(c.cauToiHan)
    if (c.cauOnThi) c.cauOnThi = theoThuTu(c.cauOnThi)
  }
}

/**
 * `on_som`: câu ĐÃ TỪNG sai, còn đang ôn (`moi_sai`/`dang_on`), thuộc dạng được bộ não chọn, mà mốc ôn kế còn ở tương lai ⇒ mốc HIỆU LỰC = min(mốc, ngày mai của đêm điều chỉnh).
 * CHỈ SỚM hơn, không bao giờ muộn hơn, không ghi lại `nam_kt_cau` (hồ sơ nguồn không đổi). Vào hàng ôn qua đúng cửa `cauToiHan` (cùng bộ lọc phục vụ được).
 */
async function keoOnSom(
  env: Env, c: DauVaoKeHoach, dsDang: string[], ngayMai: string, homNay: string,
  hopKhoi: (x: Record<string, unknown>) => boolean = () => true, coChiMuc?: boolean, baoVe?: { baoVe: Set<string> | null; kiemDuocBaoVe: boolean },
): Promise<void> {
  if (ngayMai > homNay) return // chưa tới "ngày mai" của đêm điều chỉnh
  const daCo = new Set(c.cauToiHan.map((x) => x.qid))
  const r = await tat(() => env.DB.prepare(
    `SELECT qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau
      WHERE sbd = ? AND ma_dang IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke > ?`,
  ).bind(c.sbd, json(dsDang), homNay).all<Record<string, unknown>>(), trong())
  const ung = (r.results ?? []).filter((x) => !daCo.has(String(x.qid)))
  const phucVu = await tapQidPhucVu(env, ung.map((x) => String(x.qid)), coChiMuc, baoVe)
  for (const x of ung) {
    if (phucVu && !phucVu.has(String(x.qid))) continue
    if (!hopKhoi({ sbd: c.sbd, qid: x.qid })) continue
    c.cauToiHan.push({ qid: String(x.qid), maDang: x.ma_dang ? String(x.ma_dang) : null, mocOnKe: ngayMai < String(x.moc_on_ke) ? ngayMai : String(x.moc_on_ke), lanSai: Number(x.lan_sai) || 0 })
  }
}

/** Số câu đã làm / lên bậc / tụt bậc trong MỘT ngày VN, mỗi em một dòng. */
export const TIEN_BO_NGAY = `SELECT e.sbd,
       COUNT(DISTINCT e.qid) AS da_lam,
       COUNT(DISTINCT CASE WHEN e.ket_qua = 1 THEN e.qid END) AS dung,
       COUNT(DISTINCT CASE WHEN e.ket_qua = 1 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND (p.ket_qua = 0 OR p.ket_qua IS NULL)) THEN e.qid END) AS len_bac,
       COUNT(DISTINCT CASE WHEN e.ket_qua = 0 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND p.ket_qua = 1) THEN e.qid END) AS tut_bac
  FROM su_kien_hoc e
 WHERE e.sbd IN (SELECT value FROM json_each(?)) AND e.ngay_vn = ?
 GROUP BY e.sbd`

// --- Lập, lưu ---------------------------------------------------------------------------

const LUU = `INSERT INTO ke_hoach_ngay (khoa, sbd, ngay, phien_ban, seed, ngan_sach_json, viec_json, canh_bao_json, ket_qua, so_cau_da_lam,
    so_cau_len_bac, so_cau_tut_bac, la_ngay_nghi, so_su_kien, cap_nhat_luc, muc_tieu_json, deferred_count, over_budget_seconds)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.n'), json_extract(j.value,'$.p'), json_extract(j.value,'$.d'),
         json_extract(j.value,'$.a'), json_extract(j.value,'$.v'), json_extract(j.value,'$.c'), NULL, json_extract(j.value,'$.l'),
         json_extract(j.value,'$.u'), json_extract(j.value,'$.t'), json_extract(j.value,'$.z'), json_extract(j.value,'$.e'), ?,
         json_extract(j.value,'$.m'), json_extract(j.value,'$.h1'), json_extract(j.value,'$.h2')
    FROM json_each(?) j WHERE 1
  ON CONFLICT(khoa) DO UPDATE SET phien_ban = excluded.phien_ban, seed = excluded.seed, ngan_sach_json = excluded.ngan_sach_json,
    viec_json = excluded.viec_json, canh_bao_json = excluded.canh_bao_json, so_cau_da_lam = excluded.so_cau_da_lam,
    so_cau_len_bac = excluded.so_cau_len_bac, so_cau_tut_bac = excluded.so_cau_tut_bac, la_ngay_nghi = excluded.la_ngay_nghi,
    so_su_kien = excluded.so_su_kien, cap_nhat_luc = excluded.cap_nhat_luc,
    deferred_count = excluded.deferred_count, over_budget_seconds = excluded.over_budget_seconds,
    -- MỤC TIÊU CORE ĐÓNG BĂNG (02 §5.2 "chốt mục tiêu đầu buổi", §6 "không tăng target sau khi gần xong"):
    -- ghi MỘT LẦN cho ngày; các lần lập lại KHÔNG được ghi đè (revision chỉ đổi qua đường boTaskLoi có lý do).
    muc_tieu_json = CASE WHEN ke_hoach_ngay.muc_tieu_json = '' THEN excluded.muc_tieu_json ELSE ke_hoach_ngay.muc_tieu_json END
  WHERE ke_hoach_ngay.ket_qua IS NULL`

/**
 * NHIỆM VỤ THẦN THÚ TỰ SINH (GĐ 5, Kênh 4): việc `than_thu` NHÃN `bu` của kế hoạch ngày ("tự phân thêm khi thiếu") thành một dòng `game_v2_task`
 * để game hiện ra như nhiệm vụ. Đường NỘI BỘ, không qua `parentGame` (luật "phụ huynh chỉ nhắc dạng có mastery" giữ nguyên).
 * Idempotent theo `id = sbd|than_thu|<ngày>|<dạng>`; không thêm khi em đã có nhiệm vụ MỞ cùng dạng (kể cả phụ huynh nhắc) hoặc đã đủ
 * NHIEM_VU_THAN_THU_MO_TOI_DA nhiệm vụ mở. Mỗi em một dòng trong lượt nên phép đếm không tự cạnh tranh trong cùng câu lệnh.
 */
const TAO_NHIEM_VU = `INSERT OR IGNORE INTO game_v2_task (id, sbd, dang, created_at)
  SELECT json_extract(j.value,'$.i'), json_extract(j.value,'$.s'), json_extract(j.value,'$.d'), ? FROM json_each(?) j
   WHERE NOT EXISTS (SELECT 1 FROM game_v2_task t WHERE t.sbd = json_extract(j.value,'$.s') AND t.dang = json_extract(j.value,'$.d') AND t.completed_at IS NULL)
     AND (SELECT COUNT(*) FROM game_v2_task t WHERE t.sbd = json_extract(j.value,'$.s') AND t.completed_at IS NULL) < ${NHIEM_VU_THAN_THU_MO_TOI_DA}`

export interface KeHoachDaLap extends KeHoachNgay {
  capNhatLuc: string
}

/**
 * Lập kế hoạch hôm nay cho một lô em (≤ 50): dựng lại hồ sơ của em nào có sổ đổi, đọc đầu vào, lập, lưu.
 * Ngày đã chốt (`ket_qua` khác NULL) không bị ghi đè. `now` do nơi gọi truyền (giờ máy chủ).
 */
export async function lapVaLuuKeHoach(env: Env, dsSbd: string[], now: number, tuyChon: { luu?: boolean } = {}): Promise<Map<string, KeHoachDaLap>> {
  const em = [...new Set(dsSbd.map((x) => x.trim()).filter(Boolean))]
  const ra = new Map<string, KeHoachDaLap>()
  if (em.length === 0) return ra
  const nowIso = new Date(now).toISOString()
  const homNay = ngayVn(now)
  const arr = json(em)
  const ngay30 = themNgay(homNay, -SO_NGAY_DO_VAN_TOC)

  // Sổ đổi so với lần lập trước ⇒ hồ sơ cũ. So tổng số dòng sổ (`tongHop.soSuKien` — HẠ TẢI M3: MỘT truy vấn gộp cả
  // đếm này lẫn tiến bộ/hiển thị hôm nay mà `docDauVao` cần bên dưới, khỏi đọc lại) với `so_su_kien` của dòng kế hoạch
  // gần nhất. Hai lời hứa độc lập chạy SONG SONG (hạ tải D1: một lượt chờ hàng đợi thay vì hai).
  const [tongHop, rk] = await Promise.all([
    (async () => { try { return await docTongHop(env, arr, homNay, tuLucHomNay(await docMocHienThi(env), now), ngay30, new Date(now).toISOString()) } catch { return null } })(),
    tat(() => env.DB.prepare(
      `SELECT k.sbd, k.ngay, k.so_su_kien, k.phien_ban, k.muc_tieu_json, k.deferred_count, k.over_budget_seconds FROM ke_hoach_ngay k
        WHERE k.sbd IN (SELECT value FROM json_each(?)) AND k.ngay = (SELECT MAX(z.ngay) FROM ke_hoach_ngay z WHERE z.sbd = k.sbd)`,
    ).bind(arr).all<Record<string, unknown>>(), trong()),
  ])
  const soSk = new Map(em.map((s) => [s, tongHop?.get(s)?.soSuKien ?? 0]))
  const daLap = new Map((rk.results ?? []).map((x) => [String(x.sbd), Number(x.so_su_kien)]))
  const phienCu = new Map((rk.results ?? []).map((x) => [String(x.sbd), Number(x.phien_ban)]))
  const cuHo = em.filter((s) => phienCu.get(s) !== PHIEN_BAN_KE_HOACH || !daLap.has(s) || daLap.get(s) !== (soSk.get(s) ?? 0))
  const dungKq = cuHo.length > 0 ? await tat(() => dungLaiHoSo(env, cuHo, nowIso), null) : null

  // Không đóng dấu version/số sự kiện mới nếu dựng hồ sơ thất bại: lượt sau phải thử lại.
  const dungLoi = new Set(dungKq ? [] : cuHo)
  const dauVao = await docDauVao(env, em, now, { hoSoSan: dungKq?.hoSo, tongHop })
  const dong: Record<string, unknown>[] = []
  for (const sbd of em) {
    const kh = lapKeHoachNgay(dauVao.get(sbd)!)
    ra.set(sbd, { ...kh, capNhatLuc: nowIso })
    dong.push({
      k: `${sbd}|${homNay}`, s: sbd, n: homNay, p: dungLoi.has(sbd) ? (phienCu.get(sbd) ?? 0) : kh.phienBan, d: kh.seed, a: json(kh.nganSach),
      v: json({ viec: kh.viec, sapToi: kh.sapToi, quaHan: kh.quaHan, tai: kh.tai, tienBo: kh.tienBo, tonCu: kh.tonCu, tonCuTong: kh.tonCuTong }), c: json(kh.canhBao),
      l: kh.tienBo.daLamCau, u: kh.tienBo.lenBac, t: kh.tienBo.tutBac, z: kh.lanNghi ? 1 : 0, e: dungLoi.has(sbd) ? (daLap.get(sbd) ?? -1) : (soSk.get(sbd) ?? 0),
      m: json(kh.mucTieu), h1: kh.hoan.deferredCount, h2: kh.hoan.overBudgetSeconds,
    })
  }
  if (tuyChon.luu !== false) {
    const lenh = chunk(dong, 25).map((d) => env.DB.prepare(LUU).bind(nowIso, json(d)))
    await tat(async () => { for (const c of chunk(lenh, 25)) await env.DB.batch(c) }, undefined)
    // ĐỌC LẠI mục tiêu ĐÃ ĐÓNG BĂNG: KHÔNG thêm truy vấn — dùng chính dòng `rk` đã đọc ở trên (ngày mới nhất;
    // nếu đó là HÔM NAY thì ngày hôm nay đã có mục tiêu chốt trước đó ⇒ trả ĐÚNG bản đã chốt, không nâng target).
    for (const x of rk.results ?? []) {
      if (String(x.ngay) !== homNay) continue
      const cur = ra.get(String(x.sbd))
      if (!cur) continue
      try {
        const mt = JSON.parse(String(x.muc_tieu_json ?? '')) as KeHoachNgay['mucTieu']
        if (mt && typeof mt === 'object') cur.mucTieu = mt
      } catch { /* dòng cũ/JSON hỏng ⇒ giữ bản vừa tính (không bịa mục tiêu) */ }
      cur.hoan = { deferredCount: Number(x.deferred_count) || 0, overBudgetSeconds: Number(x.over_budget_seconds) || 0 }
    }
    const nv = em.flatMap((sbd) => {
      const dang = ra.get(sbd)?.viec.find((v) => v.loai === 'than_thu' && v.nhan === 'bu')?.chiTiet.dang
      return typeof dang === 'string' && dang ? [{ i: `${sbd}|than_thu|${homNay}|${dang}`, s: sbd, d: dang }] : []
    })
    if (nv.length > 0) {
      const tao = chunk(nv, 25).map((d) => env.DB.prepare(TAO_NHIEM_VU).bind(nowIso, json(d)))
      await tat(async () => { for (const c of chunk(tao, 25)) await env.DB.batch(c) }, undefined)
    }
  }
  return ra
}

// --- Chốt ngày ----------------------------------------------------------------------------

/**
 * Chốt kết quả các ngày đã qua chưa chốt (`ket_qua` NULL, không phải ngày nghỉ) của một lô em.
 *   dat      : đã làm ≥ mức tối thiểu, không việc bắt buộc nào trễ nhịp, và (có câu lên bậc HOẶC không có câu tới hạn)
 *   mot_phan : có làm ≥ 1 câu   ·   khong : không làm câu nào.
 * "Nộp ≠ nắm": chỉ đếm câu ĐÃ LÀM có kết quả trong sổ, không lấy việc "đã bấm xong" làm bằng chứng.
 */
export async function chotNgayCu(env: Env, dsSbd: string[], homNay: string, nowIso: string): Promise<number> {
  const arr = json(dsSbd)
  const cho = await tat(() => env.DB.prepare(
    `SELECT khoa, sbd, ngay, ngan_sach_json, viec_json, muc_tieu_json FROM ke_hoach_ngay WHERE ${IN_EM} AND ngay < ? AND ket_qua IS NULL AND la_ngay_nghi = 0`,
  ).bind(arr, homNay).all<Record<string, unknown>>(), trong())
  const rows = cho.results ?? []
  if (rows.length === 0) return 0
  const theoNgay = new Map<string, string[]>()
  for (const r of rows) theoNgay.set(String(r.ngay), [...(theoNgay.get(String(r.ngay)) ?? []), String(r.sbd)])
  const tienBo = new Map<string, { da: number; len: number; tut: number; dung: number }>()
  for (const [ngay, ds] of theoNgay) {
    const r = await tat(() => env.DB.prepare(TIEN_BO_NGAY).bind(json(ds), ngay).all<Record<string, unknown>>(), trong())
    for (const x of r.results ?? []) tienBo.set(`${x.sbd}|${ngay}`, { da: Number(x.da_lam) || 0, len: Number(x.len_bac) || 0, tut: Number(x.tut_bac) || 0, dung: Number(x.dung) || 0 })
  }
  const dong = []
  for (const r of rows) {
    const tb = tienBo.get(`${r.sbd}|${r.ngay}`) ?? { da: 0, len: 0, tut: 0, dung: 0 }
    let toiThieu = 4, coToiHan = 0, treNhip = false
    try {
      toiThieu = Number((JSON.parse(String(r.ngan_sach_json)) as { toiThieuCau: number }).toiThieuCau) || 4
      const v = (JSON.parse(String(r.viec_json)) as { tienBo?: { soCauToiHan?: number; treNhip?: boolean } }).tienBo
      coToiHan = Number(v?.soCauToiHan) || 0
      treNhip = v?.treNhip === true
    } catch { /* kế hoạch hỏng: chốt theo số câu thô */ }
    // P05 (02 §6): chốt ngày theo MỤC TIÊU CORE đã đóng băng (nếu ngày đó có) — `null` ⇒ kế hoạch cũ, không bịa.
    const core = await danhGiaMucTieuNgay(env, String(r.sbd), String(r.ngay), r.muc_tieu_json, r.viec_json)
    dong.push({
      k: String(r.khoa), r: ketQuaChotNgay({ daLam: tb.da, lenBac: tb.len, toiThieu, treNhip, soCauToiHan: coToiHan, ngayVn: String(r.ngay), soCauDungHomNay: tb.dung }),
      l: tb.da, u: tb.len, t: tb.tut, m: core ? json({ ...core, luc: nowIso }) : '',
    })
  }
  for (const d of chunk(dong, 60)) {
    await env.DB.prepare(
      `UPDATE ke_hoach_ngay SET ket_qua = j.r, so_cau_da_lam = j.l, so_cau_len_bac = j.u, so_cau_tut_bac = j.t, cap_nhat_luc = ?,
              muc_tieu_ket_qua_json = CASE WHEN j.m = '' THEN ke_hoach_ngay.muc_tieu_ket_qua_json ELSE j.m END
         FROM (SELECT json_extract(value,'$.k') AS k, json_extract(value,'$.r') AS r, json_extract(value,'$.l') AS l,
                      json_extract(value,'$.u') AS u, json_extract(value,'$.t') AS t, json_extract(value,'$.m') AS m FROM json_each(?)) j
        WHERE ke_hoach_ngay.khoa = j.k AND ke_hoach_ngay.ket_qua IS NULL`,
    ).bind(nowIso, json(d)).run()
  }
  return dong.length
}

/**
 * ĐÁNH GIÁ NGÀY THEO MỤC TIÊU CORE ĐÃ CHỐT (`muc_tieu_json`) — CNH-1.0 P05 (02 §6).
 *
 * Ánh xạ kết quả TỪNG VIỆC BẮT BUỘC từ SỔ THẬT:
 *   · việc có `chiTiet.qid` (ôn/ôn thi): `daNop` = mọi qid đã có câu trả lời; `docLapDung` = có câu ĐÚNG **độc lập**
 *     (`ket_qua = 1` và `assistance = 'none'`);
 *   · việc BTVN/Mom (không có qid trong kế hoạch): gộp theo `(nguon, ma_nguon)` trong ngày — `daNop` = có ≥ 1 câu
 *     trả lời của bài đó, `docLapDung` = có ≥ 1 câu đúng độc lập của bài đó;
 *   · việc không có bằng chứng nào ⇒ KHÔNG tính là xong (không cấp ngày miễn phí).
 * Trả `null` khi ngày đó KHÔNG có mục tiêu core (kế hoạch cũ) — không bịa đánh giá.
 */
export async function danhGiaMucTieuNgay(
  env: Env, sbd: string, ngay: string, mucTieuJson: unknown, viecJson: unknown,
): Promise<ReturnType<typeof danhGiaCore> | null> {
  let mt: import('./muc-tieu-core').MucTieuCore
  let viec: { id?: unknown; nguon?: unknown; loai?: unknown; chiTiet?: Record<string, unknown> }[]
  try {
    const m = typeof mucTieuJson === 'string' ? JSON.parse(mucTieuJson) : mucTieuJson
    if (!m || typeof m !== 'object' || !Array.isArray((m as { requiredTaskIds?: unknown }).requiredTaskIds)) return null
    mt = m as import('./muc-tieu-core').MucTieuCore
    const v = typeof viecJson === 'string' ? JSON.parse(viecJson) : viecJson
    viec = ((v as { viec?: unknown })?.viec ?? []) as typeof viec
    if (!Array.isArray(viec)) return null
  } catch {
    return null
  }
  const rows = await tat(() => env.DB.prepare(
    "SELECT qid, nguon, ma_nguon, ket_qua, COALESCE(assistance,'') AS assistance FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ?",
  ).bind(sbd, ngay).all<{ qid: string; nguon: string; ma_nguon: string; ket_qua: number | null; assistance: string }>(), trong())
  const theoQid = new Map<string, { daTraLoi: boolean; docLapDung: boolean }>()
  const theoNguon = new Map<string, { daTraLoi: number; docLapDung: number }>()
  for (const x of rows.results ?? []) {
    const docLapDung = Number(x.ket_qua) === 1 && String(x.assistance) === 'none'
    const traLoi = x.ket_qua !== null
    const q = theoQid.get(String(x.qid)) ?? { daTraLoi: false, docLapDung: false }
    theoQid.set(String(x.qid), { daTraLoi: q.daTraLoi || traLoi, docLapDung: q.docLapDung || docLapDung })
    const k = `${x.nguon}|${x.ma_nguon}`
    const n = theoNguon.get(k) ?? { daTraLoi: 0, docLapDung: 0 }
    theoNguon.set(k, { daTraLoi: n.daTraLoi + (traLoi ? 1 : 0), docLapDung: n.docLapDung + (docLapDung ? 1 : 0) })
  }
  const ketQua: KetQuaTaskCore[] = mt.requiredTaskIds.map((id) => {
    const v = viec.find((x) => String(x.id) === id)
    const qids = Array.isArray(v?.chiTiet?.qid) ? (v!.chiTiet!.qid as string[]) : []
    if (qids.length) {
      const c = qids.map((q) => theoQid.get(String(q)) ?? { daTraLoi: false, docLapDung: false })
      return { taskId: id, docLap: true, daNop: c.every((x) => x.daTraLoi), docLapDung: c.some((x) => x.docLapDung) }
    }
    const ma = String(v?.chiTiet?.ma ?? '').trim() || String(v?.nguon ?? '').trim()
    const loai = String(v?.loai ?? '')
    const nguons = loai === 'mom' ? [`mom|${String(v?.chiTiet?.id ?? ma)}`] : [`btvn_lo|${ma}`, `btvn|${ma}`]
    const gop = nguons.map((k) => theoNguon.get(k) ?? { daTraLoi: 0, docLapDung: 0 })
    return {
      taskId: id, docLap: true,
      daNop: gop.some((x) => x.daTraLoi > 0),
      docLapDung: gop.some((x) => x.docLapDung > 0),
    }
  })
  return danhGiaCore(mt, ketQua)
}

/** Chạy qua cả lớp: chốt ngày cũ rồi lập kế hoạch hôm nay. Dùng cho cron 00:01 VN và lệnh thầy. */
export async function chayCaLop(env: Env, now: number): Promise<{ soEm: number; soLo: number; daChot: number; daLap: number }> {
  const r = await env.DB.prepare("SELECT sbd FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' ORDER BY sbd").all<{ sbd: string }>()
  const ds = (r.results ?? []).map((x) => String(x.sbd)).filter(Boolean)
  const homNay = ngayVn(now)
  let daChot = 0, daLap = 0
  const cacLo = chunk(ds, TOI_DA_EM_MOI_LO)
  for (const lo of cacLo) {
    daChot += await chotNgayCu(env, lo, homNay, new Date(now).toISOString())
    daLap += (await lapVaLuuKeHoach(env, lo, now)).size
  }
  return { soEm: ds.length, soLo: cacLo.length, daChot, daLap }
}

// --- Đường của học sinh -----------------------------------------------------------------------

/** SBD có thật: trong `hoc_sinh`, `danh_sach` hoặc từng có lượt thi. Kiểm theo thứ tự rẻ → đắt, dừng ở chỗ đầu tiên thấy. */
export async function laHocSinhThat(env: Env, sbd: string): Promise<boolean> {
  const r = await env.DB.prepare(
    `SELECT CASE WHEN EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = ?) OR EXISTS (SELECT 1 FROM danh_sach WHERE sbd = ?)
                   OR EXISTS (SELECT 1 FROM luot WHERE sbd = ?) THEN 1 ELSE 0 END AS co`,
  ).bind(sbd, sbd, sbd).first<{ co: number }>()
  return Number(r?.co) === 1
}

export interface ThanThu {
  pet: string
  /** Kẹp 1..120 như `loadProfile`. */
  cap: number
  nickname: string | null
}

/**
 * Thần thú THẬT của em, đọc TƯƠI từ `game_v2_profile` (không lưu vào `ke_hoach_ngay`). Đúng MỘT truy vấn, đúng cách `honors.ts` đọc
 * (`json_extract` `$.pet` `$.cap` `$.nickname`). `null` khi em chưa có hồ sơ game HOẶC chưa chọn thần thú (`choice = true`: `pet` lúc đó
 * chỉ là `dat_quy` điền tạm, không phải lựa chọn của em) — TUYỆT ĐỐI không bịa một con mặc định.
 * Lỗi lược đồ hoặc JSON hồ sơ hỏng → `null` và ghi log, không làm hỏng kế hoạch của em.
 */
export async function docThanThu(env: Env, sbd: string): Promise<ThanThu | null> {
  const r = await tat(
    () => env.DB.prepare(
      `SELECT json_extract(json, '$.pet') AS pet, json_type(json, '$.pet') AS pet_kieu, json_extract(json, '$.cap') AS cap,
              json_extract(json, '$.nickname') AS nickname, json_type(json, '$.nickname') AS nickname_kieu, json_extract(json, '$.choice') AS choice
         FROM game_v2_profile WHERE sbd = ?`,
    ).bind(sbd).first<Record<string, unknown>>(),
    null,
  )
  if (!r || Number(r.choice) === 1) return null
  const pet = r.pet_kieu === 'text' ? String(r.pet).trim() : ''
  if (!pet) return null
  const nickname = r.nickname_kieu === 'text' ? String(r.nickname).trim() : ''
  return { pet, cap: Math.max(1, Math.min(120, Math.round(Number(r.cap)) || 1)), nickname: nickname || null }
}

/** `POST /hs/ke-hoach-ngay {sbd | token}` — công khai như `/btvn/cua-em`; có `token` thì lấy SBD từ chữ ký. */
export async function hsKeHoachNgay(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = b.token ? await gameIdentity(env, b) : String(b.sbd ?? '').trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // Đường này công khai (như `/hs/btvn`), nên SBD bịa KHÔNG được phép sinh ra dòng nào trong `ke_hoach_ngay`.
  // Em có thật = có trong hoc_sinh, danh sách lớp, hoặc đã có lượt thi. Kiểm TRƯỚC mọi thao tác ghi.
  if (sbd.length > 40 || !(await laHocSinhThat(env, sbd))) return { ok: false, error: 'Không tìm thấy học sinh' }
  const kh = (await lapVaLuuKeHoach(env, [sbd], Date.now())).get(sbd)!
  // `thanThu` đọc tươi mỗi lần gọi, KHÔNG nằm trong bản ghi `ke_hoach_ngay`.
  return { ok: true, ...kh, thanThu: await docThanThu(env, sbd) }
}

/** `POST /hs/thoi-gian-hoc {token, phut}` — em đặt số phút học mỗi ngày (10–45). Chỉ HẠ mục tiêu, không nâng vượt trần 16. */
export async function hsThoiGianHoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = await gameIdentity(env, b)
  return datPhutMoiNgay(env, sbd, b.phut)
}

/** Đặt số phút học mỗi ngày (10–45) của MỘT em: dùng chung cho em (`/hs/thoi-gian-hoc`) và phụ huynh (`/ph/thoi-gian-hoc`). `sbd` đã được xác thực bởi nơi gọi. */
export async function datPhutMoiNgay(env: Env, sbd: string, phutTho: unknown): Promise<Record<string, unknown>> {
  const phut = Math.round(Number(phutTho))
  if (!Number.isFinite(phut) || phut < PHUT_NGAY_TOI_THIEU || phut > PHUT_NGAY_TOI_DA) {
    return { ok: false, error: `Số phút mỗi ngày phải từ ${PHUT_NGAY_TOI_THIEU} đến ${PHUT_NGAY_TOI_DA}.` }
  }
  await env.DB.prepare(
    'INSERT INTO study_preferences (sbd, minutes, updated_at) VALUES (?,?,?) ON CONFLICT(sbd) DO UPDATE SET minutes = excluded.minutes, updated_at = excluded.updated_at',
  ).bind(sbd, phut, new Date().toISOString()).run()
  emCoGhi(sbd) // số phút mỗi ngày đổi ⇒ ngân sách kế hoạch đổi
  return { ok: true, phut }
}

