// OMNI 3 — LÀN B3: ĐƯỜNG TRẢ LỜI + GAME (Đảo/Đoàn · lướt · chắc-mà-sai · Trạm hồi phục · vé thử thách · đề thử nửa).
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md (mục 1 bước 4–8, 4.2–4.7, 5) · hợp đồng API: docs/hop-dong-omni-3.md mục A ·
// kiểu: server/src/omni-kieu.ts · chữ hiển thị: src/lib/omni-chu.ts (chủ ngữ "A.I Đỗ Đại Học").
// CÔNG TẮC: chỉ chạy khi phiên Hoá 2.0 (`hoa2 === 1`) VÀ `omniBat(env, sbd)`. Cờ tắt ⇒ nơi gọi (game-v2.ts / srs2-game.ts) KHÔNG dùng kết quả
// của tệp này ⇒ `answer`, `start`, `doan-*`, `hoa2-*` y hệt hôm nay. Mọi đọc OMNI lỗi ⇒ bỏ phần OMNI, KHÔNG làm hỏng lượt trả lời.
// Bảng chỉ-thêm dùng ở đây (`omni_ve`, `omni_de_thu`) tạo lúc chạy bằng ĐÚNG câu lệnh của server/migration-0510-omni-3.sql (CI không chạy migration).
// Không import game-v2.ts / srs2-game.ts (tránh vòng phụ thuộc): hai tệp ấy gọi vào đây.
import type { Env } from './kieu'
import { grade, publicQuestion, type PrivateQuestion, type Question } from '../../src/game/than-thu-v2/core'
import { cauHopKhoi, type Khoi } from '../../src/lib/khoi-cau'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { diemDungSai } from '../../src/lib/tu-luyen'
import { CHU_CHAC_MA_SAI, CHU_DUNG_CHUA_CHAC, CHU_LUOT, NUT_DE_MAI, NUT_LAM_LUON, chuDungNhungCham, chuTram } from '../../src/lib/omni-chu'
import { MUC_DICH_LUOT, THAM_SO_OMNI, type HoSoOmniEm, type KetQuaOmniTraLoi, type Phan, type QCau, type TramHoiPhuc, type TuTin } from './omni-kieu'
import { docBetaCau, hoSoOmniEm, kyVongMsCau, nhatKyHomNay, omniBat, qCuaCau, soLuotHomNay, vknTheoId } from './omni-d1'
import { docDongLop, nhoTheoLuot } from './doc-d1-theo-luot'
import { capNhatHoi, pAnd } from './omni-p-vkn'
import { nhanTocDo } from './omni-toc-do'
import { dangDaVung } from './omni-ke-hoach'
import { phamViCuaEm } from './bai-da-day'
import { thuMucCuaMaDe, thuMucTheoMa } from './kho-thu-muc'
import { tachSongSinh } from './loi-hoc-luat'
import { phuNeuCan } from './hang-chua-loi'
import { apLamLaiKhac, canBanKhac, lamLaiKhacBat } from './cau-anh-em'
import { apXaoTheoRef, laYdMoi, refLamLai, xaoCau, type LamLaiRef } from './lam-lai-so'
import { ghiSuKien, type SuKien } from './su-kien-hoc'
import { HANG_MUC_DO } from './srs2-loi'
import { chuaBatDau, docChienDichCuaEm, docHangEm, docMetaCau, doiThuTuMetGio, layKeHoachHomNay, ngayVnCua, qidGoc, type HoSo2, type MetaCau } from './srs2-d1'
import { docKhoiEm, napDayDuMem, protectedQuestions } from './game-v2-bank'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { docCauDaLamMoiNguon } from './game-v2-cau-moi'
import { laCauTuLuan } from './cam-tu-luan'
import { chayDdlMotLan } from './ddl-mot-lan'
import { damBaoCauNenTuDong } from './omni-cau-nen-sinh'
import { LENH_OMNI_CAN_THAN, canThanTu, ghiBuocSai, phanCanThanChoTraLoi } from './omni-can-than'
import { chonBuocTuKhai, docBuocSaiGanDay } from './omni-buoc-sai-uu-tien'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const laObj = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v)
const TS = THAM_SO_OMNI
const PHUT_MS = 60_000
const GIO_MS = 3_600_000

/** `purpose` của câu trong chuyến VÉ THỬ THÁCH (đo bậc cao hơn — vẫn là một lần làm thật, sổ ghi thật). */
export const MUC_DICH_VE = 'probe'
/** `purpose` của câu trong ĐỀ THỬ NỬA (nguồn `luyen`, mã nguồn `de_thu:<id>`). */
export const MUC_DICH_DE_THU = 'de_thu'
export const LOI_OMNI_TAT = 'Chức năng này chưa mở cho em.'

// ---------------------------------------------------------------- tiện ích thuần
/** Thời lượng máy em đo (ms): số hữu hạn ≥ 0 ⇒ làm tròn, kẹp trên `MS_TOI_DA`; âm / không phải số ⇒ null (coi như không đo — tránh máy lỗi gửi −1 thành "lướt"). */
export function docMsLam(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(TS.MS_TOI_DA, Math.round(n))
}
/** Tự tin: chỉ 'chua_chac' khi máy em gửi đúng chữ ấy; vắng / lạ ⇒ 'chac' (hợp đồng). */
export const docTuTin = (v: unknown): TuTin => (v === 'chua_chac' ? 'chua_chac' : 'chac')
/** Kết quả TỪNG Ý Phần II (4 phần tử): 1 khi ý em chọn (Đ/S) khớp đáp án, 0 khi khác hoặc bỏ trống. */
export function ketQuaTungY(chon: string, dapAn: string): (0 | 1)[] {
  const a = str(chon).trim().toUpperCase(), d = str(dapAn).trim().toUpperCase()
  return [0, 1, 2, 3].map((i) => (a[i] === 'D' || a[i] === 'S') && a[i] === d[i] ? 1 : 0)
}
/** qid GỐC cho OMNI (bỏ hậu tố lần-trong-ngày `#n` rồi hậu tố song sinh `~ss0..3`). */
export const qidGocOmni = (qid: string): string => tachSongSinh(qidGoc(str(qid))).goc
/** Mã tờ GỐC (bỏ hậu tố phần `-TN/-DS/-TLN`). */
export const maDeGoc = (maDe: string): string => str(maDe).trim().replace(/-(?:TN|DS|TLN)$/i, '')
/** Băm FNV-1a 32 bit — thứ tự tất định (không Math.random). */
export function bam32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}
/** TUẦN của vé thử thách = ngày THỨ HAI (giờ VN, `YYYY-MM-DD`) của tuần chứa thời điểm — khoá `omni_ve.tuan`. Vé cấp lại mỗi thứ Hai, không cộng dồn. */
export function tuanVnCua(ms: number): string {
  const d = new Date(ms + 7 * GIO_MS)
  const lui = (d.getUTCDay() + 6) % 7 // thứ Hai = 0 … Chủ nhật = 6
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - lui)).toISOString().slice(0, 10)
}
/** Bậc của mức độ câu: Nhận biết 0 · Thông hiểu 1 · Vận dụng 2 · Vận dụng cao 3 (bảng `HANG_MUC_DO` của srs2); lạ ⇒ null. */
/** Bậc mức độ 0..3 (NB/TH/VD/VDC) hoặc null. (export 05/10: cau-anh-em.ts dùng chung bộ chọn "câu lạ cùng dạng".) */
export const bacMuc = (m: string | null | undefined): number | null => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : null)

// ---------------------------------------------------------------- phiên game (phần OMNI đọc)
// 06/10 (làn A'): ref ải đổi sau Trạm mang thêm khoá làm lại `tc`/`xt`/`nv` (lam-lai-so.ts) khi câu thay là bản khác của một câu LỖI — chỉ ở JSON phiên máy chủ, KHÔNG xuống máy em.
export interface RefOmni extends LamLaiRef { qid: string; maDe: string; version: string; group: string; novel?: boolean; role?: string }
export interface PhienOmni {
  mode?: string; created?: number; hoa2?: number; doan?: number; bia?: number; guardian?: string
  /** Chuyến vé thử thách (`start` có `ve`). */ ve?: number; veDang?: string
  /** Đã mở Trạm hồi phục trong chuyến (tối đa `TRAM_TOI_DA_CHUYEN`). */ tram?: number
  /** Đã đổi ải kế sau trạm (`hoa2-omni-tram-xong`) — gọi lại trả đúng câu đã đổi. */ tramXong?: { viTri: number; qid: string }
  questions: RefOmni[]
}
/** OMNI xét lượt trả lời của phiên này? Phiên Hoá 2.0 của Đảo/Đoàn. KHÔNG Bi-a (máy Bi-a chưa gửi thời lượng/tự tin — giữ nguyên hành vi). */
export const phienXetOmni = (s: Pick<PhienOmni, 'hoa2' | 'bia'>): boolean => s.hoa2 === 1 && !s.bia
/**
 * Trạm hồi phục mở được trong phiên này? CHỈ chuyến Đảo (không Đoàn, không Bi-a, không Linh Tâm, không chuyến vé).
 * Đoàn — kể cả Đoàn một người — KHÔNG mở trạm: lượt trả lời nội bộ của Đoàn không biết chắc số người trong phòng và trận Đoàn chạy theo hiệp đếm giờ.
 */
export const phienMoTram = (s: PhienOmni): boolean => s.hoa2 === 1 && s.mode === 'adventure' && !s.doan && !s.bia && !s.guardian && s.ve !== 1

