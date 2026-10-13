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
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
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
import HuyHieuBac from '../bac-cham-chi/HuyHieuBac'
import { BAC_CHAM_CHI, chuBac, chuBacSo, motBac, SO_BAC } from '../bac-cham-chi/bac'
import { caoBe, chuVuaVao, coBacBuoi, coLuoiThe, dauLop, demThang, emVuaVao, lenBac, soThe, type DauLop, type DemThang } from './chieu-bac'
import '../chieu-ma.css'
import '../chieu-ma-kiem-tra.css'
import './ban-chieu-diem-danh.css'

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

/** Câu đọc màn hình của nút em, kèm bậc + điểm chăm khi có. */
const nhanEm = (e: EmBuoi): string => chuNutEm(e, e.bacCham ? `${chuBacSo(e.bacCham.bac)}, điểm chăm ${e.bacCham.diem}` : undefined)

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

// ------------------------------------------------------------------ THANG 12 BẬC · VINH DANH · THẺ EM
const NHOM_THANG: readonly { n: string; k: KhoaNhom; ten: string; khoang: string }[] = [
  { n: 'luoi', k: 'luoi', ten: 'Lười', khoang: 'bậc 1–5' },
  { n: 'deu', k: 'chua-deu', ten: 'Chưa đều', khoang: '6–7' },
  { n: 'cham', k: 'cham', ten: 'Chăm', khoang: 'bậc 8–12' },
]
function ThangBacChieu({ dem }: { dem: DemThang }) {
  return (
    <div className="ddc-thang" role="group" aria-label="Số em có mặt ở mỗi bậc, từ Lười đến Chăm">
      {NHOM_THANG.map((g) => (
        <span key={g.n} className="ddc-thang-nhom" data-n={g.n}>
          {g.ten}{' '}
          <small>
            {g.khoang} · {soNhom(dem.nhom, g.k)} em
          </small>
        </span>
      ))}
      <span className="ddc-thang-nhom" data-n="moi">
        Mới
      </span>
      {BAC_CHAM_CHI.map((b, i) => {
        const n = dem.bac[i] ?? 0
        return (
          <div key={b.so} className="ddc-bac-cot bcc" data-bac={b.so} data-khong={n ? undefined : ''} style={{ '--be': caoBe(b.so) } as CSSProperties} title={`${chuBac(b)}: ${n} em`}>
            <span className="ddc-bac-o">
              <HuyHieuBac bac={b.so} co={44} />
              <span className="ddc-bac-chu">
                <small>Bậc {b.so}</small>
                <b>
                  {n} <small>em</small>
                </b>
              </span>
              <span className="sr-only"> ở {chuBac(b)}</span>
            </span>
            <i className="ddc-bac-be" aria-hidden="true" />
          </div>
        )
      })}
      <div className="ddc-bac-cot" data-moi="" data-khong={dem.chuaXep ? undefined : ''} style={{ '--be': caoBe(0) } as CSSProperties} title={`Chưa xếp bậc: ${dem.chuaXep} em`}>
        <span className="ddc-bac-o">
          <HuyHieuMoi />
          <span className="ddc-bac-chu">
            <small>Mới</small>
            <b>
              {dem.chuaXep} <small>em</small>
            </b>
          </span>
          <span className="sr-only"> chưa xếp bậc</span>
        </span>
        <i className="ddc-bac-be" aria-hidden="true" />
      </div>
    </div>
  )
}

