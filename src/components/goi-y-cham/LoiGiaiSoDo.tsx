// LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY (sau khi nộp) — thầy 26/10: «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ này của tôi».
// Vẽ ĐỦ bản (đề nói gì · tóm tắt · chuỗi tính có kết quả · kết quả cuối) trong đúng khung «LỜI GIẢI» của KhoiLoiGiaiChuan (cùng lớp .loi-giai),
// rồi lý do từng phương án / ý (DongLyDo, cùng luật ✓/✗ như khối chuẩn) và phần chèn thêm (hình sau lời giải). Nạp qua KhoiLoiGiaiCoSoDo
// (thay-bang-so-do.tsx) khi kết quả nộp có `soDo`; bản hỏng / thiếu ⇒ hiện `duPhong` (lời giải cũ như cũ).
import type { ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { DongLyDo, type KhoiLoiGiaiChuanProps } from '../loi-giai/KhoiLoiGiaiChuan'
import { docBanSoDo } from '../../lib/goi-y-cham/api'
import { ChuoiTinh, QuyUoc, SoDoThay, ThiNghiemAo } from './so-do-thay'
import './goi-y-cham.css'

/** Lý do từng phương án (Phần I) / từng ý (Phần II) — chép đúng luật của KhoiLoiGiaiChuan (hoán vị, ✓/✗ theo đáp án đang chấm). */
function LyDo({ phan, loiGiai: lg, correct, choicePerm, yPerm, phuongAn, daChon }: KhoiLoiGiaiChuanProps) {
  const dap = typeof correct === 'string' ? correct.toUpperCase() : ''
  if (lg && phan === 'I' && lg.tungPa) {
    return <div>{(choicePerm?.length === 4 ? choicePerm : [0, 1, 2, 3]).map((goc, viTri) => {
      const k = 'ABCD'[goc] as 'A' | 'B' | 'C' | 'D'
      return <DongLyDo key={k} dung={dap ? dap === k : !!lg.tungPa?.[k]?.dung} ma={`${'ABCD'[viTri]}.`} chu={lg.tungPa?.[k]?.viSao} phuongAn={phuongAn?.[goc]} emChon={!!daChon && daChon.toUpperCase() === k} />
    })}</div>
  }
  if (lg && phan === 'II' && lg.tungY) {
    const ds = (typeof correct === 'string' ? [...dap.replace(/Đ/g, 'D')] : [...(correct ?? [])]).map((x) => (x === 'D' || x === 'S' ? x : null))
    const du = ds.length === 4 && ds.every(Boolean)
    return <div>{(yPerm?.length === 4 ? yPerm : [0, 1, 2, 3]).map((i, viTri) => {
      const k = (['a', 'b', 'c', 'd'] as const)[i]
      return <DongLyDo key={k} dung={du ? ds[i] === 'D' : !!lg.tungY?.[k]?.dung} ma={`${'abcd'[viTri]})`} chu={lg.tungY?.[k]?.viSao} />
    })}</div>
  }
  return null
}

export default function LoiGiaiSoDo({ ban: tho, duPhong = null, ...p }: Partial<KhoiLoiGiaiChuanProps> & { ban: unknown; duPhong?: ReactNode }) {
  const ban = docBanSoDo(tho, true)
  if (!ban) return <>{duPhong}</>
  const than = <ThanSoDo ban={ban} />
  if (!p.phan) return than
  return (
    <div className="loi-giai" data-giu-dong={p.giuDong ? '1' : undefined}>
      <div className="loi-giai-nhan lg-nhan">LỜI GIẢI</div>
      {than}
      <LyDo {...(p as KhoiLoiGiaiChuanProps)} />
      {p.children}
    </div>
  )
}

function ThanSoDo({ ban }: { ban: NonNullable<ReturnType<typeof docBanSoDo>> }) {
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
        <h3 className="gyc-lgsd-muc">{n > 1 ? `Tính ${n} bước` : 'Một phép tính'}</h3>
        {n > 1 ? <div className="gyc-buoc-tinh">{ban.buoc.map((b, i) => <ChuoiTinh key={i} buoc={b} stt={i + 1} nhieu hienKetQua />)}</div>
          : <ChuoiTinh buoc={ban.buoc[0]} stt={1} nhieu={false} hienKetQua />}
      </>}
      {ban.cauTuHoi && <p><ChemText text={ban.cauTuHoi} /></p>}
      {ban.ketQua && <div className="gyc-lgsd-ket">Kết quả: <ChemText text={ban.ketQua} /></div>}
    </div>
  )
}
