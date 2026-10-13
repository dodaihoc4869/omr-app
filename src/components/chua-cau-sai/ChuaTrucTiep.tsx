// CHỮA TRỰC TIẾP CÂU GỐC (12/10) — thầy gửi ảnh "Cùng gỡ câu này" ở trạng thái "Cần thêm bài luyện đúng chỗ": em chỉ thấy một khung chữ,
// không làm được gì. Nay mọi đợt không có bước để làm đi theo "Đường tự gỡ" ba bước, mỗi màn MỘT nút chính (sát đáy trên điện thoại):
//   1. Xem lại câu gốc — TheCau đầy đủ (công thức, bảng, hình) + đáp án em đã chọn (KHÔNG đáp án đúng, KHÔNG lời giải);
//   2. Tự làm lại — Boss 12/10: em làm lại TRƯỚC khi thấy đáp án (xem đáp án trước rồi làm lại là chép, không phải tự chữa):
//      · câu có lựa chọn: "Kiểm tra lại" ⇒ đúng: "Em đã tự sửa đúng" + mở bước 3; sai: cho thử thêm MỘT lần, rồi mở bước 3;
//        nút phụ "Em chưa làm được — xem lời giải" mở bước 3 ngay; sai không lộ đáp án đúng;
//      · câu tự luận / trả lời ngắn (điền số): em giải ra giấy rồi bấm "Em đã giải xong — xem lời giải để đối chiếu";
//      · máy chủ chưa mở đáp án (khoá / không có): vẫn cho làm lại nhưng KHÔNG chấm, ghi rõ "Câu này chưa được mở đáp án, thầy sẽ chữa";
//   3. Đáp án và lời giải — đáp án đúng + lời giải của kho (TheCau xem lại) + Hỏi thầy; CHỈ mở sau bước 2 và CHỈ khi máy chủ cho.
// Lần tự làm lại so trên máy với đáp án máy chủ đã cho (em đã nộp câu này) — lần tự kiểm: không ghi sổ, không tính điểm.
// Quyền xem đáp án + luật so: src/lib/chua-truc-tiep.ts (chú thích đầu tệp).
// ĐỢT 18 (13/10 — thầy: "Tối ưu lại câu từ cho dễ hiểu … Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm"): bỏ dòng nhỏ dưới tên
// bước, đoạn mở đầu dài của từng trạng thái (giữ tiêu đề), lời dặn "Trong lúc chờ…", "Em bấm Hỏi thầy…", "Em tự làm lại câu này trước…", lời khuyên
// sau lần sai; giữ mọi trạng thái, số, lời báo lỗi và nút. Nút không còn dấu gạch dài ("Em chưa làm được · xem lời giải").
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

