// BẢNG «LIVE» CỦA THẦY — lối vào Live theo khối (thầy duyệt bản vẽ 12/11; docs/ban-ve-live-moi-1211 ảnh 01, 02; đặc tả docs/dac-ta-live-moi-1211.md mục 2).
// Ba thẻ: «Mở live ngay» · «Hẹn lịch live» · «Xem lại live». Mảnh nạp lười từ nút «Live» ở Hôm nay (NutLive.tsx), vẽ đè lên vùng nội dung Hôm nay
// (khung cha mang [data-blt-mo] ⇒ các khối Hôm nay ẩn). Một lúc chỉ MỘT phòng: đã có phòng chờ / đang live ⇒ chỉ còn «Vào lại phòng».
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { henLichLive, huyLichLive, moLiveKhoi, suaLichLive, taiLichLive, type DsLichLive } from '../../lib/live-khoi/api'
import type { KhoiLive, LichLive } from '../../lib/live-khoi/kieu'
import { chuGio, chuNgayGio, cungNgay, mocTuO, oNgay } from './chu-gio'
import './bang-live-thay.css'

const LichSuLive = lazy(() => import('../../screens/live-xem-lai/gv/LichSuLive'))

type The = 'mo' | 'hen' | 'xem'
type MoPhong = { lich: LichLive; buoiId: string; ma: string }
const DS_KHOI: readonly KhoiLive[] = [10, 11, 12]
const TEN_DAI = 60
/** Buổi hẹn mở phòng chờ được từ 30 phút trước giờ (và cả khi đã quá giờ). */
const MO_SOM_MS = 30 * 60_000
const HUY_CHO_MS = 4000

function OKhoi({ nhan, chon, soEm, khoa, onChon }: { nhan: string; chon: KhoiLive; soEm: DsLichLive['soEm'] | null; khoa?: boolean; onChon: (k: KhoiLive) => void }) {
  return (
    <div className="blt-khoi" role="radiogroup" aria-label={nhan}>
      {DS_KHOI.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={chon === k} disabled={khoa} onClick={() => onChon(k)}>
          <b>Khối {k}</b>
          <span className="gvv2-so">{soEm ? `${soEm[k]} em` : '… em'}</span>
        </button>
      ))}
    </div>
  )
}

