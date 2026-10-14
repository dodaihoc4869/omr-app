// Tấm chỉnh em nhận bài đã tick; không tạo chiến dịch, không đổi màn sau lưu.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sinhMaNgauNhien } from '../../lib/thiet-bi'
import ChonEmGiao from './ChonEmGiao'
import { luuEmNhanBai, taiEmNhanBai, type AckEmNhanBai, type DanhSachNhanBai, type SuaEmNhanBai } from './api-goi7-em'
import './sua-em-nhan-bai.css'

type Props = { goiId: string; lop: string; ten: string; onDong: () => void; onDaLuu: (ack: AckEmNhanBai) => void }
type LanGui = { gui: SuaEmNhanBai; nhan: string[] }
const phimDuoc = 'button:not(:disabled), input:not(:disabled), [tabindex="0"]'

export default function SuaEmNhanBai({ goiId, lop, ten, onDong, onDaLuu }: Props) {
  const [goc, setGoc] = useState<DanhSachNhanBai | null>(null), [chon, setChon] = useState<Set<string>>(new Set())
  const [moi, setMoi] = useState<DanhSachNhanBai | null>(null)
  const [doc, setDoc] = useState(true), [luu, setLuu] = useState(false), [loi, setLoi] = useState('')
  const [xungDot, setXungDot] = useState(false), [daLuu, setDaLuu] = useState(false), [hoiDong, setHoiDong] = useState(false)
  const [choAck, setChoAck] = useState(false)
  const song = useRef(false), doi = useRef(0), guiLan = useRef<LanGui | null>(null), dangLuu = useRef(false), dangDoc = useRef(false)
  const tam = useRef<HTMLElement>(null), nutDong = useRef<HTMLButtonElement>(null), nutGiu = useRef<HTMLButtonElement>(null)
  const id = useId()
  const emDuocChon = useMemo(() => goc?.em.filter(e => e.duocThem) ?? [], [goc])
  const them = emDuocChon.filter(e => chon.has(e.sbd) && !goc?.nhan.includes(e.sbd))
  const bot = goc?.em.filter(e => !chon.has(e.sbd) && goc.nhan.includes(e.sbd)) ?? []
  const coNhap = them.length + bot.length > 0 || choAck
  const khoa = doc || luu || xungDot || choAck || hoiDong
  const trangThai = useRef({ coNhap, luu, hoiDong })
  trangThai.current = { coNhap, luu, hoiDong }
  const goiVe = useRef({ onDong, onDaLuu })
  goiVe.current = { onDong, onDaLuu }

  const tai = useCallback(async (doiChieu = false) => {
    if (dangDoc.current || dangLuu.current) return
    dangDoc.current = true
    const lan = ++doi.current
    setDoc(true); setLoi('')
    try {
      const r = await taiEmNhanBai(goiId, lop)
      if (!song.current || lan !== doi.current) return
      if (!r.ok) { setLoi(r.chu); return }
      if (doiChieu) setMoi(r.du)
      else { setGoc(r.du); setChon(new Set(r.du.nhan)) }
    } finally {
      if (lan === doi.current) { dangDoc.current = false; if (song.current) setDoc(false) }
    }
  }, [goiId, lop])
  const dong = useCallback(() => {
    if (trangThai.current.luu) return
    if (trangThai.current.coNhap) setHoiDong(true)
    else goiVe.current.onDong()
  }, [])

  useEffect(() => {
    song.current = true
    const cu = document.activeElement as HTMLElement | null, cuCuon = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nutDong.current?.focus()
    void tai()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc trong bộ chọn đóng bộ chọn trước; lần Esc sau mới hỏi bỏ nháp.
        if (tam.current?.querySelector('[data-khoi="chon-em-giao"] button[aria-expanded="true"]')) return
        e.preventDefault(); e.stopImmediatePropagation()
        if (trangThai.current.hoiDong) setHoiDong(false)
        else dong()
      }
      if (e.key !== 'Tab') return
      const trong = tam.current?.querySelector('[role="alertdialog"]') ?? tam.current
      const nut = [...(trong?.querySelectorAll<HTMLElement>(phimDuoc) ?? [])].filter(x => !x.closest('fieldset:disabled') && x.getAttribute('aria-hidden') !== 'true')
      const dau = nut[0], cuoi = nut[nut.length - 1]
      if (!dau) { e.preventDefault(); tam.current?.focus(); return }
      if (e.shiftKey && (document.activeElement === dau || !tam.current?.contains(document.activeElement))) { e.preventDefault(); cuoi?.focus() }
      else if (!e.shiftKey && (document.activeElement === cuoi || !tam.current?.contains(document.activeElement))) { e.preventDefault(); dau.focus() }
    }
    document.addEventListener('keydown', phim)
    return () => {
      song.current = false; ++doi.current; dangDoc.current = false
      document.removeEventListener('keydown', phim)
      document.body.style.overflow = cuCuon
      if (cu?.isConnected) cu.focus()
    }
  }, [tai, dong])
  useEffect(() => { if (hoiDong) nutGiu.current?.focus(); else nutDong.current?.focus() }, [hoiDong])

  const luuDanhSach = async () => {
    if (!goc || dangLuu.current || doc || xungDot || (!them.length && !bot.length && !guiLan.current)) return
    const lanGui = guiLan.current ?? {
      gui: { action: 'sua_em' as const, goiId, revision: goc.revision, requestId: sinhMaNgauNhien(), them: them.map(e => e.sbd).sort(), bot: bot.map(e => e.sbd).sort() },
      nhan: [...chon].sort(),
    }
    guiLan.current = lanGui
    dangLuu.current = true; ++doi.current
    setLuu(true); setLoi(''); setDaLuu(false)
    try {
      const r = await luuEmNhanBai(lanGui.gui, lanGui.nhan)
      if (!song.current) return
      if (!r.ok) {
        setLoi(r.chu); setChoAck(true)
        if (r.code === 'xung_dot' || r.code === 'tam_dung' || r.code === 'khong_hop_le' || r.code === 'doi_ket_noi') setXungDot(true)
        return
      }
      guiLan.current = null; setChoAck(false)
      setGoc(cu => cu ? { ...cu, nhan: r.du.nhan, revision: r.du.revision, serverNow: r.du.serverNow } : cu)
      setChon(new Set(r.du.nhan)); setDaLuu(true)
      goiVe.current.onDaLuu(r.du)
    } finally {
      dangLuu.current = false
      if (song.current) setLuu(false)
    }
  }
  const doiChon = (s: Set<string>) => { if (!khoa) { setChon(s); setDaLuu(false); setLoi('') } }
  const emKhongCon = moi ? them.filter(e => !moi.em.some(m => m.sbd === e.sbd && m.duocThem)) : []
  const apDungMoi = (giuNhap: boolean) => {
    if (!moi || giuNhap && emKhongCon.length) return
    const chonMoi = new Set(moi.nhan)
    if (giuNhap) { for (const e of them) chonMoi.add(e.sbd); for (const e of bot) chonMoi.delete(e.sbd) }
    setGoc(moi); setChon(chonMoi); setMoi(null); setXungDot(false); setChoAck(false); setDaLuu(false); setLoi(''); guiLan.current = null
  }
  const luuDuoc = !!goc && !doc && !luu && !xungDot && (coNhap || !!guiLan.current)

  return createPortal(<div className="m3 gvv2 sen-vo">
    <div className="sen-phu" onMouseDown={e => { if (e.target === e.currentTarget) dong() }}>
      <section className="sen-tam" ref={tam} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} data-khoi="sua-em-nhan-bai" onKeyDown={e => { if (e.key === 'Enter' && e.target instanceof HTMLInputElement) { e.preventDefault(); e.stopPropagation() } }}>
        <header><span><p className="sen-nhan">{lop}{goc ? ` · đang nhận ${goc.nhan.length} em` : ''}</p><h2 id={id}>Em nhận {ten}</h2></span><button ref={nutDong} type="button" className="sen-dong" aria-label="Đóng tấm Em nhận bài" disabled={luu || hoiDong} onClick={dong}>×</button></header>
        <div className="sen-than">
          <aside><p className="sen-nhan">Danh sách sẽ thay đổi</p><div className="sen-so"><span>Thêm <b>{goc ? `${them.length} em` : doc ? 'Đang đọc' : 'Chưa có số'}</b></span><span>Bớt <b>{goc ? `${bot.length} em` : doc ? 'Đang đọc' : 'Chưa có số'}</b></span><span>Sẽ nhận <b>{goc ? `${chon.size} em` : doc ? 'Đang đọc' : 'Chưa có số'}</b></span></div>
            <div className="sen-thay-doi">{them.map(e => <p key={e.sbd}><b>Thêm</b><span>{e.hoTen || e.sbd}</span></p>)}{bot.map(e => <p key={e.sbd}><b>Bớt</b><span>{e.hoTen || e.sbd}</span></p>)}</div>
            <p className="sen-chu">Em được thêm nhận cùng bài và hạn của lớp. Kết quả đã làm được giữ.</p>
          </aside>
          <div className="sen-bo-chon">
            <p className="sen-nhan">Em nhận bài</p>
            {!goc && doc ? <div className="sen-xuong" role="status" aria-label="Đang đọc danh sách nhận bài">{[0, 1, 2].map(n => <span key={n} className="tt-xuong" />)}</div> : goc && <>
              {!goc.nhan.length && <p className="sen-chu">Chưa em nào nhận bài. Thầy có thể chọn em bên dưới.</p>}
              {emDuocChon.length ? <fieldset disabled={khoa}><ChonEmGiao ds={emDuocChon} chon={chon} onDoi={doiChon} /></fieldset> : <p className="sen-chu">Không có em hợp lệ trong lớp. Thầy kiểm tra danh sách lớp ở mục Học sinh.</p>}
              {goc.em.some(e => !e.duocThem) && <p className="sen-chu">Em đang khóa không được thêm: {goc.em.filter(e => !e.duocThem).map(e => e.hoTen || e.sbd).join(', ')}.</p>}
              {!!goc.emChuyenLop?.length && <p className="sen-chu">Em đã chuyển lớp, không còn nhận bài này: {goc.emChuyenLop.map(e => `${e.hoTen || e.sbd} (${e.tenLop || 'chưa rõ lớp'})`).join(', ')}.</p>}
            </>}
            {loi && <p role="alert" className="sen-loi">{loi}</p>}
            {!goc && !doc && <button type="button" className="gvv2-nut-vien" onClick={() => void tai()}>Thử đọc lại</button>}
            {xungDot && !moi && <button type="button" className="gvv2-nut-vien" disabled={doc} onClick={() => void tai(true)}>{doc ? 'Đang đọc…' : 'Đọc danh sách mới'}</button>}
            {moi && <section className="sen-doi-chieu" aria-label="Đối chiếu danh sách mới"><p>Máy chủ hiện có {moi.nhan.length} em nhận bài. Phần thêm/bớt thầy chọn vẫn được giữ phía bên.</p>
              {!!emKhongCon.length && <p role="alert">Không thể thêm vì em đã chuyển lớp hoặc đang khóa: {emKhongCon.map(e => e.hoTen || e.sbd).join(', ')}.</p>}
              <button type="button" className="gvv2-nut-vien" disabled={!!emKhongCon.length} onClick={() => apDungMoi(true)}>Áp dụng nháp vào danh sách mới</button><button type="button" className="gvv2-nut-chu" onClick={() => apDungMoi(false)}>Bỏ nháp, dùng danh sách mới</button>
            </section>}
          </div>
        </div>
        {hoiDong && <div className="sen-hoi" role="alertdialog" aria-label="Bỏ thay đổi chưa lưu?"><p>{choAck ? 'Lượt lưu chưa được xác nhận. Khi mở lại, app sẽ đọc danh sách máy chủ.' : 'Danh sách đang có thay đổi chưa lưu.'}</p><button ref={nutGiu} type="button" className="gvv2-nut-vien" onClick={() => { setHoiDong(false); nutDong.current?.focus() }}>Giữ nháp, tiếp tục sửa</button><button type="button" className="gvv2-nut-chu" onClick={onDong}>Bỏ nháp và đóng</button></div>}
        <footer><p role="status">{daLuu ? 'Đã lưu danh sách' : luu ? 'Đang lưu danh sách…' : doc ? 'Đang đọc danh sách…' : !goc ? 'Chưa đọc được danh sách' : `${them.length + bot.length} em thay đổi`}</p><div><button type="button" className="gvv2-nut-vien" disabled={luu || hoiDong} onClick={dong}>{daLuu ? 'Đóng' : 'Hủy'}</button><button type="button" className="gvv2-nut-chinh" disabled={!luuDuoc || hoiDong} onClick={() => void luuDanhSach()}>{luu ? 'Đang lưu…' : choAck && !xungDot ? 'Thử lưu lại' : 'Lưu danh sách'}</button></div></footer>
      </section>
    </div>
  </div>, document.body)
}
