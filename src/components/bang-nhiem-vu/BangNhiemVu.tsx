// MÀN DUY NHẤT "Bảng nhiệm vụ" — dùng chung cho app học sinh và app phụ huynh.
// Đúng 5 vùng: (1) đầu trang có thần thú, (2) thẻ "Làm ngay" duy nhất, (3) danh
// sách 4 bậc, (4) nút Vào thi, (5) vinh danh top 3 — trên nền động tinh tế.
// Màn này KHÔNG xếp việc, không tính điểm, không gọi API nhiệm vụ: nhận
// `DuLieuBangNhiemVu` từ `nhiem-vu-adapter` và chỉ vẽ.
import TheBoNao from './TheBoNao'
import TheCanhBaoThay from './TheCanhBaoThay'
import TheThuThachRieng from './TheThuThachRieng'
import GiaoThemChoCon from './GiaoThemChoCon'
import type { ViewGiaoThem } from '../../lib/use-giao-them'
import type { ViewThiDua } from '../../lib/use-thi-dua'
import OThiDua from './OThiDua'
import TheVeDich from './TheVeDich'
import { ngayVuaTraXong, type VeDichView } from '../../lib/ve-dich-hien-thi'
import TheChoAn, { viewChoAn } from './TheChoAn'
import type { ThuThachRieng } from '../../lib/thu-thach-rieng'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import type { BoNaoPhuHuynh } from '../../lib/bo-nao-hien-thi'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, ChevronRight, ClipboardCheck, Compass, PawPrint, RefreshCw, Shield, ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { chuDangCho } from '../../lib/hang-doi-nop'
import { chuCuaHang } from '../../game/than-thu-v2/shop/chu-shop'
import { boGameChoPhuHuynh, sachBoNaoChoPhuHuynh, type DuLieuBangNhiemVu, type HanhDongNhiemVu, type TheNhiemVu } from '../../lib/nhiem-vu-adapter'
import type { SpiritMotion } from '../../game/than-thu-v2/Spirit2D'
import DauTrang, { type MucMenu, type ThanThuGoc } from './DauTrang'
import TheLamNgay from './TheLamNgay'
import DanhSachNhiemVu, { DanhSachQuaHan, HangTonCu } from './DanhSachNhiemVu'
import TheVinhDanh, { type DuLieuVinhDanh } from './TheVinhDanh'
import NutVaoThi from './NutVaoThi'
import './m3-theme.css'
import './bang-nhiem-vu.css'
import './NenDong.css'

export type { MucMenu, ThanThuGoc }


/** Cho phép chuyển động khi máy KHÔNG xin giảm chuyển động và KHÔNG yếu pin.
 *  `navigator.getBattery` không có (Safari, Firefox) thì bỏ qua vế pin. */
export function useChoPhepChuyenDong(): boolean {
  const [giam, setGiam] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
  const [pinYeu, setPinYeu] = useState(false)
  useEffect(() => {
    let mq: MediaQueryList | undefined
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {}
    const doi = () => setGiam(!!mq?.matches)
    mq?.addEventListener?.('change', doi)

    let pin: any
    let huy = false
    const xemPin = () => setPinYeu(!!pin && !pin.charging && pin.level <= 0.2)
    const layPin = (navigator as any).getBattery
    if (typeof layPin === 'function') {
      void layPin
        .call(navigator)
        .then((b: any) => {
          if (huy) return
          pin = b
          xemPin()
          b.addEventListener?.('levelchange', xemPin)
          b.addEventListener?.('chargingchange', xemPin)
        })
        .catch(() => {})
    }
    return () => {
      huy = true
      mq?.removeEventListener?.('change', doi)
      pin?.removeEventListener?.('levelchange', xemPin)
      pin?.removeEventListener?.('chargingchange', xemPin)
    }
  }, [])
  return !giam && !pinYeu
}

function tatCaViec(d: DuLieuBangNhiemVu): TheNhiemVu[] {
  return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)]
}

