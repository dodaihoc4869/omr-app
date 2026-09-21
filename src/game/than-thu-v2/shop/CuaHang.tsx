// MÀN 1 · CỬA HÀNG — ví vàng · khối "Đổi vàng" (EXP thừa → vàng) · thanh lọc theo chỗ đeo · lưới thẻ món. Chạm thẻ = thử.
// Màn này chỉ VẼ số máy chủ đã trả (`vi`, `vang`, `mon`); mọi hành động đi lên `ManShop`. Đang tải ⇒ CÙNG cấu trúc, chữ số ẩn, khung xám (không nhảy bố cục).
// Mọi khối giữ nguyên chiều cao khi đổi trạng thái: nút/khối phụ CÓ SẴN nhưng khoá, dòng số lượng/khoá chừa sẵn chỗ hai dòng.
import { useId } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { BtKhoa, BtTich, BtTu, DongVang } from './bieu-tuong'
import { DauMan, HinhGiuCho, HuyHieuBac, SoVang } from './chung'
import {
  TEN_O,
  chuCuaHang,
  chuCuaHangPhu,
  chuChoDeo,
  chuChuaCoExpThua,
  chuChuaCoExpThuaLoi,
  chuChiDuongNhiemVu,
  chuDatDan,
  chuDoiThanh,
  chuDoiToiDa,
  chuDoiVang,
  chuDoiVangPhu,
  chuDuNgayAn,
  chuDonViExp,
  chuEmDoi,
  chuExp,
  chuGhiChuDoi,
  chuGia,
  chuKeoThanh,
  chuLocNhan,
  chuNgayAn,
  chuNutDoi,
  chuOngNghiemCo,
  chuOTrong,
  chuDuTruDu,
  chuSapMo,
  chuSauKhiDoi,
  chuTatCa,
  chuTheMon,
  chuThanhKeoNhan,
  chuTrangThai,
  chuTruocKhiDoi,
  chuTuDo,
  chuVang,
  chuVangCuaEm,
  chuVeDao,
  TEN_BAC,
  so,
} from './chu-shop'
import { CAC_O } from './kieu'
import type { DangMac, EmCo, MonShop, OGan, ViSoMo } from './kieu'
import { chuKhoaCanDai, chuSoLuongThe, chuTrangThaiMon, kepSoExp, ngayAnCua, trangThaiMon, xepTheoGia } from './logic-shop'

export type BoLoc = OGan | 'tat-ca'

export interface CuaHangProps {
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
        <button type="button" className="ps-nut-tron ps-nut-tron-chu" onClick={onTuDo}>
          <BtTu />
          {chuTuDo}
        </button>
      }
    />
  )
}

export default function CuaHang(p: CuaHangProps) {
  const idSo = useId()
  const toiDa = p.vi?.doiToiDa ?? 0
  const x = kepSoExp(p.soExp, toiDa)
  const khongCo = !p.dangTai && toiDa <= 0
  const giuLai = p.vi?.giuLai ?? 0
  const ong = p.vi?.ongNghiem ?? 0
  const pt = toiDa > 0 ? (x / toiDa) * 100 : 0
  const nhanNut = p.dangTai ? NBSP : khongCo ? chuChuaCoExpThua : x <= 0 ? chuKeoThanh : chuNutDoi(x)
  const ds = p.dangTai ? [] : xepTheoGia(p.mon, p.loc)
  const bo: { ma: BoLoc; chu: string; sap: boolean }[] = [{ ma: 'tat-ca', chu: chuTatCa, sap: false }, ...CAC_O.map((o) => ({ ma: o as BoLoc, chu: TEN_O[o], sap: p.sapMo(o) }))]
  return (
    <>
      <DauCuaHang onVe={p.onVe} onTuDo={p.onTuDo} />

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
        <div className="ps-vi-phu ps-so">
          {chuOngNghiemCo} <b>{p.dangTai ? NBSP : chuExp(ong)}</b> · {chuDuTruDu} <b>{p.dangTai ? NBSP : chuNgayAn(p.vi?.ngayAn ?? 0)}</b>
        </div>
      </section>

      <section className="ps-kinh ps-doi" aria-busy={p.dangTai}>
        <h3>
          {chuDoiVang}
          <small>{chuDoiVangPhu}</small>
        </h3>
        <div className="ps-doi-nhap">
          <label htmlFor={idSo}>{chuEmDoi}</label>
          <span className="ps-nhap-cach">
            <input id={idSo} className="ps-nhap" type="number" inputMode="numeric" min={0} max={toiDa} step={1} value={x} disabled={p.dangTai || toiDa <= 0} onChange={(e) => p.onSoExp(kepSoExp(e.target.valueAsNumber, toiDa))} />
            <span>{chuDonViExp}</span>
          </span>
        </div>
        <div className="ps-doi-noi ps-so">{p.dangTai ? NBSP : chuDoiThanh(x)}</div>
        <input
          ref={p.thanhRef}
          className="ps-truot"
          type="range"
          min={0}
          max={toiDa}
          step={1}
          value={x}
          disabled={p.dangTai || toiDa <= 0}
          aria-label={chuThanhKeoNhan}
          aria-valuetext={chuExp(x)}
          style={{ '--pt': `${pt}%` } as CSSProperties}
          onChange={(e) => p.onSoExp(kepSoExp(e.target.valueAsNumber, toiDa))}
        />
        <div className="ps-doi-moc ps-so">
          <span>{chuExp(0)}</span>
          <button type="button" className="ps-nut-chu" disabled={p.dangTai || toiDa <= 0} onClick={() => p.onSoExp(toiDa)}>
            {p.dangTai ? NBSP : chuDoiToiDa(toiDa)}
          </button>
        </div>
        <div className="ps-doi-dong">
          <span>{chuTruocKhiDoi}</span>
          <b className="ps-so">{p.dangTai ? NBSP : chuDuNgayAn(ong, ngayAnCua(ong, giuLai))}</b>
        </div>
        <div className="ps-doi-dong">
          <span>{chuSauKhiDoi}</span>
          <b className="ps-so">{p.dangTai ? NBSP : chuDuNgayAn(ong - x, ngayAnCua(ong - x, giuLai))}</b>
        </div>
        <p className="ps-ghi-chu ps-cho-2">{p.dangTai ? NBSP : khongCo ? `${chuChuaCoExpThuaLoi(giuLai)} ${chuChiDuongNhiemVu}` : chuGhiChuDoi(giuLai)}</p>
        <button type="button" className="ps-nut-vang" data-viec="doi" disabled={p.dangTai || x <= 0} onClick={p.onDoi}>
          <span>{nhanNut}</span>
        </button>
        <div className="ps-bao ps-cho-2" role="status" aria-live="polite">
          {p.baoDoi}
        </div>
      </section>

      <div className="ps-loc" role="group" aria-label={chuLocNhan}>
        {bo.map((b) => (
          <button key={b.ma} type="button" aria-pressed={p.loc === b.ma} disabled={p.dangTai || b.sap} data-loc={b.ma} onClick={() => p.onLoc(b.ma)}>
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
}
