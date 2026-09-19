// MÀN DUY NHẤT "Bảng nhiệm vụ" — dùng chung cho app học sinh và app phụ huynh.
// Đúng 5 vùng: (1) đầu trang có thần thú, (2) thẻ "Làm ngay" duy nhất, (3) danh
// sách 4 bậc, (4) nút Vào thi, (5) vinh danh top 3 — trên nền động tinh tế.
// Màn này KHÔNG xếp việc, không tính điểm, không gọi API nhiệm vụ: nhận
// `DuLieuBangNhiemVu` từ `nhiem-vu-adapter` và chỉ vẽ.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, ChevronRight, ClipboardCheck, MessageSquare, PawPrint, Plus, Shield, Sparkles, Zap } from 'lucide-react'
import type { DuLieuBangNhiemVu, HanhDongNhiemVu, TheNhiemVu } from '../../lib/nhiem-vu-adapter'
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

/** Dữ liệu ô "Giao bài cho con" của phụ huynh — LẤY TỪ MÁY CHỦ (/parent-news), giao diện không tự tính, không tự viết câu. */
export interface GiaoBaiHangNgay {
  /** Câu NGUYÊN VĂN của máy chủ (kèm số). Vắng = chưa có dữ liệu ⇒ không in câu nào. */
  reason?: string
  /** Số câu còn dư chỗ giao hôm nay (0 = con đã đủ việc). Vắng = chưa biết. */
  soCauDeXuat?: number
  /** Hôm nay đã giao bài hằng ngày rồi (máy chủ không tạo bài thứ hai). */
  daGiao?: { soCau: number; trangThai: 'chua_lam' | 'dang_lam' | 'da_nop' } | null
  dangGui?: boolean
  thongBao?: { loai: 'ok' | 'loi'; chu: string } | null
}

const TEN_TRANG_THAI_BAI = { chua_lam: 'con chưa làm', dang_lam: 'con đang làm', da_nop: 'con đã nộp' } as const

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
  /** Luồng giao TAY cũ (chọn câu). Vẫn vào được khi con đã đủ việc — không chặn. */
  onGiaoBai?: () => void
  /** Giao bài hằng ngày đã cá nhân hoá (máy chủ chọn câu). */
  onGiaoHangNgay?: () => void
  giaoBai?: GiaoBaiHangNgay
  onNhanThay?: () => void
  taiVinhDanh?: () => Promise<DuLieuVinhDanh | null>
}

