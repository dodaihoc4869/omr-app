// LỚP PHỦ DOM của trò «Sinh Tồn · Trang vở» (tách khỏi TroSinhTon.tsx 13/11, chỉ dời mã — DOM / lớp CSS / chữ y nguyên): băng dính điểm, tin trận, dải truy nã,
// thanh cấp súng, thẻ nhặt hộp, nhãn biểu cảm, con dấu câu hô, thẻ bị hạ, thẻ cuối ván / bảng vàng máy em, bục bảng vàng máy thầy, hình bé ma `AnhMa`.
// Chỉ TroSinhTon.tsx nhập (tĩnh) ⇒ nằm chung mảnh lười TroSinhTon. Khoá (`key`) để hiện lại hoạt hoạ đặt ở chỗ gọi, như cũ.
import { useEffect, useRef } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import { CAP_TOI_DA, SUNG_TEN, type Diem, type LoaiHop } from '../../lib/live-khoi/sinh-ton-loi'
import { BoHinh, type BangMau } from './sinh-ton-hinh'
import { BIEU_CAM, KY_BIEU_CAM, THE_HOP, XEP_DOI, duoiBiHa } from './sinh-ton-ve'
import { bienDoi } from './sinh-ton-tien-ich'

export interface ManhTin { c: string; doi?: number; noi?: boolean }
export interface TinTran { id: number; het: number; manh: ManhTin[] }
export interface Bao { kieu: 'meo' | 'an' | 'canh' | 'vui'; chu: string }
export interface BiHa { ai: string; doi: number; giay: number }
export interface KetQua { van: number; hang: { doi: number; diem: number; nhat: string; xep: number }[] }
/** Câu hô dạng con dấu đỏ (vàng cho câu mừng). */
export interface Dau { id: number; chu: string; phu: string; vang: boolean }
/** Dải báo truy nã thủ khoa (ảnh 07). */
export interface TruyNa { id: number; ten: string; ha: number; em: boolean }
/** Bảng vàng (5 giây nghỉ): top 3 em thật (`bv`), hạng của em (`hg`), ai đã diệt thủ khoa trong ván. */
export interface DongVang { ten: string; ha: number; doi: number; em: boolean; tk: boolean }
export interface Vang { top: DongVang[]; hg: number; haEm: number; dietTk: string[] }

/** Hình bé ma của một đội (bảng hết ván; `to` = phóng — bục bảng vàng máy thầy; `vuong` = đội vương miện thủ khoa). Hình hộp (`hop`) = thẻ báo nhặt hộp. */
function AnhMa({ bang, doi, to = 1, vuong = false, hop }: { bang: BangMau; doi: number; to?: number; vuong?: boolean; hop?: LoaiHop }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d')
    if (!cv || !g) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), k = 0.44 * to, w = 30 * to, h = (38 + (vuong ? 12 : 0)) * to, dat = to * 36 + (vuong ? 12 * to : 0)
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    if (to !== 1 || vuong) { cv.style.width = `${w}px`; cv.style.height = `${h}px` }
    const kk = hop ? 0.56 * to : k, bh = new BoHinh(bang, kk * dpr, false), a = hop ? bh.hop(hop) : bh.ma(doi, false, 0)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (hop) g.drawImage(a.c, (w - a.w * kk) / 2, (h - a.h * kk) / 2, a.w * kk, a.h * kk)
    else g.drawImage(a.c, w / 2 - a.ox * k, dat - a.oy * k, a.w * k, a.h * k)
    if (vuong) { const v = bh.vuong(); g.drawImage(v.c, w / 2 - v.ox * k, dat - 64 * k - v.oy * k, v.w * k, v.h * k) }
  }, [bang, doi, to, vuong, hop])
  return <canvas ref={ref} className="st-ma" aria-hidden="true" />
}

/** Băng dính điểm bốn đội + đồng hồ ván. */
export function BangDiem({ diem, gio, xem, doiToi }: { diem: readonly number[]; gio: { van: number; con: string }; xem: boolean; doiToi: number }) {
  return (
    <div className="gl-bang st-bang" role="group" aria-label={`Lượt hạ ván ${gio.van}: ${DOI_BPU.map((d, i) => `${d.ten} ${diem[i]}`).join(', ')}. Còn ${gio.con}`}>
      {DOI_BPU.map((d, i) => (
        <span key={d.ky} className="gl-o" style={bienDoi(i)} data-toi={!xem && i === doiToi ? '1' : undefined}><i />{d.ky} {diem[i]}</span>
      ))}
      <span className="gl-mo">lượt hạ</span>
      <span className="st-gio">Ván {gio.van} · còn {gio.con}</span>
    </div>
  )
}

