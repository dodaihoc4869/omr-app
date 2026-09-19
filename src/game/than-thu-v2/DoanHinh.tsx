// ĐOÀN HỘ TỐNG — hình vẽ dùng chung: thần thú THẬT (cắt từ atlas tiến hoá), tia chiêu thức THẬT, quái/trùm/Linh Tâm vẽ bằng SVG trong mã
// (giả định đã chốt: khi thầy có ảnh quái thật thì thay ở đây, không đụng màn nào).
import { useId } from 'react'
import type { CSSProperties } from 'react'
import { evolutionCrop, evolutionMirror } from './evolution'
import { BATTLE_SKINS } from './learning-battle'

/** Một ô thần thú trong suốt, đúng hình thái theo cấp. `quayTrai` = nhìn sang trái (đứng bên phải sân). */
export function ThuHinh({ pet, cap, size, quayTrai = false, className = '', style }: { pet: number; cap: number; size?: number; quayTrai?: boolean; className?: string; style?: CSSProperties }) {
  const crop = evolutionCrop(pet, cap), clip = useId(), lat = evolutionMirror(pet, cap) !== quayTrai
  const skin = BATTLE_SKINS[pet] ?? BATTLE_SKINS[0]
  return (
    <div className={`dh-thu ${className}`} style={{ ...(size ? { width: size, height: size } : null), '--dh-thu-mau': skin.color, ...style } as CSSProperties} aria-hidden="true">
      <div className="dh-thu-bong" />
      <svg viewBox={`0 0 ${crop.width} ${crop.height}`} style={{ transform: lat ? 'scaleX(-1)' : undefined }}>
        <defs><clipPath id={clip}><rect width={crop.width} height={crop.height} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}><image href={`/than-thu-v2/evolution-${crop.atlas}-cutout.png`} x={-crop.x} y={-crop.y} width="1536" height="1024" /></g>
      </svg>
    </div>
  )
}

const MAU_QUAI: Record<string, [string, string, string, string]> = {
  bun_acid: ['#e6ff7a', '#86bd2f', '#355c12', '#16210a'],
  khoi_oxi_hoa: ['#f1e6ff', '#9a86c9', '#3c2f66', '#1a1233'],
  tinh_the_ket_tua: ['#d8f6ff', '#5fb6e8', '#1d4f8a', '#0a1d3a'],
}
/** Tạp Chất: ba loại cùng dáng, khác màu — đổi màu theo `loai` của lõi. */
export function QuaiHinh({ loai, size, className = '' }: { loai: string; size: number; className?: string }) {
  const id = useId(), [sang, giua, toi, net] = MAU_QUAI[loai] ?? MAU_QUAI.bun_acid!
  return (
    <svg className={className} viewBox="0 0 120 100" width={size} height={Math.round(size * 100 / 120)} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs><radialGradient id={id} cx="38%" cy="28%"><stop offset="0" stopColor={sang} /><stop offset=".55" stopColor={giua} /><stop offset="1" stopColor={toi} /></radialGradient></defs>
      <ellipse cx="60" cy="93" rx="46" ry="6" fill="rgba(0,0,0,.4)" />
      <path d="M14 84 C4 48 28 12 60 12 C94 12 116 48 106 84 C100 97 20 97 14 84Z" fill={`url(#${id})`} />
      <path d="M22 86 q4 12 9 0 M84 88 q5 14 10 0" fill={giua} />
      <path d="M30 38 C36 26 46 21 56 21" stroke="rgba(255,255,255,.6)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M32 44 L54 52 M88 44 L66 52" stroke={net} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="45" cy="60" rx="8" ry="9" fill="#fff" /><ellipse cx="75" cy="60" rx="8" ry="9" fill="#fff" />
      <circle cx="47" cy="62" r="4.2" fill={net} /><circle cx="73" cy="62" r="4.2" fill={net} />
      <path d="M46 80 Q60 70 74 80" stroke={net} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

const MAU_TRUM: Record<string, [string, string, string, string]> = {
  chua_te_ket_tua: ['#d9c8ff', '#7a4fe0', '#23104f', '#7fe9ff'],
  ba_chu_an_mon: ['#ffe2c2', '#e0702a', '#4f1a08', '#fff36b'],
  lanh_chua_khoi_doc: ['#d6ffe9', '#2fae7a', '#08391f', '#e6ff7a'],
}
export function TrumHinh({ loai, size, className = '' }: { loai: string; size: number; className?: string }) {
  const a = useId(), b = useId(), [sang, giua, toi, loi] = MAU_TRUM[loai] ?? MAU_TRUM.chua_te_ket_tua!
  return (
    <svg className={className} viewBox="0 0 220 210" width={size} height={Math.round(size * 210 / 220)} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id={a} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={sang} /><stop offset=".45" stopColor={giua} /><stop offset="1" stopColor={toi} /></linearGradient>
        <linearGradient id={b} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={giua} /><stop offset="1" stopColor={toi} /></linearGradient>
      </defs>
      <ellipse cx="110" cy="198" rx="84" ry="10" fill="rgba(0,0,0,.45)" />
      <polygon points="44,100 8,58 20,150 52,158" fill={`url(#${b})`} /><polygon points="176,100 212,58 200,150 168,158" fill={`url(#${b})`} />
      <polygon points="8,58 26,96 20,150" fill="rgba(255,255,255,.12)" />
      <polygon points="60,84 160,84 186,160 110,196 34,160" fill={`url(#${a})`} />
      <polygon points="60,84 110,118 34,160" fill="rgba(255,255,255,.16)" /><polygon points="160,84 110,118 186,160" fill="rgba(0,0,0,.22)" />
      <polygon points="110,118 186,160 110,196 34,160" fill="rgba(0,0,0,.12)" />
      <polygon points="110,12 142,58 132,98 88,98 78,58" fill={`url(#${a})`} /><polygon points="110,12 110,98 88,98 78,58" fill="rgba(255,255,255,.18)" />
      <polygon points="78,58 62,22 92,44" fill={sang} /><polygon points="142,58 158,22 128,44" fill={giua} />
      <polygon points="90,64 106,70 90,77" fill="#fff36b" /><polygon points="130,64 114,70 130,77" fill="#fff36b" />
      <path d="M96 88 l6 -5 l6 5 l6 -5 l6 5" stroke={toi} strokeWidth="3" fill="none" />
      <polygon points="110,128 124,148 110,170 96,148" fill={loi} />
    </svg>
  )
}

/** Linh Tâm: quả cầu sáng có hai vòng sóng lan. */
export function LinhTamCau({ size, className = '' }: { size: number; className?: string }) {
  return <div className={`dh-linh-tam ${className}`} style={{ width: size, height: size }} aria-hidden="true"><i /><i /><b /><span /></div>
}

export function SaoHinh({ size, sang }: { size: number; sang: boolean }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} className={sang ? 'dh-sao dh-sao-sang' : 'dh-sao'} aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
}

// Biểu tượng nét (24×24) cho ba đòn — vẽ trong mã để không kéo thêm thư viện.
const NET = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
export const BieuTuong = {
  danh: <svg viewBox="0 0 24 24" width="22" height="22" {...NET} aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /></svg>,
  chan: <svg viewBox="0 0 24 24" width="22" height="22" {...NET} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  ky_nang: <svg viewBox="0 0 24 24" width="22" height="22" {...NET} aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  choi: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>,
} as const
