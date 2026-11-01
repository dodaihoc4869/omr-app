// CHỌN BÀI VỪA DẠY — BẢN TRÙNG TU (thầy 01/11: «không rút được câu để phân câu, bạn hãy trùng tu lại phần rút câu này, cho tôi chọn được nhiều bài mới học
// một lúc … Trùng tu giao diện chọn câu đẹp đơn giản. Mọi thứ phải chính xác»). Phần VẼ thuần (không gọi mạng): danh sách bài theo chương có ô tick (chọn
// NHIỀU bài), bài đã giao gọn lại một dòng, thanh tóm tắt dính đáy hộp với 3 con số chính + nút Giao. Số liệu do `useBaiHomNay` tính (xem-truoc của máy chủ).
import { useId, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import './chon-bai-moi.css'

export type TrangThaiDong = 'moi' | 'dang' | 'da'
export interface DongBaiMoi {
  khoaBai: string
  /** Số bài («10»), null khi tên không bắt đầu bằng «Bài <số>». */
  so: string | null
  ten: string
  /** Số câu tự giao (Trắc nghiệm + Đúng sai + Trả lời ngắn). */
  soCau: number
  /** «TN 35 · ĐS 10 · TLN 15». */
  chiaPhan: string
  trangThai: TrangThaiDong
  /** Dòng trạng thái của bài đã giao: «Đang luyện · hạn CN 08/11» / «Đã giao 08/10 · 52 em». */
  chuThai?: string
  /** Bài không có tờ tự giao (chỉ Ví dụ minh hoạ / Dạng toán) ⇒ không chọn được. */
  khongGiao?: boolean
  /** Dòng phụ thêm của bài chưa giao (vd «bài cũ — đang nằm trong phần ôn», «10A1 đã có · còn 10A2»). */
  ghiChu?: string
  /** Bài cũ (đứng trước bài đã giao xa nhất): chọn được nhưng không tính là «bài mới» khi gọn chương. */
  cu?: boolean
}
export interface ChuongMoi { ten: string; bai: DongBaiMoi[] }
export interface TomTatGiao {
  /** «Bài 10, Bài 11». */
  tenBai: string
  soCau: number
  chiaPhan: string
  hanChu: string
  soNgay: number
  soEm: number
  duLuot: number
  luotNgay: number
}

export function ChonBaiMoi(p: {
  chuong: ChuongMoi[]
  chon: readonly string[]
  onDoiChon: (khoaBai: string) => void
  onBoGiao?: (khoaBai: string) => void
  lopChu: string
  tom: TomTatGiao | null
  dangTinh: boolean
  loi?: string
  /** Lỗi của lượt giao vừa rồi (một số bài / lớp chưa giao được) — hiện trên nút, KHÔNG khoá nút (thầy bấm giao lại phần còn lại). */
  canhBao?: string
  onGiao: () => void
  dangGiao: boolean
  xong?: string
  chiTiet?: ReactNode
}) {
  const id = useId()
  const [moCt, setMoCt] = useState(false)
  // Chương còn bài chưa giao mở sẵn; chương đã giao hết gọn lại (thầy bấm mở được).
  const [moChuong, setMoChuong] = useState<Set<string>>(() => new Set(p.chuong.filter((c) => c.bai.some((b) => b.trangThai === 'moi' && !b.cu) || c.bai.some((b) => p.chon.includes(b.khoaBai))).map((c) => c.ten)))
  const doiChuong = (t: string) => setMoChuong((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n })
  const soChon = p.chon.length
  return (
    <div className="cbm" data-khoi="chon-bai-moi">
      <div className="cbm-dau">
        <h3 id={`${id}-t`}>Chọn bài vừa dạy</h3>
        <span className="cbm-goi-y">Chọn được nhiều bài · {p.lopChu}</span>
      </div>
      <div className="cbm-ds" role="group" aria-labelledby={`${id}-t`}>
        {p.chuong.map((c) => {
          const moi = c.bai.filter((b) => b.trangThai === 'moi').length, daGiao = c.bai.length - moi
          const mo = moChuong.has(c.ten)
          return (
            <section key={c.ten} className="cbm-chuong" data-mo={mo ? '' : undefined}>
              <button type="button" className="cbm-chuong-dau" aria-expanded={mo} onClick={() => doiChuong(c.ten)}>
                <span className="cbm-chuong-ten">{c.ten}</span>
                <span className="cbm-chuong-dem">{moi ? `${daGiao}/${c.bai.length} bài đã giao` : 'Đã giao hết'}</span>
                <ChevronDown className="cbm-mui" size={18} aria-hidden="true" />
              </button>
              {mo && (
                <ul className="cbm-bai-ds">
                  {c.bai.map((b) => {
                    const dc = p.chon.includes(b.khoaBai)
                    const thuTu = dc ? p.chon.indexOf(b.khoaBai) + 1 : 0
                    if (b.trangThai !== 'moi') {
                      return (
                        <li key={b.khoaBai} className="cbm-bai cbm-bai--da" data-trang-thai={b.trangThai}>
                          <span className="cbm-so" aria-hidden="true">{b.so ?? '•'}</span>
                          <span className="cbm-ten"><b>{b.ten}</b><small>{b.chuThai}</small></span>
                          {p.onBoGiao && <button type="button" className="cbm-bo" onClick={() => p.onBoGiao!(b.khoaBai)}>Bỏ giao</button>}
                        </li>
                      )
                    }
                    return (
                      <li key={b.khoaBai}>
                        <label className="cbm-bai" data-chon={dc ? '' : undefined} data-khong={b.khongGiao ? '' : undefined}>
                          <input type="checkbox" className="cbm-o" checked={dc} disabled={b.khongGiao || p.dangGiao} onChange={() => p.onDoiChon(b.khoaBai)} />
                          <span className="cbm-tick" aria-hidden="true">{dc ? <Check size={16} strokeWidth={3} /> : null}</span>
                          <span className="cbm-so" aria-hidden="true">{b.so ?? '•'}</span>
                          <span className="cbm-ten">
                            <b>{b.ten}</b>
                            <small>{b.khongGiao ? 'Chưa có câu tự giao (chỉ có ví dụ minh hoạ)' : `${b.soCau} câu${b.chiaPhan ? ` · ${b.chiaPhan}` : ''}${b.ghiChu ? ` · ${b.ghiChu}` : ''}`}</small>
                          </span>
                          {dc && <span className="cbm-thu-tu" aria-label={`Bài chọn thứ ${thuTu}`}>{thuTu}</span>}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="cbm-day" data-khoi="tom-tat-giao" aria-live="polite">
        {p.xong ? (
          <p className="cbm-xong" role="status"><Check size={18} strokeWidth={3} aria-hidden="true" />{p.xong}</p>
        ) : !soChon ? (
          <p className="cbm-cho">Tick bài vừa dạy ở trên. App tự rút câu Trắc nghiệm, Đúng sai, Trả lời ngắn của các bài đã chọn; không giao Ví dụ minh hoạ và Các dạng toán.</p>
        ) : (
          <>
            <p className="cbm-tom-chu"><b>{soChon} bài</b> · {p.tom?.tenBai ?? '…'} · cho <b>{p.lopChu}</b></p>
            {p.loi ? (
              <p className="cbm-loi" role="alert">{p.loi}</p>
            ) : (
              <div className="cbm-so-hang" aria-busy={p.dangTinh}>
                <div className="cbm-o-so"><span>Câu sẽ luyện</span><b className="so">{p.tom ? p.tom.soCau : '—'}</b><small>{p.tom?.chiaPhan ?? 'đang tính…'}</small></div>
                <div className="cbm-o-so"><span>Hạn nộp</span><b className="so">{p.tom ? `${p.tom.soNgay} ngày` : '—'}</b><small>{p.tom?.hanChu ?? 'đang tính…'}</small></div>
                <div className="cbm-o-so"><span>Luyện kịp hết</span><b className="so">{p.tom ? `${p.tom.duLuot}/${p.tom.soEm}` : '—'}</b><small>{p.tom ? `em · ${p.tom.luotNgay} lượt/ngày` : 'đang tính…'}</small></div>
              </div>
            )}
            {p.chiTiet && (
              <>
                <button type="button" className="cbm-ct-nut" aria-expanded={moCt} onClick={() => setMoCt(!moCt)}>
                  {moCt ? 'Ẩn chi tiết' : 'Chi tiết · sửa hạn nộp, số lượt/ngày'}<ChevronDown size={16} aria-hidden="true" />
                </button>
                {moCt && <div className="cbm-ct">{p.chiTiet}</div>}
              </>
            )}
            {p.canhBao && <p className="cbm-loi" role="alert">{p.canhBao}</p>}
            <button type="button" className="cbm-giao" disabled={!p.tom || p.dangTinh || p.dangGiao || !!p.loi} onClick={p.onGiao}>
              {p.dangGiao ? 'Đang giao…' : `Giao ${soChon} bài cho ${p.lopChu}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
