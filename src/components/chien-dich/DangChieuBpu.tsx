// BƯỚC «ĐANG CHIẾU» CỦA HÀNH TRÌNH (bản vẽ docs/ban-ve-buoc-day-0711 màn 4, thầy duyệt 07/11 «duyệt, build luôn»).
// Máy thầy nào cũng điều khiển được (máy nối máy chiếu, điện thoại, máy tính bảng): nối phòng Bình Phản Ứng của buổi bằng vé thầy (`/gv/bpu/mo`),
// xem lượt đang chạy (câu, giờ, số em đã gửi / chưa biết làm), bấm «Câu tiếp» / «Câu trước» / «Lời giải» ⇒ phòng chuyển lệnh tới bảng đang nối
// tờ chiếu (BangBinhPhanUng ⇒ tờ đổi đợt ⇒ câu mới tự gửi). Không có bảng nào đang chiếu ⇒ nói rõ cách bắt đầu, không nút chết.
// Mảnh nạp lười (chỉ khi mở bước 4). Tế nhị trước lớp: chỉ con số, không tên em.
import { useEffect, useRef, useState } from 'react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import type { ViewBang } from '../../lib/bpu/phong'

const gio = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const PHA: Record<string, string> = { 'tra-loi': 'Cả lớp đang làm', goi: 'Đang mời em lên bảng', 'lam-bang': 'Em đang làm trên bảng', mo: 'Đã mở đáp án' }

export default function DangChieuBpu({ buoiId, onVe }: { buoiId: string; onVe: () => void }) {
  const [v, setV] = useState<ViewBang | null>(null)
  const [loi, setLoi] = useState('')
  const [nay, setNay] = useState(() => Date.now())
  const [khoa, setKhoa] = useState(false)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    let dung = false, hen: ReturnType<typeof setTimeout> | undefined, lan = 0
    async function noi() {
      const r = await goiLenh('/gv/bpu/mo', { buoiId }, 'Máy chủ chưa có Bình Phản Ứng.')
      if (dung) return
      if (!r.ok || r.du.ok === false) { setLoi(!r.ok ? r.chu : String(r.du.error ?? 'Chưa nối được phòng của buổi.')); hen = setTimeout(() => void noi(), 10_000); return }
      setLoi('')
      const goc = (await layDiaChiMayChu('')) || 'https://omr.ttadodaihoc.workers.dev'
      const w = new WebSocket(`${goc.replace(/^http/, 'ws')}/bpu/phong?ve=${encodeURIComponent(String(r.du.ve))}`)
      ws.current = w
      w.onopen = () => { lan = 0; w.send('{"t":"chao"}') }
      w.onmessage = (e) => { if (typeof e.data !== 'string') return; try { const m = JSON.parse(e.data) as { t?: string }; if (m.t === 'bang') setV(m as unknown as ViewBang) } catch { /* bỏ qua */ } }
      w.onclose = () => { if (ws.current !== w || dung) return; ws.current = null; hen = setTimeout(() => void noi(), [1500, 3000, 6000, 12000][Math.min(lan++, 3)]) }
      w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
    }
    void noi()
    return () => { dung = true; clearTimeout(hen); try { ws.current?.close() } catch { /* đã đóng */ } ws.current = null }
  }, [buoiId])

  const l = v?.luot ?? null
  useEffect(() => { if (!l?.han || l.pha !== 'tra-loi') return; const h = setInterval(() => setNay(Date.now()), 500); return () => clearInterval(h) }, [l?.han, l?.pha])

  /** Gửi lệnh tới bảng; khoá 1 giây (bấm liên tục không nhảy nhiều câu). */
  const lenh = (x: 'toi' | 'lui' | 'giai') => {
    if (khoa) return
    const w = ws.current
    if (!w || w.readyState !== 1) { setLoi('Mất kết nối · đang thử lại'); return }
    try { w.send(JSON.stringify({ t: 'dk', lenh: x })) } catch { /* rớt */ }
    setKhoa(true); setTimeout(() => setKhoa(false), 1000)
  }

  const coMat = (v?.ds ?? []).filter((e) => e.vao).length
  const daGui = l?.daGui.length ?? 0
  const chuaBiet = l?.chuaBiet?.length ?? 0
  const loai = !l ? '' : l.tuLuan ? 'Tự luận' : l.phan === 'I' ? 'Trắc nghiệm' : l.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'
  const conMs = l?.han && l.pha === 'tra-loi' ? l.han - nay : null
  const tong = l?.han ? l.han - l.batDau : 0

  return (
    <section className="gvv2-dc" aria-labelledby="dc-tieu-de" data-khoi="dang-chieu">
      <div className="gvv2-dc-dau">
        <span className={`gvv2-dc-cham${l && l.pha !== 'mo' ? ' song' : ''}`} aria-hidden="true" />
        <h2 id="dc-tieu-de">{l ? 'Đang chiếu' : 'Chưa chiếu câu nào'}</h2>
        <span className="gvv2-dc-dong-bo" data-loi={loi ? true : undefined} role="status">{loi || 'Đồng bộ mọi máy'}</span>
      </div>
      {l ? (
        <div className="gvv2-dc-than">
          <div className="gvv2-dc-vong" style={{ ['--p' as string]: conMs != null && tong > 0 ? String(Math.max(0, Math.min(1, conMs / tong))) : '1' }} aria-label={conMs != null ? `Còn ${gio(conMs)}` : PHA[l.pha]}>
            <b>{conMs != null ? gio(conMs) : l.pha === 'mo' ? '✓' : '—'}</b>
            <span>{conMs != null ? 'còn lại' : PHA[l.pha]}</span>
          </div>
          <div className="gvv2-dc-chu">
            <span className="gvv2-dc-nhan">Lượt {l.so} · {loai}</span>
            <b className="gvv2-dc-pha">{PHA[l.pha] ?? ''}</b>
            <span className="gvv2-so">{daGui}/{coMat} em {l.tuLuan ? 'làm xong' : 'đã gửi'}{chuaBiet ? ` · ${chuaBiet} em chưa biết làm` : ''}</span>
            <span className="gvv2-dc-vach" aria-hidden="true"><i style={{ width: `${coMat ? (daGui / coMat) * 100 : 0}%` }} /></span>
          </div>
        </div>
      ) : (
        <p className="gvv2-dc-goi-y">Ở bước «Chọn câu & chiếu», bấm <b>Chiếu lên bảng</b>: câu đang chiếu tự gửi xuống máy {coMat || 'các'} em có mặt, giờ tự tính theo câu (tối đa 3 phút).</p>
      )}
      <div className="gvv2-dc-nut">
        <button type="button" className="m3-nut-chinh gvv2-dc-tiep" disabled={!l || khoa} onClick={() => lenh('toi')}>Câu tiếp →</button>
        <button type="button" className="gvv2-nut-vien" disabled={!l || khoa} onClick={() => lenh('lui')}>← Câu trước</button>
        <button type="button" className="gvv2-nut-vien" disabled={!l} onClick={() => lenh('giai')}>Lời giải</button>
        <button type="button" className="gvv2-nut-vien" onClick={onVe}>Về chọn hoạt động</button>
      </div>
    </section>
  )
}
