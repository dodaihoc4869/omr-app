// NHIỆM VỤ NGÀY + RƯƠNG (bản vẽ tp-9) · CỬA HÀNG TINH THỂ (tp-10) · THĂNG HOA (tp-11) · kết quả CƯỢC CHUỖI (H4) — thầy chốt 26/10.
// Tinh thể = MỘT đồng tiền (gộp «vàng» cũ, LUAT «Ghép với hiện trạng» mục 2). Số đọc từ /hs/thuong; thiếu trường ⇒ khối ẩn, không bịa số.
// Hiệu ứng: D1 tinh thể bay theo đường cong tới bộ đếm · D2 rương lắc 3 nhịp, bật nắp, tinh thể phun ra · H1 tinh thể mờ dần bốc hơi, bộ đếm giảm,
// Bi «ngu» thức dậy rồi buồn · H4 đồng xu tinh thể nứt đôi. Công tắc «thăng hoa» tắt ⇒ khối / màn thăng hoa ẩn.
import { useRef, useState, type CSSProperties } from 'react'
import { BookOpen, Check, ChevronRight, Clock, FlaskConical, Lock, Sparkles, Target, Wrench, Zap } from 'lucide-react'
import { Bi } from '../linh-vat/Bi'
import { bayToi, bungHat, demSo, hoatAnh, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { CHU_DA_MUA_TUAN, chuGiaBinh, giaBinh, moRuong, vongMucTieu, type NhiemVu, type ThongBao, type TongQuanThuong } from '../../lib/thuong-api'
import { Binh, IcTinhThe, Ruong } from './hinh'
import { SoDem } from './SoDem'
import { capNhatTongQuan, useTongQuan } from './dung-thuong'
import { Cho, DemTT, Loi, ManToan, NutDay, chuGioPhut, oTinhThe, phutToiNuaDem, useHieuUng, useToast } from './chung'
import { DauVe, TheCuoc, useMuaThuong } from './ManChuoi'

const MUC_TIEU_TT = 5
/** Biểu tượng + màu theo kiểu nhiệm vụ (bộ mẫu 6 kiểu của LUAT). */
function kieuNv(nv: NhiemVu): [typeof BookOpen, string] {
  if (nv.xong) return [Check, 'dung']
  const m = nv.ma + ' ' + nv.ten.toLowerCase()
  if (/chuoi|chuỗi/.test(m)) return [Zap, 'lua']
  if (/kho|khó/.test(m)) return [Target, 'tin']
  if (/sua|sửa/.test(m)) return [Wrench, 'sai']
  if (/hoan|hoàn hảo/.test(m)) return [Sparkles, 'sao']
  if (/truoc|trước|20:00/.test(m)) return [Clock, 'tin']
  return [BookOpen, 'sao']
}
export function DongNhiemVu({ nv, id }: { nv: NhiemVu; id?: string }) {
  const [Ic, sac] = kieuNv(nv)
  const p = Math.round((100 * Math.min(nv.tien, nv.can)) / nv.can)
  return <div className="tp-nv" id={id} data-xong={nv.xong || undefined} aria-label={`${nv.ten}: ${nv.tien}/${nv.can}${nv.xong ? ', đã xong' : ''}, thưởng ${nv.thuong} tinh thể`}>
    <span className="tp-o" data-sac={sac}><Ic aria-hidden="true" /></span>
    <div className="giua"><b>{nv.ten}</b>
      <div className="hang-nv"><div className="tp-thanh" data-sac={nv.xong ? undefined : sac === 'tin' ? 'tin' : 'sao'} style={{ '--p': `${p}%` } as CSSProperties}><i /></div><small>{nv.tien}/{nv.can}</small></div></div>
    <span className="thuong">+{nv.thuong} <IcTinhThe /></span>
  </div>
}

/** Màn Nhiệm vụ hôm nay (tp-9). */
export function ManNhiemVu({ token, onVe, hieuUng }: { token?: string; onVe?: () => void; hieuUng?: 'ruong' }) {
  const { du: tq, tai, loi, thuLai } = useTongQuan(token)
  const [dangMo, setDangMo] = useState(false)
  const [moXong, setMoXong] = useState(false)
  const [toast, bao] = useToast()
  const ruong = useRef<HTMLSpanElement>(null)
  const chayRuong = async () => {
    const r = ruong.current
    phanHoiThuong('ruong')
    hoatAnh(r, [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0)' }], 600)
    hoatAnh(r?.querySelector('.tp-ruong-nap'), [{ transform: 'none' }, { transform: 'none', offset: 0.55 }, { transform: 'translate(0px,-20px) rotate(-24deg)', offset: 0.8 }, { transform: 'translate(0px,-14px) rotate(-16deg)' }], 1000, { e: 'ease-out' })
    hoatAnh(r?.querySelector('.tp-ruong-trong'), [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], 1000)
    setTimeout(() => bungHat(r, { n: 16, r: 90, roi: -20, mau: ['tt', 'sao', 'trang'] }), 650)
    await new Promise((x) => setTimeout(x, 950))
    await bayToi(r, oTinhThe(), { n: 8, d: 700 })
  }
  useHieuUng(() => { if (hieuUng === 'ruong') void chayRuong() }, [hieuUng])
  if (!tq) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho /> : <Loi chu={loi || 'Chưa xem được nhiệm vụ.'} onThuLai={thuLai} />}</div>
  const nv = tq.nhiemVu ?? []
  const soXong = nv.filter((x) => x.xong).length
  const r = tq.ruong, mt = vongMucTieu(tq.mucTieu)
  const mo = !!r?.mo || moXong
  const duMo = nv.length > 0 && soXong === nv.length
  const datMt = !!mt?.dat
  const daNhan = nv.filter((x) => x.xong).reduce((s, x) => s + x.thuong, 0) + (datMt ? MUC_TIEU_TT : 0) + (mo && r ? r.thuong : 0)
  const conLai = nv.filter((x) => !x.xong).reduce((s, x) => s + x.thuong, 0) + (mt && !datMt ? MUC_TIEU_TT : 0) + (!mo && r ? r.thuong : 0)
  const moRuongNgay = async () => {
    if (!token || dangMo) return
    setDangMo(true)
    const kq = await moRuong(token)
    setDangMo(false)
    if (!kq.ok) return bao(kq.chu)
    setMoXong(true)
    await chayRuong()
    void capNhatTongQuan(token)
  }
  return <div className="tp-goc tp-vo" data-man="nhiem-vu">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div className="tp-luoi2">
      <div className="c">
        <div className="tp-dau"><h1 className="tp-tieu">Nhiệm vụ hôm nay</h1><span className="day tp-mo">nhiệm vụ mới sau {chuGioPhut(phutToiNuaDem())}</span></div>
        {nv.length === 0 ? <div className="tp-trong"><b>Nhiệm vụ hôm nay đang được chuẩn bị</b><span>Em cứ học bài, nhiệm vụ sẽ hiện ở đây.</span></div>
          : nv.map((x, i) => <DongNhiemVu key={x.ma} nv={x} id={`tp-nv-${i}`} />)}
        {r && nv.length > 0 && <section className="tp-the" aria-label="Rương ngày">
          <div className="tp-ruong-the"><span ref={ruong}><Ruong mo={mo} /></span>
            <div className="giua">
              {mo ? <><b style={{ color: 'var(--tp-tt-chu)' }}>Rương đã mở · +{r.thuong} <IcTinhThe /></b><span className="tp-mo">Hẹn em mai với {nv.length} nhiệm vụ mới.</span></>
                : <><b>Rương ngày</b><span className="tp-mo">Xong cả {nv.length} nhiệm vụ để mở rương{'\u00a0'}· +{r.thuong}{'\u00a0'}<IcTinhThe /></span></>}
              <div className="tp-ba-cham" role="img" aria-label={`Đã xong ${soXong}/${nv.length} nhiệm vụ`}>{nv.map((x) => <i key={x.ma} data-x={x.xong || undefined} />)}</div>
              {!mo && duMo && token && <button type="button" className="tp-nut" data-sac="tt" disabled={dangMo} onClick={() => void moRuongNgay()}>Mở rương · +{r.thuong} <IcTinhThe /></button>}
            </div></div>
        </section>}
      </div>
      <div className="c">
        <section className="tp-the" aria-label="Tinh thể hôm nay">
          <h2>Tinh thể hôm nay</h2>
          <div className="tp-tong-nv"><span>Đã nhận</span><b>+{daNhan} <IcTinhThe /></b>{conLai > 0 && <><span>· còn có thể nhận</span><b>+{conLai} <IcTinhThe /></b></>}</div>
          {conLai > 0 && <p className="tp-phu" style={{ fontSize: 13.5 }}>Còn lại: {[nv.length - soXong > 0 && `${nv.length - soXong} nhiệm vụ (+${nv.filter((x) => !x.xong).reduce((s, x) => s + x.thuong, 0)})`,
            mt && !datMt && `mục tiêu ngày ${mt.can} ${mt.donVi} (+${MUC_TIEU_TT})`, !mo && r && `rương (+${r.thuong})`].filter(Boolean).join(', ')}.</p>}
        </section>
        {mt && <section className="tp-the" aria-label="Mục tiêu ngày">
          <div className="tp-dong"><span className="tp-o" data-sac={datMt ? 'sao' : undefined}><Target aria-hidden="true" /></span>
            <div className="giua"><b>Mục tiêu ngày · {mt.da}/{mt.can} {mt.donVi}</b><span>{datMt ? `${mt.donVi === 'câu' ? 'Đủ mức' : 'Đã đạt'} · +${MUC_TIEU_TT} tinh thể` : `Thêm ${mt.can - mt.da} ${mt.donVi} nữa là đạt, nhận +${MUC_TIEU_TT} tinh thể`}</span></div></div>
        </section>}
        <section className="tp-the" aria-label="Các nhiệm vụ có thể ra">
          <h2>Mỗi ngày rút 3 trong 6 kiểu</h2>
          <div className="tp-mau-nv">{['Xong N chặng', 'Chuỗi đúng 5 câu', 'Đúng 2 câu khó', 'Sửa 2 lỗi cũ', 'Chặng hoàn hảo', 'Học trước 20:00'].map((x) => <span key={x}>{x}</span>)}</div>
        </section>
      </div>
    </div>
    {toast}
  </div>
}

/** Màn Cửa hàng tinh thể (tp-10). */
export function ManCuaHang({ token, onVe, onPhuKien }: { token?: string; onVe?: () => void; onPhuKien?: () => void }) {
  const { du: tq, tai, loi, thuLai } = useTongQuan(token)
  const m = useMuaThuong(token)
  if (!tq) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho /> : <Loi chu={loi || 'Chưa xem được tinh thể.'} onThuLai={thuLai} />}</div>
  const c = tq.chuoiNgay
  const day = !!c && c.giuChuoi >= c.sucChua
  const gia = giaBinh(tq), daMuaTuan = tq.binh?.daMuaTuan === true
  const du = tq.tinhThe === undefined || tq.tinhThe >= gia
  return <div className="tp-goc tp-vo" data-man="cua-hang">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div className="tp-luoi2">
      <div className="c">
        {tq.tinhThe !== undefined && <div className="tp-so-du tp-tren-mau" role="img" aria-label={`Em có ${tq.tinhThe} tinh thể`}><IcTinhThe /><div><b><SoDem gt={tq.tinhThe} /></b><span>tinh thể của em</span></div></div>}
        {c && <section className="tp-the" aria-label="Bình giữ chuỗi">
          <div className="tp-mon"><span className="hinh" id="tp-binh-mua"><Binh kieu={c.giuChuoi > 0 ? 'day' : 'trong'} /></span>
            <div className="giua"><b>Bình giữ chuỗi</b><span><b>{chuGiaBinh(gia)}</b></span>
              <span>Lỡ một ngày, bình tự đỡ để chuỗi không tắt. Em đang mang {c.giuChuoi}/{c.sucChua} bình.</span>
              {!day && daMuaTuan && <span className="tp-mo">{CHU_DA_MUA_TUAN}</span>}
              {!day && !daMuaTuan && !du && <span className="tp-mo">Cần {gia} tinh thể — em đang có {tq.tinhThe}.</span>}</div></div>
          {token && <button type="button" className="tp-nut-lon" data-sac={daMuaTuan && !day ? 'tat' : 'tt'} disabled={day || daMuaTuan || !du || m.dang !== ''} onClick={() => void m.mua('tp-binh-mua')}>
            {day ? `Đã mang đủ ${c.sucChua} bình` : daMuaTuan ? 'Tuần này em đã mua' : `Mua 1 bình · ${gia} tinh thể`}</button>}
        </section>}
        <TheCuoc tq={tq} dangGui={m.dang === 'cuoc'} onCuoc={token ? () => void m.cuoc() : undefined} />
        {onPhuKien && <section className="tp-the" aria-label="Phụ kiện cho thú">
          <div className="tp-mon"><span className="hinh"><span className="tp-o" data-sac="sao" style={{ width: 52, height: 52 }}><Sparkles aria-hidden="true" /></span></span>
            <div className="giua"><b>Phụ kiện cho thú</b><span>Mũ, áo, kính cho thú của em ở Đảo thần thú. Vẫn mua bằng tinh thể như trước.</span></div></div>
          <div><button type="button" className="tp-nut" onClick={onPhuKien}>Xem phụ kiện<ChevronRight size={18} aria-hidden="true" /></button></div>
        </section>}
      </div>
      <div className="c">
        {tq.bat.thangHoa && <section className="tp-the tp-thang-hoa" aria-label="Thăng hoa">
          <div className="hang-th"><span className="tp-o" data-sac="tin"><FlaskConical aria-hidden="true" /></span><div><h2>Thăng hoa là gì?</h2>
            <p className="tp-phu" style={{ fontSize: 14 }}>Như iodine rắn hoá hơi khi đun: <b>2 ngày liền</b> em không xong chặng nào và không có bình giữ chuỗi thì <b>10% tinh thể</b> bay hơi mất (ít nhất 5, nhiều nhất 50).</p></div></div>
          <p className="tp-phu" style={{ fontSize: 13.5 }}>Mang sẵn 1 bình giữ chuỗi là tinh thể không thăng hoa.</p>
        </section>}
        <section className="tp-the" aria-label="Cách kiếm tinh thể">
          <h2>Cách kiếm tinh thể</h2>
          <div className="tp-kiem">
            <div><span>Mỗi nhiệm vụ ngày</span><b>+5 – 10 <IcTinhThe /></b></div>
            <div><span>Rương ngày (đủ 3 nhiệm vụ)</span><b>+15 <IcTinhThe /></b></div>
            <div><span>Đạt mục tiêu ngày</span><b>+5 <IcTinhThe /></b></div>
            <div><span>Mốc chuỗi 7 / 30 / 100 ngày</span><b>+10 / 30 / 100 <IcTinhThe /></b></div>
            {tq.bat.giai && <div><span>Lên hạng giải tuần</span><b>+20 – 60 <IcTinhThe /></b></div>}
            {tq.bat.kimCuong && <div><span>Thử thách Kim cương</span><b>+40 <IcTinhThe /></b></div>}
          </div>
        </section>
      </div>
    </div>
    {m.toast}
  </div>
}

