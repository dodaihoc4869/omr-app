// TẤM GIỮ CHÂN (mảnh nạp lười — GiuChan.tsx nạp sẵn khi vào màn Duo). Theo ảnh Duolingo thầy gửi 27/10: nền mờ, tấm đáy trượt lên có vạch kéo, linh vật
// buồn rưng rưng (Bi cảm xúc «sai» + hai giọt nước mắt vẽ chồng bằng CSS — không sửa Bi), chữ to lời nhắn theo số liệu thật, nút 3D «Tiếp tục học»,
// chữ đỏ «Thoát». Chạm nền mờ = học tiếp. Mở ⇒ con trỏ vào «Tiếp tục học»; đóng ⇒ trả con trỏ về chỗ cũ.
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Bi } from '../linh-vat/Bi'
import '../../styles/trong-giu-chan.css'

export default function TamGiuChan({ tieuDe, phu, onTiep, onThoat }: { tieuDe: string; phu: readonly string[]; onTiep: () => void; onThoat: () => void }) {
  const id = useId()
  const nut = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const truoc = document.activeElement instanceof HTMLElement ? document.activeElement : null
    nut.current?.focus({ preventScroll: true })
    return () => { if (truoc?.isConnected) truoc.focus({ preventScroll: true }) }
  }, [])
  // Giữ Tab trong tấm (hai nút).
  const giuTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const ds = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const dau = ds[0], cuoi = ds[ds.length - 1]
    if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi?.focus() }
    else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau?.focus() }
  }
  return <div className="giu">
    <div className="giu-nen" aria-hidden="true" onClick={onTiep} />
    <section className="giu-tam" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={phu.length ? `${id}-p` : undefined} onKeyDown={giuTab}>
      <span className="giu-keo" aria-hidden="true" />
      <div className="giu-bi" aria-hidden="true"><Bi cam="sai" size={124} nhip="yen" /><i /><i /></div>
      <h2 id={`${id}-t`} className="giu-tieu">{tieuDe}</h2>
      {phu.length > 0 && <div id={`${id}-p`} className="giu-phu">{phu.map((p) => <p key={p}>{p}</p>)}</div>}
      <div className="giu-nut">
        <button ref={nut} type="button" className="duo-nut" onClick={onTiep}>Tiếp tục học</button>
        <button type="button" className="giu-thoat" onClick={onThoat}>Thoát</button>
      </div>
    </section>
  </div>
}
