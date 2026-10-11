import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Atom, BookOpen, Check, ChevronRight, ClipboardCheck, FileClock, History, Home, LineChart, LogOut, Mail, PenLine, RefreshCw, Route, Target, Users, X } from 'lucide-react'
import type { KetQuaSanh } from '../hoa2/api'
import './hoc-tap.css'
import TheGoi7 from './TheGoi7'

// TRÙNG TU 11/10 (thầy duyệt bản vẽ https://claude.ai/artifact/5v8vXw5zBzw53FkpCvMknC — "buid và đẩy luôn nhé"):
// 4 mục Hôm nay · Hành trình · Ôn & sửa · Kết quả; "Của em" là tấm mở từ ảnh đại diện; "Vào ca kiểm tra" luôn ở góc trên
// (ca đang mở ⇒ dải ca + nút chính là Vào ca kiểm tra, "Tiếp tục học" lùi thành nút viền). Một màn — một nút chính; mọi việc khác là dòng.
type Muc = 'hom-nay' | 'hanh-trinh' | 'on-lai' | 'ket-qua'
interface Props {
  onKiem?: (goiId:string,maDe:string)=>void
  dangLamMoi?: boolean; nguon?: string; onKetQua?: () => void; onLuyenLai?: () => void; onBangTin?: () => void;
  thongBao?: ReactNode; canhBao?: ReactNode; tienDoCu?: { daLam: number; mucTieu: number };
  ten: string; lop: string; ketQua: KetQuaSanh | null; dangTai: boolean; loi: string
  onHoc: () => void; onXemLai: () => void; onChua: () => void; onThi: () => void
  onTuLuyen: () => void; onLichSu: () => void; onBaiTap: () => void; onGiaDinh: () => void
  onTaiLai: () => void; onDangXuat: () => void; coCa: boolean
  /** Số bài tập về nhà thầy đang giao (dòng ở Hôm nay chỉ hiện khi > 0). */
  soBaiTap?: number
}
/** Tên ngắn 4 tầng của Hành trình (thầy chốt bản vẽ 11/10). */
export const TANG = ['Nền', 'Hiểu', 'Vận dụng', 'Tổng hợp']
const MENU = [{ id: 'hom-nay', ten: 'Hôm nay', icon: Home }, { id: 'hanh-trinh', ten: 'Hành trình', icon: Route }, { id: 'on-lai', ten: 'Ôn & sửa', icon: History }, { id: 'ket-qua', ten: 'Kết quả', icon: LineChart }] as const
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const homNayChu = () => { const d = new Date(); return `${THU[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }
const chuCaiDau = (ten: string) => { const p = ten.trim().split(/\s+/).filter(Boolean); return ((p.length > 1 ? p[p.length - 2]![0] : '') + (p[p.length - 1]?.[0] ?? 'E')).toUpperCase() }

/** Dòng việc: biểu tượng · tên · lý do · số (nếu có) · mũi tên. */
function Dong({ ten, chu, icon: Icon, sac, so, donVi, onClick }: { ten: string; chu: string; icon: typeof Home; sac: 'cham' | 'vang' | 'muc'; so?: number; donVi?: string; onClick: () => void }) {
  return <button className="ht2-dong" onClick={onClick}>
    <span className="ht2-dong-bt" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>
    <span className="ht2-dong-chu"><strong>{ten}</strong><small>{chu}</small></span>
    {so !== undefined && <b className="ht2-dong-so">{so}<small> {donVi}</small></b>}
    <ChevronRight size={20} aria-hidden="true" className="ht2-dong-mui" />
  </button>
}

export default function HocTapHomNay(p: Props) {
  const [muc, setMuc] = useState<Muc>('hom-nay')
  const [moCuaEm, setMoCuaEm] = useState(false)
  const nutCuaEm = useRef<HTMLButtonElement>(null)
  const tamCuaEm = useRef<HTMLDivElement>(null)
  const sanh = p.ketQua?.cheDo2 && 'sanh' in p.ketQua ? p.ketQua.sanh : null
  const ht = sanh?.hanhTrinh
  const goi7 = sanh?.goi7
  const daLam = goi7?.daLamHomNay ?? ht?.daLam ?? (sanh ? Math.max(0, sanh.theLuc.tong - sanh.theLuc.con) : p.tienDoCu?.daLam ?? null)
  const mucNgay = goi7?.toiThieu ?? ht?.toiThieu ?? sanh?.theLuc.tong ?? p.tienDoCu?.mucTieu ?? null
  const xong = goi7 ? goi7.tuLamCon+goi7.tiepCanCon+goi7.thieuPhu===0 && goi7.goi.every(g=>g.gapHomNay>=g.quota) : daLam !== null && mucNgay !== null && mucNgay > 0 && daLam >= mucNgay
  const soChang = ht?.soChang ?? (mucNgay ? Math.ceil(mucNgay / 6) : 0)
  const con = sanh?.theLuc.con ?? null
  const phanTram = daLam !== null && mucNgay ? Math.min(100, Math.round((daLam / mucNgay) * 100)) : 0
  const xongChang = (i: number) => daLam !== null && daLam >= Math.min((i + 1) * 6, mucNgay ?? Infinity)
  const soChangXong = Array.from({ length: soChang }, (_, i) => xongChang(i)).filter(Boolean).length
  const conCau = daLam !== null && mucNgay !== null ? Math.max(0, mucNgay - daLam) : null
  const chuNut = con === 0 ? 'Đã làm hết câu được giao' : daLam ? 'Tiếp tục học' : 'Bắt đầu học'
  const khoaHoc = p.dangLamMoi || p.dangTai && !sanh || con === 0
  const baiXep = [...(ht?.bai ?? [])].sort((a, b) => b.tangMo - a.tangMo)

  // Tấm "Của em": Esc đóng, focus vào tấm khi mở và trả về ảnh đại diện khi đóng.
  useEffect(() => {
    if (!moCuaEm) return
    tamCuaEm.current?.focus()
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoCuaEm(false) }
    window.addEventListener('keydown', f)
    return () => { window.removeEventListener('keydown', f); nutCuaEm.current?.focus() }
  }, [moCuaEm])
  const dongTam = (fn: () => void) => () => { setMoCuaEm(false); fn() }

  const nutHoc = (phu: boolean) => <button className={phu ? 'ht-nut-phu ht2-nut-lon' : 'ht-nut-chinh ht2-nut-lon'} onClick={p.onHoc} disabled={khoaHoc}>{chuNut}<ArrowRight size={20} aria-hidden="true" /></button>

  return <div className="ht-app ht2" data-nguon={p.nguon}>
    <header className="ht-thanh ht2-thanh">
      <a className="ht-thuong-hieu" href="/hs"><span className="ht2-logo" aria-hidden="true"><Atom size={22} /></span><span>Đỗ Đại Học<small>Học Hoá mỗi ngày</small></span></a>
      <div className="ht2-thanh-phai">
        {!p.coCa && <button className="ht2-nut-thi" onClick={p.onThi}><ClipboardCheck size={18} aria-hidden="true" />Vào ca kiểm tra</button>}
        {p.thongBao}
        <button className="ht-nut-bieu-tuong" onClick={p.onTaiLai} aria-label="Cập nhật bài học" disabled={p.dangTai}><RefreshCw size={19} aria-hidden="true" /></button>
        <button ref={nutCuaEm} className="ht2-anh" onClick={() => setMoCuaEm(true)} aria-label="Của em" aria-haspopup="dialog" aria-expanded={moCuaEm}>{chuCaiDau(p.ten || 'Em')}</button>
      </div>
    </header>
    <div className="ht-khung">
      <nav className="ht-menu" aria-label="Điều hướng học sinh">{MENU.map(({ id, ten, icon: Icon }) => <button key={id} onClick={() => setMuc(id)} aria-current={muc === id ? 'page' : undefined}><Icon size={21} aria-hidden="true" /><span>{ten}</span></button>)}</nav>
      <main className="ht-noi-dung ht2-noi-dung tt-vao-muc" key={muc}>
        <div className="ht2-mo-dau"><p>{homNayChu()}{p.lop ? ` · ${p.lop}` : ''}{muc === 'hanh-trinh' && sanh?.chienDich?.ten ? ` · ${sanh.chienDich.ten}` : ''}</p><h1>{muc === 'hom-nay' ? `Chào ${p.ten || 'em'}` : MENU.find(x => x.id === muc)?.ten}</h1></div>
        {p.canhBao}
        {p.dangLamMoi && <p className="ht-thong-bao" data-vung="dang-lam-moi" role="status">Hệ thống đang làm mới, khoảng 1–5 phút. Em cứ để app mở, app tự vào lại.</p>}
        {p.loi && <div className="ht-thong-bao ht2-loi" role="alert"><span>{p.loi}</span><button className="ht-nut-phu" onClick={p.onTaiLai}>Thử lại</button></div>}
        {p.coCa && <section className="ht2-ca" aria-label="Ca kiểm tra đang mở"><span className="ht2-dong-bt" data-sac="cham" aria-hidden="true"><ClipboardCheck size={20} /></span><span className="ht2-ca-chu"><strong>Ca kiểm tra đang mở</strong><small>Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</small></span><button className="ht-nut-chinh ht2-nut-lon" onClick={p.onThi}>Vào ca kiểm tra<ArrowRight size={20} aria-hidden="true" /></button></section>}

        {muc === 'hom-nay' && <>
          <section className="ht2-chinh" aria-busy={p.dangTai && !sanh} aria-label="Mục tiêu hôm nay">
            <div className="ht2-vong" style={{ '--p': phanTram } as CSSProperties} aria-hidden="true"><span><b>{daLam ?? '—'}</b><small>trên {mucNgay ?? '—'} câu</small></span></div>
            <progress className="ht2-an" aria-label="Tiến độ nhiệm vụ hôm nay" value={daLam ?? 0} max={Math.max(1, mucNgay ?? 1)} />
            <div className="ht2-chinh-chu">
              <p className="ht2-nhan">{xong ? 'Đã đạt mục tiêu hôm nay' : 'Mục tiêu hôm nay'}</p>
              <h2>{p.dangTai && !sanh ? 'Đang tải bài học…' : xong ? 'Em đã hoàn thành phần được xếp hôm nay' : goi7 ? `${goi7.tuLamCon} câu tự làm · ${goi7.tiepCanCon} câu học có hỗ trợ` : ht ? `${TANG[ht.tang - 1] || 'Bài học'} · Chặng ${ht.changHienTai}/${ht.soChang}` : 'Tiếp tục bài học của em'}</h2>
              <p className="ht2-phu">{goi7?.goi[0]?.ten || sanh?.chienDich?.ten || 'Bài học được chọn theo kiến thức và lịch ôn của em.'}{conCau !== null && !xong ? ` · còn ${conCau} câu` : ''}</p>
              {soChang > 0 && <div className="ht2-chang" aria-label={`Xong ${soChangXong} trong ${soChang} chặng`}>{Array.from({ length: soChang }, (_, i) => <i key={i} data-tt={xongChang(i) ? 'xong' : i === soChangXong ? 'dang' : 'cho'} />)}</div>}
              {soChang > 0 && <p className="ht2-chang-chu"><span>Xong {soChangXong} chặng</span><span>{soChang} chặng · mỗi chặng tối đa 6 câu</span></p>}
              {nutHoc(p.coCa)}
              {xong && <p className="ht-chu-phu">Em có thể nghỉ. Câu đã làm và kiến thức đã vững được theo dõi riêng.</p>}
            </div>
          </section>
          {goi7 && <TheGoi7 du={goi7} onKiem={p.onKiem} />}
          {!!ht?.conThieu && <div className="ht-thong-bao">Hôm nay còn thiếu {ht.conThieu} câu phù hợp. Em vẫn làm được phần đã có; thầy có thể bổ sung kiến thức.</div>}
          {!!sanh?.tamGiuCa && <div className="ht-thong-bao">Một số câu được giữ cho ca kiểm tra. Bài học sẽ cập nhật khi đủ điều kiện.</div>}
          <section className="ht2-nhom" aria-label="Ôn và sửa đúng chỗ">
            <h2>Ôn và sửa đúng chỗ</h2>
            <Dong ten="Tự chữa lỗi" chu="Hiểu lại bước đang vướng, rồi tự làm bản mới." icon={PenLine} sac="cham" onClick={p.onChua} />
            <Dong ten="Câu đã làm" chu="Lời giải, lịch ôn 1 · 3 · 7 ngày và trạng thái từng câu." icon={History} sac="vang" onClick={p.onXemLai} />
            {!!p.soBaiTap && <Dong ten="Bài tập về nhà" chu="Thầy đang giao — làm theo chặng." icon={BookOpen} sac="muc" so={p.soBaiTap} donVi="bài" onClick={p.onBaiTap} />}
          </section>
        </>}

        {muc === 'hanh-trinh' && <>
          <section className="ht2-the">
            <p className="ht2-nhan">Thang 4 tầng của mỗi bài</p>
            <ol className="ht2-thang" aria-label={ht ? `Tầng đang luyện: ${TANG[ht.tang - 1] ?? ''}` : 'Thang 4 tầng'}>
              {TANG.map((t, i) => { const tt = !ht ? 'cho' : i + 1 < ht.tang ? 'vung' : i + 1 === ht.tang ? 'dang' : 'cho'; return <li key={t} data-tt={tt}><span>{tt === 'vung' ? <Check size={16} aria-label="Đã vững" /> : i + 1}</span>{t}</li> })}
            </ol>
            <p className="ht-chu-phu">Tầng của từng bài do kết quả em tự làm quyết định. Câu có gợi ý vẫn được ghi, nhưng tính là có hỗ trợ.</p>
          </section>
          <section className="ht2-nhom" aria-label="Các bài trong Hành trình">
            <h2>{baiXep.length ? `${baiXep.length} bài trong Hành trình` : sanh?.chienDich?.ten || 'Bài học được giao'}</h2>
            {baiXep.length ? baiXep.map(b => <div className="ht2-bai" key={b.khoa}>
              <div className="ht2-bai-dau"><strong>{b.ten}</strong><span className="ht2-chip" data-sac="cham">{TANG[b.tangMo - 1]}</span></div>
              <div className="ht2-bai-nac" aria-label={`Đang luyện tầng ${TANG[b.tangMo - 1]}`}>{TANG.map((t, i) => <i key={t} data-tt={i + 1 < b.tangMo ? 'vung' : i + 1 === b.tangMo ? 'dang' : 'cho'} />)}</div>
            </div>) : <p className="ht-trong">Chưa có danh sách bài để hiển thị. Kế hoạch hôm nay vẫn được cập nhật theo nguồn phù hợp.</p>}
            <p className="ht-chu-phu">Vàng trầm: đã vững · chàm: đang luyện · xám: còn khoá.</p>
          </section>
          {nutHoc(p.coCa)}
        </>}

        {muc === 'on-lai' && <section className="ht2-nhom" aria-label="Ôn và sửa">
          <h2>Hổng chỗ nào, sửa chỗ ấy</h2>
          <Dong ten="Tự chữa lỗi" chu="Giữ bước đã hiểu, tập trung vào bước còn vướng." icon={PenLine} sac="cham" onClick={p.onChua} />
          <Dong ten="Câu đã làm" chu="Lời giải và lịch ôn lại của từng câu." icon={History} sac="vang" onClick={p.onXemLai} />
          <Dong ten="Tu luyện" chu="Tự chọn chương, dạng và mức để luyện thêm." icon={Target} sac="muc" onClick={p.onTuLuyen} />
          {p.onLuyenLai && <Dong ten="Luyện lại từ bài kiểm tra" chu="Chọn lỗi cần củng cố từ các bài đã làm." icon={FileClock} sac="muc" onClick={p.onLuyenLai} />}
        </section>}

        {muc === 'ket-qua' && <section className="ht2-nhom" aria-label="Kết quả">
          <h2>Điểm thầy đã công bố</h2>
          <Dong ten="Ca kiểm tra" chu="Điểm, đường tiến bộ và lời giải các ca đã công bố." icon={LineChart} sac="cham" onClick={p.onLichSu} />
          {p.onKetQua && <Dong ten="Kết quả bài đã nộp" chu="Điểm và báo cáo theo quyền công bố." icon={ClipboardCheck} sac="vang" onClick={p.onKetQua} />}
          <Dong ten="Bài tập về nhà" chu="Bài thầy giao và các chặng đã nộp." icon={BookOpen} sac="muc" so={p.soBaiTap || undefined} donVi="bài" onClick={p.onBaiTap} />
        </section>}
      </main>
    </div>

    {moCuaEm && <div className="ht2-phu-nen">
      <div ref={tamCuaEm} className="ht2-tam" role="dialog" aria-modal="true" aria-label="Của em" tabIndex={-1}>
        <div className="ht2-tam-dau">
          <span className="ht2-anh ht2-anh-lon" aria-hidden="true">{chuCaiDau(p.ten || 'Em')}</span>
          <span className="ht2-tam-ten"><strong>{p.ten || 'Học sinh'}</strong><small>{p.lop || 'Học sinh'}</small></span>
          <button className="ht-nut-bieu-tuong" onClick={() => setMoCuaEm(false)} aria-label="Đóng"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="ht2-nhom ht2-nhom-tam">
          <Dong ten="Bài gia đình giao" chu="Bài bổ sung gia đình đã giao cho em." icon={Mail} sac="muc" onClick={dongTam(p.onGiaDinh)} />
          {p.onBangTin && <Dong ten="Thông tin từ gia đình" chu="Lời nhắn và thông báo của gia đình." icon={Users} sac="muc" onClick={dongTam(p.onBangTin)} />}
        </div>
        <p className="ht2-tam-ghi"><strong>Em đang học theo kế hoạch của thầy.</strong> Mỗi ngày làm đủ số câu tối thiểu, ôn đúng lịch, chữa câu sai đến khi tự làm được bản mới.</p>
        <button className="ht-nut-phu ht2-dang-xuat" onClick={dongTam(p.onDangXuat)}><LogOut size={18} aria-hidden="true" />Đăng xuất</button>
      </div>
    </div>}
  </div>
}
