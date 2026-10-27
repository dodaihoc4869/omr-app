// CHUỖI NGÀY (bản vẽ tp-5) · CỨU CHUỖI (tp-6) · BÌNH ĐÃ ĐỠ (tp-18) — thầy chốt 26/10. Chỉ ĐỌC trường `chuoiNgay` của /hs/thuong (hợp đồng 4.3, máy chủ B3).
// Luật in đúng 3 câu (LUAT «Bổ sung 26/10»). Mua bình / cược = lệnh ghi có khoá chống lặp ở máy chủ; ở đây chặn bấm lặp khi đang gửi.
// Hiệu ứng: C1 số lật + lửa bùng + ô hôm nay tô cam lan ra + Bi «lua» nhảy (`hieuUng='chuoi'`, host bật sau bài đầu tiên trong ngày) · C2 mốc chuỗi
// (`hieuUng='moc'`) · C3 nắp bình đóng, hơi lạnh, ô hoá xanh băng (tp-18 / `hieuUng='binh'`) · C4 lửa leo lét + đồng hồ đếm ngược, cứu xong lửa bùng lại.
// Thiếu trường ⇒ khối ẩn; không bịa số. Màn học sinh: không nhãn đánh giá nào.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Check, Flame } from 'lucide-react'
import { Bi } from '../linh-vat/Bi'
import { bayToi, bungHat, hoatAnh, latSo, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import { DAT_CUOC, DUONG, GIA_BINH, MOC_CHUOI, datCuoc, layDsBan, muaBinh, ngayVn, type ChuoiNgay, type ThongBao, type TongQuanThuong } from '../../lib/thuong-api'
import { Binh, HuyHieuMau, IcLua, IcTinhThe, Tia } from './hinh'
import { capNhatTongQuan, useTai, useTongQuan } from './dung-thuong'
import { ChuGiaiTuan, Cho, chuCai, DemTT, Loi, ManToan, NutDay, ThangLich, TuanBay, dongHo, gioVn, ngayNgan, oTinhThe, thuNgayVn, useHieuUng, useToast } from './chung'

export const LUAT_CHUOI = [
  'Mỗi ngày xong ít nhất 1 chặng để giữ chuỗi.',
  'Lỡ một ngày? Bình giữ chuỗi tự đỡ cho em. Em mang được tối đa 2 bình.',
  'Hết bình? Học bù 2 chặng trong 24 giờ là cứu được chuỗi.',
] as const

export function DauVe({ onVe, chu = 'Quay lại' }: { onVe?: () => void; chu?: string }) {
  return onVe ? <div><button type="button" className="tp-nut-chu" onClick={onVe}><ArrowLeft size={18} aria-hidden="true" />{chu}</button></div> : null
}

/** Ba khe bình (khe 3 mở ở mốc 100 ngày). */
function KheBinh({ c, tinhThe, dangMua, onMua, idDay }: { c: ChuoiNgay; tinhThe?: number; dangMua: boolean; onMua?: () => void; idDay?: string }) {
  const so = Math.max(3, c.sucChua)
  return <div className="tp-khe">
    {Array.from({ length: so }, (_, i) => {
      if (i >= c.sucChua) return <div key={i} data-k="khoa"><Binh kieu="khoa" /><b>Khe thứ {i + 1}</b><small>mở ở mốc 100 ngày</small></div>
      if (i < c.giuChuoi) return <div key={i} data-k="day" id={i === c.giuChuoi - 1 ? idDay : undefined}><Binh kieu="day" /><b>Sẵn sàng</b><small>tự đỡ khi em lỡ ngày</small></div>
      const du = tinhThe === undefined || tinhThe >= GIA_BINH
      return <div key={i} data-k="trong"><Binh kieu="trong" /><b>Khe trống</b>
        {onMua && i === c.giuChuoi ? <button type="button" className="tp-nut" data-sac={du ? undefined : 'tat'} disabled={!du || dangMua} onClick={onMua} aria-label={`Mua 1 bình giữ chuỗi, ${GIA_BINH} tinh thể`}>
          <IcTinhThe />Mua {GIA_BINH}</button> : <small>{du ? `mua ${GIA_BINH} tinh thể` : `cần ${GIA_BINH} tinh thể`}</small>}
      </div>
    })}
  </div>
}

function TheMoc({ so }: { so: number }) {
  const ke = MOC_CHUOI.find((m) => m.so > so)
  return <section className="tp-the" aria-label="Mốc chuỗi">
    <h2>Mốc chuỗi</h2>
    <div className="tp-moc" role="list">
      {MOC_CHUOI.map((m) => <div key={m.so} role="listitem" data-k={so >= m.so ? 'xong' : m === ke ? 'ke' : undefined} aria-label={`Mốc ${m.so} ngày: ${m.thuong}${so >= m.so ? ', đã đạt' : ''}`}>
        <span className="hx" data-moc={m.so}>{m.so}</span><b>{m.so} ngày</b>
        <small>{m.tt ? <><span className="tp-moc-nw">+{m.tt} <IcTinhThe /></span>{m.so === 30 ? <span className="tp-moc-nw">1 bình</span> : m.so === 100 ? <span className="tp-moc-nw">khe 3</span> : null}</> : m.thuong}</small>
      </div>)}
    </div>
    {ke && <>
      <div className="tp-moc-ke"><div className="giua"><b>Còn {ke.so - so} ngày tới mốc {ke.so}</b>
        <span>{ke.so === 30 ? 'huy hiệu + 30 tinh thể + 1 bình giữ chuỗi' : ke.so === 100 ? 'huy hiệu + 100 tinh thể + mang được 3 bình' : ke.so === 365 ? 'huy hiệu «Câu lạc bộ 365»' : ke.so === 50 ? 'rương lớn' : 'huy hiệu + 10 tinh thể'}</span></div>
        <b>{so}/{ke.so}</b></div>
      <div className="tp-thanh" data-sac="sao" style={{ '--p': `${Math.round((100 * so) / ke.so)}%` } as CSSProperties} role="progressbar" aria-label={`Tới mốc ${ke.so} ngày`} aria-valuemin={0} aria-valuemax={ke.so} aria-valuenow={so}><i /></div>
    </>}
  </section>
}

/** Thẻ cược chuỗi (đang cược ⇒ tiến độ 7 ngày; chưa ⇒ lời mời, nút phụ). */
export function TheCuoc({ tq, dangGui, onCuoc, nutChinh }: { tq: TongQuanThuong; dangGui: boolean; onCuoc?: () => void; nutChinh?: boolean }) {
  const c = tq.cuoc
  if (c) return <section className="tp-the" aria-label="Cược chuỗi">
    <div className="tp-mon"><span className="hinh tp-xu" id="tp-xu"><IcTinhThe /></span>
      <div className="giua"><div className="tp-mon-chan"><b>Cược chuỗi</b><span className="tp-chip-tt">đã đặt {c.dat} <IcTinhThe /></span></div>
        <span>Đang cược · ngày {c.ngay}/7. {c.ngay < 7 ? `Giữ chuỗi thêm ${7 - c.ngay} ngày nữa, em nhận về ${c.dat * 2} tinh thể.` : `Giữ chuỗi hết hôm nay, em nhận về ${c.dat * 2} tinh thể.`}</span>
        <div className="tp-cuoc7" role="img" aria-label={`Ngày ${c.ngay}/7`}>{Array.from({ length: 7 }, (_, i) => <i key={i} data-x={i < c.ngay || undefined} data-nay={i === c.ngay - 1 || undefined} id={i === c.ngay - 1 ? 'tp-cuoc-nay' : undefined}>{i + 1}</i>)}</div>
        <span className="tp-mo">Đứt chuỗi trong 7 ngày (kể cả dùng bình) thì mất {c.dat} đã cược. Mỗi lúc chỉ cược 1 lượt.</span></div></div>
  </section>
  const du = tq.tinhThe === undefined || tq.tinhThe >= DAT_CUOC
  return <section className="tp-the" aria-label="Cược chuỗi">
    <div className="tp-mon"><span className="hinh tp-xu"><IcTinhThe /></span>
      <div className="giua"><b>Cược chuỗi 7 ngày</b><span>Đặt {DAT_CUOC} tinh thể. Giữ chuỗi đủ 7 ngày nhận về {DAT_CUOC * 2}. Đứt chuỗi (kể cả dùng bình) thì mất {DAT_CUOC} đã cược.</span>
        {!du && <span className="tp-mo">Cần {DAT_CUOC} tinh thể — em đang có {tq.tinhThe}.</span>}</div></div>
    {onCuoc && (nutChinh
      ? <button type="button" className="tp-nut-lon" data-sac="tt" disabled={!du || dangGui} onClick={onCuoc}>Cược {DAT_CUOC} tinh thể</button>
      : <div><button type="button" className="tp-nut" data-sac={du ? 'tt' : 'tat'} disabled={!du || dangGui} onClick={onCuoc}><IcTinhThe />Cược {DAT_CUOC} tinh thể</button></div>)}
  </section>
}

/** Mua bình / đặt cược dùng chung (Chuỗi ngày, Cửa hàng, Bình đã đỡ). */
export function useMuaThuong(token: string | undefined) {
  const [dang, setDang] = useState<'' | 'binh' | 'cuoc'>('')
  const [toast, bao] = useToast()
  const mua = async (dich?: string) => {
    if (!token || dang) return
    setDang('binh')
    const r = await muaBinh(token)
    setDang('')
    if (!r.ok) return bao(r.chu)
    phanHoiThuong('mua')
    const toi = dich ? document.getElementById(dich) : null
    await bayToi(oTinhThe(), toi, { n: 6, d: 650 })
    hoatAnh(toi, [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'none' }], 400)
    bungHat(toi, { n: 10, r: 50, tron: true, mau: ['bang', 'trang'] })
    bao('Đã mua 1 bình giữ chuỗi.')
    void capNhatTongQuan(token)
  }
  const cuoc = async () => {
    if (!token || dang) return
    setDang('cuoc')
    const r = await datCuoc(token, DAT_CUOC)
    setDang('')
    if (!r.ok) return bao(r.chu)
    phanHoiThuong('combo', 2)
    bao(`Đã đặt cược ${DAT_CUOC} tinh thể. Giữ chuỗi 7 ngày nhé!`)
    await capNhatTongQuan(token)
    const n = document.getElementById('tp-cuoc-nay')
    hoatAnh(n, [{ transform: 'scale(0)' }, { transform: 'scale(1.3)' }, { transform: 'none' }], 450)
    bungHat(n, { n: 8, r: 40, co: 7, mau: ['lua', 'sao'] })
  }
  return { dang, toast, mua, cuoc, bao }
}

