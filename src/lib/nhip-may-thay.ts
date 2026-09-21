// NHỊP TỰ GỌI MÁY CHỦ CỦA APP THẦY (Code 4, 21/09/2026 — kế hoạch KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md, mục Code 4 (3)). Sau sự cố D1 20:30: D1 chỉ MỘT luồng, mọi vòng tự hỏi nền của mọi máy đè lên nhau.
// LUẬT cho MỌI vòng tự gọi máy chủ ở app thầy (`/`, `/gv`): (1) nhịp lấy từ BẢNG dưới đây (một nơi, có lý do); (2) TAB ẨN thì không gọi (hẹn lại), tab hiện / có mạng lại thì gọi nhưng chặn dội (≥ min(nhịp, 20 s)
// kể từ lần bắt đầu trước); (3) KHÔNG GỌI CHỒNG — lần trước chưa xong thì không gọi lần nữa (`setInterval` trần không đợi, một lệnh chậm 20 s dồn ba lượt); (4) LỖI / hết giờ ⇒ LÙI DẦN 30 → 60 → 120 s (không
// bao giờ NHANH hơn nhịp thường), thành công thì về nhịp thường. Đó chính là `batNhipBenVung` của app học sinh (src/lib/nhip-ben-vung.ts) — ở đây chỉ bọc cho React + đặt bảng nhịp thầy.
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

/**
 * Bật vòng tự gọi khi `bat` (mặc định bật). `chay()` trả Promise hoặc giá trị thường: `false` / lỗi = LỖI (lùi dần); giá trị khác = tốt. KHÔNG gọi ngay khi bật (người gọi tự nạp lần đầu);
 * đổi `coSoMs` hoặc `bat` ⇒ vòng mới. Sự kiện `visibilitychange` / `focus` / `online` chỉ "đánh thức" theo luật chặn dội — không bao giờ gọi chồng.
 */
export function useNhipThay(chay: () => Promise<unknown> | unknown, coSoMs: number, bat = true): void {
  const goi = useRef(chay)
  goi.current = chay
  useEffect(() => {
    if (!bat || typeof document === 'undefined') return
    const nhip = batNhipBenVung(() => goi.current(), { coSoMs, lechMs: 0, chanDoiMs: Math.min(CHAN_DOI_MS, coSoMs), chayNgay: false })
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
  }, [coSoMs, bat])
}
