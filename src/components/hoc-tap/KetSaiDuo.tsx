// «VÌ SAO EM SAI?» — phần giao diện trong dải «Chưa đúng» (khối B đợt 2, thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-2b).
// Kho lý do + luật chờ: vi-sao-sai.ts. Kiểu: vi-sao-sai.css, nạp qua @import trong styles/trong-lam-bai.css (mảnh kiểu màn làm bài nạp sau — không thêm tệp
// precache, không thêm byte đường mở app).
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { LY_DO_SAI, chonLyDoSai, choCauSai, useLyDoSai } from './vi-sao-sai'

/** Phần thân dải «Chưa đúng»: đáp án đúng, lời giải ngắn, «Vì sao em sai?» (trừ câu làm lại), dòng nhóm sửa. */
export function KetSai({ qid, dap, giai, laLamLai, tenDang }: { qid: string; dap: ReactNode; giai: string; laLamLai: boolean; tenDang?: string }) {
  const ly = useLyDoSai(qid)
  const o = useRef<HTMLDivElement>(null), thoi = useRef(() => {})
  useLayoutEffect(() => { if (laLamLai) return; const het = choCauSai(qid); thoi.current = het; return het }, [qid, laLamLai])
  // CHỐT AN TOÀN (không bao giờ kẹt câu): sau lần vẽ đầu, dải có kích thước thật mà hàng ô lý do không đủ to để chạm (bố cục khổ lạ ẩn / ép nó) ⇒ thôi chờ.
  useEffect(() => {
    if (laLamLai) return
    const id = requestAnimationFrame(() => {
      const r = o.current?.getBoundingClientRect(), d = o.current?.closest('.duo-ket')?.getBoundingClientRect()
      if (d && d.width > 0 && (!r || r.width < 120 || r.height < 36)) thoi.current()
    })
    return () => cancelAnimationFrame(id)
  }, [qid, laLamLai])
  return <>
    <p><b>{dap}</b></p>
    {giai && <p className="duo-mo"><ChemText text={giai} /></p>}
    {!laLamLai && <div ref={o} className="ly-do" role="group" aria-labelledby={`ly-${qid}`}>
      <h3 id={`ly-${qid}`}>Vì sao em sai?</h3>
      <p className="ly-goi-y">Chạm một ô để A.I Đỗ Đại Học xếp cách sửa hợp với em.</p>
      <div className="o-ly">{LY_DO_SAI.map(([ma, ten]) => <button key={ma} type="button" aria-pressed={ly === ma} onClick={() => chonLyDoSai(qid, ma)}>{ten}</button>)}</div>
    </div>}
    <p className="duo-mo">{laLamLai ? 'Câu gốc vẫn trong nhóm sửa.' : tenDang ? <>Câu này vào nhóm sửa «<ChemText text={tenDang} />».</> : 'Câu này vào nhóm sửa của bài.'}</p>
  </>
}
