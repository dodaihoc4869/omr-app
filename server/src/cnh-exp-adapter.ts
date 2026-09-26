// CỬA DUY NHẤT của Lát 1 (EXP route nguyên tử): route THẬT → (cửa fail-closed đọc từ D1) → P07.
//
// VÌ SAO CÓ TỆP NÀY: `cnh-exp-route-gate.ts` đã KHAI 14 route đụng tiền nhưng TẤT CẢ đang
// `de_xuat_patch` — chưa route nào được nối. `nopBaiCore`/`quyetToanQuyenCore` là substrate đã
// nghiệm thu (substrate CHƯA KÍCH HOẠT). Tệp này là MỘT cửa để route gọi, bảo đảm:
//   · Cờ kích hoạt đọc từ ĐÚNG `cau_hinh` (không hard-code, không suy từ mã).
//   · Vắng cờ / cờ hỏng ⇒ cấu hình MẶC ĐỊNH (mọi điều kiện chưa đạt) ⇒ cửa ĐÓNG (fail-closed).
//   · Route ngoài sổ kiểm hoặc `ngoai_lat_nay` ⇒ TỪ CHỐI (không tự nối).
//   · Chỉ khi cửa mở mới chạm substrate ⇒ không có đường nào cộng ví khi cửa đóng.
//
// ⚠️ TỆP NÀY KHÔNG TỰ BẬT CỜ, KHÔNG ĐỔI ROUTE ĐANG CHẠY, KHÔNG GHI GÌ khi cửa đóng.
// Việc nối từng route (`server/src/index.ts`, `on-lai-nop.ts`, `mom.ts`, …) là bước sau, có cửa canh.
import type { Env } from './kieu'
import {
  doiVangCore,
  dungKhienCore,
  ghiManhNgayDat,
  giaiQuyetKhiendau,
  hapThuCore,
  renKhienCore,
  type ChungLenhP08,
  type PhanHoiDoiVang,
  type PhanHoiDungKhien,
  type PhanHoiGiaiQuyet,
  type PhanHoiHapThu,
  type PhanHoiKhien,
  type PhanHoiManhNgayDat,
  type PhuThuocLenhP08,
  type YeuCauDoiVang,
  type YeuCauGiaiQuyet,
  type YeuCauManhNgayDat,
} from './cnh-exp-p08-lenh'
import {
  kiemCuaKichHoat,
  kiemTichHopRoute,
  type CauHinhKichHoat,
  type DongSoTichHop,
  type KetQuaCua,
} from './cnh-exp-route-gate'
import {
  nopBaiCore,
  type PhanHoiNopBaiCore,
  type PhuThuocNopBai,
  type YeuCauNopBaiCore,
} from './cnh-exp-submit'
import {
  quyetToanQuyenCore,
  type PhanHoiQuyetToanCore,
  type PhuThuocQuyetToan,
  type YeuCauQuyetToanCore,
} from './cnh-exp-ledger'

/** Khoá `cau_hinh` giữ cờ kích hoạt quỹ ví mới (JSON). Vắng/hỏng ⇒ fail-closed. */
export const KHOA_CAU_HINH_KICH_HOAT = 'cnh_exp_kich_hoat'

/**
 * Cấu hình MẶC ĐỊNH khi chưa có cờ: MỌI điều kiện đều CHƯA đạt ⇒ cửa đóng.
 * `strictMetadata: false` vì strict/new AI metadata là HOÃN — KHÔNG phải điều kiện kích hoạt
 * (route-gate giữ bất biến này; ở đây khai lại cho rõ ý định, không tham gia quyết định).
 */
export const CAU_HINH_KICH_HOAT_MAC_DINH: CauHinhKichHoat = Object.freeze({
  bangDaChay: false,
  phienBanChinhSach: '',
  duongCuConBat: true,
  viMoiLaChu: false,
  anhChupDaNoi: false,
  strictMetadata: false,
})

const laBool = (x: unknown): boolean => x === true

/**
 * Đọc cờ kích hoạt từ `cau_hinh`. Vắng dòng / giá trị rỗng / JSON hỏng / lỗi D1 ⇒ cấu hình MẶC ĐỊNH.
 * Hàm THUẦN ở phần diễn giải: mọi trường đọc theo kiểu chặt, mọi thứ không phải boolean/chuỗi hợp lệ
 * rơi về giá trị an toàn (đóng), không bao giờ "suy ra" là đã sẵn sàng.
 */
export async function docCauHinhKichHoat(env: Env): Promise<CauHinhKichHoat> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?')
    .bind(KHOA_CAU_HINH_KICH_HOAT)
    .first<{ gia_tri: string | null }>()
    .catch(() => null)
  const raw = r?.gia_tri
  if (typeof raw !== 'string' || !raw.trim()) return { ...CAU_HINH_KICH_HOAT_MAC_DINH }
  let j: Record<string, unknown>
  try {
    j = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { ...CAU_HINH_KICH_HOAT_MAC_DINH }
  }
  if (j === null || typeof j !== 'object' || Array.isArray(j)) {
    return { ...CAU_HINH_KICH_HOAT_MAC_DINH }
  }
  return {
    bangDaChay: laBool(j.bangDaChay),
    phienBanChinhSach: typeof j.phienBanChinhSach === 'string' ? j.phienBanChinhSach : '',
    duongCuConBat: j.duongCuConBat !== false,
    viMoiLaChu: laBool(j.viMoiLaChu),
    anhChupDaNoi: laBool(j.anhChupDaNoi),
    strictMetadata: laBool(j.strictMetadata),
  }
}

/** Cửa cho MỘT route: đọc cờ THẬT rồi áp cửa fail-closed của `kiemTichHopRoute`. */
export async function moCuaRoute(
  env: Env,
  duong: string,
): Promise<KetQuaCua & { dong?: DongSoTichHop }> {
  const c = await docCauHinhKichHoat(env)
  return kiemTichHopRoute(duong, c)
}

