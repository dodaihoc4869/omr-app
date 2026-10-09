// GIAO CHIẾN DỊCH LUYỆN — 3 bước + cột tóm tắt cố định (bản vẽ docs/ban-ve-gv-2809/GV-GiaoChienDich, thầy chốt 28/09).
//   1. Chọn tờ đề: tờ đã chọn (số câu từng tờ do máy chủ đếm) + cây Kho đề có ô tìm + cơ cấu câu theo mức độ.
//   2. Chọn em: MỘT ô chọn nhiều tầng Khối › Lớp › Em (`ChonEmGiao`), danh sách em từ máy chủ (`ds-em`).
//   3. Ngày bắt đầu (thầy 28/09: mặc định hôm nay, không trước hôm nay, không sau hạn) + Hạn nộp + "Số lượt câu mỗi ngày (một em)" (tên cũ "Thể lực") gõ số bất kì hoặc gạt "Tự tính" + "Khối lượng so với thời gian còn lại".
// Hiện ở màn ca đã kết thúc (điền sẵn tờ đề + lớp của ca) và ở màn Chiến dịch luyện ("Giao chiến dịch mới", chưa điền gì).
// Mỗi lần đổi đầu vào ⇒ gọi `suc-chua`; nút chính "Giao chiến dịch cho N em" ⇒ `tao`. KHÔNG có nút rút bớt câu hay nút dời hạn (thầy 28/09).
// Giao xong cho HOÀN TÁC ("Huỷ giao" ⇒ `huy`) thay vì hỏi lại trước (luật C8).
// OMNI 3 (05/10): cây Kho đề xếp theo mục đích (thư mục DẠY HỌC / TU LUYỆN — `cay-muc-dich.ts`), vẫn chọn được mọi tờ.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import HopChonDe from '../HopChonDe'
import { huyChienDich, taoChienDich, tinhSucChua, type SucChua } from './api'
import ChonEmGiao from './ChonEmGiao'
import { useDsEmGiao, useKhoDe } from './nguon-giao'
import DongHoSucChua, { NGAY_ON_CUOI } from './DongHoSucChua'
import { congNgay, conLai, hienHanNop, hienNgay, laNgay, ngayVn, phanTram } from './ngay'
import { CHU_MUC } from './tinh'
import './chien-dich.css'

export const THE_LUC_MAC_DINH = 40
export const TRAN_HUYET_CHIEN = 80
/** Chặn số vô nghĩa (giống máy chủ `THE_LUC_TOI_DA`). */
export const THE_LUC_TOI_DA = 500
/** Chờ thầy gõ xong rồi mới hỏi máy chủ (ms). */
const CHO_TINH_MS = 350

interface ToDe {
  maDe: string
  tuCa: boolean
}


