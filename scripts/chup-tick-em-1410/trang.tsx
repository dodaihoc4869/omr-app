// Bản vẽ đề nghị C3; chỉ tái dùng bộ chọn thật, không gọi máy chủ hoặc sửa app.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../src/components/m3/m3.css'
import '../../src/components/chien-dich/gv-v2.css'
import '../../src/components/chien-dich/chien-dich.css'
import ChonEmGiao, { type EmLop } from '../../src/components/chien-dich/ChonEmGiao'
import './trang.css'

const ds: EmLop[] = Array.from({ length: 44 }, (_, i) => ({ sbd: `1200${String(i + 1).padStart(4, '0')}`, hoTen: ['Nguyễn An', 'Trần Bảo', 'Lê Minh Châu', 'Phạm Hải Đăng', 'Đỗ Ngọc Hà', 'Vũ Hoàng Khánh', 'Nguyễn Thị Ánh Dương Phương Anh'][i] ?? (i === 43 ? 'Nguyễn Thanh Tâm' : `Học sinh mẫu ${String(i + 1).padStart(2, '0')}`), khoi: '12', tenLop: '12 - Tinh Hoa' }))
const cu = new Set(ds.slice(0, 43).map(e => e.sbd))
const khoiTao = new Set([...cu].filter(sbd => sbd !== ds[1]!.sbd).concat(ds[43]!.sbd))
function BanVe() {
  const [chon, setChon] = useState(khoiTao)
  const [mo, setMo] = useState(true)
  const [daLuu, setDaLuu] = useState(false)
  const them = ds.filter(e => chon.has(e.sbd) && !cu.has(e.sbd)), bot = ds.filter(e => !chon.has(e.sbd) && cu.has(e.sbd))
  return <div className="m3 gvv2">
    <main className="ve-nen">
      <p className="gvv2-phu">Bản vẽ đề nghị · dữ liệu giả</p>
      <h1 className="gvv2-h1">Tick bài vừa dạy</h1>
      <section className="gvv2-the ve-bang"><h2 className="gvv2-h2">Bài đang giao</h2><div className="ve-dong"><span><b>12 - Tinh Hoa</b><small>{daLuu ? chon.size : cu.size} em nhận bài</small></span><span><b>Bài 8. Amine</b><small>Hạn nộp · 23:59 Thứ Sáu 16/10</small></span><button type="button" className="gvv2-nut-vien">Sửa hạn</button><button type="button" className="gvv2-nut-vien" onClick={() => setMo(true)}>Thêm / Bớt em</button></div></section>
    </main>
    {mo && <div className="ve-phu"><section className="ve-tam" role="dialog" aria-modal="true" aria-labelledby="ve-tieu-de">
      <header><span><p className="ve-nhan">12 - Tinh Hoa · đang nhận {cu.size} em</p><h2 id="ve-tieu-de">Em nhận Bài 8. Amine</h2></span><button type="button" className="ve-dong-tam" aria-label="Đóng tấm Em nhận bài" onClick={() => setMo(false)}>×</button></header>
      <div className="ve-than">
        <aside><p className="ve-nhan">Danh sách sẽ thay đổi</p><div className="ve-so"><span>Thêm <b>{them.length} em</b></span><span>Bớt <b>{bot.length} em</b></span><span>Sẽ nhận <b>{chon.size} em</b></span></div><div className="ve-thay-doi">{them.map(e => <p key={e.sbd}><b>Thêm</b><span>{e.hoTen}</span></p>)}{bot.map(e => <p key={e.sbd}><b>Bớt</b><span>{e.hoTen}</span></p>)}</div><p className="ve-chu">Em được thêm nhận cùng bài và hạn của lớp. Kết quả đã làm được giữ.</p></aside>
        <div className="ve-bo-chon"><label className="ve-nhan">Em nhận bài</label><ChonEmGiao ds={ds} chon={chon} onDoi={s => { setChon(s); setDaLuu(false) }} /></div>
      </div>
      <footer><p role="status">{daLuu ? 'Đã lưu danh sách' : `${them.length + bot.length} em thay đổi`}</p><div><button type="button" className="gvv2-nut-vien" onClick={() => setMo(false)}>Hủy</button><button type="button" className="gvv2-nut-chinh" disabled={daLuu || !them.length && !bot.length} onClick={() => setDaLuu(true)}>Lưu danh sách</button></div></footer>
    </section></div>}
  </div>
}
createRoot(document.getElementById('root')!).render(<BanVe />)