/** Việc "mở Bài tập về nhà" đúng bài của một cảnh báo (khớp mã bài hoặc mã ca). Không có ⇒ undefined (thẻ không dựng nút Làm ngay). */
function viecCuaCanhBao(ds: TheNhiemVu[], cb: CanhBaoThay): TheNhiemVu | undefined {
  if (!cb.maBtvn) return undefined
  return ds.find((v) => {
    if (v.hanhDong.loai !== 'mo_btvn') return false
    const bt = (v.hanhDong.payload as { bt?: { maBtvn?: unknown; maCa?: unknown } } | undefined)?.bt
    return !!bt && (bt.maBtvn === cb.maBtvn || bt.maCa === cb.maBtvn)
  })
}

export interface BangNhiemVuProps {
  vaiTro: 'hocsinh' | 'phuhuynh'
  hoTen: string
  now: number
  duLieu: DuLieuBangNhiemVu
  /** Dữ liệu nhiệm vụ chưa về ⇒ vẽ skeleton, không vẽ thẻ trống. */
  dangTai?: boolean
  mucMenu?: MucMenu[]
  /** Chỗ đặt chuông thông báo… ở thanh trên, bên trái menu ba chấm. */
  khePhai?: ReactNode
  caDangMo?: boolean
  /** Một dòng nói thật về phần dữ liệu app CHƯA có (vd. phụ huynh chưa có danh sách BTVN của con). */
  ghiChuNguon?: string
  /** Máy chủ đang làm mới (reset): vẽ một dải thông báo nhẹ; phần còn lại của màn giữ nguyên. */
  dangLamMoi?: boolean
  /** Số bài đã lưu ở máy đang chờ máy chủ nhận (hàng đợi nộp lại tự động). 0/vắng ⇒ không hiện dải. */
  dangChoNop?: number
  /** Bấm "Cửa hàng" (dưới đầu trang) ⇒ mở thẳng Cửa hàng phụ kiện. Chỉ hiện khi máy chủ báo `thanThu.shopBat` (cờ tắt ⇒ không có nút). App phụ huynh không có. */
  onMoShop?: () => void
  onHanhDong?: (hanhDong: HanhDongNhiemVu) => void
  onMoThanThu?: () => void
  /** Mở game ở màn Đoàn Hộ Tống. Thẻ mời chỉ hiện khi CÓ hàm này, là học sinh, và máy chủ báo `duLieu.doanMo === true`. */
  onLenDuongDoan?: () => void
  onVaoThi?: () => void
  onXemBaiDaNop?: () => void
  taiVinhDanh?: () => Promise<DuLieuVinhDanh | null>
  /** Lời cho phụ huynh + thư tuần của "Bộ não A.I" (lệnh riêng /ph/ke-hoach). Học sinh KHÔNG nhận qua đây (lời của em đi theo `duLieu.boNao`). */
  boNaoPh?: BoNaoPhuHuynh | null
  /** Chỗ đặt thẻ "Ca kiểm tra gần nhất của con" (chỉ phụ huynh): ngay dưới khối tiến độ, trên việc hôm nay. */
  theCaGanNhat?: ReactNode
  /** Ô "Thi đua hôm nay" (chỉ học sinh; phương án 8A): ngay dưới khối tiến độ, trên việc hôm nay. Màn cha truyền vào; thiếu dữ liệu ⇒ không dựng. */
  thiDua?: ViewThiDua
  /** MỘT nút "Giao thêm bài cho con" (phụ huynh) — nút hành động DUY NHẤT của app phụ huynh. Vắng ⇒ không dựng. */
  giaoThem?: ViewGiaoThem
  /** Chân màn phụ huynh: "Đổi số báo danh" (chữ nhỏ, cuối màn). Vắng ⇒ không dựng. */
  onDoiSbd?: () => void
  /** "Cảnh báo của thầy" của PHỤ HUYNH (lời cho phụ huynh, lệnh /ph/ke-hoach). Học sinh nhận qua `duLieu.canhBaoThay`. */
  canhBaoPh?: CanhBaoThay[]
  /** Em/phụ huynh bấm "Đã xem" (hoặc "Làm ngay") ở một cảnh báo ⇒ màn cha báo máy chủ. */
  onCanhBaoDaXem?: (cb: CanhBaoThay) => void
  /** "Làm mấy câu này": mở màn ôn câu với đúng câu máy chủ chọn cho thử thách (nguồn `thu_thach_rieng`). Vắng ⇒ không dựng thẻ mời. */
  onLamThuThach?: (t: ThuThachRieng) => void
  /** "Để sau": màn cha nhớ ẩn thẻ tới ngày mai (thẻ biến mất khỏi `duLieu.thuThachRieng`). */
  onDeSauThuThach?: (t: ThuThachRieng) => void
}

