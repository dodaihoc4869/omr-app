// GỌI LÊN BẢNG PHÂN TẦNG (thầy chốt 21/10) — mảnh giao diện dùng chung cho mọi kênh gọi lên bảng của app thầy.
// Tầng CHỈ hiện trên màn thầy; bản chiếu không bao giờ ghi tầng. Bản vẽ: docs/ban-ve-goi-len-bang-2110.
import { useEffect, useRef, useState } from 'react'
import { TEN_CHE_DO, TEN_TANG, ghiCheDo, type CheDoChonEm, type PhanBoGoi, type Tang } from '../../lib/chon-em-phan-tang'
import './chon-em.css'

export function ChipTang({ tang }: { tang: Tang }) {
  return (
    <span className="cem cem-tang" data-t={tang}>
      <span className="cem-pip" aria-hidden="true"><i /><i /><i /></span>
      {TEN_TANG[tang]}
    </span>
  )
}

const PHU: Record<CheDoChonEm, string> = { tron: 'mặc định', chac: 'như cũ', ngau: 'rút thăm đều' }
const GHI: Record<CheDoChonEm, string> = {
  tron: 'Câu dễ gọi em Cần kèm, câu khó gọi em Khá; ba tầng chia gần đều, mỗi em một lần.',
  chac: 'Gọi em chắc làm đúng nhất trước (cách cũ) — dễ dồn vào vài em giỏi.',
  ngau: 'Rút thăm đều cả lớp có mặt, em lâu chưa lên bảng dễ được gọi hơn.',
}

export function KhoiChonEm({ kenh, cheDo, onDoi, phanBo, tieuDe = 'Cách chọn em' }: {
  kenh: string
  cheDo: CheDoChonEm
  onDoi: (v: CheDoChonEm) => void
  phanBo?: PhanBoGoi | null
  tieuDe?: string
}) {
  const [moCach, setMoCach] = useState(false)
  const chon = (v: CheDoChonEm) => { if (v === cheDo) return; ghiCheDo(kenh, v); onDoi(v) }
  return (
    <div className="cem cem-khoi">
      <div className="cem-dau">
        <b>{tieuDe}</b>
        <button type="button" className="cem-nut-cach" onClick={() => setMoCach(true)}>Cách app chọn em</button>
      </div>
      <div className="cem-seg" role="radiogroup" aria-label="Cách chọn em lên bảng">
        {(['tron', 'chac', 'ngau'] as const).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={cheDo === v} onClick={() => chon(v)}>
            {TEN_CHE_DO[v]}<small>{PHU[v]}</small>
          </button>
        ))}
      </div>
      <p className="cem-ghi">{GHI[cheDo]}</p>
      {phanBo && phanBo.soLuot > 0 && <OPhanBo pb={phanBo} />}
      {moCach && <HopCachChon dong={() => setMoCach(false)} />}
    </div>
  )
}

function OPhanBo({ pb }: { pb: PhanBoGoi }) {
  return (
    <>
      <div className="cem-pb" aria-label="Phân bố lượt gọi theo tầng">
        {([3, 2, 1] as const).map((t) => (
          <div key={t} className="cem-otg" data-t={t}>
            <span className="ten"><span className="cem-pip" aria-hidden="true"><i /><i /><i /></span>{TEN_TANG[t]}</span>
            <span className="lon">{pb.tang[t].luot} <small>lượt · {pb.tang[t].em} em</small></span>
          </div>
        ))}
      </div>
      <div className="cem-pb-chu">
        <span><b>{pb.soLuot}</b> lượt gọi · <b>{pb.soEm}</b> em khác nhau</span>
        {pb.lenLan2 > 0 ? <span><b>{pb.lenLan2}</b> em lên lần hai</span> : <span className="ok">Không em nào lên hai lần</span>}
        {!pb.lienNhau && <span className="ok">Không em nào hai câu liền nhau</span>}
      </div>
    </>
  )
}

function HopCachChon({ dong }: { dong: () => void }) {
  // Esc đóng tấm phủ; mở ra thì đưa focus vào nút Đóng (bàn phím / trình đọc màn hình).
  const nutDong = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dong() }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [dong])
  return (
    <>
      <div className="cem-nen" onClick={dong} aria-hidden="true" />
      <div className="cem-hop" role="dialog" aria-modal="true" aria-label="Cách app chọn em lên bảng">
        <div className="dau"><h2>Cách app chọn em lên bảng</h2><button type="button" className="dong" ref={nutDong} onClick={dong} aria-label="Đóng hộp Cách app chọn em">✕</button></div>
        <ol>
          <li><b>Chia ba tầng theo chính câu này</b><p>Lấy khả năng làm đúng câu ấy của từng em có mặt (tỉ lệ đúng đã đo; em chưa có số đo xếp tầng Cần kèm). Cắt đều theo 1/3 lớp nên lớp nào cũng đủ Khá · Trung bình · Cần kèm.</p></li>
          <li><b>Ghép tầng theo độ khó của câu</b><p>Nhận biết gọi em Cần kèm trước; Thông hiểu gọi em Trung bình trước; Vận dụng gọi em Khá trước. Cả buổi vẫn chia gần đều ba tầng.</p></li>
          <li><b>Rút thăm trong tầng, ưu tiên em lâu chưa lên</b><p>Theo sổ lên bảng 14 ngày: chưa lên lần nào ×3 · lên 1 lần ×1,5 · 2 lần ×1 · từ 3 lần ×0,7. Không em nào chắc chắn được gọi, không em nào bị bỏ quên.</p></li>
          <li><b>Luật cứng</b><p>Mỗi em một lần, đủ cả lớp có mặt mới tới lần hai. Không gọi một em ở hai câu liền nhau. "Đổi em" chỉ đổi câu đó, các câu khác giữ nguyên. Mở lại tờ chiếu trong ngày vẫn ra đúng danh sách đã rút.</p></li>
          <li><b>Chữa câu</b><p>Em lên bảng là em đã sai câu ấy; em giảng lại là em đã làm đúng (ưu tiên Khá).</p></li>
        </ol>
        <p>Tầng chỉ hiện trên màn của thầy. Bản chiếu chỉ ghi tên em.</p>
      </div>
    </>
  )
}
