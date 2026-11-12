// NHỊP TỰ GỌI MÁY CHỦ CỦA APP THẦY (Code 4, 21/09/2026 — kế hoạch docs/dac-ta-cu/KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md, mục Code 4 (3)). Sau sự cố D1 20:30: D1 chỉ MỘT luồng, mọi vòng tự hỏi nền của mọi máy đè lên nhau.
// LUẬT cho MỌI vòng tự gọi máy chủ ở app thầy (`/`, `/gv`): (1) nhịp lấy từ BẢNG dưới đây (một nơi, có lý do); (2) TAB ẩn thì không gọi (hẹn lại), tab hiện / có mạng lại thì gọi nhưng chặn dội (≥ min(nhịp, 20 s)
// kể từ lần bắt đầu trước); (3) KHÔNG GỌI CHỒNG — lần trước chưa xong thì không gọi lần nữa (`setInterval` trần không đợi, một lệnh chậm 20 s dồn ba lượt); (4) LỖI / hết giờ ⇒ LÙI DẦN theo BẢNG LÙI (mặc định
// 30 → 60 → 120 s; Theo dõi ca của thầy đang coi ca thi thật chỉ 30 → 40 s — Boss 21/09), không bao giờ NHANH hơn nhịp thường, thành công thì về nhịp thường. Đó chính là `batNhipBenVung` của app học sinh (src/lib/nhip-ben-vung.ts) — ở đây chỉ bọc cho React + đặt bảng nhịp thầy.
// (5) MÁY CHỦ ĐỀ NGHỊ GIÃN (`nhipDeNghi`, header `x-nhip-de-nghi` — src/lib/nhip-de-nghi.ts của Code 2, hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md): nhịp gốc × hệ số 1|2|4 (MAX 3 phản hồi gần nhất) rồi kẹp TRẦN RIÊNG
// từng vòng (`TUY_CHON_NHIP_THAY`) — `batNhipBenVung` tự áp; ở đây chỉ đặt hệ số tối đa + trần để vòng đang coi ca thi không bị giãn quá.
// Vòng của thầy chỉ có 1–3 máy nên KHÔNG lệch ngẫu nhiên (nhịp đều, dễ soát); người gọi báo LỖI bằng cách trả `false` hoặc ném lỗi (mọi giá trị khác = tốt).
import { useEffect, useRef } from 'react'
import { batNhipBenVung, CHAN_DOI_MS } from './nhip-ben-vung'

/** PHÒNG CHỜ (thầy 28/09: "tự đồng bộ hs vào phòng chờ sau 5 giây"): Theo dõi ca khi ca còn ở phòng chờ + màn Chiếu mã. CHỈ chạy khi thầy đang
 *  nhìn phòng chờ (chưa bấm Bắt đầu thi / đang chiếu mã), tuỳ chọn `TUY_CHON_NHIP_THAY.phongCho`. Để riêng (không trong BANG_NHIP_THAY — bảng ấy khoá 3 vòng nền thường trực). */
export const NHIP_PHONG_CHO_THAY = 5_000

/** BẢNG NHỊP của app thầy (mili-giây). Thêm vòng tự gọi mới ⇒ thêm dòng ở đây + một dòng trong docs/nhip-app-thay-2109.md. */
export const BANG_NHIP_THAY = {
  /** Màn Hôm nay = Bảng tin sàn: `/gv/bang-tin-song`, số sống. Máy chủ bận / lỗi ⇒ tự lùi 30 s trở đi. */
  bangTinSan: 10_000,
  /** Bảng tin bản 3 (dự phòng của sàn): `/gv/bang-tin`, một lệnh chỉ-đọc cho cả màn. */
  bangTinV3: 60_000,
  /** Theo dõi ca thi: chi tiết ca, CHỈ khi ca còn em đang làm. */
  theoDoiCa: 20_000,
} as const