export interface PropsManChuoi { token?: string; onVe?: () => void; onHoc?: () => void; onCuu?: () => void; hieuUng?: 'chuoi' | 'binh' | 'moc'
  /** Mở màn Học cùng bạn (khối «Lửa đôi»). Không truyền ⇒ khối chỉ để xem. */
  onBan?: () => void }

const CHU_DOI = { ca_hai: 'hôm nay cả hai đã xong', ban_chua: 'bạn chưa học hôm nay', em_chua: 'bạn đã học · chờ em 1 chặng', ca_hai_chua: 'cả hai chưa học hôm nay' } as const
/** Khối «Lửa đôi» (27/10): bạn học cùng + số lửa đôi — cùng dữ liệu, cùng cách gọi tên của màn Học cùng bạn (/hs/ban, bản gần nhất ở máy trước). Bấm ⇒ mở
 *  Học cùng bạn. Chưa có bạn ⇒ một dòng mời. Công tắc «bạn bè» tắt ⇒ ẩn hẳn. Không điểm / nguyên tử của bạn. */
function KhoiLuaDoi({ token, bat, onBan }: { token?: string; bat?: boolean; onBan?: () => void }) {
  const { du: ds } = useTai(token, DUONG.ban, layDsBan, !!token && bat !== false)
  if (bat !== true || !ds || ds.tat) return null
  const nhan = ds.ban.length ? `Lửa đôi với ${ds.ban.length} bạn` : 'Chưa có bạn học cùng'
  const ruot = ds.ban.length ? ds.ban.map((b, i) => <div key={b.ma} className="tp-dong"><span className="tp-av" data-k={String((i % 4) + 1)} aria-hidden="true">{chuCai(b.ten)}</span>
    <div className="giua"><b>{b.ten}</b><span>Lửa đôi {b.chuoiDoi} ngày · {CHU_DOI[b.homNay]}</span></div></div>)
    : <div className="tp-dong"><span className="tp-av" data-k="2" aria-hidden="true">+</span><div className="giua"><b>Học cùng bạn để giữ lửa đôi</b><span>Cả hai cùng xong 1 chặng mỗi ngày thì lửa đôi tăng</span></div></div>
  return <section className="tp-the" aria-label="Lửa đôi">
    <h2>Lửa đôi</h2>
    {onBan ? <button type="button" className="tp-the-nut" aria-label={`${nhan} — mở Học cùng bạn`} onClick={onBan}>{ruot}</button> : ruot}
  </section>
}

