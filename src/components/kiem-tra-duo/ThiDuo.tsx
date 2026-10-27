// CA THI KIỂU DUOLINGO (thầy 27/10) — mảnh NẠP LƯỜI của ExamTakeScreen, chỉ khi <html data-trong="hs"> ở đường học sinh. CHỈ LÀ KHUNG TRÌNH BÀY:
// thẻ câu (TheCau, đủ mọi câu, câu không xem thì `hidden` — bộ đếm giây từng câu, gom đáp án lúc nộp, lá chắn `.thi-noi-dung` vẫn chạy y cũ), đồng
// hồ, lưu, nộp, chống rời màn, giữ để đọc, vân tay… đều do ExamTakeScreen dựng và truyền vào. Ở đây: thanh trên (thoát ⇒ hộp «không thoát được» cũ ·
// thanh tiến độ «đã làm» · đồng hồ · lưới câu), một câu một màn, đáy dính «Câu tiếp» / «Nộp bài», tấm lưới số câu, tấm xác nhận nộp có Bi.
// LUẬT THI: không hiện đúng/sai, không tấm xanh/đỏ, không đáp án — mảnh này không nhận đáp án nào. Âm thanh: màn thi bật cờ che-do-thi ⇒ chỉ rung.
import { useEffect, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { phanHoi } from '../../lib/phan-hoi'
import { batCheDoThi } from '../../lib/che-do-thi'
import { DayKt, NhanCauKt, TamLuoiKt, TamNopKt, ThanhTrenKt } from './KhungKiemTra'

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
  children: ReactNode
}

export default function ThiDuo(p: ThiDuoProps) {
  const goc = useRef<HTMLDivElement>(null)
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
      khung.hidden = el.id !== `cau-${p.cauHien}`
    }
  })
  // Đổi câu ⇒ về đầu câu (khung cuộn là lớp phủ của cổng học sinh hoặc cả trang).
  useEffect(() => { goc.current?.scrollIntoView?.({ block: 'start' }) }, [p.cauHien])
  const di = (so: number) => p.onDenCau(Math.max(1, Math.min(p.tong, so)))
  // Máy tính: ← → đổi câu (không khi đang gõ ô nhập, đang mở tấm/hộp).
  const phim = useRef<(e: KeyboardEvent) => void>(() => {})
  phim.current = (e) => {
    if (p.tatPhim || p.moLuoi || p.moNop || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
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
  // Chạm phương án / ý Đúng–Sai / nút ⇒ rung nhẹ (CHỈ rung — cờ che-do-thi chặn tiếng). Nghe ở pha bắt: không đụng hàm chọn đáp án của thẻ câu.
  const rungKhiBam = (e: MouseEvent) => {
    const el = e.target instanceof Element ? e.target.closest('button, [role=radio]') : null
    if (el && !(el as HTMLButtonElement).disabled) phanHoi('chon')
  }
  const cuoi = p.cauHien >= p.tong
  const ghiNop = p.camNopSom ? 'Chỉ nộp bài trong 1 phút cuối' : undefined
  return (
    <div ref={goc} className="duo-kt duo-kt-thi" onClickCapture={rungKhiBam}>
      <ThanhTrenKt onDong={p.onThoat} nhanDong="Thoát bài làm" daLam={p.daLam} tong={p.tong} gio={p.dongHo} nhanGio={p.nhanDongHo} gap={p.gap}
        onMoLuoi={() => p.onMoLuoi(true)} luu={p.luu} />
      {p.tren}
      <main className="duo-kt-than thi-noi-dung">
        <NhanCauKt so={p.cauHien} tong={p.tong} phu={tenNhom(p.phan[p.cauHien - 1] ?? 'I')} />
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
          hauQua="Sau khi nộp không sửa được nữa." />
      )}
    </div>
  )
}