export default function BangNhiemVu({
  vaiTro,
  hoTen,
  now,
  duLieu,
  dangTai = false,
  mucMenu = [],
  khePhai,
  caDangMo = false,
  ghiChuNguon,
  onHanhDong,
  onMoThanThu,
  onVaoThi,
  onXemBaiDaNop,
  onGiaoBai,
  onGiaoHangNgay,
  giaoBai,
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
  const coBaoNhan = !dangTai && khoaNhan !== '#' && khoaNhan !== khoaDaAn
  const tongExpMoi = duLieu.expNhan.reduce((t, x) => t + x.exp, 0)

  // Máy chủ nói RÕ em chưa chọn thần thú (`thanThu: null`) — vd sáng sau khi đặt lại mùa: thẻ mời nổi bật đầu bảng. Không hiện khi chưa biết.
  const chuaChonThu = !dangTai && duLieu.thanThu.kieu === 'chua_chon'

  const chon = (viec: TheNhiemVu) => onHanhDong?.(viec.hanhDong)
  const { tienDo, tocDo } = duLieu
  const viec = tatCaViec(duLieu)
  const conLai = Math.max(0, tienDo.mucTieu - tienDo.daLam)

  // Ô giao bài của phụ huynh: mọi câu chữ và số là của máy chủ; giao diện chỉ chọn dạng nút.
  const gb = giaoBai ?? {}
  const conDu = !gb.daGiao && typeof gb.soCauDeXuat === 'number' && gb.soCauDeXuat > 0
  const daDu = !gb.daGiao && gb.soCauDeXuat === 0
  const trangThaiGiao = gb.daGiao ? 'da-giao' : conDu ? 'con-du' : daDu ? 'da-du' : 'chua-biet'
  const bamGiao = conDu && onGiaoHangNgay ? onGiaoHangNgay : onGiaoBai

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

        {dangTai ? (
          <div aria-busy="true" aria-label="Đang tải việc hôm nay" style={{ display: 'grid', gap: 16 }}>
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--lon" />
            <div className="bnv-xuong bnv-xuong--the" />
            <div className="bnv-xuong bnv-xuong--the" />
          </div>
        ) : (
          <>
            {chuaChonThu &&
              (laPh || !onMoThanThu ? (
                <section className="bnv-chon-thu bnv-chon-thu--doc" data-vung="chon-than-thu" aria-label={laPh ? 'Con chưa chọn thần thú' : 'Em chưa chọn thần thú'}>
                  <span className="bnv-chon-thu-bt" aria-hidden="true">
                    <PawPrint size={28} />
                  </span>
                  <div className="bnv-chon-thu-chu">
                    <h2>{laPh ? 'Con chưa chọn thần thú' : 'Em chưa chọn thần thú'}</h2>
                    <p>{laPh ? 'Khi con chọn, thần thú sẽ hiện ở đầu trang này.' : 'Em mở game để chọn một bạn đồng hành.'}</p>
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

            {duLieu.exp && (
              <section className="bnv-exp" aria-label={laPh ? 'EXP học tập hôm nay của con' : 'EXP học tập hôm nay'} data-vung="exp">
                <div className="bnv-exp-hang">
                  <span className="bnv-exp-so">
                    <Zap size={18} aria-hidden="true" />
                    <span>{laPh ? 'EXP hôm nay của con' : 'EXP hôm nay'}</span>
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
                {duLieu.daXongHomNay && (
                  <section className="bnv-mung" aria-label={laPh ? 'Con đã xong việc hôm nay' : 'Em đã xong việc hôm nay'} data-vung="xong-hom-nay">
                    <span className="bnv-mung-bt" aria-hidden="true">
                      <CheckCircle2 size={26} />
                    </span>
                    <div className="bnv-mung-chu">
                      <h2>{laPh ? 'Con đã xong việc hôm nay' : 'Em đã xong việc hôm nay'}</h2>
                      {/* Chỉ nói số đo thật; KHÔNG nói "nắm chắc" (nộp ≠ nắm). */}
                      <p>
                        Đã làm {duLieu.daXongHomNay.daLamCau} câu{duLieu.daXongHomNay.lenBac > 0 ? `, ${duLieu.daXongHomNay.lenBac} câu lên bậc ôn` : ''}
                      </p>
                      <p className="bnv-mung-phu">{laPh ? 'Còn vài việc làm thêm, không bắt buộc.' : 'Muốn làm thêm thì chọn một việc bên dưới — không bắt buộc.'}</p>
                    </div>
                  </section>
                )}
                {duLieu.lamNgay && <TheLamNgay viec={duLieu.lamNgay} docChi={laPh} onLam={chon} />}
                <DanhSachNhiemVu cacBac={duLieu.cacBac} docChi={laPh} onChon={chon} />
              </>
            )}
            <HangTonCu tonCu={duLieu.tonCu} docChi={laPh} onChon={(b) => onHanhDong?.(b.hanhDong)} />
            <DanhSachQuaHan viec={duLieu.quaHan} docChi={laPh} onChon={(q) => q.hanhDong && onHanhDong?.(q.hanhDong)} />

            {laPh && onGiaoBai && (
              <section className="bnv-giao-bai" data-trang-thai={trangThaiGiao} aria-label="Giao bài cho con" data-vung="giao-bai">
                {gb.reason && <p data-vung="ly-do-giao-bai">{gb.reason}</p>}
                {gb.daGiao && (
                  <p data-vung="da-giao">
                    Hôm nay đã giao {gb.daGiao.soCau} câu · {TEN_TRANG_THAI_BAI[gb.daGiao.trangThai]}
                  </p>
                )}
                {gb.thongBao && (
                  <p role={gb.thongBao.loai === 'loi' ? 'alert' : 'status'} data-vung="thong-bao-giao-bai" data-loai={gb.thongBao.loai}>
                    {gb.thongBao.chu}
                  </p>
                )}
                <div className="bnv-giao-bai-nut">
                  <button
                    type="button"
                    className={conDu ? 'bnv-nut-tonal' : 'bnv-nut-vien'}
                    data-vai-tro={conDu ? 'secondary' : undefined}
                    disabled={gb.dangGui}
                    aria-busy={gb.dangGui || undefined}
                    onClick={bamGiao}
                  >
                    <Plus size={18} aria-hidden="true" />
                    <span>{gb.dangGui ? 'Đang giao…' : 'Giao bài cho con'}</span>
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

        {/* Không dựng khi còn skeleton: thẻ này nằm dưới vùng nhiệm vụ, nội dung thật phình ra sẽ đẩy nó đi (CLS). */}
        {!dangTai && <TheVinhDanh tatChuyenDong={!choDong} taiDuLieu={taiVinhDanh} />}
      </main>

      {!laPh && onVaoThi && <NutVaoThi caDangMo={caDangMo} onVaoThi={onVaoThi} />}
    </div>
  )
}
