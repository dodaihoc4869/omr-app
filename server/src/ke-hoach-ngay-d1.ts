// LỚP D1 CỦA KẾ HOẠCH NGÀY — GĐ 2 (đọc đầu vào, dựng hồ sơ khi sổ đổi, lưu, chốt ngày, cron).
//
// Đọc GỘP THEO LÔ EM (`sbd IN (SELECT value FROM json_each(?))`, ≤ 50 em/lượt): mỗi lô ~14 câu truy vấn bất kể số em,
// nên cron cả lớp 261 em ≈ 6 lô ≈ 100 câu truy vấn (dưới trần 1000 của một lượt chạy), chứ không phải 261 × 14.
//
// TƯƠI KHI ĐỌC, KHÔNG PHẢI KHI GHI: kế hoạch được lập lại mỗi lần em mở (và mỗi đêm bằng cron), nên "lập lại khi có sự
// kiện" của đề xuất đạt được mà không thêm một câu truy vấn nào vào đường nộp bài. Hồ sơ được dựng lại khi số dòng sổ
// của em khác số lúc lập kế hoạch trước (`so_su_kien`).
import type { D1Result, Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { dungLaiHoSo } from './ho-so-nam-kt'
import type { NamKtDang } from './ho-so-nam-kt'
import {
  NGAY_LIET_KE_QUA_HAN, NGAY_ON_THI, NHIEM_VU_THAN_THU_MO_TOI_DA, PHUT_NGAY_TOI_DA, PHUT_NGAY_TOI_THIEU, SO_NGAY_DO_VAN_TOC, SO_NGAY_LICH_SU,
} from './ho-so-cau-hinh'
import { lapKeHoachNgay, ngayHocMom, type DauVaoKeHoach, type KeHoachNgay } from './ke-hoach-ngay'
import { qidPhucVuDuoc } from './cau-theo-qid'
import { ngayVn } from './su-kien-hoc'
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
 */
async function tapQidPhucVu(env: Env, qids: string[]): Promise<Set<string> | null> {
  if (qids.length === 0) return null
  try {
    const coChiMuc = await env.DB.prepare('SELECT 1 AS x FROM game_v2_index LIMIT 1').first()
    if (!coChiMuc) return null
    return (await qidPhucVuDuoc(env, qids)).duoc
  } catch (e) {
    console.error('[ke-hoach] không kiểm được qid phục vụ được (giữ nguyên hàng ôn):', e instanceof Error ? e.message : e)
    return null
  }
}

// --- Gom đầu vào -------------------------------------------------------------------------

export async function docDauVao(env: Env, dsSbd: string[], now: number): Promise<Map<string, DauVaoKeHoach>> {
  const em = [...new Set(dsSbd)]
  const arr = json(em)
  const homNay = ngayVn(now)
  const nowIso = new Date(now).toISOString()
  const cat14 = new Date(now - NGAY_LIET_KE_QUA_HAN * MOT_NGAY_MS).toISOString()
  const ngay30 = themNgay(homNay, -SO_NGAY_DO_VAN_TOC)
  const ngayLs = themNgay(homNay, -SO_NGAY_LICH_SU)
  const nghi = await docNgayNghi(env)

  const map = new Map<string, DauVaoKeHoach>()
  for (const sbd of em) {
    map.set(sbd, {
      sbd, now, homNay, phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [], nhiemVuThanThu: [],
      caSapToi: [], cauOnThi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: nghi.has(homNay),
    })
  }
  const cua = (x: Record<string, unknown>) => map.get(String(x.sbd))

  // BTVN chưa nộp (còn hạn hoặc mới quá hạn ≤ 14 ngày). Có phòng vệ khi cột `lo_da_xong` chưa có.
  const q = (cot: string, them = '') => `SELECT be.sbd, be.ma_btvn, ${cot} AS lo, b.so_cau, b.giao_luc, b.han_nop${them}
       FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
      WHERE be.sbd IN (SELECT value FROM json_each(?)) AND be.thu_hoi = 0 AND b.da_xoa = 0 AND be.nop_luc IS NULL AND b.han_nop > ?`
  // Ba cột BTVN "nâng đỡ" (migration-2109-btvn-nang-do.sql): chưa chạy migration thì lùi về truy vấn cũ, bài nào cũng là bài cũ.
  let rb = await tat(() => env.DB.prepare(q('COALESCE(be.lo_da_xong, 0)', ', b.ca_nhan, be.so_cau_em, be.chot_luc, be.chang_mo_json')).bind(arr, cat14).all<Record<string, unknown>>(), null)
  if (!rb) rb = await tat(() => env.DB.prepare(q('COALESCE(be.lo_da_xong, 0)')).bind(arr, cat14).all<Record<string, unknown>>(), null)
  if (!rb) rb = await tat(() => env.DB.prepare(q('0')).bind(arr, cat14).all<Record<string, unknown>>(), trong())
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
      `SELECT ma_btvn, sbd, chang, COUNT(*) AS n FROM btvn_em_cau WHERE chang >= 0 AND sbd IN (SELECT value FROM json_each(?)) AND ma_btvn IN (SELECT value FROM json_each(?)) GROUP BY ma_btvn, sbd, chang ORDER BY chang`,
    ).bind(arr, json([...new Set([...baiChot.keys()].map((k) => k.split('|')[0]))])).all<Record<string, unknown>>(), trong())
    const soCauChang = new Map<string, number[]>()
    for (const x of rcg.results ?? []) {
      const k = `${x.ma_btvn}|${x.sbd}`
      if (baiChot.has(k)) soCauChang.set(k, [...(soCauChang.get(k) ?? []), Number(x.n) || 0])
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
      }
    }
  }

  // Mom chưa nộp: đã bắt đầu (còn hạn 120 phút hoặc mới quá hạn ≤ 14 ngày, để liệt kê quá hạn) VÀ chưa bắt đầu (không hạn cứng nhưng vẫn là
  // việc em nợ). Bài hằng ngày `daily_<ngày>` của ngày cũ mà chưa bắt đầu thì bỏ ngay ở SQL — mỗi ngày một bài, không để dồn lại.
  // `qid_json` (mã câu của bài) có từ migration-1909-mom-qid.sql; chưa có cột thì đọc như cũ, không chống trùng được.
  const qm = (cot: string) => `SELECT sbd, id, question_count, created_at, started_at, ${cot} AS qid_json FROM mom_bai
      WHERE ${IN_EM} AND submitted_at IS NULL AND ((started_at IS NOT NULL AND started_at > ?) OR (started_at IS NULL AND (id NOT LIKE 'daily_%' OR id = ?)))`
  const tamMom = [arr, cat14, `daily_${ngayHocMom(now)}`] as const
  let rm = await tat(() => env.DB.prepare(qm('qid_json')).bind(...tamMom).all<Record<string, unknown>>(), null)
  if (!rm) rm = await tat(() => env.DB.prepare(qm('NULL')).bind(...tamMom).all<Record<string, unknown>>(), trong())
  for (const x of rm.results ?? []) {
    cua(x)?.mom.push({ id: String(x.id), soCau: Number(x.question_count) || 0, taoLuc: String(x.created_at ?? ''), batDauLuc: x.started_at ? String(x.started_at) : null, qid: docQid(x.qid_json) })
  }

  // Hồ sơ: câu tới hạn ôn (chỉ câu TỪNG SAI; chua_thay_sai không vào hàng ôn), dạng, và số câu sai chưa khắc phục.
  const rc = await tat(() => env.DB.prepare(
    `SELECT sbd, qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau
      WHERE ${IN_EM} AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?`,
  ).bind(arr, homNay).all<Record<string, unknown>>(), trong())
  // CHỈ câu mà lệnh lấy đề (`/hs/cau-theo-qid`) PHỤC VỤ ĐƯỢC mới vào hàng ôn: cùng MỘT định nghĩa `qidPhucVuDuoc` (có trong chỉ mục game của tờ kho còn,
  // không nằm trong đề thi đang bảo vệ). Câu chưa phục vụ được (đề đang bảo vệ, kho chưa lập chỉ mục) vẫn nằm trong hồ sơ, sẽ vào hàng ôn khi phục vụ
  // được — chứ không được giao rồi để việc "Ôn N câu" không bao giờ xong.
  const denHan = rc.results ?? []
  const phucVu = await tapQidPhucVu(env, denHan.map((x) => String(x.qid)))
  for (const x of denHan) {
    if (phucVu && !phucVu.has(String(x.qid))) continue
    cua(x)?.cauToiHan.push({ qid: String(x.qid), maDang: x.ma_dang ? String(x.ma_dang) : null, mocOnKe: String(x.moc_on_ke), lanSai: Number(x.lan_sai) || 0 })
  }
  const rd = await tat(() => env.DB.prepare(`SELECT * FROM nam_kt_dang WHERE ${IN_EM}`).bind(arr).all<Record<string, unknown>>(), trong())
  for (const x of rd.results ?? []) {
    cua(x)?.dang.push({
      sbd: String(x.sbd), maDang: String(x.ma_dang), soGap: Number(x.so_gap), soSai: Number(x.so_sai), soDaKhacPhuc: Number(x.so_da_khac_phuc),
      soMoiSai: Number(x.so_moi_sai), soChuaThaySai: Number(x.so_chua_thay_sai), bac: Number(x.bac),
      mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? String(x.moc_moi_sai) : null,
    } satisfies NamKtDang)
  }
  const rn = await tat(() => env.DB.prepare(`SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE ${IN_EM} AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd`).bind(arr).all<Record<string, unknown>>(), trong())
  for (const x of rn.results ?? []) { const c = cua(x); if (c) c.soCauChuaKhacPhuc = Number(x.n) || 0 }

  // Tốc độ đo thật từ sổ (chỉ những nguồn có đo giây — hiện là ca thi).
  const rg = await tat(() => env.DB.prepare(`SELECT sbd, giay FROM su_kien_hoc WHERE ${IN_EM} AND giay IS NOT NULL AND ngay_vn >= ?`).bind(arr, ngay30).all<Record<string, unknown>>(), trong())
  for (const x of rg.results ?? []) cua(x)?.mauGiay.push(Number(x.giay))

  // Đã làm hôm nay (mọi nguồn), khử trùng theo câu; "lên bậc" = đúng lại câu từng sai/trống, "tụt bậc" = sai lại câu từng đúng.
  const rt = await tat(() => env.DB.prepare(TIEN_BO_NGAY).bind(arr, homNay).all<Record<string, unknown>>(), trong())
  for (const x of rt.results ?? []) { const c = cua(x); if (c) c.daLamHomNay = { soCau: Number(x.da_lam) || 0, lenBac: Number(x.len_bac) || 0, tutBac: Number(x.tut_bac) || 0, dung: Number(x.dung) || 0 } }

  // Lịch sử kết quả các ngày trước.
  const rh = await tat(() => env.DB.prepare(`SELECT sbd, ngay, ket_qua FROM ke_hoach_ngay WHERE ${IN_EM} AND ngay < ? AND ngay >= ? ORDER BY ngay DESC`).bind(arr, homNay, ngayLs).all<Record<string, unknown>>(), trong())
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
  const rp = await tat(() => env.DB.prepare(`SELECT sbd, minutes FROM study_preferences WHERE ${IN_EM}`).bind(arr).all<Record<string, unknown>>(), trong())
  for (const x of rp.results ?? []) {
    const c = cua(x)
    if (c) c.phutNgay = Math.max(PHUT_NGAY_TOI_THIEU, Math.min(PHUT_NGAY_TOI_DA, Number(x.minutes) || 0)) || null
  }
  const rk = await tat(() => env.DB.prepare(`SELECT sbd, id, dang FROM game_v2_task WHERE ${IN_EM} AND completed_at IS NULL`).bind(arr).all<Record<string, unknown>>(), trong())
  for (const x of rk.results ?? []) cua(x)?.nhiemVuThanThu.push({ id: String(x.id), dang: String(x.dang) })

  // Ca thi sắp tới của lớp em (một truy vấn cho cả lô).
  const rl = await tat(() => env.DB.prepare(`SELECT sbd, lop FROM hoc_sinh WHERE ${IN_EM}`).bind(arr).all<Record<string, unknown>>(), trong())
  const lop = new Map((rl.results ?? []).map((x) => [String(x.sbd), String(x.lop ?? '').trim()]))
  const den = new Date(now + NGAY_ON_THI * MOT_NGAY_MS).toISOString()
  const rca = await tat(() => env.DB.prepare("SELECT ma_ca, ten_ca, bat_dau, lop FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi' AND bat_dau > ? AND bat_dau <= ?").bind(nowIso, den).all<Record<string, unknown>>(), trong())
  for (const c of map.values()) {
    for (const x of rca.results ?? []) {
      const lopCa = String(x.lop ?? '').trim()
      if (lopCa && lopCa !== lop.get(c.sbd)) continue
      c.caSapToi.push({ maCa: String(x.ma_ca), tenCa: String(x.ten_ca ?? ''), batDau: String(x.bat_dau) })
    }
  }

  // Ứng viên cho việc `on_thi` — CHỈ em có ca sắp tới (không tốn truy vấn nào khi không có ca): câu từng sai còn đang ôn, lệnh lấy đề phục vụ được.
  const emCoCa = [...map.values()].filter((c) => c.caSapToi.length > 0).map((c) => c.sbd)
  if (emCoCa.length > 0) {
    const ro = await tat(() => env.DB.prepare(
      `SELECT sbd, qid, lan_sai, trang_thai FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') AND can_day_lai = 0`,
    ).bind(json(emCoCa)).all<Record<string, unknown>>(), trong())
    const ung = ro.results ?? []
    const phucVuThi = await tapQidPhucVu(env, [...new Set(ung.map((x) => String(x.qid)))])
    for (const x of ung) {
      if (phucVuThi && !phucVuThi.has(String(x.qid))) continue
      cua(x)?.cauOnThi?.push({ qid: String(x.qid), lanSai: Number(x.lan_sai) || 0, moiSai: String(x.trang_thai) === 'moi_sai' })
    }
  }
  // BỘ NÃO A.I (chế độ THẬT): điều chỉnh còn hạn của các em — nhịp vào ngân sách ngày; `on_som` kéo `moc_on_ke` của câu vừa sai thuộc dạng đó VỀ NGÀY MAI (chỉ SỚM hơn).
  // Chạy thử / tắt ⇒ `docDieuChinhHieuLuc` trả rỗng, kế hoạch Y HỆT (một truy vấn cấu hình). Không đụng hạn nộp bài nào.
  const dieuChinh = await docDieuChinhHieuLuc(env, em, homNay)
  for (const [sbd, dc] of dieuChinh) {
    const c = map.get(sbd)
    if (!c) continue
    if (dc.nhip !== 0) c.boNao = { nhip: dc.nhip }
    if (dc.onSom.length > 0) await keoOnSom(env, c, dc.onSom, themNgay(dc.ngay, 1), homNay)
  }
  return map
}

