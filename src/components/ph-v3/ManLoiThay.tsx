// Màn con "Nhận xét của thầy" (`#loi-thay`, mở từ thẻ ở Hôm nay — trung tu 09/10: không còn là mục trên thanh). Có nút quay lại Hôm nay.
// Chỉ đọc nhận xét ĐÃ công bố từ nguồn nhận xét của thầy; mỗi nhận xét dẫn sang báo cáo ca của nó.
import type { NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { ngayDayDuVn } from '../../lib/ph-moi/dinh-dang'
import { chuThay, lienKetCa } from './tien-ich'
import { BtPhai, BtTrai } from './BieuTuong'
import { DangTai, TheLoi, TheTrong } from './dung-chung'

export default function ManLoiThay({ ds, loi, thuLai }: { ds: NhanXetCa[] | null; loi: string; thuLai: () => void }) {
  return (
    <section className="ph3-loi-thay-man" data-vung="man-nhan-xet">
      <a className="ph3-lui tt-nhan" href="#hom-nay"><BtTrai co={24} day={2.5} />Hôm nay</a>
      <div className="ph3-tieu-de ph3-tieu-de--ca"><h1>Nhận xét của thầy</h1></div>
      {!ds && !loi ? (
        <DangTai chu="Đang tải nhận xét của thầy…" hinh="loi-thay" />
      ) : (
        <div className="ph3-luoi">
          {loi && <TheLoi chu={loi} thuLai={thuLai} />}
          {ds?.length === 0 && <TheTrong id="ph3-nx-trong" tieuDe="Chưa có nhận xét của thầy" chu="Nhận xét của thầy hiện ở đây sau khi thầy công bố kết quả ca kiểm tra của con." />}
          {ds?.map((x) => {
            const ngay = x.nopLuc || x.capNhatLuc || ''
            return (
              <article key={x.maCa} className="ph3-the ph3-the--thay ph3-o-hep" aria-labelledby={`ph3-nx-${x.maCa}`}>
                <div className="ph3-the__dau">
                  <div>
                    <h2 id={`ph3-nx-${x.maCa}`}>{x.tenCa}</h2>
                    {ngay && <span>Thầy Đỗ Đại Học · {ngayDayDuVn(ngay)}</span>}
                  </div>
                </div>
                <p className="ph3-the__loi">{chuThay(x.noiDung)}</p>
                <a className="ph3-dong-lk tt-nhan" href={lienKetCa(x.maCa)}><span>Xem báo cáo ca này</span><BtPhai co={18} day={2.5} /></a>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
