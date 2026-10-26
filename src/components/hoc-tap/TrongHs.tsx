// GIAO DIỆN «TRONG» · APP HỌC SINH — phần trình bày RIÊNG của bản vẽ thầy chốt 26/10 (ve-moi/hs-hom-nay.html, hs-menu-phai.html), NẠP LƯỜI qua
// nap-trong-hs.ts (chỉ khi `<html data-trong>`): thẻ Hôm nay có vòng tiến độ. Cùng số, cùng chữ, cùng nút, cùng lệnh với bản cũ —
// chỉ đổi trình bày. Kiểu ở styles/trong-hs.css (nạp cùng mảnh này ⇒ vẽ là đã có kiểu).
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Flame } from 'lucide-react'
import { CAU_MOI_CHANG, soChangXong } from './lam-bai'
import { chiaChang, chuNutHoc, ChipNhom, XuongNhip, type PropsTheHomNayEm } from './TheHomNayEm'
import BangNhipHoc from './BangNhipHoc'
import type { KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'
import '../../styles/trong-hs.css'

/** GIAO DIỆN «TRONG» (bản vẽ hs-hom-nay.html, thầy chốt 26/10): thẻ Hôm nay = vòng tiến độ x/M câu (CSS conic-gradient, --p là số thật) · chip "Còn N câu"
 *  (+ "Chuỗi N ngày" khi `/hs/nhip-hoc` có chuỗi) · bài · việc · vạch chặng · MỘT nút học. Nhịp học tách thành thẻ riêng (cột phụ ở máy tính, qua cổng
 *  React vào `noiNhip`). Cùng số, cùng chữ, cùng nút với bản cũ — chỉ đổi trình bày. */
export function HomNayTrong({ p, k, nhip }: { p: PropsTheHomNayEm; k: KetQuaNhipHocEm | null; nhip: KetQuaNhipHocEm | 'tai' | 'an' }) {
  const so = p.so
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0
  const chang = so ? chiaChang(so) : []
  const xong = so ? soChangXong(so) : 0
  const pct = so && so.muc > 0 ? Math.min(100, Math.round((100 * so.daLam) / so.muc)) : 0
  const chuoi = k?.chuoiDuGanNhat ?? 0
  const xuong = !so && p.dangTai
  const theNhip = nhip === 'an' ? null : (
    <section className="ht2-hn tr-nhip" data-nhom={k?.nhom} aria-labelledby="tr-nhip-tieu" aria-busy={nhip === 'tai'}>
      <div className="tr-the-dau">
        <h2 id="tr-nhip-tieu">Nhịp học của em</h2>
        {k ? <ChipNhom k={k} /> : <span className="ht2-hn-chip-xuong" aria-hidden="true" />}
      </div>
      {k ? <BangNhipHoc k={k} onMoHoSo={p.onMoHoSo} /> : <XuongNhip />}
    </section>
  )
  return (
    <>
      <section className="ht2-hn tr-hero" aria-label="Hôm nay của em" aria-busy={xuong}>
        <div className="tr-hero-than">
          {xuong ? <span className="tr-vong tr-vong-xuong" aria-hidden="true" /> : so && (
            <div className="tr-vong" style={{ '--p': pct } as CSSProperties} role="img" aria-label={`Đã làm ${so.daLam}/${so.muc} câu hôm nay`}>
              <b>{so.daLam}<small>/{so.muc}</small></b>
              <span>câu hôm nay</span>
            </div>
          )}
          <div className="tr-hero-chu">
            {(so || chuoi > 0) && (
              <div className="tr-chips">
                {so && (du
                  ? <span className="tr-chip" data-sac="dung"><Check size={14} strokeWidth={3} aria-hidden="true" />Đủ mức hôm nay</span>
                  : <span className="tr-chip" data-sac="chu-y">Còn {con} câu</span>)}
                {chuoi > 0 && <span className="tr-chip" data-sac="sao"><Flame size={14} aria-hidden="true" />Chuỗi {chuoi} ngày</span>}
              </div>
            )}
            {p.tenBai && <h2 className="tr-hero-ten">{p.tenBai}</h2>}
            {xuong ? <div className="ht2-hn-xuong" aria-hidden="true"><span style={{ width: '70%', height: 18 }} /></div>
              : !so ? <p className="tr-hero-phu">Số câu hôm nay sẽ hiện khi bài học tải xong.</p>
              : du ? <p className="tr-hero-phu">Đã làm <b>{so.daLam}/{so.muc}</b> câu hôm nay · em có thể nghỉ.</p>
              : p.viec && <p className="tr-hero-phu">{p.viec}</p>}
          </div>
        </div>
        <div className="tr-hero-duoi">
          {so && chang.length > 0 && (
            <>
              <div className="ht2-hn-vach" role="progressbar" aria-label="Tiến độ hôm nay" aria-valuemin={0} aria-valuemax={so.muc} aria-valuenow={Math.min(so.daLam, so.muc)}
                aria-valuetext={`Đã làm ${so.daLam} trên ${so.muc} câu · xong ${xong} trong ${chang.length} chặng`}>
                {chang.map((c, i) => (
                  <i key={i} data-tt={c.tt} style={{ flexGrow: c.co }}>
                    {c.tt === 'dang' && c.phan > 0 && <span style={{ transform: `scaleX(${c.phan / 100})` }} />}
                  </i>
                ))}
              </div>
              <p className="ht2-hn-chang"><span>Xong {xong}/{chang.length} chặng</span><span>mỗi chặng tối đa {CAU_MOI_CHANG} câu</span></p>
            </>
          )}
          <button type="button" className="ht2-hn-nut" data-phu={p.nutPhu || du || undefined} onClick={p.onHoc} disabled={p.khoaHoc}>
            {chuNutHoc(so, p.hetCau, { choBoSung: p.choBoSung, sanSang: p.sanSang })}
            {!p.hetCau && <ArrowRight size={20} aria-hidden="true" />}
          </button>
        </div>
      </section>
      {theNhip && (p.noiNhip ? createPortal(theNhip, p.noiNhip) : theNhip)}
    </>
  )
}


