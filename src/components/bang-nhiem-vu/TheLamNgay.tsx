// VÙNG 2 — thẻ "Làm ngay" DUY NHẤT (M3 filled, cao độ 3): việc đầu tiên đang
// mở. Nút trong thẻ là nút nổi bật duy nhất của cả màn (`data-noi-bat`).
// Phụ huynh xem cùng thẻ ở dạng tonal, đọc-chỉ, không có nút.
import { Clock, Play } from 'lucide-react'
import type { TheNhiemVu } from '../../lib/nhiem-vu-adapter'

export function VachLo({ tienDo }: { tienDo: NonNullable<TheNhiemVu['tienDoLo']> }) {
  return (
    <div className="bnv-lo" role="img" aria-label={`Chặng ${tienDo.hienTai} trong ${tienDo.tong} chặng`}>
      {Array.from({ length: tienDo.tong }, (_, i) => (
        <i key={i} data-lo={i + 1 < tienDo.hienTai ? 'xong' : i + 1 === tienDo.hienTai ? 'dang' : 'cho'} />
      ))}
    </div>
  )
}

export default function TheLamNgay({
  viec,
  docChi,
  onLam,
}: {
  viec: TheNhiemVu
  docChi: boolean
  onLam: (viec: TheNhiemVu) => void
}) {
  const nhan = docChi ? (viec.trangThai === 'dang_lam' ? 'CON ĐANG LÀM' : 'CON CẦN LÀM TRƯỚC') : 'LÀM NGAY'
  return (
    <section
      className={`bnv-lam-ngay ${docChi ? 'bnv-lam-ngay--doc' : ''}`}
      aria-label={`${docChi ? 'Việc của con' : 'Làm ngay'}: ${viec.tieuDe}`}
      data-vung="lam-ngay"
    >
      <div className="bnv-lam-ngay-dau">
        <span className="bnv-nhan">{nhan}</span>
        {viec.conLaiChu && (
          <span className="bnv-han">
            <Clock size={14} aria-hidden="true" />
            <span>{viec.conLaiChu}</span>
          </span>
        )}
      </div>
      <h2 className="bnv-lam-ngay-ten">{viec.tieuDe}</h2>
      {viec.dongPhu && viec.dongPhu.length > 0 && (
        <ul className="bnv-lam-ngay-phu" aria-label="Chi tiết chặng">
          {viec.dongPhu.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      <p className="bnv-lam-ngay-mo-ta">
        {viec.soCau > 0 ? `${viec.soCau} câu · khoảng ${viec.phutUocTinh} phút` : viec.moTa}
      </p>
      {viec.tienDoLo && <VachLo tienDo={viec.tienDoLo} />}
      {!docChi && (
        <button type="button" className="bnv-nut-chinh" data-noi-bat="true" onClick={() => onLam(viec)}>
          <Play size={20} fill="currentColor" aria-hidden="true" />
          <span>{viec.hanhDong.nhanNut}</span>
        </button>
      )}
    </section>
  )
}
