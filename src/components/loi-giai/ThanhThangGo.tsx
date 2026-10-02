// THANH THANG TỰ GỠ (Vòng học khép kín v2, GĐ2) — nằm dưới hộp lời giải từng bước (chỉ màn học sinh, chỉ câu có học liệu `kiem`).
// Hiện em đang ở bậc nào trong 5 bậc tự gỡ + MỘT việc còn thiếu (máy chủ tính: server/src/thang-tu-go.ts), nút "Luyện kiến thức nền"
// khi câu kiểm hỏng ở bước có nhãn nền, nút "Gửi thầy" chỉ bật khi qua cổng nỗ lực (chọn bước vướng + viết em hiểu đến đâu).
import { useEffect, useId, useRef, useState } from 'react'
import { guiThay, luyenNen, nopLuyenNen, thangGo, type CauNen, type KetQuaNopNen, type KiemKhung, type SuKienKhung, type ThangGo } from '../../lib/loi-giai-api'
import './loi-giai.css'

export const TEN_BAC: Record<number, string> = { 1: 'Nhìn lại lựa chọn', 2: 'Đọc lời giải từng bước', 3: 'Làm lại câu tương tự', 4: 'Luyện kiến thức nền', 5: 'Gửi thầy' }
const CHU_TOI_THIEU = 10
const demChu = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const ngan = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** Câu chỉ việc hiện trên thanh: việc đầu tiên còn thiếu; [4] em làm ngay trong ô gửi nên chỉ nhắc khi các điều kiện khác đã đạt. */
export function viecConThieu(tg: ThangGo): string {
  const thieu = tg.cong.filter((c) => !c.dat && c.viec)
  const truoc = thieu.find((c) => c.ma !== 'chi_buoc')
  if (truoc) return truoc.viec
  if (tg.coTheGui) return 'Em đã tự gỡ đủ các bậc. Chọn bước em còn vướng rồi gửi thầy.'
  return thieu[0]?.viec ?? ''
}

