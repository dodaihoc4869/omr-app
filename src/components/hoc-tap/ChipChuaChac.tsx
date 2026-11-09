// Chip «Chưa chắc» trên câu SỬA (khối B lát 5, bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-5; thầy 09/11 «làm luôn để đẩy lên hết lúc 23h40»). Mặc định
// Chắc; chạm ⇒ bật (chạm lại tắt). Kho + luật: vi-sao-sai.ts. Kiểu: vi-sao-sai.css (nạp cùng mảnh kiểu màn làm bài).
import { datChuaChac, useChuaChac } from './vi-sao-sai'

export function ChipChuaChac({ qid }: { qid: string }) {
  const bat = useChuaChac(qid)
  return <button type="button" className="chip-chua-chac" aria-pressed={bat} title="Còn phân vân thì chạm — câu này sẽ quay lại ở ngày Sửa sau. Không trừ gì cả." onClick={() => datChuaChac(qid, !bat)}>Chưa chắc</button>
}
