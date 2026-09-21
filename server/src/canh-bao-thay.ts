// CẢNH BÁO CỦA THẦY cho em chưa nộp bài tập về nhà — hợp đồng docs/hop-dong-hom-nay-v2-2109.md (Code 3 ↔ Code 4 ↔ Code 2, 21/09/2026).
//
//   · GHI (một lệnh duy nhất): `guiCanhBao` — `/gv/canh-bao-nop-bai`, sau cổng `laThay`. Mỗi em hợp lệ nhận MỘT dòng `canh_bao_thay` (khoá chính `cb:<maBtvn>:<sbd>:<ngày VN>` ⇒
//     TRẦN MỘT cảnh báo/em/bài/ngày), MỘT thông báo `student_notice` (target `canh_bao_btvn`, đi kênh push sẵn có của em nếu em đã bật) và lời cho phụ huynh (đọc ở `/ph/ke-hoach`).
//   · ĐỌC phía em (`canhBaoChoEm`, khoá `canhBaoThay` của `/hs/ke-hoach-ngay`) và phía phụ huynh (`canhBaoChoPh`, khoá `canhBaoThay` của `/ph/ke-hoach`); ghi "đã xem" (`emXemCanhBao`, `phXemCanhBao`).
// Chỉ THẦY bấm mới gửi. Bộ não A.I KHÔNG có đường nào tới đây (test khoá: không tệp `bo-nao*.ts` nào nhắc tới bảng này). Lời nói ĐÚNG sự thật (chưa mở / dở chặng mấy / hạn lúc nào),
// không so với bạn, không doạ, không emoji, không gạch ngang dài; xưng Thầy; gọi phụ huynh "Anh/chị".
import type { Env } from './kieu'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const MOT_NGAY_MS = 86_400_000
const GIO_VN_MS = 7 * 3_600_000

export const TOI_DA_EM_MOT_LUOT = 60
export const TOI_DA_KY_TU_LOI_EM = 200
/** Cảnh báo còn hiện ở app em trong ngần này giờ kể từ lúc gửi (chỉ khi bài CHƯA nộp) / ở app phụ huynh. */
export const GIO_HIEN_EM = 48
export const GIO_HIEN_PH = 72
/** Bài quá hạn quá ngần này ngày thì không cảnh báo nữa (đã là chuyện khác: thầy giao lại hoặc thu hồi). */
export const NGAY_QUA_HAN_TOI_DA = 3
export const TEN_BAI_MAC_DINH = 'Bài tập về nhà'
export const TIEU_DE_THONG_BAO = 'Thầy nhắc bài tập'
export const KENH_THONG_BAO = 'canh_bao_btvn'

export type TrangThaiNop = 'chua_mo' | 'do_chang' | 'qua_han'
export type LyDoBoQua = 'da_nop' | 'khong_thuoc_bai' | 'da_canh_bao_hom_nay' | 'thu_hoi' | 'bai_qua_han_nhieu_ngay'

export const ngayVnCuaMs = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const mocMs = (iso: string): number => {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : 0
}

