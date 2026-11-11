// NÚT GỬI NỔI của màn câu hỏi máy em (Bình Phản Ứng) — tách NGUYÊN VĂN khỏi ManBinhPhanUng.tsx 11/11 (cổng cỡ tệp: màn ấy chạm ngưỡng 60 KB khi thêm bố cục
// ngang «một bên đề một bên chọn đáp án»). Cùng mảnh nạp lười với màn ấy; kiểu `.bpu-gui-noi` ở bpu-hs.css.
import { useEffect, useState } from 'react'

/** NÚT GỬI NỔI (thầy 10/11 «chuyển nút gửi đáp án sang mép phải giữa màn hình, khi học sinh chọn hết thì tự bật ra, còn chưa chọn hết thì ẩn đi»):
 *  viên thuốc dọc màu đội dính mép phải, giữa chiều cao màn (`position: fixed`). Chọn đủ (trắc nghiệm: một phương án; đúng–sai: đủ 4 ý; trả lời ngắn: có số)
 *  ⇒ trượt từ mép vào + rõ dần + nảy nhẹ; bỏ chọn bớt ⇒ thu lại vào mép. Lần ĐẦU bật ra trong lượt ⇒ quầng sáng nhịp 2 lần (lớp `quang` giữ suốt lượt nên
 *  bật lại không nhấp nháy nữa; lượt mới ⇒ `key` mới ⇒ trạng thái mới). Lúc ẩn: vẫn nằm trong cây (để trượt ra / vào) nhưng `inert` + `aria-hidden` +
 *  `disabled` ⇒ không chạm, không Tab, máy đọc màn hình bỏ qua.
 *  KHÔNG CHE phương án / ý đúng–sai / bàn phím số: thân màn chừa lề phải đủ rộng cho nút (`.bpu-hs.co-gui .bpu-hs-than`, chừa suốt lúc có nút — kể cả lúc
 *  nút ẩn — để bật / ẩn không làm chữ chạy dòng dưới tay em). Nhờ lề ấy bàn phím số cũng nằm gọn bên trái nút ⇒ không cần đặt nút riêng trên bàn phím. */
export function NutGuiNoi({ hien, tuLuan, onGui }: { hien: boolean; tuLuan: boolean; onGui: () => void }) {
  // Gắn vào màn ở trạng thái ẨN rồi mới bật (một nhịp sau) ⇒ câu tự luận / câu vừa tới đã đủ chọn vẫn thấy nút trượt vào, không hiện bụp.
  const [vao, setVao] = useState(false)
  useEffect(() => { setVao(true) }, [])
  const mo = hien && vao
  const [quang, setQuang] = useState(false)
  useEffect(() => { if (mo) setQuang(true) }, [mo])
  return (
    <button type="button" className={`bpu-gui-noi${quang ? ' quang' : ''}`} data-hien={mo} aria-label={tuLuan ? 'Em làm xong' : 'Gửi đáp án'}
      aria-hidden={mo ? undefined : true} inert={!mo} tabIndex={mo ? undefined : -1} disabled={!mo} onClick={onGui}>
      {tuLuan
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.6 4.6L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3L10.2 13.8M21 3l-6.6 18-4.2-7.2L3 9.6 21 3z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      <span>{tuLuan ? 'Xong' : 'Gửi'}</span>
    </button>
  )
}