function TheCuuNho({ c, onCuu }: { c: ChuoiNgay; onCuu?: () => void }) {
  const cu = c.cuu!
  return <section className="tp-the" aria-label="Cứu chuỗi">
    <div className="tp-dau"><span className="tp-o" data-sac="sao"><Flame size={22} aria-hidden="true" /></span><h2>{cu.so ? `Cứu chuỗi ${cu.so} ngày` : 'Cứu chuỗi'}</h2></div>
    <p className="tp-phu">Học bù {cu.can} chặng trước {gioVn(cu.hetHan)} {thuNgayVn(cu.hetHan)} · đã xong {cu.daLam}/{cu.can}.</p>
    {onCuu && <div><button type="button" className="tp-nut" data-sac="chinh" onClick={onCuu}>Xem cách cứu chuỗi</button></div>}
  </section>
}

/** Lịch chuỗi: có `lich30` (máy chủ /hs/thuong) ⇒ mặc định «Tháng» như bản vẽ tp-5, một chạm đổi «Tuần»; không có ⇒ chỉ lịch tuần. */
function TheLich({ c, homNay }: { c: ChuoiNgay; homNay: string }) {
  const [thang, datThang] = useState(true)
  const coThang = !!c.lich30?.length
  const xemThang = coThang && thang
  return <section className="tp-the" aria-label="Lịch chuỗi">
    <div className="tp-dau"><h2>{xemThang ? '30 ngày gần nhất' : '7 ngày gần nhất'}</h2>
      {coThang && <span className="tp-xem2" role="group" aria-label="Xem lịch">
        <button type="button" aria-pressed={!xemThang} onClick={() => datThang(false)}>Tuần</button>
        <button type="button" aria-pressed={xemThang} onClick={() => datThang(true)}>Tháng</button>
      </span>}</div>
    {xemThang ? <ThangLich lich30={c.lich30!} homNay={homNay} /> : <TuanBay lich7={c.lich7} homNay={homNay} />}
    <ChuGiaiTuan />
  </section>
}

