// MÀN 2 · THỬ ĐỒ — thần thú CỦA EM trên bệ sáng, mặc ngay món vừa chạm (chỉ thử, không mất vàng) · danh sách "Em đang thử" · khung chi tiết + nút chính.
// Khung chi tiết luôn có ĐÚNG hai nút (một nút hành động + "Bỏ thử món này"), đổi món/đổi trạng thái chỉ đổi nhãn + kiểu nút: bố cục không nở ra, không nhảy.
import type { ReactNode } from 'react'
import { BtKhoa, BtTich, DongVang } from './bieu-tuong'
import { DauMan, HuyHieuBac, KhoiLoi, SoVang } from './chung'
import {
  TEN_BAC,
  TEN_O,
  chuBatMi,
  chuBoThu,
  chuCanCo,
  chuCanCoGiaTri,
  chuChuaThuMon,
  chuDangMacMonNay,
  chuDangThuDanhSach,
  chuDoiVang,
  chuGia,
  chuKhongCan,
  chuKhongGioiHan,
  chuMacNgay,
  chuNutMua,
  chuSoLuong,
  chuThieuVang,
  chuToiCuaHang,
  chuThuDo,
  chuThuDoPhu,
  chuTrangThai,
  chuTuHao,
  chuVang,
  chuVangCuaEm,
  chuVeCuaHang,
  so,
} from './chu-shop'
import type { DangMac, EmCo, MonShop, ViSoMo, VeThu } from './kieu'
import { chiDuongKhoa, chiDuongThieuVang, chuKhoaChuaMua, chuKhoaNgan, chuSoLuongChiTiet, chuTrangThaiMon, conGioiHan, hienThiTrenThu, monDangThu, trangThaiMon } from './logic-shop'
import type { TrangThaiMon } from './logic-shop'
import SanKhau from './san-khau'

export interface ThuDoProps {
  /** Số vàng MÁY CHỦ trả. */
  vang: number
  vi: ViSoMo | null
  em: EmCo | null
  mon: readonly MonShop[]
  dangMac: DangMac
  dangThu: DangMac
  tieuDiem: string | null
  pet: number
  cap: number
  tenThu?: string
  veThu?: VeThu
  /** Lời báo dưới sân khấu ([M1]+[M2], [M4]); rỗng ⇒ hiện lời tự hào [T2]. */
  bao: string
  loiMac: { loi: string; thuLai: () => void } | null
  dangGuiMac: boolean
  onTieuDiem: (ma: string) => void
  onVe: () => void
  onToiCuaHang: () => void
  onToiDoi: () => void
  onMua: (m: MonShop) => void
  onMac: (m: MonShop) => void
  onBoThu: (m: MonShop) => void
}

type Tone = 'du' | 'thieu' | 'khoa'
const toneCua = (t: TrangThaiMon): Tone => (t.loai === 'thieu-vang' ? 'thieu' : t.loai === 'khoa' || t.loai === 'het' ? 'khoa' : 'du')

interface HanhDong {
  kieu: 'vang' | 'mo' | 'khoa'
  viec: string
  chu: string
  bieuTuong: ReactNode
  khoa: boolean
  chay?: () => void
}

