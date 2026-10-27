// HỆ THƯỞNG PHẠT KIỂU DUOLINGO — LỚP D1 + LỆNH (phần máy chủ «A», thầy CHỐT 26/10; DAC-TA-THUONG-PHAT-2610.md §4.2, §4.4, §4.6).
//
//   POST /hs/thuong                 tổng quan (MỘT lô đọc song song, 0 vòng chờ nối tiếp; trả thưởng mới đạt chạy SAU phản hồi qua ctx.waitUntil)
//   POST /hs/thuong/mo-ruong        mở rương ngày (+15) khi đủ 3 ô — khoá (em, ngày)
//   POST /hs/thuong/mua-binh        −150 tinh thể + gọi hàm cộng bình của B3 — tối đa 1 bình / tuần VN (luật 27/10), khoá (em, ngày)
//   POST /hs/thuong/cuoc {dat: 50}  cược chuỗi 7 ngày — khoá (em, ngày) + chỉ mục duy nhất «một lượt đang chạy»
//   POST /hs/thuong/da-xem {ma}     đánh dấu thông báo đã hiện
//   POST /hs/huy-hieu               danh sách huy hiệu (trao bù huy hiệu vừa đạt sau phản hồi)
//   POST /gv/thuong/cong-tac        đọc ({}) / ghi ({khoa, giaTri}) công tắc (cổng mã thầy ở router)
//   cronThuongNgay                  00:10–00:59 giờ VN: thăng hoa, chốt cược, trả thưởng ngày hôm qua còn sót, sinh nhiệm vụ hôm nay
// (Mọi lệnh của máy chủ này là POST + token trong thân — «GET» trong hợp đồng = lệnh chỉ đọc.)
//
// Tinh thể = sổ `vang_so` (thuong-luat.ts MA_TT): kiếm 'doi' / tiêu 'mua'; mọi dòng có `khoa_yeu_cau` 'tt|…' DUY NHẤT theo em ⇒ bấm lặp, gọi lại, cron chạy
// hai lần đều không cộng/trừ đôi. Dòng trừ chỉ vào khi số dư lúc ghi ≥ số trừ ⇒ tinh thể KHÔNG BAO GIỜ âm.
// Học sinh không bao giờ thấy nhãn lười: mọi phản hồi /hs ở đây chỉ có số + chữ trung tính.
import type { D1PreparedStatement, Env, ExecutionContext } from './kieu'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { viecPhu } from './viec-phu'
import {
  BINH_MUA_TOI_DA_TUAN, CUOC_SO_NGAY, GIO_CU_DEM, HAU_TO_KHOA_BINH_TUAN, HUY_HIEU, KHOA_CONG_TAC, MA_TT, SO_LIEU_RONG, THANG_HOA_SO_NGAY, TT_CUOC_DAT, TT_CUOC_THANG,
  TT_BINH_GIU_CHUOI, TT_MOC_CHUOI, TT_MUC_TIEU_NGAY, TT_RUONG, chonNhiemVu, congNgayTt, congTacTuDong, datHuyHieu, gioVnCua, mucTieuBai, ngayVnTt, nhiemVuCuaNgay,
  soThangHoa, tuanMuaBinh,
  type CongTac, type KhoaCongTac, type MauNhiemVu, type MaNhiemVu, type NhiemVuEm, type SoLieuNgay,
} from './thuong-luat'
import { CHUA_TINH_BINH, cauNoiChuoi, congBinhGiuChuoi } from './thuong-cau-noi-chuoi'
import { tomTatGiaiEm } from './thuong-giai-tuan'

/** Điều kiện SQL (một biểu thức, tham số `?`) AND vào câu ghi — đúng khi câu trước CÙNG lô vừa ghi. */
export interface DieuKienSql { sql: string; tham: unknown[] }

type Dong = Record<string, unknown>
const so = (v: unknown): number => Number(v) || 0
const chu = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const json = (v: unknown): string => JSON.stringify(v)
const docJson = <T,>(v: unknown, mac: T): T => { try { return v === null || v === undefined ? mac : (JSON.parse(String(v)) as T) } catch { return mac } }

/**
 * Số bình em ĐÃ MUA (luật 27/10) trong tuần VN chứa `ngay`, trừ lượt đã hoàn: một biểu thức con theo chỉ mục UNIQUE(sbd, khoa_yeu_cau) (khoảng khoá của tuần,
 * hậu tố `binh-w`). Khoá giá cũ `tt|<ngày>|binh` không tính ⇒ bình mua trước luật mới không chặn tuần này.
 */
export function sqlBinhDaMuaTuan(sbd: string, ngay: string): DieuKienSql {
  const t = tuanMuaBinh(ngay)
  return {
    sql: `(SELECT COUNT(CASE WHEN ma_mon = '${MA_TT.binh}' THEN 1 END) - COUNT(CASE WHEN ma_mon = '${MA_TT.binhHoan}' THEN 1 END) FROM vang_so
      WHERE sbd = ? AND khoa_yeu_cau >= ? AND khoa_yeu_cau < ? AND substr(khoa_yeu_cau, 15, ${HAU_TO_KHOA_BINH_TUAN.length}) = '${HAU_TO_KHOA_BINH_TUAN}')`,
    tham: [sbd, t.tu, t.toi],
  }
}

// --- Lệnh ghi dùng chung (tác tử giải tuần / Code app 4 cũng gọi) ---------------------------------------

