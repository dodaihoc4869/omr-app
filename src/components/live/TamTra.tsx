// CHỌN ĐÁP ÁN NGAY TRÊN BẢNG — máy em, live theo khối (thầy 12/11, bản vẽ docs/ban-ve-live-moi-1211/15–18-*.jpg đã duyệt):
// «học sinh không cần chuyển màn khi chuyển câu nữa … giữ nguyên màn chiếu, khi thầy chuyển câu thì hiện nút chọn đáp án ở phần bảng đen, chọn xong gửi thì
// tự ẩn hoặc thầy bấm lên bảng thì tự ẩn dù chưa gửi. Đề bài ở bên cạnh màn chiếu có đủ ý rồi.»
//  · Tấm neo ĐÁY khung bảng, cao theo nội dung ⇒ phần trên của bảng vẫn thấy nét thầy viết. Chỉ có CHỮ CÁI + nút (đề đủ ý nằm ở giấy bên trái).
//  · Trắc nghiệm: A B C D · Đúng–sai: bốn hàng a–d, mỗi hàng Đúng | Sai · Trả lời ngắn: ô số + phím số · Tự luận: «Em làm xong».
//  · Lựa chọn vẫn là trạng thái của màn Bình Phản Ứng (`chon`, `dat`, `phim`, `onGui` truyền xuống) ⇒ luật gửi / khoá / chấm giữ nguyên.
// + CON DẤU «ĐẠT» / «KHÔNG ĐẠT» giữa bảng trong 3 giây khi thầy chấm em lên bảng (thầy 12/11 «dạng đóng dấu hiệu ứng 3 giây cho tất cả máy học sinh»).
// AN TOÀN ĐÁP ÁN: không nhận đáp án / lời giải — chỉ số ý, số phương án và lựa chọn của chính em.
import { useEffect, useState, type SyntheticEvent } from 'react'

export interface DuLieuTra {
  /** Lựa chọn hiện tại của em: trắc nghiệm «B» · đúng–sai 4 kí tự D / S / trống · trả lời ngắn chuỗi số. */
  chon: string
  dat: (f: string | ((c: string) => string)) => void
  /** Bấm một phím số (màn Bình Phản Ứng lo luật: dấu âm, tối đa 8 kí tự). */
  phim: (p: string) => void
}
const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '−']
const dung = (e: SyntheticEvent): void => { e.stopPropagation() } // khung bảng có cử chỉ kéo / phóng — tấm này không cho lọt xuống

export function TamTra({ so, phan, tuLuan, soPa = 4, tra, onGui }: { so: number; phan: string; tuLuan: boolean; soPa?: number; tra: DuLieuTra; onGui?: () => void }) {
  const { chon, dat, phim } = tra
  const ds = chon.padEnd(4, ' ')
  const daChon = phan === 'II' ? [...ds.slice(0, 4)].filter((c) => c === 'D' || c === 'S').length : 0
  return (
    <div className="lv-tra" role="group" aria-label={`Trả lời câu ${so}`} onPointerDown={dung} onPointerMove={dung} onPointerUp={dung} onWheel={dung} onClick={dung} onDoubleClick={dung}>
      <div className="lv-tra-dau">
        <span>Câu {so} · {tuLuan ? 'em làm ra giấy' : phan === 'I' ? 'chọn một đáp án' : phan === 'II' ? 'chọn Đúng / Sai cho từng ý' : 'nhập đáp số'}</span>
        {phan === 'II' && !tuLuan ? <em>{daChon}/4 ý</em> : null}
      </div>
      {tuLuan ? <p className="lv-tra-ghi">Câu này thầy chữa trên bảng, máy không chấm. Làm xong em bấm nút bên dưới.</p>
        : phan === 'I' ? (
          <div className="lv-tra-tn" style={{ gridTemplateColumns: `repeat(${Math.max(2, Math.min(4, soPa))}, 1fr)` }}>
            {['A', 'B', 'C', 'D'].slice(0, Math.max(2, Math.min(4, soPa))).map((c) => <button key={c} type="button" className="lv-tra-nut" aria-pressed={chon === c} onClick={() => dat(c)}>{c}</button>)}
          </div>
        ) : phan === 'II' ? (
          <div className="lv-tra-ds">
            {['a', 'b', 'c', 'd'].map((c, i) => (
              <div key={c} className="lv-tra-hang" role="group" aria-label={`Ý ${c}`}>
                <b aria-hidden="true">{c}</b>
                {(['D', 'S'] as const).map((v) => (
                  <button key={v} type="button" className="lv-tra-nut" data-v={v} aria-pressed={ds[i] === v} onClick={() => dat((cu) => { const a = cu.padEnd(4, ' ').split(''); a[i] = v; return a.join('') })}>{v === 'D' ? 'Đúng' : 'Sai'}</button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="lv-tra-so"><output aria-live="polite" aria-label="Đáp số của em">{chon.replace('-', '−').replace('.', ',')}<i aria-hidden="true" /></output><button type="button" className="lv-tra-nut" onClick={() => dat((c) => c.slice(0, -1))}>Xoá</button></div>
            <div className="lv-tra-phim">{PHIM.map((p) => <button key={p} type="button" className="lv-tra-nut" aria-label={p === '−' ? 'Đổi dấu' : p === ',' ? 'Dấu phẩy' : p} onClick={() => phim(p)}>{p}</button>)}</div>
          </>
        )}
      <button type="button" className="lv-tra-gui" disabled={!onGui} onClick={onGui}>
        {tuLuan ? 'Em làm xong' : !onGui ? (phan === 'II' ? 'Chọn đủ 4 ý rồi gửi' : phan === 'I' ? 'Chọn đáp án rồi gửi' : 'Nhập đáp số rồi gửi') : phan === 'I' ? `Gửi đáp án ${chon}` : phan === 'II' ? 'Gửi đáp án' : 'Gửi đáp số'}
      </button>
    </div>
  )
}

/** Con dấu «ĐẠT» / «KHÔNG ĐẠT» giữa bảng, 3 giây, mỗi lần thầy chấm (`khoa` = lượt + em được gọi; `dat` đổi từ chưa chấm sang đã chấm). Vào muộn khi đã chấm ⇒ không đóng lại. */
export function DauDat({ khoa, dat }: { khoa: string; dat: boolean | null | undefined }) {
  const [hien, setHien] = useState<{ k: string; dat: boolean } | null>(null)
  const [cu, setCu] = useState<{ k: string; dat: boolean | null }>({ k: khoa, dat: dat ?? null })
  const nay = dat ?? null
  if (cu.k !== khoa || cu.dat !== nay) {
    setCu({ k: khoa, dat: nay })
    if (nay !== null && khoa && (cu.k !== khoa ? false : cu.dat === null)) setHien({ k: `${khoa}:${nay ? 1 : 0}`, dat: nay })
    else if (nay === null) setHien(null)
  }
  useEffect(() => { if (!hien) return; const h = setTimeout(() => setHien(null), 3000); return () => clearTimeout(h) }, [hien])
  return hien ? <div key={hien.k} className="lv-dau-dat" data-dat={hien.dat ? '' : undefined} role="status">{hien.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'}</div> : null
}