const BUOC = ['Xem lại câu gốc', 'Tự làm lại', 'Đáp án và lời giải'] as const
/** Đợt 18: dưới tiêu đề trạng thái chỉ giữ điều em CẦN BIẾT (không lời dặn cách làm). Trạng thái khác: chỉ tiêu đề. */
const CHU_MO_DAU: Partial<Record<string, string>> = {
  can_thay: 'Bước còn mắc đã được xếp vào buổi chữa trên lớp. Em không cần gửi riêng cho thầy.',
  tam_khoa: 'Tiến độ của em vẫn được giữ.',
}
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
  /** Kết quả lần bấm "Kiểm tra lại" gần nhất (null = chưa kiểm). */
  const [ket, setKet] = useState<boolean | null>(null)
  /** Số lần em kiểm mà chưa đúng (tối đa 2: lần đầu + một lần thử thêm). */
  const [lanSai, setLanSai] = useState(0)
  /** Lần tự làm lại của em (để đối chiếu ở bước 3). */
  const [traCuoi, setTraCuoi] = useState('')
  /** Bước 3 đã mở (em làm đúng, sai đủ hai lần, giải xong ra giấy, hoặc bấm "Em chưa làm được — xem lời giải"). */
  const [moLoiGiai, setMoLoiGiai] = useState(false)
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
  const batDauLamLai = () => { setTra(''); setKet(null); setLanSai(0); doiBuoc(2) }
  const xemLoiGiai = () => { setMoLoiGiai(true); doiBuoc(3) }

  const ct = cg?.trangThai === 'co' ? cg.ct : null
  const coDapAn = !!ct && !!ct.dapAn.trim()
  const de: DeHien | null = ct ? { ...ct.de, tenDang: ct.de.tenDang } : ph.cauGoc ? deTuCauGoc(ph.cauGoc) : null
  const phan: Phan = de?.phan ?? 'I'
  // Cách làm lại ở bước 2: chấm (câu có lựa chọn, có đáp án) · giấy (tự luận / điền số: giải ra giấy rồi đối chiếu) · không chấm (máy chủ chưa mở đáp án).
  const cachLam: 'cham' | 'giay' | 'khong_cham' | null = !de ? null : !coDapAn ? 'khong_cham' : ct?.tuLuan || phan === 'III' ? 'giay' : 'cham'
  const moDau = loiMoTrucTiep(ph.trangThai)
  const hen = ph.trangThai === 'cho_gap_lai_2' ? henGapLai(ph.denHan, Date.now()) : null
  const duoc = (b: number) => b === 1 || (b === 2 ? !!cachLam : moLoiGiai && coDapAn)
  const emChon = ct ? chuDapAn(phan, ct.emTraLoi) : ''
  const dapAnChu = ct ? chuDapAn(phan, ct.dapAn) : ''

  const kiemTra = () => {
    if (!ct) return
    const dung = soTuLam(phan, tra, ct.dapAn)
    setTraCuoi(tra)
    setKet(dung)
    if (dung) setMoLoiGiai(true)
    else {
      const n = lanSai + 1
      setLanSai(n)
      if (n >= 2) setMoLoiGiai(true)
    }
  }
  const thuThem = () => { setTra(''); setKet(null) }

  // ---- nút đáy của bước hiện tại: MỘT nút chính, tối đa một nút phụ
  const nutVe = <button type="button" className="ccs-nut-phu" onClick={onVe} disabled={ban}>{nhanVe}</button>
  const nutChuaLamDuoc = <button type="button" className="ccs-nut-phu" onClick={xemLoiGiai}>Em chưa làm được · xem lời giải</button>
  let nutChinh: ReactNode = null
  let nutPhu: ReactNode = nutVe
  if (hen?.daToi) {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onLamGapLai} disabled={ban}>Làm lần gặp lại 2</button>
  } else if (!cg) {
    nutChinh = null
  } else if (buoc === 1) {
    nutChinh = de
      ? <button type="button" className="ccs-nut-chinh" onClick={batDauLamLai}>Tự làm lại câu này</button>
      : <button type="button" className="ccs-nut-chinh" onClick={onVe} disabled={ban}>{nhanVe}</button>
    if (!de) nutPhu = null
  } else if (buoc === 2 && cachLam === 'cham') {
    if (ket === null) {
      nutChinh = <button type="button" className="ccs-nut-chinh" disabled={!daTraLoiDu(phan, tra)} onClick={kiemTra}>Kiểm tra lại</button>
      nutPhu = nutChuaLamDuoc
    } else if (ket) {
      nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => doiBuoc(3)}>Đối chiếu lời giải</button>
    } else if (lanSai < 2) {
      nutChinh = <button type="button" className="ccs-nut-chinh" onClick={thuThem}>Thử thêm một lần</button>
      nutPhu = nutChuaLamDuoc
    } else {
      nutChinh = <button type="button" className="ccs-nut-chinh" onClick={() => doiBuoc(3)}>Xem đáp án và lời giải</button>
    }
  } else if (buoc === 2 && cachLam === 'giay') {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={xemLoiGiai}>Em đã giải xong · xem lời giải</button>
  } else if (buoc === 3 && moLoiGiai && ct) {
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onVe} disabled={ban}>{nhanVe}</button>
    nutPhu = cachLam === 'cham' ? <button type="button" className="ccs-nut-phu" onClick={batDauLamLai}>Làm lại lần nữa</button> : null
  } else {
    // Máy chủ chưa mở đáp án (hoặc chưa có câu): rời màn là việc chính.
    nutChinh = <button type="button" className="ccs-nut-chinh" onClick={onVe} disabled={ban}>{nhanVe}</button>
    nutPhu = null
  }

  const khungCau = (p: TheCauProps, lop = '') => (
    <div className={`m3 ccs-cau-goc-the${lop ? ` ${lop}` : ''}`}>
      <TheCau {...p} />
    </div>
  )
  const TIEU_DE_BUOC = ['Câu em đã làm sai', 'Em tự làm lại câu này', 'Đáp án đúng và lời giải'] as const

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
              const xong = so < buoc || (so === 2 && ket === true)
              return (
                <li key={ten} data-da={xong} data-hien-tai={so === buoc}>
                  <button type="button" aria-current={so === buoc ? 'step' : undefined} disabled={!duoc(so)} onClick={() => (so === 2 && buoc === 1 ? batDauLamLai() : doiBuoc(so))}>
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
          {ph.trangThai && CHU_MO_DAU[ph.trangThai] && <p>{CHU_MO_DAU[ph.trangThai]}</p>}
          {ph.trangThai === 'cho_gap_lai_2' && (
            <p className="ccs-hen" role="status">
              {hen ? (
                hen.daToi ? <>Đã tới lần gặp lại 2 (hẹn <b>{hen.luc}</b>).</>
                  : <>Lần gặp lại 2 mở lúc <b className="ccs-so">{hen.luc}</b> ({hen.conLai}).</>
              ) : 'Lần gặp lại 2 mở sau ít nhất 24 giờ kể từ lúc em ghép xong bài.'}
            </p>
          )}
        </section>

        <div className="ccs-buoc-truc-tiep">
          <p className="ccs-ghi">Bước {buoc} · {BUOC[buoc - 1]}</p>
          <h3 className="ccs-buoc-ten" ref={tieuDeRef} tabIndex={-1}>{TIEU_DE_BUOC[buoc - 1]}</h3>
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
              <p className="ccs-goi-y" role="status">Câu này chưa được mở đáp án, thầy sẽ chữa. Đáp án và lời giải mở sau khi thầy công bố ca kiểm tra.</p>
            ) : cg.trangThai === 'khong_co' ? (
              <div className="ccs-goi-y" role="status">
                <p>{de ? 'Chưa mở được đáp án của câu này ở đây.' : 'Chưa tải được câu gốc ở đây.'}</p>
                <NutHoiThay qid={qid} nguon="tu_chua" />
              </div>
            ) : cg.trangThai === 'loi' ? (
              <div className="ccs-loi" role="alert">
                <p>{cg.loi}</p>
                <button type="button" className="ccs-nut-phu" onClick={() => setLanTai((n) => n + 1)}>Thử lại</button>
              </div>
            ) : null}
          </>
        ) : buoc === 2 && de ? (
          cachLam === 'giay' ? (
            <>
              {khungCau(propsCauLam(de, ''), 'ccs-chi-de')}
              <p className="ccs-goi-y" role="status">
                {ct?.tuLuan ? 'Câu tự luận, không chấm tự động: em giải ra giấy rồi đối chiếu lời giải.' : 'Câu trả lời ngắn: em giải ra giấy rồi đối chiếu lời giải.'}
              </p>
            </>
          ) : (
            <>
              {khungCau(propsCauLam(de, tra, (v) => setTra(v), ket !== null))}
              {cachLam === 'khong_cham' ? (
                <div className="ccs-goi-y" role="status">
                  <p>{cg.trangThai === 'khoa' ? 'Câu này chưa được mở đáp án, thầy sẽ chữa. Lần làm lại này không chấm.' : 'Chưa mở được đáp án ở đây nên lần làm lại này không chấm.'}</p>
                  {cg.trangThai !== 'khoa' && <NutHoiThay qid={qid} nguon="tu_chua" />}
                </div>
              ) : ket !== null ? (
                <section className="ccs-phan-hoi" data-dung={ket} role="status" aria-live="polite">
                  <h3>{ket ? 'Em đã tự sửa đúng' : lanSai < 2 ? 'Chưa đúng' : 'Vẫn chưa đúng'}</h3>
                  {ket && <p>Lần tự làm lại này không tính điểm, không đổi lịch ôn.</p>}
                </section>
              ) : null}
            </>
          )
        ) : buoc === 3 && moLoiGiai && ct ? (
          <>
            <dl className="ccs-doi-chieu">
              <div data-kieu="dung">
                <dt>{ct.tuLuan ? 'Đáp án tham khảo' : 'Đáp án đúng'}</dt>
                <dd>{dapAnChu}</dd>
              </div>
              <div data-kieu="em">
                <dt>{nhanTra(phan)} lần trước</dt>
                <dd>{emChon || 'chưa lưu'}</dd>
              </div>
              {traCuoi && (
                <div data-kieu={soTuLam(phan, traCuoi, ct.dapAn) ? 'dung' : 'em'}>
                  <dt>Lần em tự làm lại</dt>
                  <dd>{chuDapAn(phan, traCuoi)} · {soTuLam(phan, traCuoi, ct.dapAn) ? 'đúng' : 'chưa đúng'}</dd>
                </div>
              )}
            </dl>
            {khungCau({ ...propsTheCau(ct, 1), hoiThay: { qid, nguon: 'tu_chua' } })}
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
