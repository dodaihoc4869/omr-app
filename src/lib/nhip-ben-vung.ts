// NHỊP TỰ GỌI MÁY CHỦ CỦA APP HỌC SINH / PHỤ HUYNH — bền vững khi máy chủ nghẽn (sự cố D1 21/09 ~20:30: lệnh đọc 8–23 giây, ~150 máy em mở app ⇒ vòng nền 15 s / 30 s trên MỌI máy đè thêm ~900 lượt/phút).
// Luật (Boss): (1) nhịp nền CHẬM (mặc định 180 giây) + LỆCH ngẫu nhiên ±30 giây để hàng trăm máy không đồng pha; (2) KHÔNG gọi khi lần trước chưa xong; (3) vẫn gọi khi quay lại tab / có mạng lại nhưng CHẶN DỘI (≥ 20 giây kể từ lần bắt đầu trước);
// (4) lỗi / hết giờ ⇒ LÙI DẦN 30 → 60 → 120 giây (không bao giờ NHANH hơn nhịp thường), thành công thì về nhịp thường; (5) tab ẩn thì không gọi (hẹn lại). Không đổi luật gì của máy chủ. THUẦN (không React) — bọc trong effect ở nơi dùng.

export const NHIP_NEN_MS = 180_000
export const LECH_NHIP_MS = 30_000
export const CHAN_DOI_MS = 20_000
export const LUI_DAN_MS: readonly number[] = [30_000, 60_000, 120_000]

/** Khoảng chờ trước lần tự gọi kế: nhịp cơ sở ± lệch ngẫu nhiên; sau N lần lỗi liên tiếp ⇒ không ít hơn mức lùi (30 → 60 → 120 s, giữ ở 120). Không bao giờ dưới 1 giây. */
export function khoangChoTiepTheo(coSoMs: number, lechMs: number, soLoiLienTiep: number, ngauNhien: () => number = Math.random): number {
  const nen = Math.max(1000, Math.round(coSoMs + (ngauNhien() * 2 - 1) * lechMs))
  if (soLoiLienTiep <= 0) return nen
  const lui = LUI_DAN_MS[Math.min(Math.floor(soLoiLienTiep), LUI_DAN_MS.length) - 1]!
  return Math.max(nen, lui)
}

export interface TuyChonNhip {
  coSoMs?: number
  lechMs?: number
  chanDoiMs?: number
  /** Gọi ngay khi bật (mặc định true). */
  chayNgay?: boolean
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
  const bay = o.bayGio ?? Date.now
  const an = o.dangAn ?? (() => typeof document !== 'undefined' && document.hidden)
  const dat = o.datGio ?? ((f, ms) => setTimeout(f, ms))
  const xoa = o.xoaGio ?? ((t) => clearTimeout(t))
  let dungRoi = false, dangChay = false, batDauCuoi = Number.NEGATIVE_INFINITY, loi = 0
  let gio: ReturnType<typeof setTimeout> | undefined

  const xep = () => {
    if (dungRoi) return
    xoa(gio)
    gio = dat(nhip, khoangChoTiepTheo(coSo, lech, loi, o.ngauNhien))
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
