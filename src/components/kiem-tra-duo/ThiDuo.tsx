// CA THI KIỂU DUOLINGO (thầy 27/10) — mảnh NẠP LƯỜI của ExamTakeScreen, chỉ khi <html data-trong="hs"> ở đường học sinh. CHỈ LÀ KHUNG TRÌNH BÀY:
// thẻ câu (TheCau, đủ mọi câu, câu không xem thì `hidden` — bộ đếm giây từng câu, gom đáp án lúc nộp, lá chắn `.thi-noi-dung` vẫn chạy y cũ), đồng
// hồ, lưu, nộp, chống rời màn, giữ để đọc, vân tay… đều do ExamTakeScreen dựng và truyền vào. Ở đây: thanh trên (thoát ⇒ hộp «không thoát được» cũ ·
// thanh tiến độ «đã làm» · đồng hồ · lưới câu), một câu một màn, đáy dính «Câu tiếp» / «Nộp bài», tấm lưới số câu, tấm xác nhận nộp có Bi.
// LUẬT THI: không hiện đúng/sai, không tấm xanh/đỏ, không đáp án — mảnh này không nhận đáp án nào. Âm thanh: màn thi bật cờ «đang kiểm tra» (batCheDoThi, am-thanh.ts) ⇒ chỉ rung.
// THI TẬP TRUNG (thầy 01/11: «… khi vào kiểm tra thì ẩn hết đi … 15 phút cuối, 5 phút cuối, 1 phút cuối thì hiện thời gian lên … báo một lần rồi lại ẩn
// đi … full màn hình»): ca CÓ GIỜ (`gio`) ⇒ thanh trên ẩn (vẫn trong DOM, chỉ trượt khỏi màn); tay nắm mảnh ở mép trên (chạm / vuốt xuống từ mép / Esc /
// Tab tới) ⇒ hiện MS_HIEN_TREN rồi tự ẩn; báo giờ một lần ở mốc 12 · 6 · 1 phút (thầy chốt lại 01/11; lib/thi-tap-trung.ts, nhớ theo lượt). Bài tập
// về nhà (không giờ) y cũ.
import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { phanHoi } from '../../lib/phan-hoi'
import { batCheDoThi } from '../../lib/am-thanh'
import type { KhoGio } from '../../lib/dong-ho-thi'
import { MS_HIEN_BAO, MS_HIEN_TREN, chuBaoGio, docSoBao, ghiSoBao, mocCanBao } from '../../lib/thi-tap-trung'
import { DayKt, NhanCauKt, TamLuoiKt, TamNopKt, ThanhTrenKt, useBangKt } from './KhungKiemTra'
// Giám thị + đèn pha (thầy 30/10, đặc tả docs/dac-ta-kiem-tra-duo-3010.md): nhập thẳng — khung này vốn là mảnh nạp lười; hình người v3 nằm ở mảnh dùng
// chung với màn làm chặng (giam-thi-*, kho chạy-lúc). Giám thị dựng SAU khung đầu của câu (không chặn lượt vẽ câu).
import GiamThiThi, { GiamThiNop } from './GiamThiThi'

type PhanThi = 'I' | 'II' | 'III'
const TEN_PHAN: Record<PhanThi, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const tenNhom = (ph: PhanThi) => `Phần ${ph} · ${TEN_PHAN[ph]}`

export interface ThiDuoProps {
  tenCa: string
  /** Đồng hồ đếm ngược (nút lá) hoặc chữ thay đồng hồ của bài tập («Hạn 30/10»). */
  dongHo: ReactNode
  nhanDongHo: string
  gap: boolean
  daLam: number
  tong: number
  luu: { nhan: string; tt: 'da' | 'dang' | 'loi' | 'mang' }
  /** Câu đang xem, 1..tong. */
  cauHien: number
  onDenCau: (so: number) => void
  /** Phần của từng câu (1..tong). */
  phan: PhanThi[]
  /** Biểu điểm của một phần (hiện ở đầu nhóm trong tấm lưới câu). */
  moTaPhan: (ph: PhanThi) => string
  moLuoi: boolean
  onMoLuoi: (mo: boolean) => void
  moNop: boolean
  onMoNop: (mo: boolean) => void
  chuaLam: number[]
  danhDau: number[]
  nhanNutNop: ReactNode
  camNopSom: boolean
  onNop: () => void
  onThoat: () => void
  /** Dải cảnh báo rời màn / báo thêm giờ (dính dưới thanh trên). */
  tren?: ReactNode
  /** Công cụ đọc (Dịu mắt) — đặt trong tấm lưới. */
  congCu?: ReactNode
  /** Có lớp phủ khác đang mở (hộp thoát, phóng ảnh, tấm che) ⇒ không nhận phím ← →. */
  tatPhim: boolean
  /** Kho giờ của ca (chỉ ĐỌC giây còn lại). Có ⇒ chế độ tập trung + báo giờ; null / vắng (bài tập về nhà) ⇒ thanh trên luôn hiện như cũ. */
  gio?: KhoGio | null
  /** Khoá lượt làm (mã ca + giờ vào) — nhớ mốc đã báo qua tải lại. */
  luot?: string
  children: ReactNode
}

