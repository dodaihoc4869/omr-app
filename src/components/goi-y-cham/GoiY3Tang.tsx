// «BẮT ĐẦU TỪ ĐÂU?» — GỢI Ý 3 TẦNG mở dần (bản vẽ docs/ban-ve-doc-de-2610 màn 4, 7, 8, 9; thầy chốt build 26/10).
// Bài tính (cách của thầy): ① Đề đang nói gì (bài khó: Hiện tượng – bản chất + thí nghiệm ảo) · ② Tóm tắt của thầy Đỗ Đại Học · ③ Một phép tính.
// Bài lý thuyết: ① Đề nói gì · ② Chìa khoá · ③ Tự hỏi để kiểm. Câu chưa có bản soạn: gợi ý tự sinh từ đề (Đề cho · Đề hỏi · Bước đầu).
// TRƯỚC khi nộp: không bao giờ vẽ kết quả số (ChuoiTinh luôn «= ?»). Điện thoại dọc: nằm giữa đề và phương án; ≥ 640px: CỘT PHẢI.
import { useEffect, useRef, type ReactNode } from 'react'
import { ChemText } from '../../lib/chem-format'
import type { BanSoDo } from '../../lib/goi-y-cham/kieu'
import { BieuTuong, type TenBieuTuong } from './bieu-tuong'
import { ChuoiTinh, QuyUoc, SoDoThay, ThiNghiemAo } from './so-do-thay'

export type TangGoiY = { icon: TenBieuTuong; mau: 'tin' | 'chu-y' | 'dung'; ten: string; phu?: string; than: ReactNode }
export type TrangThaiGoiY = 'tai' | 'co' | 'khong' | 'loi'

const doan = (s: string, k?: number) => <p key={k} className="gyc-t-noi"><ChemText text={s} /></p>

/** Bản soạn sẵn → 1–3 tầng (thứ tự cố định, tầng nào thiếu dữ liệu thì bỏ). */
export function tangTuBan(ban: BanSoDo): TangGoiY[] {
  const ra: TangGoiY[] = []
  const ht = ban.hienTuong
  ra.push(ht
    ? { icon: 'eye', mau: 'tin', ten: 'Hiện tượng – bản chất', phu: 'bài khó', than: <>{doan(ban.deNoiGi)}{ht.giaiThich.map((g, i) => doan(g, i))}{ht.thiNghiem && <ThiNghiemAo khung={ht.thiNghiem.khung} />}</> }
    : { icon: 'book', mau: 'tin', ten: 'Đề đang nói gì', than: doan(ban.deNoiGi) })
  if (ban.soDo) ra.push({ icon: 'route', mau: 'chu-y', ten: 'Tóm tắt của thầy Đỗ Đại Học', than: <><SoDoThay soDo={ban.soDo} /><QuyUoc soDo={ban.soDo} />{ban.chiaKhoa && doan(ban.chiaKhoa)}</> })
  else if (ban.chiaKhoa) ra.push({ icon: 'target', mau: 'chu-y', ten: 'Chìa khoá của bài', than: doan(ban.chiaKhoa) })
  if (ban.buoc.length) {
    const n = ban.buoc.length
    ra.push({
      icon: 'pen', mau: 'dung', ten: n > 1 ? `Tính ${n} bước` : 'Một phép tính', phu: 'chạm từng số để xem đến đó là gì',
      // `hienKetQua={false}`: gợi ý luôn ở TRƯỚC khi nộp — dù dữ liệu lỡ có `ketQua` cũng không vẽ.
      than: <>{n > 1 ? <div className="gyc-buoc-tinh">{ban.buoc.map((b, i) => <ChuoiTinh key={i} buoc={b} stt={i + 1} nhieu hienKetQua={false} />)}</div>
        : <ChuoiTinh buoc={ban.buoc[0]} stt={1} nhieu={false} hienKetQua={false} />}{ban.cauTuHoi && doan(ban.cauTuHoi)}</>,
    })
  } else if (ban.cauTuHoi) ra.push({ icon: 'ask', mau: 'dung', ten: 'Tự hỏi để kiểm', than: doan(ban.cauTuHoi) })
  return ra.slice(0, 3)
}