/** Màn Chuỗi ngày (tp-5). */
export function ManChuoiNgay({ token, onVe, onHoc, onCuu, hieuUng, onBan }: PropsManChuoi) {
  const { du: tq, tai, loi, thuLai } = useTongQuan(token)
  const m = useMuaThuong(token)
  const lua = useRef<HTMLSpanElement>(null), the = useRef<HTMLDivElement>(null), bi = useRef<HTMLDivElement>(null)
  const c = tq?.chuoiNgay
  useHieuUng((h) => {
    if (!c || !hieuUng) return
    if (hieuUng === 'chuoi') {
      phanHoiThuong('chuoi')
      latSo(document.getElementById('tp-so-chuoi'), String(Math.max(0, c.so - 1)), String(c.so), 560)
      hoatAnh(lua.current, [{ transform: 'scale(.6)', opacity: 0.1 }, { transform: 'scale(1.7)', opacity: 0.5, offset: 0.35 }, { transform: 'scale(.95)', opacity: 0.2, offset: 0.7 }, { transform: 'scale(1)', opacity: 0.18 }], 1400)
      hoatAnh(the.current, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)', offset: 0.3 }, { transform: 'scale(1)' }], 700, { tre: 150 })
      hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-22px) rotate(-6deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-10px) rotate(4deg)' }, { transform: 'translateY(0)' }], 900, { tre: 300 })
      h.sau(350, () => bungHat(bi.current, { n: 10, r: 70, mau: ['sao', 'lua', 'trang'] }))
      hoatAnh(document.querySelector('.tp-tuan7 [data-nay] .lan, .tp-lich30 [data-nay] .lan'), [{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.7 }, { transform: 'scale(1)' }], 600, { tre: 700 })
    } else if (hieuUng === 'binh') {
      phanHoiThuong('binh')
      const khe = document.getElementById('tp-khe-day'), nap = khe?.querySelector('.tp-binh-nap')
      hoatAnh(nap, [{ transform: 'translate(9px,-9px) rotate(28deg)' }, { transform: 'translate(0,2px) rotate(0)', offset: 0.75 }, { transform: 'none' }], 420)
      h.sau(380, () => bungHat(khe?.querySelector('.tp-binh'), { n: 12, r: 60, tron: true, mau: ['bang', 'trang'], d: 900 }))
      const o = document.querySelector('.tp-tuan7 [data-k="binh"], .tp-lich30 [data-k="binh"]')
      hoatAnh(o?.querySelector('.lan'), [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 500, { tre: 450 })
    } else {
      const moc = [...MOC_CHUOI].reverse().find((x) => c.so >= x.so)
      const el = moc ? document.querySelector(`.tp-moc [data-moc="${moc.so}"]`) : null
      if (!el) return
      phanHoiThuong('huyHieu')
      hoatAnh(el, [{ transform: 'perspective(300px) rotateY(0)' }, { transform: 'perspective(300px) rotateY(540deg) scale(1.3)', offset: 0.7 }, { transform: 'perspective(300px) rotateY(720deg)' }], 1200)
      for (let i = 0; i < 3; i++) h.sau(200 + i * 300, () => { const r = el.getBoundingClientRect(); bungHat([r.left + r.width / 2 + (i - 1) * 60, r.top - 20 - i * 14], { n: 12, r: 60, d: 700 }) })
    }
  }, [!!c, hieuUng])
  if (!tq) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} />{tai ? <Cho /> : <Loi chu={loi || 'Chưa xem được chuỗi ngày.'} onThuLai={thuLai} />}</div>
  if (!c) return <div className="tp-goc tp-vo"><DauVe onVe={onVe} /><div className="tp-trong"><b>Chuỗi ngày đang được cập nhật</b><span>Em cứ học bình thường, số sẽ hiện ở đây.</span></div></div>
  const homNay = ngayVn()
  const daHoc = c.lich7.some((x) => x.ngay.slice(0, 10) === homNay && x.kieu === 'hoc')
  return <div className="tp-goc tp-vo" data-man="chuoi">
    <DauVe onVe={onVe} />
    {loi && <Loi chu={loi} onThuLai={thuLai} />}
    <div className="tp-luoi2">
      <div className="c">
        <div ref={the} className="tp-lua-lon" role="img" aria-label={`Chuỗi ${c.so} ngày`}>
          <span ref={lua} className="lua-to" aria-hidden="true"><IcLua /></span>
          <div className="giua"><div className="so"><b className="tp-lat" id="tp-so-chuoi">{c.so}</b><span>ngày liền</span></div>
            <p>{daHoc ? 'Hôm nay đã giữ chuỗi' : c.so > 0 ? 'Học xong 1 chặng hôm nay để giữ chuỗi' : 'Học xong 1 chặng để nhóm lửa chuỗi'}</p></div>
          <div ref={bi}><Bi cam={c.so > 0 ? 'lua' : 'ngu'} size={92} /></div>
        </div>
        {c.cuu && c.cuu.daLam < c.cuu.can && <TheCuuNho c={c} onCuu={onCuu} />}
        <TheLich c={c} homNay={homNay} />
        {!daHoc && onHoc && <button type="button" className="tp-nut-lon" onClick={onHoc}>Học 1 chặng để giữ chuỗi</button>}
      </div>
      <div className="c">
        <section className="tp-the" aria-label="Bình giữ chuỗi">
          <div className="tp-dau"><h2>Bình giữ chuỗi</h2><span className="day tp-mo">đang mang {c.giuChuoi}/{c.sucChua}</span></div>
          <KheBinh c={c} tinhThe={tq.tinhThe} dangMua={m.dang === 'binh'} onMua={token ? () => void m.mua('tp-khe-day') : undefined} idDay="tp-khe-day" />
        </section>
        <section className="tp-the" aria-label="Luật chuỗi">
          <h2>Luật chuỗi</h2>
          <ol className="tp-luat">{LUAT_CHUOI.map((l, i) => <li key={i}><b>{i + 1}</b><span>{l}</span></li>)}</ol>
        </section>
        <TheMoc so={c.so} />
        <TheCuoc tq={tq} dangGui={m.dang === 'cuoc'} onCuoc={token ? () => void m.cuoc() : undefined} nutChinh={daHoc || !onHoc} />
        <KhoiLuaDoi token={token} bat={tq.bat.banBe} onBan={onBan} />
      </div>
    </div>
    {m.toast}
  </div>
}

