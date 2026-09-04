// BIỂU ĐỒ TIẾN BỘ — khối ĐẦU TIÊN trong hồ sơ mỗi em.
//
// Thầy mở hồ sơ một em là câu hỏi đầu tiên luôn là "em này đang lên hay đang
// xuống". Khối này trả lời ngay ở dòng đầu, bằng chữ kèm số, rồi mới tới biểu
// đồ để nhìn cho rõ.
//
// Hai đường, hai chuyện khác nhau (lib/tien-bo.ts): điểm từng ca nhấp nhô theo
// độ khó từng đề; đường trung bình cộng dồn mới là xu hướng thật.
//
// Hoạt ảnh chỉ động vào stroke-dashoffset và opacity — không bắt trình duyệt
// tính lại bố cục nên mượt cả trên điện thoại. Máy bật "giảm chuyển động" thì
// hiện thẳng trạng thái cuối.
import { useEffect, useMemo, useRef, useState } from 'react'
import { TheNoiDung, OThongBao } from './DesignSystem'
import { chuoiTienBo, moc, nhanXetTienBo, trungBinhCongDon } from '../lib/tien-bo'
import type { HoSoEm } from '../lib/exam-api'

const NHAN_NHO: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }
const TIEU_DE: React.CSSProperties = { fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', fontWeight: 700 }

const W = 320
const H = 132
const LE_T = 24
const LE_P = 10
const LE_TREN = 12
const LE_DUOI = 22

function ngayNgan(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function soVN(x: number, le = 2): string {
  return x.toFixed(le).replace('.', ',')
}

export default function KhoiTienBo({ ca }: { ca: HoSoEm['ca'] }) {
  const ds = useMemo(() => chuoiTienBo(ca), [ca])
  const cong = useMemo(() => trungBinhCongDon(ds.map((d) => d.diem)), [ds])
  const nx = useMemo(() => nhanXetTienBo(ds), [ds])
  const { cao, thap } = useMemo(() => moc(ds), [ds])
  const [chon, setChon] = useState<number | null>(null)

  const tat = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [ra, setRa] = useState(tat)
  const oRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (tat) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRa(true)))
    return () => cancelAnimationFrame(id)
  }, [tat])

  if (ds.length === 0) {
    return (
      <TheNoiDung>
        <div style={TIEU_DE}>Tiến bộ qua các bài</div>
        <OThongBao tone="cam">Em chưa có bài nào đã chấm điểm.</OThongBao>
      </TheNoiDung>
    )
  }

  const n = ds.length
  const x = (i: number) => (n === 1 ? (W + LE_T - LE_P) / 2 : LE_T + ((W - LE_T - LE_P) * i) / (n - 1))
  const y = (v: number) => LE_TREN + (H - LE_TREN - LE_DUOI) * (1 - Math.max(0, Math.min(10, v)) / 10)

  const duong = ds.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.diem).toFixed(1)}`).join(' ')
  const duongTb = cong.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const vung = n > 1 ? `${duong} L${x(n - 1).toFixed(1)},${H - LE_DUOI} L${x(0).toFixed(1)},${H - LE_DUOI} Z` : ''

  const mauChieu = nx.chieu === 'len' ? 'var(--xanh)' : nx.chieu === 'xuong' ? 'var(--do)' : 'var(--nhat)'
  const mui = nx.chieu === 'len' ? '↑' : nx.chieu === 'xuong' ? '↓' : '→'
  const em = chon !== null ? ds[chon] : null

  return (
    <TheNoiDung>
      <div className="flex items-start justify-between" style={{ gap: 'var(--k3)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={TIEU_DE}>Tiến bộ qua các bài</div>
          <div style={{ ...NHAN_NHO, marginTop: 2 }}>
            {n} bài đã chấm · trung bình chung {soVN(cong[n - 1])}
          </div>
        </div>
        {nx.chieu !== 'chua_du' && (
          <span
            className="inline-flex items-center font-bold"
            style={{ gap: 4, height: 28, padding: '0 var(--k3)', borderRadius: 'var(--bo-tron)', background: 'var(--the-2)', color: mauChieu, fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', flex: '0 0 auto' }}
          >
            {mui} {nx.chieu === 'len' ? 'Đang lên' : nx.chieu === 'xuong' ? 'Đang xuống' : 'Đi ngang'}
          </span>
        )}
      </div>

      <div ref={oRef} style={{ marginTop: 'var(--k3)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} role="img" aria-label={`Điểm qua ${n} bài, ${nx.cau}`}>
          {[0, 5, 10].map((v) => (
            <g key={v}>
              <line x1={LE_T} y1={y(v)} x2={W - LE_P} y2={y(v)} stroke="var(--vien)" strokeWidth="1" />
              <text x={LE_T - 6} y={y(v) + 3.5} textAnchor="end" fontSize="9" fill="var(--mo)" fontFamily="var(--sans)">
                {v}
              </text>
            </g>
          ))}

          {vung && <path d={vung} fill="var(--tim)" opacity={ra ? 0.08 : 0} style={{ transition: tat ? 'none' : 'opacity .8s ease .35s' }} />}

          {/* Trung bình cộng dồn — nét đứt, mảnh hơn: đây là xu hướng, không phải điểm thật của ca nào */}
          {n > 1 && (
            <path
              d={duongTb}
              fill="none"
              stroke={mauChieu}
              strokeWidth="1.6"
              strokeDasharray="4 3"
              strokeLinecap="round"
              opacity={ra ? 0.85 : 0}
              style={{ transition: tat ? 'none' : 'opacity .7s ease .75s' }}
            />
          )}

          {/* Điểm từng ca */}
          {n > 1 && (
            <path
              d={duong}
              fill="none"
              stroke="var(--tim)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={ra ? 0 : 1}
              style={{ transition: tat ? 'none' : 'stroke-dashoffset 1.1s cubic-bezier(.22,.9,.28,1)' }}
            />
          )}

          {ds.map((d, i) => {
            const laChon = chon === i
            const laCuoi = i === n - 1
            return (
              <g key={d.maCa + i} onClick={() => setChon(laChon ? null : i)} style={{ cursor: 'pointer' }}>
                <circle cx={x(i)} cy={y(d.diem)} r={11} fill="transparent" />
                <circle
                  cx={x(i)}
                  cy={y(d.diem)}
                  r={laChon ? 5.6 : laCuoi ? 4.8 : 3.2}
                  fill={laChon || laCuoi ? 'var(--tim)' : 'var(--the)'}
                  stroke="var(--tim)"
                  strokeWidth="2"
                  opacity={ra ? 1 : 0}
                  style={{ transition: tat ? 'none' : `opacity .3s ease ${420 + i * 60}ms, r .18s ease` }}
                />
              </g>
            )
          })}

          {/* Mốc cao nhất / thấp nhất — chỉ khi có từ 3 bài trở lên và hai mốc khác nhau */}
          {n >= 3 && cao && thap && cao.maCa !== thap.maCa && (
            <>
              <text x={x(ds.indexOf(cao))} y={y(cao.diem) - 9} textAnchor="middle" fontSize="9" fill="var(--xanh)" fontFamily="var(--sans)" fontWeight="700" opacity={ra ? 1 : 0} style={{ transition: tat ? 'none' : 'opacity .5s ease 1s' }}>
                {soVN(cao.diem, 1)}
              </text>
              <text x={x(ds.indexOf(thap))} y={y(thap.diem) + 15} textAnchor="middle" fontSize="9" fill="var(--do)" fontFamily="var(--sans)" fontWeight="700" opacity={ra ? 1 : 0} style={{ transition: tat ? 'none' : 'opacity .5s ease 1s' }}>
                {soVN(thap.diem, 1)}
              </text>
            </>
          )}

          {ds.map((d, i) =>
            i === 0 || i === n - 1 || n <= 5 ? (
              <text key={`t${i}`} x={x(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--mo)" fontFamily="var(--sans)">
                {ngayNgan(d.ngay)}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      <div style={{ ...NHAN_NHO, marginTop: 'var(--k2)', lineHeight: 1.6 }}>{nx.cau}</div>

      <div className="flex items-center flex-wrap" style={{ gap: 'var(--k3)', marginTop: 'var(--k2)' }}>
        <span className="inline-flex items-center" style={{ ...NHAN_NHO, gap: 5 }}>
          <span style={{ width: 14, height: 2.5, background: 'var(--tim)', borderRadius: 2, display: 'inline-block' }} /> Điểm từng bài
        </span>
        <span className="inline-flex items-center" style={{ ...NHAN_NHO, gap: 5 }}>
          <span style={{ width: 14, height: 0, borderTop: `2px dashed ${mauChieu}`, display: 'inline-block' }} /> Trung bình cộng dồn
        </span>
      </div>

      {em && (
        <OThongBao>
          <b>{em.tenCa || `Ca ${em.maCa}`}</b> ngày {ngayNgan(em.ngay)}: {soVN(em.diem)} điểm
          {em.hang !== null && em.siSo !== null ? `, hạng ${em.hang}/${em.siSo}` : ''}.
        </OThongBao>
      )}
      {!em && n > 1 && <div style={NHAN_NHO}>Chạm vào một chấm để xem bài đó.</div>}
    </TheNoiDung>
  )
}
