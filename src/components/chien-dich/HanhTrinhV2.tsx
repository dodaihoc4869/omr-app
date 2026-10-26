// BẢN DUYỆT V2 · MÀN 14 — "HÀNH TRÌNH GIỎI HÓA" của thầy (chế độ Game Hóa 2.0).
// LỊCH SỬ: 09/10 bản vẽ tối giản (bốn thẻ + ba thẻ khối) → 09/10 tối "chỉ cần giữ lại phần dạy học" → 12/10 HAI MỤC dạng nút lớn ("Dạy học & đầu
// giờ" · "Chữa bài").
// 21/10 — THẦY (bản vẽ docs/ban-ve-hanh-trinh-2110 đã duyệt, "ok build đi"): "bỏ thẻ dạy học và đầu giờ và thẻ chữa bài đi, phần này sẽ theo tiến
// trình từ trên xuống dưới, 1 điểm danh, 2 là gọi lên bảng đầu giờ, 3 dạy học, 4 chữa câu khó và tính toán" ⇒ KHÔNG còn mục / thẻ: MỘT trang 4 bước
// (`TheBaiDaDay`). Bước 2–4 độc lập, cùng dùng danh sách có mặt của bước 1. Tick bài vừa dạy rời Hành trình ⇒ hộp "Bổ sung bài hôm nay"
// (`HopBoSungBai`, mở ở màn Hôm nay). KHOÁ CŨ không gãy (`buocHanhTrinh` ngay dưới): `can-chua` / `chua-bai` ⇒ mở bước 4; `dau-gio` ⇒ bước 2;
// khoá khác ⇒ bước theo điểm danh; `boSungBai` (lối cũ) ⇒ mở hộp Bổ sung bài ngay trên màn này.
import { lazy, Suspense, useEffect, useState } from 'react'
import type { BaiCay } from '../../lib/bai-hom-nay'
import type { TheHanhTrinh } from '../../lib/so-dem-gv'
import './gv-v2.css'

// Phép tính nhịp (khối, bốn chỉ số) ở `nhip-hanh-trinh.ts` (màn Hôm nay dùng) — xuất lại ở đây cho mọi lối nhập cũ.
export { chiSoNhip, khoiCuaHanhTrinh, type EmNhip } from './nhip-hanh-trinh'

// Trang 4 bước và hộp Bổ sung bài là mảnh riêng, chỉ tải khi cần.
const TheBaiDaDay = lazy(() => import('./TheBaiDaDay'))
const HopBoSungBai = lazy(() => import('../day-hoc/HopBoSungBai'))
/** Kiểm tra ôn tập (cuối trang, nạp trong `TheBaiDaDay`): bắt đầu tải mảnh NGAY khi màn mở, song song với mảnh trang — như trước khi có trang
 *  4 bước (không phải chờ mảnh trang về mới tải); `lazy()` bên trong lấy lại từ bộ nhớ mô-đun. */
const napKiemTraOnTap = () => import('./BangKiemTraCaNhan')

/** 21/10 — Hành trình thành MỘT trang 4 bước (bản vẽ docs/ban-ve-hanh-trinh-2110; đặt ở mảnh nạp lười này, không ở so-dem-gv.ts nạp sẵn — app thầy mở nhẹ hơn): khoá thẻ ⇒ bước mở sẵn. `chua-bai` / `can-chua` ⇒ 4 (Chữa câu khó
 *  & tính toán); `dau-gio` ⇒ 2 (Gọi lên bảng đầu giờ); khoá khác ⇒ null (màn tự chọn bước theo điểm danh — `buocMacDinh`). */
export function buocHanhTrinh(k: TheHanhTrinh | string | null | undefined): 2 | 4 | null {
  if (k === 'chua-bai' || k === 'can-chua') return 4
  return k === 'dau-gio' ? 2 : null
}

/** Chương của khối: số bài + số câu (cộng `soCau` các bài trong cây DẠY HỌC). Màn không còn vẽ thẻ chương — giữ hàm thuần cho lối nhập cũ. */
export function chuongCuaKhoi(bai: readonly BaiCay[]): { chuong: string; soBai: number; soCau: number }[] {
  const ra = new Map<string, { chuong: string; soBai: number; soCau: number }>()
  for (const b of bai) {
    const c = ra.get(b.chuong) ?? { chuong: b.chuong, soBai: 0, soCau: 0 }
    c.soBai += 1
    c.soCau += b.soCau
    ra.set(b.chuong, c)
  }
  return [...ra.values()]
}

/** Chờ mảnh trang: khung xương đúng hình thước + hai khối bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongTrang() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang mở Hành trình">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 72, borderRadius: 18 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 160, borderRadius: 24 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 72, borderRadius: 24 }} />
    </div>
  )
}

/** Màn Hành trình. `theDau` = khoá lối vào (mới hoặc cũ) ⇒ bước mở sẵn. `boSungBai` = lối cũ "Bổ sung bài" ⇒ mở hộp Bổ sung bài hôm nay.
 *  `khoiDau` giữ cho lối gọi cũ (khối của thẻ Nhịp học — thẻ ấy nay ở màn Hôm nay). */
export default function HanhTrinhV2({ theDau = 'day-hoc', boSungBai = false, khoiDau = null }: { theDau?: TheHanhTrinh; boSungBai?: boolean; khoiDau?: number | null }) {
  void khoiDau
  const [buocDau] = useState(() => buocHanhTrinh(theDau))
  const [moHop, setMoHop] = useState(boSungBai)
  useEffect(() => {
    void napKiemTraOnTap().catch(() => {})
  }, [])

  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <h1 className="gvv2-h1">Hành trình giỏi Hóa</h1>
          <p className="gvv2-phu">Điểm danh trước — bước 2, 3, 4 dùng chung danh sách có mặt, thầy mở bước nào tuỳ việc.</p>
        </div>
      </header>

      <Suspense fallback={<XuongTrang />}>
        <TheBaiDaDay buocDau={buocDau} />
      </Suspense>

      {moHop && (
        <Suspense fallback={null}>
          <HopBoSungBai onDong={() => setMoHop(false)} />
        </Suspense>
      )}
    </div>
  )
}
