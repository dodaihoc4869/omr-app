// XEM LẠI LIVE — MÁY EM: thẻ một câu của trang buổi (đặc tả mục 2.1 điểm 4; bản vẽ ảnh 14, 17). Số câu + dạng + «Em làm đúng / Em chưa đúng»; đề (đúng
// thành phần đề của màn làm bài); đáp án đúng; «Lớp làm đúng 46 % · 69/150 em»; ảnh bìa đoạn + nút phát + thời lượng; ai lên bảng, đội, Đạt / Chưa đạt;
// «Xem lời giải của câu N» mở tại chỗ. AN TOÀN: mọi thứ lấy từ `buoi.json` (câu đã mở đáp án trong buổi) — thẻ này không gọi máy chủ.
// Không hiện số báo danh của bạn lên bảng (chỉ tên gọi + đội).
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react'
import type { Question } from '../../../game/than-thu-v2/core'
import type { CauBuoiLive, DoanBuoiLive } from '../../../lib/live/xem-lai-kieu'
import { BtLenBang, BtSao, BtTich, BtXuong } from './bieu-tuong'
import { BiaBang } from './DanhSachLive'
import { TEN_DOI_MAC_DINH, thanhCau, type MangChang } from './kieu'
import type { KetQuaEm } from './sap-doan'
import { chuDapAn, gioPhat, mauDoi, tiLeDung } from './ten-hien'

const doiCss = (doi: number | null): CSSProperties => ({ ['--doi' as string]: mauDoi(doi) })

/** Khối «đáp án đúng» theo loại câu. Trắc nghiệm / đúng–sai có chữ phương án thì tô ngay trên phương án; không thì một dòng. */
function DapAn({ c, q, chu }: { c: CauBuoiLive; q: Question; chu: (s: string) => ReactNode }) {
  const d = String(c.dung ?? '').trim().toUpperCase()
  if (!d) return null
  if (c.phan === 'I' && q.choices.length >= 2) return <div className="xl-pa" role="list" aria-label="Phương án">{q.choices.slice(0, 4).map((p, i) => {
    const kt = 'ABCD'[i]!, dung = kt === d
    return <div key={kt} role="listitem" className={dung ? 'dung' : undefined}><b>{kt}.</b><span>{chu(p)}</span>{dung ? <><BtTich /><span className="sr-only">Đáp án đúng</span></> : null}</div>
  })}</div>
  if (c.phan === 'II' && q.ideas.length >= 2) return <div className="xl-pa mot" role="list" aria-label="Bốn ý">{q.ideas.slice(0, 4).map((p, i) => {
    const dung = d[i] === 'D' || d[i] === 'Đ'
    return <div key={i} role="listitem" className="dung"><b>{'abcd'[i]})</b><span>{chu(p)}</span><em>{dung ? 'Đúng' : 'Sai'}</em></div>
  })}</div>
  return <div className="xl-dap">Đáp án đúng<b className="so">{c.phan === 'II' ? chuDapAn(c) : chu(String(c.dung))}</b></div>
}

export interface PropsTheCau {
  cau: CauBuoiLive
  /** Các đoạn chữa của câu (theo thứ tự buổi). */
  doan: DoanBuoiLive[]
  ketQua: KetQuaEm
  LC: MangChang | null
  tenDoi: readonly string[]
  /** Số em có mặt gửi bài lớn nhất buổi không cần ở đây: mẫu số là số em ĐÃ GỬI câu này. */
  khiPhat: (d: DoanBuoiLive) => void
  /** Máy tính: câu đang phát nằm ngay dưới trình phát ⇒ không lặp ảnh bìa. */
  khongBia?: boolean
  /** Các đoạn em đã xem (số thứ tự). */
  daXem: readonly number[]
}
export default function TheCau({ cau: c, doan, ketQua, LC, tenDoi, khiPhat, khongBia, daXem }: PropsTheCau) {
  const [mo, setMo] = useState(false)
  const q = thanhCau(c), tl = tiLeDung(c)
  const chu = (s: string): ReactNode => (LC ? <LC.ChemText text={s} /> : s)
  const hay = doan.find((d) => d.dangXem)
  return <section id={`xl-cau-${c.so}`} className="xl-kinh xl-the" aria-label={`Câu ${c.so}`}>
    <div className="xl-cau-dau"><span className="so-cau so">Câu {c.so}</span>{c.dang ? <span className="xl-chip">{c.dang}</span> : null}
      {ketQua ? <span className={`xl-chip ${ketQua === 'dung' ? 'dung' : 'sai'} em`}>{ketQua === 'dung' ? 'Em làm đúng' : 'Em chưa đúng'}</span> : null}</div>
    {hay ? <div className="xl-hay"><BtSao /><span>Đoạn đáng xem · {hay.dangXem}</span></div> : null}
    <div className="xl-de">{LC ? <LC.DeCau q={q} stt={c.so} /> : <p>{q.text}</p>}</div>
    {c.tuLuan ? <p className="xl-chan" style={{ textAlign: 'left', paddingBottom: 8 }}>Câu tự luận · thầy chữa trên bảng</p> : <DapAn c={c} q={q} chu={chu} />}
    {tl != null ? <div className="xl-lop so"><b>Lớp làm đúng {tl} %</b><span>{c.soDung}/{c.soGui} em</span><div className="thanh" aria-hidden="true"><i style={{ width: `${tl}%` }} /></div></div> : null}
    {doan.map((d) => <Fragment key={d.stt}>
      {khongBia ? null : <button type="button" className="xl-bia-nut" onClick={() => khiPhat(d)} aria-label={`Phát đoạn chữa câu ${c.so}${d.phan > 1 ? ` phần ${d.phan}` : ''} · ${gioPhat(d.t1 - d.t0)}`}><BiaBang dai={gioPhat(d.t1 - d.t0)} nhan={daXem.includes(d.stt) ? 'Đã xem' : undefined} /></button>}
      <p className="xl-ten-doan">{d.ten}</p>
      {d.lenBang ? <div className="xl-len"><BtLenBang /><span>Lên bảng:</span><b>{d.lenBang.ten}</b>
        <span className="xl-chip doi" style={doiCss(d.lenBang.doi)}><i className="xl-cham" aria-hidden="true" />{tenDoi[d.lenBang.doi] ?? TEN_DOI_MAC_DINH[d.lenBang.doi] ?? 'Đội'}</span>
        {d.lenBang.dat != null ? <span className={`xl-chip ${d.lenBang.dat ? 'dung' : 'chuy'}`}>{d.lenBang.dat ? 'Đạt' : 'Chưa đạt'}</span> : null}</div> : null}
    </Fragment>)}
    <button type="button" className="xl-mo" aria-expanded={mo} onClick={() => setMo((v) => !v)}>Xem lời giải của câu {c.so}<BtXuong /></button>
    {mo ? <div className="xl-giai">{!c.giai ? 'Kho chưa có lời giải cho câu này.'
      : LC ? <LC.LoiGiaiCau q={q} solution={c.giai.solution} dapAn={c.dung} hinhLoiGiai={c.giai.anh as Question['hinhAnh']} />
      : typeof c.giai.solution === 'string' ? c.giai.solution : 'Đang mở lời giải…'}</div> : null}
  </section>
}
