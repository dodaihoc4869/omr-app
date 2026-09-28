// HỘP CHỈNH SỬA CHIẾN DỊCH ĐANG MỞ (thầy 28/09): "thêm đề, thêm bớt học sinh, chỉnh lại hạn; lưu lại thì phân bổ lại số câu nếu thêm đề".
// Khung M3 `HopChon` (cùng hộp chọn của màn chiến dịch); dùng lại cây Kho đề `HopChonDe` + bộ chọn em `ChonEmGiao` của màn Giao.
// Máy chủ `/gv/chien-dich/sua`: `doc` (em + tờ + hạn hiện tại) · `xem-truoc` (không ghi — số câu sau khi thêm) · `luu`.
// Tóm tắt thay đổi trước khi lưu: "+2 đề, +3 em, −1 em, hạn 30/09 → 05/10" (`chuTomTatSua`, một nguồn với nhật ký máy chủ).
// Nút "Lưu" mờ đi khi đang lưu, GIỮ NGUYÊN chữ.
// Số câu/ngày (Boss chốt 28/09): thêm đề / rút hạn mà không kịp ⇒ máy tự NÂNG (không tự hạ), hiện "Số câu/ngày: 12 → 15 (để kịp hạn 05/10)";
// thầy sửa tay được (số nguyên ≥ 1); thấp hơn mức cần ⇒ cảnh báo vàng "chưa kịp hạn", vẫn cho lưu.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { chuTomTatSua, ngayNgan } from '../../lib/tom-tat-sua-chien-dich'
import HopChonDe from '../HopChonDe'
import { docChienDichDeSua, luuSuaChienDich, xemTruocSua, type ChienDichDeSua, type KetQuaSua, type ThayDoiGui } from './api'
import ChonEmGiao from './ChonEmGiao'
import HopChon from './HopChon'
import { useDsEmGiao, useKhoDe } from './nguon-giao'
import { hienHanNop, laNgay } from './ngay'
import './chien-dich.css'
import './sua-chien-dich.css'

/** Chặn số vô nghĩa (giống máy chủ `THE_LUC_TOI_DA`). */
const THE_LUC_TOI_DA = 500
/** Chờ thầy chọn xong rồi mới hỏi máy chủ (ms). */
const CHO_XEM_MS = 350

