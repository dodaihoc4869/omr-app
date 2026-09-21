import { phanTram, thuCuaHan, type HomNay } from '../lib/hom-nay-api'
import '../styles/hom-nay.css'

/** KHỐI "BÀI TẬP VỀ NHÀ ĐANG CHẠY · CHIA LÔ THEO HẠN NỘP" — dùng chung ở màn Hôm nay và màn Giao bài tập về nhà (G2/G5).
 *  Mỗi bài một dòng: tên · lớp, dải lô (chấm đầy = lô đã tới), "lô x/y", % em kịp nhịp, hạn. Số đọc từ `dangChay` của
 *  `/ke-hoach/hom-nay-thay` (lệnh thầy chỉ đọc); chưa có → nói lý do máy chủ kèm, không bịa. */
export default function KhoiBtvnLo({ bt, tai, lyDo, onGiaoMoi }: { bt: HomNay['btvn'] | undefined; tai: boolean; lyDo: string; onGiaoMoi?: () => void }) {
  return (
    <section className="hn-the" aria-labelledby="hn-btvn">
      <div className="hn-the-dau">
        <h2 id="hn-btvn">BÀI TẬP VỀ NHÀ ĐANG CHẠY · CHIA LÔ THEO HẠN NỘP</h2>
        {onGiaoMoi && (
          <button type="button" className="hn-lien-ket" onClick={onGiaoMoi}>
            Giao bài mới
          </button>
        )}
      </div>
      {!bt && <p className="hn-trong">{tai ? 'Đang tải…' : `BTVN đang chạy: ${lyDo}${/[.!]$/.test(lyDo) ? '' : '.'}`}</p>}
      {bt && bt.dangChay.length === 0 && <p className="hn-trong">Chưa có bài tập về nhà nào đang chạy.</p>}
      {bt?.dangChay.map((b) => {
        const kip = phanTram(b.soEmKip, b.soEm)
        return (
          <div className="hn-btvn" key={b.ma}>
            <span className="hn-btvn-ten">
              {b.ten} · {b.lop}
            </span>
            <span className="hn-lo" aria-label={`Chặng ${b.loHienTai} trong ${b.tongLo} chặng`}>
              {Array.from({ length: b.tongLo }, (_, i) => (
                <i key={i} className={i < b.loHienTai ? 'da' : ''} />
              ))}
            </span>
            <span className="hn-btvn-lo">
              Chặng {b.loHienTai} trong {b.tongLo} chặng
            </span>
            <span className="hn-btvn-kip">{kip == null ? '' : `${kip}% kịp`}</span>
            <span className="hn-btvn-han">{b.han ? `hạn ${thuCuaHan(b.han)}` : ''}</span>
          </div>
        )
      })}
    </section>
  )
}
