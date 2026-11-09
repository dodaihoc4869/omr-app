// BÌNH PHẢN ỨNG — PHẦN PHỤ CỦA BẢNG CHIẾU (tách khỏi BangBinhPhanUng.tsx 09/11 vì cổng cỡ tệp): chữ đề, hình đề, vùng em viết.
// Cùng mảnh nạp lười với bảng (chỉ máy thầy). Hàm ống nghiệm kết quả: ong-ket-qua.ts.
import type { Question } from '../../game/than-thu-v2/core'
import { DOI_BPU, kyHieu, type ViewBang } from '../../lib/bpu/phong'
import { mauDoi } from './ong-ket-qua'

type Em = ViewBang['ds'][number]

/** Chữ đề: hàm chữ của tờ chiếu khi đã nạp (HTML đã thoát kí tự), không thì `ChuHoa` tạm. `mot` = một dòng (phương án / ý). */
export function Chu({ t, f, mot }: { t: string; f: ((s: string) => string) | null; mot?: boolean }) {
  if (!f) return <ChuHoa t={t} />
  const html = f(String(t ?? ''))
  return mot ? <span dangerouslySetInnerHTML={{ __html: html }} /> : <div className="bb-dong-chu" dangerouslySetInnerHTML={{ __html: html }} />
}
/** Chữ Hoá trên bảng: số đứng sau kí hiệu nguyên tố / ngoặc ⇒ chỉ số dưới (C6H5NH2 ⇒ C₆H₅NH₂); giữ xuống dòng. Bảng KHÔNG nhập bộ hiện câu của chặng
 *  (nhập từ máy thầy làm bộ đóng gói chia lại mảnh dùng chung ⇒ app học sinh nặng thêm). */
function ChuHoa({ t }: { t: string }) {
  const dong = String(t ?? '').split(/\n+/)
  return <>{dong.map((d, i) => <p key={i} className="bb-dong-chu">{d.split(/([A-Z][a-z]?|\)|\])(\d+)/).reduce<React.ReactNode[]>((ra, p, k, arr) => { if (k % 3 === 0) ra.push(p); else if (k % 3 === 1) { ra.push(p); ra.push(<sub key={k}>{arr[k + 1]}</sub>) } return ra }, [])}</p>)}</>
}

/** VÙNG EM VIẾT (thầy 07/11 «chỉ tắt phần hs lên bảng làm thôi» · «vẫn hiện thẻ hs lên bảng ở góc trên chỗ màu đen, làm cho tinh tế, hiệu ứng tiếp sức
 *  vẫn hiện đầy đủ để hs thấy phấn khích»): nửa phải tối (máy chiếu gần như không rọi lên chỗ em viết) — góc trên một thẻ nhỏ: chấm đội · tên · đội ·
 *  SỐ TIẾP SỨC lớn (mỗi lượt tiếp sức: số nảy + thẻ bừng sáng); tia lửa từ ô các bạn bay vào thẻ (canvas trên cùng vẫn vẽ trên vùng tối). Chạm ⇒ bật lại. */
export function VungVietBang({ g, em, tenHien, onBat }: { g: NonNullable<NonNullable<ViewBang['luot']>['goi']>; em: Em; tenHien: (e: Em) => string; onBat: () => void }) {
  return (
    <div className="bb-den" role="status" aria-label="Vùng em viết tạm tắt chiếu. B hoặc chạm để bật lại" onClick={onBat} style={{ ['--doi' as string]: mauDoi(em.doi) }}>
      <div key={g.tiep} className={`bb-goc${g.tiep > 0 ? ' nay' : ''}`}>
        <div className="ng">{kyHieu(em.ten)}</div>
        <div className="chu"><span className="mat">Đang lên bảng</span><b>{tenHien(em)}</b><span className="doi">{DOI_BPU[em.doi]?.ten}</span></div>
        <div className="ts"><b>{g.tiep}</b><span>tiếp sức</span></div>
      </div>
    </div>
  )
}

/** HÌNH + BẢNG CỦA ĐỀ (thầy 07/11 «đề phải hiện đủ cả hình ảnh, dài quá thì có thanh cuộn»): cùng thứ tự đề máy em (LamCau `DeCau`) — hình thân câu ·
 *  bảng số liệu · ảnh đính kèm · hình «sau đề» · hình «cuối câu». Ảnh lời giải (`sau_loi_giai`) KHÔNG có trong câu công khai. Ảnh tải xong ⇒ đo lại cỡ chữ. */
export function HinhDe({ q, so, f, onTai }: { q: Question; so: number; f: ((s: string) => string) | null; onTai: () => void }) {
  const ds = [q.thanCauImg, q.imageDataUrl, ...(q.hinhAnh ?? []).filter((h) => h.viTri === 'sau_de' || h.viTri === 'cuoi_cau' || h.viTri === 'than_cau').map((h) => h.src)].filter((x): x is string => !!x)
  const bang = q.table && q.table.length ? q.table : null
  if (!ds.length && !bang) return null
  return (
    <>
      {bang ? <table className="bb-bang"><tbody>{bang.map((r, i) => <tr key={i}>{r.map((c, j) => (i === 0 ? <th key={j}><Chu t={c} f={f} mot /></th> : <td key={j}><Chu t={c} f={f} mot /></td>))}</tr>)}</tbody></table> : null}
      {[...new Set(ds)].map((src, i) => <img key={i} className="bb-anh" src={src} alt={`Hình câu ${so}`} onLoad={onTai} />)}
    </>
  )
}
