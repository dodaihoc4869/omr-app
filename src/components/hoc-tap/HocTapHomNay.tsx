import { useState, type ReactNode } from 'react'
import { ArrowRight, BookOpen, Check, ChevronRight, GraduationCap, History, Home, LogOut, RefreshCw, Route, UserRound } from 'lucide-react'
import type { KetQuaSanh } from '../hoa2/api'
import './hoc-tap.css'

type Muc = 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'ca-nhan'
interface Props {
  thongBao?: ReactNode; canhBao?: ReactNode; tienDoCu?: { daLam: number; mucTieu: number };
  ten: string; lop: string; ketQua: KetQuaSanh | null; dangTai: boolean; loi: string
  onHoc: () => void; onXemLai: () => void; onChua: () => void; onThi: () => void
  onTuLuyen: () => void; onLichSu: () => void; onBaiTap: () => void; onGiaDinh: () => void
  onTaiLai: () => void; onDangXuat: () => void; coCa: boolean
}
const TANG = ['Nền tảng', 'Hiểu kiến thức', 'Vận dụng', 'Tổng hợp']
const MENU = [{ id: 'hom-nay', ten: 'Hôm nay', icon: Home }, { id: 'hanh-trinh', ten: 'Hành trình', icon: Route }, { id: 'on-lai', ten: 'Ôn & sửa', icon: History }, { id: 'ca-nhan', ten: 'Của em', icon: UserRound }] as const

