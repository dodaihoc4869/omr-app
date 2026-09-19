// MÀN DUY NHẤT "Bảng nhiệm vụ" — dùng chung cho app học sinh và app phụ huynh.
// Đúng 5 vùng: (1) đầu trang có thần thú, (2) thẻ "Làm ngay" duy nhất, (3) danh
// sách 4 bậc, (4) nút Vào thi, (5) vinh danh top 3 — trên nền động tinh tế.
// Màn này KHÔNG xếp việc, không tính điểm, không gọi API nhiệm vụ: nhận
// `DuLieuBangNhiemVu` từ `nhiem-vu-adapter` và chỉ vẽ.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ClipboardCheck, MessageSquare, Plus, Sparkles } from 'lucide-react'
import type { DuLieuBangNhiemVu, HanhDongNhiemVu, TheNhiemVu } from '../../lib/nhiem-vu-adapter'
import type { SpiritMotion } from '../../game/than-thu-v2/Spirit2D'
import DauTrang, { type MucMenu, type ThanThuGoc } from './DauTrang'
import TheLamNgay from './TheLamNgay'
import DanhSachNhiemVu from './DanhSachNhiemVu'
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

export interface BangNhiemVuProps {
  vaiTro: 'hocsinh' | 'phuhuynh'
  hoTen: string
  now: number
  duLieu: DuLieuBangNhiemVu
  /** Dữ liệu nhiệm vụ chưa về ⇒ vẽ skeleton, không vẽ thẻ trống. */
  dangTai?: boolean
  thanThu: ThanThuGoc
  mucMenu?: MucMenu[]
  /** Chỗ đặt chuông thông báo… ở thanh trên, bên trái menu ba chấm. */
  khePhai?: ReactNode
  caDangMo?: boolean
  /** Một dòng nói thật về phần dữ liệu app CHƯA có (vd. phụ huynh chưa có danh sách BTVN của con). */
  ghiChuNguon?: string
  onHanhDong?: (hanhDong: HanhDongNhiemVu) => void
  onMoThanThu?: () => void
  onVaoThi?: () => void
  onXemBaiDaNop?: () => void
  onGiaoBai?: () => void
  onNhanThay?: () => void
  taiVinhDanh?: () => Promise<DuLieuVinhDanh | null>
}

export default function BangNhiemVu({
  vaiTro,
  hoTen,
  now,
  duLieu,
  dangTai = false,
  thanThu,
  mucMenu = [],
  khePhai,
  caDangMo = false,
  ghiChuNguon,
  onHanhDong,
  onMoThanThu,
  onVaoThi,
  onXemBaiDaNop,
  onGiaoBai,
  onNhanThay,
  taiVinhDanh,
}: BangNhiemVuProps) {
  const laPh = vaiTro === 'phuhuynh'
  const choDong = useChoPhepChuyenDong()

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

  const chon = (viec: TheNhiemVu) => onHanhDong?.(viec.hanhDong)
  const { tienDo, tocDo } = duLieu
  const viec = tatCaViec(duLieu)
  const conLai = Math.max(0, tienDo.mucTieu - tienDo.daLam)

  // Ô cảnh báo tải của phụ huynh: đếm câu của việc đang mở, không ước đoán thêm.
  const cauDangCho = viec.filter((v) => !v.biCong && v.bac !== 'tuy_chon').reduce((s, v) => s + v.soCau, 0)
  const vuotTai = tienDo.mucTieu > 0 && tienDo.daLam + cauDangCho >= tienDo.mucTieu

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
          thanThu={thanThu}
          dongThu={dongThu}
          tatChuyenDong={!choDong}
          nghi={!dangTai && duLieu.trong}
          onMoThanThu={laPh ? undefined : onMoThanThu}
          mucMenu={mucMenu}
          khePhai={khePhai}
        />

        {dangTai ? (
          <div aria-busy="true" aria-label="Đang tải việc hôm nay" style={{ display: 'grid', gap: 16 }}>
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--lon" />
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--the" />
          </div>
        ) : (
          <>
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
                    <span className="bnv-o-so-gia">{tocDo.giayMoiCau ? `${tocDo.giayMoiCau} s` : '—'}</span>
                    <span className="bnv-chu-phu">{tocDo.giayMoiCau ? 'mỗi câu · đo 30 ngày' : tocDo.chu}</span>
                  </div>
                </div>
              ) : (
                <span className="bnv-chu-phu">
                  {conLai > 0 ? `Còn ${conLai} câu là tới mức gợi ý hôm nay` : 'Em đã tới mức gợi ý hôm nay'}
                </span>
              )}
              {ghiChuNguon && (
                <span className="bnv-chu-phu" data-vung="ghi-chu-nguon">
                  {ghiChuNguon}
                </span>
              )}
            </section>

            {duLieu.trong ? (
              <section className="bnv-trong" aria-label="Hôm nay chưa có việc" data-vung="trong">
                <h2>{laPh ? (ghiChuNguon ? 'Chưa có bài gia đình giao nào đang chờ' : 'Hôm nay con chưa có việc') : 'Hôm nay chưa có việc — thần thú đang nghỉ'}</h2>
                <p>
                  {laPh
                    ? 'Không có bài gia đình giao nào đang chờ con.'
                    : 'Thầy chưa giao bài và em không có bài nào đang chờ. Em có thể luyện thêm với thần thú hoặc xem lại bài đã nộp.'}
                </p>
                {!laPh && (
                  <div className="bnv-trong-nut">
                    {onMoThanThu && (
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
            ) : (
              <>
                {duLieu.lamNgay && <TheLamNgay viec={duLieu.lamNgay} docChi={laPh} onLam={chon} />}
                <DanhSachNhiemVu cacBac={duLieu.cacBac} docChi={laPh} onChon={chon} />
              </>
            )}

            {laPh && onGiaoBai && (
              <section className="bnv-giao-bai" data-vuot={vuotTai ? 'true' : 'false'} aria-label="Giao bài cho con" data-vung="giao-bai">
                <p>
                  {vuotTai
                    ? `Con đã làm ${tienDo.daLam} câu và còn ${cauDangCho} câu cần làm, ${tienDo.daLam + cauDangCho > tienDo.mucTieu ? 'vượt' : 'đủ'} mức gợi ý ${tienDo.mucTieu} câu/ngày. Giao thêm bài lúc này là dồn tải cho con.`
                    : `Con còn khoảng ${Math.max(0, tienDo.mucTieu - tienDo.daLam - cauDangCho)} câu trong mức gợi ý ${tienDo.mucTieu} câu/ngày.`}
                </p>
                <div className="bnv-giao-bai-nut">
                  <button type="button" className="bnv-nut-tonal" data-vai-tro="secondary" onClick={onGiaoBai}>
                    <Plus size={18} aria-hidden="true" />
                    <span>Giao bài cho con</span>
                  </button>
                  {onNhanThay && (
                    <button type="button" className="bnv-nut-vien" onClick={onNhanThay}>
                      <MessageSquare size={18} aria-hidden="true" />
                      <span>Nhắn Thầy</span>
                    </button>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <TheVinhDanh tatChuyenDong={!choDong} taiDuLieu={taiVinhDanh} />
      </main>

      {!laPh && onVaoThi && <NutVaoThi caDangMo={caDangMo} onVaoThi={onVaoThi} />}
    </div>
  )
}
