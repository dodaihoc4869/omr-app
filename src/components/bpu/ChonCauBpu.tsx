// BÌNH PHẢN ỨNG — CHỌN CÂU NGAY TRÊN BẢNG CHIẾU (thầy 09/11: «có nút xong điểm danh rồi chọn câu chiếu ngay trên màn điểm danh đó»).
// Mảnh nạp lười (chỉ khi thầy bấm «Xong điểm danh» / «Chọn câu»). Kho = nhánh DẠY HỌC (cùng kho bảng Dạy học). Trái: bài (câu đã chọn cho buổi ở
// bảng Dạy học đứng đầu, lọc khối theo lớp, ô tìm); phải: thẻ câu của bài. Bấm thẻ ⇒ chiếu từ câu ấy (các câu sau của bài nối tiếp cho «Câu tiếp»).
// Thầy tự chọn ⇒ hiện cả câu tự luận (luật «Gọi lên bảng thầy chọn gì hiện đúng thế»). Nằm trong sân khấu 1920×1080 của bảng ⇒ cỡ theo px sân khấu.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TeacherExamSource } from '../../data/examContent'
import { cauTuDeChon, tomTatDe, type CauDayHoc } from '../../lib/day-hoc-len-bang'
import { baiDaChonCuaBuoi, napKhoDayHoc } from '../../lib/bpu/to-chieu-bpu'
import { CalendarCheck, ClipboardCheck, Flame, Power, Presentation } from 'lucide-react'
import './chon-cau.css'

const DA_CHON = '__da-chon'
const LOAI: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
const MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const tenBai = (s: TeacherExamSource) => (s.nguon || s.maDe).split(' — ')[0]!.trim()
/** «12 · DẠY HỌC/C1 - Ester» ⇒ { khoi: '12', chuong: 'C1 - Ester' }. */
function nhomCua(s: TeacherExamSource): { khoi: string; chuong: string } {
  const n = (s.nhom || '').trim(), i = n.indexOf('·'), j = n.lastIndexOf('/')
  return { khoi: i >= 0 ? n.slice(0, i).trim() : '', chuong: j >= 0 ? n.slice(j + 1).trim() : n }
}
/** Loại câu của bài (kho Dạy học tách theo phần ⇒ một bài thường chỉ một loại). */
const loaiBai = (s: TeacherExamSource) => [s.phanI.length ? 'Trắc nghiệm' : '', s.phanII.length ? 'Đúng–sai' : '', s.phanIII.length ? 'Trả lời ngắn' : ''].filter(Boolean).join(' · ')
const boDau = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export interface PropsChonCau {
  buoiId: string
  lop: string
  /** Dựng tờ + chiếu; trả lời báo lỗi (rỗng = đã chiếu). */
  onChieu: (ds: CauDayHoc[]) => Promise<string>
  onDong: () => void
  /** (09/11) Bước mở đầu: 'hd' = «Hôm nay làm gì?» (sau Xong điểm danh) · 'cau' = thẳng bảng chọn câu. */
  buocDau?: 'hd' | 'cau' | false
  /** Kiểm tra đầu giờ / Chữa câu khó / Kiểm tra ôn tập ⇒ tấm buổi dạy. */
  onHoatDong?: (hd: 'dau-gio' | 'chua-cau' | 'on-tap') => void
  /** Kết thúc buổi học (trả câu báo lỗi, rỗng = xong). */
  onKetThuc?: () => Promise<string>
}

