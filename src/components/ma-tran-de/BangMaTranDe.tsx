// BẢNG "MA TRẬN ĐỀ" (BẢN DUYỆT V2 · màn 18) — chỉ ĐỌC, không đổi bộ câu, không đổi luật rút/chấm. Số đếm từ `dungMaTranDe` (src/lib/ma-tran-de.ts).
// `rut` = ca rút câu khi mở ⇒ bảng là ma trận của KHO câu đã chọn (máy rút đúng số câu từng phần lúc mở ca), ghi rõ để thầy không hiểu nhầm.
import { useMemo } from 'react'
import type { TeacherExamSource } from '../../data/examContent'
import { COT_MUC_DO, dungMaTranDe } from '../../lib/ma-tran-de'
import './ma-tran-de.css'

export default function BangMaTranDe({ nguon, rut }: { nguon: readonly TeacherExamSource[]; rut: boolean }) {
  const mt = useMemo(() => dungMaTranDe(nguon), [nguon])
  if (mt.tong === 0) return null
  const cot = COT_MUC_DO.filter((c) => c.k !== 'chua' || mt.cot.chua > 0)
  return (
    <section className="mtd" aria-labelledby="mtd-tieu">
      <div className="mtd-dau">
        <h3 id="mtd-tieu">Ma trận đề</h3>
        <span className="mtd-phu">{rut ? 'Kho câu đã chọn — máy rút câu khi mở ca' : `${mt.tong} câu theo chuyên đề × mức độ`}</span>
      </div>
      <div className="mtd-cuon">
        <table>
          <thead>
            <tr>
              <th scope="col">Chuyên đề</th>
              {cot.map((c) => (
                <th key={c.k} scope="col">
                  {c.nhan}
                </th>
              ))}
              <th scope="col">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {mt.hang.map((h) => (
              <tr key={h.chuyenDe}>
                <th scope="row">{h.chuyenDe}</th>
                {cot.map((c) => (
                  <td key={c.k} data-khong={h.o[c.k] === 0 ? 'true' : undefined}>
                    {h.o[c.k]}
                  </td>
                ))}
                <td className="mtd-tong">{h.tong}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Tổng</th>
              {cot.map((c) => (
                <td key={c.k}>{mt.cot[c.k]}</td>
              ))}
              <td className="mtd-tong">{mt.tong}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
