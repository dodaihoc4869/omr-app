// ĐẾM NGƯỢC NGÀY THI TỐT NGHIỆP THPT 22/06/2027 — CHỈ học sinh lớp 12, đầu màn Hôm nay (thầy 09/11 duyệt bản vẽ docs/ban-ve-dem-nguoc-0911:
// «làm thêm một cái gì đó đếm ngược ngày thi đại học (22/6/2027) siêu đẹp tinh tế … lớp 12 thôi» · «chèn vào khung ống thí nghiệm cho tinh tế»).
// Tính theo NGÀY GIỜ VIỆT NAM bằng giờ máy chủ (`gioMayChu`) ⇒ máy em đặt sai giờ vẫn đúng. 0 lệnh mạng. Sau ngày thi: không hiện.
// Màu theo chặng (chỉ biến màu app học sinh, CSS trong hoc-tap.css `.dnt`): > 30 ngày chàm · ≤ 30 cam «Chặng nước rút» · ≤ 7 cam «Tuần cuối» · ngày thi lục.
import { gioMayChu } from '../../lib/gio-may-chu'

export const NGAY_THI_2027 = Date.UTC(2027, 5, 22)
/** Giả định ngày khai giảng năm học lớp 12 (chỉ dùng cho mực ống nghiệm «đã đi x % năm học»). */
export const KHAI_GIANG_2026 = Date.UTC(2026, 8, 5)
const NGAY_MS = 86_400_000

export type ChangDem = 'binh' | 'gap' | 'tuan' | 'thi'
export interface DemNguoc { con: number; phanTram: number; chang: ChangDem; tuan: number; cau: number }

/** Tên lớp hiệu lực là lớp 12 («12 - Lớp Thường», «12 Tinh Hoa», «12A1»…). */
export const laLop12 = (lop: string | null | undefined): boolean => /^\s*12(?!\d)/.test(String(lop ?? ''))

/** Số ngày còn (theo ngày Việt Nam), phần trăm năm học, chặng. null = đã qua ngày thi. */
export function tinhDemNguoc(nowMs: number): DemNguoc | null {
  const homNay = Math.floor((nowMs + 7 * 3_600_000) / NGAY_MS) * NGAY_MS
  const con = Math.round((NGAY_THI_2027 - homNay) / NGAY_MS)
  if (con < 0) return null
  const phanTram = Math.max(0, Math.min(100, Math.round((100 * (homNay - KHAI_GIANG_2026)) / (NGAY_THI_2027 - KHAI_GIANG_2026))))
  const chang: ChangDem = con === 0 ? 'thi' : con <= 7 ? 'tuan' : con <= 30 ? 'gap' : 'binh'
  return { con, phanTram, chang, tuan: Math.floor(con / 7), cau: con * 28 }
}

const NHAN: Record<ChangDem, string> = { binh: 'Đếm ngược', gap: 'Chặng nước rút', tuan: 'Tuần cuối', thi: 'Hôm nay' }

/** Ống nghiệm 38×128: miệng trên, thân y 12→117, đáy tròn; mực = `pt` % chiều cao thân tính từ đáy; vạch 25/50/75 %; bọt khí tĩnh. */
function OngNghiem({ pt }: { pt: number }) {
  const top = 14, day = 117, h = day - top, muc = day - (h * pt) / 100
  const than = 'M8 12 H30 V106 A11 11 0 0 1 8 106 Z'
  return (
    <svg viewBox="0 0 38 128" aria-hidden="true">
      <defs><clipPath id="dnt-than"><path d={than} /></clipPath></defs>
      <path className="dnt-thuy-tinh" d={than} />
      <g clipPath="url(#dnt-than)">
        <rect className="dnt-long" x="0" y={muc} width="38" height={128 - muc} />
        <ellipse className="dnt-khum" cx="19" cy={muc} rx="11" ry="2.6" />
        {pt > 8 && <>
          <circle className="dnt-bot" cx="15" cy={Math.min(day - 8, muc + 14)} r="2.2" />
          <circle className="dnt-bot" cx="23" cy={Math.min(day - 4, muc + 26)} r="1.6" />
          <circle className="dnt-bot" cx="18" cy={Math.min(day - 2, muc + 36)} r="1.2" />
        </>}
      </g>
      {[25, 50, 75].map((p) => { const y = day - (h * p) / 100; return <line key={p} className="dnt-vach" x1="24" y1={y} x2="30" y2={y} /> })}
      <rect className="dnt-anh" x="11" y="18" width="3" height="70" rx="1.5" />
      <rect className="dnt-mieng" x="5" y="8" width="28" height="6" rx="3" />
    </svg>
  )
}

export default function DemNguocThi({ lop, nowMs }: { lop: string; nowMs?: number }) {
  if (!laLop12(lop)) return null
  const d = tinhDemNguoc(nowMs ?? gioMayChu())
  if (!d) return null
  const thi = d.chang === 'thi', pt = thi ? 100 : d.phanTram
  return (
    <section className="dnt" data-chang={d.chang} aria-label={thi ? 'Hôm nay thi tốt nghiệp THPT' : `Còn ${d.con} ngày đến kỳ thi tốt nghiệp THPT`}>
      <div className="dnt-so" aria-hidden="true">
        {thi
          ? <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v6" /></svg>
          : <b>{d.con}</b>}
        <small>{thi ? 'Ngày thi' : 'Ngày'}</small>
      </div>
      <div className="dnt-noi">
        <span className="dnt-nhan">{NHAN[d.chang]}</span>
        <span className="dnt-tieu">Thi tốt nghiệp THPT</span>
        <span className="dnt-ngay">Thứ Ba · 22/06/2027</span>
        <span className="dnt-phu">{thi ? 'Bình tĩnh, đọc kĩ đề, làm câu chắc trước. Thầy tin em.' : `≈ ${d.tuan} tuần · đủ 28 câu mỗi ngày là thêm ${d.cau.toLocaleString('vi-VN')} câu`}</span>
        {!thi && <span className="dnt-duoi">đã đi <b>{d.phanTram}%</b> năm học lớp 12 · từ khai giảng 05/09</span>}
      </div>
      <div className="dnt-ong" role="img" aria-label={`Ống nghiệm: đã đi ${pt}% năm học lớp 12`}>
        <OngNghiem pt={pt} />
        <small>{pt}%<span>năm học</span></small>
      </div>
    </section>
  )
}
