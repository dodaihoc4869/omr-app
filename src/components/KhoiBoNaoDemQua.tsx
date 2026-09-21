import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, Clock, Info, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import {
  NHAN_KET_QUA,
  QUA_HAN_GIO,
  boDieuChinh,
  coTheBoDong,
  gioChayCuoi,
  gioTuLanChay,
  laDongChiBao,
  layDemQua,
  nhanCuaDong,
  nutCuaDong,
  tachSoDam,
  tieuDeKhoi,
  trangThaiChay,
  truocDay,
  type DemQua,
  type DongBanTin,
  type KetQuaLenh,
} from '../lib/bo-nao-thay'
import '../styles/bo-nao-m3.css'

/** KHỐI "BỘ NÃO ĐÊM QUA" (bản vẽ docs/ban-ve-bo-nao-2109/, thầy duyệt 21/09; giọng TỰ HÀNH thầy chốt cùng ngày: thầy KHÔNG phải làm gì, chỉ ĐỌC báo cáo).
 *  Tiêu đề "Đêm qua đã hỗ trợ N em"; mỗi dòng thể ĐÃ LÀM + kết quả hôm sau khi đã có; nút chỉ còn "Xem" (mở hồ sơ / Gọi lên bảng — hàm SẴN CÓ) và "Bỏ điều chỉnh" (tuỳ thầy).
 *  Dòng CHỈ BÁO (thầy xem lại · em vắng lâu) không có nút Bỏ. Nhãn "CHẠY THỬ" (mã nội bộ `cheDo:'bong'`) chỉ hiện khi chế độ thử — thử thì KHÔNG nói "đã làm" (dòng ghi "ĐỀ XUẤT").
 *  NÓI THẬT: máy chủ chưa có lệnh / chưa chạy lần nào / quá 36 giờ ⇒ hiện đúng lý do, không dựng bản tin. Hợp đồng `docs/hop-dong-bo-nao-2109.md`; dạng trường `src/lib/bo-nao-thay.ts`.
 *  `gon` = bản tóm tắt cho BẢNG TIN giáo viên: tiêu đề + tối đa `soDongGon` dòng, không nút. */
