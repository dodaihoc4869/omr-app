// HAI BẢN CHIẾU ĐIỂM DANH (bản vẽ thầy duyệt 12/10: Main = đang điểm danh · ChieuNhipLop = điểm danh xong, thống kê lớp · ChieuHoSoEm = bấm em ⇒ hồ sơ).
// Màn React TOÀN MÀN trong app thầy (portal vào body, không phải HTML chuỗi trong iframe) để bấm tên em mở CHÍNH tấm `HoSoLamCauEm` của app.
//   A · ĐANG ĐIỂM DANH: trái mã buổi rất to + QR; phải lưới tên em đã điểm danh tô theo nhóm + "đủ mức x/y ngày", em vừa vào viền vàng; số có mặt;
//       chú giải luật ở chân. Danh sách tự làm mới 5 giây — nhịp của `useDiemDanhBuoi` (bản chiếu đọc thẳng `tt`).
//   B · NHỊP HỌC CỦA LỚP: thanh Chăm / Chưa đều / Lười / Mới của cả lớp; ba cột tên (Chăm số ngày đủ giảm dần · Lười tăng dần kèm "bỏ N ngày liền");
//       em vắng làm mờ + chữ "vắng"; chân: hôm qua cả lớp đủ mức x/y · hôm nay đã có z em đủ mức.
// 13/10 (thầy: "Hiện bậc trên màn chiếu luôn nhé"): máy chủ có bậc ⇒ mỗi ô em (A) / dòng em (B) có chip bậc nhỏ (biểu tượng + số bậc, màu riêng
//   từng bậc) + một dải chú giải 12 bậc (12 ô màu, biểu tượng, số em mỗi bậc; B kèm tên bậc). Em chưa có bậc ⇒ không chip; không em nào có ⇒ không dải.
// Phím: Esc đóng · → (A ⇒ B, B ⇒ sang Gọi lên bảng đầu giờ) · ← (B ⇒ A) · H (B: ẩn / hiện tên nhóm Lười, mặc định HIỆN). Tấm hồ sơ đang mở ⇒ bản chiếu
// không nghe phím (Esc của tấm chỉ đóng tấm). Cỡ theo khổ: mọi số đo tính bằng --u = 1/1920 chiều ngang (hoặc 1/1080 chiều cao) của khung
// `.ca-chieu.cm.km` sẵn có (chieu-ma-kiem-tra.css) — cùng bộ màu tờ chiếu mã: nền --km-*, nhóm pha từ biến sẵn có (ban-chieu-diem-danh.css).
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, RefreshCw, X } from 'lucide-react'
import { linkDiemDanh, type TrangThaiBuoi } from '../../lib/buoi-hoc-api'
import { dinhDangMa } from '../../lib/them-phut-api'
import { duongQr, taoQr } from '../../lib/ma-qr'
import { LUAT_NHOM_NHIP, nguongNgay } from '../../lib/nhip-hoc-thay'
import {
  chuNutEm,
  cotNhipLop,
  gioDd,
  homQuaHomNay,
  khoaNhom,
  khoangNhip,
  luoiDiemDanh,
  NGAY_LIEN_THOAT_LUOI,
  ngayNganDd,
  phanTramDd,
  soNgayBo,
  soNhom,
  TEN_NHOM,
  type CheDoChieu,
  type EmBuoi,
  type KhoaNhom,
  type ThongKeBuoi,
  type TrangThaiNhip,
} from '../../lib/diem-danh-nhip'
import { chuBuoi } from '../chien-dich/buoi-day-ui'
import { demTheoBac } from '../../lib/nhip-hoc-thay'
import ChipBac from '../bac-cham-chi/ChipBac'
import DaiDemBac from '../bac-cham-chi/DaiDemBac'
import { chuBacSo } from '../bac-cham-chi/bac'
import '../chieu-ma.css'
import '../chieu-ma-kiem-tra.css'
import './ban-chieu-diem-danh.css'

