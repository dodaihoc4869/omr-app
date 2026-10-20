import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { BieuTuongTuSua } from './BieuTuongTuSua'
import { henGapLai } from '../../lib/chua-truc-tiep'
import { moTaChang, type ViecHomNay, type ViecMuc } from '../../lib/tu-sua-viec-hom-nay'
import type { MucChua } from '../../lib/chua-cau-sai-api'
import './viec-hom-nay.css'

// KHỐI ĐẦU MÀN TỰ SỬA LỖI: "Việc hôm nay" (thầy 20/10: "sửa ít nhất 12 câu mỗi ngày, chia làm các chặng cho thông minh và cảm hứng").
// Em chỉ thấy MỘT chặng 4 câu tại một lúc (chặng sau gọn một dòng), tiến độ theo chặng, MỘT nút chính tới câu kế tiếp, và dòng nói thật số câu còn cho các ngày sau.
// Logic ở src/lib/tu-sua-viec-hom-nay.ts (thuần, có test). Màn này nạp lười cùng ManTuChua.

export interface ThongTinDong { ten: string; phu: string; trangThai: string }
interface Props {
  viec: ViecHomNay
  /** Tên + dòng phụ + chữ trạng thái của một mục (ManTuChua dựng từ `Câu đã làm`). */
  thongTin: (m: MucChua, i: number) => ThongTinDong
  /** Đã tự sửa / tổng số đợt (`dem` của máy chủ). */
  soXong: number
  tong: number
  nayMs: number
  onChon: (m: MucChua, i: number) => void
  onThem: () => void
  onVe: () => void
}

/** 4 chấm đường sửa một câu: sửa từng bước · ghép cả bài · bản mới · đã tự sửa. Câu chỉ có lối câu gốc không có đường này. */
const BUOC_DUONG: Record<string, number> = { can_chan_doan: 0, dang_chua_buoc: 0, dang_ghep_bai: 1, cho_gap_lai_2: 2, dang_kiem_chung: 2, da_tu_sua: 4 }
export function chamDuong(x: Pick<ViecMuc, 'loai'> & { m: Pick<MucChua, 'trangThai'> }): (string | undefined)[] | null {
  const n = BUOC_DUONG[x.m.trangThai]
  if (x.loai === 'goc' || n === undefined) return null
  return [0, 1, 2, 3].map((i) => (i < n ? 'xong' : i === n ? 'nay' : undefined))
}

/** Chữ trạng thái của một câu trong ngày: câu đã xong phần nói đúng việc đã làm (không gọi là "tự sửa" khi chưa phải). */
export function chuTrangThaiViec(x: ViecMuc, goc: string, nayMs: number): string {
  if (x.xong) {
    if (x.m.trangThai === 'da_tu_sua') return 'Đã tự sửa'
    if (x.m.trangThai === 'cho_gap_lai_2') {
      const h = henGapLai(x.m.denHan, nayMs)
      return h ? `Đã ghép xong · bản mới mở ${h.luc}` : 'Đã ghép xong · chờ bản mới'
    }
    if (x.m.trangThai === 'can_thay') return 'Đã làm phần của em · chờ chữa trên lớp'
    return x.loai === 'goc' ? 'Đã tự làm lại hôm nay' : 'Xong phần hôm nay'
  }
  return x.loai === 'gan' ? 'Chỉ còn làm bản mới là xong' : goc
}