// «HÔM NAY LÀM GÌ?» (thầy 09/11 «cho nguyên hành trình dạy học vào chỗ chọn sau khi điểm danh xong tinh tế đẹp mắt hiệu quả»): bốn thẻ lớn trên bảng.
const HD: { id: 'day-hoc' | 'dau-gio' | 'chua-cau' | 'on-tap'; ten: string; mo: string; Icon: typeof Flame; phim: string }[] = [
  { id: 'day-hoc', ten: 'Dạy học · chiếu câu', mo: 'Chọn câu trong kho Dạy học, cả lớp cùng làm trên máy, gọi em lên bảng.', Icon: Presentation, phim: '1' },
  { id: 'dau-gio', ten: 'Kiểm tra đầu giờ', mo: 'App chọn tối đa 6 em có mặt, mỗi em một câu em đã làm đúng; thầy chấm Đạt / Chưa đạt.', Icon: ClipboardCheck, phim: '2' },
  { id: 'chua-cau', ten: 'Chữa câu khó & tính toán', mo: 'Câu nhiều em sai nhất và câu tính toán thầy chọn; mỗi câu gọi một em làm sai lên chữa.', Icon: Flame, phim: '3' },
  { id: 'on-tap', ten: 'Kiểm tra ôn tập', mo: 'Ngoài buổi dạy · lịch và đề dành riêng cho từng em.', Icon: CalendarCheck, phim: '4' },
]
function HomNayLamGi({ onChon, onDong, onKetThuc }: { onChon: (id: (typeof HD)[number]['id']) => void; onDong: () => void; onKetThuc?: () => Promise<string> }) {
  const goc = useRef<HTMLDivElement>(null)
  // Kết thúc buổi: bấm lần 1 ⇒ nút đổi «Bấm lần nữa để kết thúc» (5 giây); lần 2 ⇒ đóng buổi (không cần hộp hỏi — hộp của app nằm dưới bảng).
  const [xacNhan, setXacNhan] = useState(false)
  const [dangKt, setDangKt] = useState('')
  useEffect(() => { if (!xacNhan) return; const h = setTimeout(() => setXacNhan(false), 5000); return () => clearTimeout(h) }, [xacNhan])
  const ketThuc = async () => { if (!onKetThuc) return; if (!xacNhan) { setXacNhan(true); return } setDangKt('…'); const loi = await onKetThuc(); setDangKt(loi); setXacNhan(false) }
  useEffect(() => { goc.current?.querySelector('button')?.focus() }, [])
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { const m = HD.find((x) => x.phim === e.key); if (m) { e.preventDefault(); onChon(m.id) } }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [onChon])
  return (
    <div className="bcc bcc-hd" role="dialog" aria-label="Hôm nay làm gì?" ref={goc}>
      <div className="bcc-dau">
        <h2>Hôm nay làm gì?</h2>
        <p>Điểm danh xong. Chọn một hoạt động — xong quay lại chọn hoạt động khác.</p>
        <button type="button" className="bcc-dong" onClick={onDong}><kbd>Esc</kbd>Đóng</button>
      </div>
      <div className="bcc-hd-luoi">
        {HD.map(({ id, ten, mo, Icon, phim }, i) => (
          <button key={id} type="button" className="bcc-hd-the" data-chinh={i === 0 || undefined} onClick={() => onChon(id)}>
            <span className="bcc-hd-icon" aria-hidden="true"><Icon size={44} strokeWidth={2.2} /></span>
            <b>{ten}</b><span>{mo}</span><kbd>{phim}</kbd>
          </button>
        ))}
      </div>
      {onKetThuc ? (
        <div className="bcc-ket-thuc">
          <span>{dangKt && dangKt !== '…' ? dangKt : 'Xong cả buổi? Kết thúc để các em thoát Bình Phản Ứng.'}</span>
          <button type="button" data-xac-nhan={xacNhan || undefined} disabled={dangKt === '…'} onClick={() => void ketThuc()}>
            <Power size={26} aria-hidden="true" />{dangKt === '…' ? 'Đang kết thúc…' : xacNhan ? 'Bấm lần nữa để kết thúc' : 'Kết thúc buổi học'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function ChonCauBpu(p: PropsChonCau) {
  const [buoc, setBuoc] = useState<'hd' | 'cau'>(p.buocDau === 'hd' && p.onHoatDong ? 'hd' : 'cau')
  if (buoc === 'hd') return <HomNayLamGi onDong={p.onDong} onKetThuc={p.onKetThuc} onChon={(id) => { if (id === 'day-hoc') setBuoc('cau'); else p.onHoatDong?.(id) }} />
  return <ChonCau {...p} />
}

function ChonCau({ buoiId, lop, onChieu, onDong }: PropsChonCau) {
  const [kho, setKho] = useState<TeacherExamSource[] | null>(null)
  const [loi, setLoi] = useState('')
  const [lan, setLan] = useState(0)
  const [tim, setTim] = useState('')
  const khoiLop = /^(10|11|12)/.exec(lop.trim())?.[1] ?? ''
  const [khoi, setKhoi] = useState(khoiLop)
  const daChon = useMemo(() => baiDaChonCuaBuoi(buoiId), [buoiId])
  const [bai, setBai] = useState<string>(daChon.maChon.length ? DA_CHON : '')
  const [dang, setDang] = useState<string | null>(null)
  const [loiChieu, setLoiChieu] = useState('')
  const cot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let con = true
    napKhoDayHoc().then((k) => { if (con) setKho(k) }, () => { if (con) setLoi('Chưa đọc được kho đề trên máy này.') })
    return () => { con = false }
  }, [lan])

  const cauDaChon = useMemo(() => {
    if (!kho || !daChon.maChon.length) return []
    const bo = new Set(daChon.boCau)
    return cauTuDeChon(kho, new Set(daChon.maChon)).filter((c) => !bo.has(c.khoa))
  }, [kho, daChon])
  // Bài theo chương (giữ thứ tự kho), lọc khối + ô tìm (không dấu).
  const nhom = useMemo(() => {
    const m = new Map<string, TeacherExamSource[]>()
    const t = boDau(tim.trim())
    for (const s of kho ?? []) {
      const n = nhomCua(s)
      if (khoi && n.khoi && n.khoi !== khoi) continue
      if (t && !boDau(`${tenBai(s)} ${n.chuong}`).includes(t)) continue
      const k = `${n.khoi ? `Lớp ${n.khoi} · ` : ''}${n.chuong || 'Chưa xếp chương'}`
      m.set(k, [...(m.get(k) ?? []), s])
    }
    return [...m]
  }, [kho, khoi, tim])
  // Bài đã chọn của buổi không còn câu nào trong kho máy này ⇒ chưa chọn bài (không hiện «0 câu»).
  const baiHien = bai === DA_CHON && kho && !cauDaChon.length ? '' : bai
  const cauBai = useMemo(() => (baiHien === DA_CHON ? cauDaChon : kho && baiHien ? cauTuDeChon(kho, new Set([baiHien])) : []), [baiHien, kho, cauDaChon])
  const tenDangXem = baiHien === DA_CHON ? 'Câu đã chọn cho buổi này' : (kho?.find((s) => s.maDe === baiHien) ? tenBai(kho.find((s) => s.maDe === baiHien)!) : '')
  useEffect(() => { cot.current?.scrollTo?.({ top: 0 }) }, [bai])

  const chieu = async (i: number) => {
    if (dang) return
    const c = cauBai[i]
    if (!c) return
    setDang(c.khoa); setLoiChieu('')
    const chu = await onChieu(cauBai.slice(i))
    setDang(null)
    if (chu) setLoiChieu(chu)
  }

  return (
    <div className="bcc" role="dialog" aria-label="Chọn câu chiếu lên bảng">
      <div className="bcc-dau">
        <h2>Chọn câu chiếu</h2>
        <p>Bấm một câu: câu lên bảng, tự gửi xuống máy các em có mặt.</p>
        <button type="button" className="bcc-dong" onClick={onDong}><kbd>Esc</kbd>Đóng</button>
      </div>
      <div className="bcc-trai">
        <div className="bcc-loc">
          <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm bài, chương…" aria-label="Tìm bài" />
          <div className="bcc-khoi" role="group" aria-label="Khối">
            {['10', '11', '12', ''].map((k) => <button key={k || 'tat'} type="button" aria-pressed={khoi === k} onClick={() => setKhoi(k)}>{k ? `Lớp ${k}` : 'Tất cả'}</button>)}
          </div>
        </div>
        <div className="bcc-ds-bai">
          {!kho && !loi ? <p className="bcc-cho">Đang mở kho Dạy học…</p> : null}
          {loi ? <p className="bcc-cho">{loi} <button type="button" onClick={() => { setLoi(''); setLan((n) => n + 1) }}>Thử lại</button></p> : null}
          {cauDaChon.length ? (
            <button type="button" className="bcc-bai noi" aria-current={bai === DA_CHON || undefined} onClick={() => setBai(DA_CHON)}>
              <b>Câu đã chọn cho buổi này</b><span>{cauDaChon.length} câu · từ bảng Dạy học</span>
            </button>
          ) : null}
          {nhom.map(([ten, ds]) => (
            <section key={ten}>
              <h3>{ten}</h3>
              {ds.map((s) => <button key={s.maDe} type="button" className="bcc-bai" aria-current={bai === s.maDe || undefined} onClick={() => setBai(s.maDe)}>
                <b>{tenBai(s)}</b><span>{s.phanI.length + s.phanII.length + s.phanIII.length} câu · {loaiBai(s)}</span>
              </button>)}
            </section>
          ))}
          {kho && !nhom.length ? <p className="bcc-cho">Không có bài khớp «{tim}».</p> : null}
        </div>
      </div>
      <div className="bcc-phai" ref={cot}>
        {!baiHien ? <div className="bcc-trong"><b>Chọn một bài bên trái</b><span>Các câu của bài hiện ở đây.</span></div> : (
          <>
            <h3 className="bcc-ten-bai">{tenDangXem}<span>{cauBai.length} câu</span></h3>
            <div className="bcc-luoi">
              {cauBai.map((c, i) => (
                <button key={c.khoa} type="button" className="bcc-cau" data-dang={dang === c.khoa || undefined} disabled={!!dang} onClick={() => void chieu(i)}>
                  <span className="bcc-cau-dau"><i>Câu {i + 1}</i><em>{c.tuLuan ? 'Tự luận' : LOAI[c.phan]}</em>{c.mucDo ? <small>{MUC[c.mucDo] ?? c.mucDo}</small> : null}</span>
                  <span className="bcc-cau-chu">{tomTatDe(c, 220)}</span>
                  <span className="bcc-cau-chieu">{dang === c.khoa ? 'Đang dựng tờ chiếu…' : 'Chiếu câu này →'}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {loiChieu ? <p className="bcc-loi" role="alert">{loiChieu}</p> : null}
      </div>
    </div>
  )
}
