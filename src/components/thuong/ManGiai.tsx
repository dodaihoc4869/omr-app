// GIẢI TUẦN (bản vẽ tp-7) · MÀN CUỐI TUẦN (tp-8) — thầy chốt 26/10. Đọc /hs/giai (hợp đồng 4.4: nhóm ~20 bạn, tên + lớp, KHÔNG số báo danh, KHÔNG nhãn)
// và thông báo `cuoi_tuan` của /hs/thuong. Công tắc «giải tuần» tắt ⇒ màn ẩn hẳn. Màn KHÔNG nói bảng tính lượt nào (học sinh không biết, đặc tả mục 4.4).
// Hiệu ứng: E1 hàng của em trượt tới thứ hạng mới, các hàng khác dịch theo (FLIP) + số hạng lật (hạng cũ nhớ ở máy) · E2 lên hạng: huy hiệu rơi, xoay
// lấp lánh, hoa giấy, Bi mừng, rồi tinh thể bay vào bộ đếm · E3 rơi hạng: huy hiệu trượt xuống, Bi buồn, không hoa giấy · giữ hạng: huy hiệu nảy nhẹ.
import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Trophy } from 'lucide-react'
import { Bi } from '../linh-vat/Bi'
import { bayToi, bungHat, demSo, hoaGiay, hoatAnh, latSo, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { DUONG, HANG_GIAI, THUONG_LEN_HANG, chuConLai, hangSau, hangTruoc, layBangGiai, type HangGiai, type ThongBao, type TongQuanThuong } from '../../lib/thuong-api'
import { HuyHieuKimLoai, IcNguyenTu, IcTinhThe, TEN_HANG, Tia } from './hinh'
import { useTai, useTongQuan } from './dung-thuong'
import { Cho, DemTT, Loi, ManToan, NutDay, chuCai, congNgay, ngayNgan, oTinhThe, useHieuUng } from './chung'
import { nhanLop } from './ban-gon'
import { DauVe } from './ManChuoi'

export const LUAT_GIAI = [
  'Tuần tính từ thứ Hai 00:00 đến Chủ nhật 22:00.',
  'Xếp hạng theo nguyên tử em kiếm trong tuần.',
  'Top 5 lên hạng. 4 bạn cuối rơi hạng. Giải Sắt không rơi nữa.',
  'Tuần nào chưa có nguyên tử thì em chưa vào bảng tuần đó.',
] as const
const KHO_HANG = 'ddh.thuong.hang-giai'
function docHangCu(): { thuHang: number; nguyenTu: number } | null {
  try { const v = JSON.parse(localStorage.getItem(KHO_HANG) || 'null'); return v && typeof v.thuHang === 'number' ? v : null } catch { return null }
}
function ghiHangCu(v: { thuHang: number; nguyenTu: number }) { try { localStorage.setItem(KHO_HANG, JSON.stringify(v)) } catch { /* bỏ qua */ } }

/** Màn Giải tuần (tp-7). `tuHang` = thứ hạng trước (để chạy FLIP); vắng ⇒ lấy hạng em thấy lần trước trên máy này. */
export function ManGiaiTuan({ token, onVe, tuHang }: { token?: string; onVe?: () => void; tuHang?: { thuHang: number; nguyenTu: number } }) {
  const tq = useTongQuan(token).du
  const tat = tq?.bat.giai === false
  const { du: g, tai, loi, thuLai } = useTai(token, DUONG.giai, layBangGiai, !tat)
  const bxh = useRef<HTMLDivElement>(null)
  const em = g?.nhom.find((x) => x.laEm)
  useHieuUng((h) => {
    if (!em || !bxh.current) return
    const cu = tuHang ?? docHangCu()
    ghiHangCu({ thuHang: em.thuHang, nguyenTu: em.nguyenTu })
    if (!cu || cu.thuHang <= em.thuHang) return
    const hang = (n: number) => bxh.current!.querySelector<HTMLElement>(`[data-h="${n}"]`)
    const r = hang(em.thuHang), dich = hang(cu.thuHang)
    if (!r || !dich) return
    const d = dich.getBoundingClientRect().top - r.getBoundingClientRect().top
    phanHoiThuong('giuHang')
    hoatAnh(r, [{ transform: `translateY(${d}px) scale(1)` }, { transform: `translateY(${d}px) scale(1.03)`, offset: 0.25 }, { transform: 'translateY(0) scale(1.03)', offset: 0.85 }, { transform: 'none' }], 900, { tre: 300, e: 'cubic-bezier(.5,0,.2,1)' })
    const cao = r.getBoundingClientRect().height
    for (let n = em.thuHang + 1; n <= cu.thuHang; n++) {
      const x = hang(n)
      hoatAnh(x, [{ transform: `translateY(${-cao}px)` }, { transform: `translateY(${-cao}px)`, offset: 0.25 }, { transform: 'none' }], 900, { tre: 300, e: 'cubic-bezier(.5,0,.2,1)' })
      h.sau(800, () => latSo(x?.querySelector('.h') as HTMLElement | null, String(n - 1), String(n), 420))
    }
    void demSo(r.querySelector<HTMLElement>('.so-nt'), cu.nguyenTu, em.nguyenTu, 600)
    h.sau(800, () => latSo(r.querySelector<HTMLElement>('.h'), String(cu.thuHang), String(em.thuHang), 420))
    h.sau(1150, () => bungHat(r.querySelector('.tp-av'), { n: 10, r: 60 }))
  }, [em?.thuHang])
  if (tat || g?.tat) return null
  if (!g) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho so={4} /> : <Loi chu={loi || 'Chưa xem được giải tuần.'} onThuLai={thuLai} />}</div>
  const sau = hangSau(g.hang), truoc = hangTruoc(g.hang), n = g.nhom.length
  const vung = (th: number) => (g.len > 0 && th <= g.len ? 'len' : g.roi > 0 && n > g.len + g.roi && th > n - g.roi ? 'roi' : undefined)
  const iEm = HANG_GIAI.indexOf(g.hang)
  return <div className="tp-goc tp-vo" data-man="giai">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div className="tp-luoi-giai">
      <section className="tp-the g-ben" aria-label="Giải tuần">
        <div className="tp-hang6" role="img" aria-label={`Sáu hạng giải, em đang ở ${TEN_HANG[g.hang]}`}>
          {HANG_GIAI.map((x, i) => <HuyHieuKimLoai key={x} hang={x} an khoa={i > iEm} className={i === iEm ? 'on' : ''} />)}
        </div>
        <div className="tp-dau-giai"><h1>Giải {TEN_HANG[g.hang]}</h1>{g.hetHanGiay !== undefined && <span className="tp-dong-ho"><Clock aria-hidden="true" />{chuConLai(g.hetHanGiay)}</span>}</div>
        <p className="tp-phu">{[sau && g.len > 0 && `Top ${g.len} lên Giải ${TEN_HANG[sau]}`, truoc && g.roi > 0 && `${g.roi} bạn cuối xuống Giải ${TEN_HANG[truoc]}`].filter(Boolean).join(' · ') || 'Giữ vững hạng của em nhé'}</p>
      </section>
      {n === 0
        ? <div className="tp-trong g-bxh"><Bi cam="chao" size={88} /><b>Tuần này em chưa vào bảng</b><span>Học 1 chặng để có nguyên tử đầu tiên — em sẽ vào nhóm cùng hạng.</span></div>
        : <div ref={bxh} className="tp-bxh g-bxh" role="list" aria-label={`Bảng xếp hạng nhóm ${TEN_HANG[g.hang]}`}>
          {g.nhom.map((r, i) => {
            const v = vung(r.thuHang)
            const rows = [<div key={r.thuHang + r.ten} className="r" role="listitem" data-h={r.thuHang} data-vung={v} data-em={r.laEm || undefined}
              aria-label={`Hạng ${r.thuHang}: ${r.laEm ? 'Em, ' : ''}${r.ten}${r.lop ? `, ${nhanLop(r.lop)}` : ''}, ${r.nguyenTu} nguyên tử`}>
              <span className="h tp-lat">{r.thuHang}</span>
              <span className="tp-av" data-k={r.laEm ? '0' : String((i % 4) + 1)} aria-hidden="true">{chuCai(r.ten)}</span>
              <div className="ten"><b>{r.ten}{r.laEm && <span className="tp-chu-em">Em</span>}</b>{r.lop && <small>{nhanLop(r.lop)}</small>}</div>
              <span className="d"><span className="so-nt">{r.nguyenTu.toLocaleString('vi-VN')}</span> <IcNguyenTu /></span>
            </div>]
            if (v === 'len' && r.thuHang === g.len && n > g.len) rows.push(<div key="vl" className="vach" aria-hidden="true"><ChevronUp aria-hidden="true" />Vùng lên hạng · {g.len} bạn phía trên</div>)
            if (v === 'roi' && r.thuHang === n - g.roi + 1) rows.unshift(<div key="vr" className="vach" data-vung="roi" aria-hidden="true"><ChevronDown aria-hidden="true" />Vùng rơi hạng · {g.roi} bạn cuối</div>)
            return rows
          })}
        </div>}
      <section className="tp-the g-ben" aria-label="Luật giải">
        <h2>Luật giải tuần</h2>
        <ol className="tp-luat">{LUAT_GIAI.map((l, i) => <li key={i}><b>{i + 1}</b><span>{l}</span></li>)}</ol>
      </section>
      <section className="tp-the g-ben" aria-label="Thưởng lên hạng">
        <h2>Thưởng lên hạng</h2>
        <div className="tp-thuong5">{HANG_GIAI.slice(1).map((x) => <div key={x}><HuyHieuKimLoai hang={x} an />{TEN_HANG[x]}<b>+{THUONG_LEN_HANG[x]} <IcTinhThe /></b></div>)}</div>
        <p className="tp-phu" style={{ fontSize: 13.5 }}>Giải Kim cương: top 3 nhận huy hiệu «Quán quân».</p>
      </section>
    </div>
  </div>
}

