// KHUNG DUO của màn sửa câu («Trong» HS, thầy 27/10): thanh trên (X · thanh tiến độ) · thân · đáy — lớp duo-* sẵn có (styles/trong-lam-bai.css).
// Tệp NHẸ, nằm trong mảnh ManChuaCauSai (vẽ ngay lúc đang mở câu / báo lỗi); cây trình bày câu (ChuaGonDuo) nạp lười, chỉ khi <html data-trong="hs">.
import { useState, type ReactNode, type Ref } from 'react'
import { X as XIcon } from 'lucide-react'

/** Vị trí câu đang sửa trong chặng của Việc hôm nay (ManTuChua dựng). Vắng ⇒ màn một câu (thanh đầy khi câu khép). */
export interface TienDoSua {
  /** Số thứ tự chặng (từ 1). */
  so: number
  /** Câu đã xong trong chặng, KHÔNG kể câu đang mở. */
  xong: number
  tong: number
  /** Câu này là câu cuối còn lại của chặng ⇒ khép xong thì hiện màn xong chặng. */
  cuoi: boolean
  /** Còn câu chưa xong (ngoài chặng này) trong việc hôm nay ⇒ «Tiếp tục» ở màn xong chặng mở câu kế. */
  conSau: boolean
  /** Chặng của câu kế (từ 1) — câu sửa tiếp theo thứ tự việc hôm nay. */
  changTiep?: number
  /** Cả ngày: câu đã xong (kể cả câu này khi khép) / tổng câu hôm nay. */
  homNay?: { xong: number; tong: number }
}

/** Khung Duo dùng chung của màn sửa câu: thanh trên (X + thanh tiến độ) · thân · đáy. Dùng cả lúc đang mở câu / báo lỗi (ManChuaCauSai). */
// CHẶNG NGANG 01/11 (thầy: máy gập mở / xoay ngang): gốc `data-chang` ⇒ cùng bố cục hai cột cuộn riêng với màn làm chặng (styles/trong-chang-ngang.css);
// `phan` = loại câu (đúng–sai cột trả lời rộng hơn), `ket` = dải kết quả đang hiện (điện thoại ngang: hàng đáy riêng). Dọc không đổi.
export function KhungDuoSua({ onVe, khoaVe, pct, nhanThanh, loe, xong, tt, deDai, children, day, goc, phan, ket }: {
  onVe: () => void; khoaVe?: boolean; pct: number; nhanThanh: string; loe?: boolean; xong?: boolean; tt?: string; deDai?: boolean
  children: ReactNode; day?: ReactNode; goc?: Ref<HTMLDivElement>; phan?: string; ket?: boolean
}) {
  // Vệt sáng lướt xong thì gỡ (thanh đầy 100% ⇒ vệt dừng ngoài mép phải — bị cắt nhưng vẫn tính là tràn khi đo).
  const [hetLoe, setHetLoe] = useState(false)
  return (
    <div ref={goc} className="ht-app ht2-lam duo duo-sua" data-duo="" data-chang="" data-phan={phan} data-ket={!xong && ket ? '' : undefined} data-hai-cot={deDai || undefined} data-xong={xong || undefined} data-tt={tt}>
      {!xong && <header className="duo-tren">
        <button type="button" className="duo-dong" onClick={onVe} disabled={khoaVe} aria-label="Quay lại"><XIcon size={26} aria-hidden="true" /></button>
        <div className="duo-thanh" role="progressbar" aria-label={nhanThanh} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%` }}><b /><b /><b />{loe && !hetLoe && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) && <span className="duo-loe" onAnimationEnd={() => setHetLoe(true)} />}</i></div>
      </header>}
      <main className="duo-than" data-de-dai={deDai || undefined} aria-live={xong ? 'polite' : undefined}>{children}</main>
      {day}
    </div>
  )
}

