// SỬA CÂU KIỂU DUOLINGO (thầy 27/10: «Phần sửa câu tôi chưa thấy giao diện của doligo»). CHỈ khi <html data-trong="hs">; tắt «Trong» ⇒ ChuaGon y cũ.
// Cây TRÌNH BÀY của chữa câu gọn: cùng state, cùng lệnh gon-mo / gon-nop, cùng luật «xong phần hôm nay» của ChuaGon (ChuaGon giữ mọi logic, chỉ giao
// trạng thái + hàm cho tệp này). Ngôn ngữ thiết kế = màn làm chặng Duo (ManLamBaiTap nhánh duo, lớp duo-* ở styles/trong-lam-bai.css, ô câu ở LamCau.tsx):
//   thanh trên (X · MỘT thanh tiến độ của chặng sửa hôm nay) → nhãn ngắn + đề chữ to + ô phương án 3D → ĐÁY GHIM «Kiểm tra» (+ Hỏi thầy dạng viên)
//   ⇒ tấm kết quả trượt lên (xanh / đỏ, có Bi) + «Lời giải» / «Hỏi thầy» dạng viên + «Tiếp tục» ⇒ hết chặng: màn xong có Bi mừng.
// Đáp án vẫn chỉ về SAU khi nộp (gon-mo chỉ có đề công khai; đáp án + lời giải đi cùng kết quả gon-nop) — tệp này không đọc gì khác ChuaGon.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { BookOpen, Lightbulb, X as XIcon } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import type { Question } from '../../game/than-thu-v2/core'
import type { DeGon, KetQuaGon } from '../../lib/chua-cau-sai-api'
import type { ChiTietCau } from '../hoa2/api'
import { chiSoDuoiRo } from '../hoa2/cau-chuyen'
import { chuDapAn, daTraLoiDu, LUAT_BAN_MOI } from '../../lib/chua-truc-tiep'
import { BanPhimSo, ChonDungSai, ChonTracNghiem, DeCau, HinhCuoiCau, LoiGiaiCau, OTraLoiNgan, PhanHoiDungSai, PhanHoiTraLoiNgan, PhanHoiTracNghiem } from '../hoc-tap/LamCau'
import { nhanPhim, phimTuBanPhim, soSanhDungSai, type PhimSo } from '../hoc-tap/lam-bai'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { Bi } from '../linh-vat/Bi'
import { banHat } from '../../lib/hieu-ung'
import { BungDung } from '../hoc-tap/BungDung'
import { phanHoi } from '../../lib/phan-hoi'
import { napSanGiuChan, TamGiuChanLuoi, useGiuChan } from '../hoc-tap/GiuChan'
import { loiGiuChan } from '../hoc-tap/giu-chan'
import '../hoc-tap/hoc-tap.css'
import { KhungDuoSua, type TienDoSua } from './KhungDuoSua'
export type { TienDoSua }
import './duo-sua.css'

/** Đề gọn của máy chủ ⇒ câu cho các ô Duo (LamCau). Chỉ đề công khai — không đáp án. */
export function cauTuDeGon(de: DeGon): Question {
  return {
    qid: de.qid, maDe: '', version: '', group: '', phan: de.phan, text: chiSoDuoiRo(de.text ?? ''),
    choices: (de.choices ?? []).map(chiSoDuoiRo), ideas: (de.ideas ?? []).map(chiSoDuoiRo), table: de.table, thanCauImg: de.thanCauImg, imageDataUrl: de.imageDataUrl,
    choiceImgs: de.choiceImgs?.map((x) => x ?? ''), ideaImgs: de.ideaImgs?.map((x) => x ?? ''), hinhAnh: de.hinhAnh ?? [],
    dang: null, tenDang: de.tenDang ?? '', mucDo: null, sao: null, kienThuc: [], ...(de.soO ? { soO: de.soO } : {}),
  }
}