export default function GiaoChienDich({
  maCa,
  lop: lopCa = '',
  maDeCa = [],
  tenGoiY = '',
  nowMs,
  onXong,
  onDeSau,
}: {
  maCa?: string
  lop?: string
  /** Tờ đề (mã kho máy chủ) của ca vừa kiểm tra — tích sẵn. */
  maDeCa?: string[]
  tenGoiY?: string
  nowMs?: number
  onXong?: (id: string) => void
  onDeSau?: () => void
}) {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)
  const homNay = useMemo(() => ngayVn(nowMs ?? Date.now()), [nowMs])

  const [ten, setTen] = useState(tenGoiY || 'Chiến dịch luyện')
  const [to, setTo] = useState<ToDe[]>(() => maDeCa.map((m) => ({ maDe: m, tuCa: true })))
  const [chon, setChon] = useState<Set<string>>(() => new Set(maDeCa))
  const [lop, setLop] = useState(lopCa)
  // Tập SBD nhận chiến dịch — ba cách tích (toàn khối / theo lớp / từng em) cùng sửa tập này.
  const [chonEm, setChonEm] = useState<Set<string>>(new Set())
  const daDienSan = useRef(false)
  const [hanNop, setHanNop] = useState(() => congNgay(homNay, 7))
  const [batDau, setBatDau] = useState(homNay)
  const [theLuc, setTheLuc] = useState(THE_LUC_MAC_DINH)
  // Ô thể lực giữ CHỮ thầy đang gõ (xoá trắng để gõ lại được); số hợp lệ mới đổi `theLuc`.
  const [theLucChu, setTheLucChu] = useState(String(THE_LUC_MAC_DINH))
  const [tuDong, setTuDong] = useState(true)
  const [huyetChien, setHuyetChien] = useState(true)
  // Rải đều câu mới theo ngày (thầy 30/09): mặc định BẬT — câu mới chia đều theo số ngày, lượt dư để ôn.
  const [raiDeu, setRaiDeu] = useState(true)

  const [sc, setSc] = useState<SucChua | null>(null)
  const [dangTinh, setDangTinh] = useState(false)
  const [loiTinh, setLoiTinh] = useState('')
  const [lanTinh, setLanTinh] = useState(0)

  const [dangGiao, setDangGiao] = useState(false)
  const [loiGiao, setLoiGiao] = useState('')
  const [daGiao, setDaGiao] = useState<{ id: string; soCau: number; soEm: number } | null>(null)
  const [dangHuy, setDangHuy] = useState(false)

  // Kho đề trên máy (đủ mọi tờ, tách theo phần) + danh sách em (ưu tiên máy chủ) — dùng chung với hộp Chỉnh sửa chiến dịch.
  const kho = useKhoDe()
  // Cây Kho đề: mở sẵn khi chưa có tờ nào (giao mới); thu gọn khi đã điền sẵn tờ của ca.
  const [moCay, setMoCay] = useState(maDeCa.length === 0)
  const dsEm = useDsEmGiao()
  const coDanhSach = dsEm.length > 0
  const dsLop = useMemo(() => [...new Set(dsEm.map((e) => e.tenLop))].sort((a, b) => a.localeCompare(b, 'vi')), [dsEm])
  // Ca vừa kiểm tra có lớp ⇒ tích sẵn em của khối/lớp đó MỘT lần khi danh sách về.
  useEffect(() => {
    if (daDienSan.current || !coDanhSach) return
    daDienSan.current = true
    const l = lopCa.trim()
    if (l) setChonEm(new Set(dsEm.filter((e) => e.khoi === l || e.tenLop === l).map((e) => e.sbd)))
  }, [coDanhSach, dsEm, lopCa])
  const sbdChon = useMemo(() => dsEm.filter((e) => chonEm.has(e.sbd)).map((e) => e.sbd), [dsEm, chonEm])
  // Nhãn: khối chọn đủ ⇒ "Khối 12"; còn lại ⇒ tên các lớp có em được chọn.
  const nhanLop = useMemo(() => {
    if (!coDanhSach) return lop.trim()
    const ra: string[] = []
    const khoi = [...new Set(dsEm.map((e) => e.khoi))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }))
    for (const k of khoi) {
      const cua = dsEm.filter((e) => e.khoi === k)
      const chon = cua.filter((e) => chonEm.has(e.sbd))
      if (!chon.length) continue
      if (chon.length === cua.length) ra.push(k === 'Khác' ? 'Khác' : `Khối ${k}`)
      else ra.push(...[...new Set(chon.map((e) => e.tenLop))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })))
    }
    return ra.join(', ')
  }, [coDanhSach, dsEm, chonEm, lop])
  // Có danh sách ⇒ gửi đúng SBD đã tích (+ nhãn); không có ⇒ gửi tên lớp gõ tay, máy chủ tự lấy em của lớp.
  const doiTuong = coDanhSach ? { lop: nhanLop, sbd: sbdChon } : { lop: lop.trim() }

  const maDeChon = useMemo(() => to.map((t) => t.maDe).filter((m) => chon.has(m)), [to, chon])
  const hanHopLe = laNgay(hanNop) && hanNop >= homNay
  const batDauHopLe = laNgay(batDau) && batDau >= homNay && (!hanHopLe || batDau <= hanNop)
  const loiBatDau = !laNgay(batDau) || batDau < homNay ? 'Ngày bắt đầu phải từ hôm nay trở đi' : batDau > hanNop ? 'Ngày bắt đầu không được sau hạn nộp' : ''
  // Chỉ gửi ngày bắt đầu khi khác hôm nay ⇒ bắt đầu ngay như cũ.
  const guiBatDau = batDauHopLe && batDau > homNay ? { batDau } : {}
  const duDauVao = maDeChon.length > 0 && (coDanhSach ? sbdChon.length > 0 : lop.trim() !== '') && hanHopLe && batDauHopLe
  const khoaDauVao = JSON.stringify([maDeChon, doiTuong, hanNop, theLuc, batDau, raiDeu])

  // ĐỒNG HỒ SỨC CHỨA: gọi lại mỗi khi đổi đầu vào (chờ thầy gõ xong); câu trả lời cũ về muộn thì bỏ.
  const luotTinh = useRef(0)
  useEffect(() => {
    if (daGiao) return
    if (!duDauVao) {
      setSc(null)
      setLoiTinh('')
      setDangTinh(false)
      return
    }
    const luot = ++luotTinh.current
    setDangTinh(true)
    const hen = setTimeout(() => {
      void tinhSucChua({ ...doiTuong, maDe: maDeChon, hanNop, ...guiBatDau, theLucNgay: theLuc, raiDeu }).then((r) => {
        if (luot !== luotTinh.current) return
        setDangTinh(false)
        if (r.ok) {
          setSc(r.du)
          setLoiTinh('')
        } else {
          setSc(null)
          setLoiTinh(r.chu)
        }
      })
    }, CHO_TINH_MS)
    return () => clearTimeout(hen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaDauVao, lanTinh, duDauVao, daGiao])

  // TỰ ĐỘNG: đặt thể lực = số máy chủ đề xuất (khối lượng lượt không phụ thuộc thể lực ⇒ một vòng là đứng).
  useEffect(() => {
    if (!tuDong || !sc?.theLucDeXuat || sc.theLucDeXuat === theLuc) return
    setTheLuc(sc.theLucDeXuat)
    setTheLucChu(String(sc.theLucDeXuat))
  }, [tuDong, sc?.theLucDeXuat, theLuc])

  const giao = async () => {
    if (!duDauVao || dangGiao) return
    setDangGiao(true)
    setLoiGiao('')
    const r = await taoChienDich({
      ten: ten.trim() || 'Chiến dịch luyện',
      ...doiTuong,
      maDe: maDeChon,
      hanNop,
      ...guiBatDau,
      theLucNgay: theLuc,
      huyetChien,
      raiDeu,
      ...(maCa ? { maCa } : {}),
    })
    setDangGiao(false)
    if (!r.ok) {
      setLoiGiao(r.chu)
      return
    }
    setDaGiao(r.du)
    showToast(`Đã giao chiến dịch cho ${r.du.soEm} em · ${r.du.soCau} câu`, 'success')
    onXong?.(r.du.id)
  }

  const huyGiao = async () => {
    if (!daGiao || dangHuy) return
    setDangHuy(true)
    const r = await huyChienDich(daGiao.id)
    setDangHuy(false)
    if (!r.ok) {
      showToast(r.chu, 'warn')
      return
    }
    setDaGiao(null)
    showToast('Đã huỷ chiến dịch vừa giao — học sinh không nhận nữa', 'success')
  }

  const doiTich = (m: string) =>
    setChon((cu) => {
      const s = new Set(cu)
      if (s.has(m)) s.delete(m)
      else s.add(m)
      return s
    })

  // Cây Kho đề tích cả nhánh (chương/bài) ⇒ trả TẬP chọn mới đầy đủ: tờ mới vào danh sách, tờ bỏ tích giữ dòng (bỏ tích).
  const datChonTuCay = (ma: string[]) => {
    const moi = [...new Set(ma)]
    setTo((cu) => [...cu, ...moi.filter((m) => !cu.some((t) => t.maDe === m)).map((m) => ({ maDe: m, tuCa: false }))])
    setChon(new Set(moi))
  }
  // Tích một tờ trên cây Kho đề: chưa có ⇒ thêm vào danh sách + tích; đang tích ⇒ bỏ tích.
  const tichTuCay = (m: string) => {
    if (chon.has(m)) {
      doiTich(m)
      return
    }
    setTo((cu) => (cu.some((t) => t.maDe === m) ? cu : [...cu, { maDe: m, tuCa: false }]))
    setChon((cu) => new Set([...cu, m]))
  }

  if (daGiao) {
    return (
      <section className="cd-the" data-khoi="giao-chien-dich" aria-live="polite">
        <span className="cd-nhan-buoc">ĐÃ GIAO CHIẾN DỊCH</span>
        <h2>{ten.trim() || 'Chiến dịch luyện'}</h2>
        <p className="cd-phu">
          {daGiao.soEm} em · {daGiao.soCau} câu · hạn nộp {hienHanNop(hanNop)}. Theo dõi ở Hành trình › Cần thầy chữa.
        </p>
        <div className="cd-hang-nut">
          <button type="button" className="m3-nut-chu cd-nut-nho" disabled={dangHuy} onClick={() => void huyGiao()}>
            {dangHuy ? 'Đang huỷ…' : 'Huỷ giao'}
          </button>
          <button type="button" className="m3-nut-chinh" onClick={() => setScreen('goilenbang')}>
            Xem bảng chiến dịch
          </button>
        </div>
      </section>
    )
  }

  const soEm = sc?.soEm ?? 0
  const tongCau = sc ? `Tổng ${sc.soCau} câu` : ''
  const mucDo = thuTuMucDo(sc?.soCauTheoMucDo)
  const tongMucDo = mucDo.reduce((s, x) => s + x.n, 0)
  const soEmChon = coDanhSach ? sbdChon.length : soEm
  const now = nowMs ?? Date.now()
  // Dự kiến: em ở giữa lớp làm đủ lượt cần sau ⌈khối lượng / lượt mỗi ngày⌉ ngày (tính cả hôm nay).
  // Rải đều BẬT (phản biện PR 108): câu mới chia tới ngày D − 3 ⇒ em không thể xong sớm hơn ngày ấy (chiến dịch > 3 ngày, còn câu mới).
  const ngayRaiDeu = sc && raiDeu && sc.D > NGAY_ON_CUOI && (sc.tachGiua?.cauMoi ?? 1) > 0 ? sc.D - NGAY_ON_CUOI : 0
  const soNgayCan = sc && theLuc > 0 ? Math.max(1, Math.ceil(sc.khoiLuongTrungVi / theLuc), ngayRaiDeu) : 0
  const ngayXong = soNgayCan ? congNgay(batDau > homNay ? batDau : homNay, soNgayCan - 1) : ''
  const tenTo = to.filter((t) => chon.has(t.maDe)).map((t) => (t.tuCa ? `Đề vừa kiểm tra · ${t.maDe}` : t.maDe))

  return (
    <section className="cd-the cd-giao" data-khoi="giao-chien-dich" aria-labelledby="cd-giao-tieu-de">
      <div className="cd-giao-dau">
        <span className="cd-nhan-buoc">{maCa ? 'BƯỚC TIẾP THEO' : 'CHIẾN DỊCH MỚI'}</span>
        <h2 id="cd-giao-tieu-de">Giao chiến dịch luyện{ten.trim() ? `: ${ten.trim()}` : ''}</h2>
      </div>

      <div className="cd-giao-luoi">
        <div className="cd-giao-chinh">
          <div className="cd-giao-hai">
            {/* ---- BƯỚC 1: tờ đề ---- */}
            <section className="cd-buoc" aria-labelledby="cd-buoc-1" data-buoc="1">
              <div className="cd-buoc-dau">
                <span className={`cd-so-buoc${maDeChon.length ? ' cd-so-buoc--xong' : ''}`} aria-hidden="true">
                  1
                </span>
                <h3 id="cd-buoc-1">Chọn tờ đề</h3>
                <span className={`cd-chip-muc cd-chip-muc--${maDeChon.length ? 'xanh' : 'xam'}`}>{maDeChon.length ? `Đã chọn ${maDeChon.length} tờ` : 'Chưa chọn'}</span>
              </div>
              <label className="cd-truong">
                Tên chiến dịch
                <input type="text" value={ten} maxLength={80} onChange={(e) => setTen(e.target.value)} />
              </label>
              <fieldset className="cd-truong cd-khung-tron">
                <legend className="cd-an-chu">Tờ đề đã chọn</legend>
                {to.length === 0 && <p className="cd-phu">Chưa có tờ đề nào — tích tờ trong Kho đề bên dưới.</p>}
                {to.map((t) => {
                  // Số câu DÙNG ĐƯỢC của tờ do máy chủ đếm (đã bỏ trùng, tự luận, chưa duyệt) ⇒ cộng các tờ = tổng bên dưới.
                  const n = sc?.soCauTheoTo?.[t.maDe]
                  return (
                    <label key={t.maDe} className="cd-tich">
                      <input type="checkbox" checked={chon.has(t.maDe)} onChange={() => doiTich(t.maDe)} />
                      <span>
                        {t.tuCa ? `Đề vừa kiểm tra · ${t.maDe}` : t.maDe}
                        {n !== undefined && chon.has(t.maDe) ? ` · ${n} câu` : ''}
                      </span>
                    </label>
                  )
                })}
                {tongCau && <small className="cd-so cd-phu">{tongCau} · đã bỏ câu tự luận và câu chưa duyệt</small>}
              </fieldset>
              <button type="button" className="m3-nut-chu cd-nut-nho cd-nut-trai" aria-expanded={moCay} onClick={() => setMoCay((x) => !x)}>
                {moCay ? 'Thu gọn Kho đề' : 'Thêm tờ từ Kho đề'}
              </button>
              {moCay &&
                (kho === null ? (
                  <p className="cd-phu">Đang đọc Kho đề trên máy này…</p>
                ) : kho.length === 0 ? (
                  <p className="cd-phu">Máy này chưa có Kho đề — vào Kho đề để đồng bộ trước.</p>
                ) : (
                  <HopChonDe ds={kho} daChon={chon} chonNhieu cao={260} onChon={tichTuCay} onChonTatCa={datChonTuCay} theoMucDich />
                ))}
              {tongMucDo > 0 && (
                <div className="cd-co-cau" data-khoi="co-cau-muc-do">
                  <span className="cd-nhan-nhom">Cơ cấu {tongMucDo} câu theo mức độ</span>
                  <div className="cd-thanh-chong" aria-hidden="true">
                    {mucDo.map((m, i) => (
                      <div key={m.ten} className={`cd-muc-${Math.min(i, 3)}`} style={{ width: `${(100 * m.n) / tongMucDo}%` }} />
                    ))}
                  </div>
                  <ul className="cd-ds-muc">
                    {mucDo.map((m, i) => (
                      <li key={m.ten}>
                        <span className={`cd-cham cd-muc-${Math.min(i, 3)}`} aria-hidden="true" />
                        <span>{m.ten}</span>
                        <b className="cd-so">{m.n} câu</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* ---- BƯỚC 2: em ---- */}
            <section className="cd-buoc" aria-labelledby="cd-buoc-2" data-buoc="2">
              <div className="cd-buoc-dau">
                <span className={`cd-so-buoc${soEmChon ? ' cd-so-buoc--xong' : ''}`} aria-hidden="true">
                  2
                </span>
                <h3 id="cd-buoc-2">Chọn em nhận chiến dịch</h3>
                {coDanhSach && (
                  <span className={`cd-chip-muc cd-chip-muc--${sbdChon.length ? 'xanh' : 'xam'} cd-so`}>
                    {sbdChon.length} / {dsEm.length} em
                  </span>
                )}
              </div>
              {coDanhSach ? (
                <ChonEmGiao ds={dsEm} chon={chonEm} onDoi={setChonEm} />
              ) : (
                <label className="cd-truong">
                  Giao cho lớp
                  <input type="text" list="cd-ds-lop" value={lop} placeholder="Ví dụ 12A1" onChange={(e) => setLop(e.target.value)} />
                  <small className="cd-so">{sc ? `Lớp ${lop.trim()} · ${sc.soEm} em` : lop.trim() ? `Lớp ${lop.trim()}` : 'Chưa có danh sách em — gõ tên lớp để giao'}</small>
                  <datalist id="cd-ds-lop">
                    {dsLop.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </label>
              )}
            </section>
          </div>

          {/* ---- BƯỚC 3: hạn nộp + số lượt câu mỗi ngày ---- */}
          <section className="cd-buoc" aria-labelledby="cd-buoc-3" data-buoc="3">
            <div className="cd-buoc-dau">
              <span className={`cd-so-buoc${sc ? ' cd-so-buoc--xong' : ''}`} aria-hidden="true">
                3
              </span>
              <h3 id="cd-buoc-3">Hạn nộp và số lượt câu mỗi ngày</h3>
            </div>
            <div className="cd-giao-ba">
              <div className="cd-hai-ngay">
                <label className="cd-truong" data-khoi="ngay-bat-dau">
                  Ngày bắt đầu
                  <input type="date" value={batDau} min={homNay} max={hanHopLe ? hanNop : undefined} onChange={(e) => setBatDau(e.target.value)} />
                  <small className="cd-so cd-phu">
                    {loiBatDau || (batDau === homNay ? 'Hôm nay — em nhận câu ngay' : `${hienNgay(batDau)} — trước ngày này em chưa nhận câu`)}
                  </small>
                </label>
                <label className="cd-truong">
                  Hạn nộp (hết lúc 23:59)
                  <input type="date" value={hanNop} min={homNay} onChange={(e) => setHanNop(e.target.value)} />
                  <small className="cd-so cd-phu">{hanHopLe ? hienHanNop(hanNop) : 'Hạn nộp phải từ hôm nay trở đi'}</small>
                </label>
              </div>
              <div className="cd-truong">
                <label htmlFor="cd-the-luc">Số lượt câu mỗi ngày (một em)</label>
                <div className="cd-hang-o">
                  <input
                    id="cd-the-luc"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={THE_LUC_TOI_DA}
                    value={theLucChu}
                    disabled={tuDong}
                    onChange={(e) => {
                      setTheLucChu(e.target.value)
                      const n = Math.floor(Number(e.target.value))
                      if (Number.isFinite(n) && n >= 1) setTheLuc(Math.min(THE_LUC_TOI_DA, n))
                    }}
                  />
                  <label className="cd-tich cd-gat">
                    <input type="checkbox" role="switch" checked={tuDong} onChange={(e) => setTuDong(e.target.checked)} />
                    <span>Tự tính</span>
                  </label>
                </div>
                <small className="cd-so cd-phu">
                  {tuDong
                    ? sc?.theLucDeXuat
                      ? `App đề xuất ${sc.theLucDeXuat} lượt/ngày — số nhỏ nhất để em ở giữa lớp ≤ 70% và không em nào quá tải`
                      : 'App tính số nhỏ nhất đủ để cả lớp kịp hạn nộp'
                    : 'Gõ số bất kì; gạt Tự tính để app tính'}
                </small>
                <label className="cd-tich">
                  <input type="checkbox" checked={huyetChien} onChange={(e) => setHuyetChien(e.target.checked)} />
                  <span>Em chậm nhịp được làm tới {2 * theLuc} lượt/ngày (Quá tải hôm nay · tự tính gấp đôi)</span>
                </label>
                <label className="cd-tich">
                  <input type="checkbox" role="switch" aria-checked={raiDeu} checked={raiDeu} onChange={(e) => setRaiDeu(e.target.checked)} />
                  <span>Rải đều câu mới</span>
                </label>
                <small className="cd-phu">Câu mới chia đều theo số ngày (trừ 3 ngày cuối để ôn); lượt dư trong ngày dùng để ôn. Tắt thì đổ câu mới cho đủ số lượt mỗi ngày.</small>
              </div>
              <DongHoSucChua sc={sc} dangTinh={dangTinh} loi={loiTinh} theLuc={theLuc} onTinhLai={() => setLanTinh((x) => x + 1)} />
            </div>
          </section>
        </div>

        {/* ---- TÓM TẮT cố định ---- */}
        <aside className="cd-tom-tat" aria-labelledby="cd-tom-tat" data-khoi="tom-tat-giao">
          <h3 id="cd-tom-tat">Tóm tắt chiến dịch</h3>
          <dl className="cd-dl">
            <div>
              <dt>Tờ đề</dt>
              <dd>{tenTo.length ? tenTo.join(', ') : 'Chưa chọn'}</dd>
            </div>
            <div>
              <dt>Số câu</dt>
              <dd className="cd-so">{sc ? `${sc.soCau} câu` : '—'}</dd>
            </div>
            {tongMucDo > 0 && (
              <div>
                <dt>Mức độ</dt>
                <dd className="cd-so">{mucDo.map((m) => `${m.ten} ${m.n}`).join(' · ')}</dd>
              </div>
            )}
            <div>
              <dt>Giao cho</dt>
              <dd className="cd-so">{soEmChon || nhanLop ? `${soEmChon} em${nhanLop ? ` · ${nhanLop}` : ''}` : 'Chưa chọn'}</dd>
            </div>
            <div>
              <dt>Bắt đầu</dt>
              <dd className="cd-so">{batDauHopLe ? (batDau === homNay ? 'Hôm nay' : hienNgay(batDau)) : '—'}</dd>
            </div>
            <div>
              <dt>Hạn nộp</dt>
              <dd className="cd-so">
                {hanHopLe ? hienHanNop(hanNop) : '—'}
                {hanHopLe && <small>{conLai(hanNop, now)}</small>}
              </dd>
            </div>
            <div>
              <dt>Lượt câu mỗi ngày</dt>
              <dd className="cd-so">
                {theLuc} lượt{tuDong ? ' (tự tính)' : ''}
              </dd>
            </div>
            <div>
              <dt>Khối lượng</dt>
              <dd>{sc ? <span className={`cd-chip-muc cd-chip-muc--${sc.muc} cd-so`}>{`${phanTram(sc.tiLe)} · ${CHU_MUC[sc.muc]}`}</span> : '—'}</dd>
            </div>
            <div>
              <dt>Dự kiến</dt>
              <dd className="cd-so">
                {!sc
                  ? '—'
                  : soNgayCan <= sc.D && ngayRaiDeu && soNgayCan === ngayRaiDeu
                    ? `Rải đều: em ở giữa lớp làm hết câu mới trước 23:59 · ${hienNgay(ngayXong, false)}, 3 ngày cuối để ôn`
                    : soNgayCan <= sc.D
                    ? `Em ở giữa lớp làm đủ lượt trước 23:59 · ${hienNgay(ngayXong, false)}`
                    : `Em ở giữa lớp cần ${soNgayCan} ngày, còn ${sc.D} ngày — chưa kịp hạn`}
              </dd>
            </div>
            <div>
              <dt>Em dự kiến quá tải</dt>
              <dd className="cd-so">{sc ? `${sc.soEmQuaTai} / ${sc.soEm} em` : '—'}</dd>
            </div>
          </dl>
          {loiGiao && (
            <p className="cd-loi" role="alert">
              {loiGiao}
            </p>
          )}
          <div className="cd-tom-tat-nut">
            <button type="button" className="m3-nut-chinh" disabled={!duDauVao || !sc || dangTinh || dangGiao} onClick={() => void giao()}>
              {dangGiao ? 'Đang giao…' : `Giao chiến dịch cho ${soEm} em`}
            </button>
            {onDeSau && (
              <button type="button" className="m3-nut-vien" onClick={onDeSau}>
                Để sau
              </button>
            )}
            <p className="cd-phu">Các em thấy chiến dịch trong game ngay khi giao. Huỷ được ngay sau khi giao nếu nhầm.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

/** Mức độ xếp theo thứ tự quen (Nhận biết → Vận dụng cao), mức lạ đứng sau. */
const THU_TU_MUC = ['nhận biết', 'nb', 'thông hiểu', 'th', 'vận dụng', 'vd', 'vận dụng cao', 'vdc']
function thuTuMucDo(m: Record<string, number> | undefined): { ten: string; n: number }[] {
  if (!m) return []
  const vi = (t: string) => {
    const i = THU_TU_MUC.indexOf(t.trim().toLowerCase())
    return i < 0 ? 99 : i
  }
  return Object.entries(m)
    .filter(([, n]) => n > 0)
    .map(([ten, n]) => ({ ten, n }))
    .sort((a, b) => vi(a.ten) - vi(b.ten) || a.ten.localeCompare(b.ten, 'vi'))
}
