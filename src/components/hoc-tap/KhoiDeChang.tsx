// KHỐI ĐỀ CỦA CHẶNG — MỘT NGUỒN cho màn làm chặng (ManLamBaiTap) và Bình Phản Ứng (thầy 10/11: «cho hiển thị đề giống với phần chặng luôn, có giám thị»).
// Gồm: giám thị theo mức câu + bong bóng đề (khung chữ L khi đề dài) · tranh minh hoạ phản ứng · thẻ «hình của đề vẽ lại». Tách NGUYÊN VĂN từ ManLamBaiTap
// (cùng thẻ, cùng lớp, cùng khoá) — màn chặng dựng ra DOM y như trước. Kiểu: giam-thi.css + trong-lam-bai.css, cần tổ tiên `.ht-app.ht2-lam.duo`.
// Tệp nằm CHUNG mảnh màn làm bài (chỉ ManLamBaiTap nhập tĩnh) ⇒ không thêm tệp precache; giám thị và hình vẽ lại vẫn là mảnh nạp lười riêng như cũ.
import { Fragment, lazy, Suspense, type ReactNode, type Ref } from 'react'
import type { Question } from '../../game/than-thu-v2/core'
import type { MucGT } from '../giam-thi/giam-thi-ve'
import type { KetGT } from '../giam-thi/GiamThi'
import { coHinhDe } from '../../lib/hinh-ve/co-hinh'
import { MinhHoaDe } from './minh-hoa-hoa'
// Giám thị theo mức câu (thầy chốt 27/10): mảnh lười + tờ riêng.
const GiamThiCau = lazy(() => import('../giam-thi/GiamThi'))
const HinhVeLaiCuaCau = lazy(() => import('../hinh-ve/HinhVeLaiCuaCau'))
/** Đề có «<số> gam|mol <tên chất>» ⇒ đáng thử vẽ cảnh. */
const coDangCanh = (text: string) => /\d\s*(?:gam|g|mol)\s+[A-Za-z(]/.test(text)

/** `children` = thân đề (màn chặng: `VungChamDe` bọc `DeCau`; Bình Phản Ứng: `DeCau` trơn — không gợi ý trong lượt thi đua).
 *  `muc` null (câu không có mức độ) ⇒ không giám thị, thân đề đứng một mình như cũ. `san` = khung `.duo-gt-san` (màn chặng chạy lại hiệu ứng trượt vào). */
export function KhoiDeChang({ q, muc, phien, nop, ket, vung, san, children }: {
  q: Pick<Question, 'qid' | 'text' | 'hinhAnh'>; muc: MucGT | null; phien: string; nop: boolean; ket: KetGT | null
  vung: () => HTMLElement | null; san?: Ref<HTMLDivElement>; children: ReactNode
}) {
  return <>
    {muc ? <div ref={san} className="duo-gt-san">
        <div className="duo-gt-loi-o" />{/* hàng riêng của bong bóng càu nhàu: không đè nhãn, đề, phương án */}
        <div className="duo-gt-nv"><Suspense fallback={null}><GiamThiCau muc={muc} qid={q.qid} phien={phien} nop={nop} ket={ket} vung={vung} /></Suspense></div>
        {/* chữ L (bong bóng gần trọn bề ngang, khuyết góc trái trên ôm giám thị) CHỈ khi chữ thật sự tràn xuống dưới chân giám thị — mảnh GiamThi đo rồi bật `data-l` */}
        <div key={`b${q.qid}`} className="duo-gt-bong"><svg className="duo-gt-vien" aria-hidden="true"><path /></svg><span className="duo-gt-cho" aria-hidden="true" />{children}</div>
      </div>
      : <Fragment key={`v${q.qid}`}>{children}</Fragment>}
    {coDangCanh(q.text) && <MinhHoaDe key={`m${q.qid}`} text={q.text} />}
    {coHinhDe(q.hinhAnh) && <Suspense fallback={null}><HinhVeLaiCuaCau qid={q.qid} hinh={q.hinhAnh} /></Suspense>}{/* thầy 03/11: hình của đề vẽ lại = thẻ riêng ở dưới */}
  </>
}
