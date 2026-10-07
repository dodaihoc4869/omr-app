// MÀN CHỮA CÂU SAI — vòng chữa từng bước (đặc tả §11, 07/10/2026).
// Điểm nối: ManTuLuyen (sau kết quả sai), Đảo/Đoàn/Bi-a (§11.3–11.4).
// UX §11.6–11.9: một việc mỗi màn, tiến độ thực, không hứa % giả, không EXP.
import { useState, useEffect, useRef, useCallback, useId } from 'react'
import {
  apiMoDot, apiPhatItem, apiNopItem, apiXinGoiY,
  type KetQuaDot, type ItemCongKhai, type TrangThaiChua,
} from '../../lib/chua-cau-sai-api'
import './chua-cau-sai.css'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PropsChuaCauSai {
  token: string
  /** qid câu sai muốn chữa */
  qid: string
  /** Tên/tiêu đề câu để hiển thị trong header */
  tenCau?: string
  /** Gọi khi học sinh thoát */
  onVe: () => void
}

// ---------------------------------------------------------------------------
// Icon nội bộ (inline SVG nhỏ — không import thêm file)
// ---------------------------------------------------------------------------
function IcoVe() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IcoBuoc({ so, da }: { so: number; da: boolean }) {
  return (
    <span className="ccs-buoc-so" data-da={da ? 'true' : 'false'} aria-hidden="true">
      {da ? '✓' : so + 1}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Nhãn trạng thái thân thiện
// ---------------------------------------------------------------------------
function nhanTrangThai(tt: TrangThaiChua): string {
  switch (tt) {
    case 'can_chan_doan': return 'Tìm chỗ vướng'
    case 'dang_chua_buoc': return 'Đang gỡ từng bước'
    case 'dang_ghep_bai': return 'Ghép lại cả bài'
    case 'cho_gap_lai_2': return 'Hẹn kiểm lại'
    case 'dang_kiem_chung': return 'Kiểm chứng'
    case 'da_tu_sua': return 'Đã tự sửa'
    case 'can_thay': return 'Cần thầy'
    case 'thieu_hoc_lieu': return 'Chưa có bài luyện'
    case 'tam_khoa': return 'Tạm khóa'
    case 'cau_thay_doi': return 'Câu đã đổi'
    default: return tt
  }
}

// ---------------------------------------------------------------------------
// Component nhập liệu theo kiểu item
// ---------------------------------------------------------------------------
function OInputItem({
  item, giaTri, onChange, onSubmit, disabled,
}: {
  item: ItemCongKhai
  giaTri: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
}) {
  const id = useId()
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && giaTri.trim()) onSubmit()
  }

  if (item.kieu === 'chon' && item.luaChon?.length) {
    return (
      <fieldset className="ccs-nhom-chon" disabled={disabled}>
        <legend className="sr-only">Chọn đáp án</legend>
        {item.luaChon.map((lc) => (
          <label key={lc.ky} className="ccs-chon-muc" data-chon={giaTri === lc.ky ? 'true' : 'false'}>
            <input type="radio" name={`ccs-chon-${id}`} value={lc.ky} checked={giaTri === lc.ky} onChange={() => onChange(lc.ky)} />
            <span className="ccs-chon-ky">{lc.ky}</span>
            <span className="ccs-chon-noi">{lc.noi}</span>
          </label>
        ))}
      </fieldset>
    )
  }

  if (item.kieu === 'so') {
    return (
      <div className="ccs-nhap-so">
        <label htmlFor={id} className="sr-only">{item.hoi}</label>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="ccs-input"
          placeholder="Nhập số..."
          value={giaTri}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        {item.donVi && <span className="ccs-don-vi">{item.donVi}</span>}
      </div>
    )
  }

  // Mặc định: nhập tự do
  return (
    <div className="ccs-nhap-so">
      <label htmlFor={id} className="sr-only">{item.hoi}</label>
      <input
        id={id}
        type="text"
        className="ccs-input"
        placeholder="Nhập câu trả lời..."
        value={giaTri}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        autoComplete="off"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Màn chính
// ---------------------------------------------------------------------------
export default function ManChuaCauSai({ token, qid, tenCau, onVe }: PropsChuaCauSai) {
  const [dang, setDang] = useState<'dang_tai' | 'loi' | 'san_sang'>('dang_tai')
  const [loiText, setLoiText] = useState('')
  const [dotId, setDotId] = useState('')
  const [trangThai, setTrangThai] = useState<TrangThaiChua>('thieu_hoc_lieu')
  const [tienDo, setTienDo] = useState({ soBuocDaQua: 0, soBuocCanKiem: 0 })
  const [lanGapLai, setLanGapLai] = useState(0)
  const [denHan, setDenHan] = useState<string | undefined>()
  const [_lyDoThieu, setLyDoThieu] = useState<string | undefined>()

  const [item, setItem] = useState<ItemCongKhai | null>(null)
  const [traLoi, setTraLoi] = useState('')
  const [dangNop, setDangNop] = useState(false)
  const [phanHoi, setPhanHoi] = useState<{ dung: boolean; diemlech?: string; giaThiet?: string } | null>(null)
  const [goiY, setGoiY] = useState<string | null>(null)
  const [dangGoiY, setDangGoiY] = useState(false)

  const attemptRef = useRef(crypto.randomUUID())
  const inputRef = useRef<HTMLDivElement>(null)

  // Cập nhật trạng thái từ response
  const apDung = useCallback((r: KetQuaDot) => {
    if (r.dotId) setDotId(r.dotId)
    if (r.trangThai) setTrangThai(r.trangThai)
    if (r.tienDo) setTienDo(r.tienDo)
    if (r.lanGapLai != null) setLanGapLai(r.lanGapLai)
    if (r.denHan != null) setDenHan(r.denHan)
    if (r.lyDoThieu != null) setLyDoThieu(r.lyDoThieu)
    if (r.item) { setItem(r.item); setTraLoi(''); setPhanHoi(null); setGoiY(null) }
    else setItem(null)
  }, [])

  // Khởi tạo: mở đợt
  useEffect(() => {
    let huỷ = false
    setDang('dang_tai')
    ;(async () => {
      const r = await apiMoDot(token, qid)
      if (huỷ) return
      if (!r.ok) { setLoiText(r.loi ?? 'Không mở được đợt chữa.'); setDang('loi'); return }
      apDung(r)
      // Với trạng thái active, lấy item ngay
      if (r.dotId && r.trangThai && !['thieu_hoc_lieu', 'tam_khoa', 'can_thay', 'da_tu_sua', 'cau_thay_doi', 'cho_gap_lai_2'].includes(r.trangThai)) {
        const r2 = await apiPhatItem(token, r.dotId)
        if (!huỷ) apDung(r2)
      }
      if (!huỷ) setDang('san_sang')
    })()
    return () => { huỷ = true }
  }, [token, qid, apDung])

  // Nộp bài
  const nopBai = async () => {
    if (!item || !traLoi.trim() || dangNop) return
    setDangNop(true)
    const aid = attemptRef.current
    const r = await apiNopItem(token, dotId, item.id, traLoi.trim(), aid)
    setDangNop(false)
    if (!r.ok) { setLoiText(r.loi ?? 'Lỗi nộp bài.'); return }
    setPhanHoi({ dung: !!r.dung, diemlech: r.diemlech, giaThiet: r.giaThiet })
    // Sau khi nộp, tải item tiếp
    attemptRef.current = crypto.randomUUID()
    setTimeout(async () => {
      const r2 = await apiPhatItem(token, dotId)
      apDung(r2)
    }, 800)
  }

  // Xin gợi ý
  const xinGoiYCb = async () => {
    if (!item || dangGoiY) return
    setDangGoiY(true)
    const r = await apiXinGoiY(token, dotId, item.id)
    setDangGoiY(false)
    if (!r.ok) { setLoiText(r.loi ?? 'Không xin được gợi ý.'); return }
    setGoiY(r.noiDungGoiY ?? 'Xem lại bước tính...')
  }

  // =========== RENDER ===========

  if (dang === 'dang_tai') {
    return (
      <div className="ccs" role="status" aria-live="polite">
        <div className="ccs-dang-tai">Đang tải…</div>
      </div>
    )
  }

  if (dang === 'loi') {
    return (
      <div className="ccs">
        <header className="ccs-dau">
          <button type="button" className="ccs-ve" onClick={onVe} aria-label="Về"><IcoVe /></button>
          <h1 className="ccs-tieu">Chữa câu sai</h1>
        </header>
        <main className="ccs-than">
          <p className="ccs-loi" role="alert">{loiText}</p>
          <button type="button" className="ccs-nut-chinh" onClick={onVe}>Quay lại</button>
        </main>
      </div>
    )
  }

  // Tiêu đề bước
  const buocText = item?.tieuDe
    ? `Bước ${(item.buocSo ?? 0) + 1}/${tienDo.soBuocCanKiem || 1} · ${item.tieuDe}`
    : nhanTrangThai(trangThai)

  // Màn trạng thái đóng
  const mangThongBao = (msg: string, ctaLabel?: string, ctaClick?: () => void) => (
    <div className="ccs">
      <header className="ccs-dau">
        <button type="button" className="ccs-ve" onClick={onVe} aria-label="Về"><IcoVe /></button>
        <h1 className="ccs-tieu">{tenCau ?? 'Câu sai'}</h1>
      </header>
      <main className="ccs-than">
        <p className="ccs-thong-bao">{msg}</p>
        {ctaLabel && ctaClick && (
          <button type="button" className="ccs-nut-chinh" onClick={ctaClick}>{ctaLabel}</button>
        )}
        <button type="button" className="ccs-nut-phu" onClick={onVe}>Về danh sách</button>
      </main>
    </div>
  )

  if (trangThai === 'thieu_hoc_lieu') {
    return mangThongBao('Câu này chưa có bài luyện — thầy đang soạn. Em sẽ thấy thông báo khi sẵn sàng.')
  }
  if (trangThai === 'tam_khoa') {
    return mangThongBao('Đang có ca kiểm tra — tính năng tạm khóa, em quay lại sau khi ca kết thúc.')
  }
  if (trangThai === 'cau_thay_doi') {
    return mangThongBao('Câu này đã được cập nhật, không thể chữa lượt cũ. Em luyện câu mới.')
  }
  if (trangThai === 'can_thay') {
    return mangThongBao('Bước này em đã thử hết cách — thầy sẽ giúp trực tiếp. Thầy nhận được bằng chứng bế tắc của em rồi.')
  }
  if (trangThai === 'da_tu_sua') {
    return (
      <div className="ccs">
        <header className="ccs-dau">
          <button type="button" className="ccs-ve" onClick={onVe} aria-label="Về"><IcoVe /></button>
          <h1 className="ccs-tieu">{tenCau ?? 'Câu sai'}</h1>
        </header>
        <main className="ccs-than ccs-than-xong">
          <div className="ccs-xong-icon" aria-hidden="true">✓</div>
          <h2 className="ccs-xong-tieu">Em đã tự sửa được!</h2>
          <p className="ccs-xong-mo">
            {lanGapLai >= 2
              ? 'Em vừa tự giải một bản mới mà không cần gợi ý — lỗi này đã được đóng.'
              : 'Em đã gỡ xong các bước. Còn một lượt kiểm lại sau khi nghỉ ngơi để chắc chắn.'}
          </p>
          {denHan && (
            <p className="ccs-xong-hen">Lịch kiểm lại: {denHan}</p>
          )}
          <button type="button" className="ccs-nut-chinh" onClick={onVe}>Xong lượt chữa</button>
        </main>
      </div>
    )
  }
  if (trangThai === 'cho_gap_lai_2') {
    return mangThongBao(
      `Em đã gỡ xong các bước! ${denHan ? `Lịch kiểm lại: ${denHan}` : 'Em sẽ kiểm lại sau ít nhất 24 giờ — để trí nhớ củng cố.'}`,
    )
  }

  // Màn chữa tích cực (can_chan_doan, dang_chua_buoc, dang_ghep_bai, dang_kiem_chung)
  return (
    <div className="ccs">
      <header className="ccs-dau">
        <button type="button" className="ccs-ve" onClick={onVe} aria-label="Về"><IcoVe /></button>
        <div className="ccs-dau-giua">
          <span className="ccs-nhan-trang-thai">{nhanTrangThai(trangThai)}</span>
          <h1 className="ccs-tieu">{tenCau ?? 'Câu sai'}</h1>
        </div>
      </header>

      {/* Tiến độ bước */}
      {tienDo.soBuocCanKiem > 0 && (
        <div className="ccs-tien-do" aria-label="Tiến độ chữa bước">
          {Array.from({ length: tienDo.soBuocCanKiem }).map((_, i) => (
            <IcoBuoc key={i} so={i} da={i < tienDo.soBuocDaQua} />
          ))}
          <span className="ccs-tien-do-chu">
            {tienDo.soBuocDaQua}/{tienDo.soBuocCanKiem} bước đã kiểm
          </span>
        </div>
      )}

      <main className="ccs-than" ref={inputRef}>
        {item ? (
          <>
            {/* Tiêu đề bước */}
            <p className="ccs-buoc-text">{buocText}</p>

            {/* Câu hỏi */}
            <div className="ccs-hoi" role="group" aria-label="Câu hỏi">
              <p className="ccs-hoi-text">{item.hoi}</p>
              <OInputItem
                item={item}
                giaTri={traLoi}
                onChange={setTraLoi}
                onSubmit={nopBai}
                disabled={dangNop || !!phanHoi?.dung}
              />
            </div>

            {/* Gợi ý */}
            {goiY && (
              <div className="ccs-goi-y" role="status">
                <p className="ccs-goi-y-nhan">Gợi ý:</p>
                <p className="ccs-goi-y-noi">{goiY}</p>
              </div>
            )}

            {/* Phản hồi sau nộp */}
            {phanHoi && (
              <div className="ccs-phan-hoi" data-dung={phanHoi.dung ? 'true' : 'false'} role="status" aria-live="polite">
                {phanHoi.dung ? (
                  <p>✓ Đúng rồi!</p>
                ) : (
                  <>
                    <p>Chưa đúng.</p>
                    {phanHoi.diemlech && <p className="ccs-diemlech">{phanHoi.diemlech}</p>}
                  </>
                )}
              </div>
            )}

            {/* Lỗi */}
            {loiText && <p className="ccs-loi" role="alert">{loiText}</p>}

            {/* Nút hành động */}
            <div className="ccs-hang-nut">
              {!phanHoi?.dung && (
                <button
                  type="button"
                  className="ccs-nut-chinh"
                  disabled={!traLoi.trim() || dangNop}
                  onClick={nopBai}
                >
                  {dangNop ? 'Đang kiểm…' : 'Nộp'}
                </button>
              )}
              {!phanHoi && !goiY && (
                <button type="button" className="ccs-nut-phu" disabled={dangGoiY} onClick={xinGoiYCb}>
                  {dangGoiY ? '…' : 'Xin gợi ý'}
                </button>
              )}
              {phanHoi?.dung && (
                <p className="ccs-ghi">Đang tải bước tiếp…</p>
              )}
            </div>
          </>
        ) : (
          <div className="ccs-dang-tai" role="status">Đang tải câu…</div>
        )}
      </main>
    </div>
  )
}
