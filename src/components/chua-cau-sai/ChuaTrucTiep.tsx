// CHỮA TRỰC TIẾP CÂU GỐC (12/10) — thầy gửi ảnh "Cùng gỡ câu này" ở trạng thái "Cần thêm bài luyện đúng chỗ": em chỉ thấy một khung chữ,
// không làm được gì. Nay mọi đợt không có bước để làm đi theo "Đường tự gỡ" ba bước, mỗi màn MỘT nút chính (sát đáy trên điện thoại):
//   1. Xem lại câu gốc — TheCau đầy đủ (công thức, bảng, hình) + đáp án em đã chọn;
//   2. Đáp án và lời giải — đáp án đúng + lời giải của kho (TheCau xem lại) + nút Hỏi thầy mở lời giải từng bước; CHỈ khi máy chủ cho;
//   3. Tự làm lại — em làm lại câu, bấm "Kiểm tra lại" ⇒ đúng / chưa đúng (lần tự kiểm: không ghi sổ, không tính điểm).
// Quyền xem đáp án + luật so: src/lib/chua-truc-tiep.ts (chú thích đầu tệp).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import TheCau, { type TheCauProps } from '../TheCau'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { chiSoDuoiRo, propsTheCau } from '../hoa2/cau-chuyen'
import type { HinhAnh } from '../../data/examContent'
import type { KetQuaDot } from '../../lib/chua-cau-sai-api'
import { chuDapAn, daTraLoiDu, henGapLai, loiMoTrucTiep, soTuLam, taiCauGocDaLam, type CauGocDaLam } from '../../lib/chua-truc-tiep'

type Chu = 'A' | 'B' | 'C' | 'D'
type DS = 'D' | 'S'
type Phan = 'I' | 'II' | 'III'
/** Đề để vẽ: bản đầy đủ của "Câu đã làm" (`ChiTietCau.de`) hoặc đề công khai vòng chữa gửi kèm (`KetQuaDot.cauGoc`) — không đáp án. */
interface DeHien {
  phan: Phan
  text: string
  choices?: string[]
  ideas?: string[]
  table?: string[][]
  thanCauImg?: string
  imageDataUrl?: string
  choiceImgs?: (string | undefined)[]
  ideaImgs?: (string | undefined)[]
  hinhAnh?: { src: string; viTri: string; alt?: string }[]
  tenDang?: string
}
const laPhan = (x: unknown): x is Phan => x === 'I' || x === 'II' || x === 'III'
const bon = <T,>(a: readonly T[] | undefined, lap: T): [T, T, T, T] => [a?.[0] ?? lap, a?.[1] ?? lap, a?.[2] ?? lap, a?.[3] ?? lap]

/** TheCau chế độ `thi` (KHÔNG đáp án): `onDoi` vắng hoặc `khoa` ⇒ chỉ đọc (bước 1 hiện lựa chọn cũ của em). */
export function propsCauLam(d: DeHien, tra: string, onDoi?: (v: string) => void, khoa = false): TheCauProps {
  const chung = {
    cheDo: 'thi' as const,
    stt: 1,
    tieuDe: d.tenDang || undefined,
    text: chiSoDuoiRo(d.text),
    thanCauImg: d.thanCauImg,
    table: d.table,
    imageDataUrl: d.imageDataUrl,
    hinhAnh: d.hinhAnh as HinhAnh[] | undefined,
  }
  const doi = khoa ? undefined : onDoi
  const t = tra.trim().toUpperCase().replace(/Đ/g, 'D')
  if (d.phan === 'I') {
    return {
      ...chung,
      phan: 'I',
      choices: bon(d.choices, '').map(chiSoDuoiRo) as [string, string, string, string],
      choiceImgs: d.choiceImgs ? (bon(d.choiceImgs, undefined) as [string?, string?, string?, string?]) : undefined,
      choicePerm: [0, 1, 2, 3],
      selected: /^[A-D]$/.test(t) ? (t as Chu) : null,
      onSelect: doi ? (o) => doi(o) : undefined,
    }
  }
  if (d.phan === 'II') {
    const mang = t.replace(/[^DS-]/g, '').padEnd(4, '-').slice(0, 4).split('')
    return {
      ...chung,
      phan: 'II',
      ideas: bon(d.ideas, '').map(chiSoDuoiRo) as [string, string, string, string],
      ideaImgs: d.ideaImgs ? (bon(d.ideaImgs, undefined) as [string?, string?, string?, string?]) : undefined,
      selected: mang.map((x) => (x === 'D' || x === 'S' ? x : null)) as (DS | null)[],
      onSelect: doi ? (i, v) => { const m = [...mang]; m[i] = v; doi(m.join('')) } : undefined,
    }
  }
  return { ...chung, phan: 'III', selected: tra, onChange: doi ? (v) => doi(v) : undefined, khoaO: !doi }
}