export interface PropsChuaGonDuo {
  qid: string
  mo: KetQuaGon
  kq: KetQuaGon | null
  tra: string
  onTra: (v: string) => void
  ban: boolean
  loi: string
  daTuSua: boolean
  khep: boolean
  ct: ChiTietCau | null
  onNop: () => void
  onLamLai: () => void
  onVe: () => void
  /** Sang câu kế (Việc hôm nay) hoặc về (vắng câu kế). */
  onTiep: () => void
  nhanTiep: string
  tienDo?: TienDoSua
  chuXongPhan: string
}

export default function ChuaGonDuo(p: PropsChuaGonDuo) {
  const { qid, mo, kq, tra, ban, loi, ct, tienDo } = p
  const [moGiai, setMoGiai] = useState(false)
  const [xongChang, setXongChang] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  const nutChinh = useRef<HTMLButtonElement>(null)
  const de = mo.de
  const q = de ? cauTuDeGon(de) : null
  const qKet = ct ? cauTuDeGon(ct.de as DeGon) : q
  const phan = de?.phan ?? 'I'
  const ket = kq?.ket
  // Tấm kết quả: đúng (tự sửa / xong phần) xanh · sai (gợi ý / lời giải) đỏ.
  const tt: 'dung' | 'sai' | undefined = ket === 'tu_sua' || ket === 'xong_phan' || (p.daTuSua && !kq) ? 'dung' : ket === 'goi_y' || ket === 'loi_giai' ? 'sai' : undefined
  const tong = Math.max(1, tienDo?.tong ?? 1)
  const daXong = Math.min(tong, (tienDo?.xong ?? 0) + (p.khep ? 1 : 0))
  const pct = Math.round((100 * daXong) / tong)
  const nhanThanh = tienDo ? `Chặng ${tienDo.so} · đã sửa ${daXong}/${tong} câu` : p.khep ? 'Đã sửa xong câu này' : 'Sửa câu này'
  const dangLam = !!de && mo.ok && !kq && !p.daTuSua
  const soO = q?.soO

  // Kết quả về ⇒ đưa nút chính vào tay (con trỏ bàn phím), đúng ⇒ hạt bung từ ô đúng / Bi.
  useEffect(() => {
    if (!kq) return
    // Như màn làm chặng: khung thấp xoay ngang ⇒ đưa tấm (nút chính) vào khung nhìn; dọc / máy tính ⇒ ô đúng nằm trọn trên mép tấm dính đáy.
    const tam = nutChinh.current?.closest<HTMLElement>('.duo-day')
    if (window.matchMedia?.('(orientation: landscape) and (max-height: 500px)').matches) nutChinh.current?.scrollIntoView?.({ block: 'nearest' })
    else requestAnimationFrame(() => {
      const o = goc.current?.querySelector<HTMLElement>('.ht2-lam-pa[data-ket=dung], .ht2-lam-tn .ht2-lam-pa[aria-checked=true]')
      if (!o || !tam || getComputedStyle(tam).position !== 'sticky') return
      o.style.scrollMarginBottom = `${tam.offsetHeight + 12}px`
      o.scrollIntoView?.({ block: 'nearest' })
    })
    nutChinh.current?.focus({ preventScroll: true })
    if (tt === 'dung') banHat(goc.current?.querySelector('.ht2-lam-pa[data-ket=dung], .ht2-lam-o-hang[data-ket=dung]') ?? goc.current?.querySelector('.duo-kq-bi'), { so: 8, xa: 72 })
  }, [kq]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (xongChang) phanHoi('xong') }, [xongChang])

  const tiepTuc = () => {
    phanHoi('chon')
    if (tienDo?.cuoi && !xongChang) { setXongChang(true); goc.current?.scrollIntoView?.({ block: 'start' }); return }
    p.onTiep()
  }
  const kiem = () => { if (!ban && daTraLoiDu(phan, tra)) { phanHoi('chon'); p.onNop() } }

  // PHÍM TẮT (máy tính, như màn làm chặng): 1–4 / A–D chọn Phần I · số cho Phần III · Enter = Kiểm tra / Tiếp tục.
  const phim = useRef<(e: KeyboardEvent) => void>(() => {})
  const giuMo = useRef(false), giuBat = useRef(false)
  phim.current = (e) => {
    if (moGiai && e.key === 'Escape') { e.preventDefault(); setMoGiai(false); nutChinh.current?.focus({ preventScroll: true }); return }
    // Esc: đang giữ chân được ⇒ móc useGiuChan mở / đóng tấm; không ⇒ thoát như màn cũ (vỏ ManChuaCauSai nhường Esc cho màn Duo).
    if (e.key === 'Escape') { if (!e.defaultPrevented && !giuMo.current && !giuBat.current && !ban && !document.querySelector('[aria-modal="true"]')) p.onVe(); return }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || moGiai || giuMo.current) return
    const t = e.target instanceof HTMLElement ? e.target : null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|A)$/.test(t.tagName) || t.closest('[role=dialog]'))) return
    if (t?.tagName === 'BUTTON' && t.getAttribute('role') !== 'radio' && e.key === 'Enter') return
    if (dangLam && phan === 'I') {
      const k = e.key.toUpperCase(), so = 'ABCD'.includes(k) && k.length === 1 ? k : /^[1-4]$/.test(e.key) ? 'ABCD'[Number(e.key) - 1]! : ''
      if (so && !ban) { e.preventDefault(); phanHoi('chon'); p.onTra(so); return }
    }
    if (dangLam && phan === 'III') {
      const ps = phimTuBanPhim(e.key)
      if (ps && !ban) { e.preventDefault(); p.onTra(nhanPhim(tra, ps, soO)); return }
    }
    if (e.key !== 'Enter') return
    if (dangLam) { e.preventDefault(); kiem() }
    else if (xongChang || ket === 'tu_sua' || ket === 'xong_phan' || ket === 'loi_giai' || (p.daTuSua && !kq) || !mo.ok) { e.preventDefault(); tiepTuc() }
    else if (ket === 'goi_y' && !ban) { e.preventDefault(); phanHoi('chon'); p.onLamLai() }
  }
  useEffect(() => {
    const f = (e: KeyboardEvent) => phim.current(e)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
  // GIỮ CHÂN KHI THOÁT (như màn làm chặng, PR 415): đang giữa chặng sửa hôm nay mà đã sửa ≥ 1 câu ⇒ X / Esc / back mở tấm «Đừng đi mà…» có Bi buồn.
  // Câu ngoài việc hôm nay (không tienDo) hoặc chặng đã xong ⇒ thoát thẳng như cũ.
  const conLai = tong - daXong
  giuBat.current = !!tienDo && !xongChang && daXong >= 1 && conLai >= 1
  const giu = useGiuChan({ bat: giuBat.current, onThoat: p.onVe })
  useEffect(() => { if (tienDo) napSanGiuChan() }, [!!tienDo]) // eslint-disable-line react-hooks/exhaustive-deps
  giuMo.current = giu.mo
  const tamGiu = giu.mo ? (() => { const l = loiGiuChan({ conLai, lamLai: false, soCau: tong, daCham: [], coThuong: false }); return <TamGiuChanLuoi tieuDe={l.tieuDe} phu={l.phu} onTiep={giu.tiepTuc} onThoat={giu.thoat} /> })() : null

  // ── MÀN XONG CHẶNG: Bi mừng + hoa giấy + số có nhãn.
  if (xongChang && tienDo) {
    const hn = tienDo.homNay
    return (
      <KhungDuoSua goc={goc} onVe={p.onVe} pct={100} nhanThanh="" xong
        day={<div className="duo-day" data-xong=""><div className="duo-giua">
          <button ref={nutChinh} type="button" className="duo-nut" onClick={() => { phanHoi('chon'); p.onTiep() }}>{!tienDo.conSau ? 'Về Tự sửa lỗi' : tienDo.changTiep ? `Sửa tiếp chặng ${tienDo.changTiep}` : 'Sửa tiếp'}</button>
          {tienDo.conSau && <div className="duo-bo"><button type="button" className="duo-lien" onClick={p.onVe}>Nghỉ, về Tự sửa lỗi</button></div>}
        </div></div>}>
        <section className="duo-xong" aria-label="Kết quả chặng sửa lỗi">
          <div className="duo-hoa" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
          <div className="duo-xong-bi"><Bi cam="mung" size={148} /></div>
          <h1>{tienDo.conSau ? `Xong chặng sửa ${tienDo.so}!` : 'Xong phần sửa hôm nay!'}</h1>
          <p className="duo-xong-phu">Em đã sửa {tong} câu của chặng này.</p>
          <div className="duo-3">
            <div data-sac="dung" style={{ '--i': 0 } as CSSProperties}><p>Câu đã sửa</p><b>{tong}/{tong}</b></div>
            {hn && hn.tong > 0 && <div data-sac="sao" style={{ '--i': 1 } as CSSProperties}><p>Hôm nay</p><b>{Math.min(hn.xong, hn.tong)}/{hn.tong}</b></div>}
          </div>
          <p className="duo-ghi">Câu chưa tự sửa được sẽ gặp lại ở ngày khác.</p>
        </section>
      </KhungDuoSua>
    )
  }

  const linkHoi = (dangHoi: boolean) => <NutHoiThay gon chi="hoi" dangLam={dangHoi} qid={qid} nguon="tu_chua" dapAnEm={dangHoi ? undefined : tra || undefined} />
  const linkGiai = ct ? <button type="button" className="duo-lien" onClick={() => setMoGiai(true)}><BookOpen size={18} aria-hidden="true" />Lời giải</button> : null
  const nutTiep = (do_?: boolean) => <button ref={nutChinh} type="button" className="duo-nut" data-sac={do_ ? 'do' : undefined} onClick={tiepTuc}>Tiếp tục</button>
  const tam = (cam: 'vui' | 'sai' | 'nghi', tieu: ReactNode, than: ReactNode, them: ReactNode, nut: ReactNode, sac = tt) => (
    <section className="duo-day duo-ket" data-tt={sac ?? 'trung'} role="status" aria-live="polite"><div className="duo-giua">
      {sac === 'dung' && <BungDung key={`${mo.lan ?? 1}${ket ?? ''}`} />}{/* thầy 27/10 (video Duolingo): mây bọt + hạt vuông xanh ở dải ĐÚNG */}
      <div className="duo-kq">
        <span className="duo-kq-bi" aria-hidden="true"><Bi key={`${mo.lan ?? 1}${ket ?? ''}`} cam={cam} size={64} /></span>
        <div className="duo-kq-chu"><h2>{tieu}</h2>{than}</div>
      </div>
      {them && <div className="duo-them">{them}</div>}
      {loi && <p className="duo-loi" role="alert">{loi}</p>}
      {/* thầy 27/10 «Chỗ hỏi thầy lấy 1/3 hoặc 1/4 cái nút làm lại câu này»: Hỏi thầy (nút 3D phụ, trái) + nút chính CÙNG MỘT HÀNG */}
      <div className="duo-hang-nut">{linkHoi(false)}{nut}</div>
    </div></section>
  )
  const tick = <svg className="duo-tick" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>
  const dapAnChu = ct ? (phan === 'I' ? `${ct.dapAn}. ${qKet?.choices['ABCD'.indexOf(ct.dapAn)] ?? ''}`.trim() : chuDapAn(ct.de.phan, ct.dapAn)) : ''
  // Đúng–sai: từng ý đã hiện «Em chọn · đáp án» ngay trong câu ⇒ tấm chỉ tóm «Đúng x/4 ý · sai ý …» (như màn làm chặng).
  const yDS = ct && phan === 'II' ? soSanhDungSai(tra, ct.dapAn) : []
  const tomDS = yDS.length ? `Đúng ${yDS.filter((y) => y.dung).length}/4 ý${yDS.some((y) => !y.dung) ? ` · sai ý ${yDS.filter((y) => !y.dung).map((y) => y.chu).join(', ')}` : ''}` : ''

  // ── đáy / tấm theo trạng thái (cùng nhánh với ChuaGon)
  let day: ReactNode = null
  const dayTron = <div className="duo-day"><div className="duo-giua">{nutTiep()}</div></div>
  if (!mo.ok || (p.daTuSua && !kq)) {
    day = dayTron
  } else if (ket === 'tu_sua') {
    day = tam('vui', <>{tick}Em đã tự sửa xong câu này</>, <p className="duo-mo">Đúng ngay lần đầu, không cần gợi ý.</p>, linkGiai, nutTiep())
  } else if (ket === 'xong_phan') {
    day = tam('vui', <>{tick}Đúng rồi · xong phần hôm nay</>, kq?.lyDo ? <p className="duo-mo">{p.chuXongPhan}</p> : null, linkGiai, nutTiep())
  } else if (ket === 'loi_giai') {
    day = tam('sai', 'Chưa đúng · xem đáp án và lời giải', <>{tomDS ? <p><b>{tomDS}</b></p> : dapAnChu && <p><b>Đáp án: <ChemText text={dapAnChu} /></b></p>}<p className="duo-mo">Câu này sẽ gặp lại ở ngày khác. Chỗ nào chưa hiểu, em bấm Hỏi thầy.</p></>, linkGiai, nutTiep(true))
  } else if (ket === 'goi_y') {
    day = tam('sai', 'Chưa đúng · em thử thêm một lần',
      kq?.goiY ? <p className="duo-sua-goi-y"><Lightbulb size={16} aria-hidden="true" /><span><b>Gợi ý: </b><ChemText text={kq.goiY} /></span></p> : null,
      null,
      <button ref={nutChinh} type="button" className="duo-nut" data-sac="do" onClick={() => { phanHoi('chon'); p.onLamLai() }} disabled={ban}>{ban ? 'Đang mở lại…' : 'Làm lại câu này'}</button>)
  } else if (de) {
    const soYChua = phan === 'II' ? [0, 1, 2, 3].filter((i) => tra[i] !== 'D' && tra[i] !== 'S').length : 0
    day = <div className="duo-day"><div className="duo-giua">
      {loi && <p className="duo-loi" role="alert">{loi}</p>}
      <button type="button" className="duo-nut" onClick={kiem} disabled={ban || !daTraLoiDu(phan, tra)}>{ban ? 'Đang kiểm tra…' : phan === 'II' && soYChua ? `Còn ${soYChua} ý chưa chọn` : 'Kiểm tra'}</button>
      <div className="duo-bo">{linkHoi(true)}</div>
    </div></div>
  }

  // ── phần trả lời: đang làm ⇒ ô chọn; có đáp án (sau nộp) ⇒ ô đúng/sai; gợi ý (chưa có đáp án) ⇒ lựa chọn của em, khoá.
  const coDapAn = !!ct && !!kq && ket !== 'goi_y'
  const traLoi = !q ? null : coDapAn && qKet && ct ? (
    phan === 'II' ? <PhanHoiDungSai q={qKet} tra={tra} dapAn={ct.dapAn} lyDo={(chu) => loiGiaiChuanTuKho(ct.loiGiai, 'II', ct.dapAn)?.tungY?.[chu]?.viSao} />
      : phan === 'I' ? <PhanHoiTracNghiem q={qKet} tra={tra} dapAn={ct.dapAn} />
      : <PhanHoiTraLoiNgan tra={tra} dapAn={ct.dapAn} dung={ket === 'tu_sua' || ket === 'xong_phan'} soO={soO} />
  ) : (dangLam || ket === 'goi_y') ? (
    phan === 'II' ? <ChonDungSai q={q} value={tra} khoa={!dangLam || ban} onChon={(i, v) => { phanHoi('chon'); const a = tra.padEnd(4, '-').split(''); a[i] = v; p.onTra(a.join('')) }} />
      : phan === 'I' ? <ChonTracNghiem q={q} value={tra} khoa={!dangLam || ban} onChon={(v) => { phanHoi('chon'); p.onTra(v) }} />
      : <OTraLoiNgan value={tra} soO={soO} />
  ) : null
  const pa = q?.phan === 'I' ? q.choices : []
  const luoi = q?.phan === 'I' && !q.choiceImgs?.some(Boolean) && !q.hinhAnh.some((h) => h.viTri.startsWith('sau_pa_')) && pa.every((c) => (c ?? '').length <= 22)
  const paDai = Math.max(0, ...pa.map((c) => (c ?? '').length))
  const doDaiPa = !luoi ? undefined : paDai > 15 ? 'dai' : paDai > 8 ? 'vua' : undefined
  const deDai = !!q && (q.text.length > 160 || !!q.thanCauImg || !!q.table || q.hinhAnh.some((h) => h.viTri === 'sau_de'))
  const lan = mo.lan ?? 1

  return (
    <KhungDuoSua goc={goc} onVe={giu.xinThoat} khoaVe={ban} pct={pct} nhanThanh={nhanThanh} loe={p.khep && tt === 'dung'} tt={tt} deDai={deDai} day={day}>
      {q && mo.ok && !(p.daTuSua && !kq) ? <>
        <div key={`d${q.qid}${lan}`} className="duo-cot-de">
          <p className="duo-nhan" data-sua=""><span>{mo.banKhac ? 'Bản mới của câu em đã sai' : 'Câu em đã sai'}{lan > 1 ? ' · lần 2' : ''}</span>{tienDo ? <span className="duo-chip">Chặng sửa {tienDo.so}</span> : null}</p>
          <h1 className="ht2-an">Em tự làm lại câu này</h1>
          {lan === 1 && dangLam && <p className="duo-mo-ghi">{mo.tuSuaNeuDung ? LUAT_BAN_MOI : 'Em vừa sai câu này hôm nay: làm đúng bây giờ tính xong phần hôm nay. Ngày khác tự làm đúng mới tính là đã tự sửa.'}</p>}
          <DeCau q={q} stt={1} />
        </div>
        <div key={`t${q.qid}${lan}`} className="duo-cot-tra">
          <div className="duo-tra" data-luoi={luoi || undefined} data-pa={doDaiPa}>{traLoi}</div>
          {dangLam && phan === 'III' && <BanPhimSo value={tra} khoa={ban} soO={soO} onPhim={(ps: PhimSo) => p.onTra(nhanPhim(tra, ps, soO))} />}
          <HinhCuoiCau q={q} stt={1} />
        </div>
      </> : !mo.ok ? <section className="duo-sua-bao" data-tt="loi">
          <Bi cam="nghi" size={120} />
          <h1>Chưa mở được câu này ở đây</h1>
          {mo.loi && <p>{mo.loi}</p>}
          <div className="duo-bo">{linkHoi(false)}</div>
        </section>
        : <section className="duo-sua-bao" data-tt="dung">
          <Bi cam="vui" size={120} />
          <h1>Em đã tự sửa xong câu này</h1>
        </section>}
      {moGiai && ct && qKet && <div className="duo-lg" role="dialog" aria-modal="true" aria-label="Lời giải">
        <div className="duo-lg-the">
          <header className="duo-lg-dau"><b>Lời giải</b><button type="button" className="duo-dong" aria-label="Đóng lời giải" onClick={() => { setMoGiai(false); nutChinh.current?.focus({ preventScroll: true }) }}><XIcon size={24} aria-hidden="true" /></button></header>
          <LoiGiaiCau q={qKet} solution={ct.loiGiai} dapAn={ct.dapAn} />
          <NutHoiThay gon chi="giai" qid={qid} nguon="tu_chua" dapAnEm={tra || undefined} />
        </div>
      </div>}
      {tamGiu}
    </KhungDuoSua>
  )
}