export default function KhoiBoNaoDemQua({
  onMoHoSo,
  onGoiLenBang,
  onMoCaiDat,
  ngay,
  gon = false,
  soDongGon = 3,
  onXemDayDu,
}: {
  onMoHoSo?: (sbd: string) => void
  onGoiLenBang?: () => void
  onMoCaiDat?: () => void
  ngay?: string
  gon?: boolean
  /** Bản gọn: số dòng tối đa hiện ra (0 = chỉ tiêu đề + số đếm, khi khối đầy đủ đã nằm ngay trên màn). */
  soDongGon?: number
  onXemDayDu?: () => void
}) {
  const classList = useAppStore((s) => s.classList)
  const showToast = useAppStore((s) => s.showToast)
  const [kq, setKq] = useState<KetQuaLenh<DemQua> | undefined>(undefined)
  const [nayMs, setNayMs] = useState(() => Date.now())
  const [xacNhan, setXacNhan] = useState<number | null>(null)
  const [dangBo, setDangBo] = useState(false)
  const [daBo, setDaBo] = useState<Set<number>>(new Set())

  const tai = useCallback(() => {
    let con = true
    setKq(undefined)
    setDaBo(new Set())
    setXacNhan(null)
    void layDemQua(ngay).then((r) => {
      if (!con) return
      setNayMs(Date.now())
      setKq(r)
    })
    return () => {
      con = false
    }
  }, [ngay])
  useEffect(() => tai(), [tai])

  const dauKhoi = (tieu: string, phu: string, chip?: React.ReactNode) => (
    <div className="bnao-dau">
      <span className="bnao-huy-hieu" aria-hidden="true">
        <Sparkles size={24} />
      </span>
      <div className="bnao-dau-chu">
        <h2 className="bnao-tieu-de bnao-tieu-de--to">{tieu}</h2>
        <p className="bnao-phu">{phu}</p>
      </div>
      {chip}
    </div>
  )

  if (kq === undefined) {
    return (
      <section className="bnao" data-khoi="bo-nao-dem-qua" aria-busy="true" aria-label="Bộ não đêm qua">
        {dauKhoi('Bộ não A.I · đêm qua', 'Đang đọc báo cáo…')}
      </section>
    )
  }

  if (!kq.ok) {
    const chuaCoLenh = kq.loai === 'chua_co_lenh'
    return (
      <section className="bnao" data-khoi="bo-nao-dem-qua" aria-label="Bộ não đêm qua">
        {dauKhoi('Bộ não A.I · đêm qua', chuaCoLenh ? 'Máy chủ chưa có bản tin bộ não' : 'Chưa đọc được bản tin bộ não')}
        <p className={`bnao-ghi-chu ${chuaCoLenh ? 'bnao-ghi-chu--loi' : 'bnao-ghi-chu--canh'}`} role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            <b>{kq.chu}</b> Chưa có số nào để hiện — không phải lỗi của học sinh hay lớp. Học sinh vẫn học bình thường.
          </span>
        </p>
        <div className="bnao-hang-nut">
          <button type="button" className="bnao-nut bnao-nut--vien" onClick={tai}>
            Thử lại
          </button>
        </div>
      </section>
    )
  }

  const d = kq.du
  if (!d.bat) {
    return (
      <section className="bnao" data-khoi="bo-nao-dem-qua" aria-label="Bộ não đêm qua">
        {dauKhoi('Bộ não đang tắt', 'Không viết báo cáo và không điều chỉnh gì cho học sinh')}
        <p className="bnao-ghi-chu">
          <Info size={18} aria-hidden="true" />
          <span>
            Bộ não đang <b>tắt</b> trong Cài đặt.
          </span>
        </p>
        {onMoCaiDat && !gon && (
          <div className="bnao-hang-nut">
            <button type="button" className="bnao-nut bnao-nut--vien" onClick={onMoCaiDat}>
              Mở Cài đặt
            </button>
          </div>
        )}
      </section>
    )
  }

  // Chế độ: cờ toàn cục 'that' ⇒ mọi lớp; hoặc mọi lớp đang có đều nằm trong `lopThat`; còn lại là bóng (một phần hoặc toàn bộ).
  const cacLop = [...new Set(classList.map((h) => h.lop).filter(Boolean))]
  const tatCaThat = d.cheDo === 'that' || (cacLop.length > 0 && cacLop.every((l) => d.lopThat.includes(l)))
  const coLopThat = tatCaThat || d.lopThat.length > 0
  const chip = tatCaThat ? null : coLopThat ? (
    <span className="bnao-chip bnao-chip--that">
      <Sparkles size={16} aria-hidden="true" />
      Chạy thật: lớp {d.lopThat.join(', ')} · còn lại chạy thử
    </span>
  ) : (
    <span className="bnao-chip bnao-chip--bong">
      <Sparkles size={16} aria-hidden="true" />
      CHẠY THỬ — chưa tác động tới học sinh
    </span>
  )

  // Đã ÁP thật cho em chưa? Chỉ tin điều MÁY CHỦ nói (số em hỗ trợ > 0 hoặc có dòng apDung:true).
  const daApDung = (d.soEmHoTro ?? 0) > 0 || d.banTin.some((x) => x.apDung === true)
  const tt = trangThaiChay(d.chayLanCuoi, nayMs)
  if (tt === 'chua_chay') {
    // CHƯA có bản tin (lượt chạy đầu chưa tới) là trạng thái TRUNG TÍNH — không phải lỗi (Boss 21/09): nền xám, chữ thường; đỏ chỉ khi > 36 giờ không chạy hoặc lệnh lỗi thật.
    return (
      <section className="bnao" data-khoi="bo-nao-dem-qua" aria-label="Bộ não đêm qua">
        {dauKhoi('Bộ não A.I · đêm qua', 'Chưa có bản tin cho hôm nay', chip)}
        <p className="bnao-ghi-chu" role="status">
          <Clock size={18} aria-hidden="true" />
          <span>
            <b>Bộ não A.I chưa có bản tin cho hôm nay</b> — lượt đầu chạy khoảng 04:00. Học sinh vẫn học bình thường.
          </span>
        </p>
      </section>
    )
  }

  const gio = gioTuLanChay(d.chayLanCuoi, nayMs) ?? 0
  const dem = [
    d.soEm != null ? `soi ${d.soEm} em` : '',
    d.soSoiKy != null || d.soVang != null ? `(${[d.soSoiKy != null ? `${d.soSoiKy} soi kỹ` : '', d.soVang != null ? `${d.soVang} vắng` : ''].filter(Boolean).join(' · ')})` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const tenLop = (sbd: string) => classList.find((h) => h.sbd === sbd)?.lop ?? ''
  const tenEm = (x: DongBanTin) => x.hoTen || classList.find((h) => h.sbd === x.sbd)?.hoTen || (x.sbd ? `SBD ${x.sbd}` : '')
  const dsHien = gon ? d.banTin.slice(0, soDongGon) : d.banTin

  const boMot = async (i: number, x: DongBanTin) => {
    setDangBo(true)
    const r = await boDieuChinh(x.sbd, x.ngayDieuChinh || d.ngay)
    setDangBo(false)
    setXacNhan(null)
    if (r.ok && r.du) {
      setDaBo((c) => new Set(c).add(i))
      showToast(`Đã bỏ điều chỉnh của ${tenEm(x)}.`)
    } else if (r.ok) {
      // Máy chủ trả ok nhưng KHÔNG có điều chỉnh nào để bỏ (đã bỏ, đã tự gỡ hoặc chưa được lưu) — không nói "đã bỏ".
      showToast(`Không có điều chỉnh nào của ${tenEm(x)} để bỏ (có thể đã được bỏ hoặc bộ não đã tự gỡ).`, 'warn')
    } else {
      showToast(r.chu, 'warn')
    }
  }

  const nutDong = (x: DongBanTin, i: number) => {
    if (gon) return null
    if (daBo.has(i)) return <span className="bnao-chip bnao-chip--nho">Đã bỏ điều chỉnh</span>
    if (xacNhan === i) {
      return (
        <div className="bnao-nut-nhom" role="group" aria-label={`Bỏ điều chỉnh của ${tenEm(x)}`}>
          <span className="bnao-phu">Bỏ điều chỉnh này?</span>
          <button type="button" className="bnao-nut bnao-nut--bo" disabled={dangBo} onClick={() => void boMot(i, x)}>
            {dangBo ? 'Đang bỏ…' : 'Bỏ'}
          </button>
          <button type="button" className="bnao-nut bnao-nut--vien" disabled={dangBo} onClick={() => setXacNhan(null)}>
            Giữ
          </button>
        </div>
      )
    }
    const n = nutCuaDong(x)
    return (
      <div className="bnao-nut-nhom">
        {n && (
          <button type="button" className="bnao-nut bnao-nut--vien" aria-label={`Xem${tenEm(x) ? ` ${tenEm(x)}` : ''}`} onClick={() => (n.dich === 'ho_so' ? onMoHoSo?.(x.sbd) : onGoiLenBang?.())}>
            {n.nhan}
          </button>
        )}
        {!laDongChiBao(x) && coTheBoDong(x) && (
          <button type="button" className="bnao-nut bnao-nut--bo" onClick={() => setXacNhan(i)}>
            Bỏ điều chỉnh
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="bnao" data-khoi="bo-nao-dem-qua" aria-label="Bộ não đêm qua">
      {dauKhoi(
        tieuDeKhoi(d, tatCaThat),
        `Chạy lần cuối ${gioChayCuoi(d.chayLanCuoi!, nayMs)} (${truocDay(d.chayLanCuoi!, nayMs)})${dem ? ` · ${dem}` : ''}`,
        chip,
      )}

      {tt === 'qua_han' && (
        <p className="bnao-ghi-chu bnao-ghi-chu--canh" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            <b>Bộ não chưa chạy {gio} giờ</b> (quá {QUA_HAN_GIO} giờ). Kiểm tra máy thầy còn thức và hai mã lệnh còn được phép. <b>Học sinh vẫn học bình thường.</b> Báo cáo dưới đây là của lượt cũ.
          </span>
        </p>
      )}

      {gon && dsHien.length === 0 ? null : d.banTin.length === 0 ? (
        <p className="bnao-ghi-chu">
          <Info size={18} aria-hidden="true" />
          <span>Lượt chạy gần nhất không có gì cần báo thầy.</span>
        </p>
      ) : (
        <div>
          {dsHien.map((x, i) => {
            const nh = nhanCuaDong(x)
            const ten = tenEm(x)
            const lop = x.sbd ? tenLop(x.sbd) : ''
            const kqDong = x.ketQua ? NHAN_KET_QUA[x.ketQua] : null
            return (
              <div key={i} className="bnao-dong" data-loai={x.loai} data-chi-bao={laDongChiBao(x) ? 'co' : undefined}>
                <span className={`bnao-nhan bnao-nhan--${nh.vai}`}>{nh.nhan}</span>
                <div className="bnao-van-khoi">
                  <p className="bnao-van">
                    {ten && (
                      <>
                        <span className="bnao-ten">{ten}</span>
                        {lop ? ` · ${lop}` : ''} —{' '}
                      </>
                    )}
                    {tachSoDam(x.chu).map((p, k) => (p.dam ? <b key={k}>{p.t}</b> : <span key={k}>{p.t}</span>))}
                  </p>
                  {(kqDong || x.ketQuaChu) && (
                    <p className="bnao-ket-qua">
                      <span aria-hidden="true">→</span>
                      <span className={`bnao-chip bnao-chip--nho${kqDong?.vai === 'tot' ? ' bnao-chip--tot' : kqDong?.vai === 'xau' ? ' bnao-chip--xau' : ''}`}>{kqDong?.chu ?? 'Kết quả hôm nay'}</span>
                      {x.ketQuaChu && <span>{x.ketQuaChu}</span>}
                      {x.tuGo && <span>· bộ não đã tự gỡ điều chỉnh này</span>}
                    </p>
                  )}
                </div>
                {nutDong(x, i)}
              </div>
            )
          })}
        </div>
      )}

      {gon ? (
        onXemDayDu && (
          <div className="bnao-hang-nut">
            <button type="button" className="bnao-nut bnao-nut--vien" onClick={onXemDayDu}>
              Xem đầy đủ
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )
      ) : (
        <>
          <p className="bnao-ghi-chu">
            <Info size={18} aria-hidden="true" />
            <span>
              {tatCaThat && daApDung ? (
                <>
                  Bộ não tự điều chỉnh trong khung an toàn — <b>không đổi hạn nộp</b>, không đụng câu lõi, tự hết hạn sau 3 ngày. Thầy không cần làm gì; chỉ bấm <b>Bỏ điều chỉnh</b> nếu không đồng ý.
                </>
              ) : tatCaThat ? (
                <>
                  Đang <b>chạy thật</b> nhưng đêm qua <b>chưa có điều chỉnh nào được áp</b> cho học sinh (máy chủ có thể chưa bật phần áp dụng, hoặc độ tin cậy chưa đủ) — kế hoạch ngày và bài tập của học sinh <b>chưa đổi</b>.
                </>
              ) : (
                <>
                  Đang <b>chạy thử</b>: điều chỉnh chỉ được lưu để kiểm máy móc; kế hoạch ngày và bài tập của học sinh <b>chưa đổi</b>.
                </>
              )}
              {d.soDieuChinh && (
                <>
                  {' '}
                  Đêm qua: <b>{d.soDieuChinh.nhan}</b> điều chỉnh qua kiểm khuôn
                  {d.soDieuChinh.chiGhiSo > 0 ? `, ${d.soDieuChinh.chiGhiSo} chỉ ghi sổ (độ tin cậy thấp)` : ''}
                  {d.soDieuChinh.biLoai > 0 ? `, ${d.soDieuChinh.biLoai} bị loại` : ''}.
                </>
              )}
            </span>
          </p>
          {onMoCaiDat && (
            <div className="bnao-hang-nut">
              <button type="button" className="bnao-nut bnao-nut--vien" onClick={onMoCaiDat}>
                Cài đặt bộ não
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