function deTuCauGoc(c: NonNullable<KetQuaDot['cauGoc']>): DeHien | null {
  if (!laPhan(c.phan) || !c.text) return null
  return { ...c, phan: c.phan, hinhAnh: c.hinhAnh as DeHien['hinhAnh'] }
}

const BUOC = ['Xem lại câu gốc', 'Đáp án và lời giải', 'Tự làm lại'] as const
const nhanTra = (phan: Phan) => (phan === 'I' ? 'Em đã chọn' : 'Em đã trả lời')

function IconBuoc({ so, xong }: { so: number; xong: boolean }) {
  if (!xong) return <span aria-hidden="true">{so}</span>
  return (
    <span aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
    </span>
  )
}

export interface PropsChuaTrucTiep {
  token: string
  qid: string
  ph: KetQuaDot
  /** Đang gửi lệnh của vòng chữa (khoá nút). */
  ban: boolean
  /** Nhãn nút rời màn (mặc định "Sang câu khác"). */
  nhanVe: string
  onVe: () => void
  /** Hẹn lần gặp lại 2 đã tới ⇒ xin vòng chữa phát bản mới (`phat-item` tiep). */
  onLamGapLai: () => void
  /** Phần đầu khung (lời thầy gỡ…), vẽ trên lời mở đầu. */
  dau?: ReactNode
}

