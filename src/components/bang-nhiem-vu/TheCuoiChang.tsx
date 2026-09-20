// THẺ CUỐI CHẶNG của bài BTVN "nâng đỡ": "hôm nay em tiến thêm gì".
// Bản vẽ đã duyệt: docs/ban-ve-btvn-nang-do-2109/hs-3-the-cuoi-chang.jpg. Nội dung do `theChangView` (btvn-ca-nhan-em.ts)
// quyết định — chỉ SỐ ĐẾM của chính em, không xếp hạng, không chữ "nắm chắc", không kết luận năng lực.
// KHÔNG tự lập cổng (portal): nằm TRONG khung xem phiếu (`KhungXemPhieu` truyền qua `phu`), phủ đúng vùng của phiếu;
// không kéo thêm thư viện (test bang-nhiem-vu-1909 chỉ cho react + lucide-react).
import { useEffect, useRef } from 'react'
import { ArrowRight, Award, Layers, RotateCcw, Sparkles, TrendingUp, X } from 'lucide-react'
import type { TheChangView } from '../../lib/btvn-ca-nhan-em'
import './m3-theme.css'
import './the-cuoi-chang.css'

const BAC = ['Biết', 'Hiểu', 'Vận dụng'] as const

const BIEU_TUONG = { lai: RotateCcw, moi: Sparkles, dang: Layers } as const

export default function TheCuoiChang({ view, dong, veBang }: { view: TheChangView; dong: () => void; veBang: () => void }) {
  const nutChinh = useRef<HTMLButtonElement>(null)
  const dongRef = useRef(dong)
  dongRef.current = dong

  useEffect(() => {
    nutChinh.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dongRef.current()
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [])

  const tieuDeLon = view.coTienBo ? 'Hôm nay em đã tiến thêm' : 'Em đã làm xong chặng này'

  return (
    <div className="lop-the-chang m3" role="dialog" aria-modal="true" aria-label={view.tieuDe} data-the-cuoi-chang>
      <header className="tcc-tren">
        <button type="button" className="tcc-dong" onClick={dong} aria-label="Đóng thẻ, xem kết quả chặng">
          <X size={24} aria-hidden="true" />
        </button>
        <h1>{view.tieuDe}</h1>
      </header>

      <div className="tcc-cuon">
        {view.tram && (
          <div className="tcc-mini" role="img" aria-label={`Đã xong ${view.tram.xong} trên ${view.tram.tong} chặng`}>
            {Array.from({ length: view.tram.tong }, (_, i) => (
              <i key={i} className={i < view.tram!.xong ? 'xong' : i === view.tram!.xong ? 'mai' : ''} />
            ))}
          </div>
        )}
        <h2>{tieuDeLon}</h2>
        <p className="tcc-phu">{view.phu}</p>

        {view.nop && (
          <div className="tcc-the tcc-nop" role="status">
            <b>{view.nop.chu}</b>
            {view.nop.ghiThuong && <span>{view.nop.ghiThuong}</span>}
          </div>
        )}

        {view.dangLenBac.map((d) => (
          <section key={d.ten} className="tcc-tienbo" aria-label={`Dạng ${d.ten} lên bậc`}>
            <div className="tcc-nhan">
              <span className="tcc-o"><TrendingUp size={22} aria-hidden="true" /></span>
              Dạng “{d.ten}”
            </div>
            <div className="tcc-bac">
              <span className="tcc-bac-cu">{d.tu}</span>
              <ArrowRight size={22} aria-hidden="true" />
              <span className="tcc-bac-moi">
                {d.den}
                <TrendingUp size={20} aria-hidden="true" />
              </span>
            </div>
            <div className="tcc-thang" aria-hidden="true">
              {BAC.map((b) => (
                <div key={b} className={BAC.indexOf(b) <= BAC.indexOf(d.den as (typeof BAC)[number]) ? 'on' : ''}>
                  <i />
                  {b}
                </div>
              ))}
            </div>
            <p>Từ chặng sau, em có câu bậc {d.den} ở dạng này.</p>
          </section>
        ))}

        {view.dong.length > 0 && (
          <ul className="tcc-the tcc-ds">
            {view.dong.map((d) => {
              const Icon = BIEU_TUONG[d.kieu]
              return (
                <li key={d.kieu}>
                  <span className="tcc-o"><Icon size={22} aria-hidden="true" /></span>
                  <b>{d.chu}</b>
                </li>
              )
            })}
          </ul>
        )}

        {view.exp && (
          <div className="tcc-the tcc-exp">
            <span className="tcc-o"><Award size={24} aria-hidden="true" /></span>
            <div>
              <div className="tcc-exp-so">
                +{view.exp.homNay} EXP<small>hôm nay</small>
              </div>
              {view.exp.conLai !== null && (
                <div className="tcc-exp-phu">
                  Thần thú của em còn <b>{view.exp.conLai} EXP</b> nữa là lên cấp
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="tcc-day">
        <button ref={nutChinh} type="button" className="tcc-nut" onClick={veBang}>
          Về Bảng nhiệm vụ
        </button>
        <button type="button" className="tcc-nut tcc-nut--dich" onClick={dong}>
          Xem kết quả chặng
        </button>
      </footer>
    </div>
  )
}