function ChiTiet({ m, vang, vi, em, dangGuiMac, onMua, onMac, onToiDoi, onBoThu }: { m: MonShop; vang: number; vi: ViSoMo | null; em: EmCo | null; dangGuiMac: boolean; onMua: (m: MonShop) => void; onMac: (m: MonShop) => void; onToiDoi: () => void; onBoThu: (m: MonShop) => void }) {
  const tt = trangThaiMon(m, vang)
  const sl = conGioiHan(m) ? chuSoLuongChiTiet(m) : chuKhongGioiHan
  let tieu = ''
  let goi = ''
  let hd: HanhDong
  switch (tt.loai) {
    case 'dang-mac':
      tieu = chuTrangThai.dangMac
      hd = { kieu: 'khoa', viec: 'dang-mac', chu: chuDangMacMonNay, bieuTuong: <BtTich c={18} />, khoa: true }
      break
    case 'da-co':
      tieu = chuTrangThai.daCo
      hd = { kieu: 'vang', viec: 'mac', chu: chuMacNgay, bieuTuong: null, khoa: dangGuiMac, chay: () => onMac(m) }
      break
    case 'het':
      tieu = chuTrangThai.daHet
      hd = { kieu: 'khoa', viec: 'het', chu: chuTrangThai.daHet, bieuTuong: null, khoa: true }
      break
    case 'khoa':
      tieu = chuKhoaChuaMua(m, em)
      goi = chiDuongKhoa(m, em)
      hd = { kieu: 'khoa', viec: 'khoa', chu: chuKhoaNgan(m, em), bieuTuong: <BtKhoa c={18} />, khoa: true }
      break
    case 'thieu-vang':
      tieu = chuThieuVang(tt.thieu)
      goi = chiDuongThieuVang(tt.thieu, vi?.doiToiDa ?? 0)
      hd = { kieu: 'mo', viec: 'toi-doi', chu: chuDoiVang, bieuTuong: <DongVang c={22} />, khoa: false, chay: onToiDoi }
      break
    default:
      tieu = chuTrangThai.duVang
      hd = { kieu: 'vang', viec: 'mua', chu: chuNutMua(m.gia), bieuTuong: <DongVang c={24} />, khoa: false, chay: () => onMua(m) }
  }
  return (
    <section className={`ps-kinh ps-chi-tiet ps-bac-${m.bac}`} aria-label={m.ten}>
      <HuyHieuBac bac={m.bac} them={` · ${TEN_O[m.oGan]}`} />
      <h3>{m.ten}</h3>
      <div className="ps-bat-mi">
        <b>{chuBatMi}</b>
        {m.batMi}
      </div>
      <div className="ps-ct-dong">
        <span>{chuGia}</span>
        <span className="ps-gia ps-so">
          <DongVang c={24} />
          {so(m.gia)} <small>{chuVang}</small>
        </span>
      </div>
      <div className="ps-ct-dong">
        <span>{chuVangCuaEm}</span>
        <b className="ps-so">
          {so(vang)} {chuVang}
        </b>
      </div>
      <div className="ps-ct-dong">
        <span>{chuCanCo}</span>
        <b>{m.canChuoi || m.canAnThach ? chuCanCoGiaTri(m.canChuoi, m.canAnThach) : chuKhongCan}</b>
      </div>
      <div className="ps-ct-dong">
        <span>{chuSoLuong}</span>
        <b className="ps-so">{sl}</b>
      </div>
      <div className={`ps-chi-duong ps-tt-${toneCua(tt)}`}>
        <b>{tieu}</b>
        <span>{goi}</span>
      </div>
      <button type="button" className={`ps-hanh-dong ps-hd-${hd.kieu}`} data-viec={hd.viec} disabled={hd.khoa} onClick={hd.chay}>
        {hd.bieuTuong}
        <span className="ps-so">{hd.chu}</span>
      </button>
      <button type="button" className="ps-nut-mo" data-viec="bo-thu" onClick={() => onBoThu(m)}>
        {chuBoThu}
      </button>
    </section>
  )
}

export default function ThuDo(p: ThuDoProps) {
  const thu = monDangThu(p.mon, p.dangThu)
  const chon = thu.find((m) => m.ma === p.tieuDiem) ?? thu[0]
  return (
    <>
      <DauMan
        tieuDe={chuThuDo}
        phu={chuThuDoPhu}
        nhanVe={chuVeCuaHang}
        onVe={p.onVe}
        phai={
          <span className="ps-nut-tron ps-nut-tron-tinh" role="status" aria-live="polite" aria-atomic="true">
            <DongVang c={22} />
            <span className="ps-doc">{chuVangCuaEm}: </span>
            <SoVang vang={p.vang} /> {chuVang}
          </span>
        }
      />
      <SanKhau pet={p.pet} cap={p.cap} hienThi={hienThiTrenThu(p.dangMac, p.dangThu)} dangThu={p.dangThu} tenThu={p.tenThu} mon={p.mon} veThu={p.veThu} />
      <p className="ps-ban-be ps-cho-3" role="status" aria-live="polite">
        {p.bao || chuTuHao}
      </p>

      <section className="ps-kinh ps-thu-ds" aria-labelledby="ps-thu-ds-tieu">
        <h3 id="ps-thu-ds-tieu">{chuDangThuDanhSach}</h3>
        {thu.length === 0 ? (
          <div className="ps-thu-trong">
            <p className="ps-ghi-chu">{chuChuaThuMon}</p>
            <button type="button" className="ps-nut-mo" onClick={p.onToiCuaHang}>
              {chuToiCuaHang}
            </button>
          </div>
        ) : (
          thu.map((m) => {
            const tt = trangThaiMon(m, p.vang)
            return (
              <button key={m.ma} type="button" className={`ps-thu-hang ps-bac-${m.bac}`} aria-pressed={chon?.ma === m.ma} data-ma={m.ma} onClick={() => p.onTieuDiem(m.ma)}>
                <span className="ps-ngoc" aria-hidden="true" />
                <span className="ps-thu-chu">
                  <b>{m.ten}</b>
                  <span>
                    <span className="ps-bac-chu">{TEN_BAC[m.bac]}</span> · {TEN_O[m.oGan]} · <span className="ps-so">{chuGia} {so(m.gia)} {chuVang}</span>
                  </span>
                </span>
                <span className={`ps-thu-tt ps-tt-${toneCua(tt)}`}>{chuTrangThaiMon(tt, m, p.em)}</span>
              </button>
            )
          })
        )}
      </section>

      {chon && <ChiTiet m={chon} vang={p.vang} vi={p.vi} em={p.em} dangGuiMac={p.dangGuiMac} onMua={p.onMua} onMac={p.onMac} onToiDoi={p.onToiDoi} onBoThu={p.onBoThu} />}
      {p.loiMac && <KhoiLoi loi={p.loiMac.loi} onThuLai={p.loiMac.thuLai} />}
    </>
  )
}
