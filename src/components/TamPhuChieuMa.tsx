import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { dinhDangMa } from '../lib/them-phut-api'
import { duongQr, taoQr } from '../lib/ma-qr'
import './chieu-ma.css'

/** Một em đã vào (phòng chờ hoặc đã nhận đề). CHỈ tên — không điểm, không đáp án, không lý do gì. */
export interface EmDaVao {
  sbd: string
  hoTen: string
}
export interface PhongChoChieu {
  em: EmDaVao[]
  /** Sĩ số dự kiến (danh sách mời / lớp); không biết ⇒ null (chỉ hiện "x em"). */
  siSo: number | null
}
/** Nhịp tự làm mới danh sách em đã vào (thầy 28/09: "tự động cập nhật 5 giây một lần"). */
export const NHIP_PHONG_CHO_MS = 5000

/** Gộp em đứng ở phòng chờ + em đã nhận đề thành MỘT danh sách (không trùng SBD). Chỉ lấy tên. */
export function gopEmDaVao(dsCho: readonly { sbd: string; hoTen: string }[] | undefined, luot: readonly { sbd: string; hoTen?: string }[] | undefined): EmDaVao[] {
  const ra = new Map<string, EmDaVao>()
  for (const x of dsCho ?? []) if (x.sbd && !ra.has(x.sbd)) ra.set(x.sbd, { sbd: x.sbd, hoTen: (x.hoTen || '').trim() })
  for (const x of luot ?? []) if (x.sbd && !ra.has(x.sbd)) ra.set(x.sbd, { sbd: x.sbd, hoTen: (x.hoTen || '').trim() })
  return [...ra.values()]
}

/** Tên gọi ngắn cho chip đọc từ cuối lớp: "Nguyễn Minh Anh" ⇒ "Minh Anh"; tên rỗng ⇒ "SBD …". */
export function tenChip(e: EmDaVao): string {
  const t = e.hoTen.split(/\s+/).filter(Boolean)
  if (t.length === 0) return `SBD ${e.sbd}`
  return t.length >= 3 ? t.slice(-2).join(' ') : t.join(' ')
}

/** CHIẾU MÃ VÀO THI — tấm phủ toàn màn cho máy chiếu (thầy 28/09: làm lại, hiện đại, tự cập nhật 5 giây/lần em vào phòng chờ).
 *  Trái: mã ca chữ rất to (tách nhóm 3 số) + QR + link ngắn + tên ca · lớp. Phải: "Đã vào phòng chờ x / sĩ số" + chip tên em (em mới vào hiện nhẹ).
 *  `hoiPhongCho` vắng ⇒ chỉ hiện mã (và `soEmCho` nếu màn cha truyền). Tự làm mới: hỏi ngay khi mở, rồi mỗi 5 giây; TAB ẨN thì không hỏi (hiện lại hỏi
 *  ngay); đóng màn là dừng. Lỗi mạng ⇒ GIỮ danh sách cũ + chấm "mất kết nối" nhỏ. TUYỆT ĐỐI không hiện điểm / đáp án. Đóng: Esc hoặc nút Đóng. */
