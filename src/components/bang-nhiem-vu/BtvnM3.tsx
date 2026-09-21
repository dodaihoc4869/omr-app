// TAB "BÀI TẬP VỀ NHÀ" của cổng học sinh (việc C · C3) — bản Material 3. StudentPortalScreen chỉ nối dây (dữ liệu + ba hành động
// mở phiếu/xem lại/làm lại); ở đây chỉ là VẺ NGOÀI. Chữ, thứ tự sắp xếp (chưa nộp trước, hạn gần trước), điều kiện "làm lại" và
// điều kiện "hết hạn" giữ đúng như đoạn JSX cũ. Đường không phải cổng học sinh vẫn dùng đoạn cũ trong StudentPortalScreen.
import { CheckCircle2, Clock, Eye, RefreshCw, RotateCcw, ArrowRight, BookOpen } from 'lucide-react'
import '../m3'
import './btvn-m3.css'
import { gioHanVietNam, mocThoiGian } from '../../lib/han-bai-tap'

export interface MucBtvn {
  maBtvn?: string
  maCa: string
  tenBtvn?: string
  soCau?: number
  hanNop?: string
  daNop?: boolean
  nopLuc?: string
  diem?: number | null
  soDung?: number
  soLanLamLaiConLai?: number
  [k: string]: unknown
}

/** Sắp xếp như bản cũ: chưa nộp trước, rồi hạn gần trước (không có hạn = cuối). */
export function sapXepBtvn(ds: MucBtvn[]): MucBtvn[] {
  return [...ds].sort((a, b) => Number(!!a.daNop) - Number(!!b.daNop) || (mocThoiGian(a.hanNop) ?? Infinity) - (mocThoiGian(b.hanNop) ?? Infinity))
}

/** Nhãn hạn: cùng chữ với NhanHanBaiTap (dùng chung với app giáo viên) nhưng vẽ bằng vai trò M3. */
export function nhanHan(han: string | undefined, now: number, daNop: boolean): { chu: string; muc: 'xong' | 'gap' | 'thuong' } {
  const ms = mocThoiGian(han)
  const qua = ms !== undefined && ms <= now
  const sap = ms !== undefined && ms > now && ms - now <= 86400_000
  const nhan = daNop ? 'Đã nộp' : qua ? 'Quá hạn' : sap ? 'Hạn trong 24 giờ' : 'Hạn nộp'
  return { chu: `${nhan}: ${gioHanVietNam(han)} (giờ Việt Nam)`, muc: daNop ? 'xong' : qua || sap ? 'gap' : 'thuong' }
}

