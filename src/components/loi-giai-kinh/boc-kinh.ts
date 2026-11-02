// HÀM BỌC LỜI GIẢI KÍNH cho `TheCau` xem lại ở app HỌC SINH (thầy 02/11): `<TheCau … bocLoiGiai={bocKinh(qid)} />`.
// Câu có bản Kính ⇒ vẽ Kính (KinhTheCau, nạp lười); chưa có / nhãn nghi đáp án / câu tự luận ⇒ giữ lời giải cũ. App thầy / phụ huynh KHÔNG dùng.
// Tệp .ts (createElement): chỉ xuất hàm, không xuất thành phần.
import { createElement, lazy, Suspense, type ReactNode } from 'react'
import type { TheCauProps } from '../TheCau'

const KinhTheCau = lazy(() => import('./KinhTheCau'))

export function bocKinh(qid: string | null | undefined): TheCauProps['bocLoiGiai'] {
  if (!qid) return undefined
  return (cu: ReactNode, the: TheCauProps) =>
    the.nhanLoiGiai || (the.phan === 'III' && the.tuLuan) ? cu : createElement(Suspense, { fallback: cu }, createElement(KinhTheCau, { qid, the, duPhong: cu }))
}
