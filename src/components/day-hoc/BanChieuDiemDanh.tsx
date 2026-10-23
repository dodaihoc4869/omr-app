// HAI BẢN CHIẾU ĐIỂM DANH (bản vẽ thầy duyệt 12/10: Main = đang điểm danh · ChieuNhipLop = điểm danh xong, thống kê lớp · ChieuHoSoEm = bấm em ⇒ hồ sơ).
// Màn React TOÀN MÀN trong app thầy (portal vào body, không phải HTML chuỗi trong iframe) để bấm tên em mở CHÍNH tấm `HoSoLamCauEm` của app.
//   A · ĐANG ĐIỂM DANH — ĐỢT 19 (bản vẽ docs/ban-ve-dot19/man-chieu-diem-danh.html, thầy duyệt 13/10: "duyệt cả hai giữ xếp theo bậc"; yêu cầu gốc:
//       "đẹp hơn nữa, chi tiết hơn nữa, hiển thị được cấp bậc rõ ràng của từng học sinh, phải khiến cho học sinh wow"):
//       · trái: mã buổi 6 số + QR (giữ nguyên) · khối "Bậc cao nhất lớp" (huy hiệu có tia vàng, Điểm chăm · Chuỗi ngày · Ngày đủ mức, hai em theo sát);
//       · phải: thang 12 bậc vẽ thành bậc thềm (bậc cao bệ cao), số em có mặt mỗi bậc, chia nhóm Lười 1–5 · Chưa đều 6–7 · Chăm 8–12 + ô Mới;
//         dưới là lưới THẺ em XẾP THEO BẬC từ cao xuống (cùng bậc ⇒ điểm chăm cao trước): huy hiệu lớn + số bậc, tên, tên bậc tô màu bậc, Điểm chăm,
//         Chuỗi ngày (Lười: "Thoát Lười k/6"), Đủ mức x/y ngày, vạch điểm chăm ở đáy; em chưa xếp bậc có thẻ riêng (viền đứt, "Đã có số k/3 ngày");
//       · ba em vào muộn nhất: viền vàng + nhãn "Vừa vào"; em MỚI vào trong lượt làm mới: thẻ lớn nổi giữa màn ~4 giây ("Còn N điểm chăm nữa lên
//         Bậc …") rồi bay về chỗ của em trong lưới — chỉ transform/opacity, tắt chuyển động khi giảm chuyển động / máy yếu (`html.may-yeu`).
//       Máy chủ cũ không gửi bậc ⇒ thẻ tô theo nhóm như trước (chip đếm nhóm, chú giải nhóm), không bịa bậc. Phép thuần: ./chieu-bac.ts.
//       Danh sách tự làm mới 5 giây — nhịp của `useDiemDanhBuoi` (bản chiếu đọc thẳng `tt`). Không thêm lệnh máy chủ.
//   B · NHỊP HỌC CỦA LỚP: thanh Chăm / Chưa đều / Lười / Mới của cả lớp; ba cột tên (Chăm số ngày đủ giảm dần · Lười tăng dần kèm "bỏ N ngày liền");
//       em vắng làm mờ + chữ "vắng"; chân: hôm qua cả lớp đủ mức x/y · hôm nay đã có z em đủ mức.
// 13/10 (thầy: "Hiện bậc trên màn chiếu luôn nhé"): máy chủ có bậc ⇒ mỗi dòng em (B) có chip bậc nhỏ + một dải chú giải 12 bậc (số em mỗi bậc, tên bậc).
// Phím: Esc đóng · → (A ⇒ B, B ⇒ sang Gọi lên bảng đầu giờ) · ← (B ⇒ A) · H (B: ẩn / hiện tên nhóm Lười, mặc định HIỆN). Tấm hồ sơ đang mở ⇒ bản chiếu
// không nghe phím (Esc của tấm chỉ đóng tấm). Cỡ theo khổ: mọi số đo tính bằng --u = 1/1920 chiều ngang (hoặc 1/1080 chiều cao) của khung
// `.ca-chieu.cm.km` sẵn có (chieu-ma-kiem-tra.css) — cùng bộ màu tờ chiếu mã: nền --km-*, nhóm pha từ biến sẵn có, bậc = --bac (ban-chieu-diem-danh.css).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, CloudOff, Crown, Eye, EyeOff, Lightbulb, Pause, QrCode, RefreshCw, Sparkles, X, Zap } from 'lucide-react'
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
  TEN_NHOM,
  THU_TU_NHOM,
  type CheDoChieu,
  type EmBuoi,
  type KhoaNhom,
  type ThongKeBuoi,
  type TrangThaiNhip,
} from '../../lib/diem-danh-nhip'
import { chuBuoi } from '../chien-dich/buoi-day-ui'
import HuyHieuBac from '../bac-cham-chi/HuyHieuBac'
import { BAC_CHAM_CHI, chuBac, chuBacSo, motBac, SO_BAC } from '../bac-cham-chi/bac'
import { chuVuaVao, coBacBuoi, dauLop, demThang, emVuaVao, lenBac, soThe, type DemThang } from './chieu-bac'
import { cachEm, dsTreoMay, tongCachLop, type TongCachLop } from './chieu-treo'
import type { MucLamEm } from '../../lib/muc-lam-lo-api'
import { apDungGiaoDien, docGiaoDien } from '../../lib/giao-dien-thay'
import '../chieu-ma.css'
import '../chieu-ma-kiem-tra.css'
import './ban-chieu-diem-danh.css'
import './ban-chieu-sang.css'

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
  /** (23/10) Mức làm 14 ngày của em có mặt (`/gv/muc-lam-lo`, bảng điểm danh đã hỏi) — Cách cả lớp làm bài, cột Treo máy, dấu ⏸ trên thẻ. */
  mucLam?: ReadonlyMap<string, MucLamEm>
  mucLamDang?: boolean
  mucLamLoi?: string
}

export default function BanChieuDiemDanh(p: PropsBanChieu) {
  const { cheDo, tt, hoSoMo, onDong, onDoiCheDo, onSangDauGio } = p
  const nutDong = useRef<HTMLButtonElement>(null)
  const [anLuoi, setAnLuoi] = useState(false)
  const [mucTung, setMucTung] = useState(false)
  const hoSoRef = useRef(hoSoMo)
  hoSoRef.current = hoSoMo

  // NỀN SÁNG (thầy 23/10): màn chiếu luôn sáng kể cả khi app thầy đang để Tối / theo máy tối — ép bằng đúng đường của Cài đặt → Giao diện
  // (không lưu lựa chọn); đóng màn ⇒ trả lại lựa chọn của thầy.
  useEffect(() => {
    apDungGiaoDien('sang')
    return () => apDungGiaoDien(docGiaoDien())
  }, [])
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
      } else if (cheDo === 'nhip-lop' && (ev.key === 'm' || ev.key === 'M')) {
        ev.preventDefault()
        setMucTung((v) => !v)
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
    <button ref={nutDong} type="button" className="ddv-dong" onClick={onDong}>
      <X aria-hidden="true" /> Đóng <kbd>Esc</kbd>
    </button>
  )
  return createPortal(
    <div className="ca-chieu cm km ddc ddv" role="dialog" aria-modal="true" aria-label={cheDo === 'diem-danh' ? 'Bản chiếu điểm danh' : `Bản chiếu nhịp học của lớp ${tt.buoi.lop}`} data-che-do={cheDo}>
      {cheDo === 'diem-danh' ? <ChieuDiemDanh {...p} nutDong={nutDongJsx} /> : <ChieuNhipLop {...p} nutDong={nutDongJsx} anLuoi={anLuoi} onDoiAn={() => setAnLuoi((v) => !v)} mucTung={mucTung} onDoiMuc={() => setMucTung((v) => !v)} />}
    </div>,
    document.body,
  )
}

