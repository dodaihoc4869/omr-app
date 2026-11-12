// LUẬT RỜI MÀN — MÁY THẦY (bản vẽ 53): thẻ «Xin vào lại» — từng em bị mời ra (đội, số lần, giờ) với hai nút «Duyệt» / «Từ chối»; dòng các em đang bị
// nhắc (k/n). Thầy 13/11: «bỏ phần chép tin báo văn phòng … văn phòng tự biết, tôi tập trung live» ⇒ không còn nút chép; phòng tự ghi sổ `live_moi_ra`,
// văn phòng (Javis DDH) tự đọc qua `/gv/bpu/moi-ra` rồi nhắn Zalo cho phụ huynh (app KHÔNG tự nhắn phụ huynh).
import { DOI_BPU } from '../../lib/bpu/phong'
import { gioVnLuat as gioVn, type LuatBang } from '../../lib/bpu/phong-luat'
import './luat-roi.css'

export default function LuatRoiThay({ luat, ds, onDuyet }: { luat: LuatBang; ds: readonly { sbd: string; ten: string; doi: number }[]; onDuyet: (sbd: string, ok: boolean) => void }) {
  const em = new Map(ds.map((e) => [e.sbd, e])), ten = (s: string): string => em.get(s)?.ten ?? s
  const nhac = Object.entries(luat.dem)
  if (!luat.ra.length && !luat.cam.length && !nhac.length) return null
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
    </section>
  )
}
