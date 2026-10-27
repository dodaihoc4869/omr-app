// KHUNG MÀN KIỂM TRA KIỂU DUOLINGO (thầy 27/10: «Màn làm bài kiểm tra của hs đổi sang dolingo thiết kế siêu đẹp»). Dùng chung cho ca thi (ThiDuo.tsx,
// nạp lười từ ExamTakeScreen) và Kiểm tra ôn tập (ManKiemTraCaNhan). CHỈ TRÌNH BÀY: thanh trên (đóng · thanh tiến độ «đã làm» · đồng hồ đếm ngược ·
// lưới câu), thanh đáy dính (câu trước · nút lớn), tấm lưới số câu trượt từ đáy, tấm xác nhận nộp có Bi. Mọi việc (lưu, chấm, nộp, đồng hồ, chống rời
// màn) nằm ở màn cha — ở đây chỉ gọi lại hàm cha đưa. LUẬT THI: không có khái niệm đúng/sai — ô số câu chỉ «đã làm / chưa làm / đang xem / xem lại sau».
// Chỉ dùng khi <html data-trong="hs">; tờ kiểu styles/trong-kiem-tra.css đi cùng mảnh này (không vào nhóm mở app).
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { ChevronLeft, Clock, Flag, LayoutGrid, X as XIcon } from 'lucide-react'
import { Bi, type CamBi } from '../linh-vat/Bi'
import '../../styles/trong-kiem-tra.css'

/** Giao diện kiểm tra kiểu Duolingo bật không (gọi lúc vẽ; `ddh.trong` = 'tat' ⇒ không có thuộc tính ⇒ giao diện cũ). */
export function laKiemTraDuo(): boolean {
  try { return typeof document !== 'undefined' && document.documentElement.dataset.trong === 'hs' } catch { return false }
}

/** Esc đóng tấm (máy tính). */
function useEscDong(mo: boolean, dong: () => void) {
  const ref = useRef(dong)
  ref.current = dong
  useEffect(() => {
    if (!mo) return
    const nghe = (e: KeyboardEvent) => { if (e.key === 'Escape') ref.current() }
    window.addEventListener('keydown', nghe)
    return () => window.removeEventListener('keydown', nghe)
  }, [mo])
}

/** Ô đồng hồ đếm ngược của thanh trên (nút lá: chỉ ô này vẽ lại mỗi giây). `gap` ⇒ nền cảnh báo. */
export function OGioKt({ nhan, gap, children }: { nhan: string; gap?: boolean; children: ReactNode }) {
  return <span className="duo-kt-gio" data-gap={gap || undefined} role="timer" aria-label={nhan}><Clock size={18} aria-hidden="true" /><b>{children}</b></span>
}

export function ThanhTrenKt({ onDong, nhanDong, khoaDong, daLam, tong, gio, nhanGio, gap, onMoLuoi, luu }: {
  onDong: () => void; nhanDong: string; khoaDong?: boolean
  daLam: number; tong: number
  /** Đồng hồ (nút lá tự đếm) hoặc chữ thay đồng hồ (bài tập: «Hạn 30/10»); null ⇒ không hiện. `nhanGio` rỗng ⇒ `gio` là cả ô (OGioKt tự lo màu gấp). */
  gio: ReactNode; nhanGio: string; gap?: boolean
  onMoLuoi: () => void
  /** Chấm trạng thái lưu (màu + nhãn cho trình đọc màn hình). */
  luu?: { nhan: string; tt: 'da' | 'dang' | 'loi' | 'mang' }
}) {
  const pct = tong ? Math.min(100, Math.round((100 * daLam) / tong)) : 0
  return (
    <header className="duo-tren duo-kt-tren">
      <button type="button" className="duo-dong" onClick={onDong} disabled={khoaDong} aria-label={nhanDong}><XIcon size={26} aria-hidden="true" /></button>
      <div className="duo-thanh duo-kt-thanh" role="progressbar" aria-label={`Đã làm ${daLam} trên ${tong} câu`} aria-valuemin={0} aria-valuemax={tong || 1} aria-valuenow={daLam}>
        <i style={{ width: `${pct}%` }} />
      </div>
      {gio !== null && (nhanGio ? <OGioKt nhan={nhanGio} gap={gap}>{gio}</OGioKt> : gio)}
      <button type="button" className="duo-kt-nut-luoi" onClick={onMoLuoi} aria-label={`Danh sách câu · đã làm ${daLam}/${tong}`}>
        <LayoutGrid size={20} aria-hidden="true" />
        {luu && <i className="duo-kt-luu" data-tt={luu.tt} role="img" aria-label={luu.nhan} title={luu.nhan} />}
      </button>
    </header>
  )
}