export default function BangNhiemVu({
  vaiTro,
  hoTen,
  now,
  duLieu: duLieuGoc,
  dangTai = false,
  mucMenu = [],
  khePhai,
  caDangMo = false,
  ghiChuNguon,
  dangLamMoi,
  dangChoNop = 0,
  onMoShop,
  onHanhDong,
  onMoThanThu,
  onLenDuongDoan,
  onVaoThi,
  onXemBaiDaNop,
  taiVinhDanh,
  boNaoPh: boNaoPhGoc,
  theCaGanNhat,
  thiDua,
  giaoThem,
  canhBaoPh,
  onCanhBaoDaXem,
  onDoiSbd,
  onLamThuThach,
  onDeSauThuThach,
}: BangNhiemVuProps) {
  const laPh = vaiTro === 'phuhuynh'
  const choDong = useChoPhepChuyenDong()
  // APP PHỤ HUYNH KHÔNG CÒN GÌ CỦA GAME (thầy 21/09): dữ liệu vào từ MỌI chỗ (bản mới, bản nhớ, test) đều bị gỡ thần thú/EXP/khiên/Đoàn ở ĐÂY, một cửa duy nhất;
  // việc "luyện dạng còn yếu" đọc thành "Luyện dạng con còn vấp". Học sinh giữ nguyên. Xem `boGameChoPhuHuynh` (nhiem-vu-adapter.ts).
  const duLieu = useMemo(() => (laPh ? boGameChoPhuHuynh(duLieuGoc) : duLieuGoc), [laPh, duLieuGoc])
  const boNaoPh = useMemo(() => (laPh ? sachBoNaoChoPhuHuynh(boNaoPhGoc) : boNaoPhGoc), [laPh, boNaoPhGoc])

  // Thần thú mừng 1,2 s khi em vừa làm thêm được câu TRONG phiên này.
  const [dongThu, setDongThu] = useState<SpiritMotion>('idle')
  const daLamTruoc = useRef<number | null>(null)
  useEffect(() => {
    if (dangTai) return
    const truoc = daLamTruoc.current
    daLamTruoc.current = duLieu.tienDo.daLam
    if (laPh || truoc === null || duLieu.tienDo.daLam <= truoc) return
    setDongThu('victory')
    const t = setTimeout(() => setDongThu('idle'), 1200)
    return () => clearTimeout(t)
  }, [dangTai, duLieu.tienDo.daLam, laPh])

  // Vừa xong việc hôm nay (thẻ mừng hiện lần đầu): thần thú vui 1,6 s rồi trở lại nhịp thường.
  const daXong = !dangTai && !!duLieu.daXongHomNay
  useEffect(() => {
    if (!daXong || laPh) return
    setDongThu('victory')
    const t = setTimeout(() => setDongThu('idle'), 1600)
    return () => clearTimeout(t)
  }, [daXong, laPh])

  // "+EXP" vừa nhận (khoản MỚI trong đúng lần gọi này): hiện một băng 12 s, chữ NGUYÊN VĂN của máy chủ; thiếu trường ⇒ không hiện gì.
  const khoaNhan = `${duLieu.expNhan.map((x) => `${x.exp}:${x.ghiChu}`).join('|')}#${duLieu.manhNhan.map((x) => `${x.so}:${x.ghiChu}`).join('|')}`
  const [khoaDaAn, setKhoaDaAn] = useState('')
  useEffect(() => {
    if (khoaNhan === '#' || dangTai) return
    const t = setTimeout(() => setKhoaDaAn(khoaNhan), 12000)
    return () => clearTimeout(t)
  }, [khoaNhan, dangTai])
  const coBaoNhan = !dangTai && !laPh && khoaNhan !== '#' && khoaNhan !== khoaDaAn
  const tongExpMoi = duLieu.expNhan.reduce((t, x) => t + x.exp, 0)

  // Máy chủ nói RÕ em chưa chọn thần thú (`thanThu: null`) — vd sáng sau khi đặt lại mùa: thẻ mời nổi bật đầu bảng. Không hiện khi chưa biết.
  const chuaChonThu = !dangTai && !laPh && duLieu.thanThu.kieu === 'chua_chon'
  // Thẻ mời game Đoàn Hộ Tống: chỉ học sinh, chỉ khi máy chủ báo game mở cho em. Em chưa chọn thú vẫn thấy: game tự mở màn chọn thú có lời mời.
  const theDoan =
    !dangTai && !laPh && duLieu.doanMo === true && onLenDuongDoan ? (
      <button type="button" className="bnv-doan" data-vung="doan-ho-tong" onClick={onLenDuongDoan} aria-label="Lên đường cùng Đoàn Hộ Tống">
        <span className="bnv-doan-bt" aria-hidden="true">
          <Compass size={28} />
        </span>
        <span className="bnv-doan-chu">
          <span className="bnv-doan-ten">Lên đường cùng Đoàn Hộ Tống</span>
          <span className="bnv-doan-phu">{chuaChonThu ? 'Em chọn một thần thú rồi cùng cả lớp hộ tống Linh Tâm.' : 'Cả lớp cùng hộ tống Linh Tâm. Chạm để vào Sảnh.'}</span>
        </span>
        <ChevronRight size={24} aria-hidden="true" />
      </button>
    ) : null

  const chon = (viec: TheNhiemVu) => onHanhDong?.(viec.hanhDong)
  const { tienDo, tocDo } = duLieu
  const viec = tatCaViec(duLieu)
  // Nút của ô Thi đua dẫn tới việc CHƯA XONG đầu tiên (không bị cổng); hết việc ⇒ Đảo thần thú (Boss 21/09).
  const viewChoAnHs = laPh ? null : viewChoAn(duLieu)
  // "Đường về đích": so hai lần nạp liên tiếp ⇒ ngày nợ VỪA TRẢ XONG (gạch tên ngày ~8 giây; tắt hoạt ảnh khi giảm chuyển động ở CSS). Vắng `veDich` ⇒ không thẻ.
  const veDichTruoc = useRef<VeDichView | null>(null)
  const [ngayVuaTra, setNgayVuaTra] = useState<string | null>(null)
  useEffect(() => {
    if (laPh || !duLieu.veDich) return
    const n = ngayVuaTraXong(veDichTruoc.current, duLieu.veDich)
    veDichTruoc.current = duLieu.veDich
    if (!n) return
    setNgayVuaTra(n)
    const t = setTimeout(() => setNgayVuaTra(null), 8000)
    return () => clearTimeout(t)
  }, [laPh, duLieu.veDich])
  const lamViecDau = () => {
    const dau = viec.find((x) => !x.biCong)
    if (dau) chon(dau)
    else onMoThanThu?.()
  }
  const conLai = Math.max(0, tienDo.mucTieu - tienDo.daLam)


  return (
    <div
      className={`bnv bnv--${vaiTro} ${choDong ? 'bnv--dong' : ''}`}
      data-chuyen-dong={choDong ? 'bat' : 'tat'}
      data-nguon={duLieu.nguon}
    >
      <div className={`bnv-nen ${choDong ? 'bnv-nen--dong' : ''}`} aria-hidden="true" data-vung="nen">
        <div className="bnv-nen-lop bnv-nen-lop-1" />
        <div className="bnv-nen-lop bnv-nen-lop-2" />
      </div>

      <main className="bnv-than">
        <DauTrang
          vaiTro={vaiTro}
          hoTen={hoTen}
          now={now}
          chuoiNgay={duLieu.chuoiNgay}
          thanThu={duLieu.thanThu}
          dongThu={dongThu}
          tatChuyenDong={!choDong}
          nghi={!dangTai && duLieu.trong}
          onMoThanThu={laPh ? undefined : onMoThanThu}
          mucMenu={mucMenu}
          khePhai={khePhai}
        />

        {!laPh && onMoShop && duLieu.thanThu.kieu === 'co' && duLieu.thanThu.shopBat === true && (
          <div className="bnv-trong-nut" data-vung="cua-hang">
            <button type="button" className="bnv-nut-vien" data-vung="mo-cua-hang" onClick={onMoShop}>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>{chuCuaHang}</span>
            </button>
          </div>
        )}

        {dangChoNop > 0 && (
          <div className="bnv-dang-lam-moi" role="status" data-vung="dang-cho-nop">
            <RefreshCw size={22} aria-hidden="true" />
            <div className="bnv-dang-lam-moi-chu">
              <p className="bnv-dang-lam-moi-ten">{chuDangCho(dangChoNop)}</p>
              <p className="bnv-dang-lam-moi-phu">{laPh ? 'Con' : 'Em'} cứ để app mở, app tự gửi khi máy chủ rảnh.</p>
            </div>
          </div>
        )}

        {!dangTai && dangLamMoi && (
          <div className="bnv-dang-lam-moi" role="status" data-vung="dang-lam-moi">
            <RefreshCw size={22} aria-hidden="true" />
            <div className="bnv-dang-lam-moi-chu">
              <p className="bnv-dang-lam-moi-ten">
                Hệ thống đang làm mới, khoảng <span className="bnv-dang-lam-moi-so">1–5 phút</span>.
              </p>
              <p className="bnv-dang-lam-moi-phu">{laPh ? 'Con' : 'Em'} cứ để app mở, app tự vào lại.</p>
            </div>
          </div>
        )}

        {dangTai ? (
          <div aria-busy="true" aria-label="Đang tải việc hôm nay" style={{ display: 'grid', gap: 16 }}>
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--lon" />
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--the" />
          </div>
        ) : (
          <>
            {/* Cảnh báo của thầy: nổi bật ở ĐẦU bảng; không có ⇒ không dựng gì. Học sinh: lời cho em (`duLieu.canhBao`); phụ huynh: lời cho phụ huynh (`canhBaoPh`). */}
            <TheCanhBaoThay
              vaiTro={vaiTro}
              now={now}
              canhBao={(laPh ? canhBaoPh : duLieu.canhBaoThay) ?? []}
              coTheLam={(cb) => !!viecCuaCanhBao(viec, cb)}
              onLam={(cb) => {
                const v = viecCuaCanhBao(viec, cb)
                if (v) chon(v)
              }}
              onDaXem={onCanhBaoDaXem}
            />
            {chuaChonThu &&
              (!onMoThanThu ? (
                <section className="bnv-chon-thu bnv-chon-thu--doc" data-vung="chon-than-thu" aria-label="Em chưa chọn thần thú">
                  <span className="bnv-chon-thu-bt" aria-hidden="true">
                    <PawPrint size={28} />
                  </span>
                  <div className="bnv-chon-thu-chu">
                    <h2>Em chưa chọn thần thú</h2>
                    <p>Em mở game để chọn một bạn đồng hành.</p>
                  </div>
                </section>
              ) : (
                <button type="button" className="bnv-chon-thu" data-vung="chon-than-thu" onClick={onMoThanThu} aria-label="Chọn thần thú của em">
                  <span className="bnv-chon-thu-bt" aria-hidden="true">
                    <PawPrint size={28} />
                  </span>
                  <span className="bnv-chon-thu-chu">
                    <span className="bnv-chon-thu-ten">Chọn thần thú của em</span>
                    <span className="bnv-chon-thu-phu">Em chưa có thần thú. Chạm để chọn một bạn đồng hành học cùng em.</span>
                  </span>
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
              ))}
            {coBaoNhan && (
              <section className="bnv-exp-moi" role="status" aria-label="Vừa nhận EXP" data-vung="exp-moi">
                <Zap size={20} aria-hidden="true" />
                <div className="bnv-exp-moi-chu">
                  {tongExpMoi > 0 && <b>+{tongExpMoi} EXP học tập</b>}
                  {duLieu.expNhan.map((x, i) => (
                    <span key={`e${i}`}>{x.ghiChu}</span>
                  ))}
                  {duLieu.manhNhan.map((x, i) => (
                    <span key={`m${i}`}>{x.ghiChu}</span>
                  ))}
                </div>
                <button type="button" className="bnv-exp-an" onClick={() => setKhoaDaAn(khoaNhan)} aria-label="Ẩn thông báo EXP">
                  Ẩn
                </button>
              </section>
            )}
            {/* "ĐƯỜNG VỀ ĐÍCH" (chỉ học sinh): ngay dưới lời chào, TRÊN tiến độ. Số nợ/giờ muộn nhất là của máy chủ; nút dẫn tới việc CHƯA XONG đầu tiên. Vắng `veDich` ⇒ không dựng. */}
            {!laPh && duLieu.veDich && !dangTai && (
              <TheVeDich v={duLieu.veDich} now={now} onLam={lamViecDau} soViecConLai={duLieu.daXongHomNay ? 0 : viec.filter((x) => x.bac === 'khan' || x.bac === 'bat_buoc').length} ngayVuaTra={ngayVuaTra} />
            )}
            <section className="bnv-tien-do" aria-label="Tiến độ hôm nay" data-vung="tien-do">
              <div className="bnv-tien-do-dau">
                <span className="bnv-tien-do-so">
                  {laPh ? 'Con đã làm' : 'Hôm nay:'} {tienDo.daLam}/{tienDo.mucTieu} câu
                </span>
                {!laPh && <span className="bnv-chu-phu">{tocDo.chu}</span>}
              </div>
              <div
                className="bnv-thanh"
                role="progressbar"
                aria-label="Số câu đã làm so với mức gợi ý hôm nay"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={tienDo.phanTram}
              >
                <div className="bnv-thanh-day" style={{ width: `${tienDo.phanTram}%` }} />
              </div>
              {laPh ? (
                <div className="bnv-o-so">
                  <div>
                    <span className="bnv-o-so-gia">{viec.length}</span>
                    <span className="bnv-chu-phu">việc hôm nay</span>
                  </div>
                  <div>
                    <span className="bnv-o-so-gia">{conLai}</span>
                    <span className="bnv-chu-phu">câu tới mức gợi ý</span>
                  </div>
                  <div>
                    <span className="bnv-o-so-gia">{tocDo.giayMoiCau ? `${tocDo.giayMoiCau} giây` : '—'}</span>
                    <span className="bnv-chu-phu">{tocDo.giayMoiCau ? 'mỗi câu, trung bình 30 ngày gần đây' : tocDo.chu}</span>
                  </div>
                </div>
              ) : (
                <span className="bnv-chu-phu">
                  {tienDo.ghiChu ?? (conLai > 0 ? `Còn ${conLai} câu là tới mức gợi ý hôm nay` : 'Em đã tới mức gợi ý hôm nay')}
                </span>
              )}
              {laPh && tienDo.ghiChu && <span className="bnv-chu-phu">{tienDo.ghiChu}</span>}
              {duLieu.ngayNghi && (
                <span className="bnv-chu-phu" data-vung="ngay-nghi">
                  Hôm nay là ngày nghỉ · chuỗi không đứt
                </span>
              )}
              {duLieu.canhBao.map((c) => (
                <span key={`${c.loai}:${c.noiDung}`} className="bnv-chu-phu" data-vung="canh-bao" data-loai={c.loai}>
                  {c.noiDung}
                </span>
              ))}
              {duLieu.ghiChuCu && (
                <span className="bnv-chu-phu" data-vung="ke-hoach-cu">
                  {duLieu.ghiChuCu}
                </span>
              )}
              {ghiChuNguon && (
                <span className="bnv-chu-phu" data-vung="ghi-chu-nguon">
                  {ghiChuNguon}
                </span>
              )}
            </section>

            {/* THẺ "CA KIỂM TRA GẦN NHẤT CỦA CON" (chỉ phụ huynh, thầy lệnh 21/09): ngay dưới thanh tiến độ, TRÊN việc hôm nay. Màn cha truyền vào; không có ca nào ⇒ không thẻ. */}
            {laPh && theCaGanNhat}

            {/* LỜI NHẮC "CHO ĂN" (Đợt 1 thần thú mỗi ngày; chỉ học sinh): ống nghiệm có EXP + hôm nay thú còn ăn được ⇒ một thẻ dẫn vào Đảo (nơi có nút nạp). Thiếu số của máy chủ ⇒ không thẻ. */}
            {!laPh && onMoThanThu && viewChoAnHs && <TheChoAn v={viewChoAnHs} onMo={onMoThanThu} />}

            {/* Ô "THI ĐUA HÔM NAY" (chỉ học sinh; 8A): ngay dưới thanh tiến độ, TRÊN việc hôm nay. */}
            {!laPh && thiDua && <OThiDua v={thiDua} onLam={lamViecDau} />}

            {/* THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I, thầy chốt 21/09): ngay dưới thanh tiến độ, TRÊN việc hôm nay. Chỉ học sinh; không thử thách hợp lệ ⇒ không dựng. */}
            {!laPh && duLieu.thuThachRieng && (duLieu.thuThachRieng.trangThai === 'xong' || (onLamThuThach && onDeSauThuThach)) && (
              <TheThuThachRieng thuThach={duLieu.thuThachRieng} hoTen={hoTen} onLam={(t) => onLamThuThach?.(t)} onDeSau={(t) => onDeSauThuThach?.(t)} />
            )}

            {duLieu.trong ? (
              <>
              <section className="bnv-trong" aria-label="Hôm nay chưa có việc" data-vung="trong">
                <h2>{laPh ? (ghiChuNguon ? 'Chưa có bài gia đình giao nào đang chờ' : 'Hôm nay con chưa có việc') : chuaChonThu ? 'Hôm nay chưa có việc' : 'Hôm nay chưa có việc — thần thú đang nghỉ'}</h2>
                <p>
                  {laPh
                    ? 'Không có bài gia đình giao nào đang chờ con.'
                    : chuaChonThu
                      ? 'Thầy chưa giao bài và em không có bài nào đang chờ. Em chọn thần thú ở trên để luyện thêm, hoặc xem lại bài đã nộp.'
                      : 'Thầy chưa giao bài và em không có bài nào đang chờ. Em có thể luyện thêm với thần thú hoặc xem lại bài đã nộp.'}
                </p>
                {!laPh && (
                  <div className="bnv-trong-nut">
                    {/* Chưa có thần thú thì KHÔNG mời "luyện với thần thú" (không có con nào): thẻ "Chọn thần thú của em" ở đầu bảng là lối duy nhất. */}
                    {onMoThanThu && !chuaChonThu && (
                      <button type="button" className="bnv-nut-tonal" data-vai-tro="tertiary" onClick={onMoThanThu}>
                        <Sparkles size={20} aria-hidden="true" />
                        <span>Luyện với thần thú</span>
                      </button>
                    )}
                    {onXemBaiDaNop && (
                      <button type="button" className="bnv-nut-vien" onClick={onXemBaiDaNop}>
                        <ClipboardCheck size={18} aria-hidden="true" />
                        <span>Xem bài đã nộp</span>
                      </button>
                    )}
                  </div>
                )}
              </section>
              {theDoan}
              </>
            ) : (
              <>
                {duLieu.daXongHomNay && (
                  <section className="bnv-mung" aria-label={laPh ? 'Con đã xong việc hôm nay' : 'Em đã xong việc hôm nay'} data-vung="xong-hom-nay">
                    <span className="bnv-mung-bt" aria-hidden="true">
                      <CheckCircle2 size={26} />
                    </span>
                    <div className="bnv-mung-chu">
                      <h2>{laPh ? 'Con đã xong việc hôm nay' : 'Em đã xong việc hôm nay'}</h2>
                      {/* Chỉ nói số đo thật; KHÔNG nói "nắm chắc" (nộp ≠ nắm). */}
                      <p>
                        Đã làm {duLieu.daXongHomNay.daLamCau} câu{duLieu.daXongHomNay.lenBac > 0 ? `, ${duLieu.daXongHomNay.lenBac} câu lên bậc` : ''}
                      </p>
                      <p className="bnv-mung-phu">{laPh ? 'Còn vài việc làm thêm, không bắt buộc.' : 'Muốn làm thêm thì chọn một việc bên dưới — không bắt buộc.'}</p>
                    </div>
                  </section>
                )}
                {duLieu.lamNgay && <TheLamNgay viec={duLieu.lamNgay} docChi={laPh} onLam={chon} />}
                {theDoan}
                <DanhSachNhiemVu cacBac={duLieu.cacBac} docChi={laPh} onChon={chon} />
              </>
            )}
            {/* H1 (rà soát dư thừa, Boss duyệt): việc hôm nay đứng NGAY dưới tiến độ; lời Bộ não + EXP hôm nay xuống dưới việc. */}
            {/* TheBoNao tự chọn phần theo vai: học sinh chỉ thấy lời của em, phụ huynh chỉ thấy lời + thư tuần (test bo-nao-the/bo-nao-bang khoá). */}
            <TheBoNao vaiTro={vaiTro} hoTen={hoTen} now={now} hs={duLieu.boNao?.hs ?? null} ph={boNaoPh ?? null} />

            {duLieu.exp && !laPh && (
              <section className="bnv-exp" aria-label="EXP học tập hôm nay" data-vung="exp">
                <div className="bnv-exp-hang">
                  <span className="bnv-exp-so">
                    <Zap size={18} aria-hidden="true" />
                    <span>EXP hôm nay</span>
                    <b>{duLieu.exp.homNay}</b>
                  </span>
                  {duLieu.exp.manhKhien && (
                    <span className="bnv-exp-khien">
                      <Shield size={18} aria-hidden="true" />
                      <span>
                        Mảnh khiên {duLieu.exp.manhKhien.manh}/{duLieu.exp.manhKhien.moiKhien}
                        {duLieu.exp.manhKhien.khienConLai > 0 ? ` · ${duLieu.exp.manhKhien.khienConLai} khiên` : ''}
                      </span>
                    </span>
                  )}
                </div>
                {duLieu.exp.chiTiet.length > 0 && (
                  <details className="bnv-exp-ct">
                    <summary>Chi tiết EXP hôm nay</summary>
                    <ul>
                      {duLieu.exp.chiTiet.map((c, i) => (
                        <li key={`${c.loai}:${i}`}>{c.ghiChu}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}

            <HangTonCu tonCu={duLieu.tonCu} docChi={laPh} onChon={(b) => onHanhDong?.(b.hanhDong)} />
            <DanhSachQuaHan viec={duLieu.quaHan} docChi={laPh} onChon={(q) => q.hanhDong && onHanhDong?.(q.hanhDong)} />
          </>
        )}

        {/* MỘT nút duy nhất của app phụ huynh (thầy lệnh 21/09): "Giao thêm bài cho con". Luôn hiện — kể cả khi con chưa có việc; lỗi/thiếu lệnh ⇒ lời thật của máy chủ ngay dưới nút. */}
        {laPh && giaoThem && <GiaoThemChoCon v={giaoThem} />}

        {/* CHÂN MÀN phụ huynh (màn dự phòng): đường ra/vào tài khoản (phụ huynh hai con), đích chạm ≥ 48 px. Không phải tính năng. Thầy lệnh 21/09: BỎ dòng số bản app khỏi màn (số bản chỉ còn trong menu nút tròn của màn chính). */}
        {laPh && onDoiSbd && (
          <footer className="bnv-chan-ph" data-vung="chan-ph">
            <button type="button" className="bnv-chan-ph-nut" onClick={onDoiSbd}>
              Đổi số báo danh
            </button>
          </footer>
        )}

        {/* Không dựng khi còn skeleton: thẻ này nằm dưới vùng nhiệm vụ, nội dung thật phình ra sẽ đẩy nó đi (CLS). */}
        {/* "Vinh danh hôm nay" chỉ ở học sinh: app phụ huynh một màn một nút (21/09) không còn khối này. */}
        {!dangTai && !laPh && <TheVinhDanh tatChuyenDong={!choDong} taiDuLieu={taiVinhDanh} hienThu />}
      </main>

      {!laPh && onVaoThi && <NutVaoThi caDangMo={caDangMo} onVaoThi={onVaoThi} />}
    </div>
  )
}
