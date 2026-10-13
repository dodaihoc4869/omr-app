// CHIP BẬC — 12 bậc từ Lười đến Chăm (thầy 13/10). Dùng chung 3 app: huy hiệu + "Bậc N/12 · Tên", màu riêng từng bậc (bac-cham-chi.css).
//   · Bản thường: chữ đầy đủ (trình đọc màn hình đọc đúng chữ ấy; huy hiệu ẩn khỏi cây truy cập). Chỉ để nhìn — chip BẤM ĐƯỢC (mở tấm 12 bậc) là NutBac.
//   · Bản `nho` (dòng em ở Nhịp học của thầy, tờ chiếu điểm danh): chỉ huy hiệu + số bậc; tên đầy đủ trong title + aria-label.
// 13/10 đợt 19: emoji ⇒ huy hiệu vẽ riêng (HuyHieuBac — mịn, giống nhau trên mọi máy). Huy hiệu mang lớp `bcc-bt` ⇒ cỡ theo cỡ chữ của chỗ dùng
// (tờ chiếu phóng to `.bcc-bt` là huy hiệu to theo, không sửa tệp tờ chiếu). Số bậc không hợp lệ ⇒ không vẽ gì (không bịa).
// NutBac — CHIP BẤM ĐƯỢC (đợt 19, thầy: "chỗ bấm vào bậc này cho hiện đủ 12 bậc để học sinh biết rõ bao nhiêu bậc"): Hôm nay của em, Nhịp học của con,
// đầu tấm Hồ sơ làm bài — chip "huy hiệu + Bậc N/12 · Tên" là MỘT nút (đích chạm ≥ 44 px) ⇒ tấm "12 bậc từ Lười đến Chăm" (TamMuoiHaiBac). Tấm NẠP
// KHI BẤM (nạp sẵn khi trỏ / chạm xuống / tiêu điểm vào nút ⇒ bấm là hiện ngay); không thêm lệnh máy chủ — dùng `bacCham` đã có. Đóng tấm ⇒ tiêu điểm
// về nút. Chip nằm trong `.m3` (app phụ huynh) ⇒ tấm mặc cùng bảng màu ấy. Cùng tệp với ChipBac ⇒ cùng khối nạp, không thêm một tệp tải.
import { lazy, Suspense, useState } from 'react'
import type { KetQuaBac } from '../../lib/bac-cham-chi'
import { chuBac, motBac, type XungBac } from './bac'
import HuyHieuBac from './HuyHieuBac'
import './bac-cham-chi.css'

export default function ChipBac({ bac, nho = false }: { bac: number; nho?: boolean }) {
  const b = motBac(bac)
  if (!b) return null
  const chu = chuBac(b)
  if (nho)
    return (
      <span className="bcc bcc-chip" data-bac={b.so} data-nho="" role="img" aria-label={chu} title={chu}>
        <HuyHieuBac bac={b.so} co={18} className="bcc-bt" />
        {b.so}
      </span>
    )
  return (
    <span className="bcc bcc-chip" data-bac={b.so}>
      <HuyHieuBac bac={b.so} co={24} className="bcc-bt" />
      {chu}
    </span>
  )
}

const napTam = () => import('./TamMuoiHaiBac')
const TamMuoiHaiBac = lazy(napTam)

export function NutBac({ kq, xung = 'em' }: { kq: KetQuaBac; xung?: XungBac }) {
  const [mo, setMo] = useState<{ lopBoc?: string; traVe: HTMLButtonElement } | null>(null)
  const b = motBac(kq.bac)
  if (!b) return null
  const nap = () => void napTam().catch(() => {})
  return (
    <>
      <button
        type="button"
        className="bcc bcc-chip bcc-nut"
        data-bac={b.so}
        aria-haspopup="dialog"
        aria-expanded={!!mo}
        onPointerEnter={nap}
        onPointerDown={nap}
        onFocus={nap}
        onClick={(ev) => setMo({ lopBoc: ev.currentTarget.closest('.m3') ? 'm3' : undefined, traVe: ev.currentTarget })}
      >
        <HuyHieuBac bac={b.so} co={28} />
        <span className="bcc-nut-chu">{chuBac(b)}</span>
        <span className="sr-only">, xem đủ 12 bậc</span>
        <svg className="bcc-nut-mui" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M6 3.5L10.5 8L6 12.5" />
        </svg>
      </button>
      {mo && (
        <Suspense fallback={null}>
          <TamMuoiHaiBac kq={kq} xung={xung} lopBoc={mo.lopBoc} traVe={mo.traVe} onDong={() => setMo(null)} />
        </Suspense>
      )}
    </>
  )
}
