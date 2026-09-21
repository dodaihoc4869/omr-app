// THANH NHÓM cả lớp của một bài (đề prompt-btvn-da-giao-thiet-ke-lai-2109.md §1.C). ĐỌC số máy chủ (`nhom`); màn không tự cộng trừ nhóm.
// Số nằm TRONG đoạn khi đoạn đủ rộng, đoạn quá hẹp thì số ra chú giải. Bấm một đoạn (hoặc một mục chú giải) ⇒ mở ngăn danh sách ĐÚNG nhóm đó.
import { NHOM_EM, thanhNhom, type NhomBai, type NhomEm } from '../../lib/btvn-da-giao'
import './btg.css'

export default function ThanhNhom({ nhom, chiaChang, nho = false, onChonNhom }: { nhom: NhomBai; chiaChang: boolean; nho?: boolean; onChonNhom?: (n: NhomEm) => void }) {
  const t = thanhNhom(nhom, chiaChang)
  if (t.doan.length === 0) return null
  const bam = (k: NhomEm) => onChonNhom?.(k)
  return (
    <div className={`btg-nhom${nho ? ' btg-nhom--nho' : ''}`}>
      <div className="btg-thanh" role="group" aria-label="Số em theo nhóm">
        {t.doan.map((d) => (
          <button
            key={d.khoa}
            type="button"
            className={`btg-doan btg-doan--${d.sac}`}
            style={{ width: `${d.phanTram}%` }}
            aria-label={`${d.nhan}: ${d.so} em. Bấm để xem danh sách`}
            onClick={() => bam(d.khoa)}
            disabled={!onChonNhom}
          >
            {!nho && !d.hep ? d.so : ''}
          </button>
        ))}
      </div>
      {!nho && (
        <ul className="btg-chu-giai" aria-label="Chú giải thanh nhóm">
          {t.chuGiai.map((g) => (
            <li key={g.khoa}>
              <button type="button" className="btg-chu-giai-nut" onClick={() => bam(g.khoa)} disabled={!onChonNhom || g.so === 0}>
                <span className={`btg-cham btg-doan--${g.sac}`} aria-hidden="true" />
                {g.nhan} <b>{g.so}</b>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { NHOM_EM }
