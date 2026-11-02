// LỜI GIẢI KÍNH trong `TheCau` chế độ xem lại (app học sinh, thầy 02/11 «thay toàn bộ lời giải trong app học sinh bằng lời giải kiểu Kính»).
// Mảnh NẠP LƯỜI: TheCau nằm trong lượt mở app nên chỉ giữ một `lazy()` tới tệp này; phép đổi thứ tự gốc → thứ tự HIỆN và `LoiGiaiKinhHs` ở đây.
// TheCau giữ phương án / ý theo thứ tự GỐC (`choicePerm[viTríHiện] = gốc`, `yPerm` tương tự) và đáp án / câu em chọn theo chữ GỐC;
// `LoiGiaiKinhHs` cần mọi thứ theo thứ tự đang hiện. Thiếu đáp án ⇒ vẽ lời giải cũ (`duPhong`), không tải gì.
import { useMemo, type ReactNode } from 'react'
import LoiGiaiKinhHs from './LoiGiaiKinhHs'
import { kinhTheoHien, type TheCauChoKinh } from '../../lib/loi-giai-kinh/the-cau-hien'

export default function KinhTheCau({ qid, the, duPhong }: { qid: string; the: TheCauChoKinh; duPhong: ReactNode }) {
  // Khoá theo NỘI DUNG (không theo tham chiếu): màn cha vẽ lại theo đồng hồ / gõ phím không làm mở lại gói Kính.
  const khoa = JSON.stringify([the.phan, the.choices, the.choicePerm, the.ideas, the.yPerm, the.selected, the.correct])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hien = useMemo(() => kinhTheoHien(the), [khoa])
  if (!hien) return <>{duPhong}</>
  return <LoiGiaiKinhHs qid={qid} phan={the.phan} choices={hien.choices} ideas={hien.ideas} dapAn={hien.dapAn} em={hien.em} duPhong={duPhong} />
}
