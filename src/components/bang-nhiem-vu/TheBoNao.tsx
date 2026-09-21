// THẺ "BỘ NÃO A.I HỖ TRỢ RIÊNG EM <họ tên>" trên Bảng nhiệm vụ.
//  · HỌC SINH: lời hôm nay; bấm "Xem N lời gần nhất" mở tờ trượt (tối đa 7 lời); "Ẩn hôm nay" cất thẻ tới ngày mai.
//  · PHỤ HUYNH: lời cho phụ huynh + thư tuần (gập/mở).
// Không có lời ⇒ KHÔNG dựng thẻ (không khung rỗng, không "chưa có lời"). Không emoji. Chữ do máy chủ gửi luôn được vẽ như CHỮ.
// Không tự lập cổng (test bang-nhiem-vu-1909 chỉ cho react + lucide-react): tờ trượt nằm trong cây bảng, `position: fixed`.
import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react'
import { nhanNgayLoi, nhanTuan, ngayHomNay, ngayNganVi, type BoNaoHocSinh, type BoNaoPhuHuynh } from '../../lib/bo-nao-hien-thi'
import './m3-theme.css'
import './bo-nao.css'

const khoaAn = (vaiTro: string, hoTen: string) => `ddh.bonao.an.${vaiTro}.${hoTen}`

function docAn(vaiTro: string, hoTen: string): string {
  try {
    return localStorage.getItem(khoaAn(vaiTro, hoTen)) ?? ''
  } catch {
    return ''
  }
}

function luuAn(vaiTro: string, hoTen: string, ngay: string): void {
  try {
    localStorage.setItem(khoaAn(vaiTro, hoTen), ngay)
  } catch {
    /* máy chặn lưu: thẻ vẫn ẩn tới khi tải lại trang */
  }
}

export default function TheBoNao({
  vaiTro,
  hoTen,
  now,
  hs,
  ph,
}: {
  vaiTro: 'hocsinh' | 'phuhuynh'
  hoTen: string
  now: number
  hs: BoNaoHocSinh | null
  ph: BoNaoPhuHuynh | null
}) {
  const laPh = vaiTro === 'phuhuynh'
  const homNay = ngayHomNay(now)
  // "Ẩn hôm nay": nhớ NGÀY đã ẩn; sang ngày mới (lời mới) là hiện lại.
  const ngayLoi = (laPh ? ph?.ngay : hs?.ngay) || homNay
  const [anLuc, setAnLuc] = useState(() => docAn(vaiTro, hoTen))
  const [moTo, setMoTo] = useState(false)
  const [moThu, setMoThu] = useState(() => !!(laPh && ph && ph.thuTuan && !ph.loiNhan))
  const nutMo = useRef<HTMLButtonElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const idTo = useId()

  useEffect(() => {
    if (!moTo) return
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoTo(false)
    }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [moTo])

  const co = laPh ? !!ph : !!hs
  if (!co || anLuc === ngayLoi) return null

  const tieuDe = `Bộ não A.I hỗ trợ riêng em ${hoTen}`.trim()
  const loiChinh = laPh ? ph!.loiNhan : hs!.loi
  const nhanPhu = laPh ? nhanNgayLoi(ph!.ngay, now, 'Lời cho anh chị') : nhanNgayLoi(hs!.ngay, now)
  const gan = hs?.gan ?? []
  const nhoNhieuLoi = !laPh && gan.length > 1

  const dongTo = () => {
    setMoTo(false)
    nutMo.current?.focus()
  }

  return (
    <section className="bnv-bn" data-vung="bo-nao" aria-label={tieuDe}>
      <div className="bnv-bn-dau">
        <span className="bnv-bn-o" aria-hidden="true">
          <Sparkles size={22} />
        </span>
        <div className="bnv-bn-tieu">
          <h2>{tieuDe}</h2>
          <span>{nhanPhu}</span>
        </div>
      </div>

      {loiChinh && <p className="bnv-bn-loi">{loiChinh}</p>}

      {laPh && ph!.thuTuan && (
        <div className="bnv-bn-thu">
          <button type="button" className="bnv-bn-thu-dau" aria-expanded={moThu} aria-controls={`${idTo}-thu`} onClick={() => setMoThu((v) => !v)}>
            <span>
              Thư tuần này
              {nhanTuan(ph!.tuanTu) && <small>{nhanTuan(ph!.tuanTu)}</small>}
            </span>
            <ChevronDown size={22} aria-hidden="true" />
          </button>
          {moThu && (
            <div className="bnv-bn-thu-noi" id={`${idTo}-thu`}>
              {ph!.thuTuan.split('\n').filter((d) => d.trim() !== '').map((d, i) => (
                <p key={i}>{d}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bnv-bn-chan">
        {nhoNhieuLoi ? (
          <button ref={nutMo} type="button" className="bnv-bn-nut" aria-haspopup="dialog" onClick={() => setMoTo(true)}>
            Xem {gan.length} lời gần nhất
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="bnv-bn-nut bnv-bn-nut--phu"
          onClick={() => {
            luuAn(vaiTro, hoTen, ngayLoi)
            setAnLuc(ngayLoi)
          }}
        >
          Ẩn hôm nay
        </button>
      </div>

      {moTo && (
        <>
          <button type="button" className="bnv-bn-man" aria-label="Đóng" tabIndex={-1} onClick={dongTo} />
          <div className="bnv-bn-to" role="dialog" aria-modal="true" aria-labelledby={`${idTo}-t`}>
            <div className="bnv-bn-tay" aria-hidden="true" />
            <div className="bnv-bn-to-dau">
              <div>
                <h2 id={`${idTo}-t`}>{gan.length} lời gần nhất</h2>
                <small>{tieuDe}</small>
              </div>
              <button ref={nutDong} type="button" className="bnv-bn-dong" aria-label="Đóng" onClick={dongTo}>
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <ol className="bnv-bn-ds">
              {gan.map((g, i) => (
                <li key={`${g.ngay}-${i}`}>
                  <time dateTime={g.ngay || undefined}>{g.ngay === homNay ? `Hôm nay · ${ngayNganVi(g.ngay)}` : ngayNganVi(g.ngay) || 'Lời trước'}</time>
                  <p>{g.loi}</p>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  )
}
