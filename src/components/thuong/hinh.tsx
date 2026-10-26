// HÌNH VẼ THƯỞNG PHẠT (bản vẽ thầy chốt 26/10: ve-moi/tp.js) — vẽ lại bằng SVG nội tuyến, KHÔNG màu thô: mọi màu là lớp CSS / biến --tp-* khai ở
// styles/trong-thuong-gon.css (ánh xạ từ --tr-* của app học sinh «Trong»). Đơn vị: nguyên tử ⚛ · tinh thể ◆ lục giác tím · ngọn lửa chuỗi ngày.
// Huy hiệu kim loại giải tuần mang kí hiệu hoá học (Fe · Cu · Ag · Au · Pt · kim cương = C). Mọi hình aria-hidden trừ huy hiệu (có tên).
import { useId, type ReactNode } from 'react'

const uid = (s: string) => 'tp' + s.replace(/[^a-zA-Z0-9_-]/g, '')

export function IcNguyenTu({ className = '' }: { className?: string }) {
  return <svg className={`tp-dv tp-dv-nt ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <ellipse cx="12" cy="12" rx="10.2" ry="4.1" /><ellipse cx="12" cy="12" rx="10.2" ry="4.1" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10.2" ry="4.1" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="2.7" />
  </svg>
}
export function IcTinhThe({ className = '' }: { className?: string }) {
  return <svg className={`tp-dv tp-dv-tt ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path className="a" d="M12 1.6 21.2 6.9v10.2L12 22.4l-9.2-5.3V6.9z" /><path className="b" d="M12 1.6 21.2 6.9 12 11.7 2.8 6.9z" />
    <path className="c" d="M12 11.7v10.7l9.2-5.3V6.9z" /><path className="d" d="M7.4 6.4 9.6 5.1l1 .6-2.2 1.3z" />
  </svg>
}
export function IcLua({ tat, className = '' }: { tat?: boolean; className?: string }) {
  return <svg className={`tp-dv tp-dv-lua${tat ? ' tat' : ''} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path className="a" d="M12 1.5c1 3.6 5.8 6 5.8 12a5.8 5.8 0 0 1-11.6 0c0-2.7 1.3-4.4 2.6-5.6.2 1.6.9 2.6 1.9 3C10.3 7.6 10.6 4.6 12 1.5z" />
    <path className="b" d="M12 10.5c.6 2 3.1 3.1 3.1 6a3.1 3.1 0 0 1-6.2 0c0-1.4.7-2.3 1.4-2.9.1.8.5 1.3 1 1.5-.2-1.6 0-3.2.7-4.6z" />
    <path className="c" d="M8.4 13.2c-.4 1-.5 2-.3 2.9" fill="none" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
}

export type HangGiai = 'sat' | 'dong' | 'bac' | 'vang' | 'bachkim' | 'kimcuong'
export const HANG: readonly HangGiai[] = ['sat', 'dong', 'bac', 'vang', 'bachkim', 'kimcuong']
export const TEN_HANG: Record<HangGiai, string> = { sat: 'Sắt', dong: 'Đồng', bac: 'Bạc', vang: 'Vàng', bachkim: 'Bạch kim', kimcuong: 'Kim cương' }
const KI_HIEU: Record<HangGiai, string> = { sat: 'Fe', dong: 'Cu', bac: 'Ag', vang: 'Au', bachkim: 'Pt', kimcuong: 'C' }

/** Huy hiệu kim loại lục giác (giải tuần). `khoa` = chưa đạt (xám mờ). */
export function HuyHieuKimLoai({ hang, khoa, className = '', an }: { hang: HangGiai; khoa?: boolean; className?: string; an?: boolean }) {
  const id = uid(useId())
  const kc = hang === 'kimcuong'
  return <span className={`tp-hh tp-kl-${hang}${khoa ? ' khoa' : ''} ${className}`}>
    <svg viewBox="0 0 100 100" role={an ? undefined : 'img'} aria-hidden={an ? 'true' : undefined} aria-label={an ? undefined : `Huy hiệu ${TEN_HANG[hang]}`} focusable="false">
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="tp-kl-g1" /><stop offset="1" className="tp-kl-g2" /></linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="tp-g-trang" stopOpacity=".75" /><stop offset="1" className="tp-g-trang" stopOpacity=".05" /></linearGradient>
      </defs>
      <path d="M50 3 92 27v46L50 97 8 73V27z" fill={`url(#${id}a)`} className="tp-kl-vien" strokeWidth="3" />
      <path d="M50 3 92 27 50 50 8 27z" className="tp-f-trang" opacity=".28" /><path d="M50 50v47l42-24V27z" className="tp-f-den" opacity=".12" />
      <path d="M50 17 79 33.5v33L50 83 21 66.5v-33z" fill={`url(#${id}b)`} className="tp-s-trang" strokeOpacity=".7" strokeWidth="2.5" />
      {kc ? <><path d="M38 40h24l8 9-20 22-20-22z" className="tp-f-trang" opacity=".95" />
        <path d="M38 40l12 31 12-31M30 49h40" fill="none" className="tp-kl-vien" strokeWidth="2.4" strokeLinejoin="round" /></>
        : <text x="50" y="61" textAnchor="middle" className="tp-kl-chu" fontWeight="900" fontSize="30" strokeWidth="5" paintOrder="stroke">{KI_HIEU[hang]}</text>}
      <path d="M24 26l8-4.6" className="tp-s-trang" strokeWidth="4" strokeLinecap="round" opacity=".8" />
    </svg>
  </span>
}

export type MauHuyHieu = 'sao' | 'lua' | 'tt' | 'tin' | 'dung'
/** Huy hiệu chung (chuỗi, hoàn hảo, chuỗi đôi…): lục giác màu + số hoặc biểu tượng ở giữa. */
export function HuyHieuMau({ mau, chu, coChu = 34, children, khoa, className = '' }: { mau: MauHuyHieu; chu?: string | number; coChu?: number; children?: ReactNode; khoa?: boolean; className?: string }) {
  const id = uid(useId())
  return <span className={`tp-hh tp-hm-${mau}${khoa ? ' khoa' : ''} ${className}`}>
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="tp-hm-g1" /><stop offset="1" className="tp-hm-g2" /></linearGradient></defs>
      <path d="M50 3 92 27v46L50 97 8 73V27z" fill={`url(#${id})`} />
      <path d="M50 3 92 27 50 50 8 27z" className="tp-f-trang" opacity=".22" /><path d="M50 50v47l42-24V27z" className="tp-f-den" opacity=".1" />
      <path d="M50 15 81 33v34L50 85 19 67V33z" fill="none" className="tp-s-trang" strokeOpacity=".65" strokeWidth="2.5" strokeDasharray="5 5" />
      {chu !== undefined && <text x="50" y={50 + coChu * 0.36} textAnchor="middle" className="tp-hm-chu" fontWeight="900" fontSize={coChu}>{chu}</text>}
      {children && <g transform="translate(29 29) scale(1.75)" className="tp-hm-ic" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{children}</g>}
    </svg>
  </span>
}
/** Nét biểu tượng 24×24 dùng trong huy hiệu (không phụ thuộc thư viện biểu tượng). */
export const NET: Record<'cup' | 'set' | 'trang' | 'kc', ReactNode> = {
  cup: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>,
  set: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  trang: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  kc: <path d="M6 4h12l3 5-9 11L3 9zM3 9h18M12 20 8 9l4-5 4 5z" />,
}

export type KieuBinh = 'day' | 'trong' | 'khoa' | 'dong'
/** Bình giữ chuỗi: bình cầu nhỏ có nắp, dung dịch xanh băng. dong = nắp vừa đóng. */
export function Binh({ kieu = 'day', className = '' }: { kieu?: KieuBinh; className?: string }) {
  const id = uid(useId())
  const day = kieu === 'day' || kieu === 'dong'
  const than = 'M24 14v12.5A20 20 0 1 0 36 26.5V14z'
  return <span className={`tp-binh tp-binh-${kieu} ${className}`}>
    <svg viewBox="0 0 60 70" aria-hidden="true" focusable="false">
      <defs><clipPath id={id}><path d={than} /></clipPath></defs>
      <path d={than} className="tp-binh-nen" />
      {day && <g clipPath={`url(#${id})`}><path d="M8 36 Q18 31 30 36 T52 36 V70 H8z" className="tp-binh-long" />
        <circle cx="23" cy="50" r="2.4" className="tp-f-trang" opacity=".6" /><circle cx="36" cy="45" r="1.8" className="tp-f-trang" opacity=".6" />
        <path d="M20 41l2.5 2.5M34 52l2 2M30 44l-2 2.4" className="tp-s-trang" strokeWidth="1.6" strokeLinecap="round" opacity=".85" /></g>}
      <path d={than} fill="none" className="tp-binh-vien" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 37a13 13 0 0 1 6-7" className="tp-s-trang" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".9" />
      <g className="tp-binh-nap" transform={kieu === 'trong' ? 'translate(9 -7) rotate(24 30 9)' : undefined}>
        <rect x="21" y="5" width="18" height="10" rx="3.5" className="tp-binh-nap-f" /><rect x="24" y="7" width="7" height="2.4" rx="1.2" className="tp-f-trang" opacity=".55" />
      </g>
      {kieu === 'khoa' && <g transform="translate(30 47)"><rect x="-6" y="-3" width="12" height="9" rx="2" className="tp-f-chu3" />
        <path d="M-3.5 -3v-2.5a3.5 3.5 0 0 1 7 0V-3" fill="none" className="tp-s-chu3" strokeWidth="2" /></g>}
    </svg>
  </span>
}

/** Rương ngày. mo = đã mở (tinh thể lộ ra). */
export function Ruong({ mo, className = '' }: { mo?: boolean; className?: string }) {
  return <span className={`tp-ruong ${className}`}>
    <svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="94" rx="44" ry="5" className="tp-f-den" opacity=".1" />
      <rect x="14" y="44" width="92" height="46" rx="8" className="tp-ruong-than" /><rect x="14" y="44" width="92" height="12" className="tp-ruong-toi" />
      <rect x="14" y="44" width="92" height="46" rx="8" fill="none" className="tp-ruong-vien" strokeWidth="3" />
      <rect x="52" y="44" width="16" height="46" className="tp-ruong-dai" />
      <g className="tp-ruong-trong" opacity={mo ? 1 : 0} transform="translate(60 52)"><path d="M0-26 9-21v10L0-6-9-11v-10z" className="tp-ruong-tt" /><path d="M-20-14-14-17-8-14v6l-6 3-6-3z" className="tp-ruong-tt" opacity=".85" /><path d="M14-18 20-21 26-18v6l-6 3-6-3z" className="tp-ruong-tt" opacity=".85" /></g>
      {!mo && <g transform="translate(60 62)"><rect x="-8" y="-9" width="16" height="16" rx="3" className="tp-f-mat" /><circle cy="-2" r="3" className="tp-ruong-than" /></g>}
      <g className="tp-ruong-nap" transform={mo ? 'translate(0 -14) rotate(-16 14 44)' : undefined}>
        <path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" className="tp-ruong-than" />
        <path d="M14 44V32a14 14 0 0 1 14-14h64a14 14 0 0 1 14 14v12z" fill="none" className="tp-ruong-vien" strokeWidth="3" />
        <rect x="52" y="18" width="16" height="26" className="tp-ruong-dai" /><path d="M26 26h20" className="tp-s-trang" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </g>
    </svg>
  </span>
}

/** Ống nghiệm «mạng» (Thử thách Kim cương). vo = đã vỡ. */
export function OngMang({ vo, className = '' }: { vo?: boolean; className?: string }) {
  return <span className={`tp-o3 ${className}`}>
    {vo ? <svg viewBox="0 0 16 30" aria-hidden="true" focusable="false"><path d="M3 2h10v9l-3 2 2 3-1 2" fill="none" className="tp-s-chu3" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 2v18a5 5 0 0 0 4 4.9" fill="none" className="tp-s-chu3" strokeWidth="2" /><path d="M1 28h14" className="tp-s-sai" strokeWidth="2.5" strokeLinecap="round" opacity=".5" /></svg>
      : <svg viewBox="0 0 16 30" aria-hidden="true" focusable="false"><path d="M3 2v20a5 5 0 0 0 10 0V2z" className="tp-f-mat" /><path d="M3 12h10v10a5 5 0 0 1-10 0z" className="tp-f-kc" />
        <path d="M3 2v20a5 5 0 0 0 10 0V2" fill="none" className="tp-s-chu2" strokeWidth="2" /><path d="M1.5 2h13" className="tp-s-chu2" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="6.5" cy="17" r="1.3" className="tp-f-trang" opacity=".8" /></svg>}
  </span>
}

const MAU_NG = ['dung', 'tin', 'lua', 'sai', 'tt'] as const
/** Phân tử combo (A6): n nguyên tử nối zíc-zắc. */
export function PhanTu({ n }: { n: number }) {
  const so = Math.max(1, Math.min(10, n))
  const p = Array.from({ length: so }, (_, i) => [9 + i * 15, i % 2 ? 23 : 9] as const)
  const rong = 18 + (so - 1) * 15
  return <svg className="tp-phan-tu" viewBox={`0 0 ${rong} 32`} width={rong} height="32" aria-hidden="true" focusable="false">
    {p.slice(1).map((q, i) => <line key={`l${i}`} className="lk" data-i={i + 1} x1={p[i]![0]} y1={p[i]![1]} x2={q[0]} y2={q[1]} />)}
    {p.map((q, i) => <circle key={`n${i}`} className={`ng tp-ng-${MAU_NG[i % 5]}`} data-i={i} cx={q[0]} cy={q[1]} r="6.5" />)}
  </svg>
}

/** Vòng tia sáng xoay sau hình chính. */
export function Tia({ className = '' }: { className?: string }) {
  return <span className={`tp-tia ${className}`} aria-hidden="true">
    <svg viewBox="-100 -100 200 200" focusable="false">{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 0 L-9 -100 L9 -100Z" transform={`rotate(${i * 30})`} />)}</svg>
  </span>
}
