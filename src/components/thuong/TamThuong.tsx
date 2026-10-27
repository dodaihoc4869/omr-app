// KHỐI THƯỞNG TRONG MÀN LÀM CHẶNG (bản vẽ tp-1, tp-2; HIEU-UNG A6 · A7 · A8 · H3) — phần HIỆN NGAY, nhỏ, không gọi mạng:
//  - TamThuong: đặt trong tấm kết quả câu. Đọc trường `thuong` của phản hồi `answer` (hợp đồng 4.1). tinh = true ⇒ «+12 ⚛ nguyên tử» + các dòng máy chủ gửi
//    (Đúng +10 · Câu khó +5 · Chuỗi đúng 3 +2) + «+12 ⚛» bay lên rồi tan. tinh = false ⇒ MỘT câu trung tính «Câu này chưa được tính — đọc kĩ rồi làm nhé»
//    (không nhãn nào khác, không lộ đúng / sai). Thiếu `thuong` ⇒ không vẽ gì.
//  - BangCombo: băng «phân tử» — mỗi câu đúng liền mọc thêm một nguyên tử (≥ 3: «Chuỗi đúng N · +2 mỗi câu»; ≥ 5: «Phản ứng dây chuyền! · +5 mỗi câu»).
//    `tat` (câu không được tính sau một chuỗi) ⇒ phân tử rã từng nguyên tử rồi rơi, băng xám «Chuỗi đúng: 0».
//  - OngNghiem: thanh tiến độ là ống nghiệm, chất lỏng dâng; combo ≥ 3 ⇒ cam phát sáng + vệt sáng lướt.
import { useEffect, useRef, type CSSProperties } from 'react'
import type { ThuongCau } from '../../lib/thuong-api'
import { coChuyenDong, hoatAnh, bungHat, demSo, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { IcNguyenTu, PhanTu } from './hinh'
import '../../styles/trong-thuong-gon.css'

export const CHU_KHONG_TINH = 'Câu này chưa được tính — đọc kĩ rồi làm nhé'
const loaiDong = (nhan: string) => (/khó/i.test(nhan) ? 'kho' : /chuỗi|dây chuyền/i.test(nhan) ? 'chuoi' : undefined)

/** `demLen` (màn làm chặng Duo, làm lại 27/10): KHÔNG có «+N» bay nổi giữa nội dung (viên thưởng chỉ bật cạnh bộ đếm góc phải trên); số «+N nguyên tử»
 *  đếm từ 0 lên trong 400 ms (giảm chuyển động ⇒ số cuối). */
export function TamThuong({ thuong, demLen }: { thuong: ThuongCau | null | undefined; demLen?: boolean }) {
  const bay = useRef<HTMLSpanElement>(null), so = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (demLen && thuong?.tinh && thuong.nguyenTu > 0) void demSo(so.current, 0, thuong.nguyenTu, 400, (v) => `+${v}`)
    else if (thuong?.tinh && thuong.nguyenTu > 0) hoatAnh(bay.current, [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'translateY(-14px)', opacity: 1, offset: 0.3 }, { transform: 'translateY(-60px)', opacity: 0 }], 700, { tre: 260, e: 'ease-out' })
    else if (thuong && !thuong.tinh) phanHoiThuong('khongTinh')
  }, [thuong])
  if (!thuong) return null
  if (!thuong.tinh) return <div className="tp-kq" data-trung="">
    <p className="tp-kq-trung">{CHU_KHONG_TINH}</p>
    {/* thầy 27/10 (bản vẽ nâng cấp): bỏ dòng «Nguyên tử 0 · Chuỗi đúng về 0» — câu chưa tính đã nói đủ, thêm hai số 0 chỉ làm rối */}
  </div>
  const n = thuong.nguyenTu
  return <div className="tp-kq">
    {!demLen && <span ref={bay} className="tp-bay-so" aria-hidden="true">+{n} <IcNguyenTu /></span>}
    <div className="tp-cong">
      <span className="tong" aria-label={`+${n} nguyên tử`}><span ref={so} aria-hidden="true">+{demLen && coChuyenDong() ? 0 : n}</span> <IcNguyenTu /> <span aria-hidden="true">nguyên tử</span></span>
      {thuong.dong.map((d, i) => <span key={i} className="tp-ct" data-k={loaiDong(d.nhan)}>{d.nhan} <b>{d.so > 0 ? '+' : ''}{d.so}</b></span>)}
    </div>
  </div>
}

