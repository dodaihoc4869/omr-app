// KHỐI "PHÒNG CHỜ" của màn Theo dõi ca (thầy 28/09: "làm lại cho đẹp trực quan đồng bộ với thiết kế hiện tại. Có tự đồng bộ hs vào phòng chờ sau 5 giây").
// Cùng họ M3 nhiều tông với "Ca đã mở" (CaDaMo) và "Chiếu mã" (TamPhuChieuMa): chip trạng thái + số lớn + chip tên em (em mới vào hiện nhẹ) + MỘT nút chính.
// Chỉ VẼ + vòng tự làm mới 5 giây: mọi lệnh máy chủ đi qua hàm của màn cha (ExamMonitorScreen — `batDauCaNay`, `huyCaCho`, `tai`).
// Vòng 5 giây: gọi `lamMoi` (màn cha tải lại chi tiết ca = cùng lệnh `chiTietCa` màn Chiếu mã dùng); tab ẩn thì không gọi (hiện lại gọi ngay);
// `tamDung` (màn Chiếu mã đang mở — nó có vòng 5 giây riêng) thì nghỉ để không gọi trùng; không gọi chồng; lỗi ⇒ GIỮ danh sách cũ + chấm "mất kết nối".
import { useEffect, useRef, useState } from 'react'
import { Info, MonitorPlay, Play, RotateCcw, Users } from 'lucide-react'
import { NHIP_PHONG_CHO_MS, tenChip, type EmDaVao } from '../TamPhuChieuMa'
import './ca-thi.css'

export interface PhongChoCaProps {
  maCa: string
  /** Em đang đứng ở phòng chờ (chiTiet.dsCho). */
  em: readonly EmDaVao[]
  /** Sĩ số dự kiến (danh sách mời); không biết ⇒ null. */
  siSo: number | null
  /** Ca ôn câu sai (đề riêng từng em): bấm Bắt đầu thì máy rút bộ câu cho em đang chờ. */
  onCauSai: boolean
  /** Có công tắc "Đồng bộ giờ cả phòng" không (bài tập về nhà thì không). */
  coDongBoGio: boolean
  dongBoGio: boolean
  onDoiDongBoGio: (bat: boolean) => void
  dangBatDau: boolean
  onBatDau: () => void
  dangHuy: boolean
  /** Đã hỏi lại xong — huỷ thật. */
  onHuy: () => void
  /** Câu nói nơi khôi phục ca sau khi huỷ. */
  noiKhoiPhuc: string
  onChieuMa: () => void
  /** Tải lại chi tiết ca; trả `false` hoặc ném lỗi = hỏng. Vắng ⇒ không tự làm mới. */
  lamMoi?: () => Promise<boolean>
  /** Nghỉ vòng tự làm mới (vd. màn Chiếu mã đang mở và tự hỏi rồi). */
  tamDung?: boolean
}

