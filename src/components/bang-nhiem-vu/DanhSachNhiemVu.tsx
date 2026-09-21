// VÙNG 3 — danh sách nhiệm vụ 4 bậc. Mỗi bậc một vai trò màu M3 + một vị trí
// cố định; thứ tự TRONG bậc là thứ tự adapter trả về, ở đây không xếp lại.
// Việc bị cổng hiện mờ 38% kèm nhãn "Mở sau khi xong: <tên việc>".
import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Heart, Lock, RotateCcw, Sparkles, Target } from 'lucide-react'
import type { BieuTuongViec, NhomBac, TheNhiemVu, TheQuaHan, TheTonCu, TonCu } from '../../lib/nhiem-vu-adapter'

const BIEU_TUONG: Record<BieuTuongViec, typeof Heart> = {
  btvn: BookOpen,
  mom: Heart,
  on: RotateCcw,
  muc_tieu: Target,
  sao: Sparkles,
}

const GIOI_HAN_NHOM = 8
const SO_THE_KHI_THU_GON = 5
const SO_DONG_TON_CU = 10

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
        {viec.dongPhu && viec.dongPhu.length > 0 && (
          <span className="bnv-the-phu">
            {viec.dongPhu.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </span>
        )}
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
  // Nhóm dài (> 8 thẻ) thu gọn còn 5 thẻ đầu + "Xem thêm N việc" (thứ tự vẫn là thứ tự của dữ liệu).
  const [moRong, setMoRong] = useState<Record<string, boolean>>({})
  return (
    <>
      {cacBac
        .filter((b) => b.viec.length > 0)
        .map((b) => {
          const dai = b.viec.length > GIOI_HAN_NHOM && !moRong[b.bac]
          const hien = dai ? b.viec.slice(0, SO_THE_KHI_THU_GON) : b.viec
          return (
            <section key={b.bac} className="bnv-bac" data-bac={b.bac} data-vai-tro={b.vaiTroMau} aria-label={`${b.nhan}: ${b.viec.length} việc`}>
              <h2 className="bnv-bac-dau">
                <span className="bnv-bac-cham" aria-hidden="true" />
                <span>
                  {b.nhan} · {b.viec.length}
                </span>
              </h2>
              {hien.map((v) => (
                <The key={v.id} viec={v} nhanBac={b.nhan} docChi={docChi} onChon={onChon} />
              ))}
              {dai && (
                <button type="button" className="bnv-xem-them" data-vai-tro={b.vaiTroMau} onClick={() => setMoRong((t) => ({ ...t, [b.bac]: true }))}>
                  Xem thêm {b.viec.length - SO_THE_KHI_THU_GON} việc
                </button>
              )}
            </section>
          )
        })}
    </>
  )
}

/** Việc đã quá hạn — liệt kê RIÊNG, không phải nhiệm vụ hôm nay (máy chủ không tính vào tải). */
export function DanhSachQuaHan({ viec, docChi, onChon }: { viec: TheQuaHan[]; docChi: boolean; onChon: (viec: TheQuaHan) => void }) {
  if (viec.length === 0) return null
  return (
    <section className="bnv-bac" data-bac="qua_han" aria-label={`Đã qua Hạn nộp: ${viec.length} việc`}>
      <h2 className="bnv-bac-dau">
        <span className="bnv-bac-cham" aria-hidden="true" />
        <span>ĐÃ QUA HẠN NỘP · {viec.length}</span>
      </h2>
      {viec.map((v) => {
        const Icon = v.loai === 'mom' ? Heart : BookOpen
        const ruot = (
          <>
            <span className="bnv-the-o">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="bnv-the-chu">
              <span className="bnv-the-ten">{v.tieuDe}</span>{' '}
              <span className="bnv-the-mo-ta">{v.chu}</span>
            </span>
            {v.hanhDong && !docChi && <ChevronRight size={20} aria-hidden="true" />}
          </>
        )
        return v.hanhDong && !docChi ? (
          <button key={v.id} type="button" className="bnv-the bnv-the--nhat" aria-label={`${v.tieuDe} ${v.chu} — đã qua Hạn nộp`} onClick={() => onChon(v)}>
            {ruot}
          </button>
        ) : (
          <div key={v.id} className="bnv-the bnv-the--nhat" role="group" aria-label={`${v.tieuDe} ${v.chu} — đã qua Hạn nộp`}>
            {ruot}
          </div>
        )
      })}
    </section>
  )
}

/**
 * Bài Mẹ giao CŨ chưa làm: hàng THU GỌN riêng (surfaceContainer, không màu vai trò), không phải việc hôm nay.
 * Bấm mở danh sách (10 dòng + "xem thêm"); mỗi dòng mở đúng bài đó bằng luồng Mẹ giao hiện có. Rỗng → không vẽ gì.
 * Phụ huynh chỉ thấy một dòng chữ.
 */
export function HangTonCu({ tonCu, docChi, onChon }: { tonCu: TonCu; docChi: boolean; onChon: (bai: TheTonCu) => void }) {
  const [mo, setMo] = useState(false)
  const [hien, setHien] = useState(SO_DONG_TON_CU)
  if (tonCu.soBai <= 0) return null
  if (docChi) {
    return (
      <div className="bnv-ton-cu bnv-ton-cu--chu" data-vung="ton-cu" role="group" aria-label={`Con còn ${tonCu.soBai} bài gia đình giao cũ chưa làm`}>
        Con còn {tonCu.soBai} bài gia đình giao cũ chưa làm
      </div>
    )
  }
  return (
    <section className="bnv-ton-cu" data-vung="ton-cu" aria-label={`Bài cũ chưa làm: ${tonCu.soBai} bài`}>
      <button type="button" className="bnv-ton-cu-nut" aria-expanded={mo} onClick={() => setMo((m) => !m)}>
        <span>Bài cũ chưa làm · {tonCu.soBai} bài</span>
        <ChevronDown size={20} aria-hidden="true" className={mo ? 'bnv-xoay' : undefined} />
      </button>
      {mo && (
        <ul className="bnv-ton-cu-ds">
          {tonCu.bai.slice(0, hien).map((b) => (
            <li key={b.id}>
              <button type="button" className="bnv-the bnv-the--nhat" aria-label={`${b.tieuDe} ${b.soCau} câu — bài cũ`} onClick={() => onChon(b)}>
                <span className="bnv-the-o">
                  <Heart size={20} aria-hidden="true" />
                </span>
                <span className="bnv-the-chu">
                  <span className="bnv-the-ten">{b.tieuDe}</span>{' '}
                  <span className="bnv-the-mo-ta">{b.soCau} câu</span>
                </span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </li>
          ))}
          {tonCu.bai.length > hien && (
            <li>
              <button type="button" className="bnv-xem-them" onClick={() => setHien((h) => h + SO_DONG_TON_CU)}>
                Xem thêm {tonCu.bai.length - hien} bài
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

// Xuất riêng thẻ việc để test khoá chuỗi (không đổi hành vi).
export { The as TheViec }