export default function TamPhuChieuMa({
  maCa,
  tenCa,
  diaChi,
  soEmCho,
  onDong,
  link,
  lop,
  hoiPhongCho,
}: {
  maCa: string
  tenCa: string
  diaChi: string
  soEmCho: number | null
  onDong: () => void
  /** Link đầy đủ để mã hoá QR (vắng ⇒ dùng `diaChi`). */
  link?: string
  lop?: string
  hoiPhongCho?: () => Promise<PhongChoChieu>
}) {
  const nutDong = useRef<HTMLButtonElement>(null)
  const [pc, setPc] = useState<PhongChoChieu | null>(null)
  const [matKetNoi, setMatKetNoi] = useState(false)
  const daThay = useRef<Set<string> | null>(null)
  const [moi, setMoi] = useState<Set<string>>(new Set())

  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDong()
      }
    }
    window.addEventListener('keydown', phim, true)
    return () => {
      window.removeEventListener('keydown', phim, true)
      truoc?.focus?.()
    }
  }, [onDong])

  // TỰ LÀM MỚI 5 GIÂY — dừng khi tab ẩn / đóng màn; không chồng lượt; lỗi giữ danh sách cũ.
  const hoiRef = useRef(hoiPhongCho)
  hoiRef.current = hoiPhongCho
  const coHoi = !!hoiPhongCho
  useEffect(() => {
    if (!coHoi) return
    let dung = false
    let dangHoi = false
    const hoi = async () => {
      if (dung || dangHoi || document.visibilityState === 'hidden' || !hoiRef.current) return
      dangHoi = true
      try {
        const r = await hoiRef.current()
        if (dung) return
        const cu = daThay.current
        setMoi(cu ? new Set(r.em.filter((e) => !cu.has(e.sbd)).map((e) => e.sbd)) : new Set())
        daThay.current = new Set(r.em.map((e) => e.sbd))
        setPc(r)
        setMatKetNoi(false)
      } catch {
        if (!dung) setMatKetNoi(true)
      } finally {
        dangHoi = false
      }
    }
    void hoi()
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
  }, [coHoi])

  const qr = taoQr(link || diaChi)
  const ve = qr ? duongQr(qr) : null
  const soVao = pc ? pc.em.length : soEmCho

  return (
    <div className="ca-chieu cm" role="dialog" aria-modal="true" aria-label="Chiếu mã vào thi">
      <button ref={nutDong} type="button" className="ca-chieu-dong cm-dong" onClick={onDong}>
        <X size={20} aria-hidden="true" /> Đóng
      </button>
      <div className={`cm-luoi${coHoi ? ' cm-co-ds' : ''}`}>
        <section className="ca-chieu-than cm-trai" aria-label="Mã vào thi">
          <p className="ca-chieu-nhan cm-nhan">MÃ VÀO THI</p>
          <div className="ca-chieu-ma cm-ma" aria-label={`Mã ca ${maCa}`}>
            {dinhDangMa(maCa)}
          </div>
          {(tenCa || lop) && (
            <p className="ca-chieu-ten cm-ten">
              {tenCa}
              {tenCa && lop && !tenCa.includes(lop) ? ` · Lớp ${lop}` : !tenCa && lop ? `Lớp ${lop}` : ''}
            </p>
          )}
          <div className="cm-vao">
            {ve && (
              <svg className="cm-qr" viewBox={`0 0 ${ve.canh} ${ve.canh}`} role="img" aria-label="Mã QR vào thi" shapeRendering="crispEdges">
                <rect width={ve.canh} height={ve.canh} className="cm-qr-nen" />
                <path d={ve.d} className="cm-qr-o" />
              </svg>
            )}
            <p className="ca-chieu-huong-dan cm-huong-dan">
              Quét mã QR, hoặc mở <b>{diaChi}</b> rồi nhập mã.
            </p>
          </div>
        </section>
        {coHoi ? (
          <section className="cm-phai" aria-label="Đã vào phòng chờ">
            <div className="cm-phai-dau">
              <h2>Đã vào phòng chờ</h2>
              {matKetNoi && (
                <span className="cm-mat" role="status" title="Mất kết nối — đang thử lại">
                  <i aria-hidden="true" /> mất kết nối
                </span>
              )}
            </div>
            <p className="ca-chieu-cho cm-dem" role="status">
              <b>{soVao ?? 0}</b>
              {pc?.siSo ? <span> / {pc.siSo} em</span> : <span> em</span>}
            </p>
            {pc && pc.siSo ? (
              <div className="cm-vach" role="progressbar" aria-label="Em đã vào trên sĩ số" aria-valuemin={0} aria-valuemax={pc.siSo} aria-valuenow={Math.min(pc.em.length, pc.siSo)}>
                <i style={{ width: `${Math.min(100, (pc.em.length / pc.siSo) * 100)}%` }} />
              </div>
            ) : null}
            {pc && pc.em.length === 0 && <p className="cm-rong">Chưa em nào vào. Màn tự cập nhật mỗi 5 giây.</p>}
            {pc && pc.em.length > 0 && (
              <ul className="cm-chip-ds">
                {pc.em.map((e) => (
                  <li key={e.sbd} className={moi.has(e.sbd) ? 'cm-chip cm-moi' : 'cm-chip'}>
                    {tenChip(e)}
                  </li>
                ))}
              </ul>
            )}
            {!pc && !matKetNoi && <p className="cm-rong">Đang lấy danh sách…</p>}
          </section>
        ) : (
          soEmCho !== null && (
            <p className="ca-chieu-cho cm-dem-le" role="status">
              {soEmCho} em đã vào phòng chờ
            </p>
          )
        )}
      </div>
    </div>
  )
}
