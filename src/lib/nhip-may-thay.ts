// NHỊP TỰ GỌI MÁY CHỦ CỦA APP THẦY (Code 4, 21/09/2026 — kế hoạch KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md, mục Code 4 (3)). Sau sự cố D1 20:30: D1 chỉ MỘT luồng, mọi vòng tự hỏi nền của mọi máy đè lên nhau.
// LUẬT cho MỌI vòng tự gọi máy chủ ở app thầy (`/`, `/gv`): (1) nhịp lấy từ BẢNG dưới đây (một nơi, có lý do); (2) TAB ẩn thì không gọi (hẹn lại), tab hiện / có mạng lại thì gọi nhưng chặn dội (≥ min(nhịp, 20 s)
// kể từ lần bắt đầu trước); (3) KHÔNG GỌI CHỒNG — lần trước chưa xong thì không gọi lần nữa (`setInterval` trần không đợi, một lệnh chậm 20 s dồn ba lượt); (4) LỖI / hết giờ ⇒ LÙI DẦN theo BẢNG LÙI (mặc định
// 30 → 60 → 120 s; Theo dõi ca của thầy đang coi ca thi thật chỉ 30 → 40 s — Boss 21/09), không bao giờ NHANH hơn nhịp thường, thành công thì về nhịp thường. Đó chính là `batNhipBenVung` của app học sinh (src/lib/nhip-ben-vung.ts) — ở đây chỉ bọc cho React + đặt bảng nhịp thầy.
// (5) MÁY CHỦ ĐỀ NGHỊ GIÃN (`nhipDeNghi`, header `x-nhip-de-nghi` — src/lib/nhip-de-nghi.ts của Code 2, hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md): nhịp gốc × hệ số 1|2|4 (MAX 3 phản hồi gần nhất) rồi kẹp TRẦN RIÊNG
// từng vòng (`TUY_CHON_NHIP_THAY`) — `batNhipBenVung` tự áp; ở đây chỉ đặt hệ số tối đa + trần để vòng đang coi ca thi không bị giãn quá.
// Vòng của thầy chỉ có 1–3 máy nên KHÔNG lệch ngẫu nhiên (nhịp đều, dễ soát); người gọi báo LỖI bằng cách trả `false` hoặc ném lỗi (mọi giá trị khác = tốt).
import { useEffect, useRef } from 'react'
import { batNhipBenVung, CHAN_DOI_MS } from './nhip-ben-vung'

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
}

/** BẢNG LÙI khi lỗi liên tiếp (mili-giây, giữ ở mức cuối). Mặc định cho Bảng tin sàn + bản 3: 30 → 60 → 120 s (Boss duyệt). */
export const LUI_MAC_DINH_THAY: readonly number[] = [30_000, 60_000, 120_000]
/** THEO DÕI CA: thầy đang coi ca thi thật nên KHÔNG lùi quá 40 s (Boss 21/09) — số cũ đã có dòng "Mất kết nối · số lúc HH:MM"; nút Làm mới tay luôn gọi ngay. */
export const LUI_THEO_DOI_CA_MS: readonly number[] = [30_000, 40_000]

/**
 * Giãn theo `nhipDeNghi` của máy chủ, MỖI VÒNG MỘT TRẦN (Boss: Bảng tin sàn mặc định 10 s, máy chủ bận ⇒ 30 s): sàn 10 s → 20 s (bận) → 30 s (nghẽn); bản 3 60 s → 120 s; Theo dõi ca 20 s → 40 s (KHÔNG quá 40 s —
 * thầy đang coi ca thi thật); chip sức khoẻ 10 s → 20 s. Vòng KHÔNG có trong bảng này = nhịp gốc × tối đa 4 (mặc định của Code 2) — thêm vòng mới thì đặt trần ở đây.
 */
export const TUY_CHON_NHIP_THAY = {
  bangTinSan: { heSoToiDa: 4, tranMs: 30_000 },
  bangTinV3: { heSoToiDa: 2, tranMs: 120_000 },
  theoDoiCa: { heSoToiDa: 2, tranMs: 40_000, luiDanMs: LUI_THEO_DOI_CA_MS },
  sucKhoeMay: { heSoToiDa: 2, tranMs: 20_000 },
} as const satisfies Record<string, TuyChonNhipThay>

/**
 * Bật vòng tự gọi khi `bat` (mặc định bật). `chay()` trả Promise hoặc giá trị thường: `false` / lỗi = LỖI (lùi dần); giá trị khác = tốt. KHÔNG gọi ngay khi bật (người gọi tự nạp lần đầu);
 * đổi `coSoMs` hoặc `bat` ⇒ vòng mới. `o.luiDanMs` = bảng lùi khi lỗi (mặc định `LUI_MAC_DINH_THAY`; truyền HẰNG SỐ), `o.heSoToiDa` / `o.tranMs` = giới hạn khi máy chủ đề nghị giãn (xem `TUY_CHON_NHIP_THAY`). Sự kiện `visibilitychange` / `focus` / `online` chỉ "đánh thức" theo luật chặn dội — không bao giờ gọi chồng.
 */
export function useNhipThay(chay: () => Promise<unknown> | unknown, coSoMs: number, bat = true, o: TuyChonNhipThay = {}): void {
  const luiDanMs = o.luiDanMs ?? LUI_MAC_DINH_THAY
  const { heSoToiDa, tranMs } = o
  const goi = useRef(chay)
  goi.current = chay
  useEffect(() => {
    if (!bat || typeof document === 'undefined') return
    const nhip = batNhipBenVung(() => goi.current(), { coSoMs, lechMs: 0, chanDoiMs: Math.min(CHAN_DOI_MS, coSoMs), chayNgay: false, luiDanMs, heSoToiDa, tranMs })
    const kich = () => nhip.kich()
    document.addEventListener('visibilitychange', kich)
    window.addEventListener('focus', kich)
    window.addEventListener('online', kich)
    return () => {
      nhip.dung()
      document.removeEventListener('visibilitychange', kich)
      window.removeEventListener('focus', kich)
      window.removeEventListener('online', kich)
    }
  }, [coSoMs, bat, luiDanMs, heSoToiDa, tranMs])
}