/** Màn phủ Thăng hoa (tp-11) — thông báo `thang_hoa` {mat, conLai}. Không chặn học. */
/** Thông báo MỘT lần (27/10, thầy duyệt): tinh thể của mọi em đặt lại về cùng mức (`duLieu.conLai`, vd 50) theo luật bình mới; lượt cược đang chạy
 *  dừng (`duLieu.cuocHuy`). Trung tính, không nói số cũ, không so với bạn. */
export function ManDatLaiTinhThe({ tb, onHoc, onDong }: { tb: ThongBao; onHoc?: () => void; onDong: () => void }) {
  const con = typeof tb.duLieu.conLai === 'number' ? Math.max(0, Math.round(tb.duLieu.conLai)) : undefined
  const cuocHuy = tb.duLieu.cuocHuy === true
  if (con === undefined) return null
  return <ManToan nhan="Tinh thể đặt lại theo luật mới" onDong={onDong} demTT={<DemTT gt={con} />}
    day={<><NutDay chu="Học chặng hôm nay" onClick={onHoc ?? onDong} /><NutDay chu="Đã hiểu" phu onClick={onDong} /></>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh"><span className="tp-xu" style={{ width: 96, height: 96 }} aria-hidden="true"><IcTinhThe /></span>
          <div className="bi-o"><Bi cam="vui" size={90} /></div></div>
        <h1>Tinh thể đã đặt lại theo luật mới</h1>
        <p className="tp-phu">Từ 27/10, mọi bạn bắt đầu lại với <b>{con} tinh thể</b>. Học chặng, xong nhiệm vụ ngày để kiếm thêm nhé.</p>
      </div>
      <div className="cot-b"><section className="tp-the" aria-label="Luật mới">
        <div className="tp-dong"><span className="tp-o" data-sac="bang"><FlaskConical aria-hidden="true" /></span><div className="giua"><b>Bình giữ chuỗi</b><span>{chuGiaBinh(giaBinh())}</span></div></div>
        {cuocHuy && <div className="tp-dong"><span className="tp-o" data-sac="sao"><Lock aria-hidden="true" /></span><div className="giua"><b>Lượt cược chuỗi đã dừng</b><span>em cược lại khi sẵn sàng</span></div></div>}
      </section></div>
    </main>
  </ManToan>
}

export function ManThangHoa({ tb, onHoc, onDong }: { tb: ThongBao; onHoc?: () => void; onDong: () => void }) {
  const mat = typeof tb.duLieu.mat === 'number' ? Math.max(0, Math.round(tb.duLieu.mat)) : undefined
  const con = typeof tb.duLieu.conLai === 'number' ? Math.max(0, Math.round(tb.duLieu.conLai)) : undefined
  const truoc = mat !== undefined && con !== undefined ? mat + con : undefined
  const ngu = useRef<HTMLDivElement>(null), buon = useRef<HTMLDivElement>(null), hinh = useRef<HTMLDivElement>(null), hoi = useRef<HTMLSpanElement>(null)
  useHieuUng((h) => {
    phanHoiThuong('thangHoa')
    hoatAnh(ngu.current, [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: 'none', offset: 0.45 }, { opacity: 1, transform: 'translateY(-10px) rotate(-4deg)', offset: 0.6 }, { opacity: 0, transform: 'none' }], 1400, { fill: 'forwards' })
    hoatAnh(buon.current, [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], 1400)
    const r = hinh.current?.getBoundingClientRect()
    if (r) for (let i = 0; i < 6; i++) bungHat([r.left + r.width * (0.2 + i * 0.12), r.top + r.height * 0.6], { n: 2, r: 30, roi: -110, d: 1200, mau: ['tt'], tre: i * 60 })
    hoatAnh(hoi.current, [{ opacity: 0, transform: 'translateY(20px) scale(.6)' }, { opacity: 1, transform: 'translateY(-10px) scale(1.2)', offset: 0.6 }, { opacity: 1, transform: 'none' }], 1300)
    const dem = document.querySelector<HTMLElement>('.tp-toan .tp-dem-tt .tp-so')
    if (dem && truoc !== undefined && con !== undefined) h.sau(400, () => { void demSo(dem, truoc, con, 900); hoatAnh(dem.parentElement, [{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1)' }], 900) })
  }, [])
  if (mat === undefined) return null
  return <ManToan nhan="Tinh thể thăng hoa" onDong={onDong} demTT={con !== undefined ? <DemTT gt={con} /> : undefined}
    day={<><NutDay chu="Học ngay" onClick={onHoc ?? onDong} /><NutDay chu="Để sau" phu onClick={onDong} /></>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div ref={hinh} className="tp-hinh">
          <span ref={hoi} className="tp-hoi" aria-hidden="true"><i style={{ left: '30%', top: 30 }} /><i style={{ left: '55%', top: 10, width: 34, height: 34 }} /><i style={{ left: '44%', top: 44, width: 18, height: 18 }} /></span>
          <div ref={ngu} style={{ gridArea: '1 / 1', opacity: 0, zIndex: 2 }}><Bi cam="ngu" size={130} /></div>
          <div ref={buon} style={{ gridArea: '1 / 1', zIndex: 2 }}><Bi cam="sai" size={130} /></div>
        </div>
        <h1>{mat} tinh thể đã thăng hoa</h1>
        <p className="tp-phu">2 ngày liền em chưa xong chặng nào, và không có bình giữ chuỗi.</p>
        {truoc !== undefined && <div className="tp-doi" role="img" aria-label={`Số dư từ ${truoc} còn ${con} tinh thể`}>
          <div data-cu=""><span>Trước</span><b>{truoc}</b></div><ChevronRight aria-hidden="true" /><div data-moi=""><span>Còn lại</span><b><IcTinhThe />{con}</b></div>
        </div>}
      </div>
      <div className="cot-b">
        <section className="tp-the" aria-label="Vì sao">
          <div className="tp-dong"><span className="tp-o" data-sac="tin"><FlaskConical aria-hidden="true" /></span><div className="giua"><b>Thăng hoa = 10% số tinh thể</b><span>ít nhất 5, nhiều nhất 50{truoc !== undefined ? ` · 10% của ${truoc} là ${mat}` : ''}</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="bang"><Lock aria-hidden="true" /></span><div className="giua"><b>Lần sau mang sẵn bình giữ chuỗi</b><span>có bình thì tinh thể không thăng hoa · {chuGiaBinh(giaBinh())}</span></div></div>
          <div className="tp-dong"><span className="tp-o" data-sac="sao"><Zap aria-hidden="true" /></span><div className="giua"><b>Làm đủ mức hôm nay</b><span>ngọn lửa chuỗi cháy lại từ hôm nay</span></div></div>
        </section>
      </div>
    </main>
  </ManToan>
}

/** Màn phủ kết quả cược chuỗi (thông báo `cuoc` {ketQua: 'thang'|'thua', tinhThe}) — H4 đồng xu tinh thể nứt đôi khi thua. */
export function ManCuocKetQua({ tb, tq, onDong }: { tb: ThongBao; tq: TongQuanThuong; onDong: () => void }) {
  const thang = tb.duLieu.ketQua === 'thang'
  const so = typeof tb.duLieu.tinhThe === 'number' ? Math.abs(Math.round(tb.duLieu.tinhThe)) : thang ? 100 : 50
  const xu = useRef<HTMLSpanElement>(null), bi = useRef<HTMLDivElement>(null)
  useHieuUng((h) => {
    const x = xu.current
    if (thang) {
      phanHoiThuong('lenHang')
      hoatAnh(x, [{ transform: 'scale(.4) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1.2) rotate(6deg)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 700)
      h.sau(500, () => bungHat(x, { n: 14, r: 90, mau: ['tt', 'sao', 'trang'] }))
      h.sau(900, () => void bayToi(x, oTinhThe(), { n: 8 }))
      return
    }
    phanHoiThuong('cuocThua')
    const tt = x?.querySelector('.tp-dv')
    hoatAnh(tt, [{ transform: 'none' }, { transform: 'translateX(-2px) rotate(-6deg)', offset: 0.2 }, { transform: 'translate(-14px,30px) rotate(-30deg)', opacity: 0 }], 700, { e: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' })
    h.sau(200, () => bungHat(x, { n: 6, r: 30, co: 6, mau: ['tt', 'chu3'] }))
    hoatAnh(bi.current, [{ transform: 'translateY(-10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500, { tre: 300 })
  }, [])
  return <ManToan nhan="Kết quả cược chuỗi" onDong={onDong} demTT={tq.tinhThe !== undefined ? <DemTT gt={tq.tinhThe} /> : undefined}
    day={<NutDay chu={thang ? `Nhận ${so} tinh thể` : 'Tiếp tục'} sac={thang ? 'tt' : undefined} onClick={onDong} />}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh"><span ref={xu} className="tp-xu" style={{ width: 96, height: 96 }} aria-hidden="true"><IcTinhThe /></span>
          <div ref={bi} className="bi-o"><Bi cam={thang ? 'mung' : 'sai'} size={90} /></div></div>
        <h1>{thang ? `Thắng cược! +${so} tinh thể` : 'Cược chuỗi chưa thành'}</h1>
        <p className="tp-phu">{thang ? 'Em giữ chuỗi đủ 7 ngày. Tinh thể đã vào ví của em.' : `Chuỗi đứt trong 7 ngày nên ${so} tinh thể đã cược không về. Em cược lại khi sẵn sàng nhé.`}</p>
      </div>
      <div className="cot-b"><section className="tp-the"><p className="tp-phu">Cược chuỗi: đặt 50 tinh thể, giữ chuỗi đủ 7 ngày nhận về 100. Mỗi lúc chỉ cược 1 lượt.</p></section></div>
    </main>
  </ManToan>
}