export default function ViecHomNay({ viec, thongTin, soXong, tong, nayMs, onChon, onThem, onVe }: Props) {
  const nChang = viec.chang.length
  const xongCa = !viec.tiep
  const k = Math.min(viec.changHienTai, nChang - 1)
  const chang = viec.chang[k]!
  const chiSo = new Map(viec.muc.map((x, i) => [x.khoa, i]))
  const phanTram = `${Math.round((soXong / Math.max(1, tong)) * 1000) / 10}%`
  const phu = xongCa ? 'Em nghỉ cũng được, sửa thêm cũng được.'
    : k > 0 ? `Đã xong chặng ${k}/${nChang}. Nghỉ một chút cũng được.`
    : nChang > 1 ? `Chia ${nChang} chặng nhỏ, mỗi chặng 4 câu.` : 'Làm xong phần này là đủ cho hôm nay.'
  return (
    <>
      <section className="vh-man" data-tt={xongCa ? 'xong' : undefined} aria-labelledby="vh-tieu">
        <div className="vh-dau">
          <span className="vh-dau-bt" aria-hidden="true"><BieuTuongTuSua hien /></span>
          <div>
            <h1 id="vh-tieu">{xongCa ? `Hôm nay em đã xong phần của ${viec.tong} câu` : `Việc hôm nay: ${viec.tong} câu`}</h1>
            <p className="vh-phu">{phu}</p>
          </div>
        </div>
        <div className="vh-hang">
          <div className="vh-cac" role="img" aria-label={`Hôm nay đã xong phần của ${viec.xong} trong ${viec.tong} câu, chia ${nChang} chặng`}>
            {viec.chang.map((c, i) => <span className="vh-nhom" key={i}>{c.map((x) => <i key={x.khoa} data-tt={x.xong ? 'xong' : x.khoa === viec.tiep?.khoa ? 'nay' : undefined} />)}</span>)}
          </div>
          <b className="vh-so">{viec.xong}/{viec.tong} câu</b>
        </div>
        {!xongCa && <>
          <div className="vh-chang-dau"><h2>Chặng {k + 1}/{nChang}</h2><span>{moTaChang(chang)}</span></div>
          <ul className="vh-ds">
            {chang.map((x) => {
              const i = chiSo.get(x.khoa) ?? 0
              const tt = thongTin(x.m, i)
              // Câu đã xong phần mà danh sách chưa tải lại ⇒ không vẽ chấm cũ (khỏi nói "đang ở bước 1" cạnh "Xong phần hôm nay").
              const cham = x.xong && x.m.trangThai !== 'cho_gap_lai_2' && x.m.trangThai !== 'da_tu_sua' ? null : chamDuong(x)
              return (
                <li key={x.khoa}>
                  <button type="button" className="vh-cau" data-khoa={x.khoa} data-tt={x.xong ? 'xong' : x.loai === 'gan' ? 'gan' : undefined} onClick={() => onChon(x.m, i)}>
                    <span className="vh-cau-chu">
                      <strong className="vh-cau-ten">{tt.ten}</strong>
                      {tt.phu && <small className="vh-cau-phu">{tt.phu}</small>}
                      <small className="vh-cau-tt">{chuTrangThaiViec(x, tt.trangThai, nayMs)}</small>
                      {cham && <span className="vh-cham4" role="img" aria-label="Đường sửa một câu, bốn chặng nhỏ">{cham.map((c, j) => <i key={j} data-tt={c} />)}</span>}
                    </span>
                    {x.xong ? <span className="vh-cau-dau" aria-hidden="true"><CheckCircle2 size={14} /></span> : <span className="vh-cau-mui" aria-hidden="true"><ChevronRight size={22} /></span>}
                  </button>
                </li>
              )
            })}
          </ul>
          {viec.chang.length > k + 1 && (
            <ul className="vh-sau" aria-label="Các chặng sau">
              {viec.chang.slice(k + 1).map((c, j) => <li key={j}><span>Chặng {k + j + 2}/{nChang} · {c.length} câu</span><b>{c.filter((x) => x.xong).length}/{c.length} xong</b></li>)}
            </ul>
          )}
        </>}
        {xongCa
          ? <div className="vh-hang-nut">
              <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" onClick={onVe}><span>Về Hôm nay</span><ArrowRight size={20} aria-hidden="true" /></button>
              <button type="button" className="ht-nut-phu" onClick={onThem}>Sửa thêm 1 chặng</button>
            </div>
          : <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" onClick={() => onChon(viec.tiep!.m, chiSo.get(viec.tiep!.khoa) ?? 0)}>
              <span>{viec.xong === 0 ? 'Bắt đầu sửa' : `Sửa tiếp · chặng ${k + 1}/${nChang}`}</span><ArrowRight size={20} aria-hidden="true" />
            </button>}
      </section>
      <div className="vh-tien">
        <p className="vh-ghi">{viec.conNgaySau > 0 ? `Còn ${viec.conNgaySau} câu cho các ngày sau. Em không cần sửa hết hôm nay.` : 'Em không còn câu nào cho các ngày sau.'}</p>
        <div className="tcl-tien-do">
          <p className="tcl-tien-do-chu"><span>Đã tự sửa</span><b>{soXong}/{tong} câu</b></p>
          <div className="tcl-thanh" role="img" aria-label={`Đã tự sửa ${soXong} trong ${tong} câu`}>{soXong > 0 && <i data-tt="xong" style={{ width: phanTram }} />}</div>
        </div>
      </div>
    </>
  )
}