/** Biểu tượng vẽ tại chỗ (không kéo thêm biểu tượng vào mảnh biểu tượng dùng chung của app thầy ⇒ đường mở /gv không thêm byte). */
const DUONG_BT = {
  lui: 'M15 6l-6 6 6 6',
  phat: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4',
  lich: 'M7 5h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM4 10h16M9 3v4M15 3v4',
  lai: 'M4 12a8 8 0 1 0 2.6-5.9L4 8.5M4 4v4.5h4.5M12 8v4.5l3 1.8',
} as const
function Bt({ ten, size }: { ten: keyof typeof DUONG_BT; size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={DUONG_BT[ten]} /></svg>
}
export default function BangLiveThay({ onDong, onMoPhong }: { onDong: () => void; onMoPhong: (o: MoPhong) => void }) {
  const goc = useRef<HTMLDivElement>(null)
  const song = useRef(true)
  const [the, setThe] = useState<The>('mo')
  const [ds, setDs] = useState<DsLichLive | null>(null)
  const [loiTai, setLoiTai] = useState('')
  const [nay, setNay] = useState(() => Date.now())
  // Mở live ngay
  const [khoi, setKhoi] = useState<KhoiLive>(12)
  const [dangMo, setDangMo] = useState('') // '' = rảnh · 'ngay' · id buổi đang mở
  const [loiMo, setLoiMo] = useState('')
  // Hẹn lịch
  const [ngay, setNgay] = useState(() => oNgay(new Date()))
  const [gio, setGio] = useState('19:30')
  const [ten, setTen] = useState('')
  const [khoiHen, setKhoiHen] = useState<KhoiLive>(12)
  const [suaId, setSuaId] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState('')
  const [choHuy, setChoHuy] = useState('') // id buổi đã chạm «Huỷ» lần một
  const [dangHuy, setDangHuy] = useState('')
  const [loiDs, setLoiDs] = useState('')
  const dangGoi = useRef(false) // chặn bấm lặp trước khi React kịp khoá nút

  useEffect(() => { song.current = true; return () => { song.current = false } }, [])
  // Khung cha ẩn các khối Hôm nay suốt lúc bảng mở (kể cả khi đang hiện «Xem lại live»).
  useLayoutEffect(() => {
    const cha = goc.current?.parentElement
    if (!cha) return
    cha.setAttribute('data-blt-mo', '')
    try { cha.scrollIntoView?.({ block: 'start' }) } catch { /* trình duyệt cũ */ }
    return () => { cha.removeAttribute('data-blt-mo') }
  }, [])

  const tai = useCallback(async () => {
    const r = await taiLichLive()
    if (!song.current) return
    if (r.ok) { setDs(r.du); setLoiTai('') } else setLoiTai(r.chu)
  }, [])
  useEffect(() => {
    let con = true
    void taiLichLive().then((r) => { if (!con) return; if (r.ok) setDs(r.du); else setLoiTai(r.chu) })
    return () => { con = false }
  }, [])
  // Đồng hồ 30 giây: nút «Mở phòng chờ» của buổi hẹn tự hiện khi còn ≤ 30 phút, nhãn «Hôm nay» đổi đúng lúc qua ngày.
  useEffect(() => { const h = window.setInterval(() => setNay(Date.now()), 30_000); return () => clearInterval(h) }, [])
  useEffect(() => {
    if (!choHuy) return
    const h = window.setTimeout(() => setChoHuy(''), HUY_CHO_MS)
    return () => clearTimeout(h)
  }, [choHuy])

  const phong = ds?.lich.find((l) => l.trangThai === 'cho' || l.trangThai === 'dang') ?? null
  const dsHen = (ds?.lich ?? []).filter((l) => l.trangThai === 'hen').sort((a, b) => a.batDau - b.batDau)

  const mo = async (o: { khoi: KhoiLive; id?: string }, dau: string) => {
    if (dangGoi.current) return
    dangGoi.current = true; setDangMo(dau); setLoiMo('')
    const r = await moLiveKhoi(o)
    dangGoi.current = false
    if (!song.current) return
    setDangMo('')
    if (!r.ok) { setLoiMo(r.chu); return }
    onMoPhong(r.du)
    void tai()
  }

  const boSua = () => { setSuaId(''); setTen(''); setLoiLuu('') }
  const luu = async () => {
    if (dangGoi.current) return
    const batDau = mocTuO(ngay, gio)
    if (batDau === null) { setLoiLuu('Thầy chọn đủ ngày và giờ.'); return }
    if (batDau <= Date.now()) { setLoiLuu('Giờ hẹn phải ở sau bây giờ'); return }
    const o = { khoi: khoiHen, batDau, ten: ten.trim().slice(0, TEN_DAI) }
    dangGoi.current = true; setDangLuu(true); setLoiLuu('')
    const r = suaId ? await suaLichLive(suaId, o) : await henLichLive(o)
    dangGoi.current = false
    if (!song.current) return
    setDangLuu(false)
    if (!r.ok) { setLoiLuu(r.chu); return }
    setDs(r.du); setSuaId(''); setTen('')
  }
  const sua = (l: LichLive) => {
    const d = new Date(l.batDau)
    setSuaId(l.id); setNgay(oNgay(d)); setGio(chuGio(d)); setTen(l.ten); setKhoiHen(l.khoi); setLoiLuu(''); setChoHuy('')
  }
  const huy = async (l: LichLive) => {
    if (choHuy !== l.id) { setChoHuy(l.id); setLoiDs(''); return }
    if (dangGoi.current) return
    dangGoi.current = true; setDangHuy(l.id); setChoHuy('')
    const r = await huyLichLive(l.id)
    dangGoi.current = false
    if (!song.current) return
    setDangHuy('')
    if (!r.ok) { setLoiDs(r.chu); return }
    setDs(r.du)
    if (suaId === l.id) boSua()
  }

  const theChon = (ma: The, tieuDe: string, moTa: string, bieu: ReactNode) => (
    <button type="button" className="gvv2-the blt-the" data-the={ma} aria-pressed={the === ma} onClick={() => setThe(ma)}>
      <span className="blt-bieu" aria-hidden="true">{bieu}</span>
      <b>{tieuDe}</b>
      <span>{moTa}</span>
    </button>
  )

  return (
    <>
      <div ref={goc} className="blt" data-the={the}>
        {the !== 'xem' && (
          <>
            <button type="button" className="blt-lui" onClick={onDong}><Bt ten="lui" size={18} />Hôm nay</button>
            <header className="blt-dau">
              <h1 className="gvv2-h1">Live</h1>
              <p>Dạy trực tuyến cho cả khối. Bảng và đề vẽ lại bằng mã trên máy em nên nét, không trễ như quay màn hình.</p>
            </header>
            <div className="blt-ba">
              {theChon('mo', 'Mở live ngay', 'Mở phòng chờ ngay bây giờ. Em trong khối thấy nút Live sáng lên.', <Bt ten="phat" size={22} />)}
              {theChon('hen', 'Hẹn lịch live', 'Chọn ngày giờ. Em thấy lịch và giờ đếm ngược trên thẻ Live.', <Bt ten="lich" size={22} />)}
              {theChon('xem', 'Xem lại live', 'Các buổi đã lưu. Mở lại bảng, tiếng và đoạn theo câu.', <Bt ten="lai" size={22} />)}
            </div>
            {loiTai && <p className="blt-loi" role="alert">{loiTai} <button type="button" className="blt-lien" onClick={() => { void tai() }}>Thử lại</button></p>}
          </>
        )}

        {the === 'mo' && (
          <section className="blt-khu" aria-label="Mở live ngay">
            {phong ? (
              <div className="gvv2-the blt-phong" role="status">
                <span className="blt-cham" aria-hidden="true" />
                <div className="blt-phong-chu">
                  <b>Đang có phòng Khối {phong.khoi}</b>
                  <span>{phong.trangThai === 'dang' ? 'Thầy đang live.' : 'Phòng chờ đang mở.'}{phong.ten ? ` ${phong.ten}.` : ''} Một lúc chỉ mở một phòng.</span>
                </div>
                <button type="button" className="blt-chinh" disabled={!!dangMo} onClick={() => { void mo({ khoi: phong.khoi, id: phong.id }, phong.id) }}>{dangMo ? 'Đang mở…' : 'Vào lại phòng'}</button>
              </div>
            ) : (
              <>
                <h2>Mở cho khối nào?</h2>
                <OKhoi nhan="Mở cho khối nào?" chon={khoi} soEm={ds?.soEm ?? null} khoa={!!dangMo} onChon={setKhoi} />
                <div className="blt-hanh">
                  <button type="button" className="blt-chinh" disabled={!!dangMo} onClick={() => { void mo({ khoi }, 'ngay') }}><Bt ten="phat" size={18} />{dangMo ? 'Đang mở…' : `Mở phòng chờ Khối ${khoi}`}</button>
                  <p>{ds ? `${ds.soEm[khoi]} em Khối ${khoi}` : `Các em Khối ${khoi}`} sẽ thấy nút Live sáng và bấm «Tham gia» được. Khối khác không thấy.</p>
                </div>
              </>
            )}
            {loiMo && <p className="blt-loi" role="alert">{loiMo}</p>}
          </section>
        )}

        {the === 'hen' && (
          <div className="blt-hen">
            <section className="blt-khu" aria-label={suaId ? 'Sửa buổi đã hẹn' : 'Hẹn buổi mới'}>
              <h2>{suaId ? 'Sửa buổi đã hẹn' : 'Hẹn buổi mới'}</h2>
              <div className="blt-hang-o">
                <label className="blt-o"><span>Ngày</span><input type="date" value={ngay} min={oNgay(new Date(nay))} onChange={(e) => { setNgay(e.target.value); setLoiLuu('') }} /></label>
                <label className="blt-o"><span>Giờ bắt đầu</span><input type="time" value={gio} onChange={(e) => { setGio(e.target.value); setLoiLuu('') }} /></label>
              </div>
              <label className="blt-o"><span>Tên buổi (không bắt buộc)</span><input type="text" value={ten} maxLength={TEN_DAI} placeholder="Ví dụ: Chữa đề Ester – Lipid" onChange={(e) => setTen(e.target.value.slice(0, TEN_DAI))} /></label>
              <div className="blt-o"><span>Khối</span><OKhoi nhan="Khối" chon={khoiHen} soEm={ds?.soEm ?? null} khoa={dangLuu} onChon={setKhoiHen} /></div>
              <div className="blt-hanh">
                <button type="button" className="blt-chinh" disabled={dangLuu} onClick={() => { void luu() }}>{dangLuu ? 'Đang lưu…' : suaId ? 'Lưu thay đổi' : 'Lưu lịch'}</button>
                {suaId && <button type="button" className="gvv2-nut-vien" disabled={dangLuu} onClick={boSua}>Thôi</button>}
                <p>Trước giờ 10 phút nút Live của em Khối {khoiHen} tự sáng, em vào phòng chờ được.</p>
              </div>
              {loiLuu && <p className="blt-loi" role="alert">{loiLuu}</p>}
            </section>
            <section className="blt-khu" aria-label="Lịch đã hẹn">
              <h2>Lịch đã hẹn</h2>
              {ds === null ? (loiTai ? null : <p className="blt-mo" role="status">Đang tải…</p>) : dsHen.length === 0 ? <p className="gvv2-the blt-rong">Chưa hẹn buổi nào</p> : (
                <ul className="gvv2-the blt-ds">
                  {dsHen.map((l) => (
                    <li key={l.id} data-sua={suaId === l.id ? '' : undefined}>
                      <div className="blt-ds-chu">
                        <b className="gvv2-so">{chuNgayGio(l.batDau)}</b>
                        <span>Khối {l.khoi}{l.ten ? ` · ${l.ten}` : ''}</span>
                      </div>
                      {cungNgay(l.batDau, nay) && <span className="blt-nhan">Hôm nay</span>}
                      <div className="blt-ds-nut">
                        {l.batDau - nay <= MO_SOM_MS && !phong && <button type="button" className="blt-nho chinh" disabled={!!dangMo} onClick={() => { void mo({ khoi: l.khoi, id: l.id }, l.id) }}>{dangMo === l.id ? 'Đang mở…' : 'Mở phòng chờ'}</button>}
                        <button type="button" className="blt-nho" aria-label={`Sửa buổi ${chuNgayGio(l.batDau)}`} onClick={() => sua(l)}>Sửa</button>
                        <button type="button" className="blt-nho huy" data-cho={choHuy === l.id ? '' : undefined} disabled={dangHuy === l.id} aria-label={choHuy === l.id ? `Chạm lần nữa để huỷ buổi ${chuNgayGio(l.batDau)}` : `Huỷ buổi ${chuNgayGio(l.batDau)}`} onClick={() => { void huy(l) }}>{dangHuy === l.id ? 'Đang huỷ…' : choHuy === l.id ? 'Chạm lần nữa để huỷ' : 'Huỷ'}</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {(loiDs || (loiMo && dsHen.length > 0)) && <p className="blt-loi" role="alert">{loiDs || loiMo}</p>}
            </section>
          </div>
        )}
      </div>
      {the === 'xem' && <Suspense fallback={null}><LichSuLive onDong={() => setThe('mo')} /></Suspense>}
    </>
  )
}