function HopLuyenNen({ nhan, ten, qid, onDong }: { nhan: string; ten: string; qid: string; onDong: () => void }) {
  const id = useId()
  const [ds, setDs] = useState<CauNen[] | null>(null)
  const [loi, setLoi] = useState('')
  const [i, setI] = useState(0)
  const [traLoi, setTraLoi] = useState('')
  const [kq, setKq] = useState<KetQuaNopNen | null>(null)
  const [dangNop, setDangNop] = useState(false)
  const [soDung, setSoDung] = useState(0)
  const nutDong = useRef<HTMLButtonElement>(null)
  const tai = () => {
    setLoi(''); setDs(null)
    void luyenNen(nhan).then((r) => { if (r.ok) setDs(r.cau); else { setLoi(r.loi); setDs([]) } })
  }
  useEffect(tai, [nhan]) // eslint-disable-line react-hooks/exhaustive-deps
  const dong = useRef(onDong)
  dong.current = onDong
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    // Esc chỉ đóng hộp luyện (bắt ở pha bắt sớm, không để hộp lời giải đóng theo).
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); dong.current() } }
    window.addEventListener('keydown', phim, true)
    return () => { window.removeEventListener('keydown', phim, true); truoc?.focus?.() }
  }, [])
  const c = ds?.[i]
  const nop = async (v: string) => {
    if (!c || !v.trim() || dangNop) return
    setDangNop(true)
    const r = await nopLuyenNen(c.id, v.trim(), qid)
    setDangNop(false)
    setKq(r)
    if (r.ok && r.dung) setSoDung((x) => x + 1)
  }
  const tiep = () => { setI((x) => x + 1); setTraLoi(''); setKq(null) }
  return (
    <div className="lg-hop-nen" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
      <div className="lg-hop-nen-than">
        <div className="lg-thanh">
          <h3 id={`${id}-t`} className="lg-tieu-de">Luyện kiến thức nền · {ten}</h3>
          <button ref={nutDong} type="button" className="lg-nut" onClick={onDong}>Đóng</button>
        </div>
        <div className="lg-cuon lg-van">
          {ds === null ? <p role="status">Đang lấy câu luyện…</p>
            : loi ? <p className="lg-loi" role="status">{loi} <button type="button" className="lg-nut" onClick={tai}>Thử lại</button></p>
              : ds.length === 0 ? <p>Thầy Đỗ Đại Học chưa soạn câu luyện cho phần này. Em quay lại đọc lời giải từng bước nhé.</p>
                : !c ? (
                  <div className="lg-nen-xong" role="status">
                    <p><b>Em làm xong {ds.length} câu luyện</b> · đúng {soDung}/{ds.length} câu.</p>
                    <p>Giờ em quay lại câu gốc, thử câu tương tự trong kế hoạch hôm nay.</p>
                    <button type="button" className="lg-nut lg-nut--chinh" onClick={onDong}>Về lời giải</button>
                  </div>
                ) : (
                  <div className="lg-nen-cau">
                    <p className="lg-nen-so">Câu {i + 1}/{ds.length}</p>
                    <p>{c.de}</p>
                    {c.kieu === 'tn' && c.pa ? (
                      <div className="lg-nen-pa" role="group" aria-label="Chọn đáp án">
                        {Object.entries(c.pa).map(([k, t]) => (
                          <button key={k} type="button" className="lg-loc-nut" aria-pressed={traLoi === k} disabled={!!kq || dangNop}
                            onClick={() => { setTraLoi(k); void nop(k) }}><b>{k}.</b> {t}</button>
                        ))}
                      </div>
                    ) : (
                      <form className="lg-tim-hang" onSubmit={(e) => { e.preventDefault(); void nop(traLoi) }}>
                        <label className="lg-an" htmlFor={`${id}-o`}>Câu trả lời của em</label>
                        <input id={`${id}-o`} className="lg-o" inputMode="decimal" autoComplete="off" value={traLoi} disabled={!!kq || dangNop}
                          placeholder="Nhập con số, ví dụ 0,25" onChange={(e) => setTraLoi(e.target.value)} />
                        <button type="submit" className="lg-nut lg-nut--chinh" disabled={!!kq || dangNop || !traLoi.trim()}>{dangNop ? 'Đang chấm…' : 'Nộp câu này'}</button>
                      </form>
                    )}
                    {kq && !kq.ok && <p className="lg-loi" role="status">{kq.loi}</p>}
                    {kq && kq.ok && (
                      <div className={kq.dung ? 'lg-kq lg-kq--dung' : 'lg-kq lg-kq--sai'} role="status">
                        <p><b>{kq.dung ? 'Đúng rồi.' : 'Chưa đúng.'}</b> Đáp án: {kq.dapAn}</p>
                        {kq.giai.length > 0 && <ol className="lg-chu-buoc">{kq.giai.map((g, j) => <li key={j}>{g}</li>)}</ol>}
                        {kq.meo && <p><b>Mẹo:</b> {kq.meo}</p>}
                        <button type="button" className="lg-nut lg-nut--chinh" onClick={tiep}>{i + 1 < ds.length ? 'Câu tiếp' : 'Xem kết quả'}</button>
                      </div>
                    )}
                  </div>
                )}
        </div>
      </div>
    </div>
  )
}