/** Tin trận (ba dòng gần nhất). */
export function DsTin({ tin }: { tin: readonly TinTran[] }) {
  return (
    <ul className="gl-tin st-tin" aria-live="off">
      {tin.map((t) => (
        <li key={t.id} data-noi={t.manh.some((m) => m.noi) ? '1' : undefined}>{t.manh.map((m, i) => (m.doi !== undefined && m.doi >= 0 && m.doi < 4 ? <b key={i} style={bienDoi(m.doi)}>{m.c}</b> : <span key={i}>{m.c}</span>))}</li>
      ))}
    </ul>
  )
}

export function DaiTruyNa({ truyNa }: { truyNa: TruyNa }) {
  return (
    <div className="st-truy" role="status">
      <b>{truyNa.em ? 'EM LÀ THỦ KHOA' : `THỦ KHOA ${truyNa.ten}`}{truyNa.ha ? ` · ${truyNa.ha} lượt hạ` : ''}</b>
      <span>{truyNa.em ? 'Cả lớp đang truy nã em · giữ vương miện tới cuối ván' : 'Cả lớp đang truy nã · hạ bạn ấy là súng lên cấp ngay'}</span>
    </div>
  )
}

/** Thanh cấp súng của em (Pháo Sao tạm ⇒ cấp 6 đếm giây). */
export function ThanhSung({ cap, sao }: { cap: number; sao: number }) {
  return (
    <div className="st-sung" data-tam={sao ? '1' : undefined} aria-label={sao ? `Súng của em: Pháo Sao tạm, còn ${sao} giây` : `Súng của em: cấp ${cap} trên ${CAP_TOI_DA}, ${SUNG_TEN[cap - 1]}`}>
      <span className="st-vach" aria-hidden="true">{SUNG_TEN.map((_, i) => <i key={i} data-co={i < (sao ? CAP_TOI_DA : cap) ? '1' : undefined} />)}</span>
      {sao ? <><span className="st-cap">Súng tạm cấp 6 · </span>{SUNG_TEN[CAP_TOI_DA - 1]} · còn {sao} giây</> : <><span className="st-cap">Súng cấp {cap} · </span>{SUNG_TEN[cap - 1]}</>}
    </div>
  )
}

export function TheHop({ bang, loai }: { bang: BangMau; loai: LoaiHop }) {
  return (
    <div className="st-the-hop" data-loai={loai} role="status">
      <AnhMa bang={bang} doi={0} hop={loai} to={1.2} /><span><b>{THE_HOP[loai][0]}</b> · {THE_HOP[loai][1]}</span>
    </div>
  )
}

/** Bốn nhãn biểu cảm quanh bé ma của em. */
export function NhanBieuCam({ bieuCam, chon }: { bieuCam: readonly Diem[]; chon: (so: number) => void }) {
  return <>{bieuCam.map((d, i) => (
    <button key={`nhan${i}`} type="button" className="st-nhan" style={{ left: d.x, top: d.y }} onClick={() => chon(i)}><span aria-hidden="true">{KY_BIEU_CAM[i]}</span>{BIEU_CAM[i]}</button>
  ))}</>
}

export function DauHo({ dau }: { dau: Dau }) {
  return <div className="st-dau" data-vang={dau.vang ? '1' : undefined} role="status"><b>{dau.chu}</b>{dau.phu ? <small>{dau.phu}</small> : null}</div>
}

/** Thẻ bị hạ (đếm giây thi lại). Bản êm: không con dấu «trượt». */
export function TheBiHa({ biHa, banEm, tenToi }: { biHa: BiHa; banEm: boolean; tenToi: string }) {
  return (
    <div className="st-ha" role="status">
      {banEm ? null : <div className="st-dau st-dau-ha"><b>TRƯỢT ĐẠI HỌC RỒI!</b></div>}
      <h2>{biHa.ai ? <><b style={bienDoi(biHa.doi)}>{biHa.ai}</b> {duoiBiHa(banEm)}</> : 'Em hết máu ngoài phòng thi'}</h2>
      <div className="st-dem">{biHa.giay}</div>
      <p>Thi lại ở phía trại {tenToi} sau {biHa.giay} giây</p>
    </div>
  )
}