/** Tuỳ chọn riêng từng vòng: bảng lùi khi lỗi + HỆ SỐ giãn tối đa và TRẦN nhịp khi máy chủ đề nghị giãn (`heSoToiDa`, `tranMs` — xem `nhipSauHeSo` ở src/lib/nhip-de-nghi.ts). */
export interface TuyChonNhipThay {
  luiDanMs?: readonly number[]
  heSoToiDa?: number
  tranMs?: number
  /** MÁY ĐỂ YÊN (12/11 giảm chi phí Cloudflare — máy thầy mở Hôm nay cả ngày): không chạm / gõ / di chuột ≥ `RANH_SAU_MS` ⇒ hỏi theo `tranMs` (trần đã duyệt của vòng);
   *  thầy chạm lại ⇒ hỏi ngay (chặn dội như cũ) rồi về nhịp thường. CHỈ cho vòng bảng tin + chip sức khoẻ — KHÔNG cho vòng coi ca thi. */
  chamKhiRanh?: boolean
}

/** Không thao tác bao lâu thì coi là máy để yên (ms). */
export const RANH_SAU_MS = 3 * 60_000
let lanThaoTac = Date.now()
const nguoiNghe = new Set<() => void>()
let daGanNghe = false
function ganNgheThaoTac(): void {
  if (daGanNghe || typeof window === 'undefined') return
  daGanNghe = true
  const cham = () => {
    const ranh = Date.now() - lanThaoTac >= RANH_SAU_MS
    lanThaoTac = Date.now()
    if (ranh) for (const f of nguoiNghe) f()
  }
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, cham, { passive: true, capture: true })
}
/** Máy thầy đang để yên (không thao tác ≥ RANH_SAU_MS). */
export const mayDeYen = (bay = Date.now()): boolean => bay - lanThaoTac >= RANH_SAU_MS
/** Chỉ để test: đặt mốc thao tác cuối. */
export const datLanThaoTac = (ms: number): void => { lanThaoTac = ms }

/** BẢNG LÙI khi lỗi liên tiếp (mili-giây, giữ ở mức cuối). Mặc định cho Bảng tin sàn + bản 3: 30 → 60 → 120 s (Boss duyệt). */
export const LUI_MAC_DINH_THAY: readonly number[] = [30_000, 60_000, 120_000]
/** THEO DÕI CA: thầy đang coi ca thi thật nên KHÔNG lùi quá 40 s (Boss 21/09) — số cũ đã có dòng "Mất kết nối · số lúc HH:MM"; nút Làm mới tay luôn gọi ngay. */
export const LUI_THEO_DOI_CA_MS: readonly number[] = [30_000, 40_000]
/** NHỊP SỐNG ca (`/ca/nhip`, 3 s): lỗi thì lùi 10 → 20 s — vẫn nhanh hơn vòng tải đầy 20 s, không dội máy chủ đang hỏng. */
export const LUI_SONG_CA_MS: readonly number[] = [10_000, 20_000]

/**
 * Giãn theo `nhipDeNghi` của máy chủ, MỖI VÒNG MỘT TRẦN (Boss: Bảng tin sàn mặc định 10 s, máy chủ bận ⇒ 30 s): sàn 10 s → 20 s (bận) → 30 s (nghẽn); bản 3 60 s → 120 s; Theo dõi ca 20 s → 40 s (KHÔNG quá 40 s —
 * thầy đang coi ca thi thật); chip sức khoẻ 10 s → 20 s. Vòng KHÔNG có trong bảng này = nhịp gốc × tối đa 4 (mặc định của Code 2) — thêm vòng mới thì đặt trần ở đây.
 */