/** Đọc thông báo `cuoi_tuan` (máy chủ: {tuan, ket, hangCu, hangMoi, thuHang, soNguoi, tinhThe, quanQuan?}; nguyenTu / soNgay tuỳ chọn). */
export function docCuoiTuan(tb: ThongBao) {
  const d = tb.duLieu
  const la = (x: unknown): x is HangGiai => HANG_GIAI.includes(x as HangGiai)
  const so = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.round(x) : undefined)
  const hangCu = la(d.hangCu) ? d.hangCu : undefined, hangMoi = la(d.hangMoi) ? d.hangMoi : hangCu
  if (!hangMoi) return null
  const iCu = hangCu ? HANG_GIAI.indexOf(hangCu) : -1, iMoi = HANG_GIAI.indexOf(hangMoi)
  const ket: 'len' | 'giu' | 'roi' = d.ket === 'len' || d.ket === 'giu' || d.ket === 'roi' ? d.ket : iCu < 0 || iCu === iMoi ? 'giu' : iMoi > iCu ? 'len' : 'roi'
  return { ket, hangCu, hangMoi, tuan: typeof d.tuan === 'string' ? d.tuan.slice(0, 10) : undefined, thuHang: so(d.thuHang), soNguoi: so(d.soNguoi), tinhThe: so(d.tinhThe) ?? 0,
    nguyenTu: so(d.nguyenTu), soNgay: so(d.soNgay), quanQuan: d.quanQuan === true }
}