export default function SuaChienDich({ id, ten, onDong, onDaLuu }: { id: string; ten: string; onDong: () => void; onDaLuu: (kq: KetQuaSua) => void }) {
  const [goc, setGoc] = useState<{ homNay: string; cd: ChienDichDeSua } | null>(null)
  const [loiDoc, setLoiDoc] = useState('')
  const [lanDoc, setLanDoc] = useState(0)
  const [themDe, setThemDe] = useState<string[]>([])
  const [moCay, setMoCay] = useState(false)
  const [chonEm, setChonEm] = useState<Set<string>>(new Set())
  const [hanNop, setHanNop] = useState('')
  /** Chữ thầy gõ ở ô số câu/ngày; rỗng = để máy tự tính. */
  const [theLucTay, setTheLucTay] = useState('')
  const [xem, setXem] = useState<KetQuaSua | null>(null)
  const [dangXem, setDangXem] = useState(false)
  const [loiXem, setLoiXem] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState('')

  const kho = useKhoDe()
  const dsEm = useDsEmGiao()

  useEffect(() => {
    let huy = false
    setLoiDoc('')
    void docChienDichDeSua(id).then((r) => {
      if (huy) return
      if (!r.ok) {
        setLoiDoc(r.chu)
        return
      }
      setGoc({ homNay: r.du.homNay, cd: r.du.chienDich })
      setChonEm(new Set(r.du.chienDich.sbd))
      setHanNop(r.du.chienDich.hanNop)
    })
    return () => {
      huy = true
    }
  }, [id, lanDoc])

  // ---- thay đổi so với chiến dịch đang lưu
  const coTrongDs = useMemo(() => new Set(dsEm.map((e) => e.sbd)), [dsEm])
  const sbdGoc = useMemo(() => goc?.cd.sbd ?? [], [goc])
  const themSbd = useMemo(() => [...chonEm].filter((s) => !sbdGoc.includes(s)), [chonEm, sbdGoc])
  // Chỉ tính "bớt" với em CÓ trong bộ chọn (em không còn trong danh sách lớp thì giữ nguyên).
  const botSbd = useMemo(() => sbdGoc.filter((s) => coTrongDs.has(s) && !chonEm.has(s)), [sbdGoc, coTrongDs, chonEm])
  const emNgoaiDs = sbdGoc.filter((s) => !coTrongDs.has(s)).length
  const homNay = goc?.homNay ?? ''
  const hanMoi = goc && hanNop !== goc.cd.hanNop ? hanNop : null
  const hanHopLe = !hanMoi || (laNgay(hanMoi) && hanMoi >= homNay)
  const soTay = theLucTay.trim() === '' ? null : Number(theLucTay)
  const theLucGui = soTay != null && Number.isInteger(soTay) && soTay >= 1 ? Math.min(THE_LUC_TOI_DA, soTay) : null
  const theLucHopLe = theLucTay.trim() === '' || theLucGui != null
  const tt = { themDe: themDe.length, themEm: themSbd.length, botEm: botSbd.length, hanCu: goc?.cd.hanNop ?? '', hanMoi, theLucCu: goc?.cd.theLucNgay }
  // Có thay đổi do THẦY làm (chưa tính phần máy tự nâng — phần đó chỉ có sau khi xem trước).
  const coThayDoi = !!goc && chuTomTatSua({ ...tt, theLucMoi: theLucGui }) !== ''
  const tomTat = goc ? chuTomTatSua({ ...tt, theLucMoi: theLucGui ?? xem?.theLucNgay ?? null }) : ''
  const daDung = !!goc && (goc.cd.hetHan || goc.cd.trangThai === 'da_dong')
  const thayDoi: ThayDoiGui = useMemo(
    () => ({ ...(themDe.length ? { themMaDe: themDe } : {}), ...(themSbd.length ? { themSbd } : {}), ...(botSbd.length ? { botSbd } : {}), ...(hanMoi ? { hanNop: hanMoi } : {}), ...(theLucGui != null ? { theLucNgay: theLucGui } : {}) }),
    [themDe, themSbd, botSbd, hanMoi, theLucGui],
  )
  const khoaThayDoi = JSON.stringify(thayDoi)

  // ---- xem trước ở máy chủ (số câu sau khi thêm đề, tờ không có câu mới, mở lại); câu trả lời cũ về muộn thì bỏ
  const luot = useRef(0)
  useEffect(() => {
    if (!goc || !coThayDoi || !hanHopLe || !theLucHopLe) {
      luot.current++
      setXem(null)
      setLoiXem('')
      setDangXem(false)
      return
    }
    const l = ++luot.current
    setDangXem(true)
    const hen = setTimeout(() => {
      void xemTruocSua(id, thayDoi).then((r) => {
        if (l !== luot.current) return
        setDangXem(false)
        if (r.ok) {
          setXem(r.du)
          setLoiXem('')
        } else {
          setXem(null)
          setLoiXem(r.chu)
        }
      })
    }, CHO_XEM_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaThayDoi, goc, coThayDoi, hanHopLe, theLucHopLe, id])

  const tichTuCay = (m: string) => setThemDe((cu) => (cu.includes(m) ? cu.filter((x) => x !== m) : [...cu, m]))
  const datChonTuCay = (ma: string[]) => setThemDe([...new Set(ma)])

  const luu = async () => {
    if (dangLuu || !coThayDoi || !hanHopLe || !theLucHopLe || !goc) return
    setDangLuu(true)
    setLoiLuu('')
    const r = await luuSuaChienDich(id, thayDoi)
    setDangLuu(false)
    if (!r.ok) {
      setLoiLuu(r.chu)
      return
    }
    onDaLuu(r.du)
  }

  const luuDuoc = !!goc && coThayDoi && hanHopLe && theLucHopLe && !dangLuu && !dangXem && !loiXem
  const daChonDe = useMemo(() => new Set(themDe), [themDe])

  // Cổng ra document.body nằm NGOÀI vỏ `.m3.vo-thay` ⇒ mất token màu (--m3-surface-container-high…) ⇒ hộp trong suốt (thầy 28/09).
  // Bọc lại bằng lớp vỏ `display: contents`: token và luật con của vỏ thầy áp vào hộp, không thêm hộp bố cục nào.
  return createPortal(
    <div className="m3 vo-thay" data-vo-cong="sua-chien-dich" style={{ display: 'contents' }}>
    <HopChon tieuDe={`Chỉnh sửa: ${ten}`} nhanXacNhan="Lưu" xacNhanDuoc={luuDuoc} onXacNhan={() => void luu()} onDong={() => {
      // Esc khi tấm chọn em đang mở: tấm tự đóng, hộp giữ nguyên.
      if (!document.querySelector('[data-khoi="sua-chien-dich"] .cd-tam-chon')) onDong()
    }} rong={680}>
      <div className="scd" data-khoi="sua-chien-dich">
        {loiDoc && (
          <p className="cd-loi" role="alert">
            {loiDoc}{' '}
            <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => setLanDoc((x) => x + 1)}>
              Tải lại
            </button>
          </p>
        )}
        {!loiDoc && !goc && <p className="cd-phu">Đang tải chiến dịch…</p>}
        {goc && (
          <>
            {/* ---- Tờ đề ---- */}
            <section className="scd-muc" aria-labelledby="scd-de">
              <h3 id="scd-de" className="scd-tieu-de">Thêm tờ đề</h3>
              <p className="cd-phu cd-so">
                Đang có {goc.cd.soCau} câu · {goc.cd.maDe.length} tờ: {goc.cd.maDe.join(', ')}
              </p>
              {themDe.length > 0 && (
                <ul className="scd-ds-to" aria-label="Tờ đề thêm vào">
                  {themDe.map((m) => {
                    const n = xem?.soCauTheoTo?.[m]
                    return (
                      <li key={m}>
                        <span className="scd-ten-to">
                          {m}
                          {n !== undefined ? <small className="cd-so"> · {n === 0 ? 'không có câu mới' : `+${n} câu`}</small> : null}
                        </span>
                        <button type="button" className="m3-nut-chu cd-nut-nho" aria-label={`Bỏ tờ ${m}`} onClick={() => tichTuCay(m)}>
                          Bỏ
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <button type="button" className="m3-nut-chu cd-nut-nho cd-nut-trai" aria-expanded={moCay} onClick={() => setMoCay((x) => !x)}>
                {moCay ? 'Thu gọn Kho đề' : 'Thêm tờ từ Kho đề'}
              </button>
              {moCay &&
                (kho === null ? (
                  <p className="cd-phu">Đang đọc Kho đề trên máy này…</p>
                ) : kho.length === 0 ? (
                  <p className="cd-phu">Máy này chưa có Kho đề — vào Kho đề để đồng bộ trước.</p>
                ) : (
                  <HopChonDe ds={kho} daChon={daChonDe} chonNhieu cao={240} onChon={tichTuCay} onChonTatCa={datChonTuCay} />
                ))}
            </section>

            {/* ---- Học sinh ---- */}
            <section className="scd-muc" aria-labelledby="scd-em">
              <h3 id="scd-em" className="scd-tieu-de">Học sinh nhận chiến dịch</h3>
              {dsEm.length > 0 ? (
                <ChonEmGiao ds={dsEm} chon={chonEm} onDoi={setChonEm} />
              ) : (
                <p className="cd-phu">Chưa đọc được danh sách em — lúc này chỉ sửa được tờ đề và hạn nộp.</p>
              )}
              {emNgoaiDs > 0 && <p className="cd-phu cd-so">{emNgoaiDs} em không còn trong danh sách lớp — giữ nguyên trong chiến dịch.</p>}
              <p className="cd-phu">Bớt em: em không thấy chiến dịch nữa, bài đã làm vẫn giữ trong sổ.</p>
            </section>

            {/* ---- Hạn nộp ---- */}
            <section className="scd-muc" aria-labelledby="scd-han">
              <h3 id="scd-han" className="scd-tieu-de">Hạn nộp</h3>
              <label className="cd-truong">
                Hạn nộp (hết lúc 23:59)
                <input type="date" value={hanNop} min={homNay} onChange={(e) => setHanNop(e.target.value)} />
                <small className="cd-so cd-phu">
                  {!hanHopLe ? 'Hạn nộp mới phải từ hôm nay trở đi' : daDung && !hanMoi ? 'Chiến dịch đã hết hạn — chọn hạn mới để mở lại' : laNgay(hanNop) ? hienHanNop(hanNop) : ''}
                </small>
              </label>
              <div className="cd-truong">
                <label htmlFor="scd-the-luc">Số câu mỗi ngày (một em)</label>
                <div className="cd-hang-o">
                  <input
                    id="scd-the-luc"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={THE_LUC_TOI_DA}
                    step={1}
                    value={theLucTay !== '' ? theLucTay : String(xem?.theLucNgay ?? goc.cd.theLucNgay)}
                    onChange={(e) => setTheLucTay(e.target.value)}
                  />
                  {theLucTay !== '' && (
                    <button type="button" className="m3-nut-chu cd-nut-nho" onClick={() => setTheLucTay('')}>
                      Tự tính
                    </button>
                  )}
                </div>
                <small className="cd-so cd-phu">
                  {!theLucHopLe
                    ? 'Số câu mỗi ngày phải là số nguyên từ 1 trở lên'
                    : theLucTay !== ''
                      ? 'Thầy đặt tay — bấm Tự tính để máy tính lại'
                      : 'Máy tự nâng khi thêm đề hoặc rút hạn mà không kịp; không tự hạ'}
                </small>
              </div>
            </section>

            {/* ---- Tóm tắt trước khi lưu ---- */}
            <div className="scd-tom-tat" aria-live="polite" data-khoi="tom-tat-sua">
              <p className="scd-dong-chinh">
                <span className="cd-nhan-nhom">Thay đổi</span> <b className="cd-so">{tomTat || 'Chưa có thay đổi nào'}</b>
              </p>
              {dangXem && <p className="cd-phu">Đang tính số câu…</p>}
              {xem && !dangXem && (
                <>
                  {xem.soCauThem > 0 && (
                    <p className="cd-so">
                      Số câu {xem.soCauCu} → {xem.soCauSau}. Câu em đã làm giữ nguyên; phần câu chưa làm được chia lại theo số ngày còn lại.
                    </p>
                  )}
                  {(xem.themSbd.length > 0 || xem.botSbd.length > 0) && (
                    <p className="cd-so">
                      Số em {goc.cd.soEm} → {xem.soEmSau}
                      {xem.themSbd.length > 0 ? '. Em mới được chia câu như em giao từ đầu.' : '.'}
                    </p>
                  )}
                  {xem.theLucNgay != null && xem.theLucCu != null && xem.theLucNgay !== xem.theLucCu && (
                    <p className="cd-so" data-khoi="so-cau-ngay">
                      Số câu/ngày: {xem.theLucCu} → {xem.theLucNgay}
                      {xem.tuNang ? ` (để kịp hạn ${ngayNgan(xem.hanNop)})` : ''}
                    </p>
                  )}
                  {xem.chuaKipHan && (
                    <p className="scd-canh-bao" role="status">
                      Chưa kịp hạn: cần ít nhất {xem.theLucCan} câu/ngày để em còn nhiều lượt nhất (câu mới 2 lượt, câu đã thành thạo không tính) làm đủ trước {ngayNgan(xem.hanNop)}. Vẫn lưu được.
                    </p>
                  )}
                  {xem.moLai && <p>Chiến dịch được mở lại tới hạn nộp mới.</p>}
                  {xem.toKhongCoCauMoi.length > 0 && (
                    <p className="cd-phu">Không có câu mới (trùng câu đã có, câu tự luận hoặc câu chưa duyệt): {xem.toKhongCoCauMoi.join(', ')}</p>
                  )}
                </>
              )}
              {loiXem && (
                <p className="cd-loi" role="alert">
                  {loiXem}
                </p>
              )}
              {loiLuu && (
                <p className="cd-loi" role="alert">
                  {loiLuu}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </HopChon>
    </div>,
    document.body,
  )
}
