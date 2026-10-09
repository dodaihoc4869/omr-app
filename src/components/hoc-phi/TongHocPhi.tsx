import { dinhDangTien, TEN_TRANG_THAI, type TongHocPhi as Tong, type TrangThaiHocPhi } from '../../lib/hoc-phi'
import './hoc-phi.css'

const THU_TU: TrangThaiHocPhi[] = ['du', 'con_thieu', 'chua_nop', 'khong_thu']

/** BẢNG TỔNG HỌC PHÍ đầu màn Học sinh: tổng phải thu · đã thu · còn thiếu (theo bộ lọc khối/lớp đang chọn) + chip lọc theo trạng thái. */
export default function TongHocPhi({ tong, phamVi, loc, onLoc, loi }: {
  tong: Tong | null
  /** "Toàn trung tâm" hoặc "Lớp 11"… */
  phamVi: string
  loc: TrangThaiHocPhi | null
  /** Không truyền ⇒ không vẽ hàng chip lọc (màn Học sinh 2.0 đã có ô chọn Học phí trên thanh lọc — trung tu 09/10, bỏ lọc trùng). */
  onLoc?: (t: TrangThaiHocPhi | null) => void
  loi?: string
}) {
  const phanTram = tong && tong.phaiNop > 0 ? Math.min(100, Math.round((tong.daNop / tong.phaiNop) * 1000) / 10) : 0
  return (
    <section className="hp-tong" aria-label="Tổng học phí" data-khoi="tong-hoc-phi">
      <div className="hp-tong-dau">
        <h2 className="hp-tong-tieu-de">Học phí</h2>
        <span className="hp-tong-pham-vi">
          {phamVi}
          {tong ? ` · ${tong.soEm} em` : ''}
        </span>
      </div>
      {loi ? (
        <div className="hp-o-phu" role="alert">{loi}</div>
      ) : !tong ? (
        <div className="hp-o-phu">Đang tải học phí…</div>
      ) : (
        <>
          <div className="hp-tong-so">
            <div className="hp-o">
              <span className="hp-o-nhan">Tổng học phí</span>
              <span className="hp-o-so">{dinhDangTien(tong.phaiNop)}</span>
            </div>
            <div className="hp-o hp-o--da">
              <span className="hp-o-nhan">Đã nộp</span>
              <span className="hp-o-so">{dinhDangTien(tong.daNop)}</span>
              <span className="hp-o-phu">{phanTram.toLocaleString('vi-VN')}% tổng học phí</span>
            </div>
            <div className="hp-o hp-o--thieu">
              <span className="hp-o-nhan">Chưa nộp</span>
              <span className="hp-o-so">{dinhDangTien(tong.conThieu)}</span>
              <span className="hp-o-phu">{tong.dem.chua_nop + tong.dem.con_thieu} em còn nợ</span>
            </div>
          </div>
          <div className="hp-thanh" role="progressbar" aria-label="Phần học phí đã nộp" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phanTram}>
            <span style={{ width: `${phanTram}%` }} />
          </div>
          {onLoc && (
          <div className="hp-loc" role="group" aria-label="Lọc học sinh theo học phí">
            {THU_TU.filter((t) => t !== 'khong_thu' || tong.dem.khong_thu > 0).map((t) => (
              <button
                key={t}
                type="button"
                className={`hp-loc-nut hp-mau--${t}`}
                aria-pressed={loc === t}
                onClick={() => onLoc(loc === t ? null : t)}
              >
                {TEN_TRANG_THAI[t]} <b>{tong.dem[t]}</b>
              </button>
            ))}
          </div>
          )}
        </>
      )}
    </section>
  )
}