/** Lời báo giờ (nút lá: nghe kho giờ, chỉ vẽ lại lúc báo / tắt báo). Hai vùng đọc màn hình luôn có sẵn: 12 · 6 phút «polite», 1 phút «assertive». */
function BaoGio({ gio, luot }: { gio: KhoGio; luot: string }) {
  const [moc, setMoc] = useState<number | null>(null)
  useEffect(() => {
    const so = docSoBao(luot, gio.conLaiNgay())
    let tat: ReturnType<typeof setTimeout> | undefined
    const xet = () => {
      const m = mocCanBao(gio.conLaiNgay(), so.vao, so.da)
      if (m === null) return
      so.da = [...so.da, m]
      ghiSoBao(luot, so)
      setMoc(m)
      clearTimeout(tat)
      tat = setTimeout(() => setMoc(null), MS_HIEN_BAO)
    }
    xet()
    const go = gio.dangKy(xet)
    return () => { go(); clearTimeout(tat) }
  }, [gio, luot])
  const vien = moc !== null && <span className="duo-kt-bao-vien" data-moc={moc}><Clock size={18} aria-hidden="true" /><b>{chuBaoGio(moc)}</b></span>
  return (
    <>
      <div className="duo-kt-bao-gio" aria-live="polite" aria-atomic="true">{moc !== 60 && vien}</div>
      <div className="duo-kt-bao-gio" aria-live="assertive" aria-atomic="true">{moc === 60 && vien}</div>
    </>
  )
}

/** Thanh trên của chế độ tập trung: ẩn sẵn; `hien()` ⇒ hiện rồi tự ẩn sau MS_HIEN_TREN; `hien(true)` ⇒ GIỮ (đang Tab trong thanh) tới khi `tha()`. */
function useThanhAn(bat: boolean) {
  const [hienTren, setHienTren] = useState(false)
  const r = useRef<{ hen?: ReturnType<typeof setTimeout>; giu: boolean }>({ giu: false }).current
  const [ham] = useState(() => ({
    hien(giu?: boolean) {
      clearTimeout(r.hen)
      r.giu = !!giu
      setHienTren(true)
      if (!giu) r.hen = setTimeout(() => setHienTren(false), MS_HIEN_TREN)
    },
    an() { clearTimeout(r.hen); r.giu = false; setHienTren(false) },
    /** Tiêu điểm phím rời thanh đang giữ ⇒ đếm 5 giây rồi ẩn. */
    tha() { if (r.giu) ham.hien() },
  }))
  useEffect(() => () => clearTimeout(r.hen), [r])
  return { hienTren: bat && hienTren, ...ham }
}
const trongThanh = (el: EventTarget | null) => el instanceof Element && !!el.closest('.duo-kt-tren')
const laTieuDiemPhim = (el: EventTarget | null) => {
  try { return el instanceof Element && el.matches(':focus-visible') } catch { return false }
}

