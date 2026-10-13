// THANG 12 BẬC — 12 ô ngang, mỗi ô một màu (đỏ ⇒ cam ⇒ xanh lá ⇒ chàm ⇒ vàng kim), ô bậc hiện tại nổi bật + mang HUY HIỆU của bậc (thầy 13/10; đợt 19
// thay emoji bằng huy hiệu vẽ riêng — HuyHieuBac).
// Một dòng "Còn N điểm lên <huy hiệu> <tên bậc kế>" CHỈ khi máy chủ có `diemLenBac`. null (bậc kế thuộc nhóm khác, hoặc bậc 12 cần thêm chuỗi đủ
// mức) ⇒ không thêm chữ: dòng "Việc tiếp" / "Ra khỏi nhóm Lười" của bảng Nhịp học đã nói luật lên nhóm — không lặp chữ. Không xưng hô ⇒ dùng chung em/con.
import type { KetQuaBac } from '../../lib/bac-cham-chi'
import { BAC_CHAM_CHI, chuBac, motBac } from './bac'
import HuyHieuBac from './HuyHieuBac'
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
            {b.so === hien.so && <HuyHieuBac bac={b.so} co={38} className="bcc-bt" />}
          </span>
        ))}
      </span>
      {ke && kq.diemLenBac !== null && (
        <p className="bcc-len">
          Còn <b>{kq.diemLenBac}</b> điểm lên{' '}
          <span className="bcc-len-ke">
            <HuyHieuBac bac={ke.so} co={20} />
            {ke.ten}
          </span>
        </p>
      )}
    </div>
  )
}