/** Nhãn đầu câu: «CÂU 3/28 · PHẦN I · TRẮC NGHIỆM» + chỗ cho nút phụ (Xem lại sau). */
export function NhanCauKt({ so, tong, phu, children }: { so: number; tong: number; phu?: string; children?: ReactNode }) {
  return (
    <div className="duo-kt-nhan">
      <p><span>Câu {so}/{tong}</span>{phu && <span className="duo-kt-nhan-phu">{phu}</span>}</p>
      {children}
    </div>
  )
}

/** Thanh đáy dính: nút «câu trước» vuông + MỘT nút lớn (Câu tiếp / Nộp bài). `ghi`: dòng nhắc nhỏ dưới nút (đã lưu, chỉ nộp phút cuối…). */
export function DayKt({ coTruoc, onTruoc, children, ghi, lop }: { coTruoc: boolean; onTruoc: () => void; children: ReactNode; ghi?: ReactNode; lop?: string }) {
  return (
    <div className={`duo-day duo-kt-day${lop ? ` ${lop}` : ''}`}>
      <div className="duo-giua">
        <div className="duo-kt-hang">
          <button type="button" className="duo-kt-truoc" onClick={onTruoc} disabled={!coTruoc} aria-label="Câu trước"><ChevronLeft size={28} aria-hidden="true" /></button>
          {children}
        </div>
        {ghi && <p className="duo-kt-ghi" role="status">{ghi}</p>}
      </div>
    </div>
  )
}

export interface OCauKt { so: number; daLam: boolean; danhDau?: boolean; nhom?: string }