/** Một lượt đã trả lời trong phiên (`game_v2_attempt`). `luot` = lượt lướt (kết quả mang `luot: true`). */
export interface LuotPhien { qid: string; dung: boolean; hoTro: boolean; luot: boolean; at: number }
async function docLuotPhien(env: Env, sbd: string, phienId: string): Promise<LuotPhien[]> {
  // Nhớ theo lượt (tối ưu 05/10): đọc đoán trước lúc vào lệnh trả lời (`docSomOmniTraLoi`) dùng lại; lệnh ghi lượt của chính request ⇒ đọc lại. Nơi gọi không sửa mảng.
  return nhoTheoLuot(env.DB, `omni_luot_phien|${sbd}|${phienId}`, () => docLuotPhienTho(env, sbd, phienId), ['game_v2_attempt'])
}
async function docLuotPhienTho(env: Env, sbd: string, phienId: string): Promise<LuotPhien[]> {
  const r = await env.DB.prepare('SELECT json FROM game_v2_attempt WHERE session = ? AND sbd = ?').bind(phienId, sbd).all<Row>()
  const ra: LuotPhien[] = []
  for (const x of r.results ?? []) {
    try {
      const o = JSON.parse(str(x.json)) as { attempt?: { qid?: unknown; correct?: unknown; assisted?: unknown; at?: unknown }; luot?: unknown }
      if (!o.attempt?.qid) continue
      ra.push({ qid: str(o.attempt.qid), dung: o.attempt.correct === true, hoTro: o.attempt.assisted === true, luot: o.luot === true, at: Number(o.attempt.at) || 0 })
    } catch { /* dòng hỏng: bỏ */ }
  }
  return ra.sort((a, b) => a.at - b.at)
}
/** Chuỗi câu SAI TỰ LÀM liền cuối (bỏ qua lượt lướt — không tính, không cắt chuỗi; lượt đúng hoặc có hỗ trợ cắt chuỗi). Trả qid theo thứ tự làm. Thuần. */
export function chuoiSaiLienCuoi(ds: readonly Pick<LuotPhien, 'qid' | 'dung' | 'hoTro' | 'luot'>[]): string[] {
  const ra: string[] = []
  for (let i = ds.length - 1; i >= 0; i--) {
    const x = ds[i]!
    if (x.luot) continue
    if (x.dung || x.hoTro) break
    ra.unshift(x.qid)
  }
  return ra
}

// ---------------------------------------------------------------- `answer`: lướt · chắc-mà-sai · P dạng · Trạm hồi phục
/** Các lượt đọc OMNI của một lần trả lời — bắt đầu SỚM (song song phần chấm), mỗi lượt tự bắt lỗi (null). */
export interface DocTruocOmni {
  kyVong: Promise<number | null>
  soLuot: Promise<number | null>
  hoSo: Promise<HoSoOmniEm | null>
  q: Promise<Map<string, QCau> | null>
  /** Lượt đã trả lời của chuyến (chỉ đọc khi chuyến còn mở trạm được). */
  luotPhien: Promise<LuotPhien[] | null>
}
const batLoi = <T>(p: Promise<T>): Promise<T | null> => p.then((x) => x, (e: unknown) => { console.error('[omni-game] đọc OMNI lỗi (bỏ phần OMNI):', e instanceof Error ? e.message : e); return null })
/**
 * ĐỌC ĐOÁN TRƯỚC của lệnh trả lời (tối ưu 05/10; `answer` Đảo, `doan-nop` Đoàn): máy em CHỈ gửi `msLam` khi `hoa2-sanh` báo OMNI áp cho em (hợp đồng OMNI 3)
 * ⇒ bắt đầu NGAY, cùng đợt hồ sơ/phiên, các lượt đọc mà `omniBat` + `docTruocOmni` sẽ cần: lớp em, cờ, hồ sơ OMNI, số lượt lướt hôm nay, β + Q của câu, lượt của
 * chuyến — tất cả qua nhớ theo lượt ⇒ đường cũ dùng lại đúng các lượt ấy (trước: bắt đầu sau khi đọc xong phiên + câu, rồi 4–5 đợt nối tiếp).
 * Quyết định OMNI vẫn do `omniBat` như cũ; đoán sai ⇒ chỉ phí vài lượt đọc, kết quả không đổi. Không có `msLam` ⇒ không làm gì. Không ghi, không ném lỗi.
 */
export function docSomOmniTraLoi(env: Env, sbd: string, action: string, b: Row): void {
  if (b.msLam === undefined || b.msLam === null) return
  const now = Date.now()
  const bo = (f: () => Promise<unknown>): void => { try { f().catch(() => {}) } catch { /* bỏ */ } }
  bo(() => docDongLop(env.DB, sbd))
  bo(() => omniBat(env, sbd))
  bo(() => hoSoOmniEm(env, sbd, now))
  bo(() => soLuotHomNay(env, sbd, now))
  if (action !== 'answer') return
  const goc = qidGocOmni(str(b.qid))
  if (goc) { bo(() => docBetaCau(env, [goc])); bo(() => qCuaCau(env, [goc])) }
  const phien = str(b.session)
  if (phien) bo(() => docLuotPhien(env, sbd, phien))
}
export function docTruocOmni(env: Env, sbd: string, phienId: string, phien: PhienOmni, cau: Pick<Question, 'qid' | 'phan' | 'mucDo'>, nowMs: number): DocTruocOmni {
  const goc = qidGocOmni(cau.qid)
  const p = <T>(f: () => Promise<T>): Promise<T | null> => { try { return batLoi(f()) } catch (e) { return batLoi(Promise.reject(e)) } }
  return {
    kyVong: p(() => kyVongMsCau(env, sbd, { qid: goc, phan: cau.phan, mucDo: cau.mucDo }, nowMs)),
    soLuot: p(() => soLuotHomNay(env, sbd, nowMs)),
    hoSo: p(() => hoSoOmniEm(env, sbd, nowMs)),
    q: p(() => qCuaCau(env, [goc])),
    luotPhien: phienMoTram(phien) && !phien.tram ? p(() => docLuotPhien(env, sbd, phienId)) : Promise.resolve(null),
  }
}

/** Phần GHI SỔ của lượt (game-v2.ts `ghiSoHoc`): lướt ⇒ `ket_qua NULL` + purpose 'luot'; chuyến vé ⇒ purpose 'probe'; raw thêm `{ms, tt, td}`; Phần II ⇒ kết quả từng ý. */
export interface SoOmni { luot: boolean; purpose?: string; raw: Record<string, unknown>; subitem?: (0 | 1)[] }
export interface OmniTraLoi {
  omni: KetQuaOmniTraLoi
  /** Lướt: bỏ `advance` (không đổi mastery của hồ sơ game), kết quả mang `luot: true` (máy em không trừ Máu). */
  luot: boolean
  /** Chuyến vé: kết quả mang `ve: true` (máy em không trừ Máu); sổ vẫn ghi thật. */
  ve: boolean
  so: SoOmni
}
export interface DauVaoOmniTraLoi {
  sbd: string
  phien: PhienOmni
  /** qid của câu trong phiên (có thể là qid song sinh). */
  qidPhien: string
  cau: Pick<PrivateQuestion, 'qid' | 'phan' | 'correct' | 'dang' | 'tenDang' | 'mucDo'>
  /** Đáp án em gửi (đã kiểm khuôn). */
  chon: string
  dung: boolean
  hoTro: boolean
  /** Thân lệnh: `msLam?`, `tuTin?`. */
  b: Row
  nowMs: number
  doc: DocTruocOmni
}

/**
 * Xét một lượt trả lời khi OMNI bật (đặc tả mục 1 bước 4–6; hợp đồng `answer`):
 *  · nhãn tốc độ = nhanTocDo(msLam, kyVongMsCau) · LƯỚT = sai ∧ nhãn 'luot' ∧ số lượt lướt hôm nay < LUOT_TOI_DA_NGAY (từ lượt 4 ⇒ sai thường);
 *  · chắc-mà-sai = sai ∧ không lướt ∧ tuTin 'chac' ∧ TRƯỚC lượt này mọi vi kỹ năng của câu có P ≥ P_VUNG_DO_SO_Y;
 *  · `dang` = P dạng (cổng AND trên vi kỹ năng cả câu) trước / sau lượt (capNhatHoi trên BẢN SAO hồ sơ — không ghi gì), cỡ mẫu sau lượt;
 *  · TRẠM HỒI PHỤC: sai tự làm (không lướt, không hỗ trợ) trong chuyến Đảo ⇒ chuỗi sai liền cuối ≥ TRAM_SAI_LIEN và chuyến chưa có trạm.
 * Đọc thiết yếu (kỳ vọng thời gian, số lượt lướt) lỗi ⇒ null: lượt chấm như cờ tắt. Đọc phụ lỗi ⇒ bỏ riêng phần ấy (không `dang`, không trạm).
 * MỘT quan sát/câu/ngày của phát lại không xét ở đây (`dang` là số hiển thị; hồ sơ thật dựng lại từ sổ ở omni-d1).
 */