export default function PhongChoCa(p: PhongChoCaProps) {
  const [matKetNoi, setMatKetNoi] = useState(false)
  const [hoiHuy, setHoiHuy] = useState(false)
  const [moGioChung, setMoGioChung] = useState(false)

  // EM MỚI VÀO: so với danh sách đã thấy lần trước (lần vẽ đầu không tô ai).
  const daThay = useRef<Set<string> | null>(null)
  const [moi, setMoi] = useState<Set<string>>(new Set())
  const khoaEm = p.em.map((e) => e.sbd).join(',')
  useEffect(() => {
    const cu = daThay.current
    setMoi(cu ? new Set(p.em.filter((e) => !cu.has(e.sbd)).map((e) => e.sbd)) : new Set())
    daThay.current = new Set(p.em.map((e) => e.sbd))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoaEm])

  // TỰ LÀM MỚI 5 GIÂY.
  const lamMoiRef = useRef(p.lamMoi)
  lamMoiRef.current = p.lamMoi
  const coLamMoi = !!p.lamMoi
  const chay = coLamMoi && !p.tamDung
  useEffect(() => {
    if (!chay) return
    let dung = false
    let dangHoi = false
    const hoi = async () => {
      if (dung || dangHoi || document.visibilityState === 'hidden' || !lamMoiRef.current) return
      dangHoi = true
      try {
        const ok = await lamMoiRef.current()
        if (!dung) setMatKetNoi(ok === false)
      } catch {
        if (!dung) setMatKetNoi(true)
      } finally {
        dangHoi = false
      }
    }
    const id = setInterval(() => void hoi(), NHIP_PHONG_CHO_MS)
    const hien = () => {
      if (document.visibilityState !== 'hidden') void hoi()
    }
    document.addEventListener('visibilitychange', hien)
    return () => {
      dung = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', hien)
    }
  }, [chay])

  const n = p.em.length
  const siSo = p.siSo && p.siSo > 0 ? p.siSo : null

  return (
    <section className="ct ct-tam ct-pc" aria-labelledby="ct-pc-tieu-de" data-vung="phong-cho">
      <div className="ct-pc-dau">
        <span className="ct-nhan n-tim" id="ct-pc-tieu-de">
          <Users size={14} aria-hidden="true" />
          Phòng chờ
        </span>
        {coLamMoi &&
          (matKetNoi ? (
            <span className="ct-pc-song ct-pc-song--mat" role="status" title="Mất kết nối — đang thử lại, danh sách dưới là lần tải trước">
              <i aria-hidden="true" /> mất kết nối
            </span>
          ) : (
            <span className="ct-pc-song" title="Danh sách tự cập nhật mỗi 5 giây">
              <i aria-hidden="true" /> tự cập nhật
            </span>
          ))}
      </div>

      <p className="ct-pc-dem" role="status" aria-live="polite">
        <b className="so">{n}</b>
        <span>
          em đang chờ
          {siSo !== null && <span className="so"> / sĩ số {siSo}</span>}
        </span>
      </p>
      {siSo !== null && (
        <div className="ct-pc-vach" role="progressbar" aria-label="Em đang chờ trên sĩ số" aria-valuemin={0} aria-valuemax={siSo} aria-valuenow={Math.min(n, siSo)}>
          <i style={{ width: `${Math.min(100, (n / siSo) * 100)}%` }} />
        </div>
      )}

      {n > 0 ? (
        <ul className="ct-pc-ds" aria-label="Em đã vào phòng chờ">
          {p.em.map((e) => (
            <li key={e.sbd} className={moi.has(e.sbd) ? 'ct-pc-em ct-pc-moi' : 'ct-pc-em'} title={e.hoTen || `SBD ${e.sbd}`}>
              {tenChip(e)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="ct-pc-trong">
          <p>Chưa em nào vào — mở Chiếu mã để lớp quét QR</p>
          <button type="button" className="ct-nut ct-nut-tong ct-nut-nho" onClick={p.onChieuMa}>
            <MonitorPlay size={16} aria-hidden="true" />
            Chiếu mã lên bảng
          </button>
        </div>
      )}

      {p.onCauSai && (
        <p className="ct-pc-tin">
          <RotateCcw size={16} aria-hidden="true" />
          <span>
            Ca ôn câu sai: bấm Bắt đầu, máy rút bộ câu riêng cho <b className="so">{n}</b> em đang chờ; em vào sau nhận đề ngẫu nhiên như ca thường.
          </span>
        </p>
      )}

      {p.coDongBoGio && (
        <div className="ct-pc-gio">
          <label className="ct-pc-cong-tac">
            <span className="ct-pc-cong-tac-chu">
              <b>Đồng bộ giờ cả phòng</b>
              <span>{p.dongBoGio ? 'Cả phòng cùng hết giờ' : 'Mỗi em tính giờ riêng'}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label="Đồng bộ giờ cả phòng"
              className="ct-sw"
              checked={p.dongBoGio}
              disabled={p.dangBatDau}
              onChange={(e) => p.onDoiDongBoGio(e.target.checked)}
            />
          </label>
          <button
            type="button"
            className="ct-pc-i"
            aria-label="Giải thích Đồng bộ giờ cả phòng"
            aria-expanded={moGioChung}
            aria-controls="ct-pc-gio-chu"
            onClick={() => setMoGioChung((x) => !x)}
          >
            <Info size={18} aria-hidden="true" />
          </button>
          {moGioChung && (
            <p className="ct-pc-gio-chu" id="ct-pc-gio-chu">
              Bật: cả phòng tính giờ từ lúc thầy bấm Bắt đầu thi, cùng hết giờ; em vào muộn chỉ còn thời gian chung. Tắt: mỗi em có đủ thời gian từ lúc nhận đề. Lựa chọn được lưu khi bắt đầu ca.
            </p>
          )}
        </div>
      )}

      <button type="button" className="ct-nut ct-nut-chinh ct-pc-bat-dau" onClick={p.onBatDau} disabled={p.dangBatDau} aria-busy={p.dangBatDau || undefined}>
        <Play size={18} aria-hidden="true" />
        Bắt đầu thi
      </button>

      {!hoiHuy ? (
        <button type="button" className="ct-pc-huy" onClick={() => setHoiHuy(true)} disabled={p.dangHuy}>
          Huỷ ca kiểm tra
        </button>
      ) : (
        <div className="ct-pc-hoi" role="alertdialog" aria-labelledby="ct-pc-hoi-chu">
          <p id="ct-pc-hoi-chu">
            Huỷ ca <b className="so">{p.maCa}</b>? Em đang chờ sẽ thấy báo ca đã huỷ. {p.noiKhoiPhuc}
          </p>
          <div className="ct-pc-hoi-nut">
            <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={() => setHoiHuy(false)} disabled={p.dangHuy}>
              Không huỷ
            </button>
            <button type="button" className="ct-nut ct-nut-do ct-nut-nho" onClick={p.onHuy} disabled={p.dangHuy}>
              {p.dangHuy ? 'Đang huỷ…' : 'Huỷ ca'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
