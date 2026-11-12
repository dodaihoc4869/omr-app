// LUẬT RỜI MÀN — MÁY THẦY (bản vẽ 53): thẻ «Xin vào lại» — từng em bị mời ra (đội, số lần, giờ) với hai nút «Duyệt» / «Từ chối»; dòng các em đang bị
// nhắc (k/n); nút «Chép tin báo văn phòng» chép sẵn tin gửi Javis DDH để văn phòng trực live nhắn Zalo cho phụ huynh (app KHÔNG tự nhắn phụ huynh).
import { useState } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import { gioVnLuat as gioVn, tinBaoVanPhong, type LuatBang } from '../../lib/bpu/phong-luat'
import './luat-roi.css'

export default function LuatRoiThay({ luat, ds, onDuyet }: { luat: LuatBang; ds: readonly { sbd: string; ten: string; doi: number }[]; onDuyet: (sbd: string, ok: boolean) => void }) {
  const [daChep, setDaChep] = useState(false)
  const em = new Map(ds.map((e) => [e.sbd, e])), ten = (s: string): string => em.get(s)?.ten ?? s
  const nhac = Object.entries(luat.dem)
  if (!luat.ra.length && !luat.cam.length && !nhac.length && !luat.so.length) return null
  const chep = (): void => {
    const t = tinBaoVanPhong(luat, ten)
    void (navigator.clipboard?.writeText(t) ?? Promise.reject(new Error('không có bộ nhớ tạm'))).then(() => { setDaChep(true); setTimeout(() => setDaChep(false), 2200) }, () => { window.prompt('Chép tin này gửi Javis DDH:', t) })
  }
  const doi = (s: string): string => { const e = em.get(s); return e && DOI_BPU[e.doi] ? `${DOI_BPU[e.doi]!.ten} · ` : '' }
  return (
    <section className="lr-thay" aria-label="Luật rời màn" data-luat-roi="thay">
      {luat.ra.length ? <h4>Xin vào lại<em>{luat.ra.length} em</em></h4> : <h4>Luật rời màn{luat.bat ? ` · ${luat.n} lần` : ' · đang tắt'}</h4>}
      {luat.ra.map((r) => (
        <div key={r.sbd} className="lr-dong">
          <span><b>{ten(r.sbd)}</b><small>{doi(r.sbd)}bị mời ra lúc {gioVn(r.luc)} · {r.xin ? 'đang xin vào lại' : 'chưa xin vào lại'}</small></span>
          <button type="button" className="ok" onClick={() => onDuyet(r.sbd, true)}>Duyệt</button>
          <button type="button" className="tu" onClick={() => onDuyet(r.sbd, false)}>Từ chối</button>
        </div>
      ))}
      {luat.cam.map((r) => (
        <div key={r.sbd} className="lr-dong cam">
          <span><b>{ten(r.sbd)}</b><small>{doi(r.sbd)}đã từ chối lúc {gioVn(r.luc)} · không vào lại được tới hết buổi</small></span>
          <button type="button" className="ok" onClick={() => onDuyet(r.sbd, true)}>Cho vào lại</button>
        </div>
      ))}
      {nhac.length ? <p className="lr-nhac" style={{ margin: 0 }}>Đang bị nhắc: {nhac.map(([s, k], i) => <span key={s}>{i ? ' · ' : ''}{ten(s)} <u>{k}/{luat.n}</u></span>)}</p> : null}
      {luat.so.length || luat.cam.length ? <button type="button" className="chep" onClick={chep}>{daChep ? 'Đã chép' : `Chép tin báo văn phòng${luat.so.length ? ` (${luat.so.length} lượt)` : ''}`}</button> : null}
    </section>
  )
}