/** KIẾM tinh thể: một dòng 'doi' (exp_tru 0), khoá duy nhất ⇒ ghi lại không cộng đôi. `dk` (tuỳ chọn) = điều kiện SQL phải đúng mới ghi. */
export function lenhCongTinhThe(env: Env, sbd: string, k: { khoa: string; so: number; maMon: string; luc: string }, dk?: DieuKienSql): D1PreparedStatement {
  return env.DB.prepare(`INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc) SELECT ?, 'doi', ?, 0, ?, ?, ? WHERE ? > 0${dk ? ` AND (${dk.sql})` : ''}`)
    .bind(sbd, Math.floor(k.so), k.maMon, k.khoa, k.luc, Math.floor(k.so), ...(dk?.tham ?? []))
}
/** TIÊU / MẤT tinh thể: dòng 'mua' số âm, CHỈ khi số dư lúc ghi ≥ `so` (không âm), khoá duy nhất. */
export function lenhTruTinhThe(env: Env, sbd: string, k: { khoa: string; so: number; maMon: string; luc: string }, dk?: DieuKienSql): D1PreparedStatement {
  const n = Math.floor(k.so)
  return env.DB.prepare(`INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
      SELECT ?, 'mua', ?, 0, ?, ?, ? WHERE ? > 0 AND (SELECT COALESCE(SUM(so_vang), 0) FROM vang_so WHERE sbd = ?) >= ?${dk ? ` AND (${dk.sql})` : ''}`)
    .bind(sbd, -n, k.maMon, k.khoa, k.luc, n, sbd, n, ...(dk?.tham ?? []))
}
/** Thông báo hiện một lần. `ma` duy nhất theo em ⇒ ghi lại không nhân đôi. */
export function lenhThongBao(env: Env, sbd: string, t: { ma: string; loai: string; duLieu?: unknown; luc: string }, dk?: DieuKienSql): D1PreparedStatement {
  return env.DB.prepare(`INSERT OR IGNORE INTO thong_bao_thuong(em, ma, loai, du_lieu, luc) SELECT ?, ?, ?, ?, ?${dk ? ` WHERE ${dk.sql}` : ''}`)
    .bind(sbd, t.ma, t.loai, json(t.duLieu ?? {}), t.luc, ...(dk?.tham ?? []))
}
/** Trao huy hiệu (một lần). */
export function lenhTraoHuyHieu(env: Env, sbd: string, h: { ma: string; ngay: string; duLieu?: unknown; luc: string }): D1PreparedStatement {
  return env.DB.prepare('INSERT OR IGNORE INTO huy_hieu_em(em, ma, ngay, du_lieu, luc) VALUES (?, ?, ?, ?, ?)').bind(sbd, h.ma, h.ngay, h.duLieu === undefined ? null : json(h.duLieu), h.luc)
}
/** Mốc chuỗi cá nhân (Code app 4 gọi khi chuỗi vừa chạm mốc 7/30/100/365): tinh thể + huy hiệu + thông báo, khoá theo (mốc, ngày đạt). */
export function lenhThuongMocChuoi(env: Env, sbd: string, moc: number, ngay: string, luc: string): D1PreparedStatement[] {
  const tt = TT_MOC_CHUOI[moc]
  if (!tt) return []
  return [
    lenhCongTinhThe(env, sbd, { khoa: `tt|moc_chuoi|${moc}|${ngay}`, so: tt, maMon: MA_TT.mocChuoi, luc }),
    lenhTraoHuyHieu(env, sbd, { ma: `chuoi_${moc}`, ngay, luc }),
    lenhThongBao(env, sbd, { ma: `moc_chuoi|${moc}|${ngay}`, loai: 'moc_chuoi', duLieu: { moc, tinhThe: tt }, luc }),
  ]
}

// --- Công tắc ----------------------------------------------------------------------------------------

