// HIỆU ỨNG EXP THEO TỪNG CÂU ĐÚNG (luật v4 "nạp tự do", thầy chốt 29/09/2026). Luật hiện ở `src/lib/hieu-ung-exp-cau.ts`; số do máy chủ trả.
//   · <SoExpCau>: "+N EXP" bay lên cạnh câu đúng (đầy đủ: kèm 3 hạt sáng; máy yếu: không hạt; giảm chuyển động: đứng yên).
//   · <ThanhExpNho>: thần thú cấp mấy + thanh EXP nhích tới số mới; lên cấp ⇒ nhãn "Lên cấp N!" ngắn; đang chờ mốc ⇒ nói rõ EXP được giữ.
import { useEffect, useState } from 'react'
import { NGAY_DAT_MO_CAP_10 } from '../../lib/kinh-te-game'
import { dangCheDoMayYeu } from '../../lib/may-yeu'
import { cheDoHieuUng, chuChoMocNgan, chuExpCau, chuLenCap, chuThanhThu, tiLeThanh, type AnhThuNhan, type CheDoHieuUng } from '../../lib/hieu-ung-exp-cau'
// CSS: `./exp-cau.css` nạp MỘT lần ở src/main.tsx (gói CSS vỏ) — không nhập ở đây để khỏi tách thêm tệp precache.

/** Mức hiệu ứng của máy này (đọc một lần lúc vẽ). */
export function useCheDoHieuUng(): CheDoHieuUng {
  const [cheDo] = useState<CheDoHieuUng>(() => {
    let giam = false
    try {
      giam = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches
    } catch {
      giam = false
    }
    return cheDoHieuUng({ giamChuyenDong: giam, mayYeu: dangCheDoMayYeu() })
  })
  return cheDo
}

/**
 * MỘT thành phần hiệu ứng dùng CHUNG cho bảng nhiệm vụ, BTVN lô và mọi game. `vaoThu`:
 *   · vắng — số nổi lên cạnh câu (mặc định);
 *   · 'noi' — số bay VÀO ảnh thần thú trong cảnh trận (đặt tuyệt đối, cha phải có position);
 *   · 'dong' — nằm trong dòng kết quả cạnh ảnh thú nhỏ, bay sang phía ảnh.
 */
export function SoExpCau({ exp, cheDo, vaoThu }: { exp: number; cheDo: CheDoHieuUng; vaoThu?: 'noi' | 'dong' }) {
  if (!(exp > 0)) return null
  return (
    <span className="exp-cau-so" data-che-do={cheDo} data-vao-thu={vaoThu} data-vung="exp-cau" role="status">
      {chuExpCau(exp)}
      {cheDo === 'day-du' && (
        <>
          <i className="exp-cau-hat" aria-hidden="true" />
          <i className="exp-cau-hat" aria-hidden="true" />
          <i className="exp-cau-hat" aria-hidden="true" />
        </>
      )}
    </span>
  )
}

/** Thanh EXP nhỏ của thần thú sau lượt nộp. `truoc` = ảnh trước (nếu có) để thanh bắt đầu nhích từ số cũ. */
export function ThanhExpNho({ thu, truoc, cheDo }: { thu: AnhThuNhan; truoc?: AnhThuNhan | null; cheDo: CheDoHieuUng }) {
  const dich = tiLeThanh(thu)
  const batDau = cheDo === 'tinh' || !truoc || truoc.cap !== thu.cap ? dich : tiLeThanh(truoc)
  const [rong, setRong] = useState(batDau)
  useEffect(() => {
    if (rong === dich) return
    const id = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => setRong(dich)) : 0
    if (!id) setRong(dich)
    return () => { if (id && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id) }
  }, [dich, rong])
  return (
    <div className="exp-thanh-nho" data-che-do={cheDo} data-vung="thanh-exp-nho">
      <div className="exp-thanh-nho-dong">
        <span>{chuThanhThu(thu)}</span>
        {thu.soCapLen > 0 && <span className="exp-len-cap" role="status">{chuLenCap(thu.cap)}</span>}
      </div>
      <div className="exp-thanh-nho-ray" role="progressbar" aria-label="EXP của thần thú" aria-valuemin={0} aria-valuemax={Math.max(1, thu.thanh)} aria-valuenow={Math.min(thu.exp, Math.max(1, thu.thanh))}>
        <i style={{ width: `${Math.round(rong * 100)}%` }} />
      </div>
      {thu.choMoc > 0 && <p className="exp-thanh-nho-dong">{chuChoMocNgan(thu.choMoc, NGAY_DAT_MO_CAP_10)}</p>}
    </div>
  )
}