/** Câu đọc màn hình của nút em, kèm bậc + điểm chăm khi có. */
const nhanEm = (e: EmBuoi): string => chuNutEm(e, e.bacCham ? `${chuBacSo(e.bacCham.bac)}, điểm chăm ${e.bacCham.diem}` : undefined)

/** Huy hiệu "chưa xếp bậc" (vòng nét đứt + mầm cây) — em Mới / chưa có số nhịp học. Chỉ để nhìn. */
function HuyHieuMoi() {
  return (
    <svg className="ddc-hh-moi" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="25" strokeDasharray="5 5" />
      <path d="M32 46V32M32 34c-6 0-9-4-9-9 6 0 9 4 9 9zM32 31c0-5 3-9 9-9 0 6-3 9-9 9z" />
    </svg>
  )
}

// ------------------------------------------------------------------ THẺ NỔI "VỪA ĐIỂM DANH"
/** Thẻ nổi giữ giữa màn ngần này rồi bay về chỗ của em trong lưới (≤ 250 ms). */
export const GIU_THE_NOI_MS = 4000
const BAY_VE_MS = 250
const giamChuyenDong = (): boolean =>
  typeof window === 'undefined' || document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface TheNoi {
  sbd: string
  pha: 'vao' | 've'
  /** Pha 've': transform đưa thẻ nổi về đúng ô thẻ của em. */
  dich?: string
}
/**
 * Em MỚI xuất hiện trong danh sách có mặt (so lượt làm mới trước) ⇒ thẻ nổi của em có giờ điểm danh mới nhất. Lần đầu mở bản chiếu không nổi thẻ
 * (chỉ viền "Vừa vào"). Hết `GIU_THE_NOI_MS` ⇒ đo ô thẻ của em trong lưới, bay về (transform + opacity) rồi gỡ; giảm chuyển động / máy yếu ⇒ gỡ ngay.
 */