export default function HocTapHomNay(p: Props) {
  const [muc, setMuc] = useState<Muc>('hom-nay')
  const sanh = p.ketQua?.cheDo2 && 'sanh' in p.ketQua ? p.ketQua.sanh : null
  const ht = sanh?.hanhTrinh
  const daLam = ht?.daLam ?? (sanh ? Math.max(0, sanh.theLuc.tong - sanh.theLuc.con) : p.tienDoCu?.daLam ?? null)
  const mucNgay = ht?.toiThieu ?? sanh?.theLuc.tong ?? p.tienDoCu?.mucTieu ?? null
  const xong = daLam !== null && mucNgay !== null && mucNgay > 0 && daLam >= mucNgay
  const soChang = ht?.soChang ?? (mucNgay ? Math.ceil(mucNgay / 6) : 0)
  const con = sanh?.theLuc.con ?? null
  const nutDong = (ten: string, chu: string, onClick: () => void) => <button className="ht-dong" onClick={onClick}><span><strong>{ten}</strong><small>{chu}</small></span><ChevronRight size={20} aria-hidden="true" /></button>
  return <div className="ht-app">
    <header className="ht-thanh"><a className="ht-thuong-hieu" href="/hs"><GraduationCap size={27} aria-hidden="true" /><span>Đỗ Đại Học<small>Học Hoá mỗi ngày</small></span></a>{p.thongBao}<button className="ht-nut-bieu-tuong" onClick={p.onTaiLai} aria-label="Cập nhật bài học" disabled={p.dangTai}><RefreshCw size={19} aria-hidden="true" /></button></header>
    <div className="ht-khung">
      <nav className="ht-menu" aria-label="Điều hướng học sinh">{MENU.map(({ id, ten, icon: Icon }) => <button key={id} onClick={() => setMuc(id)} aria-current={muc === id ? 'page' : undefined}><Icon size={21} aria-hidden="true" /><span>{ten}</span></button>)}</nav>
      <main className="ht-noi-dung">
        <div className="ht-mo-dau"><p className="ht-nhan">{p.lop || 'Học sinh'} · {muc === 'hom-nay' ? 'Kế hoạch cá nhân' : MENU.find(x => x.id === muc)?.ten}</p><h1>{muc === 'hom-nay' ? `Chào ${p.ten || 'em'}!` : muc === 'hanh-trinh' ? 'Hành trình học của em' : muc === 'on-lai' ? 'Hiểu chắc từ những lần sửa' : 'Việc học của em'}</h1><p>{muc === 'hom-nay' ? 'Từng đợt ngắn. Tập trung hiểu và tự làm.' : 'Theo dõi kiến thức và chọn việc học tiếp theo.'}</p></div>
        {p.canhBao}
        {p.loi && <div className="ht-thong-bao" role="alert">{p.loi}<button onClick={p.onTaiLai}>Thử lại</button></div>}
        {p.coCa && <div className="ht-ca"><BookOpen size={22} aria-hidden="true" /><span><strong>Ca kiểm tra đang mở</strong><small>Vào phòng kiểm tra để xem điều kiện tham gia.</small></span><button className="ht-nut-phu" onClick={p.onThi}>Vào kiểm tra</button></div>}
        {muc === 'hom-nay' && <>
          <section className="ht-ke-hoach" aria-busy={p.dangTai && !sanh}>
            <div><p className="ht-nhan">{xong ? 'ĐÃ ĐẠT MỨC HỌC HÔM NAY' : 'VIỆC HỌC TIẾP THEO'}</p><h2>{p.dangTai && !sanh ? 'Đang tải bài học…' : xong ? 'Em đã hoàn thành mục tiêu hôm nay' : ht ? `${TANG[ht.tang - 1] || 'Bài học'} · Đợt ${ht.changHienTai}/${ht.soChang}` : 'Tiếp tục bài học của em'}</h2><p>{sanh?.chienDich?.ten || 'Bài học được chọn theo kiến thức và lịch ôn của em.'}</p><button className="ht-nut-chinh" onClick={p.onHoc} disabled={p.dangTai && !sanh || con === 0}>{con === 0 ? 'Đã làm hết câu được giao' : daLam ? 'Tiếp tục học' : 'Bắt đầu học'}<ArrowRight size={20} aria-hidden="true" /></button>{xong && <p className="ht-chu-phu">Em có thể nghỉ. Câu đã làm và kiến thức đã vững được theo dõi riêng.</p>}</div>
            <div className="ht-tien-do"><span className="ht-so-lon">{daLam ?? '—'}<small>/{mucNgay ?? '—'}</small></span><span>câu đã hoàn thành hôm nay</span><progress aria-label="Tiến độ nhiệm vụ hôm nay" value={daLam ?? 0} max={Math.max(1, mucNgay ?? 1)} />{soChang > 0 && <div className="ht-dot" aria-label={`${soChang} đợt học`}>{Array.from({ length: soChang }, (_, i) => <span key={i} data-xong={daLam !== null && daLam >= Math.min((i + 1) * 6, mucNgay ?? Infinity)}>{daLam !== null && daLam >= Math.min((i + 1) * 6, mucNgay ?? Infinity) ? <Check size={16} aria-label="Đã xong" /> : i + 1}</span>)}</div>}<small>Mỗi đợt tối đa 6 câu</small></div>
          </section>
          {!!ht?.conThieu && <div className="ht-thong-bao">Hôm nay còn thiếu {ht.conThieu} câu phù hợp. Em vẫn làm được phần đã có; thầy có thể bổ sung kiến thức.</div>}
          {!!sanh?.tamGiuCa && <div className="ht-thong-bao">Một số câu được giữ cho ca kiểm tra. Bài học sẽ cập nhật khi đủ điều kiện.</div>}
          <div className="ht-hai-cot"><section className="ht-the"><h2>Ôn và sửa đúng chỗ</h2>{nutDong('Tự chữa lỗi', 'Hiểu lại bước đang mắc, rồi thử câu mới.', p.onChua)}{nutDong('Câu đã làm', 'Xem lời giải, lịch ôn và trạng thái kiến thức.', p.onXemLai)}</section><section className="ht-the"><h2>Học thêm theo nhu cầu</h2>{nutDong('Tự luyện', 'Chọn nội dung luyện tập phù hợp.', p.onTuLuyen)}{nutDong('Lịch sử kiểm tra', 'Xem các kết quả đã được công bố.', p.onLichSu)}</section></div>
        </>}
        {muc === 'hanh-trinh' && <section className="ht-the"><h2>{sanh?.chienDich?.ten || 'Bài học được giao'}</h2><p>Quyền học từng câu dựa trên kiến thức đã có. Mức mở của bài là thông tin định hướng.</p>{ht?.bai?.length ? ht.bai.map(b => <div className="ht-bai" key={b.khoa}><BookOpen size={21} aria-hidden="true" /><div><strong>{b.ten}</strong><small>Mức đang mở: {TANG[b.tangMo - 1]}</small></div></div>) : <p className="ht-trong">Chưa có danh sách bài để hiển thị. Kế hoạch hôm nay vẫn được cập nhật theo nguồn phù hợp.</p>}<button className="ht-nut-chinh" onClick={p.onHoc}>Học theo kế hoạch<ArrowRight size={20} aria-hidden="true" /></button></section>}
        {muc === 'on-lai' && <section className="ht-the"><h2>Ôn & sửa</h2>{nutDong('Tự chữa lỗi', 'Giữ bước đã hiểu, tập trung vào bước còn vướng.', p.onChua)}{nutDong('Xem lại câu đã làm', 'Đáp án và lời giải chỉ mở theo quyền hiện hành.', p.onXemLai)}{nutDong('Ôn theo kế hoạch', 'Làm các câu đến lịch cùng bài học hôm nay.', p.onHoc)}</section>}
        {muc === 'ca-nhan' && <section className="ht-the"><h2>{p.ten}</h2><p>{p.lop}</p>{nutDong('Bài tập được giao', 'Theo dõi bài học và bài đã nộp.', p.onBaiTap)}{nutDong('Bài gia đình giao', 'Xem bài bổ sung của gia đình.', p.onGiaDinh)}{nutDong('Lịch sử kiểm tra', 'Điểm và kết quả được công bố.', p.onLichSu)}<button className="ht-nut-phu" onClick={p.onDangXuat}><LogOut size={18} aria-hidden="true" />Đăng xuất</button></section>}
      </main>
    </div>
  </div>
}