export default function ThanhThangGo({ qid, kiem, lanTai, layDang }: { qid: string; kiem: KiemKhung; lanTai: number; layDang: () => { giay: number; suKien: SuKienKhung[] } }) {
  const id = useId()
  const [tg, setTg] = useState<ThangGo | null | undefined>(undefined)
  const [taiLai, setTaiLai] = useState(0)
  const [moNen, setMoNen] = useState(false)
  const [moGui, setMoGui] = useState(false)
  const [buoc, setBuoc] = useState(0)
  const [viet, setViet] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [bao, setBao] = useState('')
  const dang = useRef(layDang)
  dang.current = layDang
  useEffect(() => {
    let huy = false
    void thangGo(qid, dang.current()).then((r) => { if (!huy) setTg(r) })
    return () => { huy = true }
  }, [qid, lanTai, taiLai])
  useEffect(() => { if (tg?.buocVuong !== undefined) setBuoc(tg.buocVuong) }, [tg?.buocVuong])
  const dongNen = () => { setMoNen(false); setTaiLai((x) => x + 1) }

  if (tg === undefined) return <div className="lg-thang" role="status"><span className="lg-thang-viec">Đang xem em ở bậc nào của thang tự gỡ…</span></div>
  if (tg === null) {
    return (
      <div className="lg-thang" role="status">
        <span className="lg-thang-viec">Chưa tải được thang tự gỡ của câu này.</span>
        <button type="button" className="lg-nut" onClick={() => { setTg(undefined); setTaiLai((x) => x + 1) }}>Thử lại</button>
      </div>
    )
  }
  const soChu = demChu(viet)
  const duChu = soChu >= CHU_TOI_THIEU || (tg.buocVuong !== undefined && buoc === tg.buocVuong)
  const gui = async () => {
    if (!duChu || dangGui) return
    setDangGui(true); setBao('')
    const r = await guiThay(qid, buoc, viet)
    setDangGui(false)
    if (r.ok) { setMoGui(false); setViet(''); setBao(`Đã gửi thầy bước ${buoc + 1}. Thầy gỡ xong, lời gỡ hiện ngay dưới bước này.`) } else setBao(r.loi)
    setTaiLai((x) => x + 1)
  }
  return (
    <div className="lg-thang" role="region" aria-labelledby={`${id}-t`}>
      <div className="lg-thang-dau">
        <span id={`${id}-t`} className="lg-thang-bac">Thang tự gỡ · bậc {tg.bac}/5: {TEN_BAC[tg.bac]}</span>
        <span className="lg-thang-viec">{bao || viecConThieu(tg)}</span>
      </div>
      <div className="lg-hang-nut">
        {tg.nhanNenVuong && <button type="button" className="lg-nut" onClick={() => setMoNen(true)}>Luyện kiến thức nền</button>}
        <button type="button" className="lg-nut lg-nut--chinh" disabled={!tg.coTheGui} aria-expanded={moGui} onClick={() => setMoGui((x) => !x)}>Gửi thầy</button>
      </div>
      {moGui && tg.coTheGui && (
        <form className="lg-gui" onSubmit={(e) => { e.preventDefault(); void gui() }}>
          <label htmlFor={`${id}-b`}>Bước em chưa hiểu</label>
          <select id={`${id}-b`} className="lg-o" value={buoc} onChange={(e) => setBuoc(Number(e.target.value))}>
            {kiem.buoc.map((t, i) => <option key={i} value={i}>Bước {i + 1}: {ngan(t)}</option>)}
          </select>
          <label htmlFor={`${id}-v`}>Em hiểu đến đâu, vướng ở chỗ nào? (ít nhất {CHU_TOI_THIEU} chữ)</label>
          <textarea id={`${id}-v`} className="lg-o" rows={3} value={viet} maxLength={1000} onChange={(e) => setViet(e.target.value)} />
          <span className="lg-dem-chu" aria-live="polite">{soChu}/{CHU_TOI_THIEU} chữ</span>
          <button type="submit" className="lg-nut lg-nut--chinh" disabled={!duChu || dangGui}>{dangGui ? 'Đang gửi…' : 'Gửi thầy bước này'}</button>
        </form>
      )}
      {moNen && tg.nhanNenVuong && <HopLuyenNen nhan={tg.nhanNenVuong} ten={tg.tenNenVuong ?? ''} qid={qid} onDong={dongNen} />}
    </div>
  )
}
