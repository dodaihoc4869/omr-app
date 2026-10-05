import { useEffect, useId, useRef, useState } from 'react'
import {
  chiTietHocPhi,
  conThieu,
  dinhDangTien,
  docSoTien,
  nopHocPhi,
  suaMucHocPhi,
  taoMaLanNop,
  TEN_TRANG_THAI,
  trangThaiHocPhi,
  xoaLanNop,
  type HocPhiChiTiet,
  type HocPhiEm,
} from '../../lib/hoc-phi'
import '../hop-xac-nhan.css'
import './hoc-phi.css'

const ngayDep = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso)

/** HỘP HỌC PHÍ MỘT EM: phải nộp · đã nộp · còn thiếu, nhập thêm một lần nộp (cộng dồn), lịch sử từng lần (xoá lần nhập nhầm), sửa mức riêng. */
export default function HopHocPhi({ sbd, hoTen, banDau, onDong, onDoi }: {
  sbd: string
  hoTen: string
  /** Số đang có ở danh sách (hiện ngay, rồi tải chi tiết). */
  banDau: HocPhiEm
  onDong: () => void
  /** Báo màn danh sách số mới sau mỗi lần ghi. */
  onDoi: (em: HocPhiEm) => void
}) {
  const id = useId()
  const [em, setEm] = useState<HocPhiChiTiet>({ ...banDau, lanNop: [] })
  const [daTaiChiTiet, setDaTaiChiTiet] = useState(false)
  const [chu, setChu] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [dangLam, setDangLam] = useState(false)
  const [loi, setLoi] = useState('')
  const [bao, setBao] = useState('')
  const [hoiXoa, setHoiXoa] = useState<string | null>(null)
  const [mucChu, setMucChu] = useState(String(banDau.phaiNop))
  const [mucGhiChu, setMucGhiChu] = useState(banDau.ghiChu)
  const maLan = useRef(taoMaLanNop())
  const oNhap = useRef<HTMLInputElement>(null)
  const nutMo = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null)

  const nhan = (x: HocPhiChiTiet) => {
    setEm(x)
    onDoi({ sbd: x.sbd || sbd, phaiNop: x.phaiNop, daNop: x.daNop, ghiChu: x.ghiChu, soLan: x.soLan })
  }

  useEffect(() => {
    let huy = false
    chiTietHocPhi(sbd)
      .then((r) => {
        if (huy) return
        if (r.em) { nhan(r.em); setMucChu(String(r.em.phaiNop)); setMucGhiChu(r.em.ghiChu) }
        if (r.loi) setLoi(r.loi)
        setDaTaiChiTiet(true)
      })
      .catch((e) => { if (!huy) { setLoi(String((e as Error)?.message || e)); setDaTaiChiTiet(true) } })
    oNhap.current?.focus()
    const nut = nutMo.current
    return () => {
      huy = true
      if (nut instanceof HTMLElement) nut.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbd])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !dangLam) onDong() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [dangLam, onDong])

  const tt = trangThaiHocPhi(em.phaiNop, em.daNop)
  const thieu = conThieu(em)
  const soTien = docSoTien(chu)
  const vuot = soTien !== null && soTien > thieu
  const choGhi = !dangLam && soTien !== null && !vuot && thieu > 0

  const ghi = async () => {
    if (!choGhi || soTien === null) return
    setDangLam(true); setLoi(''); setBao('')
    try {
      const r = await nopHocPhi(sbd, soTien, ghiChu.trim(), maLan.current)
      if (r.em) nhan(r.em)
      if (r.loi) setLoi(r.loi)
      else {
        setBao(`Đã ghi ${dinhDangTien(soTien)}.`)
        setChu(''); setGhiChu('')
        maLan.current = taoMaLanNop()
      }
    } catch (e) {
      // Có thể đã tới máy chủ: GIỮ mã lần nộp ⇒ bấm lại không ghi đôi.
      setLoi(`${String((e as Error)?.message || e)} Bấm Ghi nhận lại cũng không bị ghi hai lần.`)
    } finally {
      setDangLam(false)
    }
  }

  const xoa = async (idLan: string) => {
    if (hoiXoa !== idLan) { setHoiXoa(idLan); return }
    setDangLam(true); setLoi(''); setBao('')
    try {
      const r = await xoaLanNop(sbd, idLan)
      if (r.em) nhan(r.em)
      if (r.loi) setLoi(r.loi)
      else setBao('Đã xoá lần nộp.')
    } catch (e) {
      setLoi(String((e as Error)?.message || e))
    } finally {
      setDangLam(false); setHoiXoa(null)
    }
  }

  const mucMoi = docSoTien(mucChu) ?? (mucChu.trim() === '0' ? 0 : null)
  const luuMuc = async () => {
    if (mucMoi === null || dangLam) return
    setDangLam(true); setLoi(''); setBao('')
    try {
      const r = await suaMucHocPhi(sbd, mucMoi, mucGhiChu.trim())
      if (r.em) nhan(r.em)
      if (r.loi) setLoi(r.loi)
      else setBao(`Đã lưu mức học phí ${dinhDangTien(mucMoi)}.`)
    } catch (e) {
      setLoi(String((e as Error)?.message || e))
    } finally {
      setDangLam(false)
    }
  }

  return (
    <div className="hxn-nen" data-khoi="hop-hoc-phi">
      <button type="button" className="hxn-man" aria-hidden="true" tabIndex={-1} disabled={dangLam} onClick={onDong} />
      <div className="hxn-hop hp-hop" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <h2 id={`${id}-t`} className="hp-hop-ten">Học phí · {hoTen || `SBD ${sbd}`}</h2>
        <span className="hp-hop-sbd">SBD {sbd}</span>{' '}
        <span className={`hp-nhan hp-mau--${tt}`}>{TEN_TRANG_THAI[tt]}</span>

        <dl className="hp-bang">
          <dt>Phải nộp</dt>
          <dd>{dinhDangTien(em.phaiNop)}</dd>
          <dt>Đã nộp</dt>
          <dd className={em.daNop > 0 ? 'hp-du' : ''}>{dinhDangTien(em.daNop)}</dd>
          <dt>Còn thiếu</dt>
          <dd className={thieu > 0 ? 'hp-thieu' : 'hp-du'}>{dinhDangTien(thieu)}</dd>
        </dl>
        {em.ghiChu && <div className="hp-hop-sbd">Ghi chú: {em.ghiChu}</div>}

        {thieu > 0 ? (
          <>
            <label className="hp-truong">
              <span>Số tiền nộp lần này</span>
              <input
                ref={oNhap}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ví dụ 500000 hoặc 500k"
                value={chu}
                disabled={dangLam}
                onChange={(e) => { setChu(e.target.value); setBao('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') void ghi() }}
              />
            </label>
            <div className="hp-xem-so" data-sai={chu.trim() !== '' && (soTien === null || vuot) ? 'true' : 'false'} aria-live="polite">
              {chu.trim() === '' ? '' : soTien === null ? 'Số tiền chưa đúng.' : vuot ? `Vượt số còn thiếu (${dinhDangTien(thieu)}).` : `= ${dinhDangTien(soTien)} · sau lần này còn thiếu ${dinhDangTien(thieu - soTien)}`}
            </div>
            <div className="hp-nhanh">
              <button type="button" disabled={dangLam} onClick={() => setChu(String(thieu))}>Nộp đủ {dinhDangTien(thieu)}</button>
            </div>
            <label className="hp-truong">
              <span>Ghi chú (không bắt buộc)</span>
              <input value={ghiChu} maxLength={200} disabled={dangLam} placeholder="Ví dụ: chuyển khoản, mẹ nộp" onChange={(e) => setGhiChu(e.target.value)} />
            </label>
          </>
        ) : (
          <div className="hp-ok">{em.phaiNop > 0 ? 'Em đã nộp đủ học phí.' : 'Em này không thu học phí.'}</div>
        )}

        {loi && <p className="hxn-loi" role="alert">{loi}</p>}
        {bao && <p className="hp-ok" role="status">{bao}</p>}

        <div className="hxn-nut-hang">
          <button type="button" className="hxn-nut hxn-nut--chu" disabled={dangLam} onClick={onDong}>Đóng</button>
          {thieu > 0 && (
            <button type="button" className="hxn-nut hxn-nut--chinh" disabled={!choGhi} onClick={() => void ghi()}>
              {dangLam ? 'Đang ghi…' : 'Ghi nhận nộp'}
            </button>
          )}
        </div>

        <div className="hp-lich-su">
          <h3>Các lần nộp {daTaiChiTiet ? `(${em.lanNop.length})` : ''}</h3>
          {!daTaiChiTiet ? (
            <div className="hp-hop-sbd">Đang tải…</div>
          ) : em.lanNop.length === 0 ? (
            <div className="hp-hop-sbd">Chưa có lần nộp nào.</div>
          ) : (
            <ul>
              {em.lanNop.map((l) => (
                <li key={l.id}>
                  <span>
                    <span className="hp-lan-tien">{dinhDangTien(l.soTien)}</span>
                    <span className="hp-lan-phu">
                      {l.nguon.startsWith('excel:') ? 'Nhập từ file Excel' : `Ngày ${ngayDep(l.ngayVn)}`}
                      {l.ghiChu ? ` · ${l.ghiChu}` : ''}
                    </span>
                  </span>
                  <button type="button" className="hp-xoa" data-hoi={hoiXoa === l.id ? 'true' : 'false'} disabled={dangLam} onClick={() => void xoa(l.id)}>
                    {hoiXoa === l.id ? 'Bấm lần nữa để xoá' : 'Xoá'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="hp-muc">
          <summary>Sửa mức học phí của em (miễn giảm)</summary>
          <label className="hp-truong">
            <span>Mức phải nộp (0 = không thu)</span>
            <input inputMode="numeric" value={mucChu} disabled={dangLam} onChange={(e) => setMucChu(e.target.value)} />
          </label>
          <div className="hp-xem-so" data-sai={mucMoi === null ? 'true' : 'false'}>
            {mucMoi === null ? 'Mức chưa đúng.' : `= ${dinhDangTien(mucMoi)}`}
          </div>
          <label className="hp-truong">
            <span>Lý do</span>
            <input value={mucGhiChu} maxLength={180} disabled={dangLam} placeholder="Ví dụ: anh em ruột giảm 50%" onChange={(e) => setMucGhiChu(e.target.value)} />
          </label>
          <div className="hxn-nut-hang">
            <button type="button" className="hxn-nut hxn-nut--chu" disabled={dangLam || mucMoi === null} onClick={() => void luuMuc()}>Lưu mức</button>
          </div>
        </details>
      </div>
    </div>
  )
}
