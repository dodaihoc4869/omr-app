// Lời giải câu ở màn làm chặng, có thêm `soDo` (thầy 26/10: «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ»).
// Tệp RIÊNG (không nằm trong thay-bang-so-do.tsx / LamCau.tsx): hai tệp đó nằm trong lượt mở app — thêm nhập vào đó làm /hs /gv /p /t nặng thêm (kiem:toc-do đỏ, đo 26/10).
import type { ReactNode } from 'react'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { HinhTaiViTri } from '../QuestionMedia'
import type { Question } from '../../game/than-thu-v2/core'
import { KhoiLoiGiaiCoSoDo } from './thay-bang-so-do'
/**
 * Bản `LoiGiaiCau` (src/components/hoc-tap/LamCau.tsx) có thêm `soDo` — cho màn làm chặng: đổi `<LoiGiaiCau … />` thành
 * `<LoiGiaiCauCoSoDo … soDo={k.soDo} />` (k = kết quả `/game-v2/answer`, làn C trả `soDo` khi câu có bản sơ đồ đạt cổng kiểm).
 * Để riêng ở đây (không sửa LamCau) vì LamCau nằm trong lượt mở app HS: thêm nhập vào đó làm /hs, /gv, /p nặng thêm ~0,1 KB (kiem:toc-do đỏ, đo 26/10).
 */
export default function LoiGiaiCauCoSoDo({ q, solution, dapAn, hinhLoiGiai, soDo, children }: { q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh']; soDo?: unknown; children?: ReactNode }) {
  return (
    <section className="ht2-lam-loi-giai" aria-label="Lời giải">
      <KhoiLoiGiaiCoSoDo phan={q.phan} loiGiai={loiGiaiChuanTuKho(solution, q.phan, dapAn)} explanation={typeof solution === 'string' ? solution : undefined} correct={dapAn} soDo={soDo}>
        <HinhTaiViTri hinhAnh={hinhLoiGiai as Parameters<typeof HinhTaiViTri>[0]['hinhAnh']} viTri="sau_loi_giai" nhan="lời giải" />
        {children}
      </KhoiLoiGiaiCoSoDo>
    </section>
  )
}
