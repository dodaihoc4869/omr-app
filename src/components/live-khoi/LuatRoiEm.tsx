// LUẬT RỜI MÀN — MÁY EM (thầy chốt build 13/11, bản vẽ 49–54):
//  · thầy vừa bật luật ⇒ thẻ nhỏ báo cả lớp (7 giây);
//  · em rời rồi quay lại ⇒ «Em vừa rời màn hình lần k. Rời thêm … lần nữa, em sẽ bị mời ra khỏi lớp và Thầy báo phụ huynh.» (8 giây, tính từ lúc em nhìn thấy);
//  · đủ số lần ⇒ màn phủ «Em đã bị mời ra khỏi lớp · Đã gửi thông báo cho phụ huynh» + «Xin vào lại» ⇒ «Đang chờ Thầy duyệt»; thầy TỪ CHỐI ⇒ em bị cấm tới hết buổi, máy em ra màn Hôm nay (em-khoi.ts lo).
// Chữ gửi học sinh theo bộ quy tắc của thầy (xưng Thầy, không rào đón).
import { useEffect, useState } from 'react'
import type { LuatEm } from '../../lib/bpu/phong-luat'
import './luat-roi.css'

const HIEN_BAT_MS = 7000, HIEN_LAN_MS = 8000

export default function LuatRoiEm({ luat, onXin }: { luat: LuatEm | null; onXin: () => void }) {
  const tu = luat?.tu ?? 0, da = luat?.da ?? 0, ra = !!luat?.ra
  // `bat` = giờ bật luật đang được báo · `lan` = lần rời đang được nhắc (0 = không hiện). Suy ra ngay lúc vẽ khi bản xem của phòng đổi.
  const [nho, setNho] = useState({ tu: 0, da: 0, bat: 0, lan: 0 })
  if (nho.tu !== tu || nho.da !== da) {
    const moi = { ...nho, tu, da }
    if (tu && tu !== nho.tu && !ra) moi.bat = tu
    if (!tu) { moi.bat = 0; moi.lan = 0 }
    if (da > nho.da && !ra && (!nho.tu || nho.tu === tu)) moi.lan = da
    setNho(moi)
  }
  const { bat, lan } = nho
  useEffect(() => { if (!bat) return; const h = setTimeout(() => setNho((c) => ({ ...c, bat: 0 })), HIEN_BAT_MS); return () => clearTimeout(h) }, [bat])
  // nhắc «lần k»: chỉ bắt đầu đếm 8 giây khi em ĐANG nhìn màn (em rời xong mới quay lại)
  useEffect(() => {
    if (!lan) return
    let h: ReturnType<typeof setTimeout> | undefined
    const chay = () => { clearTimeout(h); if (!document.hidden) h = setTimeout(() => setNho((c) => ({ ...c, lan: 0 })), HIEN_LAN_MS) }
    chay()
    document.addEventListener('visibilitychange', chay)
    return () => { clearTimeout(h); document.removeEventListener('visibilitychange', chay) }
  }, [lan])
  if (!luat) return null
  if (ra) return (
    <div className="lr-phu" role="alertdialog" aria-label="Em đã bị mời ra khỏi lớp" data-luat-roi="ra">
      <div className="lr-the">
        <i aria-hidden="true">!</i>
        <h3>{luat.cam ? 'Thầy không duyệt cho em vào lại' : 'Em đã bị mời ra khỏi lớp'}</h3>
        {luat.cam ? <p>Em không vào lại được buổi live này.</p> : <p>Em rời màn hình {luat.n} lần trong buổi này.</p>}
        <p className="ph">Đã gửi thông báo cho phụ huynh.</p>
        {luat.cam ? null : luat.xin ? <span className="lr-cho"><s aria-hidden="true" />Đang chờ Thầy duyệt</span>
          : <><p>Muốn học tiếp, em bấm Xin vào lại và chờ Thầy duyệt.</p><button type="button" onClick={onXin}>Xin vào lại</button></>}
      </div>
    </div>
  )
  if (lan) return (
    <div className="lr-bao lan" role="alert" data-luat-roi="lan">
      <i aria-hidden="true">{lan}</i>
      <span><b>Em vừa rời màn hình lần {lan}</b><p>Rời thêm {Math.max(1, luat.n - lan)} lần nữa, em sẽ bị mời ra khỏi lớp và Thầy báo phụ huynh.</p>
        <span className="lr-vach" aria-hidden="true">{Array.from({ length: luat.n }, (_, i) => <s key={i} data-da={i < lan ? '' : undefined} />)}</span></span>
    </div>
  )
  if (bat) return (
    <div className="lr-bao" role="status" data-luat-roi="bat">
      <i aria-hidden="true">!</i>
      <span><b>Thầy vừa bật luật rời màn hình</b><p>Từ giờ tới hết buổi, em rời app {luat.n} lần sẽ bị mời ra khỏi lớp và Thầy báo phụ huynh.</p></span>
    </div>
  )
  return null
}
