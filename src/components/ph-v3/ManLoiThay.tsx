// Lời đã công bố; chỉ đọc từ nguồn nhận xét của thầy.
import type { NhanXetCa } from '../../lib/ph-v3/du-lieu'
import { ngayDayDuVn } from '../../lib/ph-moi/dinh-dang'
import { chuThay, lienKetCa } from './tien-ich'
import { DangTai, TheLoi } from './dung-chung'
export default function ManLoiThay({ ds, loi, thuLai }: { ds: NhanXetCa[] | null; loi: string; thuLai: () => void }) {
  return <section className="ph3-loi-thay"><div className="ph3-tieu-de"><h1>Lời thầy</h1></div><div className="ph3-luoi">
    {loi && <TheLoi chu={loi} thuLai={thuLai} />}
    {!ds && !loi && <DangTai />}
    {ds?.length === 0 && <section className="ph3-the"><h2>Chưa có lời thầy được công bố</h2><p>Lời thầy sẽ xuất hiện sau khi báo cáo của con được công bố.</p></section>}
    {ds?.map(x => <article key={x.maCa} className="ph3-the ph3-the--thay"><header><h2>Thầy Đỗ Đại Học</h2><p>{x.nopLuc || x.capNhatLuc ? ngayDayDuVn(x.nopLuc || x.capNhatLuc || '') : ''}</p></header><p className="ph3-the__loi">{chuThay(x.noiDung)}</p><a className="ph3-dong-lk" href={lienKetCa(x.maCa)}>Xem báo cáo · {x.tenCa}</a></article>)}
  </div></section>
}
