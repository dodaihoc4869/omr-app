// LỜI GIẢI KÍNH ở màn học sinh — mảnh nạp lười: mở gói Kính đã tải sẵn trên máy (tai-san.ts), sắp theo đúng câu đã phát (phương án / ý có thể bị xáo),
// vẽ `LoiGiaiKinh`. Câu chưa có bản Kính (máy soạn chưa tới) ⇒ `duPhong` (lời giải đang có của câu).
import { useEffect, useState, type ReactNode } from 'react'
import LoiGiaiKinh from './LoiGiaiKinh'
import { banKinhCua } from '../../lib/loi-giai-kinh/tai-san'
import { xepTheoCauPhat } from '../../lib/loi-giai-kinh/kiem'
import type { BanKinh, PhanKinh } from '../../lib/loi-giai-kinh/kieu'

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
  if (ban === undefined) return <div className="lgk-cho" aria-busy="true" style={{ minHeight: 120 }} />
  if (!ban) return <>{duPhong}</>
  const luaChon = phan === 'I' ? choices : phan === 'II' ? ideas : undefined
  return <LoiGiaiKinh ban={ban} dapAn={dapAn} emTraLoi={em} luaChon={luaChon}>{children}</LoiGiaiKinh>
}
