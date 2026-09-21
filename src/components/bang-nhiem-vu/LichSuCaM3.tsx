// TAB "XEM ĐIỂM & LỊCH SỬ CA THI" của cổng học sinh (việc C · C2) — bản Material 3. StudentPortalScreen chỉ nối dây: dữ liệu,
// dòng đếm câu (DongDemCau, khuôn chung 3 app) và hai hành động đều do nó đưa vào; ở đây chỉ là VẺ NGOÀI. Đường không phải cổng
// học sinh vẫn dùng đoạn JSX cũ trong StudentPortalScreen, nên component này không cần biết giáo viên.
import type { ReactNode } from 'react'
import { Award, ChevronRight, Clock } from 'lucide-react'
import '../m3'
import './lich-su-ca.css'

export interface MucLichSuCa {
  maCa: string
  tenCa?: string
  nopLuc?: string
  tong?: number | null
  diemI?: number | null
  diemII?: number | null
  diemIII?: number | null
  tongCau?: number | null
  [k: string]: unknown
}

/** Bậc điểm → vai trò màu: ≥ 8 đạt (tertiary), ≥ 6,5 khá (primary), ≥ 5 cần cố gắng (cảnh báo), thấp hơn (error), chưa chấm (trung tính). */
export function mucDiem(d: number | null | undefined): 'cao' | 'kha' | 'tb' | 'thap' | 'chua' {
  if (d === null || d === undefined || !Number.isFinite(d)) return 'chua'
  if (d >= 8) return 'cao'
  if (d >= 6.5) return 'kha'
  if (d >= 5) return 'tb'
  return 'thap'
}

const fmt = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '--')

export default function LichSuCaM3({
  dangTai,
  ds,
  ngayGio,
  dongDem,
  dangMoDe,
  onXemBaoCao,
  onXemDe,
}: {
  dangTai: boolean
  ds: MucLichSuCa[]
  ngayGio: (iso: string) => string
  dongDem: (item: MucLichSuCa) => ReactNode
  dangMoDe: boolean
  onXemBaoCao: (item: MucLichSuCa) => void
  onXemDe: (maCa: string) => void
}) {
  return (
    <div className="lsc">
      <div className="lsc-tieu">
        <h2 className="lsc-h">Lịch sử ca kiểm tra & Báo cáo kết quả</h2>
        <p className="lsc-phu">Xem điểm chi tiết và báo cáo học tập của tất cả các ca kiểm tra em đã tham gia</p>
      </div>

      {dangTai ? (
        <div className="lsc-ds" aria-busy="true" aria-live="polite">
          <span className="lsc-sr">Đang tải lịch sử thi…</span>
          <div className="m3-xuong" style={{ height: 220 }} />
          <div className="m3-xuong" style={{ height: 220 }} />
        </div>
      ) : ds.length === 0 ? (
        <div className="lsc-trong">
          <Award size={40} aria-hidden="true" />
          <h3 className="lsc-trong-ten">Chưa có ca kiểm tra nào</h3>
          <p className="lsc-phu">Em chưa tham gia ca kiểm tra nào trên hệ thống hoặc ca kiểm tra chưa được đồng bộ.</p>
        </div>
      ) : (
        <div role="region" aria-label="Lịch sử ca kiểm tra và báo cáo" className="lsc-ds">
          {ds.map((item) => {
            const muc = mucDiem(item.tong)
            const coDem = typeof item.tongCau === 'number' && item.tongCau > 0
            return (
              <article key={item.maCa} className="lsc-the" aria-label={item.tenCa || `Ca kiểm tra mã ${item.maCa}`}>
                <div className="lsc-dau">
                  <div className="lsc-ten">
                    <span className="lsc-ma">#{item.maCa}</span>
                    <h3 className="lsc-ten-ca">{item.tenCa || `Ca kiểm tra mã ${item.maCa}`}</h3>
                  </div>
                  <div className="lsc-diem" data-muc={muc} aria-label={`Điểm ${fmt(item.tong)} trên 10`}>
                    <b>{fmt(item.tong)}</b>
                    <span>/10</span>
                  </div>
                </div>

                <div className="lsc-meta">
                  <span className="lsc-gio">
                    <Clock size={16} aria-hidden="true" />
                    {ngayGio(String(item.nopLuc ?? ''))}
                  </span>
                  {/* CHƯA CHẤM THÌ KHÔNG HIỆN dòng đếm câu (cấm in "Đúng 0/0 câu") — xem ghi chú ở bản cũ trong StudentPortalScreen. */}
                  {coDem && <span className="lsc-dem">{dongDem(item)}</span>}
                </div>

                <dl className="lsc-phan">
                  <div>
                    <dt>Phần I · Trắc nghiệm</dt>
                    <dd>{fmt(item.diemI)}</dd>
                  </div>
                  <div>
                    <dt>Phần II · Đúng–sai</dt>
                    <dd>{fmt(item.diemII)}</dd>
                  </div>
                  <div>
                    <dt>Phần III · Trả lời ngắn</dt>
                    <dd>{fmt(item.diemIII)}</dd>
                  </div>
                </dl>

                <div className="lsc-nut">
                  <button type="button" onClick={() => onXemBaoCao(item)} className="m3-nut-tonal lsc-nut-chinh">
                    <span>Xem báo cáo</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => onXemDe(item.maCa)} disabled={dangMoDe} className="m3-nut-vien lsc-nut-phu">
                    Xem đề và lời giải kèm lỗi sai
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