/** Màn phủ Cứu chuỗi (tp-6). */
export function ManCuuChuoi({ chuoi, onHoc, onDong }: { chuoi: ChuoiNgay; onHoc?: () => void; onDong: () => void }) {
  const cu = chuoi.cuu
  const [bay, setBay] = useState(() => Date.now())
  const xong = !!cu && cu.daLam >= cu.can
  useEffect(() => { if (xong || !cu) return; const t = setInterval(() => setBay(Date.now()), 1000); return () => clearInterval(t) }, [xong, cu])
  const bi = useRef<HTMLDivElement>(null), lua = useRef<HTMLSpanElement>(null)
  useHieuUng((h) => {
    if (!cu) return
    if (!xong) { phanHoiThuong('chuoiTat'); hoatAnh(bi.current, [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 500); return }
    phanHoiThuong('chuoi')
    hoatAnh(document.getElementById('tp-bu-cuoi'), [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1 }, { transform: 'none', opacity: 1 }], 380)
    hoatAnh(lua.current, [{ transform: 'scale(.4) rotate(-8deg)', opacity: 0.6 }, { transform: 'scale(1.9)', opacity: 1, offset: 0.4 }, { transform: 'scale(.95)', offset: 0.75 }, { transform: 'none', opacity: 1 }], 1200, { tre: 300 })
    hoatAnh(document.querySelector('.tp-toan .tp-tia'), [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], 800, { tre: 400 })
    hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-22px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], 900, { tre: 450 })
    h.sau(600, () => bungHat(lua.current, { n: 14, r: 90, mau: ['sao', 'lua', 'sai'] }))
  }, [xong])
  if (!cu) return null
  const so = cu.so ?? chuoi.so
  return <ManToan nhan="Cứu chuỗi" onDong={onDong}
    day={xong ? <NutDay chu="Tiếp tục" onClick={onDong} /> : <><NutDay chu="Học bù ngay" sac="cam" onClick={onHoc} /><NutDay chu="Để sau" phu onClick={onDong} /></>}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh">
          {xong && <Tia className="quay" />}
          <div ref={bi}><Bi cam={xong ? 'lua' : 'sai'} size={130} /></div>
          <span ref={lua} className="tp-lua-nho" data-leo={xong ? undefined : ''} data-to={xong ? '' : undefined} aria-hidden="true"><IcLua /></span>
        </div>
        <h1 style={xong ? { color: 'var(--tr-sao-chu)' } : undefined}>{so ? (xong ? `Chuỗi ${so} ngày đã sống lại!` : `Chuỗi ${so} ngày vừa tắt`) : xong ? 'Chuỗi đã sống lại!' : 'Chuỗi ngày vừa tắt'}</h1>
        <p className="tp-phu">{xong ? `Em học bù đủ ${cu.can} chặng. Chuỗi giữ nguyên${so ? ` ${so} ngày` : ''}, không mất tinh thể.` : 'Hôm qua em chưa xong chặng nào, và đã hết bình giữ chuỗi.'}</p>
      </div>
      <div className="cot-b">
        <section className="tp-the" aria-label="Cứu chuỗi">
          <div className="tp-dau"><span className="tp-o" data-sac="sao"><Flame size={22} aria-hidden="true" /></span><h2>{so ? `Cứu chuỗi ${so} ngày` : 'Cứu chuỗi'}</h2></div>
          {!xong && <p className="tp-phu" style={{ color: 'var(--tr-chu)', fontWeight: 800 }}>Học bù {cu.can} chặng trước {gioVn(cu.hetHan)} {thuNgayVn(cu.hetHan)}</p>}
          {!xong && <div className="tp-dh"><b role="timer" aria-label={`Còn ${dongHo(cu.hetHan - bay)}`}>{dongHo(cu.hetHan - bay)}</b><span>còn lại</span></div>}
          <div className="tp-bu">
            {Array.from({ length: cu.can }, (_, i) => <span key={i} className="o" data-x={i < cu.daLam || undefined} id={i === cu.can - 1 ? 'tp-bu-cuoi' : undefined} aria-hidden="true">{i < cu.daLam ? <Check size={22} strokeWidth={3} /> : i + 1}</span>)}
            <div className="giua"><b>Chặng bù · {Math.min(cu.daLam, cu.can)}/{cu.can}</b><span>tính ngoài chặng của hôm đó</span></div>
          </div>
          <p className="tp-ghi">Không mất tinh thể. Mỗi tuần cứu được <b>1 lần</b>.</p>
        </section>
      </div>
    </main>
  </ManToan>
}