export async function xetOmniTraLoi(env: Env, dv: DauVaoOmniTraLoi): Promise<OmniTraLoi | null> {
  try {
    const [kyVong, soLuot] = await Promise.all([dv.doc.kyVong, dv.doc.soLuot])
    if (kyVong == null || !Number.isFinite(kyVong) || kyVong <= 0 || soLuot == null || !Number.isFinite(soLuot)) return null
    const msLam = docMsLam(dv.b.msLam), tuTin = docTuTin(dv.b.tuTin)
    const nhan = nhanTocDo(msLam, kyVong, dv.dung)
    const luot = !dv.dung && nhan === 'luot' && soLuot < TS.LUOT_TOI_DA_NGAY
    const ve = dv.phien.ve === 1
    const [hs, qMap] = await Promise.all([dv.doc.hoSo, dv.doc.q])
    const qc = qMap?.get(qidGocOmni(dv.cau.qid)) ?? null
    const pCua = (k: string) => hs?.vkn[k]?.p ?? TS.P0
    const knCau = qc ? [...new Set(qc.vkn)] : []
    const knMoi = qc ? [...new Set([...qc.vkn, ...(qc.vknY ?? []).flat()])] : []
    const chacMaSai = !dv.dung && !luot && tuTin === 'chac' && !!hs && knMoi.length > 0 && knMoi.every((k) => pCua(k) >= TS.P_VUNG_DO_SO_Y)
    const dang = hs && qc && dv.cau.dang && knCau.length ? dangSauLuot(hs, qc, knCau, dv, luot, tuTin) : null
    let tram: TramHoiPhuc | null = null
    if (!dv.dung && !luot && !dv.hoTro && phienMoTram(dv.phien) && !dv.phien.tram) {
      const truoc = await dv.doc.luotPhien
      if (truoc) {
        const chuoi = chuoiSaiLienCuoi([...truoc.filter((x) => x.qid !== dv.qidPhien), { qid: dv.qidPhien, dung: false, hoTro: false, luot: false }])
        if (chuoi.length >= TS.TRAM_SAI_LIEN) tram = await taoTram(env, chuoi.slice(-TS.TRAM_SAI_LIEN), hs, dv.sbd, dv.nowMs).catch((e: unknown) => { console.error('[omni-game] chưa dựng được Trạm hồi phục:', e instanceof Error ? e.message : e); return null })
      }
    }
    const loiNhan = luot ? CHU_LUOT
      : dv.dung && nhan === 'cham' && msLam != null ? chuDungNhungCham(msLam, kyVong)
        : dv.dung && tuTin === 'chua_chac' ? CHU_DUNG_CHUA_CHAC
          : chacMaSai ? CHU_CHAC_MA_SAI : null
    // CẨN THẬN (omni-can-than.ts): hồ sơ TRƯỚC lượt này có Sơ ý > ngưỡng ⇒ `canThan` (+ thẻ "Sai vì bước nào?" khi chắc-mà-sai); không ⇒ không thêm trường nào.
    const canThan = await phanCanThanChoTraLoi({ canThan: canThanTu(true, hs), chacMaSai, vkn: knMoi, tenVkn: (ids) => vknTheoId(env, ids) })
    const omni: KetQuaOmniTraLoi = { nhanTocDo: nhan, msLam, msKyVong: Math.round(kyVong), luot, chacMaSai, ...(tram ? { tram } : {}), ...(dang ? { dang } : {}), loiNhan, ...canThan }
    const so: SoOmni = {
      luot,
      ...(luot ? { purpose: MUC_DICH_LUOT } : ve ? { purpose: MUC_DICH_VE } : {}),
      raw: { ms: msLam, tt: tuTin, td: nhan },
      ...(dv.cau.phan === 'II' && !laYdMoi(dv.cau.qid) ? { subitem: ketQuaTungY(dv.chon, dv.cau.correct) } : {}), // bộ ý Đ–S MỚI (`~yd`, 06/10): ý khác ý gốc ⇒ không ghi từng ý theo ma trận Q của câu gốc
    }
    return { omni, luot, ve, so }
  } catch (e) {
    console.error('[omni-game] xét lượt OMNI lỗi (bỏ phần OMNI):', e instanceof Error ? e.message : e)
    return null
  }
}

/** P dạng trước/sau lượt (cổng AND trên vi kỹ năng cả câu) — capNhatHoi trên BẢN SAO; Phần II có Q từng ý ⇒ mỗi ý một quan sát (G.Y). */
function dangSauLuot(hs: HoSoOmniEm, qc: QCau, kn: readonly string[], dv: DauVaoOmniTraLoi, luot: boolean, tuTin: TuTin): NonNullable<KetQuaOmniTraLoi['dang']> {
  const pTruoc = pAnd(hs, kn)
  const quanSat = !luot && !dv.hoTro
  let P: Record<string, number> = Object.fromEntries(Object.entries(hs.vkn).map(([k, v]) => [k, v.p]))
  if (quanSat) {
    // Đúng mà em chọn "Chưa chắc" ⇒ nghi đoán: xác suất đoán mò nhân 2 (kẹp ≤ 0,5) cho quan sát ấy (omni-p-vkn `phatLaiEm`).
    const gCho = (g: number, dung: boolean) => (dung && tuTin === 'chua_chac' ? Math.min(0.5, 2 * g) : g)
    if (dv.cau.phan === 'II' && qc.vknY?.length === 4 && !laYdMoi(dv.cau.qid)) {
      const y = ketQuaTungY(dv.chon, dv.cau.correct)
      qc.vknY.forEach((knY, i) => { if (knY.length) P = capNhatHoi(P, knY, y[i] === 1, gCho(TS.G.Y, y[i] === 1), hs.sEm, TS.T) })
    } else {
      const g = dv.cau.phan === 'I' ? TS.G.I : dv.cau.phan === 'III' ? TS.G.III : TS.G.II_CA_CAU
      P = capNhatHoi(P, kn, dv.dung, gCho(g, dv.dung), hs.sEm, TS.T)
    }
  }
  const pSau = kn.reduce((t, k) => t * (P[k] ?? TS.P0), 1)
  const homNay = ngayVnCua(dv.nowMs)
  let nTuLam = Infinity, nNgay = Infinity
  for (const k of kn) {
    const v = hs.vkn[k]
    nTuLam = Math.min(nTuLam, (v?.nTuLam ?? 0) + (quanSat ? 1 : 0))
    nNgay = Math.min(nNgay, (v?.nNgay ?? 0) + (quanSat && v?.ngayCuoi !== homNay ? 1 : 0))
  }
  return { ma: dv.cau.dang!, ten: dv.cau.tenDang || dv.cau.dang!, pTruoc, pSau, nTuLam: Number.isFinite(nTuLam) ? nTuLam : 0, nNgay: Number.isFinite(nNgay) ? nNgay : 0 }
}

/** Tiền tố mã vi kỹ năng toàn hệ (điều phối 05/10): mỗi câu cần `dang:<mã dạng>` (luôn có) ∪ `nen:<nhãn nền>` (danh mục TEN_NEN của thang-tu-go.ts). */
const TIEN_TO_NEN = 'nen:'
const TIEN_TO_DANG = 'dang:'
/**
 * CHỖ VƯỚNG của 3 câu sai liền (thuần): GIAO vi kỹ năng (cả câu ∪ từng ý) của các câu;
 *  (1) giao có `nen:*` ⇒ `nen:*` P thấp nhất trong giao;
 *  (2) giao không có `nen:*` ⇒ nhãn `nen:*` xuất hiện NHIỀU NHẤT trong các câu (hoà ⇒ P thấp nhất);
 *  (3) vẫn không có ⇒ `dang:*` (trong giao trước; không thì xuất hiện nhiều nhất, hoà ⇒ P thấp nhất);
 *  (4) mã kiểu khác (danh mục cũ) ⇒ vi kỹ năng P thấp nhất trong giao. Hoà P ⇒ theo mã. Không có gì ⇒ null.
 */
export function chonViKyNangTram(vknTungCau: readonly (readonly string[])[], pCua: (k: string) => number): string | null {
  const bo = vknTungCau.map((v) => [...new Set(v)])
  const giao = bo.length ? bo.reduce((a, v) => a.filter((k) => v.includes(k))) : []
  const theoP = (a: string, b: string) => pCua(a) - pCua(b) || (a < b ? -1 : a > b ? 1 : 0)
  const nhieuNhat = (tienTo: string): string | null => {
    const dem = new Map<string, number>()
    for (const v of bo) for (const k of v) if (k.startsWith(tienTo)) dem.set(k, (dem.get(k) ?? 0) + 1)
    return [...dem.keys()].sort((a, b) => dem.get(b)! - dem.get(a)! || theoP(a, b))[0] ?? null
  }
  return [...giao].filter((k) => k.startsWith(TIEN_TO_NEN)).sort(theoP)[0]
    ?? nhieuNhat(TIEN_TO_NEN)
    ?? [...giao].filter((k) => k.startsWith(TIEN_TO_DANG)).sort(theoP)[0]
    ?? nhieuNhat(TIEN_TO_DANG)
    ?? [...giao].sort(theoP)[0]
    ?? null
}
/**
 * TRẠM HỒI PHỤC từ 3 câu sai liền: chỗ vướng = `chonViKyNangTram` trên ma trận Q của 3 câu và P (hồ sơ TRƯỚC lượt này).
 * 06/10 (lệnh thầy "Làm chuẩn đoán bước sai"): em ĐÃ TỰ KHAI bước sai (bảng `omni_buoc_sai` — thẻ Cẩn thận (c) hoặc câu chẩn đoán em làm sai) ⇒ bước
 * khai ƯU TIÊN nếu nó nằm trong vi kỹ năng của ba câu (luật chọn + cửa sổ 14 ngày: omni-buoc-sai-uu-tien.ts `chonBuocTuKhai`); không có khai khớp ⇒ y hệt cũ.
 * Bước ấy quyết tên lỗi VÀ nhãn câu nền (máy em mở `/hs/luyen-nen {nhan}` ⇒ 3–5 câu nền ĐÚNG bước em khai). Đọc bảng lỗi ⇒ [] ⇒ luật cũ.
 * `nhan` = phần sau `nen:` (vi kỹ năng `dang:*` ⇒ null; mã kiểu khác ⇒ nhãn nền của danh mục). Tên lỗi = `vknTheoId(...).tenLoi ?? ten`.
 * `coCauNen` = ngân hàng `cau_nen` có câu của nhãn (bảng chưa có ⇒ false). Máy em mở NGUYÊN luồng `/hs/luyen-nen {nhan}` sẵn có.
 */