function VinhDanh({ d }: { d: DauLop | null }) {
  const b = d?.dau.bacCham
  const m = b ? motBac(b.bac) : null
  if (!d || !b || !m)
    return (
      <section className="ddc-vinh" data-trong="" aria-label="Bậc cao nhất lớp">
        <span className="ddc-vinh-nhan">Bậc cao nhất lớp</span>
        <p className="ddc-vinh-cho">Em đã xếp bậc vào điểm danh là tên hiện ở đây.</p>
      </section>
    )
  const s = soThe(d.dau)
  return (
    <section className="ddc-vinh" aria-label="Bậc cao nhất lớp">
      <span className="ddc-vinh-nhan">Bậc cao nhất lớp</span>
      <span className="ddc-vinh-hh bcc" data-bac={m.so} aria-hidden="true">
        <HuyHieuBac bac={m.so} co={112} />
      </span>
      <b className="ddc-vinh-ten">{d.dau.hoTen || `SBD ${d.dau.sbd}`}</b>
      <span className="ddc-vinh-bac">{chuBac(m)}</span>
      <dl className="ddc-vinh-so">
        <div>
          <dt>Điểm chăm</dt>
          <dd>
            {b.diem}
            <small>/100</small>
          </dd>
        </div>
        <div>
          <dt>Chuỗi ngày</dt>
          <dd>{s?.chuoi ?? 0}</dd>
        </div>
        <div>
          <dt>Ngày đủ mức</dt>
          <dd>{s?.du ?? '—'}</dd>
        </div>
      </dl>
      {d.sau.length > 0 && (
        <div className="ddc-vinh-sau">
          <span className="ddc-vinh-sau-nhan">Theo sát phía sau</span>
          <ol>
            {d.sau.map((e) => (
              <li key={e.sbd}>
                <HuyHieuBac bac={e.bacCham!.bac} co={32} />
                <b>{e.hoTen || `SBD ${e.sbd}`}</b>
                <span>
                  Bậc {e.bacCham!.bac} · điểm chăm {e.bacCham!.diem}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function TheEm({ e, vua, noi, coBac, coNhip, onMoEm }: { e: EmBuoi; vua: boolean; noi: boolean; coBac: boolean; coNhip: boolean; onMoEm: PropsBanChieu['onMoEm'] }) {
  const k = khoaNhom(e)
  const b = e.bacCham
  const m = b ? motBac(b.bac) : null
  const s = soThe(e)
  const ten = e.hoTen || `SBD ${e.sbd}`
  const gio = gioDd(e.luc)
  const thoat = s && s.thoatLuoi !== null ? (
    <span className="ddc-the-thoat">
      Thoát Lười{' '}
      <b>
        {s.thoatLuoi}/{NGAY_LIEN_THOAT_LUOI}
      </b>
    </span>
  ) : s ? (
    <span>
      Chuỗi <b>{s.chuoi}</b> ngày
    </span>
  ) : null
  const du = s ? (
    <span>
      Đủ mức <b>{s.du}</b> ngày
    </span>
  ) : null
  return (
    <button
      type="button"
      className={`ddc-em${m ? ' bcc' : ''}`}
      data-bac={m?.so}
      data-nhom={k}
      data-moi={vua ? '' : undefined}
      data-noi={noi ? '' : undefined}
      data-sbd={e.sbd}
      title={`${ten}${gio ? ` · điểm danh lúc ${gio}` : ''}`}
      onClick={(ev) => onMoEm(e, ev.currentTarget)}
      aria-label={nhanEm(e)}
    >
      <span className="ddc-the-hh" aria-hidden="true">
        {m ? (
          <>
            <HuyHieuBac bac={m.so} co={64} />
            <span className="ddc-the-so">{m.so}</span>
          </>
        ) : k === 'moi' || k === 'chua-co' ? (
          <HuyHieuMoi />
        ) : (
          <span className="ddc-cham" />
        )}
      </span>
      <span className="ddc-em-chu">
        <b data-dai={ten.length > 14 ? '' : undefined}>{ten}</b>
        <span className="ddc-the-bac" data-dai={m && m.ten.length > 20 ? '' : undefined}>
          {m ? m.ten : k === 'moi' ? (coBac ? 'Chưa xếp bậc' : 'Mới vào lớp') : k === 'chua-co' ? `Điểm danh ${gio}` : `Nhóm ${TEN_NHOM[k]}`}
        </span>
        {m && b ? (
          <>
            <span className="ddc-the-dong ddc-the-dong--2">
              <span>
                Điểm chăm <b>{b.diem}</b>
              </span>
              {thoat}
            </span>
            <span className="ddc-the-dong">{du}</span>
          </>
        ) : k === 'moi' && e.nhip ? (
          <>
            <span className="ddc-the-dong">
              <span>
                Đã có số{' '}
                <b>
                  {e.nhip.soNgayQua}/{LUAT_NHOM_NHIP.soNgayToiThieu}
                </b>{' '}
                ngày
              </span>
            </span>
            <span className="ddc-the-dong">
              <span>
                Đủ {LUAT_NHOM_NHIP.soNgayToiThieu} ngày sẽ {coBac ? 'có bậc' : 'xếp nhóm'}
              </span>
            </span>
          </>
        ) : k === 'chua-co' ? (
          coNhip ? (
            <span className="ddc-the-dong">
              <span>Chưa có số nhịp học</span>
            </span>
          ) : null
        ) : (
          <>
            <span className="ddc-the-dong">{du}</span>
            <span className="ddc-the-dong">{thoat}</span>
          </>
        )}
      </span>
      {b && (
        <span className="ddc-the-diem" aria-hidden="true">
          <i style={{ transform: `scaleX(${Math.max(0, Math.min(100, b.diem)) / 100})` }} />
        </span>
      )}
      {vua && (
        <span className="ddc-the-vua" aria-hidden="true">
          Vừa vào
        </span>
      )}
    </button>
  )
}

function ChieuDiemDanh({ tt, tk, nhip, goc, matKetNoi, onMoEm, onDoiCheDo, onThuLaiNhip, nutDong }: PropsBanChieu & { nutDong: ReactNode }) {
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
  const dau = useMemo(() => (coBac ? dauLop(luoi) : null), [coBac, luoi])
  const luoiRef = useRef<HTMLUListElement>(null)
  const noiRef = useRef<HTMLDivElement>(null)
  const noi = useTheNoi(tk.coMat, luoiRef, noiRef)
  const emNoi = noi ? (tk.coMat.find((e) => e.sbd === noi.sbd) ?? null) : null
  const siSo = tt.siSo
  const soCoMat = tk.coMat.length
  const co = coLuoiThe(luoi.length)
  const dem = tk.demCoMat
  const conLai = siSo ? Math.max(0, siSo - soCoMat) : null
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
          <span className="ddc-co-mat">
            <span className="ddc-nhan-so">Có mặt</span>
            <b className="ddc-so-lon" role="status" aria-label={`Có mặt ${soCoMat}${siSo ? ` trên ${siSo}` : ''} em`}>
              {soCoMat}
              {siSo ? <small>/{siSo}</small> : <small> em</small>}
            </b>
            {siSo ? (
              <span className="ddc-co-mat-phai">
                <span className="ddc-vach" aria-hidden="true">
                  <i style={{ width: `${Math.min(100, (100 * soCoMat) / siSo)}%` }} />
                </span>
                <span className="ddc-con-lai">{conLai ? `còn ${conLai} em chưa điểm danh` : 'đủ cả lớp'}</span>
              </span>
            ) : null}
          </span>
          {nutDong}
        </div>
      </header>

      <div className="ddc-than-a" data-co-bac={coBac ? '' : undefined}>
        <div className="ddc-trai">
          <section className="ddc-ma-khung" aria-label="Mã điểm danh">
            <span className="ddc-ma-huong">Mở app học sinh › Điểm danh</span>
            <span className="ddc-ma-nho">{ve ? 'Gõ mã buổi hoặc quét mã QR' : 'Gõ mã buổi'}</span>
            <b className="ddc-ma" aria-label={`Mã điểm danh ${ma}`} aria-live="polite">
              {xong ? '— — —' : ma ? dinhDangMa(ma) : '……'}
            </b>
            <span className="ddc-ma-nho">{xong ? 'Buổi đã kết thúc — mã hết hiệu lực' : 'Mã đổi mỗi phút · mỗi em chỉ điểm danh cho chính mình'}</span>
            {ve && (
              <>
                <svg className="ddc-qr" viewBox={`0 0 ${ve.canh} ${ve.canh}`} role="img" aria-label="Mã QR điểm danh" shapeRendering="crispEdges">
                  <rect width={ve.canh} height={ve.canh} className="ddc-qr-nen" />
                  <path d={ve.d} className="ddc-qr-o" />
                </svg>
              </>
            )}
            <p className="ddc-ma-ghi">
              App học sinh: <b>{diaChi}</b>
            </p>
          </section>
          {coBac && <VinhDanh d={dau} />}
        </div>

        <section className="ddc-phai" aria-label="Em đã điểm danh" data-noi={emNoi ? '' : undefined}>
          {coBac ? (
            <ThangBacChieu dem={thang} />
          ) : coNhip ? (
            <div className="ddc-ds-dau">
              <h2 className="ddc-h2">
                Đã điểm danh · {soCoMat} em
                {conLai !== null && conLai > 0 && <small> · còn {conLai} em chưa điểm danh</small>}
              </h2>
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
            </div>
          ) : (
            <NhipChuaCo nhip={nhip} onThuLai={onThuLaiNhip} />
          )}
          {soCoMat === 0 ? (
            <p className="ddc-rong">Chưa em nào điểm danh. Màn tự cập nhật mỗi 5 giây.</p>
          ) : (
            <ul
              ref={luoiRef}
              className="ddc-luoi"
              data-kieu={co.kieu}
              data-cot={co.cot}
              style={{ '--cot': co.cot, '--hang': co.hang } as CSSProperties}
              aria-label="Bấm tên em để mở hồ sơ làm bài"
            >
              {luoi.map((e) => (
                <li key={e.sbd} className="ddc-luoi-o">
                  <TheEm e={e} vua={vua.has(e.sbd)} noi={emNoi?.sbd === e.sbd} coBac={coBac} coNhip={coNhip} onMoEm={onMoEm} />
                </li>
              ))}
            </ul>
          )}
          {emNoi && noi && <TheNoiVua e={emNoi} pha={noi.pha} dich={noi.dich} coBac={coBac} gocRef={noiRef} />}
        </section>
      </div>

      <footer className="ddc-chan">
        {coBac ? (
          <p className="ddc-chan-luat">
            <b>Điểm chăm 0–100</b> tính từ số ngày đủ mức (ngày gần tính nặng hơn), số câu đã làm so với mức và chuỗi ngày · Lười bậc 1–5 (thoát khi đủ mức{' '}
            {NGAY_LIEN_THOAT_LUOI} ngày liền) · Chưa đều 6–7 · Chăm 8–{SO_BAC} · Bậc {SO_BAC} cần chuỗi đủ mức từ 7 ngày
          </p>
        ) : (
          <>
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
          </>
        )}
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

function ChieuNhipLop({ tt, tk, nhip, matKetNoi, onMoEm, onDoiCheDo, onSangDauGio, onThuLaiNhip, nutDong, anLuoi, onDoiAn }: PropsBanChieu & { nutDong: ReactNode; anLuoi: boolean; onDoiAn: () => void }) {
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
          <ul className="ddc-cot-ds" data-hai-cot={soCot === 2 ? '' : undefined} style={{ '--cot': soCot, '--hang': soHang } as CSSProperties}>
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
