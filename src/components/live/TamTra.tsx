// CHỌN ĐÁP ÁN NGAY TRÊN ĐỀ — máy em, live theo khối. Thầy 12/11 (bản vẽ docs/ban-ve-live-moi-1211/23–27 đã duyệt «ok chốt build»): «phần chọn đáp án cho hiện
// nút luôn lên đề để hs chọn cho tiện, bỏ đáp án ở bên bảng đen để hs kéo được đề to nhất có thể». (Bản trước 15–18: tấm nằm trong khung bảng đen.)
//  · DẢI NGANG neo đáy khung GIẤY ĐỀ (KhungDocLap `duoiGiay`), tự xuống hàng theo bề ngang giấy; đề đọc / cuộn ở phía trên dải. Bảng đen để trống cho thầy viết.
//  · Trắc nghiệm: A B C D · Đúng–sai: bốn nhóm a–d, mỗi nhóm Đúng | Sai · Trả lời ngắn: ô số + phím số · Tự luận: «Em làm xong».
//  · Lựa chọn vẫn là trạng thái của màn Bình Phản Ứng (`chon`, `dat`, `phim`, `onGui` truyền xuống) ⇒ luật gửi / khoá / chấm giữ nguyên.
// + CON DẤU «ĐẠT» / «KHÔNG ĐẠT» đóng giữa CẢ MÀN — đè cả sang phần đề — trong 3 giây khi thầy chấm em lên bảng («chữ không đạt và đạt cho triện đè luôn cả sang
//   phần đề»), kèm tên em lên bảng.
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
const dung = (e: SyntheticEvent): void => { e.stopPropagation() } // khung giấy có cử chỉ cuộn / chạm hai lần phóng — dải này không cho lọt xuống

export function TamTra({ so, phan, tuLuan, soPa = 4, tra, onGui, dem }: { so: number; phan: string; tuLuan: boolean; soPa?: number; tra: DuLieuTra; onGui?: () => void; /** «3/8» — số bạn đã gửi / số bạn có mặt. */ dem?: string }) {
  const { chon, dat, phim } = tra
  const ds = chon.padEnd(4, ' ')
  const daChon = phan === 'II' ? [...ds.slice(0, 4)].filter((c) => c === 'D' || c === 'S').length : 0
  return (
    <div className="lv-tra" role="group" aria-label={`Trả lời câu ${so}`} onPointerDown={dung} onPointerMove={dung} onPointerUp={dung} onWheel={dung} onClick={dung} onDoubleClick={dung}>
      <div className="lv-tra-dau">
        <span>Câu {so} · {tuLuan ? 'em làm ra giấy' : phan === 'I' ? 'chọn một đáp án' : phan === 'II' ? 'chọn Đúng / Sai cho từng ý' : 'nhập đáp số'}</span>
        {phan === 'II' && !tuLuan ? <em>{daChon}/4 ý</em> : null}
        {dem ? <small>{dem} bạn đã gửi</small> : null}
      </div>
      {tuLuan ? <p className="lv-tra-ghi">Câu này thầy chữa trên bảng, máy không chấm. Làm xong em bấm nút bên dưới.</p>
        : phan === 'I' ? (
          <div className="lv-tra-tn">
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
        {tuLuan ? 'Em làm xong' : !onGui ? (phan === 'II' ? 'Chọn đủ 4 ý' : phan === 'I' ? 'Chọn đáp án' : 'Nhập đáp số') : phan === 'I' ? `Gửi đáp án ${chon}` : phan === 'II' ? 'Gửi đáp án' : 'Gửi đáp số'}
      </button>
    </div>
  )
}

/** Con dấu «ĐẠT» / «KHÔNG ĐẠT» giữa CẢ MÀN (đè cả sang đề), 3 giây, mỗi lần thầy chấm (`khoa` = lượt + em được gọi; `dat` đổi từ chưa chấm sang đã chấm). Vào muộn khi đã chấm ⇒ không đóng lại. */
export function DauDat({ khoa, dat, ten }: { khoa: string; dat: boolean | null | undefined; /** Tên em lên bảng (dòng nhỏ dưới con dấu). */ ten?: string }) {
  const [hien, setHien] = useState<{ k: string; dat: boolean } | null>(null)
  const [cu, setCu] = useState<{ k: string; dat: boolean | null }>({ k: khoa, dat: dat ?? null })
  const nay = dat ?? null
  if (cu.k !== khoa || cu.dat !== nay) {
    setCu({ k: khoa, dat: nay })
    if (nay !== null && khoa && (cu.k !== khoa ? false : cu.dat === null)) setHien({ k: `${khoa}:${nay ? 1 : 0}`, dat: nay })
    else if (nay === null) setHien(null)
  }
  useEffect(() => { if (!hien) return; const h = setTimeout(() => setHien(null), 3000); return () => clearTimeout(h) }, [hien])
  return hien ? <div key={hien.k} className="lv-dau-dat" data-dat={hien.dat ? '' : undefined} role="status">{hien.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'}{ten ? <small>{ten} · lên bảng</small> : null}</div> : null
}
