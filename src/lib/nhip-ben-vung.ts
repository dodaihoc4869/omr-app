// NHỊP TỰ GỌI MÁY CHỦ CỦA APP HỌC SINH / PHỤ HUYNH — bền vững khi máy chủ nghẽn (sự cố D1 21/09 ~20:30: lệnh đọc 8–23 giây, ~150 máy em mở app ⇒ vòng nền 15 s / 30 s trên MỌI máy đè thêm ~900 lượt/phút).
// Luật (Boss): (1) nhịp nền CHẬM (mặc định 180 giây) + LỆCH ngẫu nhiên ±30 giây để hàng trăm máy không đồng pha; (2) KHÔNG gọi khi lần trước chưa xong; (3) vẫn gọi khi quay lại tab / có mạng lại nhưng CHẶN DỘI (≥ 20 giây kể từ lần bắt đầu trước);
// (4) lỗi / hết giờ ⇒ LÙI DẦN 30 → 60 → 120 → 300 giây (không bao giờ NHANH hơn nhịp thường), thành công thì về nhịp thường; (5) tab ẩn thì không gọi (hẹn lại). Không đổi luật gì của máy chủ. THUẦN (không React) — bọc trong effect ở nơi dùng.

import { nhipSauHeSo } from './nhip-de-nghi'

export const NHIP_NEN_MS = 180_000
export const LECH_NHIP_MS = 30_000
export const CHAN_DOI_MS = 20_000
export const LUI_DAN_MS: readonly number[] = [30_000, 60_000, 120_000, 300_000]

/** Khoảng chờ trước lần tự gọi kế: nhịp cơ sở ± lệch ngẫu nhiên; sau N lần lỗi liên tiếp ⇒ không ít hơn mức lùi (30 → 60 → 120 → 300 s, giữ ở 300). Không bao giờ dưới 1 giây. */
export function khoangChoTiepTheo(coSoMs: number, lechMs: number, soLoiLienTiep: number, ngauNhien: () => number = Math.random, luiDan: readonly number[] = LUI_DAN_MS): number {
  const nen = Math.max(1000, Math.round(coSoMs + (ngauNhien() * 2 - 1) * lechMs))
  if (soLoiLienTiep <= 0) return nen
  if (luiDan.length === 0) return nen
  const lui = luiDan[Math.min(Math.floor(soLoiLienTiep), luiDan.length) - 1]!
  return Math.max(nen, lui)
}

/** Vòng hỏi TRỰC TIẾP (đang trong một trận/phòng mở — nhịp nhanh vì em đang nhìn màn): lỗi liên tiếp ⇒ thưa dần 5 → 10 → 20 → 30 giây, KHÔNG BAO GIỜ nhanh hơn nhịp thường; thành công ⇒ về nhịp thường. */
export const LUI_TRUC_TIEP_MS: readonly number[] = [5_000, 10_000, 20_000, 30_000]
export function khoangChoTrucTiep(coSoMs: number, soLoiLienTiep: number): number {
  if (!(soLoiLienTiep > 0)) return coSoMs
  return Math.max(coSoMs, LUI_TRUC_TIEP_MS[Math.min(Math.floor(soLoiLienTiep), LUI_TRUC_TIEP_MS.length) - 1]!)
}

export interface VongTrucTiep {
  dung: () => void
  /** Số lần lỗi liên tiếp hiện tại (để test). */
  soLoi: () => number
}

/**
 * Vòng hỏi TRỰC TIẾP cho màn đang mở (trận Đoàn, phòng Escort): hẹn giờ NỐI TIẾP — lượt sau chỉ hẹn khi lượt trước XONG (không bao giờ có hai lượt bay cùng lúc, khác `setInterval`
 * vẫn bắn thêm khi máy chủ chậm 8–23 giây); `chay()` trả `false` hoặc ném = lỗi ⇒ thưa dần (`khoangChoTrucTiep`); mọi giá trị khác (kể cả bỏ lượt vì tab ẩn) = tốt.
 */