/** Màn phủ «Bình đã đỡ» (tp-18) — thông báo `binh_do` lần mở app sau ngày lỡ. Ngày vắng có phép ⇒ dấu «P», không tốn bình. */
export function ManBinhDaDo({ tb, tq, token, onHoc, onDong }: { tb: ThongBao; tq: TongQuanThuong; token?: string; onHoc?: () => void; onDong: () => void }) {
  const c = tq.chuoiNgay
  const d = tb.duLieu
  const ngay = typeof d.ngay === 'string' ? d.ngay.slice(0, 10) : c?.binhVuaDo?.slice(0, 10)
  const phep = d.phep === true || (!!ngay && c?.lich7.some((x) => x.ngay.slice(0, 10) === ngay && x.kieu === 'phep'))
  const so = typeof d.so === 'number' ? d.so : c?.so
  const m = useMuaThuong(token)
  const binh = useRef<HTMLSpanElement>(null), p = useRef<HTMLSpanElement>(null), bi = useRef<HTMLDivElement>(null)
  useHieuUng((h) => {
    const o = ngay ? document.getElementById(`tp-o-${ngay}`) : null
    if (phep) {
      hoatAnh(p.current, [{ transform: 'scale(2.2) rotate(-18deg)', opacity: 0 }, { transform: 'scale(.92) rotate(2deg)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 500)
      hoatAnh(o, [{ transform: 'scale(2) rotate(-15deg)', opacity: 0 }, { transform: 'scale(.9)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 450, { tre: 500 })
      h.sau(800, () => bungHat(o, { n: 8, r: 30, co: 5, mau: ['bang', 'sao'] }))
      return
    }
    phanHoiThuong('binh')
    const nap = binh.current?.querySelector('.tp-binh-nap')
    hoatAnh(nap, [{ transform: 'translate(10px,-16px) rotate(30deg)' }, { transform: 'translate(10px,-16px) rotate(30deg)', offset: 0.2 }, { transform: 'translate(0,3px) rotate(-3deg)', offset: 0.75 }, { transform: 'none' }], 600)
    hoatAnh(binh.current, [{ transform: 'none' }, { transform: 'none', offset: 0.6 }, { transform: 'scale(1.06,.94)', offset: 0.75 }, { transform: 'none' }], 700)
    h.sau(420, () => bungHat(binh.current, { n: 16, r: 90, tron: true, mau: ['bang', 'trang'], d: 900 }))
    hoatAnh(o?.querySelector('.lan'), [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], 500, { tre: 650 })
    h.sau(900, () => bungHat(o, { n: 8, r: 34, tron: true, co: 5, mau: ['bang', 'trang'] }))
    hoatAnh(bi.current, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], 500, { tre: 800 })
  }, [])
  const chuSo = so !== undefined ? <b style={{ color: 'var(--tr-sao-chu)' }}>{so} ngày</b> : null
  const day = <>
    <NutDay chu="Học chặng hôm nay" onClick={onHoc ?? onDong} />
    {!phep && c && c.giuChuoi < c.sucChua && token && <NutDay chu={`Mua bình · ${GIA_BINH} tinh thể`} phu tat={m.dang !== '' || (tq.tinhThe !== undefined && tq.tinhThe < GIA_BINH)} onClick={() => void m.mua('tp-binh-con')} />}
  </>
  return <ManToan nhan={phep ? 'Ngày vắng có phép' : 'Bình giữ chuỗi đã đỡ'} onDong={onDong} day={day}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh">
          {phep ? <span ref={p} className="tp-p-to" aria-hidden="true">P</span> : <span ref={binh} className="tp-binh-to"><Binh kieu="dong" /></span>}
          <div ref={bi} className="bi-o"><Bi cam="vui" size={96} /></div>
        </div>
        <h1>{phep ? 'Ngày vắng có phép — chuỗi vẫn giữ' : 'Hôm qua bình giữ chuỗi đã đỡ cho em'}</h1>
        <p className="tp-phu">{phep
          ? <>{ngay ? `Hôm ${ngayNgan(ngay)} em vắng có phép.` : 'Em vắng có phép.'}{chuSo && <> Chuỗi vẫn {chuSo}</>}, không tốn bình.</>
          : <>{chuSo ? <>Chuỗi vẫn {chuSo}. </> : null}Hôm nay học 1 chặng để lửa cháy tiếp nhé.</>}</p>
      </div>
      <div className="cot-b">
        {c && <section className="tp-the" aria-label="Tuần này"><h2>Tuần này</h2><TuanBay lich7={c.lich7} idO={(x) => `tp-o-${x}`} /></section>}
        {c && <section className="tp-the" aria-label="Bình giữ chuỗi">
          <div className="tp-binh-con" id="tp-binh-con"><Binh kieu={c.giuChuoi > 0 ? 'day' : 'trong'} />
            <div className="giua"><b>{phep ? `Vẫn còn ${c.giuChuoi}/${c.sucChua} bình` : `Còn ${c.giuChuoi}/${c.sucChua} bình`}</b>
              <span>{phep ? 'ngày vắng có phép không tốn bình' : c.giuChuoi < c.sucChua ? `thứ Hai được tặng 1 bình · hoặc mua ${GIA_BINH} tinh thể` : 'đã đầy bình'}</span></div></div>
        </section>}
      </div>
    </main>
    {m.toast}
  </ManToan>
}

/** Màn phủ mốc chuỗi (thông báo `moc_chuoi` — C2): huy hiệu lật, pháo hoa lục giác, +tinh thể. */
export function ManMocChuoi({ tb, tq, onDong }: { tb: ThongBao; tq: TongQuanThuong; onDong: () => void }) {
  const moc = typeof tb.duLieu.moc === 'number' ? tb.duLieu.moc : tq.chuoiNgay?.so
  const tt = typeof tb.duLieu.tinhThe === 'number' ? tb.duLieu.tinhThe : MOC_CHUOI.find((x) => x.so === moc)?.tt ?? 0
  const hh = useRef<HTMLDivElement>(null)
  const [dem, setDem] = useState(tq.tinhThe !== undefined ? tq.tinhThe - tt : undefined)
  useHieuUng((h) => {
    phanHoiThuong('chuoi')
    hoatAnh(hh.current, [{ transform: 'perspective(400px) rotateY(-180deg) scale(.5)', opacity: 0 }, { transform: 'perspective(400px) rotateY(20deg) scale(1.1)', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 1 }], 1000)
    for (let i = 0; i < 3; i++) h.sau(250 + i * 300, () => { const r = hh.current?.getBoundingClientRect(); if (r) bungHat([r.left + r.width / 2 + (i - 1) * 60, r.top + 10 - i * 14], { n: 12, r: 60, d: 700 }) })
    if (tt > 0 && tq.tinhThe !== undefined) h.sau(1300, () => void bayToi(document.getElementById('tp-mc-tt'), oTinhThe(), { n: 6 }).then(() => setDem(tq.tinhThe)))
  }, [])
  if (!moc) return null
  return <ManToan nhan={`Mốc chuỗi ${moc} ngày`} onDong={onDong} demTT={dem !== undefined ? <DemTT gt={dem} /> : undefined}
    day={<NutDay chu={tt > 0 ? `Nhận ${tt} tinh thể` : 'Tiếp tục'} sac={tt > 0 ? 'tt' : undefined} onClick={onDong} />}>
    <main className="tp-man" data-hai="">
      <div className="cot-a">
        <div className="tp-hinh"><Tia className="quay" /><div ref={hh} style={{ width: 120, position: 'relative', zIndex: 1 }}><HuyHieuMau mau="lua" chu={moc} coChu={moc >= 100 ? 28 : 34} /></div></div>
        <h1 style={{ color: 'var(--tr-sao-chu)' }}>Chuỗi {moc} ngày!</h1>
        <p className="tp-phu">Em học liền {moc} ngày. Giữ lửa tiếp nhé!</p>
      </div>
      <div className="cot-b">
        {tt > 0 && <section className="tp-the" aria-label="Thưởng mốc chuỗi"><div className="tp-thuong-lon"><span className="tp-o" data-sac="tt" id="tp-mc-tt"><IcTinhThe /></span><div><b>+{tt} tinh thể</b><span>thưởng mốc {moc} ngày</span></div></div></section>}
        {MOC_CHUOI.find((x) => x.so > moc) && <section className="tp-the"><p className="tp-phu">Mốc kế tiếp: {MOC_CHUOI.find((x) => x.so > moc)!.so} ngày.</p></section>}
      </div>
    </main>
  </ManToan>
}

