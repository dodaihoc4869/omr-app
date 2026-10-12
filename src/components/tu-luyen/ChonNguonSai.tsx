// Khối "Nguồn câu sai" của chế độ 1: thẻ tick có biểu tượng + số câu còn trong kho theo nguồn (thầy lệnh 30/09).
import { DS_NGUON, nguonCoCau, type MaNguonSai } from './nguon-cau-sai'
import './chon-nguon-sai.css'

function IconNguon({ ma }: { ma: MaNguonSai }) {
  const p = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (ma === 'ca') return <svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12l2 2 4-4" /></svg>
  // 12/10: biểu tượng việc học, không hình trò chơi — Học theo kế hoạch = sách mở · Ôn theo kế hoạch = lịch có vòng ôn · Luyện tập trước đây = hộp lưu.
  if (ma === 'dao') return <svg {...p}><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5v13" /></svg>
  if (ma === 'doan') return <svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M15 15.5a3 3 0 1 1-1-2.2" /><path d="M14.5 12.5v1.6h-1.6" /></svg>
  if (ma === 'bia') return <svg {...p}><rect x="3.5" y="4" width="17" height="5" rx="1.5" /><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9" /><path d="M10 13h4" /></svg>
  if (ma === 'tu_luyen') return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg>
  return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 10v10" /></svg>
}

export interface ChonNguonSaiProps {
  theoNguon: Readonly<Record<string, number>>
  chon: ReadonlySet<string>
  onDoi: (chon: Set<MaNguonSai>) => void
}

export default function ChonNguonSai({ theoNguon, chon, onDoi }: ChonNguonSaiProps) {
  const co = nguonCoCau(theoNguon)
  const du = co.length > 0 && co.every((m) => chon.has(m))
  const doi = (ma: MaNguonSai) => {
    const n = new Set([...chon].filter((x): x is MaNguonSai => co.includes(x as MaNguonSai)))
    if (n.has(ma)) n.delete(ma)
    else n.add(ma)
    onDoi(n)
  }
  return (
    <div className="tlu-nguon-sai">
      <div className="tlu-nguon-sai-dau">
        <h2 className="tlu-muc" id="tlu-nguon-sai-ten">Nguồn câu sai</h2>
        <button type="button" className="tlu-nut-chu" disabled={du} onClick={() => onDoi(new Set(co))}>Chọn tất cả</button>
      </div>
      <div className="tlu-nguon-sai-luoi" role="group" aria-labelledby="tlu-nguon-sai-ten">
        {DS_NGUON.map((n) => {
          const so = Number(theoNguon[n.ma]) || 0
          const bat = so > 0 && chon.has(n.ma)
          return (
            <label key={n.ma} className="tlu-the-nguon" data-nguon={n.ma} data-chon={bat ? '1' : '0'} data-rong={so === 0 ? '1' : '0'}>
              <input type="checkbox" checked={bat} disabled={so === 0} onChange={() => doi(n.ma)} />
              <span className="tlu-the-nguon-icon">
                <IconNguon ma={n.ma} />
                {/* dấu tick gắn góc biểu tượng — nhường chiều ngang cho tên nguồn ở màn hẹp */}
                <span className="tlu-the-nguon-dau" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                </span>
              </span>
              <span className="tlu-the-nguon-chu">
                <b>{n.ten}</b>
                <span className="tlu-tab">{so} câu</span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
