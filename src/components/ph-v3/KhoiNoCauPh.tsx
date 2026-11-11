// KHỐI «CON ĐANG NỢ N CÂU» trên trang Hôm nay của con (thầy 11/11: «Làm tiếp cho thầy và phụ huynh xem nợ câu từng em»). Mảnh LƯỜI — con không nợ thì
// không tải (luật tốc độ: đường mở app phụ huynh không nặng thêm). Đọc CHẶT ở đây; số do máy chủ tính bằng đúng luật của học sinh (server/src/no-cau-xem.ts).
import { chuLoaiNo, chuNoPhuHuynh, docNoCauXem } from '../../lib/no-cau-xem'
import './khoi-no-cau-ph.css'

export default function KhoiNoCauPh({ tho }: { tho: unknown }) {
  const nc = docNoCauXem(tho)
  if (!nc) return null
  return <div className="tvc-hn-no" data-vung="no-cau" data-het={nc.phaiTraHet || undefined} role="note">
    <p className="tvc-hn-no-dau"><b>Con đang nợ {nc.con} câu</b><span>{chuLoaiNo(nc)}</span></p>
    {chuNoPhuHuynh(nc).map((c) => <p key={c}>{c}</p>)}
  </div>
}