export default function BtvnM3({
  dangTai,
  ds,
  now,
  dangMoId,
  ngayGio,
  onMo,
  onTaiLai,
}: {
  dangTai: boolean
  ds: MucBtvn[]
  now: number
  /** `maBtvn || maCa` của bài đang mở phiếu (nút tương ứng tắt + hiện "Đang mở..."). */
  dangMoId: string | null | undefined
  ngayGio: (iso: string) => string
  onMo: (bt: MucBtvn, lamLai: boolean) => void
  onTaiLai: () => void
}) {
  return (
    <div className="btm">
      <div className="btm-tieu">
        <div className="btm-tieu-chu">
          <div className="btm-hang">
            <h2 className="btm-h">Bài tập về nhà</h2>
            <span className="m3-chip btm-chip-tertiary">Chia chặng theo ngày/giờ</span>
          </div>
          <p className="btm-phu">Mỗi bài chia thành các chặng mở dần theo ngày/giờ · làm chặng đang mở rồi nộp trước Hạn nộp</p>
        </div>
        <button type="button" onClick={onTaiLai} disabled={dangTai} className="m3-nut-vien btm-lam-moi">
          <RefreshCw size={18} className={dangTai ? 'btm-quay' : undefined} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Cách làm BTVN theo lô (thay 3 Vòng Phân Tầng cũ) */}
      <section className="btm-cach" aria-label="Cách làm bài tập về nhà">
        <div className="btm-cach-dau">
          <h3 className="btm-cach-ten">Cách làm bài tập về nhà: chia chặng theo ngày/giờ</h3>
          <span className="m3-chip btm-chip-tertiary">Xong chặng đang mở, chặng sau mở đúng nhịp</span>
        </div>
        <div className="btm-cach-luoi">
          <div className="btm-cach-o" data-vai="tertiary">
            <b>CHẶNG ĐANG MỞ</b>
            <span>Em làm chặng tới nhịp hôm nay. Xong sớm thì chặng sau vẫn mở đúng nhịp, không mở sớm hơn.</span>
          </div>
          <div className="btm-cach-o" data-vai="secondary">
            <b>CHẶNG SAU</b>
            <span>Mở dần theo ngày/giờ tính từ Hạn nộp, để không dồn bài vào phút chót.</span>
          </div>
          <div className="btm-cach-o" data-vai="error">
            <b>NỘP BÀI</b>
            <span>Xong các chặng thì nộp trước Hạn nộp chung. Quá Hạn nộp là máy chủ chặn nộp — cần Thầy gia hạn.</span>
          </div>
        </div>
      </section>

      {dangTai ? (
        <div className="btm-ds" aria-busy="true" aria-live="polite">
          <span className="btm-sr">Đang tải danh sách bài tập...</span>
          <div className="m3-xuong" style={{ height: 160 }} />
          <div className="m3-xuong" style={{ height: 160 }} />
        </div>
      ) : ds.length === 0 ? (
        <div className="btm-trong">
          <BookOpen size={40} aria-hidden="true" />
          <h3 className="btm-trong-ten">Chưa có bài tập về nhà nào</h3>
          <p className="btm-phu">Hiện tại Thầy chưa giao bài tập mới hoặc các bài tập trước đó đã hoàn tất.</p>
          <button type="button" onClick={onTaiLai} disabled={dangTai} className="m3-nut-tonal">
            <RefreshCw size={18} aria-hidden="true" />
            <span>Tải lại danh sách</span>
          </button>
        </div>
      ) : (
        <div role="region" aria-label="Bài tập về nhà" className="btm-ds">
          {sapXepBtvn(ds).map((bt) => {
            const id = bt.maBtvn || bt.maCa
            const dangMo = dangMoId === id
            const hetHan = (mocThoiGian(bt.hanNop) ?? Infinity) <= now
            const han = bt.hanNop ? nhanHan(bt.hanNop, now, !!bt.daNop) : null
            const conLuot = (bt.soLanLamLaiConLai ?? 3) > 0
            return (
              <article key={id} className="btm-the" data-da-nop={bt.daNop ? true : undefined} aria-label={bt.tenBtvn || `Bài tập ca ${bt.maCa}`}>
                <div className="btm-chips">
                  <span className="btm-ma">#{bt.maCa}</span>
                  <span className="m3-chip btm-chip-secondary">Chia chặng theo ngày/giờ</span>
                  {bt.daNop ? (
                    <span className="m3-chip btm-chip-tertiary">
                      <CheckCircle2 size={14} aria-hidden="true" /> Đã nộp
                    </span>
                  ) : (
                    <span className="m3-chip btm-chip-canh-bao">
                      <Clock size={14} aria-hidden="true" /> Chưa nộp
                    </span>
                  )}
                </div>

                <h3 className="btm-ten">{bt.tenBtvn || `Bài tập ca ${bt.maCa}`}</h3>

                <div className="btm-meta">
                  {(bt.soCau ?? 0) > 0 && (
                    <span>
                      Số câu: <strong>{bt.soCau}</strong>
                    </span>
                  )}
                  {han && (
                    <span className="btm-han" data-muc={han.muc}>
                      {han.chu}
                    </span>
                  )}
                  {bt.nopLuc && <span>Nộp lúc: {ngayGio(bt.nopLuc)}</span>}
                </div>

                {bt.daNop && bt.diem !== null && bt.diem !== undefined && (
                  <div className="btm-diem">
                    <b>{typeof bt.diem === 'number' && Number.isFinite(bt.diem) ? `${bt.diem.toFixed(2)}đ` : 'Chưa có điểm'}</b>
                    <span>
                      {bt.soDung}/{bt.soCau} câu đúng
                    </span>
                  </div>
                )}

                <div className="btm-nut">
                  {bt.daNop ? (
                    <>
                      <button type="button" onClick={() => onMo(bt, false)} disabled={dangMo} className="m3-nut-vien" title="Xem lại bài làm và lời giải chi tiết">
                        <Eye size={18} aria-hidden="true" />
                        <span>Xem lại bài</span>
                      </button>
                      {conLuot && !hetHan ? (
                        <button
                          type="button"
                          onClick={() => onMo(bt, true)}
                          disabled={dangMo}
                          className="m3-nut-tonal"
                          title={`Làm lại bài tập này (còn ${bt.soLanLamLaiConLai ?? 3}/3 lượt)`}
                        >
                          {dangMo ? <RefreshCw size={18} className="btm-quay" aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
                          <span>Làm lại (còn {bt.soLanLamLaiConLai ?? 3}/3 lần)</span>
                        </button>
                      ) : (
                        <span className="btm-ghi-chu">{hetHan ? 'Cần Thầy gia hạn để làm lại' : 'Đã hết lượt làm lại'}</span>
                      )}
                    </>
                  ) : hetHan ? (
                    <p className="btm-het-han">Đã hết hạn. Em báo Thầy để được gia hạn.</p>
                  ) : (
                    <button type="button" onClick={() => onMo(bt, false)} disabled={dangMo} className="m3-nut-chinh">
                      {dangMo ? (
                        <>
                          <RefreshCw size={18} className="btm-quay" aria-hidden="true" />
                          <span>Đang mở...</span>
                        </>
                      ) : (
                        <>
                          <span>Vào làm bài</span>
                          <ArrowRight size={18} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
