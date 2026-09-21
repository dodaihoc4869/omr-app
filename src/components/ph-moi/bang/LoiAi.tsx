// Khối "Lời A.I Đỗ Đại Học gửi anh/chị" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html #muc-loi): thẻ thư + thẻ "Anh/chị có thể làm gì".
// THƯ CHỈ dùng chữ máy chủ gửi (loiBoNao.loi / thuTuan, phuHuynhLamGi) — không tự bịa câu nào. Máy chủ chỉ gửi NGÀY (không có giờ) ⇒ dòng ngày không kèm giờ.
import { ngayDayDuVn } from '../../../lib/ph-moi/dinh-dang'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'
import { laNgayChuoi } from './c-chung'

/** Tách một đoạn dài theo xuống dòng (nếu máy chủ có gửi); bỏ đoạn rỗng. */
const tachDoan = (s: string): string[] => s.split(/\n+/).map((x) => x.trim()).filter(Boolean)

export function coLoiAi(pm: PhMoi): boolean {
  const l = pm.loiBoNao
  return (!!l && (l.loi.trim() !== '' || l.thuTuan.trim() !== '')) || (pm.phuHuynhLamGi ?? []).length > 0
}

export function LoiAi({ pm }: { pm: PhMoi }) {
  if (!coLoiAi(pm)) return null
  const l = pm.loiBoNao
  const doan = l ? [...tachDoan(l.loi), ...tachDoan(l.thuTuan)] : []
  const ngay = l && laNgayChuoi(l.ngay) ? ngayDayDuVn(`${l.ngay}T05:00:00Z`) : '' // 05:00Z = 12:00 giờ VN: đúng ngày ở mọi múi giờ máy
  const goiY = (pm.phuHuynhLamGi ?? []).slice(0, 2)
  return (
    <section className="phm-muc" id="muc-loi" aria-label="Lời A.I Đỗ Đại Học gửi anh/chị">
      <header className="phm-muc__dau">
        <h2>Lời A.I Đỗ Đại Học gửi anh/chị</h2>
      </header>
      {doan.length > 0 && (
        <div className="phm-the phm-thu">
          <div className="phm-thu__dau">
            <i aria-hidden="true">A.I</i>
            <div>
              <h3>A.I Đỗ Đại Học</h3>
              {ngay && <p>{ngay}</p>}
            </div>
          </div>
          <div className="phm-thu__than">
            {doan.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
          </div>
          <p className="phm-thu__ky">A.I Đỗ Đại Học viết từ số liệu học của con.</p>
        </div>
      )}
      {goiY.length > 0 && (
        <div className="phm-the phm-the--dem">
          <p className="phm-nhan-muc">Anh/chị có thể làm gì</p>
          <ol className="phm-goi-y">
            {goiY.map((g, i) => (
              <li key={i}>
                <i aria-hidden="true">{i + 1}</i>
                <span>{g}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
