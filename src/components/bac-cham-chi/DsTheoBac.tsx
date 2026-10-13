// TẤM "BẬC N · TÊN · K EM" — Nhịp học của thầy (13/10 đợt 19 — thầy: "phần này cho tôi bấm vào từng bậc sẽ hiện ra danh sách siêu đẹp của từng học sinh
// đó"). Mở khi bấm một ô của dải đếm (DaiDemBac); NẠP KHI BẤM. Số CHỈ từ `/gv/nhip-hoc` đã tải (dòng em đã có `bacCham`) — không lệnh máy chủ mới.
//   · Tiêu đề "Bậc N · Tên · K em"; đầu tấm: huy hiệu lớn + khoảng điểm chăm của bậc (không lặp tên / số em của tiêu đề).
//   · Mỗi em MỘT thẻ gọn: chữ cái tên · tên · lớp · điểm chăm (số + vạch 0–100 màu bậc) · "Đủ mức x/y ngày" · "Chuỗi N ngày". Thứ tự: điểm chăm thấp → cao
//     (nơi mở đã xếp — `xepTheoBac`). Bấm thẻ ⇒ Hồ sơ làm bài của em (cùng lối dòng em ở Nhịp học). Danh sách dài: `content-visibility: auto`.
//   · Điện thoại dọc: tấm trượt từ dưới · ngang / máy tính: hộp thoại, lưới 2–3 cột (KhungTam + tam-bac.css). Tấm nằm DƯỚI Hồ sơ (`tang="duoi"`):
//     Hồ sơ mở chồng lên, đóng Hồ sơ là về đúng danh sách.
import type { DongNhipHoc } from '../../lib/nhip-hoc-thay'
import { chuCaiTen } from '../chien-dich/nhip-hanh-trinh'
import { chuBac, chuKhoangDiem, motBac } from './bac'
import HuyHieuBac from './HuyHieuBac'
import KhungTam from './KhungTam'
import './bac-cham-chi.css'

/** Câu trình đọc màn hình của một thẻ em. */
const chuTheEm = (d: DongNhipHoc): string =>
  `${d.hoTen}${d.lop ? `, ${d.lop}` : ''}: điểm chăm ${d.bacCham?.diem ?? 0}/100, đủ mức ${d.soNgayDu}/${d.soNgayQua} ngày, chuỗi ${d.chuoiDuGanNhat} ngày — xem hồ sơ làm bài`

export default function DsTheoBac(p: {
  bac: number
  ds: readonly DongNhipHoc[]
  traVe?: HTMLElement | null
  phu?: boolean
  onMoEm: (d: DongNhipHoc, nut: HTMLButtonElement) => void
  onDong: () => void
}) {
  const b = motBac(p.bac)
  if (!b) return null
  return (
    <KhungTam kieu="ds-bac" tang="duoi" tieuDe={`Bậc ${b.so} · ${b.ten} · ${p.ds.length} em`} onDong={p.onDong} traVe={p.traVe} phu={p.phu} lopBoc="m3 m3-thay vo-thay">
      <div className="bcc bcc-tam-hien" data-bac={b.so}>
        <HuyHieuBac bac={b.so} co={72} />
        <div className="bcc-tam-hien-chu">
          <p className="bcc-tam-hien-ten">Điểm chăm {chuKhoangDiem(b.so).replace(/^điểm /, '')}</p>
          <p className="bcc-tam-hien-diem">Xếp điểm chăm từ thấp đến cao</p>
        </div>
      </div>
      <ol className="bcc-ds" aria-label={`Em ở ${chuBac(b)}, điểm chăm thấp đến cao`}>
        {p.ds.map((d) => {
          const diem = d.bacCham?.diem ?? 0
          return (
            <li key={d.sbd} className="bcc bcc-ds-o" data-bac={b.so}>
              <button type="button" className="bcc-ds-em" data-sbd={d.sbd} onClick={(ev) => p.onMoEm(d, ev.currentTarget)} aria-label={chuTheEm(d)}>
                <span className="bcc-ds-av" aria-hidden="true">
                  {chuCaiTen(d.hoTen)}
                </span>
                <span className="bcc-ds-ten">
                  <b>{d.hoTen}</b>
                  {d.lop && <small>{d.lop}</small>}
                </span>
                <span className="bcc-ds-diem">
                  <b>{diem}</b>
                  <small>điểm chăm</small>
                </span>
                <span className="bcc-ds-vach" aria-hidden="true">
                  <i style={{ inlineSize: `${Math.max(2, Math.min(100, diem))}%` }} />
                </span>
                <span className="bcc-ds-so">
                  Đủ mức {d.soNgayDu}/{d.soNgayQua} ngày · Chuỗi {d.chuoiDuGanNhat} ngày
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </KhungTam>
  )
}