/** Lỗi khi cửa đóng: nêu MÃ + lý do, KHÔNG lộ gì của P07. */
export class LoiCuaExp extends Error {
  readonly ma: string
  constructor(ma: string, lyDo: string) {
    super(`CNH_EXP_CUA_DONG: ${ma} — ${lyDo}`)
    this.name = 'LoiCuaExp'
    this.ma = ma
  }
}

/**
 * Nộp bài qua P07 — CHỈ khi cửa của `duong` MỞ. Cửa đóng ⇒ ném `LoiCuaExp` và **KHÔNG** chạm
 * substrate (không đọc/ghi bảng P07 ⇒ không thể cộng ví khi cửa đóng). Cửa mở ⇒ chuyển nguyên
 * `YeuCauNopBaiCore` cho `nopBaiCore` (mọi bất biến idempotency/atomic của substrate giữ nguyên).
 */
export async function nopQuaP07(
  env: Env,
  duong: string,
  yeuCau: YeuCauNopBaiCore,
  phuThuoc: PhuThuocNopBai = {},
): Promise<PhanHoiNopBaiCore> {
  const cua = await moCuaRoute(env, duong)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return nopBaiCore(env, yeuCau, phuThuoc)
}

/** Quyết toán quyền core qua P07 — CHỈ khi cửa của `duong` MỞ (cùng luật fail-closed như `nopQuaP07`). */
export async function quyetToanQuaP07(
  env: Env,
  duong: string,
  yeuCau: YeuCauQuyetToanCore,
  phuThuoc: PhuThuocQuyetToan = {},
): Promise<PhanHoiQuyetToanCore> {
  const cua = await moCuaRoute(env, duong)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return quyetToanQuyenCore(env, yeuCau, phuThuoc)
}

// ───────── CỬA P08 (§6–§9): HẤP THỤ · RÈN KHIÊN · ĐỔI VÀNG · DÙNG KHIÊN · CHUYỂN ĐỔI ─────────
//
// CÙNG LUẬT FAIL-CLOSED như `nopQuaP07`: cửa ĐÓNG (mặc định) ⇒ ném `LoiCuaExp` và **KHÔNG chạm
// substrate P08** (không đọc/ghi `cnh_exp_p08_*` ⇒ không thể đổi tiền khi cửa đóng).
//
// ⚠️ THỨ TỰ BẮT BUỘC khi bật: chạy CHUYỂN ĐỔI (`chuyenDoiP08`/`chuyenDoiTuLegacy`) cho em TRƯỚC,
// rồi mới bật cờ — lệnh P08 đòi hàng `cnh_exp_p08_state`; chưa chuyển mà bật ⇒ mọi lượt ném `NOT_FOUND`.

/**
 * CỬA P08 DÙNG CHUNG cho những chỗ KHÔNG phải một đường trong sổ kiểm route (ví dụ nhánh `vang-doi`
 * của Cửa hàng, `shield-use`, móc "đạt ngày ⇒ +1 mảnh"). Cùng phép kiểm fail-closed `kiemCuaKichHoat`
 * ⇒ cùng điều kiện với các route đã khai (một công tắc, không hai luật).
 * ⚠️ KHÁC `moCuaRoute`: hàm này KHÔNG kiểm đường có trong sổ hay không — dùng cho hành vi NỘI BỘ,
 * không phải route. Vẫn fail-closed y hệt.
 */
export async function cuaP08Mo(env: Env): Promise<{ choPhep: boolean; ma: string; lyDo: string }> {
  const c = await docCauHinhKichHoat(env)
  return kiemCuaKichHoat(c)
}
export async function hapThuQuaP08(
  env: Env,
  duong: string,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiHapThu> {
  const cua = await moCuaRoute(env, duong)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return hapThuCore(env, yeuCau, phuThuoc)
}

export async function renKhienQuaP08(
  env: Env,
  duong: string,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiKhien> {
  const cua = await moCuaRoute(env, duong)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return renKhienCore(env, yeuCau, phuThuoc)
}

export async function doiVangQuaP08(
  env: Env,
  duong: string,
  yeuCau: YeuCauDoiVang,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiDoiVang> {
  void duong // hành vi NỘI BỘ (nhánh `vang-doi` của Cửa hàng) — không phải route trong sổ kiểm
  const cua = await cuaP08Mo(env)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return doiVangCore(env, yeuCau, phuThuoc)
}

export async function dungKhienQuaP08(
  env: Env,
  duong: string,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiDungKhien> {
  void duong // hành vi NỘI BỘ (action `shield-use`) — không phải route trong sổ kiểm
  const cua = await cuaP08Mo(env)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return dungKhienCore(env, yeuCau, phuThuoc)
}

export async function ghiManhQuaP08(
  env: Env,
  duong: string,
  yeuCau: YeuCauManhNgayDat,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiManhNgayDat> {
  void duong // móc NỘI BỘ ("đạt ngày ⇒ +1 mảnh") — không phải route trong sổ kiểm
  const cua = await cuaP08Mo(env)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return ghiManhNgayDat(env, yeuCau, phuThuoc)
}

/** Giải quyết nhánh `legacy_unresolved` — hành vi NỘI BỘ (công cụ giáo viên), cửa dùng chung. */
export async function giaiQuyetQuaP08(
  env: Env,
  yeuCau: YeuCauGiaiQuyet,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiGiaiQuyet> {
  const cua = await cuaP08Mo(env)
  if (!cua.choPhep) throw new LoiCuaExp(cua.ma, cua.lyDo)
  return giaiQuyetKhiendau(env, yeuCau, phuThuoc)
}
