// LIVE BẢNG — DẢI VIỆC CỦA LƯỢT trên bảng live (11/11, sửa chỗ lệch B3: «bảng live trên máy em đang che trò đoán / tiếp sức»; đặc tả 4.3c). Nạp lười cùng LopLive.
// Bảng live phủ kín màn Bình Phản Ứng nên các việc của lượt hiện ngay TRÊN bảng — DẢI MỎNG sát đáy, góc trái (thầy 11/11 lần 3: giấy + bảng phủ kín, dải không
// che quá một dòng); em đoán xong (hoặc thầy đã chấm) ⇒ thu về MỘT VIÊN NHỎ: tên bạn + điều em đoán + nút tiếp sức.
//   · thầy gọi bạn lên bảng ⇒ «Em đoán … làm đúng không?» + «Làm đúng» / «Chưa đúng» + «Tiếp sức» / «Cổ vũ» — cùng lệnh `doan` / `tiep` với màn thường;
//   · thầy chấm / mở đáp án ⇒ kết quả lên bảng + kết quả của em (đúng / chưa đúng, kJ);
//   · em vừa gửi (đã tự về bảng live) ⇒ «Đã gửi · n/m bạn đã gửi»; hết giờ chưa gửi ⇒ «Hết giờ — câu này để trống».
// AN TOÀN: chỉ dùng `viewEm.luot` — đáp án đúng không có ở đây trước khi thầy mở; dải KHÔNG in đáp án kể cả sau khi mở (chỉ đúng / chưa đúng + kJ).
import type { ReactNode } from 'react'
import { DOI_BPU, kyHieu, tenNgan, type ViewEm } from '../../lib/bpu/phong'

export interface DuLieuLuot {
  l: NonNullable<ViewEm['luot']>
  /** Số báo danh + đội của em đang cầm máy. */
  sbd: string
  doi: number
  /** Em vừa bấm gửi trên máy (phòng chưa kịp báo lại). */
  daGuiMay: boolean
  /** Live theo khối: em đang ở bảng mà VẪN còn được trả lời (tấm chọn đang hiện) ⇒ không báo «Hết giờ». */
  conLam?: boolean
  /** (không còn vẽ trên dải từ 12/11 — con dấu thay) Nhãn kết quả lên bảng do màn Bình Phản Ứng dựng sẵn. */
  ketQuaBang?: ReactNode
  gui: (tin: { t: string; v?: number }) => unknown
}
const dauKj = (n: number): string => (n > 0 ? `+${n.toLocaleString('vi-VN')}` : n < 0 ? `−${Math.abs(n).toLocaleString('vi-VN')}` : '0')

/** Nội dung dải; null ⇒ không có gì để hiện (LopLive không vẽ dải). */
export function daiLuot({ l, sbd, doi, daGuiMay, gui, conLam }: DuLieuLuot): ReactNode {
  const g = l.goi
  if ((l.pha === 'goi' || l.pha === 'lam-bang') && g && g.sbd !== sbd) {
    const khoa = g.emDoan !== null || g.dat != null, mau = { ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }
    const tiep = <button type="button" className="tiep" style={mau} disabled={g.emTiep >= 10} onClick={() => gui({ t: 'tiep' })}>{g.doi === doi ? 'Tiếp sức' : 'Cổ vũ'} · {g.emTiep}/10</button>
    // đã đoán / thầy đã chấm ⇒ viên nhỏ (hai nút đoán đã khoá thì không cần chiếm chỗ trên giấy nữa)
    if (khoa) return (
      <>
        <b className="ky" style={mau}>{kyHieu(g.ten)}</b>
        <span className="ten">{g.emDoan === null ? `${tenNgan(g.ten)} đang lên bảng` : `Em đoán ${tenNgan(g.ten)} ${g.emDoan === 1 ? 'làm đúng' : 'chưa đúng'}`}</span>
        {tiep}
      </>
    )
    return (
      <>
        <b className="ky" style={mau}>{kyHieu(g.ten)}</b>
        <span className="ten">Em đoán {tenNgan(g.ten)} làm đúng không?</span>
        <button type="button" onClick={() => gui({ t: 'doan', v: 1 })}>Làm đúng</button>
        <button type="button" onClick={() => gui({ t: 'doan', v: 0 })}>Chưa đúng</button>
        {tiep}
      </>
    )
  }
  if (l.pha === 'mo' || (g && g.dat != null)) {
    const k = l.pha === 'mo' ? l.ketQua : null, kb = !!l.emTra?.kb
    const cuaEm = l.pha !== 'mo' || l.tuLuan ? null
      : kb ? { kq: '', chu: `Em đã báo chưa biết làm${k ? ` · ${dauKj(k.kj)} kJ` : ''}` }
      : !l.emTra ? { kq: 'sai', chu: 'Em chưa gửi câu này' }
      : k?.dung ? { kq: 'dung', chu: `Chính xác! ${dauKj(k.kj)} kJ` } : { kq: 'sai', chu: `Chưa đúng${k && k.kj ? ` · ${dauKj(k.kj)} kJ` : ''}` }
    // (thầy 12/11 «bỏ thẻ chưa đạt ở dưới đi») kết quả lên bảng nay là CON DẤU đóng giữa màn (TamTra.tsx `DauDat`) ⇒ dải chỉ còn kết quả của chính em
    return cuaEm ? <span className="kq" data-kq={cuaEm.kq || undefined}>{cuaEm.chu}</span> : null
  }
  if (l.pha === 'tra-loi') {
    const daGui = !!l.emTra || daGuiMay
    if (!daGui && conLam) return null // em đang chọn: dải chọn đáp án trên đề đã ghi «n/m bạn đã gửi»
    return <span className="kq">{daGui ? `${l.emTra?.kb ? 'Em đã báo chưa biết làm' : l.tuLuan ? 'Đã báo thầy em làm xong' : 'Đã gửi'} · ${l.daGui}/${l.coMat} bạn đã ${l.tuLuan ? 'xong' : 'gửi'}` : 'Hết giờ — câu này để trống'}</span>
  }
  return null
}