export const TUY_CHON_NHIP_THAY = {
  // chamKhiRanh (12/11): máy để yên ≥ 3 phút ⇒ sàn 30 s · bản 3 120 s · chip 20 s (đúng trần đã duyệt); chạm lại ⇒ hỏi ngay.
  bangTinSan: { heSoToiDa: 4, tranMs: 30_000, chamKhiRanh: true },
  bangTinV3: { heSoToiDa: 2, tranMs: 120_000, chamKhiRanh: true },
  theoDoiCa: { heSoToiDa: 2, tranMs: 40_000, luiDanMs: LUI_THEO_DOI_CA_MS },
  sucKhoeMay: { heSoToiDa: 2, tranMs: 20_000, chamKhiRanh: true },
  /** PHÒNG CHỜ (Theo dõi ca khi chưa bấm Bắt đầu thi + màn Chiếu mã, thầy 28/09): 5 s → máy chủ bận ×2 = 10 s; lỗi lùi 30 → 40 s như Theo dõi ca. */
  phongCho: { heSoToiDa: 2, tranMs: 10_000, luiDanMs: LUI_THEO_DOI_CA_MS },
  /** NHỊP SỐNG của ca đang chạy (thầy 29/09 "thời gian thực"): lệnh NHẸ `/ca/nhip` 3 s/lần (src/lib/nhip-song-ca.ts) → máy chủ bận ×2 = 6 s; lỗi lùi 10 → 20 s
   *  (vòng 20 s tải đầy của Theo dõi ca vẫn chạy song song làm lưới an toàn). */
  songCa: { heSoToiDa: 2, tranMs: 6_000, luiDanMs: LUI_SONG_CA_MS },
} as const satisfies Record<string, TuyChonNhipThay>

/**
 * Bật vòng tự gọi khi `bat` (mặc định bật). `chay()` trả Promise hoặc giá trị thường: `false` / lỗi = LỖI (lùi dần); giá trị khác = tốt. KHÔNG gọi ngay khi bật (người gọi tự nạp lần đầu);
 * đổi `coSoMs` hoặc `bat` ⇒ vòng mới. `o.luiDanMs` = bảng lùi khi lỗi (mặc định `LUI_MAC_DINH_THAY`; truyền HẰNG SỐ), `o.heSoToiDa` / `o.tranMs` = giới hạn khi máy chủ đề nghị giãn (xem `TUY_CHON_NHIP_THAY`). Sự kiện `visibilitychange` / `focus` / `online` chỉ "đánh thức" theo luật chặn dội — không bao giờ gọi chồng.
 */
export function useNhipThay(chay: () => Promise<unknown> | unknown, coSoMs: number, bat = true, o: TuyChonNhipThay = {}): void {
  const luiDanMs = o.luiDanMs ?? LUI_MAC_DINH_THAY
  const { heSoToiDa, tranMs, chamKhiRanh } = o
  const goi = useRef(chay)
  goi.current = chay
  useEffect(() => {
    if (!bat || typeof document === 'undefined') return
    // Máy để yên ⇒ hẹn không sớm hơn trần của vòng (đọc lại MỖI lần hẹn) — qua `datGio` nên lõi nhịp dùng chung (app em / phụ huynh) không thêm byte nào.
    const yen = chamKhiRanh && tranMs && tranMs > coSoMs ? tranMs : 0
    const datGio = yen ? (f: () => void, ms: number) => setTimeout(f, mayDeYen() ? Math.max(ms, yen) : ms) : undefined
    const nhip = batNhipBenVung(() => goi.current(), { coSoMs, lechMs: 0, chanDoiMs: Math.min(CHAN_DOI_MS, coSoMs), chayNgay: false, luiDanMs, heSoToiDa, tranMs, datGio })
    const kich = () => nhip.kich()
    document.addEventListener('visibilitychange', kich)
    window.addEventListener('focus', kich)
    window.addEventListener('online', kich)
    if (yen) { ganNgheThaoTac(); nguoiNghe.add(kich) }
    return () => {
      nhip.dung()
      nguoiNghe.delete(kich)
      document.removeEventListener('visibilitychange', kich)
      window.removeEventListener('focus', kich)
      window.removeEventListener('online', kich)
    }
  }, [coSoMs, bat, luiDanMs, heSoToiDa, tranMs, chamKhiRanh])
}
