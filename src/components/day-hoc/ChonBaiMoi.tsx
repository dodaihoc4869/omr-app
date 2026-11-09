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
  /** Bài kế tiếp nên giao (09/11, hộp Giao bài) ⇒ nhãn «Gợi ý». */
  goiY?: boolean
}
export interface ChuongMoi { ten: string; bai: DongBaiMoi[] }
/** Tóm tắt hộp Giao bài (09/11, bản vẽ docs/ban-ve-giao-bai-0911): ba ô Câu mới · Đề chuẩn · Hạn chung cả lớp — số do máy chủ tính (`xem-truoc`). */
export interface TomTatGiao {
  /** «Bài 10, Bài 11». */
  tenBai: string
  soCau: number
  /** Số ngày câu mới (28 câu/ngày). */
  soNgayMoi: number
  /** Đề chuẩn: suất đúng ô / 28 mỗi ngày; null = máy chủ chưa gửi. */
  dungO: number | null
  thieuDS: number
  /** Hạn chung: số ngày + chữ ngày hết hạn; null = máy chủ chưa gửi. */
  hanNgay: number | null
  hanChu: string
  duKienXong: number
  soEm: number
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
  /** Nhãn nút mở `chiTiet` (09/11: «Không giao cho vài em…»). */
  chiTietNhan?: string
  /** Bài đang giao: mở hộp sửa em nhận bài. */
  onSuaEm?: (khoaBai: string) => void
}) {
  const id = useId()
  const [moCt, setMoCt] = useState(false)
  // Chương còn bài chưa giao mở sẵn; chương đã giao hết gọn lại (thầy bấm mở được).
  const [moChuong, setMoChuong] = useState<Set<string>>(() => new Set(p.chuong.filter((c) => c.bai.some((b) => b.trangThai === 'moi' && !b.cu) || c.bai.some((b) => p.chon.includes(b.khoaBai))).map((c) => c.ten)))
  const doiChuong = (t: string) => setMoChuong((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n })
  const soChon = p.chon.length
  // Chương đã giao hết (không bài mới, không bài đang chọn) gộp MỘT dòng «Hiện N chương đã giao hết» (bản vẽ 09/11).
  const [hienHet, setHienHet] = useState(false)
  const laHet = (c: ChuongMoi) => !c.bai.some((b) => b.trangThai === 'moi') && !c.bai.some((b) => p.chon.includes(b.khoaBai))
  const het = p.chuong.filter(laHet)
  const ds = hienHet ? p.chuong : p.chuong.filter((c) => !laHet(c))
  return (
    <div className="cbm" data-khoi="chon-bai-moi">
      <div className="cbm-dau">
        <h3 id={`${id}-t`}>Chọn bài vừa dạy</h3>
        <span className="cbm-goi-y">Chọn được nhiều bài · {p.lopChu}</span>
      </div>
      <div className="cbm-ds" role="group" aria-labelledby={`${id}-t`}>
        {het.length > 0 && (
          <button type="button" className="cbm-het" aria-expanded={hienHet} onClick={() => setHienHet(!hienHet)}>
            <ChevronDown className="cbm-mui" size={18} aria-hidden="true" />
            {hienHet ? `Ẩn ${het.length} chương đã giao hết` : `Hiện ${het.length} chương đã giao hết (${het.map((c) => c.ten).join(', ')})`}
          </button>
        )}
        {ds.map((c) => {
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
                          {p.onSuaEm && <button type="button" className="cbm-bo" onClick={() => p.onSuaEm!(b.khoaBai)}>Sửa em</button>}
                          {p.onBoGiao && <button type="button" className="cbm-bo" onClick={() => p.onBoGiao!(b.khoaBai)}>Gỡ bài</button>}
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
                          {b.goiY && <span className="cbm-goi-y-chip">Gợi ý</span>}
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
          <p className="cbm-cho">Tick bài vừa dạy ở trên. Máy đặt hạn chung cho lớp và tự xếp 28 câu mỗi ngày cho từng em; không giao Ví dụ minh hoạ và Các dạng toán.</p>
        ) : (
          <>
            <p className="cbm-tom-chu"><b>{soChon} bài</b> · {p.tom?.tenBai ?? '…'} · cho <b>{p.lopChu}</b></p>
            {p.loi ? (
              <p className="cbm-loi" role="alert">{p.loi}</p>
            ) : (
              <div className="cbm-so-hang" aria-busy={p.dangTinh}>
                <div className="cbm-o-so"><span>Câu mới</span><b className="so">{p.tom ? p.tom.soCau : '—'}</b><small>{p.tom ? `${p.tom.soNgayMoi} ngày · 28 câu/ngày` : 'đang tính…'}</small></div>
                {/* Thầy 09/11 «không có cái gì cần thầy cả»: chỉ báo thông tin, máy tự bù bằng câu ô gần nhất — không nhắc thầy bổ sung. */}
                <div className="cbm-o-so">
                  <span>Đề chuẩn</span><b className="so">{p.tom?.dungO != null ? `${p.tom.dungO}/28` : '—'}</b>
                  <small>{!p.tom ? 'đang tính…' : p.tom.dungO != null && p.tom.dungO < 28 ? 'đúng mức đề thi; ô thiếu máy bù bằng câu ô khác' : 'đúng mức đề thi'}</small>
                </div>
                <div className="cbm-o-so"><span>Hạn chung cả lớp</span><b className="so">{p.tom?.hanNgay != null ? `${p.tom.hanNgay} ngày` : '—'}</b>
                  <small>{!p.tom ? 'đang tính…' : p.tom.hanNgay != null ? `${p.tom.hanChu} · ${p.tom.duKienXong}/${p.tom.soEm} em dự kiến xong hết` : p.tom.hanChu}</small></div>
              </div>
            )}
            {p.tom && !p.loi && <p className="cbm-ghi">Cả lớp chung hạn. Máy tự xếp 28 câu mỗi ngày cho từng em: em xong sớm được Ôn thêm, em yếu được nhiều ngày Sửa hơn.</p>}
            {p.chiTiet && (
              <>
                <button type="button" className="cbm-ct-nut" aria-expanded={moCt} onClick={() => setMoCt(!moCt)}>
                  {moCt ? 'Ẩn' : (p.chiTietNhan ?? 'Chi tiết')}<ChevronDown size={16} aria-hidden="true" />
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
