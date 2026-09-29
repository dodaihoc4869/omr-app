// MÀN 1 · CỬA HÀNG — ví vàng · khối "Vàng tự vào ví" (luật v4 29/09: 5 EXP = 1 vàng, bỏ đổi tay) · thanh lọc theo chỗ đeo · lưới thẻ món. Chạm thẻ = thử.
// Màn này chỉ VẼ số máy chủ đã trả (`vi`, `vang`, `mon`); mọi hành động đi lên `ManShop`. Đang tải ⇒ CÙNG cấu trúc, chữ số ẩn, khung xám (không nhảy bố cục).
// Mọi khối giữ nguyên chiều cao khi đổi trạng thái: nút/khối phụ CÓ SẴN nhưng khoá, dòng số lượng/khoá chừa sẵn chỗ hai dòng.
import type { ReactNode, Ref } from 'react'
import { BtKhoa, BtTich, BtTu, DongVang } from './bieu-tuong'
import { DauMan, HinhGiuCho, HuyHieuBac, SoVang } from './chung'
import NutToanManHinh from '../../../components/NutToanManHinh'
import { EXP_MOI_VANG } from '../../../lib/kinh-te-game'
import {
  TEN_O,
  chuVangTuDongPhu,
  chuCuaHang,
  chuCuaHangPhu,
  chuChoDeo,
  chuDatDan,
  chuGia,
  chuLocNhan,
  chuOTrong,
  chuSapMo,
  chuTatCa,
  chuTheMon,
  chuTrangThai,
  chuTuDo,
  chuVang,
  chuVangCuaEm,
  chuVeDao,
  TEN_BAC,
  so,
} from './chu-shop'
import { CAC_O } from './kieu'
import type { DangMac, EmCo, MonShop, OGan, ViSoMo } from './kieu'
import { chuKhoaCanDai, chuSoLuongThe, chuTrangThaiMon, trangThaiMon, xepTheoGia } from './logic-shop'

export type BoLoc = OGan | 'tat-ca'

export interface CuaHangProps {
  /** Bố cục ngang: bọc ví + đổi EXP vào cột TRÁI, bộ lọc + lưới món vào cột PHẢI (shop-ngang.css). Vắng/false = dọc như cũ. */
  ngang?: boolean
  /** Đang tải ⇒ khung xám giữ chỗ. */
  dangTai: boolean
  vi: ViSoMo | null
  /** Số vàng MÁY CHỦ trả. */
  vang: number
  em: EmCo | null
  mon: readonly MonShop[]
  dangThu: DangMac
  loc: BoLoc
  sapMo: (o: OGan) => boolean
  soExp: number
  /** Lời báo sau khi đổi ([M3]); rỗng ⇒ vẫn chừa chỗ. */
  baoDoi: string
  thanhRef?: Ref<HTMLInputElement>
  veHinhMon?: (m: MonShop) => ReactNode
  onLoc: (l: BoLoc) => void
  onSoExp: (n: number) => void
  onDoi: () => void
  onThu: (m: MonShop) => void
  onTuDo: () => void
  onVe: () => void
}

const NBSP = '\u00a0'
const SO_THE_XAM = 6

function TheXam() {
  return (
    <div className="ps-the ps-xam" aria-hidden="true">
      <span className="ps-the-tranh" />
      <span className="ps-bac">{NBSP}</span>
      <span className="ps-the-ten">{NBSP}</span>
      <span className="ps-the-o">{NBSP}</span>
      <span className="ps-the-gia">{NBSP}</span>
      <span className="ps-the-phu" />
    </div>
  )
}

function TheMon({ m, vang, em, dangThu, veHinhMon, onThu }: { m: MonShop; vang: number; em: EmCo | null; dangThu: boolean; veHinhMon?: (m: MonShop) => ReactNode; onThu: (m: MonShop) => void }) {
  const tt = trangThaiMon(m, vang)
  const sl = chuSoLuongThe(m)
  const nhanTrangThai = [dangThu ? chuTrangThai.dangThu : '', chuTrangThaiMon(tt, m, em), sl].filter(Boolean).join('. ')
  return (
    <button type="button" className={`ps-the ps-bac-${m.bac}`} aria-pressed={dangThu} aria-label={chuTheMon(m.ten, m.bac, m.gia, nhanTrangThai)} data-ma={m.ma} onClick={() => onThu(m)}>
      <span className="ps-the-tranh" aria-hidden="true">
        {veHinhMon ? veHinhMon(m) : <HinhGiuCho bac={m.bac} oGan={m.oGan} />}
        {dangThu && <span className="ps-the-dang-thu">{chuTrangThai.dangThu}</span>}
      </span>
      <HuyHieuBac bac={m.bac} />
      <span className="ps-the-ten">{m.ten}</span>
      <span className="ps-the-o">{chuChoDeo(m.oGan)}</span>
      <span className="ps-the-gia ps-so">
        <DongVang c={18} />
        <span>
          {chuGia} <b>{so(m.gia)}</b> {chuVang}
        </span>
      </span>
      <span className="ps-the-phu">
        {(m.dangMac || m.daCo) && (
          <span className="ps-phu-dong ps-co">
            <BtTich />
            <span>{m.dangMac ? chuTrangThai.dangMac : chuTrangThai.daCo}</span>
          </span>
        )}
        {!m.daCo && !m.moKhoa && (
          <span className="ps-phu-dong">
            <BtKhoa />
            <span>{chuKhoaCanDai(m, em)}</span>
          </span>
        )}
        {!m.daCo && sl && (
          <span className="ps-phu-dong ps-so">
            <span>{sl}</span>
          </span>
        )}
      </span>
    </button>
  )
}