/** Màn phủ cuối tuần (tp-8). */
export function ManCuoiTuan({ tb, tq, onDong }: { tb: ThongBao; tq: TongQuanThuong; onDong: () => void }) {
  const k = docCuoiTuan(tb)
  const hh = useRef<HTMLDivElement>(null), cu = useRef<HTMLDivElement>(null), bi = useRef<HTMLDivElement>(null), qua = useRef<HTMLSpanElement>(null)
  const tt = k?.ket === 'len' ? k.tinhThe : 0
  const [dem, setDem] = useState(tq.tinhThe !== undefined ? Math.max(0, tq.tinhThe - tt) : undefined)
  useHieuUng((h) => {
    if (!k) return
    if (k.ket === 'len') {
      phanHoiThuong('lenHang')
      hoatAnh(hh.current, [{ transform: 'translateY(-320px) rotate(-20deg)', opacity: 0 }, { transform: 'translateY(0) rotate(4deg)', opacity: 1, offset: 0.45 }, { transform: 'translateY(-26px) rotate(-2deg)', offset: 0.6 }, { transform: 'translateY(0)', offset: 0.72 }, { transform: 'perspective(400px) rotateY(360deg)', offset: 1 }], 1600, { e: 'ease-out' })
      hoatAnh(document.querySelector('.tp-toan .tp-tia'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], 700, { tre: 700 })
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-16px)' }, { transform: 'translateY(0)' }], 1000, { tre: 750 })
      h.sau(720, () => { hoaGiay(36, 1400); bungHat(hh.current, { n: 12, r: 120, mau: ['vang', 'sao', 'trang'] }) })
      if (tt > 0 && tq.tinhThe !== undefined) h.sau(1700, () => void bayToi(qua.current, oTinhThe(), { n: 8 }).then(() => setDem(tq.tinhThe)))
    } else if (k.ket === 'roi') {
      phanHoiThuong('roiHang')
      hoatAnh(cu.current, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(0)', opacity: 1, offset: 0.3 }, { transform: 'translateY(60px) scale(.85)', opacity: 0 }], 900, { e: 'ease-in', fill: 'forwards' })
      hoatAnh(hh.current, [{ transform: 'translateY(-30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500, { tre: 650 })
      hoatAnh(bi.current, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(6px) rotate(-6deg)' }, { transform: 'translateY(4px) rotate(4deg)' }, { transform: 'none' }], 900, { tre: 300 })
    } else {
      phanHoiThuong('giuHang')
      hoatAnh(hh.current, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1 }, { transform: 'none', opacity: 1 }], 600)
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], 500, { tre: 400 })
    }
  }, [])
  if (!k) return null
  const ten = TEN_HANG[k.hangMoi]
  const sau = hangSau(k.hangMoi), truoc = k.hangCu
  const tieuDe = k.ket === 'len' ? `Lên Giải ${ten}!` : k.ket === 'roi' ? `Xuống Giải ${ten}` : `Giữ Giải ${ten}`
  const hangChu = k.thuHang ? `${k.thuHang}${k.soNguoi ? `/${k.soNguoi}` : ''}` : undefined
  const phu = k.ket === 'len' ? `${hangChu ? `Em đứng hạng ${hangChu} nhóm${truoc ? ` ${TEN_HANG[truoc]}` : ''}. ` : ''}Tuần sau thi cùng các bạn Giải ${ten}.`
    : k.ket === 'roi' ? `Tuần mới, làm lại từ đầu nhé.${truoc ? ` Vào top 5 Giải ${ten} là về lại ${TEN_HANG[truoc]}.` : ''}`
    : `${hangChu ? `Em đứng hạng ${hangChu} nhóm ${ten}. ` : ''}${sau ? `Tuần sau vào top 5 là lên Giải ${TEN_HANG[sau]}.` : 'Giữ vững ngôi đầu nhé!'}`
  return <ManToan nhan="Giải tuần đã chốt" onDong={onDong} demTT={dem !== undefined ? <DemTT gt={dem} /> : undefined}
    day={<NutDay chu={tt > 0 ? `Nhận ${tt} tinh thể` : 'Vào tuần mới'} sac={tt > 0 ? 'tt' : undefined} onClick={onDong} />}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh tp-hinh-to">
          {k.ket === 'len' && <Tia className="quay vang" />}
          {k.ket === 'roi' && truoc && <div ref={cu} className="hh-to"><HuyHieuKimLoai hang={truoc} an /></div>}
          <div ref={hh} className="hh-to"><HuyHieuKimLoai hang={k.hangMoi} /></div>
          <div ref={bi} className="bi-o"><Bi cam={k.ket === 'len' ? 'mung' : k.ket === 'roi' ? 'sai' : 'vui'} size={100} /></div>
        </div>
        {k.tuan && <p className="tp-nhan">Tuần {ngayNgan(k.tuan)} – {ngayNgan(congNgay(k.tuan, 6))} đã chốt</p>}
        <h1 style={k.ket === 'len' ? { color: 'var(--tp-kl-vang-2)' } : undefined}>{tieuDe}</h1>
        <p className="tp-phu">{phu}</p>
      </div>
      <div className="cot-b">
        {tt > 0 && <section className="tp-the" aria-label="Thưởng lên hạng"><div className="tp-thuong-lon"><span ref={qua} className="tp-o" data-sac="tt"><IcTinhThe /></span><div><b>+{tt} tinh thể</b><span>thưởng lên Giải {ten}</span></div></div></section>}
        {k.quanQuan && <section className="tp-the" aria-label="Quán quân"><div className="tp-thuong-lon"><span className="tp-o" data-sac="sao"><Trophy aria-hidden="true" /></span><div><b>Huy hiệu «Quán quân»</b><span>top 3 Giải Kim cương</span></div></div></section>}
        <section className="tp-the" aria-label="Tuần của em">
          <h2>Tuần của em</h2>
          <div className="tp-so4">
            {hangChu && <div><span>Hạng trong nhóm</span><b>{hangChu}</b></div>}
            {k.nguyenTu !== undefined && <div><span>Nguyên tử tuần</span><b>{k.nguyenTu.toLocaleString('vi-VN')} <IcNguyenTu /></b></div>}
            {k.soNgay !== undefined && <div><span>Ngày học trong tuần</span><b>{Math.min(7, k.soNgay)}/7</b></div>}
            <div><span>Giải tuần sau</span><b style={k.ket === 'len' ? { color: 'var(--tp-kl-vang-2)' } : k.ket === 'roi' ? { color: 'var(--tp-kl-dong-2)' } : undefined}>{ten}</b></div>
          </div>
        </section>
      </div>
    </main>
  </ManToan>
}