/** Số cột lưới tên của bản chiếu A theo số em (ô cao tối đa 86/1080 khung; nhiều em ⇒ thêm cột, ô thấp lại). */
export function soCotLuoi(n: number): number {
  return n <= 40 ? 5 : n <= 54 ? 6 : 7
}
/** Mỗi cột bản chiếu B chứa tối đa ngần này dòng trước khi tách đôi: dòng cao max(46/1080 khung, 44 px) — vừa khung 1920×1080 là 12 dòng,
 *  1280×720 là 8 dòng. Quá hai cột con ⇒ cột tự cuộn (không tràn). Thuần. */
export function dongMotCot(rong: number, cao: number): number {
  const u = Math.min(rong / 1920, cao / 1080)
  return Math.max(4, Math.floor((640 * u) / (Math.max(46 * u, 44) + 6 * u)))
}
function useDongMotCot(): number {
  const tinh = () => (typeof window === 'undefined' ? 12 : dongMotCot(window.innerWidth || 1920, window.innerHeight || 1080))
  const [n, setN] = useState(tinh)
  useEffect(() => {
    const doi = () => setN(tinh())
    window.addEventListener('resize', doi)
    return () => window.removeEventListener('resize', doi)
  }, [])
  return n
}

export interface PropsBanChieu {
  cheDo: CheDoChieu
  tt: TrangThaiBuoi
  tk: ThongKeBuoi
  nhip: TrangThaiNhip
  goc: string
  matKetNoi: boolean
  /** Tấm hồ sơ đang mở trên bản chiếu ⇒ không nghe phím. */
  hoSoMo: boolean
  onDoiCheDo: (c: CheDoChieu) => void
  onDong: () => void
  onMoEm: (e: EmBuoi, nut: HTMLElement | null) => void
  onThuLaiNhip: () => void
  /** Có ⇒ nút / phím → trên bản chiếu B sang bước Gọi lên bảng đầu giờ. */
  onSangDauGio?: () => void
}

export default function BanChieuDiemDanh(p: PropsBanChieu) {
  const { cheDo, tt, hoSoMo, onDong, onDoiCheDo, onSangDauGio } = p
  const nutDong = useRef<HTMLButtonElement>(null)
  const [anLuoi, setAnLuoi] = useState(false)
  const hoSoRef = useRef(hoSoMo)
  hoSoRef.current = hoSoMo

  // Mở ⇒ focus nút Đóng; đóng ⇒ focus về chỗ cũ.
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    return () => truoc?.focus?.()
  }, [])
  useEffect(() => {
    const phim = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented || hoSoRef.current || ev.altKey || ev.ctrlKey || ev.metaKey) return
      if (ev.key === 'Escape') {
        ev.preventDefault()
        onDong()
        return
      }
      const dich = ev.target as HTMLElement | null
      if (dich && (dich.tagName === 'INPUT' || dich.tagName === 'TEXTAREA' || dich.tagName === 'SELECT' || dich.isContentEditable)) return
      if (cheDo === 'nhip-lop' && (ev.key === 'h' || ev.key === 'H')) {
        ev.preventDefault()
        setAnLuoi((v) => !v)
      } else if (ev.key === 'ArrowRight') {
        if (cheDo === 'diem-danh') {
          ev.preventDefault()
          onDoiCheDo('nhip-lop')
        } else if (onSangDauGio) {
          ev.preventDefault()
          onSangDauGio()
        }
      } else if (ev.key === 'ArrowLeft' && cheDo === 'nhip-lop') {
        ev.preventDefault()
        onDoiCheDo('diem-danh')
      }
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [cheDo, onDong, onDoiCheDo, onSangDauGio])

  const nutDongJsx = (
    <button ref={nutDong} type="button" className="ddc-dong" onClick={onDong}>
      <X size={22} aria-hidden="true" /> Đóng <small>(Esc)</small>
    </button>
  )
  return createPortal(
    <div className="ca-chieu cm km ddc" role="dialog" aria-modal="true" aria-label={cheDo === 'diem-danh' ? 'Bản chiếu điểm danh' : `Bản chiếu nhịp học của lớp ${tt.buoi.lop}`} data-che-do={cheDo}>
      {cheDo === 'diem-danh' ? <ChieuDiemDanh {...p} nutDong={nutDongJsx} /> : <ChieuNhipLop {...p} nutDong={nutDongJsx} anLuoi={anLuoi} onDoiAn={() => setAnLuoi((v) => !v)} />}
    </div>,
    document.body,
  )
}

