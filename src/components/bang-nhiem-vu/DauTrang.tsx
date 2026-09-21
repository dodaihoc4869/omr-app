// VÙNG 1 — đầu trang: thanh trên (thông báo + menu ba chấm), lời chào, chuỗi
// ngày, thần thú 96 dp ở góc phải. Thần thú là Spirit2D compact (KHÔNG dựng
// bản three.js ở màn chính); chạm vào mở game đầy đủ.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, EllipsisVertical, Flame } from 'lucide-react'
import Spirit2D, { type SpiritMotion } from '../../game/than-thu-v2/Spirit2D'
import { PETS } from '../../game/than-thu-v2/core'
import type { TrangThaiThanThu } from '../../lib/nhiem-vu-adapter'
import { useSauVeDauTien } from './may-chu'

export interface MucMenu {
  id: string
  nhan: string
  bieuTuong?: ReactNode
  /** Kẻ một vạch ngăn phía trên mục này. */
  keTren?: boolean
  onChon: () => void
}

export type ThanThuGoc = TrangThaiThanThu

function ngayVietNamChu(now: number): string {
  const phan = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(now))
  const lay = (k: string) => phan.find((p) => p.type === k)?.value ?? ''
  const thu = lay('weekday')
  // Luật 6 CHUAN-TU-NGU: "Thứ Năm 24/09/2026" (đủ năm, không dấu phẩy)
  return `${thu.charAt(0).toUpperCase()}${thu.slice(1)} ${lay('day')}/${lay('month')}/${lay('year')}`
}

/** Tên gọi của người Việt là chữ cuối của họ tên. Tên dự phòng kiểu "Học sinh SBD 123" không có tên thật. */
function tenGoi(hoTen: string, khiThieu: string): string {
  const cat = hoTen.trim().split(/\s+/)
  const cuoi = cat[cat.length - 1]
  return !cuoi || /\d/.test(cuoi) ? khiThieu : cuoi
}

export default function DauTrang({
  vaiTro,
  hoTen,
  now,
  chuoiNgay,
  thanThu,
  dongThu,
  tatChuyenDong,
  nghi = false,
  onMoThanThu,
  mucMenu,
  khePhai,
}: {
  vaiTro: 'hocsinh' | 'phuhuynh'
  hoTen: string
  now: number
  chuoiNgay: { soNgay: number; chu: string }
  thanThu: ThanThuGoc
  dongThu: SpiritMotion
  tatChuyenDong: boolean
  /** Hôm nay không có việc: thần thú đứng yên (không thở/không quầng) — "đang nghỉ". */
  nghi?: boolean
  onMoThanThu?: () => void
  mucMenu: MucMenu[]
  khePhai?: ReactNode
}) {
  const [moMenu, setMoMenu] = useState(false)
  const neo = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!moMenu) return
    const ngoai = (e: Event) => {
      if (neo.current && !neo.current.contains(e.target as Node)) setMoMenu(false)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoMenu(false)
    }
    document.addEventListener('pointerdown', ngoai)
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('pointerdown', ngoai)
      document.removeEventListener('keydown', phim)
    }
  }, [moMenu])

  const laPh = vaiTro === 'phuhuynh'
  // Ảnh sprite thần thú nặng ~3 MB: chỉ gắn Spirit2D sau khi chữ + thẻ đã vẽ; vòng 96 dp giữ chỗ nên không xô bố cục.
  const sauVe = useSauVeDauTien()
  const ten = tenGoi(hoTen, laPh ? 'con' : 'em')
  // Thần thú CỦA EM do máy chủ báo. Không có con mặc định: thiếu dữ liệu thì để trống, chưa chọn thì nói "chưa chọn".
  const index = thanThu.kieu === 'co' ? PETS.findIndex((p) => p.id === thanThu.pet) : -1
  const co = thanThu.kieu === 'co' && index >= 0
  const chuaChon = thanThu.kieu === 'chua_chon' || (thanThu.kieu === 'co' && index < 0)
  const nhanThu = co ? `${thanThu.ten || PETS[index].name} · Cấp ${thanThu.cap}` : chuaChon ? 'Chưa chọn thần thú' : ''
  const hinhThu = (
    <span className="bnv-thu-vong" data-trang-thai={co ? 'co' : chuaChon ? 'chua-chon' : 'cho'} data-nghi={nghi ? 'true' : 'false'}>
      {co && sauVe && (
        <span className="bnv-thu-than">
          <Spirit2D index={index} level={thanThu.cap} compact motion={dongThu} reducedMotion={tatChuyenDong || nghi} />
        </span>
      )}
    </span>
  )
  // Luật 1–2 (CHUAN-TU-NGU): tên riêng do em đặt luôn đi sau danh từ chung — "Thần thú của em" / "Thần thú của con" rồi mới tới "Bông · Cấp 37".
  const nhan = nhanThu ? (
    <span className="bnv-thu-ten">
      {co && <span className="bnv-thu-danh">{laPh ? 'Thần thú của con' : 'Thần thú của em'}</span>}
      <span className="bnv-thu-goi">{nhanThu}</span>
    </span>
  ) : null

  return (
    <header className="bnv-vung-dau">
      <div className="bnv-thanh-tren">
        <div className="bnv-thanh-tren-phai">
          {khePhai}
          {mucMenu.length > 0 && (
            <div className="bnv-menu-neo" ref={neo}>
              <button
                type="button"
                className="bnv-nut-tron"
                aria-label="Mở menu"
                aria-haspopup="menu"
                aria-expanded={moMenu}
                onClick={() => setMoMenu((m) => !m)}
              >
                <EllipsisVertical size={22} aria-hidden="true" />
              </button>
              {moMenu && (
                <div className="bnv-menu" role="menu" aria-label="Các màn khác">
                  {mucMenu.map((m) => (
                    <div key={m.id} role="none">
                      {m.keTren && <div className="bnv-menu-ke" role="separator" />}
                      <button
                        type="button"
                        role="menuitem"
                        className="bnv-menu-muc"
                        onClick={() => {
                          setMoMenu(false)
                          m.onChon()
                        }}
                      >
                        {m.bieuTuong}
                        <span>{m.nhan}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bnv-dau">
        <div className="bnv-dau-chu">
          <div className="bnv-ngay">
            {ngayVietNamChu(now)}
            {laPh ? ' · Phụ huynh' : ''}
          </div>
          <h1 className="bnv-chao">{laPh ? `Hôm nay của ${ten}` : `Chào ${ten}`}</h1>
          {chuoiNgay.soNgay > 0 && (
            <div className="bnv-chuoi">
              {laPh ? <Check size={16} aria-hidden="true" /> : <Flame size={16} aria-hidden="true" />}
              <span>{chuoiNgay.chu}</span>
            </div>
          )}
        </div>

        {onMoThanThu && (co || chuaChon) ? (
          <button
            type="button"
            className="bnv-thu"
            onClick={onMoThanThu}
            aria-label={co ? `Mở thần thú ${nhanThu}` : 'Chưa chọn thần thú — chạm để mở game và chọn'}
          >
            {hinhThu}
            {nhan}
          </button>
        ) : co || chuaChon ? (
          <div className="bnv-thu" role="group" aria-label={co ? `Thần thú của con: ${nhanThu}` : 'Con chưa chọn thần thú'}>
            {hinhThu}
            {nhan}
          </div>
        ) : (
          <div className="bnv-thu" aria-hidden="true">
            {hinhThu}
          </div>
        )}
      </div>
    </header>
  )
}
