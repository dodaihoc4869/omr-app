// LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY (sau khi nộp) — thầy 26/10: «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ này của tôi».
// Vẽ ĐỦ bản (đề nói gì · tóm tắt · chuỗi tính có kết quả · kết quả cuối). KhoiLoiGiaiChuan gọi qua `import()` khi kết quả nộp có `soDo`;
// bản hỏng / thiếu ⇒ hiện `duPhong` (lời giải cũ như cũ).
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { docBanSoDo } from '../../lib/goi-y-cham/api'
import { ChuoiTinh, QuyUoc, SoDoThay, ThiNghiemAo } from './so-do-thay'
import './goi-y-cham.css'

export default function LoiGiaiSoDo({ ban: tho, duPhong = null }: { ban: unknown; duPhong?: ReactNode }) {
  const ban = docBanSoDo(tho, true)
  if (!ban) return <>{duPhong}</>
  const n = ban.buoc.length
  return (
    <div className="gyc-lgsd">
      <p><ChemText text={ban.deNoiGi} /></p>
      {ban.hienTuong && <>
        <h3 className="gyc-lgsd-muc">Hiện tượng – bản chất</h3>
        {ban.hienTuong.giaiThich.map((g, i) => <p key={i}><ChemText text={g} /></p>)}
        {ban.hienTuong.thiNghiem && <ThiNghiemAo khung={ban.hienTuong.thiNghiem.khung} />}
      </>}
      {ban.soDo && <>
        <h3 className="gyc-lgsd-muc">Tóm tắt của thầy Đỗ Đại Học</h3>
        <SoDoThay soDo={ban.soDo} />
        <QuyUoc soDo={ban.soDo} />
      </>}
      {ban.chiaKhoa && <><h3 className="gyc-lgsd-muc">Chìa khoá của bài</h3><p><ChemText text={ban.chiaKhoa} /></p></>}
      {n > 0 && <>
        <h3 className="gyc-lgsd-muc">{n > 1 ? `Tính ${n} bước` : 'Một phép tính'} · chạm từng số để xem đến đó là gì</h3>
        {n > 1 ? <div className="gyc-buoc-tinh">{ban.buoc.map((b, i) => <ChuoiTinh key={i} buoc={b} stt={i + 1} nhieu hienKetQua />)}</div>
          : <ChuoiTinh buoc={ban.buoc[0]} stt={1} nhieu={false} hienKetQua />}
      </>}
      {ban.cauTuHoi && <p><ChemText text={ban.cauTuHoi} /></p>}
      {ban.ketQua && <div className="gyc-lgsd-ket">Kết quả: <ChemText text={ban.ketQua} /></div>}
    </div>
  )
}