async function taoTram(env: Env, qids: readonly string[], hs: HoSoOmniEm | null, sbd: string, nowMs: number): Promise<TramHoiPhuc> {
  const goc = qids.map(qidGocOmni)
  const [qm, tuKhai] = await Promise.all([qCuaCau(env, goc), docBuocSaiGanDay(env, sbd, nowMs)])
  const pCua = (k: string) => hs?.vkn[k]?.p ?? TS.P0
  const vknTungCau = goc.map((q) => { const c = qm.get(q); return c ? [...c.vkn, ...(c.vknY ?? []).flat()] : [] })
  const vkn = chonBuocTuKhai(tuKhai, vknTungCau.flat(), pCua) ?? chonViKyNangTram(vknTungCau, pCua)
  const tt = vkn ? (await vknTheoId(env, [vkn])).get(vkn) : undefined
  const nhan = !vkn ? null : vkn.startsWith(TIEN_TO_NEN) ? vkn.slice(TIEN_TO_NEN.length) || null : vkn.startsWith(TIEN_TO_DANG) ? null : str(tt?.nhanNen).trim() || null
  // OMNI 3 (điều phối 05/10, thầy: "Bạn hãy làm mọi thứ tôi chỉ chữa bài hs cần chữa"): nhãn tính toán thiếu câu nền ⇒ A.I Đỗ Đại Học tự sinh
  // (omni-cau-nen-sinh.ts, đáp án tính bằng mã + kiểm chéo) TRƯỚC khi xét có câu nền. Lỗi ⇒ bỏ qua, trạm vẫn mở (đổi ải dễ hơn).
  if (nhan) await damBaoCauNenTuDong(env, nhan).catch(() => 0)
  const coCauNen = nhan ? await coCauNenCho(env, nhan) : false
  const ten = chuChoEm(tt?.ten), tenLoi = chuChoEm(tt?.tenLoi) ?? ten
  return { vkn, ten, tenLoi, nhan, coCauNen, chu: chuTram(tenLoi, coCauNen) }
}
/**
 * Tên đưa lên màn HỌC SINH (luật chữ khi gộp 05/10): không mã nội bộ (`nen:…`, `dang:…`, `cau:…`, `cd:…`, `<mã>#<số>`) và không chữ "vi kỹ năng"
 * (dùng "bước …" hoặc tên dạng). Không đạt ⇒ null (chữ trạm rơi về câu chung "3 câu vừa rồi khó với em").
 */