/** Đầu màn Cửa hàng (dùng cả khi màn đang lỗi / đóng): tiêu đề · nút "Tủ đồ" luôn có. */
export function DauCuaHang({ onVe, onTuDo }: { onVe: () => void; onTuDo: () => void }) {
  return (
    <DauMan
      tieuDe={chuCuaHang}
      phu={chuCuaHangPhu}
      nhanVe={chuVeDao}
      onVe={onVe}
      phai={
        <>
          <button type="button" className="ps-nut-tron ps-nut-tron-chu" onClick={onTuDo}>
            <BtTu />
            {chuTuDo}
          </button>
          {/* Nút toàn màn hình (hoàn thiện bản vẽ 28/09): trong thanh đầu, cạnh nút Tủ đồ — như các màn game khác. */}
          <NutToanManHinh className="ps-ntm" />
        </>
      }
    />
  )
}

export default function CuaHang(p: CuaHangProps) {
  const ds = p.dangTai ? [] : xepTheoGia(p.mon, p.loc)
  const bo: { ma: BoLoc; chu: string; sap: boolean }[] = [{ ma: 'tat-ca', chu: chuTatCa, sap: false }, ...CAC_O.map((o) => ({ ma: o as BoLoc, chu: TEN_O[o], sap: p.sapMo(o) }))]
  const trai = (
    <>
      <section className="ps-kinh ps-vi" aria-busy={p.dangTai}>
        <div className="ps-vi-hang">
          <DongVang c={54} className="ps-xu-lon" />
          <div className="ps-vi-so" role="status" aria-live="polite" aria-atomic="true">
            <div className="ps-nhan">{chuVangCuaEm}</div>
            <div className={p.dangTai ? 'ps-tai' : undefined}>
              <strong>{p.dangTai ? NBSP : <SoVang vang={p.vang} />}</strong>
              <span>{chuVang}</span>
            </div>
          </div>
        </div>
        <p className="ps-vi-phu">{chuVangTuDongPhu(p.vi?.expMoiVang ?? EXP_MOI_VANG)}</p>
      </section>

    </>
  )
  const phai = (
    <>
      <div className="tl-hang tl-hang--mot-dong ps-loc" role="group" aria-label={chuLocNhan}>
        {bo.map((b) => (
          <button key={b.ma} type="button" className="tl-the" aria-pressed={p.loc === b.ma} disabled={p.dangTai || b.sap} data-loc={b.ma} onClick={() => p.onLoc(b.ma)}>
            {b.chu}
            {b.sap && <em>{chuSapMo}</em>}
          </button>
        ))}
      </div>
      <div className="ps-chu-giai">
        <b>{chuDatDan}</b>
        {([1, 2, 3, 4, 5] as const).map((b) => (
          <span key={b} className={`ps-bac-${b}`}>
            <i />
            {TEN_BAC[b]}
          </span>
        ))}
      </div>

      <div className="ps-luoi" aria-busy={p.dangTai}>
        {p.dangTai
          ? Array.from({ length: SO_THE_XAM }, (_, i) => <TheXam key={i} />)
          : ds.map((m) => <TheMon key={m.ma} m={m} vang={p.vang} em={p.em} dangThu={p.dangThu[m.oGan] === m.ma} veHinhMon={p.veHinhMon} onThu={p.onThu} />)}
      </div>
      {!p.dangTai && ds.length === 0 && <p className="ps-ghi-chu ps-giua">{chuOTrong}</p>}
    </>
  )
  return (
    <>
      <DauCuaHang onVe={p.onVe} onTuDo={p.onTuDo} />

      {p.ngang ? (
        <div className="ps-ngang">
          <div className="ps-ngang-trai">{trai}</div>
          <div className="ps-ngang-phai">{phai}</div>
        </div>
      ) : (
        <>
          {trai}
          {phai}
        </>
      )}
    </>
  )
}
