// ĐOÀN HỘ TỐNG — màn 3 TIẾP SỨC (bản vẽ 3): tấm trượt 3 THẺ GỢI Ý. Thẻ do MÁY CHỦ soạn từ kiến thức + lời giải có sẵn của câu —
// người tiếp sức chỉ chọn LOẠI thẻ, không thấy nội dung thẻ, không thấy bạn đã chọn gì. Không bao giờ là đáp án.
import type { ReactElement } from 'react'
import type { GoiYTiepSuc } from './doan-kieu'
import { BookOpen, Ban, ArrowUpRight } from 'lucide-react'
import { ThuHinh } from './DoanHinh'

const HINH: Record<string, ReactElement> = { nhac_cong_thuc: <BookOpen size={22} />, loai_phuong_an: <Ban size={22} />, buoc_dau: <ArrowUpRight size={22} /> }
const THU_TU = ['nhac_cong_thuc', 'loai_phuong_an', 'buoc_dau'] as const
const MAC_DINH: Record<string, [string, string]> = { nhac_cong_thuc: ['Nhắc công thức', 'Gửi bạn kiến thức gốc của câu'], loai_phuong_an: ['Loại 1 phương án', 'A.I Đỗ Đại Học gạch một đáp án sai'], buoc_dau: ['Chỉ bước đầu', 'Hé bước đầu của lời giải'] }

export default function DoanTiepSuc({ goiY, ban, loi, onChon, onDong }: { goiY: GoiYTiepSuc; ban: boolean; loi: string; onChon: (loai: string) => void; onDong: () => void }) {
  const co = new Map(goiY.the.map(t => [t.loai, t]))
  return (
    <div className="dh-tam-nen" onClick={onDong}>
      <section className="dh-tam" role="dialog" aria-label={`Tiếp sức cho ${goiY.ten}`} onClick={e => e.stopPropagation()}>
        <div className="dh-tam-dau">
          <ThuHinh pet={goiY.pet} cap={goiY.cap} size={46} />
          <div><b>Tiếp sức cho {goiY.ten}</b><small>{goiY.ten} làm lại đúng → cả hai nhận <span className="dh-chu-vang">LIÊN KÍCH ×2</span></small></div>
        </div>
        {goiY.de && <div className="dh-tam-cau"><small>CÂU CỦA {goiY.ten.toUpperCase()}{goiY.tenDang ? ` · ${goiY.tenDang.toUpperCase()}` : ''}</small>{goiY.de} <i>(em không thấy {goiY.ten} đã chọn gì)</i></div>}
        <div className="dh-the-goi-y" role="group" aria-label="Chọn một thẻ gợi ý">
          {THU_TU.map(loai => {
            const t = co.get(loai)
            return (
              <button key={loai} type="button" disabled={ban || !t} onClick={() => onChon(loai)}>
                <i aria-hidden="true">{HINH[loai]}</i><b>{t?.tieuDe ?? MAC_DINH[loai]![0]}</b><small>{t ? t.moTa : 'Câu này không có thẻ loại này'}</small>
              </button>
            )
          })}
        </div>
        {loi && <div className="dh-loi" role="alert">{loi}</div>}
        <div className="dh-tam-chan">
          <span>Thẻ do A.I Đỗ Đại Học soạn từ lời giải — <b>không bao giờ là đáp án</b>. Câu được giúp hôm nay sẽ quay lại để {goiY.ten} tự làm vào ngày mai.</span>
          <button type="button" className="dh-nut-mo" onClick={onDong}>Để sau</button>
        </div>
      </section>
    </div>
  )
}