function chuChoEm(v: unknown): string | null {
  const s = str(v).trim()
  if (!s || /^(nen|dang|cau|cd):/i.test(s) || /#\d+$/.test(s) || /vi\s*kỹ\s*năng/i.test(s.normalize('NFC'))) return null
  return s
}
async function coCauNenCho(env: Env, nhan: string): Promise<boolean> {
  const r = await env.DB.prepare('SELECT 1 AS co FROM cau_nen WHERE nhan = ? LIMIT 1').bind(nhan).first<Row>().catch(() => null)
  return !!r
}

/** Gọi lại `answer` cho câu đã chấm (mạng chập chờn): dựng lại phần ghi sổ từ kết quả đã lưu ⇒ việc phụ chạy lại ghi ĐÚNG dòng như lần đầu. Kết quả cũ không có `omni` ⇒ undefined (y hệt cờ tắt). */
export function soOmniTuKetQuaCu(cu: Row, b: Row, cau: Pick<PrivateQuestion, 'phan' | 'correct'> & { qid?: string }, phien: Pick<PhienOmni, 've'>): SoOmni | undefined {
  const o = cu.omni as Partial<KetQuaOmniTraLoi> | undefined
  if (!laObj(o)) return undefined
  const luot = o.luot === true
  const dapAn = typeof cu.answer === 'string' ? cu.answer : cau.correct
  return {
    luot,
    ...(luot ? { purpose: MUC_DICH_LUOT } : phien.ve === 1 ? { purpose: MUC_DICH_VE } : {}),
    raw: { ms: o.msLam ?? null, tt: docTuTin(b.tuTin), td: o.nhanTocDo ?? null },
    ...(cau.phan === 'II' && !laYdMoi(cau.qid) && typeof cu.traLoi === 'string' ? { subitem: ketQuaTungY(cu.traLoi, dapAn) } : {}),
  }
}
/** Trường THÊM vào kết quả `answer` (chỉ khi OMNI bật): `omni`, và `luot: true` / `ve: true` khi có. */
export function themVaoKetQua(o: OmniTraLoi): Record<string, unknown> {
  return { omni: o.omni, ...(o.luot ? { luot: true } : {}), ...(o.ve ? { ve: true } : {}) }
}

// ---------------------------------------------------------------- bảng chỉ-thêm + phạm vi chọn câu
const DDL_OMNI_GAME = [
  'CREATE TABLE IF NOT EXISTS omni_ve (sbd TEXT NOT NULL, tuan TEXT NOT NULL, da_dung INTEGER NOT NULL DEFAULT 0, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, tuan))',
  'CREATE TABLE IF NOT EXISTS omni_de_thu (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid_json TEXT NOT NULL, tao_luc TEXT NOT NULL, het_luc TEXT NOT NULL, nop_luc TEXT, diem REAL)',
  'CREATE INDEX IF NOT EXISTS omni_de_thu_em ON omni_de_thu(sbd, tao_luc)',
] as const
export const damBaoBangOmniGame = (env: Env): Promise<void> => chayDdlMotLan(env, 'omni_game_b3', DDL_OMNI_GAME)

/** Phạm vi chọn câu: tờ của BÀI ĐÃ DẠY (bai-da-day `phamViCuaEm`: bài đã tick + bài đứng trước); lớp chưa tick bài nào ⇒ tờ của các chiến dịch thầy đã giao em. */
// Bộ chọn "câu lạ cùng dạng" (phạm vi · bối cảnh · hợp lệ chung · meta theo dạng · xếp ứng viên · nạp theo thứ tự) EXPORT từ 05/10 để
// cau-anh-em.ts (làm lại câu sai bằng CÂU ANH EM) dùng lại đúng một bộ — không chép lại.
export interface PhamViChon { coMa(maDe: string): boolean; maTo: string[] }
export async function phamViChon(env: Env, sbd: string): Promise<PhamViChon> {
  const pv = await phamViCuaEm(env, sbd).catch(() => null)
  const goc = pv && pv.maDe.size
    ? new Set([...pv.maDe].map(maDeGoc))
    : new Set((await docChienDichCuaEm(env, sbd).catch(() => [])).flatMap((c) => c.maDe.map(maDeGoc)))
  return { coMa: (m) => goc.has(maDeGoc(m)), maTo: [...goc].flatMap((g) => [g, `${g}-TN`, `${g}-DS`, `${g}-TLN`]) }
}
/** Bối cảnh lọc chung: câu bảo vệ ca thi (theo qid HOẶC nhóm nội dung), bài tập về nhà chưa nộp, khối em, câu đã làm (qid gốc → lần gần nhất). */
export interface BoiCanh { chan: Set<string>; khoiEm: Khoi | null; daLam: Map<string, number>; dauNgayMs: number }
export async function boiCanh(env: Env, sbd: string, nowMs: number): Promise<BoiCanh> {
  const [ca, btvn, khoiEm, daLamTho] = await Promise.all([
    protectedQuestions(env), // lỗi ⇒ ném (thà không phát câu còn hơn lộ câu ca thi)
    docCauBtvnChuaNop(env, sbd).catch(() => new Set<string>()),
    docKhoiEm(env, sbd).catch(() => null),
    docCauDaLamMoiNguon(env, sbd),
  ])
  const daLam = new Map<string, number>()
  for (const [q, t] of daLamTho) { const g = qidGocOmni(q); daLam.set(g, Math.max(daLam.get(g) ?? 0, t)) }
  return { chan: new Set([...ca, ...btvn]), khoiEm, daLam, dauNgayMs: Date.parse(`${ngayVnCua(nowMs)}T00:00:00+07:00`) }
}
export const hopLeChung = (m: MetaCau, bc: BoiCanh): boolean => !m.tuLuan && !bc.chan.has(m.qid) && !bc.chan.has(m.group) && cauHopKhoi(bc.khoiEm, m)
export const lamHomNay = (qid: string, bc: BoiCanh): boolean => (bc.daLam.get(qid) ?? -1) >= bc.dauNgayMs
const laThat = (v: unknown): boolean => v === 1 || v === true || v === '1' || v === 'true'

/** Dòng chỉ mục → siêu dữ liệu câu ĐƯỢC PHÉP: trong phạm vi, đã duyệt, thư mục DẠY HỌC (`de_kho_thu_muc`, thiếu ⇒ luật mã `DH-`), không tự luận. */
async function metaTuDong(env: Env, rows: readonly Row[], pv: PhamViChon, khiCoMaTo?: (maTo: string[]) => void): Promise<MetaCau[]> {
  const hop = rows.filter((x) => pv.coMa(str(x.ma_de)) && laThat(x.rv))
  if (!hop.length) return []
  const maTo = [...new Set(hop.map((x) => str(x.ma_de)))]
  khiCoMaTo?.(maTo) // tối ưu 05/10: nơi gọi bắt đầu phần đọc theo tờ của mình CÙNG đợt hai lượt đọc dưới (vd. `lop` của tờ — cau-anh-em.ts)
  const [meta, thuMuc] = await Promise.all([docMetaCau(env, [...new Set(hop.map((x) => str(x.qid)))], maTo), thuMucCuaMaDe(env, maTo)])
  return [...meta.values()].filter((m) => pv.coMa(m.maDe) && (thuMuc.get(m.maDe) ?? thuMucTheoMa(m.maDe)) === 'DAY_HOC' && !m.tuLuan)
}
const SQL_CHI_MUC = "SELECT qid, ma_de, json_extract(json,'$.reviewed') AS rv FROM game_v2_question"
/** Lượt ĐỌC đầu của `metaTheoDang` (chỉ mục câu theo dạng) — không phụ thuộc phạm vi ⇒ nơi gọi bắt đầu SỚM được (tối ưu 05/10, thang làm lại). */
export async function docChiMucTheoDang(env: Env, maDang: string): Promise<Row[]> {
  const r = await env.DB.prepare(`${SQL_CHI_MUC} WHERE dang = ?`).bind(maDang).all<Row>()
  return r.results ?? []
}
/** `som` (tối ưu 05/10, chỉ-thêm): `chiMuc` = `docChiMucTheoDang` đã bắt đầu sớm; `khiCoMaTo` = gọi khi biết các tờ ứng viên. Vắng ⇒ y hệt cũ. */
export async function metaTheoDang(env: Env, maDang: string, pv: PhamViChon, som?: { chiMuc?: Promise<Row[]>; khiCoMaTo?: (maTo: string[]) => void }): Promise<MetaCau[]> {
  const rows = som?.chiMuc ? await som.chiMuc : ((await env.DB.prepare(`${SQL_CHI_MUC} WHERE dang = ?`).bind(maDang).all<Row>()).results ?? [])
  return metaTuDong(env, rows, pv, som?.khiCoMaTo)
}
async function metaTheoPhamVi(env: Env, pv: PhamViChon): Promise<MetaCau[]> {
  const rows: Row[] = []
  for (let i = 0; i < pv.maTo.length; i += 400) {
    const r = await env.DB.prepare(`${SQL_CHI_MUC} WHERE ma_de IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(pv.maTo.slice(i, i + 400))).all<Row>()
    rows.push(...(r.results ?? []))
  }
  return metaTuDong(env, rows, pv)
}
/** Xếp ứng viên tất định: khoảng cách bậc → hạng phụ → CHƯA GẶP trước → gặp lâu nhất trước → băm; mỗi nhóm nội dung một câu. */
export function xepUngVien(ds: readonly MetaCau[], bc: BoiCanh, khoang: (m: MetaCau) => number, muoi: string, phu: (m: MetaCau) => number = () => 0): MetaCau[] {
  const khoa = (m: MetaCau) => [khoang(m), phu(m), bc.daLam.has(m.qid) ? 1 : 0, bc.daLam.get(m.qid) ?? 0, bam32(`${muoi}|${m.qid}`)]
  const ra = [...ds].sort((a, b) => { const x = khoa(a), y = khoa(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i]! - y[i]!; return 0 })
  const nhom = new Set<string>()
  return ra.filter((m) => { if (nhom.has(m.group)) return false; nhom.add(m.group); return true })
}
/** Nạp bản đầy đủ theo thứ tự, bỏ câu vắng (đã sửa/rút) và câu tự luận; tối đa `toiDa`. */
export async function napTheoThuTu(env: Env, ds: readonly MetaCau[], toiDa: number, boNhom?: Set<string>): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  const ra: { q: PrivateQuestion; m: MetaCau }[] = []
  let i = 0
  while (ra.length < toiDa && i < ds.length) {
    const lo: MetaCau[] = []
    while (lo.length < toiDa - ra.length + 2 && i < ds.length) { const m = ds[i++]!; if (!boNhom?.has(m.group)) lo.push(m) }
    if (!lo.length) break
    const day = await napDayDuMem(env, lo.map((m) => ({ maDe: m.maDe, qid: m.qid, version: m.version })))
    for (const m of lo) {
      if (ra.length >= toiDa) break
      const q = day.get(`${m.maDe}|${m.qid}|${m.version}`)
      if (!q || laCauTuLuan(q) || boNhom?.has(m.group)) continue
      boNhom?.add(m.group)
      ra.push({ q, m })
    }
  }
  return ra
}

// ---------------------------------------------------------------- `start` + `ve`: vé thử thách
const hetVe = (): Record<string, unknown> => ({ ok: false, lyDo: 'het_ve', error: `Em đã dùng hết ${TS.VE_MOI_TUAN} vé thử thách tuần này. Thứ Hai có vé mới.`, ve: { con: 0, tong: TS.VE_MOI_TUAN } })
async function docVeDaDung(env: Env, sbd: string, tuan: string): Promise<number> {
  const r = await env.DB.prepare('SELECT da_dung FROM omni_ve WHERE sbd = ? AND tuan = ?').bind(sbd, tuan).first<Row>()
  return Math.max(0, Number(r?.da_dung) || 0)
}
/**
 * BẬC HIỆN TẠI của em ở dạng: mức cao nhất em đã THÀNH THẠO (srs2) ở dạng ấy; chưa thành thạo mức nào ⇒ theo hạng của em ở dạng
 * (L1/L2 ⇒ chưa vững mức nào (−1) · L3 ⇒ Nhận biết (0) · L4 ⇒ Thông hiểu (1)). Vé lấy câu ĐÚNG MỘT BẬC trên (thiếu ⇒ bậc gần nhất phía trên).
 */
type HangCuaEm = Awaited<ReturnType<typeof docHangEm>>
async function bacHienTai(maDang: string, hs: HoSo2, hangEm: () => Promise<HangCuaEm>): Promise<number> {
  let bac = -1
  for (const [qid, t] of hs.tt) {
    if (!t.thanhThao) continue
    const m = hs.meta.get(qid)
    const b = m?.dang === maDang ? bacMuc(m.mucDo) : null
    if (b != null && b > bac) bac = b
  }
  if (bac >= 0) return bac
  const hang = await hangEm()
  const h = hang?.hangTheoDang[maDang] ?? hang?.hangChung ?? 'L2'
  return h === 'L4' ? 1 : h === 'L3' ? 0 : -1
}
/**
 * `ve: 'auto'` (thầy dặn giữ nguyên giao diện — không màn chọn dạng): dạng CHƯA VỮNG có P thấp nhất trong phạm vi BÀI ĐANG LUYỆN HẠN GẦN NHẤT
 * (chiến dịch đang chạy, đã bắt đầu, hạn ≥ hôm nay, hạn sớm nhất). P dạng = P nhỏ nhất trong các vi kỹ năng (ma trận Q) của câu thuộc dạng.
 * Hoà ⇒ băm tất định `sbd|ngày|dạng`. Trả danh sách đã xếp (dạng đầu không có câu thì thử dạng kế).
 */
async function dangTuDongChoVe(env: Env, sbd: string, nowMs: number): Promise<{ ma: string; ten: string }[]> {
  const homNay = ngayVnCua(nowMs)
  const cd = (await docChienDichCuaEm(env, sbd).catch(() => []))
    .filter((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && !chuaBatDau(c, homNay))
    .sort((a, b) => (a.hanNop < b.hanNop ? -1 : a.hanNop > b.hanNop ? 1 : a.taoLuc < b.taoLuc ? -1 : a.taoLuc > b.taoLuc ? 1 : 0))[0]
  if (!cd) return []
  const meta = await docMetaCau(env, cd.qids, cd.maDe)
  const theo = new Map<string, { ten: string; qids: string[] }>()
  for (const m of meta.values()) {
    if (!m.dang || m.tuLuan) continue
    const d = theo.get(m.dang) ?? { ten: m.tenDang || m.dang, qids: [] }
    d.qids.push(m.qid)
    theo.set(m.dang, d)
  }
  if (!theo.size) return []
  const [hs, qm] = await Promise.all([hoSoOmniEm(env, sbd, nowMs), qCuaCau(env, [...theo.values()].flatMap((d) => d.qids))])
  const vung = new Set(dangDaVung(hs, [...qm.values()]))
  const pCua = (k: string) => hs.vkn[k]?.p ?? TS.P0
  return [...theo.entries()]
    .filter(([ma]) => !vung.has(ma))
    .map(([ma, d]) => {
      const kn = [...new Set(d.qids.flatMap((q) => qm.get(q)?.vkn ?? []))]
      return { ma, ten: d.ten, p: kn.length ? Math.min(...kn.map(pCua)) : TS.P0 }
    })
    .sort((a, b) => a.p - b.p || bam32(`${sbd}|${homNay}|${a.ma}`) - bam32(`${sbd}|${homNay}|${b.ma}`))
    .map(({ ma, ten }) => ({ ma, ten }))
}

/**
 * CHUYẾN VÉ THỬ THÁCH (`start` Đảo, Hoá 2.0, OMNI bật, thân có `ve: <mã dạng> | 'auto'`): tuần còn vé (`omni_ve`, VE_MOI_TUAN/tuần, tuần tính từ thứ Hai VN) ⇒
 * VE_SO_CAU câu cao hơn bậc hiện tại của em ở dạng ấy MỘT bậc (câu DẠY HỌC trong phạm vi đã dạy, ưu tiên câu chưa gặp; không câu ca thi / bài tập
 * chưa nộp / tự luận / câu trong kế hoạch hôm nay / câu đã làm hôm nay), vai 'thu_thach', phiên `ve: 1` (sổ purpose 'probe').
 * Trừ vé và mở phiên trong MỘT lô (`changes() = 1`): hai máy bấm cùng lúc không tiêu quá số vé. Hết vé ⇒ `{ ok:false, lyDo:'het_ve' }`.
 */
export async function startVe(env: Env, sbd: string, ve: string, nowMs: number): Promise<Record<string, unknown>> {
  await damBaoBangOmniGame(env)
  const tuan = tuanVnCua(nowMs), homNay = ngayVnCua(nowMs)
  const daDung = await docVeDaDung(env, sbd, tuan)
  if (daDung >= TS.VE_MOI_TUAN) return hetVe()
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  // 06/10 (làn A'): vé đo bậc CAO HƠN bằng câu em chưa vững — câu LỖI đang trong cửa sổ lỗi (chờ kiểm / đã đóng, chưa tới lịch nên không nằm trong kế hoạch hôm nay) không phải
  // câu để đo và không được ra NGUYÊN VĂN ⇒ bỏ khỏi ứng viên (câu lỗi quay lại qua thang làm lại ở Đảo / Đoàn / Bi-a / Trạm). Khoá `lam_lai_khac` tắt ⇒ y hôm nay.
  const boCauLoi = await lamLaiKhacBat(env).catch(() => false)
  const dsDang = ve === 'auto' ? await dangTuDongChoVe(env, sbd, nowMs) : [{ ma: ve, ten: '' }]
  if (!dsDang.length) return { ok: false, lyDo: 'khong_co_dang', error: 'Chưa có dạng nào cần thử thách thêm trong bài đang luyện.' }
  const [pv, bc] = await Promise.all([phamViChon(env, sbd), boiCanh(env, sbd, nowMs)])
  const trongKeHoach = new Set([...kh.dao, ...kh.doan].map(qidGocOmni))
  let hangSom: Promise<HangCuaEm> | null = null // hạng em đọc MỘT lần dù thử nhiều dạng ('auto')
  const hangEm = () => (hangSom ??= docHangEm(env, sbd, hs).catch(() => null))
  for (const d of dsDang) {
    const dich = (await bacHienTai(d.ma, hs, hangEm)) + 1
    if (dich > 3) continue // đã vững mức cao nhất của dạng
    const ung = (await metaTheoDang(env, d.ma, pv)).filter((m) => {
      const b = bacMuc(m.mucDo)
      return b != null && b >= dich && hopLeChung(m, bc) && !trongKeHoach.has(m.qid) && !lamHomNay(m.qid, bc) && !(boCauLoi && canBanKhac(hs, m.qid))
    })
    const day = await chanKhacKhoiEm(env, 'omni_ve', { sbd, khoiEm: bc.khoiEm }, await napTheoThuTu(env, xepUngVien(ung, bc, (m) => bacMuc(m.mucDo)! - dich, `${sbd}|${homNay}|ve`), TS.VE_SO_CAU, new Set()), { cauCua: (x) => x.q }) // LUẬT THẦY 05/10: cổng cuối
    if (!day.length) continue
    const id = crypto.randomUUID(), luc = new Date(nowMs).toISOString()
    const refs: RefOmni[] = day.map(({ q, m }) => ({ qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: !bc.daLam.has(m.qid), role: 'thu_thach' }))
    const [tru, mo] = await env.DB.batch([
      env.DB.prepare(`INSERT INTO omni_ve (sbd, tuan, da_dung, cap_nhat_luc) VALUES (?, ?, 1, ?)
          ON CONFLICT(sbd, tuan) DO UPDATE SET da_dung = omni_ve.da_dung + 1, cap_nhat_luc = excluded.cap_nhat_luc WHERE omni_ve.da_dung < ?`).bind(sbd, tuan, luc, TS.VE_MOI_TUAN),
      env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) SELECT ?,?,?,? WHERE changes() = 1')
        .bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, ve: 1, veDang: d.ma, questions: refs }), luc),
    ])
    if (!tru?.meta.changes) return hetVe()
    if (!mo?.meta.changes) throw new Error('Chưa mở được chuyến thử thách. Em thử lại nhé.')
    const conVe = Math.max(0, TS.VE_MOI_TUAN - Math.min(TS.VE_MOI_TUAN, daDung + 1))
    return {
      ok: true, id,
      questions: day.map(({ q }) => ({ ...publicQuestion(q), vai: 'thu_thach' })),
      ve: { con: conVe, tong: TS.VE_MOI_TUAN },
      veDang: { ma: d.ma, ten: d.ten || day[0]!.q.tenDang || day[0]!.m.tenDang || d.ma },
      theLuc: { con: kh.conDao.length + kh.conDoan.length, tong: kh.tong }, dao: { con: kh.conDao.length }, doan: { con: kh.conDoan.length },
    }
  }
  return { ok: false, lyDo: 'khong_co_cau', error: 'Chưa có câu cao hơn một bậc ở dạng này trong phần em đã học. Vé vẫn còn nguyên.' }
}

// ---------------------------------------------------------------- lệnh hoa2-omni-* của app học sinh
export const LENH_OMNI_HOA2: readonly string[] = ['hoa2-omni-tram-xong', 'hoa2-omni-nhat-ky', 'hoa2-omni-doi-thu-tu', 'hoa2-omni-de-thu', 'hoa2-omni-de-thu-nop', ...LENH_OMNI_CAN_THAN]
/** Mọi lệnh mới: OMNI tắt cho em ⇒ `{ ok:false, error }` (Hoá 2.0 tắt thì cổng chung của game-v2.ts đã trả `{ ok:true, cheDo2:false }` từ trước). */
export async function hoa2OmniAction(env: Env, sbd: string, action: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  if (!(await omniBat(env, sbd).catch(() => false))) return { ok: false, error: LOI_OMNI_TAT }
  if (action === 'hoa2-omni-tram-xong') return tramXong(env, sbd, b, nowMs)
  if (action === 'hoa2-omni-nhat-ky') return { ok: true, dong: await nhatKyHomNay(env, sbd, nowMs) }
  if (action === 'hoa2-omni-doi-thu-tu') {
    const quyet = b.quyet
    if (quyet !== 'de_mai' && quyet !== 'lam_luon') return { ok: false, error: `Em chọn "${NUT_DE_MAI}" hoặc "${NUT_LAM_LUON}".` }
    return doiThuTuMetGio(env, sbd, nowMs, quyet)
  }
  if (action === 'hoa2-omni-de-thu') return deThu(env, sbd, nowMs)
  if (action === 'hoa2-omni-de-thu-nop') return deThuNop(env, sbd, b, nowMs)
  if (action === LENH_OMNI_CAN_THAN[0]) return ghiBuocSai(env, sbd, b, nowMs) // CẨN THẬN (c): em bấm một bước ở thẻ "Sai vì bước nào?" ⇒ ghi sổ riêng, không chấm
  return { ok: false, error: 'Lệnh không hợp lệ.' }
}

/**
 * `hoa2-omni-tram-xong {session}` — sau Trạm hồi phục: đổi ải KẾ TIẾP chưa làm của chuyến bằng câu CÙNG DẠNG thấp hơn MỘT bậc (thiếu ⇒ bậc gần nhất
 * phía dưới). Ưu tiên câu còn trong kế hoạch hôm nay, rồi câu DẠY HỌC trong phạm vi đã dạy; chưa gặp trước; không câu ca thi / bài tập chưa nộp / tự luận.
 * Ghi lại JSON phiên (so khớp bản cũ) để `answer` chấm được câu mới. Gọi lại ⇒ trả đúng câu đã đổi. Không có câu thay ⇒ `cau: null`.
 */
async function tramXong(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const id = str(b.session)
  if (!id) return { ok: false, error: 'Thiếu chuyến cần đổi ải.' }
  for (let lan = 0; lan < 2; lan++) {
    const row = await env.DB.prepare('SELECT json FROM game_v2_session WHERE id = ? AND sbd = ?').bind(id, sbd).first<Row>()
    if (!row) return { ok: false, error: 'Không tìm thấy chuyến của em.' }
    const json = str(row.json)
    const s = JSON.parse(json) as PhienOmni
    if (!phienMoTram(s)) return { ok: false, error: 'Chuyến này không có Trạm hồi phục.' }
    if (nowMs - Number(s.created ?? 0) > 2 * GIO_MS) return { ok: false, error: 'Chuyến đã hết hạn. Em mở chuyến mới.' }
    if (s.tram !== 1) return { ok: false, error: 'Chuyến này chưa mở Trạm hồi phục.' }
    if (s.tramXong) return traCauDaDoi(env, s)
    const da = new Set(((await env.DB.prepare('SELECT qid FROM game_v2_attempt WHERE session = ? AND sbd = ?').bind(id, sbd).all<Row>()).results ?? []).map((x) => str(x.qid)))
    const viTri = s.questions.findIndex((r) => !da.has(r.qid))
    if (viTri < 0) return { ok: true, cau: null, viTri: null }
    const cu = s.questions[viTri]!
    const thay = await timCauThapHon(env, sbd, s, cu, nowMs)
    if (!thay) return { ok: true, cau: null, viTri: null }
    const ref: RefOmni = { qid: thay.q.qid, maDe: thay.m.maDe, version: thay.m.version, group: thay.m.group, novel: thay.moi, role: cu.role ?? 'on_lai', ...refLamLai(thay) }
    const moi: PhienOmni = { ...s, questions: s.questions.map((r, i) => (i === viTri ? ref : r)), tramXong: { viTri, qid: ref.qid } }
    const ghi = await env.DB.prepare('UPDATE game_v2_session SET json = ? WHERE id = ? AND sbd = ? AND json = ?').bind(JSON.stringify(moi), id, sbd, json).run()
    if (ghi.meta.changes) return { ok: true, cau: { ...publicQuestion(thay.q), vai: ref.role }, viTri }
  }
  return { ok: false, error: 'Chuyến vừa đổi trên thiết bị khác. Em thử lại nhé.' }
}
async function traCauDaDoi(env: Env, s: PhienOmni): Promise<Record<string, unknown>> {
  const viTri = s.tramXong!.viTri, r = s.questions[viTri]
  if (!r) return { ok: true, cau: null, viTri: null }
  const q = (await napDayDuMem(env, [{ maDe: r.maDe, qid: r.qid, version: r.version, ...(r.btv !== undefined ? { btv: r.btv } : {}) }])).get(`${r.maDe}|${r.qid}|${r.version}`) // 06/10 (2c): `~bt` theo đúng phiên bản bộ sinh lúc phát
  return q ? { ok: true, cau: { ...publicQuestion(apXaoTheoRef(q, r)), vai: r.role }, viTri } : { ok: true, cau: null, viTri: null } // 06/10: bản xáo phát lại y hệt lúc phát
}
async function timCauThapHon(env: Env, sbd: string, s: PhienOmni, cu: RefOmni, nowMs: number): Promise<{ q: PrivateQuestion; m: MetaCau; moi: boolean; lamLai?: LamLaiRef } | null> {
  const gocCu = qidGocOmni(cu.qid)
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const mCu = hs.meta.get(gocCu) ?? (await docMetaCau(env, [gocCu], [cu.maDe])).get(gocCu)
  const bac = bacMuc(mCu?.mucDo)
  if (!mCu?.dang || bac == null || bac <= 0) return null // không còn bậc thấp hơn
  const trongPhien = new Set(s.questions.map((r) => qidGocOmni(r.qid))), nhomPhien = new Set(s.questions.map((r) => r.group))
  const bc = await boiCanh(env, sbd, nowMs)
  const hop = (m: MetaCau) => m.dang === mCu.dang && (bacMuc(m.mucDo) ?? 99) < bac && !trongPhien.has(m.qid) && !nhomPhien.has(m.group) && hopLeChung(m, bc)
  const keHoach = new Set(kh.conDao.map(qidGocOmni))
  const ungKh = [...keHoach].map((q) => hs.meta.get(q)).filter((m): m is MetaCau => !!m && hop(m))
  const ungPv = (await metaTheoDang(env, mCu.dang, await phamViChon(env, sbd))).filter((m) => hop(m) && !keHoach.has(m.qid) && !lamHomNay(m.qid, bc))
  const thu = xepUngVien([...ungKh, ...ungPv], bc, (m) => bac - 1 - bacMuc(m.mucDo)!, `${sbd}|${ngayVnCua(nowMs)}|tram`, (m) => (keHoach.has(m.qid) ? 0 : 1))
  const [chon] = await chanKhacKhoiEm(env, 'omni_tram', { sbd, khoiEm: bc.khoiEm }, await napTheoThuTu(env, thu.slice(0, 12), 1), { cauCua: (x) => x.q }) // LUẬT THẦY 05/10: cổng cuối — câu thấp hơn ĐÚNG khối em
  if (!chon) return null
  // Câu của kế hoạch mà kế hoạch đang phục vụ bằng câu SONG SINH (vòng học v2) ⇒ phủ song sinh như `napLuot`.
  const q = keHoach.has(chon.m.qid) ? phuNeuCan(chon.q, hs.songSinhCho, hs.boTro) : chon.q
  // 06/10 (làn A'): câu thay là câu LỖI trong cửa sổ lỗi mà vẫn ra nguyên văn ⇒ THANG làm lại (song sinh bản kế → câu anh em ĐÚNG KHỐI → bản xáo → nguyên văn có đếm).
  const thang = await quaThangTram(env, sbd, hs, kh, { q, m: chon.m }, new Set([...trongPhien, ...nhomPhien]), bc, nowMs, bac)
  return { q: thang.q, m: thang.m, moi: !bc.daLam.has(thang.m.qid), ...(thang.lamLai ? { lamLai: thang.lamLai } : {}) }
}
/**
 * THANG làm lại cho câu thay ải sau Trạm (đặc tả DE-XUAT-LAM-LAI-CAU-SAI-0510.md mục 2; hàm thang `apLamLaiKhac` của cau-anh-em.ts, KHÔNG viết lại luật ở đây).
 * Câu không phải lỗi / khoá `lam_lai_khac` tắt ⇒ trả y nguyên. Câu thay (câu anh em, bản song sinh, bản xáo) QUA LẠI cổng khối chung `chanKhacKhoiEm` (kênh
 * `omni_tram_thang`) — bị chặn ⇒ giữ câu cũ (đã qua cổng `omni_tram`), không bao giờ phát câu khác khối. Lỗi đọc thang ⇒ câu cũ (đường hôm nay), không làm hỏng Trạm.
 * Mục đích của Trạm là ĐỔI ẢI DỄ HƠN: câu anh em mức KHÔNG thấp hơn ải bị thay (`bacCu`) bị bỏ — dùng bản xáo của chính câu lỗi (bậc 3; không xáo được ⇒ nguyên văn có đếm).
 */
async function quaThangTram(env: Env, sbd: string, hs: HoSo2, kh: { dao: readonly string[]; doan: readonly string[] }, x: { q: PrivateQuestion; m: MetaCau }, chan: ReadonlySet<string>, bc: BoiCanh, nowMs: number, bacCu: number): Promise<{ q: PrivateQuestion; m: MetaCau; lamLai?: LamLaiRef }> {
  let ra: Awaited<ReturnType<typeof apLamLaiKhac>>[number] | undefined
  try {
    ;[ra] = await apLamLaiKhac(env, hs, [x], { sbd, nowMs, keHoach: [...kh.dao, ...kh.doan] }, chan)
  } catch (e) {
    console.error('[omni-game] thang làm lại của Trạm lỗi (giữ câu thay như cũ):', e instanceof Error ? e.message : e)
    return x
  }
  if (!ra || (ra.q === x.q && !ra.lamLai)) return x
  if (ra.lamLai?.tc) {
    const b = bacMuc(ra.m.mucDo)
    if (b != null && b >= bacCu) {
      const xao = xaoCau(x.q, `${sbd}|${ngayVnCua(nowMs)}|tram|${x.q.qid}`)
      ra = xao ? { q: xao.q, m: x.m, lamLai: { xt: xao.xt } } : { q: x.q, m: x.m, lamLai: { nv: 1 } }
    }
  }
  const [giu] = await chanKhacKhoiEm(env, 'omni_tram_thang', { sbd, khoiEm: bc.khoiEm }, [ra], { cauCua: (y) => y.q }) // LUẬT THẦY 05/10: cổng cuối cho câu thay của thang
  return giu ?? x
}

// ---------------------------------------------------------------- đề thử nửa
interface RefDeThu { qid: string; maDe: string; version: string; phan: Phan }
function docRefsDeThu(v: unknown): RefDeThu[] {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.filter(laObj).map((x) => ({ qid: str(x.qid), maDe: str(x.maDe), version: str(x.version), phan: (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan })).filter((x) => x.qid && x.maDe) : []
  } catch { return [] }
}
/** Số câu từng phần của đề thử theo tỉ lệ khung (phần dư lớn nhất): 14 câu trên khung 18/4/6 ⇒ 9 · 2 · 3. Thuần. */
export function hanNgachDeThu(soCau: number, khung: { I: number; II: number; III: number } = TS.KHUNG_DE): Record<Phan, number> {
  const phan: Phan[] = ['I', 'II', 'III']
  const tong = khung.I + khung.II + khung.III
  const tho = phan.map((p) => (soCau * khung[p]) / tong)
  const ra = tho.map((x) => Math.floor(x))
  let du = soCau - ra.reduce((s, x) => s + x, 0)
  for (const i of [0, 1, 2].sort((a, b) => (tho[b]! - ra[b]!) - (tho[a]! - ra[a]!) || a - b)) { if (du <= 0) break; ra[i]!++; du-- }
  return { I: ra[0]!, II: ra[1]!, III: ra[2]! }
}
/** Xếp vòng tròn theo dạng (phủ nhiều dạng nhất), thứ tự tất định theo băm. */
function xepVongTron(ds: readonly MetaCau[], muoi: string): MetaCau[] {
  const theo = new Map<string, MetaCau[]>()
  for (const m of ds) { const k = m.dang ?? ''; theo.set(k, [...(theo.get(k) ?? []), m]) }
  const nhom = [...theo.entries()].sort((a, b) => bam32(`${muoi}|dang|${a[0]}`) - bam32(`${muoi}|dang|${b[0]}`))
    .map(([, xs]) => [...xs].sort((a, b) => bam32(`${muoi}|${a.qid}`) - bam32(`${muoi}|${b.qid}`)))
  const ra: MetaCau[] = []
  for (let i = 0; nhom.some((g) => i < g.length); i++) for (const g of nhom) if (i < g.length) ra.push(g[i]!)
  return ra
}
/**
 * `hoa2-omni-de-thu` — ĐỀ THỬ NỬA: DE_THU.soCau (14) câu LẠ (em chưa từng làm ở bất kỳ nguồn nào, kể cả bản chép cùng nhóm nội dung), DẠY HỌC, trong phạm vi
 * bài đang luyện + bài cũ; tỉ lệ phần theo khung đề (≈ 9 I · 2 II · 3 III, phần thiếu bù bằng phần khác); không tự luận, không câu ca thi / bài tập chưa nộp.
 * Lưu `omni_de_thu`; trả câu CÔNG KHAI (không đáp án, không lời giải), `phut` 25, `hetLuc`. Đề đang mở chưa quá giờ (+2 phút) ⇒ trả lại chính đề ấy.
 */
async function deThu(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  await damBaoBangOmniGame(env)
  const dang = await env.DB.prepare('SELECT id, qid_json, het_luc FROM omni_de_thu WHERE sbd = ? AND nop_luc IS NULL ORDER BY tao_luc DESC LIMIT 1').bind(sbd).first<Row>()
  if (dang && nowMs <= Date.parse(str(dang.het_luc)) + 2 * PHUT_MS) {
    const refs = docRefsDeThu(dang.qid_json)
    const day = await napDayDuMem(env, refs)
    const cau = refs.map((r) => day.get(`${r.maDe}|${r.qid}|${r.version}`)).filter((q): q is PrivateQuestion => !!q)
    if (cau.length) return { ok: true, id: str(dang.id), cau: cau.map(publicQuestion), phut: TS.DE_THU.phut, hetLuc: str(dang.het_luc) }
  }
  const [pv, bc] = await Promise.all([phamViChon(env, sbd), boiCanh(env, sbd, nowMs)])
  const tatCa = (await metaTheoPhamVi(env, pv)).filter((m) => hopLeChung(m, bc))
  const nhomDaLam = new Set(tatCa.filter((m) => bc.daLam.has(m.qid)).map((m) => m.group))
  const la = tatCa.filter((m) => !bc.daLam.has(m.qid) && !nhomDaLam.has(m.group))
  const muoi = `${sbd}|${ngayVnCua(nowMs)}|de_thu`
  const theoPhan: Record<Phan, MetaCau[]> = { I: [], II: [], III: [] }
  for (const p of ['I', 'II', 'III'] as Phan[]) theoPhan[p] = xepVongTron(la.filter((m) => m.phan === p), muoi)
  const han = hanNgachDeThu(TS.DE_THU.soCau)
  const daChon = new Set<string>()
  const chon: Record<Phan, { q: PrivateQuestion; m: MetaCau }[]> = { I: [], II: [], III: [] }
  for (const p of ['I', 'II', 'III'] as Phan[]) chon[p] = await napTheoThuTu(env, theoPhan[p], han[p], daChon)
  for (const p of ['I', 'III', 'II'] as Phan[]) {
    const thieu = TS.DE_THU.soCau - chon.I.length - chon.II.length - chon.III.length
    if (thieu <= 0) break
    chon[p].push(...await napTheoThuTu(env, theoPhan[p].filter((m) => !daChon.has(m.group)), thieu, daChon))
  }
  const ds = await chanKhacKhoiEm(env, 'omni_de_thu', { sbd, khoiEm: bc.khoiEm }, [...chon.I, ...chon.II, ...chon.III], { cauCua: (x) => x.q }) // LUẬT THẦY 05/10: cổng cuối — đề thử chỉ câu ĐÚNG khối em
  if (ds.length < TS.DE_THU.soCau) return { ok: false, lyDo: 'chua_du_cau', error: `Chưa đủ ${TS.DE_THU.soCau} câu em chưa làm trong phần đã học để lập đề thử.` }
  const id = crypto.randomUUID(), tao = new Date(nowMs).toISOString(), het = new Date(nowMs + TS.DE_THU.phut * PHUT_MS).toISOString()
  const refs: RefDeThu[] = ds.map(({ q, m }) => ({ qid: q.qid, maDe: m.maDe, version: m.version, phan: q.phan }))
  await env.DB.prepare('INSERT INTO omni_de_thu (id, sbd, qid_json, tao_luc, het_luc) VALUES (?,?,?,?,?)').bind(id, sbd, JSON.stringify(refs), tao, het).run()
  return { ok: true, id, cau: ds.map(({ q }) => publicQuestion(q)), phut: TS.DE_THU.phut, hetLuc: het }
}
/** Đáp án em gửi → chuỗi chấm được; sai khuôn / bỏ trống ⇒ '' (bỏ trống: sai, 0 điểm). Phần II nhận Đ/S từng ý, '-' là ý bỏ trống. */
function chuanTraLoi(phan: Phan, v: unknown): string {
  const s = str(v).trim()
  if (phan === 'I') return /^[ABCD]$/i.test(s) ? s.toUpperCase() : ''
  if (phan === 'II') return /^[DS-]{4}$/i.test(s) && /[DS]/i.test(s) ? s.toUpperCase() : ''
  return s.length <= 40 ? s : ''
}
/** Chấm một câu đề thử bằng ĐÚNG hàm chấm của game (`grade`); điểm: Phần I/III 0,25 khi đúng; Phần II theo số ý đúng (`diemDungSai` của src/lib/tu-luyen.ts). Thuần. */
export function chamCauDeThu(q: Pick<PrivateQuestion, 'phan' | 'correct'>, chon: string): { dung: boolean; diem: number; yDung?: number } {
  if (q.phan === 'II') {
    const yDung = chon ? ketQuaTungY(chon, q.correct).reduce<number>((s, x) => s + x, 0) : 0
    return { dung: !!chon && grade(q, chon), diem: diemDungSai(yDung), yDung }
  }
  const dung = !!chon && grade(q, chon)
  return { dung, diem: dung ? TS.DIEM_CAU[q.phan] : 0 }
}
/**
 * QUY RA THANG 10 theo khung câu của CHÍNH đề: diem = 10 × Σ điểm câu / Σ điểm tối đa, với Σ điểm tối đa = 0,25 × (số câu Phần I + số câu Phần III)
 * + 1 × (số câu Phần II). Khung 9 · 2 · 3 ⇒ tối đa 5 điểm ⇒ diem = 2 × Σ điểm câu (đúng như nửa đề thi 28 câu). Làm tròn 2 chữ số. Thuần.
 */
export function diemThang10(cau: readonly { phan: Phan; diem: number }[]): number {
  const toiDa = cau.reduce((s, c) => s + (c.phan === 'II' ? 1 : TS.DIEM_CAU[c.phan]), 0)
  const dat = cau.reduce((s, c) => s + c.diem, 0)
  return toiDa > 0 ? Math.round((10 * dat / toiDa) * 100) / 100 : 0
}
/**
 * `hoa2-omni-de-thu-nop {id, traLoi:{qid:chuỗi}, msLam?:{qid:ms}}` — chấm cả đề khi nộp; ghi sổ nguồn 'luyen', mã nguồn `de_thu:<id>`, purpose 'de_thu',
 * raw `{chon, ms}` (Phần II thêm kết quả từng ý); quá `hetLuc` + 2 phút vẫn chấm nhưng mang `quaGio: true`. Trả điểm + đáp án + lời giải SAU khi nộp.
 * Nộp lại (mạng chập chờn) ⇒ chấm lại đúng bài đã ghi sổ (không đổi được đáp án sau khi xem kết quả).
 */
async function deThuNop(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  await damBaoBangOmniGame(env)
  const id = str(b.id)
  if (!id) return { ok: false, error: 'Thiếu đề thử cần nộp.' }
  const row = await env.DB.prepare('SELECT id, qid_json, het_luc, nop_luc FROM omni_de_thu WHERE id = ? AND sbd = ?').bind(id, sbd).first<Row>()
  if (!row) return { ok: false, error: 'Không tìm thấy đề thử của em.' }
  const refs = docRefsDeThu(row.qid_json)
  const maNguon = `de_thu:${id}`
  const daNop = row.nop_luc != null && str(row.nop_luc) !== ''
  let traLoi: Row = laObj(b.traLoi) ? b.traLoi : {}
  let msLam: Row = laObj(b.msLam) ? b.msLam : {}
  if (daNop) {
    traLoi = {}; msLam = {}
    const r = await env.DB.prepare("SELECT qid, raw_json FROM su_kien_hoc WHERE sbd = ? AND nguon = 'luyen' AND ma_nguon = ?").bind(sbd, maNguon).all<Row>()
    for (const x of r.results ?? []) {
      try { const o = JSON.parse(str(x.raw_json) || '{}') as Row; traLoi[str(x.qid)] = str(o.chon); if (o.ms != null) msLam[str(x.qid)] = o.ms } catch { /* dòng hỏng: coi như bỏ trống */ }
    }
  }
  const nopMs = daNop ? Date.parse(str(row.nop_luc)) : nowMs
  const luc = new Date(nopMs).toISOString()
  const quaGio = nopMs > Date.parse(str(row.het_luc)) + 2 * PHUT_MS
  const day = await napDayDuMem(env, refs)
  const cau: { qid: string; dung: boolean; traLoi: string; dapAn: string; loiGiai: unknown }[] = []
  const diemCau: { phan: Phan; diem: number }[] = []
  const suKien: SuKien[] = []
  for (const r of refs) {
    const q = day.get(`${r.maDe}|${r.qid}|${r.version}`)
    if (!q) continue // câu đã rút khỏi kho sau khi lập đề: không chấm, không tính vào khung
    const chon = chuanTraLoi(q.phan, traLoi[r.qid])
    const kq = chamCauDeThu(q, chon)
    diemCau.push({ phan: q.phan, diem: kq.diem })
    cau.push({ qid: r.qid, dung: kq.dung, traLoi: chon, dapAn: q.correct, loiGiai: q.solution })
    suKien.push({
      nguon: 'luyen', maNguon, sbd, qid: r.qid, lan: 1, ketQua: chon ? (kq.dung ? 1 : 0) : null, luc, maDang: q.dang, chuyenDe: '', mucDo: q.mucDo ?? '',
      attemptId: `${maNguon}|${r.qid}`, assistance: 'none', purpose: MUC_DICH_DE_THU, receivedAt: nopMs, raw: { chon, ms: docMsLam(msLam[r.qid]) },
      ...(q.phan === 'II' && chon ? { subitem: ketQuaTungY(chon, q.correct) } : {}),
    })
  }
  const diem = diemThang10(diemCau)
  if (!daNop) {
    const g = await ghiSuKien(env, suKien)
    if (g.ok) await env.DB.prepare('UPDATE omni_de_thu SET nop_luc = ?, diem = ? WHERE id = ? AND sbd = ? AND nop_luc IS NULL').bind(luc, diem, id, sbd).run()
  }
  return { ok: true, diem, dung: cau.filter((c) => c.dung).length, tong: cau.length, cau, ...(quaGio ? { quaGio: true } : {}) }
}