export function batVongTrucTiep(
  chay: () => Promise<unknown> | unknown,
  coSoMs: number,
  o: { datGio?: (f: () => void, ms: number) => ReturnType<typeof setTimeout>; xoaGio?: (t: ReturnType<typeof setTimeout> | undefined) => void; /** Hệ số `nhipDeNghi` tối đa áp cho vòng trực tiếp (mặc định 2: trận đang chơi không giãn quá gấp đôi). */ heSoToiDa?: number } = {},
): VongTrucTiep {
  const nhipHienHanh = () => nhipSauHeSo(coSoMs, { heSoToiDa: o.heSoToiDa ?? 2, tranMs: coSoMs * 2 })
  const dat = o.datGio ?? ((f, ms) => setTimeout(f, ms))
  const xoa = o.xoaGio ?? ((t) => clearTimeout(t))
  let dungRoi = false, loi = 0
  let gio: ReturnType<typeof setTimeout> | undefined
  const buoc = async () => {
    if (dungRoi) return
    let hong = false
    try {
      hong = (await chay()) === false
    } catch {
      hong = true
    }
    loi = hong ? loi + 1 : 0
    if (!dungRoi) gio = dat(() => void buoc(), khoangChoTrucTiep(nhipHienHanh(), loi))
  }
  gio = dat(() => void buoc(), nhipHienHanh())
  return { dung: () => { dungRoi = true; xoa(gio); gio = undefined }, soLoi: () => loi }
}

export interface TuyChonNhip {
  coSoMs?: number
  lechMs?: number
  chanDoiMs?: number
  /** Gọi ngay khi bật (mặc định true). */
  chayNgay?: boolean
  /** Bảng lùi riêng khi lỗi liên tiếp (mili-giây, giữ ở mức cuối); mặc định `LUI_DAN_MS`. Vd Theo dõi ca của thầy: [30 s, 40 s] — lùi TỐI ĐA 40 s để số không cũ quá. */
  luiDanMs?: readonly number[]
  /** Hệ số `nhipDeNghi` của máy chủ tối đa được nhân vào nhịp gốc (mặc định 4; hiện diện đặt 1 vì máy chủ coi "online" trong 90 s). */
  heSoToiDa?: number
  /** Trần nhịp sau khi nhân hệ số (ms); mặc định max(nhịp gốc, 300 s). */
  tranMs?: number
  // để test / môi trường lạ:
  ngauNhien?: () => number
  bayGio?: () => number
  dangAn?: () => boolean
  datGio?: (f: () => void, ms: number) => ReturnType<typeof setTimeout>
  xoaGio?: (t: ReturnType<typeof setTimeout> | undefined) => void
}

export interface NhipBenVung {
  /** Sự kiện "quay lại tab / có mạng lại": gọi nếu không đang chạy, tab hiện và đã qua `chanDoiMs`. */
  kich: () => void
  dung: () => void
  /** Số lần lỗi liên tiếp hiện tại (để test / hiển thị). */
  soLoi: () => number
}

/**
 * Bật vòng tự gọi. `chay()` trả Promise: từ chối hoặc trả `false` = LỖI (lùi dần); mọi giá trị khác = thành công.
 */
export function batNhipBenVung(chay: () => Promise<unknown> | unknown, o: TuyChonNhip = {}): NhipBenVung {
  const coSo = o.coSoMs ?? NHIP_NEN_MS, lech = o.lechMs ?? LECH_NHIP_MS, chanDoi = o.chanDoiMs ?? CHAN_DOI_MS
  const bay = o.bayGio ?? (() => Date.now())
  const an = o.dangAn ?? (() => typeof document !== 'undefined' && document.hidden)
  const dat = o.datGio ?? ((f, ms) => setTimeout(f, ms))
  const xoa = o.xoaGio ?? ((t) => clearTimeout(t))
  let dungRoi = false, dangChay = false, batDauCuoi = Number.NEGATIVE_INFINITY, loi = 0
  let gio: ReturnType<typeof setTimeout> | undefined

  const xep = () => {
    if (dungRoi) return
    xoa(gio)
    gio = dat(nhip, khoangChoTiepTheo(nhipSauHeSo(coSo, { heSoToiDa: o.heSoToiDa, tranMs: o.tranMs }, bay()), lech, loi, o.ngauNhien, o.luiDanMs))
  }
  const chayMot = async () => {
    if (dungRoi || dangChay) return
    dangChay = true
    batDauCuoi = bay()
    let hong = false
    try {
      hong = (await chay()) === false
    } catch {
      hong = true
    } finally {
      dangChay = false
      loi = hong ? loi + 1 : 0
      xep()
    }
  }
  function nhip() {
    if (dungRoi) return
    if (an()) { xep(); return } // tab ẩn: không gọi, hẹn lại
    void chayMot()
  }

  if (o.chayNgay === false) xep()
  else void chayMot()

  return {
    kich: () => {
      if (dungRoi || dangChay || an()) return
      if (bay() - batDauCuoi < chanDoi) return
      void chayMot()
    },
    dung: () => { dungRoi = true; xoa(gio); gio = undefined },
    soLoi: () => loi,
  }
}
