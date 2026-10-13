// THANG 12 BẬC — 12 ô ngang, mỗi ô một màu (đỏ ⇒ cam ⇒ xanh lá ⇒ chàm ⇒ vàng kim), ô bậc hiện tại nổi bật + có biểu tượng (thầy 13/10).
// Một dòng "Còn N điểm lên <biểu tượng> <tên bậc kế>" CHỈ khi máy chủ có `diemLenBac`. null (bậc kế thuộc nhóm khác, hoặc bậc 12 cần thêm chuỗi đủ
// mức) ⇒ không thêm chữ: dòng "Việc tiếp" / "Ra khỏi nhóm Lười" của bảng Nhịp học đã nói luật lên nhóm — không lặp chữ. Không xưng hô ⇒ dùng chung em/con.
import type { KetQuaBac } from '../../lib/bac-cham-chi'
import { BAC_CHAM_CHI, chuBac, motBac } from './bac'
import './bac-cham-chi.css'

export default function ThangBac({ kq }: { kq: KetQuaBac }) {
  const hien = motBac(kq.bac)
  if (!hien) return null
  const ke = kq.diemLenBac !== null ? motBac(kq.bac + 1) : null
  return (
    <div className="bcc-thang">
      <span className="bcc-thang-o" role="img" aria-label={`Thang 12 bậc từ Lười đến Chăm: đang ở ${chuBac(hien)}, điểm chăm ${kq.diem}/100`}>
        {BAC_CHAM_CHI.map((b) => (
          <span key={b.so} className="bcc bcc-o" data-bac={b.so} data-hien={b.so === hien.so ? 'true' : undefined} title={chuBac(b)}>
            {b.so === hien.so && <span className="bcc-bt">{b.bieuTuong}</span>}
          </span>
        ))}
      </span>
      {ke && kq.diemLenBac !== null && (
        <p className="bcc-len">
          Còn <b>{kq.diemLenBac}</b> điểm lên{' '}
          <span className="bcc-bt" aria-hidden="true">
            {ke.bieuTuong}
          </span>{' '}
          {ke.ten}
        </p>
      )}
    </div>
  )
}
