import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Flame, MonitorPlay, Trophy, TrendingUp, X } from 'lucide-react'
import { ngayDai } from '../../lib/hom-nay-api'
import { layVinhDanhNgay, type VinhDanhNgay } from '../../lib/hom-nay-v2'
import type { KetQuaLenh } from '../../lib/goi-lenh-thay'
import '../../styles/hom-nay-v2.css'

const soThap = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

interface Bia {
  khoa: 'chamNhat' | 'tienBo' | 'benBi' | 'diemCao'
  tieuDe: string
  Icon: typeof Flame
  sbd: string
  hoTen: string
  dong: string
}

/** Chỉ dựng bục nào MÁY CHỦ CÓ SỐ — thiếu bục nào bỏ bục đó, không bịa. */
export function cacBia(d: VinhDanhNgay): Bia[] {
  const kq: Bia[] = []
  if (d.chamNhat) kq.push({ khoa: 'chamNhat', tieuDe: 'Chăm nhất', Icon: Flame, sbd: d.chamNhat.sbd, hoTen: d.chamNhat.hoTen, dong: `${d.chamNhat.lop} · +${d.chamNhat.exp.toLocaleString('vi-VN')} EXP hôm nay` })
  if (d.tienBoNhat) kq.push({ khoa: 'tienBo', tieuDe: 'Tiến bộ nhất', Icon: TrendingUp, sbd: d.tienBoNhat.sbd, hoTen: d.tienBoNhat.hoTen, dong: [d.tienBoNhat.lop, d.tienBoNhat.soDangLenBac != null && `${d.tienBoNhat.soDangLenBac} dạng lên bậc`, d.tienBoNhat.soCauDungLai != null && `đúng lại ${d.tienBoNhat.soCauDungLai} câu / 7 ngày`].filter(Boolean).join(' · ') })
  if (d.benBiNhat) kq.push({ khoa: 'benBi', tieuDe: 'Bền bỉ nhất', Icon: CalendarCheck, sbd: d.benBiNhat.sbd, hoTen: d.benBiNhat.hoTen, dong: `${d.benBiNhat.lop} · chuỗi ${d.benBiNhat.chuoiNgay} ngày liền` })
  if (d.diemCao) kq.push({ khoa: 'diemCao', tieuDe: 'Điểm cao ca kiểm tra gần nhất', Icon: Trophy, sbd: d.diemCao.sbd, hoTen: d.diemCao.hoTen, dong: `${d.diemCao.lop} · ${soThap(d.diemCao.diem)} điểm${d.diemCao.tenCa ? ` · ${d.diemCao.tenCa}` : ''}` })
  return kq
}

const ngayChu = (ngay: string) => {
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(ngay)
  return m ? `${ngayDai(ngay)}/${m[1]}` : ''
}

/** Tấm phủ toàn màn cho máy chiếu: chữ to, đọc được từ cuối lớp; Esc hoặc nút Đóng để thoát. */
function TamChieu({ bia, ngay, onDong }: { bia: Bia[]; ngay: string; onDong: () => void }) {
  const nutDong = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => e.key === 'Escape' && onDong()
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [onDong])
  return (
    <div className="hn2-chieu" role="dialog" aria-modal="true" aria-label="Vinh danh hôm nay — chiếu lên bảng">
      <div className="hn2-chieu-dau">
        <div>
          <h2 className="hn2-chieu-tieu-de">Vinh danh hôm nay</h2>
          {ngayChu(ngay) && <p className="hn2-chieu-ngay">{ngayChu(ngay)}</p>}
        </div>
        <button ref={nutDong} type="button" className="hn2-nut hn2-nut--vien" onClick={onDong}>
          <X size={18} aria-hidden="true" />
          Đóng
        </button>
      </div>
      <div className="hn2-chieu-luoi">
        {bia.map((b) => (
          <div className={`hn2-bia hn2-bia--${b.khoa} hn2-bia--to`} key={b.khoa}>
            <b.Icon size={40} aria-hidden="true" />
            <span className="hn2-bia-nhan">{b.tieuDe}</span>
            <span className="hn2-bia-ten">{b.hoTen}</span>
            <span className="hn2-bia-dong">{b.dong}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Ô VINH DANH HÔM NAY (bản vẽ docs/ban-ve-hom-nay-v2-2109/): nhỏ mà sang — Chăm nhất · Tiến bộ nhất · Bền bỉ nhất · Điểm cao ca kiểm tra gần nhất.
 *  Nguồn: lệnh thầy CHỈ ĐỌC `/gv/vinh-danh-ngay` (Code 3). KHÔNG có số (chưa có lệnh / lỗi / chưa em nào) ⇒ ô thu gọn MỘT dòng nói thật, không bịa em nào. */
export default function VinhDanh({ onMoEm }: { onMoEm: (sbd: string) => void }) {
  const [kq, setKq] = useState<KetQuaLenh<VinhDanhNgay> | undefined>(undefined)
  const [chieu, setChieu] = useState(false)
  useEffect(() => {
    let con = true
    void layVinhDanhNgay().then((r) => con && setKq(r))
    return () => {
      con = false
    }
  }, [])

  const bia = kq?.ok ? cacBia(kq.du) : []
  const mot = (chu: string) => (
    <section className="hn2-the hn2-vinh-danh hn2-vinh-danh--gon" aria-labelledby="hn2-vd" data-khoi="vinh-danh">
      <Trophy size={18} aria-hidden="true" className="hn2-vd-icon" />
      <h2 id="hn2-vd" className="hn2-tieu-de">
        Vinh danh hôm nay
      </h2>
      <p className="hn2-vd-gon">{chu}</p>
    </section>
  )

  if (kq === undefined) return mot('Đang tải…')
  if (!kq.ok) return mot(kq.loai === 'chua_co_lenh' ? 'Máy chủ chưa có lệnh vinh danh theo ngày — chưa có số nào để hiện.' : kq.chu)
  if (bia.length === 0) return mot('Hôm nay chưa có số liệu để vinh danh em nào.')

  return (
    <section className="hn2-the hn2-vinh-danh" aria-labelledby="hn2-vd" data-khoi="vinh-danh">
      <div className="hn2-em-dau">
        <h2 id="hn2-vd" className="hn2-tieu-de hn2-tieu-de--icon">
          <Trophy size={18} aria-hidden="true" />
          Vinh danh hôm nay
        </h2>
        <button type="button" className="hn2-nut hn2-nut--vien hn2-nut--nho" onClick={() => setChieu(true)}>
          <MonitorPlay size={16} aria-hidden="true" />
          Chiếu vinh danh
        </button>
      </div>
      <div className="hn2-bia-luoi">
        {bia.map((b) => (
          <div className={`hn2-bia hn2-bia--${b.khoa}`} key={b.khoa}>
            <b.Icon size={26} aria-hidden="true" className="hn2-bia-icon" />
            <div className="hn2-bia-noi-dung">
              <span className="hn2-bia-nhan">{b.tieuDe}</span>
              <button type="button" className="hn2-bia-ten hn2-bia-ten--nut" onClick={() => onMoEm(b.sbd)} aria-label={`${b.hoTen} — mở toàn cảnh`}>
                {b.hoTen}
              </button>
              <span className="hn2-bia-dong">{b.dong}</span>
            </div>
          </div>
        ))}
      </div>
      {chieu && kq.ok && <TamChieu bia={bia} ngay={kq.du.ngay} onDong={() => setChieu(false)} />}
    </section>
  )
}
