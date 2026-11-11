// THẺ «NỢ CÂU» trên màn Hôm nay (thầy 11/11: «hiện thẻ làm bù … cộng dồn … trả tối thiểu giống ngân hàng … tối đa 3 ngày, ngày thứ tư phải trả hết»;
// «Ghi rõ nợ câu»; «Tính lãi như ngân hàng luôn»). Bản vẽ thầy duyệt: docs/ban-ve-lam-bu-1111. Mảnh LƯỜI — em không nợ thì không tải (0 byte đường mở).
// Luật ở máy chủ (server/src/no-cau.ts); thẻ chỉ hiện số và gửi lựa chọn `hoc-tap-no-cau-chon`.
import { useState } from 'react'
import { goiHoa2 } from '../hoa2/api'
import type { KieuTraNo, NoCau } from '../../lib/no-cau-doc'
/** Lãi một đêm trên số câu còn nợ (làm tròn lên). Ở mảnh lười để lõi mở app không gánh. */
export const laiDem = (con: number, phanTram: number): number => (con > 0 ? Math.ceil(con * phanTram / 100) : 0)
import '../../styles/no-cau.css'

const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null)
/** Đọc CHẶT tóm tắt `goi7.noCau`; lệch kiểu ⇒ null ⇒ không vẽ thẻ. Nằm ở mảnh lười (lõi mở app chỉ dùng `ncTho`). */
export function docNoCau(x: unknown): NoCau | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>, l = (r.theoLoai ?? {}) as Record<string, unknown>
  const no = so(r.no), toiThieu = so(r.toiThieu), lan = so(r.lan), chon = so(r.so), lai = so(r.lai)
  if (!no || toiThieu === null || lan === null || chon === null || lai === null || chon > no || toiThieu > no || (r.kieu !== 'toi_thieu' && r.kieu !== 'het')) return null
  return { no, theoLoai: { moi: so(l.moi) ?? 0, sua: so(l.sua) ?? 0, on: so(l.on) ?? 0, lai: so(l.lai) ?? 0 }, toiThieu, lan, phaiTraHet: r.phaiTraHet === true, kieu: r.kieu, so: chon, lai }
}
const NHAN_LOAI: readonly (readonly [keyof NoCau['theoLoai'], string])[] = [['moi', 'Câu mới'], ['sua', 'Câu sửa'], ['on', 'Câu ôn'], ['lai', 'Lãi']]

/** `daTra` / `con` = số sống theo «đã làm hôm nay»; `gon` = đã trả đủ số đã chọn (thẻ gọn dưới nút chính); `duMuc` = đã đủ mức hôm nay. */
export default function TheNoCau(p: { nc: unknown; daTra: number; con: number; gon: boolean; duMuc: boolean; token?: string; onDoi?: () => void }) {
  const n = docNoCau(p.nc)
  return n && <TheNoCauTrong {...p} nc={n} />
}
function TheNoCauTrong({ nc, daTra, con, gon, duMuc, token, onDoi }: { nc: NoCau; daTra: number; con: number; gon: boolean; duMuc: boolean; token?: string; onDoi?: () => void }) {
  const [dang, setDang] = useState<KieuTraNo | null>(null), [loi, setLoi] = useState('')
  const kieu = dang ?? nc.kieu
  const chon = (k: KieuTraNo) => {
    if (dang || k === nc.kieu || !token) return
    setDang(k); setLoi('')
    goiHoa2('hoc-tap-no-cau-chon', token, { kieu: k }).then(() => onDoi?.(), (e: unknown) => setLoi(e instanceof Error && e.message ? e.message : 'Chưa đổi được. Em thử lại nhé.')).finally(() => setDang(null))
  }
  if (gon) return <section className="nc-the" data-muc="gon" aria-label="Nợ câu">
    <div className="nc-gon-chu"><b>Còn nợ {con} câu</b>
      <span>Hôm nay đã trả {daTra} câu · đêm nay cộng {laiDem(con, nc.lai)} câu lãi{duMuc ? ' · học thêm câu nào, nợ giảm câu ấy' : ''}</span>
      {loi && <span role="alert">{loi}</span>}</div>
    {!duMuc && nc.kieu !== 'het' && <button type="button" className="nc-them" onClick={() => chon('het')} disabled={!!dang}>Trả hết</button>}
  </section>
  const het = nc.phaiTraHet, motNut = het || nc.toiThieu >= nc.no
  const loai = NHAN_LOAI.filter(([k]) => (nc.theoLoai[k] ?? 0) > 0).map(([k, ten]) => `${ten} ${nc.theoLoai[k]}`).join(' · ')
  const nut = (k: KieuTraNo, ten: string, so: number) => <button type="button" className="nc-nut" aria-pressed={kieu === k || motNut} onClick={() => chon(k)} disabled={!!dang}><b>{ten}</b><span>{so} câu</span></button>
  return <section className="nc-the" data-muc={het ? 'het' : undefined} aria-label="Nợ câu">
    <div className="nc-dau"><span className="nc-nhan">Nợ câu</span><span className="nc-chip">{het ? 'Hết 3 lần trả tối thiểu' : `Trả tối thiểu: lần ${Math.min(3, nc.lan + 1)}/3`}</span></div>
    <div className="nc-so">{con}<small>câu đang nợ</small></div>
    <p className="nc-loai">{daTra > 0 ? `Hôm nay đã trả ${daTra}/${nc.so} câu` : loai}</p>
    <div className="nc-chon" role="group" aria-label="Chọn cách trả" data-mot={motNut || undefined}>{!motNut && nut('toi_thieu', 'Trả tối thiểu', nc.toiThieu)}{nut('het', 'Trả hết', nc.no)}</div>
    <p className="nc-ghi">{het ? `Em đã trả tối thiểu 3 lần. Hôm nay trả hết nợ câu rồi mới làm bài mới. Còn nợ thì mỗi đêm cộng ${nc.lai} % lãi.`
      : kieu === 'het' ? 'Trả hết thì không bị tính lãi, số lần trả tối thiểu tính lại từ đầu.'
      : `Tối thiểu = 25 % số nợ, ít nhất 6 câu. Phần còn nợ tính lãi ${nc.lai} % mỗi đêm: đêm nay cộng ${laiDem(nc.no - nc.toiThieu, nc.lai)} câu.`}</p>
    {loi && <p className="nc-ghi" role="alert">{loi}</p>}
  </section>
}