export default function ThiDuo(p: ThiDuoProps) {
  const goc = useRef<HTMLDivElement>(null)
  useBangKt(goc) // bảng trong đề: hai hàng quá rộng ⇒ xoay dọc; bảng lớn ⇒ cuộn có bóng mép (thầy 27/10)
  // Màn thi đang mở ⇒ TẮT ÂM THANH, chỉ rung (gỡ khi khung đóng: nộp xong, rời màn).
  useEffect(() => batCheDoThi(), [])
  const chuaSet = new Set(p.chuaLam), dauSet = new Set(p.danhDau)
  const oCau = p.phan.map((ph, i) => ({ so: i + 1, daLam: !chuaSet.has(i + 1), danhDau: dauSet.has(i + 1), nhom: tenNhom(ph) }))
  // Mở khung (vào đề / vào lại lượt dở) ⇒ tới câu chưa làm đầu tiên; làm hết rồi ⇒ câu 1.
  useEffect(() => { p.onDenCau(p.chuaLam[0] ?? 1) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Một câu một màn: thẻ cả bài vẫn dựng (giữ id `cau-N` cho bộ đếm giây từng câu, gom đáp án lúc nộp, DỰNG ĐỀ DẦN thêm thẻ) — mỗi lượt vẽ chỉ để
  // hiện khung thẻ câu đang xem, các khung khác `hidden` (không chiếm chỗ, bộ quan sát thấy 0 ⇒ không đếm giây).
  useLayoutEffect(() => {
    for (const el of Array.from(goc.current?.querySelectorAll<HTMLElement>('.duo-kt-than [id^="cau-"]') ?? [])) {
      const khung = (el.closest('.thi-cau-boc') as HTMLElement | null) ?? el
      const hien = el.id === `cau-${p.cauHien}`
      khung.hidden = !hien
      // 30/10 (xoay ngang / máy tính: đề trái · phần trả lời phải): đánh dấu khối TRẢ LỜI của câu đang xem — CSS mục 5 đặt nó sang cột phải. Chỉ thuộc tính trình bày.
      if (hien) el.querySelector('.pa-hang, .y-hang, .bns, input')?.closest('.the-cau > div:last-child > *')?.setAttribute('data-kt-tra', '')
    }
  })
  // Đổi câu ⇒ về đầu câu (khung cuộn là lớp phủ của cổng học sinh hoặc cả trang).
  useEffect(() => { goc.current?.scrollIntoView?.({ block: 'start' }) }, [p.cauHien])
  const di = (so: number) => p.onDenCau(Math.max(1, Math.min(p.tong, so)))
  // Chế độ tập trung: chỉ ca có giờ. <html data-thi-tap-trung> ⇒ CSS cất nút «Đóng phòng thi» nổi của cổng học sinh (đè đúng góc thanh trên / cờ
  // «Xem lại sau»; đường thoát của khung là nút X trên thanh — hộp «không thoát được» như cũ).
  const tapTrung = !!p.gio
  const { hienTren, hien, an, tha } = useThanhAn(tapTrung)
  const tay = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    if (!tapTrung) return
    const g = document.documentElement
    g.setAttribute('data-thi-tap-trung', '')
    return () => g.removeAttribute('data-thi-tap-trung')
  }, [tapTrung])
  // Vuốt xuống từ mép trên (một ngón, bắt đầu trong dải tay nắm) ⇒ hiện thanh. Chỉ đo vị trí tay nắm khi chạm gần mép (không ép bố cục mỗi lần chạm).
  useEffect(() => {
    if (!tapTrung) return
    let y0: number | null = null
    const bd = (e: TouchEvent) => {
      const t = e.touches.length === 1 ? e.touches[0] : undefined
      y0 = t && t.clientY < 120 && t.clientY <= (tay.current?.getBoundingClientRect().bottom ?? 44) + 8 ? t.clientY : null
    }
    const di = (e: TouchEvent) => {
      const t = e.touches[0]
      if (y0 !== null && t && t.clientY - y0 > 24) { y0 = null; hien() }
    }
    window.addEventListener('touchstart', bd, { passive: true })
    window.addEventListener('touchmove', di, { passive: true })
    return () => { window.removeEventListener('touchstart', bd); window.removeEventListener('touchmove', di) }
  }, [tapTrung, hien])
  // Máy tính: ← → đổi câu (không khi đang gõ ô nhập, đang mở tấm/hộp). Esc (chế độ tập trung) ⇒ hiện thanh trên.
  const phim = useRef<(e: KeyboardEvent) => void>(() => {})
  phim.current = (e) => {
    if (p.tatPhim || p.moLuoi || p.moNop || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
    if (e.key === 'Escape' && tapTrung) { hien(); return }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const t = e.target instanceof HTMLElement ? e.target : null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('[role=dialog]'))) return
    e.preventDefault()
    phanHoi('chon')
    di(p.cauHien + (e.key === 'ArrowRight' ? 1 : -1))
  }
  useEffect(() => {
    const f = (e: KeyboardEvent) => phim.current(e)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
  // Chạm phương án / ý Đúng–Sai / nút ⇒ rung nhẹ (CHỈ rung — cờ «đang kiểm tra» (batCheDoThi, am-thanh.ts) chặn tiếng). Nghe ở pha bắt: không đụng hàm chọn đáp án của thẻ câu.
  const rungKhiBam = (e: MouseEvent) => {
    const el = e.target instanceof Element ? e.target.closest('button, [role=radio]') : null
    if (el && !(el as HTMLButtonElement).disabled) phanHoi('chon')
  }
  const cuoi = p.cauHien >= p.tong
  const ghiNop = p.camNopSom ? 'Chỉ nộp bài trong 1 phút cuối' : undefined
  // Chạm trong thanh đang hiện ⇒ đếm lại 5 giây; chạm ngoài thanh (làm câu tiếp) ⇒ cất ngay. Tab tới nút trên thanh ⇒ hiện, giữ tới khi rời thanh.
  const chamGoc = tapTrung ? (e: MouseEvent) => { if (trongThanh(e.target)) hien(); else if (hienTren && e.target !== tay.current) an() } : undefined
  const vaoThanh = tapTrung ? (e: FocusEvent) => { if (trongThanh(e.target) && laTieuDiemPhim(e.target)) hien(true) } : undefined
  const roiThanh = tapTrung ? (e: FocusEvent) => { if (!trongThanh(e.relatedTarget)) tha() } : undefined
  return (
    <div ref={goc} className="duo-kt duo-kt-thi" onClickCapture={rungKhiBam} data-tap-trung={tapTrung || undefined} data-tren-hien={hienTren || undefined}
      onPointerDownCapture={chamGoc} onFocus={vaoThanh} onBlur={roiThanh}>
      <ThanhTrenKt onDong={p.onThoat} nhanDong="Thoát bài làm" daLam={p.daLam} tong={p.tong} gio={p.dongHo} nhanGio={p.nhanDongHo} gap={p.gap}
        onMoLuoi={() => p.onMoLuoi(true)} luu={p.luu} />
      {tapTrung && (
        <button ref={tay} type="button" className="duo-kt-tay" onClick={() => hien()} aria-expanded={hienTren}
          aria-label="Hiện thanh trên: thời gian còn lại, danh sách câu, thoát"><i aria-hidden="true" /></button>
      )}
      {p.gio && p.luot && <BaoGio gio={p.gio} luot={p.luot} />}
      {p.tren}
      <main className="duo-kt-than thi-noi-dung">
        <NhanCauKt so={p.cauHien} tong={p.tong} phu={tenNhom(p.phan[p.cauHien - 1] ?? 'I')} />
        <GiamThiThi phan={p.phan[p.cauHien - 1] ?? 'I'} cauHien={p.cauHien} gap={p.gap} goc={goc} />
        {p.children}
      </main>
      <DayKt coTruoc={p.cauHien > 1} onTruoc={() => di(p.cauHien - 1)} ghi={cuoi ? ghiNop : undefined}>
        {cuoi
          ? <button type="button" className="duo-nut" disabled={p.camNopSom} onClick={() => { if (!p.camNopSom) p.onMoNop(true) }}>{p.nhanNutNop}</button>
          : <button type="button" className="duo-nut" onClick={() => di(p.cauHien + 1)}>Câu tiếp</button>}
      </DayKt>
      {p.moLuoi && (
        <TamLuoiKt cau={oCau} hien={p.cauHien} onChon={(so) => { p.onMoLuoi(false); di(so) }} onDong={() => p.onMoLuoi(false)}
          tieuDe={`Đã làm ${p.daLam}/${p.tong} câu`} phu={p.tenCa || undefined} them={p.congCu} nhomGhi={Object.fromEntries((['I', 'II', 'III'] as const).map((ph) => [tenNhom(ph), p.moTaPhan(ph)]))}
          nutNop={<>
            {ghiNop && <p className="duo-kt-ghi">{ghiNop}</p>}
            <button type="button" className="duo-nut" disabled={p.camNopSom} onClick={() => { if (p.camNopSom) return; p.onMoLuoi(false); p.onMoNop(true) }}>{p.nhanNutNop}</button>
          </>} />
      )}
      {p.moNop && (
        <TamNopKt tieuDe="Nộp bài?" daLam={p.daLam} tong={p.tong} chuaLam={p.chuaLam} danhDau={p.danhDau}
          onToiCau={(so) => { p.onMoNop(false); di(so) }}
          onLamTiep={() => { p.onMoNop(false); if (p.chuaLam.length) di(p.chuaLam[0]!); else if (p.danhDau.length) di(p.danhDau[0]!) }} nhanLamTiep="Xem lại"
          onNop={() => { if (p.camNopSom) return; p.onMoNop(false); p.onNop() }} nhanNop={p.nhanNutNop} khoaNop={p.camNopSom} canh={ghiNop}
          hauQua="Sau khi nộp không sửa được nữa." hinh={<GiamThiNop />} />
      )}
    </div>
  )
}