/** Tấm lưới số câu (trượt từ đáy). Ô: đã làm (đặc), chưa làm (viền), đang xem (vòng ngoài), cờ «Xem lại sau». */
export function TamLuoiKt({ cau, hien, onChon, onDong, tieuDe, phu, them, nutNop, nhomGhi }: {
  cau: OCauKt[]; hien: number; onChon: (so: number) => void; onDong: () => void
  tieuDe: string; phu?: ReactNode; them?: ReactNode; nutNop?: ReactNode
  /** Dòng ghi dưới tên nhóm (biểu điểm từng phần của ca thi). */
  nhomGhi?: Record<string, string>
}) {
  useEscDong(true, onDong)
  const nhom: { ten: string; ds: OCauKt[] }[] = []
  for (const c of cau) {
    const ten = c.nhom ?? ''
    const cuoi = nhom[nhom.length - 1]
    if (cuoi && cuoi.ten === ten) cuoi.ds.push(c)
    else nhom.push({ ten, ds: [c] })
  }
  const coDau = cau.some((c) => c.danhDau)
  return (
    <div className="duo-kt-phu" onClick={onDong}>
      <section className="duo-kt-tam" role="dialog" aria-modal="true" aria-label="Danh sách câu" onClick={(e) => e.stopPropagation()}>
        <header className="duo-kt-tam-dau">
          <div><b>{tieuDe}</b>{phu && <small>{phu}</small>}</div>
          <button type="button" className="duo-dong" onClick={onDong} aria-label="Đóng danh sách câu"><XIcon size={24} aria-hidden="true" /></button>
        </header>
        <div className="duo-kt-chu-giai" aria-hidden="true">
          <span><i data-da="" />Đã làm</span><span><i />Chưa làm</span>{coDau && <span><Flag size={13} fill="currentColor" />Xem lại sau</span>}
        </div>
        <div className="duo-kt-tam-than">
          {nhom.map((n) => (
            <div key={n.ten || 'tat-ca'} className="duo-kt-nhom">
              {n.ten && <p className="duo-kt-nhom-ten">{n.ten}</p>}
              {n.ten && nhomGhi?.[n.ten] && <p className="duo-kt-nhom-ghi">{nhomGhi[n.ten]}</p>}
              <div className="duo-kt-luoi">
                {n.ds.map((c) => (
                  <button key={c.so} type="button" className="duo-kt-o" data-da={c.daLam || undefined} aria-current={c.so === hien || undefined}
                    aria-label={`Câu ${c.so}${c.daLam ? ' · đã làm' : ' · chưa làm'}${c.danhDau ? ' · xem lại sau' : ''}`} onClick={() => onChon(c.so)}>
                    {c.so}
                    {c.danhDau && <span className="duo-kt-o-co" aria-hidden="true"><Flag size={10} fill="currentColor" /></span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {them && <div className="duo-kt-tam-them">{them}</div>}
        {nutNop && <div className="duo-kt-tam-nop">{nutNop}</div>}
      </section>
    </div>
  )
}

/** Tấm xác nhận nộp có Bi: số câu đã làm, câu chưa làm (bấm để tới), câu đánh dấu xem lại, hậu quả, nút mang tên việc. */
export function TamNopKt({ tieuDe, daLam, tong, chuaLam, danhDau = [], onToiCau, onLamTiep, nhanLamTiep, onNop, nhanNop, khoaNop, canh, hauQua }: {
  tieuDe: string; daLam: number; tong: number; chuaLam: number[]; danhDau?: number[]
  onToiCau: (so: number) => void; onLamTiep: () => void; nhanLamTiep: string
  onNop: () => void; nhanNop: ReactNode; khoaNop?: boolean; canh?: ReactNode; hauQua: string
}) {
  useEscDong(true, onLamTiep)
  const cam: CamBi = chuaLam.length ? 'nghi' : 'vui'
  const dsSo = (ds: number[], nhan: string) => (
    <div className="duo-kt-nop-ds" role="group" aria-label={nhan}>
      {ds.slice(0, 40).map((so) => <button key={so} type="button" onClick={() => onToiCau(so)}>Câu {so}</button>)}
    </div>
  )
  return (
    <div className="duo-kt-phu" data-giua="">
      <section className="duo-kt-tam duo-kt-nop" role="dialog" aria-modal="true" aria-labelledby="duo-kt-nop-tieu">
        <div className="duo-kt-nop-bi"><Bi cam={cam} size={104} /></div>
        <h2 id="duo-kt-nop-tieu">{tieuDe}</h2>
        <p className="duo-kt-nop-so"><b>{daLam}/{tong}</b> câu đã làm</p>
        <div className="duo-kt-nop-noi">
          {chuaLam.length > 0 && <div className="duo-kt-nop-khoi" data-loai="chua"><p>Còn <b>{chuaLam.length} câu chưa làm</b>. Bấm số câu để làm tiếp:</p>{dsSo(chuaLam, 'Câu chưa làm')}</div>}
          {danhDau.length > 0 && <div className="duo-kt-nop-khoi" data-loai="dau"><p><Flag size={14} fill="currentColor" aria-hidden="true" /> Em đánh dấu xem lại <b>{danhDau.length} câu</b>:</p>{dsSo(danhDau, 'Câu đánh dấu xem lại')}</div>}
          <p className="duo-kt-nop-ghi">{hauQua}</p>
          {canh && <p className="duo-kt-nop-canh" role="status">{canh}</p>}
        </div>
        <div className="duo-kt-nop-nut">
          <button type="button" className="duo-nut" onClick={onNop} disabled={khoaNop}>{nhanNop}</button>
          <button type="button" className="duo-kt-nut-phu" onClick={onLamTiep}>{nhanLamTiep}</button>
        </div>
      </section>
    </div>
  )
}

/** Bi + lời ngắn đầu màn kết quả (Kiểm tra ôn tập, ca thi). */
export function BiKetQua({ cam, tieuDe, phu, lop }: { cam: CamBi; tieuDe: string; phu?: ReactNode; lop?: string }) {
  return (
    <div className={lop ? `duo-kt-ket-bi ${lop}` : 'duo-kt-ket-bi'}>
      <Bi cam={cam} size={96} />
      <div><b>{tieuDe}</b>{phu && <small>{phu}</small>}</div>
    </div>
  )
}

/** Cảm xúc Bi theo điểm /10 (chưa có điểm ⇒ vui). Không bao giờ «sai» ở màn kết quả. */
export function camTheoDiem(diem: number | null | undefined): CamBi {
  if (typeof diem !== 'number' || !Number.isFinite(diem)) return 'vui'
  return diem >= 8 ? 'mung' : diem >= 5 ? 'vui' : 'nghi'
}

/** BẢNG TRONG ĐỀ Ở MÀN THI / KIỂM TRA kiểu Duo (thầy 27/10: «Thi là chỗ quan trọng nhất»). Thẻ câu của màn thi do ExamTakeScreen dựng (BangSoLieu dùng
 *  chung, nằm trong lượt mở app) ⇒ KHÔNG sửa thẻ: khung (mảnh nạp lười) chỉ ĐO và gắn thuộc tính trình bày lên bảng sẵn có — không đổi chữ, thứ tự, logic thi:
 *  - bảng HAI hàng rộng hơn khung ⇒ `table[data-doc]` + `--n` (CSS trong-kiem-tra.css xếp lại thành lưới dọc: mỗi cột cũ thành một hàng); đủ chỗ ⇒ gỡ;
 *  - bảng lớn ⇒ `.cau-bang[data-mep]` = trai | phai | hai (bóng mờ ở mép còn nội dung khi cuộn ngang).
 *  Bảng của màn luyện (LamCau.BangDe, `.bang-de`) đã tự lo ⇒ bỏ qua. */
export function useBangKt(goc: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const g = goc.current
    if (!g) return
    const rong = new WeakMap<HTMLElement, number>()
    const do_ = (k: HTMLElement) => {
      const t = k.querySelector('table')
      if (!t || k.closest('.bang-de') || !k.offsetParent) return
      const hang = t.rows, hai = hang.length === 2 && hang[0]!.cells.length > 2
      if (t.hasAttribute('data-doc')) { if (k.clientWidth >= (rong.get(k) ?? Infinity)) t.removeAttribute('data-doc'); else return }
      const w = k.scrollWidth, c = k.clientWidth, l = k.scrollLeft
      if (w > c + 1 && hai) { rong.set(k, w); t.style.setProperty('--n', String(hang[0]!.cells.length)); t.setAttribute('data-doc', ''); k.removeAttribute('data-mep'); return }
      const trai = l > 1, phai = l + c < w - 1
      if (trai || phai) k.setAttribute('data-mep', trai && phai ? 'hai' : trai ? 'trai' : 'phai'); else k.removeAttribute('data-mep')
    }
    const tatCa = () => g.querySelectorAll<HTMLElement>('.cau-bang').forEach(do_)
    const cuon = (e: Event) => { const k = (e.target as HTMLElement).closest?.('.cau-bang'); if (k) do_(k as HTMLElement) }
    tatCa()
    g.addEventListener('scroll', cuon, true)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(tatCa) : null
    ro?.observe(g)
    // câu mới hiện (khung câu bỏ `hidden`) / đề dựng dần ⇒ đo lại
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(tatCa) : null
    mo?.observe(g, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] })
    return () => { g.removeEventListener('scroll', cuon, true); ro?.disconnect(); mo?.disconnect() }
  }, [goc])
}