/** Câu đọc màn hình của nút em, kèm bậc khi có. */
const nhanEm = (e: EmBuoi): string => chuNutEm(e, e.bacCham ? chuBacSo(e.bacCham.bac) : undefined)

/** Dải chú giải 12 bậc (số em mỗi bậc của `ds`); không em nào có bậc ⇒ không vẽ. */
function DaiBacChieu({ ds, coTen = false }: { ds: readonly EmBuoi[]; coTen?: boolean }) {
  const dem = useMemo(() => demTheoBac(ds), [ds])
  return dem.some((n) => n > 0) ? (
    <div className="ddc-bac" role="group" aria-label="12 bậc từ Lười đến Chăm">
      <DaiDemBac dem={dem} coTen={coTen} />
    </div>
  ) : null
}

function MatKetNoi({ mat }: { mat: boolean }) {
  return mat ? (
    <span className="ddc-mat" role="status" title="Mất kết nối — đang thử lại, danh sách giữ như lần đọc cuối">
      <i aria-hidden="true" /> mất kết nối
    </span>
  ) : null
}

/** Em vừa vào: em mới xuất hiện so với lần làm mới trước; lần đầu mở = em điểm danh muộn nhất. Không có em mới ⇒ giữ viền cũ. */
function useEmVuaVao(coMat: readonly EmBuoi[]): Set<string> {
  const daThay = useRef<Set<string> | null>(null)
  const [vua, setVua] = useState<Set<string>>(new Set())
  const khoa = coMat.map((e) => e.sbd).join('|')
  useEffect(() => {
    const ds = khoa ? khoa.split('|') : []
    const cu = daThay.current
    if (!cu) {
      const muon = [...coMat].sort((a, b) => (b.luc ?? '').localeCompare(a.luc ?? ''))[0]
      if (muon) setVua(new Set([muon.sbd]))
    } else {
      const moi = ds.filter((s) => !cu.has(s))
      if (moi.length) setVua(new Set(moi))
    }
    daThay.current = new Set(ds)
    // chỉ chạy khi TẬP SBD có mặt đổi (khoá chuỗi), không chạy lại mỗi lần làm mới trả cùng danh sách
  }, [khoa])
  return vua
}