/** Gợi ý TỰ SINH khi câu chưa có bản soạn (hoặc mất mạng): chỉ dùng chữ của đề (vùng tô màu) + gợi ý cũ của câu nếu có. */
export function tangTuSinh(cho: string[], hoi: string[], chat: string[], cu?: { cotLoi?: string; gach?: string[] }): TangGoiY[] {
  const chips = (ds: string[], mau: string) => <div className="gyc-chips">{ds.map((s, i) => <span key={i} className={`gyc-chip ${mau}`}><ChemText text={s} /></span>)}</div>
  // Thầy 27/10 («Soát kĩ quá vô nghĩa»): chỉ giữ tầng có nội dung CỤ THỂ của câu này (số liệu, chất, đề hỏi có thẻ, cốt lõi thầy soạn);
  // bỏ lời khuyên chung («Đọc chậm từng câu…», «Tìm câu hỏi ở cuối đề…», «Đọc từng phương án và tự hỏi…»).
  const ra: TangGoiY[] = []
  if (cho.length || chat.length) ra.push({ icon: 'book', mau: 'tin', ten: 'Đề cho', than: <>{cho.length > 0 && chips(cho, 'gyc-tin')}{chat.length > 0 && chips(chat, 'gyc-dung')}</> })
  const cotLoi = cu?.cotLoi ? doan(cu.cotLoi) : cu?.gach?.length ? doan(`Có thể loại phương án ${cu.gach.join(', ')}.`) : null
  if (hoi.length || cotLoi) ra.push({ icon: 'target', mau: 'chu-y', ten: 'Đề hỏi', than: <>{hoi.length > 0 && chips(hoi, 'gyc-chu-y')}{cotLoi}</> })
  if (cho.length) ra.push({ icon: 'pen', mau: 'dung', ten: 'Bước đầu tiên', than: doan('Đổi các số liệu đề cho ra số mol, rồi tự làm tiếp.') })
  if (!ra.length) ra.push({ icon: 'info', mau: 'tin', ten: 'Chưa có gợi ý soạn sẵn', than: doan('Thầy chưa soạn gợi ý cho câu này. Em tự làm; làm xong sẽ có lời giải từng bước.') })
  return ra
}

export default function GoiY3Tang({ tangDs, trangThai, mo, onTiep, onXong, onThuLai, onDong, coPhepTinh, id }: {
  tangDs: TangGoiY[]
  trangThai: TrangThaiGoiY
  /** số tầng đang mở (1…tangDs.length) */
  mo: number
  onTiep: () => void
  onXong: () => void
  onThuLai: () => void
  /** đóng cột phải (≥ 640px) */
  onDong: () => void
  coPhepTinh: boolean
  id?: string
}) {
  const n = tangDs.length
  const dau = useRef<HTMLElement>(null)
  const moi = useRef<HTMLDivElement>(null)
  // tầng vừa mở: đưa vào tầm nhìn (cột phải cuộn riêng; dọc cuộn trang) — không giật khi máy bật giảm chuyển động
  useEffect(() => {
    if (mo > 1) moi.current?.scrollIntoView?.({ block: 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [mo])
  return (
    <section ref={dau} id={id} className="gyc-goi-y gyc-o-cot" aria-label="Gợi ý cho câu này">
      <div className="gyc-gy-dau">
        <h2 className="gyc-gy-tieu">Bắt đầu từ đâu?</h2>
        {trangThai !== 'tai' && <span className="gyc-gy-nac" role="img" aria-label={`Đã mở ${Math.min(mo, n)} trên ${n} gợi ý`}>{tangDs.map((_, i) => <i key={i} className={i < mo ? 'gyc-mo' : ''} />)}</span>}
        <button type="button" className="gyc-nut gyc-vuong gyc-gy-dong" aria-label="Đóng gợi ý" onClick={onDong}><BieuTuong ten="x" /></button>
      </div>
      {trangThai === 'loi' && <p className="gyc-gy-bao" role="status">Chưa tải được gợi ý soạn sẵn, em thử lại. Dưới đây là gợi ý từ chính đề bài.<button type="button" className="gyc-nut" onClick={onThuLai}>Thử lại</button></p>}
      {trangThai === 'tai' ? <div className="gyc-gy-tai" role="status">Đang tải gợi ý của thầy…</div> : <>
        {tangDs.map((t, i) => i < mo
          ? <div key={i} ref={i === mo - 1 ? moi : undefined} className="gyc-tang">
              <span className={`gyc-o-icon gyc-${t.mau}`}><BieuTuong ten={t.icon} /></span>
              <div><div className="gyc-t-ten">{t.ten} <small>· gợi ý {i + 1}{t.phu ? ` · ${t.phu}` : ''}</small></div>{t.than}</div>
            </div>
          : <div key={i} className="gyc-tang gyc-khoa" aria-label={`Gợi ý ${i + 1} còn khoá`}>
              <span className="gyc-o-icon gyc-xam"><BieuTuong ten="lock" /></span>
              <div><div className="gyc-t-ten">{t.ten} <small>· gợi ý {i + 1}</small></div></div>
            </div>)}
        <div className="gyc-gy-cuoi">
          {mo < n && <button type="button" className="gyc-nut" onClick={onTiep}>Gợi ý tiếp <span style={{ fontWeight: 500 }}>({mo + 1}/{n})</span></button>}
          <button type="button" className="gyc-nut gyc-chinh" onClick={onXong}>{mo >= n && coPhepTinh ? 'Em tự bấm máy tính' : 'Em tự làm tiếp'}</button>
        </div>
        <p className="gyc-gy-ghi">{trangThai === 'co' ? 'Mỗi gợi ý viết riêng cho câu này. ' : ''}Xem gợi ý thì lần này tính là có trợ giúp.</p>
      </>}
    </section>
  )
}
