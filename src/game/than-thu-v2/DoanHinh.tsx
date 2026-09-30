import BieuCamThu, { type CamXucThu } from './BieuCamThu'
import QuaiSonThuy from './QuaiSonThuy'
// ĐOÀN HỘ TỐNG — hình vẽ dùng chung: thần thú THẬT (cắt từ atlas tiến hoá), tia chiêu thức THẬT, quái/trùm/Linh Tâm vẽ bằng SVG trong mã
// (giả định đã chốt: khi thầy có ảnh quái thật thì thay ở đây, không đụng màn nào).
import { useId } from 'react'
import type { CSSProperties } from 'react'
import { evolutionCrop, evolutionMirror } from './evolution'
import { BATTLE_SKINS } from './learning-battle'
import { anhWebp, doiVePng } from './anh-webp'

/** Một ô thần thú trong suốt, đúng hình thái theo cấp. `quayTrai` = nhìn sang trái (đứng bên phải sân). */
export function ThuHinh({ pet, cap, size, quayTrai = false, className = '', style, camXuc }: { camXuc?: CamXucThu; pet: number; cap: number; size?: number; quayTrai?: boolean; className?: string; style?: CSSProperties }) {
  const crop = evolutionCrop(pet, cap), clip = useId(), lat = evolutionMirror(pet, cap) !== quayTrai
  const skin = BATTLE_SKINS[pet] ?? BATTLE_SKINS[0]
  return (
    <div className={`dh-thu ${className}`} style={{ ...(size ? { width: size, height: size } : null), '--dh-thu-mau': skin.color, ...style } as CSSProperties} aria-hidden="true">
      <div className="dh-thu-bong" />
      <svg viewBox={`0 0 ${crop.width} ${crop.height}`} style={{ transform: lat ? 'scaleX(-1)' : undefined }}>
        <defs><clipPath id={clip}><rect width={crop.width} height={crop.height} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}><image href={anhWebp(`/than-thu-v2/evolution-${crop.atlas}-cutout.png`)} onError={doiVePng} x={-crop.x} y={-crop.y} width="1536" height="1024" /></g>
      </svg>
      {camXuc && <BieuCamThu thu={pet} camXuc={camXuc} />}
    </div>
  )
}

/** Each chemistry monster now has its own painted silhouette. */
export function QuaiHinh({ loai, size, className = '' }: { loai: string; size: number; className?: string }) {
  return <QuaiSonThuy loai={loai} size={size} className={className} />
}
export function TrumHinh({ loai, size, className = '' }: { loai: string; size: number; className?: string }) {
  return <QuaiSonThuy loai={loai || 'chua_te_ket_tua'} size={size} className={className} />
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
