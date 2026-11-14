// TỦ ĐỒ BÉ MA (đợt 4 — bản vẽ thầy duyệt docs/ban-ve-sinh-ton-v2-1311/15-tu-do-390.jpg; đặc tả mục 8) + thẻ «Thành tích» (chưa có bản vẽ riêng ⇒ đặt trong tủ đồ,
// cùng bố cục). Mảnh lười: chỉ tải khi em bấm «Tủ đồ». Nền LUÔN TỐI như trò (MAU_SINH_TON + bảng xanh than gắn nội tuyến ở gốc).
// Máy chủ quyết đồ đã mở và kiểm quyền mặc (server/src/sinh-ton-du-lieu.ts); máy em chỉ hiện + gửi lựa chọn. Đồ CHỈ đổi hình, không làm súng mạnh hơn.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './tu-do.css'
import { MAU_SINH_TON, MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { DO_BE_MA, HUY_HIEU, NGAN_DO, doTheoMa, dongDieuKien, tiLeMo, type BoMac, type DoBeMa, type LoaiDo } from '../../lib/live-khoi/tu-do'
import { macDo, type DuLieuTuDo, type XacThucEm } from './tu-do-api'
import XemBeMa from './XemBeMa'

const NEN: CSSProperties = { ...(MAU_XANH_THAN as CSSProperties), ...(MAU_SINH_TON as CSSProperties) }
const giong = (a: BoMac, b: BoMac) => NGAN_DO.every(({ loai }) => a[loai] === b[loai])
const HIEU_UNG = new Set<LoaiDo>(['dan', 'ha'])

export interface TuDoBeMaProps { du: DuLieuTuDo; xt: XacThucEm; onDong: () => void; onDaMac?: (mac: BoMac) => void }

export default function TuDoBeMa({ du, xt, onDong, onDaMac }: TuDoBeMaProps) {
  const [daLuu, setDaLuu] = useState<BoMac>(du.mac)
  const [chon, setChon] = useState<BoMac>(du.mac)
  const [dang, setDang] = useState(false)
  const [bao, setBao] = useState('')
  const mo = useMemo(() => new Set(du.mo), [du.mo])
  const tien = { cap: du.cap, chuoi: du.chuoi }
  const doi = du.doiKy ?? 1
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('keydown', phim)
    const cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', phim); document.body.style.overflow = cu }
  }, [onDong])

  const bam = (d: DoBeMa) => {
    if (!mo.has(d.ma)) { setBao(`«${d.ten}» chưa mở. ${dongDieuKien(d, tien)}.`); return }
    setBao('')
    setChon((c) => ({ ...c, [d.loai]: c[d.loai] === d.ma ? null : d.ma }))
  }
  const luu = async () => {
    if (dang || giong(chon, daLuu)) return
    setDang(true); setBao('')
    const r = await macDo(xt, chon)
    setDang(false)
    if (!r.ok) { setBao(r.chu); return }
    setDaLuu(r.mac); setChon(r.mac); setBao('Đã mặc. Bé ma của em đổi hình từ ván sau.'); onDaMac?.(r.mac)
  }
  const tenDangMac = NGAN_DO.map(({ loai }) => doTheoMa(chon[loai])?.ten).filter(Boolean).join(' · ')
  const tt = du.thanhTich, coHh = new Set(du.huyHieu)

  return createPortal(
    <div className="tdm" style={NEN} role="dialog" aria-modal="true" aria-labelledby="tdm-tieu-de">
      <div className="tdm-cuon">
        <header className="tdm-dau">
          <h2 id="tdm-tieu-de">Tủ đồ bé ma</h2>
          <button type="button" className="tdm-x" onClick={onDong} aria-label="Đóng tủ đồ">×</button>
        </header>
        <section className="tdm-xem" aria-label="Bé ma của em">
          <XemBeMa rong={128} doi={doi} mac={chon} nhan={`Bé ma của em${tenDangMac ? ` mặc ${tenDangMac}` : ''}`} />
          <div>
            <p className="tdm-dang"><span>Đang mặc:</span>{tenDangMac || 'Chưa mặc đồ nào'}</p>
            <p className="tdm-luat">Đồ chỉ đổi hình bé ma, không làm súng mạnh hơn. Mở bằng <b>chuỗi ngày</b> và <b>cấp</b> EXP: học đều là có đồ mới.</p>
          </div>
        </section>
        <p className="tdm-tien">Em đang Chuỗi {du.chuoi} ngày · Cấp {du.cap}</p>
        {NGAN_DO.map(({ loai, ten }) => (
          <section key={loai} className="tdm-ngan" aria-label={ten}>
            <h3>{ten}</h3>
            <ul className="tdm-luoi">
              {DO_BE_MA.filter((d) => d.loai === loai).map((d) => {
                const daMo = mo.has(d.ma), dangChon = chon[loai] === d.ma
                return (
                  <li key={d.ma}>
                    <button type="button" className="tdm-o" data-chon={dangChon || undefined} data-khoa={!daMo || undefined} aria-pressed={dangChon} onClick={() => bam(d)}
                      aria-label={`${d.ten}. ${dangChon ? 'Đang chọn' : dongDieuKien(d, tien)}`}>
                      {!daMo ? <i className="tdm-khoa" aria-hidden="true" /> : null}
                      <XemBeMa rong={66} doi={doi} mac={HIEU_UNG.has(loai) ? {} : { [loai]: d.ma }} hieuUng={HIEU_UNG.has(loai) ? d.ma : null} mo={!daMo} nhan={d.ten} />
                      <b>{d.ten}</b>
                      {dangChon
                        ? <span className="tdm-nhan dung">{daLuu[loai] === d.ma ? 'Đang mặc' : 'Đã chọn'}</span>
                        : <span className="tdm-nhan">{dongDieuKien(d, tien)}</span>}
                      {!daMo ? <span className="tdm-thanh" aria-hidden="true"><i style={{ width: `${Math.round(tiLeMo(d, tien) * 100)}%` }} /></span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        <section className="tdm-tt" aria-labelledby="tdm-tt-tieu-de">
          <h3 id="tdm-tt-tieu-de">Thành tích</h3>
          <dl className="tdm-so">
            <div><dt>Lượt hạ</dt><dd>{tt.ha}</dd></div>
            <div><dt>Hạ liền nhiều nhất</dt><dd>{tt.chuoiMax} bạn</dd></div>
            <div><dt>Làm thủ khoa</dt><dd>{tt.thuKhoa} lần</dd></div>
            <div><dt>Hạ được Thầy</dt><dd>{tt.haThay} lần</dd></div>
            <div><dt>Ván đã chơi</dt><dd>{tt.van}</dd></div>
          </dl>
          <h4>Huy hiệu</h4>
          <ul className="tdm-hh">
            {HUY_HIEU.map((h) => <li key={h.ma} data-dat={coHh.has(h.ma) || undefined}>{h.ten}<small>{coHh.has(h.ma) ? 'Đã đạt' : 'Chưa đạt'}</small></li>)}
          </ul>
          <p className="tdm-ghi">Thành tích chỉ để ghi nhớ, không làm bé ma mạnh hơn.</p>
        </section>
      </div>
      <footer className="tdm-day">
        {bao ? <p className="tdm-bao" role="status">{bao}</p> : null}
        <div>
          <button type="button" className="tdm-nut" onClick={onDong}>Đóng</button>
          <button type="button" className="tdm-nut chinh" onClick={() => void luu()} disabled={dang || giong(chon, daLuu)}>{dang ? 'Đang lưu…' : 'Mặc đồ đã chọn'}</button>
        </div>
      </footer>
    </div>,
    document.body,
  )
}
