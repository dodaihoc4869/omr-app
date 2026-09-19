// VÙNG 3 — danh sách nhiệm vụ 4 bậc. Mỗi bậc một vai trò màu M3 + một vị trí
// cố định; thứ tự TRONG bậc là thứ tự adapter trả về, ở đây không xếp lại.
// Việc bị cổng hiện mờ 38% kèm nhãn "Mở sau khi xong: <tên việc>".
import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight, Heart, Lock, RotateCcw, Sparkles, Target } from 'lucide-react'
import type { BieuTuongViec, NhomBac, TheNhiemVu } from '../../lib/nhiem-vu-adapter'

const BIEU_TUONG: Record<BieuTuongViec, typeof Heart> = {
  btvn: BookOpen,
  mom: Heart,
  on: RotateCcw,
  muc_tieu: Target,
  sao: Sparkles,
}

function haiSo(n: number) {
  return String(n).padStart(2, '0')
}

/** Đồng hồ đếm lùi của việc KHẨN. Chỉ là chữ số đổi mỗi giây, không hoạt ảnh. */
function DemLui({ conLaiMs }: { conLaiMs: number }) {
  const [moc] = useState(() => Date.now())
  const [, setNhip] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNhip((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const giay = Math.max(0, Math.floor((conLaiMs - (Date.now() - moc)) / 1000))
  const gio = Math.floor(giay / 3600)
  const chu = gio > 0 ? `${gio}:${haiSo(Math.floor((giay % 3600) / 60))}:${haiSo(giay % 60)}` : `${haiSo(Math.floor(giay / 60))}:${haiSo(giay % 60)}`
  return (
    <span className="bnv-dem-lui" role="timer" aria-label={`Còn ${chu}`}>
      {chu}
    </span>
  )
}

function The({
  viec,
  nhanBac,
  docChi,
  onChon,
}: {
  viec: TheNhiemVu
  nhanBac: string
  docChi: boolean
  onChon: (viec: TheNhiemVu) => void
}) {
  const Icon = viec.biCong ? Lock : BIEU_TUONG[viec.bieuTuong]
  const moTa = viec.biCong ? `Mở sau khi xong: ${viec.moSauKhiXong}` : viec.moTa
  const coDemLui =
    viec.bac === 'khan' && !viec.biCong && viec.conLaiMs !== undefined && viec.conLaiMs > 0 && viec.conLaiMs < 24 * 3600_000
  const ruot = (
    <>
      <span className="bnv-the-o">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="bnv-the-chu">
        <span className="bnv-the-ten">{viec.tieuDe}</span>{' '}
        <span className="bnv-the-mo-ta">{moTa}</span>
      </span>
      {viec.biCong ? null : docChi ? (
        <span className="bnv-chip">{viec.trangThai === 'dang_lam' ? 'Đang làm' : 'Chưa làm'}</span>
      ) : coDemLui ? (
        // key: đồng hồ dựng lại mốc mỗi khi dữ liệu trả thời gian còn lại mới.
        <DemLui key={viec.conLaiMs} conLaiMs={viec.conLaiMs!} />
      ) : (
        <ChevronRight size={20} aria-hidden="true" />
      )}
    </>
  )
  // Tên truy cập phải chứa NGUYÊN chữ nhìn thấy (WCAG 2.5.3) — nhãn bậc để ở cuối.
  const nhan = `${viec.tieuDe} ${moTa} — ${nhanBac}`
  if (viec.biCong || docChi) {
    return (
      <div
        className="bnv-the"
        role="group"
        aria-label={nhan}
        aria-disabled={viec.biCong ? true : undefined}
        data-bi-cong={viec.biCong ? 'true' : undefined}
        data-viec={viec.id}
      >
        {ruot}
      </div>
    )
  }
  return (
    <button type="button" className="bnv-the" aria-label={nhan} data-viec={viec.id} onClick={() => onChon(viec)}>
      {ruot}
    </button>
  )
}

export default function DanhSachNhiemVu({
  cacBac,
  docChi,
  onChon,
}: {
  cacBac: NhomBac[]
  docChi: boolean
  onChon: (viec: TheNhiemVu) => void
}) {
  return (
    <>
      {cacBac
        .filter((b) => b.viec.length > 0)
        .map((b) => (
          <section key={b.bac} className="bnv-bac" data-bac={b.bac} data-vai-tro={b.vaiTroMau} aria-label={`${b.nhan}: ${b.viec.length} việc`}>
            <h2 className="bnv-bac-dau">
              <span className="bnv-bac-cham" aria-hidden="true" />
              <span>
                {b.nhan} · {b.viec.length}
              </span>
            </h2>
            {b.viec.map((v) => (
              <The key={v.id} viec={v} nhanBac={b.nhan} docChi={docChi} onChon={onChon} />
            ))}
          </section>
        ))}
    </>
  )
}