function useTheNoi(coMat: readonly EmBuoi[], luoi: RefObject<HTMLElement | null>, the: RefObject<HTMLElement | null>): TheNoi | null {
  const daThay = useRef<Set<string> | null>(null)
  const [noi, setNoi] = useState<TheNoi | null>(null)
  const khoa = coMat.map((e) => e.sbd).join('|')
  useEffect(() => {
    const cu = daThay.current
    daThay.current = new Set(coMat.map((e) => e.sbd))
    if (!cu) return
    const moi = coMat.filter((e) => !cu.has(e.sbd)).sort((a, b) => (b.luc ?? '').localeCompare(a.luc ?? ''))[0]
    if (moi) setNoi({ sbd: moi.sbd, pha: 'vao' })
    // chỉ chạy khi TẬP SBD có mặt đổi (khoá chuỗi), không chạy lại mỗi lần làm mới trả cùng danh sách
  }, [khoa])
  useEffect(() => {
    if (!noi) return
    if (noi.pha === 've') {
      const t = window.setTimeout(() => setNoi(null), BAY_VE_MS + 30)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      const a = the.current?.getBoundingClientRect()
      const o = [...(luoi.current?.querySelectorAll<HTMLElement>('[data-sbd]') ?? [])].find((x) => x.dataset.sbd === noi.sbd)
      const b = o?.getBoundingClientRect()
      if (giamChuyenDong() || !a || !b || !a.width || !b.width) return setNoi(null)
      const dx = Math.round(b.left + b.width / 2 - (a.left + a.width / 2))
      const dy = Math.round(b.top + b.height / 2 - (a.top + a.height / 2))
      setNoi({ ...noi, pha: 've', dich: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${(b.width / a.width).toFixed(3)})` })
    }, GIU_THE_NOI_MS)
    return () => window.clearTimeout(t)
  }, [noi, luoi, the])
  return noi
}

function TheNoiVua({ e, pha, dich, coBac, gocRef }: { e: EmBuoi; pha: TheNoi['pha']; dich?: string; coBac: boolean; gocRef: RefObject<HTMLDivElement | null> }) {
  const b = e.bacCham
  const m = b ? motBac(b.bac) : null
  const k = khoaNhom(e)
  const s = soThe(e)
  const len = lenBac(e)
  const ke = len?.ke ? motBac(len.ke) : null
  const gio = gioDd(e.luc)
  return (
    <div
      ref={gocRef}
      className={`ddc-noi${m ? ' bcc' : ''}`}
      data-bac={m?.so}
      data-nhom={k}
      data-pha={pha}
      style={dich ? { transform: dich } : undefined}
      role="status"
      aria-label={`${e.hoTen || `SBD ${e.sbd}`} ${chuVuaVao(e)}${m ? `, ${chuBac(m)}` : ''}`}
    >
      <span className="ddc-noi-hh" aria-hidden="true">
        {m ? <HuyHieuBac bac={m.so} co={190} /> : k === 'moi' || k === 'chua-co' ? <HuyHieuMoi /> : <span className="ddc-cham" data-nhom={k} />}
      </span>
      <span className="ddc-noi-chu">
        <span className="ddc-noi-nhan">Vừa điểm danh{gio ? ` · ${gio}` : ''}</span>
        <b className="ddc-noi-ten">{e.hoTen || `SBD ${e.sbd}`}</b>
        <span className="ddc-noi-bac">
          {m ? chuBac(m) : k === 'moi' ? `Chưa xếp bậc · đủ ${LUAT_NHOM_NHIP.soNgayToiThieu} ngày sẽ ${coBac ? 'có bậc' : 'xếp nhóm'}` : k === 'chua-co' ? 'Chưa có số nhịp học' : `Nhóm ${TEN_NHOM[k]}`}
        </span>
        {s && k !== 'moi' && (
          <span className="ddc-noi-so">
            {b && (
              <span>
                <small>Điểm chăm</small>
                <b>
                  {b.diem}
                  <small>/100</small>
                </b>
              </span>
            )}
            <span>
              <small>Đủ mức</small>
              <b>
                {s.du} <small>ngày</small>
              </b>
            </span>
            {s.thoatLuoi !== null ? (
              <span>
                <small>Thoát Lười</small>
                <b>
                  {s.thoatLuoi}/{NGAY_LIEN_THOAT_LUOI} <small>ngày liền</small>
                </b>
              </span>
            ) : (
              <span>
                <small>Chuỗi đủ mức</small>
                <b>
                  {s.chuoi} <small>ngày liền</small>
                </b>
              </span>
            )}
          </span>
        )}
        {len && (
          <span className="ddc-noi-len">
            <span className="ddc-noi-cau">{len.cau}</span>
            {len.tien !== null && (
              <>
                <span className="ddc-noi-vach" aria-hidden="true">
                  <i style={{ transform: `scaleX(${len.tien})` }} />
                </span>
                <span className="ddc-noi-moc" aria-hidden="true">
                  <span>{len.mocTrai}</span>
                  <span>{len.mocPhai}</span>
                </span>
              </>
            )}
            {ke && (
              <span className="ddc-noi-ke bcc" data-bac={ke.so} aria-hidden="true">
                <HuyHieuBac bac={ke.so} co={56} />
              </span>
            )}
          </span>
        )}
      </span>
    </div>
  )
}

// ------------------------------------------------------------------ NỀN SÁNG 23/10 — BỘ PHẬN CHUNG
const KHOANG_BAC: Partial<Record<KhoaNhom, string>> = { cham: 'bậc 8–12', 'chua-deu': 'bậc 6–7', luoi: 'bậc 1–5' }
const khoangNhom = (k: KhoaNhom, coBac: boolean): string =>
  coBac && KHOANG_BAC[k] ? KHOANG_BAC[k]! : k === 'moi' ? `chưa đủ ${LUAT_NHOM_NHIP.soNgayToiThieu} ngày` : k === 'chua-co' ? 'chưa có số nhịp học' : ''

/**
 * Đo lại khi đổi khổ màn (toàn màn hình, xoay máy chiếu) và MỖI đợt phông chữ nạp xong (chữ đổi cao ⇒ số dòng vừa khung đổi). Phông nạp nhiều
 * đợt (mỗi độ đậm một tệp, nạp khi chữ cần) — `fonts.ready` chỉ báo đợt đang chờ lúc gọi, nên nghe thêm `loadingdone` cho các đợt sau.
 */
function useDoKhoLai(setKho: (f: (n: number) => number) => void): void {
  useEffect(() => {
    let song = true
    const doi = () => song && setKho((n) => n + 1)
    const ff = typeof document !== 'undefined' ? document.fonts : undefined
    window.addEventListener('resize', doi)
    ff?.addEventListener?.('loadingdone', doi)
    void ff?.ready.then(doi)
    return () => {
      song = false
      window.removeEventListener('resize', doi)
      ff?.removeEventListener?.('loadingdone', doi)
    }
  }, [setKho])
}

/**
 * TỰ CO THEO ĐO THẬT (không đoán theo khổ): còn tràn ⇒ lên một nấc, tới `toiDa`. Danh sách đổi (`khoa`) hoặc đổi khổ màn ⇒ về nấc 0 rồi đo lại —
 * màn sống làm mới 5 giây / bật toàn màn hình không giữ nấc cũ. Không bao giờ cắt tên: nấc chỉ bớt trang trí.
 */
function useNacTuCo(ref: RefObject<HTMLElement | null>, khoa: string, toiDa: number): number {
  const [nac, setNac] = useState(0)
  const [kho, setKho] = useState(0)
  useDoKhoLai(setKho)
  useLayoutEffect(() => setNac(0), [khoa, kho])
  useLayoutEffect(() => {
    const el = ref.current
    if (el && nac < toiDa && el.scrollHeight > el.clientHeight + 1) setNac(nac + 1)
  })
  return nac
}

/** Một cột danh sách: vừa một cột ⇒ giữ; không vừa ⇒ hai cột con; vẫn không vừa ⇒ bớt từng em tới khi vừa (kể cả dòng "+N em nữa"). Đo lại khi danh sách / khổ đổi. */
function DsVuaKhung({ ds, khoa, hai = true, lop, render }: { ds: readonly EmBuoi[]; khoa: string; hai?: boolean; lop: string; render: (e: EmBuoi) => ReactNode }) {
  const ref = useRef<HTMLOListElement>(null)
  const [kieu, setKieu] = useState<'dong' | 'luoi'>('dong')
  const [hien, setHien] = useState(ds.length)
  const [kho, setKho] = useState(0)
  useDoKhoLai(setKho)
  useLayoutEffect(() => {
    setKieu('dong')
    setHien(ds.length)
  }, [khoa, kho, ds.length])
  useLayoutEffect(() => {
    const ol = ref.current
    if (!ol) return
    // So mép THẬT của từng dòng với khung (scrollHeight làm tròn số nguyên ⇒ có thể sót nửa điểm ảnh của dòng cuối)
    const k = ol.getBoundingClientRect()
    const tran = [...ol.children].some((li) => {
      const r = li.getBoundingClientRect()
      return r.bottom > k.bottom + 0.5 || r.right > k.right + 0.5
    })
    if (!tran) return
    if (hai && kieu === 'dong') setKieu('luoi')
    else if (hien > 1) setHien(hien - 1)
  })
  return (
    <>
      <ol ref={ref} className={lop} data-kieu={kieu}>
        {ds.slice(0, hien).map(render)}
      </ol>
      {hien < ds.length && <p className="ddv-cot-them">+{ds.length - hien} em nữa · xem đủ trên máy thầy</p>}
    </>
  )
}

function Dau({ nhan, tieuDe, phai, mat, nutDong }: { nhan: string; tieuDe: string; phai: ReactNode; mat: boolean; nutDong: ReactNode }) {
  return (
    <>
      <header className="ddv-dau">
        <span className="ddv-nhan">{nhan}</span>
        <h1 className="ddv-lop">{tieuDe}</h1>
        <div className="ddv-dau-phai">{phai}</div>
        {nutDong}
      </header>
      {mat && (
        <div className="ddv-bao" role="status" aria-label="Mất kết nối với máy chủ">
          <CloudOff aria-hidden="true" />
          Mất kết nối với máy chủ — danh sách giữ như lần đọc cuối, màn đang thử lại và tự cập nhật khi có mạng.
        </div>
      )}
    </>
  )
}

function VongCoMat({ co, tong }: { co: number; tong: number | null }) {
  const p = tong ? Math.min(1, co / tong) : 0
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className="ddv-vong" role="status" aria-label={`Có mặt ${co}${tong ? ` trên ${tong}` : ''} em`}>
      {tong ? (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={r} className="ddv-vong-nen" />
          <circle cx="50" cy="50" r={r} className="ddv-vong-day" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 50 50)" />
        </svg>
      ) : null}
      <div className="ddv-vong-so">
        <b>{co}</b>
        {tong ? <span>/{tong}</span> : null}
      </div>
      <div className="ddv-vong-chu">
        em có mặt
        {tong ? <small>{tong - co > 0 ? `còn ${tong - co} em chưa điểm danh` : 'đủ cả lớp'}</small> : null}
      </div>
    </div>
  )
}

/**
 * "Mã đổi sau m:ss" — chỉ ô này đếm từng giây (không làm cả màn vẽ lại). Mốc `doiMaLuc` là giờ MÁY CHỦ; lệnh buổi học không gửi giờ máy chủ nên
 * đếm theo giờ máy thầy, và CHỈ đếm khi khớp lý (0 < còn ≤ một chu kỳ mã 60 s). Giờ máy lệch ⇒ chữ "Mã đổi mỗi phút" như trước (không đếm sai);
 * về 0 mà lượt làm mới 5 giây chưa mang mã mới ⇒ "Đang đổi mã…" (không đứng ở 0:00).
 */
export const CHU_KY_MA_CHIEU_MS = 60_000
export function chuMaDoi(luc: number | null, bay: number): { con: number | null; dangDoi: boolean } {
  if (!luc) return { con: null, dangDoi: false }
  const con = luc - bay
  if (con > CHU_KY_MA_CHIEU_MS + 2_000 || con < -15_000) return { con: null, dangDoi: false } // giờ máy thầy lệch xa ⇒ không đếm
  return con <= 0 ? { con: 0, dangDoi: true } : { con: Math.min(con, CHU_KY_MA_CHIEU_MS), dangDoi: false }
}
function MaDoiSau({ luc, xong }: { luc: number | null; xong: boolean }) {
  const [bay, setBay] = useState(() => Date.now())
  useEffect(() => {
    if (xong || !luc) return
    setBay(Date.now())
    const t = window.setInterval(() => setBay(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [luc, xong])
  if (xong) return <p className="ddv-ma-phu">Buổi đã kết thúc — mã hết hiệu lực</p>
  const { con, dangDoi } = chuMaDoi(luc, bay)
  return (
    <>
      {con !== null && (
        <div className="ddv-ma-doi" aria-hidden="true">
          <span style={{ width: `${(100 * con) / CHU_KY_MA_CHIEU_MS}%` }} />
        </div>
      )}
      <p className="ddv-ma-phu">
        {dangDoi ? (
          'Đang đổi mã…'
        ) : con !== null ? (
          <>
            Mã đổi sau{' '}
            <b>
              {Math.floor(con / 60_000)}:{String(Math.floor((con % 60_000) / 1000)).padStart(2, '0')}
            </b>
          </>
        ) : (
          'Mã đổi mỗi phút'
        )}{' '}
        · mỗi em chỉ điểm danh cho chính mình
      </p>
    </>
  )
}

/** Dải 12 bậc: số em có mặt ở mỗi bậc + ô Mới (ẩn khi lớp đông — nấc ≥ 2). */
function ThangBac({ dem }: { dem: DemThang }) {
  return (
    <div className="ddv-thang" role="group" aria-label="Số em có mặt ở mỗi bậc, từ Lười đến Chăm">
      {BAC_CHAM_CHI.map((b, i) => {
        const n = dem.bac[i] ?? 0
        return (
          <span key={b.so} className="ddv-thang-o bcc" data-bac={b.so} data-nhom={b.nhom} data-rong={n === 0 || undefined} title={`${chuBac(b)}: ${n} em`}>
            <HuyHieuBac bac={b.so} co={30} />
            <b>{n}</b>
            <span className="sr-only"> em ở {chuBac(b)}</span>
          </span>
        )
      })}
      <span className="ddv-thang-o ddv-thang-o--moi" data-rong={dem.chuaXep === 0 || undefined} title={`Chưa xếp bậc: ${dem.chuaXep} em`}>
        <span className="ddv-thang-moi">Mới</span>
        <b>{dem.chuaXep}</b>
        <span className="sr-only"> em chưa xếp bậc</span>
      </span>
    </div>
  )
}

/** Huy hiệu tròn chữ cái nhóm — em chưa có bậc (Mới / chưa có số / máy chủ cũ không gửi bậc). */
const HuyHieuNhom = ({ k }: { k: KhoaNhom }) => (
  <span className="ddv-the-hh-trong" data-nhom={k} aria-hidden="true">
    {TEN_NHOM[k].slice(0, 1)}
  </span>
)

/** Dấu «⏸ N» — em có N lượt Treo máy trong 14 ngày (Cố tình gộp vào, bản công khai). */
const ChipTreo = ({ m }: { m: MucLamEm | undefined }) => {
  const n = m ? m.soTreo + m.soCoTinh : 0
  return n > 0 ? (
    <span className="ddv-treo-chip" title={`Treo máy ${n} lượt trong 14 ngày`}>
      <Pause aria-hidden="true" />
      {n}
    </span>
  ) : null
}

/** Chú thích khi rê chuột: số chi tiết đã bỏ khỏi thẻ (chữ nhỏ không đọc được từ cuối lớp). */
function chuChiTiet(e: EmBuoi): string {
  const ten = e.hoTen || `SBD ${e.sbd}`
  const s = soThe(e)
  const gio = gioDd(e.luc)
  const phan = [ten, gio ? `điểm danh lúc ${gio}` : '']
  if (e.bacCham) phan.push(`điểm chăm ${e.bacCham.diem}/100`)
  if (khoaNhom(e) === 'moi' && e.nhip) phan.push(`đã có số ${e.nhip.soNgayQua}/${LUAT_NHOM_NHIP.soNgayToiThieu} ngày`)
  else if (s) phan.push(`đủ mức ${s.du} ngày`, s.thoatLuoi !== null ? `thoát Lười ${s.thoatLuoi}/${NGAY_LIEN_THOAT_LUOI} ngày liền` : `chuỗi ${s.chuoi} ngày liền`)
  return phan.filter(Boolean).join(' · ')
}

// ------------------------------------------------------------------ A · ĐIỂM DANH ĐẦU GIỜ (nền sáng)
function TheEm({ e, vua, dau, noi, coBac, mucLam, onMoEm }: { e: EmBuoi; vua: boolean; dau: boolean; noi: boolean; coBac: boolean; mucLam: MucLamEm | undefined; onMoEm: PropsBanChieu['onMoEm'] }) {
  const k = khoaNhom(e)
  const m = e.bacCham ? motBac(e.bacCham.bac) : null
  const ten = e.hoTen || `SBD ${e.sbd}`
  return (
    <button
      type="button"
      className={`ddv-the${m ? ' bcc' : ''}`}
      data-bac={m?.so}
      data-nhom={k}
      data-sbd={e.sbd}
      data-vua={vua ? '' : undefined}
      data-moi={vua ? '' : undefined}
      data-dau={dau ? '' : undefined}
      data-noi={noi ? '' : undefined}
      title={chuChiTiet(e)}
      onClick={(ev) => onMoEm(e, ev.currentTarget)}
      aria-label={nhanEm(e)}
    >
      <span className="ddv-the-hh" aria-hidden="true">
        {m ? (
          <>
            <HuyHieuBac bac={m.so} co={56} />
            <b className="ddv-the-so">{m.so}</b>
          </>
        ) : (
          <HuyHieuNhom k={k} />
        )}
      </span>
      <span className="ddv-the-chu">
        <b className="ddv-the-ten">
          {ten}
          <ChipTreo m={mucLam} />
        </b>
        <span className="ddv-the-bac">{m ? m.ten : k === 'moi' ? (coBac ? 'Chưa xếp bậc' : 'Mới vào lớp') : TEN_NHOM[k]}</span>
      </span>
      {vua && (
        <span className="ddv-the-vua" aria-hidden="true">
          <Sparkles aria-hidden="true" />
          Vừa vào {gioDd(e.luc)}
        </span>
      )}
      {dau && (
        <span className="ddv-the-dau" aria-hidden="true">
          <Crown aria-hidden="true" />
          Dẫn đầu lớp
        </span>
      )}
    </button>
  )
}

function ChieuDiemDanh({ tt, tk, nhip, goc, matKetNoi, mucLam, onMoEm, onDoiCheDo, onThuLaiNhip, nutDong }: PropsBanChieu & { nutDong: ReactNode }) {
  const ma = tt.ma ?? ''
  const xong = !tt.buoi.dangMo
  const ve = useMemo(() => {
    if (!ma || xong) return null
    const q = taoQr(linkDiemDanh(goc, ma))
    return q ? duongQr(q) : null
  }, [ma, goc, xong])
  const luoi = useMemo(() => luoiDiemDanh(tk.coMat), [tk.coMat])
  const vua = useMemo(() => emVuaVao(tk.coMat), [tk.coMat])
  const coNhip = !!nhip.kq
  const coBac = useMemo(() => coNhip && coBacBuoi(tk.ds), [coNhip, tk.ds])
  const thang = useMemo(() => demThang(tk.coMat), [tk.coMat])
  const dau = useMemo(() => (coBac ? (dauLop(luoi)?.dau ?? null) : null), [coBac, luoi])
  const moiNhat = useMemo(() => [...tk.coMat].sort((a, b) => (b.luc ?? '').localeCompare(a.luc ?? '')).slice(0, 3), [tk.coMat])
  const nhomCo = THU_TU_NHOM.filter((n) => luoi.some((e) => khoaNhom(e) === n))
  const lanRef = useRef<HTMLDivElement>(null)
  const noiRef = useRef<HTMLDivElement>(null)
  const noi = useTheNoi(tk.coMat, lanRef, noiRef)
  const emNoi = noi ? (tk.coMat.find((e) => e.sbd === noi.sbd) ?? null) : null
  const nac = useNacTuCo(lanRef, `${luoi.map((e) => e.sbd).join('|')}#${coBac ? 1 : 0}`, 5)
  const soCoMat = tk.coMat.length
  const diaChi = `${(goc || '').replace(/^https?:\/\//, '')}/hs`
  const L = LUAT_NHOM_NHIP
  return (
    <div className="ddv-man" data-nac={nac}>
      <Dau nhan="Điểm danh đầu giờ" tieuDe={chuBuoi(tt.buoi)} phai={<VongCoMat co={soCoMat} tong={tt.siSo} />} mat={matKetNoi} nutDong={nutDong} />
      <main className="ddv-than" data-co-bac={coBac ? '' : undefined}>
        <aside className="ddv-vao">
          <section className="ddv-ma" aria-label="Mã điểm danh">
            <p className="ddv-ma-buoc">
              <QrCode aria-hidden="true" />
              <span>Mở app học sinh ›</span> <b>Điểm danh</b>
            </p>
            <b className="ddv-ma-so" aria-label={`Mã điểm danh ${ma}`} aria-live="polite">
              {xong ? '— — —' : ma ? dinhDangMa(ma) : '……'}
            </b>
            {ve && (
              <div className="ddv-ma-qr">
                <svg className="" viewBox={`0 0 ${ve.canh} ${ve.canh}`} role="img" aria-label="Mã QR điểm danh" shapeRendering="crispEdges">
                  <rect width={ve.canh} height={ve.canh} className="ddv-qr-nen" />
                  <path d={ve.d} />
                </svg>
              </div>
            )}
            <MaDoiSau luc={tt.doiMaLuc} xong={xong} />
            <p className="ddv-ma-link">{diaChi}</p>
          </section>
          {moiNhat.length > 0 && (
            <section className="ddv-moi-vao" aria-label="Vừa vào lớp">
              <p className="ddv-muc-tieu">
                <Sparkles aria-hidden="true" />
                Vừa vào lớp
              </p>
              {moiNhat.map((e, i) => {
                const m = e.bacCham ? motBac(e.bacCham.bac) : null
                return (
                  <button key={e.sbd} type="button" className="ddv-moi-dong" data-dau={i === 0 || undefined} onClick={(ev) => onMoEm(e, ev.currentTarget)} aria-label={`${nhanEm(e)}, vừa vào lúc ${gioDd(e.luc)}`}>
                    <span className="ddv-moi-hh" aria-hidden="true">
                      {m ? <HuyHieuBac bac={m.so} co={i === 0 ? 52 : 40} /> : <HuyHieuNhom k={khoaNhom(e)} />}
                    </span>
                    <span className="ddv-moi-chu">
                      <b>{e.hoTen || `SBD ${e.sbd}`}</b>
                      <span>{m ? `Bậc ${m.so} · ${m.ten}` : TEN_NHOM[khoaNhom(e)]}</span>
                    </span>
                    <time>{gioDd(e.luc)}</time>
                  </button>
                )
              })}
            </section>
          )}
        </aside>

        <section className="ddv-lop-hn" aria-label="Em đã điểm danh" data-noi={emNoi ? '' : undefined}>
          {!coNhip && <NhipChuaCo nhip={nhip} onThuLai={onThuLaiNhip} />}
          {soCoMat === 0 ? (
            <div className="ddv-trong">
              {coBac && <div className="ddv-trong-hh">{[12, 9, 6, 3].map((b) => <HuyHieuBac key={b} bac={b} co={88} />)}</div>}
              <p className="ddv-trong-to">Chưa em nào điểm danh</p>
              <p className="ddv-trong-phu">
                Em mở app học sinh, chọn <b>Điểm danh</b>, gõ mã {ma && !xong ? <b>{dinhDangMa(ma)}</b> : 'buổi'} hoặc quét mã QR bên trái. Màn tự cập nhật mỗi 5 giây.
              </p>
            </div>
          ) : (
            <>
              {coBac && <ThangBac dem={thang} />}
              <div className="ddv-lan-ds" ref={lanRef} role="group" aria-label="Bấm tên em để mở hồ sơ làm bài">
                {nhomCo.map((n) => {
                  const ds = luoi.filter((e) => khoaNhom(e) === n)
                  return (
                    <div key={n} className="ddv-lan" data-nhom={n}>
                      <div className="ddv-lan-nhan">
                        <b>{TEN_NHOM[n]}</b>
                        <span>{ds.length} em</span>
                        <small>{khoangNhom(n, coBac)}</small>
                      </div>
                      <div className="ddv-lan-the">
                        {ds.map((e) => (
                          <TheEm key={e.sbd} e={e} vua={vua.has(e.sbd)} dau={e === dau} noi={emNoi?.sbd === e.sbd} coBac={coBac} mucLam={mucLam?.get(e.sbd)} onMoEm={onMoEm} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
          {emNoi && noi && <TheNoiVua e={emNoi} pha={noi.pha} dich={noi.dich} coBac={coBac} gocRef={noiRef} />}
        </section>
      </main>
      <footer className="ddv-chan">
        <p className="ddv-chu-giai">
          {coBac
            ? `Bậc 1–${SO_BAC} tính từ số ngày làm đủ mức và chuỗi ngày liền · Lười 1–5 thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền · Chưa đều 6–7 · Chăm 8–${SO_BAC}`
            : `Chăm: đủ mức ≥ ${L.chamTu}% số ngày · Lười: ≤ ${L.luoiDen}% hoặc bỏ ${L.ngayLienKhongLam} ngày liền, thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền · Mới: chưa đủ ${L.soNgayToiThieu} ngày`}
          {mucLam && mucLam.size > 0 ? (
            <>
              {' · '}
              <span className="ddv-chu-giai-treo">
                <Pause aria-hidden="true" className="ddv-chu-giai-ic" /> N = số lượt treo máy 14 ngày
              </span>
            </>
          ) : null}
        </p>
        <button type="button" className="ddv-nut-chinh" onClick={() => onDoiCheDo('nhip-lop')}>
          Chiếu Nhịp học của lớp <ArrowRight aria-hidden="true" /> <kbd>→</kbd>
        </button>
      </footer>
    </div>
  )
}

function NhipChuaCo({ nhip, onThuLai }: { nhip: TrangThaiNhip; onThuLai?: () => void }) {
  if (nhip.kq) return null
  return nhip.loi ? (
    <p className="ddv-cach-cho" role="status">
      Chưa có nhóm Chăm / Lười: {nhip.loi}
      {onThuLai && (
        <button type="button" className="ddv-nut" onClick={onThuLai} disabled={nhip.dangTai}>
          <RefreshCw aria-hidden="true" /> Thử lại
        </button>
      )}
    </p>
  ) : (
    <p className="ddv-cach-cho" aria-busy="true">
      Đang tải nhịp học của lớp…
    </p>
  )
}

// ------------------------------------------------------------------ B · NHỊP HỌC CỦA LỚP (nền sáng + Cách làm bài + cột Treo máy)
function DaiNgay({ e }: { e: EmBuoi }) {
  const o = (e.nhip?.o ?? []).filter((x) => !x.homNay)
  return (
    <span className="ddv-ngay" aria-hidden="true">
      {o.map((x) => (
        <i key={x.ngay} data-loai={x.loai} />
      ))}
    </span>
  )
}

function CotTreo({ ds, khoa, tong, mucLam, dang, loi, onMoEm }: { ds: readonly EmBuoi[]; khoa: string; tong: TongCachLop; mucLam: ReadonlyMap<string, MucLamEm>; dang: boolean; loi: string; onMoEm: PropsBanChieu['onMoEm'] }) {
  const dong = useMemo(() => dsTreoMay(ds, mucLam), [ds, mucLam])
  const theoSbd = useMemo(() => new Map(dong.map((d) => [d.em.sbd, d])), [dong])
  const emTreo = useMemo(() => dong.map((d) => d.em), [dong])
  return (
    <section className="ddv-cot" data-nhom="treo" aria-labelledby="ddv-cot-treo">
      <h2 id="ddv-cot-treo">
        <b>Treo máy</b>
        <span>{dong.length} em</span>
        <small>14 ngày · em có mặt · rời câu lâu không làm</small>
      </h2>
      {tong.soEmCoSo === 0 ? (
        <p className="ddv-treo-khong">{dang ? 'Đang tải số treo máy…' : loi ? `Chưa tải được: ${loi}` : 'Chưa có số Mức làm của lớp'}</p>
      ) : (
        <>
          <div className="ddv-treo-tong">
            <p>
              <b>{tong.treo}</b>
              <small>lượt treo</small>
            </p>
            <p>
              <b>{tong.phutTreo === null ? '—' : tong.phutTreo}</b>
              <small>phút treo</small>
            </p>
            <p>
              <b>{tong.soEmTreo}</b>
              <small>em có treo</small>
            </p>
          </div>
          {dong.length === 0 ? (
            <p className="ddv-treo-khong">{tong.chuaDoTreo >= tong.soDo && tong.soDo > 0 ? 'Đang đo từ các lượt làm mới — lượt cũ chưa đo treo máy' : 'Không em nào treo máy trong 14 ngày'}</p>
          ) : (
            <DsVuaKhung
              ds={emTreo}
              khoa={khoa}
              hai={false}
              lop="ddv-treo-ds"
              render={(e) => {
                const d = theoSbd.get(e.sbd)!
                return (
                  <li key={e.sbd}>
                    <button type="button" className="ddv-treo-dong" onClick={(ev) => onMoEm(e, ev.currentTarget)} aria-label={`${nhanEm(e)}, treo máy ${d.treo} lượt${d.phut !== null ? `, ${d.phut} phút` : ''}${d.soNgay !== null ? `, ${d.soNgay} ngày` : ''}`}>
                      <span className="ddv-dong-hh" aria-hidden="true">
                        {e.bacCham ? <HuyHieuBac bac={e.bacCham.bac} co={30} /> : null}
                      </span>
                      <span className="ddv-treo-dong-ten">
                        <b>{e.hoTen || `SBD ${e.sbd}`}</b>
                        <small>
                          {d.soNgay !== null ? `${d.soNgay} ngày` : '— ngày'} · {d.phut !== null ? `${d.phut} phút` : '— phút'}
                        </small>
                      </span>
                      <span className="ddv-treo-dong-so">
                        <b>{d.treo}</b>
                        <small>lượt</small>
                      </span>
                    </button>
                  </li>
                )
              }}
            />
          )}
          {tong.chuaDoTreo > 0 && <p className="ddv-treo-chua">{tong.chuaDoTreo} lượt chưa đo treo máy</p>}
        </>
      )}
    </section>
  )
}

function ChieuNhipLop({ tt, tk, nhip, matKetNoi, mucLam, mucLamDang, mucLamLoi, onMoEm, onDoiCheDo, onSangDauGio, onThuLaiNhip, nutDong, anLuoi, onDoiAn, mucTung, onDoiMuc }: PropsBanChieu & { nutDong: ReactNode; anLuoi: boolean; onDoiAn: () => void; mucTung: boolean; onDoiMuc: () => void }) {
  const kq = nhip.kq
  const k = khoangNhip(kq)
  const cot = useMemo(() => cotNhipLop(tk.ds), [tk.ds])
  const hn = useMemo(() => homQuaHomNay(tk.ds, kq), [tk.ds, kq])
  const ml = mucLam ?? KHONG_MUC
  const sbdCoMat = useMemo(() => tk.coMat.map((e) => e.sbd), [tk.coMat])
  const tong = useMemo(() => tongCachLop(sbdCoMat, ml), [sbdCoMat, ml])
  const dl = tk.demLop
  const tongEm = dl.tong
  const n = k?.soNgayQua ?? 0
  const g = nguongNgay(n)
  const lop = tt.buoi.lop.trim() || 'mọi lớp'
  const soVang = tk.vang.length
  const khac = dl.moi + dl.chuaCo
  const dieuKien: Record<'cham' | 'chua-deu' | 'luoi', string> =
    n >= LUAT_NHOM_NHIP.soNgayToiThieu
      ? { cham: `đủ mức ≥ ${g.cham}/${n} ngày`, 'chua-deu': `đủ mức ${g.luoi + 1}–${g.cham - 1}/${n} ngày`, luoi: `thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền` }
      : { cham: `đủ mức ≥ ${LUAT_NHOM_NHIP.chamTu}% số ngày`, 'chua-deu': 'ở giữa', luoi: `thoát khi đủ mức ${NGAY_LIEN_THOAT_LUOI} ngày liền` }
  const khoaDs = `${tk.ds.map((e) => `${e.sbd}${e.coMat ? 1 : 0}`).join('|')}#${mucTung ? 1 : 0}#${ml.size}`

  const cotJsx = (khoa: 'cham' | 'chua-deu' | 'luoi', ten: string, ds: EmBuoi[]) => {
    const an = khoa === 'luoi' && anLuoi
    return (
      <section key={khoa} className="ddv-cot" data-nhom={khoa} aria-labelledby={`ddc-cot-${khoa}`}>
        <h2 id={`ddc-cot-${khoa}`}>
          <b>{ten}</b>
          <span>{ds.length} em</span>
          <small>{dieuKien[khoa]}</small>
        </h2>
        {an ? (
          <div className="ddv-an" data-khoi="luoi-da-an">
            <EyeOff aria-hidden="true" />
            <p>Đã ẩn tên {ds.length} em nhóm Lười</p>
            <small>
              Bấm <kbd>H</kbd> để hiện lại · thầy vẫn xem đủ trên máy thầy
            </small>
          </div>
        ) : ds.length === 0 ? (
          <p className="ddv-treo-khong">Chưa có em nào.</p>
        ) : (
          <DsVuaKhung
            ds={ds}
            khoa={khoaDs}
            lop="ddv-cot-ds"
            render={(e) => {
              const vang = !e.coMat
              const bo = khoa === 'luoi' ? soNgayBo(e.nhip) : 0
              const m = vang ? undefined : ml.get(e.sbd)
              const c = m ? cachEm(m) : null
              return (
                <li key={e.sbd} data-vang={vang || undefined}>
                  <button type="button" className="ddv-dong-em" data-vang={vang ? '' : undefined} onClick={(ev) => onMoEm(e, ev.currentTarget)} aria-label={nhanEm(e) + (bo ? `, bỏ ${bo} ngày liền` : '') + (c ? `, vội ${c.voi}, có nghĩ ${c.nghi}, treo máy ${c.treo} lượt` : '')}>
                    <span className="ddv-dong-hh" aria-hidden="true">
                      {e.bacCham ? <HuyHieuBac bac={e.bacCham.bac} co={34} /> : null}
                    </span>
                    <span className="ddv-dong-ten">
                      {e.hoTen || `SBD ${e.sbd}`}
                      {vang && <em className="">vắng</em>}
                    </span>
                    {mucTung && c && c.voi + c.nghi + c.treo > 0 ? (
                      <span className="ddv-dong-muc" aria-hidden="true">
                        <i data-k="voi" style={{ flexGrow: c.voi }} />
                        <i data-k="nghi" style={{ flexGrow: c.nghi }} />
                        {c.treo > 0 && <i data-k="treo" style={{ flexGrow: c.treo }} />}
                      </span>
                    ) : (
                      <DaiNgay e={e} />
                    )}
                    <span className="ddv-dong-so">
                      {bo > 0 ? (
                        <em>bỏ {bo} ngày</em>
                      ) : (
                        <>
                          {e.nhip?.soNgayDu ?? 0}
                          <small>/{e.nhip?.soNgayQua ?? 0}</small>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              )
            }}
          />
        )}
      </section>
    )
  }

  return (
    <div className="ddv-man">
      <Dau
        nhan={`Nhịp học · ${lop}`}
        tieuDe={k ? `Từ ${ngayNganDd(k.tu)}${k.homQua ? ` đến ${ngayNganDd(k.homQua)}` : ''} · ${n} ngày đã qua` : 'Nhịp học của lớp'}
        phai={
          <p className="ddv-dau-so">
            Có mặt <b>{tk.coMat.length}</b>
            {tt.siSo ? `/${tt.siSo}` : ''}
            {tt.buoi.lop.trim() && tt.lopEm ? (
              <>
                {' '}
                · Vắng <b>{soVang}</b>
              </>
            ) : null}
          </p>
        }
        mat={matKetNoi}
        nutDong={nutDong}
      />

      {!kq ? (
        <main className="ddv-loi">
          {nhip.loi ? (
            <>
              <RefreshCw aria-hidden="true" />
              <p className="ddv-trong-to" role="status">
                Chưa tải được nhịp học của lớp: {nhip.loi}
              </p>
              <button type="button" className="ddv-nut-chinh" onClick={onThuLaiNhip} disabled={nhip.dangTai} aria-busy={nhip.dangTai}>
                <RefreshCw aria-hidden="true" /> Thử lại
              </button>
            </>
          ) : (
            <p className="ddv-trong-to" aria-busy="true">
              Đang tải nhịp học của lớp…
            </p>
          )}
        </main>
      ) : tongEm === 0 || dl.chuaCo === tongEm ? (
        <main className="ddv-loi">
          <p className="ddv-trong-phu">Chưa có số nhịp học của lớp này — các em chưa nhận bài hằng ngày (chưa có Hành trình khối hay Gói bài 7 ngày nào đang chạy).</p>
        </main>
      ) : (
        <main className="ddv-nhip">
          <div className="ddv-tong">
            <div className="ddv-tong-thanh" role="img" aria-label={`Chăm ${dl.cham} em, Chưa đều ${dl.chuaDeu} em, Lười ${dl.luoi} em${khac ? `, ${khac} em mới vào lớp hoặc chưa có số` : ''}`}>
              {dl.cham > 0 && (
                <span data-nhom="cham" style={{ flexGrow: dl.cham }}>
                  <b>{dl.cham}</b> Chăm · {phanTramDd(dl.cham, tongEm)}%
                </span>
              )}
              {dl.chuaDeu > 0 && (
                <span data-nhom="chua-deu" style={{ flexGrow: dl.chuaDeu }}>
                  <b>{dl.chuaDeu}</b> Chưa đều · {phanTramDd(dl.chuaDeu, tongEm)}%
                </span>
              )}
              {dl.luoi > 0 && (
                <span data-nhom="luoi" style={{ flexGrow: dl.luoi }}>
                  <b>{dl.luoi}</b> Lười · {phanTramDd(dl.luoi, tongEm)}%
                </span>
              )}
              {khac > 0 && (
                <span data-nhom="moi" style={{ flexGrow: Math.max(khac, 2) }}>
                  <b>{khac}</b> Mới
                </span>
              )}
            </div>
            <div className="ddv-so-to">
              {hn.homQua ? (
                <p>
                  <b>{hn.homQua.du}</b>
                  <span>/{hn.homQua.tong}</span>
                  <small>em đủ mức hôm qua</small>
                </p>
              ) : (
                <p>
                  <small>Chưa có số hôm qua</small>
                </p>
              )}
              {hn.homNayDu !== null && (
                <p data-phu="">
                  <b>{hn.homNayDu}</b>
                  <small>em đã đủ mức hôm nay</small>
                </p>
              )}
            </div>
          </div>

          <div className="ddv-cach" aria-label="Cách cả lớp làm bài 14 ngày qua">
            <p className="ddv-cach-tieu">
              Cách cả lớp làm bài
              <small>
                14 ngày qua · {tong.soEmCoSo < tong.soEm ? `số của ${tong.soEmCoSo}/${tong.soEm} em có mặt` : `${tong.soEm} em có mặt`} · {tong.soDo} lượt đã đo giờ
              </small>
            </p>
            {tong.soDo > 0 ? (
              <>
                <div className="ddv-cach-thanh" role="img" aria-label={`Vội ${tong.voi} lượt, có nghĩ ${tong.nghi} lượt, treo máy ${tong.treo} lượt`}>
                  {tong.voi > 0 && (
                    <span data-k="voi" style={{ flexGrow: tong.voi }}>
                      <Zap aria-hidden="true" />
                      <b>Vội</b> {tong.voi} lượt · {phanTramDd(tong.voi, tong.soDo)}%
                    </span>
                  )}
                  {tong.nghi > 0 && (
                    <span data-k="nghi" style={{ flexGrow: tong.nghi }}>
                      <Lightbulb aria-hidden="true" />
                      <b>Có nghĩ</b> {tong.nghi} lượt · {phanTramDd(tong.nghi, tong.soDo)}%
                    </span>
                  )}
                  {tong.treo > 0 && (
                    <span data-k="treo" style={{ flexGrow: Math.max(tong.treo, tong.soDo * 0.06) }}>
                      <Pause aria-hidden="true" />
                      <b>Treo máy</b> {tong.treo} lượt{tong.phutTreo !== null ? ` · ${tong.phutTreo} phút` : ''}
                    </span>
                  )}
                </div>
                {tong.sai !== null && tong.saiVoi !== null && tong.sai > 0 && (
                  <p className="ddv-cach-cau">
                    <b>
                      {tong.saiVoi}/{tong.sai}
                    </b>{' '}
                    lượt sai ({phanTramDd(tong.saiVoi, tong.sai)}%) là nộp khi chưa kịp đọc hết đề
                  </p>
                )}
              </>
            ) : (
              <p className="ddv-cach-cho">{mucLamDang ? 'Đang tải cách làm bài của lớp…' : mucLamLoi ? `Chưa tải được cách làm bài: ${mucLamLoi}` : 'Chưa có lượt nào đo giờ trong 14 ngày.'}</p>
            )}
          </div>

          <div className="ddv-ba-cot">
            {cotJsx('cham', 'Chăm', cot.cham)}
            {cotJsx('chua-deu', 'Chưa đều', cot.chuaDeu)}
            {cotJsx('luoi', 'Lười', cot.luoi)}
            <CotTreo ds={tk.coMat} khoa={khoaDs} tong={tong} mucLam={ml} dang={!!mucLamDang} loi={mucLamLoi ?? ''} onMoEm={onMoEm} />
          </div>
          <p className="ddv-chu-giai ddv-chu-giai--o">
            <span>
              <i data-loai="du" />
              Đủ mức
            </span>
            <span>
              <i data-loai="thieu-it" />
              Thiếu ít
            </span>
            <span>
              <i data-loai="thieu-nhieu" />
              Thiếu nhiều
            </span>
            <span>
              <i data-loai="khong-lam" />
              Không làm
            </span>
            {mucTung && (
              <>
                <span>
                  <i data-k="voi" />
                  Vội (Mức làm 1–2)
                </span>
                <span>
                  <i data-k="nghi" />
                  Có nghĩ (3–4)
                </span>
              </>
            )}
            <span>
              <i data-k="treo" />
              Treo máy
            </span>
            <span className="ddv-chu-giai-phai">
              Mỗi ô là một ngày · bấm tên em ⇒ <b>hồ sơ làm bài</b>
            </span>
          </p>
        </main>
      )}

      <footer className="ddv-chan">
        <button type="button" className="ddv-nut" onClick={() => onDoiCheDo('diem-danh')}>
          <ArrowLeft aria-hidden="true" /> Điểm danh <kbd>←</kbd>
        </button>
        <button type="button" className="ddv-nut" aria-pressed={anLuoi} onClick={onDoiAn}>
          {anLuoi ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          {anLuoi ? 'Hiện tên nhóm Lười' : 'Ẩn tên nhóm Lười'} <kbd>H</kbd>
        </button>
        <button type="button" className="ddv-nut" aria-pressed={mucTung} onClick={onDoiMuc}>
          <Zap aria-hidden="true" />
          Cách làm từng em: {mucTung ? 'Bật' : 'Tắt'} <kbd>M</kbd>
        </button>
        {onSangDauGio && (
          <button type="button" className="ddv-nut-chinh" onClick={onSangDauGio}>
            Sang Gọi lên bảng đầu giờ <ArrowRight aria-hidden="true" /> <kbd>→</kbd>
          </button>
        )}
      </footer>
    </div>
  )
}

const KHONG_MUC: ReadonlyMap<string, MucLamEm> = new Map()
