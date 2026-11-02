// HÀM BỌC LỜI GIẢI KÍNH cho `TheCau` xem lại ở app HỌC SINH (thầy 02/11): `<TheCau … bocLoiGiai={bocKinh(qid)} />`.
// Câu có bản Kính ⇒ vẽ Kính (KinhTheCau trong LoiGiaiKinhHs.tsx, nạp lười); chưa có / nhãn nghi đáp án / câu tự luận ⇒ giữ lời giải cũ. App thầy / phụ huynh KHÔNG dùng.
// Tệp .ts (createElement): chỉ xuất hàm, không xuất thành phần.
import { createElement, lazy, Suspense, type ReactNode } from 'react'
import type { TheCauProps } from '../TheCau'
import { docTokenHs } from '../../lib/loi-giai-api'

const KinhTheCau = lazy(() => import('./LoiGiaiKinhHs').then((m) => ({ default: m.KinhTheCau })))

/** Tải NỀN gói Kính cho danh sách câu em đã được xem lời giải (vd «Câu đã làm»: thẻ mở từng cái, khỏi chờ mạng mỗi lần mở). Lỗi im lặng. */
export function taiKinhNen(qids: readonly string[]): void {
  // tai-san ở kho chạy-lúc (#774) ⇒ nạp động, không để màn có precache phụ thuộc tĩnh vào nó.
  void import('../../lib/loi-giai-kinh/tai-san').then((m) => { for (let i = 0; i < qids.length; i += 80) void m.taiSanKinh(docTokenHs(), qids.slice(i, i + 80)) }, () => {})
}

export function bocKinh(qid: string | null | undefined): TheCauProps['bocLoiGiai'] {
  if (!qid) return undefined
  return (cu: ReactNode, the: TheCauProps) =>
    the.nhanLoiGiai || (the.phan === 'III' && the.tuLuan) ? cu : createElement(Suspense, { fallback: cu }, createElement(KinhTheCau, { qid, the, duPhong: cu }))
}
