import { PETS } from './core'
import './bieu-cam-thu.css'

export const CAM_XUC = ['chao', 'nghi', 'dung', 'sai', 'quyet-tam', 'mung'] as const
export type CamXucThu = typeof CAM_XUC[number]
export const NHAN_CAM_XUC: Record<CamXucThu, string> = {
  chao: 'Chào đón', nghi: 'Đang suy nghĩ', dung: 'Vui vì em hiểu bài',
  sai: 'Động viên em thử lại', 'quyet-tam': 'Sẵn sàng ra đòn', mung: 'Ăn mừng tiến bộ',
}

/** Portrait emotes are separate from the body: evolution/level never changes on feedback.
 * Only pass the student's revealed result; never infer another student's answer. */
export default function BieuCamThu({ thu, camXuc = 'chao', size = 60, className = '' }: {
  thu: number; camXuc?: CamXucThu; size?: number; className?: string
}) {
  const pet = Number.isInteger(thu) && thu >= 0 && thu < 8 ? thu : 0
  const col = CAM_XUC.indexOf(camXuc), row = pet % 4
  return <span className={`bl-bieu-cam ${className}`} data-cam-xuc={camXuc} data-thu={pet}
    style={{ width: size, height: size }} role="img" aria-label={`${PETS[pet]!.name}: ${NHAN_CAM_XUC[camXuc]}`}>
    <svg key={camXuc} viewBox={`${col * 256} ${row * 256} 256 256`} aria-hidden="true">
      <image href={`/bat-linh/bieu-cam-${pet < 4 ? 1 : 2}.webp`} width="1536" height="1024" />
    </svg>
  </span>
}