function ChieuDiemDanh({ tt, tk, nhip, goc, matKetNoi, onMoEm, onDoiCheDo, onThuLaiNhip, nutDong }: PropsBanChieu & { nutDong: React.ReactNode }) {
  const ma = tt.ma ?? ''
  const xong = !tt.buoi.dangMo
  const ve = useMemo(() => {
    if (!ma || xong) return null
    const q = taoQr(linkDiemDanh(goc, ma))
    return q ? duongQr(q) : null
  }, [ma, goc, xong])
  const luoi = useMemo(() => luoiDiemDanh(tk.coMat), [tk.coMat])
  const vua = useEmVuaVao(tk.coMat)
  const siSo = tt.siSo
  const soCoMat = tk.coMat.length
  const cot = soCotLuoi(luoi.length)
  const hang = Math.max(1, Math.ceil(luoi.length / cot))
  const coNhip = !!nhip.kq
  const dem = tk.demCoMat
  const conLai = siSo ? Math.max(0, siSo - soCoMat) : null
  const tu = nhip.kq ? ngayNganDd(nhip.kq.tu) : ''
  const L = LUAT_NHOM_NHIP
  const diaChi = `${(goc || '').replace(/^https?:\/\//, '')}/hs`
  return (
    <>
      <header className="ddc-dau">
        <div className="ddc-dau-trai">
          <span className="ddc-nhan">ĐIỂM DANH ĐẦU GIỜ</span>
          <b className="ddc-ten-buoi">{chuBuoi(tt.buoi)}</b>
          <MatKetNoi mat={matKetNoi} />
        </div>
        <div className="ddc-dau-phai">
          <span className="ddc-nhan-so">Có mặt</span>
          <b className="ddc-so-lon" role="status" aria-label={`Có mặt ${soCoMat}${siSo ? ` trên ${siSo}` : ''} em`}>
            {soCoMat}
            {siSo ? <small>/{siSo}</small> : <small> em</small>}
          </b>
          {siSo ? (
            <span className="ddc-vach" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (100 * soCoMat) / siSo)}%` }} />
            </span>
          ) : null}
          {nutDong}
        </div>
      </header>

      <div className="ddc-than-a">
        <section className="ddc-ma-khung" aria-label="Mã điểm danh">
          <span className="ddc-ma-huong">Mở app học sinh › Điểm danh</span>
          <span className="ddc-ma-nho">Gõ mã buổi</span>
          <b className="ddc-ma" aria-label={`Mã điểm danh ${ma}`} aria-live="polite">
            {xong ? '— — —' : ma ? dinhDangMa(ma) : '……'}
          </b>
          <span className="ddc-ma-nho">{xong ? 'Buổi đã kết thúc — mã hết hiệu lực' : 'Mã đổi mỗi phút · em chỉ điểm danh được cho chính mình'}</span>
          {ve && (
            <>
              <span className="ddc-ma-nho">hoặc quét mã</span>
              <svg className="ddc-qr" viewBox={`0 0 ${ve.canh} ${ve.canh}`} role="img" aria-label="Mã QR điểm danh" shapeRendering="crispEdges">
                <rect width={ve.canh} height={ve.canh} className="ddc-qr-nen" />
                <path d={ve.d} className="ddc-qr-o" />
              </svg>
            </>
          )}
          <p className="ddc-ma-ghi">
            Em vào là tên hiện bên phải{tu ? `, kèm nhịp học của em từ ${tu}` : ''}. App học sinh: <b>{diaChi}</b>
          </p>
        </section>

        <section className="ddc-ds-khung" aria-label="Em đã điểm danh">
          <div className="ddc-ds-dau">
            <h2 className="ddc-h2">
              Đã điểm danh · {soCoMat} em
              {conLai !== null && conLai > 0 && <small> · còn {conLai} em chưa điểm danh</small>}
            </h2>
            {coNhip && (
              <div className="ddc-chip-ds">
                {(['cham', 'chua-deu', 'luoi', 'moi'] as const).map((k) => (
                  <span key={k} className="ddc-chip" data-nhom={k}>
                    {TEN_NHOM[k]} {soNhom(dem, k)}
                  </span>
                ))}
                {dem.chuaCo > 0 && (
                  <span className="ddc-chip" data-nhom="chua-co">
                    Chưa có số {dem.chuaCo}
                  </span>
                )}
              </div>
            )}
          </div>
          {coNhip && <DaiBacChieu ds={tk.coMat} />}
          {soCoMat === 0 ? (
            <p className="ddc-rong">Chưa em nào điểm danh. Màn tự cập nhật mỗi 5 giây.</p>
          ) : (
            <ul className="ddc-luoi" style={{ '--cot': cot, '--hang': hang } as React.CSSProperties} aria-label="Bấm tên em để mở hồ sơ làm bài">
              {luoi.map((e) => {
                const k = khoaNhom(e)
                return (
                  <li key={e.sbd} className="ddc-luoi-o">
                    <button type="button" className="ddc-em" data-nhom={k} data-moi={vua.has(e.sbd) ? '' : undefined} onClick={(ev) => onMoEm(e, ev.currentTarget)} aria-label={nhanEm(e)}>
                      {/* có bậc ⇒ chip bậc (biểu tượng trên, số bậc dưới) đứng ĐÚNG chỗ chấm nhóm — nền ô vẫn tô theo nhóm; tên giữ gần đủ bề ngang */}
                      {e.bacCham ? <ChipBac bac={e.bacCham.bac} nho /> : <span className="ddc-cham" aria-hidden="true" />}
                      <span className="ddc-em-chu">
                        <b>{e.hoTen || `SBD ${e.sbd}`}</b>
                        <span>{!e.nhip ? `điểm danh ${gioDd(e.luc)}` : k === 'moi' ? 'mới vào lớp' : `đủ mức ${e.nhip.soNgayDu}/${e.nhip.soNgayQua} ngày`}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {!coNhip && <NhipChuaCo nhip={nhip} onThuLai={onThuLaiNhip} />}
        </section>
      </div>

      <footer className="ddc-chan">
        <span className="ddc-chu-giai" data-nhom="cham">
          <i aria-hidden="true" />
          Chăm: đủ mức ≥ {L.chamTu}% số ngày
        </span>
        <span className="ddc-chu-giai" data-nhom="chua-deu">
          <i aria-hidden="true" />
          Chưa đều: ở giữa
        </span>
        <span className="ddc-chu-giai" data-nhom="luoi">
          <i aria-hidden="true" />
          Lười: ≤ {L.luoiDen}% hoặc bỏ {L.ngayLienKhongLam} ngày liền · thoát khi đủ mức {NGAY_LIEN_THOAT_LUOI} ngày liền
        </span>
        <span className="ddc-chu-giai" data-nhom="moi">
          <i aria-hidden="true" />
          Mới: chưa đủ {L.soNgayToiThieu} ngày
        </span>
        <button type="button" className="ddc-nut ddc-nut--chinh" onClick={() => onDoiCheDo('nhip-lop')}>
          Chiếu Nhịp học của lớp <ArrowRight size={20} aria-hidden="true" />
        </button>
      </footer>
    </>
  )
}

function NhipChuaCo({ nhip, onThuLai }: { nhip: TrangThaiNhip; onThuLai?: () => void }) {
  if (nhip.kq) return null
  return nhip.loi ? (
    <p className="ddc-rong ddc-rong--nho" role="status">
      Chưa có nhóm Chăm / Lười: {nhip.loi}
      {onThuLai && (
        <button type="button" className="ddc-nut" onClick={onThuLai} disabled={nhip.dangTai}>
          <RefreshCw size={18} aria-hidden="true" /> Thử lại
        </button>
      )}
    </p>
  ) : (
    <p className="ddc-rong ddc-rong--nho" aria-busy="true">
      Đang tải nhịp học của lớp…
    </p>
  )
}

const TIEU_DE_COT: Record<'cham' | 'chua-deu' | 'luoi', string> = { cham: 'Chăm · đáng khen', 'chua-deu': 'Chưa đều', luoi: 'Lười · cần cố gắng' }

function ChieuNhipLop({ tt, tk, nhip, matKetNoi, onMoEm, onDoiCheDo, onSangDauGio, onThuLaiNhip, nutDong, anLuoi, onDoiAn }: PropsBanChieu & { nutDong: React.ReactNode; anLuoi: boolean; onDoiAn: () => void }) {
  const kq = nhip.kq
  const k = khoangNhip(kq)
  const dongVua = useDongMotCot()
  const cot = useMemo(() => cotNhipLop(tk.ds), [tk.ds])
  const hn = useMemo(() => homQuaHomNay(tk.ds, kq), [tk.ds, kq])
  const dl = tk.demLop
  const tong = dl.tong
  const n = k?.soNgayQua ?? 0
  const g = nguongNgay(n)
  const lop = tt.buoi.lop.trim() || 'mọi lớp'
  const soVang = tk.vang.length
  const khac = dl.moi + dl.chuaCo
  const doan: { k: KhoaNhom | 'khac'; so: number; chu: string }[] = [
    { k: 'cham', so: dl.cham, chu: `Chăm ${dl.cham} em · ${phanTramDd(dl.cham, tong)}%` },
    { k: 'chua-deu', so: dl.chuaDeu, chu: `Chưa đều ${dl.chuaDeu} · ${phanTramDd(dl.chuaDeu, tong)}%` },
    { k: 'luoi', so: dl.luoi, chu: `Lười ${dl.luoi} em · ${phanTramDd(dl.luoi, tong)}%` },
    { k: 'khac', so: khac, chu: `Mới ${khac}` },
  ]
  const dieuKien: Record<'cham' | 'chua-deu' | 'luoi', string> =
    n >= LUAT_NHOM_NHIP.soNgayToiThieu
      ? { cham: `đủ mức ≥ ${g.cham}/${n} ngày`, 'chua-deu': `đủ mức ${g.luoi + 1}–${g.cham - 1}/${n} ngày`, luoi: `thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền` }
      : { cham: `đủ mức ≥ ${LUAT_NHOM_NHIP.chamTu}% số ngày`, 'chua-deu': 'ở giữa', luoi: `thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền` }

  const cotJsx = (khoa: 'cham' | 'chua-deu' | 'luoi', ds: EmBuoi[]) => {
    const soCot = ds.length > dongVua ? 2 : 1
    const soHang = Math.max(1, Math.ceil(ds.length / soCot))
    const an = khoa === 'luoi' && anLuoi
    return (
      <section key={khoa} className="ddc-cot" data-nhom={khoa} aria-labelledby={`ddc-cot-${khoa}`}>
        <div className="ddc-cot-dau">
          <h2 id={`ddc-cot-${khoa}`} className="ddc-cot-ten">
            {TIEU_DE_COT[khoa]} <span className="ddc-cot-so">· {ds.length} em</span>
          </h2>
          <span className="ddc-cot-dk">{dieuKien[khoa]}</span>
        </div>
        {an ? (
          <p className="ddc-an" data-khoi="luoi-da-an">
            Đã ẩn tên {ds.length} em — bấm <kbd>H</kbd> để hiện
          </p>
        ) : ds.length === 0 ? (
          <p className="ddc-an">Chưa có em nào.</p>
        ) : (
          <ul className="ddc-cot-ds" data-hai-cot={soCot === 2 ? '' : undefined} style={{ '--cot': soCot, '--hang': soHang } as React.CSSProperties}>
            {ds.map((e) => {
              const bo = khoa === 'luoi' ? soNgayBo(e.nhip) : 0
              const so = `${e.nhip?.soNgayDu ?? 0}/${e.nhip?.soNgayQua ?? 0}`
              return (
                <li key={e.sbd}>
                  <button type="button" className="ddc-dong-em" data-vang={e.coMat ? undefined : ''} onClick={(ev) => onMoEm(e, ev.currentTarget)} aria-label={nhanEm(e) + (bo ? `, bỏ ${bo} ngày liền` : '')}>
                    {e.bacCham && <ChipBac bac={e.bacCham.bac} nho />}
                    <span className="ddc-dong-ten">{e.hoTen || `SBD ${e.sbd}`}</span>
                    {!e.coMat && <small className="ddc-vang-chu">vắng</small>}
                    <b className="ddc-dong-so">
                      {so}
                      {bo ? <span> · bỏ {bo} ngày{soCot === 1 ? ' liền' : ''}</span> : null}
                    </b>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  return (
    <>
      <header className="ddc-dau">
        <div className="ddc-dau-trai">
          <span className="ddc-nhan">NHỊP HỌC {lop.toLocaleUpperCase('vi')}</span>
          <b className="ddc-ten-buoi">{k ? `Từ ${ngayNganDd(k.tu)}${k.homQua ? ` đến ${ngayNganDd(k.homQua)}` : ''} · ${n} ngày đã qua` : 'Nhịp học của lớp'}</b>
          <MatKetNoi mat={matKetNoi} />
        </div>
        <div className="ddc-dau-phai">
          <span className="ddc-nhan-so">
            Có mặt <b>{tk.coMat.length}</b>
            {tt.siSo ? `/${tt.siSo}` : ''}
            {tt.buoi.lop.trim() && tt.lopEm ? (
              <>
                {' '}
                · Vắng <b>{soVang}</b>
              </>
            ) : null}
          </span>
          {nutDong}
        </div>
      </header>

      {!kq ? (
        <div className="ddc-than-cho">
          {nhip.loi ? (
            <p className="ddc-rong" role="status">
              Chưa tải được nhịp học của lớp: {nhip.loi}
              <button type="button" className="ddc-nut" onClick={onThuLaiNhip} disabled={nhip.dangTai} aria-busy={nhip.dangTai}>
                <RefreshCw size={20} aria-hidden="true" /> Thử lại
              </button>
            </p>
          ) : (
            <p className="ddc-rong" aria-busy="true">
              Đang tải nhịp học của lớp…
            </p>
          )}
        </div>
      ) : tong === 0 || dl.chuaCo === tong ? (
        <div className="ddc-than-cho">
          <p className="ddc-rong">Chưa có số nhịp học của lớp này — các em chưa nhận bài hằng ngày (chưa có Hành trình khối hay Gói bài 7 ngày nào đang chạy).</p>
        </div>
      ) : (
        <>
          <div className="ddc-thanh-nhom" role="img" aria-label={doan.map((d) => (d.k === 'khac' ? `${d.so} em mới vào lớp hoặc chưa có số` : d.chu)).join(' · ')}>
            {doan.map((d) =>
              d.so > 0 ? (
                <span key={d.k} data-nhom={d.k} style={{ width: `${(100 * d.so) / tong}%` }} title={d.chu}>
                  {(100 * d.so) / tong >= 14 ? d.chu : d.so}
                </span>
              ) : null,
            )}
          </div>
          <DaiBacChieu ds={tk.ds} coTen />
          <div className="ddc-ba-cot">
            {cotJsx('cham', cot.cham)}
            {cotJsx('chua-deu', cot.chuaDeu)}
            {cotJsx('luoi', cot.luoi)}
          </div>
        </>
      )}

      <footer className="ddc-chan">
        <span className="ddc-chan-so">
          {hn.homQua ? (
            <>
              Hôm qua cả lớp <b>{hn.homQua.du}/{hn.homQua.tong}</b> em đủ mức
            </>
          ) : (
            'Chưa có số hôm qua'
          )}
          {hn.homNayDu !== null && (
            <>
              {' '}
              · hôm nay đã có <b>{hn.homNayDu}</b> em đủ mức
            </>
          )}
        </span>
        <span className="ddc-chan-goi-y">
          Bấm tên em ⇒ <b>hồ sơ làm bài</b>
        </span>
        <span className="ddc-chan-nut">
          <button type="button" className="ddc-nut" onClick={() => onDoiCheDo('diem-danh')}>
            <ArrowLeft size={20} aria-hidden="true" /> Điểm danh
          </button>
          <button type="button" className="ddc-nut" aria-pressed={anLuoi} onClick={onDoiAn}>
            {anLuoi ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
            <kbd>H</kbd> {anLuoi ? 'Hiện tên nhóm Lười' : 'Ẩn tên nhóm Lười'}
          </button>
          {onSangDauGio && (
            <button type="button" className="ddc-nut ddc-nut--chinh" onClick={onSangDauGio}>
              <kbd>→</kbd> Sang Gọi lên bảng đầu giờ
            </button>
          )}
        </span>
      </footer>
    </>
  )
}