/**
 * `on_som`: câu ĐÃ TỪNG sai, còn đang ôn (`moi_sai`/`dang_on`), thuộc dạng được bộ não chọn, mà mốc ôn kế còn ở tương lai ⇒ mốc HIỆU LỰC = min(mốc, ngày mai của đêm điều chỉnh).
 * CHỈ SỚM hơn, không bao giờ muộn hơn, không ghi lại `nam_kt_cau` (hồ sơ nguồn không đổi). Vào hàng ôn qua đúng cửa `cauToiHan` (cùng bộ lọc phục vụ được).
 */
async function keoOnSom(env: Env, c: DauVaoKeHoach, dsDang: string[], ngayMai: string, homNay: string): Promise<void> {
  if (ngayMai > homNay) return // chưa tới "ngày mai" của đêm điều chỉnh
  const daCo = new Set(c.cauToiHan.map((x) => x.qid))
  const r = await tat(() => env.DB.prepare(
    `SELECT qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau
      WHERE sbd = ? AND ma_dang IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke > ?`,
  ).bind(c.sbd, json(dsDang), homNay).all<Record<string, unknown>>(), trong())
  const ung = (r.results ?? []).filter((x) => !daCo.has(String(x.qid)))
  const phucVu = await tapQidPhucVu(env, ung.map((x) => String(x.qid)))
  for (const x of ung) {
    if (phucVu && !phucVu.has(String(x.qid))) continue
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
    so_cau_len_bac, so_cau_tut_bac, la_ngay_nghi, so_su_kien, cap_nhat_luc)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.n'), json_extract(j.value,'$.p'), json_extract(j.value,'$.d'),
         json_extract(j.value,'$.a'), json_extract(j.value,'$.v'), json_extract(j.value,'$.c'), NULL, json_extract(j.value,'$.l'),
         json_extract(j.value,'$.u'), json_extract(j.value,'$.t'), json_extract(j.value,'$.z'), json_extract(j.value,'$.e'), ?
    FROM json_each(?) j WHERE 1
  ON CONFLICT(khoa) DO UPDATE SET phien_ban = excluded.phien_ban, seed = excluded.seed, ngan_sach_json = excluded.ngan_sach_json,
    viec_json = excluded.viec_json, canh_bao_json = excluded.canh_bao_json, so_cau_da_lam = excluded.so_cau_da_lam,
    so_cau_len_bac = excluded.so_cau_len_bac, so_cau_tut_bac = excluded.so_cau_tut_bac, la_ngay_nghi = excluded.la_ngay_nghi,
    so_su_kien = excluded.so_su_kien, cap_nhat_luc = excluded.cap_nhat_luc
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

  // Sổ đổi so với lần lập trước ⇒ hồ sơ cũ. So số dòng sổ với `so_su_kien` của dòng kế hoạch gần nhất.
  const rs = await tat(() => env.DB.prepare(`SELECT sbd, COUNT(*) AS n FROM su_kien_hoc WHERE ${IN_EM} GROUP BY sbd`).bind(arr).all<Record<string, unknown>>(), trong())
  const soSk = new Map((rs.results ?? []).map((x) => [String(x.sbd), Number(x.n) || 0]))
  const rk = await tat(() => env.DB.prepare(
    `SELECT k.sbd, k.so_su_kien FROM ke_hoach_ngay k WHERE k.sbd IN (SELECT value FROM json_each(?)) AND k.ngay = (SELECT MAX(z.ngay) FROM ke_hoach_ngay z WHERE z.sbd = k.sbd)`,
  ).bind(arr).all<Record<string, unknown>>(), trong())
  const daLap = new Map((rk.results ?? []).map((x) => [String(x.sbd), Number(x.so_su_kien)]))
  const cuHo = em.filter((s) => !daLap.has(s) || daLap.get(s) !== (soSk.get(s) ?? 0))
  if (cuHo.length > 0) await tat(() => dungLaiHoSo(env, cuHo, nowIso), null)

  const dauVao = await docDauVao(env, em, now)
  const dong: Record<string, unknown>[] = []
  for (const sbd of em) {
    const kh = lapKeHoachNgay(dauVao.get(sbd)!)
    ra.set(sbd, { ...kh, capNhatLuc: nowIso })
    dong.push({
      k: `${sbd}|${homNay}`, s: sbd, n: homNay, p: kh.phienBan, d: kh.seed, a: json(kh.nganSach),
      v: json({ viec: kh.viec, sapToi: kh.sapToi, quaHan: kh.quaHan, tai: kh.tai, tienBo: kh.tienBo, tonCu: kh.tonCu, tonCuTong: kh.tonCuTong }), c: json(kh.canhBao),
      l: kh.tienBo.daLamCau, u: kh.tienBo.lenBac, t: kh.tienBo.tutBac, z: kh.lanNghi ? 1 : 0, e: soSk.get(sbd) ?? 0,
    })
  }
  if (tuyChon.luu !== false) {
    const lenh = chunk(dong, 25).map((d) => env.DB.prepare(LUU).bind(nowIso, json(d)))
    await tat(async () => { for (const c of chunk(lenh, 25)) await env.DB.batch(c) }, undefined)
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
    `SELECT khoa, sbd, ngay, ngan_sach_json, viec_json FROM ke_hoach_ngay WHERE ${IN_EM} AND ngay < ? AND ket_qua IS NULL AND la_ngay_nghi = 0`,
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
  const dong = rows.map((r) => {
    const tb = tienBo.get(`${r.sbd}|${r.ngay}`) ?? { da: 0, len: 0, tut: 0, dung: 0 }
    let toiThieu = 4, coToiHan = 0, treNhip = false
    try {
      toiThieu = Number((JSON.parse(String(r.ngan_sach_json)) as { toiThieuCau: number }).toiThieuCau) || 4
      const v = (JSON.parse(String(r.viec_json)) as { tienBo?: { soCauToiHan?: number; treNhip?: boolean } }).tienBo
      coToiHan = Number(v?.soCauToiHan) || 0
      treNhip = v?.treNhip === true
    } catch { /* kế hoạch hỏng: chốt theo số câu thô */ }
    return { k: String(r.khoa), r: ketQuaChotNgay({ daLam: tb.da, lenBac: tb.len, toiThieu, treNhip, soCauToiHan: coToiHan, ngayVn: String(r.ngay), soCauDungHomNay: tb.dung }), l: tb.da, u: tb.len, t: tb.tut }
  })
  for (const d of chunk(dong, 60)) {
    await env.DB.prepare(
      `UPDATE ke_hoach_ngay SET ket_qua = j.r, so_cau_da_lam = j.l, so_cau_len_bac = j.u, so_cau_tut_bac = j.t, cap_nhat_luc = ?
         FROM (SELECT json_extract(value,'$.k') AS k, json_extract(value,'$.r') AS r, json_extract(value,'$.l') AS l,
                      json_extract(value,'$.u') AS u, json_extract(value,'$.t') AS t FROM json_each(?)) j
        WHERE ke_hoach_ngay.khoa = j.k AND ke_hoach_ngay.ket_qua IS NULL`,
    ).bind(nowIso, json(d)).run()
  }
  return dong.length
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
  return { ok: true, phut }
}

