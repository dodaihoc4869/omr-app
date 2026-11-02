// LỜI GIẢI KÍNH ở màn học sinh — mảnh nạp lười: mở gói Kính đã tải sẵn trên máy (tai-san.ts), sắp theo đúng câu đã phát (phương án / ý có thể bị xáo),
// vẽ `LoiGiaiKinh`. Câu chưa có bản Kính (máy soạn chưa tới) ⇒ `duPhong` (lời giải đang có của câu).
// Thầy 03/11 «lời giải cũ ẩn về một nút lời giải thu gọn ở trên đầu lời giải mới»: đang mở gói ⇒ khung chờ kính (KHÔNG hiện lời giải cũ trước rồi mới chuyển);
// có bản Kính ⇒ nút «Lời giải thu gọn» (đóng sẵn, chỉ dựng lời giải cũ khi em bấm mở) + bản Kính; máy chủ không có bản ⇒ lời giải cũ như trước.
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import LoiGiaiKinh from './LoiGiaiKinh'
import { banKinhCua, coGoiKinh } from '../../lib/loi-giai-kinh/tai-san'
import { xepTheoCauPhat } from '../../lib/loi-giai-kinh/kiem'
import type { BanKinh, PhanKinh } from '../../lib/loi-giai-kinh/kieu'
import { kinhTheoHien, type TheCauChoKinh } from '../../lib/loi-giai-kinh/the-cau-hien'

export interface LoiGiaiKinhHsProps {
  qid: string
  phan: PhanKinh
  /** chữ phương án (I) / ý (II) đúng như đã hiện cho em */
  choices?: readonly string[]
  ideas?: readonly string[]
  /** đáp án đang chấm theo thứ tự hiển thị */
  dapAn: string
  /** câu trả lời của em (thứ tự hiển thị) */
  em?: string | ReadonlyArray<string | null>
  duPhong: ReactNode
  /** chỗ trống trên thanh tiêu đề hộp «Lời giải» (cạnh nút đóng): có ⇒ nút «Lời giải thu gọn» nằm trên thanh; vắng ⇒ hàng nút ở đầu bản Kính */
  kheNut?: HTMLElement | null
  children?: ReactNode
}

export default function LoiGiaiKinhHs({ qid, phan, choices, ideas, dapAn, em, duPhong, kheNut, children }: LoiGiaiKinhHsProps) {
  // Kết quả gắn với câu đã mở: đổi câu ⇒ chưa có kết quả (undefined) tới khi gói của câu mới mở xong — không setState đồng bộ trong effect.
  const khoa = `${qid}|${dapAn}`
  const [kq, setKq] = useState<{ khoa: string; ban: BanKinh | null } | null>(null)
  const [moKhoa, setMoKhoa] = useState<string | null>(null)
  const id = useId()
  useEffect(() => {
    let con = true
    banKinhCua(qid).then((tho) => { if (con) setKq({ khoa, ban: tho ? xepTheoCauPhat(tho, { phan, choices, ideas, correct: dapAn }) : null }) }, () => { if (con) setKq({ khoa, ban: null }) })
    return () => { con = false }
  }, [khoa, qid, phan, choices, ideas, dapAn])
  const ban = kq && kq.khoa === khoa ? kq.ban : undefined
  if (ban === null) return <>{duPhong}</>
  const luaChon = phan === 'I' ? choices : phan === 'II' ? ideas : undefined
  const mo = moKhoa === khoa
  // Gói đã trên máy (chỉ còn giải mã) ⇒ khung chờ ngắn. Còn phải tải qua mạng (giờ cao điểm D1 chậm) ⇒ khung chờ + nút thu gọn, em vẫn mở được lời giải cũ ngay.
  const coNut = !!ban || !coGoiKinh(qid)
  const nut = coNut ? <NutThuGon mo={mo} id={id} trenThanh={!!kheNut} onBam={() => setMoKhoa(mo ? null : khoa)} /> : null
  const than = mo ? <div id={id} className="lgk-tg-than">{duPhong}</div> : null
  return (
    <div className="lgk-boc">
      {nut && kheNut ? <>{createPortal(nut, kheNut)}{than && <div className="lgk-tg" data-mo="">{than}</div>}</>
        : nut && <div className="lgk-tg" data-mo={mo ? '' : undefined}>{nut}{than}</div>}
      {ban ? <LoiGiaiKinh ban={ban} dapAn={dapAn} emTraLoi={em} luaChon={luaChon}>{children}</LoiGiaiKinh> : <KhungChoKinh />}
    </div>
  )
}

/** Khung chờ trong lúc mở gói Kính: hai tấm kính tĩnh (không lặp chuyển động), đúng chỗ bản Kính sẽ hiện. */
function KhungChoKinh() {
  return <div className="lgk-cho" role="status" aria-busy="true"><span className="lgk-sr">Đang mở lời giải</span><i /><i /></div>
}

/** Nút «Lời giải thu gọn»: đóng sẵn, bấm mới dựng lời giải cũ. `trenThanh` ⇒ viên gọn trên thanh tiêu đề «Lời giải» (sát nút đóng); vắng ⇒ hàng kính đầu bản Kính. */
function NutThuGon({ mo, id, trenThanh, onBam }: { mo: boolean; id: string; trenThanh: boolean; onBam: () => void }) {
  const muiTen = <svg className="lgk-tg-mui" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  const bieuTuong = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h9M5 18h12" /></svg>
  if (trenThanh) return (
    <button type="button" className="lgk-tg-vien" aria-label="Lời giải thu gọn" aria-expanded={mo} aria-controls={id} onClick={onBam}>
      {bieuTuong}<span className="lgk-tg-dai"><span>Lời giải</span> <span>thu gọn</span></span>{muiTen}
    </button>
  )
  return (
    <button type="button" className="lgk-tg-nut" aria-expanded={mo} aria-controls={id} onClick={onBam}>
      <span className="lgk-tg-oi" aria-hidden="true">{bieuTuong}</span>
      <span className="lgk-tg-chu"><b>Lời giải thu gọn</b><span>{mo ? 'Bấm để thu lại' : 'Bấm để xem lời giải ngắn'}</span></span>
      {muiTen}
    </button>
  )
}

/**
 * Bọc khối lời giải của `TheCau` xem lại (app học sinh — `bocKinh` ở boc-kinh.ts nạp lười thành phần này).
 * TheCau giữ phương án / ý theo thứ tự GỐC (`choicePerm[viTríHiện] = gốc`, `yPerm` tương tự) và đáp án / câu em chọn theo chữ GỐC;
 * `kinhTheoHien` đổi sang thứ tự HIỆN. Thiếu đáp án ⇒ lời giải cũ, không tải gì. Cùng tệp với LoiGiaiKinhHs để chung MỘT mảnh nạp lười.
 */
export function KinhTheCau({ qid, the, duPhong }: { qid: string; the: TheCauChoKinh; duPhong: ReactNode }) {
  // Khoá theo NỘI DUNG (không theo tham chiếu): màn cha vẽ lại theo đồng hồ / gõ phím không làm mở lại gói Kính.
  const khoa = JSON.stringify([the.phan, the.choices, the.choicePerm, the.ideas, the.yPerm, the.selected, the.correct])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hien = useMemo(() => kinhTheoHien(the), [khoa])
  if (!hien) return <>{duPhong}</>
  return <LoiGiaiKinhHs qid={qid} phan={the.phan} choices={hien.choices} ideas={hien.ideas} dapAn={hien.dapAn} em={hien.em} duPhong={duPhong} />
}
