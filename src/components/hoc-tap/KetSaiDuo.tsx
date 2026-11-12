// «VÌ SAO EM SAI?» — phần giao diện trong dải «Chưa đúng» (khối B đợt 2, thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-2b).
// Kho lý do + luật chờ: vi-sao-sai.ts. Kiểu: vi-sao-sai.css, nạp qua @import trong styles/trong-lam-bai.css (mảnh kiểu màn làm bài nạp sau — không thêm tệp
// precache, không thêm byte đường mở app).
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import { GOI_Y_LY_DO, LY_DO_SAI, bacBoTu, chonLyDoSai, choCauSai, doanHieuNham, useLyDoSai } from './vi-sao-sai'

/** Phần thân dải «Chưa đúng»: đáp án đúng, lời giải bác bỏ / lời giải ngắn, «Vì sao em sai?» (trừ câu làm lại), dòng nhóm sửa. */
export function KetSai({ qid, dap, giai, laLamLai, tenDang, pa, lg, em = '', da = '' }: { qid: string; dap: ReactNode; giai: string; laLamLai: boolean; tenDang?: string
  pa?: readonly string[]; lg?: Parameters<typeof bacBoTu>[3]; em?: string; da?: string }) {
  const bb = bacBoTu(em, da, pa, lg)
  const ly = useLyDoSai(qid)
  // A.I đoán em mắc bẫy của phương án em chọn ⇒ chỉ GỢI Ý (nhãn «A.I đoán» cạnh «Hiểu nhầm»), KHÔNG chọn sẵn — thầy 12/11: «cho dừng hẳn lại để học sinh chọn rồi
  // bấm tiếp» (chọn sẵn ⇒ «Tiếp tục» sáng ngay ⇒ chạm đúp từ «Kiểm tra» là lướt qua). Bản vẽ docs/ban-ve-vi-sao-sai-1211.
  const doan = !laLamLai && !!bb && doanHieuNham(bb.sai)
  const o = useRef<HTMLDivElement>(null), thoi = useRef(() => {})
  useLayoutEffect(() => { if (laLamLai) return; const het = choCauSai(qid); thoi.current = het; return het }, [qid, laLamLai])
  // CHỐT AN TOÀN (không bao giờ kẹt câu): dải TRƯỢT XONG mà hàng ô lý do không đủ to để chạm (bố cục khổ lạ ẩn / ép nó) ⇒ thôi chờ. Đo sau khi chuyển động
  // của dải kết thúc (dự phòng 800 ms) — 12/11: đo ngay khung đầu (dải còn đang trượt) từng tưởng ô quá nhỏ ⇒ bỏ chờ ⇒ «thoát nhanh».
  useEffect(() => {
    if (laLamLai) return
    const dai = o.current?.closest('.duo-ket')
    let xong = false
    const do_ = () => {
      if (xong) return
      xong = true
      const r = o.current?.getBoundingClientRect(), d = dai?.getBoundingClientRect()
      if (d && d.width > 0 && (!r || r.width < 120 || r.height < 36)) thoi.current()
    }
    const h = window.setTimeout(do_, 800)
    dai?.addEventListener('transitionend', do_, { once: true })
    dai?.addEventListener('animationend', do_, { once: true })
    return () => { window.clearTimeout(h); dai?.removeEventListener('transitionend', do_); dai?.removeEventListener('animationend', do_) }
  }, [qid, laLamLai])
  return <>
    <p><b>{dap}</b></p>
    {bb ? <div className="bac-bo">
      <p><b>Em chọn:</b> <ChemText text={bb.chon} /></p>
      <p><b>Chỗ chưa đúng:</b> <ChemText text={bb.sai} /></p>
      {bb.dung && <p><b>Đúng là:</b> <ChemText text={bb.dung} /></p>}
    </div> : giai && <p className="duo-mo"><ChemText text={giai} /></p>}
    {!laLamLai && <div ref={o} className="ly-do" role="group" aria-labelledby={`ly-${qid}`}>
      <div className="ly-dau"><h3 id={`ly-${qid}`}>Vì sao em sai?</h3><span className="ly-trang" data-xong={ly ? '' : undefined}>{ly ? '✓ Đã ghi' : 'Chọn 1 ý'}</span></div>
      {doan && <p className="ly-goi-y">A.I Đỗ Đại Học đoán em mắc bẫy của phương án {em}.</p>}
      <div className="o-ly">{LY_DO_SAI.map(([ma, ten]) => <button key={ma} type="button" aria-label={ten} aria-pressed={ly === ma} onClick={() => chonLyDoSai(qid, ma)}>
        <span className="tron" aria-hidden="true" /><span className="chu"><b>{ten}</b><small>{GOI_Y_LY_DO[ma]}</small></span>
        {doan && ma === 'nham' && <span className="ai" aria-hidden="true">A.I đoán</span>}</button>)}</div>
    </div>}
    <p className="duo-mo">{laLamLai ? 'Câu gốc vẫn trong nhóm sửa.' : tenDang ? <>Câu này vào nhóm sửa «<ChemText text={tenDang} />».</> : 'Câu này vào nhóm sửa của bài.'}</p>
  </>
}
