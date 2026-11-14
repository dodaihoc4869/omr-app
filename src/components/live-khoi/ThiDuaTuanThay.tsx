// MÁY THẦY · THI ĐUA ĐỘI TUẦN (đợt 4 — bản vẽ thầy duyệt docs/ban-ve-sinh-ton-v2-1311/17-thi-dua-tuan-may-thay-1366.jpg; đặc tả mục 9–10). Mở từ phòng chờ Live theo khối
// (nút «Thi đua tuần» ở đầu LopNoiThay), mảnh lười. Lượt hạ cộng dồn mọi ván trong tuần theo ĐỘI CẢ HỌC KỲ; danh hiệu tuần này (đang dẫn) + đã trao (tuần trước).
// Chỉ em thật — máy bù không bao giờ vào bảng này (máy chủ lọc). Nền xanh than cố định như các lớp nổi Live theo khối; không mã màu thô.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './thi-dua-tuan.css'
import { MAU_SINH_TON, MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { goiLenh } from '../../lib/goi-lenh-thay'

const DOI = [['Natri', '--p-cam'], ['Kali', '--p-tim-2'], ['Đồng', '--p-xanh'], ['Canxi', '--p-do']] as const
const NEN: CSSProperties = { ...(MAU_XANH_THAN as CSSProperties), ...(MAU_SINH_TON as CSSProperties) }
interface DanhHieu { loai: string; ten: string; nguoi: string[]; so: number }
interface DuLieu { chuTuan: string; doi: number[]; soEm: number; nay: DanhHieu[]; truoc: DanhHieu[]; van: number[]; thang: number[] }
const DON_VI: Record<string, (n: number) => string> = { 'tho-san': (n) => `${n} lượt hạ`, 'pha-tk': (n) => `tiêu diệt thủ khoa ${n} lần`, 'ha-thay': (n) => `${n} lần` }

const bonSo = (v: unknown): number[] => { const a = Array.isArray(v) ? v.slice(0, 4).map((x) => Math.max(0, Math.floor(Number(x)) || 0)) : []; return a.length === 4 ? a : [0, 0, 0, 0] }
/** Đội nhiều ván thắng nhất tuần (ván ở phòng chờ ca; bằng nhau ⇒ đội đứng trước). Chưa đội nào thắng ván nào ⇒ null (không hiện dòng). */
function doiThangNhat(thang: readonly number[], van: readonly number[]): { i: number; thang: number; van: number } | null {
  let i = 0
  for (let d = 1; d < 4; d++) if ((thang[d] ?? 0) > (thang[i] ?? 0)) i = d
  return (thang[i] ?? 0) > 0 ? { i, thang: thang[i]!, van: Math.max(thang[i]!, van[i] ?? 0) } : null
}

function docDh(v: unknown): DanhHieu[] {
  return (Array.isArray(v) ? v : []).map((x) => (x ?? {}) as Record<string, unknown>).filter((x) => typeof x.ten === 'string' && Array.isArray(x.nguoi))
    .map((x) => ({ loai: String(x.loai ?? ''), ten: String(x.ten), nguoi: (x.nguoi as unknown[]).map(String), so: Math.max(0, Number(x.so) || 0) }))
}

export default function ThiDuaTuanThay({ khoi, onDong }: { khoi: number; onDong: () => void }) {
  const [du, setDu] = useState<DuLieu | null>(null)
  const [loi, setLoi] = useState('')
  const dongRef = useRef(onDong)
  useLayoutEffect(() => { dongRef.current = onDong })
  useEffect(() => {
    let bo = false
    void goiLenh('/gv/bpu/st-thi-dua', { khoi }, 'Máy chủ chưa có bảng thi đua tuần.').then((r) => {
      if (bo) return
      if (!r.ok) { setLoi(r.chu); return }
      const d = r.du, vach = Array.isArray(d.doi) ? d.doi.slice(0, 4).map((x) => Math.max(0, Number(x) || 0)) : []
      setDu({ chuTuan: String(d.chuTuan ?? ''), doi: vach.length === 4 ? vach : [0, 0, 0, 0], soEm: Number(d.soEm) || 0, nay: docDh(d.danhHieuTuanNay), truoc: docDh(d.danhHieuTuanTruoc), van: bonSo(d.van), thang: bonSo(d.thang) })
    })
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dongRef.current() }
    window.addEventListener('keydown', phim)
    return () => { bo = true; window.removeEventListener('keydown', phim) }
  }, [khoi])

  const max = Math.max(1, ...(du?.doi ?? [0]))
  const xep = (du?.doi ?? []).map((ha, i) => ({ ha, i })).sort((a, b) => b.ha - a.ha || a.i - b.i)
  const nhat = du ? doiThangNhat(du.thang, du.van) : null
  const dongDh = (d: DanhHieu) => <li key={d.loai}><b>{d.ten}:</b> <em>{d.nguoi.join(', ')}</em> · {(DON_VI[d.loai] ?? String)(d.so)}</li>
  return createPortal(
    <div className="tdt" style={NEN} role="dialog" aria-modal="true" aria-labelledby="tdt-tieu-de">
      <header className="tdt-dau">
        <h2 id="tdt-tieu-de">Thi đua đội</h2>
        <span>{du ? `Khối ${khoi} · tuần ${du.chuTuan} · lượt hạ cộng dồn mọi ván` : `Khối ${khoi}`}</span>
        <button type="button" className="tdt-dong" onClick={onDong}>Đóng</button>
      </header>
      {!du ? <p className="tdt-cho" role="status">{loi || 'Đang tải thi đua tuần…'}</p> : (
        <div className="tdt-than">
          <ol className="tdt-cot" aria-label="Lượt hạ của bốn đội trong tuần">
            {xep.map(({ ha, i }, hang) => (
              <li key={i} style={{ ['--doi' as string]: `var(${DOI[i][1]})` } as CSSProperties}>
                <span className="tdt-so">{ha}</span>
                <i aria-hidden="true" style={{ height: `${Math.max(2, Math.round((ha / max) * 100))}%` }} />
                <span className="tdt-ten">{hang + 1}. Đội {DOI[i][0]}</span>
              </li>
            ))}
          </ol>
          <aside className="tdt-dh">
            <h3>Danh hiệu tuần này</h3>
            {du.nay.length || nhat ? (
              <ul>
                {du.nay.map(dongDh)}
                {nhat ? <li key="thang" className="tdt-thang" style={{ ['--doi' as string]: `var(${DOI[nhat.i][1]})` } as CSSProperties}><b>Đội {DOI[nhat.i][0]}</b> thắng {nhat.thang} / {nhat.van} ván tuần này</li> : null}
              </ul>
            ) : <p>Chưa có ván nào trong tuần. Các em chơi là bảng tự cập nhật.</p>}
            <p className="tdt-ghi">Danh hiệu hiện cạnh tên em suốt tuần sau. Chỉ tính các em thật trong khối.</p>
            {du.truoc.length ? <><h3>Đã trao tuần trước</h3><ul>{du.truoc.map(dongDh)}</ul></> : null}
          </aside>
        </div>
      )}
    </div>,
    document.body,
  )
}