/** Hết ván: bục bảng vàng máy thầy (ảnh 13) · thẻ cuối ván máy em có bảng vàng (ảnh 14) · thẻ bốn đội (đợt 1). */
export function TheCuoiVan({ ketQua, vang, xem, bang, doiToi, banEm }: { ketQua: KetQua; vang: Vang | null; xem: boolean; bang: BangMau | null; doiToi: number; banEm: boolean }) {
  const nhat = ketQua.hang[0].diem > (ketQua.hang[1]?.diem ?? 0) ? ketQua.hang[0] : null
  const hangEm = !xem ? ketQua.hang.find((h) => h.doi === doiToi) : undefined
  // Bảng vàng có ít nhất một dòng (hoặc hạng của em) ⇒ thẻ cuối ván kiểu ảnh 14 / bục lớn máy thầy kiểu ảnh 13; không thì thẻ bốn đội như đợt 1.
  const coVang = !!vang && (vang.top.length > 0 || (!xem && vang.hg > 0))
  return coVang && vang && xem ? (
    // BẢNG VÀNG lớn máy thầy (ảnh 13): bục 3 khối (2 · 1 · 3), bé ma trên bục, tên + lượt hạ; bên phải hạng bốn đội.
    <div className="st-vv" role="status">
      <h2>Bảng vàng <small>Ván {ketQua.van}</small></h2>
      <div className="st-buc">
        {[1, 0, 2].map((h) => {
          const r = vang.top[h]
          if (!r) return null
          return (
            <div key={h} className="st-buc-o" data-hang={h + 1} style={bienDoi(r.doi)}>
              {bang ? <AnhMa bang={bang} doi={r.doi} to={2.2} vuong={r.tk} /> : null}
              <div className="st-khoi"><b>{h + 1}</b></div>
              <span className="st-buc-ten"><b>{r.ten}</b><small>{r.ha} lượt hạ{r.tk ? ' · thủ khoa' : ''}</small></span>
            </div>
          )
        })}
      </div>
      <div className="st-vv-ben">
        {nhat ? <p style={bienDoi(nhat.doi)}><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van} · {nhat.diem} lượt hạ</p> : <p>Hết ván {ketQua.van} · hoà</p>}
        <p>{ketQua.hang.filter((h) => h !== nhat).map((h) => <span key={h.doi}>{XEP_DOI[h.xep]}: <b style={bienDoi(h.doi)}>{DOI_BPU[h.doi].ten}</b> · {h.diem}</span>)}</p>
        {vang.dietTk.length ? <p><em>Đã tiêu diệt thủ khoa:</em> {vang.dietTk.join(', ')}</p> : null}
        <small>Ván mới sau vài giây</small>
      </div>
    </div>
  ) : coVang && vang ? (
    // Thẻ cuối ván máy em (ảnh 14): đội thắng · hạng đội em · lượt hạ + hạng của em · top 3 lớp.
    <div className="st-kq" data-vang="1" role="status" style={bienDoi(ketQua.hang[0].doi)}>
      <h2>{nhat ? <><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van}!</> : `Hết ván ${ketQua.van} · hoà`}</h2>
      {hangEm && !banEm ? <span className="st-kq-dau">{XEP_DOI[hangEm.xep]}</span> : null}
      {hangEm ? <p>Đội em (<b style={bienDoi(hangEm.doi)}>{DOI_BPU[hangEm.doi].ten}</b>): {XEP_DOI[hangEm.xep].toLocaleLowerCase('vi')} · {hangEm.diem} lượt hạ</p> : null}
      <p>Em: <b>{vang.haEm} lượt hạ</b>{vang.hg ? ` · hạng ${vang.hg} trong lớp` : ''}</p>
      {vang.top.length ? <ol>{vang.top.map((r, k) => <li key={k} data-toi={r.em ? '1' : undefined}>{r.ten} · {r.ha} lượt hạ{r.tk ? ' · thủ khoa' : ''}</li>)}</ol> : null}
      <p className="st-sau">Ván mới bắt đầu sau vài giây</p>
    </div>
  ) : (
    <div className="st-kq" role="status" style={bienDoi(ketQua.hang[0].doi)}>
      <h2>{nhat ? <><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van}!</> : `Hết ván ${ketQua.van} · hoà`}</h2>
      {ketQua.hang.map((h) => (
        <div key={h.doi} className="st-dong" data-nhat={nhat && h.doi === nhat.doi ? '1' : undefined} data-toi={hangEm && h.doi === doiToi ? '1' : undefined} style={bienDoi(h.doi)}>
          <span className="st-hang">{h.xep + 1}</span>
          {bang ? <AnhMa bang={bang} doi={h.doi} /> : null}
          <span className="st-t">{DOI_BPU[h.doi].ten} · {XEP_DOI[h.xep]}{h.nhat ? <small>{h.nhat}</small> : null}</span>
          <span className="st-d">{h.diem}<small>lượt hạ</small></span>
        </div>
      ))}
      <p>{hangEm ? `Đội em: ${XEP_DOI[hangEm.xep]} · ` : ''}Ván mới bắt đầu sau vài giây · mọi người về trại đội mình</p>
    </div>
  )
}
