// HIỆU ỨNG EXP THEO TỪNG CÂU ĐÚNG (luật v4 "nạp tự do" 29/09 sáng; v5 29/09 chiều: không trần ngày, chờ ngày đạt). Luật hiện ở `src/lib/hieu-ung-exp-cau.ts`; số do máy chủ trả.
//   · <SoExpCau>: "+N EXP" hiện cạnh câu đúng rồi BAY theo đường cong vào ẢNH THẦN THÚ trên màn (`bay-exp.ts`, ~700 ms, kèm đốm sáng); tới nơi thú loé sáng, thanh EXP nhích.
//     Máy yếu: bay thẳng, không đốm. Xin giảm chuyển động: không bay (số đứng tại chỗ). Không có ảnh thú trên màn ⇒ như cũ (số nổi tại chỗ).
//   · <ThanhExpNho>: thần thú cấp mấy + thanh EXP nhích tới số mới (đợi số bay tới nơi); lên cấp ⇒ nhãn "Lên cấp N!" ngắn; thanh đầy chờ ngày đạt ⇒ nói rõ còn mấy ngày.
import { useEffect, useRef, useState } from 'react'
import { dangCheDoMayYeu } from '../../lib/may-yeu'
import { cheDoHieuUng, chuChoMocNgan, chuChoNgayNgan, chuExpCau, chuLenCap, chuThanhThu, tiLeThanh, type AnhThuNhan, type CheDoHieuUng } from '../../lib/hieu-ung-exp-cau'
import { SU_KIEN_TOI, THOI_GIAN_BAY_MS, bayVaoThu } from './bay-exp'
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
 *   · 'noi' — trong cảnh trận (đặt tuyệt đối, cha phải có position);
 *   · 'dong' — nằm trong dòng kết quả.
 * Có ảnh thần thú (hoặc thanh EXP) trên màn và không xin giảm chuyển động ⇒ số BAY vào đó (`bay-exp.ts`); `lenCap` ⇒ vòng sáng lên cấp khi tới nơi. `dich` = danh sách chọn đích riêng;
 * `tu` = danh sách chọn điểm xuất phát (nút chốt / nút kế tiếp), vắng ⇒ bay từ chỗ số.
 */
export function SoExpCau({ exp, cheDo, vaoThu, lenCap, dich, tu }: { exp: number; cheDo: CheDoHieuUng; vaoThu?: 'noi' | 'dong'; lenCap?: boolean; dich?: readonly string[]; tu?: readonly string[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [bay, setBay] = useState<'cho' | 'dang' | 'xong' | 'khong'>('cho')
  useEffect(() => {
    if (!(exp > 0) || !ref.current) return
    let huy: (() => void) | null = null
    try {
      huy = bayVaoThu(ref.current, chuExpCau(exp), cheDo, { exp, lenCap, dich, tu, xong: () => setBay('xong') })
    } catch {
      huy = null
    }
    setBay(huy ? 'dang' : 'khong')
    return () => { huy?.() }
  }, [exp, cheDo, lenCap, dich, tu])
  if (!(exp > 0)) return null
  return (
    <span ref={ref} className="exp-cau-so" data-che-do={cheDo} data-vao-thu={vaoThu} data-bay={bay === 'dang' || bay === 'xong' ? bay : undefined} data-vung="exp-cau" role="status">
      {chuExpCau(exp)}
      {cheDo === 'day-du' && bay !== 'dang' && bay !== 'xong' && (
        <>
          <i className="exp-cau-hat" aria-hidden="true" />
          <i className="exp-cau-hat" aria-hidden="true" />
          <i className="exp-cau-hat" aria-hidden="true" />
        </>
      )}
    </span>
  )
}

/** Thanh EXP nhỏ của thần thú sau lượt nộp. `truoc` = ảnh trước (nếu có) để thanh bắt đầu nhích từ số cũ; thanh nhích khi số bay tới nơi (tối đa sau ~0,9 giây). */
export function ThanhExpNho({ thu, truoc, cheDo }: { thu: AnhThuNhan; truoc?: AnhThuNhan | null; cheDo: CheDoHieuUng }) {
  const dich = tiLeThanh(thu)
  const batDau = cheDo === 'tinh' || !truoc || truoc.cap !== thu.cap ? dich : tiLeThanh(truoc)
  const [rong, setRong] = useState(batDau)
  useEffect(() => {
    if (rong === dich) return
    let xong = false
    const di = () => { if (!xong) { xong = true; setRong(dich) } }
    const nghe = () => di()
    try { window.addEventListener(SU_KIEN_TOI, nghe) } catch { /* không có window */ }
    const hen = setTimeout(di, THOI_GIAN_BAY_MS + 200)
    return () => { xong = true; clearTimeout(hen); try { window.removeEventListener(SU_KIEN_TOI, nghe) } catch { /* không có window */ } }
  }, [dich, rong])
  return (
    <div className="exp-thanh-nho" data-che-do={cheDo} data-vung="thanh-exp-nho">
      <div className="exp-thanh-nho-dong">
        <span>{chuThanhThu(thu)}</span>
        {thu.soCapLen > 0 && <span className="exp-len-cap" role="status">{chuLenCap(thu.cap)}</span>}
      </div>
      <div className="exp-thanh-nho-ray" role="progressbar" aria-label="EXP của thần thú" aria-valuemin={0} aria-valuemax={Math.max(1, thu.thanh)} aria-valuenow={Math.min(thu.exp, Math.max(1, thu.thanh))}>
        <i style={{ transform: `scaleX(${Math.round(rong * 1000) / 1000})` }} data-ti-le={Math.round(rong * 100)} />
      </div>
      {(thu.choNgay ?? 0) > 0 && <p className="exp-thanh-nho-dong" data-vung="cho-ngay">{chuChoNgayNgan(thu)}</p>}
      {thu.choMoc > 0 && <p className="exp-thanh-nho-dong">{chuChoMocNgan(thu.choMoc)}</p>}
    </div>
  )
}
