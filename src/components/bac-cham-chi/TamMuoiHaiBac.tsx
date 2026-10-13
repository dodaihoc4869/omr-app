// TẤM "12 BẬC TỪ LƯỜI ĐẾN CHĂM" (13/10 đợt 19 — thầy: "bấm vào bậc này cho hiện đủ 12 bậc để học sinh biết rõ bao nhiêu bậc, nhớ hiển thị đẹp").
// NẠP KHI BẤM chip bậc (NutBac, ChipBac.tsx). Không lệnh máy chủ — chỉ `bacCham` đã có (bậc, điểm chăm, điểm còn thiếu) + bảng 12 bậc + ngưỡng của máy chủ.
//   · Đầu tấm: huy hiệu lớn 80 px của bậc hiện tại · "Bậc N/12 · Tên" · "Điểm chăm N/100" · "Còn N điểm lên <huy hiệu> <bậc kế>" (chỉ khi máy chủ có
//     `diemLenBac` — cùng luật thang bậc).
//   · Đủ 12 dòng chia ba nhóm có nhãn: Lười (bậc 1–5) · Chưa đều (6–7) · Chăm (8–12); mỗi dòng huy hiệu · "Bậc N" · tên · khoảng điểm (NGUONG_BAC) —
//     bậc 12 thêm "và đủ mức 7 ngày liền". Dòng hiện tại nổi bật + "Em đang ở đây" (phụ huynh: "Con đang ở đây"); bậc đã vượt hơi mờ, bậc cao hơn rõ nét.
//   · Cuối tấm MỘT dòng ngắn nói điểm chăm tính từ gì (thầy đã bỏ chữ hướng dẫn dài).
//   · Điện thoại dọc: tấm trượt từ dưới, cuộn được · xoay ngang / máy tính: hộp thoại giữa màn, máy tính 2 cột (khung + kiểu: KhungTam, tam-bac.css).
import type { KetQuaBac } from '../../lib/bac-cham-chi'
import { KHOANG_BAC } from '../../lib/bac-cham-chi'
import { TEN_NHOM_NHIP } from '../../../server/src/nhip-hoc-luat'
import { BAC_CHAM_CHI, chuBac, chuKhoangDiem, motBac, type XungBac } from './bac'
import HuyHieuBac from './HuyHieuBac'
import KhungTam from './KhungTam'
import './bac-cham-chi.css'

const NHOM = (['luoi', 'chua-deu', 'cham'] as const).map((n) => ({ n, ten: TEN_NHOM_NHIP[n], khoang: KHOANG_BAC[n] }))
/** MỘT dòng cuối tấm (`server/src/bac-cham-chi.ts`: D đủ mức · C khối lượng · B chuỗi · gần đây nặng hơn). */
export const CHU_CACH_TINH = 'Điểm chăm tính từ số ngày đủ mức, số câu đã làm so với mức và chuỗi ngày liền; ngày gần đây tính nặng hơn.'

export default function TamMuoiHaiBac({ kq, xung = 'em', lopBoc, traVe, onDong }: { kq: KetQuaBac; xung?: XungBac; lopBoc?: string; traVe?: HTMLElement | null; onDong: () => void }) {
  const hien = motBac(kq.bac)
  if (!hien) return null
  const ke = kq.diemLenBac !== null ? motBac(kq.bac + 1) : null
  const nhom = (i: number) => {
    const { n, ten, khoang } = NHOM[i]!
    return (
      <section key={n} className="bcc-tam-nhom" data-nhom={n}>
        <h3 className="bcc-tam-nhan">
          {ten} <small>bậc {khoang[0]}–{khoang[1]}</small>
        </h3>
        <ol className="bcc-tam-ds">
          {BAC_CHAM_CHI.slice(khoang[0] - 1, khoang[1]).map((b) => {
            const dang = b.so === hien.so
            return (
              <li key={b.so} className="bcc bcc-tam-bac" data-bac={b.so} data-trang={dang ? 'hien' : b.so < hien.so ? 'qua' : undefined} aria-current={dang ? 'true' : undefined}>
                <HuyHieuBac bac={b.so} co={dang ? 48 : 40} />
                <span className="bcc-tam-bac-chu">
                  <small>Bậc {b.so}</small>
                  <b>{b.ten}</b>
                  <span>{chuKhoangDiem(b.so)}</span>
                </span>
                {dang && <span className="bcc-tam-day">{xung === 'con' ? 'Con' : 'Em'} đang ở đây</span>}
              </li>
            )
          })}
        </ol>
      </section>
    )
  }
  return (
    <KhungTam kieu="12-bac" tieuDe="12 bậc từ Lười đến Chăm" onDong={onDong} traVe={traVe} lopBoc={lopBoc}>
      <div className="bcc bcc-tam-hien" data-bac={hien.so}>
        <HuyHieuBac bac={hien.so} co={80} />
        <div className="bcc-tam-hien-chu">
          <p className="bcc-tam-hien-ten">{chuBac(hien)}</p>
          <p className="bcc-tam-hien-diem">
            Điểm chăm <b>{kq.diem}</b>/100
          </p>
          {ke && kq.diemLenBac !== null && (
            <p className="bcc-len bcc-tam-len">
              Còn <b>{kq.diemLenBac}</b> điểm lên{' '}
              <span className="bcc-len-ke">
                <HuyHieuBac bac={ke.so} co={22} />
                {ke.ten}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="bcc-tam-cot">
        <div>
          {nhom(0)}
          {nhom(1)}
        </div>
        <div>{nhom(2)}</div>
      </div>
      <p className="bcc-tam-cach">{CHU_CACH_TINH}</p>
    </KhungTam>
  )
}
