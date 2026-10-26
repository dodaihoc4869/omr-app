// GIAO DIỆN «TRONG» · APP HỌC SINH — phần trình bày RIÊNG của bản vẽ thầy chốt 26/10 (ve-moi/hs-hom-nay.html, hs-menu-phai.html), NẠP LƯỜI qua
// nap-trong-hs.ts (chỉ khi `<html data-trong>`): thẻ Hôm nay có vòng tiến độ + menu dọc mép phải. Cùng số, cùng chữ, cùng nút, cùng lệnh với bản cũ —
// chỉ đổi trình bày. Kiểu ở styles/trong-hs.css (nạp cùng mảnh này ⇒ vẽ là đã có kiểu).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, ClipboardCheck, Flame, RefreshCw, type LucideIcon } from 'lucide-react'
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


/** MENU DỌC MÉP PHẢI (bản vẽ hs-menu-phai, thầy chốt 26/10): gộp thanh trên (logo, Vào ca kiểm tra, chuông, cập nhật, ảnh «Của em») + menu 4 mục.
 *  Thu gọn = MỘT vạch nhỏ giữa mép phải (chấm đỏ khi có tin chưa đọc — CSS :has đọc số của chuông thật). Chạm ⇒ thẻ menu ra, nền sau mờ; chạm ngoài /
 *  chọn mục / Esc / cuộn trang ⇒ thu lại. Mở ⇒ tiêu điểm vào mục đầu; Esc, chạm ngoài, chọn mục ⇒ trả tiêu điểm về vạch. Chuông = ĐÚNG phần tử
 *  ThongBaoHocSinh (giữ hành vi + số chưa đọc), phủ cả dòng; menu luôn gắn trong DOM (ẩn bằng CSS) để tấm thông báo mở từ đây không mất. */
export function MenuDocTrong(p: {
  muc: string; ds: readonly { id: string; ten: string; icon: LucideIcon }[]; onMuc: (id: string) => void
  coCa: boolean; onThi: () => void; thongBao?: ReactNode; dangTai: boolean; onTaiLai: () => void
  chuDau: string; moCuaEm: boolean; onCuaEm: () => void; nutCuaEm: RefObject<HTMLButtonElement | null>
}) {
  const [mo, setMo] = useState(false)
  const nut = useRef<HTMLButtonElement>(null)
  const the = useRef<HTMLElement>(null)
  const dong = (traVe: boolean) => { setMo(false); if (traVe) nut.current?.focus() }
  useEffect(() => {
    if (!mo) return
    the.current?.querySelector<HTMLElement>('.tr-menu-muc')?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMo(false); nut.current?.focus() } }
    const cuon = () => setMo(false)
    window.addEventListener('keydown', phim)
    window.addEventListener('scroll', cuon, { passive: true })
    return () => { window.removeEventListener('keydown', phim); window.removeEventListener('scroll', cuon) }
  }, [mo])
  return <>
    <button ref={nut} type="button" className="tr-menu-cham" aria-label="Mở menu" aria-expanded={mo} aria-controls="tr-menu" onClick={() => setMo(true)}><i /><s /></button>
    {mo && <div className="tr-menu-phu" onClick={() => dong(true)} aria-hidden="true" />}
    <nav ref={the} id="tr-menu" className="tr-menu" data-mo={mo || undefined} aria-label="Điều hướng học sinh">
      <a className="tr-menu-dau" href="/hs"><img src={`${import.meta.env.BASE_URL}logo-hs-nho-v3.svg`} width={26} height={26} alt="" draggable={false} />Đỗ Đại Học</a>
      {p.ds.map(({ id, ten, icon: Icon }) => <button key={id} type="button" className="tr-menu-muc" onClick={() => { p.onMuc(id); dong(true) }} aria-current={p.muc === id ? 'page' : undefined}><Icon size={20} aria-hidden="true" />{ten}</button>)}
      <hr className="tr-menu-vach" />
      {!p.coCa && <button type="button" className="tr-menu-muc" onClick={() => { dong(true); p.onThi() }}><ClipboardCheck size={20} aria-hidden="true" />Vào ca kiểm tra</button>}
      {p.thongBao && <div className="tr-menu-muc tr-menu-tb" onClickCapture={(e) => { if ((e.target as Element).closest?.('.m3-tb-chuong')) dong(false) }}>{p.thongBao}<span aria-hidden="true">Thông báo</span></div>}
      <button type="button" className="tr-menu-muc" onClick={() => { dong(true); p.onTaiLai() }} disabled={p.dangTai}><RefreshCw size={20} aria-hidden="true" />Cập nhật bài học</button>
      <button ref={p.nutCuaEm} type="button" className="tr-menu-muc" onClick={() => { dong(false); p.onCuaEm() }} aria-haspopup="dialog" aria-expanded={p.moCuaEm}><span className="tr-menu-anh" aria-hidden="true">{p.chuDau}</span>Của em</button>
    </nav>
  </>
}
