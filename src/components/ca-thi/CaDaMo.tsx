// MÀN "CA ĐÃ MỞ" — hiện NGAY sau khi thầy bấm Mở ca thành công (thầy 28/09: "khi mở ca thi xong màn hình đó vẫn là của app cũ").
// Phong cách app mới (M3 nhiều tông, token --gvm-*, bản vẽ docs/ban-ve-ca-thi-2809 màn a/b): thẻ lớn "Ca đã mở" có tên ca, MÃ CA chữ to,
// link + Chép link, "Chiếu mã lên bảng", "Sang Theo dõi ca" (việc chính). Chỉ VẼ — mọi lệnh đi qua hàm của màn cha (ExamSetupScreen).
import { Check, CircleCheck, Copy, MonitorPlay, ArrowRight, Plus } from 'lucide-react'
import './ca-thi.css'

export interface CaDaMoProps {
  maCa: string
  tenCa: string
  joinLink: string
  lop: string
  soCau: number
  phut: number
  congBo: string
  /** "Bắt đầu 08:00 · vào phòng đến 08:15" */
  gio: string
  aiLam: string
  daCopy: boolean
  onChepLink: () => void
  onChepMa: () => void
  onChieuMa: () => void
  onTheoDoi: () => void
  onMoCaKhac: () => void
}

export default function CaDaMo(p: CaDaMoProps) {
  return (
    <div className="gv-page ct" data-vung="ca-da-mo">
      <div className="ct-khung ct-cdm">
        <div className="ct-dau">
          <div>
            <div className="ct-duong">Ca kiểm tra › Mở ca mới</div>
            <h1>Ca đã mở</h1>
          </div>
        </div>

        <section className="ct-cdm-the" aria-labelledby="ct-cdm-ten">
          <div className="ct-cdm-dau">
            <span className="ct-cdm-dau-bt" aria-hidden="true">
              <CircleCheck size={22} />
            </span>
            <div className="ct-cdm-dau-chu">
              <div className="nho">Ca đã mở · em vào được ngay</div>
              <h2 id="ct-cdm-ten">{p.tenCa}</h2>
            </div>
          </div>

          <div className="ct-cdm-ma">
            <div className="nhan">Mã ca</div>
            <div className="so mono ct-cdm-so" aria-label={`Mã ca ${p.maCa.split('').join(' ')}`}>
              {p.maCa}
            </div>
            <button type="button" className="ct-nut ct-nut-vien ct-nut-nho" onClick={p.onChepMa}>
              <Copy size={16} aria-hidden="true" />
              Chép mã ca
            </button>
          </div>

          <div className="ct-cdm-link">
            <p className="ct-ghi">Gửi link này vào nhóm Zalo lớp — em mở link, gõ số báo danh là vào thi:</p>
            <div className="ct-link">
              <span className="mono" title={p.joinLink}>
                {p.joinLink.replace(/^https?:\/\//, '').split('?')[0]}
              </span>
              <button type="button" className="ct-nut ct-nut-chinh ct-nut-nho" onClick={p.onChepLink}>
                {p.daCopy ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {p.daCopy ? 'Đã chép' : 'Chép link'}
              </button>
            </div>
          </div>

          <div className="ct-cdm-nut">
            <button type="button" className="ct-nut ct-nut-tong" onClick={p.onChieuMa}>
              <MonitorPlay size={18} aria-hidden="true" />
              Chiếu mã lên bảng
            </button>
            <button type="button" className="ct-nut ct-nut-chinh" onClick={p.onTheoDoi}>
              Sang Theo dõi ca
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="ct-tam ct-cdm-tt" aria-label="Thông tin ca">
          <div className="ct-cdm-o c-xd">
            <span>Lớp</span>
            <b>{p.lop || '—'}</b>
          </div>
          <div className="ct-cdm-o c-tim">
            <span>Đề</span>
            <b className="so">
              {p.soCau} câu · {p.phut} phút
            </b>
          </div>
          <div className="ct-cdm-o c-hp">
            <span>Giờ</span>
            <b className="so">{p.gio}</b>
          </div>
          <div className="ct-cdm-o c-xl">
            <span>Công bố điểm</span>
            <b>{p.congBo}</b>
          </div>
          <div className="ct-cdm-o c-xd">
            <span>Ai làm</span>
            <b>{p.aiLam}</b>
          </div>
        </section>

        <button type="button" className="ct-nut ct-nut-vien ct-cdm-khac" onClick={p.onMoCaKhac}>
          <Plus size={18} aria-hidden="true" />
          Mở ca khác
        </button>
      </div>
    </div>
  )
}
