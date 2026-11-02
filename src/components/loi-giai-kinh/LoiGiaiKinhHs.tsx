// LỜI GIẢI KÍNH ở màn học sinh — mảnh nạp lười: mở gói Kính đã tải sẵn trên máy (tai-san.ts), sắp theo đúng câu đã phát (phương án / ý có thể bị xáo),
// vẽ `LoiGiaiKinh`. Câu chưa có bản Kính (máy soạn chưa tới) ⇒ `duPhong` (lời giải đang có của câu).
import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  children?: ReactNode
}

export default function LoiGiaiKinhHs({ qid, phan, choices, ideas, dapAn, em, duPhong, children }: LoiGiaiKinhHsProps) {
  // Kết quả gắn với câu đã mở: đổi câu ⇒ chưa có kết quả (undefined) tới khi gói của câu mới mở xong — không setState đồng bộ trong effect.
  const khoa = `${qid}|${dapAn}`
  const [kq, setKq] = useState<{ khoa: string; ban: BanKinh | null } | null>(null)
  useEffect(() => {
    let con = true
    banKinhCua(qid).then((tho) => { if (con) setKq({ khoa, ban: tho ? xepTheoCauPhat(tho, { phan, choices, ideas, correct: dapAn }) : null }) }, () => { if (con) setKq({ khoa, ban: null }) })
    return () => { con = false }
  }, [khoa, qid, phan, choices, ideas, dapAn])
  const ban = kq && kq.khoa === khoa ? kq.ban : undefined
  // Gói đã trên máy (chỉ còn giải mã) ⇒ ô chờ ngắn; còn phải tải qua mạng ⇒ hiện lời giải cũ trong lúc chờ (giờ cao điểm D1 chậm, không để em nhìn ô trống).
  if (ban === undefined) return coGoiKinh(qid) ? <div className="lgk-cho" aria-busy="true" style={{ minHeight: 120 }} /> : <>{duPhong}</>
  if (!ban) return <>{duPhong}</>
  const luaChon = phan === 'I' ? choices : phan === 'II' ? ideas : undefined
  return <LoiGiaiKinh ban={ban} dapAn={dapAn} emTraLoi={em} luaChon={luaChon}>{children}</LoiGiaiKinh>
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
