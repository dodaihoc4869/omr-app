// SỐ LĂN kiểu đồng hồ cơ (thầy 27/10 «hiệu ứng kinh nghiệm … làm lại cho ngon như Duolingo»): mỗi chữ số là một dải 0–9 trượt dọc tới chữ số mới, luôn lăn
// TỚI (8 → 2 lăn qua 9, 0, 1 rồi về đúng chỗ, không nhảy cóc). Chỉ transform. Giảm chuyển động ⇒ đổi số ngay. Trình đọc màn hình đọc số ở phần tử cha.
import { useLayoutEffect, useRef, useState } from 'react'
import { yenLang } from '../../lib/hieu-ung'

const DAI = Array.from({ length: 20 }, (_, i) => i % 10)

function Cot({ so }: { so: number }) {
  // vt = vị trí trên dải 0..19; lăn tới so (hoặc so + 10 khi phải qua 9), xong thì về so (không chuyển cảnh)
  const [vt, setVt] = useState(so)
  const [tat, setTat] = useState(true)
  const cu = useRef(so)
  useLayoutEffect(() => {
    const truoc = cu.current % 10
    cu.current = so
    if (so === truoc) return
    if (yenLang()) { setTat(true); setVt(so); return }
    setTat(false); setVt(so >= truoc ? so : so + 10)
  }, [so])
  return <span className="so-lan-cot"><span className="so-lan-dai" data-tat={tat || undefined} style={{ transform: `translateY(${-vt * 5}%)` }}
    onTransitionEnd={() => { if (vt >= 10) { setTat(true); setVt(vt - 10) } }}>{DAI.map((d, i) => <i key={i}>{d}</i>)}</span></span>
}

export function SoLan({ v }: { v: number }) {
  const chu = String(Math.max(0, Math.round(v)))
  // cột tính từ phải sang (hàng đơn vị luôn là cột cuối) ⇒ thêm chữ số mới ở trái không làm các cột cũ lăn lại
  return <span className="so-lan" aria-hidden="true">{[...chu].map((c, i) => <Cot key={chu.length - i} so={Number(c)} />)}</span>
}
