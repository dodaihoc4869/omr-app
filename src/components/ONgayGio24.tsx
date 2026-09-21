import { useEffect, useRef, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import {
  buocO,
  bayGio,
  daQua,
  ghepGiaTri,
  hienGiaTri,
  nutNhanh,
  tachGiaTri,
  type MuiGio,
  type TruongNgayGio,
} from '../lib/ngay-gio-24'
import '../styles/o-ngay-gio-24.css'

const THU_TU: (keyof TruongNgayGio)[] = ['d', 'm', 'y', 'h', 'p']
const TOI_DA: Record<keyof TruongNgayGio, number> = { d: 2, m: 2, y: 4, h: 2, p: 2 }
const NHAN_O: Record<keyof TruongNgayGio, string> = { d: 'Ngày', m: 'Tháng', y: 'Năm', h: 'Giờ', p: 'Phút' }
const CHO_O: Record<keyof TruongNgayGio, string> = { d: 'dd', m: 'mm', y: 'yyyy', h: 'HH', p: 'mm' }
/** Chữ số ĐẦU lớn tới mức không thể thành số hai chữ số hợp lệ ⇒ tự nhảy sang ô kế (vd ngày "4" chỉ có thể là 04). */
const NHAY_SOM: Partial<Record<keyof TruongNgayGio, number>> = { d: 3, m: 1, h: 2, p: 5 }

/** Ô NGÀY / THÁNG / NĂM + GIỜ : PHÚT, 24 GIỜ, dùng CHUNG toàn app giáo viên (thầy yêu cầu 21/09) — thay `<input type="datetime-local"|"date">`, vốn hiện AM/PM hoặc mm/dd tuỳ máy.
 *  Năm ô số (bàn phím số trên điện thoại), mũi tên lên/xuống đổi từng ô, tự nhảy ô, nút nhanh "Hôm nay 23:59 · Mai 23:59 · +3 ngày · +7 ngày", báo lỗi ngày không có thật / đã qua.
 *  GIÁ TRỊ RA giữ nguyên dạng cũ: 'YYYY-MM-DDTHH:mm' (hoặc 'YYYY-MM-DD' khi `chiNgay`); chưa đủ / không có thật ⇒ '' (như ô cũ khi bỏ trống). Múi giờ do nơi dùng quyết
 *  (`hanNhapVietNam` đọc giờ VN, `new Date(local)` đọc giờ máy) — `muiGio` chỉ để biết "bây giờ" khi báo "đã qua" và tính nút nhanh. Không thư viện mới. */
export default function ONgayGio24({
  nhan,
  value,
  onChange,
  onLoi,
  chiNgay = false,
  nhanh = false,
  khongQuaKhu = false,
  muiGio = 'vn',
}: {
  /** Tên cả nhóm (đọc bằng trình đọc màn hình; test tìm theo tên này). */
  nhan: string
  value: string
  onChange: (v: string) => void
  /** Báo lời lỗi hiện tại ('' = ổn hoặc chưa nhập gì) — nơi dùng chặn nút Giao/Lưu khi còn lỗi. */
  onLoi?: (loi: string) => void
  chiNgay?: boolean
  nhanh?: boolean
  khongQuaKhu?: boolean
  muiGio?: MuiGio
}) {
  const coGio = !chiNgay
  const [f, setF] = useState<TruongNgayGio>(() => tachGiaTri(value))
  // Bản MỚI NHẤT của các ô (đồng bộ ngay trong lúc gõ): sự kiện blur do TỰ NHẢY Ô chạy trước khi React vẽ lại, nếu đọc `f` cũ thì "25" bị bù thành "02".
  const fRef = useRef(f)
  const [daRoi, setDaRoi] = useState(false)
  // "Đã qua" chỉ báo khi THẦY vừa chỉnh (gia hạn bài quá hạn: giá trị cũ vốn đã qua, không được đỏ ngay từ đầu).
  const [daChinh, setDaChinh] = useState(false)
  const oRef = useRef<Record<keyof TruongNgayGio, HTMLInputElement | null>>({ d: null, m: null, y: null, h: null, p: null })
  const phat = useRef(value)

  // Nơi dùng ĐỔI giá trị từ ngoài (mặc định, gia hạn, xoá): nạp lại các ô. Giá trị do CHÍNH ô vừa phát ra thì bỏ qua (không giật khi đang gõ dở).
  useEffect(() => {
    if (value !== phat.current) {
      phat.current = value
      fRef.current = tachGiaTri(value)
      setF(fRef.current)
    }
  }, [value])

  const k = ghepGiaTri(f, coGio)
  const nay = Date.now()
  const loiQua = khongQuaKhu && daChinh && k.gia && daQua(k.gia, nay, muiGio) ? 'Hạn nộp phải ở sau thời điểm hiện tại.' : ''
  const loi = k.loi || loiQua
  const chuaDu = k.daNhap && !k.gia && k.loi.startsWith('Nhập đủ')
  const hienLoi = loi !== '' && (!chuaDu || daRoi)

  useEffect(() => {
    onLoi?.(loi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loi])

  const datLai = (moi: TruongNgayGio) => {
    fRef.current = moi
    setF(moi)
    setDaChinh(true)
    const g = ghepGiaTri(moi, coGio).gia
    if (g !== phat.current) {
      phat.current = g
      onChange(g)
    }
  }

  const nhay = (t: keyof TruongNgayGio, huong: 1 | -1) => {
    const i = THU_TU.indexOf(t) + huong
    const tiep = THU_TU[i]
    if (tiep && (coGio || i < 3)) {
      oRef.current[tiep]?.focus()
      oRef.current[tiep]?.select()
    }
  }

  const go = (t: keyof TruongNgayGio, chu: string) => {
    const so = chu.replace(/\D/g, '').slice(0, TOI_DA[t])
    datLai({ ...fRef.current, [t]: so })
    const den = so.length === TOI_DA[t] || (so.length === 1 && NHAY_SOM[t] !== undefined && Number(so) > (NHAY_SOM[t] as number))
    if (den && so.length > 0) nhay(t, 1)
  }

  const phim = (t: keyof TruongNgayGio, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      datLai({ ...fRef.current, [t]: buocO(t, fRef.current, e.key === 'ArrowUp' ? 1 : -1, tachGiaTri(bayGio(Date.now(), muiGio))) })
    } else if (e.key === 'Backspace' && fRef.current[t] === '') {
      nhay(t, -1)
    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
      nhay(t, -1)
    } else if (e.key === 'ArrowRight' && e.currentTarget.selectionEnd === fRef.current[t].length) {
      nhay(t, 1)
    }
  }

  /** Rời ô: bù số 0 cho "5" → "05"; năm hai số "26" → "2026". */
  const roiO = (t: keyof TruongNgayGio) => {
    const x = fRef.current[t]
    if (x === '') return
    if (t === 'y') {
      if (x.length === 2) datLai({ ...fRef.current, y: `20${x}` })
    } else if (x.length === 1) datLai({ ...fRef.current, [t]: `0${x}` })
  }

  const o = (t: keyof TruongNgayGio) => (
    <input
      key={t}
      ref={(el) => {
        oRef.current[t] = el
      }}
      className={`ong24-o ong24-o--${t}`}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      maxLength={TOI_DA[t]}
      placeholder={CHO_O[t]}
      aria-label={NHAN_O[t]}
      aria-invalid={hienLoi || undefined}
      value={f[t]}
      onChange={(e) => go(t, e.target.value)}
      onKeyDown={(e) => phim(t, e)}
      onFocus={(e) => e.target.select()}
      onBlur={() => roiO(t)}
    />
  )

  return (
    <div
      className="ong24"
      role="group"
      aria-label={nhan}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDaRoi(true)
      }}
    >
      <div className="ong24-hang">
        <CalendarClock size={18} aria-hidden="true" className="ong24-icon" />
        <span className="ong24-nhom">
          {o('d')}
          <span className="ong24-cach" aria-hidden="true">
            /
          </span>
          {o('m')}
          <span className="ong24-cach" aria-hidden="true">
            /
          </span>
          {o('y')}
          {coGio && (
            <span className="ong24-cach ong24-cach--rong" aria-hidden="true">
              ·
            </span>
          )}
        </span>
        {coGio && (
          <span className="ong24-nhom">
            {o('h')}
            <span className="ong24-cach" aria-hidden="true">
              :
            </span>
            {o('p')}
            <span className="ong24-24h" aria-hidden="true">
              24 giờ
            </span>
          </span>
        )}
      </div>
      {nhanh && (
        <div className="ong24-nhanh" role="group" aria-label={`${nhan} — chọn nhanh`}>
          {nutNhanh(nay, muiGio, coGio).map((n) => (
            <button
              key={n.id}
              type="button"
              className="ong24-nut"
              onClick={() => {
                setDaRoi(true)
                datLai(tachGiaTri(n.gia))
              }}
            >
              {n.nhan}
            </button>
          ))}
        </div>
      )}
      {hienLoi ? (
        <p className="ong24-loi" role="alert">
          {loi}
        </p>
      ) : (
        k.gia && (
          <p className="ong24-hien" data-khoi="ong24-hien">
            {hienGiaTri(k.gia)}
          </p>
        )
      )}
    </div>
  )
}