/** Mốc hạn nộp viết cho người đọc: "23:59 hôm nay" / "23:59 ngày mai" / "23:59 22/09" (giờ VN, 24 giờ). */
export function chuHan(hanNopIso: string, nowMs: number): string {
  const han = mocMs(hanNopIso)
  if (!han) return 'chưa rõ'
  const v = new Date(han + GIO_VN_MS).toISOString()
  const gio = v.slice(11, 16)
  const ngay = v.slice(0, 10)
  const homNay = ngayVnCuaMs(nowMs)
  if (ngay === homNay) return `${gio} hôm nay`
  if (ngay === ngayVnCuaMs(nowMs + MOT_NGAY_MS)) return `${gio} ngày mai`
  return `${gio} ${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
}

/** Trạng thái nộp của MỘT em trong MỘT bài — chỉ nói việc đã xảy ra. Dùng chung cho cảnh báo và `/gv/chua-nop`. */
export interface TrangThaiNopBai {
  trangThai: TrangThaiNop
  /** Chữ THẬT dựng từ số liệu ("Chưa mở bài", "Dở chặng 2 trong 7", "Quá hạn 1 ngày"). */
  nhan: string
  chang?: { daXong: number; tong: number; hienTai: number }
  soNgayQuaHan: number
}
export function trangThaiNopBai(e: Hang, hanNopIso: string, nowMs: number): TrangThaiNopBai {
  const han = mocMs(hanNopIso)
  const tong = Number(e.so_chang) || 0
  const daXong = Number(e.lo_da_xong) || 0
  const caNhan = tong > 0
  // Chưa mở = chưa có tiến độ nào: bài cá nhân hoá chưa CHỐT bộ câu (chốt lúc em mở bài); bài cũ chưa có đáp án nào và chưa xong vòng 1.
  const daMo = caNhan ? chuoi(e.chot_luc) !== '' : chuoi(e.dap_an_json).replace(/[\s{}]/g, '') !== '' || chuoi(e.xong_vong1_luc) !== ''
  const chang = caNhan && daMo ? { daXong, tong, hienTai: Math.min(daXong + 1, tong) } : undefined
  const quaMs = han > 0 ? nowMs - han : 0
  if (han > 0 && quaMs > 0) {
    const n = Math.max(1, Math.ceil(quaMs / MOT_NGAY_MS))
    return { trangThai: 'qua_han', nhan: `Quá hạn ${n} ngày`, ...(chang ? { chang } : {}), soNgayQuaHan: n }
  }
  if (!daMo) return { trangThai: 'chua_mo', nhan: 'Chưa mở bài', soNgayQuaHan: 0 }
  return { trangThai: 'do_chang', nhan: chang ? `Dở chặng ${chang.hienTai} trong ${chang.tong}` : 'Làm dở, chưa nộp', ...(chang ? { chang } : {}), soNgayQuaHan: 0 }
}

/** Tên gọi của em trong lời gửi phụ huynh: chữ cuối của họ tên ("Nguyễn Thu Hà" → "Hà"); không có tên thì để trống (nơi dùng thay bằng "con"). */
const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).filter(Boolean).pop() ?? ''

export function loiMacDinhChoEm(st: TrangThaiNopBai, hanNopIso: string, nowMs: number): string {
  const han = chuHan(hanNopIso, nowMs)
  if (st.trangThai === 'qua_han') return `Thầy nhắc: Bài tập về nhà đã quá hạn ${st.soNgayQuaHan} ngày (hạn nộp ${han}). Em mở bài và làm nốt để nộp sớm.`
  if (st.trangThai === 'chua_mo') return `Thầy nhắc: em chưa mở Bài tập về nhà, hạn nộp ${han}. Em mở bài và bắt đầu làm.`
  if (st.chang) return `Thầy nhắc: em đang dở chặng ${st.chang.hienTai} trong ${st.chang.tong} của Bài tập về nhà, hạn nộp ${han}. Em làm tiếp từ chặng ${st.chang.hienTai}.`
  return `Thầy nhắc: em làm dở Bài tập về nhà, hạn nộp ${han}. Em mở bài và làm nốt phần còn lại.`
}

export function loiChoPhuHuynh(st: TrangThaiNopBai, hoTen: string, hanNopIso: string, nowMs: number): string {
  const han = chuHan(hanNopIso, nowMs)
  const ten = tenGoi(hoTen)
  const em = ten ? `em ${ten}` : 'con'
  const nhac = ten ? 'em' : 'con'
  if (st.trangThai === 'qua_han') return `Anh/chị, ${em} chưa nộp Bài tập về nhà, đã quá hạn ${st.soNgayQuaHan} ngày (hạn nộp ${han}). Anh/chị nhắc ${nhac} mở bài và nộp.`
  if (st.trangThai === 'chua_mo') return `Anh/chị, ${em} chưa mở Bài tập về nhà, hạn nộp ${han}. Anh/chị nhắc ${nhac} mở bài và làm hôm nay.`
  if (st.chang) return `Anh/chị, ${em} đang dở chặng ${st.chang.hienTai} trong ${st.chang.tong} của Bài tập về nhà, hạn nộp ${han}. Anh/chị nhắc ${nhac} làm tiếp.`
  return `Anh/chị, ${em} làm dở Bài tập về nhà, hạn nộp ${han}. Anh/chị nhắc ${nhac} làm nốt phần còn lại.`
}

const json = (v: unknown): string => JSON.stringify(v)

export interface KetQuaGui {
  ok: true
  /** Số truy vấn D1 của lệnh (đo, ≤ 12): btvn, btvn_em, đã-có-hôm-nay, và MỘT batch ghi. */
  soTruyVan: number
  daGui: number
  boQua: { sbd: string; lyDo: LyDoBoQua }[]
  luc: string
}

/**
 * `POST /gv/canh-bao-nop-bai {maBtvn, dsSbd[], loiNhan?}` — ghi cảnh báo. Không ném lỗi cho từng em: em không hợp lệ vào `boQua` kèm lý do.
 * Lỗi tổng (thiếu mã bài, bài không có, chưa chạy migration, quá 60 em) trả `{ok:false, error}`.
 */
export async function guiCanhBao(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<KetQuaGui | { ok: false; error: string }> {
  const maBtvn = chuoi(b.maBtvn).trim()
  if (!maBtvn) return { ok: false, error: 'Thiếu mã bài tập' }
  if (!Array.isArray(b.dsSbd)) return { ok: false, error: 'Thiếu danh sách em (dsSbd)' }
  const dsSbd = [...new Set((b.dsSbd as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean))]
  if (dsSbd.length === 0) return { ok: false, error: 'Danh sách em trống' }
  if (dsSbd.length > TOI_DA_EM_MOT_LUOT) return { ok: false, error: `Mỗi lượt tối đa ${TOI_DA_EM_MOT_LUOT} em, thầy gửi ${dsSbd.length}` }
  const loiNhan = chuoi(b.loiNhan).trim()
  if (loiNhan.length > TOI_DA_KY_TU_LOI_EM) return { ok: false, error: `Lời nhắn tối đa ${TOI_DA_KY_TU_LOI_EM} ký tự` }

  const bt = await env.DB.prepare('SELECT ma_btvn, han_nop, da_xoa FROM btvn WHERE ma_btvn = ?').bind(maBtvn).first<Hang>()
  if (!bt || Number(bt.da_xoa) === 1) return { ok: false, error: 'Không tìm thấy bài tập này' }
  const hanNop = chuoi(bt.han_nop)
  const homNay = ngayVnCuaMs(nowMs)
  const luc = new Date(nowMs).toISOString()

  const dsEm = await env.DB.prepare(
    `SELECT sbd, ho_ten, nop_luc, thu_hoi, dap_an_json, xong_vong1_luc, lo_da_xong, so_chang, chot_luc FROM btvn_em
      WHERE ma_btvn = ? AND sbd IN (SELECT value FROM json_each(?))`,
  ).bind(maBtvn, json(dsSbd)).all<Hang>()
  const theoEm = new Map<string, Hang>((dsEm.results ?? []).map((x) => [chuoi(x.sbd), x]))

  let daCoHomNay = new Set<string>()
  try {
    const r = await env.DB.prepare('SELECT sbd FROM canh_bao_thay WHERE ma_btvn = ? AND ngay = ? AND sbd IN (SELECT value FROM json_each(?))').bind(maBtvn, homNay, json(dsSbd)).all<Hang>()
    daCoHomNay = new Set((r.results ?? []).map((x) => chuoi(x.sbd)))
  } catch {
    return { ok: false, error: 'Máy chủ chưa cập nhật bảng cảnh báo (cần chạy migration-2109-canh-bao-thay.sql).' }
  }

  const boQua: { sbd: string; lyDo: LyDoBoQua }[] = []
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  const guiDuoc: string[] = []
  const quaHanNhieuNgay = mocMs(hanNop) > 0 && nowMs - mocMs(hanNop) > NGAY_QUA_HAN_TOI_DA * MOT_NGAY_MS
  for (const sbd of dsSbd) {
    const e = theoEm.get(sbd)
    if (!e) { boQua.push({ sbd, lyDo: 'khong_thuoc_bai' }); continue }
    if (Number(e.thu_hoi) === 1) { boQua.push({ sbd, lyDo: 'thu_hoi' }); continue }
    if (chuoi(e.nop_luc) !== '') { boQua.push({ sbd, lyDo: 'da_nop' }); continue }
    if (quaHanNhieuNgay) { boQua.push({ sbd, lyDo: 'bai_qua_han_nhieu_ngay' }); continue }
    if (daCoHomNay.has(sbd)) { boQua.push({ sbd, lyDo: 'da_canh_bao_hom_nay' }); continue }
    const st = trangThaiNopBai(e, hanNop, nowMs)
    const id = `cb:${maBtvn}:${sbd}:${homNay}`
    const loiEm = loiNhan || loiMacDinhChoEm(st, hanNop, nowMs)
    const loiPh = loiChoPhuHuynh(st, chuoi(e.ho_ten), hanNop, nowMs)
    lenh.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO canh_bao_thay (id, ma_btvn, sbd, ngay, ten_btvn, han_nop, loi_em, loi_ph, trang_thai_em, gui_luc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, maBtvn, sbd, homNay, TEN_BAI_MAC_DINH, hanNop, loiEm, loiPh, st.trangThai, luc),
      env.DB.prepare('INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, sbd, TIEU_DE_THONG_BAO, loiEm, KENH_THONG_BAO, luc),
    )
    guiDuoc.push(sbd)
  }
  let daGui = 0
  if (lenh.length > 0) {
    const kq = await env.DB.batch(lenh)
    // Cặp lệnh (canh_bao_thay, student_notice) theo thứ tự `guiDuoc`: dòng canh_bao_thay không được chèn (đua với lượt khác) ⇒ coi như đã cảnh báo hôm nay.
    guiDuoc.forEach((sbd, i) => {
      if (Number(kq[2 * i]?.meta?.changes) > 0) daGui++
      else boQua.push({ sbd, lyDo: 'da_canh_bao_hom_nay' })
    })
  }
  return { ok: true, soTruyVan: lenh.length > 0 ? 4 : 3, daGui, boQua, luc }
}

/** Cảnh báo cho MỘT em (≤ 3, mới nhất trước): còn trong cửa sổ giờ, bài CHƯA nộp, chưa thu hồi, bài chưa xoá. Trạng thái tính LẠI theo lúc đọc. Lỗi/bảng chưa có ⇒ []. */
async function docCanhBaoCuaEm(env: Env, sbd: string, nowMs: number, gio: number, kenh: 'em' | 'ph'): Promise<Hang[]> {
  try {
    const r = await env.DB.prepare(
      `SELECT c.id, c.ma_btvn, c.ten_btvn, c.gui_luc, c.han_nop, c.loi_em, c.loi_ph, c.em_xem_luc, c.ph_xem_luc, c.moc, b.han_nop AS han_hien_tai,
              e.dap_an_json, e.xong_vong1_luc, e.lo_da_xong, e.so_chang, e.chot_luc
         FROM canh_bao_thay c
         JOIN btvn_em e ON e.ma_btvn = c.ma_btvn AND e.sbd = c.sbd
         JOIN btvn b ON b.ma_btvn = c.ma_btvn
        WHERE c.sbd = ? AND c.gui_luc >= ? AND e.nop_luc IS NULL AND e.thu_hoi = 0 AND b.da_xoa = 0 AND (? = 'em' OR (c.gui_ph = 1 AND c.loi_ph <> ''))
        ORDER BY c.gui_luc DESC LIMIT 3`,
    ).bind(sbd, new Date(nowMs - gio * 3_600_000).toISOString(), kenh).all<Hang>()
    return r.results ?? []
  } catch {
    return []
  }
}

/** Khoá `canhBaoThay` của `/hs/ke-hoach-ngay`. Rỗng ⇒ nơi gọi KHÔNG đính khoá. */
export async function canhBaoChoEm(env: Env, sbd: string, nowMs: number = Date.now()) {
  const ds = await docCanhBaoCuaEm(env, sbd, nowMs, GIO_HIEN_EM, 'em')
  return ds.map((c) => {
    const hanNop = chuoi(c.han_hien_tai) || chuoi(c.han_nop) // hạn HIỆN TẠI của bài (thầy có thể gia hạn sau khi gửi)
    const st = trangThaiNopBai(c, hanNop, nowMs)
    return {
      id: chuoi(c.id), maBtvn: chuoi(c.ma_btvn), tenBtvn: chuoi(c.ten_btvn), guiLuc: chuoi(c.gui_luc), hanNop,
      loi: chuoi(c.loi_em), trangThaiEm: st.trangThai, ...(st.chang ? { chang: { hienTai: st.chang.hienTai, tong: st.chang.tong } } : {}), daXem: chuoi(c.em_xem_luc) !== '',
    }
  })
}

/** Khoá `canhBaoThay` của `/ph/ke-hoach`: CÙNG hình dạng với phía em (Code 2 chốt), nhưng `loi` là LỜI CHO PHỤ HUYNH và `daXem` là phụ huynh đã xem. */
export async function canhBaoChoPh(env: Env, sbd: string, nowMs: number = Date.now()) {
  const ds = await docCanhBaoCuaEm(env, sbd, nowMs, GIO_HIEN_PH, 'ph')
  return ds.map((c) => {
    const hanNop = chuoi(c.han_hien_tai) || chuoi(c.han_nop)
    const st = trangThaiNopBai(c, hanNop, nowMs)
    return {
      id: chuoi(c.id), maBtvn: chuoi(c.ma_btvn), tenBtvn: chuoi(c.ten_btvn), guiLuc: chuoi(c.gui_luc), hanNop,
      loi: chuoi(c.loi_ph), trangThaiEm: st.trangThai, ...(st.chang ? { chang: { hienTai: st.chang.hienTai, tong: st.chang.tong } } : {}), daXem: chuoi(c.ph_xem_luc) !== '',
    }
  })
}

/** `POST /hs/canh-bao/xem {token, id}`: ghi đã xem (lần đầu) — CHỈ cảnh báo của chính em (SBD từ token). */
export async function emXemCanhBao(env: Env, sbd: string, id: string, nowMs: number = Date.now()): Promise<{ ok: true }> {
  const luc = new Date(nowMs).toISOString()
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE canh_bao_thay SET em_xem_luc = COALESCE(em_xem_luc, ?) WHERE id = ? AND sbd = ?').bind(luc, id, sbd),
      env.DB.prepare('UPDATE student_notice SET read_at = COALESCE(read_at, ?) WHERE id = ? AND sbd = ?').bind(luc, id, sbd),
    ])
  } catch { /* chưa có bảng: không có gì để đánh dấu */ }
  return { ok: true }
}

/** `POST /ph/canh-bao/xem {pass, id}`: ghi phụ huynh đã xem — CHỈ cảnh báo của đúng con. */
export async function phXemCanhBao(env: Env, sbd: string, id: string, nowMs: number = Date.now()): Promise<{ ok: true }> {
  try {
    // Một tin phụ huynh có thể GỘP nhiều bài (cùng `ph_nhom`): xem một dòng ⇒ cả nhóm được đánh dấu.
    await env.DB.prepare(
      `UPDATE canh_bao_thay SET ph_xem_luc = COALESCE(ph_xem_luc, ?)
        WHERE sbd = ? AND (id = ? OR (ph_nhom IS NOT NULL AND ph_nhom = (SELECT ph_nhom FROM canh_bao_thay WHERE id = ? AND sbd = ?)))`,
    ).bind(new Date(nowMs).toISOString(), sbd, id, id, sbd).run()
  } catch { /* chưa có bảng */ }
  return { ok: true }
}