const SQL_CONG_TAC = `SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (${KHOA_CONG_TAC.map(() => '?').join(',')})`
export const lenhDocCongTac = (env: Env): D1PreparedStatement => env.DB.prepare(SQL_CONG_TAC).bind(...KHOA_CONG_TAC)
export async function docCongTac(env: Env): Promise<CongTac> {
  try { return congTacTuDong((await lenhDocCongTac(env).all<{ khoa: string; gia_tri: string }>()).results ?? []) } catch { return congTacTuDong([]) }
}
/** Lệnh thầy: thân rỗng ⇒ đọc; `{khoa, giaTri}` ⇒ ghi rồi trả lại đúng dạng như đọc. Khoá lạ / giá trị lạ ⇒ `loi400`. */
export async function gvCongTacThuong(env: Env, b: Dong): Promise<{ ok: true; congTac: CongTac } | { ok: false; error: string; loi400: true }> {
  if (b.khoa !== undefined && b.khoa !== null && b.khoa !== '') {
    const khoa = chu(b.khoa)
    if (!(KHOA_CONG_TAC as readonly string[]).includes(khoa)) return { ok: false, error: `Khoá công tắc không có: ${khoa}`, loi400: true }
    const g = b.giaTri === true ? 'bat' : b.giaTri === false ? 'tat' : chu(b.giaTri)
    if (g !== 'bat' && g !== 'tat') return { ok: false, error: "Giá trị công tắc chỉ nhận 'bat' hoặc 'tat'.", loi400: true }
    await env.DB.prepare('INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind(khoa as KhoaCongTac, g, new Date().toISOString()).run()
  }
  return { ok: true, congTac: await docCongTac(env) }
}
const batTuCongTac = (c: CongTac) => ({ giai: c.thuong_giai_tuan === 'bat', thangHoa: c.thuong_thang_hoa === 'bat', banBe: c.thuong_ban_be === 'bat', kimCuong: c.thuong_kim_cuong === 'bat' })

// --- Số liệu MỘT ngày của em (một lô, theo chỉ mục) -------------------------------------------------------

/** Ba câu đọc số liệu ngày (đặt vào lô của nơi gọi): [tổng hợp, bài xong hôm nay, nhiệm vụ đã sinh]. */
function lenhSoLieuNgay(env: Env, sbd: string, ngay: string): D1PreparedStatement[] {
  return [
    env.DB.prepare(`SELECT
        (SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND ngay_vn = ?) AS nt,
        (SELECT COALESCE(SUM(so_vang), 0) FROM vang_so WHERE sbd = ?) AS tt,
        (SELECT json_group_array(khoa_yeu_cau) FROM vang_so WHERE sbd = ? AND khoa_yeu_cau LIKE ?) AS da_tra,
        (SELECT thuong FROM ruong_ngay WHERE em = ? AND ngay = ?) AS ruong,
        (SELECT COUNT(DISTINCT qid) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'chua_loi' AND ket_qua = 1) AS sua_loi,
        (SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd = ? AND ngay = ?) AS muc,
        ${sqlBinhDaMuaTuan(sbd, ngay).sql} AS binh_tuan`)
      .bind(sbd, ngay, sbd, sbd, `tt|${ngay}|%`, sbd, ngay, sbd, ngay, sbd, ngay, ...sqlBinhDaMuaTuan(sbd, ngay).tham),
    env.DB.prepare('SELECT phien, so_cau, so_dung, chuoi_max, kho_dung, hoan_hao, luc FROM thuong_bai_xong WHERE em = ? AND ngay = ?').bind(sbd, ngay),
    env.DB.prepare('SELECT ma, ten, can, thuong, thu_tu, xong_luc FROM nhiem_vu_ngay WHERE em = ? AND ngay = ? ORDER BY thu_tu').bind(sbd, ngay),
  ]
}

interface NgayEm {
  ngay: string
  nguyenTu: number
  tinhTheSo: number
  daTra: Set<string>
  ruongMo: boolean
  soLieu: SoLieuNgay
  mucCau: number | null
  mau: MauNhiemVu[]
  daSinh: boolean
  nhiemVu: NhiemVuEm[]
  /** Số bình đã mua tuần này (luật 27/10, tối đa BINH_MUA_TOI_DA_TUAN). */
  binhTuan: number
  /** `cau` (CHỈ-THÊM 27/10) = mức câu hôm nay thầy đặt (vd. 96) — để vòng nói rõ «16 chặng (96 câu)»; chưa chốt mức ⇒ vắng. */
  mucTieu: { daXong: number; can: number; cau?: number }
}

/** «Xong 2 bài» ⇒ «Xong 2 chặng», «Bài hoàn hảo» ⇒ «Chặng hoàn hảo»; giữ «Bài tập…», «Bài 8…». */
export function chuChangTen(s: string): string {
  return s.replace(/(^|[^\p{L}])(b|B)ài(?![\p{L}])(?! tập| học| \d)/gu, (_m, d: string, b: string) => `${d}${b === 'B' ? 'C' : 'c'}hặng`)
}

function phanTichNgay(sbd: string, ngay: string, kq: readonly { results?: unknown[] }[]): NgayEm {
  const t = (kq[0]?.results?.[0] ?? {}) as Dong
  const bai = (kq[1]?.results ?? []) as Dong[]
  const nv = (kq[2]?.results ?? []) as Dong[]
  const soLieu: SoLieuNgay = {
    baiXong: bai.length,
    chuoiMax: bai.reduce((m, r) => Math.max(m, so(r.chuoi_max)), 0),
    khoDung: bai.reduce((s, r) => s + so(r.kho_dung), 0),
    suaLoi: so(t.sua_loi),
    hoanHao: bai.filter((r) => so(r.hoan_hao) === 1).length,
    baiTruoc20h: bai.filter((r) => gioVnCua(chu(r.luc)) < 20).length,
  }
  // Boss 27/10: đơn vị ~6 câu gọi «chặng» — tên nhiệm vụ đã LƯU trước khi đổi chữ («Xong 2 bài», «Bài hoàn hảo») đổi khi đọc ra
  const mau: MauNhiemVu[] = nv.map((r) => ({ ma: chu(r.ma) as MaNhiemVu, ten: chuChangTen(chu(r.ten)), can: so(r.can), thuong: so(r.thuong) }))
  const nhiemVu = nhiemVuCuaNgay(sbd, ngay, soLieu, mau.length ? mau : undefined)
  const mucCau = t.muc === null || t.muc === undefined ? null : so(t.muc)
  return {
    ngay, nguyenTu: so(t.nt), tinhTheSo: so(t.tt), daTra: new Set(docJson<string[]>(t.da_tra, [])), ruongMo: t.ruong !== null && t.ruong !== undefined,
    soLieu, mucCau, mau, daSinh: mau.length > 0, nhiemVu, binhTuan: Math.max(0, so(t.binh_tuan)), mucTieu: { daXong: soLieu.baiXong, can: mucTieuBai(mucCau), ...(mucCau && mucCau > 0 ? { cau: mucCau } : {}) },
  }
}

/** Khoản tinh thể ĐÃ ĐẠT mà chưa trả (nhiệm vụ xong, mục tiêu ngày) — trả bằng `lenhTraThuongNgay`. */
function thuongChoTra(d: NgayEm): { khoa: string; so: number; maMon: string }[] {
  const ra: { khoa: string; so: number; maMon: string }[] = []
  for (const n of d.nhiemVu) if (n.xong && !d.daTra.has(`tt|${d.ngay}|nv|${n.ma}`)) ra.push({ khoa: `tt|${d.ngay}|nv|${n.ma}`, so: n.thuong, maMon: MA_TT.nhiemVu })
  if (d.mucTieu.daXong >= d.mucTieu.can && d.mucTieu.daXong > 0 && !d.daTra.has(`tt|${d.ngay}|muc_tieu`)) ra.push({ khoa: `tt|${d.ngay}|muc_tieu`, so: TT_MUC_TIEU_NGAY, maMon: MA_TT.mucTieu })
  return ra
}
function lenhSinhNhiemVu(env: Env, sbd: string, ngay: string): D1PreparedStatement[] {
  return chonNhiemVu(sbd, ngay).map((m, i) => env.DB.prepare('INSERT OR IGNORE INTO nhiem_vu_ngay(em, ngay, ma, thu_tu, ten, can, da, thuong) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
    .bind(sbd, ngay, m.ma, i, m.ten, m.can, m.thuong))
}
function lenhTraThuongNgay(env: Env, sbd: string, d: NgayEm, luc: string): D1PreparedStatement[] {
  const lenh: D1PreparedStatement[] = thuongChoTra(d).map((k) => lenhCongTinhThe(env, sbd, { ...k, luc }))
  if (!d.daSinh) lenh.push(...lenhSinhNhiemVu(env, sbd, d.ngay))
  for (const n of d.nhiemVu) {
    lenh.push(env.DB.prepare('UPDATE nhiem_vu_ngay SET da = ?, xong_luc = CASE WHEN ? = 1 THEN COALESCE(xong_luc, ?) ELSE xong_luc END WHERE em = ? AND ngay = ? AND ma = ?')
      .bind(n.tien, n.xong ? 1 : 0, luc, sbd, d.ngay, n.ma))
  }
  return lenh
}

/** Đọc số liệu ngày của em (một lô). */
export async function docNgayEm(env: Env, sbd: string, ngay: string): Promise<NgayEm> {
  return phanTichNgay(sbd, ngay, await env.DB.batch(lenhSoLieuNgay(env, sbd, ngay)))
}

// --- POST /hs/thuong ----------------------------------------------------------------------------------

export async function hsThuong(env: Env, b: Dong, ctx?: ExecutionContext, nowMs: number = Date.now()): Promise<Dong> {
  const { sbd: sbdKy, xong } = await gameIdentityHaiBuoc(env, b)
  const ngay = ngayVnTt(nowMs)
  // Chuỗi ngày (B3, 4 lượt đọc song song + cờ đệm) bắt đầu CÙNG đợt với lô đọc và lượt kiểm mật khẩu — không thêm vòng chờ nối tiếp.
  const chuoiSom = cauNoiChuoi().docChuoiNgay(env, sbdKy, nowMs, true).catch(() => null)
  // Tóm tắt giải tuần (phần B): MỘT batch riêng chạy CÙNG đợt (không thêm vòng chờ); tách lô để bảng giải chưa có / lỗi không làm hỏng tổng quan (⇒ null).
  const giaiSom = tomTatGiaiEm(env, sbdKy, nowMs).catch(() => null)
  // MỘT lô đọc: công tắc · số liệu ngày (3 câu) · thông báo chưa xem · cược đang chạy.
  const lo = env.DB.batch([
    lenhDocCongTac(env),
    ...lenhSoLieuNgay(env, sbdKy, ngay),
    env.DB.prepare('SELECT ma, loai, du_lieu FROM thong_bao_thuong WHERE em = ? AND da_xem IS NULL ORDER BY luc LIMIT 10').bind(sbdKy),
    env.DB.prepare("SELECT id, dat, tu_ngay, den_ngay FROM cuoc_chuoi WHERE em = ? AND trang_thai = 'dang' LIMIT 1").bind(sbdKy),
  ])
  lo.catch(() => {})
  const sbd = await xong
  const [kq, chuoiNgay, giai] = await Promise.all([lo, chuoiSom, giaiSom])
  const congTac = congTacTuDong((kq[0]?.results ?? []) as Dong[] as { khoa: unknown; gia_tri: unknown }[])
  const d = phanTichNgay(sbd, ngay, kq.slice(1, 4))
  const choTra = thuongChoTra(d)
  const cuoc = (kq[5]?.results?.[0] ?? null) as Dong | null
  // Trả thưởng mới đạt (nhiệm vụ / mục tiêu) + sinh nhiệm vụ lần đầu trong ngày: SAU phản hồi, idempotent theo khoá. Số trên màn đã gồm phần này.
  if (choTra.length || !d.daSinh) {
    const luc = new Date(nowMs).toISOString()
    await viecPhu(ctx, () => env.DB.batch(lenhTraThuongNgay(env, sbd, d, luc)))
  }
  return {
    ok: true,
    bat: batTuCongTac(congTac),
    nguyenTuHomNay: d.nguyenTu,
    tinhThe: d.tinhTheSo + choTra.reduce((t, k) => t + k.so, 0),
    mucTieu: d.mucTieu,
    chuoiNgay,
    nhiemVu: d.nhiemVu,
    ruong: { mo: d.ruongMo, thuong: TT_RUONG },
    // CHỈ-THÊM 27/10 (luật bình mới): giá + hạn mua 1 bình / tuần — giao diện xám nút và nói lý do khi `daMuaTuan`.
    binh: { gia: TT_BINH_GIU_CHUOI, toiDaTuan: BINH_MUA_TOI_DA_TUAN, daMuaTuan: d.binhTuan >= BINH_MUA_TOI_DA_TUAN, muaTiepTu: tuanMuaBinh(ngay).muaTiepTu },
    // Khối `giai` (phần B, tomTatGiaiEm): {hang, thuHang, soNguoi, hetHanGiay} | null (công tắc tắt / em chưa vào bảng tuần này) ⇒ giao diện ẩn thẻ.
    giai,
    thongBao: ((kq[4]?.results ?? []) as Dong[]).map((r) => ({ ma: chu(r.ma), loai: chu(r.loai), duLieu: docJson<unknown>(r.du_lieu, {}) })),
    // CHỈ-THÊM ngoài hợp đồng §4.4: cược đang chạy (để màn ẩn nút «Cược» khi đã có một lượt).
    cuoc: cuoc ? { dat: so(cuoc.dat), tuNgay: chu(cuoc.tu_ngay), denNgay: chu(cuoc.den_ngay) } : null,
  }
}

// --- POST /hs/thuong/mo-ruong --------------------------------------------------------------------------

export async function hsMoRuong(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const { sbd: sbdKy, xong } = await gameIdentityHaiBuoc(env, b)
  const ngay = ngayVnTt(nowMs)
  const doc = docNgayEm(env, sbdKy, ngay)
  doc.catch(() => {})
  const sbd = await xong
  const d = await doc
  if (d.ruongMo) return { ok: true, ruong: { mo: true, thuong: TT_RUONG }, tinhThe: d.tinhTheSo, daMoTruoc: true }
  if (!d.nhiemVu.every((n) => n.xong)) return { ok: false, error: 'Em hoàn thành đủ 3 nhiệm vụ hôm nay để mở rương nhé.' }
  const luc = new Date(nowMs).toISOString()
  const r = await env.DB.batch([
    ...lenhTraThuongNgay(env, sbd, d, luc), // nhiệm vụ / mục tiêu còn chờ trả đi cùng lô
    env.DB.prepare('INSERT OR IGNORE INTO ruong_ngay(em, ngay, thuong, luc) VALUES (?, ?, ?, ?)').bind(sbd, ngay, TT_RUONG, luc),
    lenhCongTinhThe(env, sbd, { khoa: `tt|${ngay}|ruong`, so: TT_RUONG, maMon: MA_TT.ruong, luc }, { sql: 'changes() = 1', tham: [] }),
    env.DB.prepare('SELECT COALESCE(SUM(so_vang), 0) AS v FROM vang_so WHERE sbd = ?').bind(sbd),
  ])
  const n = r.length
  return { ok: true, ruong: { mo: true, thuong: TT_RUONG }, tinhThe: so((r[n - 1]?.results?.[0] as Dong | undefined)?.v), ...(Number(r[n - 3]?.meta?.changes ?? 0) ? {} : { daMoTruoc: true }) }
}

// --- POST /hs/thuong/mua-binh --------------------------------------------------------------------------

export const LOI_DA_MUA_TUAN = 'Tuần này em đã mua · mua tiếp từ thứ Hai'

export async function hsMuaBinh(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const { sbd: sbdKy, xong } = await gameIdentityHaiBuoc(env, b)
  const cn = cauNoiChuoi()
  const chuoiSom = cn.docChuoiNgay(env, sbdKy, nowMs).catch(() => null)
  const sbd = await xong
  const c = await chuoiSom
  // Chuỗi ngày chưa mở cho em (cờ B3 tắt) ⇒ chưa bán bình, KHÔNG trừ tinh thể.
  if (!c) return { ok: false, error: 'Bình giữ chuỗi sắp mở, em chờ thêm ít hôm nhé.' }
  if (c.giuChuoi >= c.sucChua) return { ok: false, ma: 'day_binh', error: `Em đang mang đủ ${c.sucChua} bình rồi.` }
  const ngay = ngayVnTt(nowMs)
  const luc = new Date(nowMs).toISOString()
  const khoa = `tt|${ngay}|${HAU_TO_KHOA_BINH_TUAN}`
  const tuan = sqlBinhDaMuaTuan(sbd, ngay)
  const muaTiepTu = tuanMuaBinh(ngay).muaTiepTu
  // Bước 1 (một lô): trừ giá CHỈ khi đủ số dư VÀ tuần này chưa mua (luật 27/10: 1 bình / tuần); khoá theo ngày ⇒ bấm lặp không trừ đôi. Đọc số dư + số đã mua tuần.
  const r = await env.DB.batch([
    lenhTruTinhThe(env, sbd, { khoa, so: TT_BINH_GIU_CHUOI, maMon: MA_TT.binh, luc }, { sql: `${tuan.sql} < ?`, tham: [...tuan.tham, BINH_MUA_TOI_DA_TUAN] }),
    env.DB.prepare(`SELECT COALESCE(SUM(so_vang), 0) AS v, ${tuan.sql} AS da_tuan FROM vang_so WHERE sbd = ?`).bind(...tuan.tham, sbd),
  ])
  const cuoi = (r[1]?.results?.[0] ?? {}) as Dong
  if (!Number(r[0]?.meta?.changes ?? 0)) {
    if (so(cuoi.da_tuan) >= BINH_MUA_TOI_DA_TUAN) return { ok: false, ma: 'da_mua_tuan', error: LOI_DA_MUA_TUAN, muaTiepTu, tinhThe: so(cuoi.v) }
    if (so(cuoi.v) < TT_BINH_GIU_CHUOI) return { ok: false, ma: 'thieu_tinh_the', error: `Em cần ${TT_BINH_GIU_CHUOI} tinh thể để mua bình.`, tinhThe: so(cuoi.v) }
    return { ok: false, ma: 'thu_lai', error: 'Chưa mua được bình, em thử lại vào ngày mai nhé.', tinhThe: so(cuoi.v) }
  }
  // Bước 2: hàm cộng bình của B3 (id = khoá giao dịch ví ⇒ gọi lại không cộng đôi). Ghi lỗi ⇒ hoàn đúng số đã trừ (khoá hoàn riêng, không hoàn đôi; lượt hoàn
  // trừ khỏi số đã mua tuần ⇒ từ hôm sau em mua lại được trong tuần).
  const binh = await congBinhGiuChuoi(env, sbd, `${sbd}|${khoa}`, nowMs)
  if (!binh.ok) {
    await lenhCongTinhThe(env, sbd, { khoa: `${khoa}|hoan`, so: TT_BINH_GIU_CHUOI, maMon: MA_TT.binhHoan, luc }).run().catch(() => null)
    return { ok: false, ma: 'thu_lai', error: 'Chưa mua được bình, tinh thể đã hoàn lại. Em thử lại vào ngày mai nhé.', tinhThe: so(cuoi.v) + TT_BINH_GIU_CHUOI }
  }
  return { ok: true, tinhThe: so(cuoi.v), gia: TT_BINH_GIU_CHUOI, giuChuoi: Math.min(c.sucChua, c.giuChuoi + 1), sucChua: c.sucChua, daMuaTuan: true, muaTiepTu }
}

// --- POST /hs/thuong/cuoc ------------------------------------------------------------------------------

export async function hsCuocChuoi(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const sbd = await (await gameIdentityHaiBuoc(env, b)).xong
  if (b.dat !== undefined && so(b.dat) !== TT_CUOC_DAT) return { ok: false, error: `Mỗi lượt cược đặt đúng ${TT_CUOC_DAT} tinh thể.` }
  const ngay = ngayVnTt(nowMs)
  const luc = new Date(nowMs).toISOString()
  const id = `${sbd}|${ngay}`
  const den = congNgayTt(ngay, CUOC_SO_NGAY - 1)
  const r = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO cuoc_chuoi(id, em, dat, tu_ngay, den_ngay, trang_thai, luc)
        SELECT ?, ?, ?, ?, ?, 'dang', ? WHERE (SELECT COALESCE(SUM(so_vang), 0) FROM vang_so WHERE sbd = ?) >= ?`).bind(id, sbd, TT_CUOC_DAT, ngay, den, luc, sbd, TT_CUOC_DAT),
    lenhTruTinhThe(env, sbd, { khoa: `tt|cuoc|${id}`, so: TT_CUOC_DAT, maMon: MA_TT.cuoc, luc }, { sql: 'changes() = 1', tham: [] }),
    env.DB.prepare("SELECT COALESCE((SELECT SUM(so_vang) FROM vang_so WHERE sbd = ?), 0) AS v, (SELECT id FROM cuoc_chuoi WHERE em = ? AND trang_thai = 'dang') AS dang").bind(sbd, sbd),
  ])
  const cuoi = (r[2]?.results?.[0] ?? {}) as Dong
  if (!Number(r[0]?.meta?.changes ?? 0)) {
    if (cuoi.dang) return { ok: false, error: 'Em đang có một lượt cược rồi.', tinhThe: so(cuoi.v) }
    return { ok: false, error: `Em cần ${TT_CUOC_DAT} tinh thể để cược.`, tinhThe: so(cuoi.v) }
  }
  return { ok: true, cuoc: { dat: TT_CUOC_DAT, tuNgay: ngay, denNgay: den, thuong: TT_CUOC_THANG }, tinhThe: so(cuoi.v) }
}

// --- POST /hs/thuong/da-xem ----------------------------------------------------------------------------

export async function hsDaXemThongBao(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const sbd = await (await gameIdentityHaiBuoc(env, b)).xong
  const ma = chu(b.ma).trim()
  if (!ma || ma.length > 200) return { ok: false, error: 'Thiếu mã thông báo.' }
  await env.DB.prepare('UPDATE thong_bao_thuong SET da_xem = ? WHERE em = ? AND ma = ? AND da_xem IS NULL').bind(new Date(nowMs).toISOString(), sbd, ma).run()
  return { ok: true }
}

// --- POST /hs/huy-hieu ---------------------------------------------------------------------------------

export async function hsHuyHieu(env: Env, b: Dong, ctx?: ExecutionContext, nowMs: number = Date.now()): Promise<Dong> {
  const { sbd: sbdKy, xong } = await gameIdentityHaiBuoc(env, b)
  const ngay = ngayVnTt(nowMs)
  const chuoiSom = cauNoiChuoi().docChuoiNgay(env, sbdKy, nowMs).catch(() => null)
  const lo = env.DB.batch([
    env.DB.prepare('SELECT ma, ngay, du_lieu FROM huy_hieu_em WHERE em = ?').bind(sbdKy),
    env.DB.prepare(`SELECT COALESCE(SUM(hoan_hao), 0) AS hh, COALESCE(MAX(chuoi_max), 0) AS cm,
        COALESCE(MAX(CASE WHEN CAST(strftime('%H', luc, '+7 hours') AS INTEGER) >= ? THEN 1 ELSE 0 END), 0) AS dem FROM thuong_bai_xong WHERE em = ?`).bind(GIO_CU_DEM, sbdKy),
  ])
  lo.catch(() => {})
  const sbd = await xong
  const [kq, chuoi] = await Promise.all([lo, chuoiSom])
  const co = new Map(((kq[0]?.results ?? []) as Dong[]).map((r) => [chu(r.ma), r]))
  const t = (kq[1]?.results?.[0] ?? {}) as Dong
  const { dat, tien } = datHuyHieu({ chuoiNgay: chuoi?.so ?? 0, hoanHao: so(t.hh), chuoiDungMax: so(t.cm), coBaiDem: so(t.dem) === 1 })
  const moi = dat.filter((m) => !co.has(m))
  if (moi.length) {
    const luc = new Date(nowMs).toISOString()
    await viecPhu(ctx, () => env.DB.batch(moi.flatMap((ma) => [
      lenhTraoHuyHieu(env, sbd, { ma, ngay, luc }),
      lenhThongBao(env, sbd, { ma: `huy_hieu|${ma}`, loai: 'huy_hieu', duLieu: { ma, ten: HUY_HIEU.find((h) => h.ma === ma)?.ten ?? ma }, luc }),
    ])))
  }
  const ds = HUY_HIEU.map((h) => {
    const dong = co.get(h.ma)
    const coNgay = dong ? chu(dong.ngay) : moi.includes(h.ma) ? ngay : null
    return { ma: h.ma, ten: h.ten, co: coNgay !== null, ...(h.can ? { tienDo: { da: Math.min(h.can, so(tien[h.ma])), can: h.can } } : {}), ...(coNgay ? { ngay: coNgay } : {}) }
  })
  // Kim cương từng chuyên đề: `kc|<chuyên đề>` (du_lieu.ten = tên bài).
  for (const [ma, dong] of co) if (ma.startsWith('kc|')) ds.push({ ma, ten: `Kim cương · ${chu(docJson<Dong>(dong.du_lieu, {}).ten) || ma.slice(3)}`, co: true, ngay: chu(dong.ngay) })
  return { ok: true, huyHieu: ds }
}

// --- Cron hằng ngày 00:10 giờ VN ---------------------------------------------------------------------

/** Khung chạy (phút trong ngày VN) — cron mỗi phút gọi; xong rồi thì một câu đọc rồi về. */
export const CRON_THUONG_TU_PHUT = 10
export const CRON_THUONG_DEN_PHUT = 60
const KHOA_CRON = 'thuong_cron_ngay'
/** Số em tối đa được trả bù thưởng hôm qua mỗi đêm (ngân sách truy vấn D1 của một lượt cron). */
export const TOI_DA_TRA_BU = 60

export interface KetQuaCronThuong { chay: boolean; thangHoa: number; cuocThang: number; cuocThua: number; traBu: number; sinh: number }

/**
 * Việc đêm (idempotent từng khoản — chạy lại / chạy chồng không đôi): (1) THĂNG HOA: em có tinh thể > 0, hai ngày liền (hôm qua, hôm kia, đều ≥ mốc) không
 * có học và không được đỡ, hôm qua chưa bị thăng hoa ⇒ mất `soThangHoa` + thông báo; (2) CHỐT CƯỢC; (3) TRẢ BÙ thưởng ngày hôm qua còn sót; (4) SINH 3 nhiệm vụ
 * hôm nay cho em có học trong 7 ngày. Công tắc «thuong_thang_hoa» tắt ⇒ bỏ (1). `epBuoc` (test) chạy ngoài khung giờ.
 */
export async function cronThuongNgay(env: Env, nowMs: number, epBuoc = false): Promise<KetQuaCronThuong> {
  const ra: KetQuaCronThuong = { chay: false, thangHoa: 0, cuocThang: 0, cuocThua: 0, traBu: 0, sinh: 0 }
  const g = new Date(nowMs + 7 * 3_600_000)
  const phut = g.getUTCHours() * 60 + g.getUTCMinutes()
  if (!epBuoc && (phut < CRON_THUONG_TU_PHUT || phut >= CRON_THUONG_DEN_PHUT)) return ra
  const homNay = ngayVnTt(nowMs)
  const [daChay, mocRow, congTac] = await Promise.all([
    env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CRON).first<{ gia_tri: string }>().catch(() => null),
    env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'thuong_moc'").first<{ gia_tri: string }>().catch(() => null),
    docCongTac(env),
  ])
  if (!epBuoc && daChay?.gia_tri === homNay) return ra
  ra.chay = true
  const moc = chu(mocRow?.gia_tri) || homNay
  const luc = new Date(nowMs).toISOString()
  const homQua = congNgayTt(homNay, -1)
  const cn = cauNoiChuoi()
  // Ngân sách truy vấn D1 của một lượt cron: mọi ghi hàng loạt đi bằng MỘT câu cho cả lô em (json_each), không một câu mỗi em.
  const lo = <T,>(ds: readonly T[], n: number): T[][] => Array.from({ length: Math.ceil(ds.length / n) }, (_, i) => ds.slice(i * n, i * n + n))

  // (1) Thăng hoa.
  const tu = congNgayTt(homNay, -THANG_HOA_SO_NGAY)
  if (congTac.thuong_thang_hoa === 'bat' && tu >= moc) {
    const ung = ((await env.DB.prepare(`SELECT v.sbd, v.so FROM (SELECT sbd, SUM(so_vang) AS so FROM vang_so GROUP BY sbd) v
        WHERE v.so > 0 AND NOT EXISTS (SELECT 1 FROM vang_so x WHERE x.sbd = v.sbd AND x.khoa_yeu_cau = ?)`).bind(`tt|${homQua}|thang_hoa`).all<{ sbd: string; so: number }>()).results ?? [])
    if (ung.length) {
      const ds = ung.map((x) => String(x.sbd))
      const [hoc, doDo] = await Promise.all([cn.docNgayCoHoc(env, ds, tu, homQua), cn.docNgayDuocDo(env, ds, tu, homQua, nowMs)])
      const mat: { s: string; m: number; c: number }[] = []
      for (const x of ung) {
        const s = String(x.sbd)
        // Em chưa tính được bình (vượt ngân sách lượt này) ⇒ BỎ QUA, không phạt oan.
        if (doDo.get(s)?.has(CHUA_TINH_BINH)) continue
        if ([tu, homQua].some((n) => hoc.get(s)?.has(n) || doDo.get(s)?.has(n))) continue
        const m = soThangHoa(so(x.so))
        if (m > 0) mat.push({ s, m, c: so(x.so) - m })
      }
      const khoa = `tt|${homNay}|thang_hoa`
      for (const phan of lo(mat, 100)) {
        const r = await env.DB.batch([
          // Trừ CHỈ khi số dư lúc ghi ≥ số mất (không âm); khoá theo ngày ⇒ chạy lại không trừ đôi.
          env.DB.prepare(`INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
              SELECT json_extract(j.value, '$.s'), 'mua', -json_extract(j.value, '$.m'), 0, ?, ?, ? FROM json_each(?) j
              WHERE json_extract(j.value, '$.m') > 0 AND (SELECT COALESCE(SUM(v.so_vang), 0) FROM vang_so v WHERE v.sbd = json_extract(j.value, '$.s')) >= json_extract(j.value, '$.m')`)
            .bind(MA_TT.thangHoa, khoa, luc, json(phan)),
          // Thông báo một lần — chỉ cho em có dòng trừ của CHÍNH lượt này.
          env.DB.prepare(`INSERT OR IGNORE INTO thong_bao_thuong(em, ma, loai, du_lieu, luc)
              SELECT json_extract(j.value, '$.s'), ?, 'thang_hoa', json_object('mat', json_extract(j.value, '$.m'), 'conLai', json_extract(j.value, '$.c')), ? FROM json_each(?) j
              WHERE EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = json_extract(j.value, '$.s') AND v.khoa_yeu_cau = ? AND v.luc = ?)`)
            .bind(`thang_hoa|${homNay}`, luc, json(phan), khoa, luc),
        ])
        ra.thangHoa += Number(r[0]?.meta?.changes ?? 0)
      }
    }
  }

  // (2) Chốt cược: đứt (một ngày không học, trừ ngày có phép) ⇒ thua; đủ 7 ngày ⇒ thắng +100.
  const cuoc = ((await env.DB.prepare("SELECT id, em, tu_ngay, den_ngay FROM cuoc_chuoi WHERE trang_thai = 'dang' AND tu_ngay <= ?").bind(homQua).all<Dong>()).results ?? [])
  if (cuoc.length) {
    const ds = [...new Set(cuoc.map((c) => chu(c.em)))]
    const tuMin = cuoc.reduce((m, c) => (chu(c.tu_ngay) < m ? chu(c.tu_ngay) : m), homQua)
    const [hoc, phep] = await Promise.all([cn.docNgayCoHoc(env, ds, tuMin, homQua), cn.docNgayCoPhep(env, ds, tuMin, homQua)])
    const lenh: D1PreparedStatement[] = []
    for (const c of cuoc) {
      const em = chu(c.em), id = chu(c.id), den = chu(c.den_ngay)
      let dut = false
      for (let n = chu(c.tu_ngay); n <= homQua && n <= den; n = congNgayTt(n, 1)) if (!hoc.get(em)?.has(n) && !phep.get(em)?.has(n)) { dut = true; break }
      if (!dut && homQua < den) continue
      const kq = dut ? 'thua' : 'thang'
      lenh.push(env.DB.prepare("UPDATE cuoc_chuoi SET trang_thai = ?, xong_luc = ? WHERE id = ? AND trang_thai = 'dang'").bind(kq, luc, id))
      if (!dut) lenh.push(lenhCongTinhThe(env, em, { khoa: `tt|cuoc|${id}|thang`, so: TT_CUOC_THANG, maMon: MA_TT.cuocThang, luc }, { sql: 'changes() = 1', tham: [] }))
      lenh.push(lenhThongBao(env, em, { ma: `cuoc|${id}`, loai: 'cuoc', duLieu: { ketQua: kq, tinhThe: dut ? -TT_CUOC_DAT : TT_CUOC_THANG }, luc }))
      if (dut) ra.cuocThua++
      else ra.cuocThang++
    }
    for (const phan of lo(lenh, 60)) await env.DB.batch(phan)
  }

  // (3) Trả bù thưởng hôm qua (em có bài xong hôm qua mà chưa mở lại app trước nửa đêm) — mỗi em MỘT lô đọc, chạy song song 10 em, tối đa TOI_DA_TRA_BU em.
  const emHomQua = ((await env.DB.prepare('SELECT DISTINCT em FROM thuong_bai_xong WHERE ngay = ? LIMIT ?').bind(homQua, TOI_DA_TRA_BU).all<{ em: string }>()).results ?? []).map((x) => String(x.em))
  const tra: D1PreparedStatement[] = []
  for (const phan of lo(emHomQua, 10)) {
    await Promise.all(phan.map(async (em) => {
      const d = await docNgayEm(env, em, homQua).catch(() => null)
      const k = d ? thuongChoTra(d) : []
      if (k.length) { ra.traBu++; for (const x of k) tra.push(lenhCongTinhThe(env, em, { ...x, luc })) }
    }))
  }
  for (const phan of lo(tra, 60)) await env.DB.batch(phan)

  // (4) Sinh 3 nhiệm vụ hôm nay cho em có bài xong trong 7 ngày (một câu cho cả lô 150 em).
  const emGanDay = ((await env.DB.prepare('SELECT DISTINCT em FROM thuong_bai_xong WHERE ngay >= ? AND ngay <= ?').bind(congNgayTt(homNay, -7), homQua).all<{ em: string }>()).results ?? []).map((x) => String(x.em))
  for (const phan of lo(emGanDay, 150)) {
    const dong = phan.flatMap((em) => chonNhiemVu(em, homNay).map((m, i) => ({ e: em, m: m.ma, i, t: m.ten, c: m.can, g: m.thuong })))
    await env.DB.prepare(`INSERT OR IGNORE INTO nhiem_vu_ngay(em, ngay, ma, thu_tu, ten, can, da, thuong)
        SELECT json_extract(value, '$.e'), ?, json_extract(value, '$.m'), json_extract(value, '$.i'), json_extract(value, '$.t'), json_extract(value, '$.c'), 0, json_extract(value, '$.g') FROM json_each(?)`)
      .bind(homNay, json(dong)).run()
  }
  ra.sinh = emGanDay.length

  await env.DB.prepare('INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_CRON, homNay, luc).run()
  return ra
}

// --- Bài xong (gọi từ câu cuối của bài, SAU phản hồi) -------------------------------------------------

export interface BaiXong { phien: string; ngay: string; soCau: number; soDung: number; chuoiMax: number; khoDung: number; hoanHao: boolean; nguyenTu: number; luc: string }
export function lenhGhiBaiXong(env: Env, sbd: string, x: BaiXong): D1PreparedStatement {
  return env.DB.prepare('INSERT OR IGNORE INTO thuong_bai_xong(em, phien, ngay, so_cau, so_dung, chuoi_max, kho_dung, hoan_hao, nguyen_tu, luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(sbd, x.phien, x.ngay, x.soCau, x.soDung, x.chuoiMax, x.khoDung, x.hoanHao ? 1 : 0, x.nguyenTu, x.luc)
}
/** Dùng cho test / tác tử khác: dữ liệu rỗng của một ngày. */
export const SO_LIEU_NGAY_RONG = SO_LIEU_RONG