/** Thưởng chuỗi mỗi câu theo luật (≥ 3: +2; ≥ 5: +5). */
export const thuongChuoi = (n: number) => (n >= 5 ? 5 : n >= 3 ? 2 : 0)

export function BangCombo({ chuoi, tat, truoc = 3 }: { chuoi: number; tat?: boolean; truoc?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const cu = useRef(chuoi)
  const dau = useRef(true)
  useEffect(() => {
    const b = ref.current
    const moi = dau.current || chuoi > cu.current
    dau.current = false
    cu.current = chuoi
    if (!b) return
    if (tat) {
      const svg = b.querySelector('.tp-phan-tu')
      hoatAnh(svg, [{ opacity: 1 }, { opacity: 1 }], 520)
      svg?.querySelectorAll('.lk').forEach((l, i) => hoatAnh(l, [{ opacity: 1 }, { opacity: 0 }], 120, { tre: 60 + i * 40 }))
      svg?.querySelectorAll('.ng').forEach((g, i) => hoatAnh(g, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(0,0)', opacity: 1, offset: 0.2 }, { transform: `translate(${(i - 1) * 10}px,40px) rotate(${(i - 1) * 50}deg)`, opacity: 0 }], 500, { tre: i * 60, e: 'cubic-bezier(.5,0,.9,.6)' }))
      return
    }
    if (chuoi < 3 || !moi) return
    hoatAnh(b, [{ transform: 'translateY(-40px) scale(.9)', opacity: 0 }, { transform: 'translateY(4px) scale(1.04)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], 600, { tre: 200 })
    const ng = b.querySelectorAll('.ng'), lk = b.querySelectorAll('.lk')
    hoatAnh(ng[ng.length - 1], [{ transform: 'scale(0)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], 380, { tre: 560 })
    hoatAnh(lk[lk.length - 1], [{ opacity: 0 }, { opacity: 1 }], 200, { tre: 520 })
    phanHoiThuong('combo', chuoi - 3)
    if (chuoi >= 5) setTimeout(() => bungHat(b, { n: 14, r: 110, mau: ['sao', 'lua', 'sai'] }), 700)
  }, [chuoi, tat])
  if (tat) return <div className="tp-combo-o"><div ref={ref} className="tp-combo" data-tat="" role="status"><PhanTu n={Math.max(3, Math.min(10, truoc))} /><span>Chuỗi đúng: 0</span></div></div>
  if (chuoi < 3) return null
  const day = chuoi >= 5
  return <div className="tp-combo-o"><div ref={ref} className="tp-combo" data-day={day || undefined} role="status">
    <PhanTu n={chuoi} /><span>{day ? 'Phản ứng dây chuyền!' : `Chuỗi đúng ${chuoi}`} <small>· +{thuongChuoi(chuoi)} mỗi câu</small></span>
  </div></div>
}

export function OngNghiem({ phanTram, combo, kimCuong, nhan }: { phanTram: number; combo?: boolean; kimCuong?: boolean; nhan: string }) {
  const p = Math.max(0, Math.min(100, phanTram))
  const ref = useRef<HTMLDivElement>(null)
  const cu = useRef(p)
  useEffect(() => {
    const truoc = cu.current; cu.current = p
    if (p > truoc && p > 0) hoatAnh(ref.current?.querySelector('.long'), [{ transform: `scaleX(${truoc / p})` }, { transform: 'scaleX(1)' }], 500, { tre: 120 })
  }, [p])
  return <div ref={ref} className="tp-ong" style={{ '--p': `${p}%` } as CSSProperties} data-combo={combo || undefined} data-kc={kimCuong || undefined}
    role="progressbar" aria-label={nhan} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}>
    <i className="long"><b className="cam" /><s className="vet" /><s className="bot" style={{ left: '30%' }} /><s className="bot" style={{ left: '62%', animationDelay: '.6s' }} /><s className="bot" style={{ left: '84%', animationDelay: '1.1s' }} /></i>
    <span className="bong-tren" />
  </div>
}