export default function ChuaTrucTiep({ token, qid, ph, ban, nhanVe, onVe, onLamGapLai, dau }: PropsChuaTrucTiep) {
  const [cg, setCg] = useState<CauGocDaLam | null>(null)
  const [lanTai, setLanTai] = useState(0)
  const [buoc, setBuoc] = useState<1 | 2 | 3>(1)
  const [tra, setTra] = useState('')
  const [ket, setKet] = useState<boolean | null>(null)
  const tieuDeRef = useRef<HTMLHeadingElement>(null)
  const daDoiBuoc = useRef(false)

  useEffect(() => {
    let song = true
    setCg(null)
    void taiCauGocDaLam(token, qid).then((r) => { if (song) setCg(r) })
    return () => { song = false }
  }, [token, qid, lanTai])
  useEffect(() => {
    if (daDoiBuoc.current) tieuDeRef.current?.focus()
  }, [buoc])

  const doiBuoc = (b: 1 | 2 | 3) => {
    daDoiBuoc.current = true
    setBuoc(b)
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0 })
  }
  const lamLai = () => { setTra(''); setKet(null); doiBuoc(3) }

  const ct = cg?.trangThai === 'co' ? cg.ct : null
  const coDapAn = !!ct && !!ct.dapAn.trim()
  const lamLaiDuoc = coDapAn && !ct?.tuLuan
  const de: DeHien | null = ct ? { ...ct.de, tenDang: ct.de.tenDang } : ph.cauGoc ? deTuCauGoc(ph.cauGoc) : null
  const phan: Phan = de?.phan ?? 'I'
  const moDau = loiMoTrucTiep(ph.trangThai)
  const hen = ph.trangThai === 'cho_gap_lai_2' ? henGapLai(ph.denHan, Date.now()) : null
  const duoc = (b: number) => b === 1 || (b === 2 ? coDapAn : lamLaiDuoc)
  const emChon = ct ? chuDapAn(phan, ct.emTraLoi) : ''
  const dapAnChu = ct ? chuDapAn(phan, ct.dapAn) : ''

  // ---- nút đáy của bước hiện tại: MỘT nút chính, tối đa một nút phụ
  let nutChinh: ReactNode = null
  let nutPhu: ReactNode = <button type="button" className="ccs-nut-phu" onClick={onVe} disabled={ban}>{nhanVe}</button>
  if (hen?.daToi) {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onLamGapLai} disabled={ban}>Làm lần gặp lại 2</button>
  } else if (!cg) {
    nutChinh = null
  } else if (buoc === 1 && coDapAn) {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => doiBuoc(2)}>Xem đáp án và lời giải</button>
  } else if (buoc === 2 && lamLaiDuoc) {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={lamLai}>Tự làm lại câu này</button>
  } else if (buoc === 3 && lamLaiDuoc && ct) {
    if (ket === null) {
      nutChinh = (
        <button type="button" className="ccs-nut-chinh" disabled={!daTraLoiDu(phan, tra)} onClick={() => setKet(soTuLam(phan, tra, ct.dapAn))}>
          Kiểm tra lại
        </button>
      )
    } else if (ket) {
      nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onVe} disabled={ban}>{nhanVe}</button>
      nutPhu = <button type="button" className="ccs-nut-phu" onClick={lamLai}>Làm lại lần nữa</button>
    } else {
      nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => doiBuoc(2)}>Xem lại lời giải</button>
      nutPhu = <button type="button" className="ccs-nut-phu" onClick={lamLai}>Làm lại lần nữa</button>
    }
  } else {
    // Không có đáp án để đi tiếp (máy chủ giữ / chưa có câu): rời màn là việc chính.
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onVe} disabled={ban}>{nhanVe}</button>
    nutPhu = null
  }

  const khungCau = (p: TheCauProps) => (
    <div className="m3 ccs-cau-goc-the">
      <TheCau {...p} />
    </div>
  )

  return (
    <div className="ccs-bo-cuc" data-tuyen="truc-tiep">
      <aside className="ccs-cot-phu" aria-label="Đường tự gỡ">
        <section className="ccs-the-tien-do">
          <div className="ccs-the-tien-do-dau">
            <span>Đường tự gỡ</span>
            <strong className="ccs-so">Bước {buoc}/3</strong>
          </div>
          <ol className="ccs-lo-trinh" data-nut="true" aria-label="Các bước chữa trực tiếp">
            {BUOC.map((ten, i) => {
              const so = (i + 1) as 1 | 2 | 3
              const xong = so < buoc || (so === 3 && ket === true)
              return (
                <li key={ten} data-da={xong} data-hien-tai={so === buoc}>
                  <button type="button" aria-current={so === buoc ? 'step' : undefined} disabled={!duoc(so)} onClick={() => (so === 3 && buoc !== 3 ? lamLai() : doiBuoc(so))}>
                    <IconBuoc so={so} xong={xong} />
                    <b>{ten}</b>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </aside>
      <section className="ccs-khu-lam" aria-label="Chữa trực tiếp câu gốc">
        {dau}
        <section className="ccs-trang-thai ccs-mo-dau" data-trang-thai={ph.trangThai}>
          <h2>{moDau.tieuDe}</h2>
          <p>{moDau.chu}</p>
          {ph.trangThai === 'cho_gap_lai_2' && (
            <p className="ccs-hen" role="status">
              {hen ? (
                hen.daToi ? <>Đã tới lần gặp lại 2 (hẹn <b>{hen.luc}</b>). Em bấm "Làm lần gặp lại 2" để tự làm bản mới.</>
                  : <>Lần gặp lại 2 mở lúc <b className="ccs-so">{hen.luc}</b> ({hen.conLai}). Trong lúc chờ, em chữa câu khác hoặc xem lại câu gốc ở dưới.</>
              ) : 'Lần gặp lại 2 mở sau ít nhất 24 giờ kể từ lúc em ghép xong bài. Trong lúc chờ, em chữa câu khác.'}
            </p>
          )}
        </section>

        <div className="ccs-buoc-truc-tiep">
          <p className="ccs-ghi">Bước {buoc} · {BUOC[buoc - 1]}</p>
          <h3 className="ccs-buoc-ten" ref={tieuDeRef} tabIndex={-1}>
            {buoc === 1 ? 'Câu em đã làm sai' : buoc === 2 ? 'Đáp án đúng và lời giải' : 'Em tự làm lại câu này'}
          </h3>
        </div>

        {!cg ? (
          <div className="ccs-dang-tai-nho" role="status">Đang tải câu gốc…</div>
        ) : buoc === 1 ? (
          <>
            {de ? khungCau(propsCauLam(de, ct?.emTraLoi ?? '')) : null}
            {ct ? (
              <dl className="ccs-doi-chieu">
                <div data-kieu="em">
                  <dt>{nhanTra(phan)}</dt>
                  <dd>{emChon || 'Lần làm đó chưa lưu lựa chọn của em.'}</dd>
                </div>
              </dl>
            ) : null}
            {cg.trangThai === 'khoa' ? (
              <p className="ccs-goi-y" role="status">Câu này đang nằm trong một ca kiểm tra chưa công bố kết quả. Đáp án và lời giải mở sau khi thầy công bố — em quay lại sau nhé.</p>
            ) : cg.trangThai === 'khong_co' ? (
              <div className="ccs-goi-y" role="status">
                <p>{de ? 'Chưa mở được đáp án của câu này ở đây.' : 'Chưa tải được câu gốc ở đây.'} Em bấm Hỏi thầy để xem lời giải câu này (lời giải chỉ mở khi câu không còn nằm trong ca kiểm tra chưa công bố).</p>
                <NutHoiThay qid={qid} nguon="tu_chua" />
              </div>
            ) : cg.trangThai === 'loi' ? (
              <div className="ccs-loi" role="alert">
                <p>{cg.loi}</p>
                <button type="button" className="ccs-nut-phu" onClick={() => setLanTai((n) => n + 1)}>Thử lại</button>
              </div>
            ) : ct?.tuLuan ? (
              <p className="ccs-goi-y" role="status">Câu tự luận — không chấm tự động. Em đọc đáp án tham khảo và lời giải ở bước 2.</p>
            ) : null}
          </>
        ) : buoc === 2 && ct ? (
          <>
            <dl className="ccs-doi-chieu">
              <div data-kieu="dung">
                <dt>{ct.tuLuan ? 'Đáp án tham khảo' : 'Đáp án đúng'}</dt>
                <dd>{dapAnChu}</dd>
              </div>
              <div data-kieu="em">
                <dt>{nhanTra(phan)}</dt>
                <dd>{emChon || 'chưa lưu'}</dd>
              </div>
            </dl>
            {khungCau({ ...propsTheCau(ct, 1), hoiThay: { qid, nguon: 'tu_chua' } })}
          </>
        ) : buoc === 3 && ct && de ? (
          <>
            {khungCau(propsCauLam(de, tra, (v) => { setTra(v); setKet(null) }, ket !== null))}
            {ket !== null && (
              <section className="ccs-phan-hoi" data-dung={ket} role="status" aria-live="polite">
                <h3>{ket ? 'Em làm đúng rồi' : 'Chưa đúng'}</h3>
                <dl className="ccs-doi-chieu ccs-doi-chieu-gon">
                  <div data-kieu="em">
                    <dt>{nhanTra(phan)}</dt>
                    <dd>{chuDapAn(phan, tra)}</dd>
                  </div>
                  {!ket && (
                    <div data-kieu="dung">
                      <dt>Đáp án đúng</dt>
                      <dd>{dapAnChu}</dd>
                    </div>
                  )}
                </dl>
                <p>{ket ? 'Lần tự làm lại này để em tự kiểm — không tính điểm, không đổi lịch ôn.' : 'Em đọc lại lời giải, tìm chỗ mình làm khác rồi làm lại nhé.'}</p>
              </section>
            )}
          </>
        ) : null}

        <div className="ccs-hang-nut ccs-day">
          {nutChinh}
          {nutPhu}
        </div>
      </section>
    </div>
  )
}
